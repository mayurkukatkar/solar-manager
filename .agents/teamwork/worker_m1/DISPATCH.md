# Task Assignment: Worker M1 — Documentation, Design System Tokens & Shared UI Primitives

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\worker_m1\
- Role: Mobile Implementation Specialist (teamwork_worker)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read the blueprints authored by the M1 Explorers:
  - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_1\analysis.md` (Docs blueprint)
  - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\analysis.md` (Theme & tokens blueprint)
  - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\analysis.md` (UI primitives blueprint)

## Write Ownership
You exclusively own and are authorized to create/modify:
- `docs/mobile-product-audit.md`
- `docs/mobile-screen-inventory.md`
- `docs/mobile-ux-problems.md`
- `docs/mobile-design-system.md`
- `mobile-app/src/theme/*` (`colors.ts`, `tokens.ts`, `ThemeProvider.tsx`, `useTheme.ts`, `index.ts`)
- `mobile-app/src/components/common/*` (`Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `SkeletonLoader.tsx`, `EmptyState.tsx`, `KeyboardAvoidingContainer.tsx`, `ModalHeader.tsx`, `index.ts`)
- `mobile-app/src/components/Header.tsx` (re-export `ModalHeader` for backward compatibility)
- `mobile-app/App.tsx` (wrap with `<ThemeProvider>`)
- `mobile-app/app.json` (set `"userInterfaceStyle": "automatic"`)

You must NOT modify backend code or break existing API contracts.

## Tasks to Execute
1. Author the 4 authoritative documentation files in `/docs/` with complete, exhaustive technical detail matching `explorer_m1_1/analysis.md`:
   - `/docs/mobile-product-audit.md`
   - `/docs/mobile-screen-inventory.md`
   - `/docs/mobile-ux-problems.md`
   - `/docs/mobile-design-system.md`
2. Implement theme tokens and ThemeProvider in `mobile-app/src/theme/`:
   - Implement `ThemeColors`, `lightColors`, `darkColors`, backward-compatible `colors` alias.
   - Implement hybrid `spacing`, `tabularNums` helper, radii, typography, dark shadows.
   - Implement `ThemeProvider.tsx` with AsyncStorage preference persistence (`@whereready_theme_mode`) and React Navigation theme integration.
   - Implement `useTheme.ts` hook.
   - Update `app.json` to `"userInterfaceStyle": "automatic"` and wrap `App.tsx` with `<ThemeProvider>`.
3. Standardize and upgrade shared UI primitives in `mobile-app/src/components/common/`:
   - Upgrade `Button.tsx` (Pressable, ripple, states, touch target >= 48dp).
   - Upgrade `Input.tsx` (forwardRef, clear button, password toggle, success state, tabularNums).
   - Upgrade `Card.tsx` (Pressable ripple, elevation clipping fix, theme awareness).
   - Upgrade `Badge.tsx` (semantic tokens, dot mode, pulse, sizes).
   - Upgrade `SkeletonLoader.tsx` (pulse loop, compound components: Text, Circle, Card, zero `any`).
   - Upgrade `EmptyState.tsx` (semantic tones, secondary action, accessibility).
   - Create `KeyboardAvoidingContainer.tsx` (universal keyboard avoidance for forms).
   - Create `ModalHeader.tsx` (with `useDirtyFormWarning` hook, clean dismiss, safe area).
   - Update `components/Header.tsx` to re-export `ModalHeader` so existing screens do not break.
4. Verification:
   - Run TypeScript typecheck: `cmd /c "cd mobile-app && npx tsc --noEmit"`. Verify 0 errors.
   - Run perspective tests: `node mobile-app/test-perspectives.js`. Verify 23/23 tests pass.

## Output Deliverable
Write your implementation report to:
`f:\Company Products\solar-manager\.agents\teamwork\worker_m1\implementation_report.md`
and write `handoff.md` in your working directory with build/test command logs. Maintain `progress.md` with timestamped liveness updates.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).

## 2026-10-30T08:06:29Z
[Message] timestamp=2026-10-30T08:06:29Z sender=94d7f2ae-468d-438a-8f95-fa253185584b priority=MESSAGE_PRIORITY_HIGH content=You are Worker M1 (Mobile Implementation Specialist).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\worker_m1\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\worker_m1\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
Read blueprints:
- f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_1\analysis.md
- f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\analysis.md
- f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement the 4 authoritative documentation files in /docs/, the theme system in mobile-app/src/theme/, and the shared UI primitives in mobile-app/src/components/common/.
Run and verify TypeScript type checking (0 errors) and test-perspectives.js (23/23 tests pass).
Write implementation_report.md and handoff.md in your working directory. Maintain progress.md with timestamped liveness updates.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
