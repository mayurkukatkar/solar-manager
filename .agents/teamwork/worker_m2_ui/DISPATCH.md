# Task Assignment: Milestone M2 — Design System & Shared UI Components Foundation

## Mission
Establish a coherent design system and centralized shared UI primitive components library in `web-client`, resolve responsive layout bugs (320px to 1920px), replace native browser `alert()` invocations with a non-blocking toast system, and eliminate all dead navigation links (404s).

## Mandatory Inputs to Read First
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)
- `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
- `f:\Company Products\solar-manager\docs\product-audit.md`
- `f:\Company Products\solar-manager\docs\architecture-and-dependencies.md`
- `f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_frontend\handoff.md`

## File Ownership
You exclusively own:
- `web-client/src/components/ui/` (create centralized UI primitives)
- `web-client/src/context/ToastContext.tsx`
- `web-client/src/app/globals.css` (design tokens, typography, colors)
- `web-client/src/app/tenant/layout.tsx` (wrap ToastProvider, navigation)
- `web-client/src/app/tenant/installation/schedule/page.tsx`
- `web-client/src/app/tenant/installation/calendar/page.tsx`
- `web-client/src/app/tenant/installation/checklists/page.tsx`
- `web-client/src/app/tenant/inventory/products/new/page.tsx`
- `web-client/src/app/tenant/quotations/new/page.tsx`
- `web-client/src/app/super-admin/security/page.tsx`
- `web-client/src/app/super-admin/profile/page.tsx`
- Refactoring `alert()` to `useToast()` in:
  - `web-client/src/app/tenant/finance/page.tsx`
  - `web-client/src/app/tenant/surveys/page.tsx`
  - `web-client/src/app/tenant/tasks/page.tsx`
  - `web-client/src/app/tenant/projects/[id]/page.tsx`
- Responsive modal forms (`grid-cols-1 sm:grid-cols-2`) in:
  - `web-client/src/app/tenant/leads/page.tsx`
  - `web-client/src/app/tenant/surveys/page.tsx`
- `web-client/next.config.ts` (remove `ignoreBuildErrors: true`)

## Detailed Requirements
1. **Centralized UI Primitives in `web-client/src/components/ui/`**:
   - `Button.tsx`: variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), loading spinner indicator, automatic double-click prevention (`disabled={isLoading}`).
   - `Input.tsx` & `Select.tsx`: label, error message, helper text, responsive full width.
   - `Modal.tsx`: accessible dialog with Escape key handling, backdrop click, scroll lock, mobile responsive sizing.
   - `Table.tsx`: responsive table container with built-in empty state and loading skeleton.
   - `Badge.tsx`: status badges (`success`, `warning`, `danger`, `info`, `neutral`).
   - `Card.tsx`: reusable container with header, content, footer slots.
   - `Toast.tsx` & `ToastContext.tsx`: toast notifications with auto-dismiss (3s), stacked rendering, accessible ARIA roles.
   - `EmptyState.tsx`: reusable empty state card with icon, title, description, and action button.
   - `Skeleton.tsx`: pulse animation placeholder loader.
2. **Standardize Design Tokens in `globals.css`**:
   - Consistent WhereReady branding: emerald primary (`#10b981`), gold accent (`#c5a059`), dark slate neutrals.
   - Harmonize typography to avoid duplicate font downloads.
3. **Resolve 404 Routes**:
   - Implement functional pages for:
     * `/tenant/installation/schedule`
     * `/tenant/installation/calendar`
     * `/tenant/installation/checklists`
     * `/tenant/inventory/products/new` (Add Product form/drawer)
     * `/tenant/quotations/new` (links or redirects to Quotation Wizard)
     * `/super-admin/security` (renders security overview and links to audit logs)
     * `/super-admin/profile` (renders super-admin profile settings)
4. **Replace `alert()` with Toasts**:
   - Replace every native browser `alert()` call in finance, surveys, tasks, and projects with `showToast({ type: 'error'|'success', message })`.
5. **Responsive Mobile Breakpoints (320px–1920px)**:
   - Ensure all modal forms use `grid-cols-1 sm:grid-cols-2` so inputs never get squeezed below 240px.
   - Touch targets must be at least 44x44px on mobile viewports.
6. **Strict Type Safety**:
   - Remove `typescript: { ignoreBuildErrors: true }` from `web-client/next.config.ts`.
   - Verify `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json` exits with 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\worker_m2_ui\`
Write your `progress.md` with liveness timestamps.
Write your final `handoff.md` report and send a message when complete.


## 2026-10-29T11:52:39Z
You are Worker M2 responsible for Milestone M2: Design System & Shared UI Components Foundation.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\worker_m2_ui\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\worker_m2_ui\DISPATCH.md before starting.
Implement the centralized UI primitives in web-client/src/components/ui/ (Button, Input, Select, Modal, Table, Badge, Card, Toast, ToastContext, EmptyState, Skeleton), resolve 404 routes, replace native alert() calls with toasts, fix mobile form grid responsiveness, remove ignoreBuildErrors from next.config.ts, and verify TypeScript clean compilation.
