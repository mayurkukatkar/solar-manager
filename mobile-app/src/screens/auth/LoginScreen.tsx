import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export const LoginScreen: React.FC = () => {
  const {
    login,
    forceResetPassword,
    sessionExpired,
    clearSessionExpired,
    backendStatus,
    updateServerUrl,
  } = useAuth();

  const [email, setEmail] = useState('mayurkukatkar43@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Server Modal State
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState(backendStatus.serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // First-Time Password Reset Modal State
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your corporate email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.requiresPasswordReset) {
      setResetEmail(res.email || email.trim());
      setTempPassword(password);
      setNewPassword('');
      setConfirmPassword('');
      setResetModalVisible(true);
      return;
    }

    if (!res.success && res.error) {
      Alert.alert('Authentication Failed', res.error);
    }
  };

  const handleResetSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Security Policy', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setResetLoading(true);
    const res = await forceResetPassword(resetEmail, tempPassword, newPassword);
    setResetLoading(false);

    if (res.success) {
      setResetModalVisible(false);
      Alert.alert('Security Setup Complete', 'Your permanent password has been saved. Logging in...');
    } else {
      Alert.alert('Reset Failed', res.error || 'Failed to update temporary password.');
    }
  };

  const handleTestServer = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await updateServerUrl(customUrl);
      if (res.isOnline) {
        setTestResult(`✅ Connected! Latency: ${res.latencyMs || 0}ms`);
      } else {
        setTestResult(`⚠️ Unreachable at ${customUrl}. Check backend deployment.`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* BRANDING HEADER */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoSun}>☀️</Text>
          </View>
          <Text style={styles.appName}>SOLAR MANAGER ERP</Text>
          <Text style={styles.appTagline}>Enterprise Solar EPC & Asset Management</Text>
        </View>

        {/* SESSION EXPIRED BANNER */}
        {sessionExpired && (
          <View style={styles.sessionBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionBannerTitle}>⚠️ Session Expired</Text>
              <Text style={styles.sessionBannerText}>
                Your authentication token expired or was revoked. Please sign in again.
              </Text>
            </View>
            <TouchableOpacity onPress={clearSessionExpired} style={styles.sessionBannerClose}>
              <Text style={styles.sessionBannerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOGIN CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Platform Control</Text>
              <Text style={styles.cardSubtitle}>Verified cloud authentication</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.backendStatusPill,
                backendStatus.isOnline ? styles.backendOnline : styles.backendOffline,
              ]}
              onPress={() => {
                setCustomUrl(backendStatus.serverUrl);
                setTestResult(null);
                setServerModalVisible(true);
              }}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: backendStatus.isOnline ? '#10b981' : '#f59e0b' },
                ]}
              />
              <Text style={styles.backendStatusText}>
                {backendStatus.isOnline ? 'Live Vercel' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* EMAIL INPUT */}
          <Text style={styles.inputLabel}>CORPORATE EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="platform@whereready.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {/* PASSWORD INPUT WITH SHOW/HIDE */}
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.showPasswordBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* SIGN IN BUTTON */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Authenticate & Access</Text>
            )}
          </TouchableOpacity>

          {/* TARGET SERVER LINK */}
          <TouchableOpacity
            style={styles.configServerLink}
            onPress={() => {
              setCustomUrl(backendStatus.serverUrl);
              setTestResult(null);
              setServerModalVisible(true);
            }}
          >
            <Text style={styles.configServerText}>
              🔒 Target: {backendStatus.serverUrl}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>QUICK EMAIL PRESETS</Text>
            <View style={styles.line} />
          </View>

          {/* QUICK EMAIL PREFILL CHIPS (SECURE: DOES NOT BYPASS PASSWORD) */}
          <View style={styles.presetAccountsGrid}>
            <TouchableOpacity
              style={styles.presetAccountBtn}
              onPress={() => setEmail('mayurkukatkar43@gmail.com')}
            >
              <Text style={styles.presetAccountEmoji}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.presetAccountTitle}>WhereReady IT Solutions</Text>
                <Text style={styles.presetAccountSub}>mayurkukatkar43@gmail.com</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetAccountBtn}
              onPress={() => setEmail('platform@whereready.com')}
            >
              <Text style={styles.presetAccountEmoji}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.presetAccountTitle}>Platform Super Admin</Text>
                <Text style={styles.presetAccountSub}>platform@whereready.com</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.securityFooter}>
            <Text style={styles.securityFooterText}>
              🛡️ End-to-end encrypted with TLS 1.3 & Bearer JWT Token Verification
            </Text>
          </View>
        </View>

        {/* FIRST-TIME PASSWORD RESET MODAL */}
        <Modal visible={resetModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalKeyBadge}>
                  <Text style={{ fontSize: 20 }}>🔑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Set Permanent Password</Text>
                  <Text style={styles.modalSubtitle}>
                    Initial activation requires setting a new secure password.
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>ACCOUNT EMAIL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#f1f5f9', color: '#64748b' }]}
                value={resetEmail}
                editable={false}
              />

              <Text style={styles.inputLabel}>TEMPORARY PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={tempPassword}
                onChangeText={setTempPassword}
                secureTextEntry
                placeholder="Current temporary password"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>NEW PERMANENT PASSWORD (MIN 8 CHARS)</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter at least 8 characters"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={styles.resetSubmitBtn}
                onPress={handleResetSubmit}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.resetSubmitBtnText}>Save Password & Enter</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setResetModalVisible(false)}
                disabled={resetLoading}
              >
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* BACKEND SERVER URL MODAL */}
        <Modal visible={serverModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Backend API Endpoint</Text>
              <Text style={styles.modalSubtitle}>
                Production live backend endpoint:
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
                style={styles.testBtn}
                onPress={handleTestServer}
                disabled={testing}
              >
                {testing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.testBtnText}>Test & Connect</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setServerModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.slate900,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 36,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoSun: {
    fontSize: 28,
  },
  appName: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1.5,
  },
  appTagline: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 4,
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  sessionBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2,
  },
  sessionBannerText: {
    fontSize: 11,
    color: '#78350f',
  },
  sessionBannerClose: {
    padding: 6,
    marginLeft: 8,
  },
  sessionBannerCloseText: {
    fontSize: 16,
    color: '#92400e',
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  backendStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  backendOnline: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  backendOffline: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  backendStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate700,
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
    marginBottom: 10,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate900,
  },
  showPasswordBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  showPasswordText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate600,
  },
  loginBtn: {
    backgroundColor: colors.slate900,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  configServerLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  configServerText: {
    fontSize: 10,
    color: colors.slate400,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.slate200,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.slate400,
    marginHorizontal: 8,
    letterSpacing: 0.5,
  },
  presetAccountsGrid: {
    gap: 8,
  },
  presetAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  presetAccountEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  presetAccountTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  presetAccountSub: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 1,
  },
  securityFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  securityFooterText: {
    fontSize: 9,
    color: colors.slate400,
    textAlign: 'center',
    fontWeight: '600',
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
    maxWidth: 380,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalKeyBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  resetSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetSubmitBtnText: {
    color: colors.white,
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
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate500,
  },
});
