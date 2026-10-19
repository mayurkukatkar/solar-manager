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
import { crmApi, financeApi } from '../../api/endpoints';
import { offlineSyncService } from '../../services/offlineSyncService';
import { LeadCaptureModal } from './LeadCaptureModal';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import { CustomerOnboardingModal } from './CustomerOnboardingModal';
import { DiscomDocsModal } from '../projects/DiscomDocsModal';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
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

  // PDF Invoice Modal & Milestone Gen State
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<any | null>(null);
  const [generatingMilestonesLeadId, setGeneratingMilestonesLeadId] = useState<string | null>(null);

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
        'Generate 4-Stage Invoices?',
        `No milestone invoices generated yet for ${lead.name}.\n\nWould you like to generate the standard 20/60/15/5 milestone billing cycle now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate & Preview',
            onPress: () => handleGenerateMilestonesForLead(lead, true),
          },
        ]
      );
    }
  };

  const handleGenerateMilestonesForLead = async (lead: any, openPdfAfter = false) => {
    setGeneratingMilestonesLeadId(lead.id);
    try {
      const cap = lead.estimatedCap || 3.3;
      const totalAmount = lead.estimatedValue || Math.round(cap * 56000);
      const invoices = await financeApi.createMilestoneInvoicesForProject({
        leadId: lead.id,
        customerId: lead.customerId || lead.customer?.id,
        projectId: lead.projects?.[0]?.id,
        totalAmount,
        capacityKw: cap,
        customerName: lead.name,
      });

      Alert.alert(
        'Milestone Invoices Generated! 🎉',
        `Standard 4-stage billing schedule created for ${lead.name}:\n• Stage 1 (20% Advance Token)\n• Stage 2 (60% Material Delivery)\n• Stage 3 (15% Installation)\n• Stage 4 (5% Commissioning/DBT)`
      );

      fetchLeads();

      if (openPdfAfter && Array.isArray(invoices) && invoices.length > 0) {
        setSelectedInvoiceForPdf({
          ...invoices[0],
          customer: invoices[0].customer || lead.customer || {
            name: lead.name,
            mobile: lead.mobile,
            address: lead.address,
            city: lead.city,
            consumerNumber: lead.consumerNumber,
          },
        });
        setPdfModalVisible(true);
      }
    } catch (err: any) {
      Alert.alert(
        'Generation Failed',
        err.response?.data?.error || err.message || 'Could not generate milestone invoices.'
      );
    } finally {
      setGeneratingMilestonesLeadId(null);
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
      {/* VENDOR BRANDED HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Solar Field Command</Text>
          <Text style={styles.headerSubtitle}>
            Vendor Sales Pipeline & PM Surya Ghar Sizing
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.financeHeaderBtn}
            onPress={() => navigation?.navigate('Finance')}
            activeOpacity={0.85}
          >
            <Receipt size={15} color="#059669" strokeWidth={2.5} />
            <Text style={styles.financeHeaderBtnText}>Finance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addLeadHeaderBtn}
            onPress={handleOpenLeadCapture}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#ffffff" strokeWidth={2.8} />
            <Text style={styles.addLeadHeaderBtnText}>New Lead</Text>
          </TouchableOpacity>
        </View>
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

            // Live linked milestone invoices
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

            const findStageStatus = (stageNum: number, keyMatch: string) => {
              const inv = uniqueInvoices.find((i: any) => {
                const m = (i.milestone || i.milestoneTitle || '').toUpperCase();
                return m.includes(keyMatch) || m.includes(`STAGE ${stageNum}`);
              });
              if (!inv) return 'PENDING';
              const p = (inv.payments || []).reduce((s: number, pm: any) => s + (pm.amount || 0), 0);
              return (inv.status === 'PAID' || p >= inv.amount) ? 'PAID' : 'BILLED';
            };

            const s1Status = findStageStatus(1, 'ADVANCE');
            const s2Status = findStageStatus(2, 'MATERIAL');
            const s3Status = findStageStatus(3, 'INSTALL');
            const s4Status = findStageStatus(4, 'COMMISSION');

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

                {/* 4-STAGE MILESTONE BILLING PIPELINE TRACKER */}
                <View style={styles.milestoneSection}>
                  <View style={styles.milestoneSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Receipt size={13} color="#059669" />
                      <Text style={styles.milestoneSectionTitle}>EPC MILESTONES (20/60/15/5)</Text>
                    </View>
                    {hasInvoices ? (
                      <Text style={styles.milestoneSectionSummary}>
                        Paid: <Text style={{ color: '#059669', fontWeight: '800' }}>₹{totalPaid.toLocaleString('en-IN')}</Text> / ₹{totalBilled.toLocaleString('en-IN')}
                      </Text>
                    ) : (
                      <Text style={styles.milestoneSectionSummaryPending}>Schedule Not Generated</Text>
                    )}
                  </View>

                  {/* 4 MINI PILLS */}
                  <View style={styles.milestonePillsRow}>
                    {[
                      { label: 'S1: 20% Token', status: s1Status },
                      { label: 'S2: 60% Mat.', status: s2Status },
                      { label: 'S3: 15% Inst.', status: s3Status },
                      { label: 'S4: 5% DBT', status: s4Status },
                    ].map((step, sIdx) => {
                      const isStepPaid = step.status === 'PAID';
                      const isStepBilled = step.status === 'BILLED';
                      return (
                        <View
                          key={sIdx}
                          style={[
                            styles.milestoneMiniPill,
                            isStepPaid && styles.milestoneMiniPillPaid,
                            isStepBilled && styles.milestoneMiniPillBilled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.milestoneMiniPillText,
                              isStepPaid && styles.milestoneMiniPillTextPaid,
                              isStepBilled && styles.milestoneMiniPillTextBilled,
                            ]}
                          >
                            {isStepPaid ? '✓ ' : isStepBilled ? '⏳ ' : '○ '}{step.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* DEDICATED FINANCE & PDF INVOICE ACTIONS */}
                <View style={styles.financeQuickActionsRow}>
                  {hasInvoices ? (
                    <>
                      <TouchableOpacity
                        style={styles.viewPdfInvoiceBtn}
                        onPress={() => handleOpenPdfInvoiceForLead(item)}
                        activeOpacity={0.8}
                      >
                        <FileText size={13} color="#2563eb" />
                        <Text style={styles.viewPdfInvoiceBtnText}>📄 PDF Invoice</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.leadFinanceLinkBtn}
                        onPress={() => handleNavigateToFinanceForLead(item)}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={13} color="#059669" />
                        <Text style={styles.leadFinanceLinkBtnText}>
                          💳 Billing & Ledger {totalDue > 0 ? `(₹${(totalDue / 1000).toFixed(0)}k Due)` : '✓'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.generateMilestonesBtn}
                      onPress={() => handleGenerateMilestonesForLead(item, false)}
                      disabled={generatingMilestonesLeadId === item.id}
                      activeOpacity={0.85}
                    >
                      {generatingMilestonesLeadId === item.id ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <>
                          <Sparkles size={14} color="#059669" />
                          <Text style={styles.generateMilestonesBtnText}>
                            ⚡ Generate 4-Stage Invoices (20/60/15/5)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* CONTEXTUAL ACTION ROW */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handlePhoneCall(item.mobile || item.phone)}
                    activeOpacity={0.7}
                  >
                    <Phone size={16} color="#0284c7" />
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
  milestoneSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 10,
  },
  milestoneSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.3,
  },
  milestoneSectionSummary: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  milestoneSectionSummaryPending: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  milestonePillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  milestoneMiniPill: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  milestoneMiniPillPaid: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  milestoneMiniPillBilled: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  milestoneMiniPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  milestoneMiniPillTextPaid: {
    color: '#059669',
  },
  milestoneMiniPillTextBilled: {
    color: '#2563eb',
  },
  financeQuickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  viewPdfInvoiceBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  viewPdfInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },
  leadFinanceLinkBtn: {
    flex: 1.2,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  leadFinanceLinkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  generateMilestonesBtn: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  generateMilestonesBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
});
