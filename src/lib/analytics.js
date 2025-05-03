import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseConfig";
import { getCookie } from "./cookies";

/**
 * Utility functions for tracking events with Firebase Analytics
 * Only tracks if user has consented to cookies
 */

// Helper to check if analytics tracking is allowed
const isTrackingAllowed = () => {
	// First check the specific analytics cookie
	const analyticsConsent = getCookie("cookieConsent_analytics");
	if (analyticsConsent !== null) {
		return analyticsConsent === "accepted";
	}

	// Fall back to general consent cookie for backward compatibility
	const generalConsent = getCookie("cookieConsent");
	return generalConsent === "accepted";
};

/**
 * Track a user authentication event
 * @param {string} eventType - 'signup', 'login', or 'logout'
 * @param {string} method - Authentication method used (email, google, etc.)
 */
export const trackAuth = (eventType, method = "email") => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, `user_${eventType}`, {
			auth_method: method,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error(`Failed to track ${eventType} event:`, error);
	}
};

/**
 * Track a story generation event
 * @param {Object} params - Story generation parameters
 */
export const trackStoryGeneration = (params) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "story_generated", {
			source_language: params.source,
			target_language: params.target,
			difficulty: params.difficulty,
			length: params.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track story generation event:", error);
	}
};

/**
 * Track a story viewing event
 * @param {Object} story - Story data
 */
export const trackStoryView = (story) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "story_viewed", {
			story_id: story.id,
			source_language: story.sourceLanguage,
			target_language: story.targetLanguage,
			difficulty: story.difficulty,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track story view event:", error);
	}
};

/**
 * Track when a user practices vocabulary
 * @param {string} language - Language being practiced
 * @param {number} wordCount - Number of words in the practice session
 */
export const trackPractice = (language, wordCount) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "vocabulary_practice", {
			language,
			word_count: wordCount,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track practice event:", error);
	}
};

/**
 * Track a level up event
 * @param {number} newLevel - The level the user reached
 * @param {number} points - User's current points
 */
export const trackLevelUp = (newLevel, points) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "level_up", {
			new_level: newLevel,
			total_points: points,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track level up event:", error);
	}
};

/**
 * Track when a user unlocks an achievement
 * @param {Object} achievement - Achievement data
 */
export const trackAchievement = (achievement) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "achievement_unlocked", {
			achievement_id: achievement.id,
			achievement_name: achievement.name,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track achievement event:", error);
	}
};

/**
 * Track when a user completes a daily challenge
 * @param {string} challengeType - Type of challenge completed
 */
export const trackChallengeCompleted = (challengeType) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "challenge_completed", {
			challenge_type: challengeType,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track challenge completion event:", error);
	}
};

/**
 * Track when the daily limit is reached
 */
export const trackDailyLimitReached = () => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "daily_limit_reached", {
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track daily limit event:", error);
	}
};

/**
 * Track when a user visits a page
 * @param {string} pageName - Name of the page
 */
export const trackPageView = (pageName) => {
	if (!analytics || !isTrackingAllowed()) return;

	try {
		logEvent(analytics, "page_view", {
			page_name: pageName,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to track page view event:", error);
	}
};

// Listen for cookie consent acceptance to initialize analytics
if (typeof window !== "undefined") {
	window.addEventListener("cookieConsentAccepted", () => {
		// Track that user accepted cookies
		if (analytics && isTrackingAllowed()) {
			try {
				logEvent(analytics, "cookie_consent_accepted", {
					timestamp: new Date().toISOString(),
				});
				// Track the current page view now that we have consent
				const currentPath = window.location.pathname;
				const pageName =
					currentPath === "/"
						? "home"
						: currentPath.substring(1).replace(/\//g, "-");
				trackPageView(pageName);
			} catch (error) {
				console.error("Failed to track cookie consent event:", error);
			}
		}
	});
}
