import React, { useState } from 'react';
import OpenAI from 'openai';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import '@/App.css'; // Use alias
import InputForm from '@/components/InputForm'; // Use alias
import BookView from '@/components/BookView'; // Use alias
import { useAuth } from '@/context/AuthContext'; // Use alias
import Navbar from '@/components/Layout/Navbar'; // Use alias - Import Navbar
import SiteFooter from '@/components/Layout/SiteFooter'; // Use alias - Import Footer
import UserProfilePage from '@/components/User/UserProfilePage'; // Use alias
import MyStoriesPage from '@/components/User/MyStoriesPage'; // Use alias

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
  return currentUser ? children : <Navigate to="/" replace />;
}

// --- New Component for Story View ---
function StoryViewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const storyData = location.state?.storyData; // Get story data from navigation state
  const params = location.state?.params;       // Get params from navigation state

  // Handle case where user lands directly on this route without state
  if (!storyData || !params) {
    console.warn("Navigated to StoryViewPage without story data. Redirecting home.");
    // Redirect back to the main form page if no story data is present
    return <Navigate to="/" replace />; 
  }

  const handleGoBackToForm = () => {
    navigate('/'); // Navigate back to the InputForm page
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <BookView
        sentencePairs={storyData.sentencePairs}
        vocabulary={storyData.vocabulary}
        targetLanguage={params.target}
        sourceLanguage={params.source}
        onGoBack={handleGoBackToForm} // Use the new handler
        isExample={false}
      />
    </main>
  );
}
// ----------------------------------

// Component for the logged-in main view (story generation)
function MainAppView({ generateStory }) { 
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formParams, setFormParams] = useState(null);

  const handleGenerate = async (...args) => {
    setIsGenerating(true);
    setFormError(null);
    setFormParams({ 
        description: args[0], 
        source: args[1], 
        target: args[2], 
        difficulty: args[3], 
        length: args[4]
    });
    try {
      await generateStory(...args); 
    } catch (error) {
      setFormError(error.message || "Failed to generate story.");
      setIsGenerating(false); 
    }
  };

  return (
    <>
      {formError && (
        <div className="error-message p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <strong>Error:</strong> {formError}
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-8">
        {!isGenerating && (
          <InputForm onSubmit={handleGenerate} isLoading={isGenerating} />
        )}

        {isGenerating && (
          <div className="loading-indicator flex items-center justify-center flex-col text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
            Generating your {formParams?.length} {formParams?.difficulty} story in {formParams?.target} / {formParams?.source}... Please wait.
          </div>
        )}

        {!isGenerating && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-semibold mb-4 text-center">How it Works: Example Book</h2>
            <p className="text-muted-foreground text-center mb-6">This is what your generated bilingual book will look like. Hover over words (in the active sentence) for translations and click sentences to reveal the source text.</p>
            <BookView 
              sentencePairs={exampleStoryData.sentencePairs} 
              vocabulary={exampleStoryData.vocabulary}
              targetLanguage={exampleStoryData.targetLanguage}
              sourceLanguage={exampleStoryData.sourceLanguage}
              isExample={true}
              onGoBack={() => {}} // No go back needed for example
            />
          </div>
        )}

      </main>
    </>
  );
}

function App() {
  const { currentUser, loading } = useAuth();
  console.log("Current User in App:", currentUser);
  const navigate = useNavigate();

  const generateStory = async (description, sourceLang, targetLang, difficulty, storyLength) => {
    if (!openai) {
      throw new Error('OpenAI client is not initialized. Check API key.');
    }
    console.log(`Requesting story: ${description} (${sourceLang} -> ${targetLang}, ${difficulty}, ${storyLength})`);
    const params = { description, source: sourceLang, target: targetLang, difficulty, length: storyLength };

    try {
       let lengthInstruction = '';
      switch (storyLength.toLowerCase()) {
          case 'short': lengthInstruction = 'around 15-20 sentences total'; break;
          case 'medium': lengthInstruction = 'around 25-35 sentences total'; break;
          case 'long': lengthInstruction = 'around 40-50 sentences total (or more)'; break;
          default: lengthInstruction = 'around 25 sentences total';
      }
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
        model: "gpt-4.1-mini",
        messages: [
            { role: "system", content: `You are an assistant that generates bilingual stories in JSON format for ${difficulty} level learners.` },
            { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI.');
      }
      
      let parsedStory;
      try {
        parsedStory = JSON.parse(content);
        console.log("Attempting to parse:", content);
        if (!parsedStory || !Array.isArray(parsedStory.sentencePairs) || !Array.isArray(parsedStory.vocabulary)) {
          throw new Error('Invalid JSON structure received from AI.');
        }
        if (parsedStory.sentencePairs.length === 0) {
          throw new Error('AI response contained no sentence pairs.');
        }
        parsedStory.sentencePairs.forEach((pair, index) => {
           if (typeof pair.id !== 'number' || typeof pair.target !== 'string' || typeof pair.source !== 'string') {
            throw new Error(`Invalid sentence pair structure at index ${index} in AI response.`);
          }
        });
        parsedStory.vocabulary.forEach((item, index) => {
           if (typeof item.word !== 'string' || typeof item.translation !== 'string') {
            throw new Error(`Invalid vocabulary structure at index ${index} in AI response.`);
          }
        });

      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError);
        console.error("Content attempted to parse:", content);
        throw new Error(`Failed to parse the story response from the AI. ${parseError.message}`);
      }

      // --- SUCCESS: Navigate to the story view ---
      console.log("Navigation payload:", { storyData: parsedStory, params });
      navigate('/story/view', { state: { storyData: parsedStory, params } });

    } catch (err) {
      console.error("Error generating story:", err);
      throw err; 
    } 
  };

  if (loading) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<MainAppView generateStory={generateStory} />} /> 
        <Route path="/story/view" element={<StoryViewPage />} /> 
        <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        <Route path="/my-stories" element={<ProtectedRoute><MyStoriesPage /></ProtectedRoute>} />
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
