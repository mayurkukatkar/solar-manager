# Empirical Adversarial Stress Analysis: Milestone M4 Haptics & Offline Mutation Queue

**Role**: EMPIRICAL CHALLENGER (M4-1)  
**Date**: 2026-10-30  
**Target Milestone**: M4 — Native Android Interactions, Performance & Layout Validation  
**Empirical Test Suite**: `mobile-app/tests/tier5-m4-offline-haptics-stress.js`  
**Verdict**: **REQUEST_CHANGES** (2 Critical / High Deficiencies Discovered & Empirically Confirmed)

---

## Executive Summary

As Challenger M4-1, an empirical adversarial stress suite comprising 32 tests across 7 suites was authored and executed directly via `node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js` and `node mobile-app/tests/tier5-m4-offline-haptics-stress.js`.

### Test Suite Execution Summary
- **Total Test Cases**: 32
- **Passed**: 30 (93.75%)
- **Failed**: 2 (6.25%)
- **Execution Time**: ~2,048 ms

While Haptics resilience, BackHandler dismissal on all 6 target modals, monotonic stage gating, exponential backoff (with 60s cap and jitter), SWR caching, and legacy draft backward compatibility passed with high fidelity, **two significant vulnerabilities were empirically exposed in `mobile-app/src/services/offlineSyncService.ts`**:
1. **Critical Defect (Multi-Tenant Isolation Failure)**: Mutations queued for Tenant A while offline are replayed and transmitted under Tenant B's session and bearer token when another user logs in on the same shared mobile device and reconnects to the network.
2. **High Defect (Caller Idempotency Key Obliteration)**: `offlineSyncService.enqueueMutation()` ignores caller-supplied `idempotencyKey` parameters and unconditionally overwrites them with a newly generated random string, breaking client-side deduplication.

---

## Empirical Verification Matrix

| Suite | Focus Area | Tests | Passed | Failed | Status |
|---|---|---|---|---|---|
| **Suite 1** | Native Haptics Resilience & Calibrated Vibration Fallback | 7 | 7 | 0 | **PASS** |
| **Suite 2** | Modal BackHandler `onRequestClose` Callbacks | 7 | 7 | 0 | **PASS** |
| **Suite 3** | Offline Queue Monotonic Stage Gating & Conflict Resolution | 3 | 3 | 0 | **PASS** |
| **Suite 4** | Exponential Backoff, Jitter & Retry Scheduling (60s Cap) | 4 | 4 | 0 | **PASS** |
| **Suite 5** | SWR Caching Resilience for Field Technician Offline Access | 5 | 5 | 0 | **PASS** |
| **Suite 6** | Legacy API Backward Compatibility (100% Fidelity) | 3 | 3 | 0 | **PASS** |
| **Suite 7** | Adversarial Multi-Tenant Isolation & Idempotency Stress | 3 | 1 | 2 | **FAIL (BUGS FOUND)** |

---

## Detailed Findings & Attack Vectors

### Finding 1 [CRITICAL]: Multi-Tenant Isolation Breach in `offlineSyncService.ts`

- **Challenged Assumption**: Worker assumed `@solar_offline_queue` is tenant-safe because `QueuedMutation` contains `tenantId?: string`.
- **Attack Scenario**:
  1. Field engineer logs into solar business A (`tenant_solar_co_A`).
  2. Device loses cellular connectivity on a remote rural rooftop.
  3. Engineer creates leads / updates installation stages offline. Mutations are saved to `@solar_offline_queue` with `tenantId: 'tenant_solar_co_A'`.
  4. Engineer logs out of the app.
  5. A contractor or engineer from solar business B (`tenant_solar_co_B`) logs into the same shared tablet or phone.
  6. Device regains network connectivity.
  7. `AuthContext` network listener fires `offlineSyncService.syncQueue()`.
  8. `syncQueue()` iterates through `@solar_offline_queue` without verifying that each mutation's `tenantId` matches the currently logged-in user's `tenantId`.
  9. `apiClient.request()` attaches Tenant B's active Bearer token.
  10. **Result**: Tenant A's private leads and project updates are submitted to Tenant B's database!
- **Empirical Proof (`tier5-m4-offline-haptics-stress.js:894`)**:
  ```text
  [Adversarial Evaluation] Multi-tenant sync filter supported? NO (Vulnerability Detected: Tenant A mutation leaked to Tenant B session)
  AssertionError [ERR_ASSERTION]: CRITICAL VULNERABILITY: offlineSyncService.syncQueue executed Tenant A mutation when active tenant is Tenant B! Tenant isolation is NOT enforced in queue replay.
  ```
- **Blast Radius**: Severe data corruption, cross-tenant data leakage, regulatory non-compliance with Indian multi-tenant SaaS standards.
- **Remediation Required**:
  In `offlineSyncService.ts`:
  1. Update `syncQueue(options?: { force?: boolean; tenantId?: string })` to accept `tenantId`.
  2. In `syncQueue`, read current active user profile from `SafeStorage.getItem('@solar_user_profile')` if `options?.tenantId` is omitted.
  3. Filter pending mutations by tenant:
     ```typescript
     const pending = queue.filter((m) =>
       (m.status === 'PENDING' || (options?.force && m.status === 'FAILED')) &&
       (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)
     );
     ```
  4. In `AuthContext.tsx`, pass `user.tenantId` when invoking `syncQueue({ tenantId: user.tenantId })`.

---

### Finding 2 [HIGH]: Caller Idempotency Key Obliteration in `enqueueMutation`

- **Challenged Assumption**: Worker claimed unified offline queue enforces idempotent replay across all client submissions.
- **Attack Scenario**:
  1. UI screen (e.g. Lead Form, QA sign-off) generates a deterministic client idempotency key (`idem_lead_<timestamp>_<uuid>`) to prevent duplicate submissions if the user rapidly double-taps "Submit" while offline.
  2. UI calls `offlineSyncService.enqueueMutation({ type: 'CREATE_LEAD', payload, idempotencyKey: 'idem_lead_fixed_123' })`.
  3. `offlineSyncService.ts` line 195 unconditionally overwrites the key:
     ```typescript
     idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
     ```
  4. The caller's idempotency key is thrown away and replaced by a random string!
  5. If the user submits twice, two distinct mutations with two different random idempotency keys enter the queue, resulting in duplicate records created on the server once replayed!
- **Empirical Proof (`tier5-m4-offline-haptics-stress.js:948`)**:
  ```text
  [Adversarial Evaluation] Caller idempotencyKey retained? Expected: "idem_lead_custom_uuid_884920", Actual: "idem_1793372676833_u420bzb"
  AssertionError [ERR_ASSERTION]: VULNERABILITY: enqueueMutation ignored caller-provided idempotencyKey ("idem_lead_custom_uuid_884920") and replaced it with a newly generated random string ("idem_1793372676833_u420bzb"). This breaks client-side duplicate prevention!
  ```
- **Blast Radius**: Duplicate customer leads, duplicate milestone invoices, duplicate hardware serial registrations on unstable network connections.
- **Remediation Required**:
  In `offlineSyncService.ts`:
  1. Add `idempotencyKey?: string` to `enqueueMutation` parameter type definition (line 120–131).
  2. Line 195: Change to honor caller-provided key:
     ```typescript
     idempotencyKey: (params as any).idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
     ```

---

### Finding 3 [MEDIUM]: Race Condition & Premature Offline Lock in `enqueueMutation`

- **Observation**:
  Line 208 of `offlineSyncService.ts`:
  ```typescript
  // Opportunistic background sync trigger
  this.syncQueue().catch(() => {});
  ```
  When `enqueueMutation` is called, it triggers an unawaited `this.syncQueue()`.
  If the mobile client is offline:
  1. `this.syncQueue()` runs and immediately sets module-level variable `isSyncInProgress = true`.
  2. Any immediate caller `await offlineSyncService.syncQueue()` hits `if (isSyncInProgress) return ...` and returns `synced: 0, failed: 0, conflicted: 0`.
  3. More critically, the unawaited sync attempt immediately fails with `Network Error`, increments `retryCount = 1`, and updates `lastAttemptAt = Date.now()`.
  4. Because `retryCount` is now 1, the mutation enters the 4000ms+ exponential backoff window!
  5. If connectivity returns 1 second later, the mutation is blocked from syncing by line 292 (`if (elapsed < backoffMs) continue;`), even though the user just came online!
- **Remediation Required**:
  Only trigger background sync if network is confirmed online, or skip incrementing retry count if the error is a pre-flight offline check.

---

## Verified Robust Features (Passing Assertions)

The following areas were stress-tested and confirmed to function correctly and robustly:

1. **Haptics Resilience (7/7 Passed)**:
   - Universal dual-mode fallback: calling `selection()`, `impactLight()`, `impactMedium()`, `impactHeavy()`, `notificationSuccess()`, `notificationWarning()`, and `notificationError()` on Android without `expo-haptics` routes safely to calibrated `Vibration.vibrate` patterns (10ms, 15ms, 35ms, 60ms, `[0,30,60,40]`, `[0,50,50,50]`, `[0,80,50,80,50,120]`).
   - Native exception protection: `try/catch` wrappers prevent crashes if native `Vibration` throws security or hardware errors.
   - Platform filtering: `Platform.OS === 'web'` and `setEnabled(false)` cleanly suppress vibrations without overhead.
   - High-frequency stress: 500 rapid alternating haptic triggers executed in < 30ms without memory leak or degradation.

2. **Modal BackHandler `onRequestClose` Callbacks (7/7 Passed)**:
   - All 6 target modals declare valid `onRequestClose` handlers in source code:
     - `OperationsScreen.tsx:581` -> `onRequestClose={() => setActiveJob(null)}`
     - `SurveysModule.tsx:202` -> `onRequestClose={() => setScheduleSurveyModal(false)}`
     - `InvoicingModule.tsx:315` -> `onRequestClose={() => setPaymentModalVisible(false)}`
     - `LoginScreen.tsx:237` -> `onRequestClose={() => setResetModalVisible(false)}`
     - `LeadsScreen.tsx:464` -> `onRequestClose={() => setAddModalVisible(false)}`
     - `FinanceScreen.tsx:867` -> `onRequestClose={() => setPaymentModalVisible(false)}`
   - Rapid back button simulation: 200 consecutive invocations executed without unhandled errors.

3. **Monotonic Stage Gating (3/3 Passed)**:
   - Project `STAGE_ORDER` contains canonical monotonic hierarchy (`SURVEY: 1` through `COMMISSION: 7`).
   - When server responds with 409 Conflict during stage replay, the client evaluates it as `MONOTONIC_PASS`, logs to conflict audit log, and evicts it from the queue without regressing server state.

4. **Exponential Backoff with 60s Cap & Jitter (4/4 Passed)**:
   - Backoff duration doubles accurately: 4s -> 8s -> 16s -> 32s -> 60s cap.
   - `Math.floor(Math.random() * 1000)` jitter is correctly bounded.
   - Unelapsed mutations are skipped during normal sync; elapsed mutations are processed.
   - `retryFailed()` resets failed items to `PENDING` with `retryCount = 0`.

5. **SWR Caching Resilience (5/5 Passed)**:
   - `@solar_cache_*` immediately returns cached payloads when offline.
   - Age check flags `isStale: false` (< 7 days) and `isStale: true` (> 7 days) while always providing data payload to field technicians.
   - `clearCache()` flushes all 5 domain keys cleanly.

6. **Legacy API Backward Compatibility (3/3 Passed)**:
   - 100% fidelity preserved for `getDraftLeads`, `saveDraftLead`, `deleteDraftLead`, `getDraftQuotes`, `saveDraftQuote`, `deleteDraftQuote`, and `getOfflineStats`.

---

## Final Verdict & Recommendation

**Verdict**: **REQUEST_CHANGES**

**Recommended Action**:
Block Milestone M4 graduation until Worker M4 remediates:
1. Multi-tenant queue isolation in `offlineSyncService.ts` (`syncQueue` tenant filtering).
2. Caller-provided `idempotencyKey` retention in `enqueueMutation`.
3. Re-execution of `mobile-app/tests/tier5-m4-offline-haptics-stress.js` achieving **32 / 32 tests (100%) PASSING**.
