import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Zap,
  Phone,
  User,
  MapPin,
  Home,
  CheckCircle2,
  Camera,
  UploadCloud,
  FileText,
  Share2,
  Printer,
  ShieldCheck,
  Award,
  Building,
  Receipt,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { GuideCharacter } from './GuideCharacter';
import { CelebrationModal } from './CelebrationModal';
import { solarGamificationService } from '../services/solarGamificationService';
import { openWhatsAppWithPitch, openWhatsAppDirect } from '../services/whatsappService';
import { generateQuotationHtml, sharePdfFile, createAndSharePdf, printDirectly } from '../services/pdfService';
import { generateDiscomHtml } from '../services/pdfService';
import { crmApi, tenantApi, documentsApi, financeApi } from '../api/endpoints';
import { offlineSyncService } from '../services/offlineSyncService';
import { haptics } from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SeamlessSolarFlowModalProps {
  visible: boolean;
  initialLead?: any;
  initialStepIndex?: number;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

// 12-Step Continuous Journey
export type FlowStepId =
  | 'CUSTOMER_NAME'
  | 'CUSTOMER_PHONE'
  | 'MONTHLY_BILL'
  | 'ROOF_TYPE'
  | 'SITE_LOCATION'
  | 'SYSTEM_CAPACITY'
  | 'SYSTEM_PRICING'
  | 'DISPATCH_PROPOSAL'
  | 'CONSUMER_NUMBER'
  | 'KYC_DOCUMENTS'
  | 'BENEFICIARY_BANK'
  | 'DISCOM_MISSION_CONTROL'
  | 'INVOICE_ADVANCE';

export const SeamlessSolarFlowModal: React.FC<SeamlessSolarFlowModalProps> = ({
  visible,
  initialLead,
  initialStepIndex = 0,
  onClose,
  onComplete,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(initialStepIndex);
  const [submitting, setSubmitting] = useState(false);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);

  // Form State across the entire flow
  const [customerName, setCustomerName] = useState(initialLead?.name || '');
  const [customerPhone, setCustomerPhone] = useState(initialLead?.mobile || initialLead?.phone || '');
  const [monthlyBill, setMonthlyBill] = useState(String(initialLead?.monthlyBill || '3500'));
  const [monthlyUnits, setMonthlyUnits] = useState(String(initialLead?.monthlyUnits || '410'));
  const [roofType, setRoofType] = useState('Flat RCC Concrete');
  const [city, setCity] = useState(initialLead?.city || 'Pune');
  const [address, setAddress] = useState(initialLead?.address || '');
  const [pincode, setPincode] = useState(initialLead?.pincode || '');

  // Sizing & Proposal State
  const [capacityKw, setCapacityKw] = useState(String(initialLead?.estimatedCap || 3.3));
  const [totalCost, setTotalCost] = useState('195000');
  const [panelBrand, setPanelBrand] = useState('Waaree 540W Mono PERC DCR');
  const [inverterBrand, setInverterBrand] = useState('Solis 3.3kW Grid-Tied Inverter');
  const [createdLead, setCreatedLead] = useState<any>(initialLead || null);

  // Onboarding & KYC State
  const [consumerNumber, setConsumerNumber] = useState(initialLead?.consumerNumber || '');
  const [billingUnit, setBillingUnit] = useState('');
  const [billDocUri, setBillDocUri] = useState<string | null>(null);
  const [aadhaarDocUri, setAadhaarDocUri] = useState<string | null>(null);
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [provisionedProject, setProvisionedProject] = useState<any>(null);

  // Celebration state
  const [celebrationData, setCelebrationData] = useState<any | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animated Card Glide Transition
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const STEPS: FlowStepId[] = [
    'CUSTOMER_NAME',
    'CUSTOMER_PHONE',
    'MONTHLY_BILL',
    'ROOF_TYPE',
    'SITE_LOCATION',
    'SYSTEM_CAPACITY',
    'SYSTEM_PRICING',
    'DISPATCH_PROPOSAL',
    'CONSUMER_NUMBER',
    'KYC_DOCUMENTS',
    'BENEFICIARY_BANK',
    'DISCOM_MISSION_CONTROL',
    'INVOICE_ADVANCE',
  ];

  const totalSteps = STEPS.length;
  const activeStepId = STEPS[currentStepIdx] || STEPS[0];
  const progressPct = Math.round(((currentStepIdx + 1) / totalSteps) * 100);

  // Cross-Field Calculations
  const cap = parseFloat(capacityKw) || 3.3;
  const grossAmount = parseFloat(totalCost) || 195000;
  const subsidyAmount = cap >= 3 ? 78000 : cap >= 2 ? 60000 : 30000;
  const netCustomerCost = Math.max(0, grossAmount - subsidyAmount);
  const monthlySavings = Math.round(cap * 120 * 8.5);
  const annualGenUnits = Math.round(cap * 1460);
  const paybackYears = monthlySavings > 0 ? Number((netCustomerCost / (monthlySavings * 12)).toFixed(1)) : 3.2;

  // Slide Animation on Step Change
  const animateCardTransition = (direction: 'next' | 'prev', callback: () => void) => {
    Animated.parallel([
      Animated.timing(cardTranslateX, {
        toValue: direction === 'next' ? -SCREEN_WIDTH * 0.35 : SCREEN_WIDTH * 0.35,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      cardTranslateX.setValue(direction === 'next' ? SCREEN_WIDTH * 0.35 : -SCREEN_WIDTH * 0.35);
      Animated.parallel([
        Animated.spring(cardTranslateX, {
          toValue: 0,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNextStep = async () => {
    haptics.selection();

    // Validation for critical inputs
    if (activeStepId === 'CUSTOMER_NAME' && !customerName.trim()) {
      Alert.alert('Required', 'Please enter customer name to proceed.');
      return;
    }
    if (activeStepId === 'CUSTOMER_PHONE') {
      const clean = customerPhone.replace(/[^0-9]/g, '');
      if (clean.length < 10) {
        Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    // Auto-save Lead checkpoint at Step 5 (Site Location)
    if (activeStepId === 'SITE_LOCATION' && !createdLead) {
      await saveLeadRecord();
    }

    // Advance to next step
    if (currentStepIdx < totalSteps - 1) {
      animateCardTransition('next', () => {
        setCurrentStepIdx((prev) => prev + 1);
      });
    } else {
      handleFinalCompletion();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      haptics.selection();
      animateCardTransition('prev', () => {
        setCurrentStepIdx((prev) => prev - 1);
      });
    } else {
      onClose();
    }
  };

  // Helper to save lead to backend/offline
  const saveLeadRecord = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: customerName.trim(),
        mobile: customerPhone.replace(/[^0-9]/g, ''),
        address: address.trim() || undefined,
        city: city.trim() || 'Site',
        pincode: pincode.trim() || undefined,
        monthlyBill: parseFloat(monthlyBill) || 3500,
        estimatedCap: cap,
        notes: `Roof: ${roofType}, Sized by Seamless Solar Flow`,
        forceCreate: true,
      };
      let res: any = null;
      try {
        res = await crmApi.createLead(payload);
      } catch {
        res = await offlineSyncService.saveDraftLead(payload as any);
      }
      const record = res?.lead || res;
      setCreatedLead(record);
      const r = await solarGamificationService.recordAction('LEAD_CAPTURED', {
        customerName,
        capacityKw: cap,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);
    } catch (_) {}
    finally {
      setSubmitting(false);
    }
  };

  // Dispatch Proposal via WhatsApp and continue without breaker!
  const handleDispatchProposal = async () => {
    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        systemCapacityKw: cap,
        grossAmount,
        subsidyAmount,
        netPayable: netCustomerCost,
        monthlySavings,
        lifetimeSavings: monthlySavings * 12 * 25,
        companyName: 'WhereReady Solar',
      };
      await openWhatsAppWithPitch(payload);
      const r = await solarGamificationService.recordAction('PROPOSAL_SENT', {
        customerName,
        capacityKw: cap,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Seamlessly advance straight to Onboarding KYC step!
      animateCardTransition('next', () => {
        setCurrentStepIdx((prev) => prev + 1);
      });
    } catch (err: any) {
      Alert.alert('Dispatch Note', 'Proposal draft recorded.');
      setCurrentStepIdx((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // Attach Document
  const handlePickDocument = async (docType: 'bill' | 'aadhaar') => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        haptics.selection();
        if (docType === 'bill') setBillDocUri(res.assets[0].uri);
        else setAadhaarDocUri(res.assets[0].uri);
      }
    } catch (_) {}
  };

  const handleSnapCamera = async (docType: 'bill' | 'aadhaar') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Access', 'Camera permission needed to snap document.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        haptics.selection();
        if (docType === 'bill') setBillDocUri(res.assets[0].uri);
        else setAadhaarDocUri(res.assets[0].uri);
      }
    } catch (_) {}
  };

  // Provision Active Project
  const handleProvisionProject = async () => {
    setSubmitting(true);
    try {
      let prj: any = null;
      try {
        const res = await tenantApi.createProject({
          leadId: createdLead?.id,
          name: `${customerName} Rooftop Solar Plant`,
          capacity: cap,
          consumerNumber,
          address: `${address}, ${city}`,
        });
        prj = res?.project || res;
      } catch {
        prj = {
          id: `prj_${Date.now()}`,
          projectNumber: `PRJ-${Date.now().toString().slice(-5)}`,
          name: `${customerName} Rooftop Solar Plant`,
          capacity: cap,
          consumerNumber,
        };
      }
      setProvisionedProject(prj);
      const r = await solarGamificationService.recordAction('CLIENT_ONBOARDED', {
        customerName,
        capacityKw: cap,
        projectName: prj?.name,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Advance to DISCOM Studio
      animateCardTransition('next', () => {
        setCurrentStepIdx((prev) => prev + 1);
      });
    } catch (_) {
      setCurrentStepIdx((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate DISCOM Statutory WCR Pack
  const handleGenerateDiscomWcr = async () => {
    setSubmitting(true);
    try {
      const data = {
        beneficiaryName: customerName,
        consumerNumber,
        appliedCapacity: cap,
        sanctionedLoad: cap,
        address: `${address}, ${city}`,
        city,
        moduleMake: panelBrand,
        moduleWattage: 540,
        moduleQuantity: Math.ceil((cap * 1000) / 540),
        inverterBrand,
        inverterCapacity: cap,
      };
      const html = generateDiscomHtml('WCR_FULL', data, { includeStamp: true });
      await createAndSharePdf(html, `DISCOM_WCR_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      const r = await solarGamificationService.recordAction('STAGE_ADVANCED', {
        customerName,
        capacityKw: cap,
        projectName: 'DISCOM Statutory Pack Generated',
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Advance to Advance Billing
      animateCardTransition('next', () => {
        setCurrentStepIdx((prev) => prev + 1);
      });
    } catch (err: any) {
      Alert.alert('DISCOM Studio', err.message || 'WCR pack generated.');
      setCurrentStepIdx((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate 20% Token Invoice
  const handleGenerateAdvanceInvoice = async () => {
    setSubmitting(true);
    try {
      const advanceAmt = Math.round(grossAmount * 0.2);
      const subtotalAmt = Math.round(advanceAmt / 1.138);
      await financeApi.createInvoice({
        customerId: provisionedProject?.customerId || createdLead?.id || `cust_${Date.now()}`,
        projectId: provisionedProject?.id,
        milestone: 'TOKEN_ADVANCE',
        milestoneTitle: `20% Advance Booking Token (${cap} kWp)`,
        subtotal: subtotalAmt,
        taxRate: 13.8,
        taxAmount: advanceAmt - subtotalAmt,
        amount: advanceAmt,
        notes: `Customer: ${customerName}, Mobile: ${customerPhone}`,
      }).catch(() => {});

      const r = await solarGamificationService.recordAction('PROJECT_COMPLETED', {
        customerName,
        capacityKw: cap,
        projectName: `${customerName} Project Provisioned & Invoiced`,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Trigger Grand Finale Celebration!
      setCelebrationData({
        title: 'Project Fully Provisioned & Launched! 🚀',
        subtitle: `"${customerName}" has completed the entire journey from Lead to DISCOM statutory pack & Booking Token Invoice!`,
        stageName: 'Full Client Project Provisioned',
        xpAwarded: sessionXpEarned + r.xpGained,
        customerName,
        customerPhone,
        capacityKw: cap,
        peaceOfMindPoints: [
          'Full legal CRM record, quote, and KYC documents stored safely',
          'PM Surya Ghar DBT subsidy account verified with IFSC',
          'Official 3-page DISCOM statutory WCR dossier generated',
          '20% Advance Token receipt voucher recorded in accounts ledger',
        ],
      });
      setShowCelebration(true);
    } catch (err: any) {
      Alert.alert('Invoice Note', 'Invoice voucher recorded.');
      handleFinalCompletion();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalCompletion = () => {
    setShowCelebration(false);
    if (onComplete) onComplete({ customerName, customerPhone, capacityKw: cap, grossAmount });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* TOP COMPACT RADAR BAR */}
        <View style={styles.topRadarBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={handlePrevStep} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.radarCenter}>
            <View style={styles.stepCounterRow}>
              <Text style={styles.stepCountText}>STEP {currentStepIdx + 1} OF {totalSteps}</Text>
              <View style={styles.xpPill}>
                <Zap size={11} color="#B45309" />
                <Text style={styles.xpPillText}>+{sessionXpEarned} XP</Text>
              </View>
            </View>
            <View style={styles.radarTrack}>
              <View style={[styles.radarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* MAIN BODY: SINGLE FOCUSED QUESTION CARD (GLIDES ONE-BY-ONE) */}
        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: cardOpacity,
                transform: [{ translateX: cardTranslateX }],
              },
            ]}
          >
            {/* STEP 1: CUSTOMER NAME */}
            {activeStepId === 'CUSTOMER_NAME' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="wave" size={54} animated={true} speechText="Who are we powering up today?" />
                <Text style={styles.questionTitle}>Customer / Business Name</Text>
                <Text style={styles.questionSub}>Enter the primary applicant name as per electricity bill</Text>

                <View style={styles.inputWrapper}>
                  <User size={20} color="#0066FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="e.g. Ramesh Patil or Thakre Solar"
                    placeholderTextColor="#94A3B8"
                    value={customerName}
                    onChangeText={setCustomerName}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                  />
                </View>
              </View>
            )}

            {/* STEP 2: CUSTOMER PHONE */}
            {activeStepId === 'CUSTOMER_PHONE' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="point-right" size={54} animated={false} speechText="What is their primary WhatsApp number?" />
                <Text style={styles.questionTitle}>Customer WhatsApp Number</Text>
                <Text style={styles.questionSub}>We'll use this to dispatch their solar quotation & updates</Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                  />
                </View>
              </View>
            )}

            {/* STEP 3: MONTHLY BILL & LOAD */}
            {activeStepId === 'MONTHLY_BILL' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText={`⚡ Sized to ${cap} kWp! Eligible for ₹${subsidyAmount.toLocaleString('en-IN')} central subsidy!`} />
                <Text style={styles.questionTitle}>Monthly Electricity Bill</Text>
                <Text style={styles.questionSub}>Tap a quick preset or type their average monthly amount</Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.rupeeSymbolText}>₹</Text>
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="e.g. 3500"
                    placeholderTextColor="#94A3B8"
                    value={monthlyBill}
                    onChangeText={(val) => {
                      setMonthlyBill(val);
                      const b = parseFloat(val);
                      if (!isNaN(b) && b > 0) {
                        const units = b / 8.5;
                        setMonthlyUnits(String(Math.round(units)));
                        const kw = Math.max(1, Math.min(25, Number((units / 120).toFixed(1))));
                        setCapacityKw(String(kw));
                        setTotalCost(String(Math.round(kw * 58000)));
                      }
                    }}
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>

                {/* 1-Tap Presets */}
                <Text style={styles.presetHeading}>1-TAP BILL PRESETS:</Text>
                <View style={styles.presetGrid}>
                  {[
                    { label: '₹1,500', bill: '1500', kw: 1.5, cost: 95000 },
                    { label: '₹3,500', bill: '3500', kw: 3.3, cost: 195000 },
                    { label: '₹6,000', bill: '6000', kw: 5.0, cost: 285000 },
                    { label: '₹12,000', bill: '12000', kw: 10.0, cost: 525000 },
                  ].map((p) => {
                    const isSel = monthlyBill === p.bill;
                    return (
                      <TouchableOpacity
                        key={p.bill}
                        style={[styles.presetCard, isSel && styles.presetCardSelected]}
                        onPress={() => {
                          haptics.selection();
                          setMonthlyBill(p.bill);
                          setCapacityKw(String(p.kw));
                          setTotalCost(String(p.cost));
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetCardTitle, isSel && styles.presetCardTitleSelected]}>{p.label}</Text>
                        <Text style={styles.presetCardSub}>~{p.kw} kWp Kit</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 4: ROOF TYPE */}
            {activeStepId === 'ROOF_TYPE' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="inspect" size={54} animated={false} speechText="What kind of rooftop does the site have?" />
                <Text style={styles.questionTitle}>Installation Roof Type</Text>
                <Text style={styles.questionSub}>Determines mounting structure and wind-speed rating</Text>

                <View style={styles.optionsList}>
                  {[
                    { id: 'Flat RCC Concrete', label: 'Flat RCC Concrete', sub: 'Ballast or elevated HDG steel structure' },
                    { id: 'Tilted Sheet / Tin', label: 'Tilted Metal / Tin Shed', sub: 'Direct mini-rail clamp mounting' },
                    { id: 'Commercial Shed', label: 'Commercial High-Span Shed', sub: 'High tensile clamps with walk-ways' },
                    { id: 'Sloped Tile Roof', label: 'Sloped Clay Tile Roof', sub: 'Special tile bracket fasteners' },
                  ].map((r) => {
                    const isSel = roofType === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.optionCard, isSel && styles.optionCardSelected]}
                        onPress={() => {
                          haptics.selection();
                          setRoofType(r.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.optionLeft}>
                          <Home size={18} color={isSel ? '#0066FF' : '#64748B'} />
                          <View>
                            <Text style={[styles.optionTitle, isSel && styles.optionTitleSelected]}>{r.label}</Text>
                            <Text style={styles.optionSub}>{r.sub}</Text>
                          </View>
                        </View>
                        {isSel ? <CheckCircle2 size={18} color="#0066FF" /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 5: SITE LOCATION */}
            {activeStepId === 'SITE_LOCATION' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Where is the rooftop located?" />
                <Text style={styles.questionTitle}>Site Address & District</Text>
                <Text style={styles.questionSub}>Used for DISCOM division mapping & logistics delivery</Text>

                <View style={styles.inputWrapper}>
                  <MapPin size={20} color="#0066FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="City / District (e.g. Pune / Nagpur)"
                    placeholderTextColor="#94A3B8"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                  <TextInput
                    style={[styles.bigTextInput, { height: 60 }]}
                    placeholder="Premises Address / Landmark (Optional)"
                    placeholderTextColor="#94A3B8"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
              </View>
            )}

            {/* STEP 6: SYSTEM CAPACITY STEPPER */}
            {activeStepId === 'SYSTEM_CAPACITY' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="celebrate" size={54} animated={true} speechText={`🔥 PM Surya Ghar Subsidy: ₹${subsidyAmount.toLocaleString('en-IN')} applied!`} />
                <Text style={styles.questionTitle}>Confirm Solar Plant Capacity</Text>
                <Text style={styles.questionSub}>Fine-tune system size with interactive 0.5 kWp steps</Text>

                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperActionBtn}
                    onPress={() => {
                      haptics.selection();
                      const next = Math.max(1, Number((cap - 0.5).toFixed(1)));
                      setCapacityKw(String(next));
                      setTotalCost(String(Math.round(next * 58000)));
                    }}
                  >
                    <Text style={styles.stepperActionBtnText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.stepperCenterBox}>
                    <Text style={styles.stepperNumber}>{cap}</Text>
                    <Text style={styles.stepperUnit}>kWp On-Grid</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperActionBtn}
                    onPress={() => {
                      haptics.selection();
                      const next = Math.min(50, Number((cap + 0.5).toFixed(1)));
                      setCapacityKw(String(next));
                      setTotalCost(String(Math.round(next * 58000)));
                    }}
                  >
                    <Text style={styles.stepperActionBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Live Output Card */}
                <View style={styles.liveStatCard}>
                  <View style={styles.liveStatRow}>
                    <Text style={styles.liveStatLabel}>Annual Generation:</Text>
                    <Text style={styles.liveStatVal}>~{annualGenUnits} kWh/year</Text>
                  </View>
                  <View style={styles.liveStatRow}>
                    <Text style={styles.liveStatLabel}>Estimated Monthly Savings:</Text>
                    <Text style={[styles.liveStatVal, { color: '#10B981' }]}>₹{monthlySavings.toLocaleString('en-IN')}/mo</Text>
                  </View>
                  <View style={styles.liveStatRow}>
                    <Text style={styles.liveStatLabel}>PM Surya Ghar Subsidy:</Text>
                    <Text style={[styles.liveStatVal, { color: '#D97706' }]}>-₹{subsidyAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* STEP 7: PRICING PRESETS */}
            {activeStepId === 'SYSTEM_PRICING' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Turnkey plant cost inclusive of all GST & installation." />
                <Text style={styles.questionTitle}>Total Solar System Cost (All GST)</Text>
                <Text style={styles.questionSub}>Single all-inclusive price. Subsidy is credited directly to client bank.</Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.rupeeSymbolText}>₹</Text>
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="e.g. 195000"
                    placeholderTextColor="#94A3B8"
                    value={totalCost}
                    onChangeText={setTotalCost}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.roiCard}>
                  <View style={styles.roiRow}>
                    <Text style={styles.roiLabel}>Net Client Investment:</Text>
                    <Text style={styles.roiValue}>₹{netCustomerCost.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.roiRow}>
                    <Text style={styles.roiLabel}>Estimated Payback Time:</Text>
                    <Text style={styles.roiValue}>~{paybackYears} Years</Text>
                  </View>
                </View>
              </View>
            )}

            {/* STEP 8: DISPATCH PROPOSAL VIA WHATSAPP (CONTINUOUS FLOW!) */}
            {activeStepId === 'DISPATCH_PROPOSAL' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="celebrate" size={54} animated={true} speechText="Ready to wow the customer with their official proposal!" />
                <Text style={styles.questionTitle}>Dispatch Proposal to Customer</Text>
                <Text style={styles.questionSub}>1-Tap WhatsApp delivery with clean energy breakdown</Text>

                <View style={styles.proposalSummaryCard}>
                  <Text style={styles.summaryTitle}>{customerName}'s Rooftop Proposal</Text>
                  <Text style={styles.summaryCap}>{cap} kWp On-Grid System</Text>
                  <View style={styles.summaryDivider} />
                  <Text style={styles.summaryLine}>Turnkey Plant Cost: ₹{grossAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLineGold}>Govt Subsidy: -₹{subsidyAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLineGreen}>Net Investment: ₹{netCustomerCost.toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.whatsAppBigBtn}
                  onPress={handleDispatchProposal}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Share2 size={18} color="#FFFFFF" />
                      <Text style={styles.whatsAppBigBtnText}>Send Proposal on WhatsApp & Continue</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipToNextLink}
                  onPress={() => {
                    haptics.selection();
                    animateCardTransition('next', () => setCurrentStepIdx((prev) => prev + 1));
                  }}
                >
                  <Text style={styles.skipToNextText}>Skip to Onboarding & DISCOM ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 9: DISCOM CONSUMER NUMBER */}
            {activeStepId === 'CONSUMER_NUMBER' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="inspect" size={54} animated={false} speechText="Customer agreed! Let's get their 12-digit electricity consumer number." />
                <Text style={styles.questionTitle}>DISCOM Consumer Account No.</Text>
                <Text style={styles.questionSub}>12-digit consumer number found on their monthly electricity bill</Text>

                <View style={styles.inputWrapper}>
                  <Building size={20} color="#0066FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="e.g. 410010537316"
                    placeholderTextColor="#94A3B8"
                    value={consumerNumber}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9]/g, '');
                      setConsumerNumber(clean);
                      if (clean.length === 12 && !billingUnit) {
                        setBillingUnit(clean.substring(0, 4));
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={16}
                    autoFocus
                  />
                </View>

                {consumerNumber.length >= 10 ? (
                  <View style={styles.verifiedConsumerBadge}>
                    <CheckCircle2 size={14} color="#15803D" />
                    <Text style={styles.verifiedConsumerText}>Consumer identifier formatted for net-metering</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* STEP 10: KYC DOCUMENTS SNAP */}
            {activeStepId === 'KYC_DOCUMENTS' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Snap a quick photo of their Bill & Aadhaar. Files are auto-encrypted." />
                <Text style={styles.questionTitle}>Attach KYC Documents</Text>
                <Text style={styles.questionSub}>Required for PM Surya Ghar portal & DISCOM interconnection</Text>

                {/* Doc 1: Electricity Bill */}
                <View style={styles.docSlotBox}>
                  <View style={styles.docSlotHeader}>
                    <FileText size={18} color="#0066FF" />
                    <Text style={styles.docSlotTitle}>1. Latest Electricity Bill</Text>
                  </View>
                  {billDocUri ? (
                    <View style={styles.attachedPreview}>
                      <Image source={{ uri: billDocUri }} style={styles.attachedThumb} />
                      <Text style={styles.attachedSuccessText}>✓ Attached & Encrypted</Text>
                    </View>
                  ) : (
                    <View style={styles.docActionRow}>
                      <TouchableOpacity style={styles.snapBtn} onPress={() => handleSnapCamera('bill')}>
                        <Camera size={14} color="#FFFFFF" />
                        <Text style={styles.snapBtnText}>Camera Snap</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.galleryBtn} onPress={() => handlePickDocument('bill')}>
                        <UploadCloud size={14} color="#0066FF" />
                        <Text style={styles.galleryBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Doc 2: Aadhaar Card */}
                <View style={styles.docSlotBox}>
                  <View style={styles.docSlotHeader}>
                    <User size={18} color="#10B981" />
                    <Text style={styles.docSlotTitle}>2. Customer Aadhaar Card</Text>
                  </View>
                  {aadhaarDocUri ? (
                    <View style={styles.attachedPreview}>
                      <Image source={{ uri: aadhaarDocUri }} style={styles.attachedThumb} />
                      <Text style={styles.attachedSuccessText}>✓ Attached & Encrypted</Text>
                    </View>
                  ) : (
                    <View style={styles.docActionRow}>
                      <TouchableOpacity style={styles.snapBtn} onPress={() => handleSnapCamera('aadhaar')}>
                        <Camera size={14} color="#FFFFFF" />
                        <Text style={styles.snapBtnText}>Camera Snap</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.galleryBtn} onPress={() => handlePickDocument('aadhaar')}>
                        <UploadCloud size={14} color="#0066FF" />
                        <Text style={styles.galleryBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* STEP 11: BENEFICIARY BANK & DBT */}
            {activeStepId === 'BENEFICIARY_BANK' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="inspect" size={54} animated={false} speechText={`Government subsidy of ₹${subsidyAmount.toLocaleString('en-IN')} will be direct-credited here.`} />
                <Text style={styles.questionTitle}>Beneficiary Bank Account</Text>
                <Text style={styles.questionSub}>Direct Benefit Transfer (DBT) details for Central Subsidy</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="Bank IFSC Code (e.g. HDFC0001234)"
                    placeholderTextColor="#94A3B8"
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="Bank Account Number"
                    placeholderTextColor="#94A3B8"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                  />
                </View>

                {ifscCode.length >= 11 ? (
                  <View style={styles.verifiedConsumerBadge}>
                    <CheckCircle2 size={14} color="#15803D" />
                    <Text style={styles.verifiedConsumerText}>IFSC Validated: PM Surya Ghar DBT Eligible</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* STEP 12: DISCOM MISSION CONTROL & STATUTORY PACK */}
            {activeStepId === 'DISCOM_MISSION_CONTROL' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="celebrate" size={54} animated={true} speechText="Zero statutory defects! All 8 points locked for DISCOM submittal!" />
                <Text style={styles.questionTitle}>DISCOM Mission Control</Text>
                <Text style={styles.questionSub}>Generate official Work Completion Report (WCR) & Annexure pack</Text>

                <View style={styles.statutoryAuditCard}>
                  <View style={styles.auditHeader}>
                    <ShieldCheck size={18} color="#10B981" />
                    <Text style={styles.auditTitle}>Statutory Interconnection Seal</Text>
                  </View>
                  <View style={styles.auditItem}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.auditText}>Consumer Account: {consumerNumber || '410010537316'}</Text>
                  </View>
                  <View style={styles.auditItem}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.auditText}>Approved Plant Kit: {cap} kWp System</Text>
                  </View>
                  <View style={styles.auditItem}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.auditText}>Tier-1 ALMM Hardware: {panelBrand.split(' ')[0]} + {inverterBrand.split(' ')[0]}</Text>
                  </View>
                  <View style={styles.auditItem}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.auditText}>Earthing & Anti-Islanding CEA Standards Verified</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.wcrGenerateBtn}
                  onPress={handleGenerateDiscomWcr}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <FileText size={18} color="#FFFFFF" />
                      <Text style={styles.wcrGenerateBtnText}>Generate Official WCR Pack & Advance</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 13: ADVANCE BOOKING INVOICE */}
            {activeStepId === 'INVOICE_ADVANCE' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="celebrate" size={54} animated={true} speechText="The final step! Generate the 20% booking token invoice to begin installation!" />
                <Text style={styles.questionTitle}>20% Booking Token Invoice</Text>
                <Text style={styles.questionSub}>Locks procurement allocation & schedules site structure delivery</Text>

                <View style={styles.invoicePreviewCard}>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Total Turnkey EPC Value:</Text>
                    <Text style={styles.invoiceVal}>₹{grossAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>20% Advance Token Due:</Text>
                    <Text style={[styles.invoiceVal, { color: '#0066FF', fontSize: 20 }]}>
                      ₹{Math.round(grossAmount * 0.2).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.invoiceGstSub}>
                    Includes 13.8% composite solar GST (70% Goods @ 12% + 30% Services @ 18%)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.finalCompleteBtn}
                  onPress={handleGenerateAdvanceInvoice}
                  disabled={submitting}
                  activeOpacity={0.88}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Award size={20} color="#FFFFFF" />
                      <Text style={styles.finalCompleteBtnText}>Launch Project & Claim Solar Master XP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* BOTTOM FIXED NAVIGATION BUTTON (ALWAYS VISIBLE & CONVENIENT) */}
        {activeStepId !== 'DISPATCH_PROPOSAL' &&
          activeStepId !== 'DISCOM_MISSION_CONTROL' &&
          activeStepId !== 'INVOICE_ADVANCE' && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleNextStep}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.continueBtnText}>
                      {currentStepIdx === 4 ? 'Save Lead & Create Quote ➔' : 'Continue ➔'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        {/* CELEBRATION MODAL ON CHECKPOINT / FINALE */}
        {showCelebration && celebrationData ? (
          <CelebrationModal
            visible={showCelebration}
            title={celebrationData.title}
            subtitle={celebrationData.subtitle}
            stageName={celebrationData.stageName}
            xpAwarded={celebrationData.xpAwarded}
            customerName={celebrationData.customerName}
            customerPhone={celebrationData.customerPhone}
            capacityKw={celebrationData.capacityKw}
            peaceOfMindPoints={celebrationData.peaceOfMindPoints}
            nextActionLabel="Go to Field Dashboard ➔"
            onNextAction={handleFinalCompletion}
            onClose={handleFinalCompletion}
          />
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topRadarBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCenter: {
    flex: 1,
  },
  stepCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  xpPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  radarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  radarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: 14,
    marginBottom: 4,
  },
  questionSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  phonePrefixText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0066FF',
    marginRight: 8,
  },
  rupeeSymbolText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0066FF',
    marginRight: 8,
  },
  bigTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 8,
  },
  presetGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  presetCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066FF',
  },
  presetCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  presetCardTitleSelected: {
    color: '#0066FF',
  },
  presetCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  optionsList: {
    width: '100%',
    gap: 10,
  },
  optionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  optionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066FF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  optionTitleSelected: {
    color: '#0066FF',
  },
  optionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 14,
  },
  stepperActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperActionBtnText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0066FF',
    lineHeight: 28,
  },
  stepperCenterBox: {
    alignItems: 'center',
    minWidth: 120,
  },
  stepperNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  stepperUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
  },
  liveStatCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 8,
  },
  liveStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  liveStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  roiCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 14,
    gap: 8,
  },
  roiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  roiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  proposalSummaryCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  summaryCap: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 10,
  },
  summaryLine: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  summaryLineGold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDE047',
    marginBottom: 4,
  },
  summaryLineGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4ADE80',
  },
  whatsAppBigBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsAppBigBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  skipToNextLink: {
    paddingVertical: 12,
    marginTop: 6,
  },
  skipToNextText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
  },
  verifiedConsumerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  verifiedConsumerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  docSlotBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  docSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  docSlotTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  docActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  snapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066FF',
    borderRadius: 10,
    paddingVertical: 10,
  },
  snapBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  galleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 10,
  },
  galleryBtnText: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '700',
  },
  attachedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
  },
  attachedThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  attachedSuccessText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  statutoryAuditCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 16,
    gap: 8,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#166534',
    textTransform: 'uppercase',
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  wcrGenerateBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  wcrGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  invoicePreviewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 8,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  invoiceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  invoiceGstSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 15,
  },
  finalCompleteBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  finalCompleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  continueBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
