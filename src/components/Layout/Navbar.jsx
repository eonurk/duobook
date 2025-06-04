import React, { useState, useEffect, useCallback, forwardRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig"; // Use alias
import { useAuth } from "@/context/AuthContext"; // Use alias
import { Button } from "@/components/ui/button"; // Import shadcn Button
import AuthDialog from "@/components/Auth/AuthDialog";
import { Flame, Star, Sparkles, Menu, X, BookOpen, Trophy } from "lucide-react"; // Added BookOpen icon and Trophy icon
import { getStoryGenerationLimit } from "@/lib/api"; // Import the API function
import { trackAuth } from "@/lib/analytics"; // Import analytics tracking

const Navbar = forwardRef(function Navbar(props, ref) {
	const { currentUser, userProgress } = useAuth();
	const navigate = useNavigate();
	const location = useLocation(); // Get location object
	const [showAuthDialog, setShowAuthDialog] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
	const [storyLimit, setStoryLimit] = useState(null); // New state for story generation limit
	const [activeTab, setActiveTab] = useState("login");

	// Function to fetch story generation limit - converted to useCallback
	const fetchStoryLimit = useCallback(async () => {
		try {
			const limitData = await getStoryGenerationLimit();
			setStoryLimit(limitData);
		} catch (error) {
			console.error("Error fetching story limit:", error);
			// Default to null, which won't display the limit
		}
	}, []);

	// Expose the fetchStoryLimit function via ref
	React.useImperativeHandle(ref, () => ({
		fetchStoryLimit,
		refreshStoryLimit: fetchStoryLimit, // Alias for better clarity
	}));

	// Fetch story generation limit when user is logged in
	useEffect(() => {
		if (currentUser) {
			fetchStoryLimit();

			// Add a polling mechanism to refresh limit data periodically
			const intervalId = setInterval(() => {
				fetchStoryLimit();
			}, 60000); // Refresh every minute

			return () => clearInterval(intervalId);
		}
	}, [currentUser, fetchStoryLimit]);

	// Helper function to calculate level progress
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

		if (pointsNeededForNextLevel <= 0) return 100; // Avoid division by zero if logic is flawed or level maxed out

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

	const progressInfo = userProgress
		? calculateLevelProgress(userProgress.level, userProgress.points)
		: { percentage: 0, pointsInCurrentLevel: 0, pointsNeededForNextLevel: 100 }; // Default if no progress

	const handleLogout = async () => {
		try {
			await signOut(auth);
			setIsMobileMenuOpen(false); // Close mobile menu on logout
			navigate("/"); // Navigate to home/login page after logout
			trackAuth("logout"); // Track logout event
		} catch (err) {
			console.error("Logout Error:", err);
			// Optionally show an error message to the user using toast
		}
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const handleAuthClick = (tab) => {
		closeMobileMenu();
		setActiveTab(tab);
		setShowAuthDialog(true);
	};

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
				<div className="flex h-16 items-center justify-between px-4">
					<div className="flex items-center">
						<Link
							to="/"
							className="font-bold text-lg tracking-tight text-primary"
						>
							DuoBook
						</Link>
					</div>
					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-4 ml-auto">
						{currentUser ? (
							<>
								<div className="hidden md:flex items-center space-x-4 border-r pr-4 mr-2">
									<div
										className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
										title={`${userProgress?.streak || 0} Day Streak`}
									>
										<Flame className="h-4 w-4 mr-1 text-orange-400" />
										<span className="text-sm font-medium">
											{userProgress?.streak || 0}
										</span>
									</div>
									{/* Level Display without Progress */}
									<div
										className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
										title={`Level ${userProgress?.level || 1} (${
											progressInfo.pointsInCurrentLevel
										} / ${progressInfo.pointsNeededForNextLevel} points)`}
									>
										<Star className="h-4 w-4 mr-1 text-yellow-400" />
										<span className="text-sm font-medium">
											{userProgress?.level || 1}
										</span>
									</div>
									{/* Points Display */}
									<div
										className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
										title={`${
											userProgress?.points || 0
										} Total Experience Points`}
									>
										<Sparkles className="h-4 w-4 mr-1 text-teal-400" />
										<span className="text-sm font-medium">
											{userProgress?.points || 0}
										</span>
									</div>
									{/* Story Generation Limit */}
									{storyLimit && (
										<div
											className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
											title={
												storyLimit.subscriptionTier === "PRO"
													? `${storyLimit.remaining} of ${storyLimit.limit} PRO story generations remaining today.`
													: storyLimit.isPremium
													? "Premium users have unlimited story generations"
													: `${storyLimit.remaining} of ${storyLimit.limit} story generations remaining today. Premium coming soon!`
											}
										>
											<BookOpen className="h-4 w-4 mr-1 text-blue-400" />
											<span className="text-sm font-medium">
												{storyLimit.subscriptionTier === "PRO"
													? `${storyLimit.remaining}/${storyLimit.limit}`
													: storyLimit.isPremium
													? "∞"
													: `${storyLimit.remaining}/${storyLimit.limit}`}
											</span>
										</div>
									)}
								</div>
								<Button
									variant="link"
									size="sm"
									asChild
									className={`px-0 ${
										location.pathname === "/progress"
											? "text-primary font-semibold"
											: "text-foreground/70 hover:text-foreground"
									}`}
								>
									<Link to="/progress">Progress</Link>
								</Button>
								<Button
									variant="link"
									size="sm"
									asChild
									className={`px-0 ${
										location.pathname === "/my-stories"
											? "text-primary font-semibold"
											: "text-foreground/70 hover:text-foreground"
									}`}
								>
									<Link to="/my-stories">My Stories</Link>
								</Button>
								<Button
									variant="link"
									size="sm"
									asChild
									className={`px-0 ${
										location.pathname === "/explore-stories"
											? "text-primary font-semibold"
											: "text-foreground/70 hover:text-foreground"
									}`}
								>
									<Link to="/explore-stories">Explore</Link>
								</Button>
								<Button
									variant="link"
									size="sm"
									asChild
									className={`px-0 ${
										location.pathname === "/practice"
											? "text-primary font-semibold"
											: "text-foreground/70 hover:text-foreground"
									}`}
								>
									<Link to="/practice">Practice</Link>
								</Button>
								<Button
									variant="link"
									size="sm"
									asChild
									className={`px-0 ${
										location.pathname === "/leaderboard"
											? "text-primary font-semibold"
											: "text-amber-500"
									}`}
								>
									<Link to="/leaderboard">
										Leaderboard
										<Trophy className="h-4 w-4 mr-1" />
									</Link>
								</Button>
								<Button
									variant="outline"
									size="sm"
									asChild
									className={`${
										location.pathname === "/profile"
											? "ring-2 ring-ring ring-offset-2"
											: ""
									}`}
								>
									<Link to="/profile">Profile</Link>
								</Button>
								<Button variant="ghost" size="sm" onClick={handleLogout}>
									Logout
								</Button>
							</>
						) : (
							<>
								{/* Enhanced navigation for non-logged-in users */}
								<Button
									variant="link"
									size="sm"
									asChild
									className="px-0 text-foreground/70 hover:text-foreground"
								>
									<Link to="/explore-stories">Explore Stories</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleAuthClick("login")}
									className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-200"
								>
									Sign In
								</Button>
								<Button
									variant="default"
									size="sm"
									onClick={() => handleAuthClick("signup")}
									className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
								>
									Get Started
								</Button>
							</>
						)}
					</nav>
					{/* Mobile Menu Button */}
					<div className="md:hidden ml-auto">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleMobileMenu}
							aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
							aria-expanded={isMobileMenuOpen}
						>
							{isMobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Menu Dropdown/Overlay */}
				{isMobileMenuOpen && (
					<div className="absolute top-16 left-0 right-0 z-40 bg-white shadow-lg md:hidden border-t border-border/40">
						<nav className="flex flex-col items-start gap-1 p-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
							{currentUser ? (
								<>
									{/* Mobile User Progress */}
									<div className="flex flex-col space-y-3 mb-3 border-b pb-3 w-full">
										<div
											className="flex items-center justify-between text-muted-foreground"
											title={`${userProgress?.streak || 0} Day Streak`}
										>
											<div className="flex items-center">
												<Flame className="h-5 w-5 mr-2 text-orange-400" />
												<span className="text-sm font-medium">
													Daily Streak
												</span>
											</div>
											<span className="text-sm font-medium">
												{userProgress?.streak || 0} Days
											</span>
										</div>
										{/* Mobile Level Display without Progress Bar */}
										<div
											title={`Level ${userProgress?.level || 1} (${
												progressInfo.pointsInCurrentLevel
											} / ${progressInfo.pointsNeededForNextLevel} points)`}
										>
											<div className="flex items-center justify-between text-muted-foreground">
												<div className="flex items-center">
													<Star className="h-5 w-5 mr-2 text-yellow-400" />
													<span className="text-sm font-medium">
														Level {userProgress?.level || 1}
													</span>
												</div>
												<span className="text-sm font-medium">{`${progressInfo.pointsInCurrentLevel} / ${progressInfo.pointsNeededForNextLevel} XP`}</span>
											</div>
										</div>
										{/* Mobile Points Display */}
										<div
											className="flex items-center justify-between text-muted-foreground"
											title={`${
												userProgress?.points || 0
											} Total Experience Points`}
										>
											<div className="flex items-center">
												<Sparkles className="h-5 w-5 mr-2 text-teal-400" />
												<span className="text-sm font-medium">Total XP</span>
											</div>
											<span className="text-sm font-medium">
												{userProgress?.points || 0}
											</span>
										</div>
										{/* Mobile Story Generation Limit */}
										{storyLimit && (
											<div
												className="flex items-center justify-between text-muted-foreground"
												title={
													storyLimit.subscriptionTier === "PRO"
														? `${storyLimit.remaining} of ${storyLimit.limit} PRO story generations remaining today.`
														: storyLimit.isPremium
														? "Premium users have unlimited story generations"
														: `${storyLimit.remaining} of ${storyLimit.limit} story generations remaining today. Premium coming soon!`
												}
											>
												<div className="flex items-center">
													<BookOpen className="h-5 w-5 mr-2 text-blue-400" />
													<span className="text-sm font-medium">
														Story Limit
													</span>
												</div>
												<span className="text-sm font-medium">
													{storyLimit.subscriptionTier === "PRO"
														? `${storyLimit.remaining}/${storyLimit.limit}`
														: storyLimit.isPremium
														? "∞"
														: `${storyLimit.remaining}/${storyLimit.limit}`}
												</span>
											</div>
										)}
									</div>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/"
												? "text-primary font-semibold bg-accent"
												: ""
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/">Home</Link>
									</Button>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/progress"
												? "text-primary font-semibold bg-accent"
												: ""
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/progress">Progress</Link>
									</Button>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/my-stories"
												? "text-primary font-semibold bg-accent"
												: ""
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/my-stories">My Stories</Link>
									</Button>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/explore-stories"
												? "text-primary font-semibold bg-accent"
												: ""
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/explore-stories">Explore Stories</Link>
									</Button>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/practice"
												? "text-primary font-semibold bg-accent"
												: ""
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/practice">Practice</Link>
									</Button>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/leaderboard"
												? "text-primary font-semibold bg-accent"
												: "text-amber-500 hover:bg-amber-100"
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/leaderboard">Leaderboard</Link>
									</Button>
									<Button
										variant="ghost"
										asChild
										className={`w-full justify-start ${
											location.pathname === "/profile"
												? "text-primary font-semibold bg-accent"
												: ""
										}`}
										onClick={closeMobileMenu}
									>
										<Link to="/profile">Profile</Link>
									</Button>
									<Button
										variant="ghost"
										onClick={handleLogout}
										className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
									>
										Logout
									</Button>
								</>
							) : (
								<>
									{/* Enhanced mobile navigation for non-logged-in users */}
									<div className="w-full space-y-2">
										<Button
											variant="ghost"
											asChild
											className="w-full justify-start h-11 text-base font-medium hover:bg-accent/50"
										>
											<Link to="/explore-stories" onClick={closeMobileMenu}>
												Explore Stories
											</Link>
										</Button>
									</div>

									{/* Auth buttons section */}
									<div className="border-t border-border/40 pt-4 mt-4 w-full space-y-3">
										<Button
											variant="default"
											onClick={() => handleAuthClick("login")}
											className="w-full h-11 text-base bg-transparent border-1"
										>
											Sign In
										</Button>
										<Button
											variant="default"
											onClick={() => handleAuthClick("signup")}
											className="w-full h-11 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
										>
											Get Started
										</Button>
									</div>
								</>
							)}
						</nav>
					</div>
				)}
			</header>

			<AuthDialog 
				open={showAuthDialog}
				onOpenChange={setShowAuthDialog}
				initialTab={activeTab}
			/>
		</>
	);
});

// Export the component with an attached refresh method
const NavbarWithRefresh = React.forwardRef((props, ref) => {
	const navbarRef = React.useRef(null);
	const [refreshKey, setRefreshKey] = useState(0);

	React.useImperativeHandle(ref, () => ({
		refreshStoryLimit: () => {
			if (navbarRef.current?.fetchStoryLimit) {
				navbarRef.current.fetchStoryLimit();
			}
			// Force a re-render by updating the key
			setRefreshKey((prev) => prev + 1);
		},
	}));

	return <Navbar key={refreshKey} ref={navbarRef} {...props} />;
});

export default NavbarWithRefresh;
