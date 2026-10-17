import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  FileText,
  Printer,
  Share2,
  CheckCircle2,
  Building,
  Zap,
  ShieldCheck,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import {
  generateDiscomHtml,
  createAndSharePdf,
  printDirectly,
} from '../../services/pdfService';

interface DiscomDocsModalProps {
  visible: boolean;
  project: any;
  onClose: () => void;
}

export const DiscomDocsModal: React.FC<DiscomDocsModalProps> = ({
  visible,
  project,
  onClose,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<'FORM_A1' | 'ANNEXURE_2' | 'WCR'>('FORM_A1');
  const [generating, setGenerating] = useState(false);

  const customerName = project?.customer?.name || project?.name?.replace(/Project.*/i, '').trim() || 'SHRI RAMESH PATIL';
  const consumerNumber = project?.consumerNumber || project?.customer?.consumerNumber || '410022120526';
  const capacityKw = project?.capacity || project?.systemCapacity || 3.3;
  const address = project?.address || project?.customer?.address || 'Site Location, Maharashtra';

  const docOptions = [
    {
      id: 'FORM_A1' as const,
      title: 'Form A-1: Net-Metering Application',
      subtitle: 'Official MSEDCL Grid Interconnection Request',
      badge: 'Statutory',
    },
    {
      id: 'ANNEXURE_2' as const,
      title: 'Annexure 2: Vendor-Consumer Agreement',
      subtitle: 'Standard Agreement with Stamp Paper Header',
      badge: 'Legal',
    },
    {
      id: 'WCR' as const,
      title: 'Work Completion Report (WCR)',
      subtitle: 'Technical Testing & Earthing Resistance Certificate',
      badge: 'Technical QA',
    },
  ];

  const handleExportShare = async () => {
    setGenerating(true);
    try {
      const html = generateDiscomHtml(selectedDocType, {
        customerName,
        consumerNumber,
        systemCapacityKw: capacityKw,
        address,
        companyName: 'SolarManager Solutions Pvt Ltd',
      });
      const docName =
        selectedDocType === 'FORM_A1'
          ? 'MSEDCL_Form_A1'
          : selectedDocType === 'ANNEXURE_2'
          ? 'MSEDCL_Annexure2_Agreement'
          : 'Work_Completion_Report_WCR';

      await createAndSharePdf(html, `${docName}_${consumerNumber}.pdf`);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export DISCOM form');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    try {
      const html = generateDiscomHtml(selectedDocType, {
        customerName,
        consumerNumber,
        systemCapacityKw: capacityKw,
        address,
        companyName: 'SolarManager Solutions Pvt Ltd',
      });
      await printDirectly(html);
    } catch (err: any) {
      Alert.alert('Print Failed', err.message || 'Could not print document');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>DISCOM Statutory Hub</Text>
            <Text style={styles.headerSubtitle}>
              Stage 5: Official Net-Metering Document Pack
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PROJECT HEADER CARD */}
          <View style={styles.projectHero}>
            <View style={styles.projectHeroTop}>
              <View style={styles.discomBadge}>
                <Building size={14} color="#f59e0b" />
                <Text style={styles.discomBadgeText}>MSEDCL (Mahavitaran)</Text>
              </View>
              <Text style={styles.capTag}>{capacityKw} kWp Rooftop</Text>
            </View>
            <Text style={styles.heroName}>{customerName}</Text>
            <Text style={styles.heroConsumer}>
              Consumer No: <Text style={styles.consumerHighlight}>{consumerNumber}</Text> | BU: 4100
            </Text>
          </View>

          {/* DOCUMENT PICKER CARDS */}
          <Text style={styles.sectionHeading}>Select Official Form to Generate</Text>

          {docOptions.map((doc) => {
            const isSelected = selectedDocType === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.docCard, isSelected && styles.docCardActive]}
                onPress={() => setSelectedDocType(doc.id)}
                activeOpacity={0.8}
              >
                <View style={styles.docCardLeft}>
                  <View style={[styles.docIconCircle, isSelected && styles.docIconCircleActive]}>
                    <FileText size={20} color={isSelected ? '#ffffff' : '#2563eb'} />
                  </View>
                  <View style={styles.docMeta}>
                    <View style={styles.docTitleRow}>
                      <Text style={[styles.docTitle, isSelected && styles.docTitleActive]}>
                        {doc.title}
                      </Text>
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{doc.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.docSubtitle}>{doc.subtitle}</Text>
                  </View>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* PRE-FILLED METADATA SUMMARY */}
          <View style={styles.prefillCard}>
            <View style={styles.prefillHeader}>
              <CheckCircle2 size={16} color="#16a34a" />
              <Text style={styles.prefillTitle}>Auto Pre-filled from Live Database</Text>
            </View>
            <View style={styles.prefillGrid}>
              <View style={styles.prefillItem}>
                <Text style={styles.prefillLabel}>Grid Voltage</Text>
                <Text style={styles.prefillVal}>LT 230V / 415V</Text>
              </View>
              <View style={styles.prefillItem}>
                <Text style={styles.prefillLabel}>Inverter Cert</Text>
                <Text style={styles.prefillVal}>IEC 62109 / 61727</Text>
              </View>
              <View style={styles.prefillItem}>
                <Text style={styles.prefillLabel}>Earth Test</Text>
                <Text style={styles.prefillVal}>&lt; 5.0 Ohms (PASS)</Text>
              </View>
              <View style={styles.prefillItem}>
                <Text style={styles.prefillLabel}>Installer Reg</Text>
                <Text style={styles.prefillVal}>PWD/EL/2026/0994</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            activeOpacity={0.8}
          >
            <Printer size={18} color="#0f172a" />
            <Text style={styles.printBtnText}>Direct Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportShareBtn}
            onPress={handleExportShare}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Share2 size={18} color="#ffffff" />
                <Text style={styles.exportShareText}>Export & Share PDF</Text>
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
    fontSize: 12,
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
    marginBottom: 20,
  },
  projectHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discomBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    textTransform: 'uppercase',
  },
  capTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroConsumer: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  consumerHighlight: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  docCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
  },
  docCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconCircleActive: {
    backgroundColor: '#2563eb',
  },
  docMeta: {
    flex: 1,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  docTitleActive: {
    color: '#1d4ed8',
  },
  badgePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  docSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  prefillCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  prefillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  prefillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  prefillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  prefillItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  prefillLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  prefillVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 10,
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  exportShareBtn: {
    flex: 1.8,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportShareText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
