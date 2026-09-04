import { app } from "../../../scripts/app.js";
import {
  buildMatrixConfigArrays,
  estimateMatrixImages,
  parseLoraName,
  parseSeedList,
} from "./experiment_matrix_core.js";

const DEFAULT_ROWS = [
  { enabled: true, sampler: "euler", scheduler: "simple", strength_from: 1.20, strength_to: 1.60, strength_step: 0.10, note: "bester Treffer, seed-sensibel" },
  { enabled: true, sampler: "dpmpp_sde", scheduler: "simple", strength_from: 1.10, strength_to: 1.30, strength_step: 0.05, note: "stark, nicht-monoton" },
  { enabled: true, sampler: "euler", scheduler: "beta", strength_from: 1.30, strength_to: 1.70, strength_step: 0.10, note: "Glanz, mehr Drift" },
  { enabled: true, sampler: "euler_ancestral", scheduler: "simple", strength_from: 1.40, strength_to: 1.80, strength_step: 0.10, note: "später aktiv, mehr Drift" },
  { enabled: true, sampler: "dpmpp_sde", scheduler: "beta", strength_from: 1.00, strength_to: 2.00, strength_step: 0.20, note: "praktisch unbrauchbar" },
  { enabled: false, sampler: "*", scheduler: "ddim_uniform", strength_from: 1.00, strength_to: 1.00, strength_step: 0.10, note: "ausschließen (Kollaps)" },
  { enabled: false, sampler: "euler", scheduler: "karras", strength_from: 1.00, strength_to: 1.00, strength_step: 0.10, note: "ausschließen (unscharf)" },
];

const DEFAULT_SEEDS = [
  "127749309465779",
  "127749309465780",
  "127749309465781",
].join("\n");

function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function defaultMatrixState() {
  return {
    rows: cloneValue(DEFAULT_ROWS),
    seeds: DEFAULT_SEEDS,
    lock_clip_to_model: true,
    source_config_index: 0,
    target_lora: "",
    generated: false,
    template: null,
  };
}

function ensureMatrixState(node) {
  if (!node.state) return null;
  if (!node.state.experiment_matrix || typeof node.state.experiment_matrix !== "object") {
    node.state.experiment_matrix = defaultMatrixState();
  }
  const matrix = node.state.experiment_matrix;
  if (!Array.isArray(matrix.rows)) matrix.rows = cloneValue(DEFAULT_ROWS);
  if (matrix.seeds === undefined) matrix.seeds = DEFAULT_SEEDS;
  if (matrix.lock_clip_to_model === undefined) matrix.lock_clip_to_model = true;
  if (matrix.source_config_index === undefined) matrix.source_config_index = 0;
  if (matrix.target_lora === undefined) matrix.target_lora = "";
  if (matrix.generated === undefined) matrix.generated = false;
  if (matrix.template === undefined) matrix.template = null;
  return matrix;
}

function injectStyles() {
  if (document.getElementById("uscg-experiment-matrix-css")) return;
  const style = document.createElement("style");
  style.id = "uscg-experiment-matrix-css";
  style.textContent = `
    .uscg-matrix-launcher { position:absolute; right:10px; top:10px; z-index:50; border:1px solid #5a6b85; background:#26364d; color:#fff; border-radius:6px; padding:7px 10px; cursor:pointer; font:600 12px sans-serif; box-shadow:0 2px 8px #0007; }
    .uscg-matrix-launcher:hover { background:#314866; }
    .uscg-matrix-overlay { position:fixed; inset:0; z-index:100000; background:#000b; display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box; }
    .uscg-matrix-modal { width:min(1500px,96vw); max-height:94vh; overflow:auto; background:#171a20; color:#e8edf4; border:1px solid #4a5362; border-radius:10px; box-shadow:0 20px 60px #000c; font:13px/1.4 sans-serif; }
    .uscg-matrix-head { position:sticky; top:0; z-index:5; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 16px; background:#20252d; border-bottom:1px solid #3a424e; }
    .uscg-matrix-head h2 { margin:0; font-size:18px; }
    .uscg-matrix-body { padding:16px; }
    .uscg-matrix-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
    .uscg-matrix-field { display:flex; flex-direction:column; gap:5px; }
    .uscg-matrix-field label { color:#aeb8c6; font-size:12px; }
    .uscg-matrix-modal input,.uscg-matrix-modal select,.uscg-matrix-modal textarea { box-sizing:border-box; width:100%; background:#0f1217; color:#e8edf4; border:1px solid #3d4653; border-radius:5px; padding:7px 8px; }
    .uscg-matrix-modal textarea { min-height:88px; resize:vertical; font-family:ui-monospace,Consolas,monospace; }
    .uscg-matrix-table-wrap { overflow:auto; border:1px solid #343c48; border-radius:7px; }
    .uscg-matrix-table { width:100%; min-width:1050px; border-collapse:collapse; }
    .uscg-matrix-table th,.uscg-matrix-table td { border-bottom:1px solid #303844; padding:7px; vertical-align:middle; }
    .uscg-matrix-table th { position:sticky; top:0; background:#252b34; text-align:left; color:#bdc7d5; font-size:12px; }
    .uscg-matrix-table tr:last-child td { border-bottom:0; }
    .uscg-matrix-table input[type=checkbox] { width:auto; }
    .uscg-matrix-actions { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:14px; }
    .uscg-matrix-btn { width:auto !important; cursor:pointer; padding:8px 12px !important; font-weight:600; }
    .uscg-matrix-primary { background:#2e6d48 !important; border-color:#4c9b6d !important; }
    .uscg-matrix-warn { background:#6d522e !important; border-color:#a57b3d !important; }
    .uscg-matrix-danger { background:#5c3030 !important; border-color:#8a4848 !important; }
    .uscg-matrix-summary { margin-top:12px; padding:10px 12px; background:#10151d; border:1px solid #344050; border-radius:6px; color:#c9d4e3; }
    .uscg-matrix-note { color:#93a0b1; font-size:12px; }
    .uscg-matrix-error { color:#ff9c9c; }
    @media (max-width: 850px) { .uscg-matrix-grid { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);
}

function optionHtml(values, selected) {
  const list = Array.from(new Set(["*", ...(values || [])]));
  return list.map((value) => {
    const safe = String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return `<option value="${safe}"${String(value) === String(selected) ? " selected" : ""}>${safe}</option>`;
  }).join("");
}

function sourceOptions(node, matrix) {
  const options = [];
  if (matrix.template) options.push({ key: "saved", label: "Saved matrix template", config: matrix.template });
  (node.state?.config_arrays || []).forEach((config, index) => {
    options.push({ key: `config:${index}`, label: config.name || `Config ${index + 1}`, config });
  });
  return options;
}

function availableTargetLoras(config) {
  return (Array.isArray(config?.loras) ? config.loras : [config?.loras])
    .map(parseLoraName)
    .filter((name) => name && name !== "None");
}

async function fetchSamplerSchedulerLists() {
  try {
    const resp = await fetch("/configbuilder/model_lists", { headers: { "X-Config-Builder-Internal": "true" } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return { samplers: data.samplers || [], schedulers: data.schedulers || [] };
  } catch (error) {
    console.warn("[ExperimentMatrix] Could not load sampler/scheduler lists:", error);
    return { samplers: [], schedulers: [] };
  }
}

function makeCell(tag, attrs = {}) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "text") el.textContent = value;
    else if (key === "class") el.className = value;
    else el.setAttribute(key, value);
  });
  return el;
}

async function openMatrixModal(node) {
  injectStyles();
  const matrix = ensureMatrixState(node);
  if (!matrix) return;
  const lists = await fetchSamplerSchedulerLists();

  const overlay = makeCell("div", { class: "uscg-matrix-overlay" });
  const modal = makeCell("div", { class: "uscg-matrix-modal" });
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const head = makeCell("div", { class: "uscg-matrix-head" });
  head.innerHTML = `<div><h2>🧪 Experiment Matrix</h2><div class="uscg-matrix-note">Sampler/Scheduler rows + LoRA strength ranges + exact seeds</div></div>`;
  const closeTop = makeCell("button", { class: "uscg-matrix-btn", type: "button", text: "Close" });
  closeTop.onclick = () => overlay.remove();
  head.appendChild(closeTop);
  modal.appendChild(head);

  const body = makeCell("div", { class: "uscg-matrix-body" });
  modal.appendChild(body);

  const sourceGrid = makeCell("div", { class: "uscg-matrix-grid" });
  const sourceField = makeCell("div", { class: "uscg-matrix-field" });
  sourceField.innerHTML = `<label>Template config</label><select class="matrix-source"></select>`;
  const loraField = makeCell("div", { class: "uscg-matrix-field" });
  loraField.innerHTML = `<label>LoRA to sweep</label><select class="matrix-lora"></select>`;
  sourceGrid.append(sourceField, loraField);
  body.appendChild(sourceGrid);

  const sourceSelect = sourceField.querySelector("select");
  const loraSelect = loraField.querySelector("select");

  function selectedSource() {
    return sourceOptions(node, matrix).find((src) => src.key === sourceSelect.value)?.config || null;
  }

  function refreshLoras() {
    const names = availableTargetLoras(selectedSource());
    loraSelect.innerHTML = "";
    if (names.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No LoRA in template — add one in the normal Builder first";
      loraSelect.appendChild(opt);
      matrix.target_lora = "";
      return;
    }
    names.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      loraSelect.appendChild(opt);
    });
    if (names.includes(matrix.target_lora)) loraSelect.value = matrix.target_lora;
    else matrix.target_lora = names[0];
    loraSelect.value = matrix.target_lora;
  }

  function refreshSources() {
    const sources = sourceOptions(node, matrix);
    sourceSelect.innerHTML = "";
    sources.forEach((src) => {
      const opt = document.createElement("option");
      opt.value = src.key;
      opt.textContent = src.label;
      sourceSelect.appendChild(opt);
    });
    if (matrix.template) sourceSelect.value = "saved";
    else sourceSelect.value = `config:${Math.min(Number(matrix.source_config_index) || 0, Math.max(0, sources.length - 1))}`;
    refreshLoras();
  }

  sourceSelect.onchange = () => {
    if (sourceSelect.value.startsWith("config:")) matrix.source_config_index = Number(sourceSelect.value.split(":")[1] || 0);
    refreshLoras();
    refreshSummary();
  };
  loraSelect.onchange = () => { matrix.target_lora = loraSelect.value; refreshSummary(); };
  refreshSources();

  const tableWrap = makeCell("div", { class: "uscg-matrix-table-wrap" });
  const table = makeCell("table", { class: "uscg-matrix-table" });
  table.innerHTML = `<thead><tr><th>On</th><th>Sampler</th><th>Scheduler</th><th>From</th><th>To</th><th>Step</th><th>Status / note</th><th></th></tr></thead><tbody></tbody>`;
  tableWrap.appendChild(table);
  body.appendChild(tableWrap);
  const tbody = table.querySelector("tbody");

  function renderRows() {
    tbody.innerHTML = "";
    matrix.rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="row-enabled" type="checkbox" ${row.enabled !== false ? "checked" : ""}></td>
        <td><select class="row-sampler">${optionHtml(lists.samplers, row.sampler)}</select></td>
        <td><select class="row-scheduler">${optionHtml(lists.schedulers, row.scheduler)}</select></td>
        <td><input class="row-from" type="number" step="0.01" value="${row.strength_from}"></td>
        <td><input class="row-to" type="number" step="0.01" value="${row.strength_to}"></td>
        <td><input class="row-step" type="number" step="0.01" min="0.000001" value="${row.strength_step}"></td>
        <td><input class="row-note" type="text" value="${String(row.note || "").replaceAll('"', '&quot;')}"></td>
        <td><button class="uscg-matrix-btn uscg-matrix-danger row-delete" type="button">Delete</button></td>`;
      const bind = (selector, key, parser = (v) => v) => {
        const el = tr.querySelector(selector);
        el.addEventListener("input", () => { row[key] = parser(el.type === "checkbox" ? el.checked : el.value); refreshSummary(); });
        el.addEventListener("change", () => { row[key] = parser(el.type === "checkbox" ? el.checked : el.value); refreshSummary(); });
      };
      bind(".row-enabled", "enabled", Boolean);
      bind(".row-sampler", "sampler");
      bind(".row-scheduler", "scheduler");
      bind(".row-from", "strength_from", Number);
      bind(".row-to", "strength_to", Number);
      bind(".row-step", "strength_step", Number);
      bind(".row-note", "note");
      tr.querySelector(".row-delete").onclick = () => { matrix.rows.splice(index, 1); renderRows(); refreshSummary(); };
      tbody.appendChild(tr);
    });
  }
  renderRows();

  const optionsGrid = makeCell("div", { class: "uscg-matrix-grid" });
  optionsGrid.style.marginTop = "14px";
  const seedsField = makeCell("div", { class: "uscg-matrix-field" });
  seedsField.innerHTML = `<label>Exact seeds (one per line, comma-separated also accepted)</label><textarea class="matrix-seeds"></textarea>`;
  const behaviorField = makeCell("div", { class: "uscg-matrix-field" });
  behaviorField.innerHTML = `<label>LoRA strength behavior</label><label style="display:flex;align-items:center;gap:8px;padding-top:8px"><input class="matrix-lock" type="checkbox" style="width:auto"> Lock CLIP strength to model strength</label><div class="uscg-matrix-note">Enabled emits LoRA:[strengths], so model and CLIP use the same value. Disabled preserves the template CLIP strength.</div>`;
  optionsGrid.append(seedsField, behaviorField);
  body.appendChild(optionsGrid);

  const seedsText = seedsField.querySelector("textarea");
  seedsText.value = matrix.seeds;
  seedsText.oninput = () => { matrix.seeds = seedsText.value; refreshSummary(); };
  const lockCheck = behaviorField.querySelector(".matrix-lock");
  lockCheck.checked = matrix.lock_clip_to_model !== false;
  lockCheck.onchange = () => { matrix.lock_clip_to_model = lockCheck.checked; };

  const summary = makeCell("div", { class: "uscg-matrix-summary" });
  body.appendChild(summary);

  function refreshSummary() {
    try {
      const seeds = parseSeedList(matrix.seeds);
      const count = estimateMatrixImages(matrix.rows, matrix.seeds);
      const enabled = matrix.rows.filter((r) => r.enabled !== false).length;
      summary.classList.remove("uscg-matrix-error");
      summary.innerHTML = `<b>${count} matrix images</b> before any additional template multipliers · ${enabled} enabled rows · ${seeds.length} exact seeds.<br><span class="uscg-matrix-note">After Apply, the normal USCG preview shows the complete expanded total including models, prompts, steps, CFG, resolutions, etc.</span>`;
    } catch (error) {
      summary.classList.add("uscg-matrix-error");
      summary.textContent = error.message;
    }
  }
  refreshSummary();

  const actions = makeCell("div", { class: "uscg-matrix-actions" });
  const addRow = makeCell("button", { class: "uscg-matrix-btn", type: "button", text: "+ Add row" });
  const reset = makeCell("button", { class: "uscg-matrix-btn uscg-matrix-warn", type: "button", text: "Reset Latex preset" });
  const apply = makeCell("button", { class: "uscg-matrix-btn uscg-matrix-primary", type: "button", text: "Apply Matrix to Configs" });
  const restore = makeCell("button", { class: "uscg-matrix-btn", type: "button", text: "Restore template" });
  const close = makeCell("button", { class: "uscg-matrix-btn", type: "button", text: "Close" });
  actions.append(addRow, reset, apply);
  if (matrix.template) actions.appendChild(restore);
  actions.appendChild(close);
  body.appendChild(actions);

  addRow.onclick = () => {
    matrix.rows.push({ enabled: true, sampler: lists.samplers[0] || "euler", scheduler: lists.schedulers[0] || "simple", strength_from: 1.0, strength_to: 1.0, strength_step: 0.1, note: "" });
    renderRows();
    refreshSummary();
  };

  reset.onclick = () => {
    matrix.rows = cloneValue(DEFAULT_ROWS);
    matrix.seeds = DEFAULT_SEEDS;
    seedsText.value = matrix.seeds;
    renderRows();
    refreshSummary();
  };

  apply.onclick = async () => {
    try {
      const template = selectedSource();
      matrix.target_lora = loraSelect.value;
      const generated = buildMatrixConfigArrays(template, matrix.rows, matrix.seeds, matrix.target_lora, {
        lockClipToModel: matrix.lock_clip_to_model,
      });
      matrix.template = cloneValue(template);
      matrix.generated = true;
      node.state.experiment_matrix = matrix;
      node.state.config_arrays = generated;
      if (typeof node.saveState === "function") node.saveState();
      if (typeof node.renderUI === "function") await node.renderUI();
      overlay.remove();
      console.log(`[ExperimentMatrix] Applied ${generated.length} config arrays.`);
    } catch (error) {
      summary.classList.add("uscg-matrix-error");
      summary.textContent = `Cannot apply matrix: ${error.message}`;
    }
  };

  restore.onclick = async () => {
    if (!matrix.template) return;
    node.state.config_arrays = [cloneValue(matrix.template)];
    matrix.generated = false;
    node.state.experiment_matrix = matrix;
    if (typeof node.saveState === "function") node.saveState();
    if (typeof node.renderUI === "function") await node.renderUI();
    overlay.remove();
  };

  close.onclick = () => overlay.remove();
  overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.remove(); });
}

function installLauncher(node) {
  let attempts = 0;
  const attach = () => {
    if (!node?.htmlContainer || !node?.state) {
      if (++attempts < 100) setTimeout(attach, 50);
      return;
    }

    injectStyles();
    ensureMatrixState(node);
    node.htmlContainer.style.position = "relative";

    const ensureButton = () => {
      if (!node.htmlContainer?.isConnected) return;
      if (node.htmlContainer.querySelector(".uscg-matrix-launcher")) return;
      const button = makeCell("button", { class: "uscg-matrix-launcher", type: "button", text: "🧪 Matrix" });
      button.onclick = (event) => { event.stopPropagation(); openMatrixModal(node); };
      node.htmlContainer.appendChild(button);
    };

    ensureButton();
    if (!node.__experimentMatrixObserver) {
      node.__experimentMatrixObserver = new MutationObserver(() => ensureButton());
      node.__experimentMatrixObserver.observe(node.htmlContainer, { childList: true });
    }
  };
  attach();
}

app.registerExtension({
  name: "UltimateConfigBuilder.ExperimentMatrix",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "UltimateConfigBuilder") return;
    const original = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = original?.apply(this, arguments);
      setTimeout(() => installLauncher(this), 0);
      return result;
    };
  },
});
