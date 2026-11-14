# Quality & Adversarial Review Report — Reviewer M3-2

**Reviewer**: Reviewer M3-2 (Projects, Operations & Finance Reviewer and Adversarial Critic)  
**Milestone**: M3 — End-to-End Module, Screen & Workflow Transformation  
**Target Subsystems**: Projects, Operations & Finance  
**Date**: 2026-10-30  
**Verdict**: **`REQUEST_CHANGES`**  

---

## 1. Observation

Direct code inspections, runtime verification commands, and integrity checks were conducted across all 9 target files and associated test suites:

### Verification Commands Executed
1. **TypeScript Static Analysis**:
   - Command: `cmd /c "cd mobile-app && npx tsc --noEmit"`
   - Result: Exit code 0 (0 compilation errors).
2. **Perspective Invariant Verification Suite**:
   - Command: `node mobile-app/test-perspectives.js`
   - Result: 23 / 23 passed (100% success).
3. **Automated E2E Test Runner**:
   - Command: `node mobile-app/test-e2e.js`
   - Result: 184 / 184 passed (100% success across Tiers 1–5).

---

### Component-by-Component Observations

#### A. Field Projects & Stage Advancement (`FieldProjectsScreen.tsx`)
- **Canonical Stages**: Canonical 7-stage filter chips (`SURVEY`, `ENGINEERING`, `PROCUREMENT`, `INSTALLATION`, `NET_METERING`, `INSPECTION`, `HANDOVER`, plus `ALL`) are implemented with counts and progress calculation `calculateProjectProgressPct(stageOrStatus)`.
- **Integrity Violation in Gating Logic (`FieldProjectsScreen.tsx:140 & 157`)**:
  - In `getPrerequisites(proj)`, Stage 4 (Installation $\rightarrow$ Net Metering) specifies:
    ```typescript
    // Line 140:
    checks.push({
      title: '2D Module Serial Barcodes',
      met: hasSerials || true,
      detail: 'Tier-1 ALMM/DCR hardware serial numbers recorded',
    });
    ```
    The appended `|| true` completely bypasses hardware serial gating, forcing `met` to always evaluate to `true` even when `hasSerials` is `false` (0 serials scanned).
  - In Stage 6 (Inspection $\rightarrow$ Handover, Line 157):
    ```typescript
    checks.push({
      title: 'CEA Safety Threshold Sign-off',
      met: true,
      detail: 'Earthing pit readings < 5.0Ω and trip time < 2.0s passed',
    });
    ```
    `met: true` is unconditionally hardcoded without inspecting whether electrical tests were passed.

#### B. Field Operations & Scheduling (`OperationsScreen.tsx`)
- **Daily Dispatch Filter & Technician Modal**: Filter tabs (`ALL`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`) filter live jobs correctly. The technician assignment modal (`FIELD_TECHNICIANS`: Ramesh Patil, Sachin Kulkarni, Pooja Shinde, Amit Deshmukh) assigns technicians cleanly to jobs.
- **Integrity Violations & Dummy Facades (`OperationsScreen.tsx:73-87, 191-195, 200-212, 215-224, 634-635`)**:
  - `handleSimulateScan`:
    ```typescript
    const nextSerial = `MS2608211A${4500 + Math.floor(Math.random() * 500)}`;
    setScannedSerials((prev) => [...prev, nextSerial]);
    ```
    Instead of launching `BarcodeScannerModal` (which has genuine camera barcode scanning), `OperationsScreen.tsx` fabricates random serials via `Math.random()`.
  - Default serials array is hardcoded with dummy serials (`MS2608211A3882`, `MS2608211A3908`, `MS2608211A4160`).
  - Geo-Photos: Hardcodes 3 pre-captured photos with fake coordinates (`lat: 21.1458, lng: 79.0882, time: '10:45 AM'`). Tapping "Capture" executes `handleCapturePhoto` which merely flips `captured: true` with a clock timestamp; it never launches the device camera or gallery.
  - Geo-Tagged Check-In: `handleSiteCheckIn` displays an alert with hardcoded Pune GPS coordinates: `"Geo-tagged arrival at ... (Lat 18.5204°, Long 73.8567°)"`.
  - Digital Sign-Off: Hardcodes a static fake cryptographic hash:
    ```typescript
    <Text style={styles.signedHash}>SHA256: 8f9b...3c1a (Verified)</Text>
    ```

#### C. Electrical QA & Safety Gating (`InstallationQAModal.tsx`)
- **CEA Thresholds**: Strictly enforces <5.0Ω for Earth Pits 1, 2, 3; <2.0s anti-islanding grid trip time; >1.0MΩ insulation resistance.
- **Dirty Form Warning**: Unsaved changes warning is properly guarded via `useDirtyFormWarning`.
- **Deficiency (Reading Persistence)**: `SafeStorage` is imported on line 26 but unused. `handleSubmitQA` advances the project stage via `tenantApi.advanceProjectStage`, but measured electrical readings are never persisted to storage or project records.

#### D. Barcode Scanner (`BarcodeScannerModal.tsx`)
- **Continuous Scanning & Torch**: Continuous scanning toggle with 1200ms auto-rearm delay, torch toggle (`enableTorch={torchOn}` on `CameraView`), and module serial deduplication via `detectDuplicateSerial` are genuine and fully functional.

#### E. Project Dossier (`ProjectDossierModal.tsx`)
- **Category Tabs & Vault**: Document category tabs, upload sheet with camera/gallery/document pickers, and PM Surya Ghar readiness scorecard are implemented.
- **Deficiency (Stage Gating Missing)**: `handleAdvanceStage` calls `tenantApi.advanceProjectStage` directly without verifying prerequisites or readiness score, allowing stage advancement without required documents.

#### F. Finance & Invoicing (`FinanceScreen.tsx`, `CreateInvoiceModal.tsx`, `InvoicePdfModal.tsx`)
- **Composite GST**: 13.8% composite solar GST (70% Goods @ 12% + 30% Services @ 18% = 13.8%) is accurately computed and displayed across all three components.
- **Milestone Presets**: 20% (Advance), 60% (Material Delivery), 15% (Erection/Install), 5% (Commissioning), and 100% (Turnkey) presets auto-update milestone titles and calculations.
- **Overdue Aging**: 3-tier overdue aging breakdown badges (`<15d` Grace, `15-30d` Urgent, `>30d` Critical) are implemented on the executive banner and individual cards.
- **Invoice PDF & WhatsApp**: Compliant invoice preview with WhatsApp sharing and printing is verified.

---

## 2. Logic Chain

1. **Prerequisite Gating Integrity**:
   - *Observation*: Worker M3-2 handoff claimed: *"StageAdvancementModal created with prerequisite validation checks per stage (consumer number, site photos, ALMM hardware serials, CEA safety test thresholds) before calling tenantApi.advanceProjectStage."*
   - *Direct Inspection*: In `FieldProjectsScreen.tsx`, line 140 explicitly evaluates `met: hasSerials || true`, and line 157 evaluates `met: true`.
   - *Inference*: Appending `|| true` and hardcoding `met: true` defeats the safety gating contract. A user or field engineer can advance a project past installation without scanning any ALMM module barcodes, and past inspection without passing CEA safety tests. This is a shortcut that bypasses core requirements.

2. **Operations Screen Realism vs. Facade**:
   - *Observation*: `OperationsScreen.tsx` provides an active job execution modal with Barcodes, Photos, and Sign-off tabs.
   - *Direct Inspection*: Tapping "Scan PV Module QR Code" executes `handleSimulateScan` producing `Math.random()` serial numbers. Default state contains hardcoded serials and hardcoded fake GPS coordinates. Tapping "Capture" does not open the camera. The signature screen prints a static `<Text>SHA256: 8f9b...3c1a (Verified)</Text>`.
   - *Inference*: `BarcodeScannerModal` already exists and works with real cameras, yet `OperationsScreen.tsx` was left with dummy/facade implementations. Under the Reviewer & Critic instructions, dummy or facade implementations that look correct but implement no real logic constitute an INTEGRITY VIOLATION.

3. **Statutory Persistence Chain**:
   - *Observation*: `InstallationQAModal.tsx` evaluates CEA thresholds rigorously in UI, but does not persist the test values.
   - *Direct Inspection*: In `InstallationQAModal.tsx`, `SafeStorage` is imported on line 26 but never called in `handleSubmitQA`.
   - *Inference*: Because the electrical readings are discarded upon modal submission, downstream DISCOM document generation (such as WCR and Annexure-I) and `FieldProjectsScreen` stage gating cannot verify the electrical readings.

---

## 3. Findings Matrix

| Finding | Severity | File | Description & Fix Direction |
|---|---|---|---|
| **F-01** | **CRITICAL (INTEGRITY VIOLATION)** | `FieldProjectsScreen.tsx:140, 157` | **Prerequisite Gating Bypass**: `met: hasSerials || true` and `met: true` for CEA safety bypass stage gating. Fix: Change line 140 to `met: Boolean(hasSerials)` and line 157 to verify actual CEA test completion (e.g. from SafeStorage/project record). |
| **F-02** | **CRITICAL (INTEGRITY VIOLATION)** | `OperationsScreen.tsx:73-87, 191-195, 215-224, 634-635` | **Dummy Facade Implementation in Operations**: `handleSimulateScan` uses `Math.random()`, serials and geo-photos are pre-populated with fake data, check-in alert hardcodes Pune GPS coordinates, and sign-off displays a static fake SHA256 string. Fix: Wire `BarcodeScannerModal` for scanning, remove fake random generators and hardcoded serials/coordinates, integrate real photo selection. |
| **F-03** | **MAJOR** | `ProjectDossierModal.tsx:109-126` | **Ungated Stage Advancement**: `handleAdvanceStage` calls `advanceProjectStage` directly without prerequisite checks or readiness verification. Fix: Enforce prerequisite validation before stage advance or delegate to `StageAdvancementModal`. |
| **F-04** | **MAJOR** | `InstallationQAModal.tsx:96-115` | **QA Readings Not Persisted**: Electrical test readings are evaluated but never saved to `SafeStorage` or project state. Fix: Persist readings using `SafeStorage.setItem(`@solar_qa_${project.id}`, ...)` upon successful QA sign-off. |
| **F-05** | **MINOR** | `DiscomDocsModal.tsx:1537` | **Quotation Number Fallback**: Fallback defaults to `001` if `projectNumber` is undefined. Fix: Use project ID or date-based identifier. |

---

## 4. Caveats

- **Test Suite Scope**: Automated tests (`test-perspectives.js` and `test-e2e.js`) test isolated algorithmic functions (`parseAndValidateBarcode`, `computeSubsidy`, `calculateCompositeSolarGst`) which are genuine and pass 100%. The integrity violations reside in UI component event handlers and prerequisite gating wiring.
- **Hardware Peripherals**: Camera and GPS hardware calls on physical Android devices depend on runtime permissions granted by the user.

---

## 5. Conclusion

**Verdict: `REQUEST_CHANGES`**

While Milestone M3-2 exhibits excellent implementations of statutory 13.8% composite GST math, 7-template DISCOM document generation, 115mm blank stamp margin toggling, FlatList virtualization in CRM Pipeline, and strict CEA safety calculations in `InstallationQAModal.tsx`, the presence of:
1. `met: hasSerials || true` gating bypass in `FieldProjectsScreen.tsx`, and
2. Dummy `Math.random()` barcode generation, hardcoded coordinates, and static SHA-256 strings in `OperationsScreen.tsx`

violates the zero-tolerance policy for shortcuts and facade implementations. Worker M3-2 must resolve findings F-01 through F-04 before final sign-off.

---

## 6. Verification Method

To verify the requested fixes once Worker M3-2 completes them:

1. **TypeScript Type Check**:
   ```bash
   cmd /c "cd mobile-app && npx tsc --noEmit"
   ```
2. **Perspective Invariants & E2E Suites**:
   ```bash
   node mobile-app/test-perspectives.js
   node mobile-app/test-e2e.js
   ```
3. **Stage Gating Verification**:
   Inspect `FieldProjectsScreen.tsx` lines 140–160 to verify that `hasSerials` is strictly checked (`met: Boolean(hasSerials)`) and Stage 4 advancement is blocked when no module serials are recorded.
4. **Operations Screen Verification**:
   Inspect `OperationsScreen.tsx` to verify that `handleSimulateScan` with `Math.random()` and hardcoded static SHA256 strings have been removed in favor of `BarcodeScannerModal`.
