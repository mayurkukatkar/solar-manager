# Test Infrastructure & Methodology: WhereReady Solar OS Enterprise SaaS

**Author**: E2E Test Writer (`test_writer_e2e_track`)  
**Status**: Production Ready & Fully Automated  
**Execution Engine**: Node.js Built-in Test Runner (`node --test`)  
**Target Suite**: `backend/test/e2e/`  

---

## 1. Test Architecture & Design Philosophy

WhereReady Solar OS is an Indian Solar EPC Business Management & Operations SaaS platform. The automated E2E test suite adheres to strict **opaque-box (black-box)** testing principles:
- **Zero Internal Mocking**: The test runner executes genuine HTTP requests (`GET`, `POST`, `PATCH`, `DELETE`) over TCP sockets against the running Express 5.2.1 backend.
- **Real Database & State Persistence**: All entity lifecycles, database transactions, foreign key cascades, and status transitions persist in PostgreSQL via Prisma ORM 5.22.0.
- **Multi-Tenant Boundary Enforcement**: Authenticated sessions are established using real JWT Bearer tokens signed with `JWT_SECRET`, verifying tenant scoping (`tenantId`), RBAC roles (`TENANT_ADMIN`, `TENANT_SUB_ADMIN`), and multi-tenant isolation.
- **Statutory & Mathematical Precision**: All statutory PM Surya Ghar subsidy slabs (₹30k, ₹60k, ₹78k caps), 13.8% composite solar GST splits (70% material @ 12% + 30% service @ 18%), and MSEDCL 5-stage gating state machines are authoritatively verified against actual system outputs.

---

## 2. Directory Layout & Test Suite Hierarchy

```
backend/test/e2e/
├── testHelper.js                         # Test server lifecycle, JWT generator, HTTP dispatcher, cleanup
├── tier1-feature-coverage.test.js        # Tier 1: Core Solar ERP Feature Coverage in Isolation
├── tier2-boundary-corner-cases.test.js   # Tier 2: Boundary, Negative Inputs & Security Constraints
├── tier3-cross-feature-combinations.test.js # Tier 3: Pairwise Multi-Module Workflows
└── tier4-real-world-scenarios.test.js    # Tier 4: Full Solar EPC Customer Journeys (Residential & Commercial)
```

---

## 3. 4-Tier Testing Methodology

The test suite is structured across 4 rigorous tiers of increasing integration scope:

### Tier 1 — Core Feature Coverage (Isolation)
Tests each fundamental solar ERP capability in isolation using genuine opaque HTTP API calls:
1. **Authentication & Session Authorization**: `POST /api/auth/login` credential validation, HTTP 401 rejection on invalid passwords, Bearer token issuance, and protected tenant route access.
2. **CRM Lead Capture**: `POST /api/tenant/leads` and `GET /api/tenant/leads/:id` with complete prospect attributes (name, 10-digit mobile, customer type, estimated kW, city).
3. **Solar Engineering Sizing Engine**: Hardware reconciliation (550Wp modules x 6 = 3.3 kWp, 215 sq ft roof area), 25-year compounding degradation (0.7%/yr), 12-month irradiance distribution (peaking in May at 10.6%), and environmental offsets (3,951 kg CO2/yr).
4. **Commercial Quotation Generation**: `POST /api/tenant/quotations` and `GET /api/tenant/quotations/:id` with technical specifications, line items, 13.8% composite GST, and 4-stage payment milestones.
5. **Project Conversion Workflow**: `POST /api/tenant/quotations/:id/convert` locking quotation state (`ACCEPTED`, `isLocked: true`), spawning `Project` in `Planning` stage, and auto-provisioning Bill of Materials (`ProjectMaterialRequirement`) and `DiscomApplication`.
6. **Milestone Tax Invoicing**: `POST /api/tenant/finance/convert-quotation` generating 4 milestone invoices: Stage 1 Advance (20%, HSN 9954), Stage 2 Material Delivery (60%, HSN 8541), Stage 3 Installation (15%, HSN 9954), Stage 4 Commissioning (5%, HSN 9954) with composite GST calculations (`taxableSubtotal = Math.round(amount / 1.138)`).
7. **DISCOM Grid Interconnection Gating**: `POST /api/tenant/projects/:id/discom` and `PATCH /api/tenant/projects/:id/discom/stage` verifying initial `FEASIBILITY_PENDING` and advancement to `CEIG_INSPECTION` with `FEASIBILITY_LETTER`.
8. **PM Surya Ghar Subsidy Caps & National Portal Smart Parser**: Slabs validation (1 kW = ₹30k, 2 kW = ₹60k, >=3 kW = ₹78k cap), and `POST /api/tenant/pmsuryaghar/smart-parse` unstructured regex extraction of application numbers, 12-digit consumer numbers, customer names, loads, and portal stages.

### Tier 2 — Boundary, Corner Cases & Security Constraints
Tests negative inputs, boundary conditions, edge cases, and defensive barriers:
1. **Unauthenticated Rejection**: Protected tenant endpoints (`/api/tenant/leads`, `/api/tenant/quotations`, `/api/tenant/finance`, `/api/tenant/procurement`) strictly return HTTP 401 Unauthorized (`'Unauthorized: Tenant Access Required'`).
2. **Malformed Token Handling**: Invalid Bearer tokens return HTTP 401 (`'Invalid or expired session'`).
3. **DISCOM Consumer Number Validation**: Rejects empty payloads with HTTP 400 (`'Text content is required'`), extracts valid 12-digit MSEDCL numbers, and rejects short codes (<8 digits).
4. **System Capacity Limits & Subsidy Boundaries**: 0 kW returns ₹0 subsidy, micro-systems (<1 kW) receive proportional CFA, exact slab boundaries (1.0 kW, 2.0 kW, 3.0 kW) match MNRE rules, capacities >3.0 kW (3.3 kW, 5.0 kW, 50.0 kW) are capped at strictly ₹78,000, and commercial connections receive ₹0 subsidy (`isEligible: false`).
5. **Odd Pricing Amounts & 13.8% Composite GST Rounding**: Tests irregular contract amounts (₹2,75,001, ₹1,91,400, ₹3,47,999) confirming `subtotal + tax === grandTotal` with **zero penny/rupee drift**, and milestone allocations sum precisely to grand total.
6. **DISCOM 5-Stage Gating Strict Rejections**: Attempting to advance DISCOM stages without mandatory statutory proof returns HTTP 400:
   - `CEIG_INSPECTION` requires `FEASIBILITY_LETTER`
   - `METER_TESTING` requires `CEIG_APPROVAL`
   - `NET_METER_INSTALLED` requires `METER_TEST_REPORT`
   - `GRID_SYNCHRONIZED` requires `NET_METER_CERTIFICATE`
7. **Resource Boundary Lookups**: Non-existent UUID lookups return HTTP 404 for leads, quotations, purchase orders, and subsidies.
8. **Multi-Tenant Boundary Isolation**: Tenant B credentials cannot view, delete, or convert records belonging to Tenant A (queries return HTTP 404 due to strict `where: { id, tenantId }` scoping).

### Tier 3 — Cross-Feature Multi-Module Workflows
Tests multi-stage pairwise lifecycle transitions across interconnected business tables:
1. **Interaction 1: Lead -> Customer -> Project -> Milestone Invoicing & Payment**:
   - Capture Lead -> Convert to Customer & Project -> Verify Idempotency (re-conversion returns existing project without duplicate) -> Generate Quotation -> Convert to 4 Milestone Invoices -> Record Advance Payment -> Verify Invoice marked `PAID`.
2. **Interaction 2: Survey Feasibility -> Quotation Revision -> BOM Material Requirements**:
   - Create Site Survey with 600 sq ft roof profile -> 1-Click Convert to Quotation -> Enrich line items -> Mark `ACCEPTED` -> Convert Quotation to Project -> Verify auto-generated Bill of Materials (`ProjectMaterialRequirement`) for modules and inverter.
3. **Interaction 3: Purchase Order Receipt -> Stock Ledger Increment -> Material Dispatch**:
   - Create Catalog Product -> Issue Purchase Order for 50 modules -> Mark PO `RECEIVED` -> Verify product stock auto-incremented from 10 to 60 -> Verify `StockLedger` recorded `RECEIPT` -> Dispatch 10 modules to installation site -> Verify stock decremented to 50 and `StockLedger` recorded `DISPATCH` (-10).

### Tier 4 — Real-World Solar EPC Customer Journeys
Complete end-to-end solar EPC customer journeys simulating real-world commercial and residential operations:
1. **Scenario 1: 3.3 kW Residential Rooftop under PM Surya Ghar with MSEDCL Net Metering**:
   - Pune residential homeowner with 12-digit MSEDCL consumer number `028510293812`
   - Lead Capture -> Site Survey -> 3.3 kW Turnkey Quotation (6 x 550Wp modules, ₹191,400 total, ₹78k subsidy, ₹113.4k net customer investment, 2.8 yr payback) -> Project Conversion with BOM -> 4 Milestone Invoices & Stage 1 Advance Clearance (₹38,280) -> MSEDCL 5-Stage Gated Interconnection (Feasibility -> CEIG -> Meter -> Grid Sync) -> PM Surya Ghar National Portal Funnel to Direct Benefit Transfer (DBT).
2. **Scenario 2: Commercial 50 kW Rooftop with Section 32 Accelerated Depreciation**:
   - Industrial client in Bhosari MIDC, Pune (Sanctioned Load 65 kVA, HT Industrial tariff @ ₹10.50/unit)
   - 50 kWp system generating 73,000 kWh/yr (₹766,500/yr bill savings) -> Section 32 40% Accelerated Depreciation tax shield (₹251,700 Year 1 cash benefit) -> Multi-item commercial quotation (modules, 50kW inverter, walkways, CEIG liasoning) -> Procurement PO issuance & auto-restocking -> Project Conversion with BOM -> Commercial milestone billing & RTGS advance payment clearance.

---

## 4. Feature Inventory Coverage Matrix

| Feature ID | Feature Name | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Verification Method |
|---|---|:---:|:---:|:---:|:---:|---|
| F-01 | JWT Authentication & Session Token | ✅ | ✅ | ✅ | ✅ | `POST /api/auth/login`, Bearer header validation |
| F-02 | CRM Lead Capture & Query | ✅ | ✅ | ✅ | ✅ | `POST /api/tenant/leads`, `GET /api/tenant/leads/:id` |
| F-03 | Solar Sizing & Hardware Reconciliation | ✅ | ✅ | — | ✅ | `calculateSystemCapacity`, 550Wp x 6 = 3.3 kWp |
| F-04 | 25-Year Solar Generation & Irradiance | ✅ | — | — | ✅ | `calculateSolarGeneration`, 1460 yield, 0.7% degradation |
| F-05 | PM Surya Ghar Subsidy Caps | ✅ | ✅ | — | ✅ | ₹30k/₹60k/₹78k slabs, residential cap, commercial ₹0 |
| F-06 | Commercial Quotation Engine | ✅ | ✅ | ✅ | ✅ | `POST /api/tenant/quotations`, technical specs |
| F-07 | 13.8% Composite Solar GST Arithmetic | ✅ | ✅ | ✅ | ✅ | `subtotal = Math.round(gross / 1.138)`, zero penny drift |
| F-08 | Quotation-to-Project Conversion | ✅ | — | ✅ | ✅ | `POST /api/tenant/quotations/:id/convert`, state locking |
| F-09 | Lead-to-Project Conversion (Idempotent) | — | ✅ | ✅ | — | `POST /api/tenant/leads/:id/convert`, duplicate prevention |
| F-10 | BOM Material Requirements Generation | ✅ | — | ✅ | ✅ | `ProjectMaterialRequirement` auto-creation from items |
| F-11 | 4-Stage EPC Milestone Invoicing | ✅ | — | ✅ | ✅ | Advance 20%, Delivery 60%, Install 15%, Sync 5% |
| F-12 | Milestone Payment Recording | — | — | ✅ | ✅ | `POST /api/tenant/invoices/:id/payments`, status -> PAID |
| F-13 | DISCOM 5-Stage Gating State Machine | ✅ | ✅ | — | ✅ | Mandatory document URL verification at each gate |
| F-14 | National Portal Smart Text Parser | ✅ | ✅ | — | — | `POST /api/tenant/pmsuryaghar/smart-parse` |
| F-15 | Purchase Order Auto-Stock Restocking | — | — | ✅ | ✅ | `PATCH /api/tenant/procurement/:id/status` -> RECEIVED |
| F-16 | Stock Ledger Audit Trail | — | — | ✅ | — | `StockLedger` movements (RECEIPT, DISPATCH) |
| F-17 | Site Feasibility Survey | — | — | ✅ | ✅ | `POST /api/tenant/surveys`, shadow-free roof audit |
| F-18 | Survey to Quote 1-Click Conversion | — | — | ✅ | — | `POST /api/tenant/surveys/:id/convert-to-quote` |
| F-19 | Multi-Tenant Data Isolation | — | ✅ | — | — | Tenant B cannot access or mutate Tenant A entities |
| F-20 | Section 32 Accelerated Depreciation | — | — | — | ✅ | 40% initial year depreciation, ₹251.7k tax benefit |

---

## 5. Test Execution & CLI Commands

### Run Full E2E Test Suite (All 4 Tiers)
```powershell
node --test "backend/test/e2e/*.test.js"
```

### Run Individual Tiers
```powershell
# Tier 1: Core Feature Coverage
node --test "backend/test/e2e/tier1-feature-coverage.test.js"

# Tier 2: Boundary & Corner Cases
node --test "backend/test/e2e/tier2-boundary-corner-cases.test.js"

# Tier 3: Cross-Feature Multi-Module Workflows
node --test "backend/test/e2e/tier3-cross-feature-combinations.test.js"

# Tier 4: Real-World Customer Journeys
node --test "backend/test/e2e/tier4-real-world-scenarios.test.js"
```

### Run Existing Backend Unit / DB Suites
```powershell
node --test "backend/test/solarCalculator.test.js"
node --test "backend/test/quotationsApi.test.js"
node --test "backend/test/settingsApi.test.js"
node --test "backend/test/e2eProposalBuilder.test.js"
```
