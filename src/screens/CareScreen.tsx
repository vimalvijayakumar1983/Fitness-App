import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgramDetailModal } from '@/components/ProgramDetailModal';
import { CoachingModal } from '@/components/CoachingModal';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { api } from '@/services/api';
import { colors, gradients, hexA, radius, spacing, type } from '@/theme/colors';
import type { Coach, CoachBooking, Company, Enrollment, Program } from '@/models/types';

const CONDITION_EMOJI: Record<string, string> = {
  diabetes: '🩸', obesity: '⚖️', metabolic: '🔥', hypertension: '❤️',
};

export function CareScreen() {
  const { token } = useAuth();
  const { t } = useI18n();
  const hasAccount = !!token;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [booking, setBooking] = useState<CoachBooking | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const [openProgram, setOpenProgram] = useState<Program | null>(null);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [companyMsg, setCompanyMsg] = useState('');

  const loadPublic = useCallback(() => {
    api.listPrograms().then(setPrograms).catch(() => {});
    api.listCoaches().then(setCoaches).catch(() => {});
  }, []);

  const loadMine = useCallback(() => {
    if (!token) { setEnrollments([]); setBooking(null); setCompany(null); return; }
    api.myEnrollments().then(setEnrollments).catch(() => {});
    api.myCoaching().then((r) => setBooking(r.booking)).catch(() => {});
    api.myCompany().then((r) => setCompany(r.company)).catch(() => {});
  }, [token]);

  useEffect(() => { loadPublic(); }, [loadPublic]);
  useEffect(() => { loadMine(); }, [loadMine]);

  const enrollmentFor = (programId: string) =>
    enrollments.find((e) => e.programId === programId) ?? null;

  // ── Program handlers ──
  const handleEnroll = async (programId: string) => {
    setBusy(true);
    try {
      const e = await api.enroll(programId);
      setEnrollments((prev) => [e, ...prev.filter((x) => x.programId !== programId)]);
    } finally { setBusy(false); }
  };

  const handleToggleTask = async (enr: Enrollment, key: string) => {
    const next = enr.completedTasks.includes(key)
      ? enr.completedTasks.filter((k) => k !== key)
      : [...enr.completedTasks, key];
    setEnrollments((prev) => prev.map((e) => (e.id === enr.id ? { ...e, completedTasks: next } : e)));
    try { await api.updateEnrollment(enr.id, { completedTasks: next }); } catch { loadMine(); }
  };

  const handleSetWeek = async (enr: Enrollment, week: number) => {
    const patch = { currentWeek: week, status: enr.status };
    setEnrollments((prev) => prev.map((e) => (e.id === enr.id ? { ...e, ...patch } : e)));
    try { await api.updateEnrollment(enr.id, patch); } catch { loadMine(); }
  };

  const handleLeave = async (enr: Enrollment) => {
    setEnrollments((prev) => prev.filter((e) => e.id !== enr.id));
    setOpenProgram(null);
    try { await api.leaveProgram(enr.id); } catch { loadMine(); }
  };

  // ── Coaching handlers ──
  const handleBook = async (coachId: string, note: string) => {
    setBusy(true);
    try {
      const b = await api.bookCoach(coachId, note);
      setBooking(b);
      setCoachingOpen(false);
    } finally { setBusy(false); }
  };
  const handleEndCoaching = async (b: CoachBooking) => {
    setBooking(null);
    try { await api.endCoaching(b.id); } catch { loadMine(); }
  };

  // ── Corporate handlers ──
  const handleJoin = async () => {
    setCompanyMsg('');
    setBusy(true);
    try {
      const r = await api.joinCompany(code.trim());
      setCompany(r.company);
      setCode('');
      setCompanyMsg(`You're in — ${r.company.plan} unlocked via ${r.company.name}.`);
    } catch (e: any) {
      setCompanyMsg(e.message || 'Could not join.');
    } finally { setBusy(false); }
  };
  const handleLeaveCompany = async () => {
    await api.leaveCompany().catch(() => {});
    setCompany(null);
  };

  const activeEnrollment = enrollments.find((e) => e.status !== 'completed') ?? null;
  const activeProgram = activeEnrollment ? programs.find((p) => p.id === activeEnrollment.programId) : null;
  const bookedCoach = booking ? coaches.find((c) => c.id === booking.coachId) : null;

  const progressPct = (p: Program, e: Enrollment) => {
    const total = p.modules.reduce((a, m) => a + m.tasks.length, 0);
    return total ? Math.round((e.completedTasks.length / total) * 100) : 0;
  };

  return (
    <ScreenContainer title={t('nav.care')} subtitle={t('care.subtitle')}>
      {/* Active program spotlight */}
      {activeProgram && activeEnrollment ? (
        <Pressable onPress={() => setOpenProgram(activeProgram)}>
          <LinearGradient colors={[hexA(activeProgram.color || colors.primary, 0.16), hexA(activeProgram.color || colors.primary, 0.04)]} style={styles.active}>
            <Text style={[styles.activeEyebrow, { color: activeProgram.color || colors.primary }]}>CONTINUE YOUR PROGRAM</Text>
            <Text style={type.title}>{activeProgram.name}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${progressPct(activeProgram, activeEnrollment)}%`, backgroundColor: activeProgram.color || colors.primary }]} /></View>
            <Text style={styles.activeSub}>Week {activeEnrollment.currentWeek} of {activeProgram.durationWeeks} · {progressPct(activeProgram, activeEnrollment)}% complete</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {/* Reversal programs */}
      <SectionHeader title={t('care.programs')} />
      <Text style={styles.lead}>Structured, evidence-based programs to reverse and manage chronic conditions — guided week by week.</Text>
      {programs.map((p) => {
        const enr = enrollmentFor(p.id);
        const tint = p.color || colors.primary;
        return (
          <Pressable key={p.id} onPress={() => setOpenProgram(p)}>
            <Card style={styles.progCard}>
              <View style={styles.progRow}>
                <View style={[styles.progIcon, { backgroundColor: hexA(tint, 0.14) }]}>
                  <Text style={{ fontSize: 26 }}>{CONDITION_EMOJI[p.condition] ?? '🩺'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.progName}>{p.name}</Text>
                  <Text style={styles.progTag} numberOfLines={2}>{p.tagline}</Text>
                  <View style={styles.progMetaRow}>
                    <Text style={[styles.pill, { color: tint, backgroundColor: hexA(tint, 0.12) }]}>{p.durationWeeks} weeks</Text>
                    {enr ? <Text style={[styles.pill, { color: colors.primaryDark, backgroundColor: colors.primarySoft }]}>Enrolled</Text> : null}
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      })}

      {/* Coaching */}
      <SectionHeader title={t('care.coaching')} />
      <Card>
        {bookedCoach ? (
          <View style={styles.coachActive}>
            <Text style={{ fontSize: 30 }}>👩‍⚕️</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.coachName}>{bookedCoach.name}</Text>
              <Text style={type.caption}>{booking?.status === 'requested' ? 'Request sent' : 'Your coach'} · {bookedCoach.title}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.cardLead}>Work 1:1 with a vetted endocrinologist, dietitian or coach who tailors your plan and keeps you accountable.</Text>
        )}
        <PrimaryButton
          label={bookedCoach ? t('care.manageCoaching') : t('care.findCoach')}
          onPress={() => setCoachingOpen(true)}
          gradient={gradients.primary}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Corporate wellness */}
      <SectionHeader title={t('care.workplace')} />
      <Card>
        {company ? (
          <>
            <View style={styles.coachActive}>
              <Text style={{ fontSize: 30 }}>🏢</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.coachName}>{company.name}</Text>
                <Text style={type.caption}>{company.plan} unlocked through your employer</Text>
              </View>
            </View>
            <Pressable onPress={handleLeaveCompany} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}>
              <Text style={styles.leaveText}>Leave workplace plan</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.cardLead}>Got a code from your employer? Unlock premium for free and join your company wellness program.</Text>
            {hasAccount ? (
              <>
                <View style={styles.codeRow}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="COMPANY CODE"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    value={code}
                    onChangeText={setCode}
                  />
                  <PrimaryButton label="Join" onPress={handleJoin} disabled={busy || !code.trim()} gradient={gradients.primary} style={{ minWidth: 90 }} />
                </View>
                {companyMsg ? <Text style={styles.companyMsg}>{companyMsg}</Text> : null}
              </>
            ) : (
              <Text style={[type.caption, { marginTop: spacing.sm }]}>Sign in to redeem your company code.</Text>
            )}
          </>
        )}
      </Card>

      <ProgramDetailModal
        visible={!!openProgram}
        program={openProgram}
        enrollment={openProgram ? enrollmentFor(openProgram.id) : null}
        hasAccount={hasAccount}
        busy={busy}
        onEnroll={handleEnroll}
        onToggleTask={handleToggleTask}
        onSetWeek={handleSetWeek}
        onLeave={handleLeave}
        onClose={() => setOpenProgram(null)}
      />
      <CoachingModal
        visible={coachingOpen}
        coaches={coaches}
        booking={booking}
        hasAccount={hasAccount}
        busy={busy}
        onBook={handleBook}
        onEnd={handleEndCoaching}
        onClose={() => setCoachingOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  active: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  activeEyebrow: { ...type.label, marginBottom: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: hexA('#1A211A', 0.06), marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  activeSub: { ...type.caption, marginTop: spacing.sm, fontWeight: '600' },
  lead: { ...type.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.md },
  cardLead: { ...type.body, color: colors.textSecondary, lineHeight: 21 },
  progCard: { padding: spacing.lg },
  progRow: { flexDirection: 'row', alignItems: 'center' },
  progIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  progName: { ...type.body, fontWeight: '800' },
  progTag: { ...type.caption, marginTop: 2, lineHeight: 18 },
  progMetaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pill: { ...type.caption, fontWeight: '700', overflow: 'hidden', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11 },
  coachActive: { flexDirection: 'row', alignItems: 'center' },
  coachName: { ...type.body, fontWeight: '700' },
  leaveText: { ...type.caption, color: colors.danger, fontWeight: '700' },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  codeInput: { flex: 1, backgroundColor: colors.backgroundAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, letterSpacing: 1, fontWeight: '700', ...type.body },
  companyMsg: { ...type.caption, color: colors.primaryDark, marginTop: spacing.sm },
});
