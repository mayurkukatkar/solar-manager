import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import {
  Search,
  X,
  Clock,
  Briefcase,
  Users,
  Receipt,
  QrCode,
  SearchX,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, spacing, radii, typography } from '../theme';
import { Input, Badge, EmptyState, SkeletonLoader } from './common';
import { crmApi, tenantApi, financeApi } from '../api/endpoints';
import { SafeStorage } from '../api/client';
import { navigateToTab } from '../navigation/navigationService';
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
  const { colors } = useTheme();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchEntityType>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
      return;
    }

    let isCancelled = false;

    const performSearch = async () => {
      setLoading(true);

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
          .catch(() => { })
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
          .catch(() => { })
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
          .catch(() => { })
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
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.semibold,
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
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.medium,
  },
});
