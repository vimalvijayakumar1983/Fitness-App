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
import { PaywallModal } from '@/components/PaywallModal';
import { useData } from '@/context/DataContext';
import { useI18n } from '@/i18n';
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
  const { data, cms, addMeal, addWater, removeEntry, toggleFavoriteFood, upsertCustomFood, deleteCustomFood, featureLocked } = useData();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { t } = useI18n();
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
    <ScreenContainer title={t('nav.meals')} subtitle={t('meals.subtitle')}>
      {/* Daily macro summary */}
      <Card title={t('meals.today')}>
        <MacroSummary
          totals={macros}
          calorieTarget={data.profile.calorieTarget}
          macroTargets={data.profile.macroTargets}
        />
      </Card>

      {/* Water */}
      <Card title={t('meals.water')}>
        <WaterTracker ml={water} goalMl={data.profile.waterGoalMl} onAdd={(ml) => addWater(ml)} />
      </Card>

      {/* Log a meal */}
      <Card title={t('meals.logMeal')}>
        <Text style={type.label}>Meal</Text>
        <SegmentedSelector options={MEAL_TYPES} value={type_} onChange={setType} accent={colors.meal} />

        <PrimaryButton
          label={t('meals.snap')}
          onPress={() => (featureLocked('ai_food_photo') ? setPaywallOpen(true) : setPhotoOpen(true))}
          gradient={gradients.primary}
          style={{ marginTop: spacing.lg }}
        />
        <PrimaryButton
          label={t('meals.search')}
          onPress={() => setSearchOpen(true)}
          gradient={gradients.meal}
          variant="soft"
          color={colors.meal}
          style={{ marginTop: spacing.sm }}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{t('meals.quickAdd')}</Text>
          <View style={styles.line} />
        </View>

        <TextField label={t('meals.food')} placeholder="e.g. Oatmeal with banana" value={name} onChangeText={setName} />
        <TextField
          label={t('meals.caloriesOpt')}
          placeholder="e.g. 320"
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        <PrimaryButton
          label={t('meals.addManual')}
          onPress={onManualSave}
          gradient={gradients.coral}
          disabled={!canSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title={t('meals.todays')} trailing={macros.calories > 0 ? `${macros.calories} kcal` : undefined} />
      {todaysMeals.length === 0 ? (
        <Card>
          <EmptyState emoji="🥗" text={t('meals.empty')} />
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

      <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
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
