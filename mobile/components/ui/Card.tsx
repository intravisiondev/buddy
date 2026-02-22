import { View, TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { colors, borderRadius, shadows } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const cardStyle = {
  backgroundColor: colors.lightCard,
  borderRadius: borderRadius.lg,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.lightBorder,
  ...shadows.soft,
};

export default function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[cardStyle, style]} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
}
