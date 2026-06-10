import type { AppData } from '@/models/types';
import { biologicalAge } from './longevity';

export interface ReviewMetric {
  key: string;
  label: string;
  value: string;
  /** Change vs the previous week, already formatted (e.g. "+6%"), or null. */
  delta: string | null;
  /** true = improvement, false = regression, null = neutral. */
  good: boolean | null;
}

export interface WeekReview {
  rangeLabel: string;
  metrics: ReviewMetric[];
  insights: { emoji: string; text: string; good: boolean | null }[];
}

const DAY = 864e5;
const inWindow = (iso: string, start: number, end: number) => {
  const t = Date.parse(iso);
  return t >= start && t < end;
};

/** Distinct YYYY-MM-DD count from a list of dated items within a window. */
function activeDays(items: { date: string; loggedAt: string }[], start: number, end: number): number {
  const set = new Set<string>();
  for (const it of items) if (inWindow(it.loggedAt, start, end)) set.add(it.date);
  return set.size;
}

/** Builds a "your week in review" comparison of the last 7 days vs the prior 7. */
export function computeWeekReview(data: AppData): WeekReview {
  const now = Date.now();
  const thisStart = now - 7 * DAY;
  const prevStart = now - 14 * DAY;

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const metrics: ReviewMetric[] = [];

  const pctDelta = (cur: number, prev: number): string | null => {
    if (!prev) return cur ? '+new' : null;
    const d = Math.round(((cur - prev) / prev) * 100);
    return d === 0 ? '±0%' : `${d > 0 ? '+' : ''}${d}%`;
  };

  // ── Meals logged (days) ──
  const mealsCur = activeDays(data.meals, thisStart, now);
  const mealsPrev = activeDays(data.meals, prevStart, thisStart);
  metrics.push({ key: 'meals', label: 'Days logged', value: `${mealsCur}/7`, delta: mealsCur === mealsPrev ? null : `${mealsCur > mealsPrev ? '+' : ''}${mealsCur - mealsPrev}`, good: mealsCur >= mealsPrev ? (mealsCur > mealsPrev ? true : null) : false });

  // ── Active minutes ──
  const exCur = sum(data.exercises.filter((e) => inWindow(e.loggedAt, thisStart, now)).map((e) => e.durationMinutes));
  const exPrev = sum(data.exercises.filter((e) => inWindow(e.loggedAt, prevStart, thisStart)).map((e) => e.durationMinutes));
  metrics.push({ key: 'active', label: 'Active minutes', value: `${Math.round(exCur)}`, delta: pctDelta(exCur, exPrev), good: exCur >= exPrev ? (exCur > exPrev ? true : null) : false });

  // ── Avg sleep (h) ──
  const sleepCur = data.sleep.filter((s) => inWindow(s.loggedAt, thisStart, now)).map((s) => s.durationMinutes);
  const sleepAvg = sleepCur.length ? sum(sleepCur) / sleepCur.length : 0;
  const sleepPrevArr = data.sleep.filter((s) => inWindow(s.loggedAt, prevStart, thisStart)).map((s) => s.durationMinutes);
  const sleepPrevAvg = sleepPrevArr.length ? sum(sleepPrevArr) / sleepPrevArr.length : 0;
  metrics.push({ key: 'sleep', label: 'Avg sleep', value: sleepAvg ? `${(sleepAvg / 60).toFixed(1)}h` : '—', delta: sleepAvg && sleepPrevAvg ? pctDelta(sleepAvg, sleepPrevAvg) : null, good: sleepAvg >= sleepPrevAvg ? (sleepAvg > sleepPrevAvg ? true : null) : false });

  // ── Glucose: avg + time in range ──
  const gCur = data.glucose.filter((g) => inWindow(g.loggedAt, thisStart, now));
  if (gCur.length) {
    const avg = Math.round(sum(gCur.map((g) => g.mgDl)) / gCur.length);
    const tir = Math.round((gCur.filter((g) => g.mgDl >= 70 && g.mgDl <= 180).length / gCur.length) * 100);
    const gPrev = data.glucose.filter((g) => inWindow(g.loggedAt, prevStart, thisStart));
    const tirPrev = gPrev.length ? Math.round((gPrev.filter((g) => g.mgDl >= 70 && g.mgDl <= 180).length / gPrev.length) * 100) : null;
    metrics.push({ key: 'glucose', label: 'Avg glucose', value: `${avg} mg/dL`, delta: null, good: null });
    metrics.push({ key: 'tir', label: 'Time in range', value: `${tir}%`, delta: tirPrev != null ? `${tir - tirPrev > 0 ? '+' : ''}${tir - tirPrev}%` : null, good: tirPrev == null ? null : tir >= tirPrev });
  }

  // ── Weight change ──
  const wWindow = data.weights.filter((w) => inWindow(w.loggedAt, thisStart, now)).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  if (wWindow.length >= 1) {
    const before = data.weights.find((w) => Date.parse(w.loggedAt) < thisStart);
    const start = before ?? wWindow[0];
    const change = Math.round((wWindow[wWindow.length - 1].weightKg - start.weightKg) * 10) / 10;
    metrics.push({ key: 'weight', label: 'Weight change', value: `${change > 0 ? '+' : ''}${change} kg`, delta: null, good: data.profile.goal === 'gain' ? change >= 0 : change <= 0 });
  }

  // ── Insights (plain language) ──
  const insights: WeekReview['insights'] = [];
  if (mealsCur >= 5) insights.push({ emoji: '🎯', text: `You logged meals ${mealsCur} of 7 days — consistency is the #1 predictor of results.`, good: true });
  else if (mealsCur < mealsPrev) insights.push({ emoji: '📉', text: `Logging slipped this week (${mealsCur} vs ${mealsPrev} days). A quick daily log keeps you on track.`, good: false });

  const tirMetric = metrics.find((m) => m.key === 'tir');
  if (tirMetric?.good === true) insights.push({ emoji: '🩸', text: `Your glucose time-in-range improved to ${tirMetric.value}. Keep doing what's working.`, good: true });
  else if (tirMetric?.good === false) insights.push({ emoji: '⚠️', text: `Time-in-range dropped to ${tirMetric.value}. Watch refined carbs and add post-meal walks.`, good: false });

  const wMetric = metrics.find((m) => m.key === 'weight');
  if (wMetric?.good === true && wMetric.value !== '+0 kg') insights.push({ emoji: '⚖️', text: `Weight moved ${wMetric.value} — aligned with your ${data.profile.goal} goal.`, good: true });

  if (exCur > exPrev && exCur > 0) insights.push({ emoji: '🏃', text: `You moved more this week (${Math.round(exCur)} min, ${pctDelta(exCur, exPrev)}). Great momentum.`, good: true });
  if (sleepAvg && sleepAvg < 6.5 * 60) insights.push({ emoji: '😴', text: `Average sleep was ${(sleepAvg / 60).toFixed(1)}h — under 7h dents recovery and glucose control.`, good: false });

  const bio = biologicalAge(data.profile, data.assessment, data);
  insights.push({ emoji: '🧬', text: `Biological age ${bio.bioAge.toFixed(0)} · longevity score ${bio.longevityScore}/100 (${bio.category}).`, good: bio.deltaYears <= 0 ? true : null });

  if (insights.length === 0) insights.push({ emoji: '👋', text: 'Log a few days this week and your personalised review will fill in here.', good: null });

  const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { rangeLabel: `${fmt(thisStart)} – ${fmt(now)}`, metrics, insights };
}
