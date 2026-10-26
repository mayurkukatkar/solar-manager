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
  Dimensions,
  Platform,
  Linking,
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
  Sun,
  Wallet,
  Activity,
  Layers,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  Leaf,
  Globe,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  Calendar,
  CalendarDays,
  Flame,
  Phone,
  MessageCircle,
  Receipt,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi, crmApi } from '../../api/endpoints';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { useAuth } from '../../context/AuthContext';
import { DashboardData, HorizonItem, Project } from '../../types';
import { colors } from '../../theme/colors';

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
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [guideVisible, setGuideVisible] = useState(false);

  // Horizon Analysis State
  const [periodHorizon, setPeriodHorizon] = useState<HorizonType>('quarterly');
  const [horizonMetricFocus, setHorizonMetricFocus] = useState<FocusMetric>('both');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
    { item: '550W Mono PERC Solar Panels (DCR)', stock: '184 Panels (~101 kWp)', runway: 19, status: 'Healthy', unit: 'Days', badge: 'emerald' },
    { item: 'On-Grid Inverters (3kW, 5kW, 10kW)', stock: '14 Units In Stock', runway: 11, status: 'Reorder Soon', unit: 'Days', badge: 'amber' },
    { item: 'Elevated HDGI & Aluminium Rails', stock: '480 Running Meters', runway: 24, status: 'Healthy', unit: 'Days', badge: 'emerald' },
    { item: 'Solar DC 4mm² UV Cables & ACDB', stock: '1,200 Meters + 16 Boxes', runway: 28, status: 'Adequate', unit: 'Days', badge: 'emerald' },
  ];
  const inventoryRunway =
    data.inventoryRunway && data.inventoryRunway.length > 0
      ? data.inventoryRunway
      : fallbackInventoryRunway;

  const fallbackSubsidyFunnel = [
    { step: '01', title: 'DISCOM Feasibility Approved', count: 24, amount: '₹18.7 Lakhs', status: 'Feasibility Sanctioned' },
    { step: '02', title: 'Vendor Work Order & Install', count: 18, amount: '₹14.0 Lakhs', status: 'Work Order Active' },
    { step: '03', title: 'Joint Inspection Report (JIR)', count: 12, amount: '₹9.3 Lakhs', status: 'Uploaded to Portal' },
    { step: '04', title: 'Direct Subsidy Credited (DBT)', count: 9, amount: '₹7.02 Lakhs', status: 'Credited to Customer' },
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
    : 60;
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
      stage: 'Installation Active',
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

  return (
    <View style={styles.container}>
      <Header
        title={`${greeting}, ${user?.name ? user.name.split(' ')[0] : 'Solar Partner'}`}
        subtitle={`${user?.tenantName || 'WhereReady Solar OS'} • Field Operations Hub`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. UBER-INSPIRED: TODAY'S OPERATIONAL DISPATCH HERO */}
        <View style={styles.dispatchHeroCard}>
          <View style={styles.dispatchHeroTop}>
            <View style={styles.dispatchPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.dispatchPillText}>TODAY'S MISSION & DISPATCH</Text>
            </View>
            <Text style={styles.dispatchDateText}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <Text style={styles.dispatchHeadline}>
            {data.totalLeads || 3} Proposals Pending Follow-Up
          </Text>
          <Text style={styles.dispatchSubline}>
            {projects.length || data.totalProjects || 2} active installations on-site • ₹{outstandingLakhs}L maturing DBT claims
          </Text>

          {/* Action-First Recommended Step */}
          <View style={styles.priorityBox}>
            <View style={styles.priorityBoxLeft}>
              <View style={styles.priorityTagRow}>
                <Sparkles size={11} color="#f59e0b" />
                <Text style={styles.priorityLabel}>NEXT RECOMMENDED ACTION</Text>
              </View>
              <Text style={styles.priorityTitle} numberOfLines={1}>
                {recentLeads[0]
                  ? `Follow up with ${recentLeads[0].name} (${recentLeads[0].estimatedCap || 3.3} kWp)`
                  : 'Dispatch 60s proposal to new inquiry'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => navigation.navigate(recentLeads[0] ? 'Pipeline' : 'QuickQuote')}
              activeOpacity={0.85}
            >
              <Zap size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.actionBtnPrimaryText}>Action</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. BLINKIT-INSPIRED: FAST DISCOVERABILITY & ACTION TOOLKIT */}
        <View style={styles.speedSection}>
          <Text style={styles.sectionHeaderTitle}>QUICK ACTION TOOLKIT</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.speedScroll}
          >
            <TouchableOpacity
              style={[styles.speedPill, styles.speedPillPrimary]}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.85}
            >
              <Zap size={15} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text style={styles.speedPillTextPrimary}>60s Proposal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedPill}
              onPress={() => navigation.navigate('Pipeline')}
              activeOpacity={0.85}
            >
              <Plus size={15} color="#0066FF" style={{ marginRight: 6 }} />
              <Text style={styles.speedPillText}>+ New Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedPill}
              onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
              activeOpacity={0.85}
            >
              <MapPin size={15} color="#d97706" style={{ marginRight: 6 }} />
              <Text style={styles.speedPillText}>Book Survey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedPill}
              onPress={() => navigation.navigate('Finance')}
              activeOpacity={0.85}
            >
              <Receipt size={15} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.speedPillText}>Tax Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedPill}
              onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })}
              activeOpacity={0.85}
            >
              <Landmark size={15} color="#7c3aed" style={{ marginRight: 6 }} />
              <Text style={styles.speedPillText}>PM Surya Ghar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedPill}
              onPress={() => navigation.navigate('Modules', { screen: 'INVENTORY' })}
              activeOpacity={0.85}
            >
              <Package size={15} color="#0284c7" style={{ marginRight: 6 }} />
              <Text style={styles.speedPillText}>Stock Ledger</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3. INSTAGRAM-INSPIRED: LIVE CUSTOMER OUTREACH & ACTIVITY STREAM */}
        <View style={styles.streamSection}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>LIVE PIPELINE & FIELD STREAM</Text>
              <Text style={styles.sectionHeaderSub}>Recent customer activity & direct outreach</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Pipeline')} activeOpacity={0.7}>
              <Text style={styles.sectionLinkText}>Full CRM →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.streamCard}>
            {activeStreamItems.map((item, idx) => (
              <View
                key={item.id || idx}
                style={[
                  styles.streamRow,
                  idx === activeStreamItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.streamAvatar, { backgroundColor: item.avatarBg || '#eff6ff' }]}>
                  <Text style={[styles.streamAvatarText, { color: item.avatarColor || '#0066FF' }]}>
                    {item.name ? item.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>

                <View style={styles.streamMeta}>
                  <View style={styles.streamNameRow}>
                    <Text style={styles.streamName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.streamStageBadge, { backgroundColor: item.stageBg || '#eff6ff' }]}>
                      <Text style={[styles.streamStageText, { color: item.stageColor || '#0066FF' }]}>
                        {item.stage || 'NEW'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.streamSub} numberOfLines={1}>
                    ⚡ {item.capacity || 3.3} kWp • 📍 {item.city || 'Site Location'} • ₹{(item.value || 185000).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* 1-Tap Micro Actions */}
                <View style={styles.streamActions}>
                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => handlePhoneCall(item.mobile)}
                    activeOpacity={0.7}
                  >
                    <Phone size={13} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.microActionBtn, { backgroundColor: '#dcfce7' }]}
                    onPress={() => handleWhatsAppDirect(item)}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={13} color="#15803d" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4. UNIFIED EXECUTIVE PERFORMANCE STRIP */}
        <View style={styles.kpiStripCard}>
          <View style={styles.kpiStripCol}>
            <Text style={styles.kpiStripLabel}>ORDER BOOK</Text>
            <Text style={styles.kpiStripVal}>₹{totalRevenueLakhs}L</Text>
            <Text style={styles.kpiStripHint}>Committed</Text>
          </View>
          <View style={styles.kpiStripDivider} />
          <View style={styles.kpiStripCol}>
            <Text style={styles.kpiStripLabel}>FLEET</Text>
            <Text style={styles.kpiStripVal}>{totalCapacityKWp} kW</Text>
            <Text style={styles.kpiStripHint}>Energized</Text>
          </View>
          <View style={styles.kpiStripDivider} />
          <View style={styles.kpiStripCol}>
            <Text style={styles.kpiStripLabel}>DBT SUBSIDY</Text>
            <Text style={[styles.kpiStripVal, { color: '#059669' }]}>₹78k</Text>
            <Text style={styles.kpiStripHint}>Max / Site</Text>
          </View>
          <View style={styles.kpiStripDivider} />
          <View style={styles.kpiStripCol}>
            <Text style={styles.kpiStripLabel}>TURNAROUND</Text>
            <Text style={[styles.kpiStripVal, { color: '#7c3aed' }]}>14.8d</Text>
            <Text style={styles.kpiStripHint}>Avg Cycle</Text>
          </View>
        </View>

        {/* 4. PERIODIC HORIZON COMPARATIVE ANALYSIS MODULE */}
        <View style={styles.horizonSectionCard}>
          <View style={styles.horizonHeader}>
            <View style={styles.horizonHeaderLeft}>
              <View style={styles.horizonPill}>
                <View style={styles.horizonPillDot} />
                <Text style={styles.horizonPillText}>PERIOD COMPARATIVE ANALYSIS</Text>
              </View>
              <Text style={styles.horizonTitle}>{activeHorizonConfig.label}</Text>
              <Text style={styles.horizonSub}>{activeHorizonConfig.sublabel}</Text>
            </View>
          </View>

          {/* HORIZON SELECTOR TABS */}
          <View style={styles.horizonTabsContainer}>
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

          {/* METRIC FILTER BUTTONS (BOTH / CLIENTS / REVENUE) */}
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

          {/* HORIZON SCORECARDS GRID */}
          <View style={styles.scorecardsGrid}>
            <View style={[styles.scorecardItem, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
              <Text style={styles.scorecardLabel}>SUCCESSFUL CLIENTS</Text>
              <Text style={[styles.scorecardVal, { color: '#1e40af' }]}>{totalHorizonClients} Sites</Text>
              <Text style={styles.scorecardSub}>Commissioned</Text>
            </View>

            <View style={[styles.scorecardItem, { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }]}>
              <Text style={styles.scorecardLabel}>REALIZED REVENUE</Text>
              <Text style={[styles.scorecardVal, { color: '#065f46' }]}>₹{totalHorizonRevenue}L</Text>
              <Text style={styles.scorecardSub}>100% Invoiced</Text>
            </View>

            <View style={[styles.scorecardItem, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
              <Text style={styles.scorecardLabel}>AVG DEAL SIZE</Text>
              <Text style={[styles.scorecardVal, { color: '#92400e' }]}>₹{avgHorizonDeal}L</Text>
              <Text style={styles.scorecardSub}>Per Rooftop</Text>
            </View>

            <View style={[styles.scorecardItem, { backgroundColor: '#f5f3ff', borderColor: '#ede9fe' }]}>
              <Text style={styles.scorecardLabel}>CAPACITY (kWp)</Text>
              <Text style={[styles.scorecardVal, { color: '#5b21b6' }]}>{totalHorizonCapacity} kWp</Text>
              <Text style={styles.scorecardSub}>Delivered</Text>
            </View>
          </View>

          {/* NATIVE VISUAL BAR TRAJECTORY CHART */}
          <View style={styles.chartContainer}>
            <View style={styles.chartLegendRow}>
              {(horizonMetricFocus === 'both' || horizonMetricFocus === 'clients') && (
                <View style={styles.chartLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: '#0284c7' }]} />
                  <Text style={styles.chartLegendText}>Clients</Text>
                </View>
              )}
              {(horizonMetricFocus === 'both' || horizonMetricFocus === 'revenue') && (
                <View style={styles.chartLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.chartLegendText}>Revenue (₹L)</Text>
                </View>
              )}
            </View>

            {/* BAR COLUMNS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartColumnsScroll}>
              {activeHorizonData.map((item, idx) => {
                const clientHeightPct = Math.max(12, Math.round((item.clients / maxClientsVal) * 110));
                const revenueHeightPct = Math.max(12, Math.round((item.revenue / maxRevenueVal) * 110));

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

          {/* DETAILED PERIOD BREAKDOWN LIST */}
          <View style={styles.breakdownList}>
            <Text style={styles.breakdownHeaderTitle}>PERIOD PERFORMANCE BREAKDOWN</Text>
            {activeHorizonData.map((row, i) => (
              <View key={row.period || i} style={styles.breakdownRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakdownPeriodTitle}>{row.period}</Text>
                  <View style={styles.breakdownSubRow}>
                    <Text style={styles.breakdownSubMeta}>
                      {row.capacity} kWp • Avg {row.avgDeal}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownClientsVal}>{row.clients} Clients</Text>
                  <Text style={styles.breakdownRevenueVal}>₹{row.revenue} Lakhs</Text>
                  <View style={styles.breakdownStatusPill}>
                    <Text style={styles.breakdownStatusText}>{row.growth || row.status || 'Active'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. SOLAR OPERATIONS LIFECYCLE FUNNEL (5 STAGES) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>SOLAR OPERATIONS FUNNEL</Text>
              <Text style={styles.sectionHeaderSub}>Live project volume across EPC milestones</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.sectionLinkText}>All Projects →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.funnelGrid}>
            <TouchableOpacity
              style={[styles.funnelItem, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}
              onPress={() => navigation.navigate('Pipeline')}
              activeOpacity={0.85}
            >
              <View style={styles.funnelItemTop}>
                <Text style={[styles.funnelStepNum, { color: '#0284c7' }]}>01</Text>
                <Users size={16} color="#0284c7" />
              </View>
              <Text style={styles.funnelItemVal}>{data.totalLeads}</Text>
              <Text style={styles.funnelItemLabel}>Inbound Leads</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelItem, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}
              onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
              activeOpacity={0.85}
            >
              <View style={styles.funnelItemTop}>
                <Text style={[styles.funnelStepNum, { color: '#d97706' }]}>02</Text>
                <MapPin size={16} color="#d97706" />
              </View>
              <Text style={styles.funnelItemVal}>{data.totalCustomers}</Text>
              <Text style={styles.funnelItemLabel}>Site Surveys</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelItem, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.85}
            >
              <View style={styles.funnelItemTop}>
                <Text style={[styles.funnelStepNum, { color: '#7c3aed' }]}>03</Text>
                <FileText size={16} color="#7c3aed" />
              </View>
              <Text style={styles.funnelItemVal}>{data.totalLeads > 0 ? Math.round(data.totalLeads * 0.7) : 0}</Text>
              <Text style={styles.funnelItemLabel}>Proposals Sent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelItem, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
              onPress={() => navigation.navigate('Projects')}
              activeOpacity={0.85}
            >
              <View style={styles.funnelItemTop}>
                <Text style={[styles.funnelStepNum, { color: '#2563eb' }]}>04</Text>
                <Briefcase size={16} color="#2563eb" />
              </View>
              <Text style={styles.funnelItemVal}>{data.totalProjects}</Text>
              <Text style={styles.funnelItemLabel}>Installations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.funnelItem, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
              onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })}
              activeOpacity={0.85}
            >
              <View style={styles.funnelItemTop}>
                <Text style={[styles.funnelStepNum, { color: '#059669' }]}>05</Text>
                <Landmark size={16} color="#059669" />
              </View>
              <Text style={styles.funnelItemVal}>{data.pendingInvoices}</Text>
              <Text style={styles.funnelItemLabel}>DBT Subsidies</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. CASHFLOW & WORKING CAPITAL WATERFALL */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>CASHFLOW & CAPITAL REALIZATION</Text>
              <Text style={styles.sectionHeaderSub}>Milestone collections & receivables aging</Text>
            </View>
            <View style={styles.orderBookPill}>
              <Text style={styles.orderBookPillText}>Order Book: ₹{totalRevenueLakhs}L</Text>
            </View>
          </View>

          {/* PROGRESS BARS */}
          <View style={styles.waterfallStack}>
            <View style={styles.waterfallBarItem}>
              <View style={styles.waterfallBarRow}>
                <Text style={styles.waterfallBarLabel}>Customer Advances Collected</Text>
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
                <Text style={styles.waterfallBarLabel}>Installation Milestones In Flight</Text>
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
                <Text style={styles.waterfallBarLabel}>National DBT Subsidy Clearing</Text>
                <Text style={[styles.waterfallBarVal, { color: '#0066FF' }]}>
                  {subsidyFunnel[3]?.amount || '₹7.02 Lakhs'}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '45%', backgroundColor: '#0066FF' }]} />
              </View>
            </View>
          </View>

          {/* AGING BREAKDOWN 3-COLUMN */}
          <Text style={styles.agingSectionTitle}>RECEIVABLES AGING BREAKDOWN</Text>
          <View style={styles.agingGrid}>
            <View style={[styles.agingCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
              <Text style={styles.agingLabel}>&lt; 15 DAYS</Text>
              <Text style={styles.agingVal}>
                ₹{data.aging ? (data.aging.under15 / 100000).toFixed(1) : '11.2'}L
              </Text>
              <Text style={[styles.agingBadge, { color: '#059669' }]}>On Track</Text>
            </View>

            <View style={[styles.agingCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
              <Text style={[styles.agingLabel, { color: '#b45309' }]}>15–30 DAYS</Text>
              <Text style={[styles.agingVal, { color: '#92400e' }]}>
                ₹{data.aging ? (data.aging.under30 / 100000).toFixed(1) : '5.4'}L
              </Text>
              <Text style={[styles.agingBadge, { color: '#b45309' }]}>Follow-up</Text>
            </View>

            <View style={[styles.agingCard, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
              <Text style={[styles.agingLabel, { color: '#be123c' }]}>&gt; 30 DAYS</Text>
              <Text style={[styles.agingVal, { color: '#9f1239' }]}>
                ₹{data.aging ? (data.aging.over30 / 100000).toFixed(1) : '2.0'}L
              </Text>
              <Text style={[styles.agingBadge, { color: '#be123c' }]}>Action Due</Text>
            </View>
          </View>
        </View>

        {/* 7. HARDWARE SUPPLY CHAIN & RUNWAY */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>HARDWARE STOCK RUNWAY</Text>
              <Text style={styles.sectionHeaderSub}>Estimated buffer days based on velocity</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Modules', { screen: 'INVENTORY' })}>
              <Text style={styles.sectionLinkText}>Stock Ledger →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inventoryList}>
            {inventoryRunway.map((item, idx) => (
              <View key={item.item || idx} style={styles.inventoryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inventoryItemTitle} numberOfLines={1}>{item.item}</Text>
                  <Text style={styles.inventoryStockText}>{item.stock}</Text>
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
                    {item.runway} Days
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 8. PM SURYA GHAR NATIONAL PORTAL SUBSIDY TRACKER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>PM SURYA GHAR: MUFT BIJLI YOJANA</Text>
              <Text style={styles.sectionHeaderSub}>Direct Benefit Transfer (DBT) progress</Text>
            </View>
            <View style={styles.subsidyMaxPill}>
              <Text style={styles.subsidyMaxPillText}>₹78,000 / Site</Text>
            </View>
          </View>

          <View style={styles.subsidyStepsList}>
            {subsidyFunnel.map((step) => (
              <View key={step.step} style={styles.subsidyStepRow}>
                <View style={styles.subsidyStepNumBadge}>
                  <Text style={styles.subsidyStepNumText}>{step.step}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.subsidyStepTitle}>{step.title}</Text>
                  <Text style={styles.subsidyStepSub}>{step.status}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subsidyStepCount}>{step.count} Consumers</Text>
                  <Text style={styles.subsidyStepAmt}>{step.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 9. SOLAR FLEET ENVIRONMENTAL & CARBON OFFSET TELEMETRY */}
        <View style={styles.environmentalCard}>
          <View style={styles.envHeader}>
            <View style={styles.envIconBadge}>
              <Leaf size={16} color="#34d399" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.envTitle}>Solar Fleet Environmental Telemetry</Text>
              <Text style={styles.envSub}>Clean energy generated & fossil emissions displaced</Text>
            </View>
          </View>

          <View style={styles.envGrid}>
            <View style={styles.envGridItem}>
              <View style={styles.envItemTop}>
                <Sun size={14} color="#f59e0b" />
                <Text style={styles.envItemLabel}>CLEAN ENERGY</Text>
              </View>
              <Text style={styles.envItemVal}>{cleanEnergyMWh} MWh</Text>
              <Text style={styles.envItemSub}>This Month (+18.4%)</Text>
            </View>

            <View style={styles.envGridItem}>
              <View style={styles.envItemTop}>
                <Leaf size={14} color="#10b981" />
                <Text style={styles.envItemLabel}>CO₂ MITIGATED</Text>
              </View>
              <Text style={styles.envItemVal}>{co2Tons} Tons</Text>
              <Text style={styles.envItemSub}>Emissions Saved</Text>
            </View>

            <View style={styles.envGridItem}>
              <View style={styles.envItemTop}>
                <Globe size={14} color="#38bdf8" />
                <Text style={styles.envItemLabel}>COAL SAVED</Text>
              </View>
              <Text style={styles.envItemVal}>{coalTons} Tons</Text>
              <Text style={styles.envItemSub}>Fossil Burning</Text>
            </View>

            <View style={styles.envGridItem}>
              <View style={styles.envItemTop}>
                <Award size={14} color="#a7f3d0" />
                <Text style={styles.envItemLabel}>TREES OFFSET</Text>
              </View>
              <Text style={styles.envItemVal}>{treesCount}</Text>
              <Text style={styles.envItemSub}>Forest Equivalent</Text>
            </View>
          </View>
        </View>

        {/* 10. SYSTEM HEALTH METRIC CARDS */}
        <View style={styles.systemHealthRow}>
          <TouchableOpacity
            style={styles.systemHealthCard}
            onPress={() => navigation.navigate('Modules', { screen: 'SERVICE' })}
            activeOpacity={0.8}
          >
            <ShieldCheck size={20} color="#059669" />
            <Text style={styles.systemHealthNumber}>{data.openTickets} Open</Text>
            <Text style={styles.systemHealthLabel}>AMC & Service Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.systemHealthCard}
            onPress={() => navigation.navigate('Modules', { screen: 'INVENTORY' })}
            activeOpacity={0.8}
          >
            <Package size={20} color="#0066FF" />
            <Text style={styles.systemHealthNumber}>Healthy</Text>
            <Text style={styles.systemHealthLabel}>Warehouse Stock</Text>
          </TouchableOpacity>
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
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  // 1. WhereReady Field Experience - Today's Operational Dispatch Hero (Uber-inspired)
  dispatchHeroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  dispatchHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  dispatchPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  dispatchDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  dispatchHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  dispatchSubline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 16,
  },
  priorityBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  priorityBoxLeft: {
    flex: 1,
  },
  priorityTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  priorityLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  priorityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // 2. Fast Discoverability Toolkit (Blinkit-inspired)
  speedSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  speedScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  speedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  speedPillPrimary: {
    backgroundColor: '#091326',
    borderColor: '#1e293b',
  },
  speedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  speedPillTextPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // 3. Live Customer Outreach & Activity Stream (Instagram-inspired)
  streamSection: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sectionLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  streamCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  streamAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamAvatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  streamMeta: {
    flex: 1,
  },
  streamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  streamName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  streamStageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streamStageText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  streamSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  streamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 4. Unified Performance Strip
  kpiStripCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiStripCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiStripLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  kpiStripVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiStripHint: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 1,
  },
  kpiStripDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#f1f5f9',
  },

  // 3. Ticker Cards
  tickerScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
    marginBottom: 16,
  },
  tickerCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tickerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tickerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  tickerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginVertical: 2,
  },
  tickerChangePositive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  // 4. Horizon Section Card
  horizonSectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  horizonHeader: {
    marginBottom: 12,
  },
  horizonHeaderLeft: {},
  horizonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  horizonPillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0066FF',
    marginRight: 5,
  },
  horizonPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  horizonTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  horizonSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  horizonTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 10,
  },
  horizonTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  horizonTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  horizonTabBtnText: {
    fontSize: 11,
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
    gap: 8,
    marginBottom: 14,
  },
  metricFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricFilterBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  metricFilterBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  metricFilterBtnTextActive: {
    color: '#ffffff',
  },

  // Scorecards
  scorecardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  scorecardItem: {
    width: (SCREEN_WIDTH - 32 - 36 - 8) / 2,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  scorecardLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  scorecardVal: {
    fontSize: 17,
    fontWeight: '900',
    marginVertical: 2,
  },
  scorecardSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },

  // Chart Container
  chartContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  chartLegendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  chartColumnsScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chartColumnGroup: {
    alignItems: 'center',
    width: 60,
  },
  chartBarsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 120,
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
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartColumnXLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },

  // Breakdown List
  breakdownList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  breakdownHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  breakdownPeriodTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  breakdownSubMeta: {
    fontSize: 10,
    color: '#64748b',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownClientsVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  breakdownRevenueVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    marginTop: 1,
  },
  breakdownStatusPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  breakdownStatusText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },

  // General Section Card
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // 5. Funnel Grid
  funnelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  funnelItem: {
    width: (SCREEN_WIDTH - 32 - 36 - 8) / 2,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  funnelItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  funnelStepNum: {
    fontSize: 11,
    fontWeight: '900',
  },
  funnelItemVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 2,
  },
  funnelItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },

  // 6. Waterfall
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
    gap: 12,
    marginBottom: 16,
  },
  waterfallBarItem: {},
  waterfallBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    height: 7,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  agingSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  agingGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  agingCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  agingLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  agingVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 2,
  },
  agingBadge: {
    fontSize: 8,
    fontWeight: '800',
  },

  // 7. Inventory List
  inventoryList: {
    gap: 8,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    padding: 12,
  },
  inventoryItemTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  inventoryStockText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  runwayBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  runwayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // 8. Subsidy Tracker
  subsidyMaxPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subsidyMaxPillText: {
    fontSize: 9,
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
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    padding: 12,
  },
  subsidyStepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsidyStepNumText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  subsidyStepTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  subsidyStepSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  subsidyStepCount: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
  },
  subsidyStepAmt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    marginTop: 1,
  },

  // 9. Environmental Card
  environmentalCard: {
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  envIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envTitle: {
    fontSize: 13,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  envGridItem: {
    width: (SCREEN_WIDTH - 32 - 36 - 8) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 10,
  },
  envItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  envItemLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  envItemVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 2,
  },
  envItemSub: {
    fontSize: 8,
    fontWeight: '600',
    color: '#34d399',
  },

  // 10. System Health Row
  systemHealthRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  systemHealthCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  systemHealthNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6,
    marginBottom: 2,
  },
  systemHealthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
});
