# WhereReady Solar OS — Mobile Product & Codebase Audit

**Document Version**: 1.0.0  
**Date**: 2026-10-30  
**Target Milestone**: M1 (Product Audit & Design System Foundation)  
**Target Application**: `mobile-app/` (`com.whereready.solaros`)  
**Monorepo Root**: `f:\Company Products\solar-manager\`  
**Audience**: Engineering Leadership, Product Architects, Mobile Engineers, QA Auditors  

---

## 1. Executive Summary & Enterprise Context

### 1.1 Product Mission & Market Focus
WhereReady Solar OS is a mission-critical mobile enterprise SaaS client built specifically for Indian solar Engineering, Procurement, and Construction (EPC) businesses, rooftop installers, site technicians, and DISCOM (Distribution Company) liaison agents. The platform automates and synchronizes the end-to-end solar lifecycle:
- Instant lead capture and on-site rooftop surveys with solar radiation assessments.
- 60-second automated quotation and engineering sizing calculations factoring in Tier-1 ALMM modules and central PM Surya Ghar Muft Bijli Yojana Direct Benefit Transfer (DBT) capital subsidies.
- DISCOM statutory interconnection document generation across 7 standard templates with automated physical 115mm non-judicial stamp margins.
- On-site field installation tracking, 2D QR/DataMatrix barcode scanning for Domestic Content Requirement (DCR) solar module traceability, and CEA (Central Electricity Authority) statutory electrical safety sign-offs (<5.0Ω earth pit resistance, <2.0s RCD trip time, >1MΩ insulation resistance).
- Milestone-based billing, payment ledger tracking, and 13.8% composite solar GST invoicing (70% goods @ 12% + 30% services @ 18%).

### 1.2 Monorepo Architecture & Topology
The WhereReady repository is structured as a unified multi-tier enterprise monorepo:

```
solar-manager/
├── mobile-app/          # React Native 0.88.0, Expo SDK 58.0.16, TypeScript 6.0.3, Hermes JS, Fabric New Architecture
├── backend/             # Node.js Express 5.2.1, Prisma ORM 5.22.0 (68 database models), PostgreSQL, JWT RBAC
├── web-client/          # Next.js 16.3.5 (App Router), React 19.2.8, Tailwind CSS v4 (58 route pages)
└── docs/                # Central technical documentation repository
```

### 1.3 Target Roles & Mobile Personas

| Role | Mobile Primary Workflows | Key Functional Modules |
|---|---|---|
| **SUPER_ADMIN** | Platform infrastructure telemetry, multi-tenant subscription monitoring, instant tenant suspension enforcement. | `SuperAdminScreen`, `AccountSuspendedModal` |
| **TENANT_ADMIN** (EPC Founder / Managing Director) | Business command center, revenue and cash flow tracking, receivables aging, project stage bottleneck analysis, staff oversight. | `DashboardScreen`, `FinanceScreen`, `FieldProfileScreen` |
| **TENANT_SUB_ADMIN** (Sales Agent / Solar Consultant) | Quick customer intake, on-site 60s quote generation, subsidy feasibility estimation, customer KYC onboarding, pipeline stage progression. | `PipelineScreen`, `QuickQuoteScreen`, `LeadCaptureModal`, `CustomerOnboardingModal` |
| **TENANT_SUB_ADMIN** (Field Installation Engineer) | Rooftop structural surveys, 2D DCR barcode serialization scans, milestone progression checklists, geo-tagged photo audits, CEA electrical QA sign-offs. | `FieldProjectsScreen`, `OperationsScreen`, `BarcodeScannerModal`, `InstallationQAModal` |
| **TENANT_SUB_ADMIN** (DISCOM Liaison Officer) | Statutory grid-tie interconnection drafting, A4 Net-Metering document generation, stamp paper margin toggling, compliance pack exports. | `FieldProjectsScreen`, `DiscomDocsModal`, `ProjectDossierModal` |
| **TENANT_SUB_ADMIN** (Accountant / Billing Clerk) | Milestone tax invoice generation, 13.8% composite GST breakdown, payment collection recording, WhatsApp PDF invoice dispatch. | `FinanceScreen`, `CreateInvoiceModal`, `InvoicePdfModal` |

---

## 2. Dependencies, Framework & Package Manifest Audit

### 2.1 Core Manifest Specifications (`mobile-app/package.json`)

The application's runtime and build dependencies are anchored to current enterprise React Native and Expo releases:

- **Framework Core**:
  - `react`: `19.3.0`
  - `react-native`: `0.88.0`
  - `expo`: `~58.0.16` (Expo CLI `58.1.13`)
  - `typescript`: `~6.0.3`
  - JS Runtime Engine: `Hermes` (Bytecode compilation enabled)
- **Navigation Architecture**:
  - `@react-navigation/native`: `^7.5.1`
  - `@react-navigation/bottom-tabs`: `^7.21.0`
  - `@react-navigation/native-stack`: `^7.21.0`
- **Native Screen Primitives & Layout**:
  - `react-native-screens`: `^4.30.0`
  - `react-native-safe-area-context`: `^5.10.1`
- **Persistence & HTTP Networking**:
  - `@react-native-async-storage/async-storage`: `2.2.0`
  - `axios`: `^1.20.0`
- **Native Hardware, Media & Sensors**:
  - `expo-camera`: `~58.0.11` (Modern `CameraView` API)
  - `expo-image-picker`: `~58.0.10`
  - `expo-document-picker`: `~58.0.4`
  - `expo-file-system`: `~58.0.10` (`expo-file-system/legacy`)
- **Document & PDF Generation**:
  - `expo-print`: `~58.0.7`
  - `expo-sharing`: `~58.0.19`
  - `expo-intent-launcher`: `^58.0.3`
- **Iconography & Vector Graphics**:
  - `lucide-react-native`: `^1.59.0`
  - `react-native-svg`: `15.16.0`
- **System Integration**:
  - `expo-status-bar`: `~58.0.3`

### 2.2 Package Ecosystem Gaps Identified Against Requirements R3/R4

1. **`expo-haptics` (Missing)**:
   - *Requirement Reference*: R4 (Native Android Interactions).
   - *Gap Impact*: Hardware barcode scanning (`BarcodeScannerModal`), critical CEA electrical threshold validations (`InstallationQAModal`), and stage progression lack tactile confirmation.
   - *Remediation Plan*: Add `expo-haptics` or provide graceful haptic fallback checks in M4.
2. **`expo-network` / `@react-native-community/netinfo` (Missing)**:
   - *Requirement Reference*: R3 / R4 (Offline resilience & Network status).
   - *Gap Impact*: Mobile client relies on manual HTTP try-catches rather than an ambient reactive connectivity listener.
   - *Remediation Plan*: Integrate network connectivity state listener to drive the global offline telemetry banner.

---

## 3. Native Android Configuration & Build Setup

### 3.1 Project Identity & SDK Targets (`mobile-app/android/`)
- **Package Name / Application ID**: `com.whereready.solaros`
- **Version Code**: `1`
- **Version Name**: `1.0.0`
- **Target SDK**: `35` (Android 15)
- **Compile SDK**: `35`
- **Min SDK**: `24` (Android 7.0 Nougat — covering >99.2% of active Indian Android devices)

### 3.2 Performance & Architecture Flags (`android/gradle.properties`)
The native project is compiled with cutting-edge React Native performance settings:
- `newArchEnabled=true`: **React Native New Architecture** is enabled by default. UI runs on the Fabric C++ renderer and TurboModules native interface, eliminating legacy JSON bridge bottlenecks.
- `hermesEnabled=true`: **Hermes JS Engine** is enabled for ultra-fast startup, reduced RAM footprint, and ahead-of-time bytecode compilation.
- `edgeToEdgeEnabled=true`: **Edge-to-Edge window rendering** is active. The application window spans behind translucent system status and navigation bars.
- `android.enableMinifyInReleaseBuilds=true`: ProGuard / R8 code shrinking and dead-code stripping active for production APKs.
- `android.enablePngCrunchInReleaseBuilds=true`: AAPT2 PNG optimization active.
- **Target ABIs**: `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`.

### 3.3 Permissions & Manifest Audit (`android/app/src/main/AndroidManifest.xml`)
- **Declared System Permissions**:
  - `android.permission.CAMERA`: Hardware 2D QR and DataMatrix scanning and rooftop survey photos.
  - `android.permission.INTERNET`: REST API communication.
  - `android.permission.READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`: PDF generation, invoice storage, and document sharing.
  - `android.permission.RECORD_AUDIO`: Packaged for camera utilities.
  - `android.permission.SYSTEM_ALERT_WINDOW`: Development overlay.
  - `android.permission.VIBRATE`: Tactile alerts.
- **Activity Window Attributes**:
  - `android:windowSoftInputMode="adjustResize"`: Critical setting for soft-keyboard avoidance. As virtual keyboards appear, the root window resizes rather than pans blindly.
  - `android:enableOnBackInvokedCallback="false"`: Predictive back animations disabled in favor of standard Android back dispatching.

---

## 4. State Management, Session Interceptors & Persistence

### 4.1 Authentication Lifecycle (`src/context/AuthContext.tsx`)
- The authentication state maintains:
  - `user`: Active `UserProfile` (`id`, `name`, `email`, `role`, `tenantName`, `tenantId`, `permissions`).
  - `token`: Encrypted JWT Bearer string.
  - `isLoading`: Cold start bootstrap flag.
  - `sessionExpired`: Triggered upon HTTP 401 response from backend.
  - `accountSuspended`: Triggered upon HTTP 403 `TENANT_SUSPENDED` payload.
  - `backendStatus`: Tracks server reachability (`isOnline`, `serverUrl`, `latencyMs`).
- **Startup Protocol**:
  On launch, `AuthContext` queries `SafeStorage` for cached tokens, attempts a verification ping to `GET /api/auth/me`, and falls back to cached credentials if the device is in an off-grid environment.

### 4.2 Storage Resilience (`SafeStorage` in `src/api/client.ts`)
- Wraps `@react-native-async-storage/async-storage` with an in-memory dictionary fallback.
- Guarantees zero crash conditions if native storage drivers fail or throw I/O locks.
- **Managed Storage Keys**:
  - `@solar_user_token`: Active JWT authentication token.
  - `@solar_user_profile`: Serialized JSON of authenticated user profile.
  - `@solar_api_base_url`: Dynamic backend server endpoint override.
  - `@solar_manager_draft_leads`: Local queue of uncommitted on-site leads.
  - `@solar_manager_draft_quotes_${leadId}`: Sizing calculation drafts per customer.
  - `@whereready_theme_mode`: User theme preference (`'light' | 'dark' | 'system'`).

### 4.3 Network Interceptors & Error Traps (`src/api/client.ts`)
- **Axios HTTP Client**:
  - Default Timeout: `45,000ms` (45 seconds, accommodating slow 2G/3G rural networks in remote solar installations).
  - Headers: Standardized JSON content type and dynamic `Authorization: Bearer <token>`.
- **Global Interceptor Pipeline**:
  - `unauthorizedHandler`: Intercepts HTTP 401. Clears token, invalidates session, and mounts non-dismissible re-authentication dialog without clearing cached drafts.
  - `suspendedHandler`: Intercepts HTTP 403 where `code === 'TENANT_SUSPENDED'`. Forces immediate lockout display (`AccountSuspendedModal`) preventing unauthorized ERP access.

### 4.4 Domain API Client Matrix (`src/api/endpoints.ts`)
The mobile application interfaces with 16 backend domain endpoints:
1. `authApi`: Login, session renewal, password reset.
2. `tenantApi`: Tenant branding, corporate banking details, warehouse inventory.
3. `crmApi`: Lead ingestion, stage transitions, customer contact history.
4. `quotationsApi`: Sizing calculations, pricing breakdown, bill of materials.
5. `surveysApi`: Rooftop dimensions, shadow analysis, azimuth/tilt metrics.
6. `installationsApi`: Module serial mapping, inverter telemetry, commissioning reports.
7. `subsidyApi`: National Portal PM Surya Ghar registration and DBT claims.
8. `discomApi`: Grid interconnection applications and statutory tracking.
9. `loansApi`: Solar finance partner integration and EMI calculations.
10. `financeApi`: Milestone invoices, 13.8% composite GST ledgers, payment receipts.
11. `amcApi`: Annual maintenance contracts, scheduled cleaning and health visits.
12. `procurementApi`: Purchase orders, vendor shipments, material receipts.
13. `supportApi`: Field technician ticketing, RMA requests for damaged modules.
14. `superAdminApi`: System-wide telemetry, tenant tenant list, suspension toggles.
15. `ocrApi`: Electricity bill scanning and OCR parsing of 12-digit consumer numbers.
16. `documentsApi`: Cloud storage presigned URLs for project dossiers.

---

## 5. Baseline Verification & Health Record

### 5.1 Perspective Test Suite Verification (`test-perspectives.js`)
The repository contains an automated verification suite validating 10 core technical and business perspectives:
- **Execution Command**: `node mobile-app/test-perspectives.js`
- **Result**: **23 / 23 Tests Passed (100% Success Rate)**
- **Perspective Coverage**:
  1. *PM Surya Ghar Subsidy Arithmetic*: Verified 1kW (₹30,000), 2kW (₹60,000), 3kW+ (₹78,000 cap).
  2. *Tier-1 ALMM Module Sizing*: Verified 7 approved manufacturers (Waaree, Adani, Vikram, Tata, Goldi, Rayzon, RenewSys).
  3. *Indian DISCOM Consumer Number Validation*: Validated 12-digit MSEDCL, 10-digit TNEB, 11-digit BESCOM, 10-digit UPPCL.
  4. *Statutory DISCOM Document Generation*: 7 mandatory templates verified (Annexure-A, Net-Metering, Work Completion, CEIG Safety, etc.).
  5. *Physical Non-Judicial Stamp Margin*: Enforced exact 115mm top margin toggle for legal paper.
  6. *2D QR/Barcode Serial Sanitization*: DCR serial parsing and illegal character rejection.
  7. *Statutory CEA 8-Point Electrical Audit*: Earth pit (<5.0Ω), RCD trip (<2.0s), insulation (>1.0MΩ).
  8. *Currency Conversion*: Accurate Indian English number-to-words conversion for legal agreements.
  9. *Mobile Form Keyboard Ergonomics*: Keyboard avoiding layout validation across all intake flows.
  10. *Theme Token Completeness*: Verified presence of complete light and dark tokens.

### 5.2 TypeScript Compilation Health
- **Execution Command**: `cmd /c "cd mobile-app && npx tsc --noEmit"`
- **Result**: **0 compilation errors (Exit Code 0)** under strict TypeScript configurations.

---

## 6. Technical Debt & Architectural Risks

1. **Monolithic Screen Sizes**:
   Six core screen files exceed 1,500 lines of code:
   - `DiscomDocsModal.tsx`: **3,563 LOC**
   - `ModulesScreen.tsx`: **2,273 LOC**
   - `PipelineScreen.tsx`: **2,142 LOC**
   - `QuickQuoteScreen.tsx`: **1,884 LOC**
   - `DashboardScreen.tsx`: **1,690 LOC**
   - `FinanceScreen.tsx`: **1,569 LOC**
   These monoliths couple business logic, HTML template rendering, and inline styling, creating maintainability bottlenecks.

2. **Inaccurate Safe Area Inset Calculation**:
   `src/components/Header.tsx` line 429 calculates top offsets via `StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36`. On Android devices with Edge-to-Edge enabled and punch-hole camera cutouts, this results in header titles clipping into the system status bar.

3. **Orphaned Dead Code**:
   `src/screens/projects/ProjectsScreen.tsx` (1,007 LOC) is unregistered in `RootNavigator.tsx` and duplicated by `FieldProjectsScreen.tsx`. `LeadsScreen.tsx` (863 LOC) duplicates `PipelineScreen.tsx`.

4. **Hardcoded Mock Fallbacks**:
   `DashboardScreen.tsx` flashes fictitious leads (`Ramesh Patil`) and static funnels during loading or network drops. `FieldProfileScreen.tsx` renders static fake metrics (`₹34.8 Lakhs`).

5. **Simulated Offline Sync**:
   `FieldProfileScreen.tsx` handles offline synchronization using a fake `setTimeout(1200)` without issuing actual HTTP mutation requests.

---

*Authoritative document produced as part of Milestone M1.*
