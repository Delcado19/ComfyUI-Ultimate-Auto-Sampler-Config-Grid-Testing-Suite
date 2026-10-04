# Dashboard and Manifest Reliability Handoff

## Dashboard and manifest reliability

Implemented after the local architecture review:

- Dashboard JSON escapes `<`, titles use HTML attribute escaping, and node IDs
  are JSON string literals. One-pass template substitution preserves user text
  containing placeholder names and the incremental-update JSON markers.
- Manifest generation saves and API read/modify/write operations share a lock
  and atomic same-directory replacement. Explicit false/empty annotations and
  other background writers' new results survive stale generation snapshots.
- Dashboard edits, legacy full saves, cleanup and scans use transactions;
  VAE batch persistence uses the shared save helper instead of direct writes.
- Corrupt existing manifests and failed writes are not silently overwritten.
- Real HTML/storage helpers replace their test stubs. New regressions cover
  injection, reversed actions, concurrent writes, atomic failures and API saves.
- Windows/Linux standalone tests and JS checks gate registry publication.
- Architecture docs now describe the Python config transformer and companion
  facades rather than removed network/distribution modules.

## Validation

- Full suite: 134 passed using the existing ComfyUI Python 3.12/PyTorch and
  temporary pytest packages from a workspace-local uv cache.
- Python AST syntax: 45 source/test files passed.
- JavaScript syntax: all 16 checked-in JS files passed.
- `git diff --check` passed.
- Both workflows passed actionlint 1.7.12 validation before publication.
- The test workflow supports push, pull request, manual dispatch and reusable
  calls, with independent Windows/Linux jobs and a 20-minute job timeout.
- Hosted results are available under the repository's Actions tab; registry
  publishing requires the reusable test workflow to succeed.
- Live ComfyUI/browser/GPU verification has not been performed.
- Graphify was rebuilt (1,509 nodes, 2,875 edges, 81 communities). After renewed
  user approval, Gemini labeling completed for all 81 communities, with no
  placeholder labels. Configured batch size: 1,000; concurrency: 1; SDK retries: 0.
  The CLI re-executed itself to set PYTHONHASHSEED, bypassing the parent process's
  in-memory request counter/split guard; the exact HTTP request count was not
  independently recorded. Do not repeat the completed labeling run. Future
  guarded runs must set PYTHONHASHSEED=0 before starting the Python process.

Tests in a normal development environment:

```sh
python -m pip install pytest numpy pillow
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pytest tests/ -q
python -m compileall -q -l . tests
```

## Remaining boundaries

- Manifest locking is process-local; independent ComfyUI processes must not
  share session files.
- Cleanup during generation is not job cancellation and does not invalidate
  the generator's retained item list. This pre-existing behavior is documented.
- The referenced LICENSE file remains absent. Do not invent copyright terms;
  obtain maintainer confirmation before creating the legal document.
- Publication scope: source fixes, regression tests, CI, documentation and the
  current labeled Graphify artifacts. Temporary tools, caches and graph backups
  are ignored. No release, installation change or third-party message is included.
