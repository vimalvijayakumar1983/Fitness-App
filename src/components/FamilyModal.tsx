import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { FamilyMember, FamilyRelation, HealthAssessment, Profile } from '@/models/types';
import { biologicalAge } from '@/utils/longevity';
import { makeId } from '@/utils/date';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const RELATIONS: FamilyRelation[] = ['spouse', 'child', 'parent', 'sibling', 'other'];
const RELATION_EMOJI: Record<FamilyRelation, string> = {
  spouse: '💑', child: '🧒', parent: '👵', sibling: '🧑', other: '👤',
};

/** Derive an approximate longevity snapshot from a family member's basics. */
function snapshot(m: FamilyMember) {
  const profile: Profile = {
    name: m.name, goal: 'maintain', diet: 'balanced', calorieTarget: 2000,
    macroTargets: { protein: 120, carbs: 220, fat: 70 }, waterGoalMl: 2500, units: 'metric',
    weightKg: m.weightKg ?? (m.sex === 'female' ? 65 : 78),
    heightCm: m.heightCm ?? 170, age: m.age, sex: m.sex, activityLevel: 1.4,
  };
  const lc = m.conditions.map((c) => c.toLowerCase()).join(' ');
  const assessment: HealthAssessment = {
    completedAt: new Date().toISOString(),
    smokes: !!m.smokes,
    familyDiabetes: lc.includes('diab'),
    familyHeart: lc.includes('heart') || lc.includes('hyperten') || lc.includes('cholesterol'),
    activityDaysPerWeek: m.activityDaysPerWeek ?? 2,
    sleepQuality: 3, stressLevel: 3, dietQuality: 3, alcoholPerWeek: 0,
  };
  return biologicalAge(profile, assessment);
}

const blank = (): FamilyMember => ({
  id: '', name: '', relation: 'spouse', sex: 'female', age: 35, conditions: [],
});

export function FamilyModal({ visible, onClose }: Props) {
  const { data, upsertFamilyMember, removeFamilyMember } = useData();
  const [editing, setEditing] = useState<FamilyMember | null>(null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Family health</Text>
              <Text style={type.title}>{editing ? (editing.id ? 'Edit member' : 'Add member') : 'Your household'}</Text>
            </View>
            <Pressable onPress={editing ? () => setEditing(null) : onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>{editing ? '‹' : '✕'}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {editing ? (
              <MemberForm
                initial={editing}
                onSave={(m) => { upsertFamilyMember(m); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                <Text style={styles.intro}>Track the people you care for. Get a quick health snapshot for each and keep their key conditions in one place.</Text>

                {data.family.map((m) => {
                  const s = snapshot(m);
                  return (
                    <View key={m.id} style={styles.memberCard}>
                      <View style={styles.memberHead}>
                        <Text style={{ fontSize: 28 }}>{RELATION_EMOJI[m.relation]}</Text>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberMeta}>{m.relation} · {m.age}y · {m.sex}</Text>
                        </View>
                        <View style={styles.scorePill}>
                          <Text style={styles.scoreVal}>{s.longevityScore}</Text>
                          <Text style={styles.scoreLabel}>health</Text>
                        </View>
                      </View>
                      <Text style={styles.bioLine}>Biological age ≈ <Text style={{ fontWeight: '800', color: colors.text }}>{s.bioAge.toFixed(0)}</Text> · {s.category}</Text>
                      {m.conditions.length > 0 ? (
                        <View style={styles.chips}>
                          {m.conditions.map((c) => <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>)}
                        </View>
                      ) : null}
                      <View style={styles.memberActions}>
                        <Pressable onPress={() => setEditing(m)}><Text style={styles.editLink}>Edit</Text></Pressable>
                        <Pressable onPress={() => removeFamilyMember(m.id)}><Text style={styles.removeLink}>Remove</Text></Pressable>
                      </View>
                    </View>
                  );
                })}

                <PrimaryButton label="＋ Add family member" onPress={() => setEditing(blank())} gradient={gradients.primary} style={{ marginTop: spacing.md }} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function MemberForm({ initial, onSave, onCancel }: { initial: FamilyMember; onSave: (m: FamilyMember) => void; onCancel: () => void }) {
  const [m, setM] = useState<FamilyMember>({ ...initial, conditions: [...initial.conditions] });
  const set = (patch: Partial<FamilyMember>) => setM((cur) => ({ ...cur, ...patch }));
  const [conditionsText, setConditionsText] = useState(initial.conditions.join(', '));

  const save = () => {
    if (!m.name.trim()) return;
    onSave({
      ...m,
      id: m.id || makeId(),
      name: m.name.trim(),
      conditions: conditionsText.split(',').map((c) => c.trim()).filter(Boolean),
    });
  };

  return (
    <View>
      <Field label="Name"><TextInput style={styles.input} value={m.name} onChangeText={(t) => set({ name: t })} placeholder="e.g. Layla" placeholderTextColor={colors.textMuted} /></Field>

      <Field label="Relation">
        <View style={styles.segRow}>
          {RELATIONS.map((r) => (
            <Pressable key={r} onPress={() => set({ relation: r })} style={[styles.seg, m.relation === r && styles.segOn]}>
              <Text style={[styles.segText, m.relation === r && styles.segTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <View style={styles.row2}>
        <Field label="Age" flex>
          <TextInput style={styles.input} keyboardType="number-pad" value={String(m.age)} onChangeText={(t) => set({ age: Number.parseInt(t, 10) || 0 })} />
        </Field>
        <Field label="Sex" flex>
          <View style={styles.segRow}>
            {(['female', 'male', 'other'] as const).map((s) => (
              <Pressable key={s} onPress={() => set({ sex: s })} style={[styles.seg, m.sex === s && styles.segOn]}>
                <Text style={[styles.segText, m.sex === s && styles.segTextOn]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
      </View>

      <View style={styles.row2}>
        <Field label="Height (cm)" flex>
          <TextInput style={styles.input} keyboardType="number-pad" value={m.heightCm ? String(m.heightCm) : ''} onChangeText={(t) => set({ heightCm: Number.parseInt(t, 10) || undefined })} placeholder="170" placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label="Weight (kg)" flex>
          <TextInput style={styles.input} keyboardType="number-pad" value={m.weightKg ? String(m.weightKg) : ''} onChangeText={(t) => set({ weightKg: Number.parseInt(t, 10) || undefined })} placeholder="65" placeholderTextColor={colors.textMuted} />
        </Field>
      </View>

      <Field label={`Active days / week: ${m.activityDaysPerWeek ?? 0}`}>
        <View style={styles.chipsRow}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
            <Pressable key={d} onPress={() => set({ activityDaysPerWeek: d })} style={[styles.numChip, (m.activityDaysPerWeek ?? 0) === d && styles.numChipOn]}>
              <Text style={[styles.numText, (m.activityDaysPerWeek ?? 0) === d && styles.numTextOn]}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Smokes</Text>
        <Switch value={!!m.smokes} onValueChange={(v) => set({ smokes: v })} trackColor={{ true: colors.primary }} />
      </View>

      <Field label="Conditions (comma separated)">
        <TextInput style={styles.input} value={conditionsText} onChangeText={setConditionsText} placeholder="e.g. Type 2 diabetes, Hypertension" placeholderTextColor={colors.textMuted} />
      </Field>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        <PrimaryButton label="Cancel" variant="soft" color={colors.textSecondary} onPress={onCancel} style={{ flex: 1 }} />
        <PrimaryButton label="Save" onPress={save} gradient={gradients.primary} disabled={!m.name.trim()} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[styles.field, flex && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 18, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  intro: { ...type.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.lg },
  memberCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  memberHead: { flexDirection: 'row', alignItems: 'center' },
  memberName: { ...type.body, fontWeight: '800' },
  memberMeta: { ...type.caption, marginTop: 1, textTransform: 'capitalize' },
  scorePill: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  scoreVal: { ...type.metricSmall, color: colors.primaryDark },
  scoreLabel: { ...type.caption, color: colors.primaryDark, fontSize: 10 },
  bioLine: { ...type.caption, marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { ...type.caption, color: colors.accent, fontWeight: '700' },
  memberActions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  editLink: { ...type.caption, color: colors.primary, fontWeight: '700' },
  removeLink: { ...type.caption, color: colors.danger, fontWeight: '700' },
  field: { marginBottom: spacing.md },
  fieldLabel: { ...type.label, marginBottom: spacing.sm },
  input: { backgroundColor: colors.backgroundAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, ...type.body },
  row2: { flexDirection: 'row', gap: spacing.md },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seg: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { ...type.caption, fontWeight: '700', color: colors.textSecondary, textTransform: 'capitalize' },
  segTextOn: { color: '#fff' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  numChip: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  numChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  numText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
  numTextOn: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  switchLabel: { ...type.body, fontWeight: '600' },
});
