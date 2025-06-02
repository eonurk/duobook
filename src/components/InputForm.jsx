import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import Login from "@/components/Auth/Login"; // Import Login
import Signup from "@/components/Auth/Signup"; // Import Signup
import {
	BookText,
	Heart,
	Lightbulb,
	Shuffle,
	Eye,
	EyeOff,
	Settings2,
	Sparkles,
	Target,
	BookOpen,
} from "lucide-react"; // Replace existing icons with cuter alternatives & ADDED Lightbulb, Shuffle, Eye, EyeOff, Settings2, Sparkles, Target, BookOpen
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
import toast, { Toaster } from "react-hot-toast"; // Added for moderation feedback
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Label } from "@/components/ui/label"; // Import Label
import { Button } from "@/components/ui/button"; // Import Button for the new toggle
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"; // Import Select components

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
	"A young witch who accidentally swaps bodies with her cat for a day.",
	"A baker who discovers a recipe book written in a forgotten language.",
	"A child who finds a pair of glasses that let them see people's dreams.",
	"A group of friends who start a detective club to solve school mysteries.",
	"A musician who can only compose music when it rains.",
	"A gardener whose plants grow into shapes that predict the future.",
	"A teacher who wakes up in a world where students teach the classes.",
	"A dog who writes anonymous advice columns for the neighborhood pets.",
	"A scientist who invents a machine that can pause time, but only for five minutes.",
	"A family who moves into a house where the walls whisper bedtime stories.",
	"A chef who can taste people's emotions in their food.",
	"A painter whose artwork comes to life every full moon.",
	"A child who befriends a cloud and learns to control the weather.",
	"A librarian who discovers a secret society of book characters.",
	"A robot who wants to learn how to dream.",
	"A girl who can talk to shadows.",
	"A boy who finds a map that leads to a city in the clouds.",
	"A detective who solves mysteries with the help of a ghost.",
	"A baker whose cakes make people tell the truth.",
	"A young inventor who builds a machine to visit their favorite storybook worlds.",
	"A cat who dreams of becoming a famous opera singer.",
	"A child who discovers a door to a world where animals rule.",
	"A group of kids who find a magical board game that changes reality.",
	"A boy who can turn invisible but only when he sneezes.",
	"A girl who can talk to trees and learns their ancient secrets.",
	"A family who adopts a dragon as a pet.",
	"A teacher who discovers their students are actually undercover superheroes.",
	"A dog who becomes mayor of a small town.",
	"A baker who bakes bread that makes people float.",
	"A scientist who shrinks themselves to explore the world of ants.",
	"A child who finds a pen that writes the future.",
	"A group of friends who build a rocket to visit the moon.",
	"A girl who can turn into any animal she draws.",
	"A boy who discovers a secret tunnel under his bed.",
	"A musician who can play music that controls the seasons.",
	"A painter who paints doors to other worlds.",
	"A child who can talk to the wind.",
	"A family who lives in a house that moves every night.",
	"A detective who solves crimes in a city of robots.",
	"A baker who bakes cookies that grant wishes.",
	"A scientist who invents a machine to talk to plants.",
	"A girl who finds a magic mirror that shows her future.",
	"A boy who can talk to fish.",
	"A group of friends who find a treasure map in a bottle.",
	"A child who discovers a secret garden on the roof.",
	"A teacher who can read minds.",
	"A dog who dreams of flying.",
	"A baker who bakes cakes that make people sing.",
	"A scientist who invents a machine to travel through dreams.",
	"A girl who can talk to stars.",
	"A boy who finds a magic hat that grants him three wishes.",
	"A family who moves to a town where everyone has a secret.",
	"A detective who solves mysteries with the help of a talking parrot.",
	"A baker who bakes bread that makes people laugh.",
	"A scientist who invents a machine to turn invisible.",
	"A child who finds a magic key that opens any door.",
	"A group of friends who start a band with magical instruments.",
	"A girl who can talk to animals.",
	"A boy who discovers a secret world in his closet.",
	"A musician who can play music that makes people dance uncontrollably.",
	"A painter who paints pictures that tell the future.",
	"A child who can talk to the moon.",
	"A family who lives in a house made of candy.",
	"A detective who solves crimes in a city of talking animals.",
	"A baker who bakes cookies that make people fall in love.",
	"A scientist who invents a machine to travel through time.",
	"A girl who finds a magic book that writes itself.",
	"A boy who can talk to birds.",
	"A group of friends who find a secret passage in the library.",
	"A child who discovers a hidden world in the attic.",
	"A teacher who can teleport.",
	"A dog who dreams of becoming a detective.",
	"A baker who bakes cakes that make people remember their dreams.",
	"A scientist who invents a machine to talk to ghosts.",
	"A girl who can talk to rainbows.",
	"A boy who finds a magic coin that brings good luck.",
	"A family who moves to a town where it never stops snowing.",
	"A detective who solves mysteries with the help of a magical notebook.",
	"A baker who bakes bread that makes people tell their secrets.",
	"A scientist who invents a machine to shrink objects.",
	"A child who finds a magic whistle that calls mythical creatures.",
	"A group of friends who build a treehouse that can fly.",
	"A girl who can talk to insects.",
	"A boy who discovers a secret world in his backyard.",
	"A musician who can play music that changes the weather.",
	"A painter who paints pictures that come to life.",
	"A child who can talk to mountains.",
	"A family who lives in a house that floats on a lake.",
	"A detective who solves crimes in a city of wizards.",
	"A baker who bakes cookies that make people invisible.",
	"A scientist who invents a machine to swap bodies.",
	"A girl who finds a magic ring that grants her superpowers.",
	"A boy who can talk to wolves.",
	"A group of friends who find a secret island.",
	"A child who discovers a hidden world in the basement.",
	"A teacher who can fly.",
	"A dog who dreams of becoming a superhero.",
	"A baker who bakes cakes that make people fall asleep and dream happy dreams.",
	"A scientist who invents a machine to talk to stars.",
	"A girl who can talk to rivers.",
	"A boy who finds a magic pencil that draws real objects.",
	"A family who moves to a town where everyone has a magical pet.",
	"A detective who solves mysteries with the help of a time-traveling cat.",
];

const genres = [
	{ value: "fantasy", label: "Fantasy" },
	{ value: "sci-fi", label: "Sci-Fi" },
	{ value: "mystery", label: "Mystery" },
	{ value: "romance", label: "Romance" },
	{ value: "adventure", label: "Adventure" },
	{ value: "historical", label: "Historical Fiction" },
	{ value: "slice-of-life", label: "Slice of Life" },
	{ value: "comedy", label: "Comedy" },
	{ value: "horror", label: "Horror" },
	{ value: "thriller", label: "Thriller" },
	{ value: "childrens", label: "Children's Story" },
];

const grammarFocusOptions = [
	{ value: "past-tenses", label: "Emphasize Past Tenses" },
	{ value: "future-tenses", label: "Emphasize Future Tenses" },
	{ value: "conditionals", label: "Include Conditional Sentences" },
	{ value: "questions", label: "Include Comprehension Questions" },
	{ value: "dialogue", label: "Emphasize Dialogue" },
	{ value: "idioms", label: "Use Idiomatic Expressions" },
	{ value: "phrasal-verbs", label: "Use Phrasal Verbs" },
	{ value: "vocabulary", label: "Focus on Thematic Vocabulary" },
	{ value: "simple-grammar", label: "Use Simple Grammar" },
	{ value: "complex-grammar", label: "Use Complex Grammar" },
];

function InputForm({
	onSubmit,
	isLoading,
	userSubscriptionTier,
	apiErrorDetails,
}) {
	// Added apiErrorDetails prop
	const { currentUser } = useAuth(); // Get current user
	const [description, setDescription] = useState("");
	const [sourceLang, setSourceLang] = useState("English"); // Default source: English
	const [targetLang, setTargetLang] = useState("Spanish"); // Default target: Spanish
	// Use numeric state for sliders, map back to string for submission
	const [difficultyIndex, setDifficultyIndex] = useState(0); // 0: Beginner, 1: Intermediate, 2: Advanced
	const [lengthIndex, setLengthIndex] = useState(0); // 0: Short, 1: Medium, 2: Long
	const [isPublic, setIsPublic] = useState(true); // New state for story privacy, default to true (public)
	const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // State for advanced settings visibility
	const [showAuthDialog, setShowAuthDialog] = useState(false); // State for dialog
	const [activeTab, setActiveTab] = useState("login"); // Added activeTab state
	const [isMobile, setIsMobile] = useState(false); // State for mobile detection
	const [selectedGenre, setSelectedGenre] = useState(""); // State for selected genre
	const [selectedGrammarFocus, setSelectedGrammarFocus] = useState([]); // State for selected grammar focus (can be multiple)

	// Dynamically define lengthMap based on subscription tier, memoized
	const lengthMap = useMemo(() => {
		const baseLengthMap = ["Short", "Medium", "Long"];
		if (userSubscriptionTier === "PRO") {
			return [...baseLengthMap, "very_long_pro"];
		}
		return baseLengthMap;
	}, [userSubscriptionTier]);

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
	}, [lengthMap]); // Added lengthMap to dependency array

	// Effect to ensure lengthIndex stays within bounds if lengthMap changes
	useEffect(() => {
		if (lengthIndex >= lengthMap.length) {
			setLengthIndex(lengthMap.length - 1);
		}
	}, [lengthMap, lengthIndex]);

	// Effect for displaying API error toasts (e.g., moderation feedback)
	useEffect(() => {
		if (
			apiErrorDetails &&
			(apiErrorDetails.message || apiErrorDetails.warningMessage)
		) {
			if (apiErrorDetails.userBanned) {
				toast.error(
					apiErrorDetails.message ||
						"Your account has been banned due to content policy violations.",
					{
						duration: 10000,
					}
				);
			} else if (apiErrorDetails.warningMessage) {
				toast(
					apiErrorDetails.warningMessage +
						(apiErrorDetails.moderationWarnings
							? ` (Total warnings: ${apiErrorDetails.moderationWarnings})`
							: ""),
					{
						duration: 8000,
						// icon: '⚠️', // Example: You can add an icon for warnings
					}
				);
			} else if (apiErrorDetails.message) {
				// Generic error
				toast.error(apiErrorDetails.message, {
					duration: 8000,
				});
			}
		}
	}, [apiErrorDetails]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!currentUser) {
			setShowAuthDialog(true);
			return;
		}
		if (!description.trim()) {
			toast.error("Please enter a story description.");
			return;
		}
		const difficulty = difficultyMap[difficultyIndex];
		const storyLength = lengthMap[lengthIndex];
		onSubmit(
			description,
			sourceLang,
			targetLang,
			difficulty,
			storyLength,
			isPublic,
			selectedGenre, // Pass selected genre
			selectedGrammarFocus // Pass selected grammar focus
		);
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
					height: 0.75rem;
					border-radius: 0.5rem;
					background-color: #e0f2fe;
					outline: none;
				}
				
				.custom-range::-webkit-slider-thumb {
					-webkit-appearance: none;
					width: 28px;
					height: 28px;
					border-radius: 50%;
					background-color: #0891b2;
					box-shadow: 0 2px 6px rgba(0,0,0,0.15);
					cursor: pointer;
					margin-top: -8px;
					transition: all 0.2s ease;
				}
				
				.custom-range::-webkit-slider-thumb:hover {
					transform: scale(1.1);
					background-color: #0e7490;
					box-shadow: 0 3px 8px rgba(0,0,0,0.2);
				}
				
				.custom-range::-webkit-slider-thumb:active {
					transform: scale(1.2);
					background-color: #155e75;
				}
				
				.custom-range::-moz-range-thumb {
					width: 28px;
					height: 28px;
					border-radius: 50%;
					background-color: #0891b2;
					box-shadow: 0 2px 6px rgba(0,0,0,0.15);
					cursor: pointer;
					border: none;
					transition: all 0.2s ease;
				}
				
				.custom-range::-moz-range-thumb:hover {
					transform: scale(1.1);
					background-color: #0e7490;
				}
				
				.custom-range::-moz-range-thumb:active {
					transform: scale(1.2);
					background-color: #155e75;
				}
				
				/* Mobile-specific enhancements */
				@media (max-width: 768px) {
					.custom-range {
						height: 1rem;
						touch-action: manipulation;
						padding: 8px 0; /* Increase touch target area */
					}
					
					.custom-range::-webkit-slider-thumb {
						width: 24px;
						height: 24px;
						margin-top: 0px;
					}
					
					.custom-range::-moz-range-thumb {
						width: 24px;
						height: 24px;
						margin-top: 0px;
					}
					
					/* Add larger touch targets for mobile */
					.slider-container {
						padding: 12px 0;
						margin: 8px 0;
					}
					
					.slider-container:active {
						background-color: rgba(245, 158, 11, 0.05);
						border-radius: 8px;
					}
				}
				
				/* Add visual feedback for slider interaction */
				.custom-range:focus {
					outline: none;
					box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
					border-radius: 0.5rem;
				}
				
				.custom-range:active {
					background-color: #bae6fd;
				}
				
				.custom-range:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}
				
				.status-pill {
					padding: 0.125rem 0.625rem;
					font-size: 0.875rem;
					font-weight: 500;
					color: #0e7490;
				}
			`}</style>

			<form
				onSubmit={handleSubmit}
				className="input-form"
				id="input-form-section"
			>
				{/* Value Proposition Section for Non-Authenticated Users */}

				<p
					style={{
						textAlign: "center",
						fontSize: "1rem",
						color: "#0f172a",
						marginBottom: "0.5rem",
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
									className="px-4 py-2.5 text-xs font-normal  text-blue-800 border border-blue-800 rounded-md hover:bg-blue-800 hover:text-white focus:outline-none transition-colors flex items-center gap-1.5"
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
								className="px-4 py-2.5 text-xs font-normal  text-blue-800 border border-blue-800 rounded-md hover:bg-blue-800 hover:text-white focus:outline-none transition-colors flex items-center gap-1.5"
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
						<div className={`px-1 ${isMobile ? "py-2" : ""}`}>
							<div className="flex justify-between items-center mb-3">
								<label
									htmlFor="difficulty"
									className={`block font-medium ${
										isMobile ? "text-base" : "text-sm"
									}`}
								>
									Difficulty:
								</label>
							</div>
							<div className={`relative ${isMobile ? "pt-2 pb-1" : "pt-1"}`}>
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
									className={`w-full custom-range ${isMobile ? "py-2" : ""}`}
									disabled={isLoading}
									style={
										isMobile
											? {
													WebkitTapHighlightColor: "transparent",
											  }
											: {}
									}
								/>
								<div
									className={`flex justify-between text-gray-500 ${
										isMobile ? "text-sm mt-3" : "text-xs mt-1.5"
									}`}
								>
									<span
										className={
											difficultyIndex === 0
												? "font-semibold text-amber-600"
												: ""
										}
									>
										Beginner
									</span>
									<span
										className={
											difficultyIndex === 1
												? "font-semibold text-amber-600"
												: ""
										}
									>
										Intermediate
									</span>
									<span
										className={
											difficultyIndex === 2
												? "font-semibold text-amber-600"
												: ""
										}
									>
										Advanced
									</span>
								</div>
							</div>
						</div>
						<div className={`px-1 ${isMobile ? "py-2" : ""}`}>
							<div className="flex justify-between items-center mb-3">
								<label
									htmlFor="storyLength"
									className={`block font-medium ${
										isMobile ? "text-base" : "text-sm"
									}`}
								>
									Story Length:
								</label>
							</div>
							<div className={`relative ${isMobile ? "pt-2 pb-1" : "pt-1"}`}>
								<input
									type="range"
									id="storyLength"
									min="0"
									max={lengthMap.length - 1}
									value={lengthIndex}
									onChange={(e) => setLengthIndex(parseInt(e.target.value))}
									className={`w-full custom-range ${isMobile ? "py-2" : ""}`}
									disabled={isLoading}
									style={
										isMobile
											? {
													WebkitTapHighlightColor: "transparent",
											  }
											: {}
									}
								/>
								{/* Story Length Labels - Mobile-Optimized Implementation */}
								<div
									className={`relative w-full text-gray-500 ${
										isMobile ? "text-sm mt-3 h-7" : "text-xs mt-1.5 h-6"
									}`}
								>
									{lengthMap.map((label, index) => {
										const numLabels = lengthMap.length;
										let style = {};
										let textAlignmentClass = "";
										const isSelected = lengthIndex === index;

										if (numLabels === 1) {
											style = { left: "50%", transform: "translateX(-50%)" };
											textAlignmentClass = "text-center";
										} else {
											const positionPercent = (index / (numLabels - 1)) * 100;
											if (index === 0) {
												style = { left: "0%", transform: "translateX(0%)" };
												textAlignmentClass = "text-left";
											} else if (index === numLabels - 1) {
												style = {
													left: "100%",
													transform: "translateX(-100%)",
												};
												textAlignmentClass = "text-right";
											} else {
												style = {
													left: `${positionPercent}%`,
													transform: "translateX(-50%)",
												};
												textAlignmentClass = "text-center";
											}
										}

										return (
											<span
												key={label}
												className={`absolute ${textAlignmentClass} transition-all duration-200 ${
													isSelected ? "font-semibold text-blue-600" : ""
												}`}
												style={style}
											>
												{label === "very_long_pro" ? (
													<span
														className={`bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md shadow-md whitespace-nowrap ${
															isMobile ? "px-3 py-1.5 text-sm" : "px-2.5 py-1"
														} ${isSelected ? "ring-2 ring-purple-300" : ""}`}
													>
														XL
													</span>
												) : (
													<span
														className={`whitespace-nowrap ${
															isSelected && isMobile
																? "px-2 py-1 bg-blue-50 rounded-md"
																: ""
														}`}
													>
														{label}
													</span>
												)}
											</span>
										);
									})}
								</div>
							</div>
						</div>
						{/* Toggle for Advanced Settings */}
						{
							<div className="text-center">
								<Button
									type="button"
									variant="ghost"
									className="text-sm text-slate-500 hover:text-slate-800"
									onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
								>
									<Settings2 className="h-4 w-4 mr-1" />
									{showAdvancedSettings ? "Hide" : "Show"} Advanced Options
								</Button>
							</div>
						}

						{/* Advanced Settings Section (conditionally rendered) */}
						{showAdvancedSettings && (
							<div className="pt-4 mt-4 border-t border-gray-200 space-y-4">
								{/* Genre Selection */}
								<div>
									<Label
										htmlFor="genre-select"
										className="block text-sm font-medium mb-1 text-gray-700 text-center"
									>
										Story Genre
									</Label>
									<Select
										value={selectedGenre}
										onValueChange={setSelectedGenre}
									>
										<SelectTrigger
											id="genre-select"
											className="w-full text-slate-500"
										>
											<SelectValue placeholder="Select a genre (optional)" />
										</SelectTrigger>
										<SelectContent className="text-slate-500 bg-slate-50 *:text-slate-500">
											{genres.map((genre) => (
												<SelectItem key={genre.value} value={genre.value}>
													{genre.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Grammar Focus Selection */}
								<div>
									<Label
										htmlFor="grammar-focus-select"
										className="block text-sm font-medium mb-1 text-gray-700 text-center"
									>
										Grammar Focus
									</Label>
									{/* For multi-select, a component like react-select or custom checkboxes would be better */}
									{/* Using a simple select for now, can be changed to multi-select later */}
									<Select
										value={
											selectedGrammarFocus.length > 0
												? selectedGrammarFocus[0]
												: ""
										}
										onValueChange={(value) =>
											setSelectedGrammarFocus(value ? [value] : [])
										}
									>
										<SelectTrigger
											id="grammar-focus-select"
											className="w-full text-slate-500"
										>
											<SelectValue placeholder="Select grammar focus (optional)" />
										</SelectTrigger>
										<SelectContent className="text-slate-500 bg-slate-50 *:text-slate-500">
											{grammarFocusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{/* Example of how multi-select could be hinted for future: */}
									{/* <p className="text-xs text-gray-500 text-center mt-1">Hold Ctrl/Cmd to select multiple.</p> */}
								</div>

								{/* Story Privacy Toggle */}
								<div className="mb-4 mt-6 flex flex-col items-center">
									<Label
										htmlFor="story-privacy"
										className="block text-sm font-medium mb-1 text-gray-700 text-center"
									>
										Story Privacy
									</Label>
									<div className="flex items-center gap-3 rounded-lg px-3 py-2 justify-center">
										<Switch
											id="story-privacy"
											checked={isPublic}
											onCheckedChange={setIsPublic}
											aria-label={
												isPublic
													? "Story will be public"
													: "Story will be private"
											}
											className="scale-90"
										/>
										<span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
											{isPublic ? (
												<>
													<Eye className="h-4 w-4 " />
													<span className="font-semibold text-slate-700">
														Public
													</span>
													<span className="hidden sm:inline text-gray-500 ml-1">
														(help others learn)
													</span>
												</>
											) : (
												<>
													<EyeOff className="h-4 w-4 text-gray-400" />
													<span className="font-semibold text-gray-600">
														Private
													</span>
													<span className="hidden sm:inline text-gray-400 ml-1">
														(only you can see)
													</span>
												</>
											)}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</fieldset>

				{/* Enhanced mobile authentication prompt */}
				{!currentUser && (
					<div className={`text-center mt-6 mb-4`}>
						<div
							className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl ${
								isMobile ? "p-4" : "p-6"
							} shadow-sm`}
						>
							<div className="flex flex-col items-center space-y-3">
								<div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
									<Heart className="w-6 h-6 text-white" />
								</div>
								<div className="text-center">
									<h3
										className={`font-semibold text-amber-800 ${
											isMobile ? "text-base" : "text-lg"
										} mb-2`}
									>
										Ready to Create Your Story?
									</h3>
									<p
										className={`text-amber-700 ${
											isMobile ? "text-sm" : "text-base"
										} mb-4`}
									>
										Sign up to create and save personalized stories. It's
										completely free!
									</p>
									<div
										className={`flex ${
											isMobile
												? "flex-col space-y-2"
												: "flex-row justify-center space-x-3"
										}`}
									>
										<button
											type="button"
											onClick={() => {
												setActiveTab("signup");
												setShowAuthDialog(true);
											}}
											className={`${
												isMobile ? "w-full" : ""
											} px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-all duration-200 transform hover:scale-105 shadow-md`}
										>
											Sign Up Free
										</button>
										<button
											type="button"
											onClick={() => {
												setActiveTab("login");
												setShowAuthDialog(true);
											}}
											className={`${
												isMobile ? "w-full" : ""
											} px-6 py-3 border border-amber-300 text-amber-700 font-medium rounded-lg hover:bg-amber-50 transition-all duration-200`}
										>
											Log In
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				<button
					type="submit"
					disabled={
						// Updated disabled logic
						isLoading ||
						!description.trim() ||
						sourceLang === targetLang ||
						!currentUser
					}
					className={`button button-primary submit-button py-3 px-6 rounded-lg shadow-md transition-all duration-300 relative group ${
						// Updated className logic
						isLoading ||
						!description.trim() ||
						sourceLang === targetLang ||
						!currentUser
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
								{(!description.trim() || !currentUser) && (
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
				{/* Subtle call-to-action to view a sample DuoBook */}
				{!currentUser && (
					<div className="flex justify-center mt-1.5">
						<button
							type="button"
							onClick={() => {
								document
									.getElementById("story-examples-section")
									?.scrollIntoView({ behavior: "smooth" });
							}}
							className="group flex items-center gap-2 text-xs text-slate-500 hover:text-orange-600 transition-colors py-1.5 px-3 rounded-full hover:bg-amber-50"
							aria-label="See a DuoBook example"
						>
							<span>
								<span className="mx-1 text-slate-500">or</span>
								<span className="underline font-semibold decoration-dotted group-hover:decoration-solid transition-all text-slate-600">
									see an example
								</span>
							</span>
						</button>
					</div>
				)}
				{isMobile && !isLoading && !description.trim() && currentUser && (
					<p className="text-center text-sm text-amber-700 mt-3 px-2">
						Please add a story idea above to create your book.
					</p>
				)}
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
		</>
	);
}

export default InputForm;
