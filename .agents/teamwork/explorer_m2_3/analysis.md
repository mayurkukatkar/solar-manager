# Architectural Blueprint & Implementation Specification: Authorized Global Search & Quick Actions Dispatcher

- **Author**: Explorer M2-3 (Mobile Search & Interaction Architect)
- **Target Milestone**: Milestone 2 (Mobile IA, Navigation & Business Command Dashboard)
- **Deliverable Path**: `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_3\analysis.md`
- **Integrity Mode**: Development (Read-only analysis, drop-in implementations for Worker M2)

---

## 1. Executive Summary & Problem Diagnosis

### 1.1 Existing Limitations in Current Codebase
1. **Absence of Unified Global Search**:
   - `Header.tsx` only offers an inline `TextInput` within `variant="main"` (lines 284–310), which only filters the immediate screen's local dataset if `onSearch` is wired.
   - `variant="home"` (used on `DashboardScreen.tsx`) has no search functionality whatsoever.
   - Users cannot search across domain boundaries (e.g., searching for a customer name from the dashboard or a project screen to quickly locate their related invoice, project dossier, or quotation).
2. **Center FAB Usability Bottleneck**:
   - In `RootNavigator.tsx` (lines 87–104), the prominent bottom tab center FAB (`+` icon) is hardwired solely to `setLeadModalVisible(true)`.
   - Field engineers, solar site surveyors, and project managers cannot use this primary ergonomic touchpoint to perform operational field actions such as hardware barcode scanning, quick calculations, or invoice logging.
3. **Missing RBAC Enforcement**:
   - Sub-admins, sales executives, and field technicians have access to UI triggers without client-side permission gating, causing 403 API errors or exposure of unauthorized operational paths.
4. **Lack of Search History & Keyboard Ergonomics**:
   - No persistent search history in `AsyncStorage`.
   - No debounce protection on search queries, triggering premature API requests.

### 1.2 Proposed Architectural Solution
- **`mobile-app/src/utils/rbac.ts`**: Centralized RBAC evaluator implementing the granular `module.action` permission matrix specified in `docs/SECURITY.md`.
- **`mobile-app/src/components/GlobalSearchModal.tsx`**: Full-screen authorized modal with 300ms debounce, concurrent multi-entity queries (`Promise.allSettled`), category filter tabs, badge primitives, direct navigation via `navigationRef`, and `SafeStorage` recent search persistence.
- **`mobile-app/src/components/QuickActionsDispatcher.tsx`**: Role-gated bottom sheet modal launched from the center FAB in `RootNavigator.tsx`, exposing the 4 key operational workflows: "New Lead", "Quick Quote", "Scan Hardware", and "Record Payment".
- **`Header.tsx` Integration**: Seamless addition of a dedicated search icon button across `home` and `main` variants that launches `GlobalSearchModal`.
- **`RootNavigator.tsx` Integration**: Rewiring the Center FAB to trigger `QuickActionsDispatcher` with coordinated modal states.

---

## 2. RBAC & Permission Helper (`mobile-app/src/utils/rbac.ts`)

Create a shared RBAC utility at `mobile-app/src/utils/rbac.ts` to enforce uniform authorization checks across components.

```typescript
/**
 * WhereReady Solar OS — Role-Based Access Control (RBAC) Utility
 * Implements granular module.action permissions and role inheritance
 * conforming to docs/SECURITY.md and MASTER_ERP_SPECIFICATION.md.
 */
import { UserProfile } from '../types';

export type PermissionNamespace =
  | 'leads.view'
  | 'leads.create'
  | 'leads.edit'
  | 'leads.delete'
  | 'leads.assign'
  | 'crm.view'
  | 'crm.create'
  | 'crm.edit'
  | 'surveys.view'
  | 'surveys.create'
  | 'surveys.edit'
  | 'surveys.approve'
  | 'quotations.view'
  | 'quotations.create'
  | 'quotations.send'
  | 'quotations.approve'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.assign_tasks'
  | 'inventory.view'
  | 'inventory.dispatch'
  | 'inventory.receive'
  | 'operations.view'
  | 'operations.scan'
  | 'hardware.scan'
  | 'finance.view'
  | 'finance.create_invoice'
  | 'finance.record_payment'
  | 'tickets.view'
  | 'tickets.reply'
  | 'tickets.resolve';

/**
 * Role Definitions with Implicit Full Access
 */
const UNRESTRICTED_ROLES = new Set(['SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER']);

/**
 * Fallback Permissions for Legacy / Simplified Roles when permissions array is omitted
 */
const ROLE_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  SALES_AGENT: [
    'leads.view',
    'leads.create',
    'leads.edit',
    'crm.view',
    'quotations.view',
    'quotations.create',
    'projects.view',
    'finance.view',
    'surveys.view',
  ],
  TECHNICIAN: [
    'projects.view',
    'projects.edit',
    'operations.view',
    'operations.scan',
    'hardware.scan',
    'surveys.view',
    'inventory.view',
  ],
  TENANT_SUB_ADMIN: [
    'leads.view',
    'projects.view',
    'finance.view',
    'operations.view',
    'quotations.view',
  ],
};

/**
 * Check if the current user holds the required permission(s).
 * @param user Current UserProfile
 * @param requiredPermission Single permission or array of permissions (OR logic: true if user has ANY)
 */
export function hasPermission(
  user: UserProfile | null | undefined,
  requiredPermission: string | string[]
): boolean {
  if (!user) return false;

  const role = (user.role || '').toUpperCase();
  if (UNRESTRICTED_ROLES.has(role)) {
    return true;
  }

  // Determine effective permissions list
  let userPerms: string[] = [];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    userPerms = user.permissions;
  } else {
    userPerms = ROLE_FALLBACK_PERMISSIONS[role] || [];
  }

  // Wildcard check
  if (userPerms.includes('*') || userPerms.includes('all')) {
    return true;
  }

  const targets = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

  return targets.some((target) => {
    if (userPerms.includes(target)) return true;

    // Check module wildcard (e.g. 'leads.*' grants 'leads.view')
    const [mod] = target.split('.');
    if (mod && userPerms.includes(`${mod}.*`)) {
      return true;
    }

    return false;
  });
}

/**
 * Check if user has ALL required permissions (AND logic)
 */
export function hasAllPermissions(
  user: UserProfile | null | undefined,
  requiredPermissions: string[]
): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  if (UNRESTRICTED_ROLES.has(role)) return true;

  return requiredPermissions.every((perm) => hasPermission(user, perm));
}
```

---

## 3. Drop-In Implementation: `GlobalSearchModal.tsx`

Create `mobile-app/src/components/GlobalSearchModal.tsx`:

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Briefcase,
  Users,
  Receipt,
  QrCode,
  Trash2,
  AlertCircle,
  SearchX,
  ChevronRight,
  Layers,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, spacing, radii, typography, touchTarget } from '../theme';
import { Input, Badge, EmptyState, SkeletonLoader } from './common';
import { crmApi, tenantApi, financeApi } from '../api/endpoints';
import { SafeStorage } from '../api/client';
import { navigateToTab, navigationRef } from '../navigation/RootNavigator';
import { hasPermission } from '../utils/rbac';

export type SearchEntityType = 'ALL' | 'LEAD' | 'PROJECT' | 'INVOICE' | 'BARCODE';

export interface SearchResultItem {
  id: string;
  entityType: 'LEAD' | 'PROJECT' | 'INVOICE' | 'BARCODE';
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeVariant: 'primary' | 'success' | 'accent' | 'warning' | 'neutral';
  metaRight?: string;
  originalData?: any;
}

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const STORAGE_RECENT_SEARCHES_KEY = '@solar_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  visible,
  onClose,
  initialQuery = '',
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchEntityType>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync initial query if supplied
  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      if (initialQuery) {
        setQuery(initialQuery);
        setDebouncedQuery(initialQuery);
      }
    } else {
      setQuery('');
      setDebouncedQuery('');
      setResults([]);
      setErrorNotice(null);
    }
  }, [visible, initialQuery]);

  // Handle Android Hardware Back Button
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose]);

  // Load Recent Searches from SafeStorage
  const loadRecentSearches = async () => {
    try {
      const stored = await SafeStorage.getItem(STORAGE_RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Fallback silently
    }
  };

  const saveRecentSearch = async (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;
    try {
      const filtered = recentSearches.filter((t) => t.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await SafeStorage.setItem(STORAGE_RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Fallback silently
    }
  };

  const removeRecentSearch = async (term: string) => {
    try {
      const updated = recentSearches.filter((t) => t !== term);
      setRecentSearches(updated);
      await SafeStorage.setItem(STORAGE_RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Fallback silently
    }
  };

  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await SafeStorage.removeItem(STORAGE_RECENT_SEARCHES_KEY);
    } catch {
      // Fallback silently
    }
  };

  // 300ms Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Execute Multi-Entity Search Query
  useEffect(() => {
    if (!visible) return;

    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setErrorNotice(null);
      return;
    }

    let isCancelled = false;

    const performSearch = async () => {
      setLoading(true);
      setErrorNotice(null);

      const q = debouncedQuery.toLowerCase();
      const collected: SearchResultItem[] = [];

      // 1. Leads Query (RBAC: leads.view)
      const canViewLeads = hasPermission(user, 'leads.view');
      const leadsPromise = canViewLeads
        ? crmApi
            .getLeads({ search: debouncedQuery, all: true })
            .then((data) => {
              if (isCancelled) return;
              const leadsList = Array.isArray(data?.leads)
                ? data.leads
                : Array.isArray(data)
                ? data
                : [];
              leadsList.forEach((lead: any) => {
                collected.push({
                  id: lead.id,
                  entityType: 'LEAD',
                  title: lead.name || 'Unnamed Prospect',
                  subtitle: `${lead.city || 'Location N/A'} • ${lead.mobile || lead.phone || 'No Mobile'} • Stage: ${lead.stage || 'NEW'}`,
                  badgeLabel: 'Lead',
                  badgeVariant: 'primary',
                  metaRight: lead.estimatedCap ? `${lead.estimatedCap} kW` : undefined,
                  originalData: lead,
                });
              });
            })
            .catch(() => {})
        : Promise.resolve();

      // 2. Projects Query (RBAC: projects.view)
      const canViewProjects = hasPermission(user, 'projects.view');
      const projectsPromise = canViewProjects
        ? tenantApi
            .getProjects()
            .then((data) => {
              if (isCancelled) return;
              const projList = Array.isArray(data?.projects)
                ? data.projects
                : Array.isArray(data)
                ? data
                : [];
              projList.forEach((proj: any) => {
                const name = (proj.name || '').toLowerCase();
                const custName = (proj.customer?.name || '').toLowerCase();
                const consumerNo = (proj.consumerNumber || proj.discomConsumerNo || '').toLowerCase();
                const city = (proj.city || proj.address || '').toLowerCase();

                // Match against fields
                if (
                  name.includes(q) ||
                  custName.includes(q) ||
                  consumerNo.includes(q) ||
                  city.includes(q)
                ) {
                  collected.push({
                    id: proj.id,
                    entityType: 'PROJECT',
                    title: proj.name || `Project #${proj.id.slice(0, 8)}`,
                    subtitle: `${proj.customer?.name || 'Customer'} • ${proj.city || 'Site'} • ${proj.currentStage || proj.status || 'Active'}`,
                    badgeLabel: 'Project',
                    badgeVariant: 'success',
                    metaRight: proj.capacity ? `${proj.capacity} kWp` : undefined,
                    originalData: proj,
                  });
                }

                // 4. Barcodes & Hardware Serials Scanning (RBAC: operations.view / hardware.scan)
                const canViewHardware =
                  hasPermission(user, 'operations.view') ||
                  hasPermission(user, 'hardware.scan') ||
                  hasPermission(user, 'operations.scan');

                if (canViewHardware) {
                  const moduleSerials: string[] = Array.isArray(proj.moduleSerials)
                    ? proj.moduleSerials
                    : typeof proj.dcrModuleSerials === 'string'
                    ? proj.dcrModuleSerials.split(/[\n,]/).map((s: string) => s.trim())
                    : [];

                  moduleSerials.forEach((sn) => {
                    if (sn && sn.toLowerCase().includes(q)) {
                      collected.push({
                        id: `sn_${proj.id}_${sn}`,
                        entityType: 'BARCODE',
                        title: `Serial: ${sn}`,
                        subtitle: `Project: ${proj.name} (${proj.customer?.name || 'Site'})`,
                        badgeLabel: 'PV Hardware',
                        badgeVariant: 'warning',
                        metaRight: 'Module Serial',
                        originalData: { ...proj, matchedSerial: sn },
                      });
                    }
                  });

                  if (proj.inverterSerial && proj.inverterSerial.toLowerCase().includes(q)) {
                    collected.push({
                      id: `inv_${proj.id}_${proj.inverterSerial}`,
                      entityType: 'BARCODE',
                      title: `Inverter: ${proj.inverterSerial}`,
                      subtitle: `Project: ${proj.name} (${proj.customer?.name || 'Site'})`,
                      badgeLabel: 'Inverter Serial',
                      badgeVariant: 'warning',
                      metaRight: 'Grid-Tie',
                      originalData: { ...proj, matchedSerial: proj.inverterSerial },
                    });
                  }
                }
              });
            })
            .catch(() => {})
        : Promise.resolve();

      // 3. Finance & Invoices Query (RBAC: finance.view)
      const canViewFinance = hasPermission(user, 'finance.view');
      const financePromise = canViewFinance
        ? financeApi
            .getInvoices({ search: debouncedQuery })
            .then((data) => {
              if (isCancelled) return;
              const invList = Array.isArray(data?.invoices)
                ? data.invoices
                : Array.isArray(data)
                ? data
                : [];
              invList.forEach((inv: any) => {
                collected.push({
                  id: inv.id,
                  entityType: 'INVOICE',
                  title: `Invoice #${inv.invoiceNumber || inv.id.slice(0, 8)}`,
                  subtitle: `${inv.customer?.name || 'Customer'} • Status: ${inv.status || 'UNPAID'}`,
                  badgeLabel: 'Invoice',
                  badgeVariant: 'accent',
                  metaRight: inv.amount ? `₹${Number(inv.amount).toLocaleString('en-IN')}` : undefined,
                  originalData: inv,
                });
              });
            })
            .catch(() => {})
        : Promise.resolve();

      // Execute all authorized endpoints in parallel
      await Promise.allSettled([leadsPromise, projectsPromise, financePromise]);

      if (!isCancelled) {
        setResults(collected);
        setLoading(false);
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, visible, user]);

  // Navigate to Target Entity
  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(debouncedQuery || item.title);
    onClose();

    switch (item.entityType) {
      case 'LEAD':
        navigateToTab('Pipeline', { leadId: item.id, highlightId: item.id });
        break;
      case 'PROJECT':
        navigateToTab('Projects', { projectId: item.id, highlightId: item.id });
        break;
      case 'INVOICE':
        navigateToTab('Finance', { invoiceId: item.id, highlightId: item.id });
        break;
      case 'BARCODE':
        if (item.originalData?.id) {
          navigateToTab('Projects', {
            projectId: item.originalData.id,
            openBarcode: true,
          });
        } else {
          navigateToTab('Operations');
        }
        break;
      default:
        break;
    }
  };

  // Filtered by selected Category Chip
  const filteredResults = results.filter((item) => {
    if (activeCategory === 'ALL') return true;
    return item.entityType === activeCategory;
  });

  const leadsCount = results.filter((r) => r.entityType === 'LEAD').length;
  const projectsCount = results.filter((r) => r.entityType === 'PROJECT').length;
  const invoicesCount = results.filter((r) => r.entityType === 'INVOICE').length;
  const barcodesCount = results.filter((r) => r.entityType === 'BARCODE').length;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 24) : insets.top,
          },
        ]}
      >
        {/* TOP BAR / SEARCH HEADER */}
        <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle }]}>
          <View style={styles.searchInputWrapper}>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search leads, projects, invoices, serials..."
              prefixIcon={<Search size={18} color={colors.textSecondary} />}
              clearable
              onClear={() => setQuery('')}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => saveRecentSearch(query)}
              containerStyle={styles.inputContainerStyle}
            />
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceRecessed }]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close search"
          >
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* CATEGORY FILTER CHIPS (VISIBLE WHEN THERE ARE RESULTS OR SEARCHING) */}
        {results.length > 0 && (
          <View style={[styles.chipsContainer, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.chip,
                activeCategory === 'ALL' && [styles.chipActive, { backgroundColor: colors.primary }],
                activeCategory !== 'ALL' && { backgroundColor: colors.surfaceRecessed },
              ]}
              onPress={() => setActiveCategory('ALL')}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategory === 'ALL' ? styles.chipTextActive : { color: colors.textSecondary },
                ]}
              >
                All ({results.length})
              </Text>
            </TouchableOpacity>

            {hasPermission(user, 'leads.view') && leadsCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.chip,
                  activeCategory === 'LEAD' && [styles.chipActive, { backgroundColor: colors.primary }],
                  activeCategory !== 'LEAD' && { backgroundColor: colors.surfaceRecessed },
                ]}
                onPress={() => setActiveCategory('LEAD')}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === 'LEAD' ? styles.chipTextActive : { color: colors.textSecondary },
                  ]}
                >
                  Leads ({leadsCount})
                </Text>
              </TouchableOpacity>
            )}

            {hasPermission(user, 'projects.view') && projectsCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.chip,
                  activeCategory === 'PROJECT' && [styles.chipActive, { backgroundColor: colors.primary }],
                  activeCategory !== 'PROJECT' && { backgroundColor: colors.surfaceRecessed },
                ]}
                onPress={() => setActiveCategory('PROJECT')}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === 'PROJECT' ? styles.chipTextActive : { color: colors.textSecondary },
                  ]}
                >
                  Projects ({projectsCount})
                </Text>
              </TouchableOpacity>
            )}

            {hasPermission(user, 'finance.view') && invoicesCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.chip,
                  activeCategory === 'INVOICE' && [styles.chipActive, { backgroundColor: colors.primary }],
                  activeCategory !== 'INVOICE' && { backgroundColor: colors.surfaceRecessed },
                ]}
                onPress={() => setActiveCategory('INVOICE')}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === 'INVOICE' ? styles.chipTextActive : { color: colors.textSecondary },
                  ]}
                >
                  Invoices ({invoicesCount})
                </Text>
              </TouchableOpacity>
            )}

            {(hasPermission(user, 'operations.view') || hasPermission(user, 'hardware.scan')) &&
              barcodesCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.chip,
                    activeCategory === 'BARCODE' && [styles.chipActive, { backgroundColor: colors.primary }],
                    activeCategory !== 'BARCODE' && { backgroundColor: colors.surfaceRecessed },
                  ]}
                  onPress={() => setActiveCategory('BARCODE')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      activeCategory === 'BARCODE' ? styles.chipTextActive : { color: colors.textSecondary },
                    ]}
                  >
                    Hardware ({barcodesCount})
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        )}

        {/* MAIN BODY AREA */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonLoader.Card />
              <SkeletonLoader.Card />
              <SkeletonLoader.Card />
            </View>
          ) : debouncedQuery.length >= 2 && filteredResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon={<SearchX size={36} color={colors.textMuted} />}
                title={`No results for "${debouncedQuery}"`}
                description="No authorized leads, projects, invoices, or hardware serial numbers matched your query. Check spelling or try a different term."
                actionTitle="Clear Search"
                onActionPress={() => setQuery('')}
              />
            </View>
          ) : debouncedQuery.length >= 2 ? (
            <FlatList
              data={filteredResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.resultsListContent,
                { paddingBottom: Math.max(insets.bottom, 24) },
              ]}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleSelectResult(item)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.badgeLabel}: ${item.title}`}
                >
                  <View style={styles.resultLeftIcon}>
                    {item.entityType === 'LEAD' && <Users size={18} color={colors.primary} />}
                    {item.entityType === 'PROJECT' && <Briefcase size={18} color={colors.success} />}
                    {item.entityType === 'INVOICE' && <Receipt size={18} color="#8b5cf6" />}
                    {item.entityType === 'BARCODE' && <QrCode size={18} color="#f59e0b" />}
                  </View>

                  <View style={styles.resultInfoCol}>
                    <View style={styles.resultTitleRow}>
                      <Text
                        style={[styles.resultTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Badge
                        label={item.badgeLabel}
                        variant={item.badgeVariant}
                        size="sm"
                      />
                    </View>

                    <Text
                      style={[styles.resultSubtitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>

                    {item.metaRight && (
                      <Text
                        style={[
                          styles.resultMeta,
                          { color: colors.textMuted },
                          typography.tabularNums,
                        ]}
                      >
                        {item.metaRight}
                      </Text>
                    )}
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          ) : (
            /* RECENT SEARCHES OR EMPTY GUIDANCE */
            <View style={styles.recentContainer}>
              {recentSearches.length > 0 ? (
                <>
                  <View style={styles.recentHeaderRow}>
                    <Text style={[styles.recentSectionTitle, { color: colors.textSecondary }]}>
                      Recent Searches
                    </Text>
                    <TouchableOpacity
                      onPress={clearAllRecentSearches}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.clearAllText, { color: colors.primary }]}>
                        Clear All
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={recentSearches}
                    keyExtractor={(item, index) => `${item}_${index}`}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <View
                        style={[
                          styles.recentItemRow,
                          { borderBottomColor: colors.borderSubtle },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.recentTextRow}
                          onPress={() => {
                            setQuery(item);
                            setDebouncedQuery(item);
                          }}
                          activeOpacity={0.7}
                        >
                          <Clock size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                          <Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.recentDeleteBtn}
                          onPress={() => removeRecentSearch(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </>
              ) : (
                <View style={styles.quickGuidanceBox}>
                  <Search size={32} color={colors.primary} style={{ marginBottom: 12 }} />
                  <Text style={[styles.quickGuidanceTitle, { color: colors.text }]}>
                    Search WhereReady Solar OS
                  </Text>
                  <Text style={[styles.quickGuidanceSub, { color: colors.textSecondary }]}>
                    Find leads, customer accounts, field project dossiers, statutory milestone invoices, and hardware serials instantly.
                  </Text>
                  <View style={styles.suggestionsRow}>
                    {['Residential', 'Commercial', 'MSEDCL', 'Pending Invoices'].map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={[styles.suggestionChip, { backgroundColor: colors.surfaceRecessed }]}
                        onPress={() => {
                          setQuery(sug);
                          setDebouncedQuery(sug);
                        }}
                      >
                        <Text style={[styles.suggestionChipText, { color: colors.textSecondary }]}>
                          {sug}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flex: 1,
    marginRight: spacing[2],
  },
  inputContainerStyle: {
    marginBottom: 0,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    marginRight: spacing[2],
  },
  chipActive: {},
  chipText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    padding: spacing[4],
  },
  emptyContainer: {
    flex: 1,
    paddingTop: spacing[8],
  },
  resultsListContent: {
    padding: spacing[4],
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  resultLeftIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  resultInfoCol: {
    flex: 1,
    marginRight: spacing[2],
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  resultTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    flex: 1,
    marginRight: spacing[2],
  },
  resultSubtitle: {
    fontSize: typography.sizes.caption,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: typography.sizes.tiny,
  },
  recentContainer: {
    flex: 1,
    padding: spacing[4],
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  recentSectionTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  recentTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentText: {
    fontSize: typography.sizes.body,
  },
  recentDeleteBtn: {
    padding: spacing[1],
  },
  quickGuidanceBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  quickGuidanceTitle: {
    fontSize: typography.sizes.lead,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  quickGuidanceSub: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
  },
  suggestionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },
  suggestionChipText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
});
```

---

## 4. Drop-In Implementation: `QuickActionsDispatcher.tsx`

Create `mobile-app/src/components/QuickActionsDispatcher.tsx`:

```tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  BackHandler,
} from 'react-native';
import {
  UserPlus,
  Zap,
  QrCode,
  Receipt,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, spacing, radii, typography, touchTarget } from '../theme';
import { Badge } from './common';
import { hasPermission } from '../utils/rbac';

export interface QuickActionsDispatcherProps {
  visible: boolean;
  onClose: () => void;
  onOpenNewLead: () => void;
  onOpenQuickQuote: () => void;
  onOpenScanHardware: () => void;
  onOpenRecordPayment: () => void;
}

interface ActionDefinition {
  id: string;
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: 'primary' | 'warning' | 'success' | 'accent';
  icon: React.ReactNode;
  iconBg: string;
  permissionCheck: (user: any) => boolean;
  onPress: () => void;
}

export const QuickActionsDispatcher: React.FC<QuickActionsDispatcherProps> = ({
  visible,
  onClose,
  onOpenNewLead,
  onOpenQuickQuote,
  onOpenScanHardware,
  onOpenRecordPayment,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Android Hardware Back Button
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose]);

  // Operational Action Definitions
  const actions: ActionDefinition[] = [
    {
      id: 'new_lead',
      title: 'New Lead',
      description: 'Capture prospect details & power bill OCR',
      badgeLabel: 'CRM',
      badgeVariant: 'primary',
      icon: <UserPlus size={22} color={colors.primary} strokeWidth={2.2} />,
      iconBg: colors.primaryLight,
      permissionCheck: (u) => hasPermission(u, 'leads.create'),
      onPress: () => {
        onClose();
        onOpenNewLead();
      },
    },
    {
      id: 'quick_quote',
      title: 'Quick Quote',
      description: 'Solar sizing, ALMM modules & PM Surya Ghar DBT',
      badgeLabel: 'Sales',
      badgeVariant: 'warning',
      icon: <Zap size={22} color="#f59e0b" strokeWidth={2.2} />,
      iconBg: '#fef3c7',
      permissionCheck: (u) =>
        hasPermission(u, 'quotations.create') || hasPermission(u, 'quotations.view'),
      onPress: () => {
        onClose();
        onOpenQuickQuote();
      },
    },
    {
      id: 'scan_hardware',
      title: 'Scan Hardware',
      description: '2D barcode verification & DCR certificate',
      badgeLabel: 'Operations',
      badgeVariant: 'success',
      icon: <QrCode size={22} color="#059669" strokeWidth={2.2} />,
      iconBg: '#d1fae5',
      permissionCheck: (u) =>
        hasPermission(u, 'operations.scan') ||
        hasPermission(u, 'hardware.scan') ||
        hasPermission(u, 'projects.edit') ||
        hasPermission(u, 'operations.view'),
      onPress: () => {
        onClose();
        onOpenScanHardware();
      },
    },
    {
      id: 'record_payment',
      title: 'Record Payment',
      description: 'Create tax invoice or record milestone receipt',
      badgeLabel: 'Finance',
      badgeVariant: 'accent',
      icon: <Receipt size={22} color="#8b5cf6" strokeWidth={2.2} />,
      iconBg: '#ede9fe',
      permissionCheck: (u) =>
        hasPermission(u, 'finance.create_invoice') ||
        hasPermission(u, 'finance.record_payment'),
      onPress: () => {
        onClose();
        onOpenRecordPayment();
      },
    },
  ];

  // Authorized Action Filtering
  const authorizedActions = actions.filter((act) => act.permissionCheck(user));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: Math.max(insets.bottom, 24),
                },
              ]}
            >
              {/* SHEET HANDLE */}
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

              {/* SHEET HEADER */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Quick Actions</Text>
                  <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                    Fast operational dispatch for field & office
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.closeIconBtn, { backgroundColor: colors.surfaceRecessed }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close quick actions"
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* ACTION LIST */}
              {authorizedActions.length > 0 ? (
                <View style={styles.actionsGrid}>
                  {authorizedActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={[
                        styles.actionCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      onPress={action.onPress}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={action.title}
                    >
                      <View style={[styles.actionIconBox, { backgroundColor: action.iconBg }]}>
                        {action.icon}
                      </View>

                      <View style={styles.actionTextCol}>
                        <View style={styles.actionTitleRow}>
                          <Text style={[styles.actionTitle, { color: colors.text }]}>
                            {action.title}
                          </Text>
                          <Badge
                            label={action.badgeLabel}
                            variant={action.badgeVariant}
                            size="sm"
                          />
                        </View>
                        <Text
                          style={[styles.actionDescription, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {action.description}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.unauthorizedBox}>
                  <ShieldAlert size={36} color={colors.warning} style={{ marginBottom: 8 }} />
                  <Text style={[styles.unauthorizedTitle, { color: colors.text }]}>
                    No Authorized Actions
                  </Text>
                  <Text style={[styles.unauthorizedSub, { color: colors.textSecondary }]}>
                    Your user role does not have authorization to trigger quick actions. Contact your tenant administrator.
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: spacing[3],
    paddingHorizontal: spacing[4],
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[1],
  },
  sheetTitle: {
    fontSize: typography.sizes.lead,
    fontWeight: typography.weights.bold,
  },
  sheetSubtitle: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: {
    gap: spacing[2],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    minHeight: 64,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  actionTextCol: {
    flex: 1,
    marginRight: spacing[2],
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  actionDescription: {
    fontSize: typography.sizes.caption,
  },
  unauthorizedBox: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
  },
  unauthorizedTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  unauthorizedSub: {
    fontSize: typography.sizes.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
```

---

## 5. Integration Blueprint: `mobile-app/src/components/Header.tsx`

### 5.1 Enhancements
1. Add `onSearchPress?: () => void` to `HeaderProps`.
2. Add search button in `variant === 'home'` right group (between status pill and avatar).
3. Add search button in `variant === 'main'` actions row.
4. Mount `GlobalSearchModal` inside `Header.tsx` so all screens using `Header` get global search out-of-the-box.

### 5.2 Code Diff Specification for `Header.tsx`

```tsx
// 1. In imports:
import { GlobalSearchModal } from './GlobalSearchModal';

// 2. In HeaderProps interface:
export interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'main' | 'detail' | 'home';
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  onSearchPress?: () => void; // New prop
}

// 3. In Header component state:
const [searchModalVisible, setSearchModalVisible] = useState(false);

// 4. In variant === 'home' right group:
<View style={styles.homeRightGroup}>
  <View style={styles.homeStatusPill}>
    <View
      style={[
        styles.statusDot,
        { backgroundColor: backendStatus.isOnline ? '#34d399' : '#f59e0b' },
      ]}
    />
    <Text style={styles.homeStatusText}>
      {backendStatus.isOnline ? 'MSEDCL Live' : 'Offline'}
    </Text>
  </View>

  {/* NEW: Global Search Icon Button */}
  <TouchableOpacity
    style={styles.homeSearchBtn}
    onPress={() => {
      if (onSearchPress) onSearchPress();
      else setSearchModalVisible(true);
    }}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel="Global Search"
  >
    <Search size={18} color={isDark ? colors.textSecondary : colors.slate700} strokeWidth={2.2} />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.homeAvatarBtn}
    onPress={() => setProfileModalVisible(true)}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel="View profile"
  >
    <Text style={styles.homeAvatarText}>
      {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
    </Text>
  </TouchableOpacity>
</View>

// 5. In variant === 'main' actionsRow (before profile avatar):
<TouchableOpacity
  style={styles.mainSearchBtn}
  onPress={() => {
    if (onSearchPress) onSearchPress();
    else setSearchModalVisible(true);
  }}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="Global Search"
>
  <Search size={18} color={isDark ? colors.textSecondary : colors.slate700} strokeWidth={2.2} />
</TouchableOpacity>

// 6. At bottom of Header before return:
<GlobalSearchModal
  visible={searchModalVisible}
  onClose={() => setSearchModalVisible(false)}
/>
```

---

## 6. Integration Blueprint: `mobile-app/src/navigation/RootNavigator.tsx`

### 6.1 Enhancements
1. Connect the center bottom tab button (`CreateLeadTab` / `QuickActionsTab`) to open `QuickActionsDispatcher`.
2. Manage coordinated modal states in `MainTabNavigator`:
   - `LeadCaptureModal` (CRM)
   - `CreateInvoiceModal` (Finance)
   - `BarcodeScannerModal` (Operations)
   - Direct navigation to `QuickQuoteScreen` (Sales)

### 6.2 Code Replacement for `MainTabNavigator` in `RootNavigator.tsx`

```tsx
import { QuickActionsDispatcher } from '../components/QuickActionsDispatcher';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { BarcodeScannerModal } from '../screens/operations/BarcodeScannerModal';

const MainTabNavigator: React.FC = () => {
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [createInvoiceModalVisible, setCreateInvoiceModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [quickBarcodeProject, setQuickBarcodeProject] = useState<any>(null);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <LayoutDashboard size={21} color={color} strokeWidth={2.2} />
            ),
          }}
        />
        <Tab.Screen
          name="Pipeline"
          component={PipelineScreen}
          options={{
            tabBarLabel: 'Pipeline',
            tabBarIcon: ({ color }) => (
              <Layers size={21} color={color} strokeWidth={2.2} />
            ),
          }}
        />
        <Tab.Screen
          name="QuickActionsTab"
          component={EmptyScreen}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.centerFabContainer}
                onPress={() => setQuickActionsVisible(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Quick Actions Menu"
              >
                <View style={styles.centerFab}>
                  <Plus size={26} color="#ffffff" strokeWidth={2.8} />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Projects"
          component={FieldProjectsScreen}
          options={{
            tabBarLabel: 'Projects',
            tabBarIcon: ({ color }) => (
              <Briefcase size={21} color={color} strokeWidth={2.2} />
            ),
          }}
        />
        <Tab.Screen
          name="Finance"
          component={FinanceScreen}
          options={{
            tabBarLabel: 'Finance',
            tabBarIcon: ({ color }) => (
              <Receipt size={21} color={color} strokeWidth={2.2} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* QUICK ACTIONS DISPATCHER SHEET */}
      <QuickActionsDispatcher
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        onOpenNewLead={() => setLeadModalVisible(true)}
        onOpenQuickQuote={() => navigateToTab('QuickQuote')}
        onOpenScanHardware={() => {
          setQuickBarcodeProject({ name: 'Field Hardware Scan', capacity: 3.3 });
          setBarcodeModalVisible(true);
        }}
        onOpenRecordPayment={() => setCreateInvoiceModalVisible(true)}
      />

      {/* LEAD CAPTURE MODAL */}
      <LeadCaptureModal
        visible={leadModalVisible}
        onClose={() => setLeadModalVisible(false)}
        onSuccess={(lead) => {
          setLeadModalVisible(false);
          navigateToTab('Pipeline');
        }}
        onProceedToQuote={(lead) => {
          setLeadModalVisible(false);
          navigateToTab('QuickQuote', {
            lead,
            prospectName: lead?.name,
            prospectPhone: lead?.mobile,
            monthlyBill: lead?.monthlyBill ? String(lead.monthlyBill) : undefined,
            capacityKw: lead?.estimatedCap ? String(lead.estimatedCap) : undefined,
          });
        }}
      />

      {/* CREATE INVOICE / RECORD PAYMENT MODAL */}
      <CreateInvoiceModal
        visible={createInvoiceModalVisible}
        onClose={() => setCreateInvoiceModalVisible(false)}
        onSuccess={(inv) => {
          setCreateInvoiceModalVisible(false);
          navigateToTab('Finance');
        }}
      />

      {/* HARDWARE BARCODE SCANNER MODAL */}
      {quickBarcodeProject && (
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          project={quickBarcodeProject}
          onClose={() => {
            setBarcodeModalVisible(false);
            setQuickBarcodeProject(null);
          }}
          onSaveSerials={() => {
            setBarcodeModalVisible(false);
            setQuickBarcodeProject(null);
            navigateToTab('Projects');
          }}
        />
      )}
    </>
  );
};
```

---

## 7. Persistence & Performance Safeguards

1. **Debounce (300ms)**:
   - Eliminates rapid keystroke API spamming over mobile networks.
2. **`Promise.allSettled` Concurrent Queries**:
   - Leads, projects, and invoices are queried simultaneously.
   - If one service responds slowly or returns 500, other categories remain interactive and render smoothly.
3. **Safe Storage Fallback**:
   - `SafeStorage` ensures recent searches persist across app reboots via `AsyncStorage` and falls back to memory store in restricted native test environments without throwing unhandled exceptions.
4. **Android Hardware Back Handler Integration**:
   - Both `GlobalSearchModal` and `QuickActionsDispatcher` bind to `BackHandler`, allowing users to dismiss them naturally via Android navigation gestures or physical back buttons without exiting the application.
5. **Safe Area Insets**:
   - Uses `useSafeAreaInsets()` to prevent UI cutouts, cameras, and navigation bars from obscuring the search header or bottom action sheet.

---

## 8. Verification Strategy for Worker M2

| Test Case | Procedure | Expected Outcome |
|---|---|---|
| **VC-1: Header Search Launch** | Tap search icon in `Header` (`variant="home"` or `main`) | `GlobalSearchModal` opens with keyboard auto-focused and top inset respected. |
| **VC-2: 300ms Debounce** | Type "Ramesh" quickly into search input | Network requests are triggered only after user stops typing for 300ms. |
| **VC-3: RBAC Filtering** | Log in with Technician role lacking `finance.view` | Invoices are excluded from search; category chip for Invoices is omitted. |
| **VC-4: Direct Navigation** | Search for an existing lead and tap it | Modal closes, search term saved to Recent Searches, app navigates to `Pipeline` tab. |
| **VC-5: Recent Searches Persistence** | Re-open search modal after app reload | Recent search terms appear with clock icons and can be cleared with "Clear All". |
| **VC-6: Center FAB Quick Actions** | Tap center `+` button in bottom navigation bar | `QuickActionsDispatcher` opens showing authorized actions with role badges. |
| **VC-7: Quick Action Gating** | Log in with limited sub-admin role | Only authorized actions are rendered; unauthorized cards are hidden. |
| **VC-8: Hardware Back Button** | Press Android back button while modal or sheet is open | Active modal/sheet is dismissed; app does not navigate back or exit. |
