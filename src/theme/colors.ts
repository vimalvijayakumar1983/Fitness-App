import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Light, fresh "healthy food brand" theme — clean white canvas, vibrant green
 * accent, soft surfaces, real food photography. (Delicut-inspired.)
 */

export const colors = {
  // Canvas & surfaces
  background: '#FBFCFA', // warm off-white
  backgroundAlt: '#F1F4EE', // input / muted fill
  surface: '#FFFFFF', // card
  surfaceMuted: '#EEF1EA',
  glassBorder: 'rgba(20,40,20,0.05)',
  border: '#E7EBE2',
  borderStrong: '#D6DCCD',

  // Text
  text: '#1A211A', // near-black, slight warm green
  textSecondary: '#586156',
  textMuted: '#949D90',
  textInverse: '#FFFFFF',

  // Brand
  primary: '#23A455', // fresh leaf green
  primaryDark: '#1B8A46',
  primarySoft: 'rgba(35,164,85,0.12)',
  accent: '#F2784B', // warm coral
  accentSoft: 'rgba(242,120,75,0.12)',

  // Status
  success: '#23A455',
  warning: '#E8A317',
  danger: '#E5484D',

  // Per-domain accent (tuned for light backgrounds)
  meal: '#F2784B',
  exercise: '#23A455',
  mind: '#8B5CF6',
  sleep: '#3B82F6',
  water: '#1FAFCB',

  glass: 'rgba(20,40,20,0.02)',
} as const;

/** Gradient pairs per domain. */
export const gradients = {
  app: ['#FBFCFA', '#F2F6EF'] as const,
  hero: ['#E9F6EE', '#DCEFE2'] as const,
  meal: ['#FB9E6E', '#F2784B'] as const,
  exercise: ['#48C97E', '#23A455'] as const,
  mind: ['#A78BFA', '#8B5CF6'] as const,
  sleep: ['#60A5FA', '#3B82F6'] as const,
  water: ['#56C7DD', '#1FAFCB'] as const,
  primary: ['#48C97E', '#23A455'] as const,
  coral: ['#FB9E6E', '#F2784B'] as const,
  readiness: ['#F2784B', '#23A455'] as const, // low→high sweep
} as const;

export type GradientName = keyof typeof gradients;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Soft elevation for dark surfaces. */
export const shadow: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: Platform.select({
    web: { boxShadow: '0 2px 10px rgba(28,50,28,0.06)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1C321C',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
  })!,
  md: Platform.select({
    web: { boxShadow: '0 10px 28px rgba(28,50,28,0.09)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1C321C',
      shadowOpacity: 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  })!,
  lg: Platform.select({
    web: { boxShadow: '0 18px 44px rgba(28,50,28,0.12)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1C321C',
      shadowOpacity: 0.14,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 16 },
      elevation: 10,
    },
  })!,
};

/** Colored glow behind a vivid element (web only; no-op on native). */
export function glow(color: string, intensity = 0.5): ViewStyle {
  return Platform.select({
    web: { boxShadow: `0 0 28px ${hexA(color, intensity)}` } as unknown as ViewStyle,
    default: {
      shadowColor: color,
      shadowOpacity: intensity,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
  })!;
}

/** #rrggbb + alpha → rgba-ish hex. */
export function hexA(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

// Clean modern sans across the app (system stack on web matches the fresh,
// rounded look of healthy-food brands like Delicut).
const sansFont = Platform.select({
  web: '"Poppins", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const type: Record<string, TextStyle> = {
  display: { fontFamily: sansFont, fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  title: { fontFamily: sansFont, fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  sectionTitle: { fontFamily: sansFont, fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  metric: { fontFamily: sansFont, fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  metricSmall: { fontFamily: sansFont, fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  body: { fontFamily: sansFont, fontSize: 15, fontWeight: '400', color: colors.text },
  label: { fontFamily: sansFont, fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontFamily: sansFont, fontSize: 13, fontWeight: '400', color: colors.textMuted },
};

export type ColorName = keyof typeof colors;
