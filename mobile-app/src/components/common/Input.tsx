import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, radii, typography, touchTarget } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  onSuffixPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  prefixIcon,
  suffixIcon,
  containerStyle,
  inputStyle,
  onSuffixPress,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
      >
        {prefixIcon && <View style={styles.prefix}>{prefixIcon}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.slate400}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...props}
        />
        {suffixIcon && (
          <TouchableOpacity
            disabled={!onSuffixPress}
            onPress={onSuffixPress}
            style={styles.suffix}
          >
            {suffixIcon}
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
    color: colors.slate700,
    marginBottom: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radii.md,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing[3],
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: typography.size.body,
    color: colors.slate900,
    fontWeight: typography.weight.medium,
    paddingVertical: spacing[2],
  },
  prefix: {
    marginRight: spacing[2],
  },
  suffix: {
    marginLeft: spacing[2],
  },
  errorText: {
    fontSize: typography.size.caption,
    color: colors.danger,
    marginTop: spacing[1],
    fontWeight: typography.weight.semibold,
  },
  helperText: {
    fontSize: typography.size.caption,
    color: colors.slate500,
    marginTop: spacing[1],
  },
});
