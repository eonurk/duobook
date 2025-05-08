import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
	Loader2,
	Gem,
	Star,
	Award,
	Target,
	BookOpen,
	BarChart,
	Filter,
} from "lucide-react";
import DailyChallenges from "../Gamification/DailyChallenges";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getStories } from "@/lib/api";
import Achievements, {
	ACHIEVEMENTS,
	AchievementDetail,
} from "../Gamification/Achievements";
import AchievementProgress from "../Gamification/AchievementProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

function UserProgressDashboard() {
	const { userProgress, userAchievements, loading } = useAuth();
	const [userStories, setUserStories] = useState([]);
	const [isLoadingStories, setIsLoadingStories] = useState(false);

	useEffect(() => {
		// Fetch stories for analytics
		const fetchStories = async () => {
			setIsLoadingStories(true);
			try {
				const stories = await getStories();
				setUserStories(stories || []);
			} catch (error) {
				console.error("Error fetching stories:", error);
			} finally {
				setIsLoadingStories(false);
			}
		};

		fetchStories();
	}, []);

	const calculateLevelProgress = (level, points) => {
		if (!level || level < 1) level = 1;
		if (!points || points < 0) points = 0;

		const pointsForLevel = (lvl) => {
			if (lvl <= 1) return 0;
			// Sum formula: n*(n+1)/2 -> (lvl-1)*lvl/2 * 100
			return (((lvl - 1) * lvl) / 2) * 100;
		};

		const currentLevelBasePoints = pointsForLevel(level);
		const nextLevelBasePoints = pointsForLevel(level + 1);
		const pointsNeededForNextLevel =
			nextLevelBasePoints - currentLevelBasePoints; // This is level * 100
		const pointsInCurrentLevel = points - currentLevelBasePoints;

		if (pointsNeededForNextLevel <= 0)
			return {
				percentage: 100,
				pointsInCurrentLevel:
					pointsInCurrentLevel > 0 ? pointsInCurrentLevel : 0,
				pointsNeededForNextLevel: 0,
			}; // Avoid division by zero if logic is flawed or level maxed out

		const progressPercentage = Math.max(
			0,
			Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100)
		);

		return {
			percentage: progressPercentage,
			pointsInCurrentLevel: Math.max(0, pointsInCurrentLevel), // Ensure no negative points displayed
			pointsNeededForNextLevel: pointsNeededForNextLevel,
		};
	};

	if (loading || isLoadingStories) {
		return (
			<div className="container mx-auto p-8 text-center">
				<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
				Loading progress data...
			</div>
		);
	}

	if (!userProgress) {
		return (
			<div className="container mx-auto p-8 text-center text-muted-foreground">
				Could not load progress data.
			</div>
		);
	}

	const currentLevel = userProgress.level || 1;
	const currentPoints = userProgress.points || 0;
	const progressInfo = calculateLevelProgress(currentLevel, currentPoints);

	return (
		<div className="container mx-auto p-4 space-y-6">
			<h1 className="text-3xl font-bold mb-6 text-center">
				Your Learning Journey
			</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Points
						</CardTitle>
						<Gem className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-primary">
							{currentPoints}
						</div>
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
						<div className="text-2xl font-bold text-primary">
							{currentLevel}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{progressInfo.pointsNeededForNextLevel > 0
								? `${
										progressInfo.pointsNeededForNextLevel -
										progressInfo.pointsInCurrentLevel
								  } points to Level ${currentLevel + 1}`
								: "Max level reached!"}
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold">
						Level {currentLevel} Progress
					</CardTitle>
				</CardHeader>
				<CardContent className="pb-2">
					{/* Super visible progress bar with img fallback */}
					<div className="relative w-full h-5 bg-gray-200 dark:bg-gray-800 rounded-md mb-4 overflow-hidden">
						{/* Gradient background for the progress */}
						<div
							className="absolute left-0 top-0 bottom-0 flex items-center rounded-l-md"
							style={{
								width: `${
									progressInfo.percentage <= 0
										? 2
										: Math.max(5, progressInfo.percentage)
								}%`,
								background: "rgb(59, 130, 246)",
								boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)",
							}}
						>
							{/* Show percentage text if there's enough space */}
							{progressInfo.percentage >= 10 && (
								<span className="text-xs font-bold text-white px-2 z-10">
									{Math.round(progressInfo.percentage)}%
								</span>
							)}
						</div>

						{/* Border to ensure visibility */}
						<div className="absolute inset-0 border border-gray-300 dark:border-gray-600 rounded-md pointer-events-none"></div>
					</div>

					<div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm font-medium">
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
							<span>{progressInfo.pointsInCurrentLevel} XP earned</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
							<span>
								{progressInfo.pointsNeededForNextLevel -
									progressInfo.pointsInCurrentLevel}{" "}
								XP to Level {currentLevel + 1}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Learning Analytics Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-semibold">
						Language Learning Analytics
					</CardTitle>
					<BarChart className="h-5 w-5 text-muted-foreground" />
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Word Count Stats */}
					<div className="space-y-4">
						<h3 className="text-md font-medium">Vocabulary Progress</h3>

						{userStories.length > 0 ? (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div className="border rounded-lg p-3 bg-background/50">
									<div className="text-sm text-muted-foreground mb-1">
										Words Encountered
									</div>
									<div className="text-xl font-semibold">
										{Math.floor(
											userStories.reduce((total, story) => {
												// Estimate 20 words per sentence pair
												const storyContent = JSON.parse(
													story.story || '{"sentencePairs":[]}'
												);
												return (
													total + (storyContent.sentencePairs?.length || 0) * 20
												);
											}, 0)
										).toLocaleString()}
									</div>
								</div>

								<div className="border rounded-lg p-3 bg-background/50">
									<div className="text-sm text-muted-foreground mb-1">
										Vocabulary Items
									</div>
									<div className="text-xl font-semibold">
										{Math.floor(
											userStories.reduce((total, story) => {
												const storyContent = JSON.parse(
													story.story || '{"vocabulary":[]}'
												);
												return total + (storyContent.vocabulary?.length || 0);
											}, 0)
										).toLocaleString()}
									</div>
								</div>

								<div className="border rounded-lg p-3 bg-background/50">
									<div className="text-sm text-muted-foreground mb-1">
										Avg Words per Story
									</div>
									<div className="text-xl font-semibold">
										{userStories.length > 0
											? Math.floor(
													userStories.reduce((total, story) => {
														const storyContent = JSON.parse(
															story.story || '{"sentencePairs":[]}'
														);
														return (
															total +
															(storyContent.sentencePairs?.length || 0) * 20
														);
													}, 0) / userStories.length
											  )
											: 0}
									</div>
								</div>

								<div className="border rounded-lg p-3 bg-background/50">
									<div className="text-sm text-muted-foreground mb-1">
										New Words per Day
									</div>
									<div className="text-xl font-semibold">
										{userStories.length > 0 && userProgress?.streak > 0
											? Math.floor(
													userStories.reduce((total, story) => {
														const storyContent = JSON.parse(
															story.story || '{"vocabulary":[]}'
														);
														return (
															total + (storyContent.vocabulary?.length || 0)
														);
													}, 0) / Math.max(1, userProgress?.streak || 1)
											  )
											: 0}
									</div>
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								Create your first story to see vocabulary statistics
							</p>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
						{/* Difficulty Distribution */}
						<div className="space-y-3">
							<h3 className="text-md font-medium">Difficulty Distribution</h3>

							{userStories.length > 0 ? (
								<>
									{(() => {
										// Calculate difficulty distribution
										const difficultyCount = {
											Beginner: 0,
											Intermediate: 0,
											Advanced: 0,
										};

										userStories.forEach((story) => {
											if (story.difficulty) {
												difficultyCount[story.difficulty] =
													(difficultyCount[story.difficulty] || 0) + 1;
											}
										});

										const totalStories = userStories.length;

										return (
											<div className="space-y-3">
												{Object.entries(difficultyCount).map(
													([difficulty, count]) => (
														<div
															key={difficulty}
															className="flex items-center justify-between"
														>
															<span className="font-medium text-sm">
																{difficulty}
															</span>
															<div className="flex items-center">
																<span className="text-xs text-muted-foreground mr-3">
																	{count} {count === 1 ? "story" : "stories"}
																</span>
																<div className="w-24 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
																	<div
																		className={`h-1.5 rounded-full ${
																			difficulty === "Beginner"
																				? "bg-green-500"
																				: difficulty === "Intermediate"
																				? "bg-yellow-500"
																				: "bg-red-500"
																		}`}
																		style={{
																			width: `${
																				totalStories
																					? (count / totalStories) * 100
																					: 0
																			}%`,
																		}}
																	></div>
																</div>
															</div>
														</div>
													)
												)}
											</div>
										);
									})()}
								</>
							) : (
								<p className="text-sm text-muted-foreground">
									No difficulty data available yet
								</p>
							)}
						</div>

						{/* Activity Heatmap */}
						<div className="space-y-3">
							<h3 className="text-md font-medium">Learning Activity</h3>

							{userStories.length > 0 ? (
								<>
									{(() => {
										// Create weekly activity summary
										const dayNames = [
											"Sun",
											"Mon",
											"Tue",
											"Wed",
											"Thu",
											"Fri",
											"Sat",
										];
										const activityByDay = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday

										// Process story dates to count by day of week
										userStories.forEach((story) => {
											if (story.createdAt) {
												const storyDate = new Date(story.createdAt);
												const dayOfWeek = storyDate.getDay(); // 0-6
												activityByDay[dayOfWeek]++;
											}
										});

										// Calculate max for scaling
										const maxActivity = Math.max(...activityByDay, 1);

										return (
											<div>
												<div className="flex items-center justify-between mt-2 mb-2">
													<div className="text-xs text-muted-foreground">
														Day
													</div>
													<div className="text-xs text-muted-foreground">
														Stories
													</div>
												</div>

												<div className="space-y-2">
													{dayNames.map((day, index) => (
														<div key={day} className="flex items-center">
															<div className="w-8 text-xs text-muted-foreground">
																{day}
															</div>
															<div className="flex-1 mx-2">
																<div className="bg-gray-200 rounded-full h-2 dark:bg-gray-700">
																	<div
																		className="bg-blue-600 h-2 rounded-full"
																		style={{
																			width: `${
																				(activityByDay[index] / maxActivity) *
																				100
																			}%`,
																		}}
																	></div>
																</div>
															</div>
															<div className="w-5 text-xs text-muted-foreground">
																{activityByDay[index]}
															</div>
														</div>
													))}
												</div>
											</div>
										);
									})()}
								</>
							) : (
								<p className="text-sm text-muted-foreground">
									No activity data available yet
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Proficiency Estimate */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-semibold">
						Estimated Proficiency
					</CardTitle>
					<BookOpen className="h-5 w-5 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					{userStories.length > 0 && userProgress ? (
						<div className="space-y-4">
							{(() => {
								// Very simple CEFR level estimate based on stories, level and difficulty
								const storyCount = userStories.length;
								const userLevel = userProgress?.level || 1;

								// Count advanced stories
								const advancedStories = userStories.filter(
									(s) => s.difficulty === "Advanced"
								).length;

								// Get primary target language (most used)
								const targetLanguages = {};
								userStories.forEach((story) => {
									if (story.targetLanguage) {
										targetLanguages[story.targetLanguage] =
											(targetLanguages[story.targetLanguage] || 0) + 1;
									}
								});

								const primaryLanguage =
									Object.entries(targetLanguages).sort(
										(a, b) => b[1] - a[1]
									)[0]?.[0] || "Unknown";

								// Simple algorithm for CEFR estimate
								let cefrLevel = "A1"; // Default starting level

								if (storyCount >= 50 && userLevel >= 15) {
									cefrLevel = "C1";
								} else if (
									storyCount >= 30 &&
									userLevel >= 10 &&
									advancedStories >= 10
								) {
									cefrLevel = "B2";
								} else if (
									storyCount >= 20 &&
									userLevel >= 7 &&
									advancedStories >= 5
								) {
									cefrLevel = "B1";
								} else if (storyCount >= 10 && userLevel >= 5) {
									cefrLevel = "A2";
								}

								// CEFR descriptions
								const cefrDescriptions = {
									A1: "Beginner - Basic words and phrases",
									A2: "Elementary - Simple, routine exchanges",
									B1: "Intermediate - Independent in familiar situations",
									B2: "Upper Intermediate - Effective interaction on various topics",
									C1: "Advanced - Fluent expression with nuance",
									C2: "Proficient - Near-native level mastery",
								};

								return (
									<>
										<div className="flex flex-col sm:flex-row sm:items-center gap-4">
											<div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 h-20 w-20 flex items-center justify-center mx-auto sm:mx-0">
												<span className="text-2xl font-bold text-white">
													{cefrLevel}
												</span>
											</div>
											<div className="text-center sm:text-left">
												<p className="font-medium">{primaryLanguage}</p>
												<p className="text-sm text-muted-foreground">
													{cefrDescriptions[cefrLevel]}
												</p>
											</div>
										</div>

										<div className="relative pt-3">
											<div className="flex justify-between text-xs text-muted-foreground mb-1">
												<span>A1</span>
												<span>A2</span>
												<span>B1</span>
												<span>B2</span>
												<span>C1</span>
												<span>C2</span>
											</div>
											<div className="bg-gray-200 rounded-full h-2 dark:bg-gray-700">
												<div
													className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
													style={{
														width: `${
															cefrLevel === "A1"
																? 16.6
																: cefrLevel === "A2"
																? 33.2
																: cefrLevel === "B1"
																? 49.8
																: cefrLevel === "B2"
																? 66.4
																: cefrLevel === "C1"
																? 83
																: 100
														}%`,
													}}
												></div>
											</div>
										</div>

										<p className="text-xs text-muted-foreground text-center mt-3">
											This is an estimate based on your activity and might not
											reflect your actual proficiency level.
										</p>
									</>
								);
							})()}
						</div>
					) : (
						<p className="text-sm text-muted-foreground text-center py-8">
							Create stories to get a proficiency estimate
						</p>
					)}
				</CardContent>
			</Card>

			{/* Updated Achievements Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-semibold">Achievements</CardTitle>
					<Award className="h-5 w-5 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="earned">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
							<TabsList className="w-full sm:w-auto">
								<TabsTrigger value="earned">
									Earned ({userAchievements?.length || 0})
								</TabsTrigger>
								<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
								<TabsTrigger value="all">
									All ({ACHIEVEMENTS.length})
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="earned">
							{userAchievements && userAchievements.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{userAchievements.map((userAch) => (
										<AchievementDetail
											key={userAch.id}
											achievement={userAch.achievement}
											earned={true}
											unlockedAt={userAch.unlockedAt}
										/>
									))}
								</div>
							) : (
								<div className="text-center py-4 text-muted-foreground">
									<p className="mb-1">No achievements unlocked yet.</p>
									<p className="text-sm">
										Complete stories and challenges to earn them!
									</p>
								</div>
							)}
						</TabsContent>

						<TabsContent value="upcoming">
							<AchievementProgress />
						</TabsContent>

						<TabsContent value="all">
							<Achievements
								userProgress={userProgress}
								userAchievements={userAchievements}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-semibold">
						Daily Challenges
					</CardTitle>
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
