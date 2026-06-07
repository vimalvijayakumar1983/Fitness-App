/** Centralized color palette so screens stay visually consistent. */
export const colors = {
  primary: '#0E7C66',
  primaryDark: '#0A5C4C',
  primaryLight: '#D4EFE8',
  accent: '#F4A259',

  background: '#F6F8F7',
  surface: '#FFFFFF',
  border: '#E2E8E5',

  text: '#1B2B27',
  textMuted: '#6B7B76',
  textInverse: '#FFFFFF',

  success: '#2E9E5B',
  warning: '#E0A800',
  danger: '#D9534F',

  // Per-domain accents used across the dashboard / tabs.
  meal: '#E8743B',
  exercise: '#0E7C66',
  mood: '#7C5CBF',
  sleep: '#3B6FE8',
} as const;

export type ColorName = keyof typeof colors;
