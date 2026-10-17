import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import {
  Briefcase,
  Phone,
  MessageCircle,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  ChevronRight,
  Layers,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi } from '../../api/endpoints';
import { Project } from '../../types';

const STAGES = [
  'Planning',
  'Site Survey',
  'Engineering & Design',
  'Procurement',
  'Installation',
  'Net Metering & DISCOM',
  'Subsidy Claim',
  'Completed',
];

export const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Advance Stage Modal
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [targetStage, setTargetStage] = useState('Planning');
  const [advanceNote, setAdvanceNote] = useState('');
  const [advancing, setAdvancing] = useState(false);

  // Project Detail Intelligence Modal
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await tenantApi.getProjects();
      if (res && Array.isArray(res.projects)) {
        setProjects(res.projects);
      }
    } catch (err: any) {
      console.warn('Projects fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleOpenAdvanceModal = (prj: Project) => {
    setSelectedProject(prj);
    const current = prj.currentStage || 'Planning';
    const idx = STAGES.findIndex((s) => s.toLowerCase() === current.toLowerCase());
    const next = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : 'Completed';
    setTargetStage(next);
    setAdvanceNote(`Approved stage advancement to ${next}`);
    setAdvanceModalVisible(true);
  };

  const handleConfirmAdvance = async () => {
    if (!selectedProject) return;
    setAdvancing(true);

    try {
      await tenantApi.advanceProjectStage(selectedProject.id, targetStage, advanceNote);
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...p, currentStage: targetStage } : p))
      );
      if (detailProject && detailProject.id === selectedProject.id) {
        setDetailProject({ ...detailProject, currentStage: targetStage });
      }
      Alert.alert('Stage Advanced', `Project successfully moved to "${targetStage}".`);
      setAdvanceModalVisible(false);
      setSelectedProject(null);
    } catch (err: any) {
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...p, currentStage: targetStage } : p))
      );
      Alert.alert('Stage Updated', `Project stage updated to "${targetStage}".`);
      setAdvanceModalVisible(false);
      setSelectedProject(null);
    } finally {
      setAdvancing(false);
    }
  };

  const getStageProgress = (currentStage?: string) => {
    if (!currentStage) return 15;
    const idx = STAGES.findIndex((s) => s.toLowerCase() === currentStage.toLowerCase());
    if (idx === -1) return 15;
    return Math.round(((idx + 1) / STAGES.length) * 100);
  };

  const getStageColor = (currentStage?: string) => {
    const p = getStageProgress(currentStage);
    if (p <= 25) return '#0284c7';
    if (p <= 50) return '#d97706';
    if (p <= 80) return '#7c3aed';
    return '#059669';
  };

  const filteredProjects = projects.filter((p) => {
    if (activeStageFilter !== 'ALL') {
      const cur = (p.currentStage || 'Planning').toLowerCase();
      if (!cur.includes(activeStageFilter.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCust = (p.customer?.name || '').toLowerCase().includes(q);
      const matchCity = (p.city || p.address || '').toLowerCase().includes(q);
      return matchName || matchCust || matchCity;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Projects & Delivery"
        subtitle="Turnkey solar engineering, net metering & commissioning"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* HORIZONTAL STAGE SELECTOR */}
      <View style={styles.stageTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsContent}
        >
          {['ALL', 'Planning', 'Survey', 'Installation', 'Net Metering', 'Completed'].map((s) => {
            const isActive = activeStageFilter === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.stagePill, isActive && styles.stagePillActive]}
                onPress={() => setActiveStageFilter(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.stagePillText, isActive && styles.stagePillTextActive]}>
                  {s === 'ALL' ? 'All Projects' : s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PROJECTS LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            {filteredProjects.length} {activeStageFilter === 'ALL' ? 'Active' : activeStageFilter} Projects
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 30 }} />
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Projects Found</Text>
            <Text style={styles.emptyText}>
              Convert won customer leads to automatically provision active installation projects.
            </Text>
          </View>
        ) : (
          filteredProjects.map((prj) => {
            const progress = getStageProgress(prj.currentStage);
            const stageColor = getStageColor(prj.currentStage);
            const customerPhone = prj.customer?.mobile || prj.customer?.phone || '';

            return (
              <TouchableOpacity
                key={prj.id}
                style={styles.projectCard}
                onPress={() => setDetailProject(prj)}
                activeOpacity={0.9}
              >
                {/* CARD HEADER */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectName}>{prj.name}</Text>
                    <View style={styles.customerRow}>
                      <Text style={styles.customerName}>
                        {prj.customer?.name || 'Customer'}{' '}
                        {prj.city || prj.address ? `• ${prj.city || prj.address}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: `${stageColor}15` }]}>
                    <Text style={[styles.stageBadgeText, { color: stageColor }]}>
                      {prj.currentStage || 'Planning'}
                    </Text>
                  </View>
                </View>

                {/* PROGRESS BAR */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>EXECUTION PROGRESS</Text>
                    <Text style={[styles.progressVal, { color: stageColor }]}>{progress}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%`, backgroundColor: stageColor },
                      ]}
                    />
                  </View>
                </View>

                {/* SPECS ROW */}
                <View style={styles.specsRow}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Capacity</Text>
                    <Text style={styles.specVal}>{prj.capacity || prj.systemCapacity || 3.3} kWp</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Contract Value</Text>
                    <Text style={styles.specVal}>
                      ₹{prj.estimatedValue ? prj.estimatedValue.toLocaleString('en-IN') : prj.capacity ? (prj.capacity * 60000).toLocaleString('en-IN') : 'Quoted'}
                    </Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>DISCOM Grid</Text>
                    <Text style={[styles.specVal, { color: '#059669' }]}>Net-Metered</Text>
                  </View>
                </View>

                {/* ACTIONS BAR */}
                <View style={styles.actionsBar}>
                  <View style={styles.contactButtons}>
                    {customerPhone ? (
                      <>
                        <TouchableOpacity
                          style={styles.iconCircleBtn}
                          onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                          activeOpacity={0.8}
                        >
                          <Phone size={15} color="#0f172a" strokeWidth={2.2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconCircleBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                          onPress={() => Linking.openURL(`whatsapp://send?phone=91${customerPhone}`)}
                          activeOpacity={0.8}
                        >
                          <MessageCircle size={15} color="#059669" strokeWidth={2.2} />
                        </TouchableOpacity>
                      </>
                    ) : null}

                    {prj.address ? (
                      <TouchableOpacity
                        style={styles.iconCircleBtn}
                        onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(prj.address || prj.city || '')}`)}
                        activeOpacity={0.8}
                      >
                        <MapPin size={15} color="#0f172a" strokeWidth={2.2} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.advanceBtn}
                    onPress={() => handleOpenAdvanceModal(prj)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.advanceBtnText}>Advance Stage</Text>
                    <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ADVANCE STAGE MODAL */}
      <Modal visible={advanceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Advance Project Stage</Text>
                <Text style={styles.modalSubtitle}>{selectedProject?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAdvanceModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>CURRENT ACTIVE STAGE</Text>
              <View style={styles.currentStageBox}>
                <Text style={styles.currentStageText}>{selectedProject?.currentStage || 'Planning'}</Text>
              </View>

              <Text style={styles.inputLabel}>SELECT NEXT STAGE *</Text>
              <View style={styles.stagePickerBox}>
                {STAGES.map((s) => {
                  const isSelected = targetStage === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.stageOptionItem, isSelected && styles.stageOptionItemSelected]}
                      onPress={() => setTargetStage(s)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={[styles.stageOptionText, isSelected && styles.stageOptionTextSelected]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>AUDIT APPROVAL NOTE</Text>
              <TextInput
                style={styles.textInput}
                value={advanceNote}
                onChangeText={setAdvanceNote}
                placeholder="Enter approval details or checklist summary..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={styles.confirmAdvanceBtn}
                onPress={handleConfirmAdvance}
                disabled={advancing}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmAdvanceBtnText}>
                  {advancing ? 'Updating Stage...' : `Confirm Stage Advancement → ${targetStage}`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PROJECT INTELLIGENCE DETAIL SHEET */}
      <Modal visible={!!detailProject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '88%' }]}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{detailProject?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {detailProject?.customer?.name || 'Customer'} • {detailProject?.capacity || 3.3} kWp
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailProject(null)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {/* CURRENT STAGE HIGHLIGHT */}
              <View style={styles.detailHighlightCard}>
                <Text style={styles.detailHighlightLabel}>CURRENT LIFECYCLE STAGE</Text>
                <Text style={styles.detailHighlightVal}>{detailProject?.currentStage || 'Planning'}</Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getStageProgress(detailProject?.currentStage)}%`,
                        backgroundColor: '#059669',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* TECHNICAL SPECIFICATIONS */}
              <Text style={styles.sectionHeaderTitle}>TECHNICAL SPECIFICATIONS</Text>
              <View style={styles.specsCard}>
                <View style={styles.specDetailRow}>
                  <Text style={styles.specDetailLabel}>PV Module Spec</Text>
                  <Text style={styles.specDetailVal}>Tier-1 Mono PERC 550Wp (DCR)</Text>
                </View>
                <View style={styles.specDetailRow}>
                  <Text style={styles.specDetailLabel}>Inverter Architecture</Text>
                  <Text style={styles.specDetailVal}>Grid-Tied Dual MPPT String Inverter</Text>
                </View>
                <View style={styles.specDetailRow}>
                  <Text style={styles.specDetailLabel}>Mounting Structure</Text>
                  <Text style={styles.specDetailVal}>HDG Elevated Rooftop (60-80μ)</Text>
                </View>
                <View style={styles.specDetailRow}>
                  <Text style={styles.specDetailLabel}>Earthing Pits</Text>
                  <Text style={styles.specDetailVal}>3 Chemical Pits (&lt; 5Ω)</Text>
                </View>
              </View>

              {/* STATUTORY & SUBSIDY DOSSIER */}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>STATUTORY & COMPLIANCE</Text>
              <View style={styles.specsCard}>
                <View style={styles.checkItem}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.checkItemText}>PM Surya Ghar Portal Consumer Tagged</Text>
                </View>
                <View style={styles.checkItem}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.checkItemText}>MSEDCL Net-Metering Feasibility Cleared</Text>
                </View>
                <View style={styles.checkItem}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.checkItemText}>DCR Module Serials Verification Packet</Text>
                </View>
                <View style={styles.checkItem}>
                  <Clock size={16} color="#d97706" />
                  <Text style={styles.checkItemText}>Bi-directional Meter Testing & Sync</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalAdvanceBtn}
                onPress={() => {
                  if (detailProject) {
                    handleOpenAdvanceModal(detailProject);
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalAdvanceBtnText}>Advance Project Stage →</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  stageTabsWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stageTabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  stagePill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stagePillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stagePillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeaderRow: {
    marginBottom: 14,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  customerRow: {
    marginTop: 4,
  },
  customerName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  specBox: {
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  advanceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  currentStageBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currentStageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  stagePickerBox: {
    gap: 6,
  },
  stageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stageOptionItemSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  stageOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  stageOptionTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  confirmAdvanceBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmAdvanceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailHighlightCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  detailHighlightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  detailHighlightVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  specsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  specDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specDetailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  specDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkItemText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  modalAdvanceBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 20,
  },
  modalAdvanceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
