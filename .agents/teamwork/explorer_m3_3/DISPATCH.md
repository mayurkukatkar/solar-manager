## 2026-10-30T09:22:39Z
You are Explorer M3-3 (Projects, Field Operations & Finance Explorer) for Milestone M3: End-to-End Module, Screen & Workflow Transformation.

## Working Directory
`.agents/teamwork/explorer_m3_3/`

## Context & Inputs
1. Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory user intent).
2. Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
3. Inspect:
   - `mobile-app/src/screens/projects/FieldProjectsScreen.tsx`
   - `mobile-app/src/screens/projects/ProjectDossierModal.tsx`
   - `mobile-app/src/screens/projects/DiscomDocsModal.tsx`
   - `mobile-app/src/screens/operations/OperationsScreen.tsx`
   - `mobile-app/src/screens/operations/InstallationQAModal.tsx`
   - `mobile-app/src/screens/operations/BarcodeScannerModal.tsx`
   - `mobile-app/src/screens/finance/FinanceScreen.tsx`
   - `mobile-app/src/screens/finance/CreateInvoiceModal.tsx`
   - `mobile-app/src/screens/finance/InvoicePdfModal.tsx`

## Exploration Objectives
1. **Field Projects Execution Ledger (`FieldProjectsScreen.tsx`, `ProjectDossierModal.tsx`)**:
   - Canonical stage gating (7 stages: Survey, Engineering, Procurement, Installation, Net Metering, Inspection, Handover).
   - Milestone checklist progress, stage advancement validation, touch-friendly project cards, search & filter chips.
2. **DISCOM Statutory Documentation Studio (`DiscomDocsModal.tsx`)**:
   - Inspect 7 statutory templates:
     1. Annexure 1 (Application for Net Metering)
     2. Work Completion Report
     3. CEIG Electrical Safety Certificate
     4. Net Metering Agreement
     5. Equipment & Workmanship Guarantee
     6. Synchronization & Grid Connectivity Certificate
     7. Joint Inspection Report
   - 115mm treasury stamp paper margin toggle for Indian DISCOM statutory compliance.
   - Print, preview, and PDF sharing workflows.
3. **Field Operations & Electrical Commissioning QA (`OperationsScreen.tsx`, `InstallationQAModal.tsx`, `BarcodeScannerModal.tsx`)**:
   - `OperationsScreen.tsx`: Daily dispatch schedule, technician assignment, geo-tagged site check-ins.
   - `InstallationQAModal.tsx`: CEA safety thresholds (<5.0Ω earth pit resistance, <2.0s trip test, >1.0MΩ insulation resistance). Form validation, unsaved change warning.
   - `BarcodeScannerModal.tsx`: Continuous scanning mode, module serial deduplication, flashlight toggle, manual entry fallback.
4. **Finance, Billing & Composite Solar GST (`FinanceScreen.tsx`, `CreateInvoiceModal.tsx`, `InvoicePdfModal.tsx`)**:
   - Milestone Invoicing breakdown (20% advance, 60% procurement/dispatch, 15% installation, 5% commissioning).
   - Statutory 13.8% composite solar GST calculation (70% goods @ 12% + 30% services @ 18%).
   - Overdue aging indicators, payment recording modal, and WhatsApp invoice dispatch.
5. Produce a detailed technical blueprint with code changes, line references, and testing strategy for Worker M3.
