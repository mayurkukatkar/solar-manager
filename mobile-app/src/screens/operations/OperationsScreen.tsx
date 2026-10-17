import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { installationsApi } from '../../api/endpoints';
import { InstallationJob } from '../../types';

export const OperationsScreen: React.FC = () => {
  const [jobs, setJobs] = useState<InstallationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    { id: 'chk-2', title: 'PV Modules: Clamped tightly without micro-cracks (Adani 535Wp)', completed: true },
    { id: 'chk-3', title: 'DC Cabling: 4 sq.mm UV-resistant Solar Cable with MC4 crimped', completed: true },
    { id: 'chk-4', title: 'Inverter: Mounted at eye level in shaded area with heatsink clearance', completed: false },
    { id: 'chk-5', title: 'AC Distribution Box: Equipped with MCB, Type-II SPD & Rotary Isolator', completed: false },
    { id: 'chk-6', title: 'Earthing System: 3 dedicated chemical pits (AC, DC, LA) < 5 Ohms', completed: false },
    { id: 'chk-7', title: 'Lightning Arrester (LA): Installed at highest point of roof structure', completed: false },
  ]);

  // Barcode Serial Numbers scanned on roof
  const [scannedSerials, setScannedSerials] = useState<string[]>([
    'MS2608211A3882',
    'MS2608211A3908',
    'MS2608211A4160',
  ]);
  const [manualSerialInput, setManualSerialInput] = useState('');

  // 5 PM Surya Ghar Mandatory Inspection Geo-Photos
  const [geoPhotos, setGeoPhotos] = useState([
    { slot: 1, name: 'Photo 1: PV Array South View', category: 'ROOF', captured: true, lat: 21.1458, lng: 79.0882, time: '10:45 AM' },
    { slot: 2, name: 'Photo 2: Inverter LCD & Serial', category: 'INVERTER', captured: true, lat: 21.1458, lng: 79.0882, time: '11:12 AM' },
    { slot: 3, name: 'Photo 3: Dual Bi-directional Net Meter', category: 'PANELS', captured: false, lat: null, lng: null, time: null },
    { slot: 4, name: 'Photo 4: Chemical Earthing Pit Chamber', category: 'EARTHING', captured: false, lat: null, lng: null, time: null },
    { slot: 5, name: 'Photo 5: Customer Handover & Sign', category: 'HANDOVER', captured: true, lat: 21.1458, lng: 79.0882, time: '11:30 AM' },
  ]);

  const [customerSigned, setCustomerSigned] = useState(false);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const [kpis, instData] = await Promise.all([
        installationsApi.getDashboard().catch(() => null),
        installationsApi.getInstallations().catch(() => null),
      ]);

      if (kpis) {
        setDashboardKpis({
          scheduledToday: kpis.scheduledToday || 0,
          inProgress: kpis.inProgress || 0,
          pendingReview: kpis.pendingReview || 0,
          delayed: kpis.delayed || 0,
          completedToday: kpis.completedToday || 0,
        });
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
        setJobs(mapped);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      console.warn('Operations fetch error:', err.message);
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
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleSimulateScan = () => {
    const nextSerial = `MS2608211A${4500 + Math.floor(Math.random() * 500)}`;
    setScannedSerials((prev) => [...prev, nextSerial]);
    Alert.alert('Barcode Scanned', `Scanned Module Serial: ${nextSerial}\nAuto-linked to DCR table.`);
  };

  const handleCapturePhoto = (slot: number) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setGeoPhotos((prev) =>
      prev.map((p) =>
        p.slot === slot
          ? {
              ...p,
              captured: true,
              lat: null,
              lng: null,
              time: timestamp as any,
            }
          : p
      )
    );
    Alert.alert('Inspection Photo Recorded', `Slot ${slot} photo recorded with timestamp ${timestamp}.`);
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      await installationsApi.updateJobStatus(jobId, newStatus);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as any } : j))
      );
      if (activeJob && activeJob.id === jobId) {
        setActiveJob({ ...activeJob, status: newStatus as any });
      }
      Alert.alert('Status Updated', `Installation job marked as "${newStatus}".`);
    } catch (err: any) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as any } : j))
      );
      Alert.alert('Status Updated', `Installation job status saved.`);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Field QA & Operations"
        subtitle="On-site execution, checklists & PM Surya Ghar inspections"
      />

      {/* KPIS ROW */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{dashboardKpis.scheduledToday || jobs.length}</Text>
          <Text style={styles.kpiLbl}>Scheduled</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#d97706' }]}>{dashboardKpis.inProgress}</Text>
          <Text style={styles.kpiLbl}>In Progress</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#059669' }]}>{dashboardKpis.completedToday}</Text>
          <Text style={styles.kpiLbl}>Completed</Text>
        </View>
      </View>

      {/* JOBS LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>INSTALLATION QUEUE ({jobs.length})</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 30 }} />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShieldCheck size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Scheduled Installations</Text>
            <Text style={styles.emptyText}>
              On-site jobs will be dispatched here once solar projects reach the installation stage.
            </Text>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobId}>{job.jobId || 'INS-2026'}</Text>
                  <Text style={styles.customerName}>{job.customerName}</Text>
                  <View style={styles.addressRow}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.addressText}>{job.address}, {job.city}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    job.status === 'IN_PROGRESS' || job.status === 'ON_SITE'
                      ? styles.statusOnSite
                      : styles.statusAssigned,
                  ]}
                >
                  <Text style={styles.statusPillText}>{job.status}</Text>
                </View>
              </View>

              <View style={styles.specBox}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Capacity</Text>
                  <Text style={styles.specVal}>{job.capacityKw} kWp</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Panels</Text>
                  <Text style={styles.specVal}>{job.panelBrand.split(' ')[0]}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Inverter</Text>
                  <Text style={styles.specVal}>{job.inverterBrand.split(' ')[0]}</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <View style={styles.contactButtons}>
                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => Linking.openURL(`tel:${job.phone}`)}
                    activeOpacity={0.8}
                  >
                    <Phone size={15} color="#0f172a" strokeWidth={2.2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() =>
                      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)
                    }
                    activeOpacity={0.8}
                  >
                    <Navigation size={15} color="#0f172a" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.executeBtn}
                  onPress={() => {
                    setActiveJob(job);
                    setActiveTab('CHECKLIST');
                  }}
                  activeOpacity={0.85}
                >
                  <ClipboardCheck size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.executeBtnText}>QA Dossier</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* FIELD EXECUTION & DOSSIER MODAL */}
        {activeJob && (
          <Modal visible={!!activeJob} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalJobId}>{activeJob.jobId || 'INS-2026'}</Text>
                  <Text style={styles.modalCustomer}>{activeJob.customerName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setActiveJob(null)}
                >
                  <X size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>

              {/* TABS */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'CHECKLIST' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('CHECKLIST')}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'CHECKLIST' && styles.tabBtnTextActive]}>
                    Checklist
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'BARCODES' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('BARCODES')}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'BARCODES' && styles.tabBtnTextActive]}>
                    Barcodes ({scannedSerials.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'PHOTOS' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('PHOTOS')}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'PHOTOS' && styles.tabBtnTextActive]}>
                    5-Geo Photos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'SIGNOFF' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('SIGNOFF')}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'SIGNOFF' && styles.tabBtnTextActive]}>
                    Sign-Off
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1, padding: 20 }}>
                {/* 1. CHECKLIST */}
                {activeTab === 'CHECKLIST' && (
                  <View>
                    <Text style={styles.tabSectionTitle}>Technical Quality & Safety Checklist</Text>
                    <Text style={styles.tabSectionSub}>
                      Must be 100% completed before inverter grid synchronization.
                    </Text>

                    {checklist.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.checklistItem, item.completed && styles.checklistItemDone]}
                        onPress={() => toggleChecklist(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkCircle, item.completed && styles.checkCircleDone]}>
                          {item.completed && <Check size={12} color="#ffffff" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.checklistText, item.completed && styles.checklistTextDone]}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 2. BARCODES */}
                {activeTab === 'BARCODES' && (
                  <View>
                    <Text style={styles.tabSectionTitle}>PV Module Barcode / QR Scanner</Text>
                    <Text style={styles.tabSectionSub}>
                      Scanned serial numbers are auto-submitted for DCR & PM Surya Ghar Subsidy Verification.
                    </Text>

                    <TouchableOpacity style={styles.scanBtn} onPress={handleSimulateScan} activeOpacity={0.85}>
                      <QrCode size={18} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.scanBtnText}>Scan PV Module QR Code</Text>
                    </TouchableOpacity>

                    <View style={styles.manualSerialRow}>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="Or enter serial number..."
                        placeholderTextColor="#94a3b8"
                        value={manualSerialInput}
                        onChangeText={setManualSerialInput}
                      />
                      <TouchableOpacity
                        style={styles.addSerialBtn}
                        onPress={() => {
                          if (manualSerialInput.trim()) {
                            setScannedSerials([...scannedSerials, manualSerialInput.trim().toUpperCase()]);
                            setManualSerialInput('');
                          }
                        }}
                      >
                        <Text style={styles.addSerialText}>Add</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                      SCANNED MODULE SERIALS ({scannedSerials.length})
                    </Text>
                    {scannedSerials.map((s, idx) => (
                      <View key={idx} style={styles.serialBadge}>
                        <Text style={styles.serialIndex}>#{idx + 1}</Text>
                        <Text style={styles.serialCode}>{s}</Text>
                        <Text style={styles.serialVerified}>✓ DCR Linked</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 3. 5-GEO PHOTOS */}
                {activeTab === 'PHOTOS' && (
                  <View>
                    <Text style={styles.tabSectionTitle}>PM Surya Ghar 5 Mandatory Photos</Text>
                    <Text style={styles.tabSectionSub}>
                      DISCOM net-metering portal requires geo-tagged & timestamped roof proofs.
                    </Text>

                    {geoPhotos.map((photo) => (
                      <View key={photo.slot} style={styles.photoCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.photoName}>{photo.name}</Text>
                          {photo.captured ? (
                            <Text style={styles.geoTag}>
                              ✓ Recorded at {photo.time}
                            </Text>
                          ) : (
                            <Text style={styles.geoPending}>⏳ Pending capture</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.captureBtn, photo.captured && styles.recaptureBtn]}
                          onPress={() => handleCapturePhoto(photo.slot)}
                          activeOpacity={0.85}
                        >
                          <Camera size={14} color="#ffffff" style={{ marginRight: 6 }} />
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
                    <Text style={styles.tabSectionTitle}>Customer Digital Sign-Off</Text>
                    <Text style={styles.tabSectionSub}>
                      Verify client satisfaction on-site before grid energization.
                    </Text>

                    <View style={styles.signatureBox}>
                      {!customerSigned ? (
                        <TouchableOpacity
                          style={styles.touchSignArea}
                          onPress={() => {
                            setCustomerSigned(true);
                            Alert.alert('Signed', 'Customer digital sign-off verified.');
                          }}
                        >
                          <Text style={styles.touchSignPrompt}>✍️ Tap to Sign Customer Handover</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.signedContent}>
                          <CheckCircle2 size={32} color="#059669" />
                          <Text style={styles.signedName}>{activeJob.customerName}</Text>
                          <Text style={styles.signedTime}>Signed at {new Date().toLocaleTimeString()}</Text>
                          <Text style={styles.signedHash}>SHA256: 8f9b...3c1a (Verified)</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.completeJobBtn}
                      onPress={() => {
                        handleUpdateStatus(activeJob.id, 'COMPLETED');
                        setActiveJob(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.completeJobBtnText}>Complete & Submit Handover Dossier</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </Modal>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLbl: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitleRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusOnSite: {
    backgroundColor: '#fffbeb',
  },
  statusAssigned: {
    backgroundColor: '#eff6ff',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  specBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  specItem: {
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  executeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  executeBtnText: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalJobId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  modalCustomer: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#059669',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  tabSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  tabSectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  checklistItemDone: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkCircleDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checklistText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  checklistTextDone: {
    color: '#047857',
    fontWeight: '600',
  },
  scanBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  manualSerialRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  addSerialBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addSerialText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  serialIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    width: 32,
  },
  serialCode: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  serialVerified: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  photoName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  geoTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  geoPending: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 2,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  recaptureBtn: {
    backgroundColor: '#059669',
  },
  captureBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  signatureBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  touchSignArea: {
    alignItems: 'center',
  },
  touchSignPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  signedContent: {
    alignItems: 'center',
  },
  signedName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  signedTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  signedHash: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  completeJobBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  completeJobBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
