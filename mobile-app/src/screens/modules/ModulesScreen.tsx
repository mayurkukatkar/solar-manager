import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { quotationsApi, superAdminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Quotation, Tenant } from '../../types';

export const ModulesScreen: React.FC<{ route?: any; navigation?: any }> = ({ route }) => {
  const { user } = useAuth();

  // Active Sub-Module Modal
  const [activeSubModule, setActiveSubModule] = useState<string | null>(
    route?.params?.openQuote ? 'QUOTES' : route?.params?.screen || null
  );

  // 60-Second Quotation Calculator State
  const [monthlyUnits, setMonthlyUnits] = useState('420');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Super Admin Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Compute 60-second solar quotation economics
  const units = parseFloat(monthlyUnits) || 300;
  const kwCapacity = Math.min(10, Math.max(1, Math.round((units / 120) * 10) / 10)); // ~120 units per kW/month
  const grossCost = Math.round(kwCapacity * 60000);

  // PM Surya Ghar Central Financial Assistance (CFA) Rules
  let subsidy = 0;
  if (kwCapacity <= 1) subsidy = 30000;
  else if (kwCapacity <= 2) subsidy = 60000;
  else subsidy = 78000;

  const netPayable = grossCost - subsidy;
  const monthlySavings = Math.round(kwCapacity * 120 * 8.5); // avg tariff ~Rs 8.5/unit
  const paybackYears = (netPayable / (monthlySavings * 12)).toFixed(1);

  const fetchQuotations = async () => {
    setLoadingQuotes(true);
    try {
      const res = await quotationsApi.getQuotations();
      if (res && Array.isArray(res.quotations)) {
        setQuotations(res.quotations);
      }
    } catch (err: any) {
      console.warn('Quotations error:', err.message);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const res = await superAdminApi.getTenants();
      if (res && Array.isArray(res.tenants)) {
        setTenants(res.tenants);
      }
    } catch (err: any) {
      console.warn('Tenants error:', err.message);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleOpenModule = (id: string) => {
    setActiveSubModule(id);
    if (id === 'QUOTES') fetchQuotations();
    if (id === 'SUPER_ADMIN') fetchTenants();
  };

  const handleShareWhatsApp = () => {
    const text = `☀️ *PM Surya Ghar Solar Proposal*
Customer Estimate from *${user?.tenantName || 'Solar ERP'}*:

⚡ *Recommended System:* ${kwCapacity} kWp Grid-Tied Solar
💰 *Gross Project Cost:* ₹${grossCost.toLocaleString('en-IN')}
🏛️ *Govt. Subsidy (CFA):* -₹${subsidy.toLocaleString('en-IN')}
✅ *Net Investment Payable:* ₹${netPayable.toLocaleString('en-IN')}

📈 *Monthly Electricity Savings:* ~₹${monthlySavings.toLocaleString('en-IN')}/month
⏱️ *Full Payback Period:* ~${paybackYears} Years (Free solar power thereafter for 25 Years!)

Contact us to schedule a 3D Site Survey!`;

    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
      Alert.alert('Notice', 'Unable to launch WhatsApp directly.');
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="ERP Modules Hub"
        subtitle="Quotations, subsidy portal, finance & operations suite"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* GROUP 1: SALES & ESTIMATION */}
        <Text style={styles.groupTitle}>SALES & ESTIMATION</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('QUOTES')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#eff6ff' }]}>
              <Text style={{ fontSize: 24 }}>📄</Text>
            </View>
            <Text style={styles.moduleName}>Quotations Engine</Text>
            <Text style={styles.moduleDesc}>60s quotes, PM Surya Ghar subsidy & WhatsApp dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('SUBSIDY')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#fef3c7' }]}>
              <Text style={{ fontSize: 24 }}>🏛️</Text>
            </View>
            <Text style={styles.moduleName}>PM Surya Ghar</Text>
            <Text style={styles.moduleDesc}>DBT Subsidy tracking & DISCOM net-metering</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 2: FINANCE & INVENTORY */}
        <Text style={styles.groupTitle}>FINANCE & SUPPLY CHAIN</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('FINANCE')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Text style={{ fontSize: 24 }}>💰</Text>
            </View>
            <Text style={styles.moduleName}>Finance & Invoicing</Text>
            <Text style={styles.moduleDesc}>Revenue booked, outstanding dues & milestone billing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('INVENTORY')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#eef2ff' }]}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
            <Text style={styles.moduleName}>Inventory & Stock</Text>
            <Text style={styles.moduleDesc}>PV modules, inverters, cables & warehouse levels</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 3: CUSTOMER & SERVICE */}
        <Text style={styles.groupTitle}>SERVICE & DOCUMENT REPOSITORY</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('AMC')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#fff1f2' }]}>
              <Text style={{ fontSize: 24 }}>🛠️</Text>
            </View>
            <Text style={styles.moduleName}>AMC & Support</Text>
            <Text style={styles.moduleDesc}>Preventive maintenance visits & service tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('DOCUMENTS')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#f3e8ff' }]}>
              <Text style={{ fontSize: 24 }}>📂</Text>
            </View>
            <Text style={styles.moduleName}>Documents</Text>
            <Text style={styles.moduleDesc}>Aadhaar, electricity bills, test reports & sign-offs</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 4: PLATFORM SUPER ADMIN (AVAILABLE TO ALL OR SUPER ADMIN) */}
        <Text style={styles.groupTitle}>PLATFORM ADMINISTRATION</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('SUPER_ADMIN')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#fdf4ff' }]}>
              <Text style={{ fontSize: 24 }}>🏢</Text>
            </View>
            <Text style={styles.moduleName}>Tenants & Platform</Text>
            <Text style={styles.moduleDesc}>Multi-tenant ERP management & subscriptions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SUB-MODULE MODAL */}
      <Modal visible={!!activeSubModule} animationType="slide">
        <View style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <View>
              <Text style={styles.subModalTitle}>
                {activeSubModule === 'QUOTES' && 'Quotations & Proposal Engine'}
                {activeSubModule === 'SUBSIDY' && 'PM Surya Ghar DBT Subsidy'}
                {activeSubModule === 'FINANCE' && 'Finance & Billing Telemetry'}
                {activeSubModule === 'INVENTORY' && 'Inventory & Warehousing'}
                {activeSubModule === 'AMC' && 'AMC & Service Tickets'}
                {activeSubModule === 'DOCUMENTS' && 'Document Repository & Verification'}
                {activeSubModule === 'SUPER_ADMIN' && 'Platform Administration (Super Admin)'}
              </Text>
              <Text style={styles.subModalSubtitle}>Cloud Synchronized Module</Text>
            </View>
            <TouchableOpacity
              style={styles.closeSubModalBtn}
              onPress={() => setActiveSubModule(null)}
            >
              <Text style={styles.closeSubModalText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* 1. QUOTATIONS ENGINE */}
            {activeSubModule === 'QUOTES' && (
              <View>
                <Text style={styles.cardSectionHeader}>60-Second Instant Quotation Calculator</Text>
                <View style={styles.calcBox}>
                  <Text style={styles.inputLabel}>MONTHLY ELECTRICITY UNITS (kWh)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={monthlyUnits}
                    onChangeText={setMonthlyUnits}
                    placeholder="400"
                  />

                  <View style={styles.calcBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Recommended System:</Text>
                      <Text style={styles.breakdownBold}>{kwCapacity} kWp Rooftop Solar</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Gross Project Cost:</Text>
                      <Text style={styles.breakdownVal}>₹{grossCost.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: '#047857', fontWeight: '700' }]}>
                        Govt. Subsidy (PM Surya Ghar):
                      </Text>
                      <Text style={[styles.breakdownVal, { color: '#047857', fontWeight: '800' }]}>
                        -₹{subsidy.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                      <Text style={styles.netLabel}>Customer Net Payable:</Text>
                      <Text style={styles.netVal}>₹{netPayable.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimated Monthly Savings:</Text>
                      <Text style={[styles.breakdownVal, { color: '#2563eb' }]}>
                        ~₹{monthlySavings.toLocaleString('en-IN')}/mo
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimated Payback Period:</Text>
                      <Text style={styles.breakdownBold}>{paybackYears} Years</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
                    <Text style={styles.whatsappBtnText}>💬 Share Proposal via WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                {/* RECENT QUOTATIONS FROM LIVE BACKEND */}
                <Text style={[styles.cardSectionHeader, { marginTop: 24 }]}>
                  Recent Quotations ({quotations.length})
                </Text>
                {loadingQuotes ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : quotations.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No quotations created yet.</Text>
                  </View>
                ) : (
                  quotations.map((q) => (
                    <View key={q.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{q.qNumber}</Text>
                        <Text style={styles.quoteCustomer}>{q.customer?.name || q.lead?.name || 'Customer'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.quoteTotal}>₹{(q.total || 0).toLocaleString('en-IN')}</Text>
                        <Text style={styles.quoteStatus}>{q.status || 'DRAFT'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 2. PM SURYA GHAR SUBSIDY */}
            {activeSubModule === 'SUBSIDY' && (
              <View>
                <Text style={styles.cardSectionHeader}>Central Financial Assistance (CFA) Tracker</Text>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoTitle}>PM Surya Ghar: Muft Bijli Yojana</Text>
                  <Text style={styles.infoText}>
                    National Rooftop Solar Portal integration for Discom approval, technical feasibility, net-metering & Direct Benefit Transfer (DBT).
                  </Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>1. Consumer Registration & Sanction</Text>
                  <Text style={styles.subsidyStageStatus}>✓ Verified with Mahavitaran / MSEDCL</Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>2. Technical Feasibility & Approval</Text>
                  <Text style={styles.subsidyStageStatus}>✓ Approved for Grid Sync</Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>3. Installation & DCR Verification</Text>
                  <Text style={styles.subsidyStageStatus}>⚡ In Progress (Modules scanned)</Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>4. Net-Meter Inspection & Commissioning</Text>
                  <Text style={[styles.subsidyStageStatus, { color: '#f59e0b' }]}>⏳ Awaiting Inspection</Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>5. DBT Subsidy Release to Bank Account</Text>
                  <Text style={[styles.subsidyStageStatus, { color: '#64748b' }]}>⏳ Pending Commissioning</Text>
                </View>
              </View>
            )}

            {/* 3. FINANCE */}
            {activeSubModule === 'FINANCE' && (
              <View>
                <Text style={styles.cardSectionHeader}>Financial & Milestone Billing Overview</Text>
                <View style={styles.financeMetricsRow}>
                  <View style={[styles.financeMetricCard, { backgroundColor: colors.slate900 }]}>
                    <Text style={styles.financeMetricLabel}>TOTAL REVENUE YTD</Text>
                    <Text style={styles.financeMetricVal}>₹7,43,526</Text>
                  </View>
                  <View style={[styles.financeMetricCard, { backgroundColor: '#d97706' }]}>
                    <Text style={styles.financeMetricLabel}>OUTSTANDING</Text>
                    <Text style={styles.financeMetricVal}>₹62,52,220</Text>
                  </View>
                </View>

                <Text style={[styles.cardSectionHeader, { marginTop: 20 }]}>Payment Milestones Template</Text>
                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneTitle}>1. Advance Booking (10%)</Text>
                  <Text style={styles.milestoneSub}>Upon signing solar proposal</Text>
                </View>
                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneTitle}>2. Material Dispatch (70%)</Text>
                  <Text style={styles.milestoneSub}>Delivery of PV modules, inverter & structure</Text>
                </View>
                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneTitle}>3. Testing & Commissioning (20%)</Text>
                  <Text style={styles.milestoneSub}>Net-meter installation & Discom energization</Text>
                </View>
              </View>
            )}

            {/* 4. INVENTORY */}
            {activeSubModule === 'INVENTORY' && (
              <View>
                <Text style={styles.cardSectionHeader}>Stock & Materials Management</Text>
                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>Adani Solar Bifacial 540Wp</Text>
                    <Text style={styles.invCategory}>Category: PV Module (DCR)</Text>
                  </View>
                  <Text style={styles.invStock}>48 in stock</Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>Polycab 3.3kW On-Grid Inverter</Text>
                    <Text style={styles.invCategory}>Category: Solar Inverter</Text>
                  </View>
                  <Text style={styles.invStock}>12 in stock</Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>4 sq.mm UV Solar DC Cable (Red/Black)</Text>
                    <Text style={styles.invCategory}>Category: Balance of System</Text>
                  </View>
                  <Text style={styles.invStock}>850 meters</Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>Chemical Earthing Compound (25kg)</Text>
                    <Text style={styles.invCategory}>Category: Earthing & Safety</Text>
                  </View>
                  <Text style={styles.invStock}>24 bags</Text>
                </View>
              </View>
            )}

            {/* 5. AMC */}
            {activeSubModule === 'AMC' && (
              <View>
                <Text style={styles.cardSectionHeader}>Active Maintenance Contracts & Service</Text>
                <View style={styles.amcCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amcTitle}>Comprehensive AMC (5 Years)</Text>
                    <Text style={styles.amcClient}>Kawale Residence (5 kWp System)</Text>
                    <Text style={styles.amcDate}>Next Scheduled Cleaning: 25 Oct 2026</Text>
                  </View>
                  <View style={styles.amcBadge}>
                    <Text style={styles.amcBadgeText}>ACTIVE</Text>
                  </View>
                </View>

                <View style={styles.amcCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amcTitle}>Standard Inverter Warranty AMC</Text>
                    <Text style={styles.amcClient}>Thakre Rooftop (3.3 kWp System)</Text>
                    <Text style={styles.amcDate}>Health Check: Bi-Annual</Text>
                  </View>
                  <View style={styles.amcBadge}>
                    <Text style={styles.amcBadgeText}>ACTIVE</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 6. DOCUMENTS */}
            {activeSubModule === 'DOCUMENTS' && (
              <View>
                <Text style={styles.cardSectionHeader}>Document Verification & Readiness</Text>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Customer Aadhaar Card</Text>
                  <Text style={styles.docStatus}>✓ Verified</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Latest Electricity Bill (MSEDCL)</Text>
                  <Text style={styles.docStatus}>✓ Verified</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Property Tax Receipt / Index II</Text>
                  <Text style={styles.docStatus}>✓ Verified</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Customer Cancelled Cheque (DBT Subsidy)</Text>
                  <Text style={styles.docStatus}>✓ Verified</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Work Completion Report (WCR)</Text>
                  <Text style={[styles.docStatus, { color: '#f59e0b' }]}>⏳ Pending Inspection</Text>
                </View>
              </View>
            )}

            {/* 7. SUPER ADMIN TENANTS */}
            {activeSubModule === 'SUPER_ADMIN' && (
              <View>
                <Text style={styles.cardSectionHeader}>Platform Tenants Management</Text>
                {loadingTenants ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : tenants.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No registered tenants.</Text>
                  </View>
                ) : (
                  tenants.map((t) => (
                    <View key={t.id} style={styles.tenantCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tenantName}>{t.name}</Text>
                        <Text style={styles.tenantMeta}>
                          📍 {t.city || 'India'} • 📞 {t.phone || 'N/A'}
                        </Text>
                        <Text style={styles.tenantEmail}>✉️ {t.email}</Text>
                      </View>
                      <View style={styles.tenantStatusBadge}>
                        <Text style={styles.tenantStatusText}>{t.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 10,
  },
  modulesGrid: {
    gap: 10,
    marginBottom: 10,
  },
  moduleCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate900,
  },
  moduleDesc: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
    lineHeight: 16,
  },
  subModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 50,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  subModalSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  closeSubModalBtn: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  closeSubModalText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate700,
  },
  cardSectionHeader: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate900,
    marginBottom: 12,
  },
  calcBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  calcInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate900,
    marginBottom: 14,
  },
  calcBreakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.slate600,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate900,
  },
  breakdownBold: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.slate900,
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.primary,
  },
  netVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  whatsappBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  quoteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quoteNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  quoteCustomer: {
    fontSize: 12,
    color: colors.slate600,
    marginTop: 2,
  },
  quoteTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
  },
  quoteStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  infoText: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 3,
    lineHeight: 16,
  },
  subsidyStageCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subsidyStageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  subsidyStageStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginTop: 4,
  },
  financeMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  financeMetricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  financeMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  financeMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginTop: 4,
  },
  milestoneItem: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  milestoneSub: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  invCategory: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  invStock: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  amcCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  amcClient: {
    fontSize: 11,
    color: colors.slate600,
    marginTop: 2,
  },
  amcDate: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  amcBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
  },
  docStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  tenantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tenantName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  tenantMeta: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  tenantEmail: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 1,
  },
  tenantStatusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tenantStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  emptyCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.slate500,
    fontSize: 12,
  },
});
