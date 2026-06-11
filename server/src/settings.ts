import { db } from './db';

/** Pricing in minor units (cents/fils) per tier → interval → currency. */
export interface Pricing {
  premium: { month: Record<string, number>; year: Record<string, number> };
  coached: { month: Record<string, number>; year: Record<string, number> };
}

export const DEFAULT_PRICING: Pricing = {
  premium: {
    month: { usd: 999, aed: 3900, eur: 899, gbp: 799 },
    year: { usd: 7900, aed: 29900, eur: 6900, gbp: 5900 },
  },
  coached: {
    month: { usd: 9900, aed: 39900, eur: 8900, gbp: 7900 },
    year: { usd: 99000, aed: 399000, eur: 89000, gbp: 79000 },
  },
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = (await db.prepare('SELECT value FROM settings WHERE key = ?').get(key)) as { value: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, JSON.stringify(value), new Date().toISOString());
}

export const getPricing = (): Promise<Pricing> => getSetting<Pricing>('pricing', DEFAULT_PRICING);
export const setPricing = (p: Pricing): Promise<void> => setSetting('pricing', p);

/** Admin-editable onboarding / plan options (goals, activity levels, diets). */
export interface OnboardingOptions {
  goals: { key: string; label: string; calorieDelta: number }[];
  activity: { label: string; value: number }[];
  /** Macro split as integer percentages (protein+carbs+fat = 100). */
  diets: { key: string; label: string; protein: number; carbs: number; fat: number }[];
}

export const DEFAULT_ONBOARDING: OnboardingOptions = {
  goals: [
    { key: 'lose', label: 'Lose weight', calorieDelta: -500 },
    { key: 'maintain', label: 'Maintain', calorieDelta: 0 },
    { key: 'gain', label: 'Build muscle', calorieDelta: 350 },
  ],
  activity: [
    { label: 'Sedentary', value: 1.2 },
    { label: 'Light', value: 1.375 },
    { label: 'Moderate', value: 1.55 },
    { label: 'Active', value: 1.725 },
  ],
  diets: [
    { key: 'balanced', label: 'Balanced', protein: 30, carbs: 40, fat: 30 },
    { key: 'high_protein', label: 'High protein', protein: 40, carbs: 35, fat: 25 },
    { key: 'keto', label: 'Keto', protein: 25, carbs: 5, fat: 70 },
    { key: 'low_carb', label: 'Low carb', protein: 35, carbs: 20, fat: 45 },
    { key: 'mediterranean', label: 'Mediterranean', protein: 25, carbs: 45, fat: 30 },
    { key: 'vegetarian', label: 'Vegetarian', protein: 25, carbs: 45, fat: 30 },
    { key: 'vegan', label: 'Vegan', protein: 22, carbs: 50, fat: 28 },
  ],
};

export const getOnboarding = (): Promise<OnboardingOptions> => getSetting<OnboardingOptions>('onboarding', DEFAULT_ONBOARDING);
export const setOnboarding = (o: OnboardingOptions): Promise<void> => setSetting('onboarding', o);

/** Which features require Premium ('premium') vs are free ('free'). */
export type FeatureGates = Record<string, 'free' | 'premium'>;

export const DEFAULT_FEATURES: FeatureGates = {
  ai_coach: 'premium',
  ai_food_photo: 'premium',
  lab_analysis: 'premium',
  meal_plan: 'premium',
  coaching: 'premium',
  programs: 'free',
  longevity: 'free',
  glucose: 'free',
  family: 'free',
  week_review: 'free',
  challenges: 'free',
};

/** Merge stored gates over defaults so newly-added features have a sane tier. */
export async function getFeatures(): Promise<FeatureGates> {
  const stored = await getSetting<FeatureGates>('features', {});
  return { ...DEFAULT_FEATURES, ...stored };
}
export const setFeatures = (f: FeatureGates): Promise<void> => setSetting('features', f);
