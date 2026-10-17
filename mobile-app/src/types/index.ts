export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'OWNER' | 'SALES_AGENT' | 'TECHNICIAN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantName: string;
  tenantId?: string | null;
  avatarUrl?: string;
  backendRole?: string;
}

export interface DashboardData {
  totalLeads: number;
  totalCustomers: number;
  totalProjects: number;
  pendingInvoices: number;
  openTickets: number;
  totalRevenue: number;
  outstanding: number;
}

export interface Customer {
  id?: string;
  name: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  consumerNumber?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  mobile?: string;
  email?: string;
  company?: string;
  customerType?: string;
  city: string;
  state?: string;
  address?: string;
  monthlyBill?: number;
  monthlyBillUnits?: number;
  sanctionedLoadKw?: number;
  recommendedKw?: number;
  estimatedCap?: number;
  estimatedCost?: number;
  estimatedValue?: number;
  subsidyAmount?: number;
  source?: string;
  stage: string;
  status?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  currentStage?: string;
  capacity?: number;
  systemCapacity?: number;
  estimatedValue?: number;
  address?: string;
  city?: string;
  state?: string;
  customerId?: string;
  customer?: Customer;
  panelBrand?: string;
  inverterBrand?: string;
  structureType?: string;
  discomName?: string;
  consumerNumber?: string;
  netMeteringAppNo?: string;
  subsidyStatus?: string;
  cfaAmount?: number;
  createdAt?: string;
}

export interface Quotation {
  id: string;
  qNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customer?: { name: string; email?: string; mobile?: string; phone?: string };
  lead?: { name: string; email?: string; mobile?: string; phone?: string };
  createdAt: string;
  capacity?: number;
  panelBrand?: string;
  inverterBrand?: string;
  netPayable?: number;
  subsidyAmount?: number;
}

export interface QuotationCalculation {
  capacityKw: number;
  panelWattage: number;
  panelCount: number;
  grossAmount: number;
  subsidyAmount: number;
  netPayable: number;
  monthlyUnitsGenerated: number;
  monthlySavingsRs: number;
  paybackYears: number;
}

export interface InstallationJob {
  id: string;
  jobId?: string;
  projectNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  capacityKw: number;
  panelBrand: string;
  inverterBrand: string;
  status: 'SCHEDULED' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'IN_PROGRESS' | 'CHECKLIST_DONE' | 'TESTING' | 'PENDING_REVIEW' | 'COMPLETED' | 'DELAYED';
  scheduledDate: string;
  scheduledStartTime?: string;
  estimatedDuration?: number;
  progressPercent?: number;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  moduleSerialNumbers: string[];
  geoPhotos: {
    slot: number;
    title: string;
    category?: string;
    uri?: string;
    timestamp?: string;
    coords?: { lat: number; lng: number };
  }[];
  checklist: {
    id: string;
    title: string;
    category: string;
    completed: boolean;
  }[];
  customerSignature?: string;
}

export interface Tenant {
  id: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  status?: string;
  createdAt?: string;
}

export interface BackendConnectionStatus {
  isOnline: boolean;
  serverUrl: string;
  latencyMs?: number;
  lastChecked?: string;
}

export interface SiteSurvey {
  id: string;
  surveyNumber?: string;
  status: string;
  surveyDate?: string;
  proposedCap?: number;
  roofType?: string;
  notes?: string;
  customer?: {
    name: string;
    mobile?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
  lead?: {
    name: string;
    mobile?: string;
    phone?: string;
    city?: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  customer?: { name: string; email?: string; mobile?: string; phone?: string };
  project?: { name: string; capacity?: number };
}

export interface SubsidyApplication {
  id: string;
  nationalPortalAppNo?: string;
  consumerNumber?: string;
  customerName?: string;
  customerMobile?: string;
  discomName?: string;
  proposedCapacity?: number | string;
  status: string;
  cfaAmount?: number;
  dbtStatus?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  division?: string;
  createdAt?: string;
}

export interface DiscomApplication {
  id: string;
  applicationNumber: string;
  consumerNumber: string;
  consumerName: string;
  discomName: string;
  sanctionedLoadKw: number;
  status: 'APPLIED' | 'FEASIBILITY_CLEARED' | 'QUOTATION_PAID' | 'METER_TESTING' | 'METER_INSTALLED' | 'SYNCHRONIZED';
  appliedDate?: string;
  meterSerial?: string;
  division?: string;
}

export interface SolarLoanPlan {
  capacityKw: number;
  systemCost: number;
  downPayment: number;
  loanAmount: number;
  tenureYears: number;
  interestRateAnnual: number;
  monthlyEmi: number;
  monthlySavings: number;
  monthlyNetProfit: number;
}
