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
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // First-Time Password Reset Modal State
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert('Required Field', 'Please enter your work email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required Field', 'Please enter your password.');
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, password);
    setLoading(false);

    if (res.requiresPasswordReset) {
      setResetEmail(res.email || cleanEmail);
      setTempPassword(password);
      setNewPassword('');
      setConfirmPassword('');
      setResetModalVisible(true);
      return;
    }

    if (!res.success && res.error) {
      Alert.alert('Authentication Failed', res.error || 'Invalid email or password. Please verify your credentials.');
    }
  };

  const handleResetSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Security Policy', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation password do not match.');
      return;
    }

    setResetLoading(true);
    const res = await forceResetPassword(resetEmail, tempPassword, newPassword);
    setResetLoading(false);

    if (res.success) {
      setResetModalVisible(false);
      Alert.alert('Security Initialized', 'Your permanent password has been saved. Logging in...');
    } else {
      Alert.alert('Reset Failed', res.error || 'Failed to update temporary password. Please try again.');
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
        {/* ENTERPRISE BRANDING */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoSun}>☀️</Text>
          </View>
          <Text style={styles.appName}>SOLAR MANAGER ERP</Text>
          <Text style={styles.appTagline}>Enterprise Solar EPC & Asset Management</Text>
        </View>

        {/* SESSION TIMEOUT BANNER */}
        {sessionExpired && (
          <View style={styles.sessionBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionBannerTitle}>⚠️ Session Expired</Text>
              <Text style={styles.sessionBannerText}>
                Your session has timed out. For security, please enter your credentials again.
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
            <Text style={styles.cardTitle}>Platform Access</Text>
            <Text style={styles.cardSubtitle}>Sign in to access your organization workspace</Text>
          </View>

          {/* EMAIL INPUT */}
          <Text style={styles.inputLabel}>WORK EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="name@solarcompany.com"
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
              placeholder="••••••••"
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
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* SUPPORT / FORGOT NOTICE */}
          <View style={styles.supportBox}>
            <Text style={styles.supportText}>
              Need access or forgot password? Contact your company system administrator.
            </Text>
          </View>

          <View style={styles.securityFooter}>
            <Text style={styles.securityFooterText}>
              🛡️ 256-bit TLS Encrypted • Certified Solar ERP Protocol
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
                  <Text style={styles.resetSubmitBtnText}>Save Password & Sign In</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.slate900,
    justifyContent: 'center',
    padding: 22,
    paddingVertical: 44,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoSun: {
    fontSize: 30,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1.5,
  },
  appTagline: {
    fontSize: 12,
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.slate900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 3,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate500,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.slate900,
    marginBottom: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.slate900,
  },
  showPasswordBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  showPasswordText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate600,
  },
  loginBtn: {
    backgroundColor: colors.slate900,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  supportBox: {
    marginTop: 18,
    alignItems: 'center',
  },
  supportText: {
    fontSize: 11,
    color: colors.slate400,
    textAlign: 'center',
    lineHeight: 16,
  },
  securityFooter: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  securityFooterText: {
    fontSize: 10,
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
