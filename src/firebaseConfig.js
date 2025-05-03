import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// Remove Firestore imports
// import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: Use environment variables for security
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Uncommented for Analytics
};

// Check if all required Firebase config values are available
const validateFirebaseConfig = () => {
	const requiredFields = [
		"apiKey",
		"authDomain",
		"projectId",
		"storageBucket",
		"messagingSenderId",
		"appId",
	];

	const missingFields = requiredFields.filter(
		(field) =>
			!firebaseConfig[field] || firebaseConfig[field].includes("undefined")
	);

	if (missingFields.length > 0) {
		console.error(
			`Missing Firebase configuration values: ${missingFields.join(", ")}`
		);
		console.error(
			"Make sure your .env file contains all necessary VITE_FIREBASE_* variables"
		);
		return false;
	}

	return true;
};

// Remove db from declaration
let app, auth, analytics;
// Create a Google auth provider
let googleProvider;

if (validateFirebaseConfig()) {
	try {
		console.log("Initializing Firebase app...");
		app = initializeApp(firebaseConfig);

		console.log("Initializing Firebase Auth...");
		auth = getAuth(app);

		// Initialize Google Auth Provider
		googleProvider = new GoogleAuthProvider();
		// Add scopes if needed
		googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email");
		googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");

		// Initialize Firebase Analytics
		if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
			console.log("Initializing Firebase Analytics...");
			analytics = getAnalytics(app);
		}

		// Remove Firestore initialization
		// console.log("Initializing Firestore...");
		// db = getFirestore(app);

		// Remove Firestore persistence logic
		// // Enable offline persistence (optional)
		// enableIndexedDbPersistence(db)
		// 	.then(() => {
		// 		console.log("Firestore offline persistence enabled");
		// 	})
		// 	.catch((err) => {
		// 		if (err.code === "failed-precondition") {
		// 			console.warn(
		// 				"Multiple tabs open, persistence can only be enabled in one tab at a time."
		// 			);
		// 		} else if (err.code === "unimplemented") {
		// 			console.warn(
		// 				"The current browser does not support offline persistence"
		// 			);
		// 		}
		// 	});

		console.log("Firebase App, Auth & Analytics initialized successfully");
	} catch (error) {
		console.error("Error initializing Firebase App/Auth/Analytics:", error);
	}
} else {
	console.error("Firebase initialization skipped due to missing configuration");
}

// Export analytics along with auth and app
export { auth, app, analytics, googleProvider };
// export { auth, db, app };
export default app;
