import flowbitePlugin from 'flowbite/plugin';
/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],

	plugins: [flowbitePlugin],

	// darkMode: 'class',

	theme: {
		extend: {
			screens: {
				sm: '',
				xs: ''
			},
				fontSize: {},
				fontFamily: {
					sans: [
						'Inter',
						'-apple-system',
						'BlinkMacSystemFont',
						'PingFang SC',
						'Hiragino Sans GB',
						'Noto Sans SC',
						'Noto Sans CJK SC',
						'Source Han Sans SC',
						'Microsoft YaHei',
						'sans-serif'
					],
					mono: [
						'SFMono-Regular',
						'SF Mono',
						'Menlo',
						'Consolas',
						'Monaco',
						'PingFang SC',
						'Noto Sans SC',
						'Noto Sans Mono CJK SC',
						'Source Han Mono SC',
						'monospace'
					],
					serif: [
						'Source Han Serif SC',
						'Songti SC',
						'Noto Serif CJK SC',
						'Georgia',
						'serif'
					]
				},
			colors: {
				cyan: {
					50: '#ecfeff',
					100: '#cffafe',
					200: '#a5f3fc',
					300: '#67e8f9',
					400: '#22d3ee',
					500: '#06b6d4',
					600: '#0891b2',
					700: '#0e7490',
					800: '#155e75',
					900: '#164e63',
					950: '#083344'
				}
			}
		}
	}
};
