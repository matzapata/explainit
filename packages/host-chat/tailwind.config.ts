import type { Config } from 'tailwindcss';

const brand = {
  50: '#F9F5FF',
  100: '#F4EBFF',
  200: '#E9D7FE',
  300: '#D6BBFB',
  400: '#B692F6',
  500: '#9E77ED',
  600: '#7F56D9',
  700: '#6941C6',
  800: '#53389E',
  900: '#42307D',
};
const gray = {
  25: '#FCFCFC',
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D1D1D6',
  400: '#A0A0AB',
  500: '#70707B',
  600: '#51525C',
  700: '#3F3F46',
  800: '#26272B',
  900: '#18181B',
  950: '#131316',
};

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray,
        brand,
        background: gray['950'],
        foreground: 'white',
        card: gray['950'],
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: gray['950'],
        'popover-foreground': 'white',
        primary: brand['700'],
        'primary-foreground': 'white',
        secondary: gray['800'],
        'secondary-foreground': 'white',
        muted: gray['800'],
        'muted-foreground': gray['300'],
        accent: gray['800'],
        'accent-foreground': 'white',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'white',
        border: gray['800'],
        input: gray['800'],
        ring: brand['500'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
