import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export const Header: React.FC<{
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
}> = ({ title, subtitle, showSearch, onSearch }) => {
  const { user, backendStatus, logout } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.container}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>
            {user?.tenantName || 'Solar Manager ERP'}
          </Text>
          <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Status Indicator */}
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: backendStatus.isOnline ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={styles.statusText}>
              {backendStatus.isOnline ? 'Online' : 'Reconnecting'}
            </Text>
          </View>

          {/* User Profile Avatar Pill */}
          <TouchableOpacity
            style={styles.avatarPill}
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.roleTag}>
              {user?.role === 'SUPER_ADMIN' ? 'Platform' : 'Admin'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TITLE & SUBTITLE */}
      {title && (
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      )}

      {/* OPTIONAL SEARCH BAR */}
      {showSearch && (
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads, projects, or customers..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={(t) => {
              setSearchText(t);
              if (onSearch) onSearch(t);
            }}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                if (onSearch) onSearch('');
              }}
            >
              <Text style={{ color: '#94a3b8', fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* USER ACCOUNT PROFILE MODAL */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.accountProfileCard}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountNameText}>{user?.name || 'Administrator'}</Text>
                <Text style={styles.accountEmailText}>{user?.email}</Text>
                <View style={styles.accountRoleBadge}>
                  <Text style={styles.accountRoleBadgeText}>
                    {user?.role === 'SUPER_ADMIN' ? '👑 PLATFORM SUPER ADMIN' : '🏢 TENANT ADMINISTRATOR'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionInfoBox}>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Organization:</Text>
                <Text style={styles.sessionInfoVal}>{user?.tenantName || 'Solar EPC Enterprise'}</Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>System Status:</Text>
                <Text style={[styles.sessionInfoVal, { color: '#059669' }]}>
                  {backendStatus.isOnline ? 'Operational (Cloud Synced)' : 'Reconnecting...'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Data Security:</Text>
                <Text style={styles.sessionInfoVal}>TLS 1.3 • Bearer Verified</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setProfileModalVisible(false);
                logout();
              }}
            >
              <Text style={styles.logoutBtnText}>🔒 Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
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
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 18,
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
    fontSize: 17,
    fontWeight: '900',
    color: colors.white,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate300,
  },
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
  },
  roleTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    paddingRight: 4,
  },
  titleSection: {
    marginTop: 14,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.white,
    padding: 0,
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
  accountProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  accountNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate900,
  },
  accountEmailText: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  accountRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  accountRoleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.slate800,
    letterSpacing: 0.5,
  },
  sessionInfoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate500,
  },
  sessionInfoVal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate800,
    maxWidth: 180,
  },
  logoutBtn: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate500,
  },
});
