import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Layers,
  Briefcase,
  Zap,
  User,
  Plus,
  Receipt,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { PipelineScreen } from '../screens/crm/PipelineScreen';
import { FieldProjectsScreen } from '../screens/projects/FieldProjectsScreen';
import { QuickQuoteScreen } from '../screens/crm/QuickQuoteScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { ModulesScreen } from '../screens/modules/ModulesScreen';
import { FieldProfileScreen } from '../screens/profile/FieldProfileScreen';
import { LeadCaptureModal } from '../screens/crm/LeadCaptureModal';
import { colors } from '../theme/colors';

export const navigationRef = createNavigationContainerRef<any>();

export function navigateToTab(screenName: string, params?: any) {
  if (navigationRef.isReady()) {
    if (screenName === 'QuickQuote' || screenName === 'Modules') {
      navigationRef.navigate(screenName, params);
    } else {
      navigationRef.navigate('MainTabs', { screen: screenName, params });
    }
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const EmptyScreen: React.FC = () => null;

const MainTabNavigator: React.FC = () => {
  const [leadModalVisible, setLeadModalVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Pipeline"
          component={PipelineScreen}
          options={{
            tabBarLabel: 'Pipeline',
            tabBarIcon: ({ color }) => (
              <Layers size={22} color={color} strokeWidth={2.2} />
            ),
          }}
        />
        <Tab.Screen
          name="Projects"
          component={FieldProjectsScreen}
          options={{
            tabBarLabel: 'Projects',
            tabBarIcon: ({ color }) => (
              <Briefcase size={22} color={color} strokeWidth={2.2} />
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
              >
                <View style={styles.centerFab}>
                  <Plus size={26} color="#ffffff" strokeWidth={2.8} />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Finance"
          component={FinanceScreen}
          options={{
            tabBarLabel: 'Finance',
            tabBarIcon: ({ color }) => (
              <Receipt size={22} color={color} strokeWidth={2.2} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={FieldProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <User size={22} color={color} strokeWidth={2.2} />
            ),
          }}
        />
      </Tab.Navigator>

      <LeadCaptureModal
        visible={leadModalVisible}
        onClose={() => setLeadModalVisible(false)}
        onSuccess={(lead) => {
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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="QuickQuote" component={QuickQuoteScreen} />
            <Stack.Screen name="Modules" component={ModulesScreen} />
            <Stack.Screen name="FinanceDetail" component={FinanceScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  centerFabContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  centerFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: '#ffffff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
