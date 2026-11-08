import React, { useState, useMemo } from 'react';
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
  Zap,
  Sparkles,
  MessageCircle,
  Eye,
  CheckCircle2,
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  AlertTriangle,
  IndianRupee,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { generateQuotationHtml, sharePdfFile, QuotationPdfProps } from '../../services/pdfService';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { quotationsApi } from '../../api/endpoints';
import { ProposalPreviewModal } from '../../components/ProposalPreviewModal';
import { SafeStorage } from '../../api/client';
import { useTheme } from '../../theme';

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
];

export const QuickQuoteScreen: React.FC<{ navigation?: any; route?: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const initialParams = route?.params || {};
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [panelBrand, setPanelBrand] = useState('Waaree 540W Mono PERC Bifacial');
  const [inverterBrand, setInverterBrand] = useState('Solis Dual MPPT Smart Inverter');
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
  const [monthlyBill, setMonthlyBill] = useState(
    initialParams.monthlyBill || (initialParams.lead?.monthlyBill ? String(initialParams.lead.monthlyBill) : '3500')
  );
  const defaultCap = initialParams.capacityKw || (initialParams.lead?.estimatedCap ? String(initialParams.lead.estimatedCap) : '3.3');
  const [capacityKw, setCapacityKw] = useState(defaultCap);
  const [sanctionedLoad, setSanctionedLoad] = useState(
    initialParams.sanctionedLoad || (initialParams.lead?.sanctionedLoad ? String(initialParams.lead.sanctionedLoad) : '5.0')
  );
  const initialCapNum = parseFloat(defaultCap) || 3.3;
  const [systemCost, setSystemCost] = useState(
    initialParams.systemCost || String(Math.round(initialCapNum * 58000))
  );
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const [sharingWhatsAppPdf, setSharingWhatsAppPdf] = useState(false);
  const [sendingPitchText, setSendingPitchText] = useState(false);
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

  // Calculations
  const {
    cap,
    gross,
    subsidy,
    net,
    monthlyUnits,
    annualUnits,
    monthlySavings,
    lifetimeSavings,
    paybackYears,
  } = useMemo(() => {
    const c = parseFloat(capacityKw) || 3.3;
    const g = parseFloat(systemCost) || Math.round(c * 58000);

    let sub = 0;
    if (c > 0) {
      if (c <= 1) sub = 30000;
      else if (c <= 2) sub = 60000;
      else sub = 78000;
    }

    const n = Math.max(0, g - sub);
    const mUnits = Math.round(c * 120);
    const aUnits = Math.round(c * 1460);
    const mSavings = Math.round(mUnits * 8.5);
    const lSavings = Math.round(aUnits * 25 * 8.5 * 0.92);
    const pYears = mSavings > 0 ? Number((n / (mSavings * 12)).toFixed(1)) : 0;

    return {
      cap: c,
      gross: g,
      subsidy: sub,
      net: n,
      monthlyUnits: mUnits,
      annualUnits: aUnits,
      monthlySavings: mSavings,
      lifetimeSavings: lSavings,
      paybackYears: pYears,
    };
  }, [capacityKw, systemCost]);

  const getBenchmarkRatePerKw = (kw: number) => {
    if (kw <= 2) return 62000;
    if (kw <= 3.3) return 58000;
    if (kw <= 5) return 53000;
    if (kw <= 10) return 48000;
    return 44000;
  };

  const handleBillChange = (val: string) => {
    setMonthlyBill(val);
    const billNum = parseFloat(val);
    if (!isNaN(billNum) && billNum > 0) {
      const rec = Math.max(1, Math.min(25, billNum / 8.5 / 120));
      const formattedCap = rec.toFixed(1);
      setCapacityKw(formattedCap);
      const kwVal = parseFloat(formattedCap);
      setSystemCost(String(Math.round(kwVal * getBenchmarkRatePerKw(kwVal))));
    }
  };

  const handleCapacityChange = (val: string) => {
    setCapacityKw(val);
    const cNum = parseFloat(val);
    if (!isNaN(cNum) && cNum > 0) {
      setSystemCost(String(Math.round(cNum * getBenchmarkRatePerKw(cNum))));
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
      primaryColor: '#0066FF',
      accentColor: '#10B981',
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
        newCustomer: !initialParams.lead?.id && !initialParams.lead?.customerId
          ? {
            name: prospectName.trim(),
            mobile: prospectPhone.trim(),
            address: initialParams.lead?.address || 'Site Location, Maharashtra',
          }
          : undefined,
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
      syncToBackend('VIEWED').catch(() => { });
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header
        variant={navigation?.canGoBack?.() ? 'detail' : 'main'}
        title="60s Solar Estimator"
        subtitle="On-the-spot proposal & PM Surya Ghar calculator"
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
        rightAction={
          syncedQuote ? (
            <View style={styles.badgeSynced}>
              <CheckCircle2 size={12} color="#10B981" />
              <Text style={styles.badgeSyncedText}>Web: {syncedQuote.qNumber}</Text>
            </View>
          ) : syncing ? (
            <View style={styles.badgeSyncing}>
              <ActivityIndicator size="small" color="#0066FF" />
              <Text style={styles.badgeSyncingText}>Syncing...</Text>
            </View>
          ) : undefined
        }
      />

      {/* FLOATING FINANCIAL KPI STRIP */}
      <View
        style={[
          styles.floatingKpiStrip,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiColLabel, { color: colors.textMuted }]}>CAPACITY</Text>
          <Text style={[styles.kpiColVal, { color: colors.text }]}>{cap} kWp</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiColLabel, { color: colors.textMuted }]}>GROSS</Text>
          <Text style={[styles.kpiColVal, { color: colors.text }]}>₹{(gross / 1000).toFixed(0)}k</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiColLabel, { color: colors.textMuted }]}>DBT SUBSIDY</Text>
          <Text style={[styles.kpiColVal, { color: '#10B981' }]}>-₹{(subsidy / 1000).toFixed(0)}k</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiColLabel, { color: colors.textMuted }]}>NET PAYABLE</Text>
          <Text style={[styles.kpiColVal, { color: '#0066FF' }]}>₹{(net / 1000).toFixed(0)}k</Text>
        </View>
      </View>

      {/* STEPPER TRACK */}
      <View
        style={[
          styles.stepperTrack,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.stepTab, currentStep === 1 && styles.stepTabActive]}
          onPress={() => setCurrentStep(1)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.stepNumCircle,
              currentStep === 1
                ? styles.stepNumActive
                : currentStep > 1
                  ? styles.stepNumDone
                  : styles.stepNumInactive,
            ]}
          >
            {currentStep > 1 ? (
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Text style={styles.stepNumText}>1</Text>
            )}
          </View>
          <Text
            style={[
              styles.stepTabText,
              { color: currentStep === 1 ? colors.text : colors.textMuted },
              currentStep === 1 && { fontWeight: '800' },
            ]}
          >
            Customer
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.stepConnector,
            { backgroundColor: currentStep > 1 ? '#0066FF' : colors.borderSubtle },
          ]}
        />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 2 && styles.stepTabActive]}
          onPress={() => setCurrentStep(2)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.stepNumCircle,
              currentStep === 2
                ? styles.stepNumActive
                : currentStep > 2
                  ? styles.stepNumDone
                  : styles.stepNumInactive,
            ]}
          >
            {currentStep > 2 ? (
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Text style={styles.stepNumText}>2</Text>
            )}
          </View>
          <Text
            style={[
              styles.stepTabText,
              { color: currentStep === 2 ? colors.text : colors.textMuted },
              currentStep === 2 && { fontWeight: '800' },
            ]}
          >
            Sizing & Gear
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.stepConnector,
            { backgroundColor: currentStep > 2 ? '#0066FF' : colors.borderSubtle },
          ]}
        />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
          onPress={() => setCurrentStep(3)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.stepNumCircle,
              currentStep === 3 ? styles.stepNumActive : styles.stepNumInactive,
            ]}
          >
            <Text style={styles.stepNumText}>3</Text>
          </View>
          <Text
            style={[
              styles.stepTabText,
              { color: currentStep === 3 ? colors.text : colors.textMuted },
              currentStep === 3 && { fontWeight: '800' },
            ]}
          >
            Proposal
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: PROSPECT & ELECTRICITY BILL */}
        {currentStep === 1 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.stepCardHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1 OF 3</Text>
              </View>
              <Text style={[styles.stepCardTitle, { color: colors.text }]}>
                Prospect & Consumption Profile
              </Text>
              <Text style={[styles.stepCardSub, { color: colors.textSecondary }]}>
                Input customer details to auto-size optimal solar capacity
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>PROSPECT NAME *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              value={prospectName}
              onChangeText={setProspectName}
              placeholder="e.g. Suresh Deshmukh"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              MOBILE NUMBER (WHATSAPP)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              value={prospectPhone}
              onChangeText={setProspectPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              CURRENT MONTHLY ELECTRICITY BILL (₹) *
            </Text>
            <TextInput
              style={[
                styles.inputHighlight,
                {
                  backgroundColor: isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                  color: colors.text,
                },
              ]}
              value={monthlyBill}
              onChangeText={handleBillChange}
              keyboardType="numeric"
              placeholder="e.g. 3500"
              placeholderTextColor={colors.textMuted}
            />

            {/* Quick Bill Presets */}
            <View style={styles.presetChipRow}>
              {['2500', '3500', '5000', '8000', '15000'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        monthlyBill === preset
                          ? '#0066FF'
                          : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                      borderColor:
                        monthlyBill === preset
                          ? '#0066FF'
                          : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleBillChange(preset)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color:
                          monthlyBill === preset
                            ? '#FFFFFF'
                            : colors.textSecondary,
                        fontWeight: monthlyBill === preset ? '800' : '600',
                      },
                    ]}
                  >
                    ₹{parseInt(preset).toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              DISCOM SANCTIONED LOAD (kW)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              value={sanctionedLoad}
              onChangeText={setSanctionedLoad}
              placeholder="e.g. 5.0 kW"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />

            {parseFloat(sanctionedLoad) > 0 && cap > parseFloat(sanctionedLoad) && (
              <View
                style={[
                  styles.advisoryBox,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                    borderColor: isDark ? '#B45309' : '#FDE68A',
                  },
                ]}
              >
                <View style={styles.advisoryHeader}>
                  <AlertTriangle size={13} color="#F59E0B" />
                  <Text style={styles.advisoryTitle}>DISCOM CAPACITY ADVISORY</Text>
                </View>
                <Text style={[styles.advisoryBody, { color: isDark ? '#FEF3C7' : '#92400E' }]}>
                  Under state net-metering regulations, solar capacity ({cap} kWp) cannot exceed sanctioned load ({sanctionedLoad} kW). A load enhancement request will be filed.
                </Text>
              </View>
            )}

            {/* AI Recommendation Callout */}
            <View
              style={[
                styles.aiRecBox,
                {
                  backgroundColor: isDark ? 'rgba(0, 102, 255, 0.08)' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                },
              ]}
            >
              <View style={styles.aiRecHeader}>
                <Sparkles size={13} color="#0066FF" />
                <Text style={styles.aiRecTitle}>RECOMMENDED SOLAR CAPACITY</Text>
              </View>
              <Text style={[styles.aiRecBody, { color: colors.textSecondary }]}>
                A monthly tariff of ₹{monthlyBill || '3,500'} recommends a{' '}
                <Text style={{ fontWeight: '800', color: colors.text }}>{cap} kWp system</Text>, generating ~
                {monthlyUnits} units/mo and saving ₹{monthlySavings.toLocaleString('en-IN')}/mo on electricity bills.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepPrimaryBtn}
              onPress={() => {
                if (!prospectName.trim()) {
                  Alert.alert('Customer Name Required', 'Please enter prospect name before proceeding.');
                  return;
                }
                setCurrentStep(2);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.stepPrimaryBtnText}>Configure Equipment & Sizing</Text>
              <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: SIZING & HARDWARE */}
        {currentStep === 2 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.stepCardHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2 OF 3</Text>
              </View>
              <Text style={[styles.stepCardTitle, { color: colors.text }]}>
                Hardware & Turnkey Equipment
              </Text>
              <Text style={[styles.stepCardSub, { color: colors.textSecondary }]}>
                Select Tier-1 DCR solar modules, inverter, and mounting structure
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              SYSTEM CAPACITY (kWp) *
            </Text>
            <TextInput
              style={[
                styles.inputHighlight,
                {
                  backgroundColor: isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                  color: colors.text,
                },
              ]}
              value={capacityKw}
              onChangeText={handleCapacityChange}
              keyboardType="decimal-pad"
            />

            {/* Capacity Presets */}
            <View style={styles.presetChipRow}>
              {['2.0', '3.3', '4.0', '5.0', '10.0'].map((kwPreset) => (
                <TouchableOpacity
                  key={kwPreset}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        capacityKw === kwPreset
                          ? '#0066FF'
                          : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                      borderColor:
                        capacityKw === kwPreset
                          ? '#0066FF'
                          : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleCapacityChange(kwPreset)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color:
                          capacityKw === kwPreset
                            ? '#FFFFFF'
                            : colors.textSecondary,
                        fontWeight: capacityKw === kwPreset ? '800' : '600',
                      },
                    ]}
                  >
                    {kwPreset} kWp
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modules Selector */}
            <View style={styles.gearHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                TIER-1 DCR SOLAR MODULES
              </Text>
              <TouchableOpacity
                style={[
                  styles.addGearBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                    borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                  },
                ]}
                onPress={() => handleOpenAddGear('PANEL')}
                activeOpacity={0.8}
              >
                <Plus size={11} color="#0066FF" strokeWidth={2.5} />
                <Text style={styles.addGearBtnText}>+ Add Make</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gearList}>
              {allPanels.map((panel) => {
                const isSelected = panelBrand === panel.name;
                return (
                  <TouchableOpacity
                    key={panel.id}
                    style={[
                      styles.gearCard,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF')
                          : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                        borderColor: isSelected
                          ? '#0066FF'
                          : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setPanelBrand(panel.name)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gearCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.gearCardTitle,
                            { color: isSelected ? '#0066FF' : colors.text },
                          ]}
                        >
                          {panel.name}
                        </Text>
                        <Text style={[styles.gearCardSub, { color: colors.textMuted }]}>
                          {panel.subtitle}
                        </Text>
                      </View>
                      {isSelected ? (
                        <CheckCircle2 size={16} color="#0066FF" />
                      ) : (
                        <View
                          style={[
                            styles.gearTag,
                            {
                              backgroundColor: isDark ? '#334155' : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text style={[styles.gearTagText, { color: colors.textSecondary }]}>
                            {panel.tag}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inverter Selector */}
            <View style={[styles.gearHeaderRow, { marginTop: 14 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                GRID-TIED INVERTER
              </Text>
              <TouchableOpacity
                style={[
                  styles.addGearBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                    borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                  },
                ]}
                onPress={() => handleOpenAddGear('INVERTER')}
                activeOpacity={0.8}
              >
                <Plus size={11} color="#0066FF" strokeWidth={2.5} />
                <Text style={styles.addGearBtnText}>+ Add Inverter</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gearList}>
              {allInverters.map((inv) => {
                const isSelected = inverterBrand === inv.name;
                return (
                  <TouchableOpacity
                    key={inv.id}
                    style={[
                      styles.gearCard,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF')
                          : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                        borderColor: isSelected
                          ? '#0066FF'
                          : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setInverterBrand(inv.name)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gearCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.gearCardTitle,
                            { color: isSelected ? '#0066FF' : colors.text },
                          ]}
                        >
                          {inv.name}
                        </Text>
                        <Text style={[styles.gearCardSub, { color: colors.textMuted }]}>
                          {inv.subtitle}
                        </Text>
                      </View>
                      {isSelected ? (
                        <CheckCircle2 size={16} color="#0066FF" />
                      ) : (
                        <View
                          style={[
                            styles.gearTag,
                            {
                              backgroundColor: isDark ? '#334155' : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text style={[styles.gearTagText, { color: colors.textSecondary }]}>
                            {inv.tag}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Turnkey Pricing Input */}
            <View
              style={[
                styles.systemCostBox,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                  borderColor: isDark ? '#065F46' : '#A7F3D0',
                },
              ]}
            >
              <View style={styles.costTitleRow}>
                <Text style={styles.costPrimaryLabel}>Turnkey Plant Cost (All GST Included)</Text>
                <View style={styles.gstTag}>
                  <Text style={styles.gstTagText}>GST Included</Text>
                </View>
              </View>
              <View
                style={[
                  styles.costInputRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={[styles.costInput, { color: colors.text }]}
                  value={systemCost}
                  onChangeText={setSystemCost}
                  keyboardType="numeric"
                  placeholder="e.g. 195000"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <Text style={[styles.costHelpText, { color: isDark ? '#34D399' : '#047857' }]}>
                Turnkey price includes modules, inverter, elevated structure, wiring, installation & DISCOM net-metering.
              </Text>
            </View>

            {/* Step Navigation */}
            <View style={styles.stepNavRow}>
              <TouchableOpacity
                style={[
                  styles.stepBackBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.8}
              >
                <ChevronLeft size={15} color={colors.textSecondary} />
                <Text style={[styles.stepBackBtnText, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepPrimaryBtnFlex}
                onPress={() => setCurrentStep(3)}
                activeOpacity={0.85}
              >
                <Text style={styles.stepPrimaryBtnText}>Review PM Subsidy & Proposal</Text>
                <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: PM SURYA GHAR PROPOSAL & ECONOMICS */}
        {currentStep === 3 && (
          <View>
            {/* HERO COMMERCIAL ECONOMICS CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroCardHeader}>
                <Text style={styles.heroCardPillText}>CENTRAL DBT FINANCIAL BREAKDOWN</Text>
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

            {/* ROI MATRIX */}
            <View
              style={[
                styles.savingsCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.savingsCol}>
                <Text style={[styles.savingsLabel, { color: colors.textMuted }]}>EST. MONTHLY GEN</Text>
                <Text style={[styles.savingsVal, { color: colors.text }]}>{monthlyUnits} Units</Text>
              </View>
              <View style={[styles.savingsDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.savingsCol}>
                <Text style={[styles.savingsLabel, { color: colors.textMuted }]}>MONTHLY SAVINGS</Text>
                <Text style={styles.savingsValGreen}>₹{monthlySavings.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.savingsDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.savingsCol}>
                <Text style={[styles.savingsLabel, { color: colors.textMuted }]}>PAYBACK ROI</Text>
                <Text style={styles.savingsValBlue}>{paybackYears} Yrs</Text>
              </View>
            </View>

            {/* SUMMARY GEAR CARD */}
            <View
              style={[
                styles.summaryGearCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.summaryGearTitle, { color: colors.textSecondary }]}>
                EQUIPMENT SPECIFICATIONS INCLUDED
              </Text>
              <Text style={[styles.summaryGearRow, { color: colors.text }]}>• Modules: {panelBrand}</Text>
              <Text style={[styles.summaryGearRow, { color: colors.text }]}>• Inverter: {inverterBrand}</Text>
              <Text style={[styles.summaryGearRow, { color: colors.text }]}>• Structure: {structureType}</Text>
              <Text style={[styles.summaryGearRow, { color: colors.text }]}>
                • Recipient: {prospectName} ({prospectPhone || 'No Phone'})
              </Text>

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
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.actionRowTop}>
          <TouchableOpacity
            style={[
              styles.pdfBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={handlePreviewPdf}
            activeOpacity={0.8}
          >
            <Eye size={15} color={colors.text} />
            <Text style={[styles.pdfBtnText, { color: colors.text }]}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleShareWhatsAppPdf}
            disabled={sharingWhatsAppPdf}
            activeOpacity={0.85}
          >
            {sharingWhatsAppPdf ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MessageCircle size={15} color="#FFFFFF" />
                <Text style={styles.whatsAppBtnText}>WhatsApp PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pitchTextBtn,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                borderColor: isDark ? '#065F46' : '#A7F3D0',
              },
            ]}
            onPress={handleSendTextPitch}
            disabled={sendingPitchText}
            activeOpacity={0.85}
          >
            {sendingPitchText ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Send size={13} color="#10B981" />
                <Text style={styles.pitchTextBtnText}>Direct Chat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* PROPOSAL PREVIEW MODAL */}
      {showVisualPreview && (
        <ProposalPreviewModal
          visible={showVisualPreview}
          onClose={() => setShowVisualPreview(false)}
          data={buildPdfPayload()}
          isSynced={Boolean(syncedQuote)}
        />
      )}

      {/* CUSTOM GEAR MODAL */}
      <Modal
        visible={gearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGearModalVisible(false)}
      >
        <View style={styles.gearModalOverlay}>
          <View
            style={[
              styles.gearModalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.gearModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.gearModalTitle, { color: colors.text }]}>
                  {gearModalType === 'PANEL' ? 'Add Custom Solar Module' : 'Add Custom Solar Inverter'}
                </Text>
                <Text style={[styles.gearModalSubtitle, { color: colors.textMuted }]}>
                  {gearModalType === 'PANEL'
                    ? 'Enter custom Tier-1 / ALMM module details & wattage'
                    : 'Enter custom grid-tied inverter make & model'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setGearModalVisible(false)}
                style={[
                  styles.gearModalCloseBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.gearModalBody}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>
                EQUIPMENT MAKE & MODEL *
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder={
                  gearModalType === 'PANEL'
                    ? 'e.g. Vikram Solar 550W Mono PERC'
                    : 'e.g. Sungrow 3.3kW Dual MPPT'
                }
                placeholderTextColor={colors.textMuted}
                value={customGearName}
                onChangeText={setCustomGearName}
              />

              {gearModalType === 'PANEL' && (
                <>
                  <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>
                    RATED WATTAGE (Wp) *
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: colors.borderSubtle,
                        color: colors.text,
                      },
                    ]}
                    placeholder="e.g. 550"
                    placeholderTextColor={colors.textMuted}
                    value={customGearWattage}
                    onChangeText={setCustomGearWattage}
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>
                WARRANTY & SPECIFICATIONS
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder={
                  gearModalType === 'PANEL'
                    ? 'e.g. 25 Years Performance • DCR ALMM'
                    : 'e.g. 10 Years Warranty • Dual MPPT • WiFi'
                }
                placeholderTextColor={colors.textMuted}
                value={customGearSubtitle}
                onChangeText={setCustomGearSubtitle}
              />
            </View>

            <View style={styles.gearModalFooter}>
              <TouchableOpacity
                style={[
                  styles.gearModalCancelBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => setGearModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.gearModalCancelBtnText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gearModalSaveBtn}
                onPress={handleSaveCustomGear}
                activeOpacity={0.85}
              >
                <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
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
  },
  badgeSynced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeSyncedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  badgeSyncing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeSyncingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066FF',
  },

  // FLOATING KPI STRIP
  floatingKpiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiColLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  kpiColVal: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 22,
  },

  // STEPPER TRACK
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
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
    backgroundColor: '#10B981',
  },
  stepNumInactive: {
    backgroundColor: '#94A3B8',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTabText: {
    fontSize: 11,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    borderRadius: 1,
  },

  // BODY & CARDS
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  stepCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  stepCardHeader: {
    marginBottom: 14,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.4,
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepCardSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputHighlight: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  presetChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
  },
  advisoryBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  advisoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.4,
  },
  advisoryBody: {
    fontSize: 11,
    lineHeight: 15,
  },
  aiRecBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  aiRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  aiRecTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  aiRecBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  stepPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stepPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gearHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  addGearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  addGearBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066FF',
  },
  gearList: {
    gap: 6,
    marginBottom: 6,
  },
  gearCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  gearCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  gearCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  gearCardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  gearTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gearTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  systemCostBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  costTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  costPrimaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  gstTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gstTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  costInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
    marginRight: 4,
  },
  costInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    paddingVertical: 8,
  },
  costHelpText: {
    fontSize: 10,
    lineHeight: 14,
  },
  stepNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  stepBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepPrimaryBtnFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  heroCardHeader: {
    marginBottom: 12,
  },
  heroCardPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  heroVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  heroLabelGreen: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '700',
  },
  heroValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
    fontVariant: ['tabular-nums'],
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
  },
  netSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  netVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0066FF',
    fontVariant: ['tabular-nums'],
  },

  // SAVINGS CARD
  savingsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  savingsCol: {
    flex: 1,
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  savingsVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  savingsValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  savingsValBlue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0066FF',
    marginTop: 2,
  },
  savingsDivider: {
    width: 1,
    height: 28,
  },

  // SUMMARY GEAR CARD
  summaryGearCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  summaryGearTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryGearRow: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  modifyGearBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  modifyGearBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },

  // BOTTOM ACTION BAR
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionRowTop: {
    flexDirection: 'row',
    gap: 8,
  },
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 11,
  },
  pdfBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  whatsAppBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0066FF',
    borderRadius: 11,
    paddingVertical: 11,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pitchTextBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 11,
  },
  pitchTextBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },

  // GEAR MODAL
  gearModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gearModalContent: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  gearModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gearModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  gearModalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  gearModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearModalBody: {
    gap: 6,
  },
  modalFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  gearModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  gearModalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearModalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gearModalSaveBtn: {
    flex: 2,
    backgroundColor: '#0066FF',
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  gearModalSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
