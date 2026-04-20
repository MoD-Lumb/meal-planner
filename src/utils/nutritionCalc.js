import { findFoodById } from '../data/foodDatabase.js';
import { customFoodsStore } from '../store.js';

// Grams per 1 unit (generic fallbacks — food-specific overrides take precedence)
const UNIT_GRAMS = {
  g: 1,
  kg: 1000,
  ml: 1,
  L: 1000,
  piece: 100,
  slice: 30,
  tbsp: 15,
  tsp: 5,
  kcal: 0,     // handled specially
  portion: 0,  // handled specially (whole meal)
};

/**
 * Look up a food from built-in DB or custom foods store.
 */
export function findFood(id) {
  return findFoodById(id) || customFoodsStore.get().foods.find(f => f.id === id) || null;
}

/**
 * Convert (quantity, unit, food) → effective grams
 */
export function resolveGrams(quantity, unit, food) {
  if (quantity <= 0) return 0;

  if (unit === 'kcal') {
    const kcalPer100g = food.nutritionPer100g.kcal;
    if (!kcalPer100g) return 0;
    return (quantity / kcalPer100g) * 100;
  }

  // Food-specific override (e.g. 1 egg piece = 60g)
  const override = food.unitOverrides?.[unit];
  if (override !== undefined) return quantity * override;

  // Generic unit table
  return quantity * (UNIT_GRAMS[unit] ?? 1);
}

/**
 * Calculate nutrition for a single ingredient entry.
 * Returns { kcal, protein, carbs, fat } all rounded to 1 decimal.
 *
 * Handles three cases:
 *  1. entry.customNutrition set + unit='portion' — whole meal added as single row
 *  2. entry.foodId set — look up food in DB (built-in or custom)
 *  3. Neither — return zeros (unknown/typed ingredient)
 */
export function calcIngredientNutrition(entry) {
  const zero = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  // Case 1: whole meal added as a portion
  if (entry.customNutrition && entry.unit === 'portion') {
    const qty = entry.quantity > 0 ? entry.quantity : 1;
    const n = entry.customNutrition;
    return {
      kcal:    round1(n.kcal    * qty),
      protein: round1(n.protein * qty),
      carbs:   round1(n.carbs   * qty),
      fat:     round1(n.fat     * qty),
    };
  }

  // Case 2: known food ingredient
  if (!entry.foodId) return zero;
  const food = findFood(entry.foodId);
  if (!food || entry.quantity <= 0) return zero;

  const grams = resolveGrams(entry.quantity, entry.unit, food);
  const ratio = grams / 100;
  const n = food.nutritionPer100g;

  return {
    kcal:    round1(n.kcal    * ratio),
    protein: round1(n.protein * ratio),
    carbs:   round1(n.carbs   * ratio),
    fat:     round1(n.fat     * ratio),
  };
}

/**
 * Sum nutrition across all ingredients in a meal.
 */
export function calcMealNutrition(ingredients) {
  return ingredients.reduce((sum, entry) => {
    const n = calcIngredientNutrition(entry);
    return {
      kcal:    round1(sum.kcal    + n.kcal),
      protein: round1(sum.protein + n.protein),
      carbs:   round1(sum.carbs   + n.carbs),
      fat:     round1(sum.fat     + n.fat),
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
