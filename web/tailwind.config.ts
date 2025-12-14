import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Main App Backgrounds
                canvas: {
                    bg: '#181625',
                    grid: '#45415E',
                },
                // Node Colors
                node: {
                    bg: '#232034',
                    border: '#3E3B5E',
                    'border-active': 'rgba(139, 92, 246, 0.5)', // violet-500/50
                    'bg-active': 'rgba(35, 32, 52, 0.95)', // #232034 / 95%
                    'border-hover': '#565275',
                    header: '#5B5680', // Also used for labels
                    text: '#E2E0EC',
                    dim: '#948FB2',
                },
                // Brand / Accents
                brand: {
                    primary: '#8b5cf6', // violet-500
                    secondary: '#5B5680',
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
