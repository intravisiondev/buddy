import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'error' | 'warning' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
  icon?: ReactNode;
}

const variantBg: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.lightBgSecondary,
  ghost: 'transparent',
  error: colors.error,
  warning: colors.warning,
  success: colors.success,
};

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style: styleProp,
  icon,
}: ButtonProps) {
  const textColor = variant === 'ghost' || variant === 'secondary' ? colors.lightTextPrimary : '#ffffff';
  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingHorizontal = size === 'sm' ? 12 : size === 'lg' ? 24 : 16;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: variantBg[variant], paddingVertical, paddingHorizontal },
        (disabled || loading) && styles.disabled,
        styleProp,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.text, { color: textColor, fontSize }]}>{children}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginRight: 8 },
  text: { fontWeight: '600' },
});
