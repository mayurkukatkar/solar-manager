# Task Assignment: Explorer M1-2 — Theme Tokens & Dark Theme Implementation Strategy

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\
- Role: Design Systems & Theme Architect (teamwork_explorer)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read `f:\Company Products\solar-manager\mobile-app\src\theme\colors.ts` and `tokens.ts`.

## Objective
Analyze the current theme implementation and blueprint the exact code changes needed in `mobile-app/src/theme/`:
1. Design tokens expansion:
   - Preserving WhereReady branding (`#0066FF` Electric Blue, `#f59e0b` Solar Amber, `#0b192c` Deep Navy) with full semantic statuses (`success`, `warning`, `danger`, `info`) in both light and dark modes.
   - Formal dark theme color palette with appropriate surface elevations (`surface`, `surfaceElevated`, `borderSubtle`, `textSecondary`, etc.).
   - 4-point spacing scale (4px to 64px).
   - Corner radii hierarchy (`xs` through `full`).
   - Shadows / elevations for both Android elevation and iOS shadow properties.
2. Typography & Tabular Numerals:
   - Type scale with weights and letter spacing.
   - Universal helper for tabular numerals: `fontVariant: ['tabular-nums']` for all currency amounts, system capacities (kW), and metrics.
3. Theme Provider & Hook Architecture:
   - Create/refactor `ThemeProvider.tsx` and `useTheme()` hook supporting light, dark, and system default with persistent theme switching via AsyncStorage.
   - Backward compatibility so existing screens importing `colors` or `tokens` directly do not break immediately while transitioning.

## Output Deliverable
Write your findings and implementation blueprint to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\analysis.md`
and write `handoff.md` in your working directory. Maintain `progress.md` with timestamped liveness updates.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).

## 2026-10-30T07:57:19Z
You are Explorer M1-2 (Design Systems & Theme Architect).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md

Analyze and blueprint the theme token expansion, dark theme palette, tabular numerals, ThemeProvider, and useTheme hook.
Write your findings to: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_2\analysis.md
Write handoff.md in your working directory. Maintain progress.md with timestamped liveness updates.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
