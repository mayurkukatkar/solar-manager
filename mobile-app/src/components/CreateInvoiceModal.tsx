import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  FileText,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Receipt,
  Sparkles,
} from 'lucide-react-native';
import { ModalHeader } from './Header';
import { financeApi } from '../api/endpoints';
import { colors } from '../theme/colors';

export type InvoiceTypeCategory = 'TAX_INVOICE' | 'PROFORMA' | 'ADVANCE_RECEIPT' | 'CUSTOM';

interface CreateInvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (invoice: any) => void;
  initialLead?: any;
  initialCustomer?: any;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialLead,
  initialCustomer,
}) => {
  const [invoiceType, setInvoiceType] = useState<InvoiceTypeCategory>('TAX_INVOICE');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [capacityKw, setCapacityKw] = useState('3.3');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxRate, setTaxRate] = useState('13.8'); // 13.8% composite solar GST
  const [dueDays, setDueDays] = useState('15');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync initial context
  useEffect(() => {
    if (visible) {
      const cust = initialCustomer || initialLead?.customer;
      const lead = initialLead;

      const name = cust?.name || lead?.name || '';
      const mobile = cust?.mobile || lead?.mobile || '';
      const city = cust?.city || lead?.city || 'Pune';
      const cap = String(lead?.estimatedCap || 3.3);
      const grossVal = lead?.estimatedValue || Math.round(parseFloat(cap || '3.3') * 56000);

      setCustomerName(name);
      setCustomerMobile(mobile);
      setCustomerCity(city);
      setCapacityKw(cap);
      setTotalAmount(String(grossVal || 185000));
      updatePresetTitle('TAX_INVOICE', cap);
    }
  }, [visible, initialLead, initialCustomer]);

  const updatePresetTitle = (type: InvoiceTypeCategory, capVal = capacityKw) => {
    const kw = capVal || '3.3';
    if (type === 'TAX_INVOICE') {
      setTitle(`Turnkey Supply & Commissioning of ${kw} kWp Solar Rooftop Plant`);
      setNotes('GST composite invoice. Bank NEFT/RTGS/UPI remittance accepted.');
    } else if (type === 'PROFORMA') {
      setTitle(`Proforma Estimation for ${kw} kWp Solar Power Plant (Bank Loan & Net-Metering)`);
      setNotes('Proforma invoice for bank sanction under PM Surya Ghar Muft Bijli Yojana.');
    } else if (type === 'ADVANCE_RECEIPT') {
      setTitle(`Advance Booking Token & Engineering Design Work Order`);
      setNotes('Advance payment received towards site layout, engineering drawing & DISCOM filing.');
    } else {
      setTitle(`Progress Billing: Installation & Balance Commercial Supply (${kw} kWp)`);
      setNotes('Progress invoice for site installation and supply of solar equipment.');
    }
  };

  const handleSelectType = (type: InvoiceTypeCategory) => {
    setInvoiceType(type);
    updatePresetTitle(type);

    // Contextual amounts
    const baseTotal = initialLead?.estimatedValue || Math.round(parseFloat(capacityKw || '3.3') * 56000);
    if (type === 'ADVANCE_RECEIPT') {
      setTotalAmount(String(Math.round(baseTotal * 0.2))); // 20% default for advance
    } else if (type === 'PROFORMA' || type === 'TAX_INVOICE') {
      setTotalAmount(String(baseTotal));
    }
  };

  const applyPercentPreset = (pct: number) => {
    const baseTotal = initialLead?.estimatedValue || Math.round(parseFloat(capacityKw || '3.3') * 56000);
    setTotalAmount(String(Math.round(baseTotal * (pct / 100))));
  };

  const handleSubmit = async () => {
    const amt = parseFloat(totalAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please specify a valid invoice amount.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Missing Customer', 'Please enter the client / company name.');
      return;
    }

    setSubmitting(true);
    try {
      const tRate = parseFloat(taxRate) || 13.8;
      const subtotal = Math.round(amt / (1 + tRate / 100));
      const taxAmount = amt - subtotal;
      const kw = parseFloat(capacityKw) || 3.3;

      const payload = {
        leadId: initialLead?.id,
        customerId: initialCustomer?.id || initialLead?.customerId || initialLead?.customer?.id,
        projectId: initialLead?.projects?.[0]?.id,
        invoiceType,
        milestone: invoiceType,
        milestoneTitle: title.trim() || 'Commercial Solar EPC Billing',
        amount: amt,
        subtotal,
        taxRate: tRate,
        taxAmount,
        dueDate: new Date(Date.now() + parseInt(dueDays || '15', 10) * 86400000).toISOString(),
        items: [
          {
            description: `${title.trim()} (${kw} kWp Grid-Tied System Kit)`,
            hsn: '8541',
            qty: 1,
            unit: 'Job',
            rate: subtotal,
            amount: subtotal,
            gstRate: tRate,
          },
        ],
        notes: notes.trim(),
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerCity: customerCity.trim(),
      };

      const res = await financeApi.createInvoice(payload);
      const createdInvoice = res?.invoice || res;

      Alert.alert('Invoice Generated! 🎉', `Invoice ${createdInvoice.invoiceNumber || 'Created'} for ₹${amt.toLocaleString('en-IN')} has been generated successfully.`);
      onSuccess(createdInvoice);
      onClose();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.response?.data?.error || err.message || 'Could not create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* STANDARDIZED MODAL HEADER */}
          <ModalHeader
            title="Create Commercial Invoice"
            subtitle="GST Tax Invoices, Bank Proformas & Advance Vouchers"
            onClose={onClose}
          />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            {/* INVOICE CATEGORY SELECTOR */}
            <Text style={styles.sectionHeading}>SELECT INVOICE CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {[
                { key: 'TAX_INVOICE', label: 'Tax Invoice', sub: 'Standard GST Bill', icon: '📄' },
                { key: 'PROFORMA', label: 'Proforma', sub: 'Bank Loan / DISCOM', icon: '🏦' },
                { key: 'ADVANCE_RECEIPT', label: 'Advance Deposit', sub: 'Token Voucher', icon: '💳' },
                { key: 'CUSTOM', label: 'Progress Bill', sub: 'Custom Tranche', icon: '⚡' },
              ].map((cat) => {
                const isSelected = invoiceType === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                    onPress={() => handleSelectType(cat.key as InvoiceTypeCategory)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.categorySub}>{cat.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CLIENT & SYSTEM DETAILS */}
            <Text style={styles.sectionHeading}>CLIENT & SYSTEM CONTEXT</Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.inputLabel}>CUSTOMER / BUSINESS NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="e.g. Ramesh Deshmukh"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>PLANT (kWp)</Text>
                <TextInput
                  style={styles.textInput}
                  value={capacityKw}
                  onChangeText={(val) => {
                    setCapacityKw(val);
                    updatePresetTitle(invoiceType, val);
                  }}
                  keyboardType="numeric"
                  placeholder="3.3"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* INVOICE SCOPE / TITLE */}
            <Text style={styles.inputLabel}>INVOICE TITLE / SUPPLY SCOPE</Text>
            <TextInput
              style={[styles.textInput, { height: 48 }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Turnkey Supply of 3.3 kWp Rooftop System"
              placeholderTextColor="#94a3b8"
            />

            {/* COMMERCIAL VALUATION & PERCENT PRESETS */}
            <View style={styles.amountHeaderRow}>
              <Text style={styles.inputLabel}>TOTAL INVOICE AMOUNT (₹ INCL. GST)</Text>
              <View style={styles.presetButtonsRow}>
                {[10, 25, 50, 100].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={styles.pctBtn}
                    onPress={() => applyPercentPreset(pct)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pctBtnText}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.amountInputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
                placeholder="1,85,000"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* TAX AND DUE DATE ROW */}
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>GST RATE</Text>
                <View style={styles.gstChipsRow}>
                  {[
                    { val: '13.8', label: '13.8% (EPC Composite)' },
                    { val: '18', label: '18% (Services)' },
                    { val: '0', label: '0% (Exempt)' },
                  ].map((g) => (
                    <TouchableOpacity
                      key={g.val}
                      style={[styles.gstChip, taxRate === g.val && styles.gstChipSelected]}
                      onPress={() => setTaxRate(g.val)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.gstChipText, taxRate === g.val && styles.gstChipTextSelected]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* DUE DAYS */}
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>PAYMENT DUE TIMELINE</Text>
              <View style={styles.dueDaysRow}>
                {[
                  { days: '0', label: 'Immediate / Advance' },
                  { days: '7', label: '7 Days' },
                  { days: '15', label: '15 Days' },
                  { days: '30', label: '30 Days' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.days}
                    style={[styles.dueChip, dueDays === d.days && styles.dueChipSelected]}
                    onPress={() => setDueDays(d.days)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, dueDays === d.days && styles.dueChipTextSelected]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* INVOICE NOTES */}
            <Text style={styles.inputLabel}>TERMS & INSTRUCTIONS</Text>
            <TextInput
              style={[styles.textInput, { height: 60, marginTop: 4 }]}
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Bank details for RTGS/NEFT/UPI transfer, DBT clearance disclaimer"
              placeholderTextColor="#94a3b8"
            />
          </ScrollView>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Sparkles size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>
                  Generate {invoiceType === 'PROFORMA' ? 'Proforma' : invoiceType === 'ADVANCE_RECEIPT' ? 'Advance Receipt' : 'Tax Invoice'} & View PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  formContent: {
    paddingBottom: 20,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    alignItems: 'center',
  },
  categoryCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 1.5,
  },
  categoryIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#2563eb',
  },
  categorySub: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  amountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 5,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pctBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pctBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  gstChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  gstChip: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  gstChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  gstChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  gstChipTextSelected: {
    color: '#ffffff',
  },
  dueDaysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dueChip: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dueChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dueChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  dueChipTextSelected: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});
