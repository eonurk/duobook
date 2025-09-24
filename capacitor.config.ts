import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "co.duobook.app",
	appName: "DuoBook",
	webDir: "dist",
	// Commented out for production - uncomment for development
	// server: {
	// 	androidScheme: "https",
	// 	// For production, comment out the url and cleartext lines below
	// 	url: "https://duobook.co",
	// 	cleartext: false,
	// },
	plugins: {
		SplashScreen: {
			launchShowDuration: 2000,
			backgroundColor: "#ba4100",
			androidSplashResourceName: "splash",
			androidScaleType: "CENTER_CROP",
			showSpinner: true,
			spinnerColor: "#ffffff",
			splashFullScreen: true,
			splashImmersive: true,
		},
		StatusBar: {
			style: "LIGHT",
			backgroundColor: "#ba4100",
			overlaysWebView: false,
		},
		Keyboard: {
			resize: "body",
			style: "dark",
			resizeOnFullScreen: true,
		},
		App: {
			clearCallbackId: true,
		},
	},
	android: {
		backgroundColor: "#ba4100",
		allowMixedContent: true,
		captureInput: true,
		webContentsDebuggingEnabled: false,
		buildOptions: {
			keystorePath: undefined,
			keystoreAlias: undefined,
			releaseType: "AAB",
		},
	},
	ios: {
		contentInset: "automatic",
		limitsNavigationsToAppBoundDomains: false,
		preferredContentMode: "mobile",
	},
};

export default config;
