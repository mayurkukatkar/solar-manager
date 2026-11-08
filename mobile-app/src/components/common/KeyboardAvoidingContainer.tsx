import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export interface KeyboardAvoidingContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  keyboardVerticalOffset?: number;
  dismissOnTouchOutside?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const KeyboardAvoidingContainer: React.FC<KeyboardAvoidingContainerProps> = ({
  children,
  header,
  footer,
  scrollable = true,
  keyboardVerticalOffset,
  dismissOnTouchOutside = true,
  style,
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Dynamic vertical offset calculation (accounting for top insets / modals)
  const defaultOffset = Platform.OS === 'ios' ? insets.top + 20 : 0;
  const resolvedOffset = keyboardVerticalOffset ?? defaultOffset;

  const content = (
    <View style={styles.innerFlex}>
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.innerFlex, contentContainerStyle]}>{children}</View>
      )}
      {footer && (
        <View
          style={[
            styles.footerContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSubtle,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {footer}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={resolvedOffset}
    >
      {dismissOnTouchOutside ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {content}
        </TouchableWithoutFeedback>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerFlex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footerContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
