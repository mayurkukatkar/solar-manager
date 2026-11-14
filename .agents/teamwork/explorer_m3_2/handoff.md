# Handoff Report — Explorer M3-2 (CRM, Pipeline & Quotation Architecture)

**Milestone**: M3 (End-to-End Module, Screen & Workflow Transformation)  
**Agent**: Explorer M3-2  
**Target Recipient**: Orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`) / Worker M3  

---

## 1. Observation
1. **Pipeline & Stages (`mobile-app/src/screens/crm/PipelineScreen.tsx`)**:
   - Lines 53-59 define only 5 non-standard composite buckets: `ALL`, `LEADS`, `QUOTES`, `ONBOARDING`, `PROJECTS`.
   - Lines 324-335 map `LEADS` -> `NEW/CONTACTED`, `QUOTES` -> `QUALIFIED/PROPOSAL_SENT`, `ONBOARDING` -> `SITE_SURVEY/NEGOTIATION`, `PROJECTS` -> `WON/COMPLETED`.
   - The canonical 7-stage solar pipeline (`NEW`, `CONTACTED`, `SITE_SURVEY`, `QUOTATION_SENT`, `NEGOTIATION`, `WON`, `LOST`) is missing from the filter chips.
   - Lines 1723-1732: `microCircleBtn` has fixed `width: 34, height: 34`, which violates the minimum 48x48 dp touch target specification.
   - Lines 440-444: Loading state uses a raw `ActivityIndicator` centered in a view with text "Connecting to Vendor ERP...". Standardized `SkeletonLoader.Card` is not used.
   - Lines 445-462: Empty state uses a custom `emptyContainer` instead of the reusable `EmptyState` component (`components/common/EmptyState.tsx`).
   - Lines 434-636: List items are rendered via `ScrollView` with `.map()`, creating performance bottlenecks for long lead lists rather than virtualized `FlatList`.
   - Status badges on lead cards use custom `View` styling rather than the standardized `Badge` primitive (`components/common/Badge.tsx`).
2. **Lead Capture Modal (`mobile-app/src/screens/crm/LeadCaptureModal.tsx`)**:
   - Line 269: Uses raw `<Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>`.
   - Line 278: Uses `<ScrollView style={styles.body}>` with bottom bar outside (lines 537-560).
   - `KeyboardAvoidingContainer` (`components/common/KeyboardAvoidingContainer.tsx`) is NOT integrated, leading to software keyboard obscuring inputs and CTAs on mobile.
   - `ModalHeader` (lines 272-276) receives no `isDirty` prop; `onRequestClose` immediately triggers `onClose`. Accidental hardware back navigation or tap on close discards all prospect entry data without warning.
   - Uses raw `TextInput` with hardcoded styles instead of the standardized `Input` primitive.
   - PIN code (lines 353-363) lacks 6-digit regex validation `/^[1-9][0-9]{5}$/`.
   - Lead source (line 219) is hardcoded as `'Field App'` without a UI category selector.
3. **Quick Quote Sizing Engine (`mobile-app/src/screens/crm/QuickQuoteScreen.tsx`)**:
   - `DEFAULT_PANEL_OPTIONS` (lines 55-112) provides 7 Tier-1 modules (Waaree 540W, Adani 545W TopCon, Tata 545W, Vikram 540W, Goldi 545W, Premier 545W, Rayzon 545W), supporting custom equipment via `SafeStorage`.
   - Step 1 (lines 601-684) accepts Customer Name, Phone, and Monthly Electricity Bill, but DOES NOT accept Sanctioned Load.
   - Sizing is computed strictly via `(monthlyBill / 8.5) / 120`. If a customer has a 3 kW sanctioned load but a high bill recommending 10 kW, the app does not flag DISCOM capacity constraints or advise load enhancement.
   - System pricing is calculated using a flat `cap * 58000` rather than tiered capacity-based benchmark pricing.
4. **Dynamic Quotation Builder (`mobile-app/src/screens/crm/QuotationBuilderModal.tsx`)**:
   - Line 83: Only a single total cost text input (`totalSystemCost`) exists; there is no itemized dynamic Bill of Materials (BOM) breakdown (Modules, Inverter, Structure, BOS, Installation).
   - Lines 145-146: GST calculation is implemented simply as `const subtotal = Math.round(grossTotal / 1.138); const taxAmount = grossTotal - subtotal;`. The statutory Indian 13.8% composite solar GST split (70% Goods @ 12% + 30% Services @ 18%) is not itemized or explained.
   - Modal lacks `KeyboardAvoidingContainer` and `isDirty` protection.
5. **Customer Onboarding Wizard (`mobile-app/src/screens/crm/CustomerOnboardingModal.tsx`)**:
   - Lines 407-713: The form is rendered as a single monolithic vertical scrollview with 5 dense sections rather than a guided multi-step wizard.
   - Lines 279-293: Compulsory DISCOM consumer number enforcement is active (minimum 6 digits), which passes Perspective 3 in the automated test suite.
   - Lacks structured Aadhaar format validation and PAN regex validation (`[A-Z]{5}[0-9]{4}[A-Z]{1}`).
   - Modal lacks `KeyboardAvoidingContainer` and `isDirty` unsaved change protection.

---

## 2. Logic Chain
1. *From canonical EPC sales cycles to Pipeline UX*: Solar lead qualification progresses through distinct gates: prospect capture -> telephonic discovery -> site/shadow survey -> formal quotation -> commercial negotiation -> contract execution (won) or rejection (lost). Grouping these into 5 arbitrary buckets obscures actionable lead status. Converting `PipelineScreen.tsx` to 7 canonical chips (`NEW`, `CONTACTED`, `SITE_SURVEY`, `QUOTATION_SENT`, `NEGOTIATION`, `WON`, `LOST`) provides operational visibility and accurate stage counts.
2. *From ergonomics to UI primitives*: Interactive touch targets below 48x48 dp on Android lead to missed taps and frustration in field environments. Expanding `microCircleBtn` to 44-48 dp and adding `touchTarget.min` to action buttons ensures adherence to the design system. Standardizing badges with `Badge` and cards with theme tokens resolves inconsistent styling.
3. *From virtual keyboard mechanics to form safety*: On Android Edge-to-Edge and iOS, opening a keyboard inside a standard `ScrollView` without offset calculations pushes form fields off-screen or covers them behind the keyboard. Integrating `KeyboardAvoidingContainer` across `LeadCaptureModal`, `QuotationBuilderModal`, and `CustomerOnboardingModal` reclaims 275+ pixels of visible workspace and persists submit actions in the footer.
4. *From accidental dismissal to dirty form guards*: Field technicians collect substantial customer information on-site (legal name, address, consumer ID, bank account, IFSC). Accidental back button presses discard this state immediately. Passing `isDirty` to `ModalHeader` and hooking `useDirtyFormWarning` provides non-intrusive safety dialogs before discarding data.
5. *From Indian statutory regulations to quotation transparency*: GST Council Notifications 11/2017 & 8/2021 mandate that solar turnkey EPC contracts be treated as composite contracts (70% goods @ 12% + 30% services @ 18% = 13.8% effective GST). Itemizing this composite split alongside an itemized BOM builds customer trust, simplifies DISCOM documentation, and ensures accounting compliance.
6. *From cognitive load to a 4-step wizard*: Converting the 1,100+ line monolithic `CustomerOnboardingModal` into a 4-step wizard (Personal -> Site Feasibility -> KYC -> DISCOM & Bank DBT) breaks complex compliance intake into digestible steps with progressive validation per step.

---

## 3. Caveats
1. **Backend API Contract Continuity**: The backend CRM endpoints (`crmApi.createLead`, `crmApi.convertLead`, `quotationsApi.createQuotation`) accept existing field structures. All UI transformations (such as the 4-step wizard and BOM calculation) must serialize down into the existing API payload contracts without breaking schema expectations.
2. **Offline Draft Compatibility**: Draft leads stored in `AsyncStorage` via `offlineSyncService` (`DraftLead` interface) must remain fully compatible with the new 7-stage filter chips and lead cards.
3. **Automated Perspective Test Invariants**: The 23 automated tests in `mobile-app/test-perspectives.js` must remain 100% passing. Specifically, compulsory DISCOM consumer number validation in onboarding and DBT subsidy slabs must not be broken.

---

## 4. Conclusion
The CRM, Pipeline, Quick Quote, Quotation Builder, and Customer Onboarding modules require targeted architectural upgrades to deliver an enterprise-grade mobile SaaS experience. 

Worker M3 should execute the blueprint detailed in `.agents/teamwork/explorer_m3_2/analysis.md`:
1. **Refactor `PipelineScreen.tsx`**: Implement canonical 7-stage Kanban chips, >=48dp touch targets, `SkeletonLoader.Card` loading states, `EmptyState` component, virtualized `FlatList`, and `useTheme()` tokens.
2. **Harden `LeadCaptureModal.tsx`**: Wrap with `KeyboardAvoidingContainer`, attach `useDirtyFormWarning`, replace raw inputs with `Input` primitive, enforce 6-digit Indian PIN code regex, and add lead source selector chips.
3. **Upgrade `QuickQuoteScreen.tsx`**: Add Sanctioned Load vs Monthly Bill sizing logic with DISCOM capacity advisory warnings, tiered benchmark pricing, and TopCon ALMM module selection.
4. **Expand `QuotationBuilderModal.tsx`**: Implement dynamic BOM breakdown (Modules, Inverter, Structure, BOS, Installation) and explicit 13.8% statutory composite solar GST calculation (70% Goods @ 12% + 30% Services @ 18%).
5. **Restructure `CustomerOnboardingModal.tsx`**: Build a 4-step wizard stepper with step indicator, compulsory DISCOM consumer number enforcement, PAN/Aadhaar/IFSC field validations, `KeyboardAvoidingContainer`, and dirty form protection.

---

## 5. Verification Method
1. **Automated Perspective Test Suite**:
   ```bash
   node mobile-app/test-perspectives.js
   ```
   *Expected Result*: 23 / 23 tests pass (100% success rate), covering Perspectives 1 (Subsidy/Sizing), 2 (Hardware Modules), 3 (Onboarding Validation), 4 (KYC Document Optionality), and 10 (Ergonomics/Keyboard Workspace).
2. **TypeScript Compilation Verification**:
   ```bash
   node mobile-app/node_modules/typescript/bin/tsc --project mobile-app/tsconfig.json --noEmit
   ```
   *Expected Result*: Exit code 0, 0 compiler errors.
3. **Form Dismissal & Dirty Guard Validation**:
   - Open `LeadCaptureModal`, enter customer name, tap Back / Close -> Alert "Discard Lead Entry?" appears with "Keep Editing" and "Discard" options.
   - Open `CustomerOnboardingModal`, enter name and bank account, tap Back -> Alert "Discard Customer Onboarding?" appears.
4. **Touch Target Inspection**:
   - Inspect all clickable buttons in `PipelineScreen` to confirm bounding boxes are >= 48x48 dp.
