# Task Assignment: Mobile App, End-to-End Solar Business Workflows & Specification Mining

## Mission
Conduct an exhaustive specification mining and audit of the mobile app, field operations, cross-module solar business workflows, and external integrations in WhereReady Solar OS.

## Mandatory Inputs to Read First
- `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (read completely before starting)

## Working Directory
`f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_mobile_workflows\`
All your progress, analysis, and handoff files must be written here (`progress.md`, `analysis.md`, `handoff.md`).

## Detailed Investigation Scope
1. **Mobile Application Architecture**:
   - Inspect mobile-app packages (React Native, Flutter, Kotlin/Android, etc.), package manifests, navigation, and state.
   - Audit mobile views, offline sync/caching, location/GPS capture for site surveys, camera/photo uploads.
2. **Complete Solar Business Workflows**:
   - Trace the end-to-end solar operational lifecycle across entities:
     * Lead Capture -> Qualification -> Site Survey (roof dimensions, shading, electrical setup)
     * Survey Data -> System Sizing & BOM -> Quotation Generation & Revision -> Proposal/Approval
     * Customer Conversion -> Project Initiation -> Procurement/Inventory Allocation -> Installation Milestones
     * Quality Inspection/Commissioning -> Grid Connection/Net Metering -> Invoicing & Milestone Payments
     * Warranty Registration -> AMC/O&M Service Tickets -> Customer Portal/Monitoring
   - Audit data linkage: verify foreign keys, state consistency, status transitions, prevention of duplicate or orphaned records.
3. **Indian Solar Market & Business Workflow Specifics**:
   - Discom/net metering workflow support, subsidy processing (PM Surya Ghar / MNRE guidelines), GST invoicing (5%/12%/18% splits or composite rates), payment schedules (advance, delivery, completion).
4. **Tooling & Build/Test Resources**:
   - Discover all existing mobile/integration build, lint, typecheck, and test scripts in package manifests.
5. **Gaps & Failure Modes**:
   - Identify broken workflow transitions, unhandled edge cases, missing data validations, or offline desync issues.

## Output Requirements
Write your detailed report to `f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_mobile_workflows\handoff.md` with:
- Specification inventory of all solar lifecycle workflows, state machines, and entity linkages.
- Mobile application inventory, build/test scripts, and field operational capabilities.
- Identified workflow gaps, edge cases, and Indian solar industry workflow requirements.
- Feature inventory mapping to user requirements.
Remember to update `progress.md` with your liveness heartbeat.
Send a message when your handoff is ready.


## 2026-10-29T11:15:11Z
You are the Mobile & Workflows Spec Miner.
Your working directory is f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_mobile_workflows\
Read f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md and your dispatch file at f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_mobile_workflows\DISPATCH.md before starting.
Investigate the mobile app packages, cross-module solar business journeys (Lead -> Customer -> Survey -> Quotation -> Project -> Procurement -> Installation -> Invoicing/Payment -> Service), data linkage/state transitions, Indian solar business workflows (Discom, subsidies, GST splits), and build/lint/test commands.
Update progress.md with your heartbeat.
Write your final analysis and findings to f:\Company Products\solar-manager\.agents\teamwork\spec_miner_survey_mobile_workflows\handoff.md and notify me via send_message when complete.
