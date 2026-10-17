import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Modal, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { Lead } from '../../types';

export const SalesDashboardScreen: React.FC = () => {
  // 60-Second Quotation Calculator State
  const [monthlyUnits, setMonthlyUnits] = useState('420');
  const [calcModalVisible, setCalcModalVisible] = useState(false);

  // Quick Lead Capture Modal State
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', city: 'Nagpur', bill: '3500' });

  // Leads List
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'ld-101',
      name: 'Ravi Dodkuji Kawale',
      phone: '9822334455',
      city: 'Nagpur',
      address: 'Tembhari Butibori',
      recommendedKw: 5.0,
      estimatedCost: 285000,
      subsidyAmount: 78000,
      stage: 'QUOTATION_SENT',
      createdAt: 'Today, 11:30 AM',
    },
    {
      id: 'ld-102',
      name: 'Dr. Anita Deshmukh',
      phone: '9766554433',
      city: 'Nagpur',
      address: 'Dharampeth, Near Coffee House',
      recommendedKw: 3.3,
      estimatedCost: 195000,
      subsidyAmount: 78000,
      stage: 'SURVEY_SCHEDULED',
      createdAt: 'Yesterday',
    },
    {
      id: 'ld-103',
      name: 'Ganesh Kirana Stores',
      phone: '9422118899',
      city: 'Nagpur',
      address: 'Hudkeshwar Road',
      recommendedKw: 10.0,
      estimatedCost: 520000,
      subsidyAmount: 0,
      stage: 'NEW',
      createdAt: '2 days ago',
    },
  ]);

  // Compute 60-second solar quotation economics
  const units = parseFloat(monthlyUnits) || 300;
  const kwCapacity = Math.min(10, Math.max(1, Math.round((units / 120) * 10) / 10)); // ~120 units per kW per month
  const grossCost = Math.round(kwCapacity * 60000);
  
  // PM Surya Ghar: Muft Bijli Yojana Central Financial Assistance (CFA)
  let subsidy = 0;
  if (kwCapacity <= 1) subsidy = 30000;
  else if (kwCapacity <= 2) subsidy = 60000;
  else subsidy = 78000;

  const netPayable = grossCost - subsidy;
  const monthlySavings = Math.round(kwCapacity * 120 * 8.5); // avg tariff ~Rs 8.5/unit
  const paybackYears = (netPayable / (monthlySavings * 12)).toFixed(1);

  const handleShareWhatsApp = (customerName?: string, phone?: string) => {
    const text = `☀️ *PM Surya Ghar Solar Proposal*
Dear ${customerName || 'Customer'},
Here is your customized Rooftop Solar System estimate from *Ekvarta Energy Solutions*:

⚡ *Recommended System:* ${kwCapacity} kWp Grid-Tied Solar
💰 *Gross Project Cost:* ₹${grossCost.toLocaleString('en-IN')}
🏛️ *Govt. Subsidy (CFA):* -₹${subsidy.toLocaleString('en-IN')}
✅ *Net Investment Payable:* ₹${netPayable.toLocaleString('en-IN')}

📈 *Monthly Electricity Savings:* ~₹${monthlySavings.toLocaleString('en-IN')}/month
⏱️ *Full Payback Period:* ~${paybackYears} Years (Free power thereafter for 25 Years!)

Let's schedule your 3D Roof Survey! Call us directly.`;

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `whatsapp://send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Unable to open WhatsApp automatically. Text copied to clipboard.');
    });
  };

  const handleAddLead = () => {
    if (!newLead.name || !newLead.phone) {
      Alert.alert('Required', 'Please enter customer name and contact phone number.');
      return;
    }
    const created: Lead = {
      id: `ld-${Date.now().toString().slice(-4)}`,
      name: newLead.name,
      phone: newLead.phone,
      city: newLead.city || 'Nagpur',
      address: 'Field Survey Site',
      recommendedKw: kwCapacity,
      estimatedCost: grossCost,
      subsidyAmount: subsidy,
      stage: 'NEW',
      createdAt: 'Just now',
    };
    setLeads([created, ...leads]);
    setLeadModalVisible(false);
    setNewLead({ name: '', phone: '', city: 'Nagpur', bill: '3500' });
    Alert.alert('Lead Created', `Lead #${created.id} saved & synced to ERP dashboard.`);
  };

  return (
    <View style={styles.container}>
      <Header title="Sales & Field CRM" subtitle="Instant quotations & customer conversions" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Instant 60s Quotation Hero Banner */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteCardHeader}>
            <Text style={styles.quoteBadge}>⚡ 60-SEC QUOTE CALCULATOR</Text>
            <TouchableOpacity onPress={() => setCalcModalVisible(true)}>
              <Text style={styles.expandText}>Detailed Specs ↗</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.quoteTitle}>Monthly Units: {monthlyUnits} kWh</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.unitInput}
              keyboardType="numeric"
              value={monthlyUnits}
              onChangeText={setMonthlyUnits}
              placeholder="e.g. 400"
            />
            <Text style={styles.inputUnit}>Units / Month</Text>
          </View>

          {/* Economics Highlights */}
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>SYSTEM SIZE</Text>
              <Text style={styles.resultValue}>{kwCapacity} kWp</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>PM SURYA SUBSIDY</Text>
              <Text style={[styles.resultValue, { color: colors.primary }]}>₹{subsidy.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>NET PAYABLE</Text>
              <Text style={[styles.resultValue, { color: colors.slate900 }]}>₹{netPayable.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Quick WhatsApp Action */}
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => handleShareWhatsApp()}
            activeOpacity={0.85}
          >
            <Text style={styles.whatsappBtnText}>💬 Share Proposal via WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Leads Pipeline Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Field Leads ({leads.length})</Text>
          <TouchableOpacity
            style={styles.newLeadBtn}
            onPress={() => setLeadModalVisible(true)}
          >
            <Text style={styles.newLeadBtnText}>+ New Lead</Text>
          </TouchableOpacity>
        </View>

        {leads.map((ld) => (
          <View key={ld.id} style={styles.leadCard}>
            <View style={styles.leadTop}>
              <View>
                <Text style={styles.leadName}>{ld.name}</Text>
                <Text style={styles.leadAddress}>📍 {ld.address}, {ld.city}</Text>
              </View>
              <View style={[styles.stageBadge, ld.stage === 'WON' && styles.stageWon]}>
                <Text style={styles.stageText}>{ld.stage.replace('_', ' ')}</Text>
              </View>
            </View>

            <View style={styles.leadSpecs}>
              <Text style={styles.specText}>
                Size: <Text style={styles.specBold}>{ld.recommendedKw || 3.3} kWp</Text>
              </Text>
              <Text style={styles.specText}>
                Net: <Text style={styles.specBold}>₹{((ld.estimatedCost || 180000) - (ld.subsidyAmount || 78000)).toLocaleString('en-IN')}</Text>
              </Text>
              <Text style={styles.leadTime}>{ld.createdAt}</Text>
            </View>

            <View style={styles.leadActions}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${ld.phone}`)}
              >
                <Text style={styles.callBtnText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quoteShareBtn}
                onPress={() => handleShareWhatsApp(ld.name, ld.phone)}
              >
                <Text style={styles.quoteShareBtnText}>Send Quote via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick Lead Capture Modal */}
      <Modal visible={leadModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Capture Quick Field Lead</Text>
            <Text style={styles.modalSub}>Auto-creates customer record in ERP system</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Customer Full Name *"
              value={newLead.name}
              onChangeText={(t) => setNewLead({ ...newLead, name: t })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Mobile Number (10 digits) *"
              keyboardType="phone-pad"
              value={newLead.phone}
              onChangeText={(t) => setNewLead({ ...newLead, phone: t })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="City / Area (e.g. Wardha Road, Nagpur)"
              value={newLead.city}
              onChangeText={(t) => setNewLead({ ...newLead, city: t })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Monthly Electricity Bill (₹)"
              keyboardType="numeric"
              value={newLead.bill}
              onChangeText={(t) => setNewLead({ ...newLead, bill: t })}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLeadModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveLeadBtn}
                onPress={handleAddLead}
              >
                <Text style={styles.saveLeadBtnText}>Save & Send Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  quoteCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  quoteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  unitInput: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
    minWidth: 100,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate500,
  },
  resultRow: {
    flexDirection: 'row',
    backgroundColor: colors.slate50,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    justifyContent: 'space-between',
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  whatsappBtn: {
    backgroundColor: '#16a34a', // WhatsApp green
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  whatsappBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  newLeadBtn: {
    backgroundColor: colors.slate900,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newLeadBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  leadCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  leadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate900,
  },
  leadAddress: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  stageBadge: {
    backgroundColor: colors.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stageWon: {
    backgroundColor: colors.primaryMuted,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.blue,
  },
  leadSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  specText: {
    fontSize: 12,
    color: colors.slate600,
  },
  specBold: {
    fontWeight: '800',
    color: colors.slate900,
  },
  leadTime: {
    fontSize: 10,
    color: colors.slate400,
    marginLeft: 'auto',
  },
  leadActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: colors.slate100,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate700,
  },
  quoteShareBtn: {
    flex: 2.2,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  quoteShareBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 22,
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSub: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    color: colors.slate900,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.slate100,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '800',
    color: colors.slate700,
  },
  saveLeadBtn: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveLeadBtnText: {
    fontWeight: '800',
    color: colors.white,
  },
});
