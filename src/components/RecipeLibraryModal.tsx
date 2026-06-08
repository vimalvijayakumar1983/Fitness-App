import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from './TextField';
import { RecipeDetailModal } from './RecipeDetailModal';
import { Thumb } from './Thumb';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { DietPattern, Recipe } from '@/models/types';
import { searchRecipes } from '@/data/recipes';
import { recipeImage } from '@/utils/images';
import { DIET_LABELS } from '@/utils/targets';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLog: (recipe: Recipe) => void;
}

const DIET_FILTERS: ('all' | DietPattern)[] = ['all', 'balanced', 'high_protein', 'keto', 'low_carb', 'mediterranean', 'vegetarian', 'vegan'];

export function RecipeLibraryModal({ visible, onClose, onLog }: Props) {
  const [query, setQuery] = useState('');
  const [diet, setDiet] = useState<'all' | DietPattern>('all');
  const [detail, setDetail] = useState<Recipe | null>(null);

  const results = useMemo(() => searchRecipes(query, diet), [query, diet]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Recipe library</Text>
              <Text style={type.title}>Browse recipes</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <TextField
            placeholder="Search recipes"
            value={query}
            onChangeText={setQuery}
            style={{ marginHorizontal: spacing.lg }}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
            {DIET_FILTERS.map((d) => (
              <Pressable key={d} onPress={() => setDiet(d)} style={[styles.filter, diet === d && styles.filterActive]}>
                <Text style={[styles.filterText, diet === d && styles.filterTextActive]}>{d === 'all' ? 'All' : DIET_LABELS[d]}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {results.map((r) => (
              <Pressable key={r.id} style={styles.card} onPress={() => setDetail(r)}>
                <Thumb uri={recipeImage(r, 200)} emoji={r.emoji} colors={gradients.meal} size={52} style={{ marginRight: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{r.name}</Text>
                  <Text style={styles.cardMeta}>{r.calories} kcal · P{r.protein} C{r.carbs} F{r.fat} · {r.timeMin} min</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
            {results.length === 0 ? <Text style={styles.empty}>No recipes match.</Text> : null}
          </ScrollView>
        </SafeAreaView>

        <RecipeDetailModal visible={!!detail} recipe={detail} onClose={() => setDetail(null)} onLog={onLog} />
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
  filterRow: { flexGrow: 0, marginTop: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filter: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.accentSoft, borderColor: colors.meal },
  filterText: { ...type.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.meal, fontWeight: '700' },
  list: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardEmoji: { fontSize: 28 },
  cardName: { ...type.body, fontWeight: '600' },
  cardMeta: { ...type.caption, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 22 },
  empty: { ...type.caption, textAlign: 'center', marginTop: spacing.xl },
});
