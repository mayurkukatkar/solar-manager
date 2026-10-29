## 2026-10-29T13:34:56Z
You are Challenger M4 (Milestones M4 Challenger) for the WhereReady Solar OS Master Audit, Redesign & Engineering Program.
Your working directory is: f:\Company Products\solar-manager\.agents\teamwork\challenger_m4\

MANDATORY FIRST STEP: Read the following authoritative files:
1. f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
2. f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
3. f:\Company Products\solar-manager\.agents\teamwork\worker_m4\handoff.md

## Scope of Adversarial Verification
Empirically stress-test the changes introduced in Milestone M4:
1. **7-Stage Project State Machine Transitions**:
   - Test canonical forward transitions: `SURVEY_COMPLETED` → `STRUCTURE_APPROVED` → `MATERIAL_DISPATCHED` → `INSTALLATION_STARTED` → `TESTING_COMPLETED` → `NET_METER_APPLIED` → `COMMISSIONED`.
   - Test illegal skips: `SURVEY_COMPLETED` → `COMMISSIONED`, `STRUCTURE_APPROVED` → `NET_METER_APPLIED`, `MATERIAL_DISPATCHED` → `TESTING_COMPLETED`. Verify HTTP 400 rejection on all invalid jumps.
   - Test backward compatibility with legacy stage names (`Planning`, `Installation`, `Completed`).
2. **Idempotent 1-Click Lead & Quotation Conversions**:
   - Stress-test rapid duplicate requests to `POST /api/tenant/leads/:id/convert` and `POST /api/tenant/quotations/:id/convert`.
   - Verify that calling convert multiple times returns the same entity without creating duplicate Customer, Project, or BOM entries.
   - Verify empty body payloads do not crash the server (`req.body || {}`).
3. **Statutory Form Generator & Leak Prevention**:
   - Verify that generated documents pull dynamically from customer/tenant profiles and never output hardcoded fallback names ("SHRI. SURENDRA RAMBHAU THAKRE", "EKVARTA ENERGY SOLUTIONS").
4. **Dashboard Zero-Data Integrity**:
   - Verify that empty API responses render `@/components/ui/EmptyState` and never render synthetic fallback charts or mock figures.

## Verification Execution
Run and verify automated tests:
1. `node --test backend/test/m4CommercialOps.test.js`
2. `node --test backend/test/m3SecurityAndPrecision.test.js`
3. `node --test backend/test/e2e/*.test.js`
4. Create and run any additional adversarial stress-test scripts if needed (e.g. `backend/test/m4AdversarialChallenges.test.js`).

## Output & Handoff
Update `progress.md` during execution.
When complete, write `handoff.md` in `f:\Company Products\solar-manager\.agents\teamwork\challenger_m4\handoff.md` containing:
1. Observation (empirical challenge test results, matrices, edge cases tested)
2. Logic Chain (analysis of empirical behavior under stress)
3. Caveats (limitations, assumptions)
4. Conclusion (summary and EXPLICIT VERDICT: `APPROVE` or `REQUEST_CHANGES`)
5. Verification Method (exact commands executed and verbatim output)
Then notify the orchestrator via send_message.
