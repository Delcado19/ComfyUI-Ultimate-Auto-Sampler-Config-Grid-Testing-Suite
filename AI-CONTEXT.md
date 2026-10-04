# AI Development Context

Read `CONTRIBUTING.md` for contributor rules and `ProjectStructure.md` for the
current module and API inventory. These files describe the current checkout.

## Purpose and layers

The suite builds Cartesian parameter grids, generates images or LTX videos,
and displays results in a virtualized dashboard. It supports model/LoRA sweeps,
cached conditioning, upscaling, and optional companion plugins.

1. Python backend: nodes, API, generation, persistence, and caches.
2. `web/`: ComfyUI node widgets and the browser bridge.
3. `resources/`: dashboard scripts, CSS, and HTML inlined into an iframe.

## Configuration contract

The Builder serializes full state into the `lora_config` STRING widget.
`UltimateConfigBuilder.state_to_configs_json` in `config_builder_node.py` is the
single transformer used by `generate_config` and `POST /configbuilder/preview`.
There is no separate JavaScript transformer to maintain.

Output: `{configs: [...], _distribution: {...}, _session_settings: {...}}`.
`sampler_node.py` unwraps it and delegates to `generation_orchestrator.py`.
`config_utils.py` expands the configuration into concrete jobs.

For new fields, add the default and saved-workflow backfill in
`conf-builder-main.js`, read/write `node.state` in the Builder UI, emit it in
Python `state_to_configs_json`, add a regression test, and consume it in the
relevant backend. The preview automatically uses the shared transformer.

## Generation and optional services

The orchestrator coordinates loading, conditioning, sampling, VAE decode,
persistence, progress, and deferred upscales. `model_cache.py` and
`conditioning_cache.py` own model and conditioning caches.

`distribution.py`, `civitai.py`, and `remote_vae.py` are facades for optional
companion plugins. Network implementation and distributed worker/route modules
are outside this repository. Respect each facade's availability/fallback
contract. Do not duplicate network code or install packages at node runtime.

Keep `torch.inference_mode()` on out-of-graph inference paths. Preserve node
keys, public config contracts, fallback behavior, and saved-workflow migrations.

## Persistence contract

Sessions: `output/benchmarks/{session}/manifest.json` and `images/`.
Items use `id`, `file`, `favorited`, `rejected`, and `note`. The `file` field is a
ComfyUI `/view?...` URL, not a bare filesystem path. Legacy scanned data may use
`notes`; retain compatibility when importing it.

Generation/upscale snapshots use `manifest_utils.save_manifest`. API changes
use `manifest_transaction` to lock the entire read/modify/write operation.
Both atomically replace complete UTF-8 JSON files. Explicit `False` and empty
notes overwrite stale annotations. Other writers' new results are retained.
Damaged existing JSON raises instead of being silently overwritten.

The lock is process-local: independent ComfyUI processes must not share session
files. Do not nest storage helpers or hold their lock across `await`.
Filesystem endpoints sanitize input and check containment with `_is_path_within`.

## Dashboard contract

`html_generator.py` combines the template, CSS, and scripts in its declared
load order. Escape JSON/node IDs for JavaScript and titles for HTML attributes.
Keep the JSON markers compatible with `web/dashboard.js` incremental updates.
Substitute tokens once so user text containing template tokens remains literal.

Dashboard resource changes need HTML regeneration (run the sampler or call
`POST /config_tester/get_session_html`); browser refresh alone is insufficient.
`web/` changes need browser refresh. Python changes need a ComfyUI restart.

## Validation

See `CONTRIBUTING.md` for standalone dependencies and commands. Tests stub
ComfyUI integration but use real CPU PyTorch for tensor behavior. Windows/Linux
CI checks Python tests and JS syntax; publishing depends on these checks.
Passing unit tests does not prove live ComfyUI, GPU, or browser behavior.
