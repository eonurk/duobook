/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "oklch(var(--background))",
				foreground: "oklch(var(--foreground))",
				popover: "oklch(var(--popover))",
				"popover-foreground": "oklch(var(--popover-foreground))",
				primary: "oklch(var(--primary))",
				"primary-foreground": "oklch(var(--primary-foreground))",
				secondary: "oklch(var(--secondary))",
				"secondary-foreground": "oklch(var(--secondary-foreground))",
				muted: "oklch(var(--muted))",
				"muted-foreground": "oklch(var(--muted-foreground))",
				accent: "oklch(var(--accent))",
				"accent-foreground": "oklch(var(--accent-foreground))",
				destructive: "oklch(var(--destructive))",
				"destructive-foreground": "oklch(var(--destructive-foreground))",
				border: "oklch(var(--border))",
				input: "oklch(var(--input))",
				ring: "oklch(var(--ring))",
			},
			fontFamily: {
				sans: ['"Inter"', "sans-serif"],
				heading: ['"Poppins"', "cursive"],
			},
		},
	},
	plugins: [],
};
