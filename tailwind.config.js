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
                sans: ['Poppins', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                void: '#111111',
                surface: '#161616',
                neon: '#92DCE5',
                'neon-dark': '#7DCD85',
                'neon-light': '#88D5B5',
                'brand-primary': '#92DCE5',
                'brand-secondary': '#7DCD85',
                'brand-accent-mint': '#88D5B5',
                'brand-soft': '#F3E8EE',
                'brand-base': '#111111',
                'brand-text-primary': '#E6E6E6',
                'brand-text-secondary': '#C7C7C7',
                'brand-text-muted': '#B0B0B0',
                'brand-purple': '#A855F7',
                'brand-pink': '#EC4899',
                'brand-orange': '#F59E0B',
                'brand-green': '#10B981',
                danger: '#FF2A3D',
                safe: '#00FF94',
                subtle: '#222222',
                'cyber-border': 'rgba(146, 220, 229, 0.14)',
                'cyber-card': 'rgba(17, 17, 17, 0.85)',
                'trust-100': '#00F0FF',
                'trust-80': '#00FF94',
                'trust-60': '#FFD700',
                'trust-40': '#FFA500',
                'trust-20': '#FF2A3D',
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, rgba(146, 220, 229, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(146, 220, 229, 0.03) 1px, transparent 1px)",
                'brand-gradient': 'linear-gradient(135deg, rgba(146, 220, 229, 0.3) 0%, rgba(243, 232, 238, 0.1) 100%)',
                'brand-gradient-radial': 'radial-gradient(circle, rgba(146,220,229,0.12) 0%, transparent 70%)',
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
                'neon': '0 0 20px rgba(125, 211, 252, 0.3), 0 0 40px rgba(125, 211, 252, 0.12)',
                'neon-strong': '0 0 30px rgba(125, 211, 252, 0.5), 0 0 60px rgba(125, 211, 252, 0.22)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
        },
    },
    plugins: [],
}
