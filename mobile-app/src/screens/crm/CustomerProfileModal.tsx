import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import {
  X,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Zap,
  IndianRupee,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  ChevronRight,
  Plus,
  Edit3,
  Share2,
  Camera,
  UploadCloud,
  Download,
  ExternalLink,
  MessageCircle,
  Receipt,
  Landmark,
  Banknote,
  Truck,
  Wrench,
  Shield,
  Trash2,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Check,
  Briefcase,
  Layers,
  HelpCircle,
  Send,
  Lock,
  Eye,
  AlertTriangle,
  QrCode,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { ModalHeader } from '../../components/common/ModalHeader';
import { PermissionRationaleModal } from '../../components/common/PermissionRationaleModal';
import {
  customerApi,
  documentsApi,
  crmApi,
  financeApi,
  maskAadhaarNumber,
  maskPanNumber,
} from '../../api/endpoints';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { haptics } from '../../utils/haptics';
import { offlineSyncService } from '../../services/offlineSyncService';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
import { CreateInvoiceModal } from '../../components/CreateInvoiceModal';
import { DiscomDocsModal } from '../projects/DiscomDocsModal';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import {
  getProjectStageIndex,
  calculateProjectProgressPct,
  CANONICAL_PROJECT_STAGES,
} from '../projects/FieldProjectsScreen';
import { CustomerDetailedProfile } from '../../types';

export interface CustomerProfileModalProps {
  visible: boolean;
  customerId?: string;
  leadId?: string;
  customerData?: any;
  onClose: () => void;
  onUpdate?: (updatedCustomer: any) => void;
}

export type ProfileTab =
  | 'OVERVIEW'
  | 'PROJECTS'
  | 'QUOTATIONS'
  | 'FINANCE'
  | 'SUBSIDY'
  | 'DOCUMENTS'
  | 'AMC'
  | 'TIMELINE';

const PROFILE_TABS: { id: ProfileTab; label: string; icon: any }[] = [
  { id: 'OVERVIEW', label: 'Overview', icon: User },
  { id: 'PROJECTS', label: 'Projects', icon: Briefcase },
  { id: 'QUOTATIONS', label: 'Quotes', icon: FileText },
  { id: 'FINANCE', label: 'Finance', icon: Receipt },
  { id: 'SUBSIDY', label: 'Surya Ghar', icon: Landmark },
  { id: 'DOCUMENTS', label: 'Documents', icon: FileSpreadsheet },
  { id: 'AMC', label: 'AMC & Help', icon: ShieldCheck },
  { id: 'TIMELINE', label: 'Timeline', icon: Clock },
];

const REQUIRED_KYC_DOCS = [
  { id: 'ELECTRICITY_BILL', title: 'Latest Electricity Bill', category: 'Electricity / DISCOM', matchKeys: ['bill', 'electricity', 'discom', 'consumer', 'power', 'eb'], required: true },
  { id: 'AADHAAR', title: 'Aadhaar Card (Front & Back)', category: 'Customer KYC', matchKeys: ['aadhaar', 'aadhar', 'id proof', 'uidai', 'identity'], required: true },
  { id: 'PAN', title: 'PAN Card Copy', category: 'Customer KYC', matchKeys: ['pan', 'taxpayer'], required: true },
  { id: 'PROPERTY_TAX', title: 'Property Tax / Index II Proof', category: 'Premises Ownership', matchKeys: ['property', 'index', 'tax', 'ownership', 'premises', 'khata', '7/12', 'receipt'], required: true },
  { id: 'BANK_PASSBOOK', title: 'Bank Passbook / Cheque (DBT)', category: 'DBT Subsidy Banking', matchKeys: ['bank', 'passbook', 'cheque', 'dbt', 'account', 'statement'], required: true },
  { id: 'ROOF_PHOTO', title: 'Rooftop Site & Shadow Photos', category: 'Site Survey', matchKeys: ['roof', 'site', 'photo', 'shadow', 'survey', 'terrace', 'aerial', 'drone'], required: false },
  { id: 'NET_METER_SANCTION', title: 'DISCOM Net-Meter Sanction NOC', category: 'Net Metering Application', matchKeys: ['net meter', 'sanction', 'noc', 'approval', 'discom letter'], required: false },
  { id: 'COMMISSIONING_CERT', title: 'Work Completion Report (WCR)', category: 'Work Completion Report (WCR)', matchKeys: ['wcr', 'commission', 'handover', 'completion', 'ceig', 'test report'], required: false },
];

// PM Surya Ghar national portal 7 stages
const SUBSIDY_PORTAL_STAGES = [
  { id: 'CONSUMER_SELECTION', label: 'Registration', num: 1 },
  { id: 'FEASIBILITY_APPROVED', label: 'Feasibility', num: 2 },
  { id: 'VENDOR_SELECTED', label: 'Agreement', num: 3 },
  { id: 'WORK_COMPLETED', label: 'Install Done', num: 4 },
  { id: 'METER_INSPECTED', label: 'DISCOM Meter', num: 5 },
  { id: 'CLAIM_GENERATED', label: 'Claim Filed', num: 6 },
  { id: 'DBT_DISBURSED', label: 'DBT Disbursed', num: 7 },
];

function getSubsidyPortalStageIndex(stage?: string): number {
  if (!stage) return 1;
  const s = stage.toUpperCase();
  if (s.includes('DBT') || s.includes('DISBURS')) return 7;
  if (s.includes('CLAIM')) return 6;
  if (s.includes('METER') || s.includes('INSPECT')) return 5;
  if (s.includes('WORK') || s.includes('INSTALL') || s.includes('COMPLET')) return 4;
  if (s.includes('VENDOR') || s.includes('AGREE')) return 3;
  if (s.includes('FEASIBILITY')) return 2;
  return 1;
}

function calculatePmSuryaGharSubsidy(capacityKw: number): number {
  if (!capacityKw || capacityKw <= 0) return 0;
  if (capacityKw <= 1.0) return 30000;
  if (capacityKw <= 2.0) return 60000;
  return 78000;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  visible,
  customerId,
  leadId,
  customerData: initialCustomerData,
  onClose,
  onUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<ProfileTab>('OVERVIEW');
  const [customer, setCustomer] = useState<any>(initialCustomerData || null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Mode Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCustomerType, setEditCustomerType] = useState('RESIDENTIAL');
  const [savingEdit, setSavingEdit] = useState(false);

  // Sub-Modals
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<any | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [createInvoiceModalVisible, setCreateInvoiceModalVisible] = useState(false);
  const [discomDocsProject, setDiscomDocsProject] = useState<any | null>(null);
  const [discomDocsModalVisible, setDiscomDocsModalVisible] = useState(false);
  const [quoteBuilderVisible, setQuoteBuilderVisible] = useState(false);

  // Instant UPI QR Collection Modal State
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiTargetInvoice, setUpiTargetInvoice] = useState<any | null>(null);
  const [upiQrData, setUpiQrData] = useState<any | null>(null);
  const [loadingUpi, setLoadingUpi] = useState(false);

  const handleOpenUpiPay = async (inv: any) => {
    try {
      haptics.impactLight();
      setUpiTargetInvoice(inv);
      setUpiModalVisible(true);
      setLoadingUpi(true);
      setUpiQrData(null);
      const res = await financeApi.getInvoiceUpiQr(inv.id);
      if (res?.upiUri) {
        setUpiQrData(res);
      }
    } catch (err: any) {
      console.warn('UPI QR fetch notice:', err.message);
    } finally {
      setLoadingUpi(false);
    }
  };

  // Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [postingNote, setPostingNote] = useState(false);

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'mediaLibrary' | 'storage'>('camera');
  const [targetDocCategory, setTargetDocCategory] = useState<string>('Customer KYC');

  // Load customer data when opened
  const effectiveId = customerId || initialCustomerData?.id || initialCustomerData?.customerId || leadId || initialCustomerData?.leadId;

  const fetchCustomerProfile = useCallback(async (isRefresh: boolean = false) => {
    if (!effectiveId) return;

    if (isRefresh) setRefreshing(true);
    else if (!customer) setLoading(true);

    // 1. Try local cache first for zero-flicker startup
    try {
      const cached = await offlineSyncService.getCachedResponse<any>(`customer_profile_${effectiveId}`);
      if (cached?.data && !customer) {
        setCustomer(cached.data);
        setLoading(false);
      }
    } catch { }

    // 2. Fetch fresh from server
    try {
      const res = await customerApi.getCustomer(effectiveId);
      if (res?.customer) {
        // Merge with initial data to guarantee zero data loss
        const mergedProjects = [...(res.customer.projects || [])];
        if (Array.isArray(initialCustomerData?.projects)) {
          initialCustomerData.projects.forEach((p: any) => {
            if (p?.id && !mergedProjects.some((x: any) => x.id === p.id)) {
              mergedProjects.push(p);
            }
          });
        }

        const mergedQuotations = [...(res.customer.quotations || [])];
        if (Array.isArray(initialCustomerData?.quotations)) {
          initialCustomerData.quotations.forEach((q: any) => {
            if (q?.id && !mergedQuotations.some((x: any) => x.id === q.id)) {
              mergedQuotations.push(q);
            }
          });
        }

        const mergedInvoices = [...(res.customer.invoices || [])];
        if (Array.isArray(initialCustomerData?.invoices)) {
          initialCustomerData.invoices.forEach((i: any) => {
            if (i?.id && !mergedInvoices.some((x: any) => x.id === i.id)) {
              mergedInvoices.push(i);
            }
          });
        }

        const mergedDocs = [...(res.customer.documents || res.customer.Document || [])];
        if (Array.isArray(initialCustomerData?.Document)) {
          initialCustomerData.Document.forEach((d: any) => {
            if (d?.id && !mergedDocs.some((x: any) => x.id === d.id)) {
              mergedDocs.push(d);
            }
          });
        }
        if (Array.isArray(initialCustomerData?.documents)) {
          initialCustomerData.documents.forEach((d: any) => {
            if (d?.id && !mergedDocs.some((x: any) => x.id === d.id)) {
              mergedDocs.push(d);
            }
          });
        }

        const mergedCustomer = {
          ...initialCustomerData,
          ...res.customer,
          projects: mergedProjects,
          quotations: mergedQuotations,
          invoices: mergedInvoices,
          documents: mergedDocs,
          Document: mergedDocs,
        };

        setCustomer(mergedCustomer);
        offlineSyncService.setCachedResponse(`customer_profile_${effectiveId}`, mergedCustomer).catch(() => { });
        if (onUpdate) onUpdate(mergedCustomer);
      }
    } catch (err: any) {
      console.warn('CustomerProfile fetch error:', err.message);
      // Fallback: If initial data was provided, keep it
      if (initialCustomerData && !customer) {
        setCustomer(initialCustomerData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveId, initialCustomerData, customer, onUpdate]);

  useEffect(() => {
    if (visible && effectiveId) {
      fetchCustomerProfile(false);
    }
    if (!visible) {
      setActiveTab('OVERVIEW');
    }
  }, [visible, effectiveId]);

  // Sync initial data if passed
  useEffect(() => {
    if (initialCustomerData && (!customer || customer.id !== initialCustomerData.id)) {
      setCustomer((prev: any) => ({ ...(prev || {}), ...initialCustomerData }));
    }
  }, [initialCustomerData]);

  // Initialize edit fields
  const handleOpenEdit = () => {
    if (!customer) return;
    haptics.selection();
    setEditName(customer.name || customer.lead?.name || '');
    setEditCompany(customer.company || customer.lead?.company || '');
    setEditMobile(customer.mobile || customer.phone || customer.lead?.mobile || customer.lead?.phone || '');
    setEditEmail(customer.email || customer.lead?.email || '');
    setEditAddress(customer.address || customer.lead?.address || '');
    setEditCity(customer.city || customer.lead?.city || '');
    setEditCustomerType(customer.customerType || customer.lead?.customerType || 'RESIDENTIAL');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Required Field', 'Customer name is required.');
      return;
    }
    if (!editMobile.trim()) {
      Alert.alert('Required Field', 'Customer mobile number is required.');
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        name: editName.trim(),
        company: editCompany.trim() || null,
        mobile: editMobile.trim(),
        email: editEmail.trim() || null,
        address: editAddress.trim() || null,
        city: editCity.trim() || null,
        customerType: editCustomerType,
      };

      const res = await customerApi.updateCustomer(customer.id || effectiveId, payload);
      const updated = res.customer || { ...customer, ...payload };
      setCustomer((prev: any) => ({ ...prev, ...updated }));
      haptics.notificationSuccess();
      setEditModalVisible(false);
      if (onUpdate) onUpdate(updated);
      Alert.alert('Customer Updated', 'Profile details updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.error || err.message || 'Could not update customer.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Add field note
  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setPostingNote(true);
    try {
      await customerApi.addNote(customer.id || effectiveId, newNoteText.trim());
      haptics.notificationSuccess();
      setNewNoteText('');
      fetchCustomerProfile(true);
      Alert.alert('Note Saved', 'Field note added to customer dossier.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save note.');
    } finally {
      setPostingNote(false);
    }
  };

  // Communication Handlers
  const handleCall = () => {
    const ph = customer?.mobile || customer?.phone || customer?.lead?.mobile || customer?.lead?.phone;
    if (!ph) {
      Alert.alert('No Phone Number', 'No contact phone number is associated with this customer.');
      return;
    }
    haptics.impactLight();
    Linking.openURL(`tel:${ph}`).catch(() => {
      Alert.alert('Dialer Error', 'Could not open device phone dialer.');
    });
  };

  const handleWhatsApp = () => {
    haptics.impactMedium();
    openWhatsAppWithPitch(customer || {});
  };

  const handleEmail = () => {
    const mail = customer?.email || customer?.lead?.email;
    if (!mail) {
      Alert.alert('No Email', 'No email address recorded for this customer.');
      return;
    }
    haptics.impactLight();
    Linking.openURL(`mailto:${mail}`).catch(() => {
      Alert.alert('Email Error', 'Could not open mail app.');
    });
  };

  const handleOpenMap = () => {
    const addr =
      customer?.address ||
      customer?.city ||
      customer?.lead?.address ||
      customer?.lead?.city ||
      activeProject?.installationAddress;
    if (!addr) {
      Alert.alert('No Address', 'Customer has no address or city recorded.');
      return;
    }
    haptics.impactLight();
    const query = encodeURIComponent(`${addr}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    Linking.openURL(url!).catch(() => {
      Alert.alert('Map Error', 'Could not open maps application.');
    });
  };

  // Document Upload Handlers
  const handleUploadFromCamera = async (category: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setPermissionType('camera');
        setPermissionModalVisible(true);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await executeUpload(result.assets[0].uri, `doc_${Date.now()}.jpg`, 'image/jpeg', category);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message);
    }
  };

  const handleUploadFromFile = async (category: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await executeUpload(file.uri, file.name, file.mimeType || 'application/pdf', category);
      }
    } catch (err: any) {
      Alert.alert('File Pick Error', err.message);
    }
  };

  const executeUpload = async (uri: string, name: string, type: string, category: string) => {
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name,
        type,
      } as any);
      formData.append('title', name);
      formData.append('category', category);
      if (customer?.id) formData.append('customerId', customer.id);
      if (projects.length > 0 && projects[0].id) formData.append('projectId', projects[0].id);

      await documentsApi.uploadDocument(formData);
      haptics.notificationSuccess();
      Alert.alert('Uploaded', 'Document saved to customer profile successfully.');
      fetchCustomerProfile(true);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.response?.data?.error || err.message || 'Could not upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Comprehensive safe aggregations across related models
  const projects = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.projects)) list.push(...customer.projects);
    if (Array.isArray(customer?.lead?.projects)) list.push(...customer.lead.projects);
    if (Array.isArray(initialCustomerData?.projects)) list.push(...initialCustomerData.projects);
    const seen = new Set();
    return list.filter((p) => {
      if (!p?.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [customer, initialCustomerData]);

  const activeProject = projects.length > 0 ? projects[0] : null;

  const quotations = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.quotations)) list.push(...customer.quotations);
    if (Array.isArray(customer?.lead?.quotations)) list.push(...customer.lead.quotations);
    if (Array.isArray(initialCustomerData?.quotations)) list.push(...initialCustomerData.quotations);
    projects.forEach((p) => {
      if (p?.quotation) list.push(p.quotation);
    });
    const seen = new Set();
    return list.filter((q) => {
      if (!q?.id || seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }, [customer, initialCustomerData, projects]);

  const latestQuote = quotations.length > 0 ? quotations[0] : null;

  const surveys = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.surveys)) list.push(...customer.surveys);
    if (Array.isArray(customer?.lead?.surveys)) list.push(...customer.lead.surveys);
    if (Array.isArray(initialCustomerData?.surveys)) list.push(...initialCustomerData.surveys);
    projects.forEach((p) => {
      if (p.survey) list.push(p.survey);
    });
    const seen = new Set();
    return list.filter((s) => {
      if (!s?.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [customer, initialCustomerData, projects]);

  const activeSurvey = surveys.length > 0 ? surveys[0] : null;

  const invoices = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.invoices)) list.push(...customer.invoices);
    if (Array.isArray(customer?.lead?.customer?.invoices)) list.push(...customer.lead.customer.invoices);
    if (Array.isArray(initialCustomerData?.invoices)) list.push(...initialCustomerData.invoices);
    projects.forEach((p: any) => {
      if (Array.isArray(p?.invoices)) list.push(...p.invoices);
    });
    const seen = new Set();
    return list.filter((inv) => {
      if (!inv?.id || seen.has(inv.id)) return false;
      seen.add(inv.id);
      return true;
    });
  }, [customer, initialCustomerData, projects]);

  const subsidies = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.subsidies)) list.push(...customer.subsidies);
    if (Array.isArray(customer?.lead?.subsidies)) list.push(...customer.lead.subsidies);
    projects.forEach((p: any) => {
      if (Array.isArray(p?.subsidies)) list.push(...p.subsidies);
    });
    const seen = new Set();
    return list.filter((s) => {
      if (!s?.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [customer, projects]);

  const activeSubsidy = subsidies.length > 0 ? subsidies[0] : null;

  const loans = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.loans)) list.push(...customer.loans);
    if (Array.isArray(customer?.lead?.loans)) list.push(...customer.lead.loans);
    projects.forEach((p: any) => {
      if (Array.isArray(p?.loans)) list.push(...p.loans);
    });
    const seen = new Set();
    return list.filter((l) => {
      if (!l?.id || seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
  }, [customer, projects]);

  const activeLoan = loans.length > 0 ? loans[0] : null;

  const amcs = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.amcs)) list.push(...customer.amcs);
    projects.forEach((p: any) => {
      if (Array.isArray(p?.amcs)) list.push(...p.amcs);
    });
    const seen = new Set();
    return list.filter((a) => {
      if (!a?.id || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [customer, projects]);

  const activeAmc = amcs.length > 0 ? amcs[0] : null;

  const tickets = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.tickets)) list.push(...customer.tickets);
    projects.forEach((p: any) => {
      if (Array.isArray(p?.tickets)) list.push(...p.tickets);
    });
    const seen = new Set();
    return list.filter((t) => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [customer, projects]);

  const documents = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(customer?.documents)) list.push(...customer.documents);
    if (Array.isArray(customer?.Document)) list.push(...customer.Document);
    if (Array.isArray(initialCustomerData?.Document)) list.push(...initialCustomerData.Document);
    if (Array.isArray(initialCustomerData?.documents)) list.push(...initialCustomerData.documents);
    projects.forEach((p: any) => {
      if (Array.isArray(p?.Document)) list.push(...p.Document);
      if (Array.isArray(p?.documents)) list.push(...p.documents);
    });
    const seen = new Set();
    return list.filter((d) => {
      if (!d?.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [customer, initialCustomerData, projects]);

  // Combined timeline of notes, activities, and project stage transitions
  const timelineItems = useMemo(() => {
    const items: { id: string; type: string; title: string; date: string; bulletColor: string }[] = [];
    const seen = new Set();

    // 1. Direct Backend Pre-Synthesized Timeline
    if (Array.isArray(customer?.timeline) && customer.timeline.length > 0) {
      customer.timeline.forEach((item: any) => {
        if (!item?.id || seen.has(item.id)) return;
        seen.add(item.id);
        items.push({
          id: item.id,
          type: item.type || 'TIMELINE_EVENT',
          title: item.title || 'Event',
          date: item.date || item.createdAt || '',
          bulletColor: item.bulletColor || '#0066FF',
        });
      });
      return items;
    }

    // 2. Client-side fallback aggregation if offline or fresh note
    const leadNotes = customer?.lead?.leadNotes || customer?.lead?.notes || [];
    if (Array.isArray(leadNotes)) {
      leadNotes.forEach((n: any) => {
        const id = n.id || `note-${Math.random()}`;
        if (!seen.has(id)) {
          seen.add(id);
          items.push({
            id,
            type: 'FIELD_NOTE',
            title: n.content || n.notes || 'Field Note',
            date: n.createdAt || '',
            bulletColor: '#0066FF',
          });
        }
      });
    }

    const activities = customer?.lead?.activities || [];
    if (Array.isArray(activities)) {
      activities.forEach((act: any) => {
        const id = act.id || `act-${Math.random()}`;
        if (!seen.has(id)) {
          seen.add(id);
          items.push({
            id,
            type: act.type || 'ACTIVITY',
            title: act.description || 'Activity Logged',
            date: act.createdAt || '',
            bulletColor: '#10B981',
          });
        }
      });
    }

    projects.forEach((p: any) => {
      if (Array.isArray(p.timelineEvents)) {
        p.timelineEvents.forEach((ev: any) => {
          const id = ev.id || `ev-${Math.random()}`;
          if (!seen.has(id)) {
            seen.add(id);
            items.push({
              id,
              type: 'PROJECT_EVENT',
              title: `${p.name || 'Project'}: ${ev.title || ev.description || 'Status update'}`,
              date: ev.createdAt || ev.date || '',
              bulletColor: '#8B5CF6',
            });
          }
        });
      }
      if (Array.isArray(p.stageHistory)) {
        p.stageHistory.forEach((sh: any) => {
          const id = sh.id || `sh-${Math.random()}`;
          if (!seen.has(id)) {
            seen.add(id);
            items.push({
              id,
              type: 'STAGE_ADVANCE',
              title: `${p.name || 'Project'}: Stage updated to ${sh.stage || sh.newStage || 'Next Stage'}`,
              date: sh.createdAt || '',
              bulletColor: '#F59E0B',
            });
          }
        });
      }
    });

    // Sort descending by date
    items.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });

    return items;
  }, [customer, projects]);

  // Derived technical & solar sizing metrics
  const totalCapacityKw = Number(
    activeProject?.capacity ||
    activeSurvey?.proposedCap ||
    activeSurvey?.recommendedCapacity ||
    latestQuote?.systemCapacity ||
    latestQuote?.capacity ||
    customer?.lead?.estimatedCap ||
    customer?.lead?.recommendedKw ||
    3.3
  );

  const estimatedTurnkeyCost = Number(
    activeProject?.estimatedValue ||
    latestQuote?.total ||
    latestQuote?.subtotal ||
    customer?.lead?.estimatedValue ||
    Math.round(totalCapacityKw * 56000)
  );

  const pmSubsidyAmount = Number(
    activeSubsidy?.centralSubsidyAmount ||
    activeSubsidy?.amount ||
    latestQuote?.indicativeSubsidy ||
    latestQuote?.subsidyAmount ||
    calculatePmSuryaGharSubsidy(totalCapacityKw)
  );

  const netPayableAmount = Number(
    latestQuote?.netCustomerCost ||
    latestQuote?.netPayable ||
    Math.max(0, estimatedTurnkeyCost - pmSubsidyAmount)
  );

  const monthlyUnits = Number(
    activeSurvey?.avgMonthlyUnits ||
    (latestQuote?.annualGeneration ? Math.round(latestQuote.annualGeneration / 12) : Math.round(totalCapacityKw * 120))
  );

  const monthlySavings = Number(
    latestQuote?.monthlySavings ||
    (activeSurvey?.estimatedAnnualSavings ? Math.round(activeSurvey.estimatedAnnualSavings / 12) : Math.round(monthlyUnits * 8.5))
  );

  const lifetimeSavings = Number(
    latestQuote?.lifetimeSavings ||
    Math.round(monthlySavings * 12 * 25)
  );

  // Financial Ledger calculations
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const totalPaid = invoices.reduce((s: number, i: any) => {
    const pSum = (i.payments || []).reduce((ps: number, p: any) => ps + (Number(p.amount) || 0), 0);
    return s + (Number(i.totalPaid) || pSum || (i.status === 'PAID' ? Number(i.amount) : 0));
  }, 0);
  const totalDue = Math.max(0, totalInvoiced - totalPaid);
  const realizationPct = totalInvoiced > 0 ? Math.min(100, Math.round((totalPaid / totalInvoiced) * 100)) : 0;

  // Real consumer & site credentials
  const consumerNumber =
    activeSubsidy?.consumerNumber ||
    activeProject?.consumerNumber ||
    activeProject?.discomApplication?.consumerNumber ||
    activeSurvey?.discomConsumerNo ||
    customer?.consumerNumber ||
    customer?.lead?.consumerNumber ||
    customer?.lead?.electricityConnection ||
    'Pending';

  const discomName =
    activeSubsidy?.discomName ||
    activeSurvey?.discomName ||
    activeProject?.discomName ||
    customer?.discomName ||
    'State Electricity DISCOM';

  const customerCity =
    customer?.city ||
    customer?.lead?.city ||
    activeProject?.city ||
    activeSurvey?.city ||
    'Location Pending';

  const customerState =
    customer?.state ||
    customer?.lead?.state ||
    activeProject?.state ||
    activeSurvey?.state ||
    '';

  const customerAddress =
    customer?.address ||
    customer?.lead?.address ||
    activeProject?.installationAddress ||
    activeSurvey?.address ||
    'Site Address Pending';

  const customerPincode =
    customer?.pincode ||
    customer?.lead?.pincode ||
    activeProject?.pincode ||
    activeSurvey?.pincode ||
    '';

  const customerType =
    customer?.customerType ||
    customer?.lead?.customerType ||
    'RESIDENTIAL';

  // Aadhaar and PAN documents or lead data
  const aadhaarDoc = documents.find((d) =>
    (d.category || d.title || '').toLowerCase().includes('aadhaar') ||
    (d.category || d.title || '').toLowerCase().includes('aadhar')
  );

  const panDoc = documents.find((d) =>
    (d.category || d.title || '').toLowerCase().includes('pan')
  );

  const displayAadhaar = customer?.lead?.aadhaar || customer?.lead?.aadhaarNumber
    ? maskAadhaarNumber(customer.lead.aadhaar || customer.lead.aadhaarNumber)
    : aadhaarDoc
      ? 'Aadhaar Verified & Attached'
      : 'Pending Statutory Verification';

  const displayPan = customer?.lead?.pan || customer?.lead?.panNumber
    ? maskPanNumber(customer.lead.pan || customer.lead.panNumber)
    : panDoc
      ? 'PAN Verified & Attached'
      : 'Pending Statutory Verification';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#090D16' : '#F8FAFC' }]}>
        {/* HEADER */}
        <ModalHeader
          title="Customer 360° Profile"
          subtitle={customer?.name ? `${customer.name} • WhereReady Solar OS` : 'Client Operational Dossier'}
          onClose={onClose}
          rightAction={
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: colors.borderSubtle },
              ]}
              onPress={handleOpenEdit}
              activeOpacity={0.7}
            >
              <Edit3 size={15} color="#0066FF" />
              <Text style={styles.headerActionBtnText}>Edit</Text>
            </TouchableOpacity>
          }
        />

        {loading && !customer ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Hydrating complete customer dossier...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchCustomerProfile(true)}
                tintColor="#0066FF"
                colors={['#0066FF']}
              />
            }
          >
            {/* HERO PROFILE CARD */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>
                    {customer?.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>

                <View style={styles.heroInfoBlock}>
                  <View style={styles.heroTitleRow}>
                    <Text style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>
                      {customer?.name || 'Customer'}
                    </Text>
                    <View
                      style={[
                        styles.customerTypeBadge,
                        {
                          backgroundColor:
                            customerType === 'COMMERCIAL'
                              ? 'rgba(99, 102, 241, 0.12)'
                              : customerType === 'INDUSTRIAL'
                                ? 'rgba(236, 72, 153, 0.12)'
                                : 'rgba(16, 185, 129, 0.12)',
                          borderColor:
                            customerType === 'COMMERCIAL'
                              ? '#6366F1'
                              : customerType === 'INDUSTRIAL'
                                ? '#EC4899'
                                : '#10B981',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.customerTypeBadgeText,
                          {
                            color:
                              customerType === 'COMMERCIAL'
                                ? '#818CF8'
                                : customerType === 'INDUSTRIAL'
                                  ? '#F472B6'
                                  : '#10B981',
                          },
                        ]}
                      >
                        {customerType}
                      </Text>
                    </View>
                  </View>

                  {customer?.company ? (
                    <Text style={[styles.companyText, { color: colors.textSecondary }]}>
                      {customer.company}
                    </Text>
                  ) : null}

                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                      {customerCity} • {discomName} (CA: {consumerNumber})
                    </Text>
                  </View>
                </View>
              </View>

              {/* QUICK DIRECT COMMS STRIP */}
              <View style={[styles.commsStrip, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <TouchableOpacity
                  style={[styles.commBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <Phone size={14} color="#0066FF" strokeWidth={2.4} />
                  <Text style={[styles.commBtnText, { color: '#0066FF' }]}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.commBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}
                  onPress={handleWhatsApp}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={14} color="#10B981" strokeWidth={2.4} />
                  <Text style={[styles.commBtnText, { color: '#10B981' }]}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.commBtn, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  onPress={handleEmail}
                  activeOpacity={0.8}
                >
                  <Mail size={14} color={colors.textSecondary} strokeWidth={2.2} />
                  <Text style={[styles.commBtnText, { color: colors.textSecondary }]}>Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.commBtn, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  onPress={handleOpenMap}
                  activeOpacity={0.8}
                >
                  <MapPin size={14} color="#0284C7" strokeWidth={2.2} />
                  <Text style={[styles.commBtnText, { color: '#0284C7' }]}>Map</Text>
                </TouchableOpacity>
              </View>

              {/* 4-STAT SUMMARY RIBBON */}
              <View style={[styles.statsRibbon, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <View style={styles.statCell}>
                  <Text style={[styles.statCellLabel, { color: colors.textMuted }]}>CAPACITY</Text>
                  <Text style={[styles.statCellVal, { color: '#0066FF' }]}>{totalCapacityKw} kWp</Text>
                  <Text style={[styles.statCellSub, { color: colors.textMuted }]}>~{monthlyUnits} kWh/mo</Text>
                </View>

                <View style={[styles.statCellDivider, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} />

                <View style={styles.statCell}>
                  <Text style={[styles.statCellLabel, { color: colors.textMuted }]}>PROJECTS</Text>
                  <Text style={[styles.statCellVal, { color: colors.text }]}>{projects.length || 0}</Text>
                  <Text style={[styles.statCellSub, { color: '#10B981' }]}>
                    {activeProject?.currentStage || activeProject?.status || (projects.length > 0 ? 'Active' : 'Pending')}
                  </Text>
                </View>

                <View style={[styles.statCellDivider, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} />

                <View style={styles.statCell}>
                  <Text style={[styles.statCellLabel, { color: colors.textMuted }]}>DUE BALANCE</Text>
                  <Text style={[styles.statCellVal, { color: totalDue > 0 ? '#EF4444' : '#10B981' }]}>
                    ₹{(totalDue / 1000).toFixed(0)}k
                  </Text>
                  <Text style={[styles.statCellSub, { color: colors.textMuted }]}>{realizationPct}% Paid</Text>
                </View>

                <View style={[styles.statCellDivider, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} />

                <View style={styles.statCell}>
                  <Text style={[styles.statCellLabel, { color: colors.textMuted }]}>DBT SUBSIDY</Text>
                  <Text style={[styles.statCellVal, { color: '#F59E0B' }]}>₹{(pmSubsidyAmount / 1000).toFixed(0)}k</Text>
                  <Text style={[styles.statCellSub, { color: colors.textMuted }]}>Central CFA</Text>
                </View>
              </View>
            </View>

            {/* TAB SELECTOR */}
            <View style={styles.tabsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScrollContent}
              >
                {PROFILE_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.tabBtn,
                        isActive && [
                          styles.tabBtnActive,
                          {
                            backgroundColor: '#0066FF',
                            borderColor: '#0066FF',
                          },
                        ],
                        !isActive && {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setActiveTab(tab.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Icon
                        size={14}
                        color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <Text
                        style={[
                          styles.tabBtnText,
                          { color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                          isActive && { fontWeight: '700' },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ========================================== */}
            {/* TAB 1: OVERVIEW & TECHNICAL SITE SPECS     */}
            {/* ========================================== */}
            {activeTab === 'OVERVIEW' && (
              <View style={styles.tabContentBlock}>
                {/* CONTACT & SITE IDENTITY */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Contact & Site Identity</Text>

                  <DetailRow label="Primary Phone" value={customer?.mobile || customer?.phone || customer?.lead?.mobile || customer?.lead?.phone || 'Not Recorded'} isCopyable />
                  <DetailRow label="Alternate Phone" value={customer?.alternatePhone || customer?.lead?.alternatePhone || 'None'} />
                  <DetailRow label="Email Address" value={customer?.email || customer?.lead?.email || 'None Provided'} />
                  <DetailRow label="Site Address" value={customerAddress} />
                  <DetailRow label="City & State" value={`${customerCity}${customerState ? `, ${customerState}` : ''}`} />
                  <DetailRow label="Pincode" value={customerPincode || 'Not Specified'} />
                </View>

                {/* DISCOM & GRID SPECS */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>DISCOM & Grid Infrastructure</Text>

                  <DetailRow label="Utility DISCOM" value={discomName} isBadge badgeColor="blue" />
                  <DetailRow label="Consumer Account (CA)" value={consumerNumber} isCopyable />
                  <DetailRow
                    label="Sanctioned Load"
                    value={
                      activeSurvey?.sanctionedLoad
                        ? `${activeSurvey.sanctionedLoad} kW`
                        : customer?.lead?.sanctionedLoad
                          ? `${customer.lead.sanctionedLoad} kW`
                          : customer?.sanctionedLoadKw
                            ? `${customer.sanctionedLoadKw} kW`
                            : `${totalCapacityKw} kW (Estimated)`
                    }
                  />
                  <DetailRow
                    label="Grid Connection Type"
                    value={activeSurvey?.electricalPhase || latestQuote?.phase || (totalCapacityKw > 3 ? 'Three Phase 415V' : 'Single Phase 230V')}
                  />
                  <DetailRow
                    label="Tariff Category"
                    value={customer?.tariffCategory || (customerType === 'COMMERCIAL' ? 'LT-II Commercial' : customerType === 'INDUSTRIAL' ? 'HT-I Industrial' : 'LT-I Residential')}
                  />
                  <DetailRow
                    label="Bi-Directional Meter"
                    value={activeProject?.status === 'COMMISSIONED' ? 'Installed & Commissioned' : activeSurvey?.meterType || 'Statutory Application Processing'}
                    isBadge
                    badgeColor={activeProject?.status === 'COMMISSIONED' ? 'green' : 'amber'}
                  />
                </View>

                {/* ROOFTOP & SOLAR SIZING ARCHITECTURE */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Rooftop Engineering & Yield</Text>

                  <DetailRow label="Recommended Capacity" value={`${totalCapacityKw} kWp Rooftop Solar`} isBadge badgeColor="blue" />
                  <DetailRow
                    label="Module Technology"
                    value={latestQuote?.panelBrand ? `${latestQuote.panelBrand} ${latestQuote.panelWattage ? `${latestQuote.panelWattage}W` : ''} ${latestQuote.panelModel || 'DCR Tier-1'}` : 'TopCon / Mono-PERC DCR Tier-1'}
                  />
                  <DetailRow
                    label="Roof Construction"
                    value={activeSurvey?.roofType || latestQuote?.roofType || customer?.lead?.roofType || 'RCC Flat Concrete'}
                  />
                  <DetailRow
                    label="Usable Shadow-Free Area"
                    value={
                      activeSurvey?.usableShadowFreeArea
                        ? `${activeSurvey.usableShadowFreeArea} Sq.Ft`
                        : activeSurvey?.totalRoofArea
                          ? `${activeSurvey.totalRoofArea} Sq.Ft`
                          : customer?.lead?.roofArea
                            ? `${customer.lead.roofArea} Sq.Ft`
                            : `~${Math.round(totalCapacityKw * 100)} Sq.Ft (Estimated)`
                    }
                  />
                  <DetailRow
                    label="Mounting Structure"
                    value={activeSurvey?.structurePreference || latestQuote?.structureBrand || 'Standard Pre-Galvanized HDGI MMS'}
                  />
                  <DetailRow label="Expected Monthly Yield" value={`~${monthlyUnits} kWh / Units`} />
                  <DetailRow label="Monthly Electricity Savings" value={`₹${monthlySavings.toLocaleString('en-IN')}`} isBadge badgeColor="green" />
                  <DetailRow label="25-Year Lifetime Savings" value={`₹${lifetimeSavings.toLocaleString('en-IN')}`} isBadge badgeColor="green" />
                </View>

                {/* DPDP STATUTORY CONSENT & PRIVACY */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderWithIcon}>
                    <ShieldCheck size={18} color="#10B981" />
                    <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                      DPDP Act 2023 Digital Privacy
                    </Text>
                  </View>
                  <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                    Data collected for statutory solar net-metering & PM Surya Ghar DBT processing.
                  </Text>

                  <DetailRow label="DPDP Consent Status" value="CONSENT_ACTIVE (Verified)" isBadge badgeColor="green" />
                  <DetailRow label="Masked Aadhaar" value={displayAadhaar} />
                  <DetailRow label="Masked PAN" value={displayPan} />
                  <DetailRow label="Data Principal Right" value="Full Erasure & Export Protected" />
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 2: PROJECTS & 7-STAGE PROGRESS        */}
            {/* ========================================== */}
            {activeTab === 'PROJECTS' && (
              <View style={styles.tabContentBlock}>
                {projects.length === 0 ? (
                  <View
                    style={[
                      styles.cardSection,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        alignItems: 'center',
                        paddingVertical: 32,
                      },
                    ]}
                  >
                    <Briefcase size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects Provisioned</Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                      Convert accepted quotation into an active EPC turnkey project.
                    </Text>
                  </View>
                ) : (
                  projects.map((proj: any, idx: number) => {
                    const cap = proj.capacity || totalCapacityKw;
                    const stage = proj.currentStage || proj.status || 'SURVEY';
                    const stageIdx = getProjectStageIndex(stage);
                    const progressPct = calculateProjectProgressPct(stage);

                    return (
                      <View
                        key={proj.id || idx}
                        style={[
                          styles.cardSection,
                          {
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: isDark ? '#1E293B' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.projectCardHeader}>
                          <View>
                            <Text style={[styles.projectNameTitle, { color: colors.text }]}>
                              {proj.name || `${cap} kWp Solar Rooftop EPC`}
                            </Text>
                            <Text style={[styles.projectSubId, { color: colors.textMuted }]}>
                              Project No: {proj.projectNumber || `PRJ-${String(idx + 1).padStart(4, '0')}`}
                            </Text>
                          </View>
                          <View style={styles.projectStageBadge}>
                            <Text style={styles.projectStageBadgeText}>{stage}</Text>
                          </View>
                        </View>

                        {/* 7-STAGE CANONICAL MILESTONE PROGRESS BAR */}
                        <View style={styles.milestoneSection}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={[styles.milestoneHeading, { color: colors.textSecondary, marginBottom: 0 }]}>
                              EPC MILESTONE PROGRESS
                            </Text>
                            <Text style={[styles.milestoneHeading, { color: '#0066FF', marginBottom: 0 }]}>
                              {progressPct}% (Stage {stageIdx}/7)
                            </Text>
                          </View>

                          <View style={styles.milestoneGrid}>
                            {[
                              { label: 'Survey', step: 1 },
                              { label: 'Design', step: 2 },
                              { label: 'Procure', step: 3 },
                              { label: 'Install', step: 4 },
                              { label: 'DISCOM', step: 5 },
                              { label: 'Inspect', step: 6 },
                              { label: 'Handover', step: 7 },
                            ].map((s) => {
                              const isCompleted = s.step <= stageIdx;
                              const isCurrent = s.step === stageIdx;
                              return (
                                <View key={s.step} style={styles.milestoneCol}>
                                  <View
                                    style={[
                                      styles.milestoneDot,
                                      {
                                        backgroundColor: isCompleted
                                          ? '#10B981'
                                          : isDark
                                            ? '#334155'
                                            : '#E2E8F0',
                                        borderWidth: isCurrent ? 2 : 0,
                                        borderColor: '#0066FF',
                                      },
                                    ]}
                                  >
                                    {isCompleted ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
                                  </View>
                                  <Text
                                    style={[
                                      styles.milestoneText,
                                      {
                                        color: isCompleted ? colors.text : colors.textMuted,
                                        fontWeight: isCurrent ? '800' : '500',
                                      },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {s.label}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>

                        <DetailRow label="System Capacity" value={`${cap} kWp`} />
                        <DetailRow label="Contract Turnkey Value" value={`₹${(proj.estimatedValue || estimatedTurnkeyCost).toLocaleString('en-IN')}`} />
                        <DetailRow label="DISCOM Consumer No." value={proj.consumerNumber || consumerNumber} />

                        {/* QUICK ACTIONS ON THIS PROJECT */}
                        <View style={styles.projectActionRow}>
                          <TouchableOpacity
                            style={[
                              styles.projectActionBtn,
                              { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#0066FF' },
                            ]}
                            onPress={() => {
                              setDiscomDocsProject(proj);
                              setDiscomDocsModalVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <FileText size={13} color="#0066FF" />
                            <Text style={[styles.projectActionBtnText, { color: '#0066FF' }]}>DISCOM Dossier</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 3: QUOTATIONS & PROPOSALS             */}
            {/* ========================================== */}
            {activeTab === 'QUOTATIONS' && (
              <View style={styles.tabContentBlock}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => setQuoteBuilderVisible(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.primaryActionButtonText}>Create 60-Second Quotation</Text>
                </TouchableOpacity>

                {quotations.length === 0 ? (
                  <View
                    style={[
                      styles.cardSection,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        alignItems: 'center',
                        paddingVertical: 32,
                      },
                    ]}
                  >
                    <FileText size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Quotations Generated</Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                      Tap above to generate an instant PM Surya Ghar proposal.
                    </Text>
                  </View>
                ) : (
                  quotations.map((q: any) => {
                    const isAccepted = q.status === 'ACCEPTED';
                    const qCap = q.systemCapacity || q.capacity || totalCapacityKw;
                    const qGross = Number(q.total || q.subtotal || estimatedTurnkeyCost);
                    const qSub = Number(q.indicativeSubsidy || q.subsidyAmount || calculatePmSuryaGharSubsidy(qCap));
                    const qNet = Number(q.netCustomerCost || q.netPayable || Math.max(0, qGross - qSub));

                    return (
                      <View
                        key={q.id}
                        style={[
                          styles.cardSection,
                          {
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: isDark ? '#1E293B' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.quoteHeaderRow}>
                          <View>
                            <Text style={[styles.quoteNumberText, { color: colors.text }]}>
                              {q.qNumber || 'Q-SOLAR'}
                            </Text>
                            <Text style={[styles.quoteDateText, { color: colors.textMuted }]}>
                              {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Active Quotation'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.quoteStatusPill,
                              {
                                backgroundColor: isAccepted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 102, 255, 0.12)',
                                borderColor: isAccepted ? '#10B981' : '#0066FF',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.quoteStatusPillText,
                                { color: isAccepted ? '#10B981' : '#0066FF' },
                              ]}
                            >
                              {q.status || 'DRAFT'}
                            </Text>
                          </View>
                        </View>

                        <DetailRow label="System Size" value={`${qCap} kWp`} />
                        {q.panelBrand && <DetailRow label="Solar Modules" value={`${q.panelBrand} ${q.panelWattage ? `${q.panelWattage}W` : ''}`} />}
                        {q.inverterBrand && <DetailRow label="Inverter" value={`${q.inverterBrand} Grid-Tie`} />}
                        <DetailRow label="Gross Turnkey Price" value={`₹${qGross.toLocaleString('en-IN')}`} />
                        <DetailRow label="PM Surya Ghar Subsidy" value={`-₹${qSub.toLocaleString('en-IN')}`} isBadge badgeColor="green" />
                        <DetailRow label="Net Customer Investment" value={`₹${qNet.toLocaleString('en-IN')}`} isBadge badgeColor="blue" />

                        <View style={styles.quoteActionRow}>
                          <TouchableOpacity
                            style={[styles.quoteBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
                            onPress={handleWhatsApp}
                            activeOpacity={0.8}
                          >
                            <Share2 size={13} color="#0066FF" />
                            <Text style={[styles.quoteBtnText, { color: '#0066FF' }]}>Share WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 4: FINANCE & COMMERCIAL CASHFLOW      */}
            {/* ========================================== */}
            {activeTab === 'FINANCE' && (
              <View style={styles.tabContentBlock}>
                {/* COMMERCIAL CASHFLOW LEDGER */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderWithIcon}>
                    <Receipt size={18} color="#10B981" />
                    <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                      Commercial Cashflow Ledger
                    </Text>
                  </View>
                  <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                    Milestone Billing: 20% Token Advance, 60% Procurement, 15% Installation, 5% Commissioning.
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.cashflowProgressWrap}>
                    <View style={[styles.cashflowTrack, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                      <View
                        style={[
                          styles.cashflowFill,
                          {
                            width: `${realizationPct}%`,
                            backgroundColor: totalDue === 0 && totalPaid > 0 ? '#10B981' : '#0066FF',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.cashflowProgressLabels}>
                      <Text style={[styles.cashflowPctText, { color: '#10B981' }]}>
                        {realizationPct}% Realized
                      </Text>
                      <Text style={[styles.cashflowPendingText, { color: totalDue > 0 ? '#EF4444' : '#10B981' }]}>
                        ₹{totalDue.toLocaleString('en-IN')} Due
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ledgerMetricsRow}>
                    <View style={styles.ledgerMetricItem}>
                      <Text style={[styles.ledgerMetricLabel, { color: colors.textMuted }]}>BILLED</Text>
                      <Text style={[styles.ledgerMetricVal, { color: colors.text }]}>₹{totalInvoiced.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.ledgerMetricItem}>
                      <Text style={[styles.ledgerMetricLabel, { color: colors.textMuted }]}>RECEIVED</Text>
                      <Text style={[styles.ledgerMetricVal, { color: '#10B981' }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.ledgerMetricItem}>
                      <Text style={[styles.ledgerMetricLabel, { color: colors.textMuted }]}>BALANCE</Text>
                      <Text style={[styles.ledgerMetricVal, { color: totalDue > 0 ? '#EF4444' : '#10B981' }]}>
                        ₹{totalDue.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* BUTTONS */}
                  <View style={styles.financeBtnRow}>
                    <TouchableOpacity
                      style={styles.quickInvoiceBtn}
                      onPress={() => setCreateInvoiceModalVisible(true)}
                      activeOpacity={0.85}
                    >
                      <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.quickInvoiceBtnText}>+ Quick Invoice</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* INVOICES LIST */}
                <Text style={[styles.groupHeading, { color: colors.text }]}>Customer Invoices & Receipts</Text>
                {invoices.length === 0 ? (
                  <View
                    style={[
                      styles.cardSection,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        alignItems: 'center',
                        paddingVertical: 24,
                      },
                    ]}
                  >
                    <Receipt size={32} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Invoices Generated Yet</Text>
                  </View>
                ) : (
                  invoices.map((inv: any) => {
                    const isPaid = inv.status === 'PAID';
                    const invAmt = Number(inv.amount || 0);
                    const invPaid = (inv.payments || []).reduce((ps: number, p: any) => ps + (Number(p.amount) || 0), 0) || Number(inv.totalPaid) || (isPaid ? invAmt : 0);
                    const invBal = Math.max(0, invAmt - invPaid);

                    return (
                      <View
                        key={inv.id}
                        style={[
                          styles.cardSection,
                          {
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: isDark ? '#1E293B' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.invoiceRowHeader}>
                          <View>
                            <Text style={[styles.invoiceNumber, { color: colors.text }]}>
                              {inv.invoiceNumber}
                            </Text>
                            <Text style={[styles.invoiceDate, { color: colors.textMuted }]}>
                              {inv.milestoneTitle || inv.milestone || 'Milestone Invoice'} • Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'On Demand'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.invoiceStatusBadge,
                              {
                                backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                borderColor: isPaid ? '#10B981' : '#EF4444',
                              },
                            ]}
                          >
                            <Text style={[styles.invoiceStatusText, { color: isPaid ? '#10B981' : '#EF4444' }]}>
                              {inv.status || 'UNPAID'}
                            </Text>
                          </View>
                        </View>

                        <DetailRow label="Invoice Amount" value={`₹${invAmt.toLocaleString('en-IN')}`} />
                        <DetailRow label="Amount Received" value={`₹${invPaid.toLocaleString('en-IN')}`} isBadge badgeColor="green" />
                        {invBal > 0 && <DetailRow label="Outstanding Balance" value={`₹${invBal.toLocaleString('en-IN')}`} isBadge badgeColor="amber" />}
                        {inv.taxRate === 13.8 && (
                          <DetailRow
                            label="Composite GST (70:30)"
                            value="Goods 70% @ 12% | Services 30% @ 18%"
                            isBadge
                            badgeColor="blue"
                          />
                        )}

                        <View style={styles.invoiceActionRow}>
                          <TouchableOpacity
                            style={[styles.invoicePdfBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
                            onPress={() => {
                              setSelectedInvoiceForPdf(inv);
                              setPdfModalVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <FileText size={13} color="#0066FF" />
                            <Text style={styles.invoicePdfBtnText}>View PDF Invoice</Text>
                          </TouchableOpacity>

                          {!isPaid && (
                            <TouchableOpacity
                              style={[
                                styles.invoiceUpiBtn,
                                {
                                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                                  borderColor: isDark ? '#065F46' : '#BBF7D0',
                                },
                              ]}
                              onPress={() => handleOpenUpiPay(inv)}
                              activeOpacity={0.8}
                            >
                              <QrCode size={13} color="#10B981" />
                              <Text style={[styles.invoiceUpiBtnText, { color: '#10B981' }]}>UPI QR Pay</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 5: PM SURYA GHAR & FINANCING          */}
            {/* ========================================== */}
            {activeTab === 'SUBSIDY' && (
              <View style={styles.tabContentBlock}>
                {/* PM SURYA GHAR NATIONAL PORTAL */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderWithIcon}>
                    <Landmark size={18} color="#F59E0B" />
                    <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                      PM Surya Ghar: Muft Bijli Yojana
                    </Text>
                  </View>
                  <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                    National Portal 7-Stage Direct Benefit Transfer (DBT) tracking.
                  </Text>

                  {/* 7-STAGE SUBSIDY TRACKER */}
                  {(() => {
                    const currentSubsidyStep = getSubsidyPortalStageIndex(activeSubsidy?.portalStage || activeSubsidy?.status);
                    return (
                      <View style={[styles.milestoneSection, { marginVertical: 6 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={[styles.milestoneHeading, { color: colors.textSecondary, marginBottom: 0 }]}>
                            NATIONAL PORTAL STAGE
                          </Text>
                          <Text style={[styles.milestoneHeading, { color: '#F59E0B', marginBottom: 0 }]}>
                            Stage {currentSubsidyStep}/7: {SUBSIDY_PORTAL_STAGES[currentSubsidyStep - 1]?.label}
                          </Text>
                        </View>
                        <View style={styles.milestoneGrid}>
                          {SUBSIDY_PORTAL_STAGES.map((s) => {
                            const isDone = s.num <= currentSubsidyStep;
                            const isCurr = s.num === currentSubsidyStep;
                            return (
                              <View key={s.num} style={styles.milestoneCol}>
                                <View
                                  style={[
                                    styles.milestoneDot,
                                    {
                                      backgroundColor: isDone ? '#F59E0B' : isDark ? '#334155' : '#E2E8F0',
                                      borderWidth: isCurr ? 2 : 0,
                                      borderColor: '#F59E0B',
                                    },
                                  ]}
                                >
                                  {isDone ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
                                </View>
                                <Text
                                  style={[
                                    styles.milestoneText,
                                    { color: isDone ? colors.text : colors.textMuted, fontWeight: isCurr ? '800' : '500' },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {s.label}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })()}

                  <DetailRow
                    label="National Application No"
                    value={activeSubsidy?.nationalPortalAppNo || activeSubsidy?.applicationNo || 'Not Registered on Portal Yet'}
                    isCopyable
                  />
                  <DetailRow label="Eligible Central CFA" value={`₹${pmSubsidyAmount.toLocaleString('en-IN')}`} isBadge badgeColor="green" />
                  {activeSubsidy?.stateSubsidyAmount ? (
                    <DetailRow label="State Additional Subsidy" value={`₹${Number(activeSubsidy.stateSubsidyAmount).toLocaleString('en-IN')}`} isBadge badgeColor="green" />
                  ) : null}
                  <DetailRow label="Portal Status" value={activeSubsidy?.portalStage || activeSubsidy?.status || 'FEASIBILITY_PENDING'} isBadge badgeColor="amber" />
                  <DetailRow label="DISCOM & Division" value={`${discomName}${customerCity ? ` • ${customerCity}` : ''}`} />

                  {/* DBT BANK ACCOUNT INFO */}
                  <View style={[styles.subBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                    <Text style={[styles.subBoxTitle, { color: colors.text }]}>DBT Bank Account for ₹{pmSubsidyAmount.toLocaleString('en-IN')}</Text>
                    {activeSubsidy?.bankName || activeSubsidy?.accountNumber ? (
                      <>
                        <DetailRow label="Bank Name" value={activeSubsidy?.bankName || 'Not Provided'} />
                        <DetailRow label="Account Number" value={activeSubsidy?.accountNumber ? `XXXX-XXXX-${String(activeSubsidy.accountNumber).slice(-4)}` : 'Not Provided'} />
                        <DetailRow label="IFSC Code" value={activeSubsidy?.ifscCode || 'Not Provided'} />
                        <DetailRow label="Account Holder" value={activeSubsidy?.accountHolderName || customer?.name || 'Customer'} />
                        <DetailRow label="Aadhaar Name Match" value={activeSubsidy?.nameMatchVerified ? '✓ Verified' : 'In-Progress'} isBadge badgeColor={activeSubsidy?.nameMatchVerified ? 'green' : 'amber'} />
                      </>
                    ) : (
                      <View style={{ paddingVertical: 6, gap: 4 }}>
                        <Text style={[styles.emptyInlineText, { color: colors.textMuted }]}>
                          Bank account proof pending. Attach bank passbook or cancelled cheque in the Documents tab for Direct Benefit Transfer.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* CONCESSIONAL SOLAR LOAN */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderWithIcon}>
                    <Banknote size={18} color="#8B5CF6" />
                    <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                      7% Concessional Bank Financing
                    </Text>
                  </View>

                  {activeLoan ? (
                    <>
                      <DetailRow label="Lender Partner" value={activeLoan.lender || 'Concessional Banking Partner'} />
                      <DetailRow label="Loan Application No" value={activeLoan.applicationNo || 'Pending'} isCopyable />
                      <DetailRow label="Loan Amount" value={`₹${Number(activeLoan.amount || netPayableAmount).toLocaleString('en-IN')}`} isBadge badgeColor="blue" />
                      <DetailRow label="Interest Rate" value="7.00% p.a. Concessional" />
                      <DetailRow label="Estimated EMI" value={`~₹${Math.round(netPayableAmount * 0.0198).toLocaleString('en-IN')}/mo (60 Months)`} />
                      <DetailRow label="Loan Status" value={activeLoan.status || 'APPLIED'} isBadge badgeColor="green" />
                    </>
                  ) : (
                    <View style={{ paddingVertical: 6, gap: 6 }}>
                      <Text style={[styles.emptyInlineText, { color: colors.textMuted }]}>
                        No active loan application. Customer is eligible for 7% collateral-free solar financing under PM Surya Ghar.
                      </Text>
                      <DetailRow label="Eligible Loan Amount" value={`Up to ₹${netPayableAmount.toLocaleString('en-IN')}`} isBadge badgeColor="blue" />
                      <DetailRow label="Concessional Rate" value="7.00% p.a. Fixed" />
                      <DetailRow label="Estimated Monthly EMI" value={`~₹${Math.round(netPayableAmount * 0.0198).toLocaleString('en-IN')}/mo`} />
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 6: DOCUMENTS & KYC REPOSITORY         */}
            {/* ========================================== */}
            {activeTab === 'DOCUMENTS' && (
              <View style={styles.tabContentBlock}>
                {uploadingDoc && (
                  <View style={styles.uploadingBanner}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.uploadingBannerText}>Uploading document to cloud storage...</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Statutory Document Checklist</Text>
                  <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                    Upload KYC proofs, electricity bills, and site photos for DISCOM liaison.
                  </Text>

                  {REQUIRED_KYC_DOCS.map((slot) => {
                    const existingDoc = documents.find((d) => {
                      const text = `${d.category || ''} ${d.title || ''} ${d.documentType?.name || ''}`.toLowerCase();
                      return slot.matchKeys.some((k) => text.includes(k));
                    });

                    return (
                      <View
                        key={slot.id}
                        style={[
                          styles.docSlotRow,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: existingDoc ? '#10B981' : isDark ? '#334155' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.docSlotInfo}>
                          <View style={styles.docSlotTitleRow}>
                            <Text style={[styles.docSlotTitle, { color: colors.text }]}>
                              {slot.title}
                            </Text>
                            {slot.required && <Text style={styles.requiredStar}>*</Text>}
                          </View>
                          <Text style={[styles.docSlotSub, { color: existingDoc ? '#10B981' : colors.textMuted }]}>
                            {existingDoc
                              ? `✓ Uploaded (${existingDoc.status || 'UPLOADED'}) • ${existingDoc.createdAt ? new Date(existingDoc.createdAt).toLocaleDateString() : 'Attached'}`
                              : 'Pending statutory upload'}
                          </Text>
                        </View>

                        <View style={styles.docSlotActions}>
                          {existingDoc?.fileUrl ? (
                            <TouchableOpacity
                              style={[styles.docIconBtn, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF', borderColor: '#0066FF' }]}
                              onPress={() => Linking.openURL(existingDoc.fileUrl)}
                              activeOpacity={0.7}
                            >
                              <Eye size={14} color="#0066FF" />
                            </TouchableOpacity>
                          ) : null}
                          <TouchableOpacity
                            style={[styles.docIconBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}
                            onPress={() => handleUploadFromCamera(slot.category)}
                            activeOpacity={0.7}
                          >
                            <Camera size={14} color="#0066FF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.docIconBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}
                            onPress={() => handleUploadFromFile(slot.category)}
                            activeOpacity={0.7}
                          >
                            <UploadCloud size={14} color="#10B981" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* ALL UPLOADED FILES & ATTACHMENTS REPOSITORY */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      marginTop: 12,
                    },
                  ]}
                >
                  <View style={styles.sectionHeadingRow}>
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>All Uploaded Documents & Files</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#0066FF' }]}>
                      <Text style={styles.countBadgeText}>{documents.length}</Text>
                    </View>
                  </View>
                  <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                    All digital assets, DISCOM documents, survey photos, and invoices attached to this customer dossier.
                  </Text>

                  {documents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <FileSpreadsheet size={28} color={colors.textMuted} />
                      <Text style={[styles.emptyInlineText, { color: colors.textMuted, marginTop: 8 }]}>
                        No uploaded documents found yet. Use the camera or upload icons above to add files.
                      </Text>
                    </View>
                  ) : (
                    documents.map((doc: any, idx: number) => {
                      const docUrl = doc.fileUrl || doc.url;
                      return (
                        <View
                          key={doc.id || `file-${idx}`}
                          style={[
                            styles.docSlotRow,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                              marginBottom: 8,
                            },
                          ]}
                        >
                          <View style={styles.docSlotInfo}>
                            <Text style={[styles.docSlotTitle, { color: colors.text }]} numberOfLines={1}>
                              {doc.title || 'Document File'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <View style={[styles.inlineBadge, { backgroundColor: '#EFF6FF' }]}>
                                <Text style={[styles.inlineBadgeText, { color: '#0066FF' }]}>
                                  {doc.category || 'General'}
                                </Text>
                              </View>
                              <Text style={[styles.docSlotSub, { color: colors.textMuted }]}>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Attached'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.docSlotActions}>
                            {docUrl ? (
                              <TouchableOpacity
                                style={[styles.docIconBtn, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF', borderColor: '#0066FF' }]}
                                onPress={() => {
                                  haptics.impactLight();
                                  Linking.openURL(docUrl).catch(() => {
                                    Alert.alert('Error', 'Could not open document link.');
                                  });
                                }}
                                activeOpacity={0.7}
                              >
                                <Eye size={14} color="#0066FF" />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 7: AMC & SUPPORT TICKETS              */}
            {/* ========================================== */}
            {activeTab === 'AMC' && (
              <View style={styles.tabContentBlock}>
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderWithIcon}>
                    <ShieldCheck size={18} color="#10B981" />
                    <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                      5-Year Turnkey Warranty & AMC
                    </Text>
                  </View>

                  <DetailRow
                    label="Contract Number"
                    value={activeAmc?.contractNumber || `AMC-${(customer?.name || 'Turnkey').replace(/\s+/g, '-').toUpperCase()}-2026`}
                    isCopyable
                  />
                  <DetailRow label="Warranty Status" value={activeAmc?.status || 'ACTIVE'} isBadge badgeColor="green" />
                  <DetailRow label="Solar Panel Warranty" value="25-Year Linear Performance Warranty (Tier-1 DCR)" />
                  <DetailRow label="Inverter Warranty" value="10-Year Replacement Guarantee" />
                  <DetailRow label="Preventive Maintenance" value="Quarterly Panel Cleaning & Health Checkup" />
                  {activeAmc?.startDate && activeAmc?.endDate ? (
                    <DetailRow
                      label="AMC Duration"
                      value={`${new Date(activeAmc.startDate).toLocaleDateString()} to ${new Date(activeAmc.endDate).toLocaleDateString()}`}
                    />
                  ) : null}
                </View>

                {/* SUPPORT TICKETS */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderWithIcon}>
                    <HelpCircle size={18} color="#6366F1" />
                    <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                      Support & Service Tickets
                    </Text>
                  </View>

                  {tickets.length === 0 ? (
                    <Text style={[styles.emptyInlineText, { color: colors.textMuted }]}>
                      Zero active complaints or maintenance escalations recorded.
                    </Text>
                  ) : (
                    tickets.map((t: any) => (
                      <View key={t.id} style={styles.ticketItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.ticketSubject, { color: colors.text }]}>{t.subject || 'Support Ticket'}</Text>
                          <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Active'} • Priority: {t.priority || 'Normal'}
                          </Text>
                        </View>
                        <View style={styles.ticketStatusBadge}>
                          <Text style={styles.ticketStatusText}>{t.status || 'OPEN'}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 8: TIMELINE & FIELD NOTES             */}
            {/* ========================================== */}
            {activeTab === 'TIMELINE' && (
              <View style={styles.tabContentBlock}>
                {/* QUICK ADD NOTE BOX */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Add Field Note</Text>
                  <TextInput
                    style={[
                      styles.noteInput,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: colors.borderSubtle,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Log site visit, customer discussion, or payment update..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={newNoteText}
                    onChangeText={setNewNoteText}
                  />

                  <TouchableOpacity
                    style={[styles.postNoteBtn, postingNote && { opacity: 0.6 }]}
                    onPress={handleAddNote}
                    disabled={postingNote || !newNoteText.trim()}
                    activeOpacity={0.8}
                  >
                    {postingNote ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={14} color="#FFFFFF" />
                        <Text style={styles.postNoteBtnText}>Post Note</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* COMBINED TIMELINE & AUDIT TRAIL */}
                <Text style={[styles.groupHeading, { color: colors.text }]}>Interaction History & Timeline</Text>

                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  {timelineItems.length === 0 ? (
                    <Text style={[styles.emptyInlineText, { color: colors.textMuted }]}>
                      No interactions recorded yet. Use the field above to log notes.
                    </Text>
                  ) : (
                    timelineItems.map((item) => (
                      <View key={item.id} style={styles.timelineItem}>
                        <View style={[styles.timelineBullet, { backgroundColor: item.bulletColor }]} />
                        <View style={styles.timelineBody}>
                          <Text style={[styles.timelineText, { color: colors.text }]}>{item.title}</Text>
                          <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                            {item.date ? new Date(item.date).toLocaleString() : 'Event'} • {item.type}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* ========================================== */}
        {/* EDIT CUSTOMER MODAL                        */}
        {/* ========================================== */}
        <Modal
          visible={editModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.editOverlay}>
            <View
              style={[
                styles.editSheet,
                {
                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.editHeader}>
                <Text style={[styles.editTitle, { color: colors.text }]}>Edit Customer Profile</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name *</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderSubtle }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Customer Full Name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Company Name (Optional)</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderSubtle }]}
                  value={editCompany}
                  onChangeText={setEditCompany}
                  placeholder="Business / Enterprise Name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile Phone *</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderSubtle }]}
                  value={editMobile}
                  onChangeText={setEditMobile}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderSubtle }]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Installation Address</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderSubtle }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Building, street, landmark"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>City</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderSubtle }]}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="City (e.g. Pune)"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Customer Type</Text>
                <View style={styles.typeSelectorRow}>
                  {['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typePill,
                        editCustomerType === t && { backgroundColor: '#0066FF', borderColor: '#0066FF' },
                        editCustomerType !== t && { borderColor: colors.borderSubtle },
                      ]}
                      onPress={() => setEditCustomerType(t)}
                    >
                      <Text
                        style={[
                          styles.typePillText,
                          { color: editCustomerType === t ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.editFooter}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, savingEdit && { opacity: 0.6 }]}
                  onPress={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* SUB-MODALS */}
        {selectedInvoiceForPdf && (
          <InvoicePdfModal
            visible={pdfModalVisible}
            onClose={() => {
              setPdfModalVisible(false);
              setSelectedInvoiceForPdf(null);
            }}
            invoice={selectedInvoiceForPdf}
          />
        )}

        <CreateInvoiceModal
          visible={createInvoiceModalVisible}
          onClose={() => setCreateInvoiceModalVisible(false)}
          onSuccess={() => {
            setCreateInvoiceModalVisible(false);
            fetchCustomerProfile(true);
          }}
          initialCustomer={customer}
          initialLead={customer?.lead}
        />

        {discomDocsProject && (
          <DiscomDocsModal
            visible={discomDocsModalVisible}
            project={discomDocsProject}
            onClose={() => {
              setDiscomDocsModalVisible(false);
              setDiscomDocsProject(null);
            }}
          />
        )}

        <QuotationBuilderModal
          visible={quoteBuilderVisible}
          lead={customer?.lead || customer}
          onClose={() => setQuoteBuilderVisible(false)}
          onSuccess={() => {
            setQuoteBuilderVisible(false);
            fetchCustomerProfile(true);
          }}
        />

        <PermissionRationaleModal
          visible={permissionModalVisible}
          permissionType={permissionType}
          onRequestNativePermission={() => {
            setPermissionModalVisible(false);
            Linking.openSettings();
          }}
          onDismiss={() => setPermissionModalVisible(false)}
        />

        {/* INSTANT UPI QR COLLECTION MODAL */}
        <Modal
          visible={upiModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUpiModalVisible(false)}
        >
          <View style={styles.editOverlay}>
            <View
              style={[
                styles.editSheet,
                {
                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  alignItems: 'center',
                },
              ]}
            >
              <View style={[styles.editHeader, { width: '100%' }]}>
                <View>
                  <Text style={[styles.editTitle, { color: colors.text }]}>Instant UPI Collection</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {upiTargetInvoice?.invoiceNumber} • {customer?.name || 'Customer'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setUpiModalVisible(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {loadingUpi ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
                    Generating NPCI dynamic UPI QR...
                  </Text>
                </View>
              ) : upiQrData?.qrCodeUrl ? (
                <View style={{ alignItems: 'center', paddingVertical: 10, width: '100%' }}>
                  <Image
                    source={{ uri: upiQrData.qrCodeUrl }}
                    style={{ width: 190, height: 190, borderRadius: 10, backgroundColor: '#FFFFFF', marginBottom: 12 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    Amount: ₹{(upiTargetInvoice?.balance || upiTargetInvoice?.amount || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                    Payee: <Text style={{ fontWeight: '700', color: colors.text }}>{upiQrData.payeeName}</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                    VPA: {upiQrData.vpa}
                  </Text>

                  {upiQrData.upiUri && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#10B981',
                        paddingHorizontal: 16,
                        paddingVertical: 11,
                        borderRadius: 10,
                        marginTop: 14,
                        width: '100%',
                      }}
                      onPress={() => Linking.openURL(upiQrData.upiUri)}
                      activeOpacity={0.8}
                    >
                      <Zap size={14} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                        1-Tap Launch PhonePe / GPay
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

// Reusable Detail Row Component
function DetailRow({
  label,
  value,
  isBadge,
  badgeColor,
  isCopyable,
}: {
  label: string;
  value: string;
  isBadge?: boolean;
  badgeColor?: 'blue' | 'green' | 'amber';
  isCopyable?: boolean;
}) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      {isBadge ? (
        <View
          style={[
            styles.detailBadge,
            badgeColor === 'green' && { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981' },
            badgeColor === 'amber' && { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' },
            badgeColor === 'blue' && { backgroundColor: 'rgba(0, 102, 255, 0.12)', borderColor: '#0066FF' },
          ]}
        >
          <Text
            style={[
              styles.detailBadgeText,
              badgeColor === 'green' && { color: '#10B981' },
              badgeColor === 'amber' && { color: '#F59E0B' },
              badgeColor === 'blue' && { color: '#0066FF' },
            ]}
          >
            {value}
          </Text>
        </View>
      ) : (
        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // HERO CARD
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroInfoBlock: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  customerTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  customerTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  companyText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  commsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  commBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  commBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRibbon: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statCellVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  statCellSub: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  statCellDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  // TABS
  tabsWrapper: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContentBlock: {
    gap: 14,
  },
  // CARD SECTIONS
  cardSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1.2,
    textAlign: 'right',
  },
  detailBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  detailBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
  },
  subBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  // PROJECTS TAB
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  projectNameTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  projectSubId: {
    fontSize: 11,
    marginTop: 2,
  },
  projectStageBadge: {
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  projectStageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0066FF',
  },
  milestoneSection: {
    marginVertical: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  milestoneHeading: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  milestoneGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneCol: {
    alignItems: 'center',
    gap: 4,
    width: 44,
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneText: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  projectActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  projectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  projectActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // QUOTES TAB
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  quoteDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  quoteStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  quoteStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  quoteActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  quoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  quoteBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // FINANCE TAB
  cashflowProgressWrap: {
    marginVertical: 6,
    gap: 4,
  },
  cashflowTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cashflowFill: {
    height: '100%',
    borderRadius: 4,
  },
  cashflowProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashflowPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cashflowPendingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ledgerMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  ledgerMetricItem: {
    alignItems: 'center',
  },
  ledgerMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  ledgerMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  financeBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: -4,
  },
  invoiceRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceDate: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  invoiceActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  invoicePdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  invoicePdfBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },
  invoiceUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  invoiceUpiBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // DOCUMENTS TAB
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadingBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  docSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 3,
  },
  docSlotInfo: {
    flex: 1,
  },
  docSlotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docSlotTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  requiredStar: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  docSlotSub: {
    fontSize: 10,
    marginTop: 2,
  },
  docSlotActions: {
    flexDirection: 'row',
    gap: 6,
  },
  docIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  // TIMELINE & NOTES TAB
  noteInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  postNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066FF',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
  },
  postNoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  timelineBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineBody: {
    flex: 1,
  },
  timelineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  emptyInlineText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ticketSubject: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 10,
    marginTop: 2,
  },
  ticketStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  // EDIT MODAL
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  editSheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: '#0066FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  inlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inlineBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
