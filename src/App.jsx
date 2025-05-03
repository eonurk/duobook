import React, { useState, useEffect } from "react";
import {
	Routes,
	Route,
	Navigate,
	useLocation,
	useNavigate,
} from "react-router-dom";
import "@/App.css"; // Use alias
import InputForm from "@/components/InputForm"; // Use alias
import BookView from "@/components/BookView"; // Use alias
import { useAuth } from "@/context/AuthContext"; // Use alias
import { auth } from "@/firebaseConfig"; // Import auth directly
import Navbar from "@/components/Layout/Navbar"; // Use alias - Import Navbar
import SiteFooter from "@/components/Layout/SiteFooter"; // Use alias - Import Footer
import UserProfilePage from "@/components/User/UserProfilePage"; // Use alias
import MyStoriesPage from "@/components/User/MyStoriesPage"; // Use alias
import UserProgressDashboard from "@/components/User/UserProgressDashboard"; // Import ProgressDashboard
import Achievements from "@/components/Gamification/Achievements"; // Import Achievements component
import DuoBookExplain from "@/assets/duobook-explain.webp"; // Use alias
import DailyLimitImage from "@/assets/daily-limit.webp"; // Import daily limit image
import PrivacyPolicy from "@/pages/PrivacyPolicy"; // Import PrivacyPolicy
import TermsOfService from "@/pages/TermsOfService"; // Import TermsOfService
import VocabularyPracticePage from "@/pages/VocabularyPracticePage"; // Import Practice Page
import ContactUs from "@/pages/ContactUs"; // Import Contact Us page
import { ArrowDown, Sparkles, CheckCircle2 } from "lucide-react"; // Import ArrowDown icon and new icons
import {
	trackPageView,
	trackStoryGeneration,
	trackDailyLimitReached,
} from "@/lib/analytics"; // Import analytics
import {
	// getStories, // Commented out: Will be used in MyStoriesPage
	createStory,
	// deleteStory, // Commented out: Will be used in MyStoriesPage
	// getUserProgress, // Commented out: Will be used elsewhere (e.g., AuthContext, UserProgressDashboard)
	// updateUserProgress, // Commented out: Will be used elsewhere
	// getAllAchievements, // Commented out: Will be used elsewhere (e.g., Achievements page)
	// getUserAchievements // Commented out: Will be used elsewhere
	generateStoryViaBackend, // ADD import for backend generation
} from "./lib/api"; // Import API functions
import toast, { Toaster } from "react-hot-toast"; // ADD react-hot-toast imports

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
	const storyData = location.state?.storyData; // Get story data from navigation state
	const params = location.state?.params; // Get params from navigation state

	// Handle case where user lands directly on this route without state
	if (!storyData || !params) {
		console.warn(
			"Navigated to StoryViewPage without story data. Redirecting home."
		);
		// Redirect back to the main form page if no story data is present
		return <Navigate to="/" replace />;
	}

	const handleGoBackToForm = () => {
		navigate("/"); // Navigate back to the InputForm page
	};

	return (
		<main className="flex-1 container mx-auto px-4 py-8">
			<BookView
				sentencePairs={storyData.sentencePairs}
				vocabulary={storyData.vocabulary}
				targetLanguage={params.target}
				sourceLanguage={params.source}
				onGoBack={handleGoBackToForm} // Use the new handler
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
						formError.isRateLimit
							? "bg-amber-50 border border-amber-100"
							: "bg-red-50 text-red-800 dark:bg-gray-800 dark:text-red-400"
					}`}
					role="alert"
				>
					<div className="flex">
						{formError.isRateLimit ? (
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
						<p className="text-center text-muted-foreground mb-6">
							Generate bilingual stories to learn any language
						</p>
						<InputForm onSubmit={handleGenerate} isLoading={isGenerating} />
					</>
				)}

				{isGenerating && (
					<div className="loading-indicator flex items-center justify-center flex-col text-center p-8">
						<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
						Generating your {formParams?.length} {formParams?.difficulty} story
						in {formParams?.target} / {formParams?.source}... Please wait.
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
							sentencePairs={exampleStoryData.sentencePairs}
							vocabulary={exampleStoryData.vocabulary}
							targetLanguage={exampleStoryData.targetLanguage}
							sourceLanguage={exampleStoryData.sourceLanguage}
							isExample={true}
							onGoBack={() => {}} // No go back needed for example
						/>
					</div>
				)}
			</main>
		</>
	);
}

function App() {
	const { loading, currentUser } = useAuth();
	const [firebaseError, setFirebaseError] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	const navbarRef = React.useRef(null); // Use React.useRef instead of useRef import

	// Check Firebase initialization
	useEffect(() => {
		// Simple check if Firebase auth is available
		if (!auth) {
			console.error("Firebase Authentication is not initialized");
			setFirebaseError(true);
		}
	}, []);

	// Track page views when location changes
	useEffect(() => {
		// Get the current page name from the pathname
		const pageName =
			location.pathname === "/"
				? "home"
				: location.pathname.substring(1).replace(/\//g, "-");

		// Track the page view
		trackPageView(pageName);
	}, [location]);

	// Updated generateStory function to use the backend proxy
	const generateStory = async (
		description,
		sourceLang,
		targetLang,
		difficulty,
		storyLength,
		setFormError // Accept the setter function
	) => {
		if (!currentUser) {
			// Use toast for user-facing error
			toast.error("Login Required", {
				description: "You must be logged in to generate stories.",
			});
			// Optionally re-throw if other parts of the app expect an error
			// throw new Error("User must be logged in to generate and save stories.");
			return; // Stop execution if not logged in
		}

		const params = {
			description,
			source: sourceLang,
			target: targetLang,
			difficulty,
			length: storyLength,
		};

		try {
			console.log("Sending generation request to backend proxy...");
			// 1. Call the backend proxy to get the generated story content
			const generatedStoryContent = await generateStoryViaBackend(params);

			console.log(
				"Received story content from backend:",
				generatedStoryContent
			);

			// Ensure the received data has the expected structure (basic check)
			if (
				!generatedStoryContent ||
				!generatedStoryContent.sentencePairs ||
				!generatedStoryContent.vocabulary
			) {
				throw new Error("Invalid story data received from backend.");
			}

			// 2. Save the generated story content to the database via API
			console.log("Saving generated story to database...");
			const savedStory = await createStory({
				story: JSON.stringify(generatedStoryContent), // Store the whole generated object as JSON string
				description: description,
				sourceLanguage: sourceLang,
				targetLanguage: targetLang,
				difficulty: difficulty,
				length: storyLength,
			});
			console.log("Story saved successfully:", savedStory);

			// Refresh the story limit in navbar
			if (navbarRef.current) {
				navbarRef.current.refreshStoryLimit();
			}

			// 3. Navigate to the story view page with the generated content and params
			navigate("/story-view", {
				state: { storyData: generatedStoryContent, params: params },
			});

			// Track story generation
			trackStoryGeneration(
				description,
				sourceLang,
				targetLang,
				difficulty,
				storyLength
			);
		} catch (error) {
			console.error("Error in generateStory (App.jsx):", error);

			// Check if it's the specific rate limit error message
			if (
				error instanceof Error &&
				error.message.includes("Too many story generation requests")
			) {
				// Show an enhanced toast notification for rate limit
				toast.error("Daily Limit Reached", {
					duration: 5000, // 5 seconds is enough
					description: "You've reached your 3 story generations for today.",
					style: {
						borderRadius: "0.5rem",
						background: "#FFFBEB",
						color: "#7C2D12",
						border: "1px solid #FED7AA",
					},
				});

				// Track daily limit reached
				trackDailyLimitReached();

				// Update the formError with a "coming soon" message
				if (setFormError) {
					setFormError({
						title: "Daily Story Generation Limit Reached",
						message:
							"You've reached your 3 story generations for today. Free users are limited to 3 stories per day.",
						isRateLimit: true,
					});
				}
			} else {
				// For other errors, re-throw to be caught by MainAppView's setFormError
				throw error;
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
				Error: Firebase could not be initialized. Please check configuration and
				console.
			</div>
		);
	}

	return (
		<div className="app-container flex flex-col min-h-screen bg-background text-foreground">
			<Toaster />
			<Navbar ref={navbarRef} />
			<Routes>
				<Route
					path="/"
					element={<MainAppView generateStory={generateStory} />}
				/>
				<Route path="/story-view" element={<StoryViewPage />} />
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
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			<SiteFooter />
		</div>
	);
}

export default App;
