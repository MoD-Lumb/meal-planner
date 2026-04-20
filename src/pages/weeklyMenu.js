import { menuStore, prefsStore, customFoodsStore, profileStore } from '../store.js';
import { foodDatabase, FOOD_CATEGORIES, findFoodById, searchFoods } from '../data/foodDatabase.js';
import { mealsDatabase } from '../data/mealsDatabase.js';
import { calcIngredientNutrition, calcMealNutrition, findFood } from '../utils/nutritionCalc.js';
import { suggestUnits, defaultUnit } from '../utils/unitSuggestion.js';
import { autoFillDay, autoFillWeek, adjustPortions } from '../utils/autoFill.js';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['breakfast','lunch','snack','dinner'];
const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '🥗 Lunch', snack: '🍎 Snack', dinner: '🍽️ Dinner' };

let currentDay = 0; // active day tab index
let unsubscribe = null;

export function renderWeeklyMenu(container) {
  currentDay = 0;
  buildPage(container);

  if (unsubscribe) unsubscribe();
  // No global re-render on store change — we do targeted updates instead
}

export function destroyWeeklyMenu() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  document.removeEventListener('click', closeAllCopyDropdowns);
}

function buildPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Weekly Menu</h1>
      <div class="page-header-actions">
        <button class="btn btn-outline btn-sm" id="autofill-week-btn">✦ Auto-fill Week</button>
        <button class="btn btn-ghost btn-sm" id="clear-week-btn">Clear Week</button>
      </div>
    </div>

    <div class="day-tabs-row">
      <div class="day-tabs" id="day-tabs">
        ${DAYS.map((d, i) => `
          <button class="day-tab ${i === currentDay ? 'active' : ''}" data-day="${i}">
            ${DAY_LABELS[i].slice(0,3)}
          </button>
        `).join('')}
      </div>
      <div class="copy-day-wrap">
        <button class="btn btn-ghost btn-sm copy-day-btn" id="copy-day-btn">Copy day →</button>
        <div class="copy-dropdown" id="copy-day-dropdown" style="display:none">
          <div class="copy-dropdown-label">Copy <strong>${DAY_LABELS[currentDay]}</strong> to:</div>
          ${DAYS.map((d, i) => i === currentDay ? '' : `
            <button class="copy-dropdown-item" data-to-day="${i}">${DAY_LABELS[i]}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <div id="day-content" class="day-content">
      ${renderDayContent(currentDay)}
    </div>
  `;

  bindPageEvents(container);
}

function renderDayContent(dayIndex) {
  const day = DAYS[dayIndex];
  const menu = menuStore.get();

  return `
    <div class="day-auto-bar">
      <button class="btn btn-primary btn-sm smart-fill-day-btn" data-day="${day}">✦ Smart Fill Day</button>
      <button class="btn btn-ghost btn-sm adjust-portions-btn" data-day="${day}">⇄ Adjust Portions</button>
    </div>
    <div class="meals-grid">
      ${MEALS.map(meal => renderMealSection(day, meal, menu[day][meal])).join('')}
    </div>
    ${renderDailyTotal(day)}
  `;
}

function calcDayTotal(day) {
  const menu = menuStore.get();
  return MEALS.reduce((sum, meal) => {
    const n = calcMealNutrition(menu[day][meal].ingredients);
    return {
      kcal:    round1(sum.kcal    + n.kcal),
      protein: round1(sum.protein + n.protein),
      carbs:   round1(sum.carbs   + n.carbs),
      fat:     round1(sum.fat     + n.fat),
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

function round1(n) { return Math.round(n * 10) / 10; }

function renderDailyTotal(day) {
  const t = calcDayTotal(day);
  return `
    <div class="daily-total" id="daily-total-${day}">
      <span class="daily-total-label">Daily Total</span>
      <div class="daily-total-chips">
        <div class="daily-chip daily-chip--kcal">
          <span class="daily-chip-val" id="dt-kcal-${day}">${t.kcal}</span>
          <span class="daily-chip-key">kcal</span>
        </div>
        <div class="daily-chip">
          <span class="daily-chip-val" id="dt-protein-${day}">${t.protein}g</span>
          <span class="daily-chip-key">Protein</span>
        </div>
        <div class="daily-chip">
          <span class="daily-chip-val" id="dt-carbs-${day}">${t.carbs}g</span>
          <span class="daily-chip-key">UH</span>
        </div>
        <div class="daily-chip">
          <span class="daily-chip-val" id="dt-fat-${day}">${t.fat}g</span>
          <span class="daily-chip-key">Fat</span>
        </div>
      </div>
    </div>
  `;
}

function updateDailyTotal(day) {
  const t = calcDayTotal(day);
  const el = (id, val) => {
    const node = document.getElementById(id);
    if (node) node.textContent = val;
  };
  el(`dt-kcal-${day}`,     t.kcal);
  el(`dt-protein-${day}`,  `${t.protein}g`);
  el(`dt-carbs-${day}`,    `${t.carbs}g`);
  el(`dt-fat-${day}`,      `${t.fat}g`);
}

function renderMealSection(day, meal, mealEntry) {
  const ings = mealEntry.ingredients;
  const total = calcMealNutrition(ings);

  return `
    <div class="meal-section" data-day="${day}" data-meal="${meal}">
      <div class="meal-header">
        <h3>${MEAL_LABELS[meal]}</h3>
        <div class="meal-header-actions">
          <select class="meal-db-select" data-day="${day}" data-meal="${meal}">
            <option value="">+ Load meal...</option>
            ${mealsDatabase.map(m => `
              <option value="${m.id}">${m.imageEmoji || ''} ${m.name}</option>
            `).join('')}
          </select>
          <div class="copy-meal-wrap">
            <button class="btn btn-ghost btn-xs copy-meal-btn" data-day="${day}" data-meal="${meal}">Copy →</button>
            <div class="copy-dropdown copy-meal-dropdown" id="copy-meal-${day}-${meal}" style="display:none">
              <div class="copy-dropdown-label">Copy to:</div>
              ${DAYS.map((d, i) => `
                <div class="copy-dropdown-group">
                  <span class="copy-dropdown-day">${DAY_LABELS[i].slice(0,3)}</span>
                  ${MEALS.map(m => (d === day && m === meal) ? '' : `
                    <button class="copy-dropdown-item copy-dropdown-item--sm"
                      data-from-day="${day}" data-from-meal="${meal}"
                      data-to-day="${d}" data-to-meal="${m}">
                      ${MEAL_LABELS[m].split(' ')[1] || m}
                    </button>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          </div>
          ${ings.length > 0 ? `<button class="btn btn-ghost btn-xs clear-meal-btn" data-day="${day}" data-meal="${meal}">Clear</button>` : ''}
        </div>
      </div>

      <div class="ingredients-table-wrap">
        <table class="ingredients-table">
          <colgroup>
            <col class="col-cat">
            <col class="col-name">
            <col class="col-qty">
            <col class="col-unit">
            <col class="col-kcal">
            <col class="col-prot">
            <col class="col-uh">
            <col class="col-fat">
            <col class="col-del">
          </colgroup>
          <thead>
            <tr>
              <th class="th-cat">Cat.</th>
              <th>Ingredient</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Kcal</th>
              <th>Protein</th>
              <th>UH</th>
              <th>Fat</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="tbody-${day}-${meal}">
            ${ings.map(ing => renderIngredientRow(day, meal, ing)).join('')}
          </tbody>
          ${ings.length > 0 ? `
          <tfoot>
            <tr class="sum-row" id="sum-${day}-${meal}">
              <td colspan="4">Total</td>
              <td>${total.kcal}</td>
              <td>${total.protein}</td>
              <td>${total.carbs}</td>
              <td>${total.fat}</td>
              <td></td>
            </tr>
          </tfoot>` : ''}
        </table>
      </div>

      <button class="btn btn-outline btn-sm add-ing-btn" data-day="${day}" data-meal="${meal}">
        + Add Ingredient
      </button>
    </div>
  `;
}

function renderIngredientRow(day, meal, ing) {
  const nutrition = calcIngredientNutrition(ing);
  const units = ing.name ? suggestUnits(ing.name) : ['g'];
  const currentUnit = ing.unit || units[0];
  const hasFood = !!ing.foodId;

  const catOptions = FOOD_CATEGORIES.map(cat =>
    `<option value="${cat}">${cat}</option>`
  ).join('');

  return `
    <tr class="ing-row" data-id="${ing.id}" data-day="${day}" data-meal="${meal}">
      <td class="td-cat">
        <select class="cat-filter-select" data-id="${ing.id}" data-day="${day}" data-meal="${meal}">
          <option value="">All</option>
          ${catOptions}
        </select>
      </td>
      <td class="td-name">
        <div class="autocomplete-wrap">
          <input type="text" class="ing-name-input"
            placeholder="Ingredient name…"
            value="${escHtml(ing.name)}"
            data-id="${ing.id}" data-day="${day}" data-meal="${meal}"
            autocomplete="off">
          <div class="autocomplete-dropdown" id="ac-${ing.id}"></div>
        </div>
      </td>
      <td class="td-qty">
        <input type="number" class="ing-qty-input"
          min="0" step="any"
          value="${ing.quantity > 0 ? ing.quantity : ''}"
          placeholder="0"
          data-id="${ing.id}" data-day="${day}" data-meal="${meal}">
      </td>
      <td class="td-unit">
        <select class="unit-select" data-id="${ing.id}" data-day="${day}" data-meal="${meal}">
          ${units.map(u => `<option value="${u}" ${u === currentUnit ? 'selected' : ''}>${u}</option>`).join('')}
        </select>
      </td>
      <td class="td-num ${hasKnownNutrition(ing) ? '' : 'td-unknown'}">${hasKnownNutrition(ing) ? nutrition.kcal : '—'}</td>
      <td class="td-num ${hasKnownNutrition(ing) ? '' : 'td-unknown'}">${hasKnownNutrition(ing) ? nutrition.protein : '—'}</td>
      <td class="td-num ${hasKnownNutrition(ing) ? '' : 'td-unknown'}">${hasKnownNutrition(ing) ? nutrition.carbs : '—'}</td>
      <td class="td-num ${hasKnownNutrition(ing) ? '' : 'td-unknown'}">${hasKnownNutrition(ing) ? nutrition.fat : '—'}</td>
      <td class="td-del">
        <button class="del-ing-btn" data-id="${ing.id}" data-day="${day}" data-meal="${meal}" title="Remove">✕</button>
      </td>
    </tr>
  `;
}

// ── DOM update helpers (targeted, no full re-render) ────────────────────────

function updateNutritionRow(day, meal, ingId) {
  const menu = menuStore.get();
  const ing = menu[day][meal].ingredients.find(i => i.id === ingId);
  if (!ing) return;

  const row = document.querySelector(`tr.ing-row[data-id="${ingId}"]`);
  if (!row) return;

  const nutrition = calcIngredientNutrition(ing);
  const cells = row.querySelectorAll('.td-num');

  if (hasKnownNutrition(ing)) {
    cells[0].textContent = nutrition.kcal;
    cells[1].textContent = nutrition.protein;
    cells[2].textContent = nutrition.carbs;
    cells[3].textContent = nutrition.fat;
    cells.forEach(c => c.classList.remove('td-unknown'));
  } else {
    cells.forEach(c => { c.textContent = '—'; c.classList.add('td-unknown'); });
  }

  updateSumRow(day, meal);
}

function updateSumRow(day, meal) {
  const menu = menuStore.get();
  const total = calcMealNutrition(menu[day][meal].ingredients);
  const sumRow = document.getElementById(`sum-${day}-${meal}`);

  updateDailyTotal(day);

  if (menu[day][meal].ingredients.length === 0) {
    if (sumRow) sumRow.remove();
    return;
  }

  if (sumRow) {
    const tds = sumRow.querySelectorAll('td');
    tds[1].textContent = total.kcal;
    tds[2].textContent = total.protein;
    tds[3].textContent = total.carbs;
    tds[4].textContent = total.fat;
  } else {
    // Create the tfoot / sum row
    const table = document.querySelector(`#tbody-${day}-${meal}`)?.closest('table');
    if (!table) return;
    const tfoot = document.createElement('tfoot');
    tfoot.innerHTML = `
      <tr class="sum-row" id="sum-${day}-${meal}">
        <td colspan="4">Total</td>
        <td>${total.kcal}</td>
        <td>${total.protein}</td>
        <td>${total.carbs}</td>
        <td>${total.fat}</td>
        <td></td>
      </tr>`;
    table.appendChild(tfoot);
  }
}

function reRenderMealSection(day, meal) {
  const menu = menuStore.get();
  const section = document.querySelector(`.meal-section[data-day="${day}"][data-meal="${meal}"]`);
  if (!section) return;
  const newHtml = renderMealSection(day, meal, menu[day][meal]);
  section.outerHTML = newHtml;
  const newSection = document.querySelector(`.meal-section[data-day="${day}"][data-meal="${meal}"]`);
  if (newSection) bindMealSectionEvents(newSection);
  updateDailyTotal(day);
}

// ── Auto-fill ───────────────────────────────────────────────────────────────

function applyAutoFill(day, result) {
  const slots = ['lunch', 'snack', 'dinner'];
  for (const slot of slots) {
    const meal = result[slot];
    if (meal) {
      menuStore.loadPredefinedMeal(day, slot, meal, foodDatabase);
      reRenderMealSection(day, slot);
    }
  }
  updateDailyTotal(day);
}

// ── Event binding ───────────────────────────────────────────────────────────

function bindPageEvents(container) {
  // Day tabs
  container.querySelector('#day-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.day-tab');
    if (!btn) return;
    const dayIndex = parseInt(btn.dataset.day, 10);
    currentDay = dayIndex;

    container.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Update copy-day dropdown label and exclude current day
    const dropdown = container.querySelector('#copy-day-dropdown');
    if (dropdown) {
      dropdown.querySelector('.copy-dropdown-label').innerHTML =
        `Copy <strong>${DAY_LABELS[dayIndex]}</strong> to:`;
      dropdown.querySelectorAll('.copy-dropdown-item').forEach(item => {
        item.style.display = parseInt(item.dataset.toDay) === dayIndex ? 'none' : '';
      });
      dropdown.style.display = 'none';
    }

    container.querySelector('#day-content').innerHTML = renderDayContent(dayIndex);
    bindDayContentEvents(container.querySelector('#day-content'));
  });

  // Copy day toggle
  container.querySelector('#copy-day-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = container.querySelector('#copy-day-dropdown');
    toggleDropdown(dd, e.currentTarget);
  });

  // Copy day selection
  container.querySelector('#copy-day-dropdown')?.addEventListener('click', (e) => {
    const item = e.target.closest('.copy-dropdown-item');
    if (!item) return;
    const toDay = DAYS[parseInt(item.dataset.toDay)];
    const fromDay = DAYS[currentDay];
    menuStore.copyDay(fromDay, toDay);
    container.querySelector('#copy-day-dropdown').style.display = 'none';
    showCopyToast(container, `${DAY_LABELS[currentDay]} copied to ${DAY_LABELS[parseInt(item.dataset.toDay)]}`);
  });

  // Clear week
  container.querySelector('#clear-week-btn')?.addEventListener('click', () => {
    if (confirm('Clear the entire week? This cannot be undone.')) {
      menuStore.clearWeek();
      container.querySelector('#day-content').innerHTML = renderDayContent(currentDay);
      bindDayContentEvents(container.querySelector('#day-content'));
    }
  });

  // Smart fill week
  container.querySelector('#autofill-week-btn')?.addEventListener('click', () => {
    const profile = profileStore.get();
    const { targetKcal, targetProtein, targetCarbs, targetFat } = profile;
    if (!targetProtein || !targetCarbs) {
      showCopyToast(container, 'Set nutrition goals in User Profile first.');
      return;
    }
    const weekResult = autoFillWeek(targetKcal, targetProtein, targetCarbs, targetFat);
    if (!weekResult) {
      showCopyToast(container, 'No profile recipes found. Add recipes to your profile first.');
      return;
    }
    for (const day of DAYS) {
      applyAutoFill(day, weekResult[day]);
      adjustPortions(day, targetProtein, targetCarbs, targetFat);
    }
    container.querySelector('#day-content').innerHTML = renderDayContent(currentDay);
    bindDayContentEvents(container.querySelector('#day-content'));
    showCopyToast(container, 'Week filled with varied meals, portions adjusted to targets.');
  });

  // Close any open dropdown when clicking elsewhere
  document.addEventListener('click', closeAllCopyDropdowns);

  bindDayContentEvents(container.querySelector('#day-content'));
}

function closeAllCopyDropdowns() {
  document.querySelectorAll('.copy-dropdown').forEach(dd => dd.style.display = 'none');
}

function toggleDropdown(dd, btn) {
  if (dd.style.display !== 'none') {
    dd.style.display = 'none';
    return;
  }
  const rect = btn.getBoundingClientRect();
  dd.style.top  = (rect.bottom + 6) + 'px';
  dd.style.right = (window.innerWidth - rect.right) + 'px';
  dd.style.left  = 'auto';
  dd.style.display = 'block';
}

function bindDayContentEvents(dayContent) {
  dayContent.querySelectorAll('.meal-section').forEach(section => {
    bindMealSectionEvents(section);
  });

  dayContent.querySelector('.smart-fill-day-btn')?.addEventListener('click', (e) => {
    const day = e.currentTarget.dataset.day;
    const container = dayContent.closest('.page-content') || document.body;
    const profile = profileStore.get();
    const { targetKcal, targetProtein, targetCarbs, targetFat } = profile;

    if (!targetProtein || !targetCarbs) {
      showCopyToast(container, 'Set nutrition goals in User Profile first.');
      return;
    }

    const result = autoFillDay(targetKcal, targetProtein, targetCarbs, targetFat);
    if (!result) {
      showCopyToast(container, 'No profile recipes found. Add recipes to your profile first.');
      return;
    }

    applyAutoFill(day, result);
    adjustPortions(day, targetProtein, targetCarbs, targetFat);
    for (const slot of ['lunch', 'snack', 'dinner']) reRenderMealSection(day, slot);
    showCopyToast(container, 'Day filled and portions adjusted to your targets.');
  });

  dayContent.querySelector('.adjust-portions-btn')?.addEventListener('click', (e) => {
    const day = e.currentTarget.dataset.day;
    const container = dayContent.closest('.page-content') || document.body;
    const profile = profileStore.get();
    const { targetProtein, targetCarbs, targetFat } = profile;

    if (!targetProtein || !targetCarbs) {
      showCopyToast(container, 'Set nutrition goals in User Profile first.');
      return;
    }

    const changed = adjustPortions(day, targetProtein, targetCarbs, targetFat);
    if (!changed) {
      showCopyToast(container, 'Nothing to adjust — fill the day with recipes first.');
      return;
    }

    for (const slot of ['lunch', 'snack', 'dinner']) reRenderMealSection(day, slot);
    showCopyToast(container, 'Portions adjusted to match your nutrition targets.');
  });
}

function bindMealSectionEvents(section) {
  const day = section.dataset.day;
  const meal = section.dataset.meal;

  // Add ingredient button
  section.querySelector('.add-ing-btn')?.addEventListener('click', () => {
    const id = menuStore.addIngredient(day, meal);
    const tbody = section.querySelector(`#tbody-${day}-${meal}`);
    if (!tbody) return;
    const menu = menuStore.get();
    const ing = menu[day][meal].ingredients.find(i => i.id === id);
    if (!ing) return;
    tbody.insertAdjacentHTML('beforeend', renderIngredientRow(day, meal, ing));
    const newRow = tbody.querySelector(`tr[data-id="${id}"]`);
    if (newRow) bindRowEvents(newRow, section);
    updateSumRow(day, meal);
    // Focus the name input
    newRow?.querySelector('.ing-name-input')?.focus();
  });

  // Clear meal
  section.querySelector('.clear-meal-btn')?.addEventListener('click', () => {
    menuStore.clearMeal(day, meal);
    reRenderMealSection(day, meal);
  });

  // Copy meal toggle
  section.querySelector('.copy-meal-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const ddId = `copy-meal-${day}-${meal}`;
    document.querySelectorAll('.copy-dropdown').forEach(dd => {
      if (dd.id !== ddId) dd.style.display = 'none';
    });
    const dd = document.getElementById(ddId);
    if (dd) toggleDropdown(dd, e.currentTarget);
  });

  // Copy meal selection
  section.querySelector(`.copy-meal-dropdown`)?.addEventListener('click', (e) => {
    const item = e.target.closest('.copy-dropdown-item--sm');
    if (!item) return;
    const { fromDay, fromMeal, toDay, toMeal } = item.dataset;
    menuStore.copyMeal(fromDay, fromMeal, toDay, toMeal);
    document.getElementById(`copy-meal-${day}-${meal}`).style.display = 'none';
    reRenderMealSection(toDay, toMeal);
    const toDayLabel = DAY_LABELS[DAYS.indexOf(toDay)];
    const toMealLabel = MEAL_LABELS[toMeal]?.split(' ')[1] || toMeal;
    showCopyToast(section.closest('#day-content').parentElement,
      `${MEAL_LABELS[meal]} copied to ${toDayLabel} ${toMealLabel}`);
  });

  // Load predefined meal
  section.querySelector('.meal-db-select')?.addEventListener('change', (e) => {
    const mealId = e.target.value;
    if (!mealId) return;
    const predefined = mealsDatabase.find(m => m.id === mealId);
    if (!predefined) return;
    menuStore.loadPredefinedMeal(day, meal, predefined, foodDatabase);
    reRenderMealSection(day, meal);
  });

  // Bind existing rows
  section.querySelectorAll('.ing-row').forEach(row => bindRowEvents(row, section));
}

function bindRowEvents(row, section) {
  const id  = row.dataset.id;
  const day  = row.dataset.day;
  const meal = row.dataset.meal;

  const getCatFilter = () => row.querySelector('.cat-filter-select')?.value || '';

  // Category filter select
  const catSelect = row.querySelector('.cat-filter-select');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const nameInput = row.querySelector('.ing-name-input');
      handleNameInput(row, section, id, day, meal, nameInput?.value || '', catSelect.value);
    });
  }

  // Name input
  const nameInput = row.querySelector('.ing-name-input');
  if (nameInput) {
    let debounceTimer;
    nameInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const value = e.target.value;
      debounceTimer = setTimeout(() => {
        handleNameInput(row, section, id, day, meal, value, getCatFilter());
      }, 150);
    });

    nameInput.addEventListener('blur', () => {
      // Close dropdown after a short delay (allow click on suggestion)
      setTimeout(() => {
        const dd = document.getElementById(`ac-${id}`);
        if (dd) dd.innerHTML = '';
      }, 200);
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const dd = document.getElementById(`ac-${id}`);
        if (dd) dd.innerHTML = '';
      }
    });
  }

  // Qty input
  const qtyInput = row.querySelector('.ing-qty-input');
  if (qtyInput) {
    qtyInput.addEventListener('change', (e) => {
      const qty = parseFloat(e.target.value) || 0;
      menuStore.updateIngredient(day, meal, id, { quantity: qty });
      updateNutritionRow(day, meal, id);
    });
  }

  // Unit select
  const unitSelect = row.querySelector('.unit-select');
  if (unitSelect) {
    unitSelect.addEventListener('change', () => {
      menuStore.updateIngredient(day, meal, id, { unit: unitSelect.value });
      updateNutritionRow(day, meal, id);
    });
  }

  // Delete
  const delBtn = row.querySelector('.del-ing-btn');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      menuStore.removeIngredient(day, meal, id);
      row.remove();
      updateSumRow(day, meal);
      // Re-render to update clear button visibility
      const menu = menuStore.get();
      if (menu[day][meal].ingredients.length === 0) {
        reRenderMealSection(day, meal);
      }
    });
  }
}

function handleNameInput(row, section, id, day, meal, value, categoryFilter = '') {
  const trimmed = value.trim();

  // Suggest units based on name
  const units = suggestUnits(trimmed);
  const menu = menuStore.get();
  const ing = menu[day][meal].ingredients.find(i => i.id === id);
  const currentUnit = ing?.unit || units[0];

  // Rebuild unit select options when food name changes
  const unitSelect = row.querySelector('.unit-select');
  if (unitSelect) {
    const newUnit = units.includes(currentUnit) ? currentUnit : units[0];
    unitSelect.innerHTML = units.map(u => `<option value="${u}" ${u === newUnit ? 'selected' : ''}>${u}</option>`).join('');
  }

  // Show autocomplete dropdown
  const dd = document.getElementById(`ac-${id}`);
  if (!dd) return;

  // With no text: show category browse if a category is selected, otherwise clear
  if (!trimmed) {
    if (categoryFilter) {
      const catFoods = foodDatabase.filter(f => f.category === categoryFilter).slice(0, 14);
      const customCatFoods = customFoodsStore.get().foods.filter(f => f.category === categoryFilter).slice(0, 4);
      const all = [...catFoods, ...customCatFoods];
      if (all.length > 0) {
        dd.innerHTML = all.map(food => `
          <div class="ac-item" data-type="food" data-food-id="${food.id}" data-food-name="${escHtml(food.name)}">
            <span class="ac-name">${escHtml(food.name)}</span>
            <span class="ac-kcal">${food.nutritionPer100g.kcal} kcal</span>
          </div>
        `).join('');
        bindAcItems(dd, row, day, meal, id);
        return;
      }
    }
    dd.innerHTML = '';
    menuStore.updateIngredient(day, meal, id, { name: '', foodId: null, unit: units[0] });
    updateNutritionRow(day, meal, id);
    return;
  }

  // Search foods — filter by category if one is selected
  let foodMatches;
  if (categoryFilter) {
    const q = trimmed.toLowerCase();
    foodMatches = foodDatabase.filter(f =>
      f.category === categoryFilter &&
      (f.name.toLowerCase().includes(q) || (f.aliases || []).some(a => a.toLowerCase().includes(q)))
    ).slice(0, 10);
  } else {
    foodMatches = searchFoods(trimmed);
  }

  const customMatches = customFoodsStore.get().foods.filter(f => {
    const q = trimmed.toLowerCase();
    const nameMatch = f.name.toLowerCase().includes(q) || (f.aliases || []).some(a => a.toLowerCase().includes(q));
    const catMatch = !categoryFilter || f.category === categoryFilter;
    return nameMatch && catMatch;
  }).slice(0, 4);

  // Only show meals when no category filter
  const mealMatches = categoryFilter ? [] : mealsDatabase.filter(m =>
    m.name.toLowerCase().includes(trimmed.toLowerCase())
  ).slice(0, 4);

  const hasResults = foodMatches.length > 0 || customMatches.length > 0 || mealMatches.length > 0;

  if (hasResults) {
    let html = '';

    // Foods section
    const allFoodMatches = [...foodMatches, ...customMatches];
    if (allFoodMatches.length > 0) {
      html += allFoodMatches.map(food => `
        <div class="ac-item" data-type="food" data-food-id="${food.id}" data-food-name="${escHtml(food.name)}">
          <span class="ac-name">${escHtml(food.name)}</span>
          <span class="ac-kcal">${food.nutritionPer100g.kcal} kcal</span>
        </div>
      `).join('');
    }

    // Meals section
    if (mealMatches.length > 0) {
      if (allFoodMatches.length > 0) {
        html += `<div class="ac-divider">Meals (as portion)</div>`;
      }
      html += mealMatches.map(m => {
        const total = calcMealNutrition(
          m.ingredients.map(pi => ({ ...pi, name: '', customNutrition: null }))
        );
        return `
          <div class="ac-item ac-item--meal" data-type="meal" data-meal-id="${m.id}" data-meal-name="${escHtml(m.name)}"
            data-nutrition="${escHtml(JSON.stringify(total))}">
            <span class="ac-name">${m.imageEmoji || '🍽️'} ${escHtml(m.name)}</span>
            <span class="ac-kcal">${total.kcal} kcal/portion</span>
          </div>
        `;
      }).join('');
    }

    dd.innerHTML = html;
    bindAcItems(dd, row, day, meal, id);
  } else {
    dd.innerHTML = '';
    // Unknown food — update name only, clear foodId
    menuStore.updateIngredient(day, meal, id, { name: value, foodId: null, mealId: null, customNutrition: null, unit: units[0] });
    updateNutritionRow(day, meal, id);
  }
}

function bindAcItems(dd, row, day, meal, id) {
  dd.querySelectorAll('.ac-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const nameInput = row.querySelector('.ing-name-input');
      const unitSelect = row.querySelector('.unit-select');
      dd.innerHTML = '';

      if (item.dataset.type === 'meal') {
        const mealName = item.dataset.mealName;
        const nutrition = JSON.parse(item.dataset.nutrition);
        if (nameInput) nameInput.value = mealName;
        if (unitSelect) {
          unitSelect.innerHTML = `<option value="portion" selected>portion</option>`;
        }
        menuStore.updateIngredient(day, meal, id, {
          name: mealName,
          foodId: null,
          mealId: item.dataset.mealId,
          unit: 'portion',
          quantity: 1,
          customNutrition: nutrition,
        });
        const qtyInput = row.querySelector('.ing-qty-input');
        if (qtyInput && !qtyInput.value) qtyInput.value = '1';
      } else {
        const foodId = item.dataset.foodId;
        const foodName = item.dataset.foodName;
        const food = findFood(foodId);
        const foodUnits = food?.availableUnits || ['g'];
        const newUnit = foodUnits[0];
        if (nameInput) nameInput.value = foodName;
        if (unitSelect) {
          unitSelect.innerHTML = foodUnits.map(u => `<option value="${u}" ${u === newUnit ? 'selected' : ''}>${u}</option>`).join('');
        }
        menuStore.updateIngredient(day, meal, id, {
          name: foodName,
          foodId,
          mealId: null,
          customNutrition: null,
          unit: newUnit,
        });
      }

      updateNutritionRow(day, meal, id);
    });
  });
}

function showCopyToast(container, message) {
  // Remove any existing toast
  container.querySelector('.copy-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = message;
  container.appendChild(toast);
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('copy-toast--visible'));
  setTimeout(() => {
    toast.classList.remove('copy-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// True if we can show real nutrition values for this ingredient entry
function hasKnownNutrition(ing) {
  return !!(ing.foodId || (ing.customNutrition && ing.unit === 'portion'));
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
