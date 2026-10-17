import { apiClient } from './client';
import { Lead, Project, InstallationJob } from '../types';

// ==========================================
// 1. AUTHENTICATION SERVICE
// ==========================================
export const authApi = {
  login: async (email: string, password?: string) => {
    const res = await apiClient.post('/api/auth/login', {
      email,
      password: password || 'Test@123',
    });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/api/auth/me');
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/api/auth/logout');
    return res.data;
  },
};

// ==========================================
// 2. OWNER / EXECUTIVE TELEMETRY SERVICE
// ==========================================
export const ownerApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/api/tenant/dashboard');
    return res.data; // { totalLeads, totalProjects, totalCustomers }
  },
  getProjects: async (status?: string): Promise<{ projects: Project[]; metrics?: any }> => {
    const url = status && status !== 'ALL' ? `/api/tenant/projects?status=${status}` : '/api/tenant/projects';
    const res = await apiClient.get(url);
    return res.data;
  },
  advanceProjectStage: async (projectId: string, stage: string, note?: string) => {
    const res = await apiClient.patch(`/api/tenant/projects/${projectId}/stage`, {
      stage,
      note: note || `Approved stage advancement to ${stage} via Mobile Executive app`,
    });
    return res.data;
  },
  updateProjectStatus: async (projectId: string, status: string) => {
    const res = await apiClient.patch(`/api/tenant/projects/${projectId}/status`, {
      status,
    });
    return res.data;
  },
};

// ==========================================
// 3. SALES CRM & INSTANT QUOTATION SERVICE
// ==========================================
export const salesApi = {
  getLeads: async (params?: { status?: string; search?: string; all?: boolean }) => {
    let query = '';
    const parts: string[] = [];
    if (params?.status && params.status !== 'ALL') parts.push(`status=${params.status}`);
    if (params?.search) parts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.all) parts.push(`all=true`);
    if (parts.length > 0) query = '?' + parts.join('&');

    const res = await apiClient.get(`/api/tenant/leads${query}`);
    return res.data; // { leads: Lead[] }
  },
  getLeadMetrics: async () => {
    const res = await apiClient.get('/api/tenant/leads/dashboard');
    return res.data; // { dashboard: { totalLeads, newLeads, qualifiedLeads, wonLeads, lostLeads, conversionRate } }
  },
  createLead: async (data: {
    name: string;
    mobile: string;
    email?: string;
    company?: string;
    source?: string;
    estimatedCap?: number;
  }) => {
    const res = await apiClient.post('/api/tenant/leads', data);
    return res.data;
  },
  getQuotations: async () => {
    const res = await apiClient.get('/api/tenant/quotations');
    return res.data;
  },
  createQuotation: async (data: any) => {
    const res = await apiClient.post('/api/tenant/quotations', data);
    return res.data;
  },
};

// ==========================================
// 4. FIELD TECHNICIAN OPERATIONS SERVICE
// ==========================================
export const techApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/api/tenant/installations/dashboard');
    return res.data; // { scheduledToday, inProgress, pendingAssignment, pendingReview, completedToday, delayed, thisMonth }
  },
  getInstallations: async (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/tenant/installations?status=${status}` : '/api/tenant/installations';
    const res = await apiClient.get(url);
    return res.data; // { installations: InstallationJob[] }
  },
  getInstallationDetails: async (id: string) => {
    const res = await apiClient.get(`/api/tenant/installations/${id}`);
    return res.data;
  },
  updateJobStatus: async (
    id: string,
    status: string,
    progressPercent?: number,
    delayReason?: string
  ) => {
    const res = await apiClient.put(`/api/tenant/installations/${id}/status`, {
      status,
      progressPercent,
      delayReason,
    });
    return res.data;
  },
  scheduleInstallation: async (data: {
    projectId: string;
    scheduledDate: string;
    scheduledStartTime?: string;
    estimatedDuration?: number;
    priority?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post('/api/tenant/installations/schedule', data);
    return res.data;
  },
};
