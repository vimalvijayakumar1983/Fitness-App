import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/colors';

interface Props<T extends string> {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  accent?: string;
}

/** Pill selector for picking one option from a small set. */
export function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
  accent = colors.primary,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.pill,
              selected
                ? { backgroundColor: accent, borderColor: accent }
                : { borderColor: colors.border, backgroundColor: colors.backgroundAlt },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.textInverse : colors.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  label: { fontSize: 14, fontWeight: '600' },
});
