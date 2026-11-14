# Technical Blueprint: Milestone M2 — Navigation Restructuring, Safe Area Hardening & Mobile System Architecture

**Document Version**: 2.0.0  
**Author**: Explorer M2-1 (Navigation & Mobile System Architect)  
**Date**: 2026-10-30  
**Monorepo Target**: `f:\Company Products\solar-manager\`  
**Target Mobile App**: `mobile-app/` (`com.whereready.solaros`)  
**Audience**: Orchestrator, Worker M2, Reviewer M2, Challenger M2  

---

## 1. Executive Summary & Problem Boundary

In Milestone M1, the design system foundation (`docs/mobile-design-system.md`, `src/theme/`) was established with dual-theme tokenization (Light & OLED Dark), typography with tabular numerals, 4pt spacing scale, and reusable UI primitives.

Milestone M2 resolves three critical system architecture vulnerabilities identified in `docs/mobile-screen-inventory.md` and `docs/mobile-ux-problems.md`:
1. **Problem P1-1 (Status Bar & Punch-Hole Clipping)**: `Header.tsx` (lines 383–386) used manual arithmetic `Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36) : 50` inside static module-level `StyleSheet.create`. Under Android 15 / Expo SDK 58 Edge-to-Edge (`edgeToEdgeEnabled=true`), camera punch-holes and status bar icons cut into company titles, branding, and status pills.
2. **Problem P0-5 (Android Hardware Back Traps & Accidental App Exit)**: Zero Android `BackHandler` listeners were attached. Pressing hardware back on the root dashboard instantly terminates the app, while navigating deep tabs lacks predictable back behavior to root.
3. **Problem P1-2 & Inventory Item #10 (Dead Code & Bottom Tab Ergonomics)**:
   - `ProjectsScreen.tsx` (1,007 lines) is an unreferenced orphan file completely superseded by `FieldProjectsScreen.tsx` (839 lines).
   - `LeadsScreen.tsx` (863 lines) duplicates CRM functionality that must be consolidated to `PipelineScreen.tsx`.
   - Bottom tab bar lacked theme tokenization, safe area bottom insets for the Android gesture pill / 3-button navigation bar, and active tab visual indicators.

This blueprint provides full architectural specifications, evidence chains, exact drop-in implementations, and verification procedures for Worker M2.

---

## 2. Technical Blueprint 1: `RootNavigator.tsx` Reconciled

### 2.1 Route Typing & Architecture Hierarchy

`RootNavigator.tsx` is upgraded from untyped routes to strict TypeScript param lists for both bottom tabs and root stack:

```typescript
export type MainTabParamList = {
  Dashboard: undefined;
  Pipeline: { stage?: string; leadId?: string } | undefined;
  CreateLeadTab: undefined;
  Projects: { projectId?: string; filterStage?: string } | undefined;
  Finance: { invoiceId?: string } | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: { screen?: keyof MainTabParamList; params?: any } | undefined;
  QuickQuote: {
    lead?: any;
    prospectName?: string;
    prospectPhone?: string;
    monthlyBill?: string;
    capacityKw?: string;
  } | undefined;
  Modules: { screen?: string } | undefined;
  FinanceDetail: { invoiceId?: string } | undefined;
  Profile: undefined;
  Operations: undefined;
  Leads: { stage?: string; leadId?: string } | undefined; // Legacy alias routed directly to PipelineScreen
};
```

### 2.2 Theme Provider & Navigation Theme Binding

In React Navigation 7, passing the theme to `<NavigationContainer theme={navTheme}>` eliminates white flashes during navigation transitions in Dark Mode.
- Utilizes `useTheme()` hook:
  ```typescript
  const { colors: themeColors, isDark } = useTheme();
  const navigationTheme = useMemo(
    () => getNavigationTheme(themeColors, isDark),
    [themeColors, isDark]
  );
  ```
- Passed directly: `<NavigationContainer ref={navigationRef} theme={navigationTheme}>`.
- The loading canvas container is dynamically styled with `themeColors.background` and `themeColors.primary` spinner.

### 2.3 Bottom Tab Navigation Ergonomics & Edge-to-Edge Insets

On modern Android devices with gesture navigation (e.g. Android 13–15 with `edgeToEdgeEnabled=true`), the system navigation bar (gesture pill or 3 navigation buttons) floats over the bottom 16–34dp of the viewport.

**Dynamic Inset Formula**:
```typescript
const insets = useSafeAreaInsets();
const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
const tabBarHeight = 56 + bottomInset;
```
- Standard tab bar content height is fixed at `56dp`.
- `paddingBottom` receives `bottomInset`, pushing icons and labels above the system bar.
- Total tab bar height equals `56 + bottomInset` (e.g. 72dp on standard gesture navigation, 80dp on 3-button nav, 84dp on iOS home bar).

### 2.4 Active Tab Indicator (`TabBarIcon`)

Rather than merely shifting icon color, modern mobile SaaS patterns (Google Material 3 / iOS HIG) employ a pill indicator:
- Active state displays a subtle rounded pill container (`width: 44`, `height: 28`, `borderRadius: 14`) filled with `themeColors.primaryLight` (Light: `#DBEAFE`, Dark: `#1E3A8A`).
- Active icon stroke width increases from `1.9` to `2.5` with `themeColors.primary`.
- Inactive icons render with `themeColors.textMuted` and transparent background.
- Tab labels use `fontSize: 10`, `fontWeight: '700'`, `letterSpacing: 0.2`.

### 2.5 Floating Center FAB (`CreateLeadTab`)

- Styled dynamically using `themeColors.primary` fill.
- The outer ring uses `borderColor: themeColors.surface`, ensuring the cutout bezel matches the active tab bar background in both Light and Dark themes (eliminating hardcoded `#ffffff`).
- Accessibility props: `accessibilityRole="button"` and `accessibilityLabel="Create New Solar Lead"`.

### 2.6 Android Hardware Back Button Strategy

Enterprise solar technicians operating outdoors frequently press the hardware back button to dismiss dialogs or navigate up. Without coordination, this triggers accidental app exits.

**Multi-Tier Back Handler Protocol**:
1. **Tier 1 (Stack History)**: If `navigationRef.canGoBack()` is `true` (user is in `QuickQuoteScreen`, `ModulesScreen`, `FieldProfileScreen`, `OperationsScreen`), call `navigationRef.goBack()`.
2. **Tier 2 (Tab Hierarchy)**: If user is on a secondary bottom tab (`Pipeline`, `Projects`, `Finance`), navigate back to the root tab (`Dashboard`). This matches `backBehavior="firstRoute"`.
3. **Tier 3 (Accidental Exit Guard)**: If user is on the root `Dashboard` tab (or `Login` screen):
   - Measure time delta between consecutive presses (`Date.now() - lastBackPressTime < 2000`).
   - If first press: Show native `ToastAndroid.show('Press back again to exit WhereReady Solar OS', ToastAndroid.SHORT)` and record timestamp. Return `true` (prevent exit).
   - If second press within 2,000ms: Call `BackHandler.exitApp()`.
4. **Tier 4 (Modal Interception)**: All native React Native `<Modal>` instances (`LeadCaptureModal`, `AccountSuspendedModal`, `Header`'s profile modal) handle back events at the native dialog layer via `onRequestClose`, closing the modal before JavaScript back listeners fire.

### 2.7 Complete Drop-In Source: `mobile-app/src/navigation/RootNavigator.tsx`

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Layers,
  Briefcase,
  Plus,
  Receipt,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme, getNavigationTheme, ThemeColors } from '../theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { PipelineScreen } from '../screens/crm/PipelineScreen';
import { FieldProjectsScreen } from '../screens/projects/FieldProjectsScreen';
import { OperationsScreen } from '../screens/operations/OperationsScreen';
import { QuickQuoteScreen } from '../screens/crm/QuickQuoteScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { ModulesScreen } from '../screens/modules/ModulesScreen';
import { FieldProfileScreen } from '../screens/profile/FieldProfileScreen';
import { LeadCaptureModal } from '../screens/crm/LeadCaptureModal';
import { AccountSuspendedModal } from '../components/AccountSuspendedModal';

export type MainTabParamList = {
  Dashboard: undefined;
  Pipeline: { stage?: string; leadId?: string } | undefined;
  CreateLeadTab: undefined;
  Projects: { projectId?: string; filterStage?: string } | undefined;
  Finance: { invoiceId?: string } | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: { screen?: keyof MainTabParamList; params?: any } | undefined;
  QuickQuote: {
    lead?: any;
    prospectName?: string;
    prospectPhone?: string;
    monthlyBill?: string;
    capacityKw?: string;
  } | undefined;
  Modules: { screen?: string } | undefined;
  FinanceDetail: { invoiceId?: string } | undefined;
  Profile: undefined;
  Operations: undefined;
  Leads: { stage?: string; leadId?: string } | undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToTab(screenName: string, params?: any) {
  if (navigationRef.isReady()) {
    if (screenName === 'Leads' || screenName === 'Pipeline') {
      navigationRef.navigate('MainTabs', { screen: 'Pipeline', params });
      return;
    }
    if (
      screenName === 'Dashboard' ||
      screenName === 'Projects' ||
      screenName === 'Finance'
    ) {
      navigationRef.navigate('MainTabs', { screen: screenName as any, params });
      return;
    }
    if (
      screenName === 'QuickQuote' ||
      screenName === 'Modules' ||
      screenName === 'Profile' ||
      screenName === 'Operations' ||
      screenName === 'FinanceDetail'
    ) {
      navigationRef.navigate(screenName as any, params);
      return;
    }
    navigationRef.navigate('MainTabs', { screen: screenName as any, params });
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const EmptyScreen: React.FC = () => null;

interface TabBarIconProps {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  focused: boolean;
  themeColors: ThemeColors;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({
  Icon,
  color,
  focused,
  themeColors,
}) => {
  return (
    <View
      style={[
        styles.tabIconWrapper,
        focused && {
          backgroundColor: themeColors.primaryLight,
        },
      ]}
    >
      <Icon
        size={20}
        color={focused ? themeColors.primary : color}
        strokeWidth={focused ? 2.5 : 1.9}
      />
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [leadModalVisible, setLeadModalVisible] = useState(false);

  // Dynamic calculation for Android Edge-to-Edge and iOS Home Bar insets
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
  const tabBarHeight = 56 + bottomInset;

  return (
    <>
      <Tab.Navigator
        backBehavior="firstRoute"
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: themeColors.surface,
              borderTopColor: themeColors.borderSubtle,
              height: tabBarHeight,
              paddingBottom: bottomInset,
              shadowOpacity: isDark ? 0.35 : 0.06,
            },
          ],
          tabBarActiveTintColor: themeColors.primary,
          tabBarInactiveTintColor: themeColors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                Icon={LayoutDashboard}
                color={color}
                focused={focused}
                themeColors={themeColors}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Pipeline"
          component={PipelineScreen}
          options={{
            tabBarLabel: 'Pipeline',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                Icon={Layers}
                color={color}
                focused={focused}
                themeColors={themeColors}
              />
            ),
          }}
        />
        <Tab.Screen
          name="CreateLeadTab"
          component={EmptyScreen}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.centerFabContainer}
                onPress={() => setLeadModalVisible(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Create New Solar Lead"
              >
                <View
                  style={[
                    styles.centerFab,
                    {
                      backgroundColor: themeColors.primary,
                      borderColor: themeColors.surface,
                      shadowColor: themeColors.primary,
                    },
                  ]}
                >
                  <Plus size={24} color="#ffffff" strokeWidth={2.8} />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Projects"
          component={FieldProjectsScreen}
          options={{
            tabBarLabel: 'Projects',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                Icon={Briefcase}
                color={color}
                focused={focused}
                themeColors={themeColors}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Finance"
          component={FinanceScreen}
          options={{
            tabBarLabel: 'Finance',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                Icon={Receipt}
                color={color}
                focused={focused}
                themeColors={themeColors}
              />
            ),
          }}
        />
      </Tab.Navigator>

      <LeadCaptureModal
        visible={leadModalVisible}
        onClose={() => setLeadModalVisible(false)}
        onSuccess={() => {
          setLeadModalVisible(false);
          navigateToTab('Pipeline');
        }}
        onProceedToQuote={(lead) => {
          setLeadModalVisible(false);
          navigateToTab('QuickQuote', {
            lead,
            prospectName: lead?.name,
            prospectPhone: lead?.mobile,
            monthlyBill: lead?.monthlyBill ? String(lead.monthlyBill) : undefined,
            capacityKw: lead?.estimatedCap ? String(lead.estimatedCap) : undefined,
          });
        }}
      />
    </>
  );
};

export const RootNavigator: React.FC = () => {
  const {
    user,
    isLoading,
    accountSuspended,
    accountSuspendedMessage,
    clearAccountSuspended,
    checkServerConnection,
  } = useAuth();
  const { colors: themeColors, isDark } = useTheme();

  const navigationTheme = useMemo(
    () => getNavigationTheme(themeColors, isDark),
    [themeColors, isDark]
  );

  // Android Hardware Back Handler Integration & Double-Back Exit Guard
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let lastBackPressTime = 0;

    const onHardwareBackPress = () => {
      // 1. If stack can go back, navigate back to previous screen
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      // 2. Check current active route
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        const routeName = currentRoute?.name;

        // If on a secondary tab, jump back to root Dashboard tab
        if (
          routeName &&
          routeName !== 'Dashboard' &&
          ['Pipeline', 'Projects', 'Finance'].includes(routeName)
        ) {
          navigationRef.navigate('MainTabs', { screen: 'Dashboard' });
          return true;
        }

        // If on the root Dashboard tab or Login, enforce double-tap back to exit
        if (routeName === 'Dashboard' || routeName === 'Login' || !user) {
          const now = Date.now();
          if (now - lastBackPressTime < 2000) {
            BackHandler.exitApp();
            return true;
          }
          lastBackPressTime = now;
          ToastAndroid.show(
            'Press back again to exit WhereReady Solar OS',
            ToastAndroid.SHORT
          );
          return true;
        }
      }

      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress
    );

    return () => {
      backSubscription.remove();
    };
  }, [user]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="QuickQuote" component={QuickQuoteScreen} />
              <Stack.Screen name="Modules" component={ModulesScreen} />
              <Stack.Screen name="FinanceDetail" component={FinanceScreen} />
              <Stack.Screen name="Profile" component={FieldProfileScreen} />
              <Stack.Screen name="Operations" component={OperationsScreen} />
              {/* Consolidated CRM route: legacy 'Leads' directs to PipelineScreen */}
              <Stack.Screen name="Leads" component={PipelineScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* GLOBAL ACCOUNT SUSPENSION MODAL */}
      <AccountSuspendedModal
        visible={accountSuspended}
        message={accountSuspendedMessage}
        onCheckAgain={async () => {
          await checkServerConnection();
        }}
        onDismiss={clearAccountSuspended}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabIconWrapper: {
    width: 44,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  centerFabContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  centerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
```

---

## 3. Technical Blueprint 2: `Header.tsx` Safe Area Inset Hardening & Theme Tokenization

### 3.1 Defect Analysis & Root Cause

In `mobile-app/src/components/Header.tsx`, lines 383–386:
```typescript
const topSafeArea =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36)
    : 50;
```
This static calculation causes three failures:
1. **Timing Flaw**: Evaluated at JS module load time when `StatusBar.currentHeight` may be uninitialized or return null on Android Fabric / New Architecture.
2. **Display Cutout / Edge-to-Edge Clipping**: With `edgeToEdgeEnabled=true` in `gradle.properties`, Android 14 and 15 do not letterbox. Cameras situated in punch holes or teardrop notches extend down 34–48dp. A fixed `36dp` offset forces header text and status pills into the camera hole.
3. **Static Theme Lock**: `styles.homeContainer`, `styles.container`, and `styles.detailContainer` hardcoded `#ffffff` backgrounds and static hex borders, clashing when the app runs in Dark Mode.

### 3.2 Dynamic Safe Area Architecture

1. Import `useSafeAreaInsets` from `react-native-safe-area-context` (available globally via `<SafeAreaProvider>` in `App.tsx`).
2. Inside `Header`:
   ```typescript
   const insets = useSafeAreaInsets();
   const topSafeArea = Math.max(
     insets.top,
     Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44
   );
   ```
3. Remove static `paddingTop: topSafeArea` from `StyleSheet.create`.
4. Apply `{ paddingTop: topSafeArea }` dynamically to `homeContainer`, `container`, and `detailContainer`.
5. Apply `useTheme()` tokens to `Header.tsx` so backgrounds, borders, title texts, search input, and profile modal adopt semantic colors (`themeColors.surface`, `themeColors.text`, `themeColors.borderSubtle`).
6. Attach `onRequestClose={() => setProfileModalVisible(false)}` to both `<Modal>` profile sheets, ensuring the Android hardware back button cleanly closes the profile modal.

### 3.3 Complete Drop-In Source: `mobile-app/src/components/Header.tsx`

```tsx
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
  ArrowLeft,
  Building,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radii, typography, touchTarget, useTheme } from '../theme';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'main' | 'detail' | 'home';
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
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
}) => {
  const { user, backendStatus, logout } = useAuth();
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Dynamic status bar and camera punch-hole safe area calculation
  // Replaces static StatusBar.currentHeight fallback to ensure zero clipping on Edge-to-Edge Android
  const topSafeArea = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44
  );

  // VARIANT: HOME (Flush Spatial Header for Executive Operational Radar)
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
            <View>
              <View style={styles.homeBrandTitleRow}>
                <Text style={[styles.homeBrandTitle, { color: themeColors.text }]}>
                  WhereReady
                </Text>
                <View style={[styles.homeOsBadge, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.homeOsBadgeText}>SOLAR OS</Text>
                </View>
              </View>
              <Text style={[styles.homeTagline, { color: themeColors.textMuted }]}>
                Where Growth Gets Ready.
              </Text>
            </View>
          </View>

          <View style={styles.homeRightGroup}>
            <View
              style={[
                styles.homeStatusPill,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: backendStatus.isOnline
                      ? themeColors.success
                      : themeColors.warning,
                  },
                ]}
              />
              <Text style={[styles.homeStatusText, { color: themeColors.textSecondary }]}>
                {backendStatus.isOnline ? 'MSEDCL Live' : 'Offline'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.homeAvatarBtn,
                {
                  backgroundColor: themeColors.primaryLight,
                  borderColor: themeColors.primary,
                },
              ]}
              onPress={() => setProfileModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View operator profile"
            >
              <Text style={[styles.homeAvatarText, { color: themeColors.primary }]}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OPERATOR ACCOUNT PROFILE MODAL */}
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
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.surface },
              ]}
            >
              <View
                style={[
                  styles.modalDragHandle,
                  { backgroundColor: themeColors.borderSubtle },
                ]}
              />

              <View
                style={[
                  styles.accountProfileCard,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.accountAvatar,
                    { backgroundColor: themeColors.primaryLight },
                  ]}
                >
                  <Text style={[styles.accountAvatarText, { color: themeColors.primary }]}>
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
                  <View style={styles.accountRoleBadge}>
                    <Text style={styles.accountRoleBadgeText}>
                      {user?.role === 'SUPER_ADMIN'
                        ? 'PLATFORM SUPER ADMIN'
                        : 'TENANT ADMINISTRATOR'}
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
                  <Text style={[styles.sessionInfoLabel, { color: themeColors.textMuted }]}>
                    Vendor Enterprise:
                  </Text>
                  <Text
                    style={[styles.sessionInfoVal, { color: themeColors.text }]}
                    numberOfLines={1}
                  >
                    {user?.tenantName || 'WhereReady Solar OS'}
                  </Text>
                </View>
                <View style={styles.sessionInfoRow}>
                  <ShieldCheck size={14} color={themeColors.success} />
                  <Text style={[styles.sessionInfoLabel, { color: themeColors.textMuted }]}>
                    Sync Status:
                  </Text>
                  <Text style={[styles.sessionInfoVal, { color: themeColors.success }]}>
                    {backendStatus.isOnline ? 'Active & Synchronized' : 'Offline Mode'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  setProfileModalVisible(false);
                  logout();
                }}
                activeOpacity={0.8}
              >
                <LogOut size={16} color={themeColors.danger} />
                <Text style={[styles.logoutBtnText, { color: themeColors.danger }]}>
                  Sign Out of Mobile OS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                onPress={() => setProfileModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeBtnText, { color: themeColors.text }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // VARIANT: DETAIL (With Back Action, Inline Title, and Right Action)
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
              style={styles.backButton}
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
              <Text
                style={[styles.detailTitleText, { color: themeColors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[styles.detailSubtitleText, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          <View style={styles.detailRightBox}>
            {rightAction ? (
              rightAction
            ) : (
              <View
                style={[
                  styles.statusPillCompact,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: backendStatus.isOnline
                        ? themeColors.success
                        : themeColors.warning,
                    },
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
            <Text
              style={[styles.companyName, { color: themeColors.text }]}
              numberOfLines={1}
            >
              {title || user?.tenantName || 'WhereReady Solar OS'}
            </Text>
            <Text
              style={[styles.userName, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
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
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: backendStatus.isOnline
                        ? themeColors.success
                        : themeColors.warning,
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: themeColors.textSecondary }]}>
                  {backendStatus.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>

              {/* User Profile Avatar Pill */}
              <TouchableOpacity
                style={[
                  styles.avatarPill,
                  {
                    backgroundColor: themeColors.primaryLight,
                    borderColor: themeColors.primary,
                  },
                ]}
                onPress={() => setProfileModalVisible(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View user profile"
              >
                <View style={styles.avatarCircle}>
                  <Text style={[styles.avatarLetter, { color: themeColors.primary }]}>
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View
              style={[
                styles.modalDragHandle,
                { backgroundColor: themeColors.borderSubtle },
              ]}
            />

            <View
              style={[
                styles.accountProfileCard,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
            >
              <View
                style={[
                  styles.accountAvatar,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Text style={[styles.accountAvatarText, { color: themeColors.primary }]}>
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
                <View style={styles.accountRoleBadge}>
                  <Text style={styles.accountRoleBadgeText}>
                    {user?.role === 'SUPER_ADMIN'
                      ? 'PLATFORM SUPER ADMIN'
                      : 'TENANT ADMINISTRATOR'}
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
                <Text style={[styles.sessionInfoLabel, { color: themeColors.textMuted }]}>
                  Workspace
                </Text>
                <Text style={[styles.sessionInfoVal, { color: themeColors.text }]}>
                  {user?.tenantName || 'WhereReady Solar OS'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={[styles.sessionInfoLabel, { color: themeColors.textMuted }]}>
                  Network
                </Text>
                <Text style={[styles.sessionInfoVal, { color: themeColors.success }]}>
                  {backendStatus.isOnline ? 'Operational' : 'Reconnecting'}
                </Text>
              </View>
              <View style={styles.sessionInfoRow}>
                <Text style={[styles.sessionInfoLabel, { color: themeColors.textMuted }]}>
                  Security
                </Text>
                <Text style={[styles.sessionInfoVal, { color: themeColors.text }]}>
                  TLS 1.3 256-Bit
                </Text>
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
              <LogOut size={16} color={themeColors.danger} style={{ marginRight: 8 }} />
              <Text style={[styles.logoutBtnText, { color: themeColors.danger }]}>
                Sign Out of Workspace
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              onPress={() => setProfileModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: themeColors.text }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  homeBrandLogo: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
  },
  homeBrandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  homeOsBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
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
    gap: 8,
  },
  homeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  homeStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  homeAvatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  brandLogoImage: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  brandTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: typography.sizes.title,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  userName: {
    fontSize: typography.sizes.caption,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: typography.sizes.tiny,
    fontWeight: '600',
  },
  avatarPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: typography.sizes.sub,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    height: touchTarget.min,
    marginTop: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    paddingVertical: 0,
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
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backPlaceholder: {
    width: 40,
  },
  detailTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  detailTitleText: {
    fontSize: typography.sizes.lead,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  detailSubtitleText: {
    fontSize: typography.sizes.tiny,
    marginTop: 1,
  },
  detailRightBox: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  statusPillCompact: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.full,
  },

  // MODAL STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing[4],
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing[4],
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  accountProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    fontSize: typography.sizes.h3,
    fontWeight: '800',
  },
  accountNameText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  accountEmailText: {
    fontSize: typography.sizes.caption,
    marginTop: 1,
  },
  accountRoleBadge: {
    backgroundColor: '#0066FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  accountRoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  sessionInfoBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  sessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfoLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: '500',
  },
  sessionInfoVal: {
    fontSize: typography.sizes.caption,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    marginBottom: spacing[2],
  },
  logoutBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});
```

---

## 4. Technical Blueprint 3: Dead Code Retirement & CRM Consolidation

### 4.1 Retirement of `ProjectsScreen.tsx` (1,007 Lines)

**Evidence Chain**:
- **Audit Discovery**: Documented in `docs/mobile-screen-inventory.md` (item #10, line 31): *"Dead code; unreferenced in RootNavigator.tsx; superseded by FieldProjectsScreen.tsx. To be deleted in M2."*
- **Grep Verification**: Full-repository search for `ProjectsScreen` confirmed it appears **only** in its own declaration (`ProjectsScreen.tsx:47`) and audit markdown files.
- **Superseding File**: `FieldProjectsScreen.tsx` (839 lines) is already registered in `RootNavigator.tsx` on tab `Projects`. It contains complete 7-stage EPC progression, stage filtering, dossier modal integration, and barcode scanner modal hooks.
- **Worker Action**: Worker M2 can execute deletion of `mobile-app/src/screens/projects/ProjectsScreen.tsx` with zero risk of compilation error.

### 4.2 Deprecation & Aliasing of `LeadsScreen.tsx` (863 Lines)

**Evidence Chain**:
- **Audit Discovery**: `docs/mobile-screen-inventory.md` (item #4, line 25): *"Redundant duplicate of PipelineScreen; conflicting form validation schema; no offline draft integration. To be retired in M2."*
- **Consolidation Target**: `PipelineScreen.tsx` (2,142 lines) houses full CRM pipeline stages (`NEW`, `QUOTES`, `ONBOARDING`, `PROJECTS`), offline draft lead synchronization, `LeadCaptureModal`, `QuotationBuilderModal`, and `CustomerOnboardingModal`.
- **Navigation Aliasing**:
  - `RootNavigator.tsx` stack declaration maps `<Stack.Screen name="Leads" component={PipelineScreen} />`.
  - In `navigateToTab(screenName, params)`: Any call specifying `'Leads'` automatically redirects to `MainTabs -> Pipeline`:
    ```typescript
    if (screenName === 'Leads' || screenName === 'Pipeline') {
      navigationRef.navigate('MainTabs', { screen: 'Pipeline', params });
      return;
    }
    ```
- All CRM entries across the mobile application now converge on a single source of truth (`PipelineScreen.tsx`).

---

## 5. Verification Protocol & Quality Gates

To confirm zero regressions after Worker M2 implements these changes, the following verification suite must be executed:

### 5.1 Verification Commands
1. **TypeScript Compilation**:
   ```powershell
   cmd /c "cd mobile-app && npx tsc --noEmit"
   ```
   *Pass Criteria*: Exits with code 0, 0 type errors.
2. **Automated Perspective Test Suite**:
   ```powershell
   node mobile-app/test-perspectives.js
   ```
   *Pass Criteria*: All 23 perspective tests pass (100% success rate).
3. **Reference Integrity Check**:
   Grep check to ensure no dangling imports reference `ProjectsScreen.tsx`:
   ```powershell
   git status
   ```

### 5.2 Manual / Emulated Interaction Matrix
- **Status Bar & Notch Clearance**: Launch app on an Android device/emulator with display cutout enabled (`Settings -> Developer options -> Display cutout`). Verify that Header title, status pill, and operator avatar have at least 8dp padding below the status bar icons and do not overlap the camera notch.
- **Edge-to-Edge Tab Bar Clearance**: Verify that bottom tab icons and labels render cleanly above the 3-button navigation bar or gesture line without bottom clipping.
- **Hardware Back Behavior**:
  1. From `Pipeline` tab, press Android hardware back -> should navigate to `Dashboard` tab.
  2. From `Dashboard` tab, press hardware back once -> native Toast appears: *"Press back again to exit WhereReady Solar OS"*.
  3. Press hardware back again within 2 seconds -> app exits cleanly.
  4. From `Dashboard`, tap quick action to open `QuickQuote` -> press hardware back -> smoothly pops back to `Dashboard`.
  5. Tap header profile avatar to open profile modal -> press hardware back -> modal dismisses smoothly without navigating tabs or exiting app.
