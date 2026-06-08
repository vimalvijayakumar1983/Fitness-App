import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ReadinessGauge } from '@/components/ReadinessGauge';
import { Thumb } from '@/components/Thumb';
import { GoalSetupModal } from '@/components/GoalSetupModal';
import { RecipeLibraryModal } from '@/components/RecipeLibraryModal';
import { RecipeDetailModal } from '@/components/RecipeDetailModal';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { GoalType, MealType, Recipe } from '@/models/types';
import { RECIPES_BY_ID } from '@/data/recipes';
import { recipeImage } from '@/utils/images';
import { computeTargets, DIET_LABELS, GOAL_LABELS } from '@/utils/targets';
import { adherenceScore, generatePlan, groceryFromPlan, planTotals } from '@/utils/planner';
import { summarizeMacros } from '@/utils/selectors';
import { todayISO } from '@/utils/date';

const SLOT_EMOJI: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

const GOAL_CARDS: { goal: GoalType; emoji: string; blurb: string }[] = [
  { goal: 'lose', emoji: '🔥', blurb: 'Lean down' },
  { goal: 'maintain', emoji: '⚖️', blurb: 'Stay balanced' },
  { goal: 'gain', emoji: '💪', blurb: 'Build muscle' },
];

export function PlanScreen() {
  const { data, addMeal, updateProfile, setPlan } = useData();
  const [setupOpen, setSetupOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const today = todayISO();
  const { profile, plan } = data;
  const logged = summarizeMacros(data, today);
  const adherence = adherenceScore(logged, profile.calorieTarget, profile.macroTargets);

  const grocery = useMemo(() => (plan ? groceryFromPlan(plan) : []), [plan]);
  const totals = useMemo(() => (plan ? planTotals(plan) : null), [plan]);

  const logRecipe = (recipe: Recipe, slot?: MealType, servings = 1) => {
    addMeal({
      date: today,
      type: slot ?? recipe.mealTypes[0],
      items: [{
        name: servings > 1 ? `${recipe.name} ×${servings}` : recipe.name,
        calories: recipe.calories * servings,
        protein: recipe.protein * servings,
        carbs: recipe.carbs * servings,
        fat: recipe.fat * servings,
      }],
    });
  };

  const pickGoal = (goal: GoalType) => {
    const next = { ...profile, goal };
    const t = computeTargets(next);
    updateProfile({ goal, calorieTarget: t.calorieTarget, macroTargets: t.macroTargets });
    setPlan(generatePlan({ ...next, ...t }, today));
  };

  const toggleCheck = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  return (
    <ScreenContainer title="Plan" subtitle="Your meal planner">
      {/* Goal picker (Delicut-style, goal-led) */}
      <Text style={styles.goalHeading}>What's your goal?</Text>
      <View style={styles.goalRow}>
        {GOAL_CARDS.map((g) => {
          const active = profile.goal === g.goal;
          return (
            <Pressable key={g.goal} style={[styles.goalCard, active && styles.goalCardActive]} onPress={() => pickGoal(g.goal)}>
              <Text style={styles.goalEmoji}>{g.emoji}</Text>
              <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>{GOAL_LABELS[g.goal]}</Text>
              <Text style={styles.goalBlurb}>{g.blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Targets */}
      <Card
        title="Your targets"
        trailing={<Pressable onPress={() => setSetupOpen(true)}><Text style={styles.edit}>Edit</Text></Pressable>}
      >
        <Text style={type.metric}>{profile.calorieTarget}<Text style={styles.unit}> kcal/day</Text></Text>
        <Text style={styles.sub}>{GOAL_LABELS[profile.goal]} · {DIET_LABELS[profile.diet]}</Text>
        <View style={styles.targetMacros}>
          <Tag label={`P ${profile.macroTargets.protein}g`} color={colors.exercise} />
          <Tag label={`C ${profile.macroTargets.carbs}g`} color={colors.sleep} />
          <Tag label={`F ${profile.macroTargets.fat}g`} color={colors.meal} />
        </View>
      </Card>

      {/* Adherence */}
      <Card title="Today's adherence">
        <View style={styles.adherence}>
          <ReadinessGauge score={adherence} label="On target" size={150} colors={gradients.readiness} />
          <View style={styles.adherenceLegend}>
            <Text style={styles.legendLine}>{logged.calories} / {profile.calorieTarget} kcal</Text>
            <Text style={styles.legendSub}>P {Math.round(logged.protein)}/{profile.macroTargets.protein}g</Text>
            <Text style={styles.legendSub}>C {Math.round(logged.carbs)}/{profile.macroTargets.carbs}g</Text>
            <Text style={styles.legendSub}>F {Math.round(logged.fat)}/{profile.macroTargets.fat}g</Text>
          </View>
        </View>
      </Card>

      {/* Meal plan */}
      <Card
        title="Meal plan"
        trailing={plan ? <Pressable onPress={() => setPlan(generatePlan(profile, today))}><Text style={styles.edit}>Regenerate</Text></Pressable> : undefined}
      >
        {!plan ? (
          <>
            <Text style={styles.hint}>Generate a day of meals matched to your {DIET_LABELS[profile.diet].toLowerCase()} target of {profile.calorieTarget} kcal.</Text>
            <PrimaryButton label="✨ Generate my plan" onPress={() => setPlan(generatePlan(profile, today))} gradient={gradients.primary} style={{ marginTop: spacing.lg }} />
          </>
        ) : (
          <>
            {plan.meals.map((m) => {
              const r = RECIPES_BY_ID[m.recipeId];
              if (!r) return null;
              return (
                <View key={m.slot} style={styles.planRow}>
                  <Pressable style={styles.planMain} onPress={() => setDetail(r)}>
                    <Thumb uri={recipeImage(r, 200)} emoji={r.emoji} colors={gradients.meal} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotLabel}>{m.slot}{m.servings > 1 ? ` · ${m.servings} servings` : ''}</Text>
                      <Text style={styles.planName}>{r.name}</Text>
                      <Text style={styles.planMeta}>{r.calories * m.servings} kcal · P{r.protein * m.servings} C{r.carbs * m.servings} F{r.fat * m.servings}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.logBtn} onPress={() => logRecipe(r, m.slot, m.servings)}>
                    <Text style={styles.logText}>Log</Text>
                  </Pressable>
                </View>
              );
            })}
            {totals ? (
              <Text style={styles.planTotal}>Plan total: {totals.calories} kcal · P{totals.protein} C{totals.carbs} F{totals.fat}</Text>
            ) : null}
          </>
        )}
        <PrimaryButton label="📖 Browse recipe library" onPress={() => setLibraryOpen(true)} variant="soft" color={colors.meal} style={{ marginTop: spacing.lg }} />
      </Card>

      {/* Grocery list */}
      {plan && grocery.length > 0 ? (
        <Card title={`Grocery list · ${grocery.length} items`}>
          {grocery.map((g) => {
            const isChecked = checked.has(g.name);
            return (
              <Pressable key={g.name} style={styles.groceryRow} onPress={() => toggleCheck(g.name)}>
                <View style={[styles.checkbox, isChecked && styles.checkboxOn]}>
                  {isChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={[styles.groceryName, isChecked && styles.groceryDone]}>{g.name}</Text>
                {g.detail ? <Text style={styles.groceryQty}>{g.detail}</Text> : null}
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <GoalSetupModal visible={setupOpen} profile={profile} onClose={() => setSetupOpen(false)} onSave={updateProfile} />
      <RecipeLibraryModal visible={libraryOpen} onClose={() => setLibraryOpen(false)} onLog={(r) => logRecipe(r)} />
      <RecipeDetailModal visible={!!detail} recipe={detail} onClose={() => setDetail(null)} onLog={(r) => logRecipe(r)} />
    </ScreenContainer>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  goalHeading: { ...type.sectionTitle, marginBottom: spacing.md },
  goalRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  goalCard: {
    flex: 1, alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.sm,
  },
  goalCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  goalEmoji: { fontSize: 28 },
  goalLabel: { ...type.caption, fontWeight: '700', color: colors.text, marginTop: 6, textAlign: 'center' },
  goalLabelActive: { color: colors.primaryDark },
  goalBlurb: { ...type.caption, fontSize: 11, marginTop: 1 },

  edit: { ...type.caption, color: colors.primary, fontWeight: '700' },
  unit: { ...type.body, color: colors.textSecondary },
  sub: { ...type.caption, marginTop: 4 },
  targetMacros: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  tagText: { ...type.caption, fontWeight: '700' },

  adherence: { flexDirection: 'row', alignItems: 'center' },
  adherenceLegend: { flex: 1, marginLeft: spacing.xl, gap: 4 },
  legendLine: { ...type.body, fontWeight: '700' },
  legendSub: { ...type.caption },

  hint: { ...type.caption, lineHeight: 19 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  planMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  slotEmoji: { fontSize: 24 },
  slotLabel: { ...type.label, color: colors.textMuted, textTransform: 'capitalize' },
  planName: { ...type.body, fontWeight: '600', marginTop: 1 },
  planMeta: { ...type.caption, marginTop: 2 },
  logBtn: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.primary },
  logText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  planTotal: { ...type.caption, color: colors.textSecondary, marginTop: spacing.md, fontWeight: '600' },

  groceryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontSize: 13, fontWeight: '900' },
  groceryName: { ...type.body, flex: 1 },
  groceryDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  groceryQty: { ...type.caption, color: colors.textSecondary },
});
