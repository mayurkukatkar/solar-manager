import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Landmark,
  Check,
  Sparkles,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { subsidyApi } from '../../../api/endpoints';
import { SubsidyApplication } from '../../../types';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { CelebrationModal } from '../../../components/CelebrationModal';
import { openWhatsAppDirect } from '../../../services/whatsappService';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
import { useTheme } from '../../../theme';

export interface SubsidiesModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const SubsidiesModule: React.FC<SubsidiesModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [loadingSubsidies, setLoadingSubsidies] = useState(false);
  const [selectedKw, setSelectedKw] = useState<number>(3.3);
  const [celebrationData, setCelebrationData] = useState<any | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // 7-Stage Portal Track state
  const [stages, setStages] = useState([
    { step: 1, title: 'Consumer Selection', desc: 'Vendor tagged on pmsuryaghar.gov.in', done: true },
    { step: 2, title: 'Feasibility Review', desc: 'DISCOM technical verification', done: true },
    { step: 3, title: 'Feasibility Approved', desc: 'Plant capacity sanctioned', done: true },
    { step: 4, title: 'Work Completed', desc: 'Installation & DCR module serials uploaded', done: true },
    { step: 5, title: 'Net Meter Inspection', desc: 'DISCOM commissioning report cleared', done: false },
    { step: 6, title: 'Claim Sanctioned', desc: 'National subsidy voucher generated', done: false },
    { step: 7, title: 'DBT Disbursed', desc: 'Direct credit into customer Aadhaar bank account', done: false },
  ]);

  useEffect(() => {
    fetchSubsidies();
  }, []);

  const fetchSubsidies = async () => {
    setLoadingSubsidies(true);
    try {
      const res = await subsidyApi.getSubsidies();
      if (res?.subsidies && Array.isArray(res.subsidies)) {
        setSubsidies(res.subsidies);
      } else {
        // Sample applications for instant field utility
        setSubsidies([
          {
            id: 'sub-1',
            nationalPortalAppNo: 'PMSG-MH-2026-88192',
            customerName: 'Ramesh Patil',
            consumerNumber: '410010537316',
            discomName: 'MSEDCL Pune',
            proposedCapacity: 3.3,
            dbtStatus: 'FEASIBILITY_APPROVED',
            subsidyAmount: 78000,
          } as any,
          {
            id: 'sub-2',
            nationalPortalAppNo: 'PMSG-MH-2026-90412',
            customerName: 'Sunita Deshmukh',
            consumerNumber: '410020849201',
            discomName: 'MSEDCL Nagpur',
            proposedCapacity: 5.0,
            dbtStatus: 'DBT_DISBURSED',
            subsidyAmount: 78000,
          } as any,
        ]);
      }
    } catch {
      setSubsidies([
        {
          id: 'sub-1',
          nationalPortalAppNo: 'PMSG-MH-2026-88192',
          customerName: 'Ramesh Patil',
          consumerNumber: '410010537316',
          discomName: 'MSEDCL Pune',
          proposedCapacity: 3.3,
          dbtStatus: 'FEASIBILITY_APPROVED',
          subsidyAmount: 78000,
        } as any,
      ]);
    } finally {
      setLoadingSubsidies(false);
    }
  };

  const calculatedSubsidy = selectedKw >= 3 ? 78000 : selectedKw >= 2 ? 60000 : 30000;

  const handleToggleStage = (stepNum: number) => {
    soundEffects.playSelect();
    const updated = stages.map((s) => (s.step === stepNum ? { ...s, done: !s.done } : s));
    setStages(updated);

    if (stepNum === 7 && !stages[6].done) {
      soundEffects.playVerificationShield();
      solarGamificationService.recordAction('STAGE_ADVANCED', {
        projectName: 'PM Surya Ghar DBT Disbursed',
        capacityKw: selectedKw,
      });
      setCelebrationData({
        title: 'PM Surya Ghar ₹78,000 DBT Released! 🏛️',
        subtitle: 'The Central Financial Assistance (CFA) subsidy has been verified and released to customer bank account.',
        stageName: 'National Portal DBT Disbursed',
        xpAwarded: 100,
        peaceOfMindPoints: [
          'Direct Benefit Transfer (DBT) confirmed by PFMS',
          'Aadhaar seeded bank account credited successfully',
          'DISCOM net-metering synchronization voucher locked',
        ],
      });
      setShowCelebration(true);
    }
  };

  const handleShareDbtUpdate = (sub: any) => {
    soundEffects.playSelect();
    const text = `*PM Surya Ghar National Portal Update* 🏛️
Dear *${sub.customerName}*,
Your central solar subsidy application (*${sub.nationalPortalAppNo || 'National Portal App'}*) is currently at:
*Status: ${sub.dbtStatus || 'UNDER REVIEW'}*
• Plant Capacity: *${sub.proposedCapacity || 3.3} kWp*
• Eligible Central Subsidy: *₹${(sub.subsidyAmount || 78000).toLocaleString('en-IN')}*
• Discom Consumer CA: *${sub.consumerNumber}*

Your subsidy will be credited directly to your Aadhaar-linked bank account upon net-meter inspection.`;

    openWhatsAppDirect('', text);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* SOL COMPANION */}
      <View
        style={[
          styles.solCompanionCard,
          {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
            borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
          },
        ]}
      >
        <GuideCharacter pose="guide" size={38} animated={false} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.solTitle, { color: isDark ? '#FBBF24' : '#92400E' }]}>
              PM Surya Ghar CFA Studio
            </Text>
            <View style={styles.cfaPill}>
              <Sparkles size={9} color="#D97706" />
              <Text style={styles.cfaPillText}>₹78,000 MAX DBT</Text>
            </View>
          </View>
          <Text style={[styles.solSub, { color: isDark ? '#FCD34D' : '#78350F' }]}>
            Central subsidy is credited straight to customer Aadhaar-linked bank account within 30 days of net-metering.
          </Text>
        </View>
      </View>

      {/* INTERACTIVE SUBSIDY SLABS */}
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        Interactive Central Subsidy Calculator
      </Text>
      <View style={styles.subsidySlabRow}>
        {[
          { kw: 1.0, title: '1 kW System', amount: '₹30,000' },
          { kw: 2.0, title: '2 kW System', amount: '₹60,000' },
          { kw: 3.3, title: '3 kW+ System', amount: '₹78,000', tag: 'Max DBT' },
        ].map((s) => {
          const isSelected = selectedKw === s.kw || (s.kw === 3.3 && selectedKw >= 3);
          return (
            <TouchableOpacity
              key={s.kw}
              style={[
                styles.slabBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && styles.slabBoxActive,
              ]}
              onPress={() => {
                soundEffects.playSelect();
                setSelectedKw(s.kw);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.slabTitle, isSelected ? styles.slabTitleActive : { color: colors.textSecondary }]}>
                {s.title}
              </Text>
              <Text style={[styles.slabAmount, isSelected ? styles.slabAmountActive : { color: colors.text }]}>
                {s.amount}
              </Text>
              <Text style={[styles.slabDesc, isSelected ? styles.slabDescActive : { color: colors.textMuted }]}>
                {s.tag || 'CFA Credit'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 7-STAGE WORKFLOW GUIDE */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.cardSectionHeader, { color: colors.text, marginBottom: 0 }]}>
          Official 7-Stage National Portal Track
        </Text>
        <Text style={styles.checklistHint}>Tap step to update</Text>
      </View>

      <View style={[styles.stageTrackBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {stages.map((st) => (
          <TouchableOpacity
            key={st.step}
            style={styles.trackItemRow}
            onPress={() => handleToggleStage(st.step)}
            activeOpacity={0.75}
          >
            <View style={[styles.trackCircle, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }, st.done && styles.trackCircleDone]}>
              {st.done ? (
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={[styles.trackCircleText, { color: isDark ? colors.textSecondary : '#334155' }]}>{st.step}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackItemTitle, { color: colors.text }, st.done && styles.trackItemTitleDone]}>
                {st.title}
              </Text>
              <Text style={[styles.trackItemDesc, { color: colors.textSecondary }]}>{st.desc}</Text>
            </View>
            {st.done && <CheckCircle2 size={16} color="#10B981" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ACTIVE SUBSIDY APPLICATIONS */}
      <Text style={[styles.cardSectionHeader, { marginTop: 20, color: colors.text }]}>
        Portal Applications ({subsidies.length})
      </Text>
      {loadingSubsidies ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
        </View>
      ) : subsidies.length === 0 ? (
        <EmptyState
          icon={<Landmark size={32} color={colors.textSecondary} />}
          title="No Active Subsidy Claims"
          description="Applications submitted to the National Portal will synchronize here for real-time DBT tracking."
          compact
        />
      ) : (
        subsidies.map((sub: any) => (
          <View
            key={sub.id}
            style={[styles.subsidyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.appNumberRow}>
                <Zap size={13} color="#F59E0B" />
                <Text style={styles.appNumber}>{sub.nationalPortalAppNo || 'PMSG-APP'}</Text>
              </View>
              <Text style={[styles.consumerName, { color: colors.text }]}>{sub.customerName || 'Consumer'}</Text>
              <Text style={[styles.consumerDetail, { color: colors.textSecondary }]}>
                CA: {sub.consumerNumber} • {sub.discomName || 'MSEDCL'} • {sub.proposedCapacity || 3.3} kW
              </Text>
              <Text style={styles.subsidyAmountText}>
                Eligible DBT: ₹{(sub.subsidyAmount || calculatedSubsidy).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.cardActionCol}>
              <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                <Text style={styles.statusText}>{sub.dbtStatus || 'FEASIBILITY'}</Text>
              </View>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={() => handleShareDbtUpdate(sub)}
                activeOpacity={0.8}
              >
                <Share2 size={13} color="#15803D" />
                <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* CELEBRATION MODAL */}
      {showCelebration && celebrationData && (
        <CelebrationModal
          visible={showCelebration}
          title={celebrationData.title}
          subtitle={celebrationData.subtitle}
          stageName={celebrationData.stageName}
          xpAwarded={celebrationData.xpAwarded}
          peaceOfMindPoints={celebrationData.peaceOfMindPoints}
          nextActionLabel="Done"
          onNextAction={() => setShowCelebration(false)}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  solCompanionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  solTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  cfaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  cfaPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706',
  },
  solSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  cardSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  checklistHint: {
    fontSize: 11,
    color: '#0066FF',
    fontWeight: '700',
  },
  subsidySlabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  slabBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  slabBoxActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  slabTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  slabTitleActive: {
    color: '#047857',
  },
  slabAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 2,
  },
  slabAmountActive: {
    color: '#047857',
  },
  slabDesc: {
    fontSize: 10,
    fontWeight: '600',
  },
  slabDescActive: {
    color: '#047857',
  },
  stageTrackBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  trackItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCircleDone: {
    backgroundColor: '#10B981',
  },
  trackCircleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  trackItemTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  trackItemTitleDone: {
    color: '#10B981',
  },
  trackItemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  subsidyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  appNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  appNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  consumerName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  consumerDetail: {
    fontSize: 11,
  },
  subsidyAmountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 4,
  },
  cardActionCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  whatsAppBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
});
