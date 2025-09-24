import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Download, X } from "lucide-react";

export default function PWAUpdateNotification() {
	const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
	const [registration, setRegistration] = useState(null);

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.getRegistration().then((reg) => {
				if (reg) {
					setRegistration(reg);

					// Check for updates
					reg.addEventListener("updatefound", () => {
						const newWorker = reg.installing;
						newWorker.addEventListener("statechange", () => {
							if (
								newWorker.state === "installed" &&
								navigator.serviceWorker.controller
							) {
								setShowUpdatePrompt(true);
							}
						});
					});
				}
			});

			// Listen for messages from service worker
			navigator.serviceWorker.addEventListener("message", (event) => {
				if (event.data && event.data.type === "CACHE_UPDATED") {
					setShowUpdatePrompt(true);
				}
			});

			// Check if there's a waiting service worker
			navigator.serviceWorker.ready.then((reg) => {
				if (reg.waiting) {
					setShowUpdatePrompt(true);
					setRegistration(reg);
				}
			});
		}
	}, []);

	const handleUpdate = () => {
		if (registration && registration.waiting) {
			registration.waiting.postMessage({ type: "SKIP_WAITING" });
			registration.waiting.addEventListener("statechange", () => {
				if (registration.waiting.state === "activated") {
					window.location.reload();
				}
			});
		} else {
			window.location.reload();
		}
	};

	const handleDismiss = () => {
		setShowUpdatePrompt(false);
	};

	if (!showUpdatePrompt) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-sm">
			<Card className="shadow-lg border-2 border-orange-200 bg-white">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							<Download className="h-5 w-5 text-orange-600" />
							Update Available
						</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDismiss}
							className="h-8 w-8 p-0 hover:bg-gray-100"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<CardDescription>
						A new version of DuoBook is available. Update now to get the latest
						features and improvements.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="flex gap-2">
						<Button
							onClick={handleUpdate}
							className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
							size="sm"
						>
							Update Now
						</Button>
						<Button
							variant="outline"
							onClick={handleDismiss}
							size="sm"
							className="border-gray-300 hover:bg-gray-50"
						>
							Later
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
