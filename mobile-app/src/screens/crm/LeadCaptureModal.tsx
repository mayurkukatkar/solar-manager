import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  User,
  Phone,
  MapPin,
  Zap,
  Sparkles,
  ArrowRight,
  UploadCloud,
  FileText,
  Trash2,
  Building2,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { crmApi } from '../../api/endpoints';
import { offlineSyncService } from '../../services/offlineSyncService';

interface LeadCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (lead: any) => void;
  onProceedToQuote?: (lead: any) => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onProceedToQuote,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Prospect Contact Information
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Electricity & Utility Profile
  const [discomName, setDiscomName] = useState('MSEDCL (Mahavitaran)');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [billingUnit, setBillingUnit] = useState('');
  const [sanctionedLoad, setSanctionedLoad] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [monthlyUnits, setMonthlyUnits] = useState('');

  // Optional Bill Document Attachment (for back-office / records)
  const [billAttachmentUri, setBillAttachmentUri] = useState<string | null>(null);
  const [billAttachmentName, setBillAttachmentName] = useState<string | null>(null);

  // Cross-Field Solar Sizing AI
  const computeRecommendedKw = (): number => {
    const units = parseFloat(monthlyUnits);
    if (!isNaN(units) && units > 0) {
      return Number(Math.max(1, Math.min(25, units / 120)).toFixed(1));
    }
    const bill = parseFloat(monthlyBill);
    if (!isNaN(bill) && bill > 0) {
      const approxUnits = bill / 8.5;
      return Number(Math.max(1, Math.min(25, approxUnits / 120)).toFixed(1));
    }
    const load = parseFloat(sanctionedLoad);
    if (!isNaN(load) && load > 0) {
      return Number(Math.max(1, Math.min(load, 15)).toFixed(1));
    }
    return 3.0;
  };

  const recommendedKw = computeRecommendedKw();
  const estimatedAnnualGen = Math.round(recommendedKw * 1460);
  const estimatedMonthlySavings = Math.round(recommendedKw * 120 * 8.5);

  /**
   * Real-time Consumer Number handler:
   * Auto-infers BU (first 4 digits) for MSEDCL 12-digit consumer numbers
   */
  const handleConsumerNumberChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setConsumerNumber(clean);
    if (clean.length === 12 && !billingUnit) {
      setBillingUnit(clean.substring(0, 4));
    }
  };

  /**
   * Real-time Units handler:
   * Synchronizes estimated monthly bill (units * 8.5)
   */
  const handleUnitsChange = (val: string) => {
    setMonthlyUnits(val);
    const u = parseFloat(val);
    if (!isNaN(u) && u > 0 && (!monthlyBill || monthlyBill === '0')) {
      setMonthlyBill(String(Math.round(u * 8.5)));
    }
  };

  /**
   * Real-time Bill Amount handler:
   * Synchronizes estimated monthly units (bill / 8.5)
   */
  const handleBillChange = (val: string) => {
    setMonthlyBill(val);
    const b = parseFloat(val);
    if (!isNaN(b) && b > 0 && (!monthlyUnits || monthlyUnits === '0')) {
      setMonthlyUnits(String(Math.round(b / 8.5)));
    }
  };

  /**
   * Attach bill image or PDF as a file reference (No OCR)
   */
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setBillAttachmentUri(file.uri);
        setBillAttachmentName(file.name || 'Electricity_Bill.pdf');
      }
    } catch (err: any) {
      Alert.alert('Attachment Error', err.message || 'Could not pick document');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library access is needed to select bill photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setBillAttachmentUri(asset.uri);
        setBillAttachmentName('Bill_Photo.jpg');
      }
    } catch (err: any) {
      Alert.alert('Photo Error', err.message || 'Could not pick photo');
    }
  };

  const handleRemoveAttachment = () => {
    setBillAttachmentUri(null);
    setBillAttachmentName(null);
  };

  /**
   * Form Submission (Direct API or Offline Draft)
   */
  const handleSubmit = async (proceedQuote: boolean) => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter customer / prospect name.');
      return;
    }
    const cleanPhone = mobile.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const leadPayload = {
        name: name.trim(),
        mobile: cleanPhone,
        alternatePhone: altPhone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || 'Site Location',
        pincode: pincode.trim() || undefined,
        source: 'Field App',
        estimatedCap: recommendedKw,
        monthlyBill: parseFloat(monthlyBill) || undefined,
        sanctionedLoad: parseFloat(sanctionedLoad) || undefined,
        notes: `Consumer No: ${consumerNumber || 'N/A'}, BU: ${billingUnit || 'N/A'}, DISCOM: ${discomName}`,
      };

      let createdLead: any = null;
      try {
        const res = await crmApi.createLead(leadPayload);
        createdLead = res.lead || { ...leadPayload, id: res.id || `lead_${Date.now()}` };
      } catch (backendError) {
        console.warn('Backend unavailable, saving offline draft:', backendError);
        const draft = await offlineSyncService.saveDraftLead({
          name: name.trim(),
          mobile: cleanPhone,
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          consumerNumber: consumerNumber.trim(),
          bu: billingUnit.trim(),
          sanctionedLoadKw: parseFloat(sanctionedLoad) || undefined,
          monthlyBill: parseFloat(monthlyBill) || undefined,
          monthlyUnits: parseFloat(monthlyUnits) || undefined,
          recommendedKw,
          billPhotoUri: billAttachmentUri || undefined,
        });
        createdLead = { ...draft, id: draft.localId, stage: 'NEW' };
      }

      onSuccess(createdLead);
      if (proceedQuote && onProceedToQuote) {
        onProceedToQuote(createdLead);
      } else {
        Alert.alert('Lead Created', `Prospect ${name} registered successfully.`);
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not register lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>New Solar Lead</Text>
            <Text style={styles.headerSubtitle}>Direct field entry & prospect registration</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SECTION 1: PROSPECT CONTACT DETAILS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircleAmber}>
                <User size={18} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Prospect Details</Text>
                <Text style={styles.sectionSubtitle}>Primary contact and installation location</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Customer / Legal Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Patil or Thakre Solar"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Primary Mobile *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Alternate Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor="#94a3b8"
                  value={altPhone}
                  onChangeText={setAltPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Installation Site Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="House/Plot No, Street, Landmark"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>City / District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nagpur / Pune"
                  placeholderTextColor="#94a3b8"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 440034"
                  placeholderTextColor="#94a3b8"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>
          </View>

          {/* SECTION 2: ELECTRICITY & UTILITY PROFILE */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircleBlue}>
                <Zap size={18} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Electricity & Utility Profile</Text>
                <Text style={styles.sectionSubtitle}>Bill parameters and grid connection data</Text>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Consumer No (12 Digits)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 410010537316"
                  placeholderTextColor="#94a3b8"
                  value={consumerNumber}
                  onChangeText={handleConsumerNumberChange}
                  keyboardType="numeric"
                  maxLength={16}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Billing Unit (BU)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3905"
                  placeholderTextColor="#94a3b8"
                  value={billingUnit}
                  onChangeText={setBillingUnit}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Sanctioned Load (kW)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3.0 or 5.0"
                  placeholderTextColor="#94a3b8"
                  value={sanctionedLoad}
                  onChangeText={setSanctionedLoad}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Utility DISCOM</Text>
                <TextInput
                  style={styles.input}
                  value={discomName}
                  onChangeText={setDiscomName}
                  placeholder="MSEDCL, Tata Power, etc."
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Monthly Bill (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 4500"
                  placeholderTextColor="#94a3b8"
                  value={monthlyBill}
                  onChangeText={handleBillChange}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Monthly Units (kWh)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 350"
                  placeholderTextColor="#94a3b8"
                  value={monthlyUnits}
                  onChangeText={handleUnitsChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Optional Bill Attachment for Records */}
            <View style={styles.attachmentSection}>
              <Text style={styles.attachmentLabel}>Bill Document Attachment (Optional)</Text>
              {billAttachmentUri ? (
                <View style={styles.attachmentCard}>
                  <View style={styles.attachmentMeta}>
                    <FileText size={20} color="#2563eb" />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {billAttachmentName || 'Attached Document'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveAttachment} style={styles.removeAttachBtn}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.attachBtnRow}>
                  <TouchableOpacity
                    style={styles.attachBtn}
                    onPress={handlePickPhoto}
                    activeOpacity={0.75}
                  >
                    <UploadCloud size={16} color="#475569" />
                    <Text style={styles.attachBtnText}>Attach Bill Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.attachBtn}
                    onPress={handlePickDocument}
                    activeOpacity={0.75}
                  >
                    <FileText size={16} color="#475569" />
                    <Text style={styles.attachBtnText}>Upload PDF</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* DYNAMIC SOLAR RECOMMENDATION CARD */}
          <View style={styles.recommendationCard}>
            <View style={styles.recHeader}>
              <View style={styles.recBadge}>
                <Sparkles size={14} color="#f59e0b" />
                <Text style={styles.recBadgeText}>Instant Sizing AI</Text>
              </View>
              <Text style={styles.recTargetText}>Computed from Consumption</Text>
            </View>

            <View style={styles.recMetricsRow}>
              <View style={styles.recMetricMain}>
                <Text style={styles.recKwValue}>{recommendedKw}</Text>
                <Text style={styles.recKwUnit}>kWp</Text>
              </View>
              <View style={styles.recDivider} />
              <View style={styles.recSubMetrics}>
                <Text style={styles.recSubLabel}>
                  Est. Generation: <Text style={styles.recSubVal}>~{estimatedAnnualGen} units/yr</Text>
                </Text>
                <Text style={styles.recSubLabel}>
                  Monthly Savings:{' '}
                  <Text style={styles.recSubValGreen}>₹{estimatedMonthlySavings.toLocaleString('en-IN')}/mo</Text>
                </Text>
                <Text style={styles.recSubLabel}>
                  PM Surya Ghar Subsidy:{' '}
                  <Text style={styles.recSubValGold}>
                    ₹{recommendedKw >= 3 ? '78,000' : recommendedKw >= 2 ? '60,000' : '30,000'}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveOnlyBtn}
            onPress={() => handleSubmit(false)}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.saveOnlyText}>Save Lead</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={() => handleSubmit(true)}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedText}>Create Proposal</Text>
            <ArrowRight size={18} color="#ffffff" />
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  iconCircleAmber: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBlue: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  formCol: {
    flex: 1,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  attachmentSection: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attachmentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  attachBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    flex: 1,
  },
  removeAttachBtn: {
    padding: 4,
  },
  recommendationCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  recBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recTargetText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  recMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recMetricMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingRight: 16,
  },
  recKwValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  recKwUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },
  recDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 16,
  },
  recSubMetrics: {
    flex: 1,
    gap: 3,
  },
  recSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  recSubVal: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  recSubValGreen: {
    color: '#4ade80',
    fontWeight: '700',
  },
  recSubValGold: {
    color: '#fde047',
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  saveOnlyBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOnlyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  proceedBtn: {
    flex: 1.5,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  proceedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
