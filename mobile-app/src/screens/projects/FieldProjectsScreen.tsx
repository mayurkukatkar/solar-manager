import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  Briefcase,
  Phone,
  MessageCircle,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { tenantApi } from '../../api/endpoints';
import { DiscomDocsModal } from './DiscomDocsModal';
import { colors } from '../../theme/colors';

const PROJECT_STAGES = [
  { id: 'ALL', label: 'All Projects' },
  { id: 'PLANNING', label: 'Survey / Permits' },
  { id: 'DISCOM', label: 'DISCOM Liaison' },
  { id: 'INSTALLATION', label: 'Erection & QA' },
  { id: 'COMPLETED', label: 'Synchronized' },
];

export const FieldProjectsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // DISCOM Modal
  const [discomModalVisible, setDiscomModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await tenantApi.getProjects().catch(() => null);
      if (res && Array.isArray(res.projects)) {
        setProjects(res.projects);
      }
    } catch (err: any) {
      console.warn('Projects fetch notice:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleOpenDiscomModal = (proj: any) => {
    setSelectedProject(proj);
    setDiscomModalVisible(true);
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.consumerNumber || '').includes(searchQuery);

    if (!matchesSearch) return false;
    if (activeFilter === 'PLANNING') return p.status === 'PLANNING' || p.status === 'SURVEY';
    if (activeFilter === 'DISCOM') return p.status === 'DISCOM' || p.status === 'FEASIBILITY';
    if (activeFilter === 'INSTALLATION') return p.status === 'INSTALLATION' || p.status === 'TESTING';
    if (activeFilter === 'COMPLETED') return p.status === 'COMPLETED' || p.status === 'SYNCHRONIZED';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Field Projects & Execution</Text>
          <Text style={styles.headerSubtitle}>
            Stage 4 & 5: Active Installations & Net-Metering Compliance
          </Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search project, consumer no, client..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {PROJECT_STAGES.map((s) => {
            const isActive = activeFilter === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveFilter(s.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PROJECTS LIST */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Projects...</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Briefcase size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Active Projects Found</Text>
            <Text style={styles.emptySubtitle}>
              Convert leads into clients in the Pipeline to initialize execution projects.
            </Text>
          </View>
        ) : (
          filteredProjects.map((p) => {
            const cap = p.capacity || p.systemCapacity || 3.3;
            const custName = p.customer?.name || p.name?.replace(/Project.*/i, '').trim();
            const phone = p.customer?.mobile || p.customer?.phone;
            const consumerNo = p.consumerNumber || p.customer?.consumerNumber || '410022120526';

            return (
              <View key={p.id} style={styles.projectCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.projectName}>{p.name}</Text>
                    <Text style={styles.clientDetail}>
                      👤 {custName} | 📞 {phone || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.capBadge}>
                    <Zap size={12} color="#1d4ed8" />
                    <Text style={styles.capBadgeText}>{cap} kWp</Text>
                  </View>
                </View>

                {/* CONSUMER NO & LOCATION */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    Consumer No: <Text style={styles.metaHighlight}>{consumerNo}</Text>
                  </Text>
                  <Text style={styles.metaText}>DISCOM: MSEDCL</Text>
                </View>

                {/* MILESTONE PROGRESS BAR */}
                <View style={styles.milestoneBox}>
                  <View style={styles.milestoneHeader}>
                    <Text style={styles.milestoneTitle}>Execution Progress</Text>
                    <Text style={styles.milestoneStatus}>{p.status || 'PLANNING'}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width:
                            p.status === 'COMPLETED'
                              ? '100%'
                              : p.status === 'INSTALLATION'
                              ? '75%'
                              : p.status === 'DISCOM'
                              ? '45%'
                              : '25%',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(phone)}
                    activeOpacity={0.7}
                  >
                    <Phone size={15} color="#0284c7" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.discomCta}
                    onPress={() => handleOpenDiscomModal({ ...p, consumerNumber: consumerNo, capacity: cap })}
                    activeOpacity={0.85}
                  >
                    <Building size={16} color="#ffffff" />
                    <Text style={styles.discomCtaText}>Generate DISCOM Docs</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* DISCOM MODAL */}
      {selectedProject && (
        <DiscomDocsModal
          visible={discomModalVisible}
          project={selectedProject}
          onClose={() => setDiscomModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  tabsContainer: {
    marginBottom: 6,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  clientDetail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  capBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  metaHighlight: {
    color: '#0f172a',
    fontWeight: '800',
  },
  milestoneBox: {
    marginBottom: 14,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  milestoneStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discomCta: {
    flex: 1,
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  discomCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
