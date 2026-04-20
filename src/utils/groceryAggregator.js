import { findFoodById } from '../data/foodDatabase.js';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const MEALS = ['breakfast','lunch','snack','dinner'];

/**
 * Aggregates all ingredients from a WeeklyMenu state into a grocery list.
 * Groups by foodId (or name for unknowns), sums quantities per unit.
 * Meal-portions (unit='portion') get their own group with mealId attached.
 *
 * @param {Object} menu - WeeklyMenu state from menuStore
 * @returns {Array<{ name, foodId, mealId, totalsByUnit }>}
 */
export function aggregateGroceries(menu) {
  const groups = new Map();

  for (const day of DAYS) {
    for (const meal of MEALS) {
      const mealEntry = menu[day]?.[meal];
      if (!mealEntry) continue;

      for (const ing of mealEntry.ingredients) {
        if (!ing.name || ing.quantity <= 0) continue;

        // Meal portions use mealId as key so each meal stays separate
        const key = ing.mealId
          ? `meal::${ing.mealId}`
          : (ing.foodId || ing.name.toLowerCase().trim());
        if (!key) continue;

        if (!groups.has(key)) {
          const food = ing.foodId ? findFoodById(ing.foodId) : null;
          groups.set(key, {
            name: food ? food.name : ing.name,
            foodId: ing.foodId || null,
            mealId: ing.mealId || null,
            totalsByUnit: {},
          });
        }

        const group = groups.get(key);
        const unit = ing.unit || 'g';
        group.totalsByUnit[unit] = (group.totalsByUnit[unit] || 0) + ing.quantity;
      }
    }
  }

  const result = Array.from(groups.values());
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export function formatQtyUnit(qty, unit) {
  const rounded = Math.round(qty * 10) / 10;
  return `${rounded} ${unit}`;
}
