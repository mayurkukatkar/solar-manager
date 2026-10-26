import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import {
  Plus,
  Phone,
  MessageCircle,
  FileText,
  ShieldCheck,
  Building,
  Zap,
  ArrowRight,
  Search,
  Sparkles,
  Camera,
  Layers,
  CheckCircle2,
  TrendingUp,
  IndianRupee,
  Calendar,
  Receipt,
  CreditCard,
  X,
  ChevronRight,
  Clock,
  MapPin,
  User,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { crmApi, financeApi } from '../../api/endpoints';
import { offlineSyncService } from '../../services/offlineSyncService';
import { LeadCaptureModal } from './LeadCaptureModal';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import { CustomerOnboardingModal } from './CustomerOnboardingModal';
import { DiscomDocsModal } from '../projects/DiscomDocsModal';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
import { CreateInvoiceModal } from '../../components/CreateInvoiceModal';
import { colors } from '../../theme/colors';

const STAGES = [
  { id: 'ALL', label: 'All Records' },
  { id: 'LEADS', label: '1. New Leads' },
  { id: 'QUOTES', label: '2. Quotes Sent' },
  { id: 'ONBOARDING', label: '3. KYC Pending' },
  { id: 'PROJECTS', label: '4. Converted' },
];

export const PipelineScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [discomModalVisible, setDiscomModalVisible] = useState(false);

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
    } catch (err: any) {
      console.warn('Leads fetch notice:', err.message);
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
    setLeadModalVisible(true);
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
      consumerNumber: item.consumerNumber || '410022120526',
      capacity: item.estimatedCap || 3.3,
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

  // KPI Calculations for the Vendor
  const pipelineMetrics = useMemo(() => {
    let totalCap = 0;
    let totalGross = 0;
    let totalSubsidy = 0;
    let wonCount = 0;

    leads.forEach((l) => {
      const c = l.estimatedCap || 3.3;
      const g = l.estimatedValue || Math.round(c * 56000);
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

  // Filter leads based on Stage & Search
  const filteredItems = leads.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.mobile || '').includes(searchQuery) ||
      (item.city || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeStage === 'LEADS') {
      return item.status === 'NEW' || item.status === 'CONTACTED' || !item.status;
    }
    if (activeStage === 'QUOTES') {
      return item.status === 'QUALIFIED' || item.status === 'PROPOSAL_SENT';
    }
    if (activeStage === 'ONBOARDING') {
      return item.status === 'SITE_SURVEY' || item.status === 'NEGOTIATION';
    }
    if (activeStage === 'PROJECTS') {
      return item.status === 'WON' || item.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* GLOBAL HEADER WITH BUILT-IN SEARCH */}
      <Header
        title="Sales CRM & Pipeline"
        subtitle="Turnkey solar pipeline, quote builder & lead intake"
        showSearch
        onSearch={setSearchQuery}
        searchPlaceholder="Search customer, mobile, city, consumer no..."
      />

      {/* EXECUTIVE PULSE METRICS BAR (WhereReady Clean Studio) */}
      <View style={styles.pulseContainer}>
        <View style={styles.pulseItem}>
          <Text style={styles.pulseNum}>{pipelineMetrics.totalKw} <Text style={styles.pulseUnit}>kW</Text></Text>
          <Text style={styles.pulseLabel}>Pipeline</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseItem}>
          <Text style={styles.pulseNumBlue}>₹{pipelineMetrics.grossLakhs} <Text style={styles.pulseUnitBlue}>L</Text></Text>
          <Text style={styles.pulseLabel}>Turnkey</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseItem}>
          <Text style={styles.pulseNumGold}>₹{pipelineMetrics.subsidyLakhs} <Text style={styles.pulseUnitGold}>L</Text></Text>
          <Text style={styles.pulseLabel}>Subsidy</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseItem}>
          <Text style={styles.pulseNumGreen}>{pipelineMetrics.wonCount}</Text>
          <Text style={styles.pulseLabel}>Won Clients</Text>
        </View>
      </View>

      {/* QUICK ACTIONS & STAGE FILTER BAR */}
      <View style={styles.actionsAndFilterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsContent}
        >
          {/* Quick Action Button for + New Lead */}
          <TouchableOpacity
            style={styles.addLeadChipBtn}
            onPress={handleOpenLeadCapture}
            activeOpacity={0.85}
          >
            <Plus size={13} color="#ffffff" strokeWidth={2.8} />
            <Text style={styles.addLeadChipText}>New Lead</Text>
          </TouchableOpacity>

          {/* Quick Action for Finance */}
          <TouchableOpacity
            style={styles.financeChipBtn}
            onPress={() => navigation?.navigate('Finance')}
            activeOpacity={0.85}
          >
            <Receipt size={13} color="#059669" strokeWidth={2.4} />
            <Text style={styles.financeChipText}>Ledger</Text>
          </TouchableOpacity>

          {STAGES.map((s) => {
            const isActive = activeStage === s.id;
            const count =
              s.id === 'ALL'
                ? leads.length
                : s.id === 'LEADS'
                ? leads.filter((l) => l.status === 'NEW' || l.status === 'CONTACTED' || !l.status).length
                : s.id === 'QUOTES'
                ? leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'PROPOSAL_SENT').length
                : s.id === 'ONBOARDING'
                ? leads.filter((l) => l.status === 'SITE_SURVEY' || l.status === 'NEGOTIATION').length
                : leads.filter((l) => l.status === 'WON' || l.status === 'COMPLETED').length;

            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.stageChip, isActive && styles.stageChipActive]}
                onPress={() => setActiveStage(s.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stageChipText, isActive && styles.stageChipTextActive]}>
                  {s.label}
                </Text>
                <View style={[styles.chipBadge, isActive && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, isActive && styles.chipBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PIPELINE LIST */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting to Vendor ERP...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Layers size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>
              Capture a new prospect or scan a physical electricity bill to start closing solar deals.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={handleOpenLeadCapture}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.emptyActionText}>Add New Prospect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => {
            const cap = item.estimatedCap || 3.3;
            const gross = item.estimatedValue || Math.round(cap * 56000);
            const subsidy = cap >= 3 ? 78000 : cap >= 2 ? 60000 : 30000;
            const net = Math.max(0, gross - subsidy);
            const isWon = item.status === 'WON';

            // Live linked commercial invoices
            const leadInvoices: any[] = [];
            if (item.customer?.invoices) leadInvoices.push(...item.customer.invoices);
            if (item.projects) {
              item.projects.forEach((p: any) => {
                if (p.invoices) leadInvoices.push(...p.invoices);
              });
            }
            const uniqueInvoices = Array.from(new Map(leadInvoices.map((i: any) => [i.id, i])).values());
            const hasInvoices = uniqueInvoices.length > 0;

            const totalBilled = uniqueInvoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);
            const totalPaid = uniqueInvoices.reduce((s: number, i: any) => {
              const pSum = (i.payments || []).reduce((ps: number, p: any) => ps + (p.amount || 0), 0);
              return s + (i.totalPaid ?? pSum);
            }, 0);
            const totalDue = Math.max(0, totalBilled - totalPaid);
            const realizedPct = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;
            const billedOfDealPct = gross > 0 ? Math.min(100, Math.round((totalBilled / gross) * 100)) : 0;

            // Status Badge calculation
            let statusLabel = 'NOT INVOICED';
            let statusBadgeStyle = styles.commercialStatusNeutral;
            let statusTextStyle = styles.commercialStatusTextNeutral;
            if (hasInvoices) {
              if (totalDue === 0 && totalPaid > 0) {
                statusLabel = '✓ 100% SETTLED';
                statusBadgeStyle = styles.commercialStatusSuccess;
                statusTextStyle = styles.commercialStatusTextSuccess;
              } else if (totalPaid > 0) {
                statusLabel = `PARTIAL (${realizedPct}%)`;
                statusBadgeStyle = styles.commercialStatusInfo;
                statusTextStyle = styles.commercialStatusTextInfo;
              } else {
                statusLabel = `DUE ₹${(totalDue / 1000).toFixed(0)}k`;
                statusBadgeStyle = styles.commercialStatusWarning;
                statusTextStyle = styles.commercialStatusTextWarning;
              }
            }

            const avatarInitials = item.name
              ? item.name
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'SO';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.leadRowCard}
                onPress={() => handleOpenLeadDetail(item)}
                activeOpacity={0.88}
              >
                {/* TOP ROW: AVATAR + NAME & LOCATION + STAGE BADGE */}
                <View style={styles.rowMainTop}>
                  <View style={[styles.avatarCircle, isWon ? styles.avatarWon : item.isDraft ? styles.avatarDraft : styles.avatarActive]}>
                    <Text style={[styles.avatarText, isWon ? styles.avatarTextWon : item.isDraft ? styles.avatarTextDraft : styles.avatarTextActive]}>
                      {avatarInitials}
                    </Text>
                  </View>

                  <View style={styles.leadInfoCol}>
                    <View style={styles.leadNameRow}>
                      <Text style={styles.leadNameText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={[styles.statusBadge, item.isDraft ? styles.statusBadgeDraft : isWon ? styles.statusBadgeWon : styles.statusBadgeActive]}>
                        <Text style={[styles.statusBadgeText, item.isDraft ? styles.statusBadgeTextDraft : isWon ? styles.statusBadgeTextWon : styles.statusBadgeTextActive]}>
                          {item.isDraft ? 'DRAFT' : isWon ? 'WON / EPC' : item.status || 'NEW'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.leadSubText} numberOfLines={1}>
                      📍 {item.city || 'Site Location'} {item.mobile ? `• ${item.mobile}` : ''} {item.consumerNumber ? `• No: ${item.consumerNumber}` : ''}
                    </Text>
                  </View>
                </View>

                {/* KEY SPECS & COMMERCIAL STRIP */}
                <View style={styles.specsPillsRow}>
                  <View style={styles.specPill}>
                    <Zap size={11} color="#0284c7" />
                    <Text style={styles.specPillText}>{cap} kWp</Text>
                  </View>

                  <View style={styles.specPill}>
                    <IndianRupee size={11} color="#0f172a" />
                    <Text style={styles.specPillText}>₹{(gross / 100000).toFixed(2)}L</Text>
                  </View>

                  <View style={[styles.specPill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                    <Sparkles size={11} color="#059669" />
                    <Text style={[styles.specPillText, { color: '#059669' }]}>₹{(subsidy / 1000).toFixed(0)}k DBT</Text>
                  </View>

                  <View style={[styles.specPill, statusBadgeStyle]}>
                    <Text style={[styles.specPillText, statusTextStyle]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* QUICK 1-TAP ACTION STRIP */}
                <View style={styles.rowActionsStrip}>
                  <TouchableOpacity
                    style={styles.microCircleBtn}
                    onPress={() => handlePhoneCall(item.mobile || item.phone)}
                    activeOpacity={0.75}
                  >
                    <Phone size={14} color="#0284c7" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.microCircleBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                    onPress={() => handleWhatsAppPitch(item)}
                    activeOpacity={0.75}
                  >
                    <MessageCircle size={14} color="#059669" />
                  </TouchableOpacity>

                  {isWon ? (
                    <TouchableOpacity
                      style={styles.actionBtnWon}
                      onPress={() => handleOpenDiscomDocs(item)}
                      activeOpacity={0.8}
                    >
                      <Building size={13} color="#d97706" />
                      <Text style={styles.actionBtnWonText}>DISCOM Docs</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtnQuote}
                        onPress={() => handleOpenQuoteBuilder(item)}
                        activeOpacity={0.8}
                      >
                        <Zap size={13} color="#2563eb" />
                        <Text style={styles.actionBtnQuoteText}>Quote</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnOnboard}
                        onPress={() => handleProceedToOnboarding(item, { capacityKw: cap, grossTotal: gross, subsidy, netCustomerCost: net })}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={13} color="#ffffff" />
                        <Text style={styles.actionBtnOnboardText}>Onboard</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.openDetailPill}
                    onPress={() => handleOpenLeadDetail(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.openDetailText}>Profile</Text>
                    <ChevronRight size={12} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

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

      {/* SMART COMMERCIAL INVOICE CREATOR MODAL */}
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

      {/* PDF INVOICE PREVIEW & ACTIONS MODAL */}
      <InvoicePdfModal
        visible={pdfModalVisible}
        onClose={() => {
          setPdfModalVisible(false);
          setSelectedInvoiceForPdf(null);
        }}
        invoice={selectedInvoiceForPdf}
      />

      {/* 6. WHERE READY FIELD EXPERIENCE: ACTION-ORIENTED CUSTOMER PROFILE MODAL */}
      <Modal
        visible={detailModalVisible && !!leadForDetail}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalSheet}>
            {/* SHEET HEADER */}
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>Customer Profile & Dispatch</Text>
                <Text style={styles.detailModalSub}>WhereReady Field Experience • Operational Hub</Text>
              </View>
              <TouchableOpacity
                style={styles.detailModalClose}
                onPress={() => setDetailModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {leadForDetail && (() => {
              const dCap = leadForDetail.estimatedCap || 3.3;
              const dGross = leadForDetail.estimatedValue || Math.round(dCap * 56000);
              const dSubsidy = dCap >= 3 ? 78000 : dCap >= 2 ? 60000 : 30000;
              const dNet = Math.max(0, dGross - dSubsidy);
              const dMonthlyUnits = Math.round(dCap * 120);
              const dMonthlySavings = Math.round(dMonthlyUnits * 8.5);
              const isWon = leadForDetail.status === 'WON';

              // Invoices
              const dInvs: any[] = [];
              if (leadForDetail.customer?.invoices) dInvs.push(...leadForDetail.customer.invoices);
              if (leadForDetail.projects) {
                leadForDetail.projects.forEach((p: any) => {
                  if (p.invoices) dInvs.push(...p.invoices);
                });
              }
              const dUniqueInvs = Array.from(new Map(dInvs.map((i: any) => [i.id, i])).values());
              const dBilled = dUniqueInvs.reduce((s: number, i: any) => s + (i.amount || 0), 0);
              const dPaid = dUniqueInvs.reduce((s: number, i: any) => {
                const pSum = (i.payments || []).reduce((ps: number, p: any) => ps + (p.amount || 0), 0);
                return s + (i.totalPaid ?? pSum);
              }, 0);
              const dDue = Math.max(0, dBilled - dPaid);
              const dPct = dBilled > 0 ? Math.min(100, Math.round((dPaid / dBilled) * 100)) : 0;

              return (
                <ScrollView
                  style={styles.detailScroll}
                  contentContainerStyle={styles.detailScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* HERO CUSTOMER PROFILE CARD */}
                  <View style={styles.detailHeroCard}>
                    <View style={styles.detailHeroTop}>
                      <View style={styles.detailAvatar}>
                        <Text style={styles.detailAvatarText}>
                          {leadForDetail.name ? leadForDetail.name.charAt(0).toUpperCase() : 'S'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailHeroName}>{leadForDetail.name}</Text>
                        <Text style={styles.detailHeroSub}>
                          📍 {leadForDetail.city || 'Site Location'} {leadForDetail.consumerNumber ? `• Cons: ${leadForDetail.consumerNumber}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, isWon ? styles.statusBadgeWon : styles.statusBadgeActive]}>
                        <Text style={[styles.statusBadgeText, isWon ? styles.statusBadgeTextWon : styles.statusBadgeTextActive]}>
                          {isWon ? 'WON / EPC' : leadForDetail.status || 'NEW'}
                        </Text>
                      </View>
                    </View>

                    {/* DIRECT COMMUNICATIONS BAR */}
                    <View style={styles.detailCommsRow}>
                      <TouchableOpacity
                        style={styles.detailCommBtn}
                        onPress={() => handlePhoneCall(leadForDetail.mobile || leadForDetail.phone)}
                        activeOpacity={0.8}
                      >
                        <Phone size={14} color="#0284c7" />
                        <Text style={styles.detailCommBtnText}>Call Customer</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailCommBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                        onPress={() => handleWhatsAppPitch(leadForDetail)}
                        activeOpacity={0.8}
                      >
                        <MessageCircle size={14} color="#059669" />
                        <Text style={[styles.detailCommBtnText, { color: '#059669' }]}>WhatsApp Pitch</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* UBER-INSPIRED: NEXT RECOMMENDED ACTION */}
                  <View style={styles.detailRecommendCard}>
                    <View style={styles.recommendTagRow}>
                      <Sparkles size={13} color="#f59e0b" />
                      <Text style={styles.recommendTag}>RECOMMENDED NEXT ACTION</Text>
                    </View>
                    <Text style={styles.recommendHeadline}>
                      {isWon
                        ? 'Generate Net-Metering DISCOM Statutory Forms'
                        : leadForDetail.status === 'PROPOSAL_SENT'
                        ? 'Execute Customer Agreement & Onboarding'
                        : 'Send 60-Second PM Surya Ghar Solar Proposal'}
                    </Text>
                    <Text style={styles.recommendSub}>
                      {isWon
                        ? 'Customer deal is won. Submit formal grid connection and bi-directional meter requisition to DISCOM.'
                        : leadForDetail.status === 'PROPOSAL_SENT'
                        ? 'Quotation has been delivered. Collect KYC documents and generate the EPC master contract.'
                        : `Lock in ₹${(dSubsidy / 1000).toFixed(0)}k DBT subsidy for ${dCap} kWp rooftop plant.`}
                    </Text>

                    <TouchableOpacity
                      style={styles.recommendBtn}
                      onPress={() => {
                        setDetailModalVisible(false);
                        if (isWon) {
                          handleOpenDiscomDocs(leadForDetail);
                        } else if (leadForDetail.status === 'PROPOSAL_SENT') {
                          handleProceedToOnboarding(leadForDetail, { capacityKw: dCap, grossTotal: dGross, subsidy: dSubsidy, netCustomerCost: dNet });
                        } else {
                          handleOpenQuoteBuilder(leadForDetail);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Zap size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.recommendBtnText}>
                        {isWon ? 'Generate DISCOM Dossier' : leadForDetail.status === 'PROPOSAL_SENT' ? 'Start Client Onboarding' : 'Open Quotation Builder'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* SYSTEM & FINANCIAL ARCHITECTURE */}
                  <View style={styles.detailSpecsCard}>
                    <Text style={styles.detailSectionTitle}>SYSTEM SPECIFICATIONS & PM SURYA GHAR</Text>
                    <View style={styles.detailSpecsGrid}>
                      <View style={styles.detailSpecItem}>
                        <Text style={styles.detailSpecLabel}>Capacity</Text>
                        <Text style={styles.detailSpecVal}>{dCap} kWp</Text>
                        <Text style={styles.detailSpecHint}>Mono PERC DCR</Text>
                      </View>
                      <View style={styles.detailSpecItem}>
                        <Text style={styles.detailSpecLabel}>Turnkey Cost</Text>
                        <Text style={styles.detailSpecVal}>₹{dGross.toLocaleString('en-IN')}</Text>
                        <Text style={styles.detailSpecHint}>All GST Incl.</Text>
                      </View>
                      <View style={styles.detailSpecItem}>
                        <Text style={styles.detailSpecLabel}>PM Subsidy</Text>
                        <Text style={[styles.detailSpecVal, { color: '#059669' }]}>-₹{dSubsidy.toLocaleString('en-IN')}</Text>
                        <Text style={styles.detailSpecHint}>Direct DBT</Text>
                      </View>
                      <View style={styles.detailSpecItem}>
                        <Text style={styles.detailSpecLabel}>Net Payable</Text>
                        <Text style={[styles.detailSpecVal, { color: '#0284c7' }]}>₹{dNet.toLocaleString('en-IN')}</Text>
                        <Text style={styles.detailSpecHint}>After Subsidy</Text>
                      </View>
                    </View>

                    <View style={styles.detailYieldRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailYieldTitle}>Monthly Generation & Bill Offset</Text>
                        <Text style={styles.detailYieldSub}>
                          ~{dMonthlyUnits} units/mo • Saves ₹{dMonthlySavings.toLocaleString('en-IN')}/mo on tariff
                        </Text>
                      </View>
                      <View style={styles.detailYieldBadge}>
                        <Text style={styles.detailYieldBadgeText}>⚡ 90%+ Offset</Text>
                      </View>
                    </View>
                  </View>

                  {/* COMMERCIAL INVOICING & CASHFLOW HUB */}
                  <View style={styles.detailFinanceCard}>
                    <View style={styles.detailFinanceHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Receipt size={15} color="#059669" />
                        <Text style={styles.detailSectionTitle}>COMMERCIAL CASHFLOW LEDGER</Text>
                      </View>
                      <Text style={styles.detailFinanceCount}>{dUniqueInvs.length} Invoices</Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.detailProgressWrap}>
                      <View style={styles.detailProgressTrack}>
                        <View
                          style={[
                            styles.detailProgressFill,
                            {
                              width: `${dBilled > 0 ? dPct : 0}%`,
                              backgroundColor: dDue === 0 && dPaid > 0 ? '#10b981' : '#0284c7',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.detailProgressText}>{dPct}% Collected</Text>
                    </View>

                    {/* 3 Metric Columns */}
                    <View style={styles.detailFinanceCols}>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.detailFinanceColLabel}>Invoiced</Text>
                        <Text style={styles.detailFinanceColVal}>₹{dBilled.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.detailFinanceColLabel}>Received</Text>
                        <Text style={[styles.detailFinanceColVal, { color: '#059669' }]}>₹{dPaid.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.detailFinanceColLabel}>Outstanding</Text>
                        <Text style={[styles.detailFinanceColVal, { color: dDue > 0 ? '#d97706' : '#64748b' }]}>₹{dDue.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.detailFinanceActions}>
                      <TouchableOpacity
                        style={styles.detailInvoiceActionBtn}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleOpenCreateInvoiceForLead(leadForDetail);
                        }}
                        activeOpacity={0.8}
                      >
                        <Plus size={13} color="#ffffff" />
                        <Text style={styles.detailInvoiceActionBtnText}>+ Quick Invoice</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailPdfActionBtn}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleOpenPdfInvoiceForLead(leadForDetail);
                        }}
                        activeOpacity={0.8}
                      >
                        <FileText size={13} color="#2563eb" />
                        <Text style={styles.detailPdfActionBtnText}>📄 PDF Invoice</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailLedgerActionBtn}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleNavigateToFinanceForLead(leadForDetail);
                        }}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={13} color="#059669" />
                        <Text style={styles.detailLedgerActionBtnText}>💳 Full Ledger</Text>
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
    backgroundColor: '#f8fafc',
  },
  topActionStrip: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  financeHeaderBtn: {
    backgroundColor: '#ecfdf5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  financeHeaderBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  addLeadHeaderBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addLeadHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadgeDraft: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusBadgeTextDraft: {
    color: '#d97706',
  },
  pulseContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  pulseItem: {
    flex: 1,
    alignItems: 'center',
  },
  pulseNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  pulseUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  pulseNumBlue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0066FF',
  },
  pulseUnitBlue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066FF',
  },
  pulseNumGold: {
    fontSize: 15,
    fontWeight: '900',
    color: '#d97706',
  },
  pulseUnitGold: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  pulseNumGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  pulseLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  pulseDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#f1f5f9',
  },
  actionsAndFilterRow: {
    marginTop: 6,
    marginBottom: 4,
  },
  addLeadChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0066FF',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addLeadChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  financeChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  financeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  stageTabsContainer: {
    marginBottom: 4,
  },
  stageTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stageChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  stageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  stageChipTextActive: {
    color: '#ffffff',
  },
  chipBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  chipBadgeTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  centerContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 20,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardCustomerInfo: {
    flex: 1,
  },
  cardCustomerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardCustomerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#eff6ff',
  },
  statusBadgeWon: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadgeTextActive: {
    color: '#2563eb',
  },
  statusBadgeTextWon: {
    color: '#16a34a',
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  metricValueBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  metricValueGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 2,
  },
  metricValueBlue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteCtaBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quoteCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  onboardCtaBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  onboardCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  discomCtaBtn: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  discomCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d97706',
  },
  commercialBillingBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  commercialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commercialTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  commercialIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  commercialTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: 0.4,
  },
  commercialSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  commercialStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  commercialStatusNeutral: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  commercialStatusSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  commercialStatusInfo: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  commercialStatusWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  commercialStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  commercialStatusTextNeutral: {
    color: '#64748b',
  },
  commercialStatusTextSuccess: {
    color: '#059669',
  },
  commercialStatusTextInfo: {
    color: '#2563eb',
  },
  commercialStatusTextWarning: {
    color: '#d97706',
  },
  progressBarWrapper: {
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  commercialMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  commercialMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  commercialMetricColBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  commercialMetricLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  commercialMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  commercialMetricHint: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 1,
  },
  commercialActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickInvoiceBtn: {
    flex: 1.3,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  quickInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  viewPdfInvoiceBtn: {
    flex: 0.9,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewPdfInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },
  leadFinanceLinkBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  leadFinanceLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  // ----------------------------------------------------
  // WHERE READY FIELD EXPERIENCE: SCANNABLE LEAD ROW STYLES
  // ----------------------------------------------------
  leadRowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  rowMainTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  avatarWon: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  avatarDraft: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  avatarTextActive: {
    color: '#0066FF',
  },
  avatarTextWon: {
    color: '#059669',
  },
  avatarTextDraft: {
    color: '#d97706',
  },
  leadInfoCol: {
    flex: 1,
  },
  leadNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  leadNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  leadSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  specsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  rowActionsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  microCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnWonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
  },
  actionBtnQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnQuoteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  actionBtnOnboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnOnboardText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  openDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  openDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },

  // ----------------------------------------------------
  // ACTION-ORIENTED CUSTOMER PROFILE MODAL (Uber & Ola inspired)
  // ----------------------------------------------------
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  detailModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  detailModalSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  detailModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailScroll: {
    maxHeight: '100%',
  },
  detailScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailHeroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  detailHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  detailHeroName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  detailHeroSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  detailCommsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailCommBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
  },
  detailCommBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  detailRecommendCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  recommendTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  recommendTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#d97706',
    letterSpacing: 0.5,
  },
  recommendHeadline: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  recommendSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 12,
  },
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 11,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  detailSpecsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  detailSpecsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailSpecItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  detailSpecLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailSpecVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 2,
  },
  detailSpecHint: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '600',
  },
  detailYieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailYieldTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailYieldSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  detailYieldBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailYieldBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  detailFinanceCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  detailFinanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailFinanceCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  detailProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  detailFinanceCols: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailFinanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailFinanceColLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailFinanceColVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  detailFinanceActions: {
    flexDirection: 'row',
    gap: 6,
  },
  detailInvoiceActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 8,
  },
  detailInvoiceActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  detailPdfActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 8,
  },
  detailPdfActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  detailLedgerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
  },
  detailLedgerActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
