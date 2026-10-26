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
import {
  Phone,
  MessageCircle,
  FileText,
  ArrowRight,
  Plus,
  Users,
  CheckCircle2,
  Building2,
  MapPin,
  X,
  Zap,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
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
];

export const LeadsScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
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
    city: '',
    estimatedCap: '3.3',
    monthlyBill: '3500',
  });

  // Selected Lead Detail Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [converting, setConverting] = useState(false);

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
          city: l.city || 'Site Location',
          recommendedKw: l.estimatedCap || 3.3,
          estimatedCost: l.estimatedValue || (l.estimatedCap ? l.estimatedCap * 60000 : 198000),
          subsidyAmount: (l.estimatedCap || 3.3) >= 3 ? 78000 : (l.estimatedCap || 3.3) >= 2 ? 60000 : 30000,
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
      Alert.alert('Required Field', 'Please enter a customer name and a valid 10-digit mobile number.');
      return;
    }

    setSavingLead(true);
    try {
      await crmApi.createLead({
        name: newLeadForm.name.trim(),
        mobile: newLeadForm.mobile.trim(),
        email: newLeadForm.email ? newLeadForm.email.trim() : undefined,
        company: newLeadForm.company ? newLeadForm.company.trim() : undefined,
        source: 'Mobile App',
        estimatedCap: parseFloat(newLeadForm.estimatedCap) || 3.3,
      });

      Alert.alert('Lead Created', `Customer "${newLeadForm.name}" has been registered.`);
      setAddModalVisible(false);
      setNewLeadForm({
        name: '',
        mobile: '',
        email: '',
        company: '',
        city: '',
        estimatedCap: '3.3',
        monthlyBill: '3500',
      });
      fetchLeads();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save lead');
    } finally {
      setSavingLead(false);
    }
  };

  const handleAdvanceStage = async (leadId: string, nextStage: string) => {
    try {
      await crmApi.advanceLeadStage(leadId, nextStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage, status: nextStage } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, stage: nextStage, status: nextStage });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update lead stage');
    }
  };

  const handleConvertLeadToProject = async (lead: Lead) => {
    setConverting(true);
    try {
      await crmApi.convertLead(lead.id);
      Alert.alert(
        'Lead Converted',
        `Customer "${lead.name}" converted to an active Project with a Site Survey scheduled.`
      );
      setSelectedLead(null);
      fetchLeads();
    } catch (err: any) {
      Alert.alert('Conversion Notice', err.message || 'Failed to convert lead to project');
    } finally {
      setConverting(false);
    }
  };

  const handleWhatsApp = (name: string, phone?: string, kw?: number) => {
    const targetKw = kw || 3.3;
    const gross = targetKw * 60000;
    const sub = targetKw >= 3 ? 78000 : targetKw >= 2 ? 60000 : 30000;
    const net = gross - sub;

    const text = `☀️ *PM Surya Ghar Solar Proposal*
Dear ${name},
Here is your customized Rooftop Solar estimate:
⚡ System Capacity: ${targetKw} kWp Grid-Tied Solar
💰 Turnkey Cost: ₹${gross.toLocaleString('en-IN')}
🏛️ PM Surya Ghar Subsidy: -₹${sub.toLocaleString('en-IN')}
✅ Net Investment: ₹${net.toLocaleString('en-IN')}

Let's schedule your 3D site survey today!`;

    const clean = phone ? phone.replace(/[^0-9]/g, '') : '';
    const url = clean
      ? `whatsapp://send?phone=91${clean}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Unable to launch WhatsApp directly.');
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

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'NEW':
        return { bg: '#eff6ff', text: '#2563eb' };
      case 'CONTACTED':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'QUALIFIED':
        return { bg: '#f3e8ff', text: '#7c3aed' };
      case 'SITE_SURVEY':
        return { bg: '#e0e7ff', text: '#4338ca' };
      case 'PROPOSAL_SENT':
        return { bg: '#ecfdf5', text: '#059669' };
      case 'WON':
        return { bg: '#ecfdf5', text: '#059669' };
      default:
        return { bg: '#f8fafc', text: '#64748b' };
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="CRM & Leads"
        subtitle="Manage inquiries, send proposals & track conversions"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* METRICS ROW */}
      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricNumber}>{metrics.totalLeads}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#2563eb' }]}>{metrics.newLeads}</Text>
          <Text style={styles.metricLabel}>New</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#7c3aed' }]}>{metrics.qualifiedLeads}</Text>
          <Text style={styles.metricLabel}>Qualified</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#059669' }]}>{metrics.wonLeads}</Text>
          <Text style={styles.metricLabel}>Won</Text>
        </View>
      </View>

      {/* STAGE SELECTOR TABS */}
      <View style={styles.stageTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsContent}
        >
          {STAGES.map((s) => {
            const count = s.id === 'ALL' ? leads.length : leads.filter((l) => (l.status || l.stage) === s.id).length;
            const isActive = activeStage === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.stagePill, isActive && styles.stagePillActive]}
                onPress={() => setActiveStage(s.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.stagePillLabel, isActive && styles.stagePillLabelActive]}>
                  {s.label}
                </Text>
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LEADS LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listCountText}>
            {filteredLeads.length} {activeStage === 'ALL' ? 'Total' : activeStage} Prospects
          </Text>
          <TouchableOpacity
            style={styles.newLeadBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.newLeadBtnText}>New Lead</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 30 }} />
        ) : filteredLeads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Prospects Found</Text>
            <Text style={styles.emptyText}>
              Add prospective customers to build your solar pipeline and send 60s proposals.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyAddBtnText}>+ Add Prospect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredLeads.map((lead) => {
            const badge = getStageBadgeColor(lead.stage || 'NEW');
            const isWon = (lead.stage || lead.status) === 'WON';
            const netInvestment = Math.max(0, (lead.estimatedCost || 198000) - (lead.subsidyAmount || 78000));

            return (
              <View key={lead.id} style={styles.leadCard}>
                {/* CARD HEADER (TAPPABLE FOR DETAIL DOSSIER) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedLead(lead)}
                  style={styles.cardHeaderRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadName}>{lead.name}</Text>
                    <View style={styles.locationRow}>
                      <MapPin size={12} color="#94a3b8" />
                      <Text style={styles.leadCity}>
                        {lead.city || 'Site Location'} {lead.company ? `• ${lead.company}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.stageBadgeText, { color: badge.text }]}>
                      {lead.stage || 'NEW'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* CAPACITY & NET INVESTMENT HIGHLIGHT */}
                <View style={styles.specsRow}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Capacity</Text>
                    <Text style={styles.specVal}>{lead.recommendedKw || 3.3} kWp</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>CFA Subsidy</Text>
                    <Text style={[styles.specVal, { color: '#059669' }]}>
                      -₹{(lead.subsidyAmount || 78000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Net Payable</Text>
                    <Text style={[styles.specVal, { color: '#0f172a' }]}>
                      ₹{netInvestment.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* TWO-ZONE ACTION BAR */}
                <View style={styles.actionRow}>
                  {/* Quick Contact Buttons */}
                  <View style={styles.contactButtons}>
                    <TouchableOpacity
                      style={styles.iconCircleBtn}
                      onPress={() => Linking.openURL(`tel:${lead.phone || lead.mobile}`)}
                      activeOpacity={0.8}
                    >
                      <Phone size={16} color="#0f172a" strokeWidth={2.2} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconCircleBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                      onPress={() => handleWhatsApp(lead.name, lead.phone || lead.mobile, lead.recommendedKw)}
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={16} color="#059669" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>

                  {/* Primary Workflow Button */}
                  {isWon ? (
                    <TouchableOpacity
                      style={styles.primaryActionBtn}
                      onPress={() => handleConvertLeadToProject(lead)}
                      disabled={converting}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryActionBtnText}>Convert to Project</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.primaryActionBtn}
                      onPress={() => {
                        if (navigation) {
                          navigation.navigate('Modules', {
                            screen: 'QUOTES',
                            openQuote: true,
                            leadName: lead.name,
                            capacity: lead.recommendedKw || 3.3,
                          });
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <FileText size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryActionBtnText}>Create 60s Quote</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ADD LEAD MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Add Prospective Customer</Text>
                <Text style={styles.modalSubtitle}>Register rooftop prospect into Central CRM</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>CUSTOMER FULL NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ramesh Sharma"
                placeholderTextColor="#94a3b8"
                value={newLeadForm.name}
                onChangeText={(t) => setNewLeadForm({ ...newLeadForm, name: t })}
              />

              <Text style={styles.inputLabel}>MOBILE NUMBER (10 DIGITS) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="9876543210"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={newLeadForm.mobile}
                onChangeText={(t) => setNewLeadForm({ ...newLeadForm, mobile: t })}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ESTIMATED CAPACITY (kWp)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="3.3"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newLeadForm.estimatedCap}
                    onChangeText={(t) => setNewLeadForm({ ...newLeadForm, estimatedCap: t })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CITY / REGION</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Pune"
                    placeholderTextColor="#94a3b8"
                    value={newLeadForm.city}
                    onChangeText={(t) => setNewLeadForm({ ...newLeadForm, city: t })}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleAddLeadSubmit}
                disabled={savingLead}
                activeOpacity={0.85}
              >
                <Text style={styles.submitModalBtnText}>
                  {savingLead ? 'Registering...' : 'Register Customer'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#f1f5f9',
  },
  stageTabsWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stageTabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stagePillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stagePillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stagePillLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  countBadgeTextActive: {
    color: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  newLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newLeadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  leadCity: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  specBox: {
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  submitModalBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
