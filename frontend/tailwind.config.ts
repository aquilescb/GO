import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '19': 'repeat(19, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        '19': 'repeat(19, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};

export default config;
