import type { AppData, ISODateString } from '@/models/types';

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
