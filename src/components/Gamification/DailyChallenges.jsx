import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// Daily challenge definitions
const DAILY_CHALLENGES = [
  {
    id: 'read_story',
    title: 'Read a Story',
    description: 'Complete reading any story today',
    xpReward: 20,
    icon: '📖',
    checkCompletion: (userProgress) => {
      const today = new Date().toISOString().split('T')[0];
      return userProgress.lastStoryCompleted?.toDate().toISOString().split('T')[0] === today;
    }
  },
  {
    id: 'learn_words',
    title: 'Learn New Words',
    description: 'Reveal at least 5 new vocabulary words',
    xpReward: 15,
    icon: '🔤',
    requiredCount: 5,
    progress: 0,
    checkCompletion: (userProgress) => {
      return (userProgress.todayWordsLearned || 0) >= 5;
    }
  },
  {
    id: 'language_mix',
    title: 'Language Mix',
    description: 'Create a story in a different language than yesterday',
    xpReward: 25,
    icon: '🌐',
    checkCompletion: (userProgress) => {
      if (!userProgress.recentLanguages || userProgress.recentLanguages.length < 2) {
        return false;
      }
      
      const latestLanguages = userProgress.recentLanguages.slice(0, 2);
      return latestLanguages[0] !== latestLanguages[1];
    }
  },
  {
    id: 'early_learner',
    title: 'Early Learner',
    description: 'Use the app before 9:00 AM',
    xpReward: 10,
    icon: '🌅',
    checkCompletion: () => {
      const now = new Date();
      return now.getHours() < 9;
    }
  },
  {
    id: 'consistent_practice',
    title: 'Consistent Practice',
    description: 'Log in for 2 consecutive days',
    xpReward: 30,
    icon: '🔄',
    checkCompletion: (userProgress) => {
      return (userProgress.streak || 0) >= 2;
    }
  }
];

// Function to generate daily challenges
export const generateDailyChallenges = (userProgress) => {
  const today = new Date().toISOString().split('T')[0];
  
  // If we already have challenges for today, return them
  if (userProgress?.challenges?.dailyChallenges?.length > 0 && 
      userProgress.challenges.lastUpdated?.toDate().toISOString().split('T')[0] === today) {
    return userProgress.challenges.dailyChallenges;
  }
  
  // Otherwise, randomly select 3 challenges
  const shuffled = [...DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(challenge => ({
    ...challenge,
    completed: false,
    progress: 0
  }));
};

// Function to check challenge completion
export const checkChallengeCompletion = async (userId, userProgress, challengeId) => {
  if (!userId || !userProgress || !userProgress.challenges) return;
  
  const { dailyChallenges } = userProgress.challenges;
  if (!dailyChallenges) return;
  
  // Find the challenge
  const challengeIndex = dailyChallenges.findIndex(c => c.id === challengeId);
  if (challengeIndex === -1) return;
  
  const challenge = dailyChallenges[challengeIndex];
  
  // If already completed, do nothing
  if (challenge.completed) return;
  
  // Check if challenge is completed
  if (challenge.checkCompletion(userProgress)) {
    // Update the challenge as completed
    const updatedChallenges = [...dailyChallenges];
    updatedChallenges[challengeIndex] = {
      ...challenge,
      completed: true,
      completedAt: new Date()
    };
    
    // Add to completed challenges history
    const completedChallenge = {
      id: challenge.id,
      title: challenge.title,
      xpReward: challenge.xpReward,
      completedAt: new Date()
    };
    
    // Update user progress
    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, {
      'challenges.dailyChallenges': updatedChallenges,
      'challenges.completedChallenges': arrayUnion(completedChallenge),
      xpPoints: (userProgress.xpPoints || 0) + challenge.xpReward
    });
    
    // Check if level up is needed
    const currentLevel = userProgress.level || 1;
    const newXpTotal = (userProgress.xpPoints || 0) + challenge.xpReward;
    const xpNeededForNextLevel = currentLevel * 100;
    
    if (newXpTotal >= xpNeededForNextLevel) {
      const newLevel = Math.floor(newXpTotal / 100) + 1;
      await updateDoc(progressRef, {
        level: newLevel
      });
    }
    
    return completedChallenge;
  }
  
  return null;
};

// Function to update progress on a challenge
export const updateChallengeProgress = async (userId, userProgress, challengeId, progress) => {
  if (!userId || !userProgress || !userProgress.challenges) return;
  
  const { dailyChallenges } = userProgress.challenges;
  if (!dailyChallenges) return;
  
  // Find the challenge
  const challengeIndex = dailyChallenges.findIndex(c => c.id === challengeId);
  if (challengeIndex === -1) return;
  
  const challenge = dailyChallenges[challengeIndex];
  
  // If already completed, do nothing
  if (challenge.completed) return;
  
  // Update progress
  const updatedChallenges = [...dailyChallenges];
  updatedChallenges[challengeIndex] = {
    ...challenge,
    progress: progress
  };
  
  // Check if this progress completes the challenge
  if (challenge.requiredCount && progress >= challenge.requiredCount) {
    updatedChallenges[challengeIndex].completed = true;
    updatedChallenges[challengeIndex].completedAt = new Date();
    
    // Add to completed challenges history
    const completedChallenge = {
      id: challenge.id,
      title: challenge.title,
      xpReward: challenge.xpReward,
      completedAt: new Date()
    };
    
    // Update user progress with challenge completion
    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, {
      'challenges.dailyChallenges': updatedChallenges,
      'challenges.completedChallenges': arrayUnion(completedChallenge),
      xpPoints: (userProgress.xpPoints || 0) + challenge.xpReward
    });
    
    return completedChallenge;
  } else {
    // Just update progress
    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, {
      'challenges.dailyChallenges': updatedChallenges
    });
  }
  
  return null;
};

// Component to display daily challenges
function DailyChallenges() {
  const { currentUser, userProgress } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [completedChallenge, setCompletedChallenge] = useState(null);
  
  useEffect(() => {
    const initializeDailyChallenges = async () => {
      if (!currentUser || !userProgress) return;
      
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const lastUpdated = userProgress.challenges?.lastUpdated?.toDate().toISOString().split('T')[0];
        
        // Check if we need to generate new challenges for today
        if (!userProgress.challenges || !userProgress.challenges.dailyChallenges || lastUpdated !== today) {
          const todaysChallenges = generateDailyChallenges(userProgress);
          
          // Update in Firestore
          const progressRef = doc(db, 'userProgress', currentUser.uid);
          await updateDoc(progressRef, {
            'challenges.dailyChallenges': todaysChallenges,
            'challenges.lastUpdated': serverTimestamp()
          });
          
          setChallenges(todaysChallenges);
        } else {
          // Use existing challenges
          setChallenges(userProgress.challenges.dailyChallenges);
        }
      } catch (error) {
        console.error("Error initializing daily challenges:", error);
      }
    };
    
    initializeDailyChallenges();
  }, [currentUser, userProgress]);
  
  // Function to handle completion popup dismissal
  const handleDismissCompletion = () => {
    setCompletedChallenge(null);
  };
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Daily Challenges</h2>
      
      {challenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                challenge.completed ? 'border-green-500' : 'border-blue-500'
              }`}
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3">{challenge.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{challenge.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                  
                  {challenge.requiredCount && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, (challenge.progress / challenge.requiredCount) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-500">+{challenge.xpReward} XP</span>
                    {challenge.completed ? (
                      <span className="text-xs text-green-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">In progress</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">Loading daily challenges...</p>
      )}
      
      {completedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleDismissCompletion}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">Challenge Completed!</h3>
            <p className="mb-4">{completedChallenge.title}</p>
            <p className="text-blue-500 font-semibold mb-6">+{completedChallenge.xpReward} XP</p>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={handleDismissCompletion}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyChallenges; 