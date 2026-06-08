import { Recipe } from '@/models/types';
import { mergeById } from '@/utils/merge';

/**
 * Offline recipe library for the meal planner. Macros are per serving.
 * Each recipe is tagged with the diet patterns it satisfies and the meal
 * slots it suits, which drives plan generation and filtering.
 */
export const RECIPES: Recipe[] = [
  // ── Breakfast ──────────────────────────────────────────────────────
  {
    id: 'r_oats_pb_banana', name: 'Peanut butter banana oats', emoji: '🥣',
    mealTypes: ['breakfast'], diets: ['balanced', 'vegetarian', 'mediterranean'], timeMin: 10,
    calories: 420, protein: 15, carbs: 62, fat: 14,
    ingredients: [{ name: 'Rolled oats', quantity: '1/2 cup' }, { name: 'Banana', quantity: '1' }, { name: 'Peanut butter', quantity: '1 tbsp' }, { name: 'Milk', quantity: '1 cup' }],
    steps: ['Cook oats with milk until creamy.', 'Top with sliced banana and peanut butter.'],
  },
  {
    id: 'r_greek_yogurt_bowl', name: 'Greek yogurt protein bowl', emoji: '🍓',
    mealTypes: ['breakfast', 'snack'], diets: ['balanced', 'high_protein', 'vegetarian'], timeMin: 5,
    calories: 330, protein: 30, carbs: 35, fat: 6,
    ingredients: [{ name: 'Greek yogurt', quantity: '1 cup' }, { name: 'Blueberries', quantity: '1/2 cup' }, { name: 'Honey', quantity: '1 tsp' }, { name: 'Almonds', quantity: '10' }],
    steps: ['Spoon yogurt into a bowl.', 'Top with berries, almonds, and honey.'],
  },
  {
    id: 'r_veggie_omelette', name: 'Veggie omelette', emoji: '🍳',
    mealTypes: ['breakfast'], diets: ['balanced', 'high_protein', 'keto', 'low_carb', 'vegetarian'], timeMin: 12,
    calories: 310, protein: 22, carbs: 6, fat: 22,
    ingredients: [{ name: 'Eggs', quantity: '3' }, { name: 'Bell pepper', quantity: '1/2' }, { name: 'Spinach', quantity: '1 cup' }, { name: 'Cheddar cheese', quantity: '1 slice' }],
    steps: ['Whisk eggs, pour into a hot pan.', 'Add veggies and cheese, fold and cook through.'],
  },
  {
    id: 'r_avocado_toast', name: 'Avocado toast & eggs', emoji: '🥑',
    mealTypes: ['breakfast'], diets: ['balanced', 'mediterranean', 'vegetarian'], timeMin: 10,
    calories: 390, protein: 18, carbs: 30, fat: 22,
    ingredients: [{ name: 'Whole wheat bread', quantity: '2 slices' }, { name: 'Avocado', quantity: '1/2' }, { name: 'Eggs', quantity: '2' }],
    steps: ['Toast bread and mash avocado on top.', 'Fry eggs and place on toast; season.'],
  },
  {
    id: 'r_tofu_scramble', name: 'Tofu scramble', emoji: '🍳',
    mealTypes: ['breakfast'], diets: ['vegan', 'vegetarian', 'high_protein', 'low_carb'], timeMin: 12,
    calories: 300, protein: 22, carbs: 12, fat: 18,
    ingredients: [{ name: 'Firm tofu', quantity: '150 g' }, { name: 'Turmeric', quantity: '1 tsp' }, { name: 'Spinach', quantity: '1 cup' }, { name: 'Olive oil', quantity: '1 tbsp' }],
    steps: ['Crumble tofu into a hot oiled pan.', 'Add turmeric and spinach; cook 5 min.'],
  },

  // ── Lunch ──────────────────────────────────────────────────────────
  {
    id: 'r_chicken_rice_bowl', name: 'Chicken & rice power bowl', emoji: '🍱',
    mealTypes: ['lunch', 'dinner'], diets: ['balanced', 'high_protein'], timeMin: 20,
    calories: 550, protein: 45, carbs: 55, fat: 14,
    ingredients: [{ name: 'Chicken breast', quantity: '150 g' }, { name: 'Brown rice', quantity: '1 cup' }, { name: 'Broccoli', quantity: '1 cup' }, { name: 'Olive oil', quantity: '1 tbsp' }],
    steps: ['Grill seasoned chicken.', 'Serve over rice with steamed broccoli.'],
  },
  {
    id: 'r_greek_salad', name: 'Greek chicken salad', emoji: '🥗',
    mealTypes: ['lunch', 'dinner'], diets: ['balanced', 'high_protein', 'low_carb', 'mediterranean'], timeMin: 15,
    calories: 450, protein: 38, carbs: 18, fat: 26,
    ingredients: [{ name: 'Chicken breast', quantity: '120 g' }, { name: 'Mixed greens', quantity: '2 cups' }, { name: 'Feta cheese', quantity: '30 g' }, { name: 'Olive oil', quantity: '1 tbsp' }, { name: 'Cucumber', quantity: '1/2' }],
    steps: ['Grill and slice chicken.', 'Toss greens, cucumber, feta; add chicken and dressing.'],
  },
  {
    id: 'r_burrito_bowl', name: 'Burrito bowl', emoji: '🌯',
    mealTypes: ['lunch', 'dinner'], diets: ['balanced', 'high_protein', 'vegetarian'], timeMin: 20,
    calories: 620, protein: 32, carbs: 72, fat: 22,
    ingredients: [{ name: 'Black beans', quantity: '1 cup' }, { name: 'White rice', quantity: '1 cup' }, { name: 'Avocado', quantity: '1/2' }, { name: 'Salsa', quantity: '1/4 cup' }, { name: 'Cheddar cheese', quantity: '1 slice' }],
    steps: ['Layer rice and warmed beans in a bowl.', 'Top with avocado, salsa, and cheese.'],
  },
  {
    id: 'r_lentil_soup', name: 'Hearty lentil soup', emoji: '🍲',
    mealTypes: ['lunch', 'dinner'], diets: ['vegan', 'vegetarian', 'balanced', 'mediterranean'], timeMin: 30,
    calories: 360, protein: 20, carbs: 52, fat: 6,
    ingredients: [{ name: 'Lentils', quantity: '1 cup' }, { name: 'Carrot', quantity: '1' }, { name: 'Onion', quantity: '1' }, { name: 'Vegetable broth', quantity: '3 cups' }],
    steps: ['Sauté onion and carrot.', 'Add lentils and broth; simmer 25 min.'],
  },
  {
    id: 'r_tuna_wrap', name: 'Tuna avocado wrap', emoji: '🌯',
    mealTypes: ['lunch'], diets: ['balanced', 'high_protein'], timeMin: 10,
    calories: 420, protein: 32, carbs: 34, fat: 18,
    ingredients: [{ name: 'Canned tuna', quantity: '1 can' }, { name: 'Flour tortilla', quantity: '1' }, { name: 'Avocado', quantity: '1/2' }, { name: 'Lettuce', quantity: '1 cup' }],
    steps: ['Mix tuna with mashed avocado.', 'Fill tortilla with tuna and lettuce; roll up.'],
  },
  {
    id: 'r_paneer_bowl', name: 'Paneer & quinoa bowl', emoji: '🥘',
    mealTypes: ['lunch', 'dinner'], diets: ['vegetarian', 'high_protein', 'balanced'], timeMin: 20,
    calories: 520, protein: 28, carbs: 42, fat: 26,
    ingredients: [{ name: 'Paneer', quantity: '120 g' }, { name: 'Quinoa', quantity: '1 cup' }, { name: 'Spinach', quantity: '1 cup' }, { name: 'Olive oil', quantity: '1 tbsp' }],
    steps: ['Pan-sear paneer cubes.', 'Serve over quinoa with sautéed spinach.'],
  },

  // ── Dinner ─────────────────────────────────────────────────────────
  {
    id: 'r_salmon_veg', name: 'Baked salmon & veggies', emoji: '🐟',
    mealTypes: ['dinner', 'lunch'], diets: ['balanced', 'high_protein', 'low_carb', 'keto', 'mediterranean'], timeMin: 25,
    calories: 480, protein: 40, carbs: 14, fat: 30,
    ingredients: [{ name: 'Salmon fillet', quantity: '170 g' }, { name: 'Asparagus', quantity: '1 cup' }, { name: 'Olive oil', quantity: '1 tbsp' }, { name: 'Lemon', quantity: '1/2' }],
    steps: ['Roast salmon and asparagus at 200°C for 15 min.', 'Finish with olive oil and lemon.'],
  },
  {
    id: 'r_steak_potato', name: 'Steak & sweet potato', emoji: '🥩',
    mealTypes: ['dinner'], diets: ['balanced', 'high_protein'], timeMin: 30,
    calories: 600, protein: 45, carbs: 40, fat: 28,
    ingredients: [{ name: 'Sirloin steak', quantity: '180 g' }, { name: 'Sweet potato', quantity: '1' }, { name: 'Green beans', quantity: '1 cup' }],
    steps: ['Roast sweet potato.', 'Sear steak to liking; serve with green beans.'],
  },
  {
    id: 'r_chicken_stirfry', name: 'Chicken veggie stir-fry', emoji: '🥡',
    mealTypes: ['dinner', 'lunch'], diets: ['balanced', 'high_protein', 'low_carb'], timeMin: 20,
    calories: 470, protein: 40, carbs: 30, fat: 18,
    ingredients: [{ name: 'Chicken breast', quantity: '150 g' }, { name: 'Mixed vegetables', quantity: '2 cups' }, { name: 'Soy sauce', quantity: '2 tbsp' }, { name: 'Sesame oil', quantity: '1 tbsp' }],
    steps: ['Stir-fry chicken until cooked.', 'Add veggies and sauce; toss 5 min.'],
  },
  {
    id: 'r_tofu_curry', name: 'Tofu coconut curry', emoji: '🍛',
    mealTypes: ['dinner', 'lunch'], diets: ['vegan', 'vegetarian', 'balanced'], timeMin: 25,
    calories: 520, protein: 22, carbs: 48, fat: 26,
    ingredients: [{ name: 'Firm tofu', quantity: '150 g' }, { name: 'Coconut milk', quantity: '1 cup' }, { name: 'Curry paste', quantity: '2 tbsp' }, { name: 'Basmati rice', quantity: '3/4 cup' }],
    steps: ['Simmer tofu in coconut milk and curry paste.', 'Serve over rice.'],
  },
  {
    id: 'r_zucchini_pasta', name: 'Keto zucchini "pasta"', emoji: '🍝',
    mealTypes: ['dinner', 'lunch'], diets: ['keto', 'low_carb', 'vegetarian'], timeMin: 20,
    calories: 380, protein: 18, carbs: 12, fat: 30,
    ingredients: [{ name: 'Zucchini', quantity: '2' }, { name: 'Parmesan', quantity: '30 g' }, { name: 'Olive oil', quantity: '2 tbsp' }, { name: 'Garlic', quantity: '2 cloves' }],
    steps: ['Spiralize zucchini.', 'Sauté in oil and garlic; finish with parmesan.'],
  },
  {
    id: 'r_chicken_biryani', name: 'Chicken biryani', emoji: '🍛',
    mealTypes: ['dinner', 'lunch'], diets: ['balanced', 'high_protein'], timeMin: 40,
    calories: 580, protein: 32, carbs: 64, fat: 20,
    ingredients: [{ name: 'Chicken', quantity: '150 g' }, { name: 'Basmati rice', quantity: '1 cup' }, { name: 'Yogurt', quantity: '1/4 cup' }, { name: 'Biryani spices', quantity: '2 tbsp' }],
    steps: ['Marinate chicken in yogurt and spices.', 'Layer with par-cooked rice and steam 20 min.'],
  },

  // ── Snacks ─────────────────────────────────────────────────────────
  {
    id: 'r_protein_shake', name: 'Protein shake', emoji: '🥤',
    mealTypes: ['snack'], diets: ['balanced', 'high_protein', 'vegetarian'], timeMin: 3,
    calories: 220, protein: 30, carbs: 18, fat: 4,
    ingredients: [{ name: 'Whey protein', quantity: '1 scoop' }, { name: 'Banana', quantity: '1' }, { name: 'Milk', quantity: '1 cup' }],
    steps: ['Blend everything until smooth.'],
  },
  {
    id: 'r_hummus_veg', name: 'Hummus & veggie sticks', emoji: '🥕',
    mealTypes: ['snack'], diets: ['vegan', 'vegetarian', 'balanced', 'mediterranean', 'low_carb'], timeMin: 5,
    calories: 180, protein: 6, carbs: 18, fat: 10,
    ingredients: [{ name: 'Hummus', quantity: '1/4 cup' }, { name: 'Carrot', quantity: '1' }, { name: 'Cucumber', quantity: '1/2' }],
    steps: ['Slice veggies and serve with hummus.'],
  },
  {
    id: 'r_nuts', name: 'Mixed nuts & dark chocolate', emoji: '🥜',
    mealTypes: ['snack'], diets: ['keto', 'low_carb', 'vegetarian', 'balanced'], timeMin: 1,
    calories: 250, protein: 7, carbs: 14, fat: 20,
    ingredients: [{ name: 'Almonds', quantity: '1 oz' }, { name: 'Dark chocolate', quantity: '1 oz' }],
    steps: ['Portion and enjoy.'],
  },
  {
    id: 'r_cottage_fruit', name: 'Cottage cheese & fruit', emoji: '🍑',
    mealTypes: ['snack'], diets: ['high_protein', 'vegetarian', 'balanced', 'low_carb'], timeMin: 3,
    calories: 200, protein: 24, carbs: 16, fat: 4,
    ingredients: [{ name: 'Cottage cheese', quantity: '1 cup' }, { name: 'Strawberries', quantity: '1 cup' }],
    steps: ['Top cottage cheese with fruit.'],
  },
];

export const RECIPES_BY_ID: Record<string, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);

/** Effective recipe list = bundled with admin CMS recipes layered on. */
export function mergeRecipes(cms: Recipe[] = []): Recipe[] {
  return mergeById(RECIPES, [cms]);
}

export function recipesById(list: Recipe[]): Record<string, Recipe> {
  return Object.fromEntries(list.map((r) => [r.id, r]));
}

export function recipesForDiet(diet: string, list: Recipe[] = RECIPES): Recipe[] {
  return list.filter((r) => r.diets.includes(diet as Recipe['diets'][number]));
}

export function searchRecipes(query: string, diet: string = 'all', list: Recipe[] = RECIPES): Recipe[] {
  const q = query.trim().toLowerCase();
  return list.filter((r) => {
    if (diet !== 'all' && !r.diets.includes(diet as Recipe['diets'][number])) return false;
    if (q && !r.name.toLowerCase().includes(q)) return false;
    return true;
  });
}
