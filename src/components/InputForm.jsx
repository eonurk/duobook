import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import Login from "@/components/Auth/Login"; // Import Login
import Signup from "@/components/Auth/Signup"; // Import Signup
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
const difficultyLabels = [
	"Beginner (A1/A2)",
	"Intermediate (B1/B2)",
	"Advanced (C1/C2)",
];
const lengthMap = ["Short", "Medium", "Long"];
const lengthLabels = [
	"Short (~3-4 paragraphs)",
	"Medium (~5-7 paragraphs)",
	"Long (~8-10+ paragraphs)", // Increased target for Long
];

// Examples Array
const storyExamples = [
	"A lost puppy looking for its owner in a busy city.",
	"A cooking competition where the main ingredient is magical mushrooms.",
	"A lonely robot on Mars who discovers a hidden garden.",
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

	return (
		<>
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
				<fieldset className="form-section">
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

					<div id="story-examples" className="form-examples">
						<ul className="example-list">
							{storyExamples.map((example, index) => (
								<li
									key={index}
									className="example-list-item"
									onClick={() => !isLoading && handleExampleClick(example)}
									role="button"
									tabIndex={isLoading ? -1 : 0}
									onKeyDown={(e) => {
										if (!isLoading && (e.key === "Enter" || e.key === " ")) {
											handleExampleClick(example);
										}
									}}
								>
									{example}
								</li>
							))}
						</ul>
					</div>
				</fieldset>

				{/* Section 2: Languages */}
				<fieldset className="form-section">
					<legend className="form-section-title">Languages</legend>
					<div className="language-select-container">
						<div>
							<label htmlFor="sourceLang" className="form-label">
								Your Language:
							</label>
							<select
								id="sourceLang"
								value={sourceLang}
								onChange={(e) => setSourceLang(e.target.value)}
								className="input-select"
								disabled={isLoading}
							>
								{languages.map((lang) => (
									<option key={lang.value} value={lang.value}>
										{lang.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="targetLang" className="form-label">
								Language to Learn:
							</label>
							<select
								id="targetLang"
								value={targetLang}
								onChange={(e) => setTargetLang(e.target.value)}
								className="input-select"
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
						</div>
					</div>
				</fieldset>

				{/* Section 3: Story Settings */}
				<fieldset className="form-section">
					<legend className="form-section-title">Story Settings</legend>
					<div className="slider-container">
						<div className="slider-item">
							<label htmlFor="difficulty" className="form-label">
								Difficulty:{" "}
								<span className="slider-value">
									{difficultyLabels[difficultyIndex]}
								</span>
							</label>
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
								className="input-range"
								disabled={isLoading}
							/>
						</div>
						<div className="slider-item">
							<label htmlFor="storyLength" className="form-label">
								Story Length:{" "}
								<span className="slider-value">
									{lengthLabels[lengthIndex]}
								</span>
							</label>
							<input
								type="range"
								id="storyLength"
								min="0"
								max="2"
								step="1"
								value={lengthIndex}
								onChange={(e) => setLengthIndex(parseInt(e.target.value, 10))}
								className="input-range"
								disabled={isLoading}
							/>
						</div>
					</div>
				</fieldset>

				<button
					type="submit"
					disabled={
						isLoading || !description.trim() || sourceLang === targetLang
					}
					className="button button-primary submit-button bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200"
				>
					{isLoading ? "Generating..." : "Create Book"}
				</button>
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
