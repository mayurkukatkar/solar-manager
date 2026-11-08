/**
 * WhereReady Solar OS — Color System & Palettes
 * Comprehensive Light & Dark palettes, WhereReady Brand Identity,
 * Semantic Status Matrix, and Surface Elevation Hierarchy.
 */

export interface ThemeColors {
  // WhereReady Brand Palette: Electric Blue & Solar Amber
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;

  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;

  navy: string;
  navyLight: string;

  blue: string;
  blueLight: string;

  purple: string;
  purpleLight: string;
  purpleDark: string;
  purpleBorder: string;

  // Semantic Status Tokens
  success: string;
  successLight: string;
  successDark: string;
  successMuted: string;
  successBorder: string;

  warning: string;
  warningLight: string;
  warningDark: string;
  warningMuted: string;
  warningBorder: string;

  danger: string;
  dangerLight: string;
  dangerDark: string;
  dangerMuted: string;
  dangerBorder: string;

  info: string;
  infoLight: string;
  infoDark: string;
  infoMuted: string;
  infoBorder: string;

  // Surface Hierarchy
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceRecessed: string;
  surfaceHighlight: string;
  card: string; // legacy alias for surface

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderStrong: string;

  // Typography & Content Hierarchy
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  iconPrimary: string;
  iconSecondary: string;

  // Backdrop & Overlay
  overlay: string;

  // Neutral Slate Primitive Scale (Backward Compatibility)
  slate900: string;
  slate800: string;
  slate700: string;
  slate600: string;
  slate500: string;
  slate400: string;
  slate300: string;
  slate200: string;
  slate100: string;
  slate50: string;

  white: string;
  black: string;
}

export const lightColors: ThemeColors = {
  // Brand
  primary: '#0066FF',      // WhereReady Electric Blue
  primaryDark: '#0052CC',
  primaryLight: '#DBEAFE',
  primaryMuted: '#EFF6FF',

  accent: '#F59E0B',       // WhereReady Solar Sun
  accentLight: '#FEF3C7',
  accentDark: '#D97706',
  accentMuted: '#FFFBEB',

  navy: '#0B192C',         // Deep Brand Navy
  navyLight: '#1E293B',

  blue: '#2563EB',
  blueLight: '#EFF6FF',

  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  purpleDark: '#5B21B6',
  purpleBorder: '#DDD6FE',

  // Semantic Statuses
  success: '#10B981',      // Clean Grid Checkmark
  successLight: '#D1FAE5',
  successDark: '#047857',
  successMuted: '#ECFDF5',
  successBorder: '#A7F3D0',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',
  warningMuted: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerDark: '#B91C1C',
  dangerMuted: '#FEF2F2',
  dangerBorder: '#FECACA',

  info: '#0284C7',
  infoLight: '#E0F2FE',
  infoDark: '#0369A1',
  infoMuted: '#F0F9FF',
  infoBorder: '#BAE6FD',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceRecessed: '#F1F5F9',
  surfaceHighlight: '#E2E8F0',
  card: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderStrong: '#CBD5E1',

  // Typography & Content
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  iconPrimary: '#0F172A',
  iconSecondary: '#64748B',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.55)',

  // Slate Primitives
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ThemeColors = {
  // Brand
  primary: '#3B82F6',      // Calibrated Electric Blue for dark surfaces
  primaryDark: '#2563EB',
  primaryLight: '#1E3A8A',
  primaryMuted: '#172554',

  accent: '#FBBF24',       // Solar Amber high luminance
  accentLight: '#78350F',
  accentDark: '#D97706',
  accentMuted: '#451A03',

  navy: '#0B1320',         // Deep Canvas Navy
  navyLight: '#1E293B',

  blue: '#60A5FA',
  blueLight: '#1E3A8A',

  purple: '#A78BFA',
  purpleLight: '#4C1D95',
  purpleDark: '#7C3AED',
  purpleBorder: '#5B21B6',

  // Semantic Statuses
  success: '#34D399',
  successLight: '#064E3B',
  successDark: '#10B981',
  successMuted: '#022C22',
  successBorder: '#065F46',

  warning: '#FBBF24',
  warningLight: '#78350F',
  warningDark: '#D97706',
  warningMuted: '#451A03',
  warningBorder: '#92400E',

  danger: '#F87171',
  dangerLight: '#7F1D1D',
  dangerDark: '#DC2626',
  dangerMuted: '#450A0A',
  dangerBorder: '#991B1B',

  info: '#38BDF8',
  infoLight: '#0C4A6E',
  infoDark: '#0284C7',
  infoMuted: '#082F49',
  infoBorder: '#075985',

  // Surfaces & Backgrounds (OLED Ergonomics)
  background: '#0B1320',
  surface: '#131D2E',
  surfaceElevated: '#1E293B',
  surfaceRecessed: '#0F172A',
  surfaceHighlight: '#27354A',
  card: '#131D2E',

  // Borders
  border: '#24334A',
  borderSubtle: '#1E293B',
  borderStrong: '#334155',

  // Typography & Content
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',
  iconPrimary: '#F8FAFC',
  iconSecondary: '#94A3B8',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',

  // Slate Primitives
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  white: '#FFFFFF',
  black: '#000000',
};

// 100% Backward compatibility export
export const colors = lightColors;
