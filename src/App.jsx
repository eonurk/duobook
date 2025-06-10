import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	Suspense,
	lazy,
} from "react";
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
import AchievementNotifier from "@/components/Gamification/AchievementNotifier"; // Import AchievementNotifier
import DuoBookExplain from "@/assets/duobook-explain.webp"; // Use alias
import DailyLimitImage from "@/assets/daily-limit.webp"; // Import daily limit image
import steveJpeg from "@/assets/steve.jpeg";
import elonJpeg from "@/assets/elon.jpeg";
import jeffJpeg from "@/assets/jeff.jpeg";
import leonardoJpeg from "@/assets/leonardo.jpeg"; // Placeholder for Leonardo da Vinci image
import FsrsEffectivenessCharts from "@/components/Gamification/FsrsEffectivenessCharts"; // ADDED: Import FSRS Charts
import FeedbackWidget from "@/components/FeedbackWidget"; // Import Feedback Widget

const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const VocabularyPracticePage = lazy(() =>
	import("@/pages/VocabularyPracticePage")
);
const ContactUs = lazy(() => import("@/pages/ContactUs"));
const ExploreStoriesPage = lazy(() => import("@/pages/ExploreStoriesPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const UserProfilePage = lazy(() => import("@/components/User/UserProfilePage"));
const MyStoriesPage = lazy(() => import("@/components/User/MyStoriesPage"));
const UserProgressDashboard = lazy(() =>
	import("@/components/User/UserProgressDashboard")
);
const Achievements = lazy(() =>
	import("@/components/Gamification/Achievements")
);
const LeaderboardPage = lazy(() =>
	import("@/components/Gamification/LeaderboardPage")
);

import {
	ArrowDown,
	Sparkles,
	CheckCircle2,
	BookText,
	Heart,
	Loader2,
	X,
	BookHeart,
	TrendingUp,
	Award,
	Puzzle,
	HelpCircle,
	Check,
	Quote,
	Star as StarIcon,
	Rocket,
	ChevronLeft, // Added
	ChevronRight, // Added
	Zap,
	Brain,
	FileText,
	Wand2,
} from "lucide-react"; // Import ArrowDown icon and new icons

import { getTotalStoriesCount, getTotalUsersCount } from "@/lib/api"; // Import stats API functions
import {
	// getStories, // Commented out: Will be used in MyStoriesPage
	// deleteStory, // Commented out: Will be used in MyStoriesPage
	// getUserProgress, // Commented out: Will be used elsewhere (e.g., AuthContext, UserProgressDashboard)
	// updateUserProgress, // Commented out: Will be used elsewhere
	// getAllAchievements, // Commented out: Will be used elsewhere (e.g., Achievements page)
	// getUserAchievements // Commented out: Will be used elsewhere
	// generateStoryViaBackend, // Removed unused import (now handled within generateStory)
	//getLatestStories, // ADDED: Import for fetching latest stories
	createStory,
	generateStoryViaBackend,
	getStoryGenerationLimit, // Ensure getStoryGenerationLimit is imported from the correct path
	getStoryById, // Make sure this is imported for StoryViewPage
} from "./lib/api"; // Import API functions
import toast, { Toaster } from "react-hot-toast"; // Keep Toaster if used
import StoryCard from "@/components/StoryCard"; // ADDED: Import StoryCard
import { Button } from "@/components/ui/button"; // Import Button component
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card"; // Import Card component
import PostStoryGuidance from "@/components/PostStoryGuidance"; // Import PostStoryGuidance

// Static Example Story Data for the interactive demo on the main page
const interactiveExampleStoryData = {
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
		{ word: "naturally", translation: "manera natural" },
		{ word: "parallel text", translation: "texto paralelo" },
		{ word: "to progress", translation: "avanzar" },
		{ word: "to reveal them", translation: "revelarlas" },
		{ word: "underlined", translation: "subrayadas" },
		{ word: "on hover", translation: "al pasar el cursor" },
		{ word: "pronunciation", translation: "pronunciación" },
		{ word: "to hear/listen", translation: "escuchar" },
		{ word: "own", translation: "propia" },
		{ word: "to start", translation: "comenzar" },
	],
	targetLanguage: "Spanish",
	sourceLanguage: "English",
};

// ADDED: Array of external book examples for the new section
const externalBookExamples = [
	{
		id: "duobook-steve-jobs-es-en",
		title: "The Story of Steve Jobs (Intermediate)",
		description: "Read the story of Steve Jobs on Duobook.",
		coverImageUrl: steveJpeg, // Actual image from Duobook
		externalUrl: "https://duobook.co/story/cmbaoc59p0001ml8eo0meikxs",
		// Adding fields StoryCard might expect for styling/layout, even if not all are used for external links
		targetLanguage: "Spanish", // For display consistency if StoryCard uses it
		sourceLanguage: "English", // For display consistency
		authorUsername: "Duobook.co",
		isExternal: true, // Flag to help StoryCard differentiate
	},
	{
		id: "duobook-elon-musk-fr-en",
		title: "Life of Elon Musk (Intermediate)",
		description: "Read the life story of Elon Musk on Duobook.",
		coverImageUrl: elonJpeg, // Actual image
		externalUrl: "https://duobook.co/story/cmbapljqo0000mlf7oh6vxmpr",
		targetLanguage: "French",
		sourceLanguage: "English",
		authorUsername: "Duobook.co",
		isExternal: true,
	},
	{
		id: "duobook-leonardo-da-vinci-it-en",
		title: "Leonardo da Vinci: The Renaissance Man (Advanced)",
		description: "Delve into the world of Leonardo da Vinci.",
		coverImageUrl: leonardoJpeg, // Placeholder, ideally a new image
		externalUrl: "https://duobook.co/story/cmbaqnnd30000ml061zi603cl", // Placeholder URL
		targetLanguage: "Italian",
		sourceLanguage: "English",
		authorUsername: "Duobook.co",
		isExternal: true,
	},
	{
		id: "duobook-jeff-bezos-de-en",
		title: "Journey of Jeff Bezos (Easy)",
		description: "Discover the journey of Jeff Bezos on Duobook.",
		coverImageUrl: jeffJpeg, // Actual image
		externalUrl: "https://duobook.co/story/cmbapyzql0001mlf758aoy59z",
		targetLanguage: "German",
		sourceLanguage: "English",
		authorUsername: "Duobook.co",
		isExternal: true,
	},

	// Add more external books here if needed
];

// Calculate the number of supported languages

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
						const parsedStory = JSON.parse(initialStoryData.story);
						// Add shareId to the story content so BookView can access it
						parsedStory.shareId = initialStoryData.shareId;
						setStoryContent(parsedStory);
						// Ensure paramsForBookView is set correctly from initialStoryData if available
						setParamsForBookView({
							target: initialStoryData.targetLanguage,
							source: initialStoryData.sourceLanguage,
							title: initialStoryData.title,
							// any other params needed by BookView
						});
					} catch (e) {
						console.error("Failed to parse story JSON from state:", e);
						setError("Failed to load story content from navigation state.");
					}
				} else if (initialStoryData.pages || initialStoryData.sentencePairs) {
					// Story data is already in the correct object format
					// Add shareId to the story content so BookView can access it
					initialStoryData.shareId = initialStoryData.shareId || shareId;
					setStoryContent(initialStoryData);
					setParamsForBookView({
						target: initialStoryData.targetLanguage,
						source: initialStoryData.sourceLanguage,
						title: initialStoryData.title,
					});
				} else {
					console.warn(
						"StoryViewPage: initialStoryData provided but not in expected format."
					);
					setError("Story data is in an unexpected format.");
				}
				setIsLoading(false);
			} else if (shareId) {
				// No valid state data, or shareId mismatch, fetch from API using shareId
				console.log(`StoryViewPage: Fetching story with shareId: ${shareId}`);
				try {
					const fetchedStory = await getStoryById(shareId); // Assuming getStoryById fetches all necessary data
					let parsedStoryContent;
					if (typeof fetchedStory.story === "string") {
						parsedStoryContent = JSON.parse(fetchedStory.story);
					} else {
						parsedStoryContent = fetchedStory.story; // Assuming story is already an object
					}
					// Add shareId to the story content so BookView can access it
					parsedStoryContent.shareId = fetchedStory.shareId;
					setStoryContent(parsedStoryContent);
					setParamsForBookView({
						target: fetchedStory.targetLanguage,
						source: fetchedStory.sourceLanguage,
						title: fetchedStory.title,
						// any other params needed by BookView based on fetchedStory
					});
				} catch (err) {
					console.error(`Error fetching story ${shareId}:`, err);
					setError(err.message || `Could not load story with ID: ${shareId}.`);
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
		// REMOVED: Conditional logic for isExampleStory
		return <Navigate to="/" replace />;
	}

	return (
		<main className="flex-1 container mx-auto px-4 py-8">
			<BookView
				storyContent={storyContent} // Pass processed story content
				targetLanguage={paramsForBookView.target}
				sourceLanguage={paramsForBookView.source}
				onGoBack={handleGoBackToForm}
				isExample={false} // MODIFIED: Always false now for internal stories
				// title={paramsForBookView.title} // Pass title if BookView uses it
			/>
		</main>
	);
}

// Component for the logged-in main view (story generation)
function MainAppView({ generateStory }) {
	const [isGenerating, setIsGenerating] = useState(false);
	const [formError, setFormError] = useState(null);
	const [formParams, setFormParams] = useState(null);
	const { userProgress } = useAuth(); // Get idToken and userProgress

	// Ref for the scrollable container of external book examples
	const externalBooksScrollRef = useRef(null);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	// Determine user subscription tier
	const userSubscriptionTier = userProgress?.subscriptionTier || "FREE";

	// State for latest community stories
	// const [latestCommunityStories, setLatestCommunityStories] = useState([]);
	// const [loadingCommunityStories, setLoadingCommunityStories] = useState(false);
	// const [communityStoriesError, setCommunityStoriesError] = useState(null);

	// Stats State
	const [totalStories, setTotalStories] = useState(null);
	const [totalUsers, setTotalUsers] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const numberOfLanguages = 110;

	const updateScrollButtons = useCallback(() => {
		const scrollContainer = externalBooksScrollRef.current;
		if (scrollContainer) {
			const { scrollLeft, scrollWidth, offsetWidth } = scrollContainer;
			setCanScrollPrev(scrollLeft > 0);
			// Check if there's enough content to scroll, and if we are not at the end
			const isScrollable = scrollWidth > offsetWidth;
			setCanScrollNext(
				isScrollable && scrollLeft < scrollWidth - offsetWidth - 1
			); // -1 for precision
		} else {
			setCanScrollPrev(false);
			setCanScrollNext(false);
		}
	}, []);

	// useEffect(() => {
	// 	// Fetch community stories
	// 	const fetchCommunityStories = async () => {
	// 		setLoadingCommunityStories(true);
	// 		setCommunityStoriesError(null);
	// 		try {
	// 			const data = await getLatestStories(idToken, 1, 3, true);
	// 			setLatestCommunityStories(data.stories || []);
	// 		} catch (err) {
	// 			console.error("Error fetching community stories for main page:", err);
	// 			setCommunityStoriesError(
	// 				err.message || "Could not load community stories."
	// 			);
	// 		}
	// 		setLoadingCommunityStories(false);
	// 	};
	// 	fetchCommunityStories();
	// }, [idToken]);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setStatsLoading(true);
				const storiesData = await getTotalStoriesCount();
				setTotalStories(storiesData.totalStories);

				const usersData = await getTotalUsersCount();
				setTotalUsers(usersData.totalUsers);
			} catch (error) {
				console.error("Failed to fetch site statistics:", error);
			} finally {
				setStatsLoading(false);
			}
		};

		fetchStats();
	}, []);

	// Effect to reset scroll position and update buttons
	useEffect(() => {
		if (!isGenerating && externalBooksScrollRef.current) {
			externalBooksScrollRef.current.scrollLeft = 0;
			// Call updateScrollButtons after a short delay to ensure DOM is updated
			const timer = setTimeout(() => updateScrollButtons(), 50);
			return () => clearTimeout(timer);
		}
	}, [isGenerating, updateScrollButtons]);

	// Effect for scroll event listener and initial button state
	useEffect(() => {
		const scrollContainer = externalBooksScrollRef.current;
		const handleResizeOrScroll = () => {
			updateScrollButtons();
		};

		if (scrollContainer && !isGenerating) {
			// Initial check and update after content might have loaded
			const timer = setTimeout(() => updateScrollButtons(), 100); // Delay to allow rendering
			scrollContainer.addEventListener("scroll", handleResizeOrScroll);
			window.addEventListener("resize", handleResizeOrScroll);

			return () => {
				clearTimeout(timer);
				scrollContainer.removeEventListener("scroll", handleResizeOrScroll);
				window.removeEventListener("resize", handleResizeOrScroll);
			};
		}
	}, [isGenerating, updateScrollButtons]); // updateScrollButtons is memoized, removed externalBookExamples

	const handleBookScroll = (direction) => {
		const scrollContainer = externalBooksScrollRef.current;
		if (scrollContainer) {
			const scrollAmount = 300; // Or calculate based on card width
			scrollContainer.scrollBy({
				left: direction === "prev" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
			// Update buttons after scroll animation might start
			setTimeout(() => updateScrollButtons(), 350); // Adjust delay as needed for smooth behavior
		}
	};

	const handleGenerate = async (
		description,
		sourceLang,
		targetLang,
		difficulty,
		storyLength,
		isPublic,
		selectedGenre,
		selectedGrammarFocus
	) => {
		setIsGenerating(true);
		setFormError(null);
		setFormParams({
			description,
			source: sourceLang,
			target: targetLang,
			difficulty,
			length: storyLength,
			isPublic,
			genre: selectedGenre,
			grammarFocus: selectedGrammarFocus,
		});
		try {
			await generateStory(
				description,
				sourceLang,
				targetLang,
				difficulty,
				storyLength,
				setFormError,
				isPublic,
				selectedGenre,
				selectedGrammarFocus
			);
		} catch (error) {
			console.error(
				"Error during generation or saving (caught in MainAppView):",
				error
			);
			setFormError(
				error.message || "Failed to generate story. Please try again."
			);
		} finally {
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
							: "bg-red-50 text-red-800"
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
										<p className="mb-2 text-base font-semibold text-amber-800">
											{formError.message}
										</p>
										{/* Comment for now, will add back in later */}
										{/* <Button
											variant="primary"
											className="text-white hover:text-amber-800 font-semibold text-base px-6 py-6 bg-amber-400 my-2"
											onClick={() => navigate("/pricing")} // Use navigate from props or context
										>
											Explore DuoBook PRO
										</Button> */}
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
						<picture>
							<source srcSet="/public/logo.png" type="image/png" />
							<img
								src="/public/logo.png"
								alt="DuoBook Logo"
								className="w-40 h-40 mx-auto mb-4"
								loading="lazy"
								width="120"
								height="auto"
								style={{
									objectPosition: "center",
									marginBottom: "-1.5rem",
									marginTop: "-2rem",
								}}
							/>
						</picture>
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
					<div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 z-50 flex items-center justify-center">
						<div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
							{/* Main Loading Animation */}
							<div className="flex items-center justify-center mb-8">
								<div className="relative">
									<div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
									<div className="absolute inset-0 flex items-center justify-center">
										<Wand2 className="w-8 h-8 text-indigo-500 animate-pulse" />
									</div>
								</div>
							</div>

							{/* Story Details */}
							<div className="text-center mb-8">
								<h3 className="text-xl font-semibold text-gray-800 mb-2">
									Creating Your Story
								</h3>
								<p className="text-gray-600 text-sm leading-relaxed">
									Generating your{" "}
									<span className="font-medium text-indigo-600">
										{formParams?.length === "very_long_pro"
											? "Very Long (Pro)"
											: formParams?.length}
									</span>{" "}
									<span className="font-medium text-indigo-600">
										{formParams?.difficulty}
									</span>{" "}
									story in{" "}
									<span className="font-medium text-indigo-600">
										{formParams?.target} / {formParams?.source}
									</span>
								</p>
							</div>

							{/* Progress Steps */}
							<div className="space-y-4 mb-6">
								<div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
									<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
										<Check className="w-3 h-3 text-white" />
									</div>
									<span className="text-sm text-green-700 font-medium">
										Processing your preferences
									</span>
								</div>

								<div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
									<div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
										<Brain className="w-3 h-3 text-white animate-pulse" />
									</div>
									<span className="text-sm text-blue-700 font-medium">
										AI crafting your story
									</span>
								</div>

								<div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
									<div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
										<FileText className="w-3 h-3 text-white" />
									</div>
									<span className="text-sm text-gray-500 font-medium">
										Finalizing format
									</span>
								</div>
							</div>

							{/* Pro Story Notice */}
							{formParams?.length === "very_long_pro" && (
								<div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
									<div className="flex items-start space-x-3">
										<div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
											<Zap className="w-3 h-3 text-white" />
										</div>
										<div>
											<p className="text-sm font-medium text-amber-800 mb-1">
												PRO Story Generation
											</p>
											<p className="text-xs text-amber-700 leading-relaxed">
												Creating longer, more detailed content. This may take
												1-2 minutes for the best quality.
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Motivational Message */}
							<div className="text-center mt-6 pt-6 border-t border-gray-100">
								<p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
									<Sparkles className="w-3 h-3" />
									<span>Crafting the perfect learning experience for you</span>
									<Sparkles className="w-3 h-3" />
								</p>
							</div>
						</div>
					</div>
				)}

				{/* MODIFIED: External Book Examples Section */}
				{!isGenerating && externalBookExamples.length > 0 && (
					<div className="mt-16 pt-12 border-t">
						<h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
							Explore Example Books
						</h2>
						<div className="relative max-w-6xl mx-auto">
							{canScrollPrev && (
								<Button
									// variant="outline" // Removed variant
									// size="icon" // Removed size, using padding
									className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-20 disabled:cursor-not-allowed"
									onClick={() => handleBookScroll("prev")}
									disabled={!canScrollPrev}
									aria-label="Scroll previous books"
								>
									<ChevronLeft className="h-6 w-6" />
								</Button>
							)}
							<div
								ref={externalBooksScrollRef}
								className="flex overflow-x-auto py-2 snap-x snap-mandatory gap-x-4 scroll-smooth "
								style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} // Hide scrollbar
							>
								{externalBookExamples.map((book) => (
									<StoryCard key={book.id} story={book} />
								))}
							</div>
							{canScrollNext && (
								<Button
									// variant="outline" // Removed variant
									// size="icon" // Removed size, using padding
									className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-20 disabled:cursor-not-allowed"
									onClick={() => handleBookScroll("next")}
									disabled={!canScrollNext}
									aria-label="Scroll next books"
								>
									<ChevronRight className="h-6 w-6" />
								</Button>
							)}
						</div>
					</div>
				)}

				{!isGenerating && (
					<div className="mt-12 pt-8 border-t">
						<div className="flex justify-center mb-8">
							<img
								src={DuoBookExplain}
								alt="DuoBook Interface Example"
								className="max-w-xs md:max-w-sm h-auto"
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
							storyContent={interactiveExampleStoryData} // MODIFIED: Renamed variable
							targetLanguage={interactiveExampleStoryData.targetLanguage} // MODIFIED: Renamed variable
							sourceLanguage={interactiveExampleStoryData.sourceLanguage} // MODIFIED: Renamed variable
							isExample={true}
							onGoBack={() => {}}
						/>
					</div>
				)}

				{/* Key Features Section */}
				{!isGenerating && (
					<div className="mt-16 pt-12 border-t">
						<h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
							Unlock Your Language Potential
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12">
							{[
								{
									id: 1,
									icon: <BookHeart className="w-10 h-10 text-rose-500 mb-3" />,
									title: "Bilingual Stories",
									description:
										"Read engaging stories with parallel text in your target and source languages.",
								},
								{
									id: 2,
									icon: (
										<TrendingUp className="w-10 h-10 text-green-500 mb-3" />
									),
									title: "Track Your Progress",
									description:
										"Monitor your learning journey with streaks, levels, and experience points.",
								},
								{
									id: 3,
									icon: <Award className="w-10 h-10 text-amber-500 mb-3" />,
									title: "Earn Achievements",
									description:
										"Stay motivated by unlocking achievements as you learn and explore.",
								},
								{
									id: 4,
									icon: <Puzzle className="w-10 h-10 text-sky-500 mb-3" />,
									title: "Practice & Reinforce",
									description:
										"Solidify your knowledge with vocabulary practice and upcoming interactive exercises.",
								},
							].map((feature) => (
								<div
									key={feature.id} // Use a stable key like an id
									className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
								>
									{feature.icon}
									<h3 className="text-xl font-semibold mb-2 text-gray-700">
										{feature.title}
									</h3>
									<p className="text-sm text-gray-500">{feature.description}</p>
								</div>
							))}
						</div>
					</div>
				)}
				{/* FSRS Effectiveness Charts Section */}
				{!isGenerating && <FsrsEffectivenessCharts />}

				{statsLoading ? (
					<div className="flex justify-center items-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p className="text-sm text-slate-500 ml-3">Loading stats...</p>
					</div>
				) : (
					<div className="mt-10">
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
								DuoBook Stats
							</h1>
							<p className="text-slate-600">
								Join thousands of learners worldwide
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
							{totalStories !== null && (
								<div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-all duration-300">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
												{totalStories.toLocaleString()}+
											</p>
											<p className="text-sm text-slate-600 mt-1 font-medium">
												Stories Generated
											</p>
										</div>
										<div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
											<BookText className="w-6 h-6 text-white" />
										</div>
									</div>
								</div>
							)}
							{totalUsers !== null && (
								<div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
												{totalUsers.toLocaleString()}+
											</p>
											<p className="text-sm text-slate-600 mt-1 font-medium">
												Language Learners
											</p>
										</div>
										<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
											<Heart className="w-6 h-6 text-white" />
										</div>
									</div>
								</div>
							)}
							{/* Display Number of Languages Supported */}
							<div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
											{numberOfLanguages}+
										</p>
										<p className="text-sm text-slate-600 mt-1 font-medium">
											Languages Supported
										</p>
									</div>
									<div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
										<svg
											className="w-6 h-6 text-white"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 12.236 11.618 14z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
								</div>
							</div>
						</div>

						<div className="text-center mt-12">
							<a
								href="https://news.ycombinator.com/item?id=43886381"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block"
								// Classes for a more badge-like appearance: smaller, rounded, specific colors
							>
								<img
									src="https://hackerbadge.vercel.app/api?id=43886381"
									alt="Hacker News Logo"
									className="aspect-auto w-48"
								/>
							</a>
						</div>
					</div>
				)}

				{/* Testimonials Section */}
				{!isGenerating && (
					<div className="mt-16 pt-12 pb-12 bg-slate-100 rounded-lg">
						<div className="flex flex-col items-center mb-6 md:mb-12">
							<h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-gray-800 px-2 leading-tight">
								<span className="block mb-2">
									What Learners Say About DuoBook
								</span>
								<span
									className="text-5xl"
									role="img"
									aria-label="Globe and Heart"
								>
									{" "}
									<span className="animate-pulse inline-block align-middle text-4xl">
										❤️
									</span>
								</span>
							</h2>
							<p className="mt-3 text-base md:text-lg text-gray-500 max-w-xl px-4 text-center">
								Join thousands of language lovers who are transforming their
								learning journey.
							</p>
						</div>
						<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
							{[
								{
									id: 1,
									quote:
										"The parallel text feature is genius. I have to work but I can't get out of the stories!",
									name: "Cagla L.",
									role: "Dutch Learner",
									stars: 5,
								},
								{
									id: 2,
									quote:
										"Arabic is hard but being able to read and listen at the same time is a game changer.",
									name: "Laura R.",
									role: "Arabic Learner",
									stars: 5,
								},
								{
									id: 3,
									quote:
										"I'm learning Spanish and DuoBook is my favorite way to learn so far. My stories are so engaging :D",
									name: "Onur K.",
									role: "Spanish Learner",
									stars: 5,
								},
							].map((testimonial) => (
								<Card
									key={testimonial.id} // Use a stable key like an id
									className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
								>
									<CardContent className="pt-6 flex-grow">
										<Quote className="w-8 h-8 text-amber-500 mb-3" />
										<p className="text-gray-600 italic mb-4">
											"{testimonial.quote}"
										</p>
									</CardContent>
									<CardFooter className="mt-auto border-t pt-4">
										<div>
											<p className="font-semibold text-gray-700">
												{testimonial.name}
											</p>
											<p className="text-sm text-gray-500">
												{testimonial.role}
											</p>
										</div>
										<div className="ml-auto flex items-center">
											{[...Array(5)].map((_, i) => (
												<StarIcon
													key={i}
													className={`w-4 h-4 ${
														i < testimonial.stars
															? "text-amber-400"
															: "text-gray-300"
													}`}
													fill={i < testimonial.stars ? "currentColor" : "none"}
												/>
											))}
										</div>
									</CardFooter>
								</Card>
							))}
						</div>
					</div>
				)}
				{/* Call to Action Section */}
				{!isGenerating && (
					<div className="mt-16 pt-12 text-center bg-gradient-to-r from-amber-200 to-amber-500 text-white py-16 px-6 rounded-lg">
						<Rocket className="w-16 h-16 mx-auto mb-6 " />
						<h2 className="text-2xl md:text-4xl font-bold mb-4 text-amber-800">
							Ready to Craft Your Language Adventure?
						</h2>
						<p className="text-md md:text-xl max-w-2xl mx-auto mb-8 px-8 ">
							Stop just memorizing words. Start understanding in context.
							Generate your first personalized bilingual story now!
						</p>
						<Button
							onClick={() => {
								const inputForm = document.getElementById("input-form-section"); // Assuming InputForm has an id
								if (inputForm) {
									inputForm.scrollIntoView({ behavior: "smooth" });
								}
							}}
							className=" bg-amber-800 hover:bg-amber-500 text-lg py-6 px-8 rounded-lg transition-transform transform hover:scale-105"
						>
							Create Your First Story
						</Button>
						<div className="mt-8 flex flex-col items-center text-amber-900">
							3 free stories&nbsp;each day
							<p className="text-xs  mt-1 opacity-70">
								No card required. Just start reading.
							</p>
						</div>
					</div>
				)}
				{/* ADDED: Latest Community Stories Section */}
				{/* {!isGenerating &&
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
					)} */}
			</main>
		</>
	);
}

function App() {
	const { loading, currentUser } = useAuth();
	const [firebaseError] = useState(false);
	const navigate = useNavigate();
	const navbarRef = useRef(null);

	// State for post-story guidance
	const [showPostStoryGuidance, setShowPostStoryGuidance] = useState(false);
	const [guidanceStoryData, setGuidanceStoryData] = useState(null);
	const [isFirstStory, setIsFirstStory] = useState(false);

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

	// Define static data outside the component or import if moved to a constants file
	const keyFeaturesData = [
		{
			id: 1,
			icon: <BookHeart className="w-10 h-10 text-rose-500 mb-3" />,
			title: "Bilingual Stories",
			description:
				"Read engaging stories with parallel text in your target and source languages.",
		},
		{
			id: 2,
			icon: <TrendingUp className="w-10 h-10 text-green-500 mb-3" />,
			title: "Track Your Progress",
			description:
				"Monitor your learning journey with streaks, levels, and experience points.",
		},
		{
			id: 3,
			icon: <Award className="w-10 h-10 text-amber-500 mb-3" />,
			title: "Earn Achievements",
			description:
				"Stay motivated by unlocking achievements as you learn and explore.",
		},
		{
			id: 4,
			icon: <Puzzle className="w-10 h-10 text-sky-500 mb-3" />,
			title: "Practice & Reinforce",
			description:
				"Solidify your knowledge with vocabulary practice and upcoming interactive exercises.",
		},
	];

	const testimonialsData = [
		{
			id: 1,
			quote:
				"The parallel text feature is genius. I have to work but I can't get out of the stories!",
			name: "Cagla L.",
			role: "Dutch Learner",
			stars: 5,
		},
		{
			id: 2,
			quote:
				"Arabic is hard but being able to read and listen at the same time is a game changer.",
			name: "Laura R.",
			role: "Arabic Learner",
			stars: 5,
		},
		{
			id: 3,
			quote:
				"I'm learning Spanish and DuoBook is my favorite way to learn so far. My stories are so engaging :D",
			name: "Onur K.",
			role: "Spanish Learner",
			stars: 5,
		},
	];

	// generateStory function defined within App
	const generateStory = async (
		description,
		sourceLang,
		targetLang,
		difficulty,
		storyLength,
		setFormError, // Accept the setter function
		isPublic,
		selectedGenre,
		selectedGrammarFocus
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
			// These are not directly part of `params` for `generateStoryViaBackend` yet
			// but will be used for `createStory` and potentially later for backend generation params
			genre: selectedGenre,
			grammarFocus: selectedGrammarFocus,
		};

		try {
			const limitData = await getStoryGenerationLimit();

			// Check if user has reached their generation limit
			// Applies to FREE users (isPremium: false) OR PRO users (isPremium: true, but might have a specific limit)
			if (limitData.remaining <= 0) {
				let message =
					"You've reached your daily story generation limit. Please upgrade or try again tomorrow.";
				if (limitData.isPremium && limitData.subscriptionTier === "PRO") {
					message = `You've reached your daily story generation limit of ${limitData.limit} for the PRO tier. Please try again tomorrow.`;
				} else if (limitData.isPremium) {
					// For other premium tiers that might still be unlimited, this condition won't be met if remaining is positive or not applicable
					// If a premium tier (not PRO) somehow has remaining <= 0 and a limit, this message would show.
					// This case should ideally be handled by the backend ensuring 'remaining' is always positive for truly unlimited tiers, or not sending 'limit'.
					// For now, we assume if isPremium is true and remaining <=0, it's a capped premium tier like PRO.
					message = `You've reached your daily story generation limit of ${limitData.limit} for your current plan. Please try again tomorrow.`;
				}

				if (setFormError) {
					setFormError({
						type: "rateLimit",
						message: message,
					});
				}
				return; // Stop execution
			}

			// Pass through genre and grammarFocus to generateStoryViaBackend if the backend supports them
			// For now, we'll assume generateStoryViaBackend takes the original `params` object which might not yet include these.
			// If your backend IS updated to use these for generation, modify the params passed to generateStoryViaBackend.
			const generatedStoryContent = await generateStoryViaBackend({
				description: params.description,
				source: params.source,
				target: params.target,
				difficulty: params.difficulty,
				length: params.length,
				// If backend supports these in generation, uncomment and pass:
				genre: selectedGenre,
				grammarFocus: selectedGrammarFocus,
			});

			if (!generatedStoryContent) {
				throw new Error("No story data received from backend.");
			}

			if (
				!generatedStoryContent.pages ||
				!Array.isArray(generatedStoryContent.pages)
			) {
				throw new Error(
					"Invalid paginated story data received from backend (missing 'pages' array)."
				);
			}

			console.log("Saving generated story to database...");
			const savedStory = await createStory({
				story: JSON.stringify(generatedStoryContent),
				description: description,
				sourceLanguage: sourceLang,
				targetLanguage: targetLang,
				difficulty: difficulty,
				length: storyLength,
				isPublic: isPublic,
				genre: selectedGenre, // Pass the genre
				grammarFocus: selectedGrammarFocus, // Pass the grammar focus (array)
			});

			// Check if this is the user's first story
			try {
				const userStories = await fetch("/api/stories", {
					headers: {
						Authorization: `Bearer ${await currentUser.getIdToken()}`,
					},
				}).then((res) => res.json());

				const isUserFirstStory = userStories.length === 1; // Just created their first story

				setIsFirstStory(isUserFirstStory);
				setGuidanceStoryData(generatedStoryContent);

				if (isUserFirstStory) {
					setTimeout(() => {
						setShowPostStoryGuidance(true);
					}, 1000); // Delay to allow story page to load}
				}
				// Show guidance after navigation
			} catch (error) {
				console.error("Error checking story count:", error);
				// Still show guidance even if check fails
				setIsFirstStory(false);
				setGuidanceStoryData(generatedStoryContent);
				setTimeout(() => {
					setShowPostStoryGuidance(true);
				}, 1500);
			}

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
			<Toaster position="top-center" reverseOrder={false} />
			<AchievementNotifier />
			<Navbar ref={navbarRef} />

			{/* Post-Story Guidance Modal */}
			<PostStoryGuidance
				isOpen={showPostStoryGuidance}
				onClose={() => setShowPostStoryGuidance(false)}
				storyData={guidanceStoryData}
				isFirstStory={isFirstStory}
			/>

			<Suspense
				fallback={
					<div className="flex justify-center items-center h-screen">
						<Loader2 className="h-12 w-12 animate-spin text-primary" />
					</div>
				}
			>
				<Routes>
					<Route
						path="/"
						element={
							<MainAppView
								generateStory={generateStory}
								keyFeaturesData={keyFeaturesData}
								testimonialsData={testimonialsData}
							/>
						}
					/>
					<Route path="/story/:shareId" element={<StoryViewPage />} />
					<Route path="/privacy" element={<PrivacyPolicy />} />
					<Route path="/terms" element={<TermsOfService />} />
					<Route path="/contact" element={<ContactUs />} />
					<Route path="/explore-stories" element={<ExploreStoriesPage />} />
					<Route path="/news" element={<NewsPage />} />
					<Route path="/pricing" element={<PricingPage />} />
					{/* Protected Routes */}
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
					<Route
						path="/leaderboard"
						element={
							<ProtectedRoute>
								<LeaderboardPage />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Suspense>
			<SiteFooter />
			<CookieConsent />
			<FeedbackWidget />
		</div>
	);
}

export default App;
