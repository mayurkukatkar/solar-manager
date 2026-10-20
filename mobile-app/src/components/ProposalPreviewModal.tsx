import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  FileText,
  MessageCircle,
  Share2,
  Printer,
  CheckCircle2,
  Zap,
  ShieldCheck,
  TrendingDown,
  Building2,
  Calendar,
  Send,
  Eye,
  Battery,
  Award,
  Layers,
  Check,
  CheckSquare,
} from 'lucide-react-native';
import {
  QuotationPdfProps,
  generateQuotationHtml,
  sharePdfFile,
  printDirectly,
  previewPdf,
  formatIndianCurrency,
} from '../services/pdfService';
import { openWhatsAppWithPitch } from '../services/whatsappService';

export interface ProposalPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  data: QuotationPdfProps;
  isSynced?: boolean;
  onWhatsAppSent?: () => void;
}

export const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  visible,
  onClose,
  data,
  isSynced = true,
  onWhatsAppSent,
}) => {
  const [sharingPdfWa, setSharingPdfWa] = useState(false);
  const [sendingTextWa, setSendingTextWa] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);

  const formatInr = formatIndianCurrency;
  const gross = formatInr(data.grossAmount);
  const subsidy = formatInr(data.subsidyAmount);
  const net = formatInr(data.netPayable);
  const monthlySavings = formatInr(data.monthlySavings);
  const lifetimeSavings = formatInr(data.lifetimeSavings);
  const currentBill = formatInr(data.currentMonthlyBill);
  const newBill = formatInr(data.estimatedMonthlyBill);
  const approxMonthlyEmi = data.financingDetails?.monthly_emi || Math.round(data.netPayable * 0.021);
  const isQuickQuote = data.templateType === 'quick_quote';
  const isHybrid =
    data.systemType === 'Hybrid' ||
    data.systemType === 'Off-grid' ||
    data.templateType === 'hybrid_offgrid' ||
    Boolean(data.batteryCapacity && data.batteryCapacity > 0);
  const isCommercial =
    data.connectionType === 'Commercial' ||
    data.connectionType === 'Industrial' ||
    data.templateType === 'commercial_epc';

  const cap = data.systemCapacityKw || 3.3;
  const invCap = data.inverterCapacityKw || cap;
  const annualUnits = data.annualGenerationUnits || Math.round(cap * 1460);
  const annualSavings = Math.round(annualUnits * (data.tariffRate || (isCommercial ? 10.5 : 8.5)));
  const subtotal = data.subtotal || Math.round(data.grossAmount / 1.138);
  const tax = data.taxAmount || Math.round(data.grossAmount - subtotal);

  const handleSharePdfToWhatsApp = async () => {
    setSharingPdfWa(true);
    try {
      const html = generateQuotationHtml(data);
      const fileName = `Solar_Proposal_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await sharePdfFile(html, fileName, data.customerPhone);
      if (onWhatsAppSent) onWhatsAppSent();
    } catch (err: any) {
      Alert.alert('WhatsApp PDF Share Error', err.message || 'Could not export proposal PDF');
    } finally {
      setSharingPdfWa(false);
    }
  };

  const handleSendWhatsAppPitch = async () => {
    setSendingTextWa(true);
    try {
      await openWhatsAppWithPitch({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        systemCapacityKw: data.systemCapacityKw,
        grossAmount: data.grossAmount,
        subsidyAmount: data.subsidyAmount,
        netPayable: data.netPayable,
        monthlySavings: data.monthlySavings,
        lifetimeSavings: data.lifetimeSavings,
        companyName: data.companyName,
        repName: 'Solar Field Executive',
        language: 'EN',
      });
      if (onWhatsAppSent) onWhatsAppSent();
    } catch (err: any) {
      Alert.alert('WhatsApp Error', err.message || 'Could not launch WhatsApp');
    } finally {
      setSendingTextWa(false);
    }
  };

  const handleSharePdfFile = async () => {
    setSharingPdf(true);
    try {
      const html = generateQuotationHtml(data);
      const fileName = `Solar_Proposal_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await sharePdfFile(html, fileName, data.customerPhone);
    } catch (err: any) {
      Alert.alert('PDF Share Error', err.message || 'Could not export proposal PDF');
    } finally {
      setSharingPdf(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const html = generateQuotationHtml(data);
      await printDirectly(html);
    } catch (err: any) {
      Alert.alert('Print Error', err.message || 'Could not send document to printer');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* TOP MODAL HEADER */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.topHeaderTitle}>Solar Proposal Preview</Text>
              {isSynced && (
                <View style={styles.syncedPill}>
                  <CheckCircle2 size={11} color="#15803d" />
                  <Text style={styles.syncedPillText}>Web Synced</Text>
                </View>
              )}
            </View>
            <Text style={styles.topHeaderSubtitle}>
              {data.quotationNumber} • {data.templateType || 'Standard Proposal'} • {data.customerName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={handlePrint} style={styles.previewA4Btn} activeOpacity={0.8}>
              <Printer size={15} color="#0284c7" />
              <Text style={styles.previewA4BtnText}>A4 Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* VISUAL DOCUMENT VIEWER BODY */}
        <ScrollView style={styles.docScroll} contentContainerStyle={styles.docContent} showsVerticalScrollIndicator={false}>
          {/* ========================================================================= */}
          {/* PAGE 1: EXECUTIVE COVER PAGE */}
          {/* ========================================================================= */}
          <View style={styles.pageSheetDark}>
            <View style={styles.coverTopBar}>
              <View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>PM Surya Ghar Certified Solution</Text>
                </View>
                <Text style={styles.brandTitleDark}>{data.companyName}</Text>
                <Text style={styles.brandSubtitleDark}>Smart Solar Engineering & Clean Energy Partner</Text>
              </View>
              <View style={styles.epcProposalBadge}>
                <Text style={styles.epcProposalBadgeText}>EPC Proposal</Text>
              </View>
            </View>

            <View style={styles.coverHeroBody}>
              <Text style={styles.coverJourneyTag}>YOUR JOURNEY TO SMARTER, CLEANER ENERGY</Text>
              <Text style={styles.coverMainTitle}>
                ROOFTOP SOLAR PV{'\n'}
                <Text style={{ color: '#38bdf8' }}>TURNKEY ENGINEERING PROPOSAL</Text>
              </Text>

              <View style={styles.capacityBadgeBox}>
                <View style={styles.capacityIconCircle}>
                  <Zap size={22} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.capacityKwText}>
                    {cap} <Text style={{ fontSize: 13, color: '#94a3b8' }}>kWp</Text>
                  </Text>
                  <Text style={styles.capacitySubText}>
                    {data.systemType || 'On-Grid'} Solar System • {data.connectionType || 'Residential'} Profile
                  </Text>
                </View>
              </View>

              <View style={styles.coverClientCard}>
                <Text style={styles.coverCardHeaderLabel}>PREPARED EXCLUSIVELY FOR</Text>
                <Text style={styles.coverClientName}>{data.customerName}</Text>
                <Text style={styles.coverClientAddress}>
                  📍 {data.customerAddress}
                  {'\n'}📞 Phone: {data.customerPhone}
                  {data.consumerNumber ? `\n🏛️ DISCOM A/C: ${data.consumerNumber} (${data.discomName || 'DISCOM'})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.coverFooterRow}>
              <View>
                <Text style={styles.coverFooterLabel}>PROPOSAL NO.</Text>
                <Text style={styles.coverFooterVal}>{data.quotationNumber}</Text>
              </View>
              <View>
                <Text style={styles.coverFooterLabel}>ISSUED DATE</Text>
                <Text style={styles.coverFooterVal}>{data.quotationDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.coverFooterLabel}>VALID TILL</Text>
                <Text style={[styles.coverFooterVal, { color: '#4ade80' }]}>{data.validUntil}</Text>
              </View>
            </View>

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Section 01: Executive Cover Page ──</Text>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* PAGE 2: CUSTOMER REQUIREMENTS & SITE AUDIT (IF NOT QUICK QUOTE) */}
          {/* ========================================================================= */}
          {!isQuickQuote && (
            <View style={[styles.pageSheet, { marginTop: 14 }]}>
              <View style={styles.docHeader}>
                <View>
                  <Text style={styles.sheetSectionTag}>[SECTION 02]</Text>
                  <Text style={styles.brandTitle}>Customer Requirements & Energy Audit</Text>
                </View>
                <Text style={styles.companyMetaText}>Quote: {data.quotationNumber}</Text>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiNum}>₹{currentBill}</Text>
                  <Text style={styles.kpiLabel}>Current Bill/Mo</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiNum}>{data.monthlyGenerationUnits || Math.round(cap * 120)}</Text>
                  <Text style={styles.kpiLabel}>Monthly Units</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiNum}>₹{data.tariffRate || (isCommercial ? 10.5 : 8.5)}/u</Text>
                  <Text style={styles.kpiLabel}>Tariff Slab</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={[styles.kpiNum, { color: '#0284c7' }]}>
                    {data.roofAreaSqFt || Math.round(cap * 65)} sq.ft
                  </Text>
                  <Text style={styles.kpiLabel}>Roof Surface</Text>
                </View>
              </View>

              <View style={styles.tableContainer}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { flex: 1.5 }]}>Audit Parameter</Text>
                  <Text style={[styles.thCell, { flex: 1.5 }]}>Consumer Site Record</Text>
                  <Text style={[styles.thCell, { flex: 1.5 }]}>Verification Status</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Consumer Name</Text>
                  <Text style={[styles.tdCell, { flex: 1.5 }]}>{data.customerName}</Text>
                  <Text style={[styles.tdCell, { flex: 1.5, color: '#15803d', fontWeight: '700' }]}>Verified</Text>
                </View>

                <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                  <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>DISCOM & BU</Text>
                  <Text style={[styles.tdCell, { flex: 1.5 }]}>{data.discomName || 'MSEDCL'} (BU: {data.billingUnit || '4100'})</Text>
                  <Text style={[styles.tdCell, { flex: 1.5, color: '#15803d', fontWeight: '700' }]}>Net-Meter Eligible</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Consumer Number</Text>
                  <Text style={[styles.tdCell, { flex: 1.5, fontStyle: 'italic', fontWeight: '700', color: '#0284c7' }]}>
                    {data.consumerNumber || 'To be updated'}
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1.5 }]}>PM Surya Ghar Mapped</Text>
                </View>

                <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                  <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Sanctioned Load</Text>
                  <Text style={[styles.tdCell, { flex: 1.5 }]}>{data.sanctionedLoad || cap} kW ({data.phase || '1-Phase'})</Text>
                  <Text style={[styles.tdCell, { flex: 1.5 }]}>Feasible for grid tie</Text>
                </View>
              </View>

              <View style={styles.pageBreakMarker}>
                <Text style={styles.pageBreakText}>── Section 02: Baseline & Energy Audit ──</Text>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* PAGE 3: RECOMMENDED SOLAR SYSTEM ARCHITECTURE */}
          {/* ========================================================================= */}
          <View style={[styles.pageSheet, { marginTop: 14 }]}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.sheetSectionTag}>[SECTION 03]</Text>
                <Text style={styles.brandTitle}>Recommended Solar System Architecture</Text>
              </View>
              <Text style={styles.companyMetaText}>{cap} kWp {data.systemType || 'On-Grid'}</Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Text style={[styles.kpiNum, { color: '#1d4ed8' }]}>{cap} kWp</Text>
                <Text style={[styles.kpiLabel, { color: '#1d4ed8' }]}>DC Capacity</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNum}>{invCap} kW</Text>
                <Text style={styles.kpiLabel}>AC Inverter</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={[styles.kpiNum, { color: '#15803d' }]}>~{formatInr(annualUnits)}</Text>
                <Text style={[styles.kpiLabel, { color: '#15803d' }]}>Annual Yield</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNum}>25 Yrs</Text>
                <Text style={styles.kpiLabel}>Linear Shield</Text>
              </View>
            </View>

            {/* HARDWARE TABLE */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.2 }]}>Component</Text>
                <Text style={[styles.thCell, { flex: 1.4 }]}>Brand / Make</Text>
                <Text style={[styles.thCell, { flex: 1.8 }]}>Specification</Text>
                <Text style={[styles.thCell, { flex: 1 }]}>Warranty</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700' }]}>PV Modules</Text>
                <Text style={[styles.tdCell, { flex: 1.4 }]}>{data.panelBrand || 'Waaree 540W Mono PERC'}</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>
                  {data.panelQuantity || Math.ceil((cap * 1000) / (data.panelWattage || 540))} Modules ({data.panelWattage || 540}Wp Half-Cut)
                </Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#15803d', fontWeight: '700' }]}>25 Years</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700' }]}>Solar Inverter</Text>
                <Text style={[styles.tdCell, { flex: 1.4 }]}>{data.inverterBrand || 'Growatt / Solis'}</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>{invCap} kW Grid-Tied Dual MPPT IP65 Wi-Fi</Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#15803d', fontWeight: '700' }]}>10 Years</Text>
              </View>

              {isHybrid && (
                <View style={[styles.tableRow, { backgroundColor: '#fffbeb' }]}>
                  <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700', color: '#b45309' }]}>Battery Storage</Text>
                  <Text style={[styles.tdCell, { flex: 1.4, color: '#78350f' }]}>{data.batteryBrand || 'Tata Power LiFePO4'}</Text>
                  <Text style={[styles.tdCell, { flex: 1.8, color: '#78350f' }]}>
                    {data.batteryCapacity || 5} kWh Storage ({data.backupLoadWatts || 3000}W Backup)
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1, color: '#b45309', fontWeight: '700' }]}>10 Years</Text>
                </View>
              )}

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700' }]}>Mounting Structure</Text>
                <Text style={[styles.tdCell, { flex: 1.4 }]}>{data.structureBrand || 'Galvanized HDG High Rise'}</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>Hot-Dip Galvanized 80µm (150 km/h wind rated)</Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#15803d', fontWeight: '700' }]}>10 Years</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700' }]}>Cabling & BOS</Text>
                <Text style={[styles.tdCell, { flex: 1.4 }]}>Polycab / Schneider</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>4 sq.mm UV XLPE DC Cables + ACDB/DCDB SPDs</Text>
                <Text style={[styles.tdCell, { flex: 1 }]}>OEM Terms</Text>
              </View>
            </View>

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Section 03: System Specifications ──</Text>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* PAGE 4: SAVINGS ANALYSIS & FINANCIAL ROI */}
          {/* ========================================================================= */}
          <View style={[styles.pageSheet, { marginTop: 14 }]}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.sheetSectionTag}>[SECTION 04]</Text>
                <Text style={styles.brandTitle}>Solar Generation & Financial Economics</Text>
              </View>
              <Text style={styles.companyMetaText}>Payback: {data.paybackYears} Yrs</Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={[styles.kpiNum, { color: '#15803d' }]}>₹{formatInr(annualSavings)}</Text>
                <Text style={[styles.kpiLabel, { color: '#15803d' }]}>Year 1 Savings</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Text style={[styles.kpiNum, { color: '#1d4ed8' }]}>{data.paybackYears} Yrs</Text>
                <Text style={[styles.kpiLabel, { color: '#1d4ed8' }]}>Est. Payback</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNum}>₹{lifetimeSavings}</Text>
                <Text style={styles.kpiLabel}>25-Yr Savings</Text>
              </View>
            </View>

            {/* 25-YEAR CASH FLOW PREVIEW */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.2 }]}>Milestone</Text>
                <Text style={[styles.thCell, { flex: 1.3 }]}>Generation</Text>
                <Text style={[styles.thCell, { flex: 1.2 }]}>Savings/Yr</Text>
                <Text style={[styles.thCell, { flex: 1.5 }]}>Cumulative Return</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700' }]}>Year 1</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>{formatInr(annualUnits)} kWh</Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: '#15803d', fontWeight: '700' }]}>₹{formatInr(annualSavings)}</Text>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '800' }]}>₹{formatInr(annualSavings)}</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700', color: '#15803d' }]}>Year 5 (Payback)</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>{formatInr(annualUnits * 0.96)} kWh</Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: '#15803d', fontWeight: '700' }]}>₹{formatInr(annualSavings * 1.08)}</Text>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '800', color: '#15803d' }]}>₹{formatInr(annualSavings * 5.3)}</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700', color: '#1e40af' }]}>Year 25 (Life End)</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>{formatInr(annualUnits * 0.84)} kWh</Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: '#15803d', fontWeight: '700' }]}>₹{formatInr(annualSavings * 1.71)}</Text>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '900', color: '#1e40af' }]}>₹{lifetimeSavings}</Text>
              </View>
            </View>

            {/* PM SURYA GHAR SUBSIDY CALLOUT */}
            {data.subsidyAmount > 0 && !isCommercial && (
              <View style={styles.subsidyCalloutBox}>
                <Text style={styles.subsidyCalloutTitle}>
                  🏛️ PM Surya Ghar Muft Bijli Yojana Central Subsidy: -₹{subsidy}
                </Text>
                <Text style={styles.subsidyCalloutText}>
                  Direct Benefit Transfer (DBT): Credited directly by MNRE into consumer bank account post-commissioning.
                </Text>
              </View>
            )}

            {isCommercial && (
              <View style={[styles.subsidyCalloutBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Text style={[styles.subsidyCalloutTitle, { color: '#1e40af' }]}>
                  🏢 Commercial Section 32 Accelerated Depreciation Tax Benefit
                </Text>
                <Text style={[styles.subsidyCalloutText, { color: '#2563eb' }]}>
                  40% Accelerated Depreciation claimable in Year 1 on solar rooftop capital investments.
                </Text>
              </View>
            )}

            <View style={styles.loanCalloutBox}>
              <Text style={styles.loanCalloutTitle}>
                💳 5-Year Solar Loan EMI: ₹{approxMonthlyEmi.toLocaleString('en-IN')}/mo vs Savings: ₹{monthlySavings}/mo
              </Text>
              <Text style={styles.loanCalloutText}>
                💡 Customer gains net surplus ₹{Math.max(0, data.monthlySavings - approxMonthlyEmi).toLocaleString('en-IN')}/month in hand from Month 1!
              </Text>
            </View>

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Section 04: Financial ROI & Economics ──</Text>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* PAGE 5: DETAILED COMMERCIAL QUOTATION & BOQ */}
          {/* ========================================================================= */}
          <View style={[styles.pageSheet, { marginTop: 14 }]}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.sheetSectionTag}>[SECTION 05]</Text>
                <Text style={styles.brandTitle}>Commercial Quotation & Bill of Quantities</Text>
              </View>
              <Text style={styles.companyMetaText}>Total: ₹{gross}</Text>
            </View>

            {/* COMMERCIAL SUMMARY CARD */}
            <View style={styles.pricingCard}>
              <View style={styles.pricingCardHeader}>
                <Text style={styles.pricingCardTitle}>Commercial Pricing Summary</Text>
                <View style={styles.gstTag}>
                  <Text style={styles.gstTagText}>GST Included</Text>
                </View>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Solar PV Power Plant ({cap} kWp - All GST Included)</Text>
                <Text style={styles.pricingVal}>₹{gross}</Text>
              </View>

              {data.discount ? (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Special Promotional Discount</Text>
                  <Text style={[styles.pricingVal, { color: '#fbbf24' }]}>-₹{formatInr(data.discount)}</Text>
                </View>
              ) : null}

              <View style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, { color: '#4ade80', fontWeight: '700' }]}>
                  Govt Central Subsidy (PM Surya Ghar Direct DBT)
                </Text>
                <Text style={[styles.pricingVal, { color: '#4ade80', fontWeight: '800' }]}>
                  -₹{subsidy}
                </Text>
              </View>

              <View style={styles.pricingTotalRow}>
                <View>
                  <Text style={styles.totalLabel}>Net Customer Investment</Text>
                  <Text style={styles.totalSubtitle}>After direct subsidy credit into consumer bank account</Text>
                </View>
                <Text style={styles.netCostVal}>₹{net}</Text>
              </View>
            </View>

            {/* MILESTONE SCHEDULE */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitleText}>Milestone Payment Schedule</Text>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.5 }]}>Milestone</Text>
                <Text style={[styles.thCell, { flex: 0.8 }]}>%</Text>
                <Text style={[styles.thCell, { flex: 1.3 }]}>Amount (All GST)</Text>
                <Text style={[styles.thCell, { flex: 2 }]}>Trigger</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Token Advance</Text>
                <Text style={[styles.tdCell, { flex: 0.8 }]}>20%</Text>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>₹{formatInr(data.grossAmount * 0.2)}</Text>
                <Text style={[styles.tdCell, { flex: 2, fontSize: 10 }]}>Proposal sign-off & portal booking</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Material Dispatch</Text>
                <Text style={[styles.tdCell, { flex: 0.8 }]}>60%</Text>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>₹{formatInr(data.grossAmount * 0.6)}</Text>
                <Text style={[styles.tdCell, { flex: 2, fontSize: 10 }]}>Panels, inverter & structure delivery</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Commissioning</Text>
                <Text style={[styles.tdCell, { flex: 0.8 }]}>20%</Text>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>₹{formatInr(data.grossAmount * 0.2)}</Text>
                <Text style={[styles.tdCell, { flex: 2, fontSize: 10 }]}>Net-meter sync & handover</Text>
              </View>
            </View>

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Section 05: Commercial Quotation ──</Text>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* PAGE 6: SCOPE OF WORK (IF NOT QUICK QUOTE) */}
          {/* ========================================================================= */}
          {!isQuickQuote && (
            <View style={[styles.pageSheet, { marginTop: 14 }]}>
              <View style={styles.docHeader}>
                <View>
                  <Text style={styles.sheetSectionTag}>[SECTION 06]</Text>
                  <Text style={styles.brandTitle}>Scope of Work & Turnkey Boundaries</Text>
                </View>
                <Text style={styles.companyMetaText}>Turnkey EPC</Text>
              </View>

              <View style={styles.scopeList}>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>1. Site Feasibility & Shadow Analysis Survey</Text>
                  <View style={styles.badgeIncluded}><Text style={styles.badgeIncludedText}>INCLUDED</Text></View>
                </View>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>2. Supply of Tier-1 Solar PV Modules ({data.panelBrand || 'Waaree'})</Text>
                  <View style={styles.badgeIncluded}><Text style={styles.badgeIncludedText}>INCLUDED</Text></View>
                </View>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>3. Supply of Grid-Tied Inverter ({data.inverterBrand || 'Growatt'})</Text>
                  <View style={styles.badgeIncluded}><Text style={styles.badgeIncludedText}>INCLUDED</Text></View>
                </View>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>4. Galvanized Mounting Structure with SS Fasteners</Text>
                  <View style={styles.badgeIncluded}><Text style={styles.badgeIncludedText}>INCLUDED</Text></View>
                </View>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>5. Dual Chemical Earthing Kit & Lightning Arrestor</Text>
                  <View style={styles.badgeIncluded}><Text style={styles.badgeIncludedText}>INCLUDED</Text></View>
                </View>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>6. DISCOM Net-Metering Liasoning & Inspection</Text>
                  <View style={styles.badgeIncluded}><Text style={styles.badgeIncludedText}>INCLUDED</Text></View>
                </View>
                <View style={styles.scopeRow}>
                  <Text style={styles.scopeItemText}>7. Civil Structural Roof Alterations or Waterproofing</Text>
                  <View style={styles.badgeExcluded}><Text style={styles.badgeExcludedText}>EXCLUDED</Text></View>
                </View>
              </View>

              <View style={styles.pageBreakMarker}>
                <Text style={styles.pageBreakText}>── Section 06: Scope of Work ──</Text>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* PAGE 7: WARRANTIES & COMMERCIAL TERMS */}
          {/* ========================================================================= */}
          <View style={[styles.pageSheet, { marginTop: 14 }]}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.sheetSectionTag}>[SECTION 07]</Text>
                <Text style={styles.brandTitle}>Warranty Guarantees & Terms</Text>
              </View>
              <Text style={styles.companyMetaText}>OEM Backed</Text>
            </View>

            <View style={styles.grid2Col}>
              <View style={styles.warrantyBox}>
                <Text style={styles.warrantyBoxLabel}>SOLAR PV MODULES</Text>
                <Text style={styles.warrantyBoxVal}>{data.warranties?.modules || data.panelWarranty || '25 Years Performance'}</Text>
              </View>
              <View style={styles.warrantyBox}>
                <Text style={styles.warrantyBoxLabel}>GRID INVERTER</Text>
                <Text style={styles.warrantyBoxVal}>{data.warranties?.inverter || data.inverterWarranty || '10 Years Replacement'}</Text>
              </View>
              <View style={styles.warrantyBox}>
                <Text style={styles.warrantyBoxLabel}>MOUNTING STRUCTURE</Text>
                <Text style={styles.warrantyBoxVal}>{data.warranties?.structure || data.structureWarranty || '10 Years Structural'}</Text>
              </View>
              <View style={styles.warrantyBox}>
                <Text style={styles.warrantyBoxLabel}>WORKMANSHIP</Text>
                <Text style={styles.warrantyBoxVal}>5 Years Integrity Guarantee</Text>
              </View>
            </View>

            {/* BANK DETAILS CARD */}
            {data.bankDetails && (
              <View style={styles.bankCard}>
                <Text style={styles.bankCardTitle}>Official Bank Account for Token Booking</Text>
                <Text style={styles.bankCardText}>
                  Beneficiary: <Text style={{ fontWeight: '800' }}>{data.bankDetails.accountName}</Text>
                  {'\n'}Bank: {data.bankDetails.bankName} • A/C No: <Text style={{ fontWeight: '800' }}>{data.bankDetails.accountNumber}</Text>
                  {'\n'}IFSC: <Text style={{ fontWeight: '800' }}>{data.bankDetails.ifsc}</Text>
                  {data.bankDetails.upiId ? ` • UPI ID: ${data.bankDetails.upiId}` : ''}
                </Text>
              </View>
            )}

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Section 07: Warranties & Commercial Terms ──</Text>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* PAGE 8: ACCEPTANCE & WORK ORDER CONFIRMATION */}
          {/* ========================================================================= */}
          <View style={[styles.pageSheet, { marginTop: 14 }]}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.sheetSectionTag}>[SECTION 08]</Text>
                <Text style={styles.brandTitle}>Acceptance & Work Order Confirmation</Text>
              </View>
              <Text style={styles.companyMetaText}>Sign-off</Text>
            </View>

            <View style={styles.acceptanceBox}>
              <Text style={styles.acceptanceText}>
                I/We, <Text style={{ fontWeight: '800' }}>{data.customerName}</Text>, hereby accept Quotation{' '}
                <Text style={{ fontWeight: '800' }}>#{data.quotationNumber}</Text> for the installation of a{' '}
                <Text style={{ fontWeight: '800' }}>{cap} kWp {data.systemType || 'On-Grid'} Solar Plant</Text> for{' '}
                <Text style={{ fontWeight: '800', color: '#0284c7' }}>₹{gross}</Text>.
              </Text>
            </View>

            <View style={styles.dualSignRow}>
              <View style={styles.signBoxCustomer}>
                <Text style={styles.signBoxLabel}>CUSTOMER SIGNATURE</Text>
                <View style={styles.signLine} />
                <Text style={styles.signSubText}>{data.customerName}</Text>
                <Text style={styles.signDateText}>Date: ____ / ____ / 2026</Text>
              </View>

              <View style={styles.signBoxEpc}>
                <Text style={styles.signBoxLabel}>FOR {data.companyName.toUpperCase()}</Text>
                <View style={styles.signLine} />
                <Text style={styles.signSubText}>{data.signatoryName || 'Authorized Signatory'}</Text>
                <Text style={styles.signDateText}>{data.quotationDate}</Text>
              </View>
            </View>

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Section 08: Work Order Authorization ──</Text>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <View style={styles.actionRowMain}>
            {/* 1. SHARE PDF DIRECTLY ON WHATSAPP */}
            <TouchableOpacity
              style={styles.whatsAppPdfBtn}
              onPress={handleSharePdfToWhatsApp}
              disabled={sharingPdfWa}
              activeOpacity={0.85}
            >
              {sharingPdfWa ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MessageCircle size={18} color="#ffffff" />
                  <Text style={styles.whatsAppPdfBtnText}>WhatsApp PDF</Text>
                </>
              )}
            </TouchableOpacity>

            {/* 2. SEND WHATSAPP TEXT PITCH */}
            <TouchableOpacity
              style={styles.whatsAppTextBtn}
              onPress={handleSendWhatsAppPitch}
              disabled={sendingTextWa}
              activeOpacity={0.85}
            >
              {sendingTextWa ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <>
                  <Send size={16} color="#16a34a" />
                  <Text style={styles.whatsAppTextBtnText}>Direct Chat</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.actionRowSecondary}>
            {/* 3. SHARE / EXPORT PDF FILE */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleSharePdfFile}
              disabled={sharingPdf}
              activeOpacity={0.8}
            >
              {sharingPdf ? (
                <ActivityIndicator size="small" color="#334155" />
              ) : (
                <>
                  <Share2 size={15} color="#334155" />
                  <Text style={styles.secondaryBtnText}>Share PDF File</Text>
                </>
              )}
            </TouchableOpacity>

            {/* 4. PRINT / HIGH-RES PDF VIEWER */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handlePrint}
              disabled={printing}
              activeOpacity={0.8}
            >
              {printing ? (
                <ActivityIndicator size="small" color="#334155" />
              ) : (
                <>
                  <Printer size={15} color="#334155" />
                  <Text style={styles.secondaryBtnText}>Native A4 PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  syncedPill: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  topHeaderSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  previewA4Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewA4BtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docScroll: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  docContent: {
    padding: 14,
    paddingBottom: 24,
  },
  pageSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  pageSheetDark: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  coverTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 12,
  },
  brandTitleDark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  brandSubtitleDark: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  epcProposalBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  epcProposalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
  },
  coverHeroBody: {
    paddingVertical: 20,
  },
  coverJourneyTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  coverMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 26,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  capacityBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  capacityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityKwText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38bdf8',
  },
  capacitySubText: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 1,
  },
  coverClientCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 12,
  },
  coverCardHeaderLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coverClientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 2,
  },
  coverClientAddress: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
  },
  coverFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  coverFooterLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  coverFooterVal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 1,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  sheetSectionTag: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  heroBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 1,
  },
  companyMetaText: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thCell: {
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tdCell: {
    fontSize: 9,
    color: '#1e293b',
  },
  subsidyCalloutBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  subsidyCalloutTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 2,
  },
  subsidyCalloutText: {
    fontSize: 9,
    color: '#166534',
    lineHeight: 13,
  },
  loanCalloutBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  loanCalloutTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  loanCalloutText: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  gstTag: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  gstTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4ade80',
    textTransform: 'uppercase',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  pricingLabel: {
    fontSize: 9.5,
    color: '#cbd5e1',
    flex: 1,
  },
  pricingVal: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  pricingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  totalSubtitle: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 1,
  },
  netCostVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38bdf8',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  sectionBar: {
    width: 3.5,
    height: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  sectionTitleText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  scopeList: {
    gap: 6,
    marginBottom: 10,
  },
  scopeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
  },
  scopeItemText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  badgeIncluded: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeIncludedText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#15803d',
  },
  badgeExcluded: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeExcludedText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#be123c',
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  warrantyBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
  },
  warrantyBoxLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748b',
  },
  warrantyBoxVal: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  bankCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  bankCardTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  bankCardText: {
    fontSize: 8.5,
    color: '#334155',
    lineHeight: 13,
  },
  acceptanceBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  acceptanceText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 14,
  },
  dualSignRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  signBoxCustomer: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    height: 100,
    justifyContent: 'space-between',
  },
  signBoxEpc: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    height: 100,
    justifyContent: 'space-between',
  },
  signBoxLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748b',
  },
  signLine: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  signSubText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  signDateText: {
    fontSize: 7.5,
    color: '#94a3b8',
  },
  pageBreakMarker: {
    alignItems: 'center',
    marginVertical: 6,
  },
  pageBreakText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  actionRowMain: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsAppPdfBtn: {
    flex: 2,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsAppPdfBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  whatsAppTextBtn: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  whatsAppTextBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  actionRowSecondary: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
});
