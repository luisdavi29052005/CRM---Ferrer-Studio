/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                olive: {
                    500: '#84cc16', // Lighter olive for accents
                    900: '#365314', // Deep olive
                },
                bronze: {
                    400: '#fbbf24', // Gold/Bronze highlight
                    500: '#d97706', // Base Bronze
                    600: '#b45309',
                    900: '#451a03',
                }
            },
            animation: {
                'gradient-slow': 'gradient 15s ease infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                }
            }
        }
    },
    plugins: [],
}
