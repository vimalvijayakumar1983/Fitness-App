import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens for the "calm & editorial" theme.
 * Warm off-white canvas, soft pastel gradients, airy spacing, elegant type.
 */

export const colors = {
  // Canvas & surfaces
  background: '#F7F6F2', // warm off-white
  backgroundAlt: '#FBFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F1EC',
  border: '#EAE8E1',
  borderStrong: '#DEDCD3',

  // Text
  text: '#1F2A26', // deep charcoal, slight green tint
  textSecondary: '#5C665F',
  textMuted: '#9A9F98',
  textInverse: '#FFFFFF',

  // Brand
  primary: '#5B8A72', // sage green
  primaryDark: '#446A57',
  primarySoft: '#E7EFE9',
  accent: '#E8896B', // soft coral
  accentSoft: '#FBE6DD',

  // Status
  success: '#5B8A72',
  warning: '#D9A441',
  danger: '#D97A6C',

  // Per-domain accent (solid) — used for icons, ring strokes, labels
  meal: '#E8896B', // peach/coral
  exercise: '#4FA87E', // mint green
  mind: '#8B7BC7', // lavender
  sleep: '#5B7FD1', // periwinkle
  water: '#4FB0C6', // aqua

  // translucent overlays
  glass: 'rgba(255,255,255,0.7)',
  scrim: 'rgba(31,42,38,0.04)',
} as const;

/** Soft pastel gradient pairs per domain (light → slightly deeper). */
export const gradients = {
  app: ['#F7F6F2', '#EFEFE9'] as const,
  hero: ['#E7EFE9', '#F4ECE6'] as const, // sage → peach wash
  meal: ['#FFE2D1', '#FFC3A8'] as const,
  exercise: ['#D6F0E0', '#A6DCC0'] as const,
  mind: ['#E4DCF7', '#C9BCEE'] as const,
  sleep: ['#D6E2FA', '#B3C7F1'] as const,
  water: ['#D2F0F5', '#A7E0EA'] as const,
  primary: ['#79A98F', '#5B8A72'] as const,
  coral: ['#F2A98F', '#E8896B'] as const,
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

/** Subtle, layered soft shadow (web uses boxShadow, native uses elevation). */
export const shadow: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: Platform.select({
    web: { boxShadow: '0 2px 10px rgba(31,42,38,0.05)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1F2A26',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
  })!,
  md: Platform.select({
    web: { boxShadow: '0 8px 24px rgba(31,42,38,0.07)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1F2A26',
      shadowOpacity: 0.09,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
  })!,
  lg: Platform.select({
    web: { boxShadow: '0 16px 40px rgba(31,42,38,0.1)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1F2A26',
      shadowOpacity: 0.12,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 14 },
      elevation: 9,
    },
  })!,
};

/** Elegant type scale. Big, light display numbers; calm body. */
const displayFont = Platform.select({ ios: 'Georgia', default: 'serif' });

export const type: Record<string, TextStyle> = {
  // Editorial serif for greetings / section headlines
  display: { fontFamily: displayFont, fontSize: 34, fontWeight: '600', color: colors.text, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  // Thin, large metric numbers (Apple Health feel)
  metric: { fontSize: 30, fontWeight: '300', color: colors.text, letterSpacing: -1 },
  metricSmall: { fontSize: 22, fontWeight: '400', color: colors.text, letterSpacing: -0.5 },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
};

export type ColorName = keyof typeof colors;
