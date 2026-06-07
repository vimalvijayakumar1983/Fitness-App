import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { useData } from '@/context/DataContext';
import { colors } from '@/theme/colors';
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
  const [type, setType] = useState<MealType>('breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const today = todayISO();
  const todaysMeals = data.meals.filter((m) => m.date === today);

  const canSave = name.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    addMeal({
      date: today,
      type,
      items: [
        {
          name: name.trim(),
          calories: Number.parseInt(calories, 10) || 0,
        },
      ],
    });
    setName('');
    setCalories('');
  };

  return (
    <ScreenContainer title="Meals" subtitle="Log the food you eat">
      <Card title="Log a meal" accent={colors.meal}>
        <Text style={styles.fieldLabel}>Meal</Text>
        <SegmentedSelector
          options={MEAL_TYPES}
          value={type}
          onChange={setType}
          accent={colors.meal}
        />

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Food</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Oatmeal with banana"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
          Calories (optional)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 320"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />

        <PrimaryButton
          label="Add meal"
          onPress={onSave}
          color={colors.meal}
          disabled={!canSave}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Text style={styles.sectionTitle}>Today's meals</Text>
      {todaysMeals.length === 0 ? (
        <Text style={styles.empty}>No meals logged yet today.</Text>
      ) : (
        todaysMeals.map((meal) => {
          const totalCals = meal.items.reduce((s, i) => s + i.calories, 0);
          return (
            <Card key={meal.id} accent={colors.meal}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealType}>
                    {meal.type[0].toUpperCase() + meal.type.slice(1)} ·{' '}
                    {formatTime(meal.loggedAt)}
                  </Text>
                  {meal.items.map((item, idx) => (
                    <Text key={idx} style={styles.mealItem}>
                      {item.name}
                      {item.calories ? ` — ${item.calories} kcal` : ''}
                    </Text>
                  ))}
                </View>
                <Pressable onPress={() => removeEntry('meals', meal.id)}>
                  <Text style={styles.delete}>Remove</Text>
                </Pressable>
              </View>
              {totalCals > 0 ? (
                <Text style={styles.total}>{totalCals} kcal total</Text>
              ) : null}
            </Card>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  mealType: { fontSize: 13, fontWeight: '700', color: colors.meal, marginBottom: 4 },
  mealItem: { fontSize: 15, color: colors.text },
  total: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  delete: { fontSize: 13, fontWeight: '600', color: colors.danger },
});
