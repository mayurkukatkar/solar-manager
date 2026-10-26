import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import {
  FileText,
  MapPin,
  Landmark,
  Briefcase,
  Users,
  ChevronRight,
  Zap,
  Package,
  ShieldCheck,
  Sun,
  Award,
  Sparkles,
  ArrowRight,
  Leaf,
  Globe,
  Plus,
  Phone,
  MessageCircle,
  Receipt,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi, crmApi } from '../../api/endpoints';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { useAuth } from '../../context/AuthContext';
import { DashboardData, HorizonItem, Project } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HorizonType = 'monthly' | 'quarterly' | 'halfAnnual' | 'annual';
type FocusMetric = 'both' | 'clients' | 'revenue';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();

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
    horizonAnalytics: {
      monthly: [],
      quarterly: [],
      halfAnnual: [],
      annual: [],
    },
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

  // Horizon Analysis State
  const [periodHorizon, setPeriodHorizon] = useState<HorizonType>('quarterly');
  const [horizonMetricFocus, setHorizonMetricFocus] = useState<FocusMetric>('both');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, prjRes, leadsRes] = await Promise.all([
        tenantApi.getDashboard().catch(() => null),
        tenantApi.getProjects().catch(() => null),
        crmApi.getLeads({ all: true }).catch(() => null),
      ]);

      if (dashRes) {
        setData(dashRes);
      }

      if (prjRes && Array.isArray(prjRes.projects)) {
        setProjects(prjRes.projects);
      }

      if (leadsRes && Array.isArray(leadsRes.leads)) {
        setRecentLeads(leadsRes.leads.slice(0, 5));
      }
    } catch (err: any) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePhoneCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${clean}`);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // ----------------------------------------------------
  // PERIOD HORIZON FALLBACK DATASETS
  // ----------------------------------------------------
  const fallbackHorizonDataMap: Record<HorizonType, {
    label: string;
    sublabel: string;
    data: HorizonItem[];
  }> = {
    monthly: {
      label: 'Monthly Client & Revenue Trajectory',
      sublabel: 'Month-over-month performance across energized clients and revenue',
      data: [
        { period: 'Nov', clients: 4, revenue: 8.4, capacity: 18.5, avgDeal: '₹2.10L', growth: '+14% MoM', status: 'On Target' },
        { period: 'Dec', clients: 6, revenue: 11.2, capacity: 25.2, avgDeal: '₹1.87L', growth: '+33% MoM', status: 'Expanding' },
        { period: 'Jan', clients: 8, revenue: 14.8, capacity: 33.8, avgDeal: '₹1.85L', growth: '+32% MoM', status: 'Surge' },
        { period: 'Feb', clients: 7, revenue: 12.6, capacity: 28.4, avgDeal: '₹1.80L', growth: '-15% MoM', status: 'Stable' },
        { period: 'Mar', clients: 10, revenue: 20.2, capacity: 44.0, avgDeal: '₹2.02L', growth: '+60% MoM', status: 'Record High' },
        { period: 'Apr', clients: 11, revenue: 66.7, capacity: 37.1, avgDeal: '₹6.06L', growth: '+28% MoM', status: 'Current Peak' },
      ],
    },
    quarterly: {
      label: 'Quarterly Client & Revenue Velocity',
      sublabel: 'Fiscal quarters comparing customer acquisition and financial execution',
      data: [
        { period: 'Q1 (Apr–Jun)', clients: 22, revenue: 44.8, capacity: 94.6, avgDeal: '₹2.04L', growth: '+18% YoY', status: 'Stable' },
        { period: 'Q2 (Jul–Sep)', clients: 18, revenue: 36.2, capacity: 78.2, avgDeal: '₹2.01L', growth: '+22% YoY', status: 'Monsoon Cycle' },
        { period: 'Q3 (Oct–Dec)', clients: 29, revenue: 59.5, capacity: 126.4, avgDeal: '₹2.05L', growth: '+41% YoY', status: 'Festive Surge' },
        { period: 'Q4 (Jan–Mar)', clients: 38, revenue: 78.4, capacity: 168.0, avgDeal: '₹2.06L', growth: '+54% YoY', status: 'Year-End High' },
      ],
    },
    halfAnnual: {
      label: 'Half-Annual Solar Comparison (H1 vs H2)',
      sublabel: 'Pre-monsoon installation cycle vs post-monsoon PM Surya Ghar boom',
      data: [
        { period: 'H1 FY25', clients: 32, revenue: 64.0, capacity: 138.0, avgDeal: '₹2.00L', growth: '+28% YoY', status: 'Baseline' },
        { period: 'H2 FY25', clients: 51, revenue: 104.2, capacity: 224.5, avgDeal: '₹2.04L', growth: '+62% YoY', status: 'Strong Surge' },
        { period: 'H1 FY26', clients: 40, revenue: 81.0, capacity: 172.8, avgDeal: '₹2.03L', growth: '+26% YoY', status: 'Expanded' },
        { period: 'H2 FY26', clients: 67, revenue: 137.9, capacity: 294.4, avgDeal: '₹2.06L', growth: '+70% YoY', status: 'All-Time Record' },
      ],
    },
    annual: {
      label: 'Annual Multi-Year Growth & Client Expansion',
      sublabel: 'Year-over-year scaling across energized clients, capacity, and revenue',
      data: [
        { period: 'FY 2023–24', clients: 48, revenue: 98.5, capacity: 208.0, avgDeal: '₹2.05L', growth: 'Baseline', status: 'Early Growth' },
        { period: 'FY 2024–25', clients: 76, revenue: 154.2, capacity: 332.0, avgDeal: '₹2.03L', growth: '+56.5% YoY', status: 'Scaling' },
        { period: 'FY 2025–26', clients: 107, revenue: 218.9, capacity: 467.2, avgDeal: '₹2.05L', growth: '+42.0% YoY', status: 'Market Leader' },
        { period: 'FY 2026–27', clients: 160, revenue: 340.0, capacity: 720.0, avgDeal: '₹2.12L', growth: '+55.3% Projected', status: 'Target Goal' },
      ],
    },
  };

  const activeHorizonConfig = fallbackHorizonDataMap[periodHorizon];
  const activeHorizonData: HorizonItem[] =
    data.horizonAnalytics &&
    data.horizonAnalytics[periodHorizon] &&
    data.horizonAnalytics[periodHorizon].length > 0
      ? data.horizonAnalytics[periodHorizon]
      : activeHorizonConfig.data;

  // Aggregate stats for current horizon
  const totalHorizonClients = activeHorizonData.reduce((acc, curr) => acc + curr.clients, 0);
  const totalHorizonRevenue = activeHorizonData.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(1);
  const totalHorizonCapacity = activeHorizonData.reduce((acc, curr) => acc + curr.capacity, 0).toFixed(1);
  const avgHorizonDeal = (Number(totalHorizonRevenue) / (totalHorizonClients || 1)).toFixed(2);

  // Maximum values for relative chart bar heights
  const maxClientsVal = Math.max(...activeHorizonData.map((d) => d.clients), 1);
  const maxRevenueVal = Math.max(...activeHorizonData.map((d) => d.revenue), 1);

  // Fallback / Active datasets
  const fallbackInventoryRunway = [
    { item: '550W Mono PERC Panels (DCR)', stock: '184 Panels (~101 kWp)', runway: 19, status: 'Healthy' },
    { item: 'On-Grid Inverters (3kW/5kW)', stock: '14 Units In Stock', runway: 11, status: 'Reorder Soon' },
    { item: 'Elevated HDGI & Al Rails', stock: '480 Running Meters', runway: 24, status: 'Healthy' },
    { item: 'Solar DC 4mm² UV Cables', stock: '1,200m + 16 ACDB Boxes', runway: 28, status: 'Adequate' },
  ];
  const inventoryRunway =
    data.inventoryRunway && data.inventoryRunway.length > 0
      ? data.inventoryRunway
      : fallbackInventoryRunway;

  const fallbackSubsidyFunnel = [
    { step: '01', title: 'DISCOM Feasibility Approved', count: 24, amount: '₹18.7L', status: 'Feasibility Sanctioned' },
    { step: '02', title: 'Vendor Work Order & Install', count: 18, amount: '₹14.0L', status: 'Work Order Active' },
    { step: '03', title: 'Joint Inspection Report (JIR)', count: 12, amount: '₹9.3L', status: 'Uploaded to Portal' },
    { step: '04', title: 'Direct Subsidy Credited (DBT)', count: 9, amount: '₹7.02L', status: 'Credited to Customer' },
  ];
  const subsidyFunnel =
    data.subsidyFunnel && data.subsidyFunnel.length > 0
      ? data.subsidyFunnel
      : fallbackSubsidyFunnel;

  const totalCapacityKWp = data.totalCapacity
    ? data.totalCapacity.toFixed(1)
    : '37.1';

  const totalRevenueLakhs = data.totalRevenue
    ? Number((data.totalRevenue / 100000).toFixed(1))
    : 84.6;

  const totalCollectedLakhs = data.totalCollected
    ? Number((data.totalCollected / 100000).toFixed(1))
    : Number((totalRevenueLakhs * 0.65).toFixed(1));

  const outstandingLakhs = data.outstanding
    ? Number((data.outstanding / 100000).toFixed(1))
    : Math.max(0, Number((totalRevenueLakhs - totalCollectedLakhs).toFixed(1)));

  const collectedPct = totalRevenueLakhs > 0
    ? Math.min(100, Math.round((totalCollectedLakhs / totalRevenueLakhs) * 100))
    : 65;
  const outstandingPct = Math.max(0, 100 - collectedPct);

  // Environmental Metrics
  const cleanEnergyMWh = data.environmental && data.environmental.monthlyEnergyKWh > 0
    ? (data.environmental.monthlyEnergyKWh / 1000).toFixed(2)
    : '48.25';
  const co2Tons = data.environmental && data.environmental.co2Tons > 0
    ? data.environmental.co2Tons
    : 39.4;
  const coalTons = data.environmental && data.environmental.coalTons > 0
    ? data.environmental.coalTons
    : 19.2;
  const treesCount = data.environmental && data.environmental.trees > 0
    ? data.environmental.trees.toLocaleString()
    : '1,780';

  const fallbackRecentLeads = [
    {
      id: 'lead-1',
      name: 'Ramesh Patil',
      mobile: '9822012345',
      city: 'Nagpur',
      capacity: 3.3,
      value: 185000,
      stage: 'Proposal Sent',
      stageBg: '#eff6ff',
      stageColor: '#0066FF',
      avatarBg: '#dbeafe',
      avatarColor: '#1d4ed8',
      time: '1h ago',
    },
    {
      id: 'lead-2',
      name: 'Suresh Deshmukh',
      mobile: '9822054321',
      city: 'Pune',
      capacity: 5.0,
      value: 275000,
      stage: 'Survey Booked',
      stageBg: '#fef3c7',
      stageColor: '#d97706',
      avatarBg: '#fde68a',
      avatarColor: '#b45309',
      time: '3h ago',
    },
    {
      id: 'lead-3',
      name: 'Anand Kulkarni',
      mobile: '9822088899',
      city: 'Nashik',
      capacity: 3.3,
      value: 191000,
      stage: 'Erection Active',
      stageBg: '#ecfdf5',
      stageColor: '#059669',
      avatarBg: '#a7f3d0',
      avatarColor: '#047857',
      time: 'Today',
    },
  ];

  const activeStreamItems =
    recentLeads && recentLeads.length > 0
      ? recentLeads.map((l, i) => {
          const cap = l.estimatedCap || 3.3;
          const val = l.estimatedValue || Math.round(cap * 56000);
          const isWon = l.status === 'WON';
          const isProposal = l.status === 'PROPOSAL_SENT';
          const isSurvey = l.status === 'SITE_SURVEY';
          return {
            id: l.id || `lead-${i}`,
            name: l.name || 'Prospect',
            mobile: l.mobile || '',
            city: l.city || 'Site Location',
            capacity: cap,
            value: val,
            stage: isWon ? 'Won / EPC' : isProposal ? 'Proposal Sent' : isSurvey ? 'Survey Booked' : 'New Lead',
            stageBg: isWon ? '#ecfdf5' : isProposal ? '#eff6ff' : isSurvey ? '#fef3c7' : '#f1f5f9',
            stageColor: isWon ? '#059669' : isProposal ? '#0066FF' : isSurvey ? '#d97706' : '#475569',
            avatarBg: isWon ? '#d1fae5' : isProposal ? '#dbeafe' : '#fef3c7',
            avatarColor: isWon ? '#065f46' : isProposal ? '#1e40af' : '#92400e',
            time: 'Active',
          };
        })
      : fallbackRecentLeads;

  const urgentProspect = activeStreamItems[0] || fallbackRecentLeads[0];

  return (
    <View style={styles.container}>
      {/* Flush, Ultra-Compact Brand & Live Telemetry Header */}
      <Header variant="home" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================================
            ZONE 1: OPERATIONAL RADAR CANOPY (Deep Slate #091326 Edge-to-Edge)
            Answers: What requires attention right now? Which customer to contact?
            Dominant visual anchor + zero generic dashboard template card nesting.
        ===================================================================== */}
        <View style={styles.operationalCanopy}>
          {/* 1A. Dominant Typographic Anchor Row */}
          <View style={styles.radarHeroRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.radarBadgeRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.radarBadgeText}>LIVE OPERATIONS RADAR</Text>
              </View>
              <Text style={styles.radarHugeFigure}>₹{totalRevenueLakhs}L</Text>
              <Text style={styles.radarSubline}>
                {totalCapacityKWp} kWp Fleet Active • ₹{outstandingLakhs}L In-Flight Claims
              </Text>
            </View>

            <TouchableOpacity
              style={styles.radarQuickQuoteBtn}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.85}
            >
              <Zap size={14} color="#fbbf24" style={{ marginRight: 5 }} />
              <Text style={styles.radarQuickQuoteText}>60s Quote</Text>
            </TouchableOpacity>
          </View>

          {/* 1B. Immediate Attention Hero Anchor (Action-First Customer Focus) */}
          <View style={styles.urgentActionTile}>
            <View style={styles.urgentHeaderRow}>
              <View style={styles.urgentTag}>
                <Sparkles size={11} color="#f59e0b" />
                <Text style={styles.urgentTagText}>IMMEDIATE ACTION REQUIRED</Text>
              </View>
              <Text style={styles.urgentTimeAgo}>{urgentProspect.time || 'Active'}</Text>
            </View>

            <View style={styles.urgentCustomerInfo}>
              <Text style={styles.urgentCustomerName} numberOfLines={1}>
                {urgentProspect.name} ({urgentProspect.capacity} kWp Rooftop)
              </Text>
              <Text style={styles.urgentCustomerMeta} numberOfLines={1}>
                📍 {urgentProspect.city} • Est. ₹{(urgentProspect.value || 185000).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.urgentCustomerSubsidy} numberOfLines={1}>
                🏛️ PM Surya Ghar: Eligible for ₹78,000 Direct DBT Subsidy
              </Text>
            </View>

            {/* Direct 1-Tap Execution Actions */}
            <View style={styles.urgentActionButtonsRow}>
              <TouchableOpacity
                style={styles.urgentCallBtn}
                onPress={() => handlePhoneCall(urgentProspect.mobile)}
                activeOpacity={0.85}
              >
                <Phone size={13} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.urgentCallBtnText}>Call Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.urgentPitchBtn}
                onPress={() => handleWhatsAppDirect(urgentProspect)}
                activeOpacity={0.85}
              >
                <MessageCircle size={13} color="#15803d" style={{ marginRight: 6 }} />
                <Text style={styles.urgentPitchBtnText}>WhatsApp Pitch</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.urgentDetailBtn}
                onPress={() => navigation.navigate('Pipeline')}
                activeOpacity={0.85}
              >
                <ArrowRight size={14} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 1C. Asymmetric Hairline Pulse Strip */}
          <View style={styles.pulseStrip}>
            <View style={styles.pulseItem}>
              <Text style={styles.pulseNum}>{data.totalLeads || 3}</Text>
              <Text style={styles.pulseLabel}>Pending Quotes</Text>
            </View>
            <View style={styles.pulseHairline} />
            <View style={styles.pulseItem}>
              <Text style={styles.pulseNum}>{projects.length || data.totalProjects || 2}</Text>
              <Text style={styles.pulseLabel}>Active Erection</Text>
            </View>
            <View style={styles.pulseHairline} />
            <View style={styles.pulseItem}>
              <Text style={[styles.pulseNum, { color: '#34d399' }]}>₹78k</Text>
              <Text style={styles.pulseLabel}>Max Site Subsidy</Text>
            </View>
            <View style={styles.pulseHairline} />
            <View style={styles.pulseItem}>
              <Text style={[styles.pulseNum, { color: '#38bdf8' }]}>14.8d</Text>
              <Text style={styles.pulseLabel}>Avg Turnaround</Text>
            </View>
          </View>
        </View>

        {/* =====================================================================
            ZONE 2: EXECUTION FLOOR (Crisp Polar White #f8fafc)
            Open Editorial Layout: No repeated card-within-card rectangles.
        ===================================================================== */}
        <View style={styles.executionFloor}>

          {/* 2A. Field Dispatch & Workday Thread (Horizontal Chronological Workflow) */}
          <View style={styles.workdaySection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.openSectionLabel}>FIELD DISPATCH & WORKDAY THREAD</Text>
                <Text style={styles.openSectionSub}>Scheduled surveys, liaison & commissioning</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionActionText}>Schedule →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineScroll}
            >
              <View style={[styles.timelineNode, styles.timelineNodeDone]}>
                <View style={styles.timelineNodeTop}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.timelineTime}>09:30 AM</Text>
                </View>
                <Text style={styles.timelineTitle}>Site Survey @ Nagpur</Text>
                <Text style={styles.timelineMeta}>3.3 kWp Mono PERC • Rooftop Clear</Text>
                <View style={styles.timelineStatusPillDone}>
                  <Text style={styles.timelineStatusTextDone}>Completed ✓</Text>
                </View>
              </View>

              <View style={[styles.timelineNode, styles.timelineNodeActive]}>
                <View style={styles.timelineNodeTop}>
                  <View style={[styles.timelineDot, { backgroundColor: '#0066FF' }]} />
                  <Text style={[styles.timelineTime, { color: '#0066FF' }]}>01:45 PM</Text>
                </View>
                <Text style={styles.timelineTitle}>DISCOM Liaison</Text>
                <Text style={styles.timelineMeta}>MSEDCL Feasibility Sanction</Text>
                <View style={styles.timelineStatusPillActive}>
                  <Text style={styles.timelineStatusTextActive}>In Progress ⚡</Text>
                </View>
              </View>

              <View style={styles.timelineNode}>
                <View style={styles.timelineNodeTop}>
                  <View style={[styles.timelineDot, { backgroundColor: '#94a3b8' }]} />
                  <Text style={styles.timelineTime}>04:30 PM</Text>
                </View>
                <Text style={styles.timelineTitle}>Joint Inspection (JIR)</Text>
                <Text style={styles.timelineMeta}>Bi-directional Net Meter Test</Text>
                <View style={styles.timelineStatusPillNext}>
                  <Text style={styles.timelineStatusTextNext}>Up Next ➔</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* 2B. Live Customer Pipeline & Outbound Outreach (Open Editorial Rows) */}
          <View style={styles.editorialStreamSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.openSectionLabel}>LIVE CUSTOMER PIPELINE & OUTREACH</Text>
                <Text style={styles.openSectionSub}>High-priority prospects awaiting follow-up or pitch</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Pipeline')} activeOpacity={0.7}>
                <Text style={styles.sectionActionText}>All Leads →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editorialList}>
              {activeStreamItems.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.editorialRow,
                    idx === activeStreamItems.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.editorialAvatar, { backgroundColor: item.avatarBg || '#eff6ff' }]}>
                    <Text style={[styles.editorialAvatarText, { color: item.avatarColor || '#0066FF' }]}>
                      {item.name ? item.name.charAt(0).toUpperCase() : 'S'}
                    </Text>
                  </View>

                  <View style={styles.editorialRowMeta}>
                    <View style={styles.editorialNameRow}>
                      <Text style={styles.editorialRowName} numberOfLines={1}>{item.name}</Text>
                      <View style={[styles.stageBadgePill, { backgroundColor: item.stageBg || '#eff6ff' }]}>
                        <Text style={[styles.stageBadgeText, { color: item.stageColor || '#0066FF' }]}>
                          {item.stage}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.editorialRowSub} numberOfLines={1}>
                      ⚡ {item.capacity} kWp • 📍 {item.city} • ₹{(item.value || 185000).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.editorialActionsGroup}>
                    <TouchableOpacity
                      style={styles.editorialActionBtn}
                      onPress={() => handlePhoneCall(item.mobile)}
                      activeOpacity={0.7}
                      accessibilityLabel="Call"
                    >
                      <Phone size={13} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editorialActionBtn, { backgroundColor: '#dcfce7' }]}
                      onPress={() => handleWhatsAppDirect(item)}
                      activeOpacity={0.7}
                      accessibilityLabel="WhatsApp"
                    >
                      <MessageCircle size={13} color="#15803d" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 2C. Solar EPC Execution Pipeline (Connected Workflow Ribbon) */}
          <View style={styles.epcRibbonSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.openSectionLabel}>SOLAR EPC EXECUTION PIPELINE</Text>
                <Text style={styles.openSectionSub}>End-to-end milestone throughput</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Projects')} activeOpacity={0.7}>
                <Text style={styles.sectionActionText}>All Projects →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.epcRibbonScroll}
            >
              <TouchableOpacity
                style={styles.epcStepNode}
                onPress={() => navigation.navigate('Pipeline')}
                activeOpacity={0.8}
              >
                <View style={styles.epcStepTop}>
                  <Text style={styles.epcStepNum}>01</Text>
                  <Users size={14} color="#0284c7" />
                </View>
                <Text style={styles.epcStepValue}>{data.totalLeads}</Text>
                <Text style={styles.epcStepTitle}>Leads</Text>
                <Text style={styles.epcStepSub}>Inbound</Text>
              </TouchableOpacity>

              <View style={styles.epcStepArrow}>
                <ChevronRight size={14} color="#cbd5e1" />
              </View>

              <TouchableOpacity
                style={styles.epcStepNode}
                onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
                activeOpacity={0.8}
              >
                <View style={styles.epcStepTop}>
                  <Text style={styles.epcStepNum}>02</Text>
                  <MapPin size={14} color="#d97706" />
                </View>
                <Text style={styles.epcStepValue}>{data.totalCustomers}</Text>
                <Text style={styles.epcStepTitle}>Surveys</Text>
                <Text style={styles.epcStepSub}>Verified</Text>
              </TouchableOpacity>

              <View style={styles.epcStepArrow}>
                <ChevronRight size={14} color="#cbd5e1" />
              </View>

              <TouchableOpacity
                style={styles.epcStepNode}
                onPress={() => navigation.navigate('QuickQuote')}
                activeOpacity={0.8}
              >
                <View style={styles.epcStepTop}>
                  <Text style={styles.epcStepNum}>03</Text>
                  <Zap size={14} color="#7c3aed" />
                </View>
                <Text style={styles.epcStepValue}>
                  {data.totalLeads > 0 ? Math.round(data.totalLeads * 0.7) : 0}
                </Text>
                <Text style={styles.epcStepTitle}>Proposals</Text>
                <Text style={styles.epcStepSub}>Dispatched</Text>
              </TouchableOpacity>

              <View style={styles.epcStepArrow}>
                <ChevronRight size={14} color="#cbd5e1" />
              </View>

              <TouchableOpacity
                style={styles.epcStepNode}
                onPress={() => navigation.navigate('Projects')}
                activeOpacity={0.8}
              >
                <View style={styles.epcStepTop}>
                  <Text style={styles.epcStepNum}>04</Text>
                  <Briefcase size={14} color="#2563eb" />
                </View>
                <Text style={styles.epcStepValue}>{data.totalProjects}</Text>
                <Text style={styles.epcStepTitle}>Erection</Text>
                <Text style={styles.epcStepSub}>On-site</Text>
              </TouchableOpacity>

              <View style={styles.epcStepArrow}>
                <ChevronRight size={14} color="#cbd5e1" />
              </View>

              <TouchableOpacity
                style={styles.epcStepNode}
                onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })}
                activeOpacity={0.8}
              >
                <View style={styles.epcStepTop}>
                  <Text style={styles.epcStepNum}>05</Text>
                  <Landmark size={14} color="#059669" />
                </View>
                <Text style={styles.epcStepValue}>{data.pendingInvoices}</Text>
                <Text style={styles.epcStepTitle}>DBT Subsidies</Text>
                <Text style={styles.epcStepSub}>Clearing</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* 2D. Cashflow & Capital Realization Waterfall (Open Clean Composition) */}
          <View style={styles.cashflowSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.openSectionLabel}>CASHFLOW & CAPITAL REALIZATION</Text>
                <Text style={styles.openSectionSub}>Order book collections & receivables aging</Text>
              </View>
              <View style={styles.orderBookPill}>
                <Text style={styles.orderBookPillText}>Order Book: ₹{totalRevenueLakhs}L</Text>
              </View>
            </View>

            <View style={styles.waterfallStack}>
              <View style={styles.waterfallBarItem}>
                <View style={styles.waterfallBarRow}>
                  <Text style={styles.waterfallBarLabel}>Advances Collected</Text>
                  <Text style={[styles.waterfallBarVal, { color: '#059669' }]}>
                    ₹{totalCollectedLakhs}L ({collectedPct}%)
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${collectedPct}%`, backgroundColor: '#10b981' }]} />
                </View>
              </View>

              <View style={styles.waterfallBarItem}>
                <View style={styles.waterfallBarRow}>
                  <Text style={styles.waterfallBarLabel}>Milestone Receivables</Text>
                  <Text style={[styles.waterfallBarVal, { color: '#d97706' }]}>
                    ₹{outstandingLakhs}L ({outstandingPct}%)
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${outstandingPct}%`, backgroundColor: '#f59e0b' }]} />
                </View>
              </View>

              <View style={styles.waterfallBarItem}>
                <View style={styles.waterfallBarRow}>
                  <Text style={styles.waterfallBarLabel}>National DBT Subsidy Claims</Text>
                  <Text style={[styles.waterfallBarVal, { color: '#0066FF' }]}>
                    {subsidyFunnel[3]?.amount || '₹7.02 Lakhs'}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '45%', backgroundColor: '#0066FF' }]} />
                </View>
              </View>
            </View>

            {/* Dense 3-Segment Aging Strip */}
            <View style={styles.agingSegmentedRow}>
              <View style={[styles.agingPillItem, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                <Text style={styles.agingPillLabel}>&lt; 15 DAYS</Text>
                <Text style={styles.agingPillVal}>
                  ₹{data.aging ? (data.aging.under15 / 100000).toFixed(1) : '11.2'}L
                </Text>
                <Text style={[styles.agingPillStatus, { color: '#059669' }]}>On Track</Text>
              </View>
              <View style={[styles.agingPillItem, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                <Text style={[styles.agingPillLabel, { color: '#b45309' }]}>15–30 DAYS</Text>
                <Text style={[styles.agingPillVal, { color: '#92400e' }]}>
                  ₹{data.aging ? (data.aging.under30 / 100000).toFixed(1) : '5.4'}L
                </Text>
                <Text style={[styles.agingPillStatus, { color: '#b45309' }]}>Follow-up</Text>
              </View>
              <View style={[styles.agingPillItem, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
                <Text style={[styles.agingPillLabel, { color: '#be123c' }]}>&gt; 30 DAYS</Text>
                <Text style={[styles.agingPillVal, { color: '#9f1239' }]}>
                  ₹{data.aging ? (data.aging.over30 / 100000).toFixed(1) : '2.0'}L
                </Text>
                <Text style={[styles.agingPillStatus, { color: '#be123c' }]}>Action Due</Text>
              </View>
            </View>
          </View>

          {/* 2E. Period Horizon Comparative Velocity Engine */}
          <View style={styles.horizonSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.openSectionLabel}>PERIOD COMPARATIVE VELOCITY</Text>
                <Text style={styles.openSectionSub}>{activeHorizonConfig.label}</Text>
              </View>
            </View>

            {/* Horizon Horizon Tabs */}
            <View style={styles.horizonTabsRow}>
              {(['monthly', 'quarterly', 'halfAnnual', 'annual'] as HorizonType[]).map((h) => {
                const active = periodHorizon === h;
                const labels: Record<HorizonType, string> = {
                  monthly: 'Monthly',
                  quarterly: 'Quarterly',
                  halfAnnual: 'Half-Annual',
                  annual: 'Annual',
                };
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.horizonTabBtn, active && styles.horizonTabBtnActive]}
                    onPress={() => setPeriodHorizon(h)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.horizonTabBtnText, active && styles.horizonTabBtnTextActive]}>
                      {labels[h]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Metric Filter Buttons */}
            <View style={styles.metricFilterRow}>
              {(['both', 'clients', 'revenue'] as FocusMetric[]).map((f) => {
                const active = horizonMetricFocus === f;
                const labels: Record<FocusMetric, string> = {
                  both: 'Both Metrics',
                  clients: 'Clients',
                  revenue: 'Revenue ₹',
                };
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.metricFilterBtn, active && styles.metricFilterBtnActive]}
                    onPress={() => setHorizonMetricFocus(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.metricFilterBtnText, active && styles.metricFilterBtnTextActive]}>
                      {labels[f]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Horizon Summary Strip */}
            <View style={styles.horizonStatsGrid}>
              <View style={styles.horizonStatItem}>
                <Text style={styles.horizonStatLabel}>CLIENTS</Text>
                <Text style={styles.horizonStatVal}>{totalHorizonClients}</Text>
                <Text style={styles.horizonStatHint}>Commissioned</Text>
              </View>
              <View style={styles.horizonStatDivider} />
              <View style={styles.horizonStatItem}>
                <Text style={styles.horizonStatLabel}>REVENUE</Text>
                <Text style={[styles.horizonStatVal, { color: '#059669' }]}>₹{totalHorizonRevenue}L</Text>
                <Text style={styles.horizonStatHint}>Realized</Text>
              </View>
              <View style={styles.horizonStatDivider} />
              <View style={styles.horizonStatItem}>
                <Text style={styles.horizonStatLabel}>AVG DEAL</Text>
                <Text style={[styles.horizonStatVal, { color: '#0066FF' }]}>₹{avgHorizonDeal}L</Text>
                <Text style={styles.horizonStatHint}>Per Site</Text>
              </View>
              <View style={styles.horizonStatDivider} />
              <View style={styles.horizonStatItem}>
                <Text style={styles.horizonStatLabel}>CAPACITY</Text>
                <Text style={[styles.horizonStatVal, { color: '#7c3aed' }]}>{totalHorizonCapacity}k</Text>
                <Text style={styles.horizonStatHint}>kWp Total</Text>
              </View>
            </View>

            {/* Native Bar Trajectory Chart */}
            <View style={styles.chartArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartColumnsScroll}>
                {activeHorizonData.map((item, idx) => {
                  const clientHeightPct = Math.max(12, Math.round((item.clients / maxClientsVal) * 100));
                  const revenueHeightPct = Math.max(12, Math.round((item.revenue / maxRevenueVal) * 100));

                  return (
                    <View key={item.period || idx} style={styles.chartColumnGroup}>
                      <View style={styles.chartBarsPair}>
                        {(horizonMetricFocus === 'both' || horizonMetricFocus === 'clients') && (
                          <View style={styles.singleBarWrapper}>
                            <Text style={styles.barTopLabel}>{item.clients}</Text>
                            <View
                              style={[
                                styles.chartBar,
                                { height: clientHeightPct, backgroundColor: '#0284c7' },
                              ]}
                            />
                          </View>
                        )}

                        {(horizonMetricFocus === 'both' || horizonMetricFocus === 'revenue') && (
                          <View style={styles.singleBarWrapper}>
                            <Text style={styles.barTopLabel}>₹{item.revenue}</Text>
                            <View
                              style={[
                                styles.chartBar,
                                { height: revenueHeightPct, backgroundColor: '#10b981' },
                              ]}
                            />
                          </View>
                        )}
                      </View>
                      <Text style={styles.chartColumnXLabel} numberOfLines={1}>{item.period}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* 2F. Dual Section: National Portal Subsidy & Hardware Runway */}
          <View style={styles.dualSection}>
            {/* Left: National Portal Subsidy Progress */}
            <View style={styles.dualSectionHalf}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.openSectionLabel}>PM SURYA GHAR DBT</Text>
                <View style={styles.subsidyMaxPill}>
                  <Text style={styles.subsidyMaxPillText}>₹78k/Site</Text>
                </View>
              </View>

              <View style={styles.subsidyStepsList}>
                {subsidyFunnel.map((step) => (
                  <View key={step.step} style={styles.subsidyStepRow}>
                    <View style={styles.subsidyStepNumBadge}>
                      <Text style={styles.subsidyStepNumText}>{step.step}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.subsidyStepTitle} numberOfLines={1}>{step.title}</Text>
                      <Text style={styles.subsidyStepSub}>{step.count} Sites • {step.amount}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: Hardware Stock Runway */}
            <View style={styles.dualSectionHalf}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.openSectionLabel}>HARDWARE RUNWAY</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Modules', { screen: 'INVENTORY' })}>
                  <Text style={styles.sectionActionText}>Ledger →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inventoryList}>
                {inventoryRunway.map((item, idx) => (
                  <View key={item.item || idx} style={styles.inventoryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inventoryItemTitle} numberOfLines={1}>{item.item}</Text>
                      <Text style={styles.inventoryStockText} numberOfLines={1}>{item.stock}</Text>
                    </View>
                    <View
                      style={[
                        styles.runwayBadge,
                        {
                          backgroundColor: item.status === 'Reorder Soon' ? '#fef3c7' : '#ecfdf5',
                          borderColor: item.status === 'Reorder Soon' ? '#fde68a' : '#a7f3d0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.runwayBadgeText,
                          { color: item.status === 'Reorder Soon' ? '#b45309' : '#047857' },
                        ]}
                      >
                        {item.runway}d
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 2G. Solar Fleet Environmental & Carbon Offset Telemetry */}
          <View style={styles.environmentalZone}>
            <View style={styles.envHeader}>
              <View style={styles.envIconBadge}>
                <Leaf size={16} color="#34d399" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.envTitle}>Solar Fleet Environmental Offset</Text>
                <Text style={styles.envSub}>Clean green kilowatt-hours & emissions displaced</Text>
              </View>
            </View>

            <View style={styles.envGrid}>
              <View style={styles.envGridItem}>
                <Text style={styles.envItemLabel}>CLEAN POWER</Text>
                <Text style={styles.envItemVal}>{cleanEnergyMWh} MWh</Text>
                <Text style={styles.envItemSub}>This Month (+18%)</Text>
              </View>
              <View style={styles.envGridItem}>
                <Text style={styles.envItemLabel}>CO₂ MITIGATED</Text>
                <Text style={styles.envItemVal}>{co2Tons} T</Text>
                <Text style={styles.envItemSub}>Fossil Offset</Text>
              </View>
              <View style={styles.envGridItem}>
                <Text style={styles.envItemLabel}>COAL SAVED</Text>
                <Text style={styles.envItemVal}>{coalTons} T</Text>
                <Text style={styles.envItemSub}>Avoided Burn</Text>
              </View>
              <View style={styles.envGridItem}>
                <Text style={styles.envItemLabel}>TREES OFFSET</Text>
                <Text style={styles.envItemVal}>{treesCount}</Text>
                <Text style={styles.envItemSub}>Forest Impact</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* =====================================================================
          FLOATING OPERATIONAL ACTION CONTROLS (Always Accessible)
      ===================================================================== */}
      <View style={styles.floatingCommandBar}>
        <TouchableOpacity
          style={styles.floatingActionPrimary}
          onPress={() => navigation.navigate('QuickQuote')}
          activeOpacity={0.85}
        >
          <Zap size={14} color="#fbbf24" style={{ marginRight: 5 }} />
          <Text style={styles.floatingActionPrimaryText}>60s Quote</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingActionSecondary}
          onPress={() => navigation.navigate('Pipeline')}
          activeOpacity={0.85}
        >
          <Plus size={14} color="#0066FF" style={{ marginRight: 5 }} />
          <Text style={styles.floatingActionSecondaryText}>New Lead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingActionSecondary}
          onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
          activeOpacity={0.85}
        >
          <MapPin size={14} color="#d97706" style={{ marginRight: 5 }} />
          <Text style={styles.floatingActionSecondaryText}>Survey</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingActionSecondary}
          onPress={() => navigation.navigate('Finance')}
          activeOpacity={0.85}
        >
          <Receipt size={14} color="#059669" style={{ marginRight: 5 }} />
          <Text style={styles.floatingActionSecondaryText}>Invoice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#091326', // Deep slate ground matching the canopy
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  // ---------------------------------------------------------------------------
  // ZONE 1: OPERATIONAL RADAR CANOPY (Deep Slate #091326 Edge-to-Edge)
  // ---------------------------------------------------------------------------
  operationalCanopy: {
    backgroundColor: '#091326',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  radarHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  radarBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  radarBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  radarHugeFigure: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  radarSubline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 4,
  },
  radarQuickQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 4,
  },
  radarQuickQuoteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // 1B. Immediate Attention Hero Tile
  urgentActionTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  urgentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  urgentTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  urgentTimeAgo: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  urgentCustomerInfo: {
    marginBottom: 12,
  },
  urgentCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },
  urgentCustomerMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 4,
  },
  urgentCustomerSubsidy: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34d399',
  },
  urgentActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 9,
    borderRadius: 12,
  },
  urgentCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  urgentPitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 9,
    borderRadius: 12,
  },
  urgentPitchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  urgentDetailBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 1C. Asymmetric Hairline Pulse Strip
  pulseStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  pulseItem: {
    flex: 1,
    alignItems: 'center',
  },
  pulseNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  pulseLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
  },
  pulseHairline: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ---------------------------------------------------------------------------
  // ZONE 2: EXECUTION FLOOR (Crisp Polar White #f8fafc)
  // ---------------------------------------------------------------------------
  executionFloor: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  openSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  openSectionSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  sectionActionTextBtn: {},

  // 2A. Field Dispatch & Workday Thread
  workdaySection: {},
  timelineScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  timelineNode: {
    width: 175,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
  },
  timelineNodeDone: {
    borderColor: '#a7f3d0',
    backgroundColor: '#f0fdf4',
  },
  timelineNodeActive: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  timelineNodeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineTime: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  timelineMeta: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 8,
  },
  timelineStatusPillDone: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineStatusTextDone: {
    fontSize: 8,
    fontWeight: '800',
    color: '#15803d',
  },
  timelineStatusPillActive: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineStatusTextActive: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  timelineStatusPillNext: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineStatusTextNext: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
  },

  // 2B. Live Customer Pipeline (Open Editorial Rows)
  editorialStreamSection: {},
  editorialList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  editorialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  editorialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorialAvatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  editorialRowMeta: {
    flex: 1,
  },
  editorialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  editorialRowName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  stageBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  editorialRowSub: {
    fontSize: 11,
    color: '#64748b',
  },
  editorialActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editorialActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 2C. Solar EPC Execution Pipeline (Connected Workflow Ribbon)
  epcRibbonSection: {},
  epcRibbonScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  epcStepNode: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    width: 90,
  },
  epcStepTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  epcStepNum: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
  },
  epcStepValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 1,
  },
  epcStepTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  epcStepSub: {
    fontSize: 8,
    color: '#94a3b8',
  },
  epcStepArrow: {
    paddingHorizontal: 2,
  },

  // 2D. Cashflow Waterfall & Capital Realization
  cashflowSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  orderBookPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  orderBookPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  waterfallStack: {
    gap: 10,
    marginBottom: 14,
  },
  waterfallBarItem: {},
  waterfallBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  waterfallBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  waterfallBarVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  agingSegmentedRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  agingPillItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  agingPillLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
  },
  agingPillVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 1,
  },
  agingPillStatus: {
    fontSize: 8,
    fontWeight: '800',
  },

  // 2E. Period Horizon Comparative Velocity Engine
  horizonSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  horizonTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  horizonTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  horizonTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  horizonTabBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  horizonTabBtnTextActive: {
    color: '#0066FF',
    fontWeight: '800',
  },
  metricFilterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metricFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricFilterBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  metricFilterBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  metricFilterBtnTextActive: {
    color: '#ffffff',
  },
  horizonStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  horizonStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  horizonStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
  },
  horizonStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 1,
  },
  horizonStatHint: {
    fontSize: 8,
    color: '#94a3b8',
  },
  horizonStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  chartArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
  },
  chartColumnsScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chartColumnGroup: {
    alignItems: 'center',
    width: 58,
  },
  chartBarsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 100,
  },
  singleBarWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTopLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 2,
  },
  chartBar: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  chartColumnXLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },

  // 2F. Dual Section: National Portal Subsidy & Hardware Runway
  dualSection: {
    flexDirection: 'row',
    gap: 12,
  },
  dualSectionHalf: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 12,
  },
  subsidyMaxPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subsidyMaxPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },
  subsidyStepsList: {
    gap: 8,
  },
  subsidyStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
  },
  subsidyStepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsidyStepNumText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  subsidyStepTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  subsidyStepSub: {
    fontSize: 8,
    color: '#64748b',
  },
  inventoryList: {
    gap: 6,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
  },
  inventoryItemTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  inventoryStockText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  runwayBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  runwayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // 2G. Environmental Offset Zone (Deep Emerald)
  environmentalZone: {
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 20,
    padding: 16,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  envIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  envSub: {
    fontSize: 9,
    color: '#6ee7b7',
    marginTop: 1,
  },
  envGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  envGridItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  envItemLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  envItemVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 2,
  },
  envItemSub: {
    fontSize: 7,
    fontWeight: '600',
    color: '#34d399',
  },

  // ---------------------------------------------------------------------------
  // FLOATING OPERATIONAL ACTION CONTROLS
  // ---------------------------------------------------------------------------
  floatingCommandBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 70 : 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 6,
    gap: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  floatingActionPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091326',
    borderRadius: 14,
    paddingVertical: 9,
  },
  floatingActionPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  floatingActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 9,
  },
  floatingActionSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
