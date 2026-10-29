## 2026-10-29T11:13:04Z

Operate as a coordinated senior product engineering team (combining Principal Software Architect, Senior Full-Stack Engineers, Product Manager, Solar Industry Domain Expert, Enterprise UI/UX Designer, Design Systems Engineer, QA and Automation Engineer, Application Security Engineer, SaaS Multi-Tenant Architect, Database and Performance Engineer, Accessibility Specialist, DevOps and Reliability Engineer, and Indian Business Workflow Specialist) to audit, redesign, improve, implement, test, and validate every existing module, page, workflow, component, integration, and user-facing interaction in the current WhereReady Solar OS codebase. The final result must be a cohesive, professional solar business management and operations SaaS for solar vendors, EPC companies, installers, and solar businesses.

Integrity mode: development

## Verification Resources
- Existing repository build, lint, type-check, and test scripts located in package manifests and configuration files across backend, frontend, web-client, and mobile-app packages.

## Requirements

### R1. Full Codebase Discovery, Baseline & Module Inventory (Phases 1 & 2)
Audit and map the entire existing codebase across backend, frontend, web-client, and mobile-app, inspecting repository structure, package manifests, API endpoints, routing, database schema, auth, sessions, tenant resolution, and all existing modules and submodules. Identify critical security, data integrity, financial calculation, and application stability risks. Create or update documentation artifacts in the repository: `docs/product-audit.md`, `docs/module-inventory.md`, `docs/architecture-and-dependencies.md`, `docs/implementation-roadmap.md`, and `docs/quality-and-regression-report.md`. Maintain a progress tracker covering every discovered module, assigned owner, status, changes, test results, and blockers.

### R2. Design System & Shared UI Components Foundation (Phase 3)
Establish a coherent visual identity and reusable design tokens (colors, typography, spacing, status styles, borders, elevation) respecting existing WhereReady branding. Improve application-wide navigation and standardize shared UI primitives and interactive controls (buttons, tables, forms, modals, drawers, toasts) across desktop and mobile viewports (320px to 1920px) before redesigning individual modules. Ensure purposeful loading, empty, error, and success states without superficial mockups or breaking business logic.

### R3. Dependency-Aware Batch Implementation & Coordination (Phases 4 & 5)
Implement module improvements in controlled, dependency-aware batches across all existing modules (CRM/Leads, Customers, Surveys, Quotations, Projects, Inventory/Procurement, Installation, Workforce, Finance/Invoicing/Payments, Service/Warranty, Reports, Settings, SaaS Admin). Assign parallel specialists only to independent workstreams. A lead integrator must coordinate shared files, database migrations, API contracts, and integration changes to prevent conflicting edits to shared files. Never replace real functionality with mockups, dummy data, or placeholder actions. Continue implementing improvements after the audit without stopping at recommendations, proceeding through implementation phases without waiting for approval for routine, reversible changes.

### R4. Cross-Module Workflows, Multi-Tenant Security & Controlled Safeguards (Phases 6 & 7)
Validate complete solar business journeys (Lead to Customer to Survey to Quotation to Project to Procurement to Installation to Invoicing/Payment to Service) with consistent state across linked entities. Enforce server-side role-based authorization and strict multi-tenant isolation on all tenant-scoped resources. Strictly adhere to execution safeguards: no destructive database migrations, no production data modification, no secret exposure, no breaking deployment changes without explicit authorization, and no connecting to live external services or production databases (local development and mock environments only).

### R5. Layered Testing, Regression Fixes & Final Evidence Reporting
Execute automated tests after each batch before proceeding; preserve existing functionality and resolve regressions immediately. Verify responsive layouts (320px to 1920px), financial decimal precision arithmetic, and security controls. Never claim tests or compliance checks passed unless actually executed and verified; mark blocked or unverified items honestly. Produce an evidence-based completion report detailing discovered/audited/verified module counts, module-level changes, design and technical improvements, test execution outcomes, remaining risks, and next steps.

## Acceptance Criteria

### Audit, Baseline & Progress Tracking
- [ ] Complete module inventory, dependency map, and risk baseline are documented in `docs/` (`product-audit.md`, `module-inventory.md`, `architecture-and-dependencies.md`, `implementation-roadmap.md`, `quality-and-regression-report.md`).
- [ ] A progress tracker is maintained recording every discovered module, assigned owner, implementation status, changes made, test results, and documented blockers.

### Design System & Component Foundation
- [ ] Shared design tokens for colors, typography, spacing, and semantic statuses are implemented and applied to shared components before individual module overhauls.
- [ ] Shared interactive components (tables, forms, dialogs, dropdowns, navigation) handle loading, empty, error, and success states without broken focus, clipping, or double submissions.
- [ ] Responsive layouts function cleanly across viewports from 320px mobile to 1920px desktop without horizontal overflow or clipped actions.

### Functional Implementation & Lead Coordination
- [ ] All discovered modules are audited and improved in dependency-aware batches without replacing real functionality with mockups or dummy data.
- [ ] No conflicting changes occur on shared files, coordinated through a designated lead integrator for shared schemas, migrations, and API contracts.
- [ ] Quotations, invoices, and payment calculations use decimal arithmetic with consistent tax, discount, and rounding rules.
- [ ] Cross-module solar workflows maintain consistent state across linked records without orphaned data or duplicate records on retries.

### Security, Multi-Tenancy & Safeguards
- [ ] Server-side authorization and multi-tenant isolation are verified on all tenant-scoped queries, mutations, background jobs, exports, and file downloads.
- [ ] No destructive database migrations, production data alterations, secret exposures, or live external database connections take place.

### Verification & Delivery Reporting
- [ ] Batch-level tests run cleanly before proceeding to subsequent batches, with regressions investigated and fixed immediately.
- [ ] Existing build, lint, type-check, and automated test commands pass with verified results; unverified or blocked items are explicitly marked.
- [ ] A final evidence-based completion report is delivered covering overall audit metrics, module-by-module changes, design/technical improvements, test outcomes, remaining risks, and next steps.
