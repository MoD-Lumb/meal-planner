// Developer tools — trigger the GitHub Actions workflow that refreshes today's
// price catalog into Google Drive, and/or hot-load the latest Drive catalog
// into the running app. Session-only injection: a page reload falls back to
// the committed JSON under data/prices/.

import { injectCatalog } from '../api/localPrices.js';
import {
  DRIVE_CATALOG_FOLDER_ID,
  GOOGLE_API_KEY,
  GITHUB_REPO,
  GITHUB_WORKFLOW_FILE,
  GITHUB_BRANCH,
} from '../config.js';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GITHUB_API = 'https://api.github.com';
const DOWNLOAD_CONCURRENCY = 4;
const PAT_KEY = 'mp-github-pat';

export function renderDeveloper(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Developer</h1>
      <p class="page-subtitle">Trigger a price refresh in GitHub Actions and hot-load the result from Drive.</p>
    </div>

    <div class="profile-card">
      <h3 style="margin-top:0;">GitHub personal access token</h3>
      <p>
        Needed to trigger the <code>${GITHUB_WORKFLOW_FILE}</code> workflow in
        <code>${GITHUB_REPO}</code>. Use a
        <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" class="link">fine-grained PAT</a>
        scoped to this repo with <strong>Actions: Read and write</strong>.
        Stored only in this browser's localStorage.
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        <input type="password" id="dev-pat-input" placeholder="github_pat_…" style="flex:1; min-width:260px;" />
        <button class="btn btn-secondary" id="dev-pat-save">Save</button>
        <button class="btn btn-secondary" id="dev-pat-clear">Clear</button>
      </div>
      <div id="dev-pat-status" class="nt-hint" style="margin-top:8px;"></div>
    </div>

    <div class="profile-card">
      <h3 style="margin-top:0;">Refresh today's prices</h3>
      <p>
        Triggers the GitHub Action that downloads today's archive, rebuilds
        the 18 chain JSONs, and uploads them to your Drive folder. When the
        run finishes, the catalog is hot-loaded into this page.
        Reloading the page falls back to the committed JSON in
        <code>data/prices/</code>.
      </p>
      <div class="form-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-primary" id="dev-run-btn">Run refresh now</button>
        <button class="btn btn-secondary" id="dev-refresh-btn">Refresh from Drive (skip GitHub run)</button>
      </div>
      <div id="dev-status" class="nt-hint" style="margin-top:12px; white-space:pre-line;"></div>
      <pre id="dev-log" style="margin-top:12px; max-height:360px; overflow:auto; background:#0b1020; color:#d6e0ff; padding:10px 12px; border-radius:8px; font-size:12px; line-height:1.4; display:none;"></pre>
    </div>
  `;

  const patInput  = container.querySelector('#dev-pat-input');
  const patSave   = container.querySelector('#dev-pat-save');
  const patClear  = container.querySelector('#dev-pat-clear');
  const patStatus = container.querySelector('#dev-pat-status');
  const runBtn    = container.querySelector('#dev-run-btn');
  const refreshBtn= container.querySelector('#dev-refresh-btn');
  const status    = container.querySelector('#dev-status');
  const log       = container.querySelector('#dev-log');

  const updatePatStatus = () => {
    const pat = getPat();
    patStatus.textContent = pat
      ? `✓ PAT stored (${pat.slice(0, 10)}…${pat.slice(-4)}).`
      : 'No PAT saved — "Run refresh now" will prompt for one.';
  };
  updatePatStatus();

  patSave.addEventListener('click', () => {
    const v = patInput.value.trim();
    if (!v) return;
    setPat(v);
    patInput.value = '';
    updatePatStatus();
  });
  patClear.addEventListener('click', () => {
    setPat('');
    patInput.value = '';
    updatePatStatus();
  });

  const append = (line) => {
    log.style.display = 'block';
    log.textContent += line + '\n';
    log.scrollTop = log.scrollHeight;
  };
  const onStatus = (msg) => { status.textContent = msg; append(msg); };

  runBtn.addEventListener('click', async () => {
    if (!isDriveConfigured()) {
      status.textContent = '✗ Set DRIVE_CATALOG_FOLDER_ID and GOOGLE_API_KEY in src/config.js first.';
      return;
    }
    let pat = getPat();
    if (!pat) {
      pat = (prompt('Paste a GitHub fine-grained PAT (Actions: R/W on this repo):') || '').trim();
      if (!pat) { status.textContent = '✗ No PAT provided.'; return; }
      setPat(pat);
      updatePatStatus();
    }
    runBtn.disabled = true;
    refreshBtn.disabled = true;
    log.textContent = '';
    try {
      await dispatchAndWait(pat, onStatus);
      onStatus('Run succeeded. Loading fresh catalog from Drive…');
      const result = await refreshFromDrive({ onStatus });
      status.textContent = `✓ Refreshed: ${result.chainCount} chains, ${result.productCount} products (${result.date}).`;
    } catch (err) {
      console.error(err);
      status.textContent = `✗ ${err.message || err}`;
      append(`ERROR: ${err.stack || err}`);
    } finally {
      runBtn.disabled = false;
      refreshBtn.disabled = false;
    }
  });

  refreshBtn.addEventListener('click', async () => {
    if (!isDriveConfigured()) {
      status.textContent = '✗ Set DRIVE_CATALOG_FOLDER_ID and GOOGLE_API_KEY in src/config.js first.';
      return;
    }
    runBtn.disabled = true;
    refreshBtn.disabled = true;
    log.textContent = '';
    try {
      const result = await refreshFromDrive({ onStatus });
      status.textContent = `✓ Loaded ${result.chainCount} chains, ${result.productCount} products (${result.date}).`;
    } catch (err) {
      console.error(err);
      status.textContent = `✗ ${err.message || err}`;
      append(`ERROR: ${err.stack || err}`);
    } finally {
      runBtn.disabled = false;
      refreshBtn.disabled = false;
    }
  });
}

// ── PAT storage ───────────────────────────────────────────────────────────

function getPat() { return localStorage.getItem(PAT_KEY) || ''; }
function setPat(v) {
  if (v) localStorage.setItem(PAT_KEY, v);
  else   localStorage.removeItem(PAT_KEY);
}

function isDriveConfigured() {
  return DRIVE_CATALOG_FOLDER_ID
      && GOOGLE_API_KEY
      && !DRIVE_CATALOG_FOLDER_ID.startsWith('PASTE')
      && !GOOGLE_API_KEY.startsWith('PASTE');
}

// ── GitHub workflow dispatch ──────────────────────────────────────────────

async function dispatchAndWait(pat, onStatus) {
  const since = new Date(Date.now() - 5000).toISOString();

  onStatus(`Dispatching ${GITHUB_WORKFLOW_FILE} on ${GITHUB_BRANCH}…`);
  const dispatchUrl = `${GITHUB_API}/repos/${GITHUB_REPO}/actions/workflows/${encodeURIComponent(GITHUB_WORKFLOW_FILE)}/dispatches`;
  const resp = await fetch(dispatchUrl, {
    method: 'POST',
    headers: ghHeaders(pat),
    body: JSON.stringify({ ref: GITHUB_BRANCH }),
  });
  if (!resp.ok) {
    throw new Error(`GitHub dispatch HTTP ${resp.status}: ${await resp.text().catch(() => resp.statusText)}`);
  }

  onStatus('Waiting for run to appear…');
  let run = null;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    run = await findLatestRun(pat, since);
    if (run) break;
  }
  if (!run) throw new Error('Run did not appear within 30s — check the GitHub Actions tab.');
  onStatus(`  Run #${run.run_number}: ${run.html_url}`);

  for (let i = 0; i < 90; i++) {
    await sleep(10000);
    const r = await getRun(pat, run.id);
    onStatus(`  [${r.status}${r.conclusion ? ' / ' + r.conclusion : ''}]`);
    if (r.status === 'completed') {
      if (r.conclusion !== 'success') {
        throw new Error(`Workflow conclusion: ${r.conclusion}. See ${r.html_url}`);
      }
      return r;
    }
  }
  throw new Error('Timed out waiting for workflow run to finish (15 min).');
}

async function findLatestRun(pat, sinceIso) {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/actions/workflows/${encodeURIComponent(GITHUB_WORKFLOW_FILE)}/runs`
    + `?event=workflow_dispatch&per_page=5`;
  const resp = await fetch(url, { headers: ghHeaders(pat) });
  if (!resp.ok) throw new Error(`GitHub runs HTTP ${resp.status}`);
  const data = await resp.json();
  return (data.workflow_runs || []).find(r => r.created_at >= sinceIso) || null;
}

async function getRun(pat, runId) {
  const resp = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/actions/runs/${runId}`, { headers: ghHeaders(pat) });
  if (!resp.ok) throw new Error(`GitHub run ${runId} HTTP ${resp.status}`);
  return resp.json();
}

function ghHeaders(pat) {
  return {
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

// ── Drive fetch (unchanged shape from the previous iteration) ─────────────

async function refreshFromDrive({ onStatus }) {
  onStatus('Listing Drive folder…');
  const files = await listFolderJsons(DRIVE_CATALOG_FOLDER_ID);
  if (files.length === 0) {
    throw new Error('Drive folder is empty — run the workflow first.');
  }

  const indexEntry = files.find(f => f.name === 'index.json');
  if (!indexEntry) throw new Error("index.json not found in Drive folder.");
  const chainEntries = files.filter(f => f !== indexEntry);

  onStatus(`Downloading index.json (${humanSize(Number(indexEntry.size) || 0)})…`);
  const index = await fetchDriveJson(indexEntry.id);

  onStatus(`Downloading ${chainEntries.length} chain files…`);
  const rawChainsByCode = new Map();
  let done = 0;
  await pLimit(DOWNLOAD_CONCURRENCY, chainEntries.map(entry => async () => {
    const raw = await fetchDriveJson(entry.id);
    rawChainsByCode.set(raw.chain, raw);
    done++;
    onStatus(`  [${done}/${chainEntries.length}] ${raw.chain}: ${raw.products.length} products, ${raw.storeCount} stores`);
  }));

  for (const c of (index.chains || [])) {
    if (!rawChainsByCode.has(c.code)) {
      onStatus(`  (warning) index references chain '${c.code}' but its file was not downloaded`);
    }
  }

  injectCatalog(index, rawChainsByCode);

  const productCount = Array.from(rawChainsByCode.values())
    .reduce((s, raw) => s + (raw.products?.length || 0), 0);
  const latestMtime = files.reduce((acc, f) =>
    (f.modifiedTime && (!acc || f.modifiedTime > acc)) ? f.modifiedTime : acc, null);
  onStatus(`Drive modifiedTime: ${latestMtime || '?'}`);
  return { chainCount: rawChainsByCode.size, productCount, date: index.date };
}

async function listFolderJsons(folderId) {
  const q = `'${folderId}' in parents and trashed=false and mimeType='application/json'`;
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}`
    + `&fields=${encodeURIComponent('files(id,name,size,modifiedTime)')}`
    + `&pageSize=1000&key=${encodeURIComponent(GOOGLE_API_KEY)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => resp.statusText);
    throw new Error(`Drive list HTTP ${resp.status}: ${body}`);
  }
  const payload = await resp.json();
  return payload.files || [];
}

async function fetchDriveJson(fileId) {
  const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}`
    + `?alt=media&key=${encodeURIComponent(GOOGLE_API_KEY)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download ${fileId} HTTP ${resp.status}`);
  return resp.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function pLimit(limit, tasks) {
  const results = new Array(tasks.length);
  let next = 0;
  const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function humanSize(n) {
  let v = n;
  for (const u of ['B', 'KB', 'MB', 'GB']) {
    if (v < 1024) return `${v.toFixed(1)} ${u}`;
    v /= 1024;
  }
  return `${v.toFixed(1)} TB`;
}
