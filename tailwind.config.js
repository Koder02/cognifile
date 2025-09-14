/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-page': '#F3F4F6',
        'surface': '#FFFFFF',
        'sidebar-dark': '#0F1724',
        'sidebar-soft': '#1E293B',
        'border-subtle': '#E6E9EE',
        'heading': '#111827',
        'text': '#374151',
        'muted': '#6B7280',
        'primary': {
          DEFAULT: '#2563EB',
          700: '#1E40AF'
        },
        'success': '#10B981',
        'danger': '#E11D48',
        'accent': {
          start: '#2F6CE5',
          end: '#6D28D9'
        }
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'md': '0 6px 18px rgba(15, 23, 42, 0.08)',
        'focus': '0 0 0 3px rgba(37,99,235,0.12)'
      }
    },
  },
  plugins: [],
};
