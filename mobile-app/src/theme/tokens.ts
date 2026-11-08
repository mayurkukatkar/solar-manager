/**
 * WhereReady Solar OS — Design Tokens
 * 4-Point Incremental Spacing System, Standard Typography Scale,
 * Tabular Numerals Universal Helper, Corner Radii & Cross-Platform Elevation.
 */
import { Platform } from 'react-native';

export const spacingSteps = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

export type SpacingScaleKey = keyof typeof spacingSteps;

export type SpacingFunction = {
  (step: number): number;
  readonly 0: 0;
  readonly 1: 4;
  readonly 2: 8;
  readonly 3: 12;
  readonly 4: 16;
  readonly 5: 20;
  readonly 6: 24;
  readonly 7: 28;
  readonly 8: 32;
  readonly 9: 36;
  readonly 10: 40;
  readonly 12: 48;
  readonly 14: 56;
  readonly 16: 64;
  [key: number]: number;
};

export const spacing: SpacingFunction = Object.assign(
  (step: number): number => {
    return (spacingSteps as Record<number, number>)[step] ?? step * 4;
  },
  spacingSteps
) as SpacingFunction;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const typeSizes = {
  tiny: 10,
  caption: 11,
  sub: 12,
  body: 13,
  base: 14,
  lead: 15,
  title: 16,
  h3: 18,
  h2: 20,
  h1: 24,
  display: 28,
} as const;

export const tabularNums = {
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
};

export const typography = {
  // Font sizes
  size: typeSizes,
  sizes: typeSizes, // Interface contract compatibility
  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  // Letter spacing
  tracking: {
    tight: -0.4,
    snug: -0.2,
    normal: 0,
    wide: 0.3,
    wider: 0.5,
    widest: 1.0,
  },
  // Native font families
  fontFamilies: {
    regular: Platform.select({ ios: 'System', android: 'sans-serif' }) ?? 'sans-serif',
    medium: Platform.select({ ios: 'System', android: 'sans-serif-medium' }) ?? 'sans-serif-medium',
    bold: Platform.select({ ios: 'System', android: 'sans-serif' }) ?? 'sans-serif',
    mono: Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'monospace',
  },
  // Universal tabular numerals helper
  tabularNums,
} as const;

export const touchTarget = {
  min: Platform.select({ android: 48, default: 44 }),
  comfortable: 48,
  large: 54,
} as const;

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowTokens {
  none: ShadowStyle;
  subtle: ShadowStyle;
  card: ShadowStyle;
  elevated: ShadowStyle;
  popover: ShadowStyle;
  glowBlue: ShadowStyle;
  glowAmber: ShadowStyle;
}

export const lightShadows: ShadowTokens = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  popover: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glowBlue: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  glowAmber: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const darkShadows: ShadowTokens = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  popover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  glowBlue: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 6,
  },
  glowAmber: {
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

// Backward-compatible export
export const shadows = lightShadows;

// Solar OS Format Helpers
export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatKw(kw: number): string {
  return `${Number(kw).toFixed(1)} kW`;
}
