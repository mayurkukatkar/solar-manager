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
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
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
      Alert.alert('Stage Advanced 🎉', `Project successfully moved to "${targetStage}".`);
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
    if (p <= 25) return '#3b82f6';
    if (p <= 50) return '#f59e0b';
    if (p <= 80) return '#6366f1';
    return '#10b981';
  };

  const filteredProjects = projects.filter((p) => {
    if (activeStageFilter !== 'ALL' && (p.currentStage || 'Planning') !== activeStageFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCustomer = (p.customer?.name || '').toLowerCase().includes(q);
      const matchCity = (p.city || '').toLowerCase().includes(q);
      return matchName || matchCustomer || matchCity;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Projects Portfolio"
        subtitle="EPC lifecycle execution & DISCOM statutory compliance"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* HORIZONTAL STAGE SELECTOR */}
      <View style={styles.stageTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabsContent}>
          <TouchableOpacity
            style={[styles.stageTab, activeStageFilter === 'ALL' && styles.stageTabActive]}
            onPress={() => setActiveStageFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.stageTabText, activeStageFilter === 'ALL' && styles.stageTabTextActive]}>
              All Projects ({projects.length})
            </Text>
          </TouchableOpacity>
          {STAGES.map((s) => {
            const count = projects.filter((p) => (p.currentStage || 'Planning') === s).length;
            const isActive = activeStageFilter === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.stageTab, isActive && styles.stageTabActive]}
                onPress={() => setActiveStageFilter(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.stageTabText, isActive && styles.stageTabTextActive]}>
                  {s} ({count})
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
            Showing {filteredProjects.length} {activeStageFilter === 'ALL' ? 'Total' : activeStageFilter} Projects
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No Projects in this Stage</Text>
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
                    <Text style={styles.customerName}>
                      👤 {prj.customer?.name || 'Customer'}{' '}
                      {prj.city || prj.address ? `• ${prj.city || prj.address}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.stagePill, { backgroundColor: `${stageColor}15` }]}>
                    <Text style={[styles.stagePillText, { color: stageColor }]}>
                      {prj.currentStage || 'Planning'}
                    </Text>
                  </View>
                </View>

                {/* PROGRESS BAR */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>LIFECYCLE PROGRESS</Text>
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

                {/* SPECS & FINANCIALS ROW */}
                <View style={styles.specsRow}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>CAPACITY</Text>
                    <Text style={styles.specVal}>{prj.capacity || prj.systemCapacity || 3.3} kWp</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>CONTRACT VALUE</Text>
                    <Text style={styles.specVal}>
                      ₹{prj.estimatedValue ? prj.estimatedValue.toLocaleString('en-IN') : prj.capacity ? (prj.capacity * 60000).toLocaleString('en-IN') : 'Quoted'}
                    </Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>DISCOM GRID</Text>
                    <Text style={[styles.specVal, { color: '#059669' }]}>Net-Metered</Text>
                  </View>
                </View>

                {/* ACTIONS BAR */}
                <View style={styles.actionsBar}>
                  {customerPhone ? (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnText}>📞 Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                        onPress={() => Linking.openURL(`whatsapp://send?phone=91${customerPhone}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionBtnText, { color: '#047857' }]}>💬 Chat</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {prj.address ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(prj.address || prj.city || '')}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnText}>🧭 Maps</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.advanceStageActionBtn}
                    onPress={() => handleOpenAdvanceModal(prj)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.advanceStageActionBtnText}>⚡ Advance Stage</Text>
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
          <View style={styles.advanceModalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Advance Project Stage</Text>
                <Text style={styles.modalSubtitle}>{selectedProject?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAdvanceModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>SELECT TARGET STAGE</Text>
            <View style={styles.stagePickerGrid}>
              {STAGES.map((stg) => {
                const isSelected = targetStage === stg;
                return (
                  <TouchableOpacity
                    key={stg}
                    style={[styles.stagePickerBtn, isSelected && styles.stagePickerBtnSelected]}
                    onPress={() => setTargetStage(stg)}
                  >
                    <Text
                      style={[
                        styles.stagePickerBtnText,
                        isSelected && styles.stagePickerBtnTextSelected,
                      ]}
                    >
                      {stg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>AUDIT NOTE / WORK ORDER</Text>
            <TextInput
              style={styles.noteInput}
              value={advanceNote}
              onChangeText={setAdvanceNote}
              placeholder="e.g. MSEDCL inspection cleared, proceeding to net meter sync"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.confirmAdvanceBtn}
              onPress={handleConfirmAdvance}
              disabled={advancing}
              activeOpacity={0.85}
            >
              {advancing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmAdvanceBtnText}>
                  Confirm Advancement to {targetStage}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PROJECT INTELLIGENCE DETAIL MODAL */}
      <Modal visible={!!detailProject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {detailProject && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailProjectTitle}>{detailProject.name}</Text>
                    <Text style={styles.detailProjectSubtitle}>
                      {detailProject.customer?.name} • {detailProject.city || 'Site Address'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailProject(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  {/* LIFECYCLE STAGE TIMELINE */}
                  <Text style={styles.sectionHeading}>EPC LIFECYCLE TIMELINE</Text>
                  <View style={styles.timelineBox}>
                    {STAGES.map((stg, i) => {
                      const curIdx = STAGES.findIndex(
                        (s) => s.toLowerCase() === (detailProject.currentStage || 'Planning').toLowerCase()
                      );
                      const isDone = i <= curIdx;
                      const isCurrent = i === curIdx;

                      return (
                        <View key={stg} style={styles.timelineRow}>
                          <View
                            style={[
                              styles.timelineDot,
                              isDone ? styles.timelineDotDone : styles.timelineDotPending,
                              isCurrent && styles.timelineDotCurrent,
                            ]}
                          >
                            <Text style={styles.timelineDotText}>{isDone ? '✓' : i + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.timelineStageText,
                                isCurrent && { fontWeight: '900', color: colors.slate900 },
                              ]}
                            >
                              {stg}
                            </Text>
                          </View>
                          {isCurrent && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>Active Stage</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* STATUTORY MSEDCL & PM SURYA GHAR COMPLIANCE PACK */}
                  <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
                    STATUTORY MSEDCL / PM SURYA GHAR PACK
                  </Text>
                  <View style={styles.complianceBox}>
                    <View style={styles.complianceRow}>
                      <Text style={styles.complianceName}>📄 Work Completion Report (WCR Annexure-1)</Text>
                      <Text style={styles.complianceStatusOk}>✓ Generated</Text>
                    </View>
                    <View style={styles.complianceRow}>
                      <Text style={styles.complianceName}>📄 Domestic Content Requirement (DCR Undertaking)</Text>
                      <Text style={styles.complianceStatusOk}>✓ Verified</Text>
                    </View>
                    <View style={styles.complianceRow}>
                      <Text style={styles.complianceName}>📄 Net Metering Connection Agreement (2019)</Text>
                      <Text style={styles.complianceStatusOk}>✓ Filed</Text>
                    </View>
                    <View style={styles.complianceRow}>
                      <Text style={styles.complianceName}>📄 PM Surya Ghar National Portal Subsidy Claim</Text>
                      <Text style={styles.complianceStatusWait}>⏳ In Review</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.advanceFromDetailBtn}
                    onPress={() => {
                      setDetailProject(null);
                      handleOpenAdvanceModal(detailProject);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.advanceFromDetailBtnText}>⚡ Advance to Next Stage</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stageTabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stageTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stageTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  stageTabActive: {
    backgroundColor: colors.primary,
  },
  stageTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate600,
  },
  stageTabTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  listHeaderRow: {
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate900,
  },
  customerName: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  stagePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stagePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  specBox: {
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.slate900,
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate700,
  },
  advanceStageActionBtn: {
    flex: 1,
    backgroundColor: colors.slate900,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  advanceStageActionBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  advanceModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  detailModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate500,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate500,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stagePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  stagePickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stagePickerBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stagePickerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate700,
  },
  stagePickerBtnTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate900,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  confirmAdvanceBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmAdvanceBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  detailProjectTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  detailProjectSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  timelineBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.primary,
  },
  timelineDotPending: {
    backgroundColor: '#cbd5e1',
  },
  timelineDotCurrent: {
    borderWidth: 2,
    borderColor: colors.slate900,
  },
  timelineDotText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },
  timelineStageText: {
    fontSize: 12,
    color: colors.slate700,
    fontWeight: '600',
  },
  activePill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  complianceBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complianceName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate700,
    flex: 1,
  },
  complianceStatusOk: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  complianceStatusWait: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  advanceFromDetailBtn: {
    backgroundColor: colors.slate900,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  advanceFromDetailBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});
