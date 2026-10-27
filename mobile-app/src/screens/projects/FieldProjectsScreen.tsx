import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
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
  QrCode,
  FileText,
  ChevronRight,
  TrendingUp,
  Flame,
  Check,
  Plus,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi } from '../../api/endpoints';
import { apiClient } from '../../api/client';
import { DiscomDocsModal } from './DiscomDocsModal';
import { BarcodeScannerModal } from '../operations/BarcodeScannerModal';
import { InstallationQAModal } from '../operations/InstallationQAModal';
import { ProjectDossierModal } from './ProjectDossierModal';
import { openWhatsAppDirect } from '../../services/whatsappService';
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

  // Modals
  const [discomModalVisible, setDiscomModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [qaModalVisible, setQaModalVisible] = useState(false);
  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    fetchProjects();
    if (navigation?.addListener) {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchProjects();
      });
      return unsubscribe;
    }
  }, [navigation]);

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

  const handleOpenBarcodeModal = (proj: any) => {
    setSelectedProject(proj);
    setBarcodeModalVisible(true);
  };

  const handleOpenQaModal = (proj: any) => {
    setSelectedProject(proj);
    setQaModalVisible(true);
  };

  const handleOpenDocsModal = (proj: any) => {
    setSelectedProject(proj);
    setDocsModalVisible(true);
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsApp = (phone?: string, clientName?: string, prjNumber?: string, capacity?: number) => {
    if (!phone) {
      Alert.alert('Phone Missing', 'Customer phone number is not available on this project.');
      return;
    }
    const msg = `☀️ *WhereReady Solar OS — Installation Status Update* ☀️\n\nDear *${clientName || 'Customer'}*,\n\nWe are actively executing your *${capacity || 3.3} kWp* rooftop solar installation (*${prjNumber || 'Solar Project'}*).\n\nIf you have any questions or require statutory documentation, please let our engineering team know.\n\nWarm regards,\n*Field Operations & Commissioning Team*`;
    openWhatsAppDirect(phone, msg);
  };

  // Executive Pulse Stats
  const pulseStats = useMemo(() => {
    let totalCap = 0;
    let erectionCount = 0;
    let synchronizedCount = 0;

    projects.forEach((p) => {
      const cap = Number(p.capacity || p.systemCapacity || 3.3);
      totalCap += isNaN(cap) ? 3.3 : cap;

      const stage = (p.currentStage || p.status || '').toUpperCase();
      if (['INSTALLATION', 'TESTING', 'IN PROGRESS', 'QA'].some((s) => stage.includes(s))) {
        erectionCount++;
      }
      if (['COMPLETED', 'SYNCHRONIZED', 'HANDOVER'].some((s) => stage.includes(s))) {
        synchronizedCount++;
      }
    });

    return {
      totalSites: projects.length,
      totalKw: totalCap.toFixed(1),
      erectionCount,
      synchronizedCount,
    };
  }, [projects]);

  // Stage count calculator
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: projects.length,
      PLANNING: 0,
      DISCOM: 0,
      INSTALLATION: 0,
      COMPLETED: 0,
    };

    projects.forEach((p) => {
      const stage = (p.currentStage || '').toUpperCase();
      const stat = (p.status || '').toUpperCase();

      if (stage === 'PLANNING' || stat === 'PLANNING' || stat === 'SURVEY' || stat === 'NOT STARTED') {
        counts.PLANNING++;
      } else if (stage === 'DESIGN' || stage === 'PROCUREMENT' || stat === 'DISCOM' || stat === 'FEASIBILITY') {
        counts.DISCOM++;
      } else if (
        stage === 'INSTALLATION' ||
        stage === 'TESTING' ||
        stat === 'INSTALLATION' ||
        stat === 'TESTING' ||
        (stat === 'IN PROGRESS' && stage !== 'COMPLETED')
      ) {
        counts.INSTALLATION++;
      } else if (stage === 'COMPLETED' || stage === 'HANDOVER' || stat === 'COMPLETED' || stat === 'SYNCHRONIZED') {
        counts.COMPLETED++;
      }
    });

    return counts;
  }, [projects]);

  const filteredProjects = projects.filter((p) => {
    const subsidy = p.subsidies && p.subsidies.length > 0 ? p.subsidies[0] : null;
    const consumerNo =
      p.consumerNumber || subsidy?.consumerNumber || p.customer?.consumerNumber || p.lead?.electricityConnection || '';

    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.projectNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.lead?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      consumerNo.includes(searchQuery);

    if (!matchesSearch) return false;

    const stage = (p.currentStage || '').toUpperCase();
    const stat = (p.status || '').toUpperCase();

    if (activeFilter === 'PLANNING') {
      return stage === 'PLANNING' || stat === 'PLANNING' || stat === 'SURVEY' || stat === 'NOT STARTED';
    }
    if (activeFilter === 'DISCOM') {
      return stage === 'DESIGN' || stage === 'PROCUREMENT' || stat === 'DISCOM' || stat === 'FEASIBILITY';
    }
    if (activeFilter === 'INSTALLATION') {
      return (
        stage === 'INSTALLATION' ||
        stage === 'TESTING' ||
        stat === 'INSTALLATION' ||
        stat === 'TESTING' ||
        (stat === 'IN PROGRESS' && stage !== 'COMPLETED')
      );
    }
    if (activeFilter === 'COMPLETED') {
      return stage === 'COMPLETED' || stage === 'HANDOVER' || stat === 'COMPLETED' || stat === 'SYNCHRONIZED';
    }
    return true;
  });

  const getStagePill = (stageStr?: string, statusStr?: string) => {
    const s = (stageStr || statusStr || 'PLANNING').toUpperCase();
    if (s.includes('COMPLET') || s.includes('SYNCH')) {
      return { bg: '#ecfdf5', text: '#059669', label: 'Synchronized' };
    }
    if (s.includes('INSTALL') || s.includes('TEST') || s.includes('PROGRESS')) {
      return { bg: '#eff6ff', text: '#2563eb', label: 'Erection & QA' };
    }
    if (s.includes('DISCOM') || s.includes('FEASIB') || s.includes('DESIGN')) {
      return { bg: '#faf5ff', text: '#7c3aed', label: 'DISCOM Liaison' };
    }
    return { bg: '#fffbeb', text: '#d97706', label: 'Survey / Permits' };
  };

  return (
    <View style={styles.container}>
      {/* GLOBAL HEADER */}
      <Header
        title="Field Execution & QA"
        subtitle="Live rooftop installations, serial scanning & net-metering"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* EXECUTIVE OPERATIONAL PULSE BAR */}
      <View style={styles.pulseBar}>
        <View style={styles.pulseCard}>
          <Text style={styles.pulseVal}>{pulseStats.totalSites}</Text>
          <Text style={styles.pulseLbl}>Total Sites</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Zap size={14} color="#0284c7" />
            <Text style={[styles.pulseVal, { color: '#0284c7' }]}>{pulseStats.totalKw}</Text>
          </View>
          <Text style={styles.pulseLbl}>Capacity kWp</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseCard}>
          <Text style={[styles.pulseVal, { color: '#d97706' }]}>{pulseStats.erectionCount}</Text>
          <Text style={styles.pulseLbl}>In Erection</Text>
        </View>
        <View style={styles.pulseDivider} />
        <View style={styles.pulseCard}>
          <Text style={[styles.pulseVal, { color: '#059669' }]}>{pulseStats.synchronizedCount}</Text>
          <Text style={styles.pulseLbl}>Synchronized</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {PROJECT_STAGES.map((s) => {
            const isActive = activeFilter === s.id;
            const count = stageCounts[s.id] || 0;
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
                <View style={[styles.tabCountPill, isActive && styles.tabCountPillActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PROJECTS LIST */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Field Projects...</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Briefcase size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No Active Installations</Text>
            <Text style={styles.emptySubtitle}>
              Convert qualified leads to active projects in the Sales Pipeline to initiate rooftop engineering.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation?.navigate('Pipeline')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Go to Sales Pipeline</Text>
              <ArrowRight size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectsWorkspace}>
            {filteredProjects.map((p, idx) => {
              const cap = Number(p.capacity || p.systemCapacity || 3.3);
              const custName = p.customer?.name || p.lead?.name || p.name?.replace(/Project.*/i, '').trim() || 'Client';
              const phone = p.customer?.mobile || p.customer?.phone || p.lead?.mobile;
              const consumerNo =
                p.consumerNumber || p.customer?.consumerNumber || p.lead?.electricityConnection || 'Pending';
              const docsCount = (p.Document || []).length;
              const stagePill = getStagePill(p.currentStage, p.status);

              const progressPct =
                p.currentStage === 'Completed' || p.status === 'COMPLETED'
                  ? '100%'
                  : p.currentStage === 'Installation' || p.status === 'INSTALLATION'
                  ? '75%'
                  : p.currentStage === 'Design' || p.status === 'DISCOM'
                  ? '45%'
                  : '25%';

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.projectRowItem,
                    idx === filteredProjects.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handleOpenDocsModal(p)}
                >
                  {/* Top Status & Capacity Row */}
                  <View style={styles.projectRowTop}>
                    <View style={styles.projectNumberGroup}>
                      <Text style={styles.projectNumberBadge}>{p.projectNumber || 'PRJ-NEW'}</Text>
                      <View style={[styles.stageBadge, { backgroundColor: stagePill.bg }]}>
                        <Text style={[styles.stageBadgeText, { color: stagePill.text }]}>
                          {stagePill.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.projectRightPills}>
                      <View style={styles.progressMiniPill}>
                        <Text style={styles.progressMiniText}>{progressPct}</Text>
                      </View>
                      <View style={styles.capBadge}>
                        <Zap size={11} color="#0284c7" />
                        <Text style={styles.capBadgeText}>{cap} kWp</Text>
                      </View>
                    </View>
                  </View>

                  {/* Project Title & Client Details */}
                  <Text style={styles.projectName} numberOfLines={1}>
                    {p.name}
                  </Text>

                  <View style={styles.projectSubRow}>
                    <Text style={styles.clientDetail} numberOfLines={1}>
                      👤 {custName} • ⚡ {consumerNo}
                    </Text>
                  </View>

                  {/* Field Operations Action Strip (Direct Micro-Actions) */}
                  <View style={styles.microActionsRow}>
                    <View style={styles.leftActionPills}>
                      <TouchableOpacity
                        style={styles.pillActionBtn}
                        onPress={() => handleOpenDocsModal(p)}
                        activeOpacity={0.8}
                      >
                        <FileText size={12} color="#7c3aed" style={{ marginRight: 3 }} />
                        <Text style={styles.pillActionText}>Vault ({docsCount})</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.pillActionBtn}
                        onPress={() =>
                          handleOpenBarcodeModal({ ...p, consumerNumber: consumerNo, capacity: cap })
                        }
                        activeOpacity={0.8}
                      >
                        <QrCode size={12} color="#2563eb" style={{ marginRight: 3 }} />
                        <Text style={styles.pillActionText}>Serials</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.pillActionBtn}
                        onPress={() =>
                          handleOpenQaModal({ ...p, consumerNumber: consumerNo, capacity: cap })
                        }
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={12} color="#059669" style={{ marginRight: 3 }} />
                        <Text style={styles.pillActionText}>QA</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.pillActionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                        onPress={() =>
                          handleOpenDiscomModal({ ...p, consumerNumber: consumerNo, capacity: cap })
                        }
                        activeOpacity={0.8}
                      >
                        <Building size={12} color="#15803d" style={{ marginRight: 3 }} />
                        <Text style={[styles.pillActionText, { color: '#15803d' }]}>DISCOM</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.rightContactBtns}>
                      <TouchableOpacity
                        style={styles.circleCallBtn}
                        onPress={() => handleCall(phone)}
                        activeOpacity={0.7}
                        accessibilityLabel="Call"
                      >
                        <Phone size={13} color="#0284c7" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.circleWhatsAppBtn}
                        onPress={() => handleWhatsApp(phone, custName, p.projectNumber, cap)}
                        activeOpacity={0.7}
                        accessibilityLabel="WhatsApp"
                      >
                        <MessageCircle size={13} color="#15803d" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* DISCOM STATUTORY FORM GENERATOR MODAL */}
      {selectedProject && (
        <DiscomDocsModal
          visible={discomModalVisible}
          project={selectedProject}
          onClose={() => setDiscomModalVisible(false)}
        />
      )}

      {/* BARCODE & INVERTER SERIAL SCANNER MODAL */}
      {selectedProject && (
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          project={selectedProject}
          initialModuleSerials={selectedProject?.moduleSerials}
          initialInverterSerial={selectedProject?.inverterSerial}
          onClose={() => setBarcodeModalVisible(false)}
          onSaveSerials={({ modules, inverter }) => {
            setSelectedProject((prev: any) =>
              prev
                ? {
                    ...prev,
                    moduleSerials: modules,
                    inverterSerial: inverter,
                  }
                : prev
            );
            setProjects((prevList: any[]) =>
              prevList.map((p) =>
                p.id === selectedProject.id
                  ? { ...p, moduleSerials: modules, inverterSerial: inverter }
                  : p
              )
            );
          }}
        />
      )}

      {/* QA & COMMISSIONING AUDIT MODAL */}
      {selectedProject && (
        <InstallationQAModal
          visible={qaModalVisible}
          project={selectedProject}
          onClose={() => setQaModalVisible(false)}
          onSuccess={fetchProjects}
        />
      )}

      {/* COMPLETE PROJECT DOSSIER & COMPLIANCE VAULT MODAL */}
      {selectedProject && (
        <ProjectDossierModal
          visible={docsModalVisible}
          project={selectedProject}
          onClose={() => setDocsModalVisible(false)}
          onRefreshProject={fetchProjects}
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
  pulseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pulseCard: {
    flex: 1,
    alignItems: 'center',
  },
  pulseVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  pulseLbl: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  pulseDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#f1f5f9',
  },
  tabsContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
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
  tabCountPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: '#1e293b',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  tabCountTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
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
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  projectsWorkspace: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  projectRowItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  projectRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectNumberGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectNumberBadge: {
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  projectRightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressMiniPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  capBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  capBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  projectName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  projectSubRow: {
    marginBottom: 10,
  },
  clientDetail: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  microActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  leftActionPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  pillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  rightContactBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleCallBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleWhatsAppBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
