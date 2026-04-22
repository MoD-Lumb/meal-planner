import { mealsDatabase } from '../data/mealsDatabase.js';
import { foodDatabase, findFoodById, searchFoods } from '../data/foodDatabase.js';
import { calcMealNutrition, findFood } from '../utils/nutritionCalc.js';
import {
  customMealsStore, addCustomMeal, updateCustomMeal, removeCustomMeal,
  mealPortionsStore, setMealPortions, getMealPortions,
  customFoodsStore,
  mealOverridesStore, setMealOverride, tombstoneMeal,
} from '../store.js';

const CATEGORIES = ['all', 'breakfast', 'lunch', 'snack', 'dinner'];

let selectedMealId = null;
let currentCategory = 'all';
let currentSearch = '';

// In-memory state for the create/edit form
let formIngredients = [];   // [{ id, foodId, name, quantity, unit }]
let formSteps = [];         // [{ id, instruction }]
let editingMealId = null;   // null = create mode, string = edit mode

export function renderMealsDatabase(container) {
  selectedMealId = null;
  currentCategory = 'all';
  currentSearch = '';
  buildPage(container);
}

// ── Data helpers ──────────────────────────────────────────────────────────

function getAllMeals() {
  const { overrides, tombstones } = mealOverridesStore.get();
  const tombSet = new Set(tombstones || []);
  const builtIn = mealsDatabase
    .filter(m => !tombSet.has(m.id))
    .map(m => overrides?.[m.id] ? { ...m, ...overrides[m.id] } : m);
  const custom = customMealsStore.get().meals.filter(m => !tombSet.has(m.id));
  return [...builtIn, ...custom];
}

function findMeal(id) {
  return getAllMeals().find(m => m.id === id);
}

function isCustomMeal(id) {
  return customMealsStore.get().meals.some(m => m.id === id);
}

function filteredMeals() {
  let meals = getAllMeals();
  if (currentCategory !== 'all') {
    meals = meals.filter(m => m.category === currentCategory || m.category === 'any');
  }
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    meals = meals.filter(m =>
      m.name.toLowerCase().includes(q) || (m.tags || []).some(t => t.includes(q))
    );
  }
  return meals;
}

function mealNutrition(meal, portions) {
  const base = calcMealNutrition(meal.ingredients.map(pi => ({ ...pi, name: '' })));
  const p = portions || 1;
  return {
    kcal:    round1(base.kcal    * p),
    protein: round1(base.protein * p),
    carbs:   round1(base.carbs   * p),
    fat:     round1(base.fat     * p),
  };
}

function round1(n) { return Math.round(n * 10) / 10; }

// ── Page render ───────────────────────────────────────────────────────────

function buildPage(container) {
  const all = getAllMeals();
  container.innerHTML = `
    <div class="page-header">
      <h1>Meals Database</h1>
      <button class="btn btn-primary btn-sm" id="create-recipe-btn">+ Create Recipe</button>
    </div>
    <p class="page-subtitle">${all.length} meal${all.length !== 1 ? 's' : ''} available (${mealsDatabase.length} built-in, ${customMealsStore.get().meals.length} custom).</p>

    <div class="mdb-controls">
      <input type="search" id="meal-search" class="search-input" placeholder="Search meals…" value="${escHtml(currentSearch)}">
      <div class="category-tabs">
        ${CATEGORIES.map(cat => `
          <button class="cat-tab ${cat === currentCategory ? 'active' : ''}" data-cat="${cat}">
            ${catLabel(cat)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="mdb-layout">
      <div class="meal-cards-grid" id="meal-cards-grid">
        ${renderMealCards(filteredMeals())}
      </div>
      <div class="meal-detail-panel" id="meal-detail-panel">
        ${renderEmptyDetail()}
      </div>
    </div>

    <!-- Create / Edit Recipe Modal -->
    <div class="modal-overlay" id="recipe-modal" style="display:none">
      <div class="modal-box modal-box--wide" id="recipe-modal-box"></div>
    </div>
  `;

  bindEvents(container);
}

// ── Card grid ─────────────────────────────────────────────────────────────

function renderMealCards(meals) {
  if (meals.length === 0) {
    return `<div class="empty-state" style="padding:40px 0">No meals found.</div>`;
  }
  return meals.map(meal => {
    const portions = getMealPortions(meal.id);
    const total = mealNutrition(meal, portions);
    const custom = isCustomMeal(meal.id);
    return `
      <div class="meal-card ${selectedMealId === meal.id ? 'selected' : ''} ${custom ? 'meal-card--custom' : ''}" data-meal-id="${meal.id}">
        <div class="meal-card-emoji">${meal.imageEmoji || '🍴'}</div>
        <div class="meal-card-body">
          <div class="meal-card-name">${escHtml(meal.name)} ${custom ? '<span class="custom-tag">custom</span>' : ''}</div>
          <div class="meal-card-cat">${catLabel(meal.category)}</div>
          <div class="meal-card-stats">
            <span class="stat-kcal">${total.kcal} kcal</span>
            <span class="stat-sep">·</span>
            <span>${total.protein}g protein</span>
            ${portions > 1 ? `<span class="stat-sep">·</span><span class="stat-portions">${portions} portions</span>` : ''}
          </div>
          <div class="meal-card-tags">
            ${(meal.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Detail panel ──────────────────────────────────────────────────────────

function renderEmptyDetail() {
  return `
    <div class="detail-empty">
      <div class="detail-empty-icon">🍴</div>
      <p>Select a meal to see its ingredients and recipe.</p>
    </div>
  `;
}

function renderMealDetail(mealId, container) {
  const meal = findMeal(mealId);
  if (!meal) return;

  const portions = getMealPortions(mealId);
  const total = mealNutrition(meal, portions);
  const custom = isCustomMeal(mealId);

  const panel = container.querySelector('#meal-detail-panel');
  panel.innerHTML = `
    <div class="meal-detail">
      <div class="detail-header">
        <span class="detail-emoji">${meal.imageEmoji || '🍴'}</span>
        <div class="detail-title-wrap">
          <h2>${escHtml(meal.name)}</h2>
          <div class="detail-cat">${catLabel(meal.category)}</div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-ghost btn-sm" id="edit-meal-btn">Edit</button>
          <button class="btn btn-ghost btn-sm detail-del-btn" id="delete-meal-btn">${custom ? 'Delete' : 'Remove'}</button>
        </div>
      </div>

      <!-- Portion control -->
      <div class="portion-control">
        <span class="portion-label">Portions:</span>
        <button class="portion-btn" id="portions-minus" ${portions <= 1 ? 'disabled' : ''}>−</button>
        <input type="number" id="portions-input" class="portions-input" value="${portions}" min="1" max="99">
        <button class="portion-btn" id="portions-plus">+</button>
        <button class="btn btn-primary btn-xs" id="save-portions-btn">Save default</button>
      </div>

      <!-- Nutrition (updates live with portions) -->
      <div class="detail-nutrition" id="detail-nutrition">
        ${renderNutritionChips(total)}
      </div>

      <h4>Ingredients <span class="detail-portions-note">${portions > 1 ? `(× ${portions} portions)` : '(1 portion)'}</span></h4>
      <ul class="detail-ingredients">
        ${meal.ingredients.map(pi => {
          const food = findFood(pi.foodId);
          const name = food ? food.name : (pi.name || pi.foodId);
          const scaledQty = round1(pi.quantity * portions);
          return `
            <li>
              <span class="ing-amount">${scaledQty} ${pi.unit}</span>
              <span class="ing-name">${escHtml(name)}</span>
            </li>
          `;
        }).join('')}
      </ul>

      ${meal.recipe && meal.recipe.length > 0 ? `
        <h4>Recipe</h4>
        <ol class="detail-recipe">
          ${meal.recipe.map(step => `
            <li><p>${escHtml(step.instruction)}</p></li>
          `).join('')}
        </ol>
      ` : ''}
    </div>
  `;

  bindDetailEvents(mealId, container);
}

function renderNutritionChips(total) {
  return `
    <div class="nutr-chip"><span class="nutr-val">${total.kcal}</span><span class="nutr-key">kcal</span></div>
    <div class="nutr-chip"><span class="nutr-val">${total.protein}g</span><span class="nutr-key">Protein</span></div>
    <div class="nutr-chip"><span class="nutr-val">${total.carbs}g</span><span class="nutr-key">UH</span></div>
    <div class="nutr-chip"><span class="nutr-val">${total.fat}g</span><span class="nutr-key">Fat</span></div>
  `;
}

function bindDetailEvents(mealId, container) {
  const meal = findMeal(mealId);
  if (!meal) return;

  const portionsInput = container.querySelector('#portions-input');
  const minusBtn = container.querySelector('#portions-minus');
  const plusBtn = container.querySelector('#portions-plus');
  const saveBtn = container.querySelector('#save-portions-btn');

  function getPortions() {
    return Math.max(1, parseInt(portionsInput.value) || 1);
  }

  function updateDisplay() {
    const p = getPortions();
    const total = mealNutrition(meal, p);
    container.querySelector('#detail-nutrition').innerHTML = renderNutritionChips(total);
    if (minusBtn) minusBtn.disabled = p <= 1;
  }

  portionsInput?.addEventListener('input', updateDisplay);

  minusBtn?.addEventListener('click', () => {
    portionsInput.value = Math.max(1, getPortions() - 1);
    updateDisplay();
  });

  plusBtn?.addEventListener('click', () => {
    portionsInput.value = getPortions() + 1;
    updateDisplay();
  });

  saveBtn?.addEventListener('click', () => {
    const p = getPortions();
    setMealPortions(mealId, p);
    // Update card in grid
    refreshCards(container);
    saveBtn.textContent = 'Saved!';
    setTimeout(() => { saveBtn.textContent = 'Save default'; }, 1800);
  });

  // Edit / delete (custom meals only)
  container.querySelector('#edit-meal-btn')?.addEventListener('click', () => {
    openRecipeModal(container, mealId);
  });

  container.querySelector('#delete-meal-btn')?.addEventListener('click', () => {
    const isCustom = isCustomMeal(mealId);
    const msg = isCustom
      ? `Delete "${meal.name}"? This cannot be undone.`
      : `Remove "${meal.name}" from the list? Built-in recipes can only come back if the app data is reset.`;
    if (!confirm(msg)) return;
    if (isCustom) removeCustomMeal(mealId); else tombstoneMeal(mealId);
    selectedMealId = null;
    container.querySelector('#meal-detail-panel').innerHTML = renderEmptyDetail();
    refreshCards(container);
    refreshSubtitle(container);
  });
}

// ── Recipe create / edit modal ────────────────────────────────────────────

function openRecipeModal(container, editId = null) {
  editingMealId = editId;

  if (editId) {
    const meal = findMeal(editId);
    // Pre-populate form state from existing meal
    formIngredients = (meal.ingredients || []).map(pi => {
      const food = findFood(pi.foodId);
      return {
        id: crypto.randomUUID(),
        foodId: pi.foodId || null,
        name: food ? food.name : (pi.name || pi.foodId || ''),
        quantity: pi.quantity,
        unit: pi.unit,
      };
    });
    formSteps = (meal.recipe || []).map((s, i) => ({
      id: crypto.randomUUID(),
      instruction: s.instruction,
    }));
  } else {
    formIngredients = [];
    formSteps = [];
  }

  const modal = container.querySelector('#recipe-modal');
  modal.style.display = 'flex';
  renderRecipeForm(container, editId);
}

function closeRecipeModal(container) {
  container.querySelector('#recipe-modal').style.display = 'none';
  editingMealId = null;
  formIngredients = [];
  formSteps = [];
}

function renderRecipeForm(container, editId) {
  const meal = editId ? findMeal(editId) : null;
  const box = container.querySelector('#recipe-modal-box');

  box.innerHTML = `
    <div class="modal-header">
      <h3>${editId ? 'Edit Recipe' : 'Create Recipe'}</h3>
      <button class="modal-close" id="recipe-modal-close">✕</button>
    </div>

    <form id="recipe-form" autocomplete="off">
      <!-- Basic info -->
      <div class="recipe-form-section">
        <div class="form-row">
          <div class="form-group">
            <label>Recipe Name *</label>
            <input type="text" id="rf-name" required maxlength="80" placeholder="e.g. Grilled Chicken Salad"
              value="${escHtml(meal?.name || '')}">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="rf-category">
              ${['breakfast','lunch','snack','dinner','any'].map(cat => `
                <option value="${cat}" ${(meal?.category || 'any') === cat ? 'selected' : ''}>${catLabel(cat)}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Emoji (optional)</label>
            <input type="text" id="rf-emoji" maxlength="4" placeholder="🍽️"
              value="${escHtml(meal?.imageEmoji || '')}">
          </div>
          <div class="form-group">
            <label>Default Portions</label>
            <input type="number" id="rf-portions" min="1" max="99" value="${getMealPortions(editId || '__none__') || 1}">
          </div>
        </div>
        <div class="form-group">
          <label>Tags (comma separated, optional)</label>
          <input type="text" id="rf-tags" placeholder="e.g. high-protein, quick, vegetarian"
            value="${escHtml((meal?.tags || []).join(', '))}">
        </div>
      </div>

      <!-- Ingredients -->
      <div class="recipe-form-section">
        <div class="recipe-section-header">
          <h4>Ingredients</h4>
          <button type="button" class="btn btn-outline btn-sm" id="rf-add-ing">+ Add Ingredient</button>
        </div>
        <table class="rf-ing-table">
          <thead>
            <tr>
              <th>Food Name</th>
              <th>Qty</th>
              <th>Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="rf-ing-tbody">
            ${formIngredients.map(ing => renderFormIngRow(ing)).join('')}
          </tbody>
        </table>
        ${formIngredients.length === 0 ? `<p class="rf-empty-hint">Add at least one ingredient.</p>` : ''}
      </div>

      <!-- Recipe Steps -->
      <div class="recipe-form-section">
        <div class="recipe-section-header">
          <h4>Recipe Steps</h4>
          <button type="button" class="btn btn-outline btn-sm" id="rf-add-step">+ Add Step</button>
        </div>
        <ol class="rf-steps-list" id="rf-steps-list">
          ${formSteps.map((step, i) => renderFormStep(step, i)).join('')}
        </ol>
        ${formSteps.length === 0 ? `<p class="rf-empty-hint">Steps are optional but helpful.</p>` : ''}
      </div>

      <div id="rf-error" class="form-error" style="display:none"></div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${editId ? 'Save Changes' : 'Create Recipe'}</button>
        <button type="button" class="btn btn-ghost" id="rf-cancel">Cancel</button>
      </div>
    </form>
  `;

  bindFormEvents(container);
}

function renderFormIngRow(ing) {
  const allFoods = [...foodDatabase, ...customFoodsStore.get().foods];
  const food = ing.foodId ? allFoods.find(f => f.id === ing.foodId) : null;
  const units = food ? food.availableUnits : ['g', 'kg', 'ml', 'L', 'piece', 'slice', 'tbsp', 'tsp'];

  return `
    <tr class="rf-ing-row" data-ing-id="${ing.id}">
      <td class="rf-td-name">
        <div class="autocomplete-wrap">
          <input type="text" class="rf-ing-name ing-name-input" placeholder="Ingredient…"
            value="${escHtml(ing.name)}" data-ing-id="${ing.id}" autocomplete="off">
          <div class="autocomplete-dropdown" id="rfac-${ing.id}"></div>
        </div>
      </td>
      <td class="rf-td-qty">
        <input type="number" class="rf-ing-qty ing-qty-input" min="0" step="any"
          placeholder="0" value="${ing.quantity > 0 ? ing.quantity : ''}" data-ing-id="${ing.id}">
      </td>
      <td class="rf-td-unit">
        <select class="rf-ing-unit unit-select" data-ing-id="${ing.id}">
          ${units.map(u => `<option value="${u}" ${u === ing.unit ? 'selected' : ''}>${u}</option>`).join('')}
        </select>
      </td>
      <td class="rf-td-del">
        <button type="button" class="del-ing-btn rf-del-ing" data-ing-id="${ing.id}" title="Remove">✕</button>
      </td>
    </tr>
  `;
}

function renderFormStep(step, index) {
  return `
    <li class="rf-step-row" data-step-id="${step.id}">
      <span class="rf-step-num">${index + 1}</span>
      <input type="text" class="rf-step-input" placeholder="Describe this step…"
        value="${escHtml(step.instruction)}" data-step-id="${step.id}">
      <button type="button" class="del-ing-btn rf-del-step" data-step-id="${step.id}" title="Remove">✕</button>
    </li>
  `;
}

function bindFormEvents(container) {
  const box = container.querySelector('#recipe-modal-box');

  // Close buttons
  box.querySelector('#recipe-modal-close')?.addEventListener('click', () => closeRecipeModal(container));
  box.querySelector('#rf-cancel')?.addEventListener('click', () => closeRecipeModal(container));
  container.querySelector('#recipe-modal')?.addEventListener('click', e => {
    if (e.target === container.querySelector('#recipe-modal')) closeRecipeModal(container);
  });

  // Add ingredient row
  box.querySelector('#rf-add-ing')?.addEventListener('click', () => {
    const ing = { id: crypto.randomUUID(), foodId: null, name: '', quantity: 0, unit: 'g' };
    formIngredients.push(ing);
    const tbody = box.querySelector('#rf-ing-tbody');
    tbody.insertAdjacentHTML('beforeend', renderFormIngRow(ing));
    bindIngRowEvents(box, ing.id);
    tbody.closest('table').previousElementSibling?.remove(); // remove empty hint if present
  });

  // Add step row
  box.querySelector('#rf-add-step')?.addEventListener('click', () => {
    const step = { id: crypto.randomUUID(), instruction: '' };
    formSteps.push(step);
    const list = box.querySelector('#rf-steps-list');
    list.insertAdjacentHTML('beforeend', renderFormStep(step, formSteps.length - 1));
    bindStepRowEvents(box, step.id);
    list.nextElementSibling?.remove(); // remove empty hint if present
    list.querySelector(`[data-step-id="${step.id}"] .rf-step-input`)?.focus();
  });

  // Bind existing rows
  formIngredients.forEach(ing => bindIngRowEvents(box, ing.id));
  formSteps.forEach(step => bindStepRowEvents(box, step.id));

  // Form submit
  box.querySelector('#recipe-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitRecipeForm(container, box);
  });
}

function bindIngRowEvents(box, ingId) {
  const row = box.querySelector(`.rf-ing-row[data-ing-id="${ingId}"]`);
  if (!row) return;
  const ing = formIngredients.find(i => i.id === ingId);
  if (!ing) return;

  // Delete
  row.querySelector('.rf-del-ing')?.addEventListener('click', () => {
    const idx = formIngredients.findIndex(i => i.id === ingId);
    if (idx !== -1) formIngredients.splice(idx, 1);
    row.remove();
  });

  // Qty
  row.querySelector('.rf-ing-qty')?.addEventListener('change', (e) => {
    ing.quantity = parseFloat(e.target.value) || 0;
  });

  // Unit
  row.querySelector('.rf-ing-unit')?.addEventListener('change', (e) => {
    ing.unit = e.target.value;
  });

  // Name with autocomplete
  const nameInput = row.querySelector('.rf-ing-name');
  const dd = box.querySelector(`#rfac-${ingId}`);

  let debounce;
  nameInput?.addEventListener('input', (e) => {
    clearTimeout(debounce);
    const val = e.target.value;
    ing.name = val;
    ing.foodId = null;

    debounce = setTimeout(() => {
      const q = val.trim();
      if (!q) { dd.innerHTML = ''; return; }

      const allFoods = [...foodDatabase, ...customFoodsStore.get().foods];
      const matches = searchFoods(q);
      const customMatches = customFoodsStore.get().foods.filter(f => {
        const ql = q.toLowerCase();
        return f.name.toLowerCase().includes(ql) || (f.aliases || []).some(a => a.toLowerCase().includes(ql));
      }).filter(f => !matches.find(m => m.id === f.id)).slice(0, 3);

      const all = [...matches, ...customMatches].slice(0, 8);
      if (!all.length) { dd.innerHTML = ''; return; }

      dd.innerHTML = all.map(food => `
        <div class="ac-item" data-food-id="${food.id}" data-food-name="${escHtml(food.name)}">
          <span class="ac-name">${escHtml(food.name)}</span>
          <span class="ac-kcal">${food.nutritionPer100g.kcal} kcal/100g</span>
        </div>
      `).join('');

      dd.querySelectorAll('.ac-item').forEach(item => {
        item.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          const food = findFood(item.dataset.foodId);
          ing.foodId = item.dataset.foodId;
          ing.name = item.dataset.foodName;
          ing.unit = food?.availableUnits?.[0] || 'g';

          nameInput.value = ing.name;

          // Rebuild unit select
          const unitSelect = row.querySelector('.rf-ing-unit');
          const units = food?.availableUnits || ['g'];
          if (unitSelect) {
            unitSelect.innerHTML = units.map(u => `<option value="${u}" ${u === ing.unit ? 'selected' : ''}>${u}</option>`).join('');
          }
          dd.innerHTML = '';
        });
      });
    }, 150);
  });

  nameInput?.addEventListener('blur', () => {
    setTimeout(() => { dd.innerHTML = ''; }, 200);
  });
}

function bindStepRowEvents(box, stepId) {
  const row = box.querySelector(`.rf-step-row[data-step-id="${stepId}"]`);
  if (!row) return;
  const step = formSteps.find(s => s.id === stepId);
  if (!step) return;

  row.querySelector('.rf-step-input')?.addEventListener('input', (e) => {
    step.instruction = e.target.value;
  });

  row.querySelector('.rf-del-step')?.addEventListener('click', () => {
    const idx = formSteps.findIndex(s => s.id === stepId);
    if (idx !== -1) formSteps.splice(idx, 1);
    row.remove();
    // Renumber remaining steps
    box.querySelectorAll('.rf-step-row').forEach((r, i) => {
      const num = r.querySelector('.rf-step-num');
      if (num) num.textContent = i + 1;
    });
  });
}

function submitRecipeForm(container, box) {
  const name = box.querySelector('#rf-name')?.value.trim();
  const errorEl = box.querySelector('#rf-error');

  if (!name) { showError(errorEl, 'Recipe name is required.'); return; }
  if (formIngredients.length === 0) { showError(errorEl, 'Add at least one ingredient.'); return; }
  if (formIngredients.some(i => !i.name || i.quantity <= 0)) {
    showError(errorEl, 'All ingredients need a name and quantity > 0.'); return;
  }

  const portions = Math.max(1, parseInt(box.querySelector('#rf-portions')?.value) || 1);
  const tags = (box.querySelector('#rf-tags')?.value || '')
    .split(',').map(t => t.trim()).filter(Boolean);

  const meal = {
    id: editingMealId || ('custom-meal-' + crypto.randomUUID()),
    name,
    category: box.querySelector('#rf-category')?.value || 'any',
    imageEmoji: box.querySelector('#rf-emoji')?.value.trim() || '🍴',
    tags,
    ingredients: formIngredients.map(ing => ({
      foodId: ing.foodId || null,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
    recipe: formSteps.map((s, i) => ({ stepNumber: i + 1, instruction: s.instruction })),
  };

  if (editingMealId) {
    if (isCustomMeal(editingMealId)) {
      updateCustomMeal(editingMealId, meal);
    } else {
      // Built-in meal edit — save as an override (merged on top of base entry).
      setMealOverride(editingMealId, {
        name: meal.name,
        category: meal.category,
        imageEmoji: meal.imageEmoji,
        tags: meal.tags,
        ingredients: meal.ingredients,
        recipe: meal.recipe,
      });
    }
  } else {
    addCustomMeal(meal);
  }

  // Save default portions
  setMealPortions(meal.id, portions);

  closeRecipeModal(container);
  selectedMealId = meal.id;
  refreshCards(container);
  refreshSubtitle(container);
  renderMealDetail(meal.id, container);

  // Scroll detail into view
  container.querySelector('#meal-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function refreshCards(container) {
  container.querySelector('#meal-cards-grid').innerHTML = renderMealCards(filteredMeals());
  rebindCards(container);
}

function refreshSubtitle(container) {
  const all = getAllMeals();
  const sub = container.querySelector('.page-subtitle');
  if (sub) sub.textContent = `${all.length} meal${all.length !== 1 ? 's' : ''} available (${mealsDatabase.length} built-in, ${customMealsStore.get().meals.length} custom).`;
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Event wiring ───────────────────────────────────────────────────────────

function bindEvents(container) {
  container.querySelector('#create-recipe-btn')?.addEventListener('click', () => {
    openRecipeModal(container, null);
  });

  container.querySelector('#meal-search')?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    refreshCards(container);
  });

  container.querySelector('.category-tabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    currentCategory = tab.dataset.cat;
    container.querySelectorAll('.cat-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.cat === currentCategory)
    );
    refreshCards(container);
  });

  rebindCards(container);
}

function rebindCards(container) {
  container.querySelectorAll('.meal-card').forEach(card => {
    card.addEventListener('click', () => {
      const mealId = card.dataset.mealId;
      selectedMealId = mealId;
      container.querySelectorAll('.meal-card').forEach(c =>
        c.classList.toggle('selected', c.dataset.mealId === mealId)
      );
      renderMealDetail(mealId, container);
    });
  });
}

// ── Label helpers ──────────────────────────────────────────────────────────

function catLabel(cat) {
  return {
    all: 'All', breakfast: '🌅 Breakfast', lunch: '🥗 Lunch',
    snack: '🍎 Snack', dinner: '🍽️ Dinner', any: 'Any',
  }[cat] || cat;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
