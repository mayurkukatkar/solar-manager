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
  Image,
} from 'react-native';
import {
  Sun,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const {
    login,
    forceResetPassword,
    sessionExpired,
    clearSessionExpired,
    accountSuspended,
    accountSuspendedMessage,
    clearAccountSuspended,
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
    const cleanEmail = email.trim().toLowerCase();
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
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* WHERE READY SOLAR OS BRANDING */}
        <View style={styles.brandBox}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoBanner}
            resizeMode="contain"
          />
          <Text style={styles.appTagline}>Enterprise Solar EPC & Asset Operating System</Text>
        </View>

        {/* SESSION TIMEOUT BANNER */}
        {sessionExpired && (
          <View style={styles.sessionBanner}>
            <AlertCircle size={16} color="#d97706" style={{ marginRight: 8 }} />
            <Text style={styles.sessionBannerText}>
              Session timed out. Please sign in again.
            </Text>
            <TouchableOpacity onPress={clearSessionExpired} style={{ padding: 4 }}>
              <X size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* ACCOUNT SUSPENDED BANNER */}
        {accountSuspended && (
          <View style={styles.suspendedBanner}>
            <AlertCircle size={16} color="#e11d48" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.suspendedBannerTitle}>ACCOUNT SUSPENDED</Text>
              <Text style={styles.suspendedBannerText}>
                {accountSuspendedMessage || 'Your organization account is suspended by platform administrator.'}
              </Text>
            </View>
            <TouchableOpacity onPress={clearAccountSuspended} style={{ padding: 4 }}>
              <X size={14} color="#be123c" />
            </TouchableOpacity>
          </View>
        )}

        {/* LOGIN CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Access your enterprise vendor workspace</Text>

          {/* EMAIL INPUT */}
          <Text style={styles.inputLabel}>WORK EMAIL</Text>
          <View style={styles.inputContainer}>
            <Mail size={16} color="#94a3b8" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              placeholder="name@solarcompany.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          {/* PASSWORD INPUT WITH SHOW/HIDE */}
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Lock size={16} color="#94a3b8" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
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
              {showPassword ? (
                <EyeOff size={16} color="#64748b" />
              ) : (
                <Eye size={16} color="#64748b" />
              )}
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
              <Text style={styles.loginBtnText}>Continue to Workspace</Text>
            )}
          </TouchableOpacity>

          <View style={styles.securityFooter}>
            <ShieldCheck size={14} color="#0066FF" style={{ marginRight: 6 }} />
            <Text style={styles.securityFooterText}>
              TLS 1.3 Verified • WhereReady Cloud Synced
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FIRST-TIME PASSWORD RESET MODAL */}
      <Modal visible={resetModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalKeyBadge}>
                <KeyRound size={20} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Update Password</Text>
                <Text style={styles.modalSubtitle}>Create a permanent password for security</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>NEW PASSWORD (MIN. 8 CHARS)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.resetSubmitBtn}
              onPress={handleResetSubmit}
              disabled={resetLoading}
              activeOpacity={0.85}
            >
              {resetLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.resetSubmitBtnText}>Save Permanent Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setResetModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBanner: {
    width: 280,
    height: 64,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  sessionBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  showPasswordBtn: {
    padding: 6,
  },
  loginBtn: {
    backgroundColor: '#0066FF',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  securityFooterText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalKeyBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  resetSubmitBtn: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  resetSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  suspendedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    width: '100%',
  },
  suspendedBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#be123c',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  suspendedBannerText: {
    fontSize: 12,
    color: '#9f1239',
    lineHeight: 16,
    fontWeight: '500',
  },
});
