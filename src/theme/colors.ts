import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Dark, immersive "wearable-grade" theme — near-black canvas, glowing gradient
 * accents, glass surfaces, vivid data-viz colors. (Whoop / Oura / Apple Fitness.)
 */

export const colors = {
  // Canvas & surfaces
  background: '#080B10', // near-black, slight blue
  backgroundAlt: '#10151D',
  surface: '#141B25', // card
  surfaceMuted: '#1B2430',
  glassBorder: 'rgba(255,255,255,0.06)',
  border: '#222C3A',
  borderStrong: '#2C3848',

  // Text
  text: '#F3F6F9',
  textSecondary: '#AEB9C6',
  textMuted: '#6A7686',
  textInverse: '#0A0E13',

  // Brand
  primary: '#3DE0A0', // vivid mint
  primaryDark: '#1FB57E',
  primarySoft: 'rgba(61,224,160,0.14)',
  accent: '#FF7A59', // coral
  accentSoft: 'rgba(255,122,89,0.14)',

  // Status
  success: '#3DE0A0',
  warning: '#FFC24B',
  danger: '#FF6B6B',

  // Per-domain accent (vivid on dark)
  meal: '#FF8A5B',
  exercise: '#3DE0A0',
  mind: '#A78BFA',
  sleep: '#5B8DEF',
  water: '#38BDF8',

  glass: 'rgba(255,255,255,0.04)',
} as const;

/** Glowing gradient pairs per domain. */
export const gradients = {
  app: ['#080B10', '#0C1119'] as const,
  hero: ['#16202E', '#0D1521'] as const,
  meal: ['#FFB07A', '#FF6B4A'] as const,
  exercise: ['#5CF0B8', '#1FB57E'] as const,
  mind: ['#C4ABFF', '#8B6CF0'] as const,
  sleep: ['#7FB0FF', '#3D6FE0'] as const,
  water: ['#67D6F7', '#2BA6D9'] as const,
  primary: ['#5CF0B8', '#1FB57E'] as const,
  coral: ['#FFA07A', '#FF6B4A'] as const,
  readiness: ['#3DE0A0', '#FFC24B'] as const, // low→high sweep
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
    web: { boxShadow: '0 2px 12px rgba(0,0,0,0.35)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  })!,
  md: Platform.select({
    web: { boxShadow: '0 10px 30px rgba(0,0,0,0.45)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.45,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 7,
    },
  })!,
  lg: Platform.select({
    web: { boxShadow: '0 20px 50px rgba(0,0,0,0.55)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.55,
      shadowRadius: 34,
      shadowOffset: { width: 0, height: 18 },
      elevation: 12,
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

const displayFont = Platform.select({ ios: 'Georgia', default: 'serif' });

export const type: Record<string, TextStyle> = {
  display: { fontFamily: displayFont, fontSize: 32, fontWeight: '600', color: colors.text, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  metric: { fontSize: 30, fontWeight: '300', color: colors.text, letterSpacing: -1 },
  metricSmall: { fontSize: 22, fontWeight: '500', color: colors.text, letterSpacing: -0.5 },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
};

export type ColorName = keyof typeof colors;
