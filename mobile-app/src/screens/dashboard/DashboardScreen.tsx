import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import {
  Zap,
  Plus,
  Phone,
  MessageCircle,
  Briefcase,
  Users,
  ArrowRight,
  TrendingUp,
  MapPin,
  Receipt,
  Leaf,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { GuideCharacter } from '../../components/GuideCharacter';
import { InAppProductTour } from '../../components/InAppProductTour';
import { tenantApi, crmApi } from '../../api/endpoints';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { useAuth } from '../../context/AuthContext';
import { DashboardData, Project } from '../../types';
import { Skeleton, SkeletonText, SkeletonCard } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { radii, spacing, typography, tabularNums, formatInr, useTheme } from '../../theme';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Primary Operational State
  const [data, setData] = useState<DashboardData>({
    totalLeads: 0,
    totalCustomers: 0,
    totalProjects: 0,
    pendingInvoices: 0,
    openTickets: 0,
    totalRevenue: 0,
    totalCollected: 0,
    outstanding: 0,
    orderBook: 0,
    totalCapacity: 0,
    aging: { under15: 0, under30: 0, over30: 0 },
    horizonAnalytics: { monthly: [], quarterly: [], halfAnnual: [], annual: [] },
    segmentationData: [],
    leadSources: null,
    inventoryRunway: null,
    subsidyFunnel: [],
    environmental: { monthlyEnergyKWh: 0, co2Tons: 0, coalTons: 0, trees: 0 },
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spotlightVisible, setSpotlightVisible] = useState(false);

  // Role & Permission Checks
  const isTenantAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const userPerms = Array.isArray((user as any)?.permissions)
    ? (user as any).permissions
    : (user as any)?.permissions?.modules || [];
  const hasFinanceAccess = isTenantAdmin || userPerms.includes('finance') || userPerms.includes('*') || Boolean((data as any).isFinanceAuthorized);

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh && !refreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      const results = await Promise.allSettled([
        tenantApi.getDashboard(),
        tenantApi.getProjects(),
        crmApi.getLeads({ all: true }),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        setData(results[0].value);
      } else if (results[0].status === 'rejected') {
        const failureMsg = results[0].reason?.response?.data?.error || results[0].reason?.message || 'Dashboard metrics unavailable';
        setError(failureMsg);
      }

      if (results[1].status === 'fulfilled' && results[1].value && Array.isArray(results[1].value.projects)) {
        setProjects(results[1].value.projects);
      }

      if (results[2].status === 'fulfilled' && results[2].value && Array.isArray(results[2].value.leads)) {
        setRecentLeads(results[2].value.leads.slice(0, 5));
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard(true);
  };

  const handlePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => { });
  };

  const handleWhatsAppDirect = (item: any) => {
    const phone = item.mobile || item.phone;
    if (!phone) return;
    const cap = item.capacity || item.estimatedCap || 3.3;
    const gross = item.value || item.estimatedValue || Math.round(cap * 56000);
    const subsidy = cap >= 3 ? 78000 : cap >= 2 ? 60000 : 30000;
    const net = Math.max(0, gross - subsidy);
    const monthlySavings = Math.round(cap * 120 * 8.5);
    const lifetimeSavings = Math.round(cap * 1460 * 25 * 8.5 * 0.92);

    openWhatsAppWithPitch({
      customerName: item.name,
      customerPhone: phone,
      systemCapacityKw: cap,
      grossAmount: gross,
      subsidyAmount: subsidy,
      netPayable: net,
      monthlySavings,
      lifetimeSavings,
      companyName: user?.tenantName || 'WhereReady Solar OS',
      repName: user?.name || 'Solar Partner',
      repPhone: (user as any)?.phone || '',
    });
  };

  // Operational metrics
  const totalCapacityKWp = (data.totalCapacity || 0).toFixed(1);
  const totalRevenueLakhs = data.totalRevenue ? Number((data.totalRevenue / 100000).toFixed(1)) : 0;
  const totalCollectedLakhs = data.totalCollected ? Number((data.totalCollected / 100000).toFixed(1)) : 0;
  const outstandingLakhs = data.outstanding
    ? Number((data.outstanding / 100000).toFixed(1))
    : Math.max(0, Number((totalRevenueLakhs - totalCollectedLakhs).toFixed(1)));

  const collectedPct = totalRevenueLakhs > 0
    ? Math.min(100, Math.round((totalCollectedLakhs / totalRevenueLakhs) * 100))
    : 0;

  // Environmental Metrics
  const cleanEnergyMWh = data.environmental && data.environmental.monthlyEnergyKWh > 0
    ? (data.environmental.monthlyEnergyKWh / 1000).toFixed(1)
    : ((Number(totalCapacityKWp) * 120) / 1000).toFixed(1);
  const co2Tons = data.environmental && data.environmental.co2Tons > 0
    ? data.environmental.co2Tons
    : Number((Number(cleanEnergyMWh) * 1000 * 0.82 / 1000).toFixed(1));
  const treesCount = data.environmental && data.environmental.trees > 0
    ? data.environmental.trees.toLocaleString('en-IN')
    : Math.round(Number(co2Tons) * 45).toLocaleString('en-IN');

  // Priority Lead
  const urgentProspect = recentLeads[0] || null;

  // SKELETON LOADING STATE
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header variant="home" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Skeleton width={120} height={16} borderRadius={radii.sm} />
            <Skeleton width={180} height={36} borderRadius={radii.sm} style={{ marginVertical: 12 }} />
            <Skeleton width="100%" height={8} borderRadius={radii.full} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width="30%" height={28} borderRadius={radii.sm} />
              <Skeleton width="30%" height={28} borderRadius={radii.sm} />
              <Skeleton width="30%" height={28} borderRadius={radii.sm} />
            </View>
          </View>
          <View style={styles.quickActionRow}>
            <Skeleton width="23%" height={56} borderRadius={radii.lg} />
            <Skeleton width="23%" height={56} borderRadius={radii.lg} />
            <Skeleton width="23%" height={56} borderRadius={radii.lg} />
            <Skeleton width="23%" height={56} borderRadius={radii.lg} />
          </View>
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  // ERROR STATE
  if (error && !loading && !data.totalRevenue && !data.totalCapacity && recentLeads.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header variant="home" />
        <View style={styles.centeredStateContainer}>
          <EmptyState
            tone="danger"
            icon={<AlertCircle size={36} color={colors.danger} />}
            title="Operational Telemetry Offline"
            description={error}
            actionTitle="Retry Connection"
            onActionPress={() => loadDashboard()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header variant="home" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO OPERATIONAL RADAR CARD */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.liveIndicatorRow}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveLabel, { color: colors.textSecondary }]}>
                {hasFinanceAccess ? 'EXECUTIVE COMMAND' : 'FIELD OPERATIONS'}
              </Text>
            </View>
            <Text style={[styles.heroDate, { color: colors.textMuted }]}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <View style={styles.heroMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroValue, tabularNums, { color: colors.text }]}>
                {hasFinanceAccess ? `₹${totalRevenueLakhs.toFixed(1)}L` : `${totalCapacityKWp} kWp`}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {hasFinanceAccess
                  ? `${totalCapacityKWp} kWp Fleet • ₹${outstandingLakhs.toFixed(1)}L Outstanding`
                  : `${projects.length || data.totalProjects} Active Sites • ${data.totalLeads} Inbound Leads`}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.quoteButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.85}
            >
              <Zap size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.quoteButtonText}>60s Quote</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar (Collections % or Site Execution) */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabelLeft, { color: colors.textSecondary }]}>
                {hasFinanceAccess ? `Collected: ₹${totalCollectedLakhs.toFixed(1)}L (${collectedPct}%)` : `Active Sites: ${projects.length || data.totalProjects}`}
              </Text>
              <Text style={[styles.progressLabelRight, { color: colors.textMuted }]}>
                {hasFinanceAccess ? `Target: ₹${totalRevenueLakhs.toFixed(1)}L` : `Pipeline: ${data.totalLeads} Leads`}
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? colors.surfaceHighlight : '#E2E8F0' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${hasFinanceAccess ? collectedPct : Math.min(100, ((projects.length || 1) / Math.max(1, data.totalProjects || 1)) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Quick Stats Ticker */}
          <View style={[styles.heroTickerRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#F8FAFC', borderColor: colors.borderSubtle }]}>
            <View style={styles.tickerCol}>
              <Text style={[styles.tickerVal, tabularNums, { color: colors.text }]}>{data.totalLeads}</Text>
              <Text style={[styles.tickerLbl, { color: colors.textSecondary }]}>Leads</Text>
            </View>
            <View style={[styles.tickerDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.tickerCol}>
              <Text style={[styles.tickerVal, tabularNums, { color: colors.text }]}>{projects.length || data.totalProjects}</Text>
              <Text style={[styles.tickerLbl, { color: colors.textSecondary }]}>Active Sites</Text>
            </View>
            <View style={[styles.tickerDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.tickerCol}>
              <Text style={[styles.tickerVal, tabularNums, { color: colors.primary }]}>{totalCapacityKWp}</Text>
              <Text style={[styles.tickerLbl, { color: colors.textSecondary }]}>kWp Fleet</Text>
            </View>
          </View>
        </View>

        {/* SOL SPOTLIGHT TOUR BANNER */}
        <TouchableOpacity
          style={[
            styles.spotlightTourBanner,
            {
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
              borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#BFDBFE',
            },
          ]}
          onPress={() => setSpotlightVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.spotlightBannerLeft}>
            <GuideCharacter pose="guide" size={34} animated={false} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.spotlightBannerTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                  Explore Every Button
                </Text>
                <View style={styles.spotlightPill}>
                  <Text style={styles.spotlightPillText}>BUTTON TOUR</Text>
                </View>
              </View>
              <Text style={styles.spotlightBannerSub}>
                Tap Sol for an interactive walkthrough explaining every button and tool
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#2563EB" />
        </TouchableOpacity>

        {/* 2. QUICK ACTION LAUNCHER */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={() => navigation.navigate('QuickQuote')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: isDark ? 'rgba(0,102,255,0.2)' : '#EFF6FF' }]}>
              <Zap size={18} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>60s Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={() => navigation.navigate('Pipeline')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5' }]}>
              <Plus size={18} color={colors.success} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>New Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={() => navigation.navigate('Projects')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7' }]}>
              <Briefcase size={18} color={colors.warning} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={() => navigation.navigate('Finance')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : '#F3E8FF' }]}>
              <Receipt size={18} color="#7C3AED" />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Finance</Text>
          </TouchableOpacity>
        </View>

        {/* 3. IMMEDIATE ATTENTION / HOT PROSPECT */}
        {urgentProspect && (
          <View style={[styles.attentionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.attentionHeader}>
              <View style={styles.attentionBadge}>
                <View style={[styles.attentionDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.attentionBadgeText, { color: colors.warningDark }]}>NEXT ACTION</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Pipeline')}>
                <Text style={[styles.viewAllLink, { color: colors.primary }]}>View Lead →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.attentionBody}>
              <Text style={[styles.attentionName, { color: colors.text }]}>{urgentProspect.name}</Text>
              <Text style={[styles.attentionDetails, tabularNums, { color: colors.textSecondary }]}>
                {urgentProspect.capacity || urgentProspect.estimatedCap || 3.3} kWp Rooftop • {urgentProspect.city || 'Site Location'}
              </Text>
            </View>

            <View style={styles.attentionActions}>
              <TouchableOpacity
                style={[styles.attentionCallBtn, { backgroundColor: isDark ? colors.surfaceHighlight : '#F1F5F9' }]}
                onPress={() => handlePhoneCall(urgentProspect.mobile || urgentProspect.phone)}
                activeOpacity={0.8}
              >
                <Phone size={14} color={colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.attentionCallText, { color: colors.text }]}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.attentionWhatsAppBtn, { backgroundColor: '#15803D' }]}
                onPress={() => handleWhatsAppDirect(urgentProspect)}
                activeOpacity={0.8}
              >
                <MessageCircle size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.attentionWhatsAppText}>WhatsApp Pitch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. ACTIVE PROJECTS RADAR */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Projects</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Solar installations in execution</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>All ({projects.length}) →</Text>
            </TouchableOpacity>
          </View>

          {projects.length > 0 ? (
            <View style={styles.projectsList}>
              {projects.slice(0, 3).map((p, idx) => {
                const projectStage = p.currentStage || p.status || 'ACTIVE';
                const stagePct = projectStage === 'COMMISSIONED' ? 100
                  : projectStage === 'NET_METER' ? 85
                    : projectStage === 'TESTING' ? 70
                      : projectStage === 'INSTALLATION' ? 50
                        : projectStage === 'MATERIAL_DELIVERY' ? 35
                          : projectStage === 'STRUCTURE_ERECTION' ? 20
                            : 10;
                return (
                  <TouchableOpacity
                    key={p.id || idx}
                    style={[
                      styles.projectRow,
                      idx === Math.min(projects.length, 3) - 1 && { borderBottomWidth: 0 },
                      { borderBottomColor: colors.borderSubtle },
                    ]}
                    onPress={() => navigation.navigate('Projects', { projectId: p.id })}
                    activeOpacity={0.75}
                  >
                    <View style={styles.projectInfo}>
                      <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
                        {p.name || `Project #${p.id}`}
                      </Text>
                      <Text style={[styles.projectSub, tabularNums, { color: colors.textSecondary }]}>
                        {p.capacity || p.systemCapacity || 3} kWp • {p.city || p.state || 'Maharashtra'}
                      </Text>
                    </View>
                    <View style={styles.projectStatusBox}>
                      <View style={[styles.stageBadge, { backgroundColor: isDark ? 'rgba(0,102,255,0.18)' : '#EFF6FF' }]}>
                        <Text style={[styles.stageBadgeText, { color: colors.primary }]}>
                          {projectStage.replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text style={[styles.stagePctText, tabularNums, { color: colors.textMuted }]}>{stagePct}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <EmptyState
              compact
              icon={<Briefcase size={24} color={colors.primary} />}
              title="No In-Flight Projects"
              description="New projects will appear here once contracts are signed."
              actionTitle="View Projects"
              onActionPress={() => navigation.navigate('Projects')}
            />
          )}
        </View>

        {/* 5. RECENT LEADS PIPELINE */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Leads</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>New inquiries and opportunities</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Pipeline')}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>Pipeline ({data.totalLeads}) →</Text>
            </TouchableOpacity>
          </View>

          {recentLeads.length > 0 ? (
            <View style={styles.leadsList}>
              {recentLeads.slice(0, 3).map((lead, idx) => (
                <View
                  key={lead.id || idx}
                  style={[
                    styles.leadRow,
                    idx === Math.min(recentLeads.length, 3) - 1 && { borderBottomWidth: 0 },
                    { borderBottomColor: colors.borderSubtle },
                  ]}
                >
                  <View style={[styles.leadAvatar, { backgroundColor: isDark ? colors.surfaceHighlight : '#EFF6FF' }]}>
                    <Text style={[styles.leadAvatarText, { color: colors.primary }]}>
                      {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                    </Text>
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>{lead.name}</Text>
                    <Text style={[styles.leadDetails, tabularNums, { color: colors.textSecondary }]}>
                      {lead.capacity || lead.estimatedCap || 3.3} kWp • {lead.city || 'Site'}
                    </Text>
                  </View>
                  <View style={styles.leadActions}>
                    <TouchableOpacity
                      style={[styles.leadIconBtn, { backgroundColor: isDark ? colors.surfaceHighlight : '#F1F5F9' }]}
                      onPress={() => handlePhoneCall(lead.mobile || lead.phone)}
                      activeOpacity={0.7}
                    >
                      <Phone size={13} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.leadIconBtn, { backgroundColor: '#ECFDF5' }]}
                      onPress={() => handleWhatsAppDirect(lead)}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={13} color="#15803D" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              compact
              icon={<Users size={24} color={colors.primary} />}
              title="No Recent Leads"
              description="Capture leads or generate 60s proposals to build pipeline."
              actionTitle="Add Lead"
              onActionPress={() => navigation.navigate('Pipeline')}
            />
          )}
        </View>

        {/* 6. ENVIRONMENTAL IMPACT */}
        <View style={[styles.envCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.envHeader}>
            <View style={[styles.envIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Leaf size={16} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.envTitle, { color: colors.text }]}>Solar Environmental Impact</Text>
              <Text style={[styles.envSub, { color: colors.textMuted }]}>Fleet clean energy & offset telemetry</Text>
            </View>
          </View>
          <View style={[styles.envRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#F8FAFC' }]}>
            <View style={styles.envCol}>
              <Text style={[styles.envVal, tabularNums, { color: colors.text }]}>{cleanEnergyMWh}</Text>
              <Text style={[styles.envLbl, { color: colors.textSecondary }]}>MWh Generated</Text>
            </View>
            <View style={[styles.envDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.envCol}>
              <Text style={[styles.envVal, tabularNums, { color: colors.text }]}>{co2Tons}</Text>
              <Text style={[styles.envLbl, { color: colors.textSecondary }]}>Tons CO₂ Offset</Text>
            </View>
            <View style={[styles.envDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.envCol}>
              <Text style={[styles.envVal, tabularNums, { color: colors.text }]}>{treesCount}</Text>
              <Text style={[styles.envLbl, { color: colors.textSecondary }]}>Trees Equivalent</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* IN-APP SPOTLIGHT PRODUCT TOUR */}
      <InAppProductTour
        visible={spotlightVisible}
        onClose={() => setSpotlightVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    gap: spacing[4],
  },
  centeredStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },

  // SOL SPOTLIGHT TOUR BANNER
  spotlightTourBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  spotlightBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  spotlightBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  spotlightPill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  spotlightPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  spotlightBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },

  // 1. HERO OPERATIONAL RADAR CARD
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  quoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  quoteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: spacing[3],
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelLeft: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressLabelRight: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroTickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  tickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  tickerVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  tickerLbl: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  tickerDivider: {
    width: 1,
    height: 20,
  },

  // 2. QUICK ACTIONS
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // 3. IMMEDIATE ATTENTION CARD
  attentionCard: {
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  attentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  attentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  attentionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  attentionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 11,
    fontWeight: '700',
  },
  attentionBody: {
    marginBottom: spacing[3],
  },
  attentionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  attentionDetails: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  attentionActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  attentionCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: radii.md,
  },
  attentionCallText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attentionWhatsAppBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: radii.md,
  },
  attentionWhatsAppText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // 4 & 5. SECTION CARDS (Projects & Leads)
  sectionCard: {
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  projectsList: {},
  projectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 13,
    fontWeight: '600',
  },
  projectSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  projectStatusBox: {
    alignItems: 'flex-end',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stagePctText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // Leads list
  leadsList: {},
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  leadAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  leadAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 13,
    fontWeight: '600',
  },
  leadDetails: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 6,
  },
  leadIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 6. ENVIRONMENTAL IMPACT
  envCard: {
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  envIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  envSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  envRow: {
    flexDirection: 'row',
    borderRadius: radii.md,
    paddingVertical: 12,
  },
  envCol: {
    flex: 1,
    alignItems: 'center',
  },
  envVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  envLbl: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  envDivider: {
    width: 1,
    height: 24,
    alignSelf: 'center',
  },
});
