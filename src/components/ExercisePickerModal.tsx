import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from './TextField';
import { ExerciseEditorModal } from './ExerciseEditorModal';
import { Thumb } from './Thumb';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { ExerciseCategory, ExerciseDef } from '@/models/types';
import { CATEGORY_LABELS, MUSCLE_LABELS, mergeExercises, searchExercises } from '@/data/exercises';
import { exerciseImage } from '@/utils/images';

const CAT_EMOJI: Record<ExerciseCategory, string> = {
  strength: '🏋️', bodyweight: '🤸', cardio: '🏃', sports: '⚽', flexibility: '🧘',
};

interface Props {
  visible: boolean;
  customExercises: ExerciseDef[];
  onPick: (exercise: ExerciseDef) => void;
  onUpsert: (exercise: ExerciseDef) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CATEGORY_FILTERS = ['all', 'strength', 'bodyweight', 'cardio', 'sports', 'flexibility'];
const MUSCLE_FILTERS = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full_body', 'cardio'];

/** Browse/search the exercise catalog, filter by type & muscle, or create one. */
export function ExercisePickerModal({ visible, customExercises, onPick, onUpsert, onDelete, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [muscle, setMuscle] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseDef | null>(null);

  const list = useMemo(() => mergeExercises(customExercises), [customExercises]);
  const results = useMemo(
    () => searchExercises(query, list, { category, muscle }),
    [query, list, category, muscle],
  );

  const openEditor = (ex: ExerciseDef | null) => {
    setEditing(ex);
    setEditorOpen(true);
  };

  const pick = (ex: ExerciseDef) => {
    onPick(ex);
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Exercise library</Text>
              <Text style={type.title}>Choose an exercise</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <TextField
            placeholder="Search e.g. squat, bench, running"
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={{ marginHorizontal: spacing.lg }}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
            {CATEGORY_FILTERS.map((c) => (
              <Filter key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
            {MUSCLE_FILTERS.map((m) => (
              <Filter key={m} label={MUSCLE_LABELS[m]} active={muscle === m} onPress={() => setMuscle(m)} subtle />
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            <Pressable style={styles.createRow} onPress={() => openEditor(null)}>
              <Text style={styles.createPlus}>＋</Text>
              <Text style={styles.createText}>Create a custom exercise</Text>
            </Pressable>

            {results.map((ex) => (
              <View key={ex.id} style={styles.row}>
                <Thumb uri={exerciseImage(ex)} emoji={CAT_EMOJI[ex.category]} colors={gradients.exercise} size={44} style={{ marginRight: spacing.md }} />
                <Pressable style={styles.rowMain} onPress={() => pick(ex)} onLongPress={() => openEditor(ex)}>
                  <Text style={styles.name} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {CATEGORY_LABELS[ex.category]} · {MUSCLE_LABELS[ex.muscle]}
                    {ex.equipment ? ` · ${ex.equipment}` : ''}
                  </Text>
                </Pressable>
                <Pressable style={styles.editBtn} onPress={() => openEditor(ex)} hitSlop={6}>
                  <Text style={styles.editIcon}>✎</Text>
                </Pressable>
                <Pressable style={styles.addBtn} onPress={() => pick(ex)} hitSlop={6}>
                  <Text style={styles.addPlus}>＋</Text>
                </Pressable>
              </View>
            ))}
            {results.length === 0 ? <Text style={styles.empty}>No exercises match. Create one above.</Text> : null}
          </ScrollView>
        </SafeAreaView>

        <ExerciseEditorModal
          visible={editorOpen}
          initial={editing}
          onClose={() => setEditorOpen(false)}
          onSave={onUpsert}
          onDelete={onDelete}
        />
      </View>
    </Modal>
  );
}

function Filter({ label, active, onPress, subtle }: { label: string; active: boolean; onPress: () => void; subtle?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, active && (subtle ? styles.filterActiveSubtle : styles.filterActive)]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
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

  filterRow: { flexGrow: 0, marginTop: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filter: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.primarySoft, borderColor: colors.exercise },
  filterActiveSubtle: { backgroundColor: colors.surfaceMuted, borderColor: colors.borderStrong },
  filterText: { ...type.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.text, fontWeight: '700' },

  list: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  createRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.exercise, borderStyle: 'dashed', marginBottom: spacing.xs,
  },
  createPlus: { color: colors.exercise, fontSize: 18, fontWeight: '700' },
  createText: { ...type.body, color: colors.exercise, fontWeight: '700' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
  },
  rowMain: { flex: 1 },
  name: { ...type.body, fontWeight: '600' },
  meta: { ...type.caption, marginTop: 2 },
  editBtn: { paddingHorizontal: spacing.sm },
  editIcon: { color: colors.textMuted, fontSize: 15 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  addPlus: { color: colors.exercise, fontSize: 18, fontWeight: '700' },
  empty: { ...type.caption, textAlign: 'center', marginTop: spacing.xl },
});
