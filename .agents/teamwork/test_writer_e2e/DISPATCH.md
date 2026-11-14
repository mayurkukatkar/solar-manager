# Task Assignment: Test Writer (E2E Testing Track)

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e\
- Role: Lead E2E Test Architect (teamwork_test_writer)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read existing test perspectives suite at: `f:\Company Products\solar-manager\mobile-app\test-perspectives.js`.

## Objective
Establish the E2E Testing Track for WhereReady Solar OS:
1. Create `f:\Company Products\solar-manager\TEST_INFRA.md` following the Project Pattern dual-track template:
   - Test philosophy (opaque-box, requirement-driven, independent of internal module implementation).
   - Methodology (Category-Partition, Boundary Value Analysis, Pairwise Combinations, Real-World Workloads across Tiers 1-4).
   - Test architecture, test runner invocation, pass/fail semantics.
   - Complete feature inventory mapping to test tiers.
   - Coverage thresholds: Tier 1 (>=5/feature), Tier 2 (>=5/feature where boundaries exist), Tier 3 (pairwise interactions), Tier 4 (realistic end-to-end solar business scenarios).
2. Design and expand the automated test suite:
   - Expand `mobile-app/test-perspectives.js` or create modular test suites under `mobile-app/tests/` or `test-e2e.js` that can be run synchronously via `node ...`.
   - Ensure tests cover core user journeys: customer onboarding, solar sizing & PM Surya Ghar DBT calculation, 13.8% composite solar GST, 7 statutory DISCOM templates, 2D barcode validation, electrical QA thresholds, milestone invoicing, and offline draft storage.
3. Once the test infrastructure and initial suites are ready, publish `TEST_READY.md` at project root (`f:\Company Products\solar-manager\TEST_READY.md`).

## Constraints
- Do NOT modify application implementation source code. Only write tests, test runners, and test documentation.
- All test scripts must run cleanly without external browser dependencies or breaking CI.

## Output Deliverable
Write your implementation report to:
`f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e\test_report.md`
and write `handoff.md` in your working directory. Maintain `progress.md` with timestamped liveness updates.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T07:57:55Z
You are Lead E2E Test Architect (E2E Testing Track).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
Inspect existing test suite: f:\Company Products\solar-manager\mobile-app\test-perspectives.js

Create TEST_INFRA.md at project root.
Expand automated E2E tests for Tiers 1-4 (Category-Partition, Boundary Values, Pairwise Combinations, Real-World Workloads).
Publish TEST_READY.md when the test infrastructure and suite are complete.
Write your report to: f:\Company Products\solar-manager\.agents\teamwork\test_writer_e2e\test_report.md
Write handoff.md in your working directory. Maintain progress.md with timestamped liveness updates.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
