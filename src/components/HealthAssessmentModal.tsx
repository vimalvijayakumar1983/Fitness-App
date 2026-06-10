import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { HealthAssessment } from '@/models/types';
import { computeMetabolicScore } from '@/utils/health';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Scale = 1 | 2 | 3 | 4 | 5;

export function HealthAssessmentModal({ visible, onClose }: Props) {
  const { data, setAssessment } = useData();
  const a = data.assessment;
  const [smokes, setSmokes] = useState(a?.smokes ?? false);
  const [familyDiabetes, setFD] = useState(a?.familyDiabetes ?? false);
  const [familyHeart, setFH] = useState(a?.familyHeart ?? false);
  const [waist, setWaist] = useState(a?.waistCm ? String(a.waistCm) : '');
  const [activity, setActivity] = useState(a?.activityDaysPerWeek ?? 3);
  const [sleep, setSleep] = useState<Scale>(a?.sleepQuality ?? 3);
  const [stress, setStress] = useState<Scale>(a?.stressLevel ?? 3);
  const [diet, setDiet] = useState<Scale>(a?.dietQuality ?? 3);
  const [alcohol, setAlcohol] = useState(a ? String(a.alcoholPerWeek) : '');

  const draft: HealthAssessment = {
    completedAt: new Date().toISOString(),
    smokes, familyDiabetes, familyHeart,
    waistCm: Number.parseFloat(waist) || undefined,
    activityDaysPerWeek: activity, sleepQuality: sleep, stressLevel: stress, dietQuality: diet,
    alcoholPerWeek: Number.parseFloat(alcohol) || 0,
  };
  const preview = computeMetabolicScore(data.profile, draft);

  const save = () => { setAssessment(draft); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Health assessment</Text>
              <Text style={type.title}>Your metabolic health</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Toggle label="Do you smoke?" value={smokes} onChange={setSmokes} />
            <Toggle label="Family history of diabetes" value={familyDiabetes} onChange={setFD} />
            <Toggle label="Family history of heart disease" value={familyHeart} onChange={setFH} />

            <TextField label="Waist circumference (cm, optional)" keyboardType="decimal-pad" value={waist} onChangeText={setWaist} />

            <Text style={styles.q}>Active days per week</Text>
            <View style={styles.chips}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                <Chip key={d} label={String(d)} active={activity === d} onPress={() => setActivity(d)} />
              ))}
            </View>

            <Scale5 label="Sleep quality" value={sleep} onChange={setSleep} lowLabel="Poor" highLabel="Great" />
            <Scale5 label="Stress level" value={stress} onChange={setStress} lowLabel="Calm" highLabel="High" />
            <Scale5 label="Diet quality" value={diet} onChange={setDiet} lowLabel="Poor" highLabel="Excellent" />

            <TextField label="Alcoholic drinks per week" keyboardType="decimal-pad" value={alcohol} onChangeText={setAlcohol} />

            <LinearGradient colors={gradients.readiness as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
              <Text style={styles.previewLabel}>Estimated metabolic score</Text>
              <Text style={styles.previewScore}>{preview.score}<Text style={styles.previewCat}>  {preview.category}</Text></Text>
              {preview.bmi != null ? <Text style={styles.previewBmi}>BMI {preview.bmi}</Text> : null}
            </LinearGradient>
            <Text style={styles.disclaimer}>Educational only — not a medical diagnosis. Consult a professional for concerns.</Text>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <PrimaryButton label="Save assessment" onPress={save} gradient={gradients.primary} />
          </SafeAreaView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switch, value && styles.switchOn]}><View style={[styles.knob, value && styles.knobOn]} /></View>
    </Pressable>
  );
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}
function Scale5({ label, value, onChange, lowLabel, highLabel }: { label: string; value: Scale; onChange: (v: Scale) => void; lowLabel: string; highLabel: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.q}>{label}</Text>
      <View style={styles.chips}>
        {[1, 2, 3, 4, 5].map((n) => <Chip key={n} label={String(n)} active={value === n} onPress={() => onChange(n as Scale)} />)}
      </View>
      <View style={styles.scaleEnds}><Text style={styles.caption}>{lowLabel}</Text><Text style={styles.caption}>{highLabel}</Text></View>
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
  q: { ...type.label, marginBottom: spacing.sm, marginTop: spacing.sm },
  caption: { ...type.caption },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark },
  scaleEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { ...type.body, flex: 1 },
  switch: { width: 46, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMuted, padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: colors.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  preview: { borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.lg },
  previewLabel: { ...type.label, color: 'rgba(255,255,255,0.9)' },
  previewScore: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  previewCat: { fontSize: 16, fontWeight: '700' },
  previewBmi: { ...type.caption, color: 'rgba(255,255,255,0.9)' },
  disclaimer: { ...type.caption, marginTop: spacing.md, lineHeight: 18 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
