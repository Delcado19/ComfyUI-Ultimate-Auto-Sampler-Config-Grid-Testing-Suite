# Dashboard and Manifest Reliability Handoff

## Guided Config Builder (2026-10-26)

- Latest user feedback rejected the combined Compare screen. Current layout is five tasks: Models & LoRAs, Prompts, Sampling, Seeds, Review & run. Sampling uses checkbox lists, ordinary numeric/size fields and explicit all/per-setup scope. Seed controls have a separate page.
- Current automated results: 154 Python tests, 14 JavaScript tests. After the approval-service limit was lifted, final five-view browser checks passed at 1440/768/390 pixels: range/random append, manual values, exact uint64, strength precision, invalid separators, advanced mode and stale-backend detection. Sampling and Seeds screenshots were inspected. No GPU jobs were run.
- The two-setup/shared-seed workflow is now installed over the requested copy on G:. Its old hash matched before.sha256 before replacement; the installed hash matches the staged ready-to-open file. The original source workflow is unchanged. Do not rerun the preparation script against the now-migrated copy.
- Final isolated ComfyUI 0.42.1 / frontend 1.55.18 integration passed: embedded node, 72-image preview, wiring run gating, queue callback [0,1], and exact uint64 seed save/load. No generation submitted. The regular user server still needs restarting for the backend changes, followed by browser refresh.

- Follow-up: shared seed CSV now has Start/End/Increment generation, random-count generation, manual editing and S0...Sn labels. Each LoRA's strength list has the same append-only range/manual editor.
- Numeric CSV rejects empty comma slots, normalizes whitespace/duplicates and validates at preview/execution boundaries. Seed values remain exact uint64 decimal strings in saved frontend state; generated strength increments are not rounded to two decimals.
- Non-empty `state.seed_values` applies every listed fixed seed to every comparison group; absent/empty preserves legacy per-group seed policies. Preview echoes canonical shared seeds to detect a server that needs restarting.
- The user's Screen-L workflow copy is prepared as two settings groups plus a shared three-seed list. Exact expanded-job equivalence with its previous six groups is checked before installation; the original source workflow stays untouched.

- Default UI follows the five freely accessible views above. Full advanced editing remains available.
- Reuses the existing `lora_config` state and Python preview transformer; opening guided setup does not rewrite old recipes. Complex prompts and separate CLIP strengths remain in the expert controls.
- Connected loader names, per-comparison selection, a persistent planned base-image count, wiring checks, and normal ComfyUI queuing replace the icon-only navigation and always-visible JSON on the default path.
- Count is conservative for folder/wildcard/video/advanced sampling jobs; latent batch sizes, upscaling and resume skips are explicitly outside the displayed base count.
- JavaScript regression command: `node --test tests/test_guided_builder.mjs`. CI runs this alongside existing checks.
- Current validation and design/motion decisions are recorded in `BUILDER_UX.md`.

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
- Official checkout/setup actions were updated after the first hosted run
  reported their deprecated Node 20 runtime. Application syntax checks continue
  to use Node 22; the action runner runtime is configured by those actions.
- A live SDXL generation/dashboard smoke test passed on ComfyUI 0.38.0 and
  RTX 5080, including annotation resets and session reuse after restart.
  See `RUNTIME_TEST_STATUS.md` for evidence, the UTF-8 report fix and limits.
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
- The root MIT `LICENSE` was added at the user's explicit request, matching the
  existing README declaration and package metadata. Copyright credits Jason Hoku
  and contributors; distribution must preserve copyright and license notices.
- Publication scope: source fixes, regression tests, CI, documentation and the
  current labeled Graphify artifacts. Temporary tools, caches and graph backups
  are ignored. No release, installation change or third-party message is included.
