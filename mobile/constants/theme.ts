export const colors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  success: '#10b981',
  successDark: '#059669',
  accent: '#8b5cf6',
  accentDark: '#7c3aed',
  warning: '#f59e0b',
  warningDark: '#d97706',
  error: '#ef4444',
  errorDark: '#dc2626',
  neutral: '#6b7280',
  neutralDark: '#4b5563',
  
  // Light theme
  lightBg: '#f9fafb',
  lightBgSecondary: '#f3f4f6',
  lightCard: '#ffffff',
  lightBorder: '#e5e7eb',
  lightTextPrimary: '#111827',
  lightTextSecondary: '#6b7280',
  
  // Dark theme
  darkBg: '#0f172a',
  darkBgSecondary: '#1e293b',
  darkCard: '#1e293b',
  darkBorder: '#334155',
  darkTextPrimary: '#f1f5f9',
  darkTextSecondary: '#94a3b8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};
