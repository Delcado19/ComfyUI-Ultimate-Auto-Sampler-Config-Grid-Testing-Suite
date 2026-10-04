"""Verify API saves use current server data rather than stale dashboard copies."""
import asyncio
import json
import sys
from types import SimpleNamespace

import pytest


@pytest.fixture
def api(tmp_path, monkeypatch):
    # Package setup loads real routes but stubs the surrounding ComfyUI server.
    module = sys.modules["comfyui_uscg_main"]
    monkeypatch.setattr(module.folder_paths, "get_output_directory", lambda: str(tmp_path))
    monkeypatch.setattr(module.web, "Response",
                        lambda status=200, text="": SimpleNamespace(status=status, text=text))
    path = tmp_path / "benchmarks" / "session" / "manifest.json"
    path.parent.mkdir(parents=True)
    return module, path


def call(handler, payload):
    class Request:
        async def json(self):
            return payload
    return asyncio.run(handler(Request()))


def test_partial_save_preserves_new_results_and_clears_actions(api):
    module, path = api
    original = {"meta": {"model": "server"}, "items": [
        {"id": 2, "file": "new.webp"},
        {"id": 1, "favorited": True, "rejected": True, "note": "old", "file": "old.webp"}]}
    path.write_text(json.dumps(original))
    result = call(module.save_changes, {"session_name": "session", "changed_items": [
        {"id": 1, "favorited": False, "rejected": False, "note": ""}]})
    assert result.status == 200
    saved = json.loads(path.read_text())
    assert saved["meta"] == original["meta"]
    assert saved["items"][0] == original["items"][0]
    assert saved["items"][1] == {"id": 1, "favorited": False, "rejected": False,
                                 "note": "", "file": "old.webp"}


def test_legacy_save_preserves_server_metadata_and_missing_user_fields(api):
    module, path = api
    original = {"session_name": "session", "meta": {"model": "server"}, "items": [
        {"id": 2}, {"id": 1, "favorited": True, "note": "keep", "model": "server"}]}
    path.write_text(json.dumps(original))
    result = call(module.save_manifest, {"session_name": "session", "manifest": {
        "meta": {"model": "stale"}, "items": [{"id": 1, "favorited": False, "model": "stale"}]}})
    assert result.status == 200
    saved = json.loads(path.read_text())
    assert saved["meta"] == original["meta"]
    assert saved["items"] == [{"id": 2}, {"id": 1, "favorited": False,
                                           "note": "keep", "model": "server"}]


def test_legacy_save_initializes_a_missing_manifest(api):
    module, path = api
    data = {"session_name": "session", "items": [{"id": 1, "note": "Grüße"}]}
    result = call(module.save_manifest, {"session_name": "session", "manifest": data})
    assert result.status == 200
    assert json.loads(path.read_text()) == data


def test_corrupt_manifest_returns_error_without_destroying_data(api):
    module, path = api
    path.write_text("{damaged")
    result = call(module.save_manifest, {"session_name": "session", "manifest": {"items": []}})
    assert result.status == 500
    assert path.read_text() == "{damaged"
