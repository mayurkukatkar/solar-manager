# WhereReady Solar OS — Complete Module & Submodule Inventory

**Document Status**: Authoritative Baseline  
**Date**: 2026-10-29  
**Version**: 1.0.0  
**Scope**: Complete inventory of all business modules, submodules, screens, endpoints, models, workflows, and edge cases across Web-Client, Backend, and Mobile App.

---

## 1. Module Overview Matrix

| # | Module Name | Primary Domain | Web Routes | Backend Routes | Primary Models | Implementation Status |
|---|---|---|---|---|---|---|
| 1 | **CRM & Leads** | Sales pipeline, prospect sizing, OCR intake | 2 | `routes/tenant/crm.js` | `Lead`, `LeadFollowUp`, `LeadNote`, `LeadActivity` | Operational |
| 2 | **Customer Directory** | Client master records, 360 dossiers | 2 | `routes/tenant/crm.js` | `Customer` | Operational |
| 3 | **Site Surveys & Engineering** | Feasibility audit, shading, roof layout | 2 | `routes/tenant/surveys.js` | `SiteSurvey`, `Document` | Operational |
| 4 | **Quotations & Sizing Engine** | 60-second wizard, composite GST, templates | 2 | `routes/tenant/quotations.js`, `templates.js` | `Quotation`, `QuotationItem`, `ProposalTemplate` | Operational |
| 5 | **EPC Projects & Operations** | Project master, BOM, stage gating, tasks | 4 | `routes/tenant/crm.js`, `discom.js` | `Project`, `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement` | Operational |
| 6 | **Inventory & Warehouses** | Stock ledger, multi-warehouse, serialized stock | 6 | `routes/tenant/crm.js` | `Product`, `Warehouse`, `StockLedger`, `StockBalance`, `SerialNumber`, `GoodsReceipt`, `MaterialDispatch`, `StockTransfer` | Operational |
| 7 | **Procurement & Vendors** | Hardware POs, supplier status, auto-stocking | 1 | `routes/tenant/procurement.js` | `PurchaseOrder`, `PurchaseOrderItem` | Operational |
| 8 | **Field Installation** | Work orders, on-site checklists, photo QA | 3 | `routes/tenant/installations.js` | `InstallationJob`, `InstallationChecklistItem`, `InstallationPhoto`, `CompletionCertificate` | Operational / 404 links |
| 9 | **Workforce & Staff** | Team members, departments, granular RBAC | 2 | `routes/tenant/staff.js`, `users.js` | `Staff`, `Department`, `User`, `ProjectStaffAssignment` | Operational |
| 10 | **Finance, Invoices & Loans** | Milestone billing (20/60/15/5%), receipts, loans | 2 | `routes/tenant/finance.js`, `loans.js` | `Invoice`, `Payment`, `LoanApplication` | Operational |
| 11 | **Statutory DISCOM & Subsidy** | PM Surya Ghar DBT, MSEDCL 5-stage gating | 1 | `routes/tenant/subsidy.js`, `discom.js` | `SubsidyApplication`, `DiscomApplication` | Operational |
| 12 | **Service, Warranty & AMC** | Post-sales tickets, service visits, AMC contracts | 2 | `routes/tenant/service.js`, `amc.js` | `SupportTicket`, `ServiceVisit`, `AMC` | Operational |
| 13 | **System, Reports & Settings** | Company profile, GSTIN/PAN, bank UPI, audit | 5 | `routes/tenant/settings.js`, `auditLogs.js`, `notifications.js`, `communication.js`, `automation.js` | `Tenant`, `TenantNotification`, `CommunicationLog`, `AutomationRule` | Operational |
| 14 | **Super-Admin Platform** | Multi-tenant governance, plans, suspension | 12 | `routes/admin/superAdmin.js` | `Tenant`, `Plan`, `Subscription`, `PlatformLead`, `Announcement` | Operational |
| 15 | **Mobile Field Engineering** | QR barcode scanning, earthing QA, stamp paper | 8 screens | Backend `/api/tenant/*` | Local drafts (`AsyncStorage`), Project Serials | Operational |
| 16 | **Public Marketing & Portals** | Marketing landing, solar storytelling, demo request | 10 | `/api/demo-request`, `routes/auth.js` | `PlatformLead`, `User` | Operational |

---

## 2. Module Deep-Dive Specifications

### 2.1 Module 1: CRM & Leads Pipeline
- **Purpose**: Manage the solar prospect journey from acquisition through technical qualification, sizing, and conversion to customer/project.
- **Frontend Views**:
  - `/tenant/leads` (`src/app/tenant/leads/page.tsx`): 8-stage interactive Kanban board (`NEW`, `CONTACTED`, `SITE_SURVEY_SCHEDULED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`), searchable table view, Add Lead modal, follow-up scheduling modal.
  - `/tenant/leads/[id]` (`src/app/tenant/leads/[id]/page.tsx`): 360-degree lead dossier, communication history, stage progression selector, 1-click conversion to project.
- **Backend Endpoints (`backend/routes/tenant/crm.js`)**:
  - `GET /api/tenant/leads/dashboard`: KPI metrics (total leads, pipeline value, conversion rate, monthly velocity).
  - `GET /api/tenant/leads`: Paginated lead query with filters (`status`, `source`, `search`, `assignedTo`).
  - `POST /api/tenant/leads`: Create new prospect with preliminary utility bill and sizing data.
  - `GET /api/tenant/leads/:id`: Detailed lead profile with follow-ups and notes.
  - `PATCH /api/tenant/leads/:id`: Update lead status, stage, or commercial details.
  - `DELETE /api/tenant/leads/:id`: Soft delete / archive prospect.
  - `POST /api/tenant/leads/:id/followups`: Schedule next follow-up with reminder.
  - `POST /api/tenant/leads/:id/notes`: Record customer interaction notes.
  - `POST /api/tenant/leads/:id/convert`: Idempotent conversion from Won Lead to Customer, Project, Survey, and Statutory applications.
  - `GET /api/tenant/leads/:id/quotations`: Retrieve linked quotations.
- **Data Models**:
  - `Lead`: `id`, `tenantId`, `name`, `email`, `phone`, `address`, `city`, `state`, `pincode`, `status`, `stage`, `source`, `monthlyBill`, `sanctionedLoad`, `estimatedCapacity`, `assignedToId`, `createdAt`, `updatedAt`.
  - `LeadFollowUp`: `id`, `leadId`, `scheduledAt`, `status`, `notes`, `createdById`.
  - `LeadNote`: `id`, `leadId`, `content`, `authorId`, `createdAt`.
  - `LeadActivity`: `id`, `leadId`, `type`, `description`, `performedById`, `timestamp`.
- **Workflows**:
  - Lead Capture -> Utility bill OCR parsing -> Sizing estimation -> Kanban progression -> 1-click Conversion.
- **Known Gaps & Risks**:
  - Modal form uses `grid-cols-2` without mobile breakpoint (`grid-cols-1 sm:grid-cols-2`), compressing inputs on viewports < 360px.
  - Double-click on conversion button lacks debouncing lock.

---

### 2.2 Module 2: Customer Master Directory
- **Purpose**: Maintain the legal, commercial, and technical identity of residential and commercial solar clients.
- **Frontend Views**:
  - `/tenant/crm` (`src/app/tenant/crm/page.tsx`): Searchable customer table, capacity summary, quick contact actions (WhatsApp/Call/Email).
  - `/tenant/crm/[id]` (`src/app/tenant/crm/[id]/page.tsx`): Customer 360 profile showing linked quotations, active projects, uploaded KYC documents, and billing history.
- **Backend Endpoints (`backend/routes/tenant/crm.js`)**:
  - `GET /api/tenant/customers`: Paginated client query with search by name, phone, or DISCOM consumer number.
  - `GET /api/tenant/customers/:id`: Detailed customer profile with linked projects and invoices.
- **Data Models**:
  - `Customer`: `id`, `tenantId`, `leadId`, `name`, `email`, `phone`, `alternatePhone`, `address`, `city`, `state`, `pincode`, `consumerNumber`, `discom`, `sanctionedLoadKw`, `pan`, `aadhaar`, `bankAccountName`, `bankAccountNumber`, `bankIfsc`, `bankName`, `createdAt`.
- **Workflows**:
  - Automatic creation upon Lead conversion or direct client onboarding via Customer Onboarding modal.
- **Known Gaps & Risks**:
  - Missing direct update endpoint (`PATCH /api/tenant/customers/:id`) in some route setups; customer updates currently route through lead or project sync.

---

### 2.3 Module 3: Site Surveys & Rooftop Engineering
- **Purpose**: Perform technical rooftop feasibility studies, shadow analysis, structural load calculation, and electrical interconnection checks.
- **Frontend Views**:
  - `/tenant/surveys` (`src/app/tenant/surveys/page.tsx`): Survey queue, roof type filter (RCC, Tin Shade, Tile), technician assignment, Schedule Survey modal.
  - `/tenant/surveys/[id]` (`src/app/tenant/surveys/[id]/page.tsx`): Feasibility audit dossier with shadow-free area (sq.ft.), proposed system capacity (kW), roof azimuth/tilt, photo gallery, and 1-click quote conversion.
- **Backend Endpoints (`backend/routes/tenant/surveys.js`)**:
  - `GET /api/tenant/surveys`: List surveys filtered by status (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
  - `POST /api/tenant/surveys`: Provision new site survey.
  - `GET /api/tenant/surveys/:id`: Full survey dossier with photos.
  - `PATCH /api/tenant/surveys/:id`: Update technical parameters (shadow-free area, roof pitch, obstacles).
  - `PATCH /api/tenant/surveys/:id/status`: Update workflow status.
  - `POST /api/tenant/surveys/:id/photos`: Upload geo-tagged site survey photos to Cloudinary.
  - `POST /api/tenant/surveys/:id/convert-to-quote`: Generate quotation pre-populated with surveyed technical capacity.
- **Data Models**:
  - `SiteSurvey`: `id`, `tenantId`, `customerId`, `leadId`, `projectId`, `assignedStaffId`, `scheduledDate`, `completedDate`, `roofType`, `roofAreaSqFt`, `shadowFreeAreaSqFt`, `structuralFeasibility`, `sanctionedLoadKw`, `gridPhase`, `distanceToMeterMeters`, `status`, `notes`.
- **Workflows**:
  - Technician assigned -> On-site survey conducted -> Roof area recorded -> 1-Click Convert to Quotation.
- **Known Gaps & Risks**:
  - Native `alert()` calls used in error handlers (`surveys/page.tsx:162, 194`).
  - Route shadowing: Endpoints duplicated in `operations.js`.

---

### 2.4 Module 4: Quotations & Sizing Engine
- **Purpose**: Fast commercial solar proposal generation with Tier-1 component catalogs, financial cash flows, composite GST (13.8%), and editorial PDF generation.
- **Frontend Views**:
  - `/tenant/quotations` (`src/app/tenant/quotations/page.tsx`): Proposals master directory, status metrics, follow-up reminders, WhatsApp pitch modal, PDF download action.
  - `/tenant/quotations/pdf-demo` (`src/app/tenant/quotations/pdf-demo/page.tsx`): Interactive A4 proposal preview playground.
  - Modals: `QuotationWizardModal.tsx` (6-step interactive proposal builder), `QuotationDetailModal.tsx` (proposal inspector), `TemplateDesignerModal.tsx` (branding customizer).
- **Backend Endpoints (`backend/routes/tenant/quotations.js`, `templates.js`)**:
  - `GET /api/tenant/quotations`: Proposals list with filter by customer, status, or date range.
  - `POST /api/tenant/quotations`: Create comprehensive quotation with line items.
  - `GET /api/tenant/quotations/:id`: Full proposal dossier.
  - `PATCH /api/tenant/quotations/:id`: Update line items and pricing terms.
  - `DELETE /api/tenant/quotations/:id`: Soft delete unaccepted proposals.
  - `POST /api/tenant/quotations/:id/convert`: Lock proposal and convert to active EPC project.
  - `POST /api/tenant/quotations/:id/revision`: Create immutable revision (`v1 -> v2`).
  - `POST /api/tenant/quotations/:id/duplicate`: Clone proposal as draft.
  - `POST /api/tenant/quotations/:id/share`: Generate shareable link and WhatsApp payload.
  - `GET/POST /api/tenant/templates`: Manage reusable proposal styling templates.
- **Data Models**:
  - `Quotation`: `id`, `tenantId`, `qNumber`, `customerId`, `leadId`, `systemCapacityKw`, `subtotal`, `taxAmount`, `grandTotal`, `subsidyAmount`, `netPayable`, `status`, `isLocked`, `version`, `validUntil`, `createdAt`.
  - `QuotationItem`: `id`, `quotationId`, `productId`, `description`, `quantity`, `unitPrice`, `taxRate`, `totalAmount`.
  - `ProposalTemplate`: `id`, `tenantId`, `name`, `layoutType`, `colorPalette`, `heroImage`, `isDefault`.
- **Workflows**:
  - Sizing calculation -> Hardware selection -> Composite GST breakdown -> Revision management -> 1-Click Project conversion.
- **Known Gaps & Risks**:
  - GST overcharge bug on overall discount in `solarCalculator.ts` / `solarCalculator.js`.
  - Milestone 1-rupee rounding drift on odd totals.

---

### 2.5 Module 5: EPC Projects & Execution Management
- **Purpose**: Manage the turnkey engineering, procurement, and construction (EPC) execution lifecycle from quotation acceptance to grid synchronization.
- **Frontend Views**:
  - `/tenant/projects` (`src/app/tenant/projects/page.tsx`): Projects hub with 7-stage filters (`SURVEY_COMPLETED`, `STRUCTURE_APPROVED`, `MATERIAL_DISPATCHED`, `INSTALLATION_STARTED`, `TESTING_COMPLETED`, `NET_METER_APPLIED`, `COMMISSIONED`).
  - `/tenant/projects/new` (`src/app/tenant/projects/new/page.tsx`): Multi-step project creation wizard.
  - `/tenant/projects/[id]` (`src/app/tenant/projects/[id]/page.tsx`): Project master dossier, DISCOM statutory form generation (WCR, Annexure 2, Net Metering Agreement), task/milestone/material modals.
  - `/tenant/tasks` (`src/app/tenant/tasks/page.tsx`): Drag-and-drop task Kanban board.
- **Backend Endpoints (`backend/routes/tenant/crm.js`, `discom.js`)**:
  - `GET /api/tenant/projects`: List tenant projects with capacity, stage, and client metrics.
  - `POST /api/tenant/projects`: Create new project.
  - `GET /api/tenant/projects/:id`: Full project dossier with BOM, tasks, and stage history.
  - `PATCH /api/tenant/projects/:id/stage`: Advance stage with validation gating.
  - `POST /api/tenant/projects/:id/tasks`: Create execution task.
  - `PATCH /api/tenant/tasks/:id`: Update task status.
  - `POST /api/tenant/projects/:id/milestones`: Create financial milestone.
  - `PATCH /api/tenant/milestones/:id`: Update milestone.
  - `POST /api/tenant/projects/:id/materials`: Allocate material requirements.
  - `PATCH /api/tenant/materials/:id`: Update material requirement status.
- **Data Models**:
  - `Project`: `id`, `tenantId`, `projectNumber`, `customerId`, `leadId`, `quotationId`, `capacity`, `stage`, `status`, `targetDate`, `commissionedDate`, `totalCost`, `contractValue`.
  - `ProjectTask`: `id`, `projectId`, `title`, `description`, `stage`, `status`, `priority`, `assignedToId`, `dueDate`.
  - `ProjectMilestone`: `id`, `projectId`, `title`, `stage`, `percentage`, `amount`, `isBilled`, `isPaid`.
  - `ProjectMaterialRequirement`: `id`, `projectId`, `productId`, `quantityRequired`, `quantityAllocated`, `quantityDispatched`, `status`.
- **Workflows**:
  - Conversion from Quotation -> Auto-provision BOM & Initial Tasks -> Advance stages -> Generate Statutory Net Metering pack.
- **Known Gaps & Risks**:
  - **P0 Isolation Vulnerability**: Sub-entity mutations (`tasks`, `milestones`, `materials`) lack parent tenant ownership verification.
  - **Data Leak**: Hardcoded Ekvarta/Thakre identity fallback in `tenant/projects/[id]/page.tsx:87-144`.
  - Dead link: `/tenant/quotations/new` inside project details.

---

### 2.6 Module 6: Inventory & Multi-Warehouse Logistics
- **Purpose**: Real-time tracking of PV modules, inverters, structures, cables, and balance-of-system (BOS) components across multiple warehouse locations.
- **Frontend Views**:
  - `/tenant/inventory` (`src/app/tenant/inventory/page.tsx`): Inventory valuation KPIs, stock alerts, low-stock warnings, warehouse distribution.
  - `/tenant/inventory/ledger` (`src/app/tenant/inventory/ledger/page.tsx`): Immutable stock ledger transaction history (`IN`, `OUT`, `TRANSFER`, `ADJUSTMENT`).
  - `/tenant/inventory/products` (`src/app/tenant/inventory/products/page.tsx`): Product catalog with SKU, brand, wattage, and stock counts.
  - `/tenant/inventory/warehouses` (`src/app/tenant/inventory/warehouses/page.tsx`): Multi-warehouse facility directory.
  - `/tenant/inventory/dispatch/new` (`src/app/tenant/inventory/dispatch/new/page.tsx`): Material dispatch order form with serialized allocation.
  - `/tenant/products` (`src/app/tenant/products/page.tsx`): Standalone catalog manager.
- **Backend Endpoints (`backend/routes/tenant/crm.js`)**:
  - `GET /api/tenant/inventory/dashboard`: Stock valuation, item counts, low stock alerts.
  - `GET /api/tenant/inventory/products`: Products with total available stock across warehouses.
  - `GET /api/tenant/inventory/warehouses`: Facility directory.
  - `GET /api/tenant/inventory/stock-ledger`: Audit ledger entries.
  - `GET /api/tenant/inventory/serial-numbers`: Serialized hardware inventory query.
  - `POST /api/tenant/inventory/dispatch`: Outbound material dispatch for project.
  - `POST /api/tenant/inventory/receipt`: Inbound goods receipt.
- **Data Models**:
  - `Product`: `id`, `tenantId`, `name`, `sku`, `category`, `brand`, `model`, `wattage`, `costPrice`, `sellingPrice`, `unit`, `minStockLevel`.
  - `Warehouse`: `id`, `tenantId`, `name`, `code`, `address`, `city`, `state`, `isPrimary`.
  - `StockBalance`: `id`, `productId`, `warehouseId`, `quantityOnHand`, `quantityReserved`.
  - `StockLedger`: `id`, `tenantId`, `productId`, `warehouseId`, `type`, `quantity`, `referenceType`, `referenceId`, `balanceAfter`, `timestamp`.
  - `SerialNumber`: `id`, `productId`, `warehouseId`, `serialNumber`, `status`, `projectId`.
  - `GoodsReceipt`, `MaterialDispatch`, `StockTransfer`: Inbound/outbound/transfer movement records.
- **Workflows**:
  - Purchase order received -> Auto-receipt to warehouse -> Serial numbers scanned -> Material dispatch to project.
- **Known Gaps & Risks**:
  - Dead links: `/tenant/inventory/products/new` (links point to missing page instead of add product modal).

---

### 2.7 Module 7: Procurement & Vendor Management
- **Purpose**: Manage vendor relationships and purchase orders for Tier-1 solar modules, inverters, and electrical components.
- **Frontend Views**:
  - `/tenant/procurement` (`src/app/tenant/procurement/page.tsx`): Purchase orders directory, supplier statuses, create PO modal, receive shipment action.
- **Backend Endpoints (`backend/routes/tenant/procurement.js`)**:
  - `GET /api/tenant/procurement`: Summary stats and recent POs.
  - `GET /api/tenant/procurement/pos`: Paginated PO list with filters.
  - `POST /api/tenant/procurement`: Create new Purchase Order.
  - `GET /api/tenant/procurement/:id`: PO dossier with line items.
  - `PATCH /api/tenant/procurement/:id/status`: Update PO status (`DRAFT`, `PLACED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`). Automatically increments product stock upon `RECEIVED`.
  - `DELETE /api/tenant/procurement/:id`: Archive draft PO.
- **Data Models**:
  - `PurchaseOrder`: `id`, `tenantId`, `poNumber`, `vendorName`, `vendorGst`, `status`, `orderDate`, `expectedDeliveryDate`, `subtotal`, `taxAmount`, `grandTotal`, `destinationWarehouseId`.
  - `PurchaseOrderItem`: `id`, `purchaseOrderId`, `productId`, `description`, `quantity`, `unitPrice`, `taxRate`, `totalAmount`.
- **Workflows**:
  - Create PO -> Send to manufacturer -> Mark as `RECEIVED` -> Stock ledger automatically updated.
- **Known Gaps & Risks**:
  - Vendor directory currently relies on free-text strings on PO rather than dedicated Vendor master model.

---

### 2.8 Module 8: Field Installation Operations
- **Purpose**: Coordinate field technicians, manage on-site installation work orders, and enforce quality sign-offs.
- **Frontend Views**:
  - `/tenant/installation` (`src/app/tenant/installation/page.tsx`): Installation overview dashboard, job metrics, quick navigation cards.
  - `/tenant/installation/jobs` (`src/app/tenant/installation/jobs/page.tsx`): Active installation jobs list, crew assignment, progress tracking.
  - `/tenant/installation/[id]` (`src/app/tenant/installation/[id]/page.tsx`): Detailed job execution checklist, photo uploads, sign-off.
- **Backend Endpoints (`backend/routes/tenant/installations.js`)**:
  - `GET /api/tenant/installations/dashboard`: Active jobs, completion rates.
  - `GET /api/tenant/installations`: Filtered installation jobs.
  - `POST /api/tenant/installations/schedule`: Schedule new installation job.
  - `GET /api/tenant/installations/:id`: Job details with checklist items and photos.
  - `PUT /api/tenant/installations/:id/status`: Advance installation status (`SCHEDULED`, `IN_PROGRESS`, `QA_PENDING`, `COMPLETED`).
- **Data Models**:
  - `InstallationJob`: `id`, `tenantId`, `projectId`, `assignedTeamLeaderId`, `scheduledDate`, `completionDate`, `status`, `structureType`, `earthingStatus`.
  - `InstallationChecklistItem`: Checklist template questions.
  - `InstallationChecklistResponse`: Technician responses and measurements.
  - `InstallationPhoto`: Geo-tagged installation photos.
  - `CompletionCertificate`: Formal project completion certificate.
- **Workflows**:
  - Material dispatched -> Job scheduled -> On-site checklist completed -> Electrical QA verified -> Completion certificate issued.
- **Known Gaps & Risks**:
  - Multiple 404 links: `/tenant/installation/schedule`, `/tenant/installation/calendar`, `/tenant/installation/checklists`.

---

### 2.9 Module 9: Workforce, Roles & Staff Management
- **Purpose**: Manage employees, field technicians, sales executives, and departments with granular role-based permissions.
- **Frontend Views**:
  - `/tenant/staff` (`src/app/tenant/staff/page.tsx`): Employee master directory, department filters, RBAC permission toggles, temporary credentials issuance.
  - `/tenant/users` (`src/app/tenant/users/page.tsx`): Workspace user accounts, roles (`TENANT_ADMIN`, `TENANT_SUB_ADMIN`), account status.
- **Backend Endpoints (`backend/routes/tenant/staff.js`, `users.js`)**:
  - `GET /api/tenant/staff/overview`: Employee count by department, active staff metrics.
  - `GET/POST /api/tenant/staff`: List and create employee records.
  - `GET/PATCH/DELETE /api/tenant/staff/:id`: Manage employee profile.
  - `POST /api/tenant/staff/:id/suspend`: Instantly revoke staff login access.
  - `POST /api/tenant/staff/:id/reactivate`: Restore staff access.
  - `POST /api/tenant/staff/:id/resend-credentials`: Issue one-time temporary password.
  - `GET/POST /api/tenant/departments`: Manage company departments.
  - `GET/POST /api/tenant/users`: Manage user logins.
  - `PATCH /api/tenant/users/:id/role`: Change user role.
- **Data Models**:
  - `Staff`: `id`, `tenantId`, `userId`, `departmentId`, `employeeCode`, `name`, `email`, `phone`, `designation`, `status`, `joiningDate`.
  - `Department`: `id`, `tenantId`, `name`, `code`, `description`.
  - `User`: `id`, `tenantId`, `email`, `passwordHash`, `role`, `status`, `permissions`, `forcePasswordReset`.
  - `ProjectStaffAssignment`: `id`, `tenantId`, `projectId`, `staffId`, `role`, `assignedAt`.
- **Workflows**:
  - Add employee -> Assign department & granular permissions -> Issue temporary password -> Mandatory reset on initial login.
- **Known Gaps & Risks**:
  - Granular RBAC (`requirePermission`) defined in auth middleware is not applied to operational routes.
  - Self-deletion check in `users.js:272` fails due to `req.user.id` JWT bug.

---

### 2.10 Module 10: Finance, Milestone Invoicing & Loans
- **Purpose**: Manage solar commercial milestones (20% Advance, 60% Delivery, 15% Installation, 5% Commissioning), tax invoice generation with composite GST, payment receipts, and rooftop solar financing.
- **Frontend Views**:
  - `/tenant/finance` (`src/app/tenant/finance/page.tsx`): Invoicing command center, milestone progress, payment recording modal, tax invoice PDF preview.
  - `/tenant/loans` (`src/app/tenant/loans/page.tsx`): Solar rooftop loan application tracking, lender selection, EMI calculations.
- **Backend Endpoints (`backend/routes/tenant/finance.js`, `loans.js`)**:
  - `GET /api/tenant/finance/stats`: Billed revenue, collected payments, outstanding receivables.
  - `GET /api/tenant/finance`: List invoices with search and status filters.
  - `POST /api/tenant/finance/convert-quotation`: Auto-generate 4 milestone tax invoices from accepted quote.
  - `POST /api/tenant/finance/milestone-invoices`: Create custom milestone invoice.
  - `GET /api/tenant/invoices/:id/pdf`: High-fidelity server-rendered PDF tax invoice.
  - `POST /api/tenant/invoices/:id/payments`: Record received payment against invoice.
  - `GET /api/tenant/invoices/:id/receipt/:paymentId`: Generate formal payment receipt.
  - `GET/POST /api/tenant/loans`: Manage solar customer loan financing applications.
- **Data Models**:
  - `Invoice`: `id`, `tenantId`, `invoiceNumber`, `customerId`, `projectId`, `quotationId`, `milestoneStage`, `subtotal`, `cgst`, `sgst`, `igst`, `totalTax`, `grandTotal`, `paidAmount`, `balanceDue`, `dueDate`, `status`.
  - `Payment`: `id`, `invoiceId`, `amount`, `paymentMethod`, `transactionReference`, `paymentDate`, `receiptNumber`, `notes`.
  - `LoanApplication`: `id`, `tenantId`, `customerId`, `projectId`, `lenderName`, `loanAmount`, `interestRate`, `tenureMonths`, `emiAmount`, `status`.
- **Workflows**:
  - Quote converted -> 4 Milestone Invoices spawned -> Client pays -> Payment recorded -> Balance reconciled.
- **Known Gaps & Risks**:
  - Native browser `alert()` calls used in `finance/page.tsx:198, 227`.
  - Floating-point milestone rounding drift.

---

### 2.11 Module 11: Statutory DISCOM & PM Surya Ghar Subsidy
- **Purpose**: National rooftop solar subsidy processing (PM Surya Ghar Muft Bijli Yojana) and statutory utility grid interconnection (MSEDCL/MERC 2019 standards).
- **Frontend Views**:
  - `/tenant/subsidy` (`src/app/tenant/subsidy/page.tsx`): 7-stage national portal studio, Smart Paste parser, Bulk DCR module serial formatter, Bank IFSC verification, printable inspection dossier.
- **Backend Endpoints (`backend/routes/tenant/subsidy.js`, `discom.js`)**:
  - `GET /api/tenant/subsidies`: List subsidy applications with funnel metrics.
  - `POST /api/tenant/subsidies`: Register application with consumer details and bank account.
  - `POST /api/tenant/pmsuryaghar/smart-parse`: Intelligent regex parser extracting consumer number, application ID, name, load, and bank details from raw text/SMS.
  - `POST /api/tenant/pmsuryaghar/bulk-import`: Bulk upload DCR module serial numbers.
  - `POST /api/tenant/pmsuryaghar/:id/verify-bank`: Verify customer bank account details for DBT disbursement.
  - `GET/POST /api/tenant/projects/:projectId/discom`: View or update statutory grid connection stage.
  - `PATCH /api/tenant/projects/:projectId/discom/stage`: Advance 5-stage DISCOM gating state machine.
- **Data Models**:
  - `SubsidyApplication`: `id`, `tenantId`, `customerId`, `projectId`, `applicationNumber`, `consumerNumber`, `discom`, `capacityKw`, `subsidyAmount`, `stage` (7 stages: `CONSUMER_SELECTION` -> `DBT_DISBURSED`), `bankVerified`, `dbtDisbursedDate`.
  - `DiscomApplication`: `id`, `tenantId`, `projectId`, `consumerNumber`, `sanctionedLoadKw`, `stage` (5 stages: `FEASIBILITY_PENDING` -> `GRID_SYNCHRONIZED`), `feasibilityDocUrl`, `ceigDocUrl`, `meterTestDocUrl`, `netMeterDocUrl`.
- **Workflows**:
  - Feasibility application -> CEIG approval -> Meter testing -> Net meter installation -> Grid synchronization -> DBT subsidy claim.
- **Known Gaps & Risks**:
  - Hardcoded Thakre/Ekvarta identity leaks in statutory document generator fallback in project detail page.

---

### 2.12 Module 12: Service, Warranty & AMC
- **Purpose**: Post-commissioning customer support, preventive maintenance visits, and Annual Maintenance Contracts management.
- **Frontend Views**:
  - `/tenant/service` (`src/app/tenant/service/page.tsx`): Ticket queues, technician assignment, issue categorization.
  - `/tenant/amc` (`src/app/tenant/amc/page.tsx`): AMC contracts hub, expiry alerts, scheduled preventive visits.
- **Backend Endpoints (`backend/routes/tenant/support.js`, `amc.js`)**:
  - `GET/POST /api/tenant/tickets`: Manage customer service tickets.
  - `PATCH /api/tenant/tickets/:id/status`: Update ticket status (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
  - `POST /api/tenant/tickets/:id/visits`: Schedule technician on-site service visit.
  - `GET/POST /api/tenant/amcs`: List and create AMC agreements.
  - `GET /api/tenant/projects/:projectId/warranty`: Retrieve 25-year module and 10-year inverter warranty cards.
- **Data Models**:
  - `SupportTicket`: `id`, `tenantId`, `customerId`, `projectId`, `ticketNumber`, `subject`, `description`, `priority`, `status`, `assignedStaffId`.
  - `ServiceVisit`: `id`, `ticketId`, `scheduledDate`, `completedDate`, `technicianNotes`, `partsReplaced`, `cost`.
  - `AMC`: `id`, `tenantId`, `customerId`, `projectId`, `contractNumber`, `startDate`, `endDate`, `contractValue`, `visitsPerYear`, `status`.
- **Workflows**:
  - Customer logs fault -> Ticket created -> Technician dispatched -> Service visit logged -> Ticket closed.
- **Known Gaps & Risks**:
  - `ServiceVisit` creation in `finance.js:1450` lacks parent ticket tenant ownership check.

---

### 2.13 Module 13: Tenant Settings, Reports & System Administration
- **Purpose**: Configure organizational identity, GSTIN/PAN, bank accounts, UPI QR codes, document numbering sequences, audit logs, and automated notifications.
- **Frontend Views**:
  - `/tenant/settings` (`src/app/tenant/settings/page.tsx`): Organization profile, statutory tax IDs, EPC bank details & UPI QR, branding logo/signature, sequence prefixes.
  - `/tenant/reports` (`src/app/tenant/reports/page.tsx`): Business analytics, sales velocity, financial conversion rates.
  - `/tenant/notifications` (`src/app/tenant/notifications/page.tsx`): In-app notification feed.
  - `/tenant/communication` (`src/app/tenant/communication/page.tsx`): WhatsApp/SMS template manager.
  - `/tenant/audit-logs` (`src/app/tenant/audit-logs/page.tsx`): Security audit trail.
- **Backend Endpoints (`backend/routes/tenant/settings.js`, `auditLogs.js`, etc.)**:
  - `GET/PATCH /api/tenant/settings`: Retrieve and update tenant settings.
  - `POST /api/tenant/settings/upload`: Upload branding logo, signature, or UPI QR asset.
  - `GET /api/tenant/audit-logs`: Query workspace security events.
  - `GET/POST /api/tenant/notifications`: Notification management.
  - `GET/POST /api/tenant/automation/rules`: Workflow automation engine.
- **Data Models**:
  - `Tenant`: `id`, `name`, `slug`, `gstin`, `pan`, `phone`, `email`, `address`, `city`, `state`, `pincode`, `logoUrl`, `signatureUrl`, `bankName`, `bankAccountNo`, `bankIfsc`, `bankUpiId`, `qrCodeUrl`, `quotationPrefix`, `projectPrefix`, `invoicePrefix`.
  - `TenantNotification`, `CommunicationLog`, `AutomationRule`.
- **Workflows**:
  - Tenant admin configures profile & bank details -> Prefixes and branding automatically apply across all generated quotations, invoices, and statutory documents.
- **Known Gaps & Risks**:
  - `actorId` in audit logs evaluates to `undefined` due to the JWT `userId` vs `id` bug.

---

### 2.14 Module 14: Super-Admin SaaS Platform
- **Purpose**: Global multi-tenant administration, tenant provisioning, SaaS subscription tier management, instant tenant suspension, and cross-tenant analytics.
- **Frontend Views (12 Pages)**:
  - `/super-admin/dashboard`, `/super-admin/leads`, `/super-admin/tenants`, `/super-admin/tenants/create`, `/super-admin/tenants/[id]`, `/super-admin/subscriptions`, `/super-admin/subscriptions/plans`, `/super-admin/features`, `/super-admin/integrations`, `/super-admin/security/audit-logs`, `/super-admin/support/tickets`, `/super-admin/cms/pages`.
- **Backend Endpoints (`backend/routes/admin/superAdmin.js`)**:
  - `GET/POST /api/super-admin/tenants`: Tenant onboarding and search.
  - `GET/PUT /api/super-admin/tenants/:id/status`: Instant tenant status toggle (`ACTIVE`, `SUSPENDED`, `CANCELLED`).
  - `GET/POST/PUT/DELETE /api/super-admin/plans`: SaaS pricing plan tiers.
  - `GET /api/super-admin/subscriptions`: Subscription lifecycles.
  - `GET /api/super-admin/kpis`: Platform MRR, tenant count, aggregate installed capacity.
  - `GET/POST/PATCH/DELETE /api/super-admin/platform-leads`: Marketing demo requests.
- **Data Models**:
  - `Tenant`, `Plan`, `Subscription`, `PlatformLead`, `Announcement`.
- **Workflows**:
  - Tenant signs up -> Super admin provisions account -> Status enforced via middleware -> Suspended tenants immediately locked out across Web & Mobile.
- **Known Gaps & Risks**:
  - Dead links in layout: `/super-admin/profile` and `/super-admin/security` (correct route is `/super-admin/security/audit-logs`).

---

### 2.15 Module 15: Mobile Field Engineering Suite
- **Purpose**: Dedicated on-site tools for field engineers and technicians with offline capability.
- **Screens & Modals (`mobile-app/src/screens/`)**:
  - `QuickQuoteScreen.tsx`: Rapid sizing, hardware specs, subsidy computation.
  - `BarcodeScannerModal.tsx`: Real-time 2D barcode scanner capturing module & inverter serials for DCR compliance.
  - `InstallationQAModal.tsx`: Electrical earthing QA (< 5.0Ω for 3 pits, anti-islanding trip < 2.0s).
  - `DiscomDocsModal.tsx`: 7-template statutory MSEDCL PDF generator with physical stamp paper margin toggle.
  - `CustomerOnboardingModal.tsx`: On-site client conversion with mandatory DISCOM consumer number.
  - `LeadCaptureModal.tsx`: Field lead intake with offline draft fallback.
- **Backend Communication**:
  - Queries `/api/tenant/*` using Axios with JWT bearer tokens.
  - Intercepts 403 `TENANT_SUSPENDED` and renders lock modal.
- **Workflows**:
  - Field technician scans equipment -> Signs off electrical QA -> Generates statutory PDF pack -> Data synchronizes to backend.
- **Known Gaps & Risks**:
  - Missing `'PM Surya Ghar Muft Bijli Yojana'` text in `pdfService.ts` causing parity test failure.

---

### 2.16 Module 16: Public Marketing & Demo Portal
- **Purpose**: Customer-facing promotional website, product experience storytelling, solar EPC lifecycle walkthrough, and demo scheduling.
- **Frontend Views (10 Pages)**:
  - `/` (`src/app/page.tsx`): Dynamic marketing landing with interactive quotation scene, product experience demo, and WhatsApp CTA.
  - `/demo`, `/features`, `/how-it-works`, `/pricing`, `/privacy`, `/security`, `/terms`, `/login`, `/suspended`.
- **Backend Endpoints**:
  - `POST /api/demo-request`: Ingest demo booking request into `PlatformLead`.
  - `POST /api/auth/login`: Unified login endpoint.
- **Data Models**:
  - `PlatformLead`: `id`, `name`, `email`, `phone`, `companyName`, `estimatedVolume`, `notes`, `status`.

---

*This comprehensive inventory defines the functional baseline for every module across WhereReady Solar OS.*
