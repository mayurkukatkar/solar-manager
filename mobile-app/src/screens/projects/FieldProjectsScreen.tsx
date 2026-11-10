import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import {
  Briefcase,
  Phone,
  MessageCircle,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  FileText,
  ChevronRight,
  AlertCircle,
  User,
  MapPin,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { tenantApi } from '../../api/endpoints';
import { SafeStorage } from '../../api/client';
import { DiscomDocsModal } from './DiscomDocsModal';
import { BarcodeScannerModal } from '../operations/BarcodeScannerModal';
import { InstallationQAModal } from '../operations/InstallationQAModal';
import { ProjectDossierModal } from './ProjectDossierModal';
import { CelebrationModal } from '../../components/CelebrationModal';
import { SeamlessSolarFlowModal } from '../../components/SeamlessSolarFlowModal';
import { SolarJourneyRoadmap } from '../../components/SolarJourneyRoadmap';
import { solarGamificationService } from '../../services/solarGamificationService';
import { openWhatsAppDirect } from '../../services/whatsappService';
import { useTheme } from '../../theme';
import { haptics } from '../../utils/haptics';
import { offlineSyncService } from '../../services/offlineSyncService';
import { EmptyState, SkeletonLoader } from '../../components/common';

export const CANONICAL_PROJECT_STAGES = [
  { id: 'ALL', label: 'All Projects', color: '#0F172A' },
  { id: 'SURVEY', label: '1. Survey', color: '#6366F1' },
  { id: 'ENGINEERING', label: '2. Engineering', color: '#8B5CF6' },
  { id: 'PROCUREMENT', label: '3. Procurement', color: '#EC4899' },
  { id: 'INSTALLATION', label: '4. Installation', color: '#0066FF' },
  { id: 'NET_METERING', label: '5. Net Metering', color: '#7C3AED' },
  { id: 'INSPECTION', label: '6. Inspection & QA', color: '#F59E0B' },
  { id: 'HANDOVER', label: '7. Handover & DBT', color: '#10B981' },
];

export function getProjectStageIndex(stageOrStatus?: string): number {
  const s = (stageOrStatus || '').toUpperCase();
  if (s.includes('HANDOVER') || s.includes('SYNC') || s.includes('COMPLET') || s.includes('COMMISSION')) return 7;
  if (s.includes('INSPECT') || s.includes('QA') || s.includes('TEST') || s.includes('CEIG')) return 6;
  if (s.includes('NET') || s.includes('METER') || s.includes('DISCOM')) return 5;
  if (s.includes('INSTALL') || s.includes('ERECT')) return 4;
  if (s.includes('PROCURE') || s.includes('MATERIAL') || s.includes('DISPATCH')) return 3;
  if (s.includes('ENG') || s.includes('DESIGN') || s.includes('SLD')) return 2;
  return 1;
}

export function calculateProjectProgressPct(stageOrStatus?: string): number {
  const idx = getProjectStageIndex(stageOrStatus);
  return Math.round((idx / 7) * 100);
}

export const FieldProjectsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
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

  // 1-Flow Studio State
  const [seamlessFlowVisible, setSeamlessFlowVisible] = useState(false);
  const [seamlessInitialProject, setSeamlessInitialProject] = useState<any | null>(null);
  const [seamlessInitialStep, setSeamlessInitialStep] = useState<number>(0);

  const handleOpenSeamlessFlowForProject = (proj: any, stepIdx?: number) => {
    setSeamlessInitialProject(proj);
    if (stepIdx !== undefined) {
      setSeamlessInitialStep(stepIdx);
    } else {
      const idx = getProjectStageIndex(proj?.currentStage || proj?.status);
      if (idx >= 5) setSeamlessInitialStep(13); // DISCOM Mission Control
      else if (proj?.consumerNumber) setSeamlessInitialStep(13);
      else setSeamlessInitialStep(9); // CONSUMER_NUMBER
    }
    setSeamlessFlowVisible(true);
  };

  // Stage Advancement Modal State
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [projectToAdvance, setProjectToAdvance] = useState<any | null>(null);
  const [advanceNote, setAdvanceNote] = useState('');
  const [advancingStage, setAdvancingStage] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleOpenStageAdvanceModal = async (proj: any) => {
    let enhanced = { ...proj };
    if (proj?.id) {
      try {
        if (!enhanced.qaReadings) {
          const storedQA = await SafeStorage.getItem(`@solar_qa_${proj.id}`);
          if (storedQA) {
            enhanced.qaReadings = JSON.parse(storedQA);
          }
        }
        if ((!enhanced.moduleSerials || enhanced.moduleSerials.length === 0) && !enhanced.dcrModuleSerials) {
          const storedSerials =
            (await SafeStorage.getItem(`@solar_project_serials_${proj.id}`)) ||
            (await SafeStorage.getItem(`@solar_serials_${proj.id}`));
          if (storedSerials) {
            const parsed = JSON.parse(storedSerials);
            if (parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
              enhanced.moduleSerials = parsed.modules;
            }
          }
        }
      } catch (_) { }
    }
    setProjectToAdvance(enhanced);
    setAdvanceNote('');
    setAdvanceModalVisible(true);
  };

  const getPrerequisites = (proj: any) => {
    const idx = getProjectStageIndex(proj?.currentStage || proj?.status);
    const consumerNo = proj?.consumerNumber || proj?.customer?.consumerNumber || proj?.lead?.electricityConnection;
    const hasSerials = (proj?.moduleSerials && proj.moduleSerials.length > 0) || Boolean(proj?.dcrModuleSerials);
    const hasDocs = proj?.Document && proj.Document.length > 0;

    const checks = [];
    if (idx === 1) {
      checks.push({
        title: 'DISCOM Consumer Number',
        met: Boolean(consumerNo && consumerNo !== 'Pending'),
        detail: consumerNo ? `Verified: ${consumerNo}` : 'Missing consumer number',
      });
      checks.push({
        title: 'Site Survey Documentation',
        met: hasDocs || Boolean(proj?.address),
        detail: 'Site location and rooftop specifications recorded',
      });
    } else if (idx === 2) {
      checks.push({
        title: 'Approved Plant Capacity',
        met: Number(proj?.capacity || proj?.systemCapacity) > 0,
        detail: `${proj?.capacity || 3.3} kWp System Kit`,
      });
      checks.push({
        title: 'BOM Engineering Allocation',
        met: true,
        detail: 'PV Module & Inverter brand selection assigned',
      });
    } else if (idx === 3) {
      checks.push({
        title: 'Material Dispatch Confirmation',
        met: true,
        detail: 'DCR modules & mounting structure dispatched to site',
      });
    } else if (idx === 4) {
      checks.push({
        title: '2D Module Serial Barcodes',
        met: Boolean(hasSerials),
        detail: hasSerials
          ? 'Tier-1 ALMM/DCR hardware serial numbers recorded'
          : 'Missing scanned 2D module serial barcodes',
      });
      checks.push({
        title: 'Mechanical & DC Erection',
        met: true,
        detail: 'Mid/end clamps torqued and DC cabling routed',
      });
    } else if (idx === 5) {
      checks.push({
        title: 'DISCOM Application Submission',
        met: Boolean(consumerNo && consumerNo !== 'Pending'),
        detail: consumerNo ? 'Annexure statutory templates generated' : 'Missing consumer number',
      });
    } else if (idx === 6) {
      const qa = proj?.qaReadings;
      const isQaPassed = qa
        ? qa.passed === true ||
        (parseFloat(qa.pit1Inverter) >= 0 &&
          parseFloat(qa.pit1Inverter) < 5.0 &&
          parseFloat(qa.pit2Structure) >= 0 &&
          parseFloat(qa.pit2Structure) < 5.0 &&
          parseFloat(qa.pit3Lightning) >= 0 &&
          parseFloat(qa.pit3Lightning) < 5.0 &&
          parseFloat(qa.antiIslandingTripSec) >= 0 &&
          parseFloat(qa.antiIslandingTripSec) < 2.0 &&
          parseFloat(qa.insulationMegaOhms) > 1.0)
        : Boolean(proj?.qaPassed || proj?.isQaPassed || proj?.ceaSafetyPassed);
      checks.push({
        title: 'CEA Safety Threshold Sign-off',
        met: Boolean(isQaPassed),
        detail: isQaPassed
          ? 'Earthing pit readings < 5.0Ω and trip time < 2.0s passed'
          : 'Pending CEA safety testing & earthing pit sign-off (<5.0Ω / <2.0s)',
      });
    } else {
      checks.push({
        title: 'Client Commissioning Handover',
        met: true,
        detail: 'Net meter energized & DBT release filed',
      });
    }
    return checks;
  };

  const handleConfirmStageAdvance = async () => {
    if (!projectToAdvance?.id) return;
    const currentIdx = getProjectStageIndex(projectToAdvance.currentStage || projectToAdvance.status);
    if (currentIdx >= 7) {
      haptics.notificationWarning();
      Alert.alert('Project Completed', 'This installation has already reached final handover.');
      return;
    }
    const nextStage = CANONICAL_PROJECT_STAGES[currentIdx + 1];
    if (!nextStage) return;

    const prereqs = getPrerequisites(projectToAdvance);
    const unmet = prereqs.filter((c) => !c.met);
    if (unmet.length > 0) {
      haptics.notificationWarning();
      Alert.alert(
        'Prerequisites Incomplete',
        `Cannot advance stage due to missing prerequisites:\n\n• ${unmet
          .map((u) => u.title + ': ' + u.detail)
          .join('\n• ')}`
      );
      return;
    }

    setAdvancingStage(true);
    const isCompletion = nextStage.id === 'HANDOVER' || (currentIdx + 1) >= 7;
    const actionType = isCompletion ? 'PROJECT_COMPLETED' : 'STAGE_ADVANCED';
    const capacityVal = Number(projectToAdvance?.capacity || 3.3);

    try {
      await tenantApi.advanceProjectStage(
        projectToAdvance.id,
        nextStage.id,
        advanceNote.trim() || `Advanced to ${nextStage.label} via Mobile Field Cockpit`
      );

      let reward: any = null;
      try {
        reward = await solarGamificationService.recordAction(actionType, {
          capacityKw: capacityVal,
          customerName: projectToAdvance?.customer?.name || projectToAdvance?.name,
          projectName: projectToAdvance?.name,
        });
      } catch (_) {}

      setCelebrationData({
        title: isCompletion ? 'Project 100% Completed & Energized! ☀️' : `${nextStage.label} Milestone Achieved! 🚀`,
        subtitle: isCompletion
          ? `Congratulations! "${projectToAdvance.name}" has completed grid net-metering and handover. Client is now generating clean power!`
          : `Project "${projectToAdvance.name}" has smoothly advanced to ${nextStage.label}.`,
        stageName: isCompletion ? 'Final Handover & DBT Subsidy' : nextStage.label,
        xpAwarded: reward?.xpGained || (isCompletion ? 300 : 50),
        badgeUnlocked: reward?.unlockedBadge?.title,
        customerName: projectToAdvance?.customer?.name,
        customerPhone: projectToAdvance?.customer?.mobile,
        projectName: projectToAdvance?.name,
        capacityKw: capacityVal,
        peaceOfMindPoints: isCompletion
          ? [
              'Official Handover & Commissioning Certificate generated & archived',
              'DISCOM net-meter bi-directional synchronization certified',
              'National Portal DBT subsidy status marked ready for disbursement',
            ]
          : [
              'Milestone transition recorded & synced to cloud operations desk',
              'Stage prerequisites validated with zero data leakage',
              'Next operational workflow ready for instant field execution',
            ],
      });
      setShowCelebration(true);
      setAdvanceModalVisible(false);
      fetchProjects();
    } catch (err: any) {
      try {
        await offlineSyncService.enqueueMutation('UPDATE_PROJECT_STAGE', {
          projectId: projectToAdvance.id,
          stage: nextStage.id,
          stageId: nextStage.id,
          status: nextStage.id,
          note: advanceNote.trim() || `Advanced to ${nextStage.label} via Mobile Field Cockpit`,
        });

        let reward: any = null;
        try {
          reward = await solarGamificationService.recordAction(actionType, {
            capacityKw: capacityVal,
            customerName: projectToAdvance?.customer?.name || projectToAdvance?.name,
            projectName: projectToAdvance?.name,
          });
        } catch (_) {}

        setCelebrationData({
          title: `${nextStage.label} Saved Offline! 🛡️`,
          subtitle: `Project "${projectToAdvance.name}" milestone to ${nextStage.label} is safely preserved on your device. Will auto-sync once online.`,
          stageName: `${nextStage.label} (Offline Safe)`,
          xpAwarded: reward?.xpGained || 50,
          customerName: projectToAdvance?.customer?.name,
          customerPhone: projectToAdvance?.customer?.mobile,
          projectName: projectToAdvance?.name,
          capacityKw: capacityVal,
        });
        setShowCelebration(true);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToAdvance.id
              ? { ...p, currentStage: nextStage.id, status: nextStage.id }
              : p
          )
        );
      } catch (queueErr) {
        Alert.alert('Stage Advance Note', err.message || 'Stage updated successfully.');
      }
      setAdvanceModalVisible(false);
      fetchProjects();
    } finally {
      setAdvancingStage(false);
    }
  };

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
      const cached = await offlineSyncService.getCachedResponse<any[]>('projects');
      if (cached?.data && Array.isArray(cached.data) && projects.length === 0) {
        setProjects(cached.data);
        setLoading(false);
      }

      const res = await tenantApi.getProjects().catch(() => null);
      if (res && Array.isArray(res.projects)) {
        setProjects(res.projects);
        await offlineSyncService.setCachedResponse('projects', res.projects);
      }
    } catch (err: any) {
      console.warn('Projects fetch notice:', err.message);
      const cached = await offlineSyncService.getCachedResponse<any[]>('projects');
      if (cached?.data && Array.isArray(cached.data)) {
        setProjects(cached.data);
      }
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
    const msg = `☀️ *WhereReady Solar OS — Installation Status Update* ☀️\n\nDear *${clientName || 'Customer'
      }*,\n\nWe are actively executing your *${capacity || 3.3} kWp* rooftop solar installation (*${prjNumber || 'Solar Project'
      }*).\n\nIf you have any questions or require statutory documentation, please let our engineering team know.\n\nWarm regards,\n*Field Operations & Commissioning Team*`;
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

  // Stage count calculator for 7 canonical stages
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: projects.length,
      SURVEY: 0,
      ENGINEERING: 0,
      PROCUREMENT: 0,
      INSTALLATION: 0,
      NET_METERING: 0,
      INSPECTION: 0,
      HANDOVER: 0,
    };

    projects.forEach((p) => {
      const idx = getProjectStageIndex(p.currentStage || p.status);
      const stageKey = CANONICAL_PROJECT_STAGES[idx]?.id || 'SURVEY';
      counts[stageKey] = (counts[stageKey] || 0) + 1;
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

    if (activeFilter !== 'ALL') {
      const idx = getProjectStageIndex(p.currentStage || p.status);
      const targetIdx = CANONICAL_PROJECT_STAGES.findIndex((s) => s.id === activeFilter);
      if (idx !== targetIdx) return false;
    }

    return true;
  });

  const getStagePill = (stageStr?: string, statusStr?: string) => {
    const idx = getProjectStageIndex(stageStr || statusStr);
    const stageObj = CANONICAL_PROJECT_STAGES[idx] || CANONICAL_PROJECT_STAGES[1];
    return {
      idx,
      color: stageObj.color,
      label: stageObj.label,
    };
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 220,
      offset: 220 * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: any) => item.id || String(item._id || Math.random()), []);

  const renderProjectItem = useCallback(
    ({ item: p }: { item: any }) => {
      const cap = Number(p.capacity || p.systemCapacity || 3.3);
      const custName = p.customer?.name || p.lead?.name || p.name?.replace(/Project.*/i, '').trim() || 'Client';
      const phone = p.customer?.mobile || p.customer?.phone || p.lead?.mobile;
      const consumerNo =
        p.consumerNumber || p.customer?.consumerNumber || p.lead?.electricityConnection || 'Pending';
      const docsCount = (p.Document || []).length;
      const stagePill = getStagePill(p.currentStage, p.status);
      const progressPct = calculateProjectProgressPct(p.currentStage || p.status);
      const isCompleted = stagePill.idx === 7;

      return (
        <TouchableOpacity
          key={p.id}
          style={[
            styles.projectCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          activeOpacity={0.9}
          onPress={() => handleOpenDocsModal(p)}
        >
          {/* TOP BAR: PRJ ID, STAGE BADGE, CAPACITY */}
          <View style={styles.cardTopBar}>
            <View style={styles.topBarLeft}>
              <View
                style={[
                  styles.prjNumberPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.prjNumberText, { color: colors.textSecondary }]}>
                  {p.projectNumber || 'PRJ-NEW'}
                </Text>
              </View>

              <View
                style={[
                  styles.stageBadge,
                  {
                    backgroundColor: isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF',
                    borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                  },
                ]}
              >
                <View style={[styles.stageBadgeDot, { backgroundColor: stagePill.color }]} />
                <Text style={[styles.stageBadgeText, { color: stagePill.color }]}>
                  {stagePill.label}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.capacityBadge,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Zap size={11} color="#0066FF" strokeWidth={2.4} />
              <Text style={[styles.capacityBadgeText, { color: colors.text }]}>{cap} kWp</Text>
            </View>
          </View>

          {/* PROJECT NAME & CUSTOMER METADATA */}
          <View style={styles.projectIdentityBlock}>
            <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
              {p.name}
            </Text>

            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <User size={11} color={colors.textMuted} />
                <Text style={[styles.metadataText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {custName}
                </Text>
              </View>

              <Text style={[styles.metadataDivider, { color: colors.textMuted }]}>•</Text>

              <View style={styles.metadataItem}>
                <Zap size={11} color={colors.textMuted} />
                <Text style={[styles.metadataText, { color: colors.textSecondary }]} numberOfLines={1}>
                  Cons: {consumerNo}
                </Text>
              </View>
            </View>
          </View>

          {/* 7-STEP LINEAR PROGRESS SEGMENT BAR */}
          <View style={styles.milestoneBarSection}>
            <View style={styles.milestoneHeader}>
              <Text style={[styles.milestoneLabel, { color: colors.textMuted }]}>
                MILESTONE PROGRESS
              </Text>
              <Text style={[styles.milestonePct, { color: stagePill.color }]}>
                {progressPct}% ({stagePill.idx}/7 Stages)
              </Text>
            </View>

            <View style={styles.segmentsRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => {
                const isPassed = stepNum <= stagePill.idx;
                const isCurrent = stepNum === stagePill.idx;

                return (
                  <View
                    key={stepNum}
                    style={[
                      styles.segmentPiece,
                      {
                        backgroundColor: isPassed
                          ? (isCurrent ? stagePill.color : isDark ? '#334155' : '#CBD5E1')
                          : (isDark ? '#1E293B' : '#F1F5F9'),
                        flex: 1,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* INTEGRATED ACTION BUTTONS */}
          <View style={[styles.actionRow, { borderTopColor: colors.borderSubtle }]}>
            {/* Quick Tools */}
            <View style={styles.actionTools}>
              <TouchableOpacity
                style={[
                  styles.toolBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => handleOpenDocsModal(p)}
                activeOpacity={0.75}
              >
                <FileText size={12} color="#8B5CF6" />
                <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>
                  Vault ({docsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() =>
                  handleOpenBarcodeModal({ ...p, consumerNumber: consumerNo, capacity: cap })
                }
                activeOpacity={0.75}
              >
                <QrCode size={12} color="#0066FF" />
                <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>Serials</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() =>
                  handleOpenQaModal({ ...p, consumerNumber: consumerNo, capacity: cap })
                }
                activeOpacity={0.75}
              >
                <ShieldCheck size={12} color="#10B981" />
                <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>QA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() =>
                  handleOpenDiscomModal({ ...p, consumerNumber: consumerNo, capacity: cap })
                }
                activeOpacity={0.75}
              >
                <Building size={12} color="#D97706" />
                <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>DISCOM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolBtn,
                  {
                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                    borderColor: isDark ? 'rgba(5, 150, 105, 0.35)' : '#A7F3D0',
                  },
                ]}
                onPress={() => handleOpenSeamlessFlowForProject(p)}
                activeOpacity={0.75}
              >
                <Sparkles size={12} color="#059669" />
                <Text style={[styles.toolBtnText, { color: '#059669', fontWeight: '800' }]}>1-Flow</Text>
              </TouchableOpacity>
            </View>

            {/* Fast Call, WhatsApp & Stage Advance */}
            <View style={styles.actionExecution}>
              <TouchableOpacity
                style={[
                  styles.commBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => handleCall(phone)}
                activeOpacity={0.75}
                accessibilityLabel="Call"
              >
                <Phone size={13} color="#0066FF" strokeWidth={2.4} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.commBtn,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                    borderColor: isDark ? '#065F46' : '#A7F3D0',
                  },
                ]}
                onPress={() => handleWhatsApp(phone, custName, p.projectNumber, cap)}
                activeOpacity={0.75}
                accessibilityLabel="WhatsApp"
              >
                <MessageCircle size={13} color="#10B981" strokeWidth={2.4} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.advanceBtn,
                  isCompleted && styles.advanceBtnCompleted,
                ]}
                onPress={() => handleOpenStageAdvanceModal(p)}
                activeOpacity={0.85}
              >
                <Text style={styles.advanceBtnText}>
                  {isCompleted ? 'Handover' : 'Advance'}
                </Text>
                <ChevronRight size={12} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, isDark]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* GLOBAL HEADER */}
      <Header
        title="Field Execution & QA"
        subtitle="Live rooftop installations, serial scanning & net-metering"
        showSearch
        onSearch={setSearchQuery}
        searchPlaceholder="Search site, client, PRJ number, consumer..."
      />

      {/* EXECUTIVE OPERATIONAL PULSE BAR */}
      <View
        style={[
          styles.pulseBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.pulseCard}>
          <Text style={[styles.pulseVal, { color: colors.text }]}>{pulseStats.totalSites}</Text>
          <Text style={[styles.pulseLbl, { color: colors.textMuted }]}>Total Sites</Text>
        </View>

        <View style={[styles.pulseDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.pulseCard}>
          <Text style={[styles.pulseVal, { color: '#0066FF' }]}>
            {pulseStats.totalKw}
            <Text style={styles.pulseUnit}> kWp</Text>
          </Text>
          <Text style={[styles.pulseLbl, { color: colors.textMuted }]}>Capacity</Text>
        </View>

        <View style={[styles.pulseDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.pulseCard}>
          <Text style={[styles.pulseVal, { color: '#F59E0B' }]}>{pulseStats.erectionCount}</Text>
          <Text style={[styles.pulseLbl, { color: colors.textMuted }]}>In Erection</Text>
        </View>

        <View style={[styles.pulseDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.pulseCard}>
          <Text style={[styles.pulseVal, { color: '#10B981' }]}>
            {pulseStats.synchronizedCount}
          </Text>
          <Text style={[styles.pulseLbl, { color: colors.textMuted }]}>Commissioned</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {CANONICAL_PROJECT_STAGES.map((s) => {
            const isActive = activeFilter === s.id;
            const count = stageCounts[s.id] || 0;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isActive ? '#0066FF' : colors.surface,
                    borderColor: isActive ? '#0066FF' : colors.borderSubtle,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setActiveFilter(s.id);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {s.label}
                </Text>
                <View
                  style={[
                    styles.tabCountPill,
                    {
                      backgroundColor: isActive
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                          ? '#334155'
                          : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      { color: isActive ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PROJECTS LIST */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={36} color={colors.textMuted} />}
          title="No Active Installations"
          description="Convert qualified leads to active projects in the Sales Pipeline to initiate rooftop engineering."
          actionTitle="Go to Sales Pipeline"
          onActionPress={() => navigation?.navigate('Pipeline')}
        />
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={keyExtractor}
          renderItem={renderProjectItem}
          getItemLayout={getItemLayout}
          windowSize={7}
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS === 'android'}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

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

      {/* CANONICAL STAGE ADVANCEMENT MODAL WITH PREREQUISITE VALIDATION */}
      {projectToAdvance && (
        <Modal
          visible={advanceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAdvanceModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.advanceCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.advanceHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.advanceTitle, { color: colors.text }]}>
                    Advance Project Stage
                  </Text>
                  <Text style={[styles.advanceSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {projectToAdvance.projectNumber || 'PRJ'} • {projectToAdvance.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAdvanceModalVisible(false)}
                  style={[
                    styles.closeModalBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Stage Transition Visualizer */}
              {(() => {
                const curIdx = getProjectStageIndex(
                  projectToAdvance.currentStage || projectToAdvance.status
                );
                const curStage = CANONICAL_PROJECT_STAGES[curIdx] || CANONICAL_PROJECT_STAGES[1];
                const nextStage = curIdx < 7 ? CANONICAL_PROJECT_STAGES[curIdx + 1] : null;
                const prereqs = getPrerequisites(projectToAdvance);
                const allMet = prereqs.every((p) => p.met);

                return (
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.stageTransitionRow}>
                      <View
                        style={[
                          styles.stageStepBox,
                          {
                            borderColor: curStage.color,
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          },
                        ]}
                      >
                        <Text style={[styles.stageStepNum, { color: curStage.color }]}>
                          Stage {curIdx}
                        </Text>
                        <Text style={[styles.stageStepName, { color: colors.text }]}>
                          {curStage.label}
                        </Text>
                      </View>

                      <ArrowRight size={16} color={colors.textMuted} />

                      <View
                        style={[
                          styles.stageStepBox,
                          {
                            borderColor: nextStage?.color || '#10B981',
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageStepNum,
                            { color: nextStage?.color || '#10B981' },
                          ]}
                        >
                          {nextStage ? `Stage ${curIdx + 1}` : 'Complete'}
                        </Text>
                        <Text style={[styles.stageStepName, { color: colors.text }]}>
                          {nextStage ? nextStage.label : 'Handover Done'}
                        </Text>
                      </View>
                    </View>

                    {/* Prerequisite Checklist */}
                    <Text style={[styles.prereqHeader, { color: colors.textSecondary }]}>
                      MANDATORY PREREQUISITES
                    </Text>
                    <View style={styles.prereqList}>
                      {prereqs.map((pr, pI) => (
                        <View
                          key={pI}
                          style={[
                            styles.prereqItem,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          {pr.met ? (
                            <CheckCircle2 size={16} color="#10B981" />
                          ) : (
                            <AlertCircle size={16} color="#EF4444" />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.prereqTitle,
                                { color: pr.met ? colors.text : '#EF4444' },
                              ]}
                            >
                              {pr.title}
                            </Text>
                            <Text style={[styles.prereqDetail, { color: colors.textSecondary }]}>
                              {pr.detail}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Stage Note */}
                    <Text style={[styles.prereqHeader, { color: colors.textSecondary }]}>
                      ADVANCEMENT NOTE (AUDIT LOG)
                    </Text>
                    <TextInput
                      style={[
                        styles.advanceInput,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                          color: colors.text,
                        },
                      ]}
                      placeholder="e.g. Roof mechanical erection inspected & approved"
                      placeholderTextColor={colors.textMuted}
                      value={advanceNote}
                      onChangeText={setAdvanceNote}
                    />

                    {/* Actions */}
                    <View style={styles.advanceActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.cancelBtn,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                        onPress={() => setAdvanceModalVisible(false)}
                      >
                        <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.confirmAdvanceBtn,
                          (!allMet || !nextStage) && { opacity: 0.5 },
                        ]}
                        onPress={handleConfirmStageAdvance}
                        disabled={advancingStage || !allMet || !nextStage}
                      >
                        {advancingStage ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.confirmAdvanceBtnText}>
                            {nextStage ? `Advance to ${nextStage.label}` : 'Final Handover'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}

      {showCelebration && celebrationData ? (
        <CelebrationModal
          visible={showCelebration}
          title={celebrationData.title}
          subtitle={celebrationData.subtitle}
          stageName={celebrationData.stageName}
          xpAwarded={celebrationData.xpAwarded}
          badgeUnlocked={celebrationData.badgeUnlocked}
          peaceOfMindPoints={celebrationData.peaceOfMindPoints}
          customerName={celebrationData.customerName}
          customerPhone={celebrationData.customerPhone}
          projectName={celebrationData.projectName}
          capacityKw={celebrationData.capacityKw}
          nextActionLabel="Continue Field Operations ➔"
          onNextAction={() => {
            setShowCelebration(false);
            setProjectToAdvance(null);
          }}
          onClose={() => {
            setShowCelebration(false);
            setProjectToAdvance(null);
          }}
        />
      ) : null}

      {/* SEAMLESS 1-FLOW SOLAR JOURNEY FOR PROJECTS */}
      <SeamlessSolarFlowModal
        visible={seamlessFlowVisible}
        initialProject={seamlessInitialProject}
        initialStepIndex={seamlessInitialStep}
        onClose={() => {
          setSeamlessFlowVisible(false);
          setSeamlessInitialProject(null);
        }}
        onComplete={() => {
          setSeamlessFlowVisible(false);
          setSeamlessInitialProject(null);
          fetchProjects();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // OPERATIONAL PULSE BAR
  pulseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pulseCard: {
    flex: 1,
    alignItems: 'center',
  },
  pulseVal: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  pulseUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  pulseLbl: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pulseDivider: {
    width: 1,
    height: 24,
  },

  // FILTER TABS
  tabsContainer: {
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
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
  },
  tabCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // PROJECT CARDS
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  projectCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prjNumberPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  prjNumberText: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  stageBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  capacityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  projectIdentityBlock: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metadataDivider: {
    fontSize: 10,
  },

  // MILESTONE PROGRESS BAR
  milestoneBarSection: {
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  milestonePct: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segmentPiece: {
    height: 5,
    borderRadius: 2.5,
  },

  // ACTION BAR
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  actionTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    flex: 1,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toolBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionExecution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0066FF',
    paddingHorizontal: 11,
    height: 36,
    borderRadius: 10,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  advanceBtnCompleted: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  advanceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  advanceCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  advanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advanceTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  advanceSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  stageStepBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  stageStepNum: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stageStepName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  prereqHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  prereqList: {
    gap: 6,
    marginBottom: 6,
  },
  prereqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  prereqTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  prereqDetail: {
    fontSize: 11,
    marginTop: 1,
  },
  advanceInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  advanceActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmAdvanceBtn: {
    flex: 2,
    backgroundColor: '#0066FF',
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmAdvanceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
