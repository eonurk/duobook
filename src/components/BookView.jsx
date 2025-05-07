import React, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Tooltip from "./Tooltip"; // Import the Tooltip component
import VocabularyList from "./VocabularyList"; // Import VocabularyList
import { useAuth } from "@/context/AuthContext"; // Import useAuth
// import { doc, updateDoc, increment, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore'; // Remove db import
// import { collection, addDoc } from 'firebase/firestore'; // Keep if still needed for something else?
// import { checkAchievements } from './Gamification/Achievements'; // Import achievements checker
// import { checkChallengeCompletion, updateChallengeProgress } from './Gamification/DailyChallenges'; // Import challenge functions

// Import API function for challenge progress
import { postChallengeProgress } from "@/lib/api";

// Add CSS for mobile responsiveness
import "./BookView.mobile.css"; // This will be created next

import {
	Volume2,
	VolumeX,
	AlertTriangle,
	SlidersHorizontal,
	ChevronLeft,
	ChevronRight,
	RotateCcw,
	Info,
	CheckCircle,
	Zap,
	Languages,
	BarChart3,
	CalendarDays,
} from "lucide-react"; // ADDED Icons

// Helper function to normalize words (lowercase, remove punctuation)
const normalizeWord = (word) => {
	return word.toLowerCase().replace(/[.,!?;:()"']/g, "");
};

// --- TTS Helper ---
// Basic mapping, might need more comprehensive language code mapping (e.g., 'Spanish' -> 'es-ES', 'es-MX', etc.)
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
	greek: "el-GR",
};

// Preferred voices for specific languages (these typically sound better)
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

// TTS Helper function to get the best available voice for a language
const getBestVoiceForLanguage = (voices, langCode) => {
	if (!voices || voices.length === 0) return null;

	// First try to find preferred voices
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

	// Then try exact language match
	const exactMatch = voices.find((voice) => voice.lang === langCode);
	if (exactMatch) return exactMatch;

	// Then try language base match (e.g., 'en' for 'en-US')
	const baseCode = langCode.split("-")[0];
	const baseMatch = voices.find((voice) => voice.lang.startsWith(baseCode));
	if (baseMatch) return baseMatch;

	// Fallback to default voice
	return voices.find((voice) => voice.default) || voices[0];
};

function BookView({
	sentencePairs,
	vocabulary,
	targetLanguage,
	sourceLanguage,
	onGoBack,
	isExample = false,
}) {
	const { currentUser } = useAuth(); // Removed userProgress, fetchUserProgress if not needed directly

	// Default implementation for onGoBack if not provided
	const handleGoBack = useCallback(() => {
		console.log("Create Story button clicked");

		// Scroll to the top of the page for story creation
		window.scrollTo({ top: 0, behavior: "smooth" });

		if (typeof onGoBack === "function") {
			console.log("Using provided onGoBack function");
			onGoBack();
		} else {
			console.log("No onGoBack function provided, navigating to home");
			// Try going to home page
			try {
				window.location.href = "/";
			} catch (error) {
				console.error("Navigation error:", error);
				alert(
					"Could not navigate to story creation. Please try using your browser's navigation."
				);
			}
		}
	}, [onGoBack]);

	// State for current sentence focus
	const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
	// State to track revealed source sentences (using a Set for efficient lookup)
	const [revealedSourceIndices, setRevealedSourceIndices] = useState(new Set());
	const [isFinished, setIsFinished] = useState(false); // State for completion
	// Default showAllSource state to false (hide translations by default)
	const [showAllSource, setShowAllSource] = useState(false); // State for toggling source visibility
	// Add state for vocabulary expansion
	const [isVocabExpanded, setIsVocabExpanded] = useState(false);

	// --- TTS State ---
	const [voices, setVoices] = useState([]);
	const [ttsReady, setTtsReady] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false); // Track speaking state
	const [speechRate, setSpeechRate] = useState(0.9); // Default speech rate
	const [speechPitch, setSpeechPitch] = useState(1.0); // Default speech pitch
	const [autoPlayEnabled, setAutoPlayEnabled] = useState(false); // Auto-play option
	const [selectedVoiceURI, setSelectedVoiceURI] = useState(null); // Store selected voice URI
	const [isVoiceAvailableForTargetLang, setIsVoiceAvailableForTargetLang] =
		useState(true); // NEW STATE
	const synth = window.speechSynthesis; // Get synthesis object

	// --- Advanced TTS Controls ---
	const [showTtsControls, setShowTtsControls] = useState(false);

	// --- Load Voices & Set Default ---
	const populateVoiceList = useCallback(() => {
		if (!synth) return;
		const availableVoices = synth.getVoices();
		const uniqueVoices = Array.from(
			new Map(availableVoices.map((v) => [v.voiceURI, v])).values()
		);
		setVoices(uniqueVoices);
		setTtsReady(uniqueVoices.length > 0);
		if (uniqueVoices.length === 0) {
			console.warn("BookView: No voices loaded by the browser.");
			setIsVoiceAvailableForTargetLang(false); // If no voices at all, then definitely not for target lang
		}
	}, [synth]);

	useEffect(() => {
		populateVoiceList();
		if (synth && synth.onvoiceschanged !== undefined) {
			synth.onvoiceschanged = populateVoiceList;
		}
		// Cleanup on unmount
		return () => {
			if (synth) {
				synth.cancel(); // Stop any speech on unmount
				synth.onvoiceschanged = null;
			}
		};
	}, [populateVoiceList, synth]);

	// Effect to check voice availability for the target language when voices or targetLanguage change
	useEffect(() => {
		if (ttsReady && targetLanguage) {
			// Only proceed if TTS is ready and we have a target language
			const targetLangCode = getLangCode(targetLanguage);
			if (voices.length > 0) {
				// And if voices have been loaded
				const bestVoice = getBestVoiceForLanguage(voices, targetLangCode);
				if (
					bestVoice &&
					bestVoice.lang &&
					bestVoice.lang.startsWith(targetLangCode.split("-")[0])
				) {
					setSelectedVoiceURI(bestVoice.voiceURI);
					setIsVoiceAvailableForTargetLang(true);
				} else {
					setSelectedVoiceURI(null);
					setIsVoiceAvailableForTargetLang(false);
				}
			} else if (ttsReady && voices.length === 0) {
				// TTS is ready but no voices loaded at all
				setIsVoiceAvailableForTargetLang(false);
				setSelectedVoiceURI(null);
				console.warn(
					"BookView: TTS ready but no voices available on the system."
				);
			}
		}
	}, [voices, targetLanguage, ttsReady]); // Rerun when voices, targetLanguage, or ttsReady changes

	// Reset progress when sentencePairs change (e.g., new book generated)
	useEffect(() => {
		setActiveSentenceIndex(0);
		setRevealedSourceIndices(new Set());
		setIsFinished(false);
		setShowAllSource(false); // Reset toggle too
		if (synth?.speaking) synth.cancel(); // Stop speech if generating new story
	}, [sentencePairs, synth]); // Add synth here

	// Tooltip State (remains the same)
	const [tooltipVisible, setTooltipVisible] = useState(false);
	const [tooltipContent, setTooltipContent] = useState("");
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

	// --- Word Hover Logic ---
	const vocabularyMap = useMemo(() => {
		const map = new Map();
		if (vocabulary) {
			// Check if vocabulary exists
			vocabulary.forEach((item) => {
				map.set(item.word.toLowerCase(), item.translation);
			});
		}
		return map;
	}, [vocabulary]);

	// New state for tracking word interactions and gamification
	const [wordsLearned, setWordsLearned] = useState(new Set());

	// Enhanced word hover function to track vocabulary interactions
	const handleWordHover = async (event, word) => {
		const normalized = normalizeWord(word);
		const translation = vocabularyMap.get(normalized);

		if (translation) {
			const rect = event.target.getBoundingClientRect();
			setTooltipPosition({
				x: rect.left + rect.width / 2 + window.scrollX,
				y: rect.top + window.scrollY,
			});
			setTooltipContent(translation);
			setTooltipVisible(true);

			// Track unique words learned in *this session* to avoid spamming API
			if (!wordsLearned.has(normalized) && !isExample && currentUser) {
				const newWordsLearned = new Set(wordsLearned);
				newWordsLearned.add(normalized);
				setWordsLearned(newWordsLearned);

				// Call API to update LEARN_WORDS challenge progress
				try {
					console.log("Attempting to post LEARN_WORDS challenge progress...");
					const result = await postChallengeProgress({
						challengeType: "LEARN_WORDS",
						incrementAmount: 1,
					});
					console.log("Challenge progress LEARN_WORDS response:", result);
					// Optionally show notification if result.completedChallenges has items
					if (result?.completedChallenges?.length > 0) {
						alert(
							`Challenge Completed: ${result.completedChallenges[0].title}! +${result.completedChallenges[0].xpReward} Points`
						);
					}
				} catch (error) {
					console.error("Error posting LEARN_WORDS challenge progress:", error);
				}
			}
		}
	};

	const handleWordLeave = () => {
		setTooltipVisible(false);
		setTooltipContent("");
	};

	// Helper to wrap words in hoverable spans
	const wrapWordsInSpans = (text, sentenceIndex) => {
		// Only allow hover if the sentence is active AND the story isn't finished
		const isHoverableSentence =
			sentenceIndex === activeSentenceIndex && !isFinished;
		const words = text.split(/(\s+)/);
		return words.map((word, i) => {
			if (word.trim().length === 0) {
				return (
					<React.Fragment key={`space-${sentenceIndex}-${i}`}>
						{word}
					</React.Fragment>
				);
			}
			const normalized = normalizeWord(word);
			const hasTranslation = vocabularyMap.has(normalized);
			const canHover = isHoverableSentence && hasTranslation;

			return (
				<span
					key={`word-${sentenceIndex}-${i}`}
					className={`word ${canHover ? "word-hoverable" : ""}`}
					onMouseEnter={canHover ? (e) => handleWordHover(e, word) : null}
					onMouseLeave={canHover ? handleWordLeave : null}
				>
					{word}
				</span>
			);
		});
	};

	// New state for hover highlighting
	const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState(null);

	// Calculate Progress
	const progressPercent =
		sentencePairs.length > 0
			? ((activeSentenceIndex + (isFinished ? 1 : 0)) / sentencePairs.length) *
			  100
			: 0;

	// Remove the color palette generation and just use a single highlight color
	const activeHighlightColor = "rgba(255, 243, 205, 0.8)"; // Light yellow highlight
	const hoverHighlightColor = "rgba(255, 243, 205, 1)"; // Slightly stronger on hover

	// --- Toggle Source Logic ---
	const handleToggleSource = () => {
		setShowAllSource((prev) => !prev);
	};

	// --- Speak Function ---
	const handleSpeak = useCallback(
		(textToSpeak) => {
			if (
				!synth ||
				!ttsReady ||
				!textToSpeak ||
				!isVoiceAvailableForTargetLang
			) {
				if (!isVoiceAvailableForTargetLang)
					console.warn(
						"BookView: Speak called but no voice available for target language."
					);
				return;
			}
			if (synth.speaking) synth.cancel();

			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			const voiceToUse = selectedVoiceURI
				? voices.find((v) => v.voiceURI === selectedVoiceURI)
				: null;

			if (voiceToUse) {
				utterance.voice = voiceToUse;
			} else {
				// This case should ideally not be hit if isVoiceAvailableForTargetLang is true and selectedVoiceURI is set.
				// But as a fallback, try to find one last time.
				const targetLangCode = getLangCode(targetLanguage);
				const fallbackVoice = getBestVoiceForLanguage(voices, targetLangCode);
				if (
					fallbackVoice &&
					fallbackVoice.lang &&
					fallbackVoice.lang.startsWith(targetLangCode.split("-")[0])
				) {
					utterance.voice = fallbackVoice;
				} else {
					console.error(
						"BookView: Critical - Could not find any voice for speech despite isVoiceAvailable=true."
					);
					return; // Don't attempt to speak with a potentially wrong voice.
				}
			}

			utterance.rate = speechRate;
			utterance.pitch = speechPitch;
			utterance.onstart = () => setIsSpeaking(true);
			utterance.onend = () => {
				setIsSpeaking(false);
				if (
					autoPlayEnabled &&
					activeSentenceIndex < sentencePairs.length - 1 &&
					!isFinished
				) {
					handleNextSentence(); // Make sure handleNextSentence is defined
				}
			};
			utterance.onerror = (event) => {
				console.error("BookView: Speech synthesis error:", event.error);
				setIsSpeaking(false);
			};
			synth.speak(utterance);
		},
		[
			synth,
			ttsReady,
			isVoiceAvailableForTargetLang,
			selectedVoiceURI,
			voices,
			targetLanguage,
			speechRate,
			speechPitch,
			autoPlayEnabled,
			activeSentenceIndex,
			sentencePairs,
			isFinished,
		]
	);

	// Auto-play when active sentence changes
	useEffect(() => {
		if (autoPlayEnabled && !isFinished && sentencePairs.length > 0) {
			const currentSentence = sentencePairs[activeSentenceIndex]?.target;
			if (currentSentence) {
				handleSpeak(currentSentence);
			}
		}
		// Stop speech if autoPlay is turned off
		if (!autoPlayEnabled && synth?.speaking) {
			synth.cancel();
		}
	}, [activeSentenceIndex, autoPlayEnabled, isFinished, sentencePairs]); // Removed handleSpeak from deps

	// --- TTS Controls ---
	const handleToggleAutoPlay = () => setAutoPlayEnabled((prev) => !prev);

	const handleRateChange = (e) => setSpeechRate(parseFloat(e.target.value));

	const handlePitchChange = (e) => setSpeechPitch(parseFloat(e.target.value));

	const handleVoiceChange = (e) => setSelectedVoiceURI(e.target.value);

	const toggleTtsControls = () => setShowTtsControls((prev) => !prev);

	// --- Interaction Logic ---
	const handleSentenceClick = (index) => {
		// Prevent multiple clicks from being processed at once
		if (isNavigating) return;

		setIsNavigating(true);

		// Only allow clicking the active or past sentences
		if (index === activeSentenceIndex && !isFinished) {
			handleNextSentence();
		} else if (index < activeSentenceIndex) {
			setActiveSentenceIndex(index);
			setIsFinished(false);
			if (synth?.speaking) synth.cancel();
		}

		// Reset navigation lock after a short delay
		setTimeout(() => setIsNavigating(false), 300);
	};

	// Add state for navigation lock
	const [isNavigating, setIsNavigating] = useState(false);

	const handlePrevSentence = () => {
		if (activeSentenceIndex > 0 && !isNavigating) {
			setIsNavigating(true);

			// Reveal the source for the sentence we are LEAVING
			if (!revealedSourceIndices.has(activeSentenceIndex)) {
				setRevealedSourceIndices((prev) =>
					new Set(prev).add(activeSentenceIndex)
				);
			}
			// Then move back
			setActiveSentenceIndex((prev) => prev - 1);
			setIsFinished(false);
			if (synth?.speaking) synth.cancel();

			setTimeout(() => setIsNavigating(false), 300);
		}
	};

	const handleNextSentence = async () => {
		if (isNavigating) return;
		setIsNavigating(true);

		// Reveal the current source sentence if not already revealed
		if (!revealedSourceIndices.has(activeSentenceIndex)) {
			const newRevealedIndices = new Set(revealedSourceIndices);
			newRevealedIndices.add(activeSentenceIndex);
			setRevealedSourceIndices(newRevealedIndices);
		}

		const isFinishing = activeSentenceIndex === sentencePairs.length - 1;

		if (!isFinishing) {
			// Move to next sentence
			setActiveSentenceIndex((prevIndex) => prevIndex + 1);
		} else {
			// At the end, mark as finished
			setIsFinished(true);

			// If finishing a non-example story, post progress for READ_STORY challenge
			if (!isExample && currentUser) {
				try {
					console.log("Attempting to post READ_STORY challenge progress...");
					const result = await postChallengeProgress({
						challengeType: "READ_STORY",
					});

					// Optionally show notification
					if (result?.completedChallenges?.length > 0) {
						alert(
							`Challenge Completed: ${result.completedChallenges[0].title}! +${result.completedChallenges[0].xpReward} Points`
						);
					}
				} catch (error) {
					console.error("Error posting READ_STORY challenge progress:", error);
				}
			}
		}

		setTimeout(() => setIsNavigating(false), 300);
	};

	// --- Restart Logic ---
	const handleRestart = () => {
		setActiveSentenceIndex(0);
		setRevealedSourceIndices(new Set());
		setIsFinished(false);
		setShowAllSource(false);
		if (synth?.speaking) synth.cancel();
		document
			.querySelector(".book-view")
			?.scrollIntoView({ behavior: "smooth" });
	};

	// Flag to determine if we're in mobile view
	const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

	// Listen for resize events to update mobile view state
	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth < 768);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Function to handle reveal of source sentence
	const handleRevealSource = (index) => {
		// Create a new Set with the current revealed indices
		const newRevealedIndices = new Set(revealedSourceIndices);
		// Add this sentence index to the revealed set
		newRevealedIndices.add(index);
		// Update the state with the new set
		setRevealedSourceIndices(newRevealedIndices);
	};

	// --- Rendering ---
	return (
		<div
			className={`${isExample ? "example-book-container" : ""} ${
				isFinished ? "story-finished-container" : ""
			} ${isMobileView ? "mobile-view" : ""}`}
		>
			{/* Progress Bar - Show always */}
			<div className="progress-container">
				<div
					className="progress-bar-fill"
					style={{ width: `${progressPercent}%` }}
				></div>
				<span className="progress-text">
					{Math.round(progressPercent)}% Complete
				</span>
			</div>

			{/* Book View itself */}
			<div
				className={`book-view ${isExample ? "book-view-example" : ""} ${
					isFinished ? "book-view-finished" : ""
				} ${isMobileView ? "book-view-mobile" : ""}`}
				data-language={targetLanguage || "Story"}
			>
				{/* If mobile, render sentences as pairs in vertical layout */}
				{isMobileView ? (
					<div className="mobile-sentences-container">
						{/* Add language header at the top of mobile view */}
						<div className="mobile-language-header">
							<h3>
								{targetLanguage || "Target"} → {sourceLanguage || "Source"}
							</h3>
						</div>

						{/* Only render 3 cards: previous (if exists), current and next (if exists) */}
						{sentencePairs.map((pair, index) => {
							// Only show cards that are adjacent to the active sentence
							// For first sentence, there's no previous one
							// For last sentence, there's no next one
							const isPrevious = index === activeSentenceIndex - 1;
							const isCurrent = index === activeSentenceIndex;
							const isNext = index === activeSentenceIndex + 1;

							// Skip rendering if not one of the visible cards
							if (!isPrevious && !isCurrent && !isNext) {
								return null;
							}

							// Determine sentence state based on position
							let sentenceClass = "";
							if (isPrevious) {
								sentenceClass = "sentence-previous";
							} else if (isCurrent) {
								sentenceClass = "sentence-active";
							} else if (isNext) {
								sentenceClass = "sentence-next";
							}

							// Apply finished style when story is finished
							if (isFinished) sentenceClass += " sentence-finished";

							const isRevealed = revealedSourceIndices.has(index);
							const finishedClass =
								isFinished && !isExample ? "sentence-finished" : "";

							// Can speak if TTS ready and sentence is active (examples or not)
							const canSpeak = ttsReady && index === activeSentenceIndex;

							return (
								<div
									key={`sentence-pair-mobile-${pair.id}-${index}`}
									className={`mobile-sentence-pair ${sentenceClass}`}
								>
									{/* Card header with sentence number */}
									<div className="card-header">
										<div></div> {/* Empty div to maintain flex structure */}
										<span className="sentence-number">
											Sentence {index + 1} of {sentencePairs.length}
										</span>
									</div>

									{/* Target sentence */}
									<div
										className={`mobile-target-sentence ${sentenceClass}`}
										onClick={() => handleSentenceClick(index)}
										style={{
											cursor: "pointer",
											backgroundColor:
												index === activeSentenceIndex
													? hoveredSentenceIndex === index
														? hoverHighlightColor
														: activeHighlightColor
													: "transparent",
											transition: "background-color 0.3s ease",
										}}
										onMouseEnter={() =>
											index === activeSentenceIndex &&
											setHoveredSentenceIndex(index)
										}
										onMouseLeave={() => setHoveredSentenceIndex(null)}
									>
										{canSpeak && (
											<button
												className={`speak-button ${
													isSpeaking ? "speaking" : ""
												}`}
												onClick={(e) => {
													e.stopPropagation();
													handleSpeak(pair.target);
												}}
												title={`Speak sentence in ${targetLanguage}`}
												aria-label={`Speak sentence in ${targetLanguage}`}
											>
												🔊
											</button>
										)}
										{wrapWordsInSpans(pair.target, index)}
									</div>

									{/* Source sentence - simplified revealing with no button */}
									<div
										className={`mobile-source-sentence ${
											isRevealed ? "source-revealed" : "source-not-revealed"
										} ${finishedClass}`}
										onClick={(e) => {
											// Prevent bubbling and reveal translation on click
											e.stopPropagation();
											if (!isRevealed && isCurrent) {
												handleRevealSource(index);
											}
										}}
										style={{
											backgroundColor:
												index === activeSentenceIndex &&
												(isRevealed || showAllSource)
													? hoveredSentenceIndex === index
														? hoverHighlightColor
														: activeHighlightColor
													: isRevealed ||
													  (showAllSource && index === activeSentenceIndex)
													? "#f8f9fa" // Light background for revealed translations
													: "#eef2f7", // Original background for unrevealed translations
											transition: "background-color 0.3s ease",
										}}
										onMouseEnter={() =>
											index === activeSentenceIndex &&
											(isRevealed || showAllSource) &&
											setHoveredSentenceIndex(index)
										}
										onMouseLeave={() => setHoveredSentenceIndex(null)}
									>
										{isRevealed ||
										(showAllSource && index === activeSentenceIndex) ? (
											// Show actual translation
											<span className="translation-text">{pair.source}</span>
										) : index === activeSentenceIndex ? (
											// Just show the translation directly, it will be revealed on click
											<span className="translation-text muted">
												{pair.source}
											</span>
										) : null}
									</div>
								</div>
							);
						})}
					</div>
				) : (
					// Original desktop layout (two columns)
					<>
						{/* Target Language Page */}
						<div className="page page-target">
							<h3>{targetLanguage || "Target Language"}</h3>
							<div className="story-content">
								{sentencePairs.map((pair, index) => {
									// Determine sentence state based on active index
									let sentenceClass = "";
									if (index < activeSentenceIndex) {
										sentenceClass = "sentence-past"; // Previously read
									} else if (index === activeSentenceIndex) {
										sentenceClass = "sentence-active"; // Current focus
									} else {
										sentenceClass = "sentence-future"; // Not yet revealed
									}
									// Apply finished style always when finished
									if (isFinished)
										sentenceClass = "sentence-past sentence-finished";

									// Can speak if TTS ready and sentence is active (examples or not)
									const canSpeak = ttsReady && index === activeSentenceIndex;

									return (
										<React.Fragment key={`target-fragment-${pair.id}-${index}`}>
											{/* Add space before sentences (except the first one) */}
											{index > 0 && " "}
											<span
												key={`target-${pair.id}-${index}`}
												className={`sentence target-sentence ${sentenceClass}`}
												onClick={() => handleSentenceClick(index)}
												// Allow clicking active or past sentences (for example reveal too)
												style={{
													cursor: "pointer",
													backgroundColor:
														index === activeSentenceIndex
															? hoveredSentenceIndex === index
																? hoverHighlightColor
																: activeHighlightColor
															: "transparent",
													transition: "background-color 0.3s ease",
													boxShadow:
														index === activeSentenceIndex
															? "0 0 3px rgba(0,0,0,0.1)"
															: "none",
												}}
												onMouseEnter={() =>
													index === activeSentenceIndex &&
													setHoveredSentenceIndex(index)
												}
												onMouseLeave={() => setHoveredSentenceIndex(null)}
											>
												{canSpeak && (
													<button
														className={`speak-button ${
															isSpeaking ? "speaking" : ""
														}`}
														onClick={(e) => {
															e.stopPropagation();
															handleSpeak(pair.target);
														}}
														title={`Speak sentence in ${targetLanguage}`}
														aria-label={`Speak sentence in ${targetLanguage}`}
													>
														🔊
													</button>
												)}
												{wrapWordsInSpans(pair.target, index)}
											</span>
										</React.Fragment>
									);
								})}
							</div>
						</div>

						{/* Source Language Page */}
						<div className="page page-source">
							<h3>{sourceLanguage || "Your Language"}</h3>
							<div className="story-content">
								{sentencePairs.map((pair, index) => {
									const isRevealed = revealedSourceIndices.has(index);
									const finishedClass =
										isFinished && !isExample ? "sentence-finished" : "";

									return (
										<React.Fragment key={`source-fragment-${pair.id}-${index}`}>
											{/* Add space before sentences (except the first one) */}
											{index > 0 && " "}
											<span
												key={`source-${pair.id}-${index}`}
												className={`sentence source-sentence ${
													isRevealed
														? "sentence-revealed"
														: "sentence-not-revealed"
												} ${
													index === activeSentenceIndex
														? "sentence-active-source"
														: ""
												} ${finishedClass}`}
												style={{
													backgroundColor:
														(index === activeSentenceIndex &&
															(isRevealed || showAllSource)) ||
														(hoveredSentenceIndex === index &&
															(isRevealed || showAllSource))
															? hoveredSentenceIndex === index
																? hoverHighlightColor
																: activeHighlightColor
															: "transparent",
													transition: "background-color 0.3s ease",
													boxShadow:
														index === activeSentenceIndex &&
														(isRevealed || showAllSource)
															? "0 0 3px rgba(0,0,0,0.1)"
															: "none",
												}}
												onMouseEnter={() =>
													index === activeSentenceIndex &&
													(isRevealed || showAllSource) &&
													setHoveredSentenceIndex(index)
												}
												onMouseLeave={() => setHoveredSentenceIndex(null)}
											>
												{isRevealed ||
												(showAllSource && index === activeSentenceIndex) ? (
													pair.source
												) : index === activeSentenceIndex ? (
													<span
														onClick={(e) => {
															e.stopPropagation();
															handleRevealSource(index);
														}}
														className="reveal-text-desktop"
													>
														{/* No button, just text that can be clicked */}
														{pair.source}
													</span>
												) : (
													""
												)}
											</span>
										</React.Fragment>
									);
								})}
							</div>
						</div>
					</>
				)}
			</div>

			<Tooltip
				content={tooltipContent}
				position={tooltipPosition}
				visible={tooltipVisible}
			/>

			{/* Audio Controls Section */}
			{ttsReady && (
				<div className="audio-controls flex items-center justify-between space-x-2 mb-0 pb-0 p-3 rounded-lg max-w-xs mx-auto">
					{/* Left part: Auto-Play toggle (conditionally rendered) */}
					<div className="flex items-center space-x-2">
						{isVoiceAvailableForTargetLang ? (
							<label
								htmlFor="autoplay"
								className="flex items-center cursor-pointer text-sm text-slate-700 select-none"
								title={
									autoPlayEnabled ? "Disable auto-play" : "Enable auto-play"
								}
							>
								<span className="mr-2 ml-2">Auto-Play:</span>
								<div className="relative">
									<input
										type="checkbox"
										id="autoplay"
										checked={autoPlayEnabled}
										onChange={handleToggleAutoPlay}
										className="sr-only"
									/>
									<div
										className={`block w-10 h-6 rounded-full transition-colors ${
											autoPlayEnabled ? "bg-amber-500" : "bg-slate-300"
										}`}
									></div>
									<div
										className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
											autoPlayEnabled ? "translate-x-full" : ""
										}`}
									></div>
								</div>
							</label>
						) : (
							<div
								className="flex items-center space-x-1.5 text-sm text-slate-500 px-2 py-1"
								title={`Text-to-speech (and thus Auto-Play) is not available for ${targetLanguage} on your current browser/OS.`}
							>
								<AlertTriangle className="w-4 h-4 flex-shrink-0 text-orange-400" />
								<span>Auto-Play unavailable</span>
							</div>
						)}
					</div>

					{/* Right part: Settings Button (icon only) */}
					<button
						onClick={toggleTtsControls}
						className="text-sm text-slate-600 hover:text-slate-800 p-2 rounded-md hover:bg-slate-200 transition-colors flex items-center"
						title="Advanced TTS Settings"
					>
						<SlidersHorizontal className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* Advanced TTS Controls Panel - Conditionally render voice selection based on availability */}
			{showTtsControls && ttsReady && (
				<div className="advanced-tts-controls p-3 bg-slate-100 rounded-lg mb-4 shadow-md space-y-3 max-w-xs mx-auto">
					{isVoiceAvailableForTargetLang &&
					voices.length > 0 &&
					getLangCode(targetLanguage) ? (
						<div className="flex flex-col">
							<label
								htmlFor="voice-select"
								className="text-xs font-medium text-slate-600 mb-0.5"
							>
								Voice:
							</label>
							<select
								id="voice-select"
								value={selectedVoiceURI || ""}
								onChange={handleVoiceChange}
								className="block w-full text-sm p-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
							>
								{voices
									.filter((voice) =>
										voice.lang.startsWith(
											getLangCode(targetLanguage).split("-")[0]
										)
									) // Show only relevant language voices
									.map((voice) => (
										<option key={voice.voiceURI} value={voice.voiceURI}>
											{voice.name} ({voice.lang})
										</option>
									))}
							</select>
						</div>
					) : (
						<p className="text-xs text-slate-500">
							Voice selection is not available for {targetLanguage} as a
							suitable voice was not found on your system.
						</p>
					)}
					{/* Speed and Pitch controls can remain, as they apply to any voice that might be used (or browser default) */}
					<div className="flex flex-col">
						<label
							htmlFor="rate"
							className="text-xs font-medium text-slate-600 mb-0.5"
						>
							Speed: {speechRate.toFixed(1)}x
						</label>
						<input
							type="range"
							id="rate"
							min="0.5"
							max="2"
							step="0.1"
							value={speechRate}
							onChange={handleRateChange}
							className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
						/>
					</div>
					<div className="flex flex-col">
						<label
							htmlFor="pitch"
							className="text-xs font-medium text-slate-600 mb-0.5"
						>
							Pitch: {speechPitch.toFixed(1)}
						</label>
						<input
							type="range"
							id="pitch"
							min="0"
							max="2"
							step="0.1"
							value={speechPitch}
							onChange={handlePitchChange}
							className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
						/>
					</div>
				</div>
			)}

			{/* Navigation Buttons - Show always */}
			<div
				className={`navigation-controls button-container ${
					isMobileView ? "mobile-navigation" : ""
				}`}
			>
				<button
					onClick={handlePrevSentence}
					className="button button-tertiary nav-button"
					disabled={activeSentenceIndex === 0}
				>
					&larr; Prev
				</button>

				<button
					onClick={() => handleNextSentence()}
					className="button button-primary nav-button next-button"
					disabled={isFinished}
				>
					{activeSentenceIndex === sentencePairs.length - 1 ? "Finish" : "Next"}{" "}
					&rarr;
				</button>
			</div>

			{/* Congratulatory Message - Show always when finished */}
			{isFinished && (
				<div className="congrats-message">
					🎉 Well done! You finished the story! 🎉
				</div>
			)}

			{/* Render Vocabulary List (Show for examples too) */}
			{isMobileView ? (
				<div className="vocabulary-container mobile-vocabulary">
					<div
						className="vocabulary-header"
						onClick={() => setIsVocabExpanded(!isVocabExpanded)}
					>
						<h3>Key Vocabulary ({vocabulary?.length || 0})</h3>
						<span className="expand-icon">{isVocabExpanded ? "▼" : "▶"}</span>
					</div>
					{isVocabExpanded && (
						<div className="vocabulary-list">
							{vocabulary && vocabulary.length > 0 ? (
								<ul className="simple-vocab-list">
									{vocabulary.map((item, index) => (
										<li key={`vocab-${index}`}>
											<strong>{item.word}</strong>: {item.translation}
										</li>
									))}
								</ul>
							) : (
								<p>No vocabulary items available.</p>
							)}
						</div>
					)}
				</div>
			) : (
				<VocabularyList vocabulary={vocabulary} />
			)}

			{/* Action Buttons - Show always */}
			<div
				className={`action-buttons button-container button-container-multiple ${
					isMobileView ? "mobile-buttons" : ""
				}`}
			>
				<button onClick={handleRestart} className="button button-tertiary">
					Restart Story
				</button>
				<button onClick={handleToggleSource} className="button button-tertiary">
					{showAllSource ? "Hide" : "Show"} All Translations
				</button>
				<button
					onClick={handleGoBack}
					className="button button-secondary create-button"
				>
					Create Your First Story
				</button>
			</div>
		</div>
	);
}

export default BookView;
