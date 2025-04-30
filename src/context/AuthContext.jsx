import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebaseConfig';
// Import API functions for progress and achievements
import { getGamificationData } from '../lib/api';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const [userProgress, setUserProgress] = useState(null); // Store progress from API
  const [userAchievements, setUserAchievements] = useState([]); // Store achievements from API

  // Function to fetch user progress and achievements from API
  const fetchApiGamificationData = async (user) => {
    if (!user) return { progress: null, achievements: [] };
    try {
        console.log("Fetching gamification data from API...");
        const data = await getGamificationData(); // Calls API endpoints
        console.log("Received gamification data.");
        setUserProgress(data.progress);
        setUserAchievements(data.achievements || []); // Ensure achievements is always an array
        return data;
    } catch (error) {
        console.error("Error fetching gamification data from API:", error);
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
        // Fetch user progress & achievements from API
        await fetchApiGamificationData(user);

      } else {
        setUserProgress(null);
        setUserAchievements([]);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Value provided to context consumers
  const value = {
    currentUser,
    loading,
    userProgress,
    userAchievements, // Provide achievements
    fetchApiGamificationData // Expose API fetch function if needed elsewhere
  };

  // Render children only when not loading to avoid rendering protected components prematurely
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 