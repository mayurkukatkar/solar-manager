## 2026-10-30T09:32:57Z
You are Worker M3 (Mobile Full-Stack Implementation Specialist) for Milestone M3: End-to-End Module, Screen & Workflow Transformation.

## Working Directory
`.agents/teamwork/worker_m3/`

## Context & Inputs
1. Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory user intent).
2. Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
3. Read the 3 verified Explorer Blueprints:
   - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m3_1\analysis.md` (ModulesScreen decomposition, SessionExpiredModal, FieldProfile live context & real draft sync)
   - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m3_2\analysis.md` (Pipeline 7 stages, LeadCaptureModal keyboard avoiding & dirty guard, QuickQuote load sizing, QuotationBuilder 13.8% composite GST & BOM, CustomerOnboarding 4-step wizard)
   - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m3_3\analysis.md` (FieldProjects 7 stages & milestone calculation, DiscomDocs 7 statutory templates & 115mm margin, OperationsScreen dispatch, InstallationQAModal CEA thresholds & dirty guard, BarcodeScanner continuous mode & torch, FinanceScreen 13.8% composite GST & milestone invoicing)

## Exclusive File Ownership
You exclusively own and will modify or create the following files:
- `mobile-app/src/screens/modules/ModulesScreen.tsx`
- `mobile-app/src/screens/modules/submodules/` (create `QuotationsModule.tsx`, `SurveysModule.tsx`, `SubsidiesModule.tsx`, `FinancingModule.tsx`, `DiscomModule.tsx`, `InvoicingModule.tsx`, `ProcurementModule.tsx`, `AmcModule.tsx`, `SuperAdminModule.tsx`, `index.ts`)
- `mobile-app/src/screens/profile/FieldProfileScreen.tsx`
- `mobile-app/src/components/SessionExpiredModal.tsx` (create)
- `mobile-app/src/components/AccountSuspendedModal.tsx`
- `mobile-app/src/navigation/RootNavigator.tsx` (wire SessionExpiredModal)
- `mobile-app/src/screens/crm/PipelineScreen.tsx`
- `mobile-app/src/screens/crm/LeadCaptureModal.tsx`
- `mobile-app/src/screens/crm/QuotationBuilderModal.tsx`
- `mobile-app/src/screens/crm/CustomerOnboardingModal.tsx`
- `mobile-app/src/screens/crm/QuickQuoteScreen.tsx`
- `mobile-app/src/screens/projects/FieldProjectsScreen.tsx`
- `mobile-app/src/screens/projects/ProjectDossierModal.tsx`
- `mobile-app/src/screens/projects/DiscomDocsModal.tsx`
- `mobile-app/src/screens/operations/OperationsScreen.tsx`
- `mobile-app/src/screens/operations/InstallationQAModal.tsx`
- `mobile-app/src/screens/operations/BarcodeScannerModal.tsx`
- `mobile-app/src/screens/finance/FinanceScreen.tsx`
- `mobile-app/src/screens/finance/CreateInvoiceModal.tsx`
- `mobile-app/src/screens/finance/InvoicePdfModal.tsx`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Implementation Tasks (Follow Blueprints Faithfully)
1. **ModulesScreen Decomposition**:
   - Extract the 9 inline sub-modules from `ModulesScreen.tsx` into standalone modular components in `mobile-app/src/screens/modules/submodules/`:
     - `QuotationsModule.tsx`, `SurveysModule.tsx`, `SubsidiesModule.tsx`, `FinancingModule.tsx`, `DiscomModule.tsx`, `InvoicingModule.tsx`, `ProcurementModule.tsx`, `AmcModule.tsx`, `SuperAdminModule.tsx`.
     - Create `submodules/index.ts` barrel export.
   - Refactor `ModulesScreen.tsx` into a lightweight tile grid hub (~180 lines) delegating to the submodules, filtering tiles using `hasPermission`.
2. **Session Security & Profile**:
   - Create `mobile-app/src/components/SessionExpiredModal.tsx` (non-dismissible modal on `sessionExpired === true`).
   - Harden `AccountSuspendedModal.tsx` with non-dismissible hardware back handling (`onRequestClose={() => {}}`).
   - Wire `SessionExpiredModal` in `RootNavigator.tsx`.
   - In `FieldProfileScreen.tsx`: Strip simulated `setTimeout` delays and hardcoded radar metrics (`₹34.8 Lakhs`, etc.). Wire real data from `financeApi.getStats()`, `authApi.getMe()`, real draft count from `SafeStorage`/`offlineSyncService`, active permissions badges, and statutory links.
3. **CRM & Pipeline**:
   - `PipelineScreen.tsx`: 7 canonical filter chips (`NEW`, `CONTACTED`, `SITE_SURVEY`, `QUOTATION_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ALL`), 48x48 min touch targets, `SkeletonLoader.Card`, `EmptyState`, virtualized `FlatList`.
   - `LeadCaptureModal.tsx`: Wrap with `KeyboardAvoidingContainer`, attach `isDirty` protection, 6-digit Indian PIN regex (`/^[1-9][0-9]{5}$/`), native phone keyboards, lead source attribution selector.
   - `QuickQuoteScreen.tsx`: Add Sanctioned Load input in Step 1, DISCOM capacity warning, tiered benchmark pricing, ALMM TopCon/Bifacial module database.
   - `QuotationBuilderModal.tsx`: Itemized BOM breakdown (Modules, Inverter, Structure, BOS, Installation), statutory 13.8% composite solar GST calculation (70% @ 12% + 30% @ 18%), `KeyboardAvoidingContainer`, `isDirty` protection, WhatsApp proposal pitch generator.
   - `CustomerOnboardingModal.tsx`: 4-step wizard stepper (Personal Details -> Site Feasibility -> KYC Identity -> DISCOM Consumer & DBT Bank Account), preserving compulsory DISCOM consumer number validation (Perspective 3), PAN/Aadhaar/IFSC validation, `KeyboardAvoidingContainer`, `useDirtyFormWarning`.
4. **Field Projects & Operations**:
   - `FieldProjectsScreen.tsx`: 7 canonical stage filter chips, dynamic milestone calculation, stage advancement modal with prerequisite validation.
   - `ProjectDossierModal.tsx`: Milestone progress checklist, stage gating.
   - `DiscomDocsModal.tsx`: 7 statutory templates intact with 115mm treasury stamp margin toggle.
   - `OperationsScreen.tsx`: Daily dispatch schedule, technician assignment, geo-tagged check-ins.
   - `InstallationQAModal.tsx`: CEA safety thresholds (<5.0Ω earth pit, <2.0s trip, >1.0MΩ insulation resistance), `isDirty` unsaved change protection, field error helpers.
   - `BarcodeScannerModal.tsx`: Continuous scanning mode, module serial deduplication, flashlight toggle (`enableTorch`).
5. **Finance & Billing**:
   - `FinanceScreen.tsx`: Milestone breakdown (20/60/15/5%), statutory 13.8% composite solar GST, 3-tier overdue aging (<15d, 15-30d, >30d), WhatsApp payment reminders.
   - `CreateInvoiceModal.tsx`: Milestone presets, composite GST calculation.
   - `InvoicePdfModal.tsx`: Preview and share compliant invoice PDF with GST breakdown.

## Verification Requirements
Execute commands via cmd.exe / node:
1. `cmd /c "cd mobile-app && npx tsc --noEmit"` -> Must pass with 0 errors!
2. `node mobile-app/test-perspectives.js` -> 23 / 23 tests MUST pass (100% success)!
3. `node mobile-app/test-e2e.js` -> 184 / 184 tests MUST pass (100% success)!

## 2026-10-30T09:54:17Z
**Context**: Milestone M3 Implementation
**Content**: Heartbeat check on Milestone M3 progress. Submodules under mobile-app/src/screens/modules/submodules/ and SessionExpiredModal.tsx have been verified.
**Action**: Please report your current progress across Tasks 3, 4, 5 and estimated completion time for handoff.md.
