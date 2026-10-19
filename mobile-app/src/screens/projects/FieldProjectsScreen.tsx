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
  Alert,
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
  Award,
  FileText,
  ExternalLink,
  X,
} from 'lucide-react-native';
import { Modal } from 'react-native';
import { tenantApi } from '../../api/endpoints';
import { apiClient } from '../../api/client';
import { DiscomDocsModal } from './DiscomDocsModal';
import { BarcodeScannerModal } from '../operations/BarcodeScannerModal';
import { InstallationQAModal } from '../operations/InstallationQAModal';
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

  const openDocumentUrl = async (rawUrl?: string | null) => {
    if (!rawUrl) return;
    let finalUrl = rawUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      const base = apiClient.defaults.baseURL || 'http://localhost:5000';
      finalUrl = `${base.replace(/\/+$/, '')}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
    }
    try {
      await Linking.openURL(finalUrl);
    } catch {
      Alert.alert('Cannot Open Document', 'Unable to open document file: ' + finalUrl);
    }
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

  const filteredProjects = projects.filter((p) => {
    const subsidy = p.subsidies && p.subsidies.length > 0 ? p.subsidies[0] : null;
    const consumerNo = p.consumerNumber || subsidy?.consumerNumber || p.customer?.consumerNumber || p.lead?.electricityConnection || '';

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
      return stage === 'INSTALLATION' || stage === 'TESTING' || stat === 'INSTALLATION' || stat === 'TESTING' || (stat === 'IN PROGRESS' && stage !== 'COMPLETED');
    }
    if (activeFilter === 'COMPLETED') {
      return stage === 'COMPLETED' || stage === 'HANDOVER' || stat === 'COMPLETED' || stat === 'SYNCHRONIZED';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Field Site Operations</Text>
          <Text style={styles.headerSubtitle}>
            Active Installations, Hardware Serialization & DISCOM Compliance
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
            <Text style={styles.loadingText}>Loading Field Projects...</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Briefcase size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Active Installations</Text>
            <Text style={styles.emptySubtitle}>
              Convert leads to clients in the Pipeline to initialize field execution.
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
                    <View style={styles.badgeRow}>
                      <Text style={styles.projectNumberBadge}>{p.projectNumber || 'PRJ-NEW'}</Text>
                      <Text style={styles.stageTag}>{p.currentStage || p.status || 'Planning'}</Text>
                    </View>
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
                    <Text style={styles.milestoneTitle}>Stage Progress</Text>
                    <Text style={styles.milestoneStatus}>{p.currentStage || p.status || 'PLANNING'}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width:
                            (p.currentStage === 'Completed' || p.status === 'COMPLETED')
                              ? '100%'
                              : (p.currentStage === 'Installation' || p.status === 'INSTALLATION')
                              ? '75%'
                              : (p.currentStage === 'Design' || p.status === 'DISCOM')
                              ? '45%'
                              : '25%',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* 4 FIELD ACTION CTAS */}
                <View style={styles.cardActionsCol}>
                  <View style={styles.actionRowTop}>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(phone)}
                      activeOpacity={0.7}
                    >
                      <Phone size={15} color="#0284c7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.docsBtn}
                      onPress={() => handleOpenDocsModal(p)}
                      activeOpacity={0.8}
                    >
                      <FileText size={14} color="#7c3aed" />
                      <Text style={styles.docsBtnText}>Docs ({(p.Document || []).length})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.barcodeBtn}
                      onPress={() => handleOpenBarcodeModal({ ...p, consumerNumber: consumerNo, capacity: cap })}
                      activeOpacity={0.8}
                    >
                      <QrCode size={14} color="#2563eb" />
                      <Text style={styles.barcodeBtnText}>Barcodes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.qaBtn}
                      onPress={() => handleOpenQaModal({ ...p, consumerNumber: consumerNo, capacity: cap })}
                      activeOpacity={0.8}
                    >
                      <ShieldCheck size={14} color="#16a34a" />
                      <Text style={styles.qaBtnText}>QA Test</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.discomCta}
                    onPress={() => handleOpenDiscomModal({ ...p, consumerNumber: consumerNo, capacity: cap })}
                    activeOpacity={0.85}
                  >
                    <Building size={15} color="#ffffff" />
                    <Text style={styles.discomCtaText}>Generate Official DISCOM Docs (Form A-1, WCR)</Text>
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

      {/* BARCODE SCANNER MODAL */}
      {selectedProject && (
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          project={selectedProject}
          onClose={() => setBarcodeModalVisible(false)}
        />
      )}

      {/* QA & TESTING MODAL */}
      {selectedProject && (
        <InstallationQAModal
          visible={qaModalVisible}
          project={selectedProject}
          onClose={() => setQaModalVisible(false)}
          onSuccess={fetchProjects}
        />
      )}

      {/* FIELD DOCUMENTS VIEWER MODAL */}
      {selectedProject && (
        <Modal
          visible={docsModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setDocsModalVisible(false)}
        >
          <View style={styles.docModalContainer}>
            <View style={styles.docModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.docModalTitle}>Project Documents</Text>
                <Text style={styles.docModalSubtitle}>
                  {selectedProject.projectNumber || 'PRJ'} • {selectedProject.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDocsModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              {(!selectedProject.Document || selectedProject.Document.length === 0) ? (
                <View style={styles.emptyDocsBox}>
                  <FileText size={40} color="#94a3b8" />
                  <Text style={styles.emptyDocsTitle}>No Uploaded Documents</Text>
                  <Text style={styles.emptyDocsSub}>
                    Documents attached by field representatives during onboarding (Electricity bill, Aadhaar, PAN, Roof photos) will be listed here.
                  </Text>
                </View>
              ) : (
                selectedProject.Document.map((doc: any) => (
                  <View key={doc.id} style={styles.docItemCard}>
                    <View style={styles.docItemLeft}>
                      <View style={styles.docItemIconCircle}>
                        <FileText size={18} color="#2563eb" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docItemTitle}>{doc.title}</Text>
                        <Text style={styles.docItemCategory}>
                          {doc.category || 'Customer KYC'} • {new Date(doc.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.docItemStatus}>
                          Status: <Text style={{ color: doc.status === 'VERIFIED' ? '#16a34a' : '#d97706', fontWeight: 'bold' }}>{doc.status || 'UPLOADED'}</Text>
                        </Text>
                      </View>
                    </View>
                    {doc.fileUrl && (
                      <TouchableOpacity
                        style={styles.docOpenBtn}
                        onPress={() => openDocumentUrl(doc.fileUrl)}
                        activeOpacity={0.7}
                      >
                        <ExternalLink size={14} color="#2563eb" />
                        <Text style={styles.docOpenText}>View</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>
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
    marginBottom: 12,
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
  cardActionsCol: {
    gap: 8,
  },
  actionRowTop: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  barcodeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  qaBtn: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  projectNumberBadge: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stageTag: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docsBtn: {
    flex: 1,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  docsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
  },
  docModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  docModalHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  docModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  emptyDocsBox: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyDocsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyDocsSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  docItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docItemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  docItemCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  docItemStatus: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  docOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginLeft: 8,
  },
  docOpenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  discomCta: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  discomCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
