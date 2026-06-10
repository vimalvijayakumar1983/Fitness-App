import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from './PrimaryButton';
import { ReadinessGauge } from './ReadinessGauge';
import { useData } from '@/context/DataContext';
import { colors, gradients, hexA, radius, spacing, type } from '@/theme/colors';
import { biologicalAge, computeProjection } from '@/utils/longevity';

interface Props {
  visible: boolean;
  onClose: () => void;
  onTakeAssessment?: () => void;
}

export function LongevityModal({ visible, onClose, onTakeAssessment }: Props) {
  const { data } = useData();
  const bio = biologicalAge(data.profile, data.assessment, data);
  const proj = computeProjection(data.profile, data.assessment, data);

  const younger = bio.deltaYears <= 0;
  const deltaAbs = Math.abs(bio.deltaYears);
  const trajMax = Math.max(...proj.trajectory.map((p) => Math.max(p.current, p.optimized)), 1);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Longevity</Text>
              <Text style={type.title}>Biological age</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <LinearGradient colors={gradients.readiness as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroLabel}>YOUR BIOLOGICAL AGE</Text>
                  <Text style={styles.bioAge}>{bio.bioAge.toFixed(0)}</Text>
                  <Text style={styles.heroSub}>Actual age {bio.chronoAge}</Text>
                  <View style={styles.deltaPill}>
                    <Text style={styles.deltaText}>
                      {deltaAbs < 0.5 ? 'On par with your age' : `${deltaAbs.toFixed(1)} years ${younger ? 'younger' : 'older'}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.gaugeWrap}>
                  <ReadinessGauge score={bio.longevityScore} caption={bio.category} size={132} />
                  <Text style={styles.gaugeCap}>Longevity score</Text>
                </View>
              </View>
            </LinearGradient>

            {!data.assessment ? (
              <Pressable onPress={() => { onClose(); onTakeAssessment?.(); }} style={styles.assessBanner}>
                <Text style={styles.assessText}>📋 Take the health assessment for a far more accurate score ›</Text>
              </Pressable>
            ) : null}

            {/* Digital twin */}
            <Text style={styles.h}>🧬 Your digital twin</Text>
            <View style={styles.twinCard}>
              <Text style={styles.twinHeadline}>
                {proj.yearsToGain >= 0.5
                  ? <>You could gain <Text style={{ color: colors.primary }}>{proj.yearsToGain.toFixed(1)} healthy years</Text> by optimising your habits.</>
                  : 'Your habits are already protecting your healthspan — keep it up!'}
              </Text>

              {/* Trajectory: current vs optimized over 20 years */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} /><Text style={styles.legendText}>Current path</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Optimised path</Text></View>
              </View>
              <View style={styles.traj}>
                {proj.trajectory.map((p) => (
                  <View key={p.year} style={styles.trajCol}>
                    <View style={styles.trajBars}>
                      <View style={[styles.trajBar, { height: 8 + (p.current / trajMax) * 90, backgroundColor: colors.textMuted }]} />
                      <View style={[styles.trajBar, { height: 8 + (p.optimized / trajMax) * 90, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={styles.trajLabel}>{p.year === 0 ? 'now' : `+${p.year}y`}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Levers */}
            {proj.levers.length > 0 ? (
              <>
                <Text style={styles.h}>Your biggest levers</Text>
                {proj.levers.map((l) => (
                  <View key={l.key} style={styles.leverRow}>
                    <View style={[styles.leverBadge, { backgroundColor: colors.primarySoft }]}><Text style={styles.leverPlus}>+{l.years.toFixed(1)}y</Text></View>
                    <Text style={styles.leverLabel}>{l.label}</Text>
                  </View>
                ))}
              </>
            ) : null}

            {/* What's affecting your age */}
            <Text style={styles.h}>What's shaping your biological age</Text>
            {bio.factors.length === 0 ? (
              <Text style={styles.hint}>Complete the assessment and log your data to see the factors driving your biological age.</Text>
            ) : (
              bio.factors.map((f, i) => {
                const bad = f.years > 0;
                return (
                  <View key={i} style={styles.factorRow}>
                    <Text style={styles.factorLabel}>{f.label}</Text>
                    <Text style={[styles.factorYears, { color: bad ? colors.danger : colors.success }]}>
                      {bad ? '+' : ''}{f.years.toFixed(1)} yr
                    </Text>
                  </View>
                );
              })
            )}

            <Text style={styles.disclaimer}>An educational estimate from your habits and data — not a medical measurement. Use it to spot what moves the needle most.</Text>
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
  eyebrow: { ...type.label, color: colors.accent, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.xl, padding: spacing.xl },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { ...type.label, color: 'rgba(255,255,255,0.85)' },
  bioAge: { fontSize: 64, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 68 },
  heroSub: { ...type.body, color: 'rgba(255,255,255,0.9)' },
  deltaPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginTop: spacing.md },
  deltaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  gaugeWrap: { alignItems: 'center' },
  gaugeCap: { ...type.caption, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: '600' },
  assessBanner: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  assessText: { ...type.body, color: colors.primaryDark, fontWeight: '600' },
  h: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.md },
  twinCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  twinHeadline: { ...type.body, lineHeight: 23, fontWeight: '600', marginBottom: spacing.lg },
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { ...type.caption },
  traj: { flexDirection: 'row', alignItems: 'flex-end', height: 120, justifyContent: 'space-between' },
  trajCol: { flex: 1, alignItems: 'center' },
  trajBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 100 },
  trajBar: { width: 10, borderRadius: 3 },
  trajLabel: { ...type.caption, marginTop: 6, fontSize: 11 },
  leverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  leverBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: spacing.md },
  leverPlus: { color: colors.primaryDark, fontWeight: '800', fontSize: 13 },
  leverLabel: { ...type.body, fontWeight: '600' },
  factorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  factorLabel: { ...type.body, flex: 1 },
  factorYears: { ...type.body, fontWeight: '800' },
  hint: { ...type.caption, lineHeight: 19 },
  disclaimer: { ...type.caption, marginTop: spacing.xl, lineHeight: 18 },
});
