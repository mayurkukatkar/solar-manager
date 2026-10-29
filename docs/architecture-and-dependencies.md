# WhereReady Solar OS — System Architecture, Dependencies & Interface Contracts

**Document Status**: Authoritative Baseline  
**Date**: 2026-10-29  
**Version**: 1.0.0  
**Scope**: High-level system architecture, package dependency matrix, multi-tenancy model, entity-relationship topology, state machines, and interface contracts.

---

## 1. System Architecture Topology

WhereReady Solar OS is structured as a multi-tier, multi-tenant enterprise SaaS platform consisting of three primary application packages, a shared database layer, and external cloud integrations.

```
                              ┌─────────────────────────────────────────────────┐
                              │            WhereReady Solar OS Clients          │
                              └───────┬─────────────────────────┬───────────────┘
                                      │                         │
                                      ▼                         ▼
                    ┌───────────────────────────┐     ┌───────────────────────────┐
                    │    Web Client (Next.js)   │     │    Mobile App (Expo RN)   │
                    │   Next.js 16 / React 19   │     │  Expo SDK 58 / RN 0.88    │
                    │  Tailwind v4 / Recharts   │     │ Camera / Barcode / Print  │
                    └─────────────┬─────────────┘     └─────────────┬─────────────┘
                                  │                                 │
                         HTTPS    │  JSON API / JWT Bearer Tokens   │  HTTPS
                                  └───────────────┬─────────────────┘
                                                  ▼
                              ┌───────────────────────────────────────┐
                              │     Backend API Server (Express)      │
                              │       Node.js Express 5.2.1           │
                              │ ┌───────────────────────────────────┐ │
                              │ │ Auth & Tenancy Middleware         │ │
                              │ │ - requireTenantAuth (JWT Bearer)  │ │
                              │ │ - Live Tenant Status (5s Cache)   │ │
                              │ │ - requirePermission (Granular)    │ │
                              │ └─────────────────┬─────────────────┘ │
                              │                   │                   │
                              │ ┌─────────────────▼─────────────────┐ │
                              │ │ Domain Route Controllers (26)     │ │
                              │ │ CRM, Quotations, Projects,        │ │
                              │ │ Inventory, Finance, DISCOM, etc.  │ │
                              │ └─────────────────┬─────────────────┘ │
                              │                   │                   │
                              │ ┌─────────────────▼─────────────────┐ │
                              │ │ Calculation Engines & Services    │ │
                              │ │ solarCalculator (Composite GST)   │ │
                              │ │ storageService, pdfService        │ │
                              │ └─────────────────┬─────────────────┘ │
                              │                   │                   │
                              │ ┌─────────────────▼─────────────────┐ │
                              │ │ Prisma ORM 5.22.0 Client          │ │
                              │ └─────────────────┬─────────────────┘ │
                              └───────────────────┼───────────────────┘
                                                  │ PostgreSQL Protocol
                                                  ▼
                              ┌───────────────────────────────────────┐
                              │       Supabase PostgreSQL DB          │
                              │  68 Models / Tenant-Partitioned Data  │
                              └───────────────────────────────────────┘
```

---

## 2. Package Dependencies & Runtime Environment

### 2.1 Workspace Matrix

| Package Directory | Technology Stack | Primary Purpose | Manifest File | Build / Compile Command | Test Command |
|---|---|---|---|---|---|
| `backend/` | Node.js CommonJS, Express 5.2.1, Prisma 5.22.0 | Core API, multi-tenant isolation, business logic, calculations | `backend/package.json` | `npm run build` (`prisma generate`) | `node --test test/*.test.js` |
| `web-client/` | Next.js 16.3.5, React 19.2.8, Tailwind CSS v4 | SaaS web portal for desktop, tablet, and mobile browsers | `web-client/package.json` | `npm run build` (`next build`) | None configured; `tsc --noEmit` verified |
| `mobile-app/` | React Native 0.88.0, Expo SDK 58, React 19.3.0 | Field technician tools: barcode scanning, QA, offline drafts | `mobile-app/package.json` | `expo start` / `expo run:android` | `node test-perspectives.js` (23 tests) |

### 2.2 Backend Package Dependencies (`backend/package.json`)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.118.0",
    "bcryptjs": "^3.0.3",
    "cloudinary": "^1.41.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "multer": "^2.3.0",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^10.0.9",
    "pdf-lib": "^1.17.1",
    "pdfkit": "^0.20.2",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@prisma/client": "^5.22.0",
    "nodemon": "^3.1.14",
    "prisma": "^5.22.0"
  }
}
```

#### Package Assessment & Remediation Notes:
1. **Prisma Client Relocation**: `@prisma/client` must be moved from `devDependencies` to `dependencies`. If production container builders execute `npm install --omit=dev`, Prisma client runtime will be missing.
2. **Missing Decimal Arithmetic Package**: JavaScript native numbers use IEEE 754 double precision floats. Commercial tax invoicing and milestone schedules require exact currency math. Implementing rounding safeguards in `solarCalculator.js` prevents penny rounding drift.
3. **CommonJS Architecture**: The backend uses Node.js CommonJS (`require` / `module.exports`), ensuring stable compatibility with `pdfkit` and `multer`.

### 2.3 Web-Client Package Dependencies (`web-client/package.json`)

```json
{
  "dependencies": {
    "axios": "^1.20.0",
    "html2pdf.js": "^0.14.0",
    "lucide-react": "^1.45.0",
    "next": "16.3.5",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "recharts": "^3.10.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.5",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

#### Package Assessment & Remediation Notes:
1. **Next.js App Router Architecture**: Uses `src/app/` layout nesting with client components marked by `"use client"`.
2. **Tailwind CSS v4 Engine**: Configured via `@tailwindcss/postcss` and CSS `@theme` variables in `src/app/globals.css`.
3. **Build Error Suppression**: `next.config.ts` currently sets `typescript: { ignoreBuildErrors: true }`. This must be disabled once shared UI components are introduced to guarantee type safety.

### 2.4 Mobile App Package Dependencies (`mobile-app/package.json`)

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/bottom-tabs": "^7.21.0",
    "@react-navigation/native": "^7.5.1",
    "@react-navigation/native-stack": "^7.21.0",
    "axios": "^1.20.0",
    "expo": "~58.0.16",
    "expo-camera": "~58.0.11",
    "expo-document-picker": "~58.0.4",
    "expo-image-picker": "~58.0.10",
    "expo-print": "~58.0.7",
    "expo-sharing": "~58.0.19",
    "expo-status-bar": "~58.0.2",
    "lucide-react-native": "^1.59.0",
    "react": "19.3.0",
    "react-native": "0.88.0",
    "react-native-safe-area-context": "5.6.2",
    "react-native-screens": "~4.24.0"
  }
}
```

---

## 3. Multi-Tenancy Architecture & Boundary Enforcement

WhereReady Solar OS implements logical multi-tenant partitioning on top of a shared PostgreSQL database. Every operational database query and mutation is scoped by `tenantId`.

### 3.1 Multi-Tenancy Resolution Flow

```
[Incoming Request]
       │
       ▼
[Cookie / Authorization Header]
       │
       ├─ Extract Bearer Token or `tenant_token` cookie
       ▼
[JWT Verification] (middleware/auth.js: requireTenantAuth)
       │
       ├─ Verify signature against JWT_SECRET
       ├─ Extract payload: { userId, role, tenantId, permissions }
       ▼
[Live Tenant Status Check] (tenantStatusCache: 5-second TTL)
       │
       ├─ prisma.tenant.findUnique({ where: { id: payload.tenantId } })
       ├─ IF status === 'SUSPENDED' -> HTTP 403 Forbidden ("Tenant account suspended")
       ├─ IF status === 'CANCELLED' -> HTTP 403 Forbidden ("Tenant account cancelled")
       ▼
[Live Employee Status Check] (If role === 'TENANT_SUB_ADMIN')
       │
       ├─ prisma.staff.findFirst({ where: { userId: payload.userId, tenantId: payload.tenantId } })
       ├─ IF status === 'SUSPENDED' | 'INACTIVE' -> HTTP 403 Forbidden
       ▼
[Context Attachment]
       │
       ├─ req.user = { id: payload.userId, userId: payload.userId, ...payload }
       ▼
[Route Controller Execution]
       │
       └─ where: { tenantId: req.user.tenantId }
```

### 3.2 Sub-Entity Tenancy Boundary Enforcement

Because child entities (`ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, `ServiceVisit`) do not have a dedicated `tenantId` column, parent relationship filters MUST be enforced on all queries and mutations:

```javascript
// ✅ SECURE: Tenancy enforced through parent Project relation
const updatedTask = await prisma.projectTask.update({
  where: {
    id: taskId,
    project: {
      tenantId: req.user.tenantId
    }
  },
  data: { status: 'COMPLETED' }
});

// ✅ SECURE: Tenancy enforced through parent SupportTicket relation
const createdVisit = await prisma.serviceVisit.create({
  data: {
    ticket: {
      connect: {
        id: ticketId,
        ticket: { tenantId: req.user.tenantId } // Validates ticket ownership
      }
    },
    scheduledDate: new Date(),
    technicianNotes: notes
  }
});
```

---

## 4. Entity Relationship & Solar ERP Data Flow

### 4.1 Master Operational Data Flow

```
  [Inbound Lead] (Lead)
        │
        ├─ OCR Utility Bill Parsing -> Sanctioned Load, BU, Consumption
        ├─ Preliminary Solar Sizing -> System Capacity (kW)
        ▼
  [Site Survey] (SiteSurvey)
        │
        ├─ Rooftop Feasibility: Shadow-free area (sq.ft.), Azimuth, Pitch
        ├─ Electrical Checks: Service phase (1-ph / 3-ph), Distance to meter
        ▼
  [Quotation Wizard] (Quotation + QuotationItem)
        │
        ├─ Tier-1 Hardware Selection (Modules, Inverter, Structure)
        ├─ Financial Math: 13.8% Composite GST, PM Surya Ghar Subsidy
        ├─ 25-Year Cash Flow & ROI Payback Schedule
        ▼
  [Accepted Proposal -> Conversion]
        │
        ├─ Customer Record Created / Linked (Customer)
        ├─ Master EPC Project Provisioned (Project)
        ├─ Bill of Materials (BOM) Allocated (ProjectMaterialRequirement)
        ├─ Statutory DISCOM Record Spawned (DiscomApplication)
        ├─ Central Subsidy Record Spawned (SubsidyApplication)
        ├─ 4 Milestone Invoices Generated (Invoice: 20/60/15/5%)
        ▼
  [Procurement & Logistics]
        │
        ├─ Hardware Purchase Orders (PurchaseOrder + PurchaseOrderItem)
        ├─ Receiving -> Warehouse Stock Increment (StockBalance + StockLedger)
        ├─ Material Dispatch to Site (MaterialDispatch)
        ▼
  [Field Construction & Installation]
        │
        ├─ Work Order Execution (InstallationJob)
        ├─ Module & Inverter DCR Barcode Scanning (SerialNumber)
        ├─ Electrical QA Sign-Off (Earth resistance < 5Ω, Trip < 2s)
        ▼
  [Statutory Utility Net Metering]
        │
        ├─ Feasibility -> CEIG -> Meter Testing -> Net Meter -> Grid Sync
        ├─ 7-Template Statutory MSEDCL Agreement Pack (DiscomDocsModal)
        ▼
  [PM Surya Ghar National Portal Handover]
        │
        ├─ 7-Stage Portal Tracking -> Inspection Dossier -> DBT ₹78,000 Disbursed
        ▼
  [Post-Commissioning O&M]
        │
        └─ Support Tickets (SupportTicket) + Annual Maintenance (AMC)
```

---

## 5. Domain State Machines & Progression Logic

### 5.1 Lead Status & Stage Machine
- **Statuses (`LeadStatus`)**: `NEW` -> `QUALIFIED` -> `SURVEY_SCHEDULED` -> `PROPOSAL_SENT` -> `NEGOTIATION` -> `WON` | `LOST` | `ON_HOLD`.
- **Transitions**:
  - `POST /api/tenant/leads/:id/convert`:
    - Requires status: `WON` (or automatically sets to `WON`).
    - Checks for existing `Project` with matching `leadId` to guarantee idempotency.
    - Creates `Customer` if not already linked.
    - Creates `Project` with stage `SURVEY_COMPLETED`.
    - Spawns `DiscomApplication` at `FEASIBILITY_PENDING`.
    - Spawns `SubsidyApplication` at `CONSUMER_SELECTION`.

### 5.2 Project Execution 7-Stage Workflow
1. `SURVEY_COMPLETED`: Feasibility report accepted, system capacity finalized.
2. `STRUCTURE_APPROVED`: Rooftop layout and mounting structure engineered.
3. `MATERIAL_DISPATCHED`: PV panels, inverter, and BOS dispatched from warehouse.
4. `INSTALLATION_STARTED`: Structure erected, panels mounted, DC cabling routed.
5. `TESTING_COMPLETED`: Electrical QA sign-off (earth pits < 5.0Ω, anti-islanding < 2.0s).
6. `NET_METER_APPLIED`: Statutory DISCOM application filed with WCR and test reports.
7. `COMMISSIONED`: Net meter installed, bidirectional flow verified, grid synchronized.

### 5.3 DISCOM 5-Stage Statutory Gating State Machine
The DISCOM controller (`backend/routes/tenant/discom.js`) strictly gates progression behind prerequisite statutory proofs:
- Stage 1: `FEASIBILITY_PENDING` (Initial interconnection request).
- Stage 2: `CEIG_INSPECTION` (Requires `FEASIBILITY_APPROVED` document).
- Stage 3: `METER_TESTING` (Requires `CEIG_APPROVAL` document).
- Stage 4: `NET_METER_INSTALLED` (Requires `METER_TEST_REPORT` document).
- Stage 5: `GRID_SYNCHRONIZED` (Requires `NET_METER_CERTIFICATE` document).

### 5.4 PM Surya Ghar National Portal Funnel (7 Stages)
Defined in `backend/routes/tenant/subsidy.js`:
1. `CONSUMER_SELECTION`: Client selects vendor on national portal (`pmsuryaghar.gov.in`).
2. `FEASIBILITY_PENDING`: DISCOM reviews rooftop feasibility.
3. `FEASIBILITY_APPROVED`: Formal feasibility approval issued.
4. `WORK_COMPLETED`: EPC installer marks construction complete, uploads DCR module serials.
5. `METER_INSPECTED`: DISCOM inspector conducts net-meter testing.
6. `CLAIM_GENERATED`: Subsidy claim dossier generated with customer DBT bank details.
7. `DBT_DISBURSED`: Central Financial Assistance (up to ₹78,000) credited to client bank account.

### 5.5 Milestone Billing & Invoicing (4 Stages)
Defined in `backend/routes/tenant/finance.js:785-880`:
- **Stage 1 (20% Advance Booking & Work Order)**: HSN 9954 (Construction services). Due upon quotation acceptance.
- **Stage 2 (60% Delivery of PV Modules & Inverter)**: HSN 8541 (Semiconductor PV devices). Due upon material arrival on site.
- **Stage 3 (15% Structure & Electrical Testing Completion)**: HSN 9954. Due upon electrical QA sign-off.
- **Stage 4 (5% DISCOM Net-Metering & Grid Synchronization)**: HSN 9954. Due upon net-meter commissioning.

---

## 6. Interface Contracts

### 6.1 Authentication & Tenancy Middleware Contract

#### Request Context Guarantee
Every handler protected by `requireTenantAuth` receives a populated `req.user` object:
```typescript
interface TenantUserContext {
  id: string;               // Normalized user ID (matches userId)
  userId: string;           // Primary key in User table
  tenantId: string;         // Primary key in Tenant table
  role: 'TENANT_ADMIN' | 'TENANT_SUB_ADMIN';
  permissions: string[];    // Array of granular permission strings (e.g., 'leads.create')
}
```

#### Authorization Middleware Signatures
```javascript
// Validates token, tenant active status, employee active status
function requireTenantAuth(req, res, next): void;

// Verifies caller has required permission string OR is TENANT_ADMIN
function requirePermission(...requiredPermissions: string[]): (req, res, next) => void;

// Super Admin platform gatekeeper
function requireSuperAdmin(req, res, next): void;
```

---

### 6.2 Financial Calculation Engine Contract (`solarCalculator`)

#### Input Contract
```typescript
interface PricingCalculationInput {
  items: Array<{
    unitPrice: number;
    quantity: number;
    taxRate: number;        // e.g. 12 or 18
    discount?: number;      // Item-level line discount
  }>;
  overallDiscount?: number; // Commercial trade discount applied to quote
  useCompositeSolarGST?: boolean; // If true, applies 13.8% composite rate
}
```

#### Output Contract
```typescript
interface PricingCalculationResult {
  subtotal: number;         // Gross item sum before discounts
  overallDiscount: number;  // Trade discount applied
  taxableAmount: number;    // Subtotal minus overallDiscount
  totalTax: number;         // Total tax evaluated on discounted taxable amount
  cgst: number;             // Half of totalTax for intra-state
  sgst: number;             // Half of totalTax for intra-state
  grandTotal: number;       // taxableAmount + totalTax
  milestones: Array<{
    stage: string;
    percentage: number;
    amount: number;         // Currency amount (reconciled against grandTotal)
  }>;
  totalInWords: string;     // Indian numbering words (e.g. "Two Lakh Fifty...")
}
```

#### Invariants:
1. **Discount Tax Invariant**: `taxableAmount === Math.max(0, subtotal - overallDiscount)`. When `overallDiscount > 0`, `totalTax` must be evaluated against discounted item taxable bases.
2. **Milestone Reconciliation Invariant**: `sum(milestones.map(m => m.amount)) === grandTotal` strictly, with zero 1-rupee rounding remainder.

---

### 6.3 Shared UI Primitives Library Contract (`web-client/src/components/ui/`)

To eliminate inline duplication and establish responsive consistency, all UI primitives must implement the following standard interfaces:

#### `Button`
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}
```

#### `Input` / `Select`
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

#### `Modal` / `Dialog`
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### `Toast` Notification Context
```typescript
interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  durationMs?: number;
}
interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}
```

#### `Table`
```typescript
interface TableProps<T> {
  columns: Array<{ header: string; accessor: keyof T | ((row: T) => React.ReactNode) }>;
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}
```

---

### 6.4 Mobile Hardware & Client Contract (`mobile-app/src/api/client.ts`)

#### Safe Storage & Bearer Injection
All HTTP calls from `mobile-app` route through a pre-configured Axios instance that injects `Authorization: Bearer <token>` retrieved from `@react-native-async-storage/async-storage`.

#### Suspension Interceptor Contract
- When the API responds with `HTTP 403` and `{ error: 'Tenant account suspended' }`, the response interceptor triggers `useAuth().setAccountSuspended(true)`.
- Renders `AccountSuspendedModal`, preventing unauthorized field operations until the account is reinstated.

---

*This document establishes the authoritative system architecture, dependency specifications, and interface contracts for WhereReady Solar OS.*
