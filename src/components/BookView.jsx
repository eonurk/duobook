import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Tooltip from './Tooltip'; // Import the Tooltip component
import VocabularyList from './VocabularyList'; // Import VocabularyList
import { useAuth } from '@/context/AuthContext'; // Import useAuth
// import { doc, updateDoc, increment, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore'; // Remove db import
// import { collection, addDoc } from 'firebase/firestore'; // Keep if still needed for something else?
// import { checkAchievements } from './Gamification/Achievements'; // Import achievements checker
// import { checkChallengeCompletion, updateChallengeProgress } from './Gamification/DailyChallenges'; // Import challenge functions

// Import API function for challenge progress
import { postChallengeProgress } from '@/lib/api';

// Helper function to normalize words (lowercase, remove punctuation)
const normalizeWord = (word) => {
  return word.toLowerCase().replace(/[.,!?;:()"']/g, '');
};

// --- TTS Helper ---
// Basic mapping, might need more comprehensive language code mapping (e.g., 'Spanish' -> 'es-ES', 'es-MX', etc.)
const langNameToCode = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'dutch': 'nl',
    'russian': 'ru',
    'chinese (simplified)': 'zh-CN',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'hindi': 'hi',
    'turkish': 'tr',
    'swedish': 'sv',
    'norwegian': 'no',
    'danish': 'da',
    'polish': 'pl',
};

const getLangCode = (langName) => {
    return langNameToCode[langName?.toLowerCase() || ''] || null;
}

function BookView({ sentencePairs, vocabulary, targetLanguage, sourceLanguage, onGoBack, isExample = false }) {
  const { currentUser } = useAuth(); // Removed userProgress, fetchUserProgress if not needed directly
  
  // State for current sentence focus
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  // State to track revealed source sentences (using a Set for efficient lookup)
  const [revealedSourceIndices, setRevealedSourceIndices] = useState(new Set());
  const [isFinished, setIsFinished] = useState(false); // State for completion
  // Default showAllSource state to true
  const [showAllSource, setShowAllSource] = useState(true); // State for toggling source visibility

  // --- TTS State ---
  const [voices, setVoices] = useState([]);
  const [ttsReady, setTtsReady] = useState(false);
  const synth = window.speechSynthesis; // Get synthesis object

  // --- Load Voices ---
  const populateVoiceList = useCallback(() => {
    if (!synth) return;
    const availableVoices = synth.getVoices();
    setVoices(availableVoices);
    if (availableVoices.length > 0) {
        setTtsReady(true);
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
    }
  }, [populateVoiceList, synth]);

  // Reset progress when sentencePairs change (e.g., new book generated)
  useEffect(() => {
     setActiveSentenceIndex(0);
     setRevealedSourceIndices(new Set());
     setIsFinished(false);
     setShowAllSource(true); // Reset toggle too
     if (synth?.speaking) synth.cancel(); // Stop speech if generating new story
  }, [sentencePairs, synth]); // Add synth here

  // Tooltip State (remains the same)
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // --- Word Hover Logic --- 
  const vocabularyMap = useMemo(() => {
    const map = new Map();
    if (vocabulary) { // Check if vocabulary exists
      vocabulary.forEach(item => {
        map.set(item.word.toLowerCase(), item.translation);
      });
    }
    return map;
  }, [vocabulary]);

  // New state for tracking word interactions and gamification
  const [wordsLearned, setWordsLearned] = useState(new Set());

  // --- Remove Firestore-based progress tracking --- 
  // const trackReadingProgress = async (sentenceIndex) => {
      // ... removed Firestore logic ...
      // Check for completion and potentially call API
      // if (sentenceIndex === sentencePairs.length - 1 && !isExample && currentUser) {
      //     try {
      //         console.log("Attempting to post READ_STORY challenge progress...");
      //         const result = await postChallengeProgress({ challengeType: "READ_STORY" });
      //         console.log("Challenge progress response:", result);
      //         // Optionally show a notification based on result.completedChallenges
      //     } catch (error) {
      //         console.error("Error posting challenge progress:", error);
      //     }
      // }
  // };

  // Enhanced word hover function to track vocabulary interactions
  const handleWordHover = async (event, word) => {
    const normalized = normalizeWord(word);
    const translation = vocabularyMap.get(normalized);

    if (translation) {
      const rect = event.target.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY
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
            const result = await postChallengeProgress({ challengeType: "LEARN_WORDS", incrementAmount: 1 });
            console.log("Challenge progress LEARN_WORDS response:", result);
            // Optionally show notification if result.completedChallenges has items
            if (result?.completedChallenges?.length > 0) {
                 alert(`Challenge Completed: ${result.completedChallenges[0].title}! +${result.completedChallenges[0].xpReward} Points`);
             }
        } catch (error) {
            console.error("Error posting LEARN_WORDS challenge progress:", error);
        }
      }
    }
  };

  const handleWordLeave = () => {
    setTooltipVisible(false);
    setTooltipContent('');
  };

  // Helper to wrap words in hoverable spans
  const wrapWordsInSpans = (text, sentenceIndex) => {
    // Only allow hover if the sentence is active AND the story isn't finished
    const isHoverableSentence = sentenceIndex === activeSentenceIndex && !isFinished;
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.trim().length === 0) {
        return <React.Fragment key={`space-${sentenceIndex}-${i}`}>{word}</React.Fragment>;
      }
      const normalized = normalizeWord(word);
      const hasTranslation = vocabularyMap.has(normalized);
      const canHover = isHoverableSentence && hasTranslation;

      return (
        <span
          key={`word-${sentenceIndex}-${i}`}
          className={`word ${canHover ? 'word-hoverable' : ''}`}
          onMouseEnter={canHover ? (e) => handleWordHover(e, word) : null}
          onMouseLeave={canHover ? handleWordLeave : null}
        >
          {word}
        </span>
      );
    });
  };

  // Calculate Progress
  const progressPercent = sentencePairs.length > 0 
    ? ((activeSentenceIndex + (isFinished ? 1 : 0)) / sentencePairs.length) * 100 
    : 0;

  // --- Toggle Source Logic ---
  const handleToggleSource = () => {
    setShowAllSource(prev => !prev);
  };

  // --- Speak Function ---
  const handleSpeak = (textToSpeak) => {
    if (!synth || !ttsReady || !textToSpeak) return;
    if (synth.speaking) synth.cancel(); // Cancel previous before starting new

    const targetLangCode = getLangCode(targetLanguage);
    if (!targetLangCode) {
        console.warn(`No language code found for ${targetLanguage}`);
        return;
    }
    let voiceToUse = voices.find(voice => voice.lang.startsWith(targetLangCode));
    if (!voiceToUse) voiceToUse = voices.find(voice => voice.lang.split('-')[0] === targetLangCode);
    if (!voiceToUse) voiceToUse = voices.find(voice => voice.default);

    if (voiceToUse) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
      utterance.pitch = 1;
      utterance.rate = 0.9;
      utterance.volume = 1;
      synth.speak(utterance);
    } else {
        console.warn(`No suitable voice found for ${targetLanguage} (code: ${targetLangCode})`);
    }
  };

  // --- Reset progress on new story / example change ---
  useEffect(() => {
     setActiveSentenceIndex(0);
     setRevealedSourceIndices(new Set());
     setIsFinished(false);
     setShowAllSource(true);
     if (synth?.speaking) synth.cancel();
  }, [sentencePairs, synth]); // Keep dependencies

  // --- Interaction Logic (Reveal AFTER Advance) ---
  const handleSentenceClick = (index) => {
    // Removed the isExample check here to allow advancing in examples

    // Original logic for non-examples (now applies to examples too)
    if (index === activeSentenceIndex && !isFinished) {
      handleNextSentence();
    } else if (index < activeSentenceIndex) {
      setActiveSentenceIndex(index);
      setIsFinished(false);
      if (synth?.speaking) synth.cancel();
    }
  };

  const handlePrevSentence = () => {
    if (activeSentenceIndex > 0) {
      // Reveal the source for the sentence we are LEAVING
      if (!revealedSourceIndices.has(activeSentenceIndex)) {
         setRevealedSourceIndices(prev => new Set(prev).add(activeSentenceIndex));
      }
      // Then move back
      setActiveSentenceIndex(prev => prev - 1);
      setIsFinished(false);
      if (synth?.speaking) synth.cancel();
    }
  };

  const handleNextSentence = async () => { // Make async
    // Reveal the current source sentence if not already revealed
    if (!revealedSourceIndices.has(activeSentenceIndex)) {
        const newRevealedIndices = new Set(revealedSourceIndices);
        newRevealedIndices.add(activeSentenceIndex);
        setRevealedSourceIndices(newRevealedIndices);
    }

    const isFinishing = activeSentenceIndex === sentencePairs.length - 1;

    if (!isFinishing) {
      // Move to next sentence
      setActiveSentenceIndex(prevIndex => prevIndex + 1);
    } else {
      // At the end, mark as finished
      setIsFinished(true);
      
      // If finishing a non-example story, post progress for READ_STORY challenge
      if (!isExample && currentUser) {
         try {
             console.log("Attempting to post READ_STORY challenge progress...");
             const result = await postChallengeProgress({ challengeType: "READ_STORY" });
             console.log("Challenge progress READ_STORY response:", result);
             // Optionally show notification
              if (result?.completedChallenges?.length > 0) {
                 alert(`Challenge Completed: ${result.completedChallenges[0].title}! +${result.completedChallenges[0].xpReward} Points`);
             }
         } catch (error) {
             console.error("Error posting READ_STORY challenge progress:", error);
         }
      }
    }
  };

  // --- Restart Logic ---
  const handleRestart = () => {
    setActiveSentenceIndex(0);
    setRevealedSourceIndices(new Set());
    setIsFinished(false);
    setShowAllSource(true);
    if (synth?.speaking) synth.cancel();
    document.querySelector('.book-view')?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Rendering ---
  return (
    <div className={`${isExample ? 'example-book-container' : ''} ${isFinished ? 'story-finished-container' : ''}`}>
      {/* Progress Bar - Show always */} 
      <div className="progress-container">
         <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
         <span className="progress-text">{Math.round(progressPercent)}% Complete</span>
      </div>

      {/* Book View itself */} 
      <div className={`book-view ${isExample ? 'book-view-example' : ''} ${isFinished ? 'book-view-finished' : ''}`}>
        {/* Target Language Page */} 
        <div className="page page-target">
          <h3>{targetLanguage || 'Target Language'}</h3>
          <div className="story-content">
            {sentencePairs.map((pair, index) => {
              // Determine sentence state based on active index
              let sentenceClass = '';
              if (index < activeSentenceIndex) {
                sentenceClass = 'sentence-past'; // Previously read
              } else if (index === activeSentenceIndex) {
                sentenceClass = 'sentence-active'; // Current focus
              } else {
                sentenceClass = 'sentence-future'; // Not yet revealed
              }
              // Apply finished style always when finished
              if (isFinished) sentenceClass = 'sentence-past sentence-finished'; 
              
              // Can speak if TTS ready and sentence is active (examples or not)
              const canSpeak = ttsReady && index === activeSentenceIndex;
              
              return (
                <span
                  key={`target-${pair.id}`}
                  className={`sentence target-sentence ${sentenceClass}`}
                  onClick={() => handleSentenceClick(index)} 
                  // Allow clicking active or past sentences (for example reveal too)
                  style={{ cursor: 'pointer' }} 
                >
                  {canSpeak && (
                     <button
                        className="speak-button"
                        onClick={(e) => { e.stopPropagation(); handleSpeak(pair.target); }}
                        title={`Speak sentence in ${targetLanguage}`}
                        aria-label={`Speak sentence in ${targetLanguage}`}
                     >
                        🔊
                     </button>
                  )}
                  {wrapWordsInSpans(pair.target, index)}
                  {' '}
                </span>
              );
            })}
          </div>
        </div>

        {/* Source Language Page */} 
        <div className="page page-source">
          <h3>{sourceLanguage || 'Your Language'}</h3>
           <div className="story-content">
              {sentencePairs.map((pair, index) => {
                  const isRevealed = revealedSourceIndices.has(index);
                  // In example mode, show source if revealed; otherwise same logic
                  const isVisible = isRevealed && (isExample || showAllSource || index === activeSentenceIndex); 
                  const visibilityClass = isVisible ? 'source-visible' : 'source-hidden-by-toggle';
                  const finishedClass = (isFinished && !isExample) ? 'sentence-finished' : '';

                  return (
                    <span
                      key={`source-${pair.id}`}
                      className={`sentence source-sentence ${isRevealed ? 'sentence-revealed' : 'sentence-not-revealed'} ${visibilityClass} ${index === activeSentenceIndex ? 'sentence-active-source' : ''} ${finishedClass}`}
                    >
                      {isRevealed ? pair.source : ''}
                      {' '}
                    </span>
                  );
                })}
           </div>
        </div>
      </div>

      <Tooltip
        content={tooltipContent}
        position={tooltipPosition}
        visible={tooltipVisible}
      />

      {/* Navigation Buttons - Show always */} 
      <div className="navigation-controls button-container">
        <button 
          onClick={handlePrevSentence} 
          className="button button-tertiary nav-button" 
          disabled={activeSentenceIndex === 0}
        >
          &larr; Prev
        </button>
        <span className="button-gap"></span>
        <button 
          onClick={() => handleNextSentence()} 
          className="button button-primary nav-button" 
          disabled={isFinished}
        >
          {activeSentenceIndex === sentencePairs.length - 1 ? 'Finish' : 'Next'} &rarr;
        </button>
      </div>

      {/* Render Vocabulary List (Show for examples too) */} 
      <VocabularyList vocabulary={vocabulary} />

      {/* Congratulatory Message - Show always when finished */} 
      {isFinished && (
        <div className="congrats-message">
          🎉 Well done! You finished the story! 🎉
        </div>
      )}

      {/* Action Buttons - Show always */} 
      <div className="action-buttons button-container button-container-multiple">
        {(activeSentenceIndex > 0 || revealedSourceIndices.size > 0 || isFinished) && (
            <button onClick={handleRestart} className="button button-tertiary">
                Restart Story
            </button>
        )}
        {(revealedSourceIndices.size > 0 || isFinished) && (
          <button onClick={handleToggleSource} className="button button-tertiary">
              {showAllSource ? 'Hide' : 'Show'} All Translations
          </button>
        )}
        <button onClick={onGoBack} className="button button-secondary">
            {isExample ? 'Go Back' : 'Create Another Book'} 
        </button>
      </div>
    </div>
  );
}

export default BookView; 