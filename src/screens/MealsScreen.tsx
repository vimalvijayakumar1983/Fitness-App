import React, { useState } from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { TextField } from '@/components/TextField';
import { EntryRow } from '@/components/EntryRow';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useData } from '@/context/DataContext';
import { colors, gradients, spacing, type } from '@/theme/colors';
import { MealType } from '@/models/types';
import { formatTime, todayISO } from '@/utils/date';

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export function MealsScreen() {
  const { data, addMeal, removeEntry } = useData();
  const [type_, setType] = useState<MealType>('breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const today = todayISO();
  const todaysMeals = data.meals.filter((m) => m.date === today);
  const canSave = name.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    addMeal({
      date: today,
      type: type_,
      items: [{ name: name.trim(), calories: Number.parseInt(calories, 10) || 0 }],
    });
    setName('');
    setCalories('');
  };

  const total = todaysMeals.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.calories, 0),
    0,
  );

  return (
    <ScreenContainer title="Meals" subtitle="Nutrition">
      <Card title="Log a meal">
        <Text style={type.label}>Meal</Text>
        <SegmentedSelector
          options={MEAL_TYPES}
          value={type_}
          onChange={setType}
          accent={colors.meal}
        />
        <TextField
          label="Food"
          placeholder="e.g. Oatmeal with banana"
          value={name}
          onChangeText={setName}
          style={{ marginTop: spacing.lg }}
        />
        <TextField
          label="Calories (optional)"
          placeholder="e.g. 320"
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        <PrimaryButton
          label="Add meal"
          onPress={onSave}
          gradient={gradients.coral}
          disabled={!canSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Today's meals" trailing={total > 0 ? `${total} kcal` : undefined} />
      {todaysMeals.length === 0 ? (
        <Card>
          <EmptyState emoji="🥗" text="No meals logged yet today. Add your first above." />
        </Card>
      ) : (
        todaysMeals.map((meal) => {
          const cals = meal.items.reduce((s, i) => s + i.calories, 0);
          return (
            <EntryRow
              key={meal.id}
              emoji="🍽️"
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
    </ScreenContainer>
  );
}
