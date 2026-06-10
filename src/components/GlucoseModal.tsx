import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { GlucoseReading, GlucoseTag } from '@/models/types';
import { todayISO } from '@/utils/date';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TAGS: { key: GlucoseTag; label: string }[] = [
  { key: 'fasting', label: 'Fasting' },
  { key: 'pre_meal', label: 'Pre-meal' },
  { key: 'post_meal', label: 'Post-meal' },
  { key: 'random', label: 'Random' },
];

const LOW = 70;
const HIGH = 180;
const rangeColor = (mg: number) => (mg < LOW ? colors.sleep : mg > HIGH ? colors.danger : colors.success);
const rangeLabel = (mg: number) => (mg < LOW ? 'Low' : mg > HIGH ? 'High' : 'In range');

/** Generates a realistic day of CGM readings for the web/demo experience. */
function demoDay(): Omit<GlucoseReading, 'id'>[] {
  const date = todayISO();
  const meals = [8, 13, 19];
  const out: Omit<GlucoseReading, 'id'>[] = [];
  for (let h = 6; h <= 22; h++) {
    let base = 92 + Math.sin((h - 3) / 3) * 6;
    for (const m of meals) {
      const d = h - m;
      if (d === 0) base += 30;
      else if (d === 1) base += 48;
      else if (d === 2) base += 22;
    }
    const mgDl = Math.round(base + (Math.random() * 8 - 4));
    const tag: GlucoseTag = meals.includes(h)
      ? 'pre_meal'
      : meals.some((m) => h - m === 1 || h - m === 2)
        ? 'post_meal'
        : h <= 7 ? 'fasting' : 'random';
    const at = new Date();
    at.setHours(h, 0, 0, 0);
    out.push({ date, loggedAt: at.toISOString(), mgDl, tag, source: 'cgm' });
  }
  return out;
}

export function GlucoseModal({ visible, onClose }: Props) {
  const { data, addGlucose, addGlucoseBatch, removeEntry } = useData();
  const [value, setValue] = useState('');
  const [tag, setTag] = useState<GlucoseTag>('fasting');

  const today = todayISO();
  const todays = data.glucose
    .filter((g) => g.date === today)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

  const recent = data.glucose.slice(0, 30);
  const pool = recent.length ? recent : [];
  const avg = pool.length ? Math.round(pool.reduce((a, b) => a + b.mgDl, 0) / pool.length) : null;
  const inRange = pool.length ? Math.round((pool.filter((g) => g.mgDl >= LOW && g.mgDl <= HIGH).length / pool.length) * 100) : null;
  const estA1c = avg != null ? Math.round(((avg + 46.7) / 28.7) * 10) / 10 : null;

  const add = () => {
    const mg = Number.parseInt(value, 10);
    if (!mg) return;
    addGlucose({ date: today, mgDl: mg, tag, source: 'manual' });
    setValue('');
  };

  const connect = () => addGlucoseBatch(demoDay());

  // Curve scaling for today's readings (40–280 mg/dL window).
  const curveMax = 280;
  const curveMin = 40;
  const norm = (mg: number) => Math.max(0, Math.min(1, (mg - curveMin) / (curveMax - curveMin)));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Glucose · CGM</Text>
              <Text style={type.title}>Blood sugar</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Summary stats */}
            <View style={styles.statRow}>
              <View style={styles.stat}><Text style={styles.statVal}>{avg ?? '—'}</Text><Text style={styles.statLabel}>avg mg/dL</Text></View>
              <View style={styles.stat}><Text style={[styles.statVal, { color: colors.success }]}>{inRange != null ? `${inRange}%` : '—'}</Text><Text style={styles.statLabel}>time in range</Text></View>
              <View style={styles.stat}><Text style={styles.statVal}>{estA1c ?? '—'}</Text><Text style={styles.statLabel}>est. A1C %</Text></View>
            </View>

            {/* Today curve */}
            <Text style={styles.h}>Today</Text>
            {todays.length === 0 ? (
              <Text style={styles.hint}>No readings yet today. Connect a CGM for a full day, or add one below.</Text>
            ) : (
              <View style={styles.curveCard}>
                <View style={styles.curve}>
                  {todays.map((g) => (
                    <View key={g.id} style={styles.curveCol}>
                      <View style={[styles.point, { height: 6 + norm(g.mgDl) * 110, backgroundColor: rangeColor(g.mgDl) }]} />
                    </View>
                  ))}
                </View>
                <View style={styles.rangeBandLabels}>
                  <Text style={styles.bandText}>Target 70–180 mg/dL</Text>
                </View>
              </View>
            )}

            {/* Connect CGM */}
            <View style={styles.deviceCard}>
              <Text style={{ fontSize: 26 }}>📟</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.deviceTitle}>Continuous glucose monitor</Text>
                <Text style={styles.deviceSub}>Libre · Dexcom · Medtronic</Text>
              </View>
              <Pressable style={styles.connectBtn} onPress={connect}><Text style={styles.connectText}>Connect</Text></Pressable>
            </View>
            <Text style={styles.note}>Live CGM sync activates in the mobile app. On web, "Connect" pulls a demo day so you can explore the experience.</Text>

            {/* Manual entry */}
            <Text style={styles.h}>Add a reading</Text>
            <View style={styles.entryRow}>
              <TextInput
                style={styles.input}
                placeholder="mg/dL"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={value}
                onChangeText={setValue}
              />
              <PrimaryButton label="Add" onPress={add} disabled={!value} gradient={gradients.water} style={{ minWidth: 84 }} />
            </View>
            <View style={styles.tagRow}>
              {TAGS.map((t) => (
                <Pressable key={t.key} onPress={() => setTag(t.key)} style={[styles.tag, tag === t.key && styles.tagOn]}>
                  <Text style={[styles.tagText, tag === t.key && styles.tagTextOn]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* History */}
            {recent.length > 0 ? (
              <>
                <Text style={[styles.h, { marginTop: spacing.xl }]}>Recent readings</Text>
                {recent.map((g) => (
                  <View key={g.id} style={styles.histRow}>
                    <View style={[styles.dot, { backgroundColor: rangeColor(g.mgDl) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.histVal}>{g.mgDl} mg/dL · <Text style={{ color: rangeColor(g.mgDl) }}>{rangeLabel(g.mgDl)}</Text></Text>
                      <Text style={styles.histMeta}>{TAGS.find((t) => t.key === g.tag)?.label} · {new Date(g.loggedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{g.source === 'cgm' ? ' · CGM' : ''}</Text>
                    </View>
                    <Pressable onPress={() => removeEntry('glucose', g.id)} hitSlop={8}><Text style={styles.remove}>Remove</Text></Pressable>
                  </View>
                ))}
              </>
            ) : null}
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
  eyebrow: { ...type.label, color: colors.water, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statVal: { ...type.metricSmall },
  statLabel: { ...type.caption, marginTop: 2, textAlign: 'center' },
  h: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.md },
  hint: { ...type.caption, lineHeight: 19 },
  curveCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  curve: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 },
  curveCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  point: { width: '70%', borderRadius: 3, minHeight: 6 },
  rangeBandLabels: { marginTop: spacing.sm },
  bandText: { ...type.caption, color: colors.textMuted },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg },
  deviceTitle: { ...type.body, fontWeight: '700' },
  deviceSub: { ...type.caption, marginTop: 1 },
  connectBtn: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.primary },
  connectText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  note: { ...type.caption, marginTop: spacing.sm, lineHeight: 18 },
  entryRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.backgroundAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, ...type.body },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tagOn: { backgroundColor: colors.water, borderColor: colors.water },
  tagText: { ...type.caption, fontWeight: '700', color: colors.textSecondary },
  tagTextOn: { color: '#fff' },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  histVal: { ...type.body, fontWeight: '600' },
  histMeta: { ...type.caption, marginTop: 1 },
  remove: { fontSize: 12, fontWeight: '600', color: colors.danger, marginLeft: spacing.md },
});
