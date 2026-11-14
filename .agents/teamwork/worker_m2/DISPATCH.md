# Task Assignment: Worker M2 — Mobile IA, Navigation & Business Command Dashboard

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\worker_m2\
- Role: Mobile Full-Stack Specialist (teamwork_worker)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read the blueprints authored by the M2 Explorers:
  - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\analysis.md` (Navigation, Safe Area & BackHandler blueprint)
  - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\analysis.md` (Dashboard transformation blueprint)
  - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md` (Global Search & Quick Actions blueprint)

## Write Ownership
You exclusively own:
- `mobile-app/src/navigation/RootNavigator.tsx`
- `mobile-app/src/components/Header.tsx`
- `mobile-app/src/screens/projects/ProjectsScreen.tsx` (DELETE THIS DEAD FILE)
- `mobile-app/src/screens/dashboard/DashboardScreen.tsx`
- `mobile-app/src/utils/rbac.ts` (CREATE)
- `mobile-app/src/components/GlobalSearchModal.tsx` (CREATE)
- `mobile-app/src/components/QuickActionsDispatcher.tsx` (CREATE)

## Tasks to Execute
1. Implement Navigation & Safe Area Updates (`explorer_m2_1`):
   - Update `mobile-app/src/navigation/RootNavigator.tsx`: dynamic bottom insets (`Math.max(insets.bottom, 8)`), active pill tab indicators, full theme integration, BackHandler with double-tap exit guard on Dashboard, route consolidation.
   - Update `mobile-app/src/components/Header.tsx`: replace lines 383-386 / 429-433 static status bar calculations with `useSafeAreaInsets().top` to eliminate notch/camera clipping on Android Edge-to-Edge. Add search icon button and profile modal `onRequestClose`.
   - Delete dead file `mobile-app/src/screens/projects/ProjectsScreen.tsx` (1,007 lines).
2. Implement Dashboard Transformation (`explorer_m2_2`):
   - Completely strip all fake fallback dummy data in `DashboardScreen.tsx` (`fallbackRecentLeads` / Ramesh Patil, `fallbackHorizonDataMap`, `fallbackInventoryRunway`, `fallbackSubsidyFunnel`, and hardcoded numbers like ₹84.6L and 37.1 kWp).
   - Use authorized API data from `tenantApi.getDashboard()`.
   - Wire compound `SkeletonLoader` (`SkeletonLoader.Card`, `SkeletonLoader.Text`, `SkeletonLoader`) during loading (`loading === true`).
   - Wire `EmptyState` primitives when query results are empty with actionable CTAs.
   - Wire human-readable error recovery with retry CTA.
   - Enforce `tabularNums` font stability and currency formatting.
3. Implement Global Search & Quick Actions (`explorer_m2_3`):
   - Create `mobile-app/src/utils/rbac.ts` with `hasPermission` utility.
   - Create `mobile-app/src/components/GlobalSearchModal.tsx` with multi-entity search (leads, projects, invoices, barcodes), 300ms debounce, category filtering tabs, `SafeStorage` recent search persistence, and direct navigation.
   - Create `mobile-app/src/components/QuickActionsDispatcher.tsx` role-gated bottom sheet.
   - Wire search trigger into `Header.tsx` and center FAB into `RootNavigator.tsx`.
4. Verification:
   - Run TypeScript check: `cmd /c "cd mobile-app && npx tsc --noEmit"`. Verify 0 errors.
   - Run perspective tests: `node mobile-app/test-perspectives.js`. Verify 23/23 tests pass.
   - Run E2E tests: `node mobile-app/test-e2e.js`. Verify 121/121 tests pass.

## Output Deliverable
Write your implementation report to:
`f:\Company Products\solar-manager\.agents\teamwork\worker_m2\implementation_report.md`
and write `handoff.md` in your working directory with build/test command logs. Maintain `progress.md`.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T08:49:07Z
You are Worker M2 (Mobile Full-Stack Specialist).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\worker_m2\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\worker_m2\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
Read blueprints:
- f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\analysis.md
- f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\analysis.md
- f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement navigation restructuring in RootNavigator.tsx, safe area insets fix in Header.tsx, delete ProjectsScreen.tsx, transform DashboardScreen.tsx (strip fake data, wire SkeletonLoader and EmptyState), and create GlobalSearchModal.tsx, QuickActionsDispatcher.tsx, and rbac.ts.
Verify TypeScript compilation (0 errors), test-perspectives.js (23/23), and test-e2e.js (121/121).
Write implementation_report.md and handoff.md in your working directory. Maintain progress.md.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
