import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useData } from '@/context/DataContext';
import { colors } from '@/theme/colors';
import { activeProviderName } from '@/services/health/healthService';
import { formatDuration, formatTime, todayISO } from '@/utils/date';

export function ExerciseScreen() {
  const { data, addExercise, removeEntry, syncHealthData } = useData();
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [syncing, setSyncing] = useState(false);

  const today = todayISO();
  const todaysExercises = data.exercises.filter((e) => e.date === today);
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
    <ScreenContainer
      title="Exercise"
      subtitle="Movement & workouts"
      onRefresh={onSync}
      refreshing={syncing}
    >
      <Card title="Smartwatch sync" accent={colors.exercise}>
        <Text style={styles.syncText}>
          Connected provider: <Text style={styles.bold}>{activeProviderName()}</Text>
        </Text>
        <Text style={styles.hint}>
          Pull steps, workouts and heart rate from your watch. (Currently using
          mock data until the native HealthKit / Health Connect module is added.)
        </Text>
        <PrimaryButton
          label="Sync now"
          onPress={onSync}
          color={colors.exercise}
          variant="outline"
          loading={syncing}
          style={{ marginTop: 14 }}
        />
      </Card>

      <Card title="Log a workout manually" accent={colors.exercise}>
        <Text style={styles.fieldLabel}>Activity</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Running"
          placeholderTextColor={colors.textMuted}
          value={activity}
          onChangeText={setActivity}
        />
        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Duration (min)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 30"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
        />
        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
          Calories burned (optional)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 250"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        <PrimaryButton
          label="Add workout"
          onPress={onSave}
          color={colors.exercise}
          disabled={!canSave}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Text style={styles.sectionTitle}>Today's activity</Text>
      {todaysExercises.length === 0 ? (
        <Text style={styles.empty}>Nothing logged yet today.</Text>
      ) : (
        todaysExercises.map((ex) => (
          <Card key={ex.id} accent={colors.exercise}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.activity}>{ex.activity}</Text>
                <Text style={styles.detail}>
                  {formatDuration(ex.durationMinutes)}
                  {ex.caloriesBurned ? ` · ${ex.caloriesBurned} kcal` : ''}
                  {ex.steps ? ` · ${ex.steps.toLocaleString()} steps` : ''}
                  {ex.avgHeartRate ? ` · ${ex.avgHeartRate} bpm` : ''}
                </Text>
                <Text style={styles.meta}>
                  {ex.source === 'manual' ? 'Manual' : 'From watch'} ·{' '}
                  {formatTime(ex.loggedAt)}
                </Text>
              </View>
              <Pressable onPress={() => removeEntry('exercises', ex.id)}>
                <Text style={styles.delete}>Remove</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  syncText: { fontSize: 15, color: colors.text },
  bold: { fontWeight: '700' },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  activity: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, color: colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  delete: { fontSize: 13, fontWeight: '600', color: colors.danger },
});
