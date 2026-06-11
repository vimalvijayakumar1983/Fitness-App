import type { DietPattern, MacroTargets, Profile } from '@/models/types';

/** Macro split as fraction of calories [protein, carbs, fat] per diet. */
const DIET_SPLITS: Record<DietPattern, [number, number, number]> = {
  balanced: [0.3, 0.4, 0.3],
  high_protein: [0.4, 0.35, 0.25],
  keto: [0.25, 0.05, 0.7],
  low_carb: [0.35, 0.2, 0.45],
  mediterranean: [0.25, 0.45, 0.3],
  vegetarian: [0.25, 0.45, 0.3],
  vegan: [0.22, 0.5, 0.28],
};

export const DIET_LABELS: Record<DietPattern, string> = {
  balanced: 'Balanced',
  high_protein: 'High protein',
  keto: 'Keto',
  low_carb: 'Low carb',
  mediterranean: 'Mediterranean',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
};

export const GOAL_LABELS = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Build muscle',
} as const;

export const ACTIVITY_LEVELS = [
  { label: 'Sedentary', value: 1.2 },
  { label: 'Light', value: 1.375 },
  { label: 'Moderate', value: 1.55 },
  { label: 'Active', value: 1.725 },
] as const;

/** Mifflin-St Jeor basal metabolic rate. */
export function bmr(profile: Profile): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  const adj = profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78;
  return base + adj;
}

export function macrosForCalories(calories: number, diet: string): MacroTargets {
  const [p, c, f] = DIET_SPLITS[diet as DietPattern] ?? DIET_SPLITS.balanced;
  return {
    protein: Math.round((calories * p) / 4),
    carbs: Math.round((calories * c) / 4),
    fat: Math.round((calories * f) / 9),
  };
}

/** Macros from an explicit P/C/F split given as integer percentages. */
export function macrosFromSplit(calories: number, protein: number, carbs: number, fat: number): MacroTargets {
  return {
    protein: Math.round((calories * (protein / 100)) / 4),
    carbs: Math.round((calories * (carbs / 100)) / 4),
    fat: Math.round((calories * (fat / 100)) / 9),
  };
}

/** Compute calorie + macro targets from body stats, activity, goal and diet. */
export function computeTargets(profile: Profile): { calorieTarget: number; macroTargets: MacroTargets } {
  const tdee = bmr(profile) * profile.activityLevel;
  const adjusted = profile.goal === 'lose' ? tdee - 500 : profile.goal === 'gain' ? tdee + 350 : tdee;
  const calorieTarget = Math.max(1200, Math.round(adjusted / 10) * 10);
  return { calorieTarget, macroTargets: macrosForCalories(calorieTarget, profile.diet) };
}

// ── Admin-editable onboarding / plan options (fetched from the backend) ──

export interface OnboardingOptions {
  goals: { key: string; label: string; calorieDelta: number }[];
  activity: { label: string; value: number }[];
  diets: { key: string; label: string; protein: number; carbs: number; fat: number }[];
}

/** Bundled defaults — used offline and as a fallback; mirror the server. */
export const DEFAULT_ONBOARDING: OnboardingOptions = {
  goals: [
    { key: 'lose', label: 'Lose weight', calorieDelta: -500 },
    { key: 'maintain', label: 'Maintain', calorieDelta: 0 },
    { key: 'gain', label: 'Build muscle', calorieDelta: 350 },
  ],
  activity: ACTIVITY_LEVELS.map((a) => ({ label: a.label, value: a.value })),
  diets: (Object.keys(DIET_SPLITS) as DietPattern[]).map((k) => ({
    key: k,
    label: DIET_LABELS[k],
    protein: Math.round(DIET_SPLITS[k][0] * 100),
    carbs: Math.round(DIET_SPLITS[k][1] * 100),
    fat: Math.round(DIET_SPLITS[k][2] * 100),
  })),
};

const labelFrom = (k: string, map: Record<string, string>) => map[k] ?? k;
export const goalLabel = (k: string) => labelFrom(k, GOAL_LABELS as Record<string, string>);
export const dietLabel = (k: string) => labelFrom(k, DIET_LABELS as Record<string, string>);

/** Compute targets using admin-defined options (goal delta + diet split). */
export function targetsFromOptions(
  profile: Profile,
  o: OnboardingOptions,
): { calorieTarget: number; macroTargets: MacroTargets } {
  const goal = o.goals.find((g) => g.key === profile.goal);
  const diet = o.diets.find((d) => d.key === profile.diet) ?? o.diets[0];
  const tdee = bmr(profile) * profile.activityLevel;
  const calorieTarget = Math.max(1200, Math.round((tdee + (goal?.calorieDelta ?? 0)) / 10) * 10);
  return {
    calorieTarget,
    macroTargets: diet
      ? macrosFromSplit(calorieTarget, diet.protein, diet.carbs, diet.fat)
      : macrosForCalories(calorieTarget, profile.diet),
  };
}
