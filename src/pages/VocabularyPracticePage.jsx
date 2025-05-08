import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStories } from "@/lib/api";
import {
	Loader2,
	ArrowRight,
	CheckCircle,
	RotateCcw,
	AlertTriangle,
	Play,
	Volume2,
	VolumeX,
	Flame,
	Target,
	Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // For conditional classes
import confetti from "canvas-confetti"; // Import confetti
import { trackPractice } from "@/lib/analytics"; // Import analytics tracking
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { Label } from "@/components/ui/label"; // Import Label
import { Input } from "@/components/ui/input"; // Import Input

// Quiz Constants
const QUIZ_LENGTH = 10; // Max words per quiz session
const POINTS_PER_CORRECT = 5;
const COMPLETION_BONUS_XP = 25;
const MIN_WORDS_FOR_QUIZ = 4; // Define minimum words needed

// --- Sound URLs (ASSUMED) ---
const CORRECT_SOUND_URL = "/sounds/correct.mp3";
const INCORRECT_SOUND_URL = "/sounds/incorrect.mp3";
const COMPLETE_SOUND_URL = "/sounds/complete.mp3";

// --- TTS Helper Code (Adapted from BookView) ---
const langNameToCode = {
	english: "en-US",
	spanish: "es-ES",
	french: "fr-FR",
	german: "de-DE",
	italian: "it-IT",
	portuguese: "pt-PT",
	dutch: "nl-NL",
	russian: "ru-RU",
	"chinese (simplified)": "zh-CN",
	japanese: "ja-JP",
	korean: "ko-KR",
	arabic: "ar",
	hindi: "hi-IN",
	turkish: "tr-TR",
	swedish: "sv-SE",
	norwegian: "no-NO",
	danish: "da-DK",
	polish: "pl-PL",
};
const preferredVoices = {
	"en-US": ["Google US English", "Microsoft Zira", "Samantha"],
	"es-ES": ["Google español", "Microsoft Helena", "Monica", "Juan"],
	"fr-FR": ["Google français", "Microsoft Julie", "Thomas", "Amelie"],
	"de-DE": ["Google Deutsch", "Microsoft Hedda", "Anna"],
	"it-IT": ["Google italiano", "Microsoft Elsa", "Alice"],
	"ja-JP": ["Google 日本語", "Microsoft Ayumi", "Kyoko"],
	"zh-CN": ["Google 普通话（中国大陆）", "Microsoft Yaoyao", "Tingting"],
};
const getLangCode = (langName) => {
	return langNameToCode[langName?.toLowerCase() || ""] || "en-US";
};
const getBestVoiceForLanguage = (voices, langCode) => {
	if (!voices || voices.length === 0) return null;
	if (preferredVoices[langCode]) {
		for (const preferredName of preferredVoices[langCode]) {
			const preferredVoice = voices.find(
				(voice) =>
					voice.name.includes(preferredName) ||
					voice.voiceURI.includes(preferredName)
			);
			if (preferredVoice) return preferredVoice;
		}
	}
	const exactMatch = voices.find((voice) => voice.lang === langCode);
	if (exactMatch) return exactMatch;
	const baseCode = langCode.split("-")[0];
	const baseMatch = voices.find((voice) => voice.lang.startsWith(baseCode));
	if (baseMatch) return baseMatch;
	return voices.find((voice) => voice.default) || voices[0];
};
// --- End TTS Helper Code ---

// Helper function to shuffle an array
function shuffleArray(array) {
	let currentIndex = array.length,
		randomIndex;
	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}
	return array;
}

// --- Sound Player Helper ---
const playSound = (soundUrl, isMuted) => {
	if (isMuted) return;
	try {
		const audio = new Audio(soundUrl);
		audio
			.play()
			.catch((error) =>
				console.error(`Error playing sound ${soundUrl}:`, error)
			); // Add error handling for play()
	} catch (error) {
		console.error(`Error creating audio for ${soundUrl}:`, error);
	}
};
// --- End Sound Player Helper ---

function VocabularyPracticePage() {
	const { currentUser, userProgress, updateProgressData } = useAuth();
	const [vocabularyList, setVocabularyList] = useState([]); // Original fetched list (with language)
	const [shuffledList, setShuffledList] = useState([]); // Shuffled list for the active quiz
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null); // Error specific to loading or quiz prep
	const [isQuizActive, setIsQuizActive] = useState(false); // State to control quiz visibility

	// --- Quiz State (only relevant when isQuizActive is true) ---
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [currentOptions, setCurrentOptions] = useState([]);
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [isAnswered, setIsAnswered] = useState(false);
	const [feedback, setFeedback] = useState("");
	const [score, setScore] = useState(0);
	const [quizCompleted, setQuizCompleted] = useState(false);
	const [animateTrigger, setAnimateTrigger] = useState(0);
	const [incorrectAnswers, setIncorrectAnswers] = useState([]);
	const [showReview, setShowReview] = useState(false);
	const [correctStreak, setCorrectStreak] = useState(0); // Add streak state
	const [quizMode, setQuizMode] = useState("multipleChoice"); // Add quiz mode state ('multipleChoice', 'typing')
	const [typedAnswer, setTypedAnswer] = useState(""); // State for the user's typed input
	const [applyShake, setApplyShake] = useState(false); // State to trigger shake animation
	const [isMuted, setIsMuted] = useState(false); // State for sound effects mute
	// --- TTS State ---
	const [voices, setVoices] = useState([]);
	const [ttsReady, setTtsReady] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false); // Track speaking state
	const synth = window.speechSynthesis;
	// --- Setup State ---
	const [selectedLanguage, setSelectedLanguage] = useState("All");
	const [availableLanguages, setAvailableLanguages] = useState([]);
	const [canStartQuiz, setCanStartQuiz] = useState(false); // To enable/disable start button
	// -----------------

	// Calculate progress percentage (based on actual quiz length)
	const progressPercent =
		shuffledList.length > 0 && isQuizActive
			? ((currentQuestionIndex + (quizCompleted ? 1 : 0)) /
					shuffledList.length) *
			  100
			: 0;

	// Effect to fetch data on mount or user change
	useEffect(() => {
		if (currentUser) {
			setIsLoading(true);
			setError(null);
			setIsQuizActive(false); // Ensure quiz is not active on load/user change
			setVocabularyList([]); // Clear previous vocab
			setVoices([]);
			setTtsReady(false);
			setCanStartQuiz(false);

			getStories()
				.then((storiesFromApi) => {
					const allVocab = storiesFromApi.reduce((acc, story) => {
						try {
							const storyData = JSON.parse(story.story);
							if (storyData?.vocabulary && story.targetLanguage) {
								const validVocab = storyData.vocabulary
									.filter((v) => v && v.word && v.translation)
									.map((v) => ({
										...v,
										targetLanguage: story.targetLanguage,
										sourceLanguage: story.sourceLanguage,
									}));
								acc.push(...validVocab);
							}
						} catch (e) {
							console.error(`Failed to parse story ${story.id}:`, e);
						}
						return acc;
					}, []);

					// Deduplicate vocabulary list (keeping language tag)
					const uniqueVocabMap = new Map();
					allVocab.forEach((item) => {
						if (
							item &&
							item.word &&
							item.translation &&
							!uniqueVocabMap.has(`${item.word}-${item.targetLanguage}`)
						) {
							uniqueVocabMap.set(`${item.word}-${item.targetLanguage}`, item);
						}
					});
					const uniqueVocab = Array.from(uniqueVocabMap.values());
					setVocabularyList(uniqueVocab);

					// Extract available languages
					const languages = [
						...new Set(
							uniqueVocab.map((v) => v.targetLanguage).filter(Boolean)
						),
					];
					setAvailableLanguages(languages.sort());

					// Check if quiz can start with default "All"
					checkIfCanStart(uniqueVocab, "All");
				})
				.catch((err) => {
					console.error("Error fetching stories for practice:", err);
					setError(err.message || "Failed to load vocabulary.");
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			setIsLoading(false);
			setVocabularyList([]);
			setShuffledList([]);
			setIsQuizActive(false);
		}
	}, [currentUser]);

	// --- TTS Effects (Adapted from BookView) ---
	const populateVoiceList = React.useCallback(() => {
		if (!synth) return;
		const availableVoices = synth.getVoices();
		const uniqueVoices = Array.from(
			new Map(availableVoices.map((v) => [v.voiceURI, v])).values()
		);
		setVoices(uniqueVoices);
		if (uniqueVoices.length > 0) {
			setTtsReady(true);
		}
	}, [synth]);

	useEffect(() => {
		populateVoiceList();
		if (synth && synth.onvoiceschanged !== undefined) {
			synth.onvoiceschanged = populateVoiceList;
		}
		return () => {
			if (synth) {
				synth.cancel();
				synth.onvoiceschanged = null;
			}
		};
	}, [populateVoiceList, synth]);
	// --- End TTS Effects ---

	// Helper function to check if enough words exist for the selected language
	const checkIfCanStart = (list, language) => {
		let count = 0;
		if (language === "All") {
			// Need to count unique words across all languages
			const uniqueWords = new Set(list.map((v) => v.word));
			count = uniqueWords.size;
		} else {
			count = list.filter((v) => v.targetLanguage === language).length;
		}
		setCanStartQuiz(count >= MIN_WORDS_FOR_QUIZ);
		if (count < MIN_WORDS_FOR_QUIZ && !isLoading) {
			setError(
				`Not enough unique words for ${
					language === "All" ? "any language" : language
				} (minimum ${MIN_WORDS_FOR_QUIZ} needed).`
			);
		} else if (error && count >= MIN_WORDS_FOR_QUIZ) {
			setError(null); // Clear error if enough words are now available
		}
	};

	// Prepare and start the quiz
	const handleStartQuiz = () => {
		setError(null); // Clear previous errors
		let listToQuiz = vocabularyList;

		// Filter by language if not "All"
		if (selectedLanguage !== "All") {
			listToQuiz = vocabularyList.filter(
				(v) => v.targetLanguage === selectedLanguage
			);
		}

		// Deduplicate based on word only for the quiz session
		const uniqueWordMap = new Map();
		listToQuiz.forEach((item) => {
			if (!uniqueWordMap.has(item.word)) {
				uniqueWordMap.set(item.word, item);
			}
		});
		let uniqueQuizVocab = Array.from(uniqueWordMap.values());

		if (uniqueQuizVocab.length >= MIN_WORDS_FOR_QUIZ) {
			let finalQuizList = shuffleArray([...uniqueQuizVocab]);
			if (finalQuizList.length > QUIZ_LENGTH) {
				finalQuizList = finalQuizList.slice(0, QUIZ_LENGTH);
			}

			setShuffledList(finalQuizList);

			// Reset quiz-specific state before starting
			setScore(0);
			setCurrentQuestionIndex(0);
			setQuizCompleted(false);
			setIncorrectAnswers([]);
			setShowReview(false);
			setFeedback("");
			setIsAnswered(false);
			setSelectedAnswer(null);
			setTypedAnswer(""); // Reset typed answer

			setupQuestion(0, finalQuizList); // Setup the first question
			setIsQuizActive(true); // Activate the quiz UI
		} else {
			// This case should ideally be prevented by the disabled button, but good fallback
			setError(
				`Cannot start quiz. Not enough words for ${
					selectedLanguage === "All" ? "selected language(s)" : selectedLanguage
				}. Need at least ${MIN_WORDS_FOR_QUIZ}.`
			);
			setIsQuizActive(false);
		}
	};

	// Function to setup the options for a given question index
	const setupQuestion = (index, list) => {
		// This function now assumes list is valid and index is within bounds
		// The completion logic is handled in handleNextQuestion

		const correctItem = list[index];
		const correctAnswer = correctItem.translation;

		// Get potential incorrect options FROM THE SAME LANGUAGE if possible and sensible
		// For "All", options can come from any language's words (using the originally fetched list for diversity)
		let potentialIncorrectPool = vocabularyList.filter(
			(item) => item.word !== correctItem.word
		);
		if (selectedLanguage !== "All") {
			potentialIncorrectPool = potentialIncorrectPool.filter(
				(item) => item.targetLanguage === selectedLanguage
			);
		}

		const incorrectOptions = [];
		shuffleArray(potentialIncorrectPool);

		for (let item of potentialIncorrectPool) {
			if (
				item &&
				item.translation &&
				item.translation !== correctAnswer &&
				!incorrectOptions.includes(item.translation)
			) {
				incorrectOptions.push(item.translation);
				if (incorrectOptions.length >= 3) break;
			}
		}

		// Fallback if not enough unique incorrect options found
		while (incorrectOptions.length < 3) {
			// Add placeholders or find other words if necessary
			const fallbackWord = vocabularyList.find(
				(v) =>
					v.translation &&
					v.translation !== correctAnswer &&
					!incorrectOptions.includes(v.translation)
			);
			if (fallbackWord) {
				incorrectOptions.push(fallbackWord.translation);
			} else {
				// Absolute fallback - should be rare
				incorrectOptions.push(
					`Option ${incorrectOptions.length + 1 + Math.random()}`
				);
			}
		}

		const options = shuffleArray([correctAnswer, ...incorrectOptions]);

		// Set state for the current question
		setCurrentQuestionIndex(index);
		setCurrentOptions(options);
		setSelectedAnswer(null);
		setIsAnswered(false);
		setFeedback("");
		setAnimateTrigger(0);
	};

	// --- Quiz Interaction Handlers ---
	const handleOptionClick = async (option) => {
		if (isAnswered) return;

		setSelectedAnswer(option);
		setIsAnswered(true);
		setAnimateTrigger(Date.now());

		const correctItem = shuffledList[currentQuestionIndex];
		const correctAnswer = correctItem.translation;
		let awardedPoints = 0;

		if (option === correctAnswer) {
			setFeedback(`Correct! +${POINTS_PER_CORRECT} XP 🎉`);
			setScore((prevScore) => prevScore + 1);
			awardedPoints = POINTS_PER_CORRECT;
			confetti({
				/* confetti options */
			});
			playSound(CORRECT_SOUND_URL, isMuted); // Play correct sound (respect mute)
			setCorrectStreak((prev) => prev + 1); // Increment streak
		} else {
			setFeedback(`Incorrect. Correct: ${correctAnswer}`); // Simplified feedback
			setIncorrectAnswers((prev) => {
				if (!prev.some((item) => item.word === correctItem.word)) {
					return [...prev, correctItem];
				}
				return prev;
			});
			playSound(INCORRECT_SOUND_URL, isMuted); // Play incorrect sound (respect mute)
			setCorrectStreak(0); // Reset streak
			setApplyShake(true); // Trigger shake animation for incorrect typing
		}

		// Update progress via context API
		if (awardedPoints > 0 && userProgress && updateProgressData) {
			try {
				// Use await, but don't block UI for too long
				updateProgressData({ pointsToAdd: awardedPoints }); // Assuming context handles accumulation
				console.log(`Awarded ${awardedPoints} points.`);
				// Reset shake after a short delay if it was applied
				if (applyShake) setTimeout(() => setApplyShake(false), 500);
			} catch (error) {
				console.error("Failed to save points update:", error);
				// Handle error (e.g., show toast) but don't block quiz flow
			}
		}
	};

	// Handle checking the typed answer
	const handleCheckTypedAnswer = async () => {
		if (isAnswered || !typedAnswer.trim()) return;

		setIsAnswered(true);
		setAnimateTrigger(Date.now());

		const correctItem = shuffledList[currentQuestionIndex];
		const correctAnswer = correctItem.translation;
		let awardedPoints = 0;

		// Case-insensitive and trim whitespace comparison
		if (typedAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
			setFeedback(`Correct! +${POINTS_PER_CORRECT} XP 🎉`);
			setScore((prevScore) => prevScore + 1);
			awardedPoints = POINTS_PER_CORRECT;
			confetti({
				/* confetti options */
			});
			playSound(CORRECT_SOUND_URL, isMuted); // Play correct sound (respect mute)
			setCorrectStreak((prev) => prev + 1); // Increment streak
		} else {
			setFeedback(`Incorrect. Correct: ${correctAnswer}`);
			setIncorrectAnswers((prev) => {
				if (!prev.some((item) => item.word === correctItem.word)) {
					return [...prev, correctItem];
				}
				return prev;
			});
			playSound(INCORRECT_SOUND_URL, isMuted); // Play incorrect sound (respect mute)
			setCorrectStreak(0); // Reset streak
			setApplyShake(true); // Trigger shake animation for incorrect typing
		}

		// Update progress via context API
		if (awardedPoints > 0 && userProgress && updateProgressData) {
			try {
				updateProgressData({ pointsToAdd: awardedPoints });
				console.log(`Awarded ${awardedPoints} points.`);
				// Reset shake after a short delay if it was applied
				if (applyShake) setTimeout(() => setApplyShake(false), 500);
			} catch (error) {
				console.error("Failed to save points update:", error);
			}
		}
	};

	// Handle change in the typing input field
	const handleTypedAnswerChange = (event) => {
		setTypedAnswer(event.target.value);
	};

	const handleNextQuestion = async () => {
		if (!isAnswered) return;
		const nextIndex = currentQuestionIndex + 1;

		if (nextIndex < shuffledList.length) {
			// Reset answer state and setup next question
			setIsAnswered(false);
			setSelectedAnswer(null);
			setTypedAnswer(""); // Clear typed answer for next question
			setFeedback("");
			if (applyShake) setApplyShake(false); // Ensure shake is reset before next question
			setupQuestion(nextIndex, shuffledList);
		} else {
			// Quiz is finished
			setQuizCompleted(true);
			setIsQuizActive(false); // Mark quiz as no longer active, but show completion screen

			// Track completion event
			trackPractice(selectedLanguage, shuffledList.length, score);

			// Play completion sound
			playSound(COMPLETE_SOUND_URL, isMuted);

			// Award completion bonus ONLY if score is high enough
			if (score >= 8 && userProgress && updateProgressData) {
				try {
					await updateProgressData({ pointsToAdd: COMPLETION_BONUS_XP });
					console.log(
						`Awarded ${COMPLETION_BONUS_XP} completion bonus points!`
					);
					// Maybe add a specific feedback message for the bonus
				} catch (error) {
					console.error("Failed to save completion bonus:", error);
				}
			}
		}
	};

	const handleRestartQuiz = () => {
		setIsQuizActive(false); // Go back to setup screen
		setQuizCompleted(false); // Ensure completion screen is hidden
		setError(null); // Clear any previous errors
		// Re-check if quiz can start with the current selection
		checkIfCanStart(vocabularyList, selectedLanguage);
	};

	// Handle language selection change
	const handleLanguageChange = (event) => {
		const newLanguage = event.target.value;
		setSelectedLanguage(newLanguage);
		// Check if quiz can be started with the new language
		checkIfCanStart(vocabularyList, newLanguage);
		setError(null); // Clear potential "not enough words" error from previous selection
	};

	// --- TTS Speak Function ---
	const speakWord = (textToSpeak, languageName) => {
		if (!synth || !ttsReady || !textToSpeak) return;
		if (synth.speaking) synth.cancel();

		const langCode = getLangCode(languageName);
		const voiceToUse = getBestVoiceForLanguage(voices, langCode);

		if (voiceToUse) {
			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			utterance.voice = voiceToUse;
			utterance.lang = voiceToUse.lang; // Use the voice's specific lang code
			utterance.pitch = 1.0; // Keep pitch standard for vocab
			utterance.rate = 0.9; // Slightly slower rate for clarity
			utterance.volume = 1;

			utterance.onstart = () => setIsSpeaking(true);
			utterance.onend = () => setIsSpeaking(false);
			utterance.onerror = (event) => {
				console.error("Speech error:", event);
				setIsSpeaking(false);
			};

			synth.speak(utterance);
		} else {
			console.warn(
				`No suitable voice found for ${languageName} (code: ${langCode})`
			);
		}
	};
	// --- End TTS Speak Function ---

	// --- Render Logic ---

	// Loading State
	if (isLoading) {
		return (
			<div className="container mx-auto py-10 px-4 text-center">
				<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
				Loading vocabulary...
			</div>
		);
	}

	// Logged Out State
	if (!currentUser) {
		return (
			<div className="container mx-auto py-10 px-4 text-center text-muted-foreground">
				Please log in to practice vocabulary.
			</div>
		);
	}

	// No Vocabulary State (after loading)
	if (vocabularyList.length === 0 && !isLoading) {
		return (
			<div className="container mx-auto py-10 px-4 text-center text-muted-foreground">
				No vocabulary found. Generate some stories first!
			</div>
		);
	}

	// -- Render Setup or Active Quiz --
	return (
		<div className="container mx-auto px-3 py-6 sm:px-6 sm:py-8">
			<div className="flex justify-between items-center mb-6 sm:mb-8 relative">
				<div className="w-8 h-8 sm:w-10 sm:h-10"></div>
				<h1 className="text-xl sm:text-3xl font-bold text-center flex-grow px-2 sm:px-4">
					Vocabulary Practice
				</h1>
				<Button
					onClick={() => setIsMuted(!isMuted)}
					variant="outline"
					size="icon"
					className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
					aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
					title={isMuted ? "Unmute sounds" : "Mute sounds"}
				>
					{isMuted ? (
						<VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
					) : (
						<Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
					)}
				</Button>
			</div>

			{/* Setup Screen (Not Loading, Quiz Not Active) */}
			{!isLoading && !isQuizActive && !quizCompleted && (
				<div className="max-w-lg mx-auto p-4 sm:p-6 bg-gradient-to-br from-background to-muted/30 border rounded-xl shadow-lg flex flex-col items-center space-y-5 sm:space-y-6">
					<h2 className="text-lg sm:text-xl font-semibold text-center text-primary">
						Configure Your Practice
					</h2>
					{/* Language Selector */}
					<div className="w-full flex flex-col items-stretch sm:items-center sm:justify-center gap-2 sm:gap-4">
						<label
							htmlFor="language-select"
							className="text-sm sm:text-base font-medium text-foreground self-center sm:flex-shrink-0"
						>
							Practice Language:
						</label>
						<select
							id="language-select"
							value={selectedLanguage}
							onChange={handleLanguageChange}
							className="block w-full pl-3 pr-10 py-2 text-base border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary rounded-md shadow-sm bg-background border sm:flex-grow-0"
							aria-label="Select language to practice"
						>
							<option value="All">All Languages</option>
							{availableLanguages.map((lang) => (
								<option key={lang} value={lang}>
									{lang}
								</option>
							))}
						</select>
					</div>

					{/* Quiz Mode Selector */}
					<div className="w-full pt-5 border-t border-border/50">
						<Label className="mb-3 block text-center text-base font-medium text-foreground">
							Practice Mode:
						</Label>
						<RadioGroup
							defaultValue="multipleChoice"
							value={quizMode}
							onValueChange={setQuizMode}
							className="flex items-center justify-center gap-4 sm:gap-6"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="multipleChoice" id="mode-mc" />
								<Label
									htmlFor="mode-mc"
									className="cursor-pointer text-sm sm:text-base"
								>
									Multiple Choice
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="typing" id="mode-typing" />
								<Label
									htmlFor="mode-typing"
									className="cursor-pointer text-sm sm:text-base"
								>
									Typing
								</Label>
							</div>
						</RadioGroup>
					</div>

					{/* Error Display within Setup Card */}
					{error && (
						<div className="text-center text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded">
							<AlertTriangle className="inline h-4 w-4 mr-1" /> {error}
						</div>
					)}

					{/* Start Button - More Prominent */}
					<Button
						onClick={handleStartQuiz}
						disabled={!canStartQuiz}
						className="w-full py-5 text-base sm:text-lg font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed"
						aria-label={`Start quiz for ${selectedLanguage} language`}
					>
						<Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Start Quiz
					</Button>
					{!canStartQuiz && !error && (
						<p className="text-xs text-center text-muted-foreground">
							(Need at least {MIN_WORDS_FOR_QUIZ} unique words for the selected
							language)
						</p>
					)}
				</div>
			)}

			{/* Quiz Completion Screen */}
			{quizCompleted && (
				<Card className="max-w-lg mx-auto border-t-4 border-green-500 shadow-xl bg-gradient-to-b from-background to-green-50/60">
					<CardHeader className="pt-6 pb-4">
						<CardTitle className="text-center text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
							<Star className="h-7 w-7 text-yellow-400" /> Quiz Complete!{" "}
							<Star className="h-7 w-7 text-yellow-400" />
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-5 pb-6 px-6">
						<div className="flex flex-col sm:flex-row justify-around items-center gap-4 p-4 bg-green-100/50 rounded-lg border border-green-200/80">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Final Score
								</p>
								<p className="text-3xl font-bold text-primary">
									{score} / {shuffledList.length}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1">
									<Target className="h-4 w-4" />
									Accuracy
								</p>
								<p className="text-3xl font-bold text-primary">
									{shuffledList.length > 0
										? Math.round((score / shuffledList.length) * 100)
										: 0}
									%
								</p>
							</div>
						</div>
						{score >= 8 && (
							<p className="text-base sm:text-lg font-medium text-green-600">
								+${COMPLETION_BONUS_XP} XP High Score Bonus!
							</p>
						)}
						{score < 8 && (
							<p className="text-xs sm:text-sm text-muted-foreground">
								(Score 8+ for bonus XP)
							</p>
						)}
						<div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
							<Button
								onClick={handleRestartQuiz}
								variant="secondary"
								size="default"
								className="sm:size-lg"
							>
								<RotateCcw className="mr-2 h-4 w-4" /> Practice Again
							</Button>
							{incorrectAnswers.length > 0 && (
								<Button
									onClick={() => setShowReview((prev) => !prev)}
									variant="outline"
									size="default"
									className="sm:size-lg"
								>
									{showReview ? "Hide" : "Review Mistakes"} (
									{incorrectAnswers.length})
								</Button>
							)}
						</div>

						{/* Review Section */}
						{showReview && incorrectAnswers.length > 0 && (
							<div className="mt-6 pt-4 border-t text-left">
								<h3 className="text-lg font-semibold mb-4 text-center text-foreground">
									Words to Review:
								</h3>
								<ul className="space-y-3">
									{incorrectAnswers.map((item, idx) => (
										<li
											key={idx}
											className="text-sm flex items-center justify-between p-2 bg-muted/50 rounded"
										>
											<div>
												<span className="font-medium text-primary">
													{item.word}
												</span>{" "}
												<span className="text-xs text-muted-foreground">
													({item.sourceLanguage})
												</span>
												<br />
												<span className="text-muted-foreground">
													{item.translation}
												</span>
											</div>
										</li>
									))}
								</ul>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Active Quiz UI (Only show when quiz is active and not completed) */}
			{isQuizActive && !quizCompleted && shuffledList.length > 0 && (
				<div className="animate-fade-in">
					{/* Progress Bar */}
					<div className="w-full bg-muted rounded-full h-2.5 mb-6 overflow-hidden max-w-lg mx-auto">
						<div
							className="bg-gradient-to-r from-primary to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
							style={{ width: `${progressPercent}%` }}
						></div>
					</div>

					{/* Current Question Card */}
					{shuffledList[currentQuestionIndex] ? (
						<Card
							className={cn(
								"max-w-lg mx-auto border shadow-lg bg-gradient-to-br from-card to-muted/30 p-4 sm:p-6",
								applyShake && "animate-shake"
							)}
						>
							<CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-3 sm:pb-2 mb-4 border-b">
								<CardTitle className="text-base sm:text-lg font-medium">
									Translate the word:
								</CardTitle>
								<div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
									{correctStreak > 1 && (
										<span
											key={`streak-${correctStreak}`}
											className="animate-streak-increment font-medium text-orange-400 flex items-center"
											title={`${correctStreak} correct in a row!`}
										>
											<Flame className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />{" "}
											{correctStreak}
										</span>
									)}
									<span>
										Word {currentQuestionIndex + 1}/{shuffledList.length}
									</span>
									<span>
										Score:{" "}
										<span
											key={`score-${score}`}
											className="animate-score-update font-semibold text-foreground"
										>
											{score}
										</span>
									</span>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="relative flex items-center justify-center text-center mb-5 sm:mb-6 p-3 sm:p-4 bg-primary/10 text-primary rounded-lg">
									<span className="text-xl sm:text-2xl font-semibold mx-4">
										{shuffledList[currentQuestionIndex].word}
									</span>
									<Button
										variant="ghost"
										size="icon"
										className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2"
										onClick={(e) => {
											e.stopPropagation();
											speakWord(
												shuffledList[currentQuestionIndex].word,
												shuffledList[currentQuestionIndex].sourceLanguage
											);
										}}
										disabled={!ttsReady || isSpeaking}
										title={`Speak word in ${shuffledList[currentQuestionIndex]?.sourceLanguage}`}
										aria-label={`Speak word in ${shuffledList[currentQuestionIndex]?.sourceLanguage}`}
									>
										<Volume2
											className={`h-4 w-4 sm:h-5 sm:w-5 ${
												isSpeaking
													? "text-primary animate-pulse"
													: "text-muted-foreground"
											}`}
										/>
									</Button>
								</div>

								{/* Conditional Rendering for Quiz Type */}
								{quizMode === "multipleChoice" ? (
									<div className="grid grid-cols-1 gap-3 mb-4">
										{currentOptions.map((option, idx) => (
											<Button
												key={idx}
												variant="outline"
												className={cn(
													"w-full justify-start text-left h-auto py-3 px-4 text-sm sm:text-base whitespace-normal transition-all duration-200 ease-in-out transform focus:ring-2 focus:ring-offset-2 bg-background",
													isAnswered &&
														option ===
															shuffledList[currentQuestionIndex]?.translation &&
														"bg-green-100 border-green-400 text-green-800 hover:bg-green-100 ring-green-500 scale-105 shadow animate-pulse-slow",
													isAnswered &&
														selectedAnswer === option &&
														option !==
															shuffledList[currentQuestionIndex]?.translation &&
														"bg-red-100 border-red-400 text-red-800 hover:bg-red-100 ring-red-500 scale-105 shadow animate-pulse-fast",
													isAnswered &&
														option !==
															shuffledList[currentQuestionIndex]?.translation &&
														option !== selectedAnswer &&
														"opacity-50 border-muted cursor-not-allowed",
													!isAnswered &&
														"hover:bg-accent hover:scale-103 hover:shadow-md"
												)}
												onClick={() => handleOptionClick(option)}
												disabled={isAnswered}
												aria-label={`Select answer: ${option}`}
											>
												{option}
											</Button>
										))}
									</div>
								) : (
									// Typing Mode UI
									<form
										onSubmit={(e) => {
											e.preventDefault(); // Prevent page reload
											handleCheckTypedAnswer();
										}}
										className="flex flex-col sm:flex-row items-center gap-3 mb-4"
									>
										<Input
											type="text"
											value={typedAnswer}
											onChange={handleTypedAnswerChange}
											placeholder="Type the translation..."
											className="flex-grow"
											disabled={isAnswered}
											aria-label="Type your answer"
											size="lg"
										/>
										<Button
											type="submit"
											disabled={isAnswered || !typedAnswer.trim()}
											size="lg"
										>
											Check Answer
										</Button>
									</form>
								)}

								{/* Feedback and Next Button */}
								<div className="mt-6 text-center">
									<p
										key={animateTrigger}
										className={cn(
											"h-6 min-h-[1.5rem] mb-3 font-semibold animate-fade-in text-center text-sm sm:text-base",
											isAnswered &&
												feedback.startsWith("Correct") &&
												"text-green-600",
											isAnswered &&
												feedback.startsWith("Incorrect") &&
												"text-destructive"
										)}
										aria-live="polite"
									>
										{feedback || (isAnswered ? "" : <>&nbsp;</>)}{" "}
									</p>
									{isAnswered && (
										<Button
											onClick={handleNextQuestion}
											size="default"
											className="sm:size-lg w-full bg-slate-200 py-6"
											aria-label={
												currentQuestionIndex === shuffledList.length - 1
													? "Finish Quiz"
													: "Next Word"
											}
										>
											{currentQuestionIndex === shuffledList.length - 1 ? (
												<>
													<CheckCircle className="mr-2 h-4 w-4" /> Finish Quiz
												</>
											) : (
												<>
													Next Word <ArrowRight className="ml-2 h-4 w-4" />
												</>
											)}
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					) : (
						// Should not happen if logic is correct, but fallback
						<p className="text-center text-muted-foreground">
							Loading question...
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default VocabularyPracticePage;
