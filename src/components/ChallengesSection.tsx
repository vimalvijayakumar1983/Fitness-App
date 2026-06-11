import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionHeader } from './SectionHeader';
import { Card } from './Card';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { api } from '@/services/api';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { AppData, Challenge, ChallengeMetric, LeaderboardEntry } from '@/models/types';
import { LinearGradient } from 'expo-linear-gradient';

/** Computes the user's progress for a challenge metric within its window. */
function localProgress(data: AppData, metric: ChallengeMetric, startAt: string, endAt: string): number {
  const inWin = (iso: string) => { const t = Date.parse(iso); return t >= Date.parse(startAt) && t <= Date.parse(endAt); };
  switch (metric) {
    case 'steps':
      return data.exercises.filter((e) => inWin(e.loggedAt)).reduce((a, e) => a + (e.steps ?? 0), 0);
    case 'active_minutes':
      return Math.round(data.exercises.filter((e) => inWin(e.loggedAt)).reduce((a, e) => a + e.durationMinutes, 0));
    case 'workouts':
      return data.exercises.filter((e) => inWin(e.loggedAt)).length;
    case 'glucose_logs':
      return data.glucose.filter((g) => inWin(g.loggedAt)).length;
    case 'days_logged':
      return new Set(data.meals.filter((m) => inWin(m.loggedAt)).map((m) => m.date)).size;
    default:
      return 0;
  }
}

export function ChallengesSection() {
  const { token } = useAuth();
  const { data } = useData();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [boardFor, setBoardFor] = useState<Challenge | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.listChallenges();
      let mineMap = new Map<string, number>();
      if (token) {
        const mine = await api.myChallenges().catch(() => []);
        mineMap = new Map(mine.map((m) => [m.id, m.progress ?? 0]));
      }
      const merged = list.map((c) => ({ ...c, joined: mineMap.has(c.id), progress: mineMap.get(c.id) ?? 0 }));
      setChallenges(merged);

      // Push freshly-computed local progress for joined challenges.
      if (token) {
        for (const c of merged.filter((x) => x.joined)) {
          const p = localProgress(data, c.metric, c.startAt, c.endAt);
          if (p !== c.progress) {
            api.setChallengeProgress(c.id, p).catch(() => {});
            c.progress = p;
          }
        }
        setChallenges([...merged]);
      }
    } catch { /* offline */ }
  }, [token, data]);

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (challenges.length === 0) return null;

  const join = async (c: Challenge) => {
    await api.joinChallenge(c.id).catch(() => {});
    const p = localProgress(data, c.metric, c.startAt, c.endAt);
    await api.setChallengeProgress(c.id, p).catch(() => {});
    setChallenges((prev) => prev.map((x) => (x.id === c.id ? { ...x, joined: true, progress: p } : x)));
  };

  return (
    <>
      <SectionHeader title="Challenges" />
      {challenges.map((c) => {
        const pct = Math.min(100, Math.round((Number(c.progress ?? 0) / c.goal) * 100));
        const daysLeft = Math.max(0, Math.ceil((Date.parse(c.endAt) - Date.now()) / 864e5));
        return (
          <Card key={c.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.emoji}>{c.emoji}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.title}>{c.title}</Text>
                <Text style={styles.sub} numberOfLines={2}>{c.description}</Text>
              </View>
            </View>
            {c.joined ? (
              <>
                <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{Math.round(Number(c.progress ?? 0)).toLocaleString()} / {c.goal.toLocaleString()} {c.unit} · {pct}%</Text>
                  <Pressable onPress={() => setBoardFor(c)}><Text style={styles.boardLink}>Leaderboard ›</Text></Pressable>
                </View>
              </>
            ) : (
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{c.participants ?? 0} joined · {daysLeft}d left</Text>
                {token ? (
                  <Pressable onPress={() => join(c)} style={styles.joinBtn}><Text style={styles.joinText}>Join</Text></Pressable>
                ) : <Text style={styles.meta}>Sign in to join</Text>}
              </View>
            )}
          </Card>
        );
      })}
      <LeaderboardModal challenge={boardFor} onClose={() => setBoardFor(null)} />
    </>
  );
}

function LeaderboardModal({ challenge, onClose }: { challenge: Challenge | null; onClose: () => void }) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    if (!challenge) { setRows([]); return; }
    api.challengeLeaderboard(challenge.id).then((r) => setRows(r.leaderboard)).catch(() => {});
  }, [challenge]);
  if (!challenge) return null;

  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`);

  return (
    <Modal visible={!!challenge} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Leaderboard</Text>
              <Text style={type.title}>{challenge.emoji} {challenge.title}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>
          <View style={styles.body}>
            {rows.length === 0 ? <Text style={styles.meta}>No participants yet — be the first to log progress!</Text> : null}
            {rows.map((e) => (
              <View key={e.rank} style={[styles.lbRow, e.you && styles.lbYou]}>
                <Text style={styles.lbRank}>{medal(e.rank)}</Text>
                <LinearGradient colors={gradients.primary as unknown as string[]} style={styles.lbAvatar}><Text style={styles.lbAvatarText}>{e.initials}</Text></LinearGradient>
                <Text style={[styles.lbName, e.you && { fontWeight: '800', color: colors.primaryDark }]}>{e.name}{e.you ? ' (you)' : ''}</Text>
                <Text style={styles.lbProgress}>{Math.round(e.progress).toLocaleString()} {challenge.unit}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 30 },
  title: { ...type.body, fontWeight: '800' },
  sub: { ...type.caption, marginTop: 2, lineHeight: 17 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { ...type.caption },
  boardLink: { ...type.caption, color: colors.primary, fontWeight: '700' },
  joinBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 20 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: spacing.lg },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  lbYou: { backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  lbRank: { ...type.body, fontWeight: '800', width: 34 },
  lbAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  lbAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  lbName: { ...type.body, flex: 1 },
  lbProgress: { ...type.body, fontWeight: '700' },
});
