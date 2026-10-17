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
  const { user, backendStatus, updateServerUrl, logout } = useAuth();
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
            <View style={styles.accountProfileCard}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountNameText}>{user?.name || 'Solar User'}</Text>
                <Text style={styles.accountEmailText}>{user?.email}</Text>
                <View style={styles.accountRoleBadge}>
                  <Text style={styles.accountRoleBadgeText}>
                    {user?.role === 'SUPER_ADMIN' ? '👑 PLATFORM SUPER ADMIN' : '🏢 TENANT ADMIN'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionInfoBox}>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Organization:</Text>
                <Text style={styles.sessionInfoVal}>{user?.tenantName || 'Solar Solutions'}</Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Session Auth:</Text>
                <Text style={[styles.sessionInfoVal, { color: '#059669' }]}>Bearer JWT (Verified)</Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Target Endpoint:</Text>
                <Text style={styles.sessionInfoVal} numberOfLines={1}>{backendStatus.serverUrl}</Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Backend Ping:</Text>
                <Text style={[styles.sessionInfoVal, { color: backendStatus.isOnline ? '#059669' : '#d97706' }]}>
                  {backendStatus.isOnline ? `Online (${backendStatus.latencyMs || 0}ms)` : 'Offline'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setTenantModalVisible(false);
                logout();
              }}
            >
              <Text style={styles.logoutBtnText}>🔒 Sign Out & End Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeBtn, { marginTop: 8 }]}
              onPress={() => setTenantModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
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
  accountProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  accountAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  accountNameText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
  },
  accountEmailText: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  accountRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  accountRoleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.slate800,
    letterSpacing: 0.5,
  },
  sessionInfoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate500,
  },
  sessionInfoVal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate800,
    maxWidth: 180,
  },
  logoutBtn: {
    marginTop: 8,
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
