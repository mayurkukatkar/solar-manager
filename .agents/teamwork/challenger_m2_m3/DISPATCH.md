# Task Assignment: Milestones M2 & M3 Challenger

## Mission
Adversarially challenge and stress-test the changes introduced in Milestone M2 (UI & Design System) and Milestone M3 (Security, Tenancy & Financial Hardening).

## Mandatory Inputs to Read First
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)
- `f:\Company Products\solar-manager\.agents\teamwork\worker_m2_ui\handoff.md`
- `f:\Company Products\solar-manager\.agents\teamwork\worker_m3_security\handoff.md`

## Challenge Scope
1. **Adversarial Security Test**:
   - Attempt cross-tenant mutation of `ProjectTask`, `ProjectMilestone`, `ProjectMaterialRequirement`, or `ServiceVisit` using Tenant B token against Tenant A project ID. Confirm rejection (HTTP 404).
   - Test unauthenticated request to `/api/tenant/ocr/scan-bill` and `/fetch-consumer`. Confirm rejection (HTTP 401).
   - Test JWT decoding for `req.user.id` and self-protection deletion in `users.js`.
2. **Adversarial Financial Math Test**:
   - Run multi-rate GST discount scenario (Section 15(3) CGST Act): verify tax is strictly computed on discounted taxable base.
   - Run 1,000 integer values through `generateMilestones`: confirm 0% milestone rounding drift.
3. **Adversarial Frontend & Route Test**:
   - Verify all 7 route files exist and compile without Next.js errors.
   - Verify zero `alert()` calls remain in refactored files.
4. Run full test suites:
   - `node --test backend/test/m3SecurityAndPrecision.test.js`
   - `node --test web-client/test/ui-components.test.mjs`
   - `node --test "backend/test/e2e/*.test.js"`
5. Provide explicit verdict: `APPROVE` or `REJECT`.

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\challenger_m2_m3\`
Write your `handoff.md` and notify orchestrator via `send_message`.


## 2026-10-29T12:17:23Z
You are Challenger for Milestones M2 & M3.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\challenger_m2_m3\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\challenger_m2_m3\DISPATCH.md before starting.
Empirically challenge and stress-test:
1. Child entity cross-tenant mutations (verify 404 rejection).
2. Unauthenticated OCR access (verify 401 rejection).
3. Section 15(3) CGST Act trade discount math across multi-rate lines.
4. Milestone rounding drift across 1,000 totals (verify 0% drift).
5. 7 new Next.js routes and removal of native alert calls.
Run test suites: backend/test/m3SecurityAndPrecision.test.js, web-client/test/ui-components.test.mjs, and backend/test/e2e/*.test.js.
Update progress.md with your liveness heartbeat.
Write your final challenge report with an explicit verdict (APPROVE or REJECT) to f:\Company Products\solar-manager\.agents\teamwork\challenger_m2_m3\handoff.md and notify me via send_message when complete.


## 2026-10-29T12:31:10Z
**Context**: Milestones M2 & M3 Empirical Verification
**Content**: Please provide a status update on your empirical challenge runs (child entity tenancy, OCR auth, GST math, milestone drift, Next.js routes, test executions) and estimated time to handoff.
**Action**: Reply with your current progress and ETA for handoff.md.
