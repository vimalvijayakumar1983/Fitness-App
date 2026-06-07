/**
 * Core domain models for the Fitness App.
 *
 * Everything the user logs (meals, exercise, mood, sleep) is stored as a
 * dated entry. IDs are simple unique strings; timestamps are ISO 8601.
 */

export type ISODateString = string; // e.g. "2026-06-07"
export type ISODateTimeString = string; // e.g. "2026-06-07T08:30:00.000Z"

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  /** Estimated calories for this item. */
  calories: number;
  /** Macronutrients in grams (optional, best-effort). */
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealEntry {
  id: string;
  date: ISODateString;
  loggedAt: ISODateTimeString;
  type: MealType;
  items: FoodItem[];
  notes?: string;
}

/** Where an exercise record originated. */
export type ExerciseSource = 'manual' | 'apple_health' | 'google_fit' | 'fitbit';

export interface ExerciseEntry {
  id: string;
  date: ISODateString;
  loggedAt: ISODateTimeString;
  activity: string; // e.g. "Running", "Cycling", "Strength"
  durationMinutes: number;
  caloriesBurned?: number;
  /** Steps captured for the day/session, typically from a smartwatch. */
  steps?: number;
  /** Average heart rate in bpm, typically from a smartwatch. */
  avgHeartRate?: number;
  source: ExerciseSource;
}

/** 1 (very low) .. 5 (very high). */
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  date: ISODateString;
  loggedAt: ISODateTimeString;
  mood: MoodScore;
  /** Stress level 1 (calm) .. 5 (very stressed). */
  stress?: MoodScore;
  /** Energy level 1 (drained) .. 5 (energized). */
  energy?: MoodScore;
  tags?: string[]; // e.g. ["anxious", "focused", "social"]
  notes?: string;
}

export interface SleepEntry {
  id: string;
  date: ISODateString; // the morning the user woke up
  loggedAt: ISODateTimeString;
  bedtime: ISODateTimeString;
  wakeTime: ISODateTimeString;
  durationMinutes: number;
  /** Subjective sleep quality 1 (poor) .. 5 (great). */
  quality: MoodScore;
  source: ExerciseSource;
}

/** A glass/serving of water (stored in millilitres). */
export interface WaterEntry {
  id: string;
  date: ISODateString;
  loggedAt: ISODateTimeString;
  ml: number;
}

/** Diet patterns the planner can target (Lifesum-style). */
export type DietPattern =
  | 'balanced'
  | 'high_protein'
  | 'keto'
  | 'low_carb'
  | 'mediterranean'
  | 'vegetarian'
  | 'vegan';

export type GoalType = 'lose' | 'maintain' | 'gain';

/** Macro targets in grams. */
export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

/** User profile drives calorie/macro targets and plan generation. */
export interface Profile {
  name: string;
  goal: GoalType;
  diet: DietPattern;
  /** Daily calorie target (kcal). */
  calorieTarget: number;
  macroTargets: MacroTargets;
  /** Daily water goal in millilitres. */
  waterGoalMl: number;
  units: 'metric' | 'imperial';
}

/**
 * A food in the searchable database. Macros are per single `serving`.
 * (Bundled locally now; swappable for the backend food DB later.)
 */
export interface Food {
  id: string;
  name: string;
  brand?: string;
  /** Human label for one serving, e.g. "1 cup", "100 g", "1 medium". */
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Coarse grouping for browsing. */
  category: 'protein' | 'carb' | 'veg' | 'fruit' | 'dairy' | 'fat' | 'drink' | 'snack' | 'meal';
}

export interface AppData {
  meals: MealEntry[];
  exercises: ExerciseEntry[];
  moods: MoodEntry[];
  sleep: SleepEntry[];
  water: WaterEntry[];
  profile: Profile;
  /** Food ids the user has favorited for quick add. */
  favoriteFoodIds: string[];
}

export const DEFAULT_PROFILE: Profile = {
  name: 'You',
  goal: 'maintain',
  diet: 'balanced',
  calorieTarget: 2200,
  macroTargets: { protein: 140, carbs: 220, fat: 70 },
  waterGoalMl: 2500,
  units: 'metric',
};

export const emptyAppData: AppData = {
  meals: [],
  exercises: [],
  moods: [],
  sleep: [],
  water: [],
  profile: DEFAULT_PROFILE,
  favoriteFoodIds: [],
};
