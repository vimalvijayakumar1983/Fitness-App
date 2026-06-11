import React, { useState } from 'react';
import { View } from 'react-native';
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
import { formatDuration, formatTime, todayISO } from '@/utils/date';

const QUALITY_FACES = ['😴', '😪', '😐', '🙂', '🤩'] as const;

/** Parses "HH:MM" → minutes since midnight, or null. */
function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function SleepScreen() {
  const { data, addSleep, removeEntry, syncHealthData } = useData();
  const { t } = useI18n();
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<MoodScore>(4);
  const [syncing, setSyncing] = useState(false);

  const today = todayISO();
  const todays = data.sleep.filter((s) => s.date === today);

  const bedMin = parseClock(bedtime);
  const wakeMin = parseClock(wakeTime);
  const canSave = bedMin != null && wakeMin != null;

  const onSave = () => {
    if (bedMin == null || wakeMin == null) return;
    const durationMinutes = wakeMin >= bedMin ? wakeMin - bedMin : 24 * 60 - bedMin + wakeMin;
    addSleep({
      date: today,
      bedtime: `${today}T${bedtime}:00.000Z`,
      wakeTime: `${today}T${wakeTime}:00.000Z`,
      durationMinutes,
      quality,
      source: 'manual',
    });
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
    <ScreenContainer title={t('nav.sleep')} subtitle={t('sleep.subtitle')} onRefresh={onSync} refreshing={syncing}>
      <Card title="Log sleep">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TextField
            label="Bedtime"
            placeholder="23:00"
            value={bedtime}
            onChangeText={setBedtime}
            style={{ flex: 1 } as any}
          />
          <TextField
            label="Wake time"
            placeholder="07:00"
            value={wakeTime}
            onChangeText={setWakeTime}
            style={{ flex: 1 } as any}
          />
        </View>
        <RatingSelector
          label="Quality"
          value={quality}
          onChange={setQuality}
          scale={QUALITY_FACES}
          accent={colors.sleep}
        />
        <PrimaryButton
          label="Add sleep record"
          onPress={onSave}
          gradient={gradients.sleep}
          disabled={!canSave}
        />
      </Card>

      <SectionHeader title="Recent sleep" />
      {todays.length === 0 ? (
        <Card>
          <EmptyState emoji="🌙" text="No sleep logged for today. Add a record or sync your watch." />
        </Card>
      ) : (
        todays.map((s) => (
          <EntryRow
            key={s.id}
            emoji={QUALITY_FACES[s.quality - 1]}
            gradient={gradients.sleep}
            title={formatDuration(s.durationMinutes)}
            subtitle={`${formatTime(s.bedtime)} → ${formatTime(s.wakeTime)}`}
            meta={s.source === 'manual' ? 'Manual' : 'From watch'}
            onRemove={() => removeEntry('sleep', s.id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}
