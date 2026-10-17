import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { tenantApi } from '../../api/endpoints';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, prjRes] = await Promise.all([
        tenantApi.getDashboard().catch(() => null),
        tenantApi.getProjects().catch(() => null),
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
        {/* PIPELINE FUNNEL */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>ACTIVE PIPELINE</Text>
          <View style={styles.funnelGrid}>
            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#10b981' }]}
              onPress={() => navigation.navigate('Leads')}
              activeOpacity={0.8}
            >
              <View style={styles.funnelIconBox}>
                <Text style={{ fontSize: 18 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.totalLeads}</Text>
                <Text style={styles.funnelLabel}>New Leads</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#3b82f6' }]}
              onPress={() => navigation.navigate('Leads')}
              activeOpacity={0.8}
            >
              <View style={[styles.funnelIconBox, { backgroundColor: '#eff6ff' }]}>
                <Text style={{ fontSize: 18 }}>👥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.totalCustomers}</Text>
                <Text style={styles.funnelLabel}>Qualified Clients</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#f59e0b' }]}
              onPress={() => navigation.navigate('Projects')}
              activeOpacity={0.8}
            >
              <View style={[styles.funnelIconBox, { backgroundColor: '#fffbeb' }]}>
                <Text style={{ fontSize: 18 }}>📁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.totalProjects}</Text>
                <Text style={styles.funnelLabel}>Active Projects</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelCard, { borderLeftColor: '#6366f1' }]}
              onPress={() => navigation.navigate('Modules', { screen: 'Finance' })}
              activeOpacity={0.8}
            >
              <View style={[styles.funnelIconBox, { backgroundColor: '#eef2ff' }]}>
                <Text style={{ fontSize: 18 }}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.funnelCount}>{data.pendingInvoices}</Text>
                <Text style={styles.funnelLabel}>Pending Invoices</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FINANCIAL REVENUE CARD */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueTitle}>TOTAL REVENUE (BOOKED)</Text>
            <View style={styles.revenueBadge}>
              <Text style={styles.revenueBadgeText}>Settled</Text>
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
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statLabel}>OPEN TICKETS</Text>
              <Text style={styles.statValGreen}>
                {data.openTickets || 0} Tickets
              </Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Leads', { openAdd: true })}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#ecfdf5' }]}>
                <Text style={{ fontSize: 20 }}>+👤</Text>
              </View>
              <Text style={styles.actionBtnLabel}>Add Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Modules', { openQuote: true })}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#eff6ff' }]}>
                <Text style={{ fontSize: 20 }}>⚡</Text>
              </View>
              <Text style={styles.actionBtnLabel}>60s Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Operations')}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#fef3c7' }]}>
                <Text style={{ fontSize: 20 }}>🚚</Text>
              </View>
              <Text style={styles.actionBtnLabel}>Field QA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Modules')}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#f3e8ff' }]}>
                <Text style={{ fontSize: 20 }}>📑</Text>
              </View>
              <Text style={styles.actionBtnLabel}>All Modules</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LIVE PROJECTS PIPELINE HIGHLIGHTS */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeaderTitle}>RECENT PROJECTS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.seeAllText}>View All ({projects.length}) →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyTitle}>No Active Projects</Text>
              <Text style={styles.emptyText}>
                Qualified leads converted to won will appear here automatically.
              </Text>
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
  section: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  funnelGrid: {
    gap: 8,
  },
  funnelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 14,
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
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
  revenueCard: {
    backgroundColor: colors.slate900,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
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
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate700,
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
    borderRadius: 14,
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
  },
});
