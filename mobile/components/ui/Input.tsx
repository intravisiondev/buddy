import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors, borderRadius } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = error ? colors.error : isFocused ? colors.primary : colors.lightBorder;

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, { borderColor }]}
        placeholderTextColor="#9ca3af"
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.lightTextPrimary, marginBottom: 8 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    fontSize: 16,
    color: colors.lightTextPrimary,
  },
  error: { fontSize: 12, color: colors.error, marginTop: 4 },
});
