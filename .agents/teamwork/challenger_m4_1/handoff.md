# Milestone M4 Challenger Handoff Report: Haptics & Offline Queue Stress Verification

**Role**: EMPIRICAL CHALLENGER (M4-1)  
**Milestone**: M4 (Native Android Interactions, Performance & Layout Validation)  
**Status**: COMPLETE  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### Verbatim Test Execution Command & Output
Test Command:
```bash
node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js
# and standalone
node mobile-app/tests/tier5-m4-offline-haptics-stress.js
```

Verbatim Results:
```text
▶ Suite 1: Native Haptics Resilience & Calibrated Vibration Fallback
  ✔ 1.1 should safely export haptics singleton and enum definitions (207.3872ms)
  ✔ 1.2 should route all 7 triggers to calibrated Vibration patterns on Android when expo-haptics is absent (60.5993ms)
  ✔ 1.3 should not crash if native Vibration module throws hardware / permission exceptions (40.4179ms)
  ✔ 1.4 should suppress all vibrations when setEnabled(false) (39.828ms)
  ✔ 1.5 should suppress vibrations on web platform (Platform.OS === "web") (53.5447ms)
  ✔ 1.6 should route to expo-haptics when available and handle rejected promises safely (55.3328ms)
  ✔ 1.7 should survive 500 rapid alternating haptic triggers in <100ms without memory leak (26.7937ms)
✔ Suite 1: Native Haptics Resilience & Calibrated Vibration Fallback (488.5456ms)
▶ Suite 2: Modal BackHandler onRequestClose Callbacks Verification
  ✔ 2.1 should verify OperationsScreen contains onRequestClose binding for modal hardware back dismissal (68.524ms)
  ✔ 2.2 should verify SurveysModule contains onRequestClose binding for modal hardware back dismissal (13.3873ms)
  ✔ 2.3 should verify InvoicingModule contains onRequestClose binding for modal hardware back dismissal (1.1386ms)
  ✔ 2.4 should verify LoginScreen contains onRequestClose binding for modal hardware back dismissal (10.1804ms)
  ✔ 2.5 should verify LeadsScreen contains onRequestClose binding for modal hardware back dismissal (10.771ms)
  ✔ 2.6 should verify FinanceScreen contains onRequestClose binding for modal hardware back dismissal (22.6277ms)
  ✔ 2.7 should stress-test all 6 modal onRequestClose callbacks under 200 rapid simulated hardware back presses (1.7696ms)
✔ Suite 2: Modal BackHandler onRequestClose Callbacks Verification (130.5569ms)
▶ Suite 3: Offline Queue Monotonic Stage Gating & Conflict Resolution
  ✔ 3.1 should enforce canonical project STAGE_ORDER hierarchy (180.4612ms)
  ✔ 3.2 should resolve 409 conflict on UPDATE_PROJECT_STAGE as MONOTONIC_PASS and clear from queue (150.5129ms)
  ✔ 3.3 should resolve 409 conflict on non-stage mutation (e.g. CREATE_LEAD) as SERVER_WINS without discarding immediately (142.9002ms)
✔ Suite 3: Offline Queue Monotonic Stage Gating & Conflict Resolution (474.7977ms)
▶ Suite 4: Exponential Backoff, Jitter & Retry Scheduling
  ✔ 4.1 should calculate backoff duration doubling up to 60s cap with jitter (8.2734ms)
  ✔ 4.2 should skip unelapsed backoff window during regular sync and process when elapsed (78.1278ms)
  ✔ 4.3 should transition to status FAILED when retryCount reaches maxRetries (59.0302ms)
  ✔ 4.4 should reset failed mutations to PENDING via retryFailed() (81.3001ms)
✔ Suite 4: Exponential Backoff, Jitter & Retry Scheduling (227.8702ms)
▶ Suite 5: SWR Caching Resilience for Offline Field Access
  ✔ 5.1 should write data with ISO timestamp to @solar_cache_<key> (79.6219ms)
  ✔ 5.2 should return fresh cached response with isStale: false (<7 days) (72.4712ms)
  ✔ 5.3 should return stale cached response with isStale: true (>7 days) but preserve data payload for field tech (49.8157ms)
  ✔ 5.4 should return null for non-existent cache keys (59.9183ms)
  ✔ 5.5 should clear all domain cache keys via clearCache() (54.0449ms)
✔ Suite 5: SWR Caching Resilience for Offline Field Access (318.9501ms)
▶ Suite 6: Legacy API Backward Compatibility Verification
  ✔ 6.1 should maintain 100% fidelity for saveDraftLead, getDraftLeads, and deleteDraftLead (48.3104ms)
  ✔ 6.2 should maintain 100% fidelity for saveDraftQuote, getDraftQuote, getDraftQuotes, deleteDraftQuote (63.0037ms)
  ✔ 6.3 should return comprehensive metrics from getOfflineStats() when offline (80.8357ms)
✔ Suite 6: Legacy API Backward Compatibility Verification (193.019ms)

  [Adversarial Evaluation] Multi-tenant sync filter supported? NO (Vulnerability Detected: Tenant A mutation leaked to Tenant B session)
▶ Suite 7: Adversarial Multi-Tenant Isolation & Idempotency Stress
  ✖ 7.1 [ADVERSARIAL] Multi-tenant isolation: mutations queued for tenant A must not be sent under tenant B (78.0195ms)

  [Adversarial Evaluation] Caller idempotencyKey retained? Expected: "idem_lead_custom_uuid_884920", Actual: "idem_1793372676833_u420bzb"
  ✖ 7.2 [ADVERSARIAL] Idempotency Key Retention: caller-provided idempotencyKey must not be overwritten with random key (62.086ms)
  ✔ 7.3 [ADVERSARIAL] Duplicate Replay: identical mutations must not generate duplicate records on server (53.9497ms)
✖ Suite 7: Adversarial Multi-Tenant Isolation & Idempotency Stress (196.3241ms)
ℹ tests 32
ℹ suites 7
ℹ pass 30
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2048.9468

✖ failing tests:

test at mobile-app\tests\tier5-m4-offline-haptics-stress.js:894:3
✖ 7.1 [ADVERSARIAL] Multi-tenant isolation: mutations queued for tenant A must not be sent under tenant B (78.0195ms)
  AssertionError [ERR_ASSERTION]: CRITICAL VULNERABILITY: offlineSyncService.syncQueue executed Tenant A mutation when active tenant is Tenant B! Tenant isolation is NOT enforced in queue replay.

test at mobile-app\tests\tier5-m4-offline-haptics-stress.js:948:3
✖ 7.2 [ADVERSARIAL] Idempotency Key Retention: caller-provided idempotencyKey must not be overwritten with random key (62.086ms)
  AssertionError [ERR_ASSERTION]: VULNERABILITY: enqueueMutation ignored caller-provided idempotencyKey ("idem_lead_custom_uuid_884920") and replaced it with a newly generated random string ("idem_1793372676833_u420bzb"). This breaks client-side duplicate prevention!
```

### Exact Code Surfaces with Defects
1. `mobile-app/src/services/offlineSyncService.ts:246–325` (`syncQueue`):
   - `syncQueue(options?: { force?: boolean })` does not accept `tenantId`.
   - `pending` does not filter by mutation `tenantId` or current active user session tenant.
   - When User B logs in, Tenant A's mutations are replayed with Tenant B's credentials and sent to Tenant B's backend endpoints.
2. `mobile-app/src/services/offlineSyncService.ts:195` (`enqueueMutation`):
   - Line 195 unconditionally sets `idempotencyKey: \`idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}\``.
   - `params.idempotencyKey` is completely ignored and overwritten.

---

## 2. Logic Chain

1. **Direct Observation**: In `offlineSyncService.ts` line 185–201, `newMutation` accepts `params.tenantId` and saves it to `@solar_offline_queue`.
2. **Direct Observation**: In `offlineSyncService.ts` line 246–285, `syncQueue` retrieves all mutations with status `'PENDING'` without filtering against the active tenant.
3. **Direct Observation**: In `mobile-app/src/api/client.ts` line 104–115, `apiClient` attaches the active Bearer token stored in `@solar_user_token` for all requests.
4. **Logical Inference**: If User A from Tenant A queues mutations offline, logs out, and User B from Tenant B logs in, the next reconnection triggers `offlineSyncService.syncQueue()` (via `AuthContext.tsx` line 104). Tenant A's pending mutations are replayed with Tenant B's Bearer token. This cross-tenant mutation transmission breaches multi-tenant isolation.
5. **Direct Observation**: In `offlineSyncService.ts` line 195, `idempotencyKey` is hardcoded to generate a new random string on every invocation.
6. **Logical Inference**: Any caller or screen that supplies an `idempotencyKey` to deduplicate retried form submissions will have its key overwritten with a random value, destroying idempotency guarantees on the server.

---

## 3. Caveats

- Tests 1.1 through 6.3 (30 tests) demonstrated that Worker M4's implementation of Haptics, modal BackHandler callbacks, monotonic stage gating, exponential backoff with jitter and 60s cap, SWR caching, and legacy draft backward compatibility is genuine and functional.
- The 2 failing tests are strictly architectural edge cases in `offlineSyncService.ts` regarding multi-tenant device sharing and client-controlled idempotency key propagation.

---

## 4. Conclusion

Milestone M4 cannot be approved in its current state due to the **Critical Multi-Tenant Isolation Vulnerability** and the **Idempotency Key Invalidation Defect** in `offlineSyncService.ts`.

**Final Verdict**: **REQUEST_CHANGES**

### Required Changes for Worker M4:
1. **Fix Multi-Tenant Filtering in `offlineSyncService.ts`**:
   - Update `syncQueue(options?: { force?: boolean; tenantId?: string })` to accept `tenantId`.
   - In `syncQueue`, if `options?.tenantId` is not provided, read the current profile from `SafeStorage.getItem('@solar_user_profile')`.
   - Filter `pending` mutations so that only mutations matching the current active tenant (or mutations without a `tenantId`) are processed during the sync run:
     ```typescript
     const pending = queue.filter(
       (m) =>
         (m.status === 'PENDING' || (options?.force && m.status === 'FAILED')) &&
         (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)
     );
     ```
   - In `AuthContext.tsx`, pass `user.tenantId` when invoking `syncQueue({ tenantId: user.tenantId })`.
2. **Preserve Caller-Provided Idempotency Key in `enqueueMutation`**:
   - Update `enqueueMutation` parameter types to include `idempotencyKey?: string`.
   - Update line 195:
     ```typescript
     idempotencyKey: (params as any).idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
     ```
3. **Verify Remediation**:
   - Re-run `node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js`.
   - All 32 tests must pass with 0 failures (100% success).

---

## 5. Verification Method

To independently reproduce the findings:
```bash
# Run the adversarial stress suite (Must reproduce 30 PASS, 2 FAIL)
node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js
# or standalone:
node mobile-app/tests/tier5-m4-offline-haptics-stress.js
```
Invalidation Condition:
If the above command runs and outputs `32 / 32 tests pass (0 failures)`, the defects have been remediated.
