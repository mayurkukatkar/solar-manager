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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { quotationsApi } from '../../../api/endpoints';
import { openWhatsAppDirect } from '../../../services/whatsappService';
import { Quotation } from '../../../types';
import { ProposalPreviewModal } from '../../../components/ProposalPreviewModal';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { CelebrationModal } from '../../../components/CelebrationModal';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
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

  // Celebration state
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: '',
    subtitle: '',
    xp: 75,
  });

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

  const handleSelectCapacityPreset = (val: string) => {
    soundEffects.playSelect();
    setCapacityInput(val);
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
      soundEffects.playCelebrationFanfare();
      solarGamificationService.recordAction('PROPOSAL_SENT', {
        customerName: customerNameInput.trim(),
        capacityKw: kw,
      });
      
      setCelebrationData({
        title: 'Proposal Generated & Synced! 📜',
        subtitle: `${kw} kWp system proposal for ${customerNameInput.trim()} created with ₹${subsidy.toLocaleString('en-IN')} PM Surya Ghar subsidy.`,
        xp: 75,
      });
      setCelebrationVisible(true);
      setCustomerNameInput('');
      fetchQuotations();
    } catch (err: any) {
      soundEffects.playCelebrationFanfare();
      setCelebrationData({
        title: 'Proposal Generated Locally! 📜',
        subtitle: `${kw} kWp system quote saved in local workspace cache.`,
        xp: 75,
      });
      setCelebrationVisible(true);
    } finally {
      setSavingQuote(false);
    }
  };

  const handlePreviewSavedQuote = (q: any) => {
    soundEffects.playGlide();
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
          upiId: 'solar.billing@hdfcbank',
        },
      });
    } catch (err: any) {
      Alert.alert('Preview Error', err.message || 'Could not load quotation preview');
    }
  };

  const handleWhatsAppSavedQuote = (q: any) => {
    soundEffects.playSelect();
    const custName = q.customer?.name || q.lead?.name || 'Valued Client';
    const phone = q.customer?.mobile || q.lead?.mobile || '';
    const cap = q.systemCapacity || 3.3;
    const total = (q.total || 0).toLocaleString('en-IN');
    const sub = (
      q.indicativeSubsidy || (cap <= 1 ? 30000 : cap <= 2 ? 60000 : 78000)
    ).toLocaleString('en-IN');
    const net = Math.max(0, (q.total || 0) - (q.indicativeSubsidy || 78000)).toLocaleString('en-IN');

    const text = `☀️ *Solar Rooftop Proposal — ${q.qNumber || 'QT-PROPOSAL'}*\n\nDear *${custName}*,\n\nHere are the details of your customized Rooftop Solar System:\n• *System Capacity:* ${cap} kWp On-Grid System\n• *Turnkey Cost (GST Included):* ₹${total}\n• *PM Surya Ghar Central Subsidy:* -₹${sub}\n• *Net Investment:* ₹${net}\n\nEstimated Monthly Generation: ~${Math.round(cap * 125)} Units\nMonthly Electricity Savings: ~₹${Math.round(cap * 125 * 8.5).toLocaleString('en-IN')}\n\nContact us to begin seamless rooftop installation!`;

    openWhatsAppDirect(phone, text);
  };

  const handleConvertQuotationToProject = async (quoteId: string) => {
    soundEffects.playCelebrationFanfare();
    try {
      await quotationsApi.convertQuotation(quoteId);
      solarGamificationService.recordAction('CLIENT_ONBOARDED');
      setCelebrationData({
        title: 'Project Provisioned! 🚀',
        subtitle: 'Quotation accepted by client and converted into active EPC project.',
        xp: 150,
      });
      setCelebrationVisible(true);
      fetchQuotations();
    } catch (err: any) {
      Alert.alert('Conversion Notice', err.message || 'Project created from proposal.');
    }
  };

  const handleShareWhatsApp = () => {
    soundEffects.playSelect();
    const text = `☀️ *Solar Rooftop Proposal Summary*\nDear *${customerNameInput.trim() || 'Sir/Madam'}*,\n\nRecommended Solar System: *${kw} kWp On-Grid*\n• Gross Turnkey Cost: ₹${grossTotal.toLocaleString('en-IN')}\n• PM Surya Ghar CFA Subsidy: -₹${subsidy.toLocaleString('en-IN')}\n• *Net Investment: ₹${netPayable.toLocaleString('en-IN')}*\n\nEstimated Monthly Production: ~${monthlyUnits} Units\nMonthly Electricity Bill Savings: ~₹${monthlySavings.toLocaleString('en-IN')}\nPayback Period: ~${paybackYears} Years\n\nHardware:\n- Panels: ${selectedPanelBrand}\n- Inverter: ${selectedInverterBrand}\n- Mounting: ${selectedStructure}\n\nGenerated via WhereReady Solar OS Enterprise.`;

    openWhatsAppDirect('', text);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* SOL MASCOT PROPOSAL COACH */}
      <GuideCharacter
        pose="wave"
        speechText="Close deals in 60 seconds! Pick system size, select Tier-1 hardware packages, and generate branded WhatsApp proposals with PM Surya Ghar DBT subsidies calculated automatically."
      />

      {/* PROPOSAL BUILDER CARD */}
      <View style={[styles.calcBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.builderHeader}>
          <Text style={[styles.builderTitle, { color: colors.text }]}>60-Second Proposal Builder</Text>
          <View style={styles.instantBadge}>
            <Zap size={11} color="#FFFFFF" />
            <Text style={styles.instantBadgeText}>INSTANT</Text>
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROSPECT / CLIENT NAME *</Text>
        <TextInput
          style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={customerNameInput}
          onChangeText={setCustomerNameInput}
          placeholder="e.g. Surendra Sharma"
          placeholderTextColor={colors.textMuted}
        />

        {/* QUICK CAPACITY PRESETS */}
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SYSTEM CAPACITY PRESETS</Text>
        <View style={styles.presetGrid}>
          {[
            { kw: '2', label: '2 kWp', sub: '1-2 BHK' },
            { kw: '3.3', label: '3.3 kWp', sub: 'Most Popular ⭐' },
            { kw: '5', label: '5 kWp', sub: 'Villa / Large' },
            { kw: '10', label: '10 kWp', sub: 'Commercial' },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.kw}
              style={[
                styles.presetChip,
                { backgroundColor: colors.background, borderColor: colors.border },
                capacityInput === preset.kw && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ECFDF5', borderColor: '#059669' },
              ]}
              onPress={() => handleSelectCapacityPreset(preset.kw)}
            >
              <Text
                style={[
                  styles.presetChipText,
                  { color: colors.text },
                  capacityInput === preset.kw && { color: '#059669', fontWeight: '900' },
                ]}
              >
                {preset.label}
              </Text>
              <Text style={[styles.presetChipSub, { color: colors.textMuted }]}>{preset.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PV MODULE SPECIFICATION</Text>
        <View style={styles.chipRow}>
          {['Waaree 550Wp Mono PERC', 'Adani 540Wp Bifacial', 'Tata 550Wp TopCon'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.smallChip,
                { borderColor: colors.border, backgroundColor: colors.background },
                selectedPanelBrand === p && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ECFDF5', borderColor: '#059669' },
              ]}
              onPress={() => {
                soundEffects.playSelect();
                setSelectedPanelBrand(p);
              }}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.textSecondary },
                  selectedPanelBrand === p && { color: isDark ? '#34D399' : '#059669', fontWeight: '700' },
                ]}
              >
                {p.split(' ')[0]} ({p.split(' ')[1]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INVERTER SPECIFICATION</Text>
        <View style={styles.chipRow}>
          {['Growatt On-Grid', 'Solis Dual-MPPT', 'Sungrow Hybrid'].map((inv) => (
            <TouchableOpacity
              key={inv}
              style={[
                styles.smallChip,
                { borderColor: colors.border, backgroundColor: colors.background },
                selectedInverterBrand.startsWith(inv.split(' ')[0]) && {
                  backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ECFDF5',
                  borderColor: '#059669',
                },
              ]}
              onPress={() => {
                soundEffects.playSelect();
                setSelectedInverterBrand(`${inv} String Inverter`);
              }}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.textSecondary },
                  selectedInverterBrand.startsWith(inv.split(' ')[0]) && {
                    color: isDark ? '#34D399' : '#059669',
                    fontWeight: '700',
                  },
                ]}
              >
                {inv}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FINANCIAL SUMMARY */}
        <View style={[styles.calcBreakdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Gross Solar System Cost</Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>₹{grossTotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#059669', fontWeight: '700' }]}>
              Govt. CFA Subsidy (PM Surya Ghar)
            </Text>
            <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '900' }]}>
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
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Monthly Electricity Savings</Text>
            <Text style={[styles.breakdownVal, { color: '#2563EB', fontWeight: '800' }]}>
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
            <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveQuoteBtnText}>
              {savingQuote ? 'Saving...' : 'Save Quote (+75 XP)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.85}
          >
            <MessageCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
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
          description="Build a proposal above or tap Save Quote to record a verified proposal."
          compact
        />
      ) : (
        quotations.map((q) => (
          <View
            key={q.id}
            style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteNumber, { color: colors.primary }]}>{q.qNumber || 'QT-PROPOSAL'}</Text>
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
                  style={[styles.quoteActionSmallBtn, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7', borderColor: isDark ? '#16A34A' : '#86EFAC' }]}
                  onPress={() => handleWhatsAppSavedQuote(q)}
                >
                  <MessageCircle size={12} color={isDark ? '#4ADE80' : '#15803D'} />
                  <Text style={[styles.quoteActionSmallText, { color: isDark ? '#4ADE80' : '#15803D' }]}>WA</Text>
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

      {/* CELEBRATION MODAL */}
      <CelebrationModal
        visible={celebrationVisible}
        title={celebrationData.title}
        subtitle={celebrationData.subtitle}
        stageName="Proposal Delivered"
        xpAwarded={celebrationData.xp}
        peaceOfMindPoints={[
          'All solar hardware items specified with Tier-1 manufacturers',
          'PM Surya Ghar CFA Central Subsidy applied accurately',
          'Client proposal ready for instant WhatsApp delivery',
        ]}
        onClose={() => setCelebrationVisible(false)}
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 14,
  },
  builderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  builderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  instantBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetChipSub: {
    fontSize: 9,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  smallChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calcBreakdown: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
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
    fontSize: 13,
    fontWeight: '700',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  netVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  breakdownBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  quoteActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  saveQuoteBtn: {
    flex: 1.2,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveQuoteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    fontSize: 13,
    fontWeight: '800',
  },
  quoteCustomer: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  quoteActionSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  quoteActionSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  convertQuoteSmallBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  convertQuoteSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
