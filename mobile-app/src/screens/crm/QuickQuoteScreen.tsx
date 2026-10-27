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
  Platform,
  Modal,
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
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  Layers,
  ShieldCheck,
  Building,
  Plus,
  Edit3,
  Sliders,
  X,
  Tag,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { generateQuotationHtml, sharePdfFile, printDirectly, QuotationPdfProps } from '../../services/pdfService';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { quotationsApi } from '../../api/endpoints';
import { ProposalPreviewModal } from '../../components/ProposalPreviewModal';
import { SafeStorage } from '../../api/client';

export interface DynamicGearItem {
  id: string;
  name: string;
  brand: string;
  wattage?: number;
  subtitle: string;
  tag: string;
  isCustom?: boolean;
}

export const DEFAULT_PANEL_OPTIONS: DynamicGearItem[] = [
  {
    id: 'waaree_540',
    name: 'Waaree 540W Mono PERC Bifacial',
    brand: 'Waaree',
    wattage: 540,
    subtitle: '25 Years Warranty • DCR ALMM Approved • High Yield',
    tag: 'DCR Tier-1',
  },
  {
    id: 'adani_545',
    name: 'Adani 545W TopCon DCR Bifacial',
    brand: 'Adani',
    wattage: 545,
    subtitle: 'N-Type TopCon Cells • 30 Years Linear Warranty',
    tag: 'N-Type TOPCon',
  },
  {
    id: 'tata_545',
    name: 'Tata Power 545W Mono PERC DCR',
    brand: 'Tata Power Solar',
    wattage: 545,
    subtitle: 'Tier-1 High Reliability • 25 Years Performance Guarantee',
    tag: 'Tata Tier-1',
  },
  {
    id: 'vikram_540',
    name: 'Vikram Solar 540W Suryava Bifacial',
    brand: 'Vikram Solar',
    wattage: 540,
    subtitle: 'ALMM Listed • High Wind & Snow Load Certified',
    tag: 'ALMM Listed',
  },
  {
    id: 'goldi_545',
    name: 'Goldi 545W HELOC Plus Mono Bifacial',
    brand: 'Goldi Solar',
    wattage: 545,
    subtitle: 'Multi-Busbar Technology • Low Degradation',
    tag: 'MBB Tech',
  },
  {
    id: 'premier_545',
    name: 'Premier Energies 545W DCR Bifacial',
    brand: 'Premier Energies',
    wattage: 545,
    subtitle: 'DCR Cell & Module • High Temp Coefficient',
    tag: 'DCR Compliant',
  },
  {
    id: 'rayzon_545',
    name: 'Rayzon 545W Mono PERC Bifacial',
    brand: 'Rayzon Solar',
    wattage: 545,
    subtitle: 'MNRE / ALMM Approved • Indian Manufacturing',
    tag: 'ALMM Listed',
  },
];

export const DEFAULT_INVERTER_OPTIONS: DynamicGearItem[] = [
  {
    id: 'solis_smart',
    name: 'Solis Dual MPPT Smart Inverter',
    brand: 'Solis',
    subtitle: 'Dual MPPT • 10 Years Warranty • WiFi Telemetry',
    tag: 'Dual MPPT',
  },
  {
    id: 'growatt_smart',
    name: 'Growatt Smart On-Grid Inverter',
    brand: 'Growatt',
    subtitle: 'Integrated DC Switch • 98.4% Efficiency • Remote Monitoring',
    tag: 'High Yield',
  },
  {
    id: 'polycab_grid',
    name: 'Polycab Solar Grid-Tied Inverter',
    brand: 'Polycab',
    subtitle: 'BIS Approved • Rugged Heavy Duty Indian Grid Design',
    tag: 'BIS Certified',
  },
  {
    id: 'sungrow_string',
    name: 'Sungrow Dual MPPT String Inverter',
    brand: 'Sungrow',
    subtitle: 'Max 98.6% Efficiency • Smart IV Curve Diagnosis',
    tag: 'Global #1',
  },
  {
    id: 'goodwe_smart',
    name: 'GoodWe Smart On-Grid Inverter',
    brand: 'GoodWe',
    subtitle: 'IP65 Water Resistant • Built-in Surge Protection Type II',
    tag: 'Type II SPD',
  },
  {
    id: 'deye_grid',
    name: 'Deye On-Grid High Efficiency Inverter',
    brand: 'Deye',
    subtitle: 'Dual MPPT • LCD Screen Display & App Control',
    tag: 'Smart Display',
  },
  {
    id: 'havells_enviro',
    name: 'Havells Enviro Grid-Tied Inverter',
    brand: 'Havells',
    subtitle: '10 Years Replacement Warranty • Native Indian Grid Ready',
    tag: '10-Yr Warranty',
  },
];

export const QuickQuoteScreen: React.FC<{ navigation?: any; route?: any }> = ({ navigation, route }) => {
  const initialParams = route?.params || {};
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [panelBrand, setPanelBrand] = useState('Waaree 540W Mono PERC Bifacial');
  const [inverterBrand, setInverterBrand] = useState('Solis Dual MPPT On-Grid');
  const [structureType, setStructureType] = useState('Elevated HDG Structure');
  const [customPanels, setCustomPanels] = useState<DynamicGearItem[]>([]);
  const [customInverters, setCustomInverters] = useState<DynamicGearItem[]>([]);
  const [gearModalVisible, setGearModalVisible] = useState(false);
  const [gearModalType, setGearModalType] = useState<'PANEL' | 'INVERTER'>('PANEL');
  const [customGearName, setCustomGearName] = useState('');
  const [customGearWattage, setCustomGearWattage] = useState('550');
  const [customGearSubtitle, setCustomGearSubtitle] = useState('');
  const [customGearTag, setCustomGearTag] = useState('');
  const [prospectName, setProspectName] = useState(initialParams.prospectName || initialParams.lead?.name || '');
  const [prospectPhone, setProspectPhone] = useState(initialParams.prospectPhone || initialParams.lead?.mobile || '');
  const [monthlyBill, setMonthlyBill] = useState(initialParams.monthlyBill || (initialParams.lead?.monthlyBill ? String(initialParams.lead.monthlyBill) : '3500'));
  const defaultCap = initialParams.capacityKw || (initialParams.lead?.estimatedCap ? String(initialParams.lead.estimatedCap) : '3.3');
  const [capacityKw, setCapacityKw] = useState(defaultCap);
  const initialCapNum = parseFloat(defaultCap) || 3.3;
  const [systemCost, setSystemCost] = useState(
    initialParams.systemCost || String(Math.round(initialCapNum * 58000))
  );
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const [sharingWhatsAppPdf, setSharingWhatsAppPdf] = useState(false);
  const [sendingPitchText, setSendingPitchText] = useState(false);
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

  const allPanels: DynamicGearItem[] = [...DEFAULT_PANEL_OPTIONS, ...customPanels];
  const allInverters: DynamicGearItem[] = [...DEFAULT_INVERTER_OPTIONS, ...customInverters];

  React.useEffect(() => {
    (async () => {
      try {
        const storedPanels = await SafeStorage.getItem('@solar_custom_modules');
        if (storedPanels) {
          const parsed = JSON.parse(storedPanels);
          if (Array.isArray(parsed)) setCustomPanels(parsed);
        }
        const storedInverters = await SafeStorage.getItem('@solar_custom_inverters');
        if (storedInverters) {
          const parsed = JSON.parse(storedInverters);
          if (Array.isArray(parsed)) setCustomInverters(parsed);
        }
      } catch (err) {
        console.warn('Failed to load custom gear:', err);
      }
    })();
  }, []);

  const handleOpenAddGear = (type: 'PANEL' | 'INVERTER') => {
    setGearModalType(type);
    setCustomGearName('');
    setCustomGearWattage(type === 'PANEL' ? '550' : '');
    setCustomGearSubtitle(
      type === 'PANEL'
        ? '25 Years Linear Warranty • Tier-1 ALMM Approved'
        : '10 Years Replacement Warranty • Dual MPPT'
    );
    setCustomGearTag(type === 'PANEL' ? 'Custom Tier-1' : 'Custom');
    setGearModalVisible(true);
  };

  const handleSaveCustomGear = async () => {
    if (!customGearName.trim()) {
      Alert.alert('Name Required', 'Please enter the make / model name.');
      return;
    }
    if (gearModalType === 'PANEL') {
      const parsedW = parseInt(customGearWattage) || 545;
      const newItem: DynamicGearItem = {
        id: `custom_p_${Date.now()}`,
        name: customGearName.trim(),
        brand: customGearName.trim().split(' ')[0] || 'Custom',
        wattage: parsedW,
        subtitle: customGearSubtitle.trim() || `${parsedW}W High Yield DCR Approved Module`,
        tag: customGearTag.trim() || 'Custom DCR',
        isCustom: true,
      };
      const updated = [...customPanels, newItem];
      setCustomPanels(updated);
      setPanelBrand(newItem.name);
      try {
        await SafeStorage.setItem('@solar_custom_modules', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    } else {
      const newItem: DynamicGearItem = {
        id: `custom_inv_${Date.now()}`,
        name: customGearName.trim(),
        brand: customGearName.trim().split(' ')[0] || 'Custom',
        subtitle: customGearSubtitle.trim() || 'Smart On-Grid Inverter • WiFi Telemetry',
        tag: customGearTag.trim() || 'Custom Inverter',
        isCustom: true,
      };
      const updated = [...customInverters, newItem];
      setCustomInverters(updated);
      setInverterBrand(newItem.name);
      try {
        await SafeStorage.setItem('@solar_custom_inverters', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
    setGearModalVisible(false);
  };

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

  const buildPdfPayload = (): QuotationPdfProps => {
    const subtotal = Math.round(gross / 1.138);
    const taxAmount = gross - subtotal;
    const matchedPanel = allPanels.find((p) => p.name === panelBrand);
    const parsedWattage =
      matchedPanel?.wattage ||
      (() => {
        const m = panelBrand.match(/(\d{3})\s*W/i);
        return m ? Number(m[1]) : 545;
      })();
    return {
      quotationNumber: syncedQuote?.qNumber || `QQ-${Date.now().toString().slice(-6)}`,
      quotationDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      templateType: 'quick_quote',
      primaryColor: '#0284c7',
      accentColor: '#059669',
      companyName: 'WhereReady Solar OS',
      companyLegalName: 'WhereReady Solar Technologies Pvt Ltd',
      companyAddress: 'Corporate Tower, MIDC Tech Park, Pune 411038',
      companyPhone: '+91 98220 12345',
      companyEmail: 'proposals@wherereadysolar.com',
      companyGstin: '27AAECW1234F1Z5',
      customerName: prospectName,
      customerPhone: prospectPhone || '',
      customerAddress: initialParams.lead?.address || 'Site Location, Maharashtra',
      consumerNumber: initialParams.lead?.consumerNumber,
      discomName: initialParams.lead?.discomName || 'MSEDCL',
      systemCapacityKw: cap,
      inverterCapacityKw: cap,
      panelBrand,
      panelWattage: parsedWattage,
      panelQuantity: Math.ceil((cap * 1000) / parsedWattage),
      panelWarranty: matchedPanel?.subtitle || '25 Years Performance',
      inverterBrand,
      inverterWarranty: '10 Years Replacement',
      structureType,
      structureWarranty: '10 Years Structural',
      grossAmount: gross,
      subtotal,
      taxAmount,
      subsidyAmount: subsidy,
      netPayable: net,
      discount: 0,
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
        accountName: 'WhereReady Solar Technologies Pvt Ltd',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200088992211',
        ifsc: 'HDFC0001234',
        upiId: 'solar@hdfcbank',
      },
    };
  };

  const syncToBackend = async (statusOverride = 'SENT') => {
    if (!prospectName.trim()) return null;
    try {
      setSyncing(true);
      const res = await quotationsApi.createQuotation({
        leadId: initialParams.lead?.id,
        customerId: initialParams.lead?.customerId,
        newCustomer: (!initialParams.lead?.id && !initialParams.lead?.customerId) ? {
          name: prospectName.trim(),
          mobile: prospectPhone.trim(),
          address: initialParams.lead?.address || 'Site Location, Maharashtra',
        } : undefined,
        customerName: prospectName.trim(),
        customerPhone: prospectPhone.trim(),
        systemCapacity: cap,
        totalSystemCost: gross,
        status: statusOverride,
        templateType: 'quick_quote',
        panelBrand,
        inverterBrand,
        structureBrand: structureType,
        consumerNumber: initialParams.lead?.consumerNumber,
        discom: initialParams.lead?.discomName || 'MSEDCL',
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

  const handlePreviewPdf = () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    if (!syncedQuote) {
      syncToBackend('VIEWED').catch(() => {});
    }
    setShowVisualPreview(true);
  };

  const handleShareWhatsAppPdf = async () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    setSharingWhatsAppPdf(true);
    try {
      const saved = await syncToBackend('SENT');
      const quoteNumber = saved?.qNumber || syncedQuote?.qNumber || `QQ-${Date.now().toString().slice(-6)}`;
      const payload = buildPdfPayload();
      payload.quotationNumber = quoteNumber;

      const html = generateQuotationHtml(payload);
      const fileName = `Solar_Proposal_${prospectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await sharePdfFile(html, fileName, prospectPhone);
    } catch (err: any) {
      Alert.alert('WhatsApp PDF Share Error', err.message || 'Could not export proposal PDF');
    } finally {
      setSharingWhatsAppPdf(false);
    }
  };

  const handleSendTextPitch = async () => {
    if (!prospectName.trim()) {
      Alert.alert('Customer Name', 'Please enter a prospect name for the proposal');
      return;
    }
    setSendingPitchText(true);
    try {
      await syncToBackend('SENT');
      await openWhatsAppWithPitch({
        customerName: prospectName,
        customerPhone: prospectPhone,
        systemCapacityKw: cap,
        grossAmount: gross,
        subsidyAmount: subsidy,
        netPayable: net,
        monthlySavings,
        lifetimeSavings,
        companyName: 'WhereReady Solar OS',
        repName: 'Solar Field Executive',
        language: 'EN',
      });
    } catch (err: any) {
      Alert.alert('WhatsApp Text Pitch Error', err.message || 'Could not launch WhatsApp');
    } finally {
      setSendingPitchText(false);
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
      await sharePdfFile(html, `Quick_Quote_${prospectName.replace(/\s+/g, '_')}.pdf`, prospectPhone);
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Could not export proposal PDF');
    } finally {
      setSharingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* STANDARDIZED HEADER */}
      <Header
        variant={navigation?.canGoBack?.() ? 'detail' : 'main'}
        title="60s Solar Estimator"
        subtitle="On-the-spot proposal & PM Surya Ghar calculator"
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
        rightAction={
          syncedQuote ? (
            <View style={styles.badgeSynced}>
              <CheckCircle2 size={12} color="#15803d" />
              <Text style={styles.badgeSyncedText}>Web: {syncedQuote.qNumber}</Text>
            </View>
          ) : syncing ? (
            <View style={styles.badgeSyncing}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.badgeSyncingText}>Syncing...</Text>
            </View>
          ) : undefined
        }
      />

      {/* 1. PERSISTENT FLOATING FINANCIAL KPI STRIP (WhereReady Field Experience) */}
      <View style={styles.floatingKpiStrip}>
        <View style={styles.kpiCol}>
          <Text style={styles.kpiColLabel}>CAPACITY</Text>
          <Text style={styles.kpiColVal}>{cap} kWp</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiColLabel}>TURNKEY GROSS</Text>
          <Text style={styles.kpiColVal}>₹{(gross / 1000).toFixed(0)}k</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiColLabel}>DBT SUBSIDY</Text>
          <Text style={[styles.kpiColVal, { color: '#059669' }]}>-₹{(subsidy / 1000).toFixed(0)}k</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiColLabel}>NET PAYABLE</Text>
          <Text style={[styles.kpiColVal, { color: '#0066FF' }]}>₹{(net / 1000).toFixed(0)}k</Text>
        </View>
      </View>

      {/* 2. OLA-INSPIRED GUIDED PROGRESS STEPPER TRACK */}
      <View style={styles.guidedStepperTrack}>
        <TouchableOpacity
          style={[styles.stepTab, currentStep === 1 && styles.stepTabActive]}
          onPress={() => setCurrentStep(1)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumCircle, currentStep === 1 ? styles.stepNumActive : currentStep > 1 ? styles.stepNumDone : styles.stepNumInactive]}>
            {currentStep > 1 ? <Check size={11} color="#ffffff" strokeWidth={3} /> : <Text style={styles.stepNumText}>1</Text>}
          </View>
          <Text style={[styles.stepTabText, currentStep === 1 && styles.stepTabTextActive]}>Customer</Text>
        </TouchableOpacity>

        <View style={[styles.stepConnector, currentStep > 1 && styles.stepConnectorActive]} />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 2 && styles.stepTabActive]}
          onPress={() => setCurrentStep(2)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumCircle, currentStep === 2 ? styles.stepNumActive : currentStep > 2 ? styles.stepNumDone : styles.stepNumInactive]}>
            {currentStep > 2 ? <Check size={11} color="#ffffff" strokeWidth={3} /> : <Text style={styles.stepNumText}>2</Text>}
          </View>
          <Text style={[styles.stepTabText, currentStep === 2 && styles.stepTabTextActive]}>Sizing & Gear</Text>
        </TouchableOpacity>

        <View style={[styles.stepConnector, currentStep > 2 && styles.stepConnectorActive]} />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
          onPress={() => setCurrentStep(3)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumCircle, currentStep === 3 ? styles.stepNumActive : styles.stepNumInactive]}>
            <Text style={styles.stepNumText}>3</Text>
          </View>
          <Text style={[styles.stepTabText, currentStep === 3 && styles.stepTabTextActive]}>Proposal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: PROSPECT & ELECTRICITY BILL */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1 OF 3</Text>
              </View>
              <Text style={styles.stepCardTitle}>Prospect & Consumption Profile</Text>
              <Text style={styles.stepCardSub}>Input client details to auto-size optimal solar capacity</Text>
            </View>

            <Text style={styles.label}>Prospect / Client Name *</Text>
            <TextInput
              style={styles.input}
              value={prospectName}
              onChangeText={setProspectName}
              placeholder="e.g. Suresh Deshmukh"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Mobile Number (WhatsApp Enabled)</Text>
            <TextInput
              style={styles.input}
              value={prospectPhone}
              onChangeText={setProspectPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Current Monthly Electricity Bill (₹) *</Text>
            <TextInput
              style={styles.inputHighlight}
              value={monthlyBill}
              onChangeText={handleBillChange}
              keyboardType="numeric"
              placeholder="e.g. 3500"
            />

            {/* Quick Bill Preset Chips */}
            <View style={styles.chipScrollRow}>
              {['2500', '3500', '5000', '8000', '15000'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, monthlyBill === preset && styles.presetChipActive]}
                  onPress={() => handleBillChange(preset)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetChipText, monthlyBill === preset && styles.presetChipTextActive]}>
                    ₹{parseInt(preset).toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Sizing Intelligence Callout */}
            <View style={styles.aiHintBox}>
              <View style={styles.aiHintHeader}>
                <Sparkles size={13} color="#f59e0b" />
                <Text style={styles.aiHintTitle}>AI SIZING RECOMMENDATION</Text>
              </View>
              <Text style={styles.aiHintBody}>
                A monthly tariff of ₹{monthlyBill || '3,500'} recommends a{' '}
                <Text style={{ fontWeight: '900', color: '#0f172a' }}>{cap} kWp plant</Text>, generating ~
                {monthlyUnits} units/mo to offset ~90% of electricity bills and save ₹{monthlySavings.toLocaleString('en-IN')}/mo.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepNextBtn}
              onPress={() => {
                if (!prospectName.trim()) {
                  Alert.alert('Customer Name Required', 'Please enter prospect name before proceeding.');
                  return;
                }
                setCurrentStep(2);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.stepNextBtnText}>Configure System & Hardware</Text>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: TURNKEY SIZING & HARDWARE SPECIFICATIONS */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2 OF 3</Text>
              </View>
              <Text style={styles.stepCardTitle}>Turnkey Sizing & Equipment Specs</Text>
              <Text style={styles.stepCardSub}>Select Tier-1 DCR solar modules, inverter, and mounting structure</Text>
            </View>

            <Text style={styles.label}>System Capacity (kWp) *</Text>
            <TextInput
              style={styles.inputHighlight}
              value={capacityKw}
              onChangeText={handleCapacityChange}
              keyboardType="decimal-pad"
            />

            {/* Capacity Presets */}
            <View style={styles.chipScrollRow}>
              {['2.0', '3.3', '4.0', '5.0', '10.0'].map((kwPreset) => (
                <TouchableOpacity
                  key={kwPreset}
                  style={[styles.presetChip, capacityKw === kwPreset && styles.presetChipActive]}
                  onPress={() => handleCapacityChange(kwPreset)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetChipText, capacityKw === kwPreset && styles.presetChipTextActive]}>
                    {kwPreset} kWp
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Equipment 1: Modules */}
            <View style={styles.gearHeaderRow}>
              <Text style={styles.label}>Tier-1 DCR Solar Modules</Text>
              <TouchableOpacity
                style={styles.addGearHeaderBtn}
                onPress={() => handleOpenAddGear('PANEL')}
                activeOpacity={0.8}
              >
                <Plus size={12} color="#0066FF" strokeWidth={2.5} />
                <Text style={styles.addGearHeaderBtnText}>+ Add Brand</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gearSelectionCol}>
              {allPanels.map((panel) => {
                const isSelected = panelBrand === panel.name;
                return (
                  <TouchableOpacity
                    key={panel.id}
                    style={[styles.gearCard, isSelected && styles.gearCardActive]}
                    onPress={() => setPanelBrand(panel.name)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gearCardTop}>
                      <View style={styles.gearCardTitleRow}>
                        <Text style={[styles.gearCardTitle, isSelected && styles.gearCardTitleActive]}>
                          {panel.name}
                        </Text>
                        <View style={[styles.gearTagPill, isSelected && styles.gearTagPillActive]}>
                          <Text style={[styles.gearTagPillText, isSelected && styles.gearTagPillTextActive]}>
                            {panel.tag}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={14} color="#0066FF" strokeWidth={3} />}
                    </View>
                    <Text style={styles.gearCardSub}>{panel.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Equipment 2: Inverter */}
            <View style={[styles.gearHeaderRow, { marginTop: 14 }]}>
              <Text style={styles.label}>Grid-Tied Solar Inverter</Text>
              <TouchableOpacity
                style={styles.addGearHeaderBtn}
                onPress={() => handleOpenAddGear('INVERTER')}
                activeOpacity={0.8}
              >
                <Plus size={12} color="#0066FF" strokeWidth={2.5} />
                <Text style={styles.addGearHeaderBtnText}>+ Add Inverter</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gearSelectionCol}>
              {allInverters.map((inv) => {
                const isSelected = inverterBrand === inv.name;
                return (
                  <TouchableOpacity
                    key={inv.id}
                    style={[styles.gearCard, isSelected && styles.gearCardActive]}
                    onPress={() => setInverterBrand(inv.name)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gearCardTop}>
                      <View style={styles.gearCardTitleRow}>
                        <Text style={[styles.gearCardTitle, isSelected && styles.gearCardTitleActive]}>
                          {inv.name}
                        </Text>
                        <View style={[styles.gearTagPill, isSelected && styles.gearTagPillActive]}>
                          <Text style={[styles.gearTagPillText, isSelected && styles.gearTagPillTextActive]}>
                            {inv.tag}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={14} color="#0066FF" strokeWidth={3} />}
                    </View>
                    <Text style={styles.gearCardSub}>{inv.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Turnkey System Pricing Input */}
            <View style={styles.systemCostBox}>
              <View style={styles.costTitleRow}>
                <Text style={styles.costPrimaryLabel}>Turnkey System Cost (Incl. All GST) *</Text>
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
                Turnkey price includes modules, inverter, structure, wiring, and installation.
              </Text>
            </View>

            {/* Step 2 Navigation Buttons */}
            <View style={styles.stepNavRow}>
              <TouchableOpacity
                style={styles.stepBackBtn}
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.8}
              >
                <ChevronLeft size={16} color="#64748b" />
                <Text style={styles.stepBackBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepNextBtnFlex}
                onPress={() => setCurrentStep(3)}
                activeOpacity={0.85}
              >
                <Text style={styles.stepNextBtnText}>Review PM Subsidy & Proposal</Text>
                <ChevronRight size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: PM SURYA GHAR COMMERCIALS & INSTANT PROPOSAL */}
        {currentStep === 3 && (
          <View>
            {/* HERO COMMERCIAL ECONOMICS CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroCardHeader}>
                <View style={styles.heroCardPill}>
                  <Text style={styles.heroCardPillText}>CENTRAL DBT FINANCIAL BREAKDOWN</Text>
                </View>
              </View>

              <View style={styles.heroRow}>
                <Text style={styles.heroLabel}>Turnkey Plant Cost (All GST Included)</Text>
                <Text style={styles.heroVal}>₹{gross.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.heroRow}>
                <Text style={styles.heroLabelGreen}>PM Surya Ghar Central Subsidy</Text>
                <Text style={styles.heroValGreen}>-₹{subsidy.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.netRow}>
                <View>
                  <Text style={styles.netLabel}>Net Customer Investment</Text>
                  <Text style={styles.netSub}>Direct government DBT credit to customer account</Text>
                </View>
                <Text style={styles.netVal}>₹{net.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* SAVINGS & PAYBACK ROI MATRIX */}
            <View style={styles.savingsCard}>
              <View style={styles.savingsCol}>
                <Text style={styles.savingsLabel}>Est. Monthly Gen</Text>
                <Text style={styles.savingsVal}>{monthlyUnits} Units</Text>
              </View>
              <View style={styles.savingsDivider} />
              <View style={styles.savingsCol}>
                <Text style={styles.savingsLabel}>Monthly Tariff Saved</Text>
                <Text style={styles.savingsValGreen}>₹{monthlySavings.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.savingsDivider} />
              <View style={styles.savingsCol}>
                <Text style={styles.savingsLabel}>Payback ROI</Text>
                <Text style={styles.savingsValBlue}>{paybackYears} Yrs</Text>
              </View>
            </View>

            {/* HARDWARE AUDIT SUMMARY CARD */}
            <View style={styles.summaryGearCard}>
              <Text style={styles.summaryGearTitle}>EQUIPMENT SPECIFICATIONS INCLUDED</Text>
              <Text style={styles.summaryGearRow}>• Modules: {panelBrand}</Text>
              <Text style={styles.summaryGearRow}>• Inverter: {inverterBrand}</Text>
              <Text style={styles.summaryGearRow}>• Structure: {structureType}</Text>
              <Text style={styles.summaryGearRow}>• Recipient: {prospectName} ({prospectPhone || 'No Phone'})</Text>

              <TouchableOpacity
                style={styles.modifyGearBtn}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.modifyGearBtnText}>Modify Specs / Pricing ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.actionRowTop}>
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={handlePreviewPdf}
            activeOpacity={0.8}
          >
            <Eye size={16} color="#0f172a" />
            <Text style={styles.pdfBtnText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleShareWhatsAppPdf}
            disabled={sharingWhatsAppPdf}
            activeOpacity={0.85}
          >
            {sharingWhatsAppPdf ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MessageCircle size={17} color="#ffffff" />
                <Text style={styles.whatsAppBtnText}>WhatsApp PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pitchTextBtn}
            onPress={handleSendTextPitch}
            disabled={sendingPitchText}
            activeOpacity={0.85}
          >
            {sendingPitchText ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <>
                <Send size={14} color="#16a34a" />
                <Text style={styles.pitchTextBtnText}>Direct Chat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* IN-APP VISUAL PROPOSAL PREVIEW MODAL */}
      {showVisualPreview && (
        <ProposalPreviewModal
          visible={showVisualPreview}
          onClose={() => setShowVisualPreview(false)}
          data={buildPdfPayload()}
          isSynced={Boolean(syncedQuote)}
        />
      )}

      {/* CUSTOM GEAR SPECIFICATION MODAL */}
      <Modal
        visible={gearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGearModalVisible(false)}
      >
        <View style={styles.gearModalOverlay}>
          <View style={styles.gearModalContent}>
            <View style={styles.gearModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.gearModalTitle}>
                  {gearModalType === 'PANEL' ? 'Add Custom Solar Module' : 'Add Custom Solar Inverter'}
                </Text>
                <Text style={styles.gearModalSubtitle}>
                  {gearModalType === 'PANEL'
                    ? 'Enter custom Tier-1 / ALMM module details & wattage'
                    : 'Enter custom grid-tied inverter make & model'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setGearModalVisible(false)}
                style={styles.gearModalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.gearModalBody}>
              <Text style={styles.modalFieldLabel}>Equipment Name / Model *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={
                  gearModalType === 'PANEL'
                    ? 'e.g. Vikram Solar 550W Mono PERC'
                    : 'e.g. Sungrow 3.3kW Dual MPPT'
                }
                placeholderTextColor="#94a3b8"
                value={customGearName}
                onChangeText={setCustomGearName}
              />

              {gearModalType === 'PANEL' && (
                <>
                  <Text style={styles.modalFieldLabel}>Rated Wattage (Wp) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 550"
                    placeholderTextColor="#94a3b8"
                    value={customGearWattage}
                    onChangeText={setCustomGearWattage}
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={styles.modalFieldLabel}>Warranty / Tech Specifications</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={
                  gearModalType === 'PANEL'
                    ? 'e.g. 25 Years Performance • DCR ALMM'
                    : 'e.g. 10 Years Warranty • Dual MPPT • WiFi'
                }
                placeholderTextColor="#94a3b8"
                value={customGearSubtitle}
                onChangeText={setCustomGearSubtitle}
              />

              <Text style={styles.modalFieldLabel}>Category Badge / Tag</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. DCR Tier-1 or TopCon"
                placeholderTextColor="#94a3b8"
                value={customGearTag}
                onChangeText={setCustomGearTag}
              />
            </View>

            <View style={styles.gearModalFooter}>
              <TouchableOpacity
                style={styles.gearModalCancelBtn}
                onPress={() => setGearModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.gearModalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gearModalSaveBtn}
                onPress={handleSaveCustomGear}
                activeOpacity={0.85}
              >
                <Check size={16} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.gearModalSaveBtnText}>Save & Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
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
    paddingVertical: 12,
    gap: 8,
  },
  actionHintRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 2,
  },
  actionHintText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
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
  pitchTextBtn: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  pitchTextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
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

  // ----------------------------------------------------
  // WHERE READY FIELD EXPERIENCE: GUIDED PROPOSAL STYLES
  // ----------------------------------------------------
  floatingKpiStrip: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiColLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  kpiColVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 1,
  },
  kpiDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#1e293b',
  },
  guidedStepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTabActive: {},
  stepNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumActive: {
    backgroundColor: '#0066FF',
  },
  stepNumDone: {
    backgroundColor: '#059669',
  },
  stepNumInactive: {
    backgroundColor: '#e2e8f0',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  stepTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  stepTabTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  stepConnectorActive: {
    backgroundColor: '#059669',
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  stepCardHeader: {
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0066FF',
    letterSpacing: 0.6,
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  stepCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  chipScrollRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  presetChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  aiHintBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  aiHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiHintTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#d97706',
    letterSpacing: 0.5,
  },
  aiHintBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  stepNextBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  stepNextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  gearSelectionCol: {
    gap: 8,
    marginBottom: 14,
  },
  gearCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  gearCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066FF',
  },
  gearCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  gearCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  gearCardTitleActive: {
    color: '#0066FF',
  },
  gearCardSub: {
    fontSize: 10,
    color: '#64748b',
  },
  stepNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  stepBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  stepNextBtnFlex: {
    flex: 1,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroCardHeader: {
    marginBottom: 10,
  },
  heroCardPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroCardPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  savingsDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#f1f5f9',
  },
  summaryGearCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginTop: 14,
  },
  summaryGearTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  summaryGearRow: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 3,
  },
  modifyGearBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  modifyGearBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  gearHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  addGearHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addGearHeaderBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0066FF',
  },
  gearCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  gearTagPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gearTagPillActive: {
    backgroundColor: '#dbeafe',
  },
  gearTagPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  gearTagPillTextActive: {
    color: '#1d4ed8',
  },
  gearModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gearModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  gearModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  gearModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  gearModalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  gearModalCloseBtn: {
    padding: 4,
  },
  gearModalBody: {
    gap: 10,
    marginBottom: 18,
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  gearModalFooter: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  gearModalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearModalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  gearModalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gearModalSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
