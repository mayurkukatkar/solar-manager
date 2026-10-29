# Backend, Database, Auth & Financial Architecture Survey Report

## 1. Observation

### 1.1 Repository Structure & Package Manifests
- **Repository Root**:
  - `backend/`: Express.js backend with Prisma ORM.
  - `web-client/`: Next.js 16.3.5 (App Router), React 19.2.8, Tailwind CSS v4, Lucide React, Recharts.
  - `mobile-app/`: React Native 0.88.0, Expo ~58.0.16, Lucide React Native.
  - `frontend/`: Abandoned directory containing only `node_modules`. No `package.json` exists.
  - `docs/`: System documentation (`API.md`, `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `IMPLEMENTATION_STATUS.md`, `MASTER_ERP_SPECIFICATION.md`).

- **Backend Package Manifest (`backend/package.json`)**:
  - `scripts`:
    ```json
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "postinstall": "prisma generate",
    "build": "prisma generate"
    ```
  - `dependencies`: `@supabase/supabase-js` (^2.118.0), `bcryptjs` (^3.0.3), `cloudinary` (^1.41.3), `cookie-parser` (^1.4.7), `cors` (^2.8.6), `dotenv` (^17.4.2), `express` (^5.2.1), `jsonwebtoken` (^9.0.3), `multer` (^2.3.0), `multer-storage-cloudinary` (^4.0.0), `nodemailer` (^10.0.9), `pdf-lib` (^1.17.1), `pdfkit` (^0.20.2), `zod` (^4.6.5).
  - `devDependencies`: `@prisma/client` (^5.22.0), `nodemon` (^3.1.14), `prisma` (^5.22.0).
  - Note: `@prisma/client` is in `devDependencies` rather than `dependencies`.
  - Note: No decimal arithmetic library (e.g. `decimal.js`, `bignumber.js`) is installed.

- **Web Client Package Manifest (`web-client/package.json`)**:
  - `scripts`: `dev`: `next dev`, `build`: `next build`, `start`: `next start`, `lint`: `eslint`.
  - Next.js 16.3.5, React 19.2.8, Tailwind CSS v4.

- **Mobile App Package Manifest (`mobile-app/package.json`)**:
  - `scripts`: `start`: `expo start`, `android`: `expo run:android`, `ios`: `expo run:ios`, `web`: `expo start --web`.
  - React Native 0.88.0, Expo 58.0.16.

---

### 1.2 Database Schema & Tenancy Mapping (`backend/prisma/schema.prisma`)
The schema contains 1,711 lines defining 68 models, 4 enums (`TenantStatus`, `RoleType`, `LeadStatus`, `DocumentStatus`), and 1 generator (`prisma-client-js`) targeting PostgreSQL via Supabase.

#### Model Tenancy Classification
1. **Tenant-Rooted Models (Explicit `tenantId: String` column with Foreign Key to `Tenant.id`)** (27 models):
   - `Subscription`, `User`, `Lead`, `Customer`, `SiteSurvey`, `Quotation`, `ProposalTemplate`, `Product`, `Warehouse`, `StockLedger`, `GoodsReceipt`, `MaterialDispatch`, `StockTransfer`, `PurchaseOrder`, `Project`, `SupportTicket`, `AMC`, `Invoice`, `SubsidyApplication`, `DiscomApplication`, `LoanApplication`, `InstallationJob`, `InstallationChecklistTemplate`, `CompletionCertificate`, `DocumentType`, `Document`, `DocumentRequest`, `DocumentTag`, `TenantNotification`, `CommunicationLog`, `AutomationRule`, `Department`, `Staff`, `ProjectStaffAssignment`.
2. **Platform-Wide Models (No `tenantId`)** (3 models):
   - `Tenant` (primary multi-tenant entity)
   - `Plan` (platform subscription tiers)
   - `PlatformLead` (inbound demo requests from marketing website)
   - `Announcement` (platform broadcast notices with `target: ALL | SPECIFIC_PLAN | SPECIFIC_TENANT`)
3. **Child / Sub-Entities (NO direct `tenantId` column, linked through parent record)** (29 models):
   - CRM: `LeadActivity` (`leadId`), `LeadFollowUp` (`leadId`), `LeadNote` (`leadId`)
   - Quotations: `QuotationItem` (`quotationId`)
   - Inventory: `StockBalance` (`productId`, `warehouseId`), `SerialNumber` (`productId`), `GoodsReceiptItem` (`goodsReceiptId`), `MaterialDispatchItem` (`materialDispatchId`), `StockTransferItem` (`stockTransferId`), `PurchaseOrderItem` (`purchaseOrderId`)
   - Projects: `ProjectStageHistory` (`projectId`), `ProjectTimelineEvent` (`projectId`), `ProjectStatusUpdate` (`projectId`), `ProjectTask` (`projectId`), `ProjectTaskDependency` (`taskId`, `prerequisiteId`), `ProjectMilestone` (`projectId`), `ProjectMaterialRequirement` (`projectId`), `ProjectCost` (`projectId`)
   - Support & Finance: `ServiceVisit` (`ticketId`), `Payment` (`invoiceId`)
   - Installation: `InstallationAssignment` (`installationId`), `InstallationChecklistItem` (`templateId`), `InstallationChecklistResponse` (`installationId`), `InstallationPhoto` (`installationId`), `InstallationMaterialConsumption` (`installationId`), `InstallationIssue` (`installationId`)
   - Documents: `DocumentVersion` (`documentId`), `DocumentActivity` (`documentId`), `DocumentTagRelation` (`documentId`, `tagId`)

#### Migrations Directory
- `backend/prisma/migrations/`: **Directory DOES NOT EXIST**.
- Schema changes have been applied using `prisma db push` and ad-hoc scripts (`fix_schema.js`, `update_documents_schema.js`). No migration history is tracked in version control.

---

### 1.3 Authentication, Session & Multi-Tenancy Architecture
- **JWT Generation (`backend/routes/auth.js:76-80`)**:
  ```javascript
  const token = jwt.sign(
    { userId: user.id, role: user.role, tenantId: user.tenantId, permissions: effectivePermissions },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  ```
  Note: Token sets `userId: user.id`, but DOES NOT set `id: user.id`.
- **JWT Verification & Context (`backend/middleware/auth.js:51-109`)**:
  - Checks `req.cookies?.tenant_token` or `req.headers.authorization` (`Bearer <token>`).
  - Verifies token against `JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key'`.
  - Live tenant status check: queries `prisma.tenant.findUnique` with a 5-second in-memory cache (`tenantStatusCache`). Blocks `SUSPENDED` and `CANCELLED` tenants with 403.
  - Live employee status check: for `TENANT_SUB_ADMIN`, queries `prisma.staff.findFirst`. Blocks `SUSPENDED` and `INACTIVE` staff with 403.
  - Sets `req.user = payload` (contains `userId`, `role`, `tenantId`, `permissions`).
- **Granular RBAC Middleware (`backend/middleware/auth.js:113-149`)**:
  - `requirePermission(...permissions)` is defined and exported.
  - If `req.user.role === 'TENANT_ADMIN'`, automatically calls `next()`.
  - If `TENANT_SUB_ADMIN`, queries `prisma.user.findUnique({ where: { id: req.user.userId }, select: { permissions: true } })`.
- **Actual RBAC Usage Across Routes**:
  - A workspace search for `requirePermission` across all 26 route files returned **0 results**.
  - `staff.js` implements its own local `requireStaffAccess` checking `perms.includes('staff.view')` or `perms.includes('staff.edit')`.
  - No other route file in the backend uses `requirePermission`.

---

### 1.4 Comprehensive API Endpoint Map
The backend mounts 26 route files across Express.

| Category | File | Base Prefix | Key Endpoints | Middleware |
|---|---|---|---|---|
| Platform Auth | `routes/auth.js` | `/api/auth` | `POST /login`, `POST /force-reset-password`, `GET /me`, `POST /logout` | Public / Cookie-Bearer |
| Super Admin | `routes/admin/superAdmin.js` | `/api/super-admin` | `GET/POST /tenants`, `GET/PUT /tenants/:id/status`, `GET/POST/PUT/DELETE /plans`, `GET /subscriptions`, `GET /kpis`, `GET/POST/PATCH/DELETE /platform-leads` | `requireSuperAdmin` |
| CRM & Leads | `routes/tenant/crm.js` | `/api/tenant` | `GET /leads/dashboard`, `GET/POST /leads`, `GET/PATCH/DELETE /leads/:id`, `POST /leads/:id/followups`, `POST /leads/:id/notes`, `POST /leads/:id/convert`, `GET /leads/:id/quotations` | `requireTenantAuth` |
| Customers | `routes/tenant/crm.js` | `/api/tenant` | `GET /customers`, `GET /customers/:id` | `requireTenantAuth` |
| Quotations Engine | `routes/tenant/quotations.js` | `/api/tenant` | `GET/POST /quotations`, `GET/PATCH/DELETE /quotations/:id`, `POST /quotations/:id/convert`, `POST /quotations/:id/revision`, `POST /quotations/:id/duplicate`, `POST /quotations/:id/share` | `requireTenantAuth` |
| Proposal Templates | `routes/tenant/templates.js` | `/api/tenant` | `GET/POST /templates`, `GET/PATCH/DELETE /templates/:id`, `POST /templates/:id/duplicate`, `POST /templates/:id/set-default` | `requireTenantAuth` |
| Site Surveys | `routes/tenant/surveys.js` | `/api/tenant` | `GET/POST /surveys`, `GET/PATCH/DELETE /surveys/:id`, `PATCH /surveys/:id/status`, `POST /surveys/:id/photos`, `POST /surveys/:id/convert-to-quote` | `requireTenantAuth` |
| Projects & BOM | `routes/tenant/crm.js` | `/api/tenant` | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `PATCH /projects/:id/stage`, `PATCH /projects/:id/status`, `POST /projects/:id/tasks`, `PATCH /tasks/:id`, `POST /projects/:id/milestones`, `PATCH /milestones/:id`, `POST /projects/:id/materials`, `PATCH /materials/:id` | `requireTenantAuth` |
| Installations | `routes/tenant/installations.js` (mounted via `operations.js:198`) | `/api/tenant/installations` | `GET /dashboard`, `GET /`, `POST /schedule`, `GET /:id`, `PUT /:id/status` | Mounted in `operations.js` with `requireTenantAuth` |
| Operations (Legacy) | `routes/tenant/operations.js` | `/api/tenant` | `GET/POST /surveys`, `POST /surveys/:id/photos`, `GET/POST /quotations`, `GET /quotations/:id/pdf` | `requireTenantAuth` (Shadows `quotations.js` & `surveys.js`) |
| Workflow (Legacy) | `routes/tenant/workflow.js` | `/api/tenant` | `POST /customers/:id/survey`, `POST /surveys/:id/quote`, `POST /quotations/:id/project`, `POST /projects/:id/invoice` | `requireTenantAuth` (Duplicates convert routes) |
| Inventory & Stock | `routes/tenant/crm.js` | `/api/tenant` | `GET/POST /products`, `PATCH /products/:id`, `GET /inventory/dashboard`, `GET /inventory/products`, `GET /inventory/warehouses`, `GET /inventory/stock-ledger`, `GET /inventory/serial-numbers`, `POST /inventory/dispatch`, `POST /inventory/receipt` | `requireTenantAuth` |
| Procurement & PO | `routes/tenant/procurement.js` | `/api/tenant` | `GET/POST /procurement`, `GET /procurement/pos`, `GET /procurement/:id`, `PATCH /procurement/:id/status`, `DELETE /procurement/:id` | `requireTenantAuth` |
| Finance & Invoicing | `routes/tenant/finance.js` | `/api/tenant` | `GET /finance/stats`, `GET/POST /finance`, `GET/DELETE /finance/:id`, `GET /invoices/:id/pdf`, `POST /finance/convert-quotation`, `POST /finance/milestone-invoices`, `GET/POST /invoices/:id/payments`, `GET /invoices/:id/receipt/:paymentId`, `GET /invoices/:id/whatsapp-payload` | `requireTenantAuth` |
| DISCOM Statutory | `routes/tenant/discom.js` | `/api/tenant` | `GET /projects/:projectId/discom`, `POST /projects/:projectId/discom`, `PATCH /projects/:projectId/discom/stage`, `POST /projects/:projectId/discom/upload` | `requireTenantAuth` |
| PM Surya Ghar Subsidy | `routes/tenant/subsidy.js` | `/api/tenant` | `GET/POST /subsidies`, `GET/PATCH/DELETE /subsidies/:id`, `POST /pmsuryaghar/smart-parse`, `POST /pmsuryaghar/bulk-import`, `POST /pmsuryaghar/:id/verify-bank` | `requireTenantAuth` |
| Solar Loans | `routes/tenant/loans.js` | `/api/tenant` | `GET/POST /loans`, `GET/PATCH/DELETE /loans/:id` | `requireTenantAuth` |
| AMC & Warranty | `routes/tenant/amc.js` | `/api/tenant` | `GET/POST /amcs`, `GET/PATCH/DELETE /amcs/:id`, `GET /projects/:projectId/warranty` | `requireTenantAuth` |
| Support Tickets | `routes/tenant/support.js` | `/api/tenant` | `GET/POST /tickets`, `PATCH /tickets/:id/status`, `POST /tickets/:id/visits` | `requireTenantAuth` |
| Staff Management | `routes/tenant/staff.js` | `/api/tenant` | `GET /staff/overview`, `GET/POST /staff`, `GET/PATCH/DELETE /staff/:id`, `PATCH /staff/:id/status`, `POST /staff/:id/suspend`, `POST /staff/:id/reactivate`, `POST /staff/:id/resend-credentials`, `POST/DELETE /staff/:id/account`, `GET /departments`, `POST /departments`, `GET /staff/projects/assignments`, `POST /staff/:id/assign-project` | `requireTenantAuth` + `requireStaffAccess` |
| Documents Hub | `routes/tenant/documents.js` | `/api/tenant` | `GET /documents`, `GET /documents/projects-summary`, `GET /projects/:projectId/document-checklist`, `POST /documents/upload`, `GET/PATCH/DELETE /documents/:id`, `POST /documents/:id/verify`, `POST /documents/:id/reject`, `POST /documents/:id/version`, `GET /document-settings`, `GET /projects/:projectId/document-readiness`, `GET /documents/:id/secure-url` | `requireTenantAuth` |
| OCR Bill Scanning | `routes/tenant/ocr.js` | `/api/tenant` | `POST /ocr/scan-bill`, `POST /ocr/fetch-consumer` | **NO AUTHENTICATION** (Public) |
| Users & Invites | `routes/tenant/users.js` | `/api/tenant` | `GET /users`, `POST /users/invite`, `PATCH /users/:id/role`, `POST /users/:id/reset-password`, `DELETE /users/:id` | `requireTenantAuth` |
| Tenant Settings | `routes/tenant/settings.js` | `/api/tenant` | `GET/PATCH /settings`, `POST /settings/upload` | `requireTenantAuth` |
| Notifications | `routes/tenant/notifications.js` | `/api/tenant` | `GET/POST /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `DELETE /notifications/:id` | `requireTenantAuth` |
| Communications | `routes/tenant/communication.js` | `/api/tenant` | `GET /communication/messages`, `GET /communication/templates`, `POST /communication/send` | `requireTenantAuth` |
| Automation Rules | `routes/tenant/automation.js` | `/api/tenant` | `GET/POST /automation/rules`, `PATCH /automation/rules/:id/toggle`, `POST /automation/rules/:id/test`, `DELETE /automation/rules/:id` | `requireTenantAuth` |
| Audit Trail | `routes/tenant/auditLogs.js` | `/api/tenant` | `GET/POST /audit-logs`, `GET /audit-logs/export` | `requireTenantAuth` |
| Tenant Dashboard | `routes/tenant/dashboard.js` | `/api/tenant` | `GET /dashboard` | `requireTenantAuth` |

---

### 1.5 Financial & Solar Calculation Engine (`backend/services/solarCalculator.js`)
The service defines the core commercial and engineering math:
- `calculateSystemCapacity`: DC capacity = `(wattage * qty) / 1000`. Estimated roof area = `dcCapacityKw * 65` sq.ft.
- `calculateSolarGeneration`: Annual yield = `capacity * 1460` kWh. 25-year compounding degradation at 0.7%/year (`annualGen * Math.pow(1 - 0.007, year - 1)`). 12-month solar irradiance curve. CO2 reduction = `annualGen * 0.82` kg. Tree equivalent = `co2 / 20`.
- `calculateIndicativeSubsidy`: Residential only. 1kW = ₹30,000; 2kW = ₹60,000; ≥3kW = ₹78,000 cap. Commercial/Industrial = ₹0.
- `calculateFinancialROI`: Year 1 savings = `annualGen * tariff`. Payback = `netInvestment / annualSavings`. 25-year cash flow with 3% annual grid tariff escalation, O&M OPEX starting Year 6 (₹600/kW), and inverter refurbishing reserve at Year 12 (₹4,500/kW). Commercial accelerated depreciation under Section 32 at 40% (25.17% tax benefit).
- `calculateLoanEMI`: Standard EMI formula: `(P * r * (1+r)^n) / ((1+r)^n - 1)`.
- `calculateCommercialPricing`: Base amounts, tax calculations (13.8% composite solar GST vs individual 12%/18%), subtotal, overall discount, grand total, and currency in words.
- `generateMilestones`: 4-stage schedule: Advance (20%), Material Dispatch (60%), Installation (15%), Commissioning (5%).
- `formatINR` & `toIndianWords`: Indian numbering format (Lakhs & Crores).

---

### 1.6 Tooling, Test Execution & Test Results
- **Test execution command**: `node --test "backend/test/*.test.js"`
- **Result**:
  - `solarCalculator.test.js`: 7 tests passed (capacity, generation, subsidy, ROI, commercial pricing, milestones, Indian words).
  - `quotationsApi.test.js`: 2 tests passed (isolated templates, duplicate quote).
  - `settingsApi.test.js`: 1 test passed (tenant configuration, bank details, prefixes).
  - `e2eProposalBuilder.test.js`: 3 tests passed (catalog retrieval, 6-step quote creation, duplication).
  - `unifiedTemplateParity.test.js`: **1 test FAILED**:
    ```
    AssertionError [ERR_ASSERTION]: Missing key financial/technical element: PM Surya Ghar Muft Bijli Yojana
        at Object.<anonymous> (f:\Company Products\solar-manager\backend\test\unifiedTemplateParity.test.js:49:10)
    ```
    Inspection revealed that `mobile-app/src/services/pdfService.ts` is missing the exact substring `'PM Surya Ghar Muft Bijli Yojana'`, causing parity assertion failure.
  - Total: 15 tests, 14 passed, 1 failed (duration: 5.9s).
- **Standalone test scripts**:
  - `test-modules-completion.js`, `test-staff-upgrade.js`, `test-surveys-upgrade.js`, `test.js`.
  - These scripts attempt direct HTTP and Prisma connections to external Supabase databases unless executed against a local mock/test database.

---

## 2. Logic Chain

### 2.1 Multi-Tenant Isolation Vulnerability on Child Entities
1. **Observation**: `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, and `ServiceVisit` do NOT have a `tenantId` column in `schema.prisma`.
2. **Observation**: In `crm.js`:
   - Line 1557: `prisma.projectTask.update({ where: { id: req.params.id } })`
   - Line 1576: `prisma.projectMilestone.create({ data: { projectId: req.params.id } })` without checking if `project.tenantId === req.user.tenantId`
   - Line 1595: `prisma.projectMilestone.update({ where: { id: req.params.id } })`
   - Line 1613: `prisma.projectMaterialRequirement.create({ data: { projectId: req.params.id } })` without checking if `project.tenantId === req.user.tenantId`
   - Line 1632: `prisma.projectMaterialRequirement.update({ where: { id: req.params.id } })`
3. **Observation**: In `finance.js`:
   - Line 1450: `prisma.serviceVisit.create({ data: { ticketId: req.params.id } })` without verifying ticket tenant ownership.
4. **Logic Deduction**: Because these queries and mutations update records strictly by primary key `id` without checking tenant ownership either through a direct column or a parent relation filter (`project: { tenantId }`), a user authenticated under Tenant A who knows or discovers an ID of a task, milestone, or material requirement belonging to Tenant B can mutate or corrupt Tenant B's project data.
5. **Conclusion**: Direct multi-tenant isolation failure exists on project child entities and service visits.

---

### 2.2 JWT Token Payload Discrepancy (`req.user.userId` vs `req.user.id`)
1. **Observation**: In `routes/auth.js:77`, the JWT is minted with:
   `{ userId: user.id, role: user.role, tenantId: user.tenantId, permissions: effectivePermissions }`. The key `id` is NOT set on the payload.
2. **Observation**: In `middleware/auth.js:104`, `req.user = payload`.
3. **Observation**: A grep search across `routes/tenant/` revealed 36 instances where route handlers access `req.user.id` directly:
   - `auditLogs.js:86, 144`: `actorId: req.user.id` -> `actorId` recorded as `undefined`.
   - `crm.js:204, 503, 530, 838, 951, 1168, 1177, 1188, 1341, 1352, 1452, 1484, 1494`: `req.user.id` stored in `performedBy`, `userId`, `createdBy`, `changedBy` -> stored as `undefined`.
   - `quotations.js:499, 612, 629, 829, 1058, 1073, 1135, 1176, 1214, 1344`: audit trails and revision histories save `savedBy: undefined`.
   - `users.js:272`: `if (id === req.user.id)` check to prevent self-deletion fails because `req.user.id` is `undefined`, so a tenant admin could inadvertently delete their own account.
4. **Logic Deduction**: Because the JWT payload defines `userId` but code downstream assumes `id`, all audit attribution, creator tracking, and self-identity checks referencing `req.user.id` fail silently with `undefined`.
5. **Conclusion**: Authentication payload normalization is required across auth minting and middleware (`req.user.id = payload.userId`).

---

### 2.3 Unauthenticated Endpoints Under `/api/tenant/` Prefix
1. **Observation**: In `routes/tenant/ocr.js:310`, `router.post('/api/tenant/ocr/scan-bill', async (req, res) => ...)` has NO authentication middleware attached.
2. **Observation**: In `routes/tenant/ocr.js:359`, `router.post('/api/tenant/ocr/fetch-consumer', async (req, res) => ...)` has NO authentication middleware attached.
3. **Observation**: `server.js:38` sets `express.json({ limit: '25mb' })`.
4. **Logic Deduction**: Any anonymous external client can POST 25MB payloads to `/api/tenant/ocr/scan-bill`, triggering external OCR API calls or base64 decoding loops, creating a denial-of-service and API rate exhaustion attack surface.
5. **Conclusion**: `requireTenantAuth` must be applied to all endpoints under `/api/tenant/ocr/`.

---

### 2.4 Granular RBAC Middleware Disconnect
1. **Observation**: `middleware/auth.js:113` implements `requirePermission(...permissions)` for granular RBAC.
2. **Observation**: `docs/SECURITY.md:28` specifies: "Every API endpoint MUST verify: If role is TENANT_SUB_ADMIN, check if req.user.permissions.includes('module.action'). If false, throw 403 Forbidden."
3. **Observation**: A search across all tenant routes revealed that `requirePermission` is imported and used in **zero** route files.
4. **Logic Deduction**: Even though tenant admins can configure fine-grained permissions for employees in the database (`User.permissions`), the backend does not enforce these permissions on any operational or financial route. Any employee with `TENANT_SUB_ADMIN` can view, mutate, or delete leads, quotations, invoices, payments, inventory, or projects.
5. **Conclusion**: Granular RBAC enforcement is unimplemented at the route handler layer.

---

### 2.5 Financial Precision & GST Discount Arithmetic Discrepancy
1. **Observation**: `backend/services/solarCalculator.js:290-304` calculates tax on each item based on `item.discount`:
   `const baseAmount = (qty * unitPrice) - discount; const itemTax = Math.round(baseAmount * (taxRate / 100)); totalTax += itemTax;`
2. **Observation**: Lines 322-328 apply `overallDiscount`:
   `const discountAmount = Math.max(0, Math.min(subtotal, Number(overallDiscount) || 0)); const taxableAmount = Math.max(0, subtotal - discountAmount);`
   However, if `useCompositeSolarGST` is `false`, `totalTax` is NOT recalculated or reduced by `overallDiscount`.
3. **Logic Deduction**: When an overall commercial discount is applied to a quotation, the customer is billed full tax on the pre-discount item total, in direct conflict with Indian GST laws where trade discounts allowed before or at the time of supply must reduce the taxable value for GST calculation.
4. **Observation**: All arithmetic throughout `solarCalculator.js` and `finance.js` uses standard JavaScript double-precision floating point numbers (`Number`, `Math.round`, `parseFloat`) stored in PostgreSQL as `Float`.
5. **Logic Deduction**: Floating-point rounding can cause 1-rupee discrepancies across milestone allocations (e.g. 20% + 60% + 15% + 5% of odd totals) and invoice payment balance tracking.
6. **Conclusion**: Financial arithmetic requires GST discount correction and currency-safe rounding.

---

### 2.6 Route Shadowing & Redundancy
1. **Observation**: `server.js:59-72` mounts `quotationsRoutes`, then `surveysRoutes`, then `operationsRoutes`.
2. **Observation**: `operations.js:15` registers `router.get('/api/tenant/surveys')` and `router.post('/api/tenant/surveys')`.
3. **Observation**: `surveys.js:41` registers `router.get('/api/tenant/surveys')` and `router.post('/api/tenant/surveys')`.
4. **Observation**: `operations.js:63` registers `router.get('/api/tenant/quotations')` and `router.post('/api/tenant/quotations')`.
5. **Observation**: `quotations.js:42` registers `router.get('/api/tenant/quotations')` and `router.post('/api/tenant/quotations')`.
6. **Logic Deduction**: Because Express executes middleware and routes in the order they are mounted, the route handlers in `operations.js` for `/surveys` and `/quotations` are completely shadowed by `surveys.js` and `quotations.js`. `operations.js` is acting as dead/conflicting legacy code.
7. **Observation**: `workflow.js` defines primitive transitions (`POST /customers/:id/survey`, `POST /surveys/:id/quote`, `POST /quotations/:id/project`, `POST /projects/:id/invoice`) that duplicate and conflict with the production-grade conversion endpoints in `quotations.js:856` (`/quotations/:id/convert`) and `surveys.js:531` (`/surveys/:id/convert-to-quote`).
8. **Conclusion**: `operations.js` and `workflow.js` contain dead, redundant routes that should be consolidated.

---

## 3. Caveats
1. **Live Production Database Not Queried**: Safeguard R4 strictly forbids connecting to live external databases. All Prisma schema and model analysis was performed from `prisma/schema.prisma` and generated `@prisma/client` types. The existing Supabase PostgreSQL instance was not accessed.
2. **Frontend UI Parity**: Analysis of web client React components and mobile screen views was scoped to interface contracts and integration parity (e.g. verifying the failure in `unifiedTemplateParity.test.js`). Detailed frontend DOM and UX analysis is delegated to the Frontend Explorer.
3. **Cloudinary / OCR.space Third-Party Uptime**: The external OCR endpoint uses OCR.space with a demo key (`helloworld`). Its live availability or quota was not tested to avoid external service calls.
4. **No Caveats Beyond Above**: All conclusions are derived strictly from code inspection, schema analysis, and local test execution.

---

## 4. Conclusion

### 4.1 Architecture & Database Assessment
The backend architecture is built on Express.js with Prisma ORM. The data model is comprehensive (68 models covering the complete solar lifecycle from leads to customers, surveys, quotations, projects, inventory, installations, invoices, subsidies, and AMC). However:
- Version-controlled Prisma migrations are absent (currently reliant on `db push`).
- Sub-entities lack direct `tenantId` columns, making mutation endpoints vulnerable to cross-tenant data tampering when queries omit parent relationship filters.

### 4.2 Security & Authentication Assessment
- Multi-tenancy isolation is effective on primary entities (Leads, Quotations, Invoices, Customers) via `req.user.tenantId`.
- Critical security gaps exist on project sub-entities (`tasks`, `milestones`, `materials`, `service visits`), unauthenticated OCR endpoints (`/api/tenant/ocr/*`), and public static file serving (`/uploads`).
- A JWT token property mismatch (`payload.userId` vs `req.user.id`) silently breaks audit attribution and self-protection checks across 36 route locations.
- Granular RBAC (`requirePermission`) is completely unenforced across all operations and finance routes.

### 4.3 Financial Engine Assessment
`solarCalculator.js` provides comprehensive engineering and commercial logic for Indian rooftop solar (generation modeling, 25-year cash flow, PM Surya Ghar central subsidy caps, and milestone payment schedules). However, trade discount GST arithmetic is flawed when individual item GST is used, and floating-point math lacks precision safeguards.

### 4.4 Recommended Implementation Actions for Subsequent Phases

| Priority | Risk / Gap | Target Files | Recommended Remediation |
|---|---|---|---|
| **P0 - Critical** | Multi-tenant isolation bypass on sub-entities | `backend/routes/tenant/crm.js`, `finance.js` | Enforce parent relation check: `where: { id, project: { tenantId: req.user.tenantId } }` on tasks, milestones, materials, and service visits. |
| **P0 - Critical** | JWT identity mismatch (`userId` vs `id`) | `backend/middleware/auth.js` | Normalize `req.user = { id: payload.userId, ...payload }` in `requireTenantAuth` and `requireSuperAdmin`. |
| **P0 - Critical** | Unauthenticated OCR endpoints | `backend/routes/tenant/ocr.js` | Attach `requireTenantAuth` to `POST /api/tenant/ocr/scan-bill` and `/fetch-consumer`. |
| **P1 - High** | Granular RBAC enforcement | `backend/routes/tenant/*.js` | Apply `requirePermission('leads.view')`, `requirePermission('finance.create_invoice')`, etc., to all tenant routes. |
| **P1 - High** | Financial GST discount arithmetic | `backend/services/solarCalculator.js` | Adjust `calculateCommercialPricing` so that `overallDiscount` proportionally reduces taxable item bases before tax computation. |
| **P1 - High** | Route shadowing & dead code | `backend/routes/tenant/operations.js`, `workflow.js` | Deprecate or remove shadowed endpoints in `operations.js`; harmonize workflow transitions into module controllers. |
| **P2 - Medium** | Mobile parity test failure | `mobile-app/src/services/pdfService.ts` | Add missing `'PM Surya Ghar Muft Bijli Yojana'` heading to mobile PDF template to satisfy `unifiedTemplateParity.test.js`. |
| **P2 - Medium** | Test command in package.json | `backend/package.json` | Update `"test"` script from `echo error` to `"node --test test/*.test.js"`. |
| **P2 - Medium** | Database migration baseline | `backend/prisma/` | Initialize proper Prisma migration history (`prisma migrate diff` / `prisma migrate resolve`) to track schema revisions safely without destructive pushes. |

---

## 5. Verification Method

### 5.1 Automated Unit & Integration Tests
Execute the Node built-in test runner for the backend test suite:
```powershell
node --test "f:\Company Products\solar-manager\backend\test\*.test.js"
```
- **Expected passing targets**:
  - `solarCalculator.test.js` (7 tests)
  - `quotationsApi.test.js` (2 tests)
  - `settingsApi.test.js` (1 test)
  - `e2eProposalBuilder.test.js` (3 tests)
- **Known failing target**:
  - `unifiedTemplateParity.test.js` (fails on line 49 due to missing `'PM Surya Ghar Muft Bijli Yojana'` in `mobile-app/src/services/pdfService.ts`).

### 5.2 Code Invalidation Conditions & Inspection Points
1. **Sub-entity isolation verification**:
   - Inspect `backend/routes/tenant/crm.js:1554-1568` (`PATCH /api/tenant/tasks/:id`). Invalidation condition: `prisma.projectTask.update` must verify `project: { tenantId: req.user.tenantId }`.
   - Inspect `backend/routes/tenant/crm.js:1592-1601` (`PATCH /api/tenant/milestones/:id`). Invalidation condition: `prisma.projectMilestone.update` must verify `project: { tenantId: req.user.tenantId }`.
   - Inspect `backend/routes/tenant/crm.js:1629-1640` (`PATCH /api/tenant/materials/:id`). Invalidation condition: `prisma.projectMaterialRequirement.update` must verify `project: { tenantId: req.user.tenantId }`.
2. **User ID token normalization**:
   - Inspect `backend/middleware/auth.js:104`. Invalidation condition: `req.user.id` must equal `req.user.userId`.
3. **OCR authentication check**:
   - Inspect `backend/routes/tenant/ocr.js:310`. Invalidation condition: `router.post('/api/tenant/ocr/scan-bill', requireTenantAuth, ...)`.
4. **GST discount computation**:
   - Run `solarCalculator.calculateCommercialPricing({ items: [{ unitPrice: 100, quantity: 1, taxRate: 18 }], overallDiscount: 20 })`. Invalidation condition: Taxable amount must be 80, tax must be 14.4 (or 14), not 18.
