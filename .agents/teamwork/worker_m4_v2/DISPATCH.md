## 2026-10-30T13:49:42Z
You are Worker M4 (Senior Mobile Platform Engineer) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Read the detailed architectural blueprints provided by the 3 Explorers:
   - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_1\analysis.md` (Haptics, Touch Targets, BackHandler, Layouts)
   - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_2\analysis.md` (Offline Sync Queue, Network Listener, SWR Caching, OfflineBanner)
   - `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_3\analysis.md` (List Virtualization, Debounce, Memoization, Permission UX)
4. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_v2\`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Implementation Scope

### Track 1: Haptics, Touch Ergonomics & BackHandler
1. Create `mobile-app/src/utils/haptics.ts`:
   - Dual-mode architecture dynamically probing `expo-haptics` and gracefully falling back to calibrated `Vibration` pattern arrays (10ms selection, 15/35/60ms light/medium/heavy impacts, `[0, 30, 60, 40]` success, `[0, 50, 50, 50]` warning) with zero risk of module resolution crashes.
2. Wire 7 tactile feedback touchpoints:
   - `BarcodeScannerModal.tsx`: `notificationSuccess()` on valid scan, `notificationWarning()` on duplicate/invalid.
   - `FieldProjectsScreen.tsx`: `notificationSuccess()` on stage advance, `notificationWarning()` on blocked advance.
   - `InstallationQAModal.tsx`: `notificationSuccess()` on statutory CEA sign-off, `notificationWarning()` on safety violation.
   - `ModalHeader.tsx` / `useDirtyFormWarning`: `notificationWarning()` on unsaved form discard prompt.
   - `RootNavigator.tsx`: `selection()` on bottom tab bar switch via `screenListeners={{ tabPress: () => haptics.selection() }}`.
   - `QuickActionsDispatcher.tsx`: `impactMedium()` on FAB open, `selection()` on action tap.
   - `Button.tsx`: Add optional `haptic` prop (`impactLight` default for primary/danger).
3. Touch Ergonomics:
   - Update `touchTarget.min` in `tokens.ts` to `Platform.select({ android: 48, default: 44 })`.
   - Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to small buttons in `Header.tsx`, `FieldProjectsScreen.tsx`, and `DashboardScreen.tsx`.
4. BackHandler Coverage:
   - Add `onRequestClose` to the 6 identified modal surfaces:
     - `OperationsScreen.tsx:484` (`activeJob` modal)
     - `SurveysModule.tsx:198` (`scheduleSurveyModal`)
     - `InvoicingModule.tsx:311` (`paymentModalVisible`)
     - `LoginScreen.tsx:233` (`resetModalVisible`)
     - `LeadsScreen.tsx:460` (`addModalVisible`)
     - `FinanceScreen.tsx:791` (`paymentModalVisible`)
5. Font Scaling & Layout:
   - Add `maxFontSizeMultiplier={1.3}` to tab labels, badge chips, and numeric KPIs.

### Track 2: Offline Sync Queue, Network Listener & SWR Caching
1. Upgrade `mobile-app/src/services/offlineSyncService.ts`:
   - Retain 100% backwards compatibility with existing methods (`getDraftLeads`, `saveDraftLead`, `deleteDraftLead`, `getDraftQuotes`, `saveDraftQuote`, `deleteDraftQuote`, `getOfflineStats`, `syncAllDrafts`).
   - Implement `@solar_offline_queue` supporting `CREATE_LEAD`, `UPDATE_PROJECT_STAGE`, `RECORD_QA_READINGS`, `UPDATE_PROJECT_SERIALS`, `UPDATE_JOB_STATUS`.
   - Multi-tenant stamping (`tenantId`, `userId`) preventing cross-tenant replay.
   - Idempotent replay engine with FIFO order, exponential backoff with jitter, dynamic ID mapping (`idMap`), and `X-Idempotency-Key` headers.
   - Monotonic stage gating (indices 1–7; server state never regresses) and LWW conflict resolution with conflict logging (`@solar_conflict_log`).
   - Add `getQueue()`, `getPendingCount()`, `retryFailed()`, `clearQueue()`, `subscribe()`.
2. Enhance `mobile-app/src/api/client.ts`:
   - Add event-driven network listener publishing online/offline transitions via Axios interceptor detection and backend health checks.
   - Auto-sync trigger on reconnection.
   - SafeStorage Stale-While-Revalidate GET caching helper (`@solar_cache_*`).
3. Create `mobile-app/src/components/OfflineBanner.tsx`:
   - Persistent banner with safe-area top inset awareness, animated slide transitions, displaying 5 states ("Working Offline", "Changes Queued", "Reconnecting", "Syncing", "Synced").
   - Mount in `RootNavigator.tsx` and integrate status in `Header.tsx`.
4. SWR Caching:
   - Enable cached fallback in `FieldProjectsScreen.tsx`, `PipelineScreen.tsx`, and `OperationsScreen.tsx` so technicians in remote solar fields have immediate offline access to project details, customer contacts, and checklists.

### Track 3: List Virtualization, Memoization & Permissions UX
1. Virtualize lists with `<FlatList>`:
   - `FieldProjectsScreen.tsx`: Replace `ScrollView.map()` with virtualized `<FlatList>`, `getItemLayout` (180dp), `windowSize={7}`, `maxToRenderPerBatch={10}`, `initialNumToRender={8}`, `removeClippedSubviews={Platform.OS === 'android'}`, memoized `keyExtractor`, and `useCallback` for `renderItem`.
   - `OperationsScreen.tsx`: Replace `ScrollView.map()` with virtualized `<FlatList>`, `getItemLayout` (224dp), `windowSize={7}`.
   - `FinanceScreen.tsx`: Replace `ScrollView.map()` with virtualized `<FlatList>`, `ListHeaderComponent` for summary metrics, `windowSize={7}`.
   - `PipelineScreen.tsx`: Add `getItemLayout` (180dp), memoize `renderItem` and `keyExtractor` with `useCallback`, wrap card component in `React.memo`.
2. Computational Memoization & Debouncing:
   - Wrap statutory 13.8% composite solar GST, BOM splits, CEA safety thresholds, and aging overdue calculations in `useMemo`.
   - Create `useDebounce` (300ms) hook in `mobile-app/src/hooks/useDebounce.ts` and wire into `Header.tsx` and search inputs to decouple keyboard response from heavy list filtering.
3. Android Permissions UX:
   - Create `mobile-app/src/components/common/PermissionRationaleModal.tsx`: Explains statutory justification for Camera / Photo access, Lucide icons, and `Linking.openSettings()` CTA.
   - Create `mobile-app/src/hooks/useAppPermissions.ts`: Hook with `AppState` resume listener that automatically detects permission grants when returning from Android Settings.
   - Wire into `BarcodeScannerModal.tsx`, `OperationsScreen.tsx`, `CustomerOnboardingModal.tsx`, and `ProjectDossierModal.tsx`, resolving permanent denial dead-ends (`canAskAgain === false`).

## Verification Commands
After implementation, you MUST execute:
1. `cmd /c "cd mobile-app && npx tsc --noEmit"` — must compile with 0 errors.
2. `node mobile-app/test-perspectives.js` — must pass 23/23 tests (100%).
3. `node mobile-app/test-e2e.js` (or node --test on tier suites) — must pass 100%.

## Output Requirements
Write your detailed implementation log to `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_v2\progress.md` and complete handoff report to `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_v2\handoff.md`, then send a message to the orchestrator with results. Do NOT cheat.


## 2026-10-30T14:00:51Z
**Context**: Milestone M4 Implementation Status Check
**Content**: Status check on Worker M4 progress. Please report your current step across Track 1 (Haptics & Touch Targets), Track 2 (Offline Sync & Network Listener), and Track 3 (List Virtualization & Permissions UX), update progress.md, and indicate if you encountered any blockers.
**Action**: Update progress.md and continue implementation.


## 2026-10-30T14:12:56Z
**Context**: Milestone M4 Implementation Status Check
**Content**: Status check on Worker M4 progress. Please report your current status on Tracks 2 and 3 (offlineSyncService, OfflineBanner, FlatList virtualization, permissions UX) and verification runs (`tsc --noEmit`, `test-perspectives.js`, `test-e2e.js`).
**Action**: Update progress.md, finish remaining items and verification, and compile handoff.md.

## 2026-10-30T14:23:27Z
**Context**: Milestone M4 Virtualization & Verification Status Check
**Content**: Checking in on Worker M4 progress. How are the FlatList updates in PipelineScreen, FieldProjectsScreen, OperationsScreen, and FinanceScreen progressing, and have the verification suites (`tsc --noEmit`, `test-perspectives.js`, `test-e2e.js`) begun executing?
**Action**: Update progress.md, complete verification runs, compile handoff.md, and reply with results.

## 2026-10-30T14:32:43Z
**Context**: Milestone M4 Final Verification Status Check
**Content**: Status check on Worker M4. Are OperationsScreen and FinanceScreen FlatList virtualizations completed, and how did the verification runs (`tsc --noEmit`, `test-perspectives.js`, `test-e2e.js`) perform?
**Action**: Please provide an update, finalize handoff.md, and reply.
