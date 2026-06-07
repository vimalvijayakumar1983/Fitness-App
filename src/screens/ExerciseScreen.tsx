import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { EntryRow } from '@/components/EntryRow';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { IconBadge } from '@/components/IconBadge';
import { useData } from '@/context/DataContext';
import { colors, gradients, spacing, type } from '@/theme/colors';
import { activeProviderName } from '@/services/health/healthService';
import { formatDuration, formatTime, todayISO } from '@/utils/date';

export function ExerciseScreen() {
  const { data, addExercise, removeEntry, syncHealthData } = useData();
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [syncing, setSyncing] = useState(false);

  const today = todayISO();
  const todays = data.exercises.filter((e) => e.date === today);
  const canSave = activity.trim().length > 0 && Number(duration) > 0;

  const onSave = () => {
    if (!canSave) return;
    addExercise({
      date: today,
      activity: activity.trim(),
      durationMinutes: Number.parseInt(duration, 10) || 0,
      caloriesBurned: Number.parseInt(calories, 10) || undefined,
      source: 'manual',
    });
    setActivity('');
    setDuration('');
    setCalories('');
  };

  const onSync = async () => {
    setSyncing(true);
    try {
      await syncHealthData();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScreenContainer title="Exercise" subtitle="Movement" onRefresh={onSync} refreshing={syncing}>
      <Card padded={false} style={styles.syncCard}>
        <View style={styles.syncRow}>
          <IconBadge emoji="⌚" colors={gradients.exercise} size={46} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.syncTitle}>Smartwatch</Text>
            <Text style={type.caption}>Connected: {activeProviderName()}</Text>
          </View>
        </View>
        <PrimaryButton
          label={syncing ? 'Syncing…' : 'Sync now'}
          onPress={onSync}
          variant="soft"
          color={colors.exercise}
          loading={syncing}
          style={{ margin: spacing.lg, marginTop: 0 }}
        />
      </Card>

      <Card title="Log a workout">
        <TextField label="Activity" placeholder="e.g. Running" value={activity} onChangeText={setActivity} />
        <TextField
          label="Duration (min)"
          placeholder="e.g. 30"
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
        />
        <TextField
          label="Calories burned (optional)"
          placeholder="e.g. 250"
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        <PrimaryButton
          label="Add workout"
          onPress={onSave}
          gradient={gradients.primary}
          disabled={!canSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Today's activity" />
      {todays.length === 0 ? (
        <Card>
          <EmptyState emoji="🏃" text="Nothing logged yet. Sync your watch or add a workout above." />
        </Card>
      ) : (
        todays.map((ex) => (
          <EntryRow
            key={ex.id}
            emoji="🏃"
            gradient={gradients.exercise}
            title={ex.activity}
            subtitle={[
              formatDuration(ex.durationMinutes),
              ex.steps ? `${ex.steps.toLocaleString()} steps` : null,
              ex.avgHeartRate ? `${ex.avgHeartRate} bpm` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            meta={`${ex.source === 'manual' ? 'Manual' : 'From watch'} · ${formatTime(ex.loggedAt)}`}
            value={ex.caloriesBurned ? `${ex.caloriesBurned} kcal` : undefined}
            onRemove={() => removeEntry('exercises', ex.id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  syncCard: { overflow: 'hidden' },
  syncRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  syncTitle: { ...type.body, fontWeight: '700' },
});
