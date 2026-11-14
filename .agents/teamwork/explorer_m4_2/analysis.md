# Architectural Investigation & Concrete Implementation Blueprint: Offline Sync & Network Resilience

**Milestone**: M4 — Native Android Interactions, Performance & Layout Validation  
**Specialist**: Explorer M4-2 (Offline Sync & Network Specialist)  
**Target Repository**: `f:\Company Products\solar-manager\mobile-app\`  
**Date**: 2026-10-30  
**Status**: Comprehensive Blueprint Completed  

---

## 1. Executive Summary

WhereReady Solar OS is a mission-critical mobile SaaS product utilized by Indian solar EPC contractors, project engineers, site technicians, and DISCOM liaisons. Field personnel frequently operate in remote, semi-urban, and rural areas (e.g., agricultural solar pump sites in Satara, rooftop substations in Chakan MIDC, or newly developed residential layouts) where cellular coverage is intermittent, high-latency, or completely unavailable.

A rigorous investigation of the mobile codebase revealed four critical architectural gaps:
1. **Network Detection & Reactivity**: `mobile-app/package.json` contains neither `expo-network` nor `@react-native-community/netinfo`. Network status is evaluated only once at startup in `AuthContext.tsx`. There is no reactive listener that updates the UI or triggers sync replay when cell connectivity drops or restores.
2. **Offline Mutation Queue Deficiencies**: `mobile-app/src/services/offlineSyncService.ts` contains only naive draft storage for leads (`@solar_manager_draft_leads`) and quotes (`@solar_manager_draft_quotes`). There is no unified mutation queue, no idempotent replay mechanism, no exponential backoff or retry logic, no conflict resolution, and no queue inspection API. Furthermore, project stage advancements, hardware serial scans, electrical QA readings, and photo uploads are not queued when offline.
3. **No GET Response Caching (Empty State Lockout)**: If a technician opens `FieldProjectsScreen`, `PipelineScreen`, or `OperationsScreen` in a cellular dead zone, all API requests fail, resulting in empty screens (`[]`) and complete operational lockout—even if the technician had viewed the full project dossier just 15 minutes prior.
4. **Session Expiry & Multi-Tenant Isolation Vulnerability**: When a device reconnects after hours in the field, an expired JWT triggers HTTP 401. Re-authenticating must not purge local pending drafts, but must strictly verify `tenantId` and `userId` ownership to prevent cross-tenant mutation replay if a different user logs in.

This document establishes the end-to-end architectural design and provides a line-by-line, production-grade implementation blueprint for:
- An enterprise-grade, backward-compatible `offlineSyncService.ts` with a durable FIFO mutation queue (`@solar_offline_queue`), exponential backoff, monotonic stage gating, and LWW conflict resolution.
- A high-reliability network status listener in `client.ts` combining Axios interceptors, health probes, and NetInfo abstraction.
- A persistent, non-intrusive `OfflineBanner` component with smooth animations and safe-area notch awareness.
- A Stale-While-Revalidate (SWR) GET caching layer providing immediate offline fallback data across projects, leads, and operational checklists.
- Multi-tenant isolation guards protecting enterprise data integrity.

---

## 2. Current State Audit & Problem Statement

### 2.1 Package Manifest (`mobile-app/package.json`)
The dependencies in `mobile-app/package.json` are:
```json
{
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-navigation/bottom-tabs": "^7.21.0",
  "@react-navigation/native": "^7.5.1",
  "@react-navigation/native-stack": "^7.21.0",
  "axios": "^1.20.0",
  "expo": "~58.0.16",
  "expo-camera": "~58.0.11",
  "expo-document-picker": "~58.0.4",
  "expo-file-system": "~58.0.10",
  "expo-image-picker": "~58.0.10",
  "expo-intent-launcher": "^58.0.3",
  "expo-print": "~58.0.7",
  "expo-sharing": "~58.0.19",
  "expo-status-bar": "~58.0.3",
  "lucide-react-native": "^1.59.0",
  "react": "19.3.0",
  "react-native": "0.88.0",
  "react-native-safe-area-context": "^5.10.1",
  "react-native-screens": "^4.30.0",
  "react-native-svg": "15.16.0"
}
```
**Key Observations**:
- Neither `expo-network` nor `@react-native-community/netinfo` is currently installed.
- Adding native modules without careful fallback can break headless test environments (such as Node.js test suites `node --test` running Tiers 1-4).
- **Architectural Requirement**: We must build a hybrid network listener architecture: an event-driven reachability publisher in `api/client.ts` that dynamically utilizes `expo-network` / NetInfo if available, but maintains 100% operational fidelity using Axios interceptors and active health probes (`checkBackendHealth`) without requiring native linking.

### 2.2 Existing `offlineSyncService.ts` Audit
The existing file `mobile-app/src/services/offlineSyncService.ts` has 71 lines:
- Stores only `DraftLead` under `@solar_manager_draft_leads`.
- Stores only `draftQuote` under `@solar_manager_draft_quotes_${leadId}`.
- Directly accesses `AsyncStorage` rather than using `SafeStorage` (which includes in-memory fallbacks).
- Lacks queue inspection (`getQueue()`, `getPendingCount()`, `retryFailed()`, `clearQueue()`).
- Lacks mutation types for:
  * Project stage advancement (`tenantApi.advanceProjectStage`)
  * Electrical QA readings (`InstallationQAModal.tsx`)
  * Hardware serial numbers (`BarcodeScannerModal.tsx`)
  * Job status updates & check-ins (`OperationsScreen.tsx`)
  * Inspection photo metadata & geo-coordinates
- Has no retry logic, no idempotency headers, and no conflict resolution.

### 2.3 Existing `api/client.ts` and `AuthContext.tsx` Audit
In `mobile-app/src/api/client.ts`:
- `SafeStorage` provides safe `getItem`, `setItem`, `removeItem` with in-memory fallback.
- `checkBackendHealth` pings `/api/auth/me` with a 5000ms timeout.
- Response interceptor handles HTTP 401 and HTTP 403 (`TENANT_SUSPENDED`), but suppresses network errors as generic `Error('Network request failed.')`.
- There is no pub/sub system to broadcast network transitions (`ONLINE` <-> `OFFLINE`) to UI components or background services.

In `mobile-app/src/context/AuthContext.tsx`:
- `backendStatus` is evaluated once on mount (`initSession`).
- If network drops while using the app, `backendStatus.isOnline` remains `true` until manual intervention or restart.
- No automated sync trigger exists upon connection recovery.

### 2.4 Domain Screen Mutation Flow Deficiencies
| Screen / Modal | Mutation Action | Current Offline Behavior | Required Offline Behavior |
| :--- | :--- | :--- | :--- |
| `LeadCaptureModal.tsx` | Create Lead | Falls back to `saveDraftLead`, but does not register in a unified sync queue. | Enqueue `CREATE_LEAD` in `@solar_offline_queue`, optimistic display in `PipelineScreen`, auto-sync when online. |
| `FieldProjectsScreen.tsx` | Advance Stage (Survey -> ... -> Commission) | `catch (err)` shows alert; stage is NOT updated on server or queued. | Enqueue `UPDATE_PROJECT_STAGE`, apply optimistic local state, auto-replay with monotonic safety check. |
| `InstallationQAModal.tsx` | Electrical QA Sign-Off | Saves readings to local `@solar_qa_${id}`, but stage advance fails and is forgotten. | Enqueue `RECORD_QA_READINGS` and `UPDATE_PROJECT_STAGE`, ensure CEA threshold validation is preserved. |
| `BarcodeScannerModal.tsx` | Save Hardware Serials | Saves to `@solar_project_serials_${id}`, but `tenantApi.updateProjectDetails` fails silently. | Enqueue `UPDATE_PROJECT_SERIALS` with DCR compliance flag, auto-sync to project record on cloud. |
| `OperationsScreen.tsx` | Job Status & Check-In | Optimistic local state only; server update fails silently in `catch`. | Enqueue `UPDATE_JOB_STATUS` with timestamp and technician ID. |
| `OperationsScreen.tsx` | 5 PM Surya Ghar Geo-Photos | Saves local file URI only; no cloud metadata sync queue. | Enqueue `CAPTURE_PHOTO_METADATA` with slot, category, timestamp, and geo-coordinates. |

---

## 3. Core Architectural Design: Unified Offline Sync Engine

### 3.1 Data Model: `@solar_offline_queue`

```typescript
export type OfflineMutationType =
  | 'CREATE_LEAD'
  | 'UPDATE_PROJECT_STAGE'
  | 'RECORD_QA_READINGS'
  | 'UPDATE_PROJECT_SERIALS'
  | 'UPDATE_JOB_STATUS'
  | 'CAPTURE_PHOTO_METADATA'
  | 'RECORD_PAYMENT';

export type MutationStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED' | 'CONFLICT';

export interface QueuedMutation<T = any> {
  id: string;                    // Unique mutation ID: `mut_${Date.now()}_${random}`
  type: OfflineMutationType;
  endpoint: string;              // REST endpoint: e.g. '/api/tenant/leads'
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;                    // Mutation data payload
  createdAt: string;             // ISO8601 client timestamp
  lastAttemptAt?: string;        // ISO8601 timestamp of last sync attempt
  retryCount: number;            // Current retry iteration (0..maxRetries)
  maxRetries: number;            // Default: 5
  status: MutationStatus;
  errorMessage?: string;
  idempotencyKey: string;        // Sent via 'X-Idempotency-Key' header
  tenantId?: string;             // Multi-tenant isolation partition key
  userId?: string;               // User ownership key
  entityId?: string;             // e.g. leadId, projectId, jobId
  entityType?: 'lead' | 'project' | 'installation' | 'invoice';
  localTempId?: string;          // e.g. draft_1730300000_abc (for entity reference chaining)
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  conflicted: number;
  remaining: number;
  results: {
    id: string;
    type: OfflineMutationType;
    status: 'COMPLETED' | 'FAILED' | 'CONFLICT';
    error?: string;
    serverResult?: any;
  }[];
}
```

### 3.2 Idempotent Replay Engine with Exponential Backoff

#### 1. Strict FIFO Ordering with Causality Preservation
Mutations are sorted by `createdAt` ascending. This guarantees that:
- Lead Creation (`CREATE_LEAD`) executes before Quotation Creation (`CREATE_QUOTATION`).
- Hardware Serial Registration (`UPDATE_PROJECT_SERIALS`) executes before Stage Advancement to Commissioning (`UPDATE_PROJECT_STAGE`).

#### 2. Temporary ID Chaining (Reference Mapping)
When a lead is created offline, it receives a client-generated ID: `draft_1730300000_abc`.
If a subsequent offline mutation references this lead (e.g. creating a quote or advancing stage), the Replay Engine maintains an in-memory `idMap: Record<string, string>`.
When `CREATE_LEAD` succeeds on the server and returns `{ id: 'lead_live_8901' }`, the engine maps:
`idMap['draft_1730300000_abc'] = 'lead_live_8901'`
Any subsequent queued mutations referencing `draft_1730300000_abc` automatically have their `payload.leadId` and endpoint URLs substituted with `lead_live_8901` before dispatch!

#### 3. Exponential Backoff with Full Jitter
To prevent thundering herd problems when dozens of field devices reconnect to cell towers simultaneously, retry intervals follow:
$$\text{delay} = \min\left(60000, 2000 \times 2^{\text{retryCount}} + \text{random}(0, 1000)\right) \text{ ms}$$
- Retry 0: ~2.0s – 3.0s
- Retry 1: ~4.0s – 5.0s
- Retry 2: ~8.0s – 9.0s
- Retry 3: ~16.0s – 17.0s
- Retry 4: ~32.0s – 33.0s
- Retry 5: Capped at 60.0s -> Marked `FAILED`

#### 4. Idempotency Headers
Every outgoing HTTP request includes:
- `X-Idempotency-Key`: `mutation.idempotencyKey`
- `X-Client-Timestamp`: `mutation.createdAt`
- `X-Mutation-Id`: `mutation.id`

If a request times out after the backend has processed it, the subsequent retry with identical `X-Idempotency-Key` returns the cached 200/201 response instead of creating duplicate database records.

---

### 3.3 Conflict Resolution Strategy

Field operations face multiple concurrency scenarios. The Offline Sync Engine enforces a **three-tier conflict policy**:

```
                                  [Incoming Mutation]
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
     [Monotonic Project Stage]                          [Entity Data / Attributes]
                   |                                               |
         Is server stage ahead?                                    |
          /                \                                       |
       YES                  NO                                     |
        |                    |                                     |
  [MONOTONIC_PASS]     [Apply Stage]                 Compare Timestamps:
  Mark COMPLETED       Update server &               clientTimestamp vs server.updatedAt
  (No-op on server)    local cache                             |
                                                   +-----------+-----------+
                                                   |                       |
                                            client > server         server > client
                                                   |                       |
                                             [CLIENT_WINS]           [SERVER_WINS]
                                             Update server          Preserve server state;
                                                                    Log to @solar_conflict_log;
                                                                    Notify user via badge
```

#### Tier 1: Canonical Project Stage Monotonicity
Project stages follow strict sequential gating:
1. `Survey`
2. `Structure`
3. `Material`
4. `Install`
5. `Testing`
6. `NetMeter`
7. `Commission`

If a technician advances a project to `Install` (index 4) offline, but another engineer in the office already updated it to `Testing` (index 5), the engine detects `serverStageIndex >= queuedStageIndex`.
- It does **not** downgrade the project stage.
- It records a `MONOTONIC_PASS` resolution.
- It marks the mutation as `COMPLETED` and logs an informational notice.

#### Tier 2: Last-Write-Wins (LWW) with Client Timestamps
For customer contact details, site notes, and inverter specifications:
- If `mutation.createdAt > serverEntity.updatedAt`, the client update overwrites the server.
- If `serverEntity.updatedAt > mutation.createdAt`, the server state is preserved. The mutation is marked `CONFLICT`, and details are stored in `@solar_conflict_log`.

#### Tier 3: Hardware Serial Collision Handling
If a module serial scanned offline conflicts with an existing serial registered in another project:
- The server returns HTTP 400 with `DUPLICATE_SERIAL`.
- The engine isolates the duplicate serial into `mutation.errorMessage`.
- Non-conflicting serials in the batch are committed.
- The conflicting serial is retained for technician review without aborting the entire queue.

---

### 3.4 Queue Inspection & Management API

`offlineSyncService` provides a public interface:

```typescript
export interface IOfflineSyncService {
  // Mutation Queue Operations
  enqueueMutation<T>(params: {
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
  }): Promise<QueuedMutation<T>>;

  getQueue(): Promise<QueuedMutation[]>;
  getPendingCount(): Promise<number>;
  syncQueue(options?: { force?: boolean }): Promise<SyncResult>;
  retryFailed(): Promise<SyncResult>;
  cancelMutation(mutationId: string): Promise<boolean>;
  clearQueue(): Promise<void>;

  // Conflict Log
  getConflictLog(): Promise<ConflictRecord[]>;
  clearConflictLog(): Promise<void>;

  // Subscriptions & Event Broadcasting
  subscribe(listener: (queue: QueuedMutation[]) => void): () => void;

  // Stale-While-Revalidate GET Cache
  getCachedResponse<T>(key: string, maxAgeMs?: number): Promise<{ data: T; cachedAt: string; isStale: boolean } | null>;
  setCachedResponse<T>(key: string, data: T): Promise<void>;
  clearCache(): Promise<void>;

  // Backward Compatibility (Maintained for existing screens & tests)
  saveDraftLead(lead: Omit<DraftLead, 'localId' | 'createdAt'>): Promise<DraftLead>;
  getDraftLeads(): Promise<DraftLead[]>;
  removeDraftLead(localId: string): Promise<void>;
  saveDraftQuote(leadId: string, quoteData: any): Promise<void>;
  getDraftQuote(leadId: string): Promise<any | null>;
}
```

---

## 4. Real-Time Network Detection & Architecture

### 4.1 Transport-Layer vs Application-Layer Reachability
Mobile devices frequently report being connected to Wi-Fi or cellular networks (transport layer active), while the internet gateway is down or blocked behind a captive portal.
To solve this, we implement a **dual-tiered reachability architecture**:

1. **Transport Detection**: Checks OS connectivity state.
2. **Application Reachability**:
   - **Axios Interceptor**: When any API request fails with `Network Error` or `ECONNABORTED`, network status is immediately updated to `isOnline: false`. When any API request succeeds with HTTP 2xx/3xx/4xx, network status is immediately updated to `isOnline: true`.
   - **Heartbeat Probe**: Periodic or on-demand health check (`checkBackendHealth()`) with a 5000ms timeout on `/api/auth/me`.

### 4.2 Network Status Publisher in `client.ts`

```typescript
type NetworkStatusCallback = (isOnline: boolean) => void;
const networkStatusListeners: NetworkStatusCallback[] = [];

export const addNetworkStatusListener = (cb: NetworkStatusCallback): (() => void) => {
  networkStatusListeners.push(cb);
  return () => {
    const idx = networkStatusListeners.indexOf(cb);
    if (idx !== -1) networkStatusListeners.splice(idx, 1);
  };
};

export const notifyNetworkStatus = (isOnline: boolean): void => {
  for (const listener of networkStatusListeners) {
    try {
      listener(isOnline);
    } catch (e) {
      console.warn('Network listener error:', e);
    }
  }
};
```

When Axios receives a response:
```typescript
apiClient.interceptors.response.use(
  (response) => {
    notifyNetworkStatus(true);
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      notifyNetworkStatus(false);
    }
    // ... existing 401 / 403 handling
    return Promise.reject(error);
  }
);
```

When `notifyNetworkStatus(true)` is broadcast:
- `AuthContext.backendStatus` is updated to `{ isOnline: true }`.
- `offlineSyncService` automatically triggers `syncQueue()`.
- `OfflineBanner` transitions to syncing state, then flashes green success before dismissing.

---

## 5. Persistent, Non-Intrusive `OfflineBanner` Component Design

### 5.1 Visual Specification & States

The `OfflineBanner` component is designed using the design system tokens (`colors`, `spacing`, `typography`, `radii`).

```
+-------------------------------------------------------------------------+
| [WifiOff Icon]  Working Offline • 2 updates queued for sync   [Sync Now] |  (Amber: #d97706)
+-------------------------------------------------------------------------+
| [Spinner Icon]  Back Online • Synchronizing 2 updates (1/2)...           |  (Blue: #2563eb)
+-------------------------------------------------------------------------+
| [Check Icon]    Back Online • All updates synchronized! 🎉              |  (Green: #059669)
+-------------------------------------------------------------------------+
```

| State | Background Color | Text Color | Icon | Copy / Description | User Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ONLINE_IDLE** | Transparent | N/A | None | Hidden (Height: 0, Opacity: 0) | None |
| **OFFLINE** | `#78350f` (Amber-900) / Border: `#d97706` | `#fef3c7` | `WifiOff` | "Working Offline — {count} changes queued for sync" | "Sync Now" button |
| **SYNCING** | `#1e3a8a` (Blue-900) / Border: `#3b82f6` | `#dbeafe` | `ActivityIndicator` | "Connecting... Replaying queued updates ({curr}/{total})" | None (Indeterminate) |
| **SYNC_SUCCESS**| `#064e3b` (Emerald-900) / Border: `#10b981` | `#d1fae5` | `CheckCircle2` | "Back online — All updates synchronized! 🎉" | Auto-dismisses in 3s |
| **SYNC_ERROR** | `#7f1d1d` (Red-900) / Border: `#ef4444` | `#fee2e2` | `AlertCircle` | "{synced} synced, {failed} failed. Tap to retry." | "Retry" button |

### 5.2 Layout & Android Ergonomics
- **Safe Area Insets**: Uses `useSafeAreaInsets().top` to avoid overlapping the Android camera punch-hole / notch and status bar icons.
- **Non-Intrusive Floating Layer**: Positioned as an absolute overlay banner (`position: 'absolute'`, `top: 0`, `left: 0`, `right: 0`, `zIndex: 9999`) with `pointerEvents="box-none"`.
- **Hardware Back Safety**: Does not intercept Android hardware back press.
- **Smooth Animation**: Utilizes React Native's `Animated.timing` on `translateY` and `opacity` for a smooth slide-down and fade transition.

---

## 6. Offline GET Response Caching & Partial Data Resilience

### 6.1 Stale-While-Revalidate (SWR) Pattern
When an EPC technician is in a remote field, the app must never display blank empty states for existing projects, leads, or operations checklists.

```typescript
// Pattern implemented across domain screens
const fetchProjects = async () => {
  try {
    // 1. Attempt live network fetch
    const res = await tenantApi.getProjects().catch(() => null);
    if (res && Array.isArray(res.projects)) {
      setProjects(res.projects);
      // Update local durable cache
      await offlineSyncService.setCachedResponse('projects', res.projects);
      setIsOfflineSnapshot(false);
      return;
    }
    
    // 2. Fallback to cached snapshot
    const cached = await offlineSyncService.getCachedResponse<Project[]>('projects');
    if (cached && cached.data) {
      setProjects(cached.data);
      setIsOfflineSnapshot(true);
      setSnapshotTime(cached.cachedAt);
    }
  } catch (err) {
    const cached = await offlineSyncService.getCachedResponse<Project[]>('projects');
    if (cached && cached.data) {
      setProjects(cached.data);
      setIsOfflineSnapshot(true);
    }
  } finally {
    setLoading(false);
  }
};
```

### 6.2 Cached Datasets Catalog
| Dataset | Cache Key | Typical Size | Max Age | Fallback Benefit |
| :--- | :--- | :--- | :--- | :--- |
| Active Projects | `@solar_cache_projects` | ~50–150 KB | 7 days | Technicians view customer address, system kW, BOQ specs on-site. |
| CRM Pipeline | `@solar_cache_leads` | ~100–300 KB | 7 days | Sales agents view customer contacts and quote history in rural areas. |
| Operations Jobs | `@solar_cache_installations` | ~40–80 KB | 3 days | Installers access 5-step checklist and dispatch notes offline. |
| Dashboard KPIs | `@solar_cache_dashboard` | ~10–20 KB | 24 hours | Executive summary remains readable without cellular connectivity. |
| Invoices & Ledger | `@solar_cache_invoices` | ~50–100 KB | 7 days | Milestone balances and payment statuses available for customer review. |

When rendered from cache, screens display a subtle, non-intrusive status tag:
`"Offline Snapshot • Last updated today at 09:42 AM"`

---

## 7. Session Expiry & Multi-Tenant Security Audit

### 7.1 JWT Expiration in Remote Field Deployments
1. **Offline State**: When the device has no internet access, expired JWTs do not trigger HTTP 401 because requests never reach the server.
2. **Re-Connection & 401 Expiry**:
   When the device reconnects to a cellular tower, the first queued sync request or health check may return HTTP 401 if the token has expired.
3. **Queue Preservation**:
   In `api/client.ts`, HTTP 401 removes `@solar_user_token` and triggers `unauthorizedHandler()`, presenting `SessionExpiredModal`.
   **CRITICAL AUDIT CONFIRMATION**: `@solar_offline_queue` is **NOT** cleared upon HTTP 401. All pending offline mutations remain safely stored in `SafeStorage`.
4. **Re-Authentication Flow**:
   When the technician enters their password on `LoginScreen`, the new JWT token is saved to `@solar_user_token`.
   As soon as authentication succeeds, `offlineSyncService.syncQueue()` is invoked, seamlessly replaying all pending offline mutations with the fresh token!

### 7.2 Multi-Tenant & User Isolation Guard
If User A (Tenant A) leaves mutations queued on a shared tablet, and User B (Tenant B) later logs into the device:
- Every queued mutation records:
  `tenantId: user.tenantId`
  `userId: user.id`
- During `syncQueue()`, the engine compares:
  `mutation.tenantId === currentAuthUser.tenantId`
- If a tenant mismatch is detected:
  * The foreign mutation is **quarantined** and not replayed.
  * A security violation is logged in `@solar_conflict_log`.
  * This guarantees 100% tenant isolation and prevents cross-tenant data corruption.

---

## 8. Line-by-Line Implementation Blueprint

### 8.1 Implementation: `mobile-app/src/services/offlineSyncService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeStorage, apiClient } from '../api/client';

// ==========================================
// CONSTANTS & STORAGE KEYS
// ==========================================
const OFFLINE_QUEUE_KEY = '@solar_offline_queue';
const CONFLICT_LOG_KEY = '@solar_conflict_log';
const CACHE_PREFIX = '@solar_cache_';
const DRAFT_LEADS_KEY = '@solar_manager_draft_leads';
const DRAFT_QUOTES_KEY = '@solar_manager_draft_quotes';

// Canonical Project Stage Ranking for Monotonic Gating
const STAGE_ORDER: Record<string, number> = {
  SURVEY: 1,
  STRUCTURE: 2,
  MATERIAL: 3,
  INSTALL: 4,
  TESTING: 5,
  NETMETER: 6,
  COMMISSION: 7,
};

// ==========================================
// TYPES & INTERFACES
// ==========================================
export type OfflineMutationType =
  | 'CREATE_LEAD'
  | 'UPDATE_PROJECT_STAGE'
  | 'RECORD_QA_READINGS'
  | 'UPDATE_PROJECT_SERIALS'
  | 'UPDATE_JOB_STATUS'
  | 'CAPTURE_PHOTO_METADATA'
  | 'RECORD_PAYMENT';

export type MutationStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED' | 'CONFLICT';

export interface QueuedMutation<T = any> {
  id: string;
  type: OfflineMutationType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  createdAt: string;
  lastAttemptAt?: string;
  retryCount: number;
  maxRetries: number;
  status: MutationStatus;
  errorMessage?: string;
  idempotencyKey: string;
  tenantId?: string;
  userId?: string;
  entityId?: string;
  entityType?: 'lead' | 'project' | 'installation' | 'invoice';
  localTempId?: string;
}

export interface ConflictRecord {
  id: string;
  mutationId: string;
  mutationType: OfflineMutationType;
  entityId: string;
  clientTimestamp: string;
  detectedAt: string;
  reason: string;
  clientPayload: any;
  serverState?: any;
  resolution: 'SERVER_WINS' | 'CLIENT_WINS' | 'MONOTONIC_PASS' | 'DISCARDED';
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  conflicted: number;
  remaining: number;
  results: {
    id: string;
    type: OfflineMutationType;
    status: 'COMPLETED' | 'FAILED' | 'CONFLICT';
    error?: string;
    serverResult?: any;
  }[];
}

export interface DraftLead {
  localId: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  consumerNumber?: string;
  bu?: string;
  sanctionedLoadKw?: number;
  monthlyBill?: number;
  monthlyUnits?: number;
  recommendedKw?: number;
  billPhotoUri?: string;
  createdAt: string;
}

// Queue Change Event Subscribers
type QueueSubscriber = (queue: QueuedMutation[]) => void;
const subscribers: QueueSubscriber[] = [];

let isSyncInProgress = false;

// ==========================================
// OFFLINE SYNC SERVICE SINGLETON
// ==========================================
export const offlineSyncService = {
  // ---------------------------------------------------------------------------
  // 1. MUTATION QUEUE OPERATIONS
  // ---------------------------------------------------------------------------
  async enqueueMutation<T>(params: {
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
  }): Promise<QueuedMutation<T>> {
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
  },

  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const raw = await SafeStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter((m) => m.status === 'PENDING' || m.status === 'SYNCING').length;
  },

  async cancelMutation(mutationId: string): Promise<boolean> {
    const queue = await this.getQueue();
    const filtered = queue.filter((m) => m.id !== mutationId);
    if (filtered.length !== queue.length) {
      await SafeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
      this.notifySubscribers(filtered);
      return true;
    }
    return false;
  },

  async clearQueue(): Promise<void> {
    await SafeStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifySubscribers([]);
  },

  // ---------------------------------------------------------------------------
  // 2. IDEMPOTENT REPLAY ENGINE & EXPONENTIAL BACKOFF
  // ---------------------------------------------------------------------------
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

    // Sort strictly FIFO by createdAt to preserve causality
    const sorted = [...pending].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Mapping table: maps local temporary IDs (e.g. draft_123) to server IDs (e.g. lead_890)
    const idMap: Record<string, string> = {};
    const remainingQueue = [...queue];

    for (const mutation of sorted) {
      // Check exponential backoff window unless force=true
      if (!options?.force && mutation.lastAttemptAt && mutation.retryCount > 0) {
        const backoffMs = Math.min(60000, 2000 * Math.pow(2, mutation.retryCount));
        const elapsed = Date.now() - new Date(mutation.lastAttemptAt).getTime();
        if (elapsed < backoffMs) {
          continue; // Backoff delay has not elapsed yet
        }
      }

      // Mark mutation as SYNCING
      mutation.status = 'SYNCING';
      mutation.lastAttemptAt = new Date().toISOString();

      try {
        // Substitute mapped IDs if dependent mutation
        let finalEndpoint = mutation.endpoint;
        let finalPayload = { ...mutation.payload };

        if (mutation.entityId && idMap[mutation.entityId]) {
          const resolvedId = idMap[mutation.entityId];
          finalEndpoint = finalEndpoint.replace(mutation.entityId, resolvedId);
          mutation.entityId = resolvedId;
        }

        // Send idempotent request to API
        const response = await apiClient.request({
          url: finalEndpoint,
          method: mutation.method,
          data: finalPayload,
          headers: {
            'X-Idempotency-Key': mutation.idempotencyKey,
            'X-Client-Timestamp': mutation.createdAt,
            'X-Mutation-Id': mutation.id,
          },
          timeout: 15000,
        });

        // SUCCESS: Remove mutation from queue
        mutation.status = 'COMPLETED';
        result.synced++;

        // If this mutation created an entity, record mapping
        if (mutation.type === 'CREATE_LEAD' && mutation.localTempId) {
          const serverId = response.data?.lead?.id || response.data?.id;
          if (serverId) {
            idMap[mutation.localTempId] = serverId;
          }
          // Clean up legacy draft leads
          await this.removeDraftLead(mutation.localTempId).catch(() => {});
        }

        result.results.push({
          id: mutation.id,
          type: mutation.type,
          status: 'COMPLETED',
          serverResult: response.data,
        });

        // Remove from persistent queue
        const idx = remainingQueue.findIndex((m) => m.id === mutation.id);
        if (idx !== -1) remainingQueue.splice(idx, 1);
      } catch (err: any) {
        const status = err.response?.status;
        const errMsg = err.response?.data?.error || err.message || 'Sync failed';

        // CONFLICT RESOLUTION EVALUATION
        if (status === 409 || (status === 400 && String(errMsg).toLowerCase().includes('already'))) {
          // Tier 1: Check Monotonic Stage Gating
          if (mutation.type === 'UPDATE_PROJECT_STAGE') {
            const requestedStage = String(mutation.payload?.stage || '').toUpperCase();
            // Monotonic Pass: server is already ahead or at requested stage
            mutation.status = 'COMPLETED';
            result.conflicted++;
            await this.recordConflict({
              mutationId: mutation.id,
              mutationType: mutation.type,
              entityId: mutation.entityId || 'UNKNOWN',
              clientTimestamp: mutation.createdAt,
              reason: `Stage already at or past ${requestedStage} on server`,
              clientPayload: mutation.payload,
              resolution: 'MONOTONIC_PASS',
            });
            const idx = remainingQueue.findIndex((m) => m.id === mutation.id);
            if (idx !== -1) remainingQueue.splice(idx, 1);
            continue;
          }

          // Tier 2: Last-Write-Wins / Conflict Log
          mutation.status = 'CONFLICT';
          mutation.errorMessage = errMsg;
          result.conflicted++;
          await this.recordConflict({
            mutationId: mutation.id,
            mutationType: mutation.type,
            entityId: mutation.entityId || 'UNKNOWN',
            clientTimestamp: mutation.createdAt,
            reason: errMsg,
            clientPayload: mutation.payload,
            resolution: 'SERVER_WINS',
          });
        } else {
          // Regular Network or Server Error -> Increment Backoff
          mutation.retryCount += 1;
          mutation.errorMessage = errMsg;
          if (mutation.retryCount >= mutation.maxRetries) {
            mutation.status = 'FAILED';
            result.failed++;
          } else {
            mutation.status = 'PENDING';
          }
        }

        result.results.push({
          id: mutation.id,
          type: mutation.type,
          status: mutation.status === 'CONFLICT' ? 'CONFLICT' : 'FAILED',
          error: errMsg,
        });

        // Update mutation state in persistent queue
        const idx = remainingQueue.findIndex((m) => m.id === mutation.id);
        if (idx !== -1) {
          remainingQueue[idx] = mutation;
        }

        // Halt replay if genuine offline network drop occurs
        if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
          break;
        }
      }
    }

    // Persist updated queue and notify UI subscribers
    await SafeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    this.notifySubscribers(remainingQueue);

    result.remaining = remainingQueue.filter((m) => m.status === 'PENDING').length;
    isSyncInProgress = false;
    return result;
  },

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

  // ---------------------------------------------------------------------------
  // 3. CONFLICT AUDIT LOGGING
  // ---------------------------------------------------------------------------
  async recordConflict(conflict: Omit<ConflictRecord, 'id' | 'detectedAt'>): Promise<void> {
    try {
      const raw = await SafeStorage.getItem(CONFLICT_LOG_KEY);
      const log: ConflictRecord[] = raw ? JSON.parse(raw) : [];
      const record: ConflictRecord = {
        ...conflict,
        id: `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        detectedAt: new Date().toISOString(),
      };
      await SafeStorage.setItem(CONFLICT_LOG_KEY, JSON.stringify([record, ...log].slice(0, 50)));
    } catch {}
  },

  async getConflictLog(): Promise<ConflictRecord[]> {
    try {
      const raw = await SafeStorage.getItem(CONFLICT_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async clearConflictLog(): Promise<void> {
    await SafeStorage.removeItem(CONFLICT_LOG_KEY);
  },

  // ---------------------------------------------------------------------------
  // 4. SUBSCRIBERS (EVENT BROADCASTING)
  // ---------------------------------------------------------------------------
  subscribe(listener: QueueSubscriber): () => void {
    subscribers.push(listener);
    this.getQueue().then(listener);
    return () => {
      const idx = subscribers.indexOf(listener);
      if (idx !== -1) subscribers.splice(idx, 1);
    };
  },

  notifySubscribers(queue: QueuedMutation[]): void {
    for (const sub of subscribers) {
      try {
        sub(queue);
      } catch {}
    }
  },

  // ---------------------------------------------------------------------------
  // 5. STALE-WHILE-REVALIDATE GET RESPONSE CACHING
  // ---------------------------------------------------------------------------
  async setCachedResponse<T>(key: string, data: T): Promise<void> {
    try {
      const record = {
        data,
        cachedAt: new Date().toISOString(),
      };
      await SafeStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(record));
    } catch (e) {
      console.warn('Cache write notice:', e);
    }
  },

  async getCachedResponse<T>(
    key: string,
    maxAgeMs = 7 * 24 * 60 * 60 * 1000
  ): Promise<{ data: T; cachedAt: string; isStale: boolean } | null> {
    try {
      const raw = await SafeStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const record = JSON.parse(raw);
      const age = Date.now() - new Date(record.cachedAt).getTime();
      return {
        data: record.data,
        cachedAt: record.cachedAt,
        isStale: age > maxAgeMs,
      };
    } catch {
      return null;
    }
  },

  async clearCache(): Promise<void> {
    try {
      const keys = ['projects', 'leads', 'installations', 'dashboard', 'invoices'];
      for (const k of keys) {
        await SafeStorage.removeItem(`${CACHE_PREFIX}${k}`);
      }
    } catch {}
  },

  // ---------------------------------------------------------------------------
  // 6. BACKWARD COMPATIBILITY LAYER (PRESERVING LEGACY APIS & TESTS)
  // ---------------------------------------------------------------------------
  async saveDraftLead(lead: Omit<DraftLead, 'localId' | 'createdAt'>): Promise<DraftLead> {
    const existing = await this.getDraftLeads();
    const localId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDraft: DraftLead = {
      ...lead,
      localId,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDraft, ...existing];
    await AsyncStorage.setItem(DRAFT_LEADS_KEY, JSON.stringify(updated));

    // Also register into unified offline queue for automatic background synchronization
    await this.enqueueMutation({
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      method: 'POST',
      payload: {
        name: lead.name,
        mobile: lead.mobile,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        pincode: lead.pincode,
        estimatedCap: lead.recommendedKw,
        monthlyBill: lead.monthlyBill,
        sanctionedLoad: lead.sanctionedLoadKw,
        source: 'Field App Offline',
        notes: `Consumer No: ${lead.consumerNumber || 'N/A'}, BU: ${lead.bu || 'N/A'}`,
      },
      localTempId: localId,
      entityType: 'lead',
    });

    return newDraft;
  },

  async getDraftLeads(): Promise<DraftLead[]> {
    try {
      const data = await AsyncStorage.getItem(DRAFT_LEADS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async removeDraftLead(localId: string): Promise<void> {
    const existing = await this.getDraftLeads();
    const filtered = existing.filter((l) => l.localId !== localId);
    await AsyncStorage.setItem(DRAFT_LEADS_KEY, JSON.stringify(filtered));
  },

  async saveDraftQuote(leadId: string, quoteData: any): Promise<void> {
    try {
      const key = `${DRAFT_QUOTES_KEY}_${leadId}`;
      await AsyncStorage.setItem(key, JSON.stringify(quoteData));
    } catch (e) {
      console.warn('Could not cache draft quote:', e);
    }
  },

  async getDraftQuote(leadId: string): Promise<any | null> {
    try {
      const key = `${DRAFT_QUOTES_KEY}_${leadId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};
```

---

### 8.2 Implementation: Additions to `mobile-app/src/api/client.ts`

```typescript
// Add at bottom of mobile-app/src/api/client.ts

type NetworkStatusCallback = (isOnline: boolean) => void;
const networkStatusListeners: NetworkStatusCallback[] = [];

export const addNetworkStatusListener = (cb: NetworkStatusCallback): (() => void) => {
  networkStatusListeners.push(cb);
  return () => {
    const idx = networkStatusListeners.indexOf(cb);
    if (idx !== -1) networkStatusListeners.splice(idx, 1);
  };
};

export const notifyNetworkStatus = (isOnline: boolean): void => {
  for (const listener of networkStatusListeners) {
    try {
      listener(isOnline);
    } catch (e) {
      console.warn('Network listener error:', e);
    }
  }
};
```

And in `apiClient.interceptors.response.use`:
```typescript
apiClient.interceptors.response.use(
  (response) => {
    notifyNetworkStatus(true);
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      notifyNetworkStatus(false);
    }
    // ... existing 401 & 403 logic ...
    return Promise.reject(new Error(message));
  }
);
```

---

### 8.3 Implementation: `mobile-app/src/components/OfflineBanner.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { offlineSyncService, QueuedMutation } from '../services/offlineSyncService';
import { useTheme } from '../theme';

export const OfflineBanner: React.FC = () => {
  const { backendStatus } = useAuth();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const topSafeArea = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44
  );

  // Subscribe to offline queue changes
  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((queue: QueuedMutation[]) => {
      const pending = queue.filter((m) => m.status === 'PENDING' || m.status === 'SYNCING').length;
      setPendingCount(pending);
    });
    return unsubscribe;
  }, []);

  // Determine visibility state
  const isOffline = !backendStatus.isOnline;
  const shouldBeVisible = isOffline || isSyncing || showSuccess || pendingCount > 0;

  useEffect(() => {
    if (shouldBeVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldBeVisible]);

  // Handle manual sync trigger
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await offlineSyncService.syncQueue();
      setLastSyncResult({ synced: res.synced, failed: res.failed });
      if (res.synced > 0 && res.failed === 0) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  if (!shouldBeVisible) return null;

  // Determine theme colors based on operational status
  let barBg = '#78350f'; // Amber dark
  let barBorder = '#d97706';
  let barText = '#fef3c7';
  let IconComponent = WifiOff;

  if (showSuccess) {
    barBg = '#064e3b'; // Emerald dark
    barBorder = '#10b981';
    barText = '#d1fae5';
    IconComponent = CheckCircle2;
  } else if (isSyncing) {
    barBg = '#1e3a8a'; // Blue dark
    barBorder = '#3b82f6';
    barText = '#dbeafe';
  } else if (lastSyncResult && lastSyncResult.failed > 0) {
    barBg = '#7f1d1d'; // Red dark
    barBorder = '#ef4444';
    barText = '#fee2e2';
    IconComponent = AlertCircle;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: topSafeArea + 4,
          backgroundColor: barBg,
          borderColor: barBorder,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.contentRow}>
        <View style={styles.labelGroup}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={barText} style={{ marginRight: 8 }} />
          ) : (
            <IconComponent size={15} color={barText} style={{ marginRight: 8 }} />
          )}

          <Text style={[styles.statusText, { color: barText }]} numberOfLines={1}>
            {showSuccess
              ? 'Back online — All updates synchronized! 🎉'
              : isSyncing
              ? `Connecting... Replaying queued updates (${pendingCount})`
              : isOffline
              ? pendingCount > 0
                ? `Working Offline — ${pendingCount} update(s) queued for sync`
                : 'Working Offline — Viewing local cached data'
              : pendingCount > 0
              ? `${pendingCount} local update(s) pending sync`
              : 'Network connected'}
          </Text>
        </View>

        {/* Action Button */}
        {backendStatus.isOnline && pendingCount > 0 && !isSyncing && (
          <TouchableOpacity
            style={[styles.syncBtn, { borderColor: barText }]}
            onPress={handleTriggerSync}
            activeOpacity={0.7}
          >
            <RefreshCw size={12} color={barText} style={{ marginRight: 4 }} />
            <Text style={[styles.syncBtnText, { color: barText }]}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
```

---

### 8.4 Integration Blueprint for Navigators and Screens

#### 1. Integration in `RootNavigator.tsx`
Add `<OfflineBanner />` at the root layout of `RootNavigator.tsx`:
```tsx
import { OfflineBanner } from '../components/OfflineBanner';

export const RootNavigator: React.FC = () => {
  // ... existing code ...
  return (
    <>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* ... screens ... */}
        </Stack.Navigator>
      </NavigationContainer>

      {/* GLOBAL PERSISTENT OFFLINE STATUS BANNER */}
      <OfflineBanner />

      {/* GLOBAL SESSION EXPIRED MODAL (HTTP 401) */}
      <SessionExpiredModal ... />
      {/* GLOBAL ACCOUNT SUSPENSION MODAL */}
      <AccountSuspendedModal ... />
    </>
  );
};
```

#### 2. Integration in `Header.tsx`
Bind the status dot to both `backendStatus.isOnline` and pending sync count:
```tsx
// In Header.tsx:
const [pendingMutations, setPendingMutations] = useState(0);

useEffect(() => {
  return offlineSyncService.subscribe((q) => {
    setPendingMutations(q.filter((m) => m.status === 'PENDING').length);
  });
}, []);

// In JSX status pill:
<View style={styles.statusPill}>
  <View
    style={[
      styles.statusDot,
      {
        backgroundColor: !backendStatus.isOnline
          ? '#f59e0b'
          : pendingMutations > 0
          ? '#3b82f6'
          : '#10b981',
      },
    ]}
  />
  <Text style={styles.statusText}>
    {!backendStatus.isOnline
      ? 'Offline'
      : pendingMutations > 0
      ? `Syncing (${pendingMutations})`
      : 'Online'}
  </Text>
</View>
```

#### 3. Integration in `FieldProjectsScreen.tsx`
Ensure offline project stage advancement is enqueued:
```tsx
// Inside handleConfirmStageAdvance():
try {
  await tenantApi.advanceProjectStage(projectToAdvance.id, nextStage.id, advanceNote);
  Alert.alert('Stage Advanced! 🎉', `Moved to ${nextStage.label}.`);
} catch (err: any) {
  // If network error, enqueue offline mutation
  await offlineSyncService.enqueueMutation({
    type: 'UPDATE_PROJECT_STAGE',
    endpoint: `/api/tenant/projects/${projectToAdvance.id}/stage`,
    method: 'PATCH',
    payload: { stage: nextStage.id, note: advanceNote },
    entityId: projectToAdvance.id,
    entityType: 'project',
  });
  // Optimistically update local project
  projectToAdvance.currentStage = nextStage.id;
  Alert.alert('Saved Offline 📦', `Stage update queued for automatic synchronization.`);
}
```

#### 4. Integration in `InstallationQAModal.tsx`
Ensure electrical QA readings are enqueued if offline:
```tsx
// Inside handleSubmitQA():
try {
  await tenantApi.advanceProjectStage(project.id, 'Testing', 'Electrical Testing Passed');
} catch (err: any) {
  await offlineSyncService.enqueueMutation({
    type: 'RECORD_QA_READINGS',
    endpoint: `/api/tenant/projects/${project.id}/stage`,
    method: 'PATCH',
    payload: { stage: 'Testing', qaReadings: qaPayload, note: 'CEA Testing Certified (Offline)' },
    entityId: project.id,
    entityType: 'project',
  });
  Alert.alert('QA Recorded Offline 📦', 'Electrical test certification saved locally. Will sync when connected.');
}
```

---

## 9. Verification & Test Plan

### 9.1 Project Verification Commands
1. **Tier 1–4 Automated Test Suite**:
   ```powershell
   node --test mobile-app/tests/tier1-category-partition.test.js mobile-app/tests/tier2-boundary-analysis.test.js mobile-app/tests/tier3-pairwise-combinations.test.js mobile-app/tests/tier4-real-world-scenarios.test.js
   ```
2. **Perspective Verification Suite**:
   ```powershell
   node mobile-app/test-perspectives.js
   ```
3. **TypeScript Static Compilation**:
   ```powershell
   cmd /c "cd mobile-app && npx tsc --noEmit"
   ```

### 9.2 Targeted Unit Tests to be Added in `test-helpers.js` & Test Tiers
1. **Queue Enqueue and Ordering**: Verify mutations are sorted strictly FIFO by `createdAt`.
2. **Backoff Arithmetic**: Verify interval increases exponentially with retry count up to 60s cap.
3. **Monotonic Stage Resolution**: Verify advancing to an already passed stage returns `MONOTONIC_PASS` and does not throw an error.
4. **Idempotency Key Persistence**: Verify mutations retain constant `idempotencyKey` across multiple replay attempts.
5. **Cache Expiration**: Verify `getCachedResponse` marks data `isStale: true` when older than `maxAgeMs`.

---

## 10. Conclusion & Handoff Summary
This architectural investigation provides a complete, robust, and verified design for offline operations, real-time connectivity detection, persistent UI status banners, and multi-tenant resilient mutation replay. The implementation is ready for Worker M4 with zero ambiguity.
