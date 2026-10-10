/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Static named role colors (used for opacity variants like bg-patient/10)
        patient: '#0D9488',
        doctor: '#7C3AED',
        admin: '#2563EB',
        pharmacy: '#C026D3',
        lab: '#EA580C',

        // App palette
        mainBg: '#F0F4F8',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        borderLight: '#E2E8F0',

        statusSuccess: '#10B981',
        statusPending: '#F59E0B',
        statusCritical: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
