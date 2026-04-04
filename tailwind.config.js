/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Material Design 3 dark theme tokens (from demo.html)
        'surface-container':        '#221e26',
        'surface-dim':              '#16121a',
        'on-primary-container':     '#00285d',
        'primary':                  '#adc6ff',
        'on-secondary':             '#432c00',
        'secondary':                '#ffd799',
        'tertiary':                 '#ffb690',
        'outline':                  '#8c909f',
        'on-surface':               '#e9dfec',
        'surface-container-lowest': '#110d15',
        'surface-container-high':   '#2d2831',
        'surface-variant':          '#38333c',
        'surface':                  '#16121a',
        'md-error':                 '#ffb4ab',
        'on-primary':               '#002e6a',
        'on-surface-variant':       '#c2c6d6',
        'outline-variant':          '#424754',
        'secondary-container':      '#feb300',
        'primary-container':        '#4d8eff',
        'on-tertiary':              '#552100',
      },
      fontFamily: {
        headline: ['"Space Grotesk"', 'sans-serif'],
        body:     ['Manrope', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
