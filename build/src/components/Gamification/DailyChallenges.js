import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// Import the function to fetch daily challenges from the API
import { getUserDailyChallenges } from '@/lib/api';
import { Loader2 } from 'lucide-react';
// Remove static definitions and helper functions (handled by backend)
// const DAILY_CHALLENGES = [...];
// export const generateDailyChallenges = ...;
// export const checkChallengeCompletion = ...;
// export const updateChallengeProgress = ...;
// Component to display daily challenges fetched from API
function DailyChallenges() {
    const { currentUser } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Remove completedChallenge state, completion is now handled server-side
    // const [completedChallenge, setCompletedChallenge] = useState(null);
    useEffect(() => {
        const fetchChallenges = async () => {
            if (!currentUser) {
                setIsLoading(false);
                setChallenges([]); // Clear challenges if not logged in
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const fetchedChallenges = await getUserDailyChallenges();
                // The API returns challenges with the nested challenge definition
                setChallenges(fetchedChallenges || []);
            }
            catch (err) {
                console.error("Error fetching daily challenges:", err);
                setError(err.message || "Failed to load daily challenges.");
                setChallenges([]);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchChallenges();
    }, [currentUser]); // Refetch when user changes
    // Remove completion popup dismissal handler
    // const handleDismissCompletion = () => { ... };
    // Define icons locally or fetch from definition if needed
    const getChallengeIcon = (type) => {
        switch (type) {
            case 'READ_STORY': return '📖';
            case 'LEARN_WORDS': return '🔤';
            // Add other types as defined in your backend Challenge model
            default: return '🎯';
        }
    };
    if (isLoading) {
        return (_jsxs("div", { className: "mt-8 text-center text-muted-foreground", children: [_jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto mb-2" }), "Loading daily challenges..."] }));
    }
    if (error) {
        return _jsxs("div", { className: "mt-8 text-center text-red-500", children: ["Error loading challenges: ", error] });
    }
    return (_jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Daily Challenges" }), challenges.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: challenges.map((userChallenge) => {
                    const { challenge, progress, completed } = userChallenge;
                    const requiredCount = challenge.requiredCount;
                    const progressPercent = requiredCount
                        ? Math.min(100, (progress / requiredCount) * 100)
                        : (completed ? 100 : 0);
                    return (_jsx("div", { className: `bg-card text-card-foreground rounded-lg border shadow-sm p-4 border-l-4 ${completed ? 'border-green-500 opacity-70' : 'border-primary'}`, children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "text-2xl mr-3", children: getChallengeIcon(challenge.type) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold", children: challenge.title }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: challenge.description }), requiredCount != null && (_jsx("div", { className: "w-full bg-muted rounded-full h-1.5 mb-2 dark:bg-gray-700", children: _jsx("div", { className: `h-1.5 rounded-full ${completed ? 'bg-green-500' : 'bg-primary'}`, style: { width: `${progressPercent}%` } }) })), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-xs text-primary", children: ["+", challenge.xpReward, " points"] }), completed ? (_jsxs("span", { className: "text-xs text-green-500 flex items-center", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-1", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }), "Completed"] })) : requiredCount != null ? (_jsxs("span", { className: "text-xs text-muted-foreground", children: [progress, "/", requiredCount] })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: "Complete the action" }))] })] })] }) }, userChallenge.id));
                }) })) : (_jsx("p", { className: "text-muted-foreground text-center py-4", children: "No daily challenges assigned for today. Check back tomorrow!" }))] }));
}
export default DailyChallenges;
