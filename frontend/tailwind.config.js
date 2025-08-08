/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Duolingo-inspired cartoon color palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12'
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
        'cartoon-gray': '#777777',
        'cartoon-light': '#F7F7F7',
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