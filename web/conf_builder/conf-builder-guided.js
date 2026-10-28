/** Guided presentation of the existing builder state; no parallel configuration schema. */
import { parseLoraString, buildLoraString } from './conf-builder-utilities.js';
import { createNumberListEditor, parseNumberList } from './conf-builder-numbers.js';

const STEPS = ['Models & LoRAs', 'Prompts', 'Sampling', 'Seeds', 'Review & run'];
const SAMPLING_KEYS = ['samplers', 'schedulers', 'steps', 'cfg', 'resolutions'];
const list = value => Array.isArray(value) ? value : [value];
const values = value => String(value ?? '').split(',').map(v => v.trim()).filter(Boolean);
const pathOf = value => typeof value === 'object' ? value?.path : value;
const hasPath = items => (items || []).some(item => pathOf(item) && pathOf(item) !== 'None');

function promptCount(value) {
    if (typeof value === 'string') {
        try { return promptCount(JSON.parse(value)); } catch { return 1; }
    }
    if (!Array.isArray(value)) return 1;
    return value.some(Array.isArray)
        ? value.reduce((total, part) => total * promptCount(part), 1)
        : Math.max(value.length, 1);
}

/** Count emitted, literal image configs without materializing their Cartesian product.
 * Folder/wildcard and video jobs deliberately stay unknown rather than showing a misleading total.
 */
export function plannedImageCount(payload) {
    let total = 0;
    for (const config of payload.configs || []) {
        if (config.model_type === 'ltx_video') return null;
        let count = 1;
        for (const key of ['sampler', 'scheduler', 'steps', 'cfg', 'clip_skip', 'model', 'vae', 'attention_mode']) {
            const entries = list(config[key] ?? 'Default');
            if (entries.some(entry => typeof entry === 'string' && (entry.includes('*') || /[\\/]$/.test(entry)))) return null;
            count *= Math.max(entries.length, 1);
        }
        let adapters = 0;
        for (const stack of list(config.lora ?? 'None')) {
            if (typeof stack !== 'string' || stack.includes('*') || /[\\/](?:\s*:|\s*$)/.test(stack)) return null;
            let combinations = 1;
            for (const match of stack.matchAll(/\[([^\]]*)\]/g)) {
                combinations *= values(match[1]).length;
            }
            adapters += combinations;
        }
        const positive = promptCount(config.positive);
        const negative = promptCount(config.negative);
        count *= adapters * Math.max(config.resolutions?.length || 0, 1);
        count *= positive > 1 && positive === negative ? positive : positive * negative;
        const override = config.model_sampling_override ?? 'none';
        if (Array.isArray(override)) return null;
        if (override === 'flux') {
            count *= Math.max(values(config.model_sampling_flux_max_shift ?? 1).length, 1);
            count *= Math.max(values(config.model_sampling_flux_base_shift ?? 1).length, 1);
        } else if (override !== 'none') {
            count *= Math.max(values(config.model_sampling_shift ?? 1).length, 1);
        }
        if (config.use_flux_guidance) count *= Math.max(values(config.flux_guidance_value ?? 3.5).length, 1);
        if (Array.isArray(config.use_advanced_sampling) || config.use_advanced_sampling) return null;
        total += count;
    }
    total *= 1 + Number(payload._session_settings?.add_random_seeds_to_gens || 0);
    return Number.isSafeInteger(total) && total >= 0 ? total : null;
}

export function connectedGenerator(node) {
    for (const id of node.outputs?.[0]?.links || []) {
        const link = node.graph?.links?.[id];
        const target = node.graph?.getNodeById(link?.target_id);
        if ((target?.comfyClass || target?.type) === 'UltimateSamplerGrid') return target;
    }
    return null;
}

function inputSource(node, name) {
    const input = node?.inputs?.find(item => item.name === name);
    const link = node?.graph?.links?.[input?.link];
    return node?.graph?.getNodeById(link?.origin_id) || null;
}

function sourceLabel(source, seen = new Set()) {
    if (!source) return 'Not connected';
    if (seen.has(source.id)) return source.title || source.type;
    seen.add(source.id);
    const file = source.widgets?.find(widget => /^(unet|clip|vae|ckpt)_name$/.test(widget.name))?.value ||
        Object.entries(source.widgets_values_named || {}).find(([name]) => /^(unet|clip|vae|ckpt)_name$/.test(name))?.[1];
    if (file) return file;
    const parent = inputSource(source, 'model');
    return parent ? `${sourceLabel(parent, seen)} · ${source.title || source.type}` : source.title || source.comfyClass || source.type;
}

function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

function button(text, action, className = '') {
    const el = element('button', className, text);
    el.type = 'button';
    el.onclick = action;
    return el;
}

function field(parent, label, control, help) {
    const group = element('label', 'cb-guide-field');
    group.append(element('span', '', label), control);
    if (help) group.append(element('span', 'cb-guide-muted', help));
    parent.append(group);
    return control;
}

function select(options, current, onChange) {
    const control = document.createElement('select');
    const entries = new Set([current, ...options]);
    for (const value of entries) {
        if (value === undefined) continue;
        control.add(new Option(value, value, false, value === current));
    }
    control.onchange = () => onChange(control.value);
    return control;
}

function textField(parent, label, value, save, help, validate = () => '') {
    const input = document.createElement('input');
    input.value = value ?? '';
    input.oninput = () => input.setCustomValidity('');
    input.onchange = () => {
        const error = validate(input.value);
        input.setCustomValidity(error);
        if (error) { input.reportValidity(); return; }
        save(input.value);
    };
    return field(parent, label, input, help);
}

function disclosure(parent, title, render) {
    const details = element('details', 'cb-guide-disclosure');
    details.append(element('summary', '', title));
    const content = element('div', 'cb-guide-disclosure-body');
    details.append(content);
    let rendered = false;
    details.ontoggle = () => {
        if (details.open && !rendered) { rendered = true; render(content); }
    };
    parent.append(details);
    return details;
}

/** Scope applies only to the edited sampling field; models, prompts, adapters and seeds stay intact. */
export function applySamplingValue(configs, selectedIndex, key, value) {
    if (!SAMPLING_KEYS.includes(key)) throw new Error('Not a sampling field.');
    const targets = selectedIndex === null ? configs : [configs[selectedIndex]];
    if (targets.some(config => !config)) throw new Error('Choose an existing setup.');
    for (const config of targets) config[key] = Array.isArray(value) ? [...value] : value;
}

function choiceList(parent, title, current, options, save) {
    const group = element('fieldset', 'cb-guide-choice');
    group.append(element('legend', '', title));
    const selected = new Set(Array.isArray(current) ? current : values(current));
    const summary = element('p', 'cb-guide-muted');
    const updateSummary = () => { summary.textContent = `${selected.size} selected: ${[...selected].join(', ')}`; };
    updateSummary(); group.append(summary);
    const choices = element('div', 'cb-guide-choice-list');
    const message = element('p', 'cb-guide-muted'); message.setAttribute('role', 'status');
    for (const value of new Set([...selected, ...options])) {
        const row = element('label');
        const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.has(value);
        check.onchange = () => {
            if (!check.checked && selected.size === 1) {
                check.checked = true; message.textContent = 'Keep at least one selected. Add a replacement before removing this value.'; return;
            }
            if (check.checked) selected.add(value); else selected.delete(value);
            message.textContent = ''; updateSummary(); save([...selected]);
        };
        row.append(check, element('span', '', value)); choices.append(row);
    }
    group.append(choices, message); parent.append(group);
}

function simplePrompts(groups) {
    if (!groups?.length) return [];
    if (groups.every(item => typeof item === 'string')) return groups;
    if (groups.length === 1 && Array.isArray(groups[0]) && groups[0].every(item => typeof item === 'string')) return groups[0];
    return null;
}

export function renderSeedControls(node, parent) {
    node.uiState.seedGenerator ||= {};
    const editor = createNumberListEditor({ kind: 'seed', label: 'Seeds for the whole test',
        value: node.state.seed_values || '', uiState: node.uiState.seedGenerator,
        onChange: value => { node.state.seed_values = value; node.saveState(); },
    });
    parent.append(editor);
}

export function renderGuidedSetup(node, resources, hooks) {
    const ui = node.uiState;
    const step = Math.max(0, Math.min(STEPS.length - 1, ui.guidedStep || 0));
    const arrays = node.state.config_arrays || [];
    const index = Math.max(0, Math.min(arrays.length - 1, ui.guidedConfig || 0));
    const config = arrays[index];
    const generator = connectedGenerator(node);
    const dashboard = generator?.outputs?.[0]?.links?.some(id => {
        const target = node.graph?.getNodeById(node.graph.links[id]?.target_id);
        return (target?.comfyClass || target?.type) === 'UltimateGridDashboard';
    });
    const root = element('div', 'cb-guided');
    const change = save => { save(); node.saveState(); };
    const redraw = () => node.renderUI();
    const navigate = target => {
        if ([...root.querySelectorAll('input,textarea,select')].some(input => !input.reportValidity())) return;
        ui.guidedStep = target;
        ui.guidedFocus = true;
        redraw();
    };
    const header = element('header', 'cb-guide-header');
    const title = element('div');
    title.append(element('h1', '', 'Sampler comparison'), element('p', 'cb-guide-muted', 'Choose what changes. Compare the results.'));
    header.append(title, button('Advanced editor', () => { ui.builderMode = 'advanced'; redraw(); }));
    root.append(header);

    const nav = element('nav', 'cb-guide-nav');
    nav.setAttribute('aria-label', 'Comparison setup');
    STEPS.forEach((label, i) => {
        const item = button(`${i + 1}. ${label}`, () => navigate(i));
        if (i === step) item.setAttribute('aria-current', 'step');
        nav.append(item);
    });
    root.append(nav);
    const content = element('div', 'cb-guide-content cb-main-content');
    const heading = element('h2', '', STEPS[step]);
    heading.tabIndex = -1;
    content.append(heading);
    const intro = [
        'Use your connected loaders, or select models here. Add a LoRA only if you want to test one.',
        'Write what you want to generate. Every prompt is tested with each comparison setting.',
        'Select sampling methods and enter the values you want to test. Seeds have their own step.',
        'Choose the seeds used by every setup. Generate values or enter your own list.',
        'Check the complete test before sending it to ComfyUI.'
    ];
    content.append(element('p', 'cb-guide-muted', intro[step]));
    if (arrays.length > 1 && (step === 0 || (step === 1 && arrays.some(item => item.use_custom_prompts)))) {
        const picker = document.createElement('select');
        arrays.forEach((item, i) => picker.add(new Option(item.name || `Comparison ${i + 1}`, i, false, i === index)));
        picker.onchange = () => { ui.guidedConfig = Number(picker.value); redraw(); };
        field(content, 'Edit setup', picker, 'Choose the model and LoRA setup to edit. Sampling and seeds are configured in their own steps.');
    }
    if (!config) {
        content.append(element('p', '', 'No comparisons yet. Open the advanced editor to add one.'));
    } else if (step === 0) {
        const sources = element('dl', 'cb-guide-sources');
        for (const [name, label] of [['optional_model', 'Model'], ['optional_clip', 'Text encoder'], ['optional_vae', 'VAE']]) {
            sources.append(element('dt', '', label), element('dd', '', sourceLabel(inputSource(generator, name))));
        }
        content.append(sources);
        const allConnected = ['optional_model', 'optional_clip', 'optional_vae'].every(name => inputSource(generator, name));
        if (allConnected && !hasPath(config.models) && !hasPath(config.vaes)) {
            content.append(element('p', 'cb-guide-notice', 'Your connected loaders supply the model, text encoder and VAE. No selection needed here.'));
        } else if (!inputSource(generator, 'optional_model') && (config.models || []).length <= 1 &&
            (config.models || []).every(item => typeof item === 'string')) {
            field(content, 'Checkpoint', select(['None', ...(resources.modelLists.checkpoints || [])], config.models?.[0] || 'None', value => {
                change(() => { config.models = [value]; }); redraw();
            }), 'Choose a checkpoint, or connect MODEL, CLIP and VAE loaders to the generator.');
            disclosure(content, 'Separate diffusion models, text encoders and VAE overrides', panel => {
                hooks.renderModelsSection(node, panel, config, index, resources.modelLists);
                hooks.renderVAEsSection(node, panel, config, index, resources.modelLists);
            });
        } else {
            const modelPanel = element('div', 'cb-guide-legacy');
            hooks.renderModelsSection(node, modelPanel, config, index, resources.modelLists);
            hooks.renderVAEsSection(node, modelPanel, config, index, resources.modelLists);
            content.append(modelPanel);
        }
        content.append(element('h3', '', 'LoRAs for this comparison'));
        content.append(element('p', 'cb-guide-muted', 'No LoRA gives you a baseline. Multiple LoRAs are applied together as a stack.'));
        const adapters = (config.loras || []).filter(item => item && item !== 'None');
        if (!adapters.length) content.append(element('p', 'cb-guide-notice', 'Baseline: no LoRA is applied by the grid.'));
        adapters.forEach((adapter, adapterIndex) => {
            const parsed = parseLoraString(adapter);
            const card = element('fieldset', 'cb-guide-adapter');
            card.append(element('legend', '', `LoRA ${adapterIndex + 1}`));
            const replace = value => change(() => { config.loras = config.loras.filter(item => item && item !== 'None').map((item, i) => i === adapterIndex ? value : item); });
            field(card, 'LoRA file', select(resources.availableLoras.filter(value => value !== 'None'), parsed.name, value => {
                // Strength arrays are keyed by filename; move them when replacing the file.
                for (const suffix of ['_model', '_clip']) {
                    if (config.lora_weight_arrays?.[parsed.name + suffix]) {
                        config.lora_weight_arrays[value + suffix] = config.lora_weight_arrays[parsed.name + suffix];
                        delete config.lora_weight_arrays[parsed.name + suffix];
                    }
                }
                // Keep inline strength arrays and separate CLIP strengths byte-for-byte on rename.
                replace(value + (adapter.includes(':') ? adapter.slice(adapter.indexOf(':')) : ''));
                redraw();
            }));
            const weights = config.lora_weight_arrays?.[parsed.name + '_model'];
            const complex = !Number.isFinite(parsed.model_str) || !Number.isFinite(parsed.clip_str) || parsed.name.endsWith('/') || parsed.name.endsWith('*') ||
                config.lora_weight_arrays?.[parsed.name + '_clip']?.length > 1 || parsed.model_str !== parsed.clip_str;
            if (complex) {
                card.append(element('p', 'cb-guide-muted', 'Separate model/CLIP strengths or folder selection are preserved. Edit these in the advanced LoRA controls below.'));
            } else {
                ui.strengthGenerators ||= {};
                const key = `${index}:${adapterIndex}`;
                ui.strengthGenerators[key] ||= {};
                card.append(createNumberListEditor({ kind: 'strength', label: 'Strengths to compare',
                    value: (weights || [parsed.model_str]).join(', '), uiState: ui.strengthGenerators[key],
                    onChange: value => change(() => {
                        const numbers = parseNumberList(value, 'strength').map(Number);
                        config.lora_weight_arrays ||= {};
                        delete config.lora_weight_arrays[parsed.name + '_model'];
                        if (numbers.length > 1) config.lora_weight_arrays[parsed.name + '_model'] = numbers;
                        // The legacy string helper rounds to two decimals; preserve generated increments exactly.
                        config.loras = config.loras.filter(item => item && item !== 'None').map((item, i) => i === adapterIndex ? `${parsed.name}:${numbers[0]}:${numbers[0]}` : item);
                    }),
                }));
            }
            if (config.lora_bypass_states?.[parsed.name]) card.append(element('p', 'cb-guide-notice', 'This LoRA is disabled in the advanced editor.'));
            card.append(button('Remove LoRA', () => { change(() => { config.loras = adapters.filter((_, i) => i !== adapterIndex); }); redraw(); }));
            content.append(card);
        });
        const addPicker = select(['Choose a LoRA', ...resources.availableLoras.filter(value => value !== 'None')], 'Choose a LoRA', value => {
            if (value === 'Choose a LoRA') return;
            change(() => { config.loras = [...adapters, buildLoraString(value, 1.0, 1.0)]; });
            redraw();
        });
        field(content, 'Add a LoRA', addPicker);
        disclosure(content, 'Advanced LoRA controls', panel => hooks.renderLorasSection(node, panel, config, index, resources.availableLoras, resources.loraFolders));
    } else if (step === 1) {
        if (inputSource(generator, 'optional_positive') || inputSource(generator, 'optional_negative')) {
            content.append(element('p', 'cb-guide-notice', 'Connected conditioning takes priority over prompt text. Disconnect it on the generator to test the prompts below.'));
        }
        const prompts = simplePrompts(node.state.global_positive_groups);
        if (prompts === null) {
            content.append(element('p', 'cb-guide-notice', 'This workflow uses nested prompt combinations. They remain unchanged; use the advanced prompt editor below.'));
            content.append(element('p', 'cb-guide-muted', `${promptCount(node.state.global_positive_groups)} prompt combinations are configured.`));
        } else {
            const displayed = prompts.length ? prompts : [''];
            displayed.forEach((prompt, i) => {
                const input = element('textarea');
                input.rows = 4;
                input.value = prompt;
                input.onchange = () => change(() => {
                    const updated = [...(simplePrompts(node.state.global_positive_groups) || displayed)]; updated[i] = input.value;
                    node.state.global_positive_groups = [updated];
                });
                field(content, `Prompt ${i + 1}`, input);
                if (displayed.length > 1) content.append(button(`Remove prompt ${i + 1}`, () => {
                    change(() => { node.state.global_positive_groups = [simplePrompts(node.state.global_positive_groups).filter((_, index) => index !== i)]; }); redraw();
                }));
            });
            content.append(button('Add another prompt', () => {
                change(() => { node.state.global_positive_groups = [[...(simplePrompts(node.state.global_positive_groups) || displayed), '']]; }); redraw();
            }));
        }
        const negative = element('textarea');
        negative.rows = 2;
        negative.value = node.state.global_negative || '';
        negative.onchange = () => change(() => { node.state.global_negative = negative.value; });
        field(content, 'Negative prompt (optional)', negative, 'Leave empty if your model does not use a negative prompt.');
        if (config.use_custom_prompts) content.append(element('p', 'cb-guide-notice', 'This setup has its own prompt settings enabled. Its positive prompts replace the shared prompts above when provided. For a direct LoRA comparison, use the same shared prompts in every setup.'));
        disclosure(content, 'Prompt groups and separate prompts for this setup', panel => {
            hooks.renderGlobalPromptsSection(node, panel);
            hooks.renderConfigPromptsSection(node, panel, config, index);
        });
    } else if (step === 2) {
        // Identical recipes start in shared scope; differing recipes retain per-setup editing until chosen explicitly.
        const signature = item => JSON.stringify(SAMPLING_KEYS.map(key => item[key]));
        const identical = arrays.every(item => signature(item) === signature(arrays[0]));
        const scope = ui.samplingScope ?? (identical ? 'all' : String(index));
        const selectedIndex = scope === 'all' ? null : Math.max(0, Math.min(arrays.length - 1, Number(scope)));
        const sampling = arrays[selectedIndex ?? 0];
        if (arrays.length > 1) {
            const scopeSelect = document.createElement('select');
            scopeSelect.add(new Option(`All ${arrays.length} setups`, 'all', false, scope === 'all'));
            arrays.forEach((item, i) => scopeSelect.add(new Option(item.name || `Setup ${i + 1}`, i, false, selectedIndex === i)));
            scopeSelect.onchange = () => { ui.samplingScope = scopeSelect.value; redraw(); };
            field(content, 'Apply changes to', scopeSelect, selectedIndex === null
                ? 'Each value you edit is applied to every setup. LoRAs, prompts and seeds stay unchanged.'
                : 'Only this setup changes. Choose All setups above to use the same sampling values everywhere.');
        }
        if (!identical && selectedIndex === null) content.append(element('p', 'cb-guide-notice', 'The setups currently differ. Values shown come from the first setup; each field you edit is copied to all setups.'));
        const save = (key, value) => change(() => applySamplingValue(arrays, selectedIndex, key, value));
        content.append(element('h3', '', 'Sampling methods'));
        content.append(element('p', 'cb-guide-muted', 'Tick one value to keep it fixed, or several to compare every combination.'));
        const grid = element('div', 'cb-guide-grid');
        choiceList(grid, 'Samplers', sampling.samplers?.length ? sampling.samplers : ['euler'], resources.modelLists.samplers || [], value => save('samplers', value));
        choiceList(grid, 'Schedulers', sampling.schedulers?.length ? sampling.schedulers : ['normal'], resources.modelLists.schedulers || [], value => save('schedulers', value));
        content.append(grid);
        content.append(element('h3', '', 'Steps, guidance and size'));
        const parameters = element('div', 'cb-guide-grid');
        for (const [key, label] of [['steps', 'Denoising steps'], ['cfg', 'Guidance (CFG)']]) {
            textField(parameters, label, Array.isArray(sampling[key]) ? sampling[key].join(', ') : sampling[key], value => save(key, value),
                key === 'steps' ? 'Example: 9, 12, 16' : 'Example: 1.0, 2.0', value => {
                    try {
                        const numbers = parseNumberList(value, 'strength').map(Number);
                        return numbers.every(n => n >= (key === 'steps' ? 1 : 0) && (key !== 'steps' || Number.isInteger(n)))
                            ? '' : `Enter ${key === 'steps' ? 'positive whole numbers' : 'non-negative numbers'} separated by commas.`;
                    } catch (error) { return error.message; }
                });
        }
        textField(parameters, 'Output size', (sampling.resolutions || []).map(value => Array.isArray(value) ? value.join('x') : value).join(', '), value =>
            save('resolutions', values(value).map(size => size.toLowerCase().replace(/\s/g, ''))),
            'Width x height in pixels. Example: 896x1344. Use commas for several sizes.', value =>
            (!value.trim() || value.split(',').every(size => /^\s*\d+\s*x\s*\d+\s*$/i.test(size) && size.toLowerCase().split('x').every(n => Number(n) >= 64 && Number(n) % 8 === 0)))
                ? '' : 'Use width x height, with both dimensions at least 64 and divisible by 8.');
        content.append(parameters);
        if (inputSource(generator, 'optional_latent')) content.append(element('p', 'cb-guide-notice', 'A connected latent supplies image dimensions and may add batch images.'));
        disclosure(content, 'Advanced options for the selected setup', panel => panel.append(hooks.createConfigArrayElement(node, sampling, selectedIndex ?? 0, resources.modelLists)));
    } else if (step === 3) {
        renderSeedControls(node, content);
        if (!node.state.seed_values?.trim()) {
            content.append(element('p', 'cb-guide-notice', 'No shared list is set. Each setup retains its previously saved seed and seed policy. Enter or generate a list to use the same seeds for every setup.'));
        }
    } else {
        let sharedSeeds = [];
        try { sharedSeeds = parseNumberList(node.state.seed_values || '', 'seed', true); }
        catch (error) {
            content.append(element('p', 'cb-guide-notice', error.message));
            content.append(button('Edit seed list', () => navigate(3)));
        }
        if (sharedSeeds.length) {
            content.append(element('h3', '', `${sharedSeeds.length} seeds for every settings group`));
            content.append(element('p', 'cb-guide-muted', sharedSeeds.slice(0, 8).map((seed, i) => `S${i} = ${seed}`).join(' · ') +
                (sharedSeeds.length > 8 ? ` · ${sharedSeeds.length} seeds total` : '')));
        }
        textField(content, 'Session name', node.state.session_name, value => change(() => { node.state.session_name = value; }),
            'Results are saved in output/benchmarks/<session name>/. Existing matching images are skipped unless overwrite is enabled.',
            value => /^[\w-]+$/.test(value) ? '' : 'Use letters, numbers, underscores or hyphens.');
        const table = element('table', 'cb-guide-review');
        const caption = element('caption', '', `${arrays.length} comparison${arrays.length === 1 ? '' : 's'} in this run`);
        table.append(caption);
        const head = element('thead'); const hr = element('tr');
        ['Comparison', 'Sampling', 'LoRAs / strengths', 'Seed'].forEach(label => hr.append(element('th', '', label)));
        head.append(hr); table.append(head);
        const body = element('tbody');
        arrays.forEach((item, i) => {
            const row = element('tr'); const name = element('td');
            name.append(button(item.name || `Comparison ${i + 1}`, () => { ui.guidedConfig = i; ui.samplingScope = String(i); navigate(2); }));
            row.append(name,
                element('td', '', `${list(item.samplers).join(', ')} / ${list(item.schedulers).join(', ')} · ${item.steps} steps · CFG ${item.cfg} · ${(item.resolutions || []).map(size => Array.isArray(size) ? size.join('x') : size).join(', ') || 'Generator size'}`),
                element('td', '', (item.loras || ['None']).map(lora => {
                    const parsed = parseLoraString(lora);
                    return parsed.name === 'None' ? 'No LoRA' : `${parsed.name.split(/[\\/]/).pop().replace(/\.safetensors$/i, '')}: ${(item.lora_weight_arrays?.[parsed.name + '_model'] || [parsed.model_str]).join(', ')}`;
                }).join(' + ') || 'No LoRA'),
                element('td', 'cb-guide-number', sharedSeeds.length ? `S0${sharedSeeds.length > 1 ? `–S${sharedSeeds.length - 1}` : ''}` : String(item.full_run_seed || 0)));
            body.append(row);
        });
        table.append(body);
        const scroll = element('div', 'cb-guide-table-scroll'); scroll.append(table); content.append(scroll);
        const wiring = element('ul', 'cb-guide-checks');
        wiring.append(element('li', '', generator ? 'Config Builder is connected to the generator.' : 'Connect configs_json to Ultimate Sampler Grid before running.'));
        wiring.append(element('li', '', dashboard ? 'Generator is connected to the results dashboard.' : 'Connect dashboard_html to Ultimate Grid Dashboard to see your results.'));
        content.append(wiring);
        if (node.state.overwrite_existing) content.append(element('p', 'cb-guide-notice', 'Overwrite is enabled. Existing matching images will be regenerated.'));
        const enabled = [node.state.distribution_enabled && 'distributed workers', node.state.upscaling?.enabled && 'upscaling', node.state.cooldown?.enabled && 'GPU cooldown', node.state.start_at_job > 0 && `start at job ${node.state.start_at_job}`].filter(Boolean);
        if (enabled.length) content.append(element('p', 'cb-guide-notice', `Also enabled: ${enabled.join(', ')}. Check advanced run settings before starting.`));
        disclosure(content, 'Advanced run settings', panel => hooks.renderRunSettingsSection(node, panel));
        disclosure(content, 'Presets and saved sessions', panel => panel.append(hooks.createTopBar(node, resources.topBarOptions)));
    }
    root.append(content);
    const footer = element('footer', 'cb-guide-footer');
    const summary = element('div', 'cb-guide-total');
    const total = element('strong', '', 'Calculating image count…');
    const detail = element('span', 'cb-guide-muted', 'Planned base images across all comparisons.');
    total.setAttribute('role', 'status'); total.setAttribute('aria-live', 'polite');
    summary.append(total, detail);
    footer.append(summary);
    const actions = element('div', 'cb-guide-actions');
    if (step > 0) actions.append(button('Back', () => navigate(step - 1)));
    let runButton;
    if (step < STEPS.length - 1) actions.append(button(step === 3 ? 'Review test' : `Next: ${STEPS[step + 1]}`, () => navigate(step + 1), 'cb-guide-primary'));
    else {
        runButton = button('Run comparison', async () => {
            if ([...root.querySelectorAll('input,textarea,select')].some(input => !input.reportValidity())) return;
            if (!node.queueComparison || !node._guidedPreviewValid) return;
            runButton.disabled = true;
            runButton.textContent = 'Sending to ComfyUI…';
            try {
                const success = await node.queueComparison();
                total.textContent = success === false ? 'ComfyUI could not queue this workflow. Check its error message.' : 'Workflow sent. Results appear in the connected dashboard.';
            } catch (error) { total.textContent = `Could not start: ${error.message}`; }
            finally { runButton.disabled = false; runButton.textContent = 'Run comparison'; }
        }, 'cb-guide-primary');
        runButton.disabled = !generator || !dashboard || !node.queueComparison;
        actions.append(runButton);
        detail.textContent = 'Runs the current ComfyUI workflow once, including its other enabled outputs.';
    }
    footer.append(actions); root.append(footer);
    const jsonDetails = disclosure(content, 'Configuration JSON', panel => {
        const pre = element('pre'); pre.textContent = node._guidedLastJSON || ''; panel.append(pre);
    });
    const preview = element('pre'); preview.id = 'json-preview'; preview.hidden = true; root.append(preview);
    node._guidedPreview = (data, error) => {
        node._guidedPreviewValid = false;
        if (runButton) runButton.disabled = true;
        if (!data) { total.textContent = error ? `Preview unavailable: ${error}` : 'Calculating image count…'; return; }
        try {
            node._guidedLastJSON = data.configs_json;
            const payload = JSON.parse(data.configs_json);
            if (node.state.seed_values?.trim()) {
                const expected = parseNumberList(node.state.seed_values, 'seed').join(', ');
                if (payload._session_settings?.seed_values !== expected) {
                    throw new Error('Restart ComfyUI to enable shared seed lists, then refresh the browser.');
                }
            }
            const count = plannedImageCount(payload);
            node._guidedPreviewValid = true;
            if (runButton) runButton.disabled = !generator || !dashboard || !node.queueComparison;
            total.textContent = count === null ? 'Image count depends on advanced settings' : `${count.toLocaleString()} base image${count === 1 ? '' : 's'} planned`;
            if (inputSource(generator, 'optional_latent')) total.textContent += ' · latent batch not included';
            const visibleJSON = jsonDetails.querySelector('pre');
            if (visibleJSON) visibleJSON.textContent = data.configs_json;
        } catch (error) { total.textContent = `Preview unavailable: ${error.message || 'invalid configuration response'}`; }
    };
    const style = element('style');
    style.textContent = GUIDED_STYLES;
    node.htmlContainer.replaceChildren(style, root);
    if (ui.guidedFocus) { heading.focus({ preventScroll: true }); ui.guidedFocus = false; }
    return root;
}

// Container queries follow the node's width on the canvas, not the browser viewport.
const GUIDED_STYLES = `
.cb-guided { --guide-ground:#111; --guide-surface:#1c1c1c; --guide-raised:#292929;
    --guide-text:#f4f4f4; --guide-muted:#b4b4b4; --guide-line:#555; --guide-focus:#82c6f5;
    color:var(--guide-text); background:var(--guide-ground); font:14px/1.5 system-ui,sans-serif;
    height:100%; min-height:0; display:flex; flex-direction:column; container-type:inline-size; box-sizing:border-box; }
.cb-guided *, .cb-guided *::before, .cb-guided *::after { box-sizing:border-box; }
.cb-guided h1 { font-size:22px; line-height:1.2; letter-spacing:-.02em; margin:0; font-weight:600; }
.cb-guided h2 { font-size:20px; line-height:1.3; margin:0 0 8px; font-weight:600; }
.cb-guided h3 { font-size:16px; margin:24px 0 8px; font-weight:600; }
.cb-guided p { margin:8px 0 16px; }
.cb-guide-muted { color:var(--guide-muted); font-size:13px; overflow-wrap:anywhere; }
.cb-guide-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px 12px; }
.cb-guide-header p { margin:5px 0 0; }
.cb-guided button, .cb-guided input, .cb-guided select, .cb-guided textarea {
    font:inherit; color:var(--guide-text); border:1px solid var(--guide-line); border-radius:6px;
    background:var(--guide-surface); min-height:40px; padding:8px 12px; max-width:100%; }
.cb-guided input, .cb-guided select, .cb-guided textarea { width:100%; }
.cb-guided textarea { resize:vertical; min-height:80px; }
.cb-guided button { cursor:pointer; touch-action:manipulation; }
.cb-guided button:active:not(:disabled) { background:var(--guide-raised); }
.cb-guided button:disabled { cursor:not-allowed; color:var(--guide-muted); border-color:var(--guide-raised); }
.cb-guided :focus-visible { outline:2px solid var(--guide-focus); outline-offset:3px; }
.cb-guide-nav { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:4px; padding:8px 20px 12px; }
.cb-guide-nav button { border:none; border-bottom:2px solid transparent; background:transparent; color:var(--guide-muted); text-align:left; border-radius:0; padding:8px; }
.cb-guide-nav [aria-current] { color:var(--guide-text); border-bottom-color:currentColor; font-weight:600; }
.cb-guide-content { flex:1; overflow:auto; min-height:0; padding:20px 24px 24px; scrollbar-gutter:stable; }
.cb-guide-content > * { max-width:100%; }
.cb-guide-field { display:flex; flex-direction:column; gap:8px; margin:0 0 20px; min-width:0; }
.cb-guide-field > span:first-child { font-weight:500; }
.cb-guide-field > label { display:flex; flex-direction:column; gap:8px; color:var(--guide-muted); font-size:13px; }
.cb-guide-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 24px; }
.cb-guide-choice { min-width:0; border:0; background:var(--guide-surface); padding:12px; margin:0 0 20px; }
.cb-guide-choice legend { font-weight:600; padding:0 4px; }
.cb-guide-choice-list { max-height:168px; overflow:auto; }
.cb-guide-choice-list label { display:flex; align-items:center; gap:10px; min-height:36px; cursor:pointer; overflow-wrap:anywhere; }
.cb-guided .cb-guide-choice-list input { width:18px; height:18px; min-height:18px; flex:none; padding:0; accent-color:var(--guide-text); }
.cb-guide-choice [role=status]:empty { display:none; }
.cb-guide-sources { display:grid; grid-template-columns:110px minmax(0,1fr); gap:12px 20px; background:var(--guide-surface); padding:16px; margin:20px 0; }
.cb-guide-sources dt { color:var(--guide-muted); }
.cb-guide-sources dd { margin:0; overflow-wrap:anywhere; }
.cb-guide-notice { background:var(--guide-surface); padding:12px 16px; overflow-wrap:anywhere; }
.cb-guide-adapter { border:0; padding:16px; background:var(--guide-surface); margin:16px 0 20px; min-width:0; }
.cb-guide-adapter legend { font-weight:600; padding:0 4px; }
.cb-guide-adapter input, .cb-guide-adapter select { background:var(--guide-ground); }
.cb-guide-disclosure { margin:20px 0; }
.cb-guide-disclosure summary { cursor:pointer; padding:10px 0; font-weight:500; min-height:40px; }
.cb-guide-disclosure-body { padding:12px 0 0; }
.cb-guide-disclosure pre { white-space:pre-wrap; overflow-wrap:anywhere; font-size:12px; }
.cb-guide-table-scroll { overflow-x:auto; }
.cb-guide-review { width:100%; border-collapse:collapse; table-layout:fixed; font-size:13px; margin:12px 0 20px; }
.cb-guide-review caption { text-align:left; font-weight:600; font-size:16px; margin-bottom:16px; }
.cb-guide-review th { text-align:left; font-weight:500; color:var(--guide-muted); padding:8px; }
.cb-guide-review td { vertical-align:top; padding:12px 8px; border-top:1px solid var(--guide-raised); overflow-wrap:anywhere; }
.cb-guide-review th:last-child, .cb-guide-review .cb-guide-number { text-align:right; font-variant-numeric:tabular-nums; }
.cb-guide-review td button { border:0; background:transparent; padding:0; text-align:left; overflow-wrap:anywhere; }
.cb-guide-checks { padding-left:20px; }
.cb-guide-checks li { margin:12px 0; }
.cb-guide-footer { flex-shrink:0; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 24px; background:var(--guide-surface); }
.cb-guide-total { display:flex; flex-direction:column; gap:4px; min-width:0; }
.cb-guide-total strong { font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; }
.cb-guide-actions { display:flex; flex-shrink:0; gap:8px; }
.cb-guided .cb-guide-primary { background:var(--guide-text); border-color:var(--guide-text); color:var(--guide-ground); font-weight:600; }
.cb-guided .cb-guide-primary:active:not(:disabled) { background:#d5d5d5; }
.cb-guide-prompt-list { padding-left:20px; }
.cb-guide-prompt-list li { margin:12px 0; }
@media (hover:hover) and (pointer:fine) {
    .cb-guided button:hover:not(:disabled) { border-color:var(--guide-text); }
    .cb-guide-nav button:hover { color:var(--guide-text); }
}
@container (max-width:620px) {
    .cb-guide-header { padding:16px; align-items:flex-start; flex-wrap:wrap; }
    .cb-guide-nav { grid-template-columns:repeat(2,minmax(0,1fr)); padding:4px 8px 12px; }
    .cb-guide-nav button:last-child { grid-column:1 / -1; }
    .cb-guide-content { padding:16px; }
    .cb-guide-grid { grid-template-columns:1fr; }
    .cb-guide-footer { padding:16px; flex-wrap:wrap; }
    .cb-guide-actions { width:100%; justify-content:flex-end; flex-wrap:wrap; }
    .cb-guide-sources { grid-template-columns:1fr; gap:4px; }
    .cb-guide-sources dd { margin-bottom:12px; }
    .cb-guide-review { min-width:600px; }
}
@media (prefers-contrast:more) { .cb-guided { --guide-line:#aaa; --guide-muted:#ddd; } }
`;
