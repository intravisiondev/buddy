import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

type ProgressVariant = 'primary' | 'success' | 'accent' | 'warning' | 'error';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const barColors: Record<ProgressVariant, string> = {
  primary: colors.primary,
  success: colors.success,
  accent: colors.accent,
  warning: colors.warning,
  error: colors.error,
};

const barHeights: Record<string, number> = { sm: 4, md: 8, lg: 12 };

export default function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  showLabel = false,
  height = 'md',
  style,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const h = barHeights[height];

  return (
    <View style={style}>
      {showLabel && (
        <Text style={styles.label}>{Math.round(percentage)}%</Text>
      )}
      <View style={[styles.track, { height: h }]}>
        <View
          style={[
            styles.fill,
            { width: `${percentage}%`, height: h, backgroundColor: barColors[variant] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: colors.lightTextSecondary, marginBottom: 4 },
  track: {
    width: '100%',
    backgroundColor: colors.lightBgSecondary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: { borderRadius: 999 },
});
