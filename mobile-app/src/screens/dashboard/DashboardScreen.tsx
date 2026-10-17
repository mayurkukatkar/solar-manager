import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  FileText,
  UserPlus,
  MapPin,
  Landmark,
  Briefcase,
  Users,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Info,
  X,
  Zap,
  Package,
  ShieldCheck,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi, crmApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { DashboardData, Project } from '../../types';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalLeads: 0,
    totalCustomers: 0,
    totalProjects: 0,
    pendingInvoices: 0,
    openTickets: 0,
    totalRevenue: 0,
    outstanding: 0,
  });
  const [leadMetrics, setLeadMetrics] = useState({
    newLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    conversionRate: '0%',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, prjRes, leadMetRes] = await Promise.all([
        tenantApi.getDashboard().catch(() => null),
        tenantApi.getProjects().catch(() => null),
        crmApi.getLeadMetrics().catch(() => null),
      ]);

      if (dashRes) {
        setData({
          totalLeads: dashRes.totalLeads || 0,
          totalCustomers: dashRes.totalCustomers || 0,
          totalProjects: dashRes.totalProjects || 0,
          pendingInvoices: dashRes.pendingInvoices || 0,
          openTickets: dashRes.openTickets || 0,
          totalRevenue: dashRes.totalRevenue || 0,
          outstanding: dashRes.outstanding || 0,
        });
      }

      if (leadMetRes?.dashboard) {
        setLeadMetrics({
          newLeads: leadMetRes.dashboard.newLeads || 0,
          qualifiedLeads: leadMetRes.dashboard.qualifiedLeads || 0,
          wonLeads: leadMetRes.dashboard.wonLeads || 0,
          conversionRate: `${leadMetRes.dashboard.conversionRate || 0}%`,
        });
      }

      if (prjRes && Array.isArray(prjRes.projects)) {
        setProjects(prjRes.projects);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const PIPELINE_STAGES = [
    {
      id: '1',
      title: 'Lead CRM',
      subtitle: 'Inquiry & Sizing',
      route: 'Leads',
      params: { stage: 'NEW' },
      badge: `${data.totalLeads} Leads`,
      icon: Users,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
    },
    {
      id: '2',
      title: 'Site Survey',
      subtitle: 'Roof Evaluation',
      route: 'Modules',
      params: { screen: 'SURVEYS' },
      badge: 'Feasibility',
      icon: MapPin,
      iconColor: '#0284c7',
      bgColor: '#f0f9ff',
    },
    {
      id: '3',
      title: '60s Quote',
      subtitle: 'Proposal & BOM',
      route: 'Modules',
      params: { screen: 'QUOTES', openQuote: true },
      badge: 'Turnkey',
      icon: FileText,
      iconColor: '#d97706',
      bgColor: '#fffbeb',
    },
    {
      id: '4',
      title: 'Project',
      subtitle: 'Contract & Exec',
      route: 'Projects',
      params: { stage: 'ALL' },
      badge: `${data.totalProjects} Active`,
      icon: Briefcase,
      iconColor: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      id: '5',
      title: 'Field QA',
      subtitle: 'Mounting & DCR',
      route: 'Operations',
      params: {},
      badge: 'Inspection',
      icon: ShieldCheck,
      iconColor: '#7c3aed',
      bgColor: '#f5f3ff',
    },
    {
      id: '6',
      title: 'PM Subsidy',
      subtitle: 'National Portal',
      route: 'Modules',
      params: { screen: 'SUBSIDY' },
      badge: '₹78k DBT',
      icon: Landmark,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Overview"
        subtitle="Solar business operations & project pipeline"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HERO REVENUE CARD */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueTopRow}>
            <Text style={styles.revenueLabel}>TOTAL REVENUE COLLECTED</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Audited</Text>
            </View>
          </View>

          <Text style={styles.revenueValue}>
            ₹{(data.totalRevenue || 0).toLocaleString('en-IN')}
          </Text>

          <View style={styles.revenueFooter}>
            <View style={styles.revSubItem}>
              <Text style={styles.revSubLabel}>Outstanding</Text>
              <Text style={styles.revSubVal}>
                ₹{(data.outstanding || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.revDivider} />
            <View style={styles.revSubItem}>
              <Text style={styles.revSubLabel}>Win Rate</Text>
              <Text style={[styles.revSubVal, { color: '#34d399' }]}>
                {leadMetrics.conversionRate}
              </Text>
            </View>
            <View style={styles.revDivider} />
            <View style={styles.revSubItem}>
              <Text style={styles.revSubLabel}>Open Tickets</Text>
              <Text style={styles.revSubVal}>{data.openTickets}</Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS 2X2 GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('Modules', { screen: 'QUOTES', openQuote: true })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ecfdf5' }]}>
              <FileText size={20} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>60s Proposal</Text>
            <Text style={styles.actionDesc}>Generate Solar Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('Leads', { openAdd: true })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
              <UserPlus size={20} color="#2563eb" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>Add Lead</Text>
            <Text style={styles.actionDesc}>Capture New Prospect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fffbeb' }]}>
              <MapPin size={20} color="#d97706" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>Site Survey</Text>
            <Text style={styles.actionDesc}>Schedule Evaluation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#f5f3ff' }]}>
              <Landmark size={20} color="#7c3aed" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>PM Subsidy</Text>
            <Text style={styles.actionDesc}>National Portal Track</Text>
          </TouchableOpacity>
        </View>

        {/* WORKFLOW PIPELINE TRACK */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SOLAR EPC PIPELINE</Text>
          <TouchableOpacity
            onPress={() => setGuideVisible(true)}
            style={styles.guideLink}
            activeOpacity={0.7}
          >
            <Info size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.guideLinkText}>Guide</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScroll}
        >
          {PIPELINE_STAGES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.pipelineCard}
                onPress={() => navigation.navigate(s.route, s.params)}
                activeOpacity={0.8}
              >
                <View style={styles.pipelineCardHeader}>
                  <View style={[styles.pipelineIconBox, { backgroundColor: s.bgColor }]}>
                    <Icon size={18} color={s.iconColor} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.pipelineStepNum}>{`0${idx + 1}`}</Text>
                </View>
                <Text style={styles.pipelineCardTitle}>{s.title}</Text>
                <Text style={styles.pipelineCardSub}>{s.subtitle}</Text>
                <View style={[styles.pipelineBadge, { backgroundColor: s.bgColor }]}>
                  <Text style={[styles.pipelineBadgeText, { color: s.iconColor }]}>
                    {s.badge}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* OPERATIONAL RADAR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>KEY METRICS</Text>
        </View>

        <View style={styles.metricsRow}>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Leads')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardTop}>
              <Users size={18} color="#059669" />
              <ChevronRight size={16} color="#94a3b8" />
            </View>
            <Text style={styles.metricNumber}>{data.totalLeads}</Text>
            <Text style={styles.metricLabel}>Total Inquiries</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Projects')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardTop}>
              <Briefcase size={18} color="#2563eb" />
              <ChevronRight size={16} color="#94a3b8" />
            </View>
            <Text style={styles.metricNumber}>{data.totalProjects}</Text>
            <Text style={styles.metricLabel}>Active Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Modules', { screen: 'FINANCE' })}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardTop}>
              <CreditCard size={18} color="#d97706" />
              <ChevronRight size={16} color="#94a3b8" />
            </View>
            <Text style={styles.metricNumber}>{data.pendingInvoices}</Text>
            <Text style={styles.metricLabel}>Due Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT PROJECTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>ACTIVE PROJECTS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
            <Text style={styles.seeAllText}>View All ({projects.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
        ) : projects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={28} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Active Projects</Text>
            <Text style={styles.emptyText}>
              Convert won leads from CRM to automatically provision solar execution projects.
            </Text>
          </View>
        ) : (
          projects.slice(0, 3).map((prj) => (
            <TouchableOpacity
              key={prj.id}
              style={styles.projectCard}
              onPress={() => navigation.navigate('Projects')}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>{prj.name}</Text>
                <Text style={styles.projectCustomer}>
                  {prj.customer?.name || 'Customer'}{' '}
                  {prj.capacity ? `• ${prj.capacity} kWp` : ''}
                </Text>
              </View>
              <View style={styles.projectStagePill}>
                <Text style={styles.projectStageText}>{prj.currentStage || 'Planning'}</Text>
              </View>
              <ChevronRight size={16} color="#cbd5e1" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* WORKFLOW BLUEPRINT MODAL */}
      <Modal visible={guideVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.guideContainer}>
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>Solar EPC Workflow Blueprint</Text>
              <TouchableOpacity onPress={() => setGuideVisible(false)} style={styles.closeBtn}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {PIPELINE_STAGES.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <View key={s.id} style={styles.guideStepRow}>
                    <View style={[styles.guideStepBadge, { backgroundColor: s.bgColor }]}>
                      <Icon size={16} color={s.iconColor} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guideStepTitle}>
                        {`0${idx + 1}. ${s.title}`}
                      </Text>
                      <Text style={styles.guideStepText}>
                        {s.id === '1' && 'Capture prospective customer, electricity bill consumption & sanctioned load.'}
                        {s.id === '2' && 'Conduct shadow analysis, roof measurements (RCC/Tin/Elevated) & structural review.'}
                        {s.id === '3' && 'Calculate system sizing, Tier-1 Mono PERC BOM & PM Surya Ghar ₹78,000 CFA.'}
                        {s.id === '4' && 'Sign client agreement, issue advance milestone bill & create project workspace.'}
                        {s.id === '5' && 'Inspect mounting, wiring, earthing pits, scan DCR barcodes & capture 5 geo-photos.'}
                        {s.id === '6' && 'Sanction subsidy voucher & release DBT direct benefit into consumer Aadhaar account.'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  revenueCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  revenueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginRight: 5,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  revenueValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginVertical: 10,
  },
  revenueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  revSubItem: {
    flex: 1,
  },
  revSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  revSubVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  revDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
    alignSelf: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTile: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  pipelineScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  pipelineCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  pipelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pipelineIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineStepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  pipelineCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  pipelineCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  pipelineBadge: {
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pipelineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  projectCustomer: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  projectStagePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  projectStageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  guideContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  guideStepRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  guideStepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guideStepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  guideStepText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 18,
  },
});
