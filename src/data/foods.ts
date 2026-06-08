import { Food } from '@/models/types';
import { mergeById } from '@/utils/merge';

/**
 * Curated, offline food database spanning global staples and cuisines. Macros
 * are per single serving (rounded). This is the local-first bundled source;
 * users extend/override it with custom foods, and it can later be swapped for
 * the backend food DB behind the same `Food` shape.
 */
export const FOODS: Food[] = [
  // ── Protein: meat, fish, eggs, plant ───────────────────────────────
  { id: 'f_chicken_breast', name: 'Chicken breast, grilled', serving: '100 g', calories: 165, protein: 31, carbs: 0, fat: 4, category: 'protein' },
  { id: 'f_chicken_thigh', name: 'Chicken thigh, roasted', serving: '100 g', calories: 209, protein: 26, carbs: 0, fat: 11, category: 'protein' },
  { id: 'f_salmon', name: 'Salmon, baked', serving: '100 g', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'protein' },
  { id: 'f_tuna', name: 'Tuna, canned in water', serving: '100 g', calories: 116, protein: 26, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_cod', name: 'Cod, baked', serving: '100 g', calories: 105, protein: 23, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_egg', name: 'Egg, large', serving: '1 egg', calories: 72, protein: 6, carbs: 0, fat: 5, category: 'protein' },
  { id: 'f_egg_whites', name: 'Egg whites', serving: '1 cup', calories: 126, protein: 26, carbs: 2, fat: 0, category: 'protein' },
  { id: 'f_ground_beef', name: 'Ground beef, 90% lean', serving: '100 g', calories: 176, protein: 20, carbs: 0, fat: 10, category: 'protein' },
  { id: 'f_steak', name: 'Sirloin steak', serving: '100 g', calories: 206, protein: 27, carbs: 0, fat: 10, category: 'protein' },
  { id: 'f_pork_chop', name: 'Pork chop', serving: '100 g', calories: 231, protein: 26, carbs: 0, fat: 14, category: 'protein' },
  { id: 'f_bacon', name: 'Bacon', serving: '2 slices', calories: 92, protein: 6, carbs: 0, fat: 7, category: 'protein' },
  { id: 'f_turkey', name: 'Turkey breast', serving: '100 g', calories: 135, protein: 30, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_shrimp', name: 'Shrimp, cooked', serving: '100 g', calories: 99, protein: 24, carbs: 0, fat: 1, category: 'protein' },
  { id: 'f_tofu', name: 'Tofu, firm', serving: '100 g', calories: 144, protein: 17, carbs: 3, fat: 9, category: 'protein' },
  { id: 'f_tempeh', name: 'Tempeh', serving: '100 g', calories: 192, protein: 20, carbs: 8, fat: 11, category: 'protein' },
  { id: 'f_seitan', name: 'Seitan', serving: '100 g', calories: 143, protein: 25, carbs: 14, fat: 2, category: 'protein' },
  { id: 'f_whey', name: 'Whey protein scoop', serving: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1, category: 'protein' },
  { id: 'f_lentils', name: 'Lentils, cooked', serving: '1 cup', calories: 230, protein: 18, carbs: 40, fat: 1, category: 'protein' },
  { id: 'f_chickpeas', name: 'Chickpeas, cooked', serving: '1 cup', calories: 269, protein: 15, carbs: 45, fat: 4, category: 'protein' },
  { id: 'f_black_beans', name: 'Black beans, cooked', serving: '1 cup', calories: 227, protein: 15, carbs: 41, fat: 1, category: 'protein' },
  { id: 'f_kidney_beans', name: 'Kidney beans, cooked', serving: '1 cup', calories: 225, protein: 15, carbs: 40, fat: 1, category: 'protein' },
  { id: 'f_edamame', name: 'Edamame', serving: '1 cup', calories: 188, protein: 18, carbs: 14, fat: 8, category: 'protein' },

  // ── Carbs / grains ────────────────────────────────────────────────
  { id: 'f_white_rice', name: 'White rice, cooked', serving: '1 cup', calories: 205, protein: 4, carbs: 45, fat: 0, category: 'carb' },
  { id: 'f_brown_rice', name: 'Brown rice, cooked', serving: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, category: 'carb' },
  { id: 'f_basmati', name: 'Basmati rice, cooked', serving: '1 cup', calories: 210, protein: 4, carbs: 46, fat: 0, category: 'carb' },
  { id: 'f_quinoa', name: 'Quinoa, cooked', serving: '1 cup', calories: 222, protein: 8, carbs: 39, fat: 4, category: 'carb' },
  { id: 'f_oats', name: 'Oats, dry', serving: '1/2 cup', calories: 150, protein: 5, carbs: 27, fat: 3, category: 'carb' },
  { id: 'f_pasta', name: 'Pasta, cooked', serving: '1 cup', calories: 221, protein: 8, carbs: 43, fat: 1, category: 'carb' },
  { id: 'f_couscous', name: 'Couscous, cooked', serving: '1 cup', calories: 176, protein: 6, carbs: 36, fat: 0, category: 'carb' },
  { id: 'f_bread', name: 'Whole wheat bread', serving: '1 slice', calories: 80, protein: 4, carbs: 14, fat: 1, category: 'carb' },
  { id: 'f_white_bread', name: 'White bread', serving: '1 slice', calories: 75, protein: 2, carbs: 14, fat: 1, category: 'carb' },
  { id: 'f_bagel', name: 'Bagel, plain', serving: '1 bagel', calories: 245, protein: 10, carbs: 48, fat: 2, category: 'carb' },
  { id: 'f_roti', name: 'Roti / chapati', serving: '1 piece', calories: 120, protein: 3, carbs: 18, fat: 4, category: 'carb' },
  { id: 'f_naan', name: 'Naan', serving: '1 piece', calories: 260, protein: 9, carbs: 45, fat: 5, category: 'carb' },
  { id: 'f_tortilla', name: 'Flour tortilla', serving: '1 medium', calories: 140, protein: 4, carbs: 24, fat: 4, category: 'carb' },
  { id: 'f_corn_tortilla', name: 'Corn tortilla', serving: '1 small', calories: 52, protein: 1, carbs: 11, fat: 1, category: 'carb' },
  { id: 'f_sweet_potato', name: 'Sweet potato, baked', serving: '1 medium', calories: 112, protein: 2, carbs: 26, fat: 0, category: 'carb' },
  { id: 'f_potato', name: 'Potato, baked', serving: '1 medium', calories: 161, protein: 4, carbs: 37, fat: 0, category: 'carb' },
  { id: 'f_noodles', name: 'Rice noodles, cooked', serving: '1 cup', calories: 192, protein: 3, carbs: 44, fat: 0, category: 'carb' },
  { id: 'f_cereal', name: 'Breakfast cereal', serving: '1 cup', calories: 130, protein: 3, carbs: 28, fat: 2, category: 'carb' },

  // ── Vegetables ────────────────────────────────────────────────────
  { id: 'f_broccoli', name: 'Broccoli, steamed', serving: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 1, category: 'veg' },
  { id: 'f_cauliflower', name: 'Cauliflower', serving: '1 cup', calories: 27, protein: 2, carbs: 5, fat: 0, category: 'veg' },
  { id: 'f_spinach', name: 'Spinach, raw', serving: '1 cup', calories: 7, protein: 1, carbs: 1, fat: 0, category: 'veg' },
  { id: 'f_kale', name: 'Kale', serving: '1 cup', calories: 33, protein: 3, carbs: 6, fat: 1, category: 'veg' },
  { id: 'f_mixed_greens', name: 'Mixed salad greens', serving: '2 cups', calories: 15, protein: 1, carbs: 3, fat: 0, category: 'veg' },
  { id: 'f_carrot', name: 'Carrot', serving: '1 medium', calories: 25, protein: 1, carbs: 6, fat: 0, category: 'veg' },
  { id: 'f_bell_pepper', name: 'Bell pepper', serving: '1 medium', calories: 31, protein: 1, carbs: 7, fat: 0, category: 'veg' },
  { id: 'f_tomato', name: 'Tomato', serving: '1 medium', calories: 22, protein: 1, carbs: 5, fat: 0, category: 'veg' },
  { id: 'f_cucumber', name: 'Cucumber', serving: '1 cup', calories: 16, protein: 1, carbs: 4, fat: 0, category: 'veg' },
  { id: 'f_zucchini', name: 'Zucchini', serving: '1 cup', calories: 20, protein: 1, carbs: 4, fat: 0, category: 'veg' },
  { id: 'f_mushroom', name: 'Mushrooms', serving: '1 cup', calories: 15, protein: 2, carbs: 2, fat: 0, category: 'veg' },
  { id: 'f_onion', name: 'Onion', serving: '1 medium', calories: 44, protein: 1, carbs: 10, fat: 0, category: 'veg' },
  { id: 'f_avocado', name: 'Avocado', serving: '1/2 fruit', calories: 120, protein: 1, carbs: 6, fat: 11, category: 'veg' },
  { id: 'f_corn', name: 'Sweet corn', serving: '1 cup', calories: 132, protein: 5, carbs: 29, fat: 2, category: 'veg' },
  { id: 'f_peas', name: 'Green peas', serving: '1 cup', calories: 118, protein: 8, carbs: 21, fat: 0, category: 'veg' },

  // ── Fruit ─────────────────────────────────────────────────────────
  { id: 'f_banana', name: 'Banana', serving: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0, category: 'fruit' },
  { id: 'f_apple', name: 'Apple', serving: '1 medium', calories: 95, protein: 1, carbs: 25, fat: 0, category: 'fruit' },
  { id: 'f_blueberries', name: 'Blueberries', serving: '1 cup', calories: 84, protein: 1, carbs: 21, fat: 0, category: 'fruit' },
  { id: 'f_strawberries', name: 'Strawberries', serving: '1 cup', calories: 49, protein: 1, carbs: 12, fat: 0, category: 'fruit' },
  { id: 'f_orange', name: 'Orange', serving: '1 medium', calories: 62, protein: 1, carbs: 15, fat: 0, category: 'fruit' },
  { id: 'f_grapes', name: 'Grapes', serving: '1 cup', calories: 104, protein: 1, carbs: 27, fat: 0, category: 'fruit' },
  { id: 'f_mango', name: 'Mango', serving: '1 cup', calories: 99, protein: 1, carbs: 25, fat: 1, category: 'fruit' },
  { id: 'f_pineapple', name: 'Pineapple', serving: '1 cup', calories: 82, protein: 1, carbs: 22, fat: 0, category: 'fruit' },
  { id: 'f_watermelon', name: 'Watermelon', serving: '1 cup', calories: 46, protein: 1, carbs: 12, fat: 0, category: 'fruit' },
  { id: 'f_pear', name: 'Pear', serving: '1 medium', calories: 101, protein: 1, carbs: 27, fat: 0, category: 'fruit' },
  { id: 'f_dates', name: 'Dates', serving: '2 pieces', calories: 133, protein: 1, carbs: 36, fat: 0, category: 'fruit' },

  // ── Dairy ─────────────────────────────────────────────────────────
  { id: 'f_greek_yogurt', name: 'Greek yogurt, plain', serving: '1 cup', calories: 130, protein: 22, carbs: 8, fat: 1, category: 'dairy' },
  { id: 'f_yogurt', name: 'Yogurt, plain', serving: '1 cup', calories: 149, protein: 9, carbs: 11, fat: 8, category: 'dairy' },
  { id: 'f_milk', name: 'Milk, 2%', serving: '1 cup', calories: 122, protein: 8, carbs: 12, fat: 5, category: 'dairy' },
  { id: 'f_almond_milk', name: 'Almond milk, unsweetened', serving: '1 cup', calories: 30, protein: 1, carbs: 1, fat: 3, category: 'dairy' },
  { id: 'f_cheddar', name: 'Cheddar cheese', serving: '1 slice', calories: 113, protein: 7, carbs: 0, fat: 9, category: 'dairy' },
  { id: 'f_mozzarella', name: 'Mozzarella', serving: '1 oz', calories: 85, protein: 6, carbs: 1, fat: 6, category: 'dairy' },
  { id: 'f_paneer', name: 'Paneer', serving: '100 g', calories: 265, protein: 18, carbs: 1, fat: 21, category: 'dairy' },
  { id: 'f_cottage_cheese', name: 'Cottage cheese', serving: '1 cup', calories: 206, protein: 28, carbs: 8, fat: 9, category: 'dairy' },
  { id: 'f_butter', name: 'Butter', serving: '1 tbsp', calories: 102, protein: 0, carbs: 0, fat: 12, category: 'dairy' },

  // ── Fats / nuts ───────────────────────────────────────────────────
  { id: 'f_almonds', name: 'Almonds', serving: '1 oz', calories: 164, protein: 6, carbs: 6, fat: 14, category: 'fat' },
  { id: 'f_peanut_butter', name: 'Peanut butter', serving: '2 tbsp', calories: 188, protein: 8, carbs: 6, fat: 16, category: 'fat' },
  { id: 'f_olive_oil', name: 'Olive oil', serving: '1 tbsp', calories: 119, protein: 0, carbs: 0, fat: 14, category: 'fat' },
  { id: 'f_walnuts', name: 'Walnuts', serving: '1 oz', calories: 185, protein: 4, carbs: 4, fat: 18, category: 'fat' },
  { id: 'f_cashews', name: 'Cashews', serving: '1 oz', calories: 157, protein: 5, carbs: 9, fat: 12, category: 'fat' },
  { id: 'f_chia', name: 'Chia seeds', serving: '1 tbsp', calories: 58, protein: 2, carbs: 5, fat: 4, category: 'fat' },
  { id: 'f_coconut_oil', name: 'Coconut oil', serving: '1 tbsp', calories: 121, protein: 0, carbs: 0, fat: 13, category: 'fat' },

  // ── Drinks ────────────────────────────────────────────────────────
  { id: 'f_coffee', name: 'Coffee, black', serving: '1 cup', calories: 2, protein: 0, carbs: 0, fat: 0, category: 'drink' },
  { id: 'f_latte', name: 'Caffè latte', serving: '1 medium', calories: 190, protein: 12, carbs: 19, fat: 7, category: 'drink' },
  { id: 'f_orange_juice', name: 'Orange juice', serving: '1 cup', calories: 112, protein: 2, carbs: 26, fat: 0, category: 'drink' },
  { id: 'f_protein_shake', name: 'Protein shake', serving: '1 bottle', calories: 160, protein: 30, carbs: 5, fat: 3, category: 'drink' },
  { id: 'f_smoothie', name: 'Fruit smoothie', serving: '1 cup', calories: 180, protein: 4, carbs: 38, fat: 2, category: 'drink' },
  { id: 'f_beer', name: 'Beer', serving: '1 can', calories: 153, protein: 2, carbs: 13, fat: 0, category: 'drink' },
  { id: 'f_wine', name: 'Red wine', serving: '1 glass', calories: 125, protein: 0, carbs: 4, fat: 0, category: 'drink' },

  // ── Snacks ────────────────────────────────────────────────────────
  { id: 'f_protein_bar', name: 'Protein bar', serving: '1 bar', calories: 210, protein: 20, carbs: 22, fat: 7, category: 'snack' },
  { id: 'f_dark_chocolate', name: 'Dark chocolate', serving: '1 oz', calories: 170, protein: 2, carbs: 13, fat: 12, category: 'snack' },
  { id: 'f_hummus', name: 'Hummus', serving: '2 tbsp', calories: 70, protein: 2, carbs: 6, fat: 5, category: 'snack' },
  { id: 'f_chips', name: 'Potato chips', serving: '1 oz', calories: 152, protein: 2, carbs: 15, fat: 10, category: 'snack' },
  { id: 'f_popcorn', name: 'Popcorn, air-popped', serving: '3 cups', calories: 93, protein: 3, carbs: 19, fat: 1, category: 'snack' },
  { id: 'f_granola_bar', name: 'Granola bar', serving: '1 bar', calories: 132, protein: 3, carbs: 18, fat: 5, category: 'snack' },
  { id: 'f_trail_mix', name: 'Trail mix', serving: '1/4 cup', calories: 175, protein: 5, carbs: 16, fat: 11, category: 'snack' },

  // ── Prepared meals & world cuisine ────────────────────────────────
  { id: 'f_chicken_salad', name: 'Grilled chicken salad', serving: '1 bowl', calories: 350, protein: 35, carbs: 18, fat: 15, category: 'meal' },
  { id: 'f_burrito_bowl', name: 'Burrito bowl', serving: '1 bowl', calories: 650, protein: 40, carbs: 70, fat: 22, category: 'meal' },
  { id: 'f_oatmeal_banana', name: 'Oatmeal with banana', serving: '1 bowl', calories: 320, protein: 9, carbs: 60, fat: 6, category: 'meal' },
  { id: 'f_chicken_curry', name: 'Chicken curry', serving: '1 cup', calories: 290, protein: 24, carbs: 10, fat: 17, category: 'meal' },
  { id: 'f_dal', name: 'Dal (lentil curry)', serving: '1 cup', calories: 180, protein: 12, carbs: 25, fat: 4, category: 'meal' },
  { id: 'f_paneer_tikka', name: 'Paneer tikka', serving: '1 plate', calories: 330, protein: 18, carbs: 12, fat: 24, category: 'meal' },
  { id: 'f_biryani', name: 'Chicken biryani', serving: '1 plate', calories: 480, protein: 24, carbs: 60, fat: 16, category: 'meal' },
  { id: 'f_sushi_roll', name: 'Sushi roll', serving: '6 pieces', calories: 255, protein: 9, carbs: 38, fat: 7, category: 'meal' },
  { id: 'f_pad_thai', name: 'Pad thai', serving: '1 plate', calories: 540, protein: 20, carbs: 70, fat: 18, category: 'meal' },
  { id: 'f_fried_rice', name: 'Fried rice', serving: '1 cup', calories: 333, protein: 12, carbs: 42, fat: 12, category: 'meal' },
  { id: 'f_ramen', name: 'Ramen', serving: '1 bowl', calories: 436, protein: 18, carbs: 54, fat: 16, category: 'meal' },
  { id: 'f_pizza', name: 'Pizza, cheese', serving: '1 slice', calories: 285, protein: 12, carbs: 36, fat: 10, category: 'meal' },
  { id: 'f_spaghetti', name: 'Spaghetti bolognese', serving: '1 plate', calories: 520, protein: 24, carbs: 65, fat: 18, category: 'meal' },
  { id: 'f_burger', name: 'Cheeseburger', serving: '1 burger', calories: 535, protein: 28, carbs: 40, fat: 28, category: 'meal' },
  { id: 'f_taco', name: 'Taco', serving: '1 taco', calories: 170, protein: 9, carbs: 13, fat: 9, category: 'meal' },
  { id: 'f_falafel_wrap', name: 'Falafel wrap', serving: '1 wrap', calories: 420, protein: 14, carbs: 52, fat: 18, category: 'meal' },
  { id: 'f_greek_bowl', name: 'Greek chicken bowl', serving: '1 bowl', calories: 450, protein: 38, carbs: 35, fat: 18, category: 'meal' },
  { id: 'f_pho', name: 'Pho', serving: '1 bowl', calories: 350, protein: 25, carbs: 45, fat: 6, category: 'meal' },
  { id: 'f_omelette', name: 'Veggie omelette', serving: '3 eggs', calories: 290, protein: 20, carbs: 6, fat: 21, category: 'meal' },
  { id: 'f_pancakes', name: 'Pancakes', serving: '3 pancakes', calories: 350, protein: 8, carbs: 58, fat: 9, category: 'meal' },
];

/**
 * Effective food list = bundled, with admin CMS foods layered on, then the
 * user's own custom foods (which win on id collisions).
 */
export function mergeFoods(custom: Food[] = [], cms: Food[] = []): Food[] {
  return mergeById(FOODS, [cms, custom]);
}

export function foodsById(foods: Food[]): Record<string, Food> {
  return Object.fromEntries(foods.map((f) => [f.id, f]));
}

export const FOODS_BY_ID: Record<string, Food> = foodsById(FOODS);

/** Case-insensitive search over a provided food list (defaults to bundled). */
export function searchFoods(query: string, foods: Food[] = FOODS, limit = 40): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return foods.slice(0, limit);
  const scored = foods
    .map((f) => {
      const name = f.name.toLowerCase();
      let score = -1;
      if (name.startsWith(q)) score = 0;
      else if (name.includes(q)) score = 1;
      else if ((f.brand ?? '').toLowerCase().includes(q)) score = 2;
      return { f, score };
    })
    .filter((s) => s.score >= 0);
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.f);
}
