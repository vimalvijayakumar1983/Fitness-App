import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { api } from '@/services/api';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import { biologicalAge, avgFastingGlucose } from '@/utils/longevity';
import { buildHealthContext } from '@/utils/coachContext';
import { summarizeDay } from '@/utils/selectors';
import { todayISO } from '@/utils/date';

/** Proactive AI "daily briefing" — the agent's morning plan for the user. */
export function DailyBriefing() {
  const { token } = useAuth();
  const { data } = useData();
  const [briefing, setBriefing] = useState<{ headline: string; items: string[]; focus: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (!token) { setPrograms([]); setEnrollments([]); return; }
    api.listPrograms().then(setPrograms).catch(() => {});
    api.myEnrollments().then(setEnrollments).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) { setBriefing(null); return; }
    let cancelled = false;
    setLoading(true);

    const today = todayISO();
    const s = summarizeDay(data, today);
    const bio = biologicalAge(data.profile, data.assessment, data);
    const recent = data.glucose.slice(0, 30);
    const tir = recent.length ? Math.round((recent.filter((g) => g.mgDl >= 70 && g.mgDl <= 180).length / recent.length) * 100) : undefined;
    const h = new Date().getHours();
    const partOfDay = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';

    const active = enrollments.find((e: any) => e.status !== 'completed');
    const prog = active ? programs.find((p: any) => p.id === active.programId) : null;
    let tasksLeft: number | undefined;
    if (active && prog) {
      const mod = prog.modules.find((m: any) => m.week === active.currentWeek);
      const done = active.completedTasks.filter((k: string) => k.startsWith(`w${active.currentWeek}:`)).length;
      tasksLeft = Math.max(0, (mod?.tasks.length ?? 0) - done);
    }

    let weightChangeKg: number | undefined;
    if (data.weights[0]) {
      const cutoff = Date.now() - 30 * 864e5;
      const older = data.weights.find((w) => Date.parse(w.loggedAt) <= cutoff) ?? data.weights[data.weights.length - 1];
      if (older) weightChangeKg = Math.round((data.weights[0].weightKg - older.weightKg) * 10) / 10;
    }

    const facts = {
      name: data.profile.name && data.profile.name !== 'You' ? data.profile.name : undefined,
      partOfDay,
      longevityScore: bio.longevityScore,
      bioAge: bio.bioAge,
      chronoAge: bio.chronoAge,
      glucoseAvg: avgFastingGlucose(data.glucose) ?? undefined,
      tirPct: tir,
      weightChangeKg,
      programName: prog?.name,
      tasksLeft,
      caloriesIn: s.caloriesIn,
      calorieTarget: data.profile.calorieTarget,
      activeMinutes: s.exerciseMinutes,
      loggedToday: data.meals.some((m) => m.date === today),
    };

    api.briefing(facts, buildHealthContext(data, programs, enrollments))
      .then((r) => { if (!cancelled) setBriefing({ headline: r.headline, items: r.items, focus: r.focus }); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, programs.length, enrollments.length]);

  if (!token) return null;

  return (
    <LinearGradient colors={gradients.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.badge}>✨ AI DAILY BRIEFING</Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>
      {briefing ? (
        <>
          <Text style={styles.headline}>{briefing.headline}</Text>
          {briefing.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.item}>{it}</Text>
            </View>
          ))}
          {briefing.focus ? <Text style={styles.focus}>{briefing.focus}</Text> : null}
        </>
      ) : (
        <Text style={styles.item}>{loading ? 'Preparing your plan…' : 'Your daily briefing will appear here.'}</Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.glassBorder },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  badge: { ...type.label, color: colors.primaryDark },
  headline: { ...type.sectionTitle, marginBottom: spacing.md, lineHeight: 22 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bullet: { ...type.body, color: colors.primary, marginRight: spacing.sm, fontWeight: '800' },
  item: { ...type.body, flex: 1, lineHeight: 21 },
  focus: { ...type.caption, color: colors.primaryDark, marginTop: spacing.sm, fontStyle: 'italic', lineHeight: 18 },
});
