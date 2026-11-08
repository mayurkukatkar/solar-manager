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
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { BarcodeScannerModal } from '../screens/operations/BarcodeScannerModal';
import { QuickActionsDispatcher } from '../components/QuickActionsDispatcher';
import { AccountSuspendedModal } from '../components/AccountSuspendedModal';
import { SessionExpiredModal } from '../components/SessionExpiredModal';
import { OfflineBanner } from '../components/OfflineBanner';
import { SolLoadingScreen } from '../components/SolLoadingScreen';
import { InstallerSetupGuideModal } from '../components/InstallerSetupGuideModal';
import { AppOnboardingModal } from '../components/AppOnboardingModal';
import { AppUpdateModal } from '../components/AppUpdateModal';
import { haptics } from '../utils/haptics';

export type MainTabParamList = {
  Dashboard: undefined;
  Pipeline: { stage?: string; leadId?: string } | undefined;
  QuickActionsTab: undefined;
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
        strokeWidth={focused ? 2.4 : 1.8}
      />
      {focused && (
        <View
          style={[
            styles.activeIndicatorDot,
            { backgroundColor: themeColors.primary },
          ]}
        />
      )}
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [createInvoiceModalVisible, setCreateInvoiceModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [quickBarcodeProject, setQuickBarcodeProject] = useState<any>(null);

  // Dynamic bottom insets calculation for Android Edge-to-Edge and iOS Home Bar
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
  const tabBarHeight = 56 + bottomInset;

  return (
    <>
      <Tab.Navigator
        backBehavior="firstRoute"
        screenListeners={{
          tabPress: () => {
            haptics.selection();
          },
        }}
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
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
          tabBarAllowFontScaling: true,
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
          name="QuickActionsTab"
          component={EmptyScreen}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.centerFabContainer}
                onPress={() => {
                  haptics.impactMedium();
                  setQuickActionsVisible(true);
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Quick Actions Menu"
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

      {/* QUICK ACTIONS DISPATCHER SHEET */}
      <QuickActionsDispatcher
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        onOpenNewLead={() => setLeadModalVisible(true)}
        onOpenQuickQuote={() => navigateToTab('QuickQuote')}
        onOpenScanHardware={() => {
          setQuickBarcodeProject({ name: 'Field Hardware Scan', capacity: 3.3 });
          setBarcodeModalVisible(true);
        }}
        onOpenRecordPayment={() => setCreateInvoiceModalVisible(true)}
      />

      {/* LEAD CAPTURE MODAL */}
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

      {/* CREATE INVOICE / RECORD PAYMENT MODAL */}
      <CreateInvoiceModal
        visible={createInvoiceModalVisible}
        onClose={() => setCreateInvoiceModalVisible(false)}
        onSuccess={() => {
          setCreateInvoiceModalVisible(false);
          navigateToTab('Finance');
        }}
      />

      {/* HARDWARE BARCODE SCANNER MODAL */}
      {quickBarcodeProject && (
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          project={quickBarcodeProject}
          onClose={() => {
            setBarcodeModalVisible(false);
            setQuickBarcodeProject(null);
          }}
          onSaveSerials={() => {
            setBarcodeModalVisible(false);
            setQuickBarcodeProject(null);
            navigateToTab('Projects');
          }}
        />
      )}
    </>
  );
};

export const RootNavigator: React.FC = () => {
  const {
    user,
    isLoading,
    sessionExpired,
    clearSessionExpired,
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
        const routeName = (currentRoute?.name as string) || '';

        // If on a secondary tab, jump back to root Dashboard tab
        if (
          routeName &&
          routeName !== 'Dashboard' &&
          ['Pipeline', 'Projects', 'Finance'].includes(routeName)
        ) {
          navigationRef.navigate('MainTabs', { screen: 'Dashboard' });
          return true;
        }

        // If on the root Dashboard tab, MainTabs, or Login, enforce double-tap back to exit
        if (routeName === 'Dashboard' || routeName === 'MainTabs' || routeName === 'Login' || !user) {
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
    return <SolLoadingScreen />;
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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

      {/* GLOBAL PERSISTENT OFFLINE STATUS BANNER */}
      <OfflineBanner />

      {/* GLOBAL AUTO-UPDATE CHECKER & DIALOG */}
      <AppUpdateModal />

      {/* GLOBAL FIRST-TIME APP ONBOARDING & PRODUCT TOUR */}
      <AppOnboardingModal />

      {/* FIRST-TIME INSTALLER SETUP GUIDE WITH SOL */}
      {user ? <InstallerSetupGuideModal /> : null}

      {/* GLOBAL SESSION EXPIRED MODAL (HTTP 401) */}
      <SessionExpiredModal
        visible={sessionExpired}
        onSignInAgain={clearSessionExpired}
      />

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
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  tabIconWrapper: {
    width: 48,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  activeIndicatorDot: {
    position: 'absolute',
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  centerFabContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
  },
  centerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
