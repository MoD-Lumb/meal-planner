// Client for the cijene-api public instance (https://api.cijene.dev).
// Docs: https://cijene.dev/docs  |  Free-tier key: email info@dobarkod.hr
//
// The API key is read from the apiConfigStore (see store.js) and sent as
// `Authorization: Bearer <key>`. CORS is open on the public instance.

import { apiConfigStore } from '../store.js';

const BASE_URL = 'https://api.cijene.dev/v1';

export class CijeneApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CijeneApiError';
    this.status = status;
  }
}

function getKey() {
  return (apiConfigStore.get().cijeneApiKey || '').trim();
}

async function request(path, params) {
  const key = getKey();
  if (!key) {
    throw new CijeneApiError('No API key configured. Set it on your profile.', 0);
  }

  const url = new URL(BASE_URL + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        if (v.length === 0) continue;
        url.searchParams.set(k, v.join(','));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  let res;
  try {
    res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
    });
  } catch (err) {
    throw new CijeneApiError(`Network error: ${err.message}`, 0);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body && body.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {}
    throw new CijeneApiError(`API ${res.status}: ${detail}`, res.status);
  }
  return res.json();
}

// GET /v1/chains/  → list of chain codes (e.g. ["konzum","lidl",...])
export function listChains() {
  return request('/chains/');
}

// GET /v1/stores/?chains=a,b&city=...  → list of stores
export function listStores({ chains, city } = {}) {
  return request('/stores/', { chains, city });
}

// GET /v1/products/?q=...&chains=...&limit=...
export function searchProducts(q, { chains, limit = 20, fuzzy = true } = {}) {
  return request('/products/', { q, chains, limit, fuzzy });
}

// GET /v1/prices/?eans=a,b,c&chains=...
export function getPrices({ eans, chains, city } = {}) {
  return request('/prices/', { eans, chains, city });
}
