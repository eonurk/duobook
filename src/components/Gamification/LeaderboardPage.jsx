import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLeaderboardData } from "@/lib/api"; // We'll need to create this API function
import {
	Loader2,
	Trophy,
	UserCircle2,
	ChevronUp,
	ChevronDown,
	Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming you have an Avatar component

// Mock data for now - replace with API call
const MOCK_LEADERBOARD_DATA = {
	weekly: [
		{ rank: 1, name: "Onur K.", score: 15000, change: "up" },
		{ rank: 2, name: "Cagla L.", score: 12500, change: "down" },
		{ rank: 3, name: "Alex S.", score: 11000, change: "same" },
		{ rank: 4, name: "User B.", score: 9500, change: "up" },
		{ rank: 5, name: "User C.", score: 8000, change: "same" },
		{ rank: 6, name: "User D.", score: 7600, change: "down" },
		{ rank: 7, name: "User E.", score: 7500, change: "up" },
		{ rank: 8, name: "User F.", score: 6000, change: "same" },
		{ rank: 9, name: "User G.", score: 5800, change: "up" },
		{ rank: 10, name: "User H.", score: 5200, change: "down" },
	],
	monthly: [
		{ rank: 1, name: "Onur K.", score: 65000, change: "up" },
		{ rank: 2, name: "Cagla L.", score: 58000, change: "same" },
		{ rank: 3, name: "Alex S.", score: 51000, change: "down" },
		// ... more users
	],
	allTime: [
		{ rank: 1, name: "Onur K.", score: 250000, change: "same" },
		{ rank: 2, name: "Cagla L.", score: 230000, change: "same" },
		{ rank: 3, name: "Alex S.", score: 200000, change: "same" },
		// ... more users
	],
};

// Mock current user data - replace with actual user data
const MOCK_CURRENT_USER_RANK = {
	weekly: { rank: 1, name: "Onur K.", score: 15000, isCurrentUser: true },
	monthly: { rank: 1, name: "Onur K.", score: 65000, isCurrentUser: true },
	allTime: { rank: 1, name: "Onur K.", score: 250000, isCurrentUser: true },
};

function LeaderboardPage() {
	const { currentUser } = useAuth();
	const [leaderboardData, setLeaderboardData] = useState(MOCK_LEADERBOARD_DATA); // Use mock data initially
	const [currentUserRank, setCurrentUserRank] = useState(
		MOCK_CURRENT_USER_RANK
	); // Use mock data
	const [loading, setLoading] = useState(false); // Set to true when fetching real data
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("weekly");

	useEffect(() => {
		// TODO: Replace with actual API call
		const fetchLeaderboard = async (period) => {
			setLoading(true);
			setError(null);
			try {
				// Use currentUser.uid if available, otherwise pass null/undefined
				const userId = currentUser ? currentUser.uid : null;
				const data = await getLeaderboardData(period, userId);
				setLeaderboardData((prevData) => ({
					...prevData,
					[period]: data.topUsers || [],
				}));
				setCurrentUserRank((prevRank) => ({
					...prevRank,
					[period]: data.currentUserRank || null,
				}));
			} catch (err) {
				setError(err.message || "Failed to load leaderboard.");
				console.error("Error fetching leaderboard:", err);
				// Clear data for the current tab on error to avoid showing stale data
				setLeaderboardData((prevData) => ({ ...prevData, [period]: [] }));
				setCurrentUserRank((prevRank) => ({ ...prevRank, [period]: null }));
			}
			setLoading(false);
		};
		fetchLeaderboard(activeTab);
	}, [
		activeTab,
		currentUser,
		getLeaderboardData,
		setCurrentUserRank,
		setLeaderboardData,
		setLoading,
		setError,
	]);

	const formatUserEmailForDisplay = (email) => {
		if (!email || !email.includes("@")) {
			return email; // Return as is if not a valid email format or null/undefined
		}
		const localPart = email.split("@")[0];
		if (localPart.length <= 2) {
			return localPart; // Return just the local part if it's too short to abbreviate
		}
		return `${localPart[0]}...${localPart[localPart.length - 1]}`;
	};

	const renderRankChange = (change) => {
		if (change === "up")
			return <ChevronUp className="w-4 h-4 text-green-500" />;
		if (change === "down")
			return <ChevronDown className="w-4 h-4 text-red-500" />;
		return <Minus className="w-4 h-4 text-gray-400" />;
	};

	const LeaderboardList = ({ data, currentUserData }) => {
		if (loading && !data.length) {
			return (
				<div className="flex justify-center items-center py-10">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			);
		}

		if (error) {
			return <p className="text-center text-red-500 py-10">{error}</p>;
		}

		if (!data.length) {
			return (
				<p className="text-center text-muted-foreground py-10">
					No leaderboard data available yet. Be the first!
				</p>
			);
		}

		const isCurrentUserInTop = data.some(
			(entry) =>
				entry.name === currentUserData?.name &&
				entry.score === currentUserData?.score
		);

		return (
			<div className="space-y-3">
				{data.map((entry, index) => {
					const displayName = entry.name
						? formatUserEmailForDisplay(entry.name)
						: "";
					const originalName = entry.name; // for comparisons and avatar generation

					const isCurrentEntryUser =
						currentUserData?.rank === entry.rank &&
						currentUserData?.name === originalName;

					const highlightClass = isCurrentEntryUser
						? "bg-primary/10 border-primary shadow-md"
						: "bg-card hover:bg-muted/50";

					let rankColorClass = "text-muted-foreground";
					if (entry.rank === 1) rankColorClass = "text-amber-500";
					else if (entry.rank === 2) rankColorClass = "text-slate-400";
					else if (entry.rank === 3) rankColorClass = "text-orange-400";

					return (
						<Card
							key={entry.rank || index}
							className={`flex items-center p-3 sm:p-4 justify-between transition-all duration-300 ${highlightClass}`}
						>
							<div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
								{" "}
								{/* Left part - flex-1 and min-w-0 for proper shrinking/growing */}
								{/* Rank Display */}
								<div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
									<span className={`text-lg font-bold ${rankColorClass}`}>
										{entry.rank}
									</span>
									{entry.rank === 1 && (
										<Trophy className="w-4 h-4 sm:w-5 sm:h-5 ml-1 text-amber-500" />
									)}
								</div>
								{/* Avatar */}
								<Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
									<AvatarImage
										src={
											entry.avatarUrl ||
											`https://avatar.vercel.sh/${originalName}.png`
										}
										alt={displayName}
									/>
									<AvatarFallback>
										{originalName ? (
											originalName.substring(0, 2).toUpperCase()
										) : (
											<UserCircle2 />
										)}
									</AvatarFallback>
								</Avatar>
								{/* Name */}
								<div className="flex-grow min-w-0">
									<p
										className={`font-semibold text-sm sm:text-base truncate ${
											isCurrentEntryUser
												? "text-primary"
												: "text-card-foreground"
										}`}
										title={originalName}
									>
										{displayName}
										{isCurrentEntryUser && (
											<span className="ml-1.5 text-xs font-normal text-primary/90">
												(You)
											</span>
										)}
									</p>
								</div>
							</div>

							{/* Right Part: Score and Rank Change */}
							<div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2 sm:ml-3">
								<span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
									{entry.score?.toLocaleString()} XP
								</span>
								{renderRankChange(entry.change)}
							</div>
						</Card>
					);
				})}
				{currentUserData && !isCurrentUserInTop && (
					<>
						<div className="text-center my-4 text-muted-foreground">...</div>
						<Card
							key="currentUser"
							className="flex items-center p-3 sm:p-4 justify-between transition-all duration-300 bg-primary/10 border-primary shadow-md"
						>
							<div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
								{/* Rank Display */}
								<div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
									<span className="text-lg font-bold text-muted-foreground">
										{currentUserData.rank}
									</span>
								</div>

								{/* Avatar */}
								<Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
									<AvatarImage
										src={
											currentUserData.avatarUrl ||
											`https://avatar.vercel.sh/${currentUserData.name}.png`
										}
										alt={formatUserEmailForDisplay(currentUserData.name)}
									/>
									<AvatarFallback>
										{currentUserData.name ? (
											currentUserData.name.substring(0, 2).toUpperCase()
										) : (
											<UserCircle2 />
										)}
									</AvatarFallback>
								</Avatar>

								{/* Name */}
								<div className="flex-grow min-w-0">
									<p
										className="font-semibold text-sm sm:text-base text-primary truncate"
										title={currentUserData.name}
									>
										{currentUserData.name
											? formatUserEmailForDisplay(currentUserData.name)
											: ""}
										<span className="ml-1.5 text-xs font-normal text-primary/90">
											(You)
										</span>
									</p>
								</div>
							</div>
							{/* Right Part: Score and Rank Change (current user might not have 'change') */}
							<div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2 sm:ml-3">
								<span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
									{currentUserData.score?.toLocaleString()} XP
								</span>
								{/* Optional: Render rank change if available for current user, e.g., currentUserData.change */}
								{currentUserData.change &&
									renderRankChange(currentUserData.change)}
							</div>
						</Card>
					</>
				)}
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-3xl mx-auto">
				<Card className="shadow-xl">
					<CardHeader className="text-center">
						<div className="flex items-center justify-center mb-2">
							<Trophy className="w-10 h-10 text-amber-500 mr-3" />
							<CardTitle className="text-3xl font-bold text-gray-800">
								Leaderboard
							</CardTitle>
						</div>
						<p className="text-muted-foreground">
							See who's topping the charts and climb your way up!
						</p>
					</CardHeader>
					<CardContent>
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-md p-1">
								<TabsTrigger
									value="weekly"
									className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted rounded-sm"
								>
									Weekly
								</TabsTrigger>
								<TabsTrigger
									value="monthly"
									className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted rounded-sm"
								>
									Monthly
								</TabsTrigger>
								<TabsTrigger
									value="allTime"
									className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted rounded-sm"
								>
									All Time
								</TabsTrigger>
							</TabsList>
							<TabsContent value="weekly">
								<LeaderboardList
									data={leaderboardData.weekly}
									currentUserData={currentUserRank.weekly}
								/>
							</TabsContent>
							<TabsContent value="monthly">
								<LeaderboardList
									data={leaderboardData.monthly}
									currentUserData={currentUserRank.monthly}
								/>
							</TabsContent>
							<TabsContent value="allTime">
								<LeaderboardList
									data={leaderboardData.allTime}
									currentUserData={currentUserRank.allTime}
								/>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default LeaderboardPage;

// Note:
// - You'll need to create the `getLeaderboardData` function in `src/lib/api.js`.
//   This function should fetch leaderboard data for a given period (e.g., 'weekly', 'monthly', 'allTime')
//   and optionally include the current user's rank if a user ID is provided.
// - The backend will need an endpoint to serve this data, calculating ranks based on XP or other metrics.
// - Avatar component (`@/components/ui/avatar`) is assumed to exist. If not, you might need to create or install it.
// - The `change` property in mock data (up, down, same) indicates rank movement, which your backend would need to calculate.
