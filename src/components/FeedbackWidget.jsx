import React, { useState } from "react";
import { MessageSquare, X, Send, Lightbulb, Bug, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const FeedbackWidget = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [feedbackType, setFeedbackType] = useState("general");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { currentUser } = useAuth();

	const feedbackTypes = [
		{
			id: "general",
			label: "General Feedback",
			icon: MessageSquare,
			color: "text-blue-500",
		},
		{
			id: "feature",
			label: "Feature Request",
			icon: Lightbulb,
			color: "text-yellow-500",
		},
		{ id: "bug", label: "Report Bug", icon: Bug, color: "text-red-500" },
		{
			id: "compliment",
			label: "Compliment",
			icon: Heart,
			color: "text-pink-500",
		},
	];

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!message.trim()) {
			toast.error("Please enter your feedback");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: currentUser?.displayName || currentUser?.email || "Anonymous",
					email: currentUser?.email || "anonymous@duobook.co",
					subject: `${
						feedbackTypes.find((t) => t.id === feedbackType)?.label
					} - Quick Feedback`,
					message: `Feedback Type: ${
						feedbackTypes.find((t) => t.id === feedbackType)?.label
					}\n\nMessage:\n${message}`,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to send feedback");
			}

			toast.success("Thanks for your feedback! We appreciate it 🧡");
			setMessage("");
			setIsOpen(false);
		} catch (error) {
			console.error("Error sending feedback:", error);
			toast.error("Failed to send feedback. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{/* Floating Feedback Button - Hidden on mobile */}
			<div className="fixed bottom-6 right-6 z-50 hidden md:block">
				{!isOpen && (
					<Button
						onClick={() => setIsOpen(true)}
						className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-full h-12 w-12 p-0"
						title="Send us feedback"
					>
						<MessageSquare className="h-5 w-5" />
					</Button>
				)}
			</div>

			{/* Feedback Modal - Hidden on mobile */}
			{isOpen && (
				<div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] hidden md:block">
					<div className="bg-white border border-gray-200 rounded-lg shadow-2xl">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b">
							<h3 className="font-semibold text-gray-900">Quick Feedback</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsOpen(false)}
								className="h-6 w-6 p-0"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Content */}
						<form onSubmit={handleSubmit} className="p-4 space-y-4">
							{/* Feedback Type Selection */}
							<div>
								<Label className="text-sm font-medium mb-2 block">
									What's this about?
								</Label>
								<div className="grid grid-cols-2 gap-2">
									{feedbackTypes.map((type) => {
										const IconComponent = type.icon;
										return (
											<button
												key={type.id}
												type="button"
												onClick={() => setFeedbackType(type.id)}
												className={`p-2 rounded-lg border text-left transition-colors ${
													feedbackType === type.id
														? "border-amber-300 bg-amber-50"
														: "border-gray-200 hover:border-gray-300"
												}`}
											>
												<div className="flex items-center space-x-2">
													<IconComponent className={`h-4 w-4 ${type.color}`} />
													<span className="text-xs font-medium">
														{type.label}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							</div>

							{/* Message */}
							<div>
								<Label
									htmlFor="feedback-message"
									className="text-sm font-medium mb-2 block"
								>
									Your feedback
								</Label>
								<Textarea
									id="feedback-message"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="Tell us what you think..."
									className="min-h-[100px] text-sm"
									disabled={isSubmitting}
								/>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={isSubmitting || !message.trim()}
								className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
										Sending...
									</>
								) : (
									<>
										<Send className="h-4 w-4 mr-2" />
										Send Feedback
									</>
								)}
							</Button>
						</form>
					</div>
				</div>
			)}
		</>
	);
};

export default FeedbackWidget;
