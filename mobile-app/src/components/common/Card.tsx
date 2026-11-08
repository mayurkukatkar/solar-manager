import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import { spacing, radii, useTheme } from '../../theme';

export type CardVariant = 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number; // Backward compatibility
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'outlined',
  padding = 'md',
  onPress,
  disabled = false,
  testID,
  accessibilityLabel,
}) => {
  const { colors, isDark, tokens } = useTheme();

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing[2] };
      case 'lg':
        return { padding: spacing[6] };
      case 'md':
      default:
        return { padding: spacing[4] };
    }
  };

  const getCardStyle = (pressed = false): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: variant === 'flat' ? colors.surfaceRecessed : colors.surface,
      borderRadius: radii.xl,
      opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
      ...getPaddingStyle(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          borderWidth: 1,
          borderColor: isDark ? colors.borderSubtle : colors.border,
          ...(Platform.OS === 'ios' ? tokens.shadows.card : { elevation: 3 }),
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.border,
          ...(Platform.OS === 'ios' ? tokens.shadows.subtle : { elevation: 1 }),
        };
      case 'flat':
        return {
          ...base,
          backgroundColor: colors.surfaceRecessed,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        };
      default:
        return base;
    }
  };

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        android_ripple={{
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderless: false,
        }}
        style={({ pressed }) => [getCardStyle(pressed), style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[getCardStyle(false), style]}>
      {children}
    </View>
  );
};
