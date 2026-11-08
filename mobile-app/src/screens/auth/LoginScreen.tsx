import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Phone,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme';
import { GuideCharacter } from '../../components/GuideCharacter';
import { GridBackground } from '../../components/common';

export const LoginScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
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
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password Reset State for first-time login
  const [requiresReset, setRequiresReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const openWhatsApp = async (text: string) => {
    const url = `https://wa.me/919270201883?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Cannot Open WhatsApp', 'Please ensure WhatsApp is installed or visit https://wa.me/919270201883');
    }
  };

  const handleSignIn = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setErrorMessage('');
    setSuccessMessage('');

    if (!cleanEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, password);
    setLoading(false);

    if (res.requiresPasswordReset) {
      setResetEmail(res.email || cleanEmail);
      setRequiresReset(true);
      return;
    }

    if (!res.success && res.error) {
      setErrorMessage(res.error || 'Incorrect email or password. Please try again.');
    }
  };

  const handleForceReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setResetLoading(true);
    const res = await forceResetPassword(resetEmail || email.trim(), password, newPassword);
    setResetLoading(false);

    if (res.success) {
      setSuccessMessage('Password updated successfully. Please sign in with your new password.');
      setRequiresReset(false);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMessage(res.error || 'Failed to reset password. Please check your credentials.');
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
      {/* Subtle Engineering Square Grid Background */}
      <GridBackground isDark={isDark} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP HEADER */}
          <View style={styles.topHeader}>
            <View style={styles.brandRow}>
              <View style={[styles.logoBox, { backgroundColor: '#FFFFFF', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandTextGroup}>
                <Text style={[styles.brandName, { color: isDark ? colors.text : '#0F172A' }]}>
                  WhereReady
                </Text>
                <Text style={styles.brandBadge}>
                  SOLAR OS
                </Text>
              </View>
            </View>
          </View>

          {/* SESSION TIMEOUT BANNER */}
          {sessionExpired && (
            <View style={[styles.banner, styles.warningBanner]}>
              <AlertCircle size={16} color="#B45309" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.warningBannerText}>
                Session timed out. Please sign in again.
              </Text>
              <TouchableOpacity onPress={clearSessionExpired} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color="#B45309" />
              </TouchableOpacity>
            </View>
          )}

          {/* ACCOUNT SUSPENDED BANNER */}
          {accountSuspended && (
            <View style={[styles.banner, styles.dangerBanner]}>
              <AlertCircle size={16} color="#BE123C" style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerBannerTitle}>ACCOUNT SUSPENDED</Text>
                <Text style={styles.dangerBannerText}>
                  {accountSuspendedMessage || 'Your organization account is suspended by platform administrator.'}
                </Text>
              </View>
              <TouchableOpacity onPress={clearAccountSuspended} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color="#BE123C" />
              </TouchableOpacity>
            </View>
          )}

          {/* MAIN LOGIN CARD */}
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
            
            {/* Friendly Greeting with Sol Character */}
            <View style={styles.mascotSection}>
              <GuideCharacter
                pose="wave"
                size={70}
                speechText={requiresReset ? 'Security Check' : 'Welcome back!'}
              />
              <Text style={[styles.cardTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                {requiresReset ? 'Set New Password' : 'Sign In to Solar OS'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {requiresReset
                  ? 'Please create a permanent password to secure your workspace.'
                  : 'Enter your account email and password to continue.'}
              </Text>
            </View>

            {/* Error and Success Alerts */}
            {errorMessage ? (
              <View style={styles.alertError}>
                <AlertCircle size={15} color="#DC2626" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={styles.alertErrorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.alertSuccess}>
                <CheckCircle2 size={15} color="#059669" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={styles.alertSuccessText}>{successMessage}</Text>
              </View>
            ) : null}

            {requiresReset ? (
              /* PASSWORD RESET FORM */
              <View style={styles.formContainer}>
                {/* Account Email (Read-Only) */}
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#334155' }]}>
                  Account Email
                </Text>
                <View style={[styles.inputContainer, styles.inputDisabled, { borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                  <Mail size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, { color: '#64748B' }]}
                    value={resetEmail || email}
                    editable={false}
                  />
                </View>

                {/* New Password */}
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#334155' }]}>
                  New Password
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.surfaceRecessed : '#F8FAFC', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                  <Lock size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? colors.text : '#0F172A' }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showNewPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#334155' }]}>
                  Confirm Password
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.surfaceRecessed : '#F8FAFC', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                  <Lock size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? colors.text : '#0F172A' }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Save & Continue Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#0F172A' }]}
                  onPress={handleForceReset}
                  disabled={resetLoading}
                  activeOpacity={0.88}
                >
                  {resetLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.btnInnerRow}>
                      <Text style={styles.actionBtnText}>Save &amp; Continue</Text>
                      <ArrowRight size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Cancel / Back to Login */}
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setRequiresReset(false)}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.backBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* STANDARD LOGIN FORM */
              <View style={styles.formContainer}>
                {/* Email Address */}
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#334155' }]}>
                  Email Address
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.surfaceRecessed : '#F8FAFC', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                  <Mail size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? colors.text : '#0F172A' }]}
                    placeholder="name@company.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>

                {/* Password Label Row */}
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#334155', marginBottom: 0 }]}>
                    Password
                  </Text>
                  <TouchableOpacity
                    onPress={() => openWhatsApp('Hi WhereReady, I need help logging into my Solar OS account.')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Password Input */}
                <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.surfaceRecessed : '#F8FAFC', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                  <Lock size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? colors.text : '#0F172A' }]}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.signInBtn]}
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.btnInnerRow}>
                      <Text style={styles.actionBtnText}>Sign In</Text>
                      <ArrowRight size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Assistance Footer Divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? colors.borderSubtle : '#F1F5F9' }]} />

            {/* Assistance Row */}
            <View style={styles.assistanceRow}>
              <Text style={styles.assistanceLabel}>Need help signing in?</Text>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => openWhatsApp('Hi WhereReady, I have a question about logging in.')}
                activeOpacity={0.7}
              >
                <Phone size={12} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.whatsappText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* MINIMAL FOOTER */}
          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterText}>
              © {new Date().getFullYear()} WhereReady Solar OS • Nagpur, Maharashtra
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  topHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 16,
  },
  brandBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  warningBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  dangerBanner: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  dangerBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#BE123C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dangerBannerText: {
    fontSize: 12,
    color: '#9F1239',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 10,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
    lineHeight: 17,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  alertSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 10,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signInBtn: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  divider: {
    height: 1,
    marginTop: 22,
    marginBottom: 14,
  },
  assistanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assistanceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  whatsappText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  pageFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  pageFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default LoginScreen;
