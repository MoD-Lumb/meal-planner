import { foodDatabase, FOOD_CATEGORIES } from '../data/foodDatabase.js';
import { customFoodsStore, addCustomFood, removeCustomFood, countLinks } from '../store.js';
import { openLinkProductsModal } from './linkProductsModal.js';

let currentCategory = 'All';
let currentSearch = '';

export function renderIngredients(container) {
  currentCategory = 'All';
  currentSearch = '';
  buildPage(container);
}

function getAllFoods() {
  const custom = customFoodsStore.get().foods.map(f => ({ ...f, isCustom: true }));
  return [...foodDatabase, ...custom];
}

function filteredFoods() {
  let foods = getAllFoods();
  if (currentCategory !== 'All') {
    foods = foods.filter(f => f.category === currentCategory);
  }
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    foods = foods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      (f.aliases || []).some(a => a.toLowerCase().includes(q))
    );
  }
  return foods.sort((a, b) => a.name.localeCompare(b.name));
}

function buildPage(container) {
  const categories = ['All', ...FOOD_CATEGORIES, 'Custom'];

  container.innerHTML = `
    <div class="page-header">
      <h1>Ingredients</h1>
      <button class="btn btn-primary btn-sm" id="add-custom-btn">+ Add Ingredient</button>
    </div>
    <p class="page-subtitle">Browse all ${foodDatabase.length} built-in ingredients or add your own.</p>

    <div class="ing-controls">
      <input type="search" id="ing-search" class="search-input" placeholder="Search ingredients…" value="${escHtml(currentSearch)}">
      <div class="ing-category-filter">
        <select id="category-select" class="category-select-input">
          ${categories.map(cat => `
            <option value="${cat}" ${cat === currentCategory ? 'selected' : ''}>${cat}</option>
          `).join('')}
        </select>
      </div>
    </div>

    <div class="ing-table-wrap" id="ing-table-wrap">
      ${renderTable(filteredFoods())}
    </div>

    <!-- Add Custom Ingredient Modal -->
    <div class="modal-overlay" id="modal-overlay" style="display:none">
      <div class="modal-box" id="modal-box">
        ${renderAddForm()}
      </div>
    </div>
  `;

  bindEvents(container);
}

function renderTable(foods) {
  if (foods.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">🔍</div><p>No ingredients found.</p></div>`;
  }

  return `
    <table class="ing-db-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Name</th>
          <th class="num-col">Kcal<span class="th-sub">/100g</span></th>
          <th class="num-col">Protein<span class="th-sub">/100g</span></th>
          <th class="num-col">UH<span class="th-sub">/100g</span></th>
          <th class="num-col">Fat<span class="th-sub">/100g</span></th>
          <th>Default Unit</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${foods.map(food => `
          <tr class="${food.isCustom ? 'row-custom' : food.source === 'claude' ? 'row-claude' : ''}">
            <td>
              <span class="cat-badge cat-${slugify(food.category || 'other')}">${food.category || '—'}</span>
            </td>
            <td class="food-name-cell">
              ${escHtml(food.name)}
              ${food.isCustom ? '<span class="custom-tag">your add</span>' : ''}
              ${food.source === 'claude' ? '<span class="claude-tag">claude</span>' : ''}
            </td>
            <td class="num-col">${food.nutritionPer100g.kcal}</td>
            <td class="num-col">${food.nutritionPer100g.protein}</td>
            <td class="num-col">${food.nutritionPer100g.carbs}</td>
            <td class="num-col">${food.nutritionPer100g.fat}</td>
            <td class="unit-col">${food.availableUnits?.[0] || 'g'}</td>
            <td class="action-col">
              <button class="btn btn-ghost btn-sm link-products-btn" data-id="${food.id}" title="Link supermarket products">
                ${(() => { const n = countLinks(food.id); return n ? `Linked <span class="linked-badge">${n}</span>` : 'Link products'; })()}
              </button>
              ${food.isCustom ? `
                <button class="del-food-btn" data-id="${food.id}" title="Delete">✕</button>
              ` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="ing-count">${foods.length} ingredient${foods.length !== 1 ? 's' : ''}</div>
  `;
}

function renderAddForm() {
  const categories = FOOD_CATEGORIES;
  return `
    <div class="modal-header">
      <h3>Add Custom Ingredient</h3>
      <button class="modal-close" id="modal-close">✕</button>
    </div>
    <form id="add-food-form" class="add-food-form" autocomplete="off">

      <div class="form-group">
        <label>Name *</label>
        <input type="text" name="name" required placeholder="e.g. Quinoa" maxlength="60">
      </div>

      <div class="form-group">
        <label>Category</label>
        <select name="category">
          ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          <option value="Custom" selected>Custom</option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Kcal / 100g *</label>
          <input type="number" name="kcal" required min="0" max="9999" step="0.1" placeholder="0">
        </div>
        <div class="form-group">
          <label>Protein / 100g (g) *</label>
          <input type="number" name="protein" required min="0" max="100" step="0.1" placeholder="0">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>UH (Carbs) / 100g (g) *</label>
          <input type="number" name="carbs" required min="0" max="100" step="0.1" placeholder="0">
        </div>
        <div class="form-group">
          <label>Fat / 100g (g) *</label>
          <input type="number" name="fat" required min="0" max="100" step="0.1" placeholder="0">
        </div>
      </div>

      <div class="form-group">
        <label>Default Unit</label>
        <select name="unit">
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="L">L</option>
          <option value="piece">piece</option>
          <option value="slice">slice</option>
          <option value="tbsp">tbsp</option>
          <option value="tsp">tsp</option>
        </select>
      </div>

      <div id="form-error" class="form-error" style="display:none"></div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save Ingredient</button>
        <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
      </div>
    </form>
  `;
}

function bindEvents(container) {
  // Search
  container.querySelector('#ing-search')?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    refreshTable(container);
  });

  // Category select
  container.querySelector('#category-select')?.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    refreshTable(container);
  });

  // Open modal
  container.querySelector('#add-custom-btn')?.addEventListener('click', () => {
    openModal(container);
  });

  // Close modal
  bindModalEvents(container);

  // Delete custom food
  container.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.del-food-btn');
    if (!delBtn) return;
    const id = delBtn.dataset.id;
    if (confirm('Delete this ingredient?')) {
      removeCustomFood(id);
      refreshTable(container);
    }
  });

  // Open link-products modal
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.link-products-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    const food = getAllFoods().find(f => f.id === id);
    if (!food) return;
    openLinkProductsModal(food, () => refreshTable(container));
  });
}

function openModal(container) {
  const overlay = container.querySelector('#modal-overlay');
  const box = container.querySelector('#modal-box');
  box.innerHTML = renderAddForm();
  overlay.style.display = 'flex';
  bindModalEvents(container);
  box.querySelector('input[name="name"]')?.focus();
}

function closeModal(container) {
  container.querySelector('#modal-overlay').style.display = 'none';
}

function bindModalEvents(container) {
  const overlay = container.querySelector('#modal-overlay');
  if (!overlay) return;

  container.querySelector('#modal-close')?.addEventListener('click', () => closeModal(container));
  container.querySelector('#cancel-btn')?.addEventListener('click', () => closeModal(container));

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(container);
  });

  // Form submit
  container.querySelector('#add-food-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const name = data.get('name')?.trim();
    const kcal = parseFloat(data.get('kcal'));
    const protein = parseFloat(data.get('protein'));
    const carbs = parseFloat(data.get('carbs'));
    const fat = parseFloat(data.get('fat'));

    const errorEl = form.querySelector('#form-error');

    if (!name) {
      showError(errorEl, 'Name is required.'); return;
    }
    if (isNaN(kcal) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
      showError(errorEl, 'All nutrition values are required.'); return;
    }
    const totalMacros = protein + carbs + fat;
    if (totalMacros > 105) {
      showError(errorEl, `Macros sum to ${totalMacros.toFixed(1)}g per 100g — check your values.`); return;
    }

    const unit = data.get('unit') || 'g';
    const newFood = {
      id: 'custom-' + crypto.randomUUID(),
      name,
      aliases: [],
      category: data.get('category') || 'Custom',
      nutritionPer100g: { kcal, protein, carbs, fat },
      availableUnits: [unit],
      isCustom: true,
    };

    addCustomFood(newFood);
    closeModal(container);
    refreshTable(container);
  });
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function refreshTable(container) {
  container.querySelector('#ing-table-wrap').innerHTML = renderTable(filteredFoods());
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
