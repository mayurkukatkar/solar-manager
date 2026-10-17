import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Modal, TextInput } from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { InstallationJob } from '../../types';

export const TechDashboardScreen: React.FC = () => {
  // Selected Job for execution modal
  const [activeJob, setActiveJob] = useState<InstallationJob | null>(null);
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'BARCODES' | 'PHOTOS' | 'SIGNOFF'>('CHECKLIST');

  // Interactive Checklist
  const [checklist, setChecklist] = useState([
    { id: 'chk-1', title: 'Mounting Structure: Bolted with anti-corrosion coating & South orientation', completed: true },
    { id: 'chk-2', title: 'PV Modules: Clamped tightly without micro-cracks (Adani 535Wp)', completed: true },
    { id: 'chk-3', title: 'DC Cabling: 4 sq.mm UV-resistant Solar Cable with MC4 connectors crimped', completed: true },
    { id: 'chk-4', title: 'Inverter: Mounted at eye level in shaded area with heatsink clearance', completed: false },
    { id: 'chk-5', title: 'AC Distribution Box: Equipped with MCB, Type-II SPD & Rotary Isolator', completed: false },
    { id: 'chk-6', title: 'Earthing System: 3 dedicated chemical pits (AC, DC, LA) resistance < 5 Ohms', completed: false },
    { id: 'chk-7', title: 'Lightning Arrester (LA): Installed at highest point of roof structure', completed: false },
  ]);

  // Barcode Serial Numbers scanned on roof
  const [scannedSerials, setScannedSerials] = useState<string[]>([
    'MS2608211A3882',
    'MS2608211A3908',
    'MS2608211A4160',
    'MS2608211A4181',
    'MS2608211A4247',
    'MS2608211A4462',
  ]);
  const [manualSerialInput, setManualSerialInput] = useState('');

  // 5 PM Surya Ghar Mandatory Inspection Geo-Photos
  const [geoPhotos, setGeoPhotos] = useState([
    { slot: 1, name: 'Photo 1: PV Array South View', captured: true, lat: 21.1458, lng: 79.0882, time: '10:45 AM' },
    { slot: 2, name: 'Photo 2: Inverter LCD & Serial', captured: true, lat: 21.1458, lng: 79.0882, time: '11:12 AM' },
    { slot: 3, name: 'Photo 3: Dual Bi-directional Net Meter', captured: false, lat: null, lng: null, time: null },
    { slot: 4, name: 'Photo 4: Chemical Earthing Pit Chamber', captured: false, lat: null, lng: null, time: null },
    { slot: 5, name: 'Photo 5: Customer Cancelled Cheque', captured: true, lat: 21.1458, lng: 79.0882, time: '11:30 AM' },
  ]);

  const [customerSigned, setCustomerSigned] = useState(false);

  // Job List
  const [jobs, setJobs] = useState<InstallationJob[]>([
    {
      id: 'inst-001',
      projectNumber: 'PRJ-00012',
      customerName: 'Surendra Rambhau Thakre',
      phone: '8605849639',
      address: 'Plot 87, Navin Nagar, Likklyan Housing Society',
      city: 'Nagpur',
      capacityKw: 3.3,
      panelBrand: 'Adani Solar (535 Wp)',
      inverterBrand: 'Polycab 3.3kW Single Phase',
      status: 'ON_SITE',
      scheduledDate: 'Today, 9:00 AM',
      moduleSerialNumbers: scannedSerials,
      geoPhotos: [],
      checklist: [],
    },
    {
      id: 'inst-002',
      projectNumber: 'PRJ-00015',
      customerName: 'Ravi Dodkuji Kawale',
      phone: '9822334455',
      address: 'Tembhari Butibori Road',
      city: 'Nagpur',
      capacityKw: 5.0,
      panelBrand: 'Adani Bifacial 540 Wp',
      inverterBrand: 'Sungrow 5kW On-Grid',
      status: 'ASSIGNED',
      scheduledDate: 'Tomorrow, 10:00 AM',
      moduleSerialNumbers: [],
      geoPhotos: [],
      checklist: [],
    },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleSimulateScan = () => {
    const nextSerial = `MS2608211A${4500 + Math.floor(Math.random() * 500)}`;
    setScannedSerials([...scannedSerials, nextSerial]);
    Alert.alert('Barcode Scanned', `Scanned Module Serial: ${nextSerial}\nAuto-linked to DCR table.`);
  };

  const handleCapturePhoto = (slot: number) => {
    setGeoPhotos((prev) =>
      prev.map((p) =>
        p.slot === slot
          ? {
              ...p,
              captured: true,
              lat: 21.1458,
              lng: 79.0882,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : p
      )
    );
    Alert.alert('Geo-Photo Captured', `GPS: 21.1458° N, 79.0882° E\nTimestamp: ${new Date().toLocaleTimeString()}`);
  };

  const handleFinishJob = () => {
    if (!customerSigned) {
      Alert.alert('Sign-Off Required', 'Please collect the customer electronic sign-off first.');
      return;
    }
    if (activeJob) {
      setJobs((prev) =>
        prev.map((j) => (j.id === activeJob.id ? { ...j, status: 'COMPLETED' } : j))
      );
    }
    setActiveJob(null);
    Alert.alert(
      'Commissioning Complete!',
      'Installation dossier, serials, and geo-photos synced to Owner Dashboard & MSEDCL WCR pack.'
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Field Technician" subtitle="Daily installation queue & site commissioning" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusBar}>
          <Text style={styles.statusLabel}>ASSIGNED WORKLOAD</Text>
          <Text style={styles.statusValue}>{jobs.length} Sites (1 In Progress)</Text>
        </View>

        {jobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobTop}>
              <View style={styles.projectNumberBadge}>
                <Text style={styles.projectNumberText}>{job.projectNumber}</Text>
              </View>
              <View
                style={[
                  styles.jobStatusBadge,
                  job.status === 'COMPLETED'
                    ? styles.statusCompleted
                    : job.status === 'ON_SITE'
                    ? styles.statusOnSite
                    : styles.statusAssigned,
                ]}
              >
                <Text style={styles.jobStatusText}>{job.status.replace('_', ' ')}</Text>
              </View>
            </View>

            <Text style={styles.jobCustomer}>{job.customerName}</Text>
            <Text style={styles.jobAddress}>📍 {job.address}, {job.city}</Text>

            <View style={styles.techSpecs}>
              <Text style={styles.specPill}>⚡ {job.capacityKw} kWp</Text>
              <Text style={styles.specPill}>📦 {job.panelBrand}</Text>
              <Text style={styles.specPill}>🔌 {job.inverterBrand}</Text>
            </View>

            <View style={styles.jobBtnRow}>
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)}
              >
                <Text style={styles.mapBtnText}>🗺️ Navigate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.executeBtn}
                onPress={() => setActiveJob(job)}
              >
                <Text style={styles.executeBtnText}>
                  {job.status === 'COMPLETED' ? 'View Report' : '⚡ Open Execution Kit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Full-Screen Installation Execution Kit Modal */}
      <Modal visible={!!activeJob} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.execHeader}>
            <View>
              <Text style={styles.execProjectNum}>{activeJob?.projectNumber}</Text>
              <Text style={styles.execCustomer}>{activeJob?.customerName}</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveJob(null)} style={styles.closeExecBtn}>
              <Text style={styles.closeExecText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={styles.execTabs}>
            <TouchableOpacity
              style={[styles.execTab, activeTab === 'CHECKLIST' && styles.execTabActive]}
              onPress={() => setActiveTab('CHECKLIST')}
            >
              <Text style={[styles.execTabText, activeTab === 'CHECKLIST' && styles.execTabTextActive]}>
                1. Checklist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.execTab, activeTab === 'BARCODES' && styles.execTabActive]}
              onPress={() => setActiveTab('BARCODES')}
            >
              <Text style={[styles.execTabText, activeTab === 'BARCODES' && styles.execTabTextActive]}>
                2. Serials ({scannedSerials.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.execTab, activeTab === 'PHOTOS' && styles.execTabActive]}
              onPress={() => setActiveTab('PHOTOS')}
            >
              <Text style={[styles.execTabText, activeTab === 'PHOTOS' && styles.execTabTextActive]}>
                3. Geo-Photos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.execTab, activeTab === 'SIGNOFF' && styles.execTabActive]}
              onPress={() => setActiveTab('SIGNOFF')}
            >
              <Text style={[styles.execTabText, activeTab === 'SIGNOFF' && styles.execTabTextActive]}>
                4. Sign-Off
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.execScroll}>
            {/* TAB 1: CHECKLIST */}
            {activeTab === 'CHECKLIST' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabHeading}>MSEDCL & PM Surya Ghar Technical QA</Text>
                <Text style={styles.tabDesc}>Check each on-site milestone as physical wiring proceeds:</Text>

                {checklist.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.checklistItem, item.completed && styles.checklistItemDone]}
                    onPress={() => toggleChecklist(item.id)}
                  >
                    <View style={[styles.checkboxBox, item.completed && styles.checkboxBoxDone]}>
                      {item.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.checklistText, item.completed && styles.checklistTextDone]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* TAB 2: BARCODES */}
            {activeTab === 'BARCODES' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabHeading}>Solar PV Module Serial Numbers</Text>
                <Text style={styles.tabDesc}>
                  Used dynamically in statutory Annexure-A DCR Undertaking.
                </Text>

                <TouchableOpacity style={styles.scanBarcodeBtn} onPress={handleSimulateScan}>
                  <Text style={styles.scanBarcodeBtnText}>📷 Scan Panel Barcode / QR with Camera</Text>
                </TouchableOpacity>

                <View style={styles.serialsTable}>
                  <View style={styles.serialHeaderRow}>
                    <Text style={styles.serialHeaderNo}>#</Text>
                    <Text style={styles.serialHeaderVal}>Module Serial Number (DCR Certified)</Text>
                  </View>
                  {scannedSerials.map((s, idx) => (
                    <View key={idx} style={styles.serialRow}>
                      <Text style={styles.serialIndex}>{idx + 1}</Text>
                      <Text style={styles.serialValue}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 3: GEO-PHOTOS */}
            {activeTab === 'PHOTOS' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabHeading}>5 Mandatory National Portal Geo-Photos</Text>
                <Text style={styles.tabDesc}>
                  Auto-watermarks GPS Coordinates & Timestamp for PM Surya Ghar subsidy claim.
                </Text>

                {geoPhotos.map((p) => (
                  <View key={p.slot} style={styles.photoSlotCard}>
                    <View style={styles.photoSlotInfo}>
                      <Text style={styles.photoSlotTitle}>{p.name}</Text>
                      {p.captured ? (
                        <Text style={styles.photoSlotMeta}>
                          ✅ GPS: {p.lat}° N, {p.lng}° E · {p.time}
                        </Text>
                      ) : (
                        <Text style={styles.photoSlotPending}>⚠️ Photo not yet taken</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.captureBtn, p.captured && styles.captureBtnDone]}
                      onPress={() => handleCapturePhoto(p.slot)}
                    >
                      <Text style={styles.captureBtnText}>{p.captured ? 'Retake' : 'Capture'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 4: DIGITAL SIGN-OFF */}
            {activeTab === 'SIGNOFF' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabHeading}>Customer Handover & Commissioning Sign-Off</Text>
                <Text style={styles.tabDesc}>
                  Beneficiary signature confirms physical completion of 3.3 kWp installation.
                </Text>

                <View style={styles.sigCanvasBox}>
                  {customerSigned ? (
                    <View style={styles.signedState}>
                      <Text style={styles.signatureScript}>{activeJob?.customerName || 'S. R. Thakre'}</Text>
                      <Text style={styles.signedVerified}>✓ Digitally Verified Signature</Text>
                    </View>
                  ) : (
                    <View style={styles.sigPlaceholder}>
                      <Text style={styles.sigPlaceholderText}>✍️ Tap to Sign on Screen (Beneficiary Touch Pad)</Text>
                    </View>
                  )}
                </View>

                {!customerSigned ? (
                  <TouchableOpacity
                    style={styles.simulateSignBtn}
                    onPress={() => setCustomerSigned(true)}
                  >
                    <Text style={styles.simulateSignBtnText}>Confirm Customer Touch Signature</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.clearSignBtn}
                    onPress={() => setCustomerSigned(false)}
                  >
                    <Text style={styles.clearSignBtnText}>Clear & Re-sign</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.completeJobBtn, !customerSigned && styles.completeJobBtnDisabled]}
                  onPress={handleFinishJob}
                  disabled={!customerSigned}
                >
                  <Text style={styles.completeJobBtnText}>🚀 Complete & Sync Statutory WCR Pack</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBar: {
    backgroundColor: colors.slate900,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectNumberBadge: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  projectNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate700,
    fontFamily: 'monospace',
  },
  jobStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusAssigned: {
    backgroundColor: colors.blueLight,
  },
  statusOnSite: {
    backgroundColor: colors.accentLight,
  },
  statusCompleted: {
    backgroundColor: colors.primaryMuted,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate900,
  },
  jobCustomer: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
    marginTop: 10,
  },
  jobAddress: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 3,
  },
  techSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  specPill: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: colors.slate700,
    fontWeight: '700',
  },
  jobBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  mapBtn: {
    flex: 1,
    backgroundColor: colors.slate100,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate700,
  },
  executeBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  executeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  execHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.slate900,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  execProjectNum: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  execCustomer: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginTop: 2,
  },
  closeExecBtn: {
    padding: 8,
    backgroundColor: colors.slate800,
    borderRadius: 12,
  },
  closeExecText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  execTabs: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    padding: 4,
  },
  execTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  execTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  execTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate500,
  },
  execTabTextActive: {
    color: colors.slate900,
    fontWeight: '900',
  },
  execScroll: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  tabHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  tabDesc: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.slate50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginBottom: 10,
  },
  checklistItemDone: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.slate400,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  checklistText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
    lineHeight: 18,
  },
  checklistTextDone: {
    color: colors.primaryDark,
  },
  scanBarcodeBtn: {
    backgroundColor: colors.slate900,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanBarcodeBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  serialsTable: {
    backgroundColor: colors.slate50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    overflow: 'hidden',
  },
  serialHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.slate200,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  serialHeaderNo: {
    width: 30,
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate700,
  },
  serialHeaderVal: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate700,
  },
  serialRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  serialIndex: {
    width: 30,
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate500,
  },
  serialValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
    fontFamily: 'monospace',
  },
  photoSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginBottom: 10,
  },
  photoSlotInfo: {
    flex: 1,
  },
  photoSlotTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  photoSlotMeta: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  photoSlotPending: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  captureBtn: {
    backgroundColor: colors.slate900,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  captureBtnDone: {
    backgroundColor: colors.slate200,
  },
  captureBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  sigCanvasBox: {
    height: 180,
    backgroundColor: colors.slate50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.slate300,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sigPlaceholder: {
    alignItems: 'center',
  },
  sigPlaceholderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate400,
  },
  signedState: {
    alignItems: 'center',
  },
  signatureScript: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '700',
    color: colors.slate900,
    textDecorationLine: 'underline',
  },
  signedVerified: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 10,
  },
  simulateSignBtn: {
    backgroundColor: colors.blue,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  simulateSignBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  clearSignBtn: {
    backgroundColor: colors.slate200,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  clearSignBtnText: {
    color: colors.slate700,
    fontSize: 12,
    fontWeight: '700',
  },
  completeJobBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  completeJobBtnDisabled: {
    opacity: 0.5,
  },
  completeJobBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
});
