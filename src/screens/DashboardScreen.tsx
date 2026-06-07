import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { StatTile } from '@/components/StatTile';
import { useData } from '@/context/DataContext';
import { colors } from '@/theme/colors';
import { summarizeDay } from '@/utils/selectors';
import { formatDateLabel, formatDuration, todayISO } from '@/utils/date';

const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'];

export function DashboardScreen() {
  const { data, syncHealthData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const today = todayISO();
  const summary = summarizeDay(data, today);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncHealthData();
    } finally {
      setRefreshing(false);
    }
  };

  const netCalories = summary.caloriesIn - summary.caloriesOut;

  return (
    <ScreenContainer
      title="Today"
      subtitle={formatDateLabel(today)}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <View style={styles.grid}>
        <StatTile
          label="Calories in"
          value={`${summary.caloriesIn}`}
          accent={colors.meal}
        />
        <StatTile
          label="Calories out"
          value={`${summary.caloriesOut}`}
          accent={colors.exercise}
        />
        <StatTile
          label="Steps"
          value={summary.steps.toLocaleString()}
          accent={colors.exercise}
        />
        <StatTile
          label="Active time"
          value={formatDuration(summary.exerciseMinutes)}
          accent={colors.exercise}
        />
        <StatTile
          label="Sleep"
          value={summary.sleepMinutes ? formatDuration(summary.sleepMinutes) : '—'}
          accent={colors.sleep}
        />
        <StatTile
          label="Mood"
          value={
            summary.avgMood != null
              ? MOOD_FACES[Math.round(summary.avgMood) - 1]
              : '—'
          }
          accent={colors.mood}
        />
      </View>

      <Card title="Energy balance" accent={colors.primary}>
        <Text style={styles.balanceValue}>
          {netCalories >= 0 ? '+' : ''}
          {netCalories} kcal
        </Text>
        <Text style={styles.balanceHint}>
          {summary.caloriesIn} eaten · {summary.caloriesOut} burned today
        </Text>
      </Card>

      <Card title="Logged today" accent={colors.accent}>
        <Text style={styles.line}>🍽️  {summary.mealCount} meal(s)</Text>
        <Text style={styles.line}>
          🏃  {data.exercises.filter((e) => e.date === today).length} workout(s)
        </Text>
        <Text style={styles.line}>
          🧠  {data.moods.filter((m) => m.date === today).length} mood check-in(s)
        </Text>
        <Text style={styles.line}>
          😴  {data.sleep.filter((s) => s.date === today).length} sleep record(s)
        </Text>
        <Text style={styles.hint}>Pull down to sync your smartwatch data.</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  balanceValue: { fontSize: 30, fontWeight: '800', color: colors.text },
  balanceHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  line: { fontSize: 15, color: colors.text, marginBottom: 6 },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
});
