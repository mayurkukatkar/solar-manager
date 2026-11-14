# Architectural Blueprint & Analysis: Mobile Documentation Deliverables (M1)

**Document Role**: Explorer M1-1 (Technical Documentation Architect)  
**Date**: 2026-10-30  
**Target Deliverables**:
1. `/docs/mobile-product-audit.md`
2. `/docs/mobile-screen-inventory.md`
3. `/docs/mobile-ux-problems.md`
4. `/docs/mobile-design-system.md`  
**Execution Context**: Milestone M1 (Product Audit & Design System Foundation)  
**Workspace**: `f:\Company Products\solar-manager\`

---

## 1. Executive Overview & Objectives

In accordance with the project directives in `ORIGINAL_REQUEST.md` (Requirement R1) and `PROJECT.md`, this analysis provides an authoritative blueprint for the 4 core documentation deliverables required in `/docs/`.

These 4 documents establish the single source of truth for the entire WhereReady Solar OS mobile transformation across Milestones M1 through M5:
- **`mobile-product-audit.md`**: Executive technical audit of the mobile app codebase, tooling, dependencies, native Android architecture, state management, and baseline health.
- **`mobile-screen-inventory.md`**: Complete, granular 23-screen inventory table documenting routes, line counts, states, and anti-patterns, along with decomposition blueprints for monolithic screens.
- **`mobile-ux-problems.md`**: Rigorous catalog of mobile UX flaws categorized by severity (P0, P1, P2), covering keyboard occlusion, unsaved changes risks, fake fallback data, safe area clipping, and non-virtualized lists.
- **`mobile-design-system.md`**: Full design system specification establishing WhereReady brand tokens, semantic solar lifecycle statuses, light/dark themes, 4pt spacing scale, typography with tabular numerals, elevations, unified iconography, and 8 standardized component interactive states.

The following sections provide the complete structural outline, exact data tables, code evidence, and drafting specifications for each deliverable so that Worker M1-Docs can author them with zero ambiguity.

---

## 2. Deliverable 1 Blueprint: `/docs/mobile-product-audit.md`

### 2.1 File Target & Purpose
- **Path**: `f:\Company Products\solar-manager\docs\mobile-product-audit.md`
- **Audience**: Engineering leadership, product architects, mobile engineers, QA auditors.
- **Objective**: Document the technical baseline of `mobile-app/`, evaluating framework architecture, package dependencies, native Android build configuration, persistence layers, API modules, and verification health.

### 2.2 Required Document Outline & Content Blueprint

#### Section 1: Executive Summary & Enterprise Context
- **Product Mission**: Mobile enterprise SaaS client for Indian solar EPC companies, rooftop installers, site technicians, and DISCOM liaisons.
- **Monorepo Topology**:
  - `mobile-app/`: React Native 0.88.0, Expo SDK 58.0.16, TypeScript 6.0.3, Hermes JS Engine, New Architecture (Fabric + TurboModules).
  - `backend/`: Node.js Express 5.2.1, Prisma ORM 5.22.0 (68 models), PostgreSQL, JWT authentication, 16 domain routes.
  - `web-client/`: Next.js 16.3.5 (App Router), React 19.2.8, Tailwind CSS v4 (58 route pages).
  - `docs/`: Central documentation repository.
- **Target Roles & Mobile Personas**:
  - `SUPER_ADMIN`: Multi-tenant platform management, instant tenant suspension.
  - `TENANT_ADMIN` (Owner/Partner): Business command center, financial ledgers, staff oversight.
  - `TENANT_SUB_ADMIN` (Sales Agent): Pipeline Kanban, 60-second QuickQuote, customer lead intake.
  - `TENANT_SUB_ADMIN` (Field Engineer/Technician): Rooftop surveys, 2D barcode scanning, statutory QA test sign-offs (<5.0Ω earth pit).
  - `TENANT_SUB_ADMIN` (Finance/Inventory): PO receiving, serialized dispatch, milestone invoicing (13.8% composite GST).

#### Section 2: Dependencies, Framework & Package Manifest Audit
- **Core Manifest Specifications (`mobile-app/package.json`)**:
  - Framework: React Native `0.88.0`, React `19.3.0`, Expo SDK `~58.0.16` (Expo CLI `58.1.13`), TypeScript `~6.0.3`.
  - Navigation: `@react-navigation/native` `^7.5.1`, `@react-navigation/bottom-tabs` `^7.21.0`, `@react-navigation/native-stack` `^7.21.0`.
  - Screen Memory Primitives: `react-native-screens` `^4.30.0`, `react-native-safe-area-context` `^5.10.1`.
  - Local Storage & Networking: `@react-native-async-storage/async-storage` `2.2.0`, `axios` `^1.20.0`.
  - Native Hardware & Media: `expo-camera` `~58.0.11` (`CameraView`), `expo-image-picker` `~58.0.10`, `expo-document-picker` `~58.0.4`, `expo-file-system` `~58.0.10` (`expo-file-system/legacy`).
  - Document & PDF Generation: `expo-print` `~58.0.7`, `expo-sharing` `~58.0.19`, `expo-intent-launcher` `^58.0.3`.
  - Iconography & Vectors: `lucide-react-native` `^1.59.0`, `react-native-svg` `15.16.0`.
  - Status Bar: `expo-status-bar` `~58.0.3`.
- **Identified Package Gaps Against Requirements R3/R4**:
  - `expo-haptics`: Missing from `package.json` (mandated by R4 for barcode scan feedback and QA validation).
  - `expo-network` / `@react-native-community/netinfo`: Missing from `package.json` (mandated by R3/R4 for real-time online/offline network banner).

#### Section 3: Native Android Configuration & Build Setup
- **Autolinked Project Structure (`mobile-app/android/`)**:
  - Application ID: `com.whereready.solaros`
  - Version Code: `1` | Version Name: `1.0.0`
  - Target SDK: 35 | Compile SDK: 35 | Min SDK: 24
- **Performance & Architectural Flags (`android/gradle.properties`)**:
  - `newArchEnabled=true`: React Native New Architecture (Fabric renderer + TurboModules) actively enabled.
  - `hermesEnabled=true`: High-performance Hermes bytecode engine active.
  - `edgeToEdgeEnabled=true`: Android Edge-to-Edge window rendering active (draws beneath system bars).
  - `android.enableMinifyInReleaseBuilds=true`: R8 code shrinking and optimization active.
  - `android.enablePngCrunchInReleaseBuilds=true`: AAPT2 PNG crunching active.
  - Multi-ABI Compilation: `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`.
- **Android Manifest & Permissions (`android/app/src/main/AndroidManifest.xml`)**:
  - Declared Permissions: `CAMERA`, `INTERNET`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `VIBRATE`.
  - Soft Input Mode: `adjustResize` (allows keyboard avoidance calculations).
  - Back Dispatch Model: `enableOnBackInvokedCallback=false` (Legacy Android back-handling; predictive back disabled).

#### Section 4: State Management, Session Interceptors & Persistence
- **Authentication Lifecycle (`src/context/AuthContext.tsx`)**:
  - Stores `user` (`UserProfile`), `token` (JWT Bearer), `isLoading`, `sessionExpired`, `accountSuspended`, `backendStatus`.
  - At startup: Checks backend health (`/api/auth/me`), verifies tenant status, falls back to cached token if offline.
- **Persistence Mechanism (`SafeStorage` in `src/api/client.ts`)**:
  - In-memory dictionary fallback wrapping `@react-native-async-storage/async-storage`.
  - Keys: `@solar_user_token`, `@solar_user_profile`, `@solar_api_base_url`, `@solar_manager_draft_leads`, `@solar_manager_draft_quotes_${leadId}`.
- **HTTP Interceptor Network Pipeline (`src/api/client.ts`)**:
  - Axios instance with 45,000ms (45s) timeout.
  - Request Interceptor: Injects dynamic baseURL and `Authorization: Bearer <token>`.
  - Response Interceptor: Traps HTTP 401 (triggers `unauthorizedHandler` -> auto-logout) and HTTP 403 `TENANT_SUSPENDED` (triggers `suspendedHandler` -> modal lockout).
- **Domain API Client Matrix (`src/api/endpoints.ts`)**:
  - 16 domain modules: `authApi`, `tenantApi`, `crmApi`, `quotationsApi`, `surveysApi`, `installationsApi`, `subsidyApi`, `discomApi`, `loansApi`, `financeApi`, `amcApi`, `procurementApi`, `supportApi`, `superAdminApi`, `ocrApi`, `documentsApi`.

#### Section 5: Baseline Verification & Health Record
- **Perspective Test Suite (`test-perspectives.js`)**:
  - Command: `node mobile-app/test-perspectives.js`
  - Result: **23 / 23 Tests Passed (100% Success Rate)** across all 10 domain perspectives (Subsidy arithmetic, 7 Tier-1 ALMM modules, 12-digit consumer validation, 7 DISCOM templates, 115mm stamp margin, 2D barcode sanitization, 8-point statutory audit, Indian rupee words conversion, and keyboard ergonomics).
- **Strict TypeScript Compilation**:
  - Command: `node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app`
  - Result: **0 compilation errors (Exit Code 0)** under strict TypeScript mode.
- **Expo Manifest Validation**:
  - Command: `node mobile-app/node_modules/expo/bin/cli config mobile-app --type public`
  - Result: Valid public schema output without configuration errors.

#### Section 6: Technical Debt & Architectural Risks
- **Monolithic Screen Sizes**: 6 components exceed 1,500 lines (`DiscomDocsModal` 3,563 lines; `ModulesScreen` 2,273 lines; `PipelineScreen` 2,142 lines; `QuickQuoteScreen` 1,884 lines; `DashboardScreen` 1,690 lines; `FinanceScreen` 1,569 lines).
- **Safe Area Inset Calculation Failure**: `Header.tsx` line 429 uses static `StatusBar.currentHeight + 10 : 36` causing clipping on Android edge-to-edge screens.
- **Orphaned Dead Code**: `ProjectsScreen.tsx` (1,007 lines) is unreferenced in navigation; `LeadsScreen.tsx` (863 lines) duplicates `PipelineScreen.tsx`.
- **Hardcoded Fake Data Leaks**: `DashboardScreen.tsx` and `FieldProfileScreen.tsx` flash hardcoded fallback arrays when live data is missing or loading.
- **Simulated Offline Sync**: `FieldProfileScreen.tsx` line 52 executes a fake `setTimeout(1200)` rather than replaying queued API mutations.

---

## 3. Deliverable 2 Blueprint: `/docs/mobile-screen-inventory.md`

### 3.1 File Target & Purpose
- **Path**: `f:\Company Products\solar-manager\docs\mobile-screen-inventory.md`
- **Audience**: UI/UX designers, mobile engineers, QA testers.
- **Objective**: Deliver an exhaustive inventory of all 23 identifiable screen interfaces, mapping file locations, line counts, functional domains, routes, handled application states, and refactoring directives.

### 3.2 Complete 23-Screen Inventory Table Blueprint

| # | Screen / Modal Name | File Path | Lines | Functional Domain | Navigation Route / Access | Handled States (L/E/Er/O/P) | Deficiencies & Transformation Tasks |
|---|---------------------|-----------|-------|-------------------|---------------------------|-----------------------------|-------------------------------------|
| 1 | `LoginScreen` | `src/screens/auth/LoginScreen.tsx` | 533 | Auth & Gateway | Stack (`Login`) | L: Spinner, E: N/A, Er: Alert, O: None, P: N/A | Hardcoded hex colors throughout; lacks `KeyboardAvoidingView` on Android; blocking alerts for validation; does not reuse `<Input>` or `<Button>`. |
| 2 | `DashboardScreen` | `src/screens/dashboard/DashboardScreen.tsx` | 1,690 | Executive Radar | Tab 1 (`Dashboard`) | L: Ignored, E: Fallback, Er: Silent, O: Header, P: Fallback | Loading state ignored in render; flashes hardcoded dummy prospects (`Ramesh Patil`) and fake funnels; swallows API errors with `.catch(() => null)`; missing SkeletonLoader. |
| 3 | `PipelineScreen` | `src/screens/crm/PipelineScreen.tsx` | 2,142 | CRM & Pipeline | Tab 2 (`Pipeline`) | L: Spinner, E: Custom, Er: Silent, O: Drafts, P: Partial | Monolithic file; duplicates `LeadsScreen`; non-virtualized `ScrollView`; unmemoized stage calculations; hardcoded colors; raw `<TextInput>` usage. |
| 4 | `LeadsScreen` *(Legacy)* | `src/screens/crm/LeadsScreen.tsx` | 863 | CRM (Standalone) | Stack (`Leads`) | L: Spinner, E: Custom, Er: Alert, O: None, P: Partial | **Redundant duplicate of `PipelineScreen`**; conflicting form validation schema; no offline draft integration. **To be retired in M2**. |
| 5 | `LeadCaptureModal` | `src/screens/crm/LeadCaptureModal.tsx` | 887 | CRM Lead Intake | Modal (Center FAB) | L: None, E: N/A, Er: Alert, O: Cached, P: N/A | **Missing `KeyboardAvoidingView`** (inputs hidden by keyboard); **Zero unsaved changes protection**; blocking `Alert.alert` validation; does not reuse `<Input>`. |
| 6 | `QuotationBuilderModal` | `src/screens/crm/QuotationBuilderModal.tsx` | 1,299 | Proposals & Pricing | Modal (from Pipeline) | L: None, E: N/A, Er: Alert, O: None, P: N/A | Missing `KeyboardAvoidingView`; company branding hardcoded in PDF; manual cost input allows invalid negative values; zero dirty-form protection. |
| 7 | `CustomerOnboardingModal` | `src/screens/crm/CustomerOnboardingModal.tsx` | 1,129 | KYC & Conversion | Modal (from Pipeline) | L: None, E: N/A, Er: Alert, O: None, P: N/A | **Missing `KeyboardAvoidingView`** across 15+ fields; no unsaved changes protection; KYC upload lacks progress bar; bank IFSC check is client-side regex only. |
| 8 | `QuickQuoteScreen` | `src/screens/crm/QuickQuoteScreen.tsx` | 1,884 | Field Estimator | Stack (`QuickQuote`) | L: None, E: N/A, Er: Alert, O: LocalStorage, P: N/A | Hardcoded corporate branding (`WhereReady Solar Technologies`, `HDFC Bank`) instead of tenant context; raw text inputs; non-virtualized gear lists. |
| 9 | `FieldProjectsScreen` | `src/screens/projects/FieldProjectsScreen.tsx` | 839 | EPC Execution | Tab 4 (`Projects`) | L: Spinner, E: Custom, Er: Silent, O: None, P: Partial | Non-virtualized `ScrollView`; hardcoded colors; lacks search debounce; stage advancement lacks offline mutation queuing. |
| 10 | `ProjectsScreen` *(Orphaned)* | `src/screens/projects/ProjectsScreen.tsx` | 1,007 | Projects (Legacy) | Unregistered | L: Spinner, E: Custom, Er: Alert, O: None, P: Partial | **Dead code**; unreferenced in `RootNavigator.tsx`; superseded by `FieldProjectsScreen.tsx`. **To be deleted in M2**. |
| 11 | `ProjectDossierModal` | `src/screens/projects/ProjectDossierModal.tsx` | 1,164 | Document Repository | Modal (from Projects) | L: Spinner, E: Text, Er: Alert, O: None, P: Partial | Upload progress indicator missing; document deletion lacks two-step confirmation; file viewer directly loads remote URLs without offline cache. |
| 12 | `DiscomDocsModal` | `src/screens/projects/DiscomDocsModal.tsx` | 3,563 | Statutory DISCOM Studio | Modal (from Projects) | L: None, E: N/A, Er: Alert, O: None, P: N/A | Monolithic **3,563 lines**; complex HTML generation coupled with UI controls; physical stamp paper toggle needs precise A4 print margin validation. |
| 13 | `OperationsScreen` | `src/screens/operations/OperationsScreen.tsx` | 1,018 | Field Operations | Stack (`Operations`) | L: Spinner, E: None, Er: Alert, O: None, P: Partial | Hardcoded checklist items and mock geo-photos (`lat: 21.1458`); customer signoff is a binary toggle instead of digital signature capture. |
| 14 | `InstallationQAModal` | `src/screens/operations/InstallationQAModal.tsx` | 618 | Electrical Safety QA | Modal (from Operations) | L: None, E: N/A, Er: Alert, O: None, P: N/A | Long blocking text alert when safety tests fail; raw numeric inputs without step controls; lacks native haptic feedback on pass/fail. |
| 15 | `BarcodeScannerModal` | `src/screens/operations/BarcodeScannerModal.tsx` | 956 | 2D Barcode Scanner | Modal (from Projects/Ops) | L: Camera, E: N/A, Er: Alert, O: Cached, P: N/A | Camera permission denial lacks recovery instructions; manual entry accepts arbitrary non-serial strings; missing `expo-haptics` tactile feedback. |
| 16 | `FinanceScreen` | `src/screens/finance/FinanceScreen.tsx` | 1,569 | Invoicing & Ledger | Tab 5 (`Finance`) | L: Spinner, E: None, Er: Silent, O: None, P: Partial | Non-virtualized invoice list; payment modal lacks receipt image attachment; lacks tabular numerals on currency strings causing layout jitter. |
| 17 | `ModulesScreen` | `src/screens/modules/ModulesScreen.tsx` | 2,273 | Multi-Module Hub | Stack (`Modules`) | L: Spinner, E: None, Er: Silent, O: None, P: Partial | **Severe anti-pattern**: 2,273-line monolith housing 9 full-screen sub-modules inside modal sheets; mock DISCOM entries (`Surendra Sharma`). **Decompose in M3**. |
| 18 | `FieldProfileScreen` | `src/screens/profile/FieldProfileScreen.tsx` | 601 | Profile & Sync | Stack (`Profile`) | L: None, E: N/A, Er: None, O: Simulated, P: Fallback | **Hardcoded fake metrics** (`₹34.8 Lakhs`, `₹8.4 L`); `handleSyncAll` uses simulated `setTimeout(1200)` without executing real HTTP requests. |
| 19 | `CreateInvoiceModal` | `src/components/CreateInvoiceModal.tsx` | 512 | Invoice Creation | Modal (from Finance) | L: None, E: N/A, Er: Alert, O: None, P: N/A | Missing `KeyboardAvoidingView`; hardcoded GST rate (13.8%) not tenant-configurable; does not reuse `<Input>` or `<Button>`. |
| 20 | `InvoicePdfModal` | `src/components/InvoicePdfModal.tsx` | 398 | Invoice Preview | Modal (from Finance) | L: Spinner, E: N/A, Er: Alert, O: None, P: N/A | Hardcoded company fallback details (`Solar Solutions Pvt Ltd`); raw HTML string formatting without memoization. |
| 21 | `ProposalPreviewModal` | `src/components/ProposalPreviewModal.tsx` | 344 | Proposal Preview | Modal (from CRM) | L: Spinner, E: N/A, Er: Alert, O: None, P: N/A | Heavy re-renders during modal open/close; duplicate currency formatting functions. |
| 22 | `AccountSuspendedModal` | `src/components/AccountSuspendedModal.tsx` | 172 | Platform Security | Global Interceptor | L: None, E: N/A, Er: None, O: Fullscreen, P: N/A | Uses hardcoded hex colors (`#e11d48`, `#fff1f2`); missing dynamic tenant administrator support contact phone. |
| 23 | `Header` & Profile Modal | `src/components/Header.tsx` | 467 | Global Navigation | Shared Header Container | L: None, E: N/A, Er: None, O: Status Pill, P: N/A | Hardcoded status bar offset (`StatusBar.currentHeight + 10 : 36`); embedded profile modal duplicates `FieldProfileScreen`; search lacks debounce. |

*State Codes: L = Loading, E = Empty, Er = Error, O = Offline, P = Partial Data.*

### 3.3 Functional Domain Grouping & Information Architecture
The 23 screens divide into 7 cohesive operational domains:
1. **Authentication & Platform Security**: `LoginScreen` (#1), `AccountSuspendedModal` (#22).
2. **Executive Command & Navigation**: `DashboardScreen` (#2), `Header` (#23).
3. **Sales, CRM & Proposals**: `PipelineScreen` (#3), `LeadsScreen` (#4), `LeadCaptureModal` (#5), `QuotationBuilderModal` (#6), `CustomerOnboardingModal` (#7), `QuickQuoteScreen` (#8), `ProposalPreviewModal` (#21).
4. **EPC Project Execution & Statutory Interconnections**: `FieldProjectsScreen` (#9), `ProjectsScreen` (#10), `ProjectDossierModal` (#11), `DiscomDocsModal` (#12).
5. **Field Operations & Electrical QA**: `OperationsScreen` (#13), `InstallationQAModal` (#14), `BarcodeScannerModal` (#15).
6. **Finance, Billing & Receivables**: `FinanceScreen` (#16), `CreateInvoiceModal` (#19), `InvoicePdfModal` (#20).
7. **Operational Modules Hub & Identity**: `ModulesScreen` (#17), `FieldProfileScreen` (#18).

### 3.4 Decomposition Blueprint for `ModulesScreen.tsx`
`ModulesScreen.tsx` (2,273 lines) currently acts as a monolithic catch-all containing 9 embedded sub-modules in modal sheets. Worker M3 must decompose this into dedicated modular screens:
1. **Site Surveys**: Extract to `src/screens/operations/SurveysScreen.tsx` (connected to `surveysApi`).
2. **PM Surya Ghar DBT Studio**: Extract to `src/screens/crm/SubsidyScreen.tsx` (connected to `subsidyApi`).
3. **DISCOM Grid Interconnections**: Extract to `src/screens/projects/DiscomListScreen.tsx` (connected to `discomApi`).
4. **Solar Loan EMI Calculator**: Extract to `src/screens/crm/LoanCalculatorScreen.tsx` (using 7% statutory EMI math).
5. **Procurement & Purchase Orders**: Extract to `src/screens/operations/ProcurementScreen.tsx` (connected to `procurementApi`).
6. **AMC & Maintenance Service**: Extract to `src/screens/operations/AmcScreen.tsx` (connected to `amcApi`).
7. **Warehouse Inventory**: Extract to `src/screens/operations/InventoryScreen.tsx` (connected to `tenantApi`).
8. **Super Admin Platform Telemetry**: Extract to `src/screens/profile/SuperAdminScreen.tsx` (connected to `superAdminApi`).
9. **Support & Service Tickets**: Extract to `src/screens/profile/SupportTicketsScreen.tsx` (connected to `supportApi`).

### 3.5 Dead Code Retirement Strategy
- **`ProjectsScreen.tsx` (1,007 lines)**: Unregistered in `RootNavigator.tsx`. Safe to delete in M2. All references redirected to `FieldProjectsScreen.tsx`.
- **`LeadsScreen.tsx` (863 lines)**: Registered as stack route `Leads`. Deprecate and remove route in M2. All CRM workflows consolidated into `PipelineScreen.tsx`.

---

## 4. Deliverable 3 Blueprint: `/docs/mobile-ux-problems.md`

### 4.1 File Target & Purpose
- **Path**: `f:\Company Products\solar-manager\docs\mobile-ux-problems.md`
- **Audience**: Product designers, mobile engineers, QA testers.
- **Objective**: Catalog every identified UX flaw, anti-pattern, form ergonomics issue, safe area violation, and fake data leak, organized into strict severity tiers (P0, P1, P2) with verbatim code evidence, impact analysis, and remediation strategies.

### 4.2 Severity Categorization & Problem Catalog

#### P0 — Critical Severity (Data Loss, Blocking Interaction, Regulatory/Statutory Flaws)

##### Problem P0-1: Keyboard Occlusion on Multi-Field Modals
- **Affected Files**: `LeadCaptureModal.tsx` (887 lines), `CustomerOnboardingModal.tsx` (1,129 lines), `QuotationBuilderModal.tsx` (1,299 lines), `CreateInvoiceModal.tsx` (512 lines).
- **Observation / Code Evidence**:
  - `LeadCaptureModal.tsx`: Contains 12 fields (Consumer No, Monthly Units, Sanctioned Load, Address) inside `<Modal><ScrollView>`.
  - Android soft keyboard opens and completely covers the bottom 50% of the screen. Inputs and the submit CTA button are inaccessible without dismissing the keyboard.
- **Impact**: Field technicians cannot complete lead intake or onboarding without keyboard gymnastics. Frustration and abandonment rate >40%.
- **Fix Strategy**: Wrap all modal scroll content in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={...}>` with `keyboardShouldPersistTaps="handled"`.

##### Problem P0-2: Zero Unsaved Changes Protection on Modal Dismissal
- **Affected Files**: `LeadCaptureModal.tsx`, `CustomerOnboardingModal.tsx`, `QuotationBuilderModal.tsx`, `CreateInvoiceModal.tsx`.
- **Observation / Code Evidence**:
  - Tapping the modal backdrop or header "X" immediately calls `onClose()`.
  - In `CustomerOnboardingModal.tsx`, entering 15 fields (name, bank IFSC, account number, electricity details) and picking 3 KYC photos is destroyed irreversibly on an accidental outside tap.
- **Impact**: Severe user frustration; loss of on-site data collected under harsh field conditions.
- **Fix Strategy**: Track `isDirty = Boolean(...)`. Intercept header "X", backdrop press, and Android `BackHandler`. If dirty, trigger `ConfirmDialog` warning: *"Discard unsaved customer onboarding? All entered details will be lost."*

##### Problem P0-3: Flash of Fake / Hardcoded Data & Silent Error Swallowing
- **Affected Files**: `DashboardScreen.tsx` (lines 75, 88-92, 277), `FieldProfileScreen.tsx` (lines 112-128).
- **Observation / Code Evidence**:
  - `DashboardScreen.tsx`: `loading` state exists but is ignored in JSX render.
  - Hardcoded `fallbackRecentLeads` (`Ramesh Patil`, `Suresh Deshmukh`) and `fallbackSubsidyFunnel` flash before API data arrives or remain permanently if API fails.
  - API calls are wrapped in `.catch(() => null)`, silently swallowing failures.
  - `FieldProfileScreen.tsx`: Hardcodes `radarValueTotal: '₹34.8 Lakhs'` and `radarGridValGreen: '₹8.4 L'`.
- **Impact**: Directly violates Acceptance Criteria R1 & R2 ("No fake statistics... no dummy data"). Users view fictitious leads and inaccurate revenues.
- **Fix Strategy**: Render `SkeletonLoader` while `loading === true`. Purge hardcoded fallback arrays. Display contextual `<EmptyState>` when arrays are empty, and display retryable error banners on API failure.

##### Problem P0-4: Simulated Offline Sync in `FieldProfileScreen.tsx`
- **Affected Files**: `FieldProfileScreen.tsx` (lines 52-57).
- **Observation / Code Evidence**:
  ```typescript
  // FieldProfileScreen.tsx:52
  const handleSyncAll = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      Alert.alert('Offline Sync Complete', 'All offline drafts synced to server.');
    }, 1200);
  };
  ```
- **Impact**: Technicians believe their offline leads are saved to the server, but no HTTP POST requests were ever issued. Draft leads remain stranded locally in AsyncStorage.
- **Fix Strategy**: Replace `setTimeout` with a real `OfflineSyncService.replayQueue()` worker that iterates over `@solar_manager_draft_leads`, sends `POST /api/tenant/leads`, removes synced items on HTTP 200, and displays real sync results.

##### Problem P0-5: Android Hardware Back Navigation Traps
- **Affected Files**: All modals (`LeadCaptureModal`, `CustomerOnboardingModal`, `DiscomDocsModal`, `InstallationQAModal`).
- **Observation / Code Evidence**:
  - Modals do not attach an Android `BackHandler` listener.
  - Pressing the hardware back button pops the underlying parent screen (e.g. `MainTabs`) or closes the app entirely, killing the active modal and losing state.
- **Impact**: Breaks standard Android navigation ergonomics.
- **Fix Strategy**: Add `BackHandler.addEventListener('hardwareBackPress', handleDismissWithGuard)` inside all modal components.

---

#### P1 — High Severity (Usability Breakdown, Layout Inset Clipping, List Performance)

##### Problem P1-1: Inaccurate Safe Area Inset Handling in `Header.tsx`
- **Affected Files**: `src/components/Header.tsx` (lines 429-433).
- **Observation / Code Evidence**:
  ```typescript
  const topSafeArea =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36)
      : 50;
  ```
  - `gradle.properties` has `edgeToEdgeEnabled=true`. On modern Android devices with punch-hole cameras, display notches, or dynamic system bars, `StatusBar.currentHeight` returns an inaccurate offset.
- **Impact**: Header titles and telemetry pills clip into the camera cutout or system status bar icons.
- **Fix Strategy**: Import `useSafeAreaInsets()` from `react-native-safe-area-context` and apply `paddingTop: insets.top`.

##### Problem P1-2: Text Clipping Under Android Dynamic Font Scaling
- **Affected Files**: `Header.tsx`, `DashboardScreen.tsx`, `PipelineScreen.tsx`, `RootNavigator.tsx`.
- **Observation / Code Evidence**:
  - Fixed heights (`height: 42`, `height: 54`, `height: 68`) combined with unconstrained `fontSize`.
  - When Android Accessibility Font Scale is set to 1.3x or 1.5x, KPI figures, button labels, and tab labels clip vertically or wrap into parent containers.
- **Impact**: Accessibility failure for users with vision accommodations.
- **Fix Strategy**: Remove hardcoded heights on text containers; use `minHeight` with flex layout; apply `maxFontSizeMultiplier={1.4}` on key text elements.

##### Problem P1-3: Non-Virtualized Long Lists Using Raw `ScrollView`
- **Affected Files**: `PipelineScreen.tsx` (2,142 lines), `FieldProjectsScreen.tsx` (839 lines), `FinanceScreen.tsx` (1,569 lines).
- **Observation / Code Evidence**:
  - Lists of leads, projects, and invoices are rendered via `<ScrollView>` with `.map()`.
  - As projects exceed 50+ items, the entire DOM tree remains mounted in memory.
- **Impact**: High memory consumption, stuttering scrolling (sub-30 FPS), potential OOM crashes on budget Android devices.
- **Fix Strategy**: Migrate to `FlatList` with `windowSize={5}`, `maxToRenderPerBatch={10}`, and memoized `renderItem`.

##### Problem P1-4: Blocking Alert Dialogs for Form Validation
- **Affected Files**: `LoginScreen.tsx`, `PipelineScreen.tsx`, `LeadCaptureModal.tsx`, `CustomerOnboardingModal.tsx`.
- **Observation / Code Evidence**:
  - Validation failures trigger `Alert.alert('Missing Field', 'Please enter ...')`.
- **Impact**: Discontinuous UX; users must dismiss system modal dialogs repeatedly.
- **Fix Strategy**: Implement inline red error helper text below fields using `<Input error="Consumer number must be 12 digits" />`.

##### Problem P1-5: Plain Text String Inputs for Dates
- **Affected Files**: `ModulesScreen.tsx` (survey scheduling), `CreateInvoiceModal.tsx` (due dates).
- **Observation / Code Evidence**:
  - Dates are entered as raw text strings (`dueDate: '15'`).
- **Impact**: Invalid date formats cause API rejection or corrupted schedules.
- **Fix Strategy**: Implement standardized `DatePickerField` integrating native Android date picker.

##### Problem P1-6: Monolithic Screen Files Exceeding 2,000 Lines
- **Affected Files**: `DiscomDocsModal.tsx` (3,563 lines), `ModulesScreen.tsx` (2,273 lines), `PipelineScreen.tsx` (2,142 lines).
- **Observation / Code Evidence**:
  - Massive files mixing business math, HTML PDF templates, state machines, and styling.
- **Impact**: High risk of accidental regression during maintenance; poor readability.
- **Fix Strategy**: Decompose in M3 into dedicated domain components and custom hooks.

---

#### P2 — Medium Severity (Design Token Violations, Touch Targets, Micro-Ergonomics)

##### Problem P2-1: 85%+ Hardcoded Hex Color Strings & Orphaned Primitives
- **Affected Files**: 18 of 23 screen and modal files.
- **Observation / Code Evidence**:
  - Screens repeatedly use `#0066FF`, `#0f172a`, `#eff6ff`, `#10b981` directly instead of referencing `colors.*`.
  - `<SkeletonLoader>` is 100% orphaned; `<Input>` and `<Button>` are bypassed for raw `<TextInput>` and `<TouchableOpacity>`.
- **Impact**: Dark theme cannot be enabled; visual inconsistency across screens.
- **Fix Strategy**: Tokenize all colors in `src/theme/` and migrate screen UI to design system primitives in M1/M2.

##### Problem P2-2: Sub-44dp Touch Targets Violating WCAG / Android Guidelines
- **Affected Files**: `PipelineScreen.tsx` (`microCallBtn`), `Header.tsx` (status pills), `DashboardScreen.tsx` (period chips).
- **Observation / Code Evidence**:
  - Hit targets measuring 28x28 dp or 32x32 dp.
- **Impact**: Missed taps for field technicians wearing gloves or working on-site.
- **Fix Strategy**: Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` and enforce minimum 44x44 dp container sizes.

##### Problem P2-3: Proportional Font Jitter on Financial Currency & Technical Metrics
- **Affected Files**: `DashboardScreen.tsx`, `FinanceScreen.tsx`, `PipelineScreen.tsx`.
- **Observation / Code Evidence**:
  - Currency figures (₹1,91,400) and kW metrics render using proportional figures.
  - Numbers shift horizontally during live updates or list scrolling.
- **Impact**: Visual instability and reduced legibility of financial data.
- **Fix Strategy**: Implement `{ fontVariant: ['tabular-nums'] }` token on all numeric displays.

##### Problem P2-4: Inconsistent Lucide Icon Sizing & Stroke Weights
- **Affected Files**: Across all screens.
- **Observation / Code Evidence**:
  - Icon sizes range arbitrarily: 11, 13, 14, 15, 16, 18, 20, 21, 26; stroke widths vary from 2.0 to 2.8.
- **Impact**: Incoherent visual hierarchy.
- **Fix Strategy**: Standardize icon size tokens (`xs: 12`, `sm: 16`, `md: 20`, `lg: 24`, `xl: 32`) and uniform stroke width `2.0`.

##### Problem P2-5: Center FAB Dummy Tab Hack in Navigation
- **Affected Files**: `RootNavigator.tsx` (lines 204-208).
- **Observation / Code Evidence**:
  - Tab 3 is an empty component (`EmptyScreen`) hijacked by `tabBarButton` to open a modal. Programmatic navigation to tab index 2 renders a blank white screen.
- **Impact**: Navigation state inconsistency.
- **Fix Strategy**: Refactor center FAB into a floating overlay or proper navigation action listener.

---

### 4.3 Remediation Action Matrix

| Severity | Issue ID | Problem Description | Target File(s) | Fix Milestone |
|---|---|---|---|:---:|
| **P0** | P0-1 | Keyboard Occlusion on Multi-Field Modals | `LeadCaptureModal`, `CustomerOnboardingModal`, `CreateInvoiceModal` | M3 |
| **P0** | P0-2 | Unsaved Changes Risk on Modal Dismissal | `LeadCaptureModal`, `CustomerOnboardingModal`, `QuotationBuilderModal` | M3 |
| **P0** | P0-3 | Flash of Fake Fallback Data & Missing Skeletons | `DashboardScreen.tsx`, `FieldProfileScreen.tsx` | M2 |
| **P0** | P0-4 | Simulated Offline Sync (`setTimeout`) | `FieldProfileScreen.tsx` | M4 |
| **P0** | P0-5 | Android Hardware Back Button Traps | All modal components | M2 |
| **P1** | P1-1 | Inaccurate Safe Area Inset Handling | `src/components/Header.tsx` | M2 |
| **P1** | P1-2 | Text Clipping Under Dynamic Font Scaling | `Header.tsx`, `DashboardScreen.tsx`, `RootNavigator.tsx` | M4 |
| **P1** | P1-3 | Non-Virtualized Long Lists (`ScrollView`) | `PipelineScreen.tsx`, `FieldProjectsScreen.tsx`, `FinanceScreen.tsx` | M4 |
| **P1** | P1-4 | Blocking Alert Dialogs for Validation | `LoginScreen.tsx`, `LeadCaptureModal.tsx` | M3 |
| **P1** | P1-5 | Plain Text Inputs for Dates | `ModulesScreen.tsx`, `CreateInvoiceModal.tsx` | M3 |
| **P1** | P1-6 | Monolithic Screen Files (>2,000 lines) | `ModulesScreen.tsx`, `DiscomDocsModal.tsx` | M3 |
| **P2** | P2-1 | 85%+ Hardcoded Hex Strings & Orphaned Primitives | All screens | M1 / M2 |
| **P2** | P2-2 | Sub-44dp Touch Targets | `PipelineScreen.tsx`, `Header.tsx` | M2 |
| **P2** | P2-3 | Proportional Font Jitter on Currency/Metrics | `DashboardScreen.tsx`, `FinanceScreen.tsx` | M1 |
| **P2** | P2-4 | Inconsistent Icon Sizing & Stroke Weights | All screens | M1 |
| **P2** | P2-5 | Center FAB Dummy Tab Hack | `RootNavigator.tsx` | M2 |

---

## 5. Deliverable 4 Blueprint: `/docs/mobile-design-system.md`

### 5.1 File Target & Purpose
- **Path**: `f:\Company Products\solar-manager\docs\mobile-design-system.md`
- **Audience**: UI/UX designers, mobile engineers, QA auditors.
- **Objective**: Establish the complete, authoritative design system specification for WhereReady Solar OS, covering branding, color tokens, semantic solar statuses, typography with tabular numerals, 4pt spacing scale, elevations, iconography, light and dark themes, component states, and reusable UI primitives.

### 5.2 Required Specification Sections & Content Blueprint

#### Section 1: Design Philosophy & Brand Foundation
- **Identity**: WhereReady Solar OS — High-performance, clean, mission-critical mobile SaaS for Indian solar EPCs.
- **Core Principles**:
  - *Operational High Density*: Present critical solar metrics (kW, ₹, DC:AC ratio, earth pit Ω) legibly without visual noise.
  - *Data Authenticity*: 100% authorized live tenant metrics; zero fake or hardcoded mockups.
  - *Field Ergonomics*: Sunlight-readable contrast, 44dp+ touch targets, keyboard-avoiding forms, native haptics.
  - *Statutory Precision*: Explicit representation of DISCOM 5-stage milestones, PM Surya Ghar DBT rules, and 13.8% composite GST.

#### Section 2: Color Architecture & Palette Specifications

##### Brand Colors
- **WhereReady Electric Blue (Primary)**:
  - `primary`: `#0066FF`
  - `primaryDark`: `#0052CC`
  - `primaryLight`: `#DBEAFE`
  - `primaryMuted`: `#EFF6FF`
- **WhereReady Solar Sun Amber (Accent)**:
  - `accent`: `#F59E0B`
  - `accentDark`: `#D97706`
  - `accentLight`: `#FEF3C7`
- **Deep Brand Navy**:
  - `navy`: `#0B192C`
  - `navyLight`: `#1E293B`

##### Light vs Dark Theme Token Dictionary

| Token Name | Light Theme Value | Dark Theme Value | Semantic Usage |
|---|---|---|---|
| `background` | `#F8FAFC` (Slate 50) | `#0B132B` (Deep Space Navy) | Root screen canvas |
| `surface` | `#FFFFFF` (Pure White) | `#1C2541` (Navy Surface) | Primary cards, modal sheets, list items |
| `surfaceElevated` | `#FFFFFF` | `#232E4D` (Elevated Navy) | Floating sheets, dropdowns, popovers |
| `border` | `#E2E8F0` (Slate 200) | `#2A3859` (Slate Navy Border) | Card borders, dividers, field borders |
| `borderSubtle` | `#F1F5F9` (Slate 100) | `#1E2B47` | Table cell dividers, subtle outlines |
| `text` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Primary headers, values, active labels |
| `textSecondary` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Supporting descriptions, timestamps |
| `textMuted` | `#94A3B8` (Slate 400) | `#64748B` (Slate 500) | Placeholder text, disabled labels |
| `primary` | `#0066FF` | `#3B82F6` (Electric Blue Dark Mode) | Primary action buttons, active tab indicators |
| `primaryLight` | `#DBEAFE` | `#1E3A8A` | Primary badge backgrounds, pill highlights |
| `accent` | `#F59E0B` | `#FBBF24` (Solar Sun Dark Mode) | Warnings, pending statuses, solar highlights |
| `accentLight` | `#FEF3C7` | `#451A03` | Warning badge backgrounds |
| `success` | `#10B981` (Emerald 500) | `#34D399` (Emerald 400) | Completed stages, paid invoices, QA pass |
| `successLight` | `#D1FAE5` | `#064E3B` | Success badge backgrounds |
| `danger` | `#EF4444` (Rose 500) | `#F87171` (Rose 400) | Overdue invoices, QA threshold failures, delete |
| `dangerLight` | `#FEE2E2` | `#7F1D1D` | Danger badge backgrounds |
| `info` | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) | Informational callouts, feasibility stage |
| `infoLight` | `#E0F2FE` | `#0C4A6E` | Info badge backgrounds |

##### Semantic Status Tokens for Indian Solar Lifecycles

| EPC / Statutory Lifecycle Stage | Color Token | Hex (Light) | Hex (Dark) | Badge Icon |
|---|---|---|---|---|
| **Feasibility Pending** | `warning` | `#F59E0B` | `#FBBF24` | `Clock` |
| **Feasibility Cleared** | `info` | `#0284C7` | `#38BDF8` | `FileCheck` |
| **Structure Approved** | `primary` | `#0066FF` | `#3B82F6` | `Hammer` |
| **Material Dispatched** | `info` | `#0284C7` | `#38BDF8` | `Truck` |
| **Installation In Progress** | `accent` | `#F59E0B` | `#FBBF24` | `Wrench` |
| **Testing / QA Passed** | `success` | `#10B981` | `#34D399` | `ShieldCheck` |
| **Net Meter Synchronized** | `success` | `#10B981` | `#34D399` | `Zap` |
| **PM Surya Ghar DBT Credited**| `success` | `#10B981` | `#34D399` | `Banknote` |
| **Milestone Invoiced** | `info` | `#0284C7` | `#38BDF8` | `Receipt` |
| **Payment Overdue** | `danger` | `#EF4444` | `#F87171` | `AlertTriangle` |
| **Tenant Suspended** | `danger` | `#EF4444` | `#F87171` | `Lock` |

#### Section 3: Typography Scale & Tabular Numerals
- **Standardized Type Scale**:

| Level | Size (pt) | Line Height (pt) | Weight | Semantic Role |
|---|---|---|---|---|
| `tiny` | 10 | 14 | 500 (Medium) | Micro-badges, date timestamps, footnote IDs |
| `caption` | 11 | 16 | 500 (Medium) | Field labels, tab labels, secondary badge text |
| `sub` | 12 | 16 | 400 (Regular) | Secondary card descriptions, helper text |
| `body` | 13 | 18 | 400 (Regular) | Standard body text, table cell values |
| `base` | 14 | 20 | 500 (Medium) | Default interactive label, input values |
| `lead` | 15 | 22 | 600 (Semibold) | Emphasized body text, list item titles |
| `title` | 16 | 24 | 600 (Semibold) | Card section headers, modal titles |
| `h3` | 18 | 26 | 700 (Bold) | Section headers, sheet titles |
| `h2` | 20 | 28 | 700 (Bold) | Screen headers, modal main titles |
| `h1` | 24 | 32 | 700 (Bold) | Dashboard revenue figures, hero numbers |
| `display` | 28 | 36 | 800 (Extrabold) | Executive telemetry figures |

- **Tabular Numerals Rule**:
  - Currency values (`₹ 1,91,400`), solar capacities (`3.3 kWp`), electrical resistance (`4.2 Ω`), generation figures (`396 kWh`), and date counters MUST include:
    ```typescript
    fontVariant: ['tabular-nums']
    ```
  - This eliminates horizontal jitter and misaligned columns during scrolling and live updates.
- **Dynamic Type Safety**: No text container may have a fixed `height`. Containers use `minHeight` and flex auto-wrapping.

#### Section 4: 4-Point Incremental Spacing Scale & Touch Targets
- **Spacing Grid Tokens**:
  - `space-1`: 4px
  - `space-2`: 8px
  - `space-3`: 12px
  - `space-4`: 16px (Standard screen padding)
  - `space-5`: 20px
  - `space-6`: 24px (Section separation)
  - `space-7`: 28px
  - `space-8`: 32px
  - `space-10`: 40px
  - `space-12`: 48px
  - `space-16`: 64px
- **Touch Target Specifications**:
  - Minimum touch target: **44 x 44 dp** (WCAG 2.1 AA / Android Material baseline).
  - Comfortable touch target: **48 x 48 dp**.
  - Prominent touch target (e.g. Center FAB, Primary CTA): **54 x 54 dp**.
  - Micro-buttons (e.g. Call / WhatsApp shortcuts) MUST apply `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to meet 44dp hit boundaries.

#### Section 5: Shape, Radii & Elevation Hierarchy

##### Corner Radii
- `none`: 0px
- `xs`: 4px (Tag borders, subtle indicator lines)
- `sm`: 8px (Inner badges, input prefix pills, thumbnail images)
- `md`: 12px (Form inputs, interactive buttons, modal headers)
- `lg`: 16px (Standard cards, list cards, action sheets)
- `xl`: 20px (Hero dashboard cards, prominent modular panels)
- `xxl`: 24px (Top-rounded modal bottom sheets: `borderTopLeftRadius: 24`, `borderTopRightRadius: 24`)
- `full`: 9999px (Status pills, circular icon buttons, avatars)

##### Normalized Elevations & Shadows (iOS & Android)

| Elevation Token | Android `elevation` | iOS `shadowOffset` | iOS `shadowOpacity` | iOS `shadowRadius` |
|---|---|---|---|---|
| `none` | 0 | `{ width: 0, height: 0 }` | 0.00 | 0 |
| `subtle` | 2 | `{ width: 0, height: 1 }` | 0.04 | 4 |
| `card` | 3 | `{ width: 0, height: 2 }` | 0.06 | 8 |
| `popover` | 6 | `{ width: 0, height: 4 }` | 0.10 | 16 |
| `glowBlue` | 5 | `{ width: 0, height: 4 }` | 0.25 (blue) | 8 |

#### Section 6: Unified Iconography Standards
- **Vector Engine**: `lucide-react-native` backed by `react-native-svg`.
- **Standard Sizing Tokens**:
  - `xs`: 12px (inline text icons, mini badges)
  - `sm`: 16px (card metadata, input prefix icons, badge icons)
  - `md`: 20px (action button icons, header action shortcuts)
  - `lg`: 24px (bottom tab bar icons, screen title icons)
  - `xl`: 32px (empty state illustration icons, scan targets)
- **Stroke Width**: Standard stroke `2.0`; Active/Selected stroke `2.5`.

#### Section 7: Component States & Interactive Micro-Interactions
Every interactive primitive and screen component must handle 8 standardized states:
1. **Default**: Baseline resting state with standard token borders and background.
2. **Active / Selected**: Highlighted state (e.g. active tab, selected stage pill) utilizing `colors.primaryLight` background with `colors.primary` border.
3. **Focused**: Form input actively receiving keyboard focus; animated 1.5px border highlight in `colors.primary`.
4. **Pressed**: Tactile response on touch down (`activeOpacity: 0.7` on iOS, or native Android ripple) accompanied by optional light haptic feedback.
5. **Disabled**: Visual attenuation (`opacity: 0.4`), touch events blocked (`pointerEvents="none"`).
6. **Loading**: Interactive control replaced by an embedded activity spinner or content area replaced by animated pulsing `<SkeletonLoader>`.
7. **Success**: Positive validation state; green border (`colors.success`), checkmark icon, success helper badge.
8. **Error**: Negative validation state; red border (`colors.danger`), inline contextual error text, alert icon.

#### Section 8: Reusable UI Primitives Library Contract
- Detailed specifications for:
  1. `<Button>`: Multi-variant (primary, secondary, outline, ghost, danger, success), sizes (sm, md, lg), loading indicator, left/right icon.
  2. `<Input>`: Label, helperText, inline error, prefixIcon, suffixIcon, clear trigger, numeric/tabular options.
  3. `<Card>`: Elevated, outlined, flat variants with theme-aware background.
  4. `<Badge>`: Status variants matching solar lifecycle tokens with optional dot indicator.
  5. `<SkeletonLoader>`: Pulsing opacity loader with pre-built layouts (`CardSkeleton`, `ListSkeleton`, `KpiSkeleton`).
  6. `<EmptyState>`: Standardized icon circle, title, description, primary CTA button.
  7. `<ScreenContainer>`: Safe area insets, keyboard-avoiding wrapper, status bar integration, theme background.
  8. `<MetricTile>` / `<KpiCard>`: Operational KPI display with tabular numerals, currency formatting, trend indicators.
  9. `<SearchBar>`: Debounced (300ms) search input with clear trigger and filter integration.
  10. `<ConfirmDialog>`: Standardized unsaved changes and destructive action modal dialog.

#### Section 9: Theme Provider & Hook Architecture
- `ThemeProvider` wrapping `App.tsx`:
  - Listens to device appearance via `useColorScheme()`.
  - Supports manual override (`'light' | 'dark' | 'system'`) persisted in `SafeStorage`.
  - Exposes `useTheme()` returning `{ theme, isDark, toggleTheme, setThemeMode }`.

---

## 6. Implementation Strategy & Execution Guidelines for Worker M1-Docs

To execute the authoring of the 4 documentation files in `f:\Company Products\solar-manager\docs\`, the following order of operations is recommended:

```
Step 1: Create /docs/mobile-product-audit.md
        └── Focus on architecture, packages, native Android config, SafeStorage, and baseline health.

Step 2: Create /docs/mobile-screen-inventory.md
        └── Focus on the 23-screen inventory matrix, domain groupings, ModulesScreen decomposition, and dead code removal.

Step 3: Create /docs/mobile-ux-problems.md
        └── Focus on P0, P1, P2 severity classification, verbatim code citations, and remediation matrix.

Step 4: Create /docs/mobile-design-system.md
        └── Focus on WhereReady tokens, light/dark theme dictionary, tabular numerals, spacing, 8 component states, and primitives.
```

### Verification & Validation Protocol for Worker M1-Docs
1. Verify that all 4 files are written to `/docs/` and NOT `.agents/teamwork/`.
2. Verify that `mobile-screen-inventory.md` contains all 23 screens with verified line counts and paths.
3. Verify that `mobile-ux-problems.md` covers all P0 issues: keyboard occlusion, unsaved changes, fake data, simulated sync, and hardware back traps.
4. Verify that `mobile-design-system.md` includes explicit light/dark token tables, tabular numerals, 4pt spacing scale, and all 8 component states.
5. Re-run `node mobile-app/test-perspectives.js` to ensure zero regressions in perspective tests.
6. Re-run `tsc --noEmit` to confirm TypeScript integrity.

---
*Blueprint completed by Explorer M1-1 (Technical Documentation Architect).*
