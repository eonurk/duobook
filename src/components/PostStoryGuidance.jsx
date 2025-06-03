import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	BookOpen,
	Star,
	Target,
	Sparkles,
	ArrowRight,
	BookMarked,
	Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PostStoryGuidance = ({ isOpen, onClose, isFirstStory = false }) => {
	const navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(0);

	const celebrationSteps = [
		{
			id: "celebration",
			title: isFirstStory ? "🎉 Welcome to DuoBook!" : "🎉 Story Created!",
			description: isFirstStory
				? "Congratulations on creating your first story! Let's explore what you can do next."
				: "Your new story is ready to read. Here's what you can do now:",
			icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
		},
		{
			id: "saved-stories",
			title: "📚 Find Your Stories",
			description:
				"All your stories are automatically saved in 'My Stories'. You can access them anytime from the navigation menu.",
			icon: <BookMarked className="w-8 h-8 text-blue-500" />,
			action: {
				label: "View My Stories",
				onClick: () => {
					navigate("/my-stories");
					onClose();
				},
			},
		},
		{
			id: "practice",
			title: "🎯 Practice Vocabulary",
			description:
				"After reading each story, you'll see a 'Practice Vocabulary' button to reinforce what you've learned.",
			icon: <Target className="w-8 h-8 text-green-500" />,
		},
		{
			id: "features",
			title: "✨ More Features",
			description:
				"Track your progress, earn achievements, and explore stories from other learners in the community.",
			icon: <Trophy className="w-8 h-8 text-purple-500" />,
		},
	];

	const handleNext = () => {
		if (currentStep < celebrationSteps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onClose();
		}
	};

	const handleSkip = () => {
		onClose();
	};

	const currentStepData = celebrationSteps[currentStep];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[95vw] max-w-md mx-auto bg-white p-4 sm:p-6">
				<DialogHeader className="text-center">
					<div className="flex justify-center mb-3 sm:mb-4">
						{currentStepData.icon}
					</div>
					<DialogTitle className="text-lg sm:text-xl font-bold px-2">
						{currentStepData.title}
					</DialogTitle>
					<DialogDescription className="text-sm sm:text-base leading-relaxed px-2">
						{currentStepData.description}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 sm:space-y-4">
					{/* Progress indicators */}
					<div className="flex justify-center space-x-1.5 sm:space-x-2">
						{celebrationSteps.map((_, index) => (
							<div
								key={index}
								className={`w-2 h-2 rounded-full transition-colors ${
									index === currentStep
										? "bg-amber-400"
										: index < currentStep
										? "bg-gray-200"
										: "bg-gray-400"
								}`}
							/>
						))}
					</div>

					{/* Step-specific content */}
					{currentStep === 1 && (
						<Card className="bg-blue-50 border-blue-200">
							<CardContent className="p-3 sm:p-4">
								<div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
									<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
									<div>
										<p className="font-medium text-blue-900 text-sm sm:text-base">
											Quick Tip:
										</p>
										<p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
											Your stories stay private unless you choose to share them
											with the community.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{currentStep === 2 && (
						<Card className="bg-green-50 border-green-200">
							<CardContent className="p-3 sm:p-4">
								<div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
									<Star className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
									<div>
										<p className="font-medium text-green-900 text-sm sm:text-base">
											Pro Tip:
										</p>
										<p className="text-xs sm:text-sm text-green-700 leading-relaxed">
											Practice vocabulary right after reading for the best
											learning results!
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Action buttons */}
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between pt-3 sm:pt-4">
						<Button
							variant="ghost"
							onClick={handleSkip}
							className="text-gray-500 hover:text-gray-700 order-2 sm:order-1 text-sm"
						>
							Skip Tour
						</Button>

						<div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 order-1 sm:order-2">
							{currentStepData.action && (
								<Button
									variant="outline"
									onClick={currentStepData.action.onClick}
									className="flex items-center justify-center space-x-1 text-sm px-3 py-2"
								>
									<span className="truncate">
										{currentStepData.action.label}
									</span>
									<ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
								</Button>
							)}
							<Button
								onClick={handleNext}
								className="flex items-center justify-center space-x-1 bg-amber-400 hover:bg-amber-500 text-sm px-3 py-2"
							>
								<span>
									{currentStep === celebrationSteps.length - 1
										? "Get Started"
										: "Next"}
								</span>
								{currentStep < celebrationSteps.length - 1 && (
									<ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default PostStoryGuidance;
