# Handoff Report: Authorized Global Search Modal & Quick Actions Dispatcher

- **Role**: Explorer M2-3 (Mobile Search & Interaction Architect)
- **Recipient**: Orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`) / Worker M2
- **Deliverable**: `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md`
- **Handoff Type**: Hard (Task Complete)

---

## 1. Observation

1. **Header Search Architecture**:
   - In `mobile-app/src/components/Header.tsx` (lines 56–102, `variant === 'home'`), there is no search icon or trigger in the top bar:
     ```tsx
     <View style={styles.homeRightGroup}>
       <View style={styles.homeStatusPill}>...</View>
       <TouchableOpacity style={styles.homeAvatarBtn} ...>
     ```
   - In `Header.tsx` (lines 284–310, `variant === 'main'`), search is restricted to an inline `TextInput` modifying only local parent screen filters if `onSearch` is supplied. No global cross-module search mechanism exists.
2. **Navigation FAB Bottleneck**:
   - In `mobile-app/src/navigation/RootNavigator.tsx` (lines 87–104), the center tab FAB button is hardcoded exclusively to trigger `setLeadModalVisible(true)`:
     ```tsx
     <Tab.Screen
       name="CreateLeadTab"
       component={EmptyScreen}
       options={{
         tabBarLabel: () => null,
         tabBarButton: () => (
           <TouchableOpacity
             style={styles.centerFabContainer}
             onPress={() => setLeadModalVisible(true)}
             activeOpacity={0.85}
           >
             <View style={styles.centerFab}>
               <Plus size={26} color="#ffffff" strokeWidth={2.8} />
             </View>
           </TouchableOpacity>
         ),
       }}
     />
     ```
   - Users cannot trigger hardware barcode scanning, quick quotes, or invoice creation from this primary mobile interaction point.
3. **RBAC & Security Specification**:
   - `docs/SECURITY.md` (lines 8–28) defines the granular permission structure (`module.action` format) for `TENANT_SUB_ADMIN` users (e.g. `leads.create`, `leads.view`, `projects.view`, `finance.view`, `finance.create_invoice`, `operations.scan`).
   - `docs/product-audit.md` (line 133) notes that `UserProfile` contains `permissions?: string[]`.
   - Currently, no client-side RBAC gating utility exists in `mobile-app/src` to conditionally filter search results or action triggers.
4. **Existing Modals & Reusable Primitives**:
   - `mobile-app/src/screens/crm/LeadCaptureModal.tsx`: accepts `{ visible, onClose, onSuccess, onProceedToQuote }`.
   - `mobile-app/src/components/CreateInvoiceModal.tsx`: accepts `{ visible, onClose, onSuccess }`.
   - `mobile-app/src/screens/operations/BarcodeScannerModal.tsx`: accepts `{ visible, project, onClose, onSaveSerials }`.
   - `mobile-app/src/components/common/`: provides `Input`, `Badge`, `EmptyState`, `SkeletonLoader`, `Button`, and `Card`.
   - `mobile-app/src/api/client.ts` (lines 8–40): exports `SafeStorage` wrapping `@react-native-async-storage/async-storage` with an in-memory fallback.

---

## 2. Logic Chain

1. **Global Search Experience**:
   - From Observation 1, because `Header.tsx` is the universal top bar across all screens, integrating a search icon button into `variant="home"` and `variant="main"` ensures that users can invoke global search from anywhere in the application.
   - Mounting `GlobalSearchModal` directly within `Header.tsx` eliminates the need to duplicate modal state across individual screens while still allowing override via `onSearchPress`.
2. **Authorized Multi-Entity Search**:
   - From Observation 3, users have distinct operational roles (Admins, Sales, Technicians).
   - In `GlobalSearchModal.tsx`, querying `crmApi.getLeads`, `tenantApi.getProjects`, `financeApi.getInvoices`, and project hardware serials must be gated using `hasPermission(user, '<module>.view')`.
   - Executing authorized queries with `Promise.allSettled` guarantees that if any single microservice endpoint experiences a timeout or network glitch, the remaining authorized results continue to display cleanly.
   - 300ms debounce prevents flooding cellular networks with requests on every keystroke.
3. **Ergonomic Quick Actions Dispatcher**:
   - From Observation 2, replacing the single-purpose `setLeadModalVisible(true)` on the center bottom tab button with `QuickActionsDispatcher` transforms the center FAB into an operational launchpad.
   - The dispatcher presents 4 role-gated quick actions:
     - "New Lead" (`leads.create`) -> `LeadCaptureModal`
     - "Quick Quote" (`quotations.create` / `quotations.view`) -> `navigateToTab('QuickQuote')`
     - "Scan Hardware" (`operations.scan` / `hardware.scan`) -> `BarcodeScannerModal`
     - "Record Payment" (`finance.create_invoice` / `finance.record_payment`) -> `CreateInvoiceModal`
   - Role-gating ensures technicians do not see financial billing actions and unauthorized users cannot invoke protected operations.
4. **Android Native Interactions & Storage**:
   - From Observation 4, using `SafeStorage` enables recent searches to persist across sessions without throwing unhandled exceptions in environments where native storage is restricted.
   - Wiring `BackHandler` ensures that pressing the Android hardware back button dismisses active modals rather than triggering unintended screen exits.

---

## 3. Caveats

1. **Hardware Barcode Scan Standalone Context**:
   - When "Scan Hardware" is triggered from the quick actions dispatcher without an active project selected, `BarcodeScannerModal` is initialized with a generic project context (`{ name: 'Field Hardware Scan', capacity: 3.3 }`). Once M3 modularizes project flows, a quick project picker can precede the scanner.
2. **API Endpoint Filtering**:
   - `crmApi.getLeads` and `financeApi.getInvoices` natively accept a `search` query parameter. `tenantApi.getProjects` currently returns all projects and is filtered in-memory across project names, customer names, consumer numbers, and hardware serials.

---

## 4. Conclusion

The technical architecture, component specifications, and drop-in code implementations for Worker M2 are completely designed and documented in `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md`.
The implementation consists of:
1. `mobile-app/src/utils/rbac.ts`: Shared permission evaluator supporting `module.action` checks, wildcards, and role inheritance.
2. `mobile-app/src/components/GlobalSearchModal.tsx`: Complete multi-entity search modal with 300ms debounce, category filtering tabs, `Badge` primitives, `SafeStorage` recent search persistence, and direct tab navigation.
3. `mobile-app/src/components/QuickActionsDispatcher.tsx`: Ergonomic role-gated bottom sheet modal with 4 core actions.
4. `mobile-app/src/components/Header.tsx` updates: Search icon button across `home` and `main` variants with modal mounting.
5. `mobile-app/src/navigation/RootNavigator.tsx` updates: Center FAB re-wiring to `QuickActionsDispatcher` and coordinated modal lifecycle management.

---

## 5. Verification Method

To independently verify the implementation once applied by Worker M2:

1. **Static Analysis & TypeScript Compilation**:
   ```powershell
   cd "f:\Company Products\solar-manager\mobile-app"
   npx tsc --noEmit
   ```
   *Expected Outcome*: 0 TypeScript errors.

2. **File Existence & Code Integrity Check**:
   - Verify `mobile-app/src/utils/rbac.ts` exists and exports `hasPermission`.
   - Verify `mobile-app/src/components/GlobalSearchModal.tsx` exists and imports `Input`, `Badge`, `EmptyState`, `SkeletonLoader`.
   - Verify `mobile-app/src/components/QuickActionsDispatcher.tsx` exists and handles all 4 actions.
   - Inspect `mobile-app/src/components/Header.tsx` to confirm search icon buttons are present in `variant === 'home'` and `variant === 'main'`.
   - Inspect `mobile-app/src/navigation/RootNavigator.tsx` to confirm `QuickActionsDispatcher` is mounted and triggered by the center FAB.

3. **Behavioral Test Scenarios**:
   - **Scenario A (Header Search)**: Launch app -> tap search icon in header -> search modal opens with auto-focus -> type search term -> after 300ms, multi-entity results appear with category chips and entity badges -> tap result -> modal closes, navigates to target tab, term is saved in recent searches.
   - **Scenario B (Recent Searches)**: Open search modal -> recent searches are displayed -> tap a recent search -> search re-executes; tap "Clear All" -> recent searches cleared.
   - **Scenario C (Center FAB Quick Actions)**: Tap center `+` button in bottom navigation bar -> bottom sheet appears with authorized actions -> tap "New Lead" -> `LeadCaptureModal` opens.
   - **Scenario D (Android Back Handling)**: Open search modal or quick actions sheet -> press Android hardware back button -> active modal closes without navigating the app back or exiting.
