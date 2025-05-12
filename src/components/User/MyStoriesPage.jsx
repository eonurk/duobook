import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Share2 } from "lucide-react";
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
import { getStories, deleteStory } from "@/lib/api";
import { trackStoryView } from "@/lib/analytics";
import toast from "react-hot-toast";

function MyStoriesPage() {
	const { currentUser } = useAuth();
	const navigate = useNavigate();
	const [savedStories, setSavedStories] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isDeleting, setIsDeleting] = useState(null);

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

	const handleStoryClick = (story) => {
		const storyData = parseStoryData(story.story);
		if (!storyData) {
			alert("Could not load story data. The story format might be invalid.");
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
			alert("Cannot navigate to story: Shareable ID is missing.");
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
		} catch (error) {
			console.error("Error deleting story via API:", error);
			alert(`Failed to delete story: ${error.message}`);
		} finally {
			setIsDeleting(null);
		}
	};

	const handleShare = (event, story) => {
		event.stopPropagation();
		if (!story?.shareId) {
			toast.error("Share ID not available for this story.");
			return;
		}
		const storyUrl = `${window.location.origin}/story/${story.shareId}`;
		try {
			navigator.clipboard.writeText(storyUrl);
			toast.success("Story link copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy story link: ", err);
			toast.error("Could not copy link.");
		}
	};

	const formatTimestamp = (timestamp) => {
		if (!timestamp) return "";
		return new Date(timestamp).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-10 px-4 text-center">
				<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
				Loading stories...
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-10 px-4 text-center text-red-600">
				Error: {error}
			</div>
		);
	}

	return (
		<div className="container mx-auto py-10 px-4 max-w-3xl">
			<h1 className="text-3xl font-bold mb-6">My Saved Stories</h1>
			{!currentUser ? (
				<p className="text-muted-foreground">
					Please log in to see your stories.
				</p>
			) : savedStories.length === 0 ? (
				<p className="text-muted-foreground">
					You haven't generated any stories yet.
				</p>
			) : (
				<div className="flex flex-col gap-4">
					{savedStories.map((story) => {
						const storyDataPreview = parseStoryData(story.story);
						let sentenceCount = 0;
						if (storyDataPreview) {
							if (Array.isArray(storyDataPreview.pages)) {
								sentenceCount = storyDataPreview.pages.reduce((total, page) => {
									return total + (page.sentencePairs?.length || 0);
								}, 0);
							} else if (Array.isArray(storyDataPreview.sentencePairs)) {
								sentenceCount = storyDataPreview.sentencePairs.length;
							}
						}

						return (
							<div
								key={story.id}
								className="border rounded-lg p-4 flex flex-col items-start sm:flex-row sm:justify-between sm:items-center hover:bg-muted/50 transition-colors"
							>
								<div
									className="flex-grow cursor-pointer w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2"
									onClick={() => handleStoryClick(story)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ")
											handleStoryClick(story);
									}}
									aria-label={`Open story: ${
										story.description || "Untitled Story"
									}`}
								>
									<h3 className="font-semibold text-lg mb-1">
										{story.description || "Untitled Story"}
									</h3>
									<p className="text-sm text-muted-foreground">
										{story.targetLanguage || "N/A"} /{" "}
										{story.sourceLanguage || "N/A"} ({story.difficulty || "N/A"}
										,{" "}
										{story.length === "very_long_pro" ? (
											<span className="text-purple-500 font-semibold">
												Very Long
											</span>
										) : (
											story.length || "N/A"
										)}
										) - {sentenceCount} sentences
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Created: {formatTimestamp(story.createdAt)}
									</p>
								</div>

								<div className="flex items-center flex-shrink-0 space-x-1 self-end sm:self-center mt-2 sm:mt-0 sm:ml-2">
									{story.shareId && (
										<Button
											variant="ghost"
											size="icon"
											className="text-slate-500 hover:text-slate-700"
											onClick={(e) => handleShare(e, story)}
											title="Share Story"
											aria-label={`Share story: ${
												story.description || "Untitled Story"
											}`}
										>
											<Share2 className="h-4 w-4" />
										</Button>
									)}
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className={`text-destructive hover:text-destructive/80 flex-shrink-0 ${
													isDeleting === story.id
														? "opacity-50 cursor-not-allowed"
														: ""
												}`}
												aria-label={`Delete story: ${
													story.description || "Untitled Story"
												}`}
												disabled={isDeleting === story.id}
											>
												{isDeleting === story.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent className=" bg-white">
											<AlertDialogHeader>
												<AlertDialogTitle>Are you sure?</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently
													delete the story "
													{story.description || "Untitled Story"}".
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => performDeleteStory(story.id)}
													className="bg-red-500 text-white hover:bg-destructive/90"
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default MyStoriesPage;
