# Runtime validation — 2026-10-04

The SDXL image-generation smoke test passed against real ComfyUI and CUDA.
This is a focused runtime check, not coverage of every supported model family.

## Environment and isolation

- Source baseline: `07a89449c28b9f9cfecb1d36f6cab2975204d70d`, plus local documentation/license changes and the UTF-8 template fix below.
- ComfyUI 0.38.0; frontend 1.53.6; Python 3.12.10; PyTorch 2.9.1+cu130.
- GPU: NVIDIA GeForce RTX 5080, 16 GB VRAM.
- Separate server on localhost port 8190, loading only this custom-node package.
- Core, Python and models were read from the existing installation. Inputs, outputs, user data and caches were placed under `.test-tmp/runtime`.
- The original server on port 8188 remained running with an empty queue; its installation and output directory were not modified.

## Measured results

- All four suite nodes registered successfully.
- The live builder preview endpoint returned configuration JSON.
- The actual ComfyUI queue accepted and completed a generator-to-dashboard workflow without node validation errors.
- Two 512 × 512 images were generated using `realvisxlV50_v50LightningBakedvae`, Euler and DPM++ 2M, normal scheduler, four steps, CFG 2 and seed 42. Initial workflow execution took 8.09 seconds. These settings test execution, not comparative image quality.
- Both image URLs returned decodable images with the expected dimensions.
- Partial-save API calls persisted favorite/rejected flags and notes, including explicit `false` and empty-string resets, without losing either item.
- After restarting the isolated server, the same workflow/session completed successfully with the original two image IDs retained.
- A headless Chromium browser loaded the ComfyUI frontend and generated dashboard without JavaScript exceptions. Both dashboard images loaded; screenshots were inspected.
- `git diff --check` passed.

## Finding and correction

The standalone report lacked a character-set declaration. Serving it without an HTTP charset header reproduced corrupted Unicode control symbols. `resources/template.html` now declares UTF-8, with a short comment explaining the standalone-report requirement. The corrected dashboard was verified again after server restart; control symbols rendered correctly and both images remained visible.

The test launcher also needed workspace-local Numba/temp caches and UTF-8 console streams. These are isolation settings for the temporary launcher, not changes to the installed ComfyUI or project Python code.

## Evidence and limits

Local evidence remains in `.test-tmp/runtime`: `history.json`, `smoke-result.json`, `preview-result.json`, `browser-result.json`, `frontend.png`, `dashboard.png`, server logs, and the generated session under `output/benchmarks/runtime_smoke_20261004`.

The temporary server was stopped after testing. Test tools and generated evidence are ignored by Git. Before publication, all 134 regression tests passed again in 29.57 seconds. The HTML charset fix was also verified directly in the browser.

Not exercised: full interactive builder editing, every dashboard control, large grids, LoRA/model combinations, video, upscale pipelines, distributed execution, CivitAI integration, and concurrent generation/cleanup.
