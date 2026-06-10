import type { AppData, GlucoseReading, HealthAssessment, Profile } from '@/models/types';
import { bmiOf } from './health';

/**
 * Transparent, rule-based biological-age & longevity model. It estimates how
 * lifestyle and body composition shift "biological age" away from chronological
 * age, and projects how many healthy years could be recovered by optimising
 * habits (the "digital twin"). Educational — not a medical calculation.
 */

export interface LifeFactor {
  /** Human label, e.g. "Smoking". */
  label: string;
  /** Years added to biological age (positive = ages you faster). */
  years: number;
  /** A lever the user can change to improve this factor. */
  lever?: LeverKey;
}

export type LeverKey = 'smoking' | 'activity' | 'weight' | 'sleep' | 'stress' | 'diet' | 'alcohol' | 'glucose';

export interface BiologicalAge {
  chronoAge: number;
  bioAge: number;
  deltaYears: number; // bioAge - chronoAge (negative is good)
  longevityScore: number; // 0..100, higher is better
  category: 'Excellent' | 'Good' | 'Fair' | 'Needs attention';
  factors: LifeFactor[];
}

/** Average of the most recent fasting (or any) glucose readings. */
export function avgFastingGlucose(glucose: GlucoseReading[]): number | null {
  if (!glucose.length) return null;
  const fasting = glucose.filter((g) => g.tag === 'fasting');
  const pool = (fasting.length ? fasting : glucose).slice(0, 14);
  return Math.round(pool.reduce((a, b) => a + b.mgDl, 0) / pool.length);
}

/** Average steps/day over the last `days` from logged exercises. */
function avgSteps(data: AppData, days = 14): number | null {
  const since = Date.now() - days * 864e5;
  const recent = data.exercises.filter((e) => Date.parse(e.loggedAt) >= since && e.steps);
  if (!recent.length) return null;
  const byDay = new Map<string, number>();
  for (const e of recent) byDay.set(e.date, (byDay.get(e.date) ?? 0) + (e.steps ?? 0));
  const vals = [...byDay.values()];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * Computes the list of factors (in years) for a given profile + assessment +
 * data. Used both for the real score and for "what-if" optimisation.
 */
export function lifeFactors(profile: Profile, a: HealthAssessment | null, data?: AppData): LifeFactor[] {
  const f: LifeFactor[] = [];
  const push = (label: string, years: number, lever?: LeverKey) => {
    if (Math.abs(years) >= 0.05) f.push({ label, years: Math.round(years * 10) / 10, lever });
  };

  const bmi = bmiOf(profile);
  if (bmi != null) {
    if (bmi >= 35) push('Obesity (BMI 35+)', 6, 'weight');
    else if (bmi >= 30) push('Obesity (BMI 30+)', 4, 'weight');
    else if (bmi >= 27) push('Overweight', 2, 'weight');
    else if (bmi >= 25) push('Slightly overweight', 1, 'weight');
    else if (bmi >= 18.5) push('Healthy weight', -1, 'weight');
    else push('Underweight', 1.5, 'weight');
  }

  if (a) {
    if (a.smokes) push('Smoking', 7, 'smoking');
    else push('Non-smoker', -1, 'smoking');

    if (a.activityDaysPerWeek >= 5) push('Very active', -3, 'activity');
    else if (a.activityDaysPerWeek >= 3) push('Moderately active', -1, 'activity');
    else if (a.activityDaysPerWeek <= 1) push('Sedentary lifestyle', 3, 'activity');

    push('Sleep quality', (3 - a.sleepQuality) * 0.8, 'sleep');
    push('Stress level', (a.stressLevel - 3) * 0.7, 'stress');
    push('Diet quality', (3 - a.dietQuality) * 0.9, 'diet');

    if (a.alcoholPerWeek >= 14) push('High alcohol intake', 2.5, 'alcohol');
    else if (a.alcoholPerWeek >= 7) push('Moderate alcohol intake', 1, 'alcohol');

    if (a.waistCm) {
      const high = profile.sex === 'female' ? 88 : 102;
      if (a.waistCm >= high) push('High waist circumference', 1.5, 'weight');
    }
    if (a.familyDiabetes) push('Family history: diabetes', 1);
    if (a.familyHeart) push('Family history: heart disease', 1);
  }

  if (data) {
    const steps = avgSteps(data);
    if (steps != null) {
      if (steps >= 10000) push('10k+ steps/day', -1.5, 'activity');
      else if (steps < 4000) push('Low daily steps', 1.5, 'activity');
    }
    const glu = avgFastingGlucose(data.glucose);
    if (glu != null) {
      if (glu >= 126) push('Elevated fasting glucose', 4, 'glucose');
      else if (glu >= 100) push('Pre-diabetic glucose', 2, 'glucose');
      else push('Healthy glucose', -0.5, 'glucose');
    }
  }

  return f;
}

function scoreFrom(deltaYears: number): { longevityScore: number; category: BiologicalAge['category'] } {
  const longevityScore = Math.max(0, Math.min(100, Math.round(82 - deltaYears * 3.5)));
  const category =
    longevityScore >= 80 ? 'Excellent' : longevityScore >= 65 ? 'Good' : longevityScore >= 50 ? 'Fair' : 'Needs attention';
  return { longevityScore, category };
}

export function biologicalAge(profile: Profile, a: HealthAssessment | null, data?: AppData): BiologicalAge {
  const factors = lifeFactors(profile, a, data);
  const delta = factors.reduce((sum, x) => sum + x.years, 0);
  const chronoAge = profile.age;
  const bioAge = Math.max(18, Math.round((chronoAge + delta) * 10) / 10);
  const deltaYears = Math.round((bioAge - chronoAge) * 10) / 10;
  const { longevityScore, category } = scoreFrom(deltaYears);
  factors.sort((x, y) => y.years - x.years); // worst first
  return { chronoAge, bioAge, deltaYears, longevityScore, category, factors };
}

/** An "ideal habits" version of the assessment & profile for what-if modelling. */
function optimize(profile: Profile, a: HealthAssessment | null): { profile: Profile; assessment: HealthAssessment } {
  const idealBmi = 22;
  const h = profile.heightCm / 100;
  const idealWeight = Math.round(idealBmi * h * h);
  const optProfile: Profile = { ...profile, weightKg: Math.min(profile.weightKg, idealWeight) };
  const optAssessment: HealthAssessment = {
    completedAt: new Date().toISOString(),
    smokes: false,
    familyDiabetes: a?.familyDiabetes ?? false,
    familyHeart: a?.familyHeart ?? false,
    waistCm: profile.sex === 'female' ? 80 : 94,
    activityDaysPerWeek: 5,
    sleepQuality: 5,
    stressLevel: 1,
    dietQuality: 5,
    alcoholPerWeek: 0,
  };
  return { profile: optProfile, assessment: optAssessment };
}

export interface Projection {
  /** Years of healthy life recoverable by optimising habits. */
  yearsToGain: number;
  current: BiologicalAge;
  optimized: BiologicalAge;
  /** Per-lever potential — years recoverable by fixing each single factor. */
  levers: { key: LeverKey; label: string; years: number }[];
  /** Longevity-score trajectory over the next 20 years (current vs optimized). */
  trajectory: { year: number; current: number; optimized: number }[];
}

const LEVER_LABEL: Record<LeverKey, string> = {
  smoking: 'Quit smoking',
  activity: 'Move more',
  weight: 'Reach healthy weight',
  sleep: 'Improve sleep',
  stress: 'Lower stress',
  diet: 'Eat better',
  alcohol: 'Cut alcohol',
  glucose: 'Stabilise glucose',
};

/** Builds the "digital twin" projection: current vs optimised trajectory. */
export function computeProjection(profile: Profile, a: HealthAssessment | null, data?: AppData): Projection {
  const current = biologicalAge(profile, a, data);
  const opt = optimize(profile, a);
  const optimized = biologicalAge(opt.profile, opt.assessment, data);
  const yearsToGain = Math.max(0, Math.round((current.bioAge - optimized.bioAge) * 10) / 10);

  // Per-lever: how many years each harmful factor is costing right now.
  const leverMap = new Map<LeverKey, number>();
  for (const fac of current.factors) {
    if (fac.lever && fac.years > 0) leverMap.set(fac.lever, (leverMap.get(fac.lever) ?? 0) + fac.years);
  }
  const levers = [...leverMap.entries()]
    .map(([key, years]) => ({ key, label: LEVER_LABEL[key], years: Math.round(years * 10) / 10 }))
    .sort((x, y) => y.years - x.years);

  // Longevity score drifts down slowly with age; optimised path decays slower.
  const trajectory: Projection['trajectory'] = [];
  for (let y = 0; y <= 20; y += 5) {
    trajectory.push({
      year: y,
      current: Math.max(0, Math.round(current.longevityScore - y * 1.1)),
      optimized: Math.max(0, Math.round(optimized.longevityScore - y * 0.6)),
    });
  }

  return { yearsToGain, current, optimized, levers, trajectory };
}
