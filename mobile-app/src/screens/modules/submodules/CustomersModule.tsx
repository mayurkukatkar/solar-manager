import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  User,
  Users,
  Search,
  Phone,
  MessageCircle,
  Building,
  MapPin,
  Zap,
  Receipt,
  FileText,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { customerApi } from '../../../api/endpoints';
import { openWhatsAppWithPitch } from '../../../services/whatsappService';
import { useTheme } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { CustomerProfileModal } from '../../crm/CustomerProfileModal';
import { EmptyState, SkeletonLoader } from '../../../components/common';

export interface CustomersModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Customer Profile Modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await customerApi.getCustomers({ search: searchQuery });
      const list = Array.isArray(res?.customers) ? res.customers : [];
      setCustomers(list);
    } catch (err: any) {
      console.warn('Customers fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers(false);
  }, [fetchCustomers]);

  const handleOpenProfile = (cust: any) => {
    haptics.selection();
    setSelectedCustomer(cust);
    setProfileModalVisible(true);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedType !== 'ALL' && (c.customerType || 'RESIDENTIAL') !== selectedType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const mobile = (c.mobile || c.phone || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      const comp = (c.company || '').toLowerCase();
      return name.includes(q) || mobile.includes(q) || city.includes(q) || comp.includes(q);
    });
  }, [customers, selectedType, searchQuery]);

  // Aggregate stats
  const totalKw = customers.reduce((sum, c) => {
    const prjKw = (c.projects || []).reduce((ps: number, p: any) => ps + (Number(p.capacity) || 0), 0);
    return sum + (prjKw || Number(c.lead?.estimatedCap) || 3.3);
  }, 0);

  return (
    <View style={styles.container}>
      {/* SEARCH BAR */}
      <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search customers by name, phone, city..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => fetchCustomers(false)}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* FILTER PILLS */}
      <View style={styles.filterRow}>
        {['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterPill,
              selectedType === type && { backgroundColor: '#0066FF', borderColor: '#0066FF' },
              selectedType !== type && {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => {
              haptics.selection();
              setSelectedType(type);
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: selectedType === type ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {type === 'ALL' ? `All (${customers.length})` : type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* METRIC STRIP */}
      <View
        style={[
          styles.metricStrip,
          {
            backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
            borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
          },
        ]}
      >
        <View style={styles.metricCell}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>ACTIVE CLIENTS</Text>
          <Text style={[styles.metricVal, { color: '#0066FF' }]}>{customers.length}</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: isDark ? '#1E3A8A' : '#BFDBFE' }]} />
        <View style={styles.metricCell}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>TOTAL SOLAR</Text>
          <Text style={[styles.metricVal, { color: '#10B981' }]}>{totalKw.toFixed(1)} kWp</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: isDark ? '#1E3A8A' : '#BFDBFE' }]} />
        <View style={styles.metricCell}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>NATIONAL PORTAL</Text>
          <Text style={[styles.metricVal, { color: '#F59E0B' }]}>PM Surya Ghar</Text>
        </View>
      </View>

      {/* CUSTOMERS LIST */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCustomers(true)}
            tintColor="#0066FF"
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading customer profiles...
            </Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<Users size={40} color={colors.textMuted} />}
              title="No Customers Found"
              description="Converted leads and active solar EPC contracts appear here with full dossiers."
            />
          </View>
        ) : (
          filteredCustomers.map((cust) => {
            const prjCount = (cust.projects || []).length;
            const primaryPrj = prjCount > 0 ? cust.projects[0] : null;
            const cap = primaryPrj?.capacity || cust.lead?.estimatedCap || 3.3;

            return (
              <TouchableOpacity
                key={cust.id}
                style={[
                  styles.customerCard,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
                onPress={() => handleOpenProfile(cust)}
                activeOpacity={0.88}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                    </Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                        {cust.name}
                      </Text>
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor:
                              cust.customerType === 'COMMERCIAL'
                                ? 'rgba(99, 102, 241, 0.12)'
                                : 'rgba(16, 185, 129, 0.12)',
                            borderColor:
                              cust.customerType === 'COMMERCIAL' ? '#6366F1' : '#10B981',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeText,
                            {
                              color:
                                cust.customerType === 'COMMERCIAL' ? '#818CF8' : '#10B981',
                            },
                          ]}
                        >
                          {cust.customerType || 'RESIDENTIAL'}
                        </Text>
                      </View>
                    </View>

                    {cust.company ? (
                      <Text style={[styles.companyText, { color: colors.textSecondary }]}>
                        {cust.company}
                      </Text>
                    ) : null}

                    <View style={styles.metaRow}>
                      <MapPin size={11} color="#94A3B8" />
                      <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                        {cust.city || 'Site Location'} • CA: {cust.consumerNumber || 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </View>

                {/* BOTTOM STRIP: METRICS & DIRECT ACTIONS */}
                <View style={[styles.cardBottomRow, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <View style={styles.specPill}>
                    <Zap size={11} color="#0066FF" strokeWidth={2.4} />
                    <Text style={[styles.specPillText, { color: colors.text }]}>
                      {cap} kWp Rooftop
                    </Text>
                  </View>

                  <View style={styles.specPill}>
                    <Briefcase size={11} color="#10B981" />
                    <Text style={[styles.specPillText, { color: colors.textSecondary }]}>
                      {prjCount} {prjCount === 1 ? 'Project' : 'Projects'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }} />

                  {/* QUICK COMM ICONS */}
                  <TouchableOpacity
                    style={[styles.quickIconBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (cust.mobile) Linking.openURL(`tel:${cust.mobile}`);
                    }}
                  >
                    <Phone size={12} color="#0066FF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickIconBtn, { backgroundColor: isDark ? '#1E293B' : '#ECFDF5' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      openWhatsAppWithPitch(cust);
                    }}
                  >
                    <MessageCircle size={12} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FULL CUSTOMER 360 PROFILE MODAL */}
      {selectedCustomer && (
        <CustomerProfileModal
          visible={profileModalVisible}
          customerId={selectedCustomer.id}
          leadId={selectedCustomer.leadId}
          customerData={selectedCustomer}
          onClose={() => {
            setProfileModalVisible(false);
            setSelectedCustomer(null);
          }}
          onUpdate={() => fetchCustomers(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
  },
  customerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  companyText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quickIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

