import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import '@/App.css'; // Use alias
import InputForm from '@/components/InputForm'; // Use alias
import BookView from '@/components/BookView'; // Use alias
import { useAuth } from '@/context/AuthContext'; // Use alias
import Login from '@/components/Auth/Login'; // Use alias
import Signup from '@/components/Auth/Signup'; // Use alias
import Navbar from '@/components/Layout/Navbar'; // Use alias - Import Navbar
import SiteFooter from '@/components/Layout/SiteFooter'; // Use alias - Import Footer
import UserProfilePage from '@/components/User/UserProfilePage'; // Use alias
import MyStoriesPage from '@/components/User/MyStoriesPage'; // Use alias
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Add Card imports

// Initialize OpenAI Client
// IMPORTANT: This key is exposed in the frontend bundle.
// For production, use a backend proxy.
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
let openai;
if (apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Necessary for frontend usage
  });
} else {
  console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
}

// Static Example Story Data
const exampleStoryData = {
  sentencePairs: [
    { id: 1, target: "El perro corre.", source: "The dog runs." },
    { id: 2, target: "El gato duerme.", source: "The cat sleeps." },
    { id: 3, target: "El pájaro canta.", source: "The bird sings." },
  ],
  vocabulary: [
    { word: "perro", translation: "dog" },
    { word: "corre", translation: "runs" },
    { word: "gato", translation: "cat" },
    { word: "duerme", translation: "sleeps" },
    { word: "pájaro", translation: "bird" },
    { word: "canta", translation: "sings" },
  ],
  targetLanguage: 'Spanish', // Example target language
  sourceLanguage: 'English' // Example source language
};

// --- Local Storage Key ---
const LOCAL_STORAGE_KEY_PREFIX = 'savedStories';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
}

// Component for the logged-in main view (story generation)
function MainAppView({ story, isLoading, error, currentParams, generateStory, handleGoBack }) {
  return (
    <>
      {error && (
        <div className="error-message p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Render InputForm or BookView based on story/loading state */} 
        {!story && !isLoading && (
          <InputForm onSubmit={generateStory} isLoading={isLoading} />
        )}

        {/* Always show Example when no story is loaded/loading */} 
        {!story && !isLoading && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-semibold mb-4 text-center">How it Works: Example Book</h2>
            <p className="text-muted-foreground text-center mb-6">This is what your generated bilingual book will look like. Hover over words (in the active sentence) for translations and click sentences to reveal the source text.</p>
            <BookView 
              sentencePairs={exampleStoryData.sentencePairs} 
              vocabulary={exampleStoryData.vocabulary}
              targetLanguage={exampleStoryData.targetLanguage}
              sourceLanguage={exampleStoryData.sourceLanguage}
              isExample={true}
              onGoBack={() => {}}
            />
          </div>
        )}

        {isLoading && (
          <div className="loading-indicator flex items-center justify-center flex-col text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
            Generating your {currentParams.length} {currentParams.difficulty} story in {currentParams.target} / {currentParams.source}... Please wait.
          </div>
        )}

        {story && !isLoading && (
          <BookView
            sentencePairs={story.sentencePairs}
            vocabulary={story.vocabulary}
            targetLanguage={currentParams.target}
            sourceLanguage={currentParams.source}
            onGoBack={handleGoBack}
            isExample={false}
          />
        )}
      </main>
    </>
  );
}

function App() {
  const { currentUser, loading } = useAuth();
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentParams, setCurrentParams] = useState({
    description: '', // Add description to params
    source: 'English',
    target: 'Spanish',
    difficulty: 'Beginner',
    length: 'Short'
  });

  // Update document title when params change
  useEffect(() => {
    if (story) {
      document.title = `Book: ${currentParams.target} / ${currentParams.source} (${currentParams.difficulty})`;
    } else {
      document.title = 'Language Book Creator';
    }
  }, [story, currentParams]);

  // --- Load story from navigation state --- 
  const location = useLocation();
  useEffect(() => {
    if (location.state?.selectedStory) {
      const { storyData, params } = location.state.selectedStory;
      console.log("Loading story from navigation state:", params);
      setStory(storyData);
      setCurrentParams(params); 
      // Clear the state to prevent reloading on refresh/back navigation
      window.history.replaceState({}, ''); 
    }
  }, [location.state]);
  // ------------------------------------------

  const generateStory = async (description, sourceLang, targetLang, difficulty, storyLength) => {
    if (!openai) {
      setError('OpenAI client is not initialized. Check API key.');
      return;
    }
    console.log(`Requesting story: ${description} (${sourceLang} -> ${targetLang}, ${difficulty}, ${storyLength})`);
    setIsLoading(true);
    setError(null);
    setStory(null);
    // Include description in currentParams
    const params = { description, source: sourceLang, target: targetLang, difficulty, length: storyLength };
    setCurrentParams(params);

    try {
      // Determine target sentence count instruction based on selection
      let lengthInstruction = '';
      switch (storyLength.toLowerCase()) {
          case 'short':
              lengthInstruction = 'around 15-20 sentences total'; // Target sentence count
              break;
          case 'medium':
              lengthInstruction = 'around 25-35 sentences total'; // Target sentence count
              break;
          case 'long':
              lengthInstruction = 'around 40-50 sentences total (or more)'; // Higher target sentence count
              break;
          default:
              lengthInstruction = 'around 25 sentences total'; // Fallback
      }

      // Updated prompt focusing on sentence count
      const prompt = `
        You are a helpful assistant creating bilingual learning materials.
        The user wants a story based on this description: "${description}"

        1. Generate a story with ${lengthInstruction}. Adhere closely to this length requirement.
        2. The story should be suitable for a ${difficulty.toLowerCase()} level learner of ${targetLang}.
        3. Break the story into logical sentences. Ensure each sentence has a corresponding translation.
        4. Provide both the ${targetLang} version (target language) and the ${sourceLang} version (source language) for each sentence.
        5. Identify 5-10 key vocabulary words from the ${targetLang} story relevant to the ${difficulty} level. Provide their ${sourceLang} translations.

        Respond ONLY with a valid JSON object adhering to the following structure. Do NOT include any text outside the JSON object:
        {
          "sentencePairs": [
            { "id": 1, "target": "[${targetLang} sentence 1]", "source": "[${sourceLang} sentence 1]" },
            // ... etc ...
          ],
          "vocabulary": [
            { "word": "[${targetLang} word 1]", "translation": "[${sourceLang} translation 1]" },
            // ... etc ...
          ]
        }
      `;

      console.log("Sending prompt to OpenAI:", prompt);

      const completion = await openai.chat.completions.create({
        // Suggesting a more capable model
        model: "gpt-4.1-mini", // CHANGED from gpt-4.1-nano (or use gpt-3.5-turbo if preferred/available)
        messages: [
            { role: "system", content: `You are an assistant that generates bilingual stories in JSON format for ${difficulty} level learners.` },
            { role: "user", content: prompt }
        ],
        // Slightly higher temperature
        temperature: 0.7, // CHANGED from 0.6
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      console.log("Raw OpenAI Response:", content);

      if (!content) {
        throw new Error('No content received from OpenAI.');
      }

      // Parse the JSON response
      try {
        const parsedStory = JSON.parse(content);
        console.log("Attempting to parse:", content);

        // Basic validation
        if (!parsedStory || !Array.isArray(parsedStory.sentencePairs) || !Array.isArray(parsedStory.vocabulary)) {
          console.error("Invalid JSON structure:", parsedStory);
          throw new Error('Invalid JSON structure received from AI.');
        }
        if (parsedStory.sentencePairs.length === 0) {
          throw new Error('AI response contained no sentence pairs.');
        }

        // Ensure sentencePairs have required fields
        parsedStory.sentencePairs.forEach((pair, index) => {
          if (typeof pair.id !== 'number' || typeof pair.target !== 'string' || typeof pair.source !== 'string') {
            console.error(`Invalid structure in sentence pair at index ${index}:`, pair);
            throw new Error(`Invalid sentence pair structure at index ${index} in AI response.`);
          }
          // Assign sequential ID if missing or incorrect (optional safeguard)
          // pair.id = index + 1;
        });

        // Ensure vocabulary has required fields
        parsedStory.vocabulary.forEach((item, index) => {
          if (typeof item.word !== 'string' || typeof item.translation !== 'string') {
            console.error(`Invalid structure in vocabulary item at index ${index}:`, item);
            throw new Error(`Invalid vocabulary structure at index ${index} in AI response.`);
          }
        });

        console.log("Parsed Story Data:", parsedStory);

        // --- Save story to localStorage if user is logged in ---
        if (currentUser) {
          try {
            const userStoryKey = `${LOCAL_STORAGE_KEY_PREFIX}-${currentUser.uid}`;
            const existingStoriesRaw = localStorage.getItem(userStoryKey);
            const existingStories = existingStoriesRaw ? JSON.parse(existingStoriesRaw) : [];

            // Create a unique ID for the story (e.g., timestamp)
            const storyId = Date.now(); 
            const savedAtTimestamp = storyId; // Use the same timestamp

            // Add the new story with its parameters and timestamp
            existingStories.push({ 
              id: storyId, 
              savedAt: savedAtTimestamp, // Add timestamp
              params: params, // Save the parameters used to generate it
              storyData: parsedStory // Save the actual story content
            });

            localStorage.setItem(userStoryKey, JSON.stringify(existingStories));
            console.log("Story saved to localStorage for user:", currentUser.uid);
          } catch (storageError) {
            console.error("Error saving story to localStorage:", storageError);
            // Optional: Show a non-blocking message to the user?
          }
        }
        // --------------------------------------------------------

        setStory(parsedStory);

      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError, "\nRaw content was:\n", content);
        // Provide a more user-friendly error message
        setError(`The AI response wasn't structured correctly. This can sometimes happen. Please try generating the story again, perhaps slightly adjusting your description. (Details: ${jsonError.message})`);
        setStory(null); // Ensure story is null on error
      }

    } catch (err) {
      console.error("Error generating story:", err);
      setError(`Failed to generate story: ${err.message}. Check console and API key.`);
      setStory(null); // Ensure story is null on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setStory(null);
    // Optionally clear currentParams or reset to defaults if needed
    // setCurrentParams({ source: 'English', target: 'Spanish', difficulty: 'Beginner', length: 'Short' });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading user...</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={
            <MainAppView 
              story={story} 
              isLoading={isLoading} 
              error={error} 
              currentParams={currentParams} 
              generateStory={generateStory} 
              handleGoBack={handleGoBack} 
            />
          } />
          <Route 
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/my-stories" element={
            <ProtectedRoute>
              <MyStoriesPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
