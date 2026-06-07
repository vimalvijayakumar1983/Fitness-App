import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RatingSelector } from '@/components/RatingSelector';
import { useData } from '@/context/DataContext';
import { colors } from '@/theme/colors';
import { MoodScore } from '@/models/types';
import { formatDuration, formatTime, todayISO } from '@/utils/date';

const QUALITY_FACES = ['😴', '😪', '😐', '🙂', '🤩'] as const;

/** Parses a "HH:MM" string into minutes since midnight, or null. */
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
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<MoodScore>(4);
  const [syncing, setSyncing] = useState(false);

  const today = todayISO();
  const todaysSleep = data.sleep.filter((s) => s.date === today);

  const bedMin = parseClock(bedtime);
  const wakeMin = parseClock(wakeTime);
  const canSave = bedMin != null && wakeMin != null;

  const onSave = () => {
    if (bedMin == null || wakeMin == null) return;
    // If wake is earlier than bedtime, sleep crossed midnight.
    const durationMinutes =
      wakeMin >= bedMin ? wakeMin - bedMin : 24 * 60 - bedMin + wakeMin;

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
    <ScreenContainer
      title="Sleep"
      subtitle="Rest & recovery"
      onRefresh={onSync}
      refreshing={syncing}
    >
      <Card title="Log sleep" accent={colors.sleep}>
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Bedtime</Text>
            <TextInput
              style={styles.input}
              placeholder="23:00"
              placeholderTextColor={colors.textMuted}
              value={bedtime}
              onChangeText={setBedtime}
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Wake time</Text>
            <TextInput
              style={styles.input}
              placeholder="07:00"
              placeholderTextColor={colors.textMuted}
              value={wakeTime}
              onChangeText={setWakeTime}
            />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <RatingSelector
            label="Quality"
            value={quality}
            onChange={setQuality}
            scale={QUALITY_FACES}
            accent={colors.sleep}
          />
        </View>

        <PrimaryButton
          label="Add sleep record"
          onPress={onSave}
          color={colors.sleep}
          disabled={!canSave}
          style={{ marginTop: 8 }}
        />
        <Text style={styles.hint}>
          Or pull down to sync sleep from your smartwatch.
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Recent sleep</Text>
      {todaysSleep.length === 0 ? (
        <Text style={styles.empty}>No sleep logged for today yet.</Text>
      ) : (
        todaysSleep.map((s) => (
          <Card key={s.id} accent={colors.sleep}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.duration}>
                  {QUALITY_FACES[s.quality - 1]} {formatDuration(s.durationMinutes)}
                </Text>
                <Text style={styles.detail}>
                  {formatTime(s.bedtime)} → {formatTime(s.wakeTime)}
                </Text>
                <Text style={styles.meta}>
                  {s.source === 'manual' ? 'Manual' : 'From watch'}
                </Text>
              </View>
              <Pressable onPress={() => removeEntry('sleep', s.id)}>
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
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
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
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 10, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  duration: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, color: colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  delete: { fontSize: 13, fontWeight: '600', color: colors.danger },
});
