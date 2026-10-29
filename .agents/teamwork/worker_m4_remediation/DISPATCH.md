## 2026-10-29T13:52:36Z
You are Worker M4 Remediation (teamwork_worker) for the WhereReady Solar OS Master Audit, Redesign & Engineering Program.
Your working directory is: f:\Company Products\solar-manager\.agents\teamwork\worker_m4_remediation\

MANDATORY FIRST STEP: Read the following authoritative files:
1. f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
2. f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
3. f:\Company Products\solar-manager\.agents\teamwork\challenger_m4\handoff.md

## Context
Milestone M4 implementation was challenged by Challenger M4, who reported `REQUEST_CHANGES` due to 2 concurrency defects and remaining statutory identity leaks. You are tasked with remediating these issues completely.

## Write Ownership Boundaries
You have exclusive write ownership of:
1. `backend/routes/tenant/quotations.js`
2. `backend/routes/tenant/crm.js`
3. `web-client/src/components/pdf/MsedclFormsPDF.tsx`
4. `web-client/src/app/tenant/quotations/page.tsx`
5. `web-client/src/components/quotations/QuotationDetailModal.tsx`
6. `backend/test/m4AdversarialChallenges.test.js`
7. `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_remediation\*`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Remediation Tasks

### 1. Fix Concurrency Race Condition in Quotation Conversion (`backend/routes/tenant/quotations.js:856-1090`)
- **Bug**: 5 concurrent simultaneous requests (`Promise.all`) create 4 duplicate Project rows (`4 !== 1`) because `quotationId` lacks `@unique` and Read Committed transactions perform independent reads before inserting.
- **Fix**:
  * Implement an atomic check-and-lock mechanism. Before creating a project, perform an atomic conditional update:
    `const updateResult = await tx.quotation.updateMany({ where: { id, tenantId, isLocked: false }, data: { isLocked: true, status: 'ACCEPTED' } });`
  * If `updateResult.count === 0` (or `quotation.isLocked === true`), this quotation was already converted (or is currently being converted by a concurrent request). Immediately query `tx.project.findFirst({ where: { quotationId: id, tenantId } })`. If found, return it with HTTP 200.
  * If not yet found (the concurrent transaction is still committing), retry/poll briefly or use a mutex or return the quotation gracefully.
  * In the main `try/catch`, handle any duplicate key or race conditions gracefully by querying the created project and returning HTTP 200 rather than crashing or duplicating.

### 2. Fix Concurrency Failure in Lead Conversion (`backend/routes/tenant/crm.js:237-460`)
- **Bug**: 5 concurrent simultaneous requests trigger Prisma transaction cancellation (`P2028: Transaction not found`) and HTTP 500 crashes.
- **Fix**:
  * Set explicit transaction options: `prisma.$transaction(async (tx) => { ... }, { timeout: 30000, maxWait: 10000 })`.
  * Atomically lock/update lead status:
    `const updateResult = await tx.lead.updateMany({ where: { id, tenantId, status: { not: 'WON' } }, data: { status: 'WON' } });`
  * If `updateResult.count === 0`, the lead is already converted. Immediately query `prisma.project.findFirst({ where: { leadId: id, tenantId }, include: { customer: true } })` and return HTTP 200 with `{ customer: existing.customer, project: existing, message: 'Lead already converted' }`.
  * In the `catch (err)` block, if `err.code === 'P2028'` or concurrent transaction collision occurs, check if the project/customer already exists for this lead and return HTTP 200 gracefully instead of throwing 500.

### 3. Purge Remaining 13 Statutory Identity Leaks
- **File**: `web-client/src/components/pdf/MsedclFormsPDF.tsx`:
  * Remove all occurrences of:
    - `"SHRI. SURENDRA RAMBHAU THAKRE"`
    - `"SURENDRA RAMBHAU THAKRE"`
    - `"RAVI DODKUJI KAWALE"`
    - `"M/S EKVARTA ENERGY SOLUTIONS"`
    - `"EKVARTA ENERGY SOLUTIONS"`
    - `"410022120526"`
    - Hardcoded Adani serials array `["MS2608211A3882", "MS2608211A3908", ...]`
  * Replace with `(data.beneficiaryName || data.customerName || "").toUpperCase()` and `(data.vendorName || "").toUpperCase()`, `data.consumerNumber || ""`, and empty array `[]` or dynamic serial list.
- **File**: `web-client/src/app/tenant/quotations/page.tsx:220-225`:
  * Remove `"Ekvarta Energy Solutions"`, `"RAVI DODKUJI KAWALE"`, and `"413472965142"` fallbacks; replace with dynamic lookups or empty strings `""`.
- **File**: `web-client/src/components/quotations/QuotationDetailModal.tsx:959-964`:
  * Remove `"Ekvarta Energy Solutions"`, `"RAVI DODKUJI KAWALE"`, and `"413472965142"` fallbacks; replace with dynamic lookups or empty strings `""`.

### 4. Build and Test Verification
Execute the following commands using run_command:
1. `node --test backend/test/m4AdversarialChallenges.test.js` (Target: 14/14 passed, 100%)
2. `node --test backend/test/m4CommercialOps.test.js` (Target: 17/17 passed, 100%)
3. `node --test backend/test/m3SecurityAndPrecision.test.js` (Target: 15/15 passed, 100%)
4. `node --test backend/test/e2e/*.test.js` (Target: 69/69 passed, 100%)
5. `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` (0 errors)
6. `npm.cmd --prefix web-client run build` (0 errors, 66/66 routes generated)

## Output & Handoff
Update `progress.md` during execution.
When complete, write `handoff.md` in `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_remediation\handoff.md` with full Observation, Logic Chain, Caveats, Conclusion, and Verification Method. Then notify orchestrator via send_message.
