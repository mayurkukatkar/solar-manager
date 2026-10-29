# WhereReady Solar OS — Implementation Roadmap & Module Progress Tracker

**Document Status**: Authoritative Baseline  
**Date**: 2026-10-29  
**Version**: 1.0.0  
**Scope**: Dependency-aware batch implementation roadmap, milestone execution phases (M1–M6), risk mitigations, and module progress tracker across WhereReady Solar OS.

---

## 1. Roadmap Architecture & Execution Strategy

To ensure non-breaking, robust, and verifiable progress across the codebase, the platform overhaul is organized into six dependency-aware milestones:

```
[M1: Documentation Baseline & Specs] ──▶ Authoritative audit, inventory & interface specs
          │
          ├─────────────────────────────────────────────────┐
          ▼                                                 ▼
[M2: Design System & Shared UI]                   [M3: Security & Financial Hardening]
Shared primitives, tokens, 404 fixes               Child isolation, JWT fix, GST precision
          │                                                 │
          └───────────────────────┬─────────────────────────┘
                                  ▼
[M4: Commercial & Operations Workflows] ──▶ Quotation-Project, DISCOM gating, Subsidy funnel
                                  │
                                  ▼
[M5: Field Operations, Inventory & Mobile] ──▶ PO auto-stock, barcode QA, mobile parity
                                  │
                                  ▼
[M6: Cross-Module E2E & Final Verification] ──▶ Full lifecycle testing, regression sign-off
```

### Dependency Rules:
1. **M1 is the prerequisite for all milestones**: Provides baseline contracts and specifications.
2. **M2 and M3 can execute in parallel or sequentially**: M2 focuses exclusively on frontend presentation tokens, shared UI primitives (`web-client/src/components/ui`), and navigation; M3 focuses on backend security middleware, database tenant queries, and calculator math.
3. **M4 depends on M2 and M3**: Module workflows (Quotation wizard, Project detail, DISCOM gating) consume the shared UI primitives from M2 and rely on the secured API contracts from M3.
4. **M5 depends on M3 and M4**: Field operations (mobile barcode scanner, PO receiving) interface with secured project and inventory endpoints.
5. **M6 is the final integration gate**: Runs full end-to-end user journeys and automated test suites across all packages.

---

## 2. Milestone Execution Specifications

### Milestone M1: Documentation Baseline & Architecture Specifications
- **Objective**: Establish authoritative documentation, audit all 68 Prisma models, 26 routes, 58 frontend pages, mobile tools, security vulnerabilities, and test baselines.
- **Assigned Owner**: Worker M1 (Documentation & Architecture Specialist)
- **Dependencies**: None
- **Key Deliverables**:
  - `docs/product-audit.md`: Deep architectural, security, and financial audit.
  - `docs/module-inventory.md`: Complete module and page inventory.
  - `docs/architecture-and-dependencies.md`: Topology, package manifests, and interface contracts.
  - `docs/implementation-roadmap.md`: Dependency-aware milestone execution plan and progress tracker.
  - `docs/quality-and-regression-report.md`: Test baseline, execution commands, and verification protocols.
  - `PROJECT.md`: Master project specification at repository root.
- **Success Criteria**: All 6 documentation artifacts authored with high domain accuracy and zero unverified claims.

---

### Milestone M2: Design System & Shared UI Components Foundation
- **Objective**: Establish a standardized UI primitive component library, eliminate inline component duplication, standardize WhereReady branding tokens, resolve 404 dead links, replace native `alert()` calls with toasts, and ensure mobile viewport responsiveness (320px–1920px).
- **Assigned Owner**: Worker M2 (Design Systems & Enterprise UI Engineer)
- **Dependencies**: M1
- **Scope & Files to Modify**:
  - `web-client/src/components/ui/Button.tsx`: Accessible button with variants, sizes, loading state.
  - `web-client/src/components/ui/Input.tsx` & `Select.tsx`: Standardized inputs with labels and error states.
  - `web-client/src/components/ui/Modal.tsx`: Accessible dialog wrapper with backdrop blur and escape dismissal.
  - `web-client/src/components/ui/Table.tsx`: Tabular primitive with empty and skeleton loading states.
  - `web-client/src/components/ui/Badge.tsx`: Semantic status tags (`success`, `warning`, `danger`, `info`).
  - `web-client/src/components/ui/Card.tsx`: Standard container card with header, body, and footer.
  - `web-client/src/components/ui/Toast.tsx`: Toast provider context replacing browser `alert()`.
  - `web-client/src/app/globals.css`: Color tokens and typography refinement.
  - Fix 404 dead links: `/tenant/installation/schedule`, `/calendar`, `/checklists`, `/tenant/inventory/products/new`, `/tenant/quotations/new`, `/super-admin/security`.
- **Success Criteria**: UI primitives compile cleanly, zero native `alert()` dialogs in audited pages, responsive form modals render cleanly on 320px viewport without clipping.

---

### Milestone M3: Security, Multi-Tenancy & Financial Precision Hardening
- **Objective**: Resolve critical P0 multi-tenant isolation vulnerabilities on child entities, normalize JWT `req.user.id`, protect unauthenticated OCR endpoints, apply RBAC route middleware, and fix trade discount GST arithmetic in calculators.
- **Assigned Owner**: Worker M3 (Application Security & Backend Engineer)
- **Dependencies**: M1
- **Scope & Files to Modify**:
  - `backend/middleware/auth.js`: Normalize `req.user = { id: payload.userId, userId: payload.userId, ...payload }`.
  - `backend/routes/tenant/crm.js`: Enforce `where: { id, project: { tenantId: req.user.tenantId } }` on `ProjectTask`, `ProjectMilestone`, and `ProjectMaterialRequirement` update/delete operations.
  - `backend/routes/tenant/finance.js`: Enforce ticket tenant ownership before creating `ServiceVisit`.
  - `backend/routes/tenant/ocr.js`: Attach `requireTenantAuth` and rate limiting to `/scan-bill` and `/fetch-consumer`.
  - `backend/routes/tenant/*.js`: Apply `requirePermission` across key operational routes for granular RBAC.
  - `backend/services/solarCalculator.js` & `web-client/src/services/solarCalculator.ts`: Proportionally reduce taxable item base before tax computation when `overallDiscount` is applied; reconcile milestone rounding differences to ensure exact equality with `grandTotal`.
- **Success Criteria**: Child entity cross-tenant mutations blocked with 404/403; `req.user.id` correctly populated in audit logs; OCR routes require bearer tokens; GST discount arithmetic matches Indian CGST Act rules.

---

### Milestone M4: Commercial & Operations Module Workflows
- **Objective**: Eliminate hardcoded mock fallbacks and multi-tenant leaks, implement robust Quotation-to-Project conversion, enforce DISCOM 5-stage gating state machine, and optimize PM Surya Ghar national subsidy portal workflows.
- **Assigned Owner**: Worker M4 (Full-Stack Operations & Domain Specialist)
- **Dependencies**: M2, M3
- **Scope & Files to Modify**:
  - `web-client/src/app/tenant/projects/[id]/page.tsx`: Remove hardcoded Ekvarta/Thakre customer and vendor fallback strings; render authentic empty states or profile completion prompts.
  - `web-client/src/app/tenant/dashboard/page.tsx`: Remove fallback mock datasets (`fallbackHorizonDataMap`, `fallbackSegmentationData`); render authentic empty state cards.
  - `backend/routes/tenant/quotations.js` & `crm.js`: Validate Quotation-to-Project conversion with BOM generation and 4-milestone invoice provisioning.
  - `backend/routes/tenant/discom.js`: Validate 5-stage prerequisite document gating.
  - `backend/routes/tenant/subsidy.js`: Validate PM Surya Ghar smart parser and DBT bank account validation.
- **Success Criteria**: Zero hardcoded vendor/customer identities in generated documents; dashboard renders authentic data; statutory gating transitions reject requests missing prerequisite documents.

---

### Milestone M5: Field Operations, Inventory & Mobile Parity
- **Objective**: Automate PO receiving warehouse stock increment, verify mobile 2D barcode scanner and electrical QA sign-off, fix mobile PDF template parity test failure, and introduce touch-friendly mobile controls for Kanban tasks.
- **Assigned Owner**: Worker M5 (Mobile & Field Engineering Specialist)
- **Dependencies**: M3, M4
- **Scope & Files to Modify**:
  - `backend/routes/tenant/procurement.js`: Automate warehouse `StockBalance` and `StockLedger` increments when PO status changes to `RECEIVED`.
  - `mobile-app/src/services/pdfService.ts`: Add missing `'PM Surya Ghar Muft Bijli Yojana'` heading to satisfy `backend/test/unifiedTemplateParity.test.js`.
  - `mobile-app/src/screens/operations/BarcodeScannerModal.tsx`: Verify physical 2D barcode deduplication and serial commitment.
  - `mobile-app/src/screens/operations/InstallationQAModal.tsx`: Verify earthing (< 5.0Ω) and anti-islanding (< 2.0s) safety validation.
  - `web-client/src/app/tenant/tasks/page.tsx`: Add mobile tap-to-move status selector alongside desktop HTML5 drag-and-drop.
- **Success Criteria**: Backend `unifiedTemplateParity.test.js` passes cleanly; PO receipt increments stock ledger; mobile perspective suite passes 23/23 tests.

---

### Milestone M6: Cross-Module E2E Validation & Regression Sign-Off
- **Objective**: Execute end-to-end validation of the complete solar business journey (Lead -> Survey -> Quotation -> Project -> Procurement -> Installation -> Invoicing -> Subsidy -> Service), verify 100% test pass rates across all test suites, and deliver the final evidence-based completion report.
- **Assigned Owner**: Worker M6 (Lead Integrator & QA Automation Engineer)
- **Dependencies**: M4, M5
- **Scope & Verification**:
  - Run `node --test "backend/test/*.test.js"` -> 100% pass (15/15 tests).
  - Run `node mobile-app/test-perspectives.js` -> 100% pass (23/23 tests).
  - Run `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` -> 0 errors.
  - Run `node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app/tsconfig.json` -> 0 errors.
  - Validate multi-tenant isolation across all endpoints.
  - Author final handoff completion report with complete metrics.
- **Success Criteria**: Zero regressions; all automated test commands pass; all acceptance criteria satisfied.

---

## 3. Discovered Modules Progress Tracker

| Module Name | Component / Subsystem | Assigned Milestone & Owner | Implementation Status | Planned / Implemented Changes | Verified Test Outcomes | Documented Blockers |
|---|---|---|---|---|---|---|
| **Documentation Baseline** | Product audit, inventory, architecture, roadmap, quality report | M1 (Worker M1) | **COMPLETED** | Authored all 6 authoritative baseline specifications | Inspection verified | None |
| **Design System & UI** | Shared primitives (`components/ui`) | M2 (Worker M2) | **PLANNED** | Centralize `Button`, `Input`, `Modal`, `Table`, `Badge`, `Card`, `Toast` | To be tested in M2 | None |
| **Navigation & Links** | Tenant & Super-Admin layout routing | M2 (Worker M2) | **PLANNED** | Fix 7 dead links (installation schedule, inventory products new, etc.) | To be tested in M2 | None |
| **Mobile Responsiveness** | Responsive form grids (320px–480px) | M2 (Worker M2) | **PLANNED** | Add `grid-cols-1 sm:grid-cols-2` across modals; replace `alert()` | To be tested in M2 | None |
| **Multi-Tenancy Hardening** | Child entity mutation filters | M3 (Worker M3) | **PLANNED** | Enforce `project: { tenantId }` on tasks, milestones, materials | To be tested in M3 | None |
| **Authentication & JWT** | User identity normalization | M3 (Worker M3) | **PLANNED** | Normalize `req.user.id = payload.userId` in auth middleware | To be tested in M3 | None |
| **API Route Security** | OCR public route protection | M3 (Worker M3) | **PLANNED** | Attach `requireTenantAuth` and rate limiting to `/api/tenant/ocr/*` | To be tested in M3 | None |
| **Granular RBAC** | Sub-admin permission enforcement | M3 (Worker M3) | **PLANNED** | Apply `requirePermission` across tenant operational routes | To be tested in M3 | None |
| **Financial Engine** | GST trade discount math & milestones | M3 (Worker M3) | **PLANNED** | Proportionally adjust taxable base for overall discount; reconcile milestones | `solarCalculator.test.js` | None |
| **CRM & Leads** | Lead capture, Kanban pipeline, sizing | M4 (Worker M4) | **OPERATIONAL** | Prevent duplicate project conversion; wire toast feedback | Discovery verified | None |
| **Customer Master** | Client 360 dossiers & KYC documents | M4 (Worker M4) | **OPERATIONAL** | Maintain unified contact history; link projects and invoices | Discovery verified | None |
| **Site Surveys** | Rooftop audit, shading & feasibility | M4 (Worker M4) | **OPERATIONAL** | Consolidate shadowed routes; 1-click quote conversion | Discovery verified | None |
| **Quotations Engine** | 60-second wizard, composite GST (13.8%) | M4 (Worker M4) | **OPERATIONAL** | Apply fixed discount GST math; eliminate hardcoded leaks | `quotationsApi.test.js` | None |
| **EPC Projects** | Project master, stage history, BOM | M4 (Worker M4) | **OPERATIONAL** | Remove hardcoded Ekvarta/Thakre leaks in DISCOM form generator | Discovery verified | None |
| **DISCOM Statutory** | 5-stage prerequisite gating state machine | M4 (Worker M4) | **OPERATIONAL** | Enforce document proof check at Feasibility, CEIG, Meter, Net-Meter | Discovery verified | None |
| **PM Surya Ghar Subsidy** | 7-stage national portal studio & DBT | M4 (Worker M4) | **OPERATIONAL** | Smart parse regex, DCR module serials, bank account verification | Discovery verified | None |
| **Inventory & Warehouse** | Multi-warehouse stock ledger & serials | M5 (Worker M5) | **OPERATIONAL** | Link material dispatch to project BOM; add product modal | Discovery verified | None |
| **Procurement & PO** | Supplier purchase orders & auto-stock | M5 (Worker M5) | **OPERATIONAL** | Automate warehouse inventory stock increment upon PO receipt | Discovery verified | None |
| **Field Installation** | On-site work orders, checklists & QA | M5 (Worker M5) | **OPERATIONAL** | Connect schedule/calendar routes; mobile touch status controls | Discovery verified | None |
| **Mobile Hardware Tools** | 2D barcode scanner & electrical QA | M5 (Worker M5) | **OPERATIONAL** | Scans PV module serials; tests earth resistance (<5Ω) & trip (<2s) | `test-perspectives.js` (23/23) | None |
| **Mobile Template Parity** | Statutory PDF document parity | M5 (Worker M5) | **PLANNED** | Add missing `'PM Surya Ghar Muft Bijli Yojana'` heading in `pdfService.ts` | Parity test currently fails | Fix scoped to M5 |
| **Finance & Invoicing** | 4-milestone billing (20/60/15/5%) & loans | M5 (Worker M5) | **OPERATIONAL** | Milestone payment receipts; 13.8% composite solar GST invoicing | Discovery verified | None |
| **Service & Warranty** | Support tickets & AMC contracts | M5 (Worker M5) | **OPERATIONAL** | Post-commissioning tickets, technician visits, preventive AMC | Discovery verified | None |
| **Super-Admin Platform** | Multi-tenant governance & suspension | M6 (Worker M6) | **OPERATIONAL** | Instant account suspension; tenant registry; plan limits | Discovery verified | None |
| **End-to-End Validation** | Full Lead-to-Service solar lifecycle | M6 (Worker M6) | **PLANNED** | Automated integration tests across all packages; zero regression report | Final test suite | Depends on M4/M5 |

---

## 4. Execution Safeguards & Integrity Mandates

In strict adherence to project integrity standards:
1. **No Destructive Database Changes**: Under no circumstances will destructive database migrations (`drop table`, `drop column`) or unmanaged `prisma db push` commands be run against live databases.
2. **Local Development Isolation**: All testing and execution must occur against local development environments or mock databases. No connection to live external databases is permitted.
3. **No Secret Exposure**: API keys, JWT secrets, and credentials must remain in `.env` files and never be hardcoded into source files or documentation artifacts.
4. **Authentic Implementations Only**: Dummy implementations, hardcoded test strings, or fake mockups are strictly prohibited. Every milestone deliverable must maintain real state and real business logic.
5. **Continuous Verification**: After every batch implementation, relevant build and test commands must be executed and recorded in the handoff report.

---

*This implementation roadmap serves as the authoritative operational plan for WhereReady Solar OS development.*
