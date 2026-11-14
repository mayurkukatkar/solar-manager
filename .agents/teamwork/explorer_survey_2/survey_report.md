# Comprehensive Mobile Application UI, Screen & UX Audit Report
**WhereReady Solar OS — Mobile Application (React Native / Expo)**  
**Author**: Explorer 2 (Screen & UI Researcher)  
**Date**: October 30, 2026  
**Status**: Completed Exhaustive Audit  

---

## 1. Executive Summary

This report delivers a comprehensive, screen-by-screen, component-by-component, and token-by-token investigation of the WhereReady Solar OS mobile application (`/mobile-app`). The application is built on **React 19.3.0**, **React Native 0.88.0**, **Expo ~58.0.16**, and **React Navigation 7** (`@react-navigation/native 7.5.1`, `@react-navigation/bottom-tabs 7.21.0`, `@react-navigation/native-stack 7.21.0`), utilizing **lucide-react-native** for iconography.

### Core Audit Findings
1. **Screen & Module Architecture**: The application contains **18 dedicated screen and modal files** representing **23 identifiable screen interfaces**, plus 6 shared components and 5 specialized modal components. However, significant architectural bloat and fragmentation exist: 9 business-critical operational modules (Surveys, PM Surya Ghar Subsidies, DISCOM liaison, Financing/EMI, Invoicing, Procurement/Inventory, AMC Support, and Multi-tenant Governance) are awkwardly crammed into nested modal sheets inside a single 2,273-line file (`ModulesScreen.tsx`).
2. **Redundant & Dead Code**: Severe codebase duplication exists. `ProjectsScreen.tsx` (1,007 lines) is an abandoned legacy screen superseded by `FieldProjectsScreen.tsx` (839 lines). Similarly, `LeadsScreen.tsx` (863 lines) duplicates `PipelineScreen.tsx` (2,142 lines), with conflicting form modals, validation logic, and state models.
3. **Design System & Token Fragmentation**: While `/src/theme/tokens.ts` and `/src/theme/colors.ts` exist, over **85% of screen styles employ hardcoded hex color values** (e.g. `#0066FF`, `#0f172a`, `#eff6ff`, `#10b981`), raw pixel padding, and custom inline shadows. The existing tokens lack dark theme definitions, tabular numeral typography (`fontVariant: ['tabular-nums']`), semantic solar lifecycle status tokens, and formal button/interactive state styling.
4. **Orphaned Reusable Components**: Reusable components created in `/src/components/common` (`SkeletonLoader`, `Input`, `EmptyState`, `Badge`, `Button`, `Card`) are rarely adopted in the actual screens. For instance, `SkeletonLoader` is **100% orphaned** (not a single screen uses it), and screens repeatedly implement raw `<TextInput>` with custom styles rather than reusing `<Input>`.
5. **Critical UX & Ergonomics Failures**:
   - **Keyboard Occlusion**: 100% of major modal data-entry forms (`LeadCaptureModal`, `CustomerOnboardingModal`, `QuotationBuilderModal`, `CreateInvoiceModal`) lack `KeyboardAvoidingView` on Android. Entering KYC data, bank accounts, or addresses causes the soft keyboard to completely obscure inputs.
   - **Unsaved Changes Risk**: Zero screens or modals implement unsaved change confirmation guards. Accidental taps on modal backdrop or close buttons immediately destroy user input without warning.
   - **Flash of Fallback/Fake Data**: `DashboardScreen` tracks `loading` state but fails to render a loading indicator or skeleton, immediately displaying hardcoded dummy leads (`Ramesh Patil`, `Suresh Deshmukh`) and mock revenue before API data settles. `FieldProfileScreen` hardcodes static cashflow metrics (`₹34.8 Lakhs`, `₹8.4 L`) and uses a simulated `setTimeout` for offline sync.
   - **Layout & Safe Area Vulnerabilities**: Status bar handling in `Header.tsx` relies on hardcoded height offsets (`StatusBar.currentHeight + 10 : 36`) rather than dynamic insets via `useSafeAreaInsets()`, causing clipping on modern punch-hole and edge-to-edge Android devices.

---

## 2. Complete Screen Inventory & Architecture Map

### 2.1 Screen Inventory Table

| # | File Path | Screen / Component Name | Functional Domain / Module | Current Features & Capabilities | Deficiencies & Identified Anti-Patterns |
|---|-----------|-------------------------|----------------------------|---------------------------------|------------------------------------------|
| 1 | `src/screens/auth/LoginScreen.tsx` | `LoginScreen` | Auth / Enterprise Gateway | Email/password authentication, password visibility toggle, first-time password reset modal, session expiry banner, suspended account banner. | Hardcoded hex colors throughout; does not reuse `<Input>` or `<Button>`; validation uses blocking `Alert.alert`; Android `KeyboardAvoidingView` disabled (`Platform.OS === 'ios' ? 'padding' : undefined`). |
| 2 | `src/screens/dashboard/DashboardScreen.tsx` | `DashboardScreen` | Executive Operations Radar (Tab 1) | Executive Hero Card with revenue progress bar, operational stats (quotes, projects, DBT), Immediate Action radar, Quick Action strip, Live Customer pipeline stream, EPC workflow stepper, Period Horizon comparative analytics chart, PM Surya Ghar tracker, Stock runway, Environmental telemetry. | Initial loading state ignored in render (flashes hardcoded dummy metrics and fake prospects `Ramesh Patil`, `Suresh Deshmukh`); hardcoded styles across 1,690 lines; horizontal charts lack touch tooltips; lacks dark mode support. |
| 3 | `src/screens/crm/PipelineScreen.tsx` | `PipelineScreen` | CRM & Pipeline (Tab 2) | Tabbed stage filtering (ALL, LEADS, QUOTES, ONBOARDING, PROJECTS), pulse KPI strip (kW, Turnkey ₹L, Subsidy ₹L, Won count), live customer cards with call/WhatsApp triggers, inline commercial invoice status tracking, embedded lead detail modal. Spawns 6 modals. | Monolithic 2,142-line component; duplicates functionality with `LeadsScreen.tsx`; stage filter counts recalculate on every render without full memoization; lacks virtualized `FlatList` (uses raw `ScrollView`); hardcoded colors. |
| 4 | `src/screens/crm/LeadsScreen.tsx` | `LeadsScreen` | CRM (Standalone Stack) | Lead list with stage filters, summary metrics, inline "Add Lead" modal with form, inline lead detail modal. | **Redundant legacy code**; duplicates `PipelineScreen`; different form schema than `LeadCaptureModal`; no offline draft integration; blocking alerts for validation. |
| 5 | `src/screens/crm/LeadCaptureModal.tsx` | `LeadCaptureModal` | CRM / Lead Intake Modal | Full prospect registration: contact info, electricity profile (MSEDCL BU auto-inference), cross-field solar capacity sizing AI, bill photo/document picker, offline draft caching via `offlineSyncService`. | **Missing `KeyboardAvoidingView`** (inputs hidden by keyboard); **Zero unsaved changes protection**; does not reuse `<Input>`; raw `Alert.alert` validation; no OCR despite doc picker. |
| 6 | `src/screens/crm/QuotationBuilderModal.tsx` | `QuotationBuilderModal` | Proposals & Pricing Modal | Solar economics calculator, 3 proposal templates (residential, hybrid/offgrid, commercial), equipment selection (DCR modules, inverters, structures), manual cost input, language selector (EN/HI/MR), PDF preview/share via WhatsApp, server sync. | Missing `KeyboardAvoidingView`; company details hardcoded in PDF generation; manual cost input allows negative/invalid values; blocking alerts. |
| 7 | `src/screens/crm/CustomerOnboardingModal.tsx` | `CustomerOnboardingModal` | KYC & Project Conversion Modal | Customer legal profile, rooftop/technical site specs, PM Surya Ghar DBT bank details, token advance calculator (20%), 6 KYC document capture slots with camera/picker, backend lead-to-project conversion. | **Missing `KeyboardAvoidingView`** across 15+ fields; no unsaved changes protection; document uploads lack progress indicator; bank IFSC validation is client-side regex only. |
| 8 | `src/screens/crm/QuickQuoteScreen.tsx` | `QuickQuoteScreen` | Fast Field Estimator (Stack) | 60-second rooftop solar proposal generator, dynamic equipment selector (7+ Tier-1 ALMM panels, 7+ inverters), custom gear adder with local storage, instant ROI/savings calculations, multi-language WhatsApp pitch generation, instant PDF export. | Hardcoded corporate branding (`WhereReady Solar Technologies Pvt Ltd`, `Corporate Tower, Pune`, `HDFC Bank`) instead of tenant context; raw text inputs; non-virtualized gear lists; 1,884 lines in a single file. |
| 9 | `src/screens/projects/FieldProjectsScreen.tsx` | `FieldProjectsScreen` | EPC Project Execution (Tab 3) | Project execution list by stages (Planning, DISCOM, Installation, Completed), capacity metrics, client contact shortcuts, stage advancement buttons, launches DISCOM docs, Barcode scanner, QA modal, and Dossier modal. | Non-virtualized `ScrollView` (performance risk on >50 projects); hardcoded styling; lacks offline persistence for stage transitions; no search debounce. |
| 10 | `src/screens/projects/ProjectsScreen.tsx` | `ProjectsScreen` | Projects (Unused Legacy) | Legacy stage filter, advance stage modal, detail modal, discom and barcode modal triggers. | **Dead code**; completely unreferenced in `RootNavigator.tsx`; contains duplicate advance stage logic and outdated UI styling. |
| 11 | `src/screens/projects/ProjectDossierModal.tsx` | `ProjectDossierModal` | Document Management Modal | Category-filtered dossier (KYC, DISCOM, Photos, Commissioning), document list with view/share/delete, upload bottom sheet supporting camera and document picker, category tagging. | Upload progress indicator missing; delete action lacks two-step confirmation; file viewer opens external URLs directly without local caching or offline fallback. |
| 12 | `src/screens/projects/DiscomDocsModal.tsx` | `DiscomDocsModal` | Statutory DISCOM Studio | 7 statutory templates (WCR Full, WCR, Annexure I, DCR, Net-Metering, Consumer-Vendor, Standard Quotation), digital vs physical ₹100 stamp paper margin toggle, barcode integration, PDF generation/print/share. | Monolithic **3,563 lines** in one file; complex state machine mixed with HTML templating; stamp margin toggle can cause text overflow on standard A4 page print. |
| 13 | `src/screens/operations/OperationsScreen.tsx` | `OperationsScreen` | Field Operations (Stack) | Operational KPIs (Scheduled, In Progress, Review, Delayed, Completed), job execution modal with 4 tabs (Checklist, Barcodes, Geo-Photos, Customer Signoff), phone navigation link. | Hardcoded checklist items (`Waaree`, `Adani 535Wp`) and mock geo-photos (`lat: 21.1458`); customer signoff is a simple toggle instead of native signature capture pad. |
| 14 | `src/screens/operations/InstallationQAModal.tsx` | `InstallationQAModal` | Electrical Safety & QA Modal | Ohmic earthing pit validation (Pit 1 Inverter, Pit 2 Structure, Pit 3 Lightning < 5.0 Ω), anti-islanding trip time (< 2.0s), insulation resistance (> 1.0 MΩ), statutory threshold gating, stage advancement. | Blocking alert dialog with long text list when tests fail; raw numeric text inputs with no step controls; hardcoded checklist. |
| 15 | `src/screens/operations/BarcodeScannerModal.tsx` | `BarcodeScannerModal` | Hardware Barcode Scanner | Live camera scanner via `expo-camera` (`CameraView`), 2D barcode parser (JSON, delimiter, raw), DCR domestic content verification, duplicate detection, manual serial entry, persistent list storage. | Camera permission rejection flow lacks clear fallback instructions; manual entry allows any arbitrary string; hardcoded brand matching list. |
| 16 | `src/screens/finance/FinanceScreen.tsx` | `FinanceScreen` | Invoicing & Receivables (Tab 4) | Financial metrics (Revenue, Outstanding, Overdue, Expected Subsidies), invoice list with status filtering (ALL, OVERDUE, UNPAID, PARTIAL, PAID), payment recording modal, PDF invoice generator trigger, WhatsApp payment reminder. | Non-virtualized invoice list; payment recording modal lacks receipt attachment upload; hardcoded composite GST rate (13.8%); lack of tabular numerals on currency strings. |
| 17 | `src/screens/modules/ModulesScreen.tsx` | `ModulesScreen` | Multi-Module Hub (Stack) | 3-category grid (Sales & Engineering, DISCOM & Invoicing, Operations & AMC) + Super Admin Governance. Houses 9 full-screen sub-modules via modal state. | **Extreme anti-pattern**: 2,273-line catch-all file; 9 distinct modules implemented as inline JSX blocks inside one modal; duplicate quote builder; duplicate finance screen; mock DISCOM entries. |
| 18 | `src/screens/profile/FieldProfileScreen.tsx` | `FieldProfileScreen` | Vendor Account & Profile (Stack) | Vendor profile details, role verification badge, cash flow radar, quick links to PM Surya Ghar & MSEDCL portals, offline draft count with sync button, logout action. | **Hardcoded fake metrics** (`Total Monthly Contract Value: ₹34.8 Lakhs`, `Advances Collected: ₹8.4 L`); `handleSyncAll` uses fake `setTimeout` (1.2s) without making real sync API calls. |
| 19 | `src/components/CreateInvoiceModal.tsx` | `CreateInvoiceModal` | Finance / Invoice Creation | Form to create Tax Invoice, Proforma, Advance Receipt, or Custom invoice; preset titles; auto-calculation of GST (13.8%) and due dates; customer prefill from lead/customer. | Missing `KeyboardAvoidingView`; hardcoded GST rate (13.8%) not configurable per tenant; blocking validation alerts; does not reuse `<Input>`. |
| 20 | `src/components/InvoicePdfModal.tsx` | `InvoicePdfModal` | Finance / Invoice Preview | Renders full commercial invoice preview; status badges (PAID, PARTIAL, DUE, OVERDUE); sharing to WhatsApp and printing via `expo-print` and `expo-sharing`. | Hardcoded fallback company details (`Solar Solutions Pvt Ltd`, `Corporate Office, Maharashtra`); payment breakdown relies on raw HTML string formatting. |
| 21 | `src/components/ProposalPreviewModal.tsx` | `ProposalPreviewModal` | Proposals / Visual Preview | Full-screen visual preview of solar proposals across residential, hybrid, commercial, quick quote; WhatsApp PDF share; text pitch dispatcher; print trigger. | 1,485 lines; contains duplicate formatting helpers (`formatIndianCurrency`); heavy re-rendering during modal open/close. |
| 22 | `src/components/AccountSuspendedModal.tsx` | `AccountSuspendedModal` | Platform Security / Interceptor | Global modal displayed when tenant status is `SUSPENDED` (403 forbidden); displays administrator notice, check status button, support mail trigger, logout. | Good standalone design, but uses hardcoded hex colors (`#e11d48`, `#be123c`, `#fff1f2`); lacks dynamic support phone contact. |
| 23 | `src/components/Header.tsx` | `Header` & `ModalHeader` | Global Navigation / Header | 3 header variants: `home` (telemetry & brand row), `main` (tab header with search & profile pill), `detail` (back button & inline title); standardized `ModalHeader` with drag handle; embedded account profile modal. | Android status bar padding is hardcoded (`StatusBar.currentHeight + 10 : 36`); embedded profile modal inside `Header` duplicates `FieldProfileScreen`; search input lacks debounce. |

---

### 2.2 Navigation Architecture & Routing Analysis

The application uses **React Navigation 7** configured in `src/navigation/RootNavigator.tsx`:

```
NavigationContainer (ref=navigationRef)
├── Auth Stack:
│   └── LoginScreen (name="Login")
└── Authenticated Stack (when user != null):
    ├── MainTabs (name="MainTabs", component=MainTabNavigator)
    │   ├── Tab 1: Dashboard (DashboardScreen)
    │   ├── Tab 2: Pipeline (PipelineScreen)
    │   ├── Tab 3 (Center FAB): CreateLeadTab (EmptyScreen -> opens LeadCaptureModal)
    │   ├── Tab 4: Projects (FieldProjectsScreen)
    │   └── Tab 5: Finance (FinanceScreen)
    ├── QuickQuote (name="QuickQuote", component=QuickQuoteScreen)
    ├── Modules (name="Modules", component=ModulesScreen)
    ├── FinanceDetail (name="FinanceDetail", component=FinanceScreen)
    ├── Profile (name="Profile", component=FieldProfileScreen)
    ├── Operations (name="Operations", component=OperationsScreen)
    └── Leads (name="Leads", component=LeadsScreen) [LEGACY DUPLICATE]
```

#### Navigation Architectural Deficiencies:
1. **Redundant Stack Routes**: `Leads` (`LeadsScreen`) is registered as a top-level stack route alongside `Pipeline` in the bottom tabs, leading to user confusion and duplicate CRM workflows.
2. **Missing Deep Linking & Hardware Back**: Android hardware back button is not intercepted in modals; pressing back closes the entire underlying screen rather than dismissing the active top modal.
3. **Tab Bar Centre Button Hack**: The center "+" button is mounted as a dummy tab (`EmptyScreen`) with a custom `tabBarButton` that controls a local `useState` modal. If navigated to programmatically via tab index, it renders a blank white screen.
4. **Modules Screen Routing Inconsistency**: `ModulesScreen` is navigated via arbitrary parameters (e.g. `navigation.navigate('Modules', { screen: 'SURVEYS' })`), which manually triggers internal modal state rather than using proper nested navigation stacks.

---

## 3. Design System & Styling Audit

### 3.1 Existing Design Tokens Analysis

The design tokens are currently declared in:
- `src/theme/colors.ts` (45 lines)
- `src/theme/tokens.ts` (112 lines)
- `src/theme/index.ts` (3 lines re-exporting both)

#### Token Comparison: Current State vs. World-Class Mobile Design System Requirements

| Token Dimension | Existing Implementation in Codebase | Requirements for `/docs/mobile-design-system.md` | Deficit & Audit Findings |
|---|---|---|---|
| **Color System** | Declares 22 static hex colors (`colors.primary: #0066FF`, `accent: #f59e0b`, `slate50` to `slate900`, `success`, `warning`, `danger`). | Semantic color architecture: Brand (Electric Blue, Solar Amber), Surface/Background, Content/Text, Borders, Semantic Statuses (feasibility, approved, inspection, energized, subsidy credited), and Interactive States (default, pressed, focused, disabled). | **Critical**: No dark theme support; zero semantic lifecycle colors for EPC stages; >85% of screen styles ignore `colors.ts` and hardcode strings like `'#0066FF'` and `'#eff6ff'`. |
| **Theme Support** | Hardcoded light mode background (`#f8fafc`) and cards (`#ffffff`). No theme provider or context. | First-class light and dark theme tokens with seamless switching, preserving WhereReady branding and high contrast readability. | **Missing**: Dark mode is completely absent; status bar is hardcoded `<StatusBar style="light" />` in App.tsx despite app background being light. |
| **Typography Scale** | Sizes: `tiny (10)`, `caption (11)`, `sub (12)`, `body (13)`, `base (14)`, `lead (15)`, `title (16)`, `h3 (18)`, `h2 (20)`, `h1 (24)`, `display (28)`. Weights: 400 to 900. Tracking: tight to widest. | Type scale with explicit proportional `lineHeight` for every step, tabular numerals (`tabular-nums`) for currency and technical metrics, and dynamic type accessibility scaling rules. | **Deficient**: Missing line-height specifications in token scale; numbers and currency render in proportional font causing visual jitter in lists and tables; dynamic font scaling truncates text. |
| **Spacing Scale** | 4-point incremental scale: 1 (4), 2 (8), 3 (12), 4 (16), 5 (20), 6 (24), 7 (28), 8 (32), 9 (36), 10 (40), 12 (48), 14 (56), 16 (64). | Consistent 4pt/8pt spatial grid for paddings, margins, touch targets, and component containers. | **Partial Adoption**: Tokens exist, but screens frequently use arbitrary numbers (`padding: 18`, `gap: 6`, `top: -16`, `height: 42`). |
| **Shape & Radii** | `none (0)`, `xs (4)`, `sm (8)`, `md (12)`, `lg (16)`, `xl (20)`, `xxl (24)`, `full (9999)`. | Normalized corner radii hierarchy across chips (full), inputs/buttons (md/lg), cards (xl/xxl), and bottom sheets (top-xxl). | Radii tokens are clean and well structured, but screens often hardcode `borderRadius: 12` or `borderRadius: 20` directly. |
| **Elevations & Shadows** | `none`, `subtle` (elevation 2), `card` (elevation 3), `popover` (elevation 6), `glowBlue` (elevation 5). | Android elevation and iOS shadow pairs normalized with ambient light and elevation-specific surface tinting. | Defined in `tokens.ts` but rarely imported; screens define custom shadow objects with non-matching elevations in their local `StyleSheet.create`. |
| **Iconography** | Direct imports from `lucide-react-native` with varying stroke widths (2.0 to 2.8) and arbitrary sizing (11, 13, 14, 15, 16, 18, 20, 21, 26). | Unified iconography system with standardized size tokens (xs: 12, sm: 16, md: 20, lg: 24, xl: 32) and consistent stroke width (2.0 standard, 2.5 active). | Inconsistent visual weight across screens; icons rendered without proper accessible bounding boxes. |
| **Touch Targets** | `min: 44`, `comfortable: 48`, `large: 54`. | Minimum 44x44 dp touch targets for all interactive elements per WCAG and Android Material guidelines. | Multiple action buttons violate this with 28x28 dp or 32x32 dp click areas (e.g. `microCallBtn`, `statusPillCompact`, avatar pills). |

---

## 4. Reusable Component Catalog Audit

### 4.1 Existing Common Components (`src/components/common/`)

| Component | Path | Props / API | Current State & Adoption | Recommended Enhancements |
|---|---|---|---|---|
| **Badge** | `src/components/common/Badge.tsx` | `label`, `variant` (primary, success, warning, danger, purple, neutral), `size` (sm, md), `icon`, `style`, `textStyle` | **Good implementation**, but screens frequently build custom badge pills with inline styles instead of using `<Badge>`. | Add semantic solar variants (`feasibility`, `dbt`, `invoiced`, `testing`); add dot indicator support; support dark mode. |
| **Button** | `src/components/common/Button.tsx` | `title`, `onPress`, `variant` (primary, secondary, outline, ghost, danger, success), `size` (sm, md, lg), `icon`, `iconPosition`, `loading`, `disabled`, `fullWidth` | Functional, includes `ActivityIndicator` and accessible labels. Only adopted in `EmptyState`. Most screens use raw `<TouchableOpacity>`. | Formalize pressed and focused states with `Pressable`; add haptic feedback integration; add size tokens; ensure 100% screen adoption. |
| **Card** | `src/components/common/Card.tsx` | `children`, `style`, `variant` (elevated, outlined, flat), `onPress`, `activeOpacity` | Well constructed wrapper around `View` or `TouchableOpacity`. Under-utilized across screens. | Support header/body/footer sub-components; integrate elevation tokens; support dark mode surfaces. |
| **EmptyState** | `src/components/common/EmptyState.tsx` | `icon`, `title`, `description`, `actionTitle`, `onActionPress`, `style` | Good baseline layout, utilizes `<Button>`. Only used in rare instances. Screens create ad-hoc empty views. | Add secondary action support; add compact inline variant; standardize illustration/icon presentation. |
| **Input** | `src/components/common/Input.tsx` | `label`, `error`, `helperText`, `prefixIcon`, `suffixIcon`, `containerStyle`, `inputStyle`, `onSuffixPress`, standard `TextInputProps` | Handles focus state and error states with colored borders. **Completely ignored** by `LeadCaptureModal`, `CustomerOnboardingModal`, `LoginScreen`. | Add clear button support; add numeric formatted input variant (currency, kW); integrate floating label option; enforce across all forms. |
| **SkeletonLoader** | `src/components/common/SkeletonLoader.tsx` | `width`, `height`, `borderRadius`, `style` | Animated pulsing opacity (0.3 to 0.8 in 700ms). **100% orphaned** — zero screen usages! | Build pre-composed skeleton layouts (`CardSkeleton`, `ListItemSkeleton`, `KpiSkeleton`, `TableSkeleton`); integrate into all screen loading states. |

### 4.2 Missing Design System Foundation Components
To fulfill the requirements of `/docs/mobile-design-system.md` and support the mobile transformation, the following core reusable components must be built:

1. **`Surface` / `ScreenContainer`**: Standardized screen wrapper providing safe area insets, keyboard-avoiding container, status bar coordination, and background theme handling.
2. **`SolarStatusBadge`**: Specialized badge mapping exact solar domain stages (e.g. Feasibility Cleared, JIR Uploaded, Meter Testing, DBT Credited) with verified colors and icons.
3. **`MetricTile` / `KpiCard`**: Consistent operational KPI display with tabular numerals, trend delta badges, currency formatting, and progress indicators.
4. **`SearchBar`**: Debounced search component with clear button, filter chip integration, and active state animation.
5. **`FormSection` & `FormField`**: Accessible form wrapper providing field validation status, character counters, and help tooltips.
6. **`NativeDatePicker` / `DatePickerField`**: Cross-platform date picker replacing raw string text inputs for project schedules, survey dates, and invoice due dates.
7. **`ConfirmDialog` / `UnsavedChangesModal`**: Standardized dialog for confirming destructive actions or warning users before discarding dirty form states.
8. **`OfflineNoticeBanner`**: Global banner alerting users when network is offline, indicating queued local draft sync status.
9. **`ActionSheet` / `BottomSheetModal`**: Smooth gesture-driven bottom sheet replacing standard slide-up full modals for lightweight actions.

---

## 5. Comprehensive UX & UI Anti-Patterns Audit

### 5.1 Missing Application States & Resilience Flaws

```
State Breakdown Matrix Across Existing Screens:
┌───────────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Screen / Module           │ Loading │ Empty   │ Error   │ Offline │ Partial │
├───────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ LoginScreen               │ Spinner │ N/A     │ Alert   │ None    │ N/A     │
│ DashboardScreen           │ IGNORED │ Fallback│ Silent  │ Header  │ Fallback│
│ PipelineScreen            │ Spinner │ Custom  │ Silent  │ Drafts  │ Partial │
│ FieldProjectsScreen       │ Spinner │ Custom  │ Silent  │ None    │ Partial │
│ FinanceScreen             │ Spinner │ None    │ Silent  │ None    │ Partial │
│ ModulesScreen (9 Submods) │ Spinner │ None    │ Silent  │ None    │ Partial │
│ FieldProfileScreen        │ None    │ N/A     │ N/A     │ Fake    │ Fallback│
└───────────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

1. **Dashboard Loading State Ignored**:
   - In `DashboardScreen.tsx` lines 75 & 108:
     ```typescript
     const [loading, setLoading] = useState(true);
     // ... loadDashboard() -> setLoading(false)
     ```
   - In the return JSX (lines 350-935), `loading` is **never checked**. The screen renders immediately with hardcoded fallback leads and mock statistics. When the API resolves, the numbers jump, causing layout shifts.
2. **Silent API Failures**:
   - In `DashboardScreen.tsx` lines 88-92:
     ```typescript
     tenantApi.getDashboard().catch(() => null),
     tenantApi.getProjects().catch(() => null),
     crmApi.getLeads({ all: true }).catch(() => null),
     ```
   - All errors are swallowed with `.catch(() => null)`. The user receives zero notification that network connectivity failed or that the displayed figures are stale.
3. **Absence of Loading Skeletons**:
   - While `SkeletonLoader.tsx` is implemented, not a single list or card uses it. Users are greeted by blocking centered `ActivityIndicator` spinners that freeze visual interaction.
4. **Offline Resilience Is Fragmentary**:
   - While `offlineSyncService.ts` exists for storing draft leads, there is no automatic background sync worker, no sync queue indicator, and no retry mechanism.
   - `FieldProfileScreen.tsx` lines 52-57 feature a simulated `setTimeout(1200)` that displays a fake `"Offline Sync Complete"` dialog without executing any backend sync requests!

---

### 5.2 Form Ergonomics & Data Entry Anti-Patterns

1. **Keyboard Occlusion on Forms**:
   - `LeadCaptureModal.tsx` contains 12 input fields inside a `<Modal><ScrollView>`. It has **no `KeyboardAvoidingView`**. When users tap on `Monthly Units`, `Monthly Bill`, `Sanctioned Load`, or `Address`, the soft keyboard obscures the input and the submit button.
   - `CustomerOnboardingModal.tsx` contains 15+ fields and 6 document slots with **zero keyboard avoidance**.
2. **Unsaved Changes Data Loss**:
   - Tapping the "X" button or dragging down modal sheets in `LeadCaptureModal`, `CustomerOnboardingModal`, `QuotationBuilderModal`, and `CreateInvoiceModal` calls `onClose()` immediately, permanently discarding extensive user input without any confirmation warning.
3. **Validation Feedback via Blocking Modal Alerts**:
   - Instead of displaying inline red helper text below invalid fields, screens halt execution with intrusive system alerts:
     ```typescript
     // PipelineScreen.tsx:200
     if (!name.trim()) {
       Alert.alert('Missing Name', 'Please enter customer / prospect name.');
       return;
     }
     ```
   - This breaks modern mobile usability standards where errors should be indicated contextually on the fields themselves.
4. **Date Inputs as Plain Strings**:
   - In `ModulesScreen.tsx` (Schedule Survey modal) and `CreateInvoiceModal.tsx`, dates are entered as manual text strings (`surveyDate: ''`, `dueDate: '15'`) instead of using native interactive calendar pickers.

---

### 5.3 Native Android Layout, Gestures & Safe Area Violations

1. **Unsafe Status Bar Offsets**:
   - In `src/components/Header.tsx` line 429:
     ```typescript
     const topSafeArea =
       Platform.OS === 'android'
         ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36)
         : 50;
     ```
   - This static calculation fails on modern Android devices with dynamic camera punch-holes, cutouts, or edge-to-edge system navigation bars. The app must import and utilize `useSafeAreaInsets()` from `react-native-safe-area-context`.
2. **Text Clipping Under Dynamic Font Scaling**:
   - Fixed container heights such as `height: 42` (search bars), `minHeight: 44` (header rows), and `height: 54` (bottom FAB) cause text to clip vertically or overflow horizontally when users configure Android Accessibility Large Fonts (1.3x to 1.5x font scale).
3. **Hardcoded Tab Bar Insets**:
   - In `RootNavigator.tsx` line 211:
     ```typescript
     height: Platform.OS === 'ios' ? 84 : 68,
     paddingBottom: Platform.OS === 'ios' ? 24 : 10,
     ```
   - On Android devices utilizing 3-button navigation vs gesture pill navigation, the tab bar either overlaps navigation buttons or leaves excessive blank space.

---

### 5.4 Data Authenticity & Fake Metric Anti-Patterns

Requirement R1 & R2 of the original request explicitly prohibit replacing authorized data with static mockups or fake statistics. The audit revealed multiple instances of hardcoded dummy data:

1. **`src/screens/dashboard/DashboardScreen.tsx`**:
   - Line 277: `fallbackRecentLeads` hardcodes `Ramesh Patil`, `Suresh Deshmukh`, `Anand Kulkarni` with fixed phone numbers and stages.
   - Line 231: `fallbackSubsidyFunnel` hardcodes 4 stages with fixed counts and amounts (`₹18.7L`, `₹14.0L`, `₹9.3L`, `₹7.02L`).
   - Line 160: `fallbackHorizonDataMap` hardcodes trajectory figures across monthly, quarterly, and annual horizons.
2. **`src/screens/profile/FieldProfileScreen.tsx`**:
   - Line 112: `radarValueTotal: '₹34.8 Lakhs'` is hardcoded static text.
   - Line 118: `radarGridValGreen: '₹8.4 L'` is hardcoded static text.
   - Line 123: `radarGridValAmber: '₹18.2 L'` is hardcoded static text.
   - Line 128: `radarGridValBlue: '₹8.2 L'` is hardcoded static text.
3. **`src/screens/crm/QuickQuoteScreen.tsx`**:
   - Line 349: Corporate address and legal identity hardcoded to `WhereReady Solar Technologies Pvt Ltd`, `Corporate Tower, MIDC Tech Park, Pune 411038` and `HDFC Bank Ltd` instead of loading the authenticated vendor's tenant profile.

---

## 6. Recommended Component Architecture for the Design System

Based on this comprehensive audit, we propose the following target component architecture to establish `/docs/mobile-design-system.md`:

```
mobile-app/src/design-system/
├── tokens/
│   ├── colors.ts            # Light & Dark palettes, brand blues, solar ambers, semantic statuses
│   ├── typography.ts        # Type scale with proportional line-heights & tabular-nums
│   ├── spacing.ts           # 4-point spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
│   ├── radii.ts             # Shape scale (xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999)
│   ├── shadows.ts           # Platform-normalized iOS shadow & Android elevation pairs
│   ├── iconography.ts       # Standard icon size & stroke tokens
│   └── index.ts             # Unified Theme object & ThemeContext
├── atoms/
│   ├── Text.tsx             # Theme-aware text with dynamic font scaling & tabular variants
│   ├── Button.tsx           # Multi-state interactive button (default, pressed, focused, disabled, loading)
│   ├── Badge.tsx            # Semantic status and stage badge
│   ├── Icon.tsx             # Bounded accessible icon container
│   ├── Input.tsx            # Form input with focus border, inline error text, prefix/suffix icons
│   ├── Skeleton.tsx         # Base pulsing animation loader
│   └── Divider.tsx          # 1px border divider with theme awareness
├── molecules/
│   ├── SearchBar.tsx        # Debounced search input with clear trigger
│   ├── KpiCard.tsx          # Metric display with tabular numeral currency, label, and trend
│   ├── StatusPill.tsx       # MSEDCL/DISCOM online/offline sync status pill
│   ├── FormField.tsx        # Label + Input + Error + Helper container
│   ├── DatePickerField.tsx  # Cross-platform native date selection field
│   ├── EmptyState.tsx       # Illustration + Title + Subtitle + Primary CTA
│   └── Skeletons/           # Pre-composed loading skeletons (CardSkeleton, ListSkeleton)
├── organisms/
│   ├── Header.tsx           # Home, Main, and Detail headers using useSafeAreaInsets
│   ├── ModalHeader.tsx      # Standard sheet header with drag handle, title, and close
│   ├── WorkflowStepper.tsx  # Horizontal connected EPC stage progress indicator
│   ├── OfflineBanner.tsx    # Sticky offline/reconnecting status banner
│   ├── UnsavedModal.tsx     # Guard dialog for protecting dirty form states
│   └── ConfirmDialog.tsx    # Accessible confirmation dialog
└── templates/
    ├── ScreenContainer.tsx  # Master screen wrapper (Safe areas, keyboard avoiding, scroll)
    └── ModalContainer.tsx   # Gesture-enabled modal sheet container
```

---

## 7. Immediate Actionable Recommendations for Refactoring

1. **Delete Dead & Redundant Code**:
   - Remove `ProjectsScreen.tsx` and consolidate all project workflows into `FieldProjectsScreen.tsx`.
   - Remove `LeadsScreen.tsx` and remove its route from `RootNavigator.tsx`, unifying CRM entirely within `PipelineScreen.tsx`.
2. **Decompose `ModulesScreen.tsx`**:
   - Extract the 9 embedded sub-modules into dedicated screen files under `/src/screens/` (`SurveysScreen.tsx`, `SubsidyScreen.tsx`, `DiscomScreen.tsx`, `InventoryScreen.tsx`, `AmcScreen.tsx`, `SuperAdminScreen.tsx`).
3. **Form Ergonomics Upgrade**:
   - Wrap all modals (`LeadCaptureModal`, `CustomerOnboardingModal`, `QuotationBuilderModal`, `CreateInvoiceModal`) with `KeyboardAvoidingView` configured properly for Android (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`).
   - Add dirty state tracking (`isDirty`) and unsaved change confirmation alerts before dismissing modals.
   - Replace raw text inputs with `<Input>` from design system.
4. **Purge Fake/Fallback Data**:
   - Remove hardcoded prospect arrays from `DashboardScreen.tsx` and `FieldProfileScreen.tsx`.
   - Implement graceful empty states using `<EmptyState>` when live queries return 0 items.
5. **Loading Skeletons Everywhere**:
   - Replace centered spinners with structured `<CardSkeleton>` and `<ListSkeleton>` loaders during initial queries.
6. **Token Harmonization**:
   - Replace all hardcoded hex strings across the 18 active files with tokens from `src/theme/`.
   - Add dark theme support and tabular numerals for all financial figures.

---
*Report produced by Explorer 2 (Screen & UI Researcher) — Teamwork Phase 1 Discovery.*
