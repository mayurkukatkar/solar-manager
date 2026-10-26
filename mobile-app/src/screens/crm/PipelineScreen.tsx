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
      {/* GLOBAL HEADER */}
      <Header
        title="Sales CRM & Pipeline"
        subtitle="Turnkey solar pipeline, quote builder & lead intake"
      />

      {/* QUICK ACTION BAR */}
      <View style={styles.topActionStrip}>
        <TouchableOpacity
          style={styles.financeHeaderBtn}
          onPress={() => navigation?.navigate('Finance')}
          activeOpacity={0.85}
        >
          <Receipt size={14} color="#059669" strokeWidth={2.5} />
          <Text style={styles.financeHeaderBtnText}>Finance Ledger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addLeadHeaderBtn}
          onPress={handleOpenLeadCapture}
          activeOpacity={0.85}
        >
          <Plus size={15} color="#ffffff" strokeWidth={2.8} />
          <Text style={styles.addLeadHeaderBtnText}>+ New Lead</Text>
        </TouchableOpacity>
      </View>

      {/* EXECUTIVE PULSE METRICS BAR */}
      <View style={styles.pulseContainer}>
        <View style={styles.pulseItem}>
          <Text style={styles.pulseNum}>{pipelineMetrics.totalKw} <Text style={styles.pulseUnit}>kW</Text></Text>
          <Text style={styles.pulseLabel}>Pipeline</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseItem}>
          <Text style={styles.pulseNum}>₹{pipelineMetrics.grossLakhs} <Text style={styles.pulseUnit}>L</Text></Text>
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

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer, mobile, consumer no..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* STAGE CHIPS */}
      <View style={styles.stageTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabsContent}>
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

            return (
              <View key={item.id} style={styles.leadCard}>
                {/* CARD HEADER */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardCustomerInfo}>
                    <Text style={styles.cardCustomerName}>{item.name}</Text>
                    <Text style={styles.cardCustomerSub}>
                      📍 {item.city || 'Site Location'} {item.consumerNumber ? `| No: ${item.consumerNumber}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, item.isDraft ? styles.statusBadgeDraft : isWon ? styles.statusBadgeWon : styles.statusBadgeActive]}>
                    <Text style={[styles.statusBadgeText, item.isDraft ? styles.statusBadgeTextDraft : isWon ? styles.statusBadgeTextWon : styles.statusBadgeTextActive]}>
                      {item.isDraft ? 'OFFLINE DRAFT' : item.status || 'NEW'}
                    </Text>
                  </View>
                </View>

                {/* SIZING & COMMERCIAL HIGHLIGHTS */}
                <View style={styles.metricGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Plant Size</Text>
                    <Text style={styles.metricValueBold}>{cap} kWp</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Total Value</Text>
                    <Text style={styles.metricValue}>₹{gross.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>PM Subsidy</Text>
                    <Text style={styles.metricValueGreen}>-₹{subsidy.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Customer Cost</Text>
                    <Text style={styles.metricValueBlue}>₹{net.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* COMMERCIAL BILLING & REALIZED CASHFLOW HUB */}
                <View style={styles.commercialBillingBox}>
                  <View style={styles.commercialHeaderRow}>
                    <View style={styles.commercialTitleGroup}>
                      <View style={styles.commercialIconCircle}>
                        <Receipt size={13} color="#059669" />
                      </View>
                      <View>
                        <Text style={styles.commercialTitle}>COMMERCIAL BILLING & CASHFLOW</Text>
                        <Text style={styles.commercialSub}>
                          {hasInvoices
                            ? `${uniqueInvoices.length} document(s) • ${billedOfDealPct}% of contract invoiced`
                            : 'No commercial invoice issued yet'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.commercialStatusBadge, statusBadgeStyle]}>
                      <Text style={[styles.commercialStatusText, statusTextStyle]}>{statusLabel}</Text>
                    </View>
                  </View>

                  {/* REALIZED CASHFLOW PROGRESS BAR */}
                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${hasInvoices ? realizedPct : 0}%`,
                            backgroundColor: totalDue === 0 && totalPaid > 0 ? '#10b981' : '#0284c7',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* 3-COLUMN METRICS GRID */}
                  <View style={styles.commercialMetricsRow}>
                    <View style={styles.commercialMetricCol}>
                      <Text style={styles.commercialMetricLabel}>Invoiced</Text>
                      <Text style={styles.commercialMetricVal}>₹{totalBilled.toLocaleString('en-IN')}</Text>
                      <Text style={styles.commercialMetricHint}>
                        {hasInvoices ? `${billedOfDealPct}% of deal` : 'Ready to Bill'}
                      </Text>
                    </View>
                    <View style={[styles.commercialMetricCol, styles.commercialMetricColBorder]}>
                      <Text style={styles.commercialMetricLabel}>Received</Text>
                      <Text style={[styles.commercialMetricVal, { color: '#059669' }]}>
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.commercialMetricHint}>
                        {hasInvoices ? `${realizedPct}% realized` : '₹0 collected'}
                      </Text>
                    </View>
                    <View style={styles.commercialMetricCol}>
                      <Text style={styles.commercialMetricLabel}>Balance Due</Text>
                      <Text
                        style={[
                          styles.commercialMetricVal,
                          { color: totalDue > 0 ? '#d97706' : '#64748b' },
                        ]}
                      >
                        ₹{totalDue.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.commercialMetricHint}>
                        {totalDue > 0 ? 'Pending' : 'All clear'}
                      </Text>
                    </View>
                  </View>

                  {/* COMMERCIAL ACTIONS: QUICK INVOICE, PDF, LEDGER */}
                  <View style={styles.commercialActionsRow}>
                    <TouchableOpacity
                      style={styles.quickInvoiceBtn}
                      onPress={() => handleOpenCreateInvoiceForLead(item)}
                      activeOpacity={0.85}
                    >
                      <Plus size={13} color="#ffffff" />
                      <Text style={styles.quickInvoiceBtnText}>+ Quick Invoice</Text>
                    </TouchableOpacity>

                    {hasInvoices && (
                      <TouchableOpacity
                        style={styles.viewPdfInvoiceBtn}
                        onPress={() => handleOpenPdfInvoiceForLead(item)}
                        activeOpacity={0.8}
                      >
                        <FileText size={13} color="#2563eb" />
                        <Text style={styles.viewPdfInvoiceBtnText}>📄 PDF</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.leadFinanceLinkBtn}
                      onPress={() => handleNavigateToFinanceForLead(item)}
                      activeOpacity={0.8}
                    >
                      <CreditCard size={13} color="#059669" />
                      <Text style={styles.leadFinanceLinkBtnText}>💳 Ledger</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CONTEXTUAL ACTION ROW */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handlePhoneCall(item.mobile || item.phone)}
                    activeOpacity={0.7}
                  >
                    <Phone size={15} color="#0284c7" strokeWidth={2.3} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconActionBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                    onPress={() => handleWhatsAppPitch(item)}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={15} color="#059669" strokeWidth={2.3} />
                  </TouchableOpacity>

                  {isWon ? (
                    <TouchableOpacity
                      style={styles.discomCtaBtn}
                      onPress={() => handleOpenDiscomDocs(item)}
                      activeOpacity={0.8}
                    >
                      <Building size={15} color="#d97706" />
                      <Text style={styles.discomCtaText}>Generate Official DISCOM Docs</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.quoteCtaBtn}
                        onPress={() => handleOpenQuoteBuilder(item)}
                        activeOpacity={0.8}
                      >
                        <FileText size={15} color="#2563eb" />
                        <Text style={styles.quoteCtaText}>Custom Quote</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.onboardCtaBtn}
                        onPress={() => handleProceedToOnboarding(item, { capacityKw: cap, grossTotal: gross, subsidy, netCustomerCost: net })}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={15} color="#ffffff" />
                        <Text style={styles.onboardCtaText}>Onboard</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
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
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  pulseItem: {
    flex: 1,
    alignItems: 'center',
  },
  pulseNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  pulseUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  pulseNumGold: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fbbf24',
  },
  pulseUnitGold: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  pulseNumGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4ade80',
  },
  pulseLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  pulseDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  stageTabsContainer: {
    marginBottom: 4,
  },
  stageTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
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
    paddingBottom: 40,
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
});
