import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import {
  Receipt,
  Search,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  Plus,
  RefreshCw,
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
  User,
  Zap,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
import { CreateInvoiceModal } from '../../components/CreateInvoiceModal';
import { financeApi } from '../../api/endpoints';
import { useTheme } from '../../theme';
import { useDebounce } from '../../hooks/useDebounce';
import { haptics } from '../../utils/haptics';
import { offlineSyncService } from '../../services/offlineSyncService';
import { EmptyState, SkeletonLoader } from '../../components/common';

export const FinanceScreen: React.FC<{ navigation?: any; route?: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route?.params?.customerName || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [docCategoryFilter, setDocCategoryFilter] = useState<'ALL' | 'TAX_INVOICE' | 'PROFORMA' | 'ADVANCE'>('ALL');
  const [createInvoiceModalVisible, setCreateInvoiceModalVisible] = useState(false);

  // PDF Invoice Modal State
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfTargetInvoice, setPdfTargetInvoice] = useState<any | null>(null);

  // Financial Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstanding: 0,
    overdueAmount: 0,
    overdueCount: 0,
    expectedSubsidies: 0,
    paidCount: 0,
    unpaidCount: 0,
  });

  // Invoices List
  const [invoices, setInvoices] = useState<any[]>([]);

  // Payment Recording Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'UPI' | 'NEFT' | 'CHEQUE' | 'CASH'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Expanded Invoice Details
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // 300ms search debouncing
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (route?.params?.customerName) {
      setSearchQuery(route.params.customerName);
    }
    fetchFinanceData();
  }, [route?.params]);

  const fetchFinanceData = async () => {
    try {
      const cached = await offlineSyncService.getCachedResponse<any>('finance');
      if (cached?.data && invoices.length === 0) {
        if (cached.data.stats) setStats(cached.data.stats);
        if (cached.data.invoices) setInvoices(cached.data.invoices);
        setLoading(false);
      }

      const [statsRes, finRes] = await Promise.all([
        financeApi.getStats().catch((err) => {
          console.warn('Finance stats fetch notice:', err.message);
          return null;
        }),
        financeApi.getInvoices().catch((err) => {
          console.warn('Finance invoices fetch notice:', err.message);
          return null;
        }),
      ]);

      let newStats = stats;
      let newInvoices = invoices;

      if (statsRes && statsRes.stats) {
        newStats = {
          totalRevenue: statsRes.stats.totalCollected || 0,
          outstanding: statsRes.stats.outstanding || 0,
          overdueAmount: statsRes.stats.overdueAmount || 0,
          overdueCount: statsRes.stats.overdueCount || 0,
          expectedSubsidies: statsRes.stats.expectedSubsidies || 0,
          paidCount: statsRes.stats.paidCount || 0,
          unpaidCount: statsRes.stats.unpaidCount || 0,
        };
        setStats(newStats);
      }

      if (finRes && Array.isArray(finRes.finance)) {
        newInvoices = finRes.finance;
        setInvoices(newInvoices);
      }

      await offlineSyncService.setCachedResponse('finance', { stats: newStats, invoices: newInvoices });
    } catch (err: any) {
      console.warn('Finance fetch error:', err.message);
      const cached = await offlineSyncService.getCachedResponse<any>('finance');
      if (cached?.data) {
        if (cached.data.stats) setStats(cached.data.stats);
        if (cached.data.invoices) setInvoices(cached.data.invoices);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  // 3-Tier Overdue Aging Breakdown (<15d, 15-30d, >30d)
  const agingStats = useMemo(() => {
    let under15 = 0;
    let between15and30 = 0;
    let over30 = 0;

    invoices.forEach((inv) => {
      const isPaid = (inv.computedStatus || inv.status) === 'PAID';
      const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < new Date() && !isPaid);
      if (isOverdue && inv.dueDate) {
        const days = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days < 15) under15++;
        else if (days <= 30) between15and30++;
        else over30++;
      }
    });

    return { under15, between15and30, over30 };
  }, [invoices]);

  const getAgingBadge = (dueDate?: string) => {
    if (!dueDate) return { label: 'OVERDUE', color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' };
    const days = Math.max(1, Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)));
    if (days < 15) {
      return { label: `OVERDUE (${days}d)`, sub: '<15d Grace', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' };
    } else if (days <= 30) {
      return { label: `OVERDUE (${days}d)`, sub: '15-30d Urgent', color: '#F97316', bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFEDD5' };
    } else {
      return { label: `OVERDUE (>30d)`, sub: '>30d Critical', color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' };
    }
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const search = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !search ||
        (inv.invoiceNumber || '').toLowerCase().includes(search) ||
        (inv.customer?.name || '').toLowerCase().includes(search) ||
        (inv.project?.name || '').toLowerCase().includes(search) ||
        (inv.customer?.mobile || '').includes(search);

      if (!matchSearch) return false;

      const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const isPaid = (inv.computedStatus || inv.status) === 'PAID';
      const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < new Date() && !isPaid);

      if (statusFilter === 'ALL') {
        // Continue to docCategoryFilter check
      } else if (statusFilter === 'OVERDUE') {
        if (!isOverdue) return false;
      } else if (statusFilter === 'UNPAID') {
        if (isPaid || totalPaid > 0 || isOverdue) return false;
      } else if (statusFilter === 'PARTIAL') {
        if (isPaid || totalPaid === 0 || isOverdue) return false;
      } else if (statusFilter === 'PAID') {
        if (!isPaid) return false;
      }

      if (docCategoryFilter !== 'ALL') {
        const num = (inv.invoiceNumber || '').toUpperCase();
        const type = (inv.invoiceType || inv.milestone || '').toUpperCase();
        const title = (inv.milestoneTitle || '').toUpperCase();
        if (docCategoryFilter === 'PROFORMA' && !type.includes('PROFORMA') && !num.startsWith('PRO') && !title.includes('PROFORMA')) return false;
        if (docCategoryFilter === 'ADVANCE' && !type.includes('ADVANCE') && !num.startsWith('ADV') && !title.includes('ADVANCE') && !title.includes('TOKEN')) return false;
        if (docCategoryFilter === 'TAX_INVOICE' && (type.includes('PROFORMA') || num.startsWith('PRO') || type.includes('ADVANCE') || num.startsWith('ADV'))) return false;
      }

      return true;
    });
  }, [invoices, debouncedSearch, statusFilter, docCategoryFilter]);

  // Open PDF Invoice Modal
  const handleOpenPdfModal = (invoice: any) => {
    setPdfTargetInvoice(invoice);
    setPdfModalVisible(true);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (invoice: any) => {
    const totalPaid = invoice.totalPaid ?? (invoice.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const balance = invoice.balance ?? Math.max(0, (invoice.amount || 0) - totalPaid);
    setSelectedInvoice(invoice);
    setPayAmount(String(balance > 0 ? balance : invoice.amount || ''));
    setPayMode('UPI');
    setPayRef('');
    setPayNotes('');
    setPaymentModalVisible(true);
  };

  // Submit Payment
  const handleSubmitPayment = async () => {
    if (!selectedInvoice) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await financeApi.recordPayment(selectedInvoice.id, {
        amount: amt,
        mode: payMode,
        reference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });

      Alert.alert(
        'Payment Recorded',
        `Receipt No: ${res.receiptNumber || 'REC-' + Date.now().toString().slice(-6)}\nAmount: ₹${amt.toLocaleString(
          'en-IN'
        )}\nInvoice Status: ${res.invoiceStatus || 'Updated'}`
      );
      setPaymentModalVisible(false);
      setSelectedInvoice(null);
      fetchFinanceData();
    } catch (err: any) {
      Alert.alert(
        'Payment Recording Failed',
        err.response?.data?.error || err.message || 'Could not record transaction.'
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Send WhatsApp Reminder
  const handleSendWhatsAppReminder = async (inv: any) => {
    try {
      const res = await financeApi.getWhatsAppPayload(inv.id);
      if (res?.whatsappUrl) {
        await Linking.openURL(res.whatsappUrl);
      } else {
        const phone = (inv.customer?.mobile || '').replace(/[^0-9]/g, '');
        if (!phone) {
          Alert.alert('Missing Phone', 'No customer phone number registered for this invoice.');
          return;
        }
        const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const balance = inv.balance ?? Math.max(0, (inv.amount || 0) - totalPaid);
        const msg = `☀️ *Payment Notice — WhereReady Solar OS*\n\nDear *${inv.customer?.name || 'Customer'
          }*,\n\nInvoice details for your solar installation:\n• Invoice No: *${inv.invoiceNumber
          }*\n• Milestone: *${inv.milestone || 'Project Milestone'}*\n• Total Amount: ₹${(
            inv.amount || 0
          ).toLocaleString('en-IN')}\n• Balance Due: *₹${balance.toLocaleString(
            'en-IN'
          )}*\n\nPlease transfer via UPI or Bank Transfer to proceed to the next milestone.\n\nThank you,\n*WhereReady Solar OS Billing*`;
        const url = `whatsapp://send?phone=${phone.startsWith('91') ? phone : '91' + phone}&text=${encodeURIComponent(
          msg
        )}`;
        await Linking.openURL(url);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Could not open WhatsApp. Ensure WhatsApp is installed.');
    }
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 220,
      offset: 220 * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: any) => item.id || item.invoiceNumber || String(Math.random()), []);

  const renderInvoiceItem = useCallback(
    ({ item: inv }: { item: any }) => {
      const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const balance = inv.balance ?? Math.max(0, (inv.amount || 0) - totalPaid);
      const isPaid = (inv.computedStatus || inv.status) === 'PAID';
      const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < new Date() && !isPaid);
      const progress = inv.amount > 0 ? Math.min(100, Math.round((totalPaid / inv.amount) * 100)) : 0;
      const isExpanded = expandedInvoiceId === inv.id;

      const num = (inv.invoiceNumber || '').toUpperCase();
      const type = (inv.invoiceType || inv.milestone || '').toUpperCase();
      const isProforma = type.includes('PROFORMA') || num.startsWith('PRO');
      const isAdvance = type.includes('ADVANCE') || num.startsWith('ADV');

      return (
        <View
          key={inv.id}
          style={[
            styles.invoiceCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {/* HEADER ROW: INVOICE NUMBER, DOC TYPE, STATUS */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.invoiceNumRow}>
                <Text style={[styles.invoiceNumber, { color: colors.text }]}>
                  {inv.invoiceNumber || 'INV-2026'}
                </Text>

                <View
                  style={[
                    styles.docTypeBadge,
                    {
                      backgroundColor: isProforma
                        ? (isDark ? 'rgba(0, 102, 255, 0.12)' : '#EFF6FF')
                        : isAdvance
                          ? (isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF')
                          : (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5'),
                      borderColor: isProforma
                        ? (isDark ? '#1E3A8A' : '#BFDBFE')
                        : isAdvance
                          ? (isDark ? '#4C1D95' : '#DDD6FE')
                          : (isDark ? '#065F46' : '#A7F3D0'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.docTypeBadgeText,
                      {
                        color: isProforma
                          ? '#0066FF'
                          : isAdvance
                            ? '#8B5CF6'
                            : '#10B981',
                      },
                    ]}
                  >
                    {isProforma ? 'PROFORMA' : isAdvance ? 'ADVANCE' : 'TAX INVOICE'}
                  </Text>
                </View>

                {inv.project?.capacity && (
                  <View
                    style={[
                      styles.capacityMiniBadge,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Zap size={10} color="#0066FF" />
                    <Text style={[styles.capacityMiniText, { color: colors.text }]}>
                      {inv.project.capacity} kWp
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                {inv.customer?.name || inv.project?.name || 'Customer Account'}
              </Text>

              <View style={styles.locationRow}>
                <MapPin size={11} color={colors.textMuted} />
                <Text style={[styles.customerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {inv.customer?.city || 'Site Location'}
                  {inv.customer?.mobile ? ` • ${inv.customer.mobile}` : ''}
                </Text>
              </View>
            </View>

            {/* STATUS BADGE */}
            {isOverdue ? (() => {
              const aging = getAgingBadge(inv.dueDate);
              return (
                <View style={[styles.statusPill, { backgroundColor: aging.bg, borderColor: aging.color }]}>
                  <Text style={[styles.statusPillText, { color: aging.color }]}>
                    {aging.label}
                  </Text>
                </View>
              );
            })() : (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isPaid
                      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                      : totalPaid > 0
                        ? (isDark ? 'rgba(0, 102, 255, 0.15)' : '#EFF6FF')
                        : (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB'),
                    borderColor: isPaid
                      ? '#10B981'
                      : totalPaid > 0
                        ? '#0066FF'
                        : '#F59E0B',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: isPaid
                        ? '#10B981'
                        : totalPaid > 0
                          ? '#0066FF'
                          : '#D97706',
                    },
                  ]}
                >
                  {isPaid ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                </Text>
              </View>
            )}
          </View>

          {/* SCOPE & DUE DATE */}
          <View style={styles.scopeRow}>
            <Text style={[styles.scopeText, { color: colors.textSecondary }]} numberOfLines={1}>
              {inv.milestoneTitle || 'Complete Turnkey Rooftop Solar Supply & Installation'}
            </Text>
            {inv.dueDate && (
              <Text style={[styles.dueDateText, { color: isOverdue ? '#EF4444' : colors.textMuted }]}>
                Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>

          {/* FINANCIAL BREAKDOWN BOX */}
          <View
            style={[
              styles.metricsBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>INVOICE TOTAL</Text>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                ₹{(inv.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>COLLECTED</Text>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>BALANCE DUE</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: balance > 0 ? '#F59E0B' : colors.textMuted },
                ]}
              >
                ₹{balance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* PAYMENT PROGRESS TRACK */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: isPaid ? '#10B981' : progress > 0 ? '#0066FF' : '#94A3B8',
                },
              ]}
            />
          </View>

          {/* EXPANDABLE PAYMENTS HISTORY */}
          {inv.payments && inv.payments.length > 0 && (
            <TouchableOpacity
              style={styles.expandHistoryBtn}
              onPress={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandHistoryText}>
                {inv.payments.length} Transaction{inv.payments.length > 1 ? 's' : ''} Recorded
              </Text>
              {isExpanded ? (
                <ChevronUp size={14} color="#10B981" />
              ) : (
                <ChevronDown size={14} color="#10B981" />
              )}
            </TouchableOpacity>
          )}

          {isExpanded && inv.payments && (
            <View
              style={[
                styles.paymentHistoryBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              {inv.payments.map((p: any, pIdx: number) => (
                <View key={pIdx} style={styles.paymentHistoryRow}>
                  <View>
                    <Text style={[styles.paymentHistoryMode, { color: colors.text }]}>
                      {p.mode || 'UPI'} • {p.reference ? `Ref: ${p.reference}` : 'Verified'}
                    </Text>
                    <Text style={[styles.paymentHistoryDate, { color: colors.textMuted }]}>
                      {p.date ? new Date(p.date).toLocaleDateString() : 'Recorded'}
                    </Text>
                  </View>
                  <Text style={styles.paymentHistoryAmt}>
                    +₹{(p.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ACTION BUTTONS ROW */}
          <View style={[styles.cardActionsRow, { borderTopColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.pdfBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                },
              ]}
              onPress={() => handleOpenPdfModal(inv)}
              activeOpacity={0.85}
            >
              <FileText size={13} color="#0066FF" />
              <Text style={styles.pdfBtnText}>PDF Invoice</Text>
            </TouchableOpacity>

            {!isPaid && (
              <TouchableOpacity
                style={styles.recordPayBtn}
                onPress={() => handleOpenPaymentModal(inv)}
                activeOpacity={0.85}
              >
                <CreditCard size={13} color="#FFFFFF" />
                <Text style={styles.recordPayBtnText}>Record Pay</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.whatsappBtn,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                  borderColor: isDark ? '#065F46' : '#A7F3D0',
                },
                isPaid && { flex: 1 },
              ]}
              onPress={() => handleSendWhatsAppReminder(inv)}
              activeOpacity={0.85}
            >
              <MessageCircle size={13} color="#10B981" />
              <Text style={styles.whatsappBtnText}>
                {isPaid ? 'Share' : 'Remind'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [colors, isDark, expandedInvoiceId]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* GLOBAL HEADER */}
      <Header
        title="Finance & Billing"
        subtitle="EPC milestone invoices, collections ledger & DBT subsidies"
      />

      <FlatList
        data={filteredInvoices}
        keyExtractor={keyExtractor}
        renderItem={renderInvoiceItem}
        getItemLayout={getItemLayout}
        windowSize={7}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        removeClippedSubviews={Platform.OS === 'android'}
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* EXECUTIVE FINANCIAL OVERVIEW */}
            <View
              style={[
                styles.executiveCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.kpiRow}>
                <View style={styles.kpiCol}>
                  <View style={styles.kpiTopRow}>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
                      COLLECTIONS REALIZED
                    </Text>
                    <TrendingUp size={13} color="#10B981" />
                  </View>
                  <Text style={[styles.kpiVal, { color: colors.text }]}>
                    ₹{(stats.totalRevenue / 100000).toFixed(2)}L
                  </Text>
                  <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
                    ₹{stats.totalRevenue.toLocaleString('en-IN')} received
                  </Text>
                </View>

                <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

                <View style={styles.kpiCol}>
                  <View style={styles.kpiTopRow}>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
                      RECEIVABLES
                    </Text>
                    <Clock size={13} color="#F59E0B" />
                  </View>
                  <Text style={[styles.kpiVal, { color: '#0066FF' }]}>
                    ₹{(stats.outstanding / 100000).toFixed(2)}L
                  </Text>
                  <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
                    Active milestone balance
                  </Text>
                </View>
              </View>

              {/* Realization Progress Bar */}
              <View style={styles.capitalTrackContainer}>
                <View style={styles.capitalTrackLabels}>
                  <Text style={styles.capitalTrackLeftText}>
                    {stats.totalRevenue + stats.outstanding > 0
                      ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.outstanding)) * 100)
                      : 65}
                    % Collected
                  </Text>
                  <Text style={[styles.capitalTrackRightText, { color: colors.textMuted }]}>
                    Total Book: ₹{((stats.totalRevenue + stats.outstanding) / 100000).toFixed(1)}L
                  </Text>
                </View>

                <View style={[styles.capitalProgressBar, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <View
                    style={[
                      styles.capitalProgressFill,
                      {
                        width: `${stats.totalRevenue + stats.outstanding > 0
                            ? Math.min(
                              100,
                              Math.round(
                                (stats.totalRevenue / (stats.totalRevenue + stats.outstanding)) * 100
                              )
                            )
                            : 65
                          }%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* OVERDUE NOTICE WITH 3-TIER AGING */}
            {stats.overdueCount > 0 && (
              <View
                style={[
                  styles.overdueNoticeCard,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FFF1F2',
                    borderColor: isDark ? '#991B1B' : '#FECDD3',
                  },
                ]}
              >
                <View style={styles.overdueNoticeLeft}>
                  <AlertTriangle size={18} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.overdueNoticeTitle}>
                      {stats.overdueCount} Milestone Invoice{stats.overdueCount > 1 ? 's' : ''} Past Due
                    </Text>
                    <Text style={styles.overdueNoticeSub}>
                      ₹{stats.overdueAmount.toLocaleString('en-IN')} pending collection
                    </Text>

                    <View style={styles.agingPillRow}>
                      <View style={styles.agingPill}>
                        <Text style={styles.agingPillTextAmber}>&lt;15d: {agingStats.under15}</Text>
                      </View>
                      <View style={styles.agingPill}>
                        <Text style={styles.agingPillTextOrange}>15-30d: {agingStats.between15and30}</Text>
                      </View>
                      <View style={styles.agingPill}>
                        <Text style={styles.agingPillTextRed}>&gt;30d: {agingStats.over30}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.overdueActionBtn}
                  onPress={() => {
                    haptics.selection();
                    setStatusFilter('OVERDUE');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overdueActionBtnText}>Filter</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PM SURYA GHAR DBT SUBSIDY TRACKER */}
            <View
              style={[
                styles.subsidyBanner,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.subsidyBannerLeft}>
                <View
                  style={[
                    styles.subsidyIconCircle,
                    { backgroundColor: isDark ? 'rgba(0, 102, 255, 0.15)' : '#EFF6FF' },
                  ]}
                >
                  <ShieldCheck size={18} color="#0066FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subsidyBannerTitle, { color: colors.text }]}>
                    PM Surya Ghar DBT Subsidy
                  </Text>
                  <Text style={[styles.subsidyBannerSub, { color: colors.textSecondary }]}>
                    Central Financial Assistance to consumer accounts
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.subsidyBannerRight,
                  { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
                ]}
              >
                <Text style={styles.subsidyBannerVal}>
                  ₹{(stats.expectedSubsidies / 100000).toFixed(2)}L
                </Text>
              </View>
            </View>

            {/* CANONICAL 4-STAGE MILESTONE SCHEDULE CARD */}
            <View
              style={[
                styles.milestonesCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.milestonesHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Receipt size={14} color="#10B981" />
                  <Text style={[styles.milestonesTitle, { color: colors.text }]}>
                    Statutory 13.8% Composite Solar GST
                  </Text>
                </View>
                <View
                  style={[
                    styles.gstRuleBadge,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                      borderColor: isDark ? '#065F46' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text style={styles.gstRuleText}>70:30 Rule</Text>
                </View>
              </View>

              <Text style={[styles.gstSubText, { color: colors.textSecondary }]}>
                70% Goods (@ 12%) + 30% Services (@ 18%) = 13.8% effective composite rate
              </Text>

              <View style={styles.milestonesGrid}>
                {[
                  { pct: '20%', name: 'Advance', desc: 'Design & Token' },
                  { pct: '60%', name: 'Material', desc: 'Site Delivery' },
                  { pct: '15%', name: 'Erection', desc: 'Install & QA' },
                  { pct: '5%', name: 'Sync', desc: 'Net-Meter/DBT' },
                ].map((m) => (
                  <View
                    key={m.pct}
                    style={[
                      styles.milestoneGridItem,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={styles.milestoneGridPct}>{m.pct}</Text>
                    <Text style={[styles.milestoneGridName, { color: colors.text }]}>{m.name}</Text>
                    <Text style={[styles.milestoneGridDesc, { color: colors.textMuted }]} numberOfLines={1}>
                      {m.desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CREATE INVOICE QUICK BANNER */}
            <View
              style={[
                styles.createInvoiceBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.createInvoiceBarTitle, { color: colors.text }]}>
                  Smart Commercial Invoicing
                </Text>
                <Text style={[styles.createInvoiceBarSub, { color: colors.textSecondary }]}>
                  GST Tax Invoices, Bank Proformas & Advance Receipts
                </Text>
              </View>
              <TouchableOpacity
                style={styles.createInvoiceBtn}
                onPress={() => setCreateInvoiceModalVisible(true)}
                activeOpacity={0.85}
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.createInvoiceBtnText}>New Invoice</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH AND FILTER SECTION */}
            <View style={styles.filterSection}>
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Search size={15} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search invoice #, customer name, mobile..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* STATUS FILTER CHIPS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {(['ALL', 'OVERDUE', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((filterKey) => {
                  const isActive = statusFilter === filterKey;
                  return (
                    <TouchableOpacity
                      key={filterKey}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: isActive ? '#0066FF' : colors.surface,
                          borderColor: isActive ? '#0066FF' : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setStatusFilter(filterKey);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          {
                            color: isActive ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isActive ? '700' : '600',
                          },
                        ]}
                      >
                        {filterKey === 'ALL'
                          ? `All Status`
                          : filterKey === 'OVERDUE'
                            ? `Overdue (${stats.overdueCount})`
                            : filterKey === 'UNPAID'
                              ? 'Unpaid'
                              : filterKey === 'PARTIAL'
                                ? 'Partial'
                                : 'Paid'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* DOCUMENT TYPE FILTER CHIPS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipsContainer, { marginTop: 6 }]}
              >
                {[
                  { key: 'ALL' as const, label: `All Types (${invoices.length})` },
                  { key: 'TAX_INVOICE' as const, label: 'Tax Invoices' },
                  { key: 'PROFORMA' as const, label: 'Bank Proformas' },
                  { key: 'ADVANCE' as const, label: 'Advance Vouchers' },
                ].map((docItem) => {
                  const isActive = docCategoryFilter === docItem.key;
                  return (
                    <TouchableOpacity
                      key={docItem.key}
                      style={[
                        styles.docFilterChip,
                        {
                          backgroundColor: isActive
                            ? (isDark ? '#1E293B' : '#0F172A')
                            : colors.surface,
                          borderColor: isActive
                            ? (isDark ? '#334155' : '#0F172A')
                            : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setDocCategoryFilter(docItem.key);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.docFilterChipText,
                          {
                            color: isActive ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isActive ? '700' : '600',
                          },
                        ]}
                      >
                        {docItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* INVOICES SECTION HEADER */}
            <View style={styles.invoicesHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Invoices & Commercial Bills ({filteredInvoices.length})
              </Text>
              <TouchableOpacity
                style={[styles.refreshIconBtn, { backgroundColor: colors.surface }]}
                onPress={fetchFinanceData}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              <SkeletonLoader.Card />
              <SkeletonLoader.Card />
            </View>
          ) : (
            <EmptyState
              icon={<Receipt size={36} color={colors.textMuted} />}
              title="No Invoices Found"
              description={
                statusFilter !== 'ALL'
                  ? `No invoices matching '${statusFilter}' status.`
                  : 'Convert a lead into an onboarding project to automatically generate milestone payment cycles.'
              }
              actionTitle={statusFilter !== 'ALL' ? 'Show All Invoices' : undefined}
              onActionPress={() => setStatusFilter('ALL')}
            />
          )
        }
      />

      {/* RECORD PAYMENT MODAL */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.modalDragHandle} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Record Customer Payment</Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  {selectedInvoice?.invoiceNumber} • {selectedInvoice?.customer?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={() => setPaymentModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* BALANCE SUMMARY */}
              <View
                style={[
                  styles.modalSummaryBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.modalSummaryRow}>
                  <Text style={[styles.modalSummaryLabel, { color: colors.textSecondary }]}>Milestone Total:</Text>
                  <Text style={[styles.modalSummaryVal, { color: colors.text }]}>
                    ₹{(selectedInvoice?.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={[styles.modalSummaryLabel, { color: colors.textSecondary }]}>Pending Balance:</Text>
                  <Text style={[styles.modalSummaryVal, { color: '#F59E0B', fontWeight: '800' }]}>
                    ₹{(selectedInvoice?.balance ?? selectedInvoice?.amount ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* PAYMENT AMOUNT INPUT */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT RECEIVED (₹) *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="e.g. 50000"
                placeholderTextColor={colors.textMuted}
              />

              {/* PAYMENT MODE PICKER */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT METHOD</Text>
              <View style={styles.modePickerRow}>
                {(['UPI', 'NEFT', 'CHEQUE', 'CASH'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeChip,
                      {
                        backgroundColor: payMode === mode ? '#10B981' : isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: payMode === mode ? '#10B981' : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setPayMode(mode)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        {
                          color: payMode === mode ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: payMode === mode ? '800' : '600',
                        },
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* TRANSACTION REFERENCE / UTR */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                TRANSACTION REFERENCE / UTR NO.
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                value={payRef}
                onChangeText={setPayRef}
                placeholder="e.g. UPI/428910293812 or Chq #4401"
                placeholderTextColor={colors.textMuted}
              />

              {/* OPTIONAL NOTES */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INTERNAL NOTES</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    height: 60,
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                multiline
                value={payNotes}
                onChangeText={setPayNotes}
                placeholder="e.g. Advance paid at site during structural layout"
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitPayBtn}
              onPress={handleSubmitPayment}
              disabled={submittingPayment}
              activeOpacity={0.85}
            >
              {submittingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitPayBtnText}>Confirm & Post Payment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PDF INVOICE PREVIEW & ACTIONS MODAL */}
      <InvoicePdfModal
        visible={pdfModalVisible}
        onClose={() => {
          setPdfModalVisible(false);
          setPdfTargetInvoice(null);
        }}
        invoice={pdfTargetInvoice}
      />

      {/* SMART INVOICE CREATOR MODAL */}
      <CreateInvoiceModal
        visible={createInvoiceModalVisible}
        onClose={() => setCreateInvoiceModalVisible(false)}
        onSuccess={() => fetchFinanceData()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  skeletonContainer: {
    paddingVertical: 12,
    gap: 12,
  },

  // EXECUTIVE OVERVIEW
  executiveCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kpiCol: {
    flex: 1,
  },
  kpiDivider: {
    width: 1,
    height: 38,
    marginHorizontal: 12,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  kpiSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  capitalTrackContainer: {},
  capitalTrackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capitalTrackLeftText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  capitalTrackRightText: {
    fontSize: 10,
    fontWeight: '600',
  },
  capitalProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capitalProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },

  // OVERDUE NOTICE
  overdueNoticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  overdueNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  overdueNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  overdueNoticeSub: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 1,
  },
  agingPillRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  agingPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  agingPillTextAmber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  agingPillTextOrange: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
  },
  agingPillTextRed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  overdueActionBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  overdueActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // SUBSIDY BANNER
  subsidyBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  subsidyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subsidyIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subsidyBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  subsidyBannerSub: {
    fontSize: 10,
    marginTop: 1,
  },
  subsidyBannerRight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subsidyBannerVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
    fontVariant: ['tabular-nums'],
  },

  // CANONICAL MILESTONES
  milestonesCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  milestonesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestonesTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  gstRuleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  gstRuleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  gstSubText: {
    fontSize: 10,
    marginBottom: 10,
  },
  milestonesGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  milestoneGridItem: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  milestoneGridPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
  },
  milestoneGridName: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  milestoneGridDesc: {
    fontSize: 8,
    marginTop: 1,
  },

  // CREATE INVOICE BAR
  createInvoiceBar: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  createInvoiceBarTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  createInvoiceBarSub: {
    fontSize: 10,
    marginTop: 1,
  },
  createInvoiceBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  createInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // FILTER SECTION
  filterSection: {
    marginBottom: 12,
  },
  searchBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 11,
  },
  docFilterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  docFilterChipText: {
    fontSize: 10,
  },

  // INVOICES LIST HEADER
  invoicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  refreshIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // INVOICE CARD
  invoiceCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invoiceNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  docTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  docTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  capacityMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  capacityMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  customerSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scopeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  expandHistoryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 6,
  },
  expandHistoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  paymentHistoryBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    gap: 8,
  },
  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentHistoryMode: {
    fontSize: 11,
    fontWeight: '700',
  },
  paymentHistoryDate: {
    fontSize: 10,
    marginTop: 1,
  },
  paymentHistoryAmt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    fontVariant: ['tabular-nums'],
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  pdfBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  pdfBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  recordPayBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  recordPayBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  whatsappBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  whatsappBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSummaryBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    gap: 6,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalSummaryVal: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    fontWeight: '600',
  },
  modePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeChipText: {
    fontSize: 11,
  },
  submitPayBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  submitPayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
