import { findFoodByName } from '../data/foodDatabase.js';

// Keyword → unit list mapping (first unit = default suggestion)
const KEYWORD_UNIT_MAP = [
  // Liquids
  { keywords: ['juice', 'milk', 'water', 'cola', 'coke', 'pepsi', 'soda', 'beer', 'wine',
               'coffee', 'tea', 'smoothie', 'shake', 'broth', 'stock', 'oil', 'sauce'],
    units: ['ml', 'L'] },

  // Eggs
  { keywords: ['egg'], units: ['piece', 'g'] },

  // Bread / bakery (piece/slice first)
  { keywords: ['bread', 'toast', 'bun', 'roll', 'bagel', 'croissant', 'muffin', 'cracker', 'biscuit'],
    units: ['slice', 'piece', 'g'] },

  // Tortilla / flatbread
  { keywords: ['tortilla', 'pita', 'wrap', 'flatbread', 'naan', 'taco'],
    units: ['piece', 'g'] },

  // Meat / fish
  { keywords: ['chicken', 'beef', 'pork', 'turkey', 'salmon', 'tuna', 'fish', 'shrimp',
               'lamb', 'steak', 'mince', 'bacon', 'fillet', 'steak', 'prawns'],
    units: ['g', 'kg', 'piece'] },

  // Cheese
  { keywords: ['cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'gouda'],
    units: ['g', 'slice'] },

  // Condiments / spreads (tbsp first)
  { keywords: ['ketchup', 'mayo', 'mustard', 'dressing', 'syrup', 'honey', 'jam',
               'peanut butter', 'hummus', 'tahini'],
    units: ['tbsp', 'tsp', 'g'] },

  // Whole fruits
  { keywords: ['apple', 'banana', 'orange', 'peach', 'pear', 'mango', 'lemon', 'lime', 'avocado'],
    units: ['piece', 'g'] },

  // Small fruits / berries
  { keywords: ['strawberry', 'blueberry', 'raspberry', 'grape', 'cherry'],
    units: ['g'] },

  // Vegetables (piece available for whole veg)
  { keywords: ['tomato', 'cucumber', 'pepper', 'onion', 'potato', 'carrot', 'zucchini'],
    units: ['g', 'piece'] },

  // Leafy / chopped veg
  { keywords: ['broccoli', 'spinach', 'lettuce', 'kale', 'cabbage', 'asparagus', 'celery'],
    units: ['g'] },

  // Grains / pasta / rice
  { keywords: ['rice', 'pasta', 'oat', 'oatmeal', 'flour', 'quinoa', 'couscous', 'noodle', 'granola'],
    units: ['g', 'kg'] },

  // Nuts / seeds
  { keywords: ['nuts', 'almonds', 'cashews', 'peanut', 'walnut', 'seeds', 'chia', 'flaxseed', 'sunflower'],
    units: ['g', 'tbsp'] },

  // Powders
  { keywords: ['protein', 'powder', 'flour', 'sugar', 'salt', 'pepper', 'spice'],
    units: ['g', 'tbsp', 'tsp'] },
];

/**
 * Suggest available units for a given ingredient name.
 * Returns an ordered array: first = default suggestion.
 */
export function suggestUnits(name) {
  const lower = (name || '').toLowerCase().trim();
  if (!lower) return ['g'];

  // Tier 1: exact/alias match in food database
  const dbMatch = findFoodByName(lower);
  if (dbMatch) return dbMatch.availableUnits;

  // Tier 2: keyword scan
  for (const entry of KEYWORD_UNIT_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.units;
    }
  }

  // Tier 3: default fallback
  return ['g', 'kg', 'ml', 'L', 'piece'];
}

export function defaultUnit(name) {
  return suggestUnits(name)[0];
}
