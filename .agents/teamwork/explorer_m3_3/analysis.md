# Comprehensive Technical Analysis & Blueprint: Projects, Field Operations & Finance (M3-3)

**Author**: Explorer M3-3 (Projects, Field Operations & Finance Explorer)  
**Target Milestone**: M3 (End-to-End Module, Screen & Workflow Transformation)  
**Date**: 2026-10-30  
**Scope**:
- Field Projects Execution Ledger (`FieldProjectsScreen.tsx`, `ProjectDossierModal.tsx`)
- DISCOM Statutory Documentation Studio (`DiscomDocsModal.tsx`)
- Field Operations & Electrical Commissioning QA (`OperationsScreen.tsx`, `InstallationQAModal.tsx`, `BarcodeScannerModal.tsx`)
- Finance, Billing & Composite Solar GST (`FinanceScreen.tsx`, `CreateInvoiceModal.tsx`, `InvoicePdfModal.tsx`)

---

## Executive Summary

This exploration provides a thorough technical blueprint across the 4 core domain modules in the WhereReady Solar OS mobile client. All 9 target files have been audited against statutory requirements, Indian DISCOM standards (MSEDCL/MERC 2019, CEA Regulations, PM Surya Ghar Muft Bijli Yojana), and design system tokens.

The codebase currently compiles strictly with 0 TypeScript errors (`tsc --noEmit`) and passes 100% of the 23-perspective automated test suite (`node mobile-app/test-perspectives.js`). This blueprint details specific gaps, architectural enhancements, exact line references, and precise code transformations for Worker M3.

---

## 1. Field Projects Execution Ledger (`FieldProjectsScreen.tsx`, `ProjectDossierModal.tsx`)

### 1.1 Architecture & Current Implementation Analysis
`FieldProjectsScreen.tsx` serves as the central command cockpit for live rooftop projects. Currently:
- **Filtering Gaps**: Lines 44-50 define only 4 coarse filter chips:
  ```typescript
  const PROJECT_STAGES = [
    { id: 'ALL', label: 'All Projects' },
    { id: 'PLANNING', label: 'Survey / Permits' },
    { id: 'DISCOM', label: 'DISCOM Liaison' },
    { id: 'INSTALLATION', label: 'Erection & QA' },
    { id: 'COMPLETED', label: 'Synchronized' },
  ];
  ```
  This collapses the 7 real-world EPC execution phases into broad categories, losing visibility into Engineering, Procurement, and Net Metering.
- **Stage Progression Display**: Lines 353-360 estimate progress with static hardcoded string approximations:
  ```typescript
  const progressPct =
    p.currentStage === 'Completed' || p.status === 'COMPLETED'
      ? '100%'
      : p.currentStage === 'Installation' || p.status === 'INSTALLATION'
      ? '75%'
      : p.currentStage === 'Design' || p.status === 'DISCOM'
      ? '45%'
      : '25%';
  ```
- **Missing Stage Gating Trigger**: Neither `FieldProjectsScreen.tsx` nor `ProjectDossierModal.tsx` provides an interactive stage advancement modal or gating validation check, despite `tenantApi.advanceProjectStage(projectId, stage, note)` existing in `api/endpoints.ts` (line 46).
- **Project Cards**: Cards provide direct micro-actions (Vault, Serials, QA, DISCOM, Call, WhatsApp), but lack clear milestone checklist indicators and touch-friendly stage advance action buttons.

### 1.2 Canonical 7-Stage Gating Specification
The canonical workflow must enforce strict sequential progression across the 7 stages:

| Stage # | Stage Key | Title | Mandatory Prerequisites & Artifacts | Gating Validation Rule |
|---|---|---|---|---|
| **1** | `SURVEY` | Site Survey & Feasibility | Shadow analysis, roof photos, meter location, sanctioned load vs proposed kWp | $\ge 1$ roof photo + valid consumer # |
| **2** | `ENGINEERING` | Engineering & Design | Single Line Diagram (SLD), structural design calculation, Tier-1 ALMM panel selection | Quotation approved + SLD uploaded |
| **3** | `PROCUREMENT` | Material Procurement | PO issued, BOM allocated, PV modules & inverter allocated in inventory | Material dispatch confirmation |
| **4** | `INSTALLATION` | Mechanical & Electrical Erection | Clamps torqued (12-14 Nm), UV DC conduit cabling, 2D module serials scanned | Serials count $\ge$ module quantity |
| **5** | `NET_METERING` | DISCOM Net Metering | Form A-1 submitted, Net Metering Agreement (Annexure 3), feasibility clearance | Application reference # recorded |
| **6** | `INSPECTION` | Electrical QA & CEIG Inspection | Earth pits $< 5.0\Omega$, anti-islanding trip $< 2.0\text{s}$, insulation $> 1.0\text{M}\Omega$ | 100% CEA safety thresholds passed |
| **7** | `HANDOVER` | Grid Sync & Commissioning | Bi-directional meter energized, WCR signed, 5-yr CMC guarantee, DBT claim | Joint inspection report + client sign-off |

### 1.3 Technical Blueprint for Worker M3
1. **Update `PROJECT_STAGES` in `FieldProjectsScreen.tsx`**:
   ```typescript
   export const CANONICAL_PROJECT_STAGES = [
     { id: 'ALL', label: 'All Projects', color: '#0f172a' },
     { id: 'SURVEY', label: '1. Survey', color: '#6366f1' },
     { id: 'ENGINEERING', label: '2. Engineering', color: '#8b5cf6' },
     { id: 'PROCUREMENT', label: '3. Procurement', color: '#ec4899' },
     { id: 'INSTALLATION', label: '4. Installation', color: '#2563eb' },
     { id: 'NET_METERING', label: '5. Net Metering', color: '#7c3aed' },
     { id: 'INSPECTION', label: '6. Inspection & QA', color: '#f59e0b' },
     { id: 'HANDOVER', label: '7. Handover & DBT', color: '#059669' },
   ];
   ```
2. **Dynamic Stage Index & Milestone Calculator**:
   Map any project's `currentStage` or `status` string to an integer index `[1..7]`, rendering dynamic progress:
   $$\text{Progress \%} = \text{round}\left(\frac{\text{Stage Index}}{7} \times 100\right)$$
3. **Stage Advancement Modal / Stepper in `ProjectDossierModal.tsx`**:
   - Add a "Stage Stepper" card at the top of the dossier modal.
   - For the current stage, show checklist of required items with green checkmarks or red warning pills.
   - When user taps "Advance to Next Stage":
     - Verify all prerequisites for current stage.
     - If incomplete, alert with specific missing artifacts.
     - If verified, call `tenantApi.advanceProjectStage(project.id, nextStageKey, note)`.
     - Refresh project state and trigger native haptic feedback.

---

## 2. DISCOM Statutory Documentation Studio (`DiscomDocsModal.tsx`)

### 2.1 Architecture & Current Implementation Analysis
`DiscomDocsModal.tsx` (3,563 lines) is an enterprise-grade document generator for Indian state electricity distribution utilities (MSEDCL / Mahavitaran, Tata Power, Adani Electricity, BESCOM, etc.).
- **Template Coverage**:
  Supports 7 standard statutory documents:
  1. `WCR_FULL`: Work Completion Report Pack (3-page dossier)
  2. `WCR`: WCR Page 1 (Work Completion Report & Technical Specs)
  3. `AnnexureI`: Annexure - I (Joint Commissioning & Synchronization Certificate)
  4. `DCR`: Annexure - A (DCR Domestic Content Declaration & Module Serials Table)
  5. `NetMetering`: Annexure – 3 (Statutory 6-Page MERC 2019 Net Metering Agreement)
  6. `ConsumerVendor`: Annexure 2 (PM Surya Ghar 3-Page Model Consumer-Vendor EPC Agreement)
  7. `StandardQuotation`: Official Standard 1-Page Quotation with Indian Rupee Words
- **Stamp Paper Margins**:
  - Implements the statutory ₹100 non-judicial stamp paper requirement in `services/pdfService.ts` (lines 1596-1645):
    - **Physical Stamp Mode (`includeStamp = false`)**: Inserts exactly **115mm blank margin** (`<div style="width: 100%; height: 115mm; border-bottom: 2px dashed #94a3b8; ...">`) with physical printer alignment guide.
    - **Digital Stamp Mode (`includeStamp = true`)**: Inserts high-resolution Maharashtra Treasury ₹100 stamp emblem.
  - Controls: Toggle available in both Studio Controls tab and Quick Switch bar in Live Preview tab.
- **Verification Lock & 8-Point Pipeline Audit**:
  Lines 243-326 enforce the 8-point statutory audit:
  1. Beneficiary Legal Name ($\ge 3$ chars)
  2. DISCOM Consumer Number ($\ge 6$ chars)
  3. Premises Address ($\ge 6$ chars)
  4. Sanctioned Load & Capacity ($> 0$)
  5. National Portal Ref No ($\ge 4$ chars)
  6. BOQ Specifications (Module make, wattage, count)
  7. Hardware Barcode Scans ($\ge$ module quantity)
  8. Vendor Legal Profile & GSTIN ($\ge 3$ chars + valid GSTIN)

### 2.2 Recommendations for Worker M3
1. **CEIG Electrical Safety Certificate Template**:
   Ensure `GUARANTEE` and `CEIG Safety Certificate` are easily selectable as top-level templates in the selector bar.
2. **Keyboard Ergonomics in Studio Controls**:
   Ensure `KeyboardAvoidingView` with `behavior="padding"` maintains full visibility of serial text inputs when virtual keyboard is active (reclaiming $\ge 270$ px vertical working space, complying with Perspective 10).
3. **Offline Document Caching**:
   Ensure generated PDFs are cached to `FileSystem.cacheDirectory` before dispatching to `expo-sharing` so sharing works seamlessly without internet.

---

## 3. Field Operations & Commissioning QA (`OperationsScreen.tsx`, `InstallationQAModal.tsx`, `BarcodeScannerModal.tsx`)

### 3.1 Operations Screen (`OperationsScreen.tsx`)
- **Current State**: Lists dispatched jobs with capacity, module/inverter brands, phone dialing, and Google Maps navigation. Contains sub-modal with checklist, barcode simulation, and 5-geo photos.
- **Gaps & Target Improvements for Worker M3**:
  1. **Technician Assignment**: Add technician selector/modal to assign jobs to specific field engineers.
  2. **Geo-Tagged Site Check-In**: Add a "Check In at Site" button that captures the device's latitude, longitude, and current timestamp, automatically advancing job status to `ON_SITE`.
  3. **Daily Schedule Grouping**: Group cards into "Today's Schedule", "In Progress", and "Completed".
  4. **Status Transitions**: Wire up full lifecycle: `SCHEDULED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `ON_SITE` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`.

### 3.2 Installation QA Modal (`InstallationQAModal.tsx`)
- **Safety Threshold Checks (CEA Regulations & IEEE 1547)**:
  Lines 71-77 implement strict mathematical threshold gates:
  - Inverter Earth Pit 1: $< 5.0\,\Omega$
  - Structure Earth Pit 2: $< 5.0\,\Omega$
  - Lightning Arrestor Earth Pit 3: $< 5.0\,\Omega$
  - Anti-Islanding Grid Trip Time: $< 2.0\,\text{s}$
  - Inverter Insulation Resistance: $> 1.0\,\text{M}\Omega$
  When any condition is breached, lines 258-274 display a prominent red safety violation alert and disable the advance button.
- **Gaps & Target Improvements for Worker M3**:
  1. **Unsaved Changes Warning**: Track dirty form state (`isDirty`). If the user modifies readings or checklist items and taps Close or Android hardware back, show confirmation dialog ("Discard unsaved electrical test readings?").
  2. **Field Level Validation**: Provide instant visual error hints below inputs if non-numeric or negative values are entered.
  3. **Local Offline Persistence**: Cache test readings in `SafeStorage` (`@solar_qa_${projectId}`) so test values are never lost if app backgrounds.

### 3.3 Barcode Scanner Modal (`BarcodeScannerModal.tsx`)
- **Current State**: Uses Expo Camera `CameraView` with back camera. Parses JSON, delimiter-separated, and raw barcodes. Validates DCR against ALMM certificates. Deduplicates against active session, inverter serial, and project records.
- **Gaps & Target Improvements for Worker M3**:
  1. **Continuous Scanning Mode**:
     Currently, every scan triggers `setIsScanning(false)` followed by a modal Alert dialog (`Alert.alert('Module Scanned', ...)`), forcing the installer to tap "Scan Next" for every single panel.
     **Worker Action**: Add a "Continuous Scan" toggle. When active, new valid barcodes are appended to `moduleSerials` immediately with a brief haptic vibration (via `expo-haptics`) and sound/toast, leaving the camera active for rapid serial capture.
  2. **Flashlight / Torch Toggle**:
     Underneath solar panel structures, rooftop lighting is often dim.
     **Worker Action**: Add state `const [torchOn, setTorchOn] = useState(false)` and pass `enableTorch={torchOn}` to `CameraView`. Add a torch icon button on the reticle overlay.
  3. **Target Progress Counter**:
     Display: `Scanned: X / Y Modules (Z% complete)`.

---

## 4. Finance, Billing & Composite Solar GST (`FinanceScreen.tsx`, `CreateInvoiceModal.tsx`, `InvoicePdfModal.tsx`)

### 4.1 Canonical Milestone Invoicing Breakdown
The Indian Solar EPC industry standard milestone billing follows a 4-stage schedule:

$$\text{Total Contract Amount} = 100\%$$

| Milestone # | Milestone Name | Share | Trigger Condition | Due Period |
|---|---|---|---|---|
| **1** | **Advance Booking & Design** | **20%** | Signing agreement, site survey, engineering layout | Immediate (0 days) |
| **2** | **Procurement & Material Delivery** | **60%** | PV modules, inverter, structure delivery at site | 10 days |
| **3** | **Structure & Installation** | **15%** | Mounting erection, electrical termination, CEA QA pass | 20 days |
| **4** | **Commissioning & Net Metering** | **5%** | Bi-directional meter installation, grid sync, DBT claim | 30 days |

### 4.2 Statutory 13.8% Composite Solar GST Mathematics
Under GST circulars for Solar EPC Turnkey contracts:
- 70% of gross contract value = Goods (taxable @ 12% GST)
- 30% of gross contract value = Services (taxable @ 18% GST)

$$\text{Effective GST Rate} = (0.70 \times 12\%) + (0.30 \times 18\%) = 8.4\% + 5.4\% = 13.8\%$$

For any gross amount $G$:
$$\text{Taxable Subtotal } (S) = \text{round}\left(\frac{G}{1.138}\right)$$
$$\text{Total GST } (T) = G - S$$
$$\text{CGST (6.9\%)} = \text{round}\left(\frac{T}{2}\right)$$
$$\text{SGST (6.9\%)} = T - \text{CGST}$$

**Example Verification**:
- For a 3.3 kW plant with gross cost $G = ₹1,91,400$:
  - Taxable Subtotal $S = \text{round}\left(\frac{191400}{1.138}\right) = ₹1,68,190$
  - Total GST $T = 191400 - 168190 = ₹23,210$
  - CGST (6.9%) = $₹11,605$
  - SGST (6.9%) = $₹11,605$
  - Sum = $168190 + 11605 + 11605 = ₹1,91,400$ (Exact mathematical balance)

### 4.3 Overdue Aging Indicators (`FinanceScreen.tsx`)
Currently, `FinanceScreen.tsx` shows overdue count and sum, but lacks aging bracket disclosure.
**Worker M3 Transformation**:
Implement 3-tier overdue aging breakdown buckets:
1. `Under 15 Days`: Amber badge (`#d97706`), "Grace period reminder"
2. `15 to 30 Days`: Orange badge (`#ea580c`), "Urgent follow-up"
3. `Over 30 Days`: Red badge (`#dc2626`), "Critical collection / Escalate"

### 4.4 Payment Recording & WhatsApp Dispatch
- **Payment Modal**: Fully functional (`recordPayment` API), supports UPI, NEFT, Cheque, and Cash.
- **WhatsApp Dispatch**:
  - `handleSendWhatsAppReminder` in `FinanceScreen.tsx` generates pre-filled WhatsApp reminder with invoice #, milestone title, total amount, and balance due.
  - `handleShareToWhatsApp` in `InvoicePdfModal.tsx` exports clean A4 PDF and triggers WhatsApp share sheet with customer phone pre-populated.

---

## 5. Implementation Roadmap for Worker M3

| Order | Target File | Planned Changes | Line References |
|---|---|---|---|
| **Step 1** | `FieldProjectsScreen.tsx` | Add 7-stage filter chips (`SURVEY` to `HANDOVER`), dynamic milestone progress calculator, stage advancement trigger | Lines 44-50, 158-190, 353-370 |
| **Step 2** | `ProjectDossierModal.tsx` | Integrate stage stepper tab, prerequisite validation, dirty form discard guard | Lines 48-55, 145-160, 345-385 |
| **Step 3** | `BarcodeScannerModal.tsx` | Add continuous scanning toggle switch and camera flashlight / torch button (`enableTorch`) | Lines 193-205, 260-310, 430-450 |
| **Step 4** | `InstallationQAModal.tsx` | Add `isDirty` unsaved changes warning, field error helpers, offline safe storage | Lines 40-70, 86-115, 118-126 |
| **Step 5** | `OperationsScreen.tsx` | Add technician assignment selector and geo-tagged site check-in timestamp action | Lines 38-50, 102-160, 306-340 |
| **Step 6** | `CreateInvoiceModal.tsx` | Set milestone presets to `20%`, `60%`, `15%`, `5%`; add "Generate All 4 Milestones" action | Lines 100-115, 255-270, 285-305 |
| **Step 7** | `FinanceScreen.tsx` | Add 3-tier aging buckets (<15d, 15-30d, >30d) and overdue aging badges on cards | Lines 58-68, 145-168, 530-560 |
