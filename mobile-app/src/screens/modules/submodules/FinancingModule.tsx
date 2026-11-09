import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Banknote,
  MessageCircle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { openWhatsAppDirect } from '../../../services/whatsappService';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { CelebrationModal } from '../../../components/CelebrationModal';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
import { useTheme } from '../../../theme';

export interface FinancingModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const FinancingModule: React.FC<FinancingModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [loanCapInput, setLoanCapInput] = useState('3.3');
  const [downPaymentInput, setDownPaymentInput] = useState('20000');
  const [loanTenureYears, setLoanTenureYears] = useState(5);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const loanInterestRate = 7.0;

  // Loan Calculator Engine
  const loanKw = parseFloat(loanCapInput) || 3.3;
  const loanGross = Math.round(loanKw * 58000);
  let loanSub = 0;
  if (loanKw <= 1) loanSub = 30000;
  else if (loanKw <= 2) loanSub = 60000;
  else loanSub = 78000;

  const loanNetInvestment = Math.max(0, loanGross - loanSub);
  const downPay = parseFloat(downPaymentInput) || 0;
  const principal = Math.max(0, loanNetInvestment - downPay);
  const monthlyRate = loanInterestRate / (12 * 100);
  const totalMonths = loanTenureYears * 12;

  const monthlyEmi =
    principal > 0 && monthlyRate > 0
      ? Math.round(
          (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : 0;

  const loanMonthlyUnits = Math.round(loanKw * 120);
  const loanMonthlySavings = Math.round(loanMonthlyUnits * 8.5);
  const netMonthlyCashBenefit = loanMonthlySavings - monthlyEmi;
  const isPositiveCashflow = netMonthlyCashBenefit >= 0;

  const handleShareLoanWhatsApp = () => {
    soundEffects.playSelect();
    const text = `*PM Surya Ghar 7% Concessional Solar Loan* ☀️
• Recommended System: *${loanKw} kWp Rooftop Solar*
• Gross Turnkey Cost: ₹${loanGross.toLocaleString('en-IN')}
• Govt. CFA Subsidy: -₹${loanSub.toLocaleString('en-IN')}
• Net System Investment: ₹${loanNetInvestment.toLocaleString('en-IN')}
• Down Payment: ₹${downPay.toLocaleString('en-IN')}
• Bank Principal Financed: ₹${principal.toLocaleString('en-IN')}

*Monthly Cashflow Analysis:*
• Electricity Bill Savings: *+₹${loanMonthlySavings.toLocaleString('en-IN')} / mo*
• Bank EMI (7% p.a., ${loanTenureYears} yrs): *-₹${monthlyEmi.toLocaleString('en-IN')} / mo*
• *Net In-Pocket Benefit: +₹${netMonthlyCashBenefit.toLocaleString('en-IN')} / mo* 💰

Solar pays for its own loan from Day 1. Zero collateral required under PM Surya Ghar.`;

    openWhatsAppDirect('', text);
    solarGamificationService.recordAction('PROPOSAL_SENT', {
      projectName: '7% Solar Loan Pitch Sent',
      capacityKw: loanKw,
    });
    setCelebrationVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* SOL COMPANION */}
      <View
        style={[
          styles.solCompanionCard,
          {
            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF',
            borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE',
          },
        ]}
      >
        <GuideCharacter pose="guide" size={38} animated={false} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.solTitle, { color: isDark ? '#C4B5FD' : '#5B21B6' }]}>
              Solar Pays Its Own Loan
            </Text>
            <View style={styles.solPill}>
              <Sparkles size={9} color="#7C3AED" />
              <Text style={styles.solPillText}>7% P.A. CONCESSIONAL</Text>
            </View>
          </View>
          <Text style={[styles.solSub, { color: isDark ? '#DDD6FE' : '#4C1D95' }]}>
            Under PM Surya Ghar, public sector banks provide collateral-free loans at 7% p.a. Monthly electricity savings exceed the EMI!
          </Text>
        </View>
      </View>

      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        Concessional Loan & Cashflow Simulator
      </Text>

      <View style={[styles.calcBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SOLAR SYSTEM CAPACITY (kWp)</Text>
        <TextInput
          style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          keyboardType="numeric"
          value={loanCapInput}
          onChangeText={setLoanCapInput}
          placeholder="3.3"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CUSTOMER DOWN PAYMENT (₹)</Text>
        <TextInput
          style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          keyboardType="numeric"
          value={downPaymentInput}
          onChangeText={setDownPaymentInput}
          placeholder="20000"
          placeholderTextColor={colors.textMuted}
        />

        {/* Down payment presets */}
        <View style={styles.downPayPresetRow}>
          {[
            { label: '₹0 (Zero Down)', val: '0' },
            { label: '₹15,000', val: '15000' },
            { label: '₹25,000', val: '25000' },
            { label: '₹50,000', val: '50000' },
          ].map((dp) => (
            <TouchableOpacity
              key={dp.val}
              style={[styles.downPayChip, downPaymentInput === dp.val && styles.downPayChipActive]}
              onPress={() => {
                soundEffects.playSelect();
                setDownPaymentInput(dp.val);
              }}
            >
              <Text style={[styles.downPayChipText, downPaymentInput === dp.val && styles.downPayChipTextActive]}>
                {dp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>LOAN TENURE (YEARS)</Text>
        <View style={styles.chipRow}>
          {[3, 5, 7].map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[
                styles.smallChip,
                { borderColor: colors.border, backgroundColor: colors.background },
                loanTenureYears === yr && { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F5F3FF', borderColor: '#7C3AED' },
              ]}
              onPress={() => {
                soundEffects.playSelect();
                setLoanTenureYears(yr);
              }}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.textSecondary },
                  loanTenureYears === yr && { color: '#7C3AED', fontWeight: '800' },
                ]}
              >
                {yr} Years ({yr * 12} EMIs)
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CASHFLOW DELIGHT BADGE */}
      <View style={[styles.cashflowCard, isPositiveCashflow ? styles.cashflowPositive : styles.cashflowNeutral]}>
        <View style={styles.cashflowHeaderRow}>
          <TrendingUp size={18} color="#15803D" />
          <Text style={styles.cashflowTitle}>
            {isPositiveCashflow ? 'Zero Net Out-Of-Pocket' : 'Low Monthly Cost'}
          </Text>
          <View style={styles.positiveBadge}>
            <Text style={styles.positiveBadgeText}>DAY 1 CASHFLOW POSITIVE</Text>
          </View>
        </View>

        <View style={styles.cashflowRow}>
          <Text style={styles.cashflowLabel}>Monthly Electricity Bill Savings:</Text>
          <Text style={[styles.cashflowVal, { color: '#15803D' }]}>+₹{loanMonthlySavings.toLocaleString('en-IN')}/mo</Text>
        </View>
        <View style={styles.cashflowRow}>
          <Text style={styles.cashflowLabel}>Concessional Bank EMI (7% p.a.):</Text>
          <Text style={[styles.cashflowVal, { color: '#DC2626' }]}>-₹{monthlyEmi.toLocaleString('en-IN')}/mo</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cashflowRow}>
          <Text style={styles.cashflowBoldLabel}>Net Monthly Extra Cash in Customer Pocket:</Text>
          <Text style={styles.cashflowExtraBold}>
            +₹{Math.max(0, netMonthlyCashBenefit).toLocaleString('en-IN')}/mo
          </Text>
        </View>
      </View>

      {/* 1-TAP WHATSAPP DISPATCH */}
      <TouchableOpacity
        style={styles.shareWhatsAppBtn}
        onPress={handleShareLoanWhatsApp}
        activeOpacity={0.88}
      >
        <MessageCircle size={18} color="#FFFFFF" />
        <Text style={styles.shareWhatsAppBtnText}>Send 7% Loan Pitch on WhatsApp</Text>
      </TouchableOpacity>

      {/* CELEBRATION MODAL */}
      {celebrationVisible && (
        <CelebrationModal
          visible={celebrationVisible}
          title="Loan Pitch Dispatched! 💰"
          subtitle={`Sent 7% concessional EMI breakdown for ${loanKw} kWp to customer.`}
          stageName="Solar Loan Proposal Shared"
          xpAwarded={25}
          peaceOfMindPoints={[
            'Collateral-free loan eligible under PM Surya Ghar',
            'Electricity savings exceed monthly EMI payment',
            'Zero pre-payment penalty at nationalized banks',
          ]}
          nextActionLabel="Done"
          onNextAction={() => setCelebrationVisible(false)}
          onClose={() => setCelebrationVisible(false)}
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
  solPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  solPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#7C3AED',
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
  calcBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  calcInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  downPayPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  downPayChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  downPayChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  downPayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  downPayChipTextActive: {
    color: '#7C3AED',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cashflowCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
  cashflowPositive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  cashflowNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  cashflowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cashflowTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  positiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  positiveBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#15803D',
  },
  cashflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashflowLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  cashflowVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  cashflowBoldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  cashflowExtraBold: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  shareWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  shareWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
