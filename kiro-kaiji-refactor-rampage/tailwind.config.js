/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kaiju-themed colors
        'kaiju-primary': '#FF6B35',
        'kaiju-secondary': '#004E89',
        'kaiju-accent': '#FFD23F',
        'kaiju-danger': '#E63946',
        'kaiju-success': '#2A9D8F',
        'kaiju-warning': '#F77F00',
      },
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      animation: {
        'kaiju-bounce': 'bounce 1s infinite',
        'kaiju-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}