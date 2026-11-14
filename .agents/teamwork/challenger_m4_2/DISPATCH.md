## 2026-10-30T14:50:20Z
You are Challenger M4-2 (Virtualization & Layout Stress Verifier) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Read Worker M4's handoff report at:
   `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_v2\handoff.md`
4. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\challenger_m4_2\`

## Challenger Scope & Stress Testing
Write and execute an empirical stress test suite (`mobile-app/tests/tier5-m4-virtualization-layout-stress.js` or run standalone with `node`) covering:
1. **List Virtualization Layout Calculations**:
   - Verify `getItemLayout` formulas across `PipelineScreen` (180dp), `FieldProjectsScreen` (180dp), `OperationsScreen` (224dp), and `FinanceScreen` (200dp) across indices 0, 1, 10, 50, 100, 500: confirm `length`, `offset`, and `index` match exact arithmetic without rounding or off-by-one errors.
   - Test keyExtractor uniqueness and stability under duplicate IDs, numeric IDs, string IDs, and undefined values.
2. **Debounce Behavior**:
   - Stress-test `useDebounce` with rapid simulated typing (10 character inputs fired at 20ms intervals): verify that intermediate values are suppressed and only the terminal value is dispatched after 300ms.
3. **Statutory Calculation Consistency**:
   - Verify that memoized 13.8% composite solar GST (70% @ 12% + 30% @ 18%), BOM component breakdowns, DBT subsidy ceilings (₹30k/₹60k/₹78k), and CEA electrical safety checks (<5Ω, <2s, >1MΩ) yield mathematically identical results across 10,000 randomized iterations with 0 penny drift.
4. **Permissions State Machine**:
   - Verify `PermissionRationaleModal` and `useAppPermissions` state machine under granted, denied, and permanently denied (`canAskAgain === false`) conditions, verifying that Settings deep link URL (`Linking.openSettings`) is properly triggered and AppState active events correctly initiate re-checks.

## Output Requirements
Write and execute your empirical test suite. Document test results in `f:\Company Products\solar-manager\.agents\teamwork\challenger_m4_2\analysis.md` and complete handoff report to `f:\Company Products\solar-manager\.agents\teamwork\challenger_m4_2\handoff.md`. Include a clear verdict: APPROVE or REQUEST_CHANGES. Send message to orchestrator with verdict.
