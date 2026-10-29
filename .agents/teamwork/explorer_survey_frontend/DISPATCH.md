# Task Assignment: Frontend, Web-Client, Design System & UI Survey

## Mission
Conduct an exhaustive survey and audit of the frontend, web-client, UI components, routing, design tokens, and user experience in WhereReady Solar OS.

## Mandatory Inputs to Read First
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_frontend\`
All your progress, analysis, and handoff files must be written here (`progress.md`, `analysis.md`, `handoff.md`).

## Detailed Investigation Scope
1. **Frontend Architecture & Dependencies**:
   - Inspect web-client/frontend package manifests (`package.json`, framework configs like Vite/Next/React/Tailwind, etc.).
   - Map directory layout, routing hierarchy, state management, API client layer.
2. **Design System & Styling**:
   - Inspect existing design tokens (colors, typography, spacing, shadows, borders, status badges).
   - Evaluate WhereReady branding elements and consistency.
   - Audit shared UI primitives: buttons, tables, forms, inputs, modals/dialogs, drawers, toasts, dropdowns.
3. **UX & State Quality Audit**:
   - Audit loading states, empty states, error states, and success notifications across all existing pages/views.
   - Check responsive design behavior across viewport widths (320px mobile to 1920px desktop).
   - Check for clipped actions, horizontal overflow, keyboard focus traps, double submission vulnerabilities.
4. **Existing Views & Pages Inventory**:
   - Catalog every existing page, dashboard, tab, form, and modal across all business modules (CRM/Leads, Customers, Surveys, Quotations, Projects, Inventory, Installation, Workforce, Finance, Service, Reports, Settings, SaaS Admin).
5. **Tooling & Test Resources**:
   - Discover all existing frontend build, lint, typecheck, and test scripts in package manifests.
6. **Risks & UI/UX Gaps**:
   - Identify broken layouts, missing error boundaries, mock/placeholder UI elements, accessibility issues.

## Output Requirements
Write your detailed report to `f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_frontend\handoff.md` with:
- Inventory of frontend modules, pages, routes, and shared components.
- Design token analysis and standardization requirements.
- Build/lint/test commands and configurations.
- Identified UI/UX gaps, responsive risks, and recommended improvements.
- Feature inventory mapping to user requirements.
Remember to update `progress.md` with your liveness heartbeat.
Send a message when your handoff is ready.


## 2026-10-29T11:15:06Z
[Message] timestamp=2026-10-29T11:15:06Z sender=ad2f5e64-da78-454d-ba4a-3ebeb2c3f34b priority=MESSAGE_PRIORITY_HIGH content=You are the Frontend & UI Survey Explorer.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_frontend\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_frontend\DISPATCH.md before starting.
Investigate the frontend, web-client packages, routing, views/pages inventory, design system/tokens, WhereReady branding, UI components, states (loading/empty/error), responsive layout (320px-1920px), and build/lint/test commands.
Update progress.md with your heartbeat.
Write your final analysis and findings to f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_frontend\handoff.md and notify me via send_message when complete.
