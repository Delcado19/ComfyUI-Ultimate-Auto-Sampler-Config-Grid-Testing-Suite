/** Shared numeric-list generators. Seeds remain decimal strings to preserve all 64 bits. */
export const MAX_LIST_VALUES = 10000;
const MAX_SEED = (1n << 64n) - 1n;

function canonicalValue(value, kind) {
    const token = String(value).trim();
    if (kind === 'seed') {
        if (!/^[0-9]+$/.test(token)) throw new Error('Seeds must be non-negative whole numbers. Separate values with commas.');
        const digits = token.replace(/^0+(?=\d)/, '');
        if (digits.length > 20 || BigInt(digits) > MAX_SEED) throw new Error(`Seeds must be between 0 and ${MAX_SEED}.`);
        return BigInt(digits).toString();
    }
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token) || !Number.isFinite(Number(token))) {
        throw new Error('Enter finite strength values with decimal points, separated by commas. Example: 0.7, 0.85, 1.0.');
    }
    return String(Number(token));
}

/** Empty comma slots are errors, not values silently filtered out. Duplicates keep their first position. */
export function parseNumberList(text, kind, allowEmpty = false) {
    if (typeof text !== 'string') throw new Error('Enter a comma-separated list.');
    if (!text.trim()) {
        if (allowEmpty) return [];
        throw new Error('Enter at least one value or generate a range.');
    }
    const tokens = text.split(',');
    if (tokens.length > MAX_LIST_VALUES) throw new Error(`Use at most ${MAX_LIST_VALUES} values.`);
    if (tokens.some(token => !token.trim())) throw new Error('Empty entry: remove repeated commas or a comma at the start or end.');
    return [...new Set(tokens.map(token => canonicalValue(token, kind)))];
}

function decimalParts(text) {
    const [mantissa, exponent = '0'] = text.toLowerCase().split('e');
    const fraction = mantissa.split('.')[1]?.length || 0;
    return { coefficient: BigInt(mantissa.replace('.', '')), scale: fraction - Number(exponent) };
}

function decimalString(value, scale) {
    const sign = value < 0n ? '-' : '';
    const digits = (value < 0n ? -value : value).toString().padStart(scale + 1, '0');
    return sign + (scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits);
}

export function generateNumberRange(start, end, increment, kind) {
    const parsed = [start, end, increment].map(value => canonicalValue(value, kind));
    let numbers, scale = 0;
    if (kind === 'seed') numbers = parsed.map(BigInt);
    else {
        const parts = parsed.map(decimalParts);
        scale = Math.max(0, ...parts.map(part => part.scale));
        // Integer-scaled decimal arithmetic avoids 0.1 + 0.2 artifacts and cumulative drift.
        numbers = parts.map(part => part.coefficient * 10n ** BigInt(scale - part.scale));
    }
    const [first, last, step] = numbers;
    if (step <= 0n) throw new Error('Increment must be greater than zero.');
    if (last < first) throw new Error('End must be greater than or equal to start.');
    const count = (last - first) / step + 1n;
    if (count > BigInt(MAX_LIST_VALUES)) throw new Error(`This range exceeds ${MAX_LIST_VALUES} values. Increase the increment or reduce the range.`);
    return Array.from({ length: Number(count) }, (_, index) => {
        const value = first + BigInt(index) * step;
        return kind === 'seed' ? value.toString() : canonicalValue(decimalString(value, scale), kind);
    });
}

export function appendNumberValues(text, additions, kind) {
    const current = parseNumberList(text, kind, true);
    const added = parseNumberList(additions.join(', '), kind);
    return parseNumberList([...new Set([...current, ...added])].join(', '), kind).join(', ');
}

export function generateRandomSeeds(count) {
    const size = Number(count);
    if (!Number.isInteger(size) || size < 1 || size > MAX_LIST_VALUES) throw new Error(`Random count must be between 1 and ${MAX_LIST_VALUES}.`);
    const seeds = new Set();
    const words = new Uint32Array(2);
    while (seeds.size < size) {
        globalThis.crypto.getRandomValues(words);
        seeds.add(((BigInt(words[0]) << 32n) | BigInt(words[1])).toString());
    }
    return [...seeds];
}

let editorId = 0;

/** Both generators append to the visible draft, including manually entered values not yet committed. */
export function createNumberListEditor({ kind, label, value, onChange, uiState }) {
    const root = document.createElement('fieldset');
    root.className = 'cb-number-list';
    const style = document.createElement('style'); style.textContent = NUMBER_STYLES; root.append(style);
    const legend = document.createElement('legend'); legend.textContent = label; root.append(legend);
    const helpId = `cb-number-help-${++editorId}`;
    const statusId = `cb-number-status-${editorId}`;
    const makeField = (parent, text, control) => {
        const wrapper = document.createElement('label');
        const title = document.createElement('span'); title.textContent = text;
        wrapper.append(title, control); parent.append(wrapper); return control;
    };
    const makeInput = (name, fallback) => {
        const input = document.createElement('input'); input.type = 'text'; input.className = 'cb-input';
        input.inputMode = kind === 'seed' ? 'numeric' : 'decimal';
        input.value = uiState[name] ?? fallback;
        input.oninput = () => { uiState[name] = input.value; };
        return input;
    };
    const range = document.createElement('div'); range.className = 'cb-number-range';
    const start = makeField(range, 'Start', makeInput('start', kind === 'seed' ? '0' : '0.5'));
    const end = makeField(range, 'End', makeInput('end', kind === 'seed' ? '10' : '1.5'));
    const increment = makeField(range, 'Increment', makeInput('increment', kind === 'seed' ? '1' : '0.1'));
    root.append(range);
    const actions = document.createElement('div'); actions.className = 'cb-number-actions'; root.append(actions);
    const makeButton = (text, handler) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'cb-button';
        button.textContent = text; button.onclick = handler; return button;
    };
    const draft = document.createElement('textarea'); draft.className = 'cb-input'; draft.rows = 3;
    draft.value = value || ''; draft.spellcheck = false; draft.setAttribute('aria-describedby', `${helpId} ${statusId}`);
    const status = document.createElement('p'); status.id = statusId; status.className = 'cb-number-status'; status.setAttribute('role', 'status');
    const mapping = document.createElement('p'); mapping.className = 'cb-number-mapping';
    const updateMapping = () => {
        if (kind !== 'seed') return;
        try {
            const seeds = parseNumberList(draft.value, kind, true);
            mapping.textContent = seeds.slice(0, 8).map((seed, index) => `S${index} = ${seed}`).join(' · ') +
                (seeds.length > 8 ? ` · ${seeds.length} seeds total` : '');
        } catch { mapping.textContent = ''; }
    };
    const fail = (error, markField = true) => {
        if (markField) { draft.setCustomValidity(error.message); draft.setAttribute('aria-invalid', 'true'); }
        status.textContent = error.message; status.dataset.error = 'true';
    };
    const commit = () => {
        const parsed = parseNumberList(draft.value, kind, kind === 'seed');
        const duplicates = draft.value.trim() && draft.value.split(',').length > parsed.length;
        draft.value = parsed.join(', ');
        draft.setCustomValidity(''); draft.removeAttribute('aria-invalid'); delete status.dataset.error;
        onChange(draft.value);
        status.textContent = duplicates ? 'List checked. Duplicate values were merged.' : 'List checked.';
        updateMapping();
    };
    const append = generator => {
        try {
            const additions = generator();
            draft.value = appendNumberValues(draft.value, additions, kind);
            commit();
            status.textContent = 'Generated values added to the list. Duplicates are kept once.';
        } catch (error) {
            // Unapplied range settings must not invalidate an otherwise valid saved list.
            let invalidDraft = false;
            try { parseNumberList(draft.value, kind, kind === 'seed'); } catch { invalidDraft = true; }
            fail(error, invalidDraft);
        }
    };
    actions.append(makeButton('Generate range', () => append(() => generateNumberRange(start.value, end.value, increment.value, kind))));
    if (kind === 'seed') {
        const count = makeField(actions, 'Random count', makeInput('randomCount', '3'));
        actions.append(makeButton('Generate random seeds', () => append(() => generateRandomSeeds(count.value))));
    }
    makeField(root, kind === 'seed' ? 'Seed values (comma-separated)' : 'Strength values (comma-separated)', draft);
    const help = document.createElement('p'); help.id = helpId; help.className = 'cb-number-help';
    help.textContent = kind === 'seed'
        ? 'Applies to every comparison group. Enter whole numbers separated by commas. Random seeds use the full 64-bit range. An empty list keeps existing per-group seeds.'
        : 'Enter strengths with decimal points, separated by commas. Example: 0.7, 0.85, 1.0. Start and end use an inclusive range when the increment reaches the end.';
    root.append(help, status, mapping);
    draft.oninput = () => { draft.setCustomValidity(''); draft.removeAttribute('aria-invalid'); status.textContent = 'List changed; checked when you leave the field.'; delete status.dataset.error; };
    draft.onchange = () => { try { commit(); } catch (error) { fail(error); } };
    // Validate restored state as well; invalid imported lists must never look ready to run.
    try { parseNumberList(draft.value, kind, kind === 'seed'); updateMapping(); } catch (error) { fail(error); }
    return root;
}

const NUMBER_STYLES = `
.cb-number-list { min-width:0; margin:20px 0; padding:16px; border:0; background:#1c1c1c; color:#f4f4f4; font:14px/1.5 system-ui,sans-serif; }
.cb-number-list legend { font-weight:600; padding:0 4px; }
.cb-number-list label { display:flex; flex-direction:column; gap:6px; min-width:0; margin-bottom:12px; }
.cb-number-range { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.cb-number-list input, .cb-number-list textarea { width:100%; min-height:40px; padding:8px 10px; box-sizing:border-box; font:inherit; color:inherit; border:1px solid #555; border-radius:6px; background:#111; }
.cb-number-list textarea { resize:vertical; }
.cb-number-list button { cursor:pointer; min-height:40px; padding:8px 12px; font:inherit; color:inherit; border:1px solid #555; border-radius:6px; background:#292929; margin:0; }
.cb-number-list :focus-visible { outline:2px solid #82c6f5; outline-offset:3px; }
.cb-number-actions { display:flex; align-items:flex-end; flex-wrap:wrap; gap:12px; margin:4px 0 20px; }
.cb-number-actions label { width:110px; margin:0; }
.cb-number-help, .cb-number-status, .cb-number-mapping { color:#b4b4b4; font-size:13px; overflow-wrap:anywhere; }
.cb-number-status:empty, .cb-number-mapping:empty { display:none; }
.cb-number-status[data-error] { color:#ffb6b6; }
.cb-number-list [aria-invalid] { border-color:#ffb6b6; }
@container (max-width:420px) { .cb-number-range { gap:8px; } .cb-number-list { padding:12px; } }
`;
