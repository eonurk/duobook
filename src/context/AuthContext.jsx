import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from '../firebaseConfig'; // Add db import
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Add Firestore imports

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
  const [userProgress, setUserProgress] = useState(null);
  const [firestoreInitialized, setFirestoreInitialized] = useState(false);

  // Function to update streak
  const updateStreak = async (user) => {
    if (!user || !firestoreInitialized) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      let userData = {};
      if (userDoc.exists()) {
        userData = userDoc.data();
      }
      
      const lastLogin = userData.lastLogin?.toDate().toISOString().split('T')[0];
      
      let currentStreak = userData.streak || 0;
      const daysSinceLastLogin = lastLogin ? 
        Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24)) : null;
      
      // First login or more than 1 day since last login - reset streak
      if (lastLogin === undefined || daysSinceLastLogin > 1) {
        currentStreak = 1;
      } 
      // Login on a different day than last login and within 1 day - increase streak
      else if (lastLogin !== today && daysSinceLastLogin <= 1) {
        currentStreak += 1;
      }
      // Same day login - keep streak the same
      
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        streak: currentStreak
      }).catch(() => {
        // If document doesn't exist yet, create it
        setDoc(userRef, {
          lastLogin: serverTimestamp(),
          streak: 1,
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          createdAt: serverTimestamp()
        });
      });
      
      return currentStreak;
    } catch (error) {
      console.error("Error updating streak:", error);
      return 0;
    }
  };

  // Function to fetch user progress
  const fetchUserProgress = async (user) => {
    if (!user || !firestoreInitialized) return null;
    
    try {
      const progressRef = doc(db, 'userProgress', user.uid);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        return progressDoc.data();
      } else {
        // Initialize progress document if it doesn't exist
        const initialProgress = {
          sentencesRead: 0,
          storiesCompleted: 0,
          vocabularyLearned: 0,
          achievements: [],
          xpPoints: 0,
          level: 1,
          streak: 0,
          storiesProgress: {},
          lastActivity: serverTimestamp(),
          challenges: {
            dailyChallenges: [],
            completedChallenges: []
          }
        };
        
        await setDoc(progressRef, initialProgress);
        return initialProgress;
      }
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return null;
    }
  };

  useEffect(() => {
    // Check if Firestore is initialized
    const checkFirestore = async () => {
      try {
        // Simple test to check if Firestore connection is working
        const testRef = doc(db, '_test_connection', 'test');
        await getDoc(testRef);
        console.log('Firestore initialized successfully');
        setFirestoreInitialized(true);
      } catch (error) {
        console.error('Error initializing Firestore:', error);
        // Try again in 2 seconds if there's an error
        setTimeout(checkFirestore, 2000);
      }
    };
    
    checkFirestore();
  }, []);

  useEffect(() => {
    // Subscribe to user changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user && firestoreInitialized) {
        // Update streak when user logs in
        await updateStreak(user);
        
        // Fetch user progress
        const progress = await fetchUserProgress(user);
        setUserProgress(progress);
      } else {
        setUserProgress(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [firestoreInitialized]); // Add firestoreInitialized as a dependency

  // Value provided to context consumers
  const value = {
    currentUser,
    loading,
    userProgress,
    updateStreak,
    fetchUserProgress
  };

  // Render children only when not loading to avoid rendering protected components prematurely
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 