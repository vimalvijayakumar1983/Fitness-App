import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  label: string;
  value: string;
  accent?: string;
}

/** Compact metric tile for the dashboard summary grid. */
export function StatTile({ label, value, accent = colors.primary }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  value: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
