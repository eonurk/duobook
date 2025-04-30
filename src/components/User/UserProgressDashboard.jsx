import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Gem, Star, Award, Target } from 'lucide-react';
import DailyChallenges from '../Gamification/DailyChallenges';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function UserProgressDashboard() {
  const { userProgress, userAchievements, loading } = useAuth();

  const calculateLevelProgress = (level, points) => {
    if (!level || level < 1) level = 1;
    if (!points || points < 0) points = 0;

    const pointsForLevel = (lvl) => {
        if (lvl <= 1) return 0;
        // Sum formula: n*(n+1)/2 -> (lvl-1)*lvl/2 * 100
        return (lvl - 1) * lvl / 2 * 100; 
    };

    const currentLevelBasePoints = pointsForLevel(level);
    const nextLevelBasePoints = pointsForLevel(level + 1);
    const pointsNeededForNextLevel = nextLevelBasePoints - currentLevelBasePoints; // This is level * 100
    const pointsInCurrentLevel = points - currentLevelBasePoints;

    if (pointsNeededForNextLevel <= 0) return { percentage: 100, pointsInCurrentLevel: pointsInCurrentLevel > 0 ? pointsInCurrentLevel : 0 , pointsNeededForNextLevel: 0 }; // Avoid division by zero if logic is flawed or level maxed out
    
    const progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
    
    return {
      percentage: progressPercentage,
      pointsInCurrentLevel: Math.max(0, pointsInCurrentLevel), // Ensure no negative points displayed
      pointsNeededForNextLevel: pointsNeededForNextLevel
    };
  };

  if (loading) {
    return (
        <div className="container mx-auto p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading progress data...
        </div>
    );
  }

  if (!userProgress) {
      return <div className="container mx-auto p-8 text-center text-muted-foreground">Could not load progress data.</div>;
  }

  const currentLevel = userProgress.level || 1;
  const currentPoints = userProgress.points || 0;
  const progressInfo = calculateLevelProgress(currentLevel, currentPoints);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Learning Journey</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Points
            </CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Earn points by completing challenges and stories!
            </p>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Level
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentLevel}</div>
            <p className="text-xs text-muted-foreground mt-1">
                {progressInfo.pointsNeededForNextLevel > 0 
                  ? `${progressInfo.pointsNeededForNextLevel - progressInfo.pointsInCurrentLevel} points to Level ${currentLevel + 1}` 
                  : "Max level reached!"} 
            </p>
          </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
             <CardTitle className="text-lg font-semibold">Level {currentLevel} Progress</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="w-full bg-muted rounded-full h-2.5 dark:bg-gray-700 mb-1">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressInfo.percentage}%` }}
              ></div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-muted-foreground">
                  {`${progressInfo.pointsInCurrentLevel} / ${progressInfo.pointsNeededForNextLevel} XP (${Math.round(progressInfo.percentage)}%)`}
              </span>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Achievements</CardTitle>
             <Award className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {userAchievements && userAchievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {userAchievements.map((userAch) => (
                <div key={userAch.id} className="flex flex-col items-center text-center p-3 border rounded-lg bg-background/50 hover:bg-accent transition-colors">
                    <div className="text-4xl mb-2" title={userAch.achievement.description}>🏆</div>
                    <h3 className="font-medium text-xs leading-tight">{userAch.achievement.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(userAch.unlockedAt).toLocaleDateString()}</p>
                </div>
                ))}
            </div>
            ) : (
            <div className="text-center py-4 text-muted-foreground">
                <p className=" mb-1">No achievements unlocked yet.</p>
                <p className="text-sm ">Complete stories and challenges to earn them!</p>
            </div>
            )}
        </CardContent>
      </Card>

       <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-lg font-semibold">Daily Challenges</CardTitle>
                 <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <DailyChallenges />
             </CardContent>
         </Card>

    </div>
  );
}

export default UserProgressDashboard; 