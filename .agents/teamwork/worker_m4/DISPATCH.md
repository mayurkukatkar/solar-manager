## 2026-10-29T12:40:30Z
You are Worker M4 (Commercial & Operations Worker) for the WhereReady Solar OS Master Audit, Redesign & Engineering Program.
Your working directory is: f:\Company Products\solar-manager\.agents\teamwork\worker_m4\

MANDATORY FIRST STEP: Read the following authoritative files:
1. f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
2. f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
3. f:\Company Products\solar-manager\docs\architecture-and-dependencies.md
4. f:\Company Products\solar-manager\docs\module-inventory.md

## Write Ownership Boundaries
You have EXCLUSIVE write ownership of:
1. web-client/src/app/tenant/projects/[id]/page.tsx
2. web-client/src/app/tenant/dashboard/page.tsx
3. backend/routes/tenant/crm.js
4. backend/routes/tenant/quotations.js
5. backend/test/m4CommercialOps.test.js
6. f:\Company Products\solar-manager\.agents\teamwork\worker_m4\*
Do NOT edit other files unless strictly necessary for importing shared utilities.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Milestone M4 Scope & Requirements

### 1. Eliminate Hardcoded Personal/Vendor Identity Leaks in Project Statutory Form Generator
- File: `web-client/src/app/tenant/projects/[id]/page.tsx:87-144`
- Remove all hardcoded personal/vendor strings:
  * "SHRI. SURENDRA RAMBHAU THAKRE"
  * "EKVARTA ENERGY SOLUTIONS"
  * GSTIN "27DTXPM6427E1Z3"
  * CA "410022120526"
  * Hardcoded module serial barcodes
- Replace them with real dynamic lookups from `project.customer?.name`, `project.customer?.address`, `project.customer?.consumerNumber`, `tenant.name`, `tenant.gstin`, `tenant.settings?.discomName`, and genuine project component serial numbers.
- If required organization or customer profile fields are missing, display a clean modal or warning banner prompting the user to complete their tenant organization settings / customer profile before generating statutory DISCOM forms.

### 2. Remove Synthetic Mock Fallback Datasets in Dashboard
- File: `web-client/src/app/tenant/dashboard/page.tsx:171-280`
- Remove synthetic fallback mock datasets (`fallbackHorizonDataMap`, `fallbackSegmentationData`, `fallbackLeadSourceData`, `fallbackInventoryRunway`, `fallbackSubsidyFunnel`).
- When backend API returns empty arrays or zero data, render genuine empty state components using the centralized `EmptyState` primitive (`@/components/ui/EmptyState`), with helpful calls to action (e.g., "Create your first lead to view conversion metrics").
- Never render fake charts or mock metrics that mislead the user.

### 3. Sequential 7-Stage Project State Machine
- File: `backend/routes/tenant/crm.js:1331` (`PATCH /api/tenant/projects/:id/stage`)
- Enforce strict sequential state machine transitions:
  `SURVEY_COMPLETED` → `STRUCTURE_APPROVED` → `MATERIAL_DISPATCHED` → `INSTALLATION_STARTED` → `TESTING_COMPLETED` → `NET_METER_APPLIED` → `COMMISSIONED`
- Reject illegal stage jumps (e.g., jumping from `STRUCTURE_APPROVED` straight to `COMMISSIONED`) with HTTP 400 (`Invalid stage transition: cannot jump from {currentStage} to {newStage}`).
- Ensure backward transitions (or re-checks) are handled cleanly if required, but random stage skipping is strictly blocked.

### 4. Idempotent 1-Click Quotation & Lead Conversions
- Files:
  * `backend/routes/tenant/crm.js:237` (`POST /api/tenant/leads/:id/convert`)
  * `backend/routes/tenant/quotations.js:856` (`POST /api/tenant/quotations/:id/convert`)
- Wrap conversions in `prisma.$transaction`.
- Check if target entity (Customer for Lead, Project for Quotation) already exists or if status is already `CONVERTED` / `ACCEPTED`. If already converted, return the existing record idempotently with HTTP 200 rather than creating duplicate records or throwing an error.

### 5. Automated Verification Test Suite
- Create `backend/test/m4CommercialOps.test.js` using Node.js built-in test runner (`node:test`, `node:assert`).
- Thoroughly test:
  * Strict 7-stage project transition gating (valid transition succeeds; illegal skip fails with 400).
  * Idempotent lead conversion (consecutive calls return same customer without duplicate DB rows).
  * Idempotent quotation conversion (consecutive calls return same project without duplicate DB rows).
  * Multi-tenant isolation preserved across these endpoints.

### 6. Build and Test Verification
Run the following commands using run_command:
1. `node --test backend/test/m4CommercialOps.test.js` (Must pass 100%)
2. `node --test backend/test/m3SecurityAndPrecision.test.js` (Must continue passing)
3. `node --test backend/test/e2e/*.test.js` (Must continue passing 69/69)
4. `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` (Must exit with code 0)
5. `npm.cmd --prefix web-client run build` (Must exit with code 0, all routes generated)

## Output & Handoff
Update `progress.md` in your working directory during execution.
When complete, write `handoff.md` in `f:\Company Products\solar-manager\.agents\teamwork\worker_m4\handoff.md` containing:
1. Observation (what was changed, verbatim before/after, file paths)
2. Logic Chain (technical rationale, design decisions)
3. Caveats (limitations, assumptions)
4. Conclusion (summary of results, status)
5. Verification Method (exact commands executed and verbatim output)
Then notify the orchestrator via send_message.
