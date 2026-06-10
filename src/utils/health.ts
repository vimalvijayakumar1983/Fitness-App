import type { HealthAssessment, Profile } from '@/models/types';

export interface MetabolicScore {
  score: number; // 0..100, higher is better
  category: 'Excellent' | 'Good' | 'Fair' | 'Needs attention';
  bmi: number | null;
  factors: { label: string; impact: number }[]; // negative = risk
}

export function bmiOf(profile: Profile): number | null {
  if (!profile.heightCm || !profile.weightKg) return null;
  const h = profile.heightCm / 100;
  return Math.round((profile.weightKg / (h * h)) * 10) / 10;
}

/**
 * Blends body composition and lifestyle/risk factors into a 0–100 metabolic
 * health score. Transparent and rule-based (no medical claim).
 */
export function computeMetabolicScore(profile: Profile, a: HealthAssessment | null): MetabolicScore {
  const factors: { label: string; impact: number }[] = [];
  let score = 100;
  const add = (label: string, impact: number) => {
    if (impact !== 0) factors.push({ label, impact });
    score += impact;
  };

  const bmi = bmiOf(profile);
  if (bmi != null) {
    if (bmi >= 35) add('BMI very high', -30);
    else if (bmi >= 30) add('BMI high', -20);
    else if (bmi >= 27) add('BMI elevated', -12);
    else if (bmi >= 25) add('BMI slightly high', -6);
    else if (bmi < 18.5) add('BMI low', -8);
  }
  if (profile.age >= 60) add('Age 60+', -8);
  else if (profile.age >= 45) add('Age 45+', -4);

  if (a) {
    if (a.smokes) add('Smoking', -15);
    if (a.familyDiabetes) add('Family history: diabetes', -8);
    if (a.familyHeart) add('Family history: heart disease', -8);
    if (a.waistCm) {
      const high = profile.sex === 'female' ? 88 : 102;
      if (a.waistCm >= high) add('High waist circumference', -10);
    }
    if (a.activityDaysPerWeek <= 1) add('Sedentary', -12);
    else if (a.activityDaysPerWeek <= 3) add('Low activity', -6);
    else if (a.activityDaysPerWeek >= 5) add('Active lifestyle', +4);

    add('Sleep quality', -(5 - a.sleepQuality) * 3);
    add('Stress level', -(a.stressLevel - 1) * 2);
    add('Diet quality', -(5 - a.dietQuality) * 3);
    if (a.alcoholPerWeek >= 14) add('High alcohol intake', -10);
    else if (a.alcoholPerWeek >= 7) add('Moderate alcohol intake', -5);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const category =
    score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention';
  factors.sort((x, y) => x.impact - y.impact);
  return { score, category, bmi, factors };
}
