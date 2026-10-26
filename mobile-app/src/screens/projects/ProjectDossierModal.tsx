import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  Zap,
  Camera,
  Image as ImageIcon,
  Share2,
  FolderLock,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { documentsApi } from '../../api/endpoints';
import { apiClient } from '../../api/client';
import { ModalHeader } from '../../components/Header';
import { colors } from '../../theme/colors';

interface ProjectDossierModalProps {
  visible: boolean;
  project: any;
  onClose: () => void;
  onRefreshProject?: () => void;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Files' },
  { id: 'KYC', label: 'KYC & DBT' },
  { id: 'DISCOM', label: 'DISCOM Liaison' },
  { id: 'PHOTOS', label: 'Site Photos' },
  { id: 'COMMISSIONING', label: 'WCR & Warranty' },
];

const PRESET_CATEGORIES = [
  'Customer KYC',
  'Electricity / DISCOM',
  'Bank Cheque / Passbook (DBT)',
  'Property / Index II',
  'Single Line Diagram (SLD)',
  'Rooftop Survey Photos',
  'Net Metering Application',
  'Subsidy Claim (DBT)',
  'Work Completion Report (WCR)',
  'Other',
];

export const ProjectDossierModal: React.FC<ProjectDossierModalProps> = ({
  visible,
  project,
  onClose,
  onRefreshProject,
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Upload State
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Customer KYC');
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible && project) {
      loadProjectDocuments();
    }
  }, [visible, project]);

  const loadProjectDocuments = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const res = await documentsApi.getDocuments({ projectId: project.id });
      if (Array.isArray(res)) {
        setDocuments(res);
      } else if (Array.isArray(res?.documents)) {
        setDocuments(res.documents);
      } else if (Array.isArray(project.Document)) {
        setDocuments(project.Document);
      }
    } catch (err: any) {
      console.warn('Documents fetch note:', err.message);
      if (Array.isArray(project.Document)) {
        setDocuments(project.Document);
      }
    } finally {
      setLoading(false);
    }
  };

  // PM Surya Ghar Readiness Calculations
  const hasBill = documents.some(
    (d) => (d.title || '').toLowerCase().includes('bill') || d.category === 'Electricity / DISCOM'
  );
  const hasKyc = documents.some(
    (d) =>
      (d.title || '').toLowerCase().includes('aadhaar') ||
      (d.title || '').toLowerCase().includes('pan') ||
      d.category === 'Customer KYC'
  );
  const hasBank = documents.some(
    (d) =>
      (d.title || '').toLowerCase().includes('cheque') ||
      (d.title || '').toLowerCase().includes('passbook') ||
      (d.title || '').toLowerCase().includes('bank') ||
      d.category === 'Bank Cheque / Passbook (DBT)'
  );
  const hasPhotos = documents.some(
    (d) =>
      (d.title || '').toLowerCase().includes('photo') ||
      (d.title || '').toLowerCase().includes('roof') ||
      (d.title || '').toLowerCase().includes('site') ||
      d.category === 'Rooftop Survey Photos'
  );

  let readinessScore = 0;
  if (hasBill) readinessScore += 30;
  if (hasKyc) readinessScore += 25;
  if (hasBank) readinessScore += 25;
  if (hasPhotos) readinessScore += 20;

  const missingChecklist: string[] = [];
  if (!hasBill) missingChecklist.push('Electricity Bill (DISCOM)');
  if (!hasKyc) missingChecklist.push('Aadhaar / PAN Card');
  if (!hasBank) missingChecklist.push('Bank Cheque / Passbook (DBT)');
  if (!hasPhotos) missingChecklist.push('Rooftop Survey Photos');

  const openDocumentUrl = async (rawUrl?: string | null) => {
    if (!rawUrl) return;
    let finalUrl = rawUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      const base = apiClient.defaults.baseURL || 'http://localhost:5000';
      finalUrl = `${base.replace(/\/+$/, '')}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
    }
    try {
      await Linking.openURL(finalUrl);
    } catch {
      Alert.alert('Cannot Open Document', 'Unable to open document file: ' + finalUrl);
    }
  };

  const handleVerifyDoc = async (docId: string) => {
    try {
      await documentsApi.verifyDocument(docId);
      Alert.alert('Document Approved', 'This document is now verified in the central solar vault.');
      loadProjectDocuments();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      Alert.alert('Verification Note', err.message || 'Failed to update document status');
    }
  };

  const handleWhatsAppNudge = () => {
    const phone = project.customer?.mobile || project.customer?.phone;
    if (!phone) {
      Alert.alert('No Customer Phone', 'Please add a mobile number to this client to send WhatsApp updates.');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '');
    const target = clean.length === 10 ? `91${clean}` : clean;

    const missingStr = missingChecklist.length > 0 ? missingChecklist.join(', ') : 'required files';
    const message = encodeURIComponent(
      `*Namaste ${project.customer?.name || 'Customer'}*,\n\n` +
      `Regarding your Solar Project (*${project.projectNumber || project.name}*):\n\n` +
      `To process your *PM Surya Ghar ₹78,000 DBT Subsidy* and DISCOM Net Metering without delay, we need:\n` +
      `👉 *${missingStr}*\n\n` +
      `Kindly share photo/PDF here on WhatsApp so our field team can complete your sanction.\n\n` +
      `_Best regards,_\n*Solar Operations Team*`
    );

    Linking.openURL(`whatsapp://send?phone=${target}&text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/${target}?text=${message}`);
    });
  };

  // Upload Actions
  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is needed to snap document photos.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPickedFile({
          uri: res.assets[0].uri,
          name: `Site_Photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        if (!uploadTitle) setUploadTitle(`Photo - ${uploadCategory}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not access camera');
    }
  };

  const handlePickGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is needed to select documents.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPickedFile({
          uri: res.assets[0].uri,
          name: res.assets[0].fileName || `Document_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        if (!uploadTitle) setUploadTitle(res.assets[0].fileName?.replace(/\.[^/.]+$/, '') || `Doc - ${uploadCategory}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick image');
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const item = res.assets[0];
        const isPdf = item.name.toLowerCase().endsWith('.pdf');
        setPickedFile({
          uri: item.uri,
          name: item.name,
          type: isPdf ? 'application/pdf' : 'image/jpeg',
        });
        if (!uploadTitle) setUploadTitle(item.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick document');
    }
  };

  const handleSubmitUpload = async () => {
    if (!pickedFile && !uploadTitle) {
      Alert.alert('Input Needed', 'Please take/pick a file or enter a document title.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (pickedFile) {
        formData.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.type,
        } as any);
      }
      formData.append('title', uploadTitle || pickedFile?.name || 'Solar Document');
      formData.append('category', uploadCategory);
      formData.append('projectId', project.id);
      formData.append('entityType', 'PROJECT');
      formData.append('entityId', project.id);
      if (project.customer?.id || project.customerId) {
        formData.append('customerId', project.customer?.id || project.customerId);
      }

      await documentsApi.uploadDocument(formData);
      Alert.alert('Success', 'Document securely uploaded to the private vault.');
      setShowUploadSheet(false);
      setPickedFile(null);
      setUploadTitle('');
      loadProjectDocuments();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not save document to Supabase.');
    } finally {
      setUploading(false);
    }
  };

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    if (activeTab === 'ALL') return true;
    const cat = (doc.category || '').toUpperCase();
    const title = (doc.title || '').toUpperCase();

    if (activeTab === 'KYC') {
      return cat.includes('KYC') || cat.includes('CHEQUE') || cat.includes('PROPERTY') || title.includes('AADHAAR') || title.includes('PAN') || title.includes('PASSBOOK');
    }
    if (activeTab === 'DISCOM') {
      return cat.includes('DISCOM') || cat.includes('ELECTRICITY') || cat.includes('NET') || title.includes('BILL') || title.includes('SANCTION') || title.includes('A1');
    }
    if (activeTab === 'PHOTOS') {
      return cat.includes('PHOTO') || cat.includes('SURVEY') || title.includes('PHOTO') || title.includes('ROOF');
    }
    if (activeTab === 'COMMISSIONING') {
      return cat.includes('COMMISSIONING') || cat.includes('WARRANTY') || cat.includes('WCR') || title.includes('WCR') || title.includes('HANDOVER');
    }
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* STANDARDIZED MODAL HEADER */}
        <ModalHeader
          title={project?.name || 'Project Dossier'}
          subtitle={`👤 ${project?.customer?.name || 'Client'} • ⚡ ${project?.capacity || 3.3} kWp`}
          onClose={onClose}
          rightAction={
            <View style={styles.vaultBadge}>
              <FolderLock size={11} color="#059669" />
              <Text style={styles.vaultBadgeText}>{project?.projectNumber || 'Vault'}</Text>
            </View>
          }
        />

        {/* SUBSIDY & READINESS SCORECARD */}
        <View style={styles.scorecardContainer}>
          <View style={styles.scorecardTopRow}>
            <View style={styles.scorecardLabelCol}>
              <View style={styles.shieldRow}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={styles.scorecardTitle}>PM Surya Ghar DBT Readiness</Text>
              </View>
              <Text style={styles.scorecardSub}>
                {readinessScore === 100
                  ? 'All essential government subsidy documents verified.'
                  : `${missingChecklist.length} essential document(s) pending for ₹78k DBT claim.`}
              </Text>
            </View>
            <View
              style={[
                styles.scoreBadge,
                readinessScore >= 80 ? styles.scoreGreen : readinessScore >= 50 ? styles.scoreAmber : styles.scoreRed,
              ]}
            >
              <Text
                style={[
                  styles.scoreBadgeText,
                  readinessScore >= 80
                    ? styles.scoreGreenText
                    : readinessScore >= 50
                    ? styles.scoreAmberText
                    : styles.scoreRedText,
                ]}
              >
                {readinessScore}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${readinessScore}%`,
                  backgroundColor:
                    readinessScore >= 80 ? '#10b981' : readinessScore >= 50 ? '#f59e0b' : '#ef4444',
                },
              ]}
            />
          </View>

          {/* Missing Checklist Alert & WhatsApp Button */}
          {missingChecklist.length > 0 && (
            <View style={styles.missingAlertBox}>
              <View style={styles.missingTextCol}>
                <Text style={styles.missingTitle}>⚠️ Pending Submission:</Text>
                <Text style={styles.missingItemsText}>{missingChecklist.join(' • ')}</Text>
              </View>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={handleWhatsAppNudge}
                activeOpacity={0.8}
              >
                <MessageCircle size={13} color="#ffffff" />
                <Text style={styles.nudgeBtnText}>Nudge Client</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CATEGORY TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {CATEGORY_TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  onPress={() => setActiveTab(t.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* DOCUMENTS LIST */}
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Loading Project Vault Files...</Text>
            </View>
          ) : filteredDocs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileText size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Documents in this Category</Text>
              <Text style={styles.emptySub}>
                Tap the "+ Upload Document" button below to attach photos, bills or engineering drawings directly to this installation.
              </Text>
            </View>
          ) : (
            filteredDocs.map((doc) => {
              const isVerified = doc.status === 'VERIFIED';
              return (
                <View key={doc.id} style={styles.docCard}>
                  <View style={styles.docCardTop}>
                    <View style={styles.docIconCircle}>
                      <FileText size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle} numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text style={styles.docCategory}>
                        {doc.category || 'Customer KYC'} • {new Date(doc.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        isVerified ? styles.statusVerified : styles.statusPending,
                      ]}
                    >
                      {isVerified ? (
                        <CheckCircle2 size={11} color="#059669" />
                      ) : (
                        <Clock size={11} color="#d97706" />
                      )}
                      <Text
                        style={[
                          styles.statusTagText,
                          isVerified ? styles.statusVerifiedText : styles.statusPendingText,
                        ]}
                      >
                        {isVerified ? 'Verified' : 'Under Review'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.docActionsRow}>
                    {doc.fileUrl && (
                      <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={() => openDocumentUrl(doc.fileUrl)}
                        activeOpacity={0.7}
                      >
                        <ExternalLink size={13} color="#2563eb" />
                        <Text style={styles.actionBtnSecondaryText}>View File</Text>
                      </TouchableOpacity>
                    )}

                    {!isVerified && (
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleVerifyDoc(doc.id)}
                        activeOpacity={0.7}
                      >
                        <Check size={13} color="#059669" />
                        <Text style={styles.actionBtnPrimaryText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={styles.uploadCtaBtn}
            onPress={() => setShowUploadSheet(true)}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#ffffff" />
            <Text style={styles.uploadCtaText}>+ Upload New Document</Text>
          </TouchableOpacity>
        </View>

        {/* UPLOAD MODAL TRAY */}
        <Modal
          visible={showUploadSheet}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowUploadSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Upload to Solar Vault</Text>
                  <Text style={styles.sheetSub}>
                    Encrypted direct storage for {project?.projectNumber || project?.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowUploadSheet(false)}
                  style={styles.closeBtn}
                >
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* File Picker Methods */}
                <Text style={styles.inputLabel}>CHOOSE FILE SOURCE</Text>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={[styles.pickerBox, pickedFile?.type.includes('image') && styles.pickerBoxActive]}
                    onPress={handleLaunchCamera}
                    activeOpacity={0.7}
                  >
                    <Camera size={22} color="#059669" />
                    <Text style={styles.pickerBoxText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={handlePickGallery}
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={22} color="#2563eb" />
                    <Text style={styles.pickerBoxText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={handlePickDocument}
                    activeOpacity={0.7}
                  >
                    <FileText size={22} color="#7c3aed" />
                    <Text style={styles.pickerBoxText}>PDF File</Text>
                  </TouchableOpacity>
                </View>

                {pickedFile && (
                  <View style={styles.pickedFileBadge}>
                    <CheckCircle2 size={14} color="#059669" />
                    <Text style={styles.pickedFileText} numberOfLines={1}>
                      {pickedFile.name}
                    </Text>
                  </View>
                )}

                {/* Document Title */}
                <Text style={styles.inputLabel}>DOCUMENT TITLE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="E.g. Electricity Bill Oct 2026"
                  placeholderTextColor="#94a3b8"
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                />

                {/* Category Preset Picker */}
                <Text style={styles.inputLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {PRESET_CATEGORIES.map((c) => {
                    const isSel = uploadCategory === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.categoryPresetChip, isSel && styles.categoryPresetChipActive]}
                        onPress={() => setUploadCategory(c)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryPresetChipText,
                            isSel && styles.categoryPresetChipTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </ScrollView>

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.submitUploadBtn, (!pickedFile && !uploadTitle) && styles.submitUploadBtnDisabled]}
                onPress={handleSubmitUpload}
                disabled={uploading || (!pickedFile && !uploadTitle)}
                activeOpacity={0.85}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <UploadCloud size={16} color="#ffffff" />
                    <Text style={styles.submitUploadText}>Save to Supabase Vault</Text>
                  </>
                )}
              </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  projectNumberBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SCORECARD
  scorecardContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  scorecardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scorecardLabelCol: {
    flex: 1,
    paddingRight: 12,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scorecardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  scorecardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  scoreGreen: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  scoreGreenText: {
    color: '#059669',
  },
  scoreAmber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  scoreAmberText: {
    color: '#d97706',
  },
  scoreRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  scoreRedText: {
    color: '#dc2626',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  missingAlertBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  missingTextCol: {
    flex: 1,
  },
  missingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  missingItemsText: {
    fontSize: 10,
    color: '#b45309',
    marginTop: 1,
  },
  nudgeBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nudgeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },

  // TABS
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabChipActive: {
    backgroundColor: '#059669',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabChipTextActive: {
    color: '#ffffff',
  },

  // LIST
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  centerContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  // DOC CARD
  docCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  docCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusVerified: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusVerifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  docActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // FOOTER
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  uploadCtaBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  uploadCtaText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  // UPLOAD SHEET
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  sheetSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pickerBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  pickerBoxActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  pickerBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  pickedFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  pickedFileText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    flex: 1,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 14,
  },
  categoryPresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  categoryPresetChipActive: {
    backgroundColor: '#059669',
  },
  categoryPresetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  categoryPresetChipTextActive: {
    color: '#ffffff',
  },
  submitUploadBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  submitUploadBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitUploadText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
