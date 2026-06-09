import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { PaywallModal } from './PaywallModal';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { apiEnabled } from '@/services/api';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Sign up / log in, and show cloud-sync status for the signed-in user. */
export function AccountModal({ visible, onClose }: Props) {
  const { user, login, register, logout } = useAuth();
  const { syncing, subscription, isPremium } = useData();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

          <View style={styles.body}>
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
                  {!isPremium ? (
                    <PrimaryButton label="✨ Go Premium" onPress={() => setPaywallOpen(true)} gradient={gradients.primary} style={{ marginTop: spacing.md }} />
                  ) : (
                    <Text style={styles.note}>Thanks for being a {subscription?.plan} member 💚</Text>
                  )}
                </View>

                <Text style={styles.note}>Your meals, workouts, and plan sync across every device you sign in on.</Text>
                <PrimaryButton label="Sign out" onPress={logout} variant="soft" color={colors.danger} style={{ marginTop: spacing.lg }} />
                <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
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
                <Pressable onPress={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }} style={styles.switch}>
                  <Text style={styles.switchText}>
                    {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
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
  body: { paddingHorizontal: spacing.lg },
  warn: { ...type.caption, color: colors.warning, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl },
  label: { ...type.label, color: colors.textMuted },
  email: { ...type.title, marginTop: 4 },
  roleTag: { ...type.label, color: colors.primary, marginTop: 6 },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing.sm },
  syncText: { ...type.caption, color: colors.textSecondary },
  note: { ...type.caption, marginTop: spacing.lg, lineHeight: 19 },
  err: { ...type.caption, color: colors.danger, marginVertical: spacing.sm },
  switch: { alignItems: 'center', marginTop: spacing.lg },
  switchText: { ...type.body, color: colors.primary, fontWeight: '600' },
});
