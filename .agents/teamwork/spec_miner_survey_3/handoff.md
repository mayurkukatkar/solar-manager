# Handoff Report: Spec Miner 3 (Domain & API Spec Miner)

**Target Deliverable**: `f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\handoff.md`  
**Report Document**: `f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\survey_report.md`  
**Status**: Task Complete (Hard Handoff)  
**Date**: 2026-10-30  

---

## 1. Observation

1. **Backend Database Schema (`backend/prisma/schema.prisma`)**:
   - Total 1,711 lines defining 68 Prisma models across 14 functional domains.
   - Core logical tenancy is partitioned by `tenantId` across all root business models (`Tenant`, `User`, `Lead`, `Customer`, `SiteSurvey`, `Quotation`, `Project`, `Invoice`, `DiscomApplication`, `SubsidyApplication`, `InstallationJob`, `PurchaseOrder`, `Warehouse`, `Product`).
   - Defined system roles in enum `RoleType`:
     ```prisma
     enum RoleType {
       SUPER_ADMIN
       TENANT_ADMIN
       TENANT_SUB_ADMIN
     }
     ```
   - Defined sub-admin permissions stored as JSON in `User.permissions`:
     ```prisma
     model User {
       ...
       permissions Json?
     }
     ```

2. **Authentication & Session Interceptors (`backend/routes/auth.js`, `backend/middleware/auth.js`)**:
   - `backend/routes/auth.js:8-109`: `POST /api/auth/login` checks tenant status and employee status:
     ```javascript
     if (user.tenant.status === 'SUSPENDED') {
       return res.status(403).json({ error: 'Account Suspended...', code: 'TENANT_SUSPENDED', isSuspended: true });
     }
     if (user.staffProfile && (user.staffProfile.status === 'SUSPENDED' || user.staffProfile.status === 'INACTIVE')) {
       return res.status(403).json({ error: 'Access Suspended...', code: 'EMPLOYEE_SUSPENDED', isSuspended: true });
     }
     ```
   - `backend/routes/auth.js:63-65`: If `user.mustChangePassword === true`, returns `{ requiresPasswordReset: true, email: user.email }`.
   - `backend/middleware/auth.js:22-49`: Live tenant status checking using a 5-second TTL in-memory cache (`tenantStatusCache`), invalidated instantly when Super Admin modifies tenant status.

3. **Stage Gating State Machines (`backend/routes/tenant/crm.js`, `backend/routes/tenant/discom.js`, `backend/routes/tenant/installations.js`)**:
   - `backend/routes/tenant/crm.js:1438-1475`: Project stage transition strictly enforces canonical ordering `['SURVEY_COMPLETED', 'STRUCTURE_APPROVED', 'MATERIAL_DISPATCHED', 'INSTALLATION_STARTED', 'TESTING_COMPLETED', 'NET_METER_APPLIED', 'COMMISSIONED']`. If `nextIdx > currentIdx + 1`, returns HTTP 400 `{ error: 'Invalid stage transition: cannot jump from ... to ...' }`.
   - `backend/routes/tenant/discom.js:54-88`: DISCOM stage gating requires prerequisite statutory documents:
     - Moving to `CEIG_INSPECTION` requires `feasibilityDocumentUrl`.
     - Moving to `METER_TESTING` requires `ceigDocumentUrl`.
     - Moving to `NET_METER_INSTALLED` requires `meterTestReportUrl`.
     - Moving to `GRID_SYNCHRONIZED` requires `netMeterCertificateUrl`.
   - `backend/routes/tenant/installations.js:210-221`: Moving installation status to `PENDING_REVIEW` or `COMPLETED` requires uploaded photos in `['ROOF', 'INVERTER', 'PANELS']`. Missing photos returns HTTP 400 `{ error: 'Missing required photos: ...' }`.

4. **Financial Engine Mathematics (`backend/services/solarCalculator.js`)**:
   - `calculateCommercialPricing` (lines 287-404):
     - Calculates 13.8% composite solar GST (`70% @ 12% + 30% @ 18%`).
     - Applies Section 15(3) CGST Act trade discount: scales line item taxable amounts proportionally (`discountScale = (subtotal - discountAmount) / subtotal`). The last item absorbs rounding discrepancy so `sum(itemBase) === taxableAmount`.
   - `generateMilestones` (lines 409-437):
     - Splits grand total into 4 milestones: Advance (20%), Delivery (60%), Installation (15%), Commissioning (5%).
     - Absorbs rounding in milestone 4: `result[3].amount = total - sum(first 3)`, strictly guaranteeing `sum(milestones) === grandTotal` without 1-rupee rounding drift.
   - `calculateIndicativeSubsidy` (lines 125-162):
     - Evaluates PM Surya Ghar subsidies: Residential <= 1 kW = ₹30k; <= 2 kW = ₹60k; >= 3 kW = ₹78k (cap); Commercial = ₹0 (`isEligible: false`).

5. **Workforce Safety & Deletion Controls (`backend/routes/tenant/staff.js`)**:
   - Lines 31-46: Recursive hierarchy check detects circular manager reporting (`m.managerId === id`).
   - Lines 1124-1126: Rejects self-session revocation (`staff.userId === req.user.userId`).
   - Lines 1184-1194: Rejects employee deletion if active assignments exist and no `reassignTo` or `force` is specified.
   - Lines 1206-1246: Reassignment automatically migrates project assignments, direct reports, leads, project tasks, support tickets, and surveys to designated colleague.

6. **Mobile Field OS Capabilities (`mobile-app/src/screens/operations/`, `mobile-app/src/screens/projects/`)**:
   - `InstallationQAModal.tsx:71-76`: Enforces CEA electrical safety thresholds: Earth Pits 1, 2, 3 must be strictly `< 5.0 Ω`; anti-islanding trip time must be `< 2.0 s`; insulation resistance must be `> 1.0 MΩ`.
   - `BarcodeScannerModal.tsx:43-110`: Parses JSON, delimiter (`|`, `;`), and raw module/inverter 2D barcodes, verifying ALMM/DCR domestic content and blocking duplicate serials.
   - `DiscomDocsModal.tsx:56-64`: Generates 7 official statutory templates (`WCR_FULL`, `WCR`, `AnnexureI`, `DCR`, `NetMetering`, `ConsumerVendor`, `StandardQuotation`) with a 115mm blank top margin switch for printing directly on treasury non-judicial stamp paper.
   - `offlineSyncService.ts:1-70`: Implements offline draft caching in `AsyncStorage` (`@solar_manager_draft_leads`, `@solar_manager_draft_quotes`) with local UUID generation.

---

## 2. Logic Chain

1. **Multi-Tenancy & Authorization Logic**:
   - Observation 1 establishes that all primary models contain `tenantId`.
   - Observation 2 proves that authentication extracts `tenantId`, `userId`, `role`, and `permissions`.
   - Therefore, any API service or mobile UI query must preserve logical multi-tenancy boundaries, and all child queries (`tasks`, `milestones`, `materials`, `service visits`) must filter through parent relationships (`where: { id, project: { tenantId } }`) to prevent IDOR cross-tenant data leaks.

2. **Stage Gating & Business Invariant Logic**:
   - Observation 3 proves that projects cannot jump stages, DISCOM interconnections cannot advance without specific statutory approvals, and installation jobs cannot complete without required photo categories.
   - Therefore, mobile UI screens must represent these stages with clear prerequisites, indicators, and disabled/guided actions rather than allowing free-form stage updates.

3. **Financial Precision Logic**:
   - Observation 4 proves that GST must be computed at 13.8% composite solar GST, overall trade discounts must proportionally adjust individual item bases, and milestone sums must strictly equal the gross total without rounding drift.
   - Therefore, frontend proposal wizards and mobile quick quote tools must invoke or replicate this exact calculation engine without inventing hardcoded approximations or causing 1-rupee rounding errors.

4. **Security & Session Resilience Logic**:
   - Observation 2 and Observation 6 demonstrate that account suspensions (tenant or staff) are enforced live via a 5-second cache, and expired JWTs trigger HTTP 401.
   - Therefore, the mobile application architecture must handle 401 (session expired) and 403 (suspended) globally via Axios interceptors, displaying dedicated non-dismissible modals rather than generic crashes.

---

## 3. Caveats

1. **RBAC Middleware Coverage**: While `requirePermission(...permissions)` is defined in `backend/middleware/auth.js` and enforced on CRM (`leads.view`, `leads.create`, `leads.edit`, `leads.delete`), Inventory (`inventory.dispatch`), and Finance (`finance.create_invoice`, `finance.record_payment`), some operational routes rely solely on `requireTenantAuth` and `TENANT_ADMIN` authority checks. The mobile client must be proactive in role-gating views based on `user.permissions` or `user.role`.
2. **Third-Party OCR Dependencies**: `callCloudOcr` in `ocr.js` relies on `api.ocr.space` with a 12-second abort timeout. When internet access is slow or offline, the local buffer fallback and directory lookups (`MSEDCL_DIRECTORY_LOOKUP`) are engaged. The mobile UI must provide manual form inputs for every extracted field as a fallback.
3. **Database URL Environment**: Database connections use Supabase PostgreSQL via connection poolers (`DATABASE_URL` and `directUrl`). No schema alterations or migrations should be executed during read-only discovery.

---

## 4. Conclusion

The domain requirements, backend API contracts, database schemas, RBAC rules, and mathematical invariants of WhereReady Solar OS have been thoroughly investigated, verified, and documented in `f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\survey_report.md`.

Downstream mobile architects, UI/UX designers, and developers have an authoritative, verified reference covering:
- 48 discovered features with exact input/output DTOs and error behaviors.
- 22 critical edge case behaviors (offline sync, token expiration, concurrency locks, statutory gating).
- Complete RBAC permission matrix mapping 3 system roles and 6 operational personas across all business modules.
- End-to-end lifecycle models for Leads, Projects, Inventory, Installations, Staff, Finance, Subsidies, and DISCOM.
- Full statutory compliance requirements for PM Surya Ghar and DISCOM net-metering.

No mock data or dummy schemas were introduced.

---

## 5. Verification Method

To independently verify the observations and contracts cited in this report:

1. **Verify Backend Automated Tests**:
   Execute the automated test suites using Node.js:
   ```powershell
   cd "f:\Company Products\solar-manager\backend"
   node test-staff-upgrade.js
   node test-modules-completion.js
   ```
   *Expected outcome*: 100% test passes across workforce, procurement, communications, automation, notifications, and RBAC endpoints.

2. **Verify Mobile Perspective Test Suite**:
   Execute the 10-perspective automated test suite:
   ```powershell
   cd "f:\Company Products\solar-manager\mobile-app"
   node test-perspectives.js
   ```
   *Expected outcome*: 100% test passes (18/18 tests) covering PM Surya Ghar subsidy caps, dynamic gear sizing, compulsory consumer number validation, 7 statutory DISCOM templates, stamp paper margin toggling, and electrical QA thresholds.

3. **Inspect Core Specification Files**:
   - Master Domain & API Report: `f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\survey_report.md`
   - Database Schema: `f:\Company Products\solar-manager\backend\prisma\schema.prisma`
   - Route Controllers: `f:\Company Products\solar-manager\backend\routes\tenant\*.js`
   - Mobile API Endpoints: `f:\Company Products\solar-manager\mobile-app\src\api\endpoints.ts`
   - Financial Engine: `f:\Company Products\solar-manager\backend\services\solarCalculator.js`
