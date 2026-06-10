import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '@/context/DataContext';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import { computeWeekReview } from '@/utils/weekReview';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const deltaColor = (good: boolean | null) => (good === true ? colors.success : good === false ? colors.danger : colors.textMuted);

export function WeekReviewModal({ visible, onClose }: Props) {
  const { data } = useData();
  const review = computeWeekReview(data);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Your week in review</Text>
              <Text style={type.title}>{review.rangeLabel}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={gradients.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <Text style={styles.heroTitle}>Here's how your week went 👇</Text>
              <Text style={styles.heroSub}>Compared to the previous 7 days.</Text>
            </LinearGradient>

            {/* Metric grid */}
            <View style={styles.grid}>
              {review.metrics.map((m) => (
                <View key={m.key} style={styles.tile}>
                  <Text style={styles.tileLabel}>{m.label}</Text>
                  <Text style={styles.tileValue}>{m.value}</Text>
                  {m.delta ? <Text style={[styles.tileDelta, { color: deltaColor(m.good) }]}>{m.delta} vs last wk</Text> : <Text style={styles.tileDeltaMuted}>—</Text>}
                </View>
              ))}
            </View>

            {/* Insights */}
            <Text style={styles.h}>Insights</Text>
            {review.insights.map((ins, i) => (
              <View key={i} style={[styles.insightRow, { borderLeftColor: deltaColor(ins.good) }]}>
                <Text style={styles.insightEmoji}>{ins.emoji}</Text>
                <Text style={styles.insightText}>{ins.text}</Text>
              </View>
            ))}

            <Text style={styles.footer}>Reviewed automatically from the data you logged. Keep logging for sharper insights each week.</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  heroCard: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  heroTitle: { ...type.sectionTitle },
  heroSub: { ...type.caption, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexGrow: 1, flexBasis: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  tileLabel: { ...type.label, color: colors.textMuted },
  tileValue: { ...type.metricSmall, marginTop: spacing.sm },
  tileDelta: { ...type.caption, fontWeight: '700', marginTop: 2 },
  tileDeltaMuted: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  h: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.md },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  insightEmoji: { fontSize: 18, marginRight: spacing.md },
  insightText: { ...type.body, flex: 1, lineHeight: 21 },
  footer: { ...type.caption, marginTop: spacing.lg, lineHeight: 18 },
});
