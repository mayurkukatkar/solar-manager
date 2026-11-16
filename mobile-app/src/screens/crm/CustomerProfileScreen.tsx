import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomerProfileModal } from './CustomerProfileModal';

export const CustomerProfileScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const customerId = route?.params?.customerId;
  const leadId = route?.params?.leadId;
  const customerData = route?.params?.customer || route?.params?.customerData;

  return (
    <View style={styles.container}>
      <CustomerProfileModal
        visible={true}
        customerId={customerId}
        leadId={leadId}
        customerData={customerData}
        onClose={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs', { screen: 'Dashboard' });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

