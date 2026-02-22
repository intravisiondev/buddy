/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        success: '#10b981',
        'success-dark': '#059669',
        accent: '#8b5cf6',
        'accent-dark': '#7c3aed',
        warning: '#f59e0b',
        'warning-dark': '#d97706',
        error: '#ef4444',
        'error-dark': '#dc2626',
        neutral: '#6b7280',
        'neutral-dark': '#4b5563',
        
        // Light theme
        'light-bg': '#f9fafb',
        'light-bg-secondary': '#f3f4f6',
        'light-card': '#ffffff',
        'light-border': '#e5e7eb',
        'light-text-primary': '#111827',
        'light-text-secondary': '#6b7280',
        
        // Dark theme
        'dark-bg': '#0f172a',
        'dark-bg-secondary': '#1e293b',
        'dark-card': '#1e293b',
        'dark-border': '#334155',
        'dark-text-primary': '#f1f5f9',
        'dark-text-secondary': '#94a3b8',
      },
      borderRadius: {
        button: '12px',
        card: '16px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
        strong: '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
