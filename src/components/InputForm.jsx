import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import Login from '@/components/Auth/Login'; // Import Login
import Signup from '@/components/Auth/Signup'; // Import Signup
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription // Added DialogDescription
} from "@/components/ui/dialog"; // Import Dialog components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import Card components

// Common languages for selection
const languages = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Swedish', label: 'Swedish' },
  { value: 'Norwegian', label: 'Norwegian' },
  { value: 'Danish', label: 'Danish' },
  { value: 'Polish', label: 'Polish' },
  // Add more languages as needed
];

// Map numeric values to labels
const difficultyMap = ['Beginner', 'Intermediate', 'Advanced'];
const difficultyLabels = ['Beginner (A1/A2)', 'Intermediate (B1/B2)', 'Advanced (C1/C2)'];
const lengthMap = ['Short', 'Medium', 'Long'];
const lengthLabels = [
    'Short (~3-4 paragraphs)',
    'Medium (~5-7 paragraphs)',
    'Long (~8-10+ paragraphs)' // Increased target for Long
];

// Examples Array
const storyExamples = [
  "A lost puppy looking for its owner in a busy city.",
  "A cooking competition where the main ingredient is magical mushrooms.",
  "A lonely robot on Mars who discovers a hidden garden.",
];

function InputForm({ onSubmit, isLoading }) {
  const { currentUser } = useAuth(); // Get current user
  const [description, setDescription] = useState('');
  const [sourceLang, setSourceLang] = useState('English'); // Default source: English
  const [targetLang, setTargetLang] = useState('Spanish'); // Default target: Spanish
  // Use numeric state for sliders, map back to string for submission
  const [difficultyIndex, setDifficultyIndex] = useState(0); // 0: Beginner, 1: Intermediate, 2: Advanced
  const [lengthIndex, setLengthIndex] = useState(0); // 0: Short, 1: Medium, 2: Long
  const [showAuthDialog, setShowAuthDialog] = useState(false); // State for dialog

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!currentUser) {
      setShowAuthDialog(true); // Show login/signup dialog
      return; // Stop submission
    }

    // If logged in, proceed with original submission logic
    if (description.trim() && !isLoading) {
      // Get string values from map using current index
      const difficulty = difficultyMap[difficultyIndex];
      const storyLength = lengthMap[lengthIndex];
      onSubmit(description, sourceLang, targetLang, difficulty, storyLength);
    }
  };

  // Function to handle example button click
  const handleExampleClick = (exampleText) => {
    setDescription(exampleText);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="input-form">
        <h2>Create Your Bilingual Book</h2>

        {/* Section 1: Story Idea */}
        <fieldset className="form-section">
          <legend className="form-section-title">Story Idea</legend>
          <label htmlFor="storyDescription" className="form-label visually-hidden">Story Description:</label>
          <textarea
            id="storyDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the story or click an example below..."
            rows={4}
            disabled={isLoading}
            className="input-textarea"
            aria-describedby="story-helper-text story-examples"
          />
          
          <div id="story-examples" className="form-examples">
            <div className="example-buttons-container">
              {storyExamples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  className="button example-button"
                  onClick={() => handleExampleClick(example)}
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Section 2: Languages */}
        <fieldset className="form-section">
          <legend className="form-section-title">Languages</legend>
          <div className="language-select-container">
            <div>
              <label htmlFor="sourceLang" className="form-label">Your Language:</label>
              <select
                id="sourceLang"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="input-select"
                disabled={isLoading}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="targetLang" className="form-label">Language to Learn:</label>
              <select
                id="targetLang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="input-select"
                disabled={isLoading}
              >
                {languages.filter(lang => lang.value !== sourceLang).map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Section 3: Story Settings */}
        <fieldset className="form-section">
          <legend className="form-section-title">Story Settings</legend>
          <div className="slider-container">
            <div className="slider-item">
              <label htmlFor="difficulty" className="form-label">Difficulty: <span className="slider-value">{difficultyLabels[difficultyIndex]}</span></label>
              <input
                type="range"
                id="difficulty"
                min="0"
                max="2"
                step="1"
                value={difficultyIndex}
                onChange={(e) => setDifficultyIndex(parseInt(e.target.value, 10))}
                className="input-range"
                disabled={isLoading}
              />
            </div>
            <div className="slider-item">
              <label htmlFor="storyLength" className="form-label">Story Length: <span className="slider-value">{lengthLabels[lengthIndex]}</span></label>
              <input
                type="range"
                id="storyLength"
                min="0"
                max="2"
                step="1"
                value={lengthIndex}
                onChange={(e) => setLengthIndex(parseInt(e.target.value, 10))}
                className="input-range"
                disabled={isLoading}
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isLoading || !description.trim() || sourceLang === targetLang}
          className="button button-primary submit-button"
        >
          {isLoading ? 'Generating...' : 'Create Book'}
        </button>
      </form>

      {/* Login/Signup Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <Card className="border-none shadow-none bg-amber-50">
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in or create an account to generate a story.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Login onSuccess={() => setShowAuthDialog(false)} />
              <div className="text-center text-muted-foreground text-sm">or</div>
              <Signup onSuccess={() => setShowAuthDialog(false)} />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InputForm; 