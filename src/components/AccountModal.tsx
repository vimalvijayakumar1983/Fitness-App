import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { PaywallModal } from './PaywallModal';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { api, apiEnabled } from '@/services/api';
import { useI18n } from '@/i18n';
import { DEFAULT_REMINDERS, pushSupported } from '@/services/notifications';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import { Alert, Linking, Platform } from 'react-native';

const AVATAR_EMOJIS = ['🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐶', '🐵', '🦄', '🐸', '💪', '🏃', '🧘', '🥗', '🍎', '🔥', '🌿', '⭐️', '😀', '😎', '🧑', '👩', '👨', '🧔'];

/** Pick a photo (web file input or native image picker) → a data URL. */
async function pickAvatarPhoto(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return null;
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = () => {
        const f = input.files?.[0];
        if (!f) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(f);
      };
      input.click();
    });
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, allowsEditing: true, aspect: [1, 1], mediaTypes: ImagePicker.MediaTypeOptions.Images });
  if (res.canceled || !res.assets?.[0]?.base64) return null;
  const a = res.assets[0];
  return `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Sign up / log in, and show cloud-sync status for the signed-in user. */
export function AccountModal({ visible, onClose }: Props) {
  const { user, login, register, logout } = useAuth();
  const { syncing, subscription, isPremium, refreshSubscription, data, setReminders, updateProfile } = useData();
  const reminders = data.reminders ?? DEFAULT_REMINDERS;
  const { lang, setLang, t } = useI18n();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      if (mode === 'register') await register(email.trim(), password, name.trim() || undefined);
      else await login(email.trim(), password);
      setPassword('');
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const sendResetCode = async () => {
    setErr(''); setInfo(''); setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setInfo('If that email has an account, a 6-digit code is on its way. Enter it below.');
      setMode('reset');
    } catch (e: any) {
      setErr(e.message || 'Could not send code.');
    } finally { setBusy(false); }
  };

  const doReset = async () => {
    setErr(''); setBusy(true);
    try {
      await api.resetPassword(email.trim(), code.trim(), password);
      // Token is stored; load the account.
      await login(email.trim(), password).catch(() => {});
      setCode(''); setPassword(''); setInfo(''); setMode('login');
    } catch (e: any) {
      setErr(e.message || 'Could not reset password.');
    } finally { setBusy(false); }
  };

  const cancelSub = async () => {
    setBusy(true);
    try { await api.cancelSubscription(); refreshSubscription(); } finally { setBusy(false); }
  };
  const reactivateSub = async () => {
    setBusy(true);
    try { await api.reactivateSubscription(); refreshSubscription(); } finally { setBusy(false); }
  };
  const manageBilling = async () => {
    try {
      const r = await api.billingPortal();
      if (r.url) { if (Platform.OS === 'web') window.open(r.url, '_blank'); else Linking.openURL(r.url); }
    } catch { /* portal only in Stripe mode */ }
  };

  const exportData = async () => {
    try {
      const data = await api.exportData();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'alzaabi-health-export.json'; a.click();
        URL.revokeObjectURL(url);
      } else {
        setInfo('Your data export was generated. Use the web app to download the file.');
      }
    } catch (e: any) { setErr(e.message || 'Export failed.'); }
  };

  const deleteAccount = async () => {
    const go = async () => {
      try { await api.deleteAccount(); await logout(); } catch (e: any) { setErr(e.message || 'Could not delete account.'); }
    };
    if (Platform.OS === 'web') { if (typeof confirm !== 'undefined' && confirm(t('account.deleteConfirm'))) await go(); }
    else Alert.alert('Delete account', t('account.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.deleteAccount'), style: 'destructive', onPress: go },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Account</Text>
              <Text style={type.title}>{user ? 'Your account' : mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Avatar — photo or emoji */}
            <View style={styles.avatarBlock}>
              <Pressable
                onPress={async () => { const photo = await pickAvatarPhoto(); if (photo) updateProfile({ avatarPhoto: photo }); }}
                style={styles.avatarBig}
              >
                {data.profile.avatarPhoto ? (
                  <Image source={{ uri: data.profile.avatarPhoto }} style={styles.avatarImg} />
                ) : data.profile.avatarEmoji ? (
                  <Text style={styles.avatarBigEmoji}>{data.profile.avatarEmoji}</Text>
                ) : (
                  <Text style={styles.avatarBigText}>{(user?.name || user?.email || data.profile.name || 'U')[0].toUpperCase()}</Text>
                )}
                {isPremium ? <View style={styles.avatarCrown}><Text style={{ fontSize: 12 }}>👑</Text></View> : null}
              </Pressable>
              <View style={styles.avatarActions}>
                <Pressable onPress={async () => { const photo = await pickAvatarPhoto(); if (photo) updateProfile({ avatarPhoto: photo }); }}>
                  <Text style={styles.avatarLink}>Upload photo</Text>
                </Pressable>
                {(data.profile.avatarPhoto || data.profile.avatarEmoji) ? (
                  <Pressable onPress={() => updateProfile({ avatarPhoto: undefined, avatarEmoji: undefined })}>
                    <Text style={[styles.avatarLink, { color: colors.danger }]}>Reset</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.emojiRow}>
                {AVATAR_EMOJIS.map((e) => (
                  <Pressable key={e} onPress={() => updateProfile({ avatarEmoji: e, avatarPhoto: undefined })} style={[styles.emojiChip, data.profile.avatarEmoji === e && !data.profile.avatarPhoto && styles.emojiChipOn]}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {!apiEnabled ? (
              <Text style={styles.warn}>Cloud sync isn't configured for this build. Set EXPO_PUBLIC_API_URL to enable accounts.</Text>
            ) : null}

            {user ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.label}>Signed in as</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  {user.role === 'admin' ? <Text style={styles.roleTag}>ADMIN</Text> : null}
                  <View style={styles.syncRow}>
                    <View style={[styles.dot, { backgroundColor: syncing ? colors.warning : colors.success }]} />
                    <Text style={styles.syncText}>{syncing ? 'Syncing…' : 'All changes synced to the cloud'}</Text>
                  </View>
                </View>
                {/* Subscription */}
                <View style={[styles.card, { marginTop: spacing.md }]}>
                  <Text style={styles.label}>Subscription</Text>
                  <Text style={styles.email}>
                    {subscription?.plan === 'coached' ? 'Coached' : subscription?.plan === 'premium' ? 'Premium' : 'Free'}
                    {isPremium ? ' ✓' : ''}
                  </Text>
                  {subscription?.status === 'canceling' ? (
                    <Text style={[styles.note, { color: colors.warning }]}>
                      Cancels{subscription.currentPeriodEnd ? ` on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : ' at period end'} — access continues until then.
                    </Text>
                  ) : null}
                  {!isPremium ? (
                    <PrimaryButton label="✨ Go Premium" onPress={() => setPaywallOpen(true)} gradient={gradients.primary} style={{ marginTop: spacing.md }} />
                  ) : (
                    <>
                      <Text style={styles.note}>Thanks for being a {subscription?.plan} member 💚</Text>
                      <View style={styles.subActions}>
                        {subscription?.status === 'canceling' ? (
                          <PrimaryButton label="Resume plan" onPress={reactivateSub} variant="soft" color={colors.primary} loading={busy} style={{ flex: 1 }} />
                        ) : (
                          <PrimaryButton label="Cancel plan" onPress={cancelSub} variant="soft" color={colors.danger} loading={busy} style={{ flex: 1 }} />
                        )}
                        {subscription?.stripe ? (
                          <PrimaryButton label="Manage billing" onPress={manageBilling} variant="soft" color={colors.textSecondary} style={{ flex: 1 }} />
                        ) : null}
                      </View>
                    </>
                  )}
                </View>

                {/* Reminders */}
                <View style={[styles.card, { marginTop: spacing.md }]}>
                  <Text style={styles.label}>Reminders</Text>
                  <View style={styles.remRow}>
                    <Text style={styles.remLabel}>Daily log reminder</Text>
                    <Switch value={reminders.dailyLog} onValueChange={(v) => setReminders({ ...reminders, dailyLog: v })} trackColor={{ true: colors.primary }} />
                  </View>
                  <View style={styles.remRow}>
                    <Text style={styles.remLabel}>Morning glucose reminder</Text>
                    <Switch value={reminders.glucose} onValueChange={(v) => setReminders({ ...reminders, glucose: v })} trackColor={{ true: colors.primary }} />
                  </View>
                  <View style={styles.remRow}>
                    <Text style={styles.remLabel}>Weekly review (Sun)</Text>
                    <Switch value={reminders.weeklyReview} onValueChange={(v) => setReminders({ ...reminders, weeklyReview: v })} trackColor={{ true: colors.primary }} />
                  </View>
                  {!pushSupported ? <Text style={[styles.note, { marginTop: 4 }]}>Reminders are delivered as notifications in the mobile app.</Text> : null}
                </View>

                {/* Language */}
                <View style={[styles.card, { marginTop: spacing.md }]}>
                  <Text style={styles.label}>{t('account.language')}</Text>
                  <View style={styles.langRow}>
                    {(['en', 'ar'] as const).map((l) => (
                      <Pressable key={l} onPress={() => setLang(l)} style={[styles.langChip, lang === l && styles.langChipOn]}>
                        <Text style={[styles.langText, lang === l && styles.langTextOn]}>{l === 'en' ? 'English' : 'العربية'}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Privacy & data */}
                <View style={[styles.card, { marginTop: spacing.md }]}>
                  <Text style={styles.label}>{t('account.privacy')}</Text>
                  <Text style={[styles.note, { marginTop: spacing.sm }]}>{t('account.privacyNote')}</Text>
                  <View style={styles.subActions}>
                    <PrimaryButton label={t('account.exportData')} onPress={exportData} variant="soft" color={colors.primary} style={{ flex: 1 }} />
                    <PrimaryButton label={t('account.deleteAccount')} onPress={deleteAccount} variant="soft" color={colors.danger} style={{ flex: 1 }} />
                  </View>
                </View>

                <PrimaryButton label={t('account.signOut')} onPress={logout} variant="soft" color={colors.danger} style={{ marginTop: spacing.lg }} />
                <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
              </>
            ) : mode === 'forgot' ? (
              <>
                <Text style={styles.note}>Enter your email and we'll send a 6-digit reset code.</Text>
                <TextField label="Email" placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                {err ? <Text style={styles.err}>{err}</Text> : null}
                <PrimaryButton label={busy ? 'Sending…' : 'Send reset code'} onPress={sendResetCode} gradient={gradients.primary} disabled={busy || !email || !apiEnabled} style={{ marginTop: spacing.sm }} />
                <Pressable onPress={() => { setErr(''); setMode('login'); }} style={styles.switch}><Text style={styles.switchText}>Back to log in</Text></Pressable>
              </>
            ) : mode === 'reset' ? (
              <>
                {info ? <Text style={[styles.note, { color: colors.primaryDark }]}>{info}</Text> : null}
                <TextField label="Reset code" placeholder="123456" keyboardType="number-pad" value={code} onChangeText={setCode} />
                <TextField label="New password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
                {err ? <Text style={styles.err}>{err}</Text> : null}
                <PrimaryButton label={busy ? 'Resetting…' : 'Set new password'} onPress={doReset} gradient={gradients.primary} disabled={busy || code.length < 6 || password.length < 6} style={{ marginTop: spacing.sm }} />
                <Pressable onPress={() => { setErr(''); setMode('forgot'); }} style={styles.switch}><Text style={styles.switchText}>Resend code</Text></Pressable>
              </>
            ) : (
              <>
                {mode === 'register' ? (
                  <TextField label="Name" placeholder="Your name" value={name} onChangeText={setName} />
                ) : null}
                <TextField label="Email" placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <TextField label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
                {err ? <Text style={styles.err}>{err}</Text> : null}
                <PrimaryButton
                  label={busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
                  onPress={submit}
                  gradient={gradients.primary}
                  disabled={busy || !email || password.length < 6 || !apiEnabled}
                  style={{ marginTop: spacing.sm }}
                />
                {mode === 'login' ? (
                  <Pressable onPress={() => { setErr(''); setInfo(''); setMode('forgot'); }} style={styles.switch}>
                    <Text style={styles.switchText}>Forgot password?</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }} style={styles.switch}>
                  <Text style={styles.switchText}>
                    {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
                  </Text>
                </Pressable>
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
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  avatarBlock: { alignItems: 'center', marginBottom: spacing.lg },
  avatarBig: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: colors.primary },
  avatarImg: { width: '100%', height: '100%' },
  avatarBigEmoji: { fontSize: 46 },
  avatarBigText: { fontSize: 38, fontWeight: '800', color: colors.primaryDark },
  avatarCrown: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  avatarLink: { ...type.caption, color: colors.primary, fontWeight: '700' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  emojiChip: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  emojiChipOn: { backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primary },
  warn: { ...type.caption, color: colors.warning, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl },
  label: { ...type.label, color: colors.textMuted },
  email: { ...type.title, marginTop: 4 },
  roleTag: { ...type.label, color: colors.primary, marginTop: 6 },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing.sm },
  syncText: { ...type.caption, color: colors.textSecondary },
  note: { ...type.caption, marginTop: spacing.lg, lineHeight: 19 },
  subActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  remRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  remLabel: { ...type.body, fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  langChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  langChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
  langTextOn: { color: '#fff' },
  err: { ...type.caption, color: colors.danger, marginVertical: spacing.sm },
  switch: { alignItems: 'center', marginTop: spacing.lg },
  switchText: { ...type.body, color: colors.primary, fontWeight: '600' },
});
