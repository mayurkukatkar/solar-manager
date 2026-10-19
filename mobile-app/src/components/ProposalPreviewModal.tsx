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
} from 'lucide-react-native';
import {
  QuotationPdfProps,
  generateQuotationHtml,
  sharePdfFile,
  printDirectly,
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

  const formatInr = (n: number) => Math.round(n || 0).toLocaleString('en-IN');
  const gross = formatInr(data.grossAmount);
  const subsidy = formatInr(data.subsidyAmount);
  const net = formatInr(data.netPayable);
  const monthlySavings = formatInr(data.monthlySavings);
  const lifetimeSavings = formatInr(data.lifetimeSavings);
  const currentBill = formatInr(data.currentMonthlyBill);
  const newBill = formatInr(data.estimatedMonthlyBill);
  const approxMonthlyEmi = Math.round(data.netPayable * 0.0205);

  const handleSharePdfToWhatsApp = async () => {
    setSharingPdfWa(true);
    try {
      const html = generateQuotationHtml(data);
      const fileName = `Solar_Proposal_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await sharePdfFile(html, fileName);
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
      await sharePdfFile(html, fileName);
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
              {data.quotationNumber} • Prepared for {data.customerName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* VISUAL DOCUMENT VIEWER BODY */}
        <ScrollView style={styles.docScroll} contentContainerStyle={styles.docContent} showsVerticalScrollIndicator={false}>
          {/* PAGE 1: EXECUTIVE PROPOSAL SUMMARY */}
          <View style={styles.pageSheet}>
            {/* BRAND HEADER */}
            <View style={styles.docHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>PM Surya Ghar Certified Solution</Text>
                </View>
                <Text style={styles.brandTitle}>{data.companyName}</Text>
                <Text style={styles.brandSubtitle}>Smart Solar Engineering & Clean Energy Partner</Text>
              </View>
              <View style={styles.companyMeta}>
                <Text style={styles.companyMetaText}>{data.companyAddress}</Text>
                <Text style={styles.companyMetaText}>📞 {data.companyPhone}</Text>
                <Text style={styles.companyMetaText}>✉️ {data.companyEmail}</Text>
              </View>
            </View>

            {/* QUOTE & CLIENT META BAR */}
            <View style={styles.quoteMetaBar}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.metaLabel}>PROPOSAL PREPARED FOR</Text>
                <Text style={styles.metaCustomerName}>{data.customerName}</Text>
                <Text style={styles.metaDetailText}>
                  {data.customerAddress}
                  {data.customerPhone ? ` • 📞 ${data.customerPhone}` : ''}
                  {data.consumerNumber ? `\nConsumer No: ${data.consumerNumber} (${data.discomName || 'DISCOM'})` : ''}
                </Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>QUOTE NUMBER</Text>
                <Text style={styles.metaQuoteNum}>{data.quotationNumber}</Text>
                <Text style={styles.metaDetailText}>Date: {data.quotationDate}</Text>
                <Text style={styles.metaDetailText}>Valid Till: {data.validUntil}</Text>
              </View>
            </View>

            {/* SECTION 1: SYSTEM SIZING HERO */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitleText}>Proposed Solar System Overview</Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNum}>{data.systemCapacityKw} kWp</Text>
                <Text style={styles.kpiLabel}>Plant Capacity</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNum}>~{formatInr(data.monthlyGenerationUnits)}</Text>
                <Text style={styles.kpiLabel}>Monthly Units</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiNum, { color: '#16a34a' }]}>₹{monthlySavings}</Text>
                <Text style={styles.kpiLabel}>Bill Savings/Mo</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiNum, { color: '#0284c7' }]}>{data.paybackYears} Yrs</Text>
                <Text style={styles.kpiLabel}>Payback ROI</Text>
              </View>
            </View>

            {/* COMMERCIAL INVESTMENT CARD */}
            <View style={styles.pricingCard}>
              <View style={styles.pricingCardHeader}>
                <Text style={styles.pricingCardTitle}>Commercial Investment Summary</Text>
                <View style={styles.gstTag}>
                  <Text style={styles.gstTagText}>GST Included</Text>
                </View>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  Solar System Cost ({data.systemCapacityKw} kWp System - All GST Included)
                </Text>
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

              {/* Solar Loan Financing Callout */}
              <View style={styles.loanCallout}>
                <Text style={styles.loanCalloutText}>
                  💳 5-Yr Solar Loan EMI: <Text style={styles.boldWhite}>₹{approxMonthlyEmi.toLocaleString('en-IN')}/mo</Text> vs Monthly Bill Savings: <Text style={styles.boldGreen}>₹{monthlySavings}/mo</Text>
                </Text>
                <Text style={styles.loanCalloutSub}>
                  💡 Customer saves net <Text style={styles.boldGreen}>₹{Math.max(0, data.monthlySavings - approxMonthlyEmi).toLocaleString('en-IN')}/month</Text> in hand from Month 1!
                </Text>
              </View>
            </View>

            {/* BILL IMPACT COMPARISON TABLE */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitleText}>Bill Impact Comparison</Text>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.4 }]}>Metric</Text>
                <Text style={[styles.thCell, { flex: 1 }]}>Before Solar</Text>
                <Text style={[styles.thCell, { flex: 1 }]}>With Solar</Text>
                <Text style={[styles.thCell, { flex: 1.2 }]}>Monthly Advantage</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.4, fontWeight: '700' }]}>Monthly Bill</Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#ef4444', fontWeight: '700' }]}>₹{currentBill}</Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#10b981', fontWeight: '700' }]}>₹{newBill}</Text>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.saveBadgeText}>Save ₹{monthlySavings}/mo</Text>
                </View>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.4, fontWeight: '700' }]}>25-Yr Savings</Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#64748b' }]}>₹0</Text>
                <Text style={[styles.tdCell, { flex: 1, color: '#0284c7', fontWeight: '800' }]}>₹{lifetimeSavings}</Text>
                <Text style={[styles.tdCell, { flex: 1.2, fontSize: 10, color: '#166534' }]}>
                  🌳 {data.treeEquivalent} trees planted
                </Text>
              </View>
            </View>

            <View style={styles.pageBreakMarker}>
              <Text style={styles.pageBreakText}>── Page 1 of 2: Executive Financial Summary ──</Text>
            </View>
          </View>

          {/* PAGE 2: TECHNICAL SPECIFICATIONS & MILESTONES */}
          <View style={[styles.pageSheet, { marginTop: 14 }]}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.brandTitle}>{data.companyName}</Text>
                <Text style={styles.brandSubtitle}>Technical Bill of Materials & Turnkey Milestone Schedule</Text>
              </View>
              <Text style={styles.companyMetaText}>Quote: {data.quotationNumber}</Text>
            </View>

            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitleText}>Tier-1 High Efficiency Bill of Materials</Text>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.3 }]}>Component</Text>
                <Text style={[styles.thCell, { flex: 1.3 }]}>Brand / Make</Text>
                <Text style={[styles.thCell, { flex: 1.8 }]}>Specification</Text>
                <Text style={[styles.thCell, { flex: 1.2 }]}>Warranty</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>PV Modules</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>{data.panelBrand || 'Waaree (DCR)'}</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>{data.panelWattage || 540}W Mono Half-Cut Bifacial</Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: '#15803d', fontWeight: '700' }]}>25 Years</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>Solar Inverter</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>{data.inverterBrand || 'Solis / Growatt'}</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>{data.systemCapacityKw} kW Grid-Tied Wi-Fi</Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: '#15803d', fontWeight: '700' }]}>10 Years</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>Structure</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>Heavy Duty GI</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>{data.structureType || 'Elevated HDG Structure'}</Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: '#15803d', fontWeight: '700' }]}>10 Years</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>ACDB & DCDB</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>Schneider / L&T</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>Dual DB with Type-II Surge Protection</Text>
                <Text style={[styles.tdCell, { flex: 1.2 }]}>1 Year</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>Cables</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>Polycab / Havells</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>4 sqmm Solar DC + Armoured AC</Text>
                <Text style={[styles.tdCell, { flex: 1.2 }]}>OEM Terms</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>Earthing & LA</Text>
                <Text style={[styles.tdCell, { flex: 1.3 }]}>Chemical Kits</Text>
                <Text style={[styles.tdCell, { flex: 1.8 }]}>3 Earthing Pits + Lightning Arrestor</Text>
                <Text style={[styles.tdCell, { flex: 1.2 }]}>IS Compliant</Text>
              </View>
            </View>

            {/* MILESTONE PAYMENT SCHEDULE */}
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
                <Text style={[styles.tdCell, { flex: 2, fontSize: 10 }]}>Upon proposal sign-off & portal booking</Text>
              </View>

              <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Material Dispatch</Text>
                <Text style={[styles.tdCell, { flex: 0.8 }]}>60%</Text>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>₹{formatInr(data.grossAmount * 0.6)}</Text>
                <Text style={[styles.tdCell, { flex: 2, fontSize: 10 }]}>Upon delivery of panels & inverter to site</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700' }]}>Commissioning</Text>
                <Text style={[styles.tdCell, { flex: 0.8 }]}>20%</Text>
                <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '700' }]}>₹{formatInr(data.grossAmount * 0.2)}</Text>
                <Text style={[styles.tdCell, { flex: 2, fontSize: 10 }]}>Upon net-meter synchronization & handover</Text>
              </View>
            </View>

            {/* BANK DETAILS */}
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
              <Text style={styles.pageBreakText}>── Page 2 of 2: Technical Specifications & Bill of Materials ──</Text>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <View style={styles.actionHintRow}>
            <Text style={styles.actionHintText}>
              📲 <Text style={{ fontWeight: '700' }}>Direct Chat</Text> auto-opens customer chat | 📎 <Text style={{ fontWeight: '700' }}>WhatsApp PDF</Text> attaches document
            </Text>
          </View>
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

            {/* 4. PRINT DOCUMENT */}
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
                  <Text style={styles.secondaryBtnText}>Print</Text>
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
    fontSize: 18,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  topHeaderSubtitle: {
    fontSize: 11,
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
  docScroll: {
    flex: 1,
    backgroundColor: '#334155',
  },
  docContent: {
    padding: 14,
    paddingBottom: 24,
  },
  pageSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  companyMeta: {
    alignItems: 'flex-end',
  },
  companyMetaText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 14,
  },
  quoteMetaBar: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaCustomerName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  metaQuoteNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 2,
  },
  metaDetailText: {
    fontSize: 9,
    color: '#475569',
    marginTop: 1,
    lineHeight: 13,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  sectionBar: {
    width: 4,
    height: 14,
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
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
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingCardTitle: {
    fontSize: 12,
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
    fontSize: 9,
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
    fontSize: 10.5,
    color: '#cbd5e1',
    flex: 1,
  },
  pricingVal: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  totalSubtitle: {
    fontSize: 8.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  netCostVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38bdf8',
  },
  loanCallout: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  loanCalloutText: {
    fontSize: 9.5,
    color: '#cbd5e1',
  },
  boldWhite: {
    fontWeight: '800',
    color: '#ffffff',
  },
  boldGreen: {
    fontWeight: '800',
    color: '#4ade80',
  },
  loanCalloutSub: {
    fontSize: 9,
    color: '#94a3b8',
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
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  thCell: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tdCell: {
    fontSize: 9.5,
    color: '#1e293b',
  },
  saveBadgeText: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: 8.5,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  bankCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  bankCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bankCardText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 14,
  },
  pageBreakMarker: {
    alignItems: 'center',
    marginVertical: 8,
  },
  pageBreakText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});
