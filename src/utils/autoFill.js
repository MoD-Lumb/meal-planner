import { profileStore, menuStore } from '../store.js';
import { profileRecipesDatabase, portionRules } from '../data/profileRecipesDatabase.js';
import { calcMealNutrition, calcIngredientNutrition, findFood } from './nutritionCalc.js';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getProfileMeals() {
  const nickname = (profileStore.get().nickname || '').toLowerCase().trim();
  return { meals: profileRecipesDatabase[nickname] || [], nickname };
}

// ── Auto-fill single day ────────────────────────────────────────────────────

export function autoFillDay(targetKcal, targetProtein, targetCarbs, targetFat) {
  const { meals } = getProfileMeals();

  const lunches = meals.filter(m => m.category === 'lunch' || m.category === 'any');
  const snacks  = meals.filter(m => m.category === 'snack');
  const dinners = meals.filter(m => m.category === 'dinner' || m.category === 'any');

  if (!lunches.length && !snacks.length && !dinners.length) return null;

  const nutri = new Map();
  for (const m of meals) nutri.set(m.id, calcMealNutrition(m.ingredients));

  const score = (combo) => {
    const tot = combo.reduce((a, m) => {
      const n = nutri.get(m.id);
      return { kcal: a.kcal + n.kcal, protein: a.protein + n.protein, carbs: a.carbs + n.carbs, fat: a.fat + n.fat };
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    const d = (a, t) => t > 0 ? Math.abs(a - t) / t : 0;
    return 2 * d(tot.kcal, targetKcal) + 1.5 * d(tot.protein, targetProtein) + d(tot.carbs, targetCarbs) + d(tot.fat, targetFat);
  };

  const lunchPool  = lunches.length ? lunches : [null];
  const snackPool  = snacks.length  ? snacks  : [null];
  const dinnerPool = dinners.length ? dinners : [null];

  let best = null, bestScore = Infinity;
  for (const l of lunchPool) {
    for (const s of snackPool) {
      for (const d of dinnerPool) {
        const combo = [l, s, d].filter(Boolean);
        if (!combo.length) continue;
        const sc = score(combo);
        if (sc < bestScore) { bestScore = sc; best = { lunch: l || null, snack: s || null, dinner: d || null }; }
      }
    }
  }
  return best;
}

// ── Auto-fill full week with variety ───────────────────────────────────────

export function autoFillWeek(targetKcal, targetProtein, targetCarbs, targetFat) {
  const { meals } = getProfileMeals();

  const anyPool   = shuffle(meals.filter(m => m.category === 'any'));
  const snackPool = shuffle(meals.filter(m => m.category === 'snack'));

  if (!anyPool.length && !snackPool.length) return null;

  const result = {};
  const n = anyPool.length;

  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i];
    const lunch  = n ? anyPool[i % n] : null;

    // Dinner: offset by ceil(n/2) to maximise distance from lunch choice
    const offset = n > 1 ? Math.ceil(n / 2) : 1;
    let dinner = n ? anyPool[(i + offset) % n] : null;
    // Safety: if only one recipe, lunch === dinner — acceptable
    const snack = snackPool.length ? snackPool[i % snackPool.length] : null;

    result[day] = { lunch, snack, dinner };
  }
  return result;
}

// ── Macro role classification ───────────────────────────────────────────────

function macroRole(food) {
  const n = food.nutritionPer100g;
  const pCal = n.protein * 4;
  const cCal = n.carbs * 4;
  const fCal = n.fat * 9;
  const total = pCal + cCal + fCal;
  if (total <= 0) return 'neutral';
  if (pCal / total > 0.35) return 'protein';
  if (cCal / total > 0.45) return 'carb';
  if (fCal / total > 0.55) return 'fat';
  return 'neutral';
}

function roundQty(qty, unit) {
  if (['kom', 'piece', 'slice'].includes(unit)) return Math.max(1, Math.round(qty));
  return Math.round(qty * 10) / 10;
}

// ── Adjust portions ─────────────────────────────────────────────────────────

export function adjustPortions(day, targetProtein, targetCarbs, targetFat) {
  const ADJUST_SLOTS = ['lunch', 'snack', 'dinner'];
  const menu = menuStore.get();

  // Load profile-specific rules
  const { nickname } = getProfileMeals();
  const rules   = portionRules[nickname] || {};
  const fixed   = new Set(rules.fixedFoodIds   || []);
  const minRole = rules.minGramsByRole || {};
  const maxRole = rules.maxGramsByRole || {};

  // Subtract breakfast from targets
  const bfNutrition = calcMealNutrition(menu[day].breakfast?.ingredients || []);
  const remainProtein = Math.max(0, targetProtein - bfNutrition.protein);
  const remainCarbs   = Math.max(0, targetCarbs   - bfNutrition.carbs);
  const remainFat     = Math.max(0, (targetFat || 0) - bfNutrition.fat);

  // Classify all adjustable ingredients (skip fixed ones)
  const items = [];
  for (const slot of ADJUST_SLOTS) {
    for (const ing of (menu[day][slot]?.ingredients || [])) {
      if (!ing.foodId || ing.unit === 'portion') continue;
      if (fixed.has(ing.foodId)) continue;
      const food = findFood(ing.foodId);
      if (!food) continue;
      items.push({ ing, slot, food, role: macroRole(food) });
    }
  }
  if (!items.length) return false;

  // Accumulate macro contributions by role vs. everything else
  let pFromRole = 0, pFromOther = 0;
  let cFromRole = 0, cFromOther = 0;
  let fFromRole = 0, fFromOther = 0;

  for (const { ing, role } of items) {
    const n = calcIngredientNutrition(ing);
    if      (role === 'protein') { pFromRole += n.protein; cFromOther += n.carbs;   fFromOther += n.fat; }
    else if (role === 'carb')    { cFromRole += n.carbs;   pFromOther += n.protein; fFromOther += n.fat; }
    else if (role === 'fat')     { fFromRole += n.fat;     pFromOther += n.protein; cFromOther += n.carbs; }
    else                         { pFromOther += n.protein; cFromOther += n.carbs;  fFromOther += n.fat; }
  }

  if (pFromRole <= 0 && cFromRole <= 0 && fFromRole <= 0) return false;

  const needed = (remain, fromOther) => Math.max(0, remain - fromOther);
  const proteinScale = pFromRole > 0 ? needed(remainProtein, pFromOther) / pFromRole : 1;
  const carbScale    = cFromRole > 0 ? needed(remainCarbs,   cFromOther) / cFromRole : 1;
  const fatScale     = fFromRole > 0 && remainFat > 0 ? needed(remainFat, fFromOther) / fFromRole : 1;

  let changed = false;
  for (const { ing, slot, role } of items) {
    let scale = 1;
    if      (role === 'protein') scale = proteinScale;
    else if (role === 'carb')    scale = carbScale;
    else if (role === 'fat')     scale = fatScale;
    else continue;

    if (Math.abs(scale - 1) < 0.02) continue;

    let newQty = roundQty(ing.quantity * scale, ing.unit);

    // Apply portion rules clamp
    if (minRole[role]) newQty = Math.max(minRole[role], newQty);
    if (maxRole[role]) newQty = Math.min(maxRole[role], newQty);
    newQty = roundQty(newQty, ing.unit); // re-round after clamp

    if (newQty !== ing.quantity) {
      menuStore.updateIngredient(day, slot, ing.id, { quantity: newQty });
      changed = true;
    }
  }

  return changed;
}
