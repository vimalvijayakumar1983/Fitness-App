import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextField } from './TextField';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { ExerciseCategory, ExerciseDef, MuscleGroup } from '@/models/types';
import { CATEGORY_LABELS, MUSCLE_LABELS } from '@/data/exercises';
import { makeId } from '@/utils/date';

interface Props {
  visible: boolean;
  initial?: ExerciseDef | null;
  onClose: () => void;
  onSave: (exercise: ExerciseDef) => void;
  onDelete?: (id: string) => void;
}

const CATEGORIES: ExerciseCategory[] = ['strength', 'bodyweight', 'cardio', 'sports', 'flexibility'];
const MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full_body', 'cardio'];

export function ExerciseEditorModal({ visible, initial, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [muscle, setMuscle] = useState<MuscleGroup>('full_body');
  const [equipment, setEquipment] = useState('');
  const [met, setMet] = useState('5');

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setCategory(initial?.category ?? 'strength');
    setMuscle(initial?.muscle ?? 'full_body');
    setEquipment(initial?.equipment ?? '');
    setMet(initial ? String(initial.met) : '5');
  }, [visible, initial]);

  const canSave = name.trim().length > 0;
  const isCustom = initial?.id?.startsWith('cx_');

  const save = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? `cx_${makeId()}`,
      name: name.trim(),
      category,
      muscle,
      equipment: equipment.trim() || undefined,
      met: Math.max(1, Number.parseFloat(met) || 5),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{initial ? 'Edit exercise' : 'New exercise'}</Text>
              <Text style={type.title}>{initial ? 'Edit details' : 'Create exercise'}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <TextField label="Name" placeholder="e.g. Cable woodchopper" value={name} onChangeText={setName} />

            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Muscle</Text>
            <View style={styles.chips}>
              {MUSCLES.map((m) => (
                <Chip key={m} label={MUSCLE_LABELS[m]} active={muscle === m} onPress={() => setMuscle(m)} />
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextField label="Equipment" placeholder="e.g. Dumbbell" value={equipment} onChangeText={setEquipment} />
              </View>
              <View style={styles.col}>
                <TextField label="Intensity (MET)" placeholder="5" keyboardType="decimal-pad" value={met} onChangeText={setMet} />
              </View>
            </View>
            <Text style={styles.hint}>MET ≈ intensity. Walking 3.5, weights 5–6, running 9.8. Used to estimate calories.</Text>

            {isCustom && onDelete ? (
              <Pressable
                onPress={() => {
                  onDelete(initial!.id);
                  onClose();
                }}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>Delete exercise</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Pressable onPress={save} disabled={!canSave}>
              <LinearGradient
                colors={gradients.exercise as unknown as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}
              >
                <Text style={styles.saveText}>{initial ? 'Save changes' : 'Create exercise'}</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.exercise, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0 },
  sectionLabel: { ...type.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.exercise },
  chipText: { ...type.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.exercise, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  hint: { ...type.caption, marginTop: -spacing.xs, marginBottom: spacing.md },
  deleteBtn: { marginTop: spacing.md, paddingVertical: 14, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)' },
  deleteText: { color: colors.danger, fontWeight: '700' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
});
