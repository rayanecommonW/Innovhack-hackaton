/**
 * PACT Design System - LUMA INSPIRED
 * ═══════════════════════════════════════════════════════════════
 *
 * Aesthetic: Clean, sober, elegant minimalism
 *
 * ▪ Soft off-white backgrounds
 * ▪ Warm, muted color palette
 * ▪ Generous whitespace
 * ▪ Refined, light typography
 * ▪ Soft rounded corners
 * ▪ Barely-there shadows
 *
 * Premium through restraint. Calm. Trustworthy.
 */

import { Platform } from 'react-native';

// ════════════════════════════════════════════════════════════════
// COLORS - Warm, muted, sophisticated
// ════════════════════════════════════════════════════════════════
export const Colors = {
  // ─── Core ───────────────────────────────────────────────────
  black: '#18181B',
  white: '#FFFFFF',

  // ─── Accent - Warm terracotta (sophisticated, not aggressive) ─
  accent: '#C9705F',
  accentLight: '#E8927C',
  accentDark: '#A85A4A',
  accentMuted: 'rgba(201, 112, 95, 0.08)',

  // ─── Backgrounds (warm off-whites) ───────────────────────────
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHighlight: '#F5F5F3',
  surfaceSecondary: '#F0F0EE',

  // ─── Text (warm grays) ───────────────────────────────────────
  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textTertiary: '#71717A',
  textMuted: '#A1A1AA',
  textLight: '#D4D4D8',

  // ─── Borders (barely there) ──────────────────────────────────
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  borderAccent: '#C9705F',

  // ─── Semantic Colors (muted, calm) ───────────────────────────
  success: '#5CB176',
  successLight: '#7BC88E',
  successDark: '#4A9460',
  successMuted: 'rgba(92, 177, 118, 0.08)',

  danger: '#E25C5C',
  dangerLight: '#EF8181',
  dangerDark: '#C94A4A',
  dangerMuted: 'rgba(226, 92, 92, 0.08)',

  warning: '#E09F4F',
  warningLight: '#F0B86E',
  warningMuted: 'rgba(224, 159, 79, 0.08)',

  info: '#5B8DEF',
  infoLight: '#7FA8F5',
  infoMuted: 'rgba(91, 141, 239, 0.06)',

  // ─── Special ─────────────────────────────────────────────────
  lime: '#5CB176', // Map to success for compatibility

  // ─── Overlays ────────────────────────────────────────────────
  overlay: 'rgba(24, 24, 27, 0.4)',
  overlayLight: 'rgba(24, 24, 27, 0.2)',
  glass: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(0, 0, 0, 0.04)',
};

// ════════════════════════════════════════════════════════════════
// SPACING - Generous, breathable
// ════════════════════════════════════════════════════════════════
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 80,
  massive: 120,
};

// ════════════════════════════════════════════════════════════════
// BORDER RADIUS - Soft, friendly
// ════════════════════════════════════════════════════════════════
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,        // ← Default for cards
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

// ════════════════════════════════════════════════════════════════
// BORDER WIDTH - Subtle, refined
// ════════════════════════════════════════════════════════════════
export const BorderWidth = {
  none: 0,
  thin: 1,       // ← Most common
  medium: 1.5,
  thick: 2,
  heavy: 2,
};

// ════════════════════════════════════════════════════════════════
// TYPOGRAPHY - Light, elegant, readable
// ════════════════════════════════════════════════════════════════
export const Typography = {
  // ─── Display (Large titles) ──────────────────────────────────
  displayLarge: {
    fontSize: 34,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  },

  // ─── Headlines ───────────────────────────────────────────────
  headlineLarge: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  headlineMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  headlineSmall: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },

  // ─── Body (Comfortable reading) ──────────────────────────────
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 18,
  },

  // ─── Labels (Clean, not uppercase) ───────────────────────────
  labelLarge: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  labelMedium: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },

  // ─── Caption (Small details) ─────────────────────────────────
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },

  // ─── Mono (Numbers) ──────────────────────────────────────────
  mono: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
    fontVariant: ['tabular-nums' as const],
  },
  monoLarge: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  },
  monoHuge: {
    fontSize: 42,
    fontWeight: '600' as const,
    letterSpacing: -1,
    fontVariant: ['tabular-nums' as const],
  },
};

// ════════════════════════════════════════════════════════════════
// SHADOWS - Subtle, barely visible
// ════════════════════════════════════════════════════════════════
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // ─── Soft shadows (barely there) ─────────────────────────────
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },

  // ─── Card shadow (default for elevated surfaces) ─────────────
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  // ─── Legacy compatibility ────────────────────────────────────
  glow: (color: string, intensity: number = 0.15) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 12,
    elevation: 6,
  }),
  accentGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  successGlow: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  hardLime: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  glowLime: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  glowLimeSmall: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};

// ════════════════════════════════════════════════════════════════
// ANIMATIONS - Smooth, natural
// ════════════════════════════════════════════════════════════════
export const Animations = {
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  springSnappy: {
    damping: 25,
    stiffness: 400,
    mass: 0.8,
  },
  springBouncy: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },
  springGentle: {
    damping: 25,
    stiffness: 150,
    mass: 1,
  },

  timing: {
    duration: 200,
  },
  timingSlow: {
    duration: 350,
  },
  timingFast: {
    duration: 150,
  },
};

// ════════════════════════════════════════════════════════════════
// CATEGORY CONFIGS - Muted colors
// ════════════════════════════════════════════════════════════════
export const CategoryConfig: Record<string, { color: string; bgColor: string }> = {
  sport: {
    color: '#5B8DEF',
    bgColor: Colors.infoMuted,
  },
  fitness: {
    color: '#E8927C',
    bgColor: 'rgba(232, 146, 124, 0.08)',
  },
  health: {
    color: Colors.success,
    bgColor: Colors.successMuted,
  },
  nutrition: {
    color: '#5CB176',
    bgColor: Colors.successMuted,
  },
  mental: {
    color: '#9B8AE0',
    bgColor: 'rgba(155, 138, 224, 0.08)',
  },
  education: {
    color: '#5B8DEF',
    bgColor: Colors.infoMuted,
  },
  finance: {
    color: '#5CB176',
    bgColor: Colors.successMuted,
  },
  productivity: {
    color: '#E09F4F',
    bgColor: Colors.warningMuted,
  },
  social: {
    color: '#E8927C',
    bgColor: 'rgba(232, 146, 124, 0.08)',
  },
  default: {
    color: Colors.textTertiary,
    bgColor: Colors.surfaceHighlight,
  },
};

// ════════════════════════════════════════════════════════════════
// STATUS CONFIGS
// ════════════════════════════════════════════════════════════════
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
    label: 'Validation',
  },
  won: {
    color: Colors.success,
    bgColor: Colors.successMuted,
    label: 'Gagné',
  },
  lost: {
    color: Colors.danger,
    bgColor: Colors.dangerMuted,
    label: 'Perdu',
  },
  completed: {
    color: Colors.success,
    bgColor: Colors.successMuted,
    label: 'Terminé',
  },
  approved: {
    color: Colors.success,
    bgColor: Colors.successMuted,
    label: 'Validé',
  },
  rejected: {
    color: Colors.danger,
    bgColor: Colors.dangerMuted,
    label: 'Rejeté',
  },
};

// ════════════════════════════════════════════════════════════════
// FONTS
// ════════════════════════════════════════════════════════════════
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    mono: 'monospace',
  },
});

// ════════════════════════════════════════════════════════════════
// COMPONENT PRESETS - Clean, minimal
// ════════════════════════════════════════════════════════════════
export const ComponentPresets = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  cardBordered: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  cardAccent: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.md,
  },

  buttonPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
  },
  buttonSecondary: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },

  input: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  inputFocused: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.md,
  },

  badge: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
  },
  badgeAccent: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
  },
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  BorderWidth,
  Typography,
  Shadows,
  Animations,
  Fonts,
  CategoryConfig,
  StatusConfig,
  ComponentPresets,
};
