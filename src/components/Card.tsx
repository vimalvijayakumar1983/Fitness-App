import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/theme/colors';

interface Props {
  title?: string;
  /** Optional small element rendered on the right of the title row. */
  trailing?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

/** Elevated white surface — large radius, very soft shadow. */
export function Card({ title, trailing, children, style, padded = true }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {title ? (
        <View style={styles.titleRow}>
          <Text style={type.sectionTitle}>{title}</Text>
          {trailing}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  padded: { padding: spacing.xl },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
});
