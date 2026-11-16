import React from 'react';
import { View, StyleSheet } from 'react-native';
import { OperationsScreen } from '../../operations/OperationsScreen';

export interface InstallationsModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const InstallationsModule: React.FC<InstallationsModuleProps> = ({
  onClose,
  initialParams,
}) => {
  return (
    <View style={styles.container}>
      <OperationsScreen onClose={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

