import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { TextField } from '@/components/TextField';
import { EntryRow } from '@/components/EntryRow';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { MacroSummary } from '@/components/MacroSummary';
import { WaterTracker } from '@/components/WaterTracker';
import { FoodSearchModal } from '@/components/FoodSearchModal';
import { PhotoLogModal } from '@/components/PhotoLogModal';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import { FoodItem, MealType } from '@/models/types';
import { summarizeMacros, waterMl } from '@/utils/selectors';
import { foodEmojiName } from '@/utils/images';
import { formatTime, todayISO } from '@/utils/date';

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export function MealsScreen() {
  const { data, cms, addMeal, addWater, removeEntry, toggleFavoriteFood, upsertCustomFood, deleteCustomFood } = useData();
  const [type_, setType] = useState<MealType>('breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const today = todayISO();
  const todaysMeals = data.meals.filter((m) => m.date === today);
  const macros = summarizeMacros(data, today);
  const water = waterMl(data, today);
  const canSave = name.trim().length > 0;

  const onManualSave = () => {
    if (!canSave) return;
    addMeal({
      date: today,
      type: type_,
      items: [{ name: name.trim(), calories: Number.parseInt(calories, 10) || 0 }],
    });
    setName('');
    setCalories('');
  };

  const onAddFromSearch = (items: FoodItem[]) => {
    addMeal({ date: today, type: type_, items });
  };

  return (
    <ScreenContainer title="Meals" subtitle="Nutrition">
      {/* Daily macro summary */}
      <Card title="Today">
        <MacroSummary
          totals={macros}
          calorieTarget={data.profile.calorieTarget}
          macroTargets={data.profile.macroTargets}
        />
      </Card>

      {/* Water */}
      <Card title="Water">
        <WaterTracker ml={water} goalMl={data.profile.waterGoalMl} onAdd={(ml) => addWater(ml)} />
      </Card>

      {/* Log a meal */}
      <Card title="Log a meal">
        <Text style={type.label}>Meal</Text>
        <SegmentedSelector options={MEAL_TYPES} value={type_} onChange={setType} accent={colors.meal} />

        <PrimaryButton
          label="📸 Snap or scan a meal"
          onPress={() => setPhotoOpen(true)}
          gradient={gradients.primary}
          style={{ marginTop: spacing.lg }}
        />
        <PrimaryButton
          label="🔍 Search foods"
          onPress={() => setSearchOpen(true)}
          gradient={gradients.meal}
          variant="soft"
          color={colors.meal}
          style={{ marginTop: spacing.sm }}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or quick add</Text>
          <View style={styles.line} />
        </View>

        <TextField label="Food" placeholder="e.g. Oatmeal with banana" value={name} onChangeText={setName} />
        <TextField
          label="Calories (optional)"
          placeholder="e.g. 320"
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        <PrimaryButton
          label="Add manually"
          onPress={onManualSave}
          gradient={gradients.coral}
          disabled={!canSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Today's meals" trailing={macros.calories > 0 ? `${macros.calories} kcal` : undefined} />
      {todaysMeals.length === 0 ? (
        <Card>
          <EmptyState emoji="🥗" text="No meals logged yet today. Search foods or quick-add above." />
        </Card>
      ) : (
        todaysMeals.map((meal) => {
          const cals = meal.items.reduce((s, i) => s + i.calories, 0);
          return (
            <EntryRow
              key={meal.id}
              emoji={foodEmojiName(meal.items[0]?.name ?? '')}
              gradient={gradients.meal}
              title={meal.type[0].toUpperCase() + meal.type.slice(1)}
              subtitle={meal.items.map((i) => i.name).join(', ')}
              meta={formatTime(meal.loggedAt)}
              value={cals > 0 ? `${cals} kcal` : undefined}
              onRemove={() => removeEntry('meals', meal.id)}
            />
          );
        })
      )}

      <FoodSearchModal
        visible={searchOpen}
        mealType={type_}
        favoriteIds={data.favoriteFoodIds}
        customFoods={data.customFoods}
        cmsFoods={cms.foods}
        onToggleFavorite={toggleFavoriteFood}
        onUpsertFood={upsertCustomFood}
        onDeleteFood={deleteCustomFood}
        onClose={() => setSearchOpen(false)}
        onAdd={onAddFromSearch}
      />

      <PhotoLogModal
        visible={photoOpen}
        mealType={type_}
        onAdd={(items) => addMeal({ date: today, type: type_, items })}
        onClose={() => setPhotoOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...type.caption, color: colors.textMuted },
});
