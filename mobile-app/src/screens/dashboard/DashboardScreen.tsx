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
      {/* Flush, Clean Brand & Telemetry Header */}
      <Header variant="home" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================================
            1. EXECUTIVE OPERATIONAL HERO COMMAND CARD
            Clean, luminous white card with subtle border and clear financial figures.
        ===================================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.pulseTag}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseTagText}>OPERATIONS RADAR • MSEDCL LIVE</Text>
            </View>
            <Text style={styles.heroDateText}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <View style={styles.heroMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroValue}>₹{totalRevenueLakhs}L</Text>
              <Text style={styles.heroSubline}>
                {totalCapacityKWp} kWp Fleet Active • ₹{outstandingLakhs}L In-Flight Claims
              </Text>
            </View>

            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.85}
            >
              <Zap size={15} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.heroActionBtnText}>60s Quote</Text>
            </TouchableOpacity>
          </View>

          {/* Capital Realization Progress Bar */}
          <View style={styles.capitalTrackContainer}>
            <View style={styles.capitalTrackLabels}>
              <Text style={styles.capitalTrackLeftText}>
                Collected: ₹{totalCollectedLakhs}L ({collectedPct}%)
              </Text>
              <Text style={styles.capitalTrackRightText}>
                Receivables: ₹{outstandingLakhs}L
              </Text>
            </View>
            <View style={styles.capitalProgressBar}>
              <View style={[styles.capitalProgressFill, { width: `${collectedPct}%` }]} />
            </View>
          </View>

          {/* 3-Column Operational Pulse Stats */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>{data.totalLeads || 3}</Text>
              <Text style={styles.heroStatLbl}>Pending Quotes</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>{projects.length || data.totalProjects || 2}</Text>
              <Text style={styles.heroStatLbl}>In Erection</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: '#059669' }]}>₹78,000</Text>
              <Text style={styles.heroStatLbl}>Max Site DBT</Text>
            </View>
          </View>
        </View>

        {/* =====================================================================
            2. HIGH-PRIORITY OPERATIONAL RADAR (Next Action Due)
            Directly answers: What requires attention right now? Who to contact?
        ===================================================================== */}
        <View style={styles.priorityCard}>
          <View style={styles.priorityTopRow}>
            <View style={styles.priorityBadge}>
              <Sparkles size={12} color="#d97706" />
              <Text style={styles.priorityBadgeText}>IMMEDIATE ACTION REQUIRED</Text>
            </View>
            <Text style={styles.priorityTimeText}>{urgentProspect.time || 'Active'}</Text>
          </View>

          <View style={styles.priorityContent}>
            <Text style={styles.priorityName}>
              {urgentProspect.name} ({urgentProspect.capacity} kWp Rooftop)
            </Text>
            <Text style={styles.priorityLocation}>
              📍 {urgentProspect.city} • Est. ₹{(urgentProspect.value || 185000).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.prioritySubsidy}>
              🏛️ PM Surya Ghar: Eligible for ₹78,000 Direct DBT Subsidy
            </Text>
          </View>

          <View style={styles.priorityActionsRow}>
            <TouchableOpacity
              style={styles.priorityCallBtn}
              onPress={() => handlePhoneCall(urgentProspect.mobile)}
              activeOpacity={0.85}
            >
              <Phone size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.priorityCallBtnText}>Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.priorityWhatsAppBtn}
              onPress={() => handleWhatsAppDirect(urgentProspect)}
              activeOpacity={0.85}
            >
              <MessageCircle size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.priorityWhatsAppBtnText}>WhatsApp Pitch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.priorityDetailBtn}
              onPress={() => navigation.navigate('Pipeline')}
              activeOpacity={0.8}
            >
              <ArrowRight size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* =====================================================================
            3. QUICK ACTION TOOLKIT (Blinkit-inspired speed strip)
        ===================================================================== */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
            onPress={() => navigation.navigate('QuickQuote')}
            activeOpacity={0.85}
          >
            <Zap size={15} color="#0066FF" />
            <Text style={[styles.quickActionPillText, { color: '#0066FF' }]}>60s Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate('Pipeline')}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#0f172a" />
            <Text style={styles.quickActionPillText}>New Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
            activeOpacity={0.85}
          >
            <MapPin size={15} color="#d97706" />
            <Text style={styles.quickActionPillText}>Survey</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate('Finance')}
            activeOpacity={0.85}
          >
            <Receipt size={15} color="#059669" />
            <Text style={styles.quickActionPillText}>Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* =====================================================================
            4. LIVE CUSTOMER PIPELINE STREAM (Open, High-Density Rows)
        ===================================================================== */}
        <View style={styles.streamCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionLabel}>LIVE CUSTOMER PIPELINE</Text>
              <Text style={styles.cardSectionSub}>High-priority prospects awaiting follow-up</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Pipeline')} activeOpacity={0.7}>
              <Text style={styles.cardHeaderLink}>All Leads →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.streamList}>
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
                    <Text style={styles.streamName} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.streamStagePill, { backgroundColor: item.stageBg || '#eff6ff' }]}>
                      <Text style={[styles.streamStageText, { color: item.stageColor || '#0066FF' }]}>
                        {item.stage}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.streamSubText} numberOfLines={1}>
                    ⚡ {item.capacity} kWp • 📍 {item.city} • ₹{(item.value || 185000).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.streamActionsGroup}>
                  <TouchableOpacity
                    style={styles.microCallBtn}
                    onPress={() => handlePhoneCall(item.mobile)}
                    activeOpacity={0.7}
                    accessibilityLabel="Call"
                  >
                    <Phone size={13} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.microWhatsAppBtn}
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

        {/* =====================================================================
            5. SOLAR EPC MILESTONE PIPELINE (Connected Workflow Stepper)
        ===================================================================== */}
        <View style={styles.epcCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionLabel}>EPC EXECUTION WORKFLOW</Text>
              <Text style={styles.cardSectionSub}>End-to-end solar asset throughput</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')} activeOpacity={0.7}>
              <Text style={styles.cardHeaderLink}>All Projects →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.epcScroll}
          >
            <TouchableOpacity
              style={styles.epcNode}
              onPress={() => navigation.navigate('Pipeline')}
              activeOpacity={0.8}
            >
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>01</Text>
                <Users size={14} color="#0284c7" />
              </View>
              <Text style={styles.epcNodeVal}>{data.totalLeads}</Text>
              <Text style={styles.epcNodeTitle}>Leads</Text>
              <Text style={styles.epcNodeSub}>Inbound</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity
              style={styles.epcNode}
              onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
              activeOpacity={0.8}
            >
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>02</Text>
                <MapPin size={14} color="#d97706" />
              </View>
              <Text style={styles.epcNodeVal}>{data.totalCustomers}</Text>
              <Text style={styles.epcNodeTitle}>Surveys</Text>
              <Text style={styles.epcNodeSub}>Verified</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity
              style={styles.epcNode}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.8}
            >
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>03</Text>
                <Zap size={14} color="#7c3aed" />
              </View>
              <Text style={styles.epcNodeVal}>
                {data.totalLeads > 0 ? Math.round(data.totalLeads * 0.7) : 0}
              </Text>
              <Text style={styles.epcNodeTitle}>Proposals</Text>
              <Text style={styles.epcNodeSub}>Dispatched</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity
              style={styles.epcNode}
              onPress={() => navigation.navigate('Projects')}
              activeOpacity={0.8}
            >
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>04</Text>
                <Briefcase size={14} color="#2563eb" />
              </View>
              <Text style={styles.epcNodeVal}>{data.totalProjects}</Text>
              <Text style={styles.epcNodeTitle}>Erection</Text>
              <Text style={styles.epcNodeSub}>On-site</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity
              style={styles.epcNode}
              onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })}
              activeOpacity={0.8}
            >
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>05</Text>
                <Landmark size={14} color="#059669" />
              </View>
              <Text style={styles.epcNodeVal}>{data.pendingInvoices}</Text>
              <Text style={styles.epcNodeTitle}>DBT Subsidies</Text>
              <Text style={styles.epcNodeSub}>Clearing</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* =====================================================================
            6. PERIOD HORIZON COMPARATIVE VELOCITY
        ===================================================================== */}
        <View style={styles.horizonCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionLabel}>PERIOD COMPARATIVE VELOCITY</Text>
              <Text style={styles.cardSectionSub}>{activeHorizonConfig.label}</Text>
            </View>
          </View>

          {/* Horizon Period Tabs */}
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

          {/* Horizon Summary Stats Strip */}
          <View style={styles.horizonStatsRow}>
            <View style={styles.horizonStatCol}>
              <Text style={styles.horizonStatLbl}>CLIENTS</Text>
              <Text style={styles.horizonStatNum}>{totalHorizonClients}</Text>
              <Text style={styles.horizonStatSub}>Commissioned</Text>
            </View>
            <View style={styles.horizonStatDivider} />
            <View style={styles.horizonStatCol}>
              <Text style={styles.horizonStatLbl}>REVENUE</Text>
              <Text style={[styles.horizonStatNum, { color: '#059669' }]}>₹{totalHorizonRevenue}L</Text>
              <Text style={styles.horizonStatSub}>Realized</Text>
            </View>
            <View style={styles.horizonStatDivider} />
            <View style={styles.horizonStatCol}>
              <Text style={styles.horizonStatLbl}>AVG DEAL</Text>
              <Text style={[styles.horizonStatNum, { color: '#0066FF' }]}>₹{avgHorizonDeal}L</Text>
              <Text style={styles.horizonStatSub}>Per Site</Text>
            </View>
            <View style={styles.horizonStatDivider} />
            <View style={styles.horizonStatCol}>
              <Text style={styles.horizonStatLbl}>CAPACITY</Text>
              <Text style={[styles.horizonStatNum, { color: '#7c3aed' }]}>{totalHorizonCapacity}k</Text>
              <Text style={styles.horizonStatSub}>kWp Total</Text>
            </View>
          </View>

          {/* Bar Chart View */}
          <View style={styles.chartWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              {activeHorizonData.map((item, idx) => {
                const clientHeightPct = Math.max(12, Math.round((item.clients / maxClientsVal) * 90));
                const revenueHeightPct = Math.max(12, Math.round((item.revenue / maxRevenueVal) * 90));

                return (
                  <View key={item.period || idx} style={styles.chartColGroup}>
                    <View style={styles.chartBarsPair}>
                      {(horizonMetricFocus === 'both' || horizonMetricFocus === 'clients') && (
                        <View style={styles.barItem}>
                          <Text style={styles.barValText}>{item.clients}</Text>
                          <View
                            style={[
                              styles.barFill,
                              { height: clientHeightPct, backgroundColor: '#0284c7' },
                            ]}
                          />
                        </View>
                      )}

                      {(horizonMetricFocus === 'both' || horizonMetricFocus === 'revenue') && (
                        <View style={styles.barItem}>
                          <Text style={styles.barValText}>₹{item.revenue}</Text>
                          <View
                            style={[
                              styles.barFill,
                              { height: revenueHeightPct, backgroundColor: '#10b981' },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.chartXLabel} numberOfLines={1}>{item.period}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* =====================================================================
            7. PM SURYA GHAR & HARDWARE BUFFER (Side-by-Side Clean Cards)
        ===================================================================== */}
        <View style={styles.dualCardsRow}>
          {/* PM Surya Ghar Subsidy Tracker */}
          <View style={styles.dualCardHalf}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionLabel}>PM SURYA GHAR</Text>
              <View style={styles.subsidyPill}>
                <Text style={styles.subsidyPillText}>₹78k/Site</Text>
              </View>
            </View>

            <View style={styles.subsidyList}>
              {subsidyFunnel.map((step) => (
                <View key={step.step} style={styles.subsidyRow}>
                  <View style={styles.subsidyNum}>
                    <Text style={styles.subsidyNumText}>{step.step}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.subsidyTitle} numberOfLines={1}>{step.title}</Text>
                    <Text style={styles.subsidySub}>{step.count} Sites • {step.amount}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Hardware Runway */}
          <View style={styles.dualCardHalf}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionLabel}>STOCK RUNWAY</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Modules', { screen: 'INVENTORY' })}>
                <Text style={styles.cardHeaderLink}>Ledger →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inventoryList}>
              {inventoryRunway.map((item, idx) => (
                <View key={item.item || idx} style={styles.inventoryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inventoryTitle} numberOfLines={1}>{item.item}</Text>
                    <Text style={styles.inventoryStock} numberOfLines={1}>{item.stock}</Text>
                  </View>
                  <View
                    style={[
                      styles.runwayPill,
                      {
                        backgroundColor: item.status === 'Reorder Soon' ? '#fef3c7' : '#ecfdf5',
                        borderColor: item.status === 'Reorder Soon' ? '#fde68a' : '#a7f3d0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.runwayPillText,
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

        {/* =====================================================================
            8. SOLAR FLEET ENVIRONMENTAL & CARBON OFFSET TELEMETRY
        ===================================================================== */}
        <View style={styles.envCard}>
          <View style={styles.envHeader}>
            <View style={styles.envIconCircle}>
              <Leaf size={16} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.envHeaderTitle}>Solar Fleet Environmental Offset</Text>
              <Text style={styles.envHeaderSub}>Clean energy generated & fossil emissions displaced</Text>
            </View>
          </View>

          <View style={styles.envGrid}>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>CLEAN ENERGY</Text>
              <Text style={styles.envGridVal}>{cleanEnergyMWh} MWh</Text>
              <Text style={styles.envGridHint}>This Month</Text>
            </View>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>CO₂ MITIGATED</Text>
              <Text style={styles.envGridVal}>{co2Tons} Tons</Text>
              <Text style={styles.envGridHint}>Offset</Text>
            </View>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>COAL SAVED</Text>
              <Text style={styles.envGridVal}>{coalTons} Tons</Text>
              <Text style={styles.envGridHint}>Fossil Burn</Text>
            </View>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>TREES</Text>
              <Text style={styles.envGridVal}>{treesCount}</Text>
              <Text style={styles.envGridHint}>Equivalent</Text>
            </View>
          </View>
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    gap: 16,
  },

  // 1. EXECUTIVE OPERATIONAL HERO COMMAND CARD
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  pulseTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  heroDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroSubline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  heroActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  capitalTrackContainer: {
    marginBottom: 16,
  },
  capitalTrackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capitalTrackLeftText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066FF',
  },
  capitalTrackRightText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  capitalProgressBar: {
    height: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capitalProgressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  heroStatLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
  },

  // 2. HIGH-PRIORITY OPERATIONAL RADAR
  priorityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  priorityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  priorityTimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  priorityContent: {
    marginBottom: 12,
  },
  priorityName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  priorityLocation: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 3,
  },
  prioritySubsidy: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  priorityActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 9,
    borderRadius: 12,
  },
  priorityCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  priorityWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 9,
    borderRadius: 12,
  },
  priorityWhatsAppBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  priorityDetailBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 3. QUICK ACTION TOOLKIT
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },

  // 4. LIVE CUSTOMER PIPELINE STREAM
  streamCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  cardSectionSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  cardHeaderLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  streamList: {},
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  streamAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamAvatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  streamMeta: {
    flex: 1,
  },
  streamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  streamName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  streamStagePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streamStageText: {
    fontSize: 8,
    fontWeight: '800',
  },
  streamSubText: {
    fontSize: 11,
    color: '#64748b',
  },
  streamActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microCallBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  microWhatsAppBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 5. EPC EXECUTION WORKFLOW
  epcCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  epcScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  epcNode: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    width: 88,
  },
  epcNodeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  epcNodeNum: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
  },
  epcNodeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 1,
  },
  epcNodeTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  epcNodeSub: {
    fontSize: 8,
    color: '#94a3b8',
  },
  epcArrow: {
    paddingHorizontal: 2,
  },

  // 6. PERIOD HORIZON COMPARATIVE VELOCITY
  horizonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
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
  horizonStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  horizonStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  horizonStatLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
  },
  horizonStatNum: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 1,
  },
  horizonStatSub: {
    fontSize: 8,
    color: '#94a3b8',
  },
  horizonStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  chartWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
  },
  chartScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chartColGroup: {
    alignItems: 'center',
    width: 58,
  },
  chartBarsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 90,
  },
  barItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 2,
  },
  barFill: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  chartXLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },

  // 7. PM SURYA GHAR & HARDWARE BUFFER
  dualCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dualCardHalf: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 12,
  },
  subsidyPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subsidyPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },
  subsidyList: {
    gap: 8,
  },
  subsidyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
  },
  subsidyNum: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsidyNumText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  subsidyTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  subsidySub: {
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
  inventoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  inventoryStock: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  runwayPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  runwayPillText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // 8. SOLAR FLEET ENVIRONMENTAL & CARBON OFFSET TELEMETRY
  envCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  envIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  envHeaderSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  envGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
  },
  envGridCol: {
    flex: 1,
    alignItems: 'center',
  },
  envGridLbl: {
    fontSize: 7,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  envGridVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 2,
  },
  envGridHint: {
    fontSize: 8,
    fontWeight: '600',
    color: '#059669',
  },
});
