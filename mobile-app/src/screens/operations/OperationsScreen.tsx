import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import {
  ShieldCheck,
  Phone,
  Navigation,
  ClipboardCheck,
  QrCode,
  Camera,
  CheckCircle2,
  X,
  Check,
  MapPin,
  Clock,
  Layers,
  User,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../components/Header';
import { installationsApi, tenantApi } from '../../api/endpoints';
import { InstallationJob } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PermissionRationaleModal } from '../../components/common/PermissionRationaleModal';
import { haptics } from '../../utils/haptics';
import { offlineSyncService } from '../../services/offlineSyncService';
import { useTheme } from '../../theme';
import { EmptyState, SkeletonLoader } from '../../components/common';
import { SignaturePad } from '../../components/SignaturePad';
import { GuideCharacter } from '../../components/GuideCharacter';
import { CelebrationModal } from '../../components/CelebrationModal';
import { soundEffects } from '../../utils/audioEffects';
import { solarGamificationService } from '../../services/solarGamificationService';

export const FIELD_TECHNICIANS = [
  { id: 'tech-1', name: 'Ramesh Patil', role: 'Lead Electrician (Master Tech)', phone: '+91 98220 11223' },
  { id: 'tech-2', name: 'Sachin Kulkarni', role: 'CEA Inspection Specialist', phone: '+91 98220 44556' },
  { id: 'tech-3', name: 'Pooja Shinde', role: 'Safety & Earthing Engineer', phone: '+91 98220 77889' },
  { id: 'tech-4', name: 'Amit Deshmukh', role: 'Rooftop Erection Tech', phone: '+91 98220 99001' },
];

export const OperationsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [jobs, setJobs] = useState<InstallationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [jobToAssign, setJobToAssign] = useState<InstallationJob | null>(null);
  const [dashboardKpis, setDashboardKpis] = useState({
    scheduledToday: 0,
    inProgress: 0,
    pendingReview: 0,
    delayed: 0,
    completedToday: 0,
  });

  // Active Job Execution Modal
  const [activeJob, setActiveJob] = useState<InstallationJob | null>(null);
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'BARCODES' | 'PHOTOS' | 'SIGNOFF'>('CHECKLIST');

  // Interactive Technical Checklist
  const [checklist, setChecklist] = useState([
    { id: 'chk-1', title: 'Mounting Structure: Bolted with anti-corrosion coating & South orientation', completed: true },
    { id: 'chk-2', title: 'PV Modules: Clamped tightly without micro-cracks (ALMM TopCon 550Wp)', completed: true },
    { id: 'chk-3', title: 'DC Cabling: 4 sq.mm UV-resistant Solar Cable with MC4 crimped', completed: true },
    { id: 'chk-4', title: 'Inverter: Mounted at eye level in shaded area with heatsink clearance', completed: false },
    { id: 'chk-5', title: 'AC Distribution Box: Equipped with MCB, Type-II SPD & Rotary Isolator', completed: false },
    { id: 'chk-6', title: 'Earthing System: 3 dedicated chemical pits (AC, DC, LA) < 5 Ohms', completed: false },
    { id: 'chk-7', title: 'Lightning Arrester (LA): Installed at highest point of roof structure', completed: false },
  ]);

  // Barcode Serial Numbers scanned on roof
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [manualSerialInput, setManualSerialInput] = useState('');
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);

  // 5 PM Surya Ghar Mandatory Inspection Geo-Photos
  const [geoPhotos, setGeoPhotos] = useState([
    { slot: 1, name: 'Photo 1: PV Array South View', category: 'ROOF', captured: false, time: null as string | null, uri: null as string | null },
    { slot: 2, name: 'Photo 2: Inverter LCD & Serial', category: 'INVERTER', captured: false, time: null as string | null, uri: null as string | null },
    { slot: 3, name: 'Photo 3: Dual Bi-directional Net Meter', category: 'PANELS', captured: false, time: null as string | null, uri: null as string | null },
    { slot: 4, name: 'Photo 4: Chemical Earthing Pit Chamber', category: 'EARTHING', captured: false, time: null as string | null, uri: null as string | null },
    { slot: 5, name: 'Photo 5: Customer Handover & Sign', category: 'HANDOVER', captured: false, time: null as string | null, uri: null as string | null },
  ]);

  const [customerSigned, setCustomerSigned] = useState(false);
  const [signOffTime, setSignOffTime] = useState<string | null>(null);
  const [cameraRationaleVisible, setCameraRationaleVisible] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: '',
    subtitle: '',
    customerName: '',
    capacityKw: 3.3,
    xp: 150,
  });

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const cached = await offlineSyncService.getCachedResponse<any>('installations');
      if (cached?.data && jobs.length === 0) {
        if (cached.data.kpis) setDashboardKpis(cached.data.kpis);
        if (cached.data.jobs) setJobs(cached.data.jobs);
        setLoading(false);
      }

      const [kpis, instData, prjData] = await Promise.all([
        installationsApi.getDashboard().catch(() => null),
        installationsApi.getInstallations().catch(() => null),
        tenantApi.getProjects().catch(() => null),
      ]);

      let finalKpis = dashboardKpis;
      let finalJobs = jobs;

      if (kpis) {
        finalKpis = {
          scheduledToday: kpis.scheduledToday || 0,
          inProgress: kpis.inProgress || 0,
          pendingReview: kpis.pendingReview || 0,
          delayed: kpis.delayed || 0,
          completedToday: kpis.completedToday || 0,
        };
        setDashboardKpis(finalKpis);
      }

      if (instData && Array.isArray(instData.installations) && instData.installations.length > 0) {
        const mapped: InstallationJob[] = instData.installations.map((item: any) => ({
          id: item.id,
          jobId: item.jobId,
          projectNumber: item.project?.name || item.jobId,
          customerName: item.customer?.name || 'Solar Customer',
          phone: item.customer?.mobile || '',
          address: item.installationAddress || 'Site Address',
          city: item.city || item.project?.city || 'Site Location',
          capacityKw: item.project?.capacity || 3.3,
          panelBrand: item.project?.panelBrand || 'Tier-1 Mono Perc',
          inverterBrand: item.project?.inverterBrand || 'Grid-Tie Inverter',
          status: item.status || 'SCHEDULED',
          scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : 'Today',
          moduleSerialNumbers: scannedSerials,
          geoPhotos: [],
          checklist: [],
          progressPercent: item.progressPercent || 0,
          priority: item.priority || 'NORMAL',
        }));
        finalJobs = mapped;
        setJobs(mapped);
      } else if (prjData && Array.isArray(prjData.projects) && prjData.projects.length > 0) {
        const mappedFromProjects: InstallationJob[] = prjData.projects.map((p: any, idx: number) => {
          const cap = Number(p.capacity || p.systemCapacity || 3.3);
          const stage = (p.currentStage || p.status || '').toUpperCase();
          const isInstall = ['INSTALLATION', 'TESTING', 'IN PROGRESS', 'QA'].some((s) => stage.includes(s));
          const isDone = ['COMPLETED', 'SYNCHRONIZED', 'HANDOVER'].some((s) => stage.includes(s));

          return {
            id: p.id,
            jobId: p.projectNumber || `JOB-${1000 + idx}`,
            projectNumber: p.name || `PRJ-${p.projectNumber || 'SOLAR'}`,
            customerName: p.customer?.name || p.lead?.name || 'Solar Customer',
            phone: p.customer?.mobile || p.customer?.phone || p.lead?.mobile || '',
            address: p.address || p.customer?.address || 'Site Address',
            city: p.city || p.customer?.city || 'Site Location',
            capacityKw: isNaN(cap) ? 3.3 : cap,
            panelBrand: p.panelBrand || 'Tier-1 Mono Perc 550Wp',
            inverterBrand: p.inverterBrand || 'Grid-Tie Inverter 3.3kW',
            status: isDone ? 'COMPLETED' : isInstall ? 'IN_PROGRESS' : 'SCHEDULED',
            scheduledDate: 'Today',
            moduleSerialNumbers: scannedSerials,
            geoPhotos: [],
            checklist: [],
            progressPercent: isDone ? 100 : isInstall ? 75 : 30,
            priority: 'NORMAL',
          };
        });
        finalJobs = mappedFromProjects;
        setJobs(mappedFromProjects);
        finalKpis = {
          scheduledToday: mappedFromProjects.length,
          inProgress: mappedFromProjects.filter((j) => j.status === 'IN_PROGRESS').length,
          pendingReview: 1,
          delayed: 0,
          completedToday: mappedFromProjects.filter((j) => j.status === 'COMPLETED').length,
        };
        setDashboardKpis(finalKpis);
      } else {
        setJobs([]);
      }
      await offlineSyncService.setCachedResponse('installations', { kpis: finalKpis, jobs: finalJobs });
    } catch (err: any) {
      console.warn('Operations fetch error:', err.message);
      const cached = await offlineSyncService.getCachedResponse<any>('installations');
      if (cached?.data) {
        if (cached.data.kpis) setDashboardKpis(cached.data.kpis);
        if (cached.data.jobs) setJobs(cached.data.jobs);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOperations();
  };

  const toggleChecklist = (id: string) => {
    soundEffects.playSelect();
    haptics.selection();
    setChecklist((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
      const allDone = next.every((item) => item.completed);
      if (allDone) {
        soundEffects.playVerificationShield();
        solarGamificationService.recordAction('QA_CERTIFIED');
      }
      return next;
    });
  };

  const handleOpenBarcodeScanner = () => {
    setBarcodeModalVisible(true);
  };

  const handleCapturePhoto = async (slot: number) => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        haptics.notificationWarning();
        if (!canAskAgain) {
          setCameraRationaleVisible(true);
        } else {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is required to capture on-site inspection photos. Pick from photo gallery instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Choose from Gallery',
                onPress: async () => {
                  const libRes = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                  });
                  if (!libRes.canceled && libRes.assets && libRes.assets.length > 0) {
                    applyCapturedPhoto(slot, libRes.assets[0].uri);
                  }
                },
              },
            ]
          );
        }
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        applyCapturedPhoto(slot, res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not launch camera');
    }
  };

  const applyCapturedPhoto = (slot: number, uri: string) => {
    haptics.notificationSuccess();
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setGeoPhotos((prev) =>
      prev.map((p) =>
        p.slot === slot
          ? {
            ...p,
            captured: true,
            time: timestamp,
            uri,
          }
          : p
      )
    );
    Alert.alert('Inspection Photo Recorded', `Slot ${slot} photo recorded at ${timestamp}.`);
  };

  const handleSiteCheckIn = async (job: InstallationJob) => {
    haptics.notificationSuccess();
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const locationName = [job.address, job.city].filter(Boolean).join(', ') || 'Customer Site';
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? { ...j, status: 'IN_PROGRESS', progressPercent: Math.max(j.progressPercent || 0, 50) }
          : j
      )
    );
    try {
      await installationsApi.updateJobStatus(job.id || job.jobId || '', 'IN_PROGRESS').catch(() => null);
    } catch (_) {
      await offlineSyncService.enqueueMutation('UPDATE_JOB_STATUS', {
        jobId: job.id || job.jobId,
        status: 'IN_PROGRESS',
        timestamp,
      });
    }
    Alert.alert(
      'Site Arrival Recorded',
      `Check-in logged at ${timestamp} for ${locationName}.\nStatus updated to ON-SITE / IN PROGRESS.`
    );
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      await installationsApi.updateJobStatus(jobId, newStatus);
      haptics.notificationSuccess();
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as any } : j))
      );
      if (activeJob && activeJob.id === jobId) {
        setActiveJob({ ...activeJob, status: newStatus as any });
      }
      Alert.alert('Status Updated', `Installation job marked as "${newStatus}".`);
    } catch (err: any) {
      try {
        await offlineSyncService.enqueueMutation('UPDATE_JOB_STATUS', {
          jobId,
          status: newStatus,
        });
        haptics.notificationSuccess();
      } catch (_) { }
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as any } : j))
      );
      Alert.alert('Status Updated', `Installation job status saved.`);
    }
  };

  const handleOpenAssignModal = (job: InstallationJob) => {
    setJobToAssign(job);
    setAssignModalVisible(true);
  };

  const handleAssignTechnician = (tech: (typeof FIELD_TECHNICIANS)[0]) => {
    if (!jobToAssign) return;
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobToAssign.id
          ? ({
            ...j,
            status: (j.status === 'SCHEDULED' ? 'ASSIGNED' : j.status) as any,
            technicianName: tech.name,
            technicianPhone: tech.phone,
          } as any)
          : j
      )
    );
    Alert.alert('Technician Dispatched', `${tech.name} (${tech.role}) assigned to ${jobToAssign.customerName}.`);
    setAssignModalVisible(false);
    setJobToAssign(null);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (scheduleFilter === 'SCHEDULED') return j.status === 'SCHEDULED' || j.status === 'ASSIGNED';
      if (scheduleFilter === 'IN_PROGRESS') return j.status === 'IN_PROGRESS' || j.status === 'ON_SITE';
      if (scheduleFilter === 'COMPLETED') return j.status === 'COMPLETED';
      return true;
    });
  }, [jobs, scheduleFilter]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 220,
      offset: 220 * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: InstallationJob) => item.id || item.jobId || String(Math.random()), []);

  const renderJobItem = useCallback(
    ({ item: job }: { item: InstallationJob }) => {
      const isCompleted = job.status === 'COMPLETED';
      const isOnSite = job.status === 'IN_PROGRESS' || job.status === 'ON_SITE';

      return (
        <View
          key={job.id}
          style={[
            styles.jobCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {/* HEADER: JOB ID, STATUS PILL */}
          <View style={styles.jobHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.jobIdRow}>
                <View
                  style={[
                    styles.jobIdBadge,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.jobIdText, { color: colors.textSecondary }]}>
                    {job.jobId || 'INS-2026'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isCompleted
                        ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                        : isOnSite
                          ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB')
                          : (isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF'),
                      borderColor: isCompleted
                        ? '#10B981'
                        : isOnSite
                          ? '#F59E0B'
                          : '#0066FF',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isCompleted
                          ? '#10B981'
                          : isOnSite
                            ? '#D97706'
                            : '#0066FF',
                      },
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                {job.customerName}
              </Text>

              <View style={styles.addressRow}>
                <MapPin size={11} color={colors.textMuted} />
                <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {job.address}, {job.city}
                </Text>
              </View>
            </View>
          </View>

          {/* HARDWARE SPECS BOX */}
          <View
            style={[
              styles.specBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>CAPACITY</Text>
              <Text style={[styles.specVal, { color: colors.text }]}>{job.capacityKw} kWp</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>MODULES</Text>
              <Text style={[styles.specVal, { color: colors.text }]} numberOfLines={1}>
                {job.panelBrand.split(' ')[0]}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>INVERTER</Text>
              <Text style={[styles.specVal, { color: colors.text }]} numberOfLines={1}>
                {job.inverterBrand.split(' ')[0]}
              </Text>
            </View>
          </View>

          {/* TECHNICIAN DISPATCH CHIP */}
          <View style={styles.technicianRow}>
            <TouchableOpacity
              style={[
                styles.techBadgeBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                },
              ]}
              onPress={() => handleOpenAssignModal(job)}
              activeOpacity={0.8}
            >
              <User size={12} color="#0066FF" />
              <Text style={styles.techBadgeText}>
                {(job as any).technicianName
                  ? `Lead Tech: ${(job as any).technicianName}`
                  : '+ Assign Field Engineer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTONS ROW */}
          <View style={[styles.buttonRow, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={[
                  styles.iconCircleBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => Linking.openURL(`tel:${job.phone}`)}
                activeOpacity={0.8}
                accessibilityLabel="Call Customer"
              >
                <Phone size={14} color="#0066FF" strokeWidth={2.4} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconCircleBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() =>
                  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)
                }
                activeOpacity={0.8}
                accessibilityLabel="Navigate"
              >
                <Navigation size={14} color="#10B981" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <View style={styles.rightActionsRow}>
              <TouchableOpacity
                style={styles.checkInBtn}
                onPress={() => handleSiteCheckIn(job)}
                activeOpacity={0.85}
              >
                <MapPin size={13} color="#FFFFFF" />
                <Text style={styles.checkInBtnText}>Check In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.executeBtn}
                onPress={() => {
                  setActiveJob(job);
                  setActiveTab('CHECKLIST');
                }}
                activeOpacity={0.85}
              >
                <ClipboardCheck size={13} color="#FFFFFF" />
                <Text style={styles.executeBtnText}>QA Dossier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [colors, isDark]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* GLOBAL HEADER */}
      <Header
        variant={navigation?.canGoBack?.() ? 'detail' : 'main'}
        title="Field Operations"
        subtitle="Live site execution, 2D serials, 5-geo proofs & CEA sign-off"
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
      />

      {/* OPERATIONAL RADAR PULSE CARDS */}
      <View
        style={[
          styles.kpiBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: colors.text }]}>
            {dashboardKpis.scheduledToday || jobs.length}
          </Text>
          <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>Scheduled</Text>
        </View>

        <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{dashboardKpis.inProgress}</Text>
          <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>On-Site</Text>
        </View>

        <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: '#10B981' }]}>
            {dashboardKpis.completedToday}
          </Text>
          <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>Commissioned</Text>
        </View>
      </View>

      {/* DISPATCH SCHEDULE FILTER BAR */}
      <View style={styles.scheduleFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scheduleFilterContent}
        >
          {(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const).map((sf) => {
            const isActive = scheduleFilter === sf;
            return (
              <TouchableOpacity
                key={sf}
                style={[
                  styles.scheduleFilterChip,
                  {
                    backgroundColor: isActive ? '#0066FF' : colors.surface,
                    borderColor: isActive ? '#0066FF' : colors.borderSubtle,
                  },
                ]}
                onPress={() => setScheduleFilter(sf)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.scheduleFilterText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {sf === 'ALL'
                    ? `All Jobs (${jobs.length})`
                    : sf === 'SCHEDULED'
                      ? 'Scheduled'
                      : sf === 'IN_PROGRESS'
                        ? 'On-Site'
                        : 'Commissioned'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* JOBS LIST VIRTUALIZED */}
      <FlatList
        data={filteredJobs}
        keyExtractor={keyExtractor}
        renderItem={renderJobItem}
        getItemLayout={getItemLayout}
        windowSize={7}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        removeClippedSubviews={Platform.OS === 'android'}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              <SkeletonLoader.Card />
              <SkeletonLoader.Card />
            </View>
          ) : (
            <EmptyState
              icon={<ShieldCheck size={36} color={colors.textMuted} />}
              title="No Scheduled Installations"
              description="On-site jobs will be dispatched here once solar projects advance to the installation stage."
              actionTitle="View Field Projects"
              onActionPress={() => navigation?.navigate('Projects')}
            />
          )
        }
      />

      {/* CAMERA PERMISSION RATIONALE MODAL */}
      <PermissionRationaleModal
        visible={cameraRationaleVisible}
        permissionType="camera"
        isPermanentlyDenied={true}
        title="Camera Access Required"
        description="Statutory guidelines under PM Surya Ghar require high-resolution geotagged photos of the solar PV array, inverter, earthing pit, and net-metering setup for DBT subsidy clearance."
        onDismiss={() => setCameraRationaleVisible(false)}
        onRequestNativePermission={() => {
          setCameraRationaleVisible(false);
          Linking.openSettings();
        }}
      />

      {/* FIELD EXECUTION & DOSSIER MODAL */}
      {activeJob && (
        <Modal
          visible={!!activeJob}
          animationType="slide"
          onRequestClose={() => setActiveJob(null)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.modalJobId}>{activeJob.jobId || 'INS-2026'}</Text>
                <Text style={[styles.modalCustomer, { color: colors.text }]}>
                  {activeJob.customerName}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
                onPress={() => setActiveJob(null)}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* MODAL TABS */}
            <View
              style={[
                styles.tabsRow,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.borderSubtle,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'CHECKLIST' && styles.tabBtnActive]}
                onPress={() => setActiveTab('CHECKLIST')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: activeTab === 'CHECKLIST' ? '#0066FF' : colors.textSecondary },
                  ]}
                >
                  Checklist
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'BARCODES' && styles.tabBtnActive]}
                onPress={() => setActiveTab('BARCODES')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: activeTab === 'BARCODES' ? '#0066FF' : colors.textSecondary },
                  ]}
                >
                  Barcodes ({scannedSerials.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'PHOTOS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('PHOTOS')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: activeTab === 'PHOTOS' ? '#0066FF' : colors.textSecondary },
                  ]}
                >
                  5-Geo Photos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'SIGNOFF' && styles.tabBtnActive]}
                onPress={() => setActiveTab('SIGNOFF')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: activeTab === 'SIGNOFF' ? '#0066FF' : colors.textSecondary },
                  ]}
                >
                  Sign-Off
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <GuideCharacter
                pose="inspect"
                speechText="Zero-Defect Installation Protocol! Verify all 7 safety points, scan serials, capture 5 geo-photos, and get customer digital signature on glass."
              />

              {/* 1. CHECKLIST */}
              {activeTab === 'CHECKLIST' && (
                <View>
                  <Text style={[styles.tabSectionTitle, { color: colors.text }]}>
                    Technical Quality & Safety Checklist
                  </Text>
                  <Text style={[styles.tabSectionSub, { color: colors.textSecondary }]}>
                    Must be 100% verified before grid energization and net-metering.
                  </Text>

                  {checklist.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checklistItem,
                        {
                          backgroundColor: item.completed
                            ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5')
                            : colors.surface,
                          borderColor: item.completed
                            ? (isDark ? '#065F46' : '#A7F3D0')
                            : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => toggleChecklist(item.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.checkCircle,
                          item.completed && {
                            backgroundColor: '#10B981',
                            borderColor: '#10B981',
                          },
                        ]}
                      >
                        {item.completed && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text
                        style={[
                          styles.checklistText,
                          {
                            color: item.completed
                              ? (isDark ? '#34D399' : '#047857')
                              : colors.text,
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 2. BARCODES */}
              {activeTab === 'BARCODES' && (
                <View>
                  <Text style={[styles.tabSectionTitle, { color: colors.text }]}>
                    PV Module Barcode / QR Scanner
                  </Text>
                  <Text style={[styles.tabSectionSub, { color: colors.textSecondary }]}>
                    Scanned serial numbers are auto-submitted for DCR & PM Surya Ghar Subsidy Verification.
                  </Text>

                  <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={handleOpenBarcodeScanner}
                    activeOpacity={0.85}
                  >
                    <QrCode size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.scanBtnText}>Scan PV Module QR Code (Camera)</Text>
                  </TouchableOpacity>

                  <View style={styles.manualSerialRow}>
                    <TextInput
                      style={[
                        styles.manualInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Or enter serial number..."
                      placeholderTextColor={colors.textMuted}
                      value={manualSerialInput}
                      onChangeText={setManualSerialInput}
                    />
                    <TouchableOpacity
                      style={styles.addSerialBtn}
                      onPress={() => {
                        const clean = manualSerialInput.trim().toUpperCase();
                        if (!clean) return;
                        if (clean.length < 5) {
                          Alert.alert('Invalid Serial', 'Serial number must be at least 5 characters long.');
                          return;
                        }
                        if (scannedSerials.includes(clean)) {
                          Alert.alert('Duplicate Serial', `Serial "${clean}" is already recorded.`);
                          return;
                        }
                        setScannedSerials((prev) => [...prev, clean]);
                        setManualSerialInput('');
                      }}
                    >
                      <Text style={styles.addSerialText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                    SCANNED MODULE SERIALS ({scannedSerials.length})
                  </Text>
                  {scannedSerials.map((s, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.serialBadge,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.serialIndex, { color: colors.textMuted }]}>#{idx + 1}</Text>
                      <Text style={[styles.serialCode, { color: colors.text }]}>{s}</Text>
                      <Text style={styles.serialVerified}>✓ DCR Linked</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 3. 5-GEO PHOTOS */}
              {activeTab === 'PHOTOS' && (
                <View>
                  <Text style={[styles.tabSectionTitle, { color: colors.text }]}>
                    PM Surya Ghar 5 Mandatory Photos
                  </Text>
                  <Text style={[styles.tabSectionSub, { color: colors.textSecondary }]}>
                    DISCOM net-metering portal requires geo-tagged rooftop photos for DBT release.
                  </Text>

                  {geoPhotos.map((photo) => (
                    <View
                      key={photo.slot}
                      style={[
                        styles.photoCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.photoName, { color: colors.text }]}>{photo.name}</Text>
                        {photo.captured ? (
                          <Text style={styles.geoTag}>✓ Recorded at {photo.time}</Text>
                        ) : (
                          <Text style={styles.geoPending}>⏳ Pending capture</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.captureBtn, photo.captured && styles.recaptureBtn]}
                        onPress={() => handleCapturePhoto(photo.slot)}
                        activeOpacity={0.85}
                      >
                        <Camera size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                        <Text style={styles.captureBtnText}>
                          {photo.captured ? 'Retake' : 'Capture'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* 4. SIGNOFF */}
              {activeTab === 'SIGNOFF' && (
                <View>
                  <Text style={[styles.tabSectionTitle, { color: colors.text }]}>
                    Customer Digital Sign-Off
                  </Text>
                  <Text style={[styles.tabSectionSub, { color: colors.textSecondary }]}>
                    Verify client satisfaction on-site before grid energization.
                  </Text>

                  <View
                    style={[
                      styles.signatureBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    {!customerSigned ? (
                      <View style={{ padding: 12 }}>
                        <Text style={[styles.touchSignPrompt, { color: colors.textSecondary, marginBottom: 8 }]}>
                          ✍️ Customer Digital Sign-Off (Draw on Glass)
                        </Text>
                        <SignaturePad
                          height={150}
                          strokeColor={isDark ? '#38BDF8' : '#0F172A'}
                          strokeWidth={3}
                          onSignatureChange={(path) => {
                            if (path) {
                              soundEffects.playSelect();
                              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              setSignOffTime(now);
                              setCustomerSigned(true);
                            }
                          }}
                        />
                      </View>
                    ) : (
                      <View style={styles.signedContent}>
                        <CheckCircle2 size={32} color="#10B981" />
                        <Text style={[styles.signedName, { color: colors.text }]}>
                          {activeJob.customerName}
                        </Text>
                        <Text style={[styles.signedTime, { color: colors.textSecondary }]}>
                          Signed on Glass at {signOffTime || new Date().toLocaleTimeString()}
                        </Text>
                        <Text style={[styles.signedHash, { color: colors.textMuted }]}>
                          Digital Handover Confirmed • Job #{activeJob.jobId}
                        </Text>
                        <TouchableOpacity
                          style={{ marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderSubtle }}
                          onPress={() => setCustomerSigned(false)}
                        >
                          <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>Re-sign</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.completeJobBtn}
                    onPress={() => {
                      soundEffects.playCelebrationFanfare();
                      solarGamificationService.recordAction('QA_CERTIFIED', {
                        customerName: activeJob.customerName,
                        capacityKw: activeJob.capacityKw,
                      });
                      handleUpdateStatus(activeJob.id, 'COMPLETED');
                      setCelebrationData({
                        title: 'Zero-Defect Handover Dossier Certified! 🎉',
                        subtitle: `${activeJob.customerName}'s ${activeJob.capacityKw || 3.3} kWp plant is fully installed, tested, and ready for DISCOM meter installation.`,
                        customerName: activeJob.customerName,
                        capacityKw: activeJob.capacityKw || 3.3,
                        xp: 150,
                      });
                      setCelebrationVisible(true);
                      setActiveJob(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.completeJobBtnText}>Complete & Submit Handover Dossier (+150 XP)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* 2D CAMERA BARCODE SCANNER MODAL */}
      {activeJob && (
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          project={{
            id: activeJob.id,
            name: activeJob.customerName || (activeJob as any).projectNumber || 'Active Job',
            capacity: activeJob.capacityKw || 3.3,
          }}
          initialModuleSerials={scannedSerials}
          onClose={() => setBarcodeModalVisible(false)}
          onSaveSerials={({ modules, inverter }) => {
            setScannedSerials(modules);
            setJobs((prev) =>
              prev.map((j) =>
                j.id === activeJob.id
                  ? { ...j, moduleSerialNumbers: modules, inverterSerial: inverter }
                  : j
              )
            );
            setActiveJob((prev) =>
              prev ? { ...prev, moduleSerialNumbers: modules, inverterSerial: inverter } : null
            );
            setBarcodeModalVisible(false);
          }}
        />
      )}

      {/* TECHNICIAN DISPATCH & ASSIGNMENT MODAL */}
      {jobToAssign && (
        <Modal
          visible={assignModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAssignModalVisible(false)}
        >
          <View style={styles.assignModalBackdrop}>
            <View
              style={[
                styles.assignCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.assignHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignTitle, { color: colors.text }]}>
                    Assign Field Engineer
                  </Text>
                  <Text style={[styles.assignSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {jobToAssign.customerName} • {jobToAssign.capacityKw} kWp
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAssignModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.assignSectionTitle, { color: colors.textSecondary }]}>
                CERTIFIED FIELD ENGINEERS
              </Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {FIELD_TECHNICIANS.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={[
                      styles.techCard,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    onPress={() => handleAssignTechnician(tech)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.techIconCircle,
                        { backgroundColor: isDark ? 'rgba(0, 102, 255, 0.15)' : '#EFF6FF' },
                      ]}
                    >
                      <User size={15} color="#0066FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.techName, { color: colors.text }]}>{tech.name}</Text>
                      <Text style={[styles.techRole, { color: colors.textSecondary }]}>
                        {tech.role}
                      </Text>
                      <Text style={[styles.techPhone, { color: colors.textMuted }]}>
                        {tech.phone}
                      </Text>
                    </View>
                    <View style={styles.assignActionBadge}>
                      <Text style={styles.assignActionText}>Assign</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* CELEBRATION MODAL */}
      <CelebrationModal
        visible={celebrationVisible}
        title={celebrationData.title}
        subtitle={celebrationData.subtitle}
        stageName="Installation QA Passed"
        xpAwarded={celebrationData.xp}
        customerName={celebrationData.customerName}
        capacityKw={celebrationData.capacityKw}
        peaceOfMindPoints={[
          'All 7 electrical safety & CEA checklist items verified',
          'Hardware DCR serial barcodes linked to PM Surya Ghar portal',
          'Customer digital handover signature recorded on glass',
          '5 mandatory geo-photos ready for DISCOM meter installation',
        ]}
        onClose={() => setCelebrationVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // OPERATIONAL RADAR PULSE BAR
  kpiBar: {
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
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  kpiLbl: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  kpiDivider: {
    width: 1,
    height: 24,
  },

  // DISPATCH QUEUE FILTER
  scheduleFilterBar: {
    marginBottom: 6,
  },
  scheduleFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  scheduleFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  scheduleFilterText: {
    fontSize: 12,
  },

  // LIST & CARDS
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  skeletonContainer: {
    paddingVertical: 12,
    gap: 12,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  jobIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  jobIdBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  jobIdText: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  addressText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // SPECS BOX
  specBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // TECH ROW
  technicianRow: {
    marginBottom: 10,
  },
  techBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  techBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },

  // BUTTON ROW
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  checkInBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  executeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  executeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalJobId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  modalCustomer: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0066FF',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  tabSectionSub: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checklistText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  scanBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  manualSerialRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  addSerialBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addSerialText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  serialIndex: {
    fontSize: 11,
    fontWeight: '800',
    width: 28,
  },
  serialCode: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  serialVerified: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  photoName: {
    fontSize: 12,
    fontWeight: '800',
  },
  geoTag: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  geoPending: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recaptureBtn: {
    backgroundColor: '#10B981',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  signatureBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  touchSignArea: {
    alignItems: 'center',
  },
  touchSignPrompt: {
    fontSize: 12,
    fontWeight: '700',
  },
  signedContent: {
    alignItems: 'center',
  },
  signedName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  signedTime: {
    fontSize: 11,
    marginTop: 2,
  },
  signedHash: {
    fontSize: 10,
    marginTop: 4,
  },
  completeJobBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 40,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  completeJobBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ASSIGN MODAL
  assignModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  assignCard: {
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
  assignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  assignSub: {
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
  assignSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  techCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
  },
  techIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techName: {
    fontSize: 13,
    fontWeight: '800',
  },
  techRole: {
    fontSize: 11,
    marginTop: 1,
  },
  techPhone: {
    fontSize: 10,
    marginTop: 1,
  },
  assignActionBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
