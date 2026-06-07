import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/colors';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { MealsScreen } from '@/screens/MealsScreen';
import { ExerciseScreen } from '@/screens/ExerciseScreen';
import { MoodScreen } from '@/screens/MoodScreen';
import { SleepScreen } from '@/screens/SleepScreen';

const Tab = createBottomTabNavigator();

/** Maps each tab to an emoji icon (keeps the scaffold dependency-free). */
const ICONS: Record<string, string> = {
  Today: '🏠',
  Meals: '🍽️',
  Exercise: '🏃',
  Mind: '🧠',
  Sleep: '😴',
};

function tabIcon(routeName: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {ICONS[routeName]}
    </Text>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarIcon: tabIcon(route.name),
        })}
      >
        <Tab.Screen name="Today" component={DashboardScreen} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen name="Exercise" component={ExerciseScreen} />
        <Tab.Screen name="Mind" component={MoodScreen} />
        <Tab.Screen name="Sleep" component={SleepScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
