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
    return res.data;
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
  getProjectDetails: async (projectId: string) => {
    const res = await apiClient.get(`/api/tenant/projects/${projectId}`);
    return res.data;
  },
  createProject: async (data: any) => {
    const res = await apiClient.post('/api/tenant/projects', data);
    return res.data;
  },
  updateProjectDetails: async (projectId: string, data: any) => {
    const res = await apiClient.patch(`/api/tenant/projects/${projectId}`, data);
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
    return res.data;
  },
  getLeadMetrics: async () => {
    const res = await apiClient.get('/api/tenant/leads/dashboard');
    return res.data;
  },
  createLead: async (data: {
    name: string;
    mobile: string;
    email?: string;
    company?: string;
    source?: string;
    estimatedCap?: number;
    monthlyBill?: number;
    address?: string;
    city?: string;
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
  convertLead: async (id: string, data?: any) => {
    const res = await apiClient.post(`/api/tenant/leads/${id}/convert`, data || {});
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
  convertQuotation: async (id: string) => {
    const res = await apiClient.post(`/api/tenant/quotations/${id}/convert`);
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
    return res.data;
  },
  getInstallations: async (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/tenant/installations?status=${status}` : '/api/tenant/installations';
    const res = await apiClient.get(url);
    return res.data;
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
// 7. PM SURYA GHAR SUBSIDY (CFA) SERVICE
// ==========================================
export const subsidyApi = {
  getSubsidies: async (params?: { portalStage?: string; search?: string; customerId?: string }) => {
    let query = '';
    const parts: string[] = [];
    if (params?.portalStage && params.portalStage !== 'ALL') parts.push(`portalStage=${params.portalStage}`);
    if (params?.search) parts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.customerId) parts.push(`customerId=${params.customerId}`);
    if (parts.length > 0) query = '?' + parts.join('&');

    const res = await apiClient.get(`/api/tenant/subsidies${query}`);
    return res.data; // { subsidies: [...], metrics: {...} }
  },
  createSubsidy: async (data: any) => {
    const res = await apiClient.post('/api/tenant/subsidies', data);
    return res.data;
  },
};

// ==========================================
// 8. DISCOM NET METERING SERVICE
// ==========================================
export const discomApi = {
  getDiscom: async (projectId: string) => {
    const res = await apiClient.get(`/api/tenant/projects/${projectId}/discom`);
    return res.data;
  },
  createDiscom: async (projectId: string) => {
    const res = await apiClient.post(`/api/tenant/projects/${projectId}/discom`);
    return res.data;
  },
  updateStage: async (projectId: string, status: string, documentUrl?: string) => {
    const res = await apiClient.patch(`/api/tenant/projects/${projectId}/discom/stage`, {
      status,
      documentUrl,
    });
    return res.data;
  },
};

// ==========================================
// 9. SOLAR LOANS & FINANCING SERVICE
// ==========================================
export const loansApi = {
  getLoans: async (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/tenant/loans?status=${status}` : '/api/tenant/loans';
    const res = await apiClient.get(url);
    return res.data;
  },
  createLoan: async (data: any) => {
    const res = await apiClient.post('/api/tenant/loans', data);
    return res.data;
  },
};

// ==========================================
// 10. FINANCE & INVOICING SERVICE
// ==========================================
export const financeApi = {
  getStats: async () => {
    const res = await apiClient.get('/api/tenant/finance/stats');
    return res.data;
  },
  getInvoices: async (params?: { status?: string; search?: string }) => {
    let query = '';
    const parts: string[] = [];
    if (params?.status) parts.push(`status=${params.status}`);
    if (params?.search) parts.push(`search=${encodeURIComponent(params.search)}`);
    if (parts.length > 0) query = '?' + parts.join('&');
    const res = await apiClient.get(`/api/tenant/finance${query}`);
    return res.data;
  },
  getInvoiceDetails: async (id: string) => {
    const res = await apiClient.get(`/api/tenant/finance/${id}`);
    return res.data;
  },
  createInvoice: async (data: {
    customerId: string;
    projectId?: string;
    milestone?: string;
    milestoneTitle?: string;
    subtotal?: number;
    taxRate?: number;
    taxAmount?: number;
    subsidyDeduction?: number;
    amount: number;
    dueDate?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post('/api/tenant/finance', data);
    return res.data;
  },
  recordPayment: async (
    invoiceId: string,
    data: { amount: number; mode: string; reference?: string; notes?: string; date?: string }
  ) => {
    const res = await apiClient.post(`/api/tenant/invoices/${invoiceId}/payments`, data);
    return res.data;
  },
  getReceipt: async (invoiceId: string, paymentId: string) => {
    const res = await apiClient.get(`/api/tenant/invoices/${invoiceId}/receipt/${paymentId}`);
    return res.data;
  },
  getWhatsAppPayload: async (invoiceId: string) => {
    const res = await apiClient.get(`/api/tenant/invoices/${invoiceId}/whatsapp-payload`);
    return res.data;
  },
  convertQuotation: async (quotationId: string, options?: { template?: string; selectedMilestone?: string }) => {
    const res = await apiClient.post('/api/tenant/finance/convert-quotation', {
      quotationId,
      ...options,
    });
    return res.data;
  },
  createMilestoneInvoicesForProject: async (data: {
    leadId?: string;
    customerId?: string;
    projectId?: string;
    totalAmount: number;
    capacityKw?: number;
    customerName?: string;
  }) => {
    try {
      const res = await apiClient.post('/api/tenant/finance/milestone-invoices', data);
      if (res.data?.invoices) return res.data.invoices;
    } catch (e: any) {
      console.warn('Direct milestone creation endpoint notice:', e.message);
    }
    const stages = [
      { key: 'ADVANCE', pct: 0.20, title: 'Stage 1: Advance Booking & Work Order (20%)', days: 0 },
      { key: 'MATERIAL_DELIVERY', pct: 0.60, title: 'Stage 2: PV Modules & Inverter Delivery (60%)', days: 10 },
      { key: 'INSTALLATION', pct: 0.15, title: 'Stage 3: Structure & Electrical Testing (15%)', days: 20 },
      { key: 'COMMISSIONING', pct: 0.05, title: 'Stage 4: DISCOM Net Metering & Grid Sync (5%)', days: 30 },
    ];
    const results = [];
    for (const st of stages) {
      const amt = Math.round(data.totalAmount * st.pct);
      const subtotal = Math.round(amt / 1.138);
      const tax = amt - subtotal;
      const inv = await apiClient.post('/api/tenant/finance', {
        customerId: data.customerId,
        projectId: data.projectId,
        milestone: st.key,
        milestoneTitle: st.title,
        subtotal,
        taxAmount: tax,
        taxRate: 13.8,
        amount: amt,
        dueDate: new Date(Date.now() + st.days * 86400000).toISOString(),
        notes: `Turnkey ${data.capacityKw || 3.3} kWp Solar EPC plant for ${data.customerName || 'Customer'}.`,
      });
      results.push(inv.data?.invoice);
    }
    return results;
  },
};

// ==========================================
// 11. AMC & MAINTENANCE SERVICE
// ==========================================
export const amcApi = {
  getAmcs: async (params?: { status?: string; customerId?: string }) => {
    let query = '';
    const parts: string[] = [];
    if (params?.status) parts.push(`status=${params.status}`);
    if (params?.customerId) parts.push(`customerId=${params.customerId}`);
    if (parts.length > 0) query = '?' + parts.join('&');
    const res = await apiClient.get(`/api/tenant/amcs${query}`);
    return res.data;
  },
};

// ==========================================
// 12. PROCUREMENT & PURCHASE ORDERS SERVICE
// ==========================================
export const procurementApi = {
  getPurchaseOrders: async (projectId?: string) => {
    const url = projectId ? `/api/tenant/procurement/pos?projectId=${projectId}` : '/api/tenant/procurement/pos';
    const res = await apiClient.get(url);
    return res.data;
  },
};

// ==========================================
// 13. SUPPORT TICKETS SERVICE
// ==========================================
export const supportApi = {
  getTickets: async (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/tenant/tickets?status=${status}` : '/api/tenant/tickets';
    const res = await apiClient.get(url);
    return res.data;
  },
  createTicket: async (data: any) => {
    const res = await apiClient.post('/api/tenant/tickets', data);
    return res.data;
  },
};

// ==========================================
// 14. SUPER ADMIN PLATFORM SERVICE
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
// 15. OCR & ELECTRICITY BILL SCANNING SERVICE
// ==========================================
export const ocrApi = {
  scanBill: async (params: { fileBase64?: string; rawText?: string; filename?: string }) => {
    const res = await apiClient.post('/api/tenant/ocr/scan-bill', params);
    return res.data;
  },
  fetchConsumer: async (consumerNumber: string, bu?: string, billAmount?: number) => {
    const res = await apiClient.post('/api/tenant/ocr/fetch-consumer', { consumerNumber, bu, billAmount });
    return res.data;
  },
};

// ==========================================
// 16. DOCUMENTS SERVICE
// ==========================================
export const documentsApi = {
  uploadDocument: async (formData: FormData) => {
    const res = await apiClient.post('/api/tenant/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getDocuments: async (params?: { projectId?: string; customerId?: string; category?: string }) => {
    let url = '/api/tenant/documents';
    const queryParts: string[] = [];
    if (params?.projectId) queryParts.push(`projectId=${params.projectId}`);
    if (params?.customerId) queryParts.push(`customerId=${params.customerId}`);
    if (params?.category) queryParts.push(`category=${params.category}`);
    if (queryParts.length > 0) url += `?${queryParts.join('&')}`;
    const res = await apiClient.get(url);
    return res.data;
  },
  getChecklist: async (projectId: string) => {
    const res = await apiClient.get(`/api/tenant/projects/${projectId}/document-checklist`);
    return res.data;
  },
  getProjectsSummary: async () => {
    const res = await apiClient.get('/api/tenant/documents/projects-summary');
    return res.data;
  },
  verifyDocument: async (id: string) => {
    const res = await apiClient.post(`/api/tenant/documents/${id}/verify`);
    return res.data;
  },
  deleteDocument: async (id: string) => {
    const res = await apiClient.delete(`/api/tenant/documents/${id}`);
    return res.data;
  },
  getSecureUrl: async (id: string) => {
    const res = await apiClient.get(`/api/tenant/documents/${id}/secure-url`);
    return res.data;
  },
};

// Backward-compatible aliases
export const ownerApi = tenantApi;
export const salesApi = crmApi;
export const techApi = installationsApi;
