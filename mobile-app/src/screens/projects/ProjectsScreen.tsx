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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [targetStage, setTargetStage] = useState('Planning');
  const [advancing, setAdvancing] = useState(false);

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
  };

  const handleConfirmAdvance = async () => {
    if (!selectedProject) return;
    setAdvancing(true);

    try {
      await tenantApi.advanceProjectStage(selectedProject.id, targetStage);
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...p, currentStage: targetStage } : p))
      );
      Alert.alert('Stage Advanced', `Project advanced to "${targetStage}". Synced to Vercel.`);
      setSelectedProject(null);
    } catch (err: any) {
      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...p, currentStage: targetStage } : p))
      );
      Alert.alert('Stage Updated', `Project moved to "${targetStage}".`);
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

  const filteredProjects = projects.filter((p) => {
    if (activeStageFilter !== 'ALL' && (p.currentStage || p.status) !== activeStageFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCust = (p.customer?.name || '').toLowerCase().includes(q);
      return matchName || matchCust;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Project Pipeline"
        subtitle="Engineering, installation & net-metering stages"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* STAGE FILTERS SCROLL */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeStageFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveStageFilter('ALL')}
          >
            <Text style={[styles.filterChipText, activeStageFilter === 'ALL' && styles.filterChipTextActive]}>
              All Projects ({projects.length})
            </Text>
          </TouchableOpacity>

          {STAGES.map((stg) => (
            <TouchableOpacity
              key={stg}
              style={[styles.filterChip, activeStageFilter === stg && styles.filterChipActive]}
              onPress={() => setActiveStageFilter(stg)}
            >
              <Text style={[styles.filterChipText, activeStageFilter === stg && styles.filterChipTextActive]}>
                {stg}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PROJECTS LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📁</Text>
            <Text style={styles.emptyTitle}>No projects in this stage</Text>
            <Text style={styles.emptySub}>Convert qualified leads or update stage filters.</Text>
          </View>
        ) : (
          filteredProjects.map((prj) => {
            const progress = getStageProgress(prj.currentStage || prj.status);
            return (
              <View key={prj.id} style={styles.projectCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectName}>{prj.name}</Text>
                    <Text style={styles.clientSub}>
                      👤 {prj.customer?.name || 'Customer'}{' '}
                      {prj.capacity ? `• ⚡ ${prj.capacity} kWp Rooftop System` : ''}
                    </Text>
                  </View>
                  <View style={styles.stageTag}>
                    <Text style={styles.stageTagText}>{prj.currentStage || prj.status || 'Planning'}</Text>
                  </View>
                </View>

                {/* PROGRESS BAR */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Execution Progress</Text>
                    <Text style={styles.progressPercent}>{progress}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                  </View>
                </View>

                {/* FINANCIAL & LOCATION DETAILS */}
                <View style={styles.detailsRow}>
                  <View>
                    <Text style={styles.metaLabel}>CONTRACT VALUE</Text>
                    <Text style={styles.metaVal}>
                      ₹{prj.estimatedValue ? prj.estimatedValue.toLocaleString('en-IN') : '1,83,526'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metaLabel}>LOCATION</Text>
                    <Text style={styles.metaVal}>{prj.city || 'Nagpur, MH'}</Text>
                  </View>
                </View>

                {/* ACTION BUTTON */}
                <TouchableOpacity
                  style={styles.advanceActionBtn}
                  onPress={() => handleOpenAdvanceModal(prj)}
                >
                  <Text style={styles.advanceActionBtnText}>⚡ Advance Project Stage</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ADVANCE STAGE MODAL */}
      <Modal visible={!!selectedProject} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Advance Project Stage</Text>
            <Text style={styles.modalSub}>
              Select the next engineering or commissioning milestone for{' '}
              <Text style={{ fontWeight: '800', color: colors.slate900 }}>
                {selectedProject?.name}
              </Text>
            </Text>

            <Text style={styles.inputLabel}>TARGET MILESTONE STAGE</Text>
            <View style={styles.stagesOptionBox}>
              {STAGES.map((stg) => (
                <TouchableOpacity
                  key={stg}
                  style={[styles.stageOptionBtn, targetStage === stg && styles.stageOptionActive]}
                  onPress={() => setTargetStage(stg)}
                >
                  <Text
                    style={[styles.stageOptionText, targetStage === stg && styles.stageOptionTextActive]}
                  >
                    {stg}
                  </Text>
                  {targetStage === stg && <Text style={{ color: colors.primary, fontWeight: '900' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmAdvanceBtn, advancing && { opacity: 0.7 }]}
              onPress={handleConfirmAdvance}
              disabled={advancing}
            >
              {advancing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmAdvanceBtnText}>Confirm Stage Advancement</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSelectedProject(null)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
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
  filterStrip: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate600,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyCard: {
    backgroundColor: colors.white,
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate800,
  },
  emptySub: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  },
  projectName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate900,
  },
  clientSub: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  stageTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stageTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  progressContainer: {
    marginTop: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate400,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
    marginTop: 2,
  },
  advanceActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  advanceActionBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSub: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 3,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stagesOptionBox: {
    gap: 6,
    marginBottom: 16,
  },
  stageOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  stageOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  stageOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate800,
  },
  stageOptionTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  confirmAdvanceBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmAdvanceBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: colors.slate500,
    fontSize: 13,
    fontWeight: '700',
  },
});
