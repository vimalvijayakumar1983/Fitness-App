import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { EntryRow } from '@/components/EntryRow';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { IconBadge } from '@/components/IconBadge';
import { ExercisePickerModal } from '@/components/ExercisePickerModal';
import { useData } from '@/context/DataContext';
import { useI18n } from '@/i18n';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import { activeProviderName } from '@/services/health/healthService';
import { estimateCalories } from '@/data/exercises';
import { exerciseEmojiName } from '@/utils/images';
import { formatDuration, formatTime, todayISO } from '@/utils/date';

export function ExerciseScreen() {
  const { data, cms, addExercise, removeEntry, syncHealthData, upsertCustomExercise, deleteCustomExercise } = useData();
  const { t } = useI18n();
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedMet, setSelectedMet] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const today = todayISO();
  const todays = data.exercises.filter((e) => e.date === today);
  const mins = Number.parseInt(duration, 10) || 0;
  const canSave = activity.trim().length > 0 && mins > 0;
  const estimate = selectedMet && mins ? estimateCalories(selectedMet, mins, data.profile.weightKg) : 0;

  const onSave = () => {
    if (!canSave) return;
    addExercise({
      date: today,
      activity: activity.trim(),
      durationMinutes: mins,
      caloriesBurned: Number.parseInt(calories, 10) || estimate || undefined,
      source: 'manual',
    });
    setActivity('');
    setDuration('');
    setCalories('');
    setSelectedMet(null);
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
    <ScreenContainer title={t('nav.exercise')} subtitle={t('exercise.subtitle')} onRefresh={onSync} refreshing={syncing}>
      <Card padded={false} style={styles.syncCard}>
        <View style={styles.syncRow}>
          <IconBadge emoji="⌚" colors={gradients.exercise} size={46} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.syncTitle}>{t('exercise.smartwatch')}</Text>
            <Text style={type.caption}>Connected: {activeProviderName()}</Text>
          </View>
        </View>
        <PrimaryButton
          label={syncing ? 'Syncing…' : t('exercise.syncNow')}
          onPress={onSync}
          variant="soft"
          color={colors.exercise}
          loading={syncing}
          style={{ margin: spacing.lg, marginTop: 0 }}
        />
      </Card>

      {/* Wearables / devices */}
      <Card title={t('exercise.connectDevice')}>
        {[
          { name: 'Apple Health', emoji: '🍎' },
          { name: 'Google Fit', emoji: '🟢' },
          { name: 'Fitbit', emoji: '⌚' },
        ].map((d) => (
          <View key={d.name} style={styles.deviceRow}>
            <Text style={styles.deviceEmoji}>{d.emoji}</Text>
            <Text style={styles.deviceName}>{d.name}</Text>
            <Pressable style={styles.connectBtn} onPress={onSync}>
              <Text style={styles.connectText}>{syncing ? 'Syncing…' : 'Connect'}</Text>
            </Pressable>
          </View>
        ))}
        <Text style={styles.deviceNote}>Live device sync (Apple Health / Health Connect / Fitbit) activates in the mobile app. On web, "Connect" pulls demo data.</Text>
      </Card>

      <Card title={t('exercise.logWorkout')}>
        <PrimaryButton
          label={t('exercise.browse')}
          onPress={() => setPickerOpen(true)}
          gradient={gradients.exercise}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>details</Text>
          <View style={styles.line} />
        </View>

        <TextField
          label={t('exercise.activity')}
          placeholder="e.g. Running"
          value={activity}
          onChangeText={(t) => {
            setActivity(t);
            setSelectedMet(null);
          }}
        />
        <TextField
          label={t('exercise.duration')}
          placeholder="e.g. 30"
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
        />
        <TextField
          label={t('exercise.caloriesOpt')}
          placeholder={estimate ? `≈ ${estimate}` : 'e.g. 250'}
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        {estimate > 0 ? (
          <Text style={styles.estimate}>
            Estimated from intensity: ≈ {estimate} kcal for {mins} min
          </Text>
        ) : null}
        <PrimaryButton
          label={t('exercise.add')}
          onPress={onSave}
          gradient={gradients.primary}
          disabled={!canSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title={t('exercise.todays')} />
      {todays.length === 0 ? (
        <Card>
          <EmptyState emoji="🏃" text={t('exercise.empty')} />
        </Card>
      ) : (
        todays.map((ex) => (
          <EntryRow
            key={ex.id}
            emoji={exerciseEmojiName(ex.activity)}
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

      <ExercisePickerModal
        visible={pickerOpen}
        customExercises={data.customExercises}
        cmsExercises={cms.exercises}
        onPick={(ex) => {
          setActivity(ex.name);
          setSelectedMet(ex.met);
          setCalories('');
        }}
        onUpsert={upsertCustomExercise}
        onDelete={deleteCustomExercise}
        onClose={() => setPickerOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  syncCard: { overflow: 'hidden' },
  syncRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  syncTitle: { ...type.body, fontWeight: '700' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  deviceEmoji: { fontSize: 22, marginRight: spacing.md },
  deviceName: { ...type.body, fontWeight: '600', flex: 1 },
  connectBtn: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.primary },
  connectText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  deviceNote: { ...type.caption, marginTop: spacing.md, lineHeight: 18 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...type.caption, color: colors.textMuted },
  estimate: { ...type.caption, color: colors.exercise, marginTop: -spacing.xs, marginBottom: spacing.sm },
});
