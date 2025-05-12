import React, { useState, useEffect, useRef } from "react";
import {
	Routes,
	Route,
	Navigate,
	useLocation,
	useNavigate,
	Link,
	useParams, // Import useParams
} from "react-router-dom";
import "@/App.css"; // Use alias
import InputForm from "@/components/InputForm"; // Use alias
import BookView from "@/components/BookView"; // Use alias
import { useAuth } from "@/context/AuthContext"; // Use alias
import CookieConsent from "@/components/CookieConsent"; // Import Cookie Consent
import Navbar from "@/components/Layout/Navbar"; // Use alias - Import Navbar
import SiteFooter from "@/components/Layout/SiteFooter"; // Use alias - Import Footer
import UserProfilePage from "@/components/User/UserProfilePage"; // Use alias
import MyStoriesPage from "@/components/User/MyStoriesPage"; // Use alias
import UserProgressDashboard from "@/components/User/UserProgressDashboard"; // Import ProgressDashboard
import Achievements from "@/components/Gamification/Achievements"; // Import Achievements component
import AchievementNotifier from "@/components/Gamification/AchievementNotifier"; // Import AchievementNotifier
import DuoBookExplain from "@/assets/duobook-explain.webp"; // Use alias
import DailyLimitImage from "@/assets/daily-limit.webp"; // Import daily limit image
import PrivacyPolicy from "@/pages/PrivacyPolicy"; // Import PrivacyPolicy
import TermsOfService from "@/pages/TermsOfService"; // Import TermsOfService
import VocabularyPracticePage from "@/pages/VocabularyPracticePage"; // Import Practice Page
import ContactUs from "@/pages/ContactUs"; // Import Contact Us page
import ExploreStoriesPage from "@/pages/ExploreStoriesPage"; // ADDED: Import ExploreStoriesPage
import { ArrowDown, Sparkles, CheckCircle2, Loader2 } from "lucide-react"; // Import ArrowDown icon and new icons
import {
	// getStories, // Commented out: Will be used in MyStoriesPage
	// deleteStory, // Commented out: Will be used in MyStoriesPage
	// getUserProgress, // Commented out: Will be used elsewhere (e.g., AuthContext, UserProgressDashboard)
	// updateUserProgress, // Commented out: Will be used elsewhere
	// getAllAchievements, // Commented out: Will be used elsewhere (e.g., Achievements page)
	// getUserAchievements // Commented out: Will be used elsewhere
	// generateStoryViaBackend, // Removed unused import (now handled within generateStory)
	getLatestStories, // ADDED: Import for fetching latest stories
	createStory,
	generateStoryViaBackend,
	getStoryGenerationLimit, // Ensure getStoryGenerationLimit is imported from the correct path
	getStoryById, // Make sure this is imported for StoryViewPage
} from "./lib/api"; // Import API functions
import toast, { Toaster } from "react-hot-toast"; // Keep Toaster if used
import StoryCard from "@/components/StoryCard"; // ADDED: Import StoryCard

// Static Example Story Data
const exampleStoryData = {
	sentencePairs: [
		{
			id: 1,
			target: "DuoBook te ayuda a aprender idiomas de manera natural.",
			source: "DuoBook helps you learn languages naturally.",
		},
		{
			id: 2,
			target: "Cada historia tiene texto paralelo en dos idiomas.",
			source: "Each story has parallel text in two languages.",
		},
		{
			id: 3,
			target: "Toca una frase para avanzar en la historia.",
			source: "Tap a sentence to progress through the story.",
		},
		{
			id: 4,
			target: "Toca las traducciones borrosas para revelarlas.",
			source: "Tap blurred translations to reveal them.",
		},
		{
			id: 5,
			target:
				"Las palabras subrayadas muestran traducciones al pasar el cursor.",
			source: "Underlined words show translations on hover.",
		},
		{
			id: 6,
			target: "Puedes escuchar la pronunciación con el botón de audio.",
			source: "You can hear pronunciation with the audio button.",
		},
		{
			id: 7,
			target: "¡Crea tu propia historia y comienza a aprender ahora!",
			source: "Create your own story and start learning now!",
		},
	],
	vocabulary: [
		{ word: "manera natural", translation: "naturally" },
		{ word: "texto paralelo", translation: "parallel text" },
		{ word: "avanzar", translation: "to progress" },
		{ word: "revelarlas", translation: "to reveal them" },
		{ word: "subrayadas", translation: "underlined" },
		{ word: "al pasar el cursor", translation: "on hover" },
		{ word: "pronunciación", translation: "pronunciation" },
		{ word: "escuchar", translation: "to hear/listen" },
		{ word: "propia", translation: "own" },
		{ word: "comenzar", translation: "to start" },
	],
	targetLanguage: "Spanish",
	sourceLanguage: "English",
};

// Protected Route Component
function ProtectedRoute({ children }) {
	const { currentUser } = useAuth();
	return currentUser ? children : <Navigate to="/" replace />;
}

// --- New Component for Story View ---
function StoryViewPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { shareId } = useParams(); // Get shareId from URL

	// Try to get initial data from location state (if navigated from creation)
	const initialStoryData = location.state?.storyData;
	const initialParams = location.state?.params;

	const [storyContent, setStoryContent] = useState(null);
	const [paramsForBookView, setParamsForBookView] = useState(initialParams);
	const [isLoading, setIsLoading] = useState(true); // Start with loading true
	const [error, setError] = useState(null);

	useEffect(() => {
		const loadStory = async () => {
			setIsLoading(true);
			setError(null);

			if (initialStoryData && initialStoryData.shareId === shareId) {
				// Story data passed via state and shareId matches URL
				// Process storyData if it's a string (from DB) or use directly
				if (typeof initialStoryData.story === "string") {
					try {
						setStoryContent(JSON.parse(initialStoryData.story));
						// Ensure paramsForBookView is set if not already from initialParams
						if (!initialParams) {
							setParamsForBookView({
								target: initialStoryData.targetLanguage,
								source: initialStoryData.sourceLanguage,
								// Add other relevant params from initialStoryData
							});
						}
					} catch (e) {
						console.error(
							"StoryViewPage: Failed to parse story JSON from state:",
							e
						);
						setError("Failed to load story: Invalid format from state.");
					}
				} else if (initialStoryData.pages || initialStoryData.sentencePairs) {
					setStoryContent(initialStoryData); // Already parsed
					if (!initialParams) {
						setParamsForBookView({
							target: initialStoryData.targetLanguage,
							source: initialStoryData.sourceLanguage,
							// Add other relevant params
						});
					}
				} else {
					console.warn(
						"StoryViewPage: storyData from state structure not recognized."
					);
					setError("Failed to load story: Unrecognized format from state.");
				}
				setIsLoading(false);
			} else if (shareId) {
				// No valid state data, or shareId mismatch, fetch from API using shareId
				console.log(`StoryViewPage: Fetching story with shareId: ${shareId}`);
				try {
					// Assuming getStoryById can take the shareId (string CUID)
					const fetchedStory = await getStoryById(shareId);
					if (fetchedStory && fetchedStory.story) {
						setStoryContent(JSON.parse(fetchedStory.story));
						setParamsForBookView({
							target: fetchedStory.targetLanguage,
							source: fetchedStory.sourceLanguage,
							difficulty: fetchedStory.difficulty,
							length: fetchedStory.length,
							description: fetchedStory.description,
						});
					} else {
						console.warn(
							"StoryViewPage: Story not found or no content from API."
						);
						setError("Story not found.");
					}
				} catch (err) {
					console.error("StoryViewPage: Error fetching story by shareId:", err);
					setError(err.message || "Failed to fetch story.");
				}
				setIsLoading(false);
			} else {
				// No shareId in URL and no state
				console.warn("StoryViewPage: No shareId in URL and no state data.");
				setError("No story specified.");
				setIsLoading(false);
			}
		};

		loadStory();
	}, [shareId, initialStoryData, initialParams]); // Re-run if shareId or initial data changes

	const handleGoBackToForm = () => {
		navigate("/"); // Navigate back to the InputForm page
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader2 className="h-12 w-12 animate-spin text-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col justify-center items-center h-screen text-center">
				<p className="text-red-500 text-xl mb-4">Error: {error}</p>
				<button
					onClick={() => navigate("/")}
					className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
				>
					Go Home
				</button>
			</div>
		);
	}

	if (!storyContent || !paramsForBookView) {
		console.warn(
			"Redirecting to home: StoryViewPage missing valid storyContent or paramsForBookView after loading."
		);
		return <Navigate to="/" replace />;
	}

	return (
		<main className="flex-1 container mx-auto px-4 py-8">
			<BookView
				storyContent={storyContent} // Pass processed story content
				targetLanguage={paramsForBookView.target}
				sourceLanguage={paramsForBookView.source}
				onGoBack={handleGoBackToForm}
				isExample={false}
			/>
		</main>
	);
}
// ----------------------------------

// Premium Plans component for rate limit banner
function PremiumPlansSuggestion({ onClose }) {
	return (
		<div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-6 mb-8">
			<div className="flex justify-between items-start">
				<h2 className="text-xl font-bold text-amber-800 mb-4">
					Upgrade to Premium for Unlimited Stories
				</h2>
				<button
					onClick={onClose}
					className="text-amber-500 hover:text-amber-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div className="grid md:grid-cols-2 gap-6 mt-4">
				<div className="bg-white rounded-lg p-5 shadow-sm border border-amber-100">
					<div className="flex items-center mb-3">
						<Sparkles className="h-5 w-5 text-amber-500 mr-2" />
						<h3 className="font-medium text-lg">Premium</h3>
					</div>
					<ul className="space-y-2 mb-4">
						<li className="flex items-start">
							<CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
							<span>Unlimited story generations</span>
						</li>
						<li className="flex items-start">
							<CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
							<span>Priority support</span>
						</li>
						<li className="flex items-start">
							<CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
							<span>Advanced language exercises</span>
						</li>
					</ul>
					<button
						onClick={() => (window.location.href = "/profile")}
						className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md hover:from-amber-600 hover:to-orange-600 transition-all"
					>
						Upgrade Now
					</button>
				</div>

				<div className="bg-white rounded-lg p-5 shadow-sm border border-amber-100">
					<div className="flex items-center mb-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-purple-500 mr-2"
						>
							<path d="M12 2l3 7h7l-6 4 3 7-7-4-7 4 3-7-6-4h7z"></path>
						</svg>
						<h3 className="font-medium text-lg">Pro</h3>
					</div>
					<ul className="space-y-2 mb-4">
						<li className="flex items-start">
							<CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
							<span>All Premium features</span>
						</li>
						<li className="flex items-start">
							<CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
							<span>Custom vocabulary training</span>
						</li>
						<li className="flex items-start">
							<CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
							<span>Text-to-speech for all stories</span>
						</li>
					</ul>
					<button
						onClick={() => (window.location.href = "/profile")}
						className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md hover:from-purple-600 hover:to-indigo-600 transition-all"
					>
						Get Pro
					</button>
				</div>
			</div>

			<p className="text-sm text-amber-700 mt-4 text-center">
				Upgrade today and boost your language learning journey!
			</p>
		</div>
	);
}

// Component for the logged-in main view (story generation)
function MainAppView({ generateStory }) {
	const [isGenerating, setIsGenerating] = useState(false);
	const [formError, setFormError] = useState(null);
	const [formParams, setFormParams] = useState(null);
	const { idToken, userProgress } = useAuth(); // Get idToken and userProgress

	// Determine user subscription tier
	const userSubscriptionTier = userProgress?.subscriptionTier || "FREE";

	// State for latest community stories
	const [latestCommunityStories, setLatestCommunityStories] = useState([]);
	const [loadingCommunityStories, setLoadingCommunityStories] = useState(false);
	const [communityStoriesError, setCommunityStoriesError] = useState(null);

	useEffect(() => {
		// Fetch community stories regardless of login state, but use idToken if available
		// The getLatestStories function in api.js is already modified to handle nullable idToken
		const fetchCommunityStories = async () => {
			setLoadingCommunityStories(true);
			setCommunityStoriesError(null);
			try {
				// Pass idToken (which can be null) to getLatestStories
				const data = await getLatestStories(idToken, 1, 3, true);
				setLatestCommunityStories(data.stories || []);
			} catch (err) {
				console.error("Error fetching community stories for main page:", err);
				setCommunityStoriesError(
					err.message || "Could not load community stories."
				);
			}
			setLoadingCommunityStories(false);
		};
		fetchCommunityStories();
	}, [idToken]); // Depend on idToken so it re-fetches if user logs in/out

	const handleGenerate = async (
		description,
		sourceLang,
		targetLang,
		difficulty,
		storyLength
	) => {
		setIsGenerating(true);
		setFormError(null);
		setFormParams({
			description,
			source: sourceLang,
			target: targetLang,
			difficulty,
			length: storyLength,
		});
		try {
			// Call the generateStory function passed from App
			await generateStory(
				description,
				sourceLang,
				targetLang,
				difficulty,
				storyLength,
				setFormError // Pass setFormError to allow App to update it directly
			);
			// If generateStory succeeds without error, we might still want to stop the spinner
			// depending on navigation timing. However, the finally block handles this.
		} catch (error) {
			// This catches errors *re-thrown* from App.jsx's generateStory
			console.error(
				"Error during generation or saving (caught in MainAppView):",
				error
			);
			setFormError(
				error.message || "Failed to generate story. Please try again."
			);
			// No need to set isGenerating false here, finally block handles it.
		} finally {
			// This block will ALWAYS execute after try or catch
			setIsGenerating(false);
		}
	};

	return (
		<>
			{formError && (
				<div
					className={`mb-6 rounded-lg ${
						formError.type === "rateLimit" // Changed from formError.isRateLimit
							? "bg-amber-50 border border-amber-100"
							: "bg-red-50 text-red-800 dark:bg-gray-800 dark:text-red-400"
					}`}
					role="alert"
				>
					<div className="flex">
						{formError.type === "rateLimit" ? ( // Changed from formError.isRateLimit
							<div className="w-full">
								<div className="flex justify-center p-4 pb-0">
									<img
										src={DailyLimitImage}
										alt="Daily limit reached"
										className="h-40 w-auto mx-auto"
									/>
								</div>
								<div className="p-4 pt-2 text-center">
									<div className="text-sm text-amber-700">
										<p className="mb-4">{formError.message}</p>
										<p className="mt-2 font-bold text-amber-800 flex items-center justify-center gap-2">
											Premium subscriptions with unlimited story generation are
											coming soon!{" "}
										</p>
									</div>
								</div>
							</div>
						) : (
							<div className="p-4">
								<strong>Error:</strong>{" "}
								{typeof formError === "string"
									? formError
									: "Failed to generate story. Please try again."}
							</div>
						)}
					</div>
				</div>
			)}
			<main className="flex-1 container mx-auto px-4 py-8">
				{!isGenerating && (
					<>
						<h1 className="text-2xl font-semibold text-center mb-2">DuoBook</h1>
						<p className="text-center text-muted-foreground mb-4">
							Generate bilingual stories to learn any language
						</p>
						<InputForm
							onSubmit={handleGenerate}
							isLoading={isGenerating}
							userSubscriptionTier={userSubscriptionTier}
						/>
					</>
				)}

				{isGenerating && (
					<div className="loading-indicator flex items-center justify-center flex-col text-center p-8">
						<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
						Generating your{" "}
						{formParams?.length === "very_long_pro"
							? "Very Long (Pro)"
							: formParams?.length}{" "}
						{formParams?.difficulty} story in {formParams?.target} /{" "}
						{formParams?.source}... Please wait.
					</div>
				)}

				{!isGenerating && (
					<div className="mt-12 pt-8 border-t">
						<h2 className="text-2xl font-bold text-center mb-8">
							How DuoBook Works
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
							{/* Element 1: Generate */}
							<div className="flex flex-col items-center text-center p-4">
								<div className="bg-blue-100 p-3 rounded-full mb-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-blue-600"
									>
										<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold mb-2">1. Generate</h3>
								<p className="text-sm text-muted-foreground">
									Create custom bilingual stories about any topic in your target
									language
								</p>
							</div>

							{/* Element 2: Read */}
							<div className="flex flex-col items-center text-center p-4">
								<div className="bg-green-100 p-3 rounded-full mb-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-green-600"
									>
										<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
										<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold mb-2">2. Read</h3>
								<p className="text-sm text-muted-foreground">
									Enjoy parallel text with interactive translations and
									vocabulary assistance
								</p>
							</div>

							{/* Element 3: Learn */}
							<div className="flex flex-col items-center text-center p-4">
								<div className="bg-amber-100 p-3 rounded-full mb-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-amber-600"
									>
										<path d="M12 22V8" />
										<path d="m20 12-8-4-8 4" />
										<path d="m20 18-8-4-8 4" />
										<path d="m20 6-8-4-8 4" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold mb-2">3. Learn</h3>
								<p className="text-sm text-muted-foreground">
									Build vocabulary and comprehension through context and
									practice
								</p>
							</div>
						</div>

						<div className="flex justify-center mb-8">
							<img
								src={DuoBookExplain}
								alt="DuoBook Interface Example"
								className="max-w-full md:max-w-lg h-auto rounded-lg border"
							/>
						</div>

						<div className="text-center mb-6">
							<p className="text-base font-medium mb-2">
								Try this interactive example
							</p>
							<ArrowDown
								className="h-6 w-6 mx-auto text-muted-foreground"
								aria-hidden="true"
							/>
						</div>

						<BookView
							storyContent={exampleStoryData}
							targetLanguage={exampleStoryData.targetLanguage}
							sourceLanguage={exampleStoryData.sourceLanguage}
							isExample={true}
							onGoBack={() => {}}
						/>
					</div>
				)}

				{/* ADDED: Latest Community Stories Section */}
				{!isGenerating &&
					(latestCommunityStories.length > 0 ||
						loadingCommunityStories ||
						communityStoriesError) && (
						<div className="mt-12 pt-8 border-t">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-2xl font-bold">Latest Community Stories</h2>
							</div>
							{loadingCommunityStories && (
								<div className="text-center py-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
									<p className="mt-2 text-sm text-gray-500">
										Loading community stories...
									</p>
								</div>
							)}
							{communityStoriesError && (
								<p className="text-center text-red-500 text-sm py-4">
									Error: {communityStoriesError}
								</p>
							)}
							{!loadingCommunityStories &&
								!communityStoriesError &&
								latestCommunityStories.length > 0 && (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{latestCommunityStories.map((story) => (
											<StoryCard key={story.id} story={story} />
										))}
										<Link
											to="/explore-stories"
											className="text-sm text-orange-600 hover:underline mt-2 ml-2"
										>
											Explore All &rarr;
										</Link>
									</div>
								)}
							{!loadingCommunityStories &&
								!communityStoriesError &&
								latestCommunityStories.length === 0 && (
									<p className="text-center text-gray-500 text-sm py-4">
										No community stories to show right now. Check back later!
									</p>
								)}
						</div>
					)}
			</main>
		</>
	);
}

function App() {
	const { loading, currentUser } = useAuth();
	const [firebaseError] = useState(false);
	const navigate = useNavigate();
	const navbarRef = useRef(null);

	// Optional: Firebase init check (if auth might not be ready)
	// useEffect(() => {
	// 	if (!auth) { // If auth import is needed
	// 		console.error("Firebase Authentication is not initialized");
	// 	}
	// }, []);

	// Optional: Page view tracking
	// useEffect(() => {
	// 	const pageName = location.pathname === "/" ? "home" : location.pathname.substring(1).replace(/\//g, "-");
	// 	trackPageView(pageName); // Requires import
	// }, [location]);

	// generateStory function defined within App
	const generateStory = async (
		description,
		sourceLang,
		targetLang,
		difficulty,
		storyLength,
		setFormError // Accept the setter function
	) => {
		// No need to call useAuth here, currentUser is available from App scope
		if (!currentUser) {
			toast.error("Login Required", {
				description: "You must be logged in to generate stories.",
			});
			return;
		}

		const params = {
			description,
			source: sourceLang,
			target: targetLang,
			difficulty,
			length: storyLength,
		};

		try {
			const limitData = await getStoryGenerationLimit();

			if (!limitData.isPremium && limitData.remaining <= 0) {
				if (setFormError) {
					setFormError({
						type: "rateLimit", // Reusing existing type for UI consistency
						message:
							"You've reached your daily story generation limit for the free tier. Please upgrade or try again tomorrow.",
					});
				}
				return; // Stop execution before calling the generation API
			}

			// Use imported function directly
			const generatedStoryContent = await generateStoryViaBackend(params);

			// Validation logic (unchanged)
			const isProStory = params.length === "very_long_pro";
			if (!generatedStoryContent) {
				throw new Error("No story data received from backend.");
			}
			if (isProStory) {
				if (
					!generatedStoryContent.pages ||
					!Array.isArray(generatedStoryContent.pages)
				) {
					throw new Error(
						"Invalid paginated story data received from backend (missing 'pages' array)."
					);
				}
			} else {
				if (
					!generatedStoryContent.sentencePairs ||
					!generatedStoryContent.vocabulary
				) {
					throw new Error(
						"Invalid standard story data received from backend (missing 'sentencePairs' or 'vocabulary')."
					);
				}
			}

			console.log("Saving generated story to database...");
			// Use imported function directly
			const savedStory = await createStory({
				story: JSON.stringify(generatedStoryContent),
				description: description,
				sourceLanguage: sourceLang,
				targetLanguage: targetLang,
				difficulty: difficulty,
				length: storyLength,
			});

			// Refresh navbar limit
			if (navbarRef.current) {
				navbarRef.current.refreshStoryLimit();
			}

			// Navigation (use navigate from App scope)
			navigate(`/story/${savedStory.shareId}`, {
				state: { storyData: generatedStoryContent, params: params },
			});

			// Optional: Tracking
			// trackStoryGeneration(description, sourceLang, targetLang, difficulty, storyLength); // Requires import
		} catch (error) {
			console.error("Error in generateStory (App.jsx):", error);

			// Moderation error check
			if (error.isModerationError) {
				let toastMessage;
				if (error.userBanned) {
					// For banned users, the message from backend (error.message) is likely specific to the ban.
					toastMessage =
						error.message ||
						"Your account has been banned due to content policy violations.";
				} else {
					// For non-ban moderation flags, provide a more descriptive default if backend message is generic or missing.
					if (
						error.message &&
						error.message.toLowerCase() !== "content moderation" &&
						error.message.toLowerCase() !== "moderation event triggered"
					) {
						toastMessage = error.message;
					} else {
						toastMessage =
							"Your story input was flagged for potentially violating our content policy. Please revise your description and try again. Repeated violations may lead to account restrictions.";
					}
				}

				if (setFormError) {
					setFormError({
						type: "moderation",
						message: toastMessage, // This message will be used by InputForm.jsx
						userBanned: error.userBanned || false,
					});
				}
			}
			// Rate limit check
			else if (
				error.isRateLimit ||
				(error.response && error.response.status === 429) ||
				(error.message &&
					(error.message.includes("limit") ||
						error.message.includes("Too many")))
			) {
				// Removed direct toast.error call from here
				// trackDailyLimitReached(); // Requires import
				if (setFormError) {
					setFormError({
						type: "rateLimit",
						message:
							error.message ||
							"You've reached your daily story generation limit. Upgrade or try again tomorrow.",
					});
				}
				// Do not re-throw, error is handled by form error state
			} else {
				// For other errors, set a generic form error
				const genericErrorMessage =
					error.message ||
					"An unexpected error occurred during story generation.";
				// Removed direct toast.error call from here
				if (setFormError) {
					setFormError({ type: "general", message: genericErrorMessage });
				}
				// Error is handled by form error state
			}
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (firebaseError) {
		return (
			<div className="text-center p-8 text-red-600">
				Error: Firebase could not be initialized.
			</div>
		);
	}

	return (
		<div className="app-container flex flex-col min-h-screen bg-background text-foreground">
			<Toaster />
			<Navbar ref={navbarRef} />
			<CookieConsent />
			<Routes>
				<Route
					path="/"
					element={<MainAppView generateStory={generateStory} />}
				/>
				<Route path="/story/:shareId" element={<StoryViewPage />} />
				<Route path="/privacy-policy" element={<PrivacyPolicy />} />
				<Route path="/terms-of-service" element={<TermsOfService />} />
				<Route path="/contact" element={<ContactUs />} />
				<Route
					path="/profile"
					element={
						<ProtectedRoute>
							<UserProfilePage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/my-stories"
					element={
						<ProtectedRoute>
							<MyStoriesPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/progress"
					element={
						<ProtectedRoute>
							<UserProgressDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/practice"
					element={
						<ProtectedRoute>
							<VocabularyPracticePage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/achievements"
					element={
						<ProtectedRoute>
							<Achievements />
						</ProtectedRoute>
					}
				/>
				<Route path="/explore-stories" element={<ExploreStoriesPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			<SiteFooter />
			<AchievementNotifier />
		</div>
	);
}

export default App;
