import React, { useState, useEffect } from 'react';
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
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radii, typography, touchTarget, useTheme } from '../theme';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AppOnboardingModal } from './AppOnboardingModal';
import { InAppProductTour } from './InAppProductTour';
import { GuideCharacter } from './GuideCharacter';
import { useDebounce } from '../hooks/useDebounce';
import { offlineSyncService } from '../services/offlineSyncService';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'main' | 'detail' | 'home';
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  onSearchPress?: () => void;
}

export { ModalHeader, useDirtyFormWarning } from './common/ModalHeader';
export type { ModalHeaderProps } from './common/ModalHeader';

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  variant = 'main',
  onBack,
  rightAction,
  showSearch,
  onSearch,
  searchPlaceholder = 'Search leads, projects, or contacts...',
  onSearchPress,
}) => {
  const { user, backendStatus, logout, checkServerConnection } = useAuth();
  const { colors: themeColors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [spotlightTourVisible, setSpotlightTourVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const handlePillPress = async () => {
    setIsCheckingConnection(true);
    try {
      await checkServerConnection();
      if (pendingCount > 0) {
        await offlineSyncService.syncQueue();
      }
    } catch {}
    finally {
      setIsCheckingConnection(false);
    }
  };

  const debouncedSearchText = useDebounce(searchText, 300);

  useEffect(() => {
    return offlineSyncService.subscribe((q) => {
      setPendingCount(q.filter((m) => m.status === 'PENDING' || m.status === 'SYNCING').length);
    });
  }, []);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchText);
    }
  }, [debouncedSearchText, onSearch]);

  // Dynamic status bar and camera punch-hole safe area calculation
  // Replaces static StatusBar.currentHeight fallback to eliminate notch/camera clipping on Android Edge-to-Edge
  const topSafeArea = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44
  );

  // VARIANT: HOME (Ultra-Compact Flush Spatial Header for Operational Radar)
  if (variant === 'home') {
    return (
      <View
        style={[
          styles.homeContainer,
          {
            paddingTop: topSafeArea,
            backgroundColor: themeColors.surface,
            borderBottomColor: themeColors.borderSubtle,
          },
        ]}
      >
        <View style={styles.homeRow}>
          <View style={styles.homeBrandGroup}>
            <Image
              source={require('../../assets/app-icon.png')}
              style={[styles.homeBrandLogo, { borderColor: themeColors.borderSubtle }]}
              resizeMode="cover"
            />
            <View style={styles.homeBrandTextGroup}>
              <View style={styles.homeBrandTitleRow}>
                <Text style={[styles.homeBrandTitle, { color: themeColors.text }]} numberOfLines={1}>
                  WhereReady
                </Text>
                <View style={[styles.homeOsBadge, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.homeOsBadgeText}>SOLAR OS</Text>
                </View>
              </View>
              <Text style={[styles.homeTagline, { color: themeColors.textMuted }]} numberOfLines={1}>
                Where Growth Gets Ready.
              </Text>
            </View>
          </View>

          <View style={styles.homeRightGroup}>
            <TouchableOpacity
              style={[
                styles.homeStatusPill,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              onPress={handlePillPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Network status: ${!backendStatus.isOnline ? 'Offline' : 'Live'}. Tap to refresh.`}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isCheckingConnection
                      ? '#3b82f6'
                      : !backendStatus.isOnline
                        ? '#f59e0b'
                        : pendingCount > 0
                          ? '#3b82f6'
                          : '#34d399',
                  },
                ]}
              />
              <Text style={[styles.homeStatusText, { color: themeColors.textSecondary }]}>
                {isCheckingConnection
                  ? 'Checking...'
                  : !backendStatus.isOnline
                    ? 'Offline'
                    : pendingCount > 0
                      ? `Sync (${pendingCount})`
                      : 'Live'}
              </Text>
            </TouchableOpacity>

            {/* Global Search Icon Button */}
            <TouchableOpacity
              style={[
                styles.homeSearchBtn,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if (onSearchPress) onSearchPress();
                else setSearchModalVisible(true);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Global Search"
            >
              <Search
                size={16}
                color={themeColors.textSecondary}
                strokeWidth={2.2}
              />
            </TouchableOpacity>

            {/* Sol Mascot Spotlight Tour Button */}
            <TouchableOpacity
              style={[
                styles.solTourBtn,
                {
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(37, 99, 235, 0.35)' : '#BFDBFE',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setSpotlightTourVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Launch In-App Spotlight Tour"
            >
              <GuideCharacter pose="wave" size={26} animated={false} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.homeAvatarBtn,
                {
                  backgroundColor: themeColors.primaryLight,
                  borderColor: themeColors.primary,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setProfileModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View profile"
            >
              <Text style={[styles.homeAvatarText, { color: themeColors.primary }]}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* USER ACCOUNT PROFILE MODAL */}
        <Modal
          visible={profileModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setProfileModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              <View style={[styles.modalDragHandle, { backgroundColor: themeColors.borderSubtle }]} />

              <View style={[styles.accountProfileCard, { borderBottomColor: themeColors.borderSubtle }]}>
                <View style={[styles.accountAvatar, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.accountAvatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountNameText, { color: themeColors.text }]}>
                    {user?.name || 'Administrator'}
                  </Text>
                  <Text style={[styles.accountEmailText, { color: themeColors.textSecondary }]}>
                    {user?.email}
                  </Text>
                  <View style={[styles.accountRoleBadge, { backgroundColor: themeColors.primaryLight }]}>
                    <Text style={[styles.accountRoleBadgeText, { color: themeColors.primary }]}>
                      {user?.role === 'SUPER_ADMIN' ? 'PLATFORM SUPER ADMIN' : 'TENANT ADMINISTRATOR'}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.sessionInfoBox,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.sessionInfoRow}>
                  <Building size={14} color={themeColors.textMuted} />
                  <Text style={[styles.sessionInfoLabel, { color: themeColors.textSecondary }]}>Vendor Enterprise:</Text>
                  <Text style={[styles.sessionInfoVal, { color: themeColors.text }]} numberOfLines={1}>
                    {user?.tenantName || 'WhereReady Solar OS'}
                  </Text>
                </View>
                <View style={styles.sessionInfoRow}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={[styles.sessionInfoLabel, { color: themeColors.textSecondary }]}>Sync Status:</Text>
                  <Text style={[styles.sessionInfoVal, { color: '#059669' }]}>
                    {backendStatus.isOnline ? 'Active & Synchronized' : 'Offline Mode'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.themeToggleBtn,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                onPress={async () => {
                  await toggleTheme();
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isDark ? (
                    <Sun size={16} color={themeColors.accent} />
                  ) : (
                    <Moon size={16} color={themeColors.primary} />
                  )}
                  <Text style={[styles.themeToggleText, { color: themeColors.text }]}>
                    {isDark ? 'Dark Theme Active' : 'Light Theme Active'}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: themeColors.primary }}>
                  Switch to {isDark ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeToggleBtn,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => {
                  setProfileModalVisible(false);
                  setSpotlightTourVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <GuideCharacter pose="guide" size={22} animated={false} />
                  <Text style={[styles.themeToggleText, { color: themeColors.text }]}>
                    Interactive Button-by-Button Tour
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: themeColors.primary }}>
                  Explore
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setProfileModalVisible(false);
                  logout();
                }}
                activeOpacity={0.8}
              >
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.logoutBtnText}>Sign Out of Mobile OS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: themeColors.background, borderColor: themeColors.borderSubtle }]}
                onPress={() => setProfileModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeBtnText, { color: themeColors.text }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* GLOBAL SEARCH MODAL */}
        <GlobalSearchModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
        />

        {/* APP PRODUCT TOUR / ONBOARDING MODAL */}
        <AppOnboardingModal
          visible={tourVisible}
          onClose={() => setTourVisible(false)}
          forceShow={true}
        />

        {/* IN-APP INTERACTIVE SPOTLIGHT PRODUCT TOUR */}
        <InAppProductTour
          visible={spotlightTourVisible}
          onClose={() => setSpotlightTourVisible(false)}
        />
      </View>
    );
  }

  // VARIANT: DETAIL (With Back Button, Inline Title, and Right Action)
  if (variant === 'detail') {
    return (
      <View
        style={[
          styles.detailContainer,
          {
            paddingTop: topSafeArea,
            backgroundColor: themeColors.surface,
            borderBottomColor: themeColors.borderSubtle,
          },
        ]}
      >
        <View style={styles.detailRow}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { backgroundColor: themeColors.background, borderColor: themeColors.borderSubtle }]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={themeColors.text} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <View style={styles.detailTitleBox}>
            {title && (
              <Text style={[styles.detailTitleText, { color: themeColors.text }]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[styles.detailSubtitleText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          <View style={styles.detailRightBox}>
            {rightAction ? (
              rightAction
            ) : (
              <View style={[styles.statusPillCompact, { backgroundColor: themeColors.background, borderColor: themeColors.borderSubtle }]}>
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
    <View
      style={[
        styles.container,
        {
          paddingTop: topSafeArea,
          backgroundColor: themeColors.surface,
          borderBottomColor: themeColors.borderSubtle,
        },
      ]}
    >
      {/* TOP BRAND ROW */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/app-icon.png')}
            style={[styles.brandLogoImage, { borderColor: themeColors.borderSubtle }]}
            resizeMode="cover"
          />
          <View style={styles.brandTextContainer}>
            <Text style={[styles.companyName, { color: themeColors.text }]} numberOfLines={1}>
              {title || user?.tenantName || 'WhereReady Solar OS'}
            </Text>
            <Text style={[styles.userName, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {subtitle || `${user?.name || 'Solar Partner'} • Where Growth Gets Ready.`}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {rightAction ? (
            rightAction
          ) : (
            <>
              {/* Status Indicator */}
              <TouchableOpacity
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                onPress={handlePillPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Connection status. Tap to refresh."
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isCheckingConnection
                        ? '#3b82f6'
                        : !backendStatus.isOnline
                          ? colors.warning
                          : pendingCount > 0
                            ? '#3b82f6'
                            : colors.success,
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: themeColors.textSecondary }]}>
                  {isCheckingConnection
                    ? 'Checking...'
                    : !backendStatus.isOnline
                      ? 'Offline'
                      : pendingCount > 0
                        ? `Syncing (${pendingCount})`
                        : 'Online'}
                </Text>
              </TouchableOpacity>

              {/* Global Search Button */}
              <TouchableOpacity
                style={[
                  styles.mainSearchBtn,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  if (onSearchPress) onSearchPress();
                  else setSearchModalVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Global Search"
              >
                <Search
                  size={16}
                  color={themeColors.textSecondary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>

              {/* User Profile Avatar Pill */}
              <TouchableOpacity
                style={styles.avatarPill}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setProfileModalVisible(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View profile"
              >
                <View style={[styles.avatarCircle, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.avatarLetter}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* OPTIONAL SEARCH BAR */}
      {showSearch && (
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.borderSubtle,
            },
          ]}
        >
          <Search size={16} color={themeColors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={themeColors.textMuted}
            value={searchText}
            onChangeText={(t) => {
              setSearchText(t);
            }}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
              }}
              style={styles.searchClearBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
            >
              <X size={14} color={themeColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* USER ACCOUNT PROFILE MODAL */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalDragHandle, { backgroundColor: themeColors.borderSubtle }]} />

            <View style={[styles.accountProfileCard, { borderBottomColor: themeColors.borderSubtle }]}>
              <View style={[styles.accountAvatar, { backgroundColor: themeColors.primary }]}>
                <Text style={styles.accountAvatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountNameText, { color: themeColors.text }]}>
                  {user?.name || 'Administrator'}
                </Text>
                <Text style={[styles.accountEmailText, { color: themeColors.textSecondary }]}>
                  {user?.email}
                </Text>
                <View style={[styles.accountRoleBadge, { backgroundColor: themeColors.primaryLight }]}>
                  <Text style={[styles.accountRoleBadgeText, { color: themeColors.primary }]}>
                    {user?.role === 'SUPER_ADMIN' ? 'PLATFORM SUPER ADMIN' : 'TENANT ADMINISTRATOR'}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.sessionInfoBox,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
            >
              <View style={styles.sessionInfoRow}>
                <Text style={[styles.sessionInfoLabel, { color: themeColors.textSecondary }]}>Workspace</Text>
                <Text style={[styles.sessionInfoVal, { color: themeColors.text }]}>
                  {user?.tenantName || 'WhereReady Solar OS'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={[styles.sessionInfoLabel, { color: themeColors.textSecondary }]}>Network</Text>
                <Text style={[styles.sessionInfoVal, { color: colors.success }]}>
                  {backendStatus.isOnline ? 'Operational' : 'Reconnecting'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={[styles.sessionInfoLabel, { color: themeColors.textSecondary }]}>Security</Text>
                <Text style={[styles.sessionInfoVal, { color: themeColors.text }]}>TLS 1.3 256-Bit</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              onPress={async () => {
                await toggleTheme();
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isDark ? (
                  <Sun size={16} color={themeColors.accent} />
                ) : (
                  <Moon size={16} color={themeColors.primary} />
                )}
                <Text style={[styles.themeToggleText, { color: themeColors.text }]}>
                  {isDark ? 'Dark Theme Active' : 'Light Theme Active'}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: themeColors.primary }}>
                Switch to {isDark ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>

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
              style={[styles.closeBtn, { backgroundColor: themeColors.background, borderColor: themeColors.borderSubtle }]}
              onPress={() => setProfileModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeBtnText, { color: themeColors.text }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GLOBAL SEARCH MODAL */}
      <GlobalSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // HOME VARIANT (Unified Luminous Header)
  homeContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
  },
  homeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  homeBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  homeBrandLogo: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
  },
  homeBrandTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  homeBrandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  homeBrandTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  homeOsBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  homeOsBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  homeTagline: {
    fontSize: 9,
    fontWeight: '600',
  },
  homeRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  homeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
  },
  homeStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  homeSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solTourBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeAvatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeAvatarText: {
    fontSize: 13,
    fontWeight: '900',
  },

  // MAIN VARIANT
  container: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
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
  },
  brandTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.extrabold,
    letterSpacing: typography.tracking.tight,
  },
  brandSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semibold,
  },
  brandTag: {
    fontSize: 9,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
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
  },
  mainSearchBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPill: {
    padding: 2,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    letterSpacing: typography.tracking.tight,
  },
  subtitleText: {
    fontSize: typography.size.body,
    marginTop: 2,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    height: 42,
    marginTop: spacing[3],
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
  },
  searchClearBtn: {
    padding: spacing[1],
  },

  // DETAIL VARIANT (Back button, Inline title)
  detailContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
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
    borderWidth: 1,
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
    letterSpacing: typography.tracking.snug,
  },
  detailSubtitleText: {
    fontSize: typography.size.caption,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MODAL HEADER
  modalHeaderContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
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
    letterSpacing: typography.tracking.snug,
  },
  modalHeaderSubtitle: {
    fontSize: typography.size.caption,
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
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  },
  accountEmailText: {
    fontSize: typography.size.sub,
    marginTop: 1,
  },
  accountRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  accountRoleBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
  },
  sessionInfoBox: {
    borderRadius: radii.md,
    padding: spacing[3],
    marginVertical: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfoLabel: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.medium,
  },
  sessionInfoVal: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[3],
  },
  themeToggleText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
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
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing[2],
  },
  closeBtnText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
  },
});
