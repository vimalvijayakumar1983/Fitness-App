import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextField } from './TextField';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { Food } from '@/models/types';
import { makeId } from '@/utils/date';

interface Props {
  visible: boolean;
  /** Provided when editing; omit to create a new food. */
  initial?: Food | null;
  onClose: () => void;
  onSave: (food: Food) => void;
  onDelete?: (foodId: string) => void;
}

const CATEGORIES: Food['category'][] = ['protein', 'carb', 'veg', 'fruit', 'dairy', 'fat', 'drink', 'snack', 'meal'];

export function FoodEditorModal({ visible, initial, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [serving, setServing] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [category, setCategory] = useState<Food['category']>('meal');

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setServing(initial?.serving ?? '1 serving');
    setCalories(initial ? String(initial.calories) : '');
    setProtein(initial ? String(initial.protein) : '');
    setCarbs(initial ? String(initial.carbs) : '');
    setFat(initial ? String(initial.fat) : '');
    setCategory(initial?.category ?? 'meal');
  }, [visible, initial]);

  const num = (s: string) => Math.max(0, Number.parseFloat(s) || 0);
  const canSave = name.trim().length > 0;
  const isCustom = initial?.id?.startsWith('custom_');

  const save = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? `custom_${makeId()}`,
      name: name.trim(),
      serving: serving.trim() || '1 serving',
      calories: Math.round(num(calories)),
      protein: Math.round(num(protein)),
      carbs: Math.round(num(carbs)),
      fat: Math.round(num(fat)),
      category,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{initial ? 'Edit food' : 'New food'}</Text>
              <Text style={type.title}>{initial ? 'Edit details' : 'Create a food'}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <TextField label="Name" placeholder="e.g. Grandma's lasagna" value={name} onChangeText={setName} />
            <TextField label="Serving" placeholder="e.g. 1 plate, 100 g" value={serving} onChangeText={setServing} />

            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, category === c && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextField label="Calories" placeholder="0" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
              </View>
              <View style={styles.col}>
                <TextField label="Protein (g)" placeholder="0" keyboardType="number-pad" value={protein} onChangeText={setProtein} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <TextField label="Carbs (g)" placeholder="0" keyboardType="number-pad" value={carbs} onChangeText={setCarbs} />
              </View>
              <View style={styles.col}>
                <TextField label="Fat (g)" placeholder="0" keyboardType="number-pad" value={fat} onChangeText={setFat} />
              </View>
            </View>

            {isCustom && onDelete ? (
              <Pressable
                onPress={() => {
                  onDelete(initial!.id);
                  onClose();
                }}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>Delete food</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Pressable onPress={save} disabled={!canSave}>
              <LinearGradient
                colors={gradients.meal as unknown as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}
              >
                <Text style={styles.saveText}>{initial ? 'Save changes' : 'Create food'}</Text>
              </LinearGradient>
            </Pressable>
          </SafeAreaView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.meal, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0 },
  sectionLabel: { ...type.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.meal },
  chipText: { ...type.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.meal, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  deleteBtn: { marginTop: spacing.md, paddingVertical: 14, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)' },
  deleteText: { color: colors.danger, fontWeight: '700' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
});
