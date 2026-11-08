import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ViewStyle,
} from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radii, typography, touchTarget, useTheme } from '../../theme';
import { haptics } from '../../utils/haptics';

export interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  dragHandle?: boolean;
  isDirty?: boolean;
  dirtyConfirmTitle?: string;
  dirtyConfirmMessage?: string;
  style?: ViewStyle;
}

/**
 * Reusable Dirty Form Guard Hook
 */
export const useDirtyFormWarning = (
  isDirty: boolean,
  action: () => void,
  title = 'Discard Unsaved Changes?',
  message = 'You have unsaved changes in this form. Are you sure you want to discard them?'
) => {
  return () => {
    if (!isDirty) {
      action();
      return;
    }
    haptics.notificationWarning();
    Alert.alert(title, message, [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: action },
    ]);
  };
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  onBack,
  rightAction,
  dragHandle = true,
  isDirty = false,
  dirtyConfirmTitle = 'Discard Unsaved Changes?',
  dirtyConfirmMessage = 'You have unsaved changes. Are you sure you want to exit without saving?',
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleClose = () => {
    if (!onClose) return;
    if (isDirty) {
      haptics.notificationWarning();
      Alert.alert(dirtyConfirmTitle, dirtyConfirmMessage, [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (!onBack) return;
    if (isDirty) {
      haptics.notificationWarning();
      Alert.alert(dirtyConfirmTitle, dirtyConfirmMessage, [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onBack },
      ]);
    } else {
      onBack();
    }
  };

  return (
    <View
      style={[
        styles.modalHeaderContainer,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
          paddingTop: Math.max(insets.top, spacing[3]),
        },
        style,
      ]}
    >
      {dragHandle && (
        <View
          style={[
            styles.modalDragHandle,
            { backgroundColor: colors.borderStrong },
          ]}
        />
      )}
      <View style={styles.modalHeaderRow}>
        {/* Left Back Navigation Slot */}
        {onBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.modalNavBtn,
              { backgroundColor: colors.surfaceHighlight },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        )}

        <View style={styles.modalHeaderTextBox}>
          <Text
            style={[
              styles.modalHeaderTitle,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.modalHeaderSubtitle,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.modalHeaderActionBox}>
          {rightAction}
          {onClose && (
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.modalCloseBtn,
                { backgroundColor: colors.surfaceHighlight },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalHeaderContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget.min,
  },
  modalNavBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  modalHeaderTextBox: {
    flex: 1,
    paddingRight: spacing[2],
  },
  modalHeaderTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.extrabold,
    letterSpacing: typography.tracking.snug,
  },
  modalHeaderSubtitle: {
    fontSize: typography.size.caption,
    marginTop: 2,
  },
  modalHeaderActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
