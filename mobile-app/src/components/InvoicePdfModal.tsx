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
  Platform,
} from 'react-native';
import {
  X,
  Printer,
  Share2,
  MessageCircle,
  FileText,
  Receipt,
  CheckCircle2,
  Building,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { ModalHeader } from './Header';
import {
  InvoicePdfProps,
  generateInvoiceHtml,
  sharePdfFile,
  printDirectly,
} from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

export interface InvoicePdfModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: any | null;
  tenant?: any;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  visible,
  onClose,
  invoice,
  tenant,
}) => {
  const { user } = useAuth();
  const [sharingPdf, setSharingPdf] = useState(false);
  const [sharingWa, setSharingWa] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!invoice) return null;

  const totalPaid = invoice.totalPaid ?? (invoice.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const balance = invoice.balance ?? Math.max(0, (invoice.amount || 0) - totalPaid);
  const isPaid = (invoice.computedStatus || invoice.status) === 'PAID';
  const isOverdue = invoice.isOverdue || (invoice.dueDate && new Date(invoice.dueDate) < new Date() && !isPaid);

  // Map to InvoicePdfProps
  const invoicePdfData: InvoicePdfProps = {
    invoiceNumber: invoice.invoiceNumber || 'INV-2026',
    invoiceDate: invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    milestoneTitle: invoice.milestoneTitle || invoice.milestone || 'Stage Milestone',
    milestoneKey: invoice.milestone,

    companyName: tenant?.name || user?.tenantName || 'Solar Solutions Pvt Ltd',
    companyAddress: tenant?.address || 'Corporate Office, Solar EPC Center, Maharashtra',
    companyPhone: tenant?.phone || '+91 98812 55560',
    companyEmail: tenant?.email || 'billing@wherereadysolar.com',
    companyGstin: tenant?.gstin || '27AABCS1429B1Z5',
    companyPan: tenant?.pan || 'AABCS1429B',

    customerName: invoice.customer?.name || invoice.project?.name || 'Customer Account',
    customerPhone: invoice.customer?.mobile || invoice.customer?.phone || '',
    customerEmail: invoice.customer?.email,
    customerAddress: invoice.customer?.address || invoice.project?.address || 'Site Address, Maharashtra',
    consumerNumber: invoice.customer?.consumerNumber || invoice.project?.consumerNumber,
    discomName: invoice.customer?.discomName || invoice.project?.discomName || 'MSEDCL (Mahavitaran)',

    projectName: invoice.project?.name,
    projectCapacityKw: invoice.project?.capacity || 3.3,
    systemType: invoice.project?.systemType || 'Grid-Tied Rooftop Solar',

    subtotal: invoice.subtotal || Math.round((invoice.amount || 0) / 1.138),
    taxRate: invoice.taxRate || 13.8,
    taxAmount: invoice.taxAmount || Math.round((invoice.amount || 0) - (invoice.amount || 0) / 1.138),
    subsidyDeduction: invoice.subsidyDeduction || 0,
    grossTotal: invoice.amount || 0,
    totalPaid,
    balanceDue: balance,
    status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',

    items: invoice.items && invoice.items.length > 0 ? invoice.items : undefined,
    payments: invoice.payments && invoice.payments.length > 0 ? invoice.payments : undefined,

    bankDetails: {
      accountName: tenant?.name || user?.tenantName || 'Solar Solutions Pvt Ltd',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200088992211',
      ifsc: 'HDFC0001234',
      upiId: 'solar@hdfcbank',
      branch: 'Shivajinagar, Pune',
    },
    terms: invoice.terms,
    notes: invoice.notes,
  };

  const handleSharePdf = async () => {
    setSharingPdf(true);
    try {
      const html = generateInvoiceHtml(invoicePdfData);
      const fileName = `Tax_Invoice_${invoice.invoiceNumber}.pdf`;
      await sharePdfFile(html, fileName);
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Could not export PDF invoice');
    } finally {
      setSharingPdf(false);
    }
  };

  const handleShareToWhatsApp = async () => {
    setSharingWa(true);
    try {
      const html = generateInvoiceHtml(invoicePdfData);
      const fileName = `Tax_Invoice_${invoice.invoiceNumber}.pdf`;
      await sharePdfFile(html, fileName, invoicePdfData.customerPhone);
    } catch (err: any) {
      Alert.alert('WhatsApp Share Error', err.message || 'Could not share PDF invoice to WhatsApp');
    } finally {
      setSharingWa(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const html = generateInvoiceHtml(invoicePdfData);
      await printDirectly(html);
    } catch (err: any) {
      Alert.alert('Print Error', err.message || 'Could not print invoice');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* STANDARDIZED MODAL HEADER */}
        <ModalHeader
          title="Tax Invoice Generator"
          subtitle={`${invoice.invoiceNumber} • ${invoicePdfData.customerName}`}
          onClose={onClose}
        />

        {/* ACTION BUTTONS BAR */}
        <View style={styles.actionButtonsBar}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={handleSharePdf}
            disabled={sharingPdf}
            activeOpacity={0.85}
          >
            {sharingPdf ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Share2 size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnPrimaryText}>Share PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnWa}
            onPress={handleShareToWhatsApp}
            disabled={sharingWa}
            activeOpacity={0.85}
          >
            {sharingWa ? (
              <ActivityIndicator size="small" color="#15803d" />
            ) : (
              <>
                <MessageCircle size={15} color="#15803d" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnWaText}>WhatsApp PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrint}
            onPress={handlePrint}
            disabled={printing}
            activeOpacity={0.85}
          >
            {printing ? (
              <ActivityIndicator size="small" color="#475569" />
            ) : (
              <>
                <Printer size={15} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnPrintText}>Print</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* INVOICE SUMMARY PREVIEW */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* INVOICE CARD */}
          <View style={styles.invoiceDocCard}>
            <View style={styles.docHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.docCompany}>{invoicePdfData.companyName}</Text>
                <Text style={styles.docCompanySub}>GST Registered Solar EPC Turnkey Contractor</Text>
                <Text style={styles.docCompanyMeta}>
                  GSTIN: {invoicePdfData.companyGstin} | PAN: {invoicePdfData.companyPan}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View
                  style={[
                    styles.statusPill,
                    isPaid
                      ? styles.statusPillPaid
                      : isOverdue
                      ? styles.statusPillOverdue
                      : totalPaid > 0
                      ? styles.statusPillPartial
                      : styles.statusPillUnpaid,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isPaid
                        ? styles.statusPillTextPaid
                        : isOverdue
                        ? styles.statusPillTextOverdue
                        : totalPaid > 0
                        ? styles.statusPillTextPartial
                        : styles.statusPillTextUnpaid,
                    ]}
                  >
                    {isPaid ? 'PAID IN FULL' : isOverdue ? 'OVERDUE' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                  </Text>
                </View>
                <Text style={styles.docInvNum}>{invoice.invoiceNumber}</Text>
              </View>
            </View>

            {/* PARTIES ROW */}
            <View style={styles.partiesRow}>
              <View style={styles.partyBox}>
                <Text style={styles.partyBoxLabel}>BILLED TO (CUSTOMER)</Text>
                <Text style={styles.partyBoxName}>{invoicePdfData.customerName}</Text>
                <Text style={styles.partyBoxSub}>📞 {invoicePdfData.customerPhone || 'N/A'}</Text>
                <Text style={styles.partyBoxSub}>📍 {invoicePdfData.customerAddress}</Text>
              </View>
              <View style={styles.partyBox}>
                <Text style={styles.partyBoxLabel}>PIPELINE DEAL CONTEXT</Text>
                <Text style={styles.partyBoxName}>
                  {invoice.project?.name || `${invoicePdfData.customerName}'s Plant`}
                </Text>
                <Text style={styles.partyBoxSub}>⚡ Capacity: {invoicePdfData.projectCapacityKw} kWp Grid-Tied</Text>
                <Text style={styles.partyBoxSub}>🔌 Consumer No: {invoicePdfData.consumerNumber || 'N/A'}</Text>
              </View>
            </View>

            {/* INVOICE SCOPE BANNER */}
            <View style={styles.milestoneBanner}>
              <Text style={styles.milestoneBannerTitle}>
                🏷️ {invoicePdfData.milestoneTitle || 'Commercial Solar Billing Scope'}
              </Text>
              <Text style={styles.milestoneBannerSub}>
                {invoicePdfData.invoiceType === 'PROFORMA' ? 'Proforma Estimation Document for Bank Sanction & Net-Metering' : invoicePdfData.invoiceType === 'ADVANCE_RECEIPT' ? 'Advance Payment Voucher & Booking Receipt' : 'Official Commercial Tax Invoice & Equipment Supply Schedule'}
              </Text>
            </View>

            {/* FINANCIAL SUMMARY TABLE */}
            <View style={styles.finSummaryTable}>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Taxable Subtotal</Text>
                <Text style={styles.finVal}>₹{invoicePdfData.subtotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>CGST (6.9%) + SGST (6.9%)</Text>
                <Text style={styles.finVal}>₹{invoicePdfData.taxAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.finRow, styles.finRowTotal]}>
                <Text style={styles.finLabelTotal}>Invoice Total (Gross)</Text>
                <Text style={styles.finValTotal}>₹{invoicePdfData.grossTotal.toLocaleString('en-IN')}</Text>
              </View>
              {totalPaid > 0 && (
                <View style={styles.finRow}>
                  <Text style={[styles.finLabel, { color: '#059669', fontWeight: '700' }]}>
                    Paid to Date
                  </Text>
                  <Text style={[styles.finVal, { color: '#059669', fontWeight: '800' }]}>
                    -₹{totalPaid.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              <View style={[styles.finRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                <Text style={[styles.finLabel, { fontWeight: '800', color: '#0f172a' }]}>
                  Balance Due
                </Text>
                <Text style={[styles.finVal, { fontWeight: '900', color: balance > 0 ? '#d97706' : '#059669', fontSize: 16 }]}>
                  ₹{balance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* DATES & BANK INFO */}
            <View style={styles.datesBankRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>INVOICE DATE</Text>
                <Text style={styles.infoVal}>{invoicePdfData.invoiceDate}</Text>
                <Text style={[styles.infoLabel, { marginTop: 6 }]}>PAYMENT DUE DATE</Text>
                <Text style={[styles.infoVal, isOverdue && { color: '#e11d48', fontWeight: '800' }]}>
                  {invoicePdfData.dueDate}
                </Text>
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.infoLabel}>BANK REMITTANCE & UPI</Text>
                <Text style={styles.infoVal}>HDFC Bank: 50200088992211</Text>
                <Text style={styles.infoVal}>IFSC: HDFC0001234</Text>
                <Text style={[styles.infoVal, { color: '#059669', fontWeight: '700' }]}>
                  UPI: solar@hdfcbank
                </Text>
              </View>
            </View>

            {/* PM SURYA GHAR SUBSIDY NOTE */}
            <View style={styles.subsidyNoteBox}>
              <Text style={styles.subsidyNoteTitle}>🏛️ PM Surya Ghar CFA Subsidy Notice</Text>
              <Text style={styles.subsidyNoteText}>
                Govt Central Financial Assistance (up to ₹78,000) will be credited directly via DBT to consumer bank account after DISCOM net-metering synchronization.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  topBar: {
    backgroundColor: '#ffffff',
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  topBarSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  actionButtonsBar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnWa: {
    flex: 1.1,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnWaText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnPrint: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrintText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  invoiceDocCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
  },
  docCompany: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  docCompanySub: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  docCompanyMeta: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  docInvNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillPaid: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusPillOverdue: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  statusPillPartial: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statusPillUnpaid: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusPillTextPaid: {
    color: '#059669',
  },
  statusPillTextOverdue: {
    color: '#e11d48',
  },
  statusPillTextPartial: {
    color: '#2563eb',
  },
  statusPillTextUnpaid: {
    color: '#d97706',
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  partyBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  partyBoxLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partyBoxName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  partyBoxSub: {
    fontSize: 10,
    color: '#475569',
    marginTop: 1,
  },
  milestoneBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 12,
  },
  milestoneBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  milestoneBannerSub: {
    fontSize: 9.5,
    color: '#047857',
    marginTop: 1,
  },
  finSummaryTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finRowTotal: {
    backgroundColor: '#059669',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  finLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  finVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  finLabelTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  finValTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  datesBankRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  infoVal: {
    fontSize: 10.5,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 1,
  },
  subsidyNoteBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 12,
  },
  subsidyNoteTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1e40af',
  },
  subsidyNoteText: {
    fontSize: 9.5,
    color: '#3b82f6',
    marginTop: 2,
    lineHeight: 14,
  },
});
