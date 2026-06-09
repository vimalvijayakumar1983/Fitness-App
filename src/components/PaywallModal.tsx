import React, { useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { api } from '@/services/api';
import { colors, gradients, hexA, radius, spacing, type } from '@/theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tier = 'premium' | 'coached';
type Interval = 'month' | 'year';

const CURRENCIES = ['usd', 'aed', 'eur', 'gbp'] as const;
const SYMBOL: Record<string, string> = { usd: '$', aed: 'AED ', eur: '€', gbp: '£' };

// Display prices (server is the source of truth for charging).
const PRICES: Record<Tier, Record<Interval, Record<string, number>>> = {
  premium: { month: { usd: 9.99, aed: 39, eur: 8.99, gbp: 7.99 }, year: { usd: 79, aed: 299, eur: 69, gbp: 59 } },
  coached: { month: { usd: 99, aed: 399, eur: 89, gbp: 79 }, year: { usd: 990, aed: 3990, eur: 890, gbp: 790 } },
};

const FEATURES: Record<Tier, string[]> = {
  premium: ['Auto meal-plan generation', 'Full recipe library', 'Advanced insights & trends', 'AI coach chat'],
  coached: ['Everything in Premium', 'A real coach assigns your plan', 'Weekly check-ins & adjustments', 'Priority support'],
};

export function PaywallModal({ visible, onClose }: Props) {
  const { token } = useAuth();
  const { refreshSubscription } = useData();
  const [interval, setInterval] = useState<Interval>('year');
  const [currency, setCurrency] = useState('usd');
  const [busy, setBusy] = useState<Tier | null>(null);
  const [msg, setMsg] = useState('');

  const subscribe = async (tier: Tier) => {
    if (!token) {
      setMsg('Create a free account first — tap your avatar on Home to sign up.');
      return;
    }
    setMsg('');
    setBusy(tier);
    try {
      const res = await api.checkout(tier, interval, currency);
      if (res.url) {
        if (Platform.OS === 'web') window.location.href = res.url;
        else await Linking.openURL(res.url);
      } else {
        // Dev/mock mode — activated immediately.
        refreshSubscription();
        setMsg('🎉 You’re now subscribed!');
        setTimeout(onClose, 900);
      }
    } catch (e: any) {
      setMsg(e.message || 'Could not start checkout.');
    } finally {
      setBusy(null);
    }
  };

  const price = (tier: Tier) => {
    const v = PRICES[tier][interval][currency] ?? PRICES[tier][interval].usd;
    const per = interval === 'year' ? '/yr' : '/mo';
    return `${SYMBOL[currency]}${v}${per}`;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Go Premium</Text>
              <Text style={type.title}>Unlock your full plan</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Interval toggle */}
            <View style={styles.toggle}>
              {(['month', 'year'] as Interval[]).map((iv) => (
                <Pressable key={iv} style={[styles.toggleBtn, interval === iv && styles.toggleOn]} onPress={() => setInterval(iv)}>
                  <Text style={[styles.toggleText, interval === iv && styles.toggleTextOn]}>
                    {iv === 'month' ? 'Monthly' : 'Yearly'}
                  </Text>
                  {iv === 'year' ? <Text style={styles.save}>Save ~35%</Text> : null}
                </Pressable>
              ))}
            </View>

            {/* Currency */}
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <Pressable key={c} onPress={() => setCurrency(c)} style={[styles.curChip, currency === c && styles.curOn]}>
                  <Text style={[styles.curText, currency === c && styles.curTextOn]}>{c.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>

            {(['premium', 'coached'] as Tier[]).map((tier) => (
              <LinearGradient
                key={tier}
                colors={(tier === 'premium' ? gradients.primary : gradients.coral) as unknown as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tierCard}
              >
                <View style={styles.tierHead}>
                  <Text style={styles.tierName}>{tier === 'premium' ? 'Premium' : 'Coached'}</Text>
                  {tier === 'premium' ? <Text style={styles.popular}>POPULAR</Text> : null}
                </View>
                <Text style={styles.tierPrice}>{price(tier)}</Text>
                <View style={styles.features}>
                  {FEATURES[tier].map((f) => (
                    <Text key={f} style={styles.feature}>✓ {f}</Text>
                  ))}
                </View>
                <Pressable style={styles.cta} onPress={() => subscribe(tier)} disabled={busy === tier}>
                  <Text style={styles.ctaText}>{busy === tier ? 'Starting…' : `Choose ${tier === 'premium' ? 'Premium' : 'Coached'}`}</Text>
                </Pressable>
              </LinearGradient>
            ))}

            {msg ? <Text style={styles.msg}>{msg}</Text> : null}
            <Text style={styles.fine}>Cancel anytime. Prices may vary by region; you’re charged in your selected currency.</Text>
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
  body: { padding: spacing.lg, paddingTop: 0 },

  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, padding: 4, marginBottom: spacing.md },
  toggleBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.surface, ...({ boxShadow: '0 2px 8px rgba(28,50,28,0.08)' } as any) },
  toggleText: { ...type.body, fontWeight: '700', color: colors.textSecondary },
  toggleTextOn: { color: colors.text },
  save: { ...type.caption, color: colors.primary, fontWeight: '700', fontSize: 11 },

  currencyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  curChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  curOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  curText: { ...type.caption, color: colors.textSecondary, fontWeight: '700' },
  curTextOn: { color: colors.primaryDark },

  tierCard: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierName: { ...type.title, color: '#fff' },
  popular: { ...type.label, color: '#fff', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tierPrice: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 4, letterSpacing: -1 },
  features: { marginTop: spacing.md, gap: 6 },
  feature: { ...type.body, color: '#fff' },
  cta: { backgroundColor: '#fff', borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg },
  ctaText: { fontWeight: '800', fontSize: 15, color: colors.text },

  msg: { ...type.body, color: colors.primaryDark, textAlign: 'center', marginVertical: spacing.sm, fontWeight: '600' },
  fine: { ...type.caption, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 },
});
