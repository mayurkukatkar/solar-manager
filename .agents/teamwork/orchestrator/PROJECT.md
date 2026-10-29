# Project: WhereReady Solar OS Enterprise SaaS

## Architecture
- **Repository Structure**:
  - `backend/`: Node.js Express 5.2.1 application with Prisma ORM 5.22.0 connecting to PostgreSQL. Houses 26 route files (100+ endpoints) and 68 Prisma models.
  - `web-client/`: Next.js 16.3.5 App Router, React 19.2.8, Tailwind CSS v4, Lucide React, Recharts. Houses 58 routes across 13 tenant business modules, 12 super-admin platform screens, and 10 public marketing routes.
  - `mobile-app/`: React Native 0.88.0, Expo SDK 58 application providing field engineering tools (camera barcode scanning, earth resistance QA, 7-template statutory DISCOM document generation, offline draft storage).
  - `docs/`: Product audit, architecture, and module specification documentation.
- **Data Flow & Multi-Tenancy**:
  - Multi-tenant architecture with `tenantId` partitioning across all core entities (`User`, `Lead`, `Customer`, `SiteSurvey`, `Quotation`, `Project`, `Invoice`, `DiscomApplication`, `SubsidyApplication`, `InstallationJob`, etc.).
  - JWT Bearer token authentication containing `tenantId`, `role`, and `permissions`.
  - Static file storage via Multer / Cloudinary.
  - Real-time statutory and financial calculations via `services/solarCalculator.js` (backend) and `services/solarCalculator.ts` (web-client).

## Feature Inventory
Every feature discovered during the survey phase across backend, web-client, and mobile-app:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Baseline Documentation & Module Inventory | Author `docs/product-audit.md`, `docs/module-inventory.md`, `docs/architecture-and-dependencies.md`, `docs/implementation-roadmap.md`, `docs/quality-and-regression-report.md` | M1 | Survey Reports |
| 2 | Design Tokens & WhereReady Branding | Unified semantic color tokens (`primary`, `accent`, `status`, `surface`), clean font loading, elevation, borders | M2 | Frontend Survey |
| 3 | Shared UI Primitives Library | Centralized `Button`, `Input`, `Select`, `Modal`/`Dialog`, `Table`, `Badge`, `Card`, `Toast`, `EmptyState`, `Skeleton` in `web-client/src/components/ui` | M2 | Frontend Survey |
| 4 | Responsive Viewport Fixes (320px–1920px) | `grid-cols-1 sm:grid-cols-2` across modal forms, 44px touch targets, mobile status selectors on Kanban cards | M2 | Frontend Survey |
| 5 | Native Alert Replacement with Toasts | Replace browser `alert()` invocations across finance, surveys, tasks, projects with non-blocking toasts | M2 | Frontend Survey |
| 6 | Navigation & Dead Link Elimination | Resolve 404 links: `/tenant/installation/schedule`, `/calendar`, `/checklists`, `/tenant/inventory/products/new`, `/tenant/quotations/new`, `/super-admin/security` | M2 | Frontend Survey |
| 7 | Multi-Tenant Child Entity Isolation | Enforce `project: { tenantId }` checks on `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, and `ServiceVisit` mutations | M3 | Backend Survey |
| 8 | JWT User Identity Normalization | Normalize `req.user = { id: payload.userId, ...payload }` to fix audit logs, createdBy tracking, and self-protection checks | M3 | Backend Survey |
| 9 | Public OCR Endpoint Authentication | Attach `requireTenantAuth` to `/api/tenant/ocr/scan-bill` and `/fetch-consumer` with rate limiting | M3 | Backend Survey |
| 10 | Granular RBAC Route Enforcement | Apply `requirePermission` across tenant route controllers for fine-grained employee access control | M3 | Backend Survey |
| 11 | Financial GST Trade Discount Math | Recompute GST taxable base proportionally when `overallDiscount` is applied in `solarCalculator.js` and `solarCalculator.ts` | M3 | Backend & Frontend Survey |
| 12 | Milestone Payment Decimal Rounding | Ensure sum of milestone percentages and amounts precisely equals gross total without 1-rupee drift | M3 | Backend & Frontend Survey |
| 13 | Elimination of Hardcoded Mock Leaks | Remove hardcoded vendor and customer identities from `tenant/projects/[id]/page.tsx` and fake data from dashboard | M4 | Frontend Survey |
| 14 | 60-Second Quotation & Sizing Engine | Solar capacity sizing, 25-year financial cash flow, 13.8% composite solar GST, multi-stage revision history | M4 | Survey Reports |
| 15 | Site Survey to Quote 1-Click Conversion | Seamless technical feasibility audit handoff into commercial quotation without data loss | M4 | Survey Reports |
| 16 | DISCOM 5-Stage Gating State Machine | Enforce prerequisite statutory document validations for Feasibility, CEIG, Meter Testing, Net Metering, and Grid Sync | M4 | Spec Miner Survey |
| 17 | PM Surya Ghar Central Subsidy Funnel | 7-stage national portal funnel (₹30k/₹60k/₹78k slabs), DBT bank verification, smart regex parser | M4 | Spec Miner Survey |
| 18 | Purchase Order Auto-Stock Ledger | Automatic increment of warehouse inventory stock upon PO receipt, serial number tracking | M5 | Backend Survey |
| 19 | Mobile Field 2D Barcode Scanning | Physical QR/barcode capture of PV modules and inverters for DCR traceability, duplicate prevention | M5 | Spec Miner Survey |
| 20 | Mobile Electrical QA Sign-Off | Earth pit resistance (<5.0Ω) and anti-islanding trip (<2.0s) validation before commissioning | M5 | Spec Miner Survey |
| 21 | Mobile Statutory PDF Template Parity | Fix `'PM Surya Ghar Muft Bijli Yojana'` text in `mobile-app/src/services/pdfService.ts` to pass parity test suite | M5 | Backend Survey |
| 22 | Touch-Friendly Mobile Task Operations | Replace pure HTML5 drag-and-drop in Kanban with touch-friendly quick status selectors | M5 | Frontend Survey |
| 23 | Cross-Module Lead-to-Service Journey | Verify full end-to-end lifecycle (Lead -> Customer -> Survey -> Quotation -> Project -> Procurement -> Installation -> Invoicing -> Service) | M6 | Survey Reports |
| 24 | Full Automated Regression Verification | Run backend tests, mobile perspectives suite, TypeScript compilation, and E2E test suite cleanly | M6 | Survey Reports |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Documentation Baseline & Architecture Specs | Author complete `docs/product-audit.md`, `docs/module-inventory.md`, `docs/architecture-and-dependencies.md`, `docs/implementation-roadmap.md`, `docs/quality-and-regression-report.md`, and project root `PROJECT.md` | none | DONE (6 artifacts, 134KB, audit CLEAN) |
| M2 | Design System & Shared UI Components Foundation | Centralized UI primitives in `web-client/src/components/ui/`, token standardization, responsive layouts (320px–1920px), toast context replacing `alert()`, 404 dead link fixes | M1 | DONE (10 UI primitives, 7 Next.js routes, alert replacement, tsc clean, audit CLEAN) |
| M3 | Security, Multi-Tenancy & Financial Precision Hardening | Backend child entity tenant isolation, JWT `req.user.id` normalization, OCR route auth, RBAC middleware, GST trade discount arithmetic in backend & web-client calculators | M1 | DONE (Child tenancy, JWT id, OCR auth, GST math, 15 tests pass, audit CLEAN) |
| M4 | Commercial & Operations Module Workflows | Remove hardcoded mock leaks in project DISCOM generator and dashboard, Quotation-to-Project conversion, DISCOM 5-stage gating, PM Surya Ghar subsidy funnel | M2, M3 | PLANNED |
| M5 | Field Operations, Inventory & Mobile Parity | PO receiving stock automation, mobile barcode scanner & electrical QA sign-off, mobile PDF template parity fix, mobile touch Kanban | M3, M4 | PLANNED |
| M6 | Cross-Module E2E Validation & Regression Fixes | Complete Lead-to-Service lifecycle validation, verify 100% test passes across backend, mobile, and web-client, final evidence report | M4, M5 | PLANNED |

## Interface Contracts

### Auth & Tenancy Middleware ↔ Route Controllers
- `req.user`: `{ id: string, userId: string, role: string, tenantId: string, permissions: string[] }`
- `requireTenantAuth`: Extracts bearer token or cookie, verifies JWT against `JWT_SECRET`, checks tenant status != `SUSPENDED`, sets `req.user`, rejects 401/403.
- `requirePermission(...permissions)`: Verifies `req.user.permissions.includes(permission)` or `role === 'TENANT_ADMIN'`.

### Sub-Entity Query Contract
- All mutations on sub-entities (`tasks`, `milestones`, `materials`, `service visits`) MUST enforce parent tenant ownership:
  `prisma.projectTask.update({ where: { id, project: { tenantId: req.user.tenantId } }, data: ... })`

### Financial Engine Contract (`solarCalculator`)
- Input: `{ items: Array<{ unitPrice: number, quantity: number, taxRate: number, discount?: number }>, overallDiscount?: number, useCompositeSolarGST?: boolean }`
- Output: `{ subtotal: number, overallDiscount: number, taxableAmount: number, totalTax: number, grandTotal: number, cgst: number, sgst: number, milestones: Array<{ stage: string, percentage: number, amount: number }> }`
- Invariant 1: If `overallDiscount > 0`, item taxable amounts and taxes are adjusted proportionally before summing `totalTax`.
- Invariant 2: `sum(milestones.map(m => m.amount)) === grandTotal` strictly (no 1-rupee rounding drift).

### UI Primitives Contract (`web-client/src/components/ui`)
- `Button`: `({ variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg', isLoading?: boolean, children, ...props })`
- `Input`: `({ label?: string, error?: string, helperText?: string, ...props })`
- `Modal`: `({ isOpen: boolean, onClose: () => void, title?: string, children })`
- `Toast`: `useToast().showToast({ type: 'success' | 'error' | 'info' | 'warning', message: string })`

## Code Layout
- `backend/`:
  - `middleware/auth.js`: Auth verification & RBAC
  - `routes/tenant/*.js`: Tenant API controllers
  - `services/solarCalculator.js`: Financial calculation engine
  - `test/*.test.js`: Automated backend test suites
- `web-client/`:
  - `src/components/ui/`: Standardized UI primitive components
  - `src/app/globals.css`: Design tokens & Tailwind theme
  - `src/app/tenant/*`: Tenant business module pages
  - `src/services/solarCalculator.ts`: Frontend calculation engine
- `mobile-app/`:
  - `src/screens/*`: Mobile operational screens
  - `src/services/*`: PDF generation, offline sync, WhatsApp integration
  - `test-perspectives.js`: Mobile automated test suite
- `docs/`:
  - `product-audit.md`: Full architectural and security audit
  - `module-inventory.md`: Complete module and page inventory
  - `architecture-and-dependencies.md`: System dependencies and data models
  - `implementation-roadmap.md`: Batch implementation roadmap
  - `quality-and-regression-report.md`: Test execution and regression report
