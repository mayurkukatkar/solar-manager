# Handoff Report: Explorer M3-1 (Modules Decomposition & Profile Architecture)

**Milestone**: M3 — End-to-End Module, Screen & Workflow Transformation  
**Role**: Modules Decomposition & Profile Architecture Explorer  
**Working Directory**: `.agents/teamwork/explorer_m3_1/`  
**Recipient**: Orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`) / Worker M3-1  
**Date**: 2026-10-30T09:32:00Z  

---

## 1. Observation

Direct code observations from inspection of the target codebase:

1. **Monolithic Structure of `ModulesScreen.tsx`**:
   - Location: `mobile-app/src/screens/modules/ModulesScreen.tsx` (2,273 lines, 82,983 bytes).
   - Lines 57–176 define 38 root-level `useState` hooks managing state across 9 unrelated modules.
   - Lines 708–1426 render a single fullsheet `<Modal visible={!!activeSubModule} animationType="slide">` containing all 9 sub-modules inline:
     - `QUOTES` (lines 735–896)
     - `SURVEYS` (lines 897–955)
     - `SUBSIDY` (lines 956–1009)
     - `FINANCING` (lines 1010–1109)
     - `DISCOM` (lines 1110–1133)
     - `FINANCE` (lines 1134–1339)
     - `PROCUREMENT` (lines 1340–1369)
     - `AMC` (lines 1370–1399)
     - `SUPER_ADMIN` (lines 1400–1423)
   - Two additional nested inline modals:
     - `scheduleSurveyModal` at lines 1428–1519 (`<Modal visible={scheduleSurveyModal} animationType="slide" transparent>`)
     - `paymentModalVisible` at lines 1521–1595 (`<Modal visible={paymentModalVisible} animationType="slide" transparent>`)
   - One proposal preview modal:
     - `ProposalPreviewModal` at lines 1597–1605.
   - Lines 1610–2273 contain 663 lines of `StyleSheet.create` styles.

2. **Absence of Role-Based Filtering in Module Hub**:
   - In `ModulesScreen.tsx` (lines 563–648), `MODULE_CATEGORIES` renders all 8 standard modules to every user without inspecting permissions.
   - Only `SUPER_ADMIN` platform governance tile is gated (lines 686–704: `{user?.role === 'SUPER_ADMIN' && ...}`). A `TECHNICIAN` currently sees Finance & Invoicing; a `SALES_AGENT` sees Procurement warehouse stock.
   - In `mobile-app/src/utils/rbac.ts`, `hasPermission(user, requiredPermission)` is implemented and available for permission validation with namespaces (`leads.*`, `quotations.*`, `surveys.*`, `projects.*`, `finance.*`, `operations.*`, `inventory.*`).

3. **FieldProfileScreen Dummy Metrics and Fake Delay**:
   - Location: `mobile-app/src/screens/profile/FieldProfileScreen.tsx` (601 lines, 16,637 bytes).
   - Lines 51–58 contain a simulated `setTimeout` in `handleSyncAll`:
     ```typescript
     const handleSyncAll = async () => {
       setSyncing(true);
       setTimeout(async () => {
         setSyncing(false);
         await checkDrafts();
         Alert.alert('Offline Sync Complete', 'All local field drafts and media records are synced with the live server.');
       }, 1200);
     };
     ```
   - Lines 112, 118, 123, 128 contain hardcoded strings:
     - Line 112: `<Text style={styles.radarValueTotal}>₹34.8 Lakhs</Text>`
     - Line 118: `<Text style={styles.radarGridValGreen}>₹8.4 L</Text>`
     - Line 123: `<Text style={styles.radarGridValAmber}>₹18.2 L</Text>`
     - Line 128: `<Text style={styles.radarGridValBlue}>₹8.2 L</Text>`
   - Lines 102–103 contain hardcoded platform info:
     - Line 102: `<Text style={styles.planBold}>WhereReady Solar OS Enterprise</Text>`
     - Line 103: `<Text style={styles.planExpiry}>Active • 2027</Text>`
   - Lines 46–49 only check `offlineSyncService.getDraftLeads().length`. Other local storage keys (`@solar_custom_modules`, `@solar_project_serials_*`) are not audited.
   - The user's active permissions list is not displayed.

4. **Session Expiry & Suspension Gap (Feature 40)**:
   - In `mobile-app/src/api/client.ts` (lines 121–157), the Axios response interceptor catches 403 `TENANT_SUSPENDED` and 401:
     - 403 calls `suspendedHandler(suspendMsg)` and clears auth tokens.
     - 401 calls `unauthorizedHandler()` and clears auth token.
   - In `mobile-app/src/context/AuthContext.tsx`:
     - Line 73: `handleSessionExpiry` resets `user = null`, `token = null`, `sessionExpired = true`.
     - Line 81: `handleAccountSuspended` resets `user = null`, `token = null`, `accountSuspended = true`.
   - In `mobile-app/src/navigation/RootNavigator.tsx`:
     - Lines 429–436 render `<AccountSuspendedModal visible={accountSuspended} ... />`.
     - **For HTTP 401**: There is NO MODAL. Setting `user = null` abruptly navigates the stack to `LoginScreen`, which merely displays a subtle yellow text banner at lines 129–139 of `LoginScreen.tsx` ("Session timed out. Please sign in again.").
   - In `mobile-app/src/components/AccountSuspendedModal.tsx`:
     - Line 43: `<Modal visible={visible} transparent animationType="fade" statusBarTranslucent>` lacks `onRequestClose={() => {}}`. Android hardware back can cause inconsistent dismissal.

5. **Existing Verification State**:
   - `node mobile-app/test-perspectives.js` ran synchronously: 23 / 23 tests passed (100%).
   - `cmd /c "cd mobile-app && npx tsc --noEmit"` exited with code 0 (zero TypeScript errors).

---

## 2. Logic Chain

1. **Decomposition Necessity (Observation 1 → Architecture)**:
   - Because `ModulesScreen.tsx` has 2,273 lines with 38 mixed state variables, every user keystroke re-renders the entire screen. Furthermore, maintaining 9 modules within a single file creates immense technical debt and collision risks.
   - Extracting the 9 sub-modules into dedicated components under `mobile-app/src/screens/modules/submodules/` (`QuotationsModule`, `SurveysModule`, `SubsidiesModule`, `FinancingModule`, `DiscomModule`, `InvoicingModule`, `ProcurementModule`, `AmcModule`, `SuperAdminModule`) with a barrel export reduces `ModulesScreen.tsx` from 2,273 lines to ~180 lines.
   - Each sub-module encapsulates its own lifecycle, forms, and nested modals, isolating re-renders and enabling independent testing.

2. **RBAC Filtering (Observation 2 → Security & IA)**:
   - Because `MODULE_CATEGORIES` does not filter by user role, unauthorized users are exposed to administrative and sensitive financial modules.
   - By annotating each module definition in `MODULE_CATEGORIES` with required permissions and applying `hasPermission(user, module.permission)`, unauthorized tiles and empty category sections are hidden dynamically.

3. **FieldProfile Real Wiring (Observation 3 → Integrity)**:
   - Because `FieldProfileScreen.tsx` displays fake hardcoded metrics (`₹34.8 Lakhs`, etc.) and a fake `setTimeout`, it breaches Acceptance Criteria R3 ("without fake statistics or simulated delays").
   - Wires `financeApi.getStats()` for live cash flow data (guarded by `finance.view`), wires `authApi.getMe()` / `user.tenant` for organization profile and plan tier, and replaces `setTimeout` with a live queue drain loop iterating `offlineSyncService.getDraftLeads()` and calling `crmApi.createLead()`.

4. **Non-Dismissible Security Modals (Observation 4 → Resilience)**:
   - Feature 40 requires non-dismissible modal handling of both HTTP 401 and HTTP 403 `TENANT_SUSPENDED`.
   - Creating `SessionExpiredModal.tsx` and mounting it globally in `RootNavigator.tsx` ensures that when a JWT expires, the user is presented with a non-dismissible explanation modal with a "Sign In Again" action, preventing confusion or silent state resets.
   - Adding `onRequestClose={() => {}}` to both `SessionExpiredModal.tsx` and `AccountSuspendedModal.tsx` guarantees that Android hardware back buttons cannot dismiss these security gates.

---

## 3. Caveats

- **API Offline Fallback**: In `FieldProfileScreen`, if the device is currently offline when fetching `financeApi.getStats()`, it should gracefully display empty state / cached values rather than throwing an unhandled rejection.
- **Route Parameter Preservation**: When external callers navigate via `navigation.navigate('Modules', { screen: 'SUBSIDY' })` or `navigation.navigate('Modules', { openQuote: true, leadName: '...' })`, the coordinator `ModulesScreen.tsx` must preserve these parameters and pass them directly to the active sub-module.

---

## 4. Conclusion

The technical blueprint is fully designed and documented in `.agents/teamwork/explorer_m3_1/analysis.md`. The worker can directly execute the 15-step implementation matrix:
1. Extract 9 standalone sub-modules into `mobile-app/src/screens/modules/submodules/`.
2. Refactor `ModulesScreen.tsx` to a ~180-line Hub Grid Coordinator with RBAC filtering.
3. Create `SessionExpiredModal.tsx` and harden `AccountSuspendedModal.tsx` with non-dismissible guards.
4. Mount `SessionExpiredModal` globally in `RootNavigator.tsx`.
5. Refactor `FieldProfileScreen.tsx` to live backend context, real sync queue replay, active permissions, and statutory links.

---

## 5. Verification Method

To independently verify the implementation:

1. **TypeScript Type Compilation**:
   ```powershell
   cmd /c "cd mobile-app && npx tsc --noEmit"
   ```
   *Expected Result*: Exits with code 0, zero errors.

2. **Automated Perspectives Regression Suite**:
   ```powershell
   node mobile-app/test-perspectives.js
   ```
   *Expected Result*: 23 / 23 tests pass (100%).

3. **Modules Grid & Sub-module Inspection**:
   - Inspect `mobile-app/src/screens/modules/submodules/` for 9 modular components and `index.ts`.
   - Inspect `mobile-app/src/screens/modules/ModulesScreen.tsx` ensuring line count is < 250 lines and `hasPermission` is applied.

4. **Security Modals Inspection**:
   - Inspect `mobile-app/src/components/SessionExpiredModal.tsx` and `mobile-app/src/components/AccountSuspendedModal.tsx`.
   - Verify `onRequestClose={() => {}}` is present on both `<Modal>` elements.
   - Inspect `mobile-app/src/navigation/RootNavigator.tsx` verifying both modals are mounted at root.

5. **Profile Screen Real Wiring Inspection**:
   - Inspect `mobile-app/src/screens/profile/FieldProfileScreen.tsx`.
   - Verify `setTimeout` is eliminated.
   - Verify `financeApi.getStats()`, `authApi.getMe()`, and `offlineSyncService` queue replay are wired.
   - Verify active permissions list and statutory links are rendered.
