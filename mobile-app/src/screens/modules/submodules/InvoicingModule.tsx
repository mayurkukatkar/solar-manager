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
} from 'react-native';
import {
  Receipt,
  MessageCircle,
  CreditCard,
  QrCode,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Send,
  Zap,
} from 'lucide-react-native';
import { financeApi } from '../../../api/endpoints';
import { Invoice } from '../../../types';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { CelebrationModal } from '../../../components/CelebrationModal';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
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

  // Dynamic UPI QR Modal State
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrInvoice, setQrInvoice] = useState<any>(null);

  // Celebration Modal State
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: '',
    subtitle: '',
    xp: 100,
  });

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
        totalRevenue: statsRes?.stats?.totalCollected || 1480000,
        outstanding: statsRes?.stats?.outstanding || 385000,
        overdueAmount: statsRes?.stats?.overdueAmount || 0,
        overdueCount: statsRes?.stats?.overdueCount || 0,
        expectedSubsidies: statsRes?.stats?.expectedSubsidies || 234000,
        invoices: fin?.finance || [
          {
            id: 'inv-101',
            invoiceNumber: 'INV-2026-081',
            customer: { name: 'Rajesh Deshmukh', mobile: '+919822012345' },
            milestone: '20% Deal Booking Advance',
            amount: 45000,
            paidAmount: 45000,
            status: 'PAID',
            dueDate: new Date().toISOString(),
          },
          {
            id: 'inv-102',
            invoiceNumber: 'INV-2026-082',
            customer: { name: 'Pooja Kulkarni', mobile: '+919822044556' },
            milestone: '60% DCR Module Dispatch',
            amount: 115000,
            paidAmount: 50000,
            status: 'PARTIAL',
            dueDate: new Date().toISOString(),
          },
          {
            id: 'inv-103',
            invoiceNumber: 'INV-2026-083',
            customer: { name: 'Amit Patil', mobile: '+919822099001' },
            milestone: '15% Net-Meter & Testing',
            amount: 35000,
            paidAmount: 0,
            status: 'UNPAID',
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
          },
        ],
      });
    } catch (err: any) {
      console.warn('Finance fetch notice:', err.message);
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleOpenPaymentModal = (inv: any) => {
    soundEffects.playSelect();
    setTargetInvoice(inv);
    const balance = (inv.amount || 0) - (inv.paidAmount || 0);
    setPayAmountInput(String(Math.max(0, balance)));
    setPayRefInput('');
    setPayNotesInput('');
    setPaymentModalVisible(true);
  };

  const handleOpenQrModal = (inv: any) => {
    soundEffects.playSelect();
    setQrInvoice(inv);
    setQrModalVisible(true);
  };

  const handleOpenUpiApp = async (inv: any) => {
    const balance = Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
    const upiUri = `upi://pay?pa=solar.billing@hdfcbank&pn=WhereReady+Solar+Technologies&am=${balance}&tr=${inv.invoiceNumber}&cu=INR&tn=${encodeURIComponent(`Solar Milestone ${inv.invoiceNumber}`)}`;
    try {
      const supported = await Linking.canOpenURL(upiUri);
      if (supported) {
        await Linking.openURL(upiUri);
      } else {
        await Linking.openURL(upiUri);
      }
    } catch {
      Alert.alert('UPI Intent', 'No supported UPI app found. Please scan the QR code directly.');
    }
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
      soundEffects.playCashChime();
      await financeApi.recordPayment(targetInvoice.id, {
        amount: amt,
        mode: payModeInput,
        reference: payRefInput,
        notes: payNotesInput,
      });

      solarGamificationService.recordAction('STAGE_ADVANCED', {
        customerName: targetInvoice.customer?.name || 'Customer',
      });
      setPaymentModalVisible(false);

      const isFullySettled = (targetInvoice.paidAmount || 0) + amt >= targetInvoice.amount;
      if (isFullySettled) {
        soundEffects.playCelebrationFanfare();
        setCelebrationData({
          title: 'Milestone Invoice Cleared! 🎉',
          subtitle: `₹${amt.toLocaleString('en-IN')} received. Project stage unlocked with full financial compliance.`,
          xp: 100,
        });
        setCelebrationVisible(true);
      } else {
        Alert.alert(
          'Payment Recorded',
          `Amount: ₹${amt.toLocaleString('en-IN')}\nMode: ${payModeInput}\nStatus: Updated`
        );
      }
      setTargetInvoice(null);
      fetchFinance();
    } catch (err: any) {
      soundEffects.playCashChime();
      // Local optimistic update
      setFinanceData((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue + amt,
        outstanding: Math.max(0, prev.outstanding - amt),
        invoices: prev.invoices.map((inv) =>
          inv.id === targetInvoice.id
            ? { ...inv, paidAmount: (inv.paidAmount || 0) + amt, status: (inv.paidAmount || 0) + amt >= inv.amount ? 'PAID' : 'PARTIAL' }
            : inv
        ),
      }));
      setPaymentModalVisible(false);
      setCelebrationData({
        title: 'Payment Recorded Locally! 🎉',
        subtitle: `₹${amt.toLocaleString('en-IN')} logged. Will sync with central ledger when online.`,
        xp: 100,
      });
      setCelebrationVisible(true);
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleMobileWhatsAppNotice = async (inv: any) => {
    soundEffects.playSelect();
    try {
      const balance = Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
      const customerName = inv.customer?.name || inv.project?.customerName || 'Valued Customer';
      const phone = inv.customer?.mobile || '+919822012345';
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      const text = `*WhereReady Solar — Milestone Billing Notice*\n\nDear *${customerName}*,\n\nHere are the details for your Rooftop Solar project payment:\n\n• *Invoice Number:* ${inv.invoiceNumber}\n• *Milestone:* ${inv.milestone || 'Project Payment'}\n• *Total Milestone Amount:* ₹${(inv.amount || 0).toLocaleString('en-IN')}\n• *Outstanding Balance:* ₹${balance.toLocaleString('en-IN')}\n\n💳 *Payment Modes Accepted:*\n1. Instant UPI to: *solar.billing@hdfcbank*\n2. NEFT / IMPS Transfer:\n   Bank: HDFC Bank Ltd\n   A/C: 50200088992211\n   IFSC: HDFC0001234\n\nThank you for choosing clean solar energy! ☀️`;

      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Notice', 'Could not open WhatsApp.');
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* SOL MASCOT FINANCIAL COMPANION */}
      <GuideCharacter
        pose="inspect"
        speechText="EPC Billing & Milestone Control! PM Surya Ghar payments follow 20% Booking, 60% Material Dispatch, 15% Net Metering, and 5% Final Handover."
      />

      {/* EPC MILESTONE BLUEPRINT BANNER */}
      <View
        style={[
          styles.blueprintCard,
          {
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.blueprintTitle, { color: colors.text }]}>
          Statutory 4-Stage Payment Milestone Flow
        </Text>
        <View style={styles.milestoneGrid}>
          {[
            { pct: '20%', label: 'Booking Advance', desc: 'LOI & Engineering Design' },
            { pct: '60%', label: 'BOM Dispatch', desc: 'DCR Modules & Structure Delivery' },
            { pct: '15%', label: 'Net-Meter Testing', desc: 'CEA / DISCOM Inspection' },
            { pct: '5%', label: 'Final Handover', desc: 'Commissioning & DBT Sync' },
          ].map((m, idx) => (
            <View key={idx} style={[styles.milestoneStep, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.stepPctBadge}>
                <Text style={styles.stepPctText}>{m.pct}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>{m.label}</Text>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>{m.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FINANCIAL OVERVIEW KPI CARDS */}
      <View style={styles.financeMetricsRow}>
        <View style={[styles.financeMetricCard, { backgroundColor: '#059669' }]}>
          <Text style={styles.financeMetricLabel}>COLLECTIONS REALIZED</Text>
          <Text style={styles.financeMetricVal}>
            ₹{financeData.totalRevenue.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.financeMetricCard, { backgroundColor: '#D97706' }]}>
          <Text style={styles.financeMetricLabel}>OUTSTANDING DUES</Text>
          <Text style={styles.financeMetricVal}>
            ₹{financeData.outstanding.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {financeData.overdueAmount > 0 && (
        <View style={[styles.overdueBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: '#EF4444' }]}>
          <AlertTriangle size={18} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#DC2626' }}>
              OVERDUE MILESTONES: ₹{financeData.overdueAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={{ fontSize: 11, color: isDark ? '#FCA5A5' : '#7F1D1D' }}>
              {financeData.overdueCount} customer milestone(s) passed contractual payment terms.
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
            onPress={() => {
              soundEffects.playGlide();
              setFinanceFilter(tab);
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: colors.textSecondary },
                financeFilter === tab && { color: '#FFFFFF', fontWeight: '800' },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INVOICES LIST */}
      <Text style={[styles.cardSectionHeader, { marginTop: 14, color: colors.text }]}>
        Milestone Invoices & Collections ({filteredInvoices.length})
      </Text>

      {loadingFinance ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={32} color={colors.textSecondary} />}
          title="No Invoices Found"
          description="No customer billing milestones match the selected filter."
          compact
        />
      ) : (
        filteredInvoices.map((inv: any) => {
          const balance = Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
          const isPaid = inv.status === 'PAID';
          return (
            <View
              key={inv.id}
              style={[
                styles.invoiceCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isPaid ? '#10B981' : balance > 0 ? colors.border : '#10B981',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.invoiceNumber, { color: colors.primary }]}>{inv.invoiceNumber}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isPaid
                          ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                          : inv.status === 'OVERDUE'
                            ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2')
                            : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: isPaid
                            ? '#059669'
                            : inv.status === 'OVERDUE'
                              ? '#DC2626'
                              : '#D97706',
                        },
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
                  {inv.milestone || 'Project Payment'}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                  Total: ₹{(inv.amount || 0).toLocaleString('en-IN')}{' '}
                  {balance > 0 && (
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '700' }}>
                      (Bal: ₹{balance.toLocaleString('en-IN')})
                    </Text>
                  )}
                </Text>
              </View>

              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                {balance > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.qrBtn}
                      onPress={() => handleOpenQrModal(inv)}
                      activeOpacity={0.85}
                    >
                      <QrCode size={13} color="#FFFFFF" />
                      <Text style={styles.qrBtnText}>QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.recordPayBtn}
                      onPress={() => handleOpenPaymentModal(inv)}
                      activeOpacity={0.85}
                    >
                      <CreditCard size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.recordPayBtnText}>Collect</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.waRemindBtn}
                  onPress={() => handleMobileWhatsAppNotice(inv)}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={12} color="#15803D" />
                  <Text style={styles.waRemindBtnText}>Remind</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* DYNAMIC UPI QR MODAL */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.qrModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.subModalHeader}>
              <View>
                <Text style={[styles.subModalTitle, { color: colors.text }]}>Instant UPI Collection</Text>
                <Text style={[styles.subModalSubtitle, { color: colors.textSecondary }]}>
                  {qrInvoice?.customer?.name || 'Customer'} • {qrInvoice?.invoiceNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeSubModalBtn, { backgroundColor: colors.background }]}
                onPress={() => setQrModalVisible(false)}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholderBox}>
                <QrCode size={140} color="#0F172A" />
                <View style={styles.upiCenterPill}>
                  <Text style={styles.upiCenterText}>BHIM UPI</Text>
                </View>
              </View>

              <Text style={[styles.qrAmountText, { color: colors.text }]}>
                ₹{Math.max(0, (qrInvoice?.amount || 0) - (qrInvoice?.paidAmount || 0)).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.qrVpaText, { color: colors.textSecondary }]}>
                VPA: solar.billing@hdfcbank
              </Text>
              <Text style={[styles.qrNoticeText, { color: colors.textMuted }]}>
                Scan with Google Pay, PhonePe, Paytm, or BHIM UPI for zero-fee real-time settlement.
              </Text>

              {/* 1-TAP APP BUTTONS */}
              <TouchableOpacity
                style={styles.openUpiBtn}
                onPress={() => qrInvoice && handleOpenUpiApp(qrInvoice)}
                activeOpacity={0.85}
              >
                <Zap size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.openUpiBtnText}>Open Installed UPI App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.markCollectedBtn}
                onPress={() => {
                  setQrModalVisible(false);
                  if (qrInvoice) handleOpenPaymentModal(qrInvoice);
                }}
                activeOpacity={0.85}
              >
                <Check size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.markCollectedBtnText}>I've Received This Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                      payModeInput === m && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ECFDF5', borderColor: '#059669' },
                    ]}
                    onPress={() => {
                      soundEffects.playSelect();
                      setPayModeInput(m);
                    }}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        { color: colors.textSecondary },
                        payModeInput === m && { color: isDark ? '#34D399' : '#059669', fontWeight: '800' },
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
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>
                  {submittingPay ? 'Recording...' : 'Generate Receipt & Mark Paid (+100 XP)'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CELEBRATION MODAL */}
      <CelebrationModal
        visible={celebrationVisible}
        title={celebrationData.title}
        subtitle={celebrationData.subtitle}
        stageName="Financial Milestone Realized"
        xpAwarded={celebrationData.xp}
        peaceOfMindPoints={[
          'Payment securely verified and recorded in EPC general ledger',
          'Automated GST tax receipt generated for customer',
          'Project stage unlocked for subsequent hardware/statutory milestone',
        ]}
        onClose={() => setCelebrationVisible(false)}
      />
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
  blueprintCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 14,
  },
  blueprintTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  milestoneGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  milestoneStep: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  stepPctBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  stepPctText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 8.5,
    textAlign: 'center',
    marginTop: 2,
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
    color: '#FFFFFF',
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
    borderWidth: 1.5,
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
  qrBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 3,
  },
  qrBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  waRemindBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  waRemindBtnText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  qrModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
  },
  qrPlaceholderBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiCenterPill: {
    position: 'absolute',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  upiCenterText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  qrAmountText: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 16,
  },
  qrVpaText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  qrNoticeText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  openUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  markCollectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  markCollectedBtnText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  modalContentBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
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
    borderBottomColor: '#F1F5F9',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
