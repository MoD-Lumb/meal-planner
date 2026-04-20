// Google Drive sync for the meal-planner SPA.
//
// Stores all mp-* localStorage keys as a single JSON blob in the user's
// private Drive appDataFolder (scope: drive.appdata). Load-before-render on
// boot; debounced save on store changes.
//
// Design notes:
// - No gapi client — plain fetch + Google Identity Services token client.
// - No refresh tokens in the browser. Silent refresh via prompt:'' when we
//   have an active Google session.
// - Last-write-wins using Drive's server-side modifiedTime as the clock.
// - Exposes itself as window.__driveSync so store.js can call requestSave()
//   without a circular import.

import { GOOGLE_CLIENT_ID, DRIVE_DATA_FILENAME } from './config.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const META_KEY = 'mp-drive-sync-meta';
const INIT_TIMEOUT_MS = 8000;
const GIS_LOAD_TIMEOUT_MS = 5000;
const SAVE_DEBOUNCE_MS = 2000;
const RETRY_SCHEDULE_MS = [15000, 60000, 300000];

let _tokenClient = null;
let _accessToken = null;
let _driveFileId = null;
let _lastKnownModifiedTime = null;
let _saveDebounceTimer = null;
let _saveInFlight = false;
let _savePending = false;
let _retryTimer = null;
let _retryIndex = 0;
let _status = 'disconnected';
const _statusListeners = new Set();
let _initialized = false;

// ── Status pub/sub ─────────────────────────────────────────────────────────

export function getStatus() { return _status; }
export function isSignedIn() { return !!_accessToken; }

export function subscribeStatus(fn) {
  _statusListeners.add(fn);
  return () => _statusListeners.delete(fn);
}

function setStatus(next) {
  if (_status === next) return;
  _status = next;
  for (const fn of _statusListeners) { try { fn(next); } catch {} }
}

// ── Meta (persisted sync state) ────────────────────────────────────────────

function readMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeMeta(patch) {
  const cur = readMeta();
  const next = { ...cur, ...patch };
  try { localStorage.setItem(META_KEY, JSON.stringify(next)); } catch {}
  return next;
}

// ── localStorage sweep (capture/restore all mp-* keys) ─────────────────────

function readAllLocalStorage() {
  const keys = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('mp-') || k === META_KEY) continue;
    keys[k] = localStorage.getItem(k);
  }
  return keys;
}

function writeAllLocalStorage(keys) {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('mp-') && k !== META_KEY) toRemove.push(k);
  }
  for (const k of toRemove) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(keys || {})) {
    if (typeof v === 'string') localStorage.setItem(k, v);
  }
}

// ── GIS token client ───────────────────────────────────────────────────────

async function waitForGis(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google?.accounts?.oauth2?.initTokenClient) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

function initTokenClient() {
  if (_tokenClient) return _tokenClient;
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPE,
    callback: () => {},
  });
  return _tokenClient;
}

function requestToken(silent) {
  return new Promise((resolve, reject) => {
    initTokenClient();
    _tokenClient.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error));
      _accessToken = resp.access_token;
      resolve(resp.access_token);
    };
    try {
      _tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
    } catch (e) { reject(e); }
  });
}

// ── Drive REST ─────────────────────────────────────────────────────────────

async function driveFetch(url, opts = {}, allowRetry = true) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${_accessToken}` },
  });
  if (res.status === 401 && allowRetry) {
    await requestToken(true);
    return driveFetch(url, opts, false);
  }
  return res;
}

async function findOrCreateFile() {
  const meta = readMeta();
  if (meta.driveFileId) {
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${meta.driveFileId}?fields=id,modifiedTime,size`
    );
    if (res.ok) {
      const data = await res.json();
      _driveFileId = data.id;
      _lastKnownModifiedTime = data.modifiedTime;
      return { id: data.id, modifiedTime: data.modifiedTime, size: +data.size || 0, isNew: false };
    }
    // fall through — cached id is stale
  }

  const q = encodeURIComponent(`name='${DRIVE_DATA_FILENAME}' and trashed=false`);
  const listRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime,size)`
  );
  if (!listRes.ok) throw new Error(`Drive list failed: ${listRes.status}`);
  const list = await listRes.json();
  if (list.files && list.files.length > 0) {
    const f = list.files[0];
    _driveFileId = f.id;
    _lastKnownModifiedTime = f.modifiedTime;
    writeMeta({ driveFileId: f.id });
    return { id: f.id, modifiedTime: f.modifiedTime, size: +f.size || 0, isNew: false };
  }

  const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_DATA_FILENAME, parents: ['appDataFolder'] }),
  });
  if (!createRes.ok) throw new Error(`Drive create failed: ${createRes.status}`);
  const created = await createRes.json();
  _driveFileId = created.id;
  writeMeta({ driveFileId: created.id });
  return { id: created.id, modifiedTime: null, size: 0, isNew: true };
}

async function downloadBlob() {
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${_driveFileId}?alt=media`);
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function uploadBlob(content) {
  // Generation check — if remote has changed since we last loaded it, another
  // device wrote in between. Abort and surface conflict.
  const headRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${_driveFileId}?fields=modifiedTime`
  );
  if (headRes.ok) {
    const head = await headRes.json();
    if (_lastKnownModifiedTime && head.modifiedTime !== _lastKnownModifiedTime) {
      setStatus('conflict');
      throw new Error('generation-mismatch');
    }
  }

  const res = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${_driveFileId}?uploadType=media&fields=modifiedTime`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }
  );
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  const out = await res.json();
  _lastKnownModifiedTime = out.modifiedTime;
  // Align localLastModified with Drive's server clock so the next boot's
  // "remote vs local" comparison doesn't spuriously detect a newer remote
  // due to server/client clock skew.
  writeMeta({
    lastKnownModifiedTime: out.modifiedTime,
    localLastModified: new Date(out.modifiedTime).getTime(),
  });
  return out;
}

function buildBlob() {
  return {
    version: 1,
    lastModified: Date.now(),
    localStorage: readAllLocalStorage(),
  };
}

// ── Save pipeline (called by store hooks) ──────────────────────────────────

export function requestSave() {
  if (!isSignedIn()) return;
  writeMeta({ localLastModified: Date.now() });
  if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
}

async function flushSave() {
  _saveDebounceTimer = null;
  if (_saveInFlight) { _savePending = true; return; }
  _saveInFlight = true;
  setStatus('saving');
  try {
    await uploadBlob(buildBlob());
    _retryIndex = 0;
    if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }
    setStatus('idle');
  } catch (e) {
    if (e.message !== 'generation-mismatch') {
      console.warn('Drive save failed', e);
      setStatus('error');
      scheduleRetry();
    }
  } finally {
    _saveInFlight = false;
    if (_savePending) {
      _savePending = false;
      _saveDebounceTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
    }
  }
}

function scheduleRetry() {
  if (_retryTimer) return;
  const delay = RETRY_SCHEDULE_MS[Math.min(_retryIndex, RETRY_SCHEDULE_MS.length - 1)];
  _retryIndex++;
  _retryTimer = setTimeout(() => { _retryTimer = null; flushSave(); }, delay);
}

export async function forceSync() {
  if (!isSignedIn()) return;
  if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }
  _retryIndex = 0;
  await flushSave();
}

// ── Initial load / conflict resolution ─────────────────────────────────────

async function handleInitialLoad() {
  setStatus('loading');
  const file = await findOrCreateFile();
  const meta = readMeta();

  if (file.isNew || file.size === 0) {
    await uploadBlob(buildBlob());
    setStatus('idle');
    return;
  }

  const remote = await downloadBlob();
  if (!remote) {
    await uploadBlob(buildBlob());
    setStatus('idle');
    return;
  }

  const remoteTime = new Date(file.modifiedTime).getTime();
  const localSynced = meta.localLastModified;

  if (!localSynced) {
    const choice = await promptConflict();
    if (choice === 'drive') {
      writeAllLocalStorage(remote.localStorage);
      writeMeta({ localLastModified: remoteTime, lastKnownModifiedTime: file.modifiedTime });
      location.reload();
      return;
    }
    if (choice === 'local') {
      await uploadBlob(buildBlob());
      setStatus('idle');
      return;
    }
    setStatus('idle');
    return;
  }

  if (remoteTime > localSynced) {
    writeAllLocalStorage(remote.localStorage);
    writeMeta({ localLastModified: remoteTime, lastKnownModifiedTime: file.modifiedTime });
    location.reload();
    return;
  }
  if (remoteTime < localSynced) {
    await uploadBlob(buildBlob());
    setStatus('idle');
    return;
  }
  setStatus('idle');
}

function promptConflict() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    overlay.innerHTML = `
      <div style="background:#fff;max-width:460px;padding:24px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.3);">
        <h2 style="margin:0 0 12px;font-size:18px;">Data exists in both places</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#333;">
          You have meal-planner data on this device and in your Google Drive.
          Which copy should be kept?
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="__mp_cd" style="padding:10px;border:1px solid #2a7;background:#2a7;color:#fff;border-radius:6px;cursor:pointer;font-size:14px;">
            Use Drive data (replace this device)
          </button>
          <button id="__mp_cl" style="padding:10px;border:1px solid #ccc;background:#fff;color:#333;border-radius:6px;cursor:pointer;font-size:14px;">
            Use this device (overwrite Drive)
          </button>
          <button id="__mp_cc" style="padding:8px;border:none;background:transparent;color:#666;cursor:pointer;font-size:13px;">
            Cancel (decide later)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#__mp_cd').onclick = () => { overlay.remove(); resolve('drive'); };
    overlay.querySelector('#__mp_cl').onclick = () => { overlay.remove(); resolve('local'); };
    overlay.querySelector('#__mp_cc').onclick = () => { overlay.remove(); resolve('cancel'); };
  });
}

// ── Public entry points ────────────────────────────────────────────────────

export async function signIn() {
  setStatus('connecting');
  try {
    const ok = await waitForGis(GIS_LOAD_TIMEOUT_MS);
    if (!ok) throw new Error('Google Identity Services did not load');
    await requestToken(false);
    writeMeta({ wasPreviouslySignedIn: true });
    await handleInitialLoad();
  } catch (e) {
    console.warn('Drive sign-in failed', e);
    setStatus('error');
  }
}

export function signOut() {
  _accessToken = null;
  writeMeta({ wasPreviouslySignedIn: false });
  setStatus('disconnected');
}

export async function initDriveSync() {
  if (_initialized) return;
  _initialized = true;

  // Expose for store.js hooks (avoids circular import).
  window.__driveSync = { requestSave };

  const meta = readMeta();
  const configured = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('PASTE-');

  if (!configured) {
    setStatus('disconnected');
    console.info('[drive-sync] Client ID not configured; see SETUP.md.');
    return;
  }
  if (!meta.wasPreviouslySignedIn) {
    setStatus('disconnected');
    return;
  }

  try {
    const gisReady = await withTimeout(waitForGis(GIS_LOAD_TIMEOUT_MS), INIT_TIMEOUT_MS);
    if (!gisReady) throw new Error('GIS load timeout');
    await withTimeout(requestToken(true), INIT_TIMEOUT_MS);
    await withTimeout(handleInitialLoad(), INIT_TIMEOUT_MS);
  } catch (e) {
    console.warn('[drive-sync] Silent init failed, proceeding offline', e);
    setStatus('disconnected');
  }
}

function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}
