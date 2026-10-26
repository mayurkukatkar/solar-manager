import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, shadows } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'outlined',
  onPress,
  activeOpacity = 0.8,
}) => {
  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.white,
      borderRadius: radii.xl,
      padding: spacing[4],
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.slate100,
          ...shadows.card,
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.slate200,
          ...shadows.subtle,
        };
      case 'flat':
        return {
          ...base,
          backgroundColor: colors.slate50,
          borderWidth: 1,
          borderColor: colors.slate100,
        };
      default:
        return base;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};
