import { menuStore } from '../store.js';
import { aggregateGroceries, formatQtyUnit } from '../utils/groceryAggregator.js';
import { mealsDatabase } from '../data/mealsDatabase.js';
import { findFoodById } from '../data/foodDatabase.js';
import { customFoodsStore } from '../store.js';

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
    </div>
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

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
