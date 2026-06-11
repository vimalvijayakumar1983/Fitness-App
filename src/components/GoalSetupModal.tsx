import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextField } from './TextField';
import { api } from '@/services/api';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { Profile } from '@/models/types';
import { DEFAULT_ONBOARDING, OnboardingOptions, targetsFromOptions } from '@/utils/targets';

interface Props {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onSave: (patch: Partial<Profile>) => void;
}

const SEXES: Profile['sex'][] = ['male', 'female', 'other'];

export function GoalSetupModal({ visible, profile, onClose, onSave }: Props) {
  const [opts, setOpts] = useState<OnboardingOptions>(DEFAULT_ONBOARDING);
  const [goal, setGoal] = useState<string>(profile.goal);
  const [diet, setDiet] = useState<string>(profile.diet);
  const [sex, setSex] = useState<Profile['sex']>(profile.sex);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [age, setAge] = useState(String(profile.age));

  useEffect(() => {
    if (visible) api.getOnboardingOptions().then(setOpts).catch(() => {});
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setGoal(profile.goal);
    setDiet(profile.diet);
    setSex(profile.sex);
    setActivityLevel(profile.activityLevel);
    setWeight(String(profile.weightKg));
    setHeight(String(profile.heightCm));
    setAge(String(profile.age));
  }, [visible, profile]);

  const draft: Profile = useMemo(
    () => ({
      ...profile,
      goal,
      diet,
      sex,
      activityLevel,
      weightKg: Math.max(30, Number.parseFloat(weight) || profile.weightKg),
      heightCm: Math.max(100, Number.parseFloat(height) || profile.heightCm),
      age: Math.max(13, Number.parseInt(age, 10) || profile.age),
    }),
    [profile, goal, diet, sex, activityLevel, weight, height, age],
  );

  const targets = useMemo(() => targetsFromOptions(draft, opts), [draft, opts]);

  const save = () => {
    onSave({
      goal,
      diet,
      sex,
      activityLevel,
      weightKg: draft.weightKg,
      heightCm: draft.heightCm,
      age: draft.age,
      calorieTarget: targets.calorieTarget,
      macroTargets: targets.macroTargets,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Plan setup</Text>
              <Text style={type.title}>Goal & diet</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Goal</Text>
            <View style={styles.chips}>
              {opts.goals.map((g) => (
                <Chip key={g.key} label={g.label} active={goal === g.key} onPress={() => setGoal(g.key)} />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Diet</Text>
            <View style={styles.chips}>
              {opts.diets.map((d) => (
                <Chip key={d.key} label={d.label} active={diet === d.key} onPress={() => setDiet(d.key)} />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Activity</Text>
            <View style={styles.chips}>
              {opts.activity.map((a) => (
                <Chip key={a.label} label={a.label} active={activityLevel === a.value} onPress={() => setActivityLevel(a.value)} />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Sex</Text>
            <View style={styles.chips}>
              {SEXES.map((s) => (
                <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} active={sex === s} onPress={() => setSex(s)} />
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.col}><TextField label="Weight (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} /></View>
              <View style={styles.col}><TextField label="Height (cm)" keyboardType="decimal-pad" value={height} onChangeText={setHeight} /></View>
              <View style={styles.col}><TextField label="Age" keyboardType="number-pad" value={age} onChangeText={setAge} /></View>
            </View>

            {/* Live target preview */}
            <LinearGradient colors={gradients.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
              <Text style={styles.previewLabel}>Your daily target</Text>
              <Text style={styles.previewCals}>{targets.calorieTarget} <Text style={styles.previewUnit}>kcal</Text></Text>
              <View style={styles.macroRow}>
                <Macro label="Protein" value={targets.macroTargets.protein} color={colors.exercise} />
                <Macro label="Carbs" value={targets.macroTargets.carbs} color={colors.sleep} />
                <Macro label="Fat" value={targets.macroTargets.fat} color={colors.meal} />
              </View>
            </LinearGradient>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Pressable onPress={save}>
              <LinearGradient colors={gradients.primary as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save & set targets</Text>
              </LinearGradient>
            </Pressable>
          </SafeAreaView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macro}>
      <Text style={[styles.macroValue, { color }]}>{value}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
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
  sectionLabel: { ...type.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...type.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  preview: { borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.glassBorder },
  previewLabel: { ...type.label, color: colors.textSecondary },
  previewCals: { fontSize: 40, fontWeight: '300', color: colors.text, letterSpacing: -1, marginTop: 4 },
  previewUnit: { ...type.body, color: colors.textSecondary },
  macroRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  macro: {},
  macroValue: { fontSize: 18, fontWeight: '700' },
  macroLabel: { ...type.caption },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
});
