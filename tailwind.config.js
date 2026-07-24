// TailwindCSS 配置文件：设计系统配置（采用 Apple 极简极净风格）
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          text: '#1D1D1F',
          subtext: '#86868B',
          accent: '#0071E3',
          border: '#E5E5EA'
        }
      },
      borderRadius: {
        'apple': '18px',
        'apple-sm': '12px'
      }
    },
  },
  plugins: [],
}