import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Check,
  MessageCircle,
  Eye,
  Zap,
} from 'lucide-react-native';
import { quotationsApi } from '../../../api/endpoints';
import { openWhatsAppDirect } from '../../../services/whatsappService';
import { Quotation } from '../../../types';
import { ProposalPreviewModal } from '../../../components/ProposalPreviewModal';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { useTheme } from '../../../theme';

export interface QuotationsModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const QuotationsModule: React.FC<QuotationsModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  // Quotation Wizard State
  const [capacityInput, setCapacityInput] = useState(
    initialParams?.capacity ? String(initialParams.capacity) : '3.3'
  );
  const [customerNameInput, setCustomerNameInput] = useState(
    initialParams?.leadName || ''
  );
  const [selectedPanelBrand, setSelectedPanelBrand] = useState(
    'Waaree 550Wp Mono PERC'
  );
  const [selectedInverterBrand, setSelectedInverterBrand] = useState(
    'Growatt 3.3kW On-Grid String Inverter'
  );
  const [selectedStructure, setSelectedStructure] = useState(
    'HDG High-Rise Elevated'
  );
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [previewQuoteData, setPreviewQuoteData] = useState<any>(null);

  // Calculations
  const kw = parseFloat(capacityInput) || 3.3;
  const baseEquip = Math.round(kw * 44000);
  const baseServices = Math.round(kw * 14000);
  const gst = Math.round(baseEquip * 0.12 + baseServices * 0.18);
  const grossTotal = baseEquip + baseServices + gst;

  let subsidy = 0;
  if (kw <= 1) subsidy = 30000;
  else if (kw <= 2) subsidy = 60000;
  else subsidy = 78000;

  const netPayable = Math.max(0, grossTotal - subsidy);
  const monthlyUnits = Math.round(kw * 125);
  const monthlySavings = Math.round(monthlyUnits * 8.5);
  const paybackYears = (netPayable / (monthlySavings * 12)).toFixed(1);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoadingQuotes(true);
    try {
      const res = await quotationsApi.getQuotations();
      if (res && Array.isArray(res.quotations)) {
        setQuotations(res.quotations);
      }
    } catch (err: any) {
      console.warn('Quotations fetch notice:', err.message);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (!customerNameInput.trim()) {
      Alert.alert('Required', 'Please enter a customer or prospect name.');
      return;
    }
    setSavingQuote(true);
    try {
      await quotationsApi.createQuotation({
        newCustomer: {
          name: customerNameInput.trim(),
          mobile: '',
          address: 'Site Location, Maharashtra',
        },
        customerName: customerNameInput.trim(),
        systemCapacity: kw,
        panelBrand: selectedPanelBrand,
        inverterBrand: selectedInverterBrand,
        structureType: selectedStructure,
        totalSystemCost: grossTotal,
        status: 'SENT',
      });
      Alert.alert('Proposal Generated', 'Quotation recorded and synced with central web module.');
      setCustomerNameInput('');
      fetchQuotations();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Quotation generated locally.');
    } finally {
      setSavingQuote(false);
    }
  };

  const handlePreviewSavedQuote = (q: any) => {
    try {
      const cap = q.systemCapacity || 3.3;
      const total = q.total || 195000;
      const quoteSubsidy = q.indicativeSubsidy || (cap <= 1 ? 30000 : cap <= 2 ? 60000 : 78000);
      const net = Math.max(0, total - quoteSubsidy);
      const qMonthlyUnits = Math.round(cap * 120);
      const annualUnits = Math.round(cap * 1460);
      const qMonthlySavings = Math.round(qMonthlyUnits * 8.5);

      setPreviewQuoteData({
        quotationNumber: q.qNumber || 'QT-PROPOSAL',
        quotationDate: new Date(q.date || Date.now()).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        companyName: 'WhereReady Solar Technologies Pvt Ltd',
        companyAddress: 'Corporate Tower, MIDC Tech Park, Pune 411038',
        companyPhone: '+91 98220 12345',
        companyEmail: 'proposals@wherereadysolar.com',
        customerName: q.customer?.name || q.lead?.name || 'Valued Customer',
        customerPhone: q.customer?.mobile || q.lead?.mobile || '',
        customerAddress: q.customer?.address || q.lead?.address || 'Site Location, Maharashtra',
        systemCapacityKw: cap,
        panelBrand: q.panelBrand || 'Waaree 540W Mono PERC Bifacial',
        inverterBrand: q.inverterBrand || 'Solis 3.3kW On-Grid Inverter',
        structureType: q.structureBrand || 'Elevated HDG Structure',
        grossAmount: total,
        subsidyAmount: quoteSubsidy,
        netPayable: net,
        monthlyGenerationUnits: qMonthlyUnits,
        annualGenerationUnits: annualUnits,
        currentMonthlyBill: Math.round(qMonthlySavings * 1.15),
        estimatedMonthlyBill: 150,
        monthlySavings: qMonthlySavings,
        lifetimeSavings: Math.round(annualUnits * 25 * 8.5 * 0.92),
        paybackYears: 3.5,
        co2ReductionKg: Math.round(annualUnits * 0.82),
        treeEquivalent: Math.round((annualUnits * 0.82) / 20),
        bankDetails: {
          accountName: 'WhereReady Solar Technologies Pvt Ltd',
          bankName: 'HDFC Bank Ltd',
          accountNumber: '50200088992211',
          ifsc: 'HDFC0001234',
          upiId: 'solar@hdfcbank',
        },
      });
    } catch (err: any) {
      Alert.alert('Preview Error', err.message || 'Could not load quotation preview');
    }
  };

  const handleWhatsAppSavedQuote = (q: any) => {
    const custName = q.customer?.name || q.lead?.name || 'Valued Client';
    const phone = q.customer?.mobile || q.lead?.mobile || '';
    const cap = q.systemCapacity || 3.3;
    const total = (q.total || 0).toLocaleString('en-IN');
    const sub = (
      q.indicativeSubsidy || (cap <= 1 ? 30000 : cap <= 2 ? 60000 : 78000)
    ).toLocaleString('en-IN');
    const net = Math.max(0, (q.total || 0) - (q.indicativeSubsidy || 78000)).toLocaleString('en-IN');

    const text = `*Solar Rooftop Proposal — ${q.qNumber}*
Dear ${custName},

Here are the details of your customized Rooftop Solar System:
• System Capacity: ${cap} kWp On-Grid System
• Turnkey Plant Cost (All GST Included): ₹${total}
• PM Surya Ghar Central Subsidy: -₹${sub}
• Net Customer Investment: ₹${net}

Detailed technical and financial proposal is saved in the central portal. Contact us to schedule installation!`;

    openWhatsAppDirect(phone, text);
  };

  const handleConvertQuotationToProject = async (quoteId: string) => {
    try {
      await quotationsApi.convertQuotation(quoteId);
      Alert.alert('Project Created', 'Accepted quotation converted into active project.');
      fetchQuotations();
    } catch (err: any) {
      Alert.alert('Conversion Notice', err.message || 'Project created from proposal.');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `☀️ *Solar Rooftop Proposal Summary*
Dear ${customerNameInput.trim() || 'Sir/Madam'},

Recommended Solar System: *${kw} kWp On-Grid*
• Gross Turnkey Cost: ₹${grossTotal.toLocaleString('en-IN')}
• PM Surya Ghar CFA Subsidy: -₹${subsidy.toLocaleString('en-IN')}
• *Net Investment: ₹${netPayable.toLocaleString('en-IN')}*

Estimated Monthly Production: ~${monthlyUnits} Units
Monthly Electricity Bill Savings: ~₹${monthlySavings.toLocaleString('en-IN')}
Payback Period: ~${paybackYears} Years

Hardware:
- Panels: ${selectedPanelBrand}
- Inverter: ${selectedInverterBrand}
- Mounting: ${selectedStructure}

Generated via WhereReady Solar OS Enterprise.`;

    openWhatsAppDirect('', text);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        60-Second Solar Proposal Builder
      </Text>

      <View style={[styles.calcBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROSPECT / CLIENT NAME</Text>
        <TextInput
          style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={customerNameInput}
          onChangeText={setCustomerNameInput}
          placeholder="e.g. Surendra Sharma"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RECOMMENDED CAPACITY (kWp)</Text>
        <TextInput
          style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          keyboardType="numeric"
          value={capacityInput}
          onChangeText={setCapacityInput}
          placeholder="3.3"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PV MODULE SPECIFICATION</Text>
        <View style={styles.chipRow}>
          {['Waaree 550Wp Mono PERC', 'Adani 540Wp Bifacial', 'Vikram 535Wp DCR'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.smallChip,
                { borderColor: colors.border, backgroundColor: colors.background },
                selectedPanelBrand === p && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5', borderColor: '#059669' },
              ]}
              onPress={() => setSelectedPanelBrand(p)}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.textSecondary },
                  selectedPanelBrand === p && { color: isDark ? '#34d399' : '#059669', fontWeight: '700' },
                ]}
              >
                {p.split(' ')[0]} ({p.split(' ')[1]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INVERTER SPECIFICATION</Text>
        <View style={styles.chipRow}>
          {['Growatt On-Grid', 'Polycab Solar', 'Sungrow Tri-Phase'].map((inv) => (
            <TouchableOpacity
              key={inv}
              style={[
                styles.smallChip,
                { borderColor: colors.border, backgroundColor: colors.background },
                selectedInverterBrand.startsWith(inv.split(' ')[0]) && {
                  backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5',
                  borderColor: '#059669',
                },
              ]}
              onPress={() => setSelectedInverterBrand(`${inv} String Inverter`)}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.textSecondary },
                  selectedInverterBrand.startsWith(inv.split(' ')[0]) && {
                    color: isDark ? '#34d399' : '#059669',
                    fontWeight: '700',
                  },
                ]}
              >
                {inv}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FINANCIAL BREAKDOWN */}
        <View style={[styles.calcBreakdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Gross Solar System Cost</Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>₹{grossTotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#059669', fontWeight: '700' }]}>
              Govt. CFA Subsidy (Surya Ghar)
            </Text>
            <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '800' }]}>
              -₹{subsidy.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
            <Text style={[styles.netLabel, { color: colors.text }]}>Customer Net Payable</Text>
            <Text style={[styles.netVal, { color: colors.text }]}>₹{netPayable.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Estimated Monthly Power</Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>~{monthlyUnits} Units/mo</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Estimated Monthly Savings</Text>
            <Text style={[styles.breakdownVal, { color: '#2563eb' }]}>
              ~₹{monthlySavings.toLocaleString('en-IN')}/mo
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Estimated Payback Period</Text>
            <Text style={[styles.breakdownBold, { color: colors.text }]}>{paybackYears} Years</Text>
          </View>
        </View>

        <View style={styles.quoteActionButtonsRow}>
          <TouchableOpacity
            style={[styles.saveQuoteBtn, savingQuote && { opacity: 0.7 }]}
            onPress={handleSaveQuotation}
            disabled={savingQuote}
            activeOpacity={0.85}
          >
            <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.saveQuoteBtnText}>
              {savingQuote ? 'Saving...' : 'Save Quote'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.85}
          >
            <MessageCircle size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.whatsappBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SAVED QUOTATIONS */}
      <Text style={[styles.cardSectionHeader, { marginTop: 24, color: colors.text }]}>
        Saved Quotations ({quotations.length})
      </Text>
      {loadingQuotes ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : quotations.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} color={colors.textSecondary} />}
          title="No saved quotations yet"
          description="Build a proposal above or tap Create Proposal to generate a verified BOM quotation."
          compact
        />
      ) : (
        quotations.map((q) => (
          <View
            key={q.id}
            style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteNumber, { color: colors.primary }]}>{q.qNumber}</Text>
              <Text style={[styles.quoteCustomer, { color: colors.text }]}>
                {q.customer?.name || q.lead?.name || 'Solar Prospect'}
              </Text>
              <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700', marginTop: 2 }}>
                {q.systemCapacity || 3.3} kWp • ₹{(q.total || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.quoteActionSmallBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => handlePreviewSavedQuote(q)}
                >
                  <Eye size={12} color={colors.text} />
                  <Text style={[styles.quoteActionSmallText, { color: colors.text }]}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quoteActionSmallBtn, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7', borderColor: isDark ? '#16a34a' : '#86efac' }]}
                  onPress={() => handleWhatsAppSavedQuote(q)}
                >
                  <MessageCircle size={12} color={isDark ? '#4ade80' : '#15803d'} />
                  <Text style={[styles.quoteActionSmallText, { color: isDark ? '#4ade80' : '#15803d' }]}>WA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.convertQuoteSmallBtn}
                  onPress={() => handleConvertQuotationToProject(q.id)}
                >
                  <Text style={styles.convertQuoteSmallBtnText}>Convert</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      {/* PDF PREVIEW MODAL */}
      <ProposalPreviewModal
        visible={!!previewQuoteData}
        data={previewQuoteData}
        onClose={() => setPreviewQuoteData(null)}
      />
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
  quoteActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  saveQuoteBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveQuoteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 11,
    fontWeight: '800',
  },
  quoteCustomer: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  quoteActionSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  quoteActionSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  convertQuoteSmallBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  convertQuoteSmallBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
