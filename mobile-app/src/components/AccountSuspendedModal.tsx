import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { ShieldAlert, Mail, RefreshCw, LogOut, Lock } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface AccountSuspendedModalProps {
  visible: boolean;
  message?: string | null;
  onCheckAgain: () => Promise<void>;
  onDismiss: () => void;
}

export const AccountSuspendedModal: React.FC<AccountSuspendedModalProps> = ({
  visible,
  message,
  onCheckAgain,
  onDismiss,
}) => {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await onCheckAgain();
    } finally {
      setChecking(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@solarmanager.com?subject=Organization%20Account%20Suspension%20Inquiry');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* ICON BADGE */}
          <View style={styles.iconCircle}>
            <ShieldAlert size={36} color="#e11d48" />
          </View>

          {/* STATUS PILL */}
          <View style={styles.statusPill}>
            <Lock size={11} color="#be123c" />
            <Text style={styles.statusPillText}>ORGANIZATION ACCESS SUSPENDED</Text>
          </View>

          {/* TITLE & SUMMARY */}
          <Text style={styles.title}>Account Frozen by Admin</Text>
          <Text style={styles.body}>
            {message ||
              'Your organization account has been suspended by the platform Super Administrator. Access to solar leads, project surveys, and billing modules is temporarily frozen.'}
          </Text>

          {/* GUIDANCE BOX */}
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>WHAT THIS MEANS:</Text>
            <Text style={styles.guidanceText}>
              • All field surveys, quotes, and customer records remain securely preserved in the cloud.{'\n'}
              • Operations will be immediately restored as soon as the platform administrator reactivates your account.
            </Text>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheck}
              disabled={checking}
              activeOpacity={0.8}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <RefreshCw size={15} color="#ffffff" />
                  <Text style={styles.checkButtonText}>Check Status Again</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Mail size={15} color="#334155" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <LogOut size={13} color="#64748b" />
              <Text style={styles.dismissButtonText}>Return to Login</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#ffe4e6',
    borderWidth: 2,
    borderColor: '#fecdd3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#be123c',
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
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  checkButton: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  contactButton: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dismissButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
});
