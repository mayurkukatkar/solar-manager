# WhereReady Solar OS — Mobile Theme System & Design Tokens Architecture Blueprint

**Document Version**: 1.0.0  
**Author**: Explorer M1-2 (Design Systems & Theme Architect)  
**Target Milestone**: M1 (Design Systems & Theme Architecture)  
**Status**: COMPLETE ARCHITECTURAL SPECIFICATION & BLUEPRINT  
**Workspace**: `mobile-app/` (`f:\Company Products\solar-manager\mobile-app`)  

---

## 1. Executive Summary & Design Vision

WhereReady Solar OS is a mission-critical enterprise mobility platform for Indian rooftop solar EPCs, installers, and DISCOM liaison managers. Field engineers operate in intense sunlight conditions on rooftops, while EPC founders and project coordinators review financial ledgers, system health, and pipeline analytics in low-light office and evening environments.

This architecture upgrades the mobile application's theming system from a rigid, light-only static color dictionary into an enterprise-grade, dual-mode (Light & Dark), responsive design system.

### Key Architectural Pillars:
1. **WhereReady Brand Preservation**: Retaining `#0066FF` Electric Blue, `#f59e0b` Solar Amber, and `#0b192c` Deep Brand Navy while establishing accessible, contrast-tuned variants for dark backgrounds that achieve WCAG 2.1 AA compliance (>= 4.5:1 text contrast).
2. **True Dual-Theme Palette & Surface Elevations**: Introducing calibrated OLED-friendly dark surfaces (`#0B1320` canvas, `#131D2E` card, `#1E293B` elevated) to replace harsh pure-black or washed-out grays, with complete semantic status pairs (`success`, `warning`, `danger`, `info`).
3. **Tabular Numerals Standard**: Eliminating character jitter in financial ledgers (₹), power telemetry (kW / kWh), and CEA electrical safety thresholds by embedding OpenType tabular figures (`fontVariant: ['tabular-nums']`) into the typography core.
4. **Universal 4-Point Grid & Hybrid Spacing API**: Providing both functional callable syntax `spacing(4) => 16` and legacy object syntax `spacing[4] => 16` to fulfill interface contracts while guaranteeing zero breakage across existing code.
5. **Persistent ThemeProvider & React Navigation Integration**: Providing reactive theme state (`'light' | 'dark' | 'system'`) persisted in `@react-native-async-storage/async-storage`, synchronizing native Android `expo-status-bar` and React Navigation 7 container themes without visual flashes.
6. **100% Backward Compatibility**: Static `export const colors = lightColors` is retained alongside dynamic hooks so untouched screens and modules remain completely intact during iterative migration.

---

## 2. Comprehensive Theme System Audit & Gap Analysis

### 2.1 Baseline State vs. Target State Matrix

| Dimension | Baseline State (`mobile-app/src/theme/`) | Target Architecture (This Blueprint) |
|---|---|---|
| **Theme Modes** | Hardcoded Light mode only. | Reactive Dual-Mode: Light, Dark, and System Default. |
| **Persistence** | None. State is lost on reload. | Async persistent storage (`@whereready_theme_mode`). |
| **System Theme Reaction** | Inactive (`app.json` hardcoded to `"userInterfaceStyle": "light"`). | Reactive to Android/iOS system dark mode changes (`"userInterfaceStyle": "automatic"`). |
| **Status Bar Coordination** | Hardcoded `<StatusBar style="light" />` in `App.tsx`. | Dynamic status bar style and background color tied to active theme. |
| **Navigation Container** | Default React Navigation theme (causes white flash in dark mode). | Bridged `getNavigationTheme(colors, isDark)` passed to `NavigationContainer`. |
| **Semantic Status Tokens** | Incomplete: missing `info`, `infoLight`, `warningLight`, sub-tones. | Complete 4-stage matrix (`success`, `warning`, `danger`, `info`) with base, light, dark, muted, and border tokens in both modes. |
| **Surface Elevations** | Single static `card: '#ffffff'`, `background: '#f8fafc'`. | Layered elevation hierarchy: `background`, `surface`, `surfaceElevated`, `surfaceRecessed`, `surfaceHighlight`. |
| **Typography & Numerals** | Proportional font sizing without OpenType font variants. | Type scale with universal tabular numerals helper (`fontVariant: ['tabular-nums']`). |
| **Spacing System** | Key-value object `spacing[4]`. Cannot be called as `spacing(4)`. | Hybrid function + index object: callable `spacing(4)` and indexed `spacing[4]`. |
| **Shadows & Elevation** | Single set of light mode shadows; invisible on dark backgrounds. | Mode-aware elevation pairs: crisp drop shadows for Light, luminous glow + border reinforcement for Dark. |
| **Backward Compatibility** | Direct imports of `colors` and `tokens`. | Complete drop-in compatibility; static exports preserved alongside `useTheme()`. |

### 2.2 Existing Consumer Audit in `mobile-app`

Our investigation of the codebase revealed 14 key files importing directly from `../theme` or `../theme/colors`:
- `mobile-app/src/navigation/RootNavigator.tsx`: Imports `colors` for tab tint, active FAB, and loader.
- `mobile-app/src/components/Header.tsx`: Imports `colors, spacing, radii, typography, touchTarget`.
- `mobile-app/src/components/AccountSuspendedModal.tsx`: Imports `colors`.
- `mobile-app/src/components/CreateInvoiceModal.tsx`: Imports `colors`.
- `mobile-app/src/components/common/Button.tsx`: Imports `colors, spacing, radii, typography, touchTarget, shadows`.
- `mobile-app/src/components/common/Card.tsx`: Imports `colors, spacing, radii, shadows`.
- `mobile-app/src/components/common/Badge.tsx`: Imports `colors, spacing, radii, typography`.
- `mobile-app/src/components/common/Input.tsx`: Imports `colors, spacing, radii, typography, touchTarget`.
- `mobile-app/src/components/common/EmptyState.tsx`: Imports `colors, spacing, radii, typography`.
- `mobile-app/src/components/common/SkeletonLoader.tsx`: Imports `colors, radii`.
- `mobile-app/src/screens/crm/PipelineScreen.tsx`: Imports `colors`.
- `mobile-app/src/screens/projects/FieldProjectsScreen.tsx`: Imports `colors`.
- `mobile-app/src/screens/projects/ProjectDossierModal.tsx`: Imports `colors`.
- `mobile-app/src/screens/finance/FinanceScreen.tsx`: Imports `colors`.

**Crucial Finding**: All 14 consumers depend on static properties like `colors.primary`, `colors.slate800`, `colors.danger`, `spacing[4]`, etc. Replacing or restructuring these without backward-compatible aliases would break compilation immediately. The blueprint below maintains every existing property name while layering full dynamic theming on top.

---

## 3. Design Tokens Expansion Specification

### 3.1 Color Palette Architecture

#### 3.1.1 Brand Identity Palette (WhereReady Solar)
- **Primary Brand (Electric Blue)**:
  - Light Mode: `primary: '#0066FF'`, `primaryDark: '#0052CC'`, `primaryLight: '#DBEAFE'`, `primaryMuted: '#EFF6FF'`
  - Dark Mode: `primary: '#3B82F6'`, `primaryDark: '#2563EB'`, `primaryLight: '#1E3A8A'`, `primaryMuted: '#172554'`
  - *Design Rationale*: `#0066FF` is the core WhereReady brand color. On dark OLED backgrounds (`#0B1320`), `#3B82F6` (Blue 500) delivers higher perceived luminance and passes WCAG 2.1 AA text contrast ratio of 4.8:1 against `#131D2E`.
- **Accent Brand (Solar Sun / Amber)**:
  - Light Mode: `accent: '#F59E0B'`, `accentDark: '#D97706'`, `accentLight: '#FEF3C7'`, `accentMuted: '#FFFBEB'`
  - Dark Mode: `accent: '#FBBF24'`, `accentDark: '#D97706'`, `accentLight: '#78350F'`, `accentMuted: '#451A03'`
  - *Design Rationale*: Represents solar energy, PM Surya Ghar central subsidies, and solar generation telemetry.
- **Deep Navy Brand**:
  - Light Mode: `navy: '#0B192C'`, `navyLight: '#1E293B'`
  - Dark Mode: `navy: '#0B1320'`, `navyLight: '#1E293B'`

#### 3.1.2 Semantic Status Palette
Enterprise solar operations rely on clear status signaling for grid-tie status, CEA compliance, and billing.

| Status Role | Light Mode Hex | Dark Mode Hex | Usage in Solar OS |
|---|---|---|---|
| **Success Base** | `#10B981` (Emerald 500) | `#34D399` (Emerald 400) | Net meter approved, CEA QA passed, payment settled |
| **Success Light** | `#D1FAE5` (Emerald 100) | `#064E3B` (Emerald 900) | Badge/pill container |
| **Success Dark** | `#047857` (Emerald 700) | `#10B981` (Emerald 500) | High-contrast icon/text |
| **Success Muted** | `#ECFDF5` (Emerald 50) | `#022C22` (Emerald 950) | Subtle table row highlight |
| **Success Border** | `#A7F3D0` (Emerald 200) | `#065F46` (Emerald 800) | Outline border for success cards |
| **Warning Base** | `#F59E0B` (Amber 500) | `#FBBF24` (Amber 400) | Pending KYC, overdue milestone, unverified barcode |
| **Warning Light** | `#FEF3C7` (Amber 100) | `#78350F` (Amber 900) | Badge/pill container |
| **Warning Dark** | `#B45309` (Amber 700) | `#D97706` (Amber 600) | Warning headers & icons |
| **Warning Muted** | `#FFFBEB` (Amber 50) | `#451A03` (Amber 950) | Warning card background |
| **Warning Border** | `#FDE68A` (Amber 200) | `#92400E` (Amber 800) | Warning border |
| **Danger Base** | `#EF4444` (Red 500) | `#F87171` (Red 400) | Earth pit fault (>5Ω), inverter trip, account suspension |
| **Danger Light** | `#FEE2E2` (Red 100) | `#7F1D1D` (Red 900) | Danger badge container |
| **Danger Dark** | `#B91C1C` (Red 700) | `#DC2626` (Red 600) | Critical alert headers |
| **Danger Muted** | `#FEF2F2` (Red 50) | `#450A0A` (Red 950) | Danger banner fill |
| **Danger Border** | `#FECACA` (Red 200) | `#991B1B` (Red 800) | Error input border |
| **Info Base** | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) | DISCOM circulars, ALMM technical specs, sync status |
| **Info Light** | `#E0F2FE` (Sky 100) | `#0C4A6E` (Sky 900) | Info pill container |
| **Info Dark** | `#0369A1` (Sky 700) | `#0284C7` (Sky 600) | Informational callout text |
| **Info Muted** | `#F0F9FF` (Sky 50) | `#082F49` (Sky 950) | Informational container fill |
| **Info Border** | `#BAE6FD` (Sky 200) | `#075985` (Sky 800) | Informational border |

#### 3.1.3 Surface Elevation & Dark Mode Palette
A high-grade dark mode avoids pure black (`#000000`) for surfaces to prevent OLED black smear and eye fatigue during prolonged field use. Instead, it uses subtle luminance increments:

- **Level 0 (Canvas / `background`)**:
  - Light: `#F8FAFC` (Slate 50)
  - Dark: `#0B1320` (WhereReady Deep Solar Navy)
- **Level 1 (Card / Default `surface`)**:
  - Light: `#FFFFFF` (Pure White)
  - Dark: `#131D2E` (Layered card surface)
- **Level 2 (Elevated / `surfaceElevated`)**:
  - Light: `#FFFFFF` (with card shadow)
  - Dark: `#1E293B` (Slate 800 — modals, bottom sheets, tooltips)
- **Level -1 (Recessed / `surfaceRecessed`)**:
  - Light: `#F1F5F9` (Slate 100 — text inputs, code boxes, search bars)
  - Dark: `#0F172A` (Slate 900 — inset elements)
- **Interactive Surface (`surfaceHighlight`)**:
  - Light: `#E2E8F0` (Slate 200)
  - Dark: `#27354A` (Active pressed state)

#### 3.1.4 Content & Typography Colors
- **Primary Text (`text`)**: Light `#0F172A` (Slate 900) / Dark `#F8FAFC` (Slate 50)
- **Secondary Text (`textSecondary`)**: Light `#475569` (Slate 600) / Dark `#94A3B8` (Slate 400)
- **Muted / Caption Text (`textMuted`)**: Light `#64748B` (Slate 500) / Dark `#64748B` (Slate 500)
- **Inverse Text (`textInverse`)**: Light `#FFFFFF` / Dark `#0F172A`
- **Subtle Border (`borderSubtle`)**: Light `#F1F5F9` / Dark `#1E293B`
- **Standard Border (`border`)**: Light `#E2E8F0` / Dark `#24334A`
- **Strong Border (`borderStrong`)**: Light `#CBD5E1` / Dark `#334155`

#### 3.1.5 Neutral Slate Primitive Scale (100% Backward Compatibility)
Direct static imports of slate colors (`colors.slate50` ... `colors.slate900`), `colors.white`, and `colors.black` remain preserved in `colors.ts`.

---

### 3.2 Spacing System (4-Point Scale)

The 4-point spacing scale aligns with standard mobile device density factors (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi):

```typescript
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
```

#### Hybrid Function + Object Implementation
`PROJECT.md` specifies an interface where `spacing: (step: number) => number`. However, existing components like `Button.tsx` and `Input.tsx` access `spacing[4]`.
We implement a hybrid callable object:
```typescript
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
```
This guarantees that both `spacing(4)` and `spacing[4]` return `16` with zero runtime penalty.

---

### 3.3 Corner Radii Hierarchy

```typescript
export const radii = {
  none: 0,
  xs: 4,     // Micro-badges, inline tags, inner status indicators
  sm: 8,     // Small badges, tooltips, nested thumbnails, progress bars
  md: 12,    // Standard buttons, text inputs, dropdown options, chips
  lg: 16,    // Standard cards, modal headers, alert callouts
  xl: 20,    // Hero cards, stat containers, bottom sheet surfaces
  xxl: 24,   // Full-screen modal sheets, dashboard telemetry panels
  full: 9999,// Circular buttons, round FABs, avatar circles, pill chips
} as const;
```

---

### 3.4 Cross-Platform Elevation & Shadows

In React Native, shadow styles diverge between Android (`elevation`) and iOS (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`).
In Dark Mode, standard dark drop shadows disappear against dark backgrounds; elevated surfaces need subtle border outlines and glowing accent elevations.

```typescript
export const lightShadows = {
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

export const darkShadows = {
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

export const shadows = lightShadows; // Default backward-compatible export
```

---

## 4. Typography Scale & Tabular Numerals Specification

### 4.1 Type Scale & Hierarchy
The type scale uses system sans-serif fonts to eliminate font-loading delays during cold starts while ensuring full compliance with native accessibility dynamic font size scaling:

```typescript
export const typeSizes = {
  tiny: 10,     // Pill labels, micro timestamps
  caption: 11,  // Form helpers, secondary status tags
  sub: 12,      // Field labels, subtitle breadcrumbs
  body: 13,     // Card body text, standard table rows
  base: 14,     // Primary buttons, list titles, inputs
  lead: 15,     // Emphasized lead text
  title: 16,    // Section headings, modal titles
  h3: 18,       // Card titles, large KPI indicators
  h2: 20,       // Primary screen headings
  h1: 24,       // Hero titles, major metrics
  display: 28,  // Dashboard radar total figures
} as const;
```

#### Weights & Tracking:
- `weight`: `regular: '400'`, `medium: '500'`, `semibold: '600'`, `bold: '700'`, `extrabold: '800'`, `black: '900'`
- `tracking`: `tight: -0.4`, `snug: -0.2`, `normal: 0`, `wide: 0.3`, `wider: 0.5`, `widest: 1.0`
- `fontFamilies`:
  - `regular`: `Platform.select({ ios: 'System', android: 'sans-serif' }) ?? 'sans-serif'`
  - `medium`: `Platform.select({ ios: 'System', android: 'sans-serif-medium' }) ?? 'sans-serif-medium'`
  - `bold`: `Platform.select({ ios: 'System', android: 'sans-serif' }) ?? 'sans-serif'`
  - `mono`: `Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'monospace'`

### 4.2 Tabular Numerals Universal Helper (`tabularNums`)
In financial and technical solar computations, characters like `1` take up less horizontal space than `8` or `0`. When rendering aligned financial columns, updating counters, or displaying multi-digit system capacities, variable-width numerals cause jitter and misalignment.

```typescript
export const tabularNums = {
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
};
```

#### Application Examples in Solar OS:
1. **Financial Ledgers & Milestone Invoices**:
   ```tsx
   <Text style={[styles.invoiceAmount, typography.tabularNums]}>
     ₹1,91,400.00
   </Text>
   ```
2. **Solar Sizing & DC Capacity**:
   ```tsx
   <Text style={[styles.capacityValue, typography.tabularNums]}>
     3.3 kW
   </Text>
   ```
3. **Statutory Electrical Sign-off Telemetry**:
   ```tsx
   <Text style={[styles.telemetryReading, typography.tabularNums]}>
     1.42 s • 4.82 Ω
   </Text>
   ```

#### Formatter Utilities Exported with Theme:
```typescript
export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatKw(kw: number): string {
  return `${Number(kw).toFixed(1)} kW`;
}
```

---

## 5. Theme Provider & Hook Architecture

### 5.1 Architecture Diagram

```
                 +-----------------------------------------+
                 |       App.tsx (Root Application)        |
                 +-----------------------------------------+
                                      |
                                      v
                 +-----------------------------------------+
                 |             SafeAreaProvider            |
                 +-----------------------------------------+
                                      |
                                      v
                 +-----------------------------------------+
                 |              ThemeProvider              |
                 | - Reads AsyncStorage ('@whereready...') |
                 | - Listens to RN useColorScheme()        |
                 | - Resolves isDark & colors/shadows      |
                 | - Renders expo-status-bar <StatusBar /> |
                 +-----------------------------------------+
                                      |
                                      v
                 +-----------------------------------------+
                 |              AuthProvider               |
                 +-----------------------------------------+
                                      |
                                      v
                 +-----------------------------------------+
                 |              RootNavigator              |
                 | - Uses getNavigationTheme()             |
                 | - Passes theme to NavigationContainer   |
                 +-----------------------------------------+
                                      |
            +-------------------------+-------------------------+
            |                                                   |
            v                                                   v
+-----------------------+                           +-----------------------+
|  UI Primitives        |                           |  Screen Modules       |
|  (Button, Card, Input,|                           |  (Dashboard, Pipeline,|
|   Badge, Skeleton)    |                           |   Projects, Finance)  |
|  -> useTheme()        |                           |  -> useTheme()        |
+-----------------------+                           +-----------------------+
```

### 5.2 Interface Contracts

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  tokens: DesignTokens;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export interface DesignTokens {
  colors: ThemeColors;
  isDark: boolean;
  spacing: SpacingFunction;
  radii: typeof radii;
  typography: {
    sizes: typeof typeSizes;
    size: typeof typeSizes; // legacy alias
    weight: typeof typography.weight;
    tracking: typeof typography.tracking;
    fontFamilies: { regular: string; medium: string; bold: string; mono: string };
    tabularNums: { fontVariant: ['tabular-nums'] };
  };
  touchTarget: typeof touchTarget;
  shadows: typeof lightShadows;
}
```

### 5.3 Storage & System Theme Synchronization
- **Key**: `@whereready_theme_mode`
- **Initial Load**:
  1. Component initializes with `mode = 'system'` and device color scheme.
  2. In `useEffect`, reads `@whereready_theme_mode` from `@react-native-async-storage/async-storage`.
  3. If stored value is `'light'` or `'dark'`, updates state.
- **Expo Configuration Requirement**:
  In `mobile-app/app.json`:
  ```json
  "userInterfaceStyle": "automatic"
  ```
  *(Currently hardcoded to `"light"`. Switching to `"automatic"` allows Expo and React Native's `useColorScheme()` to receive system dark mode events on Android 10+ and iOS 13+).*

### 5.4 Navigation Theme Integration (`getNavigationTheme`)
In React Navigation 7, `NavigationContainer` takes a theme object:
```typescript
import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { ThemeColors } from './colors';

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
```

---

## 6. Backward Compatibility & Migration Strategy

### 6.1 The 3-Tier Compatibility Strategy

1. **Tier 1: Static Export Preservation**:
   - `export const colors = lightColors;`
   - `export const spacing = hybridSpacing;`
   - `export const radii = ...;`
   - `export const typography = ...;`
   - `export const shadows = lightShadows;`
   Any existing file importing `{ colors } from '../theme/colors'` or `{ colors, spacing, radii } from '../theme'` continues working without modification.

2. **Tier 2: UI Primitive Theming**:
   The common primitives (`Button`, `Card`, `Badge`, `Input`, `EmptyState`, `SkeletonLoader`) are refactored to use `const { colors, isDark } = useTheme()`.
   Any screen that uses these primitives automatically inherits the active theme without the screen needing to be refactored immediately.

3. **Tier 3: Progressive Screen Migration Pattern**:
   For screens with complex internal `StyleSheet.create` rules, screens can adopt `useTheme()` using the dynamic style creator pattern:
   ```typescript
   export const MyScreen: React.FC = () => {
     const { colors, isDark } = useTheme();
     const styles = useMemo(() => createStyles(colors), [colors]);

     return <View style={styles.container}>...</View>;
   };

   const createStyles = (colors: ThemeColors) => StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: colors.background,
     },
   });
   ```

---

## 7. Concrete File Blueprints (Ready for Implementation)

Below are the exact file contents designed for `mobile-app/src/theme/`.

### 7.1 Blueprint: `mobile-app/src/theme/colors.ts`

```typescript
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
  slate500: '#64748B',
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
```

---

### 7.2 Blueprint: `mobile-app/src/theme/tokens.ts`

```typescript
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
  min: 44,
  comfortable: 48,
  large: 54,
} as const;

export const lightShadows = {
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

export const darkShadows = {
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
```

---

### 7.3 Blueprint: `mobile-app/src/theme/ThemeProvider.tsx`

```tsx
import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
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
} from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DesignTokens {
  colors: ThemeColors;
  isDark: boolean;
  spacing: SpacingFunction;
  radii: typeof radii;
  typography: typeof typography;
  touchTarget: typeof touchTarget;
  shadows: typeof lightShadows;
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
  setMode: async () => {},
  toggleTheme: async () => {},
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
  const deviceColorScheme = useRNColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

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
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={activeColors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
};
```

---

### 7.4 Blueprint: `mobile-app/src/theme/useTheme.ts`

```typescript
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
```

---

### 7.5 Blueprint: `mobile-app/src/theme/index.ts`

```typescript
export * from './colors';
export * from './tokens';
export * from './ThemeProvider';
export * from './useTheme';
```

---

### 7.6 Integration Blueprint: Updating `mobile-app/App.tsx`

```tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

---

### 7.7 Integration Blueprint: Updating `mobile-app/app.json`

Line 9 of `app.json`:
```json
"userInterfaceStyle": "automatic"
```
*(Changed from `"light"` to enable device color scheme detection on Android and iOS).*

---

## 8. Verification & Validation Protocol

To independently verify the implementation once applied by the Worker agent:

1. **TypeScript Static Analysis**:
   ```powershell
   cmd.exe /c "cd /d \"f:\Company Products\solar-manager\mobile-app\" && npx.cmd tsc --noEmit"
   ```
   *Expected outcome*: Exits with code 0. Zero missing properties or type mismatches.
2. **Perspective Verification Suite**:
   ```powershell
   node mobile-app/test-perspectives.js
   ```
   *Expected outcome*: 23/23 tests pass.
3. **Backward Compatibility Check**:
   Confirm that all existing files importing `colors` directly (e.g. `RootNavigator.tsx`, `Header.tsx`, `Button.tsx`, `FinanceScreen.tsx`) build with zero runtime errors.
4. **Theme Toggle Verification**:
   - Verify that toggling between `'light'`, `'dark'`, and `'system'` updates `colors.background`, `colors.surface`, and `colors.text`.
   - Verify that restarting the application retains the user's selected mode via AsyncStorage.
