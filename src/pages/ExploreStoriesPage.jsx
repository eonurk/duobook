import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Assuming you have AuthContext for user info
import { getLatestStories } from "@/lib/api"; // We'll need to add this API function
import toast, { Toaster } from "react-hot-toast";
import StoryCard from "@/components/StoryCard";

const ExploreStoriesPage = () => {
	const { idToken } = useAuth();
	const [stories, setStories] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const [searchParams, setSearchParams] = useSearchParams();
	const [currentPage, setCurrentPage] = useState(
		() => parseInt(searchParams.get("page")) || 1
	);
	const [totalPages, setTotalPages] = useState(1);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);

	// Function to trigger login - placeholder for now
	// In a real app, this might call a function passed from AuthContext or App.jsx
	// to open the main login dialog from Navbar.jsx
	const triggerLoginModal = () => {
		console.log("Login modal should be triggered here.");
		// For now, we just keep the prompt visible or you can navigate to a login page
		// Or if Navbar has a global function: window.openLoginModal();
		toast("Please log in to see more stories.", { icon: "🔐" });
	};

	const fetchStoriesCallback = useCallback(
		async (pageToFetch) => {
			if (!idToken && pageToFetch > 1) {
				setShowLoginPrompt(true);
				setIsLoading(false); // Ensure loading is off if we don't fetch
				setStories([]); // Clear stories if prompt is shown for non-first page
				setTotalPages(1); // Reset to avoid broken pagination
				return;
			}
			setShowLoginPrompt(false); // Clear prompt if we are fetching

			setIsLoading(true);
			setError(null);
			try {
				const response = await getLatestStories(idToken, pageToFetch, 12, true);
				setStories(response.stories || []);
				setCurrentPage(response.currentPage || 1); // Update currentPage from response
				setTotalPages(response.totalPages || 1);
				if (pageToFetch !== response.currentPage && response.currentPage) {
					setSearchParams(
						{ page: response.currentPage.toString() },
						{ replace: true }
					);
				}
			} catch (err) {
				console.error(
					"ExploreStoriesPage: Error fetching latest stories:",
					err
				);
				setError(err.message || "Failed to fetch stories.");
				toast.error("Could not load stories.");
				setStories([]); // Clear stories on error
				setTotalPages(1); // Reset pagination on error
			} finally {
				setIsLoading(false);
			}
		},
		[idToken, setSearchParams]
	); // Added setSearchParams to dependency array

	useEffect(() => {
		const pageFromUrl = parseInt(searchParams.get("page")) || 1;
		if (pageFromUrl !== currentPage) {
			setCurrentPage(pageFromUrl); // Sync state with URL on initial load or back/forward
		}
		fetchStoriesCallback(pageFromUrl);
	}, [fetchStoriesCallback, searchParams, currentPage]); // Add currentPage to ensure re-fetch if internal state changes via other means

	const handlePageChange = (newPage) => {
		if (newPage < 1 || (newPage > totalPages && totalPages > 0)) return;

		if (!idToken && newPage > 1) {
			setShowLoginPrompt(true);
			triggerLoginModal();
			return;
		}
		setShowLoginPrompt(false);
		setCurrentPage(newPage);
		setSearchParams({ page: newPage.toString() }, { replace: true });
		// The useEffect will now pick up the change in searchParams/currentPage and call fetchStoriesCallback
	};

	if (isLoading && stories.length === 0) {
		// Show loading only on initial load or when stories are empty
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<Toaster position="top-center" />
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto my-8"></div>
				<p className="mt-2 text-gray-600">Loading stories...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<Toaster position="top-center" />
			<h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
				Explore Stories from the Community
			</h1>

			{showLoginPrompt && (
				<div
					className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6"
					role="alert"
				>
					<p className="font-bold">Login Required</p>
					<p>
						Please{" "}
						<button
							onClick={triggerLoginModal}
							className="underline font-semibold"
						>
							log in or sign up
						</button>{" "}
						to view more stories.
					</p>
				</div>
			)}

			{error && !showLoginPrompt && (
				<div className="text-center text-red-500 bg-red-100 p-4 rounded-md mb-6">
					<p>Error: {error}</p>
				</div>
			)}

			{!isLoading && !error && stories.length === 0 && !showLoginPrompt && (
				<p className="text-center text-gray-600 py-10">
					No stories found from other users yet. Be the first to share!
				</p>
			)}

			{stories.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{stories.map((story) => (
						<StoryCard key={story.id} story={story} />
					))}
				</div>
			)}

			{!showLoginPrompt && totalPages > 1 && (
				<div className="flex justify-center items-center space-x-4 mt-8">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						variant="outline"
					>
						Previous
					</button>
					<span className="text-gray-700">
						Page {currentPage} of {totalPages}
					</span>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						variant="outline"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
};

export default ExploreStoriesPage;
