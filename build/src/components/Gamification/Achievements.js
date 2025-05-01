import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
// REMOVE Firestore imports:
// import { db } from '@/firebaseConfig'; 
// import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
// Achievement definitions (Keep these for reference if needed, or they could move to backend constants)
export const ACHIEVEMENTS = [
    {
        id: 'first_story',
        name: 'First Adventure',
        description: 'Complete your first story',
        icon: '📚',
        xpReward: 50,
        // checkCondition might be removed or kept just for frontend display logic if needed elsewhere
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
// REMOVE the entire checkAchievements function:
// export const checkAchievements = async (userId, userProgress) => { ... };
// Component to display recent achievements popup (Keep this component definition)
function AchievementPopup({ achievements }) {
    if (!achievements || achievements.length === 0)
        return null;
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-50", children: achievements.map((achievement, index) => (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4 mb-2 flex items-center animate-slide-up", style: { animationDelay: `${index * 200}ms` }, children: [_jsx("div", { className: "text-3xl mr-3", children: achievement.icon }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold", children: achievement.name }), _jsx("p", { className: "text-sm text-gray-600", children: achievement.description }), achievement.xpReward && _jsxs("p", { className: "text-xs text-blue-500 mt-1", children: ["+", achievement.xpReward, " XP"] })] })] }, achievement.id))) }));
}
// Main achievements component
function Achievements() {
    // Removed unused variables from useAuth() and useState()
    // const { currentUser, userProgress, userAchievements } = useAuth(); 
    // const [recentAchievements, setRecentAchievements] = useState([]); 
    // TODO: Implement logic to trigger AchievementPopup if needed.
    // This might involve comparing previous userAchievements with current ones
    // after certain actions or periodically. For now, it won't show automatically.
    // Example: You could potentially pass newly awarded achievements via props or another mechanism
    // return <AchievementPopup achievements={recentAchievements} />;
    // Or return null if this component is only for the popup logic
    return null; // Returning null for now as the main check logic is removed.
    // This component might need restructuring or removal depending on 
    // how achievement notifications are handled.
}
export default Achievements;
