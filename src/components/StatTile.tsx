import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/theme/colors';
import { IconBadge } from './IconBadge';

interface Props {
  emoji: string;
  label: string;
  value: string;
  unit?: string;
  gradient: readonly [string, string];
}

/** Compact metric tile: pastel icon badge + thin number + label. */
export function StatTile({ emoji, label, value, unit, gradient }: Props) {
  return (
    <View style={styles.tile}>
      <IconBadge emoji={emoji} colors={gradient} size={38} />
      <View style={styles.valueRow}>
        <Text style={type.metricSmall}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.md },
  unit: { ...type.caption, marginLeft: 4, color: colors.textSecondary },
  label: { ...type.caption, marginTop: 2 },
});
