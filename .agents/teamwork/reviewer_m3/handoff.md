# Milestone M3 Reviewer & Adversarial Audit Report: Security, Multi-Tenancy & Financial Precision Hardening

**Reviewer Identity**: Reviewer M3 (Reviewer & Adversarial Critic)  
**Target Milestone**: M3 (Security, Multi-Tenancy & Financial Precision Hardening)  
**Verdict**: **APPROVE**  
**Integrity Assessment**: **CLEAN (0 Integrity Violations Detected)**  

---

## 1. Observation

### 1.1 Direct Source Code Observations
1. **Child Entity Multi-Tenant Isolation**:
   - `backend/routes/tenant/crm.js`:
     - Line 1507-1510: `POST /api/tenant/projects/:id/tasks` enforces `const project = await prisma.project.findFirst({ where: { id: req.params.id, tenantId: req.user.tenantId } }); if (!project) return res.status(404).json({ error: 'Project not found' });`
     - Line 1534-1537: `PATCH /api/tenant/tasks/:id` enforces `const existingTask = await prisma.projectTask.findFirst({ where: { id: req.params.id, project: { tenantId: req.user.tenantId } } }); if (!existingTask) return res.status(404).json({ error: 'Task not found or access denied' });`
     - Line 1557-1560: `POST /api/tenant/projects/:id/milestones` enforces parent `project.tenantId === req.user.tenantId`.
     - Line 1582-1585: `PATCH /api/tenant/milestones/:id` enforces `project: { tenantId: req.user.tenantId }`.
     - Line 1604-1607: `POST /api/tenant/projects/:id/materials` enforces parent `project.tenantId === req.user.tenantId`.
     - Line 1629-1632: `PATCH /api/tenant/materials/:id` enforces `project: { tenantId: req.user.tenantId }`.
   - `backend/routes/tenant/support.js`:
     - Line 83-88: `POST /api/tenant/tickets/:id/visits` enforces `const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, tenantId: req.user.tenantId } }); if (!ticket) return res.status(404).json({ error: 'Ticket not found or access denied' });`
   - `backend/routes/tenant/finance.js`:
     - Line 1450-1455: `POST /api/tenant/service/:id/visits` enforces `supportTicket.tenantId === req.user.tenantId`.

2. **JWT User Identity Normalization**:
   - `backend/routes/auth.js`:
     - Line 76-80: Minted JWT payload explicitly provides both keys: `{ id: user.id, userId: user.id, role: user.role, tenantId: user.tenantId, permissions: effectivePermissions }`.
   - `backend/middleware/auth.js`:
     - Line 13 & 104: In both `requireSuperAdmin` and `requireTenantAuth`, the request user context is normalized:
       `req.user = { id: payload.userId || payload.id, userId: payload.userId || payload.id, ...payload };`
   - `backend/routes/tenant/users.js`:
     - Line 272: Guard preventing user self-deletion now evaluates `if (id === req.user.id || id === req.user.userId)`.

3. **OCR Route Protection**:
   - `backend/routes/tenant/ocr.js`:
     - Line 311: `router.post('/api/tenant/ocr/scan-bill', requireTenantAuth, async (req, res) => ...)`
     - Line 360: `router.post('/api/tenant/ocr/fetch-consumer', requireTenantAuth, async (req, res) => ...)`

4. **Granular RBAC Route Protection**:
   - `backend/middleware/auth.js`:
     - Line 116-155: `requirePermission` inspects token permissions in memory first, falls back to querying `prisma.user.findUnique`, grants full implicit bypass for `role === 'TENANT_ADMIN'`, permits wildcard `*`, and verifies required permissions for `TENANT_SUB_ADMIN`.
   - `backend/routes/tenant/crm.js`: Attached `requirePermission` to `leads.view` (line 29), `leads.delete` (line 81), `leads.create` (line 130), `leads.edit` (line 191), and `inventory.dispatch` (line 749).
   - `backend/routes/tenant/finance.js`: Attached `requirePermission` to `finance.create_invoice` (line 700) and `finance.record_payment` (line 1096).

5. **Financial Engine Precision & Section 15(3) CGST Act Compliance**:
   - `backend/services/solarCalculator.js`:
     - Line 135-143: Guard against non-positive solar capacity in `calculateIndicativeSubsidy`:
       `if (!cap || cap <= 0) return { indicativeSubsidy: 0, isEligible: false, breakdown: 'Invalid capacity', netPayableEstimate: 0, disclaimer: 'Capacity must be greater than 0 kW.' };`
     - Line 328-348: Proportional trade discount base scaling:
       `const discountScale = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;`
       Last item absorbs rounding discrepancy so line item bases sum strictly to `taxableAmount`:
       `itemBase = Math.max(0, taxableAmount - runningBaseSum);`
     - Line 364-380: Taxes computed on discounted taxable base values (`Math.round(item.baseAmount * (item.taxRate / 100))`).
     - Line 431-434: In `generateMilestones`, the final milestone absorbs integer rounding difference:
       `result[result.length - 1].amount = total - milestoneSum;`
   - `web-client/src/services/solarCalculator.ts`:
     - Matches backend logic with complete TypeScript interface extensions (`overallDiscount`, `totalTax`, `milestones`, `breakdown`, `netPayableEstimate`).

6. **Elimination of Redundant Shadow Route**:
   - `backend/routes/tenant/crm.js`: Confirmed deletion of the redundant `router.patch('/api/tenant/quotations/:id')` that previously shadowed `quotations.js:514`.

### 1.2 Direct Test Execution Observations
1. **Milestone M3 Test Suite**:
   - Command: `node --test backend/test/m3SecurityAndPrecision.test.js`
   - Result: `✔ Milestone M3: Security, Multi-Tenancy & Financial Precision Test Suite (34242.6283ms)`
   - Counts: `tests 15, suites 8, pass 15, fail 0, cancelled 0, skipped 0`.
2. **Solar Calculator Unit Tests**:
   - Command: `node --test backend/test/solarCalculator.test.js`
   - Result: `✔ Solar Calculation Engine Tests (50.4827ms)`
   - Counts: `tests 7, suites 1, pass 7, fail 0`.
3. **Quotation & Settings API Integration Tests**:
   - Command: `node --test backend/test/quotationsApi.test.js backend/test/settingsApi.test.js`
   - Result: `pass 3, fail 0`.
4. **E2E Proposal Builder Test**:
   - Command: `node --test backend/test/e2eProposalBuilder.test.js`
   - Result: `pass 4, fail 0`.
5. **Full E2E Regression Suite (Tiers 1 to 4)**:
   - Command: `node --test backend/test/e2e/tier1-feature-coverage.test.js backend/test/e2e/tier2-boundary-corner-cases.test.js backend/test/e2e/tier3-cross-feature-combinations.test.js backend/test/e2e/tier4-real-world-scenarios.test.js`
   - Result: `✔ Tier 1 (43591ms), ✔ Tier 2 (32577ms), ✔ Tier 3 (56360ms), ✔ Tier 4 (53361ms)`
   - Counts: `tests 69, suites 24, pass 69, fail 0, cancelled 0, skipped 0`.
6. **Frontend TypeScript Type-Check**:
   - Command: `cmd /c "cd web-client && npx tsc --noEmit"`
   - Result: Exit code 0, 0 compiler errors.

---

## 2. Logic Chain

1. **Child Entity Tenancy Verification**:
   - *Observation*: Section 1.1.1 shows pre-flight queries verifying `project: { tenantId: req.user.tenantId }` or `supportTicket: { tenantId: req.user.tenantId }` before performing update or insertion mutations.
   - *Deduction*: Because the Prisma schema lacks a direct `tenantId` field on `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, and `ServiceVisit`, relational filtering through parent entities is the correct, tamper-proof mechanism to enforce tenant boundaries. An unauthorized tenant attempting to manipulate another tenant's sub-entities will receive HTTP 404, preventing cross-tenant privilege escalation or data leakage.

2. **Identity Context Normalization**:
   - *Observation*: Section 1.1.2 shows `req.user.id` and `req.user.userId` are guaranteed to exist simultaneously across both token generation and authentication middlewares.
   - *Deduction*: This resolves historical friction where controllers expecting `req.user.id` failed silently. The self-deletion check in `users.js:272` is now bulletproof against account suicide attacks.

3. **Public Route Exposure Elimination**:
   - *Observation*: Section 1.1.3 confirms `requireTenantAuth` is attached to `POST /api/tenant/ocr/scan-bill` and `POST /api/tenant/ocr/fetch-consumer`.
   - *Deduction*: Unauthenticated actors can no longer trigger OCR parsing or DISCOM consumer lookups, mitigating Denial of Service (DoS) risks and third-party quota exhaustion.

4. **Statutory Financial Calculation Compliance**:
   - *Observation*: Section 1.1.5 confirms that under `calculateCommercialPricing`, applying `overallDiscount` reduces line item base amounts proportionally via `(subtotal - discountAmount) / subtotal` prior to applying GST rates.
   - *Deduction*: This satisfies Section 15(3) of the CGST Act, 2017, which mandates that trade discounts given on or before supply must be deducted from the transaction value before tax is levied. Customers are no longer improperly billed tax on discounts. The integer rebalancing step ensures that line item base amounts and milestone payment amounts sum strictly to their respective totals without 1-rupee rounding drift.

5. **Integrity & Authenticity of Verification**:
   - *Observation*: Section 1.2 confirms all test suites ran via real CLI commands against the actual codebase.
   - *Deduction*: No hardcoded outputs, fake facades, or shortcuts exist. The implementations perform real calculations and database queries. Zero regressions were introduced across the 69 E2E tests.

---

## 3. Caveats

1. **Supabase Pooler Concurrency**: When running `node --test backend/test/*.test.js` without concurrency limits, the parallel launch of 6 Node worker processes can occasionally saturate the remote database pooler connection limit (`aws-0-ap-south-1.pooler.supabase.com:6543`). Running suites sequentially or with `--test-concurrency=1` ensures stable execution.
2. **Mobile App PDF Template Parity (Milestone M5 Dependency)**: `backend/test/unifiedTemplateParity.test.js` tests for the presence of `'PM Surya Ghar Muft Bijli Yojana'` inside `mobile-app/src/services/pdfService.ts`. Per `PROJECT.md` line 40, this mobile app parity fix is explicitly allocated to Milestone M5. This external dependency was not modified in M3, respecting milestone boundaries.

---

## 4. Conclusion

**Verdict**: **APPROVE**

Milestone M3 delivers complete, robust, and verified hardening across security, multi-tenancy, and financial calculations:
- Multi-tenant isolation on child entities is strictly enforced.
- JWT identity normalization eliminates identity mismatches across all tenant routes.
- Public OCR routes are fully protected by tenant session authentication.
- Granular RBAC enforcement restricts employee sub-admins while granting full authority to tenant admins.
- Financial arithmetic strictly follows Section 15(3) of the CGST Act and guarantees exact milestone integer reconciliation.
- 0 integrity violations, 0 regressions across 69 E2E tests, and 100% pass rate on all M3 test suites.

---

## 5. Verification Method

### 5.1 CLI Verification Commands
To independently reproduce and verify this review, execute the following commands from the repository root:

1. **Verify M3 Security & Precision Suite (15/15 Pass)**:
   ```powershell
   node --test backend/test/m3SecurityAndPrecision.test.js
   ```
2. **Verify Financial Calculator Precision Suite (7/7 Pass)**:
   ```powershell
   node --test backend/test/solarCalculator.test.js
   ```
3. **Verify Quotation & Settings Integration (3/3 Pass)**:
   ```powershell
   node --test backend/test/quotationsApi.test.js backend/test/settingsApi.test.js
   ```
4. **Verify Dynamic Proposal Builder (4/4 Pass)**:
   ```powershell
   node --test backend/test/e2eProposalBuilder.test.js
   ```
5. **Verify Full E2E Test Suite (69/69 Pass)**:
   ```powershell
   node --test backend/test/e2e/tier1-feature-coverage.test.js backend/test/e2e/tier2-boundary-corner-cases.test.js backend/test/e2e/tier3-cross-feature-combinations.test.js backend/test/e2e/tier4-real-world-scenarios.test.js
   ```
6. **Verify Web-Client TypeScript Compilation (0 Errors)**:
   ```powershell
   cmd /c "cd web-client && npx tsc --noEmit"
   ```

### 5.2 Code Inspection Targets
- `backend/routes/tenant/crm.js`: Lines 1507, 1534, 1557, 1582, 1604, 1629.
- `backend/routes/tenant/support.js`: Line 83.
- `backend/routes/tenant/finance.js`: Lines 700, 1096, 1450.
- `backend/middleware/auth.js`: Lines 13, 104, 116-155.
- `backend/routes/auth.js`: Line 76.
- `backend/routes/tenant/ocr.js`: Lines 311, 360.
- `backend/services/solarCalculator.js`: Lines 135, 328-348, 431-434.
- `web-client/src/services/solarCalculator.ts`: Lines 285, 477-498, 578-582.
