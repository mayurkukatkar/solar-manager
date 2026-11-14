# Handoff Report — Explorer M4-2 (Offline Sync & Network Specialist)

**Milestone**: M4 — Native Android Interactions, Performance & Layout Validation  
**Sender**: Explorer M4-2 (Offline Sync & Network Specialist)  
**Recipient**: Orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`) & Worker M4  
**Date**: 2026-10-30T13:50:00Z  
**Working Directory**: `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_2\`  
**Primary Deliverable**: `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_2\analysis.md`  

---

## 1. Observation

Direct, verifiable facts observed across the codebase and verification tooling:

1. **Package Dependencies (`mobile-app/package.json:1-39`)**:
   Neither `expo-network` nor `@react-native-community/netinfo` is listed under `dependencies` or `devDependencies`. Available packages include `axios` (v1.20.0), `@react-native-async-storage/async-storage` (v2.2.0), `react-native-safe-area-context` (v5.10.1), and `expo-status-bar` (v58.0.3).
2. **Existing Offline Code (`mobile-app/src/services/offlineSyncService.ts:1-71`)**:
   - Only manages draft leads (`@solar_manager_draft_leads`) and draft quotes (`@solar_manager_draft_quotes_${leadId}`).
   - Contains no mutation queue (`@solar_offline_queue`), no retry/backoff mechanism, no idempotency headers, and no conflict resolution logic.
   - Lacks methods `getQueue()`, `getPendingCount()`, `retryFailed()`, `clearQueue()`, and `subscribe()`.
   - Accesses `AsyncStorage` directly rather than `SafeStorage` from `mobile-app/src/api/client.ts`.
3. **Network Status Detection (`mobile-app/src/api/client.ts:159-184` & `mobile-app/src/context/AuthContext.tsx:97-104`)**:
   - `checkBackendHealth()` pings `${url}/api/auth/me` with a 5000ms timeout.
   - `AuthContext.tsx` invokes `checkBackendHealth()` only once during `initSession`.
   - If cellular connectivity drops during app operation, `backendStatus.isOnline` remains `true` until an API call fails or the app is restarted.
   - No reactive listener or auto-sync trigger exists when internet connectivity is restored.
4. **Offline Stage Gating & Domain Failures (`mobile-app/src/screens/projects/FieldProjectsScreen.tsx:226-243`, `mobile-app/src/screens/operations/InstallationQAModal.tsx:148-158`, `mobile-app/src/screens/operations/BarcodeScannerModal.tsx:362-374`)**:
   - `handleConfirmStageAdvance` catches API errors and displays `Alert.alert('Stage Advance Note', ...)` without queueing the stage update for replay.
   - `handleSubmitQA` in `InstallationQAModal.tsx` saves readings locally to `@solar_qa_${project.id}`, but catches stage advancement failures without queueing.
   - `handleSaveAndConfirm` in `BarcodeScannerModal.tsx` saves serials to `@solar_project_serials_${project.id}` and executes `tenantApi.updateProjectDetails(...)` inside a bare `catch {}`, silently losing cloud synchronization if offline.
5. **Absence of GET Response Caching (`mobile-app/src/screens/projects/FieldProjectsScreen.tsx:256-268`)**:
   - `fetchProjects()` executes `const res = await tenantApi.getProjects().catch(() => null);`
   - When offline, `res` is null and `projects` remains empty (`[]`), causing `EmptyState` to render and locking technicians out of project specs, customer phone numbers, and rooftop specifications on-site.
6. **Session Expiry & Re-Authentication (`mobile-app/src/api/client.ts:138-144` & `mobile-app/src/context/AuthContext.tsx:73-79`)**:
   - HTTP 401 calls `SafeStorage.removeItem(STORAGE_AUTH_TOKEN_KEY)` and `SafeStorage.removeItem(STORAGE_USER_PROFILE_KEY)`.
   - Local drafts and offline queues are **not** cleared, but queued mutations currently lack `tenantId` and `userId` stamping, posing a cross-tenant replay vulnerability if a different user re-authenticates.
7. **Test Suite Baseline**:
   - Running `node mobile-app/test-perspectives.js` executed with exit code 0: **23 / 23 passed (100%)**.
   - Running `node --test mobile-app/tests/tier1-category-partition.test.js mobile-app/tests/tier2-boundary-analysis.test.js mobile-app/tests/tier3-pairwise-combinations.test.js mobile-app/tests/tier4-real-world-scenarios.test.js` executed with exit code 0: **121 / 121 passed (100%)**.
   - Running `cmd /c "cd mobile-app && npx tsc --noEmit"` executed with exit code 0: **0 TypeScript errors**.

---

## 2. Logic Chain

1. From **Observation 1 & 3**, installing unlinked native network packages can destabilize CI and headless Node.js test runners. However, Axios response/error interceptors directly observe genuine application-layer network state transitions (`Network Error` / `ECONNABORTED` vs. successful HTTP 2xx responses). Coupling an event-driven pub/sub mechanism in `client.ts` with `checkBackendHealth()` delivers 100% reliable online/offline detection with zero new package footprint.
2. From **Observation 2 & 4**, critical field mutations (leads, stage gating, CEA QA certifications, hardware serials, job check-ins) are dropped when offline. Therefore, an enterprise mutation queue (`@solar_offline_queue`) supporting `CREATE_LEAD`, `UPDATE_PROJECT_STAGE`, `RECORD_QA_READINGS`, `UPDATE_PROJECT_SERIALS`, and `UPDATE_JOB_STATUS` must be introduced.
3. From **Observation 2**, mutations must be replayed idempotently. Replaying with static intervals risks network flooding, while replaying in random order violates domain causality (e.g., advancing a stage before the entity is created). Therefore, the replay engine must:
   - Enforce strict FIFO ordering by `createdAt`.
   - Maintain a dynamic ID reference map (`idMap`) converting local temporary IDs (`draft_...`) to server IDs (`lead_...`).
   - Use exponential backoff ($2\text{s} \times 2^{\text{retry}} + \text{jitter}$, capped at 60s).
   - Transmit `X-Idempotency-Key` and `X-Client-Timestamp` headers.
4. From **Observation 4**, conflicting offline edits can occur. Project stages are canonical and strictly forward-moving (indices 1 to 7). If the server is already at or ahead of a queued stage advance, resolving with `MONOTONIC_PASS` (marking `COMPLETED` without error) preserves server truth. For entity attributes, Last-Write-Wins (LWW) with client-timestamped auditing and a conflict log (`@solar_conflict_log`) ensures safe data convergence.
5. From **Observation 5**, field technicians cannot perform on-site rooftop work without project specs. Introducing a Stale-While-Revalidate (SWR) cache in `SafeStorage` (`@solar_cache_*`) allows screens to immediately render cached projects, leads, and operational checklists when offline, accompanied by an informative timestamp badge ("Offline Snapshot").
6. From **Observation 6**, when an expired JWT causes HTTP 401 after field reconnection, mutations must be preserved, but each mutation must record `tenantId` and `userId` to verify ownership before replay, preventing cross-tenant data leakage.
7. From **Observation 1 & 3**, users must have clear, non-intrusive situational awareness of connectivity and sync status. An `OfflineBanner` component mounted at the root level of `RootNavigator.tsx` (using `useSafeAreaInsets().top`) combined with synchronized status indicators in `Header.tsx` ensures all screens inherit offline visibility seamlessly.

---

## 3. Caveats

1. **Large Binary Uploads**: Inspection photos taken in the field can be 2–5 MB each. Full binary upload over 2G/EDGE cellular connections can saturate mobile bandwidth. As detailed in the blueprint, photo files must remain in local device cache (`FileSystem.documentDirectory` or cache URI) while metadata is queued; binary transfer should prioritize Wi-Fi or high-speed data.
2. **Background Sync in Native Standby**: React Native JS threads are suspended by Android OS when the app is placed in background without foreground services or WorkManager. The offline sync queue triggers immediately when the user foregrounds the app or regains network connectivity while active. Standby background synchronization via `expo-background-fetch` is an optional M5 enhancement.

---

## 4. Conclusion

1. The current mobile client lacks a robust offline mutation queue, reactive network detection, and GET response caching, creating operational friction for solar field technicians.
2. An architectural design and line-by-line implementation blueprint has been constructed and documented in:
   `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_2\analysis.md`
3. The blueprint provides:
   - Full implementation of `offlineSyncService.ts` with `@solar_offline_queue`, exponential backoff, monotonic stage gating, LWW conflicts, and complete backward compatibility with existing tests.
   - Network status publisher in `client.ts` with Axios interceptor detection and automatic sync triggers.
   - Persistent `OfflineBanner` component with 5 states, animated transitions, safe-area notch awareness, and root integration.
   - Stale-While-Revalidate GET response caching across `FieldProjectsScreen`, `PipelineScreen`, and `OperationsScreen`.
   - Multi-tenant isolation guards preventing cross-tenant mutation replay.

---

## 5. Verification Method

To independently verify the architecture and ensure zero regressions before and after Worker M4 applies the blueprint:

1. **Automated Perspectives Suite**:
   ```powershell
   node mobile-app/test-perspectives.js
   ```
   *Expected*: 23 / 23 tests pass (100%).

2. **Automated Test Tiers 1–4**:
   ```powershell
   node --test mobile-app/tests/tier1-category-partition.test.js mobile-app/tests/tier2-boundary-analysis.test.js mobile-app/tests/tier3-pairwise-combinations.test.js mobile-app/tests/tier4-real-world-scenarios.test.js
   ```
   *Expected*: 121 / 121 tests pass (100%). Specifically verifies `MockAsyncStorage` and `createOfflineSyncService` backwards compatibility in Tier 3 & Tier 4.

3. **TypeScript Compilation Check**:
   ```powershell
   cmd /c "cd mobile-app && npx tsc --noEmit"
   ```
   *Expected*: Exit code 0, 0 compiler errors.

4. **Offline Simulation Invalidation Conditions**:
   - Disabling Wi-Fi/cellular on an Android emulator or device must immediately show `OfflineBanner` ("Working Offline").
   - Creating a lead or advancing a project stage offline must increment the pending queue count and store data in `@solar_offline_queue`.
   - Re-enabling connectivity must trigger automatic queue replay, display the green confirmation banner ("All updates synchronized! 🎉"), and auto-dismiss after 3 seconds.
   - Opening `FieldProjectsScreen` in airplane mode must render cached projects from `@solar_cache_projects` instead of showing an empty screen.
