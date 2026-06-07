import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  emoji: string;
  colors: readonly [string, string];
  size?: number;
  style?: ViewStyle;
}

/** Rounded-square pastel gradient tile holding an emoji/icon. */
export function IconBadge({ emoji, colors: gradientColors, size = 44, style }: Props) {
  return (
    <LinearGradient
      colors={gradientColors as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size * 0.32 },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
