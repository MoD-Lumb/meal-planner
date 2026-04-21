import { profileStore, getProductLinks, setProductLinks } from '../store.js';
import { loadIndex, searchTopWithSelected, LocalPricesError } from '../api/localPrices.js';

// Open a modal for picking which supermarket products represent `food`
// across the user's selected chains. `onSaved()` fires after the user saves
// so the caller can refresh its own view (badge counts, etc.).
export function openLinkProductsModal(food, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay lp-modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box lp-modal-box" role="dialog" aria-modal="true" aria-labelledby="lp-title">
      <div class="modal-header">
        <h3 id="lp-title">Link products · ${escHtml(food.name)}</h3>
        <button type="button" class="modal-close" data-action="close" aria-label="Close">✕</button>
      </div>
      <div class="lp-modal-body">
        <div class="lp-preflight"></div>
        <div class="lp-search" hidden>
          <input type="search" class="search-input lp-search-input"
            placeholder="Refine search (e.g. pileći file)"
            value="${escHtml(food.name)}">
        </div>
        <div class="lp-chains"></div>
      </div>
      <div class="modal-footer lp-modal-footer">
        <span class="lp-feedback save-feedback"></span>
        <button type="button" class="btn btn-outline" data-action="cancel">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const preflight = overlay.querySelector('.lp-preflight');
  const searchWrap = overlay.querySelector('.lp-search');
  const searchInput = overlay.querySelector('.lp-search-input');
  const chainsHost = overlay.querySelector('.lp-chains');
  const feedback = overlay.querySelector('.lp-feedback');

  // Draft state: chainCode -> Set<productId>. Seeded from the saved store on boot.
  const draft = new Map();

  let activeChains = [];   // chain metadata entries for rendering
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKeyDown);

  overlay.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'close' || action === 'cancel') { close(); return; }
    if (action === 'save')   { saveAndClose(); return; }
    // click outside the box closes
    if (e.target === overlay) close();
  });

  // Load catalog index + pick chains, then render
  loadIndex().then(index => {
    const profile = profileStore.get();
    const picked = Array.isArray(profile.selectedChains) ? profile.selectedChains : [];
    const availableCodes = index.chains.map(c => c.code);
    const filtered = picked.length
      ? index.chains.filter(c => picked.includes(c.code))
      : index.chains;
    activeChains = filtered;

    // Seed draft from saved store
    for (const c of activeChains) {
      draft.set(c.code, new Set(getProductLinks(food.id, c.code)));
    }

    if (activeChains.length === 0) {
      preflight.innerHTML = `
        <div class="lp-notice lp-notice-error">
          No chains match your profile selection. Pick at least one chain on your
          <a href="#/profile" class="link">Profile</a> first.
        </div>
      `;
      return;
    }

    if (!picked.length) {
      preflight.innerHTML = `
        <div class="lp-notice">
          No chain preference on your <a href="#/profile" class="link">Profile</a> — showing all
          <strong>${availableCodes.length}</strong> chains from the catalog.
        </div>
      `;
    }

    searchWrap.hidden = false;
    chainsHost.innerHTML = activeChains.map(c => `
      <section class="lp-chain-card" data-chain="${escHtml(c.code)}">
        <header class="lp-chain-header">
          <span class="lp-chain-name">${escHtml(c.displayName || c.code)}</span>
          <span class="lp-chain-count nt-hint" data-role="count"></span>
        </header>
        <div class="lp-chain-list" data-role="list">
          <div class="nt-hint">Loading…</div>
        </div>
      </section>
    `).join('');

    // Initial render per chain uses food.name as the query
    refreshAllChains(food.name);
    // Focus search so the user can type immediately
    searchInput.focus();
    searchInput.select();
  }).catch(err => {
    preflight.innerHTML = `
      <div class="lp-notice lp-notice-error">
        ${escHtml(err instanceof LocalPricesError
          ? err.message
          : 'Price catalog not available.')} Run the RefreshPrices skill to (re)build it.
      </div>
    `;
  });

  // Debounced search
  let searchTimer = null;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => refreshAllChains(searchInput.value), 160);
  });

  async function refreshAllChains(query) {
    await Promise.all(activeChains.map(c => refreshChain(c.code, query)));
  }

  async function refreshChain(chainCode, query) {
    const card = chainsHost.querySelector(`.lp-chain-card[data-chain="${cssEscape(chainCode)}"]`);
    if (!card) return;
    const list = card.querySelector('[data-role="list"]');
    const countEl = card.querySelector('[data-role="count"]');
    const selected = draft.get(chainCode) || new Set();
    try {
      const items = await searchTopWithSelected(chainCode, query, Array.from(selected), 10);
      if (!items.length) {
        list.innerHTML = `<div class="nt-hint">No matches. Try a different search.</div>`;
      } else {
        list.innerHTML = items.map(({ product, selected: wasSelected }) => {
          const checked = selected.has(String(product.id));
          const meta = [product.brand, product.quantity && product.unit ? `${product.quantity} ${product.unit}` : null]
            .filter(Boolean).join(' · ');
          const price = typeof product.minPrice === 'number' ? `€${product.minPrice.toFixed(2)}` : '—';
          return `
            <label class="lp-product ${wasSelected ? 'lp-product-pinned' : ''}">
              <input type="checkbox" class="lp-product-cb" data-pid="${escHtml(String(product.id))}" ${checked ? 'checked' : ''}>
              <span class="lp-product-name">${escHtml(product.name)}</span>
              ${meta ? `<span class="lp-product-meta nt-hint">${escHtml(meta)}</span>` : ''}
              <span class="lp-product-price">${price}</span>
            </label>
          `;
        }).join('');
      }
      updateCount(chainCode);
    } catch (err) {
      list.innerHTML = `<div class="nt-hint">Failed to load: ${escHtml(err.message || String(err))}</div>`;
    }
  }

  function updateCount(chainCode) {
    const card = chainsHost.querySelector(`.lp-chain-card[data-chain="${cssEscape(chainCode)}"]`);
    if (!card) return;
    const countEl = card.querySelector('[data-role="count"]');
    const n = draft.get(chainCode)?.size || 0;
    countEl.textContent = n ? `${n} selected` : '';
  }

  chainsHost.addEventListener('change', (e) => {
    const cb = e.target.closest('.lp-product-cb');
    if (!cb) return;
    const card = cb.closest('.lp-chain-card');
    const chainCode = card?.dataset.chain;
    const pid = cb.dataset.pid;
    if (!chainCode || !pid) return;
    const set = draft.get(chainCode) || new Set();
    if (cb.checked) set.add(pid); else set.delete(pid);
    draft.set(chainCode, set);
    updateCount(chainCode);
  });

  function saveAndClose() {
    for (const chain of activeChains) {
      const ids = Array.from(draft.get(chain.code) || new Set());
      setProductLinks(food.id, chain.code, ids);
    }
    feedback.textContent = 'Saved.';
    try { onSaved?.(); } catch {}
    close();
  }
}

function escHtml(str) {
  return (str == null ? '' : String(str))
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Minimal CSS.escape fallback for attribute-selector embedding (chain codes
// are alphanumerics plus `_`/`-`, so this is almost always a no-op).
function cssEscape(s) {
  return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"');
}
