import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { ChevronDown, ChevronRight, Volume2 } from "lucide-react";
import "./VocabularyList.css";

// TTS Helper functions (matching BookView implementation)
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
	croatian: "hr-HR",
	hebrew: "he-IL",
	mongolian: "mn",
};

const getLangCode = (langName) => {
	return langNameToCode[langName?.toLowerCase() || ""] || "en-US";
};

const preferredVoices = {
	"en-US": ["Google US English", "Microsoft Zira", "Samantha"],
	"es-ES": ["Google español", "Microsoft Helena", "Monica", "Juan"],
	"fr-FR": ["Google français", "Microsoft Julie", "Thomas", "Amelie"],
	"de-DE": ["Google Deutsch", "Microsoft Hedda", "Anna"],
	"it-IT": ["Google italiano", "Microsoft Elsa", "Alice"],
	"pt-PT": ["Google português", "Microsoft Fernanda", "Raquel"],
	"nl-NL": ["Google Nederlands", "Microsoft Fenna", "Lotte"],
	"ru-RU": ["Google русский", "Microsoft Svetlana"],
	"zh-CN": ["Google 普通话（中国大陆）", "Microsoft Xiaoxiao", "Tingting"],
	"ja-JP": ["Google 日本語", "Microsoft Nanami", "Kyoko"],
	"ko-KR": ["Google 한국의", "Microsoft SunHi"],
	ar: ["Google عربي", "Microsoft Salma"],
	"hi-IN": ["Google हिन्दी", "Microsoft Swara"],
	"tr-TR": ["Google Türk", "Microsoft Emel"],
	"sv-SE": ["Google svenska", "Microsoft Sofie"],
	"no-NO": ["Google norsk", "Microsoft Pernille"],
	"da-DK": ["Google dansk", "Microsoft Christel"],
	"pl-PL": ["Google polski", "Microsoft Zofia"],
};

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

function VocabularyList({
	vocabulary,
	isExpanded,
	setIsExpanded,
	targetLanguage = "english",
	sourceLanguage = "english", // eslint-disable-line no-unused-vars
	// Shared TTS state from BookView
	voices = [],
	ttsReady = false,
	selectedVoiceURI = null,
	speechRate = 0.9,
	speechPitch = 1.0,
}) {
	const [speakingItemIndex, setSpeakingItemIndex] = useState(null);
	const synth = window.speechSynthesis;

	// TTS speak function using shared state from BookView
	const handleSpeak = useCallback(
		(textToSpeak, language, itemIndex) => {
			if (!synth || !ttsReady || !textToSpeak) return;

			if (synth.speaking) synth.cancel();

			const langCode = getLangCode(language);
			const utterance = new SpeechSynthesisUtterance(textToSpeak);

			// Use the selected voice from BookView if available
			const voiceToUse = selectedVoiceURI
				? voices.find((v) => v.voiceURI === selectedVoiceURI)
				: null;

			if (voiceToUse) {
				utterance.voice = voiceToUse;
			} else {
				// Fallback to best voice for language
				const fallbackVoice = getBestVoiceForLanguage(voices, langCode);
				if (fallbackVoice) {
					utterance.voice = fallbackVoice;
				}
			}

			utterance.rate = speechRate;
			utterance.pitch = speechPitch;
			utterance.onstart = () => setSpeakingItemIndex(itemIndex);
			utterance.onend = () => setSpeakingItemIndex(null);
			utterance.onerror = () => setSpeakingItemIndex(null);

			synth.speak(utterance);
		},
		[synth, ttsReady, voices, selectedVoiceURI, speechRate, speechPitch]
	);

	if (!vocabulary || vocabulary.length === 0) {
		return null;
	}

	return (
		<div className="vocabulary-section-subtle">
			<button
				className="vocabulary-header-button"
				onClick={() => setIsExpanded(!isExpanded)}
				aria-expanded={isExpanded}
			>
				<div className="vocabulary-header-content">
					<span className="vocabulary-title-subtle">
						Key Vocabulary ({vocabulary.length})
					</span>
					<div className="vocabulary-toggle-icon">
						{isExpanded ? (
							<ChevronDown size={16} />
						) : (
							<ChevronRight size={16} />
						)}
					</div>
				</div>
			</button>

			{isExpanded && (
				<div className="vocabulary-list-container">
					<ul className="vocabulary-list-subtle">
						{vocabulary.map((item, index) => (
							<li key={index} className="vocabulary-item-subtle">
								<div className="vocab-content">
									<span className="vocab-word-subtle">{item.translation}</span>
									<span className="vocab-separator">→</span>
									<span className="vocab-translation-subtle">{item.word}</span>
								</div>
								<div className="vocab-actions">
									{ttsReady && (
										<button
											className={`vocab-speak-button ${
												speakingItemIndex === index ? "speaking" : ""
											}`}
											onClick={(e) => {
												e.stopPropagation();
												handleSpeak(item.translation, targetLanguage, index);
											}}
											title={`Speak "${item.translation}" in ${targetLanguage}`}
											aria-label={`Speak "${item.translation}" in ${targetLanguage}`}
										>
											<Volume2 size={14} />
										</button>
									)}
								</div>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

VocabularyList.propTypes = {
	vocabulary: PropTypes.array,
	isExpanded: PropTypes.bool.isRequired,
	setIsExpanded: PropTypes.func.isRequired,
	targetLanguage: PropTypes.string,
	sourceLanguage: PropTypes.string,
	voices: PropTypes.array,
	ttsReady: PropTypes.bool,
	selectedVoiceURI: PropTypes.string,
	speechRate: PropTypes.number,
	speechPitch: PropTypes.number,
};

export default VocabularyList;
