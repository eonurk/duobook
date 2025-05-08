import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
	ACHIEVEMENTS,
	AchievementDetail,
	ACHIEVEMENT_CATEGORIES,
} from "./Achievements";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Component that displays the next achievements the user can unlock
 */
function AchievementProgress() {
	const { userProgress, userAchievements } = useAuth();

	if (!userProgress || !userAchievements) return null;

	// Find achievements that aren't unlocked yet
	const unlockedIds = (userAchievements || []).map((ua) => ua.achievement.id);

	// Get all unearned achievements with progress calculated
	const unearnedAchievements = ACHIEVEMENTS.filter(
		(achievement) =>
			!unlockedIds.includes(achievement.id) && achievement.progressCheck
	)
		.map((achievement) => {
			const progressValue = achievement.progressCheck(userProgress);
			return {
				...achievement,
				progressValue,
			};
		})
		.sort((a, b) => b.progressValue - a.progressValue); // Sort by progress (closest to unlock first)

	if (unearnedAchievements.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				You've unlocked all available achievements!
			</div>
		);
	}

	// Categorize achievements
	const almostComplete = unearnedAchievements.filter(
		(a) => a.progressValue >= 90
	);
	const inProgress = unearnedAchievements.filter(
		(a) => a.progressValue >= 25 && a.progressValue < 90
	);
	const earlyProgress = unearnedAchievements.filter(
		(a) => a.progressValue < 25 && a.progressValue > 0
	);
	const notStarted = unearnedAchievements.filter((a) => a.progressValue === 0);

	return (
		<div className="space-y-6">
			{/* Almost there achievements */}
			{almostComplete.length > 0 && (
				<div className="mb-6">
					<h3 className="text-sm font-medium text-amber-500 flex items-center gap-1 mb-3">
						<Sparkles className="h-4 w-4" />
						Almost Complete!
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{almostComplete.map((achievement) => (
							<AchievementDetail
								key={achievement.id}
								achievement={achievement}
								earned={false}
								progressValue={achievement.progressValue}
							/>
						))}
					</div>
				</div>
			)}

			{/* In Progress */}
			{inProgress.length > 0 && (
				<div className="mb-6">
					<h3 className="text-sm font-medium text-blue-500 flex items-center gap-1 mb-3">
						In Progress
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{inProgress.slice(0, 6).map((achievement) => (
							<AchievementDetail
								key={achievement.id}
								achievement={achievement}
								earned={false}
								progressValue={achievement.progressValue}
							/>
						))}
					</div>
				</div>
			)}

			{/* Early Progress */}
			{earlyProgress.length > 0 && (
				<div className="mb-6">
					<h3 className="text-sm font-medium text-muted-foreground mb-3">
						Early Progress
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{earlyProgress.slice(0, 3).map((achievement) => (
							<AchievementDetail
								key={achievement.id}
								achievement={achievement}
								earned={false}
								progressValue={achievement.progressValue}
							/>
						))}
					</div>
				</div>
			)}

			{/* Not Started */}
			{notStarted.length > 0 && (
				<div>
					<h3 className="text-sm font-medium text-muted-foreground mb-3">
						Not Started Yet
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{notStarted.slice(0, 3).map((achievement) => (
							<AchievementDetail
								key={achievement.id}
								achievement={achievement}
								earned={false}
								progressValue={0}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default AchievementProgress;
