# Task Assignment: Milestone M3 — Security, Multi-Tenancy & Financial Precision Hardening

## Mission
Remediate all P0/P1 security vulnerabilities, enforce strict multi-tenancy isolation on child entities, normalize JWT authentication identity payloads, protect public OCR endpoints, integrate granular RBAC permissions, and fix financial calculation engines for Indian GST compliance and milestone rounding precision.

## Mandatory Inputs to Read First
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)
- `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
- `f:\Company Products\solar-manager\docs\product-audit.md`
- `f:\Company Products\solar-manager\docs\architecture-and-dependencies.md`
- `f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\handoff.md`

## File Ownership
You exclusively own:
- `backend/middleware/auth.js`
- `backend/routes/auth.js`
- `backend/routes/tenant/crm.js`
- `backend/routes/tenant/finance.js`
- `backend/routes/tenant/support.js`
- `backend/routes/tenant/ocr.js`
- `backend/routes/tenant/users.js`
- `backend/services/solarCalculator.js`
- `web-client/src/services/solarCalculator.ts`
- `backend/package.json`

## Detailed Implementation Requirements
1. **Child Entity Multi-Tenant Isolation**:
   - In `backend/routes/tenant/crm.js`:
     * `POST /api/tenant/projects/:id/tasks` (line 1532): Verify parent project belongs to tenant:
       ```javascript
       const project = await prisma.project.findFirst({ where: { id: req.params.id, tenantId: req.user.tenantId } });
       if (!project) return res.status(404).json({ error: 'Project not found' });
       ```
     * `PATCH /api/tenant/tasks/:id` (line 1554): Verify parent project tenancy:
       ```javascript
       const existingTask = await prisma.projectTask.findFirst({ where: { id: req.params.id, project: { tenantId: req.user.tenantId } } });
       if (!existingTask) return res.status(404).json({ error: 'Task not found or access denied' });
       ```
     * `POST /api/tenant/projects/:id/milestones` (line 1572): Verify parent project tenancy.
     * `PATCH /api/tenant/milestones/:id` (line 1592): Verify `project: { tenantId: req.user.tenantId }`.
     * `POST /api/tenant/projects/:id/materials` (line 1609): Verify parent project tenancy.
     * `PATCH /api/tenant/materials/:id` (line 1629): Verify `project: { tenantId: req.user.tenantId }`.
   - In `backend/routes/tenant/support.js:81` and `backend/routes/tenant/finance.js:1450`:
     * Before creating `ServiceVisit`, verify the parent support ticket belongs to `req.user.tenantId`.
2. **JWT User Identity Normalization**:
   - In `backend/routes/auth.js:76-80`: Mint token with `{ id: user.id, userId: user.id, role: user.role, tenantId: user.tenantId, permissions: effectivePermissions }`.
   - In `backend/middleware/auth.js:104`: Normalize `req.user = { id: payload.userId || payload.id, userId: payload.userId || payload.id, ...payload }`.
   - In `backend/routes/tenant/users.js:272`: Verify self-protection check `if (id === req.user.id)` works accurately.
3. **Protect OCR Endpoints**:
   - In `backend/routes/tenant/ocr.js:310, 359`: Attach `requireTenantAuth` to `POST /api/tenant/ocr/scan-bill` and `POST /api/tenant/ocr/fetch-consumer`.
4. **Granular RBAC Route Enforcement**:
   - Export and apply `requirePermission` across key operational actions in tenant controllers (e.g. `leads.view`, `leads.create`, `quotations.create`, `finance.create_invoice`, `inventory.dispatch`).
5. **Financial Precision & GST Trade Discount Math**:
   - In both `backend/services/solarCalculator.js` and `web-client/src/services/solarCalculator.ts`:
     * In `calculateCommercialPricing`: If `overallDiscount > 0`, calculate `discountAmount = Math.max(0, Math.min(subtotal, Number(overallDiscount) || 0))`. Proportionally scale item taxable amounts by `(subtotal - discountAmount) / subtotal` so item-level tax is calculated on the discounted base, satisfying Section 15(3) of the CGST Act.
     * Rebalance line item taxable bases and taxes so their sum exactly matches `taxableAmount` and `totalTax`.
     * In `generateMilestones`: Ensure exact integer reconciliation:
       ```javascript
       const milestoneSum = milestones.slice(0, 3).reduce((sum, m) => sum + m.amount, 0);
       milestones[3].amount = grandTotal - milestoneSum;
       ```
6. **Backend Scripts**:
   - Update `backend/package.json` `"test"` script to `"node --test test/*.test.js"`.
7. **Verification**:
   - Run `node --test backend/test/*.test.js` and verify passing test suites.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\worker_m3_security\`
Write your `progress.md` with liveness timestamps.
Write your final `handoff.md` report and send a message when complete.


## 2026-10-29T11:52:48Z
You are Worker M3 responsible for Milestone M3: Security, Multi-Tenancy & Financial Precision Hardening.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\worker_m3_security\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\worker_m3_security\DISPATCH.md before starting.
Implement child entity multi-tenant isolation in crm.js/finance.js/support.js, normalize JWT identity req.user.id in auth middleware, attach requireTenantAuth to OCR endpoints, fix trade discount GST arithmetic and milestone rounding drift in solarCalculator.js and solarCalculator.ts, update backend package.json test script, and verify test execution.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Update progress.md with your liveness heartbeat.
Write your final handoff report to f:\Company Products\solar-manager\.agents\teamwork\worker_m3_security\handoff.md and notify me via send_message when complete.


## 2026-10-29T11:55:41Z
**Context**: Milestone M3 Implementation
**Content**: The E2E Testing Track has published `TEST_READY.md` and uncovered two additional defects in your owned files:
1. `crm.js:514` registers a shallow `router.patch('/api/tenant/quotations/:id')` that shadows the comprehensive handler in `quotations.js:514`. Please remove this redundant handler from `crm.js`.
2. `backend/services/solarCalculator.js:143` in `calculateIndicativeSubsidy`: add `if (!cap || cap <= 0) return { indicativeSubsidy: 0, isEligible: false, breakdown: 'Invalid capacity', netPayableEstimate: 0 };` to avoid negative subsidies.
**Action**: Incorporate both fixes into your Milestone M3 implementation.
