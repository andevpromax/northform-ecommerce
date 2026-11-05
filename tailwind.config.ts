import type { Config } from 'tailwindcss'
export default {
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			screens: {
				'max-768': { max: '767px' },
				'768': '768px',
				'1280': '1280px',
			},
			colors: {
				brand: {
					100: '#e0eee9',
					300: '#9bc8b8',
					500: '#357a65',
					600: '#26634f',
					800: '#193d33',
					900: '#102c24',
				},
				base: {
					white: '#ffffff',
					black: '#182c25',
					transparent: 'transparent',
				},
			},
			borderRadius: { '1': '0.25rem', '2': '0.5rem' },
		},
	},
	plugins: [],
} satisfies Config
