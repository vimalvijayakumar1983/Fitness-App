import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DICTS, Lang, RTL_LANGS, StringKey, en } from './strings';

const LANG_KEY = 'fitnessapp:lang';

interface I18nValue {
  lang: Lang;
  isRTL: boolean;
  setLang: (l: Lang) => void;
  t: (key: StringKey, fallback?: string) => string;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

/** Applies text direction for the chosen language (web + native). */
function applyDirection(lang: Lang) {
  const rtl = RTL_LANGS.includes(lang);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  } else {
    try {
      I18nManager.allowRTL(rtl);
      if (I18nManager.isRTL !== rtl) I18nManager.forceRTL(rtl);
    } catch {
      /* no-op */
    }
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((stored) => {
      if (stored === 'en' || stored === 'ar') {
        setLangState(stored);
        applyDirection(stored);
      }
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    applyDirection(l);
    void AsyncStorage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback(
    (key: StringKey, fallback?: string) => DICTS[lang]?.[key] ?? en[key] ?? fallback ?? key,
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, isRTL: RTL_LANGS.includes(lang), setLang, t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
