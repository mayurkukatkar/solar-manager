export type UserRole = 'OWNER' | 'SALES_AGENT' | 'TECHNICIAN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantName: string;
  tenantId: string;
  avatarUrl?: string;
  backendRole?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  mobile?: string;
  email?: string;
  company?: string;
  city: string;
  address?: string;
  monthlyBillUnits?: number;
  sanctionedLoadKw?: number;
  recommendedKw?: number;
  estimatedCap?: number;
  estimatedCost?: number;
  estimatedValue?: number;
  subsidyAmount?: number;
  source?: string;
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_SURVEY' | 'SURVEY_SCHEDULED' | 'QUOTATION_SENT' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
  status?: string;
  notes?: string;
  createdAt: string;
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

export interface Project {
  id: string;
  name: string;
  status: string;
  currentStage?: string;
  capacity?: number;
  estimatedValue?: number;
  customerId?: string;
  customer?: {
    name: string;
    mobile?: string;
    email?: string;
  };
  createdAt?: string;
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

export interface OwnerKPIs {
  monthlyRevenue: number;
  activeProjects: number;
  todayInstallations: number;
  pendingSubsidies: number;
  leadsWonCount: number;
  pendingApprovalsCount: number;
  totalLeads?: number;
  totalCustomers?: number;
  totalProjects?: number;
}

export interface BackendConnectionStatus {
  isOnline: boolean;
  serverUrl: string;
  latencyMs?: number;
  lastChecked?: string;
}
