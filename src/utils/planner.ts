import type { DayPlan, MealType, PlannedMeal, Profile, Recipe } from '@/models/types';
import { RECIPES, RECIPES_BY_ID, recipesForDiet } from '@/data/recipes';
import type { MacroTotals } from '@/utils/selectors';

/** Fraction of the daily calorie target allotted to each meal slot. */
const SLOT_FRACTIONS: { slot: MealType; frac: number }[] = [
  { slot: 'breakfast', frac: 0.25 },
  { slot: 'lunch', frac: 0.35 },
  { slot: 'dinner', frac: 0.3 },
  { slot: 'snack', frac: 0.1 },
];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Generate a day plan: for each slot, choose a diet-compatible recipe whose
 * scaled calories land closest to that slot's target. Picks randomly among the
 * best matches so "regenerate" produces variety.
 */
export function generatePlan(profile: Profile, date: string): DayPlan {
  const pool = recipesForDiet(profile.diet);
  const candidates = pool.length >= 4 ? pool : RECIPES; // fall back if a diet is sparse

  const meals: PlannedMeal[] = [];
  const used = new Set<string>();

  for (const { slot, frac } of SLOT_FRACTIONS) {
    const target = profile.calorieTarget * frac;
    const options = candidates
      .filter((r) => r.mealTypes.includes(slot) && !used.has(r.id))
      .map((r) => {
        const servings = clamp(Math.round(target / r.calories), 1, 3);
        return { r, servings, diff: Math.abs(r.calories * servings - target) };
      })
      .sort((a, b) => a.diff - b.diff);

    if (!options.length) continue;
    const top = options.slice(0, Math.min(3, options.length));
    const pick = top[Math.floor(Math.random() * top.length)];
    used.add(pick.r.id);
    meals.push({ slot, recipeId: pick.r.id, servings: pick.servings });
  }

  return { date, meals };
}

/** Total macros across a plan's meals (servings applied). */
export function planTotals(plan: DayPlan): MacroTotals {
  return plan.meals.reduce<MacroTotals>(
    (acc, m) => {
      const r = RECIPES_BY_ID[m.recipeId];
      if (!r) return acc;
      acc.calories += r.calories * m.servings;
      acc.protein += r.protein * m.servings;
      acc.carbs += r.carbs * m.servings;
      acc.fat += r.fat * m.servings;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export interface GroceryItem {
  name: string;
  detail: string; // e.g. "×2" or recipe count
}

/** Aggregate ingredients across a plan into a deduped grocery list. */
export function groceryFromPlan(plan: DayPlan): GroceryItem[] {
  const counts = new Map<string, number>();
  for (const m of plan.meals) {
    const r = RECIPES_BY_ID[m.recipeId];
    if (!r) continue;
    for (const ing of r.ingredients) {
      const key = ing.name;
      counts.set(key, (counts.get(key) ?? 0) + m.servings);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, n]) => ({ name, detail: n > 1 ? `×${n}` : '' }));
}

/** 0–100 adherence: how close logged macros are to targets (closer = higher). */
export function adherenceScore(logged: MacroTotals, calorieTarget: number, macroTargets: { protein: number; carbs: number; fat: number }): number {
  if (logged.calories === 0) return 0;
  const ratio = (a: number, b: number) => (b <= 0 ? 1 : clamp(a / b, 0, 1.5));
  // Penalize distance from 1.0 on each axis.
  const axes = [
    ratio(logged.calories, calorieTarget),
    ratio(logged.protein, macroTargets.protein),
    ratio(logged.carbs, macroTargets.carbs),
    ratio(logged.fat, macroTargets.fat),
  ];
  const score = axes.reduce((sum, r) => sum + (1 - Math.min(1, Math.abs(1 - r))), 0) / axes.length;
  return Math.round(score * 100);
}

export function recipeById(id: string): Recipe | undefined {
  return RECIPES_BY_ID[id];
}
