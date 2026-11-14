# Task Assignment: Explorer M2-2 — Dashboard Transformation & Real Authorized Data Strategy

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\
- Role: Dashboard & State Specialist (teamwork_explorer)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read `docs/mobile-screen-inventory.md`, `docs/mobile-ux-problems.md`, and `docs/mobile-design-system.md`.
- Inspect `mobile-app/src/screens/dashboard/DashboardScreen.tsx` (1,690 lines) and `mobile-app/src/api/endpoints.ts` (`tenantApi.getDashboard`).

## Objective
Analyze and design the transformation blueprint for `DashboardScreen.tsx`:
1. Eliminate all fake fallback dummy data:
   - Identify and strip `fallbackRecentLeads` (lines 277-320: `Ramesh Patil`, `Suresh Deshmukh`, etc.).
   - Strip hardcoded `fallbackSubsidyFunnel` and fake `fallbackHorizonDataMap`.
   - Ensure the screen renders 100% authorized operational data from `tenantApi.getDashboard()`.
2. Application State Designs:
   - Wire `SkeletonLoader` compound components (`SkeletonLoader.Card`, `SkeletonLoader.Text`) when `loading === true`, replacing raw indicators and fixing the bug where dummy data renders before API queries settle.
   - Wire `EmptyState` when query results are empty (e.g. no active projects or leads yet), with clear primary action CTA (e.g. "Create First Lead").
   - Implement human-readable error state with retry action button.
3. Role-Personalized Operational Visibility:
   - Adapt KPI widgets and operational horizon cards based on `user.role` (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_SUB_ADMIN`) and permissions.
   - Design metrics display with tabular numerals (`tabularNums`) and currency formatters (`formatInr`).
4. Provide exact code diffs and drop-in implementations for Worker M2.

## Output Deliverable
Write your findings to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\analysis.md`
and write `handoff.md` in your working directory. Maintain `progress.md`.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T08:33:04Z
[Message] timestamp=2026-10-30T08:33:04Z sender=94d7f2ae-468d-438a-8f95-fa253185584b priority=MESSAGE_PRIORITY_HIGH
content=You are Explorer M2-2 (Dashboard & State Specialist).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md

Analyze and blueprint the transformation of DashboardScreen.tsx: stripping fake fallback data (Ramesh Patil), integrating SkeletonLoader and EmptyState, role-based KPI customization, and tabular numerals.
Write your findings to: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\analysis.md
Write handoff.md in your working directory. Maintain progress.md.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
