import { menuStore } from '../store.js';
import { aggregateGroceries, formatQtyUnit } from '../utils/groceryAggregator.js';
import { mealsDatabase } from '../data/mealsDatabase.js';
import { findFoodById } from '../data/foodDatabase.js';
import {
  customFoodsStore,
  hasAnyLinks,
  getProductLinks,
  getGroceryChoices,
  getGroceryChoicesForChain,
  countGroceryChoicesByChain,
  hasGroceryChoices,
  toggleGroceryChoice,
  clearGroceryChoices,
} from '../store.js';
import { loadIndex, getProductsByIds, LocalPricesError } from '../api/localPrices.js';

// Shared catalog chain-meta map (code → displayName). Populated on first
// panel open; reused across rows and button refreshes for chain labels.
let chainLabelMap = null;

export function renderGroceries(container) {
  buildPage(container);
}

function buildPage(container) {
  const menu = menuStore.get();
  const items = aggregateGroceries(menu);

  container.innerHTML = `
    <div class="page-header">
      <h1>Groceries</h1>
      <div class="page-header-actions">
        <button class="btn btn-outline btn-sm" id="copy-list-btn">Copy List</button>
      </div>
    </div>

    ${items.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your grocery list is empty</h3>
        <p>Plan some meals in the <a href="#/weekly" class="link">Weekly Menu</a> to auto-generate your shopping list.</p>
      </div>
    ` : `
      <p class="page-subtitle">${items.length} item${items.length !== 1 ? 's' : ''} needed for your week.</p>

      <div class="grocery-list" id="grocery-list">
        ${items.map((item, i) => renderGroceryItem(item, i)).join('')}
      </div>
    `}
  `;

  bindEvents(container, items);
}

function renderGroceryItem(item, index) {
  const unitStrings = Object.entries(item.totalsByUnit)
    .map(([unit, qty]) => formatQtyUnit(qty, unit))
    .join(' + ');

  const isMeal = !!item.mealId;
  const meal = isMeal ? mealsDatabase.find(m => m.id === item.mealId) : null;
  const portions = item.totalsByUnit['portion'] || 1;

  const canPick = !isMeal && !!item.foodId && hasAnyLinks(item.foodId);

  return `
    <div class="grocery-item ${isMeal ? 'grocery-item--meal' : ''}" data-index="${index}">
      <div class="grocery-label">
        <input type="checkbox" class="grocery-check" data-index="${index}">
        <span class="grocery-name">
          ${isMeal ? `<span class="grocery-meal-icon">${meal?.imageEmoji || '🍽️'}</span>` : ''}
          ${escHtml(item.name)}
        </span>
        <span class="grocery-qty">${unitStrings}</span>
        ${isMeal && meal ? `
          <button class="grocery-expand-btn" data-index="${index}" title="Show ingredients">
            <span class="expand-icon">▶</span>
          </button>
        ` : ''}
        ${canPick ? renderPickButton(item.foodId, index) : ''}
      </div>

      ${isMeal && meal ? `
        <div class="grocery-ingredients-panel" id="grocery-panel-${index}" style="display:none">
          <div class="grocery-ing-header">
            Ingredients${portions > 1 ? ` × ${portions} portions` : ' (1 portion)'}
          </div>
          <ul class="grocery-ing-list">
            ${meal.ingredients.map((pi, piIdx) => {
              const food = findFoodById(pi.foodId) || customFoodsStore.get().foods.find(f => f.id === pi.foodId);
              const name = food ? food.name : pi.foodId;
              const scaledQty = Math.round(pi.quantity * portions * 10) / 10;
              return `
                <li class="grocery-ing-item">
                  <label class="grocery-ing-label">
                    <input type="checkbox" class="grocery-ing-check">
                    <span class="grocery-ing-qty">${scaledQty} ${pi.unit}</span>
                    <span class="grocery-ing-name">${escHtml(name)}</span>
                  </label>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      ` : ''}

      ${canPick ? `
        <div class="grocery-pick-panel" id="grocery-pick-panel-${index}" data-food-id="${escHtml(item.foodId)}" style="display:none">
          <div class="nt-hint">Loading picks…</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderPickButton(foodId, index) {
  const counts = countGroceryChoicesByChain(foodId);
  const chains = Object.keys(counts);
  if (chains.length === 0) {
    return `
      <button class="grocery-pick-btn" data-pick="${index}" title="Pick products to consider this week">
        Pick products <span class="grocery-pick-chev">▸</span>
      </button>
    `;
  }
  const total = chains.reduce((n, c) => n + counts[c], 0);
  const summary = chains
    .map(c => `${chainLabelMap?.get(c) || c} (${counts[c]})`)
    .join(', ');
  return `
    <button class="grocery-pick-btn grocery-pick-btn--set" data-pick="${index}" title="Change picks">
      ${escHtml(total + ' pick' + (total !== 1 ? 's' : '') + ' · ' + summary)} <span class="grocery-pick-edit">✎</span>
    </button>
  `;
}

function bindEvents(container, items) {
  // Checkboxes (visual only, not persisted)
  container.addEventListener('change', (e) => {
    if (e.target.classList.contains('grocery-check')) {
      const groceryItem = e.target.closest('.grocery-item');
      if (groceryItem) groceryItem.classList.toggle('checked', e.target.checked);
    } else if (e.target.classList.contains('grocery-ing-check')) {
      const ingItem = e.target.closest('.grocery-ing-item');
      if (ingItem) ingItem.classList.toggle('checked', e.target.checked);
    }
  });

  // Expand/collapse meal ingredient panels
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.grocery-expand-btn');
    if (!btn) return;
    const index = btn.dataset.index;
    const panel = container.querySelector(`#grocery-panel-${index}`);
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    const icon = btn.querySelector('.expand-icon');
    if (icon) icon.textContent = isOpen ? '▶' : '▼';
    btn.classList.toggle('expanded', !isOpen);
  });

  // Pick products: toggle panel, lazy-load
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.grocery-pick-btn');
    if (!btn) return;
    const index = btn.dataset.pick;
    const item = items[index];
    if (!item) return;
    const panel = container.querySelector(`#grocery-pick-panel-${index}`);
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    if (isOpen) {
      panel.style.display = 'none';
      btn.classList.remove('expanded');
      return;
    }
    panel.style.display = 'block';
    btn.classList.add('expanded');
    if (!panel.dataset.loaded) {
      loadPickPanel(container, panel, item, index);
    }
  });

  // Toggle a pick (checkbox) inside the panel
  container.addEventListener('change', (e) => {
    const cb = e.target.closest('.grocery-pick-cb');
    if (!cb) return;
    const panel = cb.closest('.grocery-pick-panel');
    const label = cb.closest('.grocery-pick-option');
    const index = panel?.id.replace('grocery-pick-panel-', '');
    const item = items[index];
    if (!item?.foodId) return;
    const chain = label.dataset.chain;
    const pid   = label.dataset.pid;
    toggleGroceryChoice(item.foodId, chain, pid);
    label.classList.toggle('grocery-pick-option--checked', cb.checked);
    refreshButton(container, item.foodId, index);
  });

  // Clear choice link
  container.addEventListener('click', (e) => {
    const clearLink = e.target.closest('.grocery-pick-clear');
    if (!clearLink) return;
    e.preventDefault();
    const panel = clearLink.closest('.grocery-pick-panel');
    const index = panel?.id.replace('grocery-pick-panel-', '');
    const item = items[index];
    if (!item?.foodId) return;
    clearGroceryChoices(item.foodId);
    // Re-render the row (cheapest way to reset every checkbox + button)
    refreshRow(container, items, index);
  });

  // Copy to clipboard
  container.querySelector('#copy-list-btn')?.addEventListener('click', () => {
    const lines = items.map(item => {
      const unitStrings = Object.entries(item.totalsByUnit)
        .map(([unit, qty]) => formatQtyUnit(qty, unit))
        .join(' + ');
      return `• ${item.name}: ${unitStrings}`;
    });
    const text = 'Shopping List\n' + '─'.repeat(20) + '\n' + lines.join('\n');

    navigator.clipboard.writeText(text).then(() => {
      const btn = container.querySelector('#copy-list-btn');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy List'; }, 2000);
      }
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  });
}

async function loadPickPanel(container, panel, item, index) {
  try {
    const idx = await loadIndex();
    if (!chainLabelMap) {
      chainLabelMap = new Map(idx.chains.map(c => [c.code, c.displayName || c.code]));
      // Refresh any already-rendered buttons that were built before the map was ready.
      container.querySelectorAll('.grocery-pick-btn--set').forEach(btn => {
        const bindex = btn.dataset.pick;
        const bitem = items[bindex];
        if (bitem?.foodId) refreshButton(container, bitem.foodId, bindex);
      });
    }

    const chainCodes = idx.chains.map(c => c.code).filter(code => getProductLinks(item.foodId, code).length > 0);

    if (chainCodes.length === 0) {
      panel.innerHTML = `
        <div class="nt-hint">
          No linked products — add some on the <a href="#/ingredients" class="link">Ingredients</a> page.
        </div>
      `;
      panel.dataset.loaded = '1';
      return;
    }

    const perChain = await Promise.all(chainCodes.map(async (code) => {
      const ids = getProductLinks(item.foodId, code);
      const products = await getProductsByIds(code, ids);
      return { code, label: chainLabelMap.get(code) || code, products };
    }));

    const groupsHtml = perChain.map(({ code, label, products }) => {
      if (products.length === 0) return '';
      const pickedIds = new Set(getGroceryChoicesForChain(item.foodId, code).map(String));
      return `
        <div class="grocery-pick-chain">
          <div class="grocery-pick-chain-header">${escHtml(label)}</div>
          <ul class="grocery-pick-list">
            ${products.map(p => {
              const checked = pickedIds.has(String(p.id));
              const metaBits = [p.brand, (p.quantity && p.unit) ? `${p.quantity} ${p.unit}` : null].filter(Boolean).join(' · ');
              const priceTxt = typeof p.minPrice === 'number' ? `€${Number(p.minPrice).toFixed(2)}` : '—';
              return `
                <li>
                  <label class="grocery-pick-option ${checked ? 'grocery-pick-option--checked' : ''}"
                    data-chain="${escHtml(code)}"
                    data-pid="${escHtml(String(p.id))}">
                    <input type="checkbox" class="grocery-pick-cb" ${checked ? 'checked' : ''}>
                    <span class="grocery-pick-name">${escHtml(p.name)}</span>
                    ${metaBits ? `<span class="grocery-pick-meta nt-hint">${escHtml(metaBits)}</span>` : ''}
                    <span class="grocery-pick-price">${priceTxt}</span>
                  </label>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }).join('');

    const anyPicks = hasGroceryChoices(item.foodId);
    panel.innerHTML = `
      ${groupsHtml || `<div class="nt-hint">Linked products not found in catalog — they may have been removed on the last refresh.</div>`}
      <div class="grocery-pick-footer">
        <span class="nt-hint">Prices uses the cheapest of your picks per chain.</span>
        ${anyPicks ? `<a href="#" class="link grocery-pick-clear">Clear all</a>` : ''}
      </div>
    `;
    panel.dataset.loaded = '1';
  } catch (err) {
    panel.innerHTML = `
      <div class="nt-hint">
        ${escHtml(err instanceof LocalPricesError ? err.message : 'Failed to load catalog.')}
      </div>
    `;
  }
}

function refreshButton(container, foodId, index) {
  const row = container.querySelector(`.grocery-item[data-index="${index}"]`);
  if (!row) return;
  const oldBtn = row.querySelector('.grocery-pick-btn');
  if (!oldBtn) return;
  const wasExpanded = oldBtn.classList.contains('expanded');
  const tmp = document.createElement('div');
  tmp.innerHTML = renderPickButton(foodId, index).trim();
  const newBtn = tmp.firstElementChild;
  if (wasExpanded) newBtn.classList.add('expanded');
  oldBtn.replaceWith(newBtn);

  // Update footer clear-link visibility
  const panel = container.querySelector(`#grocery-pick-panel-${index}`);
  if (panel) {
    const footer = panel.querySelector('.grocery-pick-footer');
    const hasAny = hasGroceryChoices(foodId);
    if (footer) {
      const existing = footer.querySelector('.grocery-pick-clear');
      if (hasAny && !existing) {
        footer.insertAdjacentHTML('beforeend', ` <a href="#" class="link grocery-pick-clear">Clear all</a>`);
      } else if (!hasAny && existing) {
        existing.remove();
      }
    }
  }
}

function refreshRow(container, items, index) {
  const item = items[index];
  if (!item) return;
  const row = container.querySelector(`.grocery-item[data-index="${index}"]`);
  if (!row) return;
  row.outerHTML = renderGroceryItem(item, index);
}

function escHtml(str) {
  return (str == null ? '' : String(str)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
