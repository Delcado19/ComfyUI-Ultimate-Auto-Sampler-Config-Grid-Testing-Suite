# Guided comparison setup

The first question is: "What will this test generate, and what should I do next?"
The Config Builder now answers this through five freely accessible setup views and a persistent planned base-image count. It retains the existing saved recipe and complete advanced editor.

## Current revision after user feedback

The user rejected the combined Compare screen. Sampling and Seeds now have separate tasks. Sampling shows native checkbox lists for samplers/schedulers, followed by steps, CFG and output size. Its scope selector edits all setups or one named setup. Each change touches only its own sampling field and does not copy LoRAs, prompts or seeds across setups.

The source/data tests pass: 154 Python and 14 JavaScript tests, including scoped sampling edits and independent per-setup array ownership. After the approval-service limit was lifted, the final five-view browser checks passed at 1440, 768 and 390 pixels without horizontal overflow or console errors. Range/random append, manual edits, separator validation, uint64 precision, strength precision, advanced mode and stale-backend detection passed. Sampling and Seeds screenshots were inspected. These checks do not establish GPU image quality.

The two-setup/shared-seed workflow is installed at `G:/ComfyUI-Easy-Install/ComfyUI/user/default/workflows/LoRA-ZIT-Testing-Screen-L-v4-Grid.json`. The previous installed hash was checked before replacement, and the installed bytes match the staged file. Its exact expanded 72-job equivalence was checked during preparation. The original workflow is unchanged.

Final integration also passed in isolated ComfyUI 0.42.1 / frontend 1.55.18: embedded node, 72-image preview, disconnect/reconnect run gating, normal queue callback `[0, 1]`, and workflow save/load with exact shared seeds including zero and uint64 maximum. The queue callback was intercepted; no generation was submitted. The isolated install used the core CLIPLoader equivalent because it loaded only this suite. The regular user server was not restarted; restart it before using shared seeds, then refresh the browser.

| Before | After | Why |
| --- | --- | --- |
| Run settings, companion-install notices and nested prompt controls lead the screen | Connected model stack and LoRA selection lead setup | Start with the objects being tested |
| Icon-only navigation into one long form | Models & LoRAs, Prompts, Sampling, Seeds, Review & run, with Back and Next | Name each task and allow direct navigation |
| Raw JSON occupies a fixed panel | Planned base-image count in the footer; JSON under a disclosure | Show the consequence of edits before implementation detail |
| Sampler, attention, seed policy and expert controls share equal weight | Common comparison values first, specialized controls one level deeper | Reduce decisions without dropping existing capabilities |
| Generation starts outside the configuration UI | Review includes wiring checks and Run comparison | Provide a visible completion point using normal ComfyUI queuing |

## Design direction

- `design-taste-frontend`: True-black flat, seed `1802072495`; existing platform/system typography retained, no redraws. Lightness separates surfaces; white identifies the main action.
- Product-specific element: the image-count footer shows the effect of the actual Cartesian test, including prompts and locked LoRA strengths. It changes from 72 to 60 when one five-strength group becomes a two-strength group.
- The embedded node uses its own container width for responsive layout. Native buttons, selects, labelled fields, visible focus, a status region, and preserved prompt text carry the interaction.
- No marketing banner or generated artwork was added. Banner-design hierarchy is limited to the compact title and next action; a campaign-style hero would compete with the form.
- Application-screen rules take precedence over landing-page picture and motion quotas. Functional step numbers identify setup order rather than decorate sections.

## Motion opportunity audit

No new animation is needed for comprehension. Existing immediate pressed states remain. The following is an audit recommendation, not an implemented animation.

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `conf-builder-guided.js`, disclosure helper | Expert controls appear immediately | Preventing a jarring change | Occasional pointer use | Optional opacity 0.6 to 1 over 140 ms, `cubic-bezier(0.23, 1, 0.32, 1)`; no layout motion, no input delay. Keyboard activation stays immediate; reduced motion uses an 80 ms opacity-only change. |

Rejected candidates:

- Setup navigation: rejected by frequency/input gate. Keyboard-driven navigation must remain immediate.
- Image-count digits and review rows: rejected by function gate. Users need to read the values, not follow moving data.
- Repeated model/LoRA controls: rejected by function gate. Animated entrances on every edit would interrupt comparison work.
- Decorative title/banner motion: rejected by purpose gate. It explains no part of configuring a test.

The interface needs less visible motion than its source form. If future observation shows disclosure changes are disorienting, `improve-animations plan disclosure feedback` is the narrow handoff; no motion library is needed now.

## Validation and limits

### Seed and strength generators follow-up

- The dedicated Seeds view contains the shared seed list. Start/End/Increment and Generate range append an arithmetic series; Random count and Generate random seeds append uint64 values. The editable CSV sits below both generators and displays S0...Sn mappings.
- Each LoRA's ordinary strength editor uses the same range/CSV component. Increments are step sizes, endpoints are inclusive when reached, duplicates merge, and manual values remain when generated values are appended. Seed zero and all uint64 bits are retained; decimal strength ranges avoid accumulated binary rounding.
- Empty comma slots, semicolons, invalid numeric tokens and non-finite/out-of-range values show inline errors. Python also validates imported/shared seed and strength lists. Lists/generation are capped at 10,000 entries; an unapplied invalid generator range does not invalidate a valid saved CSV.
- Shared seeds override per-group fixed/random policies only when the list is non-empty. Existing recipes without this field retain their behavior. A new frontend connected to an older server refuses a shared-seed run until ComfyUI is restarted.
- Screen-L copy: two settings groups (baseline and strength sweep), with all seeds in one editable list. A Counter comparison of expanded config records proves that the initial 72 jobs match the previous six-group recipe exactly. Its backup is under ignored `.test-tmp/seed-list-workflow/`.
- Regression totals for the numeric-generator pass were 154 Python tests and 11 JavaScript tests; scoped sampling changes bring JavaScript coverage to 14. Browser checks before the final layout revision covered append behavior, random count, manual edits, malformed delimiters, exact uint64 round trips, fine-grained strengths, range limits, advanced mode and 1440/768/390 widths. All generation/start callbacks were intercepted; no GPU jobs ran.

The earlier guided-setup validation below describes the first UI pass before numeric-list controls were added.

- Python regression suite: 134 passed using installed ComfyUI Python and isolated workspace-local pytest dependencies/temp/cache.
- JavaScript tests cover the 72-image diagnostic matrix, stacked strengths, prompt pairing/nesting, resolution/seed multiplication, shifts/guidance, unknown counts and generator links.
- Browser interaction checks use the real Python preview transformer: all four views, invalid values, 72/60-image counts, sequential prompt edits, nested-prompt preservation, preview failure/recovery, keyboard focus, and widths 1440/768/390.
- Isolated ComfyUI 0.42.1 / frontend 1.55.18: embedded node registration, 72-image preview, callback arguments `[0, 1]`, workflow serialization/reload, and live wiring-status updates passed. The isolated server uses CPU; the start callback was intercepted. No GPU generation was queued.
- The isolated frontend uses core CLIPLoader for the vanilla text encoder because only this suite is loaded. The user's workflow and regular server remain unchanged.
- Inspector results for the initial guided view: before 8 failures / 2 warnings, after 0 failures / 0 warnings at all three widths. Screenshots and browser fixtures remain under ignored `.test-tmp/`.

ROUND 1

Seen in one second: sampler comparison setup, current task and next action.
Idea: the test's real Cartesian product becomes the persistent run-size summary.
Live thing: edit strengths or sampling values and read the updated base-image count.
Layout: compact header, labelled task navigation, one editable view, fixed summary/actions.
Strongest: the next action and number of generated base images remain visible while editing.
Weakest: legacy expert controls retain their dense styling; the review table scrolls horizontally inside a narrow node.
Fixed after screenshot review: redundant picker labels, long LoRA extensions in review, and stale/failed preview start behavior.
Scores (self-review, not a user study): design 7.5, usability 8, creativity 6.5, content 8; overall 7.5. Application rules apply; landing-page imagery/motion caps do not.
Still unproven: first-time user comprehension and the image quality of a full Z-Image test run.
