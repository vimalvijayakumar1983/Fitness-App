import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '@/theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'soft' | 'outline';
  /** Gradient pair for the solid variant. */
  gradient?: readonly [string, string];
  /** Tint color used by soft/outline variants. */
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Pill button with press-scale micro-interaction. */
export function PrimaryButton({
  label,
  onPress,
  variant = 'solid',
  gradient = [colors.primary, colors.primaryDark],
  color = colors.primary,
  loading,
  disabled,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const inactive = disabled || loading;
  const isSolid = variant === 'solid';
  const tintText = variant === 'outline' || variant === 'soft' ? color : colors.textInverse;

  const inner = loading ? (
    <ActivityIndicator color={tintText} />
  ) : (
    <Text style={[styles.label, { color: tintText }]}>{label}</Text>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, inactive && styles.disabled, style]}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
      >
        {isSolid ? (
          <LinearGradient
            colors={gradient as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, shadow.sm]}
          >
            {inner}
          </LinearGradient>
        ) : (
          <Animated.View
            style={[
              styles.base,
              variant === 'soft'
                ? { backgroundColor: hexWithAlpha(color, 0.12) }
                : { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' },
            ]}
          >
            {inner}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** Adds alpha to a #rrggbb color. */
function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  disabled: { opacity: 0.5 },
});
