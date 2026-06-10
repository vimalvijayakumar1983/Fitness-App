import type { ExerciseDef, Food, Recipe } from '@/models/types';

/**
 * Item imagery. We don't ship a photo for every item, so foods render an
 * accurate emoji tile derived from the item name (always correct), and a real
 * photo is shown only when an admin explicitly attaches an `imageUrl` in the
 * CMS. (Exercises/recipes still use the keyword service below.)
 */

// Name keyword → emoji. Ordered so specific terms win over generic substrings
// (e.g. "peanut" before "pea", "sweet potato" before "potato").
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

const CATEGORY_EMOJI: Record<Food['category'], string> = {
  protein: '🍗', carb: '🍚', veg: '🥦', fruit: '🍎', dairy: '🧀', fat: '🥑', drink: '🥤', snack: '🍫', meal: '🍽️',
};

function matchEmoji(name: string): string | undefined {
  const n = name.toLowerCase();
  for (const [k, e] of FOOD_EMOJI) if (n.includes(k)) return e;
  return undefined;
}

/** Accurate emoji for a food (by name, then category). */
export function foodEmoji(food: Food): string {
  return matchEmoji(food.name) ?? CATEGORY_EMOJI[food.category] ?? '🍽️';
}

/** Emoji from a free-text food/meal name (for logged entries). */
export function foodEmojiName(name: string, fallback = '🍽️'): string {
  return matchEmoji(name) ?? fallback;
}

/** Real photo only if the CMS provides one; otherwise empty → emoji tile. */
export function foodImage(food: Food): string {
  return food.imageUrl || '';
}

// ── Exercises / recipes still use a keyword image service (fallback to emoji) ──
function lock(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}
function url(keyword: string, id: string, size = 200): string {
  const kw = encodeURIComponent(keyword.trim() || 'food');
  return `https://loremflickr.com/${size}/${size}/${kw}?lock=${lock(id)}`;
}
function nameKeyword(name: string): string {
  return name.split(',')[0].split(' ').slice(0, 2).join(' ');
}

export function recipeImage(recipe: Recipe, size = 400): string {
  return recipe.imageUrl || url(`${nameKeyword(recipe.name)},meal`, recipe.id, size);
}

export function keywordImage(keyword: string, id: string, suffix = 'food', size = 160): string {
  return url(`${nameKeyword(keyword)},${suffix}`, id, size);
}

export function exerciseImage(ex: ExerciseDef, size = 200): string {
  if (ex.imageUrl) return ex.imageUrl;
  const kw =
    ex.category === 'cardio' || ex.category === 'sports'
      ? `${nameKeyword(ex.name)},fitness`
      : `${ex.equipment ?? 'gym'},workout`;
  return url(kw, ex.id, size);
}
