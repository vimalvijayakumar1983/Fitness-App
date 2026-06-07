import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme/colors';

interface Props {
  emoji: string;
  text: string;
}

/** Friendly placeholder shown when a list has no entries yet. */
export function EmptyState({ emoji, text }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl },
  emoji: { fontSize: 34, marginBottom: spacing.sm, opacity: 0.8 },
  text: { ...type.caption, textAlign: 'center', maxWidth: 240 },
});
