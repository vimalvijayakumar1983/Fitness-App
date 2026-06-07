import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RatingSelector } from '@/components/RatingSelector';
import { useData } from '@/context/DataContext';
import { colors } from '@/theme/colors';
import { MoodScore } from '@/models/types';
import { formatTime, todayISO } from '@/utils/date';

const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'] as const;

export function MoodScreen() {
  const { data, addMood, removeEntry } = useData();
  const [mood, setMood] = useState<MoodScore>(3);
  const [stress, setStress] = useState<MoodScore>(3);
  const [energy, setEnergy] = useState<MoodScore>(3);
  const [notes, setNotes] = useState('');

  const today = todayISO();
  const todaysMoods = data.moods.filter((m) => m.date === today);

  const onSave = () => {
    addMood({
      date: today,
      mood,
      stress,
      energy,
      notes: notes.trim() || undefined,
    });
    setMood(3);
    setStress(3);
    setEnergy(3);
    setNotes('');
  };

  return (
    <ScreenContainer title="Mind" subtitle="Mood, stress & energy check-in">
      <Card title="How are you feeling?" accent={colors.mood}>
        <RatingSelector
          label="Mood"
          value={mood}
          onChange={setMood}
          scale={MOOD_FACES}
          accent={colors.mood}
        />
        <RatingSelector
          label="Stress (1 calm – 5 stressed)"
          value={stress}
          onChange={setStress}
          accent={colors.warning}
        />
        <RatingSelector
          label="Energy (1 drained – 5 energized)"
          value={energy}
          onChange={setEnergy}
          accent={colors.success}
        />

        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <PrimaryButton
          label="Save check-in"
          onPress={onSave}
          color={colors.mood}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Text style={styles.sectionTitle}>Today's check-ins</Text>
      {todaysMoods.length === 0 ? (
        <Text style={styles.empty}>No check-ins yet today.</Text>
      ) : (
        todaysMoods.map((m) => (
          <Card key={m.id} accent={colors.mood}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.face}>{MOOD_FACES[m.mood - 1]}</Text>
                <Text style={styles.detail}>
                  Stress {m.stress ?? '—'} · Energy {m.energy ?? '—'}
                </Text>
                {m.notes ? <Text style={styles.notes}>“{m.notes}”</Text> : null}
                <Text style={styles.meta}>{formatTime(m.loggedAt)}</Text>
              </View>
              <Pressable onPress={() => removeEntry('moods', m.id)}>
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 4,
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
    minHeight: 64,
    textAlignVertical: 'top',
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
  face: { fontSize: 28 },
  detail: { fontSize: 14, color: colors.text, marginTop: 4 },
  notes: { fontSize: 14, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  delete: { fontSize: 13, fontWeight: '600', color: colors.danger },
});
