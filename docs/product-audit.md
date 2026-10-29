# WhereReady Solar OS — Comprehensive Product & Architectural Audit

**Document Status**: Authoritative Baseline  
**Date**: 2026-10-29  
**Version**: 1.0.0  
**Scope**: Backend (Express + Prisma), Frontend Web-Client (Next.js 16 + React 19), Mobile App (React Native Expo 58), Database Schema (PostgreSQL Supabase), Security & Multi-Tenancy Architecture, Financial Calculation Engine, and Testing Baseline.

---

## 1. Executive Summary

WhereReady Solar OS is an enterprise-grade multi-tenant SaaS platform built specifically for Indian solar EPC companies, rooftop installers, vendors, and operations teams. The system manages the entire solar lifecycle:
- Lead capture, sizing, and 60-second quotation generation
- Technical site survey feasibility and rooftop engineering
- Commercial proposal generation with composite solar GST (13.8%) and 25-year cash flows
- EPC project management, BOM allocation, and milestone tracking
- Procurement and warehouse inventory management with PO stock receiving
- On-site mobile field installation QA (earthing resistance, anti-islanding trip, torque checks) and 2D barcode scanning
- Statutory DISCOM 5-stage gating state machine (MSEDCL/MERC 2019 templates)
- PM Surya Ghar Muft Bijli Yojana central subsidy portal (₹30,000 / ₹60,000 / ₹78,000 DBT funnel)
- Financial invoicing with 4-stage milestones (20% / 60% / 15% / 5%), payment tracking, and receipt generation
- Post-commissioning Annual Maintenance Contracts (AMC) and customer support ticketing

While the domain depth and data architecture are exceptionally comprehensive (68 Prisma models, 26 route files with over 100 endpoints, 58 web-client pages, and an Expo SDK 58 mobile app), this exhaustive audit identifies critical technical, security, UI, and financial risks that require remediation across subsequent implementation phases.

---

## 2. Codebase Structure & Package Manifests

### 2.1 Repository Topology
```
solar-manager/
├── backend/                       # Node.js Express 5.2.1 + Prisma 5.22.0 API server
│   ├── middleware/                # JWT authentication, tenancy check, RBAC
│   ├── prisma/                    # schema.prisma (68 models, 1711 lines)
│   ├── routes/                    # 26 route controllers (admin, auth, tenant)
│   ├── services/                  # solarCalculator, storageService, emailService, pdfGenerator
│   └── test/                      # Node test runner integration suites (*.test.js)
├── web-client/                    # Next.js 16.3.5 (App Router) + React 19.2.8 + Tailwind CSS v4
│   ├── src/app/                   # 58 pages: marketing (10), tenant (36), super-admin (12)
│   ├── src/components/            # Feature components (documents, marketing, pdf, quotations)
│   └── src/services/              # Frontend solarCalculator.ts, api client
├── mobile-app/                    # React Native 0.88.0 + Expo SDK 58 field operations app
│   ├── src/screens/               # Operations, CRM, Projects, Finance, Common
│   ├── src/services/              # pdfService, offlineSyncService, whatsappService
│   └── test-perspectives.js       # 10-perspective automated test suite (23 tests)
├── docs/                          # Architectural, API, database, and audit specifications
└── frontend/                      # Deprecated / abandoned directory (node_modules only)
```

### 2.2 Backend Dependencies (`backend/package.json`)
- **Runtime**: Node.js (CommonJS modules)
- **Framework**: `express` (`^5.2.1`), `cors` (`^2.8.6`), `cookie-parser` (`^1.4.7`), `dotenv` (`^17.4.2`)
- **ORM & Database**: `@prisma/client` (`^5.22.0` in devDependencies), `prisma` (`^5.22.0`), `@supabase/supabase-js` (`^2.118.0`)
- **Auth & Validation**: `jsonwebtoken` (`^9.0.3`), `bcryptjs` (`^3.0.3`), `zod` (`^4.6.5`)
- **File & Media Handling**: `multer` (`^2.3.0`), `cloudinary` (`^1.41.3`), `multer-storage-cloudinary` (`^4.0.0`)
- **PDF Generation**: `pdfkit` (`^0.20.2`), `pdf-lib` (`^1.17.1`)
- **Communication**: `nodemailer` (`^10.0.9`)
- **Manifest Anomalies**:
  - `@prisma/client` is declared in `devDependencies` rather than `dependencies`, risking container build failures in production environments where dev dependencies are pruned.
  - No high-precision decimal arithmetic package (e.g., `decimal.js`, `bignumber.js`) is installed; financial calculations currently rely on standard JavaScript double-precision IEEE 754 floats.
  - The `"test"` script is set to `"echo \"Error: no test specified\" && exit 1"` even though a functional test suite exists under `backend/test/*.test.js`.

### 2.3 Web-Client Dependencies (`web-client/package.json`)
- **Framework**: `next` (`16.3.5`), `react` (`19.2.8`), `react-dom` (`19.2.8`)
- **Styling**: `tailwindcss` (`^4`), `@tailwindcss/postcss` (`^4`)
- **Icons & Data Visualization**: `lucide-react` (`^1.45.0`), `recharts` (`^3.10.1`)
- **HTTP & PDF Client**: `axios` (`^1.20.0`), `html2pdf.js` (`^0.14.0`)
- **TypeScript & Linting**: `typescript` (`^5`), `eslint` (`^9`), `eslint-config-next` (`16.3.5`)
- **Configuration Anomalies**:
  - `web-client/next.config.ts` explicitly sets `typescript: { ignoreBuildErrors: true }`, suppressing compiler failures during build.
  - No shared UI primitive library (`components/ui`) exists; primitive elements (`Button`, `Input`, `Modal`, `Table`, `Badge`) are re-implemented inline across views.
  - No frontend automated test framework (Jest, Vitest, Playwright) is configured.

### 2.4 Mobile App Dependencies (`mobile-app/package.json`)
- **Framework**: React Native `0.88.0`, Expo SDK `~58.0.16`, React `19.3.0`
- **Navigation**: `@react-navigation/native` (`^7.5.1`), `@react-navigation/bottom-tabs` (`^7.21.0`), `@react-navigation/native-stack` (`^7.21.0`)
- **Hardware & Device Integrations**: `expo-camera` (`~58.0.11`), `expo-print` (`~58.0.7`), `expo-sharing` (`~58.0.19`), `expo-image-picker` (`~58.0.10`), `expo-document-picker` (`~58.0.4`)
- **Storage & State**: `@react-native-async-storage/async-storage` (`2.2.0`), `axios` (`^1.20.0`)
- **Iconography**: `lucide-react-native` (`^1.59.0`)

---

## 3. Database Schema & Multi-Tenancy Audit (68 Models)

The Prisma schema (`backend/prisma/schema.prisma`) comprises 1,711 lines defining 68 data models, 4 enums (`TenantStatus`, `RoleType`, `LeadStatus`, `DocumentStatus`), and connects to PostgreSQL.

### 3.1 Model Tenancy Classification

#### 1. Tenant-Rooted Models (27 Models)
These models include an explicit `tenantId String` column with a foreign key constraint linking directly to `Tenant(id)`:
1. `Subscription`: Tenant SaaS billing plan and limits
2. `User`: User accounts with role and permissions
3. `Lead`: Inbound solar prospect and sizing records
4. `Customer`: Converted clients with KYC and billing details
5. `SiteSurvey`: Technical rooftop audits and shade analysis
6. `Quotation`: Commercial quotes with line items and financial terms
7. `ProposalTemplate`: Reusable presentation templates for quotations
8. `Product`: Solar hardware catalog (panels, inverters, structures)
9. `Warehouse`: Physical storage facilities for solar inventory
10. `StockLedger`: Material movement and balance journal
11. `GoodsReceipt`: Received supplier shipments
12. `MaterialDispatch`: Outbound equipment dispatches for projects
13. `StockTransfer`: Inter-warehouse inventory transfers
14. `PurchaseOrder`: Hardware procurement orders to manufacturers
15. `Project`: Master EPC project execution dossiers
16. `SupportTicket`: Customer post-installation issues
17. `AMC`: Annual Maintenance Contracts
18. `Invoice`: Tax invoices with GST breakdown and milestone schedules
19. `SubsidyApplication`: PM Surya Ghar national portal submissions
20. `DiscomApplication`: Statutory grid interconnection records
21. `LoanApplication`: Solar rooftop financing and EMI tracking
22. `InstallationJob`: On-site construction work orders
23. `InstallationChecklistTemplate`: Standardized QA checklists
24. `CompletionCertificate`: Formal handover and commissioning signoffs
25. `DocumentType`: Tenant-customized document taxonomy
26. `Document`: Stored files, KYC, engineering drawings, and bills
27. `DocumentRequest`: Customer document request workflows
28. `DocumentTag`: Taxonomy tags for file categorization
29. `TenantNotification`: In-app tenant notifications
30. `CommunicationLog`: WhatsApp, SMS, and email interactions
31. `AutomationRule`: Workflow automation triggers and actions
32. `Department`: Organizational structure definitions
33. `Staff`: Employee profiles linked to departments
34. `ProjectStaffAssignment`: Technician and engineer project assignments

#### 2. Platform-Wide Models (4 Models)
These models are not scoped to any single tenant and are managed exclusively by Super Administrators:
1. `Tenant`: Tenant organizations (`name`, `slug`, `status`, `gstin`, `pan`)
2. `Plan`: Platform SaaS subscription tiers (`tier`, `priceMonthly`, `maxUsers`, `maxProjects`)
3. `PlatformLead`: Public demo requests captured from marketing pages
4. `Announcement`: System-wide broadcasts (`target: ALL | SPECIFIC_PLAN | SPECIFIC_TENANT`)

#### 3. Child / Sub-Entities (29 Models)
These models do NOT possess a direct `tenantId` column; their tenancy boundary is established through a parent foreign key relationship:
- **CRM Sub-entities**: `LeadActivity` (`leadId`), `LeadFollowUp` (`leadId`), `LeadNote` (`leadId`)
- **Quotation Sub-entities**: `QuotationItem` (`quotationId`)
- **Inventory Sub-entities**: `StockBalance` (`productId`, `warehouseId`), `SerialNumber` (`productId`), `GoodsReceiptItem` (`goodsReceiptId`), `MaterialDispatchItem` (`materialDispatchId`), `StockTransferItem` (`stockTransferId`), `PurchaseOrderItem` (`purchaseOrderId`)
- **Project Sub-entities**: `ProjectStageHistory` (`projectId`), `ProjectTimelineEvent` (`projectId`), `ProjectStatusUpdate` (`projectId`), `ProjectTask` (`projectId`), `ProjectTaskDependency` (`taskId`, `prerequisiteId`), `ProjectMilestone` (`projectId`), `ProjectMaterialRequirement` (`projectId`), `ProjectCost` (`projectId`)
- **Operations & Support Sub-entities**: `ServiceVisit` (`ticketId`), `Payment` (`invoiceId`)
- **Installation Sub-entities**: `InstallationAssignment` (`installationId`), `InstallationChecklistItem` (`templateId`), `InstallationChecklistResponse` (`installationId`), `InstallationPhoto` (`installationId`), `InstallationMaterialConsumption` (`installationId`), `InstallationIssue` (`installationId`)
- **Document Sub-entities**: `DocumentVersion` (`documentId`), `DocumentActivity` (`documentId`), `DocumentTagRelation` (`documentId`, `tagId`)

### 3.2 Database Migration Audit
- **Status**: The `backend/prisma/migrations/` directory is **missing from version control**.
- **Risk**: Database schema updates have historically been executed using `prisma db push` and manual migration scripts (`fix_schema.js`, `update_documents_schema.js`). In a production multi-tenant database, unmanaged schema pushes risk column drops, index locks, and data corruption.
- **Remediation**: Establish versioned migration baselines (`prisma migrate diff` / `prisma migrate resolve`) prior to introducing future schema adjustments.

---

## 4. Backend API Endpoints & Routing Audit (26 Route Files)

The Express application mounts 26 route files covering platform administration, authentication, and tenant operations.

### 4.1 Master Route Inventory

| Route Module | Mount Prefix | Key Endpoints | Middleware Attached | Assessment |
|---|---|---|---|---|
| `routes/auth.js` | `/api/auth` | `POST /login`, `POST /force-reset-password`, `GET /me`, `POST /logout` | Public / Cookie-Bearer | Sets `userId` instead of `id` in JWT payload |
| `routes/admin/superAdmin.js` | `/api/super-admin` | `GET/POST /tenants`, `GET/PUT /tenants/:id/status`, `GET/POST/PUT/DELETE /plans`, `GET /subscriptions`, `GET /kpis`, `GET/POST/PATCH/DELETE /platform-leads` | `requireSuperAdmin` | Strict platform admin isolation verified |
| `routes/tenant/crm.js` | `/api/tenant` | `GET /leads/dashboard`, `GET/POST /leads`, `GET/PATCH/DELETE /leads/:id`, `POST /leads/:id/followups`, `POST /leads/:id/notes`, `POST /leads/:id/convert`, `GET /leads/:id/quotations`, `GET /customers`, `GET /customers/:id`, `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `PATCH /projects/:id/stage`, `PATCH /projects/:id/status`, `POST /projects/:id/tasks`, `PATCH /tasks/:id`, `POST /projects/:id/milestones`, `PATCH /milestones/:id`, `POST /projects/:id/materials`, `PATCH /materials/:id`, `GET/POST /products`, `PATCH /products/:id`, `GET /inventory/dashboard`, `GET /inventory/products`, `GET /inventory/warehouses`, `GET /inventory/stock-ledger`, `GET /inventory/serial-numbers`, `POST /inventory/dispatch`, `POST /inventory/receipt` | `requireTenantAuth` | Contains sub-entity isolation vulnerabilities on tasks, milestones, and materials |
| `routes/tenant/quotations.js` | `/api/tenant` | `GET/POST /quotations`, `GET/PATCH/DELETE /quotations/:id`, `POST /quotations/:id/convert`, `POST /quotations/:id/revision`, `POST /quotations/:id/duplicate`, `POST /quotations/:id/share` | `requireTenantAuth` | Robust quotation engine; duplicates some routes in `operations.js` |
| `routes/tenant/templates.js` | `/api/tenant` | `GET/POST /templates`, `GET/PATCH/DELETE /templates/:id`, `POST /templates/:id/duplicate`, `POST /templates/:id/set-default` | `requireTenantAuth` | Fully isolated by `tenantId` |
| `routes/tenant/surveys.js` | `/api/tenant` | `GET/POST /surveys`, `GET/PATCH/DELETE /surveys/:id`, `PATCH /surveys/:id/status`, `POST /surveys/:id/photos`, `POST /surveys/:id/convert-to-quote` | `requireTenantAuth` | Shadows older endpoints in `operations.js` |
| `routes/tenant/installations.js` | `/api/tenant/installations` | `GET /dashboard`, `GET /`, `POST /schedule`, `GET /:id`, `PUT /:id/status` | `requireTenantAuth` | Mounted inside `operations.js:198` |
| `routes/tenant/operations.js` | `/api/tenant` | `GET/POST /surveys`, `POST /surveys/:id/photos`, `GET/POST /quotations`, `GET /quotations/:id/pdf` | `requireTenantAuth` | **Dead / Shadowed Code**: Overridden by `quotations.js` and `surveys.js` |
| `routes/tenant/workflow.js` | `/api/tenant` | `POST /customers/:id/survey`, `POST /surveys/:id/quote`, `POST /quotations/:id/project`, `POST /projects/:id/invoice` | `requireTenantAuth` | **Legacy Redundant Code**: Duplicates primary conversion endpoints |
| `routes/tenant/procurement.js` | `/api/tenant` | `GET/POST /procurement`, `GET /procurement/pos`, `GET /procurement/:id`, `PATCH /procurement/:id/status`, `DELETE /procurement/:id` | `requireTenantAuth` | Automatically increments warehouse stock upon `RECEIVED` status |
| `routes/tenant/finance.js` | `/api/tenant` | `GET /finance/stats`, `GET/POST /finance`, `GET/DELETE /finance/:id`, `GET /invoices/:id/pdf`, `POST /finance/convert-quotation`, `POST /finance/milestone-invoices`, `GET/POST /invoices/:id/payments`, `GET /invoices/:id/receipt/:paymentId`, `GET /invoices/:id/whatsapp-payload` | `requireTenantAuth` | Service visit creation lacks tenant check on parent ticket |
| `routes/tenant/discom.js` | `/api/tenant` | `GET /projects/:projectId/discom`, `POST /projects/:projectId/discom`, `PATCH /projects/:projectId/discom/stage`, `POST /projects/:projectId/discom/upload` | `requireTenantAuth` | Gated state machine enforces prerequisite statutory document validations |
| `routes/tenant/subsidy.js` | `/api/tenant` | `GET/POST /subsidies`, `GET/PATCH/DELETE /subsidies/:id`, `POST /pmsuryaghar/smart-parse`, `POST /pmsuryaghar/bulk-import`, `POST /pmsuryaghar/:id/verify-bank` | `requireTenantAuth` | Smart regex parser extracts application numbers, consumer IDs, and IFSC |
| `routes/tenant/loans.js` | `/api/tenant` | `GET/POST /loans`, `GET/PATCH/DELETE /loans/:id` | `requireTenantAuth` | Clean multi-tenant isolation |
| `routes/tenant/amc.js` | `/api/tenant` | `GET/POST /amcs`, `GET/PATCH/DELETE /amcs/:id`, `GET /projects/:projectId/warranty` | `requireTenantAuth` | Clean multi-tenant isolation |
| `routes/tenant/support.js` | `/api/tenant` | `GET/POST /tickets`, `PATCH /tickets/:id/status`, `POST /tickets/:id/visits` | `requireTenantAuth` | Clean multi-tenant isolation |
| `routes/tenant/staff.js` | `/api/tenant` | `GET /staff/overview`, `GET/POST /staff`, `GET/PATCH/DELETE /staff/:id`, `PATCH /staff/:id/status`, `POST /staff/:id/suspend`, `POST /staff/:id/reactivate`, `POST /staff/:id/resend-credentials`, `POST/DELETE /staff/:id/account`, `GET /departments`, `POST /departments`, `GET /staff/projects/assignments`, `POST /staff/:id/assign-project` | `requireTenantAuth` + `requireStaffAccess` | Fine-grained staff permissions checked via custom middleware |
| `routes/tenant/documents.js` | `/api/tenant` | `GET /documents`, `GET /documents/projects-summary`, `GET /projects/:projectId/document-checklist`, `POST /documents/upload`, `GET/PATCH/DELETE /documents/:id`, `POST /documents/:id/verify`, `POST /documents/:id/reject`, `POST /documents/:id/version`, `GET /document-settings`, `GET /projects/:projectId/document-readiness`, `GET /documents/:id/secure-url` | `requireTenantAuth` | Centralized document repository with verification workflow |
| `routes/tenant/ocr.js` | `/api/tenant` | `POST /ocr/scan-bill`, `POST /ocr/fetch-consumer` | **NO AUTH** | **Critical Security Gap**: Completely unauthenticated under `/api/tenant/` prefix |
| `routes/tenant/users.js` | `/api/tenant` | `GET /users`, `POST /users/invite`, `PATCH /users/:id/role`, `POST /users/:id/reset-password`, `DELETE /users/:id` | `requireTenantAuth` | Self-deletion check fails due to JWT `req.user.id` bug |
| `routes/tenant/settings.js` | `/api/tenant` | `GET/PATCH /settings`, `POST /settings/upload` | `requireTenantAuth` | Handles company branding, bank details, and sequence prefixes |
| `routes/tenant/notifications.js` | `/api/tenant` | `GET/POST /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `DELETE /notifications/:id` | `requireTenantAuth` | Clean multi-tenant isolation |
| `routes/tenant/communication.js` | `/api/tenant` | `GET /communication/messages`, `GET /communication/templates`, `POST /communication/send` | `requireTenantAuth` | Clean multi-tenant isolation |
| `routes/tenant/automation.js` | `/api/tenant` | `GET/POST /automation/rules`, `PATCH /automation/rules/:id/toggle`, `POST /automation/rules/:id/test`, `DELETE /automation/rules/:id` | `requireTenantAuth` | Clean multi-tenant isolation |
| `routes/tenant/auditLogs.js` | `/api/tenant` | `GET/POST /audit-logs`, `GET /audit-logs/export` | `requireTenantAuth` | Actor tracking logs `undefined` due to JWT `req.user.id` bug |
| `routes/tenant/dashboard.js` | `/api/tenant` | `GET /dashboard` | `requireTenantAuth` | Aggregates pipeline, capacity, revenue, and inventory runway |

### 4.2 Route Shadowing & Dead Code
In `server.js:59-72`, Express registers routers sequentially:
1. `app.use('/', quotationsRoutes)`
2. `app.use('/', surveysRoutes)`
3. `app.use('/', operationsRoutes)`
4. `app.use('/', workflowRoutes)`

Because `operations.js` registers handlers for `/api/tenant/surveys` (lines 15, 34) and `/api/tenant/quotations` (lines 63, 108), those routes are entirely unreachable because `quotations.js` and `surveys.js` intercept incoming requests first. Furthermore, `workflow.js` defines primitive conversion routes that contradict the robust workflows in `crm.js`, `quotations.js`, and `finance.js`.

---

## 5. Frontend Web-Client Audit (58 Pages)

### 5.1 Route Inventory & Categorization
The web client comprises 58 pages structured across four functional domains:
- **Public Marketing (10 routes)**: `/`, `/demo`, `/features`, `/how-it-works`, `/pricing`, `/privacy`, `/security`, `/terms`, `/login`, `/suspended`
- **Tenant Operations & ERP (36 routes)**:
  - Command: `/tenant/dashboard`
  - CRM: `/tenant/leads`, `/tenant/leads/[id]`, `/tenant/crm`, `/tenant/crm/[id]`
  - Engineering: `/tenant/surveys`, `/tenant/surveys/[id]`
  - Commercial: `/tenant/quotations`, `/tenant/quotations/pdf-demo`
  - Execution: `/tenant/projects`, `/tenant/projects/new`, `/tenant/projects/[id]`, `/tenant/tasks`
  - Installation: `/tenant/installation`, `/tenant/installation/jobs`, `/tenant/installation/[id]`
  - Inventory: `/tenant/inventory`, `/tenant/inventory/ledger`, `/tenant/inventory/products`, `/tenant/inventory/warehouses`, `/tenant/inventory/dispatch/new`, `/tenant/products`
  - Procurement: `/tenant/procurement`
  - Finance: `/tenant/finance`, `/tenant/loans`
  - Statutory: `/tenant/subsidy`, `/tenant/documents`
  - Service: `/tenant/service`, `/tenant/amc`
  - Team: `/tenant/staff`, `/tenant/users`
  - System: `/tenant/communication`, `/tenant/reports`, `/tenant/notifications`, `/tenant/settings`, `/tenant/audit-logs`
- **Super-Admin Platform (12 routes)**: `/super-admin/dashboard`, `/super-admin/leads`, `/super-admin/tenants`, `/super-admin/tenants/create`, `/super-admin/tenants/[id]`, `/super-admin/subscriptions`, `/super-admin/subscriptions/plans`, `/super-admin/features`, `/super-admin/integrations`, `/super-admin/security/audit-logs`, `/super-admin/support/tickets`, `/super-admin/cms/pages`

### 5.2 Absence of Standardized Shared UI Primitives
A critical architectural deficiency is the total absence of centralized UI primitives in `web-client/src/components/ui/`. Every page manually constructs:
- **Buttons**: Re-implementing padding, colors, hover states, and focus rings with ad-hoc Tailwind classes.
- **Inputs & Selects**: Inconsistent label spacing, border styles, and missing validation feedback.
- **Modals / Dialogs**: Handcrafted `fixed inset-0 z-50 flex items-center justify-center bg-black/60` overlays lacking standard `Escape` key listeners, scroll-locking, and focus trapping.
- **Tables**: Unstandardized tabular presentation lacking unified sorting, pagination, and empty state fallbacks.
- **Toasts**: Complete absence of a toast provider, leading developers to use blocking browser `alert()` dialogs in production code.

### 5.3 Dead Links & 404 Route Inventory
Seven user-facing action buttons and navigation links navigate to non-existent pages:
1. `tenant/installation/page.tsx:38`: `href="/tenant/installation/schedule"` -> **404**
2. `tenant/installation/page.tsx:95`: `href="/tenant/installation/calendar"` -> **404**
3. `tenant/installation/page.tsx:103`: `href="/tenant/installation/checklists"` -> **404**
4. `tenant/installation/jobs/page.tsx:52`: `href="/tenant/installation/schedule"` -> **404**
5. `tenant/inventory/page.tsx:44`: `href="/tenant/inventory/products/new"` -> **404**
6. `tenant/inventory/products/page.tsx:43`: `href="/tenant/inventory/products/new"` -> **404**
7. `tenant/projects/[id]/page.tsx:992`: `href="/tenant/quotations/new"` -> **404**

### 5.4 Mobile Responsiveness Gaps (<360px to 480px)
- **Modal Grid Compression**: Form modals (e.g., `tenant/leads/page.tsx:798, 823, 854`) utilize `grid grid-cols-2 gap-4` without responsive breakpoints (`grid-cols-1 sm:grid-cols-2`). On small mobile viewports (320px–360px), inputs are squeezed into ~120px width, causing severe label wrapping and unreadable inputs.
- **Touch Target Failures**: Table action buttons use `p-1` and `p-1.5` (~22px touch targets), failing WCAG 2.1 AA 44px minimum touch target requirements.
- **HTML5 Drag-and-Drop Incompatibility**: In `tenant/tasks/page.tsx`, Kanban card moves rely strictly on HTML5 desktop drag-and-drop (`onDragStart`, `onDrop`), which does not fire on mobile touchscreens. No touch fallback or quick status picker is provided.

---

## 6. Mobile Application Audit (Field Operations)

The mobile application (`mobile-app`) is an Expo SDK 58 / React Native 0.88 app providing field engineering tools:
1. **2D Hardware Barcode Scanner (`BarcodeScannerModal.tsx`)**:
   - Uses `expo-camera` to scan PV module and inverter QR codes and serial barcodes.
   - Computes target module quantities (`Math.ceil((capacity * 1000) / 540)`).
   - Prevents duplicate scans locally and commits verified serials to backend project records for DCR compliance.
2. **Installation QA Sign-Off (`InstallationQAModal.tsx`)**:
   - Enforces statutory electrical earthing and safety checks:
     - Earth Pit 1 Inverter (< 5.0 Ω)
     - Earth Pit 2 Structure (< 5.0 Ω)
     - Earth Pit 3 Lightning Arrestor (< 5.0 Ω)
     - Anti-islanding trip time (< 2.0s)
     - Insulation resistance (MΩ)
   - Torque audits (12–14 Nm), UV-rated DC conduit checks, surge protection device (SPD) verification.
3. **Statutory DISCOM Document Generation (`DiscomDocsModal.tsx`)**:
   - Generates 7 statutory MSEDCL/MERC templates (`WCR_FULL`, `WCR`, `AnnexureI`, `DCR`, `NetMetering`, `ConsumerVendor`, `StandardQuotation`).
   - Includes physical stamp paper toggle: Leaves a 115mm blank top margin on Page 1 to accommodate physical non-judicial treasury stamp paper.
4. **Offline Lead & Quote Caching (`offlineSyncService.ts`)**:
   - Persists draft leads and quick quotes to `@react-native-async-storage/async-storage` during network outages in rural or rooftop environments.

---

## 7. Critical Security Vulnerability Assessment

### 7.1 Vulnerability 1: Multi-Tenant Child Entity Isolation Bypass
- **Severity**: **P0 - Critical**
- **Location**: `backend/routes/tenant/crm.js:1557, 1576, 1595, 1613, 1632`; `backend/routes/tenant/finance.js:1450`
- **Mechanism**: Models `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, and `ServiceVisit` do not possess a direct `tenantId` column. The corresponding mutation endpoints update records strictly by primary key `id` without verifying tenant ownership of the parent `Project` or `SupportTicket`:
  ```javascript
  // crm.js:1557 — VULNERABLE
  const task = await prisma.projectTask.update({
    where: { id: req.params.id },
    data: { status, title, ... }
  });
  ```
- **Exploitation Impact**: An authenticated user of Tenant A who obtains or guesses an ID belonging to Tenant B can mutate, corrupt, or alter tasks, milestone deadlines, and material requirements of Tenant B's projects.
- **Remediation**: Enforce parent relationship filtering on every mutation:
  ```javascript
  where: { id: req.params.id, project: { tenantId: req.user.tenantId } }
  ```

### 7.2 Vulnerability 2: JWT Identity Normalization Discrepancy (`userId` vs `id`)
- **Severity**: **P0 - Critical**
- **Location**: `backend/routes/auth.js:76-80` and `backend/middleware/auth.js:104`
- **Mechanism**: The JWT token payload is minted with:
  ```javascript
  { userId: user.id, role: user.role, tenantId: user.tenantId, permissions: effectivePermissions }
  ```
  The payload does not define the property `id`. However, across 36 locations in `routes/tenant/`, route handlers access `req.user.id`:
  - `auditLogs.js:86, 144`: `actorId: req.user.id` -> Records `actorId` as `undefined`.
  - `crm.js:204, 503, 530, 838, 951, 1168, 1177, 1188, 1341, 1352, 1452, 1484, 1494`: Creator and modifier IDs recorded as `undefined`.
  - `quotations.js:499, 612, 629, 829, 1058, 1073, 1135, 1176, 1214, 1344`: Audit trails record `savedBy: undefined`.
  - `users.js:272`: `if (id === req.user.id)` check to prevent self-deletion evaluates `id === undefined` (false), allowing tenant administrators to delete their own account.
- **Remediation**: Normalize `req.user` in auth middleware:
  ```javascript
  req.user = { id: payload.userId, ...payload };
  ```

### 7.3 Vulnerability 3: Public Unauthenticated OCR Endpoints Under `/api/tenant/`
- **Severity**: **P0 - Critical**
- **Location**: `backend/routes/tenant/ocr.js:310, 359`
- **Mechanism**:
  - `POST /api/tenant/ocr/scan-bill` and `POST /api/tenant/ocr/fetch-consumer` are mounted without `requireTenantAuth`.
  - `server.js:38` sets `express.json({ limit: '25mb' })`.
- **Exploitation Impact**: External unauthenticated actors can send large base64 payloads up to 25MB, consuming server memory, exhausting OCR API quotas, and triggering Denial of Service.
- **Remediation**: Attach `requireTenantAuth` middleware and rate-limiting to all `/api/tenant/ocr/` routes.

### 7.4 Vulnerability 4: Granular RBAC Unenforced at Route Layer
- **Severity**: **P1 - High**
- **Location**: `backend/middleware/auth.js:113-149` vs `backend/routes/tenant/*.js`
- **Mechanism**: While `requirePermission(...permissions)` is defined in `auth.js`, an audit of all 26 route files reveals that **zero route handlers invoke this middleware** (except for a custom `requireStaffAccess` in `staff.js`).
- **Exploitation Impact**: Any user assigned `TENANT_SUB_ADMIN` can perform unauthorized actions (deleting leads, creating invoices, altering quotations, viewing payroll) regardless of the fine-grained permissions configured on their account in the database.
- **Remediation**: Decorate tenant route controllers with permission requirements (`requirePermission('leads.delete')`, `requirePermission('finance.create_invoice')`).

### 7.5 Vulnerability 5: Hardcoded Mock Fallbacks & Multi-Tenant Data Leaks
- **Severity**: **P1 - High**
- **Location**: `web-client/src/app/tenant/projects/[id]/page.tsx:87-144` and `web-client/src/app/tenant/dashboard/page.tsx:159-280`
- **Mechanism**:
  - In `projects/[id]/page.tsx`, if tenant or customer profile data is incomplete, fallback logic injects hardcoded personal and corporate identity data:
    - Customer: `"SHRI. SURENDRA RAMBHAU THAKRE"`, CA: `"410022120526"`
    - Vendor: `"EKVARTA ENERGY SOLUTIONS"`, GSTIN: `"27DTXPM6427E1Z3"`, Nagpur address
    - Module Serials: `["MS2608211A3882", "MS2608211A3908", ...]`
  - In `dashboard/page.tsx`, if the tenant has zero records, fallback datasets (`fallbackHorizonDataMap`, `fallbackSegmentationData`) render synthetic metrics rather than an authentic empty state.
- **Exploitation Impact**: Violates tenant isolation and professional SaaS integrity. Generating statutory forms under incomplete tenant profiles issues legal agreements under another vendor's name.
- **Remediation**: Remove hardcoded fallbacks; prompt the user to complete tenant/customer settings before generating statutory documents.

---

## 8. Financial Calculation & Engineering Math Risks

### 8.1 Trade Discount GST Discrepancy
- **Location**: `backend/services/solarCalculator.js:290-328` and `web-client/src/services/solarCalculator.ts:430-489`
- **Problem**: When quotations apply an `overallDiscount` without composite GST:
  1. Base amount and tax are computed per line item on pre-discount prices (`itemTax = baseAmount * taxRate`).
  2. `taxableAmount = subtotal - overallDiscount`.
  3. `grandTotal = taxableAmount + totalTax`.
  4. Notice that `totalTax` was **never adjusted** for `overallDiscount`.
- **Tax Law Violation**: Under Section 15(3) of the Indian CGST Act 2017, trade discounts granted before or at the time of supply must reduce the taxable value for GST assessment. Charging tax on pre-discount totals results in GST overbilling.
- **Remediation**: Adjust item taxable bases proportionally when `overallDiscount` is present before calculating item tax:
  ```javascript
  const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
  const adjustedItemBase = itemBase * discountRatio;
  const itemTax = Math.round(adjustedItemBase * (taxRate / 100));
  ```

### 8.2 Floating-Point Milestone Rounding Drift
- **Location**: `backend/services/solarCalculator.js:338-349` and `web-client/src/services/solarCalculator.ts:494-515`
- **Problem**: The 4-stage milestone schedule (20% Advance, 60% Delivery, 15% Installation, 5% Commissioning) rounds each stage independently via `Math.round(grandTotal * (pct / 100))`. On odd total values (e.g., ₹2,75,417), the sum of milestone amounts differs by ₹1 to ₹3 from the grand total.
- **Remediation**: Reconcile the final milestone amount against the cumulative difference:
  ```javascript
  milestones[milestones.length - 1].amount = grandTotal - milestones.slice(0, -1).reduce((s, m) => s + m.amount, 0);
  ```

---

## 9. Quality & Test Execution Baseline

### 9.1 Backend Test Runner Execution
- **Command**: `node --test "backend/test/*.test.js"`
- **Result**: **14 Passed, 1 Failed (Total: 15 Tests, Duration: 5.9s)**
  - `solarCalculator.test.js`: 7/7 PASSED (capacity, generation, subsidy, ROI, pricing, milestones, words)
  - `quotationsApi.test.js`: 2/2 PASSED (template isolation, duplicate quote)
  - `settingsApi.test.js`: 1/1 PASSED (tenant settings, bank details, prefixes)
  - `e2eProposalBuilder.test.js`: 3/3 PASSED (catalog retrieval, proposal wizard, duplication)
  - `unifiedTemplateParity.test.js`: **1 FAILED**:
    ```
    AssertionError [ERR_ASSERTION]: Missing key financial/technical element: PM Surya Ghar Muft Bijli Yojana
        at Object.<anonymous> (backend/test/unifiedTemplateParity.test.js:49:10)
    ```
    *Root Cause*: `mobile-app/src/services/pdfService.ts` lacks the exact string `'PM Surya Ghar Muft Bijli Yojana'`, triggering assertion failure in the parity test.

### 9.2 Mobile Test Suite Execution
- **Command**: `node mobile-app/test-perspectives.js`
- **Result**: **23/23 PASSED (100% Success)**
  - Perspective 1 (Central Subsidy Sizing): PASSED
  - Perspective 2 (Solar Sizing Math): PASSED
  - Perspective 3 (Dynamic Hardware Specs): PASSED
  - Perspective 4 (Customer Onboarding Gating): PASSED
  - Perspective 5 (KYC Documents Optionality): PASSED
  - Perspective 6 (7-Template DISCOM Studio): PASSED
  - Perspective 7 (Stamp Paper Margin Toggle): PASSED
  - Perspective 8 (Barcode Scanner Hardware): PASSED
  - Perspective 9 (8-Point Statutory Audit): PASSED
  - Perspective 10 (Rupee Words & Mobile Ergonomics): PASSED

### 9.3 TypeScript Compiler Verification
- **Web-Client**: `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` -> **0 errors (Exit code 0)**.
- **Mobile-App**: `node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app/tsconfig.json` -> **0 errors (Exit code 0)**.

---

## 10. Prioritized Remediation Matrix

| Priority | Issue / Risk | Target Files | Remediation Summary |
|---|---|---|---|
| **P0 - Critical** | Child entity multi-tenancy bypass | `backend/routes/tenant/crm.js`, `finance.js` | Enforce parent relation check: `where: { id, project: { tenantId: req.user.tenantId } }` on tasks, milestones, materials, visits |
| **P0 - Critical** | JWT `req.user.id` discrepancy | `backend/middleware/auth.js` | Normalize `req.user = { id: payload.userId, ...payload }` in `requireTenantAuth` & `requireSuperAdmin` |
| **P0 - Critical** | Unauthenticated OCR endpoints | `backend/routes/tenant/ocr.js` | Attach `requireTenantAuth` and rate limiter to `/api/tenant/ocr/*` |
| **P1 - High** | Granular RBAC route enforcement | `backend/routes/tenant/*.js` | Apply `requirePermission` across tenant route controllers |
| **P1 - High** | Trade discount GST math error | `backend/services/solarCalculator.js`, `web-client/src/services/solarCalculator.ts` | Proportionally scale taxable line item amounts before tax computation when `overallDiscount` is applied |
| **P1 - High** | Hardcoded mock & vendor data leaks | `web-client/src/app/tenant/projects/[id]/page.tsx`, `tenant/dashboard/page.tsx` | Remove hardcoded Ekvarta/Thakre data and synthetic dashboard fallback datasets |
| **P1 - High** | Dead navigation links (404 errors) | `web-client/src/app/tenant/installation/*`, `tenant/inventory/*`, `tenant/projects/*` | Implement missing sub-routes or connect links to valid modals/pages |
| **P2 - Medium** | Mobile template parity test failure | `mobile-app/src/services/pdfService.ts` | Include exact `'PM Surya Ghar Muft Bijli Yojana'` heading to satisfy `unifiedTemplateParity.test.js` |
| **P2 - Medium** | Shared UI primitives library | `web-client/src/components/ui/` | Standardize `Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`, `Card`, `Toast`, `EmptyState` |
| **P2 - Medium** | Mobile viewport responsiveness | `web-client/src/app/tenant/*` | Add `grid-cols-1 sm:grid-cols-2` across modals and mobile touch status controls on Kanban |
| **P2 - Medium** | Package test scripts | `backend/package.json` | Set `"test": "node --test test/*.test.js"` |

---

*This document serves as the formal baseline audit for Milestone M1 and guides implementation across Milestones M2 through M6.*
