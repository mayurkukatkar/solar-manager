import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { radii, spacing, useTheme } from '../../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}) => {
  const { colors } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading..."
      style={[
        {
          backgroundColor: colors.surfaceHighlight,
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

// Preset 1: Text Line Skeleton Group
export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: DimensionValue;
  style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 14,
  gap = 8,
  lastLineWidth = '60%',
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, idx) => {
        const isLast = idx === lines - 1;
        return (
          <Skeleton
            key={idx}
            height={lineHeight}
            width={isLast ? lastLineWidth : '100%'}
            style={idx < lines - 1 ? { marginBottom: gap } : undefined}
          />
        );
      })}
    </View>
  );
};

// Preset 2: Circular Avatar Skeleton
export interface SkeletonCircleProps {
  size?: number;
  style?: ViewStyle;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ size = 44, style }) => {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
};

// Preset 3: Standard Card Skeleton
export interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <SkeletonCircle size={40} />
        <View style={styles.cardHeaderLines}>
          <Skeleton height={14} width="55%" style={{ marginBottom: 6 }} />
          <Skeleton height={12} width="35%" />
        </View>
      </View>
      <SkeletonText lines={2} lineHeight={12} gap={6} style={{ marginTop: spacing[3] }} />
      <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
        <Skeleton height={28} width="30%" borderRadius={radii.full} />
        <Skeleton height={28} width="25%" borderRadius={radii.sm} />
      </View>
    </View>
  );
};

// Compound Object Export for clean imports
export const SkeletonLoader = Object.assign(Skeleton, {
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Card: SkeletonCard,
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderLines: {
    marginLeft: spacing[3],
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
  },
});
