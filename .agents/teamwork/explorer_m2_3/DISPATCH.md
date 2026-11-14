# Task Assignment: Explorer M2-3 — Authorized Global Search & Quick Actions Modal Strategy

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\
- Role: Mobile Search & Interaction Architect (teamwork_explorer)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read `docs/mobile-screen-inventory.md`, `docs/mobile-ux-problems.md`, and `docs/mobile-design-system.md`.
- Inspect `mobile-app/src/components/Header.tsx` (search icon) and `mobile-app/src/api/endpoints.ts`.

## Objective
Analyze and design the technical blueprint for Authorized Global Search & Quick Actions:
1. Global Search Architecture:
   - Design `GlobalSearchModal.tsx` launched from Header search icon.
   - Unified search input with debounce (300ms) and clear button using `Input` primitive.
   - Authorized multi-entity search across Leads, Projects, Invoices, and Barcodes/Serials, filtering based on `user.permissions`.
   - Results list with entity badges, direct navigation via `navigationRef`, empty search state, and recent search history stored in `AsyncStorage`.
2. Quick Actions Dispatcher:
   - Ergonomic quick action menu / center FAB integration:
     - "New Lead" -> opens `LeadCaptureModal`
     - "Quick Quote" -> navigates to `QuickQuoteScreen`
     - "Scan Hardware" -> opens `BarcodeScannerModal`
     - "Record Payment" -> opens `CreateInvoiceModal` / Payment recording
   - Role-gate actions: check permissions before rendering action items.
3. Provide exact code diffs and drop-in implementations for Worker M2.

## Output Deliverable
Write your findings to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md`
and write `handoff.md` in your working directory. Maintain `progress.md`.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T08:33:12Z
You are Explorer M2-3 (Mobile Search & Interaction Architect).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md

Analyze and blueprint the Authorized Global Search Modal (GlobalSearchModal.tsx) and Quick Actions Dispatcher.
Write your findings to: f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md
Write handoff.md in your working directory. Maintain progress.md.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
