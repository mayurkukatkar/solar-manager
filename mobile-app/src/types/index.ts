export type UserRole = 'OWNER' | 'SALES_AGENT' | 'TECHNICIAN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantName: string;
  tenantId: string;
  avatarUrl?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  monthlyBillUnits?: number;
  sanctionedLoadKw?: number;
  recommendedKw?: number;
  estimatedCost?: number;
  subsidyAmount?: number;
  stage: 'NEW' | 'CONTACTED' | 'SURVEY_SCHEDULED' | 'QUOTATION_SENT' | 'WON' | 'LOST';
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

export interface InstallationJob {
  id: string;
  projectNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  capacityKw: number;
  panelBrand: string;
  inverterBrand: string;
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'CHECKLIST_DONE' | 'COMPLETED';
  scheduledDate: string;
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
}
