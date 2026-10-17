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
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const { login, backendStatus, updateServerUrl } = useAuth();
  const [email, setEmail] = useState('mayurkukatkar43@gmail.com');
  const [password, setPassword] = useState('Tejshree43@');
  const [loading, setLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState(backendStatus.serverUrl || 'http://localhost:5000');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleQuickLogin = async (selectedRole: UserRole, defaultEmail: string) => {
    setEmail(defaultEmail);
    setLoading(true);
    await login(defaultEmail, password, selectedRole);
    setLoading(false);
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
      <View style={styles.brandBox}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoSun}>☀️</Text>
        </View>
        <Text style={styles.appName}>SOLAR MANAGER</Text>
        <Text style={styles.appTagline}>Field Operations & Executive Mobile Suite</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Sign In to Your Workspace</Text>
            <Text style={styles.cardSubtitle}>Production ERP Connected Client</Text>
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
              {backendStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

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
            ⚙️ Server: {backendStatus.serverUrl} (Tap to change)
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR 1-TAP ROLE LOGIN</Text>
          <View style={styles.line} />
        </View>

        {/* 1-Tap Quick Role Selectors */}
        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#a7f3d0' }]}
          onPress={() => handleQuickLogin('OWNER', 'mayurkukatkar43@gmail.com')}
        >
          <Text style={styles.quickRoleEmoji}>👔</Text>
          <View>
            <Text style={styles.quickRoleTitle}>Login as Owner / Executive</Text>
            <Text style={styles.quickRoleDesc}>Full telemetry, pipeline & stage approvals</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#bfdbfe' }]}
          onPress={() => handleQuickLogin('SALES_AGENT', 'rahul.sales@whereready.com')}
        >
          <Text style={styles.quickRoleEmoji}>🤝</Text>
          <View>
            <Text style={styles.quickRoleTitle}>Login as Sales Representative</Text>
            <Text style={styles.quickRoleDesc}>60s quote builder & field CRM leads</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickRoleBtn, { borderColor: '#fde68a' }]}
          onPress={() => handleQuickLogin('TECHNICIAN', 'amit.installer@whereready.com')}
        >
          <Text style={styles.quickRoleEmoji}>⚡</Text>
          <View>
            <Text style={styles.quickRoleTitle}>Login as Field Technician</Text>
            <Text style={styles.quickRoleDesc}>On-site checklist, barcodes & geo-photos</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Backend URL Config Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure Backend API</Text>
            <Text style={styles.modalSubtitle}>
              Target URL of your Node.js/Express backend server:
            </Text>

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
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.slate900,
  },
  cardSubtitle: {
    fontSize: 12,
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
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.slate900,
    marginBottom: 10,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
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
    fontSize: 11,
    color: colors.slate400,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.slate50,
    marginBottom: 8,
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
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
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
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
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
