import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { StatTile } from '@/components/StatTile';
import { ActivityRing } from '@/components/ActivityRing';
import { ProgressBar } from '@/components/ProgressBar';
import { Sparkline } from '@/components/Sparkline';
import { EntryRow } from '@/components/EntryRow';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, shadow, spacing, type } from '@/theme/colors';
import { summarizeDay } from '@/utils/selectors';
import { formatDuration, todayISO, toISODate } from '@/utils/date';

const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'];

// Sensible default goals for the rings until backend goals are wired in.
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

export function DashboardScreen() {
  const { data, syncHealthData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const today = todayISO();
  const s = summarizeDay(data, today);

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
  const hasTrend = series.some((v) => v > 0);

  // Merge recent entries into a single timeline.
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
      {/* Hero: concentric activity rings + legend */}
      <LinearGradient
        colors={gradients.hero as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.ringStack}>
          <ActivityRing
            progress={s.caloriesOut / GOALS.caloriesOut}
            size={132}
            strokeWidth={13}
            colors={gradients.exercise}
            trackColor="rgba(79,168,126,0.18)"
          />
          <View style={styles.ringAbs}>
            <ActivityRing
              progress={s.steps / GOALS.steps}
              size={100}
              strokeWidth={13}
              colors={gradients.coral}
              trackColor="rgba(232,137,107,0.18)"
            />
          </View>
          <View style={styles.ringAbs}>
            <ActivityRing
              progress={s.sleepMinutes / GOALS.sleepMin}
              size={68}
              strokeWidth={13}
              colors={gradients.sleep}
              trackColor="rgba(91,127,209,0.18)"
            />
          </View>
        </View>

        <View style={styles.legend}>
          <Legend color={colors.exercise} label="Move" value={`${s.caloriesOut} / ${GOALS.caloriesOut} kcal`} />
          <Legend color={colors.meal} label="Steps" value={`${s.steps.toLocaleString()} / ${(GOALS.steps / 1000)}k`} />
          <Legend color={colors.sleep} label="Sleep" value={s.sleepMinutes ? `${formatDuration(s.sleepMinutes)} / 8h` : '— / 8h'} />
        </View>
      </LinearGradient>

      {/* Quick metrics */}
      <View style={styles.grid}>
        <StatTile emoji="🍽️" label="Calories in" value={`${s.caloriesIn}`} unit="kcal" gradient={gradients.meal} />
        <StatTile emoji="🔥" label="Active time" value={formatDuration(s.exerciseMinutes)} gradient={gradients.exercise} />
        <StatTile emoji="💧" label="Water" value="—" unit="L" gradient={gradients.water} />
        <StatTile
          emoji="🧠"
          label="Mood"
          value={s.avgMood != null ? MOOD_FACES[Math.round(s.avgMood) - 1] : '—'}
          gradient={gradients.mind}
        />
      </View>

      {/* Energy balance */}
      <Card title="Energy balance">
        <Text style={type.metric}>
          {calBalance >= 0 ? '+' : ''}
          {calBalance}
          <Text style={styles.kcal}> kcal</Text>
        </Text>
        <Text style={styles.balanceHint}>
          {s.caloriesIn} eaten · {s.caloriesOut} burned
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <ProgressBar
            progress={s.caloriesIn / (GOALS.caloriesOut + 2000)}
            colors={gradients.coral}
          />
        </View>
      </Card>

      {/* Steps trend */}
      <Card title="Steps · last 7 days">
        {hasTrend ? (
          <Sparkline data={series} width={300} height={70} color={colors.exercise} fillColors={gradients.exercise} />
        ) : (
          <Text style={styles.balanceHint}>Sync your watch or log a workout to see your trend.</Text>
        )}
      </Card>

      {/* Today timeline */}
      <Text style={[type.sectionTitle, styles.timelineTitle]}>Today's activity</Text>
      {timeline.length === 0 ? (
        <Card>
          <Text style={styles.balanceHint}>Nothing logged yet. Pull down to sync your smartwatch, or add a meal.</Text>
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

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadow.md,
  },
  ringStack: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  ringAbs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, marginLeft: spacing.xl, gap: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  legendLabel: { ...type.label, color: colors.textSecondary },
  legendValue: { ...type.body, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },

  kcal: { ...type.body, color: colors.textSecondary, fontWeight: '400' },
  balanceHint: { ...type.caption, marginTop: spacing.sm, lineHeight: 19 },

  timelineTitle: { marginTop: spacing.sm, marginBottom: spacing.md },
});
