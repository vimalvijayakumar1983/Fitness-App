import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/theme/colors';
import { IconBadge } from './IconBadge';
import { Thumb } from './Thumb';

interface Props {
  emoji: string;
  gradient: readonly [string, string];
  title: string;
  subtitle?: string;
  meta?: string;
  /** Big value shown on the right (e.g. "320 kcal"). */
  value?: string;
  /** Optional photo thumbnail; falls back to the emoji badge. */
  imageUrl?: string;
  onRemove?: () => void;
}

/** A single logged item — icon badge, title/subtitle, optional value & remove. */
export function EntryRow({ emoji, gradient, title, subtitle, meta, value, imageUrl, onRemove }: Props) {
  return (
    <View style={styles.row}>
      {imageUrl ? (
        <Thumb uri={imageUrl} emoji={emoji} colors={gradient} size={42} />
      ) : (
        <IconBadge emoji={emoji} colors={gradient} size={42} />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View style={styles.trailing}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  body: { flex: 1, marginLeft: spacing.md },
  title: { ...type.body, fontWeight: '700' },
  subtitle: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  meta: { ...type.caption, marginTop: 2 },
  trailing: { alignItems: 'flex-end', marginLeft: spacing.sm },
  value: { ...type.body, fontWeight: '700', color: colors.text },
  remove: { fontSize: 12, fontWeight: '600', color: colors.danger, marginTop: 4 },
});
