# Task Assignment: Spec Miner 3 — API Contracts, Roles/RBAC & Business Domain Requirements

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\
- Role: Domain & API Spec Miner (teamwork_spec_miner)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` completely before starting.

## Objective
Investigate the codebase to extract exact domain requirements, business specifications, API contracts, and security/role models:
1. API endpoints & contracts: Inspect all API client services, queries, mutations, request/response schemas, DTOs, backend contracts, and error responses used by the mobile app.
2. Role-Based Access Control (RBAC): Enumerate all user roles (e.g. Admin, EPC Contractor, Sales Agent, Installer/Technician, Inventory Manager, Customer) and the authorized views, actions, and data access rules for each role.
3. Domain workflows & entity lifecycles:
   - Leads / CRM: Lead stages, conversion, assignment, customer details, follow-ups
   - Project Management: Milestones, stages (Survey, Design, Net Metering, Procurement, Installation, Commissioning), project timeline, status tracking
   - Inventory Management: Stock tracking, solar panels, inverters, batteries, BOS items, allocation, warehouse transfers
   - Installation Management: Technician assignments, site visits, checklists, photo capture/uploads, commissioning
   - Staff Management: Role assignment, team member directory, task assignments, activity logs
   - Financial & Payment: Invoicing, quotations, payment milestones, receipts, EPC cost tracking
4. Data integrity & constraints: Ensure we identify all backend constraints to strictly avoid breaking API contracts or introducing mock/dummy data.

## Output Deliverable
Write your findings to:
`f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\survey_report.md`
and write `handoff.md` with:
- Complete API Contract catalog (Endpoints, Methods, Payload/Params, Response Schemas, Error formats)
- RBAC Matrix (Roles x Modules/Screens x Actions)
- Domain Entity Schemas & Lifecycle rules
- Edge case specifications (offline sync, token expiration, network timeouts, concurrent updates)
- Liveness updates to your `progress.md`

Notify the orchestrator with send_message when complete.

## 2026-10-30T07:41:33Z
From: 94d7f2ae-468d-438a-8f95-fa253185584b
You are Spec Miner 3 (Domain & API Spec Miner).
Your working directory is: f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\
Please read your instructions at: f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\DISPATCH.md
and read the original request at: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md

Investigate API contracts, endpoints, DTOs, schemas, RBAC permissions, and domain entity workflows (Leads, Projects, Inventory, Installation, Staff, Finance).
Write your detailed report to: f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_3\survey_report.md
and write handoff.md in your working directory. Maintain progress.md with timestamped liveness updates.
When finished, send a message to the orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b) with a summary and path to your handoff.md.

## 2026-10-30T07:53:41Z
From: 94d7f2ae-468d-438a-8f95-fa253185584b
**Context**: Phase 0 Codebase & Domain Survey
**Content**: Explorer 1 and Explorer 2 have completed and submitted their handoff reports. We see from your progress.md that you completed your codebase inspection and are compiling survey_report.md and handoff.md.
**Action**: Please report your current compilation status or notify us once survey_report.md and handoff.md are written.
