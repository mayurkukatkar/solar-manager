import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { Search, X, LogOut, ShieldCheck, ChevronRight, Zap } from 'lucide-react-native';
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
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/app-icon.png')}
            style={styles.brandLogoImage}
            resizeMode="cover"
          />
          <View>
            <Text style={styles.companyName} numberOfLines={1}>
              {user?.tenantName || 'WhereReady Solar OS'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
              <Text style={styles.brandTag}>• SOLAR OS</Text>
            </View>
          </View>
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
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </Text>
            </View>
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
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads, projects, or contacts..."
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
              style={styles.searchClearBtn}
            >
              <X size={14} color="#94a3b8" />
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
            <View style={styles.modalDragHandle} />

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
                    {user?.role === 'SUPER_ADMIN' ? 'PLATFORM SUPER ADMIN' : 'TENANT ADMINISTRATOR'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionInfoBox}>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Workspace</Text>
                <Text style={styles.sessionInfoVal}>{user?.tenantName || 'Solar EPC'}</Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Network</Text>
                <Text style={[styles.sessionInfoVal, { color: '#059669' }]}>
                  {backendStatus.isOnline ? 'Operational' : 'Reconnecting'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Security</Text>
                <Text style={styles.sessionInfoVal}>TLS 1.3 Verified</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setProfileModalVisible(false);
                logout();
              }}
              activeOpacity={0.85}
            >
              <LogOut size={16} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setProfileModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandLogoImage: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  userName: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  brandTag: {
    fontSize: 9,
    color: '#0066FF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  avatarPill: {
    padding: 2,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  titleSection: {
    marginTop: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  searchClearBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  accountProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  accountNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  accountEmailText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  accountRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  accountRoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  sessionInfoBox: {
    marginVertical: 18,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  sessionInfoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});
