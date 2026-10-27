/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#087F65',
          50: '#EAF4EF',
          100: '#F1F7F4',
          200: '#DDEBE3',
          300: '#A7D4C3',
          400: '#52B599',
          500: '#168764',
          600: '#087F65',
          700: '#066B55',
          800: '#075E4B',
          900: '#043D31',
        },
        emerald: {
          DEFAULT: '#087F65',
          deep: '#075E4B',
          hover: '#066B55',
          badge: '#168764',
        },
        mint: {
          DEFAULT: '#EAF4EF',
          bg: '#EAF4EF',
          soft: '#F1F7F4',
          accent: '#DDEBE3',
          border: '#E4EAE6',
        },
        charcoal: {
          DEFAULT: '#202923',
          900: '#202923',
          700: '#424D46',
          600: '#65716A',
          500: '#89938D',
          200: '#E4EAE6',
          100: '#F1F7F4',
          50: '#EAF4EF',
        },
        secondary: { DEFAULT: '#075E4B', 400: '#087F65', 500: '#075E4B', 600: '#043D31' },
        accent: { DEFAULT: '#168764', 400: '#168764', 500: '#087F65', 600: '#066B55' },
        night: '#202923',
        card: '#FFFFFF',
        surface: '#FFFFFF',
        frost: '#202923',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(8, 127, 101, 0.2)',
        card: '0 4px 18px rgba(21, 61, 43, 0.08)',
        subtle: '0 2px 8px rgba(21, 61, 43, 0.05)',
      },
      borderRadius: {
        card: '12px',
        button: '8px',
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
