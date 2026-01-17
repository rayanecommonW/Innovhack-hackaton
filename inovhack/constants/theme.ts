/**
 * PACT Design System
 * Premium social betting aesthetic - dark, confident, trustworthy
 *
 * Design Philosophy:
 * - "Pact" = commitment, trust, a deal sealed
 * - Dark luxury fintech meets competitive gaming
 * - Sharp typography, bold contrasts, refined details
 */

import { Platform } from 'react-native';

export const Colors = {
  // Core Blacks - Deep, rich hierarchy
  black: '#000000',
  background: '#050505',
  surface: '#0C0C0C',
  surfaceElevated: '#141414',
  surfaceHighlight: '#1A1A1A',

  // Text Hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#5C5C5C',
  textMuted: '#3A3A3A',

  // Accent - Signature Gold (winning, premium)
  accent: '#D4AF37',
  accentLight: '#F4D03F',
  accentDark: '#B8860B',
  accentMuted: 'rgba(212, 175, 55, 0.15)',

  // Success - Vibrant Green (victory, profit)
  success: '#00D26A',
  successLight: '#00FF85',
  successDark: '#00A855',
  successMuted: 'rgba(0, 210, 106, 0.12)',

  // Danger - Sharp Red (loss, warning)
  danger: '#FF3B5C',
  dangerLight: '#FF6B84',
  dangerDark: '#CC2F4A',
  dangerMuted: 'rgba(255, 59, 92, 0.12)',

  // Info - Electric Blue (info, pending)
  info: '#0A84FF',
  infoLight: '#5AC8FA',
  infoMuted: 'rgba(10, 132, 255, 0.12)',

  // Warning - Amber (caution, validating)
  warning: '#FF9500',
  warningLight: '#FFB340',
  warningMuted: 'rgba(255, 149, 0, 0.12)',

  // Borders
  border: '#1F1F1F',
  borderLight: '#2A2A2A',
  borderAccent: 'rgba(212, 175, 55, 0.3)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Glass effect
  glass: 'rgba(20, 20, 20, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

export const Typography = {
  // Display - Hero headlines
  displayLarge: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  displayMedium: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  displaySmall: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  // Headlines
  headlineLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 16,
  },

  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },

  // Mono - Numbers, amounts
  mono: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums' as const],
  },
  monoLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  },
  monoHuge: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1,
    fontVariant: ['tabular-nums' as const],
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string, intensity: number = 0.4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 10,
  }),
  accentGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successGlow: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animation configs for react-native-reanimated
export const Animations = {
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  springSnappy: {
    damping: 25,
    stiffness: 400,
    mass: 0.6,
  },
  springBouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
  },
  timing: {
    duration: 200,
  },
  timingSlow: {
    duration: 400,
  },
};

// Category visual configs
export const CategoryConfig: Record<string, { color: string; bgColor: string }> = {
  sport: {
    color: Colors.success,
    bgColor: Colors.successMuted,
  },
  procrastination: {
    color: Colors.warning,
    bgColor: Colors.warningMuted,
  },
  screen_time: {
    color: Colors.info,
    bgColor: Colors.infoMuted,
  },
  social: {
    color: Colors.accent,
    bgColor: Colors.accentMuted,
  },
  default: {
    color: Colors.textSecondary,
    bgColor: Colors.surfaceHighlight,
  },
};

// Status configs
export const StatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  active: {
    color: Colors.success,
    bgColor: Colors.successMuted,
    label: 'Actif',
  },
  pending: {
    color: Colors.warning,
    bgColor: Colors.warningMuted,
    label: 'En attente',
  },
  validating: {
    color: Colors.info,
    bgColor: Colors.infoMuted,
    label: 'Validation...',
  },
  won: {
    color: Colors.accent,
    bgColor: Colors.accentMuted,
    label: 'Gagn\u00e9',
  },
  lost: {
    color: Colors.danger,
    bgColor: Colors.dangerMuted,
    label: 'Perdu',
  },
  approved: {
    color: Colors.success,
    bgColor: Colors.successMuted,
    label: 'Valid\u00e9',
  },
  rejected: {
    color: Colors.danger,
    bgColor: Colors.dangerMuted,
    label: 'Rejet\u00e9',
  },
};

// Fonts
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
});
