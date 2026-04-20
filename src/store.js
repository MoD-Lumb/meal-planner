// Reactive store backed by localStorage.
// Usage: import { profileStore, menuStore, prefsStore } from './store.js'
// store.subscribe(fn) — called on every state change
// store.get() — current state
// store.set(patch | updaterFn) — update state

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const MEALS = ['breakfast','lunch','snack','dinner'];

function createStore(key, initial) {
  let state;
  try {
    const saved = localStorage.getItem(key);
    state = saved ? JSON.parse(saved) : initial;
  } catch {
    state = initial;
  }

  const listeners = new Set();

  function get() { return state; }

  function set(updater) {
    const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    state = next;
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
    try { window.__driveSync?.requestSave(); } catch {}
    for (const fn of listeners) fn(state);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { get, set, subscribe };
}

// ── Profiles initialization ────────────────────────────────────────────────
// On first load (or after clearing storage), migrates any old single-profile
// data to the new per-profile-keyed format.

function initProfilesData() {
  try {
    const saved = localStorage.getItem('mp-profiles');
    if (saved) {
      const data = JSON.parse(saved);
      if (data && Array.isArray(data.profiles) && data.activeId) return data;
    }
  } catch {}

  // Migration: read old single-profile format
  let oldProfile = null;
  try { oldProfile = JSON.parse(localStorage.getItem('mp-profile')); } catch {}

  const id = 'profile-' + crypto.randomUUID();
  const profile = {
    id,
    nickname: oldProfile?.nickname || '',
    gender:   oldProfile?.gender   || '',
    weightKg: oldProfile?.weightKg ?? '',
    heightCm: oldProfile?.heightCm ?? '',
  };

  // Migrate old storage keys to profile-scoped keys
  const MIGRATE = {
    'mp-menu':          `mp-${id}-menu`,
    'mp-custom-meals':  `mp-${id}-custom-meals`,
    'mp-custom-foods':  `mp-${id}-custom-foods`,
    'mp-meal-portions': `mp-${id}-meal-portions`,
    'mp-prefs':         `mp-${id}-prefs`,
  };
  for (const [oldKey, newKey] of Object.entries(MIGRATE)) {
    const val = localStorage.getItem(oldKey);
    if (val !== null) localStorage.setItem(newKey, val);
  }

  const data = { profiles: [profile], activeId: id };
  localStorage.setItem('mp-profiles', JSON.stringify(data));
  return data;
}

const _profilesInitial = initProfilesData();
const ACTIVE_ID = _profilesInitial.activeId;

// ── Profiles store (list of all profiles + active id) ──────────────────────

export const profilesStore = createStore('mp-profiles', _profilesInitial);

// ── Active profile derived store ───────────────────────────────────────────
// Reads/writes the active profile's personal data through profilesStore.
// The rest of the app uses this just like the old single profileStore.

export const profileStore = {
  get() {
    const { profiles, activeId } = profilesStore.get();
    return profiles.find(p => p.id === activeId) || { nickname: '', gender: '', weightKg: '', heightCm: '' };
  },
  set(updater) {
    profilesStore.set(data => {
      const cur = data.profiles.find(p => p.id === data.activeId) || { id: data.activeId };
      const patch = typeof updater === 'function' ? updater(cur) : updater;
      const next = { ...cur, ...patch };
      return { ...data, profiles: data.profiles.map(p => p.id === data.activeId ? next : p) };
    });
  },
  subscribe(fn) {
    return profilesStore.subscribe(() => fn(this.get()));
  },
};

// ── Profile management helpers ─────────────────────────────────────────────

export function switchProfile(id) {
  const data = profilesStore.get();
  if (data.activeId === id) return;
  if (!data.profiles.find(p => p.id === id)) return;
  profilesStore.set({ ...data, activeId: id });
  location.reload();
}

export function createProfile(nickname) {
  const id = 'profile-' + crypto.randomUUID();
  const newProfile = { id, nickname: (nickname || '').trim() || 'New Profile', gender: '', weightKg: '', heightCm: '' };
  const data = profilesStore.get();
  profilesStore.set({ profiles: [...data.profiles, newProfile], activeId: id });
  location.reload();
}

export function deleteProfile(id) {
  const data = profilesStore.get();
  if (data.profiles.length <= 1) return;
  const remaining = data.profiles.filter(p => p.id !== id);
  const newActiveId = data.activeId === id ? remaining[0].id : data.activeId;
  profilesStore.set({ profiles: remaining, activeId: newActiveId });
  location.reload();
}

// ── Menu Store ─────────────────────────────────────────────────────────────

function emptyMeal() {
  return { predefinedMealId: null, ingredients: [] };
}

function emptyWeek() {
  const week = {};
  for (const day of DAYS) {
    week[day] = {};
    for (const meal of MEALS) {
      week[day][meal] = emptyMeal();
    }
  }
  return week;
}

// Merge saved state with empty week to fill missing days/meals
function hydrateMenu(saved) {
  const base = emptyWeek();
  if (!saved) return base;
  for (const day of DAYS) {
    for (const meal of MEALS) {
      if (saved[day]?.[meal]) {
        base[day][meal] = saved[day][meal];
      }
    }
  }
  return base;
}

function makeMenuStore(key) {
  let raw;
  try {
    const saved = localStorage.getItem(key);
    raw = saved ? JSON.parse(saved) : null;
  } catch { raw = null; }

  let state = hydrateMenu(raw);
  const listeners = new Set();

  function get() { return state; }

  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
    try { window.__driveSync?.requestSave(); } catch {}
  }

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function set(updater) {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    save();
    notify();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // ── Ingredient operations ──────────────────────────────────────────────

  function addIngredient(day, meal) {
    const id = crypto.randomUUID();
    state[day][meal].ingredients.push({ id, foodId: null, name: '', quantity: 0, unit: 'g' });
    save(); notify();
    return id;
  }

  function removeIngredient(day, meal, ingredientId) {
    const ings = state[day][meal].ingredients;
    state[day][meal].ingredients = ings.filter(i => i.id !== ingredientId);
    save(); notify();
  }

  function updateIngredient(day, meal, ingredientId, patch) {
    const ings = state[day][meal].ingredients;
    const idx = ings.findIndex(i => i.id === ingredientId);
    if (idx === -1) return;
    ings[idx] = { ...ings[idx], ...patch };
    save(); notify();
  }

  function loadPredefinedMeal(day, meal, predefinedMeal, foodDatabase) {
    // Expand predefined meal's ingredients into IngredientEntry[]
    const ingredients = predefinedMeal.ingredients.map(pi => {
      const food = foodDatabase.find(f => f.id === pi.foodId);
      return {
        id: crypto.randomUUID(),
        foodId: pi.foodId,
        name: food ? food.name : pi.foodId,
        quantity: pi.quantity,
        unit: pi.unit,
      };
    });
    state[day][meal] = {
      predefinedMealId: predefinedMeal.id,
      ingredients,
    };
    save(); notify();
  }

  function clearMeal(day, meal) {
    state[day][meal] = emptyMeal();
    save(); notify();
  }

  function clearWeek() {
    state = emptyWeek();
    save(); notify();
  }

  // Deep-clone a meal entry, giving each ingredient a fresh id
  function cloneMeal(mealEntry) {
    return {
      predefinedMealId: mealEntry.predefinedMealId,
      ingredients: mealEntry.ingredients.map(ing => ({ ...ing, id: crypto.randomUUID() })),
    };
  }

  function copyMeal(fromDay, fromMeal, toDay, toMeal) {
    state[toDay][toMeal] = cloneMeal(state[fromDay][fromMeal]);
    save(); notify();
  }

  function copyDay(fromDay, toDay) {
    for (const meal of MEALS) {
      state[toDay][meal] = cloneMeal(state[fromDay][meal]);
    }
    save(); notify();
  }

  return { get, set, subscribe, addIngredient, removeIngredient, updateIngredient, loadPredefinedMeal, clearMeal, clearWeek, copyMeal, copyDay };
}

export const menuStore = makeMenuStore(`mp-${ACTIVE_ID}-menu`);

// ── Custom Meals Store ─────────────────────────────────────────────────────

export const customMealsStore = createStore(`mp-${ACTIVE_ID}-custom-meals`, { meals: [] });

export function addCustomMeal(meal) {
  const current = customMealsStore.get().meals;
  customMealsStore.set({ meals: [...current, meal] });
}

export function updateCustomMeal(id, patch) {
  const current = customMealsStore.get().meals;
  customMealsStore.set({ meals: current.map(m => m.id === id ? { ...m, ...patch } : m) });
}

export function removeCustomMeal(id) {
  const current = customMealsStore.get().meals;
  customMealsStore.set({ meals: current.filter(m => m.id !== id) });
}

// ── Meal Portions Store ────────────────────────────────────────────────────
// Persists default portion count per meal id

export const mealPortionsStore = createStore(`mp-${ACTIVE_ID}-meal-portions`, {});

export function setMealPortions(mealId, portions) {
  mealPortionsStore.set(prev => ({ ...prev, [mealId]: portions }));
}

export function getMealPortions(mealId) {
  return mealPortionsStore.get()[mealId] || 1;
}

// ── Custom Foods Store ─────────────────────────────────────────────────────
// User-defined ingredients stored alongside the built-in food database

export const customFoodsStore = createStore(`mp-${ACTIVE_ID}-custom-foods`, { foods: [] });

export function addCustomFood(food) {
  const current = customFoodsStore.get().foods;
  customFoodsStore.set({ foods: [...current, food] });
}

export function removeCustomFood(id) {
  const current = customFoodsStore.get().foods;
  customFoodsStore.set({ foods: current.filter(f => f.id !== id) });
}

// ── Preferences Store ──────────────────────────────────────────────────────

export const prefsStore = createStore(`mp-${ACTIVE_ID}-prefs`, { sidebarOpen: true });

// ── Cijene API config (global, not profile-scoped) ─────────────────────────
// Stores the cijene-api Bearer token. Kept outside profile scope because the
// key is issued by the API provider per account, not per meal-plan persona.

export const apiConfigStore = createStore('mp-api-config', { cijeneApiKey: '' });
