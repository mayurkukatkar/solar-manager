import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Search,
  X,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ArrowLeft,
  CheckCircle2,
  Building,
  KeyRound,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radii, typography, touchTarget } from '../theme';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'main' | 'detail';
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
}

export interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  rightAction?: React.ReactNode;
  dragHandle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  variant = 'main',
  onBack,
  rightAction,
  showSearch,
  onSearch,
  searchPlaceholder = 'Search leads, projects, or contacts...',
}) => {
  const { user, backendStatus, logout } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // VARIANT: DETAIL (With Back Button, Inline Title, and Right Action)
  if (variant === 'detail') {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailRow}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={colors.slate900} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <View style={styles.detailTitleBox}>
            {title && (
              <Text style={styles.detailTitleText} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.detailSubtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          <View style={styles.detailRightBox}>
            {rightAction ? (
              rightAction
            ) : (
              <View style={styles.statusPillCompact}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: backendStatus.isOnline ? colors.success : colors.warning },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // VARIANT: MAIN (Root Tab Header with Brand Row, Title, and Search)
  return (
    <View style={styles.container}>
      {/* TOP BRAND ROW */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/app-icon.png')}
            style={styles.brandLogoImage}
            resizeMode="cover"
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.companyName} numberOfLines={1}>
              {user?.tenantName || 'WhereReady Solar OS'}
            </Text>
            <View style={styles.brandSubRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Solar Partner'}
              </Text>
              <Text style={styles.brandTag}>• WHERE GROWTH GETS READY.</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* Status Indicator */}
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: backendStatus.isOnline ? colors.success : colors.warning },
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
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCREEN TITLE & SUBTITLE */}
      {title && (
        <View style={styles.titleSection}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitleText} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* OPTIONAL SEARCH BAR */}
      {showSearch && (
        <View style={styles.searchBox}>
          <Search size={16} color={colors.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.slate400}
            value={searchText}
            onChangeText={(t) => {
              setSearchText(t);
              if (onSearch) onSearch(t);
            }}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                if (onSearch) onSearch('');
              }}
              style={styles.searchClearBtn}
            >
              <X size={14} color={colors.slate400} />
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
                <Text style={styles.sessionInfoVal}>{user?.tenantName || 'WhereReady Solar OS'}</Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Network</Text>
                <Text style={[styles.sessionInfoVal, { color: colors.success }]}>
                  {backendStatus.isOnline ? 'Operational' : 'Reconnecting'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={styles.sessionInfoLabel}>Security</Text>
                <Text style={styles.sessionInfoVal}>TLS 1.3 256-Bit</Text>
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
              <LogOut size={16} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.logoutBtnText}>Sign Out of Workspace</Text>
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

/**
 * Standard Modal & Bottom Sheet Header
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  rightAction,
  dragHandle = true,
}) => {
  return (
    <View style={styles.modalHeaderContainer}>
      {dragHandle && <View style={styles.modalDragHandle} />}
      <View style={styles.modalHeaderRow}>
        <View style={styles.modalHeaderTextBox}>
          <Text style={styles.modalHeaderTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.modalHeaderSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.modalHeaderActionBox}>
          {rightAction}
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalCloseBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          >
            <X size={18} color={colors.slate600} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const topSafeArea =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36)
    : 50;

const styles = StyleSheet.create({
  // MAIN VARIANT
  container: {
    backgroundColor: colors.white,
    paddingTop: topSafeArea,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: touchTarget.min,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
    marginRight: spacing[2],
  },
  brandLogoImage: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  brandTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.extrabold,
    color: colors.slate900,
    letterSpacing: typography.tracking.tight,
  },
  brandSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: typography.size.caption,
    color: colors.slate500,
    fontWeight: typography.weight.semibold,
  },
  brandTag: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: typography.weight.extrabold,
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semibold,
    color: colors.slate600,
  },
  avatarPill: {
    padding: 2,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.extrabold,
    color: colors.white,
  },
  titleSection: {
    marginTop: spacing[3],
  },
  titleText: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.extrabold,
    color: colors.slate900,
    letterSpacing: typography.tracking.tight,
  },
  subtitleText: {
    fontSize: typography.size.body,
    color: colors.slate500,
    marginTop: 2,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    height: 42,
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.size.body,
    color: colors.slate900,
    fontWeight: typography.weight.medium,
  },
  searchClearBtn: {
    padding: spacing[1],
  },

  // DETAIL VARIANT (Back button, Inline title)
  detailContainer: {
    backgroundColor: colors.white,
    paddingTop: topSafeArea,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget.min,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  detailTitleBox: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  detailTitleText: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.extrabold,
    color: colors.slate900,
    letterSpacing: typography.tracking.snug,
  },
  detailSubtitleText: {
    fontSize: typography.size.caption,
    color: colors.slate500,
    marginTop: 1,
  },
  detailRightBox: {
    alignItems: 'flex-end',
    minWidth: 40,
  },
  statusPillCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MODAL HEADER
  modalHeaderContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate300,
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget.min,
  },
  modalHeaderTextBox: {
    flex: 1,
    paddingRight: spacing[2],
  },
  modalHeaderTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.extrabold,
    color: colors.slate900,
    letterSpacing: typography.tracking.snug,
  },
  modalHeaderSubtitle: {
    fontSize: typography.size.caption,
    color: colors.slate500,
    marginTop: 2,
  },
  modalHeaderActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // PROFILE MODAL INSIDE HEADER
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: Platform.OS === 'ios' ? spacing[8] : spacing[6],
  },
  accountProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.extrabold,
    color: colors.white,
  },
  accountNameText: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.extrabold,
    color: colors.slate900,
  },
  accountEmailText: {
    fontSize: typography.size.sub,
    color: colors.slate500,
    marginTop: 1,
  },
  accountRoleBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  accountRoleBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  sessionInfoBox: {
    backgroundColor: colors.slate50,
    borderRadius: radii.md,
    padding: spacing[3],
    marginVertical: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfoLabel: {
    fontSize: typography.size.sub,
    color: colors.slate500,
    fontWeight: typography.weight.medium,
  },
  sessionInfoVal: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
    color: colors.slate900,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: radii.md,
    minHeight: touchTarget.min,
    marginBottom: spacing[2],
  },
  logoutBtnText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.danger,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.min,
  },
  closeBtnText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.slate600,
  },
});
