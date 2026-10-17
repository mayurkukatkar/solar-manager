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
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
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
  const [pipelineModalVisible, setPipelineModalVisible] = useState(false);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const PIPELINE_STEPS = [
    {
      num: '01',
      title: 'Lead CRM',
      desc: 'Inquiry & Bill',
      icon: '🎯',
      route: 'Leads',
      params: { stage: 'NEW' },
      badge: `${data.totalLeads} Leads`,
      color: '#10b981',
    },
    {
      num: '02',
      title: 'Site Survey',
      desc: 'Roof & Shadow',
      icon: '📐',
      route: 'Modules',
      params: { screen: 'SURVEYS' },
      badge: 'Evaluation',
      color: '#06b6d4',
    },
    {
      num: '03',
      title: '60s Proposal',
      desc: 'Sizing & CFA',
      icon: '⚡',
      route: 'Modules',
      params: { screen: 'QUOTES', openQuote: true },
      badge: 'Turnkey BOM',
      color: '#f59e0b',
    },
    {
      num: '04',
      title: 'Contract',
      desc: 'Convert & Sign',
      icon: '🤝',
      route: 'Projects',
      params: { stage: 'ALL' },
      badge: `${data.totalProjects} Projects`,
      color: '#3b82f6',
    },
    {
      num: '05',
      title: 'Procurement',
      desc: 'Panels & BOS',
      icon: '📦',
      route: 'Modules',
      params: { screen: 'PROCUREMENT' },
      badge: 'Dispatch',
      color: '#8b5cf6',
    },
    {
      num: '06',
      title: 'Field QA',
      desc: 'Install & Barcodes',
      icon: '🛠️',
      route: 'Operations',
      params: {},
      badge: 'Geo-Photos',
      color: '#ec4899',
    },
    {
      num: '07',
      title: 'DISCOM',
      desc: 'Net-Metering Sync',
      icon: '🔌',
      route: 'Modules',
      params: { screen: 'DISCOM' },
      badge: 'Grid Testing',
      color: '#14b8a6',
    },
    {
      num: '08',
      title: 'PM Subsidy',
      desc: 'DBT Release',
      icon: '🏛️',
      route: 'Modules',
      params: { screen: 'SUBSIDY' },
      badge: '₹78k Release',
      color: '#059669',
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={`${getGreeting()}, ${user?.name ? user.name.split(' ')[0] : 'Partner'}`}
        subtitle="Solar business pipeline & operational telemetry"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* INTERACTIVE WORKFLOW PIPELINE BANNER */}
        <View style={styles.workflowSection}>
          <View style={styles.workflowHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>SOLAR EPC LIFECYCLE PIPELINE</Text>
              <Text style={styles.pipelineSub}>8-Stage Delivery Pipeline • Tap any stage to launch</Text>
            </View>
            <TouchableOpacity
              onPress={() => setPipelineModalVisible(true)}
              style={styles.guideBadge}
              activeOpacity={0.8}
            >
              <Text style={styles.guideBadgeText}>Workflow Guide ⓘ</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pipelineScroll}
          >
            {PIPELINE_STEPS.map((step, idx) => (
              <React.Fragment key={step.num}>
                <TouchableOpacity
                  style={[styles.pipelineCard, { borderTopColor: step.color }]}
                  onPress={() => navigation.navigate(step.route, step.params)}
                  activeOpacity={0.85}
                >
                  <View style={styles.pipelineTopRow}>
                    <Text style={[styles.stepNumText, { color: step.color }]}>{step.num}</Text>
                    <View style={styles.pipelineIconBox}>
                      <Text style={styles.pipelineIcon}>{step.icon}</Text>
                    </View>
                  </View>
                  <Text style={styles.pipelineStepTitle}>{step.title}</Text>
                  <Text style={styles.pipelineDescText}>{step.desc}</Text>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineBadgeText}>{step.badge}</Text>
                  </View>
                </TouchableOpacity>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <View style={styles.pipelineConnector}>
                    <Text style={styles.connectorArrow}>→</Text>
                  </View>
                )}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>

        {/* QUICK 1-TAP SPEED DIAL ACTION BAR */}
        <View style={styles.speedDialSection}>
          <Text style={styles.speedDialTitle}>QUICK ACTIONS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.speedDialScroll}
          >
            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Leads', { openAdd: true })}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Text style={{ fontSize: 18 }}>+👤</Text>
              </View>
              <Text style={styles.speedDialLabel}>Add Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Modules', { screen: 'QUOTES', openQuote: true })}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#fffbeb' }]}>
                <Text style={{ fontSize: 18 }}>⚡</Text>
              </View>
              <Text style={styles.speedDialLabel}>60s Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#eff6ff' }]}>
                <Text style={{ fontSize: 18 }}>📐</Text>
              </View>
              <Text style={styles.speedDialLabel}>Site Survey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Text style={{ fontSize: 18 }}>🏛️</Text>
              </View>
              <Text style={styles.speedDialLabel}>PM Subsidy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Modules', { screen: 'DISCOM' })}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#f0fdfa' }]}>
                <Text style={{ fontSize: 18 }}>🔌</Text>
              </View>
              <Text style={styles.speedDialLabel}>DISCOM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Modules', { screen: 'FINANCING' })}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#f5f3ff' }]}>
                <Text style={{ fontSize: 18 }}>🧮</Text>
              </View>
              <Text style={styles.speedDialLabel}>EMI Loans</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialBtn}
              onPress={() => navigation.navigate('Operations')}
              activeOpacity={0.8}
            >
              <View style={[styles.speedDialIconCircle, { backgroundColor: '#fdf2f8' }]}>
                <Text style={{ fontSize: 18 }}>📸</Text>
              </View>
              <Text style={styles.speedDialLabel}>Field QA</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* FINANCIAL REVENUE OVERVIEW CARD */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View>
              <Text style={styles.revenueTitle}>SETTLED REVENUE (YTD)</Text>
              <Text style={styles.revenueSubtitle}>Audited solar project collections</Text>
            </View>
            <View style={styles.revenueBadge}>
              <Text style={styles.revenueBadgeText}>● Live Audited</Text>
            </View>
          </View>

          <Text style={styles.revenueAmount}>
            ₹{(data.totalRevenue || 0).toLocaleString('en-IN')}
          </Text>

          <View style={styles.financialStatsRow}>
            <View>
              <Text style={styles.statLabel}>OUTSTANDING DUES</Text>
              <Text style={styles.statValYellow}>
                ₹{(data.outstanding || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.statLabel}>WIN RATE</Text>
              <Text style={styles.statValGreen}>
                {leadMetrics.conversionRate}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statLabel}>OPEN TICKETS</Text>
              <Text style={styles.statValBlue}>
                {data.openTickets}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIVE PIPELINE METRICS GRID */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>EXECUTIVE OPERATIONAL RADAR</Text>
          <View style={styles.funnelGrid}>
            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#10b981' }]}
              onPress={() => navigation.navigate('Leads')}
              activeOpacity={0.8}
            >
              <View style={[styles.funnelIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Text style={{ fontSize: 18 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.totalLeads}</Text>
                <Text style={styles.funnelLabel}>Total CRM Inquiries ({leadMetrics.newLeads} New)</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#3b82f6' }]}
              onPress={() => navigation.navigate('Projects')}
              activeOpacity={0.8}
            >
              <View style={[styles.funnelIconBox, { backgroundColor: '#eff6ff' }]}>
                <Text style={{ fontSize: 18 }}>📁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.totalProjects}</Text>
                <Text style={styles.funnelLabel}>Active EPC Projects</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#f59e0b' }]}
              onPress={() => navigation.navigate('Modules', { screen: 'FINANCE' })}
              activeOpacity={0.8}
            >
              <View style={[styles.funnelIconBox, { backgroundColor: '#fffbeb' }]}>
                <Text style={{ fontSize: 18 }}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.pendingInvoices}</Text>
                <Text style={styles.funnelLabel}>Pending Invoices & Milestones</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RECENT PROJECTS PIPELINE HIGHLIGHTS */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeaderTitle}>ACTIVE EXECUTION PROJECTS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.seeAllText}>View All ({projects.length}) →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
          ) : projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyTitle}>No Active Projects Yet</Text>
              <Text style={styles.emptyText}>
                Qualified leads converted to Won will automatically appear here with turnkey milestones.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('Leads')}
              >
                <Text style={styles.emptyActionText}>Go to CRM Leads →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            projects.slice(0, 4).map((prj) => (
              <TouchableOpacity
                key={prj.id}
                style={styles.projectItemCard}
                onPress={() => navigation.navigate('Projects')}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName}>{prj.name}</Text>
                  <Text style={styles.projectSub}>
                    {prj.customer?.name || 'Customer'}{' '}
                    {prj.capacity ? `• ${prj.capacity} kWp` : ''}
                  </Text>
                </View>
                <View style={styles.projectStagePill}>
                  <Text style={styles.projectStageText}>{prj.currentStage || 'Planning'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* WORKFLOW PIPELINE GUIDE MODAL */}
      <Modal visible={pipelineModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.guideModalContainer}>
            <View style={styles.guideModalHeader}>
              <View>
                <Text style={styles.guideModalTitle}>Solar EPC Workflow Blueprint</Text>
                <Text style={styles.guideModalSub}>Standardized Indian Solar EPC Delivery Lifecycle</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPipelineModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 18 }}>
              {PIPELINE_STEPS.map((s) => (
                <View key={s.num} style={styles.guideRow}>
                  <View style={[styles.guideNumBadge, { backgroundColor: s.color }]}>
                    <Text style={styles.guideNumText}>{s.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideStepName}>{s.title} ({s.icon})</Text>
                    <Text style={styles.guideStepDesc}>
                      {s.num === '01' && 'Capture lead, electricity bill (kWh), consumer CA number & sanctioned load.'}
                      {s.num === '02' && 'Shadow analysis, roof structure (RCC/Tin/Elevated), cable run & orientation.'}
                      {s.num === '03' && '60-second system sizing, Tier-1 Mono PERC BOM & PM Surya Ghar ₹78,000 CFA deduction.'}
                      {s.num === '04' && 'Customer contract agreement, advance milestone invoice & project provisioning.'}
                      {s.num === '05' && 'Panels, inverters, structure, ACDB/DCDB & earthing kit dispatch tracking.'}
                      {s.num === '06' && '7-point quality checklist, DCR module serial QR scanning & 5 geo-tagged photos.'}
                      {s.num === '07' && 'DISCOM Net-metering application, inspection, bidirectional meter & grid sync.'}
                      {s.num === '08' && 'Direct Benefit Transfer (DBT) subsidy release into customer Aadhaar bank account.'}
                    </Text>
                  </View>
                </View>
              ))}
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
    padding: 16,
    paddingBottom: 40,
  },
  workflowSection: {
    marginBottom: 16,
  },
  workflowHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
  },
  pipelineSub: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 2,
  },
  guideBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  guideBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  pipelineScroll: {
    paddingVertical: 4,
    alignItems: 'center',
    gap: 8,
  },
  pipelineCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    width: 112,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  pipelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pipelineIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineIcon: {
    fontSize: 14,
  },
  pipelineStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  pipelineDescText: {
    fontSize: 9,
    color: colors.slate500,
    marginTop: 2,
    fontWeight: '500',
  },
  pipelineBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  pipelineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  pipelineConnector: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  connectorArrow: {
    fontSize: 14,
    color: colors.slate300,
    fontWeight: '900',
  },
  speedDialSection: {
    marginBottom: 18,
  },
  speedDialTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  speedDialScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  speedDialBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 76,
  },
  speedDialIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  speedDialLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate700,
  },
  revenueCard: {
    backgroundColor: colors.slate900,
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
  },
  revenueSubtitle: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 2,
  },
  revenueBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  revenueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 16,
  },
  financialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statValYellow: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fbbf24',
  },
  statValGreen: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34d399',
  },
  statValBlue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#60a5fa',
  },
  section: {
    marginBottom: 20,
  },
  funnelGrid: {
    gap: 8,
    marginTop: 8,
  },
  funnelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  funnelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  funnelCount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  funnelLabel: {
    fontSize: 11,
    color: colors.slate500,
    fontWeight: '600',
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: colors.slate400,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  projectItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  projectSub: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  projectStagePill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  projectStageText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate800,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate500,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyActionBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  guideModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  guideModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  guideModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  guideModalSub: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate600,
  },
  guideRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  guideNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guideNumText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.white,
  },
  guideStepName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  guideStepDesc: {
    fontSize: 11,
    color: colors.slate600,
    lineHeight: 16,
    marginTop: 2,
  },
});
