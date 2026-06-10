import type { ExerciseDef, Food, Recipe } from '@/models/types';

/**
 * Item imagery. We don't ship a photo for every item, so foods and exercises
 * render an accurate emoji tile derived from the item (always correct). A real
 * photo is shown only when an admin attaches an `imageUrl` via the CMS.
 */

// ── Foods ────────────────────────────────────────────────────────────
// Name keyword → emoji, ordered so specific terms win over generic substrings.
const FOOD_EMOJI: [string, string][] = [
  ['chicken', '🍗'], ['turkey', '🍗'], ['bacon', '🥓'], ['steak', '🥩'], ['beef', '🥩'], ['pork', '🥩'],
  ['salmon', '🐟'], ['tuna', '🐟'], ['cod', '🐟'], ['shrimp', '🦐'], ['fish', '🐟'],
  ['egg white', '🥚'], ['egg', '🥚'], ['tofu', '🧈'], ['tempeh', '🍲'], ['seitan', '🍲'],
  ['whey', '🥤'], ['protein shake', '🥤'], ['protein bar', '🍫'], ['protein', '🥤'],
  ['lentil', '🫘'], ['chickpea', '🫘'], ['edamame', '🫛'], ['bean', '🫘'],
  ['basmati', '🍚'], ['quinoa', '🍚'], ['couscous', '🍚'], ['fried rice', '🍚'], ['rice', '🍚'],
  ['oat', '🥣'], ['cereal', '🥣'], ['bagel', '🥯'], ['naan', '🫓'], ['roti', '🫓'], ['tortilla', '🫓'], ['bread', '🍞'], ['toast', '🍞'],
  ['spaghetti', '🍝'], ['pasta', '🍝'], ['ramen', '🍜'], ['pho', '🍜'], ['pad thai', '🍜'], ['noodle', '🍜'],
  ['sweet potato', '🍠'], ['potato', '🥔'],
  ['broccoli', '🥦'], ['cauliflower', '🥦'], ['spinach', '🥬'], ['kale', '🥬'], ['lettuce', '🥬'], ['greens', '🥬'],
  ['carrot', '🥕'], ['pepper', '🫑'], ['tomato', '🍅'], ['cucumber', '🥒'], ['zucchini', '🥒'], ['mushroom', '🍄'], ['onion', '🧅'], ['avocado', '🥑'], ['popcorn', '🍿'], ['corn', '🌽'],
  ['peanut', '🥜'], ['pear', '🍐'], ['peas', '🫛'],
  ['banana', '🍌'], ['apple', '🍎'], ['blueberr', '🫐'], ['strawberr', '🍓'], ['orange', '🍊'], ['grape', '🍇'], ['mango', '🥭'], ['pineapple', '🍍'], ['watermelon', '🍉'], ['date', '🌴'],
  ['greek yogurt', '🥛'], ['yogurt', '🥛'], ['milk', '🥛'], ['paneer', '🧀'], ['cottage', '🧀'], ['cheddar', '🧀'], ['mozzarella', '🧀'], ['cheese', '🧀'], ['butter', '🧈'],
  ['almond', '🥜'], ['walnut', '🥜'], ['cashew', '🥜'], ['coconut', '🥥'], ['olive oil', '🫒'], ['chia', '🌱'], ['nut', '🥜'],
  ['latte', '☕'], ['coffee', '☕'], ['juice', '🧃'], ['smoothie', '🥤'], ['shake', '🥤'], ['beer', '🍺'], ['wine', '🍷'],
  ['chocolate', '🍫'], ['granola', '🍫'], ['hummus', '🧆'], ['chips', '🍟'], ['trail mix', '🥜'],
  ['pizza', '🍕'], ['burger', '🍔'], ['taco', '🌮'], ['burrito', '🌯'], ['sushi', '🍣'], ['biryani', '🍛'], ['curry', '🍛'], ['dal', '🍛'], ['omelette', '🍳'], ['pancake', '🥞'], ['falafel', '🧆'], ['shawarma', '🌯'], ['wrap', '🌯'], ['salad', '🥗'], ['bowl', '🥗'],
];

const FOOD_CATEGORY_EMOJI: Record<Food['category'], string> = {
  protein: '🍗', carb: '🍚', veg: '🥦', fruit: '🍎', dairy: '🧀', fat: '🥑', drink: '🥤', snack: '🍫', meal: '🍽️',
};

// ── Exercises ────────────────────────────────────────────────────────
const EXERCISE_EMOJI: [string, string][] = [
  ['running', '🏃'], ['run', '🏃'], ['jog', '🏃'], ['sprint', '🏃'], ['walk', '🚶'], ['hiking', '🥾'],
  ['cycling', '🚴'], ['bike', '🚴'], ['spin', '🚴'], ['rowing', '🚣'], ['swim', '🏊'], ['elliptical', '🏃'], ['stair', '🏃'], ['jump rope', '🪢'], ['hiit', '🔥'],
  ['yoga', '🧘'], ['pilates', '🧘'], ['tai chi', '🧘'], ['stretch', '🤸'], ['foam roll', '🧘'],
  ['boxing', '🥊'], ['martial', '🥋'], ['basketball', '🏀'], ['soccer', '⚽'], ['tennis', '🎾'], ['badminton', '🏸'], ['table tennis', '🏓'], ['volleyball', '🏐'], ['cricket', '🏏'], ['golf', '⛳'], ['dancing', '💃'], ['climbing', '🧗'], ['skiing', '⛷️'], ['skating', '⛸️'], ['surfing', '🏄'],
  ['plank', '🧘'], ['crunch', '🤸'], ['sit-up', '🤸'], ['leg raise', '🤸'], ['mountain climber', '🧗'], ['burpee', '🤸'], ['push-up', '🤸'], ['pull-up', '🤸'], ['chin-up', '🤸'], ['dip', '🤸'], ['lunge', '🦵'], ['squat', '🦵'], ['calf', '🦵'], ['leg', '🦵'],
  ['deadlift', '🏋️'], ['bench', '🏋️'], ['press', '🏋️'], ['curl', '💪'], ['row', '🏋️'], ['fly', '🏋️'], ['raise', '🏋️'], ['shrug', '🏋️'], ['extension', '🏋️'], ['pulldown', '🏋️'], ['thruster', '🏋️'], ['clean', '🏋️'], ['snatch', '🏋️'], ['swing', '🏋️'],
];

const EXERCISE_CATEGORY_EMOJI: Record<string, string> = {
  strength: '🏋️', bodyweight: '🤸', cardio: '🏃', sports: '🏅', flexibility: '🧘',
};

function matchEmoji(name: string, table: [string, string][]): string | undefined {
  const n = name.toLowerCase();
  for (const [k, e] of table) if (n.includes(k)) return e;
  return undefined;
}

// ── Public helpers ───────────────────────────────────────────────────
export function foodEmoji(food: Food): string {
  return matchEmoji(food.name, FOOD_EMOJI) ?? FOOD_CATEGORY_EMOJI[food.category] ?? '🍽️';
}
export function foodEmojiName(name: string, fallback = '🍽️'): string {
  return matchEmoji(name, FOOD_EMOJI) ?? fallback;
}
export function foodImage(food: Food): string {
  return food.imageUrl || '';
}

export function exerciseEmoji(ex: ExerciseDef): string {
  return matchEmoji(ex.name, EXERCISE_EMOJI) ?? EXERCISE_CATEGORY_EMOJI[ex.category] ?? '🏋️';
}
export function exerciseEmojiName(name: string, fallback = '🏃'): string {
  return matchEmoji(name, EXERCISE_EMOJI) ?? fallback;
}
export function exerciseImage(ex: ExerciseDef): string {
  return ex.imageUrl || '';
}

/** Recipes carry their own emoji; a real photo shows only if the CMS sets one. */
export function recipeImage(recipe: Recipe, _size?: number): string {
  return recipe.imageUrl || '';
}
