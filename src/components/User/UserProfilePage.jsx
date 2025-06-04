import React, { useState, useEffect } from "react";
import {
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider,
	deleteUser,
	GoogleAuthProvider,
	reauthenticateWithPopup,
} from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	getUserProgress,
	getStoryGenerationLimit,
	getStories,
	getUserAchievements,
} from "@/lib/api";
import CookieSettings from "@/components/CookieSettings";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function UserProfilePage() {
	const { currentUser } = useAuth();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);
	const [userProgress, setUserProgress] = useState(null);
	const [storyLimit, setStoryLimit] = useState(null);
	const [userStories, setUserStories] = useState([]);
	const [userAchievements, setUserAchievements] = useState([]);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [languageStats, setLanguageStats] = useState({});

	// State for delete confirmation
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState(null);
	const [reauthPassword, setReauthPassword] = useState(""); // For re-authentication before deletion
	const [authProviderId, setAuthProviderId] = useState(null);

	useEffect(() => {
		if (currentUser) {
			fetchUserData();
			// Determine the auth provider
			if (currentUser.providerData && currentUser.providerData.length > 0) {
				setAuthProviderId(currentUser.providerData[0].providerId);
			}
		}
	}, [currentUser]);

	const fetchUserData = async () => {
		setIsLoadingData(true);
		try {
			// Fetch all user data in parallel
			const [progress, limit, stories, achievements] = await Promise.all([
				getUserProgress(),
				getStoryGenerationLimit(),
				getStories(),
				getUserAchievements(),
			]);

			setUserProgress(progress);
			setStoryLimit(limit);
			setUserStories(stories);
			setUserAchievements(achievements);

			// Calculate language stats from stories
			const langStats = {};
			if (stories && stories.length > 0) {
				stories.forEach((story) => {
					const source = story.sourceLanguage;
					const target = story.targetLanguage;

					if (source) {
						langStats[source] = (langStats[source] || 0) + 1;
					}
					if (target) {
						langStats[target] = (langStats[target] || 0) + 1;
					}
				});
			}
			setLanguageStats(langStats);
		} catch (error) {
			console.error("Error fetching user data:", error);
		} finally {
			setIsLoadingData(false);
		}
	};

	// Get top languages (sorted by count)
	const getTopLanguages = () => {
		return Object.entries(languageStats)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3); // Get top 3
	};

	// Get recent stories (last 5)
	const getRecentStories = () => {
		if (!userStories || userStories.length === 0) return [];

		return [...userStories]
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			.slice(0, 5);
	};

	// Function to get user-friendly subscription name
	const getSubscriptionName = (tier) => {
		if (!tier) return "Free";

		switch (tier) {
			case "PREMIUM":
				return "Premium";
			case "PRO":
				return "Pro";
			case "FREE":
			default:
				return "Free";
		}
	};

	// Function to get subscription badge color
	const getSubscriptionColor = (tier) => {
		if (!tier) return "bg-gray-100 text-gray-800";

		switch (tier) {
			case "PREMIUM":
				return "bg-amber-100 text-amber-800";
			case "PRO":
				return "bg-purple-100 text-purple-800";
			case "FREE":
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (!currentUser) {
		return (
			<div className="flex justify-center items-center h-screen">
				Redirecting...
			</div>
		);
	}

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		if (newPassword !== confirmPassword) {
			setError("New passwords do not match.");
			return;
		}
		if (newPassword.length < 6) {
			setError("New password must be at least 6 characters long.");
			return;
		}
		setIsLoading(true);

		try {
			if (!currentUser.email) {
				throw new Error("User email is not available.");
			}
			const credential = EmailAuthProvider.credential(
				currentUser.email,
				currentPassword
			);
			await reauthenticateWithCredential(currentUser, credential);
			await updatePassword(currentUser, newPassword);

			setSuccessMessage("Password changed successfully.");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err) {
			console.error("Password Change Error:", err);
			if (err.code === "auth/wrong-password") {
				setError("Incorrect current password. Please try again.");
			} else if (err.code === "auth/too-many-requests") {
				setError("Too many attempts. Please try again later.");
			} else {
				setError("Failed to change password. An error occurred.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Format date for display
	const formatDate = (timestamp) => {
		if (!timestamp) return "N/A";
		return format(new Date(timestamp), "MMM d, yyyy");
	};

	// Get completed achievements count
	const getCompletedAchievements = () => {
		if (!userAchievements || !userAchievements.length) return 0;
		return userAchievements.filter((a) => a.completed).length;
	};

	const handleDeleteAccount = async () => {
		if (!currentUser) return;
		setIsDeleting(true);
		setDeleteError(null);

		try {
			// Re-authentication
			if (authProviderId === "password") {
				if (!currentUser.email) {
					throw new Error("User email is not available for re-authentication.");
				}
				if (!reauthPassword) {
					setDeleteError("Password is required to delete your account.");
					setIsDeleting(false);
					return;
				}
				const credential = EmailAuthProvider.credential(
					currentUser.email,
					reauthPassword
				);
				await reauthenticateWithCredential(currentUser, credential);
			} else if (authProviderId === "google.com") {
				const provider = new GoogleAuthProvider();
				await reauthenticateWithPopup(currentUser, provider);
			} else {
				// Handle other OAuth providers if necessary, or throw an error if unsupported
				throw new Error(
					`Unsupported auth provider for re-authentication: ${authProviderId}`
				);
			}

			// Delete user
			await deleteUser(currentUser);
			// Optionally, sign out the user from the client-side if not handled by firebase
			// await auth.signOut(); // If you have auth instance available
			alert("Account deleted successfully."); // Or use a more sophisticated notification
			// Redirect to home page or login page
			window.location.href = "/";
		} catch (err) {
			console.error("Account Deletion Error:", err);
			if (err.code === "auth/wrong-password") {
				setDeleteError(
					"Incorrect password. Please verify your password and try again."
				);
			} else if (err.code === "auth/requires-recent-login") {
				setDeleteError(
					"This operation is sensitive and requires recent authentication. Please log in again before deleting your account."
				);
			} else if (err.code === "auth/too-many-requests") {
				setDeleteError(
					"Too many attempts to re-authenticate. Please try again later."
				);
			} else {
				setDeleteError(
					`Failed to delete account: ${
						err.message || "An unexpected error occurred."
					}`
				);
			}
			setShowDeleteConfirm(true); // Keep dialog open if error occurs
		} finally {
			setIsDeleting(false);
			setReauthPassword(""); // Clear password after attempt
		}
	};

	return (
		<div className="container mx-auto py-10 px-4 flex flex-col items-center gap-6">
			{/* User Info Card */}
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
					<CardDescription>
						Your personal account details and stats
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Account Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Basic Information</h3>
						<div className="space-y-2">
							<Label>Email</Label>
							<p className="text-sm text-muted-foreground">
								{currentUser.email}
							</p>
						</div>

						<div className="space-y-2">
							<Label>Member Since</Label>
							<p className="text-sm text-muted-foreground">
								{currentUser.metadata?.creationTime
									? formatDate(currentUser.metadata.creationTime)
									: "N/A"}
							</p>
						</div>

						<div className="space-y-2">
							<Label>Current Plan</Label>
							{isLoadingData ? (
								<p className="text-sm text-muted-foreground">Loading...</p>
							) : userProgress ? (
								<div className="flex items-center gap-2">
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getSubscriptionColor(
											userProgress.subscriptionTier
										)}`}
									>
										{getSubscriptionName(userProgress.subscriptionTier)}
									</span>
									{userProgress.subscriptionTier === "FREE" && (
										<span className="text-xs text-amber-600 italic ml-2">
											Premium coming soon!
										</span>
									)}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">Free</p>
							)}
						</div>
					</div>

					{/* Learning Stats */}
					<div className="space-y-4 border-t pt-4">
						<h3 className="text-lg font-medium">Learning Stats</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label className="text-sm">Learning Streak</Label>
								<p className="text-xl font-semibold">
									{isLoadingData ? "..." : userProgress?.streak || 0}
									<span className="text-sm font-normal text-muted-foreground ml-1">
										days
									</span>
								</p>
							</div>

							<div className="space-y-1">
								<Label className="text-sm">Current Level</Label>
								<p className="text-xl font-semibold">
									{isLoadingData ? "..." : userProgress?.level || 1}
								</p>
							</div>

							<div className="space-y-1">
								<Label className="text-sm">Total XP</Label>
								<p className="text-xl font-semibold">
									{isLoadingData ? "..." : userProgress?.points || 0}
								</p>
							</div>

							<div className="space-y-1">
								<Label className="text-sm">Stories Created</Label>
								<p className="text-xl font-semibold">
									{isLoadingData ? "..." : userStories?.length || 0}
								</p>
							</div>
						</div>

						{/* Story Limit */}
						<div className="mt-4">
							<Label>Daily Story Generation</Label>
							{isLoadingData ? (
								<p className="text-sm text-muted-foreground">
									Loading limit information...
								</p>
							) : storyLimit ? (
								<div className="flex items-center mt-1">
									{storyLimit.subscriptionTier === "PRO" ? (
										<>
											<div className="w-full bg-gray-200 rounded-full h-2.5">
												<div
													className="bg-purple-600 h-2.5 rounded-full"
													style={{
														width: `${
															(storyLimit.remaining / storyLimit.limit) * 100
														}%`,
													}}
												></div>
											</div>
											<p className="text-sm ml-2">
												{storyLimit.remaining}/{storyLimit.limit} PRO
												generations remaining today
											</p>
										</>
									) : storyLimit.isPremium ? (
										<p className="text-sm">
											Unlimited stories available (Premium)
										</p>
									) : (
										<>
											<div className="w-full bg-gray-200 rounded-full h-2.5">
												<div
													className="bg-blue-600 h-2.5 rounded-full"
													style={{
														width: `${
															(storyLimit.remaining / storyLimit.limit) * 100
														}%`,
													}}
												></div>
											</div>
											<p className="text-sm ml-2">
												{storyLimit.remaining}/{storyLimit.limit} remaining
												today
											</p>
										</>
									)}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									Limit information unavailable
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Language Stats Card */}
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Your Languages</CardTitle>
					<CardDescription>
						Languages you're learning and recent stories
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Top Languages */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Most Used Languages</h3>

						{isLoadingData ? (
							<p className="text-sm text-muted-foreground">
								Loading language data...
							</p>
						) : getTopLanguages().length > 0 ? (
							<div className="space-y-3">
								{getTopLanguages().map(([language, count]) => (
									<div
										key={language}
										className="flex items-center justify-between"
									>
										<span className="font-medium">{language}</span>
										<div className="flex items-center">
											<span className="text-sm text-muted-foreground mr-3">
												{count} {count === 1 ? "story" : "stories"}
											</span>
											<div className="w-24 bg-gray-200 rounded-full h-1.5">
												<div
													className="bg-green-500 h-1.5 rounded-full"
													style={{
														width: `${(count / userStories.length) * 100}%`,
													}}
												></div>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No language data available yet
							</p>
						)}
					</div>

					{/* Recent Stories */}
					<div className="space-y-4 border-t pt-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium">Recent Stories</h3>
							<Link
								to="/my-stories"
								className="text-sm text-blue-600 hover:text-blue-800"
							>
								View all
							</Link>
						</div>

						{isLoadingData ? (
							<p className="text-sm text-muted-foreground">
								Loading stories...
							</p>
						) : getRecentStories().length > 0 ? (
							<div className="space-y-2">
								{getRecentStories().map((story) => (
									<div key={story.id} className="text-sm border rounded-md p-3">
										<div className="font-medium line-clamp-1">
											{story.description}
										</div>
										<div className="flex justify-between text-xs text-muted-foreground mt-1">
											<span>
												{story.sourceLanguage} → {story.targetLanguage}
											</span>
											<span>{formatDate(story.createdAt)}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No stories created yet
							</p>
						)}
					</div>

					{/* Achievements */}
					<div className="space-y-4 border-t pt-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium">Achievements</h3>
							<Link
								to="/achievements"
								className="text-sm text-blue-600 hover:text-blue-800"
							>
								View all
							</Link>
						</div>

						{isLoadingData ? (
							<p className="text-sm text-muted-foreground">
								Loading achievements...
							</p>
						) : userAchievements && userAchievements.length > 0 ? (
							<div className="flex items-center gap-3">
								<div className="bg-amber-50 border border-amber-200 rounded-full p-3 h-16 w-16 flex items-center justify-center">
									<span className="text-xl font-bold text-amber-600">
										{getCompletedAchievements()}
									</span>
								</div>
								<div>
									<p className="font-medium">
										{getCompletedAchievements()} of {userAchievements.length}{" "}
										achievements unlocked
									</p>
									<p className="text-sm text-muted-foreground">
										Keep learning to earn more achievements!
									</p>
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No achievements available yet
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Password Change Card */}
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>Manage your password</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handlePasswordChange} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="currentPassword">Current Password</Label>
							<Input
								id="currentPassword"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newPassword">New Password</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm New Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						{error && <p className="text-sm text-red-600">{error}</p>}
						{successMessage && (
							<p className="text-sm text-green-600">{successMessage}</p>
						)}
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Changing Password..." : "Change Password"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Privacy & Cookie Settings Card */}
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Privacy Settings</CardTitle>
					<CardDescription>Manage your cookie preferences</CardDescription>
				</CardHeader>
				<CardContent>
					<CookieSettings />
				</CardContent>
			</Card>

			{/* Danger Zone - Delete Account Card */}
			<Card className="w-full max-w-md border-red-500">
				<CardHeader>
					<CardTitle className="text-red-600">Danger Zone</CardTitle>
					<CardDescription>
						Manage potentially risky account actions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4 bg-white">
						Deleting your account is permanent and cannot be undone. All your
						data, including stories and progress, will be lost.
					</p>

					<AlertDialog
						open={showDeleteConfirm}
						onOpenChange={setShowDeleteConfirm}
					>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								className="w-full bg-red-600"
								onClick={() => {
									setDeleteError(null); // Clear previous errors
									setShowDeleteConfirm(true);
								}}
							>
								Delete Account
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent className="bg-white">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete
									your account and remove your data from our servers.
									{authProviderId === "password"
										? "Please enter your password to confirm."
										: "To confirm, you may need to sign in with your provider again."}
								</AlertDialogDescription>
							</AlertDialogHeader>
							{authProviderId === "password" && (
								<div className="space-y-2 my-4">
									<Label htmlFor="reauth-password">Password</Label>
									<Input
										id="reauth-password"
										type="password"
										placeholder="Enter your password"
										value={reauthPassword}
										onChange={(e) => setReauthPassword(e.target.value)}
										className={deleteError ? "border-red-500" : ""}
									/>
									{deleteError && (
										<p className="text-sm text-red-500">{deleteError}</p>
									)}
								</div>
							)}
							<AlertDialogFooter>
								<AlertDialogCancel
									onClick={() => {
										setShowDeleteConfirm(false);
										setDeleteError(null);
										setReauthPassword("");
									}}
									disabled={isDeleting}
								>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteAccount}
									disabled={
										isDeleting ||
										(authProviderId === "password" && !reauthPassword)
									}
									className="bg-red-600 hover:bg-red-700"
								>
									{isDeleting ? "Deleting..." : "Delete Account"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>
		</div>
	);
}

export default UserProfilePage;
