import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import {
  Receipt,
  Search,
  Filter,
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
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase,
  Sparkles,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
import { CreateInvoiceModal } from '../../components/CreateInvoiceModal';
import { financeApi } from '../../api/endpoints';
import { colors } from '../../theme/colors';

export const FinanceScreen: React.FC<{ navigation?: any; route?: any }> = ({ navigation, route }) => {
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

  useEffect(() => {
    if (route?.params?.customerName) {
      setSearchQuery(route.params.customerName);
    }
    fetchFinanceData();
  }, [route?.params]);

  const fetchFinanceData = async () => {
    try {
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

      if (statsRes && statsRes.stats) {
        setStats({
          totalRevenue: statsRes.stats.totalCollected || 0,
          outstanding: statsRes.stats.outstanding || 0,
          overdueAmount: statsRes.stats.overdueAmount || 0,
          overdueCount: statsRes.stats.overdueCount || 0,
          expectedSubsidies: statsRes.stats.expectedSubsidies || 0,
          paidCount: statsRes.stats.paidCount || 0,
          unpaidCount: statsRes.stats.unpaidCount || 0,
        });
      }

      if (finRes && Array.isArray(finRes.finance)) {
        setInvoices(finRes.finance);
      }
    } catch (err: any) {
      console.warn('Finance fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Text Search
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        (inv.invoiceNumber || '').toLowerCase().includes(search) ||
        (inv.customer?.name || '').toLowerCase().includes(search) ||
        (inv.project?.name || '').toLowerCase().includes(search) ||
        (inv.customer?.mobile || '').includes(search);

      if (!matchSearch) return false;

      // 2. Status Filter
      const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const isPaid = (inv.computedStatus || inv.status) === 'PAID';
      const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < new Date() && !isPaid);

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'OVERDUE') return isOverdue;
      if (statusFilter === 'UNPAID') return !isPaid && totalPaid === 0 && !isOverdue;
      if (statusFilter === 'PARTIAL') return !isPaid && totalPaid > 0 && !isOverdue;
      if (statusFilter === 'PAID') return isPaid;

      // 3. Document Category Filter (Tax Invoice, Proforma, Advance)
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
  }, [invoices, searchQuery, statusFilter, docCategoryFilter]);

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
        'Payment Recorded! 🎉',
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
        // Fallback WhatsApp message
        const phone = (inv.customer?.mobile || '').replace(/[^0-9]/g, '');
        if (!phone) {
          Alert.alert('Missing Phone', 'No customer phone number registered for this invoice.');
          return;
        }
        const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const balance = inv.balance ?? Math.max(0, (inv.amount || 0) - totalPaid);
        const msg = `☀️ *Payment Reminder - Solar EPC Milestone*\n\nDear ${
          inv.customer?.name || 'Customer'
        },\n\nThis is a friendly reminder regarding your solar project invoice:\n• Invoice No: *${
          inv.invoiceNumber
        }*\n• Milestone: *${inv.milestone || 'Project Milestone'}*\n• Total Amount: ₹${(
          inv.amount || 0
        ).toLocaleString('en-IN')}\n• Balance Due: *₹${balance.toLocaleString(
          'en-IN'
        )}*\n\nPlease complete the payment via UPI or Bank Transfer to proceed with installation stages.\n\nThank you!\n*WhereReady Solar OS*`;
        const url = `whatsapp://send?phone=${phone.startsWith('91') ? phone : '91' + phone}&text=${encodeURIComponent(
          msg
        )}`;
        await Linking.openURL(url);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Could not open WhatsApp. Ensure WhatsApp is installed.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Finance & Billing"
        subtitle="EPC Milestone Invoicing, DBT Subsidies & Cashflow"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#059669' }]}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>COLLECTIONS REALIZED</Text>
              <TrendingUp size={16} color="#a7f3d0" />
            </View>
            <Text style={styles.kpiVal}>₹{(stats.totalRevenue / 100000).toFixed(2)}L</Text>
            <Text style={styles.kpiSub}>₹{stats.totalRevenue.toLocaleString('en-IN')} total received</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#d97706' }]}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>OUTSTANDING RECEIVABLES</Text>
              <Clock size={16} color="#fde68a" />
            </View>
            <Text style={styles.kpiVal}>₹{(stats.outstanding / 100000).toFixed(2)}L</Text>
            <Text style={styles.kpiSub}>Active milestone balances</Text>
          </View>
        </View>

        {/* OVERDUE ALERTS CARD */}
        {stats.overdueCount > 0 && (
          <View style={styles.overdueNoticeCard}>
            <View style={styles.overdueNoticeLeft}>
              <AlertTriangle size={18} color="#e11d48" />
              <View style={{ flex: 1 }}>
                <Text style={styles.overdueNoticeTitle}>
                  {stats.overdueCount} Milestone Invoice{stats.overdueCount > 1 ? 's' : ''} Past Due Date
                </Text>
                <Text style={styles.overdueNoticeSub}>
                  Total ₹{stats.overdueAmount.toLocaleString('en-IN')} pending immediate collection
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.overdueActionBtn}
              onPress={() => setStatusFilter('OVERDUE')}
              activeOpacity={0.8}
            >
              <Text style={styles.overdueActionBtnText}>View Overdue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PM SURYA GHAR DBT SUBSIDY TRACKER */}
        <View style={styles.subsidyBanner}>
          <View style={styles.subsidyBannerLeft}>
            <ShieldCheck size={20} color="#2563eb" />
            <View style={{ flex: 1 }}>
              <Text style={styles.subsidyBannerTitle}>PM Surya Ghar DBT Subsidy Pipeline</Text>
              <Text style={styles.subsidyBannerSub}>
                Direct Central Financial Assistance to consumer bank accounts
              </Text>
            </View>
          </View>
          <View style={styles.subsidyBannerRight}>
            <Text style={styles.subsidyBannerVal}>
              ₹{(stats.expectedSubsidies / 100000).toFixed(2)} Lakhs
            </Text>
          </View>
        </View>

        {/* SMART COMMERCIAL INVOICE GENERATOR BANNER */}
        <View style={styles.createInvoiceBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.createInvoiceBarTitle}>Smart Commercial Invoicing</Text>
            <Text style={styles.createInvoiceBarSub}>
              GST Tax Invoices, Bank Proformas & Advance Receipts
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createInvoiceBtn}
            onPress={() => setCreateInvoiceModalVisible(true)}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#ffffff" strokeWidth={2.8} />
            <Text style={styles.createInvoiceBtnText}>New Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH AND FILTER BAR */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search invoice #, customer name, mobile..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* STATUS PILL BUTTONS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsContainer}>
            {(['ALL', 'OVERDUE', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((filterKey) => {
              const isActive = statusFilter === filterKey;
              return (
                <TouchableOpacity
                  key={filterKey}
                  style={[styles.statusChip, isActive && styles.statusChipActive]}
                  onPress={() => setStatusFilter(filterKey)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
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

          {/* COMMERCIAL DOCUMENT TYPE FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.statusChipsContainer, { marginTop: 8 }]}>
            {([
              { key: 'ALL', label: `All Invoices (${invoices.length})` },
              { key: 'TAX_INVOICE', label: '📄 Tax Invoices' },
              { key: 'PROFORMA', label: '🏦 Bank Proformas' },
              { key: 'ADVANCE', label: '💳 Advance Vouchers' },
            ] as const).map((docItem) => {
              const isActive = docCategoryFilter === docItem.key;
              return (
                <TouchableOpacity
                  key={docItem.key}
                  style={[styles.milestoneChip, isActive && styles.milestoneChipActive]}
                  onPress={() => setDocCategoryFilter(docItem.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.milestoneChipText, isActive && styles.milestoneChipTextActive]}>
                    {docItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* INVOICES SECTION */}
        <View style={styles.invoicesHeaderRow}>
          <Text style={styles.sectionTitle}>
            Invoices & Commercial Bills ({filteredInvoices.length})
          </Text>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={fetchFinanceData}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color="#64748b" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Syncing financial ledgers & milestone invoices...</Text>
          </View>
        ) : filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Receipt size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySub}>
              {statusFilter !== 'ALL'
                ? `No invoices matching '${statusFilter}' status.`
                : 'Convert a lead into an onboarding project to automatically generate milestone payment cycles.'}
            </Text>
            {statusFilter !== 'ALL' && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => setStatusFilter('ALL')}
                activeOpacity={0.8}
              >
                <Text style={styles.clearFilterBtnText}>Show All Invoices</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredInvoices.map((inv) => {
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
              <View key={inv.id} style={styles.invoiceCard}>
                {/* INVOICE CARD TOP */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.invoiceNumber}>{inv.invoiceNumber || 'INV-2026'}</Text>
                      {inv.project?.capacity && (
                        <View style={styles.capacityBadge}>
                          <Text style={styles.capacityBadgeText}>{inv.project.capacity} kWp</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.customerName}>
                      {inv.customer?.name || inv.project?.name || 'Customer Account'}
                    </Text>
                    <Text style={styles.customerSub}>
                      📍 {inv.customer?.city || 'Site Location'} {inv.customer?.mobile ? `• 📞 ${inv.customer.mobile}` : ''}
                    </Text>
                  </View>

                  {/* STATUS BADGE */}
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
                      {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                    </Text>
                  </View>
                </View>

                {/* DOCUMENT TYPE & BILLING SCOPE */}
                <View style={styles.milestoneTagRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                    <View
                      style={[
                        styles.docTypePill,
                        isProforma
                          ? styles.docTypePillProforma
                          : isAdvance
                          ? styles.docTypePillAdvance
                          : styles.docTypePillTax,
                      ]}
                    >
                      <Text
                        style={[
                          styles.docTypePillText,
                          isProforma
                            ? styles.docTypePillTextProforma
                            : isAdvance
                            ? styles.docTypePillTextAdvance
                            : styles.docTypePillTextTax,
                        ]}
                      >
                        {isProforma ? 'PROFORMA' : isAdvance ? 'ADVANCE' : 'TAX INVOICE'}
                      </Text>
                    </View>
                    <Text style={styles.invoiceScopeText} numberOfLines={1}>
                      {inv.milestoneTitle || 'Complete Turnkey Rooftop Solar Supply & Installation'}
                    </Text>
                  </View>
                  {inv.dueDate && (
                    <Text style={[styles.dueDateText, isOverdue && { color: '#e11d48', fontWeight: '700' }]}>
                      Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>

                {/* FINANCIAL METRICS BREAKDOWN */}
                <View style={styles.financialMetricsBox}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricColLabel}>Invoice Total</Text>
                    <Text style={styles.metricColVal}>₹{(inv.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricColLabel}>Paid</Text>
                    <Text style={[styles.metricColVal, { color: '#059669' }]}>
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricColLabel}>Balance Due</Text>
                    <Text style={[styles.metricColVal, { color: balance > 0 ? '#d97706' : '#64748b', fontWeight: '800' }]}>
                      ₹{balance.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* PAYMENT PROGRESS BAR */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: isPaid ? '#10b981' : progress > 0 ? '#2563eb' : '#e2e8f0',
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
                      {inv.payments.length} Payment Transaction{inv.payments.length > 1 ? 's' : ''} Recorded
                    </Text>
                    {isExpanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                  </TouchableOpacity>
                )}

                {isExpanded && inv.payments && (
                  <View style={styles.paymentHistoryBox}>
                    {inv.payments.map((p: any, pIdx: number) => (
                      <View key={pIdx} style={styles.paymentHistoryRow}>
                        <View>
                          <Text style={styles.paymentHistoryMode}>
                            💳 {p.mode || 'UPI'} • {p.reference ? `Ref: ${p.reference}` : 'Confirmed'}
                          </Text>
                          <Text style={styles.paymentHistoryDate}>
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
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.pdfInvoiceBtn}
                    onPress={() => handleOpenPdfModal(inv)}
                    activeOpacity={0.85}
                  >
                    <FileText size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.pdfInvoiceBtnText}>PDF Invoice</Text>
                  </TouchableOpacity>

                  {!isPaid && (
                    <TouchableOpacity
                      style={styles.recordPayBtn}
                      onPress={() => handleOpenPaymentModal(inv)}
                      activeOpacity={0.85}
                    >
                      <CreditCard size={14} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.recordPayBtnText}>Record Pay</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.whatsappNoticeBtn, isPaid && { flex: 1 }]}
                    onPress={() => handleSendWhatsAppReminder(inv)}
                    activeOpacity={0.85}
                  >
                    <MessageCircle size={14} color="#15803d" style={{ marginRight: 4 }} />
                    <Text style={styles.whatsappNoticeBtnText}>
                      {isPaid ? 'Share WA' : 'WA Notice'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* RECORD PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Customer Payment</Text>
                <Text style={styles.modalSub}>
                  {selectedInvoice?.invoiceNumber} • {selectedInvoice?.customer?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPaymentModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* BALANCE SUMMARY */}
              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Milestone Total:</Text>
                  <Text style={styles.modalSummaryVal}>₹{(selectedInvoice?.amount || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Pending Balance:</Text>
                  <Text style={[styles.modalSummaryVal, { color: '#d97706', fontWeight: '800' }]}>
                    ₹{(selectedInvoice?.balance ?? selectedInvoice?.amount ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* PAYMENT AMOUNT INPUT */}
              <Text style={styles.inputLabel}>AMOUNT RECEIVED (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="e.g. 50000"
                placeholderTextColor="#94a3b8"
              />

              {/* PAYMENT MODE PICKER */}
              <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
              <View style={styles.modePickerRow}>
                {(['UPI', 'NEFT', 'CHEQUE', 'CASH'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeChip, payMode === mode && styles.modeChipSelected]}
                    onPress={() => setPayMode(mode)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modeChipText, payMode === mode && styles.modeChipTextSelected]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* TRANSACTION REFERENCE / UTR */}
              <Text style={styles.inputLabel}>TRANSACTION REFERENCE / UTR NO.</Text>
              <TextInput
                style={styles.modalInput}
                value={payRef}
                onChangeText={setPayRef}
                placeholder="e.g. UPI/428910293812 or Chq #4401"
                placeholderTextColor="#94a3b8"
              />

              {/* OPTIONAL NOTES */}
              <Text style={styles.inputLabel}>INTERNAL NOTES</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                multiline
                value={payNotes}
                onChangeText={setPayNotes}
                placeholder="e.g. Advance paid at site during structural layout"
                placeholderTextColor="#94a3b8"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitPayBtn}
              onPress={handleSubmitPayment}
              disabled={submittingPayment}
              activeOpacity={0.85}
            >
              {submittingPayment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
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
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  kpiSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
    fontWeight: '500',
  },
  overdueNoticeCard: {
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 12,
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#9f1239',
  },
  overdueNoticeSub: {
    fontSize: 11,
    color: '#be123c',
    marginTop: 1,
  },
  overdueActionBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  overdueActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  subsidyBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subsidyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subsidyBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
  },
  subsidyBannerSub: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 1,
  },
  subsidyBannerRight: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  subsidyBannerVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1d4ed8',
  },
  createInvoiceBar: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  createInvoiceBarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  createInvoiceBarSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  createInvoiceBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  docTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  docTypePillTax: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  docTypePillProforma: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  docTypePillAdvance: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  docTypePillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  docTypePillTextTax: {
    color: '#059669',
  },
  docTypePillTextProforma: {
    color: '#2563eb',
  },
  docTypePillTextAdvance: {
    color: '#7c3aed',
  },
  invoiceScopeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  filterSection: {
    marginBottom: 14,
  },
  searchBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  statusChipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  statusChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  invoicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  refreshIconBtn: {
    padding: 6,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 14,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  capacityBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  capacityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
  },
  customerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontSize: 10,
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
  milestoneTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  milestoneTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestoneTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  dueDateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  financialMetricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  metricColVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  expandHistoryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  expandHistoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  paymentHistoryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
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
    color: '#334155',
  },
  paymentHistoryDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  paymentHistoryAmt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  recordPayBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordPayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  whatsappNoticeBtn: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappNoticeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  modalSummaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  modePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modeChipTextSelected: {
    color: '#ffffff',
  },
  submitPayBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  submitPayBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  milestoneChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestoneChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  milestoneChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  milestoneChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pdfInvoiceBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
});
