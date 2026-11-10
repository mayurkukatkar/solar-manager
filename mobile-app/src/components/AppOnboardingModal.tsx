import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  ShieldCheck,
  FileText,
  Compass,
  Camera,
  QrCode,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  Award,
} from 'lucide-react-native';
import { GuideCharacter, CharacterPose } from './GuideCharacter';
import { GridBackground } from './common/GridBackground';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { tourService, APP_ONBOARDING_STORAGE_KEY } from '../services/tourService';

export { APP_ONBOARDING_STORAGE_KEY };

export interface AppOnboardingModalProps {
  visible?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

interface OnboardingSlide {
  id: string;
  pose: CharacterPose;
  speech: string;
  badge: string;
  title: string;
  subtitle: string;
  features: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    title: string;
    desc: string;
  }[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    pose: 'wave',
    speech: 'Welcome to Solar OS!',
    badge: 'OFFICIAL FIELD COMPANION',
    title: 'Where Growth Gets Ready',
    subtitle: 'The unified Operating System for Solar EPCs, rooftop installers & field engineers.',
    features: [
      {
        icon: Zap,
        title: '100% Offline-First Architecture',
        desc: 'Survey and log installations at remote rooftop sites with zero network. Changes auto-sync when reconnected.',
      },
      {
        icon: Layers,
        title: 'End-to-End Solar Lifecycle',
        desc: 'From initial prospect inquiry and rapid quoting to DISCOM net-metering and handover.',
      },
      {
        icon: ShieldCheck,
        title: 'Enterprise Security & Compliance',
        desc: 'Tamper-proof QA logs, role-based security, and MNRE ALMM adherence at every job site.',
      },
    ],
  },
  {
    id: 'crm',
    pose: 'point-right',
    speech: 'Quotes in 60 seconds!',
    badge: 'SMART CRM & PROPOSALS',
    title: 'Roof-Ready Quotes in Seconds',
    subtitle: 'Calculate savings, generate branded PDF proposals, and capture signatures on the spot.',
    features: [
      {
        icon: Zap,
        title: 'Instant kW Capacity Sizing',
        desc: 'Input monthly electricity bill to automatically calculate optimal kW capacity and annual generation.',
      },
      {
        icon: FileText,
        title: 'Digital PDF Proposal Engine',
        desc: 'Generate professional proposals with component specs, financial ROI, and financing options.',
      },
      {
        icon: Send,
        title: 'One-Tap WhatsApp Delivery',
        desc: 'Send proposals and follow up directly with homeowners via WhatsApp in a single tap.',
      },
    ],
  },
  {
    id: 'survey',
    pose: 'inspect',
    speech: 'Precision engineering!',
    badge: 'SITE SURVEY & GEOMETRY',
    title: 'Precision Site Surveys',
    subtitle: 'Capture roof azimuth, tilt angles, shading obstacles, and single line diagrams.',
    features: [
      {
        icon: Compass,
        title: 'Azimuth Compass & Tilt Angles',
        desc: 'Measure optimal sunlight orientation to maximize peak solar kWh generation year-round.',
      },
      {
        icon: Camera,
        title: 'Obstacle & Shading Photo Proof',
        desc: 'Document parapets, water tanks, trees, and nearby structures casting shadow on PV arrays.',
      },
      {
        icon: ShieldCheck,
        title: 'DISCOM Point of Common Coupling',
        desc: 'Record service line phase, sanctioned load, and meter location for seamless liaisoning.',
      },
    ],
  },
  {
    id: 'operations',
    pose: 'guide',
    speech: 'Standardized QA!',
    badge: 'EPC MILESTONES & QA',
    title: 'Zero-Error Installation QA',
    subtitle: 'Follow stage-gate engineering milestones with mandatory photo proof and barcode tracking.',
    features: [
      {
        icon: Layers,
        title: 'Structured Engineering Stages',
        desc: 'Civil foundation -> Module mounting -> DC cabling & Inverters -> AC grid synchronization.',
      },
      {
        icon: QrCode,
        title: 'Camera Barcode Batch Scanning',
        desc: 'Scan module and inverter barcodes in seconds to trace serial numbers for warranty validation.',
      },
      {
        icon: Award,
        title: 'Mandatory QA Photo Checklists',
        desc: 'Prevent costly callbacks with mandatory photographic evidence before advancing milestones.',
      },
    ],
  },
  {
    id: 'commissioning',
    pose: 'celebrate',
    speech: 'Plant energized!',
    badge: 'COMMISSIONING & HANDOVER',
    title: 'Net-Metering & Energization',
    subtitle: 'Deliver GST milestone invoices, track PM Surya Ghar DBT subsidies, and hand over dossiers.',
    features: [
      {
        icon: CheckCircle2,
        title: 'DISCOM Net-Meter Liaisoning',
        desc: 'Attach test reports, CEIG clearances, and bi-directional meter installation certificates.',
      },
      {
        icon: FileText,
        title: 'GST-Compliant Milestone Invoicing',
        desc: 'Generate milestone and balance invoices with payment receipts, shareable via WhatsApp.',
      },
      {
        icon: Sparkles,
        title: 'Complete Project Dossier Handoff',
        desc: 'Export complete warranty certificates, system specifications, and handover manuals for clients.',
      },
    ],
  },
];

export const AppOnboardingModal: React.FC<AppOnboardingModalProps> = ({
  visible: propVisible,
  onClose,
  forceShow = false,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  // Auto-trigger ONLY for genuine first-time users if not completed yet
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
    const checkOnboardingState = async () => {
      try {
        const completed = await tourService.isTourCompleted(user?.id);
        if (!completed && isMounted) {
          setVisible(true);
        }
      } catch {
        // Fallback safely to not showing if error
      }
    };
    checkOnboardingState();

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
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIdx = activeIndex + 1;
      setActiveIndex(nextIdx);
      scrollRef.current?.scrollTo({ x: nextIdx * windowWidth, animated: true });
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      const prevIdx = activeIndex - 1;
      setActiveIndex(prevIdx);
      scrollRef.current?.scrollTo({ x: prevIdx * windowWidth, animated: true });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index !== activeIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={[styles.rootContainer, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
        {/* Engineering Square Grid Background */}
        <GridBackground isDark={isDark} />

        {/* TOP CONTROLS */}
        <View style={styles.topBar}>
          {/* Progress Indicators */}
          <View style={styles.paginationGroup}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setActiveIndex(idx);
                  scrollRef.current?.scrollTo({ x: idx * windowWidth, animated: true });
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.paginationDot,
                    idx === activeIndex
                      ? styles.paginationDotActive
                      : idx < activeIndex
                      ? styles.paginationDotVisited
                      : { backgroundColor: isDark ? colors.surfaceRecessed : '#E2E8F0' },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleDismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipBtnText}>Skip Tour</Text>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* HORIZONTAL SWIPEABLE SLIDES */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.carouselScrollView}
        >
          {ONBOARDING_SLIDES.map((slide, index) => {
            return (
              <View
                key={slide.id}
                style={[styles.slideContainer, { width: windowWidth }]}
              >
                <ScrollView
                  contentContainerStyle={styles.slideInnerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Sol Character Mascot */}
                  <View style={styles.mascotArea}>
                    <GuideCharacter
                      pose={slide.pose}
                      size={96}
                      speechText={slide.speech}
                      animated={true}
                    />
                  </View>

                  {/* Slide Title & Badge */}
                  <View style={styles.slideHeader}>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{slide.badge}</Text>
                    </View>
                    <Text style={[styles.slideTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                      {slide.title}
                    </Text>
                    <Text style={styles.slideSubtitle}>
                      {slide.subtitle}
                    </Text>
                  </View>

                  {/* Feature Highlights Cards */}
                  <View style={styles.featuresList}>
                    {slide.features.map((feat, fIdx) => {
                      const IconComponent = feat.icon;
                      return (
                        <View
                          key={fIdx}
                          style={[
                            styles.featureCard,
                            {
                              backgroundColor: isDark ? colors.surface : '#FFFFFF',
                              borderColor: isDark ? colors.border : '#E2E8F0',
                            },
                          ]}
                        >
                          <View style={styles.featureIconWrap}>
                            <IconComponent size={18} color="#2563EB" />
                          </View>
                          <View style={styles.featureTextWrap}>
                            <Text style={[styles.featureTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                              {feat.title}
                            </Text>
                            <Text style={styles.featureDesc}>{feat.desc}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>

        {/* BOTTOM NAVIGATION ACTIONS */}
        <View
          style={[
            styles.bottomBar,
            {
              borderTopColor: isDark ? colors.borderSubtle : '#F1F5F9',
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
            },
          ]}
        >
          {activeIndex > 0 ? (
            <TouchableOpacity
              style={[styles.navBackButton, { borderColor: isDark ? colors.border : '#E2E8F0' }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color="#64748B" />
              <Text style={styles.navBackButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}

          {/* Slide Indicator Text */}
          <Text style={styles.slideCountText}>
            {activeIndex + 1} of {ONBOARDING_SLIDES.length}
          </Text>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.navNextButton, isLastSlide && styles.navGetStartedButton]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.navNextButtonText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AppOnboardingModal;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
    paddingBottom: 12,
  },
  paginationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    height: 5,
    width: 22,
    borderRadius: 3,
  },
  paginationDotActive: {
    backgroundColor: '#2563EB',
    width: 36,
  },
  paginationDotVisited: {
    backgroundColor: '#93C5FD',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  carouselScrollView: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
  },
  slideInnerScroll: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  slideHeader: {
    alignItems: 'center',
    marginBottom: 18,
    maxWidth: 420,
  },
  badgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgePillText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
    paddingHorizontal: 14,
  },
  featuresList: {
    width: '100%',
    maxWidth: 440,
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  navBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  navBackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  slideCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  navGetStartedButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  navNextButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
