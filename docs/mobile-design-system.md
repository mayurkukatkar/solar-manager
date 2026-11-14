# WhereReady Solar OS — Mobile Design System Specification

**Document Version**: 1.0.0  
**Date**: 2026-10-30  
**Target Milestone**: M1 (Product Audit & Design System Foundation)  
**Target Application**: `mobile-app/` (`com.whereready.solaros`)  
**Monorepo Root**: `f:\Company Products\solar-manager\`  
**Audience**: Product Designers, Mobile Engineers, QA Auditors  

---

## 1. Design Philosophy & Brand Foundation

WhereReady Solar OS is the mission-critical mobile operating system for Indian rooftop solar EPC companies, project managers, and field technicians. Field engineers operate on sun-drenched rooftops under extreme ambient lighting, while EPC leadership reviews financial cash-flow and pipeline metrics in low-light office conditions.

### Core Architectural Principles:
1. **Operational High Density**: Solar telemetry (system capacities in kW, DC:AC ratios, earth pit Ω resistance, tariff savings) must be presented with high legibility and zero visual clutter.
2. **Data Authenticity**: 100% authorized live metrics from authenticated tenant instances; zero placeholder or hardcoded statistics.
3. **Field Ergonomics**: Sunlight-readable contrast (WCAG 2.1 AA >= 4.5:1), 48dp touch targets, keyboard-avoiding data entry, and native tactile feedback.
4. **Statutory Precision**: Accurate representation of DISCOM 5-stage milestones, PM Surya Ghar central DBT subsidies, and 13.8% composite solar GST.
5. **Dual-Theme Parity**: Seamless, instant transitions between Light and calibrated OLED Dark modes without layout shifting or missing tokens.

---

## 2. Color Architecture & Palette Specifications

### 2.1 Brand Identity Palette
- **WhereReady Electric Blue (Primary)**:
  - Light Mode: `primary: '#0066FF'`, `primaryDark: '#0052CC'`, `primaryLight: '#DBEAFE'`, `primaryMuted: '#EFF6FF'`
  - Dark Mode: `primary: '#3B82F6'`, `primaryDark: '#2563EB'`, `primaryLight: '#1E3A8A'`, `primaryMuted: '#172554'`
- **WhereReady Solar Sun Amber (Accent)**:
  - Light Mode: `accent: '#F59E0B'`, `accentDark: '#D97706'`, `accentLight: '#FEF3C7'`, `accentMuted: '#FFFBEB'`
  - Dark Mode: `accent: '#FBBF24'`, `accentDark: '#D97706'`, `accentLight: '#78350F'`, `accentMuted: '#451A03'`
- **Deep Brand Navy**:
  - Light Mode: `navy: '#0B192C'`, `navyLight: '#1E293B'`
  - Dark Mode: `navy: '#0B1320'`, `navyLight: '#1E293B'`

### 2.2 Light vs. Dark Theme Token Dictionary

| Token Name | Light Theme Hex | Dark Theme Hex | Semantic Usage |
|---|---|---|---|
| `background` | `#F8FAFC` (Slate 50) | `#0B1320` (Deep Solar Navy) | Root screen canvas background |
| `surface` | `#FFFFFF` (Pure White) | `#131D2E` (Layered Card Navy) | Standard card containers, list items, sheets |
| `surfaceElevated` | `#FFFFFF` (with shadow) | `#1E293B` (Elevated Slate Navy) | Floating sheets, dropdowns, popovers |
| `surfaceRecessed` | `#F1F5F9` (Slate 100) | `#0F172A` (Slate 900) | Inset inputs, search bars, code blocks |
| `surfaceHighlight`| `#E2E8F0` (Slate 200) | `#27354A` (Active Navy) | Active pressed states, selection highlights |
| `card` | `#FFFFFF` | `#131D2E` | Legacy alias for `surface` |
| `border` | `#E2E8F0` (Slate 200) | `#24334A` (Slate Navy Border) | Standard card borders, field outlines |
| `borderSubtle` | `#F1F5F9` (Slate 100) | `#1E293B` | Table row dividers, inner borders |
| `borderStrong` | `#CBD5E1` (Slate 300) | `#334155` (Slate 700) | Emphasized dividers, active input borders |
| `text` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Primary headers, values, active labels |
| `textSecondary` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Supporting descriptions, timestamps |
| `textMuted` | `#64748B` (Slate 500) | `#64748B` (Slate 500) | Placeholder text, disabled labels |
| `textInverse` | `#FFFFFF` | `#0F172A` | Text on inverted or colored fills |
| `primary` | `#0066FF` | `#3B82F6` | Primary action buttons, active tab indicators |
| `primaryLight` | `#DBEAFE` | `#1E3A8A` | Primary badge backgrounds, pill highlights |
| `accent` | `#F59E0B` | `#FBBF24` | Solar highlights, pending statuses, warnings |
| `accentLight` | `#FEF3C7` | `#78350F` | Warning badge fills |
| `success` | `#10B981` (Emerald 500) | `#34D399` (Emerald 400) | Completed stages, paid invoices, CEA QA pass |
| `successLight` | `#D1FAE5` | `#064E3B` | Success badge fills |
| `danger` | `#EF4444` (Red 500) | `#F87171` (Red 400) | Overdue invoices, QA failures, account lock |
| `dangerLight` | `#FEE2E2` | `#7F1D1D` | Danger badge fills |
| `info` | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) | DISCOM circulars, technical specs, feasibility |
| `infoLight` | `#E0F2FE` | `#0C4A6E` | Info badge fills |
| `overlay` | `rgba(15, 23, 42, 0.55)` | `rgba(0, 0, 0, 0.75)` | Modal sheet backdrops |

### 2.3 Semantic Status Tokens for Indian Solar Lifecycles

| EPC / Statutory Lifecycle Stage | Color Token | Hex (Light) | Hex (Dark) | Badge Icon |
|---|---|---|---|---|
| **Feasibility Pending** | `warning` | `#F59E0B` | `#FBBF24` | `Clock` |
| **Feasibility Cleared** | `info` | `#0284C7` | `#38BDF8` | `FileCheck` |
| **Structure Approved** | `primary` | `#0066FF` | `#3B82F6` | `Hammer` |
| **Material Dispatched** | `info` | `#0284C7` | `#38BDF8` | `Truck` |
| **Installation In Progress** | `accent` | `#F59E0B` | `#FBBF24` | `Wrench` |
| **Testing / CEA QA Passed** | `success` | `#10B981` | `#34D399` | `ShieldCheck` |
| **Net Meter Synchronized** | `success` | `#10B981` | `#34D399` | `Zap` |
| **PM Surya Ghar DBT Credited**| `success` | `#10B981` | `#34D399` | `Banknote` |
| **Milestone Invoiced** | `info` | `#0284C7` | `#38BDF8` | `Receipt` |
| **Payment Overdue** | `danger` | `#EF4444` | `#F87171` | `AlertTriangle` |
| **Tenant Suspended** | `danger` | `#EF4444` | `#F87171` | `Lock` |

---

## 3. Typography Scale & Tabular Numerals

### 3.1 Type Scale Hierarchy

| Token Level | Size (pt) | Line Height (pt) | Font Weight | Semantic Role |
|---|---|---|---|---|
| `tiny` | 10 | 14 | 500 (Medium) | Micro-badges, date timestamps, footnote IDs |
| `caption` | 11 | 16 | 500 (Medium) | Field labels, tab labels, secondary badge text |
| `sub` | 12 | 16 | 400 (Regular) | Secondary card descriptions, helper text |
| `body` | 13 | 18 | 400 (Regular) | Standard body text, table cell values |
| `base` | 14 | 20 | 500 (Medium) | Default interactive labels, input values |
| `lead` | 15 | 22 | 600 (Semibold) | Emphasized body text, list item titles |
| `title` | 16 | 24 | 600 (Semibold) | Card section headers, modal titles |
| `h3` | 18 | 26 | 700 (Bold) | Section headers, sheet titles |
| `h2` | 20 | 28 | 700 (Bold) | Screen headers, modal main titles |
| `h1` | 24 | 32 | 700 (Bold) | Hero dashboard numbers, revenue figures |
| `display` | 28 | 36 | 800 (Extrabold) | Executive telemetry figures |

### 3.2 Tabular Numerals Rule
All financial currency values (`₹1,91,400`), solar system capacities (`3.3 kW`), electrical test metrics (`4.82 Ω`), generation figures (`396 kWh`), and date counters MUST include:
```typescript
fontVariant: ['tabular-nums']
```
This ensures monospaced digit widths and eliminates character jitter during real-time value changes and table scrolling.

### 3.3 Dynamic Font Safety
No text container may declare a fixed `height`. Containers must use `minHeight` and auto-wrapping flex layout with `maxFontSizeMultiplier={1.4}` to safeguard against Android dynamic font scaling overflow.

---

## 4. 4-Point Incremental Spacing Scale & Touch Targets

### 4.1 Spacing Scale Grid
- `space-0`: 0px
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px (Standard screen padding)
- `space-5`: 20px
- `space-6`: 24px (Section separation)
- `space-7`: 28px
- `space-8`: 32px
- `space-9`: 36px
- `space-10`: 40px
- `space-12`: 48px
- `space-14`: 56px
- `space-16`: 64px

### 4.2 Touch Target Specifications
- **Minimum Interactive Target**: **44 x 44 dp** (WCAG 2.1 AA baseline).
- **Comfortable Standard Target**: **48 x 48 dp** (Material Design baseline).
- **Prominent Touch Target**: **54 x 54 dp** (Center FAB, primary submission CTAs).
- **Compact HitSlop Rule**: Any button or chip with visual dimensions below 44dp MUST declare `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`.

---

## 5. Shape, Radii & Elevation Hierarchy

### 5.1 Corner Radii Hierarchy
- `none`: 0px
- `xs`: 4px (Tag borders, micro indicators)
- `sm`: 8px (Inner badges, input prefix pills, thumbnails)
- `md`: 12px (Form inputs, interactive buttons, modal headers)
- `lg`: 16px (Standard cards, list cards, action sheets)
- `xl`: 20px (Hero dashboard cards, prominent modular panels)
- `xxl`: 24px (Top-rounded modal bottom sheets: 24px top radii)
- `full`: 9999px (Pills, circular icon buttons, avatars)

### 5.2 Cross-Platform Elevation & Shadows

| Elevation Token | Android `elevation` | iOS `shadowColor` | iOS `shadowOffset` | iOS `shadowOpacity` | iOS `shadowRadius` |
|---|---|---|---|---|---|
| `none` | 0 | `transparent` | `{ width: 0, height: 0 }` | 0.00 | 0 |
| `subtle` | 2 | `#0f172a` | `{ width: 0, height: 1 }` | 0.04 | 4 |
| `card` | 3 | `#0f172a` | `{ width: 0, height: 2 }` | 0.05 | 8 |
| `elevated` | 6 | `#0f172a` | `{ width: 0, height: 4 }` | 0.08 | 12 |
| `popover` | 8 | `#0f172a` | `{ width: 0, height: 6 }` | 0.12 | 16 |
| `glowBlue` | 5 | `#0066FF` | `{ width: 0, height: 4 }` | 0.25 | 8 |
| `glowAmber`| 5 | `#F59E0B` | `{ width: 0, height: 4 }` | 0.25 | 8 |

---

## 6. Unified Iconography Standards

- **Vector Engine**: `lucide-react-native` backed by `react-native-svg`.
- **Standard Sizing Tokens**:
  - `xs`: 12px (inline text tags, mini status indicators)
  - `sm`: 16px (card metadata, input prefix/suffix icons, badge icons)
  - `md`: 20px (action buttons, header navigation shortcuts)
  - `lg`: 24px (bottom tab bar icons, screen titles)
  - `xl`: 32px (empty state icons, barcode target frames)
- **Stroke Width**: Standard stroke `2.0`; Active/Selected stroke `2.4`.

---

## 7. Component States & Interactive Micro-Interactions

Every interactive primitive and screen component must handle 8 standardized states:
1. **Default**: Baseline resting state with standard token borders and background.
2. **Active / Selected**: Highlighted state (e.g. active tab, selected stage pill) utilizing `colors.primaryLight` background with `colors.primary` border.
3. **Focused**: Form input actively receiving keyboard focus; animated 1.5px border highlight in `colors.primary`.
4. **Pressed**: Tactile response on touch down (`opacity: 0.88` on iOS, or native Android ripple) accompanied by optional light haptic feedback.
5. **Disabled**: Visual attenuation (`opacity: 0.45`), touch events blocked (`disabled={true}`).
6. **Loading**: Interactive control replaced by an embedded activity spinner or content area replaced by animated pulsing `<SkeletonLoader>`.
7. **Success**: Positive validation state; green border (`colors.success`), checkmark icon, success helper badge.
8. **Error**: Negative validation state; red border (`colors.danger`), inline contextual error text, alert icon.

---

## 8. Reusable UI Primitives Library Contract

All shared primitives are located in `mobile-app/src/components/common/`:

1. **`Button`**: Supports variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `solar`), sizes (`sm`, `md`, `lg`), layout-stable loading spinner, left/right icons, and Android native ripple.
2. **`Input`**: Standardized text input wrapped in `React.forwardRef`, supporting prefix/suffix icons, inline error helper text, success state indicator, clearable button, and secure password toggle.
3. **`Card`**: Elevated, outlined, or flat surface container supporting theme awareness, custom padding (`none`, `sm`, `md`, `lg`), and optional pressable ripple.
4. **`Badge`**: Status indicator pill supporting solar lifecycle variants (`primary`, `success`, `warning`, `danger`, `purple`, `neutral`, `info`, `accent`), optional live status dot, and icon accessories.
5. **`SkeletonLoader`**: High-performance animated pulsing skeleton with compound helper layouts (`SkeletonLoader.Text`, `SkeletonLoader.Circle`, `SkeletonLoader.Card`) eliminating TypeScript `any` casts.
6. **`EmptyState`**: Informative empty view with semantic circular icon tone (`neutral`, `primary`, `warning`, `danger`, `success`), title, description, and primary/secondary CTA buttons.
7. **`KeyboardAvoidingContainer`**: Form engine providing universal iOS/Android soft keyboard handling, sticky headers/footers, auto-scroll offsets, and touch-outside dismissal.
8. **`ModalHeader`**: Standard modal navigation bar providing title, subtitle, safe-area top insets, drag handle, multi-step back navigation, and `useDirtyFormWarning` unsaved changes protection.

---

## 9. Theme Provider & Hook Architecture

The mobile application is wrapped in `ThemeProvider` (`mobile-app/src/theme/ThemeProvider.tsx`):
- Listens to device appearance changes via React Native's `useColorScheme()`.
- Persists user preferences (`'light' | 'dark' | 'system'`) in AsyncStorage under `@whereready_theme_mode`.
- Synchronizes `expo-status-bar` and React Navigation 7 container themes via `getNavigationTheme(colors, isDark)`.
- Exposes `useTheme()` hook providing `{ mode, isDark, colors, tokens, setMode, toggleTheme }`.

---

*Authoritative document produced as part of Milestone M1.*
