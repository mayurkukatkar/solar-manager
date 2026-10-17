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
import { quotationsApi, superAdminApi, tenantApi, financeApi, amcApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Quotation, Tenant } from '../../types';

export const ModulesScreen: React.FC<{ route?: any; navigation?: any }> = ({ route }) => {
  const { user } = useAuth();

  // Active Sub-Module Modal
  const [activeSubModule, setActiveSubModule] = useState<string | null>(
    route?.params?.openQuote ? 'QUOTES' : route?.params?.screen || null
  );

  // 60-Second Quotation Calculator State
  const [monthlyUnits, setMonthlyUnits] = useState('400');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Finance State
  const [financeData, setFinanceData] = useState<{
    totalRevenue: number;
    outstanding: number;
    invoices: any[];
  }>({
    totalRevenue: 0,
    outstanding: 0,
    invoices: [],
  });
  const [loadingFinance, setLoadingFinance] = useState(false);

  // AMC State
  const [amcs, setAmcs] = useState<any[]>([]);
  const [loadingAmcs, setLoadingAmcs] = useState(false);

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

  const fetchFinance = async () => {
    setLoadingFinance(true);
    try {
      const [dash, fin] = await Promise.all([
        tenantApi.getDashboard().catch(() => null),
        financeApi.getInvoices().catch(() => null),
      ]);
      setFinanceData({
        totalRevenue: dash?.totalRevenue || 0,
        outstanding: dash?.outstanding || 0,
        invoices: fin?.finance || [],
      });
    } catch (err: any) {
      console.warn('Finance error:', err.message);
    } finally {
      setLoadingFinance(false);
    }
  };

  const fetchAmcs = async () => {
    setLoadingAmcs(true);
    try {
      const res = await amcApi.getAmcs();
      if (res && Array.isArray(res.amcs)) {
        setAmcs(res.amcs);
      }
    } catch (err: any) {
      console.warn('AMC error:', err.message);
    } finally {
      setLoadingAmcs(false);
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
    if (id === 'FINANCE') fetchFinance();
    if (id === 'AMC') fetchAmcs();
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

Contact us to schedule a site survey!`;

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

        {/* GROUP 2: FINANCE & SUPPLY CHAIN */}
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
            <Text style={styles.moduleName}>Inventory & Materials</Text>
            <Text style={styles.moduleDesc}>PV modules, inverters, cabling & balance of system</Text>
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
            <Text style={styles.moduleDesc}>Preventive maintenance visits & service contracts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => handleOpenModule('DOCUMENTS')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#f3e8ff' }]}>
              <Text style={{ fontSize: 24 }}>📂</Text>
            </View>
            <Text style={styles.moduleName}>Documents & Compliance</Text>
            <Text style={styles.moduleDesc}>Aadhaar, electricity bills, test reports & sign-offs</Text>
          </TouchableOpacity>
        </View>

        {/* GROUP 4: PLATFORM SUPER ADMIN (VISIBLE ONLY TO SUPER ADMIN USERS) */}
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <Text style={styles.groupTitle}>PLATFORM GOVERNANCE</Text>
            <View style={styles.modulesGrid}>
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => handleOpenModule('SUPER_ADMIN')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: '#fdf4ff' }]}>
                  <Text style={{ fontSize: 24 }}>👑</Text>
                </View>
                <Text style={styles.moduleName}>Platform Super Admin</Text>
                <Text style={styles.moduleDesc}>Global tenant roster, provisioning & platform telemetry</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* SUB-MODULE DETAIL MODAL */}
      <Modal visible={!!activeSubModule} animationType="slide">
        <View style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <View>
              <Text style={styles.subModalTitle}>
                {activeSubModule === 'QUOTES' && 'Quotations & Proposal Engine'}
                {activeSubModule === 'SUBSIDY' && 'PM Surya Ghar DBT Subsidy'}
                {activeSubModule === 'FINANCE' && 'Finance & Billing Telemetry'}
                {activeSubModule === 'INVENTORY' && 'Inventory & Materials'}
                {activeSubModule === 'AMC' && 'AMC & Service Agreements'}
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
                  <Text style={styles.subsidyStageStatus}>✓ Verified with State DISCOM</Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>2. Technical Feasibility & Approval</Text>
                  <Text style={styles.subsidyStageStatus}>✓ Approved for Grid Synchronization</Text>
                </View>

                <View style={styles.subsidyStageCard}>
                  <Text style={styles.subsidyStageTitle}>3. Installation & DCR Verification</Text>
                  <Text style={styles.subsidyStageStatus}>⚡ In Progress (Domestic Content Verified)</Text>
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
                {loadingFinance ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : (
                  <View style={styles.financeMetricsRow}>
                    <View style={[styles.financeMetricCard, { backgroundColor: colors.slate900 }]}>
                      <Text style={styles.financeMetricLabel}>TOTAL REVENUE BOOKED</Text>
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
                )}

                <Text style={[styles.cardSectionHeader, { marginTop: 20 }]}>Invoices ({financeData.invoices.length})</Text>
                {financeData.invoices.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No invoices issued yet.</Text>
                  </View>
                ) : (
                  financeData.invoices.map((inv: any) => (
                    <View key={inv.id} style={styles.quoteCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNumber}>{inv.invoiceNumber || 'INV-2026'}</Text>
                        <Text style={styles.quoteCustomer}>{inv.customer?.name || 'Customer'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.quoteTotal}>₹{(inv.amount || 0).toLocaleString('en-IN')}</Text>
                        <Text style={[styles.quoteStatus, inv.status === 'PAID' && { color: '#059669' }]}>
                          {inv.status || 'UNPAID'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 4. INVENTORY */}
            {activeSubModule === 'INVENTORY' && (
              <View>
                <Text style={styles.cardSectionHeader}>Stock & Materials Management</Text>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoTitle}>Warehouse Stock & Logistics</Text>
                  <Text style={styles.infoText}>
                    Track tier-1 DCR solar panels, grid-tie inverters, DC cables, and mounting structures.
                  </Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>Monocrystalline Bifacial PV Modules</Text>
                    <Text style={styles.invCategory}>Category: DCR Solar Panels</Text>
                  </View>
                  <Text style={styles.invStock}>Active Stock</Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>Grid-Tied Solar Inverters (Single/Three Phase)</Text>
                    <Text style={styles.invCategory}>Category: Power Electronics</Text>
                  </View>
                  <Text style={styles.invStock}>Active Stock</Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>4 sq.mm UV-Resistant Solar DC Cable</Text>
                    <Text style={styles.invCategory}>Category: Balance of System</Text>
                  </View>
                  <Text style={styles.invStock}>Active Stock</Text>
                </View>

                <View style={styles.inventoryItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invTitle}>Chemical Earthing Compound & Electrodes</Text>
                    <Text style={styles.invCategory}>Category: Safety & Grounding</Text>
                  </View>
                  <Text style={styles.invStock}>Active Stock</Text>
                </View>
              </View>
            )}

            {/* 5. AMC */}
            {activeSubModule === 'AMC' && (
              <View>
                <Text style={styles.cardSectionHeader}>Active Maintenance Contracts & Service</Text>
                {loadingAmcs ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : amcs.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No active AMC agreements yet. Solar maintenance packages will appear here once registered.
                    </Text>
                  </View>
                ) : (
                  amcs.map((amc: any) => (
                    <View key={amc.id} style={styles.amcCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.amcTitle}>{amc.planName || 'Comprehensive Solar AMC'}</Text>
                        <Text style={styles.amcClient}>{amc.customer?.name || 'Customer'}</Text>
                        <Text style={styles.amcDate}>Status: {amc.status}</Text>
                      </View>
                      <View style={styles.amcBadge}>
                        <Text style={styles.amcBadgeText}>{amc.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 6. DOCUMENTS */}
            {activeSubModule === 'DOCUMENTS' && (
              <View>
                <Text style={styles.cardSectionHeader}>Document Verification & Readiness</Text>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Customer Aadhaar Card</Text>
                  <Text style={styles.docStatus}>Mandatory</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Latest Electricity Bill</Text>
                  <Text style={styles.docStatus}>Mandatory</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Property Tax Receipt / Ownership Proof</Text>
                  <Text style={styles.docStatus}>Mandatory</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Cancelled Bank Cheque (CFA Subsidy)</Text>
                  <Text style={styles.docStatus}>Mandatory</Text>
                </View>
                <View style={styles.docItem}>
                  <Text style={styles.docName}>📄 Work Completion & Commissioning Report</Text>
                  <Text style={[styles.docStatus, { color: '#f59e0b' }]}>Post-Install</Text>
                </View>
              </View>
            )}

            {/* 7. SUPER ADMIN TENANTS */}
            {activeSubModule === 'SUPER_ADMIN' && user?.role === 'SUPER_ADMIN' && (
              <View>
                <Text style={styles.cardSectionHeader}>Platform Tenants Management</Text>
                {loadingTenants ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : tenants.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No registered tenants found.</Text>
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
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
    marginBottom: 12,
  },
  calcBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate500,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  calcInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 14,
  },
  calcBreakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.slate600,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  breakdownBold: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
  },
  netVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
  whatsappBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
  },
  quoteCustomer: {
    fontSize: 11,
    color: colors.slate500,
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
    color: colors.slate500,
    marginTop: 2,
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#1e3a8a',
    lineHeight: 16,
  },
  subsidyStageCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  subsidyStageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 4,
  },
  subsidyStageStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  financeMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  financeMetricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  financeMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  financeMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  invCategory: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 2,
  },
  invStock: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amcCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  amcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  amcClient: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  amcDate: {
    fontSize: 10,
    color: colors.slate400,
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
    color: '#059669',
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  docName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  docStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate600,
  },
  tenantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
  },
  tenantMeta: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  tenantEmail: {
    fontSize: 10,
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
    color: '#059669',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate500,
    textAlign: 'center',
  },
});
