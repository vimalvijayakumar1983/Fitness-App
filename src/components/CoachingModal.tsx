import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { IconBadge } from './IconBadge';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { Coach, CoachBooking } from '@/models/types';

interface Props {
  visible: boolean;
  coaches: Coach[];
  booking: CoachBooking | null;
  hasAccount: boolean;
  busy?: boolean;
  onBook: (coachId: string, note: string) => void;
  onEnd: (booking: CoachBooking) => void;
  onClose: () => void;
}

/** Initials avatar fallback colour from the name. */
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function CoachingModal({ visible, coaches, booking, hasAccount, busy, onBook, onEnd, onClose }: Props) {
  const [selected, setSelected] = useState<Coach | null>(null);
  const [note, setNote] = useState('');

  const bookedCoach = booking ? coaches.find((c) => c.id === booking.coachId) : null;

  const close = () => { setSelected(null); setNote(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Coaching</Text>
              <Text style={type.title}>{selected ? selected.name : 'Find your coach'}</Text>
            </View>
            <Pressable onPress={selected ? () => setSelected(null) : close} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>{selected ? '‹' : '✕'}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Detail / booking view */}
            {selected ? (
              <>
                <View style={styles.detailHead}>
                  <IconBadge emoji={initials(selected.name)} colors={gradients.primary} size={64} />
                  <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <Text style={styles.dTitle}>{selected.title}</Text>
                    <Text style={styles.dRating}>★ {selected.rating.toFixed(1)} · {selected.reviews} reviews</Text>
                  </View>
                </View>
                <View style={styles.chips}>
                  {selected.specialties.map((s) => <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>)}
                </View>
                <Text style={styles.bio}>{selected.bio}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>🗣 {selected.languages.join(', ')}</Text>
                  <Text style={styles.price}>${selected.priceMonthUsd}<Text style={styles.priceSub}>/mo</Text></Text>
                </View>

                {hasAccount ? (
                  <>
                    <Text style={styles.noteLabel}>Message to your coach (optional)</Text>
                    <TextInput
                      style={styles.noteInput}
                      placeholder="What would you like help with?"
                      placeholderTextColor={colors.textMuted}
                      value={note}
                      onChangeText={setNote}
                      multiline
                    />
                    <PrimaryButton label={busy ? 'Requesting…' : `Request ${selected.name.split(' ')[0]}`} onPress={() => onBook(selected.id, note)} gradient={gradients.primary} disabled={busy} />
                  </>
                ) : (
                  <Text style={styles.signin}>Sign in to connect with a coach.</Text>
                )}
              </>
            ) : (
              <>
                {/* Current coach banner */}
                {bookedCoach ? (
                  <View style={styles.activeCard}>
                    <IconBadge emoji={initials(bookedCoach.name)} colors={gradients.primary} size={48} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.activeName}>{bookedCoach.name}</Text>
                      <Text style={styles.activeStatus}>{booking?.status === 'requested' ? 'Request sent — your coach will reach out' : 'Your coach'}</Text>
                    </View>
                    <Pressable onPress={() => booking && onEnd(booking)} hitSlop={8}><Text style={styles.endText}>End</Text></Pressable>
                  </View>
                ) : (
                  <Text style={styles.intro}>Work 1:1 with a vetted specialist — endocrinologists, dietitians and coaches who tailor your plan and keep you accountable.</Text>
                )}

                {coaches.map((c) => (
                  <Pressable key={c.id} onPress={() => setSelected(c)} style={styles.coachRow}>
                    <IconBadge emoji={initials(c.name)} colors={gradients.primary} size={52} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.coachName}>{c.name}</Text>
                      <Text style={styles.coachTitle} numberOfLines={1}>{c.title}</Text>
                      <Text style={styles.coachMeta}>★ {c.rating.toFixed(1)} · ${c.priceMonthUsd}/mo</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                ))}
              </>
            )}
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
  closeText: { color: colors.textSecondary, fontSize: 18, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  intro: { ...type.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.lg },
  activeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  activeName: { ...type.body, fontWeight: '700' },
  activeStatus: { ...type.caption, color: colors.primaryDark, marginTop: 1 },
  endText: { ...type.caption, color: colors.danger, fontWeight: '700' },
  coachRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  coachName: { ...type.body, fontWeight: '700' },
  coachTitle: { ...type.caption, marginTop: 1 },
  coachMeta: { ...type.caption, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  arrow: { fontSize: 26, color: colors.textMuted, marginLeft: spacing.sm },
  detailHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dTitle: { ...type.body, fontWeight: '600' },
  dRating: { ...type.caption, color: colors.warning, fontWeight: '700', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { ...type.caption, color: colors.primaryDark, fontWeight: '700' },
  bio: { ...type.body, color: colors.textSecondary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.lg },
  meta: { ...type.caption },
  price: { ...type.title, color: colors.text },
  priceSub: { ...type.caption, color: colors.textMuted },
  noteLabel: { ...type.label, marginBottom: spacing.sm },
  noteInput: { backgroundColor: colors.backgroundAlt, borderRadius: radius.md, padding: spacing.md, minHeight: 80, textAlignVertical: 'top', color: colors.text, marginBottom: spacing.lg, ...type.body },
  signin: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
