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
import DuoBookExplain from '@/assets/duobook-explain.jpg'; // Use alias
import PrivacyPolicy from '@/pages/PrivacyPolicy'; // Import PrivacyPolicy
import TermsOfService from '@/pages/TermsOfService'; // Import TermsOfService
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
    { id: 1, target: "DuoBook es una app nueva.", source: "DuoBook is a new app." },
    { id: 2, target: "Ayuda a las personas a aprender idiomas.", source: "It helps people learn languages." },
    { id: 3, target: "Puedes leer historias en dos idiomas.", source: "You can read stories in two languages." },
    { id: 4, target: "Haz clic para ver la traducción.", source: "Click to see the translation." },
    { id: 5, target: "¡Aprender es divertido con DuoBook!", source: "Learning is fun with DuoBook!" },
  ],
  vocabulary: [
    { word: "app", translation: "app" },
    { word: "nueva", translation: "new" },
    { word: "aprender", translation: "to learn" },
    { word: "idiomas", translation: "languages" },
    { word: "historias", translation: "stories" },
    { word: "traducción", translation: "translation" },
    { word: "divertido", translation: "fun" },
  ],
  targetLanguage: 'Spanish',
  sourceLanguage: 'English'
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
            <p style={{ textAlign: 'center', fontSize: '1rem', color: '#666', marginBottom: '1.5rem' }}>
              Here's a quick example of a <b>DuoBook</b> story and how you interact with it.
            </p>
            <img src={DuoBookExplain} alt="DuoBook Explain" 
              style={{ 
                display: 'block',
                width: '100%',
                maxWidth: '520px',
                height: 'auto',
                margin: '0 auto 2rem auto',
                borderRadius: '15px'
              }}
            />

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
  const { loading } = useAuth();

  const navigate = useNavigate();

  const generateStory = async (description, sourceLang, targetLang, difficulty, storyLength) => {
    if (!openai) {
      throw new Error('OpenAI client is not initialized. Check API key.');
    }
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
      navigate('/story/view', { state: { storyData: parsedStory, params } });

    } catch (error) {
      console.error("Error generating story:", error);
      throw error; // Re-throw to be caught by handleGenerate
    }
  };

  // Show loading indicator while Firebase auth is initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* Render Navbar */}
      <Routes>
        {/* Main view: Show InputForm or Example */}
        <Route path="/" element={<MainAppView generateStory={generateStory} />} />

        {/* Story viewing page (receives state via navigation) */}
        <Route path="/story/view" element={<StoryViewPage />} />

        {/* Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        <Route path="/my-stories" element={<ProtectedRoute><MyStoriesPage /></ProtectedRoute>} />

        {/* Add new routes here */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Optional: Redirect any unknown paths back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter /> {/* Render Footer */}
    </div>
  );
}

export default App;
