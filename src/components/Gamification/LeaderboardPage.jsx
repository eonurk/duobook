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
		{ rank: 1, name: "Sarah P.", score: 15000, change: "up" },
		{ rank: 2, name: "Mike R.", score: 12500, change: "down" },
		{ rank: 3, name: "Lisa T.", score: 11000, change: "same" },
		{ rank: 4, name: "David W.", score: 9500, change: "up" },
		{ rank: 5, name: "Anna B.", score: 8000, change: "same" },
		{ rank: 6, name: "Onur K.", score: 7600, change: "down" },
		{ rank: 7, name: "Cagla L.", score: 7500, change: "up" },
		{ rank: 8, name: "Alex S.", score: 6000, change: "same" },
		{ rank: 9, name: "Maria G.", score: 5800, change: "up" },
		{ rank: 10, name: "John D.", score: 5200, change: "down" },
	],
	monthly: [
		{ rank: 1, name: "Leo Z.", score: 68000, change: "up" },
		{ rank: 2, name: "Maya N.", score: 61000, change: "same" },
		{ rank: 3, name: "Carlos M.", score: 55000, change: "down" },
		{ rank: 4, name: "Grace Y.", score: 49500, change: "up" },
		{ rank: 5, name: "Ryan C.", score: 47000, change: "down" },
		{ rank: 6, name: "Emily F.", score: 44600, change: "same" },
		{ rank: 7, name: "James H.", score: 42500, change: "up" },
		{ rank: 8, name: "Sofia L.", score: 40000, change: "down" },
		{ rank: 9, name: "Nina K.", score: 38800, change: "same" },
		{ rank: 10, name: "Tom S.", score: 36200, change: "up" },
	],
	allTime: [
		{ rank: 1, name: "Isabella R.", score: 285000, change: "same" },
		{ rank: 2, name: "Noah X.", score: 267000, change: "up" },
		{ rank: 3, name: "Ella U.", score: 248000, change: "down" },
		{ rank: 4, name: "Owen I.", score: 221000, change: "same" },
		{ rank: 5, name: "Mia O.", score: 198000, change: "up" },
		{ rank: 6, name: "Victor A.", score: 187000, change: "down" },
		{ rank: 7, name: "Lucas V.", score: 175000, change: "same" },
		{ rank: 8, name: "Zoe Q.", score: 165000, change: "up" },
		{ rank: 9, name: "Max E.", score: 158000, change: "down" },
		{ rank: 10, name: "Aria J.", score: 142000, change: "same" },
	],
};

// Mock current user data - replace with actual user data
const MOCK_CURRENT_USER_RANK = {
	weekly: { rank: 15, name: "Current User", score: 4800, isCurrentUser: true },
	monthly: {
		rank: 12,
		name: "Current User",
		score: 28000,
		isCurrentUser: true,
	},
	allTime: {
		rank: 25,
		name: "Current User",
		score: 95000,
		isCurrentUser: true,
	},
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
	}, [activeTab, currentUser]);

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
			return <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
		if (change === "down")
			return <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
		return <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />;
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
			<div className="space-y-2 sm:space-y-2.5">
				{data.map((entry, index) => {
					const displayName = entry.name
						? formatUserEmailForDisplay(entry.name)
						: "";
					const originalName = entry.name;

					const isCurrentEntryUser =
						currentUserData?.rank === entry.rank &&
						currentUserData?.name === originalName;

					const highlightClass = isCurrentEntryUser
						? "bg-primary/10 border-primary shadow-lg scale-[1.01]"
						: "bg-card hover:bg-muted/50";

					let rankColorClass = "text-slate-600 dark:text-slate-400";
					if (entry.rank === 1) rankColorClass = "text-amber-500 font-bold";
					else if (entry.rank === 2)
						rankColorClass = "text-slate-500 font-semibold";
					else if (entry.rank === 3)
						rankColorClass = "text-orange-500 font-semibold";

					return (
						<Card
							key={entry.rank || index}
							className={`flex items-center p-2 sm:p-3 transition-all duration-300 ease-in-out ${highlightClass} rounded-lg`}
						>
							{/* Rank Section */}
							<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-muted/60 dark:bg-muted/40 rounded-full flex items-center justify-center mr-2 sm:mr-3 relative">
								<span className={`text-lg sm:text-xl ${rankColorClass}`}>
									{entry.rank}
								</span>
								{entry.rank === 1 && (
									<Trophy className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 text-amber-400 absolute -top-1 -right-1 sm:-top-2 sm:-right-2 rotate-12" />
								)}
							</div>

							{/* User Info Section (Avatar, Name, Score) */}
							<div className="flex items-center flex-grow min-w-0 space-x-2 sm:space-x-3">
								<Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-background">
									<AvatarImage
										src={
											entry.avatarUrl ||
											`https://avatar.vercel.sh/${originalName}.png`
										}
										alt={displayName}
									/>
									<AvatarFallback className="text-xs sm:text-sm">
										{originalName ? (
											originalName.substring(0, 2).toUpperCase()
										) : (
											<UserCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
										)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-grow min-w-0">
									<p
										className={`font-semibold text-xs sm:text-sm truncate ${
											isCurrentEntryUser
												? "text-primary"
												: "text-card-foreground"
										}`}
										title={originalName}
									>
										{displayName}
										{isCurrentEntryUser && (
											<span className="ml-1 sm:ml-1.5 text-xs font-normal text-primary/80">
												(You)
											</span>
										)}
									</p>
									<p className="text-xs text-muted-foreground">
										{entry.score?.toLocaleString()} XP
									</p>
								</div>
							</div>

							{/* Rank Change Section */}
							<div className="flex-shrink-0 ml-2 sm:ml-3">
								{renderRankChange(entry.change)}
							</div>
						</Card>
					);
				})}
				{currentUserData && !isCurrentUserInTop && (
					<>
						<div className="text-center my-3 sm:my-4 text-muted-foreground">
							...
						</div>
						<Card
							key="currentUser"
							className="flex items-center p-2 sm:p-3 transition-all duration-300 ease-in-out bg-primary/10 border-primary shadow-lg scale-[1.01] rounded-lg"
						>
							{/* Rank Section */}
							<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-muted/60 dark:bg-muted/40 rounded-full flex items-center justify-center mr-2 sm:mr-3">
								<span
									className={`text-lg sm:text-xl text-slate-600 dark:text-slate-400`}
								>
									{currentUserData.rank}
								</span>
							</div>

							{/* User Info Section (Avatar, Name, Score) */}
							<div className="flex items-center flex-grow min-w-0 space-x-2 sm:space-x-3">
								<Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-background">
									<AvatarImage
										src={
											currentUserData.avatarUrl ||
											`https://avatar.vercel.sh/${currentUserData.name}.png`
										}
										alt={formatUserEmailForDisplay(currentUserData.name)}
									/>
									<AvatarFallback className="text-xs sm:text-sm">
										{currentUserData.name ? (
											currentUserData.name.substring(0, 2).toUpperCase()
										) : (
											<UserCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
										)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-grow min-w-0">
									<p
										className="font-semibold text-xs sm:text-sm text-primary truncate"
										title={currentUserData.name}
									>
										{currentUserData.name
											? formatUserEmailForDisplay(currentUserData.name)
											: ""}
										<span className="ml-1 sm:ml-1.5 text-xs font-normal text-primary/80">
											(You)
										</span>
									</p>
									<p className="text-xs text-muted-foreground">
										{currentUserData.score?.toLocaleString()} XP
									</p>
								</div>
							</div>

							{/* Rank Change Section */}
							<div className="flex-shrink-0 ml-2 sm:ml-3">
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
		<div className="container mx-auto px-4 py-4 sm:py-8">
			<div className="max-w-2xl mx-auto">
				<Card className="shadow-xl">
					<CardHeader className="text-center pb-4 sm:pb-6">
						<div className="flex items-center justify-center mb-2">
							<Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mr-2 sm:mr-3" />
							<CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800">
								Leaderboard
							</CardTitle>
						</div>
						<p className="text-sm sm:text-base text-muted-foreground">
							See who's topping the charts and climb your way up!
						</p>
					</CardHeader>
					<CardContent className="px-3 sm:px-6">
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full rounded-md p-1"
						>
							<TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 bg-muted/50 rounded-md p-1 bg-slate-200">
								<TabsTrigger
									value="weekly"
									className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:hover:bg-muted rounded-sm text-xs sm:text-sm"
								>
									Weekly
								</TabsTrigger>
								<TabsTrigger
									value="monthly"
									className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:hover:bg-muted rounded-sm text-xs sm:text-sm"
								>
									Monthly
								</TabsTrigger>
								<TabsTrigger
									value="allTime"
									className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:hover:bg-muted rounded-sm text-xs sm:text-sm"
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
