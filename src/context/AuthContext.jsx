import React, { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
// Import API functions for progress and achievements
import { getGamificationData, updateUserProgress } from "../lib/api";

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
	return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState(null);
	const [idToken, setIdToken] = useState(null); // ADDED: State for ID token string
	const [loading, setLoading] = useState(true); // Track loading state
	const [userProgress, setUserProgress] = useState(null); // Store progress from API
	const [userAchievements, setUserAchievements] = useState([]); // Store achievements from API

	// Function to fetch user progress and achievements from API
	const fetchApiGamificationData = async (user) => {
		if (!user) return { progress: null, achievements: [] };
		try {
			console.log("AuthContext: Fetching gamification data from API...");
			const data = await getGamificationData(); // Calls API endpoints
			console.log("AuthContext: Received gamification data.");
			setUserProgress(data.progress);
			setUserAchievements(data.achievements || []); // Ensure achievements is always an array
			return data;
		} catch (error) {
			console.error(
				"AuthContext: Error fetching gamification data from API:",
				error
			);
			setUserProgress(null);
			setUserAchievements([]);
			return { progress: null, achievements: [] };
		}
	};

	useEffect(() => {
		// Subscribe to user changes
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			setCurrentUser(user);

			if (user) {
				try {
					const token = await user.getIdToken();
					setIdToken(token);
					console.log("AuthContext: ID Token set."); // You can log the token for debugging if needed but avoid in production
					// Fetch user progress & achievements from API
					await fetchApiGamificationData(user); // Pass user here
				} catch (error) {
					console.error("AuthContext: Error getting ID token", error);
					setIdToken(null);
					// Also clear user specific data if token fails
					setUserProgress(null);
					setUserAchievements([]);
				}
			} else {
				setIdToken(null);
				setUserProgress(null);
				setUserAchievements([]);
			}

			setLoading(false);
		});

		// Cleanup subscription on unmount
		return unsubscribe;
	}, []);

	// Function to update user progress locally and via API
	const updateProgressData = async (updates) => {
		if (!currentUser || !userProgress) {
			console.error(
				"Cannot update progress: no user or initial progress data."
			);
			return; // Or throw error
		}

		const optimisticProgress = { ...userProgress, ...updates };
		setUserProgress(optimisticProgress); // Optimistic update

		try {
			console.log("Sending progress update to API:", updates);
			// Assume updateUserProgress sends a PATCH/PUT request with the updates object
			const updatedProgress = await updateUserProgress(updates);
			setUserProgress(updatedProgress); // Update with response from server if needed
			console.log("Progress updated successfully on server.");
		} catch (error) {
			console.error("Failed to update progress on server:", error);
			// Revert optimistic update on failure?
			// setError("Failed to save progress."); // Optionally surface error
			// For simplicity, we might just leave the optimistic update for now
			// Or re-fetch all data: await fetchApiGamificationData(currentUser);
		}
	};

	// Value provided to context consumers
	const value = {
		currentUser,
		idToken, // ADDED: Provide idToken string
		loading,
		userProgress,
		userAchievements, // Provide achievements
		fetchApiGamificationData, // Expose API fetch function if needed elsewhere
		updateProgressData, // Expose the update function
	};

	// Render children only when not loading to avoid rendering protected components prematurely
	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
}
