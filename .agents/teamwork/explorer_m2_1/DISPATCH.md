# Task Assignment: Explorer M2-1 — Navigation, Safe Area & Android Hardware Back Strategy

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\
- Role: Navigation & Mobile System Architect (teamwork_explorer)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read `docs/mobile-screen-inventory.md`, `docs/mobile-ux-problems.md`, and `docs/mobile-design-system.md`.
- Inspect `mobile-app/src/navigation/RootNavigator.tsx` and `mobile-app/src/components/Header.tsx`.

## Objective
Analyze and design the technical blueprint for:
1. Reconciling `RootNavigator.tsx`:
   - Bottom tab navigation ergonomics: active tab indicators with theme tokens (`useTheme()`), tab label styling, safe area insets at bottom for Android Edge-to-Edge.
   - Android hardware back button handler integration: handling back navigation gracefully across tabs, preventing accidental app exit, and coordinating with modal screens.
   - Clean up dead code: Safely retire/delete unreferenced `mobile-app/src/screens/projects/ProjectsScreen.tsx` (1,007 lines) and consolidate CRM routing to `PipelineScreen.tsx`.
2. Fixing `mobile-app/src/components/Header.tsx`:
   - Replace lines 429-433 manual `topSafeArea = Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36) : 50;` with `useSafeAreaInsets().top` to eliminate status bar and camera punch-hole clipping on modern Android devices with `edgeToEdgeEnabled=true`.
3. Provide exact code diffs and drop-in implementations for Worker M2.

## Output Deliverable
Write your findings to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\analysis.md`
and write `handoff.md` in your working directory. Maintain `progress.md`.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).

## 2026-10-30T08:32:58Z
You are Explorer M2-1 (Navigation & Mobile System Architect).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md

Analyze and blueprint the navigation restructuring in RootNavigator.tsx, safe area insets fix in Header.tsx, Android BackHandler, and dead code removal (ProjectsScreen.tsx).
Write your findings to: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_1\analysis.md
Write handoff.md in your working directory. Maintain progress.md.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).

## 2026-10-30T08:43:16Z
**Context**: Milestone M2 Navigation & Safe Area Investigation
**Content**: Explorer M2-2 and Explorer M2-3 have completed and submitted their handoff reports. We see from your progress.md that you completed your inspections of RootNavigator, Header, BackHandler, and dead code removal, and are drafting analysis.md and handoff.md.
**Action**: Please notify us when analysis.md and handoff.md are ready.
