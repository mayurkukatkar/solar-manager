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
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
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
import { useAuth } from '../../context/AuthContext';
import { Quotation, Tenant, SiteSurvey, Invoice, SubsidyApplication } from '../../types';

export const ModulesScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const { user } = useAuth();

  // Active Sub-Module Modal
  const [activeSubModule, setActiveSubModule] = useState<string | null>(
    route?.params?.openQuote
      ? 'QUOTES'
      : route?.params?.screen || null
  );

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
  const [loanInterestRate] = useState(7.0); // 7% p.a. PM Surya Ghar nationalized bank rate

  // 6. Finance State
  const [financeData, setFinanceData] = useState<{
    totalRevenue: number;
    outstanding: number;
    invoices: Invoice[];
  }>({
    totalRevenue: 0,
    outstanding: 0,
    invoices: [],
  });
  const [loadingFinance, setLoadingFinance] = useState(false);

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
      const [dash, fin] = await Promise.all([
        tenantApi.getDashboard().catch(() => null),
        financeApi.getInvoices().catch(() => null),
      ]);
      setFinanceData({
        totalRevenue: dash?.totalRevenue || 0,
        outstanding: dash?.outstanding || 0,
        invoices: fin?.finance || [],
      });
    } catch (err: any) {
      console.warn('Finance fetch notice:', err.message);
    } finally {
      setLoadingFinance(false);
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
        systemCapacity: kw,
        panelBrand: selectedPanelBrand,
        inverterBrand: selectedInverterBrand,
        structureType: selectedStructure,
        subtotal: baseEquip + baseServices,
        tax: gst,
        total: grossTotal,
        notes: `Estimated CFA Subsidy: ₹${subsidy.toLocaleString('en-IN')}. Net: ₹${netPayable.toLocaleString('en-IN')}`,
      });
      Alert.alert('Proposal Generated! 📄', 'Quotation has been recorded in your central ERP repository.');
      fetchQuotations();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Quotation generated locally.');
    } finally {
      setSavingQuote(false);
    }
  };

  const handleConvertQuotationToProject = async (quoteId: string) => {
    try {
      await quotationsApi.convertQuotation(quoteId);
      Alert.alert('Project Provisioned! 🎉', 'Accepted quotation converted into an active execution project.');
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
        proposedCap: parseFloat(surveyForm.proposedCap) || 3.3,
        roofType: surveyForm.roofType,
        notes: surveyForm.notes,
        surveyDate: surveyForm.surveyDate || new Date().toISOString(),
      });
      Alert.alert('Survey Scheduled! 📐', 'Technical site evaluation recorded.');
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

💰 Turnkey System Cost: ₹${grossTotal.toLocaleString('en-IN')}
🏛️ Govt. CFA Subsidy: -₹${subsidy.toLocaleString('en-IN')}
✅ Customer Net Payable: ₹${netPayable.toLocaleString('en-IN')}

📈 Estimated Monthly Generation: ~${monthlyUnits} Units
💵 Monthly Electricity Savings: ~₹${monthlySavings.toLocaleString('en-IN')}
⏱️ Payback Period: ~${paybackYears} Years

Let's schedule your 3D roof survey!`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Unable to launch WhatsApp directly.');
    });
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

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Unable to launch WhatsApp directly.');
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Solar Enterprise Hub"
        subtitle="Turnkey modules, compliance, financing & statutory packs"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* GROUP 1: SALES & ESTIMATION */}
        <Text style={styles.groupTitle}>SALES & ESTIMATION</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('QUOTES')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#eff6ff' }]}>
              <Text style={{ fontSize: 24 }}>📄</Text>
            </View>
            <Text style={styles.moduleName}>Quotations Engine</Text>
            <Text style={styles.moduleDesc}>60s quotes, PM Surya Ghar CFA calculations & proposal dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('SURVEYS')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Text style={{ fontSize: 24 }}>📐</Text>
            </View>
            <Text style={styles.moduleName}>Site Surveys</Text>
            <Text style={styles.moduleDesc}>Rooftop measurements, shadow analysis & technical feasibility</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 2: FINANCING & PM SURYA GHAR COMPLIANCE */}
        <Text style={styles.groupTitle}>FINANCING & PM SURYA GHAR</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('SUBSIDY')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#fef3c7' }]}>
              <Text style={{ fontSize: 24 }}>🏛️</Text>
            </View>
            <Text style={styles.moduleName}>PM Surya Ghar Studio</Text>
            <Text style={styles.moduleDesc}>7-stage national portal tracking, consumer CA & DBT release</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('FINANCING')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#f5f3ff' }]}>
              <Text style={{ fontSize: 24 }}>🧮</Text>
            </View>
            <Text style={styles.moduleName}>Solar Loan & EMI Planner</Text>
            <Text style={styles.moduleDesc}>7% concessional bank EMI vs electricity bill savings calculator</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 3: DISCOM & BILLING */}
        <Text style={styles.groupTitle}>DISCOM & INVOICING</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('DISCOM')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#f0fdfa' }]}>
              <Text style={{ fontSize: 24 }}>🔌</Text>
            </View>
            <Text style={styles.moduleName}>DISCOM Net-Metering</Text>
            <Text style={styles.moduleDesc}>MSEDCL, Tata Power & state discom meter synchronization</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('FINANCE')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#eef2ff' }]}>
              <Text style={{ fontSize: 24 }}>💰</Text>
            </View>
            <Text style={styles.moduleName}>Finance & Invoicing</Text>
            <Text style={styles.moduleDesc}>Milestone billing (20/60/15/5), tax invoices & payment status</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 4: OPERATIONS & MAINTENANCE */}
        <Text style={styles.groupTitle}>PROCUREMENT & AMC</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('PROCUREMENT')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#fdf2f8' }]}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
            <Text style={styles.moduleName}>Procurement & Stock</Text>
            <Text style={styles.moduleDesc}>DCR modules, grid-tie inverters, ACDB/DCDB & material dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('AMC')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#fff1f2' }]}>
              <Text style={{ fontSize: 24 }}>🛠️</Text>
            </View>
            <Text style={styles.moduleName}>AMC & Support</Text>
            <Text style={styles.moduleDesc}>Preventive maintenance agreements & post-commissioning service</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 5: SUPER ADMIN GOVERNANCE */}
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <Text style={styles.groupTitle}>PLATFORM GOVERNANCE</Text>
            <View style={styles.modulesGrid}>
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => handleOpenModule('SUPER_ADMIN')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: '#fdf4ff' }]}>
                  <Text style={{ fontSize: 24 }}>👑</Text>
                </View>
                <Text style={styles.moduleName}>Platform Super Admin</Text>
                <Text style={styles.moduleDesc}>Global tenant roster, provisioning & platform telemetry</Text>
              </TouchableOpacity>
            </View>
          </>
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
              <Text style={styles.closeSubModalText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
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
                  />

                  <Text style={styles.inputLabel}>RECOMMENDED CAPACITY (kWp)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={capacityInput}
                    onChangeText={setCapacityInput}
                    placeholder="3.3"
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
                      <Text style={styles.breakdownLabel}>Gross Solar System Cost:</Text>
                      <Text style={styles.breakdownVal}>₹{grossTotal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: '#047857', fontWeight: '700' }]}>
                        Govt. CFA Subsidy (Surya Ghar):
                      </Text>
                      <Text style={[styles.breakdownVal, { color: '#047857', fontWeight: '800' }]}>
                        -₹{subsidy.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                      <Text style={styles.netLabel}>Customer Net Investment:</Text>
                      <Text style={styles.netVal}>₹{netPayable.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Monthly Solar Power Produced:</Text>
                      <Text style={styles.breakdownVal}>~{monthlyUnits} Units/mo</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Monthly Electricity Savings:</Text>
                      <Text style={[styles.breakdownVal, { color: '#2563eb' }]}>
                        ~₹{monthlySavings.toLocaleString('en-IN')}/mo
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimated Payback Period:</Text>
                      <Text style={styles.breakdownBold}>{paybackYears} Years</Text>
                    </View>
                  </View>

                  <View style={styles.quoteActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.saveQuoteBtn}
                      onPress={handleSaveQuotation}
                      disabled={savingQuote}
                    >
                      <Text style={styles.saveQuoteBtnText}>
                        {savingQuote ? 'Saving...' : '💾 Save Quotation'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
                      <Text style={styles.whatsappBtnText}>💬 WhatsApp Proposal</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* RECENT QUOTATIONS REPOSITORY */}
                <Text style={[styles.cardSectionHeader, { marginTop: 24 }]}>
                  Saved Quotations ({quotations.length})
                </Text>
                {loadingQuotes ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
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
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={styles.quoteTotal}>₹{(q.total || 0).toLocaleString('en-IN')}</Text>
                        <TouchableOpacity
                          style={styles.convertQuoteSmallBtn}
                          onPress={() => handleConvertQuotationToProject(q.id)}
                        >
                          <Text style={styles.convertQuoteSmallBtnText}>Convert →</Text>
                        </TouchableOpacity>
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
                    <Text style={styles.addSmallBtnText}>+ Schedule Survey</Text>
                  </TouchableOpacity>
                </View>

                {loadingSurveys ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                ) : surveys.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📐</Text>
                    <Text style={styles.emptyTitle}>No Surveys Scheduled</Text>
                    <Text style={styles.emptyText}>
                      Schedule site visits to evaluate shadow profiles, roof orientations, and electrical panels.
                    </Text>
                  </View>
                ) : (
                  surveys.map((s) => (
                    <View key={s.id} style={styles.surveyCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.surveyCustName}>{s.customer?.name || s.lead?.name || 'Customer'}</Text>
                        <Text style={styles.surveyAddress}>
                          📍 {s.customer?.address || s.customer?.city || 'Site Address'}
                        </Text>
                        <Text style={styles.surveyDate}>
                          📅 Date: {s.surveyDate ? new Date(s.surveyDate).toLocaleDateString() : 'Scheduled'} • Cap: {s.proposedCap || 3.3} kW
                        </Text>
                      </View>
                      <View style={styles.surveyStatusPill}>
                        <Text style={styles.surveyStatusText}>{s.status || 'SCHEDULED'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 3. PM SURYA GHAR SUBSIDY */}
            {activeSubModule === 'SUBSIDY' && (
              <View>
                <Text style={styles.cardSectionHeader}>PM Surya Ghar CFA National Portal Studio</Text>
                
                {/* SLAB CARDS */}
                <View style={styles.subsidySlabRow}>
                  <View style={styles.slabBox}>
                    <Text style={styles.slabTitle}>1 kW System</Text>
                    <Text style={styles.slabAmount}>₹30,000</Text>
                    <Text style={styles.slabDesc}>CFA Direct Credit</Text>
                  </View>
                  <View style={styles.slabBox}>
                    <Text style={styles.slabTitle}>2 kW System</Text>
                    <Text style={styles.slabAmount}>₹60,000</Text>
                    <Text style={styles.slabDesc}>CFA Direct Credit</Text>
                  </View>
                  <View style={[styles.slabBox, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.slabTitle, { color: '#047857' }]}>3 kW+ System</Text>
                    <Text style={[styles.slabAmount, { color: '#047857' }]}>₹78,000</Text>
                    <Text style={styles.slabDesc}>Max Central Subsidy</Text>
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
                        <Text style={[styles.trackCircleText, st.done && { color: '#fff' }]}>{st.step}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trackItemTitle}>{st.title}</Text>
                        <Text style={styles.trackItemDesc}>{st.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* REAL SUBSIDY APPLICATIONS FROM BACKEND */}
                <Text style={[styles.cardSectionHeader, { marginTop: 20 }]}>
                  Live Portal Applications ({subsidies.length})
                </Text>
                {loadingSubsidies ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                ) : subsidies.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>🏛️</Text>
                    <Text style={styles.emptyTitle}>No Portal Applications Yet</Text>
                    <Text style={styles.emptyText}>
                      When a solar project reaches the subsidy stage, it will appear here with national portal tracking.
                    </Text>
                  </View>
                ) : (
                  subsidies.map((sub) => (
                    <View key={sub.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{sub.nationalPortalAppNo || 'PMSG-MH-2026'}</Text>
                        <Text style={styles.quoteCustomer}>{sub.customerName || 'Solar Consumer'}</Text>
                        <Text style={styles.surveyAddress}>
                          CA: {sub.consumerNumber || 'N/A'} • {sub.discomName || 'MSEDCL'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.quoteTotal}>₹{(sub.cfaAmount || 78000).toLocaleString('en-IN')}</Text>
                        <View style={styles.surveyStatusPill}>
                          <Text style={styles.surveyStatusText}>{sub.status || 'FEASIBILITY_APPROVED'}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
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
                  />

                  <Text style={styles.inputLabel}>CUSTOMER DOWN PAYMENT (₹)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={downPaymentInput}
                    onChangeText={setDownPaymentInput}
                    placeholder="20000"
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
                      <Text style={styles.breakdownLabel}>Gross Solar Cost:</Text>
                      <Text style={styles.breakdownVal}>₹{loanGross.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: '#047857' }]}>PM Surya Ghar Subsidy:</Text>
                      <Text style={[styles.breakdownVal, { color: '#047857', fontWeight: '800' }]}>
                        -₹{loanSub.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Net System Payable:</Text>
                      <Text style={styles.breakdownVal}>₹{loanNetInvestment.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Down Payment:</Text>
                      <Text style={styles.breakdownVal}>-₹{downPay.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                      <Text style={styles.netLabel}>Bank Loan Principal:</Text>
                      <Text style={styles.netVal}>₹{principal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Interest Rate (Govt. Surcharge):</Text>
                      <Text style={styles.breakdownBold}>{loanInterestRate}% p.a.</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { fontWeight: '800', color: '#b45309' }]}>
                        Monthly Bank EMI:
                      </Text>
                      <Text style={[styles.breakdownVal, { fontWeight: '900', color: '#b45309', fontSize: 16 }]}>
                        ₹{monthlyEmi.toLocaleString('en-IN')} / mo
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Monthly Electricity Bill Savings:</Text>
                      <Text style={[styles.breakdownVal, { color: '#2563eb', fontWeight: '800' }]}>
                        +₹{loanMonthlySavings.toLocaleString('en-IN')} / mo
                      </Text>
                    </View>

                    <View style={[styles.breakdownRow, { backgroundColor: '#ecfdf5', padding: 10, borderRadius: 8, marginTop: 8 }]}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#047857' }}>
                        NET MONTHLY PROFIT:
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#047857' }}>
                        +₹{netMonthlyCashBenefit.toLocaleString('en-IN')} / mo
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareLoanWhatsApp}>
                    <Text style={styles.whatsappBtnText}>💬 Share Loan Financing on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5. DISCOM NET METERING */}
            {activeSubModule === 'DISCOM' && (
              <View>
                <Text style={styles.cardSectionHeader}>DISCOM Net-Metering Tracker</Text>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoTitle}>Grid Interconnection & Bi-directional Metering</Text>
                  <Text style={styles.infoText}>
                    Track consumer net-metering applications across MSEDCL, Tata Power, BESCOM, Adani Electricity and state utilities.
                  </Text>
                </View>

                {discomList.map((disc) => (
                  <View key={disc.id} style={styles.quoteCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteNumber}>{disc.appNo}</Text>
                      <Text style={styles.quoteCustomer}>{disc.consumerName}</Text>
                      <Text style={styles.surveyAddress}>
                        Consumer #: {disc.consumerNumber} • {disc.discomName} ({disc.division})
                      </Text>
                      <Text style={styles.surveyDate}>
                        Meter Serial: {disc.meterSerial} • Sanction: {disc.sanctionedLoadKw} kW
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={[styles.surveyStatusPill, { backgroundColor: '#f0fdfa' }]}>
                        <Text style={[styles.surveyStatusText, { color: '#0d9488' }]}>{disc.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 6. FINANCE & INVOICING */}
            {activeSubModule === 'FINANCE' && (
              <View>
                <Text style={styles.cardSectionHeader}>Financial & Milestone Billing Overview</Text>
                {loadingFinance ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                ) : (
                  <View style={styles.financeMetricsRow}>
                    <View style={[styles.financeMetricCard, { backgroundColor: colors.slate900 }]}>
                      <Text style={styles.financeMetricLabel}>TOTAL REVENUE BOOKED</Text>
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
                )}

                <Text style={[styles.cardSectionHeader, { marginTop: 20 }]}>
                  Customer Invoices ({financeData.invoices.length})
                </Text>
                {financeData.invoices.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No invoices issued yet.</Text>
                  </View>
                ) : (
                  financeData.invoices.map((inv: any) => (
                    <View key={inv.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{inv.invoiceNumber || 'INV-2026'}</Text>
                        <Text style={styles.quoteCustomer}>{inv.customer?.name || 'Customer'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.quoteTotal}>₹{(inv.amount || 0).toLocaleString('en-IN')}</Text>
                        <Text style={[styles.quoteStatus, inv.status === 'PAID' && { color: '#059669' }]}>
                          {inv.status || 'UNPAID'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 7. PROCUREMENT & STOCK */}
            {activeSubModule === 'PROCUREMENT' && (
              <View>
                <Text style={styles.cardSectionHeader}>Procurement & Material Logistics</Text>
                {loadingProcurement ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                ) : purchaseOrders.length === 0 ? (
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
                        <Text style={styles.invTitle}>HDG Elevated Rooftop Structure Kits (60-80 Micron)</Text>
                        <Text style={styles.invCategory}>Supplier: Metalkraft Infra • Status: In Transit</Text>
                      </View>
                      <Text style={styles.invStock}>4 Kits</Text>
                    </View>
                  </View>
                ) : (
                  purchaseOrders.map((po) => (
                    <View key={po.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{po.poNumber || 'PO-2026'}</Text>
                        <Text style={styles.quoteCustomer}>{po.supplierName || 'Solar Vendor'}</Text>
                      </View>
                      <Text style={styles.quoteStatus}>{po.status || 'ORDERED'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 8. AMC */}
            {activeSubModule === 'AMC' && (
              <View>
                <Text style={styles.cardSectionHeader}>Active Maintenance Contracts & Service</Text>
                {loadingAmcs ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                ) : amcs.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No active AMC agreements yet. Solar maintenance packages will appear here once registered.
                    </Text>
                  </View>
                ) : (
                  amcs.map((amc: any) => (
                    <View key={amc.id} style={styles.amcCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.amcTitle}>{amc.planName || 'Comprehensive Solar AMC'}</Text>
                        <Text style={styles.amcClient}>{amc.customer?.name || 'Customer'}</Text>
                        <Text style={styles.amcDate}>Status: {amc.status}</Text>
                      </View>
                      <View style={styles.amcBadge}>
                        <Text style={styles.amcBadgeText}>{amc.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 9. SUPER ADMIN TENANTS */}
            {activeSubModule === 'SUPER_ADMIN' && user?.role === 'SUPER_ADMIN' && (
              <View>
                <Text style={styles.cardSectionHeader}>Platform Tenants Management</Text>
                {loadingTenants ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                ) : tenants.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No registered tenants found.</Text>
                  </View>
                ) : (
                  tenants.map((t) => (
                    <View key={t.id} style={styles.tenantCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tenantName}>{t.name}</Text>
                        <Text style={styles.tenantMeta}>
                          📍 {t.city || 'India'} • 📞 {t.phone || 'N/A'}
                        </Text>
                        <Text style={styles.tenantEmail}>✉️ {t.email}</Text>
                      </View>
                      <View style={styles.tenantStatusBadge}>
                        <Text style={styles.tenantStatusText}>{t.status || 'ACTIVE'}</Text>
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
            <View style={styles.subModalHeader}>
              <View>
                <Text style={styles.modalTitle}>Schedule Site Survey</Text>
                <Text style={styles.modalSubtitle}>Dispatch technical evaluation team</Text>
              </View>
              <TouchableOpacity onPress={() => setScheduleSurveyModal(false)}>
                <Text style={styles.closeSubModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>CUSTOMER NAME *</Text>
              <TextInput
                style={styles.calcInput}
                value={surveyForm.customerName}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, customerName: t })}
                placeholder="e.g. Surendra Sharma"
              />

              <Text style={styles.inputLabel}>MOBILE NUMBER *</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="phone-pad"
                value={surveyForm.phone}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, phone: t })}
                placeholder="9876543210"
              />

              <Text style={styles.inputLabel}>SITE ADDRESS</Text>
              <TextInput
                style={styles.calcInput}
                value={surveyForm.address}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, address: t })}
                placeholder="Rooftop location address"
              />

              <Text style={styles.inputLabel}>ROOF TYPE</Text>
              <View style={styles.chipRow}>
                {['RCC Flat Roof', 'Metal Shed', 'High-Rise Elevated'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.smallChip, surveyForm.roofType === r && styles.smallChipSelected]}
                    onPress={() => setSurveyForm({ ...surveyForm, roofType: r })}
                  >
                    <Text style={[styles.smallChipText, surveyForm.roofType === r && styles.smallChipTextSelected]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.saveQuoteBtn}
                onPress={handleScheduleSurveySubmit}
                disabled={savingSurvey}
              >
                <Text style={styles.saveQuoteBtnText}>
                  {savingSurvey ? 'Scheduling...' : 'Confirm Survey Appointment'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  moduleCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 10,
    color: colors.slate500,
    lineHeight: 14,
  },
  subModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  subModalSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  closeSubModalBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeSubModalText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate700,
  },
  cardSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate800,
    marginBottom: 12,
  },
  calcBox: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  calcInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  smallChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  smallChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate600,
  },
  smallChipTextSelected: {
    color: '#059669',
    fontWeight: '800',
  },
  calcBreakdown: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.slate600,
    fontWeight: '500',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate900,
  },
  breakdownBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  netVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  quoteActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  saveQuoteBtn: {
    flex: 1,
    backgroundColor: colors.slate900,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveQuoteBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25d366',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsappBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  quoteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  quoteCustomer: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  quoteTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
  },
  quoteStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  convertQuoteSmallBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  convertQuoteSmallBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  sectionTitleWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSmallBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSmallBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  surveyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  surveyCustName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  surveyAddress: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  surveyDate: {
    fontSize: 10,
    color: colors.slate400,
    marginTop: 2,
  },
  surveyStatusPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  surveyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate800,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    color: colors.slate500,
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11,
    color: '#3b82f6',
    lineHeight: 15,
  },
  subsidySlabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  slabBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  slabTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate600,
  },
  slabAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
    marginVertical: 2,
  },
  slabDesc: {
    fontSize: 8,
    color: colors.slate400,
  },
  stageTrackBox: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  trackItemRow: {
    flexDirection: 'row',
    gap: 10,
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
    backgroundColor: '#10b981',
  },
  trackCircleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate600,
  },
  trackItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate800,
  },
  trackItemDesc: {
    fontSize: 10,
    color: colors.slate500,
  },
  financeMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  financeMetricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  financeMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  financeMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginTop: 4,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  invTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  invCategory: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 2,
  },
  invStock: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  amcCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  amcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  amcClient: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  amcDate: {
    fontSize: 10,
    color: colors.slate400,
    marginTop: 2,
  },
  amcBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  tenantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  tenantName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  tenantMeta: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  tenantEmail: {
    fontSize: 10,
    color: colors.slate400,
    marginTop: 2,
  },
  tenantStatusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tenantStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContentBox: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
});
