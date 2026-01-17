/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Syne', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                // Brand Colors - Matching Official Website
                void: '#030303',
                surface: '#0A0A0A',
                neon: '#00F0FF',        // Primary cyan brand color
                'neon-dark': '#00B8CC', // Darker cyan
                'neon-light': '#33F3FF', // Lighter cyan

                // Secondary Brand Colors from Website
                'brand-purple': '#A855F7',   // Purple/Magenta (API Platform, Entity Analysis)
                'brand-pink': '#EC4899',     // Pink (Interactive Sandbox, Transaction Simulator)
                'brand-orange': '#F59E0B',   // Orange/Amber (dApp Connection Guard)
                'brand-green': '#10B981',    // Green (Success states, Trust Scoring)

                danger: '#FF2A3D',
                safe: '#00FF94',
                subtle: '#1a1a1a',
                'cyber-border': 'rgba(0, 240, 255, 0.1)',
                'cyber-card': 'rgba(10, 10, 10, 0.85)',

                // Trust Score Colors
                'trust-100': '#00F0FF',  // Excellent - Cyan
                'trust-80': '#00FF94',   // Good - Green
                'trust-60': '#FFD700',   // Medium - Yellow
                'trust-40': '#FFA500',   // Low - Orange
                'trust-20': '#FF2A3D',   // Critical - Red
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.03) 1px, transparent 1px)",
                'brand-gradient': 'linear-gradient(135deg, #00F0FF 0%, #0080FF 100%)',
                'brand-gradient-radial': 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)',
            },
            animation: {
                scanline: 'scanline 8s linear infinite',
                blink: 'blink 1.5s ease-in-out infinite',
                marquee: 'marquee 20s linear infinite',
                glow: 'glow 2s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                scanline: {
                    '0%': { transform: 'translateY(-100%)', opacity: '0' },
                    '50%': { opacity: '0.5' },
                    '100%': { transform: 'translateY(100vh)', opacity: '0' },
                },
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                glow: {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            boxShadow: {
                'neon': '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)',
                'neon-strong': '0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.2)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
        },
    },
    plugins: [],
}
