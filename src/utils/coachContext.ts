import type { AppData, Enrollment, Program } from '@/models/types';
import { computeMetabolicScore } from './health';
import { biologicalAge, avgFastingGlucose } from './longevity';

/**
 * Builds a concise, plain-text health snapshot the AI coach can use to ground
 * its advice in the user's actual metabolic / longevity data. Sent alongside
 * the chat message so replies are personalised, not generic.
 */
export function buildHealthContext(data: AppData, programs: Program[] = [], enrollments: Enrollment[] = []): string {
  const lines: string[] = ['User health snapshot:'];

  const bio = biologicalAge(data.profile, data.assessment, data);
  lines.push(`- Biological age ${bio.bioAge.toFixed(0)} vs actual ${bio.chronoAge}; longevity score ${bio.longevityScore}/100 (${bio.category}).`);

  const metab = computeMetabolicScore(data.profile, data.assessment);
  lines.push(`- Metabolic score ${metab.score}/100 (${metab.category})${metab.bmi != null ? `, BMI ${metab.bmi}` : ''}.`);

  if (bio.factors.length) {
    const worst = bio.factors.filter((f) => f.years > 0).slice(0, 3).map((f) => f.label);
    if (worst.length) lines.push(`- Top risk factors: ${worst.join(', ')}.`);
  }

  const glu = avgFastingGlucose(data.glucose);
  if (glu != null) {
    const recent = data.glucose.slice(0, 30);
    const tir = recent.length ? Math.round((recent.filter((g) => g.mgDl >= 70 && g.mgDl <= 180).length / recent.length) * 100) : null;
    lines.push(`- Avg glucose ${glu} mg/dL${tir != null ? `, ${tir}% time-in-range` : ''}.`);
  }

  if (data.weights[0]) {
    const cutoff = Date.now() - 30 * 864e5;
    const older = data.weights.find((w) => Date.parse(w.loggedAt) <= cutoff) ?? data.weights[data.weights.length - 1];
    const change = older ? Math.round((data.weights[0].weightKg - older.weightKg) * 10) / 10 : 0;
    lines.push(`- Weight ${data.weights[0].weightKg}kg${change ? `, ${change > 0 ? '+' : ''}${change}kg over ~30 days` : ''}.`);
  }

  // Active program & remaining tasks this week.
  const active = enrollments.find((e) => e.status !== 'completed');
  if (active) {
    const prog = programs.find((p) => p.id === active.programId);
    if (prog) {
      const module = prog.modules.find((m) => m.week === active.currentWeek);
      const total = module?.tasks.length ?? 0;
      const doneThisWeek = active.completedTasks.filter((k) => k.startsWith(`w${active.currentWeek}:`)).length;
      lines.push(`- Enrolled in "${prog.name}", week ${active.currentWeek}/${prog.durationWeeks}, ${Math.max(0, total - doneThisWeek)} tasks left this week.`);
    }
  }

  lines.push(`- Goal: ${data.profile.goal}, diet ${data.profile.diet}, calorie target ${data.profile.calorieTarget}.`);
  return lines.join('\n');
}
