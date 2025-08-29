/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refined brand palette: Indigo primary, Amber secondary
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81'
        },
        secondary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F'
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
        // Additional cartoon colors
        'cartoon-blue': '#58CC02',
        'cartoon-green': '#89E219',
        'cartoon-orange': '#FF9600',
        'cartoon-purple': '#CE82FF',
        'cartoon-pink': '#FF69B4',
        'cartoon-red': '#FF4B4B',
        'cartoon-yellow': '#FFC800',
        // Neutral tweaks for clearer borders/text
        'cartoon-gray': '#6B7280',
        'cartoon-light': '#E5E7EB',
        'cartoon-dark': '#37464F'
      },
      fontFamily: {
        'cartoon': ['Comic Sans MS', 'cursive'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'fun': ['Nunito', 'Comic Sans MS', 'cursive']
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
        'cartoon': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 3px rgba(59, 130, 246, 0.1)',
        'cartoon-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(59, 130, 246, 0.1)',
        'success': '0 0 0 3px rgba(34, 197, 94, 0.2)',
        'danger': '0 0 0 3px rgba(239, 68, 68, 0.2)'
      },
      borderRadius: {
        'cartoon': '20px',
        'cartoon-lg': '30px'
      }
    }
  },
  plugins: [],
}