# Technical Architecture Blueprint: Modules Decomposition, Profile & Security
**Milestone**: M3 — End-to-End Module, Screen & Workflow Transformation  
**Explorer**: Explorer M3-1 (Modules Decomposition & Profile Architecture Explorer)  
**Date**: 2026-10-30  
**Target Codebase**: `mobile-app/src/screens/modules/`, `mobile-app/src/screens/profile/`, `mobile-app/src/components/`, `mobile-app/src/navigation/`

---

## 1. Executive Summary

This blueprint delivers the complete architectural specification for decomposing the 2,273-line monolithic `ModulesScreen.tsx`, transforming `FieldProfileScreen.tsx` from simulated fallbacks to real enterprise context, and implementing non-dismissible modal enforcement for HTTP 401 session expiry and HTTP 403 tenant suspension.

### Scope Summary
1. **ModulesScreen Decomposition (Feature 21)**: Break down the 2,273-line monolith with 9 inline sub-modules and 35+ state hooks into 9 dedicated sub-module components under `mobile-app/src/screens/modules/submodules/`, orchestrated by a lightweight (~180 line) hub coordinator with granular RBAC filtering (`hasPermission`).
2. **Field Profile & Tenant Identity (Feature 38 & 39)**: Strip fake `setTimeout` delays and hardcoded metrics (`₹34.8 Lakhs`, `₹8.4 L`, etc.), wire to live `authApi.getMe()` / `tenantApi` / `financeApi.getStats()`, execute real draft lead replay via `offlineSyncService` & `SafeStorage`, and display active system permissions and statutory links.
3. **Session Expiry & Suspension (Feature 40)**: Resolve the critical omission where HTTP 401 currently has no modal (only a subtle banner on login), create a non-dismissible `SessionExpiredModal`, and harden `AccountSuspendedModal` with Android hardware back guards (`onRequestClose={() => {}}`).

---

## 2. ModulesScreen Decomposition Architecture (Feature 21)

### 2.1 Audit of Existing Monolith (`mobile-app/src/screens/modules/ModulesScreen.tsx`)
- **Total Lines**: 2,273 lines (82,983 bytes).
- **Architecture Flaw**: All 9 sub-modules are rendered inline as conditional branches inside a single `<Modal visible={!!activeSubModule} animationType="slide">` (lines 708–1426), with two nested modals (`scheduleSurveyModal` lines 1428–1519 and `paymentModalVisible` lines 1521–1595), plus the proposal modal (`ProposalPreviewModal` lines 1597–1605).
- **State Monolith**: 38 distinct `useState` hooks defined at the root component level (lines 57–176). Typing into any input (e.g. quote sizing or survey notes) causes the entire 2,273-line tree to re-evaluate.
- **Style Monolith**: 663 lines of `StyleSheet.create` (lines 1610–2273) containing cross-module style definitions with high coupling.
- **RBAC Flaw**: Only `SUPER_ADMIN` is checked (`user?.role === 'SUPER_ADMIN'` at line 686). The other 8 modules are displayed to all users, even if a Technician shouldn't see Finance or a Sales Agent shouldn't see Procurement.

### 2.2 Sub-Module Inventory & Mapping

| Sub-Module ID | Module Name | Existing Lines | Core APIs & Services | Target Component | Required RBAC Permission |
|---|---|---|---|---|---|
| `QUOTES` | Quotations Engine | 735–896 | `quotationsApi.getQuotations`, `createQuotation`, `convertQuotation`, `ProposalPreviewModal`, WhatsApp | `QuotationsModule.tsx` | `['quotations.view', 'quotations.create']` |
| `SURVEYS` | Site Surveys | 897–955, 1428–1519 | `surveysApi.getSurveys`, `createSurvey` | `SurveysModule.tsx` | `['surveys.view', 'surveys.create']` |
| `SUBSIDY` | PM Surya Ghar Studio | 956–1009 | `subsidyApi.getSubsidies`, `createSubsidy` | `SubsidiesModule.tsx` | `['surveys.view', 'projects.view', 'quotations.view']` |
| `FINANCING` | Solar Loan & EMI Planner | 1010–1109 | Internal 7% EMI engine, WhatsApp | `FinancingModule.tsx` | `['finance.view', 'quotations.view']` |
| `DISCOM` | DISCOM Net-Metering | 1110–1133 | `tenantApi.getProjects`, `discomApi` | `DiscomModule.tsx` | `['projects.view', 'operations.view']` |
| `FINANCE` | Finance & Invoicing | 1134–1339, 1521–1595 | `financeApi.getStats`, `getInvoices`, `recordPayment`, WhatsApp | `InvoicingModule.tsx` | `['finance.view', 'finance.create_invoice']` |
| `PROCUREMENT` | Procurement & Stock | 1340–1369 | `procurementApi.getPurchaseOrders` | `ProcurementModule.tsx` | `['inventory.view', 'operations.view']` |
| `AMC` | AMC & Support | 1370–1399 | `amcApi.getAmcs` | `AmcModule.tsx` | `['operations.view', 'projects.view']` |
| `SUPER_ADMIN` | Platform Governance | 1400–1423 | `superAdminApi.getTenants`, `getKpis` | `SuperAdminModule.tsx` | `user?.role === 'SUPER_ADMIN'` |

### 2.3 Modular Directory Layout
```
mobile-app/src/screens/modules/
├── ModulesScreen.tsx                # Lightweight Hub Coordinator (~180 lines)
└── submodules/
    ├── index.ts                     # Barrel export
    ├── QuotationsModule.tsx         # Quotations Engine & Proposal Builder (~220 lines)
    ├── SurveysModule.tsx            # Site Surveys & Booking Sheet (~200 lines)
    ├── SubsidiesModule.tsx          # PM Surya Ghar National Portal Studio (~180 lines)
    ├── FinancingModule.tsx          # 7% Concessional Solar Loan Calculator (~180 lines)
    ├── DiscomModule.tsx             # DISCOM Net-Metering Tracker (~160 lines)
    ├── InvoicingModule.tsx          # Milestone Billing & Payments (~240 lines)
    ├── ProcurementModule.tsx        # Procurement, Stock & Purchase Orders (~150 lines)
    ├── AmcModule.tsx                # AMC Service Contracts (~140 lines)
    └── SuperAdminModule.tsx         # Super Admin Multi-Tenant Governance (~140 lines)
```

### 2.4 Sub-Module Interface Contract
Every sub-module implements a standardized interface:
```typescript
export interface SubModuleProps {
  onClose: () => void;
  initialParams?: any;
}
```
Each sub-module manages its own:
- Dedicated loading skeleton (`SkeletonLoader` from `components/common`)
- Empty state with CTA (`EmptyState` from `components/common`)
- Data fetching lifecycle (`useEffect` with localized loading/error handling)
- Local nested modals (e.g. `SurveysModule` encapsulates the "Book Survey" form; `InvoicingModule` encapsulates the "Record Payment" form; `QuotationsModule` encapsulates `ProposalPreviewModal`)
- Theme-aware styles using `useTheme()` tokens

### 2.5 Hub Coordinator Implementation (`ModulesScreen.tsx`)
`ModulesScreen.tsx` is stripped down to an executive hub tile grid:
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import {
  FileText, MapPin, Landmark, Banknote, Zap, Receipt, Truck, ShieldCheck,
  Layers, ChevronRight
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { ModalHeader } from '../../components/common/ModalHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme';
import { hasPermission } from '../../utils/rbac';
import {
  QuotationsModule,
  SurveysModule,
  SubsidiesModule,
  FinancingModule,
  DiscomModule,
  InvoicingModule,
  ProcurementModule,
  AmcModule,
  SuperAdminModule,
} from './submodules';

interface ModuleItem {
  id: string;
  name: string;
  desc: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  permission?: string | string[];
  superAdminOnly?: boolean;
}

interface ModuleCategory {
  title: string;
  modules: ModuleItem[];
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    title: 'SALES & PROPOSALS',
    modules: [
      {
        id: 'QUOTES',
        name: 'Quotations Engine',
        desc: '60-second solar proposals, CFA calculations & BOM sizing',
        icon: FileText,
        iconColor: '#059669',
        bgColor: '#ecfdf5',
        permission: ['quotations.view', 'quotations.create'],
      },
      {
        id: 'SURVEYS',
        name: 'Site Surveys',
        desc: 'Rooftop measurements, shadow profile & technical feasibility',
        icon: MapPin,
        iconColor: '#2563eb',
        bgColor: '#eff6ff',
        permission: ['surveys.view', 'surveys.create'],
      },
    ],
  },
  {
    title: 'COMPLIANCE & FINANCING',
    modules: [
      {
        id: 'SUBSIDY',
        name: 'PM Surya Ghar Studio',
        desc: '7-stage national portal tracking, consumer CA & DBT release',
        icon: Landmark,
        iconColor: '#d97706',
        bgColor: '#fffbeb',
        permission: ['projects.view', 'surveys.view', 'quotations.view'],
      },
      {
        id: 'FINANCING',
        name: 'Solar Loan & EMI Planner',
        desc: '7% concessional bank EMI vs electricity bill savings planner',
        icon: Banknote,
        iconColor: '#7c3aed',
        bgColor: '#f5f3ff',
        permission: ['finance.view', 'quotations.view'],
      },
    ],
  },
  {
    title: 'DISCOM & INVOICING',
    modules: [
      {
        id: 'DISCOM',
        name: 'DISCOM Net-Metering',
        desc: 'MSEDCL, Tata Power & state discom meter synchronization',
        icon: Zap,
        iconColor: '#0d9488',
        bgColor: '#f0fdfa',
        permission: ['projects.view', 'operations.view'],
      },
      {
        id: 'FINANCE',
        name: 'Finance & Invoicing',
        desc: 'Milestone billing (20/60/15/5), tax invoices & payment status',
        icon: Receipt,
        iconColor: '#059669',
        bgColor: '#ecfdf5',
        permission: ['finance.view', 'finance.create_invoice'],
      },
    ],
  },
  {
    title: 'OPERATIONS & AMC',
    modules: [
      {
        id: 'PROCUREMENT',
        name: 'Procurement & Stock',
        desc: 'DCR modules, grid-tie inverters, ACDB/DCDB & material dispatch',
        icon: Truck,
        iconColor: '#db2777',
        bgColor: '#fdf2f8',
        permission: ['inventory.view', 'operations.view'],
      },
      {
        id: 'AMC',
        name: 'AMC & Support',
        desc: 'Preventive maintenance agreements & post-commissioning service',
        icon: ShieldCheck,
        iconColor: '#e11d48',
        bgColor: '#fff1f2',
        permission: ['operations.view', 'projects.view'],
      },
    ],
  },
  {
    title: 'PLATFORM GOVERNANCE',
    modules: [
      {
        id: 'SUPER_ADMIN',
        name: 'Super Admin Platform',
        desc: 'Multi-tenant management & platform telemetry',
        icon: Layers,
        iconColor: '#9333ea',
        bgColor: '#faf5ff',
        superAdminOnly: true,
      },
    ],
  },
];
```

### 2.6 RBAC Filtering Logic in Coordinator
```typescript
  // Role-based Category & Module Filtering
  const authorizedCategories = useMemo(() => {
    return MODULE_CATEGORIES.map((cat) => {
      const filteredModules = cat.modules.filter((m) => {
        if (m.superAdminOnly) {
          return user?.role === 'SUPER_ADMIN';
        }
        if (m.permission) {
          return hasPermission(user, m.permission);
        }
        return true;
      });
      return {
        ...cat,
        modules: filteredModules,
      };
    }).filter((cat) => cat.modules.length > 0);
  }, [user]);
```

### 2.7 Submodule Navigation & Rendering
Backward compatibility with all navigation callers:
```typescript
  const [activeSubModule, setActiveSubModule] = useState<string | null>(
    route?.params?.openQuote ? 'QUOTES' : route?.params?.screen || null
  );

  useEffect(() => {
    if (route?.params?.openQuote) {
      setActiveSubModule('QUOTES');
    } else if (route?.params?.screen) {
      setActiveSubModule(route.params.screen);
    }
  }, [route?.params]);

  const renderActiveModule = () => {
    switch (activeSubModule) {
      case 'QUOTES':
        return <QuotationsModule onClose={() => setActiveSubModule(null)} initialParams={route?.params} />;
      case 'SURVEYS':
        return <SurveysModule onClose={() => setActiveSubModule(null)} />;
      case 'SUBSIDY':
        return <SubsidiesModule onClose={() => setActiveSubModule(null)} />;
      case 'FINANCING':
        return <FinancingModule onClose={() => setActiveSubModule(null)} />;
      case 'DISCOM':
        return <DiscomModule onClose={() => setActiveSubModule(null)} />;
      case 'FINANCE':
        return <InvoicingModule onClose={() => setActiveSubModule(null)} />;
      case 'PROCUREMENT':
        return <ProcurementModule onClose={() => setActiveSubModule(null)} />;
      case 'AMC':
        return <AmcModule onClose={() => setActiveSubModule(null)} />;
      case 'SUPER_ADMIN':
        return <SuperAdminModule onClose={() => setActiveSubModule(null)} />;
      default:
        return null;
    }
  };
```

Modal container using `ModalHeader`:
```tsx
<Modal
  visible={!!activeSubModule}
  animationType="slide"
  onRequestClose={() => setActiveSubModule(null)}
>
  <View style={styles.subModalContainer}>
    {renderActiveModule()}
  </View>
</Modal>
```

---

## 3. Field Profile & Tenant Identity Blueprint (Features 38 & 39)

### 3.1 Audit of Existing `FieldProfileScreen.tsx`
1. **Fake `setTimeout` (lines 51–58)**:
   ```typescript
   const handleSyncAll = async () => {
     setSyncing(true);
     setTimeout(async () => {
       setSyncing(false);
       await checkDrafts();
       Alert.alert('Offline Sync Complete', 'All local field drafts and media records are synced with the live server.');
     }, 1200);
   };
   ```
2. **Hardcoded Cash Flow Radar (lines 110–131)**:
   - `₹34.8 Lakhs` (Monthly Contract Value)
   - `₹8.4 L` (Advances Collected)
   - `₹18.2 L` (Due on Delivery)
   - `₹8.2 L` (Subsidy Pending)
   - These are hardcoded static `<Text>` values with zero backend connection.
3. **Hardcoded Plan Badge (lines 102–103)**:
   - `WhereReady Solar OS Enterprise` and `Active • 2027` are hardcoded.
4. **Draft Inspection Defect (lines 46–49)**:
   - `checkDrafts` only reads length of `offlineSyncService.getDraftLeads()`. It never inspects other cached items (custom ALMM gear in `@solar_custom_modules`, project barcode serials in `@solar_project_serials_*`, DISCOM documents cache in `@solar_discom_verified_*`).
5. **Missing Active Permissions**:
   - The user's active RBAC permissions are not shown anywhere.
6. **Statutory Portals**:
   - Only 2 portals are linked. Missing MNRE ALMM portal and additional state DISCOM portals.

### 3.2 Real Sync Queue Engine
Replace `setTimeout` with a live sync loop:
```typescript
const handleSyncAll = async () => {
  setSyncing(true);
  try {
    const draftLeads = await offlineSyncService.getDraftLeads();
    if (draftLeads.length === 0) {
      Alert.alert('All Synced', 'No pending field drafts found on this device.');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const draft of draftLeads) {
      try {
        await crmApi.createLead({
          name: draft.name,
          mobile: draft.mobile,
          email: draft.email,
          address: draft.address,
          city: draft.city,
          estimatedCap: draft.recommendedKw,
          monthlyBill: draft.monthlyBill,
          source: 'Field Offline Survey',
        });
        await offlineSyncService.removeDraftLead(draft.localId);
        successCount++;
      } catch (err) {
        console.warn('Sync failed for draft:', draft.localId, err);
        failCount++;
      }
    }

    await refreshStorageCounts();

    if (failCount === 0) {
      Alert.alert('Sync Complete 🎉', `Successfully uploaded ${successCount} field lead(s) to cloud.`);
    } else {
      Alert.alert(
        'Partial Sync Notice',
        `Uploaded ${successCount} lead(s). ${failCount} lead(s) could not be synced and remain saved locally.`
      );
    }
  } catch (err: any) {
    Alert.alert('Sync Error', err.message || 'Could not complete synchronization.');
  } finally {
    setSyncing(false);
  }
};
```

### 3.3 Real Financial Radar Wiring
Connect to `financeApi.getStats()`:
```typescript
interface FinancialStats {
  totalRevenue: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  expectedSubsidies: number;
}

const [financeStats, setFinanceStats] = useState<FinancialStats | null>(null);
const [loadingStats, setLoadingStats] = useState(false);

const loadFinanceStats = async () => {
  if (!hasPermission(user, 'finance.view')) return;
  setLoadingStats(true);
  try {
    const res = await financeApi.getStats();
    if (res?.stats) {
      setFinanceStats({
        totalRevenue: res.stats.totalCollected || 0,
        outstanding: res.stats.outstanding || 0,
        overdueAmount: res.stats.overdueAmount || 0,
        overdueCount: res.stats.overdueCount || 0,
        expectedSubsidies: res.stats.expectedSubsidies || 0,
      });
    }
  } catch (err) {
    console.warn('Could not load profile finance stats:', err);
  } finally {
    setLoadingStats(false);
  }
};
```
Derived values:
- **Total Pipeline Contract Value**: `(financeStats.totalRevenue + financeStats.outstanding)`
- **Advances Realized**: `financeStats.totalRevenue`
- **Outstanding Deliveries**: `financeStats.outstanding`
- **PM Surya Ghar Subsidy Pipeline**: `financeStats.expectedSubsidies`

Display formatted using Indian numeral system:
```typescript
const formatLakhs = (val: number) => {
  if (!val || val === 0) return '₹0';
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};
```

### 3.4 Real Tenant Profile Context
Wire to `authApi.getMe()`:
- Display Tenant Organization Name: `user?.tenant?.name || user?.tenantName || 'WhereReady Solar Partner'`
- Display Company Legal Trade Name: `user?.tenant?.companyName || user?.tenant?.name || 'Solar EPC Enterprises'`
- Display Plan & Status: `${user?.tenant?.plan || 'ENTERPRISE'} TIER • ${user?.tenant?.status || 'ACTIVE'}`
- Display User Profile: `user?.name`, `user?.email`, and semantic Role Badge:
  - `SUPER_ADMIN`: "Platform Super Admin"
  - `TENANT_ADMIN`: "Enterprise Owner / Admin"
  - `SALES_AGENT`: "Solar Sales Specialist"
  - `TECHNICIAN`: "Field QA & Technical Engineer"
  - `TENANT_SUB_ADMIN`: "Operations Manager"

### 3.5 Real Draft Storage Inspection via SafeStorage
Inspect offline cache keys:
```typescript
interface StorageAudit {
  draftLeadsCount: number;
  customModulesCount: number;
  customInvertersCount: number;
}

const [storageAudit, setStorageAudit] = useState<StorageAudit>({
  draftLeadsCount: 0,
  customModulesCount: 0,
  customInvertersCount: 0,
});

const refreshStorageCounts = async () => {
  try {
    const drafts = await offlineSyncService.getDraftLeads();
    const customModulesStr = await SafeStorage.getItem('@solar_custom_modules');
    const customInvertersStr = await SafeStorage.getItem('@solar_custom_inverters');

    const customModules = customModulesStr ? JSON.parse(customModulesStr) : [];
    const customInverters = customInvertersStr ? JSON.parse(customInvertersStr) : [];

    setStorageAudit({
      draftLeadsCount: drafts.length,
      customModulesCount: Array.isArray(customModules) ? customModules.length : 0,
      customInvertersCount: Array.isArray(customInverters) ? customInverters.length : 0,
    });
  } catch (err) {
    console.warn('Storage audit notice:', err);
  }
};
```

### 3.6 Active Permissions Display
Derive effective permissions and render semantic pills:
```typescript
const getEffectivePermissions = (user: any): { label: string; key: string }[] => {
  if (!user) return [];
  const role = (user.role || '').toUpperCase();
  if (['SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER'].includes(role)) {
    return [
      { key: 'all', label: 'Unrestricted Full Enterprise Access (*)' },
      { key: 'crm', label: 'CRM & Lead Sourcing' },
      { key: 'quotes', label: 'Proposals & CFA Pricing' },
      { key: 'surveys', label: 'Site Feasibility Surveys' },
      { key: 'projects', label: 'Project Milestones & Commissioning' },
      { key: 'finance', label: 'Invoicing & Collections' },
      { key: 'hardware', label: '2D Barcode & ALMM Scans' },
      { key: 'inventory', label: 'Procurement & Warehouse' },
    ];
  }

  const perms: { label: string; key: string }[] = [];
  if (hasPermission(user, 'leads.view')) perms.push({ key: 'leads', label: 'CRM Leads & Pipeline' });
  if (hasPermission(user, 'quotations.view')) perms.push({ key: 'quotes', label: 'Quotation Engine' });
  if (hasPermission(user, 'surveys.view')) perms.push({ key: 'surveys', label: 'Rooftop Site Surveys' });
  if (hasPermission(user, 'projects.view')) perms.push({ key: 'projects', label: 'Project Execution' });
  if (hasPermission(user, 'finance.view')) perms.push({ key: 'finance', label: 'Milestone Billing' });
  if (hasPermission(user, 'operations.scan') || hasPermission(user, 'hardware.scan')) {
    perms.push({ key: 'scan', label: '2D Barcode Scanning' });
  }
  if (hasPermission(user, 'inventory.view')) perms.push({ key: 'inventory', label: 'Procurement & Stock' });

  return perms;
};
```

### 3.7 Statutory & Utility Portals Suite
Enrich portal cards with error-handled linking:
1. **PM Surya Ghar National Portal**: `https://pmsuryaghar.gov.in` (DBT Release & Vendor Registration)
2. **MSEDCL Solar Rooftop Portal**: `https://www.mahadiscom.in/solar_rooftop` (Maharashtra Net-Metering)
3. **MNRE ALMM Portal**: `https://almm.gov.in` (Approved List of Models & Manufacturers)
4. **Tata Power DDL Rooftop Portal**: `https://www.tatapower-ddl.com` (Utility Grid Interconnection)

---

## 4. Session Expiry & Suspension Architecture (Feature 40)

### 4.1 Root Cause & Gap Analysis
1. **HTTP 403 `TENANT_SUSPENDED`**:
   - `client.ts` interceptor detects `error.response?.status === 403` and calls `suspendedHandler(message)`.
   - `AuthContext.tsx` sets `accountSuspended = true`, `accountSuspendedMessage = message`.
   - `RootNavigator.tsx` renders `<AccountSuspendedModal visible={accountSuspended} ... />`.
   - **Defect**: `AccountSuspendedModal.tsx` does NOT have `onRequestClose={() => {}}` prop. On Android, tapping the hardware back button or back gesture triggers default behavior.
2. **HTTP 401 Session Expiration**:
   - `client.ts` interceptor detects `error.response?.status === 401` and calls `unauthorizedHandler()`.
   - `AuthContext.tsx` sets `user = null`, `token = null`, `sessionExpired = true`.
   - `RootNavigator.tsx` switches `Stack.Navigator` from authenticated screens to `LoginScreen`.
   - **Severe Gap**: There is **no modal dialog**. The app abruptly switches to `LoginScreen` and displays a subtle yellow text banner: "Session timed out. Please sign in again."
   - Feature 40 explicitly requires: **"Non-dismissible handling of HTTP 401 (session expired) and HTTP 403 (`TENANT_SUSPENDED`)"**.

### 4.2 New Component: `SessionExpiredModal.tsx`
Create `mobile-app/src/components/SessionExpiredModal.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Clock, KeyRound, LogIn, ShieldAlert } from 'lucide-react-native';

interface SessionExpiredModalProps {
  visible: boolean;
  onSignInAgain: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  visible,
  onSignInAgain,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Enforce non-dismissible: Android hardware back cannot dismiss
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Clock size={36} color="#d97706" />
          </View>

          <View style={styles.statusPill}>
            <KeyRound size={11} color="#b45309" />
            <Text style={styles.statusPillText}>SECURITY SESSION EXPIRED</Text>
          </View>

          <Text style={styles.title}>Your Session Has Timed Out</Text>
          <Text style={styles.body}>
            To protect confidential customer KYC documents, proposals, and DISCOM billing records, your session has expired. Please sign in again to continue your work.
          </Text>

          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>DATA PROTECTION NOTICE:</Text>
            <Text style={styles.guidanceText}>
              • Unsynced local drafts and offline survey media remain safely preserved on your device.{'\n'}
              • Once authenticated, you will immediately regain access to all active EPC projects.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={onSignInAgain}
            activeOpacity={0.85}
          >
            <LogIn size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.signInBtnText}>Sign In to Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
```

### 4.3 Hardening `AccountSuspendedModal.tsx`
Update `mobile-app/src/components/AccountSuspendedModal.tsx`:
1. Add `onRequestClose={() => { /* non-dismissible */ }}` to `<Modal>`.
2. Ensure touch outside dialog card does not dismiss.
3. Keep action buttons: "Check Status Again" (`onCheckAgain`) and "Return to Login" (`onDismiss`).

### 4.4 Global Mounting in `RootNavigator.tsx`
In `RootNavigator.tsx`:
```tsx
      {/* GLOBAL SESSION EXPIRED MODAL (HTTP 401) */}
      <SessionExpiredModal
        visible={sessionExpired}
        onSignInAgain={() => {
          clearSessionExpired();
        }}
      />

      {/* GLOBAL ACCOUNT SUSPENDED MODAL (HTTP 403) */}
      <AccountSuspendedModal
        visible={accountSuspended}
        message={accountSuspendedMessage}
        onCheckAgain={async () => {
          await checkServerConnection();
        }}
        onDismiss={clearAccountSuspended}
      />
```

---

## 5. Implementation Task Matrix for Worker M3-1

| Step | File | Action | Key Details |
|---|---|---|---|
| 1 | `mobile-app/src/screens/modules/submodules/QuotationsModule.tsx` | CREATE | Sizing inputs, panel/inverter chips, gross/subsidy/net breakdown, save quote, WhatsApp, saved quotes list with `ProposalPreviewModal` and convert to project |
| 2 | `mobile-app/src/screens/modules/submodules/SurveysModule.tsx` | CREATE | Surveys list, status pills, book survey modal with form validation (`customerName`, `phone`, `proposedCap`, `discomConsumerNo`), empty state |
| 3 | `mobile-app/src/screens/modules/submodules/SubsidiesModule.tsx` | CREATE | CFA slabs (₹30k, ₹60k, ₹78k), 7-stage national portal guide, real list from `subsidyApi.getSubsidies()` |
| 4 | `mobile-app/src/screens/modules/submodules/FinancingModule.tsx` | CREATE | 7% loan calculator, capacity, down payment, tenure chips (3/5/7 yrs), EMI vs electricity savings, net cash benefit, WhatsApp share |
| 5 | `mobile-app/src/screens/modules/submodules/DiscomModule.tsx` | CREATE | DISCOM net-metering tracker, application numbers, consumer numbers, sanctioned load, meter serial, status badges |
| 6 | `mobile-app/src/screens/modules/submodules/InvoicingModule.tsx` | CREATE | Collections/outstanding metrics, overdue notice, filter tabs (ALL/OVERDUE/UNPAID/PARTIAL/PAID), invoice cards, nested payment modal, WhatsApp notice |
| 7 | `mobile-app/src/screens/modules/submodules/ProcurementModule.tsx` | CREATE | Stock status, DCR modules, inverters, structure kits, real POs from `procurementApi.getPurchaseOrders()` |
| 8 | `mobile-app/src/screens/modules/submodules/AmcModule.tsx` | CREATE | AMC agreements from `amcApi.getAmcs()`, customer name, plan, status pill |
| 9 | `mobile-app/src/screens/modules/submodules/SuperAdminModule.tsx` | CREATE | Tenant list from `superAdminApi.getTenants()`, multi-tenant management, active/suspended pill |
| 10 | `mobile-app/src/screens/modules/submodules/index.ts` | CREATE | Barrel export of all 9 submodules |
| 11 | `mobile-app/src/screens/modules/ModulesScreen.tsx` | REFACTOR | Decompose from 2,273 to ~180 lines, maintain Hub Grid with `MODULE_CATEGORIES`, wire RBAC filtering via `hasPermission`, render sub-modules in modal container |
| 12 | `mobile-app/src/components/SessionExpiredModal.tsx` | CREATE | Non-dismissible HTTP 401 modal, Clock icon, security guidance, "Sign In to Continue" CTA |
| 13 | `mobile-app/src/components/AccountSuspendedModal.tsx` | REFACTOR | Add `onRequestClose={() => {}}` guard for non-dismissible Android back handling |
| 14 | `mobile-app/src/navigation/RootNavigator.tsx` | UPDATE | Mount `SessionExpiredModal` next to `AccountSuspendedModal` at root level |
| 15 | `mobile-app/src/screens/profile/FieldProfileScreen.tsx` | REFACTOR | Strip `setTimeout` & dummy numbers, wire real `financeApi.getStats()`, `authApi.getMe()`, real draft lead replay, display permissions list & statutory links |

---

## 6. Verification and Regression Defense

1. **TypeScript Type Safety**:
   - Run: `cmd /c "cd mobile-app && npx tsc --noEmit"`
   - Target: 0 errors.
2. **Automated Perspectives Suite**:
   - Run: `node mobile-app/test-perspectives.js`
   - Target: 23 / 23 tests pass (100%).
3. **RBAC Guard Validation**:
   - Test roles: `SUPER_ADMIN`, `TENANT_ADMIN`, `SALES_AGENT`, `TECHNICIAN`.
   - Confirm restricted modules (e.g. Finance, Super Admin) are hidden from unauthorized roles.
4. **Offline Queue Replay**:
   - Confirm `handleSyncAll` processes real records in `@solar_manager_draft_leads` and removes synced items.
5. **Modal Non-Dismissibility**:
   - Trigger 401 / 403: Verify modal renders on top, backdrop tap does not close, Android back does not dismiss.
