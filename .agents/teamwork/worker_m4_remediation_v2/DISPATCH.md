## 2026-10-30T15:24:31Z

You are Worker M4 Remediation (Remediation Worker) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Read Gate Status at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\GATE_STATUS.md`
4. Read Explorer M4 Remediation's blueprint and surgical diffs at:
   `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_remediation\analysis.md`
   `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_remediation\handoff.md`
5. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_remediation_v2\`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Remediation Tasks
Follow the exact line-by-line surgical blueprint in `explorer_m4_remediation/analysis.md`:

### 1. `mobile-app/src/services/offlineSyncService.ts`:
- **Caller Idempotency Key Retention & Pre-enqueue Deduplication**:
  - Add `idempotencyKey?: string` to parameter types of `enqueueMutation`.
  - In `enqueueMutation`, if a pending or syncing mutation with the identical `idempotencyKey` already exists in `@solar_offline_queue`, do NOT add a duplicate; return the existing mutation's ID.
  - In `newMutation` construction, retain `params.idempotencyKey` if provided:
    `idempotencyKey: (params as any).idempotencyKey || ('idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9))`
- **Multi-Tenant Queue Isolation in `syncQueue`**:
  - Update `syncQueue(options?: { force?: boolean; tenantId?: string })` to accept `tenantId`.
  - If `options?.tenantId` is omitted, resolve `targetTenantId` by reading `@solar_user_profile` from `SafeStorage`.
  - Filter `pending` mutations so that:
    `const pending = queue.filter((m) => (m.status === 'PENDING' || (options?.force && m.status === 'FAILED')) && (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId));`
  - In `retryFailed` and `syncAllDrafts`, accept and forward `tenantId?: string` to `syncQueue()`.

### 2. `mobile-app/src/context/AuthContext.tsx`:
- In the network connectivity listener `useEffect`, pass `{ tenantId: user?.tenantId || undefined }` when invoking `syncQueue()`.
- Add `user?.tenantId` to the `useEffect` dependency array.

## Verification Requirements
Run and verify all 4 verification commands:
1. `node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js` — MUST pass 32 / 32 tests (100% success).
2. `cmd /c "cd mobile-app && npx tsc --noEmit"` — MUST compile with 0 errors.
3. `node mobile-app/test-perspectives.js` — MUST pass 23 / 23 tests (100% success).
4. `node mobile-app/test-e2e.js` — MUST pass 184 / 184 tests (100% success).

## Output Requirements
Write your detailed implementation log to `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_remediation_v2\progress.md` and complete handoff report to `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_remediation_v2\handoff.md`. Send message to orchestrator with full test verification output. Do NOT cheat.
