import { menuStore, profileStore, apiConfigStore } from '../store.js';
import { aggregateGroceries } from '../utils/groceryAggregator.js';
import { searchProducts, getPrices, CijeneApiError } from '../api/cijeneApi.js';

export function renderPrices(container) {
  const profile = profileStore.get();
  const apiKey  = apiConfigStore.get().cijeneApiKey || '';
  const items   = aggregateGroceries(menuStore.get()).filter(it => !it.mealId);

  container.innerHTML = `
    <div class="page-header">
      <h1>Prices</h1>
      <p class="page-subtitle">Compare the total cost of your grocery list across supermarkets.</p>
    </div>

    ${renderPreflight(apiKey, profile, items)}

    <div id="prices-content"></div>
  `;

  const runBtn = container.querySelector('#run-compare-btn');
  runBtn?.addEventListener('click', () => runComparison(container, profile, items));
}

function renderPreflight(apiKey, profile, items) {
  const missing = [];
  if (!apiKey.trim())                         missing.push('API key');
  if (!profile.city)                          missing.push('city');
  if (!(profile.selectedChains?.length))      missing.push('at least one chain');
  if (items.length === 0)                     missing.push('grocery items (plan meals first)');

  if (missing.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>Not ready to compare yet</h3>
        <p>Missing: ${missing.join(', ')}. Set these up on your <a href="#/profile" class="link">Profile</a> and <a href="#/weekly" class="link">Weekly Menu</a>.</p>
      </div>
    `;
  }

  return `
    <div class="profile-card">
      <p>Ready to compare <strong>${items.length}</strong> items across <strong>${profile.selectedChains.length}</strong> chains in <strong>${escHtml(profile.city)}</strong>.</p>
      <div class="form-actions">
        <button class="btn btn-primary" id="run-compare-btn">Compare prices</button>
      </div>
    </div>
  `;
}

async function runComparison(container, profile, items) {
  const content = container.querySelector('#prices-content');
  content.innerHTML = `<p class="nt-hint">Searching products…</p>`;

  try {
    // 1) Find a matching EAN for each ingredient via search.
    const matches = [];
    for (const item of items) {
      try {
        const searchResult = await searchProducts(item.name, {
          chains: profile.selectedChains,
          limit: 1,
          fuzzy: true,
        });
        const products = Array.isArray(searchResult) ? searchResult : (searchResult?.products || []);
        const first = products[0];
        if (first && (first.ean || first.barcode)) {
          matches.push({
            item,
            ean:  first.ean || first.barcode,
            name: first.name || first.title || item.name,
          });
        } else {
          matches.push({ item, ean: null, name: null });
        }
      } catch (err) {
        matches.push({ item, ean: null, name: null, error: err.message });
      }
    }

    const matchedEans = matches.filter(m => m.ean).map(m => m.ean);
    if (matchedEans.length === 0) {
      content.innerHTML = `<p>No products found for any of your items. Try different ingredient names.</p>`;
      return;
    }

    content.innerHTML = `<p class="nt-hint">Fetching prices for ${matchedEans.length} matched products…</p>`;

    // 2) Fetch prices for the matched EANs across selected chains/city.
    const priceResult = await getPrices({
      eans: matchedEans,
      chains: profile.selectedChains,
      city: profile.city,
    });
    const priceRows = Array.isArray(priceResult) ? priceResult : (priceResult?.prices || []);

    // 3) Build a per-chain total using the lowest price per EAN within that chain.
    const bestPricePerEanPerChain = {}; // { chain: { ean: minPrice } }
    for (const row of priceRows) {
      const chain = row.chain_code || row.chain;
      const ean   = row.ean || row.barcode;
      const price = parseFloat(row.price ?? row.regular_price ?? row.special_price);
      if (!chain || !ean || !isFinite(price)) continue;
      const bucket = (bestPricePerEanPerChain[chain] ||= {});
      if (bucket[ean] === undefined || price < bucket[ean]) bucket[ean] = price;
    }

    const totals = profile.selectedChains.map(chain => {
      let total = 0;
      let foundCount = 0;
      const lines = matches.map(m => {
        if (!m.ean) return { name: m.item.name, matchedName: null, qty: m.item.totalsByUnit, unitPrice: null, cost: null };
        const price = bestPricePerEanPerChain[chain]?.[m.ean];
        if (price !== undefined) {
          foundCount++;
          total += price; // NOTE: unit-price × 1 for now; quantity scaling is a follow-up.
        }
        return {
          name: m.item.name,
          matchedName: m.name,
          qty: m.item.totalsByUnit,
          unitPrice: price ?? null,
          cost: price ?? null,
        };
      });
      return { chain, total, foundCount, lines };
    });

    const ranked = [...totals].sort((a, b) => b.foundCount - a.foundCount || a.total - b.total);
    const cheapest = ranked[0];

    content.innerHTML = `
      <div class="prices-summary">
        ${totals.map(t => `
          <div class="prices-card ${t.chain === cheapest?.chain ? 'prices-card--best' : ''}">
            <div class="prices-card-chain">${escHtml(t.chain)}${t.chain === cheapest?.chain ? ' · cheapest' : ''}</div>
            <div class="prices-card-total">€${t.total.toFixed(2)}</div>
            <div class="prices-card-coverage">${t.foundCount}/${matches.length} items matched</div>
          </div>
        `).join('')}
      </div>

      <div class="profile-card">
        <h3 style="margin-top:0">Breakdown per item</h3>
        <table class="prices-table">
          <thead>
            <tr>
              <th>Your ingredient</th>
              <th>Matched product</th>
              ${profile.selectedChains.map(c => `<th>${escHtml(c)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${matches.map((m, i) => `
              <tr>
                <td>${escHtml(m.item.name)}</td>
                <td>${m.name ? escHtml(m.name) : '<em>no match</em>'}</td>
                ${profile.selectedChains.map(c => {
                  const p = m.ean ? bestPricePerEanPerChain[c]?.[m.ean] : undefined;
                  return `<td>${p !== undefined ? '€' + p.toFixed(2) : '—'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="nt-hint">Totals sum one unit-price per matched product. Quantity-aware totals (kg/g/pcs scaling) are a next step.</p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><h3>Failed to compare</h3><p>${escHtml(err instanceof CijeneApiError ? err.message : String(err))}</p></div>`;
  }
}

function escHtml(str) {
  return (str == null ? '' : String(str)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
