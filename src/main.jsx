import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { SplashScreen } from "@capacitor/splash-screen";

try {
	const rootElement = document.getElementById("root");

	const root = createRoot(rootElement);

	root.render(
		<StrictMode>
			<BrowserRouter>
				<AuthProvider>
					<App />
				</AuthProvider>
			</BrowserRouter>
		</StrictMode>
	);
} catch (error) {
	console.error("❌ main.jsx: Error rendering app:", error);
}

// Remove the loading placeholder after the app is rendered
const loadingPlaceholder = document.getElementById("loading-placeholder");
if (loadingPlaceholder) {
	loadingPlaceholder.remove();
}

// Hide splash screen after app is loaded (for mobile apps)
const hideSplashScreen = async () => {
	try {
		await SplashScreen.hide();
	} catch (error) {
		// Splash screen not available (web environment)
		console.log("Splash screen not available:", error);
	}
};

// Hide splash screen after a short delay to ensure app is fully rendered
setTimeout(hideSplashScreen, 500);

// PWA Service Worker Registration
// Only register in secure contexts (HTTPS or localhost)
if (
	"serviceWorker" in navigator &&
	(location.protocol === "https:" || location.hostname === "localhost")
) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js", { scope: "/" })
			.then(() => {
				// Service worker registered successfully
			})
			.catch(() => {
				// Service worker registration failed - silently fail in development
			});
	});
}
