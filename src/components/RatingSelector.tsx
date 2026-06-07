import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/colors';
import type { MoodScore } from '@/models/types';

interface Props {
  label: string;
  value: MoodScore;
  onChange: (value: MoodScore) => void;
  /** Emoji or short text shown for each step (1..5). */
  scale?: readonly string[];
  accent?: string;
}

const SCORES: MoodScore[] = [1, 2, 3, 4, 5];

/** 1..5 rating row used for mood, stress, energy and sleep quality. */
export function RatingSelector({
  label,
  value,
  onChange,
  scale,
  accent = colors.mind,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {SCORES.map((score) => {
          const selected = score === value;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              style={[
                styles.dot,
                selected
                  ? { backgroundColor: accent, borderColor: accent, transform: [{ scale: 1.06 }] }
                  : { borderColor: colors.border, backgroundColor: colors.backgroundAlt },
              ]}
            >
              <Text
                style={[
                  styles.dotText,
                  { color: selected ? colors.textInverse : colors.textSecondary },
                  scale ? styles.emoji : null,
                ]}
              >
                {scale ? scale[score - 1] : score}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  dot: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 18, fontWeight: '700' },
  emoji: { fontSize: 22 },
});
