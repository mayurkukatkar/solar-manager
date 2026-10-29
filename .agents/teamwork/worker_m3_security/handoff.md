# Milestone M3: Security, Multi-Tenancy & Financial Precision Hardening — Final Handoff Report

## 1. Observation

### 1.1 Direct Codebase & Vulnerability Observations
1. **Child Entity Multi-Tenant Isolation Bypass**:
   - `backend/routes/tenant/crm.js`: `POST /api/tenant/projects/:id/tasks`, `PATCH /api/tenant/tasks/:id`, `POST /api/tenant/projects/:id/milestones`, `PATCH /api/tenant/milestones/:id`, `POST /api/tenant/projects/:id/materials`, and `PATCH /api/tenant/materials/:id` previously mutated project sub-entities using primary keys only without verifying parent `project.tenantId === req.user.tenantId`.
   - `backend/routes/tenant/support.js:81` and `backend/routes/tenant/finance.js:1450`: `ServiceVisit` creation endpoints previously accepted `ticketId` directly without verifying that the parent support ticket belongs to `req.user.tenantId`.
2. **JWT Identity Payload Inconsistency**:
   - `backend/routes/auth.js:77`: Minted JWT with `{ userId: user.id, role: user.role, tenantId: user.tenantId, permissions: effectivePermissions }`, omitting `id`.
   - `backend/middleware/auth.js:104`: Set `req.user = payload`, leaving `req.user.id` undefined.
   - `backend/routes/tenant/users.js:272`: `if (id === req.user.id)` check to prevent self-deletion failed silently due to `req.user.id` being undefined.
3. **Public Unauthenticated OCR Endpoints**:
   - `backend/routes/tenant/ocr.js:310`: `POST /api/tenant/ocr/scan-bill` lacked authentication middleware.
   - `backend/routes/tenant/ocr.js:359`: `POST /api/tenant/ocr/fetch-consumer` lacked authentication middleware.
4. **Granular RBAC Route Disconnect**:
   - `backend/middleware/auth.js:113`: Exported `requirePermission(...permissions)`, but it was utilized in zero tenant route controllers across the system.
5. **Trade Discount GST Precision Flaw**:
   - `backend/services/solarCalculator.js:290-340` and `web-client/src/services/solarCalculator.ts:430-490`: When `overallDiscount > 0`, tax was calculated on un-discounted item base amounts, charging customers tax on the discount itself in violation of Section 15(3) of the CGST Act.
   - Milestone distribution in both engines lacked integer remainder reconciliation, leading to 1-rupee rounding discrepancies on odd amounts.
6. **Route Shadowing & Defect Feedback**:
   - `backend/routes/tenant/crm.js:514-540`: Registered a shallow `router.patch('/api/tenant/quotations/:id')` that shadowed the comprehensive proposal builder update handler in `quotations.js:514`.
   - `backend/services/solarCalculator.js:143` and `web-client/src/services/solarCalculator.ts:289`: `calculateIndicativeSubsidy` lacked non-positive capacity checks, yielding inaccurate estimates for zero or negative values.
7. **Package Manifest Test Script**:
   - `backend/package.json`: `"test"` script was defined as `"echo \"Error: no test specified\" && exit 1"`.

---

## 2. Logic Chain

1. **Child Entity Tenancy Enforcement**:
   - *Observation Reference*: 1.1.1
   - *Reasoning*: Because `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, and `ServiceVisit` do not have a dedicated `tenantId` column in Prisma schema, tenant validation must be enforced through their relation to parent records (`project: { tenantId }` or `ticket: { tenantId }`).
   - *Implementation*: Added pre-flight findFirst checks and update relation filters in `crm.js`, `support.js`, and `finance.js`. If the parent does not match the authenticated tenant, 404 is returned, preventing cross-tenant data tampering.

2. **JWT Identity Normalization**:
   - *Observation Reference*: 1.1.2
   - *Reasoning*: Route handlers throughout the codebase inconsistently access either `req.user.id` or `req.user.userId`.
   - *Implementation*: In `routes/auth.js`, the token is minted with both `id: user.id` and `userId: user.id`. In `middleware/auth.js`, `requireTenantAuth` and `requireSuperAdmin` normalize `req.user = { id: payload.userId || payload.id, userId: payload.userId || payload.id, ...payload }`. In `users.js:272`, self-deletion is guarded by `id === req.user.id || id === req.user.userId`.

3. **OCR Endpoint Hardening**:
   - *Observation Reference*: 1.1.3
   - *Reasoning*: Unauthenticated endpoints under `/api/tenant/` violate SaaS multi-tenancy and expose external OCR services to quota exhaustion.
   - *Implementation*: Attached `requireTenantAuth` to `POST /api/tenant/ocr/scan-bill` and `POST /api/tenant/ocr/fetch-consumer`.

4. **Granular RBAC Route Enforcement**:
   - *Observation Reference*: 1.1.4
   - *Reasoning*: Employees (`TENANT_SUB_ADMIN`) must be restricted according to their granted permission set without impacting `TENANT_ADMIN` full tenant authority.
   - *Implementation*: Upgraded `requirePermission` to evaluate token permissions with fallback to database, and applied `requirePermission` to key operations: `leads.view`, `leads.create`, `leads.edit`, `leads.delete`, `inventory.dispatch`, `finance.create_invoice`, and `finance.record_payment`.

5. **Section 15(3) CGST Act Trade Discount Arithmetic & Milestone Reconciliation**:
   - *Observation Reference*: 1.1.5
   - *Reasoning*: Under Indian GST law, trade discounts granted at or before supply must reduce the taxable value for tax computation.
   - *Implementation*: In `backend/services/solarCalculator.js` and `web-client/src/services/solarCalculator.ts`, if `overallDiscount > 0`, each item's taxable base is scaled by `(subtotal - discountAmount) / subtotal`. The last line item absorbs rounding discrepancies so line item bases sum exactly to `taxableAmount`. Line item taxes are computed on discounted bases and rebalanced to match `totalTax`. In `generateMilestones`, `milestones[last].amount = grandTotal - milestoneSum(0..N-1)`, eliminating rounding drift.

6. **Redundant Route Shadowing & Subsidy Safeguard**:
   - *Observation Reference*: 1.1.6
   - *Implementation*: Removed lines 514-540 in `crm.js` so `quotations.js:514` handles all quote updates. Added `if (!cap || cap <= 0) return { indicativeSubsidy: 0, isEligible: false, breakdown: 'Invalid capacity', netPayableEstimate: 0 }` to both backend and TypeScript calculators.

7. **Backend Test Automation**:
   - *Observation Reference*: 1.1.7
   - *Implementation*: Updated `backend/package.json` `"test"` script to `"node --test test/*.test.js"` and authored `backend/test/m3SecurityAndPrecision.test.js`.

---

## 3. Caveats

- **Existing External Template Parity Failure**: In `backend/test/unifiedTemplateParity.test.js:49`, an assertion requires `'PM Surya Ghar Muft Bijli Yojana'` inside `mobile-app/src/services/pdfService.ts`. Per `PROJECT.md` line 40, this mobile app parity fix is scheduled under Milestone M5 (`mobile-app/`). No files outside of M3's assigned file ownership were modified.
- **No Direct Live Production Database Mutation**: Safeguard R4 was strictly followed. All Prisma operations ran against local test configurations without executing destructive schema migrations or contacting live production databases.

---

## 4. Conclusion

Milestone M3 is complete. All P0 and P1 security vulnerabilities, multi-tenancy isolation gaps on child entities, JWT identity mismatches, public OCR exposures, and financial precision defects have been remediated. Both the backend and web-client calculation engines now comply strictly with Section 15(3) of the CGST Act and guarantee exact milestone integer reconciliation.

All 15 automated test cases in the new `backend/test/m3SecurityAndPrecision.test.js` pass with 0 failures, and all 13 existing unit and integration tests across `solarCalculator.test.js`, `quotationsApi.test.js`, `settingsApi.test.js`, and `e2eProposalBuilder.test.js` pass with 0 regressions.

---

## 5. Verification Method

### 5.1 Automated Test Execution Commands
Run the newly created M3 verification test suite:
```powershell
node --test backend/test/m3SecurityAndPrecision.test.js
```
*Expected Result*: 15 passed, 0 failed (100% pass rate).

Run the existing backend unit and integration suites:
```powershell
node --test backend/test/solarCalculator.test.js
node --test backend/test/quotationsApi.test.js backend/test/settingsApi.test.js
node --test backend/test/e2eProposalBuilder.test.js
```
*Expected Result*: All 13 tests passed, 0 failed.

### 5.2 Key Code Inspection Points
1. **Child Entity Tenancy Checks**:
   - Inspect `backend/routes/tenant/crm.js:1505-1618` (`project: { tenantId: req.user.tenantId }`).
   - Inspect `backend/routes/tenant/support.js:81-86` and `backend/routes/tenant/finance.js:1448-1454`.
2. **JWT Identity Normalization**:
   - Inspect `backend/routes/auth.js:76-80` (`id: user.id, userId: user.id`).
   - Inspect `backend/middleware/auth.js:13, 104` (`req.user = { id: payload.userId || payload.id, userId: payload.userId || payload.id, ...payload }`).
3. **OCR Route Protection**:
   - Inspect `backend/routes/tenant/ocr.js:310, 359` (`requireTenantAuth`).
4. **Financial Trade Discount GST Math**:
   - Inspect `backend/services/solarCalculator.js:287-345` and `web-client/src/services/solarCalculator.ts:433-504`.
5. **Quotation Handler Unshadowed**:
   - Inspect `backend/routes/tenant/crm.js` — confirm lines 514-540 have been removed.
