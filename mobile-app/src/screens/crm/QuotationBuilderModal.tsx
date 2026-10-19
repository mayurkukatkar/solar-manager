import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  FileText,
  MessageCircle,
  Share2,
  Printer,
  Sparkles,
  Calculator,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Percent,
  Eye,
  Send,
} from 'lucide-react-native';
import {
  generateQuotationHtml,
  previewPdf,
  sharePdfFile,
  createAndSharePdf,
  printDirectly,
  QuotationPdfProps,
} from '../../services/pdfService';
import { openWhatsAppWithPitch } from '../../services/whatsappService';
import { crmApi, quotationsApi } from '../../api/endpoints';
import { ProposalPreviewModal } from '../../components/ProposalPreviewModal';

interface QuotationBuilderModalProps {
  visible: boolean;
  lead: any;
  onClose: () => void;
  onSuccess?: (quotation: any) => void;
  onProceedToOnboarding?: (lead: any, quotation: any) => void;
}

export const QuotationBuilderModal: React.FC<QuotationBuilderModalProps> = ({
  visible,
  lead,
  onClose,
  onSuccess,
  onProceedToOnboarding,
}) => {
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [sendingPitchText, setSendingPitchText] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedQuote, setSyncedQuote] = useState<any>(null);
  const [language, setLanguage] = useState<'EN' | 'HI' | 'MR'>('EN');

  // Technical Specs
  const initialCap = lead?.estimatedCap || lead?.recommendedKw || 3.3;
  const [capacityKw, setCapacityKw] = useState<string>(String(initialCap));
  const [systemType, setSystemType] = useState('On-Grid Rooftop');
  const [panelBrand, setPanelBrand] = useState('Waaree 540W Mono PERC DCR');
  const [inverterBrand, setInverterBrand] = useState('Solis 3.3kW Grid-Tied Inverter');
  const [structureType, setStructureType] = useState('Elevated HDG GI Structure');

  // Single Pricing Input: Solar System Cost (Entered manually by user, NOT calculated from kW)
  const [totalSystemCost, setTotalSystemCost] = useState<string>(
    lead?.estimatedValue && Number(lead.estimatedValue) > 0 ? String(lead.estimatedValue) : ''
  );

  // Auto-fill capacity and quote amount from lead when opened
  useEffect(() => {
    if (visible && lead) {
      const capVal = lead?.estimatedCap || lead?.recommendedKw || 3.3;
      setCapacityKw(String(capVal));
      if (lead?.estimatedValue && Number(lead.estimatedValue) > 0) {
        setTotalSystemCost(String(lead.estimatedValue));
      } else {
        setTotalSystemCost('');
      }
    }
  }, [visible, lead]);

  // Solar Economics Calculation
  const cap = parseFloat(capacityKw) || 3.3;
  const grossTotal = parseFloat(totalSystemCost) || 0;

  const handleCapacityChange = (val: string) => {
    setCapacityKw(val);
    // DO NOT overwrite or auto-calculate amount based on kW! User enters custom agreed amount.
  };

  // PM Surya Ghar Muft Bijli Yojana Central Subsidy
  const computeSubsidy = (kw: number): number => {
    if (kw <= 0) return 0;
    if (kw <= 1) return 30000;
    if (kw <= 2) return 60000;
    return 78000; // Cap at 78,000 for 3kW and above
  };

  const subsidy = computeSubsidy(cap);
  const netCustomerCost = Math.max(0, grossTotal - subsidy);

  // Generation & Savings
  const monthlyUnits = Math.round(cap * 120);
  const annualUnits = Math.round(cap * 1460);
  const tariff = 8.5; // Average tariff ₹8.5/unit
  const monthlySavings = Math.round(monthlyUnits * tariff);
  const lifetimeSavings = Math.round(annualUnits * 25 * tariff * 0.92);
  const paybackYears = Number((netCustomerCost / (monthlySavings * 12)).toFixed(1));

  // EMI Comparison
  // 5 Year Solar Loan at 8.5% interest rate (~₹20.5 per ₹1000)
  const approxMonthlyEmi = Math.round((netCustomerCost * 0.0205));

  const buildPdfPayload = (): QuotationPdfProps => ({
    quotationNumber: syncedQuote?.qNumber || `QT-${Date.now().toString().slice(-6)}`,
    quotationDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    companyName: 'SolarManager Solutions Pvt Ltd',
    companyAddress: 'Corporate Tower, Tech Park, Pune 411038',
    companyPhone: '+91 98765 43210',
    companyEmail: 'contact@solarmanager.in',
    customerName: lead?.name || 'Valued Customer',
    customerPhone: lead?.mobile || lead?.phone || '',
    customerAddress: lead?.address || 'Site Location, Maharashtra',
    consumerNumber: lead?.consumerNumber,
    discomName: lead?.discomName || 'MSEDCL',
    systemCapacityKw: cap,
    systemType,
    panelBrand,
    panelWattage: 540,
    inverterBrand,
    inverterCapacityKw: cap,
    structureType,
    grossAmount: grossTotal,
    subsidyAmount: subsidy,
    netPayable: netCustomerCost,
    discount: 0,
    monthlyGenerationUnits: monthlyUnits,
    annualGenerationUnits: annualUnits,
    currentMonthlyBill: lead?.monthlyBill || Math.round(monthlySavings * 1.15),
    estimatedMonthlyBill: Math.round(Math.max(150, (lead?.monthlyBill || monthlySavings) - monthlySavings)),
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
    try {
      setSyncing(true);
      const customerName = lead?.name || 'Valued Customer';
      const customerPhone = lead?.mobile || lead?.phone || '';
      const customerAddress = lead?.address || 'Site Location, Maharashtra';

      const res = await quotationsApi.createQuotation({
        leadId: lead?.id,
        customerId: lead?.customerId,
        newCustomer: (!lead?.id && !lead?.customerId) ? {
          name: customerName,
          mobile: customerPhone,
          address: customerAddress,
        } : undefined,
        customerName,
        customerPhone,
        customerAddress,
        systemCapacity: cap,
        totalSystemCost: grossTotal,
        status: statusOverride,
        panelBrand,
        panelWattage: 540,
        inverterBrand,
        inverterCapacity: cap,
        structureBrand: structureType,
        validityDays: 15,
      });

      if (res?.quotation) {
        setSyncedQuote(res.quotation);
        if (onSuccess) onSuccess(res.quotation);
        return res.quotation;
      }
    } catch (err: any) {
      console.warn('Backend quotation sync notice:', err?.message);
    } finally {
      setSyncing(false);
    }
    return null;
  };

  const handlePreviewPdf = () => {
    if (!syncedQuote) {
      syncToBackend('VIEWED').catch(() => {});
    }
    setShowVisualPreview(true);
  };

  const handlePrintPdf = async () => {
    try {
      const payload = buildPdfPayload();
      const html = generateQuotationHtml(payload);
      await printDirectly(html);
    } catch (err: any) {
      Alert.alert('Print Error', err.message || 'Could not print proposal');
    }
  };

  const handleShareWhatsAppPdf = async () => {
    if (grossTotal <= 0) {
      Alert.alert('Amount Required', 'Please enter the Total Solar System Cost (₹) before sharing the proposal.');
      return;
    }
    setSharingWhatsApp(true);
    try {
      // 1. Sync quotation to backend database so it appears in web module
      const saved = await syncToBackend('SENT');
      const quoteNum = saved?.qNumber || syncedQuote?.qNumber || `QT-${Date.now().toString().slice(-6)}`;

      const payload = buildPdfPayload();
      payload.quotationNumber = quoteNum;

      // 2. Export PDF and open WhatsApp document share
      const html = generateQuotationHtml(payload);
      const fileName = `Solar_Proposal_${payload.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await sharePdfFile(html, fileName, payload.customerPhone);

      // 3. Mark stage advancement in CRM
      if (lead?.id) {
        crmApi.advanceLeadStage(lead.id, 'PROPOSAL_SENT').catch(() => {});
      }
    } catch (err: any) {
      Alert.alert('WhatsApp PDF Share Error', err.message || 'Failed to dispatch quotation PDF via WhatsApp');
    } finally {
      setSharingWhatsApp(false);
    }
  };

  const handleSendTextPitch = async () => {
    if (grossTotal <= 0) {
      Alert.alert('Amount Required', 'Please enter the Total Solar System Cost (₹) before sending the pitch.');
      return;
    }
    setSendingPitchText(true);
    try {
      await syncToBackend('SENT');
      const payload = buildPdfPayload();
      await openWhatsAppWithPitch({
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        systemCapacityKw: payload.systemCapacityKw,
        grossAmount: payload.grossAmount,
        subsidyAmount: payload.subsidyAmount,
        netPayable: payload.netPayable,
        monthlySavings: payload.monthlySavings,
        lifetimeSavings: payload.lifetimeSavings,
        companyName: payload.companyName,
        repName: 'Solar Field Executive',
        language,
      });

      if (lead?.id) {
        crmApi.advanceLeadStage(lead.id, 'PROPOSAL_SENT').catch(() => {});
      }
    } catch (err: any) {
      Alert.alert('WhatsApp Text Pitch Error', err.message || 'Could not launch WhatsApp');
    } finally {
      setSendingPitchText(false);
    }
  };

  const handleSharePdfFile = async () => {
    if (grossTotal <= 0) {
      Alert.alert('Amount Required', 'Please enter the Total Solar System Cost (₹) before exporting the PDF.');
      return;
    }
    setSharingPdf(true);
    try {
      if (!syncedQuote) {
        syncToBackend('SENT').catch(() => {});
      }
      const payload = buildPdfPayload();
      const html = generateQuotationHtml(payload);
      await sharePdfFile(html, `Solar_Proposal_${payload.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, payload.customerPhone);
    } catch (err: any) {
      Alert.alert('PDF Share Error', err.message || 'Could not export proposal PDF file');
    } finally {
      setSharingPdf(false);
    }
  };

  const handleProceedToClientOnboarding = () => {
    if (onProceedToOnboarding) {
      const quoteSummary = {
        capacityKw: cap,
        grossTotal,
        totalSystemCost: grossTotal,
        subsidy,
        netCustomerCost,
        panelBrand,
        inverterBrand,
        structureType,
      };
      onProceedToOnboarding(lead, quoteSummary);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Quotation Builder</Text>
            <Text style={styles.headerSubtitle}>
              Stage 2: Custom Pricing & WhatsApp PDF Proposal
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* CLIENT PILL */}
          <View style={styles.clientPill}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{lead?.name || 'Prospect'}</Text>
              <Text style={styles.clientPhone}>
                📞 {lead?.mobile || 'No Phone'} {lead?.consumerNumber ? `| Consumer: ${lead.consumerNumber}` : ''}
              </Text>
            </View>
            {syncedQuote ? (
              <View style={styles.badgeSynced}>
                <CheckCircle2 size={12} color="#15803d" />
                <Text style={styles.badgeSyncedText}>Web Synced: {syncedQuote.qNumber}</Text>
              </View>
            ) : syncing ? (
              <View style={styles.badgeSyncing}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.badgeSyncingText}>Syncing...</Text>
              </View>
            ) : (
              <View style={styles.badgeProposal}>
                <Text style={styles.badgeProposalText}>Drafting</Text>
              </View>
            )}
          </View>

          {/* SECTION 1: SYSTEM SIZING & HARDWARE */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>1. System Capacity & Hardware</Text>
              <Text style={styles.cardSubtitle}>Configure technical capacity & components</Text>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Plant Capacity (kWp)</Text>
                <TextInput
                  style={styles.inputHighlight}
                  value={capacityKw}
                  onChangeText={handleCapacityChange}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>System Type</Text>
                <TextInput
                  style={styles.input}
                  value={systemType}
                  onChangeText={setSystemType}
                />
              </View>
            </View>

            <Text style={styles.label}>Solar PV Module Brand & Tech</Text>
            <TextInput
              style={styles.input}
              value={panelBrand}
              onChangeText={setPanelBrand}
              placeholder="Module Make & Wattage"
            />

            <Text style={styles.label}>On-Grid Inverter Make</Text>
            <TextInput
              style={styles.input}
              value={inverterBrand}
              onChangeText={setInverterBrand}
              placeholder="Inverter Make & Capacity"
            />

            <Text style={styles.label}>Mounting Structure Type</Text>
            <TextInput
              style={styles.input}
              value={structureType}
              onChangeText={setStructureType}
              placeholder="Elevated GI / Tin Shed / 10ft High"
            />
          </View>

          {/* SECTION 2: SOLAR SYSTEM COST (ALL GST INCLUDED) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.costHeaderBetween}>
                <Text style={styles.cardTitle}>2. Solar System Cost (All GST Included)</Text>
                <View style={styles.gstTag}>
                  <Text style={styles.gstTagText}>GST Included</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                Single all-inclusive turnkey plant cost. Same figure will appear on the final invoice.
              </Text>
            </View>

            <View style={styles.singleCostCard}>
              <Text style={styles.costFieldLabel}>Total Solar System Cost (₹) *</Text>
              <View style={styles.costInputRow}>
                <Text style={styles.costRupeeSymbol}>₹</Text>
                <TextInput
                  style={styles.costBigInput}
                  value={totalSystemCost}
                  onChangeText={setTotalSystemCost}
                  keyboardType="numeric"
                  placeholder="e.g. 195000"
                />
              </View>
              <Text style={styles.costNote}>
                ✅ Includes Panels, Inverter, Structure, Cables, Earthing, Installation, Liaisoning & 100% of GST.
              </Text>
            </View>
          </View>

          {/* SECTION 3: SUBSIDY & NET CUSTOMER INVESTMENT */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Solar System Cost (All GST Included)</Text>
              <Text style={styles.summaryValue}>₹{grossTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.subsidyLabelRow}>
                <Text style={styles.subsidyLabel}>PM Surya Ghar Subsidy</Text>
                <View style={styles.subsidyBadge}>
                  <Text style={styles.subsidyBadgeText}>{cap >= 3 ? 'Max Sinking' : `${cap} kW Slab`}</Text>
                </View>
              </View>
              <Text style={styles.subsidyValue}>-₹{subsidy.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.netCostRow}>
              <View>
                <Text style={styles.netCostLabel}>Net Customer Cost</Text>
                <Text style={styles.netCostSubtitle}>Effective investment post DBT subsidy</Text>
              </View>
              <Text style={styles.netCostValue}>₹{netCustomerCost.toLocaleString('en-IN')}</Text>
            </View>

            {/* Solar Loan EMI vs Savings Callout */}
            <View style={styles.loanCallout}>
              <View style={styles.loanRow}>
                <Text style={styles.loanText}>
                  Est. 5-Yr Solar Loan EMI: <Text style={styles.loanBold}>₹{approxMonthlyEmi.toLocaleString('en-IN')} / mo</Text>
                </Text>
                <Text style={styles.savingsText}>
                  Bill Savings: <Text style={styles.savingsBold}>₹{monthlySavings.toLocaleString('en-IN')} / mo</Text>
                </Text>
              </View>
              <Text style={styles.loanPitch}>
                💡 Customer earns <Text style={{ color: '#4ade80', fontWeight: '800' }}>₹{Math.max(0, monthlySavings - approxMonthlyEmi).toLocaleString('en-IN')}/mo</Text> surplus from Month 1!
              </Text>
            </View>
          </View>

          {/* LANGUAGE SELECTOR FOR WHATSAPP */}
          <View style={styles.langSelectorRow}>
            <Text style={styles.langTitle}>WhatsApp Pitch Language:</Text>
            <View style={styles.langPills}>
              {(['EN', 'HI', 'MR'] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.langPill, language === l && styles.langPillActive]}
                  onPress={() => setLanguage(l)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langPillText, language === l && styles.langPillTextActive]}>
                    {l === 'EN' ? 'English' : l === 'HI' ? 'हिंदी' : 'मराठी'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
              disabled={sharingWhatsApp}
              activeOpacity={0.85}
            >
              {sharingWhatsApp ? (
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

          {/* CONVERT TO CLIENT CTA */}
          <TouchableOpacity
            style={styles.convertCtaBtn}
            onPress={handleProceedToClientOnboarding}
            activeOpacity={0.85}
          >
            <Text style={styles.convertCtaText}>Customer Approved? Onboard as Client</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* IN-APP VISUAL PROPOSAL PREVIEW MODAL */}
        {showVisualPreview && (
          <ProposalPreviewModal
            visible={showVisualPreview}
            onClose={() => setShowVisualPreview(false)}
            data={buildPdfPayload()}
            isSynced={Boolean(syncedQuote)}
            onWhatsAppSent={() => {
              if (lead?.id) {
                crmApi.advanceLeadStage(lead.id, 'PROPOSAL_SENT').catch(() => {});
              }
            }}
          />
        )}
      </View>
    </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  clientPill: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  clientPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeProposal: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeProposalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
    fontSize: 16,
    color: '#1d4ed8',
    fontWeight: '800',
    marginBottom: 10,
  },
  costHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  singleCostCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  costFieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14532d',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 8,
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
  costRupeeSymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803d',
    marginRight: 6,
  },
  costBigInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    paddingVertical: 10,
  },
  costNote: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '500',
    lineHeight: 15,
  },
  readOnlyBox: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  readOnlyVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  subsidyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subsidyLabel: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '600',
  },
  subsidyBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subsidyBadgeText: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '800',
  },
  subsidyValue: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 12,
  },
  netCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netCostLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  netCostSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  netCostValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: -0.5,
  },
  loanCallout: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loanText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  loanBold: {
    color: '#ffffff',
    fontWeight: '700',
  },
  savingsText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  savingsBold: {
    color: '#4ade80',
    fontWeight: '800',
  },
  loanPitch: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  langTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  langPills: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  langPillActive: {
    backgroundColor: '#2563eb',
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  langPillTextActive: {
    color: '#ffffff',
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
  },
  pdfBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  whatsAppBtn: {
    flex: 1.8,
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
  convertCtaBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  convertCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  shareFileBtn: {
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
