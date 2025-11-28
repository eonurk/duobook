import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Get current directory using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
			manifest: {
				name: "DuoBook - Learn Languages with AI-Generated Bilingual Stories",
				short_name: "DuoBook",
				description:
					"DuoBook helps you learn languages through interactive bilingual stories with parallel text. Generate custom stories in any language pair, with interactive translations and vocabulary tracking.",
				theme_color: "#ba4100",
				background_color: "#ffffff",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "logo.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "logo.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "logo.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,mp3}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
						handler: "NetworkFirst",
						options: {
							cacheName: "openai-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "gstatic-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: "0.0.0.0", // Allow external connections
		proxy: {
			"/api": {
				target: "http://127.0.0.1:3000",
				changeOrigin: false,
				secure: false,
				ws: true,
				timeout: 120000, // 2 minutes timeout for large story generation responses
				proxyTimeout: 120000,
			},
		},
	},
});
