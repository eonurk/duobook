import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
	Trash2,
	Loader2,
	Search,
	BookOpen,
	Languages,
	BarChart3,
	Plus,
	Grid3X3,
	List as ListIcon,
	Filter,
	Copy,
	SortDesc,
	X,
	ChevronDown,
	Eye,
	Crown,
	MessageSquare,
} from "lucide-react";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStories, deleteStory } from "@/lib/api";
import { trackStoryView } from "@/lib/analytics";
import toast from "react-hot-toast";

// Simple skeleton loading component
const StoryCardSkeleton = () => (
	<div className="bg-white border rounded-lg p-4 animate-pulse">
		<div className="h-6 bg-gray-200 rounded mb-3" />
		<div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
		<div className="flex gap-2 mb-4">
			<div className="h-6 bg-gray-200 rounded w-20" />
			<div className="h-6 bg-gray-200 rounded w-16" />
		</div>
		<div className="h-10 bg-gray-200 rounded" />
	</div>
);

// Simple card view component
const StoryCardView = ({
	story,
	pageCount,
	sentenceCount,
	vocabularyCount,
	onStoryClick,
	onDelete,
	isDeleting,
	handleCopyLink,
}) => {
	const [showMenu, setShowMenu] = useState(false);

	const getDifficultyColor = (difficulty) => {
		switch (difficulty) {
			case "Beginner":
				return "text-green-600 bg-green-50";
			case "Intermediate":
				return "text-yellow-600 bg-yellow-50";
			case "Advanced":
				return "text-red-600 bg-red-50";
			default:
				return "text-gray-600 bg-gray-50";
		}
	};

	const isPro = story.length === "very_long_pro";

	return (
		<div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
			{/* Header */}
			<div className="flex justify-between items-start mb-3">
				<h3
					className="text-lg font-semibold cursor-pointer hover:text-blue-600 flex-1 line-clamp-2"
					onClick={() => onStoryClick(story)}
				>
					{story.description || "Untitled Story"}
				</h3>

				<div className="relative">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowMenu(!showMenu)}
						className="h-8 w-8 p-0"
					>
						<ChevronDown className="h-4 w-4" />
					</Button>

					{showMenu && (
						<div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10 p-1 bg-white">
							<Button
								variant="ghost"
								className="w-full justify-start text-sm p-2"
								onClick={() => {
									onStoryClick(story);
									setShowMenu(false);
								}}
							>
								<Eye className="h-4 w-4 mr-2" />
								Read Story
							</Button>

							{story.shareId && (
								<Button
									variant="ghost"
									className="w-full justify-start text-sm p-2"
									onClick={() => {
										handleCopyLink(
											`${window.location.origin}/story/${story.shareId}`,
											story.description || "this story"
										);
										setShowMenu(false);
									}}
								>
									<Copy className="h-4 w-4 mr-2" />
									Copy Link
								</Button>
							)}

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										className="w-full justify-start text-sm p-2 text-red-600"
										disabled={isDeleting === story.id}
									>
										{isDeleting === story.id ? (
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4 mr-2" />
										)}
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Story?</AlertDialogTitle>
										<AlertDialogDescription>
											This will permanently delete "
											{story.description || "Untitled Story"}".
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel onClick={() => setShowMenu(false)}>
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => {
												onDelete(story.id);
												setShowMenu(false);
											}}
											className="bg-red-500 hover:bg-red-600"
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					)}
				</div>
			</div>

			{/* Languages and difficulty */}
			<div className="flex flex-wrap gap-2 mb-3">
				<span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
					{story.sourceLanguage} → {story.targetLanguage}
				</span>
				{story.difficulty && (
					<span
						className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
							story.difficulty
						)}`}
					>
						{story.difficulty}
					</span>
				)}
				{isPro && (
					<span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded font-medium">
						PRO
					</span>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
				<div className="bg-gray-50 rounded p-2">
					<div className="font-semibold">{pageCount}</div>
					<div className="text-gray-600 text-xs">
						{pageCount === 1 ? "page" : "pages"}
					</div>
				</div>
				<div className="bg-gray-50 rounded p-2">
					<div className="font-semibold">{sentenceCount}</div>
					<div className="text-gray-600 text-xs">sentences</div>
				</div>
				<div className="bg-gray-50 rounded p-2">
					<div className="font-semibold">{vocabularyCount}</div>
					<div className="text-gray-600 text-xs">words</div>
				</div>
			</div>

			{/* Read button */}
			<Button
				onClick={() => onStoryClick(story)}
				className="w-full bg-blue-500 hover:bg-amber-600 text-white"
			>
				Read Story
			</Button>
		</div>
	);
};

// Simple List View Component
const StoryListView = ({
	story,
	pageCount,
	sentenceCount,
	vocabularyCount,
	onStoryClick,
	onDelete,
	isDeleting,
	handleCopyLink,
}) => {
	const getDifficultyColor = (difficulty) => {
		switch (difficulty) {
			case "beginner":
				return "bg-green-100 text-green-800";
			case "intermediate":
				return "bg-yellow-100 text-yellow-800";
			case "advanced":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const isPro = story.length === "very_long_pro";

	return (
		<div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between gap-4">
				<div
					className="flex-1 cursor-pointer"
					onClick={() => onStoryClick(story)}
				>
					<h3 className="text-lg font-semibold mb-2 hover:text-blue-600">
						{story.description || "Untitled Story"}
					</h3>

					<div className="flex flex-wrap gap-2 mb-3">
						<span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
							{story.sourceLanguage} → {story.targetLanguage}
						</span>
						{story.difficulty && (
							<span
								className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
									story.difficulty
								)}`}
							>
								{story.difficulty}
							</span>
						)}
						{isPro && (
							<span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded font-medium">
								PRO
							</span>
						)}
					</div>

					<div className="flex gap-4 text-sm text-gray-600">
						<span>{pageCount} pages</span>
						<span>{sentenceCount} sentences</span>
						<span>{vocabularyCount} words</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{story.shareId && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								handleCopyLink(
									`${window.location.origin}/story/${story.shareId}`,
									story.description || "this story"
								)
							}
							className="h-8 w-8 p-0"
						>
							<Copy className="h-4 w-4" />
						</Button>
					)}

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
								disabled={isDeleting === story.id}
							>
								{isDeleting === story.id ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Trash2 className="h-4 w-4" />
								)}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Story?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete "
									{story.description || "Untitled Story"}".
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => onDelete(story.id)}
									className="bg-red-500 hover:bg-red-600"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
};

function MyStoriesPage() {
	const { currentUser } = useAuth();
	const navigate = useNavigate();
	const [savedStories, setSavedStories] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isDeleting, setIsDeleting] = useState(null);

	// Simple state for filtering and sorting
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedLanguage, setSelectedLanguage] = useState("all");
	const [selectedDifficulty, setSelectedDifficulty] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [viewMode, setViewMode] = useState("grid");

	const parseStoryData = (storyString) => {
		try {
			return JSON.parse(storyString);
		} catch (e) {
			console.error("Failed to parse story JSON:", e);
			return null;
		}
	};

	useEffect(() => {
		if (currentUser) {
			setIsLoading(true);
			setError(null);
			getStories()
				.then((storiesFromApi) => {
					storiesFromApi.sort(
						(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
					);
					setSavedStories(storiesFromApi);
				})
				.catch((err) => {
					console.error("Error fetching stories from API:", err);
					setError(err.message || "Failed to load stories.");
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			setIsLoading(false);
			setSavedStories([]);
		}
	}, [currentUser]);

	// Get unique languages and difficulties for filters
	const availableLanguages = useMemo(() => {
		const languages = new Set();
		savedStories.forEach((story) => {
			if (story.targetLanguage) languages.add(story.targetLanguage);
		});
		return Array.from(languages).sort();
	}, [savedStories]);

	const availableDifficulties = useMemo(() => {
		const difficulties = new Set();
		savedStories.forEach((story) => {
			if (story.difficulty) difficulties.add(story.difficulty);
		});
		return Array.from(difficulties).sort();
	}, [savedStories]);

	// Filter and sort stories
	const filteredAndSortedStories = useMemo(() => {
		let filtered = savedStories.filter((story) => {
			// Search filter
			const matchesSearch =
				!searchQuery ||
				story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				story.targetLanguage
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				story.sourceLanguage?.toLowerCase().includes(searchQuery.toLowerCase());

			// Language filter
			const matchesLanguage =
				selectedLanguage === "all" || story.targetLanguage === selectedLanguage;

			// Difficulty filter
			const matchesDifficulty =
				selectedDifficulty === "all" || story.difficulty === selectedDifficulty;

			return matchesSearch && matchesLanguage && matchesDifficulty;
		});

		// Sort stories
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "newest": {
					return new Date(b.createdAt) - new Date(a.createdAt);
				}
				case "oldest": {
					return new Date(a.createdAt) - new Date(b.createdAt);
				}
				case "title": {
					return (a.description || "").localeCompare(b.description || "");
				}
				case "difficulty": {
					const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
					return (
						(difficultyOrder[a.difficulty] || 0) -
						(difficultyOrder[b.difficulty] || 0)
					);
				}
				case "language": {
					return (a.targetLanguage || "").localeCompare(b.targetLanguage || "");
				}
				default: {
					return 0;
				}
			}
		});

		return filtered;
	}, [savedStories, searchQuery, selectedLanguage, selectedDifficulty, sortBy]);

	const handleStoryClick = (story) => {
		const storyData = parseStoryData(story.story);
		if (!storyData) {
			toast.error(
				"Could not load story data. The story format might be invalid."
			);
			return;
		}
		const params = {
			description: story.description,
			source: story.sourceLanguage,
			target: story.targetLanguage,
			difficulty: story.difficulty,
			length: story.length,
		};

		trackStoryView(story);

		// Navigate to the correct dynamic route using shareId
		if (story.shareId) {
			navigate(`/story/${story.shareId}`, {
				state: { storyData: storyData, params: params },
			});
		} else {
			console.error("Story object is missing shareId:", story);
			toast.error("Cannot navigate to story: Shareable ID is missing.");
		}
	};

	const performDeleteStory = async (storyIdToDelete) => {
		if (!currentUser || isDeleting === storyIdToDelete) return;

		setIsDeleting(storyIdToDelete);
		try {
			await deleteStory(storyIdToDelete);
			setSavedStories((prevStories) =>
				prevStories.filter((story) => story.id !== storyIdToDelete)
			);
			toast.success("Story deleted successfully!");
		} catch (error) {
			console.error("Error deleting story via API:", error);
			toast.error(`Failed to delete story: ${error.message}`);
		} finally {
			setIsDeleting(null);
		}
	};

	const handleCopyLink = (storyUrl, storyTitle) => {
		try {
			navigator.clipboard.writeText(storyUrl);
			toast.success(`Link for "${storyTitle}" copied to clipboard!`);
		} catch (err) {
			console.error("Failed to copy story link: ", err);
			toast.error("Could not copy link.");
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto py-8 px-4 max-w-7xl">
					{/* Header skeleton */}
					<div className="mb-8">
						<div className="h-8 bg-gray-200 rounded w-80 mb-2" />
						<div className="h-4 bg-gray-200 rounded w-48" />
					</div>

					{/* Filter skeleton */}
					<div className="bg-white rounded-lg border p-6 mb-8">
						<div className="flex flex-col lg:flex-row gap-4">
							<div className="h-10 bg-gray-200 rounded flex-1" />
							<div className="flex gap-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-10 w-32 bg-gray-200 rounded" />
								))}
							</div>
						</div>
					</div>

					{/* Stories skeleton */}
					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
							<StoryCardSkeleton key={i} />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto py-20 px-4 text-center">
					<div className="max-w-md mx-auto bg-white rounded-lg border p-8">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<X className="h-8 w-8 text-red-500" />
						</div>
						<h3 className="text-xl font-semibold text-gray-800 mb-3">
							Failed to Load Stories
						</h3>
						<p className="text-gray-600 mb-6">{error}</p>
						<Button
							onClick={() => window.location.reload()}
							className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
						>
							Try Again
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto py-8 px-4 max-w-7xl">
				{/* Simple Header */}
				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								My Saved Stories
							</h1>
							<div className="flex items-center gap-2 text-gray-600">
								<BookOpen className="h-5 w-5" />
								<span>
									{savedStories.length}{" "}
									{savedStories.length === 1 ? "story" : "stories"} saved
									{filteredAndSortedStories.length !== savedStories.length && (
										<span className="text-blue-600 font-medium">
											{" "}
											• {filteredAndSortedStories.length} shown
										</span>
									)}
								</span>
							</div>
						</div>

						{savedStories.length > 0 && (
							<div className="flex items-center gap-3">
								<div className="flex items-center bg-white rounded-lg border p-1">
									<Button
										variant={viewMode === "grid" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("grid")}
										className={
											viewMode === "grid" ? "bg-blue-500 hover:bg-blue-600" : ""
										}
									>
										<Grid3X3 className="h-4 w-4" />
									</Button>
									<Button
										variant={viewMode === "list" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("list")}
										className={
											viewMode === "list" ? "bg-blue-500 hover:bg-blue-600" : ""
										}
									>
										<ListIcon className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>

				{!currentUser ? (
					<div className="text-center py-16 bg-white rounded-lg border">
						<BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
						<h3 className="text-xl font-semibold text-gray-700 mb-2">
							Welcome to Your Stories
						</h3>
						<p className="text-gray-500">
							Please log in to see your saved stories.
						</p>
					</div>
				) : savedStories.length === 0 ? (
					<div className="text-center py-20 bg-white rounded-lg border">
						<div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<BookOpen className="h-10 w-10 text-blue-500" />
						</div>
						<h3 className="text-2xl font-semibold text-gray-800 mb-3">
							No stories yet
						</h3>
						<p className="text-gray-600 mb-6 max-w-md mx-auto">
							Start your language learning journey by creating your first
							personalized story.
						</p>
						<Button
							onClick={() => navigate("/")}
							className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded"
						>
							<Plus className="h-5 w-5 mr-2" />
							Create Your First Story
						</Button>
					</div>
				) : (
					<>
						{/* Simple Search and Filter Controls */}
						<div className="bg-white rounded-lg border p-6 mb-8">
							<div className="flex flex-col lg:flex-row gap-4">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Search your stories..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10 h-10 border-gray-200"
									/>
								</div>

								<div className="flex flex-wrap gap-3">
									<Select
										value={selectedLanguage}
										onValueChange={setSelectedLanguage}
									>
										<SelectTrigger className="w-[140px] h-10">
											<Languages className="h-4 w-4 mr-2 text-gray-500" />
											<SelectValue placeholder="Language" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Languages</SelectItem>
											{availableLanguages.map((lang) => (
												<SelectItem key={lang} value={lang}>
													{lang}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Select
										value={selectedDifficulty}
										onValueChange={setSelectedDifficulty}
									>
										<SelectTrigger className="w-[140px] h-10">
											<BarChart3 className="h-4 w-4 mr-2 text-gray-500" />
											<SelectValue placeholder="Difficulty" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Levels</SelectItem>
											{availableDifficulties.map((diff) => (
												<SelectItem key={diff} value={diff}>
													{diff.charAt(0).toUpperCase() + diff.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Select value={sortBy} onValueChange={setSortBy}>
										<SelectTrigger className="w-[140px] h-10">
											<SortDesc className="h-4 w-4 mr-2 text-gray-500" />
											<SelectValue placeholder="Sort by" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="newest">Newest First</SelectItem>
											<SelectItem value="oldest">Oldest First</SelectItem>
											<SelectItem value="title">Title A-Z</SelectItem>
											<SelectItem value="difficulty">Difficulty</SelectItem>
											<SelectItem value="language">Language</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						{/* Stories Grid/List */}
						{filteredAndSortedStories.length === 0 ? (
							<div className="text-center py-16 bg-white rounded-lg border">
								<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
									<Filter className="h-8 w-8 text-amber-500" />
								</div>
								<h3 className="text-xl font-semibold text-gray-800 mb-3">
									No stories match your filters
								</h3>
								<p className="text-gray-600 mb-6">
									Try adjusting your search or filter criteria to find what
									you're looking for.
								</p>
								<Button
									variant="outline"
									onClick={() => {
										setSearchQuery("");
										setSelectedLanguage("all");
										setSelectedDifficulty("all");
									}}
									className="border-2 border-amber-200 hover:bg-amber-50"
								>
									<Filter className="h-4 w-4 mr-2" />
									Clear All Filters
								</Button>
							</div>
						) : (
							<div
								className={
									viewMode === "grid"
										? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
										: "flex flex-col gap-4"
								}
							>
								{filteredAndSortedStories.map((story) => {
									const storyDataPreview = parseStoryData(story.story);
									let sentenceCount = 0;
									let pageCount = 0;
									let vocabularyCount = 0;

									if (storyDataPreview) {
										if (Array.isArray(storyDataPreview.pages)) {
											pageCount = storyDataPreview.pages.length;
											sentenceCount = storyDataPreview.pages.reduce(
												(total, page) => {
													return total + (page.sentencePairs?.length || 0);
												},
												0
											);
											vocabularyCount = storyDataPreview.pages.reduce(
												(total, page) => {
													return total + (page.vocabulary?.length || 0);
												},
												0
											);
										} else if (Array.isArray(storyDataPreview.sentencePairs)) {
											pageCount = 1;
											sentenceCount = storyDataPreview.sentencePairs.length;
											vocabularyCount =
												storyDataPreview.vocabulary?.length || 0;
										}
									}

									return viewMode === "grid" ? (
										<StoryCardView
											key={story.id}
											story={story}
											pageCount={pageCount}
											sentenceCount={sentenceCount}
											vocabularyCount={vocabularyCount}
											onStoryClick={handleStoryClick}
											onDelete={performDeleteStory}
											isDeleting={isDeleting}
											handleCopyLink={handleCopyLink}
										/>
									) : (
										<StoryListView
											key={story.id}
											story={story}
											pageCount={pageCount}
											sentenceCount={sentenceCount}
											vocabularyCount={vocabularyCount}
											onStoryClick={handleStoryClick}
											onDelete={performDeleteStory}
											isDeleting={isDeleting}
											handleCopyLink={handleCopyLink}
										/>
									);
								})}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default MyStoriesPage;
