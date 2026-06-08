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
  /** Body stats used for BMR/TDEE and exercise calorie estimates. */
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female' | 'other';
  /** Activity multiplier for TDEE (1.2 sedentary .. 1.725 very active). */
  activityLevel: number;
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
  /** Optional photo from the CMS. */
  imageUrl?: string;
}

/** Movement categories for the exercise catalog. */
export type ExerciseCategory =
  | 'strength'
  | 'bodyweight'
  | 'cardio'
  | 'sports'
  | 'flexibility';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full_body'
  | 'cardio';

/**
 * A movement in the searchable exercise catalog. `met` is the metabolic
 * equivalent used to estimate calories: kcal/min = met * 3.5 * kg / 200.
 */
export interface ExerciseDef {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscle: MuscleGroup;
  /** Primary equipment, e.g. "Barbell", "Dumbbell", "Bodyweight", "Machine". */
  equipment?: string;
  met: number;
  /** Optional photo from the CMS. */
  imageUrl?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string; // e.g. "2", "100 g", "1 cup"
}

/** A recipe in the planner library. Macros are per single serving. */
export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  /** Meal slots this recipe suits. */
  mealTypes: MealType[];
  /** Diet patterns this recipe satisfies (always include the ones it fits). */
  diets: DietPattern[];
  timeMin: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Optional photo from the CMS. */
  imageUrl?: string;
}

/** One slot in a generated day plan. */
export interface PlannedMeal {
  slot: MealType;
  recipeId: string;
  servings: number;
}

export interface DayPlan {
  date: ISODateString;
  meals: PlannedMeal[];
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
  /** User-created or user-edited foods; these override bundled foods by id. */
  customFoods: Food[];
  /** User-created or user-edited exercises; override bundled by id. */
  customExercises: ExerciseDef[];
  /** The currently generated meal plan, if any. */
  plan: DayPlan | null;
}

export const DEFAULT_PROFILE: Profile = {
  name: 'You',
  goal: 'maintain',
  diet: 'balanced',
  calorieTarget: 2200,
  macroTargets: { protein: 140, carbs: 220, fat: 70 },
  waterGoalMl: 2500,
  units: 'metric',
  weightKg: 70,
  heightCm: 170,
  age: 30,
  sex: 'male',
  activityLevel: 1.45,
};

export const emptyAppData: AppData = {
  meals: [],
  exercises: [],
  moods: [],
  sleep: [],
  water: [],
  profile: DEFAULT_PROFILE,
  favoriteFoodIds: [],
  customFoods: [],
  customExercises: [],
  plan: null,
};
