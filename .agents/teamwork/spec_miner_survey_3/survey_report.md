# WhereReady Solar OS — Authoritative Domain & API Specification Report

**Document Role**: Spec Miner 3 (Domain & API Spec Miner)  
**Date**: 2026-10-30  
**Baseline Version**: 1.0.0 Production  
**Authoritative Sources**:
1. Backend Database Schema (`backend/prisma/schema.prisma` — 1,711 lines, 68 models)
2. Backend Route Controllers & Middleware (`backend/routes/tenant/*.js`, `backend/routes/admin/superAdmin.js`, `backend/routes/auth.js`, `backend/middleware/auth.js`)
3. Statutory & Financial Engine (`backend/services/solarCalculator.js`, `web-client/src/services/solarCalculator.ts`)
4. Mobile App API Layer & Data Models (`mobile-app/src/api/endpoints.ts`, `mobile-app/src/api/client.ts`, `mobile-app/src/types/index.ts`)
5. Mobile Field Engineering Services (`mobile-app/src/services/pdfService.ts`, `offlineSyncService.ts`, `whatsappService.ts`)
6. Master System Specifications (`docs/MASTER_ERP_SPECIFICATION.md`, `docs/module-inventory.md`, `docs/product-audit.md`, `PROJECT.md`)

---

## 1. Executive Summary

WhereReady Solar OS is a multi-tenant enterprise ERP platform engineered for Indian rooftop solar EPC companies, installers, and vendors. It bridges customer acquisition, on-site feasibility audits, commercial proposals, project execution, warehouse logistics, installation QA, statutory DISCOM grid interconnections, PM Surya Ghar central subsidies, milestone billing, and post-sales AMC service into a single connected system.

This report establishes the complete specification of:
- **API Contracts**: All REST endpoints, HTTP methods, request bodies, query parameters, response structures, and error codes.
- **RBAC Matrix**: 3 core system roles (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_SUB_ADMIN`), operational personas (`OWNER`, `SALES_AGENT`, `TECHNICIAN`, `INVENTORY_MANAGER`, `FINANCE_MANAGER`, `EPC_CONTRACTOR`), and granular permission strings.
- **Domain Lifecycles**: Detailed state machines and business rules for Leads, Projects, Inventory, Installations, Staff, Finance, Subsidies, and DISCOM interconnections.
- **Statutory Rules**: 13.8% composite solar GST, 4-stage milestone rebalancing (20/60/15/5%), PM Surya Ghar central subsidy caps (₹30k/₹60k/₹78k), electrical safety thresholds (pits < 5.0Ω, trip < 2.0s, insulation > 1.0MΩ), and 7 statutory DISCOM document templates.
- **Edge Cases**: Offline drafts, token expiration, account suspension locks, concurrency race conditions, and network timeout handling.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & Session | Unified Login & Suspension Enforcement | Authenticates credentials, generates 24h JWT, enforces live check of tenant suspension and staff deactivation | `email`, `password` | `{ token, role, user: { id, name, email, permissions, department, designation, tenantName } }` | 401 `Invalid credentials`; 403 `TENANT_SUSPENDED`, `EMPLOYEE_SUSPENDED`, `TENANT_CANCELLED` | `backend/routes/auth.js` |
| 2 | Auth & Session | Mandatory Password Reset | Forces newly provisioned staff with temporary passwords (`Solar@XXXXXX`) to set permanent password before initial login | `email`, `temporaryPassword`, `newPassword` | `{ message: 'Password updated successfully. Please login.' }` | 400 `Invalid request`; 401 `Invalid temporary password` | `backend/routes/auth.js` |
| 3 | Auth & Session | Live Session Profile Validation | Verifies Bearer JWT, returns verified user profile with tenant status and permissions | Bearer Token in Header or Cookie | `{ user: { id, email, name, role, tenantId, permissions, staffProfile, tenant } }` | 401 `Not authenticated` / `Invalid session`; 403 `TENANT_SUSPENDED` | `backend/routes/auth.js` |
| 4 | Leads & CRM | Leads KPI Dashboard | Aggregates prospect pipeline counts and calculated win conversion percentage | Tenant context | `{ dashboard: { totalLeads, newLeads, qualifiedLeads, wonLeads, lostLeads, conversionRate } }` | 500 `Failed to fetch dashboard metrics` | `backend/routes/tenant/crm.js` |
| 5 | Leads & CRM | Paginated Lead Directory | Lists leads with relational assignee, active quotes, invoices, and projects | Query: `source`, `status`, `assigneeId`, `search`, `all` | `{ leads: Lead[] }` | 403 `Forbidden: Insufficient permissions` | `backend/routes/tenant/crm.js` |
| 6 | Leads & CRM | Duplicate-Aware Lead Intake | Ingests new leads with auto-merge/update if mobile/email already exists within tenant unless `forceCreate` | `name`, `mobile`, `email`, `company`, `source`, `estimatedCap`, `monthlyBill`, `address`, `city` | `{ lead: Lead }` (or `{ lead, message: 'Existing lead updated' }`) | 400 validation error (Zod: name min 2, mobile min 10) | `backend/routes/tenant/crm.js` |
| 7 | Leads & CRM | 8-Stage Lead Progression | Updates lead workflow status with automated activity logging | `status`: `NEW`, `CONTACTED`, `QUALIFIED`, `SITE_SURVEY`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD` | `{ lead: Lead }` | 404 `Lead not found`; 500 update error | `backend/routes/tenant/crm.js` |
| 8 | Leads & CRM | Follow-Up Scheduler | Creates follow-up task with reminder date, type (`CALL`, `WHATSAPP`, `EMAIL`, `MEETING`) | `scheduledAt`, `type`, `notes`, `assignedTo` | `{ followup: LeadFollowUp }` | 500 error | `backend/routes/tenant/crm.js` |
| 9 | Leads & CRM | 1-Click Atomic Lead-to-Project Conversion | Idempotent transaction converting Won Lead to Customer, Project (`PRJ-XXXXX`), Site Survey, 6 default Project Milestones, DiscomApplication, and SubsidyApplication | `customerName`, `mobile`, `address`, `city`, `capacity`, `systemType`, `estimatedValue` | `{ lead, customer, project }` | 404 `Lead not found`; atomic poll-lock on concurrent requests | `backend/routes/tenant/crm.js` |
| 10 | Customer Master | Client 360 Directory | Retrieves customer master record linked to projects, invoices, surveys, and statutory documents | Query: `search`, `page`, `limit` | `{ customers: Customer[] }` or `{ customer: Customer }` | 404 `Customer not found` | `backend/routes/tenant/crm.js` |
| 11 | Site Surveys | Technical Rooftop Audit Queue | Tracks technical feasibility studies, roof types (RCC, Metal Sheet, Tile), shadow-free area | Query: `status`, `search`, `customerId`, `engineerId`, `dateFrom`, `dateTo` | `{ surveys: SiteSurvey[], metrics }` | 500 error | `backend/routes/tenant/surveys.js` |
| 12 | Site Surveys | Automated Sizing Calculator | Computes recommended capacity (kWp) from shadow-free area (100 sq.ft/kWp) or monthly units (120 units/kWp/mo) and annual savings @ ₹8.5/unit | `usableShadowFreeArea`, `totalRoofArea`, `avgMonthlyUnits`, `proposedCap` | `{ recommendedCapacity, maxInstallableCapacity, estimatedAnnualUnits, estimatedAnnualSavings }` | Fallback to proposedCap or 3.0 kW | `backend/routes/tenant/surveys.js` |
| 13 | Site Surveys | Survey Photo Categorization | Uploads and organizes site inspection photos into `{ rooftop, shadow, meter, inverter, cable, earthing }` | Multipart `photos` array, `category` string | `{ message, photos, categorizedPhotos }` | 400 `No photos provided`; 404 `Site survey not found` | `backend/routes/tenant/surveys.js` |
| 14 | Site Surveys | 1-Click Survey to Quotation | Generates preliminary proposal pre-populated with surveyed technical capacity @ ₹55k/kW baseline with 13.8% composite GST | Survey ID | `{ quotation: Quotation, message }` | 404 `Site survey not found` | `backend/routes/tenant/surveys.js` |
| 15 | Quotations | 60-Second Solar Proposal Builder | Builds turnkey proposal with panel wattage, inverter sizing, composite GST, PM Surya Ghar subsidy, and cashflow | Sizing inputs, hardware brand, customer details, discount | `{ quotation: Quotation }` | 400 validation error | `backend/routes/tenant/quotations.js` |
| 16 | Quotations | Section 15(3) GST Trade Discount Math | Recomputes item taxable bases proportionally when `overallDiscount` is applied, preventing GST overcharges | `items`, `overallDiscount`, `useCompositeSolarGST` | `{ subtotal, discount, taxableAmount, totalTax, cgst, sgst, grandTotal, milestones }` | Strict invariant: `sum(itemBase) === taxableAmount` | `backend/services/solarCalculator.js` |
| 17 | Quotations | 4-Stage Milestone Rebalancing | Generates payment schedule (20% Advance, 60% Delivery, 15% Installation, 5% Commissioning) with rounding absorption | `grandTotal`, custom milestone percentages | Array of 4 milestone objects | Last milestone absorbs remainder so `sum(milestones) === grandTotal` | `backend/services/solarCalculator.js` |
| 18 | Quotations | Immutable Versioned Proposal History | Creates locked revisions (`v1 -> v2`) preventing accidental tampering with accepted commercial quotes | Quotation ID, revision notes | `{ quotation: Quotation (new version), previousVersion }` | 404 not found; locks accepted quotes | `backend/routes/tenant/quotations.js` |
| 19 | Quotations | 1-Click Quote-to-Project Conversion | Locks accepted quotation, updates Customer record, provisions active Project, and generates 4 milestone invoices | Quotation ID | `{ project, message: 'Project created from quotation' }` | 404 not found; 400 if already converted | `backend/routes/tenant/quotations.js` |
| 20 | EPC Projects | 7-Stage Gated Execution Engine | Controls project progression through 7 canonical stages with linear progression validation | `newStage`, `comment` | `{ project: Project }` | 400 `Invalid stage transition: cannot jump from ... to ...` | `backend/routes/tenant/crm.js` |
| 21 | EPC Projects | Material Procurement Auto-Sync | Auto-creates draft Purchase Order with required BOM items when project enters `MATERIAL_DISPATCHED` | Stage transition | Linked `PurchaseOrder` in database | Silent pass if BOM is empty | `backend/routes/tenant/crm.js` |
| 22 | EPC Projects | Commissioning Auto-Completion | Auto-generates 5-year active AMC, final Invoice, and Completion Certificate (`CC-XXXX`) when project enters `COMMISSIONED` | Stage transition | Auto-created AMC, Invoice, Certificate | Prevents duplicates if already generated | `backend/routes/tenant/crm.js` |
| 23 | Inventory | Multi-Warehouse Stock Valuation | Aggregates physical and reserved stock, valuation, low stock warnings across warehouse locations | Tenant context | `{ totalValuation, lowStockCount, items: Product[] }` | 500 error | `backend/routes/tenant/crm.js` |
| 24 | Inventory | Outbound Material Dispatch | Dispatches serialized items (PV panels, inverters) to project site, updates `SerialNumber.status` to `INSTALLED` | `projectId`, `warehouseId`, `items: [{ productId, quantity, serialNumbers }]` | `{ dispatch: MaterialDispatch }` | 400 if insufficient stock | `backend/routes/tenant/crm.js` |
| 25 | Inventory | Stock Transfer Between Warehouses | Manages transfer of components from central depot to regional warehouses (`DRAFT` -> `IN_TRANSIT` -> `RECEIVED`) | `sourceWarehouseId`, `destWarehouseId`, `items` | `{ transfer: StockTransfer }` | 400 if source and dest are identical | `backend/routes/tenant/finance.js` |
| 26 | Procurement | PO Auto-Stock Receiving Ledger | Automatically increments product stock, updates `StockBalance`, and logs `StockLedger` when PO is marked `RECEIVED` | `status: 'RECEIVED'` | `{ purchaseOrder, updatedStock }` | 400 `Cannot change status of a Purchase Order that has already been received` | `backend/routes/tenant/procurement.js` |
| 27 | Installations | Installation Job Scheduling | Schedules on-site installation work order (`INS-YYYY-XXXX`) and assigns field technician crew | `projectId`, `scheduledDate`, `scheduledStartTime`, `estimatedDuration`, `priority`, `assignments` | `{ installation: InstallationJob }` | 404 `Project not found` | `backend/routes/tenant/installations.js` |
| 28 | Installations | Mandatory Photographic QA Gate | Blocks advancing installation to `PENDING_REVIEW` or `COMPLETED` unless geo-photos in `ROOF`, `INVERTER`, and `PANELS` exist | `status: 'COMPLETED'` | `{ installation: InstallationJob }` | 400 `Missing required photos: ROOF, INVERTER, PANELS` | `backend/routes/tenant/installations.js` |
| 29 | Mobile Field QA | Statutory Electrical Test Sign-Off | Enforces CEA / IEEE 1547 electrical safety thresholds before field commissioning | Earth Pits 1, 2, 3 (Ω), Trip time (s), Insulation (MΩ) | QA sign-off certification | Blocks submission if any pit >= 5.0Ω, trip >= 2.0s, or insulation <= 1.0MΩ | `mobile-app/src/screens/operations/InstallationQAModal.tsx` |
| 30 | Mobile Barcode | 2D Barcode & DCR Parser | Decodes JSON, delimiter-separated (`|`, `;`), and raw module/inverter barcodes, checks DCR compliance | Scanned string, certificate override | `{ serial, manufacturer, wattage, dcrCompliant, dcrCertificate }` | Rejects strings < 5 chars, alerts duplicate serials | `mobile-app/src/screens/operations/BarcodeScannerModal.tsx` |
| 31 | DISCOM Interconnection | 5-Stage Statutory Gating Machine | Enforces mandatory prerequisite statutory documents for each utility grid connection stage | `status`, `documentUrl`, `documentType` | `{ discom: DiscomApplication }` | 400 if prerequisite document is missing | `backend/routes/tenant/discom.js` |
| 32 | DISCOM Interconnection | 7-Template Statutory PDF Generator | Generates official MSEDCL/MERC statutory document pack with physical stamp paper margin toggle | Project, Customer, BOQ, and Serials | Formatted HTML / PDF | Incomplete data shows warning | `mobile-app/src/screens/projects/DiscomDocsModal.tsx` |
| 33 | PM Surya Ghar | 7-Stage National Portal Studio | Tracks DBT subsidy funnel (`CONSUMER_SELECTION` -> `DBT_DISBURSED`), consumer CA, division, and capacity | `portalStage`, `consumerNumber`, `bankDetails`, `dcrModuleSerials` | `{ subsidy: SubsidyApplication }` | 400 validation error | `backend/routes/tenant/subsidy.js` |
| 34 | PM Surya Ghar | Smart Text & SMS Parser | Intelligent regex parser extracting Consumer Number, Billing Unit, Name, Sanctioned Load, and Bank details | `rawText` from portal/SMS | `{ success: true, extracted: {...} }` | 400 `Text content is required` | `backend/routes/tenant/subsidy.js` |
| 35 | PM Surya Ghar | Bulk DCR Serial Importer | Ingests bulk module serial numbers and verifies bank IFSC codes for DBT subsidy claim generation | Array of application records | `{ success: true, count, created }` | 400 `Array of applications required` | `backend/routes/tenant/subsidy.js` |
| 36 | Finance & Billing | Milestone Tax Invoice Generator | Generates formal GST tax invoices tied to solar milestones (Stage 1 to 4) with 13.8% composite GST | `customerId`, `projectId`, `milestone`, `amount`, `subtotal`, `taxAmount`, `dueDate` | `{ invoice: Invoice }` | 403 insufficient permissions; 400 invalid customer | `backend/routes/tenant/finance.js` |
| 37 | Finance & Billing | Payment Receipt Recording | Records payment against invoice (`UPI`, `BANK_TRANSFER`, `CHEQUE`), updates status to `PARTIAL` or `PAID`, generates receipt | `amount`, `mode`, `reference`, `notes` | `{ payment, receiptNumber, invoiceStatus }` | 400 if payment amount <= 0 | `backend/routes/tenant/finance.js` |
| 38 | Finance & Billing | Direct WhatsApp Payment Reminder | Generates pre-filled WhatsApp click-to-chat payload with invoice link and bank UPI payment details | Invoice ID | `{ whatsappUrl, recipientMobile }` | 404 invoice not found; 400 missing phone | `backend/routes/tenant/finance.js` |
| 39 | Solar Financing | 7% Solar Loan & EMI Planner | Calculates monthly bank EMI vs estimated electricity bill savings, showing net monthly cash benefit | `capacityKw`, `totalInvestment`, `downPayment`, `tenureYears` | `{ monthlyEmi, monthlySavings, netMonthlyCashBenefit }` | Rejects negative or zero capacity | `mobile-app/src/screens/modules/ModulesScreen.tsx` |
| 40 | Workforce & Staff | Employee Master Directory | Manages employees with departments, designations, employment types (`FULL_TIME`, `CONTRACT`), and skills | Pagination, search, department filter | `{ staff: Staff[], pagination, metrics }` | 403 insufficient permissions | `backend/routes/tenant/staff.js` |
| 41 | Workforce & Staff | Temporary Credential Issuance | Provisions new staff with auto-generated secure temporary password (`Solar@XXXXXX`) with forced reset flag | Staff details + `createSystemAccount: true`, `permissions` | `{ staff, tempPassword }` | 409 duplicate employee ID or email | `backend/routes/tenant/staff.js` |
| 42 | Workforce & Staff | Manager Hierarchy Cycle Guard | Validates reporting hierarchy and prevents circular reporting structures (`managerId === staff.id` or loops) | `managerId` | `{ staff: Staff }` | 400 `Self-reporting manager assignment is invalid` / loop detected | `backend/routes/tenant/staff.js` |
| 43 | Workforce & Staff | Account Revocation vs Profile Deletion | Revokes user login account while safely preserving employee HR history, project logs, and audit records | Staff ID | `{ message: 'System access revoked. Staff employment profile preserved.' }` | 400 if user has no account or deleting own session | `backend/routes/tenant/staff.js` |
| 44 | Workforce & Staff | Deletion Reassignment Guard | Enforces reassigning active project assignments and direct reports before an employee profile can be deleted | Staff ID, `reassignTo` or `force` | `{ message: 'Employee deleted and tasks reassigned' }` | 400 `Employee has active assignments. Please select a colleague to reassign` | `backend/routes/tenant/staff.js` |
| 45 | Documents & KYC | Centralized Document Vault | Stores KYC documents, electricity bills, net-metering test certificates, and completion photos | `file` upload, `documentTypeId`, `customerId`, `projectId` | `{ document: Document }` | 400 unsupported mime-type; 404 entity not found | `backend/routes/tenant/documents.js` |
| 46 | Utility OCR | Electricity Bill & QR Scanner | Extracts 12-digit Consumer Number, Billing Unit, Sanctioned Load, and bill amount from photos or MSEDCL QR | `fileBase64` or `rawText` or `consumerNumber` | `{ data: { consumerNumber, billingUnit, sanctionedLoadKw, monthlyBillAmount, recommendedKw, subsidyAmount } }` | 400 invalid consumer number; 500 OCR timeout | `backend/routes/tenant/ocr.js` |
| 47 | Platform Admin | Instant Tenant Account Suspension | Freezes tenant operations across web and mobile immediately via 5-second in-memory cache invalidation | `status: 'SUSPENDED'` or `'ACTIVE'` | `{ tenant: Tenant, message }` | 401 unauthorized; 403 Super Admin only | `backend/routes/admin/superAdmin.js` |
| 48 | Offline Support | Field Draft Sync Service | Caches unsubmitted leads and quotes in `AsyncStorage` when offline, with seamless sync upon reconnect | Draft lead object | Saved draft with `localId: 'draft_...'` | Safe fallback to memory store if storage unavailable | `mobile-app/src/services/offlineSyncService.ts` |

---

## 3. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Lead Intake | Existing mobile or email submitted without `forceCreate` | System finds existing record, merges new inquiry notes, sets `updatedAt = now()`, and returns `{ lead, message: 'Existing lead updated' }` instead of creating duplicate. |
| 2 | Lead Conversion | Two concurrent clicks on "Convert to Project" button | Handled via atomic database check-and-lock (`where: { id, status: { not: 'WON' } }`). The first request executes the transaction; the second request polls briefly and receives the already-created project without duplicate records. |
| 3 | Project Stage Gating | User attempts to advance project from `Planning` directly to `Testing` or `Completed` | API rejects with HTTP 400 `{ error: 'Invalid stage transition: cannot jump from Planning to Testing' }`. Only linear stage progression is permitted. |
| 4 | DISCOM Net-Metering | Advancing stage to `CEIG_INSPECTION` without `feasibilityDocumentUrl` | API rejects with HTTP 400 `{ error: 'Feasibility Approval document is mandatory to proceed to CEIG Inspection.' }`. |
| 5 | DISCOM Net-Metering | Advancing stage to `GRID_SYNCHRONIZED` without `netMeterCertificateUrl` | API rejects with HTTP 400 `{ error: 'Net-Meter Certificate is mandatory to finalize Grid Synchronization.' }`. |
| 6 | Installation Completion | Advancing installation job to `COMPLETED` without photos in `ROOF`, `INVERTER`, and `PANELS` | API rejects with HTTP 400 `{ error: 'Missing required photos: ROOF, INVERTER, PANELS' }`. |
| 7 | Electrical Field QA | Earth pit resistance reading >= 5.0 Ω or anti-islanding trip time >= 2.0 s | Mobile app blocks QA submission with safety gating alert quoting CEA & IEEE 1547 standards; stage advancement is disallowed. |
| 8 | Purchase Order Stocking | User attempts to change status of PO already marked `RECEIVED` back to `ORDERED` or `CANCELLED` | API rejects with HTTP 400 `{ error: 'Cannot change status of a Purchase Order that has already been received into inventory' }`. |
| 9 | Purchase Order Stocking | Marking PO as `RECEIVED` for the first time | Executes atomic transaction: increments `Product.currentStock`, updates `StockBalance.quantity`, logs `StockLedger` (`movementType: 'RECEIPT'`), and creates `GoodsReceipt` with `GRN` number. |
| 10 | Staff Management | Assigning employee as their own manager, or creating a loop (A -> B -> A) | API rejects with HTTP 400 `{ error: 'Circular reporting structure detected' }` or `{ error: 'Self-reporting manager assignment is invalid' }`. |
| 11 | Staff Management | Deleting an employee who has active project assignments or direct reports without providing `reassignTo` or `force` | API rejects with HTTP 400 `{ error: 'Employee has active assignments or direct reports...', requiresReassignment: true }`. |
| 12 | Staff Management | Tenant Admin attempts to delete their own account or revoke their own session | API rejects with HTTP 400 `{ error: 'Cannot delete your own administrative account' }` / `{ error: 'Cannot revoke your own active login session' }`. |
| 13 | Financial Calculations | Applying an overall discount to a quotation | Section 15(3) proportional discounting recalculates each item's taxable base proportionally, and the last line item absorbs any rounding difference to ensure `sum(itemBase) === taxableAmount`. |
| 14 | Milestone Rounding | Sizing an odd-rupee system (e.g., ₹1,91,403) across 4 milestones (20%, 60%, 15%, 5%) | The 4th milestone absorbs the rounding remainder (`total - sum(first 3)`), ensuring `sum(milestones) === grandTotal` strictly without 1-rupee rounding drift. |
| 15 | Subsidy Cap | Quoting a commercial or industrial customer for PM Surya Ghar subsidy | Indicative subsidy evaluates to ₹0 with `isEligible: false` because PM Surya Ghar is statutorily restricted to verified residential connections. |
| 16 | Subsidy Cap | Residential system >= 3 kW (e.g. 3.3 kW, 5 kW, 10 kW) | Indicative subsidy strictly caps at ₹78,000 (1 kW = ₹30k, 2 kW = ₹60k, >= 3 kW = ₹78k). |
| 17 | Super Admin Suspension | Super Admin sets tenant status to `SUSPENDED` | 5-second TTL in-memory cache is invalidated immediately; all subsequent tenant web and mobile requests receive HTTP 403 `TENANT_SUSPENDED`; mobile app immediately displays non-dismissible Account Suspended Modal. |
| 18 | Staff Deactivation | Tenant Admin suspends or deactivates a staff member (`status: 'SUSPENDED'` or `'INACTIVE'`) | Live session check in `requireTenantAuth` middleware immediately blocks all subsequent API calls with HTTP 403 `EMPLOYEE_SUSPENDED`. |
| 19 | Token Expiry | JWT token reaches 24-hour expiration while user is working on mobile | Mobile Axios response interceptor catches HTTP 401, clears stored token and user profile, triggers `unauthorizedHandler`, and navigates user cleanly to LoginScreen with session expired message. |
| 20 | Offline Lead Intake | Field technician loses internet connectivity while taking customer details | `SafeStorage` / `offlineSyncService` saves draft lead with local ID (`draft_...`) to `AsyncStorage`; technician can review and sync to backend once connection is restored. |
| 21 | Barcode Scanning | Technician scans a module barcode that was already scanned for the project | Mobile BarcodeScanner flags duplicate in red and prevents adding duplicate serial numbers to the DCR compliance pack. |
| 22 | Physical Stamp Paper | EPC contractor prints agreement on ₹100 or ₹500 Treasury Non-Judicial Stamp Paper | Toggling "Physical Stamp Paper" switch in `DiscomDocsModal` removes the digital emblem and preserves an exact 115mm blank top margin on Page 1 so text prints cleanly below the pre-printed treasury stamp. |

---

## 4. Complete API Contract Catalog

### 4.1 Authentication & Session (`/api/auth`)

#### `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "string (required, trimmed, lowercase)",
    "password": "string (required)"
  }
  ```
- **Response (200 OK — Normal Login)**:
  ```json
  {
    "message": "Login successful",
    "role": "SUPER_ADMIN | TENANT_ADMIN | TENANT_SUB_ADMIN",
    "token": "jwt_token_string",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "RoleType",
      "permissions": ["*"] or ["leads.view", "..."],
      "department": "string | null",
      "designation": "string | null",
      "tenantName": "string | null"
    }
  }
  ```
- **Response (200 OK — Requires Password Reset)**:
  ```json
  {
    "requiresPasswordReset": true,
    "email": "string"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Invalid credentials" }`
  - `403 Forbidden (Tenant Suspended)`:
    ```json
    {
      "error": "Account Suspended: Your company account has been suspended by the platform administrator...",
      "code": "TENANT_SUSPENDED",
      "isSuspended": true
    }
    ```
  - `403 Forbidden (Tenant Cancelled)`:
    ```json
    {
      "error": "Account Cancelled: Your company subscription has ended...",
      "code": "TENANT_CANCELLED",
      "isSuspended": true
    }
    ```
  - `403 Forbidden (Employee Suspended)`:
    ```json
    {
      "error": "Access Suspended: Your employee account has been suspended...",
      "code": "EMPLOYEE_SUSPENDED",
      "isSuspended": true
    }
    ```

#### `POST /api/auth/force-reset-password`
- **Access**: Public (requires active temporary password)
- **Request Body**:
  ```json
  {
    "email": "string (required)",
    "temporaryPassword": "string (required)",
    "newPassword": "string (required, min 6)"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Password updated successfully. Please login."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Invalid request" }`
  - `401 Unauthorized`: `{ "error": "Invalid temporary password" }`

#### `GET /api/auth/me`
- **Access**: Authenticated (Bearer Token or `tenant_token` / `super_admin_token` cookie)
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "string",
      "name": "string",
      "role": "SUPER_ADMIN | TENANT_ADMIN | TENANT_SUB_ADMIN",
      "tenantId": "uuid | null",
      "permissions": ["*"] or ["leads.view", "..."],
      "mustChangePassword": false,
      "staffProfile": {
        "id": "uuid",
        "employeeId": "string",
        "department": "string",
        "designation": "string",
        "status": "ACTIVE | ON_LEAVE | INACTIVE | PROBATION"
      },
      "tenant": {
        "id": "uuid",
        "name": "string",
        "city": "string",
        "state": "string",
        "logoUrl": "string | null",
        "status": "TRIAL | ACTIVE | SUSPENDED"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Not authenticated" }` / `{ "error": "Invalid session" }`
  - `403 Forbidden`: Tenant suspended or employee deactivated.

#### `POST /api/auth/logout`
- **Access**: Authenticated
- **Response (200 OK)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### 4.2 Leads & CRM Domain (`/api/tenant/leads`)

#### `GET /api/tenant/leads/dashboard`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "dashboard": {
      "totalLeads": 42,
      "newLeads": 12,
      "qualifiedLeads": 8,
      "wonLeads": 15,
      "lostLeads": 7,
      "conversionRate": "35.7"
    }
  }
  ```

#### `GET /api/tenant/leads`
- **Access**: `requireTenantAuth`, `requirePermission('leads.view')`
- **Query Parameters**:
  - `status`: `'ALL' | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_SURVEY' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST' | 'ON_HOLD'`
  - `source`: `'Website' | 'Referral' | 'Exhibition' | 'Inbound' | string`
  - `assigneeId`: User UUID
  - `search`: Filter string (matches name, mobile, email, company)
  - `all`: Boolean
- **Response (200 OK)**:
  ```json
  {
    "leads": [
      {
        "id": "uuid",
        "leadNumber": "string | null",
        "name": "string",
        "company": "string | null",
        "customerType": "RESIDENTIAL | COMMERCIAL | INDUSTRIAL",
        "email": "string | null",
        "mobile": "string",
        "alternatePhone": "string | null",
        "address": "string | null",
        "city": "string | null",
        "state": "string | null",
        "pincode": "string | null",
        "status": "LeadStatus",
        "estimatedValue": 275000,
        "estimatedCap": 3.3,
        "capacityUnit": "KW",
        "monthlyBill": 3500,
        "source": "string | null",
        "notes": "string | null",
        "assigneeId": "uuid | null",
        "assignee": { "id": "uuid", "name": "string" },
        "customer": { "id": "uuid", "invoices": [...] },
        "projects": [{ "id": "uuid", "name": "string", "status": "string", "capacity": 3.3 }],
        "quotations": [{ "id": "uuid", "qNumber": "string", "total": 215000, "status": "string" }],
        "createdAt": "ISO8601"
      }
    ]
  }
  ```

#### `POST /api/tenant/leads`
- **Access**: `requireTenantAuth`, `requirePermission('leads.create')`
- **Request Body**:
  ```json
  {
    "name": "string (min 2, required)",
    "mobile": "string (min 10, required)",
    "email": "string (email or empty)",
    "company": "string | null",
    "source": "string | null",
    "estimatedCap": 3.3,
    "monthlyBill": 3500,
    "address": "string | null",
    "city": "string | null",
    "state": "string | null",
    "pincode": "string | null",
    "forceCreate": false
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "lead": { "id": "uuid", "name": "string", "mobile": "string", "status": "NEW", "...": "..." }
  }
  ```
  *(If duplicate mobile/email found without `forceCreate`, merges details and returns `{ "lead": lead, "message": "Existing lead updated" }`)*

#### `PATCH /api/tenant/leads/:id`
- **Access**: `requireTenantAuth`, `requirePermission('leads.edit')`
- **Request Body**: Any updatable lead fields (`name`, `status`, `stage`, `estimatedCap`, `monthlyBill`, `notes`, `assigneeId`, etc.)
- **Response (200 OK)**: `{ "lead": Lead }`

#### `DELETE /api/tenant/leads/:id`
- **Access**: `requireTenantAuth`, `requirePermission('leads.delete')`
- **Response (200 OK)**: `{ "success": true, "message": "Lead deleted successfully" }`

#### `POST /api/tenant/leads/:id/convert`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "customerName": "string (optional, defaults to lead name)",
    "mobile": "string (optional)",
    "email": "string (optional)",
    "address": "string (optional)",
    "city": "string (optional)",
    "capacity": 3.3,
    "systemType": "On-Grid",
    "estimatedValue": 215000
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "lead": { "id": "uuid", "status": "WON" },
    "customer": { "id": "uuid", "name": "string", "mobile": "string" },
    "project": {
      "id": "uuid",
      "projectNumber": "PRJ-XXXXX",
      "name": "Turnkey Solar Plant - Customer Name",
      "capacity": 3.3,
      "currentStage": "Planning",
      "status": "Not Started",
      "milestones": [
        { "name": "Site Survey & Feasibility Audit", "status": "Pending" },
        { "name": "Engineering Design & BOM Approval", "status": "Pending" },
        { "name": "DISCOM Net Metering Application", "status": "Pending" },
        { "name": "Procurement & Dispatch", "status": "Pending" },
        { "name": "On-Site Installation & QA", "status": "Pending" },
        { "name": "Grid Commissioning & Subsidy Claim", "status": "Pending" }
      ],
      "discomApplication": { "id": "uuid", "status": "FEASIBILITY_PENDING" },
      "subsidies": [{ "id": "uuid", "portalStage": "CONSUMER_SELECTION" }]
    }
  }
  ```

---

### 4.3 EPC Projects Domain (`/api/tenant/projects`)

#### `GET /api/tenant/projects`
- **Access**: `requireTenantAuth`
- **Query Parameters**:
  - `status`: `'ALL' | 'Planning' | 'In Progress' | 'Completed' | 'On Hold'`
  - `stage`: `'SURVEY_COMPLETED' | 'STRUCTURE_APPROVED' | 'MATERIAL_DISPATCHED' | 'INSTALLATION_STARTED' | 'TESTING_COMPLETED' | 'NET_METER_APPLIED' | 'COMMISSIONED'`
  - `search`: Filter string (project name, number, customer name, city)
- **Response (200 OK)**:
  ```json
  {
    "projects": [
      {
        "id": "uuid",
        "projectNumber": "PRJ-99212",
        "name": "string",
        "capacity": 3.3,
        "capacityUnit": "kW",
        "currentStage": "SURVEY_COMPLETED",
        "status": "In Progress",
        "progressPercent": 15,
        "estimatedValue": 215000,
        "customer": { "id": "uuid", "name": "string", "mobile": "string", "address": "string" },
        "projectOwner": { "id": "uuid", "name": "string" },
        "discomApplication": { "id": "uuid", "status": "FEASIBILITY_PENDING" },
        "subsidies": [{ "id": "uuid", "portalStage": "CONSUMER_SELECTION" }],
        "createdAt": "ISO8601"
      }
    ],
    "metrics": {
      "totalProjects": 24,
      "activeProjects": 18,
      "totalCapacity": 128.5,
      "completedProjects": 6
    }
  }
  ```

#### `GET /api/tenant/projects/:id`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "project": {
      "id": "uuid",
      "projectNumber": "PRJ-99212",
      "name": "string",
      "capacity": 3.3,
      "currentStage": "SURVEY_COMPLETED",
      "progressPercent": 15,
      "customer": { "id": "uuid", "name": "string", "mobile": "string", "address": "string" },
      "quotation": { "id": "uuid", "qNumber": "string", "panelBrand": "Waaree", "inverterBrand": "Growatt" },
      "tasks": [{ "id": "uuid", "name": "string", "status": "To Do", "dueDate": "ISO8601" }],
      "milestones": [{ "id": "uuid", "name": "string", "status": "Pending", "targetDate": "ISO8601" }],
      "materialReqs": [{ "id": "uuid", "productId": "uuid", "description": "string", "quantity": 6, "status": "Required" }],
      "stageHistory": [{ "previousStage": "Planning", "newStage": "Design", "createdAt": "ISO8601" }],
      "timelineEvents": [{ "title": "Stage Changed", "eventType": "STAGE_CHANGE", "createdAt": "ISO8601" }],
      "discomApplication": { "id": "uuid", "status": "FEASIBILITY_PENDING" },
      "subsidies": [{ "id": "uuid", "portalStage": "CONSUMER_SELECTION" }]
    }
  }
  ```

#### `PATCH /api/tenant/projects/:id/stage`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "newStage": "STRUCTURE_APPROVED",
    "comment": "Rooftop structure design verified and approved by structural engineer"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "project": {
      "id": "uuid",
      "currentStage": "STRUCTURE_APPROVED",
      "progressPercent": 30
    }
  }
  ```
- **Error Conditions**:
  - `400 Bad Request`: `newStage is required`
  - `400 Bad Request`: `Already in this stage`
  - `400 Bad Request`: `Invalid stage transition: cannot jump from ... to ...`

#### `PATCH /api/tenant/projects/:id/status`
- **Access**: `requireTenantAuth`
- **Request Body**: `{ "status": "In Progress" | "Completed" | "On Hold" | "Cancelled" }`
- **Response (200 OK)**: `{ "project": Project }`

#### `POST /api/tenant/projects/:id/tasks`
- **Access**: `requireTenantAuth`
- **Request Body**: `{ "name": "string (required)", "description": "string", "priority": "Low | Medium | High", "dueDate": "ISO8601", "assigneeId": "uuid" }`
- **Response (201 Created)**: `{ "task": ProjectTask }`

#### `PATCH /api/tenant/tasks/:id`
- **Access**: `requireTenantAuth`
- **Request Body**: `{ "status": "To Do | In Progress | Blocked | Completed | Cancelled", "progress": 100 }`
- **Response (200 OK)**: `{ "task": ProjectTask }`

---

### 4.4 Inventory & Warehouses Domain (`/api/tenant/inventory`, `/api/tenant/products`)

#### `GET /api/tenant/inventory/dashboard`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "totalValuation": 4250000,
    "totalProducts": 64,
    "lowStockCount": 3,
    "warehouseCount": 2,
    "lowStockAlerts": [{ "name": "Waaree 550Wp Mono PERC", "currentStock": 4, "minStock": 10 }]
  }
  ```

#### `GET /api/tenant/inventory/products`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "products": [
      {
        "id": "uuid",
        "name": "Waaree 550Wp Mono PERC Bifacial",
        "category": "PANELS",
        "brand": "Waaree",
        "sku": "WAA-550-BIF",
        "unit": "NOS",
        "purchaseCost": 12500,
        "sellingPrice": 15500,
        "currentStock": 48,
        "minStock": 10,
        "stockBalances": [{ "warehouseId": "uuid", "quantity": 48, "reservedQuantity": 12, "availableQuantity": 36 }]
      }
    ]
  }
  ```

#### `POST /api/tenant/inventory/dispatch`
- **Access**: `requireTenantAuth`, `requirePermission('inventory.dispatch')`
- **Request Body**:
  ```json
  {
    "projectId": "uuid (required)",
    "warehouseId": "uuid (required)",
    "items": [
      {
        "productId": "uuid",
        "quantity": 6,
        "serialNumbers": ["MOD-2026-001", "MOD-2026-002", "MOD-2026-003", "MOD-2026-004", "MOD-2026-005", "MOD-2026-006"]
      }
    ],
    "receiverName": "Site Engineer Aditya",
    "notes": "Dispatched for rooftop installation"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Materials dispatched successfully",
    "dispatch": {
      "id": "uuid",
      "dispatchNumber": "DSP-1730000000",
      "status": "DISPATCHED",
      "items": [...]
    }
  }
  ```

---

### 4.5 Procurement & Purchase Orders (`/api/tenant/procurement`)

#### `GET /api/tenant/procurement`
- **Access**: `requireTenantAuth`
- **Query Parameters**: `status`, `supplier`, `search`, `projectId`
- **Response (200 OK)**:
  ```json
  {
    "procurement": [
      {
        "id": "uuid",
        "poNumber": "PO-1730000000",
        "vendor": "Waaree Energies Ltd",
        "supplier": "Waaree Energies Ltd",
        "status": "ORDERED | SHIPPED | RECEIVED | CANCELLED",
        "totalCost": 120000,
        "createdAt": "ISO8601",
        "project": { "id": "uuid", "name": "string" },
        "items": [{ "productId": "uuid", "quantity": 10, "unitPrice": 12000, "total": 120000 }]
      }
    ],
    "metrics": {
      "totalOrders": 14,
      "activeOrders": 4,
      "receivedValue": 850000,
      "pendingOrders": 2
    }
  }
  ```

#### `POST /api/tenant/procurement`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "supplier": "Waaree Energies Ltd",
    "productId": "uuid",
    "qty": 10,
    "unitCost": 12000,
    "projectId": "uuid (optional)"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Purchase Order created successfully",
    "purchaseOrder": {
      "id": "uuid",
      "poNumber": "PO-1730000000",
      "vendor": "Waaree Energies Ltd",
      "status": "ORDERED",
      "items": [...]
    }
  }
  ```

#### `PATCH /api/tenant/procurement/:id/status`
- **Access**: `requireTenantAuth`
- **Request Body**: `{ "status": "ORDERED" | "SHIPPED" | "RECEIVED" | "CANCELLED" }`
- **Response (200 OK)**:
  ```json
  {
    "message": "Purchase order status updated",
    "purchaseOrder": { "id": "uuid", "status": "RECEIVED" },
    "stockUpdated": true
  }
  ```
- **Invariant**: If `status === 'RECEIVED'`, triggers auto-increment of warehouse stock and ledger entry. Cannot regress status away from `RECEIVED`.

---

### 4.6 Field Installations & Operations (`/api/tenant/installations`)

#### `GET /api/tenant/installations/dashboard`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "scheduledToday": 2,
    "inProgress": 4,
    "pendingAssignment": 1,
    "pendingReview": 2,
    "completedToday": 1,
    "delayed": 0,
    "thisMonth": 12
  }
  ```

#### `GET /api/tenant/installations`
- **Access**: `requireTenantAuth`
- **Query Parameters**: `status` (`'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'DELAYED'`)
- **Response (200 OK)**:
  ```json
  {
    "installations": [
      {
        "id": "uuid",
        "jobId": "INS-2026-0042",
        "status": "IN_PROGRESS",
        "progressPercent": 65,
        "priority": "NORMAL",
        "scheduledDate": "ISO8601",
        "scheduledStartTime": "10:00 AM",
        "estimatedDuration": 6.5,
        "project": { "id": "uuid", "name": "string", "capacity": 3.3 },
        "customer": { "id": "uuid", "name": "string", "mobile": "string", "address": "string" },
        "assignments": [{ "user": { "id": "uuid", "name": "Technician Amit" }, "role": "TECHNICIAN" }]
      }
    ]
  }
  ```

#### `PUT /api/tenant/installations/:id/status`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "status": "COMPLETED",
    "progressPercent": 100,
    "delayReason": "string (optional)"
  }
  ```
- **Response (200 OK)**: `{ "installation": InstallationJob }`
- **Gating Rule**: Transitioning to `PENDING_REVIEW` or `COMPLETED` strictly requires uploaded photos in categories `['ROOF', 'INVERTER', 'PANELS']`. Otherwise returns HTTP 400.

---

### 4.7 Finance, Invoicing & Milestone Payments (`/api/tenant/finance`)

#### `GET /api/tenant/finance/stats`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "stats": {
      "totalRevenue": 1450000,
      "totalCollected": 1150000,
      "outstanding": 300000,
      "overdueAmount": 75000,
      "overdueCount": 2,
      "expectedSubsidies": 234000
    }
  }
  ```

#### `GET /api/tenant/finance`
- **Access**: `requireTenantAuth`
- **Query Parameters**: `status` (`'UNPAID' | 'PARTIAL' | 'PAID'`), `search`
- **Response (200 OK)**:
  ```json
  {
    "finance": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-2026-0012",
        "amount": 43000,
        "subtotal": 37785,
        "taxAmount": 5215,
        "taxRate": 13.8,
        "status": "UNPAID",
        "milestone": "ADVANCE",
        "milestoneTitle": "Stage 1: Advance on Booking (20%)",
        "dueDate": "ISO8601",
        "customer": { "id": "uuid", "name": "Surendra Sharma", "mobile": "9822012345" },
        "project": { "id": "uuid", "name": "3.3kW Rooftop Solar", "capacity": 3.3 },
        "payments": []
      }
    ]
  }
  ```

#### `POST /api/tenant/finance`
- **Access**: `requireTenantAuth`, `requirePermission('finance.create_invoice')`
- **Request Body**:
  ```json
  {
    "customerId": "uuid (required)",
    "projectId": "uuid (optional)",
    "milestone": "ADVANCE | MATERIAL_DELIVERY | INSTALLATION | COMMISSIONING | CUSTOM",
    "milestoneTitle": "string",
    "subtotal": 37785,
    "taxRate": 13.8,
    "taxAmount": 5215,
    "amount": 43000,
    "dueDate": "ISO8601",
    "notes": "string"
  }
  ```
- **Response (201 Created)**: `{ "invoice": Invoice }`

#### `POST /api/tenant/finance/convert-quotation`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "quotationId": "uuid (required)",
    "template": "string (optional)",
    "selectedMilestone": "ALL | ADVANCE | MATERIAL_DELIVERY"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Quotation converted into milestone invoices",
    "invoices": [
      { "milestone": "ADVANCE", "percentage": 20, "amount": 43000, "status": "UNPAID" },
      { "milestone": "MATERIAL_DELIVERY", "percentage": 60, "amount": 129000, "status": "UNPAID" },
      { "milestone": "INSTALLATION", "percentage": 15, "amount": 32250, "status": "UNPAID" },
      { "milestone": "COMMISSIONING", "percentage": 5, "amount": 10750, "status": "UNPAID" }
    ]
  }
  ```

#### `POST /api/tenant/invoices/:id/payments`
- **Access**: `requireTenantAuth`, `requirePermission('finance.record_payment')`
- **Request Body**:
  ```json
  {
    "amount": 43000,
    "mode": "UPI | BANK_TRANSFER | CHEQUE | CASH",
    "reference": "UPI-REF-9921827",
    "notes": "Stage 1 Advance payment received"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Payment recorded successfully",
    "payment": { "id": "uuid", "amount": 43000, "receiptNumber": "REC-1730000000" },
    "receiptNumber": "REC-1730000000",
    "invoiceStatus": "PAID"
  }
  ```

#### `GET /api/tenant/invoices/:id/receipt/:paymentId`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**: Formatted receipt data with tenant letterhead, customer name, GST breakdown, and transaction reference.

#### `GET /api/tenant/invoices/:id/whatsapp-payload`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "recipientMobile": "9822012345",
    "whatsappUrl": "https://wa.me/919822012345?text=...",
    "messageText": "☀️ *Solar Milestone Invoice — INV-2026-0012*..."
  }
  ```

---

### 4.8 Statutory DISCOM & Subsidy Domain (`/api/tenant/pmsuryaghar`, `/api/tenant/discom`)

#### `GET /api/tenant/projects/:projectId/discom`
- **Access**: `requireTenantAuth`
- **Response (200 OK)**:
  ```json
  {
    "discom": {
      "id": "uuid",
      "projectId": "uuid",
      "status": "FEASIBILITY_PENDING | FEASIBILITY_APPROVED | CEIG_INSPECTION | METER_TESTING | NET_METER_INSTALLED | GRID_SYNCHRONIZED",
      "feasibilityDocumentUrl": "string | null",
      "ceigDocumentUrl": "string | null",
      "meterTestReportUrl": "string | null",
      "netMeterCertificateUrl": "string | null"
    }
  }
  ```

#### `PATCH /api/tenant/projects/:projectId/discom/stage`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "status": "CEIG_INSPECTION",
    "documentUrl": "https://storage.solarmanager.app/feasibility.pdf",
    "documentType": "FEASIBILITY_LETTER"
  }
  ```
- **Response (200 OK)**: `{ "discom": DiscomApplication }`
- **Error Conditions**:
  - `400 Bad Request`: `Feasibility Approval document is mandatory to proceed to CEIG Inspection.`
  - `400 Bad Request`: `CEIG Approval document is mandatory to proceed to Meter Testing.`
  - `400 Bad Request`: `Meter Test Report is mandatory to proceed to Net-Meter Installed.`
  - `400 Bad Request`: `Net-Meter Certificate is mandatory to finalize Grid Synchronization.`

#### `GET /api/tenant/subsidies`
- **Access**: `requireTenantAuth`
- **Query Parameters**: `portalStage` (`'ALL' | 'CONSUMER_SELECTION' | 'FEASIBILITY_PENDING' | 'FEASIBILITY_APPROVED' | 'WORK_COMPLETED' | 'METER_INSPECTED' | 'CLAIM_GENERATED' | 'DBT_DISBURSED'`), `search`
- **Response (200 OK)**:
  ```json
  {
    "subsidies": [
      {
        "id": "uuid",
        "nationalPortalAppNo": "PMSG-MH-2026-00412",
        "consumerNumber": "028510293812",
        "discomName": "MSEDCL",
        "division": "Pune Urban",
        "proposedCapacity": 3.3,
        "centralSubsidyAmount": 78000,
        "portalStage": "WORK_COMPLETED",
        "bankName": "HDFC Bank Ltd",
        "accountNumber": "50200088992211",
        "ifscCode": "HDFC0001234",
        "nameMatchVerified": true,
        "customer": { "id": "uuid", "name": "Surendra Sharma" },
        "project": { "id": "uuid", "name": "3.3kW Plant", "capacity": 3.3 }
      }
    ],
    "metrics": {
      "total": 38,
      "consumerSelection": 6,
      "feasibilityApproved": 12,
      "workCompleted": 8,
      "meterInspected": 5,
      "claimGenerated": 4,
      "dbtDisbursed": 3,
      "totalSubsidySanctioned": 546000
    }
  }
  ```

#### `POST /api/tenant/pmsuryaghar/smart-parse`
- **Access**: `requireTenantAuth`
- **Request Body**: `{ "rawText": "Consumer No: 028510293812 BU: 4162 Name: SURENDRA SHARMA..." }`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "extracted": {
      "consumerNumber": "028510293812",
      "billingUnit": "4162",
      "consumerName": "SURENDRA SHARMA",
      "sanctionedLoadKw": 3.3,
      "division": "Pune Urban"
    }
  }
  ```

---

### 4.9 Workforce & Staff Management Domain (`/api/tenant/staff`, `/api/tenant/departments`)

#### `GET /api/tenant/staff/overview`
- **Access**: `requireTenantAuth`, `requireStaffAccess`
- **Response (200 OK)**:
  ```json
  {
    "metrics": {
      "totalStaff": 18,
      "activeStaff": 16,
      "onLeaveStaff": 1,
      "inactiveStaff": 1,
      "probationStaff": 0,
      "withAccount": 12,
      "withoutAccount": 6,
      "activeProjectAssignments": 9,
      "unassignedStaff": 7,
      "departmentDistribution": [
        { "name": "Field Engineering", "code": "ENG", "color": "blue", "count": 8 },
        { "name": "Sales & CRM", "code": "SLS", "color": "emerald", "count": 5 },
        { "name": "Warehouse & Logistics", "code": "LOG", "color": "amber", "count": 3 },
        { "name": "Finance & Accounts", "code": "FIN", "color": "violet", "count": 2 }
      ],
      "employmentTypes": { "FULL_TIME": 14, "PART_TIME": 1, "CONTRACT": 3, "INTERN": 0 }
    }
  }
  ```

#### `GET /api/tenant/staff`
- **Access**: `requireTenantAuth`, `requireStaffAccess`
- **Query Parameters**: `page`, `limit`, `search`, `department`, `status`, `employmentType`
- **Response (200 OK)**:
  ```json
  {
    "staff": [
      {
        "id": "uuid",
        "employeeId": "EMP-2026-004",
        "name": "Aditya Kothari",
        "email": "aditya@wherereadysolar.com",
        "phone": "+91 98220 12345",
        "department": "Field Engineering",
        "designation": "Senior Commissioning Engineer",
        "employmentType": "FULL_TIME",
        "status": "ACTIVE",
        "skills": ["Inverter Commissioning", "HT/LT Electrical License", "Safety at Heights"],
        "user": { "id": "uuid", "role": "TENANT_SUB_ADMIN", "permissions": ["surveys", "projects"] },
        "projectAssignments": [{ "projectId": "uuid", "role": "SITE_ENGINEER", "status": "ACTIVE" }]
      }
    ],
    "pagination": { "total": 18, "page": 1, "limit": 10, "totalPages": 2 }
  }
  ```

#### `POST /api/tenant/staff`
- **Access**: `requireTenantAuth`, `requireStaffAccess`
- **Request Body**:
  ```json
  {
    "name": "Aditya Kothari (required)",
    "employeeId": "EMP-2026-004 (required, unique per tenant)",
    "department": "Field Engineering",
    "designation": "Senior Commissioning Engineer (required)",
    "email": "aditya@testsolar.in",
    "phone": "+91 98220 12345",
    "employmentType": "FULL_TIME",
    "status": "ACTIVE",
    "workLocation": "Pune City Base",
    "skills": ["Inverter Commissioning", "HT/LT Electrical License"],
    "createSystemAccount": true,
    "systemRole": "TENANT_SUB_ADMIN",
    "permissions": ["surveys", "projects", "installations"]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Staff member created successfully",
    "staff": { "id": "uuid", "employeeId": "EMP-2026-004", "...": "..." },
    "tempPassword": "Solar@A4F92B"
  }
  ```
- **Error Responses**:
  - `409 Conflict`: `{ "error": "Employee ID already exists in your organization" }`

#### `PATCH /api/tenant/staff/:id`
- **Access**: `requireTenantAuth`, `requireStaffAccess`
- **Request Body**: Any updatable staff fields (`name`, `department`, `designation`, `phone`, `skills`, `managerId`, etc.)
- **Error Conditions**:
  - `400 Bad Request`: `managerId === id` returns `{ "error": "Self-reporting manager assignment is invalid" }`
  - `400 Bad Request`: Circular reporting loop returns `{ "error": "Circular reporting structure detected" }`

#### `DELETE /api/tenant/staff/:id/account`
- **Access**: `requireTenantAuth`, `requireStaffAccess` (`TENANT_ADMIN` only)
- **Response (200 OK)**:
  ```json
  {
    "message": "System access revoked. Staff employment profile preserved."
  }
  ```
- **Behavior**: Deletes `User` authentication login record, sets `Staff.userId = null`, keeps employment profile intact.

#### `DELETE /api/tenant/staff/:id`
- **Access**: `requireTenantAuth`, `requireStaffAccess` (`TENANT_ADMIN` only)
- **Query/Body**: `reassignTo` (Staff UUID), `force` (boolean)
- **Response (200 OK)**:
  ```json
  {
    "message": "Employee deleted and tasks reassigned successfully"
  }
  ```
- **Error Conditions**:
  - `400 Bad Request`: Deleting own administrative profile returns `{ "error": "Cannot delete your own administrative account" }`
  - `400 Bad Request`: Active assignments without `reassignTo` or `force` returns `{ "error": "Employee has active assignments...", "requiresReassignment": true }`

---

### 4.10 OCR & Utility Bill Ingestion (`/api/tenant/ocr`)

#### `POST /api/tenant/ocr/scan-bill`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "fileBase64": "data:image/jpeg;base64,...",
    "rawText": "string (optional)",
    "filename": "electricity_bill.pdf"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "source": "OCR_SPACE_ENGINE_2",
    "data": {
      "consumerNumber": "028510293812",
      "billingUnit": "4162",
      "consumerName": "Surendra Sharma",
      "sanctionedLoadKw": 3.0,
      "monthlyBillAmount": 3570,
      "monthlyUnitsKwh": 420,
      "tariffCategory": "LT-I Residential",
      "recommendedKw": 3.5,
      "subsidyAmount": 78000
    }
  }
  ```

#### `POST /api/tenant/ocr/fetch-consumer`
- **Access**: `requireTenantAuth`
- **Request Body**:
  ```json
  {
    "consumerNumber": "028510293812",
    "bu": "4162",
    "billAmount": 3570
  }
  ```
- **Response (200 OK)**: Extracted utility directory details with confidence score.

---

### 4.11 Super Admin Platform Governance (`/api/super-admin`)

#### `GET /api/super-admin/tenants`
- **Access**: `requireSuperAdmin`
- **Response (200 OK)**: Array of all provisioned SaaS tenants with subscription and capacity telemetry.

#### `PUT /api/super-admin/tenants/:id/status`
- **Access**: `requireSuperAdmin`
- **Request Body**: `{ "status": "ACTIVE | SUSPENDED | CANCELLED | TRIAL" }`
- **Response (200 OK)**: `{ "tenant": Tenant, "message": "Tenant status updated" }`
- **Behavior**: Instantly invalidates in-memory 5-second tenant cache, immediately locking out tenant users.

---

## 5. Role-Based Access Control (RBAC) Architecture

### 5.1 The 3 System Core Roles
Per `docs/MASTER_ERP_SPECIFICATION.md` and `backend/middleware/auth.js`, the platform defines exactly three core system roles in the database `User.role` enum:

1. **`SUPER_ADMIN`**: Platform SaaS owner. Has full access to `/api/super-admin/*`. Not tied to any single `tenantId`.
2. **`TENANT_ADMIN`**: The owner/operator of a solar company. Has implicit wildcard (`*`) access over all tenant endpoints, staff administration, finance, and company settings.
3. **`TENANT_SUB_ADMIN`**: An employee inside the tenant organization. Access is governed by granular permissions stored in `User.permissions`.

### 5.2 Mobile Operational Personas
On the mobile app and workforce module, users execute domain-specific workflows modeled through permissions and staff designations:
- **`OWNER` / `TENANT_ADMIN`**: Full company visibility, executive dashboard, financial receipts, staff onboarding.
- **`SALES_AGENT`**: Prospect pipeline, quick quotation builder, 1-click survey booking, WhatsApp pitch shares.
- **`TECHNICIAN` / `FIELD_ENGINEER`**: On-site survey audits, barcode scanning, electrical QA sign-offs, installation checklists.
- **`INVENTORY_MANAGER`**: PO tracking, serial number assignment, warehouse transfers, material dispatch.
- **`FINANCE_MANAGER`**: Milestone invoice generation, payment recording, receipts, loan financing.
- **`EPC_CONTRACTOR`**: Turnkey project execution, DISCOM 5-stage gating, PM Surya Ghar DBT submission.

### 5.3 Granular Permission Matrix

| Module | Permission String | TENANT_ADMIN | SALES_AGENT | TECHNICIAN | INVENTORY_MGR | FINANCE_MGR |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Leads & CRM** | `leads.view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `leads.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `leads.edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `leads.delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| | `leads.convert` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Site Surveys** | `surveys.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| | `surveys.create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| | `surveys.edit` | ✅ | ❌ | ✅ | ❌ | ❌ |
| | `surveys.convert` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Quotations** | `quotations.view` | ✅ | ✅ | ❌ | ❌ | ✅ |
| | `quotations.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `quotations.edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `quotations.convert`| ✅ | ✅ | ❌ | ❌ | ✅ |
| **Projects** | `projects.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| | `projects.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `projects.edit_stage`| ✅ | ❌ | ✅ | ❌ | ❌ |
| | `projects.tasks` | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Inventory** | `inventory.view` | ✅ | ❌ | ❌ | ✅ | ❌ |
| | `inventory.dispatch`| ✅ | ❌ | ❌ | ✅ | ❌ |
| | `inventory.receipt` | ✅ | ❌ | ❌ | ✅ | ❌ |
| | `inventory.transfer`| ✅ | ❌ | ❌ | ✅ | ❌ |
| **Procurement** | `procurement.view` | ✅ | ❌ | ❌ | ✅ | ✅ |
| | `procurement.create`| ✅ | ❌ | ❌ | ✅ | ❌ |
| | `procurement.status`| ✅ | ❌ | ❌ | ✅ | ❌ |
| **Installations** | `installations.view` | ✅ | ❌ | ✅ | ❌ | ❌ |
| | `installations.schedule` | ✅ | ❌ | ❌ | ❌ | ❌ |
| | `installations.qa` | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Finance** | `finance.view` | ✅ | ❌ | ❌ | ❌ | ✅ |
| | `finance.create_invoice` | ✅ | ❌ | ❌ | ❌ | ✅ |
| | `finance.record_payment` | ✅ | ❌ | ❌ | ❌ | ✅ |
| **DISCOM / Subsidy**| `discom.manage` | ✅ | ❌ | ✅ | ❌ | ❌ |
| | `subsidy.manage` | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Staff & Users** | `staff` (or `*`) | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Domain Entity Lifecycles & Business Rules

### 6.1 Leads / CRM Entity Lifecycle
```
[NEW] ───> [CONTACTED] ───> [QUALIFIED] ───> [SITE_SURVEY] ───> [PROPOSAL_SENT] ───> [NEGOTIATION] ───> [WON]
  │            │                 │                 │                    │                  │              │
  └───> [LOST / ON_HOLD] <───────┴─────────────────┴────────────────────┴──────────────────┴──────────────┘
                                                                                                          │
                                                                                        (1-Click Atomic Convert)
                                                                                                          ▼
                                                                                   Customer + Project + Survey + Statutory Apps
```
**Rules**:
- `Lead.status` defaults to `NEW`.
- Duplicate check matches `mobile` or `email` within the tenant.
- 1-Click Conversion triggers `prisma.$transaction`:
  1. Updates `Lead.status = 'WON'` (locked with atomic concurrency guard).
  2. Creates or links `Customer`.
  3. Locks latest quotation (`isLocked = true, status = 'ACCEPTED'`).
  4. Auto-creates `SiteSurvey` (scheduled +3 days).
  5. Auto-creates `Project` (`PRJ-XXXXX`) with 6 milestones and default tasks.
  6. Auto-creates `DiscomApplication` (`FEASIBILITY_PENDING`).
  7. Auto-creates `SubsidyApplication` (`CONSUMER_SELECTION`).

### 6.2 EPC Project Management Lifecycle
```
Canonical 7-Stage Progression:
[SURVEY_COMPLETED] (15%)
       │
       ▼
[STRUCTURE_APPROVED] (30%)
       │
       ▼
[MATERIAL_DISPATCHED] (50%)  ───> Auto-drafts Purchase Order for BOM
       │
       ▼
[INSTALLATION_STARTED] (75%)
       │
       ▼
[TESTING_COMPLETED] (90%)    ───> Requires Electrical QA sign-off (<5.0Ω, <2.0s)
       │
       ▼
[NET_METER_APPLIED] (95%)
       │
       ▼
[COMMISSIONED] (100%)        ───> Auto-creates 5-year AMC + Final Invoice + Completion Certificate (CC-XXXX)
```
**Rules**:
- Linear stage gating: `nextIdx > currentIdx + 1` is strictly rejected with HTTP 400.
- Stage transition records `ProjectStageHistory` and `ProjectTimelineEvent`.
- Status set to `Completed` and `actualCompletionDate = now()` when reaching `COMMISSIONED`.

### 6.3 Inventory & Multi-Warehouse Logistics
```
PO [ORDERED] ───> PO [SHIPPED] ───> PO [RECEIVED]
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             Product.currentStock += Qty          StockBalance.quantity += Qty
                        │                                     │
                        ▼                                     ▼
             StockLedger ('RECEIPT')             GoodsReceipt (GRN-XXXX)
```
**Rules**:
- Physical vs Reserved stock: `availableQuantity = quantity - reservedQuantity`.
- Status regression guard: PO cannot be altered once `RECEIVED`.
- Outbound material dispatch allocates serial numbers, updates `SerialNumber.status = 'INSTALLED'`, and decrements available stock.

### 6.4 Field Installation & Electrical QA
```
[SCHEDULED] ───> [ASSIGNED] ───> [EN_ROUTE] ───> [ON_SITE] ───> [IN_PROGRESS]
                                                                        │
                                                                        ▼
                                                         [CHECKLIST_DONE] (5 QA items)
                                                                        │
                                                                        ▼
                                                         [TESTING] (Electrical Thresholds)
                                                                        │
                                                         (Photos: ROOF, INVERTER, PANELS)
                                                                        ▼
                                                         [PENDING_REVIEW] ───> [COMPLETED]
```
**Statutory Electrical Thresholds**:
1. Earth Pit 1 (Inverter): `< 5.0 Ω` (CEA Regulations)
2. Earth Pit 2 (Structure): `< 5.0 Ω` (CEA Regulations)
3. Earth Pit 3 (Lightning Arrestor): `< 5.0 Ω` (CEA Regulations)
4. Anti-Islanding Grid Trip Time: `< 2.0 s` (IEEE 1547 / CEA Standards)
5. Inverter Insulation Resistance: `> 1.0 MΩ` (CEA Statutory Threshold)

### 6.5 Workforce & Staff Lifecycle
```
Add Staff ───> Temporary Password (Solar@XXXXXX) ───> First Login Force Reset ───> Active Staff
    │                                                                                   │
    ├── Revoke Login Account ──────────────────────────────────────────────> User deleted, Staff HR profile preserved
    │
    └── Delete Employee ───> Must reassign active projects & direct reports ───> Clean removal
```
**Rules**:
- `Staff.employeeId` must be unique per tenant (HTTP 409 if duplicate).
- Self-reporting manager assignments (`managerId === staff.id`) and circular loops are blocked (HTTP 400).
- Administrators cannot delete their own account or revoke their own active session.

### 6.6 Finance, Invoicing & Financial Mathematics
```
Accepted Proposal ───> 4 Milestone Tax Invoices (13.8% Composite GST)
                             │
                             ├─ Stage 1: Advance Booking (20%)
                             ├─ Stage 2: Material Delivery (60%)
                             ├─ Stage 3: Installation (15%)
                             └─ Stage 4: Commissioning & Handover (5%)
```
**Formulae**:
- **Composite Solar GST (13.8%)**: 70% of turnkey value treated as Goods @ 12% GST (`0.70 * 0.12 = 0.084`) + 30% treated as Services @ 18% GST (`0.30 * 0.18 = 0.054`). Effective rate = `8.4% + 5.4% = 13.8%`.
- **Section 15(3) Trade Discount**: If `overallDiscount > 0`, `taxableAmount = subtotal - overallDiscount`. Each line item base is scaled proportionally, and the last line item absorbs rounding difference: `itemBase = taxableAmount - runningBaseSum`.
- **Milestone Rounding Invariant**: `sum(milestones.map(m => m.amount)) === grandTotal` strictly. The 4th milestone absorbs any remainder: `milestone[3].amount = grandTotal - sum(milestone[0..2])`.
- **PM Surya Ghar Subsidy Caps**:
  - Residential <= 1 kW: ₹30,000
  - Residential <= 2 kW: ₹60,000
  - Residential >= 3 kW: ₹78,000 (maximum cap)
  - Commercial / Industrial: ₹0 (ineligible)
- **Solar Generation**: `annualGen = Math.round(capacityKw * 1460)` (~4.0 kWh/kWp/day); compounding 25-year degradation at 0.7%/year; `co2ReductionKg = Math.round(annualGen * 0.82)`.

### 6.7 Statutory DISCOM 5-Stage Gating State Machine
```
[FEASIBILITY_PENDING]
         │
         ▼ (Requires Feasibility Approval Letter)
[FEASIBILITY_APPROVED]
         │
         ▼ (Requires Feasibility Approval Document)
[CEIG_INSPECTION]
         │
         ▼ (Requires CEIG Approval Document)
[METER_TESTING]
         │
         ▼ (Requires Meter Test Report)
[NET_METER_INSTALLED]
         │
         ▼ (Requires Net-Meter Certificate)
[GRID_SYNCHRONIZED]
```

---

## 7. Data Integrity, Hardening & Security Guarantees

1. **Sub-Entity Tenancy Isolation**: In child entity mutations (`ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, `ServiceVisit`), queries MUST include parent relationship tenant filter (`where: { id, project: { tenantId } }`) to prevent IDOR vulnerabilities.
2. **Normalized JWT Identity**: Auth middleware sets `req.user = { id: payload.userId, userId: payload.userId, ...payload }` ensuring audit logs and self-deletion checks always resolve valid actor identifiers.
3. **No Mock / Dummy Data**: Real database queries and schema definitions must back every screen. Hardcoded mock identities (e.g. Thakre/Ekvarta fallbacks in project dossiers) are strictly forbidden.
4. **Instant Super Admin Lockout**: The 5-second in-memory tenant cache ensures tenant suspension is enforced sub-second across both mobile and web sessions.
