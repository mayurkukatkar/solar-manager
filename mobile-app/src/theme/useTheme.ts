import { useContext } from 'react';
import { ThemeContext, ThemeContextValue, defaultThemeContextValue } from './ThemeProvider';

/**
 * useTheme Hook
 * Returns active theme mode, resolved isDark, active ThemeColors palette,
 * design tokens, and switcher functions.
 * Includes graceful fallback if rendered outside of ThemeProvider.
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    return defaultThemeContextValue;
  }
  return context;
};
