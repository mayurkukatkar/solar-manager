import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@ekvarta.com');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (selectedRole: UserRole, defaultEmail: string) => {
    setEmail(defaultEmail);
    setLoading(true);
    await login(defaultEmail, selectedRole);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoSun}>☀️</Text>
        </View>
        <Text style={styles.appName}>SOLAR MANAGER</Text>
        <Text style={styles.appTagline}>Field Operations & Executive Mobile Suite</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In to Your Workspace</Text>
        <Text style={styles.cardSubtitle}>Role-adaptive mobile ERP client</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => login(email)}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>{loading ? 'Authenticating...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR 1-TAP DEMO LOGIN</Text>
          <View style={styles.line} />
        </View>

        {/* 1-Tap Quick Role Selectors */}
        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#a7f3d0' }]}
          onPress={() => handleQuickLogin('OWNER', 'owner@ekvarta.com')}
        >
          <Text style={styles.quickRoleEmoji}>👔</Text>
          <View>
            <Text style={styles.quickRoleTitle}>Login as Owner / Executive</Text>
            <Text style={styles.quickRoleDesc}>Full telemetry, approvals & team status</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#bfdbfe' }]}
          onPress={() => handleQuickLogin('SALES_AGENT', 'rahul.sales@ekvarta.com')}
        >
          <Text style={styles.quickRoleEmoji}>🤝</Text>
          <View>
            <Text style={styles.quickRoleTitle}>Login as Sales Representative</Text>
            <Text style={styles.quickRoleDesc}>60s quote builder & field CRM leads</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#fde68a' }]}
          onPress={() => handleQuickLogin('TECHNICIAN', 'amit.installer@ekvarta.com')}
        >
          <Text style={styles.quickRoleEmoji}>⚡</Text>
          <View>
            <Text style={styles.quickRoleTitle}>Login as Field Technician</Text>
            <Text style={styles.quickRoleDesc}>On-site checklist, barcodes & geo-photos</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate900,
    justifyContent: 'center',
    padding: 20,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoSun: {
    fontSize: 32,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1.2,
  },
  appTagline: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
    marginBottom: 18,
  },
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    color: colors.slate900,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.slate200,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  quickRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.slate50,
    marginBottom: 8,
  },
  quickRoleEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  quickRoleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  quickRoleDesc: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 1,
  },
});
