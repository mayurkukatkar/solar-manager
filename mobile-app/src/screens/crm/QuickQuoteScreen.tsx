import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Calculator,
  Zap,
  Sparkles,
  FileText,
  MessageCircle,
  Share2,
  TrendingDown,
  Percent,
  Eye,
  CheckCircle2,
} from 'lucide-react-native';
import { generateQuotationHtml, previewPdf, sharePdfFile, createAndSharePdf } from '../../services/pdfService';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { quotationsApi } from '../../api/endpoints';

export const QuickQuoteScreen: React.FC<{ route?: any }> = ({ route }) => {
  const initialParams = route?.params || {};
  const [prospectName, setProspectName] = useState(initialParams.prospectName || initialParams.lead?.name || '');
  const [prospectPhone, setProspectPhone] = useState(initialParams.prospectPhone || initialParams.lead?.mobile || '');
  const [monthlyBill, setMonthlyBill] = useState(initialParams.monthlyBill || (initialParams.lead?.monthlyBill ? String(initialParams.lead.monthlyBill) : '3500'));
  const defaultCap = initialParams.capacityKw || (initialParams.lead?.estimatedCap ? String(initialParams.lead.estimatedCap) : '3.3');
  const [capacityKw, setCapacityKw] = useState(defaultCap);
  const initialCapNum = parseFloat(defaultCap) || 3.3;
  const [systemCost, setSystemCost] = useState(
    initialParams.systemCost || String(Math.round(initialCapNum * 58000))
  );
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedQuote, setSyncedQuote] = useState<any>(null);

  React.useEffect(() => {
    if (route?.params) {
      const p = route.params;
      const lead = p.lead;
      if (p.prospectName || lead?.name) setProspectName(p.prospectName || lead.name);
      if (p.prospectPhone || lead?.mobile) setProspectPhone(p.prospectPhone || lead.mobile);
      if (p.monthlyBill || lead?.monthlyBill) setMonthlyBill(String(p.monthlyBill || lead.monthlyBill));
      if (p.capacityKw || lead?.estimatedCap) {
        const c = String(p.capacityKw || lead.estimatedCap);
        setCapacityKw(c);
        const cNum = parseFloat(c) || 3.3;
        setSystemCost(String(Math.round(cNum * 58000)));
      }
    }
  }, [route?.params]);

  // Calculations: Single input drives turnkey pricing (All GST Included)
  const cap = parseFloat(capacityKw) || 3.3;
  const gross = parseFloat(systemCost) || Math.round(cap * 58000);

  const computeSubsidy = (kw: number): number => {
    if (kw <= 0) return 0;
    if (kw <= 1) return 30000;
    if (kw <= 2) return 60000;
    return 78000;
  };

  const subsidy = computeSubsidy(cap);
  const net = Math.max(0, gross - subsidy);

  const monthlyUnits = Math.round(cap * 120);
  const annualUnits = Math.round(cap * 1460);
  const monthlySavings = Math.round(monthlyUnits * 8.5);
  const lifetimeSavings = Math.round(annualUnits * 25 * 8.5 * 0.92);
  const paybackYears = Number((net / (monthlySavings * 12)).toFixed(1));

  // Auto-adjust capacity & suggested system cost when bill changes
  const handleBillChange = (val: string) => {
    setMonthlyBill(val);
    const billNum = parseFloat(val);
    if (!isNaN(billNum) && billNum > 0) {
      const rec = Math.max(1, Math.min(25, (billNum / 8.5) / 120));
      const formattedCap = rec.toFixed(1);
      setCapacityKw(formattedCap);
      setSystemCost(String(Math.round(parseFloat(formattedCap) * 58000)));
    }
  };

  const handleCapacityChange = (val: string) => {
    setCapacityKw(val);
    const cNum = parseFloat(val);
    if (!isNaN(cNum) && cNum > 0) {
      setSystemCost(String(Math.round(cNum * 58000)));
    }
  };

  const buildPdfPayload = () => ({
    quotationNumber: syncedQuote?.qNumber || `QQ-${Date.now().toString().slice(-6)}`,
    quotationDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    companyName: 'SolarManager Solutions Pvt Ltd',
    companyAddress: 'Corporate Office, Pune 411038',
    companyPhone: '+91 98765 43210',
    companyEmail: 'contact@solarmanager.in',
    customerName: prospectName,
    customerPhone: prospectPhone || '',
    customerAddress: 'Site Location, Maharashtra',
    systemCapacityKw: cap,
    grossAmount: gross,
    subsidyAmount: subsidy,
    netPayable: net,
    monthlyGenerationUnits: monthlyUnits,
    annualGenerationUnits: annualUnits,
    currentMonthlyBill: parseFloat(monthlyBill) || monthlySavings,
    estimatedMonthlyBill: 150,
    monthlySavings,
    lifetimeSavings,
    paybackYears: isNaN(paybackYears) ? 3.5 : paybackYears,
    co2ReductionKg: Math.round(annualUnits * 0.82),
    treeEquivalent: Math.round((annualUnits * 0.82) / 20),
    bankDetails: {
      accountName: 'SolarManager Solutions Pvt Ltd',
      bankName: 'HDFC Bank',
      accountNumber: '50200088992211',
      ifsc: 'HDFC0001234',
      upiId: 'solarmanager@hdfcbank',
    },
  });

  const syncToBackend = async (statusOverride = 'SENT') => {
    if (!prospectName.trim()) return null;
    try {
      setSyncing(true);
      const res = await quotationsApi.createQuotation({
        newCustomer: {
          name: prospectName.trim(),
          mobile: prospectPhone.trim(),
          address: 'Site Location, Maharashtra',
        },
        customerName: prospectName.trim(),
        customerPhone: prospectPhone.trim(),
        systemCapacity: cap,
        totalSystemCost: gross,
        status: statusOverride,
        panelBrand: 'Waaree 540W Mono PERC Bifacial',
        inverterBrand: 'Solis 3.3kW On-Grid Inverter',
        structureBrand: 'Elevated HDG Structure',
        validityDays: 15,
      });

      if (res?.quotation) {
        setSyncedQuote(res.quotation);
        return res.quotation;
      }
    } catch (err: any) {
      console.warn('Quick quote cloud sync notice:', err?.message);
    } finally {
      setSyncing(false);
    }
    return null;
  };

  const handlePreviewPdf = async () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    setGeneratingPdf(true);
    try {
      if (!syncedQuote) {
        syncToBackend('VIEWED').catch(() => {});
      }
      const payload = buildPdfPayload();
      const html = generateQuotationHtml(payload);
      await previewPdf(html);
    } catch (err: any) {
      Alert.alert('Preview Error', err.message || 'Could not launch PDF preview');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    setSharingWhatsApp(true);
    try {
      const saved = await syncToBackend('SENT');
      const quoteNumber = saved?.qNumber || syncedQuote?.qNumber || `QQ-${Date.now().toString().slice(-6)}`;
      const payload = buildPdfPayload();
      payload.quotationNumber = quoteNumber;

      await openWhatsAppWithPitch({
        customerName: prospectName,
        customerPhone: prospectPhone,
        systemCapacityKw: cap,
        grossAmount: gross,
        subsidyAmount: subsidy,
        netPayable: net,
        monthlySavings,
        lifetimeSavings,
        companyName: 'SolarManager Solutions',
        repName: 'Solar Field Executive',
        language: 'EN',
      });
    } catch (err: any) {
      Alert.alert('WhatsApp Dispatch Error', err.message || 'Could not launch WhatsApp');
    } finally {
      setSharingWhatsApp(false);
    }
  };

  const handleSharePdfFile = async () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    setSharingPdf(true);
    try {
      if (!syncedQuote) {
        syncToBackend('SENT').catch(() => {});
      }
      const payload = buildPdfPayload();
      const html = generateQuotationHtml(payload);
      await sharePdfFile(html, `Quick_Quote_${prospectName.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Could not export proposal PDF');
    } finally {
      setSharingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Quick Field Estimator</Text>
          <Text style={styles.headerSubtitle}>
            On-the-spot solar proposal & subsidy calculator
          </Text>
        </View>
        {syncedQuote ? (
          <View style={styles.badgeSynced}>
            <CheckCircle2 size={12} color="#15803d" />
            <Text style={styles.badgeSyncedText}>Web: {syncedQuote.qNumber}</Text>
          </View>
        ) : syncing ? (
          <View style={styles.badgeSyncing}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.badgeSyncingText}>Syncing...</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* INPUTS CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Prospect / Client Name *</Text>
          <TextInput
            style={styles.input}
            value={prospectName}
            onChangeText={setProspectName}
            placeholder="e.g. Suresh Deshmukh"
          />

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={prospectPhone}
                onChangeText={setProspectPhone}
                placeholder="10-digit number"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.label}>Current Monthly Bill (₹)</Text>
              <TextInput
                style={styles.inputHighlight}
                value={monthlyBill}
                onChangeText={handleBillChange}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.label}>System Capacity (kWp)</Text>
              <TextInput
                style={styles.inputHighlight}
                value={capacityKw}
                onChangeText={handleCapacityChange}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* SINGLE PRICING INPUT: SOLAR SYSTEM COST (INCL. ALL GST) */}
          <View style={styles.systemCostBox}>
            <View style={styles.costTitleRow}>
              <Text style={styles.costPrimaryLabel}>Solar System Cost (Incl. All GST) *</Text>
              <View style={styles.gstTag}>
                <Text style={styles.gstTagText}>GST Included</Text>
              </View>
            </View>
            <View style={styles.costInputRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.costInput}
                value={systemCost}
                onChangeText={setSystemCost}
                keyboardType="numeric"
                placeholder="e.g. 195000"
              />
            </View>
            <Text style={styles.costHelpText}>
              Turnkey plant price with all taxes. Same total will appear on the final invoice.
            </Text>
          </View>
        </View>

        {/* ECONOMICS HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>Turnkey Plant Cost (All GST Included)</Text>
            <Text style={styles.heroVal}>₹{gross.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.heroRow}>
            <Text style={styles.heroLabelGreen}>PM Surya Ghar Subsidy</Text>
            <Text style={styles.heroValGreen}>-₹{subsidy.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.netRow}>
            <View>
              <Text style={styles.netLabel}>Net Customer Investment</Text>
              <Text style={styles.netSub}>After direct bank credit</Text>
            </View>
            <Text style={styles.netVal}>₹{net.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* SAVINGS MATRIX */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsCol}>
            <Text style={styles.savingsLabel}>Est. Monthly Gen</Text>
            <Text style={styles.savingsVal}>{monthlyUnits} Units</Text>
          </View>
          <View style={styles.savingsCol}>
            <Text style={styles.savingsLabel}>Monthly Bill Saved</Text>
            <Text style={styles.savingsValGreen}>₹{monthlySavings.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.savingsCol}>
            <Text style={styles.savingsLabel}>Payback ROI</Text>
            <Text style={styles.savingsValBlue}>{paybackYears} Yrs</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION */}
      <View style={styles.bottomBar}>
        <View style={styles.actionRowTop}>
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={handlePreviewPdf}
            disabled={generatingPdf}
            activeOpacity={0.8}
          >
            {generatingPdf ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <>
                <Eye size={16} color="#0f172a" />
                <Text style={styles.pdfBtnText}>Preview PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleSendWhatsApp}
            disabled={sharingWhatsApp}
            activeOpacity={0.85}
          >
            {sharingWhatsApp ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MessageCircle size={18} color="#ffffff" />
                <Text style={styles.whatsAppBtnText}>Send WhatsApp</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareFileBtn}
            onPress={handleSharePdfFile}
            disabled={sharingPdf}
            activeOpacity={0.8}
          >
            {sharingPdf ? (
              <ActivityIndicator size="small" color="#334155" />
            ) : (
              <>
                <Share2 size={16} color="#334155" />
                <Text style={styles.shareFileBtnText}>Share PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  formCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 10,
  },
  inputHighlight: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '800',
    marginBottom: 10,
  },
  systemCostBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 6,
  },
  costTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costPrimaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14532d',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gstTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  gstTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  costInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rupeeSymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803d',
    marginRight: 6,
  },
  costInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    paddingVertical: 10,
  },
  costHelpText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '500',
    lineHeight: 15,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  heroVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroLabelGreen: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '600',
  },
  heroValGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4ade80',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 10,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  netSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  netVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38bdf8',
  },
  savingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  savingsCol: {
    flex: 1,
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  savingsVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
  },
  savingsValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 3,
  },
  savingsValBlue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 3,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowTop: {
    flexDirection: 'row',
    gap: 10,
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pdfBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  whatsAppBtn: {
    flex: 1.5,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsAppBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  shareFileBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  shareFileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  badgeSynced: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeSyncedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  badgeSyncing: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeSyncingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
});
