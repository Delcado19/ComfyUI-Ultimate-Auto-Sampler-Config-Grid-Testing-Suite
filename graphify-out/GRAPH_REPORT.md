# Graph Report - ComfyUI-Ultimate-Auto-Sampler-Config-Grid-Testing-Suite  (2026-10-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1509 nodes · 2875 edges · 81 communities (70 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 130 edges (avg confidence: 0.92)
- Token cost: 6,842 input · 917 output

## Graph Freshness
- Built from commit: `78c9bcab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Model Cache Management
- UI Logic Filters
- Grid Canvas Rendering
- HTML Dashboard Generation
- Distributed Generation Pipeline
- LTX Video Generation
- Batch CLIP Encoding
- Config Builder Utilities
- Config Builder API
- Development Roadmap
- Distributed Manager Facade
- UI Layout Components
- UI Builder Elements
- Conditioning Cache System
- Image Mask Operations
- Frontend State Management
- Prompt and LoRA Expansion
- LoRA Trigger Management
- Session Persistence API
- Pipeline Filtering Logic
- Manifest File Utilities
- Image Resizing Math
- Config Builder Features
- Upscale Modal Logic
- LTX Model Caching
- UI Component Management
- Model Inventory API
- Config State Tests
- AI Development Context
- Mask Selection Logic
- Deferred Upscaling Pipeline
- Trigger Word UI
- Image Metadata Packing
- LTX Validation Utilities
- Project Documentation
- Model Source Tests
- Directory Scanner Service
- Florence2 Hi-Res Fix
- Distributed UI Sections
- Config Builder Node
- User Guide Sections
- CivitAI Facade Tests
- Florence2 Manifest Building
- Sampler Utility Functions
- JSON Text Node
- Florence2 Dependency Validation
- Remote VAE Worker
- Project Structure Map
- Florence2 Loading Tests
- Example Workflow Presets
- Florence2 Detection Tests
- Frontend File Documentation
- Testing Infrastructure
- Architecture and Initialization
- Remote VAE Facade
- Model Loading Dispatcher
- Config Generation API
- Troubleshooting Guide
- UI Module Documentation
- Project Changelog
- Feature Overview
- Async Upscale API
- Prompt Group UI
- API Endpoint Inventory
- Dashboard UI Layout
- LoRA Metadata Endpoints
- CivitAI Metadata Integration
- Model Preset Groups
- Upscaling UI Components
- Best Practices Guide
- Distributed Setup Guide
- Dashboard State Metrics
- LTX Cache Eviction
- Upscale Job Control
- Performance Optimization Tips
- Project Repository Name
- VAE UI Components
- Dashboard Viewer Node

## God Nodes (most connected - your core abstractions)
1. `run_generation_loop()` - 59 edges
2. `ModelCache` - 37 edges
3. `_run_distributed_generation()` - 37 edges
4. `API inventory` - 32 edges
5. `UltimateConfigBuilder` - 30 edges
6. `renderUI()` - 27 edges
7. `ComfyUI Ultimate Auto Sampler Config Grid Testing Suite` - 23 edges
8. `**ComfyUI Ultimate Sampler Grid – Development Roadmap**` - 23 edges
9. `run_florence2_step()` - 20 edges
10. `save_manifest()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `**Major Functions & Sections:**` --references--> `getStyles()`  [INFERRED]
  js/conf_builder/conf-builder-readme.md → web/conf_builder/conf-builder-ui-components.js
- `**Major Functions & Sections:**` --references--> `UltimateConfigBuilder`  [INFERRED]
  js/conf_builder/conf-builder-readme.md → config_builder_node.py
- `**Major Functions & Sections:**` --references--> `UltimateConfigBuilder`  [INFERRED]
  web/conf_builder/conf-builder-readme.md → config_builder_node.py
- `**Major Functions & Sections:**` --references--> `renderUI()`  [INFERRED]
  js/conf_builder/conf-builder-readme.md → web/conf_builder/conf-builder-config-management.js
- `Key Gotchas for AI Development` --references--> `init()`  [INFERRED]
  README.md → resources/logic_init.js

## Import Cycles
- None detected.

## Communities (81 total, 11 thin omitted)

### Community 0 - "Model Cache Management"
Cohesion: 0.05
Nodes (3): ModelCache, _async_load(), _async_load()

### Community 1 - "UI Logic Filters"
Cohesion: 0.05
Nodes (62): addLogicFilter(), addQuickFilter(), addSearchFilter(), analyzeFieldStats(), analyzePromptStats(), analyzeTagStats(), buildComfyNodesWorkflow(), buildLabelOverlay() (+54 more)

### Community 2 - "Grid Canvas Rendering"
Cohesion: 0.11
Nodes (39): applyPendingTransforms(), autoFitZoom(), calculateGridDimensions(), calculateVisibleRange(), canvas, _cardPool, forceVisibleRangeUpdate(), getZoomDelta() (+31 more)

### Community 3 - "HTML Dashboard Generation"
Cohesion: 0.13
Nodes (7): get_files_from_folder(), normalize_str(), parse_string_input(), get_html_template(), test_manifest_cannot_close_script_and_round_trips(), test_node_id_is_a_json_string_literal(), test_title_cannot_inject_attributes_and_tokens_remain_literal()

### Community 4 - "Distributed Generation Pipeline"
Cohesion: 0.05
Nodes (29): parse_float_input(), parse_json_with_error(), prepare_input_jobs(), sanitize_session_name(), calculate_clip_hash(), check_if_job_completed(), _cleanup_per_config_remote_workers(), _expand_lora_weight_arrays() (+21 more)

### Community 5 - "LTX Video Generation"
Cohesion: 0.14
Nodes (8): _call_node(), encode_ltx_prompts(), load_ltx_models(), ltx_video_generate(), safe_print(), _unwrap(), test_load_ltx_models_imports(), test_ltx_video_generate_imports()

### Community 6 - "Batch CLIP Encoding"
Cohesion: 0.06
Nodes (12): batch_encode_prompts(), batch_encode_with_cache(), _conditioning_average(), _conditioning_combine(), _conditioning_concat(), encode_prompt_with_combinators(), _encode_single(), _parse_and_segments() (+4 more)

### Community 7 - "Config Builder Utilities"
Cohesion: 0.07
Nodes (26): **Major Functions & Sections:**, **Major Functions & Sections:**, activeConfigBuilderNodes, availableConfigs, availableLatentUpscaleModels, availableSamplers, availableSchedulers, availableSessions (+18 more)

### Community 8 - "Config Builder API"
Cohesion: 0.11
Nodes (13): calculate_sha256(), get_lora_triggers_endpoint(), get_model_version_info(), load_and_save_tags(), load_json_from_file(), lookup_lora_metadata_endpoint(), lookup_model_metadata_endpoint(), refresh_models_endpoint() (+5 more)

### Community 9 - "Development Roadmap"
Cohesion: 0.05
Nodes (40): **10. Validation Warning (Omit vs Lookup) - Warn user if omits are added but lookup is off** (low priority) (Needs testing), **11. Model-Specific Prompts** (Needs improvement), **12. Arrays in LoRA Weights** Integrated but needs adding to the Builder UI, **13. Real-Time ETA** (Improved — now uses rolling 10-job window for more responsive estimates. Distribution times still TODO), **14. Cache Trigger Word Placement** (low priority), ~~**20. Hotkeys Reference List**~~ DONE — updated with R, Shift+0-9, Ctrl+S, Escape, Double-click, **22. Import Configs (Merge)** (low priority), **23. Pseudo-JSON Nodes (Recursion)** (low priority) (+32 more)

### Community 10 - "Distributed Manager Facade"
Cohesion: 0.10
Nodes (21): clear_active_manager(), create_manager(), get_master_url(), is_distribution_available(), notify_workers_to_start(), _require_companion(), set_active_manager(), stop_all_workers() (+13 more)

### Community 11 - "UI Layout Components"
Cohesion: 0.16
Nodes (12): renderConfigSection(), renderCooldownSection(), renderGlobalPromptsSection(), renderPreviewSection(), renderUI(), createSectionHeader(), _createSettingsDropdown(), createSidebar() (+4 more)

### Community 12 - "UI Builder Elements"
Cohesion: 0.15
Nodes (12): createChipListBuilder(), createConfigArrayElement(), createResolutionBuilder(), createResolutionDropdown(), getConfigArrayModelType(), isLTXConfigArray(), loadCustomResolutions(), openCustomResolutionsEditor() (+4 more)

### Community 14 - "Image Mask Operations"
Cohesion: 0.14
Nodes (14): _crop_image_by_mask(), _paste_into_image(), _make_centered_mask(), _make_image(), test_crop_centered_box_no_padding(), test_crop_padding_clamped_at_image_edge(), test_crop_with_padding_expands_bbox(), test_empty_mask_raises() (+6 more)

### Community 15 - "Frontend State Management"
Cohesion: 0.10
Nodes (11): beforeRegisterNodeDef(), CACHE_BUST, ensureModulesLoaded(), loadConfigFromBackend(), loadSession(), renderUI(), saveConfigToBackend(), saveState() (+3 more)

### Community 16 - "Prompt and LoRA Expansion"
Cohesion: 0.08
Nodes (23): expand_configs(), expand_lora_stack(), _expand_lora_weight_arrays(), _expand_ltx_entry(), _normalize_ltx_audio_mode(), parse_prompt_input_nested(), recursive_cartesian(), _call() (+15 more)

### Community 17 - "LoRA Trigger Management"
Cohesion: 0.17
Nodes (9): parse_lora_definition(), load_and_save_tags(), _apply_model_prompt_affixes(), build_prompt_with_triggers(), collect_unique_prompts_with_triggers(), get_filtered_lora_triggers(), _get_filtered_lora_triggers_cached(), get_trigger_placement_for_lora() (+1 more)

### Community 18 - "Session Persistence API"
Cohesion: 0.13
Nodes (19): Persistence contract, _create_image_links(), delete_non_favorites(), delete_rejected(), delete_session(), export_favorites(), _get_benchmarks_base(), get_session_html() (+11 more)

### Community 19 - "Pipeline Filtering Logic"
Cohesion: 0.17
Nodes (21): binaryInsert(), closeSortPopup(), compareItems(), _evalOp(), executePipeline(), _extractFieldValue(), getFilterKey(), incrementalFilter() (+13 more)

### Community 20 - "Manifest File Utilities"
Cohesion: 0.13
Nodes (13): _atomic_write_manifest(), merge_manifest_user_changes(), save_manifest(), test_api_transaction_blocks_background_save_until_commit(), test_atomic_replace_failure_keeps_original_and_cleans_temp(), test_corrupt_manifest_is_not_overwritten(), test_generation_preserves_cleared_actions_and_new_disk_items(), test_missing_user_fields_do_not_clear_memory_values() (+5 more)

### Community 21 - "Image Resizing Math"
Cohesion: 0.12
Nodes (10): compute_target_dims(), test_clamps_to_max_4096(), test_clamps_to_min_64(), test_divisible_by_8(), test_formula_matches_comfy_convention(), test_landscape_aspect_preserved(), test_portrait_aspect_preserved(), test_square_1mp_from_huge_source_downscales() (+2 more)

### Community 22 - "Config Builder Features"
Cohesion: 0.09
Nodes (23): Attention Modes, Basic Parameters, Basic Setup, Config Array Controls, Config Arrays, 🔧 Config Builder Node (Visual UI), Config Management (Save/Load Presets), Fast CivitAI Info Lookup (+15 more)

### Community 23 - "Upscale Modal Logic"
Cohesion: 0.21
Nodes (21): closeUpscaleModal(), _defaultFlorence2Options(), _defaultSeedVR2Options(), _defaultUpscaleConfig(), _defaultUpscaleStep(), deleteUpscalePreset(), _ensureUpscaleStepFields(), fetchUpscaleModels() (+13 more)

### Community 24 - "LTX Model Caching"
Cohesion: 0.15
Nodes (15): _build_ltx_manifest_entry(), get_model_cache_key(), _ltx_sort_components(), _ltx_conf(), test_build_ltx_manifest_entry_imports(), test_checkpoint_key_unchanged(), test_diffusion_model_key_unchanged(), test_ltx_different_clip_different_key() (+7 more)

### Community 25 - "UI Component Management"
Cohesion: 0.14
Nodes (36): CONFIG_COLORS, createLoraElement(), createModelElement(), createSectionPresetRow(), createVAEElement(), debouncedRenderUI(), fetchLoraTriggersForOmit(), isCivitaiAvailable() (+28 more)

### Community 26 - "Model Inventory API"
Cohesion: 0.18
Nodes (10): get_model_counts_endpoint(), get_model_lists_endpoint(), get_config_section_presets(), get_custom_resolutions(), get_section_presets(), get_upscale_presets(), list_configs(), list_sessions() (+2 more)

### Community 27 - "Config State Tests"
Cohesion: 0.14
Nodes (9): make_state(), test_bypassed_lora_is_excluded(), test_folder_reference_left_unexpanded(), test_folder_with_strength_array_not_combined_with_other_loras(), test_legacy_dual_array_preserves_cartesian_form(), test_lora_strength_arrays_render_as_brackets(), test_ltx_video_config_model_type_propagates(), test_multiple_loras_combine_with_plus_separator() (+1 more)

### Community 28 - "AI Development Context"
Cohesion: 0.33
Nodes (5): AI Development Context, Dashboard contract, Generation and optional services, Purpose and layers, Validation

### Community 29 - "Mask Selection Logic"
Cohesion: 0.18
Nodes (11): parse_mask_select_indices(), test_empty_string_means_all(), test_garbage_input_returns_no_detection(), test_multiple_indices(), test_negative_index_treated_as_invalid(), test_out_of_range_index_returns_no_detection(), test_single_index(), test_some_in_range_some_out_keeps_in_range() (+3 more)

### Community 30 - "Deferred Upscaling Pipeline"
Cohesion: 0.13
Nodes (7): run_deferred_upscales(), decode_latent_with_vae(), generate_image(), seedvr2_upscale(), tiled_hires_sample(), upscale_image(), _run_upscale_thread()

### Community 31 - "Trigger Word UI"
Cohesion: 1.00
Nodes (3): showEditTriggersModal(), addTriggerWord(), renderTriggerChips()

### Community 32 - "Image Metadata Packing"
Cohesion: 0.17
Nodes (6): calculate_file_hash(), find_model_file(), get_cache_file_path(), load_hash_cache(), pack_metadata_into_image(), save_hash_cache()

### Community 33 - "LTX Validation Utilities"
Cohesion: 0.16
Nodes (13): get_ltx_node_classes(), parse_sigmas(), preflight_ltx(), test_encode_ltx_prompts_imports(), test_parse_double_comma_raises(), test_parse_empty_raises(), test_parse_leading_comma_raises(), test_parse_malformed_raises() (+5 more)

### Community 34 - "Project Documentation"
Cohesion: 0.12
Nodes (15): ComfyUI Ultimate Auto Sampler Config Grid Testing Suite, Config Builder, 🙏 Credits, Dashboard, 🚀 Fastest way to try it, File Locations, Generated Files, 📦 Installation (+7 more)

### Community 35 - "Model Source Tests"
Cohesion: 0.17
Nodes (7): test_from_builder_returns_fallback_unchanged(), test_from_manifest_caches_by_combo(), test_from_manifest_empty_lora_loads_checkpoint_only(), test_from_manifest_missing_model_falls_back(), test_from_manifest_uses_item_model_and_lora(), fake_load_checkpoint(), fake_load_loras()

### Community 36 - "Directory Scanner Service"
Cohesion: 0.13
Nodes (10): _build_sampler_lookup(), _extract_filename_from_url(), _load_existing_manifest_items(), parse_a1111_parameters(), _parse_sampler_string(), _probe_mp4_dimensions(), _find_tkhd(), _process_single_image() (+2 more)

### Community 37 - "Florence2 Hi-Res Fix"
Cohesion: 0.17
Nodes (6): _get_or_load_checkpoint_lora(), load_florence2_model(), _resolve_loaders(), run_florence2_step(), safe_print(), _vram_log()

### Community 38 - "Distributed UI Sections"
Cohesion: 0.23
Nodes (14): renderLTXAudio(), renderLTXImageInput(), renderLTXSection(), renderLTXStage(), renderLTXVideoShape(), isDistributedAvailable(), _renderDistributedInstallCard(), renderDistributionSection() (+6 more)

### Community 39 - "Config Builder Node"
Cohesion: 0.23
Nodes (5): UltimateConfigBuilder, _base_state(), test_florence2_block_round_trips(), test_florence2_disabled_upscaling_omits_block(), test_florence2_step_with_active_false_filtered_out()

### Community 40 - "User Guide Sections"
Cohesion: 0.15
Nodes (13): 1. The Nodes, 2. Generator Node Parameters, 3. The JSON Configuration, 4. Hybrid Inputs (Optional), Advanced Settings, Core Settings, Folder Expansion, Getting Started (+5 more)

### Community 41 - "CivitAI Facade Tests"
Cohesion: 0.20
Nodes (7): is_civitai_available(), fake_companion(), no_companion(), test_civitai_fetch_by_hash_returns_companion_result(), test_civitai_fetch_by_hash_returns_none_when_missing(), test_is_civitai_available_false_when_companion_missing(), test_is_civitai_available_true_when_companion_installed()

### Community 42 - "Florence2 Manifest Building"
Cohesion: 0.23
Nodes (6): build_florence2_manifest_entry(), build_florence2_no_detection_entry(), test_manifest_entry_carries_florence2_fields(), test_manifest_entry_omits_inherited_upscale_keys(), test_no_detection_entry_does_not_carry_upscale_metadata(), test_no_detection_entry_marks_no_detection_flag()

### Community 45 - "Florence2 Dependency Validation"
Cohesion: 0.27
Nodes (6): get_florence2_node_classes(), preflight_florence2(), test_get_florence2_node_classes_returns_both(), test_preflight_passes_when_both_present(), test_preflight_raises_when_florence2run_missing(), test_preflight_raises_when_loader_missing()

### Community 47 - "Project Structure Map"
Cohesion: 0.29
Nodes (6): Backend modules, Data flow and contracts, Frontend, Known limitations, Project Structure, Tests and release checks

### Community 48 - "Florence2 Loading Tests"
Cohesion: 0.18
Nodes (3): test_load_florence2_model_caches_per_name(), test_load_florence2_model_different_names_load_separately(), test_load_florence2_passes_hidden_defaults()

### Community 49 - "Example Workflow Presets"
Cohesion: 0.18
Nodes (11): CLIP Skip for Anime Models, 🎯 Example Workflows, Full Model Folder Test, LoRA Stack Testing (24 images), LoRA Strength Sweep, LoRA Trigger Word Filtering, Model Folder Expansion, Multi-Model Comparison (9 images) (+3 more)

### Community 50 - "Florence2 Detection Tests"
Cohesion: 0.20
Nodes (3): _make_image(), test_empty_mask_returns_no_detection(), test_out_of_range_mask_select_returns_no_detection()

### Community 51 - "Frontend File Documentation"
Cohesion: 0.17
Nodes (11): **1. `conf-builder-utilities.mjs**`, **2. `conf-builder-ui-components.mjs**`, **3. `conf-builder-config-management.mjs**`, **4. `conf-builder-main.js**`, **File Structure Overview**, **Major Functions & Sections:**, **Major Functions & Sections:**, **Major Functions & Sections:** (+3 more)

### Community 52 - "Testing Infrastructure"
Cohesion: 0.06
Nodes (12): _install_stubs(), _PackageInitFinder, _PackageInitLoader, pytest_configure(), _KSampler, _RouteTableDef, api(), call() (+4 more)

### Community 53 - "Architecture and Initialization"
Cohesion: 0.09
Nodes (16): Architecture Mental Model, Critical Constraints, File Dependencies (Import Graph), Key Gotchas for AI Development, 🤖 Notes for AI Development, Server Event Types, Testing Changes, init() (+8 more)

### Community 54 - "Remote VAE Facade"
Cohesion: 0.11
Nodes (12): _companion_decode(), get_endpoint_names(), is_remote_vae_available(), fake_companion(), no_companion(), test_companion_decode_raises_runtime_error_when_missing(), test_companion_decode_raises_when_version_too_old(), test_companion_decode_returns_companion_result() (+4 more)

### Community 55 - "Model Loading Dispatcher"
Cohesion: 0.20
Nodes (5): _conditioning_to_serializable(), load_model_by_type(), _preencode_all_conditionings(), load_checkpoint(), load_loras_for_preencoding()

### Community 56 - "Config Generation API"
Cohesion: 0.13
Nodes (12): Configuration contract, preview_endpoint(), safe_print(), Architecture notes worth knowing before editing, Contributing, Dev setup, JS syntax check, License (+4 more)

### Community 57 - "Troubleshooting Guide"
Cohesion: 0.22
Nodes (9): Browser Compatibility, Config Builder UI Issues, Dashboard Issues, Generation Issues, Interrupt/Cancel Issues, LoRA & Trigger Word Issues, Model & CLIP Issues, Remote VAE Issues (+1 more)

### Community 58 - "UI Module Documentation"
Cohesion: 0.29
Nodes (6): **1. `conf-builder-utilities.mjs**`, **2. `conf-builder-ui-components.mjs**`, **3. `conf-builder-config-management.mjs**`, **File Structure Overview**, **Major Functions & Sections:**, **Major Functions & Sections:**

### Community 60 - "Project Changelog"
Cohesion: 0.22
Nodes (9): 📝 Changelog, Unreleased - Dashboard and Session Reliability, Update 1/11/26 — Major Overhaul, Update 1/14/26 — Major Feature Update, Update 2/16/26 — Config Builder & Dashboard Overhaul, Update 2/5/26 — Code Refactoring & Performance Improvements, Update 2/5/26 — Random LoRA Selection, Update 3/6/26 — Distributed Processing & Dashboard Improvements (+1 more)

### Community 61 - "Feature Overview"
Cohesion: 0.25
Nodes (8): 🧹 Curation & JSON Export, 🌐 Distributed Processing (Multi-Machine), 📦 Favorites Export & Workflow Packing, 🎨 Interactive Dashboard (The "IDE"), 🌟 Key Features, 🚀 Powerful Grid Generation, ⚡ The "Revise & Generate" Workflow, 🔍 Upscaling & Post-Processing

### Community 62 - "Async Upscale API"
Cohesion: 0.33
Nodes (3): upscale_images(), get_upscale_status(), start_upscale_job()

### Community 63 - "Prompt Group UI"
Cohesion: 0.39
Nodes (8): createPromptGroupEditor(), renderPreview(), renderVisualGroups(), renderConfigPromptsSection(), countPromptCombinations(), expandPromptPreview(), recursiveCartesian(), recursiveCount()

### Community 64 - "API Endpoint Inventory"
Cohesion: 0.29
Nodes (7): API Integration (Config Builder), `/configbuilder/lookup_lora_metadata` (POST), `/configbuilder/lookup_model_metadata` (POST), `/configbuilder/lookup_triggers` (POST), `/configbuilder/refresh_models` (POST), `/configbuilder/scan_directory` (POST), Distribution API (registered via `distribution_routes.py`)

### Community 65 - "Dashboard UI Layout"
Cohesion: 0.29
Nodes (7): Card Overlays, 🖥️ Dashboard Interface, Header Bar, JSON Bars (Bottom — Horizontal Layout), Navigation & Controls, Revision Modal, Toolbar

### Community 67 - "CivitAI Metadata Integration"
Cohesion: 0.07
Nodes (13): civitai_fetch_by_hash(), _preload_diff_worker(), calculate_sha256(), expand_lora_folder(), get_lora_trigger_words(), get_model_version_info(), load_loras_to_model(), LoRAFileNotFoundError (+5 more)

### Community 68 - "Model Preset Groups"
Cohesion: 0.33
Nodes (6): 🏆 Group 1: The "Gold Standards" (Reliable Realism), 🎨 Group 2: Artistic & Painterly, ⚡ Group 3: Speed / Turbo / LCM, 🦾 Group 4: Flux & SD3 Specials, 🧪 Group 5: Experimental & Unique, 📋 Preset Configs

### Community 69 - "Upscaling UI Components"
Cohesion: 0.46
Nodes (8): createDefaultFlorence2Options(), createDefaultSeedVR2Options(), createDefaultStep(), ensureStepFields(), renderSessionSection(), renderUpscalingSection(), renderPipelines(), createInputGroup()

### Community 70 - "Best Practices Guide"
Cohesion: 0.40
Nodes (5): Config Builder Workflow Efficiency, Organization, Testing Strategy, 💡 Tips & Best Practices, Trigger Word Management

### Community 71 - "Distributed Setup Guide"
Cohesion: 0.40
Nodes (5): 🌐 Distributed Processing, Distribution Troubleshooting, Master Text Encoding, Model Sync, Setting Up Distribution

### Community 72 - "Dashboard State Metrics"
Cohesion: 0.40
Nodes (4): metrics, nodeMap, sortOptionsList, visibleSlice

### Community 73 - "LTX Cache Eviction"
Cohesion: 0.33
Nodes (3): clear_ltx_caches(), _evict_to_max(), test_clear_ltx_caches_imports()

### Community 75 - "Performance Optimization Tips"
Cohesion: 0.50
Nodes (4): For Large Batches (1000+ images), For Memory-Constrained Systems, For Multi-Model Testing, 🔧 Performance Tips

### Community 79 - "VAE UI Components"
Cohesion: 0.33
Nodes (6): renderLTXModelFiles(), renderVAEsSection(), getAvailableLatentUpscaleModels(), getAvailableTextEncoders(), getAvailableVAEs(), getVAEFolders()

## Knowledge Gaps
- **191 isolated node(s):** `_KSampler`, `filterButtonCache`, `jsonElCache`, `pendingSaveItems`, `_qfAllTypes` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 661 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UltimateConfigBuilder` connect `Config Builder Node` to `LoRA Metadata Endpoints`, `Config Builder API`, `Config State Tests`, `LoRA Array Processing`, `Session Persistence API`, `Frontend File Documentation`, `Config Generation API`, `Input Parsing Utilities`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `ComfyUI Ultimate Auto Sampler Config Grid Testing Suite` connect `Project Documentation` to `API Endpoint Inventory`, `Dashboard UI Layout`, `Model Preset Groups`, `Best Practices Guide`, `Distributed Setup Guide`, `User Guide Sections`, `Performance Optimization Tips`, `Example Workflow Presets`, `Architecture and Initialization`, `Config Builder Features`, `Troubleshooting Guide`, `Project Changelog`, `Feature Overview`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `Key Gotchas for AI Development` connect `Architecture and Initialization` to `Config Generation API`, `Prompt and LoRA Expansion`, `Session Persistence API`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `run_generation_loop()` (e.g. with `_preload_base_worker()` and `_preload_diff_worker()`) actually correct?**
  _`run_generation_loop()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `_run_distributed_generation()` (e.g. with `check_if_job_completed()` and `get_model_cache_key()`) actually correct?**
  _`_run_distributed_generation()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `API inventory` (e.g. with `get_lora_triggers_endpoint()` and `get_model_counts_endpoint()`) actually correct?**
  _`API inventory` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `UltimateConfigBuilder` (e.g. with `Architecture notes worth knowing before editing` and `**Major Functions & Sections:**`) actually correct?**
  _`UltimateConfigBuilder` has 14 INFERRED edges - model-reasoned connections that need verification._