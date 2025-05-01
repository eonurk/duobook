import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Gem, Star, Award, Target } from 'lucide-react';
import DailyChallenges from '../Gamification/DailyChallenges';
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
function UserProgressDashboard() {
    const { userProgress, userAchievements, loading } = useAuth();
    const calculateLevelProgress = (level, points) => {
        if (!level || level < 1)
            level = 1;
        if (!points || points < 0)
            points = 0;
        const pointsForLevel = (lvl) => {
            if (lvl <= 1)
                return 0;
            // Sum formula: n*(n+1)/2 -> (lvl-1)*lvl/2 * 100
            return (lvl - 1) * lvl / 2 * 100;
        };
        const currentLevelBasePoints = pointsForLevel(level);
        const nextLevelBasePoints = pointsForLevel(level + 1);
        const pointsNeededForNextLevel = nextLevelBasePoints - currentLevelBasePoints; // This is level * 100
        const pointsInCurrentLevel = points - currentLevelBasePoints;
        if (pointsNeededForNextLevel <= 0)
            return { percentage: 100, pointsInCurrentLevel: pointsInCurrentLevel > 0 ? pointsInCurrentLevel : 0, pointsNeededForNextLevel: 0 }; // Avoid division by zero if logic is flawed or level maxed out
        const progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
        return {
            percentage: progressPercentage,
            pointsInCurrentLevel: Math.max(0, pointsInCurrentLevel), // Ensure no negative points displayed
            pointsNeededForNextLevel: pointsNeededForNextLevel
        };
    };
    if (loading) {
        return (_jsxs("div", { className: "container mx-auto p-8 text-center", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto mb-2" }), "Loading progress data..."] }));
    }
    if (!userProgress) {
        return _jsx("div", { className: "container mx-auto p-8 text-center text-muted-foreground", children: "Could not load progress data." });
    }
    const currentLevel = userProgress.level || 1;
    const currentPoints = userProgress.points || 0;
    const progressInfo = calculateLevelProgress(currentLevel, currentPoints);
    return (_jsxs("div", { className: "container mx-auto p-4 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: "Your Learning Journey" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Total Points" }), _jsx(Gem, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: currentPoints }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Earn points by completing challenges and stories!" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Current Level" }), _jsx(Star, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: currentLevel }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: progressInfo.pointsNeededForNextLevel > 0
                                            ? `${progressInfo.pointsNeededForNextLevel - progressInfo.pointsInCurrentLevel} points to Level ${currentLevel + 1}`
                                            : "Max level reached!" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg font-semibold", children: ["Level ", currentLevel, " Progress"] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "w-full bg-muted rounded-full h-2.5 dark:bg-gray-700 mb-1", children: _jsx("div", { className: "bg-primary h-2.5 rounded-full transition-all duration-500 ease-out", style: { width: `${progressInfo.percentage}%` } }) }), _jsx("div", { className: "text-right", children: _jsx("span", { className: "text-xs font-medium text-muted-foreground", children: `${progressInfo.pointsInCurrentLevel} / ${progressInfo.pointsNeededForNextLevel} XP (${Math.round(progressInfo.percentage)}%)` }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-lg font-semibold", children: "Achievements" }), _jsx(Award, { className: "h-5 w-5 text-muted-foreground" })] }), _jsx(CardContent, { children: userAchievements && userAchievements.length > 0 ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: userAchievements.map((userAch) => (_jsxs("div", { className: "flex flex-col items-center text-center p-3 border rounded-lg bg-background/50 hover:bg-accent transition-colors", children: [_jsx("div", { className: "text-4xl mb-2", title: userAch.achievement.description, children: "\uD83C\uDFC6" }), _jsx("h3", { className: "font-medium text-xs leading-tight", children: userAch.achievement.name }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: new Date(userAch.unlockedAt).toLocaleDateString() })] }, userAch.id))) })) : (_jsxs("div", { className: "text-center py-4 text-muted-foreground", children: [_jsx("p", { className: " mb-1", children: "No achievements unlocked yet." }), _jsx("p", { className: "text-sm ", children: "Complete stories and challenges to earn them!" })] })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-lg font-semibold", children: "Daily Challenges" }), _jsx(Target, { className: "h-5 w-5 text-muted-foreground" })] }), _jsx(CardContent, { children: _jsx(DailyChallenges, {}) })] })] }));
}
export default UserProgressDashboard;
