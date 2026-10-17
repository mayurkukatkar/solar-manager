import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export const Header: React.FC<{
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
}> = ({ title, subtitle, showSearch, onSearch }) => {
  const { user, backendStatus, updateServerUrl, switchTenantSession, logout } = useAuth();
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState(backendStatus.serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await updateServerUrl(customUrl);
      if (res.isOnline) {
        setTestResult(`✅ Connected! Latency: ${res.latencyMs || 0}ms`);
      } else {
        setTestResult(`⚠️ Unreachable at ${customUrl}. Check backend status.`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>
            {user?.tenantName || 'Solar ERP'}
          </Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Live Backend Status Pill */}
          <TouchableOpacity
            style={[
              styles.connectionPill,
              backendStatus.isOnline ? styles.connOnline : styles.connOffline,
            ]}
            onPress={() => {
              setCustomUrl(backendStatus.serverUrl);
              setTestResult(null);
              setServerModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.connDot,
                { backgroundColor: backendStatus.isOnline ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={styles.connectionText}>
              {backendStatus.isOnline ? 'Live Vercel' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {/* User/Tenant Pill */}
          <TouchableOpacity
            style={styles.tenantPill}
            onPress={() => setTenantModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.tenantPillText}>
              {user?.role === 'SUPER_ADMIN' ? '👑 Platform' : '🏢 Tenant'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TITLE & SUBTITLE */}
      {title && (
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      )}

      {/* SEARCH BAR (OPTIONAL) */}
      {showSearch && (
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads, projects, or customers..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={(t) => {
              setSearchText(t);
              if (onSearch) onSearch(t);
            }}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                if (onSearch) onSearch('');
              }}
            >
              <Text style={{ color: '#94a3b8', fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* TENANT / USER ACCOUNT MODAL */}
      <Modal visible={tenantModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTenantModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User Workspace</Text>
            <Text style={styles.modalSubtitle}>
              Logged in as <Text style={{ fontWeight: '800', color: colors.slate900 }}>{user?.email}</Text>
            </Text>

            <TouchableOpacity
              style={[styles.accountOption, user?.email === 'mayurkukatkar43@gmail.com' && styles.accountOptionActive]}
              onPress={() => {
                switchTenantSession('MAYUR');
                setTenantModalVisible(false);
              }}
            >
              <Text style={styles.accountOptionEmoji}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountOptionTitle}>WhereReady IT Solutions</Text>
                <Text style={styles.accountOptionSub}>Tenant Admin • Mayur Kukatkar (Nagpur)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accountOption, user?.email === '2018pkunal@gmail.com' && styles.accountOptionActive]}
              onPress={() => {
                switchTenantSession('KUNAL');
                setTenantModalVisible(false);
              }}
            >
              <Text style={styles.accountOptionEmoji}>☀️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountOptionTitle}>Solar Energy Solutions India</Text>
                <Text style={styles.accountOptionSub}>Tenant Admin • Kunal Prajapati (Mumbai)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accountOption, user?.role === 'SUPER_ADMIN' && styles.accountOptionActive]}
              onPress={() => {
                switchTenantSession('SUPER_ADMIN');
                setTenantModalVisible(false);
              }}
            >
              <Text style={styles.accountOptionEmoji}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountOptionTitle}>Platform Super Admin</Text>
                <Text style={styles.accountOptionSub}>Platform Owner • Global Telemetry</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setTenantModalVisible(false);
                logout();
              }}
            >
              <Text style={styles.logoutBtnText}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* BACKEND SERVER URL MODAL */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setServerModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backend Server Configuration</Text>
            <Text style={styles.modalSubtitle}>
              Connected to live Vercel API backend:
            </Text>

            <TextInput
              style={styles.serverInput}
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://solar-manager-three.vercel.app"
            />

            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setCustomUrl('https://solar-manager-three.vercel.app')}
              >
                <Text style={styles.presetChipText}>Live Vercel Backend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setCustomUrl('http://10.0.2.2:5000')}
              >
                <Text style={styles.presetChipText}>Android Localhost</Text>
              </TouchableOpacity>
            </View>

            {testResult && (
              <View style={styles.testResultBox}>
                <Text style={styles.testResultText}>{testResult}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.testBtn, testing && { opacity: 0.7 }]}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.testBtnText}>Test & Connect</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeBtn, { marginTop: 10 }]}
              onPress={() => setServerModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.slate900,
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.white,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  connOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  connOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  tenantPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tenantPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  titleSection: {
    marginTop: 14,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.white,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 3,
    marginBottom: 16,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  accountOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  accountOptionEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  accountOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  accountOptionSub: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
  },
  serverInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate900,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate700,
  },
  testResultBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
  },
  testBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  testBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate500,
  },
});
