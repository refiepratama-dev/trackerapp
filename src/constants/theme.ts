/**
 * Design tokens from the Design System doc. The app is dark-only, so `light`
 * and `dark` share the same values (the template's hooks still expect both keys).
 */

import '@/global.css';

import { Platform } from 'react-native';

const dark = {
  text: '#FFFFFF',
  background: '#0F1012',
  /** glass-fill: white at 8% */
  backgroundElement: 'rgba(255, 255, 255, 0.08)',
  backgroundSelected: 'rgba(255, 255, 255, 0.14)',
  /** text-secondary: white at 60% */
  textSecondary: 'rgba(255, 255, 255, 0.6)',
} as const;

export const Colors = {
  light: dark,
  dark,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Brand colors that do not change with the theme. */
export const Brand = {
  /** accent: primary buttons, route line, highlights */
  accent: '#C8F542',
  /** on-accent: text on top of lime buttons */
  onAccent: '#0F1012',
  /** alert: pause button and warnings only */
  alert: '#FF4D5E',
  /** glass-border: white at 14% */
  glassBorder: 'rgba(255, 255, 255, 0.14)',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` (SF Pro) */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
