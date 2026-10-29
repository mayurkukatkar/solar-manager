# Task Assignment: E2E Testing Track — Opaque-Box Test Suite Design & Runner

## Mission
Design and implement a comprehensive, requirement-driven, opaque-box E2E test suite for WhereReady Solar OS following the 4-tier methodology:
1. **Tier 1 - Feature Coverage**: Happy-path tests for each core solar ERP feature in isolation (Authentication, Lead capture, Sizing calculation, Quotation generation, Project conversion, Invoicing, DISCOM gating, PM Surya Ghar subsidy caps).
2. **Tier 2 - Boundary & Corner Cases**: Edge cases, negative inputs, invalid DISCOM consumer numbers, system capacity limits (0 kW, negative kW, >3 kW subsidy cap), odd pricing amounts with 13.8% composite GST rounding, and unauthenticated access rejection.
3. **Tier 3 - Cross-Feature Combinations**: Pairwise interactions (Lead -> Customer -> Project -> Milestone Invoicing; Survey feasibility -> Quotation revision -> BOM material requirements; PO receipt -> stock ledger increment -> dispatch).
4. **Tier 4 - Real-World Application Scenarios**: Complete end-to-end solar EPC customer journeys (e.g. 3.3 kW residential rooftop under PM Surya Ghar with MSEDCL net metering and milestone financing; commercial 50 kW rooftop with accelerated depreciation).

## Output Artifacts
1. Test suite files in `backend/test/e2e/` (runnable via standard Node test runner `node --test`).
2. `TEST_INFRA.md` at repository root defining test architecture, methodology, feature inventory coverage, and runner invocation.
3. `TEST_READY.md` at repository root once the test suite is ready, summarizing coverage across Tiers 1–4.

## Mandatory Inputs to Read
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)
- `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
- `f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\handoff.md`
- `f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_mobile_workflows\handoff.md`

## File Ownership
You exclusively own:
- `backend/test/e2e/`
- `TEST_INFRA.md`
- `TEST_READY.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e_track\`
Write your `progress.md` with liveness timestamps.
Write your final `handoff.md` report and send a message when complete.


## 2026-10-29T11:29:31Z
You are the E2E Test Writer responsible for the E2E Testing Track of WhereReady Solar OS.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e_track\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e_track\DISPATCH.md before starting.
Your task is to design and implement the opaque-box automated test suite across Tiers 1-4 in backend/test/e2e/, author TEST_INFRA.md, and publish TEST_READY.md at the repository root upon completion.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Update progress.md with your liveness heartbeat.
Write your final handoff report to f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e_track\handoff.md and notify me via send_message when complete.
