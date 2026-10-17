import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { UserRole } from '../types';

export const Header: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { user, role, switchRole, backendStatus, updateServerUrl, checkServerConnection } = useAuth();
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState(backendStatus.serverUrl || 'http://localhost:5000');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return { label: '👔 Owner', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'SALES_AGENT':
        return { label: '🤝 Sales Rep', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'TECHNICIAN':
        return { label: '⚡ Field Tech', bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await updateServerUrl(customUrl);
      if (res.isOnline) {
        setTestResult(`✅ Connected! Latency: ${res.latencyMs || 0}ms`);
      } else {
        setTestResult(`⚠️ Unreachable at ${customUrl}. Check if server is running.`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const badge = getRoleBadge(role);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>{user?.tenantName || 'Solar ERP'}</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Backend Connection Indicator */}
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
              {backendStatus.isOnline ? 'Live API' : 'Demo/Offline'}
            </Text>
          </TouchableOpacity>

          {/* Role Pill */}
          <TouchableOpacity
            onPress={() => setRoleModalVisible(true)}
            style={[styles.rolePill, { backgroundColor: badge.bg, borderColor: badge.border }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.rolePillText, { color: badge.text }]}>{badge.label}</Text>
            <Text style={styles.switchHint}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {title && (
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      )}

      {/* Role Switcher Modal */}
      <Modal visible={roleModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Mobile Workspace</Text>
            <Text style={styles.modalSubtitle}>
              Experience the interconnected app tailored for each operational role:
            </Text>

            <TouchableOpacity
              style={[styles.roleOption, role === 'OWNER' && styles.roleOptionActive]}
              onPress={() => {
                switchRole('OWNER');
                setRoleModalVisible(false);
              }}
            >
              <Text style={styles.roleOptionEmoji}>👔</Text>
              <View style={styles.roleOptionTextWrapper}>
                <Text style={styles.roleOptionTitle}>Owner / Executive</Text>
                <Text style={styles.roleOptionDesc}>Revenue KPIs, cash flow, stage & discount approvals</Text>
              </View>
              {role === 'OWNER' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, role === 'SALES_AGENT' && styles.roleOptionActive]}
              onPress={() => {
                switchRole('SALES_AGENT');
                setRoleModalVisible(false);
              }}
            >
              <Text style={styles.roleOptionEmoji}>🤝</Text>
              <View style={styles.roleOptionTextWrapper}>
                <Text style={styles.roleOptionTitle}>Sales Agent / Field CRM</Text>
                <Text style={styles.roleOptionDesc}>On-ground leads, 60s quotes & WhatsApp proposals</Text>
              </View>
              {role === 'SALES_AGENT' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, role === 'TECHNICIAN' && styles.roleOptionActive]}
              onPress={() => {
                switchRole('TECHNICIAN');
                setRoleModalVisible(false);
              }}
            >
              <Text style={styles.roleOptionEmoji}>⚡</Text>
              <View style={styles.roleOptionTextWrapper}>
                <Text style={styles.roleOptionTitle}>Field Technician / Installer</Text>
                <Text style={styles.roleOptionDesc}>Job queue, checklists, serial scanning, geo-photos & e-sign</Text>
              </View>
              {role === 'TECHNICIAN' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Backend Connection Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setServerModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backend Connection</Text>
            <Text style={styles.modalSubtitle}>
              Connect mobile app directly to your Node.js/Express backend ({backendStatus.serverUrl})
            </Text>

            <Text style={styles.inputLabel}>SERVER API URL</Text>
            <TextInput
              style={styles.serverInput}
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://localhost:5000"
            />

            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setCustomUrl('http://localhost:5000')}
              >
                <Text style={styles.presetChipText}>Localhost:5000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setCustomUrl('http://10.0.2.2:5000')}
              >
                <Text style={styles.presetChipText}>Android (10.0.2.2)</Text>
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
                <Text style={styles.testBtnText}>Test & Save Server URL</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { marginTop: 10 }]}
              onPress={() => setServerModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginTop: 2,
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
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  connOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  switchHint: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate600,
  },
  titleSection: {
    marginTop: 18,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 4,
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
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    marginBottom: 12,
  },
  roleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  roleOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  roleOptionTextWrapper: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  activeCheck: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  serverInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.slate900,
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: colors.slate100,
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
    backgroundColor: colors.slate50,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
  },
  testBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  testBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  closeButton: {
    marginTop: 6,
    paddingVertical: 12,
    backgroundColor: colors.slate900,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
