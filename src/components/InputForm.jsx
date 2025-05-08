import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import Login from "@/components/Auth/Login"; // Import Login
import Signup from "@/components/Auth/Signup"; // Import Signup
import { BookText, Heart, Lightbulb, Shuffle } from "lucide-react"; // Replace existing icons with cuter alternatives & ADDED Lightbulb, Shuffle
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription, // Added DialogDescription
} from "@/components/ui/dialog"; // Import Dialog components
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"; // Import Card components
import duobookImg from "../assets/duobook.jpg";
import { getTotalStoriesCount, getTotalUsersCount } from "@/lib/api"; // Import stats API functions
// Removed unused HNLogo import

// Common languages for selection
const languages = [
	{ value: "Afrikaans", label: "Afrikaans" },
	{ value: "Albanian", label: "Albanian" },
	{ value: "Amharic", label: "Amharic" },
	{ value: "Arabic", label: "Arabic" },
	{ value: "Armenian", label: "Armenian" },
	{ value: "Azerbaijani", label: "Azerbaijani" },
	{ value: "Basque", label: "Basque" },
	{ value: "Belarusian", label: "Belarusian" },
	{ value: "Bengali", label: "Bengali" },
	{ value: "Bosnian", label: "Bosnian" },
	{ value: "Bulgarian", label: "Bulgarian" },
	{ value: "Catalan", label: "Catalan" },
	{ value: "Cebuano", label: "Cebuano" },
	{ value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
	{ value: "Chinese (Traditional)", label: "Chinese (Traditional)" },
	{ value: "Corsican", label: "Corsican" },
	{ value: "Croatian", label: "Croatian" },
	{ value: "Czech", label: "Czech" },
	{ value: "Danish", label: "Danish" },
	{ value: "Dutch", label: "Dutch" },
	{ value: "English", label: "English" },
	{ value: "Esperanto", label: "Esperanto" },
	{ value: "Estonian", label: "Estonian" },
	{ value: "Filipino (Tagalog)", label: "Filipino (Tagalog)" },
	{ value: "Finnish", label: "Finnish" },
	{ value: "French", label: "French" },
	{ value: "Frisian", label: "Frisian" },
	{ value: "Galician", label: "Galician" },
	{ value: "Georgian", label: "Georgian" },
	{ value: "German", label: "German" },
	{ value: "Greek", label: "Greek" },
	{ value: "Gujarati", label: "Gujarati" },
	{ value: "Haitian Creole", label: "Haitian Creole" },
	{ value: "Hausa", label: "Hausa" },
	{ value: "Hawaiian", label: "Hawaiian" },
	{ value: "Hebrew", label: "Hebrew" },
	{ value: "Hindi", label: "Hindi" },
	{ value: "Hmong", label: "Hmong" },
	{ value: "Hungarian", label: "Hungarian" },
	{ value: "Icelandic", label: "Icelandic" },
	{ value: "Igbo", label: "Igbo" },
	{ value: "Indonesian", label: "Indonesian" },
	{ value: "Irish", label: "Irish" },
	{ value: "Italian", label: "Italian" },
	{ value: "Japanese", label: "Japanese" },
	{ value: "Javanese", label: "Javanese" },
	{ value: "Kannada", label: "Kannada" },
	{ value: "Kazakh", label: "Kazakh" },
	{ value: "Khmer", label: "Khmer" },
	{ value: "Kinyarwanda", label: "Kinyarwanda" },
	{ value: "Korean", label: "Korean" },
	{ value: "Kurdish", label: "Kurdish" },
	{ value: "Kyrgyz", label: "Kyrgyz" },
	{ value: "Lao", label: "Lao" },
	{ value: "Latin", label: "Latin" },
	{ value: "Latvian", label: "Latvian" },
	{ value: "Lithuanian", label: "Lithuanian" },
	{ value: "Luxembourgish", label: "Luxembourgish" },
	{ value: "Macedonian", label: "Macedonian" },
	{ value: "Malagasy", label: "Malagasy" },
	{ value: "Malay", label: "Malay" },
	{ value: "Malayalam", label: "Malayalam" },
	{ value: "Maltese", label: "Maltese" },
	{ value: "Maori", label: "Maori" },
	{ value: "Marathi", label: "Marathi" },
	{ value: "Mongolian", label: "Mongolian" },
	{ value: "Myanmar (Burmese)", label: "Myanmar (Burmese)" },
	{ value: "Nepali", label: "Nepali" },
	{ value: "Norwegian", label: "Norwegian" },
	{ value: "Nyanja (Chichewa)", label: "Nyanja (Chichewa)" },
	{ value: "Odia (Oriya)", label: "Odia (Oriya)" },
	{ value: "Pashto", label: "Pashto" },
	{ value: "Persian", label: "Persian" },
	{ value: "Polish", label: "Polish" },
	{ value: "Portuguese", label: "Portuguese" },
	{ value: "Punjabi", label: "Punjabi" },
	{ value: "Romanian", label: "Romanian" },
	{ value: "Russian", label: "Russian" },
	{ value: "Samoan", label: "Samoan" },
	{ value: "Scots Gaelic", label: "Scots Gaelic" },
	{ value: "Serbian", label: "Serbian" },
	{ value: "Sesotho", label: "Sesotho" },
	{ value: "Shona", label: "Shona" },
	{ value: "Sindhi", label: "Sindhi" },
	{ value: "Sinhala (Sinhalese)", label: "Sinhala (Sinhalese)" },
	{ value: "Slovak", label: "Slovak" },
	{ value: "Slovenian", label: "Slovenian" },
	{ value: "Somali", label: "Somali" },
	{ value: "Spanish", label: "Spanish" },
	{ value: "Sundanese", label: "Sundanese" },
	{ value: "Swahili", label: "Swahili" },
	{ value: "Swedish", label: "Swedish" },
	{ value: "Tagalog (Filipino)", label: "Tagalog (Filipino)" },
	{ value: "Tajik", label: "Tajik" },
	{ value: "Tamil", label: "Tamil" },
	{ value: "Tatar", label: "Tatar" },
	{ value: "Telugu", label: "Telugu" },
	{ value: "Thai", label: "Thai" },
	{ value: "Turkish", label: "Turkish" },
	{ value: "Turkmen", label: "Turkmen" },
	{ value: "Ukrainian", label: "Ukrainian" },
	{ value: "Urdu", label: "Urdu" },
	{ value: "Uyghur", label: "Uyghur" },
	{ value: "Uzbek", label: "Uzbek" },
	{ value: "Vietnamese", label: "Vietnamese" },
	{ value: "Welsh", label: "Welsh" },
	{ value: "Xhosa", label: "Xhosa" },
	{ value: "Yiddish", label: "Yiddish" },
	{ value: "Yoruba", label: "Yoruba" },
	{ value: "Zulu", label: "Zulu" },
];

// Map numeric values to labels
const difficultyMap = ["Beginner", "Intermediate", "Advanced"];
const lengthMap = ["Short", "Medium", "Long"];

// Examples Array
const storyExamples = [
	"A lost puppy looking for its owner in a busy city.",
	"A cooking competition where the main ingredient is magical mushrooms.",
	"A lonely robot on Mars who discovers a hidden garden.",
	"Two pen pals from different centuries who somehow start exchanging letters.",
	"A detective who can talk to animals tries to solve a series of pet disappearances.",
	"A group of children find a map leading to a legendary candy treasure.",
	"An ancient tree in a forest that grants wishes, but with a twist.",
	"A shy librarian who discovers a secret portal to a world of books.",
	"A young musician trying to win a battle of the bands against a rival with supernatural powers.",
	"An inventor creates a machine that can translate dreams into movies.",
	"A travel blogger gets stranded on a remote island with only a talking parrot for company.",
	"A knight who is afraid of heights but must rescue a princess from a tall tower.",
	"An aspiring chef opens a restaurant that only serves food based on emotions.",
	"A group of friends on a camping trip encounter a friendly Bigfoot.",
	"A historian discovers a diary that reveals a hidden truth about a famous historical event.",
	"A gardener discovers a plant that grows objects instead of flowers.",
	"A time traveler who can only go back 24 hours tries to prevent a disaster.",
	"A child who can see people's emotions as colors navigates their first day of school.",
	"An elderly couple who decide to fulfill their bucket list in reverse order.",
	"A mailman who delivers letters to mythical creatures living in the human world.",
	"A teenager who wakes up one day able to understand the language of cats.",
	"A small town where it rains different foods depending on the collective mood.",
	"A bookstore owner who discovers their bestselling author is actually a ghost.",
	"A photographer who captures moments from parallel universes in their pictures.",
	"A baker whose pastries make people remember their happiest memories.",
	"A night security guard at a museum where the art comes to life after midnight.",
	"A group of friends who find a map that leads to a hidden underwater city.",
	"A scientist who accidentally creates a potion that makes inanimate objects talk.",
	"A shy poet whose poems magically come true when read aloud under moonlight.",
	"A tour guide in a city of magical creatures disguised as humans.",
];

function InputForm({ onSubmit, isLoading }) {
	const { currentUser } = useAuth(); // Get current user
	const [description, setDescription] = useState("");
	const [sourceLang, setSourceLang] = useState("English"); // Default source: English
	const [targetLang, setTargetLang] = useState("Spanish"); // Default target: Spanish
	// Use numeric state for sliders, map back to string for submission
	const [difficultyIndex, setDifficultyIndex] = useState(0); // 0: Beginner, 1: Intermediate, 2: Advanced
	const [lengthIndex, setLengthIndex] = useState(0); // 0: Short, 1: Medium, 2: Long
	const [showAuthDialog, setShowAuthDialog] = useState(false); // State for dialog
	const [activeTab, setActiveTab] = useState("login"); // Added activeTab state
	const [isMobile, setIsMobile] = useState(false); // State for mobile detection

	// Stats State
	const [totalStories, setTotalStories] = useState(null);
	const [totalUsers, setTotalUsers] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);

	// Calculate the number of supported languages
	const numberOfLanguages = languages.length;

	// Effect for mobile detection on mount and for loading story parameters from URL
	useEffect(() => {
		const checkIsMobile = () => {
			const touchSupported =
				"ontouchstart" in window || navigator.maxTouchPoints > 0;
			setIsMobile(touchSupported);
		};
		checkIsMobile();

		// Load story parameters from URL
		const params = new URLSearchParams(window.location.search);
		const sharedDesc = params.get("desc");
		const sharedSL = params.get("sl");
		const sharedTL = params.get("tl");
		const sharedDI = params.get("di");
		const sharedLI = params.get("li");

		if (sharedDesc) {
			setDescription(decodeURIComponent(sharedDesc));
		}
		if (sharedSL) {
			setSourceLang(decodeURIComponent(sharedSL));
		}
		if (sharedTL) {
			setTargetLang(decodeURIComponent(sharedTL));
		}
		if (sharedDI) {
			const di = parseInt(sharedDI, 10);
			if (!isNaN(di) && di >= 0 && di < difficultyMap.length) {
				setDifficultyIndex(di);
			}
		}
		if (sharedLI) {
			const li = parseInt(sharedLI, 10);
			if (!isNaN(li) && li >= 0 && li < lengthMap.length) {
				setLengthIndex(li);
			}
		}
	}, []); // Empty dependency array ensures this runs only once on mount

	// Effect to load site statistics
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

	const handleSubmit = (e) => {
		e.preventDefault();

		// Check if user is logged in
		if (!currentUser) {
			setActiveTab("signup"); // Set to signup for new users
			setShowAuthDialog(true); // Show login/signup dialog
			return; // Stop submission
		}

		// If logged in, proceed with original submission logic
		if (description.trim() && !isLoading) {
			// Get string values from map using current index
			const difficulty = difficultyMap[difficultyIndex];
			const storyLength = lengthMap[lengthIndex];
			onSubmit(description, sourceLang, targetLang, difficulty, storyLength);
		}
	};

	// Function to handle example button click
	const handleExampleClick = (exampleText) => {
		setDescription(exampleText);
	};

	// Function to handle random example button click
	const handleRandomExampleClick = () => {
		const randomIndex = Math.floor(Math.random() * storyExamples.length);
		setDescription(storyExamples[randomIndex]);
	};

	return (
		<>
			{/* Site Stats and Badge Section */}
			<div className="text-center">
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
						className="aspect-auto w-48 mb-4"
					/>
				</a>
			</div>
			<style>{`
				.custom-select {
					background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: right 0.75rem center;
					background-size: 16px 12px;
					padding-right: 2.5rem;
				}
				
				.custom-range {
					-webkit-appearance: none;
					height: 0.5rem;
					border-radius: 0.5rem;
					background-color: #e0e0e0;
				}
				
				.custom-range::-webkit-slider-thumb {
					-webkit-appearance: none;
					width: 18px;
					height: 18px;
					border-radius: 50%;
					background-color: #f59e0b;
					box-shadow: 0 1px 2px rgba(0,0,0,0.1);
					cursor: pointer;
					margin-top: -6px;
				}
				
				.custom-range::-moz-range-thumb {
					width: 18px;
					height: 18px;
					border-radius: 50%;
					background-color: #f59e0b;
					box-shadow: 0 1px 2px rgba(0,0,0,0.1);
					cursor: pointer;
					border: none;
				}
				
				.custom-range:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}
				
				.status-pill {
					padding: 0.125rem 0.625rem;
					font-size: 0.875rem;
					font-weight: 500;
					color: #b45309;
				}
			`}</style>
			<form onSubmit={handleSubmit} className="input-form">
				<p
					style={{
						textAlign: "center",
						fontSize: "1rem",
						color: "#666",
						marginBottom: "1.5rem",
					}}
				>
					Craft <b>your story</b> to learn a language
				</p>

				<img
					src={duobookImg}
					alt="DuoBook"
					style={{
						display: "block", // Needed for auto margins to work
						maxWidth: "80%", // Adjust percentage as needed
						margin: "0 auto 1.5rem auto", // Center horizontally, keep bottom margin
					}}
				/>

				{/* Section 1: Story Idea */}
				<fieldset className="form-section mb-0">
					<legend className="form-section-title">Story Idea</legend>
					<label
						htmlFor="storyDescription"
						className="form-label visually-hidden"
					>
						Story Description:
					</label>
					<textarea
						id="storyDescription"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Describe the story or click an example below..."
						rows={4}
						disabled={isLoading}
						className="input-textarea"
						aria-describedby="story-helper-text story-examples"
					/>

					{/* Example Prompts Section */}
					<div className="text-center">
						{/* Container for all helper buttons */}
						<div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:items-center">
							{storyExamples.slice(0, 2).map((example, index) => (
								<button
									key={index}
									type="button"
									onClick={() => handleExampleClick(example)}
									className="px-4 py-2.5 text-xs font-normal  text-orange-800 border border-orange-800 rounded-md hover:bg-orange-800 hover:text-white focus:outline-none transition-colors flex items-center gap-1.5"
									disabled={isLoading}
								>
									<span>
										{example.length > 35
											? example.substring(0, 32) + "..."
											: example}
									</span>
								</button>
							))}
							<button
								type="button"
								onClick={handleRandomExampleClick}
								className="px-4 py-2.5 text-xs font-normal  text-orange-800 border border-orange-800 rounded-md hover:bg-orange-800 hover:text-white focus:outline-none transition-colors flex items-center gap-1.5"
								disabled={isLoading}
							>
								<Shuffle className="w-3.5 h-3.5" />
								<span>Random Idea</span>
							</button>
						</div>
					</div>
				</fieldset>

				{/* Section 2: Languages */}
				<fieldset className="form-section">
					<legend className="form-section-title">Languages</legend>
					<div className="md:flex md:space-x-4 space-y-4 md:space-y-0">
						<div className="flex-1">
							<label
								htmlFor="sourceLang"
								className="block text-sm font-medium mb-2"
							>
								Your Language:
							</label>
							<select
								id="sourceLang"
								value={sourceLang}
								onChange={(e) => setSourceLang(e.target.value)}
								className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white custom-select"
								disabled={isLoading}
							>
								{languages.map((lang) => (
									<option key={lang.value} value={lang.value}>
										{lang.label}
									</option>
								))}
							</select>
						</div>
						<div className="flex-1">
							<label
								htmlFor="targetLang"
								className="block text-sm font-medium mb-2"
							>
								Language to Learn:
							</label>
							<select
								id="targetLang"
								value={targetLang}
								onChange={(e) => setTargetLang(e.target.value)}
								className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white custom-select"
								disabled={isLoading}
							>
								{languages
									.filter((lang) => lang.value !== sourceLang)
									.map((lang) => (
										<option key={lang.value} value={lang.value}>
											{lang.label}
										</option>
									))}
							</select>
							{sourceLang === targetLang && (
								<p className="mt-1 text-xs text-rose-500">
									Please select different languages
								</p>
							)}
						</div>
					</div>
				</fieldset>

				{/* Section 3: Story Settings */}
				<fieldset className="form-section mt-6">
					<legend className="form-section-title">Story Settings</legend>
					<div className="space-y-6">
						<div className="px-1">
							<div className="flex justify-between">
								<label
									htmlFor="difficulty"
									className="block text-sm font-medium"
								>
									Difficulty:
								</label>
								{/* <span className="status-pill">
									{difficultyLabels[difficultyIndex]}
								</span> */}
							</div>
							<div className="relative pt-1">
								<input
									type="range"
									id="difficulty"
									min="0"
									max="2"
									step="1"
									value={difficultyIndex}
									onChange={(e) =>
										setDifficultyIndex(parseInt(e.target.value, 10))
									}
									className="w-full custom-range"
									disabled={isLoading}
								/>
								<div className="flex justify-between text-xs text-gray-500 mt-1.5 px-0.5">
									<span>Beginner</span>
									<span>Intermediate</span>
									<span>Advanced</span>
								</div>
							</div>
						</div>
						<div className="px-1">
							<div className="flex justify-between">
								<label
									htmlFor="storyLength"
									className="block text-sm font-medium"
								>
									Story Length:
								</label>
								{/* <span className="status-pill">{lengthLabels[lengthIndex]}</span> */}
							</div>
							<div className="relative pt-1">
								<input
									type="range"
									id="storyLength"
									min="0"
									max="2"
									step="1"
									value={lengthIndex}
									onChange={(e) => setLengthIndex(parseInt(e.target.value, 10))}
									className="w-full custom-range"
									disabled={isLoading}
								/>
								<div className="flex justify-between text-xs text-gray-500 mt-1.5 px-0.5">
									<span>Short</span>
									<span>Medium</span>
									<span>Long</span>
								</div>
							</div>
						</div>
					</div>
				</fieldset>

				<button
					type="submit"
					disabled={
						isLoading || !description.trim() || sourceLang === targetLang
					}
					className={`button button-primary submit-button py-3 px-6 rounded-lg shadow-md transition-all duration-300 relative group ${
						isLoading || !description.trim() || sourceLang === targetLang
							? "bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
							: "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 font-medium"
					}`}
					aria-label={
						!description.trim()
							? "Please enter a story description"
							: !currentUser
							? "Please log in to create a book"
							: sourceLang === targetLang
							? "Please select different languages"
							: "Create Book"
					}
				>
					{isLoading ? (
						<span className="flex items-center justify-center">
							<svg
								className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-700"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Generating...
						</span>
					) : (
						<>
							<span className="flex items-center justify-center">
								{!isMobile && (!description.trim() || !currentUser) && (
									<span className="relative w-5 h-5 mr-2 inline-flex">
										{!description.trim() ? (
											<BookText className="w-5 h-5 text-amber-600 opacity-70" />
										) : !currentUser ? (
											<Heart className="w-5 h-5 text-amber-600 opacity-70" />
										) : null}
										<span
											className={`absolute inset-0 rounded-full ${
												!description.trim() ? "bg-amber-200" : "bg-pink-200"
											} animate-ping opacity-30`}
										></span>
									</span>
								)}
								Create Book
							</span>

							{!isMobile && (
								<div
									className={`
										absolute left-0 right-0 mx-auto w-max max-w-[90%] px-3 py-1.5
										-top-10 sm:-top-9
										rounded-full text-xs font-medium leading-tight
										bg-amber-50 border border-amber-200 text-amber-800
										shadow-sm
										opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
										group-focus:opacity-100 group-focus:scale-100
										transition-all duration-200 pointer-events-none
										flex items-center justify-center
										${description.trim() && currentUser ? "hidden" : ""}
									`}
								>
									{!description.trim() ? (
										<>
											<BookText className="inline w-3.5 h-3.5 mr-1 text-amber-500" />
											Add a story idea first
										</>
									) : !currentUser ? (
										<>
											<Heart className="inline w-3.5 h-3.5 mr-1 text-amber-500" />
											Sign in to create
										</>
									) : null}
									<svg
										className="absolute -bottom-2 h-2 w-4 text-amber-50"
										fill="currentColor"
										viewBox="0 0 24 8"
									>
										<path d="M0,0 L12,8 L24,0"></path>
									</svg>
									<svg
										className="absolute -bottom-2 h-2 w-4 text-amber-200"
										fill="none"
										stroke="currentColor"
										strokeWidth="1"
										viewBox="0 0 24 8"
									>
										<path d="M0,0 L12,8 L24,0"></path>
									</svg>
								</div>
							)}
						</>
					)}
				</button>

				{/* Mobile conditional messages */}
				{isMobile && !isLoading && !description.trim() && (
					<p className="text-center text-sm text-amber-700 mt-3 px-2">
						Please add a story idea above to create your book.
					</p>
				)}
				{isMobile && !isLoading && description.trim() && !currentUser && (
					<p className="text-center text-sm text-amber-700 mt-3 px-2">
						<button
							type="button"
							onClick={() => {
								setActiveTab("login");
								setShowAuthDialog(true);
							}}
							className="underline font-medium hover:text-amber-800"
						>
							Log in
						</button>{" "}
						or{" "}
						<button
							type="button"
							onClick={() => {
								setActiveTab("signup");
								setShowAuthDialog(true);
							}}
							className="underline font-medium hover:text-amber-800"
						>
							Sign up
						</button>{" "}
						to create your book.
					</p>
				)}

				{/* Shared conditional message (both mobile/desktop) */}
				{!isLoading && description.trim() && sourceLang === targetLang && (
					<p className="text-center text-sm text-red-600 mt-3 px-2">
						Your language and the language to learn must be different.
					</p>
				)}
			</form>

			{/* Login/Signup Dialog */}
			<Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
				<DialogContent className="sm:max-w-[425px] p-0">
					<Card className="border-none shadow-none bg-amber-50">
						<CardHeader className="text-center pb-2">
							<CardTitle>Sign in to DuoBook</CardTitle>
							<CardDescription>
								Create and save personalized stories
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex border-b mb-4">
								<button
									className={`px-4 py-2 text-sm font-medium ${
										activeTab === "login"
											? "border-b-2 border-amber-500 text-amber-800"
											: "text-gray-500 hover:text-gray-700"
									}`}
									onClick={() => setActiveTab("login")}
								>
									Login
								</button>
								<button
									className={`px-4 py-2 text-sm font-medium ${
										activeTab === "signup"
											? "border-b-2 border-amber-500 text-amber-800"
											: "text-gray-500 hover:text-gray-700"
									}`}
									onClick={() => setActiveTab("signup")}
								>
									Sign Up
								</button>
							</div>

							{activeTab === "login" ? (
								<Login onSuccess={() => setShowAuthDialog(false)} />
							) : (
								<Signup onSuccess={() => setShowAuthDialog(false)} />
							)}
						</CardContent>
					</Card>
				</DialogContent>
			</Dialog>

			{statsLoading ? (
				<p className="text-sm text-gray-500 mt-4">Loading stats...</p>
			) : (
				<div className="mt-10 border-t pt-6">
					<h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
						DuoBook Stats
					</h1>
					<div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center ">
						{totalStories !== null && (
							<div>
								<p className="text-4xl font-bold text-gray-800 dark:text-gray-200">
									{totalStories.toLocaleString()}+
								</p>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									Stories Generated
								</p>
							</div>
						)}
						{totalUsers !== null && (
							<div>
								<p className="text-4xl font-bold text-gray-800 dark:text-gray-200">
									{totalUsers.toLocaleString()}+
								</p>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									Language Learners
								</p>
							</div>
						)}
						{/* Display Number of Languages Supported */}
						<div>
							<p className="text-4xl font-bold text-gray-800 dark:text-gray-200">
								{numberOfLanguages}+
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								Languages Supported
							</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default InputForm;
