import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStories, getStoryById } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
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
	ArrowLeft,
	Clock,
	Trophy,
	Zap,
	Brain,
	Settings,
	TrendingUp,
	BookOpen,
	Lightbulb,
	Timer,
	Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils"; // For conditional classes
import confetti from "canvas-confetti"; // Import confetti
import { trackPractice } from "@/lib/analytics"; // Import analytics tracking
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { Label } from "@/components/ui/label"; // Import Label
import { Input } from "@/components/ui/input"; // Import Input
import { fsrs, createEmptyCard, Rating, State } from "ts-fsrs"; // FSRS imports

// Quiz Constants and Configuration
const QUIZ_MODES = {
	MULTIPLE_CHOICE: "multipleChoice",
	TYPING: "typing",
	FLASHCARD: "flashcard",
	AUDIO_MATCH: "audioMatch",
};

const DIFFICULTY_LEVELS = {
	EASY: { name: "Easy", multiplier: 0.8, options: 3 },
	MEDIUM: { name: "Medium", multiplier: 1.0, options: 4 },
	HARD: { name: "Hard", multiplier: 1.2, options: 5 },
};

const QUIZ_LENGTH = 10; // Max words per quiz session
const POINTS_PER_CORRECT = 5;
const COMPLETION_BONUS_XP = 25;
const STREAK_BONUS_XP = 2; // Extra XP per streak item
const MIN_WORDS_FOR_QUIZ = 4; // Define minimum words needed
const TIMER_DURATION = 30; // Seconds per question in timed mode

// Enhanced confetti effects
const CONFETTI_EFFECTS = {
	correct: () =>
		confetti({
			particleCount: 50,
			spread: 70,
			origin: { y: 0.6 },
			colors: ["#10B981", "#34D399", "#6EE7B7"],
		}),
	streak: (streakCount) =>
		confetti({
			particleCount: Math.min(streakCount * 20, 200),
			spread: 90,
			origin: { y: 0.6 },
			colors: ["#F59E0B", "#FBBF24", "#FDE047"],
		}),
	completion: () =>
		confetti({
			particleCount: 200,
			spread: 100,
			origin: { y: 0.6 },
			colors: ["#8B5CF6", "#A78BFA", "#C4B5FD"],
		}),
};

// --- Sound URLs (ASSUMED) ---
const CORRECT_SOUND_URL = "/sounds/correct.mp3";
const INCORRECT_SOUND_URL = "/sounds/incorrect.mp3";
const COMPLETE_SOUND_URL = "/sounds/complete.mp3";

// Initialize FSRS
const f = fsrs();

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
	const [searchParams] = useSearchParams();
	const storyId = searchParams.get("storyId");
	const [storyTitle, setStoryTitle] = useState("");
	const [vocabularyList, setVocabularyList] = useState([]); // Original fetched list (with language)
	const [shuffledList, setShuffledList] = useState([]); // Shuffled list for the active quiz
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null); // Error specific to loading or quiz prep
	const [isQuizActive, setIsQuizActive] = useState(false); // State to control quiz visibility

	// --- Enhanced Quiz State ---
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
	const [quizMode, setQuizMode] = useState(QUIZ_MODES.MULTIPLE_CHOICE); // Enhanced quiz modes
	const [typedAnswer, setTypedAnswer] = useState(""); // State for the user's typed input
	const [applyShake, setApplyShake] = useState(false); // State to trigger shake animation
	const [isMuted, setIsMuted] = useState(false); // State for sound effects mute

	// --- Timer State ---
	const [isTimerEnabled, setIsTimerEnabled] = useState(false);
	const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
	const [timerInterval, setTimerInterval] = useState(null);

	// --- Difficulty and Settings State ---
	const [selectedDifficulty, setSelectedDifficulty] = useState("MEDIUM");
	const [autoAdvance, setAutoAdvance] = useState(false);
	const [hintsEnabled, setHintsEnabled] = useState(true);
	const [showHint, setShowHint] = useState(false);

	// --- Flashcard State ---
	const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

	// --- Session Statistics ---
	const [sessionStats, setSessionStats] = useState({
		totalQuestions: 0,
		correctAnswers: 0,
		averageTime: 0,
		bestStreak: 0,
		startTime: null,
		questionStartTime: null,
		questionTimes: [],
	});

	// --- TTS State ---
	const [voices, setVoices] = useState([]);
	const [ttsReady, setTtsReady] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false); // Track speaking state
	const synth = window.speechSynthesis;

	// --- Setup State ---
	const [selectedLanguage, setSelectedLanguage] = useState("All");
	const [availableLanguages, setAvailableLanguages] = useState([]);
	const [canStartQuiz, setCanStartQuiz] = useState(false); // To enable/disable start button
	const [showSettings, setShowSettings] = useState(false);
	// -----------------

	// Calculate progress percentage (based on actual quiz length)
	const progressPercent =
		shuffledList.length > 0 && isQuizActive
			? ((currentQuestionIndex + (quizCompleted ? 1 : 0)) /
					shuffledList.length) *
			  100
			: 0;

	// Debug logging for progress bar
	React.useEffect(() => {
		if (isQuizActive) {
			console.log("Progress Debug:", {
				currentQuestionIndex,
				shuffledListLength: shuffledList.length,
				quizCompleted,
				progressPercent,
				isQuizActive,
			});
		}
	}, [
		currentQuestionIndex,
		shuffledList.length,
		quizCompleted,
		progressPercent,
		isQuizActive,
	]);

	// Debug logging for quiz mode
	React.useEffect(() => {
		console.log("Quiz Mode Debug:", { quizMode });
	}, [quizMode]);

	// Effect to fetch data on mount or user change
	useEffect(() => {
		if (currentUser) {
			setIsLoading(true);
			setError(null); // Clear general errors at the start of fetching
			setIsQuizActive(false);
			setVocabularyList([]);
			setVoices([]);
			setTtsReady(false);
			setCanStartQuiz(false); // Reset quiz start capability

			// If storyId is provided, fetch just that story
			if (storyId) {
				getStoryById(storyId)
					.then((storyFromApi) => {
						try {
							const storyData = JSON.parse(storyFromApi.story);
							setStoryTitle(storyFromApi.description || "Story");

							let extractedVocab = [];
							if (storyData?.pages && Array.isArray(storyData.pages)) {
								extractedVocab = storyData.pages.reduce((acc, page) => {
									if (page.vocabulary && Array.isArray(page.vocabulary)) {
										return acc.concat(page.vocabulary);
									}
									return acc;
								}, []);
							} else if (
								storyData?.vocabulary &&
								Array.isArray(storyData.vocabulary)
							) {
								extractedVocab = storyData.vocabulary;
							}

							// Set vocab and related language states
							// Error for "no vocab" will be handled by the new useEffect
							if (extractedVocab.length > 0 && storyFromApi.targetLanguage) {
								const validVocab = extractedVocab
									.filter((v) => v && v.word && v.translation)
									.map((v) => ({
										...v,
										targetLanguage: storyFromApi.targetLanguage,
										sourceLanguage: storyFromApi.sourceLanguage,
									}));
								setVocabularyList(validVocab);
								setAvailableLanguages([storyFromApi.targetLanguage].sort());
								setSelectedLanguage(storyFromApi.targetLanguage);
							} else {
								// If no vocab extracted, set an empty list.
								// The new useEffect will handle the "No vocabulary" message.
								setVocabularyList([]);
								setAvailableLanguages([]);
								// setSelectedLanguage will remain or be 'All' by default
							}
						} catch (e) {
							console.error(`Failed to parse story ${storyId}:`, e);
							setError(
								"Failed to load vocabulary for this story. (Parsing Error)"
							);
							setVocabularyList([]); // Ensure list is empty on error
						}
					})
					.catch((err) => {
						console.error("Error fetching specific story for practice:", err);
						setError(
							err.message || "Failed to load story vocabulary. (Fetch Error)"
						);
						setVocabularyList([]); // Ensure list is empty on error
					})
					.finally(() => {
						setIsLoading(false);
					});
			} else {
				// Original behavior - fetch all stories
				getStories()
					.then((storiesFromApi) => {
						const allVocab = storiesFromApi.reduce((acc, story) => {
							try {
								const storyData = JSON.parse(story.story);
								let extractedVocab = [];

								if (storyData?.pages && Array.isArray(storyData.pages)) {
									extractedVocab = storyData.pages.reduce((pageAcc, page) => {
										if (page.vocabulary && Array.isArray(page.vocabulary)) {
											return pageAcc.concat(page.vocabulary);
										}
										return pageAcc;
									}, []);
								} else if (
									storyData?.vocabulary &&
									Array.isArray(storyData.vocabulary)
								) {
									extractedVocab = storyData.vocabulary;
								}

								if (extractedVocab.length > 0 && story.targetLanguage) {
									const vocabWithLang = extractedVocab
										.filter((v) => v && v.word && v.translation)
										.map((v) => ({
											...v,
											targetLanguage: story.targetLanguage,
											sourceLanguage: story.sourceLanguage,
										}));
									acc.push(...vocabWithLang);
								}
							} catch (e) {
								console.error(
									`Failed to parse story data for story ID ${
										story.id || "unknown"
									}:`,
									e
								);
								// Do not set a general error here, just skip this story's vocab
							}
							return acc;
						}, []);

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

						const languages = [
							...new Set(
								uniqueVocab.map((v) => v.targetLanguage).filter(Boolean)
							),
						];
						setAvailableLanguages(languages.sort());
						// setSelectedLanguage will remain 'All' or its current value
					})
					.catch((err) => {
						console.error("Error fetching stories for practice:", err);
						setError(
							err.message || "Failed to load vocabulary. (Fetch All Error)"
						);
						setVocabularyList([]); // Ensure list is empty on error
					})
					.finally(() => {
						setIsLoading(false);
					});
			}
		} else {
			// Not logged in
			setIsLoading(false);
			setVocabularyList([]);
			setShuffledList([]);
			setIsQuizActive(false);
			setCanStartQuiz(false);
		}
	}, [currentUser, storyId]); // Simplified dependencies

	// New useEffect to handle quiz readiness and vocabulary-related errors
	useEffect(() => {
		if (isLoading) {
			// If still loading, don't make decisions about quiz readiness or errors yet
			return;
		}

		if (!currentUser) {
			// If user logs out, clear relevant states
			setError(null);
			setCanStartQuiz(false);
			return;
		}

		if (vocabularyList.length === 0) {
			// This covers both "No vocabulary found in this story" and "No stories with vocab"
			setError(
				"No vocabulary available. Create some stories or check existing ones."
			);
			setCanStartQuiz(false);
			return;
		}

		// Calculate if quiz can start based on current vocabularyList and selectedLanguage
		let count = 0;
		if (selectedLanguage === "All") {
			const uniqueWords = new Set(vocabularyList.map((v) => v.word));
			count = uniqueWords.size;
		} else {
			count = vocabularyList.filter(
				(v) => v.targetLanguage === selectedLanguage
			).length;
		}

		if (count < MIN_WORDS_FOR_QUIZ) {
			setError(
				`Not enough unique words for ${
					selectedLanguage === "All" ? "any language" : selectedLanguage
				} (minimum ${MIN_WORDS_FOR_QUIZ} needed).`
			);
			setCanStartQuiz(false);
		} else {
			setError(null); // Clear previous "not enough words" or "no vocab" errors
			setCanStartQuiz(true);
		}
	}, [isLoading, vocabularyList, selectedLanguage, currentUser]);

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
			const now = new Date();
			const srsCards = userProgress?.vocabularySrsData || {};

			const vocabWithSrsData = uniqueQuizVocab.map((item) => {
				const wordId = `${item.word}-${item.targetLanguage}`; // Unique ID for word-language pair
				let card = srsCards[wordId];

				if (card) {
					// Ensure dates are Date objects
					card.due = new Date(card.due);
					if (card.last_review) {
						card.last_review = new Date(card.last_review);
					}
				} else {
					card = createEmptyCard(now);
				}
				return { ...item, srsCard: card, wordId };
			});

			// Sort by due date (earliest first)
			vocabWithSrsData.sort(
				(a, b) => a.srsCard.due.getTime() - b.srsCard.due.getTime()
			);

			let finalQuizList = vocabWithSrsData;
			if (finalQuizList.length > QUIZ_LENGTH) {
				finalQuizList = finalQuizList.slice(0, QUIZ_LENGTH);
			}

			setShuffledList(finalQuizList); // Name is now a bit misleading, it's sorted by FSRS due date

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
			setCorrectStreak(0);
			setShowHint(false);

			// Initialize session statistics
			setSessionStats({
				totalQuestions: finalQuizList.length,
				correctAnswers: 0,
				averageTime: 0,
				bestStreak: 0,
				startTime: new Date(),
				questionStartTime: new Date(),
				questionTimes: [],
			});

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
		const difficulty = DIFFICULTY_LEVELS[selectedDifficulty];

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

		// Use difficulty level to determine number of options
		const maxIncorrectOptions = difficulty.options - 1;

		for (let item of potentialIncorrectPool) {
			if (
				item &&
				item.translation &&
				item.translation !== correctAnswer &&
				!incorrectOptions.includes(item.translation)
			) {
				incorrectOptions.push(item.translation);
				if (incorrectOptions.length >= maxIncorrectOptions) break;
			}
		}

		// Fallback if not enough unique incorrect options found
		while (incorrectOptions.length < maxIncorrectOptions) {
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
		setShowHint(false);
		setTypedAnswer("");

		// Start timer if enabled
		if (isTimerEnabled) {
			setTimeLeft(TIMER_DURATION);
			startTimer();
		}

		// Track question start time for statistics
		setSessionStats((prev) => ({
			...prev,
			questionStartTime: new Date(),
		}));

		// Auto-play audio for Audio Match mode
		if (quizMode === "audioMatch" && ttsReady) {
			setTimeout(() => {
				speakWord(correctItem.word, correctItem.sourceLanguage);
			}, 500); // Small delay to ensure UI has updated
		}
	};

	// --- Timer Functions ---

	const clearTimer = React.useCallback(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
			setTimerInterval(null);
		}
	}, [timerInterval]);

	// Handle next question navigation
	const handleNextQuestion = React.useCallback(async () => {
		if (!isAnswered) return;

		clearTimer();
		const nextIndex = currentQuestionIndex + 1;

		if (nextIndex < shuffledList.length) {
			// Reset answer state and setup next question
			setIsAnswered(false);
			setSelectedAnswer(null);
			setTypedAnswer("");
			setFeedback("");
			setShowHint(false);
			setupQuestion(nextIndex, shuffledList);
		} else {
			// Quiz completed - award completion bonus and show results
			let bonusXP = 0;
			const accuracy = (score / shuffledList.length) * 100;

			if (accuracy >= 80) {
				bonusXP = COMPLETION_BONUS_XP;
				CONFETTI_EFFECTS.completion();
				playSound(COMPLETE_SOUND_URL, isMuted);
			}

			if (userProgress && updateProgressData && bonusXP > 0) {
				try {
					await updateProgressData({
						pointsToAdd: bonusXP,
						vocabularySrsData: userProgress.vocabularySrsData || {},
					});
					console.log(`Awarded ${bonusXP} completion bonus XP`);
				} catch (error) {
					console.error("Failed to save completion bonus:", error);
				}
			}

			// Track analytics
			try {
				await trackPractice({
					storyId: storyId || "all-stories",
					score,
					total: shuffledList.length,
					accuracy,
					mode: quizMode,
					difficulty: selectedDifficulty,
					language: selectedLanguage,
					streak: sessionStats.bestStreak,
					timeSpent: sessionStats.startTime
						? (new Date() - sessionStats.startTime) / 1000
						: 0,
				});
			} catch (error) {
				console.error("Failed to track practice analytics:", error);
			}

			setQuizCompleted(true);
			setIsQuizActive(false);
		}
	}, [
		isAnswered,
		shuffledList,
		currentQuestionIndex,
		score,
		userProgress,
		updateProgressData,
		isMuted,
		quizMode,
		selectedDifficulty,
		selectedLanguage,
		sessionStats,
		clearTimer,
		setupQuestion,
	]);

	// Centralized auto advance function (moved before handleTimeUp to avoid reference error)
	const handleAutoAdvance = React.useCallback(() => {
		if (autoAdvance && isAnswered) {
			setTimeout(() => {
				handleNextQuestion();
			}, 2000);
		}
	}, [autoAdvance, isAnswered, handleNextQuestion]);

	const handleTimeUp = React.useCallback(async () => {
		if (isAnswered) return;

		setIsAnswered(true);
		setFeedback("Time's up! ⏰");
		setCorrectStreak(0);

		const currentQuizItem = shuffledList[currentQuestionIndex];

		// Mark as incorrect for FSRS
		const now = new Date();
		const oldCard = currentQuizItem.srsCard;
		const scheduling_cards = f.repeat(oldCard, now);
		const newCard = scheduling_cards[Rating.Again].card;

		// Update FSRS data
		const updatedSrsData = {
			...(userProgress?.vocabularySrsData || {}),
			[currentQuizItem.wordId]: newCard,
		};

		if (userProgress && updateProgressData) {
			try {
				await updateProgressData({
					pointsToAdd: 0,
					vocabularySrsData: updatedSrsData,
				});
			} catch (error) {
				console.error("Failed to save FSRS data on timeout:", error);
			}
		}

		// Add to incorrect answers
		setIncorrectAnswers((prev) => {
			if (!prev.some((item) => item.word === currentQuizItem.word)) {
				return [...prev, currentQuizItem];
			}
			return prev;
		});

		// Auto-advance after a delay if enabled
		handleAutoAdvance();
	}, [
		isAnswered,
		shuffledList,
		currentQuestionIndex,
		userProgress,
		updateProgressData,
		handleAutoAdvance,
	]);

	const startTimer = React.useCallback(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					setTimerInterval(null);
					// Auto-advance to next question when time runs out
					if (!isAnswered) {
						handleTimeUp();
					}
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		setTimerInterval(interval);
	}, [timerInterval, isAnswered, handleTimeUp]);

	// --- Helper Functions ---
	const updateSessionStats = (isCorrect, questionTime) => {
		setSessionStats((prev) => {
			const newQuestionTimes = [...prev.questionTimes, questionTime];
			const newCorrectAnswers = isCorrect
				? prev.correctAnswers + 1
				: prev.correctAnswers;
			const newBestStreak = Math.max(prev.bestStreak, correctStreak);
			const newAverageTime =
				newQuestionTimes.reduce((a, b) => a + b, 0) / newQuestionTimes.length;

			return {
				...prev,
				correctAnswers: newCorrectAnswers,
				averageTime: newAverageTime,
				bestStreak: newBestStreak,
				questionTimes: newQuestionTimes,
			};
		});
	};

	const getHint = () => {
		const currentQuizItem = shuffledList[currentQuestionIndex];
		if (!currentQuizItem || !hintsEnabled) return "";

		// Simple hint: show first letter of translation
		const translation = currentQuizItem.translation;
		return `Hint: Starts with "${translation.charAt(0).toUpperCase()}"`;
	};

	// --- Session Management Effects ---
	useEffect(() => {
		if (quizCompleted) {
			// If the quiz was just completed, show the completion screen
			setIsQuizActive(false);
		}
	}, [quizCompleted]);

	// Effect to reset timer on question change only
	useEffect(() => {
		if (isQuizActive && !quizCompleted && isTimerEnabled) {
			setTimeLeft(TIMER_DURATION);
			clearTimer();
			if (!isAnswered) {
				startTimer();
			}
		}
	}, [
		currentQuestionIndex,
		isQuizActive,
		quizCompleted,
		isTimerEnabled,
		clearTimer,
		startTimer,
		isAnswered,
	]);

	// --- Missing Handler Functions ---
	const handleLanguageChange = (event) => {
		setSelectedLanguage(event.target.value);
	};

	const handleRestartQuiz = () => {
		setQuizCompleted(false);
		setIsQuizActive(false);
		setShowReview(false);
		setScore(0);
		setCorrectStreak(0);
		setCurrentQuestionIndex(0);
		setIncorrectAnswers([]);
		setFeedback("");
		setSelectedAnswer(null);
		setTypedAnswer("");
		setIsAnswered(false);
		clearTimer();
	};

	const speakWord = (word, language) => {
		if (!ttsReady || isSpeaking || !word) return;

		const langCode = getLangCode(language);
		const bestVoice = getBestVoiceForLanguage(voices, langCode);

		if (bestVoice) {
			setIsSpeaking(true);
			const utterance = new SpeechSynthesisUtterance(word);
			utterance.voice = bestVoice;
			utterance.lang = langCode;
			utterance.rate = 0.8;
			utterance.pitch = 1.0;
			utterance.volume = 1.0;

			utterance.onend = () => setIsSpeaking(false);
			utterance.onerror = () => setIsSpeaking(false);

			synth.speak(utterance);
		}
	};

	// --- Quiz Interaction Handlers ---
	const handleOptionClick = async (option) => {
		if (isAnswered) return;

		// Clear timer if running
		clearTimer();

		// Track question timing
		const questionTime = sessionStats.questionStartTime
			? (new Date() - sessionStats.questionStartTime) / 1000
			: 0;

		setSelectedAnswer(option);
		setIsAnswered(true);
		setAnimateTrigger(Date.now());

		const currentQuizItem = shuffledList[currentQuestionIndex];
		const correctAnswer = currentQuizItem.translation;
		let awardedPoints = 0;
		const now = new Date();
		let rating;
		const difficulty = DIFFICULTY_LEVELS[selectedDifficulty];

		if (option === correctAnswer) {
			const basePoints = Math.floor(POINTS_PER_CORRECT * difficulty.multiplier);
			setFeedback(`Correct! +${basePoints} XP 🎉`);
			setScore((prevScore) => prevScore + 1);
			awardedPoints = basePoints;

			// Enhanced streak handling with bonus XP
			const newStreak = correctStreak + 1;
			setCorrectStreak(newStreak);

			// Add streak bonus for every 3 correct in a row
			if (newStreak > 0 && newStreak % 3 === 0) {
				const streakBonus = STREAK_BONUS_XP * (newStreak / 3);
				awardedPoints += streakBonus;
				setFeedback(`🔥 ${newStreak} streak! +${basePoints + streakBonus} XP`);
				CONFETTI_EFFECTS.streak(newStreak);
			} else {
				CONFETTI_EFFECTS.correct();
			}

			playSound(CORRECT_SOUND_URL, isMuted);
			rating = Rating.Good;
			updateSessionStats(true, questionTime);
		} else {
			setFeedback(`Incorrect. Correct: ${correctAnswer}`);
			setIncorrectAnswers((prev) => {
				if (!prev.some((item) => item.word === currentQuizItem.word)) {
					return [...prev, currentQuizItem];
				}
				return prev;
			});
			playSound(INCORRECT_SOUND_URL, isMuted);
			setCorrectStreak(0);
			setApplyShake(true);
			rating = Rating.Again;
			updateSessionStats(false, questionTime);

			// Auto-replay audio for Audio Match mode on incorrect answers
			if (quizMode === "audioMatch" && ttsReady) {
				setTimeout(() => {
					speakWord(currentQuizItem.word, currentQuizItem.sourceLanguage);
				}, 1500); // Replay after feedback is shown
			}
		}

		// FSRS card update
		const oldCard = currentQuizItem.srsCard;
		const scheduling_cards = f.repeat(oldCard, now);
		const newCard = scheduling_cards[rating].card;

		// Persist the updated FSRS card data
		const updatedSrsData = {
			...(userProgress?.vocabularySrsData || {}),
			[currentQuizItem.wordId]: newCard,
		};

		// Update progress (points and FSRS data)
		if (userProgress && updateProgressData) {
			try {
				await updateProgressData({
					pointsToAdd: awardedPoints > 0 ? awardedPoints : 0,
					vocabularySrsData: updatedSrsData,
				});
				console.log(
					`Awarded ${awardedPoints} points. FSRS data updated for ${currentQuizItem.wordId}`
				);
				// Update local state for the specific card in shuffledList
				const updatedShuffledList = [...shuffledList];
				updatedShuffledList[currentQuestionIndex] = {
					...currentQuizItem,
					srsCard: newCard,
				};
				setShuffledList(updatedShuffledList);
			} catch (error) {
				console.error("Failed to save progress or FSRS data:", error);
			}
		}
		// Reset shake after a short delay if it was applied, and only if it was an incorrect answer
		if (rating === Rating.Again && applyShake) {
			setTimeout(() => setApplyShake(false), 500);
		}

		// Auto-advance if enabled
		handleAutoAdvance();
	};

	// Handle typed answer input change
	const handleTypedAnswerChange = (e) => {
		setTypedAnswer(e.target.value);
	};

	// Handle checking the typed answer
	const handleCheckTypedAnswer = async () => {
		if (isAnswered || !typedAnswer.trim()) return;

		// Clear timer if running
		clearTimer();

		// Track question timing
		const questionTime = sessionStats.questionStartTime
			? (new Date() - sessionStats.questionStartTime) / 1000
			: 0;

		setIsAnswered(true);
		setAnimateTrigger(Date.now());

		const currentQuizItem = shuffledList[currentQuestionIndex];
		const correctAnswer = currentQuizItem.translation;
		let awardedPoints = 0;
		const now = new Date();
		let rating;
		const difficulty = DIFFICULTY_LEVELS[selectedDifficulty];

		// Enhanced comparison - handle close matches and case sensitivity
		const normalizedTyped = typedAnswer.trim().toLowerCase();
		const normalizedCorrect = correctAnswer.toLowerCase();
		const isExactMatch = normalizedTyped === normalizedCorrect;
		const isCloseMatch =
			normalizedCorrect.includes(normalizedTyped) ||
			normalizedTyped.includes(normalizedCorrect);

		if (isExactMatch) {
			const basePoints = Math.floor(POINTS_PER_CORRECT * difficulty.multiplier);
			setFeedback(`Perfect! +${basePoints} XP 🎉`);
			setScore((prevScore) => prevScore + 1);
			awardedPoints = basePoints;

			// Enhanced streak handling
			const newStreak = correctStreak + 1;
			setCorrectStreak(newStreak);

			if (newStreak > 0 && newStreak % 3 === 0) {
				const streakBonus = STREAK_BONUS_XP * (newStreak / 3);
				awardedPoints += streakBonus;
				setFeedback(`🔥 ${newStreak} streak! +${basePoints + streakBonus} XP`);
				CONFETTI_EFFECTS.streak(newStreak);
			} else {
				CONFETTI_EFFECTS.correct();
			}

			playSound(CORRECT_SOUND_URL, isMuted);
			rating = Rating.Good;
			updateSessionStats(true, questionTime);
		} else if (isCloseMatch) {
			const partialPoints = Math.floor(
				(POINTS_PER_CORRECT * difficulty.multiplier) / 2
			);
			setFeedback(`Close! Correct: ${correctAnswer} (+${partialPoints} XP)`);
			setScore((prevScore) => prevScore + 0.5);
			awardedPoints = partialPoints;
			setCorrectStreak(0); // Reset streak for partial credit
			playSound(CORRECT_SOUND_URL, isMuted);
			rating = Rating.Hard; // FSRS: Partial success
			updateSessionStats(false, questionTime);
		} else {
			setFeedback(`Incorrect. Correct: ${correctAnswer}`);
			setIncorrectAnswers((prev) => {
				if (!prev.some((item) => item.word === currentQuizItem.word)) {
					return [...prev, currentQuizItem];
				}
				return prev;
			});
			playSound(INCORRECT_SOUND_URL, isMuted);
			setCorrectStreak(0);
			setApplyShake(true);
			rating = Rating.Again;
			updateSessionStats(false, questionTime);
		}

		// FSRS card update
		const oldCard = currentQuizItem.srsCard;
		const scheduling_cards = f.repeat(oldCard, now);
		const newCard = scheduling_cards[rating].card;

		// Persist the updated FSRS card data
		const updatedSrsData = {
			...(userProgress?.vocabularySrsData || {}),
			[currentQuizItem.wordId]: newCard,
		};

		// Update progress (points and FSRS data)
		if (userProgress && updateProgressData) {
			try {
				await updateProgressData({
					pointsToAdd: awardedPoints > 0 ? awardedPoints : 0,
					vocabularySrsData: updatedSrsData,
				});
				console.log(
					`Awarded ${awardedPoints} points. FSRS data updated for ${currentQuizItem.wordId}`
				);
				// Update local state for the specific card in shuffledList
				const updatedShuffledList = [...shuffledList];
				updatedShuffledList[currentQuestionIndex] = {
					...currentQuizItem,
					srsCard: newCard,
				};
				setShuffledList(updatedShuffledList);
			} catch (error) {
				console.error("Failed to save progress or FSRS data:", error);
			}
		}
		// Reset shake after a short delay if it was applied
		if (rating === Rating.Again && applyShake) {
			setTimeout(() => setApplyShake(false), 500);
		}

		// Auto-advance if enabled
		handleAutoAdvance();
	};

	// Handle flashcard answer (confidence rating)
	const handleFlashcardAnswer = async (confidence) => {
		if (isAnswered) return;

		// Clear timer if running
		clearTimer();

		// Track question timing
		const questionTime = sessionStats.questionStartTime
			? (new Date() - sessionStats.questionStartTime) / 1000
			: 0;

		setIsAnswered(true);
		setAnimateTrigger(Date.now());

		const currentQuizItem = shuffledList[currentQuestionIndex];
		const now = new Date();
		let rating;
		let awardedPoints = 0;
		const difficulty = DIFFICULTY_LEVELS[selectedDifficulty];

		// Map confidence to FSRS rating and assign points
		switch (confidence) {
			case "again": {
				rating = Rating.Again;
				setFeedback("Let's practice this one more! 📚");
				setCorrectStreak(0);
				playSound(INCORRECT_SOUND_URL, isMuted);
				updateSessionStats(false, questionTime);
				break;
			}
			case "good": {
				rating = Rating.Good;
				awardedPoints = Math.floor(POINTS_PER_CORRECT * difficulty.multiplier);
				setFeedback(`Good recall! +${awardedPoints} XP 👍`);
				setScore((prevScore) => prevScore + 1);
				const goodStreak = correctStreak + 1;
				setCorrectStreak(goodStreak);
				if (goodStreak > 0 && goodStreak % 3 === 0) {
					const streakBonus = STREAK_BONUS_XP * (goodStreak / 3);
					awardedPoints += streakBonus;
					setFeedback(`🔥 ${goodStreak} streak! +${awardedPoints} XP`);
					CONFETTI_EFFECTS.streak(goodStreak);
				} else {
					CONFETTI_EFFECTS.correct();
				}
				playSound(CORRECT_SOUND_URL, isMuted);
				updateSessionStats(true, questionTime);
				break;
			}
			case "easy": {
				rating = Rating.Easy;
				awardedPoints = Math.floor(
					POINTS_PER_CORRECT * difficulty.multiplier * 1.5
				); // Bonus for easy
				setFeedback(`Perfect! +${awardedPoints} XP ⭐`);
				setScore((prevScore) => prevScore + 1);
				const easyStreak = correctStreak + 1;
				setCorrectStreak(easyStreak);
				if (easyStreak > 0 && easyStreak % 3 === 0) {
					const streakBonus = STREAK_BONUS_XP * (easyStreak / 3);
					awardedPoints += streakBonus;
					setFeedback(`🔥 ${easyStreak} streak! +${awardedPoints} XP`);
					CONFETTI_EFFECTS.streak(easyStreak);
				} else {
					CONFETTI_EFFECTS.correct();
				}
				playSound(CORRECT_SOUND_URL, isMuted);
				updateSessionStats(true, questionTime);
				break;
			}
			default: {
				rating = Rating.Good;
				break;
			}
		}

		// FSRS card update
		const oldCard = currentQuizItem.srsCard;
		const scheduling_cards = f.repeat(oldCard, now);
		const newCard = scheduling_cards[rating].card;

		// Update progress
		const updatedSrsData = {
			...(userProgress?.vocabularySrsData || {}),
			[currentQuizItem.wordId]: newCard,
		};

		if (userProgress && updateProgressData) {
			try {
				await updateProgressData({
					pointsToAdd: awardedPoints > 0 ? awardedPoints : 0,
					vocabularySrsData: updatedSrsData,
				});
				console.log(
					`Awarded ${awardedPoints} points. FSRS data updated for ${currentQuizItem.wordId}`
				);
			} catch (error) {
				console.error("Failed to save progress or FSRS data:", error);
			}
		}

		// Auto-advance if enabled
		handleAutoAdvance();
	};

	// --- Effects for Timer Management ---
	useEffect(() => {
		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	}, [timerInterval]);

	useEffect(() => {
		if (
			isQuizActive &&
			!quizCompleted &&
			!isAnswered &&
			isTimerEnabled &&
			timeLeft === 0
		) {
			handleTimeUp();
		}
	}, [
		isQuizActive,
		quizCompleted,
		isAnswered,
		isTimerEnabled,
		timeLeft,
		handleTimeUp,
	]);

	useEffect(() => {
		if (isQuizActive && !quizCompleted && isTimerEnabled && !isAnswered) {
			startTimer();
		}
		return () => {
			clearTimer();
		};
	}, [
		currentQuestionIndex,
		isQuizActive,
		quizCompleted,
		isTimerEnabled,
		isAnswered,
		startTimer,
		clearTimer,
	]);

	// --- Keyboard Shortcuts for Audio Match Mode ---
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (!isQuizActive || quizCompleted || isAnswered) return;

			// Space bar to replay audio in Audio Match mode
			if (event.code === "Space" && quizMode === "audioMatch") {
				event.preventDefault();
				if (ttsReady && shuffledList[currentQuestionIndex]) {
					speakWord(
						shuffledList[currentQuestionIndex].word,
						shuffledList[currentQuestionIndex].sourceLanguage
					);
				}
			}

			// Number keys (1-4) for selecting options in multiple choice modes
			if (
				(quizMode === "multipleChoice" || quizMode === "audioMatch") &&
				currentOptions.length > 0
			) {
				const keyNum = parseInt(event.key);
				if (keyNum >= 1 && keyNum <= currentOptions.length) {
					event.preventDefault();
					handleOptionClick(currentOptions[keyNum - 1]);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		isQuizActive,
		quizCompleted,
		isAnswered,
		quizMode,
		ttsReady,
		shuffledList,
		currentQuestionIndex,
		currentOptions,
		speakWord,
		handleOptionClick,
	]);

	// --- Main Render ---
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

			{/* Show story title when a specific story is selected */}
			{storyId && storyTitle && (
				<div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
					<h2 className="text-sm font-semibold text-blue-800">
						Practicing vocabulary from: "{storyTitle}"
					</h2>
				</div>
			)}

			{/* Error message */}
			{error && (
				<div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
					<AlertTriangle className="inline-block mr-2 h-5 w-5" />
					{error}
				</div>
			)}

			{/* Game-like Setup Screen (Mobile-Friendly) */}
			{!isLoading && !isQuizActive && !quizCompleted && (
				<div className="max-w-3xl mx-auto">
					{/* Hero Section with Animated Background */}
					<div className="relative p-8 sm:p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl mb-8 overflow-hidden">
						{/* Animated Background Elements */}
						<div className="absolute inset-0 opacity-20">
							<div className="absolute top-4 left-4 w-16 h-16 bg-yellow-300 rounded-full animate-bounce delay-75"></div>
							<div className="absolute top-20 right-8 w-12 h-12 bg-green-300 rounded-full animate-bounce delay-150"></div>
							<div className="absolute bottom-8 left-1/4 w-10 h-10 bg-pink-300 rounded-full animate-bounce delay-300"></div>
							<div className="absolute bottom-4 right-1/3 w-14 h-14 bg-blue-300 rounded-full animate-bounce delay-500"></div>
							{/* Floating Letters Animation */}
							<div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-4xl font-bold text-white/30 animate-pulse">
								ABC
							</div>
							<div className="absolute bottom-1/4 right-1/4 text-3xl font-bold text-white/30 animate-pulse delay-700">
								XYZ
							</div>
						</div>

						{/* Main Hero Content */}
						<div className="relative z-10 text-center text-white">
							<div className="mb-6">
								<Brain className="h-16 w-16 mx-auto mb-4 animate-pulse text-yellow-300" />
								<h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent animate-fadeIn">
									🎯 Vocabulary Challenge
								</h1>
								<p className="text-lg sm:text-xl text-blue-100 font-medium mb-2 animate-fadeIn delay-150">
									Test your language mastery!
								</p>
								<p className="text-sm sm:text-base text-blue-200 animate-fadeIn delay-300">
									Choose your mode, set your difficulty, and conquer new words
								</p>
							</div>

							{/* Quick Stats Preview */}
							<div className="flex justify-center gap-6 mb-6">
								<div className="text-center bg-white/10 backdrop-blur rounded-xl p-3 animate-slideInUp delay-200">
									<Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-300" />
									<p className="text-xs text-blue-100">Challenge</p>
									<p className="text-sm font-bold">
										{vocabularyList.length} Words
									</p>
								</div>
								<div className="text-center bg-white/10 backdrop-blur rounded-xl p-3 animate-slideInUp delay-300">
									<Zap className="h-6 w-6 mx-auto mb-1 text-green-300" />
									<p className="text-xs text-blue-100">Reward</p>
									<p className="text-sm font-bold">
										Up to {POINTS_PER_CORRECT * 2}XP
									</p>
								</div>
								<div className="text-center bg-white/10 backdrop-blur rounded-xl p-3 animate-slideInUp delay-400">
									<Target className="h-6 w-6 mx-auto mb-1 text-pink-300" />
									<p className="text-xs text-blue-100">Goal</p>
									<p className="text-sm font-bold">80%+ Score</p>
								</div>
							</div>
						</div>
					</div>

					{/* Game Setup Panel */}
					<div className="vocabulary-setup-container bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
						{/* Decorative Corner Elements */}
						<div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-br-full"></div>
						<div className="absolute bottom-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tl from-pink-500/10 to-orange-500/10 rounded-tl-full"></div>

						<div className="relative z-10">
							{/* Setup Header with Settings */}
							<div className="vocabulary-setup-header flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
										<Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
									</div>
									<div>
										<h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
											Game Setup
										</h2>
										<p className="text-sm text-gray-600">
											Configure your challenge
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Button
										onClick={() => setShowSettings(!showSettings)}
										variant="outline"
										size="lg"
										className={cn(
											"border-2 transition-all duration-300 hover:scale-105",
											showSettings
												? "border-blue-500 bg-blue-50 text-blue-700"
												: "border-gray-300 hover:border-blue-400"
										)}
										title="Advanced Settings"
									>
										<Settings className="h-5 w-5 mr-2" />
										{showSettings ? "Hide Settings" : "Advanced"}
									</Button>
								</div>
							</div>

							{/* Advanced Settings Panel */}
							{showSettings && (
								<div className="settings-panel mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border-2 border-gray-200 space-y-4 sm:space-y-6 animate-slideInDown">
									<div className="text-center mb-3 sm:mb-4">
										<div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm sm:text-base">
											<Zap className="h-3 w-3 sm:h-4 sm:w-4" />
											<span className="font-semibold">Advanced Settings</span>
										</div>
									</div>

									<div className="settings-grid grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
										{/* Difficulty Selection */}
										<div className="space-y-3">
											<Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
												<Target className="h-4 w-4 text-blue-500" />
												Difficulty Level
											</Label>
											<RadioGroup
												value={selectedDifficulty}
												onValueChange={setSelectedDifficulty}
												className="space-y-2"
											>
												{Object.entries(DIFFICULTY_LEVELS).map(
													([key, level]) => (
														<div
															key={key}
															className="flex items-center space-x-3 p-3 rounded-xl border-2 hover:border-blue-300 transition-colors bg-white"
														>
															<RadioGroupItem
																value={key}
																id={`diff-${key}`}
																className="border-2"
															/>
															<Label
																htmlFor={`diff-${key}`}
																className="flex-grow cursor-pointer font-medium"
															>
																{level.name}
																<span className="text-xs text-gray-500 block">
																	{level.options} options • {level.multiplier}x
																	points
																</span>
															</Label>
														</div>
													)
												)}
											</RadioGroup>
										</div>

										{/* Game Features */}
										<div className="space-y-4">
											<Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
												<Flame className="h-4 w-4 text-orange-500" />
												Game Features
											</Label>

											{/* Timer Settings */}
											<div className="flex items-center justify-between p-3 bg-white rounded-xl border-2 hover:border-orange-300 transition-colors">
												<div className="flex items-center gap-2">
													<Timer className="h-4 w-4 text-orange-500" />
													<div>
														<Label
															htmlFor="timer-toggle"
															className="text-sm font-medium cursor-pointer"
														>
															Timed Challenge
														</Label>
														<p className="text-xs text-gray-500">
															{TIMER_DURATION}s per question
														</p>
													</div>
												</div>
												<Switch
													id="timer-toggle"
													checked={isTimerEnabled}
													onCheckedChange={setIsTimerEnabled}
													className="data-[state=checked]:bg-orange-500"
												/>
											</div>

											{/* Auto-advance Settings */}
											<div className="flex items-center justify-between p-3 bg-white rounded-xl border-2 hover:border-green-300 transition-colors">
												<div className="flex items-center gap-2">
													<Zap className="h-4 w-4 text-green-500" />
													<div>
														<Label
															htmlFor="auto-advance"
															className="text-sm font-medium cursor-pointer"
														>
															Auto-advance
														</Label>
														<p className="text-xs text-gray-500">
															Next question automatically
														</p>
													</div>
												</div>
												<Switch
													id="auto-advance"
													checked={autoAdvance}
													onCheckedChange={setAutoAdvance}
													className="data-[state=checked]:bg-green-500"
												/>
											</div>

											{/* Hints Settings */}
											<div className="flex items-center justify-between p-3 bg-white rounded-xl border-2 hover:border-yellow-300 transition-colors">
												<div className="flex items-center gap-2">
													<Lightbulb className="h-4 w-4 text-yellow-500" />
													<div>
														<Label
															htmlFor="hints-toggle"
															className="text-sm font-medium cursor-pointer"
														>
															Helpful Hints
														</Label>
														<p className="text-xs text-gray-500">
															Get clues when stuck
														</p>
													</div>
												</div>
												<Switch
													id="hints-toggle"
													checked={hintsEnabled}
													onCheckedChange={setHintsEnabled}
													className="data-[state=checked]:bg-yellow-500"
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Language Selection - Game Style */}
							<div className="mb-6 sm:mb-8">
								<div className="text-center mb-3 sm:mb-4">
									<div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-full text-sm sm:text-base">
										<BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
										<span className="font-semibold">Choose Your Language</span>
									</div>
								</div>
								<div className="max-w-sm sm:max-w-md mx-auto">
									<select
										id="language-select"
										value={selectedLanguage}
										onChange={handleLanguageChange}
										className="language-selector w-full p-3 sm:p-4 text-base sm:text-lg font-medium border-3 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 rounded-xl sm:rounded-2xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 cursor-pointer mobile-touch-target"
										aria-label="Select language to practice"
									>
										<option value="All">🌍 All Languages</option>
										{availableLanguages.map((lang) => (
											<option key={lang} value={lang}>
												🗣️ {lang}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Game mode selection with enhanced focus styles */}
							<div className="mb-6 sm:mb-8">
								<div className="text-center mb-4 sm:mb-6">
									<div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm sm:text-base">
										<Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
										<span className="font-semibold">Select Game Mode</span>
									</div>
								</div>
								<RadioGroup
									value={quizMode}
									onValueChange={setQuizMode}
									className="game-mode-grid grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
								>
									{/* Multiple Choice Mode */}
									<div className="relative">
										<RadioGroupItem
											value="multipleChoice"
											id="mode-mc"
											className="peer sr-only"
										/>
										<Label
											htmlFor="mode-mc"
											className={cn(
												"game-mode-card flex flex-col items-center p-4 sm:p-6 bg-white border-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 mobile-touch-target",
												quizMode === "multipleChoice"
													? "border-blue-500 bg-blue-50 shadow-xl scale-105"
													: "border-gray-200 hover:border-blue-400 hover:shadow-lg"
											)}
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													setQuizMode("multipleChoice");
												}
											}}
										>
											<div className="game-mode-icon w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3">
												<Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
											</div>
											<h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
												Multiple Choice
											</h3>
											<p className="text-xs sm:text-sm text-gray-600 text-center">
												Pick the correct answer from options
											</p>
											<div className="mt-1 sm:mt-2 px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 rounded-full">
												<span className="text-xs font-medium text-blue-700">
													Classic Mode
												</span>
											</div>
										</Label>
									</div>

									{/* Typing Mode */}
									<div className="relative">
										<RadioGroupItem
											value="typing"
											id="mode-typing"
											className="peer sr-only"
										/>
										<Label
											htmlFor="mode-typing"
											className={cn(
												"game-mode-card flex flex-col items-center p-4 sm:p-6 bg-white border-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 mobile-touch-target",
												quizMode === "typing"
													? "border-green-500 bg-green-50 shadow-xl scale-105"
													: "border-gray-200 hover:border-green-400 hover:shadow-lg"
											)}
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													setQuizMode("typing");
												}
											}}
										>
											<div className="game-mode-icon w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3">
												<BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
											</div>
											<h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
												Typing
											</h3>
											<p className="text-xs sm:text-sm text-gray-600 text-center">
												Type the correct translation
											</p>
											<div className="mt-1 sm:mt-2 px-2 py-1 sm:px-3 sm:py-1 bg-green-100 rounded-full">
												<span className="text-xs font-medium text-green-700">
													Challenge Mode
												</span>
											</div>
										</Label>
									</div>

									{/* Flashcards Mode */}
									<div className="relative">
										<RadioGroupItem
											value="flashcard"
											id="mode-flashcard"
											className="peer sr-only"
										/>
										<Label
											htmlFor="mode-flashcard"
											className={cn(
												"game-mode-card flex flex-col items-center p-4 sm:p-6 bg-white border-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 mobile-touch-target",
												quizMode === "flashcard"
													? "border-purple-500 bg-purple-50 shadow-xl scale-105"
													: "border-gray-200 hover:border-purple-400 hover:shadow-lg"
											)}
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													setQuizMode("flashcard");
												}
											}}
										>
											<div className="game-mode-icon w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3">
												<Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
											</div>
											<h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
												Flashcards
											</h3>
											<p className="text-xs sm:text-sm text-gray-600 text-center">
												Test your memory with cards
											</p>
											<div className="mt-1 sm:mt-2 px-2 py-1 sm:px-3 sm:py-1 bg-purple-100 rounded-full">
												<span className="text-xs font-medium text-purple-700">
													Memory Mode
												</span>
											</div>
										</Label>
									</div>

									{/* Audio Match Mode */}
									<div className="relative">
										<RadioGroupItem
											value="audioMatch"
											id="mode-audio"
											className="peer sr-only"
										/>
										<Label
											htmlFor="mode-audio"
											className={cn(
												"game-mode-card flex flex-col items-center p-4 sm:p-6 bg-white border-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 mobile-touch-target",
												quizMode === "audioMatch"
													? "border-orange-500 bg-orange-50 shadow-xl scale-105"
													: "border-gray-200 hover:border-orange-400 hover:shadow-lg"
											)}
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													setQuizMode("audioMatch");
												}
											}}
										>
											<div className="game-mode-icon w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3">
												<Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
											</div>
											<h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
												Audio Match
											</h3>
											<p className="text-xs sm:text-sm text-gray-600 text-center">
												Listen and match the sounds
											</p>
											<div className="mt-1 sm:mt-2 px-2 py-1 sm:px-3 sm:py-1 bg-orange-100 rounded-full">
												<span className="text-xs font-medium text-orange-700">
													Audio Mode
												</span>
											</div>
										</Label>
									</div>
								</RadioGroup>
							</div>

							{/* Error Display within Setup Card */}
							{error && (
								<div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl animate-shake">
									<div className="flex items-center justify-center gap-2 text-red-700">
										<AlertTriangle className="h-5 w-5" />
										<span className="font-medium">{error}</span>
									</div>
								</div>
							)}

							{/* Epic Start Button */}
							<div className="text-center">
								<Button
									onClick={handleStartQuiz}
									disabled={!canStartQuiz}
									className={cn(
										"start-quiz-button relative group px-6 py-4 sm:px-8 sm:py-6 text-lg sm:text-xl font-bold rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300 mobile-touch-target",
										canStartQuiz
											? "bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white hover:scale-110 hover:shadow-3xl hover:-translate-y-2 active:scale-105"
											: "bg-gray-300 text-gray-500 cursor-not-allowed"
									)}
									aria-label={`Start quiz for ${selectedLanguage} language`}
								>
									{canStartQuiz && (
										<div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl sm:rounded-3xl opacity-50"></div>
									)}
									<div className="relative flex items-center gap-2 sm:gap-3">
										<div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
											<Play className="h-4 w-4 sm:h-6 sm:w-6" />
										</div>
										<span className="text-base sm:text-xl">
											🚀 START CHALLENGE
										</span>
									</div>
									{canStartQuiz && (
										<div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl sm:rounded-3xl opacity-20 blur group-hover:opacity-40 transition-opacity"></div>
									)}
								</Button>

								{!canStartQuiz && !error && (
									<p className="mt-4 text-sm text-center text-gray-500 bg-gray-50 rounded-xl p-3">
										⚠️ Need at least {MIN_WORDS_FOR_QUIZ} unique words for the
										selected language
									</p>
								)}

								{canStartQuiz && (
									<p className="mt-4 text-sm text-center text-gray-600">
										🎯 Ready to challenge yourself? Let's boost your vocabulary!
									</p>
								)}
							</div>
						</div>
					</div>
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

						{/* Session Statistics */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg border text-center">
							<div>
								<p className="text-xs text-muted-foreground">Best Streak</p>
								<p className="text-lg font-bold text-orange-500 flex items-center justify-center">
									<Flame className="h-4 w-4 mr-1" />
									{sessionStats.bestStreak}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Avg Time</p>
								<p className="text-lg font-bold text-blue-500 flex items-center justify-center">
									<Clock className="h-4 w-4 mr-1" />
									{sessionStats.averageTime.toFixed(1)}s
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Mode</p>
								<p className="text-lg font-bold text-purple-500">
									{quizMode === "multipleChoice"
										? "MC"
										: quizMode === "typing"
										? "Type"
										: quizMode === "flashcard"
										? "Flash"
										: quizMode === "audioMatch"
										? "Audio"
										: "Quiz"}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Difficulty</p>
								<p className="text-lg font-bold text-indigo-500">
									{DIFFICULTY_LEVELS[selectedDifficulty].name}
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
							{storyId && (
								<Button
									asChild
									variant="outline"
									size="default"
									className="sm:size-lg"
								>
									<Link to={`/story/${storyId}`}>
										<ArrowLeft className="mr-2 h-4 w-4" /> Back to Story
									</Link>
								</Button>
							)}
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
				<div className="max-w-2xl mx-auto">
					{/* Enhanced Progress Bar with Timer */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm text-muted-foreground">
								Progress: {currentQuestionIndex + 1} / {shuffledList.length}
							</span>
							<div className="flex items-center gap-3">
								{isTimerEnabled && (
									<div className="flex items-center gap-1 text-sm">
										<Timer
											className={`h-4 w-4 ${
												timeLeft <= 10
													? "text-red-500 animate-pulse"
													: "text-muted-foreground"
											}`}
										/>
										<span
											className={`font-mono ${
												timeLeft <= 10
													? "text-red-500 font-bold"
													: "text-muted-foreground"
											}`}
										>
											{timeLeft}s
										</span>
									</div>
								)}
								<span className="text-sm text-muted-foreground">
									{Math.round(progressPercent)}%
								</span>
							</div>
						</div>
						<Progress
							value={progressPercent}
							className="h-6 bg-gray-200 dark:bg-gray-700 transition-all duration-300 shadow-sm"
						/>
						{isTimerEnabled && (
							<div className="mt-1">
								<div
									className={`h-1 rounded-full transition-all duration-1000 ease-linear ${
										timeLeft <= 10 ? "bg-red-500" : "bg-blue-500"
									}`}
									style={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
								/>
							</div>
						)}
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
									{quizMode === "audioMatch"
										? "Listen and select the translation:"
										: "Translate the word:"}
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
									{quizMode === "audioMatch" ? (
										// Audio Match Mode - Hide the word text
										<div className="flex items-center justify-center">
											<Volume2 className="h-8 w-8 mr-3 text-primary" />
											<span className="text-xl sm:text-2xl font-semibold text-primary">
												🎵 Listen to the audio
											</span>
										</div>
									) : (
										// Other modes - Show the word
										<span className="text-xl sm:text-2xl font-semibold mx-4">
											{shuffledList[currentQuestionIndex].word}
										</span>
									)}
									{/* Speaker button - only show for non-Audio Match modes */}
									{quizMode !== "audioMatch" && (
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
									)}
								</div>

								{/* Hints Section */}
								{hintsEnabled && !isAnswered && (
									<div className="text-center mb-4">
										{!showHint ? (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowHint(true)}
												className="text-xs"
											>
												<Lightbulb className="h-3 w-3 mr-1" />
												Show Hint
											</Button>
										) : (
											<div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
												💡 {getHint()}
											</div>
										)}
									</div>
								)}

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
								) : quizMode === "typing" ? (
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
								) : quizMode === "flashcard" ? (
									// Flashcard Mode UI
									<div className="mb-4">
										<div
											className={cn(
												"relative w-full h-40 cursor-pointer transition-transform duration-300",
												isFlashcardFlipped && "scale-105"
											)}
											onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
										>
											{!isFlashcardFlipped ? (
												// Front of card - show instruction
												<div className="w-full h-full border-2 border-primary/20 rounded-lg p-6 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
													<span className="text-lg font-semibold text-primary text-center">
														Click to reveal translation
													</span>
												</div>
											) : (
												// Back of card - show translation
												<div className="w-full h-full border-2 border-green-400 rounded-lg p-6 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
													<span className="text-2xl font-bold text-green-800 text-center">
														{shuffledList[currentQuestionIndex].translation}
													</span>
												</div>
											)}
										</div>

										{isFlashcardFlipped && !isAnswered && (
											<div className="mt-4 text-center">
												<p className="text-sm text-muted-foreground mb-3">
													How well did you know this word?
												</p>
												<div className="grid grid-cols-3 gap-2">
													<Button
														variant="outline"
														className="border-red-300 text-red-700 hover:bg-red-50"
														onClick={() => handleFlashcardAnswer("again")}
													>
														😓 Hard
													</Button>
													<Button
														variant="outline"
														className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
														onClick={() => handleFlashcardAnswer("good")}
													>
														🤔 Good
													</Button>
													<Button
														variant="outline"
														className="border-green-300 text-green-700 hover:bg-green-50"
														onClick={() => handleFlashcardAnswer("easy")}
													>
														😊 Easy
													</Button>
												</div>
											</div>
										)}
									</div>
								) : quizMode === "audioMatch" ? (
									// Audio Match Mode UI
									<div className="mb-4">
										{/* Audio Play Section */}
										<div className="text-center mb-6">
											<div className="mb-4">
												<p className="text-sm text-muted-foreground mb-3">
													Listen to the word and select its translation:
												</p>
												<Button
													variant="default"
													size="lg"
													onClick={() =>
														speakWord(
															shuffledList[currentQuestionIndex].word,
															shuffledList[currentQuestionIndex].sourceLanguage
														)
													}
													disabled={!ttsReady}
													className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-md"
												>
													<Volume2
														className={`h-6 w-6 mr-2 ${
															isSpeaking ? "animate-pulse" : ""
														}`}
													/>
													{isSpeaking ? "Playing..." : "Play Word"}
												</Button>
											</div>
											{!ttsReady && (
												<p className="text-xs text-yellow-600">
													Text-to-speech is loading...
												</p>
											)}
										</div>

										{/* Multiple Choice Options for Audio */}
										<div className="grid grid-cols-1 gap-3">
											{currentOptions.map((option, idx) => (
												<Button
													key={idx}
													variant="outline"
													className={cn(
														"w-full justify-start text-left h-auto py-3 px-4 text-sm sm:text-base whitespace-normal transition-all duration-200 ease-in-out transform focus:ring-2 focus:ring-offset-2 bg-background",
														isAnswered &&
															option ===
																shuffledList[currentQuestionIndex]
																	?.translation &&
															"bg-green-100 border-green-400 text-green-800 hover:bg-green-100 ring-green-500 scale-105 shadow animate-pulse-slow",
														isAnswered &&
															selectedAnswer === option &&
															option !==
																shuffledList[currentQuestionIndex]
																	?.translation &&
															"bg-red-100 border-red-400 text-red-800 hover:bg-red-100 ring-red-500 scale-105 shadow animate-pulse-fast",
														isAnswered &&
															option !==
																shuffledList[currentQuestionIndex]
																	?.translation &&
															option !== selectedAnswer &&
															"opacity-50 border-muted cursor-not-allowed",
														!isAnswered &&
															"hover:bg-accent hover:scale-103 hover:shadow-md"
													)}
													onClick={() => handleOptionClick(option)}
													disabled={isAnswered}
													aria-label={`Select answer: ${option}`}
												>
													<div className="flex items-center w-full">
														<span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-medium mr-3 flex-shrink-0">
															{idx + 1}
														</span>
														<span className="flex-grow">{option}</span>
													</div>
												</Button>
											))}
										</div>

										{/* Auto-replay audio hint and keyboard shortcuts */}
										{!isAnswered && (
											<div className="text-center mt-4 space-y-2">
												<p className="text-xs text-muted-foreground">
													You can replay the audio as many times as needed
												</p>
												<div className="flex justify-center items-center gap-4 text-xs text-muted-foreground">
													<span className="flex items-center gap-1">
														<kbd className="px-2 py-1 bg-muted rounded text-xs">
															Space
														</kbd>
														Replay audio
													</span>
													<span className="flex items-center gap-1">
														<kbd className="px-2 py-1 bg-muted rounded text-xs">
															1-4
														</kbd>
														Select option
													</span>
												</div>
											</div>
										)}
									</div>
								) : (
									// Default fallback to multiple choice
									<div className="text-center text-muted-foreground">
										Unsupported quiz mode. Please refresh and try again.
									</div>
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
