import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, type } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** 0..100 */
  score: number;
  label?: string;
  caption?: string;
  size?: number;
  colors?: readonly [string, string];
}

/**
 * 270° "readiness" gauge — a ring with a gap at the bottom, animated gradient
 * arc, and the score shown large in the center. (Whoop/Oura recovery style.)
 */
export function ReadinessGauge({
  score,
  label = 'Readiness',
  caption,
  size = 200,
  colors: gradientColors = ['#FF6B6B', '#3DE0A0'],
}: Props) {
  const clamped = Math.max(0, Math.min(100, score)) / 100;
  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const arcLen = C * 0.75; // 270° arc

  const anim = useRef(new Animated.Value(0)).current;
  const gradId = useRef(`gauge-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: 1100, useNativeDriver: false }).start();
  }, [clamped, anim]);

  const dashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [arcLen, 0] });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="100%" stopColor={gradientColors[1]} />
          </LinearGradient>
        </Defs>
        {/* Track (full 270° arc) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceMuted}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={dashoffset}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text style={styles.score}>{Math.round(score)}</Text>
        <Text style={styles.label}>{label}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 52, fontWeight: '200', color: colors.text, letterSpacing: -2 },
  label: { ...type.label, color: colors.textSecondary, marginTop: 2 },
  caption: { ...type.caption, marginTop: 6, color: colors.textMuted },
});
