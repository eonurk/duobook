import { auth } from "../firebaseConfig";
// Base URL for your backend API
// Ensure this matches where your server is running (e.g., http://localhost:3000)
// You might want to use environment variables for this in a real app
const API_BASE_URL = "/api"; // Using relative path assuming Vite proxy or same origin
/**
 * Makes an authenticated request to the backend API.
 * Automatically adds the Firebase ID token to the Authorization header.
 *
 * @param {string} endpoint - The API endpoint path (e.g., '/stories').
 * @param {object} options - Fetch options (method, body, headers, etc.).
 * @returns {Promise<any>} - The JSON response from the API.
 * @throws {Error} - Throws an error if the user is not authenticated or the fetch fails.
 */
const authenticatedFetch = async (endpoint, options = {}) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated.");
    }
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json", // Default to JSON content type
                ...options.headers, // Allow overriding headers
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            // Attempt to parse error message from backend if available
            let errorData;
            try {
                errorData = await response.json();
            }
            catch {
                // Ignore if response is not JSON (remove unused 'e' variable)
            }
            const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
            const error = new Error(errorMessage);
            error.status = response.status; // Attach status code to error
            throw error;
        }
        // Handle cases with no content (like DELETE 204)
        if (response.status === 204) {
            return null; // Or return an indication of success, e.g., { success: true }
        }
        // Assume response is JSON for other successful statuses
        return response.json();
    }
    catch (error) {
        console.error(`API call failed: ${options.method || "GET"} ${endpoint}`, error);
        // Re-throw the error to be handled by the caller
        throw error;
    }
};
// --- API Function Examples ---
// Stories
export const getStories = () => authenticatedFetch("/stories");
export const createStory = (storyData) => authenticatedFetch("/stories", {
    method: "POST",
    body: JSON.stringify(storyData), // e.g., { story: "..." }
});
export const deleteStory = (storyId) => authenticatedFetch(`/stories/${storyId}`, {
    method: "DELETE",
});
// Story Generation Proxy
export const generateStoryViaBackend = (generationParams) => authenticatedFetch("/generate-story", {
    method: "POST",
    body: JSON.stringify(generationParams), // e.g., { description, sourceLanguage, targetLanguage, difficulty, length }
});
// Progress
export const getUserProgress = () => authenticatedFetch("/progress");
export const updateUserProgress = (progressData) => authenticatedFetch("/progress", {
    method: "PUT",
    body: JSON.stringify(progressData), // e.g., { pointsToAdd: 10 } or { level: 5 }
});
// Achievements
export const getAllAchievements = () => authenticatedFetch("/achievements");
export const getUserAchievements = () => authenticatedFetch("/user/achievements");
// Challenges
export const getChallengeDefinitions = () => authenticatedFetch("/challenges");
export const getUserDailyChallenges = () => authenticatedFetch("/user/daily-challenges");
export const postChallengeProgress = (progressData) => authenticatedFetch("/user/challenges/progress", {
    method: "POST",
    body: JSON.stringify(progressData), // e.g., { challengeType: "LEARN_WORDS", incrementAmount: 1 }
});
// Gamification Data Bundle (optional, but might be useful)
export const getGamificationData = async () => {
    try {
        // Fetch progress, achievements, and daily challenges in parallel
        const [progress, achievements, dailyChallenges] = await Promise.all([
            getUserProgress(),
            getUserAchievements(),
            getUserDailyChallenges(), // Add call to fetch daily challenges
        ]);
        return { progress, achievements, dailyChallenges };
    }
    catch (error) {
        console.error("Error fetching gamification data:", error);
        // Return default/empty state or re-throw
        return { progress: null, achievements: [], dailyChallenges: [] };
    }
};
