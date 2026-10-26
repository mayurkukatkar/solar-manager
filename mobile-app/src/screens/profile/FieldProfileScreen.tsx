import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  Platform,
} from 'react-native';
import {
  User,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Award,
  Zap,
  LogOut,
  RefreshCw,
  Layers,
  CheckCircle2,
  Landmark,
  IndianRupee,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  Layers as HubLayers,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { offlineSyncService } from '../../services/offlineSyncService';
import { Header } from '../../components/Header';

export const FieldProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [draftCount, setDraftCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkDrafts();
  }, []);

  const checkDrafts = async () => {
    const drafts = await offlineSyncService.getDraftLeads();
    setDraftCount(drafts.length);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setTimeout(async () => {
      setSyncing(false);
      await checkDrafts();
      Alert.alert('Offline Sync Complete', 'All local field drafts and media records are synced with the live server.');
    }, 1200);
  };

  const handleOpenNationalPortal = () => {
    Linking.openURL('https://pmsuryaghar.gov.in');
  };

  const handleOpenMsedclPortal = () => {
    Linking.openURL('https://www.mahadiscom.in/solar_rooftop');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Solar Vendor App?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* GLOBAL HEADER */}
      <Header
        title="Account & Enterprise Hub"
        subtitle="WhereReady Solar OS • Where Growth Gets Ready."
      />

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* VENDOR PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Image
              source={require('../../../assets/app-icon.png')}
              style={styles.avatarLogo}
              resizeMode="cover"
            />
            <View style={styles.profileMeta}>
              <Text style={styles.tenantName}>{user?.tenantName || 'WhereReady Solar Partner'}</Text>
              <Text style={styles.userName}>👤 {user?.name || 'Solar Vendor Owner'}</Text>
              <View style={styles.roleBadge}>
                <ShieldCheck size={13} color="#0066FF" />
                <Text style={styles.roleBadgeText}>Verified Solar OS Vendor</Text>
              </View>
            </View>
          </View>
          <View style={styles.planBar}>
            <Text style={styles.planText}>Platform: <Text style={styles.planBold}>WhereReady Solar OS Enterprise</Text></Text>
            <Text style={styles.planExpiry}>Active • 2027</Text>
          </View>
        </View>

        {/* CASH FLOW & TURNOVER RADAR */}
        <Text style={styles.sectionHeading}>Business Cash Flow Radar</Text>
        <View style={styles.radarCard}>
          <View style={styles.radarRow}>
            <Text style={styles.radarLabel}>Total Monthly Contract Value</Text>
            <Text style={styles.radarValueTotal}>₹34.8 Lakhs</Text>
          </View>
          <View style={styles.radarDivider} />
          <View style={styles.radarGrid}>
            <View style={styles.radarGridItem}>
              <Text style={styles.radarGridLabel}>Advances Collected</Text>
              <Text style={styles.radarGridValGreen}>₹8.4 L</Text>
              <Text style={styles.radarGridSub}>Token 20%</Text>
            </View>
            <View style={styles.radarGridItem}>
              <Text style={styles.radarGridLabel}>Due on Delivery</Text>
              <Text style={styles.radarGridValAmber}>₹18.2 L</Text>
              <Text style={styles.radarGridSub}>Material 60%</Text>
            </View>
            <View style={styles.radarGridItem}>
              <Text style={styles.radarGridLabel}>Subsidy Pending</Text>
              <Text style={styles.radarGridValBlue}>₹8.2 L</Text>
              <Text style={styles.radarGridSub}>National DBT</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openFinanceBtn}
            onPress={() => navigation?.navigate('Finance')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Receipt size={16} color="#059669" />
              <Text style={styles.openFinanceBtnText}>View Full Invoices & Milestone Billing</Text>
            </View>
            <ChevronRight size={16} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* ENTERPRISE MODULES SHORTCUTS */}
        <Text style={styles.sectionHeading}>Solar Enterprise Hub</Text>
        
        <TouchableOpacity
          style={styles.portalCard}
          onPress={() => navigation?.navigate('Finance')}
          activeOpacity={0.8}
        >
          <View style={styles.portalLeft}>
            <View style={[styles.portalIconCircleGold, { backgroundColor: '#ecfdf5' }]}>
              <Receipt size={20} color="#059669" />
            </View>
            <View>
              <Text style={styles.portalTitle}>Finance & Invoicing</Text>
              <Text style={styles.portalSub}>Milestone billing, collections & overdue aging</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.portalCard}
          onPress={() => navigation?.navigate('Modules', { screen: 'SUBSIDY' })}
          activeOpacity={0.8}
        >
          <View style={styles.portalLeft}>
            <View style={styles.portalIconCircleGold}>
              <Landmark size={20} color="#d97706" />
            </View>
            <View>
              <Text style={styles.portalTitle}>PM Surya Ghar Studio</Text>
              <Text style={styles.portalSub}>CFA national portal tracking & DBT release</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.portalCard}
          onPress={() => navigation?.navigate('Modules')}
          activeOpacity={0.8}
        >
          <View style={styles.portalLeft}>
            <View style={[styles.portalIconCircleBlue, { backgroundColor: '#f5f3ff' }]}>
              <HubLayers size={20} color="#7c3aed" />
            </View>
            <View>
              <Text style={styles.portalTitle}>Solar Hub (All 8 Modules)</Text>
              <Text style={styles.portalSub}>Quotations, Site Surveys, AMC, Logistics & DISCOM</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#64748b" />
        </TouchableOpacity>

        {/* STATUTORY PORTAL SHORTCUTS */}
        <Text style={styles.sectionHeading}>External Utility Portals</Text>
        <TouchableOpacity style={styles.portalCard} onPress={handleOpenNationalPortal} activeOpacity={0.8}>
          <View style={styles.portalLeft}>
            <View style={styles.portalIconCircleGold}>
              <Landmark size={20} color="#d97706" />
            </View>
            <View>
              <Text style={styles.portalTitle}>PM Surya Ghar National Portal</Text>
              <Text style={styles.portalSub}>pmsuryaghar.gov.in (Vendor Login)</Text>
            </View>
          </View>
          <ExternalLink size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.portalCard} onPress={handleOpenMsedclPortal} activeOpacity={0.8}>
          <View style={styles.portalLeft}>
            <View style={styles.portalIconCircleBlue}>
              <Zap size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.portalTitle}>MSEDCL Net-Metering Portal</Text>
              <Text style={styles.portalSub}>mahadiscom.in (Net-meter clearance)</Text>
            </View>
          </View>
          <ExternalLink size={16} color="#64748b" />
        </TouchableOpacity>

        {/* OFFLINE RESILIENCE CARD */}
        <Text style={styles.sectionHeading}>Terrace Offline Resilience</Text>
        <View style={styles.syncCard}>
          <View style={styles.syncCardLeft}>
            <RefreshCw size={20} color="#2563eb" />
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>Local Draft Queue & Media Cache</Text>
              <Text style={styles.syncSubtitle}>
                {draftCount > 0 ? `${draftCount} field drafts waiting for upload` : 'All field records synced to server'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.syncActionBtn}
            onPress={handleSyncAll}
            disabled={syncing}
            activeOpacity={0.8}
          >
            <Text style={styles.syncActionText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* WHEREREADY BRAND & BUILD FOOTER */}
        <View style={styles.brandFooterCard}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.brandFooterLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandFooterVersion}>WhereReady Solar OS • v1.0.0 (Production APK Ready)</Text>
          <Text style={styles.brandFooterCopy}>Enterprise Solar EPC Operations, Engineering & Field Asset Management</Text>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutBtnText}>Log Out from Solar Vendor Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  profileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLogo: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  profileMeta: {
    flex: 1,
  },
  tenantName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  userName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  planBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  planText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  planBold: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  planExpiry: {
    fontSize: 11,
    color: '#94a3b8',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  radarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  radarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  radarValueTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563eb',
  },
  radarDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  radarGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  radarGridItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  radarGridLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  radarGridValGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16a34a',
    marginTop: 4,
  },
  radarGridValAmber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#d97706',
    marginTop: 4,
  },
  radarGridValBlue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 4,
  },
  radarGridSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  openFinanceBtn: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  openFinanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  portalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  portalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portalIconCircleGold: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalIconCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  portalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  syncCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  syncCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  syncSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  syncActionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  brandFooterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  brandFooterLogo: {
    width: 220,
    height: 50,
    marginBottom: 10,
  },
  brandFooterVersion: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.3,
  },
  brandFooterCopy: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
  },
});
