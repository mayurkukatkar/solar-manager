import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { SalesDashboardScreen } from '../screens/sales/SalesDashboardScreen';
import { TechDashboardScreen } from '../screens/technician/TechDashboardScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.slate900 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : role === 'OWNER' ? (
          <Stack.Screen name="OwnerApp" component={OwnerDashboardScreen} />
        ) : role === 'SALES_AGENT' ? (
          <Stack.Screen name="SalesApp" component={SalesDashboardScreen} />
        ) : (
          <Stack.Screen name="TechApp" component={TechDashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
