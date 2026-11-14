import { createNavigationContainerRef } from '@react-navigation/native';

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

