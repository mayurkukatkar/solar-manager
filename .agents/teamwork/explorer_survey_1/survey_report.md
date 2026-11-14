# WhereReady Solar OS Mobile Application: Comprehensive Codebase, Tooling & Architecture Survey Report

**Author**: Explorer 1 (Codebase Researcher)  
**Date**: 2026-10-30  
**Target Workspace**: `mobile-app/` (`f:\Company Products\solar-manager\mobile-app`)  
**Ecosystem**: WhereReady Solar OS Enterprise SaaS  
**Report Type**: Baseline Architecture, Tooling, Navigation, State Management & Android Survey (M0)

---

## 1. Executive Summary & Repository Monorepo Architecture

The WhereReady Solar OS repository is an enterprise-grade multi-tenant software-as-a-service (SaaS) platform tailored for Indian solar EPC companies, rooftop solar installers, and DISCOM liaisons. The repository is organized as a multi-tier workspace:

| Directory | Stack & Framework | Primary Function |
|---|---|---|
| **`mobile-app/`** | React Native 0.88.0, Expo SDK 58.0.16, TypeScript 6.0.3 | Field engineer, sales agent & vendor mobile operations (barcode scanning, electrical QA, 7 DISCOM statutory templates, offline drafts) |
| **`backend/`** | Node.js Express 5.2.1, Prisma ORM 5.22.0, PostgreSQL | Multi-tenant core ERP API, 26 route files (>100 endpoints), 68 Prisma data models, JWT authentication, statutory solar calculator |
| **`web-client/`** | Next.js 16.3.5 (App Router), React 19.2.8, Tailwind CSS v4 | Desktop/web command centre, 58 route pages across 13 tenant modules and 12 super-admin platform screens |
| **`docs/`** | Markdown Documentation Suite | Architectural specs, audit reports, roadmaps, and regression test records |

The `mobile-app` workspace is engineered to equip solar field agents, EPC owners, and technicians with on-site mobility: capturing leads, sizing solar capacity, calculating PM Surya Ghar central subsidies (₹30k/₹60k/₹78k caps), generating statutory DISCOM net-metering dossiers, scanning DCR-compliant PV module barcodes, signing off electrical QA tests, and issuing milestone invoices.

---

## 2. Dependencies, Tooling & Expo / React Native Configuration

### 2.1 Core Runtime & Package Manifest (`package.json`)

- **Name**: `mobile-app` (v1.0.0, private)
- **Entry File**: `index.ts` -> registers root component `App.tsx` via `expo.registerRootComponent(App)`
- **Expo SDK**: `~58.0.16` (Expo CLI 58.1.13)
- **React Native**: `0.88.0`
- **React**: `19.3.0`
- **TypeScript**: `~6.0.3` (`@types/react`: `~19.3.0`)

#### Runtime Dependencies Breakdown

| Package | Version | Purpose |
|---|---|---|
| `@react-navigation/native` | `^7.5.1` | Navigation container, navigation ref, navigation state |
| `@react-navigation/bottom-tabs` | `^7.21.0` | Primary bottom tab bar navigation (Dashboard, Pipeline, FAB, Projects, Finance) |
| `@react-navigation/native-stack` | `^7.21.0` | Native stack navigator for secondary views and authentication gate |
| `react-native-screens` | `^4.30.0` | Native screen memory management and transition primitives |
| `react-native-safe-area-context` | `^5.10.1` | Safe area insets provider and hooks |
| `@react-native-async-storage/async-storage` | `2.2.0` | Persistent key-value storage for JWT tokens, user profiles, draft leads, and draft quotes |
| `axios` | `^1.20.0` | HTTP client communicating with live Express backend |
| `expo-camera` | `~58.0.11` | Camera capture & barcode/QR code recognition via `CameraView` |
| `expo-image-picker` | `~58.0.10` | Site survey & KYC photo selection from camera or gallery |
| `expo-document-picker` | `~58.0.4` | Electricity bill and PDF dossier document attachment |
| `expo-file-system` | `~58.0.10` | Local file management (specifically using `expo-file-system/legacy` for Expo SDK 58 compatibility) |
| `expo-print` | `~58.0.7` | High-fidelity HTML-to-PDF rendering and direct printing |
| `expo-sharing` | `~58.0.19` | Native share sheet dispatcher for proposals and invoices |
| `expo-intent-launcher` | `^58.0.3` | Android native intent dispatcher (e.g. opening PDF viewers, system settings) |
| `expo-status-bar` | `~58.0.3` | Status bar theme control |
| `lucide-react-native` | `^1.59.0` | Unified vector iconography |
| `react-native-svg` | `15.16.0` | Vector SVG rendering backend for icons and charts |

### 2.2 Expo Configuration (`app.json`)

- **Application Name**: `WhereReady Solar OS`
- **Slug**: `whereready-solar-os`
- **URL Scheme**: `whereready` (configured for deep-linking)
- **Orientation**: Locked to `portrait`
- **User Interface Style**: `light`
- **Icon**: `./assets/icon.png` (828 KB PNG)
- **Android Configuration**:
  - Package identifier: `com.whereready.solaros`
  - Version Code: `1`
  - Adaptive icon: Background `#FFFFFF`, Foreground `./assets/icon.png`
  - Predictive back gesture: `false`
  - Permissions declared: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- **Plugins**: `expo-sharing`
- **EAS Project ID**: `a777ad42-4a1a-48d3-be30-60d2b263af25` (Owner: `mayurkukatkar`)

### 2.3 Build Profiles (`eas.json`)

- **CLI Constraint**: `>= 12.0.0`
- **Profiles**:
  - `development`: `developmentClient: true`, `distribution: internal`
  - `preview`: `distribution: internal`, `android: { buildType: apk }`
  - `production`: `android: { buildType: apk }`

### 2.4 TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

---

## 3. Build, Lint, Type-Check & Test Commands Execution Verification

All verification commands were executed directly against the local repository environment to establish baseline integrity:

### 3.1 Mobile Test Perspectives Suite (`test-perspectives.js`)

- **Execution Command**: `node mobile-app/test-perspectives.js`
- **Status**: **PASS (23 / 23 Tests Passed, 100% Success)**
- **Verification Details Across 10 Perspectives**:
  1. *PM Surya Ghar DBT Subsidy & System Sizing*:
     - 1 kW = ₹30,000 CFA subsidy
     - 2 kW = ₹60,000 CFA subsidy
     - 3.3 kW = ₹78,000 maximum cap CFA subsidy
     - 5 kW & 10 kW = ₹78,000 capped
     - Generation arithmetic: 3.3 kW -> ~396 units/mo, ~3,950 kg CO2 offset/yr
  2. *Dynamic Hardware Modules & Inverters*:
     - Default tier-1 ALMM catalogue (Waaree, Adani, Tata, Vikram)
     - Dynamic sizing: 3.3 kW with 540W modules -> 7 modules; with 550W Vikram -> 6 modules
     - Custom module parsing (e.g. 580W Bifacial)
  3. *Customer Onboarding & Consumer Number Validation*:
     - Blocks empty or whitespace consumer numbers
     - Rejects short consumer numbers (< 6 chars)
     - Validates complete 12-digit MSEDCL consumer format
  4. *KYC Document Upload Flexibility*:
     - Allows onboarding completion with deferred document uploads
  5. *DISCOM Document Studio 7-Template Generator*:
     - Verified all 7 statutory templates (Annexure-I, WCR, Net Metering Agreement, Consumer Agreement, DCR Undertaking, Detailed Quotation, WCR Full)
  6. *₹100 Stamp Paper Header Margin*:
     - Margin toggling: preserves ~115mm blank margin when physical stamp paper is used; displays digital Maharashtra emblem when toggled on
  7. *Hardware 2D Barcode Scanner*:
     - Sanitizes multi-field delimiter/JSON barcodes, prevents duplicate scans
  8. *8-Point Statutory Pipeline Verification*:
     - Flags missing barcodes and incomplete consumer IDs; validates 8/8 when requirements met
  9. *Indian Rupee Words Converter*:
     - Accurate conversion of values into words (e.g. ₹191400 -> "One Lakh Ninety One Thousand Four Hundred Rupees Only")
  10. *Mobile Screen Ergonomics*:
      - Reclaims 275+ pixels vertical space during keyboard engagement

### 3.2 TypeScript Type-Check Verification

- **Execution Command**: `node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app`
- **Exit Code**: `0`
- **Errors Found**: **0 errors**
- **Significance**: The existing TypeScript codebase compiles completely clean under strict mode.

### 3.3 Expo Configuration Resolution

- **Execution Command**: `node mobile-app/node_modules/expo/bin/cli config mobile-app --type public`
- **Exit Code**: `0`
- **Status**: Generates valid public manifest without schema errors.

### 3.4 Command & Environment Quirks Noted

1. **PowerShell Script Execution Policy on Windows**: Direct execution of `npx <command>` in PowerShell fails with `PSSecurityException` because `npx.ps1` execution is disabled by default Windows security policies. Commands must be invoked via `cmd /c "npx ..."` or by executing node scripts directly via `node path/to/binary`.
2. **Missing Convenience Scripts in `package.json`**:
   - `mobile-app/package.json` contains only `"start"`, `"android"`, `"ios"`, and `"web"`.
   - It is missing explicit npm scripts for `"typecheck": "tsc --noEmit"`, `"test": "node test-perspectives.js"`, and `"lint": "expo lint"`. Adding these standard scripts will streamline team operations and CI verification.

---

## 4. Android Native Configuration & Build Setup

The `mobile-app/android` directory contains an autolinked native Android project generated through Expo prebuild:

### 4.1 Native Gradle Configurations

- **Application ID / Namespace**: `com.whereready.solaros`
- **Version**: Version code `1`, Version name `"1.0.0"`
- **Architecture & Performance Flags** (`android/gradle.properties`):
  - `newArchEnabled=true`: The React Native **New Architecture** (TurboModules and Fabric renderer) is explicitly activated.
  - `hermesEnabled=true`: Hermes high-performance JavaScript engine is active.
  - `edgeToEdgeEnabled=true`: Android **Edge-to-Edge** rendering is active (the app draws behind system status and navigation bars).
  - `android.enableMinifyInReleaseBuilds=true`: R8 code shrinking and obfuscation active for release APKs.
  - `android.enablePngCrunchInReleaseBuilds=true`: AAPT2 PNG optimization active.
  - `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`: Multi-ABI support.

### 4.2 Android Manifest & Native Permissions (`AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion"/>
```

- **Window Soft Input Mode**: `adjustResize` (ensures keyboard adjusts layouts dynamically)
- **Activity Launch Mode**: `singleTask`
- **Screen Orientation**: `portrait`
- **Intent Filter Scheme**: `whereready`
- **`enableOnBackInvokedCallback`**: `false` (Legacy Android back-dispatch model; predictive back gestures are disabled)

---

## 5. Navigation Architecture & Routing Structure

### 5.1 Technology Stack & Architectural Discrepancy Note

> ⚠️ **Documentation Discrepancy**: The local `mobile-app/AGENTS.md` file contains instructions suggesting the use of Expo Router (`src/app/`). However, the actual codebase is built upon **React Navigation v7** (`@react-navigation/native` ^7.5.1, `@react-navigation/native-stack` ^7.21.0, and `@react-navigation/bottom-tabs` ^7.21.0) with standard component-based navigation in `src/navigation/RootNavigator.tsx`. All agent work must follow the actual React Navigation architecture.

### 5.2 Navigation Structure & Route Hierarchy

```
RootNavigator
│
├── [!user] ── Login (LoginScreen)
│
└── [user]
    ├── MainTabs (MainTabNavigator: BottomTab)
    │   ├── Tab 1: Dashboard (DashboardScreen)
    │   ├── Tab 2: Pipeline (PipelineScreen)
    │   ├── Tab 3: CreateLeadTab (EmptyScreen + Center FAB -> LeadCaptureModal)
    │   ├── Tab 4: Projects (FieldProjectsScreen)
    │   └── Tab 5: Finance (FinanceScreen)
    │
    ├── Stack Screen: QuickQuote (QuickQuoteScreen)
    ├── Stack Screen: Modules (ModulesScreen)
    ├── Stack Screen: FinanceDetail (FinanceScreen)
    ├── Stack Screen: Profile (FieldProfileScreen)
    ├── Stack Screen: Operations (OperationsScreen)
    ├── Stack Screen: Leads (LeadsScreen)
    │
    └── Global Modal: AccountSuspendedModal (Triggered via AuthContext on 403 TENANT_SUSPENDED)
```

### 5.3 Global Navigation Helper & Reference

`RootNavigator.tsx` exports `navigationRef = createNavigationContainerRef<any>()` and a helper utility `navigateToTab(screenName, params)`:
- Screens like `'QuickQuote'`, `'Modules'`, `'Profile'`, `'Operations'`, `'Leads'` are routed directly via `navigationRef.navigate(screenName, params)`.
- Tab screens (`'Dashboard'`, `'Pipeline'`, `'Projects'`, `'Finance'`) are routed via `navigationRef.navigate('MainTabs', { screen: screenName, params })`.

### 5.4 Screen Inventory & Component File Mapping

| Screen / Modal Name | File Path | Lines | Primary Responsibility |
|---|---|---|---|
| **LoginScreen** | `src/screens/auth/LoginScreen.tsx` | 533 | Vendor credentials login, first-time password reset modal, session expiry alert |
| **DashboardScreen** | `src/screens/dashboard/DashboardScreen.tsx` | 1,690 | Operational command dashboard, KPI tiles, revenue/aging charts, horizon analytics, recent projects, quick actions |
| **PipelineScreen** | `src/screens/crm/PipelineScreen.tsx` | 2,142 | Visual lead pipeline stages (New -> Quote -> KYC -> Converted), lead quick actions, quote generation trigger |
| **FieldProjectsScreen** | `src/screens/projects/FieldProjectsScreen.tsx` | 839 | Active solar projects list, stage progression (Planning -> DISCOM -> Install -> Completed), project actions |
| **ProjectsScreen** *(Orphaned)* | `src/screens/projects/ProjectsScreen.tsx` | 1,007 | Older project list implementation; currently NOT registered in `RootNavigator` |
| **FinanceScreen** | `src/screens/finance/FinanceScreen.tsx` | 1,569 | Milestone invoice ledger, overdue tracking, payment recording (UPI/NEFT/Cheque/Cash), receipt/PDF viewer |
| **QuickQuoteScreen** | `src/screens/crm/QuickQuoteScreen.tsx` | 1,884 | Rapid solar sizing calculator, ALMM module selection, subsidy deduction, WhatsApp pitch generator, PDF preview |
| **ModulesScreen** | `src/screens/modules/ModulesScreen.tsx` | 2,273 | Mega-hub containing embedded sub-modules: Quotations wizard, Site Surveys, PM Surya Ghar tracker, DISCOM list, Solar Loan EMI calculator, Procurement POs, AMCs, Super Admin Tenants |
| **OperationsScreen** | `src/screens/operations/OperationsScreen.tsx` | 1,018 | Field installation job execution: interactive checklist, rooftop barcode list, 5 geo-tagged photos, customer sign-off |
| **FieldProfileScreen** | `src/screens/profile/FieldProfileScreen.tsx` | 601 | Vendor company profile, offline drafts counter, manual sync trigger, direct portal links (PM Surya Ghar, MSEDCL), logout |
| **LeadsScreen** | `src/screens/crm/LeadsScreen.tsx` | 863 | Dedicated CRM prospect list with stage filters and stage advance modal |
| **LeadCaptureModal** | `src/screens/crm/LeadCaptureModal.tsx` | 887 | Center FAB modal: prospect details, utility consumer number, electricity bill photo attachment, auto-kW recommendation |
| **QuotationBuilderModal** | `src/screens/crm/QuotationBuilderModal.tsx` | 1,299 | Comprehensive quotation generator modal for pipeline leads with multi-language (EN/HI/MR) pitch support |
| **CustomerOnboardingModal** | `src/screens/crm/CustomerOnboardingModal.tsx` | 1,129 | Lead-to-customer conversion: legal details, 12-digit consumer number, KYC document uploads, project creation |
| **DiscomDocsModal** | `src/screens/projects/DiscomDocsModal.tsx` | 3,563 | 7-template statutory DISCOM document generator: controls tab (margins, stamp toggle, signatures) and live preview tab |
| **BarcodeScannerModal** | `src/screens/operations/BarcodeScannerModal.tsx` | 956 | Live camera 2D QR/DataMatrix barcode scanner with ALMM/DCR validation engine and duplicate prevention |
| **InstallationQAModal** | `src/screens/operations/InstallationQAModal.tsx` | 618 | Electrical sign-off: 3 earth pit ohmic measurements (<5.0Ω), anti-islanding trip time (<2.0s), insulation resistance (>1MΩ) |
| **ProjectDossierModal** | `src/screens/projects/ProjectDossierModal.tsx` | 1,164 | Categorized project document repository (KYC, DISCOM, Photos, Commissioning) with file upload and cloud sync |
| **CreateInvoiceModal** | `src/components/CreateInvoiceModal.tsx` | 512 | Standalone invoice creation modal supporting milestone selection and 13.8% composite GST |
| **InvoicePdfModal** | `src/components/InvoicePdfModal.tsx` | 398 | In-app visual preview, print, and share sheet dispatcher for generated milestone invoices |
| **ProposalPreviewModal** | `src/components/ProposalPreviewModal.tsx` | 344 | Fullscreen visual proposal HTML preview with direct share and print buttons |
| **AccountSuspendedModal** | `src/components/AccountSuspendedModal.tsx` | 172 | Full-screen blocking modal displayed when a tenant is suspended by platform super-admin |

---

## 6. State Management, API Client Layer, Persistence & Offline Architecture

### 6.1 Authentication & Session Context (`AuthContext.tsx`)

The authentication state is managed via React Context (`AuthProvider`):
- **User Profile State**: `user` (`UserProfile`: id, name, email, role, tenantName, tenantId, avatarUrl).
- **Token State**: `token` (JWT Bearer token).
- **Session Indicators**: `isLoading`, `sessionExpired`, `accountSuspended`, `accountSuspendedMessage`.
- **Backend Status**: `backendStatus` (`{ isOnline: boolean, serverUrl: string, latencyMs?: number, lastChecked?: string }`).
- **Session Verification**: At startup, `initSession()` checks server health, validates stored credentials against `/api/auth/me`, checks tenant active status, and falls back to cached credentials only if offline.

### 6.2 Persistence Layer (`SafeStorage`)

Located in `src/api/client.ts`, `SafeStorage` wraps `@react-native-async-storage/async-storage` with an in-memory fallback dictionary:
- Keys managed:
  - `@solar_user_token`: JWT authentication token
  - `@solar_user_profile`: Cached user profile JSON
  - `@solar_api_base_url`: Optional custom backend API endpoint override
  - `@solar_manager_draft_leads`: Offline captured leads array
  - `@solar_manager_draft_quotes_${leadId}`: Cached draft quotations

### 6.3 HTTP Client Architecture (`client.ts`)

- **Instance**: Axios with `timeout: 45000` (45 seconds).
- **Default Production URL**: `https://solar-manager-three.vercel.app` (dynamically configurable via settings or custom server URL modal).
- **Request Interceptor**: Reads base URL and attaches `Authorization: Bearer <token>` on all outgoing HTTP requests.
- **Response Interceptor**:
  - Automatically traps HTTP `401 Unauthorized` and invokes `unauthorizedHandler()` -> clears session token, flags `sessionExpired = true`, triggering clean login prompt.
  - Automatically traps HTTP `403 Forbidden` with `TENANT_SUSPENDED` code or message -> invokes `suspendedHandler()` -> clears token and surfaces `AccountSuspendedModal`.
  - Normalizes and sanitizes network error messages (timeouts, connectivity lost, server failures) for user display.

### 6.4 API Service Modules (`endpoints.ts`)

The API layer exports 16 domain-scoped client modules:
1. `authApi`: `login`, `forceResetPassword`, `getMe`, `logout`
2. `tenantApi`: `getDashboard`, `getProjects`, `advanceProjectStage`, `updateProjectStatus`, `getProjectDetails`, `createProject`, `updateProjectDetails`
3. `crmApi`: `getLeads`, `getLeadMetrics`, `createLead`, `deleteLead`, `advanceLeadStage`, `convertLead`
4. `quotationsApi`: `getQuotations`, `createQuotation`, `convertQuotation`
5. `surveysApi`: `getSurveys`, `createSurvey`
6. `installationsApi`: `getDashboard`, `getInstallations`, `getInstallationDetails`, `updateJobStatus`, `scheduleInstallation`
7. `subsidyApi`: `getSubsidies`, `createSubsidy`
8. `discomApi`: `getDiscom`, `createDiscom`, `updateStage`
9. `loansApi`: `getLoans`, `createLoan`
10. `financeApi`: `getStats`, `getInvoices`, `getInvoiceDetails`, `createInvoice`, `recordPayment`, `getReceipt`, `getWhatsAppPayload`, `convertQuotation`, `createMilestoneInvoicesForProject`
11. `amcApi`: `getAmcs`
12. `procurementApi`: `getPurchaseOrders`
13. `supportApi`: `getTickets`, `createTicket`
14. `superAdminApi`: `getKpis`, `getTenants`, `getPlans`
15. `ocrApi`: `scanBill`, `fetchConsumer`
16. `documentsApi`: `uploadDocument`, `getDocuments`, `getChecklist`, `getProjectsSummary`, `verifyDocument`, `deleteDocument`, `getSecureUrl`

### 6.5 Offline Storage & Current Limitations (`offlineSyncService.ts`)

The current offline storage implementation supports saving draft leads and quotations locally in AsyncStorage:
- `saveDraftLead(lead)`: Appends to `@solar_manager_draft_leads` with generated `draft_<timestamp>_<rand>` ID.
- `getDraftLeads()`: Retrieves draft array.
- `removeDraftLead(localId)`: Removes synced draft.
- `saveDraftQuote(leadId, quoteData)` / `getDraftQuote(leadId)`: Caches draft quote.

> ⚠️ **Offline Sync Gap**: There is currently **no automated background sync queue** or network reconnection listener. In `FieldProfileScreen.tsx`, clicking "Sync All" executes a simulated `setTimeout` rather than replaying queued network requests to `POST /api/tenant/leads`.

---

## 7. Design System Tokens & Shared UI Primitives Foundation

### 7.1 Existing Tokens (`src/theme/`)

- **Colors (`colors.ts`)**:
  - Brand Primary: Electric Blue (`#0066FF`), Dark (`#0052CC`), Light (`#dbeafe`), Muted (`#eff6ff`)
  - Brand Accent: Solar Sun Amber (`#f59e0b`), Light (`#fef3c7`), Dark (`#d97706`)
  - Navy: Deep Brand Navy (`#0b192c`), Light Navy (`#1e293b`)
  - Semantic Statuses: `success` (`#10b981`), `warning` (`#f59e0b`), `danger` (`#ef4444`)
  - Slate Neutrals: 10 shades from `slate50` (`#f8fafc`) to `slate900` (`#0f172a`)
- **Spacing Scale (`tokens.ts`)**: 4-point incremental system from `1` (4px) to `16` (64px).
- **Corner Radii (`tokens.ts`)**: `xs` (4px), `sm` (8px), `md` (12px), `lg` (16px), `xl` (20px), `xxl` (24px), `full` (9999px).
- **Typography Scale (`tokens.ts`)**:
  - Sizes: `tiny` (10), `caption` (11), `sub` (12), `body` (13), `base` (14), `lead` (15), `title` (16), `h3` (18), `h2` (20), `h1` (24), `display` (28)
  - Weights: `regular` (400) through `black` (900)
  - Letter Spacing: `tight` (-0.4) through `widest` (1.0)
- **Touch Targets**: `min: 44px`, `comfortable: 48px`, `large: 54px` (satisfies mobile ergonomics).
- **Elevations / Shadows**: `none`, `subtle`, `card`, `popover`, `glowBlue`.

### 7.2 UI Primitives Library (`src/components/common/`)

1. **`Button`**: Supports `primary`, `secondary`, `outline`, `ghost`, `danger`, `success` variants; sizes `sm`, `md`, `lg`; loading spinner; left/right icons; full-width option.
2. **`Input`**: Form input with label, error text, helper text, prefix/suffix icons, focus highlight states.
3. **`Card`**: Container component supporting `elevated`, `outlined`, `flat` variants with optional touchable `onPress`.
4. **`Badge`**: Status badge supporting `primary`, `success`, `warning`, `danger`, `purple`, `neutral` schemes.
5. **`EmptyState`**: Centered icon circle, title, description, and primary action button.
6. **`Skeleton`**: Animated opacity pulsing placeholder for loading states.

---

## 8. Assets, Fonts, Icons & Native Module Capabilities

### 8.1 Asset Inventory

- **Branding Assets** (`mobile-app/assets/`):
  - `icon.png`, `app-icon.png`, `splash-icon.png`, `favicon.png` (828 KB PNGs)
  - `logo.png` (652 KB PNG)
  - `whereready-banner.png`, `whereready-banner.jpg` (652 KB)
  - `android-icon-background.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`
- **Solar Proposal Visuals** (`mobile-app/assets/solar-quotation/`):
  - 12 curated high-resolution photography assets (e.g. `audit-drone.jpg`, `craftsmanship.jpg`, `luxury-villa-cover.jpg`, `sustainable-home.jpg`, etc.) embedded into PDF proposal HTML templates.

### 8.2 Iconography & Fonts

- **Icons**: Comprehensive Lucide icon set via `lucide-react-native` backed by `react-native-svg`.
- **Fonts**: Defaults to system sans-serif font family. Custom Google font packages (e.g. Inter / JetBrains Mono) are not currently loaded via `expo-font`.

### 8.3 Native Module Audit

| Capability | Module | Integration Status | Notes / Gaps |
|---|---|---|---|
| **Barcode / QR Scanning** | `expo-camera` (`CameraView`) | Fully integrated | Hardware module serial scanning, DCR domestic content verification |
| **Photo Capture / Upload** | `expo-image-picker` | Fully integrated | Roof photos, bill attachments, KYC cards |
| **Document Picking** | `expo-document-picker` | Fully integrated | PDF and utility bill document uploads |
| **HTML-to-PDF & Printing** | `expo-print` | Fully integrated | Generates 7 DISCOM templates and customer quotations |
| **Native Sharing** | `expo-sharing` | Fully integrated | Shares PDFs via WhatsApp, Gmail, system share sheet |
| **Android Intents** | `expo-intent-launcher` | Integrated | Used for launching system document viewers |
| **Storage** | `@react-native-async-storage` | Fully integrated | Auth tokens, profile data, offline drafts |
| **Haptic Feedback** | *None* | ❌ **Missing** | `expo-haptics` is NOT installed in `package.json` despite requirement R4 |
| **Network Listener** | *None* | ❌ **Missing** | Missing `expo-network` or `@react-native-community/netinfo` for reactive offline/online transition detection |

---

## 9. Key Technical Debt, Architectural Observations & Recommendations for Milestones M1–M5

### Observation 1: Monolithic Screen Components
- **Detail**: Several core screens exceed 1,500 lines of code (`DiscomDocsModal`: 3,563 lines; `ModulesScreen`: 2,273 lines; `PipelineScreen`: 2,142 lines; `QuickQuoteScreen`: 1,884 lines; `DashboardScreen`: 1,690 lines; `FinanceScreen`: 1,569 lines).
- **Risk**: Presentation, business calculations, network calls, and modal sub-screens are deeply coupled inside single files, increasing regression risk during feature redesign.
- **Recommendation**: During M2–M4 screen transformations, extract domain sub-components, modal controllers, and calculation hooks into modular files.

### Observation 2: Hardcoded Mock Data Leaks in `ModulesScreen.tsx`
- **Detail**: In `ModulesScreen.tsx` (lines 109–132), `discomList` is initialized with static mock records ("Surendra Sharma", "Pooja Deshmukh", MSEDCL records) rather than invoking `discomApi.getDiscom()` or project DISCOM endpoints.
- **Risk**: Violates Acceptance Criteria R1/R3 ("No existing modules... broken or replaced with static mockups or dummy data").
- **Recommendation**: Refactor `ModulesScreen.tsx` during M3/M4 to bind to authorized API data.

### Observation 3: Inaccurate Safe Area Handling in `Header.tsx`
- **Detail**: Lines 429–433 in `Header.tsx` calculate top padding using:
  ```typescript
  const topSafeArea =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36)
      : 50;
  ```
- **Risk**: Since `gradle.properties` has `edgeToEdgeEnabled=true`, Android devices with display cutouts, camera punch-holes, or non-standard status bar heights will experience vertical misalignment, header clipping, or overlaps.
- **Recommendation**: Replace manual `topSafeArea` calculations with `useSafeAreaInsets().top` from `react-native-safe-area-context`.

### Observation 4: Android Hardware Back Button Traps
- **Detail**: Multiple screens feature deeply nested modal chains (e.g. `PipelineScreen` -> `LeadCaptureModal` -> `QuickQuoteScreen` or `PipelineScreen` -> `CustomerOnboardingModal`). The Android hardware back button currently defaults to closing the host screen or app rather than popping the active modal.
- **Risk**: Users pressing the hardware back button will unintentionally abort onboarding or quote forms without confirmation, losing form input.
- **Recommendation**: Implement `BackHandler.addEventListener('hardwareBackPress', ...)` across modal flows with dirty-form confirmation alerts.

### Observation 5: Missing `expo-haptics` and `netinfo`
- **Detail**: Requirement R4 mandates native haptics for critical interactions (e.g. barcode scan success, QA pass/fail, stage advancement). Furthermore, requirement R3/R5 requires reliable offline and reconnection state handling.
- **Risk**: Neither `expo-haptics` nor an active network state listener (`expo-network` / `netinfo`) is currently listed in `package.json`.
- **Recommendation**: Include `expo-haptics` and `expo-network` via `npx expo install` during M2 setup.

### Observation 6: Unregistered / Orphaned Screen File
- **Detail**: `mobile-app/src/screens/projects/ProjectsScreen.tsx` (1,007 lines) exists but is not registered in `RootNavigator.tsx`. Instead, `FieldProjectsScreen.tsx` is registered in the bottom tab navigator.
- **Risk**: Potential confusion regarding the authoritative projects screen implementation.
- **Recommendation**: Document `FieldProjectsScreen.tsx` as the authoritative project management screen in the screen inventory.

---

## 10. Conclusion & Readiness Assessment

The WhereReady Solar OS `mobile-app` codebase provides a solid, working, and strictly typed foundation:
- 100% test pass rate (23/23 tests) on `test-perspectives.js`.
- Clean TypeScript compilation (0 errors) on strict configuration.
- Native Android build configuration configured for New Architecture and Hermes.
- Complete API client communicating with the production backend.

The identified areas of technical debt (monolithic files, hardcoded mock leaks in `ModulesScreen`, safe area calculations, and missing haptics/offline queue) provide a clear, actionable roadmap for the upcoming milestones M1 through M5.
