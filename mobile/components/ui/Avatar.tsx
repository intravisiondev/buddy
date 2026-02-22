import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const sizes: Record<string, { wh: number; font: number }> = {
  sm: { wh: 32, font: 12 },
  md: { wh: 40, font: 14 },
  lg: { wh: 48, font: 16 },
  xl: { wh: 64, font: 22 },
};

export default function Avatar({ name, src, size = 'md', style }: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const s = sizes[size];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[{ width: s.wh, height: s.wh, borderRadius: s.wh / 2 }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: s.wh, height: s.wh, borderRadius: s.wh / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: s.font }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    color: '#ffffff',
  },
});
