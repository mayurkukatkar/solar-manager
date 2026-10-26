import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radii, typography } from '../../theme';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  icon,
  style,
  textStyle,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'success':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'warning':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'danger':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'purple':
        return { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' };
      case 'neutral':
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
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
    >
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
  iconBox: {
    marginRight: 4,
  },
  text: {
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wide,
  },
});
