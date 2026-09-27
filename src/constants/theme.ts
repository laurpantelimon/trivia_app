/**
 * Football theme: pitch-green brand colour, trophy gold and red-card red on
 * calm, flat surfaces (chalk-white by day, floodlit-stadium dark by night).
 * Fredoka (rounded) is reserved for headings and buttons; body text uses the
 * system font.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F1A14',
    textSecondary: '#5A6A60',
    background: '#F4F7F3',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2EFE3',
    border: '#DAE4DB',
    accent: '#1E8449',
    onAccent: '#FFFFFF',
    gold: '#F5C518',
    onGold: '#2A2100',
    success: '#22A55A',
    danger: '#D63A3A',
    disabled: '#E7ECE7',
    onDisabled: '#98A59C',
  },
  dark: {
    text: '#F2F7F3',
    textSecondary: '#A2B3A7',
    background: '#0B130F',
    backgroundElement: '#131F18',
    backgroundSelected: '#1B2E22',
    border: '#233429',
    accent: '#2EAE62',
    onAccent: '#FFFFFF',
    gold: '#F5C518',
    onGold: '#2A2100',
    success: '#3DD68C',
    danger: '#FF5C5C',
    disabled: '#18221C',
    onDisabled: '#5E6E63',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** The four classic answer colours (quiz options). Also used for avatars, like team kits. */
export const AnswerColors = [
  { fill: '#E5484D' },
  { fill: '#3B82F6' },
  { fill: '#F5B301' },
  { fill: '#22C55E' },
] as const;

/** Loaded in the root layout with `useFonts`. */
/** Two alternating greens, like freshly mown stripes on a pitch. */
export const PitchStripes = ['#1E8449', '#27A05A'] as const;

export const GameFonts = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semiBold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 12,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 800;
