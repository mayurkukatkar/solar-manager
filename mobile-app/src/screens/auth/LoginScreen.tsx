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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export const LoginScreen: React.FC = () => {
  const { login, backendStatus, updateServerUrl, switchTenantSession } = useAuth();
  const [email, setEmail] = useState('mayurkukatkar43@gmail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState(backendStatus.serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success && res.error) {
      Alert.alert('Authentication Failed', res.error);
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
        setTestResult(`⚠️ Unreachable at ${customUrl}.`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* BRANDING MATCHING LIVE WEB FRONTEND */}
      <View style={styles.brandBox}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoSun}>☀️</Text>
        </View>
        <Text style={styles.appName}>SOLAR MANAGER ERP</Text>
        <Text style={styles.appTagline}>Enterprise Solar EPC & Asset Management</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Platform Control</Text>
            <Text style={styles.cardSubtitle}>Enter your credentials to access workspace</Text>
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

        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="platform@whereready.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.configServerLink}
          onPress={() => {
            setCustomUrl(backendStatus.serverUrl);
            setTestResult(null);
            setServerModalVisible(true);
          }}
        >
          <Text style={styles.configServerText}>
            ⚙️ Target: {backendStatus.serverUrl}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>1-TAP INSTANT ACCESS</Text>
          <View style={styles.line} />
        </View>

        {/* 1-Tap Quick Tenants */}
        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#a7f3d0' }]}
          onPress={() => switchTenantSession('MAYUR')}
        >
          <Text style={styles.quickRoleEmoji}>🏢</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickRoleTitle}>WhereReady IT Solutions</Text>
            <Text style={styles.quickRoleDesc}>Tenant Admin • Mayur Kukatkar (Nagpur)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#bfdbfe' }]}
          onPress={() => switchTenantSession('KUNAL')}
        >
          <Text style={styles.quickRoleEmoji}>☀️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickRoleTitle}>Solar Energy Solutions India</Text>
            <Text style={styles.quickRoleDesc}>Tenant Admin • Kunal Prajapati (Mumbai)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#e9d5ff' }]}
          onPress={() => switchTenantSession('SUPER_ADMIN')}
        >
          <Text style={styles.quickRoleEmoji}>👑</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickRoleTitle}>Platform Super Admin</Text>
            <Text style={styles.quickRoleDesc}>Platform Owner • Global Telemetry</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Backend URL Config Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backend API Target</Text>
            <Text style={styles.modalSubtitle}>
              Live backend deployed at Vercel:
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
    marginBottom: 20,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoSun: {
    fontSize: 26,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1.5,
  },
  appTagline: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 4,
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
    color: colors.slate400,
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
  quickRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  quickRoleEmoji: {
    fontSize: 20,
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
    marginTop: 4,
    marginBottom: 14,
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
