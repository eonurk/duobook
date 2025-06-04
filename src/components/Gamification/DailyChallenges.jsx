import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
// Import the function to fetch daily challenges from the API
import { getUserDailyChallenges } from "@/lib/api";
import { Loader2 } from "lucide-react";

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
			} catch (err) {
				console.error("Error fetching daily challenges:", err);
				setError(err.message || "Failed to load daily challenges.");
				setChallenges([]);
			} finally {
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
			case "READ_STORY":
				return "📖";
			case "LEARN_WORDS":
				return "🔤";
			// Add other types as defined in your backend Challenge model
			default:
				return "🎯";
		}
	};

	if (isLoading) {
		return (
			<div className="mt-8 text-center text-muted-foreground">
				<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
				Loading daily challenges...
			</div>
		);
	}

	if (error) {
		return (
			<div className="mt-8 text-center text-red-500">
				Error loading challenges: {error}
			</div>
		);
	}

	return (
		<div className="mt-8">
			<h2 className="text-xl font-bold mb-4">Daily Challenges</h2>

			{challenges.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{challenges.map((userChallenge) => {
						const { challenge, progress, completed } = userChallenge;
						const requiredCount = challenge.requiredCount;
						const progressPercent = requiredCount
							? Math.min(100, (progress / requiredCount) * 100)
							: completed
							? 100
							: 0;

						return (
							<div
								key={userChallenge.id} // Use the UserDailyChallenge ID as key
								className={`bg-card text-card-foreground rounded-lg border shadow-sm p-4 border-l-4 ${
									completed ? "border-green-500 opacity-70" : "border-primary"
								}`}
							>
								<div className="flex items-start">
									<div className="text-2xl mr-3">
										{getChallengeIcon(challenge.type)}
									</div>
									<div className="flex-1">
										<h3 className="font-semibold">{challenge.title}</h3>
										<p className="text-sm text-muted-foreground mb-2">
											{challenge.description}
										</p>

										{requiredCount != null && (
											<div className="w-full bg-muted rounded-full h-1.5 mb-2 ">
												<div
													className={`h-1.5 rounded-full ${
														completed ? "bg-green-500" : "bg-primary"
													}`}
													style={{ width: `${progressPercent}%` }}
												></div>
											</div>
										)}

										<div className="flex justify-between items-center">
											<span className="text-xs text-primary">
												+{challenge.xpReward} points
											</span>
											{completed ? (
												<span className="text-xs text-green-500 flex items-center">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-4 w-4 mr-1"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fillRule="evenodd"
															d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
															clipRule="evenodd"
														/>
													</svg>
													Completed
												</span>
											) : requiredCount != null ? (
												<span className="text-xs text-muted-foreground">
													{progress}/{requiredCount}
												</span>
											) : (
												<span className="text-xs text-muted-foreground">
													Complete the action
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<p className="text-muted-foreground text-center py-4">
					No daily challenges assigned for today. Check back tomorrow!
				</p>
			)}

			{/* Remove completion popup logic */}
			{/* {completedChallenge && ( ... )} */}
		</div>
	);
}

export default DailyChallenges;
