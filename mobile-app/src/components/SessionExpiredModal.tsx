import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Clock, KeyRound, LogIn } from 'lucide-react-native';

export interface SessionExpiredModalProps {
  visible: boolean;
  onSignInAgain: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  visible,
  onSignInAgain,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Enforce non-dismissible: Android hardware back cannot dismiss
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Clock size={36} color="#d97706" />
          </View>

          <View style={styles.statusPill}>
            <KeyRound size={11} color="#b45309" />
            <Text style={styles.statusPillText}>SECURITY SESSION EXPIRED</Text>
          </View>

          <Text style={styles.title}>Your Session Has Timed Out</Text>
          <Text style={styles.body}>
            To protect confidential customer KYC documents, proposals, and DISCOM billing records, your session has expired. Please sign in again to continue your work.
          </Text>

          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>DATA PROTECTION NOTICE:</Text>
            <Text style={styles.guidanceText}>
              • Unsynced local drafts and offline survey media remain safely preserved on your device.{'\n'}
              • Once authenticated, you will immediately regain access to all active EPC projects.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={onSignInAgain}
            activeOpacity={0.85}
          >
            <LogIn size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.signInBtnText}>Sign In to Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  guidanceBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  guidanceTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  guidanceText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
