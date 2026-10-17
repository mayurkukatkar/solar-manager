import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';

export const OwnerDashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [approvals, setApprovals] = useState([
    {
      id: 'app-01',
      type: 'DISCOUNT',
      title: 'Quotation Discount Approval',
      customer: 'Ravi Dodkuji Kawale',
      system: '5.0 kWp Adani Bifacial',
      requestedValue: '5% Extra Discount (₹14,500)',
      status: 'PENDING',
    },
    {
      id: 'app-02',
      type: 'COMMISSIONING',
      title: 'MSEDCL WCR Dossier Sign-Off',
      customer: 'Surendra Rambhau Thakre',
      system: '3.3 kWp DCR On-Grid',
      requestedValue: 'Ready for Net-Meter inspection',
      status: 'PENDING',
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleApprove = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    Alert.alert('Approved', 'Request successfully authorized and synced to backend.');
  };

  return (
    <View style={styles.container}>
      <Header title="Executive Overview" subtitle="Real-time business telemetry & crew status" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderColor: '#a7f3d0' }]}>
            <Text style={styles.kpiLabel}>MONTHLY REVENUE</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>₹28.5L</Text>
            <Text style={styles.kpiDelta}>+18.4% vs last month</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#bfdbfe' }]}>
            <Text style={styles.kpiLabel}>ACTIVE PIPELINE</Text>
            <Text style={[styles.kpiValue, { color: colors.blue }]}>14</Text>
            <Text style={styles.kpiDelta}>6 in procurement, 8 in install</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#fde68a' }]}>
            <Text style={styles.kpiLabel}>TODAY'S ON-SITE JOBS</Text>
            <Text style={[styles.kpiValue, { color: colors.accent }]}>3 Sites</Text>
            <Text style={styles.kpiDelta}>2 crews active right now</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#ddd6fe' }]}>
            <Text style={styles.kpiLabel}>DBT SUBSIDY CLAIMS</Text>
            <Text style={[styles.kpiValue, { color: colors.purple }]}>₹18.4L</Text>
            <Text style={styles.kpiDelta}>PM Surya Ghar portal claims</Text>
          </View>
        </View>

        {/* Approvals Action Box */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Urgent Approvals Required</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{approvals.length}</Text>
            </View>
          </View>

          {approvals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>🎉 No pending approvals. Everything is clear!</Text>
            </View>
          ) : (
            approvals.map((app) => (
              <View key={app.id} style={styles.approvalCard}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalType}>{app.title}</Text>
                  <Text style={styles.systemTag}>{app.system}</Text>
                </View>
                <Text style={styles.customerName}>{app.customer}</Text>
                <Text style={styles.requestedDetail}>{app.requestedValue}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => setApprovals((prev) => prev.filter((a) => a.id !== app.id))}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(app.id)}
                  >
                    <Text style={styles.approveBtnText}>Approve & Sign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Live Field Crew Telemetry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Field Crew Radar</Text>
          
          <View style={styles.crewCard}>
            <View style={styles.crewStatusDot} />
            <View style={styles.crewInfo}>
              <Text style={styles.crewName}>Amit Verma (Lead Installer)</Text>
              <Text style={styles.crewLocation}>📍 Wardha Road, Plot 87 · 3.3kWp Thakre Site</Text>
              <Text style={styles.crewProgress}>Checklist: 9/12 items done · Module serials scanned</Text>
            </View>
          </View>

          <View style={styles.crewCard}>
            <View style={[styles.crewStatusDot, { backgroundColor: colors.blue }]} />
            <View style={styles.crewInfo}>
              <Text style={styles.crewName}>Rahul Sharma (Sales Rep)</Text>
              <Text style={styles.crewLocation}>📍 Manish Nagar · Meeting Consumer Ravi Kawale</Text>
              <Text style={styles.crewProgress}>Generated 5kWp Quote · ₹78,000 subsidy proposal sent</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiDelta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.slate500,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  badgeCount: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalType: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  systemTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate500,
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate900,
    marginTop: 6,
  },
  requestedDetail: {
    fontSize: 13,
    color: colors.slate600,
    marginTop: 2,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.slate100,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate600,
  },
  approveBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  emptyCard: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.slate500,
    fontSize: 13,
    fontWeight: '600',
  },
  crewCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
  },
  crewStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: 12,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  crewLocation: {
    fontSize: 11,
    color: colors.slate600,
    marginTop: 2,
  },
  crewProgress: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
});
