// Pre-defined meals database
// Each meal has ingredients referencing foodDatabase IDs and full recipe steps

import { profileStore } from '../store.js';
import { profileRecipesDatabase } from './profileRecipesDatabase.js';

const _base = [
  // ── Breakfast ──────────────────────────────────────────────────────────────
  {
    id: 'classic-oatmeal',
    name: 'Classic Oatmeal Bowl',
    category: 'breakfast',
    tags: ['vegetarian', 'high-carb', 'quick'],
    imageEmoji: '🥣',
    ingredients: [
      { foodId: 'oats', quantity: 80, unit: 'g' },
      { foodId: 'whole-milk', quantity: 200, unit: 'ml' },
      { foodId: 'banana', quantity: 1, unit: 'piece' },
      { foodId: 'honey', quantity: 1, unit: 'tbsp' },
      { foodId: 'blueberries', quantity: 50, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Pour milk into a small saucepan and bring to a gentle simmer over medium heat.' },
      { stepNumber: 2, instruction: 'Add oats and stir continuously for 3-5 minutes until thickened to your preferred consistency.' },
      { stepNumber: 3, instruction: 'Transfer oatmeal to a bowl. Slice the banana and arrange on top.' },
      { stepNumber: 4, instruction: 'Add blueberries and drizzle with honey. Serve immediately.' },
    ],
  },
  {
    id: 'scrambled-eggs-toast',
    name: 'Scrambled Eggs on Toast',
    category: 'breakfast',
    tags: ['high-protein', 'quick', 'classic'],
    imageEmoji: '🍳',
    ingredients: [
      { foodId: 'egg', quantity: 3, unit: 'piece' },
      { foodId: 'wheat-bread', quantity: 2, unit: 'slice' },
      { foodId: 'butter', quantity: 10, unit: 'g' },
      { foodId: 'whole-milk', quantity: 30, unit: 'ml' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Crack the eggs into a bowl, add milk, and whisk well. Season with salt and pepper.' },
      { stepNumber: 2, instruction: 'Heat butter in a non-stick pan over low-medium heat until melted and foamy.' },
      { stepNumber: 3, instruction: 'Pour in the egg mixture. Let it sit for 20 seconds, then gently stir with a spatula.' },
      { stepNumber: 4, instruction: 'Continue folding the eggs slowly, removing from heat while still slightly runny.' },
      { stepNumber: 5, instruction: 'Toast the bread. Serve scrambled eggs on top immediately.' },
    ],
  },
  {
    id: 'greek-yogurt-granola',
    name: 'Greek Yogurt with Granola',
    category: 'breakfast',
    tags: ['vegetarian', 'high-protein', 'quick', 'no-cook'],
    imageEmoji: '🫙',
    ingredients: [
      { foodId: 'greek-yogurt', quantity: 200, unit: 'g' },
      { foodId: 'granola', quantity: 50, unit: 'g' },
      { foodId: 'blueberries', quantity: 80, unit: 'g' },
      { foodId: 'honey', quantity: 1, unit: 'tsp' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Spoon Greek yogurt into a bowl or glass.' },
      { stepNumber: 2, instruction: 'Layer granola on top for crunch.' },
      { stepNumber: 3, instruction: 'Add blueberries (or your preferred berries).' },
      { stepNumber: 4, instruction: 'Drizzle with honey and serve.' },
    ],
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast with Egg',
    category: 'breakfast',
    tags: ['vegetarian', 'high-fat', 'trendy'],
    imageEmoji: '🥑',
    ingredients: [
      { foodId: 'wheat-bread', quantity: 2, unit: 'slice' },
      { foodId: 'avocado', quantity: 100, unit: 'g' },
      { foodId: 'egg', quantity: 1, unit: 'piece' },
      { foodId: 'lemon', quantity: 5, unit: 'ml' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Toast the bread slices until golden and crispy.' },
      { stepNumber: 2, instruction: 'Scoop avocado into a bowl, add lemon juice, salt and pepper, and mash with a fork.' },
      { stepNumber: 3, instruction: 'Fry or poach the egg to your preference.' },
      { stepNumber: 4, instruction: 'Spread mashed avocado on toast, top with the egg. Add chilli flakes if desired.' },
    ],
  },
  {
    id: 'overnight-oats',
    name: 'Overnight Oats',
    category: 'breakfast',
    tags: ['vegetarian', 'meal-prep', 'no-cook'],
    imageEmoji: '🌙',
    ingredients: [
      { foodId: 'oats', quantity: 80, unit: 'g' },
      { foodId: 'whole-milk', quantity: 200, unit: 'ml' },
      { foodId: 'chia-seeds', quantity: 15, unit: 'g' },
      { foodId: 'honey', quantity: 1, unit: 'tbsp' },
      { foodId: 'strawberries', quantity: 100, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Combine oats, milk, chia seeds, and honey in a jar or container.' },
      { stepNumber: 2, instruction: 'Stir well to mix everything together.' },
      { stepNumber: 3, instruction: 'Cover and refrigerate overnight (at least 6 hours).' },
      { stepNumber: 4, instruction: 'In the morning, top with sliced strawberries and serve cold.' },
    ],
  },
  {
    id: 'protein-smoothie-bowl',
    name: 'Protein Smoothie Bowl',
    category: 'breakfast',
    tags: ['high-protein', 'post-workout', 'vegetarian'],
    imageEmoji: '💪',
    ingredients: [
      { foodId: 'banana', quantity: 1, unit: 'piece' },
      { foodId: 'protein-powder', quantity: 30, unit: 'g' },
      { foodId: 'whole-milk', quantity: 150, unit: 'ml' },
      { foodId: 'granola', quantity: 40, unit: 'g' },
      { foodId: 'strawberries', quantity: 100, unit: 'g' },
      { foodId: 'blueberries', quantity: 50, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Blend banana, protein powder, and milk until smooth. Use less milk for a thicker consistency.' },
      { stepNumber: 2, instruction: 'Pour the smoothie base into a bowl.' },
      { stepNumber: 3, instruction: 'Top with granola, sliced strawberries, and blueberries.' },
      { stepNumber: 4, instruction: 'Serve immediately before the granola softens.' },
    ],
  },

  // ── Lunch ──────────────────────────────────────────────────────────────────
  {
    id: 'caesar-salad',
    name: 'Caesar Salad',
    category: 'lunch',
    tags: ['classic', 'high-protein', 'salad'],
    imageEmoji: '🥗',
    ingredients: [
      { foodId: 'romaine-lettuce', quantity: 150, unit: 'g' },
      { foodId: 'chicken-breast', quantity: 120, unit: 'g' },
      { foodId: 'parmesan', quantity: 30, unit: 'g' },
      { foodId: 'caesar-dressing', quantity: 2, unit: 'tbsp' },
      { foodId: 'croutons', quantity: 20, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Season chicken breast with salt, pepper, and a drizzle of olive oil.' },
      { stepNumber: 2, instruction: 'Grill or pan-fry chicken for 6-7 minutes per side until cooked through. Rest for 5 minutes, then slice.' },
      { stepNumber: 3, instruction: 'Wash and tear romaine lettuce into bite-sized pieces.' },
      { stepNumber: 4, instruction: 'Toss lettuce with Caesar dressing until evenly coated.' },
      { stepNumber: 5, instruction: 'Top with sliced chicken, croutons, and freshly grated Parmesan.' },
    ],
  },
  {
    id: 'tuna-wrap',
    name: 'Tuna Wrap',
    category: 'lunch',
    tags: ['high-protein', 'quick', 'meal-prep'],
    imageEmoji: '🌯',
    ingredients: [
      { foodId: 'tuna-canned', quantity: 120, unit: 'g' },
      { foodId: 'wheat-tortilla', quantity: 1, unit: 'piece' },
      { foodId: 'cucumber', quantity: 80, unit: 'g' },
      { foodId: 'tomato', quantity: 80, unit: 'g' },
      { foodId: 'mayo', quantity: 1, unit: 'tbsp' },
      { foodId: 'romaine-lettuce', quantity: 40, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Drain the canned tuna well. Mix with mayonnaise, salt and pepper.' },
      { stepNumber: 2, instruction: 'Slice cucumber and tomato. Tear lettuce leaves.' },
      { stepNumber: 3, instruction: 'Warm the tortilla in a pan or microwave for 15 seconds.' },
      { stepNumber: 4, instruction: 'Layer tuna mixture, lettuce, cucumber, and tomato on the tortilla.' },
      { stepNumber: 5, instruction: 'Fold the sides and roll tightly. Cut in half and serve.' },
    ],
  },
  {
    id: 'greek-salad',
    name: 'Greek Salad',
    category: 'lunch',
    tags: ['vegetarian', 'mediterranean', 'no-cook'],
    imageEmoji: '🇬🇷',
    ingredients: [
      { foodId: 'cucumber', quantity: 150, unit: 'g' },
      { foodId: 'tomato', quantity: 150, unit: 'g' },
      { foodId: 'feta', quantity: 80, unit: 'g' },
      { foodId: 'olives', quantity: 40, unit: 'g' },
      { foodId: 'olive-oil', quantity: 2, unit: 'tbsp' },
      { foodId: 'onion', quantity: 50, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Chop cucumber and tomato into chunky pieces.' },
      { stepNumber: 2, instruction: 'Thinly slice the red onion.' },
      { stepNumber: 3, instruction: 'Combine cucumber, tomato, and onion in a bowl. Add olives.' },
      { stepNumber: 4, instruction: 'Crumble feta cheese on top.' },
      { stepNumber: 5, instruction: 'Drizzle with olive oil, season with dried oregano and salt. Serve.' },
    ],
  },

  // ── Dinner ─────────────────────────────────────────────────────────────────
  {
    id: 'chicken-rice',
    name: 'Chicken Breast with Rice',
    category: 'dinner',
    tags: ['high-protein', 'classic', 'meal-prep'],
    imageEmoji: '🍗',
    ingredients: [
      { foodId: 'chicken-breast', quantity: 200, unit: 'g' },
      { foodId: 'white-rice-cooked', quantity: 250, unit: 'g' },
      { foodId: 'broccoli', quantity: 150, unit: 'g' },
      { foodId: 'olive-oil', quantity: 1, unit: 'tbsp' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Cook rice according to package instructions.' },
      { stepNumber: 2, instruction: 'Pound chicken breast to even thickness. Season with salt, pepper, and garlic powder.' },
      { stepNumber: 3, instruction: 'Heat olive oil in a pan over medium-high heat. Cook chicken 6-7 minutes per side.' },
      { stepNumber: 4, instruction: 'Steam or blanch broccoli for 4-5 minutes until tender-crisp.' },
      { stepNumber: 5, instruction: 'Rest chicken for 5 minutes, then slice. Serve with rice and broccoli.' },
    ],
  },
  {
    id: 'pasta-bolognese',
    name: 'Pasta Bolognese',
    category: 'dinner',
    tags: ['classic', 'italian', 'comfort-food'],
    imageEmoji: '🍝',
    ingredients: [
      { foodId: 'pasta-cooked', quantity: 200, unit: 'g' },
      { foodId: 'beef-mince', quantity: 150, unit: 'g' },
      { foodId: 'tomato-sauce', quantity: 150, unit: 'g' },
      { foodId: 'parmesan', quantity: 20, unit: 'g' },
      { foodId: 'olive-oil', quantity: 1, unit: 'tbsp' },
      { foodId: 'garlic', quantity: 2, unit: 'piece' },
      { foodId: 'onion', quantity: 80, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Cook pasta according to package instructions. Reserve a cup of pasta water.' },
      { stepNumber: 2, instruction: 'Finely dice onion and mince garlic.' },
      { stepNumber: 3, instruction: 'Heat olive oil in a large pan. Sauté onion for 5 minutes, then add garlic for 1 minute.' },
      { stepNumber: 4, instruction: 'Add beef mince and brown for 8-10 minutes, breaking it up as it cooks.' },
      { stepNumber: 5, instruction: 'Add tomato sauce, season, and simmer for 15-20 minutes. Add pasta water if needed.' },
      { stepNumber: 6, instruction: 'Toss drained pasta with the bolognese sauce. Serve topped with Parmesan.' },
    ],
  },
  {
    id: 'salmon-vegetables',
    name: 'Salmon with Roasted Vegetables',
    category: 'dinner',
    tags: ['high-protein', 'omega-3', 'healthy'],
    imageEmoji: '🐟',
    ingredients: [
      { foodId: 'salmon-fillet', quantity: 200, unit: 'g' },
      { foodId: 'sweet-potato', quantity: 200, unit: 'g' },
      { foodId: 'asparagus', quantity: 100, unit: 'g' },
      { foodId: 'olive-oil', quantity: 1, unit: 'tbsp' },
      { foodId: 'lemon', quantity: 1, unit: 'piece' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Preheat oven to 200°C (400°F).' },
      { stepNumber: 2, instruction: 'Peel and cube sweet potato. Toss with half the olive oil, salt, and pepper. Roast for 20 minutes.' },
      { stepNumber: 3, instruction: 'Toss asparagus with the remaining olive oil. Add to the oven for the last 10 minutes.' },
      { stepNumber: 4, instruction: 'Season salmon with salt, pepper, and lemon zest. Pan-sear skin-side down for 4 minutes, then flip for 2 minutes.' },
      { stepNumber: 5, instruction: 'Serve salmon over roasted vegetables with lemon wedges.' },
    ],
  },
  {
    id: 'beef-tacos',
    name: 'Beef Tacos',
    category: 'dinner',
    tags: ['mexican', 'comfort-food', 'family'],
    imageEmoji: '🌮',
    ingredients: [
      { foodId: 'beef-mince', quantity: 150, unit: 'g' },
      { foodId: 'corn-tortilla', quantity: 3, unit: 'piece' },
      { foodId: 'cheddar', quantity: 40, unit: 'g' },
      { foodId: 'tomato', quantity: 80, unit: 'g' },
      { foodId: 'romaine-lettuce', quantity: 50, unit: 'g' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Brown beef mince in a pan over medium-high heat. Drain excess fat.' },
      { stepNumber: 2, instruction: 'Season with cumin, chilli powder, garlic powder, salt, and pepper. Cook for 2 minutes.' },
      { stepNumber: 3, instruction: 'Warm corn tortillas in a dry pan for 30 seconds per side.' },
      { stepNumber: 4, instruction: 'Dice tomato and shred lettuce. Grate cheddar cheese.' },
      { stepNumber: 5, instruction: 'Assemble tacos: beef, lettuce, tomato, and cheddar. Serve with sour cream or salsa if desired.' },
    ],
  },
  {
    id: 'veggie-stir-fry',
    name: 'Vegetarian Stir-fry with Rice',
    category: 'dinner',
    tags: ['vegetarian', 'vegan', 'asian', 'quick'],
    imageEmoji: '🥦',
    ingredients: [
      { foodId: 'tofu', quantity: 200, unit: 'g' },
      { foodId: 'bell-pepper', quantity: 100, unit: 'g' },
      { foodId: 'broccoli', quantity: 150, unit: 'g' },
      { foodId: 'soy-sauce', quantity: 2, unit: 'tbsp' },
      { foodId: 'sesame-oil', quantity: 1, unit: 'tsp' },
      { foodId: 'white-rice-cooked', quantity: 200, unit: 'g' },
      { foodId: 'garlic', quantity: 2, unit: 'piece' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Press tofu to remove excess moisture. Cut into 2cm cubes.' },
      { stepNumber: 2, instruction: 'Cook rice according to package instructions.' },
      { stepNumber: 3, instruction: 'Heat sesame oil in a wok or large pan over high heat. Add tofu and fry until golden on all sides (8-10 min).' },
      { stepNumber: 4, instruction: 'Remove tofu. In the same pan, stir-fry garlic, broccoli, and bell pepper for 4-5 minutes.' },
      { stepNumber: 5, instruction: 'Return tofu to pan, add soy sauce, and toss everything together for 1-2 minutes.' },
      { stepNumber: 6, instruction: 'Serve over steamed rice.' },
    ],
  },
  {
    id: 'chicken-noodles',
    name: 'Chicken Stir-fry with Noodles',
    category: 'dinner',
    tags: ['high-protein', 'asian', 'quick'],
    imageEmoji: '🍜',
    ingredients: [
      { foodId: 'chicken-breast', quantity: 180, unit: 'g' },
      { foodId: 'egg-noodles', quantity: 150, unit: 'g' },
      { foodId: 'soy-sauce', quantity: 2, unit: 'tbsp' },
      { foodId: 'sesame-oil', quantity: 1, unit: 'tsp' },
      { foodId: 'mixed-vegetables', quantity: 200, unit: 'g' },
      { foodId: 'garlic', quantity: 2, unit: 'piece' },
    ],
    recipe: [
      { stepNumber: 1, instruction: 'Cook egg noodles according to package instructions. Drain and set aside.' },
      { stepNumber: 2, instruction: 'Slice chicken breast into thin strips. Season with salt and pepper.' },
      { stepNumber: 3, instruction: 'Heat sesame oil in a wok over high heat. Stir-fry chicken for 5-6 minutes until cooked.' },
      { stepNumber: 4, instruction: 'Add minced garlic and mixed vegetables. Stir-fry for 3-4 minutes.' },
      { stepNumber: 5, instruction: 'Add noodles and soy sauce. Toss everything together for 2 minutes over high heat.' },
      { stepNumber: 6, instruction: 'Serve immediately, garnished with sesame seeds if desired.' },
    ],
  },
];

const _nickname = (profileStore.get().nickname || '').toLowerCase().trim();
const _profileMeals = profileRecipesDatabase[_nickname] || [];
export const mealsDatabase = [..._base, ..._profileMeals];

export function findMealById(id) {
  return mealsDatabase.find(m => m.id === id);
}

export function getMealsByCategory(category) {
  if (!category || category === 'all') return mealsDatabase;
  return mealsDatabase.filter(m => m.category === category || m.category === 'any');
}

export function searchMeals(query) {
  if (!query) return mealsDatabase;
  const q = query.toLowerCase();
  return mealsDatabase.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.tags.some(t => t.includes(q))
  );
}
