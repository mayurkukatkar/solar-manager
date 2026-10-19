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
} from 'lucide-react-native';
import { generateQuotationHtml, createAndSharePdf } from '../../services/pdfService';
import { openWhatsAppWithPitch } from '../../services/whatsappService';

export const QuickQuoteScreen: React.FC<{ route?: any }> = ({ route }) => {
  const initialParams = route?.params || {};
  const [prospectName, setProspectName] = useState(initialParams.prospectName || initialParams.lead?.name || '');
  const [prospectPhone, setProspectPhone] = useState(initialParams.prospectPhone || initialParams.lead?.mobile || '');
  const [monthlyBill, setMonthlyBill] = useState(initialParams.monthlyBill || (initialParams.lead?.monthlyBill ? String(initialParams.lead.monthlyBill) : '3500'));
  const [capacityKw, setCapacityKw] = useState(initialParams.capacityKw || (initialParams.lead?.estimatedCap ? String(initialParams.lead.estimatedCap) : '3.3'));
  const [pricePerKw, setPricePerKw] = useState('56000');
  const [generating, setGenerating] = useState(false);

  React.useEffect(() => {
    if (route?.params) {
      const p = route.params;
      const lead = p.lead;
      if (p.prospectName || lead?.name) setProspectName(p.prospectName || lead.name);
      if (p.prospectPhone || lead?.mobile) setProspectPhone(p.prospectPhone || lead.mobile);
      if (p.monthlyBill || lead?.monthlyBill) setMonthlyBill(String(p.monthlyBill || lead.monthlyBill));
      if (p.capacityKw || lead?.estimatedCap) setCapacityKw(String(p.capacityKw || lead.estimatedCap));
    }
  }, [route?.params]);

  // Calculations
  const cap = parseFloat(capacityKw) || 3.3;
  const rate = parseFloat(pricePerKw) || 56000;
  const gross = Math.round(cap * rate);

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

  // Auto-adjust capacity when bill changes
  const handleBillChange = (val: string) => {
    setMonthlyBill(val);
    const billNum = parseFloat(val);
    if (!isNaN(billNum) && billNum > 0) {
      const rec = Math.max(1, Math.min(25, (billNum / 8.5) / 120));
      setCapacityKw(rec.toFixed(1));
    }
  };

  const handleShareQuote = async () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    setGenerating(true);
    try {
      const html = generateQuotationHtml({
        quotationNumber: `QQ-${Date.now().toString().slice(-6)}`,
        quotationDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        companyName: 'SolarManager Solutions Pvt Ltd',
        companyAddress: 'Corporate Office, Pune 411038',
        companyPhone: '+91 98765 43210',
        companyEmail: 'contact@solarmanager.in',
        customerName: prospectName,
        customerPhone: prospectPhone || '',
        customerAddress: 'Site Location',
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
      });

      await createAndSharePdf(html, `Quick_Quote_${prospectName.replace(/\s+/g, '_')}.pdf`);

      if (prospectPhone.trim().length >= 10) {
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
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not dispatch quick quote');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quick Field Estimator</Text>
          <Text style={styles.headerSubtitle}>
            On-the-spot spot solar proposal & subsidy calculator
          </Text>
        </View>
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
                onChangeText={setCapacityKw}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.label}>Rate (₹ / kWp)</Text>
              <TextInput
                style={styles.input}
                value={pricePerKw}
                onChangeText={setPricePerKw}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* ECONOMICS HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>Turnkey Plant Cost</Text>
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
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShareQuote}
          disabled={generating}
          activeOpacity={0.85}
        >
          {generating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <MessageCircle size={18} color="#ffffff" />
              <Text style={styles.shareBtnText}>Generate & Share Proposal</Text>
            </>
          )}
        </TouchableOpacity>
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
  shareBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
