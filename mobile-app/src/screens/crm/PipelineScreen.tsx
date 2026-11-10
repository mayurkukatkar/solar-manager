import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import {
  Plus,
  Phone,
  MessageCircle,
  FileText,
  ShieldCheck,
  Building,
  Zap,
  IndianRupee,
  Receipt,
  CreditCard,
  X,
  ChevronRight,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { crmApi } from '../../api/endpoints';
import { offlineSyncService } from '../../services/offlineSyncService';
import { LeadCaptureModal } from './LeadCaptureModal';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import { CustomerOnboardingModal } from './CustomerOnboardingModal';
import { DiscomDocsModal } from '../projects/DiscomDocsModal';
import { SeamlessSolarFlowModal } from '../../components/SeamlessSolarFlowModal';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
import { CreateInvoiceModal } from '../../components/CreateInvoiceModal';
import { EmptyState, SkeletonLoader } from '../../components/common';
import { useTheme } from '../../theme';

export type LeadStage =
  | 'ALL'
  | 'NEW'
  | 'CONTACTED'
  | 'SITE_SURVEY'
  | 'QUOTATION_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export const STAGES: { id: LeadStage; label: string }[] = [
  { id: 'ALL', label: 'All Deals' },
  { id: 'NEW', label: 'New Lead' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'SITE_SURVEY', label: 'Site Survey' },
  { id: 'QUOTATION_SENT', label: 'Quote Sent' },
  { id: 'NEGOTIATION', label: 'Negotiation' },
  { id: 'WON', label: 'Won / EPC' },
  { id: 'LOST', label: 'Lost / Closed' },
];

export const PipelineScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState<LeadStage>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [discomModalVisible, setDiscomModalVisible] = useState(false);
  const [seamlessFlowVisible, setSeamlessFlowVisible] = useState(false);
  const [seamlessInitialLead, setSeamlessInitialLead] = useState<any | null>(null);
  const [seamlessInitialStep, setSeamlessInitialStep] = useState<number>(0);

  // PDF Invoice Modal & Commercial Invoicing State
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<any | null>(null);
  const [createInvoiceModalVisible, setCreateInvoiceModalVisible] = useState(false);
  const [targetLeadForInvoice, setTargetLeadForInvoice] = useState<any | null>(null);

  // Active Context for Modals
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [activeQuotationData, setActiveQuotationData] = useState<any | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [leadForDetail, setLeadForDetail] = useState<any | null>(null);

  const handleOpenLeadDetail = (lead: any) => {
    setLeadForDetail(lead);
    setDetailModalVisible(true);
  };

  useEffect(() => {
    // 1. Instant local cache hydration for zero-flicker startup
    offlineSyncService.getCachedResponse<any[]>('leads').then((cached) => {
      if (cached?.data && Array.isArray(cached.data) && cached.data.length > 0) {
        setLeads(cached.data);
        setLoading(false);
      }
    }).catch(() => {});

    // 2. Fetch fresh leads from server
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const [res, drafts] = await Promise.all([
        crmApi.getLeads({ all: true }).catch((err) => {
          console.warn('Leads fetch notice:', err.message);
          return null;
        }),
        offlineSyncService.getDraftLeads().catch(() => []),
      ]);

      const serverLeads = (res && Array.isArray(res.leads)) ? res.leads : [];

      const draftLeadsFormatted = (drafts || []).map((d: any) => ({
        id: d.localId,
        name: d.name,
        mobile: d.mobile,
        address: d.address,
        city: d.city,
        pincode: d.pincode,
        estimatedCap: d.recommendedKw,
        monthlyBill: d.monthlyBill,
        sanctionedLoad: d.sanctionedLoadKw,
        status: 'NEW',
        stage: 'NEW',
        isDraft: true,
        consumerNumber: d.consumerNumber,
        notes: `Consumer No: ${d.consumerNumber || 'N/A'}, BU: ${d.bu || 'N/A'} (Draft)`,
        createdAt: d.savedAt || new Date().toISOString(),
      }));

      const merged = [
        ...draftLeadsFormatted.filter(
          (draft: any) => !serverLeads.some((sl: any) => sl.mobile === draft.mobile)
        ),
        ...serverLeads,
      ];

      setLeads(merged);
      if (merged.length > 0) {
        await offlineSyncService.setCachedResponse('leads', merged);
      }
    } catch (err: any) {
      console.warn('Leads fetch notice:', err.message);
      const cached = await offlineSyncService.getCachedResponse<any[]>('leads');
      if (cached?.data && Array.isArray(cached.data)) {
        setLeads(cached.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handlePhoneCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsAppPitch = (lead: any) => {
    const phone = lead.mobile || lead.phone;
    if (!phone) {
      Alert.alert('Phone Missing', 'Customer mobile number is not available.');
      return;
    }
    const cap = lead.estimatedCap || 3.3;
    const gross = lead.estimatedValue || Math.round(cap * 56000);
    const subsidy = cap >= 3 ? 78000 : cap >= 2 ? 60000 : 30000;
    const net = Math.max(0, gross - subsidy);
    const monthlySavings = Math.round(cap * 120 * 8.5);
    const lifetimeSavings = Math.round(cap * 1460 * 25 * 8.5 * 0.92);

    openWhatsAppWithPitch({
      customerName: lead.name,
      customerPhone: phone,
      systemCapacityKw: cap,
      grossAmount: gross,
      subsidyAmount: subsidy,
      netPayable: net,
      monthlySavings,
      lifetimeSavings,
      companyName: 'WhereReady Solar OS',
    });
  };

  const handleOpenLeadCapture = () => {
    setSeamlessInitialLead(null);
    setSeamlessInitialStep(0);
    setSeamlessFlowVisible(true);
  };

  const handleOpenSeamlessFlowForLead = (lead: any, stepIndex: number = 0) => {
    setSeamlessInitialLead(lead);
    setSeamlessInitialStep(stepIndex);
    setSeamlessFlowVisible(true);
  };

  const handleLeadCreated = (newLead: any) => {
    setLeads((prev) => [newLead, ...prev.filter((l) => l.id !== newLead.id && l.mobile !== newLead.mobile)]);
  };

  const handleProceedToQuoteFromLead = (lead: any) => {
    setLeadModalVisible(false);
    setSelectedLead(lead);
    setQuoteModalVisible(true);
  };

  const handleOpenQuoteBuilder = (lead: any) => {
    setSelectedLead(lead);
    setQuoteModalVisible(true);
  };

  const handleProceedToOnboarding = (lead: any, quotation: any) => {
    setQuoteModalVisible(false);
    setSelectedLead(lead);
    setActiveQuotationData(quotation);
    setOnboardingModalVisible(true);
  };

  const handleOnboardingSuccess = (project: any) => {
    setOnboardingModalVisible(false);
    fetchLeads();
    setSelectedProject(project);
    Alert.alert(
      'Client Onboarded & Project Created',
      'Customer converted into active installation project. Generate statutory DISCOM forms now?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Generate DISCOM Docs', onPress: () => setDiscomModalVisible(true) },
      ]
    );
  };

  const handleOpenDiscomDocs = (item: any) => {
    setSelectedProject({
      ...item,
      customer: item.customer || {
        name: item.name,
        mobile: item.mobile || item.phone,
        email: item.email,
        address: item.address,
        city: item.city,
        pincode: item.pincode,
        consumerNumber: item.consumerNumber || item.electricityConnection || '',
        sanctionedLoad: item.sanctionedLoad || item.sanctionedLoadKw,
      },
      consumerNumber: item.consumerNumber || item.electricityConnection || item.customer?.consumerNumber || '',
      capacity: item.capacity || item.estimatedCap || item.recommendedKw || 3.3,
      installationAddress: item.installationAddress || item.address || item.customer?.address || '',
      city: item.city || item.customer?.city || '',
      pincode: item.pincode || item.customer?.pincode || '',
    });
    setDiscomModalVisible(true);
  };

  const handleOpenCreateInvoiceForLead = (lead: any) => {
    setTargetLeadForInvoice(lead);
    setCreateInvoiceModalVisible(true);
  };

  const handleOpenPdfInvoiceForLead = (lead: any) => {
    const invs: any[] = [];
    if (lead.customer?.invoices) invs.push(...lead.customer.invoices);
    if (lead.projects) {
      lead.projects.forEach((p: any) => {
        if (p.invoices) invs.push(...p.invoices);
      });
    }

    if (invs.length > 0) {
      const unpaid = invs.find((i: any) => i.status !== 'PAID');
      const target = unpaid || invs[0];
      setSelectedInvoiceForPdf({
        ...target,
        customer: target.customer || lead.customer || {
          name: lead.name,
          mobile: lead.mobile,
          address: lead.address,
          city: lead.city,
          consumerNumber: lead.consumerNumber,
        },
      });
      setPdfModalVisible(true);
    } else {
      Alert.alert(
        'Create Commercial Invoice',
        `No invoices have been issued yet for ${lead.name}.\n\nWould you like to issue a Tax Invoice, Bank Proforma, or Advance Deposit now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '+ Issue Invoice',
            onPress: () => handleOpenCreateInvoiceForLead(lead),
          },
        ]
      );
    }
  };

  const handleNavigateToFinanceForLead = (lead: any) => {
    navigation?.navigate('Finance', { customerName: lead.name });
  };

  // KPI Calculations (Bulletproof against non-numeric / missing properties)
  const pipelineMetrics = useMemo(() => {
    let totalCap = 0;
    let totalGross = 0;
    let totalSubsidy = 0;
    let wonCount = 0;

    (leads || []).forEach((l) => {
      if (!l || typeof l !== 'object') return;
      const c = Number(l.estimatedCap || l.recommendedKw || 3.3) || 3.3;
      const g = Number(l.estimatedValue) || Math.round(c * 56000);
      const s = c >= 3 ? 78000 : c >= 2 ? 60000 : 30000;
      totalCap += c;
      totalGross += g;
      totalSubsidy += s;
      if (l.status === 'WON') wonCount++;
    });

    return {
      totalLeads: leads.length,
      totalKw: Number(totalCap.toFixed(1)),
      grossLakhs: (totalGross / 100000).toFixed(1),
      subsidyLakhs: (totalSubsidy / 100000).toFixed(1),
      wonCount,
    };
  }, [leads]);

  const getStageCount = (stageId: LeadStage) => {
    if (stageId === 'ALL') return leads.length;
    return leads.filter((item) => {
      if (!item) return false;
      const stage = String(item.stage || item.status || 'NEW').toUpperCase();
      if (stageId === 'NEW') return stage === 'NEW' || stage === 'DRAFT' || Boolean(item.isDraft);
      if (stageId === 'CONTACTED') return stage === 'CONTACTED';
      if (stageId === 'SITE_SURVEY') return stage === 'SITE_SURVEY' || stage === 'SURVEY';
      if (stageId === 'QUOTATION_SENT') return stage === 'QUOTATION_SENT' || stage === 'PROPOSAL_SENT';
      if (stageId === 'NEGOTIATION') return stage === 'NEGOTIATION' || stage === 'QUALIFIED';
      if (stageId === 'WON') return stage === 'WON' || stage === 'CONVERTED' || stage === 'COMPLETED';
      if (stageId === 'LOST') return stage === 'LOST' || stage === 'DROPPED';
      return false;
    }).length;
  };

  // Filter leads based on Stage & Search
  const filteredItems = useMemo(() => {
    return (leads || []).filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const q = searchQuery.toLowerCase().trim();
      const name = typeof item.name === 'string' ? item.name.toLowerCase() : '';
      const mobile = String(item.mobile || item.phone || '');
      const city = typeof item.city === 'string' ? item.city.toLowerCase() : '';
      const consumer = String(item.consumerNumber || '');

      const matchesSearch =
        !q ||
        name.includes(q) ||
        mobile.includes(q) ||
        city.includes(q) ||
        consumer.includes(q);

      if (!matchesSearch) return false;
      if (activeStage === 'ALL') return true;

      const stage = String(item.stage || item.status || 'NEW').toUpperCase();
      if (activeStage === 'NEW') return stage === 'NEW' || stage === 'DRAFT' || Boolean(item.isDraft);
      if (activeStage === 'CONTACTED') return stage === 'CONTACTED';
      if (activeStage === 'SITE_SURVEY') return stage === 'SITE_SURVEY' || stage === 'SURVEY';
      if (activeStage === 'QUOTATION_SENT') return stage === 'QUOTATION_SENT' || stage === 'PROPOSAL_SENT';
      if (activeStage === 'NEGOTIATION') return stage === 'NEGOTIATION' || stage === 'QUALIFIED';
      if (activeStage === 'WON') return stage === 'WON' || stage === 'CONVERTED' || stage === 'COMPLETED';
      if (activeStage === 'LOST') return stage === 'LOST' || stage === 'DROPPED';
      return true;
    });
  }, [leads, searchQuery, activeStage]);

  const keyExtractor = useCallback(
    (item: any, index: number) => String(item?.id || item?.localId || `lead-${index}`),
    []
  );

  const renderLeadCard = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (!item || typeof item !== 'object') return null;

      try {
        const cap = Number(item.estimatedCap || item.recommendedKw || 3.3) || 3.3;
        const gross = Number(item.estimatedValue) || Math.round(cap * 56000);
        const subsidy = cap >= 3 ? 78000 : cap >= 2 ? 60000 : 30000;
        const net = Math.max(0, gross - subsidy);
        const isWon = item.status === 'WON';

        // Defensive aggregation of invoices
        const leadInvoices: any[] = [];
        if (Array.isArray(item.customer?.invoices)) {
          leadInvoices.push(...item.customer.invoices);
        }
        if (Array.isArray(item.projects)) {
          item.projects.forEach((p: any) => {
            if (Array.isArray(p?.invoices)) {
              leadInvoices.push(...p.invoices);
            }
          });
        }
        const uniqueInvoices = leadInvoices.filter((i) => i && typeof i === 'object' && i.id);
        const hasInvoices = uniqueInvoices.length > 0;

        const totalBilled = uniqueInvoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
        const totalPaid = uniqueInvoices.reduce((s: number, i: any) => {
          const payments = Array.isArray(i.payments) ? i.payments : [];
          const pSum = payments.reduce((ps: number, p: any) => ps + (Number(p?.amount) || 0), 0);
          return s + (Number(i.totalPaid) || pSum);
        }, 0);
        const totalDue = Math.max(0, totalBilled - totalPaid);
        const realizedPct = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;

        // Commercial status badge
        let invoiceBadgeText = 'UNINVOICED';
        let invoiceBadgeBg = isDark ? '#1E293B' : '#F1F5F9';
        let invoiceBadgeColor = isDark ? '#94A3B8' : '#64748B';

        if (hasInvoices) {
          if (totalDue === 0 && totalPaid > 0) {
            invoiceBadgeText = 'SETTLED';
            invoiceBadgeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
            invoiceBadgeColor = '#10B981';
          } else if (totalPaid > 0) {
            invoiceBadgeText = `${realizedPct}% PAID`;
            invoiceBadgeBg = isDark ? 'rgba(0, 102, 255, 0.15)' : '#EFF6FF';
            invoiceBadgeColor = '#0066FF';
          } else {
            invoiceBadgeText = `₹${(totalDue / 1000).toFixed(0)}k DUE`;
            invoiceBadgeBg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB';
            invoiceBadgeColor = '#F59E0B';
          }
        }

        // Bulletproof name, initials & label coercion
        const rawName = typeof item.name === 'string' ? item.name.trim() : (item.name ? String(item.name) : 'Lead');
        const nameParts = rawName.split(/\s+/).filter(Boolean);
        const avatarInitials = nameParts.length >= 2
          ? ((nameParts[0][0] || '') + (nameParts[1][0] || '')).toUpperCase()
          : (nameParts[0]?.slice(0, 2) || 'SO').toUpperCase();

        const displayName = rawName || 'Solar Prospect';
        const displayLocation = typeof item.city === 'string' && item.city.trim() ? item.city : 'Site Location';
        const displayMobile = item.mobile ? String(item.mobile) : (item.phone ? String(item.phone) : '');
        const displayConsumer = item.consumerNumber ? String(item.consumerNumber) : '';
        const displayStage = item.isDraft ? 'DRAFT' : isWon ? 'WON / EPC' : String(item.status || 'NEW');

        return (
          <TouchableOpacity
            key={String(item.id || item.localId || index)}
            style={[
              styles.leadCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => handleOpenLeadDetail(item)}
            activeOpacity={0.88}
          >
            {/* TOP ROW: AVATAR + NAME & LOCATION + STAGE BADGE */}
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor: isWon
                      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                      : item.isDraft
                        ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB')
                        : (isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF'),
                    borderColor: isWon
                      ? '#10B981'
                      : item.isDraft
                        ? '#F59E0B'
                        : '#0066FF',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: isWon
                        ? '#10B981'
                        : item.isDraft
                          ? '#F59E0B'
                          : '#0066FF',
                    },
                  ]}
                >
                  {avatarInitials}
                </Text>
              </View>

              <View style={styles.cardHeaderInfo}>
                <View style={styles.nameAndStageRow}>
                  <Text
                    style={[styles.customerName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>

                  <View
                    style={[
                      styles.stageBadge,
                      {
                        backgroundColor: isWon
                          ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                          : item.isDraft
                            ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB')
                            : (isDark ? 'rgba(0, 102, 255, 0.1)' : '#EFF6FF'),
                        borderColor: isWon
                          ? '#10B981'
                          : item.isDraft
                            ? '#F59E0B'
                            : (isDark ? '#1E3A8A' : '#BFDBFE'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stageBadgeText,
                        {
                          color: isWon
                            ? '#10B981'
                            : item.isDraft
                              ? '#D97706'
                              : '#0066FF',
                        },
                      ]}
                    >
                      {displayStage}
                    </Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <MapPin size={11} color={colors.textMuted} />
                  <Text
                    style={[styles.locationText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {displayLocation}
                    {displayMobile ? ` • ${displayMobile}` : ''}
                    {displayConsumer ? ` • Cons: ${displayConsumer}` : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* METRICS & SUBSIDY STRIP */}
            <View style={styles.metricsPillsRow}>
              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Zap size={11} color="#0066FF" strokeWidth={2.5} />
                <Text style={[styles.metricPillVal, { color: colors.text }]}>{cap.toFixed(1)} kWp</Text>
              </View>

              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <IndianRupee size={11} color={colors.textSecondary} strokeWidth={2.2} />
                <Text style={[styles.metricPillVal, { color: colors.text }]}>₹{(gross / 100000).toFixed(2)}L</Text>
              </View>

              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                    borderColor: isDark ? '#065F46' : '#A7F3D0',
                  },
                ]}
              >
                <Sparkles size={11} color="#10B981" />
                <Text style={[styles.metricPillVal, { color: '#10B981', fontWeight: '800' }]}>
                  ₹{(subsidy / 1000).toFixed(0)}k DBT
                </Text>
              </View>

              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: invoiceBadgeBg,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Receipt size={10} color={invoiceBadgeColor} />
                <Text style={[styles.metricPillVal, { color: invoiceBadgeColor, fontSize: 10 }]}>
                  {invoiceBadgeText}
                </Text>
              </View>
            </View>

            {/* FAST ACTION CONTROLS */}
            <View style={[styles.actionStrip, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[
                  styles.actionIconButton,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => handlePhoneCall(displayMobile)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Call Customer"
              >
                <Phone size={14} color="#0066FF" strokeWidth={2.4} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionIconButton,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                    borderColor: isDark ? '#065F46' : '#A7F3D0',
                  },
                ]}
                onPress={() => handleWhatsAppPitch(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="WhatsApp Proposal"
              >
                <MessageCircle size={14} color="#10B981" strokeWidth={2.4} />
              </TouchableOpacity>

              {isWon ? (
                <>
                  <TouchableOpacity
                    style={styles.actionPillWon}
                    onPress={() => handleOpenDiscomDocs(item)}
                    activeOpacity={0.8}
                  >
                    <Building size={13} color="#D97706" />
                    <Text style={styles.actionPillWonText} numberOfLines={1}>DISCOM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionPillSeamless}
                    onPress={() => handleOpenSeamlessFlowForLead(item, 8)}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={11} color="#059669" />
                    <Text style={styles.actionPillSeamlessText} numberOfLines={1}>1-Flow</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.actionPillSeamless}
                    onPress={() => handleOpenSeamlessFlowForLead(item, 5)}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={11} color="#059669" strokeWidth={2.4} />
                    <Text style={styles.actionPillSeamlessText} numberOfLines={1}>1-Flow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionPillQuote,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                        borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                      },
                    ]}
                    onPress={() => handleOpenQuoteBuilder(item)}
                    activeOpacity={0.8}
                  >
                    <Zap size={12} color="#0066FF" strokeWidth={2.4} />
                    <Text style={styles.actionPillQuoteText} numberOfLines={1}>Quote</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.actionPillProfile,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => handleOpenLeadDetail(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionPillProfileText, { color: colors.textSecondary }]} numberOfLines={1}>
                  Details
                </Text>
                <ChevronRight size={12} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      } catch (err: any) {
        console.error('Safe lead card render recovery:', err?.message || err);
        return (
          <View
            key={String(item?.id || index)}
            style={[
              styles.leadCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                padding: 14,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {String(item?.name || 'Solar Prospect')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
              {String(item?.mobile || item?.phone || 'No phone')} • {String(item?.city || 'Site')}
            </Text>
          </View>
        );
      }
    },
    [
      colors,
      isDark,
      handleOpenLeadDetail,
      handlePhoneCall,
      handleWhatsAppPitch,
      handleOpenDiscomDocs,
      handleOpenQuoteBuilder,
      handleProceedToOnboarding,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* GLOBAL HEADER */}
      <Header
        title="Sales Pipeline"
        subtitle="Turnkey solar CRM, proposals & customer dispatch"
        showSearch
        onSearch={setSearchQuery}
        searchPlaceholder="Search customer, mobile, city, consumer no..."
      />

      {/* EXECUTIVE RADAR PULSE BAR */}
      <View
        style={[
          styles.radarPulseCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.radarPulseItem}>
          <Text style={[styles.radarPulseVal, { color: colors.text }]}>
            {pipelineMetrics.totalKw}
            <Text style={styles.radarPulseUnit}> kWp</Text>
          </Text>
          <Text style={[styles.radarPulseLabel, { color: colors.textMuted }]}>Pipeline</Text>
        </View>

        <View style={[styles.radarPulseDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.radarPulseItem}>
          <Text style={[styles.radarPulseVal, { color: '#0066FF' }]}>
            ₹{pipelineMetrics.grossLakhs}
            <Text style={[styles.radarPulseUnit, { color: '#0066FF' }]}>L</Text>
          </Text>
          <Text style={[styles.radarPulseLabel, { color: colors.textMuted }]}>Turnkey</Text>
        </View>

        <View style={[styles.radarPulseDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.radarPulseItem}>
          <Text style={[styles.radarPulseVal, { color: '#F59E0B' }]}>
            ₹{pipelineMetrics.subsidyLakhs}
            <Text style={[styles.radarPulseUnit, { color: '#F59E0B' }]}>L</Text>
          </Text>
          <Text style={[styles.radarPulseLabel, { color: colors.textMuted }]}>Subsidy</Text>
        </View>

        <View style={[styles.radarPulseDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.radarPulseItem}>
          <Text style={[styles.radarPulseVal, { color: '#10B981' }]}>
            {pipelineMetrics.wonCount}
          </Text>
          <Text style={[styles.radarPulseLabel, { color: colors.textMuted }]}>Won EPC</Text>
        </View>
      </View>

      {/* HORIZONTAL STAGE CHIP TABS */}
      <View style={styles.stageTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsContent}
        >
          {/* Quick Action: New Lead */}
          <TouchableOpacity
            style={styles.quickAddChip}
            onPress={handleOpenLeadCapture}
            activeOpacity={0.85}
          >
            <Plus size={13} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.quickAddChipText}>New Lead</Text>
          </TouchableOpacity>

          {/* Quick Action: 1-Flow Continuous Journey */}
          <TouchableOpacity
            style={styles.seamlessQuickChip}
            onPress={() => {
              setSeamlessInitialLead(null);
              setSeamlessInitialStep(0);
              setSeamlessFlowVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Sparkles size={12} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.seamlessQuickChipText}>⚡ 1-Flow</Text>
          </TouchableOpacity>

          {/* Quick Action: Ledger */}
          <TouchableOpacity
            style={[
              styles.quickLedgerChip,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => navigation?.navigate('Finance')}
            activeOpacity={0.85}
          >
            <Receipt size={12} color="#10B981" strokeWidth={2.4} />
            <Text style={styles.quickLedgerChipText}>Ledger</Text>
          </TouchableOpacity>

          {STAGES.map((s) => {
            const isActive = activeStage === s.id;
            const count = getStageCount(s.id);

            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.stageChip,
                  {
                    backgroundColor: isActive
                      ? '#0066FF'
                      : colors.surface,
                    borderColor: isActive
                      ? '#0066FF'
                      : colors.borderSubtle,
                  },
                ]}
                onPress={() => setActiveStage(s.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.stageChipText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {s.label}
                </Text>

                <View
                  style={[
                    styles.stageChipBadge,
                    {
                      backgroundColor: isActive
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                          ? '#334155'
                          : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stageChipBadgeText,
                      {
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PIPELINE LIST */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
          </View>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Layers size={36} color={colors.textMuted} />}
            title={activeStage === 'ALL' ? 'No Leads in Pipeline' : `No Leads in ${activeStage}`}
            description="Capture a new prospect or calculate a solar quote to start closing solar installations."
            actionTitle="+ Add New Prospect"
            onActionPress={handleOpenLeadCapture}
          />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={keyExtractor}
            renderItem={renderLeadCard}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* WORKFLOW MODALS */}
      <LeadCaptureModal
        visible={leadModalVisible}
        onClose={() => setLeadModalVisible(false)}
        onSuccess={handleLeadCreated}
        onProceedToQuote={handleProceedToQuoteFromLead}
      />

      {selectedLead && (
        <QuotationBuilderModal
          key={`quote-${selectedLead.id}`}
          visible={quoteModalVisible}
          lead={selectedLead}
          onClose={() => setQuoteModalVisible(false)}
          onProceedToOnboarding={handleProceedToOnboarding}
        />
      )}

      {selectedLead && (
        <CustomerOnboardingModal
          key={`onboard-${selectedLead.id}`}
          visible={onboardingModalVisible}
          lead={selectedLead}
          quotationData={activeQuotationData}
          onClose={() => setOnboardingModalVisible(false)}
          onSuccess={handleOnboardingSuccess}
        />
      )}

      {selectedProject && (
        <DiscomDocsModal
          visible={discomModalVisible}
          project={selectedProject}
          onClose={() => setDiscomModalVisible(false)}
        />
      )}

      {/* CREATE INVOICE MODAL */}
      <CreateInvoiceModal
        visible={createInvoiceModalVisible}
        initialLead={targetLeadForInvoice}
        onClose={() => {
          setCreateInvoiceModalVisible(false);
          setTargetLeadForInvoice(null);
        }}
        onSuccess={() => {
          setCreateInvoiceModalVisible(false);
          setTargetLeadForInvoice(null);
          fetchLeads();
        }}
      />

      {/* SEAMLESS 1-FLOW SOLAR JOURNEY MODAL */}
      <SeamlessSolarFlowModal
        visible={seamlessFlowVisible}
        initialLead={seamlessInitialLead}
        initialStepIndex={seamlessInitialStep}
        onClose={() => {
          setSeamlessFlowVisible(false);
          setSeamlessInitialLead(null);
        }}
        onComplete={(result) => {
          setSeamlessFlowVisible(false);
          setSeamlessInitialLead(null);
          fetchLeads();
          if (result?.project) {
            Alert.alert(
              '🎉 Deal Won & Project Provisioned!',
              `"${result.project.name || result.lead?.name || 'Solar Installation'}" is active in the Projects Cockpit with statutory DISCOM pack & booking token invoice.\n\nWould you like to open the Projects Cockpit?`,
              [
                { text: 'Stay in Pipeline', style: 'cancel' },
                {
                  text: 'Open Projects Cockpit ➔',
                  onPress: () => {
                    navigation?.navigate?.('MainTabs', { screen: 'Projects' });
                  },
                },
              ]
            );
          }
        }}
      />

      {/* PDF INVOICE PREVIEW MODAL */}
      <InvoicePdfModal
        visible={pdfModalVisible}
        onClose={() => {
          setPdfModalVisible(false);
          setSelectedInvoiceForPdf(null);
        }}
        invoice={selectedInvoiceForPdf}
      />

      {/* CUSTOMER PROFILE & DISPATCH MODAL */}
      <Modal
        visible={detailModalVisible && !!leadForDetail}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {/* SHEET DRAG HANDLE & HEADER */}
            <View style={styles.modalDragHandle} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Customer Profile & Dispatch
                </Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  WhereReady Solar OS • Operational Dossier
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
                onPress={() => setDetailModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {leadForDetail && (() => {
              const dCap = Number(leadForDetail.estimatedCap || leadForDetail.recommendedKw || 3.3) || 3.3;
              const dGross = Number(leadForDetail.estimatedValue) || Math.round(dCap * 56000);
              const dSubsidy = dCap >= 3 ? 78000 : dCap >= 2 ? 60000 : 30000;
              const dNet = Math.max(0, dGross - dSubsidy);
              const dMonthlyUnits = Math.round(dCap * 120);
              const dMonthlySavings = Math.round(dMonthlyUnits * 8.5);
              const isWon = leadForDetail.status === 'WON';

              // Invoices defensive aggregation
              const dInvs: any[] = [];
              if (Array.isArray(leadForDetail.customer?.invoices)) {
                dInvs.push(...leadForDetail.customer.invoices);
              }
              if (Array.isArray(leadForDetail.projects)) {
                leadForDetail.projects.forEach((p: any) => {
                  if (Array.isArray(p?.invoices)) dInvs.push(...p.invoices);
                });
              }
              const dUniqueInvs = dInvs.filter((i) => i && typeof i === 'object' && i.id);
              const dBilled = dUniqueInvs.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
              const dPaid = dUniqueInvs.reduce((s: number, i: any) => {
                const payments = Array.isArray(i.payments) ? i.payments : [];
                const pSum = payments.reduce((ps: number, p: any) => ps + (Number(p?.amount) || 0), 0);
                return s + (Number(i.totalPaid) || pSum);
              }, 0);
              const dDue = Math.max(0, dBilled - dPaid);
              const dPct = dBilled > 0 ? Math.min(100, Math.round((dPaid / dBilled) * 100)) : 0;

              return (
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* HERO CUSTOMER PROFILE CARD */}
                  <View style={styles.modalHeroCard}>
                    <View style={styles.modalHeroTop}>
                      <View style={styles.modalHeroAvatar}>
                        <Text style={styles.modalHeroAvatarText}>
                          {leadForDetail.name ? leadForDetail.name.charAt(0).toUpperCase() : 'S'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalHeroName}>{leadForDetail.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={11} color="#94A3B8" />
                          <Text style={styles.modalHeroSub}>
                            {leadForDetail.city || 'Site Location'}
                            {leadForDetail.consumerNumber ? ` • Cons: ${leadForDetail.consumerNumber}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.stageBadge,
                          {
                            backgroundColor: isWon ? '#065F46' : '#1E3A8A',
                            borderColor: isWon ? '#10B981' : '#0066FF',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageBadgeText,
                            { color: isWon ? '#34D399' : '#93C5FD' },
                          ]}
                        >
                          {isWon ? 'WON / EPC' : leadForDetail.status || 'NEW'}
                        </Text>
                      </View>
                    </View>

                    {/* DIRECT COMMUNICATIONS BAR */}
                    <View style={styles.modalHeroComms}>
                      <TouchableOpacity
                        style={styles.modalCommBtn}
                        onPress={() => handlePhoneCall(leadForDetail.mobile || leadForDetail.phone)}
                        activeOpacity={0.8}
                      >
                        <Phone size={13} color="#0066FF" strokeWidth={2.4} />
                        <Text style={styles.modalCommBtnText}>Call Customer</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalCommBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                        onPress={() => handleWhatsAppPitch(leadForDetail)}
                        activeOpacity={0.8}
                      >
                        <MessageCircle size={13} color="#10B981" strokeWidth={2.4} />
                        <Text style={[styles.modalCommBtnText, { color: '#10B981' }]}>WhatsApp Pitch</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* RECOMMENDED NEXT ACTION */}
                  <View
                    style={[
                      styles.recommendCard,
                      {
                        backgroundColor: isDark ? 'rgba(0, 102, 255, 0.08)' : '#EFF6FF',
                        borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                      },
                    ]}
                  >
                    <View style={styles.recommendTagRow}>
                      <Sparkles size={12} color="#F59E0B" />
                      <Text style={styles.recommendTag}>RECOMMENDED ACTION</Text>
                    </View>
                    <Text style={[styles.recommendHeadline, { color: colors.text }]}>
                      {isWon
                        ? 'Generate Net-Metering DISCOM Statutory Forms'
                        : leadForDetail.status === 'PROPOSAL_SENT'
                          ? 'Execute Customer Agreement & Onboarding'
                          : 'Send 60-Second PM Surya Ghar Solar Proposal'}
                    </Text>
                    <Text style={[styles.recommendSub, { color: colors.textSecondary }]}>
                      {isWon
                        ? 'Deal is won. Submit formal grid connection and bi-directional meter requisition to DISCOM.'
                        : leadForDetail.status === 'PROPOSAL_SENT'
                          ? 'Proposal delivered. Collect KYC documents and generate the EPC master contract.'
                          : `Lock in ₹${(dSubsidy / 1000).toFixed(0)}k DBT subsidy for ${dCap} kWp rooftop plant.`}
                    </Text>

                    <TouchableOpacity
                      style={styles.recommendBtn}
                      onPress={() => {
                        setDetailModalVisible(false);
                        if (isWon) {
                          handleOpenDiscomDocs(leadForDetail);
                        } else if (leadForDetail.status === 'PROPOSAL_SENT') {
                          handleProceedToOnboarding(leadForDetail, {
                            capacityKw: dCap,
                            grossTotal: dGross,
                            subsidy: dSubsidy,
                            netCustomerCost: dNet,
                          });
                        } else {
                          handleOpenQuoteBuilder(leadForDetail);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Zap size={14} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.recommendBtnText}>
                        {isWon
                          ? 'Generate DISCOM Dossier'
                          : leadForDetail.status === 'PROPOSAL_SENT'
                            ? 'Start Client Onboarding'
                            : 'Open Quotation Builder'}
                      </Text>
                      <ArrowRight size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* SYSTEM SPECIFICATIONS & FINANCIAL ARCHITECTURE */}
                  <View
                    style={[
                      styles.sectionBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      SYSTEM SPECIFICATIONS & PM SURYA GHAR
                    </Text>
                    <View style={styles.specsGrid}>
                      <View
                        style={[
                          styles.specGridItem,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      >
                        <Text style={[styles.specGridLabel, { color: colors.textMuted }]}>CAPACITY</Text>
                        <Text style={[styles.specGridVal, { color: colors.text }]}>{dCap} kWp</Text>
                        <Text style={[styles.specGridHint, { color: colors.textMuted }]}>Mono PERC DCR</Text>
                      </View>
                      <View
                        style={[
                          styles.specGridItem,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      >
                        <Text style={[styles.specGridLabel, { color: colors.textMuted }]}>TURNKEY COST</Text>
                        <Text style={[styles.specGridVal, { color: colors.text }]}>₹{dGross.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.specGridHint, { color: colors.textMuted }]}>GST Included</Text>
                      </View>
                      <View
                        style={[
                          styles.specGridItem,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      >
                        <Text style={[styles.specGridLabel, { color: colors.textMuted }]}>PM SUBSIDY</Text>
                        <Text style={[styles.specGridVal, { color: '#10B981' }]}>-₹{dSubsidy.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.specGridHint, { color: colors.textMuted }]}>Direct DBT</Text>
                      </View>
                      <View
                        style={[
                          styles.specGridItem,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      >
                        <Text style={[styles.specGridLabel, { color: colors.textMuted }]}>NET PAYABLE</Text>
                        <Text style={[styles.specGridVal, { color: '#0066FF' }]}>₹{dNet.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.specGridHint, { color: colors.textMuted }]}>After Subsidy</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.yieldRow,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.yieldTitle, { color: colors.text }]}>Monthly Generation & Tariff Offset</Text>
                        <Text style={[styles.yieldSub, { color: colors.textSecondary }]}>
                          ~{dMonthlyUnits} units/mo • Saves ₹{dMonthlySavings.toLocaleString('en-IN')}/mo on electricity bill
                        </Text>
                      </View>
                      <View style={styles.yieldBadge}>
                        <Text style={styles.yieldBadgeText}>90%+ Offset</Text>
                      </View>
                    </View>
                  </View>

                  {/* COMMERCIAL CASHFLOW LEDGER */}
                  <View
                    style={[
                      styles.sectionBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Receipt size={14} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                          COMMERCIAL CASHFLOW LEDGER
                        </Text>
                      </View>
                      <Text style={[styles.invoiceCountBadge, { color: colors.textMuted }]}>
                        {dUniqueInvs.length} Invoices
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${dBilled > 0 ? dPct : 0}%`,
                              backgroundColor: dDue === 0 && dPaid > 0 ? '#10B981' : '#0066FF',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: '#10B981' }]}>{dPct}% Realized</Text>
                    </View>

                    {/* 3 Metric Columns */}
                    <View
                      style={[
                        styles.ledgerMetricsRow,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={styles.ledgerMetricCol}>
                        <Text style={[styles.ledgerMetricLabel, { color: colors.textMuted }]}>INVOICED</Text>
                        <Text style={[styles.ledgerMetricVal, { color: colors.text }]}>
                          ₹{dBilled.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.ledgerMetricCol}>
                        <Text style={[styles.ledgerMetricLabel, { color: colors.textMuted }]}>RECEIVED</Text>
                        <Text style={[styles.ledgerMetricVal, { color: '#10B981' }]}>
                          ₹{dPaid.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.ledgerMetricCol}>
                        <Text style={[styles.ledgerMetricLabel, { color: colors.textMuted }]}>OUTSTANDING</Text>
                        <Text style={[styles.ledgerMetricVal, { color: dDue > 0 ? '#F59E0B' : colors.textMuted }]}>
                          ₹{dDue.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.ledgerActionsRow}>
                      <TouchableOpacity
                        style={styles.ledgerActionBtnPrimary}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleOpenCreateInvoiceForLead(leadForDetail);
                        }}
                        activeOpacity={0.8}
                      >
                        <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.ledgerActionBtnPrimaryText}>+ Quick Invoice</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.ledgerActionBtnSecondary,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                            borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                          },
                        ]}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleOpenPdfInvoiceForLead(leadForDetail);
                        }}
                        activeOpacity={0.8}
                      >
                        <FileText size={12} color="#0066FF" />
                        <Text style={styles.ledgerActionBtnSecondaryText}>PDF</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.ledgerActionBtnTertiary,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleNavigateToFinanceForLead(leadForDetail);
                        }}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={12} color={colors.textSecondary} />
                        <Text style={[styles.ledgerActionBtnTertiaryText, { color: colors.textSecondary }]}>
                          Ledger
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // RADAR PULSE BAR
  radarPulseCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  radarPulseItem: {
    flex: 1,
    alignItems: 'center',
  },
  radarPulseVal: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  radarPulseUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  radarPulseLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  radarPulseDivider: {
    width: 1,
    height: 24,
  },

  // STAGE TABS
  stageTabsWrapper: {
    marginBottom: 10,
    paddingBottom: 4,
  },
  stageTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0066FF',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAddChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seamlessQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#10B981',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  seamlessQuickChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickLedgerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },
  quickLedgerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 12,
  },
  stageChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  stageChipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // LIST & CARDS
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  leadCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameAndStageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  stageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  stageBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },

  // METRIC PILLS
  metricsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  metricPillVal: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // ACTIONS STRIP
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionPillWon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    flexShrink: 0,
  },
  actionPillWonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  actionPillSeamless: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    flexShrink: 0,
  },
  actionPillSeamlessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  actionPillQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    flexShrink: 0,
  },
  actionPillQuoteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  actionPillProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionPillProfileText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  modalHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modalHeroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeroAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalHeroName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  modalHeroSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalHeroComms: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCommBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCommBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
  },
  recommendCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  recommendTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  recommendTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  recommendHeadline: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  recommendSub: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 11,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceCountBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  specGridItem: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  specGridLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  specGridVal: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  specGridHint: {
    fontSize: 8,
    fontWeight: '600',
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  yieldTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  yieldSub: {
    fontSize: 10,
    marginTop: 1,
  },
  yieldBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  yieldBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ledgerMetricsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  ledgerMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerMetricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ledgerMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  ledgerActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ledgerActionBtnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 9,
  },
  ledgerActionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ledgerActionBtnSecondary: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
  },
  ledgerActionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  ledgerActionBtnTertiary: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
  },
  ledgerActionBtnTertiaryText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
