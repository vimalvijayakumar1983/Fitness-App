import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  title?: string;
  /** Optional left accent color (e.g. per-domain color). */
  accent?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** A simple elevated surface used throughout the app. */
export function Card({ title, accent, children, style }: Props) {
  return (
    <View
      style={[
        styles.card,
        accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null,
        style,
      ]}
    >
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
});
