import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  QrCode,
  Barcode,
  Camera,
  CheckCircle2,
  Trash2,
  Plus,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ModalHeader } from '../../components/Header';
import { SafeStorage } from '../../api/client';
import { tenantApi } from '../../api/endpoints';

interface BarcodeScannerModalProps {
  visible: boolean;
  project: any;
  onClose: () => void;
  onSaveSerials?: (serials: { modules: string[]; inverter: string }) => void;
  initialModuleSerials?: string[];
  initialInverterSerial?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  project,
  onClose,
  onSaveSerials,
  initialModuleSerials,
  initialInverterSerial,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedMode, setScannedMode] = useState<'MODULE' | 'INVERTER'>('MODULE');
  const [isScanning, setIsScanning] = useState(true);
  const [manualInput, setManualInput] = useState('');

  // Scanned lists
  const [moduleSerials, setModuleSerials] = useState<string[]>([]);
  const [inverterSerial, setInverterSerial] = useState<string>('');

  const targetModulesCount = Math.ceil(((project?.capacity || 3.3) * 1000) / 540);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (initialModuleSerials && initialModuleSerials.length > 0) {
        setModuleSerials(initialModuleSerials);
      } else if (project?.moduleSerials && Array.isArray(project.moduleSerials) && project.moduleSerials.length > 0) {
        setModuleSerials(project.moduleSerials);
      } else if (project?.dcrModuleSerials) {
        try {
          const parsed = typeof project.dcrModuleSerials === 'string'
            ? project.dcrModuleSerials.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean)
            : project.dcrModuleSerials;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModuleSerials(parsed);
          }
        } catch {}
      } else if (project?.id) {
        SafeStorage.getItem(`@solar_project_serials_${project.id}`).then((val) => {
          if (val) {
            try {
              const p = JSON.parse(val);
              if (p.modules && Array.isArray(p.modules) && p.modules.length > 0) {
                setModuleSerials(p.modules);
              }
              if (p.inverter && !inverterSerial) {
                setInverterSerial(p.inverter);
              }
            } catch {}
          }
        });
      }

      if (initialInverterSerial) {
        setInverterSerial(initialInverterSerial);
      } else if (project?.inverterSerial) {
        setInverterSerial(project.inverterSerial);
      }
    }
  }, [visible, project?.id]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanning || !data) return;
    setIsScanning(false);

    const clean = data.trim();
    if (scannedMode === 'INVERTER') {
      setInverterSerial(clean);
      Alert.alert('Inverter Scanned', `Serial: ${clean}`, [
        { text: 'OK', onPress: () => setIsScanning(true) },
      ]);
    } else {
      if (!moduleSerials.includes(clean)) {
        setModuleSerials((prev) => [clean, ...prev]);
        Alert.alert('Module Scanned', `Module #${moduleSerials.length + 1}: ${clean}`, [
          { text: 'Scan Next', onPress: () => setIsScanning(true) },
        ]);
      } else {
        Alert.alert('Already Scanned', 'This module serial number was already recorded.', [
          { text: 'OK', onPress: () => setIsScanning(true) },
        ]);
      }
    }
  };

  const handleAddManualSerial = () => {
    if (!manualInput.trim()) return;
    const clean = manualInput.trim().toUpperCase();

    if (scannedMode === 'INVERTER') {
      setInverterSerial(clean);
      setManualInput('');
    } else {
      if (!moduleSerials.includes(clean)) {
        setModuleSerials((prev) => [clean, ...prev]);
        setManualInput('');
      } else {
        Alert.alert('Duplicate', 'This serial is already added.');
      }
    }
  };

  const handleRemoveModule = (serial: string) => {
    setModuleSerials((prev) => prev.filter((s) => s !== serial));
  };

  const handleSaveAndConfirm = async () => {
    if (!inverterSerial && moduleSerials.length === 0) {
      Alert.alert('No Serials Scanned', 'Please scan or enter at least one module or inverter serial.');
      return;
    }

    if (project) {
      project.moduleSerials = moduleSerials;
      if (inverterSerial) project.inverterSerial = inverterSerial;
    }

    if (project?.id) {
      try {
        await SafeStorage.setItem(
          `@solar_project_serials_${project.id}`,
          JSON.stringify({ modules: moduleSerials, inverter: inverterSerial })
        );
        await tenantApi.updateProjectDetails(project.id, {
          dcrModuleSerials: moduleSerials.join(','),
          ...(inverterSerial ? { inverterSerial } : {}),
        });
      } catch {}
    }

    if (onSaveSerials) {
      onSaveSerials({
        modules: moduleSerials,
        inverter: inverterSerial,
      });
    }

    Alert.alert(
      'Hardware Serials Recorded',
      `Saved ${moduleSerials.length} PV Modules and Inverter Serial: ${inverterSerial || 'N/A'}.\nLinked to ${project?.name || 'Project'}.`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* STANDARDIZED MODAL HEADER */}
        <ModalHeader
          title="Hardware Barcode Scanner"
          subtitle="Capture Waaree/Adani Modules & String Inverter Serials"
          onClose={onClose}
        />

        {/* SCANNER MODE TABS */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.modeTab, scannedMode === 'MODULE' && styles.modeTabActive]}
            onPress={() => {
              setScannedMode('MODULE');
              setIsScanning(true);
            }}
            activeOpacity={0.8}
          >
            <QrCode size={16} color={scannedMode === 'MODULE' ? '#ffffff' : '#2563eb'} />
            <Text style={[styles.modeTabText, scannedMode === 'MODULE' && styles.modeTabTextActive]}>
              PV Modules ({moduleSerials.length}/{targetModulesCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, scannedMode === 'INVERTER' && styles.modeTabActive]}
            onPress={() => {
              setScannedMode('INVERTER');
              setIsScanning(true);
            }}
            activeOpacity={0.8}
          >
            <Zap size={16} color={scannedMode === 'INVERTER' ? '#ffffff' : '#2563eb'} />
            <Text style={[styles.modeTabText, scannedMode === 'INVERTER' && styles.modeTabTextActive]}>
              Inverter {inverterSerial ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CAMERA VIEWPORT */}
        <View style={styles.cameraBox}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'code39', 'datamatrix', 'ean13'],
              }}
              onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
            >
              {/* TARGET RETICLE */}
              <View style={styles.reticleOverlay}>
                <View style={styles.reticleBox}>
                  <View style={[styles.reticleCorner, styles.topLeft]} />
                  <View style={[styles.reticleCorner, styles.topRight]} />
                  <View style={[styles.reticleCorner, styles.bottomLeft]} />
                  <View style={[styles.reticleCorner, styles.bottomRight]} />
                </View>
                <Text style={styles.reticleTip}>
                  Align barcode inside target frame to auto-capture
                </Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.noPermissionBox}>
              <Camera size={36} color="#94a3b8" />
              <Text style={styles.noPermissionText}>Camera permission needed to scan barcodes</Text>
              <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                <Text style={styles.grantBtnText}>Grant Camera Access</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* MANUAL INPUT FALLBACK */}
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder={`Type ${scannedMode} Serial Manually...`}
            placeholderTextColor="#94a3b8"
            value={manualInput}
            onChangeText={setManualInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.manualAddBtn}
            onPress={handleAddManualSerial}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#ffffff" />
            <Text style={styles.manualAddText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* SCANNED ITEMS LIST */}
        <ScrollView style={styles.listArea} contentContainerStyle={styles.listAreaContent}>
          {/* INVERTER STATUS */}
          <View style={styles.inverterSummaryCard}>
            <View style={styles.inverterMeta}>
              <Zap size={18} color="#d97706" />
              <View>
                <Text style={styles.inverterLabel}>String Inverter Serial Number</Text>
                <Text style={styles.inverterValue}>
                  {inverterSerial || 'Not Scanned Yet'}
                </Text>
              </View>
            </View>
            {inverterSerial ? (
              <CheckCircle2 size={18} color="#16a34a" />
            ) : (
              <Text style={styles.pendingDot}>Pending</Text>
            )}
          </View>

          {/* MODULES LIST */}
          <Text style={styles.modulesHeader}>
            Scanned PV Modules ({moduleSerials.length} of ~{targetModulesCount} expected)
          </Text>

          {moduleSerials.length === 0 ? (
            <Text style={styles.emptyModules}>No module barcodes scanned yet.</Text>
          ) : (
            moduleSerials.map((serial, idx) => (
              <View key={serial + idx} style={styles.moduleRow}>
                <View style={styles.moduleBadge}>
                  <Text style={styles.moduleBadgeText}>#{moduleSerials.length - idx}</Text>
                </View>
                <Text style={styles.moduleSerialText}>{serial}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveModule(serial)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveSerialsBtn}
            onPress={handleSaveAndConfirm}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={18} color="#ffffff" />
            <Text style={styles.saveSerialsText}>
              Confirm & Save {moduleSerials.length + (inverterSerial ? 1 : 0)} Serials
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  modeTabTextActive: {
    color: '#ffffff',
  },
  cameraBox: {
    height: 220,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reticleBox: {
    width: 260,
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
    borderRadius: 8,
  },
  reticleCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#38bdf8',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  reticleTip: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noPermissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f1f5f9',
  },
  noPermissionText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  grantBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  grantBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  manualInputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  manualAddBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  manualAddText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listArea: {
    flex: 1,
  },
  listAreaContent: {
    padding: 16,
    paddingBottom: 30,
  },
  inverterSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  inverterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inverterLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  inverterValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  pendingDot: {
    fontSize: 11,
    color: '#ea580c',
    fontWeight: '700',
  },
  modulesHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyModules: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  moduleBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  moduleSerialText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteBtn: {
    padding: 4,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
  },
  saveSerialsBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveSerialsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
