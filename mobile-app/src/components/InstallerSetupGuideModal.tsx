import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Compass,
  QrCode,
  ShieldCheck,
  Zap,
  Camera,
  FileText,
  Sparkles,
} from 'lucide-react-native';
import { GuideCharacter, CharacterPose } from './GuideCharacter';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { tourService, INSTALLER_GUIDE_STORAGE_KEY } from '../services/tourService';

const STORAGE_GUIDE_KEY = INSTALLER_GUIDE_STORAGE_KEY;

export interface InstallerSetupGuideModalProps {
  visible?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

interface GuideStep {
  pose: CharacterPose;
  speech: string;
  badge: string;
  title: string;
  subtitle: string;
  highlights: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    title: string;
    desc: string;
  }[];
}

const STEPS: GuideStep[] = [
  {
    pose: 'wave',
    speech: 'Welcome, Installer!',
    badge: 'GETTING STARTED',
    title: 'Your EPC Field Companion',
    subtitle: 'WhereReady Solar OS is engineered for rooftop and ground-mount solar operations.',
    highlights: [
      {
        icon: Zap,
        title: 'Offline-First Reliability',
        desc: 'Log surveys and installations at remote job sites with zero network. Everything auto-syncs when reconnected.',
      },
      {
        icon: QrCode,
        title: 'Instant Hardware Verification',
        desc: 'Scan module and inverter barcodes to trace serial numbers and prevent warranty discrepancies.',
      },
      {
        icon: ShieldCheck,
        title: 'End-to-End Traceability',
        desc: 'From initial prospect survey to final DISCOM net-meter energization in one pocket app.',
      },
    ],
  },
  {
    pose: 'inspect',
    speech: 'Precision is key!',
    badge: 'STEP 1: SITE SURVEY',
    title: 'Site Surveys & Roof Geometry',
    subtitle: 'Capture accurate roof measurements, azimuth orientation, and electrical parameters.',
    highlights: [
      {
        icon: Compass,
        title: 'Azimuth & Tilt Measurement',
        desc: 'Determine optimum sunlight angle and structural positioning for highest kWh generation.',
      },
      {
        icon: Camera,
        title: 'Obstacle & Shading Photos',
        desc: 'Photograph parapets, water tanks, trees, and nearby structures that cast solar shadow.',
      },
      {
        icon: FileText,
        title: 'DISCOM Connection Point',
        desc: 'Record service line phase, sanctioned load, and meter location for seamless liaisoning.',
      },
    ],
  },
  {
    pose: 'guide',
    speech: 'Standardized QA!',
    badge: 'STEP 2: EPC INSTALLATION',
    title: 'Milestone Execution & QA',
    subtitle: 'Follow structured installation stages with mandatory proof for every milestone.',
    highlights: [
      {
        icon: Zap,
        title: 'Civil & Structure Anchoring',
        desc: 'Verify ballast, chemical grouting, and torque specs for high wind speed stability.',
      },
      {
        icon: Camera,
        title: 'DC Cabling & Inverter Mounting',
        desc: 'Upload cable management and conduit photos before moving to the next phase.',
      },
      {
        icon: QrCode,
        title: 'Barcode Batch Scan',
        desc: 'Rapidly scan all solar PV module serials directly with your phone camera in seconds.',
      },
    ],
  },
  {
    pose: 'celebrate',
    speech: 'Ready to energize!',
    badge: 'STEP 3: COMMISSIONING',
    title: 'DISCOM Net-Metering & Handover',
    subtitle: 'Energize the solar power plant, create invoices, and deliver the Project Dossier.',
    highlights: [
      {
        icon: CheckCircle2,
        title: 'DISCOM Inspection Sign-off',
        desc: 'Attach test reports, CEIG clearances, and bi-directional meter installation documents.',
      },
      {
        icon: FileText,
        title: 'Instant PDF Invoicing',
        desc: 'Generate GST-compliant milestone invoices and share them via WhatsApp in one tap.',
      },
      {
        icon: Sparkles,
        title: 'Client Dossier Handoff',
        desc: 'Deliver warranty certificates, system specifications, and handover manuals to the customer.',
      },
    ],
  },
];

export const InstallerSetupGuideModal: React.FC<InstallerSetupGuideModalProps> = ({
  visible: propVisible,
  onClose,
  forceShow = false,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [visible, setVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Auto-trigger on first install if not completed yet
  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }

    if (propVisible !== undefined) {
      setVisible(propVisible);
      return;
    }

    let isMounted = true;
    const checkFirstTime = async () => {
      try {
        const completed = await tourService.isTourCompleted(user?.id);
        if (!completed && isMounted) {
          setVisible(true);
        }
      } catch {
        // Fallback safely
      }
    };
    checkFirstTime();

    return () => {
      isMounted = false;
    };
  }, [propVisible, forceShow, user?.id]);

  const handleDismiss = async () => {
    try {
      await tourService.markTourCompleted(user?.id);
    } catch {
      // Ignore
    }
    setVisible(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(15, 23, 42, 0.72)' }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          {/* Top Bar with Step Indicators & Close Button */}
          <View style={styles.topHeader}>
            <View style={styles.stepPillGroup}>
              {STEPS.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.stepDot,
                    idx === currentStepIndex
                      ? styles.stepDotActive
                      : idx < currentStepIndex
                      ? styles.stepDotCompleted
                      : { backgroundColor: isDark ? colors.surfaceRecessed : '#E2E8F0' },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Sol Character in Pose */}
            <View style={styles.mascotContainer}>
              <GuideCharacter
                pose={currentStep.pose}
                size={86}
                speechText={currentStep.speech}
                animated={true}
              />
            </View>

            {/* Step Header */}
            <View style={styles.textHeader}>
              <View style={styles.badgeWrapper}>
                <Text style={styles.badgeText}>{currentStep.badge}</Text>
              </View>
              <Text style={[styles.title, { color: isDark ? colors.text : '#0F172A' }]}>
                {currentStep.title}
              </Text>
              <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
            </View>

            {/* Feature Highlights */}
            <View style={styles.highlightsList}>
              {currentStep.highlights.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.highlightCard,
                      {
                        backgroundColor: isDark ? colors.surfaceRecessed : '#F8FAFC',
                        borderColor: isDark ? colors.border : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <IconComponent size={16} color="#2563EB" />
                    </View>
                    <View style={styles.highlightTextGroup}>
                      <Text style={[styles.highlightTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                        {item.title}
                      </Text>
                      <Text style={styles.highlightDesc}>{item.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Navigation Footer */}
          <View
            style={[
              styles.footerActions,
              {
                borderTopColor: isDark ? colors.borderSubtle : '#F1F5F9',
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
              },
            ]}
          >
            {currentStepIndex > 0 ? (
              <TouchableOpacity
                style={[styles.backButton, { borderColor: isDark ? colors.border : '#E2E8F0' }]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#64748B" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip Tour</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, isLastStep && styles.completeButton]}
              onPress={handleNext}
              activeOpacity={0.88}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Ready to Install!' : 'Continue'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InstallerSetupGuideModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  stepPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    height: 4,
    width: 22,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: '#2563EB',
    width: 32,
  },
  stepDotCompleted: {
    backgroundColor: '#93C5FD',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  textHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeWrapper: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  highlightsList: {
    gap: 10,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  highlightTextGroup: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  highlightDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  completeButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

