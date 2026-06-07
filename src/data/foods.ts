import { Food } from '@/models/types';

/**
 * Curated, offline food database. Macros are per single serving (rounded).
 * This is the local-first source; it can be swapped for the backend food DB
 * later behind the same `Food` shape without touching the UI.
 */
export const FOODS: Food[] = [
  // Protein
  { id: 'f_chicken_breast', name: 'Chicken breast, grilled', serving: '100 g', calories: 165, protein: 31, carbs: 0, fat: 4, category: 'protein' },
  { id: 'f_salmon', name: 'Salmon, baked', serving: '100 g', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'protein' },
  { id: 'f_tuna', name: 'Tuna, canned in water', serving: '100 g', calories: 116, protein: 26, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_egg', name: 'Egg, large', serving: '1 egg', calories: 72, protein: 6, carbs: 0, fat: 5, category: 'protein' },
  { id: 'f_egg_whites', name: 'Egg whites', serving: '1 cup', calories: 126, protein: 26, carbs: 2, fat: 0, category: 'protein' },
  { id: 'f_ground_beef', name: 'Ground beef, 90% lean', serving: '100 g', calories: 176, protein: 20, carbs: 0, fat: 10, category: 'protein' },
  { id: 'f_turkey', name: 'Turkey breast', serving: '100 g', calories: 135, protein: 30, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_shrimp', name: 'Shrimp, cooked', serving: '100 g', calories: 99, protein: 24, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_tofu', name: 'Tofu, firm', serving: '100 g', calories: 144, protein: 17, carbs: 3, fat: 9, category: 'protein' },
  { id: 'f_tempeh', name: 'Tempeh', serving: '100 g', calories: 192, protein: 20, carbs: 8, fat: 11, category: 'protein' },
  { id: 'f_whey', name: 'Whey protein scoop', serving: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1, category: 'protein' },
  { id: 'f_lentils', name: 'Lentils, cooked', serving: '1 cup', calories: 230, protein: 18, carbs: 40, fat: 1, category: 'protein' },
  { id: 'f_chickpeas', name: 'Chickpeas, cooked', serving: '1 cup', calories: 269, protein: 15, carbs: 45, fat: 4, category: 'protein' },
  { id: 'f_black_beans', name: 'Black beans, cooked', serving: '1 cup', calories: 227, protein: 15, carbs: 41, fat: 1, category: 'protein' },

  // Carbs / grains
  { id: 'f_white_rice', name: 'White rice, cooked', serving: '1 cup', calories: 205, protein: 4, carbs: 45, fat: 0, category: 'carb' },
  { id: 'f_brown_rice', name: 'Brown rice, cooked', serving: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, category: 'carb' },
  { id: 'f_quinoa', name: 'Quinoa, cooked', serving: '1 cup', calories: 222, protein: 8, carbs: 39, fat: 4, category: 'carb' },
  { id: 'f_oats', name: 'Oats, dry', serving: '1/2 cup', calories: 150, protein: 5, carbs: 27, fat: 3, category: 'carb' },
  { id: 'f_pasta', name: 'Pasta, cooked', serving: '1 cup', calories: 221, protein: 8, carbs: 43, fat: 1, category: 'carb' },
  { id: 'f_bread', name: 'Whole wheat bread', serving: '1 slice', calories: 80, protein: 4, carbs: 14, fat: 1, category: 'carb' },
  { id: 'f_bagel', name: 'Bagel, plain', serving: '1 bagel', calories: 245, protein: 10, carbs: 48, fat: 2, category: 'carb' },
  { id: 'f_sweet_potato', name: 'Sweet potato, baked', serving: '1 medium', calories: 112, protein: 2, carbs: 26, fat: 0, category: 'carb' },
  { id: 'f_potato', name: 'Potato, baked', serving: '1 medium', calories: 161, protein: 4, carbs: 37, fat: 0, category: 'carb' },
  { id: 'f_tortilla', name: 'Flour tortilla', serving: '1 medium', calories: 140, protein: 4, carbs: 24, fat: 4, category: 'carb' },

  // Vegetables
  { id: 'f_broccoli', name: 'Broccoli, steamed', serving: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 1, category: 'veg' },
  { id: 'f_spinach', name: 'Spinach, raw', serving: '1 cup', calories: 7, protein: 1, carbs: 1, fat: 0, category: 'veg' },
  { id: 'f_mixed_greens', name: 'Mixed salad greens', serving: '2 cups', calories: 15, protein: 1, carbs: 3, fat: 0, category: 'veg' },
  { id: 'f_carrot', name: 'Carrot', serving: '1 medium', calories: 25, protein: 1, carbs: 6, fat: 0, category: 'veg' },
  { id: 'f_bell_pepper', name: 'Bell pepper', serving: '1 medium', calories: 31, protein: 1, carbs: 7, fat: 0, category: 'veg' },
  { id: 'f_tomato', name: 'Tomato', serving: '1 medium', calories: 22, protein: 1, carbs: 5, fat: 0, category: 'veg' },
  { id: 'f_cucumber', name: 'Cucumber', serving: '1 cup', calories: 16, protein: 1, carbs: 4, fat: 0, category: 'veg' },
  { id: 'f_avocado', name: 'Avocado', serving: '1/2 fruit', calories: 120, protein: 1, carbs: 6, fat: 11, category: 'veg' },

  // Fruit
  { id: 'f_banana', name: 'Banana', serving: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0, category: 'fruit' },
  { id: 'f_apple', name: 'Apple', serving: '1 medium', calories: 95, protein: 1, carbs: 25, fat: 0, category: 'fruit' },
  { id: 'f_blueberries', name: 'Blueberries', serving: '1 cup', calories: 84, protein: 1, carbs: 21, fat: 0, category: 'fruit' },
  { id: 'f_strawberries', name: 'Strawberries', serving: '1 cup', calories: 49, protein: 1, carbs: 12, fat: 0, category: 'fruit' },
  { id: 'f_orange', name: 'Orange', serving: '1 medium', calories: 62, protein: 1, carbs: 15, fat: 0, category: 'fruit' },
  { id: 'f_grapes', name: 'Grapes', serving: '1 cup', calories: 104, protein: 1, carbs: 27, fat: 0, category: 'fruit' },

  // Dairy
  { id: 'f_greek_yogurt', name: 'Greek yogurt, plain', serving: '1 cup', calories: 130, protein: 22, carbs: 8, fat: 1, category: 'dairy' },
  { id: 'f_milk', name: 'Milk, 2%', serving: '1 cup', calories: 122, protein: 8, carbs: 12, fat: 5, category: 'dairy' },
  { id: 'f_almond_milk', name: 'Almond milk, unsweetened', serving: '1 cup', calories: 30, protein: 1, carbs: 1, fat: 3, category: 'dairy' },
  { id: 'f_cheddar', name: 'Cheddar cheese', serving: '1 slice', calories: 113, protein: 7, carbs: 0, fat: 9, category: 'dairy' },
  { id: 'f_cottage_cheese', name: 'Cottage cheese', serving: '1 cup', calories: 206, protein: 28, carbs: 8, fat: 9, category: 'dairy' },

  // Fats / nuts
  { id: 'f_almonds', name: 'Almonds', serving: '1 oz', calories: 164, protein: 6, carbs: 6, fat: 14, category: 'fat' },
  { id: 'f_peanut_butter', name: 'Peanut butter', serving: '2 tbsp', calories: 188, protein: 8, carbs: 6, fat: 16, category: 'fat' },
  { id: 'f_olive_oil', name: 'Olive oil', serving: '1 tbsp', calories: 119, protein: 0, carbs: 0, fat: 14, category: 'fat' },
  { id: 'f_walnuts', name: 'Walnuts', serving: '1 oz', calories: 185, protein: 4, carbs: 4, fat: 18, category: 'fat' },
  { id: 'f_chia', name: 'Chia seeds', serving: '1 tbsp', calories: 58, protein: 2, carbs: 5, fat: 4, category: 'fat' },

  // Drinks
  { id: 'f_coffee', name: 'Coffee, black', serving: '1 cup', calories: 2, protein: 0, carbs: 0, fat: 0, category: 'drink' },
  { id: 'f_orange_juice', name: 'Orange juice', serving: '1 cup', calories: 112, protein: 2, carbs: 26, fat: 0, category: 'drink' },
  { id: 'f_protein_shake', name: 'Protein shake', serving: '1 bottle', calories: 160, protein: 30, carbs: 5, fat: 3, category: 'drink' },

  // Snacks / prepared
  { id: 'f_protein_bar', name: 'Protein bar', serving: '1 bar', calories: 210, protein: 20, carbs: 22, fat: 7, category: 'snack' },
  { id: 'f_dark_chocolate', name: 'Dark chocolate', serving: '1 oz', calories: 170, protein: 2, carbs: 13, fat: 12, category: 'snack' },
  { id: 'f_hummus', name: 'Hummus', serving: '2 tbsp', calories: 70, protein: 2, carbs: 6, fat: 5, category: 'snack' },
  { id: 'f_chicken_salad', name: 'Grilled chicken salad', serving: '1 bowl', calories: 350, protein: 35, carbs: 18, fat: 15, category: 'meal' },
  { id: 'f_burrito_bowl', name: 'Burrito bowl', serving: '1 bowl', calories: 650, protein: 40, carbs: 70, fat: 22, category: 'meal' },
  { id: 'f_oatmeal_banana', name: 'Oatmeal with banana', serving: '1 bowl', calories: 320, protein: 9, carbs: 60, fat: 6, category: 'meal' },
];

export const FOODS_BY_ID: Record<string, Food> = Object.fromEntries(
  FOODS.map((f) => [f.id, f]),
);

/** Case-insensitive search over food name + brand. */
export function searchFoods(query: string, limit = 30): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS.slice(0, limit);
  const scored = FOODS.map((f) => {
    const name = f.name.toLowerCase();
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (name.includes(q)) score = 1;
    else if ((f.brand ?? '').toLowerCase().includes(q)) score = 2;
    return { f, score };
  }).filter((s) => s.score >= 0);
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.f);
}
