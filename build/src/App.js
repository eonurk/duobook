import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    return currentUser ? children : _jsx(Navigate, { to: "/", replace: true });
}
// --- New Component for Story View ---
function StoryViewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const storyData = location.state?.storyData; // Get story data from navigation state
    const params = location.state?.params; // Get params from navigation state
    // Handle case where user lands directly on this route without state
    if (!storyData || !params) {
        console.warn("Navigated to StoryViewPage without story data. Redirecting home.");
        // Redirect back to the main form page if no story data is present
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const handleGoBackToForm = () => {
        navigate('/'); // Navigate back to the InputForm page
    };
    return (_jsx("main", { className: "flex-1 container mx-auto px-4 py-8", children: _jsx(BookView, { sentencePairs: storyData.sentencePairs, vocabulary: storyData.vocabulary, targetLanguage: params.target, sourceLanguage: params.source, onGoBack: handleGoBackToForm, isExample: false }) }));
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
        }
        catch (error) {
            console.error("Error during generation or saving:", error);
            setFormError(error.message || "Failed to generate story. Please try again.");
            setIsGenerating(false);
        }
    };
    return (_jsxs(_Fragment, { children: [formError && (_jsxs("div", { className: "error-message p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400", role: "alert", children: [_jsx("strong", { children: "Error:" }), " ", formError] })), _jsxs("main", { className: "flex-1 container mx-auto px-4 py-8", children: [!isGenerating && (_jsx(InputForm, { onSubmit: handleGenerate, isLoading: isGenerating })), isGenerating && (_jsxs("div", { className: "loading-indicator flex items-center justify-center flex-col text-center p-8", children: [_jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4" }), "Generating your ", formParams?.length, " ", formParams?.difficulty, " story in ", formParams?.target, " / ", formParams?.source, "... Please wait."] })), !isGenerating && (_jsxs("div", { className: "mt-12 pt-8 border-t", children: [_jsxs("p", { className: "text-center text-base text-muted-foreground mb-6", children: ["Here's a quick example of a ", _jsx("b", { children: "DuoBook" }), " story and how you interact with it."] }), _jsx("img", { src: DuoBookExplain, alt: "DuoBook Explain", className: "block w-full max-w-lg h-auto mx-auto mb-4 rounded-lg" }), _jsxs("div", { className: "text-center mb-4", children: [_jsx(ArrowDown, { className: "h-6 w-6 mx-auto text-muted-foreground", "aria-hidden": "true" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Scroll down to view the example." })] }), _jsx(BookView, { sentencePairs: exampleStoryData.sentencePairs, vocabulary: exampleStoryData.vocabulary, targetLanguage: exampleStoryData.targetLanguage, sourceLanguage: exampleStoryData.sourceLanguage, isExample: true, onGoBack: () => { } })] }))] })] }));
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
        }
        catch (error) {
            console.error("Error in generateStory (App.jsx):", error);
            // Re-throw the error so MainAppView can catch it and display it
            throw error;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" }) }));
    }
    if (firebaseError) {
        return (_jsx("div", { className: "text-center p-8 text-red-600", children: "Error: Firebase could not be initialized. Please check configuration and console." }));
    }
    return (_jsxs("div", { className: "app-container flex flex-col min-h-screen bg-background text-foreground", children: [_jsx(Navbar, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(MainAppView, { generateStory: generateStory }) }), _jsx(Route, { path: "/story-view", element: _jsx(StoryViewPage, {}) }), _jsx(Route, { path: "/privacy-policy", element: _jsx(PrivacyPolicy, {}) }), _jsx(Route, { path: "/terms-of-service", element: _jsx(TermsOfService, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(UserProfilePage, {}) }) }), _jsx(Route, { path: "/my-stories", element: _jsx(ProtectedRoute, { children: _jsx(MyStoriesPage, {}) }) }), _jsx(Route, { path: "/progress", element: _jsx(ProtectedRoute, { children: _jsx(UserProgressDashboard, {}) }) }), _jsx(Route, { path: "/practice", element: _jsx(ProtectedRoute, { children: _jsx(VocabularyPracticePage, {}) }) }), _jsx(Route, { path: "/achievements", element: _jsx(ProtectedRoute, { children: _jsx(Achievements, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }), _jsx(SiteFooter, {})] }));
}
export default App;
