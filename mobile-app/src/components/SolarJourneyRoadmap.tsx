import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  FileText,
  Sun,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { GuideCharacter } from './GuideCharacter';
import { haptics } from '../utils/haptics';

export interface SolarJourneyStage {
  id: string;
  number: number;
  title: string;
  shortDesc: string;
  solTip: string;
  actionLabel: string;
  iconName: 'sparkles' | 'file-text' | 'shield-check' | 'qr-code' | 'zap' | 'sun';
}

export const SOLAR_JOURNEY_STAGES: SolarJourneyStage[] = [
  {
    id: 'LEAD',
    number: 1,
    title: 'Inquiry & Sizing',
    shortDesc: 'Capture prospect electricity bill & load',
    solTip: 'Qualify electricity connection & compute recommended kWp in 10s!',
    actionLabel: 'Capture Lead',
    iconName: 'sparkles',
  },
  {
    id: 'PROPOSAL',
    number: 2,
    title: 'Smart Quotation',
    shortDesc: 'PM Surya Ghar subsidy & 25-yr ROI',
    solTip: 'Clients decide faster with our clear monthly savings breakdown!',
    actionLabel: 'Generate Quote',
    iconName: 'file-text',
  },
  {
    id: 'ONBOARDING',
    number: 3,
    title: 'Deal Won & KYC',
    shortDesc: 'Token advance, Aadhaar & DISCOM consumer profile',
    solTip: 'Convert prospect to active project with zero paperwork stress.',
    actionLabel: 'Onboard Client',
    iconName: 'shield-check',
  },
  {
    id: 'DISPATCH',
    number: 4,
    title: 'Hardware Dispatch',
    shortDesc: 'DCR Tier-1 modules, Inverter & Structure',
    solTip: 'Confirm bill of materials dispatched to site for quick erection.',
    actionLabel: 'Dispatch BOM',
    iconName: 'zap',
  },
  {
    id: 'QA_INSPECTION',
    number: 5,
    title: 'Installation & QA',
    shortDesc: 'Scan 2D barcodes & test <2Ω earthing pits',
    solTip: 'Zero electrical leakage certified! Protects customer & grid.',
    actionLabel: 'Run QA Test',
    iconName: 'qr-code',
  },
  {
    id: 'HANDOVER',
    number: 6,
    title: 'Net-Meter & Handover',
    shortDesc: 'Grid synchronization & central subsidy disbursement',
    solTip: 'The grand finale! Customer saves money from day one!',
    actionLabel: 'Handover Dossier',
    iconName: 'sun',
  },
];

interface SolarJourneyRoadmapProps {
  currentStageId?: string; // 'LEAD' | 'PROPOSAL' | 'ONBOARDING' | 'DISPATCH' | 'QA_INSPECTION' | 'HANDOVER'
  customerName?: string;
  capacityKw?: number;
  onActionPress?: (stage: SolarJourneyStage) => void;
  compact?: boolean;
}

export const SolarJourneyRoadmap: React.FC<SolarJourneyRoadmapProps> = ({
  currentStageId = 'ONBOARDING',
  customerName,
  capacityKw = 3.3,
  onActionPress,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  // Map stage to index 1..6
  const getStageNumber = (id: string): number => {
    const upper = id.toUpperCase();
    if (upper.includes('HANDOVER') || upper.includes('COMPLET') || upper.includes('SYNC')) return 6;
    if (upper.includes('QA') || upper.includes('INSPECT') || upper.includes('TEST')) return 5;
    if (upper.includes('DISPATCH') || upper.includes('PROCURE') || upper.includes('INSTALL')) return 4;
    if (upper.includes('ONBOARD') || upper.includes('WON') || upper.includes('CLIENT')) return 3;
    if (upper.includes('PROPOSAL') || upper.includes('QUOTE')) return 2;
    return 1;
  };

  const activeStageNum = getStageNumber(currentStageId);
  const activeStage = SOLAR_JOURNEY_STAGES[activeStageNum - 1] || SOLAR_JOURNEY_STAGES[0];
  const progressPct = Math.round((activeStageNum / SOLAR_JOURNEY_STAGES.length) * 100);

  const renderIcon = (name: string, color: string, size = 16) => {
    switch (name) {
      case 'sparkles': return <Sparkles size={size} color={color} />;
      case 'file-text': return <FileText size={size} color={color} />;
      case 'shield-check': return <ShieldCheck size={size} color={color} />;
      case 'zap': return <Zap size={size} color={color} />;
      case 'qr-code': return <QrCode size={size} color={color} />;
      case 'sun': return <Sun size={size} color={color} />;
      default: return <Sparkles size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner / Summary Card */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.progressRow}>
            <View style={styles.stageTag}>
              <Text style={styles.stageTagText}>STAGE {activeStageNum} OF 6</Text>
            </View>
            <Text style={styles.progressPctText}>{progressPct}% Complete</Text>
          </View>
          <Text style={styles.activeStageTitle}>{activeStage.title}</Text>
          {customerName ? (
            <Text style={styles.customerSub}>
              {customerName} • {capacityKw} kWp System
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.expandToggle}
          onPress={() => {
            haptics.selection();
            setExpanded(!expanded);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {expanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
        </TouchableOpacity>
      </View>

      {/* Progress Track */}
      <View style={styles.trackBackground}>
        <View style={[styles.trackFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Sol Mascot Guidance Bubble */}
      <View style={styles.solGuidanceCard}>
        <GuideCharacter pose="guide" size={38} animated={false} />
        <View style={styles.solSpeechBubble}>
          <Text style={styles.solTipText}>{activeStage.solTip}</Text>
        </View>
      </View>

      {/* Expanded Roadmap Timeline */}
      {expanded ? (
        <View style={styles.timelineList}>
          {SOLAR_JOURNEY_STAGES.map((stg) => {
            const isCompleted = stg.number < activeStageNum;
            const isCurrent = stg.number === activeStageNum;
            const isUpcoming = stg.number > activeStageNum;

            return (
              <View key={stg.id} style={styles.timelineItem}>
                {/* Node Indicator */}
                <View style={styles.nodeColumn}>
                  <View
                    style={[
                      styles.nodeCircle,
                      isCompleted && styles.nodeCircleCompleted,
                      isCurrent && styles.nodeCircleCurrent,
                      isUpcoming && styles.nodeCircleUpcoming,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="#FFFFFF" />
                    ) : (
                      renderIcon(
                        stg.iconName,
                        isCurrent ? '#FFFFFF' : '#94A3B8',
                        14
                      )
                    )}
                  </View>
                  {stg.number < 6 ? (
                    <View
                      style={[
                        styles.connectorLine,
                        isCompleted ? styles.connectorCompleted : styles.connectorPending,
                      ]}
                    />
                  ) : null}
                </View>

                {/* Content */}
                <View
                  style={[
                    styles.nodeContent,
                    isCurrent && styles.nodeContentActive,
                  ]}
                >
                  <View style={styles.nodeHeaderRow}>
                    <Text
                      style={[
                        styles.nodeTitle,
                        isCurrent && styles.nodeTitleActive,
                        isCompleted && styles.nodeTitleCompleted,
                      ]}
                    >
                      {stg.number}. {stg.title}
                    </Text>
                    {isCompleted ? (
                      <View style={styles.badgeDone}>
                        <Text style={styles.badgeDoneText}>DONE</Text>
                      </View>
                    ) : isCurrent ? (
                      <View style={styles.badgeNow}>
                        <Text style={styles.badgeNowText}>NEXT ACTION</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.nodeDesc}>{stg.shortDesc}</Text>

                  {/* 1-Tap Execution Button for current stage */}
                  {isCurrent && onActionPress ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        haptics.selection();
                        onActionPress(stg);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.actionBtnText}>{stg.actionLabel}</Text>
                      <ArrowRight size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stageTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.4,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  activeStageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  customerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  expandToggle: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackBackground: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  solGuidanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  solSpeechBubble: {
    flex: 1,
  },
  solTipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    lineHeight: 16,
  },
  timelineList: {
    marginTop: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 28,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCircleCompleted: {
    backgroundColor: '#10B981',
  },
  nodeCircleCurrent: {
    backgroundColor: '#0066FF',
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  nodeCircleUpcoming: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  connectorLine: {
    width: 2,
    height: 38,
    marginTop: -2,
    marginBottom: -2,
  },
  connectorCompleted: {
    backgroundColor: '#10B981',
  },
  connectorPending: {
    backgroundColor: '#E2E8F0',
  },
  nodeContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  nodeContentActive: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 10,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  nodeTitleActive: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  nodeTitleCompleted: {
    color: '#334155',
  },
  badgeDone: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeDoneText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  badgeNow: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeNowText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  nodeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

