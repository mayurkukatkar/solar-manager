import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { offlineSyncService } from '../../services/offlineSyncService';

export const FieldProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    checkDrafts();
  }, []);

  const checkDrafts = async () => {
    const drafts = await offlineSyncService.getDraftLeads();
    setDraftCount(drafts.length);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Field App?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Representative Profile</Text>
        <Text style={styles.headerSubtitle}>Field Sales Executive & Solar Advisor</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <User size={36} color="#ffffff" />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Field Officer'}</Text>
          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color="#10b981" />
            <Text style={styles.roleBadgeText}>Solar Field Representative</Text>
          </View>
          <Text style={styles.tenantName}>
            🏢 {user?.tenantName || 'SolarManager Network'}
          </Text>
        </View>

        {/* PERFORMANCE STATS */}
        <Text style={styles.sectionHeading}>Monthly Field Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>28</Text>
            <Text style={styles.statLabel}>Leads Captured</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>19</Text>
            <Text style={styles.statLabel}>Quotes Sent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>8</Text>
            <Text style={styles.statLabel}>Deals Closed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumGold}>34.8</Text>
            <Text style={styles.statLabel}>kWp Contracted</Text>
          </View>
        </View>

        {/* OFFLINE RESILIENCE CARD */}
        <View style={styles.syncCard}>
          <View style={styles.syncCardLeft}>
            <RefreshCw size={20} color="#2563eb" />
            <View>
              <Text style={styles.syncTitle}>Offline Cache & Media Queue</Text>
              <Text style={styles.syncSubtitle}>
                {draftCount > 0 ? `${draftCount} draft leads awaiting sync` : 'All field records synced to server'}
              </Text>
            </View>
          </View>
          <View style={[styles.syncStatusBadge, draftCount > 0 ? styles.syncBadgePending : styles.syncBadgeGood]}>
            <Text style={[styles.syncStatusText, draftCount > 0 ? styles.syncTextPending : styles.syncTextGood]}>
              {draftCount > 0 ? 'Pending' : 'Synced'}
            </Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutBtnText}>Log Out from Field App</Text>
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
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  tenantName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statNumGold: {
    fontSize: 18,
    fontWeight: '900',
    color: '#d97706',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
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
  syncStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncBadgeGood: {
    backgroundColor: '#dcfce7',
  },
  syncBadgePending: {
    backgroundColor: '#fef3c7',
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  syncTextGood: {
    color: '#16a34a',
  },
  syncTextPending: {
    color: '#d97706',
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
