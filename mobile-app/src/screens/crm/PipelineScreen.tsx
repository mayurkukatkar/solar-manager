import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { crmApi } from '../../api/endpoints';
import { LeadCaptureModal } from './LeadCaptureModal';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import { CustomerOnboardingModal } from './CustomerOnboardingModal';
import { DiscomDocsModal } from '../projects/DiscomDocsModal';
import { colors } from '../../theme/colors';

const STAGES = [
  { id: 'ALL', label: 'All' },
  { id: 'LEADS', label: '1. Leads' },
  { id: 'QUOTES', label: '2. Quotes' },
  { id: 'ONBOARDING', label: '3. Onboard' },
  { id: 'PROJECTS', label: '4. Projects' },
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

  // Active Context for Modals
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [activeQuotationData, setActiveQuotationData] = useState<any | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await crmApi.getLeads({ all: true }).catch(() => null);
      if (res && Array.isArray(res.leads)) {
        setLeads(res.leads);
      }
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
    setLeads((prev) => [newLead, ...prev]);
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
    // Optionally ask if rep wants to generate DISCOM docs immediately
    Alert.alert(
      'Project Initialized',
      'Customer onboarded to active project. Would you like to generate statutory DISCOM forms now?',
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
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Field Sales Pipeline</Text>
          <Text style={styles.headerSubtitle}>
            End-to-End Customer Lifecycle: Lead ➔ Quote ➔ Client ➔ DISCOM
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newLeadBtn}
          onPress={handleOpenLeadCapture}
          activeOpacity={0.85}
        >
          <Camera size={16} color="#ffffff" />
          <Text style={styles.newLeadBtnText}>Scan Bill</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer, mobile, city..."
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
            <Text style={styles.loadingText}>Loading Field Pipeline...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Layers size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>
              Capture a new lead or scan a physical electricity bill to start the lifecycle pipeline.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={handleOpenLeadCapture}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.emptyActionText}>Capture New Lead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => {
            const cap = item.estimatedCap || 3.3;
            const gross = item.estimatedValue || Math.round(cap * 56000);
            const subsidy = cap >= 3 ? 78000 : cap >= 2 ? 60000 : 30000;
            const net = Math.max(0, gross - subsidy);
            const isWon = item.status === 'WON';

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
                  <View style={[styles.statusBadge, isWon ? styles.statusBadgeWon : styles.statusBadgeActive]}>
                    <Text style={[styles.statusBadgeText, isWon ? styles.statusBadgeTextWon : styles.statusBadgeTextActive]}>
                      {item.status || 'NEW'}
                    </Text>
                  </View>
                </View>

                {/* SIZING & COMMERCIAL HIGHLIGHTS */}
                <View style={styles.metricGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Capacity</Text>
                    <Text style={styles.metricValueBold}>{cap} kWp</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Total Cost</Text>
                    <Text style={styles.metricValue}>₹{gross.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Govt Subsidy</Text>
                    <Text style={styles.metricValueGreen}>-₹{subsidy.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Net Cost</Text>
                    <Text style={styles.metricValueBlue}>₹{net.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* CARD ACTIONS */}
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
                      <Text style={styles.discomCtaText}>DISCOM Docs</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.quoteCtaBtn}
                        onPress={() => handleOpenQuoteBuilder(item)}
                        activeOpacity={0.8}
                      >
                        <FileText size={15} color="#2563eb" />
                        <Text style={styles.quoteCtaText}>Create Quote</Text>
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
          visible={quoteModalVisible}
          lead={selectedLead}
          onClose={() => setQuoteModalVisible(false)}
          onProceedToOnboarding={handleProceedToOnboarding}
        />
      )}

      {selectedLead && (
        <CustomerOnboardingModal
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
  newLeadBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  newLeadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
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
    marginBottom: 6,
  },
  stageTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
});
