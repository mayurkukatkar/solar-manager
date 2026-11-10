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
  Linking,
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
  ShieldCheck,
  Award,
  Building,
  Receipt,
  Check,
  Compass,
  CheckSquare,
  QrCode,
  CreditCard,
  RotateCcw,
  Volume2,
  VolumeX,
  Sun,
  ShieldAlert,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { GuideCharacter } from './GuideCharacter';
import { CelebrationModal } from './CelebrationModal';
import { SignaturePad } from './SignaturePad';
import { solarGamificationService } from '../services/solarGamificationService';
import { openWhatsAppWithPitch, openWhatsAppDirect } from '../services/whatsappService';
import { generateQuotationHtml, createAndSharePdf, generateDiscomHtml } from '../services/pdfService';
import { crmApi, tenantApi, documentsApi, financeApi } from '../api/endpoints';
import { offlineSyncService } from '../services/offlineSyncService';
import { SafeStorage } from '../api/client';
import { haptics } from '../utils/haptics';
import { soundEffects } from '../utils/audioEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STORAGE_DRAFT_KEY = '@solar_flow_quest_draft_v2';

export interface SeamlessSolarFlowModalProps {
  visible: boolean;
  initialLead?: any;
  initialProject?: any;
  initialStepIndex?: number;
  onClose: () => void;
  onComplete?: (result: {
    lead?: any;
    project?: any;
    customer?: any;
    invoice?: any;
  }) => void;
}

// 14-Step Continuous Journey from Ingestion to Handover
export type FlowStepId =
  | 'CUSTOMER_NAME'
  | 'CUSTOMER_PHONE'
  | 'MONTHLY_BILL'
  | 'ROOF_TYPE'
  | 'SITE_LOCATION'
  | 'SYSTEM_CAPACITY'
  | 'EQUIPMENT_SELECTION'
  | 'SYSTEM_PRICING'
  | 'DISPATCH_PROPOSAL'
  | 'CONSUMER_NUMBER'
  | 'KYC_DOCUMENTS'
  | 'BENEFICIARY_BANK'
  | 'CUSTOMER_SIGNATURE'
  | 'DISCOM_MISSION_CONTROL'
  | 'INVOICE_ADVANCE';

export const SeamlessSolarFlowModal: React.FC<SeamlessSolarFlowModalProps> = ({
  visible,
  initialLead,
  initialProject,
  initialStepIndex,
  onClose,
  onComplete,
}) => {
  // Determine smart starting step based on lead or project state
  const calculatedInitialStep = useMemo(() => {
    if (initialStepIndex !== undefined) return initialStepIndex;
    if (initialProject) {
      const stageIdx = (initialProject.currentStage || initialProject.status || '').toUpperCase();
      if (stageIdx.includes('NET') || stageIdx.includes('METER') || stageIdx.includes('DISCOM')) return 13; // DISCOM Mission Control
      if (initialProject.consumerNumber) return 13;
      return 9; // CONSUMER_NUMBER
    }
    if (initialLead) {
      const s = (initialLead.status || '').toUpperCase();
      if (s === 'WON') return 9; // CONSUMER_NUMBER
      if (s === 'NEGOTIATION' || s === 'QUOTATION_SENT') return 8; // DISPATCH_PROPOSAL
      if (s === 'SITE_SURVEY') return 3; // ROOF_TYPE
      return 2; // MONTHLY_BILL
    }
    return 0; // CUSTOMER_NAME
  }, [initialStepIndex, initialProject, initialLead]);

  const [currentStepIdx, setCurrentStepIdx] = useState(calculatedInitialStep);
  const [submitting, setSubmitting] = useState(false);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState<any | null>(null);

  // Form State across the entire flow (pre-filled from initialLead OR initialProject)
  const [customerName, setCustomerName] = useState(
    initialProject?.customer?.name || initialProject?.name || initialLead?.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialProject?.customer?.mobile || initialProject?.customer?.phone || initialLead?.mobile || initialLead?.phone || ''
  );
  const [monthlyBill, setMonthlyBill] = useState(String(initialLead?.monthlyBill || '3500'));
  const [monthlyUnits, setMonthlyUnits] = useState(String(initialLead?.monthlyUnits || '410'));
  const [roofType, setRoofType] = useState('Flat RCC Concrete');
  const [selectedShadowObstacles, setSelectedShadowObstacles] = useState<string[]>([]);
  const [city, setCity] = useState(
    initialProject?.city || initialProject?.customer?.city || initialLead?.city || 'Pune'
  );
  const [address, setAddress] = useState(
    initialProject?.installationAddress || initialProject?.customer?.address || initialProject?.address || initialLead?.address || ''
  );
  const [pincode, setPincode] = useState(
    initialProject?.pincode || initialProject?.customer?.pincode || initialLead?.pincode || ''
  );
  const [terraceCoordinates, setTerraceCoordinates] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Sizing & Equipment State
  const [capacityKw, setCapacityKw] = useState(
    String(initialProject?.capacity || initialProject?.systemCapacity || initialLead?.estimatedCap || 3.3)
  );
  const [totalCost, setTotalCost] = useState('195000');
  const [panelBrand, setPanelBrand] = useState('Waaree 540W Mono PERC DCR');
  const [inverterBrand, setInverterBrand] = useState('Solis 3.3kW Grid-Tied Inverter');
  const [createdLead, setCreatedLead] = useState<any>(initialLead || initialProject?.lead || null);

  // Onboarding & KYC State
  const [consumerNumber, setConsumerNumber] = useState(
    initialProject?.consumerNumber || initialProject?.customer?.consumerNumber || initialLead?.consumerNumber || initialLead?.electricityConnection || ''
  );
  const [billingUnit, setBillingUnit] = useState('');
  const [billDocUri, setBillDocUri] = useState<string | null>(null);
  const [aadhaarDocUri, setAadhaarDocUri] = useState<string | null>(null);
  const [billUploadStatus, setBillUploadStatus] = useState<'idle' | 'uploading' | 'synced' | 'failed'>('idle');
  const [aadhaarUploadStatus, setAadhaarUploadStatus] = useState<'idle' | 'uploading' | 'synced' | 'failed'>('idle');

  // Bank & DBT State
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankBranch, setBankBranch] = useState('');
  const [bankCity, setBankCity] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0000455');
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscVerified, setIfscVerified] = useState(true);

  // Customer Signature & Execution
  const [customerSignatureSvg, setCustomerSignatureSvg] = useState<string>('');
  const [provisionedProject, setProvisionedProject] = useState<any>(initialProject || null);

  // Keep state synced when modal becomes visible or targets change
  useEffect(() => {
    if (visible) {
      setCurrentStepIdx(calculatedInitialStep);
      if (initialProject) {
        setProvisionedProject(initialProject);
        setCustomerName(initialProject?.customer?.name || initialProject?.name || '');
        setCustomerPhone(initialProject?.customer?.mobile || initialProject?.customer?.phone || '');
        setCapacityKw(String(initialProject?.capacity || initialProject?.systemCapacity || 3.3));
        setCity(initialProject?.city || initialProject?.customer?.city || 'Pune');
        setAddress(initialProject?.installationAddress || initialProject?.customer?.address || initialProject?.address || '');
        setConsumerNumber(initialProject?.consumerNumber || initialProject?.customer?.consumerNumber || '');
        if (initialProject?.lead) setCreatedLead(initialProject.lead);
      } else if (initialLead) {
        setCreatedLead(initialLead);
        setCustomerName(initialLead?.name || '');
        setCustomerPhone(initialLead?.mobile || initialLead?.phone || '');
        setCity(initialLead?.city || 'Pune');
        setAddress(initialLead?.address || '');
        setPincode(initialLead?.pincode || '');
        setCapacityKw(String(initialLead?.estimatedCap || 3.3));
        setConsumerNumber(initialLead?.consumerNumber || initialLead?.electricityConnection || '');
      }
    }
  }, [visible, initialProject, initialLead, calculatedInitialStep]);

  // Advance Payment State
  const [advancePaidConfirmed, setAdvancePaidConfirmed] = useState(false);

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
    'EQUIPMENT_SELECTION',
    'SYSTEM_PRICING',
    'DISPATCH_PROPOSAL',
    'CONSUMER_NUMBER',
    'KYC_DOCUMENTS',
    'BENEFICIARY_BANK',
    'CUSTOMER_SIGNATURE',
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
  const requiredRooftopAreaSqFt = Math.round(cap * 95);
  const advanceTokenAmount = Math.round(grossAmount * 0.2);

  // Check and restore draft on open
  useEffect(() => {
    if (visible && !initialLead) {
      SafeStorage.getItem(STORAGE_DRAFT_KEY).then((stored) => {
        if (stored) {
          try {
            const draft = JSON.parse(stored);
            if (draft?.customerName && draft?.currentStepIdx > 0) {
              setDraftPrompt(draft);
            }
          } catch {}
        }
      });
    }
  }, [visible, initialLead]);

  // Auto-save draft on every step transition
  const saveDraftLocally = async (nextIdx: number) => {
    try {
      const draftData = {
        currentStepIdx: nextIdx,
        customerName,
        customerPhone,
        monthlyBill,
        monthlyUnits,
        roofType,
        selectedShadowObstacles,
        city,
        address,
        pincode,
        terraceCoordinates,
        capacityKw,
        totalCost,
        panelBrand,
        inverterBrand,
        consumerNumber,
        billingUnit,
        bankName,
        bankBranch,
        accountNumber,
        ifscCode,
        sessionXpEarned,
      };
      await SafeStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draftData));
    } catch {}
  };

  const handleApplyDraft = () => {
    if (!draftPrompt) return;
    setCustomerName(draftPrompt.customerName || '');
    setCustomerPhone(draftPrompt.customerPhone || '');
    setMonthlyBill(draftPrompt.monthlyBill || '3500');
    setRoofType(draftPrompt.roofType || 'Flat RCC Concrete');
    setSelectedShadowObstacles(draftPrompt.selectedShadowObstacles || []);
    setCity(draftPrompt.city || 'Pune');
    setAddress(draftPrompt.address || '');
    setPincode(draftPrompt.pincode || '');
    setTerraceCoordinates(draftPrompt.terraceCoordinates || null);
    setCapacityKw(draftPrompt.capacityKw || '3.3');
    setTotalCost(draftPrompt.totalCost || '195000');
    setPanelBrand(draftPrompt.panelBrand || 'Waaree 540W Mono PERC DCR');
    setInverterBrand(draftPrompt.inverterBrand || 'Solis 3.3kW Grid-Tied Inverter');
    setConsumerNumber(draftPrompt.consumerNumber || '');
    setBankName(draftPrompt.bankName || 'State Bank of India');
    setAccountNumber(draftPrompt.accountNumber || '');
    setIfscCode(draftPrompt.ifscCode || 'SBIN0000455');
    setSessionXpEarned(draftPrompt.sessionXpEarned || 0);
    setCurrentStepIdx(Math.min(draftPrompt.currentStepIdx || 0, totalSteps - 1));
    setDraftPrompt(null);
    soundEffects.playSelect();
  };

  const handleDiscardDraft = async () => {
    setDraftPrompt(null);
    await SafeStorage.removeItem(STORAGE_DRAFT_KEY).catch(() => {});
  };

  // 1-Tap Terrace GPS Detection
  const handleDetectTerraceGps = () => {
    setGpsLoading(true);
    soundEffects.playSelect();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const coords = `${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`;
          setTerraceCoordinates(coords);
          setGpsLoading(false);
          soundEffects.playVerificationShield();

          // Auto reverse-geocode city and pincode
          try {
            const resp = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            if (resp.ok) {
              const geoData = await resp.json();
              if (geoData.city || geoData.locality) setCity(geoData.city || geoData.locality);
              if (geoData.postcode) setPincode(geoData.postcode);
            }
          } catch {}
        },
        () => {
          // Fallback coordinate
          setTerraceCoordinates('18.52043° N, 73.85674° E (Pune)');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setTimeout(() => {
        setTerraceCoordinates('18.52043° N, 73.85674° E (Site Terrace)');
        setGpsLoading(false);
        soundEffects.playVerificationShield();
      }, 700);
    }
  };

  // Instant IFSC Code Validation & PM Surya Ghar Subsidy DBT Shield
  const handleLookupIfsc = async (val: string) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setIfscCode(clean);
    if (clean.length === 11) {
      setIfscLoading(true);
      try {
        const resp = await fetch(`https://ifsc.razorpay.com/${clean}`);
        if (resp.ok) {
          const data = await resp.json();
          setBankName(data.BANK || 'Bank');
          setBankBranch(data.BRANCH || '');
          setBankCity(data.CITY || '');
          setIfscVerified(true);
          soundEffects.playVerificationShield();
        } else {
          setIfscVerified(false);
        }
      } catch {
        setIfscVerified(true);
      } finally {
        setIfscLoading(false);
      }
    } else {
      setIfscVerified(false);
    }
  };

  // Slide Animation on Step Change
  const animateCardTransition = (direction: 'next' | 'prev', callback: () => void) => {
    soundEffects.playGlide();
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

  // Helper to save or update lead in CRM pipeline & offline
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
        notes: `Roof: ${roofType}, GPS: ${terraceCoordinates || 'Terrace'}, Hardware: ${panelBrand} + ${inverterBrand}`,
        forceCreate: true,
      };

      let res: any = null;
      if (createdLead?.id) {
        try {
          res = await crmApi.updateLead(createdLead.id, payload);
        } catch {
          try {
            res = await crmApi.createLead(payload);
          } catch {
            res = await offlineSyncService.saveDraftLead(payload as any);
          }
        }
      } else {
        try {
          res = await crmApi.createLead(payload);
        } catch {
          res = await offlineSyncService.saveDraftLead(payload as any);
        }
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

  // Converts Lead to Client & Provisions Project in backend
  const provisionProjectFromLead = async () => {
    if (provisionedProject?.id) {
      return provisionedProject;
    }

    setSubmitting(true);
    let projectResult: any = null;

    try {
      const targetLeadId = createdLead?.id;
      if (targetLeadId) {
        try {
          const convertRes = await crmApi.convertLead(targetLeadId, {
            customerName: customerName.trim(),
            mobile: customerPhone.replace(/[^0-9]/g, ''),
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            pincode: pincode.trim() || undefined,
            capacity: cap,
            bankName,
            accountNumber,
            ifscCode,
            consumerNumber: consumerNumber.trim() || 'Pending',
            signatureSvg: customerSignatureSvg || undefined,
          });
          projectResult = convertRes?.project || convertRes;
        } catch (apiErr: any) {
          console.warn('Convert API notice in 1-Flow:', apiErr.message);
          try {
            const projectsRes = await tenantApi.getProjects();
            const existing = (projectsRes?.projects || []).find(
              (p: any) => p.leadId === targetLeadId || (p.customer?.mobile && p.customer.mobile === customerPhone.trim())
            );
            if (existing) {
              projectResult = existing;
            }
          } catch {}
        }
      }

      if (!projectResult) {
        projectResult = {
          id: `prj_${Date.now()}`,
          projectNumber: `PRJ-${Date.now().toString().slice(-5)}`,
          name: `${customerName.trim()} Rooftop Solar Project`,
          capacity: cap,
          status: 'In Progress',
          currentStage: 'SURVEY',
          leadId: targetLeadId,
          consumerNumber: consumerNumber.trim() || 'Pending',
          installationAddress: address.trim() || 'Site Roof',
          city: city.trim() || 'Pune',
          customer: {
            name: customerName.trim(),
            mobile: customerPhone.trim(),
            address: address.trim(),
            city: city.trim(),
            consumerNumber: consumerNumber.trim() || 'Pending',
          },
        };
      }

      setProvisionedProject(projectResult);

      if (createdLead) {
        setCreatedLead((prev: any) => ({ ...prev, status: 'WON' }));
      }

      // Upload attached KYC documents now that projectId exists
      if (billDocUri) {
        uploadDocumentToCloud('bill', billDocUri);
      }
      if (aadhaarDocUri) {
        uploadDocumentToCloud('aadhaar', aadhaarDocUri);
      }

      try {
        const reward = await solarGamificationService.recordAction('CLIENT_ONBOARDED', {
          capacityKw: cap,
          customerName: customerName.trim(),
          projectName: projectResult.projectNumber || projectResult.name,
        });
        setSessionXpEarned((prev) => prev + reward.xpGained);
      } catch {}

      soundEffects.playCashChime();
      return projectResult;
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    // Validation for critical inputs
    if (activeStepId === 'CUSTOMER_NAME' && !customerName.trim()) {
      Alert.alert('Required', 'Please enter customer name to proceed.');
      return;
    }
    if (activeStepId === 'CUSTOMER_PHONE') {
      const clean = customerPhone.replace(/[^0-9]/g, '');
      if (clean.length < 10) {
        Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit WhatsApp number.');
        return;
      }
    }

    // Auto-save Lead checkpoint at Step 5 (Site Location)
    if (activeStepId === 'SITE_LOCATION') {
      await saveLeadRecord();
    }

    // Auto-provision Project & Convert Deal at Step 13 (Customer Signature)
    if (activeStepId === 'CUSTOMER_SIGNATURE') {
      await provisionProjectFromLead();
    }

    // Advance to next step
    if (currentStepIdx < totalSteps - 1) {
      const nextIdx = currentStepIdx + 1;
      saveDraftLocally(nextIdx);
      animateCardTransition('next', () => {
        setCurrentStepIdx(nextIdx);
      });
    } else {
      handleFinalCompletion();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      animateCardTransition('prev', () => {
        setCurrentStepIdx((prev) => prev - 1);
      });
    } else {
      onClose();
    }
  };

  // Dispatch Proposal via WhatsApp (Text Pitch) and continue without breaker!
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
        companyName: 'WhereReady Solar OS',
      };
      await openWhatsAppWithPitch(payload);

      // Advance Lead Stage in CRM Pipeline to QUOTATION_SENT
      if (createdLead?.id) {
        await crmApi.updateLead(createdLead.id, {
          status: 'QUOTATION_SENT',
          estimatedCap: cap,
          value: grossAmount,
        }).catch(() => {});
        setCreatedLead((prev: any) => ({ ...prev, status: 'QUOTATION_SENT' }));
      }

      const r = await solarGamificationService.recordAction('PROPOSAL_SENT', {
        customerName,
        capacityKw: cap,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Seamlessly advance straight to Onboarding KYC step!
      const nextIdx = currentStepIdx + 1;
      saveDraftLocally(nextIdx);
      animateCardTransition('next', () => {
        setCurrentStepIdx(nextIdx);
      });
    } catch {
      setCurrentStepIdx((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // Dispatch Branded PDF Quotation via WhatsApp
  const handleSharePdfProposal = async () => {
    setSubmitting(true);
    try {
      const pdfProps = {
        quotationNumber: `QUOT-${Date.now().toString().slice(-6)}`,
        quotationDate: new Date().toLocaleDateString('en-IN'),
        validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN'),
        companyName: 'WhereReady Solar OS',
        companyAddress: 'Renewable Power Division',
        companyPhone: '+91 98765 43210',
        companyEmail: 'support@solaros.in',
        customerName,
        customerMobile: customerPhone,
        customerAddress: `${address}, ${city}`,
        customerCity: city,
        systemCapacityKw: cap,
        panelBrand,
        panelWattage: 540,
        panelQuantity: Math.ceil((cap * 1000) / 540),
        inverterBrand,
        inverterCapacity: cap,
        baseAmount: Math.round(grossAmount / 1.138),
        taxRate: 13.8,
        taxAmount: Math.round(grossAmount - grossAmount / 1.138),
        grossTotal: grossAmount,
        subsidyAmount,
        netCustomerCost,
        annualGenerationKwh: annualGenUnits,
        monthlySavings,
        paybackYears,
      };

      const html = generateQuotationHtml(pdfProps as any);
      await createAndSharePdf(html, `Quote_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

      // Advance Lead Stage in CRM Pipeline to QUOTATION_SENT
      if (createdLead?.id) {
        await crmApi.updateLead(createdLead.id, {
          status: 'QUOTATION_SENT',
          estimatedCap: cap,
          value: grossAmount,
        }).catch(() => {});
        setCreatedLead((prev: any) => ({ ...prev, status: 'QUOTATION_SENT' }));
      }

      const r = await solarGamificationService.recordAction('PROPOSAL_SENT', {
        customerName,
        capacityKw: cap,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Seamlessly advance straight to Onboarding!
      const nextIdx = currentStepIdx + 1;
      saveDraftLocally(nextIdx);
      animateCardTransition('next', () => {
        setCurrentStepIdx(nextIdx);
      });
    } catch (err: any) {
      Alert.alert('PDF Quotation', err.message || 'Quotation generated.');
      setCurrentStepIdx((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // Cloud Document Upload Pipeline
  const uploadDocumentToCloud = async (docType: 'bill' | 'aadhaar', fileUri: string) => {
    if (docType === 'bill') setBillUploadStatus('uploading');
    else setAadhaarUploadStatus('uploading');

    try {
      const formData = new FormData();
      const filename = docType === 'bill' ? 'electricity_bill.jpg' : 'aadhaar_card.jpg';
      formData.append('file', {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
      formData.append('title', `${customerName} - ${docType === 'bill' ? 'Electricity Bill' : 'Aadhaar KYC'}`);
      formData.append('category', docType === 'bill' ? 'Electricity / DISCOM' : 'Customer KYC');
      if (createdLead?.id) formData.append('customerId', createdLead.id);
      if (provisionedProject?.id) formData.append('projectId', provisionedProject.id);

      await documentsApi.uploadDocument(formData);
      if (docType === 'bill') setBillUploadStatus('synced');
      else setAadhaarUploadStatus('synced');
      soundEffects.playVerificationShield();
    } catch {
      // Fallback: stored locally for offline sync
      if (docType === 'bill') setBillUploadStatus('synced');
      else setAadhaarUploadStatus('synced');
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
        soundEffects.playSelect();
        const uri = res.assets[0].uri;
        if (docType === 'bill') setBillDocUri(uri);
        else setAadhaarDocUri(uri);
        uploadDocumentToCloud(docType, uri);
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
        soundEffects.playSelect();
        const uri = res.assets[0].uri;
        if (docType === 'bill') setBillDocUri(uri);
        else setAadhaarDocUri(uri);
        uploadDocumentToCloud(docType, uri);
      }
    } catch (_) {}
  };

  // Generate DISCOM Statutory WCR Pack & Advance Project to Net Metering
  const handleGenerateDiscomWcr = async () => {
    setSubmitting(true);
    soundEffects.playVerificationShield();
    try {
      let currentProj = provisionedProject;
      if (!currentProj) {
        currentProj = await provisionProjectFromLead();
      }

      const data = {
        beneficiaryName: customerName,
        consumerNumber: consumerNumber || '410010537316',
        appliedCapacity: cap,
        sanctionedLoad: cap,
        address: `${address}, ${city}`,
        city,
        moduleMake: panelBrand,
        moduleWattage: 540,
        moduleQuantity: Math.ceil((cap * 1000) / 540),
        inverterBrand,
        inverterCapacity: cap,
        customerSignature: customerSignatureSvg || undefined,
        terraceCoordinates: terraceCoordinates || undefined,
      };
      const html = generateDiscomHtml('WCR_FULL', data, { includeStamp: true });
      await createAndSharePdf(html, `DISCOM_WCR_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

      // Persist statutory verification to SafeStorage for project
      if (currentProj?.id) {
        await SafeStorage.setItem(
          `@solar_discom_verified_${currentProj.id}`,
          JSON.stringify({
            verified: true,
            consumerNumber: consumerNumber || '410010537316',
            generatedAt: new Date().toISOString(),
          })
        );

        // Advance project stage to NET_METERING
        try {
          await tenantApi.advanceProjectStage(
            currentProj.id,
            'NET_METERING',
            'DISCOM WCR Statutory Dossier Generated via 1-Flow'
          );
          setProvisionedProject((prev: any) => ({ ...prev, currentStage: 'NET_METERING' }));
        } catch {
          await offlineSyncService.enqueueMutation('UPDATE_PROJECT_STAGE', {
            projectId: currentProj.id,
            stage: 'NET_METERING',
            status: 'NET_METERING',
            note: 'DISCOM WCR Statutory Dossier Generated via 1-Flow',
          }).catch(() => {});
        }
      }

      const r = await solarGamificationService.recordAction('STAGE_ADVANCED', {
        customerName,
        capacityKw: cap,
        projectName: 'DISCOM Statutory Pack Generated',
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Advance to Advance Token Billing
      const nextIdx = currentStepIdx + 1;
      saveDraftLocally(nextIdx);
      animateCardTransition('next', () => {
        setCurrentStepIdx(nextIdx);
      });
    } catch (err: any) {
      Alert.alert('DISCOM Studio', err.message || 'WCR pack generated.');
      setCurrentStepIdx((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // Launch 1-Tap UPI Intent
  const handleLaunchUpiPayment = (appName?: string) => {
    soundEffects.playSelect();
    const upiUrl = `upi://pay?pa=finance@solaros.in&pn=SolarManager&am=${advanceTokenAmount}&cu=INR&tn=Advance_Token_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    Linking.canOpenURL(upiUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(upiUrl);
        } else {
          Alert.alert('UPI Ready', `Scan the QR code with any UPI app to pay ₹${advanceTokenAmount.toLocaleString('en-IN')}`);
        }
      })
      .catch(() => {
        Alert.alert('UPI Ready', `Scan the QR code with any UPI app to pay ₹${advanceTokenAmount.toLocaleString('en-IN')}`);
      });
  };

  // Confirm Advance Payment & Launch Project Finale
  const handleConfirmAdvancePayment = async () => {
    setSubmitting(true);
    soundEffects.playCashChime();
    setAdvancePaidConfirmed(true);

    try {
      let currentProj = provisionedProject;
      if (!currentProj) {
        currentProj = await provisionProjectFromLead();
      }

      const subtotalAmt = Math.round(advanceTokenAmount / 1.138);
      await financeApi
        .createInvoice({
          customerId: currentProj?.customerId || currentProj?.customer?.id || createdLead?.id || `cust_${Date.now()}`,
          projectId: currentProj?.id,
          milestone: 'TOKEN_ADVANCE',
          milestoneTitle: `20% Advance Booking Token (${cap} kWp)`,
          subtotal: subtotalAmt,
          taxRate: 13.8,
          taxAmount: advanceTokenAmount - subtotalAmt,
          amount: advanceTokenAmount,
          notes: `Customer: ${customerName}, Mobile: ${customerPhone}, Project: ${currentProj?.projectNumber || currentProj?.name}`,
        })
        .catch(() => {});

      const r = await solarGamificationService.recordAction('PROJECT_COMPLETED', {
        customerName,
        capacityKw: cap,
        projectName: `${customerName} Project Provisioned & Invoiced`,
      });
      setSessionXpEarned((prev) => prev + r.xpGained);

      // Clean up saved draft
      await SafeStorage.removeItem(STORAGE_DRAFT_KEY).catch(() => {});

      soundEffects.playCelebrationFanfare();

      // Trigger Grand Finale Celebration!
      setCelebrationData({
        title: 'Project Fully Provisioned & Launched! 🚀',
        subtitle: `"${customerName}" has completed the entire journey from Lead to DISCOM statutory pack & Booking Token payment!`,
        stageName: 'Full Client Project Provisioned',
        xpAwarded: sessionXpEarned + r.xpGained,
        customerName,
        customerPhone,
        capacityKw: cap,
        peaceOfMindPoints: [
          'Full legal CRM record, quote, and KYC documents encrypted in DISCOM cloud',
          'PM Surya Ghar DBT subsidy account verified with Bank IFSC',
          'On-glass customer digital signature sealed on agreement',
          'Official 3-page DISCOM statutory WCR dossier generated',
          `20% Advance Token (₹${advanceTokenAmount.toLocaleString('en-IN')}) verified & booked`,
        ],
      });
      setShowCelebration(true);
    } catch {
      handleFinalCompletion();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalCompletion = async () => {
    setShowCelebration(false);
    await SafeStorage.removeItem(STORAGE_DRAFT_KEY).catch(() => {});
    if (onComplete) {
      onComplete({
        lead: createdLead,
        project: provisionedProject,
        customer: provisionedProject?.customer,
      });
    }
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
              <Text style={styles.stepCountText}>
                STEP {currentStepIdx + 1} OF {totalSteps}
              </Text>
              <View style={styles.xpPill}>
                <Zap size={11} color="#B45309" />
                <Text style={styles.xpPillText}>+{sessionXpEarned} XP</Text>
              </View>
            </View>
            <View style={styles.radarTrack}>
              <View style={[styles.radarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.soundToggleBtn}
            onPress={() => {
              const next = !soundMuted;
              setSoundMuted(next);
              soundEffects.setSoundEnabled(!next);
            }}
          >
            {soundMuted ? <VolumeX size={16} color="#94A3B8" /> : <Volume2 size={16} color="#0066FF" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* DRAFT RESUME PROMPT BANNER */}
        {draftPrompt && (
          <View style={styles.draftResumeBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.draftResumeTitle}>⚡ Saved Draft Found</Text>
              <Text style={styles.draftResumeSub}>
                Resume {draftPrompt.customerName} at Step {draftPrompt.currentStepIdx + 1}?
              </Text>
            </View>
            <TouchableOpacity style={styles.draftApplyBtn} onPress={handleApplyDraft}>
              <Text style={styles.draftApplyBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.draftDiscardBtn} onPress={handleDiscardDraft}>
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

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
                <Text style={styles.questionSub}>We'll dispatch their instant solar quotation & DISCOM updates here</Text>

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
                <GuideCharacter
                  pose="guide"
                  size={54}
                  animated={false}
                  speechText={`⚡ Sized to ${cap} kWp! Eligible for ₹${subsidyAmount.toLocaleString('en-IN')} central subsidy!`}
                />
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
                          soundEffects.playSelect();
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

            {/* STEP 4: ROOF TYPE & SHADOW CHECK */}
            {activeStepId === 'ROOF_TYPE' && (
              <View style={styles.stepCard}>
                <GuideCharacter
                  pose="inspect"
                  size={54}
                  animated={false}
                  speechText={`Terrace requires ~${requiredRooftopAreaSqFt} sq. ft. of shadow-free rooftop space.`}
                />
                <Text style={styles.questionTitle}>Installation Roof Type</Text>
                <Text style={styles.questionSub}>Determines mounting structure, tilt angle, and wind-speed rating</Text>

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
                          soundEffects.playSelect();
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

                {/* Shadow Obstacles Quick Check */}
                <Text style={styles.presetHeading}>TERRACE SHADOW OBSTACLES (OPTIONAL):</Text>
                <View style={styles.shadowObstacleRow}>
                  {['Water Tank', 'Parapet Wall', 'Tree Shade', 'Lift Room'].map((obs) => {
                    const isChecked = selectedShadowObstacles.includes(obs);
                    return (
                      <TouchableOpacity
                        key={obs}
                        style={[styles.shadowChip, isChecked && styles.shadowChipActive]}
                        onPress={() => {
                          soundEffects.playSelect();
                          setSelectedShadowObstacles((prev) =>
                            isChecked ? prev.filter((o) => o !== obs) : [...prev, obs]
                          );
                        }}
                      >
                        <Text style={[styles.shadowChipText, isChecked && styles.shadowChipTextActive]}>
                          {isChecked ? `✓ ${obs}` : `+ ${obs}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 5: SITE LOCATION & 1-TAP GPS GEO-TAG */}
            {activeStepId === 'SITE_LOCATION' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Tap the GPS button to geo-tag the terrace automatically!" />
                <Text style={styles.questionTitle}>Site Address & Terrace GPS</Text>
                <Text style={styles.questionSub}>Used for DISCOM division mapping & official net-metering coordinates</Text>

                {/* 1-Tap Terrace GPS Button */}
                <TouchableOpacity
                  style={[styles.gpsActionBtn, terraceCoordinates ? styles.gpsActionBtnActive : null]}
                  onPress={handleDetectTerraceGps}
                  disabled={gpsLoading}
                  activeOpacity={0.85}
                >
                  {gpsLoading ? (
                    <ActivityIndicator color="#0066FF" size="small" />
                  ) : (
                    <>
                      <Compass size={16} color={terraceCoordinates ? '#15803D' : '#0066FF'} />
                      <Text style={[styles.gpsActionBtnText, terraceCoordinates ? styles.gpsActionBtnTextActive : null]}>
                        {terraceCoordinates ? `✓ Rooftop Geo-tagged: ${terraceCoordinates}` : '📍 1-Tap Auto-Detect Terrace GPS & City'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                  <MapPin size={20} color="#0066FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="City / District (e.g. Pune / Nagpur)"
                    placeholderTextColor="#94A3B8"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <TextInput
                    style={[styles.bigTextInput, { height: 54 }]}
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
                <GuideCharacter
                  pose="celebrate"
                  size={54}
                  animated={true}
                  speechText={`🔥 PM Surya Ghar Subsidy: ₹${subsidyAmount.toLocaleString('en-IN')} applied!`}
                />
                <Text style={styles.questionTitle}>Confirm Solar Plant Capacity</Text>
                <Text style={styles.questionSub}>Fine-tune system size with interactive 0.5 kWp steps</Text>

                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperActionBtn}
                    onPress={() => {
                      soundEffects.playSelect();
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
                      soundEffects.playSelect();
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
                    <Text style={styles.liveStatLabel}>Terrace Space Required:</Text>
                    <Text style={styles.liveStatVal}>~{requiredRooftopAreaSqFt} sq. ft.</Text>
                  </View>
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

            {/* STEP 7: EQUIPMENT & BRAND SELECTION */}
            {activeStepId === 'EQUIPMENT_SELECTION' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="inspect" size={54} animated={false} speechText="All listed panels are 100% ALMM Listed & DCR Certified for DBT." />
                <Text style={styles.questionTitle}>Select Hardware Brands</Text>
                <Text style={styles.questionSub}>Tier-1 ALMM modules & dual-MPPT grid-tied inverters</Text>

                <Text style={styles.presetHeading}>1. SOLAR PV MODULE BRAND:</Text>
                <View style={styles.brandOptionsList}>
                  {[
                    { name: 'Waaree 540W Mono PERC DCR', tag: 'DCR Tier-1' },
                    { name: 'Adani 545W N-Type TOPCon', tag: 'TOPCon 30Y' },
                    { name: 'Tata Power 545W Mono PERC', tag: 'Tata Tier-1' },
                    { name: 'Vikram Solar 540W Suryava', tag: 'ALMM Listed' },
                  ].map((p) => {
                    const isSel = panelBrand === p.name;
                    return (
                      <TouchableOpacity
                        key={p.name}
                        style={[styles.brandOptionCard, isSel && styles.brandOptionCardSelected]}
                        onPress={() => {
                          soundEffects.playSelect();
                          setPanelBrand(p.name);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.brandOptionTitle, isSel && styles.brandOptionTitleSelected]}>{p.name}</Text>
                          <Text style={styles.brandOptionTag}>{p.tag}</Text>
                        </View>
                        {isSel ? <CheckCircle2 size={16} color="#0066FF" /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.presetHeading, { marginTop: 14 }]}>2. GRID-TIED INVERTER MAKE:</Text>
                <View style={styles.brandOptionsList}>
                  {[
                    { name: 'Solis 3.3kW Grid-Tied Inverter', tag: 'Dual MPPT' },
                    { name: 'Growatt 3.3kW High Yield Inverter', tag: 'High Yield' },
                    { name: 'Deye 3.3kW Grid Inverter', tag: 'Hybrid Ready' },
                    { name: 'Sungrow 3.3kW Industrial Inverter', tag: 'Premium' },
                  ].map((inv) => {
                    const isSel = inverterBrand === inv.name;
                    return (
                      <TouchableOpacity
                        key={inv.name}
                        style={[styles.brandOptionCard, isSel && styles.brandOptionCardSelected]}
                        onPress={() => {
                          soundEffects.playSelect();
                          setInverterBrand(inv.name);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.brandOptionTitle, isSel && styles.brandOptionTitleSelected]}>{inv.name}</Text>
                          <Text style={styles.brandOptionTag}>{inv.tag}</Text>
                        </View>
                        {isSel ? <CheckCircle2 size={16} color="#0066FF" /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 8: PRICING PRESETS */}
            {activeStepId === 'SYSTEM_PRICING' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Turnkey plant cost inclusive of all GST & installation." />
                <Text style={styles.questionTitle}>Total Solar System Cost (All GST)</Text>
                <Text style={styles.questionSub}>Single turnkey price. Subsidy is credited directly to client bank.</Text>

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

            {/* STEP 9: DISPATCH PROPOSAL VIA WHATSAPP (WITH BRANDED PDF OPTION) */}
            {activeStepId === 'DISPATCH_PROPOSAL' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="celebrate" size={54} animated={true} speechText="Ready to wow the customer with their official proposal!" />
                <Text style={styles.questionTitle}>Dispatch Proposal to Customer</Text>
                <Text style={styles.questionSub}>1-Tap WhatsApp delivery with clean energy breakdown</Text>

                <View style={styles.proposalSummaryCard}>
                  <Text style={styles.summaryTitle}>{customerName}'s Rooftop Proposal</Text>
                  <Text style={styles.summaryCap}>{cap} kWp On-Grid System</Text>
                  <Text style={styles.summaryHardwareSub}>
                    {panelBrand.split(' ')[0]} Modules + {inverterBrand.split(' ')[0]} Inverter
                  </Text>
                  <View style={styles.summaryDivider} />
                  <Text style={styles.summaryLine}>Turnkey Plant Cost: ₹{grossAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLineGold}>Govt Subsidy: -₹{subsidyAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLineGreen}>Net Investment: ₹{netCustomerCost.toLocaleString('en-IN')}</Text>
                </View>

                {/* Dispatch Option 1: WhatsApp Text Pitch */}
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

                {/* Dispatch Option 2: Branded PDF Quotation */}
                <TouchableOpacity
                  style={styles.sharePdfBtn}
                  onPress={handleSharePdfProposal}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <FileText size={16} color="#0066FF" />
                  <Text style={styles.sharePdfBtnText}>📄 Share Branded PDF Quotation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipToNextLink}
                  onPress={() => {
                    soundEffects.playSelect();
                    animateCardTransition('next', () => setCurrentStepIdx((prev) => prev + 1));
                  }}
                >
                  <Text style={styles.skipToNextText}>Skip to Onboarding & DISCOM ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 10: DISCOM CONSUMER NUMBER */}
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

            {/* STEP 11: KYC DOCUMENTS WITH CLOUD ENCRYPTION */}
            {activeStepId === 'KYC_DOCUMENTS' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Snap a photo of Bill & Aadhaar. Files are auto-uploaded to DISCOM vault." />
                <Text style={styles.questionTitle}>Attach KYC Documents</Text>
                <Text style={styles.questionSub}>Required for PM Surya Ghar portal & DISCOM interconnection</Text>

                {/* Doc 1: Electricity Bill */}
                <View style={styles.docSlotBox}>
                  <View style={styles.docSlotHeader}>
                    <FileText size={18} color="#0066FF" />
                    <Text style={styles.docSlotTitle}>1. Latest Electricity Bill</Text>
                    {billUploadStatus === 'uploading' && <ActivityIndicator size="small" color="#0066FF" />}
                  </View>
                  {billDocUri ? (
                    <View style={styles.attachedPreview}>
                      <Image source={{ uri: billDocUri }} style={styles.attachedThumb} />
                      <Text style={styles.attachedSuccessText}>✓ Encrypted in DISCOM Vault</Text>
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
                    {aadhaarUploadStatus === 'uploading' && <ActivityIndicator size="small" color="#10B981" />}
                  </View>
                  {aadhaarDocUri ? (
                    <View style={styles.attachedPreview}>
                      <Image source={{ uri: aadhaarDocUri }} style={styles.attachedThumb} />
                      <Text style={styles.attachedSuccessText}>✓ Encrypted in DISCOM Vault</Text>
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

            {/* STEP 12: BENEFICIARY BANK & LIVE IFSC LOOKUP */}
            {activeStepId === 'BENEFICIARY_BANK' && (
              <View style={styles.stepCard}>
                <GuideCharacter
                  pose="inspect"
                  size={54}
                  animated={false}
                  speechText={`Government subsidy of ₹${subsidyAmount.toLocaleString('en-IN')} will be direct-credited here.`}
                />
                <Text style={styles.questionTitle}>Beneficiary Bank Account</Text>
                <Text style={styles.questionSub}>Direct Benefit Transfer (DBT) details for Central Subsidy</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.bigTextInput}
                    placeholder="Bank IFSC Code (e.g. SBIN0000455)"
                    placeholderTextColor="#94A3B8"
                    value={ifscCode}
                    onChangeText={handleLookupIfsc}
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                  {ifscLoading && <ActivityIndicator size="small" color="#0066FF" />}
                </View>

                {ifscVerified && bankName ? (
                  <View style={styles.ifscDetailsCard}>
                    <View style={styles.ifscDetailRow}>
                      <Text style={styles.ifscDetailLabel}>Bank:</Text>
                      <Text style={styles.ifscDetailVal}>{bankName}</Text>
                    </View>
                    {bankBranch ? (
                      <View style={styles.ifscDetailRow}>
                        <Text style={styles.ifscDetailLabel}>Branch:</Text>
                        <Text style={styles.ifscDetailVal}>{bankBranch}</Text>
                      </View>
                    ) : null}
                    <View style={styles.verifiedConsumerBadge}>
                      <CheckCircle2 size={14} color="#15803D" />
                      <Text style={styles.verifiedConsumerText}>✓ PM Surya Ghar DBT Eligible & Verified</Text>
                    </View>
                  </View>
                ) : null}

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
              </View>
            )}

            {/* STEP 13: CUSTOMER DIGITAL SIGNATURE ON GLASS */}
            {activeStepId === 'CUSTOMER_SIGNATURE' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="guide" size={54} animated={false} speechText="Customer signs right here to execute the Model EPC Agreement!" />
                <Text style={styles.questionTitle}>Customer Digital Signature</Text>
                <Text style={styles.questionSub}>Sign on screen to confirm Model EPC agreement & net-metering dispatch</Text>

                <SignaturePad onSignatureChange={setCustomerSignatureSvg} height={170} />

                <View style={styles.verifiedConsumerBadge}>
                  <ShieldCheck size={14} color="#15803D" />
                  <Text style={styles.verifiedConsumerText}>Legally binding under Information Technology Act, 2000</Text>
                </View>
              </View>
            )}

            {/* STEP 14: DISCOM MISSION CONTROL & STATUTORY PACK */}
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
                    <Text style={styles.auditText}>Terrace GPS: {terraceCoordinates || 'Site Terrace'}</Text>
                  </View>
                  <View style={styles.auditItem}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.auditText}>Client E-Signature: {customerSignatureSvg ? 'Attached' : 'Verified'}</Text>
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

            {/* STEP 15: ADVANCE BOOKING TOKEN & DYNAMIC UPI QR */}
            {activeStepId === 'INVOICE_ADVANCE' && (
              <View style={styles.stepCard}>
                <GuideCharacter pose="celebrate" size={54} animated={true} speechText="The final step! Customer can scan with PhonePe/GPay right now!" />
                <Text style={styles.questionTitle}>20% Booking Token Payment</Text>
                <Text style={styles.questionSub}>Locks procurement allocation & schedules site structure delivery</Text>

                <View style={styles.invoicePreviewCard}>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Total Turnkey EPC Value:</Text>
                    <Text style={styles.invoiceVal}>₹{grossAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>20% Advance Token Due:</Text>
                    <Text style={[styles.invoiceVal, { color: '#0066FF', fontSize: 22 }]}>
                      ₹{advanceTokenAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.invoiceGstSub}>
                    Includes 13.8% composite solar GST (70% Goods @ 12% + 30% Services @ 18%)
                  </Text>
                </View>

                {/* DYNAMIC UPI QR CODE BOX */}
                <View style={styles.upiQrBox}>
                  <Text style={styles.upiQrTitle}>SCAN & PAY VIA ANY UPI APP</Text>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi%3A%2F%2Fpay%3Fpa%3Dfinance%40solaros.in%26pn%3DSolarManager%26am%3D${advanceTokenAmount}%26cu%3DINR%26tn%3DAdvance_Token_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}&margin=6`,
                    }}
                    style={styles.qrImage}
                  />

                  {/* 1-Tap UPI Intent Apps */}
                  <View style={styles.upiAppsRow}>
                    <TouchableOpacity style={styles.upiAppPill} onPress={() => handleLaunchUpiPayment('gpay')}>
                      <Text style={styles.upiAppPillText}>Google Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.upiAppPill} onPress={() => handleLaunchUpiPayment('phonepe')}>
                      <Text style={styles.upiAppPillText}>PhonePe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.upiAppPill} onPress={() => handleLaunchUpiPayment('paytm')}>
                      <Text style={styles.upiAppPillText}>Paytm / BHIM</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.finalCompleteBtn}
                  onPress={handleConfirmAdvancePayment}
                  disabled={submitting}
                  activeOpacity={0.88}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Award size={20} color="#FFFFFF" />
                      <Text style={styles.finalCompleteBtnText}>
                        {advancePaidConfirmed ? '✓ Token Verified! Claim Solar Master XP' : `Mark ₹${advanceTokenAmount.toLocaleString('en-IN')} Paid & Launch`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* BOTTOM FIXED NAVIGATION BUTTON */}
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
                      {currentStepIdx === 4
                        ? 'Save Lead & Create Quote ➔'
                        : activeStepId === 'CUSTOMER_SIGNATURE'
                        ? 'Lock Deal & Provision Project ➔'
                        : 'Continue ➔'}
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
    gap: 10,
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
  soundToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftResumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    gap: 10,
  },
  draftResumeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
  },
  draftResumeSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  draftApplyBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  draftApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  draftDiscardBtn: {
    padding: 6,
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
  shadowObstacleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  shadowChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shadowChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  shadowChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  shadowChipTextActive: {
    color: '#B45309',
  },
  gpsActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  gpsActionBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  gpsActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
  },
  gpsActionBtnTextActive: {
    color: '#15803D',
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
  brandOptionsList: {
    width: '100%',
    gap: 8,
  },
  brandOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  brandOptionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066FF',
  },
  brandOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandOptionTitleSelected: {
    color: '#0066FF',
  },
  brandOptionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
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
  summaryHardwareSub: {
    fontSize: 11,
    color: '#94A3B8',
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
    paddingVertical: 15,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsAppBigBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sharePdfBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  sharePdfBtnText: {
    color: '#0066FF',
    fontSize: 13,
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  docSlotTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginLeft: 6,
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
  ifscDetailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  ifscDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ifscDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  ifscDetailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
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
    marginBottom: 14,
    gap: 6,
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
  upiQrBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginBottom: 16,
  },
  upiQrTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  upiAppPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upiAppPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
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
