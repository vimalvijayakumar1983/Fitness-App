import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { MealsScreen } from '@/screens/MealsScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { ExerciseScreen } from '@/screens/ExerciseScreen';
import { MoodScreen } from '@/screens/MoodScreen';
import { SleepScreen } from '@/screens/SleepScreen';
import { CareScreen } from '@/screens/CareScreen';

const Tab = createBottomTabNavigator();

const META: Record<string, { icon: string; tint: string }> = {
  Today: { icon: '🏠', tint: colors.primary },
  Meals: { icon: '🍽️', tint: colors.meal },
  Plan: { icon: '🍱', tint: colors.warning },
  Care: { icon: '🩺', tint: colors.primary },
  Exercise: { icon: '🏃', tint: colors.exercise },
  Mind: { icon: '🧠', tint: colors.mind },
  Sleep: { icon: '😴', tint: colors.sleep },
};

const NAV_KEY: Record<string, StringKey> = {
  Today: 'nav.today', Meals: 'nav.meals', Plan: 'nav.plan', Care: 'nav.care',
  Exercise: 'nav.exercise', Mind: 'nav.mind', Sleep: 'nav.sleep',
};

/** Floating, rounded tab bar with an active pill. */
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = META[route.name];
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              <View
                style={[
                  styles.pill,
                  focused && { backgroundColor: `${meta.tint}1A` },
                ]}
              >
                <Text style={[styles.icon, { opacity: focused ? 1 : 0.55 }]}>{meta.icon}</Text>
              </View>
              <Text
                style={[
                  styles.label,
                  { color: focused ? meta.tint : colors.textMuted, fontWeight: focused ? '700' : '500' },
                ]}
              >
                {t(NAV_KEY[route.name] ?? 'nav.today', route.name)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const navTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tab.Screen name="Today" component={DashboardScreen} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen name="Plan" component={PlanScreen} />
        <Tab.Screen name="Care" component={CareScreen} />
        <Tab.Screen name="Exercise" component={ExerciseScreen} />
        <Tab.Screen name="Mind" component={MoodScreen} />
        <Tab.Screen name="Sleep" component={SleepScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  pill: {
    width: 46,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  label: { fontSize: 11, marginTop: 2 },
});
