# Frontend, Web-Client, Design System & UI Survey Report

**Author**: Frontend & UI Survey Explorer  
**Date**: 2026-10-29  
**Milestone**: Phases 1 & 2 Discovery and Baseline Audit  
**Status**: Completed  

---

## Executive Summary
An exhaustive survey of the WhereReady Solar OS frontend architecture reveals an advanced, feature-rich Next.js 16 (App Router) + React 19 application spanning 58 pages across 13 tenant business modules, 12 super-admin platform screens, and 10 public marketing routes. While the core domain workflows (60-second quotation wizard, DISCOM statutory form generation, PM Surya Ghar DBT studio, and CRM pipeline) demonstrate deep solar industry specialization, the frontend suffers from critical architectural gaps: a complete lack of centralized UI component primitives (`components/ui`), pervasive inline style duplication, 7 dead navigation links causing 404 errors, hardcoded customer/vendor mock data leaking into statutory PDF generation, GST calculation discrepancies on discounted quotations in `solarCalculator.ts`, unhandled mobile responsiveness on small viewports (<360px), and zero automated frontend test suites.

---

## 1. Observation

### 1.1 Frontend Workspace & Package Manifests

#### 1. Web-Client Package Manifest (`f:\Company Products\solar-manager\web-client\package.json`)
```json
{
  "name": "web-client",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
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
- **Observations**:
  - Core Framework: Next.js `16.3.5`, React `19.2.8`, Tailwind CSS `^4` with `@tailwindcss/postcss`.
  - Iconography: `lucide-react` (`^1.45.0`).
  - Charting: `recharts` (`^3.10.1`).
  - Client HTTP: `axios` (`^1.20.0`).
  - PDF Export: `html2pdf.js` (`^0.14.0`).
  - **Scripts Deficiencies**: No `typecheck` script; no unit, integration, or component test framework installed (no Jest, Vitest, Cypress, or Playwright).

#### 2. Next.js Configuration (`f:\Company Products\solar-manager\web-client\next.config.ts`)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```
- **Observation**: Lines 4–6 explicitly set `typescript: { ignoreBuildErrors: true }`, suppressing TypeScript compiler errors during production builds.

#### 3. TypeScript Configuration (`f:\Company Products\solar-manager\web-client\tsconfig.json`)
- Strict mode is enabled (`"strict": true`, `"moduleResolution": "bundler"`, path alias `"@/*": ["./src/*"]`).
- Local verification executed via `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` exited with **code 0** (clean compilation under current codebase).

#### 4. Orphaned & Nested Directories
- `f:\Company Products\solar-manager\frontend`: Contains only an abandoned `node_modules/@rolldown` directory and no application files.
- `f:\Company Products\solar-manager\web-client\Products\solar-manager\web-client`: Nested duplicate folder structure created accidentally.
- `f:\Company Products\solar-manager\web-client\scratch\replace.js`: Scratch script.

---

### 1.2 Routing Hierarchy & Views Inventory (58 Pages Cataloged)

#### Group A: Public & Marketing Views (10 Routes)
| Route | File Path | Description | Key Components |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Main marketing landing page | `ProductStoryFilm`, `QuotationScene`, `ProductExperienceScene`, `PricingScene`, `TrustSecuritySection`, `FaqSection`, `WhatsAppCta`, `DemoModal` |
| `/demo` | `src/app/demo/page.tsx` | Interactive demo scheduling page | Demo booking form |
| `/features` | `src/app/features/page.tsx` | Detailed platform features | Feature breakdown cards |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | Solar EPC lifecycle walkthrough | Process timeline |
| `/pricing` | `src/app/pricing/page.tsx` | Commercial pricing plans | Pricing tier cards |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy & DPDP Act 2023 | Legal document renderer |
| `/security` | `src/app/security/page.tsx` | Security & cloud compliance | Security badges & controls |
| `/terms` | `src/app/terms/page.tsx` | Terms of Service agreement | Legal document renderer |
| `/login` | `src/app/login/page.tsx` | Tenant & Super-Admin authentication | Login form, force-reset modal |
| `/suspended` | `src/app/suspended/page.tsx` | Suspended tenant lock screen | Suspension explanation & contact |

#### Group B: Tenant Workspace Views (36 Routes across 13 Business Modules)
| Business Module | Route | File Path | View Type / Function |
|---|---|---|---|
| **Executive & Command** | `/tenant/dashboard` | `src/app/tenant/dashboard/page.tsx` | Executive Command Center, Recharts analytics, 4 horizon views, priority queue, DBT funnel |
| **CRM / Leads** | `/tenant/leads` | `src/app/tenant/leads/page.tsx` | 8-stage Kanban & Table deal pipeline, Add Lead modal, follow-up modal |
| **CRM / Leads** | `/tenant/leads/[id]` | `src/app/tenant/leads/[id]/page.tsx` | Lead detail dossier, stage progression, conversion to project |
| **CRM / Customers** | `/tenant/crm` | `src/app/tenant/crm/page.tsx` | Customer master directory, contact timeline, linked records |
| **CRM / Customers** | `/tenant/crm/[id]` | `src/app/tenant/crm/[id]/page.tsx` | Customer 360 profile, quotations, projects, documents |
| **Surveys** | `/tenant/surveys` | `src/app/tenant/surveys/page.tsx` | Site survey queue, roof filters, Schedule Survey modal, 1-click quote conversion |
| **Surveys** | `/tenant/surveys/[id]` | `src/app/tenant/surveys/[id]/page.tsx` | Technical site audit report, shadow-free area, DISCOM feasibility |
| **Quotations** | `/tenant/quotations` | `src/app/tenant/quotations/page.tsx` | Proposal directory, metrics, follow-up reminders, WhatsApp pitch modal, PDF generator |
| **Quotations** | `/tenant/quotations/pdf-demo` | `src/app/tenant/quotations/pdf-demo/page.tsx` | Visual PDF quotation preview playground |
| **Projects** | `/tenant/projects` | `src/app/tenant/projects/page.tsx` | EPC project master hub, 7-stage filters, KPI cards, quick project creation |
| **Projects** | `/tenant/projects/new` | `src/app/tenant/projects/new/page.tsx` | Multi-step EPC project creation wizard |
| **Projects** | `/tenant/projects/[id]` | `src/app/tenant/projects/[id]/page.tsx` | Project master dossier, DISCOM statutory form generation (WCR, Annexure 2, Net Metering Agreement), task/milestone/material modals |
| **Operations** | `/tenant/tasks` | `src/app/tenant/tasks/page.tsx` | HTML5 drag-and-drop Kanban task board, task creation modal |
| **Installation** | `/tenant/installation` | `src/app/tenant/installation/page.tsx` | Installation overview dashboard (KPI cards and navigation links) |
| **Installation** | `/tenant/installation/jobs` | `src/app/tenant/installation/jobs/page.tsx` | Installation work order list, technician assignment, status |
| **Installation** | `/tenant/installation/[id]` | `src/app/tenant/installation/[id]/page.tsx` | Job execution checklist, site photos, QA signoff |
| **Inventory** | `/tenant/inventory` | `src/app/tenant/inventory/page.tsx` | Stock overview, valuation, reserved stock, low-stock warnings |
| **Inventory** | `/tenant/inventory/ledger` | `src/app/tenant/inventory/ledger/page.tsx` | Stock ledger movement audit trail, transaction history |
| **Inventory** | `/tenant/inventory/products` | `src/app/tenant/inventory/products/page.tsx` | Product catalogue with SKU, brand, stock levels |
| **Inventory** | `/tenant/inventory/warehouses` | `src/app/tenant/inventory/warehouses/page.tsx` | Multi-warehouse facility directory |
| **Inventory** | `/tenant/inventory/dispatch/new` | `src/app/tenant/inventory/dispatch/new/page.tsx` | Material dispatch order form, serialized allocation |
| **Products** | `/tenant/products` | `src/app/tenant/products/page.tsx` | Standalone product catalogue module |
| **Procurement** | `/tenant/procurement` | `src/app/tenant/procurement/page.tsx` | Purchase orders (PO) management, supplier status |
| **Finance & Invoicing** | `/tenant/finance` | `src/app/tenant/finance/page.tsx` | Milestone tax invoicing (20/60/15/5%), GST breakdown, payment recording modal, receipt preview |
| **Schemes & Subsidies** | `/tenant/subsidy` | `src/app/tenant/subsidy/page.tsx` | PM Surya Ghar National Portal Studio (7 stages), Smart Paste parser, Bulk DCR module formatter, Bank IFSC checker, inspection dossier print |
| **Finance** | `/tenant/loans` | `src/app/tenant/loans/page.tsx` | Solar rooftop loan applications tracker, EMI calculator |
| **Documents** | `/tenant/documents` | `src/app/tenant/documents/page.tsx` | Customer KYC, DISCOM documents, bill OCR files, upload modal |
| **Service & Warranty** | `/tenant/service` | `src/app/tenant/service/page.tsx` | Post-commissioning support tickets, technician dispatch |
| **Service & Warranty** | `/tenant/amc` | `src/app/tenant/amc/page.tsx` | Annual Maintenance Contracts hub, warranty tracker |
| **Communication** | `/tenant/communication` | `src/app/tenant/communication/page.tsx` | Customer messaging log, WhatsApp templates, call records |
| **Workforce** | `/tenant/staff` | `src/app/tenant/staff/page.tsx` | Staff directory, granular RBAC permissions, temporary password issuance |
| **Workforce** | `/tenant/users` | `src/app/tenant/users/page.tsx` | Workspace user accounts, roles, access statuses |
| **Analytics** | `/tenant/reports` | `src/app/tenant/reports/page.tsx` | Sales conversion, installation velocity, financial statements |
| **System** | `/tenant/notifications` | `src/app/tenant/notifications/page.tsx` | Activity notifications center |
| **Settings** | `/tenant/settings` | `src/app/tenant/settings/page.tsx` | Organization profile, GSTIN/PAN, bank account/UPI QR, branding logo/signature, prefixes |
| **System** | `/tenant/audit-logs` | `src/app/tenant/audit-logs/page.tsx` | Workspace security audit trail with user, IP, action, timestamp |

#### Group C: Super-Admin Platform Views (12 Routes)
| Route | File Path | Function |
|---|---|---|
| `/super-admin/dashboard` | `src/app/super-admin/dashboard/page.tsx` | Platform MRR, active tenants, aggregate capacity |
| `/super-admin/leads` | `src/app/super-admin/leads/page.tsx` | Inbound demo leads from marketing site |
| `/super-admin/tenants` | `src/app/super-admin/tenants/page.tsx` | Master tenant registry, search, instant suspension |
| `/super-admin/tenants/create` | `src/app/super-admin/tenants/create/page.tsx` | Tenant onboarding wizard with plan selection |
| `/super-admin/tenants/[id]` | `src/app/super-admin/tenants/[id]/page.tsx` | Tenant profile, quota limits, database stats |
| `/super-admin/subscriptions` | `src/app/super-admin/subscriptions/page.tsx` | SaaS subscriptions & billing cycles |
| `/super-admin/subscriptions/plans` | `src/app/super-admin/subscriptions/plans/page.tsx` | Subscription tier limits (users, storage, projects) |
| `/super-admin/features` | `src/app/super-admin/features/page.tsx` | Feature flag catalog & tenant-level toggles |
| `/super-admin/integrations` | `src/app/super-admin/integrations/page.tsx` | DISCOM APIs, OCR, WhatsApp, payment gateways |
| `/super-admin/security/audit-logs` | `src/app/super-admin/security/audit-logs/page.tsx` | Global security audit log & login history |
| `/super-admin/support/tickets` | `src/app/super-admin/support/tickets/page.tsx` | Cross-tenant support ticket queue |
| `/super-admin/cms/pages` | `src/app/super-admin/cms/pages/page.tsx` | Marketing website CMS page manager |

#### Group D: API Routes (2 Routes)
- `/api/demo-request`: Handles demo booking form submissions from the marketing landing page.
- `/api/super-admin/leads`: Internal proxy for super-admin lead processing.

---

### 1.3 UI Components & Shared Primitives Inventory

#### Existing Components in `web-client/src/components`:
1. `AxiosSetup.tsx`: Global axios request/response interceptor injecting bearer tokens and handling `401` / `403` suspension redirects.
2. `documents/`:
   - `DocumentDrawer.tsx`: Slide-out panel for document preview.
   - `DocumentTable.tsx`: KYC and project document list.
   - `ProjectDossierGrid.tsx`: Document grid view.
   - `UploadModal.tsx`: File upload modal with drag-and-drop.
3. `marketing/`: 16 modular landing page components (`BenefitsScene`, `DemoBookingSection`, `DemoModal`, `FaqSection`, `FinalCtaScene`, `Footer`, `GuideCharacter`, `HeroScene`, `Navbar`, `PricingScene`, `ProblemScene`, `ProductExperienceScene`, `ProductStoryFilm`, `QuotationScene`, `TrustSecuritySection`, `VendorCharacter`, `WhatsAppCta`, `WorkflowScene`).
4. `pdf/`:
   - `QuotationPDF.tsx`: 6-page editorial magazine proposal PDF generator.
   - `MsedclFormsPDF.tsx`: Statutory DISCOM MSEDCL form templates (Form A-1, Annexure-2, WCR, Net Metering Agreement, Guarantee Certificate, DCR Undertaking).
5. `quotations/`:
   - `QuotationWizardModal.tsx`: 2863-line interactive proposal wizard with solar calculator, hardware bill of materials, and preview.
   - `QuotationDetailModal.tsx`: Quotation inspector with revision history and WhatsApp dispatch.
   - `TemplateDesignerModal.tsx`: Visual proposal template designer.

#### Architecture Gap: Absence of Shared UI Primitives
Unlike `mobile-app` (which has `components/common/Button.tsx`, `Badge.tsx`, `Card.tsx`, `EmptyState.tsx`, `Input.tsx`, `SkeletonLoader.tsx`), **`web-client` has zero shared UI primitive components**.
- No `components/ui/Button.tsx`
- No `components/ui/Input.tsx`
- No `components/ui/Table.tsx`
- No `components/ui/Modal.tsx` / `Dialog.tsx`
- No `components/ui/Badge.tsx`
- No `components/ui/Card.tsx`
- No `components/ui/Toast.tsx`
- No `components/ui/Drawer.tsx`
- No `components/ui/Skeleton.tsx`
Every page reinvents buttons, inputs, tables, cards, modal overlays, and loading indicators with ad-hoc Tailwind classes.

---

### 1.4 Design Tokens & WhereReady Branding

#### Styling System (`web-client/src/app/globals.css`)
- **Tailwind 4 `@theme` block**:
  - Color definitions: `forest-600..950`, `ivory-50..200`, `gold-300..600`, `graphite-600..900`, `emerald-50..900`, `blue-50..900`, `red-50..700`, `slate-50..950`.
  - Engineering grid backgrounds: `.bg-grid-subtle` (36px desktop / 26px mobile), plus 32px grid in `tenant/layout.tsx`.
- **Typography & Fonts**:
  - Google Fonts `@import` in `globals.css`: `Manrope`, `Playfair Display`, `Plus Jakarta Sans`, `Space Grotesk`.
  - Google Fonts in `layout.tsx`: `Geist` and `Geist_Mono` loaded via `next/font/google`.
  - Inconsistency: Dual font loading creates redundant network requests. Font utility classes like `font-['Plus_Jakarta_Sans',sans-serif]` are applied as arbitrary inline strings rather than semantic Tailwind font classes.
- **Color Fragmentation Across Modules**:
  - Leads module: Uses `bg-emerald-600` primary buttons.
  - Installation module: Uses `bg-indigo-600` primary buttons.
  - Quotations & Dashboard: Uses `bg-blue-600` primary buttons.
  - Marketing: Uses Emerald green (`#10b981`) and Gold (`#c5a059`).
  - No semantic token abstraction (e.g., `--color-primary`, `--color-accent`) exists to enforce visual harmony.

---

### 1.5 UI/UX State Quality & Accessibility Audit

#### 1. Loading States
- In `tenant/dashboard/page.tsx` line 112, `const [loading, setLoading] = useState(true);` is defined, but `loading` is **never rendered in JSX**. The dashboard renders immediately with `0` values and mock fallback data while data is fetching.
- In `tenant/inventory/page.tsx` and `tenant/installation/page.tsx`, loading is a bare text string (`Loading dashboard...`).
- Zero skeleton loaders (`SkeletonLoader`) exist in the web client.

#### 2. Empty States
- Tables provide simple text (`No leads found matching your criteria.`), but lack actionable empty state cards with action buttons ("Add Lead", "Clear Filters").
- In `tenant/tasks/page.tsx`, empty Kanban columns are blank drop areas without user guidance.

#### 3. Error States & Native `alert()` Calls
- Direct native browser `alert()` calls are used extensively in catch blocks, freezing user interaction:
  - `tenant/finance/page.tsx:198`: `alert(err.response?.data?.error || 'Failed to generate tax invoice');`
  - `tenant/finance/page.tsx:227`: `alert(err.response?.data?.error || 'Failed to record payment');`
  - `tenant/surveys/page.tsx:162`: `alert('Please select or specify a Customer Name');`
  - `tenant/surveys/page.tsx:194`: `alert(err.response?.data?.error || 'Failed to schedule site survey');`
  - `tenant/tasks/page.tsx:75`: `alert('Failed to create task');`
  - `tenant/projects/[id]/page.tsx:161`: `alert('Failed to generate PDF');`
- Silent Error Swallowing: In `tenant/quotations/page.tsx:95-113`, sub-requests catch errors silently (`.catch(() => ({ data: { leads: [] } }))`), hiding network and API failures from users.
- No Error Boundaries (`error.tsx`) exist in `web-client/src/app` routes.

#### 4. Double-Submission Vulnerabilities
- While `tenant/leads` and `tenant/surveys` disable submit buttons during API calls, several action buttons (e.g., stage updates, quick conversions, delete triggers) lack debouncing or submission locks.

#### 5. Responsive Design (320px to 1920px)
- **Mobile (320px – 480px) Issues**:
  - Forms inside modals use `grid grid-cols-2 gap-4` without `grid-cols-1 sm:grid-cols-2` responsive breakpoints (e.g. `tenant/leads/page.tsx:798, 823, 854`). On 320px screens, two inputs side-by-side are compressed into ~120px width each, causing severe label wrapping and truncated input text.
  - Action button clusters in page headers (e.g. `tenant/dashboard/page.tsx:333-362`) wrap into 4–5 stacked rows, pushing the fold far down on mobile devices.
  - Small touch targets: Table action buttons use `p-1` and `p-1.5` (~22px touch targets), failing WCAG 2.1 AA 44px minimum target size requirements.
  - Drag-and-Drop failure: Task management (`tenant/tasks/page.tsx:36-58`) relies exclusively on HTML5 desktop drag-and-drop APIs (`onDragStart`, `onDrop`), which do not fire on mobile touchscreens. No touch fallback or dropdown status selector is provided.
- **Desktop (1024px – 1920px)**:
  - Enclosed in `max-w-7xl mx-auto`, responsive navigation sidebar operates smoothly with collapse and keyboard shortcut (`Ctrl+K`).

---

### 1.6 Critical Functional Risks & Data Integrity Gaps

#### 1. Hardcoded Mock Fallbacks & Multi-Tenant Data Leaks
- **`tenant/dashboard/page.tsx:159-280`**: Contains fallback mock datasets (`fallbackHorizonDataMap`, `fallbackSegmentationData`, `fallbackLeadSourceData`, `fallbackInventoryRunway`, `fallbackSubsidyFunnel`). If the API returns empty results, the dashboard renders fake operational metrics.
- **`tenant/projects/[id]/page.tsx:87-144`**: Critical multi-tenant leak! When generating DISCOM statutory net-metering forms, if customer or tenant fields are undefined, the application injects hardcoded personal data:
  - Customer: `"SHRI. SURENDRA RAMBHAU THAKRE"`, CA: `"410022120526"`, Mobile: `"8605849639"`
  - Vendor/Tenant: `"EKVARTA ENERGY SOLUTIONS"`, GSTIN: `"27DTXPM6427E1Z3"`, Address: `"PLOT NO 4 HOUSE NO 85, TAJ HOUSING SOCIETY, HUDKESHWAR ROAD, PIPLA FATA, Nagpur 440034"`
  - Module Serials: `["MS2608211A3882", "MS2608211A3908", ...]`
  - Any tenant generating statutory forms without an updated profile will issue official documents under another vendor's legal identity.

#### 2. Dead Navigation Links & 404 Routes
The following action buttons and links point to non-existent routes:
1. `tenant/installation/page.tsx:38`: `<Link href="/tenant/installation/schedule">` -> **404**
2. `tenant/installation/page.tsx:95`: `<Link href="/tenant/installation/calendar">` -> **404**
3. `tenant/installation/page.tsx:103`: `<Link href="/tenant/installation/checklists">` -> **404**
4. `tenant/installation/jobs/page.tsx:52`: `<Link href="/tenant/installation/schedule">` -> **404**
5. `tenant/inventory/page.tsx:44`: `<Link href="/tenant/inventory/products/new">` -> **404**
6. `tenant/inventory/products/page.tsx:43`: `<Link href="/tenant/inventory/products/new">` -> **404**
7. `tenant/projects/[id]/page.tsx:992`: `<Link href="/tenant/quotations/new">` -> **404**
8. `super-admin/layout.tsx:251`: `<Link href="/super-admin/profile">` -> **404**
9. `super-admin/layout.tsx:258`: `<Link href="/super-admin/security">` -> **404** (route is `/super-admin/security/audit-logs`)

#### 3. Financial Calculation Bugs in `solarCalculator.ts` (`web-client/src/services/solarCalculator.ts`)
- **GST Overcharge Bug on Overall Discount (`solarCalculator.ts:430-489`)**:
  - In `calculateCommercialPricing()`, item-level tax (`itemTax`) is computed on pre-discount base amounts (`baseAmount * (taxRate / 100)`) and summed into `totalTax`.
  - When `overallDiscount > 0`, line 467 computes `taxableAmount = subtotal - discountAmount`, but line 473 sets `grandTotal = taxableAmount + totalTax`.
  - Because `totalTax` was NOT recalculated on the discounted taxable amount, tax is calculated on the pre-discount total, overcharging GST to customers.
- **Milestone Rounding Discrepancy (`solarCalculator.ts:494-515`)**:
  - `generateMilestones()` calculates each milestone as `Math.round(total * (pct / 100))`.
  - Because each stage is rounded independently, the sum of milestone amounts often differs by ₹1 to ₹5 from `grandTotal`, creating accounting reconciliation errors between proposals and invoices.

---

### 1.7 Tooling, Build, Lint & Test Commands Discovery

| Package | Build Command | Lint Command | Typecheck Command | Test Command | Status / Verified Notes |
|---|---|---|---|---|---|
| **web-client** | `npm run build` (`next build`) | `npm run lint` (`eslint`) | Not in `package.json` | None configured | `node node_modules/typescript/bin/tsc --noEmit` verified: **0 errors**. `next.config.ts` currently bypasses type check via `ignoreBuildErrors: true`. |
| **mobile-app** | `expo start` / `expo run:android` | None | None | None | No automated test framework. |
| **backend** | `npm run build` (`prisma generate`) | None | None | `"test": "echo \"Error: no test specified\" && exit 1"` | No test framework installed. |

---

## 2. Logic Chain

1. **Premise 1 (Design System Inconsistency)**:
   - Observed that `web-client/src/components` contains no generic UI primitives (`Button`, `Table`, `Input`, `Modal`, `Badge`, `Toast`).
   - Observed that individual pages assign disparate primary colors (`emerald-600` in Leads, `indigo-600` in Installation, `blue-600` in Dashboard/Quotations).
   - *Inference*: The frontend lacks a standardized component layer. Changes to branding or accessibility require manual edits across dozens of page files. Introducing a shared UI library (`components/ui`) is a prerequisite to individual module improvements.

2. **Premise 2 (Dead Links & Route Gaps)**:
   - Observed 7 explicit `<Link>` elements pointing to non-existent route paths (`/tenant/installation/schedule`, `/calendar`, `/checklists`, `/tenant/inventory/products/new`, `/tenant/quotations/new`, `/super-admin/profile`, `/super-admin/security`).
   - *Inference*: Features were stubbed out in UI navigation before the corresponding page routes were created, causing 404 errors during live testing.

3. **Premise 3 (Multi-Tenant Data Leakage & Mock Data)**:
   - Observed hardcoded strings for "EKVARTA ENERGY SOLUTIONS", "SHRI. SURENDRA RAMBHAU THAKRE", and specific module serial numbers in `tenant/projects/[id]/page.tsx:87-144`.
   - Observed fallback mock arrays in `tenant/dashboard/page.tsx:159-280`.
   - *Inference*: Violates requirement R3 ("Never replace real functionality with mockups, dummy data, or placeholder actions") and R4 (multi-tenant isolation). The application must enforce strict database-backed profile resolution, rendering empty/unconfigured states rather than third-party identity data.

4. **Premise 4 (Financial Precision & GST Compliance)**:
   - Observed in `solarCalculator.ts:430-475` that `totalTax` does not adjust for `overallDiscount`, and milestone amounts round independently without remainder reconciliation.
   - *Inference*: Violates requirement R4/R5 ("Quotations, invoices, and payment calculations use decimal arithmetic with consistent tax, discount, and rounding rules"). Taxable base and tax must be calculated on net discounted amounts, and the final milestone must absorb rounding discrepancies.

5. **Premise 5 (Mobile Responsiveness & Usability)**:
   - Observed unstacked `grid grid-cols-2` inside modals and pure HTML5 drag-and-drop in `tenant/tasks`.
   - *Inference*: The app degrades significantly on mobile devices (<360px) and field tablets. Modals must stack form fields vertically on small screens (`grid-cols-1 sm:grid-cols-2`), and touch-compatible status controls must be added to task cards.

---

## 3. Caveats
1. **Network & Backend Coupling**: Analysis was conducted via read-only inspection of the repository. Dynamic behavior under live multi-tenant backend responses was evaluated by tracing client-side code and API contracts.
2. **Mobile App Deep Dive**: While the mobile app workspace (`mobile-app`) was cataloged and compared against `web-client`, deep audit of native React Native screen layouts is handled in parallel by the mobile workflows specialist.
3. **No Caveats on Codebase Completeness**: All 58 web-client pages, all layout files, styling definitions, and calculation engines were directly inspected and verified.

---

## 4. Conclusion & Actionable Recommendations

### 4.1 Phase 3 Architecture: Standardized UI Primitives Foundation
Before refactoring individual business modules, create a centralized shared UI library in `web-client/src/components/ui/`:
1. `Button.tsx`: Unified button with `variant` (`primary`, `secondary`, `outline`, `ghost`, `danger`), `size` (`sm`, `md`, `lg`), loading spinner indicator, and automatic double-click prevention (`disabled={isLoading}`).
2. `Input.tsx` / `Select.tsx`: Standardized inputs with label, error message, helper text, and full responsive width.
3. `Modal.tsx` / `Dialog.tsx`: Accessible dialog wrapper with `Escape` key dismissal, click-outside handling, backdrop blur, and scroll lock.
4. `Table.tsx`: Responsive table primitive with built-in empty state, loading skeleton, and mobile card toggle.
5. `Toast.tsx`: Global notification context replacing all browser `alert()` invocations.
6. `Badge.tsx`: Semantic status tags (`success`, `warning`, `danger`, `info`, `neutral`).
7. `EmptyState.tsx`: Reusable empty state component with icon, title, description, and action button.

### 4.2 Fix 404 Routes & Dead Navigation Links
- Create missing routes or update links:
  - Connect `/tenant/inventory/products/new` to an "Add Product" drawer or page.
  - Fix `/tenant/quotations/new` link in project details to trigger the quotation wizard with `?projectId=...`.
  - Implement `/tenant/installation/jobs/page.tsx` tabs or sub-pages for schedule, calendar, and checklists.
  - Correct `/super-admin/security` link to `/super-admin/security/audit-logs`.

### 4.3 Eliminate Hardcoded Mock Data & Multi-Tenant Leaks
- Refactor `tenant/projects/[id]/page.tsx`: Replace hardcoded fallback strings ("EKVARTA ENERGY SOLUTIONS", "SHRI. SURENDRA RAMBHAU THAKRE", etc.) with empty defaults. If statutory generation is requested with missing profile data, prompt the user with a validation modal to complete organization/customer settings.
- Refactor `tenant/dashboard/page.tsx`: Remove hardcoded fallback arrays; render authentic zero/empty state visualizations when no records exist.

### 4.4 Refactor `solarCalculator.ts` for Decimal Precision & GST Accuracy
- Recompute tax after applying `overallDiscount` across all items proportionally.
- Rebalance milestone generation so the sum of milestone amounts exactly equals `grandTotal` (`milestones[last].amount = grandTotal - sum(milestones[0..n-1])`).

### 4.5 Responsive Design Fixes
- Add `grid-cols-1 sm:grid-cols-2` across all modal forms to ensure proper rendering on viewports 320px–480px.
- Add tap-to-move status selector on task cards in `tenant/tasks/page.tsx` for mobile touchscreen support.

### 4.6 Verification & CI Pipeline Hardening
- Remove `typescript: { ignoreBuildErrors: true }` from `next.config.ts`.
- Add `"typecheck": "tsc --noEmit"` and Vitest component test scripts to `web-client/package.json`.

---

## 5. Verification Method

### 5.1 Independent Codebase Verification Commands
Execute the following commands in powershell from repository root to verify observations:

1. **Verify Clean TypeScript Compilation**:
   ```powershell
   node "f:\Company Products\solar-manager\web-client\node_modules\typescript\bin\tsc" --noEmit -p "f:\Company Products\solar-manager\web-client\tsconfig.json"
   ```
   *Expected Outcome*: Exits with code 0 (no compile errors under strict mode).

2. **Verify Hardcoded Mock Fallbacks in Dashboard**:
   ```powershell
   Select-String -Path "f:\Company Products\solar-manager\web-client\src\app\tenant\dashboard\page.tsx" -Pattern "fallbackHorizonDataMap|fallbackSegmentationData|fallbackLeadSourceData"
   ```
   *Expected Outcome*: Confirms lines 171–280 contain hardcoded fallback mock arrays.

3. **Verify Hardcoded Multi-Tenant Data Leaks**:
   ```powershell
   Select-String -Path "f:\Company Products\solar-manager\web-client\src\app\tenant\projects\[id]\page.tsx" -Pattern "EKVARTA|RAMBHAU|27DTXPM6427E1Z3"
   ```
   *Expected Outcome*: Confirms hardcoded identity strings in statutory document generator.

4. **Verify Dead Links / 404 Routes**:
   ```powershell
   Select-String -Path "f:\Company Products\solar-manager\web-client\src\app\tenant\installation\page.tsx" -Pattern "href=.*/tenant/installation/(schedule|calendar|checklists)"
   ```
   *Expected Outcome*: Confirms lines 38, 95, 103 link to non-existent route paths.

5. **Verify Native `alert()` Invocations**:
   ```powershell
   Get-ChildItem -Path "f:\Company Products\solar-manager\web-client\src\app\tenant" -Recurse -Filter "*.tsx" | Select-String -Pattern "alert\("
   ```
   *Expected Outcome*: Identifies native browser alert calls in `finance`, `surveys`, `tasks`, and `projects`.

### 5.2 Invalidation Conditions
- If `components/ui/` primitives are found to already exist in a separate workspace package, premise 1 is invalidated.
- If `/tenant/installation/schedule` is served by an internal rewrite rule in `next.config.ts`, premise 2 is invalidated (verified: `next.config.ts` has no rewrites).
