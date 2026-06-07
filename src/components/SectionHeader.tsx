import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, type } from '@/theme/colors';

interface Props {
  title: string;
  trailing?: string;
}

/** Row with a section title and an optional right-aligned value. */
export function SectionHeader({ title, trailing }: Props) {
  return (
    <View style={styles.row}>
      <Text style={type.sectionTitle}>{title}</Text>
      {trailing ? <Text style={type.caption}>{trailing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
