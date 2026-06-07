import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityRing } from './ActivityRing';
import { ProgressBar } from './ProgressBar';
import { colors, gradients, spacing, type } from '@/theme/colors';
import type { MacroTotals } from '@/utils/selectors';
import type { MacroTargets } from '@/models/types';

interface Props {
  totals: MacroTotals;
  calorieTarget: number;
  macroTargets: MacroTargets;
}

const MACRO_COLORS = {
  protein: colors.exercise,
  carbs: colors.sleep,
  fat: colors.meal,
} as const;

/** MyFitnessPal-style daily summary: calorie ring + protein/carbs/fat bars. */
export function MacroSummary({ totals, calorieTarget, macroTargets }: Props) {
  const remaining = Math.max(0, calorieTarget - totals.calories);
  return (
    <View style={styles.row}>
      <View style={styles.ringWrap}>
        <ActivityRing
          progress={totals.calories / calorieTarget}
          size={128}
          strokeWidth={13}
          colors={gradients.coral}
          trackColor="rgba(255,255,255,0.06)"
        />
        <View style={styles.ringCenter} pointerEvents="none">
          <Text style={styles.remaining}>{remaining}</Text>
          <Text style={styles.remainingLabel}>kcal left</Text>
        </View>
      </View>

      <View style={styles.macros}>
        <MacroBar label="Protein" value={totals.protein} target={macroTargets.protein} color={MACRO_COLORS.protein} />
        <MacroBar label="Carbs" value={totals.carbs} target={macroTargets.carbs} color={MACRO_COLORS.carbs} />
        <MacroBar label="Fat" value={totals.fat} target={macroTargets.fat} color={MACRO_COLORS.fat} />
        <Text style={styles.eaten}>
          {totals.calories} / {calorieTarget} kcal eaten
        </Text>
      </View>
    </View>
  );
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={styles.macro}>
      <View style={styles.macroHead}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroVal}>
          {Math.round(value)}<Text style={styles.macroTarget}> / {target} g</Text>
        </Text>
      </View>
      <ProgressBar progress={target ? value / target : 0} colors={[color, color]} height={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ringWrap: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  remaining: { fontSize: 26, fontWeight: '300', color: colors.text, letterSpacing: -1 },
  remainingLabel: { ...type.label, color: colors.textMuted, marginTop: 2 },
  macros: { flex: 1, marginLeft: spacing.xl, gap: spacing.md },
  macro: {},
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  macroLabel: { ...type.label, color: colors.textSecondary },
  macroVal: { fontSize: 13, fontWeight: '700', color: colors.text },
  macroTarget: { color: colors.textMuted, fontWeight: '400' },
  eaten: { ...type.caption, marginTop: 2 },
});
