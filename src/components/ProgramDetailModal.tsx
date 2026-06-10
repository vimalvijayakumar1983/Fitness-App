import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from './PrimaryButton';
import { colors, hexA, radius, spacing, type } from '@/theme/colors';
import type { Enrollment, Program } from '@/models/types';

interface Props {
  visible: boolean;
  program: Program | null;
  enrollment: Enrollment | null;
  hasAccount: boolean;
  busy?: boolean;
  onEnroll: (programId: string) => void;
  onToggleTask: (enrollment: Enrollment, key: string) => void;
  onSetWeek: (enrollment: Enrollment, week: number) => void;
  onLeave: (enrollment: Enrollment) => void;
  onClose: () => void;
}

const taskKey = (week: number, i: number) => `w${week}:${i}`;

export function ProgramDetailModal({
  visible, program, enrollment, hasAccount, busy,
  onEnroll, onToggleTask, onSetWeek, onLeave, onClose,
}: Props) {
  const [week, setWeek] = useState(enrollment?.currentWeek ?? 1);

  // Keep the local week in sync when the active enrollment changes.
  const activeWeek = enrollment ? week : 1;

  const totalTasks = useMemo(
    () => program?.modules.reduce((a, m) => a + m.tasks.length, 0) ?? 0,
    [program],
  );
  const done = enrollment?.completedTasks.length ?? 0;
  const pct = totalTasks ? Math.round((done / totalTasks) * 100) : 0;

  if (!program) return null;
  const tint = program.color || colors.primary;
  const module = program.modules.find((m) => m.week === activeWeek) || program.modules[0];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.topBar}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={[hexA(tint, 0.18), hexA(tint, 0.04)]} style={styles.hero}>
              <Text style={[styles.condition, { color: tint }]}>{program.condition.toUpperCase()} · {program.durationWeeks} WEEKS</Text>
              <Text style={type.title}>{program.name}</Text>
              <Text style={styles.tagline}>{program.tagline}</Text>
            </LinearGradient>

            {enrollment ? (
              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <Text style={styles.progressLabel}>Your progress</Text>
                  <Text style={[styles.progressPct, { color: tint }]}>{pct}%</Text>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: tint }]} /></View>
                <Text style={styles.progressSub}>{done} of {totalTasks} tasks · week {enrollment.currentWeek} of {program.durationWeeks}</Text>
              </View>
            ) : null}

            <Text style={styles.h}>What you'll achieve</Text>
            {program.outcomes.map((o, i) => (
              <View key={i} style={styles.outcomeRow}>
                <Text style={[styles.check, { color: tint }]}>✓</Text>
                <Text style={styles.outcomeText}>{o}</Text>
              </View>
            ))}

            <Text style={[styles.h, { marginTop: spacing.xl }]}>About this program</Text>
            <Text style={styles.desc}>{program.description}</Text>

            {enrollment ? (
              <>
                <Text style={[styles.h, { marginTop: spacing.xl }]}>Weekly plan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}>
                  {program.modules.map((m) => {
                    const sel = m.week === activeWeek;
                    return (
                      <Pressable key={m.week} onPress={() => setWeek(m.week)} style={[styles.weekChip, sel && { backgroundColor: tint, borderColor: tint }]}>
                        <Text style={[styles.weekChipText, sel && { color: '#fff' }]}>W{m.week}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {module ? (
                  <View style={styles.moduleCard}>
                    <Text style={styles.moduleTitle}>Week {module.week}: {module.title}</Text>
                    {module.focus ? <Text style={[styles.moduleFocus, { color: tint }]}>{module.focus}</Text> : null}
                    {module.tasks.map((task, i) => {
                      const key = taskKey(module.week, i);
                      const checked = enrollment.completedTasks.includes(key);
                      return (
                        <Pressable key={i} onPress={() => onToggleTask(enrollment, key)} style={styles.taskRow}>
                          <View style={[styles.box, checked && { backgroundColor: tint, borderColor: tint }]}>
                            {checked ? <Text style={styles.boxCheck}>✓</Text> : null}
                          </View>
                          <Text style={[styles.taskText, checked && styles.taskDone]}>{task}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.weekNav}>
                  {activeWeek > 1 ? (
                    <PrimaryButton label="◀ Previous" variant="soft" color={tint} onPress={() => setWeek(activeWeek - 1)} style={{ flex: 1 }} />
                  ) : null}
                  {activeWeek < program.durationWeeks ? (
                    <PrimaryButton
                      label="Next week ▶"
                      onPress={() => { const n = activeWeek + 1; setWeek(n); if (n > enrollment.currentWeek) onSetWeek(enrollment, n); }}
                      gradient={[tint, tint]}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <PrimaryButton label="🎉 Mark program complete" onPress={() => onSetWeek({ ...enrollment, status: 'completed' } as Enrollment, program.durationWeeks)} gradient={[tint, tint]} style={{ flex: 1 }} />
                  )}
                </View>

                <Pressable onPress={() => onLeave(enrollment)} style={styles.leave}><Text style={styles.leaveText}>Leave program</Text></Pressable>
              </>
            ) : (
              <View style={{ marginTop: spacing.xl }}>
                {hasAccount ? (
                  <PrimaryButton label={busy ? 'Starting…' : `Start ${program.durationWeeks}-week program`} onPress={() => onEnroll(program.id)} gradient={[tint, tint]} disabled={busy} />
                ) : (
                  <Text style={styles.signin}>Sign in to start this program and track your weekly progress.</Text>
                )}
                <Text style={styles.disclaimer}>Programs are educational and support — not a substitute for medical care. Make medication changes only with your doctor.</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.xl, padding: spacing.xl },
  condition: { ...type.label, marginBottom: 6 },
  tagline: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 21 },
  progressCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...type.sectionTitle },
  progressPct: { fontSize: 20, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  progressSub: { ...type.caption, marginTop: spacing.sm },
  h: { ...type.sectionTitle, marginTop: spacing.lg, marginBottom: spacing.md },
  outcomeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  check: { fontSize: 16, fontWeight: '800', marginRight: spacing.md, marginTop: 1 },
  outcomeText: { ...type.body, flex: 1, lineHeight: 21 },
  desc: { ...type.body, color: colors.textSecondary, lineHeight: 22 },
  weekStrip: { marginBottom: spacing.md },
  weekChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  weekChipText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
  moduleCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  moduleTitle: { ...type.sectionTitle },
  moduleFocus: { ...type.caption, fontWeight: '700', marginTop: 2, marginBottom: spacing.md },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  boxCheck: { color: '#fff', fontSize: 14, fontWeight: '800' },
  taskText: { ...type.body, flex: 1 },
  taskDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  weekNav: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  leave: { alignItems: 'center', paddingVertical: spacing.lg },
  leaveText: { ...type.caption, color: colors.danger, fontWeight: '700' },
  signin: { ...type.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  disclaimer: { ...type.caption, marginTop: spacing.lg, lineHeight: 18, textAlign: 'center' },
});
