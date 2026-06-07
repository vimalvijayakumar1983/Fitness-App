import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, type } from '@/theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  /** Optional element shown on the right of the header (e.g. avatar). */
  right?: React.ReactNode;
  children: React.ReactNode;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}

/** Screen scaffold: soft gradient canvas, editorial header, entrance animation. */
export function ScreenContainer({
  title,
  subtitle,
  right,
  children,
  onRefresh,
  refreshing,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 4 }),
    ]).start();
  }, [fade, slide]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.app as unknown as string[]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {subtitle ? <Text style={styles.eyebrow}>{subtitle}</Text> : null}
              <Text style={type.display}>{title}</Text>
            </View>
            {right}
          </View>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            {children}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  eyebrow: {
    ...type.label,
    color: colors.textMuted,
    marginBottom: 4,
  },
});
