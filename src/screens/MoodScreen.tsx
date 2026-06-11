import React, { useState } from 'react';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RatingSelector } from '@/components/RatingSelector';
import { TextField } from '@/components/TextField';
import { EntryRow } from '@/components/EntryRow';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useData } from '@/context/DataContext';
import { useI18n } from '@/i18n';
import { colors, gradients, spacing } from '@/theme/colors';
import { MoodScore } from '@/models/types';
import { formatTime, todayISO } from '@/utils/date';

const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'] as const;

export function MoodScreen() {
  const { data, addMood, removeEntry } = useData();
  const { t } = useI18n();
  const [mood, setMood] = useState<MoodScore>(3);
  const [stress, setStress] = useState<MoodScore>(3);
  const [energy, setEnergy] = useState<MoodScore>(3);
  const [notes, setNotes] = useState('');

  const today = todayISO();
  const todays = data.moods.filter((m) => m.date === today);

  const onSave = () => {
    addMood({ date: today, mood, stress, energy, notes: notes.trim() || undefined });
    setMood(3);
    setStress(3);
    setEnergy(3);
    setNotes('');
  };

  return (
    <ScreenContainer title={t('nav.mind')} subtitle={t('mind.subtitle')}>
      <Card title="How are you feeling?">
        <RatingSelector label="Mood" value={mood} onChange={setMood} scale={MOOD_FACES} accent={colors.mind} />
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
          accent={colors.exercise}
        />
        <TextField
          label="Notes (optional)"
          placeholder="What's on your mind?"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ minHeight: 70, textAlignVertical: 'top', paddingTop: 12 }}
        />
        <PrimaryButton
          label="Save check-in"
          onPress={onSave}
          gradient={gradients.mind}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Today's check-ins" />
      {todays.length === 0 ? (
        <Card>
          <EmptyState emoji="🧘" text="No check-ins yet today. Take a moment to log how you feel." />
        </Card>
      ) : (
        todays.map((m) => (
          <EntryRow
            key={m.id}
            emoji={MOOD_FACES[m.mood - 1]}
            gradient={gradients.mind}
            title={`Mood ${MOOD_FACES[m.mood - 1]}`}
            subtitle={[
              `Stress ${m.stress ?? '—'}`,
              `Energy ${m.energy ?? '—'}`,
              m.notes ? `“${m.notes}”` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            meta={formatTime(m.loggedAt)}
            onRemove={() => removeEntry('moods', m.id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}
