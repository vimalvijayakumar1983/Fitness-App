import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '@/theme/colors';

interface Props {
  /** 0..1 (clamped). */
  progress: number;
  colors: readonly [string, string];
  height?: number;
  trackColor?: string;
}

/** Rounded gradient progress bar with an animated fill. */
export function ProgressBar({
  progress,
  colors: gradientColors,
  height = 10,
  trackColor = colors.surfaceMuted,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: trackColor }]}>
      <Animated.View style={{ width, height: '100%' }}>
        <LinearGradient
          colors={gradientColors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: height }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radius.pill },
});
