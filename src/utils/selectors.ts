import type { AppData, ISODateString } from '@/models/types';
import { toISODate } from '@/utils/date';

/** Filters any dated entry list down to a single date. */
function onDate<T extends { date: ISODateString }>(
  entries: T[],
  date: ISODateString,
): T[] {
  return entries.filter((e) => e.date === date);
}

export interface DailySummary {
  caloriesIn: number;
  caloriesOut: number;
  mealCount: number;
  exerciseMinutes: number;
  steps: number;
  avgMood: number | null;
  sleepMinutes: number;
}

/** Computes the headline numbers shown on the dashboard for a given day. */
export function summarizeDay(
  data: AppData,
  date: ISODateString,
): DailySummary {
  const meals = onDate(data.meals, date);
  const exercises = onDate(data.exercises, date);
  const moods = onDate(data.moods, date);
  const sleep = onDate(data.sleep, date);

  const caloriesIn = meals.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + (i.calories || 0), 0),
    0,
  );
  const caloriesOut = exercises.reduce(
    (sum, e) => sum + (e.caloriesBurned || 0),
    0,
  );
  const exerciseMinutes = exercises.reduce(
    (sum, e) => sum + e.durationMinutes,
    0,
  );
  const steps = exercises.reduce((sum, e) => sum + (e.steps || 0), 0);
  const avgMood =
    moods.length > 0
      ? moods.reduce((sum, m) => sum + m.mood, 0) / moods.length
      : null;
  const sleepMinutes = sleep.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    caloriesIn,
    caloriesOut,
    mealCount: meals.length,
    exerciseMinutes,
    steps,
    avgMood,
    sleepMinutes,
  };
}

const GOALS = { caloriesOut: 500, steps: 10000, sleepMin: 480 };

export interface Readiness {
  score: number; // 0..100
  sleep: number; // 0..100 subscore
  activity: number;
  mind: number;
  caption: string;
}

/** Blends recovery signals into a single 0–100 readiness score. */
export function computeReadiness(data: AppData, date: ISODateString): Readiness {
  const s = summarizeDay(data, date);
  const sleep = Math.round(Math.min(1, s.sleepMinutes / GOALS.sleepMin) * 100);
  const activity = Math.round(
    Math.min(1, (s.caloriesOut / GOALS.caloriesOut) * 0.5 + (s.steps / GOALS.steps) * 0.5) * 100,
  );
  const mind = s.avgMood != null ? Math.round((s.avgMood / 5) * 100) : 60;
  const score = Math.round(sleep * 0.4 + activity * 0.35 + mind * 0.25);
  const caption =
    score >= 80 ? 'Primed — go for it' : score >= 60 ? 'Solid — train as planned' : score >= 40 ? 'Take it easy today' : 'Prioritize recovery';
  return { score, sleep, activity, mind, caption };
}

/** Consecutive days (ending today or yesterday) with at least one logged entry. */
export function computeStreak(data: AppData): number {
  const days = new Set<ISODateString>();
  for (const list of [data.meals, data.exercises, data.moods, data.sleep]) {
    for (const e of list as { date: ISODateString }[]) days.add(e.date);
  }
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to "start" today or yesterday.
  if (!days.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(toISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Sum calories + macros from all meals logged on `date`. */
export function summarizeMacros(data: AppData, date: ISODateString): MacroTotals {
  const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of data.meals) {
    if (meal.date !== date) continue;
    for (const item of meal.items) {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
    }
  }
  return totals;
}

/** Total water (ml) logged on `date`. */
export function waterMl(data: AppData, date: ISODateString): number {
  return data.water
    .filter((w) => w.date === date)
    .reduce((sum, w) => sum + w.ml, 0);
}
