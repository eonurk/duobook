import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to safely calculate progress
const safeProgressCalc = (currentValue, targetValue) => {
	if (
		typeof currentValue !== "number" ||
		isNaN(currentValue) ||
		currentValue === undefined
	)
		return 0;
	return Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
};

// Achievement definitions (expanded)
export const ACHIEVEMENTS = [
	{
		id: "first_story",
		name: "First Adventure",
		description: "Complete your first story",
		icon: "📚",
		xpReward: 50,
		checkCondition: (progress) => (progress?.storiesCompleted || 0) >= 1,
		category: "stories",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.storiesCompleted || 0, 1),
	},
	{
		id: "vocabulary_builder",
		name: "Vocabulary Builder",
		description: "Learn 50 unique words",
		icon: "📝",
		xpReward: 100,
		checkCondition: (progress) => (progress?.vocabularyLearned || 0) >= 50,
		category: "vocabulary",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.vocabularyLearned || 0, 50),
	},
	{
		id: "dedicated_learner",
		name: "Dedicated Learner",
		description: "Maintain a 5-day learning streak",
		icon: "🔥",
		xpReward: 75,
		checkCondition: (progress) => (progress?.streak || 0) >= 5,
		category: "streaks",
		progressCheck: (progress) => safeProgressCalc(progress?.streak || 0, 5),
	},
	{
		id: "language_explorer",
		name: "Language Explorer",
		description: "Create stories in 3 different languages",
		icon: "🌎",
		xpReward: 125,
		checkCondition: (progress) =>
			(progress?.languagesExplored || []).length >= 3,
		category: "languages",
		progressCheck: (progress) =>
			safeProgressCalc((progress?.languagesExplored || []).length, 3),
	},
	{
		id: "knowledge_seeker",
		name: "Knowledge Seeker",
		description: "Complete 10 stories",
		icon: "🧠",
		xpReward: 200,
		checkCondition: (progress) => (progress?.storiesCompleted || 0) >= 10,
		category: "stories",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.storiesCompleted || 0, 10),
	},
	{
		id: "word_master",
		name: "Word Master",
		description: "Learn 200 unique words",
		icon: "🎓",
		xpReward: 250,
		checkCondition: (progress) => (progress?.vocabularyLearned || 0) >= 200,
		category: "vocabulary",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.vocabularyLearned || 0, 200),
	},
	{
		id: "daily_commitment",
		name: "Daily Commitment",
		description: "Maintain a 30-day learning streak",
		icon: "📅",
		xpReward: 300,
		checkCondition: (progress) => (progress?.streak || 0) >= 30,
		category: "streaks",
		progressCheck: (progress) => safeProgressCalc(progress?.streak || 0, 30),
	},
	{
		id: "polyglot",
		name: "Polyglot",
		description: "Create stories in 5 different languages",
		icon: "🗣️",
		xpReward: 350,
		checkCondition: (progress) =>
			(progress?.languagesExplored || []).length >= 5,
		category: "languages",
		progressCheck: (progress) =>
			safeProgressCalc((progress?.languagesExplored || []).length, 5),
	},
	// New achievements
	{
		id: "perfect_recall",
		name: "Perfect Recall",
		description: "Score 100% on 5 vocabulary quizzes",
		icon: "🧩",
		xpReward: 150,
		checkCondition: (progress) => (progress?.perfectQuizzes || 0) >= 5,
		category: "quizzes",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.perfectQuizzes || 0, 5),
	},
	{
		id: "grammar_expert",
		name: "Grammar Expert",
		description: "Complete 15 grammar exercises with 90%+ accuracy",
		icon: "📏",
		xpReward: 200,
		checkCondition: (progress) => (progress?.grammarExercises || 0) >= 15,
		category: "grammar",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.grammarExercises || 0, 15),
	},
	{
		id: "conversation_starter",
		name: "Conversation Starter",
		description: "Practice 10 dialogues",
		icon: "💬",
		xpReward: 175,
		checkCondition: (progress) => (progress?.dialoguesPracticed || 0) >= 10,
		category: "speaking",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.dialoguesPracticed || 0, 10),
	},
	{
		id: "early_bird",
		name: "Early Bird",
		description: "Study before 8 AM on 7 different days",
		icon: "🌅",
		xpReward: 125,
		checkCondition: (progress) => (progress?.earlyMorningStudy || 0) >= 7,
		category: "habits",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.earlyMorningStudy || 0, 7),
	},
	{
		id: "night_owl",
		name: "Night Owl",
		description: "Study after 10 PM on 7 different days",
		icon: "🌙",
		xpReward: 125,
		checkCondition: (progress) => (progress?.lateNightStudy || 0) >= 7,
		category: "habits",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.lateNightStudy || 0, 7),
	},
	{
		id: "consistent_learner",
		name: "Consistent Learner",
		description: "Complete at least one activity for 14 consecutive days",
		icon: "📆",
		xpReward: 225,
		checkCondition: (progress) => (progress?.streak || 0) >= 14,
		category: "streaks",
		progressCheck: (progress) => safeProgressCalc(progress?.streak || 0, 14),
	},
	{
		id: "cultural_explorer",
		name: "Cultural Explorer",
		description: "Read 5 cultural notes or articles",
		icon: "🏺",
		xpReward: 150,
		checkCondition: (progress) => (progress?.culturalNotesRead || 0) >= 5,
		category: "culture",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.culturalNotesRead || 0, 5),
	},
	{
		id: "story_creator",
		name: "Story Creator",
		description: "Create 25 stories across any languages",
		icon: "✍️",
		xpReward: 300,
		checkCondition: (progress) => (progress?.storiesCreated || 0) >= 25,
		category: "creation",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.storiesCreated || 0, 25),
	},
	{
		id: "audio_master",
		name: "Audio Master",
		description: "Listen to audio narration 50 times",
		icon: "🔊",
		xpReward: 200,
		checkCondition: (progress) => (progress?.audioPlays || 0) >= 50,
		category: "listening",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.audioPlays || 0, 50),
	},
	{
		id: "vocab_champion",
		name: "Vocabulary Champion",
		description: "Learn 500 unique words",
		icon: "🏆",
		xpReward: 400,
		checkCondition: (progress) => (progress?.vocabularyLearned || 0) >= 500,
		category: "vocabulary",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.vocabularyLearned || 0, 500),
	},
	{
		id: "study_marathon",
		name: "Study Marathon",
		description: "Study for more than 60 minutes in a single day",
		icon: "⏱️",
		xpReward: 175,
		checkCondition: (progress) => (progress?.longestStudySession || 0) >= 60,
		category: "dedication",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.longestStudySession || 0, 60),
	},
	{
		id: "weekend_warrior",
		name: "Weekend Warrior",
		description: "Study on 8 consecutive weekends",
		icon: "📅",
		xpReward: 250,
		checkCondition: (progress) => (progress?.weekendStreak || 0) >= 8,
		category: "consistency",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.weekendStreak || 0, 8),
	},
	{
		id: "challenge_master",
		name: "Challenge Master",
		description: "Complete all daily challenges for 7 consecutive days",
		icon: "🏋️",
		xpReward: 300,
		checkCondition: (progress) => (progress?.challengeStreakDays || 0) >= 7,
		category: "challenges",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.challengeStreakDays || 0, 7),
	},
	{
		id: "review_champion",
		name: "Review Champion",
		description: "Review vocabulary 100 times",
		icon: "🔄",
		xpReward: 200,
		checkCondition: (progress) => (progress?.vocabularyReviews || 0) >= 100,
		category: "learning",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.vocabularyReviews || 0, 100),
	},
	{
		id: "advanced_reader",
		name: "Advanced Reader",
		description: "Complete 15 advanced difficulty stories",
		icon: "📖",
		xpReward: 350,
		checkCondition: (progress) =>
			(progress?.advancedStoriesCompleted || 0) >= 15,
		category: "reading",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.advancedStoriesCompleted || 0, 15),
	},
	{
		id: "sharing_is_caring",
		name: "Sharing is Caring",
		description: "Share 10 stories with friends",
		icon: "🔄",
		xpReward: 150,
		checkCondition: (progress) => (progress?.storiesShared || 0) >= 10,
		category: "social",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.storiesShared || 0, 10),
	},
	{
		id: "speedy_learner",
		name: "Speedy Learner",
		description: "Learn 20 new words in a single day",
		icon: "⚡",
		xpReward: 225,
		checkCondition: (progress) => (progress?.maxWordsInDay || 0) >= 20,
		category: "speed",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.maxWordsInDay || 0, 20),
	},
	{
		id: "monthly_dedication",
		name: "Monthly Dedication",
		description: "Log in and study for 30 days in a single month",
		icon: "📆",
		xpReward: 400,
		checkCondition: (progress) => (progress?.daysInMonth || 0) >= 30,
		category: "consistency",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.daysInMonth || 0, 30),
	},
	{
		id: "theme_explorer",
		name: "Theme Explorer",
		description: "Create stories with 10 different themes",
		icon: "🎭",
		xpReward: 200,
		checkCondition: (progress) => (progress?.uniqueThemes || []).length >= 10,
		category: "creation",
		progressCheck: (progress) =>
			safeProgressCalc((progress?.uniqueThemes || []).length, 10),
	},
	{
		id: "sentence_master",
		name: "Sentence Master",
		description: "Read 1000 sentences in your target language",
		icon: "📜",
		xpReward: 350,
		checkCondition: (progress) => (progress?.sentencesRead || 0) >= 1000,
		category: "reading",
		progressCheck: (progress) =>
			safeProgressCalc(progress?.sentencesRead || 0, 1000),
	},
	{
		id: "early_adopter",
		name: "Early Adopter",
		description: "Join during the first month of launch",
		icon: "🚀",
		xpReward: 100,
		checkCondition: (progress) => progress?.isEarlyAdopter === true,
		category: "special",
		progressCheck: (progress) => (progress?.isEarlyAdopter ? 100 : 0),
	},
];

// Achievement categories with colors
export const ACHIEVEMENT_CATEGORIES = {
	stories: { name: "Stories", color: "bg-blue-500" },
	vocabulary: { name: "Vocabulary", color: "bg-green-500" },
	streaks: { name: "Streaks", color: "bg-orange-500" },
	languages: { name: "Languages", color: "bg-purple-500" },
	quizzes: { name: "Quizzes", color: "bg-pink-500" },
	grammar: { name: "Grammar", color: "bg-indigo-500" },
	speaking: { name: "Speaking", color: "bg-cyan-500" },
	habits: { name: "Habits", color: "bg-amber-500" },
	culture: { name: "Culture", color: "bg-emerald-500" },
	creation: { name: "Creation", color: "bg-rose-500" },
	listening: { name: "Listening", color: "bg-teal-500" },
	dedication: { name: "Dedication", color: "bg-fuchsia-500" },
	consistency: { name: "Consistency", color: "bg-lime-500" },
	challenges: { name: "Challenges", color: "bg-sky-500" },
	learning: { name: "Learning", color: "bg-violet-500" },
	reading: { name: "Reading", color: "bg-yellow-500" },
	social: { name: "Social", color: "bg-red-500" },
	speed: { name: "Speed", color: "bg-blue-600" },
	special: {
		name: "Special",
		color: "bg-gradient-to-r from-purple-500 to-pink-500",
	},
};

// Component to display recent achievements popup
export function AchievementPopup({ achievements }) {
	if (!achievements || achievements.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50">
			{achievements.map((achievement, index) => (
				<div
					key={achievement.id}
					className="bg-white  rounded-lg shadow-lg p-4 mb-2 flex items-center animate-slide-up"
					style={{ animationDelay: `${index * 200}ms` }}
				>
					<div className="text-3xl mr-3">{achievement.icon}</div>
					<div>
						<h3 className="font-bold">{achievement.name}</h3>
						<p className="text-sm text-gray-600 ">{achievement.description}</p>
						{achievement.xpReward && (
							<p className="text-xs text-blue-500 mt-1">
								+{achievement.xpReward} XP
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

// Main achievements component that can be imported in other components
function Achievements({
	userProgress,
	userAchievements,
	filter = "all",
	showUnearned = true,
}) {
	const [categoryFilter, setCategoryFilter] = useState(filter);
	const [recentAchievements] = useState([]);
	const [showFilterMenu, setShowFilterMenu] = useState(false);

	// Get all achievements with their earned status
	const allAchievements = ACHIEVEMENTS.map((achievement) => {
		const earnedAchievement = userAchievements?.find(
			(ua) => ua.achievement?.id === achievement.id
		);
		const isEarned = !!earnedAchievement;
		const progressValue =
			!isEarned && achievement.progressCheck && userProgress
				? achievement.progressCheck(userProgress)
				: 0;

		return {
			...achievement,
			isEarned,
			unlockedAt: earnedAchievement?.unlockedAt,
			progressValue,
		};
	});

	// Filter achievements based on category and earned status
	const filteredAchievements = allAchievements.filter((achievement) => {
		if (categoryFilter !== "all" && achievement.category !== categoryFilter) {
			return false;
		}
		if (!showUnearned && !achievement.isEarned) {
			return false;
		}
		return true;
	});

	// Sort achievements: earned first, then by category, then by XP reward
	const sortedAchievements = [...filteredAchievements].sort((a, b) => {
		// First sort by earned status (earned comes first)
		if (a.isEarned !== b.isEarned) return a.isEarned ? -1 : 1;
		// Then sort by progress (higher progress comes first)
		if (!a.isEarned && !b.isEarned) return b.progressValue - a.progressValue;
		// Then by category
		if (a.category !== b.category) return a.category.localeCompare(b.category);
		// Finally by XP reward
		return b.xpReward - a.xpReward;
	});

	return (
		<div>
			{/* Mobile-optimized category selector */}
			<div className="mb-4">
				<div className="flex justify-between items-center">
					<div className="hidden md:flex flex-wrap gap-2 overflow-x-auto pb-2">
						<Button
							variant={categoryFilter === "all" ? "default" : "outline"}
							size="sm"
							onClick={() => setCategoryFilter("all")}
							className="text-xs"
						>
							All
						</Button>
						{Object.entries(ACHIEVEMENT_CATEGORIES).map(
							([category, details]) => (
								<Button
									key={category}
									variant={categoryFilter === category ? "default" : "outline"}
									size="sm"
									onClick={() => setCategoryFilter(category)}
									className="text-xs whitespace-nowrap"
								>
									{details.name}
								</Button>
							)
						)}
					</div>

					{/* Mobile filter button */}
					<div className="md:hidden">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilterMenu(!showFilterMenu)}
							className="flex items-center gap-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
							</svg>
							{ACHIEVEMENT_CATEGORIES[categoryFilter]?.name || "All"}
						</Button>
					</div>

					<div className="text-xs text-muted-foreground">
						Showing {sortedAchievements.length} of {ACHIEVEMENTS.length}
					</div>
				</div>

				{/* Mobile filter dropdown */}
				{showFilterMenu && (
					<div className="mt-2 p-2 bg-background border rounded-md shadow-md md:hidden">
						<div className="grid grid-cols-2 gap-1">
							<Button
								variant={categoryFilter === "all" ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setCategoryFilter("all");
									setShowFilterMenu(false);
								}}
								className="text-xs"
							>
								All
							</Button>
							{Object.entries(ACHIEVEMENT_CATEGORIES).map(
								([category, details]) => (
									<Button
										key={category}
										variant={
											categoryFilter === category ? "default" : "outline"
										}
										size="sm"
										onClick={() => {
											setCategoryFilter(category);
											setShowFilterMenu(false);
										}}
										className="text-xs whitespace-nowrap"
									>
										{details.name}
									</Button>
								)
							)}
						</div>
					</div>
				)}
			</div>

			{/* Achievement grid with improved mobile layout */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{sortedAchievements.length > 0 ? (
					sortedAchievements.map((achievement) => (
						<AchievementDetail
							key={achievement.id}
							achievement={achievement}
							earned={achievement.isEarned}
							progressValue={achievement.progressValue}
							unlockedAt={achievement.unlockedAt}
						/>
					))
				) : (
					<div className="col-span-full text-center py-8 text-muted-foreground">
						No achievements found in this category.
					</div>
				)}
			</div>

			{/* Display recent achievements popup */}
			<AchievementPopup achievements={recentAchievements} />
		</div>
	);
}

// Achievement detail component with improved progress bar
export function AchievementDetail({
	achievement,
	earned,
	progressValue = 0,
	unlockedAt = null,
}) {
	return (
		<div
			className={`border rounded-lg p-4 ${
				earned ? "bg-accent/20" : "bg-background/50"
			} transition-all hover:shadow-md`}
		>
			<div className="flex items-center mb-3">
				<div className={`text-3xl mr-3 ${earned ? "" : "opacity-50"}`}>
					{achievement.icon}
				</div>
				<div>
					<div className="flex items-center">
						<h3 className="font-medium">{achievement.name}</h3>
						{earned && (
							<Badge variant="outline" className="ml-2 text-xs">
								Earned
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground">
						{achievement.description}
					</p>
				</div>
			</div>

			{!earned && achievement.progressCheck && (
				<div className="mt-2">
					<div className="flex justify-between text-xs text-muted-foreground mb-1">
						<span>Progress</span>
						<span>{Math.round(progressValue)}%</span>
					</div>
					<div className="w-full bg-muted h-2 rounded-full overflow-hidden">
						<div
							className={`h-2 rounded-full ${
								ACHIEVEMENT_CATEGORIES[achievement.category]?.color ||
								"bg-primary"
							}`}
							style={{ width: `${progressValue}%` }}
						></div>
					</div>
				</div>
			)}

			<div className="flex justify-between items-center mt-3">
				<div className="flex items-center">
					<Badge
						variant="secondary"
						className={`text-xs ${
							ACHIEVEMENT_CATEGORIES[achievement.category]?.color ||
							"bg-gray-500"
						} text-white`}
					>
						{ACHIEVEMENT_CATEGORIES[achievement.category]?.name ||
							achievement.category}
					</Badge>
					<div className="ml-2 text-sm font-medium text-blue-500">
						+{achievement.xpReward} XP
					</div>
				</div>
				{earned && unlockedAt && (
					<div className="text-xs text-muted-foreground">
						{new Date(unlockedAt).toLocaleDateString()}
					</div>
				)}
			</div>
		</div>
	);
}

export default Achievements;
