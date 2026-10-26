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
          {/* INVOICE CARD MATCHING WEB CLIENT TEMPLATE */}
          <View style={styles.invoiceDocCard}>
            {/* Header */}
            <View style={styles.docHeader}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.docCompany}>{invoicePdfData.companyName}</Text>
                <Text style={styles.docCompanyAddress}>{invoicePdfData.companyAddress}</Text>
                {invoicePdfData.companyGstin && (
                  <Text style={styles.docCompanyGstin}>GSTIN: {invoicePdfData.companyGstin}</Text>
                )}
                <Text style={styles.docCompanyMeta}>
                  Contact: {invoicePdfData.companyPhone} • {invoicePdfData.companyEmail}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.docTaxInvoiceHeader}>TAX INVOICE</Text>
                <Text style={styles.docMetaRow}>
                  Invoice No: <Text style={styles.docMetaVal}>{invoice.invoiceNumber}</Text>
                </Text>
                <Text style={styles.docMetaRow}>
                  Date: <Text style={styles.docMetaVal}>{invoicePdfData.invoiceDate}</Text>
                </Text>
                <Text style={styles.docMetaRow}>
                  Due Date: <Text style={styles.docMetaVal}>{invoicePdfData.dueDate}</Text>
                </Text>
                <Text style={styles.docMetaRow}>
                  Status:{' '}
                  <Text
                    style={[
                      styles.docMetaStatus,
                      { color: isPaid ? '#059669' : isOverdue ? '#e11d48' : '#d97706' },
                    ]}
                  >
                    {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                  </Text>
                </Text>
              </View>
            </View>

            {/* PARTIES ROW (BILLED TO & PROJECT DETAILS) */}
            <View style={styles.partiesRow}>
              <View style={styles.partyBox}>
                <Text style={styles.partyBoxLabel}>BILLED TO (CONSUMER):</Text>
                <Text style={styles.partyBoxName}>{invoicePdfData.customerName}</Text>
                {invoicePdfData.customerPhone ? (
                  <Text style={styles.partyBoxSub}>{invoicePdfData.customerPhone}</Text>
                ) : null}
                {invoicePdfData.customerEmail ? (
                  <Text style={styles.partyBoxSub}>{invoicePdfData.customerEmail}</Text>
                ) : null}
                <Text style={styles.partyBoxSub}>{invoicePdfData.customerAddress}</Text>
              </View>
              <View style={styles.partyBox}>
                <Text style={styles.partyBoxLabel}>PROJECT & SYSTEM DETAILS:</Text>
                <Text style={styles.projectNameText}>
                  {invoice.project?.name || `${invoicePdfData.customerName}'s Rooftop Solar`}
                </Text>
                <Text style={styles.partyBoxSubBold}>
                  Capacity: {invoicePdfData.projectCapacityKw} kWp On-Grid
                </Text>
                <Text style={styles.partyBoxSub}>
                  Milestone: {invoicePdfData.milestoneTitle}
                </Text>
                <Text style={styles.dbtEligibleText}>PM Surya Ghar DBT Subsidy Eligible</Text>
              </View>
            </View>

            {/* LINE ITEMS TABLE */}
            <View style={styles.itemsTable}>
              <View style={styles.itemsTableHeader}>
                <Text style={[styles.itemTh, { flex: 2.2 }]}>Item & Scope Description</Text>
                <Text style={[styles.itemTh, { flex: 0.8, textAlign: 'center' }]}>HSN/SAC</Text>
                <Text style={[styles.itemTh, { flex: 0.6, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.itemTh, { flex: 1.1, textAlign: 'right' }]}>Total (₹)</Text>
              </View>
              <View style={styles.itemsTableRow}>
                <View style={{ flex: 2.2 }}>
                  <Text style={styles.itemTitleText}>
                    {invoicePdfData.milestoneTitle || 'Solar Power Plant Installation & Supply'}
                  </Text>
                  <Text style={styles.itemDescText}>
                    Supply of Mono PERC DCR PV Modules, Grid Inverter, Mounting Hardware & Commissioning Services.
                  </Text>
                </View>
                <Text style={[styles.itemTd, { flex: 0.8, textAlign: 'center' }]}>
                  {invoice.milestone === 'MATERIAL_DELIVERY' ? '8541' : '9954'}
                </Text>
                <Text style={[styles.itemTd, { flex: 0.6, textAlign: 'center', fontWeight: '700' }]}>
                  1 Set
                </Text>
                <Text style={[styles.itemTd, { flex: 1.1, textAlign: 'right', fontWeight: '900', color: '#0f172a' }]}>
                  ₹{(invoicePdfData.grossTotal || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* TAX BREAKDOWN & BANK INFO */}
            <View style={styles.bottomSection}>
              {/* Left Column: Bank Details & PM Surya Ghar DBT Callout */}
              <View style={styles.bankSection}>
                <Text style={styles.bankTitle}>Bank Transfer Details:</Text>
                <Text style={styles.bankLine}>Bank Name: HDFC Bank Ltd</Text>
                <Text style={styles.bankLine}>Account: Solar EPC Solutions Current A/c</Text>
                <Text style={styles.bankLine}>IFSC Code: HDFC0001234</Text>
                <Text style={[styles.bankLine, { fontWeight: '700', color: '#0f172a' }]}>
                  UPI ID: solar.epc@upi
                </Text>

                <View style={styles.dbtCalloutBox}>
                  <Text style={styles.dbtCalloutTitle}>PM Surya Ghar DBT Note:</Text>
                  <Text style={styles.dbtCalloutText}>
                    Central Govt subsidy of ₹78,000 will be credited directly to consumer Aadhaar-seeded bank account upon DISCOM net meter installation and CEIG inspection.
                  </Text>
                </View>
              </View>

              {/* Right Column: Totals Breakdown */}
              <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Taxable Subtotal</Text>
                  <Text style={styles.totalVal}>₹{invoicePdfData.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST (6.9%)</Text>
                  <Text style={styles.totalVal}>₹{Math.round(invoicePdfData.taxAmount / 2).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST (6.9%)</Text>
                  <Text style={styles.totalVal}>₹{(invoicePdfData.taxAmount - Math.round(invoicePdfData.taxAmount / 2)).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>Total Invoice Value</Text>
                  <Text style={styles.grandTotalVal}>₹{invoicePdfData.grossTotal.toLocaleString('en-IN')}</Text>
                </View>
                {totalPaid > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '700' }]}>
                      Amount Paid to Date
                    </Text>
                    <Text style={[styles.totalVal, { color: '#059669', fontWeight: '800' }]}>
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: balance > 0 ? '#b45309' : '#059669', fontWeight: '900' }]}>
                    Balance Outstanding
                  </Text>
                  <Text style={[styles.totalVal, { color: balance > 0 ? '#b45309' : '#059669', fontWeight: '900' }]}>
                    ₹{balance.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Signatures & Footer */}
            <View style={styles.footerSection}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.footerNoteText}>
                  Thank you for powering the future with clean solar energy!
                </Text>
                <Text style={styles.footerSubText}>
                  This is a computer generated tax invoice.
                </Text>
              </View>
              <View style={styles.signatoryContainer}>
                <View style={styles.signLine} />
                <Text style={styles.signatoryTitle}>AUTHORIZED SIGNATORY</Text>
                <Text style={styles.signatoryCompany}>{invoicePdfData.companyName}</Text>
              </View>
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
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
  },
  docCompany: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 2,
  },
  docCompanyAddress: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 14,
  },
  docCompanyGstin: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  docCompanyMeta: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },
  docTaxInvoiceHeader: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#0f172a',
    marginBottom: 4,
  },
  docMetaRow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 1,
  },
  docMetaVal: {
    fontWeight: '500',
    color: '#475569',
  },
  docMetaStatus: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  partyBox: {
    flex: 1,
  },
  partyBoxLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  partyBoxName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  projectNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 2,
  },
  partyBoxSub: {
    fontSize: 10,
    color: '#475569',
    marginTop: 1,
    lineHeight: 13,
  },
  partyBoxSubBold: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  dbtEligibleText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1d4ed8',
    marginTop: 3,
  },
  itemsTable: {
    marginVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  itemsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
  },
  itemTh: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#1e293b',
  },
  itemsTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
  itemTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemDescText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 12,
  },
  itemTd: {
    fontSize: 10.5,
    color: '#475569',
  },
  bottomSection: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginBottom: 16,
  },
  bankSection: {
    flex: 1.2,
  },
  bankTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  bankLine: {
    fontSize: 9.5,
    color: '#475569',
    lineHeight: 13,
  },
  dbtCalloutBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 8,
  },
  dbtCalloutTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  dbtCalloutText: {
    fontSize: 8.5,
    color: '#1e40af',
    marginTop: 2,
    lineHeight: 12,
  },
  totalsSection: {
    flex: 1.1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  totalVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    marginVertical: 2,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerNoteText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  footerSubText: {
    fontSize: 8.5,
    color: '#cbd5e1',
    marginTop: 1,
  },
  signatoryContainer: {
    alignItems: 'center',
    width: 110,
  },
  signLine: {
    width: 90,
    borderBottomWidth: 1.5,
    borderBottomColor: '#94a3b8',
    height: 24,
    marginBottom: 4,
  },
  signatoryTitle: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#0f172a',
  },
  signatoryCompany: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 1,
  },
});
