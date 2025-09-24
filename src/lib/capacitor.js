import { Capacitor } from "@capacitor/core";

// Check if running in native mobile app
export const isNativeMobile = () => {
	return Capacitor.isNativePlatform();
};

// Check if running on iOS
export const isIOS = () => {
	return Capacitor.getPlatform() === "ios";
};

// Check if running on Android
export const isAndroid = () => {
	return Capacitor.getPlatform() === "android";
};

// Check if running in web browser
export const isWeb = () => {
	return Capacitor.getPlatform() === "web";
};

// Get current platform
export const getCurrentPlatform = () => {
	return Capacitor.getPlatform();
};

// Check if app can go back (for navigation)
export const canGoBack = () => {
	return isNativeMobile() && window.history.length > 1;
};
