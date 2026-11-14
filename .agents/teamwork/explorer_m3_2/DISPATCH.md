## 2026-10-30T09:22:28Z
You are Explorer M3-2 (CRM, Pipeline & Quotation Architecture Explorer) for Milestone M3: End-to-End Module, Screen & Workflow Transformation.

## Working Directory
`.agents/teamwork/explorer_m3_2/`

## Context & Inputs
1. Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory user intent).
2. Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
3. Inspect:
   - `mobile-app/src/screens/crm/PipelineScreen.tsx`
   - `mobile-app/src/screens/crm/LeadCaptureModal.tsx`
   - `mobile-app/src/screens/crm/QuotationBuilderModal.tsx`
   - `mobile-app/src/screens/crm/CustomerOnboardingModal.tsx`
   - `mobile-app/src/screens/crm/QuickQuoteScreen.tsx`
   - UI primitives in `mobile-app/src/components/common/` (`Input`, `Button`, `KeyboardAvoidingContainer`, `Card`, `Badge`, `EmptyState`, `SkeletonLoader`)
   - `useDirtyFormWarning` in `mobile-app/src/components/Header.tsx`

## Exploration Objectives
1. **Pipeline & CRM Lead Management (`PipelineScreen.tsx`)**:
   - Analyze Kanban stage filter chips (NEW, CONTACTED, SITE_SURVEY, QUOTATION_SENT, NEGOTIATION, WON, LOST).
   - Evaluate lead card information density, touch targets (≥48x48), status badges, quick call/WhatsApp triggers.
   - Inspect loading skeletons, empty states for empty stages, and pull-to-refresh.
2. **Lead Capture Form (`LeadCaptureModal.tsx`)**:
   - Wrap forms with `KeyboardAvoidingContainer` to prevent keyboard obstruction.
   - Attach `useDirtyFormWarning` / `isDirty` protection against accidental dismissal.
   - Ensure native phone/numeric keyboards, postal code validation (6-digit Indian PIN code), and source attribution.
3. **Quick Quote Sizing Engine (`QuickQuoteScreen.tsx`)**:
   - Verify dynamic ALMM solar module database selection (e.g. 540W Mono PERC, 550W TopCon).
   - Verify calculation logic: monthly electricity bill vs sanctioned load sizing, benchmark pricing, payback period.
4. **Dynamic Quotation Builder (`QuotationBuilderModal.tsx`)**:
   - Dynamic BOM breakdown: Solar modules + Inverter + Structure + BOS + Installation.
   - Statutory 13.8% composite solar GST calculation (70% goods @ 12% + 30% services @ 18%).
   - WhatsApp proposal pitch copy generator with customized customer name, kWp, and subsidy eligibility.
5. **Customer Onboarding Wizard (`CustomerOnboardingModal.tsx`)**:
   - Multi-step onboarding stepper (Personal details -> Site details -> KYC Aadhaar/PAN validation -> DISCOM consumer number).
   - Unsaved changes protection and form validation.
6. Produce a detailed technical blueprint with code changes, line references, and testing strategy for Worker M3.

## Output Requirements
- Write your analysis to `.agents/teamwork/explorer_m3_2/analysis.md`.
- Write your handoff to `.agents/teamwork/explorer_m3_2/handoff.md` with sections: Observation, Logic Chain, Caveats, Conclusion, Verification Method.
- Send completion message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).
