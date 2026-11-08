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
} from 'lucide-react-native';
import { openWhatsAppDirect } from '../../../services/whatsappService';
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
  const loanInterestRate = 7.0;

  // Loan Calculator Engine
  const loanKw = parseFloat(loanCapInput) || 3.3;
  const loanGross = Math.round(loanKw * 60000);
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

  const loanMonthlyUnits = Math.round(loanKw * 125);
  const loanMonthlySavings = Math.round(loanMonthlyUnits * 8.5);
  const netMonthlyCashBenefit = loanMonthlySavings - monthlyEmi;

  const handleShareLoanWhatsApp = () => {
    const text = `*PM Surya Ghar 7% Solar Loan Estimate*
• Recommended System: *${loanKw} kWp Rooftop Solar*
• Gross Turnkey Cost: ₹${loanGross.toLocaleString('en-IN')}
• Govt. CFA Subsidy: -₹${loanSub.toLocaleString('en-IN')}
• Net System Investment: ₹${loanNetInvestment.toLocaleString('en-IN')}
• Down Payment: ₹${downPay.toLocaleString('en-IN')}
• Bank Principal Financed: ₹${principal.toLocaleString('en-IN')}

*Monthly Cashflow:*
• Concessional Bank EMI (7% p.a., ${loanTenureYears} yrs): ₹${monthlyEmi.toLocaleString('en-IN')} / mo
• Electricity Bill Savings: +₹${loanMonthlySavings.toLocaleString('en-IN')} / mo
• *Net Monthly In-Pocket Savings: +₹${netMonthlyCashBenefit.toLocaleString('en-IN')} / mo*

Solar pays for itself from Day 1. Contact us to process collateral-free loan sanction.`;

    openWhatsAppDirect('', text);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        PM Surya Ghar 7% p.a. Concessional Solar Loan
      </Text>

      <View style={[styles.calcBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SYSTEM CAPACITY (kW)</Text>
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

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LOAN TENURE (YEARS)</Text>
        <View style={styles.chipRow}>
          {[3, 5, 7].map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[
                styles.smallChip,
                { borderColor: colors.border, backgroundColor: colors.background },
                loanTenureYears === yr && { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#f5f3ff', borderColor: '#7c3aed' },
              ]}
              onPress={() => setLoanTenureYears(yr)}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.textSecondary },
                  loanTenureYears === yr && { color: isDark ? '#a78bfa' : '#7c3aed', fontWeight: '700' },
                ]}
              >
                {yr} Years ({yr * 12} Mos)
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.calcBreakdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Gross Solar Cost</Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>₹{loanGross.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#059669' }]}>PM Surya Ghar Subsidy</Text>
            <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '800' }]}>
              -₹{loanSub.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Net System Payable</Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>
              ₹{loanNetInvestment.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Down Payment</Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>-₹{downPay.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
            <Text style={[styles.netLabel, { color: colors.text }]}>Bank Loan Principal</Text>
            <Text style={[styles.netVal, { color: colors.text }]}>₹{principal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Interest Rate (Govt. Surcharge)
            </Text>
            <Text style={[styles.breakdownBold, { color: colors.text }]}>{loanInterestRate}% p.a.</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { fontWeight: '700', color: isDark ? '#fbbf24' : '#b45309' }]}>
              Monthly Bank EMI
            </Text>
            <Text style={[styles.breakdownVal, { fontWeight: '900', color: isDark ? '#fbbf24' : '#b45309', fontSize: 16 }]}>
              ₹{monthlyEmi.toLocaleString('en-IN')} / mo
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Monthly Bill Savings</Text>
            <Text style={[styles.breakdownVal, { color: '#2563eb', fontWeight: '800' }]}>
              +₹{loanMonthlySavings.toLocaleString('en-IN')} / mo
            </Text>
          </View>

          <View style={[styles.profitBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#34d399' : '#047857' }}>NET MONTHLY PROFIT</Text>
            <Text style={{ fontSize: 15, fontWeight: '900', color: isDark ? '#34d399' : '#047857' }}>
              +₹{netMonthlyCashBenefit.toLocaleString('en-IN')} / mo
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={handleShareLoanWhatsApp}
          activeOpacity={0.85}
        >
          <MessageCircle size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.whatsappBtnText}>Share Financing on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cardSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  calcBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  smallChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calcBreakdown: {
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  netVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  breakdownBold: {
    fontSize: 12,
    fontWeight: '800',
  },
  profitBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  whatsappBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
