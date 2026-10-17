import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { crmApi } from '../../api/endpoints';
import { Lead } from '../../types';

const STAGES = [
  { id: 'ALL', label: 'All' },
  { id: 'NEW', label: 'New' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'SITE_SURVEY', label: 'Survey' },
  { id: 'PROPOSAL_SENT', label: 'Proposal' },
  { id: 'WON', label: 'Won' },
  { id: 'LOST', label: 'Lost' },
];

export const LeadsScreen: React.FC<{ route?: any }> = ({ route }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    conversionRate: '0%',
  });

  // Add Lead Modal State
  const [addModalVisible, setAddModalVisible] = useState(route?.params?.openAdd || false);
  const [savingLead, setSavingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    mobile: '',
    email: '',
    company: '',
    city: 'Nagpur',
    estimatedCap: '3',
    monthlyBill: '3500',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const [leadsRes, metricsRes] = await Promise.all([
        crmApi.getLeads({ all: true }).catch(() => null),
        crmApi.getLeadMetrics().catch(() => null),
      ]);

      if (leadsRes && Array.isArray(leadsRes.leads)) {
        const mapped: Lead[] = leadsRes.leads.map((l: any) => ({
          id: l.id,
          name: l.name,
          phone: l.mobile || '',
          mobile: l.mobile,
          email: l.email || undefined,
          company: l.company || undefined,
          city: l.city || 'Nagpur',
          recommendedKw: l.estimatedCap || 3,
          estimatedCost: l.estimatedValue || (l.estimatedCap ? l.estimatedCap * 60000 : 180000),
          subsidyAmount: (l.estimatedCap || 3) >= 3 ? 78000 : 60000,
          stage: l.status || 'NEW',
          status: l.status || 'NEW',
          createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent',
        }));
        setLeads(mapped);
      }

      if (metricsRes?.dashboard) {
        setMetrics({
          totalLeads: metricsRes.dashboard.totalLeads || 0,
          newLeads: metricsRes.dashboard.newLeads || 0,
          qualifiedLeads: metricsRes.dashboard.qualifiedLeads || 0,
          wonLeads: metricsRes.dashboard.wonLeads || 0,
          conversionRate: `${metricsRes.dashboard.conversionRate || 0}%`,
        });
      }
    } catch (err: any) {
      console.warn('Leads fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handleAddLeadSubmit = async () => {
    if (!newLeadForm.name.trim() || newLeadForm.mobile.trim().length < 10) {
      Alert.alert('Required', 'Please enter a customer name and valid 10-digit mobile number.');
      return;
    }

    setSavingLead(true);
    try {
      await crmApi.createLead({
        name: newLeadForm.name.trim(),
        mobile: newLeadForm.mobile.trim(),
        email: newLeadForm.email ? newLeadForm.email.trim() : undefined,
        company: newLeadForm.company ? newLeadForm.company.trim() : undefined,
        source: 'Mobile CRM Client',
        estimatedCap: parseFloat(newLeadForm.estimatedCap) || 3,
      });

      Alert.alert('Lead Created', `Customer "${newLeadForm.name}" saved to Central CRM!`);
      setAddModalVisible(false);
      setNewLeadForm({
        name: '',
        mobile: '',
        email: '',
        company: '',
        city: 'Nagpur',
        estimatedCap: '3',
        monthlyBill: '3500',
      });
      fetchLeads();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save lead');
    } finally {
      setSavingLead(false);
    }
  };

  const handleWhatsApp = (name: string, phone?: string, kw?: number) => {
    const targetKw = kw || 3;
    const gross = targetKw * 60000;
    const sub = targetKw >= 3 ? 78000 : targetKw === 2 ? 60000 : 30000;
    const net = gross - sub;

    const text = `☀️ *PM Surya Ghar Solar Proposal*
Dear ${name},
Here is your customized Rooftop Solar System estimate:
⚡ Recommended Capacity: ${targetKw} kWp
💰 Gross Cost: ₹${gross.toLocaleString('en-IN')}
🏛️ Govt. Subsidy (CFA): -₹${sub.toLocaleString('en-IN')}
✅ Net Investment Payable: ₹${net.toLocaleString('en-IN')}

Let's schedule your site survey today!`;

    const clean = phone ? phone.replace(/[^0-9]/g, '') : '';
    const url = clean
      ? `whatsapp://send?phone=91${clean}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Unable to open WhatsApp.');
    });
  };

  const filteredLeads = leads.filter((l) => {
    if (activeStage !== 'ALL' && (l.status || l.stage) !== activeStage) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = (l.phone || '').includes(q);
      const matchCompany = (l.company || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchCompany;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        title="CRM & Leads Pipeline"
        subtitle="Customer acquisition, stages & follow-ups"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* METRICS STRIP */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricItem}>
          <Text style={styles.metricNumber}>{metrics.totalLeads}</Text>
          <Text style={styles.metricTitle}>Total</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#3b82f6' }]}>{metrics.newLeads}</Text>
          <Text style={styles.metricTitle}>New</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#8b5cf6' }]}>{metrics.qualifiedLeads}</Text>
          <Text style={styles.metricTitle}>Qualified</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#10b981' }]}>{metrics.wonLeads}</Text>
          <Text style={styles.metricTitle}>Won</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#f59e0b' }]}>{metrics.conversionRate}</Text>
          <Text style={styles.metricTitle}>Win Rate</Text>
        </View>
      </View>

      {/* STAGE TABS */}
      <View style={styles.stageTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabs}>
          {STAGES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.stageChip, activeStage === s.id && styles.stageChipActive]}
              onPress={() => setActiveStage(s.id)}
            >
              <Text style={[styles.stageChipText, activeStage === s.id && styles.stageChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LEADS LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Leads ({filteredLeads.length})</Text>
          <TouchableOpacity
            style={styles.addLeadBtnSmall}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addLeadBtnSmallText}>+ Add Lead</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : filteredLeads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
            <Text style={styles.emptyTitle}>No leads found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try matching another name or phone number.' : 'Add your first lead using the button above.'}
            </Text>
          </View>
        ) : (
          filteredLeads.map((lead) => (
            <View key={lead.id} style={styles.leadCard}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leadName}>{lead.name}</Text>
                  {lead.company ? <Text style={styles.companyText}>🏢 {lead.company}</Text> : null}
                  <Text style={styles.leadPhone}>📞 {lead.phone || lead.mobile}</Text>
                </View>
                <View style={styles.stageBadge}>
                  <Text style={styles.stageBadgeText}>{lead.status || lead.stage}</Text>
                </View>
              </View>

              <View style={styles.specsRow}>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>SYSTEM</Text>
                  <Text style={styles.specVal}>{lead.recommendedKw || 3} kWp</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>EST. VALUE</Text>
                  <Text style={styles.specVal}>
                    ₹{lead.estimatedCost ? (lead.estimatedCost / 1000).toFixed(0) : 180}k
                  </Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>SUBSIDY (CFA)</Text>
                  <Text style={[styles.specVal, { color: '#047857' }]}>
                    -₹{lead.subsidyAmount ? (lead.subsidyAmount / 1000).toFixed(0) : 78}k
                  </Text>
                </View>
              </View>

              <View style={styles.actionsBar}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${lead.phone || lead.mobile}`)}
                >
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsAppBtn}
                  onPress={() => handleWhatsApp(lead.name, lead.phone || lead.mobile, lead.recommendedKw)}
                >
                  <Text style={styles.whatsAppBtnText}>💬 WhatsApp Proposal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ADD LEAD MODAL */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Customer Lead</Text>
            <Text style={styles.modalSubtitle}>
              Syncs immediately to the central cloud ERP pipeline
            </Text>

            <Text style={styles.inputLabel}>CUSTOMER NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Patel"
              value={newLeadForm.name}
              onChangeText={(t) => setNewLeadForm({ ...newLeadForm, name: t })}
            />

            <Text style={styles.inputLabel}>MOBILE NUMBER (10 DIGITS) *</Text>
            <TextInput
              style={styles.input}
              placeholder="9881234567"
              keyboardType="phone-pad"
              value={newLeadForm.mobile}
              onChangeText={(t) => setNewLeadForm({ ...newLeadForm, mobile: t })}
            />

            <Text style={styles.inputLabel}>COMPANY OR BUSINESS (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Patel Textiles Pvt Ltd"
              value={newLeadForm.company}
              onChangeText={(t) => setNewLeadForm({ ...newLeadForm, company: t })}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>EST. CAPACITY (kWp)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  keyboardType="numeric"
                  value={newLeadForm.estimatedCap}
                  onChangeText={(t) => setNewLeadForm({ ...newLeadForm, estimatedCap: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>CITY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nagpur"
                  value={newLeadForm.city}
                  onChangeText={(t) => setNewLeadForm({ ...newLeadForm, city: t })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, savingLead && { opacity: 0.7 }]}
              onPress={handleAddLeadSubmit}
              disabled={savingLead}
            >
              {savingLead ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Lead to Cloud ERP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate500,
    marginTop: 1,
  },
  stageTabsWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stageTabs: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  stageChipActive: {
    backgroundColor: colors.primary,
  },
  stageChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate600,
  },
  stageChipTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate900,
  },
  addLeadBtnSmall: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addLeadBtnSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  emptyCard: {
    backgroundColor: colors.white,
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate800,
  },
  emptySub: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
    textAlign: 'center',
  },
  leadCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate900,
  },
  companyText: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  leadPhone: {
    fontSize: 12,
    color: colors.slate600,
    marginTop: 2,
  },
  stageBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  specBox: {
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  callBtn: {
    backgroundColor: colors.slate100,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate800,
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 3,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate900,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: colors.slate500,
    fontSize: 13,
    fontWeight: '700',
  },
});
