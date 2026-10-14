import assert from "node:assert/strict";
import {
  buildStrengthValues,
  parseSeedList,
  estimateMatrixImages,
  buildMatrixConfigArrays,
} from "../web/conf_builder/experiment_matrix_core.js";

assert.deepEqual(
  buildStrengthValues(1.10, 1.30, 0.05),
  [1.1, 1.15, 1.2, 1.25, 1.3],
);
assert.deepEqual(
  buildStrengthValues(1.20, 1.60, 0.10),
  [1.2, 1.3, 1.4, 1.5, 1.6],
);

assert.deepEqual(
  parseSeedList("S0 127749309465779\nS1 127749309465780\nS2 127749309465781"),
  ["127749309465779", "127749309465780", "127749309465781"],
);
assert.deepEqual(
  parseSeedList("127749309465779, 127749309465780, 127749309465781"),
  ["127749309465779", "127749309465780", "127749309465781"],
);

const rows = [
  { enabled: true, sampler: "euler", scheduler: "simple", strength_from: 1.2, strength_to: 1.6, strength_step: 0.1 },
  { enabled: true, sampler: "dpmpp_sde", scheduler: "simple", strength_from: 1.1, strength_to: 1.3, strength_step: 0.05 },
  { enabled: true, sampler: "euler", scheduler: "beta", strength_from: 1.3, strength_to: 1.7, strength_step: 0.1 },
  { enabled: true, sampler: "euler_ancestral", scheduler: "simple", strength_from: 1.4, strength_to: 1.8, strength_step: 0.1 },
  { enabled: true, sampler: "dpmpp_sde", scheduler: "beta", strength_from: 1.0, strength_to: 2.0, strength_step: 0.2 },
];
const seeds = "127749309465779\n127749309465780\n127749309465781";
assert.equal(estimateMatrixImages(rows, seeds), 78);

const target = "Z-Image Turbo/latex-zit-smoke-01.safetensors";
const template = {
  name: "Config 1",
  samplers: ["euler"],
  schedulers: ["simple"],
  steps: "10",
  cfg: "1.0",
  loras: [`${target}:1.0:1.0`],
  lora_weight_arrays: { [`${target}_model`]: [0.8, 1.0] },
};

const configs = buildMatrixConfigArrays(template, [rows[0]], seeds, target);
assert.equal(configs.length, 3);
assert.deepEqual(
  configs.map((config) => config.full_run_seed),
  ["127749309465779", "127749309465780", "127749309465781"],
);
assert.equal(
  configs[0].loras[0],
  `${target}:[1.2, 1.3, 1.4, 1.5, 1.6]`,
);
assert.equal(configs[0].lora_weight_arrays[`${target}_model`], undefined);

console.log("experiment matrix core tests: OK");
