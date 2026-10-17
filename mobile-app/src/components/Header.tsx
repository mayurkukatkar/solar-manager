import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { UserRole } from '../types';

export const Header: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { user, role, switchRole } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return { label: '👔 Owner View', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'SALES_AGENT':
        return { label: '🤝 Sales Rep', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'TECHNICIAN':
        return { label: '⚡ Field Tech', bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.companyName}>{user?.tenantName || 'Solar Manager'}</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.rolePill, { backgroundColor: badge.bg, borderColor: badge.border }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.rolePillText, { color: badge.text }]}>{badge.label}</Text>
          <Text style={styles.switchHint}>▾ Switch</Text>
        </TouchableOpacity>
      </View>

      {title && (
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      )}

      {/* Role Switcher Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Mobile Workspace</Text>
            <Text style={styles.modalSubtitle}>
              Experience the interconnected app tailored for each operational role:
            </Text>

            <TouchableOpacity
              style={[styles.roleOption, role === 'OWNER' && styles.roleOptionActive]}
              onPress={() => {
                switchRole('OWNER');
                setModalVisible(false);
              }}
            >
              <Text style={styles.roleOptionEmoji}>👔</Text>
              <View style={styles.roleOptionTextWrapper}>
                <Text style={styles.roleOptionTitle}>Owner / Executive</Text>
                <Text style={styles.roleOptionDesc}>Revenue KPIs, cash flow, stage & discount approvals</Text>
              </View>
              {role === 'OWNER' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, role === 'SALES_AGENT' && styles.roleOptionActive]}
              onPress={() => {
                switchRole('SALES_AGENT');
                setModalVisible(false);
              }}
            >
              <Text style={styles.roleOptionEmoji}>🤝</Text>
              <View style={styles.roleOptionTextWrapper}>
                <Text style={styles.roleOptionTitle}>Sales Agent / Field CRM</Text>
                <Text style={styles.roleOptionDesc}>On-ground leads, 60s quotes & WhatsApp proposals</Text>
              </View>
              {role === 'SALES_AGENT' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, role === 'TECHNICIAN' && styles.roleOptionActive]}
              onPress={() => {
                switchRole('TECHNICIAN');
                setModalVisible(false);
              }}
            >
              <Text style={styles.roleOptionEmoji}>⚡</Text>
              <View style={styles.roleOptionTextWrapper}>
                <Text style={styles.roleOptionTitle}>Field Technician / Installer</Text>
                <Text style={styles.roleOptionDesc}>Job queue, checklists, serial scanning, geo-photos & e-sign</Text>
              </View>
              {role === 'TECHNICIAN' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.slate900,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginTop: 2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  switchHint: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate600,
  },
  titleSection: {
    marginTop: 18,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 4,
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
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    marginBottom: 12,
  },
  roleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  roleOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  roleOptionTextWrapper: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  activeCheck: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    marginLeft: 8,
  },
  closeButton: {
    marginTop: 6,
    paddingVertical: 12,
    backgroundColor: colors.slate900,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
