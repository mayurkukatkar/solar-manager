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
    estimatedCap: '3',
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
          recommendedKw: l.estimatedCap || 3,
          estimatedCost: l.estimatedValue || (l.estimatedCap ? l.estimatedCap * 60000 : 180000),
          subsidyAmount: (l.estimatedCap || 3) >= 3 ? 78000 : (l.estimatedCap || 3) >= 2 ? 60000 : 30000,
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
        estimatedCap: parseFloat(newLeadForm.estimatedCap) || 3,
      });

      Alert.alert('Lead Created', `Customer "${newLeadForm.name}" saved to Central CRM!`);
      setAddModalVisible(false);
      setNewLeadForm({
        name: '',
        mobile: '',
        email: '',
        company: '',
        city: '',
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

  const handleAdvanceStage = async (leadId: string, nextStage: string) => {
    try {
      await crmApi.advanceLeadStage(leadId, nextStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage, status: nextStage } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, stage: nextStage, status: nextStage });
      }
      Alert.alert('Stage Updated', `Lead moved to "${nextStage}".`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update lead stage');
    }
  };

  const handleConvertLeadToProject = async (lead: Lead) => {
    setConverting(true);
    try {
      await crmApi.convertLead(lead.id);
      Alert.alert(
        'Lead Converted! 🎉',
        `Customer "${lead.name}" has been converted to an active Project. A Site Survey has been automatically scheduled.`
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
    const targetKw = kw || 3;
    const gross = targetKw * 60000;
    const sub = targetKw >= 3 ? 78000 : targetKw === 2 ? 60000 : 30000;
    const net = gross - sub;

    const text = `☀️ *PM Surya Ghar Solar Proposal*
Dear ${name},
Here is your customized Rooftop Solar System estimate:
⚡ Recommended Capacity: ${targetKw} kWp Grid-Tied Solar
💰 Gross Cost: ₹${gross.toLocaleString('en-IN')}
🏛️ Govt. Subsidy (CFA): -₹${sub.toLocaleString('en-IN')}
✅ Net Investment Payable: ₹${net.toLocaleString('en-IN')}

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
        return { bg: '#fef2f2', text: '#dc2626' };
      case 'WON':
        return { bg: '#ecfdf5', text: '#059669' };
      case 'LOST':
        return { bg: '#f1f5f9', text: '#64748b' };
      default:
        return { bg: '#f8fafc', text: '#475569' };
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="CRM & Leads Pipeline"
        subtitle="Customer acquisition, conversion & proposal dispatch"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* METRICS STRIP */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricItem}>
          <Text style={styles.metricNumber}>{metrics.totalLeads}</Text>
          <Text style={styles.metricTitle}>Total</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#2563eb' }]}>{metrics.newLeads}</Text>
          <Text style={styles.metricTitle}>New</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#7c3aed' }]}>{metrics.qualifiedLeads}</Text>
          <Text style={styles.metricTitle}>Qualified</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#059669' }]}>{metrics.wonLeads}</Text>
          <Text style={styles.metricTitle}>Won</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: '#d97706' }]}>{metrics.conversionRate}</Text>
          <Text style={styles.metricTitle}>Win Rate</Text>
        </View>
      </View>

      {/* HORIZONTAL STAGE SELECTOR */}
      <View style={styles.stageTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabsContent}>
          {STAGES.map((s) => {
            const count = s.id === 'ALL' ? leads.length : leads.filter((l) => (l.status || l.stage) === s.id).length;
            const isActive = activeStage === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.stageTab, isActive && styles.stageTabActive]}
                onPress={() => setActiveStage(s.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.stageTabText, isActive && styles.stageTabTextActive]}>
                  {s.label}
                </Text>
                <View style={[styles.stageTabCount, isActive && styles.stageTabCountActive]}>
                  <Text style={[styles.stageTabCountText, isActive && styles.stageTabCountTextActive]}>
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
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            Showing {filteredLeads.length} {activeStage === 'ALL' ? 'Total' : activeStage} Leads
          </Text>
          <TouchableOpacity
            style={styles.addLeadTopBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addLeadTopBtnText}>+ New Lead</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
        ) : filteredLeads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No Leads in this Stage</Text>
            <Text style={styles.emptyText}>
              Add prospective customers to build your solar pipeline and send 60s proposals.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyAddBtnText}>+ Create New Lead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredLeads.map((lead) => {
            const badge = getStageBadgeColor(lead.stage || 'NEW');
            const isWon = (lead.stage || lead.status) === 'WON';

            return (
              <TouchableOpacity
                key={lead.id}
                style={styles.leadCard}
                onPress={() => setSelectedLead(lead)}
                activeOpacity={0.9}
              >
                {/* TOP ROW: NAME & STAGE PILL */}
                <View style={styles.leadCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadName}>{lead.name}</Text>
                    <Text style={styles.leadLocation}>
                      📍 {lead.city || 'Site Location'} {lead.company ? `• ${lead.company}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.stageBadgeText, { color: badge.text }]}>
                      {lead.stage || 'NEW'}
                    </Text>
                  </View>
                </View>

                {/* CAPACITY & ESTIMATED ECONOMICS */}
                <View style={styles.economicsRow}>
                  <View style={styles.econItem}>
                    <Text style={styles.econLabel}>CAPACITY</Text>
                    <Text style={styles.econVal}>{lead.recommendedKw || 3} kWp</Text>
                  </View>
                  <View style={styles.econItem}>
                    <Text style={styles.econLabel}>EST. COST</Text>
                    <Text style={styles.econVal}>₹{(lead.estimatedCost || 180000).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.econItem}>
                    <Text style={styles.econLabel}>CFA SUBSIDY</Text>
                    <Text style={[styles.econVal, { color: '#059669' }]}>
                      -₹{(lead.subsidyAmount || 78000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* ACTION BUTTONS ROW */}
                <View style={styles.actionsBar}>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={() => Linking.openURL(`tel:${lead.phone || lead.mobile}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionPillText}>📞 Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionPill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                    onPress={() => handleWhatsApp(lead.name, lead.phone || lead.mobile, lead.recommendedKw)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionPillText, { color: '#047857' }]}>💬 WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionPill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                    onPress={() => {
                      if (navigation) {
                        navigation.navigate('Modules', {
                          openQuote: true,
                          leadName: lead.name,
                          capacity: lead.recommendedKw || 3,
                        });
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionPillText, { color: '#1d4ed8' }]}>📄 60s Quote</Text>
                  </TouchableOpacity>

                  {isWon ? (
                    <TouchableOpacity
                      style={styles.convertBtn}
                      onPress={() => handleConvertLeadToProject(lead)}
                      disabled={converting}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.convertBtnText}>🚀 Convert</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.advanceBtn}
                      onPress={() => {
                        const next =
                          lead.stage === 'NEW'
                            ? 'CONTACTED'
                            : lead.stage === 'CONTACTED'
                            ? 'QUALIFIED'
                            : lead.stage === 'QUALIFIED'
                            ? 'SITE_SURVEY'
                            : lead.stage === 'SITE_SURVEY'
                            ? 'PROPOSAL_SENT'
                            : 'WON';
                        handleAdvanceStage(lead.id, next);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.advanceBtnText}>⚡ Advance</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ADD LEAD MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>New Customer Lead</Text>
                <Text style={styles.modalSubtitle}>Register rooftop solar prospect</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>CUSTOMER FULL NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Sharma"
                value={newLeadForm.name}
                onChangeText={(t) => setNewLeadForm({ ...newLeadForm, name: t })}
              />

              <Text style={styles.inputLabel}>MOBILE NUMBER (10 DIGITS) *</Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={newLeadForm.mobile}
                onChangeText={(t) => setNewLeadForm({ ...newLeadForm, mobile: t })}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>SYSTEM CAPACITY (kWp)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3"
                    keyboardType="numeric"
                    value={newLeadForm.estimatedCap}
                    onChangeText={(t) => setNewLeadForm({ ...newLeadForm, estimatedCap: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>MONTHLY BILL (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3500"
                    keyboardType="numeric"
                    value={newLeadForm.monthlyBill}
                    onChangeText={(t) => setNewLeadForm({ ...newLeadForm, monthlyBill: t })}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>CITY / REGION</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mumbai, Pune, Nagpur"
                value={newLeadForm.city}
                onChangeText={(t) => setNewLeadForm({ ...newLeadForm, city: t })}
              />

              <Text style={styles.inputLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="customer@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newLeadForm.email}
                onChangeText={(t) => setNewLeadForm({ ...newLeadForm, email: t })}
              />

              <TouchableOpacity
                style={styles.saveLeadBtn}
                onPress={handleAddLeadSubmit}
                disabled={savingLead}
                activeOpacity={0.85}
              >
                {savingLead ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveLeadBtnText}>Save & Add to Pipeline</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LEAD DETAIL & CONVERSION MODAL */}
      <Modal visible={!!selectedLead} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedLead && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selectedLead.name}</Text>
                    <Text style={styles.detailSub}>
                      {selectedLead.city} • Registered {selectedLead.createdAt}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedLead(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSpecsGrid}>
                  <View style={styles.detailSpecBox}>
                    <Text style={styles.detailSpecLabel}>CAPACITY</Text>
                    <Text style={styles.detailSpecVal}>{selectedLead.recommendedKw} kWp</Text>
                  </View>
                  <View style={styles.detailSpecBox}>
                    <Text style={styles.detailSpecLabel}>GROSS ESTIMATE</Text>
                    <Text style={styles.detailSpecVal}>₹{(selectedLead.estimatedCost || 180000).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.detailSpecBox}>
                    <Text style={styles.detailSpecLabel}>CFA SUBSIDY</Text>
                    <Text style={[styles.detailSpecVal, { color: '#059669' }]}>
                      -₹{(selectedLead.subsidyAmount || 78000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.detailSpecBox}>
                    <Text style={styles.detailSpecLabel}>CURRENT STAGE</Text>
                    <Text style={[styles.detailSpecVal, { color: colors.primary }]}>{selectedLead.stage}</Text>
                  </View>
                </View>

                {/* STAGE SELECTOR IN MODAL */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>UPDATE PIPELINE STAGE:</Text>
                <View style={styles.stageChipsRow}>
                  {STAGES.filter((s) => s.id !== 'ALL').map((s) => {
                    const isSelected = selectedLead.stage === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.stageChip, isSelected && styles.stageChipSelected]}
                        onPress={() => handleAdvanceStage(selectedLead.id, s.id)}
                      >
                        <Text style={[styles.stageChipText, isSelected && styles.stageChipTextSelected]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* CONVERT BUTTON IF WON */}
                {selectedLead.stage === 'WON' && (
                  <TouchableOpacity
                    style={styles.convertBigBtn}
                    onPress={() => handleConvertLeadToProject(selectedLead)}
                    disabled={converting}
                    activeOpacity={0.85}
                  >
                    {converting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.convertBigBtnText}>
                        🚀 Convert to Active Project & Site Survey
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.detailModalActions}>
                  <TouchableOpacity
                    style={styles.detailCallBtn}
                    onPress={() => Linking.openURL(`tel:${selectedLead.phone || selectedLead.mobile}`)}
                  >
                    <Text style={styles.detailCallBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailWhatsappBtn}
                    onPress={() => handleWhatsApp(selectedLead.name, selectedLead.phone || selectedLead.mobile, selectedLead.recommendedKw)}
                  >
                    <Text style={styles.detailWhatsappBtnText}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
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
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  stageTabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stageTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  stageTabActive: {
    backgroundColor: colors.primary,
  },
  stageTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate600,
  },
  stageTabTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  stageTabCount: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  stageTabCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stageTabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate700,
  },
  stageTabCountTextActive: {
    color: colors.white,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addLeadTopBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addLeadTopBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  leadCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  leadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate900,
  },
  leadLocation: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  economicsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  econItem: {
    alignItems: 'center',
  },
  econLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  econVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate700,
  },
  advanceBtn: {
    flex: 1.1,
    backgroundColor: colors.slate900,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  advanceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  convertBtn: {
    flex: 1.1,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  convertBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.white,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  addModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  detailModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate500,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate500,
    letterSpacing: 0.5,
    marginBottom: 4,
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
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveLeadBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveLeadBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  detailName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  detailSub: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  detailSpecsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 14,
  },
  detailSpecBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailSpecLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  detailSpecVal: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
    marginTop: 2,
  },
  stageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  stageChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  stageChipSelected: {
    backgroundColor: colors.primary,
  },
  stageChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate600,
  },
  stageChipTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  convertBigBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  convertBigBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  detailModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  detailCallBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  detailCallBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate800,
  },
  detailWhatsappBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  detailWhatsappBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
});
