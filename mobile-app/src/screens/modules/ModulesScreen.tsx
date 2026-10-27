import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  MapPin,
  Landmark,
  Banknote,
  Zap,
  Receipt,
  Truck,
  ShieldCheck,
  Layers,
  ChevronRight,
  X,
  MessageCircle,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  CreditCard,
  AlertTriangle,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import {
  quotationsApi,
  superAdminApi,
  tenantApi,
  financeApi,
  amcApi,
  surveysApi,
  subsidyApi,
  procurementApi,
} from '../../api/endpoints';
import { generateQuotationHtml, previewPdf } from '../../services/pdfService';
import { openWhatsAppDirect } from '../../services/whatsappService';
import { useAuth } from '../../context/AuthContext';
import { Quotation, Tenant, SiteSurvey, Invoice, SubsidyApplication } from '../../types';
import { ProposalPreviewModal } from '../../components/ProposalPreviewModal';

export const ModulesScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const { user } = useAuth();

  // Active Sub-Module Modal
  const [activeSubModule, setActiveSubModule] = useState<string | null>(
    route?.params?.openQuote
      ? 'QUOTES'
      : route?.params?.screen || null
  );
  const [previewQuoteData, setPreviewQuoteData] = useState<any>(null);

  // Sync with route params on navigation
  useEffect(() => {
    if (route?.params?.openQuote) {
      setActiveSubModule('QUOTES');
      if (route?.params?.leadName) setCustomerNameInput(route.params.leadName);
      if (route?.params?.capacity) setCapacityInput(String(route.params.capacity));
    } else if (route?.params?.screen) {
      handleOpenModule(route.params.screen);
    }
  }, [route?.params]);

  // 1. Quotations Wizard State
  const [capacityInput, setCapacityInput] = useState('3.3');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [selectedPanelBrand, setSelectedPanelBrand] = useState('Waaree 550Wp Mono PERC');
  const [selectedInverterBrand, setSelectedInverterBrand] = useState('Growatt 3.3kW On-Grid');
  const [selectedStructure, setSelectedStructure] = useState('HDG High-Rise Elevated');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);

  // 2. Site Surveys State
  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [scheduleSurveyModal, setScheduleSurveyModal] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    surveyDate: '',
    proposedCap: '3.3',
    roofType: 'RCC Flat Roof',
    usableShadowFreeArea: '350',
    discomConsumerNo: '',
    electricalPhase: 'Three Phase',
    notes: '',
  });
  const [savingSurvey, setSavingSurvey] = useState(false);

  // 3. PM Surya Ghar Subsidies State
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [subsidyMetrics, setSubsidyMetrics] = useState<any>({});
  const [loadingSubsidies, setLoadingSubsidies] = useState(false);

  // 4. DISCOM State
  const [discomList, setDiscomList] = useState([
    {
      id: 'disc-1',
      consumerName: 'Surendra Sharma',
      consumerNumber: '028510293812',
      discomName: 'MSEDCL',
      division: 'Pune Urban (Shivajinagar)',
      sanctionedLoadKw: 3.3,
      status: 'FEASIBILITY_CLEARED',
      meterSerial: 'MTR-MH-8842',
      appNo: 'NM-MS-2026-9921',
    },
    {
      id: 'disc-2',
      consumerName: 'Pooja Deshmukh',
      consumerNumber: '019284729103',
      discomName: 'MSEDCL',
      division: 'Nashik Urban',
      sanctionedLoadKw: 5.0,
      status: 'METER_INSTALLED',
      meterSerial: 'MTR-MH-7411',
      appNo: 'NM-MS-2026-8714',
    },
  ]);

  // 5. Solar Loan EMI Financing Calculator State
  const [loanCapInput, setLoanCapInput] = useState('3.3');
  const [downPaymentInput, setDownPaymentInput] = useState('20000');
  const [loanTenureYears, setLoanTenureYears] = useState(5);
  const [loanInterestRate] = useState(7.0);

  // 6. Finance State
  const [financeData, setFinanceData] = useState<{
    totalRevenue: number;
    outstanding: number;
    overdueAmount: number;
    overdueCount: number;
    expectedSubsidies: number;
    invoices: any[];
  }>({
    totalRevenue: 0,
    outstanding: 0,
    overdueAmount: 0,
    overdueCount: 0,
    expectedSubsidies: 0,
    invoices: [],
  });
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeFilter, setFinanceFilter] = useState<'ALL' | 'OVERDUE' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<any>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payModeInput, setPayModeInput] = useState('UPI');
  const [payRefInput, setPayRefInput] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // 7. Procurement State
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingProcurement, setLoadingProcurement] = useState(false);

  // 8. AMC State
  const [amcs, setAmcs] = useState<any[]>([]);
  const [loadingAmcs, setLoadingAmcs] = useState(false);

  // 9. Super Admin Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Quotation Calculations
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

  const handleOpenModule = (id: string) => {
    setActiveSubModule(id);
    if (id === 'QUOTES') fetchQuotations();
    if (id === 'SURVEYS') fetchSurveys();
    if (id === 'SUBSIDY') fetchSubsidies();
    if (id === 'FINANCE') fetchFinance();
    if (id === 'PROCUREMENT') fetchProcurement();
    if (id === 'AMC') fetchAmcs();
    if (id === 'SUPER_ADMIN') fetchTenants();
  };

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

  const fetchSurveys = async () => {
    setLoadingSurveys(true);
    try {
      const res = await surveysApi.getSurveys();
      if (res && Array.isArray(res.surveys)) {
        setSurveys(res.surveys);
      }
    } catch (err: any) {
      console.warn('Surveys fetch notice:', err.message);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const fetchSubsidies = async () => {
    setLoadingSubsidies(true);
    try {
      const res = await subsidyApi.getSubsidies();
      if (res?.subsidies) {
        setSubsidies(res.subsidies);
        setSubsidyMetrics(res.metrics || {});
      }
    } catch (err: any) {
      console.warn('Subsidies fetch notice:', err.message);
    } finally {
      setLoadingSubsidies(false);
    }
  };

  const fetchFinance = async () => {
    setLoadingFinance(true);
    try {
      const [statsRes, fin] = await Promise.all([
        financeApi.getStats().catch(() => null),
        financeApi.getInvoices().catch(() => null),
      ]);
      setFinanceData({
        totalRevenue: statsRes?.stats?.totalCollected || 0,
        outstanding: statsRes?.stats?.outstanding || 0,
        overdueAmount: statsRes?.stats?.overdueAmount || 0,
        overdueCount: statsRes?.stats?.overdueCount || 0,
        expectedSubsidies: statsRes?.stats?.expectedSubsidies || 0,
        invoices: fin?.finance || [],
      });
    } catch (err: any) {
      console.warn('Finance fetch notice:', err.message);
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleRecordMobilePayment = async () => {
    if (!targetInvoice) return;
    const amt = parseFloat(payAmountInput);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setSubmittingPay(true);
    try {
      const res = await financeApi.recordPayment(targetInvoice.id, {
        amount: amt,
        mode: payModeInput,
        reference: payRefInput,
      });
      Alert.alert(
        'Payment Recorded! 🎉',
        `Receipt: ${res.receiptNumber || 'Generated'}\nAmount: ₹${amt.toLocaleString('en-IN')}\nStatus: ${res.invoiceStatus || 'Updated'}`
      );
      setPaymentModalVisible(false);
      setTargetInvoice(null);
      fetchFinance();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Payment recording failed.');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleMobileWhatsAppNotice = async (inv: any) => {
    try {
      const res = await financeApi.getWhatsAppPayload(inv.id);
      if (res?.whatsappUrl) {
        await Linking.openURL(res.whatsappUrl);
      } else {
        Alert.alert('Notice', 'No customer phone number available.');
      }
    } catch (err: any) {
      Alert.alert('WhatsApp Notice', 'Could not open WhatsApp.');
    }
  };

  const fetchProcurement = async () => {
    setLoadingProcurement(true);
    try {
      const res = await procurementApi.getPurchaseOrders();
      if (res?.purchaseOrders) {
        setPurchaseOrders(res.purchaseOrders);
      }
    } catch (err: any) {
      console.warn('Procurement fetch notice:', err.message);
    } finally {
      setLoadingProcurement(false);
    }
  };

  const fetchAmcs = async () => {
    setLoadingAmcs(true);
    try {
      const res = await amcApi.getAmcs();
      if (res && Array.isArray(res.amcs)) {
        setAmcs(res.amcs);
      }
    } catch (err: any) {
      console.warn('AMC fetch notice:', err.message);
    } finally {
      setLoadingAmcs(false);
    }
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const res = await superAdminApi.getTenants();
      if (res && Array.isArray(res.tenants)) {
        setTenants(res.tenants);
      }
    } catch (err: any) {
      console.warn('Tenants fetch notice:', err.message);
    } finally {
      setLoadingTenants(false);
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
      const subsidy = q.indicativeSubsidy || (cap <= 1 ? 30000 : cap <= 2 ? 60000 : 78000);
      const net = Math.max(0, total - subsidy);
      const monthlyUnits = Math.round(cap * 120);
      const annualUnits = Math.round(cap * 1460);
      const monthlySavings = Math.round(monthlyUnits * 8.5);

      setPreviewQuoteData({
        quotationNumber: q.qNumber || 'QT-PROPOSAL',
        quotationDate: new Date(q.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
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
        subsidyAmount: subsidy,
        netPayable: net,
        monthlyGenerationUnits: monthlyUnits,
        annualGenerationUnits: annualUnits,
        currentMonthlyBill: Math.round(monthlySavings * 1.15),
        estimatedMonthlyBill: 150,
        monthlySavings,
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
    const sub = (q.indicativeSubsidy || (cap <= 1 ? 30000 : cap <= 2 ? 60000 : 78000)).toLocaleString('en-IN');
    const net = Math.max(0, (q.total || 0) - (q.indicativeSubsidy || 78000)).toLocaleString('en-IN');

    const text = `☀️ *Solar Rooftop Proposal — ${q.qNumber}*
Dear ${custName},

Here are the details of your customized Rooftop Solar System:
⚡ System Capacity: ${cap} kWp On-Grid System
💰 Turnkey Plant Cost (All GST Included): ₹${total}
🎁 PM Surya Ghar Central Subsidy: -₹${sub}
👉 Net Customer Investment: ₹${net}

📄 Detailed technical and financial proposal is saved in the central portal. Contact us to schedule installation!`;

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

  const handleScheduleSurveySubmit = async () => {
    if (!surveyForm.customerName.trim() || !surveyForm.phone.trim()) {
      Alert.alert('Required', 'Please enter a customer name and phone number.');
      return;
    }
    setSavingSurvey(true);
    try {
      await surveysApi.createSurvey({
        customerName: surveyForm.customerName.trim(),
        phone: surveyForm.phone.trim(),
        address: surveyForm.address.trim(),
        proposedCap: parseFloat(surveyForm.proposedCap) || 3.3,
        roofType: surveyForm.roofType,
        usableShadowFreeArea: parseFloat(surveyForm.usableShadowFreeArea) || 350,
        discomConsumerNo: surveyForm.discomConsumerNo.trim(),
        electricalPhase: surveyForm.electricalPhase,
        notes: surveyForm.notes,
        surveyDate: surveyForm.surveyDate || new Date().toISOString(),
      });
      Alert.alert('Survey Scheduled', 'Technical site evaluation recorded.');
      setScheduleSurveyModal(false);
      fetchSurveys();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Survey scheduled.');
    } finally {
      setSavingSurvey(false);
    }
  };

  const handleShareWhatsApp = () => {
    const cust = customerNameInput.trim() ? customerNameInput.trim() : 'Valued Client';
    const text = `☀️ *PM Surya Ghar Solar Proposal*
Dear ${cust},

Here is your customized Rooftop Solar Quotation:
⚡ System Capacity: ${kw} kWp Grid-Tied Solar
🔬 PV Modules: ${selectedPanelBrand}
⚡ Inverter: ${selectedInverterBrand}
🏗️ Mounting: ${selectedStructure}

💰 Turnkey System Cost (All GST Included): ₹${grossTotal.toLocaleString('en-IN')}
🏛️ Govt. CFA Subsidy: -₹${subsidy.toLocaleString('en-IN')}
✅ Customer Net Payable: ₹${netPayable.toLocaleString('en-IN')}

📈 Estimated Monthly Generation: ~${monthlyUnits} Units
💵 Monthly Electricity Savings: ~₹${monthlySavings.toLocaleString('en-IN')}
⏱️ Payback Period: ~${paybackYears} Years

Let's schedule your 3D roof survey!`;

    openWhatsAppDirect('', text);
  };

  const handleShareLoanWhatsApp = () => {
    const text = `☀️ *PM Surya Ghar 7% Solar Loan Financing*
⚡ Solar Capacity: ${loanKw} kWp Grid-Tied Solar
💰 Gross Project Cost: ₹${loanGross.toLocaleString('en-IN')}
🏛️ PM Surya Ghar Subsidy: -₹${loanSub.toLocaleString('en-IN')}
✅ Net Investment: ₹${loanNetInvestment.toLocaleString('en-IN')}

💵 Down Payment: ₹${downPay.toLocaleString('en-IN')}
🏦 Concessional Loan Amount: ₹${principal.toLocaleString('en-IN')}
⏳ Loan Tenure: ${loanTenureYears} Years @ ${loanInterestRate}% p.a.
💳 Monthly EMI: ₹${monthlyEmi.toLocaleString('en-IN')}/mo

⚡ Monthly Electricity Bill Savings: ~₹${loanMonthlySavings.toLocaleString('en-IN')}/mo
🎉 NET CASH BENEFIT: +₹${netMonthlyCashBenefit.toLocaleString('en-IN')}/month in your pocket from Day 1!`;

    openWhatsAppDirect('', text);
  };

  const MODULE_CATEGORIES = [
    {
      title: 'SALES & PROPOSALS',
      modules: [
        {
          id: 'QUOTES',
          name: 'Quotations Engine',
          desc: '60-second solar proposals, CFA calculations & BOM sizing',
          icon: FileText,
          iconColor: '#059669',
          bgColor: '#ecfdf5',
        },
        {
          id: 'SURVEYS',
          name: 'Site Surveys',
          desc: 'Rooftop measurements, shadow profile & technical feasibility',
          icon: MapPin,
          iconColor: '#2563eb',
          bgColor: '#eff6ff',
        },
      ],
    },
    {
      title: 'COMPLIANCE & FINANCING',
      modules: [
        {
          id: 'SUBSIDY',
          name: 'PM Surya Ghar Studio',
          desc: '7-stage national portal tracking, consumer CA & DBT release',
          icon: Landmark,
          iconColor: '#d97706',
          bgColor: '#fffbeb',
        },
        {
          id: 'FINANCING',
          name: 'Solar Loan & EMI Planner',
          desc: '7% concessional bank EMI vs electricity bill savings planner',
          icon: Banknote,
          iconColor: '#7c3aed',
          bgColor: '#f5f3ff',
        },
      ],
    },
    {
      title: 'DISCOM & INVOICING',
      modules: [
        {
          id: 'DISCOM',
          name: 'DISCOM Net-Metering',
          desc: 'MSEDCL, Tata Power & state discom meter synchronization',
          icon: Zap,
          iconColor: '#0d9488',
          bgColor: '#f0fdfa',
        },
        {
          id: 'FINANCE',
          name: 'Finance & Invoicing',
          desc: 'Milestone billing (20/60/15/5), tax invoices & payment status',
          icon: Receipt,
          iconColor: '#059669',
          bgColor: '#ecfdf5',
        },
      ],
    },
    {
      title: 'OPERATIONS & AMC',
      modules: [
        {
          id: 'PROCUREMENT',
          name: 'Procurement & Stock',
          desc: 'DCR modules, grid-tie inverters, ACDB/DCDB & material dispatch',
          icon: Truck,
          iconColor: '#db2777',
          bgColor: '#fdf2f8',
        },
        {
          id: 'AMC',
          name: 'AMC & Support',
          desc: 'Preventive maintenance agreements & post-commissioning service',
          icon: ShieldCheck,
          iconColor: '#e11d48',
          bgColor: '#fff1f2',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Solar Hub"
        subtitle="Turnkey modules, statutory compliance & financing tools"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {MODULE_CATEGORIES.map((cat, idx) => (
          <View key={idx} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
            <View style={styles.categoryGrid}>
              {cat.modules.map((m) => {
                const Icon = m.icon;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.moduleTile}
                    onPress={() => handleOpenModule(m.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.moduleIconBox, { backgroundColor: m.bgColor }]}>
                      <Icon size={20} color={m.iconColor} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moduleTileName}>{m.name}</Text>
                      <Text style={styles.moduleTileDesc}>{m.desc}</Text>
                    </View>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {user?.role === 'SUPER_ADMIN' && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>PLATFORM GOVERNANCE</Text>
            <TouchableOpacity
              style={styles.moduleTile}
              onPress={() => handleOpenModule('SUPER_ADMIN')}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#faf5ff' }]}>
                <Layers size={20} color="#9333ea" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moduleTileName}>Super Admin Platform</Text>
                <Text style={styles.moduleTileDesc}>Multi-tenant management & platform telemetry</Text>
              </View>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* SUB-MODULE FULLSHEET MODAL */}
      <Modal visible={!!activeSubModule} animationType="slide">
        <View style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subModalTitle}>
                {activeSubModule === 'QUOTES' && 'Quotations & Proposal Engine'}
                {activeSubModule === 'SURVEYS' && 'Site Surveys & Feasibility'}
                {activeSubModule === 'SUBSIDY' && 'PM Surya Ghar National Portal Studio'}
                {activeSubModule === 'FINANCING' && 'Solar Loan & EMI Planner (7% p.a.)'}
                {activeSubModule === 'DISCOM' && 'DISCOM Net-Metering Tracker'}
                {activeSubModule === 'FINANCE' && 'Finance & Milestone Billing'}
                {activeSubModule === 'PROCUREMENT' && 'Procurement & Material Logistics'}
                {activeSubModule === 'AMC' && 'AMC & Service Agreements'}
                {activeSubModule === 'SUPER_ADMIN' && 'Platform Governance (Super Admin)'}
              </Text>
              <Text style={styles.subModalSubtitle}>Cloud Synchronized Real Enterprise Hub</Text>
            </View>
            <TouchableOpacity
              style={styles.closeSubModalBtn}
              onPress={() => setActiveSubModule(null)}
            >
              <X size={18} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            {/* 1. QUOTATIONS ENGINE */}
            {activeSubModule === 'QUOTES' && (
              <View>
                <Text style={styles.cardSectionHeader}>60-Second Solar Proposal Builder</Text>
                <View style={styles.calcBox}>
                  <Text style={styles.inputLabel}>PROSPECT / CLIENT NAME</Text>
                  <TextInput
                    style={styles.calcInput}
                    value={customerNameInput}
                    onChangeText={setCustomerNameInput}
                    placeholder="e.g. Surendra Sharma"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.inputLabel}>RECOMMENDED CAPACITY (kWp)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={capacityInput}
                    onChangeText={setCapacityInput}
                    placeholder="3.3"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.inputLabel}>PV MODULE SPECIFICATION</Text>
                  <View style={styles.chipRow}>
                    {['Waaree 550Wp Mono PERC', 'Adani 540Wp Bifacial', 'Vikram 535Wp DCR'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.smallChip, selectedPanelBrand === p && styles.smallChipSelected]}
                        onPress={() => setSelectedPanelBrand(p)}
                      >
                        <Text style={[styles.smallChipText, selectedPanelBrand === p && styles.smallChipTextSelected]}>
                          {p.split(' ')[0]} ({p.split(' ')[1]})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>INVERTER SPECIFICATION</Text>
                  <View style={styles.chipRow}>
                    {['Growatt On-Grid', 'Polycab Solar', 'Sungrow Tri-Phase'].map((inv) => (
                      <TouchableOpacity
                        key={inv}
                        style={[styles.smallChip, selectedInverterBrand.startsWith(inv.split(' ')[0]) && styles.smallChipSelected]}
                        onPress={() => setSelectedInverterBrand(`${inv} String Inverter`)}
                      >
                        <Text style={[styles.smallChipText, selectedInverterBrand.startsWith(inv.split(' ')[0]) && styles.smallChipTextSelected]}>
                          {inv}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* FINANCIAL BREAKDOWN */}
                  <View style={styles.calcBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Gross Solar System Cost</Text>
                      <Text style={styles.breakdownVal}>₹{grossTotal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: '#059669', fontWeight: '700' }]}>
                        Govt. CFA Subsidy (Surya Ghar)
                      </Text>
                      <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '800' }]}>
                        -₹{subsidy.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }]}>
                      <Text style={styles.netLabel}>Customer Net Payable</Text>
                      <Text style={styles.netVal}>₹{netPayable.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimated Monthly Power</Text>
                      <Text style={styles.breakdownVal}>~{monthlyUnits} Units/mo</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimated Monthly Savings</Text>
                      <Text style={[styles.breakdownVal, { color: '#2563eb' }]}>
                        ~₹{monthlySavings.toLocaleString('en-IN')}/mo
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimated Payback Period</Text>
                      <Text style={styles.breakdownBold}>{paybackYears} Years</Text>
                    </View>
                  </View>

                  <View style={styles.quoteActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.saveQuoteBtn}
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
                <Text style={[styles.cardSectionHeader, { marginTop: 24 }]}>
                  Saved Quotations ({quotations.length})
                </Text>
                {loadingQuotes ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
                ) : quotations.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No saved quotations yet.</Text>
                  </View>
                ) : (
                  quotations.map((q) => (
                    <View key={q.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{q.qNumber}</Text>
                        <Text style={styles.quoteCustomer}>{q.customer?.name || q.lead?.name || 'Solar Prospect'}</Text>
                        <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700', marginTop: 2 }}>
                          {q.systemCapacity || 3.3} kWp • ₹{(q.total || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.quoteActionSmallBtn}
                            onPress={() => handlePreviewSavedQuote(q)}
                          >
                            <Eye size={12} color="#0f172a" />
                            <Text style={styles.quoteActionSmallText}>PDF</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.quoteActionSmallBtn, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}
                            onPress={() => handleWhatsAppSavedQuote(q)}
                          >
                            <MessageCircle size={12} color="#15803d" />
                            <Text style={[styles.quoteActionSmallText, { color: '#15803d' }]}>WA</Text>
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
              </View>
            )}

            {/* 2. SITE SURVEYS */}
            {activeSubModule === 'SURVEYS' && (
              <View>
                <View style={styles.sectionTitleWithAction}>
                  <Text style={styles.cardSectionHeader}>Technical Site Evaluations</Text>
                  <TouchableOpacity
                    style={styles.addSmallBtn}
                    onPress={() => setScheduleSurveyModal(true)}
                  >
                    <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.addSmallBtnText}>Book Survey</Text>
                  </TouchableOpacity>
                </View>

                {loadingSurveys ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
                ) : surveys.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <MapPin size={28} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Surveys Scheduled</Text>
                    <Text style={styles.emptyText}>
                      Schedule site visits to evaluate shadow profiles, roof orientations, and electrical panels.
                    </Text>
                  </View>
                ) : (
                  surveys.map((s) => (
                    <View key={s.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={styles.quoteNumber}>{s.customer?.name || s.lead?.name || 'Customer'}</Text>
                          {s.surveyNumber ? (
                            <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9, color: '#475569', fontWeight: 'bold' }}>{s.surveyNumber}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.quoteCustomer}>
                          {s.customer?.address || s.customer?.city || 'Site Address'}
                        </Text>
                        <Text style={styles.surveyDate}>
                          {s.surveyDate ? new Date(s.surveyDate).toLocaleDateString() : 'Scheduled'} • Sizing: {s.recommendedCapacity || s.proposedCap || 3.3} kWp • {s.roofType || 'RCC'}
                        </Text>
                        {s.discomConsumerNo ? (
                          <Text style={{ fontSize: 10, color: '#047857', marginTop: 2, fontWeight: '600' }}>
                            DISCOM CA: {s.discomConsumerNo}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.surveyStatusPill, (s.status === 'APPROVED' || s.feasibilityVerdict === 'FEASIBLE') ? { backgroundColor: '#ecfdf5' } : {}]}>
                        <Text style={[styles.surveyStatusText, (s.status === 'APPROVED' || s.feasibilityVerdict === 'FEASIBLE') ? { color: '#047857' } : {}]}>
                          {s.feasibilityVerdict || s.status || 'SCHEDULED'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 3. PM SURYA GHAR SUBSIDY */}
            {activeSubModule === 'SUBSIDY' && (
              <View>
                <Text style={styles.cardSectionHeader}>PM Surya Ghar CFA National Portal Track</Text>
                
                {/* SLAB CARDS */}
                <View style={styles.subsidySlabRow}>
                  <View style={styles.slabBox}>
                    <Text style={styles.slabTitle}>1 kW System</Text>
                    <Text style={styles.slabAmount}>₹30,000</Text>
                    <Text style={styles.slabDesc}>CFA Credit</Text>
                  </View>
                  <View style={styles.slabBox}>
                    <Text style={styles.slabTitle}>2 kW System</Text>
                    <Text style={styles.slabAmount}>₹60,000</Text>
                    <Text style={styles.slabDesc}>CFA Credit</Text>
                  </View>
                  <View style={[styles.slabBox, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.slabTitle, { color: '#047857' }]}>3 kW+ System</Text>
                    <Text style={[styles.slabAmount, { color: '#047857' }]}>₹78,000</Text>
                    <Text style={styles.slabDesc}>Max Subsidy</Text>
                  </View>
                </View>

                {/* 7-STAGE WORKFLOW GUIDE */}
                <Text style={[styles.cardSectionHeader, { marginTop: 18 }]}>Official 7-Stage Portal Track</Text>
                <View style={styles.stageTrackBox}>
                  {[
                    { step: '1', title: 'Consumer Selection', desc: 'Vendor tagged on pmsuryaghar.gov.in', done: true },
                    { step: '2', title: 'Feasibility Review', desc: 'DISCOM technical verification', done: true },
                    { step: '3', title: 'Feasibility Approved', desc: 'Plant capacity sanctioned', done: true },
                    { step: '4', title: 'Work Completed', desc: 'Installation & DCR module serials uploaded', done: false },
                    { step: '5', title: 'Net Meter Inspection', desc: 'DISCOM commissioning report cleared', done: false },
                    { step: '6', title: 'Claim Sanctioned', desc: 'National subsidy voucher generated', done: false },
                    { step: '7', title: 'DBT Disbursed', desc: 'Direct credit into customer Aadhaar bank account', done: false },
                  ].map((st) => (
                    <View key={st.step} style={styles.trackItemRow}>
                      <View style={[styles.trackCircle, st.done && styles.trackCircleDone]}>
                        {st.done ? (
                          <Check size={12} color="#ffffff" strokeWidth={3} />
                        ) : (
                          <Text style={styles.trackCircleText}>{st.step}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trackItemTitle}>{st.title}</Text>
                        <Text style={styles.trackItemDesc}>{st.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 4. SOLAR LOAN & EMI FINANCING PLANNER */}
            {activeSubModule === 'FINANCING' && (
              <View>
                <Text style={styles.cardSectionHeader}>PM Surya Ghar 7% p.a. Concessional Solar Loan</Text>
                <View style={styles.calcBox}>
                  <Text style={styles.inputLabel}>SYSTEM CAPACITY (kW)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={loanCapInput}
                    onChangeText={setLoanCapInput}
                    placeholder="3.3"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.inputLabel}>CUSTOMER DOWN PAYMENT (₹)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={downPaymentInput}
                    onChangeText={setDownPaymentInput}
                    placeholder="20000"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.inputLabel}>LOAN TENURE (YEARS)</Text>
                  <View style={styles.chipRow}>
                    {[3, 5, 7].map((yr) => (
                      <TouchableOpacity
                        key={yr}
                        style={[styles.smallChip, loanTenureYears === yr && styles.smallChipSelected]}
                        onPress={() => setLoanTenureYears(yr)}
                      >
                        <Text style={[styles.smallChipText, loanTenureYears === yr && styles.smallChipTextSelected]}>
                          {yr} Years ({yr * 12} Mos)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.calcBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Gross Solar Cost</Text>
                      <Text style={styles.breakdownVal}>₹{loanGross.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: '#059669' }]}>PM Surya Ghar Subsidy</Text>
                      <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '800' }]}>
                        -₹{loanSub.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Net System Payable</Text>
                      <Text style={styles.breakdownVal}>₹{loanNetInvestment.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Down Payment</Text>
                      <Text style={styles.breakdownVal}>-₹{downPay.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }]}>
                      <Text style={styles.netLabel}>Bank Loan Principal</Text>
                      <Text style={styles.netVal}>₹{principal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Interest Rate (Govt. Surcharge)</Text>
                      <Text style={styles.breakdownBold}>{loanInterestRate}% p.a.</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { fontWeight: '700', color: '#b45309' }]}>
                        Monthly Bank EMI
                      </Text>
                      <Text style={[styles.breakdownVal, { fontWeight: '900', color: '#b45309', fontSize: 16 }]}>
                        ₹{monthlyEmi.toLocaleString('en-IN')} / mo
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Monthly Bill Savings</Text>
                      <Text style={[styles.breakdownVal, { color: '#2563eb', fontWeight: '800' }]}>
                        +₹{loanMonthlySavings.toLocaleString('en-IN')} / mo
                      </Text>
                    </View>

                    <View style={[styles.breakdownRow, { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 10, marginTop: 8 }]}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#047857' }}>
                        NET MONTHLY PROFIT
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#047857' }}>
                        +₹{netMonthlyCashBenefit.toLocaleString('en-IN')} / mo
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareLoanWhatsApp}>
                    <MessageCircle size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.whatsappBtnText}>Share Financing on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5. DISCOM NET METERING */}
            {activeSubModule === 'DISCOM' && (
              <View>
                <Text style={styles.cardSectionHeader}>DISCOM Net-Metering Tracker</Text>
                {discomList.map((disc) => (
                  <View key={disc.id} style={styles.quoteCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteNumber}>{disc.appNo}</Text>
                      <Text style={styles.quoteCustomer}>{disc.consumerName}</Text>
                      <Text style={styles.surveyDate}>
                        Consumer #: {disc.consumerNumber} • {disc.discomName}
                      </Text>
                      <Text style={styles.surveyDate}>
                        Meter Serial: {disc.meterSerial} • Sanction: {disc.sanctionedLoadKw} kW
                      </Text>
                    </View>
                    <View style={[styles.surveyStatusPill, { backgroundColor: '#f0fdfa' }]}>
                      <Text style={[styles.surveyStatusText, { color: '#0d9488' }]}>{disc.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 6. FINANCE & INVOICING */}
            {activeSubModule === 'FINANCE' && (
              <View>
                <Text style={styles.cardSectionHeader}>Solar EPC Financial Dashboard</Text>
                {loadingFinance ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
                ) : (
                  <>
                    <View style={styles.financeMetricsRow}>
                      <View style={[styles.financeMetricCard, { backgroundColor: '#059669' }]}>
                        <Text style={styles.financeMetricLabel}>COLLECTIONS REALIZED</Text>
                        <Text style={styles.financeMetricVal}>
                          ₹{financeData.totalRevenue.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={[styles.financeMetricCard, { backgroundColor: '#d97706' }]}>
                        <Text style={styles.financeMetricLabel}>OUTSTANDING DUES</Text>
                        <Text style={styles.financeMetricVal}>
                          ₹{financeData.outstanding.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* PM Surya Ghar & Overdue Banner */}
                    {financeData.overdueCount > 0 && (
                      <View style={styles.overdueNoticeCard}>
                        <AlertTriangle size={16} color="#e11d48" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.overdueNoticeTitle}>
                            {financeData.overdueCount} Milestone Invoice{financeData.overdueCount > 1 ? 's' : ''} Overdue
                          </Text>
                          <Text style={styles.overdueNoticeSub}>
                            Total ₹{financeData.overdueAmount.toLocaleString('en-IN')} past due date
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.subsidyPillRow}>
                      <ShieldCheck size={14} color="#2563eb" />
                      <Text style={styles.subsidyPillText}>
                        PM Surya Ghar DBT Pipeline: ₹{(financeData.expectedSubsidies / 100000).toFixed(2)} Lakhs
                      </Text>
                    </View>
                  </>
                )}

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['ALL', 'OVERDUE', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((filterKey) => (
                      <TouchableOpacity
                        key={filterKey}
                        onPress={() => setFinanceFilter(filterKey)}
                        style={[
                          styles.financeFilterTab,
                          financeFilter === filterKey && styles.financeFilterTabActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.financeFilterTabText,
                            financeFilter === filterKey && styles.financeFilterTabTextActive,
                          ]}
                        >
                          {filterKey === 'ALL'
                            ? 'All Invoices'
                            : filterKey === 'OVERDUE'
                            ? `Overdue (${financeData.overdueCount})`
                            : filterKey === 'UNPAID'
                            ? 'Unpaid'
                            : filterKey === 'PARTIAL'
                            ? 'Partial'
                            : 'Paid'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Invoices List */}
                <Text style={styles.cardSectionHeader}>
                  Customer Invoices ({
                    financeData.invoices.filter((inv: any) => {
                      const cur = inv.computedStatus || inv.status;
                      if (financeFilter === 'ALL') return true;
                      if (financeFilter === 'OVERDUE') return inv.isOverdue || cur === 'OVERDUE';
                      if (financeFilter === 'UNPAID') return ['UNPAID', 'PENDING'].includes(cur) && !inv.isOverdue;
                      return cur === financeFilter;
                    }).length
                  })
                </Text>

                {financeData.invoices.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No invoices issued yet.</Text>
                  </View>
                ) : (
                  financeData.invoices
                    .filter((inv: any) => {
                      const cur = inv.computedStatus || inv.status;
                      if (financeFilter === 'ALL') return true;
                      if (financeFilter === 'OVERDUE') return inv.isOverdue || cur === 'OVERDUE';
                      if (financeFilter === 'UNPAID') return ['UNPAID', 'PENDING'].includes(cur) && !inv.isOverdue;
                      return cur === financeFilter;
                    })
                    .map((inv: any) => {
                      const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
                      const balance = inv.balance ?? Math.max(0, (inv.amount || 0) - totalPaid);
                      const isPaid = (inv.computedStatus || inv.status) === 'PAID';
                      const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < new Date() && !isPaid);

                      return (
                        <View key={inv.id} style={styles.financeInvoiceCard}>
                          {/* Top Row: Number, Capacity, Status */}
                          <View style={styles.invoiceTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Receipt size={16} color="#059669" />
                              <Text style={styles.invoiceNumberText}>{inv.invoiceNumber || 'INV-2026'}</Text>
                              {inv.project?.capacity && (
                                <View style={styles.capacityBadge}>
                                  <Text style={styles.capacityBadgeText}>{inv.project.capacity} kWp</Text>
                                </View>
                              )}
                            </View>
                            <View
                              style={[
                                styles.statusBadgeContainer,
                                isPaid
                                  ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                                  : isOverdue
                                  ? { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }
                                  : totalPaid > 0
                                  ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                                  : { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isPaid
                                    ? { color: '#059669' }
                                    : isOverdue
                                    ? { color: '#e11d48' }
                                    : totalPaid > 0
                                    ? { color: '#2563eb' }
                                    : { color: '#d97706' },
                                ]}
                              >
                                {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                              </Text>
                            </View>
                          </View>

                          {/* Customer & Milestone Info */}
                          <Text style={styles.invoiceCustomerText}>{inv.customer?.name || 'Customer'}</Text>
                          <Text style={styles.invoiceMilestoneText}>
                            {inv.milestoneTitle || inv.milestone || 'Solar EPC Milestone'}
                          </Text>

                          {/* Amounts */}
                          <View style={styles.invoiceAmountsRow}>
                            <View>
                              <Text style={styles.amountLabel}>Total Billed</Text>
                              <Text style={styles.amountVal}>₹{(inv.amount || 0).toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.amountLabel}>Remaining Due</Text>
                              <Text style={[styles.amountVal, { color: balance > 0 ? '#d97706' : '#059669' }]}>
                                ₹{balance.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>

                          {/* Action Buttons Row */}
                          <View style={styles.invoiceActionsRow}>
                            {!isPaid && (
                              <TouchableOpacity
                                style={styles.invoicePayBtn}
                                onPress={() => {
                                  setTargetInvoice(inv);
                                  setPayAmountInput(String(balance || inv.amount || ''));
                                  setPayModeInput('UPI');
                                  setPayRefInput('');
                                  setPaymentModalVisible(true);
                                }}
                              >
                                <CreditCard size={13} color="#ffffff" />
                                <Text style={styles.invoicePayBtnText}>Record Pay</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={styles.invoiceWhatsAppBtn}
                              onPress={() => handleMobileWhatsAppNotice(inv)}
                            >
                              <MessageCircle size={13} color="#059669" />
                              <Text style={styles.invoiceWhatsAppBtnText}>WhatsApp</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                )}
              </View>
            )}

            {/* 7. PROCUREMENT & STOCK */}
            {activeSubModule === 'PROCUREMENT' && (
              <View>
                <Text style={styles.cardSectionHeader}>Procurement & Stock Status</Text>
                <View style={{ gap: 10 }}>
                  <View style={styles.inventoryItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invTitle}>Waaree 550Wp Mono PERC PV Modules (DCR Compliant)</Text>
                      <Text style={styles.invCategory}>Supplier: Waaree Solar • Status: In Stock</Text>
                    </View>
                    <Text style={styles.invStock}>48 Units</Text>
                  </View>
                  <View style={styles.inventoryItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invTitle}>Growatt 3.3kW & 5kW Dual-MPPT Inverters</Text>
                      <Text style={styles.invCategory}>Supplier: Growatt New Energy • Status: In Stock</Text>
                    </View>
                    <Text style={styles.invStock}>6 Units</Text>
                  </View>
                  <View style={styles.inventoryItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invTitle}>HDG Elevated Rooftop Structure Kits (60-80μ)</Text>
                      <Text style={styles.invCategory}>Supplier: Metalkraft Infra • Status: In Transit</Text>
                    </View>
                    <Text style={styles.invStock}>4 Kits</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 8. AMC */}
            {activeSubModule === 'AMC' && (
              <View>
                <Text style={styles.cardSectionHeader}>Active Maintenance Contracts & Service</Text>
                {loadingAmcs ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
                ) : amcs.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ShieldCheck size={28} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Active AMCs</Text>
                    <Text style={styles.emptyText}>
                      Solar maintenance packages will appear here once registered.
                    </Text>
                  </View>
                ) : (
                  amcs.map((amc: any) => (
                    <View key={amc.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{amc.planName || 'Comprehensive Solar AMC'}</Text>
                        <Text style={styles.quoteCustomer}>{amc.customer?.name || 'Customer'}</Text>
                      </View>
                      <View style={styles.surveyStatusPill}>
                        <Text style={styles.surveyStatusText}>{amc.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 9. SUPER ADMIN */}
            {activeSubModule === 'SUPER_ADMIN' && user?.role === 'SUPER_ADMIN' && (
              <View>
                <Text style={styles.cardSectionHeader}>Registered Tenants</Text>
                {loadingTenants ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
                ) : tenants.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No registered tenants found.</Text>
                  </View>
                ) : (
                  tenants.map((t) => (
                    <View key={t.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{t.name}</Text>
                        <Text style={styles.quoteCustomer}>{t.email} • {t.city || 'India'}</Text>
                      </View>
                      <View style={styles.surveyStatusPill}>
                        <Text style={styles.surveyStatusText}>{t.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* SCHEDULE SURVEY MODAL */}
      <Modal visible={scheduleSurveyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            <View style={styles.modalDragHandle} />

            <View style={styles.subModalHeader}>
              <View>
                <Text style={styles.modalTitle}>Schedule Site Survey</Text>
                <Text style={styles.modalSubtitle}>Dispatch technical evaluation team</Text>
              </View>
              <TouchableOpacity onPress={() => setScheduleSurveyModal(false)}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>CUSTOMER NAME *</Text>
              <TextInput
                style={styles.calcInput}
                value={surveyForm.customerName}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, customerName: t })}
                placeholder="e.g. Surendra Sharma"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>MOBILE NUMBER *</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="phone-pad"
                value={surveyForm.phone}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, phone: t })}
                placeholder="9876543210"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>SITE ADDRESS</Text>
              <TextInput
                style={styles.calcInput}
                value={surveyForm.address}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, address: t })}
                placeholder="Rooftop location address"
                placeholderTextColor="#94a3b8"
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>SIZING (kWp)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={surveyForm.proposedCap}
                    onChangeText={(t) => setSurveyForm({ ...surveyForm, proposedCap: t })}
                    placeholder="3.3"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ROOF TYPE</Text>
                  <TextInput
                    style={styles.calcInput}
                    value={surveyForm.roofType}
                    onChangeText={(t) => setSurveyForm({ ...surveyForm, roofType: t })}
                    placeholder="RCC Flat Roof"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>DISCOM CONSUMER NUMBER (CA #)</Text>
              <TextInput
                style={styles.calcInput}
                value={surveyForm.discomConsumerNo}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, discomConsumerNo: t })}
                placeholder="e.g. 028540192842"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={styles.saveQuoteBtn}
                onPress={handleScheduleSurveySubmit}
                disabled={savingSurvey}
                activeOpacity={0.85}
              >
                <Text style={styles.saveQuoteBtnText}>
                  {savingSurvey ? 'Scheduling...' : 'Confirm Appointment'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            <View style={styles.modalDragHandle} />

            <View style={styles.subModalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Payment</Text>
                <Text style={styles.modalSubtitle}>
                  Invoice: {targetInvoice?.invoiceNumber || 'INV'} • Total: ₹{(targetInvoice?.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>AMOUNT RECEIVED (₹) *</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="numeric"
                value={payAmountInput}
                onChangeText={setPayAmountInput}
                placeholder="Enter amount in ₹"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>PAYMENT MODE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(['UPI', 'BANK_TRANSFER', 'CHEQUE', 'CASH'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPayModeInput(mode)}
                    style={[
                      styles.modePill,
                      payModeInput === mode && styles.modePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        payModeInput === mode && styles.modePillTextActive,
                      ]}
                    >
                      {mode === 'BANK_TRANSFER' ? 'NEFT/RTGS' : mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>UTR / CHEQUE / REFERENCE NO</Text>
              <TextInput
                style={styles.calcInput}
                value={payRefInput}
                onChangeText={setPayRefInput}
                placeholder="e.g. UTR-90214451 or Cheque #1023"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={styles.saveQuoteBtn}
                onPress={handleRecordMobilePayment}
                disabled={submittingPay}
                activeOpacity={0.85}
              >
                <Text style={styles.saveQuoteBtnText}>
                  {submittingPay ? 'Recording...' : 'Confirm & Generate Receipt'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SAVED QUOTATION VISUAL PROPOSAL PREVIEW MODAL */}
      {previewQuoteData && (
        <ProposalPreviewModal
          visible={Boolean(previewQuoteData)}
          onClose={() => setPreviewQuoteData(null)}
          data={previewQuoteData}
          isSynced={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  categoryGrid: {
    gap: 10,
  },
  moduleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  moduleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moduleTileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  moduleTileDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
  },
  subModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeSubModalBtn: {
    padding: 6,
  },
  cardSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  calcBox: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  calcInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  smallChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  smallChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  smallChipTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
  calcBreakdown: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  breakdownBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  netVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  quoteActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  saveQuoteBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveQuoteBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  quoteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  quoteCustomer: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  quoteTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  quoteStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  convertQuoteSmallBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  convertQuoteSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  quoteActionSmallBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quoteActionSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionTitleWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  surveyDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
  },
  surveyStatusPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  surveyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  subsidySlabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  slabBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  slabTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  slabAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
  },
  slabDesc: {
    fontSize: 9,
    color: '#94a3b8',
  },
  stageTrackBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  trackItemRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  trackCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCircleDone: {
    backgroundColor: '#059669',
  },
  trackCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  trackItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  trackItemDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  financeMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  financeMetricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  financeMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  financeMetricVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  overdueNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  overdueNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  overdueNoticeSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#be123c',
    marginTop: 1,
  },
  subsidyPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  subsidyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  financeFilterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  financeFilterTabActive: {
    backgroundColor: '#059669',
  },
  financeFilterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  financeFilterTabTextActive: {
    color: '#ffffff',
  },
  financeInvoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invoiceNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  capacityBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  capacityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  statusBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  invoiceCustomerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  invoiceMilestoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  invoiceAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  invoiceActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  invoicePayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 12,
  },
  invoicePayBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  invoiceWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 9,
    borderRadius: 12,
  },
  invoiceWhatsAppBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: '#059669',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  modePillTextActive: {
    color: '#ffffff',
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  invCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invStock: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContentBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
