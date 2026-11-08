import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { spacing, radii, typography, useTheme } from '../../theme';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'neutral'
  | 'info'
  | 'accent';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  icon,
  dot = false,
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();

  const getBadgeColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primaryLight,
          text: isDark ? colors.primaryLight : colors.primaryDark,
          border: isDark ? colors.primary : '#bfdbfe',
          dot: colors.primary,
        };
      case 'success':
        return {
          bg: colors.successLight,
          text: isDark ? colors.success : colors.successDark,
          border: colors.successBorder,
          dot: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningLight,
          text: isDark ? colors.warning : colors.warningDark,
          border: colors.warningBorder,
          dot: colors.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerLight,
          text: isDark ? colors.danger : colors.dangerDark,
          border: colors.dangerBorder,
          dot: colors.danger,
        };
      case 'purple':
        return {
          bg: colors.purpleLight,
          text: isDark ? colors.purple : colors.purpleDark,
          border: colors.purpleBorder,
          dot: colors.purple,
        };
      case 'info':
        return {
          bg: colors.infoLight,
          text: isDark ? colors.info : colors.infoDark,
          border: colors.infoBorder,
          dot: colors.info,
        };
      case 'accent':
        return {
          bg: colors.accentLight,
          text: isDark ? colors.accent : colors.accentDark,
          border: isDark ? colors.warningBorder : '#fed7aa',
          dot: colors.accent,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceRecessed,
          text: colors.textSecondary,
          border: colors.border,
          dot: colors.textMuted,
        };
    }
  };

  const scheme = getBadgeColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? spacing[2] : spacing[3],
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      {dot && <View style={[styles.dot, { backgroundColor: scheme.dot }]} />}
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: scheme.text,
            fontSize: isSm ? typography.size.tiny : typography.size.caption,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  iconBox: {
    marginRight: 4,
  },
  text: {
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wide,
  },
});
