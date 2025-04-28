import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// --- Local Storage Key Prefix (should match App.jsx) ---
const LOCAL_STORAGE_KEY_PREFIX = 'savedStories';

function MyStoriesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [savedStories, setSavedStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      try {
        const userStoryKey = `${LOCAL_STORAGE_KEY_PREFIX}-${currentUser.uid}`;
        const storiesRaw = localStorage.getItem(userStoryKey);
        let stories = storiesRaw ? JSON.parse(storiesRaw) : [];
        
        // Sort by newest first using savedAt timestamp
        stories.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)); // Fallback to 0 if timestamp missing
        
        setSavedStories(stories);
      } catch (error) {
        console.error("Error loading stories from localStorage:", error);
        // Handle error display if needed
      }
    }
    setIsLoading(false);
  }, [currentUser]);

  const handleStoryClick = (story) => {
    navigate('/story/view', { state: { storyData: story.storyData, params: story.params } });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (isLoading) {
    return <div className="container mx-auto py-10 px-4 text-center">Loading stories...</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">My Saved Stories</h1>
      {savedStories.length === 0 ? (
        <p className="text-muted-foreground">You haven't generated any stories yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {savedStories.map((story) => (
            <div 
              key={story.id} 
              className="border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleStoryClick(story)}
              role="button" 
              tabIndex={0} 
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStoryClick(story); }}
            >
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {story.params.description || "Untitled Story"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {story.params.target} / {story.params.source} ({story.params.difficulty}, {story.params.length}) - {story.storyData.sentencePairs.length} sentences
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved: {formatTimestamp(story.savedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyStoriesPage; 