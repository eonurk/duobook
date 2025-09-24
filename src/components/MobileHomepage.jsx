import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InputForm from "@/components/InputForm";
import AuthDialog from "@/components/Auth/AuthDialog";
import {
	BookOpen,
	Search,
	Trophy,
	BarChart3,
	Plus,
	Sparkles,
} from "lucide-react";

export default function MobileHomepage({ generateStory }) {
	const { currentUser } = useAuth();
	const [showAuthDialog, setShowAuthDialog] = useState(false);
	const [showStoryForm, setShowStoryForm] = useState(false);
	const [authMode, setAuthMode] = useState("signup");
	const [formError, setFormError] = useState(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const navigate = useNavigate();

	// Debug iOS-specific issues - DISABLED
	// useEffect(() => {
	// 	console.log("=== MOBILE HOMEPAGE MOUNT DEBUG ===");
	// 	console.log("Platform:", window.Capacitor?.getPlatform());
	// 	console.log("Is native platform:", window.Capacitor?.isNativePlatform());
	// 	console.log(
	// 		"Device info:",
	// 		window.Capacitor?.getDeviceInfo
	// 			? window.Capacitor.getDeviceInfo()
	// 			: "Not available"
	// 	);
	// 	console.log("Current user:", currentUser?.email);
	// 	console.log("User ID:", currentUser?.uid);
	// 	console.log("User auth provider:", currentUser?.providerData);
	// 	console.log("Navigator userAgent:", navigator.userAgent);
	// 	console.log("Window location:", window.location.href);
	// 	console.log("====================================");
	// }, [currentUser]);

	// Wrapper function to handle the setFormError parameter
	const handleGenerateStory = async (
		description,
		sourceLang,
		targetLang,
		difficulty,
		storyLength,
		isPublic,
		selectedGenre,
		selectedGrammarFocus
	) => {
		setIsGenerating(true);
		setFormError(null);

		try {
			// Call the original generateStory function with proper error handling
			const result = await generateStory(
				description,
				sourceLang,
				targetLang,
				difficulty,
				storyLength,
				setFormError, // Pass the actual setFormError function
				isPublic,
				selectedGenre,
				selectedGrammarFocus
			);

			return result;
		} catch (error) {
			console.error("Story generation failed:", error);
			console.error("Error details:", {
				message: error.message,
				stack: error.stack,
				name: error.name,
			});

			// Set the error so it can be displayed to the user
			setFormError({
				type: "generation",
				message: error.message || "Failed to generate story. Please try again.",
			});

			// Show a toast notification as fallback
			if (typeof window !== "undefined" && window.toast) {
				window.toast.error(
					"Story generation failed: " + (error.message || "Unknown error")
				);
			} else {
				alert("Story generation failed: " + (error.message || "Unknown error"));
			}

			throw error; // Re-throw to maintain error propagation
		} finally {
			setIsGenerating(false);
		}
	};

	// Listen for auth events from mobile navbar
	useEffect(() => {
		const handleAuthEvent = (event) => {
			setAuthMode(event.detail);
			setShowAuthDialog(true);
		};

		window.addEventListener("openAuth", handleAuthEvent);

		return () => {
			window.removeEventListener("openAuth", handleAuthEvent);
		};
	}, []);

	const handleCreateStory = () => {
		if (!currentUser) {
			setShowAuthDialog(true);
			return;
		}
		setShowStoryForm(true);
	};

	const quickActions = [
		{
			icon: Plus,
			label: "Create Story",
			description: "Generate a new story",
			onClick: handleCreateStory,
			color: "bg-orange-500 text-white",
			disabled: false,
		},
		{
			icon: Search,
			label: "Explore",
			description: "Discover new stories",
			onClick: () => navigate("/explore-stories"),
			color: "bg-green-500 text-white",
			disabled: false,
		},
		{
			icon: BookOpen,
			label: "My Stories",
			description: "View your stories",
			onClick: () =>
				currentUser ? navigate("/my-stories") : setShowAuthDialog(true),
			color: "bg-blue-500 text-white",
			disabled: !currentUser,
		},

		{
			icon: Sparkles,
			label: "Practice",
			description: "Quiz vocabulary",
			onClick: () =>
				currentUser ? navigate("/practice") : setShowAuthDialog(true),
			color: "bg-purple-500 text-white",
			disabled: !currentUser,
		},
	];

	if (showStoryForm) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto ">
					<div className="bg-white rounded-lg shadow-sm p-3">
						<InputForm
							onSubmit={handleGenerateStory}
							isLoading={isGenerating}
							apiErrorDetails={formError}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Quick Actions */}
			<div className="container mx-auto px-4 py-6">
				<h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
				<div className="grid grid-cols-2 gap-3 mb-6">
					{quickActions.map((action, index) => {
						const IconComponent = action.icon;
						return (
							<Card
								key={index}
								className={`cursor-pointer transition-transform hover:scale-105 ${
									action.disabled ? "opacity-50" : ""
								}`}
								onClick={action.disabled ? undefined : action.onClick}
							>
								<CardContent className="p-4 text-center">
									<div
										className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${action.color}`}
									>
										<IconComponent className="h-6 w-6" />
									</div>
									<h3 className="font-semibold text-sm mb-1">{action.label}</h3>
									<p className="text-xs text-gray-600">{action.description}</p>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Secondary Actions */}
				<div className="grid grid-cols-2 gap-3 mb-8">
					<Card
						className={`cursor-pointer transition-transform hover:scale-105 ${
							!currentUser ? "opacity-50" : ""
						}`}
						onClick={!currentUser ? undefined : () => navigate("/progress")}
					>
						<CardContent className="p-4 text-center">
							<div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-teal-500 text-white">
								<BarChart3 className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-sm mb-1">Progress</h3>
							<p className="text-xs text-gray-600">
								{!currentUser ? "Login required" : "Track learning"}
							</p>
						</CardContent>
					</Card>
					<Card
						className={`cursor-pointer transition-transform hover:scale-105 ${
							!currentUser ? "opacity-50" : ""
						}`}
						onClick={!currentUser ? undefined : () => navigate("/achievements")}
					>
						<CardContent className="p-4 text-center">
							<div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-yellow-500 text-white">
								<Trophy className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-sm mb-1">Achievements</h3>
							<p className="text-xs text-gray-600">
								{!currentUser ? "Login required" : "View rewards"}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Call to Action */}
				{!currentUser && (
					<div className="space-y-4">
						{/* Login/Signup Buttons */}
						<Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
							<CardContent className="p-4">
								<div className="text-center mb-4">
									<h3 className="text-lg font-semibold mb-2">
										Join DuoBook Today
									</h3>
									<p className="text-orange-100 text-sm">
										Sign up to save your progress and access all features
									</p>
								</div>
								<div className="flex gap-3">
									<Button
										variant="secondary"
										onClick={() => setShowAuthDialog(true)}
										className="flex-1 bg-white text-orange-600 hover:bg-gray-100 font-semibold"
									>
										Sign Up
									</Button>
									<Button
										variant="outline"
										onClick={() => setShowAuthDialog(true)}
										className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
									>
										Login
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Feature highlight for guests */}
						<Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
							<CardContent className="p-4 text-center">
								<h3 className="text-sm font-semibold mb-2">
									✨ Create unlimited stories, track progress, and practice
									vocabulary
								</h3>
								<p className="text-blue-100 text-xs">
									Join thousands of language learners worldwide
								</p>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Auth Dialog */}
			<AuthDialog
				open={showAuthDialog}
				onOpenChange={(open) => {
					setShowAuthDialog(open);
					if (!open) {
						setAuthMode("login"); // Reset to login mode when dialog closes
					}
				}}
				initialTab={authMode}
			/>
		</div>
	);
}
