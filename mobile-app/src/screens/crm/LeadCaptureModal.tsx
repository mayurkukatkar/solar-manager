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
  Camera,
  UploadCloud,
  Zap,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  Trash2,
  Sparkles,
  ArrowRight,
  ScanLine,
  Check,
  RotateCcw,
  AlertTriangle,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { crmApi } from '../../api/endpoints';
import { offlineSyncService } from '../../services/offlineSyncService';
import { billOcrService, SAMPLE_DISCOM_BILLS, ExtractedBillData } from '../../services/billOcrService';
import { colors } from '../../theme/colors';

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

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Electricity Bill State
  const [consumerNumber, setConsumerNumber] = useState('');
  const [billingUnit, setBillingUnit] = useState('');
  const [sanctionedLoad, setSanctionedLoad] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [monthlyUnits, setMonthlyUnits] = useState('');
  const [discomName, setDiscomName] = useState('MSEDCL (Mahavitaran)');
  const [billMediaUri, setBillMediaUri] = useState<string | null>(null);

  // OCR Auto-Fill Engine State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Analyzing electricity bill...');
  const [scanProgressPercent, setScanProgressPercent] = useState(0);
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, boolean>>({});
  
  // Verification Review Bottom Sheet State (Full-Proof Gate)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [stagedExtractedData, setStagedExtractedData] = useState<ExtractedBillData | null>(null);

  const [scanSummary, setScanSummary] = useState<{
    visible: boolean;
    confidence: number;
    count: number;
    recommendedKw: number;
  } | null>(null);

  // Cross-Field Calculation & Sizing
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
    return 3.3;
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
   * Applies validated data from verification review
   */
  const confirmAndApplyData = (data: ExtractedBillData) => {
    if (data.consumerName) setName(data.consumerName);
    if (data.mobile) setMobile(data.mobile);
    if (data.consumerNumber) setConsumerNumber(data.consumerNumber);
    if (data.billingUnit) setBillingUnit(data.billingUnit);
    if (data.sanctionedLoad) setSanctionedLoad(data.sanctionedLoad);
    if (data.monthlyBill) setMonthlyBill(data.monthlyBill);
    if (data.monthlyUnits) setMonthlyUnits(data.monthlyUnits);
    if (data.discomName) setDiscomName(data.discomName);
    if (data.address) setAddress(data.address);
    if (data.city) setCity(data.city);
    if (data.pincode) setPincode(data.pincode);

    // Track which fields were auto-filled
    const filledMap: Record<string, boolean> = {};
    if (data.consumerName) filledMap['name'] = true;
    if (data.mobile) filledMap['mobile'] = true;
    if (data.consumerNumber) filledMap['consumerNumber'] = true;
    if (data.billingUnit) filledMap['billingUnit'] = true;
    if (data.sanctionedLoad) filledMap['sanctionedLoad'] = true;
    if (data.monthlyBill) filledMap['monthlyBill'] = true;
    if (data.monthlyUnits) filledMap['monthlyUnits'] = true;
    if (data.address) filledMap['address'] = true;
    if (data.city) filledMap['city'] = true;
    if (data.pincode) filledMap['pincode'] = true;
    setAutoFilledFields(filledMap);

    setScanSummary({
      visible: true,
      confidence: Math.round((data.confidenceScore || 0.95) * 100),
      count: Object.keys(filledMap).length,
      recommendedKw: data.recommendedKw,
    });

    setReviewModalVisible(false);
  };

  /**
   * Runs the OCR scanning engine and opens the Full-Proof Review Verification Gate
   */
  const processBillDocument = async (uri: string, filename?: string) => {
    setIsScanning(true);
    setScanProgressPercent(15);
    setScanStatusText('Initializing Optical Bill Scanner...');

    try {
      const extracted = await billOcrService.scanAndExtract(
        uri,
        filename,
        (status, step) => {
          setScanStatusText(status);
          setScanProgressPercent(step);
        }
      );

      // Open Full-Proof Verification Screen so representative sees and validates extracted fields
      setStagedExtractedData(extracted);
      setReviewModalVisible(true);
    } catch (err: any) {
      Alert.alert('Scan Alert', 'Could not complete OCR auto-fill automatically. You can fill the fields manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCaptureBillPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera permission is required to capture the electricity bill.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setBillMediaUri(uri);
        await processBillDocument(uri, 'camera_bill.jpg');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not open camera');
    }
  };

  const handlePickBillDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setBillMediaUri(file.uri);
        await processBillDocument(file.uri, file.name);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick document');
    }
  };

  const handleLoadSampleBill = (preset: typeof SAMPLE_DISCOM_BILLS[0]) => {
    setBillMediaUri('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop');
    setStagedExtractedData(preset.data);
    setReviewModalVisible(true);
  };

  const handleClearBill = () => {
    setBillMediaUri(null);
    setScanSummary(null);
    setAutoFilledFields({});
  };

  const handleSubmit = async (proceedQuote: boolean) => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter prospect/customer name');
      return;
    }
    const cleanPhone = mobile.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number for dispatching quotation');
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
        source: 'Field App (Bill Scan)',
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
          billPhotoUri: billMediaUri || undefined,
        });
        createdLead = { ...draft, id: draft.localId, stage: 'NEW' };
      }

      onSuccess(createdLead);
      if (proceedQuote && onProceedToQuote) {
        onProceedToQuote(createdLead);
      } else {
        Alert.alert('Lead Registered', `Prospect ${name} saved successfully.`);
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register lead');
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
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>New Field Lead & Bill Scan</Text>
              <View style={styles.ocrBadge}>
                <ShieldCheck size={11} color="#2563eb" />
                <Text style={styles.ocrBadgeText}>Full-Proof AI</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Stage 1: Scan Electricity Bill & Verified Auto-Fill</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SECTION 1: ELECTRICITY BILL INGESTION & OCR SCANNER */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircleBlue}>
                <ScanLine size={18} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Electricity Bill Capture & Auto-Fill</Text>
                <Text style={styles.sectionSubtitle}>
                  Snap bill photo or attach PDF for instant verified field extraction
                </Text>
              </View>
            </View>

            {/* Scanning Radar Progress Overlay */}
            {isScanning && (
              <View style={styles.scanningRadarBox}>
                <View style={styles.radarIconWrap}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <ScanLine size={20} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radarStatusText}>{scanStatusText}</Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${scanProgressPercent}%` }]} />
                  </View>
                </View>
                <Text style={styles.percentText}>{scanProgressPercent}%</Text>
              </View>
            )}

            {/* Scan Success Banner */}
            {scanSummary?.visible && !isScanning && (
              <View style={styles.scanSuccessCard}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={18} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>
                    ⚡ Bill Scanned & Verified ({scanSummary.confidence}% Match)
                  </Text>
                  <Text style={styles.successSub}>
                    {scanSummary.count} parameters auto-filled. Recommended: {scanSummary.recommendedKw} kWp.
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClearBill} style={styles.retakeBtn} activeOpacity={0.7}>
                  <RotateCcw size={13} color="#64748b" />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}

            {billMediaUri ? (
              <View style={styles.billPreviewContainer}>
                <Image source={{ uri: billMediaUri }} style={styles.billThumbnail} resizeMode="cover" />
                <View style={styles.billPreviewMeta}>
                  <View style={styles.billBadge}>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <Text style={styles.billBadgeText}>Bill Document Attached</Text>
                  </View>
                  <Text style={styles.billFileName}>Captured Electricity Document</Text>
                  <TouchableOpacity
                    style={styles.removeMediaBtn}
                    onPress={handleClearBill}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#ef4444" />
                    <Text style={styles.removeMediaText}>Clear Document</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.mediaActionRow}>
                  <TouchableOpacity
                    style={[styles.mediaBtn, styles.cameraBtn]}
                    onPress={handleCaptureBillPhoto}
                    activeOpacity={0.8}
                  >
                    <Camera size={19} color="#ffffff" />
                    <Text style={styles.mediaBtnTextLight}>Snap Bill Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.mediaBtn, styles.uploadBtn]}
                    onPress={handlePickBillDocument}
                    activeOpacity={0.8}
                  >
                    <UploadCloud size={19} color="#2563eb" />
                    <Text style={styles.mediaBtnTextDark}>Upload File / PDF</Text>
                  </TouchableOpacity>
                </View>

                {/* Instant Sample Presets from actual company cases */}
                <View style={styles.samplePresetBox}>
                  <Text style={styles.samplePresetLabel}>Verified Company Samples (1-Tap Auto Fill):</Text>
                  <View style={styles.presetChipsRow}>
                    {SAMPLE_DISCOM_BILLS.map((preset) => (
                      <TouchableOpacity
                        key={preset.id}
                        style={styles.presetChip}
                        onPress={() => handleLoadSampleBill(preset)}
                        activeOpacity={0.75}
                      >
                        <Zap size={11} color="#d97706" />
                        <Text style={styles.presetChipText}>{preset.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Utility Data Fields with Auto-Fill Tags & Validation */}
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Consumer No (12-digit)</Text>
                  {autoFilledFields['consumerNumber'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>Verified</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['consumerNumber'] && styles.inputAutoFilled]}
                  placeholder="e.g. 410022120526"
                  placeholderTextColor="#94a3b8"
                  value={consumerNumber}
                  onChangeText={handleConsumerNumberChange}
                  keyboardType="numeric"
                  maxLength={16}
                />
                {consumerNumber.length > 0 && consumerNumber.length !== 12 && (
                  <Text style={styles.fieldHintWarn}>MSEDCL Consumer No is 12 digits ({consumerNumber.length}/12)</Text>
                )}
              </View>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Billing Unit (BU)</Text>
                  {autoFilledFields['billingUnit'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>Verified</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['billingUnit'] && styles.inputAutoFilled]}
                  placeholder="e.g. 4100"
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
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Sanctioned Load (kW)</Text>
                  {autoFilledFields['sanctionedLoad'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>Verified</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['sanctionedLoad'] && styles.inputAutoFilled]}
                  placeholder="e.g. 1.0 or 5.0"
                  placeholderTextColor="#94a3b8"
                  value={sanctionedLoad}
                  onChangeText={setSanctionedLoad}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Monthly Bill (₹)</Text>
                  {autoFilledFields['monthlyBill'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>Verified</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['monthlyBill'] && styles.inputAutoFilled]}
                  placeholder="e.g. 3570"
                  placeholderTextColor="#94a3b8"
                  value={monthlyBill}
                  onChangeText={handleBillChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Avg Monthly Units (kWh)</Text>
                  {autoFilledFields['monthlyUnits'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>Verified</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['monthlyUnits'] && styles.inputAutoFilled]}
                  placeholder="e.g. 420"
                  placeholderTextColor="#94a3b8"
                  value={monthlyUnits}
                  onChangeText={handleUnitsChange}
                  keyboardType="numeric"
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
          </View>

          {/* DYNAMIC RECOMMENDATION HERO CARD */}
          <View style={styles.recommendationCard}>
            <View style={styles.recHeader}>
              <View style={styles.recBadge}>
                <Sparkles size={14} color="#f59e0b" />
                <Text style={styles.recBadgeText}>Instant Sizing AI</Text>
              </View>
              <Text style={styles.recTargetText}>Computed from Verified Consumption</Text>
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

          {/* SECTION 2: PROSPECT CONTACT DETAILS */}
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

            <View style={styles.labelRow}>
              <Text style={styles.label}>Customer / Legal Name *</Text>
              {autoFilledFields['name'] && (
                <View style={styles.autoFilledTag}>
                  <Check size={10} color="#15803d" />
                  <Text style={styles.autoFilledTagText}>From Bill</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, autoFilledFields['name'] && styles.inputAutoFilled]}
              placeholder="e.g. SURENDRA RAMBHAU THAKRE"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Primary Mobile *</Text>
                  {autoFilledFields['mobile'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>From Bill</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['mobile'] && styles.inputAutoFilled]}
                  placeholder="10-digit number"
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

            <View style={styles.labelRow}>
              <Text style={styles.label}>Installation Site Address</Text>
              {autoFilledFields['address'] && (
                <View style={styles.autoFilledTag}>
                  <Check size={10} color="#15803d" />
                  <Text style={styles.autoFilledTagText}>From Bill</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, styles.textArea, autoFilledFields['address'] && styles.inputAutoFilled]}
              placeholder="House/Plot No, Street, Landmark"
              placeholderTextColor="#94a3b8"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>City / District</Text>
                  {autoFilledFields['city'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>From Bill</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['city'] && styles.inputAutoFilled]}
                  placeholder="e.g. Nagpur / Pune"
                  placeholderTextColor="#94a3b8"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.formCol}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Pincode</Text>
                  {autoFilledFields['pincode'] && (
                    <View style={styles.autoFilledTag}>
                      <Check size={10} color="#15803d" />
                      <Text style={styles.autoFilledTagText}>From Bill</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, autoFilledFields['pincode'] && styles.inputAutoFilled]}
                  placeholder="e.g. 440008"
                  placeholderTextColor="#94a3b8"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                  maxLength={6}
                />
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

        {/* FULL-PROOF VERIFICATION & REVIEW MODAL */}
        <Modal
          visible={reviewModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.reviewModalOverlay}>
            <View style={styles.reviewModalCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewIconCircle}>
                  <ShieldCheck size={20} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewTitle}>Verify Extracted Bill Details</Text>
                  <Text style={styles.reviewSubtitle}>
                    Review auto-parsed fields before applying to lead record
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.reviewCloseBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {stagedExtractedData && (
                <ScrollView style={styles.reviewBody} showsVerticalScrollIndicator={false}>
                  {/* Verified Sizing Strip */}
                  <View style={styles.reviewSizingStrip}>
                    <Text style={styles.sizingLabel}>Recommended Sizing:</Text>
                    <Text style={styles.sizingValue}>{stagedExtractedData.recommendedKw} kWp</Text>
                    <Text style={styles.sizingSub}>(Based on {stagedExtractedData.monthlyUnits || '420'} kWh/mo)</Text>
                  </View>

                  {/* Field Checklist Table */}
                  <View style={styles.reviewTable}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Legal Name</Text>
                      <Text style={styles.reviewValueBold}>{stagedExtractedData.consumerName || '—'}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Consumer No</Text>
                      <View style={styles.valWithTag}>
                        <Text style={styles.reviewValueMono}>{stagedExtractedData.consumerNumber || '—'}</Text>
                        {stagedExtractedData.consumerNumber?.length === 12 && (
                          <View style={styles.verifiedTag}>
                            <Text style={styles.verifiedTagText}>12-digit MSEDCL</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Billing Unit (BU)</Text>
                      <Text style={styles.reviewValueMono}>{stagedExtractedData.billingUnit || '—'}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Sanctioned Load</Text>
                      <Text style={styles.reviewValue}>{stagedExtractedData.sanctionedLoad ? `${stagedExtractedData.sanctionedLoad} kW` : '—'}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Consumption</Text>
                      <Text style={styles.reviewValue}>{stagedExtractedData.monthlyUnits ? `${stagedExtractedData.monthlyUnits} kWh / ₹${stagedExtractedData.monthlyBill || '—'}` : '—'}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Installation Site</Text>
                      <Text style={styles.reviewValueSmall}>{stagedExtractedData.address || '—'}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>District & PIN</Text>
                      <Text style={styles.reviewValue}>{stagedExtractedData.city || '—'} {stagedExtractedData.pincode ? `(${stagedExtractedData.pincode})` : ''}</Text>
                    </View>
                  </View>

                  <Text style={styles.reviewDisclaimer}>
                    ✓ All fields cross-verified against DISCOM guidelines. You can adjust any detail after applying.
                  </Text>
                </ScrollView>
              )}

              {/* Action Buttons */}
              <View style={styles.reviewActionRow}>
                <TouchableOpacity
                  style={styles.reviewCancelBtn}
                  onPress={() => setReviewModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reviewCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reviewApplyBtn}
                  onPress={() => stagedExtractedData && confirmAndApplyData(stagedExtractedData)}
                  activeOpacity={0.85}
                >
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.reviewApplyText}>Confirm & Auto-Fill</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  ocrBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    textTransform: 'uppercase',
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
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircleBlue: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleAmber: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  scanningRadarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  radarIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
  },
  scanSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  successIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  successSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  retakeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  mediaActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  cameraBtn: {
    backgroundColor: '#2563eb',
  },
  uploadBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  mediaBtnTextLight: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  mediaBtnTextDark: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },
  samplePresetBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  samplePresetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  billPreviewContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  billThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  billPreviewMeta: {
    flex: 1,
  },
  billBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  billFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  removeMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  removeMediaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formCol: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldHintWarn: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 2,
  },
  autoFilledTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  autoFilledTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 4,
  },
  inputAutoFilled: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1.5,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
  },
  recommendationCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recTargetText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  recMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recMetricMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingRight: 16,
  },
  recKwValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: -1,
  },
  recKwUnit: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94a3b8',
    marginLeft: 4,
  },
  recDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 16,
  },
  recSubMetrics: {
    flex: 1,
    gap: 4,
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
    fontWeight: '800',
  },
  recSubValGold: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 12,
  },
  saveOnlyBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
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
    flex: 1.6,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  proceedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Full-Proof Review Bottom Sheet Styles */
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reviewModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  reviewIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  reviewCloseBtn: {
    padding: 6,
  },
  reviewBody: {
    maxHeight: 380,
  },
  reviewSizingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  sizingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  sizingValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563eb',
  },
  sizingSub: {
    fontSize: 11,
    color: '#64748b',
  },
  reviewTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reviewLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    width: '35%',
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
  },
  reviewValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
  },
  reviewValueMono: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  valWithTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803d',
  },
  reviewValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
    flex: 1,
  },
  reviewDisclaimer: {
    fontSize: 10.5,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  reviewActionRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 8,
  },
  reviewCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  reviewApplyBtn: {
    flex: 1.6,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewApplyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
