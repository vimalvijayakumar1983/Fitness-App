import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** 0..100 */
  score: number;
  size?: number;
  icon?: string;
}

/** Speedometer-style 270° arc with a glowing end-knob and a center icon. */
export function HealthArc({ score, size = 150, icon = '❤️' }: Props) {
  const clamped = Math.max(0, Math.min(100, score)) / 100;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const arc = C * 0.75; // 270°
  const anim = useRef(new Animated.Value(0)).current;
  const gradId = useRef(`harc-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: 1100, useNativeDriver: false }).start();
  }, [clamped, anim]);

  const dashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [arc, 0] });

  // End-knob position along the 270° arc (starts at 135°, sweeps clockwise).
  const endAngle = (135 + clamped * 270) * (Math.PI / 180);
  const knobX = cx + r * Math.cos(endAngle);
  const knobY = cy + r * Math.sin(endAngle);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor="#7CE0A8" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.surfaceMuted}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${C}`}
          transform={`rotate(135 ${cx} ${cy})`}
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={dashoffset}
          transform={`rotate(135 ${cx} ${cy})`}
        />
        <Circle cx={knobX} cy={knobY} r={strokeWidth / 2 + 2} fill={colors.primary} />
        <Circle cx={knobX} cy={knobY} r={strokeWidth / 4} fill="#fff" />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text style={{ fontSize: size * 0.2 }}>{icon}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
