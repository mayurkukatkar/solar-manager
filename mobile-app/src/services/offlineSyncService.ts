import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_LEADS_KEY = '@solar_manager_draft_leads';
const DRAFT_QUOTES_KEY = '@solar_manager_draft_quotes';

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

export const offlineSyncService = {
  async saveDraftLead(lead: Omit<DraftLead, 'localId' | 'createdAt'>): Promise<DraftLead> {
    const existing = await this.getDraftLeads();
    const newDraft: DraftLead = {
      ...lead,
      localId: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDraft, ...existing];
    await AsyncStorage.setItem(DRAFT_LEADS_KEY, JSON.stringify(updated));
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
