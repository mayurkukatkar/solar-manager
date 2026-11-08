import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { ThemeColors, lightColors, darkColors } from './colors';
import {
  spacing,
  radii,
  typography,
  touchTarget,
  lightShadows,
  darkShadows,
  SpacingFunction,
  ShadowTokens,
} from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DesignTokens {
  colors: ThemeColors;
  isDark: boolean;
  spacing: SpacingFunction;
  radii: typeof radii;
  typography: typeof typography;
  touchTarget: typeof touchTarget;
  shadows: ShadowTokens;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  tokens: DesignTokens;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@whereready_theme_mode';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const defaultThemeContextValue: ThemeContextValue = {
  mode: 'system',
  isDark: false,
  colors: lightColors,
  tokens: {
    colors: lightColors,
    isDark: false,
    spacing,
    radii,
    typography,
    touchTarget,
    shadows: lightShadows,
  },
  setMode: async () => { },
  toggleTheme: async () => { },
};

export function getNavigationTheme(colors: ThemeColors, isDark: boolean): NavTheme {
  const base = isDark ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.borderSubtle,
      notification: colors.accent,
    },
  };
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const hookColorScheme = useRNColorScheme();
  const [deviceColorScheme, setDeviceColorScheme] = useState<string | null | undefined>(
    (typeof Appearance !== 'undefined' && Appearance?.getColorScheme ? Appearance.getColorScheme() : null) || hookColorScheme
  );
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    if (typeof Appearance !== 'undefined' && Appearance?.addChangeListener) {
      const sub = Appearance.addChangeListener(({ colorScheme }) => {
        setDeviceColorScheme(colorScheme);
      });
      return () => sub.remove();
    }
  }, []);

  useEffect(() => {
    if (hookColorScheme) {
      setDeviceColorScheme(hookColorScheme);
    }
  }, [hookColorScheme]);

  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored as ThemeMode);
        }
      } catch (e) {
        // Fallback gracefully on storage read failure
      }
    };
    loadStoredTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    try {
      setModeState(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (e) {
      // Ignore storage write failure
    }
  };

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return deviceColorScheme === 'dark';
  }, [mode, deviceColorScheme]);

  const activeColors = isDark ? darkColors : lightColors;
  const activeShadows = isDark ? darkShadows : lightShadows;

  const toggleTheme = async () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    await setMode(nextMode);
  };

  const tokens = useMemo<DesignTokens>(
    () => ({
      colors: activeColors,
      isDark,
      spacing,
      radii,
      typography,
      touchTarget,
      shadows: activeShadows,
    }),
    [activeColors, isDark, activeShadows]
  );

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors: activeColors,
      tokens,
      setMode,
      toggleTheme,
    }),
    [mode, isDark, activeColors, tokens]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};
