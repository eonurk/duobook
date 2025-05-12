import React from "react";
import { Link } from "react-router-dom";
import {
	Languages,
	BarChart3, // Or SignalLow, SignalMedium, SignalHigh based on difficulty value
	CalendarDays,
	ArrowRight,
} from "lucide-react";

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
	const storyTitle = story.description || "A User-Generated Story";
	const difficultyText = story.difficulty
		? story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)
		: "N/A";
	const timeAgo = story.createdAt
		? formatTimeAgo(story.createdAt)
		: "Some time ago";

	return (
		<div className="bg-white shadow-lg rounded-xl p-5 hover:shadow-xl transition-shadow h-full flex flex-col justify-between border border-slate-100">
			<div className="flex-grow">
				<h3
					className="text-lg font-semibold mb-2 text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2"
					title={storyTitle}
					style={{ minHeight: "2.5em" }} // Ensure space for two lines to avoid layout shifts
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

			<Link
				to={`/story/${story.shareId}`} // Updated to use story shareId in the URL
				// Remove state passing as story will be fetched based on ID
				className="mt-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors self-start group"
			>
				Read Story <ArrowRight className="w-4 h-4 ml-2" />
			</Link>
		</div>
	);
};

export default StoryCard;
