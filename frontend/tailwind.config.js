/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', 50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81' },
        secondary: { DEFAULT: '#06B6D4', 400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2' },
        accent: { DEFAULT: '#F97316', 400: '#FB923C', 500: '#F97316', 600: '#EA580C' },
        night: '#0F172A',
        card: '#1E293B',
        frost: '#F8FAFC',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(79, 70, 229, 0.35)',
        'glow-cyan': '0 0 24px rgba(6, 182, 212, 0.3)',
        card: '0 8px 30px rgba(2, 6, 23, 0.35)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(ellipse at 20% 0%, rgba(79,70,229,0.28) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(6,182,212,0.18) 0%, transparent 50%)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
