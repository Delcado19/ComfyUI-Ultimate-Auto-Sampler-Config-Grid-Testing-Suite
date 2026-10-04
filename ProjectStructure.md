# Project Structure

Current repository inventory. Older versions implemented network services and
distribution workers here; the current checkout delegates them to companion
plugins. See `CONTRIBUTING.md` for editing rules.

## Backend modules

| File | Responsibility |
|---|---|
| `__init__.py` | Node registration and config/session API |
| `config_builder_node.py` | Shared Builder transformer, discovery and preview API |
| `sampler_node.py` | Generator inputs and run-settings bridge |
| `dashboard_node.py` | Dashboard viewer node |
| `json_text_node.py` | Smart JSON text node |
| `generation_orchestrator.py` | Generation loop, resume, scheduling, progress and upscales |
| `config_utils.py` | Parsing, Cartesian expansion, job preparation and validation |
| `image_generation.py` | Sampling, VAE decode, batch persistence and upscale helpers |
| `ltx_video_generation.py` | LTX integration, sigma parsing and video generation |
| `florence2_hires.py` | Florence2 checks, segmentation, crop, upscale and paste-back |
| `model_loader.py` | Checkpoint, diffusion, CLIP, VAE and LoRA loading |
| `model_cache.py` | Model/LoRA caching and async preload |
| `conditioning_cache.py` | Conditioning cache storage and lookup |
| `batch_encoding.py` | Batch prompt/CLIP encoding |
| `lora_utils.py` | LoRA lookup and expansion |
| `manifest_utils.py` | Shared writer lock, merging and atomic transactions |
| `html_generator.py` | Dashboard assembly and safe embedding |
| `upscale_runner.py` | Background upscale jobs, cancellation and status |
| `metadata_packer.py` | Image metadata and workflow export |
| `directory_scanner.py` | External image metadata scan |
| `distribution.py` | Optional Distributed companion facade |
| `civitai.py` | Optional CivitAI companion facade |
| `remote_vae.py` | Optional RemoteVAE companion facade and worker bridge |
| `trigger_words.py` | LoRA trigger handling and optional metadata lookup |

## Frontend

- `web/dashboard.js`: viewer registration, iframe rendering and incremental updates.
- `web/smart_json_text.js`: JSON node widget.
- `web/conf_builder/`: Builder registration, UI, config management and distribution controls.
- `resources/template.html` and `report.css`: dashboard shell and styling.
- `resources/logic_*.js`: state, rendering, virtualization, filtering, events and upscale modal.
- `js/`: additional checked-in browser scripts, when present.

## Data flow and contracts

Builder `node.state` -> `lora_config` JSON widget -> Python `state_to_configs_json`
-> generator -> config expansion -> jobs -> model/conditioning caches ->
image/video generation -> files/manifest -> dashboard HTML -> ComfyUI iframe.

Preview and execution use the same Python transformer. Run and distribution
settings travel beside the config list. New Builder fields require default
backfills for saved workflows.

Sessions live in `output/benchmarks/{session}/`, with `manifest.json` and `images/`.
User fields are `favorited`, `rejected`, `note`; legacy scanned data may use `notes`.
`save_manifest` merges disk annotations and other writers' new results before
saving a generation snapshot. `manifest_transaction` locks complete API updates.
All canonical manifest writers share a process-local lock and atomically replace
complete files. Preserve explicit false/empty annotations. Invalid JSON raises.
Do not nest helpers or hold transactions across `await`.

HTML JSON escapes `<`; node IDs are JS literals; titles are attribute-escaped.
JSON markers stay compatible with the incremental parser. Substitute tokens
once. Dashboard resources require HTML regeneration, not just browser refresh.

## API inventory

Routes registered by this plugin (companion plugins own their own routes):

| Method | Route | Handler / module |
|---|---|---|
| GET | `/configbuilder/list_configs` | `list_configs` / `__init__.py` |
| POST | `/configbuilder/save_config` | `save_config` / `__init__.py` |
| GET | `/configbuilder/custom_resolutions` | `get_custom_resolutions` / `__init__.py` |
| POST | `/configbuilder/custom_resolutions` | `save_custom_resolutions` / `__init__.py` |
| GET | `/configbuilder/upscale_presets` | `get_upscale_presets` / `__init__.py` |
| POST | `/configbuilder/upscale_presets` | `save_upscale_presets` / `__init__.py` |
| GET | `/configbuilder/config_section_presets` | `get_config_section_presets` / `__init__.py` |
| POST | `/configbuilder/config_section_presets` | `save_config_section_presets` / `__init__.py` |
| GET | `/configbuilder/section_presets` | `get_section_presets` / `__init__.py` |
| POST | `/configbuilder/section_presets` | `save_section_presets` / `__init__.py` |
| POST | `/configbuilder/load_config` | `load_config` / `__init__.py` |
| POST | `/config_tester/delete_session` | `delete_session` / `__init__.py` |
| GET | `/config_tester/list_sessions` | `list_sessions` / `__init__.py` |
| POST | `/config_tester/save_changes` | `save_changes` / `__init__.py` |
| POST | `/config_tester/save_manifest` | `save_manifest` / `__init__.py` |
| POST | `/config_tester/get_session_html` | `get_session_html` / `__init__.py` |
| POST | `/config_tester/export_favorites` | `export_favorites` / `__init__.py` |
| POST | `/config_tester/delete_non_favorites` | `delete_non_favorites` / `__init__.py` |
| POST | `/config_tester/delete_rejected` | `delete_rejected` / `__init__.py` |
| POST | `/config_tester/scan_directory` | `scan_directory_route` / `__init__.py` |
| POST | `/config_tester/upscale_images` | `upscale_images` / `__init__.py` |
| GET | `/config_tester/upscale_status` | `upscale_status` / `__init__.py` |
| POST | `/config_tester/cancel_upscale` | `cancel_upscale` / `__init__.py` |
| POST | `/configbuilder/lookup_triggers` | `lookup_triggers_endpoint` / `config_builder_node.py` |
| POST | `/configbuilder/lookup_lora_metadata` | `lookup_lora_metadata_endpoint` / `config_builder_node.py` |
| POST | `/configbuilder/lookup_model_metadata` | `lookup_model_metadata_endpoint` / `config_builder_node.py` |
| GET | `/configbuilder/model_counts` | `get_model_counts_endpoint` / `config_builder_node.py` |
| GET | `/configbuilder/model_lists` | `get_model_lists_endpoint` / `config_builder_node.py` |
| POST | `/configbuilder/refresh_models` | `refresh_models_endpoint` / `config_builder_node.py` |
| GET | `/configbuilder/get_lora_triggers` | `get_lora_triggers_endpoint` / `config_builder_node.py` |
| POST | `/configbuilder/save_lora_triggers` | `save_lora_triggers_endpoint` / `config_builder_node.py` |
| POST | `/configbuilder/preview` | `preview_endpoint` / `config_builder_node.py` |

## Tests and release checks

`tests/` covers config emission/expansion, cache keys, sigma parsing, Florence2,
companion facades, HTML embedding and concurrent/atomic storage. The two
`conftest.py` files stub ComfyUI integration; real CPU PyTorch is required for
tensor tests. Storage and HTML helpers remain real.

`.github/workflows/tests.yml` checks Python tests and JS syntax on Linux and
Windows. Registry publishing depends on it. See `CONTRIBUTING.md` for commands.
Live ComfyUI/browser/GPU tests remain necessary for runtime changes.

## Known limitations

Synchronization is process-local; independent ComfyUI processes must not write
the same session files. Cleanup during active generation is not a transactional
job cancellation: a retained generation snapshot may reintroduce deleted entries.
The package references the root [MIT LICENSE](LICENSE), consistent with the
README and package metadata. Preserve copyright and license notices on redistribution.
