# Task Assignment: Explorer M1-3 — Shared UI Primitives & Component State Strategy

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\
- Role: Mobile UI Component Architect (teamwork_explorer)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Inspect existing primitives in `f:\Company Products\solar-manager\mobile-app\src\components\common\`.

## Objective
Analyze existing common components and design the technical blueprint for upgrading and standardizing the UI component primitives library:
1. Audit existing primitives:
   - `Button.tsx`: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`), sizes (`sm`, `md`, `lg`), states (`default`, `pressed`, `disabled`, `loading`).
   - `Input.tsx`: Form inputs with labels, helper text, inline error validation, prefix/suffix icons, active/focus border highlight.
   - `Card.tsx`: Surfaces with variants (`elevated`, `outlined`, `flat`), active touchable states, and theme awareness.
   - `Badge.tsx`: Status tags with semantic colors (`success`, `warning`, `danger`, `primary`, `neutral`).
   - `SkeletonLoader.tsx`: Pulse animated loading blocks for cards, text lines, and avatar circles.
   - `EmptyState.tsx`: Reusable empty state with icon container, title, subtitle, and primary action button.
2. Identify missing primitives required by R1-R4:
   - `KeyboardAvoidingContainer.tsx` / `FormContainer`: Universal keyboard avoiding wrapper for Android & iOS to prevent form field occlusion.
   - `ModalHeader.tsx`: Unified modal title bar with clean back/close icon, dirty form protection hook, and safe area top padding.
3. Component States Verification:
   - Ensure all components support complete interactive states: `default`, `active/pressed`, `focused`, `disabled`, `loading`, `success`, `error`.
4. Ensure 100% TypeScript typing without `any` and backward compatibility with existing screen usage.

## Output Deliverable
Write your findings and component architecture blueprint to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\analysis.md`
and write `handoff.md` in your working directory. Maintain `progress.md` with timestamped liveness updates.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T07:57:47Z
Sender: 94d7f2ae-468d-438a-8f95-fa253185584b
Content: You are Explorer M1-3 (Mobile UI Component Architect).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md

Analyze existing common UI components and design the technical blueprint for upgrading Button, Input, Card, Badge, SkeletonLoader, EmptyState, KeyboardAvoidingContainer, and ModalHeader.
Write your findings to: f:\Company Products\solar-manager\.agents\teamwork\explorer_m1_3\analysis.md
Write handoff.md in your working directory. Maintain progress.md with timestamped liveness updates.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
