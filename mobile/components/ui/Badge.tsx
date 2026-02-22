import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'accent' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  primary: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: colors.primary },
  success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: colors.success },
  accent: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: colors.accent },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: colors.warning },
  error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: colors.error },
  neutral: { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', text: colors.neutral },
};

export default function Badge({ children, variant = 'primary', size = 'md', style }: BadgeProps) {
  const c = variantColors[variant];
  const paddingH = size === 'sm' ? 8 : 12;
  const paddingV = size === 'sm' ? 4 : 6;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border, paddingHorizontal: paddingH, paddingVertical: paddingV },
        style,
      ]}
    >
      <Text style={[styles.text, { color: c.text, fontSize }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
