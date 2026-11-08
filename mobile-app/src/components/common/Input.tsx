import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { CheckCircle2, Eye, EyeOff, X } from 'lucide-react-native';
import { spacing, radii, typography, touchTarget, useTheme } from '../../theme';

export interface InputProps extends Omit<TextInputProps, 'editable'> {
  label?: string;
  error?: string;
  successMessage?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  isPassword?: boolean;
  tabularNums?: boolean;
  editable?: boolean;
  onClear?: () => void;
  onSuffixPress?: () => void;
}

export const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      label,
      error,
      successMessage,
      helperText,
      prefixIcon,
      suffixIcon,
      containerStyle,
      inputStyle,
      disabled = false,
      required = false,
      clearable = false,
      isPassword = false,
      tabularNums = false,
      editable,
      onClear,
      onSuffixPress,
      onFocus,
      onBlur,
      value,
      onChangeText,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const { colors, isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isEditable = editable !== undefined ? editable : !disabled;
    const isDisabled = disabled || !isEditable;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(successMessage) && !hasError;
    const isSecure = isPassword ? !passwordVisible : secureTextEntry;

    const handleClear = () => {
      if (onChangeText) onChangeText('');
      if (onClear) onClear();
    };

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && (
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                { color: isDisabled ? colors.textMuted : colors.text },
              ]}
            >
              {label}
            </Text>
            {required && <Text style={[styles.requiredAsterisk, { color: colors.danger }]}> *</Text>}
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDisabled ? colors.surfaceRecessed : colors.surface,
              borderColor: hasError
                ? colors.danger
                : hasSuccess
                ? colors.success
                : isFocused
                ? colors.primary
                : colors.border,
              borderWidth: isFocused ? 1.8 : 1.2,
            },
          ]}
        >
          {prefixIcon && <View style={styles.prefix}>{prefixIcon}</View>}

          <TextInput
            ref={ref}
            editable={!isDisabled}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={isSecure}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: isDisabled ? colors.textMuted : colors.text },
              tabularNums && typography.tabularNums,
              inputStyle,
            ]}
            onFocus={(e) => {
              setIsFocused(true);
              if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (onBlur) onBlur(e);
            }}
            accessibilityRole="text"
            accessibilityState={{ disabled: isDisabled }}
            accessibilityLabel={label}
            {...props}
          />

          {/* Clear Button */}
          {clearable && !isDisabled && Boolean(value) && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear text"
            >
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Password Toggle */}
          {isPassword && !isDisabled && (
            <TouchableOpacity
              onPress={() => setPasswordVisible((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? (
                <EyeOff size={16} color={colors.textSecondary} />
              ) : (
                <Eye size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}

          {/* Suffix Icon or Validation Success Icon */}
          {hasSuccess && !suffixIcon && (
            <View style={styles.suffix}>
              <CheckCircle2 size={16} color={colors.success} />
            </View>
          )}

          {suffixIcon && (
            <TouchableOpacity
              disabled={!onSuffixPress || isDisabled}
              onPress={onSuffixPress}
              style={styles.suffix}
            >
              {suffixIcon}
            </TouchableOpacity>
          )}
        </View>

        {/* Status / Helper Text */}
        {hasError ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        ) : hasSuccess ? (
          <Text style={[styles.successText, { color: colors.success }]}>{successMessage}</Text>
        ) : helperText ? (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[3],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  label: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
  },
  requiredAsterisk: {
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sub,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    paddingVertical: Platform.OS === 'ios' ? spacing[2] : spacing[1],
  },
  prefix: {
    marginRight: spacing[2],
  },
  suffix: {
    marginLeft: spacing[2],
  },
  actionBtn: {
    padding: 4,
    marginLeft: spacing[1],
  },
  errorText: {
    fontSize: typography.size.caption,
    marginTop: spacing[1],
    fontWeight: typography.weight.semibold,
  },
  successText: {
    fontSize: typography.size.caption,
    marginTop: spacing[1],
    fontWeight: typography.weight.semibold,
  },
  helperText: {
    fontSize: typography.size.caption,
    marginTop: spacing[1],
  },
});
