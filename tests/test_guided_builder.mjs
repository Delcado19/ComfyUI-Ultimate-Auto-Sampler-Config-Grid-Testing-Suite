import test from 'node:test';
import assert from 'node:assert/strict';
import { plannedImageCount, connectedGenerator, applySamplingValue } from '../web/conf_builder/conf-builder-guided.js';
import { parseNumberList, generateNumberRange, appendNumberValues, generateRandomSeeds } from '../web/conf_builder/conf-builder-numbers.js';

test('Screen-L matrix counts prompts, fixed seeds, no-LoRA controls and locked strengths', () => {
    const configs = [];
    for (const seed of [127749309465779, 127749309465780, 127749309465781]) {
        for (const lora of ['None', 'ZImageTurbo/screen_l.safetensors:[0.7, 0.85, 1.0, 1.15, 1.3]']) {
            configs.push({ sampler: ['euler', 'dpmpp_sde'], scheduler: 'simple', steps: 9, cfg: 1,
                lora, seed, positive: [['trigger-only prompt', 'material-assisted prompt']], resolutions: [[896, 1344]] });
        }
    }
    const payload = { configs, _session_settings: { add_random_seeds_to_gens: 0 } };
    const before = JSON.stringify(payload);
    assert.equal(plannedImageCount(payload), 72);
    assert.equal(JSON.stringify(payload), before, 'Counting must not mutate the saved recipe');
});

test('stacked strengths form a product and prompt lists pair when their lengths match', () => {
    assert.equal(plannedImageCount({ configs: [{ lora: 'a:[0.5, 1]:[0.2, 0.8] + b:[0.7, 0.9]',
        positive: ['one', 'two'], negative: ['bad one', 'bad two'] }] }), 16);
});

test('nested prompts, resolution sweep and extra seeds multiply base images', () => {
    assert.equal(plannedImageCount({ configs: [{ positive: [['cat', 'dog'], ['day', 'night']],
        resolutions: [[512, 512], [1024, 1024]] }], _session_settings: { add_random_seeds_to_gens: 2 } }), 24);
});

test('disabled shift sweeps do not multiply; active shift and guidance sweeps do', () => {
    assert.equal(plannedImageCount({ configs: [{ model_sampling_override: 'none', model_sampling_shift: '1, 3' }] }), 1);
    assert.equal(plannedImageCount({ configs: [{ model_sampling_override: 'aura_flow', model_sampling_shift: '1, 3',
        use_flux_guidance: true, flux_guidance_value: '2, 3, 4' }] }), 6);
});

test('folders, wildcard, advanced pipeline, unsafe totals and video stay explicitly unknown', () => {
    for (const config of [{ lora: 'styles/:1.0:1.0' }, { lora: 'styles\\:1.0:1.0' }, { model: 'checkpoints/' }, { sampler: '*' },
        { model_type: 'ltx_video' }, { use_advanced_sampling: true }, { model_sampling_override: ['none', 'flux'] }]) {
        assert.equal(plannedImageCount({ configs: [config] }), null);
    }
    assert.equal(plannedImageCount({ configs: [{}], _session_settings: { add_random_seeds_to_gens: Number.MAX_SAFE_INTEGER } }), null);
    assert.equal(plannedImageCount({ configs: [] }), 0);
});

test('find only the generator directly connected to this builder, including a stale link', () => {
    const generator = { id: 2, comfyClass: 'UltimateSamplerGrid' };
    const node = { outputs: [{ links: [8, 9] }], graph: {
        links: { 9: { target_id: 2 } }, getNodeById: id => id === 2 ? generator : undefined,
    } };
    assert.equal(connectedGenerator(node), generator);
    assert.equal(connectedGenerator({}), null);
});

test('seed CSV preserves all uint64 bits and normalizes whitespace, zero prefixes and duplicates', () => {
    assert.deepEqual(parseNumberList(' 00042, 0, 18446744073709551615, 42 ', 'seed'), ['42', '0', '18446744073709551615']);
    assert.deepEqual(parseNumberList('', 'seed', true), []);
    for (const invalid of ['1,,2', ',1', '1,', '1;2', '1 2', '-1', '1.5', '1e3', '18446744073709551616']) {
        assert.throws(() => parseNumberList(invalid, 'seed'), undefined, invalid);
    }
});

test('strength CSV rejects malformed separators and non-finite/ambiguous tokens', () => {
    assert.deepEqual(parseNumberList(' .7, 0.8500, -0.5, 1e-3, 0.7 ', 'strength'), ['0.7', '0.85', '-0.5', '0.001']);
    for (const invalid of ['', '0.5,,1.0', '0.5,', '0.5; 1.0', '0.5 1.0', 'NaN', 'Infinity', '0x10', '1e309']) {
        assert.throws(() => parseNumberList(invalid, 'strength'), undefined, invalid);
    }
});

test('ranges use an inclusive endpoint when reachable, without floating-point accumulation', () => {
    assert.deepEqual(generateNumberRange('0.7', '1.3', '0.1', 'strength'), ['0.7','0.8','0.9','1','1.1','1.2','1.3']);
    assert.deepEqual(generateNumberRange('-0.1', '0.1', '0.05', 'strength'), ['-0.1','-0.05','0','0.05','0.1']);
    assert.deepEqual(generateNumberRange('1e-3', '3e-3', '1e-3', 'strength'), ['0.001','0.002','0.003']);
    assert.deepEqual(generateNumberRange('1', '6', '2', 'seed'), ['1','3','5']);
    assert.deepEqual(generateNumberRange('18446744073709551613', '18446744073709551615', '1', 'seed'),
        ['18446744073709551613','18446744073709551614','18446744073709551615']);
    for (const args of [['0','1','0','strength'], ['2','1','1','seed'], ['0','18446744073709551615','1','seed']]) {
        assert.throws(() => generateNumberRange(...args));
    }
});

test('generation appends to manual values, merges overlaps and rejects a malformed existing draft', () => {
    assert.equal(appendNumberValues('42, 1', ['1','2','3'], 'seed'), '42, 1, 2, 3');
    assert.equal(appendNumberValues('0.85', generateNumberRange('0.7','0.9','0.1','strength'), 'strength'), '0.85, 0.7, 0.8, 0.9');
    assert.throws(() => appendNumberValues('42,,1', ['2'], 'seed'));
    assert.throws(() => appendNumberValues('1', Array.from({length:10000},(_,i)=>String(i+2)), 'seed'));
});

test('random button produces the requested number of distinct uint64 decimal seeds', () => {
    const seeds = generateRandomSeeds('12');
    assert.equal(seeds.length,12);
    assert.equal(new Set(seeds).size,12);
    assert.deepEqual(parseNumberList(seeds.join(', '),'seed'),seeds);
    for (const count of [0,-1,1.5,10001,'no']) assert.throws(() => generateRandomSeeds(count));
});

test('shared sampling edits change only the selected field across all setups', () => {
    const setups = [
        { name:'Baseline', steps:'9', cfg:'1', loras:['None'], full_run_seed:42, models:['base'] },
        { name:'LoRA', steps:'9', cfg:'2', loras:['adapter:0.7:0.7'], full_run_seed:43, models:['other'] },
    ];
    const original = structuredClone(setups);
    applySamplingValue(setups,null,'steps','9, 12');
    assert.deepEqual(setups,original.map(item=>({...item,steps:'9, 12'})));
    applySamplingValue(setups,1,'cfg','3');
    assert.equal(setups[0].cfg,'1');
    assert.equal(setups[1].cfg,'3');
    assert.deepEqual(setups.map(item=>item.loras),original.map(item=>item.loras));
});

test('shared sampling lists remain independently editable after applying them to all setups', () => {
    const setups=[{samplers:['euler']},{samplers:['euler']}];
    const methods=['euler','dpmpp_sde'];
    applySamplingValue(setups,null,'samplers',methods);
    setups[0].samplers.pop();
    assert.deepEqual(setups[1].samplers,['euler','dpmpp_sde']);
    assert.deepEqual(methods,['euler','dpmpp_sde']);
});

test('sampling scope cannot overwrite unrelated seed or LoRA fields or a missing setup', () => {
    const setups=[{steps:'9',full_run_seed:42,loras:['None']}];
    const before=structuredClone(setups);
    assert.throws(()=>applySamplingValue(setups,null,'full_run_seed',100));
    assert.throws(()=>applySamplingValue(setups,null,'loras',['other']));
    assert.throws(()=>applySamplingValue(setups,3,'steps','12'));
    assert.deepEqual(setups,before);
});
