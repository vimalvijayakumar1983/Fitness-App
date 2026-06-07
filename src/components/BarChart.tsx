import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, type } from '@/theme/colors';

interface Props {
  data: number[];
  labels?: string[];
  colors: readonly [string, string];
  height?: number;
  /** Optional reference line value (e.g. a goal). */
  goal?: number;
}

/** Animated vertical bar chart with rounded bars; last bar highlighted. */
export function BarChart({ data, labels, colors: gradientColors, height = 130, goal }: Props) {
  const max = Math.max(...data, goal ?? 0, 1);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }).start();
  }, [anim, data.join(',')]);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {goal ? (
          <View style={[styles.goalLine, { bottom: (goal / max) * height }]} />
        ) : null}
        {data.map((v, i) => {
          const isLast = i === data.length - 1;
          const target = (v / max) * height;
          const h = anim.interpolate({ inputRange: [0, 1], outputRange: [0, target] });
          return (
            <View key={i} style={styles.col}>
              <Animated.View style={{ height: h, width: '62%', borderRadius: radius.sm, overflow: 'hidden' }}>
                <LinearGradient
                  colors={gradientColors as unknown as string[]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={{ flex: 1, opacity: isLast ? 1 : 0.55 }}
                />
              </Animated.View>
            </View>
          );
        })}
      </View>
      {labels ? (
        <View style={styles.labels}>
          {labels.map((l, i) => (
            <Text key={i} style={[styles.label, i === labels.length - 1 && styles.labelActive]}>
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  labels: { flexDirection: 'row', gap: 6, marginTop: 8 },
  label: { ...type.caption, flex: 1, textAlign: 'center', fontSize: 11 },
  labelActive: { color: colors.text, fontWeight: '700' },
});
