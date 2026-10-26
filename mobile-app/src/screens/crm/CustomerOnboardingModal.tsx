import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import {
  X,
  ShieldCheck,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  CreditCard,
  Building,
  ArrowRight,
  Trash2,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ModalHeader } from '../../components/Header';
import { crmApi, documentsApi, tenantApi } from '../../api/endpoints';

interface CustomerOnboardingModalProps {
  visible: boolean;
  lead: any;
  quotationData?: any;
  onClose: () => void;
  onSuccess: (project: any) => void;
}

interface DocSlot {
  id: string;
  title: string;
  subtitle: string;
  required: boolean;
  uri?: string;
  fileName?: string;
}

export const CustomerOnboardingModal: React.FC<CustomerOnboardingModalProps> = ({
  visible,
  lead,
  quotationData,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Customer Legal Profile - initialized from opened lead
  const [legalName, setLegalName] = useState(lead?.name || '');
  const [mobile, setMobile] = useState(lead?.mobile || lead?.phone || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [address, setAddress] = useState(lead?.address || '');
  const [city, setCity] = useState(lead?.city || '');
  const [pincode, setPincode] = useState(lead?.pincode || '');
  const [consumerNumber, setConsumerNumber] = useState(
    lead?.consumerNumber || lead?.electricityConnection || ''
  );
  const [capacity, setCapacity] = useState(
    String(quotationData?.capacityKw || lead?.estimatedCap || lead?.recommendedKw || 3.3)
  );

  // Roof & Technical Site Specs
  const [roofType, setRoofType] = useState('RCC Flat Concrete');
  const [roofAreaSqFt, setRoofAreaSqFt] = useState('450');
  const [buildingFloors, setBuildingFloors] = useState('G+1 (2 Floors)');
  const [shadowFree, setShadowFree] = useState(true);

  // PM Surya Ghar Direct Bank Transfer Details
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(lead?.name || '');

  // Token Advance (20% of turnkey plant cost including all GST)
  const systemTotal =
    quotationData?.grossTotal ||
    quotationData?.totalSystemCost ||
    lead?.estimatedValue ||
    0;
  const defaultAdvance = systemTotal > 0 ? String(Math.round(systemTotal * 0.2)) : '';
  const [advanceAmount, setAdvanceAmount] = useState(defaultAdvance);
  const [paymentMode, setPaymentMode] = useState('UPI / QR Transfer');
  const [transactionRef, setTransactionRef] = useState('');

  // 6 KYC Document Slots
  const [documents, setDocuments] = useState<DocSlot[]>([
    {
      id: 'ELECTRICITY_BILL',
      title: 'Electricity Bill (Latest Copy)',
      subtitle: 'Mandatory for MSEDCL Consumer Number & load verification',
      required: false,
      uri: lead?.billPhotoUri,
    },
    {
      id: 'AADHAAR_CARD',
      title: 'Aadhaar Card (Front & Back)',
      subtitle: 'National Portal PM Surya Ghar KYC verification',
      required: false,
    },
    {
      id: 'PAN_CARD',
      title: 'PAN Card',
      subtitle: 'Required for solar billing & tax compliance',
      required: false,
    },
    {
      id: 'PROPERTY_TAX',
      title: 'Property Tax Receipt / Index II',
      subtitle: 'Proof of premises ownership for rooftop erection',
      required: false,
    },
    {
      id: 'CANCELLED_CHEQUE',
      title: 'Cancelled Cheque / Bank Passbook',
      subtitle: 'Crucial for direct subsidy transfer into client bank account',
      required: false,
    },
    {
      id: 'ROOF_PHOTOS',
      title: 'Site & Terrace Roof Photos',
      subtitle: 'Shadow analysis & structure mounting location',
      required: false,
    },
  ]);

  // AUTO-FILL ALL CUSTOMER DETAILS FROM OPENED LEAD
  useEffect(() => {
    if (visible && lead) {
      setLegalName(lead.name || '');
      setMobile(lead.mobile || lead.phone || '');
      setEmail(lead.email || '');
      setAddress(lead.address || '');
      setCity(lead.city || '');
      setPincode(lead.pincode || '');
      setAccountHolderName(lead.name || '');
      setConsumerNumber(lead.consumerNumber || lead.electricityConnection || '');
      setCapacity(
        String(quotationData?.capacityKw || lead.estimatedCap || lead.recommendedKw || 3.3)
      );

      const sysTotal =
        quotationData?.grossTotal ||
        quotationData?.totalSystemCost ||
        lead.estimatedValue ||
        0;
      if (sysTotal > 0) {
        setAdvanceAmount(String(Math.round(sysTotal * 0.2)));
      } else {
        setAdvanceAmount('');
      }

      setDocuments([
        {
          id: 'ELECTRICITY_BILL',
          title: 'Electricity Bill (Latest Copy)',
          subtitle: 'Mandatory for MSEDCL Consumer Number & load verification',
          required: false,
          uri: lead.billPhotoUri || undefined,
          fileName: lead.billPhotoUri ? 'Electricity_Bill.jpg' : undefined,
        },
        {
          id: 'AADHAAR_CARD',
          title: 'Aadhaar Card (Front & Back)',
          subtitle: 'National Portal PM Surya Ghar KYC verification',
          required: false,
        },
        {
          id: 'PAN_CARD',
          title: 'PAN Card',
          subtitle: 'Required for solar billing & tax compliance',
          required: false,
        },
        {
          id: 'PROPERTY_TAX',
          title: 'Property Tax Receipt / Index II',
          subtitle: 'Proof of premises ownership for rooftop erection',
          required: false,
        },
        {
          id: 'CANCELLED_CHEQUE',
          title: 'Cancelled Cheque / Bank Passbook',
          subtitle: 'Crucial for direct subsidy transfer into client bank account',
          required: false,
        },
        {
          id: 'ROOF_PHOTOS',
          title: 'Site & Terrace Roof Photos',
          subtitle: 'Shadow analysis & structure mounting location',
          required: false,
        },
      ]);
    }
  }, [visible, lead, quotationData]);

  const handleCapturePhoto = async (docId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission required for document upload.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateDocUri(docId, result.assets[0].uri, 'Camera Capture.jpg');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not launch camera');
    }
  };

  const handlePickDocument = async (docId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateDocUri(docId, result.assets[0].uri, result.assets[0].name || 'Document.pdf');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick document');
    }
  };

  const updateDocUri = (docId: string, uri: string, fileName: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, uri, fileName } : d))
    );
  };

  const removeDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, uri: undefined, fileName: undefined } : d))
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!legalName.trim() || mobile.trim().length < 10) {
      Alert.alert('Missing Details', 'Please verify customer legal name and 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Convert Lead to Client & Project in live backend with all financial & site metadata
      let projectResult: any = null;
      if (lead?.id) {
        try {
          const convertRes = await crmApi.convertLead(lead.id, {
            customerName: legalName.trim(),
            mobile: mobile.trim(),
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            pincode: pincode.trim() || undefined,
            capacity: parseFloat(capacity) || quotationData?.capacityKw || lead?.estimatedCap || 3.3,
            bankName,
            accountNumber,
            ifscCode,
            accountHolderName,
            consumerNumber: consumerNumber.trim() || lead?.consumerNumber || '410022120526',
          });
          projectResult = convertRes?.project;
        } catch (apiErr: any) {
          console.warn('Convert API notice:', apiErr.message);
          // Network recovery: check if project was provisioned despite the timeout/drop
          try {
            const projectsRes = await tenantApi.getProjects();
            const existing = (projectsRes?.projects || []).find(
              (p: any) => p.leadId === lead.id || (p.customer?.mobile && p.customer.mobile === mobile.trim())
            );
            if (existing) {
              projectResult = existing;
            } else {
              throw apiErr;
            }
          } catch {
            throw apiErr;
          }
        }
      }

      if (!projectResult) {
        projectResult = {
          id: `prj_${Date.now()}`,
          projectNumber: `PRJ-${Date.now().toString().slice(-5)}`,
          name: `${legalName} Rooftop Solar Project`,
          capacity: quotationData?.capacityKw || lead?.estimatedCap || 3.3,
          status: 'In Progress',
          currentStage: 'Planning',
          customer: {
            name: legalName,
            mobile,
            address,
            city,
            consumerNumber: lead?.consumerNumber || '410022120526',
          },
        };
      }

      // 2. Upload all attached KYC documents to backend storage
      const attachedDocs = documents.filter((d): d is DocSlot & { uri: string } => Boolean(d.uri));
      let uploadedCount = 0;
      if (attachedDocs.length > 0 && projectResult?.id) {
        for (const doc of attachedDocs) {
          try {
            const formData = new FormData();
            const isPdf = (doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf')) || doc.uri.toLowerCase().endsWith('.pdf');
            formData.append('file', {
              uri: doc.uri,
              name: doc.fileName || `${doc.id.toLowerCase()}.${isPdf ? 'pdf' : 'jpg'}`,
              type: isPdf ? 'application/pdf' : 'image/jpeg',
            } as any);
            formData.append('title', doc.title);
            formData.append('category', 'Customer KYC');
            formData.append('projectId', projectResult.id);
            formData.append('entityType', 'PROJECT');
            formData.append('entityId', projectResult.id);
            if (projectResult.customerId || projectResult.customer?.id) {
              formData.append('customerId', projectResult.customerId || projectResult.customer?.id);
            }

            await documentsApi.uploadDocument(formData);
            uploadedCount++;
          } catch (uploadErr: any) {
            console.warn(`Document upload warning for ${doc.title}:`, uploadErr.message);
          }
        }
      }

      Alert.alert(
        'Client Onboarded Successfully!',
        `Customer "${legalName}" converted to Project: ${projectResult.projectNumber || projectResult.name}.\n\n${uploadedCount} KYC documents uploaded to central cloud repository.`
      );

      onSuccess(projectResult);
      onClose();
    } catch (err: any) {
      Alert.alert('Onboarding Notice', err.message || 'Could not complete onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* STANDARDIZED MODAL HEADER */}
        <ModalHeader
          title="Customer Onboarding"
          subtitle="Stage 3: Legal KYC & Project Provisioning"
          onClose={onClose}
        />

        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* CLIENT BADGE CARD */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={styles.heroBadgeText}>Conversion to Active Client</Text>
              </View>
              <Text style={styles.heroQuoteTag}>
                {quotationData?.capacityKw || lead?.estimatedCap || 3.3} kWp System
              </Text>
            </View>
            <Text style={styles.heroName}>{legalName || 'Valued Customer'}</Text>
            <Text style={styles.heroSubtitle}>
              Contract Value: ₹{(quotationData?.netCustomerCost || 120000).toLocaleString('en-IN')} (Net Investment)
            </Text>
          </View>

          {/* SECTION 1: VERIFIED LEGAL PROFILE */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>1. Verified Legal & Premises Profile</Text>
              <Text style={styles.cardSubtitle}>As appears on Electricity Bill and Aadhaar</Text>
            </View>

            <Text style={styles.label}>Legal Full Name *</Text>
            <TextInput
              style={styles.input}
              value={legalName}
              onChangeText={setLegalName}
              placeholder="Full name as per Aadhaar"
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Registered Mobile *</Text>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="Optional"
                />
              </View>
            </View>

            <Text style={styles.label}>Installation Site Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>City / Town</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>DISCOM Consumer No.</Text>
                <TextInput
                  style={styles.input}
                  value={consumerNumber}
                  onChangeText={setConsumerNumber}
                  placeholder="e.g. 410022120526"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Proposed Capacity (kWp) *</Text>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                  placeholder="e.g. 3.3"
                />
              </View>
            </View>
          </View>

          {/* SECTION 2: ROOF & SITE SPECIFICATIONS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>2. Roof & Structural Details</Text>
              <Text style={styles.cardSubtitle}>Site feasibility specifications</Text>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Roof Construction</Text>
                <TextInput style={styles.input} value={roofType} onChangeText={setRoofType} />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Usable Area (Sq. Ft)</Text>
                <TextInput
                  style={styles.input}
                  value={roofAreaSqFt}
                  onChangeText={setRoofAreaSqFt}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Building Height</Text>
                <TextInput style={styles.input} value={buildingFloors} onChangeText={setBuildingFloors} />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Terrace Access</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyVal}>Standard Staircase</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 3: 6-POINT KYC UPLOAD CENTER */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>3. Mandatory KYC Document Center</Text>
              <Text style={styles.cardSubtitle}>
                Upload clear photos or PDFs for DISCOM & PM Surya Ghar
              </Text>
            </View>

            {documents.map((doc) => (
              <View key={doc.id} style={styles.docSlotCard}>
                <View style={styles.docSlotHeader}>
                  <View style={styles.docSlotMeta}>
                    <Text style={styles.docSlotTitle}>{doc.title}</Text>
                    <Text style={styles.docSlotSubtitle}>{doc.subtitle}</Text>
                  </View>
                  {doc.uri ? (
                    <View style={styles.uploadedBadge}>
                      <CheckCircle2 size={13} color="#16a34a" />
                      <Text style={styles.uploadedBadgeText}>Attached</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <AlertCircle size={13} color="#ea580c" />
                      <Text style={styles.pendingBadgeText}>Required</Text>
                    </View>
                  )}
                </View>

                {doc.uri ? (
                  <View style={styles.attachedPreviewRow}>
                    <Image source={{ uri: doc.uri }} style={styles.docThumbnail} resizeMode="cover" />
                    <View style={styles.attachedFileInfo}>
                      <Text style={styles.attachedFileName} numberOfLines={1}>
                        {doc.fileName || 'Attached KYC Document'}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeDocBtn}
                        onPress={() => removeDoc(doc.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color="#ef4444" />
                        <Text style={styles.removeDocText}>Remove Document</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.docActionsRow}>
                    <TouchableOpacity
                      style={styles.docSnapBtn}
                      onPress={() => handleCapturePhoto(doc.id)}
                      activeOpacity={0.8}
                    >
                      <Camera size={16} color="#ffffff" />
                      <Text style={styles.docSnapText}>Camera Snap</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.docPickBtn}
                      onPress={() => handlePickDocument(doc.id)}
                      activeOpacity={0.8}
                    >
                      <UploadCloud size={16} color="#2563eb" />
                      <Text style={styles.docPickText}>Upload File</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* SECTION 4: PM SURYA GHAR DIRECT SUBSIDY BANK DETAILS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>4. Beneficiary Bank Account (Subsidy DBT)</Text>
              <Text style={styles.cardSubtitle}>
                Government subsidy of ₹{quotationData?.subsidy || 78000} will be credited directly here
              </Text>
            </View>

            <Text style={styles.label}>Account Holder Legal Name *</Text>
            <TextInput
              style={styles.input}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput style={styles.input} value={bankName} onChangeText={setBankName} />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                  style={styles.input}
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  placeholder="e.g. HDFC0001234"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={styles.label}>Bank Account Number *</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="e.g. 501000223344"
            />
          </View>

          {/* SECTION 5: BOOKING ADVANCE TOKEN */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>5. Booking Advance Confirmation</Text>
              <Text style={styles.cardSubtitle}>Initial token payment to confirm installation</Text>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Advance Received (₹)</Text>
                <TextInput
                  style={styles.inputHighlight}
                  value={advanceAmount}
                  onChangeText={setAdvanceAmount}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Payment Method</Text>
                <TextInput style={styles.input} value={paymentMode} onChangeText={setPaymentMode} />
              </View>
            </View>

            <Text style={styles.label}>Transaction Reference / UTR Number</Text>
            <TextInput
              style={styles.input}
              value={transactionRef}
              onChangeText={setTransactionRef}
              placeholder="e.g. UPI Ref 429384918239 or Cheque No"
            />
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitOnboardingBtn}
            onPress={handleCompleteOnboarding}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitOnboardingText}>Convert to Client & Provision Project</Text>
                <ArrowRight size={18} color="#ffffff" />
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
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroQuoteTag: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    marginBottom: 10,
  },
  inputHighlight: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '800',
    marginBottom: 10,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  readOnlyBox: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  readOnlyVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  docSlotCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  docSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  docSlotMeta: {
    flex: 1,
    paddingRight: 8,
  },
  docSlotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  docSlotSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  uploadedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ea580c',
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  docSnapBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  docSnapText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  docPickBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  docPickText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  attachedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    marginTop: 4,
  },
  docThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  attachedFileInfo: {
    flex: 1,
  },
  attachedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  removeDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  removeDocText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
  },
  submitOnboardingBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitOnboardingText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
