import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import '@/App.css'; // Use alias
import InputForm from '@/components/InputForm'; // Use alias
import BookView from '@/components/BookView'; // Use alias
import { useAuth } from '@/context/AuthContext'; // Use alias
import { auth } from '@/firebaseConfig'; // Import auth directly
import Navbar from '@/components/Layout/Navbar'; // Use alias - Import Navbar
import SiteFooter from '@/components/Layout/SiteFooter'; // Use alias - Import Footer
import UserProfilePage from '@/components/User/UserProfilePage'; // Use alias
import MyStoriesPage from '@/components/User/MyStoriesPage'; // Use alias
import UserProgressDashboard from '@/components/User/UserProgressDashboard'; // Import ProgressDashboard
import Achievements from '@/components/Gamification/Achievements'; // Import Achievements component
import DuoBookExplain from '@/assets/duobook-explain.png'; // Use alias
import PrivacyPolicy from '@/pages/PrivacyPolicy'; // Import PrivacyPolicy
import TermsOfService from '@/pages/TermsOfService'; // Import TermsOfService
import VocabularyPracticePage from '@/pages/VocabularyPracticePage'; // Import Practice Page
import { ArrowDown } from 'lucide-react'; // Import ArrowDown icon
import {
    // getStories, // Commented out: Will be used in MyStoriesPage
    createStory,
    // deleteStory, // Commented out: Will be used in MyStoriesPage
    // getUserProgress, // Commented out: Will be used elsewhere (e.g., AuthContext, UserProgressDashboard)
    // updateUserProgress, // Commented out: Will be used elsewhere
    // getAllAchievements, // Commented out: Will be used elsewhere (e.g., Achievements page)
    // getUserAchievements // Commented out: Will be used elsewhere
    generateStoryViaBackend // ADD import for backend generation
} from './lib/api'; // Import API functions

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

  const handleGenerate = async (description, sourceLang, targetLang, difficulty, storyLength) => {
    setIsGenerating(true);
    setFormError(null);
    setFormParams({ description, source: sourceLang, target: targetLang, difficulty, length: storyLength });
    try {
        // Call the generateStory function passed from App, which now uses the backend
        await generateStory(description, sourceLang, targetLang, difficulty, storyLength); 
    } catch (error) {
      console.error("Error during generation or saving:", error);
      setFormError(error.message || "Failed to generate story. Please try again.");
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
            <p className="text-center text-base text-muted-foreground mb-6">
              Here's a quick example of a <b>DuoBook</b> story and how you interact with it.
            </p>
            <img 
              src={DuoBookExplain} 
              alt="DuoBook Explain" 
              className="block w-full max-w-lg h-auto mx-auto mb-4 rounded-lg"
            />

            <div className="text-center mb-4">
               <ArrowDown className="h-6 w-6 mx-auto text-muted-foreground" aria-hidden="true" />
               <p className="text-sm text-muted-foreground mt-1">Scroll down to view the example.</p>
            </div>

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
  const { loading, currentUser } = useAuth();
  const [firebaseError, setFirebaseError] = useState(false);
  const navigate = useNavigate();

  // Check Firebase initialization
  useEffect(() => {
    // Simple check if Firebase auth is available
    if (!auth) {
      console.error("Firebase Authentication is not initialized");
      setFirebaseError(true);
    }
  }, []);

  // Updated generateStory function to use the backend proxy
  const generateStory = async (description, sourceLang, targetLang, difficulty, storyLength) => {
    if (!currentUser) {
        throw new Error("User must be logged in to generate and save stories.");
    }

    const params = { description, source: sourceLang, target: targetLang, difficulty, length: storyLength };

    try {
        console.log("Sending generation request to backend proxy...");
        // 1. Call the backend proxy to get the generated story content
        const generatedStoryContent = await generateStoryViaBackend(params);

        console.log("Received story content from backend:", generatedStoryContent);

        // Ensure the received data has the expected structure (basic check)
        if (!generatedStoryContent || !generatedStoryContent.sentencePairs || !generatedStoryContent.vocabulary) {
             throw new Error("Invalid story data received from backend.");
        }
        
        // 2. Save the generated story content to the database via API
        console.log("Saving generated story to database...");
        const savedStory = await createStory({
            story: JSON.stringify(generatedStoryContent), // Store the whole generated object as JSON string
            description: description,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            difficulty: difficulty,
            length: storyLength,
        });
        console.log("Story saved successfully:", savedStory);

        // 3. Navigate to the story view page with the generated content and params
        navigate('/story-view', {
            state: { storyData: generatedStoryContent, params: params }
        });

    } catch (error) {
        console.error("Error in generateStory (App.jsx):", error);
        // Re-throw the error so MainAppView can catch it and display it
        throw error; 
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }
  if (firebaseError) {
      return (
          <div className="text-center p-8 text-red-600">
              Error: Firebase could not be initialized. Please check configuration and console.
          </div>
      );
  }

  return (
    <div className="app-container flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <Routes>
        <Route path="/" element={<MainAppView generateStory={generateStory} />} />
        <Route path="/story-view" element={<StoryViewPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        <Route path="/my-stories" element={<ProtectedRoute><MyStoriesPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><UserProgressDashboard /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><VocabularyPracticePage /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
