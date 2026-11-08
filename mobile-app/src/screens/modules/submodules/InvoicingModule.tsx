import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Receipt,
  MessageCircle,
  CreditCard,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react-native';
import { financeApi } from '../../../api/endpoints';
import { Invoice } from '../../../types';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { useTheme } from '../../../theme';

export interface InvoicingModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const InvoicingModule: React.FC<InvoicingModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

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

  // Payment Recording Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<any>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payModeInput, setPayModeInput] = useState<'UPI' | 'NEFT' | 'CHEQUE' | 'CASH'>('UPI');
  const [payRefInput, setPayRefInput] = useState('');
  const [payNotesInput, setPayNotesInput] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    fetchFinance();
  }, []);

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

  const handleOpenPaymentModal = (inv: any) => {
    setTargetInvoice(inv);
    const balance = (inv.amount || 0) - (inv.paidAmount || 0);
    setPayAmountInput(String(Math.max(0, balance)));
    setPayRefInput('');
    setPayNotesInput('');
    setPaymentModalVisible(true);
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
        notes: payNotesInput,
      });
      Alert.alert(
        'Payment Recorded',
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

  const filteredInvoices = (financeData.invoices || []).filter((inv: any) => {
    if (financeFilter === 'ALL') return true;
    if (financeFilter === 'OVERDUE') return inv.status === 'OVERDUE' || inv.isOverdue;
    if (financeFilter === 'UNPAID') return inv.status === 'ISSUED' || inv.status === 'UNPAID';
    if (financeFilter === 'PARTIAL') return inv.status === 'PARTIAL';
    if (financeFilter === 'PAID') return inv.status === 'PAID';
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        Solar EPC Financial Dashboard
      </Text>

      {loadingFinance ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
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

          {financeData.overdueAmount > 0 && (
            <View style={[styles.overdueBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', borderColor: isDark ? '#b91c1c' : '#fca5a5' }]}>
              <AlertTriangle size={18} color="#dc2626" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#dc2626' }}>
                  OVERDUE MILESTONES: ₹{financeData.overdueAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#fca5a5' : '#7f1d1d' }}>
                  {financeData.overdueCount} customer milestone(s) passed payment terms.
                </Text>
              </View>
            </View>
          )}

          {/* FILTER CHIPS */}
          <View style={styles.filterRow}>
            {(['ALL', 'OVERDUE', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  financeFilter === tab && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setFinanceFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: colors.textSecondary },
                    financeFilter === tab && { color: '#ffffff', fontWeight: '800' },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* INVOICES LIST */}
          <Text style={[styles.cardSectionHeader, { marginTop: 18, color: colors.text }]}>
            Invoices & Payment Milestones ({filteredInvoices.length})
          </Text>

          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<Receipt size={32} color={colors.textSecondary} />}
              title="No Invoices Found"
              description="No customer billing milestones match the selected filter."
              compact
            />
          ) : (
            filteredInvoices.map((inv: any) => {
              const balance = Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
              return (
                <View
                  key={inv.id}
                  style={[styles.invoiceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.invoiceNumber, { color: colors.primary }]}>{inv.invoiceNumber}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          inv.status === 'PAID'
                            ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }
                            : inv.status === 'OVERDUE'
                              ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2' }
                              : { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            inv.status === 'PAID'
                              ? { color: isDark ? '#34d399' : '#047857' }
                              : inv.status === 'OVERDUE'
                                ? { color: isDark ? '#f87171' : '#dc2626' }
                                : { color: isDark ? '#fbbf24' : '#b45309' },
                          ]}
                        >
                          {inv.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.customerName, { color: colors.text }]}>
                      {inv.customer?.name || inv.project?.customerName || 'Customer'}
                    </Text>
                    <Text style={[styles.milestoneLabel, { color: colors.textSecondary }]}>
                      Milestone: {inv.milestone || 'Project Payment'} • Due:{' '}
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                      Total: ₹{(inv.amount || 0).toLocaleString('en-IN')}{' '}
                      {balance > 0 && (
                        <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '700' }}>
                          (Bal: ₹{balance.toLocaleString('en-IN')})
                        </Text>
                      )}
                    </Text>
                  </View>

                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    {balance > 0 && (
                      <TouchableOpacity
                        style={styles.recordPayBtn}
                        onPress={() => handleOpenPaymentModal(inv)}
                        activeOpacity={0.85}
                      >
                        <CreditCard size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.recordPayBtnText}>Collect</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.waRemindBtn}
                      onPress={() => handleMobileWhatsAppNotice(inv)}
                      activeOpacity={0.85}
                    >
                      <MessageCircle size={12} color={isDark ? '#4ade80' : '#15803d'} />
                      <Text style={[styles.waRemindBtnText, isDark && { color: '#4ade80' }]}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalDragHandle} />

            <View style={styles.subModalHeader}>
              <View>
                <Text style={[styles.subModalTitle, { color: colors.text }]}>Record Customer Payment</Text>
                <Text style={[styles.subModalSubtitle, { color: colors.textSecondary }]}>
                  Invoice: {targetInvoice?.invoiceNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeSubModalBtn, { backgroundColor: colors.background }]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COLLECTION AMOUNT (₹) *</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={payAmountInput}
                onChangeText={setPayAmountInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT MODE *</Text>
              <View style={styles.chipRow}>
                {(['UPI', 'NEFT', 'CHEQUE', 'CASH'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.smallChip,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      payModeInput === m && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5', borderColor: '#059669' },
                    ]}
                    onPress={() => setPayModeInput(m)}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        { color: colors.textSecondary },
                        payModeInput === m && { color: isDark ? '#34d399' : '#059669', fontWeight: '800' },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                TRANSACTION REFERENCE / UTR / CHEQUE #
              </Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={payRefInput}
                onChangeText={setPayRefInput}
                placeholder="e.g. UTR-49102849102"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={payNotesInput}
                onChangeText={setPayNotesInput}
                placeholder="e.g. Received via PhonePe QR"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={[styles.primaryActionBtn, submittingPay && { opacity: 0.7 }]}
                onPress={handleRecordMobilePayment}
                disabled={submittingPay}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>
                  {submittingPay ? 'Recording...' : 'Generate Receipt & Mark Paid'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cardSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  financeMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  financeMetricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
  },
  financeMetricLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  financeMetricVal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  milestoneLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  recordPayBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recordPayBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  waRemindBtn: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  waRemindBtnText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subModalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeSubModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  smallChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
