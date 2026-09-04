function cloneValue(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function decimalPlaces(value) {
  const s = String(value).trim().toLowerCase();
  if (s.includes('e-')) {
    const [base, exp] = s.split('e-');
    const baseDecimals = (base.split('.')[1] || '').length;
    return baseDecimals + Number(exp || 0);
  }
  return (s.split('.')[1] || '').length;
}

function formatScaledInt(value, scale, places) {
  const num = value / scale;
  return places > 0 ? Number(num.toFixed(places)) : num;
}

export function buildStrengthValues(start, end, step) {
  const startNum = Number(start);
  const endNum = Number(end);
  const stepNum = Number(step);

  if (![startNum, endNum, stepNum].every(Number.isFinite)) {
    throw new Error('Strength range contains an invalid number.');
  }
  if (stepNum <= 0) throw new Error('Strength step must be greater than 0.');
  if (endNum < startNum) throw new Error('Strength end must be greater than or equal to start.');

  const places = Math.min(8, Math.max(decimalPlaces(start), decimalPlaces(end), decimalPlaces(step)));
  const scale = 10 ** places;
  const startInt = Math.round(startNum * scale);
  const endInt = Math.round(endNum * scale);
  const stepInt = Math.round(stepNum * scale);

  if (stepInt <= 0) throw new Error('Strength step is too small for the selected precision.');

  const values = [];
  for (let current = startInt; current <= endInt; current += stepInt) {
    values.push(formatScaledInt(current, scale, places));
    if (values.length > 10000) throw new Error('Strength range expands to more than 10,000 values.');
  }

  if (values.length === 0) values.push(startNum);
  return values;
}

export function parseSeedList(input) {
  const raw = Array.isArray(input) ? input.join('\n') : String(input ?? '');
  const seen = new Set();
  const seeds = [];

  const chunks = raw.split(/[\n;]+/);
  for (let chunk of chunks) {
    // Allow human-friendly labels such as `S0 12345` without treating the
    // index in S0/S1/S2 as another seed.
    chunk = chunk.replace(/\bS\d+\b/gi, ' ');
    const matches = chunk.match(/\d+/g) || [];
    for (const token of matches) {
      const normalized = token.replace(/^0+(?=\d)/, '');
      const seed = normalized || '0';
      if (!seen.has(seed)) {
        seen.add(seed);
        seeds.push(seed);
      }
    }
  }
  return seeds;
}

export function parseLoraName(loraString) {
  return String(loraString || '').split(':', 1)[0].trim();
}

function getExistingClipStrength(loraString) {
  const segments = String(loraString || '').split(':');
  if (segments.length >= 3 && segments[2].trim()) return segments[2].trim();
  if (segments.length >= 2 && segments[1].trim()) return segments[1].trim();
  return '1.0';
}

function replaceTargetLora(loras, targetLoraName, strengthValues, lockClipToModel) {
  const valuesText = strengthValues.join(', ');
  let found = false;

  const replaced = (Array.isArray(loras) ? loras : [loras]).map((lora) => {
    if (parseLoraName(lora) !== targetLoraName) return lora;
    found = true;
    if (lockClipToModel) return `${targetLoraName}:[${valuesText}]`;
    return `${targetLoraName}:[${valuesText}]:${getExistingClipStrength(lora)}`;
  });

  if (!found) throw new Error(`Target LoRA not found in template: ${targetLoraName}`);
  return replaced;
}

function enabledRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => row && row.enabled !== false);
}

export function estimateMatrixImages(rows, seeds) {
  const parsedSeeds = parseSeedList(seeds);
  if (parsedSeeds.length === 0) return 0;

  return enabledRows(rows).reduce((total, row) => {
    const strengthCount = buildStrengthValues(row.strength_from, row.strength_to, row.strength_step).length;
    return total + (strengthCount * parsedSeeds.length);
  }, 0);
}

export function buildMatrixConfigArrays(templateConfig, rows, seeds, targetLoraName, options = {}) {
  if (!templateConfig || typeof templateConfig !== 'object') throw new Error('A source config is required.');
  if (!targetLoraName) throw new Error('Select a target LoRA to sweep.');

  const activeRows = enabledRows(rows);
  if (activeRows.length === 0) throw new Error('Enable at least one matrix row.');

  const parsedSeeds = parseSeedList(seeds);
  if (parsedSeeds.length === 0) throw new Error('Enter at least one explicit seed.');

  const lockClipToModel = options.lockClipToModel !== false;
  const result = [];

  activeRows.forEach((row, rowIndex) => {
    const sampler = String(row.sampler || '').trim();
    const scheduler = String(row.scheduler || '').trim();
    if (!sampler) throw new Error(`Row ${rowIndex + 1}: sampler is required.`);
    if (!scheduler) throw new Error(`Row ${rowIndex + 1}: scheduler is required.`);

    const strengthValues = buildStrengthValues(row.strength_from, row.strength_to, row.strength_step);

    parsedSeeds.forEach((seed) => {
      const config = cloneValue(templateConfig);
      config.name = `Matrix ${rowIndex + 1} · ${sampler}/${scheduler} · seed ${seed}`;
      config.samplers = [sampler];
      config.schedulers = [scheduler];
      config.seed_behavior = 'fixed';
      config.full_run_seed_behavior = 'fixed';
      config.full_run_seed = seed;
      config.loras = replaceTargetLora(config.loras || ['None'], targetLoraName, strengthValues, lockClipToModel);

      if (config.lora_weight_arrays && typeof config.lora_weight_arrays === 'object') {
        delete config.lora_weight_arrays[`${targetLoraName}_model`];
        delete config.lora_weight_arrays[`${targetLoraName}_clip`];
      }

      config.matrix_note = String(row.note || '');
      config.matrix_strength_values = strengthValues;
      config.matrix_seed = seed;
      result.push(config);
    });
  });

  return result;
}
