import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: 'first_story',
    name: 'First Adventure',
    description: 'Complete your first story',
    icon: '📚',
    xpReward: 50,
    checkCondition: (progress) => progress.storiesCompleted >= 1
  },
  {
    id: 'vocabulary_builder',
    name: 'Vocabulary Builder',
    description: 'Learn 50 unique words',
    icon: '📝',
    xpReward: 100,
    checkCondition: (progress) => progress.vocabularyLearned >= 50
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Maintain a 5-day learning streak',
    icon: '🔥',
    xpReward: 75,
    checkCondition: (progress) => progress.streak >= 5
  },
  {
    id: 'language_explorer',
    name: 'Language Explorer',
    description: 'Create stories in 3 different languages',
    icon: '🌎',
    xpReward: 125,
    checkCondition: (progress) => (progress.languagesExplored || []).length >= 3
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 10 stories',
    icon: '🧠',
    xpReward: 200,
    checkCondition: (progress) => progress.storiesCompleted >= 10
  },
  {
    id: 'word_master',
    name: 'Word Master',
    description: 'Learn 200 unique words',
    icon: '🎓',
    xpReward: 250,
    checkCondition: (progress) => progress.vocabularyLearned >= 200
  },
  {
    id: 'daily_commitment',
    name: 'Daily Commitment',
    description: 'Maintain a 30-day learning streak',
    icon: '📅',
    xpReward: 300,
    checkCondition: (progress) => progress.streak >= 30
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Create stories in 5 different languages',
    icon: '🗣️',
    xpReward: 350,
    checkCondition: (progress) => (progress.languagesExplored || []).length >= 5
  }
];

// Function to check and award achievements
export const checkAchievements = async (userId, userProgress) => {
  if (!userId || !userProgress) return;
  
  const earnedAchievements = [];
  const existingAchievementIds = (userProgress.achievements || []).map(a => a.id);
  
  // Check each achievement to see if it's been earned
  for (const achievement of ACHIEVEMENTS) {
    if (!existingAchievementIds.includes(achievement.id) && achievement.checkCondition(userProgress)) {
      earnedAchievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        earnedAt: new Date(),
        xpReward: achievement.xpReward
      });
    }
  }
  
  // If new achievements were earned, update user progress
  if (earnedAchievements.length > 0) {
    const progressRef = doc(db, 'userProgress', userId);
    
    // Calculate total XP reward
    const totalXpReward = earnedAchievements.reduce((sum, achievement) => sum + achievement.xpReward, 0);
    
    // Update with new achievements and XP
    await updateDoc(progressRef, {
      achievements: arrayUnion(...earnedAchievements),
      xpPoints: (userProgress.xpPoints || 0) + totalXpReward
    });
    
    // Check if level up is needed
    const currentLevel = userProgress.level || 1;
    const newXpTotal = (userProgress.xpPoints || 0) + totalXpReward;
    const xpNeededForNextLevel = currentLevel * 100;
    
    if (newXpTotal >= xpNeededForNextLevel) {
      const newLevel = Math.floor(newXpTotal / 100) + 1;
      await updateDoc(progressRef, {
        level: newLevel
      });
    }
    
    return earnedAchievements;
  }
  
  return [];
};

// Component to display recent achievements
function AchievementPopup({ achievements }) {
  if (!achievements || achievements.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {achievements.map((achievement, index) => (
        <div 
          key={achievement.id} 
          className="bg-white rounded-lg shadow-lg p-4 mb-2 flex items-center animate-slide-up"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          <div className="text-3xl mr-3">{achievement.icon}</div>
          <div>
            <h3 className="font-bold">{achievement.name}</h3>
            <p className="text-sm text-gray-600">{achievement.description}</p>
            <p className="text-xs text-blue-500 mt-1">+{achievement.xpReward} XP</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main achievements component
function Achievements() {
  const { currentUser, userProgress, fetchUserProgress } = useAuth();
  const [recentAchievements, setRecentAchievements] = useState([]);
  
  useEffect(() => {
    const checkForNewAchievements = async () => {
      if (!currentUser || !userProgress) return;
      
      const newAchievements = await checkAchievements(currentUser.uid, userProgress);
      
      if (newAchievements && newAchievements.length > 0) {
        setRecentAchievements(newAchievements);
        // Re-fetch user progress to get updated data
        fetchUserProgress(currentUser);
        
        // Clear achievements popup after 5 seconds
        setTimeout(() => {
          setRecentAchievements([]);
        }, 5000);
      }
    };
    
    checkForNewAchievements();
  }, [currentUser, userProgress, fetchUserProgress]);
  
  return <AchievementPopup achievements={recentAchievements} />;
}

export default Achievements; 