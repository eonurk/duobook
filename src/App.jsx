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
import NewsPage from "@/pages/NewsPage"; // Import NewsPage
import PricingPage from "@/pages/PricingPage"; // Import Pricing Page
import LeaderboardPage from "@/components/Gamification/LeaderboardPage"; // ADDED: Import LeaderboardPage
import FsrsEffectivenessCharts from "@/components/Gamification/FsrsEffectivenessCharts"; // ADDED: Import FSRS Charts
import {
	ArrowDown,
	Sparkles,
	CheckCircle2,
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
} from "lucide-react"; // Import ArrowDown icon and new icons
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
import { Button } from "@/components/ui/button"; // Import Button component
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card"; // Import Card component

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
						// Parse the story JSON
						const parsedContent = JSON.parse(fetchedStory.story);
						// Add the shareId to the parsed content object
						parsedContent.shareId = shareId;
						setStoryContent(parsedContent);

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

// Component for the logged-in main view (story generation)
function MainAppView({ generateStory }) {
	const [isGenerating, setIsGenerating] = useState(false);
	const [formError, setFormError] = useState(null);
	const [formParams, setFormParams] = useState(null);
	const [showPdfBanner, setShowPdfBanner] = useState(true); // Added state for PDF banner
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
				{showPdfBanner && (
					<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 text-sm rounded-md shadow-md mb-4 flex justify-between items-center">
						<div>
							<span className="font-bold">New Feature!</span> You can now
							download your stories as PDF (Kindle friendly). Look for the
							download icon on the story page.
						</div>
						<button
							onClick={() => setShowPdfBanner(false)}
							className="text-green-500 hover:text-green-700"
							aria-label="Dismiss banner"
						>
							<X size={18} />
						</button>
					</div>
				)}
				{!isGenerating && (
					<>
						<img
							src="logo.png"
							alt="DuoBook Logo"
							className="w-52 h-52 mx-auto object-contain"
							style={{
								objectPosition: "center",
								marginBottom: "-1.5rem",
								marginTop: "-2rem",
							}}
						/>
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
							storyContent={exampleStoryData}
							targetLanguage={exampleStoryData.targetLanguage}
							sourceLanguage={exampleStoryData.sourceLanguage}
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
									icon: <BookHeart className="w-10 h-10 text-rose-500 mb-3" />,
									title: "Bilingual Stories",
									description:
										"Read engaging stories with parallel text in your target and source languages.",
								},
								{
									icon: (
										<TrendingUp className="w-10 h-10 text-green-500 mb-3" />
									),
									title: "Track Your Progress",
									description:
										"Monitor your learning journey with streaks, levels, and experience points.",
								},
								{
									icon: <Award className="w-10 h-10 text-amber-500 mb-3" />,
									title: "Earn Achievements",
									description:
										"Stay motivated by unlocking achievements as you learn and explore.",
								},
								{
									icon: <Puzzle className="w-10 h-10 text-sky-500 mb-3" />,
									title: "Practice & Reinforce",
									description:
										"Solidify your knowledge with vocabulary practice and upcoming interactive exercises.",
								},
							].map((feature, index) => (
								<div
									key={index}
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

				{/* Example Quiz Section */}
				{!isGenerating && (
					<div className="mt-12 pt-12 bg-slate-100 py-12 rounded-lg">
						<h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 text-gray-800">
							Test Your Understanding
						</h2>
						<div className="max-w-2xl mx-auto px-4">
							<ExampleQuiz />
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
						<p className="text-md md:text-xl max-w-2xl mx-auto mb-8">
							Stop just memorizing words. Start understanding in context.
							<br />
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
									quote:
										"The parallel text feature is genius. I have to work but I can't get out of the stories!",
									name: "Cagla L.",
									role: "Dutch Learner",
									stars: 5,
								},
								{
									quote:
										"Arabic is hard but being able to read and listen at the same time is a game changer.",
									name: "Laura R.",
									role: "Arabic Learner",
									stars: 5,
								},
								{
									quote:
										"I'm learning Spanish and DuoBook is my favorite way to learn so far. My stories are so engaging :D",
									name: "Onur K.",
									role: "Spanish Learner",
									stars: 5,
								},
							].map((testimonial, index) => (
								<Card
									key={index}
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

// --- Example Quiz Component ---
const exampleQuizQuestions = [
	{
		question:
			"What is the primary way DuoBook helps you learn languages, according to the example?",
		options: [
			"Through natural learning with stories",
			"By watching long video lectures",
			"With complex grammar exercises",
			"By translating word lists",
		],
		correctAnswer: "Through natural learning with stories",
		hint: 'The first sentence is: "DuoBook te ayuda a aprender idiomas de manera natural."',
	},
	{
		question:
			"What specific feature does every DuoBook story include, as stated in the example?",
		options: [
			"Parallel text in two languages",
			"Character voices for dialogues",
			"Downloadable PDF versions",
			"Built-in video chat",
		],
		correctAnswer: "Parallel text in two languages",
		hint: 'The second sentence mentions: "Cada historia tiene texto paralelo en dos idiomas."',
	},
	{
		question:
			"How do you move forward in a DuoBook story, based on the example description?",
		options: [
			"By tapping on a sentence",
			"By typing the translation",
			"By answering a quiz question",
			"By clicking a 'Next Page' button",
		],
		correctAnswer: "By tapping on a sentence",
		hint: 'Sentence 3 says: "Toca una frase para avanzar en la historia."',
	},
	{
		question: "What action reveals blurred translations in the example story?",
		options: [
			"Tapping on them",
			"Hovering over them",
			"Shaking your device",
			"Speaking the word aloud",
		],
		correctAnswer: "Tapping on them",
		hint: 'Check sentence 4: "Toca las traducciones borrosas para revelarlas."',
	},
	{
		question:
			"According to the example, what can you do with the audio button?",
		options: [
			"Hear the pronunciation of sentences",
			"Record your own voice",
			"Change the background music",
			"Translate text to speech",
		],
		correctAnswer: "Hear the pronunciation of sentences",
		hint: 'Sentence 6 mencions: "Puedes escuchar la pronunciación con el botón de audio."',
	},
];

function ExampleQuiz() {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [score, setScore] = useState(0);
	const [quizFinished, setQuizFinished] = useState(false);

	const currentQuestion = exampleQuizQuestions[currentQuestionIndex];

	const handleAnswerSelect = (option) => {
		if (showFeedback) return; // Don't allow changing answer after feedback
		setSelectedAnswer(option);
	};

	const handleSubmitAnswer = () => {
		if (!selectedAnswer) return;
		setShowFeedback(true);
		if (selectedAnswer === currentQuestion.correctAnswer) {
			setScore((prevScore) => prevScore + 1);
		}
	};

	const handleNextQuestion = () => {
		setSelectedAnswer(null);
		setShowFeedback(false);
		if (currentQuestionIndex < exampleQuizQuestions.length - 1) {
			setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
		} else {
			setQuizFinished(true);
		}
	};

	const handleRestartQuiz = () => {
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setScore(0);
		setQuizFinished(false);
	};

	if (quizFinished) {
		return (
			<Card className="shadow-xl">
				<CardHeader>
					<CardTitle className="text-xl sm:text-2xl text-center text-purple-700">
						Quiz Complete!
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-lg mb-4 text-gray-700">
						You scored {score} out of {exampleQuizQuestions.length}!
					</p>
					<Award
						className={`w-16 h-16 mx-auto mb-4 ${
							score === exampleQuizQuestions.length
								? "text-amber-500"
								: "text-slate-400"
						}`}
					/>
					<Button
						onClick={handleRestartQuiz}
						className="bg-purple-600 hover:bg-purple-700 text-white py-6"
					>
						Restart Quiz
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!currentQuestion) {
		return <p>Loading quiz...</p>; // Should not happen if questions are defined
	}

	return (
		<Card className="shadow-xl bg-white">
			<CardHeader>
				<CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
					Question {currentQuestionIndex + 1} of {exampleQuizQuestions.length}
				</CardTitle>
				<p className="text-md mt-2 text-gray-700">{currentQuestion.question}</p>
			</CardHeader>
			<CardContent className="space-y-2">
				{currentQuestion.options.map((option, index) => {
					const isCorrect = option === currentQuestion.correctAnswer;
					const isSelected = option === selectedAnswer;
					let buttonClass =
						"justify-start w-full text-left py-2 px-0 sm:py-3 sm:px-2 rounded-lg transition-colors duration-200 text-gray-700 text-xs sm:text-sm ";
					if (showFeedback) {
						if (isCorrect) {
							buttonClass +=
								"bg-green-100 border-green-500 ring-2 ring-green-500";
						} else if (isSelected && !isCorrect) {
							buttonClass += "bg-red-100 border-red-500 ring-2 ring-red-500";
						} else {
							buttonClass += "bg-slate-50 border-slate-300";
						}
					} else {
						if (isSelected) {
							buttonClass +=
								"bg-purple-100 border-purple-500 ring-2 ring-purple-500";
						} else {
							buttonClass +=
								"bg-slate-50 hover:bg-slate-100 border border-slate-300";
						}
					}

					return (
						<Button
							key={index}
							variant="outline"
							className={buttonClass}
							onClick={() => handleAnswerSelect(option)}
							disabled={showFeedback}
						>
							<span className="ml-1">
								{showFeedback &&
									(isCorrect ? (
										<Check className="w-5 h-5 text-green-600" />
									) : isSelected ? (
										<X className="w-5 h-5 text-red-600" />
									) : (
										<HelpCircle className="w-5 h-5 text-slate-400" />
									))}
							</span>
							{option}
						</Button>
					);
				})}
			</CardContent>
			<CardFooter className="flex flex-col items-center space-y-3">
				{showFeedback && (
					<div
						className={`p-3 rounded-md w-full text-center text-sm ${
							selectedAnswer === currentQuestion.correctAnswer
								? "bg-green-50 text-green-700"
								: "bg-red-50 text-red-700"
						}`}
					>
						{selectedAnswer === currentQuestion.correctAnswer
							? "Correct!"
							: "Not quite."}
						{!(selectedAnswer === currentQuestion.correctAnswer) &&
							currentQuestion.hint && (
								<p className="text-xs mt-1 text-gray-500">
									Hint: {currentQuestion.hint}
								</p>
							)}
					</div>
				)}
				{!showFeedback ? (
					<Button
						onClick={handleSubmitAnswer}
						disabled={!selectedAnswer}
						className=" bg-slate-500 hover:bg-slate-700 text-sm py-4 px-8 transition-transform transform hover:scale-105 text-white"
					>
						Submit Answer
					</Button>
				) : (
					<Button
						onClick={handleNextQuestion}
						className="w-full bg-slate-600 hover:bg-slate-700 text-white"
					>
						{currentQuestionIndex < exampleQuizQuestions.length - 1
							? "Next Question"
							: "Finish Quiz"}
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

// --- END Example Quiz Component ---

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

			<Routes>
				<Route
					path="/"
					element={<MainAppView generateStory={generateStory} />}
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
			<SiteFooter />
		</div>
	);
}

export default App;
