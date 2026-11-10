import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
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
  Check,
  ShieldCheck,
} from 'lucide-react-native';
import {
  useAuth,
  STORAGE_REMEMBER_ME_KEY,
  STORAGE_REMEMBERED_EMAIL_KEY,
} from '../../context/AuthContext';
import { SafeStorage } from '../../api/client';
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

  const scrollViewRef = useRef<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Track keyboard visibility to adapt layout dynamically and prevent hiding fields
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Password Reset State for first-time login
  const [requiresReset, setRequiresReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // 1. Keyboard event listeners to dynamically adjust padding & layout
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 2. Load "Remember Me" preferences on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedRemember = await SafeStorage.getItem(STORAGE_REMEMBER_ME_KEY);
        const savedEmail = await SafeStorage.getItem(STORAGE_REMEMBERED_EMAIL_KEY);

        if (!isMounted) return;

        if (savedRemember === 'false') {
          setRememberMe(false);
        } else {
          setRememberMe(true);
          if (savedEmail) {
            setEmail(savedEmail);
          }
        }
      } catch (err) {
        console.warn('Remember Me load notice:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const openWhatsApp = async (text: string) => {
    const url = `https://wa.me/919270201883?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Cannot Open WhatsApp', 'Please ensure WhatsApp is installed or visit https://wa.me/919270201883');
    }
  };

  const handleSignIn = async () => {
    if (loading) return;

    Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side RFC-compliant validation & security checks
    if (!cleanEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email format (e.g. name@company.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanEmail, password, rememberMe);
      setLoading(false);

      if (res.requiresPasswordReset) {
        setResetEmail(res.email || cleanEmail);
        setRequiresReset(true);
        return;
      }

      if (!res.success && res.error) {
        setErrorMessage(res.error || 'Incorrect email or password. Please try again.');
        // Auto scroll to top to see error clearly
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please verify your connection.');
    }
  };

  const handleForceReset = async () => {
    if (resetLoading) return;

    Keyboard.dismiss();
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.rootContainer, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
        {/* Subtle Engineering Square Grid Background */}
        <GridBackground isDark={isDark} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContainer,
              {
                justifyContent: isKeyboardVisible ? 'flex-start' : 'center',
                paddingTop: isKeyboardVisible ? 16 : 32,
                paddingBottom: isKeyboardVisible ? 160 : 36,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* TOP HEADER */}
            <View style={[styles.topHeader, isKeyboardVisible && styles.topHeaderCompact]}>
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
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#E2E8F0',
                },
              ]}
            >
              {/* Friendly Greeting with Sol Character (Compact when typing) */}
              <View style={[styles.mascotSection, isKeyboardVisible && styles.mascotSectionCompact]}>
                <GuideCharacter
                  pose={requiresReset ? 'inspect' : 'wave'}
                  size={isKeyboardVisible ? 44 : 68}
                  speechText={requiresReset ? 'Security Check' : 'Welcome back!'}
                />
                <Text style={[styles.cardTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                  {requiresReset ? 'Set New Password' : 'Sign In to Solar OS'}
                </Text>
                {!isKeyboardVisible && (
                  <Text style={styles.cardSubtitle}>
                    {requiresReset
                      ? 'Please create a permanent password to secure your workspace.'
                      : 'Enter your account email and password to continue.'}
                  </Text>
                )}
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
                      textContentType="newPassword"
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
                      textContentType="newPassword"
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
                      textContentType="emailAddress"
                      autoComplete="email"
                    />
                  </View>

                  {/* Password Input */}
                  <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#334155' }]}>
                    Password
                  </Text>
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
                      textContentType="password"
                      autoComplete="password"
                      onFocus={() => {
                        // Ensure password input and sign in button are smoothly scrolled into view
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 120, animated: true });
                        }, 100);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                    </TouchableOpacity>
                  </View>

                  {/* REMEMBER ME & FORGOT PASSWORD ROW */}
                  <View style={styles.rememberForgotRow}>
                    <TouchableOpacity
                      style={styles.rememberBtn}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.75}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: rememberMe ? colors.primary : (isDark ? colors.border : '#CBD5E1'),
                            backgroundColor: rememberMe ? colors.primary : 'transparent',
                          },
                        ]}
                      >
                        {rememberMe && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.rememberLabel, { color: isDark ? colors.textSecondary : '#475569' }]}>
                        Remember me
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => openWhatsApp('Hi WhereReady, I need help logging into my Solar OS account.')}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={13} color="#059669" />
                  <Text style={styles.assistanceLabel}>256-Bit Encrypted</Text>
                </View>
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => openWhatsApp('Hi WhereReady, I have a question about logging in.')}
                  activeOpacity={0.7}
                >
                  <Phone size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.whatsappText}>Support on WhatsApp</Text>
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
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  topHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  topHeaderCompact: {
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 1.2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  dangerBanner: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  dangerBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9F1239',
  },
  dangerBannerText: {
    fontSize: 11,
    color: '#9F1239',
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mascotSectionCompact: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
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
    marginBottom: 14,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
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
    marginBottom: 14,
  },
  alertSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
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
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  rememberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 20,
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
    fontWeight: '600',
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
    marginTop: 18,
  },
  pageFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default LoginScreen;
