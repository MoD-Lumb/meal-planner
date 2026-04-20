// Food database with nutrition per 100g and unit definitions
// nutritionPer100g: { kcal, protein, carbs, fat }
// unitOverrides: gramsPerUnit (how many grams = 1 of this unit)
// availableUnits: ordered list, first = default suggestion
// category: used for filtering on the Ingredients page

export const foodDatabase = [
  // ── Beverages ──────────────────────────────────────────────────────────────
  {
    id: 'coca-cola', name: 'Coca Cola', aliases: ['coke', 'cola', 'coca cola', 'pepsi'],
    category: 'Beverages',
    nutritionPer100g: { kcal: 42, protein: 0, carbs: 10.6, fat: 0 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1, L: 1000 },
  },
  {
    id: 'whole-milk', name: 'Whole Milk', aliases: ['milk', 'cow milk'],
    category: 'Beverages',
    nutritionPer100g: { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1.03, L: 1030 },
  },
  {
    id: 'orange-juice', name: 'Orange Juice', aliases: ['oj', 'juice'],
    category: 'Beverages',
    nutritionPer100g: { kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1, L: 1000 },
  },
  {
    id: 'water', name: 'Water', aliases: ['mineral water', 'sparkling water'],
    category: 'Beverages',
    nutritionPer100g: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1, L: 1000 },
  },
  {
    id: 'black-coffee', name: 'Black Coffee', aliases: ['coffee', 'espresso', 'americano'],
    category: 'Beverages',
    nutritionPer100g: { kcal: 2, protein: 0.3, carbs: 0, fat: 0 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1, L: 1000 },
  },

  // ── Dairy ──────────────────────────────────────────────────────────────────
  {
    id: 'greek-yogurt', name: 'Greek Yogurt', aliases: ['yogurt', 'greek yoghurt'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'butter', name: 'Butter', aliases: ['unsalted butter'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 14 },
  },
  {
    id: 'cheddar', name: 'Cheddar Cheese', aliases: ['cheddar', 'cheese'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 403, protein: 25, carbs: 1.3, fat: 33 },
    availableUnits: ['g', 'slice'],
    unitOverrides: { slice: 28 },
  },
  {
    id: 'feta', name: 'Feta Cheese', aliases: ['feta'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 264, protein: 14, carbs: 4.1, fat: 21 },
    availableUnits: ['g'],
  },
  {
    id: 'mozzarella', name: 'Mozzarella', aliases: ['mozzarella cheese'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 280, protein: 28, carbs: 2.2, fat: 17 },
    availableUnits: ['g', 'slice'],
    unitOverrides: { slice: 28 },
  },
  {
    id: 'parmesan', name: 'Parmesan', aliases: ['parmesan cheese', 'parmigiano'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 431, protein: 38, carbs: 4.1, fat: 29 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 5 },
  },
  {
    id: 'cottage-cheese', name: 'Cottage Cheese', aliases: ['cottage'],
    category: 'Dairy',
    nutritionPer100g: { kcal: 98, protein: 11.1, carbs: 3.4, fat: 4.3 },
    availableUnits: ['g'],
  },

  // ── Eggs ───────────────────────────────────────────────────────────────────
  {
    id: 'egg', name: 'Egg', aliases: ['eggs', 'hen egg', 'chicken egg'],
    category: 'Eggs',
    nutritionPer100g: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
    availableUnits: ['piece', 'g'],
    unitOverrides: { piece: 60 },
  },

  // ── Meat & Fish ────────────────────────────────────────────────────────────
  {
    id: 'chicken-breast', name: 'Chicken Breast', aliases: ['chicken', 'grilled chicken'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
    availableUnits: ['g', 'kg', 'piece'],
    unitOverrides: { piece: 175 },
  },
  {
    id: 'beef-mince', name: 'Beef Mince', aliases: ['ground beef', 'minced beef', 'beef'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 215, protein: 26, carbs: 0, fat: 13 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'salmon-fillet', name: 'Salmon Fillet', aliases: ['salmon', 'atlantic salmon'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 208, protein: 20, carbs: 0, fat: 13 },
    availableUnits: ['g', 'kg', 'piece'],
    unitOverrides: { piece: 200 },
  },
  {
    id: 'tuna-canned', name: 'Tuna (canned)', aliases: ['tuna', 'canned tuna'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 116, protein: 25.5, carbs: 0, fat: 1 },
    availableUnits: ['g'],
  },
  {
    id: 'bacon', name: 'Bacon', aliases: ['streaky bacon', 'pork bacon'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 541, protein: 37, carbs: 1.4, fat: 42 },
    availableUnits: ['g', 'slice'],
    unitOverrides: { slice: 19 },
  },
  {
    id: 'shrimp', name: 'Shrimp', aliases: ['prawns', 'tiger prawns'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 },
    availableUnits: ['g'],
  },
  {
    id: 'tofu', name: 'Tofu', aliases: ['bean curd', 'firm tofu'],
    category: 'Meat & Fish',
    nutritionPer100g: { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
    availableUnits: ['g'],
  },

  // ── Grains, Bread & Pasta ──────────────────────────────────────────────────
  {
    id: 'white-rice-cooked', name: 'White Rice (cooked)', aliases: ['rice', 'steamed rice', 'boiled rice'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'pasta-cooked', name: 'Pasta (cooked)', aliases: ['pasta', 'spaghetti', 'penne', 'fusilli'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'oats', name: 'Oats', aliases: ['oatmeal', 'rolled oats', 'porridge oats'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 389, protein: 16.9, carbs: 66, fat: 6.9 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'wheat-bread', name: 'Wheat Bread', aliases: ['bread', 'white bread', 'toast', 'sandwich bread'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
    availableUnits: ['slice', 'piece', 'g'],
    unitOverrides: { slice: 30, piece: 30 },
  },
  {
    id: 'corn-tortilla', name: 'Corn Tortilla', aliases: ['corn wrap', 'taco shell'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 218, protein: 5.7, carbs: 45, fat: 3.1 },
    availableUnits: ['piece', 'g'],
    unitOverrides: { piece: 26 },
  },
  {
    id: 'wheat-tortilla', name: 'Wheat Tortilla', aliases: ['tortilla', 'flour tortilla', 'wrap'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 303, protein: 8.6, carbs: 49, fat: 7.8 },
    availableUnits: ['piece', 'g'],
    unitOverrides: { piece: 45 },
  },
  {
    id: 'granola', name: 'Granola', aliases: ['muesli', 'cereal'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 471, protein: 10, carbs: 64, fat: 20 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 7.5 },
  },
  {
    id: 'egg-noodles', name: 'Egg Noodles (cooked)', aliases: ['noodles', 'ramen noodles'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 138, protein: 4.5, carbs: 25, fat: 2.1 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'croutons', name: 'Croutons', aliases: ['bread croutons'],
    category: 'Grains & Bread',
    nutritionPer100g: { kcal: 407, protein: 10, carbs: 72, fat: 9.3 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 7 },
  },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  {
    id: 'tomato', name: 'Tomato', aliases: ['tomatoes', 'cherry tomatoes'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 100 },
  },
  {
    id: 'cucumber', name: 'Cucumber', aliases: ['cucumbers'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 200 },
  },
  {
    id: 'broccoli', name: 'Broccoli', aliases: ['broccoli florets'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
    availableUnits: ['g'],
  },
  {
    id: 'spinach', name: 'Spinach', aliases: ['baby spinach', 'fresh spinach'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    availableUnits: ['g'],
  },
  {
    id: 'romaine-lettuce', name: 'Romaine Lettuce', aliases: ['lettuce', 'cos lettuce', 'salad leaves'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.3 },
    availableUnits: ['g'],
  },
  {
    id: 'bell-pepper', name: 'Bell Pepper', aliases: ['pepper', 'capsicum', 'red pepper', 'yellow pepper'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 31, protein: 1, carbs: 7.6, fat: 0.3 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 120 },
  },
  {
    id: 'onion', name: 'Onion', aliases: ['red onion', 'white onion', 'yellow onion'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 150 },
  },
  {
    id: 'garlic', name: 'Garlic', aliases: ['garlic clove', 'minced garlic'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 3 },
  },
  {
    id: 'avocado', name: 'Avocado', aliases: ['hass avocado'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 200 },
  },
  {
    id: 'sweet-potato', name: 'Sweet Potato', aliases: ['yam', 'sweet potatoes'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 180 },
  },
  {
    id: 'asparagus', name: 'Asparagus', aliases: ['asparagus spears'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.2 },
    availableUnits: ['g'],
  },
  {
    id: 'mixed-vegetables', name: 'Mixed Vegetables', aliases: ['stir fry vegetables', 'frozen vegetables'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 65, protein: 2.5, carbs: 13, fat: 0.2 },
    availableUnits: ['g'],
  },
  {
    id: 'olives', name: 'Olives', aliases: ['black olives', 'green olives', 'kalamata olives'],
    category: 'Vegetables',
    nutritionPer100g: { kcal: 145, protein: 1, carbs: 3.8, fat: 15 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 5 },
  },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  {
    id: 'banana', name: 'Banana', aliases: ['bananas'],
    category: 'Fruits',
    nutritionPer100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    availableUnits: ['piece', 'g'],
    unitOverrides: { piece: 120 },
  },
  {
    id: 'apple', name: 'Apple', aliases: ['apples', 'red apple', 'green apple'],
    category: 'Fruits',
    nutritionPer100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    availableUnits: ['piece', 'g'],
    unitOverrides: { piece: 182 },
  },
  {
    id: 'orange', name: 'Orange', aliases: ['oranges', 'mandarin'],
    category: 'Fruits',
    nutritionPer100g: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 },
    availableUnits: ['piece', 'g'],
    unitOverrides: { piece: 180 },
  },
  {
    id: 'strawberries', name: 'Strawberries', aliases: ['strawberry', 'fresh strawberries'],
    category: 'Fruits',
    nutritionPer100g: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
    availableUnits: ['g'],
  },
  {
    id: 'blueberries', name: 'Blueberries', aliases: ['blueberry', 'fresh blueberries'],
    category: 'Fruits',
    nutritionPer100g: { kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 },
    availableUnits: ['g'],
  },
  {
    id: 'lemon', name: 'Lemon', aliases: ['lemon juice', 'fresh lemon'],
    category: 'Fruits',
    nutritionPer100g: { kcal: 29, protein: 1.1, carbs: 9.3, fat: 0.3 },
    availableUnits: ['piece', 'g', 'ml'],
    unitOverrides: { piece: 75, ml: 1 },
  },

  // ── Oils, Fats & Condiments ────────────────────────────────────────────────
  {
    id: 'olive-oil', name: 'Olive Oil', aliases: ['oil', 'extra virgin olive oil', 'evoo'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
    availableUnits: ['tbsp', 'tsp', 'ml'],
    unitOverrides: { tbsp: 13.5, tsp: 4.5, ml: 0.92 },
  },
  {
    id: 'sesame-oil', name: 'Sesame Oil', aliases: ['toasted sesame oil'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
    availableUnits: ['tsp', 'tbsp'],
    unitOverrides: { tsp: 4.5, tbsp: 13.5 },
  },
  {
    id: 'soy-sauce', name: 'Soy Sauce', aliases: ['soya sauce', 'tamari'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 53, protein: 5.6, carbs: 7.6, fat: 0.1 },
    availableUnits: ['tbsp', 'tsp', 'ml'],
    unitOverrides: { tbsp: 16, tsp: 5.3, ml: 1 },
  },
  {
    id: 'mayo', name: 'Mayonnaise', aliases: ['mayo', 'hellmanns'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 680, protein: 1, carbs: 0.6, fat: 75 },
    availableUnits: ['tbsp', 'g'],
    unitOverrides: { tbsp: 14 },
  },
  {
    id: 'caesar-dressing', name: 'Caesar Dressing', aliases: ['caesar sauce'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 320, protein: 2.5, carbs: 8, fat: 31 },
    availableUnits: ['tbsp', 'g'],
    unitOverrides: { tbsp: 15 },
  },
  {
    id: 'honey', name: 'Honey', aliases: ['raw honey', 'manuka honey'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 },
    availableUnits: ['tbsp', 'tsp', 'g'],
    unitOverrides: { tbsp: 21, tsp: 7 },
  },
  {
    id: 'tomato-sauce', name: 'Tomato Sauce', aliases: ['marinara sauce', 'pasta sauce', 'passata'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 29, protein: 1.6, carbs: 6.3, fat: 0.4 },
    availableUnits: ['g', 'ml'],
    unitOverrides: { ml: 1 },
  },
  {
    id: 'ketchup', name: 'Ketchup', aliases: ['tomato ketchup', 'catsup'],
    category: 'Oils & Condiments',
    nutritionPer100g: { kcal: 101, protein: 1.4, carbs: 25, fat: 0.1 },
    availableUnits: ['tbsp', 'g'],
    unitOverrides: { tbsp: 17 },
  },

  // ── Nuts, Seeds & Supplements ──────────────────────────────────────────────
  {
    id: 'almonds', name: 'Almonds', aliases: ['almond', 'whole almonds'],
    category: 'Nuts & Seeds',
    nutritionPer100g: { kcal: 579, protein: 21, carbs: 22, fat: 50 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 8 },
  },
  {
    id: 'chia-seeds', name: 'Chia Seeds', aliases: ['chia'],
    category: 'Nuts & Seeds',
    nutritionPer100g: { kcal: 486, protein: 17, carbs: 42, fat: 31 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'protein-powder', name: 'Protein Powder', aliases: ['whey protein', 'protein shake powder'],
    category: 'Nuts & Seeds',
    nutritionPer100g: { kcal: 371, protein: 74, carbs: 11, fat: 4.2 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 25 },
  },

  // ── Proteini ───────────────────────────────────────────────────────────────
  {
    id: 'teletina', name: 'Teletina', aliases: ['veal', 'teletina'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 172, protein: 24, carbs: 0, fat: 7.6 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'junetina', name: 'Junetina', aliases: ['beef', 'govedina'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 169, protein: 28, carbs: 0, fat: 6.5 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'puretina', name: 'Puretina', aliases: ['turkey', 'turkey breast'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 117, protein: 24, carbs: 0, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'piletina', name: 'Piletina', aliases: ['chicken', 'chicken breast', 'pile'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 173, protein: 31, carbs: 0, fat: 3.6 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'svinjetina', name: 'Svinjetina', aliases: ['pork', 'svinjsko meso'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 143, protein: 26, carbs: 0, fat: 3.5 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'prsut', name: 'Pršut', aliases: ['prsut', 'prosciutto', 'ham'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 193, protein: 28, carbs: 0, fat: 12 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'losos', name: 'Losos', aliases: ['salmon', 'losos'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 206, protein: 22, carbs: 0, fat: 13 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tuna-konzerva', name: 'Tuna konzerva', aliases: ['canned tuna', 'tuna iz konzerve'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 166, protein: 28, carbs: 0, fat: 8 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tuna', name: 'Tuna', aliases: ['fresh tuna', 'tuna fillet'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 145, protein: 26, carbs: 0, fat: 3.4 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'morski-plodovi', name: 'Morski plodovi', aliases: ['seafood', 'shrimp', 'škampi', 'plodovi mora'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 105, protein: 20, carbs: 0, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'svjezi-sir', name: 'Svježi sir', aliases: ['fresh cheese', 'cottage cheese', 'svjezi sir'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 98, protein: 11, carbs: 3, fat: 4.3 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'jaje', name: 'Jaje', aliases: ['egg', 'eggs', 'jaja'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 143, protein: 12, carbs: 1, fat: 10.3 },
    availableUnits: ['kom', 'g'],
    unitOverrides: { kom: 100 },
  },
  {
    id: 'tofu', name: 'Tofu', aliases: ['tofu', 'bean curd'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 76, protein: 8, carbs: 2, fat: 5 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tempeh', name: 'Tempeh', aliases: ['tempeh'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 193, protein: 20, carbs: 7, fat: 11 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'seitan', name: 'Seitan', aliases: ['seitan', 'wheat gluten', 'wheat meat'],
    category: 'Proteini', source: 'claude',
    nutritionPer100g: { kcal: 143, protein: 21, carbs: 5, fat: 2 },
    availableUnits: ['g', 'kg'],
  },

  // ── Ugljikohidrati ─────────────────────────────────────────────────────────
  {
    id: 'zobene-pahuljice', name: 'Zobene pahuljice', aliases: ['oats', 'oatmeal', 'rolled oats'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 389, protein: 17, carbs: 66, fat: 7 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'integralni-kruh', name: 'Integralni kruh', aliases: ['whole grain bread', 'wholemeal bread'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 247, protein: 14, carbs: 42, fat: 3 },
    availableUnits: ['g', 'slice'],
    unitOverrides: { slice: 35 },
  },
  {
    id: 'integralne-palacinke', name: 'Integralne palačinke', aliases: ['whole grain pancakes', 'integralne palacinke'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 220, protein: 6, carbs: 34, fat: 6 },
    availableUnits: ['g', 'piece'],
    unitOverrides: { piece: 60 },
  },
  {
    id: 'kvinoja', name: 'Kvinoja', aliases: ['quinoa'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 368, protein: 15, carbs: 64, fat: 6 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'kukuruz', name: 'Kukuruz', aliases: ['corn', 'maize', 'polenta corn'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 365, protein: 10, carbs: 74, fat: 4 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tortilja', name: 'Tortilja', aliases: ['tortilla wrap', 'flour tortilla'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 316, protein: 18, carbs: 43, fat: 8 },
    availableUnits: ['g', 'kom'],
    unitOverrides: { kom: 80 },
  },
  {
    id: 'amarant', name: 'Amarant', aliases: ['amaranth'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 371, protein: 14, carbs: 65, fat: 7 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'integralna-tjestenina', name: 'Integralna tjestenina', aliases: ['whole grain pasta', 'wholemeal pasta'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 348, protein: 13, carbs: 72, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'heljda', name: 'Heljda', aliases: ['buckwheat'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 343, protein: 13, carbs: 72, fat: 3 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'cous-cous', name: 'Cous-cous', aliases: ['couscous', 'cous cous'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 376, protein: 13, carbs: 77, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'riza', name: 'Riža', aliases: ['rice', 'riza', 'bijela riza'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 365, protein: 7, carbs: 80, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'jecam', name: 'Ječam', aliases: ['barley', 'jecam'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 354, protein: 13, carbs: 74, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'palenta', name: 'Palenta', aliases: ['polenta', 'cornmeal'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 370, protein: 7, carbs: 80, fat: 1 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'proso', name: 'Proso', aliases: ['millet'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 378, protein: 11, carbs: 73, fat: 4 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'pir', name: 'Pir', aliases: ['spelt', 'pir pshenica'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 338, protein: 15, carbs: 71, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'batat', name: 'Batat', aliases: ['sweet potato', 'yam'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 86, protein: 2, carbs: 20, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'njoki', name: 'Njoki', aliases: ['gnocchi'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 130, protein: 3, carbs: 26, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'krumpir', name: 'Krumpir', aliases: ['potato', 'potatoes'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 77, protein: 2, carbs: 20, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tortilla-kom', name: 'Tortilla', aliases: ['tortilla piece', 'tortilla wrap kom'],
    category: 'Ugljikohidrati', source: 'claude',
    nutritionPer100g: { kcal: 252.8, protein: 14.4, carbs: 34.4, fat: 6.4 },
    availableUnits: ['kom', 'g'],
    unitOverrides: { kom: 100 },
  },

  // ── Povrće ─────────────────────────────────────────────────────────────────
  {
    id: 'grah', name: 'Grah', aliases: ['beans', 'kidney beans', 'white beans'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 347, protein: 21, carbs: 62, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'leca', name: 'Leća', aliases: ['lentils', 'leca'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 352, protein: 26, carbs: 60, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'bob', name: 'Bob', aliases: ['fava beans', 'broad beans'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 341, protein: 26, carbs: 58, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'grasak', name: 'Grašak', aliases: ['peas', 'green peas', 'grasak'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 81, protein: 5, carbs: 15, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'mahune', name: 'Mahune', aliases: ['green beans', 'string beans'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 31, protein: 2, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'slanutak', name: 'Slanutak', aliases: ['chickpeas', 'garbanzo'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 364, protein: 19, carbs: 60, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'brokula', name: 'Brokula', aliases: ['broccoli'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 34, protein: 3, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'cvjetaca', name: 'Cvjetača', aliases: ['cauliflower', 'cvjetaca'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 25, protein: 2, carbs: 5, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'koromac', name: 'Koromač', aliases: ['fennel', 'koromac'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 31, protein: 2, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'paprika', name: 'Paprika', aliases: ['bell pepper', 'pepper'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 31, protein: 1, carbs: 6, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'mrkva', name: 'Mrkva', aliases: ['carrot', 'carrots'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 41, protein: 1, carbs: 9, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'mladi-luk', name: 'Mladi luk', aliases: ['spring onion', 'green onion', 'scallion'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 32, protein: 2, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'poriluk', name: 'Poriluk', aliases: ['leek'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 61, protein: 2, carbs: 14, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'sparoge', name: 'Šparoge', aliases: ['asparagus', 'sparoge'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 20, protein: 2, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'kelj', name: 'Kelj', aliases: ['kale'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 49, protein: 4, carbs: 9, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'spinat', name: 'Špinat', aliases: ['spinach', 'spinat'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 23, protein: 3, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'kukuruz-secerac', name: 'Kukuruz šećerac', aliases: ['sweet corn', 'corn kernels'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 86, protein: 5, carbs: 17, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'blitva', name: 'Blitva', aliases: ['swiss chard', 'chard'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 19, protein: 2, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'gljive', name: 'Gljive', aliases: ['mushrooms', 'champignons'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 22, protein: 3, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tikvica', name: 'Tikvica', aliases: ['zucchini', 'courgette'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 17, protein: 1, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'bundeva', name: 'Bundeva', aliases: ['pumpkin', 'squash'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 26, protein: 1, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'rotkvica', name: 'Rotkvica', aliases: ['radish'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 16, protein: 1, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'repa', name: 'Repa', aliases: ['turnip'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 28, protein: 1, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'cikla', name: 'Cikla', aliases: ['beetroot', 'beet'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 43, protein: 1, carbs: 9, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'bijeli-kupus', name: 'Bijeli kupus', aliases: ['white cabbage', 'cabbage'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 25, protein: 1, carbs: 6, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'crveni-kupus', name: 'Crveni kupus', aliases: ['red cabbage'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 31, protein: 1, carbs: 7, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'crveni-radic', name: 'Crveni radič', aliases: ['radicchio', 'red chicory'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 23, protein: 1, carbs: 5, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'radic', name: 'Radič', aliases: ['chicory', 'endive', 'radic'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 23, protein: 1, carbs: 5, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'zelena-salata', name: 'Zelena salata', aliases: ['lettuce', 'green salad', 'salata'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 15, protein: 1, carbs: 3, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'rikola', name: 'Rikola', aliases: ['arugula', 'rocket', 'rucola'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 25, protein: 2, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'matovilac', name: 'Matovilac', aliases: ['lamb\'s lettuce', 'corn salad', 'mache'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 14, protein: 2, carbs: 3, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'krastavac', name: 'Krastavac', aliases: ['cucumber'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 16, protein: 1, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'rajcica', name: 'Rajčica', aliases: ['tomato', 'rajcica'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 18, protein: 1, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'cherry-rajcica', name: 'Cherry rajčica', aliases: ['cherry tomato', 'cherry tomatoes'],
    category: 'Povrće', source: 'claude',
    nutritionPer100g: { kcal: 18, protein: 1, carbs: 4, fat: 0 },
    availableUnits: ['g', 'kg'],
  },

  // ── Orašasti plodovi ───────────────────────────────────────────────────────
  {
    id: 'kikiriki', name: 'Kikiriki', aliases: ['peanuts', 'groundnuts'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 570, protein: 25, carbs: 16, fat: 50 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'ljesnjak', name: 'Lješnjak', aliases: ['hazelnut', 'hazelnuts', 'ljesnjak'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 630, protein: 14, carbs: 16, fat: 60 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'orah', name: 'Orah', aliases: ['walnut', 'walnuts'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 660, protein: 15, carbs: 13, fat: 65 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'indijski-orah', name: 'Indijski orah', aliases: ['cashew', 'cashews'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 550, protein: 18, carbs: 30, fat: 43 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'pistacio', name: 'Pistachio', aliases: ['pistachios', 'pistacchio'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 560, protein: 20, carbs: 27, fat: 45 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'badem', name: 'Badem', aliases: ['almond', 'almonds hr'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 580, protein: 21, carbs: 21, fat: 50 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },
  {
    id: 'brazilski-orah', name: 'Brazilski orah', aliases: ['brazil nut', 'brazil nuts'],
    category: 'Orašasti plodovi', source: 'claude',
    nutritionPer100g: { kcal: 670, protein: 15, carbs: 13, fat: 68 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 10 },
  },

  // ── Mliječni proizvodi ─────────────────────────────────────────────────────
  {
    id: 'mlijeko-28', name: 'Mlijeko 2,8%', aliases: ['milk 2.8%', 'whole milk hr', 'mlijeko'],
    category: 'Mliječni proizvodi', source: 'claude',
    nutritionPer100g: { kcal: 60, protein: 3, carbs: 5, fat: 3 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1.03, L: 1030 },
  },
  {
    id: 'sojino-mlijeko', name: 'Sojino mlijeko', aliases: ['soy milk', 'soymilk'],
    category: 'Mliječni proizvodi', source: 'claude',
    nutritionPer100g: { kcal: 50, protein: 3, carbs: 5, fat: 2 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1, L: 1000 },
  },
  {
    id: 'probioticki-jogurt', name: 'Probiotički jogurt', aliases: ['probiotic yogurt', 'probioticki jogurt'],
    category: 'Mliječni proizvodi', source: 'claude',
    nutritionPer100g: { kcal: 70, protein: 3, carbs: 5, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'tvrdi-sir', name: 'Tvrdi sir', aliases: ['hard cheese', 'aged cheese'],
    category: 'Mliječni proizvodi', source: 'claude',
    nutritionPer100g: { kcal: 380, protein: 27, carbs: 2, fat: 25 },
    availableUnits: ['g', 'slice'],
    unitOverrides: { slice: 20 },
  },
  {
    id: 'polutvrdi-sir', name: 'Polutvrdi sir', aliases: ['semi-hard cheese'],
    category: 'Mliječni proizvodi', source: 'claude',
    nutritionPer100g: { kcal: 350, protein: 25, carbs: 2, fat: 22 },
    availableUnits: ['g', 'slice'],
    unitOverrides: { slice: 20 },
  },
  {
    id: 'mozzarella-hr', name: 'Mozzarella', aliases: ['mozzarella cheese', 'fresh mozzarella'],
    category: 'Mliječni proizvodi', source: 'claude',
    nutritionPer100g: { kcal: 120, protein: 5, carbs: 1, fat: 10 },
    availableUnits: ['g', 'kg'],
  },

  // ── Dodatni ────────────────────────────────────────────────────────────────
  {
    id: 'proteini-suplement', name: 'Proteini', aliases: ['protein supplement', 'whey proteini'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 390, protein: 83, carbs: 3, fat: 3 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 25 },
  },
  {
    id: 'grcki-jogurt', name: 'Grčki jogurt', aliases: ['greek yogurt hr', 'grcki jogurt'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 100, protein: 7, carbs: 7, fat: 4 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'kikiriki-maslac', name: 'Kikiriki maslac', aliases: ['peanut butter'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 600, protein: 22, carbs: 20, fat: 50 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 16 },
  },
  {
    id: 'borovnice', name: 'Borovnice', aliases: ['blueberries', 'blueberry'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 57, protein: 0, carbs: 10, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'kiseli-krastavci', name: 'Kiseli krastavci', aliases: ['pickles', 'pickled cucumbers'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 11, protein: 1, carbs: 1, fat: 1 },
    availableUnits: ['g', 'kom'],
    unitOverrides: { kom: 40 },
  },
  {
    id: 'buratta', name: 'Buratta', aliases: ['burrata'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 240, protein: 10, carbs: 2, fat: 20 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'polleo-pice', name: 'Polleo piće', aliases: ['polleo drink', 'polleo'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 57, protein: 10, carbs: 3, fat: 0.3 },
    availableUnits: ['ml', 'L'],
    unitOverrides: { ml: 1, L: 1000 },
  },
  {
    id: 'banana-hr', name: 'Banana', aliases: ['banana', 'bananas'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 89, protein: 0, carbs: 23, fat: 0 },
    availableUnits: ['g', 'kom'],
    unitOverrides: { kom: 120 },
  },
  {
    id: 'crveni-luk', name: 'Crveni luk', aliases: ['red onion', 'onion'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 40, protein: 0, carbs: 10, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'pesto', name: 'Pesto', aliases: ['basil pesto', 'pesto genovese'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 482, protein: 5, carbs: 10, fat: 46 },
    availableUnits: ['g', 'tbsp'],
    unitOverrides: { tbsp: 15 },
  },
  {
    id: 'tzatziki-200g', name: 'Tzatziki (200 g)', aliases: ['tzatziki portion', 'tzatziki'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 232, protein: 16, carbs: 22, fat: 8 },
    availableUnits: ['kom', 'g'],
    unitOverrides: { kom: 100 },
  },
  {
    id: '200g-jogurta', name: '200 g jogurta', aliases: ['yogurt portion 200g'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 200, protein: 14, carbs: 14, fat: 8 },
    availableUnits: ['kom', 'g'],
    unitOverrides: { kom: 100 },
  },
  {
    id: '200g-krastavaca', name: '200 g krastavaca', aliases: ['cucumber portion 200g'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 32, protein: 2, carbs: 8, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'proteinski-puding', name: 'Proteinski puding', aliases: ['protein pudding'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 81, protein: 10, carbs: 7, fat: 2 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'maline', name: 'Maline', aliases: ['raspberries', 'raspberry'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 50, protein: 0, carbs: 10, fat: 0 },
    availableUnits: ['g', 'kg'],
  },
  {
    id: 'grozde-bijelo', name: 'Grozde bijelo', aliases: ['white grapes', 'grapes'],
    category: 'Dodatni', source: 'claude',
    nutritionPer100g: { kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 },
    availableUnits: ['g', 'kg'],
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

export function findFoodById(id) {
  return foodDatabase.find(f => f.id === id);
}

export function findFoodByName(query) {
  const q = query.toLowerCase().trim();
  return foodDatabase.find(f =>
    f.name.toLowerCase() === q ||
    f.aliases.some(a => a.toLowerCase() === q)
  );
}

export function searchFoods(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();

  const scored = foodDatabase.map(food => {
    const name = food.name.toLowerCase();
    let score = 0;
    if (name === q) score = 10;
    else if (name.startsWith(q)) score = 5;
    else if (name.includes(q)) score = 2;
    else if (food.aliases.some(a => a.toLowerCase().includes(q))) score = 1;
    return { food, score };
  }).filter(x => x.score > 0);

  return scored.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.food);
}

export const FOOD_CATEGORIES = [
  'Beverages', 'Dairy', 'Eggs', 'Meat & Fish',
  'Grains & Bread', 'Vegetables', 'Fruits',
  'Oils & Condiments', 'Nuts & Seeds',
  'Proteini', 'Ugljikohidrati', 'Povrće',
  'Orašasti plodovi', 'Mliječni proizvodi', 'Dodatni',
];
