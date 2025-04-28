import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

function UserProgressDashboard() {
  const { currentUser, userProgress } = useAuth();
  const [recentStories, setRecentStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentStories = async () => {
      if (!currentUser) return;
      
      try {
        // Get most recent stories
        const storiesRef = collection(db, 'users', currentUser.uid, 'stories');
        const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        
        const stories = [];
        querySnapshot.forEach((doc) => {
          stories.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setRecentStories(stories);
      } catch (error) {
        console.error("Error fetching recent stories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentStories();
  }, [currentUser]);

  // Calculate XP needed for next level
  const calculateXpForNextLevel = (level) => {
    // Simple calculation: 100 * current level
    return 100 * level;
  };

  // Calculate progress percentage to next level
  const calculateLevelProgress = () => {
    if (!userProgress) return 0;
    
    const currentXp = userProgress.xpPoints || 0;
    const currentLevel = userProgress.level || 1;
    const xpForNextLevel = calculateXpForNextLevel(currentLevel);
    
    return Math.min(Math.floor((currentXp / xpForNextLevel) * 100), 100);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading progress data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Language Learning Journey</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Current Streak</h2>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-orange-500">{userProgress?.streak || 0}</span>
            <span className="ml-2 text-gray-600">days</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Keep learning daily to increase your streak!</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Vocabulary Mastered</h2>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-blue-500">{userProgress?.vocabularyLearned || 0}</span>
            <span className="ml-2 text-gray-600">words</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Words you've learned across all stories</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Stories Completed</h2>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-green-500">{userProgress?.storiesCompleted || 0}</span>
            <span className="ml-2 text-gray-600">stories</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Total bilingual stories you've read</p>
        </div>
      </div>
      
      {/* Level Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Level {userProgress?.level || 1}</h2>
          <span className="text-sm text-gray-600">{userProgress?.xpPoints || 0} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${calculateLevelProgress()}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">Current</span>
          <span className="text-xs text-gray-500">
            {calculateXpForNextLevel(userProgress?.level || 1) - (userProgress?.xpPoints || 0)} XP to Level {(userProgress?.level || 1) + 1}
          </span>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Stories</h2>
        
        {recentStories.length > 0 ? (
          <div className="space-y-4">
            {recentStories.map((story) => (
              <div key={story.id} className="border-b pb-4">
                <div className="flex justify-between">
                  <h3 className="font-medium">{story.title || 'Untitled Story'}</h3>
                  <span className="text-sm text-gray-500">
                    {story.createdAt?.toDate().toLocaleDateString() || 'Unknown date'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {story.targetLanguage} / {story.sourceLanguage}
                </p>
                <div className="mt-2 flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${story.completionPercentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{story.completionPercentage || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No stories yet. Start creating your first language story!</p>
        )}
      </div>
      
      {/* Achievements Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Your Achievements</h2>
        
        {userProgress?.achievements && userProgress.achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userProgress.achievements.map((achievement, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="font-medium text-sm">{achievement.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">No achievements unlocked yet</p>
            <p className="text-sm text-gray-400">Complete stories and practice daily to earn achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProgressDashboard; 