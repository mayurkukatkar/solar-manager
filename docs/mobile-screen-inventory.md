# WhereReady Solar OS — Mobile Screen & Interface Inventory

**Document Version**: 1.0.0  
**Date**: 2026-10-30  
**Target Milestone**: M1 (Product Audit & Design System Foundation)  
**Target Application**: `mobile-app/` (`com.whereready.solaros`)  
**Monorepo Root**: `f:\Company Products\solar-manager\`  
**Audience**: Product Designers, Mobile Engineers, QA Auditors  

---

## 1. Executive Summary

This inventory establishes the comprehensive architectural map of all 23 screens, modals, and shared layout containers comprising the WhereReady Solar OS mobile client. Each interface is evaluated across line count, navigation accessibility, handled application states (Loading, Empty, Error, Offline, Partial Data), and technical deficiencies to guide Milestones M2 through M5.

---

## 2. Complete 23-Screen Inventory Table

| # | Screen / Modal Name | File Path | Lines | Functional Domain | Navigation Route / Access | Handled States (L/E/Er/O/P)* | Deficiencies & Transformation Tasks |
|---|---|---|---|---|---|---|---|
| 1 | `LoginScreen` | `src/screens/auth/LoginScreen.tsx` | 533 | Auth & Platform Security | Stack (`Login`) | L: Spinner, E: N/A, Er: Alert, O: None, P: N/A | Hardcoded hex colors throughout; lacks `KeyboardAvoidingView` on Android; blocking alerts for validation; does not reuse `<Input>` or `<Button>`. |
| 2 | `DashboardScreen` | `src/screens/dashboard/DashboardScreen.tsx` | 1,690 | Executive Command Radar | Tab 1 (`Dashboard`) | L: Ignored, E: Fallback, Er: Silent, O: Header, P: Fallback | Loading state ignored in render; flashes hardcoded dummy prospects (`Ramesh Patil`) and fake funnels; swallows API errors with `.catch(() => null)`; missing SkeletonLoader. |
| 3 | `PipelineScreen` | `src/screens/crm/PipelineScreen.tsx` | 2,142 | Sales & CRM Pipeline | Tab 2 (`Pipeline`) | L: Spinner, E: Custom, Er: Silent, O: Drafts, P: Partial | Monolithic file; duplicates `LeadsScreen`; non-virtualized `ScrollView`; unmemoized stage calculations; hardcoded colors; raw `<TextInput>` usage. |
| 4 | `LeadsScreen` *(Legacy)* | `src/screens/crm/LeadsScreen.tsx` | 863 | CRM (Standalone) | Stack (`Leads`) | L: Spinner, E: Custom, Er: Alert, O: None, P: Partial | **Redundant duplicate of `PipelineScreen`**; conflicting form validation schema; no offline draft integration. **To be retired in M2**. |
| 5 | `LeadCaptureModal` | `src/screens/crm/LeadCaptureModal.tsx` | 887 | CRM Lead Intake | Modal (Center FAB) | L: None, E: N/A, Er: Alert, O: Cached, P: N/A | **Missing `KeyboardAvoidingView`** (inputs hidden by keyboard); **Zero unsaved changes protection**; blocking `Alert.alert` validation; does not reuse `<Input>`. |
| 6 | `QuotationBuilderModal` | `src/screens/crm/QuotationBuilderModal.tsx` | 1,299 | Proposals & Pricing | Modal (from Pipeline) | L: None, E: N/A, Er: Alert, O: None, P: N/A | Missing `KeyboardAvoidingView`; company branding hardcoded in PDF; manual cost input allows invalid negative values; zero dirty-form protection. |
| 7 | `CustomerOnboardingModal` | `src/screens/crm/CustomerOnboardingModal.tsx` | 1,129 | KYC & Conversion | Modal (from Pipeline) | L: None, E: N/A, Er: Alert, O: None, P: N/A | **Missing `KeyboardAvoidingView`** across 15+ fields; no unsaved changes protection; KYC upload lacks progress bar; bank IFSC check is client-side regex only. |
| 8 | `QuickQuoteScreen` | `src/screens/crm/QuickQuoteScreen.tsx` | 1,884 | Field Estimator | Stack (`QuickQuote`) | L: None, E: N/A, Er: Alert, O: LocalStorage, P: N/A | Hardcoded corporate branding (`WhereReady Solar Technologies`, `HDFC Bank`) instead of tenant context; raw text inputs; non-virtualized gear lists. |
| 9 | `FieldProjectsScreen` | `src/screens/projects/FieldProjectsScreen.tsx` | 839 | EPC Project Execution | Tab 4 (`Projects`) | L: Spinner, E: Custom, Er: Silent, O: None, P: Partial | Non-virtualized `ScrollView`; hardcoded colors; lacks search debounce; stage advancement lacks offline mutation queuing. |
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

*\*State Codes: L = Loading, E = Empty, Er = Error, O = Offline, P = Partial Data.*

---

## 3. Functional Domain Grouping & Information Architecture

The 23 screen components map directly into 7 domain clusters reflecting the organizational structure of an Indian solar EPC firm:

```
WhereReady Solar OS Navigation Root
├── 1. Authentication & Security
│   ├── LoginScreen (#1)
│   └── AccountSuspendedModal (#22)
├── 2. Executive Command & Navigation
│   ├── DashboardScreen (#2)
│   └── Header Container (#23)
├── 3. Sales, CRM & Proposals
│   ├── PipelineScreen (#3)
│   ├── LeadsScreen (Legacy) (#4)
│   ├── LeadCaptureModal (#5)
│   ├── QuotationBuilderModal (#6)
│   ├── CustomerOnboardingModal (#7)
│   ├── QuickQuoteScreen (#8)
│   └── ProposalPreviewModal (#21)
├── 4. EPC Project Execution & Statutory Interconnections
│   ├── FieldProjectsScreen (#9)
│   ├── ProjectsScreen (Orphaned) (#10)
│   ├── ProjectDossierModal (#11)
│   └── DiscomDocsModal (#12)
├── 5. Field Operations & Electrical Safety QA
│   ├── OperationsScreen (#13)
│   ├── InstallationQAModal (#14)
│   └── BarcodeScannerModal (#15)
├── 6. Finance, Billing & Receivables
│   ├── FinanceScreen (#16)
│   ├── CreateInvoiceModal (#19)
│   └── InvoicePdfModal (#20)
└── 7. Operational Modules Hub & Field Identity
    ├── ModulesScreen (#17)
    └── FieldProfileScreen (#18)
```

---

## 4. Decomposition Blueprint for `ModulesScreen.tsx`

`ModulesScreen.tsx` (2,273 lines) currently acts as a monolithic catch-all containing 9 embedded sub-modules in modal sheets. Milestone M3 will decompose this into dedicated, typed screens under `src/screens/`:

1. **Site Surveys**: Extract to `src/screens/operations/SurveysScreen.tsx` (connected to `surveysApi`).
2. **PM Surya Ghar DBT Studio**: Extract to `src/screens/crm/SubsidyScreen.tsx` (connected to `subsidyApi`).
3. **DISCOM Grid Interconnections**: Extract to `src/screens/projects/DiscomListScreen.tsx` (connected to `discomApi`).
4. **Solar Loan EMI Calculator**: Extract to `src/screens/crm/LoanCalculatorScreen.tsx` (using 7% statutory EMI math).
5. **Procurement & Purchase Orders**: Extract to `src/screens/operations/ProcurementScreen.tsx` (connected to `procurementApi`).
6. **AMC & Maintenance Service**: Extract to `src/screens/operations/AmcScreen.tsx` (connected to `amcApi`).
7. **Warehouse Inventory**: Extract to `src/screens/operations/InventoryScreen.tsx` (connected to `tenantApi`).
8. **Super Admin Platform Telemetry**: Extract to `src/screens/profile/SuperAdminScreen.tsx` (connected to `superAdminApi`).
9. **Support & Service Tickets**: Extract to `src/screens/profile/SupportTicketsScreen.tsx` (connected to `supportApi`).

---

## 5. Dead Code Retirement Strategy

1. **`ProjectsScreen.tsx` (1,007 lines)**:
   - *Status*: Unreferenced in `RootNavigator.tsx`. Superseded by `FieldProjectsScreen.tsx`.
   - *Action*: Safe to remove in Milestone M2 after confirming all deep links point to `FieldProjectsScreen`.
2. **`LeadsScreen.tsx` (863 lines)**:
   - *Status*: Registered as route `Leads` in stack navigator, but functions as a redundant duplicate of `PipelineScreen.tsx`.
   - *Action*: Deprecate route in M2. Consolidate lead management into the virtualized Kanban pipeline.

---

*Authoritative document produced as part of Milestone M1.*
