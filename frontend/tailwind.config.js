/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified brand palette
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        // Map legacy cartoon tokens to brand-cohesive values
        'cartoon-blue': '#6366f1',
        'cartoon-green': '#22c55e',
        'cartoon-orange': '#f59e0b',
        'cartoon-purple': '#8b5cf6',
        'cartoon-pink': '#ec4899',
        'cartoon-red': '#ef4444',
        'cartoon-yellow': '#fbbf24',
        'cartoon-gray': '#64748b',
        'cartoon-light': '#f8fafc',
        'cartoon-dark': '#0f172a'
      },
      fontFamily: {
        'sans': ['Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'fun': ['Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'cartoon': ['Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-slow': 'pulse 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'celebrate': 'celebrate 0.6s ease-in-out',
        'pop': 'pop 0.3s ease-in-out',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'rainbow': 'rainbow 2s linear infinite'
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        celebrate: {
          '0%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.2) rotate(5deg)' },
          '30%': { transform: 'scale(1.1) rotate(-5deg)' },
          '45%': { transform: 'scale(1.15) rotate(3deg)' },
          '60%': { transform: 'scale(1.05) rotate(-2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        },
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' }
        },
        rainbow: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        }
      },
      boxShadow: {
        'cartoon': '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
        'cartoon-lg': '0 2px 4px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.08)',
        'success': '0 0 0 3px rgba(34, 197, 94, 0.2)',
        'danger': '0 0 0 3px rgba(239, 68, 68, 0.2)'
      },
      borderRadius: {
        'cartoon': '12px',
        'cartoon-lg': '16px'
      }
    }
  },
  plugins: [],
}