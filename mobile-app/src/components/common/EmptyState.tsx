import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Button } from './Button';
import { spacing, radii, typography, useTheme } from '../../theme';
import { GuideCharacter, CharacterPose } from '../GuideCharacter';

export type EmptyStateTone = 'neutral' | 'primary' | 'warning' | 'danger' | 'success';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  useGuideCharacter?: boolean;
  guidePose?: CharacterPose;
  guideSpeech?: string;
  title: string;
  description: string;
  tone?: EmptyStateTone;
  actionTitle?: string;
  onActionPress?: () => void;
  secondaryActionTitle?: string;
  onSecondaryActionPress?: () => void;
  children?: React.ReactNode;
  compact?: boolean;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  useGuideCharacter = false,
  guidePose = 'inspect',
  guideSpeech,
  title,
  description,
  tone = 'neutral',
  actionTitle,
  onActionPress,
  secondaryActionTitle,
  onSecondaryActionPress,
  children,
  compact = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const getCircleColor = () => {
    switch (tone) {
      case 'primary':
        return { bg: colors.primaryLight, border: isDark ? colors.primaryDark : '#bfdbfe' };
      case 'warning':
        return { bg: colors.warningLight, border: colors.warningBorder };
      case 'danger':
        return { bg: colors.dangerLight, border: colors.dangerBorder };
      case 'success':
        return { bg: colors.successLight, border: colors.successBorder };
      case 'neutral':
      default:
        return { bg: colors.surfaceRecessed, border: colors.border };
    }
  };

  const scheme = getCircleColor();
  const showGuide = useGuideCharacter || !icon;

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${title}: ${description}`}
    >
      {showGuide ? (
        <View style={styles.guideWrapper}>
          <GuideCharacter
            pose={guidePose}
            size={compact ? 56 : 72}
            speechText={guideSpeech}
            animated={true}
          />
        </View>
      ) : (
        <View
          style={[
            styles.iconCircle,
            compact && styles.iconCircleCompact,
            { backgroundColor: scheme.bg, borderColor: scheme.border },
          ]}
        >
          {icon}
        </View>
      )}

      <Text style={[styles.title, compact && styles.titleCompact, { color: colors.text }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          compact && styles.descriptionCompact,
          { color: colors.textSecondary },
        ]}
      >
        {description}
      </Text>

      {/* Primary & Secondary Actions */}
      <View style={styles.actionsContainer}>
        {actionTitle && onActionPress && (
          <Button
            title={actionTitle}
            onPress={onActionPress}
            variant="primary"
            size={compact ? 'sm' : 'md'}
            style={styles.actionBtn}
          />
        )}

        {secondaryActionTitle && onSecondaryActionPress && (
          <Button
            title={secondaryActionTitle}
            onPress={onSecondaryActionPress}
            variant="ghost"
            size={compact ? 'sm' : 'md'}
            style={styles.secondaryBtn}
          />
        )}
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
  },
  containerCompact: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
  },
  guideWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  iconCircleCompact: {
    width: 48,
    height: 48,
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.extrabold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  titleCompact: {
    fontSize: typography.size.base,
    marginBottom: spacing[1],
  },
  description: {
    fontSize: typography.size.body,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing[5],
  },
  descriptionCompact: {
    fontSize: typography.size.sub,
    lineHeight: 16,
    marginBottom: spacing[3],
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  actionBtn: {
    minWidth: 140,
  },
  secondaryBtn: {
    minWidth: 100,
  },
});
