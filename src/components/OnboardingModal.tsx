import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { useData } from '@/context/DataContext';
import { api } from '@/services/api';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { Profile } from '@/models/types';
import { DEFAULT_ONBOARDING, OnboardingOptions, targetsFromOptions } from '@/utils/targets';

interface Props {
  visible: boolean;
  onDone: () => void;
}

const SEXES: Profile['sex'][] = ['male', 'female', 'other'];
const STEPS = ['Goal', 'About you', 'Body', 'Activity', 'Diet', 'Your plan'];

/** Personalized onboarding quiz → computes targets → hands off to the paywall. */
export function OnboardingModal({ visible, onDone }: Props) {
  const { data, updateProfile } = useData();
  const p = data.profile;
  const [opts, setOpts] = useState<OnboardingOptions>(DEFAULT_ONBOARDING);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>(p.goal);
  const [sex, setSex] = useState<Profile['sex']>(p.sex);
  const [age, setAge] = useState(String(p.age));
  const [height, setHeight] = useState(String(p.heightCm));
  const [weight, setWeight] = useState(String(p.weightKg));
  const [activityLevel, setActivityLevel] = useState(p.activityLevel);
  const [diet, setDiet] = useState<string>(p.diet);

  // Pull admin-defined options (goals, activity, diets); fall back to bundled.
  useEffect(() => {
    if (visible) api.getOnboardingOptions().then(setOpts).catch(() => {});
  }, [visible]);

  const draft: Profile = useMemo(
    () => ({
      ...p, goal, sex, diet, activityLevel,
      age: Math.max(13, parseInt(age, 10) || p.age),
      heightCm: Math.max(100, parseFloat(height) || p.heightCm),
      weightKg: Math.max(30, parseFloat(weight) || p.weightKg),
    }),
    [p, goal, sex, diet, activityLevel, age, height, weight],
  );
  const targets = useMemo(() => targetsFromOptions(draft, opts), [draft, opts]);
  const goalText = opts.goals.find((g) => g.key === goal)?.label ?? goal;
  const dietText = opts.diets.find((d) => d.key === diet)?.label ?? diet;

  const finish = () => {
    updateProfile({
      goal, sex, diet, activityLevel,
      age: draft.age, heightCm: draft.heightCm, weightKg: draft.weightKg,
      calorieTarget: targets.calorieTarget, macroTargets: targets.macroTargets,
      onboarded: true,
    });
    onDone();
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const last = step === STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDone}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Progress */}
          <View style={styles.progressRow}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
            ))}
          </View>
          <Pressable onPress={finish} style={styles.skip}><Text style={styles.skipText}>Skip</Text></Pressable>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}</Text>

            {step === 0 && (
              <>
                <Text style={styles.q}>What's your goal?</Text>
                <View style={styles.chips}>
                  {opts.goals.map((g) => <Chip key={g.key} label={g.label} active={goal === g.key} onPress={() => setGoal(g.key)} big />)}
                </View>
              </>
            )}
            {step === 1 && (
              <>
                <Text style={styles.q}>Tell us about you</Text>
                <Text style={styles.sub}>Sex</Text>
                <View style={styles.chips}>
                  {SEXES.map((s) => <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} active={sex === s} onPress={() => setSex(s)} />)}
                </View>
                <TextField label="Age" keyboardType="number-pad" value={age} onChangeText={setAge} />
              </>
            )}
            {step === 2 && (
              <>
                <Text style={styles.q}>Your measurements</Text>
                <TextField label="Height (cm)" keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
                <TextField label="Weight (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
              </>
            )}
            {step === 3 && (
              <>
                <Text style={styles.q}>How active are you?</Text>
                <View style={styles.chips}>
                  {opts.activity.map((a) => <Chip key={a.label} label={a.label} active={activityLevel === a.value} onPress={() => setActivityLevel(a.value)} />)}
                </View>
              </>
            )}
            {step === 4 && (
              <>
                <Text style={styles.q}>Pick your diet</Text>
                <View style={styles.chips}>
                  {opts.diets.map((d) => <Chip key={d.key} label={d.label} active={diet === d.key} onPress={() => setDiet(d.key)} />)}
                </View>
              </>
            )}
            {step === 5 && (
              <>
                <Text style={styles.q}>Your personalized plan ✨</Text>
                <LinearGradient colors={gradients.primary as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.result}>
                  <Text style={styles.resultLabel}>Daily target</Text>
                  <Text style={styles.resultCals}>{targets.calorieTarget} <Text style={styles.resultUnit}>kcal</Text></Text>
                  <View style={styles.macroRow}>
                    <Macro label="Protein" value={targets.macroTargets.protein} />
                    <Macro label="Carbs" value={targets.macroTargets.carbs} />
                    <Macro label="Fat" value={targets.macroTargets.fat} />
                  </View>
                </LinearGradient>
                <Text style={styles.projection}>
                  On track for your {goalText.toLowerCase()} goal with a {dietText.toLowerCase()} plan. You can fine-tune this anytime.
                </Text>
              </>
            )}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.navRow}>
              {step > 0 ? <Pressable onPress={back} style={styles.backBtn}><Text style={styles.backText}>Back</Text></Pressable> : <View style={{ flex: 1 }} />}
              <View style={{ flex: 2 }}>
                <PrimaryButton label={last ? 'Start my journey' : 'Continue'} onPress={last ? finish : next} gradient={gradients.primary} />
              </View>
            </View>
          </SafeAreaView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Chip({ label, active, onPress, big }: { label: string; active: boolean; onPress: () => void; big?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, big && styles.chipBig, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}
function Macro({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macro}><Text style={styles.macroVal}>{value}g</Text><Text style={styles.macroLbl}>{label}</Text></View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceMuted },
  dotOn: { backgroundColor: colors.primary },
  skip: { position: 'absolute', right: spacing.lg, top: spacing.lg + 12 },
  skipText: { ...type.caption, color: colors.textMuted, fontWeight: '600' },
  body: { padding: spacing.lg },
  stepLabel: { ...type.label, color: colors.textMuted, marginBottom: spacing.sm },
  q: { ...type.title, marginBottom: spacing.lg },
  sub: { ...type.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipBig: { paddingVertical: 16, paddingHorizontal: 22 },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark },
  result: { borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.sm },
  resultLabel: { ...type.label, color: 'rgba(255,255,255,0.85)' },
  resultCals: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  resultUnit: { fontSize: 18, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  macro: {},
  macroVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  macroLbl: { ...type.caption, color: 'rgba(255,255,255,0.85)' },
  projection: { ...type.body, marginTop: spacing.lg, lineHeight: 22, color: colors.textSecondary },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  backText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
});
