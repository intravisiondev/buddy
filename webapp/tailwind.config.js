/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#5B7FFF',
        'primary-dark': '#4461E8',
        success: '#10D98E',
        'success-dark': '#0DB87A',
        accent: '#A78BFA',
        'accent-dark': '#8B5CF6',
        warning: '#FFB800',
        'warning-dark': '#F59E0B',
        error: '#FF6B6B',
        'error-dark': '#EF4444',
        light: {
          bg: '#F8F9FE',
          card: '#FFFFFF',
          text: {
            primary: '#1E1E2E',
            secondary: '#6B7280',
          },
        },
        dark: {
          bg: '#0A0A14',
          card: '#13131F',
          'card-hover': '#1A1A2E',
          border: '#2A2A3E',
          text: {
            primary: '#F3F4F6',
            secondary: '#9CA3AF',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(91, 127, 255, 0.08)',
        medium: '0 4px 20px rgba(91, 127, 255, 0.12)',
        strong: '0 8px 32px rgba(91, 127, 255, 0.16)',
        glow: '0 0 24px rgba(91, 127, 255, 0.3)',
        'glow-success': '0 0 24px rgba(16, 217, 142, 0.3)',
        'glow-accent': '0 0 24px rgba(167, 139, 250, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5B7FFF 0%, #8B5CF6 100%)',
        'gradient-success': 'linear-gradient(135deg, #10D98E 0%, #06B6D4 100%)',
        'gradient-accent': 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)',
        'gradient-warning': 'linear-gradient(135deg, #FFB800 0%, #F59E0B 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(91, 127, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        'gradient-card-dark': 'linear-gradient(135deg, rgba(91, 127, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
