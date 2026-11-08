import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import { spacing, radii, typography, touchTarget, shadows, useTheme } from '../../theme';
import { haptics } from '../../utils/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'solar';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonHaptic = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  haptic?: ButtonHaptic;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  haptic,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, isDark } = useTheme();
  const isInteractive = !disabled && !loading;

  // Resolve Min Dimensions & Padding based on Size
  const getDimensions = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          minHeight: 36,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1],
          borderRadius: radii.sm,
        };
      case 'lg':
        return {
          minHeight: 52,
          paddingHorizontal: spacing[6],
          paddingVertical: spacing[3],
          borderRadius: radii.lg,
        };
      case 'md':
      default:
        return {
          minHeight: touchTarget.min,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          borderRadius: radii.md,
        };
    }
  };

  // Base and Variant Container Styles
  const getContainerStyle = (pressed: boolean): ViewStyle => {
    const dim = getDimensions();
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
      ...(fullWidth ? { width: '100%' } : {}),
      ...dim,
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: pressed ? colors.primaryDark : colors.primary,
          ...(!disabled && Platform.OS === 'ios' ? shadows.subtle : {}),
        };
      case 'solar':
        return {
          ...base,
          backgroundColor: pressed ? colors.accentDark : colors.accent,
          ...(!disabled && Platform.OS === 'ios' ? shadows.subtle : {}),
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: pressed ? colors.surfaceHighlight : colors.surfaceRecessed,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: pressed ? colors.primaryLight : 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: pressed ? colors.surfaceHighlight : 'transparent',
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: pressed ? colors.dangerDark : colors.danger,
        };
      case 'success':
        return {
          ...base,
          backgroundColor: pressed ? colors.successDark : colors.success,
        };
      default:
        return base;
    }
  };

  // Variant Text Styles
  const getTextStyle = (): TextStyle => {
    const fontSize =
      size === 'sm' ? typography.size.sub : size === 'lg' ? typography.size.base : typography.size.body;

    const base: TextStyle = {
      fontWeight: typography.weight.bold,
      fontSize,
      letterSpacing: typography.tracking.wide,
    };

    switch (variant) {
      case 'primary':
      case 'solar':
      case 'danger':
      case 'success':
        return { ...base, color: colors.white };
      case 'secondary':
        return { ...base, color: colors.text };
      case 'outline':
      case 'ghost':
        return { ...base, color: colors.primary };
      default:
        return { ...base, color: colors.white };
    }
  };

  const spinnerColor =
    variant === 'primary' || variant === 'solar' || variant === 'danger' || variant === 'success'
      ? colors.white
      : colors.primary;

  const hitSlop = size === 'sm' ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined;

  const handlePress = (e: GestureResponderEvent) => {
    if (!isInteractive) return;
    if (haptic && haptic !== 'none') {
      if (haptic === 'selection') haptics.selection();
      else if (haptic === 'medium') haptics.impactMedium();
      else if (haptic === 'heavy') haptics.impactHeavy();
      else if (haptic === 'success') haptics.notificationSuccess();
      else haptics.impactLight();
    } else if (variant === 'primary' || variant === 'solar' || variant === 'danger') {
      haptics.impactLight();
    }
    onPress(e);
  };

  return (
    <Pressable
      testID={testID}
      disabled={!isInteractive}
      onPress={handlePress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title || 'Button'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      android_ripple={{
        color:
          variant === 'primary' || variant === 'solar' || variant === 'danger' || variant === 'success'
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(0, 0, 0, 0.08)',
        borderless: false,
      }}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <ActivityIndicator size="small" color={spinnerColor} />
          {loadingText ? (
            <Text style={[getTextStyle(), styles.loadingText, textStyle]}>{loadingText}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          {title ? <Text style={[getTextStyle(), textStyle]}>{title}</Text> : null}
          {children}
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </Pressable>
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
  loadingText: {
    marginLeft: spacing[2],
  },
});
