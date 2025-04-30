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

  const calculatePointsForNextLevel = (level) => {
    return 100 * level;
  };

  const calculateLevelProgress = () => {
    if (!userProgress || userProgress.level === undefined || userProgress.points === undefined) return 0;

    const currentPoints = userProgress.points;
    const currentLevel = userProgress.level;

    let pointsAtStartOfLevel = 0;
    if (currentLevel > 1) {
        pointsAtStartOfLevel = calculatePointsForNextLevel(currentLevel - 1);
    }
    const pointsForNextLevel = calculatePointsForNextLevel(currentLevel);
    const pointsNeededForLevel = pointsForNextLevel - pointsAtStartOfLevel;
    const pointsEarnedInLevel = currentPoints - pointsAtStartOfLevel;

    if (pointsNeededForLevel <= 0) {
        return currentPoints > pointsAtStartOfLevel ? 100 : 0;
    }

    const progressPercentage = Math.max(0, Math.min(100,
        Math.floor((pointsEarnedInLevel / pointsNeededForLevel) * 100)
    ));

    return progressPercentage;
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
  const pointsToNextLevel = calculatePointsForNextLevel(currentLevel) - currentPoints;

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
                {pointsToNextLevel > 0 ? `${pointsToNextLevel} points to Level ${currentLevel + 1}` : "Max level? Keep learning!"}
            </p>
          </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
             <CardTitle className="text-lg font-semibold">Level {currentLevel} Progress</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="w-full bg-muted rounded-full h-2.5 dark:bg-gray-700 mb-2">
            <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calculateLevelProgress()}%` }}
            ></div>
            </div>
            <div className="text-right">
            <span className="text-xs font-medium text-muted-foreground">
                {calculateLevelProgress()}% Complete
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