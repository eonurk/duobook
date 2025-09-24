import { auth } from "../firebaseConfig";
import { Capacitor } from "@capacitor/core";

// Latest version of the API
// Base URL for your backend API
// For web development: uses relative path "/api" (works with Vite proxy) unless VITE_API_BASE_URL is set
// For iOS/Android: uses full server URL from environment variable
const getApiBaseUrl = () => {
	const isNative = Capacitor.isNativePlatform();
	const prodUrl = import.meta.env.VITE_API_BASE_URL;

	if (isNative) {
		// For native platforms (iOS/Android), use the production server URL
		// You can set VITE_API_BASE_URL in your .env file to your production server
		// Example: VITE_API_BASE_URL=https://yourdomain.com/api
		if (!prodUrl) {
			console.error(
				"VITE_API_BASE_URL environment variable is required for native platforms"
			);
			// Fallback to localhost - this won't work but will show clear error
			return "http://localhost:3000/api";
		}

		return prodUrl;
	} else {
		// For web development, use production URL if set, otherwise relative path (works with Vite proxy)
		if (prodUrl) {
			console.log("Using production URL:", prodUrl);
			return prodUrl;
		} else {
			console.log("Using relative path:", "/api");
			return "/api";
		}
	}
};

const API_BASE_URL = getApiBaseUrl();

// API Configuration - Debug logs removed

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
		console.error("User not authenticated");
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
			} catch (parseError) {
				console.error("Error parsing error data:", parseError);
			}

			// Construct the error message, prioritizing backend message
			const errorMessage =
				errorData?.error ||
				errorData?.message ||
				`HTTP error! status: ${response.status}`;
			const error = new Error(errorMessage);
			error.status = response.status; // Attach status code to error
			// Attach the full error data from the response, if available
			if (errorData) {
				error.data = errorData;
			}

			// Special handling for rate limit errors
			if (response.status === 429) {
				console.warn("Rate limit hit:", errorMessage);
				error.isRateLimit = true; // Add special flag for rate limit errors
			}

			throw error; // Throw the error with status and potentially specific message
		}

		// Handle cases with no content (like DELETE 204)
		if (response.status === 204) {
			return null; // Or return an indication of success, e.g., { success: true }
		}

		// Assume response is JSON for other successful statuses
		const result = await response.json();

		return result;
	} catch (error) {
		console.error(
			`API call failed: ${options.method || "GET"} ${endpoint}`,
			error
		);
		console.error("Error details:", {
			message: error.message,
			name: error.name,
			stack: error.stack,
		});
		// Re-throw the error to be handled by the caller
		throw error;
	}
};

// Helper for public GET requests (simplified from authenticatedFetch)
const publicGetFetch = async (endpoint) => {
	// Add debug log to see the full URL being requested
	const fullUrl = `${API_BASE_URL}${endpoint}`;

	try {
		const response = await fetch(fullUrl, {
			method: "GET", // Explicitly GET
			headers: {
				"Content-Type": "application/json", // Expect JSON response
			},
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				// Ignore if response is not JSON
			}
			const errorMessage =
				errorData?.error || `HTTP error! status: ${response.status}`;
			const error = new Error(errorMessage);
			error.status = response.status;
			throw error;
		}

		if (response.status === 204) {
			return null;
		}
		return response.json();
	} catch (error) {
		console.error(`Public API call failed: GET ${endpoint}`, error);
		console.error("Full URL attempted:", fullUrl);
		console.error("Error name:", error.name);
		console.error("Error message:", error.message);
		console.error("Error stack:", error.stack);
		console.error("Network error details:", {
			type: error.constructor.name,
			code: error.code,
			status: error.status,
		});
		throw error; // Re-throw
	}
};

// --- API Function Examples ---

// Stories
export const getStories = () => authenticatedFetch("/stories");

// UPDATED: Function to get a single story by its ID (publicly accessible)
// The endpoint is /api/stories/:shareId - this is a public endpoint that doesn't need authentication
export const getStoryById = (storyId) => {
	// Use publicGetFetch instead of direct fetch to ensure correct URL and error handling
	return publicGetFetch(`/stories/${storyId}`)
		.then((story) => {
			return story;
		})
		.catch((error) => {
			console.error(`Story fetch failed for ID ${storyId}:`, error);
			throw error;
		});
};

export const createStory = (storyData) =>
	authenticatedFetch("/stories", {
		method: "POST",
		body: JSON.stringify(storyData), // e.g., { story: "..." }
	});
export const deleteStory = (storyId) =>
	authenticatedFetch(`/stories/${storyId}`, {
		method: "DELETE",
	});

// Story Generation Proxy
export const generateStoryViaBackend = (generationParams) => {
	return authenticatedFetch("/generate-story", {
		method: "POST",
		body: JSON.stringify(generationParams), // e.g., { description, sourceLanguage, targetLanguage, difficulty, length }
	})
		.then((result) => {
			return result;
		})
		.catch((error) => {
			console.error("Story generation failed:", error);
			console.error("Error details:", {
				message: error.message,
				status: error.status,
				data: error.data,
				stack: error.stack,
			});
			throw error;
		});
};

// Get remaining story generation limit
export const getStoryGenerationLimit = async () => {
	try {
		const result = await authenticatedFetch("/story-limit", {
			method: "GET",
		});
		return result;
	} catch (error) {
		console.error("Error fetching story limit:", error);
		// Return a default object instead of throwing to avoid breaking UI
		return {
			limit: 3,
			remaining: 0,
			isPremium: false,
			subscriptionTier: "FREE",
		};
	}
};

// Progress
export const getUserProgress = () => authenticatedFetch("/progress");
export const updateUserProgress = (progressData) =>
	authenticatedFetch("/progress", {
		method: "PUT",
		body: JSON.stringify(progressData), // e.g., { pointsToAdd: 10 } or { level: 5 }
	});

// Achievements
export const getAllAchievements = () => authenticatedFetch("/achievements");
export const getUserAchievements = () =>
	authenticatedFetch("/user/achievements");

// Challenges
export const getChallengeDefinitions = () => authenticatedFetch("/challenges");
export const getUserDailyChallenges = () =>
	authenticatedFetch("/user/daily-challenges");
export const postChallengeProgress = (progressData) =>
	authenticatedFetch("/user/challenges/progress", {
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
	} catch (error) {
		console.error("Error fetching gamification data:", error);
		// Return default/empty state or re-throw
		return { progress: null, achievements: [], dailyChallenges: [] };
	}
};

// Leaderboard
export const getLeaderboardData = async (period, userId) => {
	// Example: period = 'weekly', 'monthly', 'allTime'
	// userId is optional, to fetch specific rank for the current user if not in top N
	// Construct the endpoint, e.g., /leaderboard/weekly?userId=someUserId
	let endpoint = `/leaderboard/${period}`;
	if (userId) {
		endpoint += `?userId=${userId}`;
	}

	try {
		// Replace with actual authenticatedFetch call when backend is ready
		const data = await authenticatedFetch(endpoint);
		return data;
	} catch (error) {
		console.error(`Error fetching leaderboard data for ${period}:`, error);
		throw error;
	}
};

// Function to get the latest stories from all users
export const getLatestStories = async (
	idToken, // Can be null or undefined for public requests
	page = 1,
	limit = 10,
	excludeCurrentUser = true,
	sourceLanguage = "",
	targetLanguage = "",
	sortBy = "createdAt_desc"
) => {
	// Build the query string conditionally
	const params = new URLSearchParams({
		page: page.toString(),
		limit: limit.toString(),
		excludeCurrentUser: String(excludeCurrentUser),
	});
	if (sourceLanguage) {
		params.append("sourceLanguage", sourceLanguage);
	}
	if (targetLanguage) {
		params.append("targetLanguage", targetLanguage);
	}
	if (sortBy) {
		params.append("sort", sortBy);
	}

	const endpoint = `/stories/latest?${params.toString()}`;

	// Use a different fetcher based on whether the user is logged in
	const fetcher = idToken ? authenticatedFetch : publicGetFetch;

	try {
		// No need to pass the full idToken to publicGetFetch, it doesn't use it
		const data = await fetcher(endpoint);
		return data; // Assuming the backend returns { stories, currentPage, totalPages }
	} catch (error) {
		console.error("Error fetching latest stories:", error);
		// In case of error, return a default structure to prevent UI crashes
		return { stories: [], currentPage: 1, totalPages: 1 };
	}
};

export const likeStory = (storyId) =>
	authenticatedFetch(`/stories/${storyId}/like`, { method: "POST" });

export const unlikeStory = (storyId) =>
	authenticatedFetch(`/stories/${storyId}/unlike`, { method: "DELETE" });

// Vocabulary API
export const getVocabularyForStory = (storyId) =>
	authenticatedFetch(`/stories/${storyId}/vocabulary`);

// Statistics
export const getTotalStoriesCount = () =>
	publicGetFetch("/stats/total-stories");
export const getTotalUsersCount = () => publicGetFetch("/stats/total-users");
