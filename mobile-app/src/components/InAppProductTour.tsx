import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  X,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Briefcase,
  Receipt,
  Search,
  Wifi,
  Zap,
  User,
  Building,
  Sparkles,
  Phone,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { GuideCharacter, CharacterPose } from './GuideCharacter';
import { useTheme } from '../theme';

export interface InAppProductTourProps {
  visible: boolean;
  onClose: () => void;
  initialStepIndex?: number;
}

export interface ButtonTourStep {
  id: string;
  pose: CharacterPose;
  speech: string;
  badge: string;
  locationTag: string;
  buttonName: string;
  whatItDoes: string;
  detailedAction: string;
  proTip: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  previewType:
    | 'brand'
    | 'sync'
    | 'search'
    | 'sol'
    | 'avatar'
    | 'quote'
    | 'tab-dashboard'
    | 'tab-pipeline'
    | 'tab-plus'
    | 'tab-projects'
    | 'tab-finance';
}

export const BUTTON_TOUR_STEPS: ButtonTourStep[] = [
  {
    id: 'brand',
    pose: 'wave',
    speech: 'Welcome to Solar OS!',
    badge: 'BUTTON 1 OF 11',
    locationTag: '📍 Top Left Header',
    buttonName: 'WhereReady Solar OS Brand Badge',
    whatItDoes: 'Returns directly to the primary operational radar from any sub-screen.',
    detailedAction: 'Tapping the brand badge instantly resets any search filters, returns you to your home radar, and refreshes today’s live fleet generation and appointment feeds.',
    proTip: 'Quickly recover back to home whenever you are deep inside multi-level lead or project workflows.',
    icon: Building,
    previewType: 'brand',
  },
  {
    id: 'sync',
    pose: 'inspect',
    speech: 'Zero data loss on roof!',
    badge: 'BUTTON 2 OF 11',
    locationTag: '📍 Top Header • Status Pill',
    buttonName: 'Live / Offline Cloud Sync Pill',
    whatItDoes: 'Monitors real-time server connectivity and pending offline submissions.',
    detailedAction: 'Shows whether the app is connected to the cloud ("Live") or running locally ("Offline"). When offline, any leads, barcode scans, surveys, or invoices are queued safely on your phone and auto-sync the second you regain cell reception.',
    proTip: 'Tap this pill anytime to inspect queued offline operations or force an immediate cloud sync.',
    icon: Wifi,
    previewType: 'sync',
  },
  {
    id: 'search',
    pose: 'point-right',
    speech: 'Find any lead or panel!',
    badge: 'BUTTON 3 OF 11',
    locationTag: '📍 Top Header • Action Strip',
    buttonName: 'Global Instant Search Button',
    whatItDoes: 'Opens universal multi-index search across the entire solar organization.',
    detailedAction: 'Searches simultaneously across customer names, contact phone numbers, DISCOM electricity consumer numbers, and scanned solar panel serial barcodes in real-time.',
    proTip: 'Works completely offline with local cache so you can look up a customer file on a rooftop without internet.',
    icon: Search,
    previewType: 'search',
  },
  {
    id: 'sol',
    pose: 'celebrate',
    speech: 'I am your solar companion!',
    badge: 'BUTTON 4 OF 11',
    locationTag: '📍 Top Header • Mascot Button',
    buttonName: 'Sol AI Guide & Ambassador Button',
    whatItDoes: 'Your 24/7 solar engineer companion for walkthroughs and statutory rules.',
    detailedAction: 'Tapping my avatar launches this interactive button walkthrough, explains PM Surya Ghar subsidy DBT calculations, and provides technical guidance on DISCOM net-metering regulations.',
    proTip: 'Look for me on different screens—I change poses and give contextual pro-tips tailored to what you are doing!',
    icon: Sparkles,
    previewType: 'sol',
  },
  {
    id: 'avatar',
    pose: 'guide',
    speech: 'Manage your profile & theme!',
    badge: 'BUTTON 5 OF 11',
    locationTag: '📍 Top Header • Far Right',
    buttonName: 'User Profile & Settings Avatar',
    whatItDoes: 'Opens account preferences, Dark/Light theme toggle, and DISCOM settings.',
    detailedAction: 'Displays your assigned engineering role and RBAC security tier, allows one-tap switching between Dark Mode and Light Mode, and lets you manage DISCOM contractor registrations and log out safely.',
    proTip: 'Toggle Dark Mode when working outdoors in high solar glare to improve contrast and conserve battery.',
    icon: User,
    previewType: 'avatar',
  },
  {
    id: 'quote',
    pose: 'point-right',
    speech: 'Quote deals in 60 seconds!',
    badge: 'BUTTON 6 OF 11',
    locationTag: '📍 Dashboard • Quick Action',
    buttonName: '60s Solar Quote Calculator Button',
    whatItDoes: 'Calculates recommended kW sizing, PM Surya Ghar subsidy & turnkey pricing.',
    detailedAction: 'Enter the customer’s monthly electric bill, and the algorithm automatically computes ideal solar kW capacity, the statutory ₹78,000 DBT subsidy under PM Surya Ghar, estimated 25-year savings, and produces an instant WhatsApp pitch.',
    proTip: 'Present the net payable amount directly to homeowners during rooftop visits to close deals on the spot.',
    icon: Zap,
    previewType: 'quote',
  },
  {
    id: 'tab-dashboard',
    pose: 'guide',
    speech: 'Your daily mission control!',
    badge: 'BUTTON 7 OF 11',
    locationTag: '📍 Bottom Navigation • Tab 1',
    buttonName: 'Dashboard Radar Tab',
    whatItDoes: 'Executive mission control for field appointments and operational alerts.',
    detailedAction: 'Displays today’s scheduled site surveys, active EPC project milestones, critical delays, and live aggregate kWp capacity across all client installations.',
    proTip: 'Tap any metric card on the radar to jump directly into the filtered work queue for immediate action.',
    icon: LayoutDashboard,
    previewType: 'tab-dashboard',
  },
  {
    id: 'tab-pipeline',
    pose: 'point-right',
    speech: 'The complete sales funnel!',
    badge: 'BUTTON 8 OF 11',
    locationTag: '📍 Bottom Navigation • Tab 2',
    buttonName: 'Sales Pipeline CRM Tab',
    whatItDoes: 'Tracks leads from inquiry to survey, quotation, and EPC contract signing.',
    detailedAction: 'Manages deals organized by stages (New, Contacted, Site Survey, Quote Sent, Negotiation, Won EPC). Each card has direct 1-tap Call and WhatsApp proposal buttons.',
    proTip: 'Swipe down on the pipeline list anytime to refresh latest leads synced from your marketing channels.',
    icon: Layers,
    previewType: 'tab-pipeline',
  },
  {
    id: 'tab-plus',
    pose: 'celebrate',
    speech: 'Universal 1-tap launcher!',
    badge: 'BUTTON 9 OF 11',
    locationTag: '📍 Bottom Navigation • Center Elevated',
    buttonName: 'Center Floating (+) Quick Action Button',
    whatItDoes: 'Opens the universal 1-tap launcher for fast on-site data entry.',
    detailedAction: 'From anywhere in the app, tapping the center (+) button lets you scan module barcodes, capture a brand-new customer lead, issue a GST tax invoice, or schedule a rooftop survey.',
    proTip: 'The barcode scanner works completely offline so you can record panel serials on the roof without mobile data.',
    icon: PlusCircle,
    previewType: 'tab-plus',
  },
  {
    id: 'tab-projects',
    pose: 'inspect',
    speech: 'Standardized EPC milestones!',
    badge: 'BUTTON 10 OF 11',
    locationTag: '📍 Bottom Navigation • Tab 4',
    buttonName: 'Projects & Milestone Execution Tab',
    whatItDoes: 'Field execution tracker for installation milestones and QA checklists.',
    detailedAction: 'Guides engineers through standardized milestones: Civil Foundation, Inverter Mounting, AC/DC Cabling, and CEIG / Net-Meter Inspection with mandatory photographic quality checklists.',
    proTip: 'Completing photo milestones directly satisfies DISCOM inspection and accelerates government subsidy release.',
    icon: Briefcase,
    previewType: 'tab-projects',
  },
  {
    id: 'tab-finance',
    pose: 'celebrate',
    speech: 'Collect payments on time!',
    badge: 'BUTTON 11 OF 11',
    locationTag: '📍 Bottom Navigation • Tab 5',
    buttonName: 'Finance, Invoicing & Subsidy Tab',
    whatItDoes: 'Issues GST invoices, payment receipts, and tracks PM Surya Ghar DBT.',
    detailedAction: 'Generate milestone tax invoices (Advance, Material Delivery, Commissioning), record customer payment receipts, generate shareable PDF invoices, and monitor national portal subsidy disbursement status.',
    proTip: 'Share branded PDF tax invoices with UPI QR codes directly via WhatsApp with one tap.',
    icon: Receipt,
    previewType: 'tab-finance',
  },
];

export const InAppProductTour: React.FC<InAppProductTourProps> = ({
  visible,
  onClose,
  initialStepIndex = 0,
}) => {
  const { colors, isDark } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);

  const handleNext = () => {
    if (currentStepIndex < BUTTON_TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setCurrentStepIndex(0);
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStepIndex(0);
    onClose();
  };

  if (!visible) return null;

  const step = BUTTON_TOUR_STEPS[currentStepIndex];
  const IconComponent = step.icon;
  const isLast = currentStepIndex === BUTTON_TOUR_STEPS.length - 1;

  // Render visual preview of the button being explained
  const renderButtonVisualPreview = () => {
    switch (step.previewType) {
      case 'brand':
        return (
          <View style={styles.previewBrandBtn}>
            <View style={styles.previewBrandLogoWrap}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>W</Text>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.previewBrandTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  WhereReady
                </Text>
                <View style={styles.previewOsBadge}>
                  <Text style={styles.previewOsBadgeText}>SOLAR OS</Text>
                </View>
              </View>
              <Text style={styles.previewBrandSub}>Where Growth Gets Ready.</Text>
            </View>
          </View>
        );

      case 'sync':
        return (
          <View style={styles.previewSyncPill}>
            <View style={styles.previewSyncDot} />
            <Text style={styles.previewSyncText}>Live • Cloud Sync Active</Text>
          </View>
        );

      case 'search':
        return (
          <View style={styles.previewSearchBtn}>
            <Search size={16} color="#0066FF" strokeWidth={2.4} />
            <Text style={styles.previewSearchText}>Search leads, projects, contacts...</Text>
          </View>
        );

      case 'sol':
        return (
          <View style={styles.previewSolBtn}>
            <GuideCharacter pose="wave" size={30} animated={false} />
            <View style={{ marginLeft: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#2563EB' }}>
                Sol AI Assistant
              </Text>
              <Text style={{ fontSize: 10, color: '#64748B' }}>Tap anytime for guidance</Text>
            </View>
          </View>
        );

      case 'avatar':
        return (
          <View style={styles.previewAvatarBtn}>
            <View style={styles.previewAvatarCircle}>
              <Text style={{ color: '#0066FF', fontWeight: '900', fontSize: 14 }}>W</Text>
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.previewAvatarName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Tenant Administrator
              </Text>
              <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>
                Solar EPC • Full Access
              </Text>
            </View>
          </View>
        );

      case 'quote':
        return (
          <View style={styles.previewQuoteBtn}>
            <View style={styles.previewQuoteIcon}>
              <Zap size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.previewQuoteTitle}>60s Solar Proposal</Text>
              <Text style={styles.previewQuoteSub}>Instant kW Sizing & ₹78k Subsidy</Text>
            </View>
          </View>
        );

      case 'tab-dashboard':
        return (
          <View style={styles.previewTabItem}>
            <LayoutDashboard size={20} color="#0066FF" strokeWidth={2.4} />
            <Text style={[styles.previewTabLabel, { color: '#0066FF' }]}>Dashboard</Text>
          </View>
        );

      case 'tab-pipeline':
        return (
          <View style={styles.previewTabItem}>
            <Layers size={20} color="#0066FF" strokeWidth={2.4} />
            <Text style={[styles.previewTabLabel, { color: '#0066FF' }]}>Pipeline</Text>
          </View>
        );

      case 'tab-plus':
        return (
          <View style={styles.previewPlusBtn}>
            <PlusCircle size={32} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.previewPlusText}>1-Tap Quick Action Launcher</Text>
          </View>
        );

      case 'tab-projects':
        return (
          <View style={styles.previewTabItem}>
            <Briefcase size={20} color="#0066FF" strokeWidth={2.4} />
            <Text style={[styles.previewTabLabel, { color: '#0066FF' }]}>Projects</Text>
          </View>
        );

      case 'tab-finance':
        return (
          <View style={styles.previewTabItem}>
            <Receipt size={20} color="#0066FF" strokeWidth={2.4} />
            <Text style={[styles.previewTabLabel, { color: '#0066FF' }]}>Finance</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
            },
          ]}
        >
          {/* TOP BAR: STEP BADGE + LOCATION + CLOSE */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <View style={styles.badgeWrapper}>
                <Text style={styles.badgeText}>{step.badge}</Text>
              </View>
              <Text style={[styles.locationTagText, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
                {step.locationTag}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Exit Tour"
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* SPOTLIGHT TARGET PREVIEW BOX */}
          <View style={styles.spotlightContainer}>
            <View style={styles.spotlightTagBar}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightTagText}>BUTTON ON YOUR SCREEN</Text>
            </View>
            <View style={styles.spotlightPreviewWrap}>
              {renderButtonVisualPreview()}
            </View>
          </View>

          {/* SOL MASCOT POSE & SPEECH */}
          <View style={styles.mascotArea}>
            <GuideCharacter
              pose={step.pose}
              size={76}
              speechText={step.speech}
              animated={true}
            />
          </View>

          {/* BUTTON NAME & ACTION DETAILS */}
          <ScrollView
            style={styles.detailsScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <IconComponent size={16} color="#0066FF" strokeWidth={2.4} />
              </View>
              <Text style={[styles.buttonNameText, { color: isDark ? colors.text : '#0F172A' }]}>
                {step.buttonName}
              </Text>
            </View>

            {/* WHAT IT DOES */}
            <View style={[styles.whatItDoesCard, { backgroundColor: isDark ? 'rgba(0,102,255,0.08)' : '#EFF6FF', borderColor: isDark ? '#1E3A8A' : '#BFDBFE' }]}>
              <Text style={[styles.whatItDoesLabel, { color: '#0066FF' }]}>WHAT TAPPING THIS DOES:</Text>
              <Text style={[styles.whatItDoesBody, { color: isDark ? colors.text : '#1E293B' }]}>
                {step.whatItDoes}
              </Text>
              <Text style={[styles.detailedActionBody, { color: isDark ? '#94A3B8' : '#475569' }]}>
                {step.detailedAction}
              </Text>
            </View>

            {/* PRO TIP BOX */}
            <View style={[styles.hintBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <Sparkles size={12} color="#F59E0B" />
              <Text style={[styles.hintText, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                <Text style={{ fontWeight: '800', color: '#F59E0B' }}>Tip: </Text>
                {step.proTip}
              </Text>
            </View>
          </ScrollView>

          {/* STEP PROGRESS DOTS */}
          <View style={styles.dotsRow}>
            {BUTTON_TOUR_STEPS.map((s, idx) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setCurrentStepIndex(idx)}
                style={[
                  styles.dot,
                  idx === currentStepIndex && styles.activeDot,
                  { backgroundColor: idx === currentStepIndex ? '#0066FF' : isDark ? '#334155' : '#CBD5E1' },
                ]}
              />
            ))}
          </View>

          {/* FOOTER CONTROLS */}
          <View style={[styles.footer, { borderTopColor: isDark ? colors.borderSubtle : '#F1F5F9' }]}>
            {currentStepIndex > 0 ? (
              <TouchableOpacity
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ArrowLeft size={14} color="#64748B" />
                <Text style={styles.backBtnText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.7}
                style={styles.skipBtn}
              >
                <Text style={styles.skipBtnText}>Skip Tour</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, isLast && styles.completeBtn]}
              onPress={handleNext}
              activeOpacity={0.88}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? 'Complete Tour ✓' : 'Next Button'}
              </Text>
              {!isLast && <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InAppProductTour;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeWrapper: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  locationTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  spotlightContainer: {
    backgroundColor: 'rgba(0, 102, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0066FF',
    padding: 10,
    marginBottom: 8,
  },
  spotlightTagBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  spotlightPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  spotlightTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.8,
  },
  spotlightPreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  // Visual Preview Styles
  previewBrandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  previewBrandLogoWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBrandTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewOsBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  previewOsBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  previewBrandSub: {
    fontSize: 9,
    color: '#64748B',
  },
  previewSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  previewSyncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  previewSyncText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  previewSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
    width: '90%',
  },
  previewSearchText: {
    fontSize: 11,
    color: '#64748B',
  },
  previewSolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewAvatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarName: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 10,
  },
  previewQuoteIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewQuoteTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  previewQuoteSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  previewTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#0066FF',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
  },
  previewTabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewPlusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  previewPlusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // Mascot Area
  mascotArea: {
    alignItems: 'center',
    marginVertical: 4,
  },
  detailsScroll: {
    maxHeight: 180,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonNameText: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  whatItDoesCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  whatItDoesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  whatItDoesBody: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 4,
  },
  detailedActionBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  completeBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
