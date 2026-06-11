import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider, useData } from '@/context/DataContext';
import { I18nProvider } from '@/i18n';
import { RootNavigator } from '@/navigation/RootNavigator';
import { OnboardingModal } from '@/components/OnboardingModal';
import { PaywallModal } from '@/components/PaywallModal';

// Load the Poppins web font so the UI matches the fresh, rounded brand look,
// and give the page a soft "letterbox" backdrop behind the centered app frame.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
  document.body.style.background = '#DCE3D6';
}

/**
 * On web, the app is a mobile-first layout — so on tablet/desktop we center it
 * in a phone-width frame instead of stretching full-bleed. No effect on native.
 */
function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webOuter}>
      <View style={styles.webFrame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: { flex: 1, alignItems: 'center', backgroundColor: '#DCE3D6' },
  webFrame: Platform.select({
    web: {
      flex: 1,
      width: '100%',
      maxWidth: 480,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#FBFCFA',
      boxShadow: '0 0 60px rgba(28,50,28,0.18)',
    } as any,
    default: { flex: 1 },
  }),
});

/** First-run funnel: onboarding quiz → paywall (skippable). */
function StartupGate() {
  const { data, loading, isPremium } = useData();
  const [onbOpen, setOnbOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (!loading && !data.profile.onboarded) setOnbOpen(true);
  }, [loading, data.profile.onboarded]);

  return (
    <>
      <OnboardingModal
        visible={onbOpen}
        onDone={() => {
          setOnbOpen(false);
          if (!isPremium) setPaywallOpen(true);
        }}
      />
      <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <WebFrame>
      <SafeAreaProvider>
        <I18nProvider>
          <AuthProvider>
            <DataProvider>
              <StatusBar style="dark" />
              <RootNavigator />
              <StartupGate />
            </DataProvider>
          </AuthProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </WebFrame>
  );
}
