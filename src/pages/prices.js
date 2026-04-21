import { menuStore, profileStore, getProductLinks, getGroceryChoicesForChain } from '../store.js';
import { aggregateGroceries } from '../utils/groceryAggregator.js';
import { loadIndex, findBestMatch, getProductsByIds, LocalPricesError } from '../api/localPrices.js';

export function renderPrices(container) {
  const profile = profileStore.get();
  const items   = aggregateGroceries(menuStore.get()).filter(it => !it.mealId);

  container.innerHTML = `
    <div class="page-header">
      <h1>Prices</h1>
      <p class="page-subtitle">Compare the total cost of your grocery list across supermarkets.</p>
    </div>

    <div id="prices-preflight"></div>
    <div id="prices-content"></div>
  `;

  const preflight = container.querySelector('#prices-preflight');

  loadIndex()
    .then(index => {
      preflight.innerHTML = renderPreflight(index, profile, items);
      const runBtn = container.querySelector('#run-compare-btn');
      runBtn?.addEventListener('click', () => runComparison(container, index, profile, items));
    })
    .catch(err => {
      preflight.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>Price catalog not available</h3>
          <p>${escHtml(err instanceof LocalPricesError ? err.message : String(err))}</p>
        </div>
      `;
    });
}

// Chains to compare: profile preference if set, otherwise every chain in the catalog.
function chainsToCompare(index, profile) {
  const available = index.chains.map(c => c.code);
  const availableSet = new Set(available);
  const picked = (profile.selectedChains || []).filter(c => availableSet.has(c));
  return picked.length ? picked : available;
}

function renderPreflight(index, profile, items) {
  if (items.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>Nothing to compare yet</h3>
        <p>Plan some meals on your <a href="#/weekly" class="link">Weekly Menu</a> first — the grocery list feeds this page.</p>
      </div>
    `;
  }

  const chains = chainsToCompare(index, profile);
  const usingDefault = !(profile.selectedChains?.length);
  const chainLabel = usingDefault
    ? `all <strong>${chains.length}</strong> chains (no preference set on your <a href="#/profile" class="link">Profile</a>)`
    : `<strong>${chains.length}</strong> selected chains`;

  return `
    <div class="profile-card">
      <p>Ready to compare <strong>${items.length}</strong> items across ${chainLabel}. Catalog date: <strong>${escHtml(index.date)}</strong>.</p>
      <div class="form-actions">
        <button class="btn btn-primary" id="run-compare-btn">Compare prices</button>
      </div>
    </div>
  `;
}

async function runComparison(container, index, profile, items) {
  const content = container.querySelector('#prices-content');
  const chains = chainsToCompare(index, profile);
  const chainMeta = new Map(index.chains.map(c => [c.code, c]));

  content.innerHTML = `<p class="nt-hint">Matching ${items.length} items across ${chains.length} chains…</p>`;

  try {
    // matches[itemIndex][chainCode] = { product, linked } | null
    const matchesByChain = {};
    for (const chain of chains) {
      const perItem = [];
      for (const item of items) {
        perItem.push(await matchForItem(chain, item));
      }
      matchesByChain[chain] = perItem;
    }

    // Per-item include state — unchecked rows are skipped in summary totals.
    const included = new Set(items.map((_, i) => i));

    function computeTotals() {
      return chains.map(chain => {
        const perItem = matchesByChain[chain];
        let total = 0, foundCount = 0;
        perItem.forEach((entry, i) => {
          if (!included.has(i)) return;
          const p = entry?.product;
          if (p && typeof p.minPrice === 'number') {
            total += p.minPrice;
            foundCount++;
          }
        });
        return { chain, total, foundCount };
      });
    }

    function summaryHtml() {
      const totals = computeTotals();
      const ranked = [...totals].sort((a, b) => b.foundCount - a.foundCount || a.total - b.total);
      const cheapest = ranked[0];
      const denom = included.size;
      return totals.map(t => {
        const meta = chainMeta.get(t.chain);
        return `
          <div class="prices-card ${t.chain === cheapest?.chain ? 'prices-card--best' : ''}">
            <div class="prices-card-chain">${escHtml(meta?.displayName || t.chain)}${t.chain === cheapest?.chain ? ' · cheapest' : ''}</div>
            <div class="prices-card-total">€${t.total.toFixed(2)}</div>
            <div class="prices-card-coverage">${t.foundCount}/${denom} items matched</div>
          </div>
        `;
      }).join('');
    }

    content.innerHTML = `
      <div class="prices-summary" id="prices-summary">${summaryHtml()}</div>

      <div class="profile-card">
        <h3 style="margin-top:0">Breakdown per item</h3>
        <div style="overflow-x:auto">
        <table class="prices-table">
          <thead>
            <tr>
              <th>Your ingredient</th>
              ${chains.map(c => `<th>${escHtml(chainMeta.get(c)?.displayName || c)}</th>`).join('')}
              <th class="prices-include-col" title="Untick to exclude from totals">Include</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, i) => `
              <tr data-row="${i}">
                <td>${escHtml(it.name)}</td>
                ${chains.map(c => {
                  const entry = matchesByChain[c][i];
                  const p = entry?.product;
                  if (!p) return `<td><em>—</em></td>`;
                  const tag = sourceTag(entry.source);
                  const np = normalizedPrice(p);
                  const npStr = np ? `€${np.value.toFixed(2)}${np.label.slice(1)}` : '';
                  return `<td title="${escHtml(p.name)}">€${Number(p.minPrice).toFixed(2)}${tag}<br><small class="nt-hint">${escHtml(truncate(p.name, 40))}${npStr ? ` · ${npStr}` : ''}</small></td>`;
                }).join('')}
                <td class="prices-include-col">
                  <input type="checkbox" class="prices-include-cb" data-item="${i}" checked aria-label="Include in totals">
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
        <p class="nt-hint">Totals sum one unit-price per matched product (lowest price across that chain's stores). Cheapest is picked by €/100g, €/100ml, or €/piece depending on unit.</p>
      </div>
    `;

    content.addEventListener('change', (e) => {
      const cb = e.target.closest('.prices-include-cb');
      if (!cb) return;
      const i = Number(cb.dataset.item);
      if (cb.checked) included.add(i); else included.delete(i);
      const row = cb.closest('tr');
      if (row) row.classList.toggle('prices-row-excluded', !cb.checked);
      const summary = content.querySelector('#prices-summary');
      if (summary) summary.innerHTML = summaryHtml();
    });
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><h3>Failed to compare</h3><p>${escHtml(err instanceof LocalPricesError ? err.message : String(err))}</p></div>`;
  }
}

// Normalize a product's price to a common unit so different pack sizes can
// be compared fairly. Mass → €/100g, volume → €/100ml, else → €/piece.
// Returns null if quantity/price aren't usable.
function normalizedPrice(product) {
  const qty = Number(product?.quantity);
  const unit = String(product?.unit || '').toLowerCase().trim();
  const price = Number(product?.minPrice);
  if (!isFinite(qty) || qty <= 0 || !isFinite(price)) return null;
  if (unit === 'g')  return { value: (price / qty) * 100, label: '€/100g' };
  if (unit === 'kg') return { value: (price / (qty * 1000)) * 100, label: '€/100g' };
  if (unit === 'ml') return { value: (price / qty) * 100, label: '€/100ml' };
  if (unit === 'l')  return { value: (price / (qty * 1000)) * 100, label: '€/100ml' };
  return { value: price / qty, label: '€/pc' };
}

// Pick cheapest by normalized unit price; break ties by raw minPrice so the
// same-unit-rate product in the smaller (usually less wasteful) pack wins.
function pickCheapest(products) {
  let best = null;
  let bestKey = Number.POSITIVE_INFINITY;
  for (const p of products) {
    const np = normalizedPrice(p);
    const key = np ? np.value : Number.POSITIVE_INFINITY;
    if (best == null || key < bestKey ||
        (key === bestKey && Number(p.minPrice) < Number(best.minPrice))) {
      best = p;
      bestKey = key;
    }
  }
  return best;
}

// 3-tier resolution — returns { product, source } or null.
// 1. Weekly Groceries picks for this chain — cheapest of the user's picks.
// 2. Linked products pool — cheapest of the ingredient's chain-wide links.
// 3. Token-overlap auto-match against the chain's catalog.
async function matchForItem(chain, item) {
  if (item.foodId) {
    const pickIds = getGroceryChoicesForChain(item.foodId, chain);
    if (pickIds.length > 0) {
      const priced = (await getProductsByIds(chain, pickIds))
        .filter(p => typeof p.minPrice === 'number');
      if (priced.length > 0) return { product: pickCheapest(priced), source: 'pick' };
    }
  }

  const ids = item.foodId ? getProductLinks(item.foodId, chain) : [];
  if (ids.length > 0) {
    const priced = (await getProductsByIds(chain, ids))
      .filter(p => typeof p.minPrice === 'number');
    if (priced.length > 0) return { product: pickCheapest(priced), source: 'link' };
  }

  const p = await findBestMatch(chain, item.name);
  return p ? { product: p, source: 'auto' } : null;
}

function sourceTag(source) {
  if (source === 'pick') {
    return ` <span class="picked-dot" title="Cheapest of your weekly picks">·picked</span>`;
  }
  if (source === 'link') {
    return ` <span class="linked-dot" title="Cheapest of your linked products">·linked</span>`;
  }
  return '';
}

function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function escHtml(str) {
  return (str == null ? '' : String(str)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
