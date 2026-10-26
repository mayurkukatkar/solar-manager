import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, spacing, radii, typography, touchTarget, shadows } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  testID,
}) => {
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.md,
      minHeight: size === 'sm' ? 36 : size === 'lg' ? 52 : touchTarget.min,
      paddingHorizontal: size === 'sm' ? spacing[3] : size === 'lg' ? spacing[6] : spacing[4],
      paddingVertical: size === 'sm' ? spacing[1] : size === 'lg' ? spacing[3] : spacing[2],
      opacity: disabled ? 0.5 : 1,
      ...(fullWidth ? { width: '100%' } : {}),
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: colors.primary,
          ...shadows.glowBlue,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.slate100,
          borderWidth: 1,
          borderColor: colors.slate200,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.danger,
        };
      case 'success':
        return {
          ...base,
          backgroundColor: colors.success,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: typography.weight.bold,
      fontSize: size === 'sm' ? typography.size.sub : size === 'lg' ? typography.size.base : typography.size.body,
    };

    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return { ...base, color: colors.white };
      case 'secondary':
        return { ...base, color: colors.slate800 };
      case 'outline':
      case 'ghost':
        return { ...base, color: colors.primary };
      default:
        return base;
    }
  };

  const spinnerColor = variant === 'primary' || variant === 'danger' || variant === 'success'
    ? colors.white
    : colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
});
