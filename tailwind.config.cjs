/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101820',
        paper: '#f7f5ef',
        coral: '#ff6b52',
        'coral-dark': '#e2553d',
        mint: '#a8e6cf',
        lavender: '#d9d2ff',
        'line-light': '#e5e1d8',
      },
      boxShadow: {
        card: '0 12px 32px rgba(16, 24, 32, 0.07)',
      },
    },
  },
  plugins: [],
};
