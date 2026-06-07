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

export interface AppData {
  meals: MealEntry[];
  exercises: ExerciseEntry[];
  moods: MoodEntry[];
  sleep: SleepEntry[];
}

export const emptyAppData: AppData = {
  meals: [],
  exercises: [],
  moods: [],
  sleep: [],
};
