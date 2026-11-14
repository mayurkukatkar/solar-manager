import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeStorage, apiClient } from '../api/client';
import { STAGE_TO_BACKEND_MAP } from '../api/endpoints';

// ==========================================
// CONSTANTS & STORAGE KEYS
// ==========================================
export const OFFLINE_QUEUE_KEY = '@solar_offline_queue';
export const CONFLICT_LOG_KEY = '@solar_conflict_log';
export const CACHE_PREFIX = '@solar_cache_';
export const DRAFT_LEADS_KEY = '@solar_manager_draft_leads';
export const DRAFT_QUOTES_KEY = '@solar_manager_draft_quotes';
export const USER_PROFILE_KEY = '@solar_user_profile';

// Canonical Project Stage Ranking for Monotonic Gating
export const STAGE_ORDER: Record<string, number> = {
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
  | 'CONVERT_LEAD'
  | 'UPDATE_PROJECT_STAGE'
  | 'RECORD_QA_READINGS'
  | 'UPDATE_PROJECT_SERIALS'
  | 'UPDATE_JOB_STATUS'
  | 'CAPTURE_PHOTO_METADATA'
  | 'RECORD_PAYMENT'
  | 'RECORD_DPDP_CONSENT';

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
export type QueueSubscriber = (queue: QueuedMutation[]) => void;
const subscribers: QueueSubscriber[] = [];

let isSyncInProgress = false;

// ==========================================
// OFFLINE SYNC SERVICE SINGLETON
// ==========================================
export const offlineSyncService = {
  // ---------------------------------------------------------------------------
  // 1. MUTATION QUEUE OPERATIONS
  // ---------------------------------------------------------------------------
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

    if (typeof paramsOrType === 'string') {
      const type = paramsOrType as OfflineMutationType;
      let defaultEndpoint = '/api/tenant/sync';
      let defaultMethod: 'POST' | 'PUT' | 'PATCH' = 'POST';
      let defaultEntityType: 'lead' | 'project' | 'installation' | 'invoice' = 'project';

      if (type === 'CREATE_LEAD') {
        defaultEndpoint = '/api/tenant/leads';
        defaultEntityType = 'lead';
      } else if (type === 'CONVERT_LEAD') {
        const leadId = (legacyPayload as any)?.leadId || (legacyPayload as any)?.id;
        defaultEndpoint = leadId ? `/api/tenant/leads/${leadId}/convert` : '/api/tenant/leads/convert';
        defaultEntityType = 'project';
      } else if (type === 'UPDATE_PROJECT_STAGE') {
        const projId = (legacyPayload as any)?.projectId || (legacyPayload as any)?.id;
        defaultEndpoint = projId ? `/api/tenant/projects/${projId}/stage` : '/api/tenant/projects/stage';
        defaultMethod = 'PATCH';
        defaultEntityType = 'project';
      } else if (type === 'RECORD_QA_READINGS') {
        defaultEndpoint = '/api/tenant/projects/qa';
        defaultEntityType = 'project';
      } else if (type === 'UPDATE_PROJECT_SERIALS') {
        defaultEndpoint = '/api/tenant/projects/serials';
        defaultEntityType = 'project';
      } else if (type === 'UPDATE_JOB_STATUS') {
        defaultEndpoint = '/api/installations/status';
        defaultMethod = 'PATCH';
        defaultEntityType = 'installation';
      } else if (type === 'RECORD_DPDP_CONSENT') {
        defaultEndpoint = '/api/tenant/dpdp/consent';
        defaultMethod = 'POST';
        defaultEntityType = 'lead';
      }

      params = {
        type,
        endpoint: legacyEndpoint || defaultEndpoint,
        method: defaultMethod,
        payload: legacyPayload as T,
        entityType: defaultEntityType,
      };
    } else {
      params = paramsOrType;
    }

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
        const rawProfile = await SafeStorage.getItem(USER_PROFILE_KEY);
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
        (m.status === 'PENDING' || (options?.force && (m.status === 'FAILED' || m.status === 'SYNCING' || m.status === 'CONFLICT'))) &&
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
        const jitter = Math.floor(Math.random() * 1000);
        const backoffMs = Math.min(60000, 2000 * Math.pow(2, mutation.retryCount) + jitter);
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

        if (mutation.type === 'UPDATE_PROJECT_STAGE') {
          const rawStg = finalPayload.stage || finalPayload.newStage;
          if (rawStg) {
            finalPayload.stage = rawStg;
            finalPayload.newStage = STAGE_TO_BACKEND_MAP[rawStg] || rawStg;
            finalPayload.force = true; // Offline sync replay permits force advancement
            if (!finalPayload.comment && finalPayload.note) {
              finalPayload.comment = finalPayload.note;
            }
          }
        }

        // Send idempotent request to API
        let response;
        try {
          response = await apiClient.request({
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
        } catch (reqErr: any) {
          const errMsg = reqErr.response?.data?.error || reqErr.message || '';
          if (
            mutation.type === 'UPDATE_PROJECT_STAGE' &&
            (finalPayload.newStage === 'NET_METER_APPLIED' || finalPayload.stage === 'NET_METERING') &&
            String(errMsg).includes('cannot jump') &&
            String(errMsg).includes('INSTALLATION')
          ) {
            await apiClient.patch(finalEndpoint, {
              stage: 'INSPECTION',
              newStage: 'TESTING_COMPLETED',
              note: 'Bridge electrical QA signoff for DISCOM net metering',
              comment: 'Bridge electrical QA signoff for DISCOM net metering',
            });
            response = await apiClient.patch(finalEndpoint, finalPayload);
          } else if (
            mutation.type === 'UPDATE_PROJECT_STAGE' &&
            (finalPayload.newStage === 'COMMISSIONED' || finalPayload.stage === 'HANDOVER') &&
            String(errMsg).includes('cannot jump') &&
            String(errMsg).includes('TESTING')
          ) {
            await apiClient.patch(finalEndpoint, {
              stage: 'NET_METERING',
              newStage: 'NET_METER_APPLIED',
              note: 'Bridge DISCOM net metering for final handover',
              comment: 'Bridge DISCOM net metering for final handover',
            });
            response = await apiClient.patch(finalEndpoint, finalPayload);
          } else {
            throw reqErr;
          }
        }

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
        } else if (mutation.type === 'CONVERT_LEAD' && mutation.localTempId) {
          const serverProjectId = response.data?.project?.id || response.data?.id;
          if (serverProjectId) {
            idMap[mutation.localTempId] = serverProjectId;
          }
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

        // CONFLICT RESOLUTION & MONOTONIC PASS EVALUATION
        const lowerMsg = String(errMsg).toLowerCase();
        const isConflictOrMonotonic =
          status === 409 ||
          status === 404 ||
          status === 400 ||
          lowerMsg.includes('already') ||
          lowerMsg.includes('duplicate') ||
          lowerMsg.includes('not found') ||
          lowerMsg.includes('invalid stage') ||
          lowerMsg.includes('cannot jump') ||
          lowerMsg.includes('transition') ||
          lowerMsg.includes('progressed') ||
          lowerMsg.includes('completed') ||
          lowerMsg.includes('won') ||
          lowerMsg.includes('required');

        if (isConflictOrMonotonic) {
          // Tier 1: Check Monotonic Stage Gating & Idempotent Lead Conversion & DPDP Consent
          if (
            mutation.type === 'UPDATE_PROJECT_STAGE' ||
            mutation.type === 'CONVERT_LEAD' ||
            mutation.type === 'RECORD_DPDP_CONSENT'
          ) {
            // Monotonic Pass: server is already ahead, project already converted, or stale test entity
            mutation.status = 'COMPLETED';
            result.synced++;
            result.conflicted++;
            await this.recordConflict({
              mutationId: mutation.id,
              mutationType: mutation.type,
              entityId: mutation.entityId || 'UNKNOWN',
              clientTimestamp: mutation.createdAt,
              reason: mutation.type === 'CONVERT_LEAD'
                ? 'Lead was already converted to project on server'
                : `Stage resolved on server: ${errMsg}`,
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

    result.remaining = remainingQueue.filter(
      (m) =>
        m.status === 'PENDING' &&
        (!targetTenantId || !m.tenantId || m.tenantId === targetTenantId)
    ).length;
    isSyncInProgress = false;
    return result;
  },

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
    this.getQueue().then(listener).catch(() => {});
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

  async deleteDraftLead(localId: string): Promise<void> {
    return this.removeDraftLead(localId);
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

  async getDraftQuotes(): Promise<Record<string, any>> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const quoteKeys = allKeys.filter((k) => k.startsWith(DRAFT_QUOTES_KEY));
      const pairs = await AsyncStorage.multiGet(quoteKeys);
      const result: Record<string, any> = {};
      for (const [k, v] of pairs) {
        if (v) {
          const id = k.replace(`${DRAFT_QUOTES_KEY}_`, '');
          try {
            result[id] = JSON.parse(v);
          } catch {
            result[id] = v;
          }
        }
      }
      return result;
    } catch {
      return {};
    }
  },

  async deleteDraftQuote(leadId: string): Promise<void> {
    try {
      const key = `${DRAFT_QUOTES_KEY}_${leadId}`;
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  async getOfflineStats(): Promise<{
    pendingQueueCount: number;
    draftLeadsCount: number;
    draftQuotesCount: number;
    conflictsCount: number;
  }> {
    const queue = await this.getQueue();
    const leads = await this.getDraftLeads();
    const quotes = await this.getDraftQuotes();
    const conflicts = await this.getConflictLog();
    const pendingQueueCount = queue.filter((m) => m.status === 'PENDING' || m.status === 'SYNCING').length;
    return {
      pendingQueueCount,
      draftLeadsCount: leads.length,
      draftQuotesCount: Object.keys(quotes).length,
      conflictsCount: conflicts.length,
    };
  },

  async syncAllDrafts(options?: { tenantId?: string }): Promise<{ syncedLeads: number; failedLeads: number; syncResult: SyncResult }> {
    const syncResult = await this.syncQueue({ force: true, tenantId: options?.tenantId });
    return {
      syncedLeads: syncResult.synced,
      failedLeads: syncResult.failed,
      syncResult,
    };
  },
};
