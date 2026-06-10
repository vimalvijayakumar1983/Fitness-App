import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { Sparkline } from './Sparkline';
import { useData } from '@/context/DataContext';
import { colors, gradients, spacing, type } from '@/theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function WeightModal({ visible, onClose }: Props) {
  const { data, addWeight, removeEntry } = useData();
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');

  const weights = data.weights;
  const latest = weights[0]?.weightKg ?? data.profile.weightKg;
  const series = [...weights].reverse().map((w) => w.weightKg); // oldest→newest
  const change = weights.length >= 2 ? Math.round((weights[0].weightKg - weights[weights.length - 1].weightKg) * 10) / 10 : 0;

  const log = () => {
    const w = Number.parseFloat(weight);
    if (!w) return;
    addWeight(w, Number.parseFloat(fat) || undefined);
    setWeight('');
    setFat('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Body</Text>
              <Text style={type.title}>Weight tracking</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.summary}>
              <View>
                <Text style={styles.big}>{latest}<Text style={styles.unit}> kg</Text></Text>
                <Text style={styles.caption}>Current weight</Text>
              </View>
              {weights.length >= 2 ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.change, { color: change <= 0 ? colors.success : colors.accent }]}>{change > 0 ? '+' : ''}{change} kg</Text>
                  <Text style={styles.caption}>since first log</Text>
                </View>
              ) : null}
            </View>

            {series.length >= 2 ? (
              <View style={styles.chart}><Sparkline data={series} width={320} height={90} color={colors.primary} fillColors={gradients.primary} /></View>
            ) : <Text style={styles.caption}>Log a few entries to see your trend.</Text>}

            <View style={styles.row}>
              <View style={styles.col}><TextField label="Weight (kg)" placeholder="e.g. 72.5" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} /></View>
              <View style={styles.col}><TextField label="Body fat % (opt)" placeholder="e.g. 18" keyboardType="decimal-pad" value={fat} onChangeText={setFat} /></View>
            </View>
            <PrimaryButton label="Log weight" onPress={log} gradient={gradients.primary} disabled={!weight} />

            <Text style={[type.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md }]}>History</Text>
            {weights.length === 0 ? <Text style={styles.caption}>No entries yet.</Text> : weights.map((w) => (
              <View key={w.id} style={styles.histRow}>
                <Text style={styles.histW}>{w.weightKg} kg{w.bodyFatPct ? ` · ${w.bodyFatPct}% fat` : ''}</Text>
                <Text style={styles.histD}>{new Date(w.loggedAt).toLocaleDateString()}</Text>
                <Pressable onPress={() => removeEntry('weights', w.id)} hitSlop={8}><Text style={styles.remove}>Remove</Text></Pressable>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  big: { fontSize: 40, fontWeight: '300', color: colors.text, letterSpacing: -1 },
  unit: { ...type.body, color: colors.textSecondary },
  change: { fontSize: 20, fontWeight: '700' },
  caption: { ...type.caption },
  chart: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  histRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  histW: { ...type.body, fontWeight: '600', flex: 1 },
  histD: { ...type.caption, marginRight: spacing.md },
  remove: { fontSize: 12, fontWeight: '600', color: colors.danger },
});
