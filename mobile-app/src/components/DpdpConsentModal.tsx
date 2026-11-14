import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  CheckSquare,
  Square,
  Lock,
  UserCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  X,
  Phone,
  Mail,
  Building,
} from 'lucide-react-native';
import { dpdpApi } from '../api/endpoints';
import { offlineSyncService } from '../services/offlineSyncService';
import { useTheme } from '../theme';
import { haptics } from '../utils/haptics';

interface DpdpConsentModalProps {
  visible: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  dataPrincipalId: string;
  dataPrincipalType?: 'LEAD' | 'CUSTOMER';
  signatureSvg?: string;
  onConsentGranted: (consent: any) => void;
}

const STATUTORY_PURPOSES = [
  {
    code: 'FEASIBILITY_SIZING',
    title: '1. Solar Feasibility & Engineering Sizing',
    desc: 'Processing roof coordinates, shadow analysis, and historical electricity bills for system sizing.',
    isMandatory: true,
  },
  {
    code: 'DISCOM_NET_METERING',
    title: '2. DISCOM Net-Metering & Grid Synchronization',
    desc: 'Statutory submission of Work Completion Report (WCR) and testing data to state distribution utility (e.g., MSEDCL).',
    isMandatory: true,
  },
  {
    code: 'PM_SURYA_GHAR_DBT',
    title: '3. PM Surya Ghar DBT Central Subsidy Claim',
    desc: 'Transmitting verified consumer number and bank details to MNRE National Portal for direct subsidy disbursement.',
    isMandatory: true,
  },
  {
    code: 'CONTRACT_INVOICING',
    title: '4. Turnkey Solar EPC Agreement & GST Invoicing',
    desc: 'Digital issuance of the turnkey solar agreement and statutory tax invoices under Section 36 of CGST Act 2017.',
    isMandatory: true,
  },
  {
    code: 'COMMUNICATION_UPDATES',
    title: '5. Milestone Tracking & Dispatch Alerts (WhatsApp/SMS)',
    desc: 'Automated milestone progress updates, meter inspection appointments, and generation notifications.',
    isMandatory: false,
  },
  {
    code: 'FINANCING_LOAN',
    title: '6. Green Solar Loan Appraisal (Optional)',
    desc: 'Transmitting quotation and basic KYC to accredited solar lending partner banks if loan financing is opted.',
    isMandatory: false,
  },
];

export const DpdpConsentModal: React.FC<DpdpConsentModalProps> = ({
  visible,
  onClose,
  customerName,
  customerPhone,
  customerEmail,
  dataPrincipalId,
  dataPrincipalType = 'LEAD',
  signatureSvg,
  onConsentGranted,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([
    'FEASIBILITY_SIZING',
    'DISCOM_NET_METERING',
    'PM_SURYA_GHAR_DBT',
    'CONTRACT_INVOICING',
    'COMMUNICATION_UPDATES',
  ]);
  const [submitting, setSubmitting] = useState(false);

  const togglePurpose = (code: string, isMandatory: boolean) => {
    haptics.impactLight();
    if (isMandatory) {
      Alert.alert(
        'Statutory Prerequisite',
        'This operational purpose is required by DISCOM and the PM Surya Ghar National Portal to connect the solar system and claim the subsidy.'
      );
      return;
    }
    setSelectedPurposes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAffirmativeConsent = async () => {
    if (selectedPurposes.length === 0) {
      Alert.alert('Consent Required', 'Please select at least one purpose to proceed with solar onboarding.');
      return;
    }

    setSubmitting(true);
    haptics.notificationSuccess();

    const consentPayload = {
      dataPrincipalId,
      dataPrincipalType,
      dataPrincipalName: customerName.trim(),
      dataPrincipalPhone: customerPhone.trim(),
      dataPrincipalEmail: customerEmail?.trim() || undefined,
      purposes: selectedPurposes,
      signatureSvg: signatureSvg || undefined,
      capturedVia: '1FLOW_MOBILE',
      noticeVersion: '2026.1',
      noticeLanguage: 'en',
    };

    try {
      const res = await dpdpApi.recordConsent(consentPayload);
      onConsentGranted(res.consent || consentPayload);
      onClose();
    } catch (err: any) {
      console.warn('DPDP consent cloud record notice, enqueuing offline:', err.message);
      // Seamless offline persistence under DPDP verifiable capture
      await offlineSyncService
        .enqueueMutation('RECORD_DPDP_CONSENT', consentPayload)
        .catch(() => {});
      onConsentGranted({
        ...consentPayload,
        status: 'ACTIVE',
        isOfflineQueued: true,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.shieldBadge}>
                <ShieldCheck size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  DPDP Act 2023 Statutory Consent
                </Text>
                <Text style={styles.subtitle}>
                  Republic of India Act No. 22 of 2023 • Digital Privacy Notice
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* DATA PRINCIPAL CARD */}
            <View style={[styles.principalCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4' }]}>
              <UserCheck size={18} color="#059669" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.principalName, { color: colors.text }]}>
                  Data Principal: {customerName || 'Solar Client'}
                </Text>
                <Text style={[styles.principalContact, { color: colors.textSecondary }]}>
                  {customerPhone} {customerEmail ? `• ${customerEmail}` : ''}
                </Text>
              </View>
            </View>

            {/* NOTICE PARAGRAPH */}
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              In accordance with Section 5 of the Digital Personal Data Protection Act, 2023, your personal data (electricity consumer number, rooftop coordinates, bank details for DBT, and identity proofs) is collected solely for the execution of your rooftop solar installation and government subsidy disbursement.
            </Text>

            {/* AADHAAR MASKING GUARANTEE */}
            <View style={[styles.maskingCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
              <Lock size={16} color="#0284c7" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.maskingTitle, { color: '#0284c7' }]}>
                  UIDAI Aadhaar Data Masking Guarantee
                </Text>
                <Text style={[styles.maskingText, { color: colors.textSecondary }]}>
                  In compliance with UIDAI regulations, the first 8 digits of your Aadhaar card are strictly redacted (XXXX-XXXX-1234). Raw unmasked numbers are never stored.
                </Text>
              </View>
            </View>

            {/* PURPOSE SELECTION */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Itemized Processing Purposes (Section 6 DPDP)
            </Text>

            {STATUTORY_PURPOSES.map((p) => {
              const isChecked = selectedPurposes.includes(p.code);
              return (
                <TouchableOpacity
                  key={p.code}
                  style={[
                    styles.purposeRow,
                    {
                      backgroundColor: isChecked
                        ? isDark ? '#13281e' : '#f0fdf4'
                        : isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isChecked ? '#10b981' : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => togglePurpose(p.code, p.isMandatory)}
                  activeOpacity={0.7}
                >
                  <View style={{ marginRight: 10, marginTop: 2 }}>
                    {isChecked ? (
                      <CheckSquare size={18} color="#059669" />
                    ) : (
                      <Square size={18} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.purposeHeaderLine}>
                      <Text style={[styles.purposeTitle, { color: colors.text }]}>
                        {p.title}
                      </Text>
                      {p.isMandatory && (
                        <View style={styles.mandatoryBadge}>
                          <Text style={styles.mandatoryBadgeText}>STATUTORY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.purposeDesc, { color: colors.textSecondary }]}>
                      {p.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* DATA PRINCIPAL RIGHTS SUMMARY */}
            <View style={[styles.rightsBox, { borderColor: colors.borderSubtle }]}>
              <Text style={[styles.rightsTitle, { color: colors.text }]}>
                Your Statutory Rights (Sections 11 - 14):
              </Text>
              <Text style={[styles.rightItem, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '700' }}>Right to Access (Sec 11):</Text> Request full inventory of personal data held anytime.
              </Text>
              <Text style={[styles.rightItem, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '700' }}>Right to Correction (Sec 12):</Text> Rectify outdated details instantly.
              </Text>
              <Text style={[styles.rightItem, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '700' }}>Right to Withdraw (Sec 6(4)):</Text> Revoke consent with equal ease.
              </Text>
              <Text style={[styles.rightItem, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '700' }}>Grievance Redressal (Sec 13):</Text> 30-day statutory SLA with designated Grievance Officer.
              </Text>
            </View>

            {/* DPO CONTACT INFO */}
            <View style={[styles.dpoCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
              <Text style={[styles.dpoHeader, { color: colors.text }]}>
                Data Protection & Grievance Officer:
              </Text>
              <View style={styles.dpoContactRow}>
                <Mail size={12} color="#059669" style={{ marginRight: 6 }} />
                <Text style={[styles.dpoText, { color: colors.textSecondary }]}>
                  privacy@solarerp.com
                </Text>
              </View>
              <View style={styles.dpoContactRow}>
                <Phone size={12} color="#059669" style={{ marginRight: 6 }} />
                <Text style={[styles.dpoText, { color: colors.textSecondary }]}>
                  +91-1800-SOLAR-GOV (Toll Free)
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ACTION BUTTON */}
          <View style={styles.footerWrap}>
            <TouchableOpacity
              style={styles.affirmativeBtn}
              onPress={handleAffirmativeConsent}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.affirmativeBtnText}>
                    I Affirmatively Agree & Seal DPDP Consent
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  scrollArea: {
    marginTop: 12,
  },
  principalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  principalName: {
    fontSize: 13,
    fontWeight: '700',
  },
  principalContact: {
    fontSize: 11,
    marginTop: 1,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  maskingCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  maskingTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  maskingText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 4,
  },
  purposeRow: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  purposeHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  purposeTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  mandatoryBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  mandatoryBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  purposeDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  rightsBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  rightsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  rightItem: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  dpoCard: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  dpoHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  dpoContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dpoText: {
    fontSize: 11,
  },
  footerWrap: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  affirmativeBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  affirmativeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

