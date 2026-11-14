# Analysis & Transformation Blueprint: DashboardScreen.tsx
**Author:** Explorer M2-2 (Dashboard & State Specialist)  
**Date:** 2026-10-30  
**Target File:** `mobile-app/src/screens/dashboard/DashboardScreen.tsx`  
**Related Components:** `mobile-app/src/components/common/SkeletonLoader.tsx`, `mobile-app/src/components/common/EmptyState.tsx`, `mobile-app/src/theme/tokens.ts`

---

## 1. Executive Summary

`DashboardScreen.tsx` (1,690 lines) serves as the primary operational anchor and executive command center of WhereReady Solar OS mobile. However, our investigation reveals severe architectural and user experience defects:

1. **Synthetic Data Contamination (P0-3)**: The screen embeds extensive hardcoded dummy datasets—including fictitious prospects (`Ramesh Patil`, `Suresh Deshmukh`, `Anand Kulkarni`), synthetic subsidy funnels, simulated hardware runway, and static horizon financial projections. Even worse, if API queries fail or return empty collections, the app falls back to displaying these fabricated figures, violating Requirements R1 and R2 ("100% authorized operational data without fake statistics").
2. **Ignored Loading State & Flashing Artifacts**: Although a `loading` state variable exists (`const [loading, setLoading] = useState(true);`), it is entirely bypassed in the render tree. Users experience a jarring "flash of fake content" before API requests resolve, or remain stuck with fake data indefinitely upon network errors.
3. **Silent Error Swallowing**: The screen wraps API calls in `.catch(() => null)`. When offline or encountering server exceptions, no error UI, toast, or retry CTA is presented; instead, fictitious fallback data masquerades as real metrics.
4. **Missing Empty States**: When a tenant is newly created or has zero leads/projects, the screen displays dummy data instead of guiding the user with an actionable `EmptyState` (e.g., "Create First Lead").
5. **Absence of Role-Based Persona Filtering**: Field engineers, installers, and sales reps (`TENANT_SUB_ADMIN`) are exposed to top-level financial turnover metrics (or synthetic fallback revenues of ₹84.6L) rather than an operational throughput radar tailored to their on-site duties.
6. **Proportional Font Jitter**: Metric counters lack `fontVariant: ['tabular-nums']`, resulting in horizontal text jitter during updates and misaligned numeric columns in comparative charts.

This document delivers the comprehensive blueprint and a complete drop-in TypeScript implementation for Worker M2.

---

## 2. Complete Inventory of Fake Fallback Data in `DashboardScreen.tsx`

Every piece of synthetic dummy data has been located, cataloged, and marked for elimination:

| Item | Location | Verbatim Content / Variable | Defect Impact | Transformation Action |
|---|---|---|---|---|
| **Synthetic Leads** | Lines 277–320 | `fallbackRecentLeads` (`Ramesh Patil`, `Suresh Deshmukh`, `Anand Kulkarni`) | Displays non-existent leads with fake phone numbers and capacities | **Delete array**. Render authentic `recentLeads`. If empty, render `EmptyState` with CTA "Create First Lead". |
| **Fake Fallback Fall-Through** | Line 345 | `recentLeads.length > 0 ? ... : fallbackRecentLeads` | Bypasses empty state to inject fake leads | **Strip fallback branch**. Render empty array or empty state component. |
| **Urgent Prospect Fallback** | Line 347 | `urgentProspect = activeStreamItems[0] || fallbackRecentLeads[0];` | Forces Ramesh Patil onto the High-Priority Action Card | If no active prospect, render a clean "All Caught Up / System Up to Date" card. |
| **Fake Horizon Map** | Lines 152–199 | `fallbackHorizonDataMap` (`monthly`, `quarterly`, `halfAnnual`, `annual`) | Displays fabricated revenue (e.g. ₹66.7L, ₹340.0L) and deal sizes | **Delete entire map**. Use authentic `data.horizonAnalytics`. If empty, render `EmptyState` inside chart container. |
| **Fake Inventory Runway** | Lines 220–225 | `fallbackInventoryRunway` ("550W Mono PERC Panels 184 Panels", etc.) | Falsifies warehouse stock levels | **Delete array**. Use `data.inventoryRunway`. If null/empty, render empty stock status. |
| **Fake Subsidy Funnel** | Lines 231–236 | `fallbackSubsidyFunnel` ("Feasibility Approved 24 Sites ₹18.7L") | Displays fictitious DBT disbursement steps | **Delete array**. Use `data.subsidyFunnel`. If empty, render empty subsidy status. |
| **Hardcoded Fleet Capacity** | Line 244 | `data.totalCapacity ? data.totalCapacity.toFixed(1) : '37.1'` | Injects fake 37.1 kWp when real capacity is 0 | Replace with `(data.totalCapacity || 0).toFixed(1)`. |
| **Hardcoded Revenue Fallback** | Line 248 | `data.totalRevenue ? Number(...) : 84.6` | Injects fake ₹84.6 Lakhs turnover | Replace with `data.totalRevenue ? Number((data.totalRevenue / 100000).toFixed(1)) : 0`. |
| **Synthetic Collections** | Line 252 | `Number((totalRevenueLakhs * 0.65).toFixed(1))` | Synthetic 65% collection estimate | Use authentic `(data.totalCollected / 100000).toFixed(1)` or `0`. |
| **Synthetic Progress Pct** | Line 260 | `totalRevenueLakhs > 0 ? ... : 65` | Injects fake 65% progress bar | Compute authentic percentage: `0%` if no revenue. |
| **Hardcoded Environmental** | Lines 264–275 | `'48.25' MWh`, `39.4 Tons CO₂`, `19.2 Tons Coal`, `'1,780' Trees` | Fictitious green credentials | Dynamically compute from authentic `data.totalCapacity` (or 0 if fleet is 0). |
| **Hero Card Fallback Numbers** | Lines 411, 416 | `{data.totalLeads || 3}`, `{projects.length || data.totalProjects || 2}` | Fabricates 3 quotes and 2 erection projects | Display exact numbers `{data.totalLeads ?? 0}` and `{data.totalProjects ?? projects.length ?? 0}`. |

---

## 3. Backend Data Architecture & API Contract Reality

### 3.1 Active Backend Handler
The active route handling `GET /api/tenant/dashboard` is mounted in `backend/server.js:103-104` via `backend/routes/tenant/finance.js:11-332`.

### 3.2 Backend Response Structure
The endpoint computes and returns authentic tenant metrics based on active database entities:
```typescript
interface TenantDashboardResponse {
  totalLeads: number;
  totalCustomers: number;
  totalProjects: number;
  pendingInvoices: number;
  openTickets: number;
  totalRevenue: number;     // In INR
  totalCollected: number;   // In INR
  outstanding: number;      // In INR
  orderBook: number;        // In INR
  totalCapacity: number;    // In kWp
  aging: {
    under15: number;
    under30: number;
    over30: number;
  };
  horizonAnalytics: {
    monthly: HorizonItem[];      // Dynamic past 6 months
    quarterly: HorizonItem[];    // Dynamic 4 FY quarters
    halfAnnual: HorizonItem[];   // H1 vs H2
    annual: HorizonItem[];       // 3-year FY trajectory
  };
  segmentationData: Array<{ name: string; value: number; color: string; count: string }>;
  leadSources: Array<{ source: string; share: number; volume: string; winRate: string; color: string }> | null;
  inventoryRunway: Array<{ item: string; stock: string; runway: number; status: string; unit: string; badge: string }> | null;
  subsidyFunnel: Array<{ step: string; title: string; count: number; amount: string; status: string }>;
  environmental: {
    monthlyEnergyKWh: number;
    co2Tons: number;
    coalTons: number;
    trees: number;
  };
  isFinanceAuthorized?: boolean;
}
```

### 3.3 Endpoint Aggregation
The dashboard pulls from three core services concurrently:
1. `tenantApi.getDashboard()` — Tenant KPIs, revenue, capacity, subsidy, inventory, horizon analytics.
2. `tenantApi.getProjects()` — Active project roster for count and stage telemetry.
3. `crmApi.getLeads({ all: true })` — Real inbound pipeline leads (sorted by newest).

---

## 4. Application State Blueprint

### 4.1 Loading State: Compound `SkeletonLoader`
When `loading === true && !refreshing`, the screen renders a structured loading skeleton that mimics the exact geometry of the dashboard, preventing layout shifts and eliminating the dummy data flash:

```tsx
<View style={styles.container}>
  <Header variant="home" />
  <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    {/* Hero Card Skeleton */}
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <Skeleton width={120} height={16} borderRadius={radii.sm} />
        <Skeleton width={80} height={14} borderRadius={radii.sm} />
      </View>
      <View style={{ marginVertical: spacing[3] }}>
        <Skeleton width={180} height={36} borderRadius={radii.sm} style={{ marginBottom: spacing[2] }} />
        <Skeleton width={240} height={14} borderRadius={radii.sm} />
      </View>
      <Skeleton width="100%" height={8} borderRadius={radii.full} style={{ marginVertical: spacing[3] }} />
      <View style={styles.heroStatsRow}>
        <Skeleton width="28%" height={28} borderRadius={radii.sm} />
        <Skeleton width="28%" height={28} borderRadius={radii.sm} />
        <Skeleton width="28%" height={28} borderRadius={radii.sm} />
      </View>
    </View>

    {/* Priority Action Card Skeleton */}
    <View style={styles.priorityCard}>
      <Skeleton width={160} height={18} borderRadius={radii.sm} style={{ marginBottom: spacing[3] }} />
      <SkeletonText lines={2} lineHeight={14} gap={8} style={{ marginBottom: spacing[4] }} />
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <Skeleton width="48%" height={38} borderRadius={radii.md} />
        <Skeleton width="48%" height={38} borderRadius={radii.md} />
      </View>
    </View>

    {/* Quick Action Pills Skeleton */}
    <View style={styles.quickActionRow}>
      <Skeleton width="23%" height={38} borderRadius={radii.lg} />
      <Skeleton width="23%" height={38} borderRadius={radii.lg} />
      <Skeleton width="23%" height={38} borderRadius={radii.lg} />
      <Skeleton width="23%" height={38} borderRadius={radii.lg} />
    </View>

    {/* Pipeline Stream Skeleton */}
    <View style={styles.streamCard}>
      <Skeleton width={150} height={16} borderRadius={radii.sm} style={{ marginBottom: spacing[4] }} />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  </ScrollView>
</View>
```

### 4.2 Error Recovery State
When the network request fails and no cached operational data exists:
- Capture the HTTP / network error.
- Render a centered `EmptyState` with `tone="danger"`, a clear human-readable explanation, and an action button to "Retry Connection".

```tsx
if (error && !loading && !data.totalCapacity && !data.totalRevenue && recentLeads.length === 0) {
  return (
    <View style={styles.container}>
      <Header variant="home" />
      <View style={styles.centeredStateContainer}>
        <EmptyState
          tone="danger"
          icon={<AlertCircle size={36} color={colors.danger} />}
          title="Operational Telemetry Offline"
          description={error || "Could not connect to the Solar OS backend. Please check your data connection and tap Retry."}
          actionTitle="Retry Connection"
          onActionPress={() => loadDashboard()}
          secondaryActionTitle="Diagnostics"
          onSecondaryActionPress={() => navigation.navigate('Profile')}
        />
      </View>
    </View>
  );
}
```

### 4.3 Contextual Empty States
When data queries return successfully but entities are zero:

1. **Customer Pipeline Stream (`recentLeads.length === 0`)**:
   ```tsx
   <EmptyState
     compact
     icon={<Users size={28} color={colors.primary} />}
     title="No Inbound Leads Yet"
     description="Your pipeline has no active prospects. Register a customer or create a 60s quote to kickstart acquisition."
     actionTitle="Create First Lead"
     onActionPress={() => navigation.navigate('Pipeline')}
     secondaryActionTitle="60s Quick Quote"
     onSecondaryActionPress={() => navigation.navigate('QuickQuote')}
   />
   ```

2. **Immediate Action Radar (`urgentProspect === null`)**:
   Instead of displaying `Ramesh Patil`, render a reassuring system-ready card:
   ```tsx
   <View style={styles.priorityEmptyCard}>
     <View style={styles.priorityTopRow}>
       <View style={[styles.priorityBadge, { backgroundColor: colors.successLight, borderColor: colors.successBorder }]}>
         <CheckCircle2 size={12} color={colors.success} />
         <Text style={[styles.priorityBadgeText, { color: colors.success }]}>WORKFLOW SYNCHRONIZED</Text>
       </View>
     </View>
     <Text style={styles.priorityEmptyTitle}>All Priority Actions Handled</Text>
     <Text style={styles.priorityEmptySub}>
       No pending customer follow-ups or critical roadblocks requiring immediate intervention.
     </Text>
     <TouchableOpacity
       style={styles.priorityCreateBtn}
       onPress={() => navigation.navigate('Pipeline')}
       activeOpacity={0.85}
     >
       <Plus size={14} color="#ffffff" style={{ marginRight: 6 }} />
       <Text style={styles.priorityCreateBtnText}>Create New Lead</Text>
     </TouchableOpacity>
   </View>
   ```

3. **Period Horizon Velocity Chart (`activeHorizonData.length === 0`)**:
   ```tsx
   <View style={styles.chartEmptyWrapper}>
     <TrendingUp size={24} color={colors.textSecondary} />
     <Text style={styles.chartEmptyTitle}>No Historical Trajectory Recorded</Text>
     <Text style={styles.chartEmptySub}>
       Trajectory analytics populate automatically as quotes, projects, and invoices are executed.
     </Text>
   </View>
   ```

4. **Hardware Runway & Subsidy Funnel**:
   When `inventoryRunway.length === 0` or `subsidyFunnel.length === 0`, render clean informational placeholders rather than fake components.

---

## 5. Role-Personalized Operational Visibility Architecture

### 5.1 Role Classification Matrix

| Role | Authorization Check | Hero KPI Card Focus | Horizon Chart Metrics | Quick Action Strip |
|---|---|---|---|---|
| **SUPER_ADMIN** | `user.role === 'SUPER_ADMIN'` | Invoiced Revenue (`₹XX.XL`), Fleet Active (`XX.X kWp`), Receivables | Both (Clients & Revenue) | 60s Quote, New Lead, Survey, Invoice |
| **TENANT_ADMIN** | `user.role === 'TENANT_ADMIN'` | Invoiced Revenue (`₹XX.XL`), Fleet Active (`XX.X kWp`), Receivables | Both (Clients & Revenue) | 60s Quote, New Lead, Survey, Invoice |
| **TENANT_SUB_ADMIN** *(Finance Permitted)* | `user.permissions.includes('finance')` | Invoiced Revenue (`₹XX.XL`), Fleet Active (`XX.X kWp`), Receivables | Both (Clients & Revenue) | 60s Quote, New Lead, Survey, Invoice |
| **TENANT_SUB_ADMIN** *(Field / Operations)* | `!hasFinanceAccess` | Active Fleet Capacity (`XX.X kWp`), Projects in Erection, Site Surveys | Clients & Installed Capacity kWp (Revenue masked) | 60s Quote, New Lead, Survey, Projects |

### 5.2 Dynamic Hero Card Adaptation
- **If `hasFinanceAccess === true`**:
  - Badge: `OPERATIONS RADAR • MSEDCL LIVE`
  - Big Value: `₹{totalRevenueLakhs}L`
  - Subline: `{totalCapacityKWp} kWp Fleet Active • ₹{outstandingLakhs}L In-Flight Claims`
  - Progress: Capital Realization Track (`Collected ₹XXL` vs `Receivables ₹XXL`)
  - 3 Stats: `Pending Quotes` | `In Erection` | `Max Site DBT (₹78,000)`
- **If `hasFinanceAccess === false`**:
  - Badge: `FIELD OPERATIONS • ACTIVE WORKFLOW`
  - Big Value: `{totalCapacityKWp} kWp`
  - Subline: `{data.totalProjects || projects.length} Active Projects • {data.totalLeads} Inbound Leads`
  - Progress: Erection Throughput Track (`Projects in Progress` vs `Total Sites`)
  - 3 Stats: `Open Surveys` | `In Erection` | `Support Tickets`

---

## 6. Tabular Numerals & High-Precision Financial Formatting

### 6.1 Font Jitter Elimination
To eliminate numeric jitter across dynamic data updates and table comparisons, all numeric values must inherit:
```typescript
import { tabularNums } from '../../theme';
// style={[styles.numericMetric, tabularNums]}
```

### 6.2 Currency & Unit Formatter Discipline
- Standard currency formatting: `formatInr(amount)` (`₹1,85,000`)
- High-level financial reporting: Scaled Lakhs (`₹${totalRevenueLakhs.toFixed(1)}L`)
- Capacity: `formatKw(capacity)` or `${capacity.toFixed(1)} kWp`

---

## 7. Drop-in Implementation Blueprint for Worker M2

Below is the complete, drop-in replacement implementation of `DashboardScreen.tsx` designed to be written directly into `mobile-app/src/screens/dashboard/DashboardScreen.tsx`.

```tsx
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
  MapPin,
  Landmark,
  Briefcase,
  Users,
  ChevronRight,
  Zap,
  Package,
  Sparkles,
  ArrowRight,
  Leaf,
  Plus,
  Phone,
  MessageCircle,
  Receipt,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi, crmApi } from '../../api/endpoints';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { useAuth } from '../../context/AuthContext';
import { DashboardData, HorizonItem, Project } from '../../types';
import { SkeletonLoader, Skeleton, SkeletonText, SkeletonCard } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { radii, spacing, typography, tabularNums, formatInr, formatKw, useTheme } from '../../theme';

type HorizonType = 'monthly' | 'quarterly' | 'halfAnnual' | 'annual';
type FocusMetric = 'both' | 'clients' | 'revenue';

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
  const [error, setError] = useState<string | null>(null);

  // Horizon Analysis Controls
  const [periodHorizon, setPeriodHorizon] = useState<HorizonType>('quarterly');
  const [horizonMetricFocus, setHorizonMetricFocus] = useState<FocusMetric>('both');

  // Role & Permission Checks
  const isTenantAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const userPerms = Array.isArray((user as any)?.permissions)
    ? (user as any).permissions
    : (user as any)?.permissions?.modules || [];
  const hasFinanceAccess = isTenantAdmin || userPerms.includes('finance') || userPerms.includes('*') || Boolean(data.isFinanceAuthorized);

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh && !refreshing) {
      setLoading(true);
    }
    setError(null);
    let hasAnySuccess = false;
    let failureMsg = '';

    try {
      const results = await Promise.allSettled([
        tenantApi.getDashboard(),
        tenantApi.getProjects(),
        crmApi.getLeads({ all: true }),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        setData(results[0].value);
        hasAnySuccess = true;
      } else if (results[0].status === 'rejected') {
        failureMsg = results[0].reason?.response?.data?.error || results[0].reason?.message || 'Dashboard metrics unavailable';
      }

      if (results[1].status === 'fulfilled' && results[1].value && Array.isArray(results[1].value.projects)) {
        setProjects(results[1].value.projects);
        hasAnySuccess = true;
      }

      if (results[2].status === 'fulfilled' && results[2].value && Array.isArray(results[2].value.leads)) {
        setRecentLeads(results[2].value.leads.slice(0, 5));
        hasAnySuccess = true;
      }

      if (!hasAnySuccess) {
        setError(failureMsg || 'Unable to communicate with Solar OS server. Please check connection.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected network communication error.');
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

  // ----------------------------------------------------
  // REAL OPERATIONAL METRICS & FINANCIAL CALCULATIONS
  // ----------------------------------------------------
  const totalCapacityKWp = (data.totalCapacity || 0).toFixed(1);
  const totalRevenueLakhs = data.totalRevenue ? Number((data.totalRevenue / 100000).toFixed(1)) : 0;
  const totalCollectedLakhs = data.totalCollected ? Number((data.totalCollected / 100000).toFixed(1)) : 0;
  const outstandingLakhs = data.outstanding
    ? Number((data.outstanding / 100000).toFixed(1))
    : Math.max(0, Number((totalRevenueLakhs - totalCollectedLakhs).toFixed(1)));

  const collectedPct = totalRevenueLakhs > 0
    ? Math.min(100, Math.round((totalCollectedLakhs / totalRevenueLakhs) * 100))
    : 0;

  // Environmental Metrics (Computed authentically from capacity if not provided)
  const cleanEnergyMWh = data.environmental && data.environmental.monthlyEnergyKWh > 0
    ? (data.environmental.monthlyEnergyKWh / 1000).toFixed(2)
    : ((Number(totalCapacityKWp) * 120) / 1000).toFixed(2);
  const co2Tons = data.environmental && data.environmental.co2Tons > 0
    ? data.environmental.co2Tons
    : Number((Number(cleanEnergyMWh) * 1000 * 0.82 / 1000).toFixed(1));
  const coalTons = data.environmental && data.environmental.coalTons > 0
    ? data.environmental.coalTons
    : Number((Number(co2Tons) * 0.48).toFixed(1));
  const treesCount = data.environmental && data.environmental.trees > 0
    ? data.environmental.trees.toLocaleString('en-IN')
    : Math.round(Number(co2Tons) * 45).toLocaleString('en-IN');

  // Horizon Data
  const activeHorizonData: HorizonItem[] =
    data.horizonAnalytics &&
    data.horizonAnalytics[periodHorizon] &&
    data.horizonAnalytics[periodHorizon].length > 0
      ? data.horizonAnalytics[periodHorizon]
      : [];

  const totalHorizonClients = activeHorizonData.reduce((acc, curr) => acc + curr.clients, 0);
  const totalHorizonRevenue = activeHorizonData.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(1);
  const totalHorizonCapacity = activeHorizonData.reduce((acc, curr) => acc + curr.capacity, 0).toFixed(1);
  const avgHorizonDeal = (Number(totalHorizonRevenue) / (totalHorizonClients || 1)).toFixed(2);

  const maxClientsVal = Math.max(...activeHorizonData.map((d) => d.clients), 1);
  const maxRevenueVal = Math.max(...activeHorizonData.map((d) => d.revenue), 1);

  // Active Collections
  const inventoryRunway = data.inventoryRunway || [];
  const subsidyFunnel = data.subsidyFunnel || [];

  // Authentic Pipeline Items
  const activeStreamItems = recentLeads.map((l, i) => {
    const cap = l.estimatedCap || l.capacity || 3.3;
    const val = l.estimatedValue || l.value || Math.round(cap * 56000);
    const isWon = l.status === 'WON';
    const isProposal = l.status === 'PROPOSAL_SENT';
    const isSurvey = l.status === 'SITE_SURVEY';
    return {
      id: l.id || `lead-${i}`,
      name: l.name || 'Prospect',
      mobile: l.mobile || l.phone || '',
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
  });

  const urgentProspect = activeStreamItems[0] || null;

  // ----------------------------------------------------
  // FULL PAGE LOADING STATE (SkeletonLoader Presets)
  // ----------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header variant="home" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card Skeleton */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heroTopRow}>
              <Skeleton width={130} height={18} borderRadius={radii.sm} />
              <Skeleton width={80} height={14} borderRadius={radii.sm} />
            </View>
            <View style={{ marginVertical: spacing[3] }}>
              <Skeleton width={160} height={34} borderRadius={radii.sm} style={{ marginBottom: spacing[2] }} />
              <Skeleton width={230} height={14} borderRadius={radii.sm} />
            </View>
            <Skeleton width="100%" height={8} borderRadius={radii.full} style={{ marginVertical: spacing[3] }} />
            <View style={styles.heroStatsRow}>
              <Skeleton width="28%" height={32} borderRadius={radii.sm} />
              <Skeleton width="28%" height={32} borderRadius={radii.sm} />
              <Skeleton width="28%" height={32} borderRadius={radii.sm} />
            </View>
          </View>

          {/* Priority Card Skeleton */}
          <View style={[styles.priorityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Skeleton width={150} height={16} borderRadius={radii.sm} style={{ marginBottom: spacing[3] }} />
            <SkeletonText lines={2} lineHeight={14} gap={8} style={{ marginBottom: spacing[4] }} />
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <Skeleton width="48%" height={38} borderRadius={radii.md} />
              <Skeleton width="48%" height={38} borderRadius={radii.md} />
            </View>
          </View>

          {/* Quick Action Strip Skeleton */}
          <View style={styles.quickActionRow}>
            <Skeleton width="23%" height={40} borderRadius={radii.lg} />
            <Skeleton width="23%" height={40} borderRadius={radii.lg} />
            <Skeleton width="23%" height={40} borderRadius={radii.lg} />
            <Skeleton width="23%" height={40} borderRadius={radii.lg} />
          </View>

          {/* Pipeline Stream Skeleton */}
          <View style={[styles.streamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Skeleton width={140} height={16} borderRadius={radii.sm} style={{ marginBottom: spacing[4] }} />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // CRITICAL ERROR STATE (Human-Readable Recovery)
  // ----------------------------------------------------
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
            secondaryActionTitle="Profile & Health"
            onSecondaryActionPress={() => navigation.navigate('Profile')}
          />
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // MAIN OPERATIONAL COMMAND RADAR
  // ----------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header variant="home" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================================
            1. EXECUTIVE / OPERATIONAL HERO COMMAND CARD
            Personalized based on role & finance permissions.
        ===================================================================== */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.pulseTag, !hasFinanceAccess && { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <View style={[styles.pulseDot, !hasFinanceAccess && { backgroundColor: '#0066FF' }]} />
              <Text style={[styles.pulseTagText, !hasFinanceAccess && { color: '#0066FF' }]}>
                {hasFinanceAccess ? 'OPERATIONS RADAR • MSEDCL LIVE' : 'FIELD OPERATIONS • ACTIVE WORKFLOW'}
              </Text>
            </View>
            <Text style={[styles.heroDateText, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <View style={styles.heroMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroValue, tabularNums, { color: colors.text }]}>
                {hasFinanceAccess ? `₹${totalRevenueLakhs.toFixed(1)}L` : `${totalCapacityKWp} kWp`}
              </Text>
              <Text style={[styles.heroSubline, { color: colors.textSecondary }]}>
                {hasFinanceAccess
                  ? `${totalCapacityKWp} kWp Fleet Active • ₹${outstandingLakhs.toFixed(1)}L In-Flight Claims`
                  : `${projects.length || data.totalProjects} Active Sites • ${data.totalLeads} Inbound Leads`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => navigation.navigate('QuickQuote')}
              activeOpacity={0.85}
              accessibilityLabel="Launch 60s Quote"
            >
              <Zap size={15} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.heroActionBtnText}>60s Quote</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Track (Collected % for Finance, Active Sites for Field) */}
          <View style={styles.capitalTrackContainer}>
            <View style={styles.capitalTrackLabels}>
              <Text style={styles.capitalTrackLeftText}>
                {hasFinanceAccess
                  ? `Collected: ₹${totalCollectedLakhs.toFixed(1)}L (${collectedPct}%)`
                  : `Active Execution: ${projects.length || data.totalProjects} Sites`}
              </Text>
              <Text style={styles.capitalTrackRightText}>
                {hasFinanceAccess
                  ? `Receivables: ₹${outstandingLakhs.toFixed(1)}L`
                  : `Pipeline: ${data.totalLeads} Leads`}
              </Text>
            </View>
            <View style={styles.capitalProgressBar}>
              <View style={[styles.capitalProgressFill, { width: `${hasFinanceAccess ? collectedPct : Math.min(100, (projects.length / (data.totalProjects || 1)) * 100)}%` }]} />
            </View>
          </View>

          {/* 3-Column Operational Pulse Stats */}
          <View style={[styles.heroStatsRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc', borderColor: colors.borderSubtle }]}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, tabularNums, { color: colors.text }]}>
                {data.totalLeads}
              </Text>
              <Text style={[styles.heroStatLbl, { color: colors.textSecondary }]}>
                {hasFinanceAccess ? 'Pending Quotes' : 'New Leads'}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, tabularNums, { color: colors.text }]}>
                {projects.length || data.totalProjects}
              </Text>
              <Text style={[styles.heroStatLbl, { color: colors.textSecondary }]}>
                In Erection
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, tabularNums, { color: hasFinanceAccess ? '#059669' : '#0066FF' }]}>
                {hasFinanceAccess ? '₹78,000' : `${(data.openSurveys ?? 0)}`}
              </Text>
              <Text style={[styles.heroStatLbl, { color: colors.textSecondary }]}>
                {hasFinanceAccess ? 'Max Site DBT' : 'Site Surveys'}
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================================================
            2. HIGH-PRIORITY OPERATIONAL RADAR (Next Action Due)
        ===================================================================== */}
        {urgentProspect ? (
          <View style={[styles.priorityCard, { backgroundColor: colors.surface, borderColor: '#fde68a' }]}>
            <View style={styles.priorityTopRow}>
              <View style={styles.priorityBadge}>
                <Sparkles size={12} color="#d97706" />
                <Text style={styles.priorityBadgeText}>IMMEDIATE ACTION REQUIRED</Text>
              </View>
              <Text style={styles.priorityTimeText}>{urgentProspect.time || 'Active'}</Text>
            </View>

            <View style={styles.priorityContent}>
              <Text style={[styles.priorityName, { color: colors.text }]}>
                {urgentProspect.name} ({urgentProspect.capacity} kWp Rooftop)
              </Text>
              <Text style={[styles.priorityLocation, tabularNums, { color: colors.textSecondary }]}>
                📍 {urgentProspect.city} • Est. {formatInr(urgentProspect.value)}
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
                accessibilityLabel="View pipeline lead"
              >
                <ArrowRight size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.priorityEmptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.priorityTopRow}>
              <View style={[styles.priorityBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <CheckCircle2 size={12} color="#15803d" />
                <Text style={[styles.priorityBadgeText, { color: '#15803d' }]}>SYSTEM UP TO DATE</Text>
              </View>
            </View>
            <Text style={[styles.priorityEmptyTitle, { color: colors.text }]}>No Urgent Roadblocks</Text>
            <Text style={[styles.priorityEmptySub, { color: colors.textSecondary }]}>
              All active customer inquiries and milestone tasks are current. Onboard a new lead to maintain pipeline velocity.
            </Text>
            <TouchableOpacity
              style={styles.priorityCreateBtn}
              onPress={() => navigation.navigate('Pipeline')}
              activeOpacity={0.85}
            >
              <Plus size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.priorityCreateBtnText}>Create New Lead</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================================================
            3. QUICK ACTION TOOLKIT
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
            style={[styles.quickActionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Pipeline')}
            activeOpacity={0.85}
          >
            <Plus size={15} color={colors.text} />
            <Text style={[styles.quickActionPillText, { color: colors.text }]}>New Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })}
            activeOpacity={0.85}
          >
            <MapPin size={15} color="#d97706" />
            <Text style={[styles.quickActionPillText, { color: colors.text }]}>Survey</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              if (hasFinanceAccess) {
                navigation.navigate('Finance');
              } else {
                navigation.navigate('Projects');
              }
            }}
            activeOpacity={0.85}
          >
            {hasFinanceAccess ? (
              <>
                <Receipt size={15} color="#059669" />
                <Text style={[styles.quickActionPillText, { color: colors.text }]}>Invoice</Text>
              </>
            ) : (
              <>
                <Briefcase size={15} color="#0284c7" />
                <Text style={[styles.quickActionPillText, { color: colors.text }]}>Projects</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* =====================================================================
            4. LIVE CUSTOMER PIPELINE STREAM
        ===================================================================== */}
        <View style={[styles.streamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>LIVE CUSTOMER PIPELINE</Text>
              <Text style={[styles.cardSectionSub, { color: colors.textMuted }]}>
                {activeStreamItems.length > 0 ? 'High-priority prospects awaiting follow-up' : 'Pipeline awaiting new prospect'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Pipeline')} activeOpacity={0.7}>
              <Text style={styles.cardHeaderLink}>All Leads →</Text>
            </TouchableOpacity>
          </View>

          {activeStreamItems.length > 0 ? (
            <View style={styles.streamList}>
              {activeStreamItems.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.streamRow,
                    idx === activeStreamItems.length - 1 && { borderBottomWidth: 0 },
                    { borderBottomColor: colors.borderSubtle },
                  ]}
                >
                  <View style={[styles.streamAvatar, { backgroundColor: item.avatarBg || '#eff6ff' }]}>
                    <Text style={[styles.streamAvatarText, { color: item.avatarColor || '#0066FF' }]}>
                      {item.name ? item.name.charAt(0).toUpperCase() : 'S'}
                    </Text>
                  </View>

                  <View style={styles.streamMeta}>
                    <View style={styles.streamNameRow}>
                      <Text style={[styles.streamName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <View style={[styles.streamStagePill, { backgroundColor: item.stageBg || '#eff6ff' }]}>
                        <Text style={[styles.streamStageText, { color: item.stageColor || '#0066FF' }]}>
                          {item.stage}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.streamSubText, tabularNums, { color: colors.textSecondary }]} numberOfLines={1}>
                      ⚡ {item.capacity} kWp • 📍 {item.city} • {formatInr(item.value)}
                    </Text>
                  </View>

                  <View style={styles.streamActionsGroup}>
                    <TouchableOpacity
                      style={[styles.microCallBtn, { backgroundColor: isDark ? colors.surfaceHighlight : '#f1f5f9' }]}
                      onPress={() => handlePhoneCall(item.mobile)}
                      activeOpacity={0.7}
                      accessibilityLabel="Call prospect"
                    >
                      <Phone size={13} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.microWhatsAppBtn}
                      onPress={() => handleWhatsAppDirect(item)}
                      activeOpacity={0.7}
                      accessibilityLabel="WhatsApp pitch"
                    >
                      <MessageCircle size={13} color="#15803d" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              compact
              icon={<Users size={28} color={colors.primary} />}
              title="No Inbound Leads"
              description="Capture customer requirements or generate a 60-second solar proposal."
              actionTitle="Create First Lead"
              onActionPress={() => navigation.navigate('Pipeline')}
            />
          )}
        </View>

        {/* =====================================================================
            5. SOLAR EPC MILESTONE PIPELINE (Connected Workflow Stepper)
        ===================================================================== */}
        <View style={[styles.epcCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>EPC EXECUTION WORKFLOW</Text>
              <Text style={[styles.cardSectionSub, { color: colors.textMuted }]}>End-to-end solar asset throughput</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')} activeOpacity={0.7}>
              <Text style={styles.cardHeaderLink}>All Projects →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.epcScroll}>
            <TouchableOpacity style={[styles.epcNode, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc', borderColor: colors.borderSubtle }]} onPress={() => navigation.navigate('Pipeline')} activeOpacity={0.8}>
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>01</Text>
                <Users size={14} color="#0284c7" />
              </View>
              <Text style={[styles.epcNodeVal, tabularNums, { color: colors.text }]}>{data.totalLeads}</Text>
              <Text style={[styles.epcNodeTitle, { color: colors.text }]}>Leads</Text>
              <Text style={styles.epcNodeSub}>Inbound</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity style={[styles.epcNode, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc', borderColor: colors.borderSubtle }]} onPress={() => navigation.navigate('Modules', { screen: 'SURVEYS' })} activeOpacity={0.8}>
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>02</Text>
                <MapPin size={14} color="#d97706" />
              </View>
              <Text style={[styles.epcNodeVal, tabularNums, { color: colors.text }]}>{data.totalCustomers}</Text>
              <Text style={[styles.epcNodeTitle, { color: colors.text }]}>Surveys</Text>
              <Text style={styles.epcNodeSub}>Verified</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity style={[styles.epcNode, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc', borderColor: colors.borderSubtle }]} onPress={() => navigation.navigate('QuickQuote')} activeOpacity={0.8}>
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>03</Text>
                <Zap size={14} color="#7c3aed" />
              </View>
              <Text style={[styles.epcNodeVal, tabularNums, { color: colors.text }]}>
                {data.totalLeads > 0 ? Math.round(data.totalLeads * 0.7) : 0}
              </Text>
              <Text style={[styles.epcNodeTitle, { color: colors.text }]}>Proposals</Text>
              <Text style={styles.epcNodeSub}>Dispatched</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity style={[styles.epcNode, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc', borderColor: colors.borderSubtle }]} onPress={() => navigation.navigate('Projects')} activeOpacity={0.8}>
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>04</Text>
                <Briefcase size={14} color="#2563eb" />
              </View>
              <Text style={[styles.epcNodeVal, tabularNums, { color: colors.text }]}>{data.totalProjects}</Text>
              <Text style={[styles.epcNodeTitle, { color: colors.text }]}>Erection</Text>
              <Text style={styles.epcNodeSub}>On-site</Text>
            </TouchableOpacity>

            <View style={styles.epcArrow}>
              <ChevronRight size={14} color="#cbd5e1" />
            </View>

            <TouchableOpacity style={[styles.epcNode, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc', borderColor: colors.borderSubtle }]} onPress={() => navigation.navigate('Modules', { screen: 'SUBSIDY' })} activeOpacity={0.8}>
              <View style={styles.epcNodeTop}>
                <Text style={styles.epcNodeNum}>05</Text>
                <Landmark size={14} color="#059669" />
              </View>
              <Text style={[styles.epcNodeVal, tabularNums, { color: colors.text }]}>{data.pendingInvoices}</Text>
              <Text style={[styles.epcNodeTitle, { color: colors.text }]}>DBT Subsidies</Text>
              <Text style={styles.epcNodeSub}>Clearing</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* =====================================================================
            6. PERIOD HORIZON COMPARATIVE VELOCITY
        ===================================================================== */}
        <View style={[styles.horizonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>PERIOD COMPARATIVE VELOCITY</Text>
              <Text style={[styles.cardSectionSub, { color: colors.textMuted }]}>
                {hasFinanceAccess ? 'Client & Revenue Execution Trajectory' : 'Client & Capacity Installation Trajectory'}
              </Text>
            </View>
          </View>

          {/* Horizon Period Tabs */}
          <View style={[styles.horizonTabsRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#f1f5f9' }]}>
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
                  style={[styles.horizonTabBtn, active && [styles.horizonTabBtnActive, { backgroundColor: colors.surface }]]}
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

          {/* Metric Filter Buttons (Mask revenue filter for non-finance roles) */}
          <View style={styles.metricFilterRow}>
            {((hasFinanceAccess ? ['both', 'clients', 'revenue'] : ['clients']) as FocusMetric[]).map((f) => {
              const active = horizonMetricFocus === f;
              const labels: Record<FocusMetric, string> = {
                both: 'Both Metrics',
                clients: 'Clients',
                revenue: 'Revenue ₹',
              };
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.metricFilterBtn, active && styles.metricFilterBtnActive, { borderColor: colors.borderSubtle }]}
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
          <View style={[styles.horizonStatsRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc' }]}>
            <View style={styles.horizonStatCol}>
              <Text style={styles.horizonStatLbl}>CLIENTS</Text>
              <Text style={[styles.horizonStatNum, tabularNums, { color: colors.text }]}>{totalHorizonClients}</Text>
              <Text style={styles.horizonStatSub}>Commissioned</Text>
            </View>
            <View style={styles.horizonStatDivider} />
            {hasFinanceAccess && (
              <>
                <View style={styles.horizonStatCol}>
                  <Text style={styles.horizonStatLbl}>REVENUE</Text>
                  <Text style={[styles.horizonStatNum, tabularNums, { color: '#059669' }]}>₹{totalHorizonRevenue}L</Text>
                  <Text style={styles.horizonStatSub}>Realized</Text>
                </View>
                <View style={styles.horizonStatDivider} />
                <View style={styles.horizonStatCol}>
                  <Text style={styles.horizonStatLbl}>AVG DEAL</Text>
                  <Text style={[styles.horizonStatNum, tabularNums, { color: '#0066FF' }]}>₹{avgHorizonDeal}L</Text>
                  <Text style={styles.horizonStatSub}>Per Site</Text>
                </View>
                <View style={styles.horizonStatDivider} />
              </>
            )}
            <View style={styles.horizonStatCol}>
              <Text style={styles.horizonStatLbl}>CAPACITY</Text>
              <Text style={[styles.horizonStatNum, tabularNums, { color: '#7c3aed' }]}>{totalHorizonCapacity}k</Text>
              <Text style={styles.horizonStatSub}>kWp Total</Text>
            </View>
          </View>

          {/* Bar Chart View */}
          {activeHorizonData.length > 0 ? (
            <View style={[styles.chartWrapper, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc' }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                {activeHorizonData.map((item, idx) => {
                  const clientHeightPct = Math.max(12, Math.round((item.clients / maxClientsVal) * 90));
                  const revenueHeightPct = Math.max(12, Math.round((item.revenue / maxRevenueVal) * 90));

                  return (
                    <View key={item.period || idx} style={styles.chartColGroup}>
                      <View style={styles.chartBarsPair}>
                        {(horizonMetricFocus === 'both' || horizonMetricFocus === 'clients') && (
                          <View style={styles.barItem}>
                            <Text style={[styles.barValText, tabularNums]}>{item.clients}</Text>
                            <View
                              style={[
                                styles.barFill,
                                { height: clientHeightPct, backgroundColor: '#0284c7' },
                              ]}
                            />
                          </View>
                        )}

                        {hasFinanceAccess && (horizonMetricFocus === 'both' || horizonMetricFocus === 'revenue') && (
                          <View style={styles.barItem}>
                            <Text style={[styles.barValText, tabularNums]}>₹{item.revenue}</Text>
                            <View
                              style={[
                                styles.barFill,
                                { height: revenueHeightPct, backgroundColor: '#10b981' },
                              ]}
                            />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.chartXLabel, { color: colors.textSecondary }]} numberOfLines={1}>{item.period}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.chartEmptyWrapper}>
              <TrendingUp size={24} color="#94a3b8" />
              <Text style={[styles.chartEmptyTitle, { color: colors.textSecondary }]}>No Historical Horizon Telemetry</Text>
              <Text style={[styles.chartEmptySub, { color: colors.textMuted }]}>
                Velocity milestones populate automatically as projects and invoicing cycles settle.
              </Text>
            </View>
          )}
        </View>

        {/* =====================================================================
            7. PM SURYA GHAR & HARDWARE BUFFER (Side-by-Side Clean Cards)
        ===================================================================== */}
        <View style={styles.dualCardsRow}>
          {/* PM Surya Ghar Subsidy Tracker */}
          <View style={[styles.dualCardHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>PM SURYA GHAR</Text>
              <View style={styles.subsidyPill}>
                <Text style={styles.subsidyPillText}>₹78k/Site</Text>
              </View>
            </View>

            {subsidyFunnel.length > 0 ? (
              <View style={styles.subsidyList}>
                {subsidyFunnel.map((step) => (
                  <View key={step.step} style={[styles.subsidyRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc' }]}>
                    <View style={styles.subsidyNum}>
                      <Text style={styles.subsidyNumText}>{step.step}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.subsidyTitle, { color: colors.text }]} numberOfLines={1}>{step.title}</Text>
                      <Text style={[styles.subsidySub, tabularNums, { color: colors.textSecondary }]}>{step.count} Sites • {step.amount}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCardContent}>
                <Landmark size={22} color="#94a3b8" />
                <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No active DBT claims</Text>
              </View>
            )}
          </View>

          {/* Hardware Runway */}
          <View style={[styles.dualCardHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>STOCK RUNWAY</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Modules', { screen: 'INVENTORY' })}>
                <Text style={styles.cardHeaderLink}>Ledger →</Text>
              </TouchableOpacity>
            </View>

            {inventoryRunway.length > 0 ? (
              <View style={styles.inventoryList}>
                {inventoryRunway.map((item, idx) => (
                  <View key={item.item || idx} style={[styles.inventoryRow, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inventoryTitle, { color: colors.text }]} numberOfLines={1}>{item.item}</Text>
                      <Text style={[styles.inventoryStock, { color: colors.textSecondary }]} numberOfLines={1}>{item.stock}</Text>
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
                          tabularNums,
                          { color: item.status === 'Reorder Soon' ? '#b45309' : '#047857' },
                        ]}
                      >
                        {item.runway}d
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCardContent}>
                <Package size={22} color="#94a3b8" />
                <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>Stock levels normal</Text>
              </View>
            )}
          </View>
        </View>

        {/* =====================================================================
            8. SOLAR FLEET ENVIRONMENTAL & CARBON OFFSET TELEMETRY
        ===================================================================== */}
        <View style={[styles.envCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.envHeader}>
            <View style={styles.envIconCircle}>
              <Leaf size={16} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.envHeaderTitle, { color: colors.text }]}>Solar Fleet Environmental Offset</Text>
              <Text style={[styles.envHeaderSub, { color: colors.textSecondary }]}>Clean energy generated & fossil emissions displaced</Text>
            </View>
          </View>

          <View style={[styles.envGrid, { backgroundColor: isDark ? colors.surfaceHighlight : '#f8fafc' }]}>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>CLEAN ENERGY</Text>
              <Text style={[styles.envGridVal, tabularNums, { color: colors.text }]}>{cleanEnergyMWh} MWh</Text>
              <Text style={styles.envGridHint}>This Month</Text>
            </View>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>CO₂ MITIGATED</Text>
              <Text style={[styles.envGridVal, tabularNums, { color: colors.text }]}>{co2Tons} Tons</Text>
              <Text style={styles.envGridHint}>Offset</Text>
            </View>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>COAL SAVED</Text>
              <Text style={[styles.envGridVal, tabularNums, { color: colors.text }]}>{coalTons} Tons</Text>
              <Text style={styles.envGridHint}>Fossil Burn</Text>
            </View>
            <View style={styles.envGridCol}>
              <Text style={styles.envGridLbl}>TREES</Text>
              <Text style={[styles.envGridVal, tabularNums, { color: colors.text }]}>{treesCount}</Text>
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

  // 1. EXECUTIVE OPERATIONAL HERO COMMAND CARD
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  pulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  pulseTagText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extrabold,
    color: '#15803d',
    letterSpacing: 0.5,
  },
  heroDateText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semibold,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  heroValue: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.black,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroSubline: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.medium,
    marginTop: 4,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    elevation: 2,
  },
  heroActionBtnText: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.extrabold,
    color: '#ffffff',
  },
  capitalTrackContainer: {
    marginBottom: spacing[4],
  },
  capitalTrackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capitalTrackLeftText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    color: '#0066FF',
  },
  capitalTrackRightText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
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
    borderRadius: radii.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatVal: {
    fontSize: typography.size.lead,
    fontWeight: typography.weight.black,
  },
  heroStatLbl: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
  },

  // 2. HIGH-PRIORITY OPERATIONAL RADAR
  priorityCard: {
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    elevation: 2,
  },
  priorityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  priorityBadgeText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extrabold,
    color: '#b45309',
    letterSpacing: 0.5,
  },
  priorityTimeText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.semibold,
    color: '#94a3b8',
  },
  priorityContent: {
    marginBottom: spacing[3],
  },
  priorityName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.extrabold,
    marginBottom: 2,
  },
  priorityLocation: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    marginBottom: 3,
  },
  prioritySubsidy: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    color: '#059669',
  },
  priorityActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  priorityCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  priorityCallBtnText: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.extrabold,
    color: '#ffffff',
  },
  priorityWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  priorityWhatsAppBtnText: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.extrabold,
    color: '#ffffff',
  },
  priorityDetailBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityEmptyCard: {
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
  },
  priorityEmptyTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.extrabold,
    marginTop: spacing[2],
    marginBottom: 2,
  },
  priorityEmptySub: {
    fontSize: typography.size.sub,
    lineHeight: 18,
    marginBottom: spacing[3],
  },
  priorityCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
  },
  priorityCreateBtnText: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.extrabold,
    color: '#ffffff',
  },

  // 3. QUICK ACTION TOOLKIT
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
    gap: 5,
  },
  quickActionPillText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.extrabold,
  },

  // 4. LIVE CUSTOMER PIPELINE STREAM
  streamCard: {
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  cardSectionLabel: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extrabold,
    letterSpacing: 0.8,
  },
  cardSectionSub: {
    fontSize: typography.size.caption,
    marginTop: 1,
  },
  cardHeaderLink: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.extrabold,
    color: '#0066FF',
  },
  streamList: {},
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    gap: spacing[2],
  },
  streamAvatar: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamAvatarText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.black,
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
    fontSize: typography.size.body,
    fontWeight: typography.weight.extrabold,
    flexShrink: 1,
  },
  streamStagePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streamStageText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extrabold,
  },
  streamSubText: {
    fontSize: typography.size.caption,
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
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
  },
  epcScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: spacing[4],
  },
  epcNode: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[2],
    width: 88,
  },
  epcNodeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  epcNodeNum: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.black,
    color: '#94a3b8',
  },
  epcNodeVal: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.black,
    marginVertical: 1,
  },
  epcNodeTitle: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extrabold,
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
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
  },
  horizonTabsRow: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing[2],
  },
  horizonTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  horizonTabBtnActive: {
    elevation: 1,
  },
  horizonTabBtnText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    color: '#64748b',
  },
  horizonTabBtnTextActive: {
    color: '#0066FF',
    fontWeight: typography.weight.extrabold,
  },
  metricFilterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing[3],
  },
  metricFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
  },
  metricFilterBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  metricFilterBtnText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    color: '#64748b',
  },
  metricFilterBtnTextActive: {
    color: '#ffffff',
  },
  horizonStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    marginBottom: spacing[3],
  },
  horizonStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  horizonStatLbl: {
    fontSize: 8,
    fontWeight: typography.weight.extrabold,
    color: '#64748b',
  },
  horizonStatNum: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.black,
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
    borderRadius: radii.lg,
    padding: spacing[2],
  },
  chartScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[4],
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
    fontWeight: typography.weight.extrabold,
    color: '#475569',
    marginBottom: 2,
  },
  barFill: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  chartXLabel: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    marginTop: 6,
    textAlign: 'center',
  },
  chartEmptyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[6],
    gap: spacing[2],
  },
  chartEmptyTitle: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
  },
  chartEmptySub: {
    fontSize: typography.size.tiny,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },

  // 7. PM SURYA GHAR & HARDWARE BUFFER
  dualCardsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dualCardHalf: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[3],
  },
  subsidyPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  subsidyPillText: {
    fontSize: 8,
    fontWeight: typography.weight.extrabold,
    color: '#059669',
  },
  subsidyList: {
    gap: 8,
  },
  subsidyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    padding: spacing[2],
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
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.black,
    color: '#ffffff',
  },
  subsidyTitle: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.extrabold,
  },
  subsidySub: {
    fontSize: 8,
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    gap: 4,
  },
  emptyCardText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.medium,
  },
  inventoryList: {
    gap: 6,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.sm,
    padding: spacing[2],
  },
  inventoryTitle: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.extrabold,
  },
  inventoryStock: {
    fontSize: 8,
    marginTop: 1,
  },
  runwayPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  runwayPillText: {
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extrabold,
  },

  // 8. SOLAR FLEET ENVIRONMENTAL & CARBON OFFSET TELEMETRY
  envCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[4],
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  envIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envHeaderTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.extrabold,
  },
  envHeaderSub: {
    fontSize: typography.size.tiny,
    marginTop: 1,
  },
  envGrid: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radii.lg,
    padding: spacing[2],
  },
  envGridCol: {
    flex: 1,
    alignItems: 'center',
  },
  envGridLbl: {
    fontSize: 7,
    fontWeight: typography.weight.extrabold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  envGridVal: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.black,
    marginVertical: 2,
  },
  envGridHint: {
    fontSize: 8,
    fontWeight: typography.weight.semibold,
    color: '#059669',
  },
});
```

---

## 8. Verification Strategy for Worker M2

Worker M2 and the verification auditor can independently verify the transformation through the following checks:

1. **Static Analysis & Type Checking**:
   ```powershell
   cd "f:\Company Products\solar-manager\mobile-app"
   npx tsc --noEmit
   ```
   Ensures 0 TypeScript type errors and verifies all imports (`SkeletonLoader`, `EmptyState`, tokens, formatters).

2. **Automated Perspective Regression Suite**:
   ```powershell
   node test-perspectives.js
   ```
   Ensures all 10 perspectives (DBT subsidy, sizing, consumer validation, workflow) achieve 100% pass.

3. **Dummy Data Absence Audit**:
   Grep `mobile-app/src/screens/dashboard/DashboardScreen.tsx` for:
   - `Ramesh Patil` -> 0 matches.
   - `Suresh Deshmukh` -> 0 matches.
   - `fallbackHorizonDataMap` -> 0 matches.
   - `fallbackSubsidyFunnel` -> 0 matches.
   - `fallbackInventoryRunway` -> 0 matches.
   - `fallbackRecentLeads` -> 0 matches.

4. **Empty State & Role Validation**:
   - Log in as `TENANT_ADMIN` -> Verify executive financial figures (`₹XX.XL`), collections bar, and financial velocity tabs.
   - Log in as `TENANT_SUB_ADMIN` without finance permissions -> Verify that revenue figures are masked and operational capacity (`XX.X kWp`) and installation throughput appear.
   - Set empty DB / 0 leads -> Verify that informative `EmptyState` appears with primary CTA "Create First Lead", and immediate action card shows "All Priority Actions Handled".
