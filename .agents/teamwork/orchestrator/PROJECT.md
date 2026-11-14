# Project: WhereReady Solar OS — Mobile Product Transformation

## Architecture
WhereReady Solar OS is a multi-tier SaaS platform tailored for Indian solar EPC businesses, installers, and DISCOM liaisons. The mobile client (`mobile-app/`) operates on React Native 0.88 with Expo SDK 58, React Navigation 7, Hermes JS engine, Android New Architecture (Fabric + TurboModules), and Edge-to-Edge rendering.

```
mobile-app/
├── src/
│   ├── api/             # Axios client, interceptors, SafeStorage, 16 domain endpoint modules
│   ├── components/      # Common UI primitives (Button, Card, Badge, Input, EmptyState, SkeletonLoader)
│   ├── context/         # AuthContext (session, JWT token, tenant suspension, health)
│   ├── navigation/      # RootNavigator (React Navigation 7: Stack + BottomTabs)
│   ├── screens/         # Domain screens (auth, dashboard, crm, projects, operations, finance, modules, profile)
│   ├── services/        # OfflineSyncService, PDF generators, document templates
│   ├── theme/           # Design tokens (colors, typography, spacing, radii, shadows, theme context)
│   └── types/           # TypeScript interfaces, DTOs, navigation param lists
├── assets/              # Branding icons, splash screens, solar proposal imagery
├── android/             # Autolinked native Android project (edge-to-edge, new arch)
└── test-perspectives.js # Automated perspective verification suite
```

## Feature Inventory
Every feature identified during the survey phase is enumerated here and assigned to a milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Product & Screen Audit Docs | Create `/docs/mobile-product-audit.md`, `/docs/mobile-screen-inventory.md`, `/docs/mobile-ux-problems.md` | M1 | Survey / R1 |
| 2 | Mobile Design System Spec | Create `/docs/mobile-design-system.md` with tokens for colors, typography, spacing, elevation, states | M1 | Survey / R1 |
| 3 | Core Design Tokens Upgrade | Implement color tokens (light + dark), semantic statuses, 4pt spacing scale, elevation in `src/theme/` | M1 | Survey / R1 |
| 4 | Tabular Numerals & Typography | Implement typography scale with tabular numeral support for currency and technical metrics | M1 | Survey / R1 |
| 5 | Theme Provider & Hook | Light and dark theme context/provider with system theme detection and manual toggle | M1 | Survey / R1 |
| 6 | Standardized Button Primitive | Multi-variant (primary, secondary, outline, ghost, danger), states (default, pressed, loading, disabled) | M1 | Survey / R1 |
| 7 | Standardized Input Primitive | Input with labels, helper text, inline error validation, prefix/suffix icons, focus states | M1 | Survey / R1 |
| 8 | Standardized Card & Surface | Elevated, outlined, and flat cards with elevation tokens and theme awareness | M1 | Survey / R1 |
| 9 | Standardized Badge Primitive | Status badges (success, warning, danger, neutral, info, primary) with consistent padding | M1 | Survey / R1 |
| 10 | Standardized Skeleton Loader | Loading placeholder primitives replacing raw ActivityIndicators | M1 | Survey / R1 |
| 11 | Standardized Empty State | Informative empty states with icon circle, title, description, and primary CTA button | M1 | Survey / R1 |
| 12 | Navigation Stack Reorganization | Reorganize `RootNavigator.tsx` with clean stack & tab hierarchy, route typing | M2 | Survey / R2 |
| 13 | Safe Area Inset Hardening | Fix `Header.tsx` and screen layouts using `useSafeAreaInsets()` for Android cutouts/notches | M2 | Survey / R2 |
| 14 | Android Hardware Back Handling | Predictable back navigation across tabs and modal dismissal with dirty form alerts | M2 | Survey / R2 |
| 15 | Dead Code Elimination | Remove unreferenced `ProjectsScreen.tsx` and deprecate redundant `LeadsScreen.tsx` | M2 | Survey / R2 |
| 16 | Role-Personalized Command Center | Transform `DashboardScreen.tsx` into an executive command radar displaying real metrics | M2 | Survey / R2 |
| 17 | Remove Fake Dashboard Fallbacks | Strip hardcoded dummy leads (`Ramesh Patil`), dummy funnels, and fake horizon maps | M2 | Survey / R2 |
| 18 | Dashboard Loading & Empty States | Integrate SkeletonLoader during API fetch and EmptyState when no data exists | M2 | Survey / R2 |
| 19 | Authorized Global Search | Modal/screen allowing search across leads, projects, invoices, and serials with RBAC filtering | M2 | Survey / R2 |
| 20 | Quick Action Dispatcher | FAB / quick action menu for Create Lead, New Quote, Scan Barcode, Record Payment | M2 | Survey / R2 |
| 21 | ModulesScreen Decomposition | Extract 9 monolithic modal modules from `ModulesScreen.tsx` into modular screens/flows | M3 | Survey / R3 |
| 22 | Lead Capture Ergonomics | Add `KeyboardAvoidingView`, inline validation, 12-digit consumer number check to `LeadCaptureModal` | M3 | Survey / R3 |
| 23 | Unsaved Changes Protection | Warn users before discarding dirty input in `LeadCaptureModal`, `CustomerOnboardingModal` | M3 | Survey / R3 |
| 24 | Pipeline Kanban & Stage Actions | Redesign `PipelineScreen.tsx` with virtualized stages, lead cards, quick action triggers | M3 | Survey / R3 |
| 25 | Sizing & Quick Quote Calculator | Redesign `QuickQuoteScreen.tsx` with dynamic tenant branding, ALMM modules, PM Surya Ghar DBT | M3 | Survey / R3 |
| 26 | Multi-Language Proposal Generator | Generate customer proposal PDF with EN/HI/MR pitch text, 12 curated visual templates | M3 | Survey / R3 |
| 27 | Customer Onboarding KYC Modal | Robust form layout with `KeyboardAvoidingView`, bank IFSC, consumer ID, photo uploads | M3 | Survey / R3 |
| 28 | Field Projects List & Filtering | Redesign `FieldProjectsScreen.tsx` with stage filters, progress bars, search, virtualized list | M3 | Survey / R3 |
| 29 | Canonical Project Stage Gating | Enforce stage order (Survey -> Structure -> Material -> Install -> Testing -> NetMeter -> Commission) | M3 | Survey / R3 |
| 30 | Project Dossier Management | Document repository in `ProjectDossierModal.tsx` with categorized uploads, progress, confirmations | M3 | Survey / R3 |
| 31 | Statutory DISCOM Document Studio | 7-template generator in `DiscomDocsModal.tsx` with 115mm stamp margin toggle and live PDF preview | M3 | Survey / R3 |
| 32 | Field Operations & Checklist | Redesign `OperationsScreen.tsx` with interactive installation checklist and geo-photo capture | M3 | Survey / R3 |
| 33 | 2D Barcode Scanner & ALMM Verification | Camera 2D QR/DataMatrix scanning with DCR domestic content validation, duplicate blocking | M3 | Survey / R3 |
| 34 | Electrical QA Sign-Off | `InstallationQAModal.tsx` enforcing CEA safety thresholds (<5.0Ω earth pit, <2.0s trip, >1MΩ) | M3 | Survey / R3 |
| 35 | Milestone Invoicing Ledger | Redesign `FinanceScreen.tsx` with milestone breakdown, overdue aging, payment recording | M3 | Survey / R3 |
| 36 | Statutory Solar Composite GST | 13.8% composite solar GST calculation (70% @ 12% + 30% @ 18%) with trade discount scaling | M3 | Survey / R3 |
| 37 | In-App Invoice PDF Viewer & Share | Preview, print, and WhatsApp share sheet dispatch for milestone invoices | M3 | Survey / R3 |
| 38 | Field Profile & Tenant Identity | Display authorized user/tenant profile, active permissions, statutory links (MSEDCL, PM Surya Ghar) | M3 | Survey / R3 |
| 39 | Real Offline Sync Queue | Replace simulated `setTimeout` in `FieldProfileScreen.tsx` with real AsyncStorage offline sync queue | M3 | Survey / R3 |
| 40 | Session Expiry & Suspension Modals | Non-dismissible handling of HTTP 401 (session expired) and HTTP 403 (`TENANT_SUSPENDED`) | M3 | Survey / R3 |
| 41 | Native Haptics Integration | Integrate `expo-haptics` for tactile feedback on scan success, stage change, QA validation | M4 | Survey / R4 |
| 42 | Network Connectivity Listener | Integrate `expo-network` / NetInfo for real-time online/offline banner and queue replay | M4 | Survey / R4 |
| 43 | List Virtualization Optimization | Optimize FlatList / FlashList with `windowSize`, `getItemLayout`, `maxToRenderPerBatch` | M4 | Survey / R4 |
| 44 | API Debounce & Caching | Debounce search inputs (300ms) and memoize heavy statutory calculations | M4 | Survey / R4 |
| 45 | Android Permission UX | Clear, graceful permission request dialogs and fallbacks for Camera, Gallery, Storage | M4 | Survey / R4 |
| 46 | E2E Regression Verification | 100% pass on 23-perspective automated test suite and expanded tier 1-4 tests | M5 | Survey / R5 |
| 47 | TypeScript & Lint Verification | Strict TypeScript compilation (`tsc --noEmit`) with 0 errors, clean linting | M5 | Survey / R5 |
| 48 | Adversarial Testing & Hardening | Tier 5 adversarial testing of edge cases, offline transitions, and boundary values | M5 | Survey / R5 |
| 49 | Transformation Documentation | Produce `/docs/mobile-transformation-plan.md`, `progress.md`, and `testing.md` | M5 | Survey / R5 |
| 50 | Final Completion Deliverables Report | Comprehensive report with before-and-after audit, screen modifications, and readiness | M5 | Survey / R5 |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Audit, Screen Inventory & Design System Foundation | Document audit, screen inventory, UX problems; design system specification & tokens (light/dark, typography, tabular numerals, spacing, states); shared UI primitives | none | DONE |
| M2 | Mobile IA, Navigation & Business Command Dashboard | Navigation restructuring, safe area insets, Android hardware back, dead code removal, Dashboard transformation with authorized data & loading skeletons, global search | M1 | DONE |
| M3 | End-to-End Module, Screen & Workflow Transformation | Decompose ModulesScreen; CRM/Pipeline, QuickQuote, Customer Onboarding, Field Projects, DISCOM Studio, Field Operations, Electrical QA, Barcode Scanner, Finance & Invoicing, Profile | M1, M2 | DONE |
| M4 | Native Android Interactions, Performance & Layout Validation | Expo Haptics, real offline sync queue, network status listener, list virtualization, memoization, permission handling, layout responsiveness | M1, M2, M3 | DONE |
| M5 | E2E Testing, Adversarial Hardening & Final Reporting | Dual-track verification: Tiers 1-4 automated test pass, Tier 5 adversarial hardening, TypeScript checks, transformation docs and final completion report | M1, M2, M3, M4 | IN_PROGRESS |

## Interface Contracts

### Theme ↔ Screen Components
```typescript
interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
}

interface DesignTokens {
  colors: ThemeColors;
  isDark: boolean;
  spacing: (step: number) => number; // 4pt grid: 1=4px, 2=8px, 4=16px, etc.
  radii: { sm: number; md: number; lg: number; xl: number; full: number };
  typography: {
    fontFamilies: { regular: string; medium: string; bold: string; mono: string };
    sizes: { tiny: number; caption: number; body: number; sub: number; base: number; title: number; h3: number; h2: number; h1: number };
    tabularNums: { fontVariant: ['tabular-nums'] };
  };
}
```

### Auth & Tenant Context ↔ Screens
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_SUB_ADMIN';
  tenantName: string;
  tenantId: string;
  avatarUrl?: string;
  permissions?: string[];
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  sessionExpired: boolean;
  accountSuspended: boolean;
  accountSuspendedMessage: string;
  backendStatus: { isOnline: boolean; serverUrl: string; latencyMs?: number };
  logout: () => Promise<void>;
  resetPasswordRequired: boolean;
}
```

### Statutory Solar Calculation Contract
```typescript
interface PricingCalculation {
  systemKw: number;
  basePricePerWatt: number;
  subtotal: number;
  tradeDiscount: number;
  taxableAmount: number;
  gstRate: number; // 0.138 (13.8% composite solar GST)
  gstAmount: number;
  grossTotal: number;
  cfaSubsidy: number; // ₹30k (1kW), ₹60k (2kW), ₹78k (>=3kW residential cap)
  netPayableByCustomer: number;
  milestones: [
    { name: 'Advance', percentage: 20, amount: number },
    { name: 'Delivery', percentage: 60, amount: number },
    { name: 'Installation', percentage: 15, amount: number },
    { name: 'Commissioning', percentage: 5, amount: number }
  ];
}
```

## Code Layout
- `docs/mobile-product-audit.md`: Detailed codebase architecture, packages, and technical evaluation.
- `docs/mobile-screen-inventory.md`: Complete 23-screen inventory with routes, states, and deficiencies.
- `docs/mobile-ux-problems.md`: Catalog of UX anti-patterns, form ergonomics flaws, and layout issues.
- `docs/mobile-design-system.md`: Full design system specification with tokens, scales, and component guidelines.
- `docs/mobile-transformation-plan.md`: Milestone roadmap, architectural decisions, and tracking.
- `docs/mobile-transformation-progress.md`: Phase-by-phase execution log and milestones status.
- `docs/mobile-transformation-testing.md`: Comprehensive test matrix, commands, results, and edge cases.
- `mobile-app/src/theme/`: Standardized theme tokens (`colors.ts`, `tokens.ts`, `ThemeProvider.tsx`, `useTheme.ts`).
- `mobile-app/src/components/common/`: Reusable UI primitives (`Button`, `Card`, `Badge`, `Input`, `EmptyState`, `SkeletonLoader`, etc.).
- `mobile-app/src/navigation/`: Navigation root, stacks, tab navigators, and route types.
- `mobile-app/src/screens/`: Domain screen modules (auth, dashboard, crm, projects, operations, finance, modules, profile).
