"""Regression tests for concurrent session saves and reversible user actions."""
import copy
import json
import threading
from concurrent.futures import ThreadPoolExecutor

import pytest
import manifest_utils as manifests


def write(path, data):
    path.write_text(json.dumps(data), encoding="utf-8")


def test_generation_preserves_cleared_actions_and_new_disk_items(tmp_path):
    path = tmp_path / "manifest.json"
    write(path, {"items": [{"id": 0, "favorited": False, "rejected": False, "note": ""},
                           {"id": 2, "note": "another writer"}]})
    memory = {"items": [{"id": 1}, {"id": 0, "favorited": True,
                                    "rejected": True, "note": "old"}]}
    manifests.save_manifest(path, memory)
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert [item["id"] for item in saved["items"]] == [1, 0, 2]
    assert saved["items"][1] == {"id": 0, "favorited": False, "rejected": False, "note": ""}


def test_missing_user_fields_do_not_clear_memory_values(tmp_path):
    path = tmp_path / "manifest.json"
    write(path, {"items": [{"id": 1}]})
    memory = {"items": [{"id": 1, "note": "keep"}]}
    manifests.save_manifest(path, memory)
    assert memory["items"][0]["note"] == "keep"


def test_atomic_replace_failure_keeps_original_and_cleans_temp(tmp_path, monkeypatch):
    path = tmp_path / "manifest.json"
    original = {"items": [{"id": 1}]}
    write(path, original)

    def fail(*args):
        raise OSError("replace failed")

    monkeypatch.setattr(manifests.os, "replace", fail)
    with pytest.raises(OSError, match="replace failed"):
        manifests.save_manifest(path, {"items": [{"id": 2}]})
    assert json.loads(path.read_text()) == original
    assert list(tmp_path.glob(".manifest-*.tmp")) == []


def test_serialization_failure_keeps_original(tmp_path):
    path = tmp_path / "manifest.json"
    write(path, {"items": []})
    with pytest.raises(TypeError):
        manifests.save_manifest(path, {"items": [{"id": 1, "bad": object()}]})
    assert json.loads(path.read_text()) == {"items": []}
    assert list(tmp_path.glob(".manifest-*.tmp")) == []


def test_corrupt_manifest_is_not_overwritten(tmp_path):
    path = tmp_path / "manifest.json"
    path.write_text("{broken")
    with pytest.raises(json.JSONDecodeError):
        manifests.save_manifest(path, {"items": []})
    assert path.read_text() == "{broken"


def test_transaction_exception_does_not_commit(tmp_path):
    path = tmp_path / "manifest.json"
    write(path, {"items": []})
    with pytest.raises(RuntimeError):
        with manifests.manifest_transaction(path) as data:
            data["items"].append({"id": 1})
            raise RuntimeError("abort")
    assert json.loads(path.read_text()) == {"items": []}


def test_transaction_requires_existing_file_unless_initialized(tmp_path):
    path = tmp_path / "new" / "manifest.json"
    with pytest.raises(FileNotFoundError):
        with manifests.manifest_transaction(path):
            pass
    with manifests.manifest_transaction(path, initial_data={"items": []}) as data:
        data["items"].append({"id": 1})
    assert json.loads(path.read_text())["items"] == [{"id": 1}]


def test_stale_parallel_writers_preserve_all_results(tmp_path):
    path = tmp_path / "manifest.json"
    write(path, {"items": []})
    barrier = threading.Barrier(8)

    def save(index):
        snapshot = {"items": [{"id": index}]}
        barrier.wait(timeout=5)
        manifests.save_manifest(path, snapshot)

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(save, range(8)))
    assert {item["id"] for item in json.loads(path.read_text())["items"]} == set(range(8))


def test_api_transaction_blocks_background_save_until_commit(tmp_path):
    path = tmp_path / "manifest.json"
    original = {"items": [{"id": 1, "note": "old"}]}
    write(path, original)
    started = threading.Event()

    def background_save():
        started.set()
        manifests.save_manifest(path, copy.deepcopy(original))

    with ThreadPoolExecutor(max_workers=1) as pool:
        with manifests.manifest_transaction(path) as data:
            future = pool.submit(background_save)
            assert started.wait(timeout=5)
            assert not future.done()
            data["items"][0]["note"] = "new"
        future.result(timeout=5)
    assert json.loads(path.read_text())["items"][0]["note"] == "new"
