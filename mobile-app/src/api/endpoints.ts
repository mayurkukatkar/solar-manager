import { apiClient } from './client';
import { Lead, Project, InstallationJob } from '../types';

// ==========================================
// 1. AUTHENTICATION SERVICE
// ==========================================
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    return res.data;
  },
  forceResetPassword: async (email: string, temporaryPassword: string, newPassword: string) => {
    const res = await apiClient.post('/api/auth/force-reset-password', {
      email: email.trim().toLowerCase(),
      temporaryPassword,
      newPassword,
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
// 2. TENANT DASHBOARD & PROJECTS SERVICE
// ==========================================
export const tenantApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/api/tenant/dashboard');
    return res.data; // { totalLeads, totalCustomers, totalProjects, pendingInvoices, openTickets, totalRevenue, outstanding }
  },
  getProjects: async (status?: string): Promise<{ projects: Project[]; metrics?: any }> => {
    const url = status && status !== 'ALL' ? `/api/tenant/projects?status=${status}` : '/api/tenant/projects';
    const res = await apiClient.get(url);
    return res.data;
  },
  advanceProjectStage: async (projectId: string, stage: string, note?: string) => {
    const res = await apiClient.patch(`/api/tenant/projects/${projectId}/stage`, {
      stage,
      note: note || `Approved stage advancement to ${stage} via Mobile ERP App`,
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
// 3. CRM & LEADS SERVICE
// ==========================================
export const crmApi = {
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
  deleteLead: async (id: string) => {
    const res = await apiClient.delete(`/api/tenant/leads/${id}`);
    return res.data;
  },
  advanceLeadStage: async (id: string, stage: string) => {
    const res = await apiClient.patch(`/api/tenant/leads/${id}/stage`, { stage });
    return res.data;
  },
};

// ==========================================
// 4. QUOTATIONS & PROPOSALS SERVICE
// ==========================================
export const quotationsApi = {
  getQuotations: async (params?: { status?: string; search?: string }) => {
    let query = '';
    const parts: string[] = [];
    if (params?.status && params.status !== 'ALL') parts.push(`status=${params.status}`);
    if (params?.search) parts.push(`search=${encodeURIComponent(params.search)}`);
    if (parts.length > 0) query = '?' + parts.join('&');

    const res = await apiClient.get(`/api/tenant/quotations${query}`);
    return res.data;
  },
  createQuotation: async (data: any) => {
    const res = await apiClient.post('/api/tenant/quotations', data);
    return res.data;
  },
};

// ==========================================
// 5. SITE SURVEYS SERVICE
// ==========================================
export const surveysApi = {
  getSurveys: async () => {
    const res = await apiClient.get('/api/tenant/surveys');
    return res.data;
  },
  createSurvey: async (data: any) => {
    const res = await apiClient.post('/api/tenant/surveys', data);
    return res.data;
  },
};

// ==========================================
// 6. INSTALLATIONS & OPERATIONS SERVICE
// ==========================================
export const installationsApi = {
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

// ==========================================
// 7. SUPER ADMIN PLATFORM SERVICE
// ==========================================
export const superAdminApi = {
  getKpis: async () => {
    const res = await apiClient.get('/api/super-admin/kpis');
    return res.data;
  },
  getTenants: async () => {
    const res = await apiClient.get('/api/super-admin/tenants');
    return res.data;
  },
  getPlans: async () => {
    const res = await apiClient.get('/api/super-admin/plans');
    return res.data;
  },
};

// ==========================================
// 8. FINANCE & INVOICING SERVICE
// ==========================================
export const financeApi = {
  getInvoices: async () => {
    const res = await apiClient.get('/api/tenant/finance');
    return res.data; // { finance: [...] }
  },
  getInvoiceDetails: async (id: string) => {
    const res = await apiClient.get(`/api/tenant/finance/${id}`);
    return res.data;
  },
};

// ==========================================
// 9. AMC & MAINTENANCE SERVICE
// ==========================================
export const amcApi = {
  getAmcs: async (params?: { status?: string; customerId?: string }) => {
    let query = '';
    const parts: string[] = [];
    if (params?.status) parts.push(`status=${params.status}`);
    if (params?.customerId) parts.push(`customerId=${params.customerId}`);
    if (parts.length > 0) query = '?' + parts.join('&');
    const res = await apiClient.get(`/api/tenant/amcs${query}`);
    return res.data; // { amcs: [...], metrics: {...} }
  },
};

// ==========================================
// 10. PROCUREMENT SERVICE
// ==========================================
export const procurementApi = {
  getPurchaseOrders: async (projectId?: string) => {
    const url = projectId ? `/api/tenant/procurement/pos?projectId=${projectId}` : '/api/tenant/procurement/pos';
    const res = await apiClient.get(url);
    return res.data; // { purchaseOrders: [...] }
  },
};

// Backward-compatible aliases
export const ownerApi = tenantApi;
export const salesApi = crmApi;
export const techApi = installationsApi;

