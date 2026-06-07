import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { StatTile } from '@/components/StatTile';
import { ActivityRing } from '@/components/ActivityRing';
import { ProgressBar } from '@/components/ProgressBar';
import { ReadinessGauge } from '@/components/ReadinessGauge';
import { BarChart } from '@/components/BarChart';
import { MacroSummary } from '@/components/MacroSummary';
import { EntryRow } from '@/components/EntryRow';
import { useData } from '@/context/DataContext';
import { colors, gradients, hexA, glow, radius, shadow, spacing, type } from '@/theme/colors';
import { summarizeDay, summarizeMacros, waterMl, computeReadiness, computeStreak } from '@/utils/selectors';
import { formatDuration, todayISO, toISODate } from '@/utils/date';

const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'];
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const GOALS = { caloriesOut: 500, steps: 10000, sleepMin: 480 };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Steps for each of the last `n` days (oldest→newest) from logged exercises. */
function stepsSeries(exercises: { date: string; steps?: number }[], n: number): number[] {
  const byDate = new Map<string, number>();
  for (const e of exercises) byDate.set(e.date, (byDate.get(e.date) ?? 0) + (e.steps ?? 0));
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(byDate.get(toISODate(d)) ?? 0);
  }
  return out;
}

/** Labels (day initials) for the last `n` days, oldest→newest. */
function dayLabels(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(DAY_INITIALS[d.getDay()]);
  }
  return out;
}

export function DashboardScreen() {
  const { data, syncHealthData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const today = todayISO();
  const s = summarizeDay(data, today);
  const macros = summarizeMacros(data, today);
  const water = waterMl(data, today);
  const readiness = computeReadiness(data, today);
  const streak = computeStreak(data);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncHealthData();
    } finally {
      setRefreshing(false);
    }
  };

  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const series = stepsSeries(data.exercises, 7);
  const labels = dayLabels(7);
  const hasTrend = series.some((v) => v > 0);
  const weeklyAvg = Math.round(series.reduce((a, b) => a + b, 0) / 7);

  const timeline = [
    ...data.meals.filter((m) => m.date === today).map((m) => ({
      key: m.id,
      at: m.loggedAt,
      emoji: '🍽️',
      gradient: gradients.meal,
      title: m.type[0].toUpperCase() + m.type.slice(1),
      subtitle: m.items.map((i) => i.name).join(', '),
    })),
    ...data.exercises.filter((e) => e.date === today).map((e) => ({
      key: e.id,
      at: e.loggedAt,
      emoji: '🏃',
      gradient: gradients.exercise,
      title: e.activity,
      subtitle: `${formatDuration(e.durationMinutes)}${e.steps ? ` · ${e.steps.toLocaleString()} steps` : ''}`,
    })),
    ...data.moods.filter((m) => m.date === today).map((m) => ({
      key: m.id,
      at: m.loggedAt,
      emoji: '🧠',
      gradient: gradients.mind,
      title: 'Mood check-in',
      subtitle: `Feeling ${MOOD_FACES[m.mood - 1]}`,
    })),
    ...data.sleep.filter((sl) => sl.date === today).map((sl) => ({
      key: sl.id,
      at: sl.loggedAt,
      emoji: '😴',
      gradient: gradients.sleep,
      title: 'Sleep',
      subtitle: formatDuration(sl.durationMinutes),
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);

  const calBalance = s.caloriesIn - s.caloriesOut;

  return (
    <ScreenContainer
      title={greeting()}
      subtitle={dateLabel}
      onRefresh={onRefresh}
      refreshing={refreshing}
      right={
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>V</Text>
        </View>
      }
    >
      {/* Streak chip */}
      {streak > 0 ? (
        <View style={styles.streakRow}>
          <View style={styles.streakChip}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak}-day streak</Text>
          </View>
        </View>
      ) : null}

      {/* Hero: Readiness score gauge + subscores */}
      <LinearGradient
        colors={gradients.hero as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={[styles.gaugeWrap, glow(colors.primary, 0.35)]}>
          <ReadinessGauge score={readiness.score} caption={readiness.caption} size={208} />
        </View>
        <View style={styles.subscores}>
          <Subscore label="Sleep" value={readiness.sleep} color={colors.sleep} />
          <Subscore label="Activity" value={readiness.activity} color={colors.exercise} />
          <Subscore label="Mind" value={readiness.mind} color={colors.mind} />
        </View>
      </LinearGradient>

      {/* Activity rings */}
      <Card title="Activity rings">
        <View style={styles.ringsCard}>
          <View style={styles.ringStack}>
            <ActivityRing
              progress={s.caloriesOut / GOALS.caloriesOut}
              size={128}
              strokeWidth={12}
              colors={gradients.exercise}
              trackColor="rgba(255,255,255,0.06)"
            />
            <View style={styles.ringAbs}>
              <ActivityRing
                progress={s.steps / GOALS.steps}
                size={98}
                strokeWidth={12}
                colors={gradients.coral}
                trackColor="rgba(255,255,255,0.06)"
              />
            </View>
            <View style={styles.ringAbs}>
              <ActivityRing
                progress={s.sleepMinutes / GOALS.sleepMin}
                size={68}
                strokeWidth={12}
                colors={gradients.sleep}
                trackColor="rgba(255,255,255,0.06)"
              />
            </View>
          </View>
          <View style={styles.legend}>
            <Legend color={colors.exercise} label="Move" value={`${s.caloriesOut} / ${GOALS.caloriesOut} kcal`} />
            <Legend color={colors.accent} label="Steps" value={`${s.steps.toLocaleString()} / ${GOALS.steps / 1000}k`} />
            <Legend color={colors.sleep} label="Sleep" value={s.sleepMinutes ? `${formatDuration(s.sleepMinutes)} / 8h` : '— / 8h'} />
          </View>
        </View>
      </Card>

      {/* Nutrition macros */}
      <Card title="Nutrition">
        <MacroSummary
          totals={macros}
          calorieTarget={data.profile.calorieTarget}
          macroTargets={data.profile.macroTargets}
        />
      </Card>

      {/* Quick metrics */}
      <View style={styles.grid}>
        <StatTile emoji="🍽️" label="Calories in" value={`${s.caloriesIn}`} unit="kcal" gradient={gradients.meal} />
        <StatTile emoji="🔥" label="Active time" value={formatDuration(s.exerciseMinutes)} gradient={gradients.exercise} />
        <StatTile emoji="💧" label="Water" value={(water / 1000).toFixed(1)} unit="L" gradient={gradients.water} />
        <StatTile
          emoji="🧠"
          label="Mood"
          value={s.avgMood != null ? MOOD_FACES[Math.round(s.avgMood) - 1] : '—'}
          gradient={gradients.mind}
        />
      </View>

      {/* Weekly steps bar chart */}
      <Card
        title="Steps · this week"
        trailing={<Text style={styles.avgPill}>avg {weeklyAvg.toLocaleString()}</Text>}
      >
        {hasTrend ? (
          <BarChart data={series} labels={labels} colors={gradients.exercise} goal={GOALS.steps} height={130} />
        ) : (
          <Text style={styles.hint}>Sync your watch or log a workout to see your weekly trend.</Text>
        )}
      </Card>

      {/* Energy balance */}
      <Card title="Energy balance">
        <Text style={type.metric}>
          {calBalance >= 0 ? '+' : ''}
          {calBalance}
          <Text style={styles.kcal}> kcal</Text>
        </Text>
        <Text style={styles.hint}>
          {s.caloriesIn} eaten · {s.caloriesOut} burned
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <ProgressBar progress={s.caloriesIn / (GOALS.caloriesOut + 2000)} colors={gradients.coral} />
        </View>
      </Card>

      {/* Today timeline */}
      <Text style={[type.sectionTitle, styles.timelineTitle]}>Today's activity</Text>
      {timeline.length === 0 ? (
        <Card>
          <Text style={styles.hint}>Nothing logged yet. Pull down to sync your smartwatch, or add a meal.</Text>
        </Card>
      ) : (
        timeline.map((t) => (
          <EntryRow
            key={t.key}
            emoji={t.emoji}
            gradient={t.gradient}
            title={t.title}
            subtitle={t.subtitle}
            meta={new Date(t.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          />
        ))
      )}
    </ScreenContainer>
  );
}

function Subscore({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.subscore}>
      <View style={styles.subscoreHead}>
        <Text style={styles.subscoreLabel}>{label}</Text>
        <Text style={[styles.subscoreVal, { color }]}>{value}</Text>
      </View>
      <ProgressBar progress={value / 100} colors={[color, color]} height={5} />
    </View>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  avatarText: { color: colors.textInverse, fontSize: 18, fontWeight: '700' },

  streakRow: { flexDirection: 'row', marginBottom: spacing.md },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: hexA(colors.accent, 0.3),
  },
  streakEmoji: { fontSize: 14, marginRight: 6 },
  streakText: { ...type.label, color: colors.accent, letterSpacing: 0.3 },

  hero: {
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadow.md,
  },
  gaugeWrap: { borderRadius: radius.pill, marginBottom: spacing.lg },
  subscores: { flexDirection: 'row', gap: spacing.lg, width: '100%' },
  subscore: { flex: 1 },
  subscoreHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  subscoreLabel: { ...type.label, color: colors.textSecondary },
  subscoreVal: { fontSize: 15, fontWeight: '700' },

  ringsCard: { flexDirection: 'row', alignItems: 'center' },
  ringStack: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  ringAbs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, marginLeft: spacing.xl, gap: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  legendLabel: { ...type.label, color: colors.textSecondary },
  legendValue: { ...type.body, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },

  avgPill: { ...type.caption, color: colors.textSecondary, fontWeight: '600' },
  kcal: { ...type.body, color: colors.textSecondary, fontWeight: '400' },
  hint: { ...type.caption, marginTop: spacing.sm, lineHeight: 19 },

  timelineTitle: { marginTop: spacing.sm, marginBottom: spacing.md },
});
