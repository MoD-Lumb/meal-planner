import { menuStore, profileStore } from '../store.js';
import { aggregateGroceries } from '../utils/groceryAggregator.js';
import { loadIndex, findBestMatch, LocalPricesError } from '../api/localPrices.js';

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
    // matches[itemIndex][chainCode] = product | null
    const matchesByChain = {};
    for (const chain of chains) {
      const perItem = [];
      for (const item of items) {
        const p = await findBestMatch(chain, item.name);
        perItem.push(p || null);
      }
      matchesByChain[chain] = perItem;
    }

    const totals = chains.map(chain => {
      const perItem = matchesByChain[chain];
      let total = 0;
      let foundCount = 0;
      for (const p of perItem) {
        if (p && typeof p.minPrice === 'number') {
          total += p.minPrice;
          foundCount++;
        }
      }
      return { chain, total, foundCount };
    });

    const ranked = [...totals].sort((a, b) => b.foundCount - a.foundCount || a.total - b.total);
    const cheapest = ranked[0];

    content.innerHTML = `
      <div class="prices-summary">
        ${totals.map(t => {
          const meta = chainMeta.get(t.chain);
          return `
            <div class="prices-card ${t.chain === cheapest?.chain ? 'prices-card--best' : ''}">
              <div class="prices-card-chain">${escHtml(meta?.displayName || t.chain)}${t.chain === cheapest?.chain ? ' · cheapest' : ''}</div>
              <div class="prices-card-total">€${t.total.toFixed(2)}</div>
              <div class="prices-card-coverage">${t.foundCount}/${items.length} items matched</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="profile-card">
        <h3 style="margin-top:0">Breakdown per item</h3>
        <div style="overflow-x:auto">
        <table class="prices-table">
          <thead>
            <tr>
              <th>Your ingredient</th>
              ${chains.map(c => `<th>${escHtml(chainMeta.get(c)?.displayName || c)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${items.map((it, i) => `
              <tr>
                <td>${escHtml(it.name)}</td>
                ${chains.map(c => {
                  const p = matchesByChain[c][i];
                  if (!p) return `<td><em>—</em></td>`;
                  return `<td title="${escHtml(p.name)}">€${Number(p.minPrice).toFixed(2)}<br><small class="nt-hint">${escHtml(truncate(p.name, 40))}</small></td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
        <p class="nt-hint">Totals sum one unit-price per matched product (lowest price across that chain's stores). Quantity-aware totals (kg/g/pcs scaling) are a next step.</p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><h3>Failed to compare</h3><p>${escHtml(err instanceof LocalPricesError ? err.message : String(err))}</p></div>`;
  }
}

function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function escHtml(str) {
  return (str == null ? '' : String(str)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
