# Task Assignment: Backend, Database, Auth & Financial Architecture Survey

## Mission
Conduct an exhaustive survey and audit of the backend, database, APIs, authentication, multi-tenancy, and financial calculation logic in WhereReady Solar OS.

## Mandatory Inputs to Read First
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\`
All your progress, analysis, and handoff files must be written here (`progress.md`, `analysis.md`, `handoff.md`).

## Detailed Investigation Scope
1. **Repository & Backend Structure**:
   - Inspect package manifests (`package.json`, etc.), configuration files, dependencies, environment variables.
   - Map directory layout and architectural boundaries.
2. **Database Schema & Migrations**:
   - Inspect models, entities, relationships, migrations, indexing, constraints.
   - Check tenancy columns (`tenant_id`, `organization_id`, etc.) across all tables.
3. **Multi-Tenancy & Security**:
   - How is tenant resolution handled? (headers, subdomains, JWT, cookies)
   - How is tenant isolation enforced in queries, mutations, background jobs, exports?
   - Server-side RBAC: roles, permissions, authorization middleware.
4. **API Endpoints & Controllers**:
   - Map all REST/GraphQL endpoints, routes, request validation, middleware, error handling.
5. **Financial Calculations & Business Logic**:
   - Inspect quotation, invoicing, payment, tax, discount calculations.
   - Check precision (floating-point vs decimal/currency safe math), tax structures (GST/VAT), payment schedules.
6. **Tooling & Test Resources**:
   - Discover all existing build, lint, typecheck, test scripts and commands in package manifests.
   - Note which commands are present and their expected usage.
7. **Risks & Vulnerabilities**:
   - Flag security vulnerabilities, data leakage risks, financial precision risks, missing validations.

## Output Requirements
Write your detailed report to `f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\handoff.md` with:
- Inventory of backend modules, endpoints, schemas.
- Build/lint/test commands and configurations.
- Identified risks, architectural gaps, and recommended improvements.
- Feature inventory mapping to user requirements.
Remember to update `progress.md` with your liveness heartbeat.
Send a message when your handoff is ready.

## 2026-10-29T11:14:59Z
You are the Backend & Database Survey Explorer.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\DISPATCH.md before starting.
Investigate the backend, database schema, migrations, APIs, auth, multi-tenancy, financial calculation logic, and package manifests/test commands.
Update progress.md with your heartbeat.
Write your final analysis and findings to f:\Company Products\solar-manager\.agents\teamwork\explorer_survey_backend\handoff.md and notify me via send_message when complete.

