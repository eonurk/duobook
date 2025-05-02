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
	const synth = window.speechSynthesis; // Get synthesis object

	// --- Advanced TTS Controls ---
	const [showTtsControls, setShowTtsControls] = useState(false);

	// --- Load Voices & Set Default ---
	const populateVoiceList = useCallback(() => {
		if (!synth) return;
		const availableVoices = synth.getVoices();
		// Filter out duplicate voice URIs which can happen sometimes
		const uniqueVoices = Array.from(
			new Map(availableVoices.map((v) => [v.voiceURI, v])).values()
		);
		setVoices(uniqueVoices);
		if (uniqueVoices.length > 0) {
			setTtsReady(true);
			// We will set the default voice in a separate effect based on ttsReady
		}
	}, [synth]); // Removed targetLanguage and selectedVoiceURI dependencies

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
	const handleSpeak = (textToSpeak) => {
		if (!synth || !ttsReady || !textToSpeak) return;
		if (synth.speaking) synth.cancel(); // Cancel previous before starting new

		// Get language code
		const targetLangCode = getLangCode(targetLanguage);

		// Find the selected voice by URI, or fallback to best voice logic
		let voiceToUse = voices.find((v) => v.voiceURI === selectedVoiceURI);
		if (!voiceToUse) {
			voiceToUse = getBestVoiceForLanguage(voices, targetLangCode);
			// Update state if we fell back
			if (voiceToUse) setSelectedVoiceURI(voiceToUse.voiceURI);
		}

		if (voiceToUse) {
			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			utterance.voice = voiceToUse;
			utterance.lang = voiceToUse.lang;
			utterance.pitch = speechPitch;
			utterance.rate = speechRate;
			utterance.volume = 1;

			// Add event handlers for better feedback
			utterance.onstart = () => {
				console.log("Speech started with voice:", voiceToUse.name);
				setIsSpeaking(true);
			};
			utterance.onend = () => {
				console.log("Speech ended");
				setIsSpeaking(false);
			};
			utterance.onerror = (event) => {
				console.error("Speech error:", event);
				setIsSpeaking(false);
			};

			synth.speak(utterance);

			// On iOS Safari, we sometimes need to force speech to start
			// This is a known workaround
			if (synth.paused) {
				synth.resume();
			}
		} else {
			console.warn(
				`No suitable voice found for ${targetLanguage} (code: ${targetLangCode})`
			);
		}
	};

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

	// Effect to manage the selected voice based on language and available voices
	useEffect(() => {
		if (!ttsReady || voices.length === 0) return; // Don't run until voices are ready

		const targetLangCode = getLangCode(targetLanguage);
		const currentLangVoices = voices.filter((voice) =>
			voice.lang.startsWith(targetLangCode.split("-")[0])
		);

		// Check if the currently selected voice is valid for the current language
		const isCurrentVoiceValid =
			selectedVoiceURI &&
			currentLangVoices.some((v) => v.voiceURI === selectedVoiceURI);

		// If the current voice is not valid (or none is selected), find the best default for the current language
		if (!isCurrentVoiceValid) {
			console.log(
				`Selected voice ${selectedVoiceURI} not valid for ${targetLanguage}, finding default...`
			);
			const bestVoice = getBestVoiceForLanguage(voices, targetLangCode);
			if (bestVoice) {
				console.log(
					"Setting default voice:",
					bestVoice.name,
					bestVoice.voiceURI
				);
				setSelectedVoiceURI(bestVoice.voiceURI);
			} else {
				console.log("No suitable default voice found for", targetLanguage);
				setSelectedVoiceURI(null);
			}
		} else {
			// console.log(`Keeping selected voice ${selectedVoiceURI} for ${targetLanguage}`);
		}
	}, [targetLanguage, voices, ttsReady]); // Rerun when language, voices, or readiness changes

	// --- Reset progress on new story / example change ---
	useEffect(() => {
		setActiveSentenceIndex(0);
		setRevealedSourceIndices(new Set());
		setIsFinished(false);
		setShowAllSource(false);
		if (synth?.speaking) synth.cancel();
	}, [sentencePairs, synth]); // Keep dependencies

	// --- TTS Controls ---
	const handleToggleAutoPlay = () => {
		setAutoPlayEnabled(!autoPlayEnabled);
	};

	const handleRateChange = (e) => {
		setSpeechRate(parseFloat(e.target.value));
	};

	const handlePitchChange = (e) => {
		setSpeechPitch(parseFloat(e.target.value));
	};

	const handleVoiceChange = (e) => {
		setSelectedVoiceURI(e.target.value);
	};

	const toggleTtsControls = () => {
		setShowTtsControls(!showTtsControls);
	};

	// Filter voices for the current target language
	const targetLangCode = getLangCode(targetLanguage);
	const availableTargetVoices = useMemo(() => {
		return voices.filter((voice) =>
			voice.lang.startsWith(targetLangCode.split("-")[0])
		);
	}, [voices, targetLangCode]);

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
					console.log("Challenge progress READ_STORY response:", result);
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

				{/* TTS Controls Toggle - Moved here */}
				{ttsReady && (
					<div
						className={`tts-controls-container ${
							showTtsControls ? "open" : ""
						}`}
					>
						<button
							onClick={toggleTtsControls}
							className="button button-icon tts-toggle-button-subtle"
							title="Speech Settings"
						>
							⚙️
						</button>
						{/* Panel now positioned relative to this container */}
						{showTtsControls && (
							<div className="tts-settings-panel">
								<div className="tts-setting">
									<label>
										<input
											type="checkbox"
											checked={autoPlayEnabled}
											onChange={handleToggleAutoPlay}
										/>
										Auto-play sentences
									</label>
								</div>

								<div className="tts-setting">
									<label>Speech Rate: {speechRate.toFixed(1)}</label>
									<input
										type="range"
										min="0.5"
										max="1.5"
										step="0.1"
										value={speechRate}
										onChange={handleRateChange}
									/>
								</div>

								<div className="tts-setting">
									<label>Pitch: {speechPitch.toFixed(1)}</label>
									<input
										type="range"
										min="0.5"
										max="1.5"
										step="0.1"
										value={speechPitch}
										onChange={handlePitchChange}
									/>
								</div>

								{/* Voice Selection Dropdown */}
								{availableTargetVoices.length > 0 && (
									<div className="tts-setting">
										<label htmlFor="voice-select">Voice:</label>
										<select
											id="voice-select"
											value={selectedVoiceURI || ""}
											onChange={handleVoiceChange}
											className="tts-voice-select"
										>
											{availableTargetVoices.map((voice) => (
												<option key={voice.voiceURI} value={voice.voiceURI}>
													{voice.name} ({voice.lang})
												</option>
											))}
										</select>
									</div>
								)}
							</div>
						)}
					</div>
				)}

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
