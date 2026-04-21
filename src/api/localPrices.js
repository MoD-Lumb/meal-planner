// Reads the meal-planner's committed price catalog from ./data/prices/.
// The catalog is produced by build_prices_index.py in the sibling
// CijeneAPI_ArhivaPodataka folder and refreshed via the RefreshPrices skill.
//
// Index and per-chain JSON are cached in-memory for the session.

const BASE_URL = new URL('./data/prices/', document.baseURI).href;

let _indexPromise = null;
const _chainCache = new Map(); // code -> Promise<chainData>

export class LocalPricesError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LocalPricesError';
  }
}

export function loadIndex() {
  if (!_indexPromise) {
    _indexPromise = fetch(BASE_URL + 'index.json', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new LocalPricesError(`Price index missing (HTTP ${r.status}). Run the RefreshPrices skill.`);
        return r.json();
      })
      .catch(e => {
        _indexPromise = null;
        throw e instanceof LocalPricesError ? e : new LocalPricesError(`Network error loading index: ${e.message}`);
      });
  }
  return _indexPromise;
}

export function loadChain(code) {
  if (!_chainCache.has(code)) {
    const p = fetch(BASE_URL + encodeURIComponent(code) + '.json', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new LocalPricesError(`Chain '${code}' not found (HTTP ${r.status}).`);
        return r.json();
      })
      .then(raw => {
        // Convert row-array format into objects once, at parse time.
        const fields = raw.fields;
        const products = raw.products.map(row => {
          const o = {};
          for (let i = 0; i < fields.length; i++) o[fields[i]] = row[i];
          o._searchKey = normalize(o.name);
          return o;
        });
        return { ...raw, products };
      })
      .catch(e => {
        _chainCache.delete(code);
        throw e instanceof LocalPricesError ? e : new LocalPricesError(`Network error loading ${code}: ${e.message}`);
      });
    _chainCache.set(code, p);
  }
  return _chainCache.get(code);
}

// Strip diacritics + lowercase for Croatian-friendly substring matching.
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find the best product match in one chain, by ingredient name.
// Returns the product object (with `minPrice`) or null.
export async function findBestMatch(chainCode, query) {
  const chain = await loadChain(chainCode);
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const p of chain.products) {
    const score = scoreMatch(p._searchKey, tokens);
    if (score > bestScore) {
      best = p;
      bestScore = score;
      if (score >= tokens.length * 2) break; // exact match on all tokens — stop early
    }
  }
  return best;
}

// Simple token-overlap score: +2 for token contained as whole word,
// +1 for token contained as substring. 0 if any token is missing.
function scoreMatch(searchKey, tokens) {
  let score = 0;
  for (const t of tokens) {
    const asWord = new RegExp(`\\b${escRe(t)}\\b`).test(searchKey);
    if (asWord) { score += 2; continue; }
    if (searchKey.includes(t)) { score += 1; continue; }
    return 0; // missing token — reject outright
  }
  return score;
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── City / store directory helpers ────────────────────────────────────────
// These read from the already-cached index + per-chain JSON. `stores` are
// present only in catalogs built with build_prices_index.py schema ≥ 1
// including the "stores" field (added 2026-04-21).

export async function getAllCities() {
  const index = await loadIndex();
  const set = new Set();
  for (const c of index.chains) {
    for (const city of (c.cities || [])) set.add(city);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'hr'));
}

export async function getChainsInCity(city) {
  const index = await loadIndex();
  return index.chains.filter(c => (c.cities || []).includes(city));
}

export async function getStoresInCity(chainCode, city) {
  const chain = await loadChain(chainCode);
  const stores = chain.stores || [];
  return stores.filter(s => s.city === city);
}

// Return top-N matches for UI "pick a different product" flows (future use).
export async function searchTop(chainCode, query, limit = 5) {
  const chain = await loadChain(chainCode);
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  const scored = [];
  for (const p of chain.products) {
    const s = scoreMatch(p._searchKey, tokens);
    if (s > 0) scored.push({ p, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map(x => x.p);
}
