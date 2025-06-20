import React from "react";
import { Link } from "react-router-dom";
import {
	Languages,
	BarChart3, // Or SignalLow, SignalMedium, SignalHigh based on difficulty value
	SignalLow,
	SignalMedium,
	SignalHigh,
	CalendarDays,
	BookOpen,
	Share2,
	MessageCircle,
	Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { likeStory, unlikeStory } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getLanguageCode } from "@/lib/languageData";

const formatTimeAgo = (dateString) => {
	const date = new Date(dateString);
	const now = new Date();
	const seconds = Math.round((now - date) / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	const weeks = Math.round(days / 7);
	const months = Math.round(days / 30.44); // Average days in month

	if (seconds < 60) return `${seconds}s ago`;
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	if (weeks < 5) return `${weeks}w ago`; // Up to 4 weeks
	if (months < 12)
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const DifficultyIndicator = ({ difficulty }) => {
	const difficultyLevel = difficulty ? difficulty.toLowerCase() : "n/a";

	let Icon = BarChart3;
	let color = "text-slate-500";
	let text = "N/A";

	switch (difficultyLevel) {
		case "beginner":
			Icon = SignalLow;
			color = "text-green-500";
			text = "Beginner";
			break;
		case "intermediate":
			Icon = SignalMedium;
			color = "text-amber-500";
			text = "Intermediate";
			break;
		case "advanced":
			Icon = SignalHigh;
			color = "text-red-500";
			text = "Advanced";
			break;
		default:
			text = difficulty
				? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
				: "N/A";
			break;
	}

	return (
		<div className="flex items-center">
			<Icon className={`w-4 h-4 mr-2 ${color} flex-shrink-0`} />
			<span className={`${color}`}>{text}</span>
		</div>
	);
};

const LanguageFlags = ({ source, target }) => {
	const sourceCode = getLanguageCode(source);
	const targetCode = getLanguageCode(target);

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-2">
				{sourceCode !== "xx" && (
					<img
						src={`https://flagcdn.com/w20/${sourceCode}.png`}
						alt={`${source} flag`}
						className="h-5 w-5 rounded-full border-2 border-slate-200 shadow-md"
						title={source}
					/>
				)}
				<span className="text-sm font-medium text-slate-600">
					{source || "N/A"}
				</span>
			</div>
			<span className="text-slate-400">→</span>
			<div className="flex items-center gap-2">
				{targetCode !== "xx" && (
					<img
						src={`https://flagcdn.com/w20/${targetCode}.png`}
						alt={`${target} flag`}
						className="h-5 w-5 rounded-full border-2 border-slate-200 shadow-md"
						title={target}
					/>
				)}
				<span className="text-sm font-medium text-slate-600">
					{target || "N/A"}
				</span>
			</div>
		</div>
	);
};

const StoryCard = ({ story }) => {
	const { currentUser } = useAuth();
	const [isLiked, setIsLiked] = React.useState(story.userHasLiked || false);
	const [likeCount, setLikeCount] = React.useState(story.likes || 0);
	const storyTitle =
		story.description ||
		story.story?.split(" ").slice(0, 10).join(" ") + "..." ||
		"A User-Generated Story";
	const timeAgo = story.createdAt
		? formatTimeAgo(story.createdAt)
		: "Some time ago";
	const wordCount = story.story ? story.story.split(/\s+/).length : 0;

	const handleLike = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (!currentUser) {
			toast.error("You must be logged in to like a story.");
			return;
		}

		try {
			if (isLiked) {
				await unlikeStory(story.id);
				setLikeCount((prev) => prev - 1);
				setIsLiked(false);
				toast.success("Unliked story");
			} else {
				await likeStory(story.id);
				setLikeCount((prev) => prev + 1);
				setIsLiked(true);
				toast.success("Liked story!");
			}
		} catch (error) {
			console.error("Failed to like/unlike story:", error);
			toast.error("Failed to update like status.");
		}
	};

	const handleShare = async (event) => {
		event.preventDefault();
		event.stopPropagation();

		const storyUrl = `${window.location.origin}/story/${story.shareId}`;
		const currentStoryTitle = story.description || "Check out this story!";

		if (navigator.share) {
			try {
				await navigator.share({
					title: currentStoryTitle,
					text: `Read "${currentStoryTitle}" on DuoBook!`,
					url: storyUrl,
				});
				toast.success("Story shared!");
			} catch (err) {
				if (err.name !== "AbortError") {
					toast.error("Could not share story.");
				}
			}
		} else {
			// Fallback for browsers that don't support Web Share API (e.g., desktop, some mobile browsers)
			handleCopyLink(event);
		}
	};

	const handleCopyLink = (event) => {
		event.preventDefault();
		event.stopPropagation();
		const storyUrl = `${window.location.origin}/story/${story.shareId}`;
		try {
			navigator.clipboard.writeText(storyUrl);
			toast.success("Link copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy story link: ", err);
			toast.error("Could not copy link.");
		}
	};

	if (story.isExternal) {
		// Render a card with the image as a background and info overlay
		return (
			<a
				href={story.externalUrl}
				target="_blank"
				rel="noopener noreferrer"
				title={story.title} // For hover tooltip showing the book title
				className="relative block w-60 sm:w-72 md:w-72 lg:w-80 snap-center flex-shrink-0 bg-white shadow-xl rounded-lg hover:shadow-2xl transition-all duration-300 ease-in-out border border-slate-300 border-l-[8px] border-l-slate-400 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 aspect-[2/3] hover:-rotate-1 perspective"
				// MODIFIED:
				// - Adjusted widths: 'w-60 sm:w-72 md:w-72 lg:w-80' to provide consistent card sizes across breakpoints for scrolling.
				// - Removed 'md:max-w-xs md:mx-auto' as it's not needed for a flex scroll layout.
				// - Kept 'snap-center flex-shrink-0 perspective' and other styling.
			>
				{/* Book Cover Image */}
				{story.coverImageUrl ? (
					<img
						src={story.coverImageUrl}
						alt={`Cover for ${story.title}`}
						className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-r-sm"
						// Image is now absolute, covers the entire <a> tag, and scales on hover
						// Added rounded-r-sm to slightly round the right edge of the cover, mimicking pages.
					/>
				) : (
					// Fallback if no cover image is provided, still respecting aspect ratio
					<div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center text-center p-4">
						<span className="text-sm text-gray-500">
							{story.title || "External Book"}
						</span>
					</div>
				)}

				{/* Page edge effect */}

				{/* Text Overlay: Title, Description, and Languages */}
				<div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/70 to-transparent rounded-b-lg overflow-hidden">
					<h3 className="text-sm font-semibold text-white truncate hover:font-bold group-hover:text-orange-300 transition-colors duration-200">
						{story.title}
					</h3>

					{story.targetLanguage && story.sourceLanguage && (
						<p className="text-xs text-slate-200 mt-1">
							{story.targetLanguage} / {story.sourceLanguage}
						</p>
					)}
				</div>
			</a>
		);
	}

	return (
		<Link
			to={`/story/${story.shareId}`}
			className="group block h-full rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
		>
			<div className="relative p-6 flex flex-col justify-between h-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg rounded-xl overflow-hidden transition-shadow">
				<div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>

				{/* Header */}
				<div className="mb-4">
					<h3
						className="text-xl font-bold text-slate-800 group-hover:text-cyan-600 transition-colors line-clamp-3"
						title={storyTitle}
					>
						{storyTitle}
					</h3>
				</div>

				{/* Body - Metadata */}
				<div className="space-y-4 text-sm mb-6 flex-grow">
					<LanguageFlags
						source={story.sourceLanguage}
						target={story.targetLanguage}
					/>
					<DifficultyIndicator difficulty={story.difficulty} />
					<div className="flex items-center text-slate-500">
						<MessageCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
						<span>{wordCount > 0 ? `${wordCount} words` : "N/A"}</span>
					</div>
					<div className="flex items-center text-slate-500">
						<CalendarDays className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
						<span>{timeAgo}</span>
					</div>
				</div>

				{/* Footer - Actions */}
				<div className="mt-auto pt-4 border-t border-slate-200/90">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-4">
							<button
								onClick={handleLike}
								className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors duration-200"
								aria-label={isLiked ? "Unlike story" : "Like story"}
							>
								<Heart
									className={`w-5 h-5 transition-all ${
										isLiked ? "text-red-500 fill-current" : ""
									}`}
								/>
								<span className="font-medium text-sm">{likeCount}</span>
							</button>
							<button
								onClick={handleShare}
								className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors duration-200"
								aria-label="Share story"
							>
								<Share2 className="w-5 h-5" />
							</button>
						</div>
						<div className="flex items-center text-sm font-semibold text-cyan-600 group-hover:text-cyan-700 transition-colors">
							Read Story
							<BookOpen className="w-4 h-4 ml-2" />
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default StoryCard;
