import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { Recipe } from '@/models/types';
import { recipeImage } from '@/utils/images';
import { DIET_LABELS } from '@/utils/targets';

interface Props {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onLog: (recipe: Recipe) => void;
}

export function RecipeDetailModal({ visible, recipe, onClose, onLog }: Props) {
  if (!recipe) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.emoji}>{recipe.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{recipe.timeMin} min · {recipe.mealTypes.join(', ')}</Text>
              <Text style={type.title}>{recipe.name}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Image source={{ uri: recipeImage(recipe, 600) }} style={styles.banner} resizeMode="cover" />
            <View style={styles.macroCard}>
              <Macro label="Calories" value={`${recipe.calories}`} />
              <Macro label="Protein" value={`${recipe.protein}g`} color={colors.exercise} />
              <Macro label="Carbs" value={`${recipe.carbs}g`} color={colors.sleep} />
              <Macro label="Fat" value={`${recipe.fat}g`} color={colors.meal} />
            </View>

            <View style={styles.tags}>
              {recipe.diets.map((d) => (
                <View key={d} style={styles.tag}><Text style={styles.tagText}>{DIET_LABELS[d]}</Text></View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <Text style={styles.ingDot}>•</Text>
                <Text style={styles.ingName}>{ing.name}</Text>
                <Text style={styles.ingQty}>{ing.quantity}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Method</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Pressable onPress={() => { onLog(recipe); onClose(); }}>
              <LinearGradient colors={gradients.coral as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logBtn}>
                <Text style={styles.logText}>Log to today · {recipe.calories} kcal</Text>
              </LinearGradient>
            </Pressable>
          </SafeAreaView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.macro}>
      <Text style={[styles.macroValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  emoji: { fontSize: 34 },
  eyebrow: { ...type.label, color: colors.meal, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0 },
  banner: { width: '100%', height: 170, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, marginBottom: spacing.lg },
  macroCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  macro: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  macroLabel: { ...type.caption, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  tagText: { ...type.caption, color: colors.textSecondary },
  sectionTitle: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.md },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  ingDot: { color: colors.meal, marginRight: spacing.md, fontSize: 18 },
  ingName: { ...type.body, flex: 1 },
  ingQty: { ...type.caption, color: colors.textSecondary },
  stepRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stepNum: { ...type.label, color: colors.meal, width: 18 },
  stepText: { ...type.body, flex: 1, lineHeight: 22 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  logBtn: { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  logText: { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
});
