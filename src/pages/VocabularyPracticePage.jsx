import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStories } from '@/lib/api';
import { Loader2, ArrowRight, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // For conditional classes
import confetti from 'canvas-confetti'; // Import confetti

// Quiz Constants
const QUIZ_LENGTH = 10; // Max words per quiz session
const POINTS_PER_CORRECT = 5;
const COMPLETION_BONUS_XP = 25;

// Helper function to shuffle an array
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function VocabularyPracticePage() {
  const { currentUser, userProgress, updateProgressData } = useAuth();
  const [vocabularyList, setVocabularyList] = useState([]); // Original fetched list
  const [shuffledList, setShuffledList] = useState([]);     // Shuffled list for the quiz
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Quiz State ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // The string of the selected option
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(''); // e.g., "Correct!", "Incorrect"
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [animateTrigger, setAnimateTrigger] = useState(0); // State to trigger feedback animation
  const [incorrectAnswers, setIncorrectAnswers] = useState([]); // Track incorrect answers
  const [showReview, setShowReview] = useState(false); // Toggle review display
  // ------------------

  // Calculate progress percentage (based on actual quiz length)
  const progressPercent = shuffledList.length > 0 
    ? ((currentQuestionIndex + (quizCompleted ? 1 : 0)) / shuffledList.length) * 100 
    : 0;

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      setQuizCompleted(false); // Reset quiz state on user change/reload
      setScore(0);
      setCurrentQuestionIndex(0);

      getStories()
        .then(storiesFromApi => {
          const allVocab = storiesFromApi.reduce((acc, story) => {
            try {
              const storyData = JSON.parse(story.story);
              if (storyData?.vocabulary) {
                // Simple approach: just add all words for now
                // Ensure vocabulary has both word and translation before adding
                const validVocab = storyData.vocabulary.filter(v => v && v.word && v.translation);
                acc.push(...validVocab);
              }
            } catch (e) {
              console.error(`Failed to parse story ${story.id}:`, e);
            }
            return acc;
          }, []);
          
          // Deduplicate vocabulary list, ensuring structure
          const uniqueVocabMap = new Map();
          allVocab.forEach(item => {
            if (item && item.word && item.translation && !uniqueVocabMap.has(item.word)) {
              uniqueVocabMap.set(item.word, item);
            }
          });
          const uniqueVocab = Array.from(uniqueVocabMap.values());
          
          setVocabularyList(uniqueVocab);
          
          if (uniqueVocab.length >= 4) { // Minimum needed for options
            let listForQuiz = shuffleArray([...uniqueVocab]);
            // Slice to QUIZ_LENGTH if enough words exist
            if (listForQuiz.length > QUIZ_LENGTH) {
              listForQuiz = listForQuiz.slice(0, QUIZ_LENGTH);
            }
            setShuffledList(listForQuiz);
            setupQuestion(0, listForQuiz);
          } else {
            setError("Not enough unique vocabulary words found across your stories to start a quiz (minimum 4 needed).");
            setShuffledList([]);
          }
        })
        .catch(err => {
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
    }
  }, [currentUser]);

  // Function to setup the options for a given question index
  const setupQuestion = (index, list) => {
    if (!list || index >= list.length) {
      setQuizCompleted(true);
      return;
    }

    const correctItem = list[index];
    const correctAnswer = correctItem.translation;

    const incorrectOptions = [];
    const potentialIncorrects = list.filter((item, i) => i !== index);
    shuffleArray(potentialIncorrects);

    for (let item of potentialIncorrects) {
        // Ensure the item and its translation are valid before using
        if (item && item.translation && item.translation !== correctAnswer && !incorrectOptions.includes(item.translation)) {
            incorrectOptions.push(item.translation);
            if (incorrectOptions.length >= 3) break;
        }
    }
    
    // Fallback if not enough unique incorrect options found (less likely with initial check)
     while (incorrectOptions.length < 3) {
       // Generate placeholder or repeat less ideal options carefully
       incorrectOptions.push(`Option ${incorrectOptions.length + 1}`); 
     }

    const options = shuffleArray([correctAnswer, ...incorrectOptions]);

    setCurrentQuestionIndex(index);
    setCurrentOptions(options);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setFeedback('');
    setAnimateTrigger(0); // Reset animation trigger
  };

  // --- Quiz Interaction Handlers ---
  const handleOptionClick = async (option) => {
    if (isAnswered) return; // Prevent multiple checks

    setSelectedAnswer(option); // Still useful for styling the selected wrong answer
    setIsAnswered(true); // Mark as answered immediately
    setAnimateTrigger(Date.now()); // Trigger animation

    const correctItem = shuffledList[currentQuestionIndex];
    const correctAnswer = correctItem.translation;
    let awardedPoints = 0;

    if (option === correctAnswer) {
      setFeedback("Correct! 🎉");
      setScore(prevScore => prevScore + 1);
      awardedPoints = POINTS_PER_CORRECT;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }, // Start slightly below center
        zIndex: 1000 // Ensure it's above other elements
      });
    } else {
      setFeedback(`Incorrect. You chose: ${option}. Correct: ${correctAnswer}`);
      // Add to incorrect list if not already there for this session
      setIncorrectAnswers(prev => {
         if (!prev.some(item => item.word === correctItem.word)) {
           return [...prev, correctItem];
         }
         return prev;
      });
    }

    // Update progress via context if points were awarded
    if (awardedPoints > 0 && userProgress && updateProgressData) {
      try {
        await updateProgressData({ points: userProgress.points + awardedPoints });
        console.log(`Awarded ${awardedPoints} points.`);
      } catch (error) {
        console.error("Failed to save points update:", error);
      }
    }
  };

  const handleNextQuestion = async () => { // Make async for completion bonus
    if (!isAnswered) return;
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < shuffledList.length) {
      setupQuestion(nextIndex, shuffledList);
    } else {
      setQuizCompleted(true);
      // Award completion bonus ONLY if score is high enough
      if (score >= 8 && userProgress && updateProgressData) {
         try {
            await updateProgressData({ points: userProgress.points + COMPLETION_BONUS_XP });
            console.log(`Awarded ${COMPLETION_BONUS_XP} completion bonus points for high score!`);
         } catch (error) {
            console.error("Failed to save completion bonus points update:", error);
         }
      }
    }
  };

 const handleRestartQuiz = () => {
    setQuizCompleted(false);
    setIncorrectAnswers([]); // Reset incorrect answers
    setShowReview(false); // Hide review section
    setScore(0);
    setCurrentQuestionIndex(0);
     // Ensure we have enough words before restarting
    if (vocabularyList.length >= 4) { 
        const listForQuiz = shuffleArray([...vocabularyList]); 
        setShuffledList(listForQuiz);
        setupQuestion(0, listForQuiz);
    } else {
        // Handle case where vocabulary might have become insufficient (unlikely but possible)
        setError("Cannot restart quiz: Not enough vocabulary words.");
        setShuffledList([]);
    }
  };
  // -------------------------------

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        Loading vocabulary...
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-10 px-4 text-center text-red-600">Error: {error}</div>;
  }

  if (!currentUser) {
     return <div className="container mx-auto py-10 px-4 text-center text-muted-foreground">Please log in to practice vocabulary.</div>;
  }

  if (shuffledList.length === 0 && !isLoading) {
    return <div className="container mx-auto py-10 px-4 text-center text-muted-foreground">No vocabulary found or not enough words to start a quiz (minimum 4 needed). Generate some stories first!</div>;
  }

  // --- Render Quiz UI ---
  const currentWordItem = shuffledList[currentQuestionIndex];

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Vocabulary Practice</h1>

      {/* Progress Bar - Styled similar to BookView with Tailwind */} 
      {!quizCompleted && shuffledList.length > 0 && (
         <div className="w-full bg-muted rounded-full h-2.5 mb-4 overflow-hidden"> {/* Outer container */} 
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div> {/* Inner fill */} 
         </div>
         /* Optional: Text below or overlaid if needed 
         <p className="text-center text-sm text-muted-foreground mb-4">{currentQuestionIndex + 1} / {shuffledList.length} Words ({Math.round(progressPercent)}%)</p>
         */
      )}

      {quizCompleted ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl mb-2">Your final score: {score} / {shuffledList.length}</p>
              {/* Conditionally show bonus message */}
              {score >= 8 ? (
                 <p className="text-lg mb-4 text-primary">+${COMPLETION_BONUS_XP} XP High Score Bonus!</p>
              ) : (
                 <p className="text-sm mb-4 text-muted-foreground">(Score 8+ required for bonus XP)</p>
              )}
              <div className="flex justify-center gap-4">
                {/* Use secondary variant for Restart */} 
                <Button onClick={handleRestartQuiz} variant="secondary">
                  <RotateCcw className="mr-2 h-4 w-4" /> Restart Quiz
                </Button>
                {incorrectAnswers.length > 0 && (
                  <Button onClick={() => setShowReview(prev => !prev)} variant="outline">
                    {showReview ? 'Hide' : 'Review Mistakes'} ({incorrectAnswers.length})
                  </Button>
                )}
               </div>

              {/* Review Section */} 
              {showReview && incorrectAnswers.length > 0 && (
                <div className="mt-6 pt-4 border-t text-left">
                   <h3 className="text-lg font-semibold mb-3 text-center">Words to Review:</h3>
                   <ul className="space-y-2 list-disc list-inside">
                     {incorrectAnswers.map((item, idx) => (
                       <li key={idx} className="text-sm">
                         <span className="font-medium">{item.word}:</span> {item.translation}
                       </li>
                     ))}
                   </ul>
                </div>
              )}
            </CardContent>
          </Card>
      ) : currentWordItem ? (
        <Card>
          <CardHeader>
            <CardTitle>Translate the word:</CardTitle>
             <p className="text-sm text-muted-foreground text-right">Word {currentQuestionIndex + 1} of {shuffledList.length} | Score: {score}</p>
          </CardHeader>
          <CardContent>
            {/* More prominent word display */}
            <p className="text-2xl font-semibold mb-6 text-center p-4 bg-primary/10 text-primary rounded">
              {currentWordItem.word} 
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {currentOptions.map((option, idx) => (
                <Button 
                  key={idx}
                  variant="outline"
                  className={cn(
                    "w-full justify-center h-auto py-3 px-4 text-base whitespace-normal text-left transition-all duration-300 ease-in-out transform", 
                    // Correct Answer Styling (Keep Green)
                    isAnswered && option === currentWordItem?.translation && 
                      "bg-green-100 border-green-500 text-green-700 hover:bg-green-100 scale-105 animate-pulse-once", 
                    // Selected Incorrect Answer Styling (User's Red Style)
                    isAnswered && selectedAnswer === option && option !== currentWordItem?.translation && 
                      "bg-red-100 border-red-500 text-red-700 hover:bg-red-100 scale-105 animate-pulse-once", // User's red style from history
                    // Muted style for other non-selected, incorrect options
                    isAnswered && option !== currentWordItem?.translation && option !== selectedAnswer && 
                      "opacity-60 border-muted",
                    !isAnswered && "hover:bg-accent hover:scale-105" // Hover effect before answer
                  )}
                  onClick={() => handleOptionClick(option)} 
                  disabled={isAnswered} 
                >
                  {option}
                </Button>
              ))}
            </div>

            {/* Check Answer / Next Button Logic */} 
            <div className="mt-6 text-center">
              <p 
                key={animateTrigger} 
                className={cn(
                  "h-auto min-h-[1.5rem] mb-2 font-semibold animate-fade-in", // Allow wrapping, ensure min height
                  isAnswered && feedback.startsWith("Correct") && "text-green-600",
                  isAnswered && feedback.startsWith("Incorrect") && "text-destructive"
              )}
                aria-live="polite" // Accessibility: Announce feedback changes
              >
                {feedback}
              </p>
              {/* Next/Finish button with icon */} 
              {isAnswered && (
                <Button onClick={handleNextQuestion} variant="secondary" className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-200 text-primary-foreground hover:bg-primary/90 font-medium text-sm py-6"
                >
                  {currentQuestionIndex === shuffledList.length - 1 
                    ? <><CheckCircle className="mr-2 h-4 w-4" /> Finish Quiz</>
                    : <>Next Word<ArrowRight className="h-4 w-4" /></>}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      ) : (
         <p className="text-center text-muted-foreground">Preparing quiz...</p> // Should be brief
      )}

    </div>
  );
}

export default VocabularyPracticePage; 