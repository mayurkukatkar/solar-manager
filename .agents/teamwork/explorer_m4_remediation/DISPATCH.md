## 2026-10-30T15:07:41Z
You are Explorer M4 Remediation (Remediation Strategy Explorer) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Read Gate Status at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\GATE_STATUS.md`
4. Read Challenger M4-1's failure findings at:
   `f:\Company Products\solar-manager\.agents\teamwork\challenger_m4_1\analysis.md`
   `f:\Company Products\solar-manager\.agents\teamwork\challenger_m4_1\handoff.md`
5. Read the failing test file:
   `mobile-app/tests/tier5-m4-offline-haptics-stress.js`
6. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_remediation\`

## Problem Investigation & Blueprint Scope
Challenger M4-1 ran `node --test mobile-app/tests/tier5-m4-offline-haptics-stress.js` and discovered 2 failing tests (30 passed, 2 failed):
1. **Critical Defect [Suite 7.1]**: `offlineSyncService.syncQueue()` does NOT filter or isolate mutations by `tenantId`.
   - When Tenant A queues mutations offline, logs out, and Tenant B logs in on the same device, reconnecting causes `offlineSyncService.syncQueue()` to send Tenant A's mutations under Tenant B's active session and Bearer token!
   - Required fix: Update `syncQueue(options?: { force?: boolean; tenantId?: string })` to accept `tenantId`. If `options?.tenantId` is omitted, fallback to reading the active profile from `SafeStorage.getItem('@solar_user_profile')`. Filter pending mutations by `targetTenantId`:
     ```typescript
     const pending = queue.filter((m) =>
       (m.status === 'PENDING' || (options?.force && m.status === 'FAILED')) &&
       (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)
     );
     ```
   - In `AuthContext.tsx`, pass `user.tenantId` when invoking `syncQueue({ tenantId: user.tenantId })`.
2. **High Defect [Suite 7.2]**: `offlineSyncService.enqueueMutation()` ignores caller-supplied `idempotencyKey` and unconditionally generates a new random string on line 195:
   `idempotencyKey: 'idem_' + Date.now() + '_' + Math.random().toString(36)...`
   - Required fix: In `enqueueMutation`, add `idempotencyKey?: string` to parameter options and retain the caller's key:
     ```typescript
     idempotencyKey: (params as any).idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
     ```
   - Deduplication: If a mutation with the same `idempotencyKey` already exists with status `PENDING` in the queue, avoid adding a duplicate and return the existing mutation ID.

## Output Requirements
Investigate `mobile-app/src/services/offlineSyncService.ts` and `mobile-app/src/context/AuthContext.tsx`, and construct a line-by-line, surgical remediation blueprint. Write your analysis to `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_remediation\analysis.md` and complete handoff report to `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_remediation\handoff.md`. Send message to orchestrator when complete. Do NOT modify source code.
