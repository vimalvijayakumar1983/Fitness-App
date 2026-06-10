import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider, useData } from '@/context/DataContext';
import { I18nProvider } from '@/i18n';
import { RootNavigator } from '@/navigation/RootNavigator';
import { OnboardingModal } from '@/components/OnboardingModal';
import { PaywallModal } from '@/components/PaywallModal';

// Load the Poppins web font so the UI matches the fresh, rounded brand look.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

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
  );
}
