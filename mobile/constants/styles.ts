import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from './theme';

export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  screenDark: {
    backgroundColor: colors.darkBg,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.lightTextPrimary,
    marginBottom: spacing.sm,
  },
  titleDark: {
    color: colors.darkTextPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.lightTextSecondary,
    marginBottom: spacing.lg,
  },
  subtitleDark: {
    color: colors.darkTextSecondary,
  },
  card: {
    backgroundColor: colors.lightCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  cardDark: {
    backgroundColor: colors.darkCard,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default appStyles;
