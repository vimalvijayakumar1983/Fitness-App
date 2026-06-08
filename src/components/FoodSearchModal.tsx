import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextField } from './TextField';
import { FoodEditorModal } from './FoodEditorModal';
import { Thumb } from './Thumb';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import { foodsById, mergeFoods, searchFoods } from '@/data/foods';
import { foodImage } from '@/utils/images';
import type { Food, FoodItem, MealType } from '@/models/types';

const CATEGORY_EMOJI: Record<Food['category'], string> = {
  protein: '🍗', carb: '🍚', veg: '🥦', fruit: '🍎', dairy: '🧀', fat: '🥑', drink: '🥤', snack: '🍫', meal: '🍽️',
};

interface Props {
  visible: boolean;
  mealType: MealType;
  favoriteIds: string[];
  customFoods: Food[];
  cmsFoods?: Food[];
  onToggleFavorite: (foodId: string) => void;
  onUpsertFood: (food: Food) => void;
  onDeleteFood: (foodId: string) => void;
  onClose: () => void;
  onAdd: (items: FoodItem[]) => void;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Search the food database, edit/create foods, pick servings, add to a meal. */
export function FoodSearchModal({
  visible,
  mealType,
  favoriteIds,
  customFoods,
  cmsFoods = [],
  onToggleFavorite,
  onUpsertFood,
  onDeleteFood,
  onClose,
  onAdd,
}: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);

  const foods = useMemo(() => mergeFoods(customFoods, cmsFoods), [customFoods, cmsFoods]);
  const byId = useMemo(() => foodsById(foods), [foods]);

  const results = useMemo(() => {
    if (query.trim()) return searchFoods(query, foods);
    const favs = favoriteIds.map((id) => byId[id]).filter(Boolean) as Food[];
    const favSet = new Set(favoriteIds);
    return [...favs, ...foods.filter((f) => !favSet.has(f.id))];
  }, [query, foods, byId, favoriteIds]);

  const selectedFoods = Object.entries(selected).filter(([, q]) => q > 0);
  const totalKcal = selectedFoods.reduce((sum, [id, q]) => sum + (byId[id]?.calories ?? 0) * q, 0);

  const setQty = (id: string, qty: number) => setSelected((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  const reset = () => {
    setQuery('');
    setSelected({});
  };

  const commit = () => {
    const items: FoodItem[] = selectedFoods.map(([id, q]) => {
      const f = byId[id];
      return {
        name: q > 1 ? `${f.name} ×${q}` : f.name,
        calories: Math.round(f.calories * q),
        protein: Math.round(f.protein * q),
        carbs: Math.round(f.carbs * q),
        fat: Math.round(f.fat * q),
      };
    });
    if (items.length) onAdd(items);
    reset();
    onClose();
  };

  const close = () => {
    reset();
    onClose();
  };

  const openEditor = (food: Food | null) => {
    setEditing(food);
    setEditorOpen(true);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Add to {cap(mealType)}</Text>
              <Text style={type.title}>Search foods</Text>
            </View>
            <Pressable onPress={close} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <TextField
            placeholder="Search e.g. chicken, biryani, paneer"
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={{ marginHorizontal: spacing.lg }}
          />

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            <Pressable style={styles.createRow} onPress={() => openEditor(null)}>
              <Text style={styles.createPlus}>＋</Text>
              <Text style={styles.createText}>Create a custom food</Text>
            </Pressable>

            {results.map((f) => {
              const qty = selected[f.id] ?? 0;
              const fav = favoriteIds.includes(f.id);
              return (
                <View key={f.id} style={[styles.row, qty > 0 && styles.rowActive]}>
                  <Thumb uri={foodImage(f)} emoji={CATEGORY_EMOJI[f.category]} colors={gradients.meal} size={44} style={{ marginRight: spacing.md }} />
                  <Pressable style={styles.rowMain} onPress={() => setQty(f.id, qty + 1)} onLongPress={() => openEditor(f)}>
                    <Text style={styles.foodName} numberOfLines={1}>{f.name}</Text>
                    <Text style={styles.foodMeta} numberOfLines={1}>
                      {f.serving} · {f.calories} kcal · P{f.protein} C{f.carbs} F{f.fat}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.star} onPress={() => onToggleFavorite(f.id)} hitSlop={8}>
                    <Text style={{ fontSize: 15, opacity: fav ? 1 : 0.3 }}>{fav ? '⭐' : '☆'}</Text>
                  </Pressable>
                  <Pressable style={styles.editBtn} onPress={() => openEditor(f)} hitSlop={6}>
                    <Text style={styles.editIcon}>✎</Text>
                  </Pressable>
                  {qty > 0 ? (
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepBtn} onPress={() => setQty(f.id, qty - 1)} hitSlop={6}>
                        <Text style={styles.stepText}>−</Text>
                      </Pressable>
                      <Text style={styles.qty}>{qty}</Text>
                      <Pressable style={styles.stepBtn} onPress={() => setQty(f.id, qty + 1)} hitSlop={6}>
                        <Text style={styles.stepText}>+</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.addBtn} onPress={() => setQty(f.id, 1)} hitSlop={6}>
                      <Text style={styles.addPlus}>＋</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
            {results.length === 0 ? <Text style={styles.empty}>No foods match "{query}". Create it above.</Text> : null}
          </ScrollView>

          {selectedFoods.length > 0 ? (
            <SafeAreaView edges={['bottom']} style={styles.footer}>
              <Pressable onPress={commit}>
                <LinearGradient
                  colors={gradients.coral as unknown as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.commitBtn}
                >
                  <Text style={styles.commitText}>
                    Add {selectedFoods.length} {selectedFoods.length === 1 ? 'item' : 'items'} · {totalKcal} kcal
                  </Text>
                </LinearGradient>
              </Pressable>
            </SafeAreaView>
          ) : null}
        </SafeAreaView>

        <FoodEditorModal
          visible={editorOpen}
          initial={editing}
          onClose={() => setEditorOpen(false)}
          onSave={onUpsertFood}
          onDelete={onDeleteFood}
        />
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

  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.meal,
    borderStyle: 'dashed',
    marginBottom: spacing.xs,
  },
  createPlus: { color: colors.meal, fontSize: 18, fontWeight: '700' },
  createText: { ...type.body, color: colors.meal, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowActive: { borderColor: colors.meal },
  star: { paddingRight: spacing.sm },
  rowMain: { flex: 1 },
  foodName: { ...type.body, fontWeight: '600' },
  foodMeta: { ...type.caption, marginTop: 2 },
  editBtn: { paddingHorizontal: spacing.sm },
  editIcon: { color: colors.textMuted, fontSize: 15 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  addPlus: { color: colors.meal, fontSize: 18, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  qty: { ...type.body, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  empty: { ...type.caption, textAlign: 'center', marginTop: spacing.xl },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  commitBtn: { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  commitText: { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
});
