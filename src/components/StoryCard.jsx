import React from "react";
import { Link } from "react-router-dom";
import {
	Languages,
	BarChart3, // Or SignalLow, SignalMedium, SignalHigh based on difficulty value
	CalendarDays,
	ArrowRight,
	Share2,
	Copy,
	MessageCircle,
	Instagram,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

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

const StoryCard = ({ story }) => {
	const [showShareOptions, setShowShareOptions] = React.useState(false);
	const storyTitle = story.description || "A User-Generated Story";
	const difficultyText = story.difficulty
		? story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)
		: "N/A";
	const timeAgo = story.createdAt
		? formatTimeAgo(story.createdAt)
		: "Some time ago";

	const handleShare = async (event) => {
		event.stopPropagation();
		if (!story?.shareId) {
			toast.error("Share ID not available for this story.");
			return;
		}
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
				setShowShareOptions(false);
			} catch (err) {
				console.error("Error using Web Share API: ", err);
				if (err.name !== "AbortError") {
					toast.error("Could not share story.");
				}
			}
		} else {
			// For external links, native share might not be ideal if we just want to copy link or open directly.
			// However, keeping it for consistency if user expects share button to work similarly.
			// If it's an external link, perhaps the primary action is to open it, not share its internal-looking URL.
			setShowShareOptions((prev) => !prev);
		}
	};

	const handleCopyLink = (event, storyUrlToCopy, titleOfStory) => {
		event.stopPropagation();
		try {
			navigator.clipboard.writeText(storyUrlToCopy);
			toast.success(`Link for "${titleOfStory}" copied to clipboard!`);
		} catch (err) {
			console.error("Failed to copy story link: ", err);
			toast.error("Could not copy link.");
		}
		setShowShareOptions(false);
	};

	if (story.isExternal) {
		// Render a card with the image as a background and info overlay
		return (
			<a
				href={story.externalUrl}
				target="_blank"
				rel="noopener noreferrer"
				title={story.title} // For hover tooltip showing the book title
				className="relative block w-60 sm:w-72 md:w-full md:max-w-xs md:mx-auto bg-white shadow-xl rounded-lg hover:shadow-2xl transition-all duration-300 ease-in-out border border-slate-300 border-l-[8px] border-l-slate-400 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 aspect-[2/3] hover:-rotate-1 snap-center flex-shrink-0 perspective"
				// MODIFIED:
				// - Changed width from 'w-full max-w-xs mx-auto' to 'w-60 sm:w-72' for mobile scrolling.
				// - Added 'md:w-full md:max-w-xs md:mx-auto' to restore original grid sizing on medium screens and up.
				// - Added 'snap-center' for better scroll snapping alignment.
				// - Added 'flex-shrink-0' to prevent cards from shrinking in the flex container.
				// - Changed rounded-xl to rounded-lg for a slightly sharper book corner.
				// - Increased left border to border-l-[8px] for a thicker spine.
				// - Reduced hover rotation to hover:-rotate-1 for a more subtle effect.
				// - Added a utility class 'perspective' (to be defined in CSS) for 3D effect potential
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

				{/* Subtle page edge effect - a thin, slightly darker line on the right */}
				<div className="absolute top-0 right-0 bottom-0 w-px bg-slate-500 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

				{/* Overlay for information at the bottom left */}
				<div className="absolute bottom-0 left-0 p-3 bg-gradient-to-t from-black/70 to-transparent w-full">
					<h3 className="text-white text-sm font-semibold drop-shadow-md truncate">
						{story.title}
					</h3>
					{(story.sourceLanguage || story.targetLanguage) && (
						<p className="text-xs text-gray-200 drop-shadow-sm truncate">
							{story.sourceLanguage} to {story.targetLanguage}
						</p>
					)}
					{/* You can add more info here like story.length if available and desired */}
					{/* e.g., <p className="text-xs text-gray-300">Length: {story.length}</p> */}
				</div>
			</a>
		);
	}

	// Original card rendering for internal stories
	return (
		<div className="bg-white shadow-lg rounded-xl p-5 hover:shadow-xl transition-shadow h-full flex flex-col justify-between border border-slate-100 group">
			<div className="flex-grow">
				<h3
					className="text-lg font-semibold mb-2 text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2"
					title={storyTitle}
					style={{ minHeight: "2.5em" }}
				>
					{storyTitle}
				</h3>

				<div className="space-y-2 text-sm text-slate-600 mb-4">
					<div className="flex items-center">
						<Languages className="w-4 h-4 mr-2 text-sky-500 flex-shrink-0" />
						<span>
							{story.sourceLanguage || "Source Lang"} to{" "}
							{story.targetLanguage || "Target Lang"}
						</span>
					</div>
					<div className="flex items-center">
						<BarChart3 className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
						<span>Difficulty: {difficultyText}</span>
					</div>
					<div className="flex items-center">
						<CalendarDays className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
						<span>{timeAgo}</span>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between mt-auto">
				<Link
					to={`/story/${story.shareId}`}
					className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors group-hover:bg-orange-700"
				>
					Read Story <ArrowRight className="w-4 h-4 ml-2" />
				</Link>
				<div className="relative">
					<button
						onClick={handleShare}
						className="inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						title="Share Story"
					>
						<Share2 className="w-5 h-5" />
					</button>
					{showShareOptions && (
						<div className="absolute right-0 bottom-full mb-2 w-48 bg-white border rounded-md shadow-lg z-20 p-2 space-y-1">
							<Button
								variant="ghost"
								className="w-full flex items-center justify-start text-sm p-2 hover:bg-slate-100"
								onClick={(e) =>
									handleCopyLink(
										e,
										`${window.location.origin}/story/${story.shareId}`,
										storyTitle
									)
								}
							>
								<Copy className="h-4 w-4 mr-2" /> Copy Link
							</Button>
							<a
								href={`whatsapp://send?text=${encodeURIComponent(
									`Read "${storyTitle}" on DuoBook! ${window.location.origin}/story/${story.shareId}`
								)}`}
								data-action="share/whatsapp/share"
								target="_blank"
								rel="noopener noreferrer"
								className="w-full flex items-center justify-start text-sm p-2 hover:bg-slate-100 rounded-md"
								onClick={(e) => {
									e.stopPropagation();
									setShowShareOptions(false);
								}}
							>
								<MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
							</a>
							<Button
								variant="ghost"
								className="w-full flex items-center justify-start text-sm p-2 hover:bg-slate-100"
								onClick={(e) => {
									e.stopPropagation();
									handleCopyLink(
										e,
										`${window.location.origin}/story/${story.shareId}`,
										storyTitle
									);
									toast(
										"Link copied. Paste it in your Instagram story sticker!",
										{ icon: "📸" }
									);
									setShowShareOptions(false);
								}}
							>
								<Instagram className="h-4 w-4 mr-2" /> Instagram Story
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StoryCard;
