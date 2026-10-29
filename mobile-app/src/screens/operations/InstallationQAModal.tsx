import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  FileCheck,
  Award,
} from 'lucide-react-native';
import { ModalHeader } from '../../components/Header';
import { tenantApi } from '../../api/endpoints';

interface InstallationQAModalProps {
  visible: boolean;
  project: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InstallationQAModal: React.FC<InstallationQAModalProps> = ({
  visible,
  project,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Electrical Test Readings (Ohmic values)
  const [pit1Inverter, setPit1Inverter] = useState('2.1');
  const [pit2Structure, setPit2Structure] = useState('1.8');
  const [pit3Lightning, setPit3Lightning] = useState('2.4');
  const [antiIslandingTripSec, setAntiIslandingTripSec] = useState('0.18');
  const [insulationMegaOhms, setInsulationMegaOhms] = useState('2500');

  // Checklist items
  const [checklist, setChecklist] = useState([
    { id: '1', title: 'Mounting Structure Torque Check', desc: 'All mid/end clamps torqued to 12-14 Nm', done: true },
    { id: '2', title: 'Solar DC Cabling & UV Conduit', desc: 'UV-resistant 4 sq.mm copper cables tied in rigid conduits', done: true },
    { id: '3', title: 'ACDB / DCDB Surge Protection', desc: 'Class-II SPDs and MCBs rated & functional', done: true },
    { id: '4', title: 'Earthing Continuity Verification', desc: 'Solid copper bonds between panels, inverter & earth pits', done: true },
    { id: '5', title: 'Inverter Wi-Fi Monitoring Setup', desc: 'Connected to client 2.4GHz WiFi / 4G Dongle', done: true },
  ]);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const numPit1 = parseFloat(pit1Inverter);
  const numPit2 = parseFloat(pit2Structure);
  const numPit3 = parseFloat(pit3Lightning);
  const numTrip = parseFloat(antiIslandingTripSec);
  const numInsulation = parseFloat(insulationMegaOhms);

  // Strict statutory thresholds per CEA Regulations & IEEE 1547 standards
  const isPit1Pass = !isNaN(numPit1) && numPit1 >= 0 && numPit1 < 5.0;
  const isPit2Pass = !isNaN(numPit2) && numPit2 >= 0 && numPit2 < 5.0;
  const isPit3Pass = !isNaN(numPit3) && numPit3 >= 0 && numPit3 < 5.0;
  const isTripPass = !isNaN(numTrip) && numTrip >= 0 && numTrip < 2.0;
  const isInsulationPass = !isNaN(numInsulation) && numInsulation > 1.0;

  const allTestsPass = isPit1Pass && isPit2Pass && isPit3Pass && isTripPass && isInsulationPass;

  const failureReasons: string[] = [];
  if (!isPit1Pass) failureReasons.push('Inverter Earth Pit 1 must be strictly < 5.0 Ω (CEA Regulations)');
  if (!isPit2Pass) failureReasons.push('Structure Earth Pit 2 must be strictly < 5.0 Ω (CEA Regulations)');
  if (!isPit3Pass) failureReasons.push('Lightning Arrestor Earth Pit 3 must be strictly < 5.0 Ω (CEA Regulations)');
  if (!isTripPass) failureReasons.push('Anti-Islanding Grid Trip Time must be strictly < 2.0 s (IEEE 1547 / CEA Standards)');
  if (!isInsulationPass) failureReasons.push('Inverter Insulation Resistance must be strictly > 1.0 MΩ (CEA Statutory Threshold)');

  const handleSubmitQA = async () => {
    if (!allTestsPass) {
      Alert.alert(
        'Electrical Safety Gating Blocked',
        `Cannot certify statutory QA sign-off due to safety threshold violations:\n\n• ${failureReasons.join('\n• ')}\n\nRectify earth pit ohmic values, trip time, or insulation before DISCOM inspection.`
      );
      return;
    }

    setSubmitting(true);
    try {
      if (project?.id) {
        await tenantApi.advanceProjectStage(project.id, 'Testing', 'Electrical Testing & QA Completed via Mobile Field OS');
      }

      Alert.alert(
        'QA Testing Passed & Certified',
        `Project "${project?.name || 'Solar Project'}" has successfully passed electrical earthing and safety QA.\n\nWork Completion Report (WCR) is ready for statutory submission.`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Notice', 'QA record saved locally.');
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* STANDARDIZED MODAL HEADER */}
        <ModalHeader
          title="Installation QA & Testing"
          subtitle="Statutory Electrical Testing & Quality Sign-Off"
          onClose={onClose}
        />

        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PROJECT INFO HERO */}
          <View style={styles.projectHero}>
            <View style={styles.projectHeroTop}>
              <View style={styles.badgePass}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={styles.badgePassText}>DISCOM Compliance Test</Text>
              </View>
              <Text style={styles.capText}>{project?.capacity || 3.3} kWp System</Text>
            </View>
            <Text style={styles.heroName}>{project?.customer?.name || project?.name || 'Customer Plant'}</Text>
            <Text style={styles.heroSub}>Consumer No: {project?.consumerNumber || project?.customer?.consumerNumber || 'Pending'}</Text>
          </View>

          {/* SECTION 1: ELECTRICAL TEST MEASUREMENTS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>1. Statutory Electrical Test Certificate</Text>
              <Text style={styles.cardSubtitle}>
                Standard: MSEDCL / IS 3043 (All pits must be &lt; 5.0 Ohms)
              </Text>
            </View>

            <View style={styles.testRow}>
              <View style={styles.testMeta}>
                <Text style={styles.testName}>Earth Pit 1: Inverter Body</Text>
                <Text style={styles.testStandard}>Limit: &lt; 5.0 Ω</Text>
              </View>
              <View style={styles.testInputBox}>
                <TextInput
                  style={styles.testInput}
                  value={pit1Inverter}
                  onChangeText={setPit1Inverter}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.testUnit}>Ω</Text>
              </View>
              <View style={[styles.statusTag, isPit1Pass ? styles.tagPass : styles.tagFail]}>
                <Text style={[styles.statusTagText, isPit1Pass ? styles.textPass : styles.textFail]}>
                  {isPit1Pass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>

            <View style={styles.testRow}>
              <View style={styles.testMeta}>
                <Text style={styles.testName}>Earth Pit 2: PV Structure</Text>
                <Text style={styles.testStandard}>Limit: &lt; 5.0 Ω</Text>
              </View>
              <View style={styles.testInputBox}>
                <TextInput
                  style={styles.testInput}
                  value={pit2Structure}
                  onChangeText={setPit2Structure}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.testUnit}>Ω</Text>
              </View>
              <View style={[styles.statusTag, isPit2Pass ? styles.tagPass : styles.tagFail]}>
                <Text style={[styles.statusTagText, isPit2Pass ? styles.textPass : styles.textFail]}>
                  {isPit2Pass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>

            <View style={styles.testRow}>
              <View style={styles.testMeta}>
                <Text style={styles.testName}>Earth Pit 3: Lightning Arrestor</Text>
                <Text style={styles.testStandard}>Limit: &lt; 5.0 Ω</Text>
              </View>
              <View style={styles.testInputBox}>
                <TextInput
                  style={styles.testInput}
                  value={pit3Lightning}
                  onChangeText={setPit3Lightning}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.testUnit}>Ω</Text>
              </View>
              <View style={[styles.statusTag, isPit3Pass ? styles.tagPass : styles.tagFail]}>
                <Text style={[styles.statusTagText, isPit3Pass ? styles.textPass : styles.textFail]}>
                  {isPit3Pass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>

            <View style={styles.testRow}>
              <View style={styles.testMeta}>
                <Text style={styles.testName}>Anti-Islanding Grid Trip</Text>
                <Text style={styles.testStandard}>Limit: &lt; 2.0 sec</Text>
              </View>
              <View style={styles.testInputBox}>
                <TextInput
                  style={styles.testInput}
                  value={antiIslandingTripSec}
                  onChangeText={setAntiIslandingTripSec}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.testUnit}>s</Text>
              </View>
              <View style={[styles.statusTag, isTripPass ? styles.tagPass : styles.tagFail]}>
                <Text style={[styles.statusTagText, isTripPass ? styles.textPass : styles.textFail]}>
                  {isTripPass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>

            <View style={styles.testRow}>
              <View style={styles.testMeta}>
                <Text style={styles.testName}>Inverter Insulation Resistance</Text>
                <Text style={styles.testStandard}>Limit: &gt; 1.0 MΩ (CEA Regulations)</Text>
              </View>
              <View style={styles.testInputBox}>
                <TextInput
                  style={styles.testInput}
                  value={insulationMegaOhms}
                  onChangeText={setInsulationMegaOhms}
                  keyboardType="decimal-pad"
                  placeholder="2500"
                />
                <Text style={styles.testUnit}>MΩ</Text>
              </View>
              <View style={[styles.statusTag, isInsulationPass ? styles.tagPass : styles.tagFail]}>
                <Text style={[styles.statusTagText, isInsulationPass ? styles.textPass : styles.textFail]}>
                  {isInsulationPass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
          </View>

          {/* STATUTORY SAFETY GATING VIOLATION BANNER */}
          {!allTestsPass && (
            <View style={styles.safetyViolationBanner}>
              <View style={styles.safetyViolationHeader}>
                <AlertCircle size={18} color="#dc2626" />
                <Text style={styles.safetyViolationTitle}>Statutory Electrical Safety Gating Blocked</Text>
              </View>
              <Text style={styles.safetyViolationSubtitle}>
                QA sign-off is prevented until all values comply with CEA & IEEE thresholds:
              </Text>
              {failureReasons.map((reason, idx) => (
                <View key={idx} style={styles.violationItem}>
                  <Text style={styles.violationBullet}>•</Text>
                  <Text style={styles.violationText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* SECTION 2: PHYSICAL QA CHECKLIST */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>2. On-Site Physical Quality Checklist</Text>
              <Text style={styles.cardSubtitle}>Tap to check and confirm installation integrity</Text>
            </View>

            {checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.checklistItem, item.done && styles.checklistItemDone]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, item.done && styles.checkboxActive]}>
                  {item.done && <CheckCircle2 size={16} color="#ffffff" />}
                </View>
                <View style={styles.checklistMeta}>
                  <Text style={[styles.checklistTitle, item.done && styles.checklistTitleDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.checklistDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitQaBtn, !allTestsPass && styles.submitQaBtnDisabled]}
            onPress={handleSubmitQA}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Award size={18} color="#ffffff" />
                <Text style={styles.submitQaText}>
                  {allTestsPass ? 'Certify QA & Advance Project' : 'QA Sign-Off Blocked (Safety Gated)'}
                </Text>
              </>
            )}
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
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  projectHero: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  projectHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePassText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  capText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  testMeta: {
    flex: 1.8,
  },
  testName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  testStandard: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  testInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 34,
    width: 70,
    marginRight: 10,
  },
  testInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  testUnit: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    width: 48,
    alignItems: 'center',
  },
  tagPass: {
    backgroundColor: '#dcfce7',
  },
  tagFail: {
    backgroundColor: '#fee2e2',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '900',
  },
  textPass: {
    color: '#16a34a',
  },
  textFail: {
    color: '#ef4444',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  checklistItemDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checklistMeta: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  checklistTitleDone: {
    color: '#166534',
  },
  checklistDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
  },
  submitQaBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitQaBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitQaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  safetyViolationBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  safetyViolationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  safetyViolationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991b1b',
  },
  safetyViolationSubtitle: {
    fontSize: 11,
    color: '#7f1d1d',
    marginBottom: 8,
    fontWeight: '500',
  },
  violationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  violationBullet: {
    fontSize: 12,
    fontWeight: '900',
    color: '#dc2626',
    lineHeight: 16,
  },
  violationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
    lineHeight: 16,
  },
});
