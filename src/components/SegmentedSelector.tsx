import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface Props<T extends string> {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  accent?: string;
}

/** Horizontal pill selector for picking one option from a small set. */
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
                : { borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.textInverse : colors.textMuted },
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 14, fontWeight: '600' },
});
