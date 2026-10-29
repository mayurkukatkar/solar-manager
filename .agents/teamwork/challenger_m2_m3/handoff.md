# Milestone M2 & M3 Adversarial Challenge & Verification Report

**Challenger**: Challenger M2 & M3 (`challenger_m2_m3`)  
**Date**: 2026-10-29  
**Milestones Evaluated**:  
- M2: Design System & Shared UI Components Foundation  
- M3: Security, Multi-Tenancy & Financial Precision Hardening  
**Explicit Verdict**: **APPROVE**  

---

## 1. Observation

### 1.1 Child Entity Cross-Tenant Isolation Enforcement
- Direct inspection of route controllers confirmed pre-flight relationship validation:
  * `backend/routes/tenant/crm.js:1507-1510`: `const project = await prisma.project.findFirst({ where: { id: req.params.id, tenantId: req.user.tenantId } }); if (!project) return res.status(404).json({ error: 'Project not found' });`
  * `backend/routes/tenant/crm.js:1534-1537`: `const existingTask = await prisma.projectTask.findFirst({ where: { id: req.params.id, project: { tenantId: req.user.tenantId } } }); if (!existingTask) return res.status(404).json({ error: 'Task not found or access denied' });`
  * `backend/routes/tenant/crm.js:1557-1560`: Milestone creation validates `project.tenantId === req.user.tenantId`, returning 404 on mismatch.
  * `backend/routes/tenant/crm.js:1582-1585`: Milestone update validates `project: { tenantId: req.user.tenantId }`, returning 404 on mismatch.
  * `backend/routes/tenant/crm.js:1604-1607`: Material requirement creation validates `project.tenantId === req.user.tenantId`, returning 404 on mismatch.
  * `backend/routes/tenant/crm.js:1629-1632`: Material requirement update validates `project: { tenantId: req.user.tenantId }`, returning 404 on mismatch.
  * `backend/routes/tenant/support.js:83-87`: Service visit creation validates `ticket.tenantId === req.user.tenantId`, returning 404 (`Ticket not found or access denied`).
  * `backend/routes/tenant/finance.js:1450-1454`: Service visit creation validates `ticket.tenantId === req.user.tenantId`, returning 404 (`Ticket not found or access denied`).
- **Empirical Execution**: Executed `node --test backend/test/adversarialChallenges.test.js` (Challenge 1, tests 1.1–1.8). Tenant B JWT attempting all 8 operations against Tenant A projects and tickets resulted in HTTP 404 across 100% of attempts (8 passed, 0 failed).

### 1.2 Unauthenticated OCR Endpoints & User Self-Protection
- Route middleware inspection:
  * `backend/routes/tenant/ocr.js:310`: `router.post('/api/tenant/ocr/scan-bill', requireTenantAuth, ...)`
  * `backend/routes/tenant/ocr.js:359`: `router.post('/api/tenant/ocr/fetch-consumer', requireTenantAuth, ...)`
  * `backend/middleware/auth.js:13, 104`: Identity normalization guarantees `req.user = { id: payload.userId || payload.id, userId: payload.userId || payload.id, ...payload }`.
  * `backend/routes/tenant/users.js:272`: `if (id === req.user.id || id === req.user.userId) return res.status(400).json({ error: 'Cannot delete your own user account' });`
- **Empirical Execution**: Executed `backend/test/adversarialChallenges.test.js` (Challenge 2, tests 2.1–2.4):
  * Unauthenticated `POST /api/tenant/ocr/scan-bill` returned HTTP 401 (`Tenant Access Required`).
  * Unauthenticated `POST /api/tenant/ocr/fetch-consumer` returned HTTP 401 (`Tenant Access Required`).
  * Forged token `POST /api/tenant/ocr/scan-bill` returned HTTP 401.
  * Self-deletion attempt `DELETE /api/tenant/users/:my_id` returned HTTP 400 (`Cannot delete your own user account`).

### 1.3 Section 15(3) CGST Act Trade Discount Multi-Rate Arithmetic
- Direct inspection of calculation engines:
  * `backend/services/solarCalculator.js:287-345` and `web-client/src/services/solarCalculator.ts:433-504`.
  * Taxable base scaling factor: `const scaleFactor = (subtotal - discountAmount) / subtotal`.
  * Discounted item base: `Math.round(rawBase * scaleFactor)`.
  * Base reconciliation: `items[last].baseAmount += (taxableAmount - sumBase)`.
  * Tax computation on discounted base: `Math.round(baseAmount * (rate / 100))`.
  * Tax reconciliation: `items[last].taxAmount += (totalTax - sumTax)`.
- **Empirical Execution**: Executed `backend/test/adversarialChallenges.test.js` (Challenge 3, tests 3.1–3.3):
  * Multi-rate 4-item commercial quotation (12% and 18% items, subtotal ₹2,00,000, trade discount ₹25,000):
    - Discounted taxable amount: ₹1,75,000.
    - Verified line item bases: 87,500 + 43,750 + 26,250 + 17,500 = ₹1,75,000 exactly.
    - Total tax computed: ₹23,625 (line taxes: 10,500 + 5,250 + 4,725 + 3,150).
    - Verified tax was NOT calculated on undiscounted base (which would have been ₹27,000, overcharging customer ₹3,375 on discount).
    - Grand total: ₹1,98,625 (`taxableAmount + totalTax`).
  * 100% discount boundary condition: subtotal ₹30,000, discount ₹30,000 -> taxable base ₹0, total tax ₹0, grand total ₹0.
  * Prime and odd fractional amount reconciliation (subtotal ₹77,771, discount ₹7,777): `sum(baseAmount) === 69994`, `sum(taxAmount) === pricing.tax`.

### 1.4 Milestone Integer Reconciliation & Rounding Drift
- Calculation engine inspection:
  * `backend/services/solarCalculator.js:358-372` & `web-client/src/services/solarCalculator.ts:510-525`:
  * Final milestone amount formula: `milestones[milestones.length - 1].amount = grandTotal - runningSum`.
- **Empirical Execution**: Executed `backend/test/adversarialChallenges.test.js` (Challenge 4, tests 4.1–4.3):
  * Test 4.1: 1,000 sequential integer totals (₹1 to ₹1,000) evaluated. Drift occurrences = 0 (0.00% drift).
  * Test 4.2: 1,000 pseudo-random large integer totals (₹1 to ₹1,00,00,000) evaluated. Drift occurrences = 0 (0.00% drift).
  * Test 4.3: 1,000 odd totals with custom asymmetric 5-stage milestone percentages (15%, 35%, 25%, 15%, 10%) evaluated. Drift occurrences = 0 (0.00% drift).
  * Aggregate: 3,000 totals evaluated across 3 schedules; 0 drift occurrences observed.

### 1.5 7 New Next.js Routes & Elimination of Native `alert()` Calls
- Verified all 7 resolved route files exist in `web-client/src/app/`:
  1. `tenant/installation/schedule/page.tsx` (305 lines)
  2. `tenant/installation/calendar/page.tsx` (281 lines)
  3. `tenant/installation/checklists/page.tsx` (349 lines)
  4. `tenant/inventory/products/new/page.tsx` (292 lines)
  5. `tenant/quotations/new/page.tsx` (150 lines)
  6. `super-admin/security/page.tsx` (200 lines)
  7. `super-admin/profile/page.tsx` (220 lines)
- Regex grep scan for `\balert\s*\(` across all 4 refactored modules (`finance/page.tsx`, `surveys/page.tsx`, `tasks/page.tsx`, `projects/[id]/page.tsx`) and the 7 new route files returned 0 matches.
- Strict TypeScript compilation check: `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` exited with code 0 (zero errors).
- Production Next.js build: `npm.cmd --prefix web-client run build` exited with code 0. Compiled and generated all 66 application routes without error.

### 1.6 Automated Test Suite Execution Results
- `node --test backend/test/m3SecurityAndPrecision.test.js`:
  * Outcome: 15 passed, 0 failed, 8 suites, duration 25.7s.
- `node --test web-client/test/ui-components.test.mjs`:
  * Outcome: 8 passed, 0 failed, duration 1.2s.
- `node --test backend/test/e2e/*.test.js` (Tiers 1–4):
  * Outcome: 69 passed, 0 failed, 24 suites, duration 80.9s.
- `node --test backend/test/adversarialChallenges.test.js`:
  * Outcome: 18 passed, 0 failed, 5 suites, duration 15.3s.

---

## 2. Logic Chain

1. **Child Entity Tenancy Verification**:
   - *Observation*: Primary keys on `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, and `ServiceVisit` were previously vulnerable because the schema lacks direct `tenantId` on those tables.
   - *Deduction*: By filtering on `project: { tenantId }` and pre-flighting `findFirst({ id, tenantId })`, cross-tenant queries cannot find the parent record and abort with HTTP 404 before mutation.
   - *Empirical Proof*: Tests 1.1–1.8 demonstrated that Tenant B tokens cannot create or update any child entity belonging to Tenant A, resulting in HTTP 404 across all endpoints.

2. **Unauthenticated OCR Access & Self-Deletion Protection**:
   - *Observation*: OCR endpoints previously lacked `requireTenantAuth`, and JWT minting lacked `id`, breaking `id === req.user.id`.
   - *Deduction*: Adding `requireTenantAuth` blocks unauthenticated calls with 401. Normalizing `req.user.id` and `req.user.userId` in middleware restores the user self-deletion guard.
   - *Empirical Proof*: Unauthenticated OCR requests rejected with 401; user self-deletion rejected with 400.

3. **Section 15(3) CGST Act Compliance**:
   - *Observation*: Previously, when `overallDiscount > 0`, tax was computed on gross amounts, charging GST on discounts in violation of Indian law.
   - *Deduction*: Scaling taxable base by `(subtotal - discount) / subtotal` ensures tax is computed solely on the discounted value of supply, while remainder absorbing guarantees integer precision without penny drift.
   - *Empirical Proof*: Test 3.1 demonstrated that on a ₹2,00,000 subtotal with ₹25,000 discount, total tax is ₹23,625 rather than ₹27,000, correctly saving the customer ₹3,375 in illegal tax charges.

4. **Milestone Integer Reconciliation**:
   - *Observation*: Calculating percentages with floating-point math causes rounding discrepancies on odd amounts.
   - *Deduction*: Allocating the remainder `grandTotal - sum(milestones[0..N-2])` to the final milestone guarantees mathematical equality.
   - *Empirical Proof*: Tests 4.1–4.3 verified 3,000 totals across sequential, large random, and custom percentage distributions with 0% drift.

5. **Route Integrity & UI Stability**:
   - *Observation*: 7 dead links caused 404 errors, and native `alert()` blocked browser threads.
   - *Deduction*: Full Next.js pages with UI primitives and `ToastProvider` resolve navigation dead-ends and deliver non-blocking feedback.
   - *Empirical Proof*: `tsc --noEmit` passed with 0 errors; `next build` compiled all 66 routes successfully; zero `alert()` calls remain.

---

## 3. Caveats

- **External DISCOM / PM Surya Ghar API Integration**: Per safeguard R4, testing was performed against opaque test server fixtures and local mock handlers without contacting live government or DISCOM servers.
- **Mobile App Parity**: Test parity for `mobile-app/src/services/pdfService.ts` is explicitly assigned to Milestone M5 and was not modified here.

---

## 4. Conclusion & Verdict

**Overall Risk Assessment**: **LOW**  
**Explicit Milestone Verdict**: **APPROVE**

All requirements of Milestones M2 and M3 have been empirically verified:
1. Multi-tenant child entity isolation is strictly enforced (HTTP 404).
2. Public OCR endpoints are protected (HTTP 401); user self-deletion is guarded (HTTP 400).
3. Section 15(3) CGST Act trade discount math scales bases proportionally and eliminates illegal tax on discounts.
4. Milestone distribution achieves 0% rounding drift across 3,000 tested totals.
5. All 7 Next.js routes compile cleanly in production builds (`next build`), and zero native `alert()` calls remain in refactored modules.
6. All 110 automated tests (15 M3 + 8 UI + 69 E2E + 18 Adversarial) pass with zero failures.

---

## 5. Verification Method

To independently reproduce and verify this entire report:

1. **Run the Adversarial Empirical Challenge Suite**:
   ```powershell
   node --test backend/test/adversarialChallenges.test.js
   ```
   *Expected Result*: 18 passed, 0 failed.

2. **Run the M3 Security & Precision Suite**:
   ```powershell
   node --test backend/test/m3SecurityAndPrecision.test.js
   ```
   *Expected Result*: 15 passed, 0 failed.

3. **Run the Web-Client UI Components Suite**:
   ```powershell
   node --test web-client/test/ui-components.test.mjs
   ```
   *Expected Result*: 8 passed, 0 failed.

4. **Run the E2E Integration Suite**:
   ```powershell
   node --test backend/test/e2e/tier1-feature-coverage.test.js backend/test/e2e/tier2-boundary-corner-cases.test.js backend/test/e2e/tier3-cross-feature-combinations.test.js backend/test/e2e/tier4-real-world-scenarios.test.js
   ```
   *Expected Result*: 69 passed, 0 failed.

5. **Verify Strict TypeScript Compilation**:
   ```powershell
   node "web-client/node_modules/typescript/bin/tsc" --noEmit -p "web-client/tsconfig.json"
   ```
   *Expected Result*: Exits with code 0 and zero output.

6. **Verify Next.js Production Build**:
   ```powershell
   npm.cmd --prefix "web-client" run build
   ```
   *Expected Result*: Exits with code 0 and generates all 66 routes.

### Invalidation Conditions
- If any child entity mutation endpoint accepts a cross-tenant ID or returns 200/201, this report is invalidated.
- If unauthenticated requests to `/api/tenant/ocr/scan-bill` or `/fetch-consumer` return 200, this report is invalidated.
- If GST on a discounted quote is calculated on the undiscounted base, this report is invalidated.
- If `generateMilestones` sum does not equal `grandTotal` for any integer total, this report is invalidated.
- If any refactored module invokes native `alert()`, this report is invalidated.
