import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';

interface Props {
  ml: number;
  goalMl: number;
  onAdd: (ml: number) => void;
}

const QUICK = [250, 500];

/** Water intake widget with progress and quick-add buttons. */
export function WaterTracker({ ml, goalMl, onAdd }: Props) {
  const liters = (ml / 1000).toFixed(2);
  const goalL = (goalMl / 1000).toFixed(1);
  const glasses = Math.round(ml / 250);
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.value}>
          {liters}<Text style={styles.unit}> / {goalL} L</Text>
        </Text>
        <Text style={styles.glasses}>💧 {glasses} {glasses === 1 ? 'glass' : 'glasses'}</Text>
      </View>
      <ProgressBar progress={goalMl ? ml / goalMl : 0} colors={gradients.water} height={10} />
      <View style={styles.buttons}>
        {QUICK.map((amount) => (
          <Pressable key={amount} style={styles.btn} onPress={() => onAdd(amount)}>
            <Text style={styles.btnText}>+{amount} ml</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  value: { ...type.metricSmall, color: colors.text },
  unit: { ...type.caption, color: colors.textSecondary },
  glasses: { ...type.caption, color: colors.water, fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: {
    flex: 1,
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: colors.water, fontWeight: '700', fontSize: 14 },
});
