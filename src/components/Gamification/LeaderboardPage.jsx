import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLeaderboardData } from "@/lib/api";
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
	monthly: {
		rank: 1,
		name: "Onur K.",
		score: 65000,
		isCurrentUser: true,
	},
	allTime: {
		rank: 1,
		name: "Onur K.",
		score: 250000,
		isCurrentUser: true,
	},
};

function LeaderboardPage() {
	const { currentUser } = useAuth();
	const [leaderboardData, setLeaderboardData] = useState(MOCK_LEADERBOARD_DATA);
	const [currentUserRank, setCurrentUserRank] = useState(
		MOCK_CURRENT_USER_RANK
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("weekly");

	useEffect(() => {
		const fetchLeaderboard = async (period) => {
			setLoading(true);
			setError(null);
			try {
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
				// Fallback to mock data on error
				setLeaderboardData((prevData) => ({
					...prevData,
					[period]: MOCK_LEADERBOARD_DATA[period] || [],
				}));
				setCurrentUserRank((prevRank) => ({
					...prevRank,
					[period]: MOCK_CURRENT_USER_RANK[period] || null,
				}));
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
			return <ChevronUp className="w-5 h-5 text-green-500 animate-bounce" />;
		if (change === "down")
			return <ChevronDown className="w-5 h-5 text-red-500 animate-pulse" />;
		return <Minus className="w-5 h-5 text-gray-400 opacity-60" />;
	};

	const LeaderboardList = ({ data, currentUserData }) => {
		if (loading && !data.length) {
			return (
				<div className="space-y-4">
					{/* Cool shimmer loading effect */}
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={i}
							className="flex items-center p-4 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 rounded-lg animate-pulse border"
						>
							<div className="w-8 h-8 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full animate-pulse"></div>
							<div className="ml-4 flex-1">
								<div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse mb-2"></div>
								<div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3 animate-pulse"></div>
							</div>
							<div className="w-12 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse"></div>
						</div>
					))}
					<div className="flex justify-center items-center py-6">
						<div className="flex items-center space-x-2">
							<Loader2 className="h-6 w-6 animate-spin text-amber-500" />
							<span className="text-sm text-muted-foreground animate-pulse">
								Loading leaderboard...
							</span>
						</div>
					</div>
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
			<div className="space-y-2.5">
				{data.map((entry, index) => {
					const displayName = entry.name
						? formatUserEmailForDisplay(entry.name)
						: "";
					const originalName = entry.name;

					const isCurrentEntryUser =
						currentUserData?.rank === entry.rank &&
						currentUserData?.name === originalName;

					const highlightClass = isCurrentEntryUser
						? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02] ring-2 ring-amber-400/50"
						: "bg-card hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-lg hover:scale-[1.01] border-slate-200";

					let rankColorClass = "text-slate-600";
					let rankBgClass = "bg-slate-100";

					if (entry.rank === 1) {
						rankColorClass = "text-amber-600 font-bold";
						rankBgClass = "bg-gradient-to-br from-amber-200 to-yellow-300";
					} else if (entry.rank === 2) {
						rankColorClass = "text-slate-600 font-semibold";
						rankBgClass = "bg-gradient-to-br from-slate-200 to-slate-300";
					} else if (entry.rank === 3) {
						rankColorClass = "text-orange-600 font-semibold";
						rankBgClass = "bg-gradient-to-br from-orange-200 to-amber-300";
					}

					return (
						<Card
							key={entry.rank || index}
							className={`flex items-center p-4 transition-all duration-500 ease-out transform ${highlightClass} rounded-xl group hover:shadow-xl border-2`}
						>
							{/* Rank Section */}
							<div
								className={`relative flex-shrink-0 w-14 h-14 ${rankBgClass} rounded-xl flex items-center justify-center mr-4 shadow-md transition-transform duration-300 group-hover:scale-110`}
							>
								<span className={`text-xl ${rankColorClass} relative z-10`}>
									{entry.rank}
								</span>
								{entry.rank === 1 && (
									<div className="absolute -top-2 -right-2 animate-bounce">
										<Trophy className="w-6 h-6 text-amber-500 drop-shadow-lg" />
									</div>
								)}
								{entry.rank === 2 && (
									<div className="absolute -top-1 -right-1">
										<div className="w-3 h-3 bg-slate-400 rounded-full opacity-75"></div>
									</div>
								)}
								{entry.rank === 3 && (
									<div className="absolute -top-1 -right-1">
										<div className="w-3 h-3 bg-orange-400 rounded-full opacity-75"></div>
									</div>
								)}
							</div>

							{/* User Info Section (Avatar, Name, Score) */}
							<div className="flex items-center flex-grow min-w-0 space-x-4">
								<Avatar className="h-12 w-12 flex-shrink-0 border-3 border-white shadow-lg ring-2 ring-slate-200 transition-transform duration-300 group-hover:scale-110">
									<AvatarImage
										src={
											entry.avatarUrl ||
											`https://avatar.vercel.sh/${originalName}.png`
										}
										alt={displayName}
										onError={(e) => {
											// Hide broken images (e.g., Google profile images blocked by CORS)
											// to prevent console errors and show fallback avatar instead
											e.target.style.display = "none";
										}}
									/>
									<AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-semibold">
										{originalName ? (
											originalName.substring(0, 2).toUpperCase()
										) : (
											<UserCircle2 />
										)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-grow min-w-0">
									<p
										className={`font-bold text-base truncate transition-colors duration-300 ${
											isCurrentEntryUser
												? "text-amber-600"
												: "text-slate-800 group-hover:text-slate-900"
										}`}
										title={originalName}
									>
										{displayName}
										{isCurrentEntryUser && (
											<span className="ml-2 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
												YOU
											</span>
										)}
									</p>
									<p className="text-sm text-slate-600 font-medium">
										<span className="inline-flex items-center">
											<span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
											{entry.score?.toLocaleString()} XP
										</span>
									</p>
								</div>
							</div>

							{/* Rank Change Section */}
							<div className="flex-shrink-0 ml-4">
								<div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
									{renderRankChange(entry.change)}
								</div>
							</div>
						</Card>
					);
				})}
				{currentUserData && !isCurrentUserInTop && (
					<>
						<div className="text-center my-6 relative">
							<div className="flex items-center justify-center space-x-2 text-slate-500">
								<div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
								<span className="text-sm font-medium">Your Position</span>
								<div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
							</div>
						</div>
						<Card
							key="currentUser"
							className="flex items-center p-4 transition-all duration-500 ease-out transform bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl scale-[1.02] hover:scale-[1.03] rounded-xl group animate-pulse-gentle"
						>
							{/* Rank Section */}
							<div className="relative flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-xl flex items-center justify-center mr-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
								<span className="text-xl font-bold text-blue-700 relative z-10">
									{currentUserData.rank}
								</span>
								{/* Animated glow effect */}
								<div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-xl animate-pulse"></div>
								{/* Special indicator for current user */}
								<div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-md animate-bounce">
									<div className="absolute inset-1 bg-white rounded-full"></div>
								</div>
							</div>

							{/* User Info Section (Avatar, Name, Score) */}
							<div className="flex items-center flex-grow min-w-0 space-x-4">
								<div className="relative">
									<Avatar className="h-12 w-12 flex-shrink-0 border-3 border-blue-300 shadow-lg transition-all duration-300 group-hover:scale-110 ring-4 ring-blue-100">
										<AvatarImage
											src={
												currentUserData.avatarUrl ||
												`https://avatar.vercel.sh/${currentUserData.name}.png`
											}
											alt={formatUserEmailForDisplay(currentUserData.name)}
											onError={(e) => {
												// Hide broken images (e.g., Google profile images blocked by CORS)
												// to prevent console errors and show fallback avatar instead
												e.target.style.display = "none";
											}}
										/>
										<AvatarFallback className="bg-gradient-to-br from-blue-200 to-indigo-300 text-blue-700 font-bold">
											{currentUserData.name ? (
												currentUserData.name.substring(0, 2).toUpperCase()
											) : (
												<UserCircle2 />
											)}
										</AvatarFallback>
									</Avatar>
									{/* Online status indicator */}
									<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
								</div>
								<div className="flex-grow min-w-0">
									<p
										className="font-bold text-base text-blue-800 truncate transition-colors duration-300 group-hover:text-blue-900"
										title={currentUserData.name}
									>
										{currentUserData.name
											? formatUserEmailForDisplay(currentUserData.name)
											: ""}
										<span className="ml-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text animate-shimmer">
											(YOU)
										</span>
									</p>
									<p className="text-sm text-blue-600 font-semibold">
										<span className="inline-flex items-center">
											<span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mr-2 animate-pulse shadow-sm"></span>
											{currentUserData.score?.toLocaleString()} XP
											<span className="ml-2 text-xs text-blue-500/70">
												• Active
											</span>
										</span>
									</p>
								</div>
							</div>

							{/* Rank Change Section */}
							<div className="flex-shrink-0 ml-4">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-md">
									{currentUserData.change ? (
										renderRankChange(currentUserData.change)
									) : (
										<div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
									)}
								</div>
							</div>
						</Card>
					</>
				)}
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto">
				<Card className="shadow-xl">
					<CardHeader className="text-center">
						<div className="flex items-center justify-center mb-2">
							<Trophy className="w-8 h-8 text-amber-500 mr-3" />
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
							<TabsList className="grid w-full grid-cols-3 mb-8 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-3 shadow-lg border border-slate-200 overflow-visible">
								<TabsTrigger
									value="weekly"
									className="relative !flex !items-center !justify-center !text-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 data-[state=active]:scale-[1.02] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:hover:shadow-md data-[state=inactive]:hover:scale-[1.01] rounded-lg transition-all duration-300 ease-out transform font-semibold min-h-[44px] px-6 mx-1"
								>
									<span className="relative z-10 whitespace-nowrap">
										Weekly
									</span>
								</TabsTrigger>
								<TabsTrigger
									value="monthly"
									className="relative !flex !items-center !justify-center !text-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 data-[state=active]:scale-[1.02] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:hover:shadow-md data-[state=inactive]:hover:scale-[1.01] rounded-lg transition-all duration-300 ease-out transform font-semibold min-h-[44px] mx-1"
								>
									<span className="relative z-10 whitespace-nowrap">
										Monthly
									</span>
								</TabsTrigger>
								<TabsTrigger
									value="allTime"
									className="relative !flex !items-center !justify-center !text-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 data-[state=active]:scale-[1.02] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:hover:shadow-md data-[state=inactive]:hover:scale-[1.01] rounded-lg transition-all duration-300 ease-out transform font-semibold min-h-[44px] px-6 mx-1"
								>
									<span className="relative z-10 whitespace-nowrap">
										All Time
									</span>
								</TabsTrigger>
							</TabsList>
							<TabsContent
								value="weekly"
								className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
							>
								<LeaderboardList
									data={leaderboardData.weekly}
									currentUserData={currentUserRank.weekly}
								/>
							</TabsContent>
							<TabsContent
								value="monthly"
								className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
							>
								<LeaderboardList
									data={leaderboardData.monthly}
									currentUserData={currentUserRank.monthly}
								/>
							</TabsContent>
							<TabsContent
								value="allTime"
								className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
							>
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
