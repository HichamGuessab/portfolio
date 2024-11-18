/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        wildSand: '#F5F5F5',
        lightBlue: '#53DCFD',
        nightBlue: '#0D1953',
        darkBlue: '#040D39',
        purple: '#A88CFF',
      },
      fontFamily: {
        vremena: ['"Vremena Grotesk"', 'sans-serif'],
        analogue: ['"Analogue Reduced"', 'serif'],
      },
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        bold: '700',
      },
    },
  },
  plugins: [],
};
