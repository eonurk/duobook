import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Assuming you have AuthContext for user info
import { getLatestStories } from "@/lib/api"; // We'll need to add this API function
import toast, { Toaster } from "react-hot-toast";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Filter } from "lucide-react";

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
	const [sourceLanguage, setSourceLanguage] = useState("");
	const [targetLanguage, setTargetLanguage] = useState("");
	const [sortBy, setSortBy] = useState("createdAt_desc");
	const [availableLanguages, setAvailableLanguages] = useState({
		source: [],
		target: [],
	});

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
		async (pageToFetch, sourceLang, targetLang, sort) => {
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
				const response = await getLatestStories(
					idToken,
					pageToFetch,
					12,
					true,
					sourceLang,
					targetLang,
					sort
				);
				setStories(response.stories || []);
				setCurrentPage(response.currentPage || 1); // Update currentPage from response
				setTotalPages(response.totalPages || 1);
				if (
					!availableLanguages.source.length &&
					!availableLanguages.target.length &&
					response.availableLanguages
				) {
					setAvailableLanguages(response.availableLanguages);
				}
				if (pageToFetch !== response.currentPage && response.currentPage) {
					const newParams = { page: response.currentPage.toString() };
					if (sourceLang) newParams.source = sourceLang;
					if (targetLang) newParams.target = targetLang;
					if (sort) newParams.sort = sort;
					setSearchParams(newParams, { replace: true });
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
		[
			idToken,
			setSearchParams,
			availableLanguages.source.length,
			availableLanguages.target.length,
		]
	);

	useEffect(() => {
		const pageFromUrl = parseInt(searchParams.get("page")) || 1;
		const sourceLangFromUrl = searchParams.get("source") || "";
		const targetLangFromUrl = searchParams.get("target") || "";
		const sortFromUrl = searchParams.get("sort") || "createdAt_desc";
		if (
			pageFromUrl !== currentPage ||
			sourceLangFromUrl !== sourceLanguage ||
			targetLangFromUrl !== targetLanguage ||
			sortFromUrl !== sortBy
		) {
			setCurrentPage(pageFromUrl); // Sync state with URL on initial load or back/forward
			setSourceLanguage(sourceLangFromUrl);
			setTargetLanguage(targetLangFromUrl);
			setSortBy(sortFromUrl);
		}
		fetchStoriesCallback(
			pageFromUrl,
			sourceLangFromUrl,
			targetLangFromUrl,
			sortFromUrl
		);
	}, [
		fetchStoriesCallback,
		searchParams,
		currentPage,
		sourceLanguage,
		targetLanguage,
		sortBy,
	]);

	const handlePageChange = (newPage) => {
		if (newPage < 1 || (newPage > totalPages && totalPages > 0)) return;

		if (!idToken && newPage > 1) {
			setShowLoginPrompt(true);
			triggerLoginModal();
			return;
		}
		setShowLoginPrompt(false);
		setCurrentPage(newPage);
		setSearchParams(
			{
				page: newPage.toString(),
				source: sourceLanguage,
				target: targetLanguage,
				sort: sortBy,
			},
			{ replace: true }
		);
	};

	const handleLanguageFilterChange = (source, target) => {
		setSourceLanguage(source);
		setTargetLanguage(target);
		setCurrentPage(1); // Reset to first page
		setSearchParams(
			{
				page: "1",
				source: source,
				target: target,
				sort: sortBy,
			},
			{ replace: true }
		);
	};

	const handleSortChange = (newSortBy) => {
		setSortBy(newSortBy);
		setCurrentPage(1); // Reset to first page
		setSearchParams(
			{
				page: "1",
				source: sourceLanguage,
				target: targetLanguage,
				sort: newSortBy,
			},
			{ replace: true }
		);
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

			{/* Mobile Filter Button */}
			<div className="md:hidden mb-6 flex justify-center">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">
							<Filter className="w-4 h-4 mr-2" />
							Filter & Sort
						</Button>
					</DialogTrigger>
					<DialogContent className="bg-white">
						<DialogHeader>
							<DialogTitle>Filter & Sort</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="source-language-mobile"
									className="block text-sm font-medium text-gray-700"
								>
									Source Language
								</label>
								<select
									id="source-language-mobile"
									value={sourceLanguage}
									onChange={(e) =>
										handleLanguageFilterChange(e.target.value, targetLanguage)
									}
									className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
								>
									<option value="">Any</option>
									{availableLanguages.source.map((lang) => (
										<option key={lang} value={lang}>
											{lang}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="target-language-mobile"
									className="block text-sm font-medium text-gray-700"
								>
									Target Language
								</label>
								<select
									id="target-language-mobile"
									value={targetLanguage}
									onChange={(e) =>
										handleLanguageFilterChange(sourceLanguage, e.target.value)
									}
									className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
								>
									<option value="">Any</option>
									{availableLanguages.target.map((lang) => (
										<option key={lang} value={lang}>
											{lang}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="sort-by-mobile"
									className="block text-sm font-medium text-gray-700"
								>
									Sort By
								</label>
								<select
									id="sort-by-mobile"
									value={sortBy}
									onChange={(e) => handleSortChange(e.target.value)}
									className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
								>
									<option value="createdAt_desc">Newest</option>
									<option value="createdAt_asc">Oldest</option>
									<option value="likes_desc">Most Popular</option>
									<option value="length_desc">Longest</option>
									<option value="length_asc">Shortest</option>
								</select>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Desktop Filters */}
			<div className="hidden md:flex justify-center items-end gap-4 mb-8">
				<div>
					<label
						htmlFor="source-language"
						className="block text-sm font-medium text-gray-700"
					>
						Source Language
					</label>
					<select
						id="source-language"
						value={sourceLanguage}
						onChange={(e) =>
							handleLanguageFilterChange(e.target.value, targetLanguage)
						}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="">Any</option>
						{availableLanguages.source.map((lang) => (
							<option key={lang} value={lang}>
								{lang}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor="target-language"
						className="block text-sm font-medium text-gray-700"
					>
						Target Language
					</label>
					<select
						id="target-language"
						value={targetLanguage}
						onChange={(e) =>
							handleLanguageFilterChange(sourceLanguage, e.target.value)
						}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="">Any</option>
						{availableLanguages.target.map((lang) => (
							<option key={lang} value={lang}>
								{lang}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor="sort-by"
						className="block text-sm font-medium text-gray-700"
					>
						Sort By
					</label>
					<select
						id="sort-by"
						value={sortBy}
						onChange={(e) => handleSortChange(e.target.value)}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="createdAt_desc">Newest</option>
						<option value="createdAt_asc">Oldest</option>
						<option value="likes_desc">Most Popular</option>
						<option value="length_desc">Longest</option>
						<option value="length_asc">Shortest</option>
					</select>
				</div>
			</div>

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
