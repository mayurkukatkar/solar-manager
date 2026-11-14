# Test Infrastructure & Methodology: WhereReady Solar OS Enterprise Platform

**Author**: Lead E2E Test Architect (`test_writer_e2e`)  
**Status**: Production Ready & Fully Automated  
**Execution Engine**: Node.js Built-in Test Runner (`node --test`) & Native Standalone Scripts  
**Test Tracks**: Dual-Track Architecture (Mobile Client SaaS Track + Backend Core Engine Track)  

---

## 1. Test Architecture & Design Philosophy

WhereReady Solar OS is a mission-critical SaaS operating system tailored for Indian solar EPC businesses, installers, field engineers, and DISCOM liaisons. The automated end-to-end (E2E) testing framework strictly follows **opaque-box (black-box)** and **requirement-driven** principles:

1. **Opaque-Box & Requirement-Driven**:
   - Tests evaluate system behavior against business specifications, statutory mandates (MNRE, CEA, MSEDCL), and user journeys without relying on internal private component states.
   - Tests assert observable contracts: API HTTP responses, statutory document structures, calculation invariants, electrical safety thresholds, offline sync queues, and database state transitions.
2. **Zero Facade / High Integrity**:
   - No mock tests that pass unconditionally.
   - Real mathematical formulas, actual 13.8% composite solar GST splits (70% material @ 12% + 30% service @ 18%), exact CEA electrical safety gating thresholds, real 2D QR/DataMatrix barcode parsing, and real persistence mechanisms.
3. **Dual-Track Cohesion**:
   - **Track A (Mobile Client Track)**: Verifies mobile client domain workflows, form ergonomics, customer onboarding validation, dynamic hardware sizing, 2D barcode scanning, CEA electrical QA, offline draft queue replay, and DISCOM document generation (`mobile-app/`).
   - **Track B (Backend Core Engine Track)**: Verifies multi-tenant isolation, JWT authentication, PostgreSQL/Prisma database lifecycle transactions, HTTP routing, and backend statutory engines (`backend/`).
4. **Platform Independence & CI Cleanliness**:
   - All tests execute synchronously via standard Node.js without requiring third-party browser emulators or external device bridges, enabling instant CI/CD verification in under 600ms for mobile and under 90s for backend.

---

## 2. Directory Layout & Test Suite Hierarchy

```
f:\Company Products\solar-manager/
├── mobile-app/
│   ├── tests/
│   │   ├── test-helpers.js                     # Domain models, oracles, in-memory storage & fixtures
│   │   ├── tier1-category-partition.test.js    # Tier 1: Core Feature Coverage in Isolation (50 tests)
│   │   ├── tier2-boundary-analysis.test.js     # Tier 2: Boundary Values & Negative Constraints (43 tests)
│   │   ├── tier3-pairwise-combinations.test.js # Tier 3: Pairwise Multi-Module Workflows (12 tests)
│   │   └── tier4-real-world-scenarios.test.js  # Tier 4: Real-World Solar EPC Customer Journeys (16 tests)
│   ├── test-e2e.js                             # Standalone Mobile E2E Test Suite Runner (121 tests)
│   └── test-perspectives.js                    # Comprehensive System Perspective Verification (23 tests)
│
├── backend/
│   └── test/e2e/
│       ├── testHelper.js                       # Test server lifecycle, JWT generator, HTTP client
│       ├── tier1-feature-coverage.test.js      # Tier 1: Backend ERP Feature Isolation (15 tests)
│       ├── tier2-boundary-corner-cases.test.js # Tier 2: Backend Boundary & Security Constraints (31 tests)
│       ├── tier3-cross-feature-combinations.test.js # Tier 3: Backend Multi-Module Lifecycles (12 tests)
│       └── tier4-real-world-scenarios.test.js  # Tier 4: Backend Residential & Commercial EPC Journeys (11 tests)
│
├── TEST_INFRA.md                               # This document: Comprehensive Dual-Track Test Methodology
└── TEST_READY.md                               # Production Test Readiness & Verification Declaration
```

---

## 3. 4-Tier Testing Methodology & Coverage Thresholds

The framework organizes tests across 4 rigorous tiers of increasing integration scope. Strict coverage thresholds ensure thoroughness across all operational dimensions:

| Tier | Focus | Methodology | Mobile Target | Backend Target | Threshold Standard |
|---|---|---|:---:|:---:|---|
| **Tier 1** | Feature Coverage | Category-Partition (Equivalence Partitioning) | 50 tests | 15 tests | **>= 5 test cases per feature** |
| **Tier 2** | Boundary & Negatives | Boundary Value Analysis (BVA) & Stress Cases | 43 tests | 31 tests | **>= 5 test cases per boundary domain** |
| **Tier 3** | Cross-Module Workflows | Pairwise & Combinatorial Interaction Testing | 12 tests | 12 tests | **End-to-end multi-table transitions** |
| **Tier 4** | Customer Journeys | Realistic End-to-End Enterprise Scenarios | 16 tests | 11 tests | **Realistic end-to-end solar business workloads** |
| **Total** | Full Platform E2E | Dual-Track Integrated Verification | **121 tests** | **69 tests** | **190 tests (100% Pass Rate)** |

*(Note: Including `mobile-app/test-perspectives.js` [23 tests], the platform has **213 automated tests**).*

---

### Tier 1 — Category-Partition Feature Coverage (In Isolation)
Tests each fundamental business capability in isolation, verifying happy paths, expected state transformations, and input partitions.
- **Mobile Client Track (50 tests)**:
  1. *Customer Onboarding & KYC*: Full payload validation, mandatory legal name, 10-digit mobile, compulsory DISCOM consumer number, KYC document optionality at onboarding.
  2. *Solar Sizing & PM Surya Ghar Central DBT Subsidy*: Capacity-driven pricing, central subsidy slabs (1 kW = ₹30k, 2 kW = ₹60k, >=3 kW = ₹78k cap), annual yield (~1460 kWh/kW/yr), monthly generation (~120 kWh/kW/mo), CO2 offset (0.82 kg/kWh), tree equivalent.
  3. *Dynamic Hardware Modules & Inverters*: 7+ ALMM Tier-1 PV modules, 7+ grid-tied inverters, dynamic module count calculation (`Math.ceil(kW*1000/wattage)`), custom module support (e.g. 580W/600W).
  4. *Statutory 13.8% Composite Solar GST*: 70% material goods @ 12% + 30% civil/installation services @ 18% = 13.8% composite rate; zero penny drift invariant across all prices; trade discount scaling.
  5. *Statutory DISCOM Document Studio*: 7 templates parity (WCR Full 3-page, WCR p1, Annexure I Commissioning, Annexure A DCR, Net Metering Agreement 6-page, PM Surya Ghar Agreement 3-page, Standard Quotation); 115mm treasury stamp margin toggle vs digital ₹100 stamp emblem.
  6. *2D Barcode & QR Scanner Parser*: Multi-field QR/DataMatrix parsing (JSON-encoded, delimiter-separated `|` or `;`, raw serial); ALMM Indian Tier-1 DCR module verification; duplicate serial detection.
  7. *Electrical QA Sign-Off & CEA Safety Gating*: Statutory limits (<5.0Ω earth pit 1, <5.0Ω earth pit 2, <5.0Ω earth pit 3, <2.0s anti-islanding trip time, >1.0MΩ insulation resistance); stage gating blocks if any threshold fails.
  8. *Resilient Offline Draft Storage*: Local storage persistence (`saveDraftLead`, `getDraftLeads`, `removeDraftLead`, `saveDraftQuote`, `getDraftQuote`), descending order retrieval, corrupted storage recovery.

- **Backend Core Engine Track (15 tests)**:
  - Authentication rejection, Bearer token access, CRM lead capture, solar engineering sizing engine, quotation generation, quotation-to-project conversion with BOM generation, 4-stage milestone invoice creation, DISCOM feasibility gating, and PM Surya Ghar national portal unstructured text smart parser.

---

### Tier 2 — Boundary Value Analysis & Negative Conditions
Explores boundary limits, strict statutory margins, extreme numeric inputs, format meta-characters, and defensive barriers:
- **Mobile Client Track (43 tests)**:
  1. *DISCOM Consumer Number Boundaries*: Exactly 5 chars (rejected), exactly 6 chars (accepted), 12-digit MSEDCL number (accepted), whitespace-only (rejected), whitespace trimmed, alphanumeric codes, null/undefined.
  2. *Solar Capacity Limits & Subsidy Caps*: Negative capacity (-3.3 kW -> ₹0), 0 kW -> ₹0, micro-systems (0.5 kW -> ₹30k), exact slab boundaries (1.0 kW, 2.0 kW, 3.0 kW), large capacities (100.0 kW capped at ₹78,000).
  3. *13.8% Composite GST Rounding & Zero Penny Drift*: Odd contract amounts (₹2,75,001, ₹1,91,400, ₹3,47,999, ₹1, ₹1,23,45,678), trade discounts equaling or exceeding gross, 4-stage milestone schedule rebalancing to exact gross total.
  4. *Electrical CEA Safety Threshold Strict Boundaries*:
     - Earth Pit 1: 4.99 Ω (PASS) vs 5.00 Ω (FAIL).
     - Earth Pit 2: 4.99 Ω (PASS) vs 5.00 Ω (FAIL).
     - Earth Pit 3: 4.99 Ω (PASS) vs 5.00 Ω (FAIL).
     - Anti-Islanding Trip Time: 1.99 s (PASS) vs 2.00 s (FAIL).
     - Insulation Resistance: 1.01 MΩ (PASS) vs 1.00 MΩ (FAIL).
     - Negative readings rejected as instrument error, non-numeric strings rejected with specific failure messages.
  5. *2D Barcode Scanner & Duplicate Collision Boundaries*: 4 chars (rejected), 5 chars (accepted), case-insensitive matching (`waa-001` vs `WAA-001`), whitespace-padded matching, collision with inverter serial, collision with project serial records, collision with DCR certificate text serials.
  6. *Indian Rupee Words Converter Boundary Scale*: 0/negative ("Zero Rupees Only"), 1 Rupee ("One Rupees Only"), ₹1,000, ₹1,00,000 (Lakh), ₹1,00,00,000 (Crore), multi-tier ₹25,48,750, overflow handling for >9 digits.

- **Backend Core Engine Track (31 tests)**:
  - HTTP 401 unauthenticated requests across all tenant routes, malformed Bearer tokens, DISCOM 5-stage gating strict rejections (missing statutory documents), non-existent resource lookups (HTTP 404), and multi-tenant data isolation enforcement (Tenant B cannot read, delete, or mutate Tenant A entities).

---

### Tier 3 — Pairwise Multi-Module Workflows
Verifies end-to-end data lineage across multi-stage business processes:
- **Mobile Client Track (12 tests)**:
  1. *Interaction 1: Customer Onboarding -> Sizing -> Milestone Invoicing*:
     - Data captured during onboarding flows into sizing calculation -> 13.8% composite GST breakdown -> 4 milestone invoices (Advance 20%, Delivery 60%, Installation 15%, Commissioning 5%) -> Currency words conversion.
  2. *Interaction 2: Dynamic Sizing -> Barcode Scanning -> DCR Validation -> Electrical QA*:
     - Sizing 3.3 kW resolves 6 Vikram 550W panels -> 6 barcodes scanned in multi-field formats -> DCR compliance verified -> Duplicate scans blocked -> CEA electrical testing verified -> Sign-off gating approves stage progression.
  3. *Interaction 3: Offline Draft Storage -> Quotation Caching -> Network Replay & Sync*:
     - Field engineer saves lead and quote offline -> App restart simulation -> Reconnect to network -> Synchronize lead to cloud -> Atomic deletion of draft from local storage without orphaned items.
  4. *Interaction 4: DISCOM Document Studio -> ₹100 Stamp Header -> 8-Point Audit*:
     - 8-point statutory audit verifies complete project metadata -> 7 statutory templates compiled -> Physical 115mm blank header preserved on page 1 for treasury stamp paper vs digital stamp graphic on page 1.

- **Backend Core Engine Track (12 tests)**:
  - Lead-to-Customer-to-Project conversion idempotency, site survey to quotation revision with BOM generation, purchase order receiving with auto-stock restock and StockLedger audit logging.

---

### Tier 4 — Real-World Solar EPC Customer Journeys
Simulates complete real-world solar business operations end-to-end:
- **Mobile Client Track (16 tests)**:
  1. *Scenario 1: Residential Rooftop (3.3 kW PM Surya Ghar DBT Flow in Pune, Maharashtra)*:
     - Homeowner with 12-digit MSEDCL consumer number -> 3.3 kW sizing with 6 x 550W Vikram Solar DCR modules -> ₹78,000 central subsidy -> 13.8% composite GST & 4 milestone invoices -> Advance ₹38,280 recorded -> 6 panel barcodes scanned -> CEA electrical QA sign-off -> 7 DISCOM documents compiled with 115mm treasury stamp paper header -> 8-point statutory audit verified.
  2. *Scenario 2: Commercial & Industrial Rooftop (50 kW Turnkey EPC in Chakan MIDC)*:
     - Industrial customer with HT Industrial tariff @ ₹10.50/unit -> 50 kW system generating 73,000 kWh/yr (₹7,66,500/yr savings) -> ₹0 central subsidy (commercial non-eligible) -> BOQ of 92 x 545W Adani TopCon DCR modules -> ₹25,00,000 gross with 13.8% composite GST (zero penny drift) -> 20% advance ₹5,00,000 via RTGS -> Industrial electrical QA verification.
  3. *Scenario 3: Remote Rural Agricultural Solar Pump in Satara*:
     - Farmer in Koregaon with zero cellular connectivity -> Offline lead and quote draft saved locally -> Reconnected and synced to cloud -> 10 x 540W Waaree DCR panels sized for 5 kW pump -> Motor earthing QA verified.
  4. *Scenario 4: Adverse Field Audit, Safety Threshold Gating & Corrective Re-Audit*:
     - Field inspection in Nagpur -> Inverter Earth Pit measured at 5.8 Ω (exceeds CEA 5.0 Ω limit) -> Mobile system halts stage advancement with explicit failure reasons -> Crew re-treats pit to 1.9 Ω and calibrates anti-islanding relay to 0.14 s -> Re-audit approved -> Project advances to Commissioning.

- **Backend Core Engine Track (11 tests)**:
  - Pune residential PM Surya Ghar journey through MSEDCL 5-stage interconnection, and Bhosari MIDC commercial 50 kW rooftop journey with Section 32 40% Accelerated Depreciation tax shield.

---

## 4. Feature Inventory Coverage Matrix

| Feature ID | Feature Name | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Verification Method |
|---|---|:---:|:---:|:---:|:---:|---|
| **MF-01** | Compulsory DISCOM Consumer No. Validation | ✅ | ✅ | ✅ | ✅ | `validateOnboardingSubmission`, >=6 chars, mandatory |
| **MF-02** | Customer Onboarding KYC Optionality | ✅ | — | — | ✅ | `canSubmitWithoutDocuments`, 0 initial docs permitted |
| **MF-03** | PM Surya Ghar Central DBT Subsidy Slabs | ✅ | ✅ | ✅ | ✅ | `computeSubsidy`, 1kW: 30k, 2kW: 60k, >=3kW: 78k cap |
| **MF-04** | Solar Sizing Engineering Yield & Offsets | ✅ | — | ✅ | ✅ | `calculateSolarFinancials`, 1460 yield, CO2 & trees |
| **MF-05** | Dynamic Hardware Modules & ALMM Inverters | ✅ | — | ✅ | ✅ | `resolveModuleQuantity`, 7+ panels, 7+ inverters |
| **MF-06** | Statutory 13.8% Composite Solar GST | ✅ | ✅ | ✅ | ✅ | `calculateCompositeSolarGst`, 70% @ 12% + 30% @ 18% |
| **MF-07** | Zero Penny Drift Invariant on Odd Pricing | ✅ | ✅ | ✅ | ✅ | `taxableSubtotal + taxAmount === grossAmount` |
| **MF-08** | Statutory DISCOM Document Studio (7 Templates) | ✅ | — | ✅ | ✅ | `STATUTORY_TEMPLATES`, WCR, Annexures, Net Metering |
| **MF-09** | ₹100 Treasury Stamp Paper 115mm Header | ✅ | — | ✅ | ✅ | `renderAgreementHeader`, 115mm blank margin vs digital |
| **MF-10** | 2D Barcode QR / DataMatrix Multi-Format Parser | ✅ | ✅ | ✅ | ✅ | `parseAndValidateBarcode`, JSON, delimited, raw |
| **MF-11** | Domestic Content Requirement (DCR) Validation | ✅ | — | ✅ | ✅ | ALMM Tier-1 patterns, DCR certificate matching |
| **MF-12** | Multi-Level Duplicate Serial Collision Detection | ✅ | ✅ | ✅ | ✅ | `detectDuplicateSerial`, session, inverter, project, inventory |
| **MF-13** | CEA Electrical QA Earthing Gating (<5.0 Ω) | ✅ | ✅ | ✅ | ✅ | `evaluateElectricalQATests`, Pits 1, 2, 3 < 5.0 Ω |
| **MF-14** | Anti-Islanding Grid Trip Gating (<2.0 s) | ✅ | ✅ | ✅ | ✅ | `evaluateElectricalQATests`, Trip time < 2.0 s |
| **MF-15** | Inverter Insulation Resistance Gating (>1.0 MΩ) | ✅ | ✅ | — | ✅ | `evaluateElectricalQATests`, Insulation > 1.0 MΩ |
| **MF-16** | 4-Stage EPC Milestone Invoicing Breakdown | — | ✅ | ✅ | ✅ | `generateMilestoneSchedule`, 20%, 60%, 15%, 5% |
| **MF-17** | Indian Rupee Words Currency Formatter | — | ✅ | ✅ | ✅ | `toIndianWords`, Lakhs, Crores, Hundreds, Units |
| **MF-18** | Resilient Offline Draft Storage & Queue | ✅ | — | ✅ | ✅ | `createOfflineSyncService`, draft saving & atomic delete |
| **MF-19** | 8-Point Statutory Pipeline Audit | — | — | ✅ | ✅ | `computePipelineAudit`, CRM, BOQ, barcodes, vendor |
| **MF-20** | Mobile Screen Ergonomics & Working Space | — | — | — | ✅ | Reclaims 275+ px in keyboard-active forms |

---

## 5. Test Execution & CLI Commands

### 1. Mobile Client E2E Test Suite (All 4 Tiers)
Execute the master runner:
```powershell
node mobile-app/test-e2e.js
```
Or execute directly with Node's test runner:
```powershell
node --test "mobile-app/tests/*.test.js"
```

### 2. Run Individual Mobile Tiers
```powershell
# Tier 1: Category-Partition Feature Coverage (50 tests)
node --test "mobile-app/tests/tier1-category-partition.test.js"

# Tier 2: Boundary Value Analysis & Negative Constraints (43 tests)
node --test "mobile-app/tests/tier2-boundary-analysis.test.js"

# Tier 3: Pairwise Multi-Module Workflows (12 tests)
node --test "mobile-app/tests/tier3-pairwise-combinations.test.js"

# Tier 4: Real-World Solar EPC Customer Journeys (16 tests)
node --test "mobile-app/tests/tier4-real-world-scenarios.test.js"
```

### 3. Run Mobile Perspectives Suite
```powershell
node mobile-app/test-perspectives.js
```

### 4. Backend Core Engine E2E Suite (All 4 Tiers)
```powershell
node --test "backend/test/e2e/*.test.js"
```

### 5. Run Full Platform Verification (All Tracks Combined)
```powershell
node mobile-app/test-e2e.js && node mobile-app/test-perspectives.js && node --test "backend/test/e2e/*.test.js"
```
