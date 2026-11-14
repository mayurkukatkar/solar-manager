# Milestone M4 Remediation Blueprint: Multi-Tenant Queue Isolation & Idempotency Key Retention

**Role**: REMEDIATION STRATEGY EXPLORER (Explorer M4 Remediation)  
**Date**: 2026-10-30  
**Target Milestone**: M4 — Native Android Interactions, Performance & Layout Validation  
**Target Files**:
- `mobile-app/src/services/offlineSyncService.ts`
- `mobile-app/src/context/AuthContext.tsx`  
**Target Test Suite**: `mobile-app/tests/tier5-m4-offline-haptics-stress.js`  
**Baseline Test Status**: 30 PASS, 2 FAIL (Suite 7.1 Multi-Tenant Leak & Suite 7.2 Idempotency Invalidation)

---

## 1. Executive Summary & Root Cause Analysis

Empirical stress testing conducted by Challenger M4-1 and reproduced in this investigation identified two specific defects in the offline mutation replay subsystem:

### Defect 1 [CRITICAL]: Multi-Tenant Isolation Breach in `offlineSyncService.syncQueue()`
- **Observed Behavior**:
  - `QueuedMutation` records include `tenantId?: string`.
  - However, `offlineSyncService.syncQueue()` accepts only `options?: { force?: boolean }` and retrieves all mutations with `status === 'PENDING'` regardless of tenant ownership (lines 260–261).
  - In a shared Android device scenario (common among solar field technicians, contractors, and site supervisors), Technician A queues project updates or lead captures offline under Tenant A (`tenant_solar_co_A`). Technician A logs out. Technician B logs in under Tenant B (`tenant_solar_co_B`).
  - When network connectivity is restored, `AuthContext` network listener calls `offlineSyncService.syncQueue()`.
  - Because `syncQueue()` does not filter by `tenantId`, Tenant A's pending mutations are replayed using `apiClient.request()`, which attaches Tenant B's active Bearer token (`@solar_user_token`).
  - **Impact**: Cross-tenant data leakage, unauthorized data injection into Tenant B's backend database, and severe violation of SaaS data partitioning boundaries.
- **Root Cause**:
  `syncQueue()` lacks tenant filtering logic and does not read or accept the active session's `tenantId`.

### Defect 2 [HIGH]: Caller `idempotencyKey` Overwrite in `offlineSyncService.enqueueMutation()`
- **Observed Behavior**:
  - In `offlineSyncService.ts` lines 118–131, the `enqueueMutation` options type omits `idempotencyKey?: string`.
  - In line 195, `idempotencyKey` is unconditionally overwritten with a newly generated random string:
    ```typescript
    idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ```
  - When UI screens (e.g., LeadCaptureModal, InstallationQAModal) generate a deterministic client-side idempotency key (`idem_lead_custom_uuid_...`) to guard against rapid double-taps or offline duplicate submissions, the caller's key is discarded and replaced with a random key.
  - Furthermore, no client-side deduplication check exists in `enqueueMutation` to prevent duplicate submissions with the same idempotency key from accumulating in `@solar_offline_queue`.
- **Root Cause**:
  Parameter typing ignores `idempotencyKey`, object construction overwrites caller input, and no pre-enqueue deduplication lookup is performed.

---

## 2. Empirical Verification & Failure Reproduction

Running `node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js` reproduces the exact 2 failures:

```text
▶ Suite 7: Adversarial Multi-Tenant Isolation & Idempotency Stress
  ✖ 7.1 [ADVERSARIAL] Multi-tenant isolation: mutations queued for tenant A must not be sent under tenant B (135.3184ms)
  AssertionError [ERR_ASSERTION]: CRITICAL VULNERABILITY: offlineSyncService.syncQueue executed Tenant A mutation when active tenant is Tenant B! Tenant isolation is NOT enforced in queue replay.
      at TestContext.<anonymous> (mobile-app/tests/tier5-m4-offline-haptics-stress.js:944:14)

  ✖ 7.2 [ADVERSARIAL] Idempotency Key Retention: caller-provided idempotencyKey must not be overwritten with random key (56.2822ms)
  AssertionError [ERR_ASSERTION]: VULNERABILITY: enqueueMutation ignored caller-provided idempotencyKey ("idem_lead_custom_uuid_884920") and replaced it with a newly generated random string ("idem_1793372953730_wg88rjc"). This breaks client-side duplicate prevention!
  + actual - expected
  + 'idem_1793372953730_wg88rjc'
  - 'idem_lead_custom_uuid_884920'
      at TestContext.<anonymous> (mobile-app/tests/tier5-m4-offline-haptics-stress.js:965:12)

ℹ tests 32
ℹ suites 7
ℹ pass 30
ℹ fail 2
```

### Baseline Health Verification
All other subsystems are healthy:
- Suites 1–6 (30/30 tests) in `tier5-m4-offline-haptics-stress.js`: **PASS**
- `tier5-m4-virtualization-layout-stress.js`: **29/29 PASS**
- `test-perspectives.js`: **23/23 PASS**
- TypeScript compilation (`node node_modules/typescript/bin/tsc --noEmit --project mobile-app/tsconfig.json`): **0 ERRORS**

---

## 3. Surgical Remediation Blueprint: `mobile-app/src/services/offlineSyncService.ts`

### Change 3.1: Support `idempotencyKey` and Client-Side Deduplication in `enqueueMutation`

**Location**: Lines 117–211

#### A. Type Definition Update (Lines 117–146)
Add `idempotencyKey?: string;` to both `paramsOrType` union definition and `params` local variable definition.

```typescript
<<<< BEFORE (lines 117-146)
  async enqueueMutation<T>(
    paramsOrType:
      | OfflineMutationType
      | {
          type: OfflineMutationType;
          endpoint: string;
          method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
          payload: T;
          entityId?: string;
          entityType?: 'lead' | 'project' | 'installation' | 'invoice';
          localTempId?: string;
          tenantId?: string;
          userId?: string;
          maxRetries?: number;
        },
    legacyPayload?: T,
    legacyEndpoint?: string
  ): Promise<QueuedMutation<T>> {
    let params: {
      type: OfflineMutationType;
      endpoint: string;
      method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      payload: T;
      entityId?: string;
      entityType?: 'lead' | 'project' | 'installation' | 'invoice';
      localTempId?: string;
      tenantId?: string;
      userId?: string;
      maxRetries?: number;
    };
====
>>>> AFTER
  async enqueueMutation<T>(
    paramsOrType:
      | OfflineMutationType
      | {
          type: OfflineMutationType;
          endpoint: string;
          method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
          payload: T;
          entityId?: string;
          entityType?: 'lead' | 'project' | 'installation' | 'invoice';
          localTempId?: string;
          tenantId?: string;
          userId?: string;
          maxRetries?: number;
          idempotencyKey?: string;
        },
    legacyPayload?: T,
    legacyEndpoint?: string
  ): Promise<QueuedMutation<T>> {
    let params: {
      type: OfflineMutationType;
      endpoint: string;
      method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      payload: T;
      entityId?: string;
      entityType?: 'lead' | 'project' | 'installation' | 'invoice';
      localTempId?: string;
      tenantId?: string;
      userId?: string;
      maxRetries?: number;
      idempotencyKey?: string;
    };
```

#### B. Deduplication & Idempotency Key Retention (Lines 184–211)
- If caller provides `params.idempotencyKey`, check if a mutation with the same `idempotencyKey` already exists with status `'PENDING'` or `'SYNCING'`. If so, return that mutation immediately without appending to the queue.
- In `newMutation`, retain `params.idempotencyKey` if provided; otherwise generate default `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`.
- In the background sync call, forward `tenantId` if known (`this.syncQueue(params.tenantId ? { tenantId: params.tenantId } : undefined)`).

```typescript
<<<< BEFORE (lines 184-211)
    const queue = await this.getQueue();
    const newMutation: QueuedMutation<T> = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      endpoint: params.endpoint,
      method: params.method || 'POST',
      payload: params.payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: params.maxRetries || 5,
      status: 'PENDING',
      idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      entityId: params.entityId,
      entityType: params.entityType,
      localTempId: params.localTempId,
      tenantId: params.tenantId,
      userId: params.userId,
    };

    const updated = [...queue, newMutation];
    await SafeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    this.notifySubscribers(updated);

    // Opportunistic background sync trigger
    this.syncQueue().catch(() => {});

    return newMutation;
====
>>>> AFTER
    const queue = await this.getQueue();

    // Client-side idempotency deduplication: avoid duplicate entries in queue
    if (params.idempotencyKey) {
      const existing = queue.find(
        (m) =>
          m.idempotencyKey === params.idempotencyKey &&
          (m.status === 'PENDING' || m.status === 'SYNCING')
      );
      if (existing) {
        return existing as QueuedMutation<T>;
      }
    }

    const newMutation: QueuedMutation<T> = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      endpoint: params.endpoint,
      method: params.method || 'POST',
      payload: params.payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: params.maxRetries || 5,
      status: 'PENDING',
      idempotencyKey:
        params.idempotencyKey ||
        `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      entityId: params.entityId,
      entityType: params.entityType,
      localTempId: params.localTempId,
      tenantId: params.tenantId,
      userId: params.userId,
    };

    const updated = [...queue, newMutation];
    await SafeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    this.notifySubscribers(updated);

    // Opportunistic background sync trigger (scoped to mutation tenant if specified)
    this.syncQueue(params.tenantId ? { tenantId: params.tenantId } : undefined).catch(() => {});

    return newMutation;
```

---

### Change 3.2: Multi-Tenant Queue Isolation in `syncQueue()`

**Location**: Lines 246–275

#### Signature & Filtering Logic
- Update signature to `syncQueue(options?: { force?: boolean; tenantId?: string }): Promise<SyncResult>`.
- Resolve `targetTenantId`:
  1. Use `options?.tenantId` if explicitly provided.
  2. Fall back to reading active profile from `SafeStorage.getItem('@solar_user_profile')`.
  3. If neither is present (e.g., backward-compatible tests or legacy unauthenticated calls), leave `targetTenantId` as `undefined`.
- Filter `pending`:
  ```typescript
  const pending = queue.filter(
    (m) =>
      (m.status === 'PENDING' || (options?.force && m.status === 'FAILED')) &&
      (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)
  );
  ```
- Retain inactive tenant mutations safely in `remainingQueue` during replay and storage persistence.

```typescript
<<<< BEFORE (lines 246-275)
  async syncQueue(options?: { force?: boolean }): Promise<SyncResult> {
    if (isSyncInProgress) {
      const q = await this.getQueue();
      return {
        total: q.length,
        synced: 0,
        failed: 0,
        conflicted: 0,
        remaining: q.filter((m) => m.status === 'PENDING').length,
        results: [],
      };
    }

    isSyncInProgress = true;
    const queue = await this.getQueue();
    const pending = queue.filter((m) => m.status === 'PENDING' || (options?.force && m.status === 'FAILED'));

    const result: SyncResult = {
      total: pending.length,
      synced: 0,
      failed: 0,
      conflicted: 0,
      remaining: pending.length,
      results: [],
    };

    if (pending.length === 0) {
      isSyncInProgress = false;
      return result;
    }
====
>>>> AFTER
  async syncQueue(options?: { force?: boolean; tenantId?: string }): Promise<SyncResult> {
    if (isSyncInProgress) {
      const q = await this.getQueue();
      return {
        total: q.length,
        synced: 0,
        failed: 0,
        conflicted: 0,
        remaining: q.filter((m) => m.status === 'PENDING').length,
        results: [],
      };
    }

    // Resolve target tenant ID: explicit options take precedence, falling back to active user profile
    let targetTenantId = options?.tenantId;
    if (!targetTenantId) {
      try {
        const rawProfile = await SafeStorage.getItem('@solar_user_profile');
        if (rawProfile) {
          const profile = JSON.parse(rawProfile);
          targetTenantId = profile?.tenantId || undefined;
        }
      } catch {
        // Fallback: targetTenantId remains undefined for unrestricted sync
      }
    }

    isSyncInProgress = true;
    const queue = await this.getQueue();
    const pending = queue.filter(
      (m) =>
        (m.status === 'PENDING' || (options?.force && m.status === 'FAILED')) &&
        (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)
    );

    const result: SyncResult = {
      total: pending.length,
      synced: 0,
      failed: 0,
      conflicted: 0,
      remaining: pending.length,
      results: [],
    };

    if (pending.length === 0) {
      isSyncInProgress = false;
      return result;
    }
```

---

### Change 3.3: Tenant Scoping for `retryFailed()` and `syncAllDrafts()`

**Location**: Lines 429–440 and Lines 659–666

Update helper methods to forward optional `tenantId`:

```typescript
<<<< BEFORE (lines 429-440)
  async retryFailed(): Promise<SyncResult> {
    const queue = await this.getQueue();
    const reset = queue.map((m) => {
      if (m.status === 'FAILED' || m.status === 'CONFLICT') {
        return { ...m, status: 'PENDING' as MutationStatus, retryCount: 0 };
      }
      return m;
    });
    await SafeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(reset));
    this.notifySubscribers(reset);
    return this.syncQueue({ force: true });
  },
====
>>>> AFTER
  async retryFailed(options?: { tenantId?: string }): Promise<SyncResult> {
    const queue = await this.getQueue();
    const reset = queue.map((m) => {
      if (
        (m.status === 'FAILED' || m.status === 'CONFLICT') &&
        (!options?.tenantId || !m.tenantId || m.tenantId === options.tenantId)
      ) {
        return { ...m, status: 'PENDING' as MutationStatus, retryCount: 0 };
      }
      return m;
    });
    await SafeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(reset));
    this.notifySubscribers(reset);
    return this.syncQueue({ force: true, tenantId: options?.tenantId });
  },
```

```typescript
<<<< BEFORE (lines 659-666)
  async syncAllDrafts(): Promise<{ syncedLeads: number; failedLeads: number; syncResult: SyncResult }> {
    const syncResult = await this.syncQueue({ force: true });
    return {
      syncedLeads: syncResult.synced,
      failedLeads: syncResult.failed,
      syncResult,
    };
  },
====
>>>> AFTER
  async syncAllDrafts(options?: { tenantId?: string }): Promise<{ syncedLeads: number; failedLeads: number; syncResult: SyncResult }> {
    const syncResult = await this.syncQueue({ force: true, tenantId: options?.tenantId });
    return {
      syncedLeads: syncResult.synced,
      failedLeads: syncResult.failed,
      syncResult,
    };
  },
```

---

## 4. Surgical Remediation Blueprint: `mobile-app/src/context/AuthContext.tsx`

### Change 4.1: Pass `user.tenantId` to Network Listener and Re-bind on Profile Update

**Location**: Lines 97–113

When network status changes to online, pass `{ tenantId: user?.tenantId || undefined }` to `syncQueue()`. Include `user?.tenantId` in the `useEffect` dependency array so the listener closes over the active tenant ID whenever the user logs in or switches sessions.

```typescript
<<<< BEFORE (lines 97-113)
    const removeNetListener = addNetworkStatusListener((isOnline) => {
      setBackendStatus((prev) => ({
        ...prev,
        isOnline,
        lastChecked: new Date().toLocaleTimeString(),
      }));
      if (isOnline) {
        offlineSyncService.syncQueue().catch(() => {});
      }
    });

    initSession();

    return () => {
      removeNetListener();
    };
  }, [handleSessionExpiry, handleAccountSuspended]);
====
>>>> AFTER
    const removeNetListener = addNetworkStatusListener((isOnline) => {
      setBackendStatus((prev) => ({
        ...prev,
        isOnline,
        lastChecked: new Date().toLocaleTimeString(),
      }));
      if (isOnline) {
        offlineSyncService.syncQueue({ tenantId: user?.tenantId || undefined }).catch(() => {});
      }
    });

    initSession();

    return () => {
      removeNetListener();
    };
  }, [handleSessionExpiry, handleAccountSuspended, user?.tenantId]);
```

### Change 4.2: Trigger Opportunistic Tenant Sync on Successful Login

**Location**: Lines 271–274

Immediately after saving the active verified profile in `login()`, trigger `syncQueue({ tenantId: profile.tenantId || undefined })` so any pending offline mutations created for this tenant on this device are synchronized immediately upon authentication:

```typescript
<<<< BEFORE (lines 271-274)
        setUser(profile);
        await SafeStorage.setItem(STORAGE_USER_PROFILE_KEY, JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
====
>>>> AFTER
        setUser(profile);
        await SafeStorage.setItem(STORAGE_USER_PROFILE_KEY, JSON.stringify(profile));
        offlineSyncService.syncQueue({ tenantId: profile.tenantId || undefined }).catch(() => {});
        setIsLoading(false);
        return { success: true };
```

---

## 5. Verification & Test Plan

Worker M4 should execute the following verification commands after applying the blueprint:

1. **Adversarial Stress Suite Verification**:
   ```bash
   node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js
   ```
   *Expected Result*: **32 / 32 tests PASS (0 failures)**.
   Specifically:
   - Suite 7.1 PASS: Tenant A mutations remain in queue when Tenant B triggers sync; `sentRequests` remains empty.
   - Suite 7.2 PASS: `enqueueMutation` retains caller-provided `idempotencyKey` ("idem_lead_custom_uuid_884920").
   - Suite 7.3 PASS: Duplicate mutations are handled idempotently via `SERVER_WINS`.

2. **Virtualization & Layout Suite Verification**:
   ```bash
   node --test mobile-app/tests/tier5-m4-virtualization-layout-stress.js
   ```
   *Expected Result*: **29 / 29 tests PASS**.

3. **Perspective Suite Verification**:
   ```bash
   node mobile-app/test-perspectives.js
   ```
   *Expected Result*: **23 / 23 tests PASS**.

4. **TypeScript Zero-Regression Check**:
   ```bash
   node mobile-app/node_modules/typescript/bin/tsc --noEmit --project mobile-app/tsconfig.json
   ```
   *Expected Result*: **0 compilation errors**.
