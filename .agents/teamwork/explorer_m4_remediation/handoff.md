# Milestone M4 Remediation Explorer Handoff Report: Offline Queue Isolation & Idempotency Strategy

**Role**: REMEDIATION STRATEGY EXPLORER (Explorer M4 Remediation)  
**Milestone**: M4 (Native Android Interactions, Performance & Layout Validation)  
**Status**: COMPLETE  
**Handoff Type**: Hard (Investigation complete with actionable blueprint)  

---

## 1. Observation

### Verbatim Test Execution Command & Failure Outputs
Command:
```bash
node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js
```
Tool Result (Exit code 1):
```text
▶ Suite 7: Adversarial Multi-Tenant Isolation & Idempotency Stress
  ✖ 7.1 [ADVERSARIAL] Multi-tenant isolation: mutations queued for tenant A must not be sent under tenant B (135.3184ms)
  AssertionError [ERR_ASSERTION]: CRITICAL VULNERABILITY: offlineSyncService.syncQueue executed Tenant A mutation when active tenant is Tenant B! Tenant isolation is NOT enforced in queue replay.
      at TestContext.<anonymous> (F:\Company Products\solar-manager\mobile-app\tests\tier5-m4-offline-haptics-stress.js:944:14)
      at async Test.run (node:internal/test_runner/test:1404:7)
      at async Promise.all (index 0)
      at async Suite.run (node:internal/test_runner/test:1889:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: undefined,
    operator: 'fail',
    diff: 'simple'
  }

  ✖ 7.2 [ADVERSARIAL] Idempotency Key Retention: caller-provided idempotencyKey must not be overwritten with random key (56.2822ms)
  AssertionError [ERR_ASSERTION]: VULNERABILITY: enqueueMutation ignored caller-provided idempotencyKey ("idem_lead_custom_uuid_884920") and replaced it with a newly generated random string ("idem_1793372953730_wg88rjc"). This breaks client-side duplicate prevention!
  + actual - expected
  
  + 'idem_1793372953730_wg88rjc'
  - 'idem_lead_custom_uuid_884920'
          ^
  
      at TestContext.<anonymous> (F:\Company Products\solar-manager\mobile-app\tests\tier5-m4-offline-haptics-stress.js:965:12)
      at async Test.run (node:internal/test_runner/test:1404:7)
      at async Suite.processPendingSubtests (node:internal/test_runner/test:969:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 'idem_1793372953730_wg88rjc',
    expected: 'idem_lead_custom_uuid_884920',
    operator: 'strictEqual',
    diff: 'simple'
  }

ℹ tests 32
ℹ suites 7
ℹ pass 30
ℹ fail 2
```

### Exact Code Surface Observations
1. `mobile-app/src/services/offlineSyncService.ts:246–262`:
   ```typescript
   async syncQueue(options?: { force?: boolean }): Promise<SyncResult> {
     ...
     const queue = await this.getQueue();
     const pending = queue.filter((m) => m.status === 'PENDING' || (options?.force && m.status === 'FAILED'));
   ```
   Observation: `syncQueue` does not accept `tenantId` in options, does not inspect `@solar_user_profile`, and filters pending mutations purely on status, replaying all queued mutations irrespective of tenant ownership.
2. `mobile-app/src/services/offlineSyncService.ts:118–131 & 185–195`:
   ```typescript
   idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
   ```
   Observation: `enqueueMutation` parameters omit `idempotencyKey`, unconditionally overwriting caller-provided keys with a random string and failing to deduplicate duplicate submissions with the same idempotency key.
3. `mobile-app/src/context/AuthContext.tsx:103–105`:
   ```typescript
   if (isOnline) {
     offlineSyncService.syncQueue().catch(() => {});
   }
   ```
   Observation: The network connectivity listener invokes `syncQueue()` without passing the active user's `tenantId`, and `useEffect` does not list `user?.tenantId` in its dependency array.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1)**: In `offlineSyncService.ts:261`, `pending = queue.filter(...)` selects all mutations matching `m.status === 'PENDING'` across all tenants.
2. **Premise 2 (Observation 3)**: In `client.ts:104–115`, `apiClient` automatically attaches the active user's Bearer token from `@solar_user_token`.
3. **Inference 1**: When Tenant A queues mutations offline, logs out, and Tenant B logs in on the same shared device, reconnecting to the internet causes `syncQueue()` to send Tenant A's pending mutations to Tenant B's backend using Tenant B's authentication credentials.
4. **Conclusion 1**: Multi-tenant isolation requires `syncQueue(options?: { force?: boolean; tenantId?: string })` to resolve `targetTenantId` (from options or `@solar_user_profile`) and filter `pending` mutations so that `(!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)`. Mutations of other tenants must remain untouched in the persistent queue for future sessions.
5. **Premise 3 (Observation 2)**: In `offlineSyncService.ts:195`, caller-supplied `idempotencyKey` values are overwritten by an auto-generated random string, preventing client deduplication.
6. **Inference 2**: When a client application or form attempts to deduplicate rapid duplicate submissions using a fixed UUID/timestamp key, both submissions receive distinct random keys and are posted twice.
7. **Conclusion 2**: `enqueueMutation` must accept `idempotencyKey?: string`, return existing pending/syncing mutations matching the same key (deduplication), and preserve the caller's key during `newMutation` construction.

---

## 3. Caveats

- **No Caveats Regarding Scope**: The defect boundaries are strictly confined to `offlineSyncService.ts` and `AuthContext.tsx`.
- **Backward Compatibility**: In situations where `tenantId` is undefined (such as legacy unit tests or single-tenant deployments), `(!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)` evaluates to true, guaranteeing zero breaking changes to existing functionality.
- **Deduplication Scope**: Client-side deduplication in `enqueueMutation` checks against mutations with status `'PENDING'` or `'SYNCING'`. Completed mutations are evicted upon successful sync, leaving server-side deduplication (via `X-Idempotency-Key` header) to handle replay conflicts (verified passing in Suite 7.3).

---

## 4. Conclusion

Milestone M4 remediation requires surgical updates to two files:
1. `mobile-app/src/services/offlineSyncService.ts`:
   - Add `idempotencyKey?: string` to `enqueueMutation` parameter types and retain `params.idempotencyKey` when creating `newMutation`.
   - Add pre-enqueue deduplication lookup returning existing pending/syncing mutation.
   - Update `syncQueue(options?: { force?: boolean; tenantId?: string })` to resolve `targetTenantId` (explicit parameter or `@solar_user_profile` fallback) and filter `pending` items.
   - Update helper signatures (`retryFailed`, `syncAllDrafts`) to forward optional `tenantId`.
2. `mobile-app/src/context/AuthContext.tsx`:
   - Pass `{ tenantId: user?.tenantId || undefined }` in the network listener call to `syncQueue()`.
   - Add `user?.tenantId` to the `useEffect` dependency array.
   - Trigger opportunistic sync upon successful user login.

A complete line-by-line diff and replacement blueprint has been written to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_remediation\analysis.md`.

---

## 5. Verification Method

To independently verify the defects and validate the upcoming fix by Worker M4:

```bash
# 1. Run Challenger M4-1's empirical stress test suite (Target: 32 / 32 PASS)
node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js

# 2. Run Challenger M4-2's virtualization and layout suite (Target: 29 / 29 PASS)
node --test mobile-app/tests/tier5-m4-virtualization-layout-stress.js

# 3. Run full automated perspective verification suite (Target: 23 / 23 PASS)
node mobile-app/test-perspectives.js

# 4. Run TypeScript strict type-check (Target: 0 compilation errors)
node mobile-app/node_modules/typescript/bin/tsc --noEmit --project mobile-app/tsconfig.json
```

**Invalidation Conditions**:
- If `offlineSyncService.syncQueue({ tenantId: 'tenant_solar_co_B' })` sends any request with Tenant A payload data, Test 7.1 will fail.
- If `enqueueMutation` returns an `idempotencyKey` different from `callerProvidedKey`, Test 7.2 will fail.
