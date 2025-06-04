import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Login from "@/components/Auth/Login";
import Signup from "@/components/Auth/Signup";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function AuthDialog({ open, onOpenChange, initialTab = "login" }) {
	const [activeTab, setActiveTab] = useState(initialTab);

	// Update activeTab when initialTab changes (for external control)
	React.useEffect(() => {
		setActiveTab(initialTab);
	}, [initialTab]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px] p-0 border-none">
				<Card className="border-none shadow-none bg-white">
					<CardHeader className="text-center pb-4">
						<CardTitle className="text-xl font-semibold text-gray-900">
							Welcome to DuoBook
						</CardTitle>
						<CardDescription className="text-gray-600">
							Create and save personalized stories for language learning
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-6">
						{/* Modern segmented control tabs */}
						<div className="flex mb-6 bg-gray-100 rounded-lg p-1">
							<button
								className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
									activeTab === "login"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
								onClick={() => setActiveTab("login")}
							>
								Login
							</button>
							<button
								className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
									activeTab === "signup"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
								onClick={() => setActiveTab("signup")}
							>
								Sign Up
							</button>
						</div>

						{activeTab === "login" ? (
							<Login onSuccess={() => onOpenChange(false)} />
						) : (
							<Signup onSuccess={() => onOpenChange(false)} />
						)}
					</CardContent>
				</Card>
			</DialogContent>
		</Dialog>
	);
}

export default AuthDialog;
