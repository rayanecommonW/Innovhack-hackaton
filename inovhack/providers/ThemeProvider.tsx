/**
 * Theme Provider - Dark/Light Mode Support
 * LUMA-inspired: clean, elegant theme switching
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

// ════════════════════════════════════════════════════════════════
// DARK MODE COLORS
// ════════════════════════════════════════════════════════════════
const DarkColors = {
  // ─── Core ───────────────────────────────────────────────────
  black: '#FAFAFA',
  white: '#0A0A0B',

  // ─── Accent - Slightly lighter for dark mode ────────────────
  accent: '#E8927C',
  accentLight: '#F0A892',
  accentDark: '#C9705F',
  accentMuted: 'rgba(232, 146, 124, 0.12)',

  // ─── Backgrounds (dark grays) ───────────────────────────────
  background: '#0A0A0B',
  surface: '#18181B',
  surfaceElevated: '#1F1F23',
  surfaceHighlight: '#27272A',
  surfaceSecondary: '#1F1F23',

  // ─── Text (light grays) ─────────────────────────────────────
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textMuted: '#52525B',
  textLight: '#3F3F46',

  // ─── Borders ────────────────────────────────────────────────
  border: '#27272A',
  borderLight: '#1F1F23',
  borderAccent: '#E8927C',

  // ─── Semantic Colors (slightly brighter for dark mode) ──────
  success: '#6BC485',
  successLight: '#8AD39C',
  successDark: '#5CB176',
  successMuted: 'rgba(107, 196, 133, 0.12)',

  danger: '#EF7171',
  dangerLight: '#F59090',
  dangerDark: '#E25C5C',
  dangerMuted: 'rgba(239, 113, 113, 0.12)',

  warning: '#F0B05F',
  warningLight: '#F5C27E',
  warningMuted: 'rgba(240, 176, 95, 0.12)',

  info: '#6B9DF5',
  infoLight: '#8FB5F8',
  infoMuted: 'rgba(107, 157, 245, 0.10)',

  // ─── Special ────────────────────────────────────────────────
  lime: '#6BC485',

  // ─── Overlays ───────────────────────────────────────────────
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  glass: 'rgba(24, 24, 27, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

// ════════════════════════════════════════════════════════════════
// THEME TYPES
// ════════════════════════════════════════════════════════════════
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  black: string;
  white: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textLight: string;
  border: string;
  borderLight: string;
  borderAccent: string;
  success: string;
  successLight: string;
  successDark: string;
  successMuted: string;
  danger: string;
  dangerLight: string;
  dangerDark: string;
  dangerMuted: string;
  warning: string;
  warningLight: string;
  warningMuted: string;
  info: string;
  infoLight: string;
  infoMuted: string;
  lime: string;
  overlay: string;
  overlayLight: string;
  glass: string;
  glassBorder: string;
}

interface ThemeContextType {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// ════════════════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════════════════
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@pact_theme_mode';

// ════════════════════════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════════════════════════
export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Calculate if dark mode is active
  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  // Get colors based on theme
  const colors: ThemeColors = isDark ? DarkColors : (Colors as unknown as ThemeColors);

  // Toggle between light and dark
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  // Set specific theme
  const setTheme = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        mode,
        colors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
}

export { DarkColors };
export type { ThemeMode, ThemeColors };
