import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Download, X, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Check if already installed
		const checkInstalled = () => {
			if (
				window.matchMedia &&
				window.matchMedia("(display-mode: standalone)").matches
			) {
				setIsInstalled(true);
				return;
			}

			// Check for iOS Safari
			if (window.navigator.standalone) {
				setIsInstalled(true);
				return;
			}

			// Check for Android Chrome
			if (window.navigator.getInstalledRelatedApps) {
				window.navigator.getInstalledRelatedApps().then((apps) => {
					if (apps.length > 0) {
						setIsInstalled(true);
					}
				});
			}
		};

		checkInstalled();

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);

			// Show install prompt after a small delay and only if not already installed
			setTimeout(() => {
				if (!isInstalled) {
					setShowInstallPrompt(true);
				}
			}, 10000); // Show after 10 seconds
		};

		// Listen for app installation
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setShowInstallPrompt(false);
			setDeferredPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, [isInstalled]);

	const handleInstallClick = async () => {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;

			if (outcome === "accepted") {
				console.log("User accepted the install prompt");
			} else {
				console.log("User dismissed the install prompt");
			}

			setDeferredPrompt(null);
			setShowInstallPrompt(false);
		}
	};

	const handleDismiss = () => {
		setShowInstallPrompt(false);
		// Remember user dismissed the prompt (store in localStorage)
		localStorage.setItem("duobook-install-dismissed", "true");
	};

	// Don't show if already installed or user previously dismissed
	if (
		isInstalled ||
		!showInstallPrompt ||
		localStorage.getItem("duobook-install-dismissed")
	) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 z-50 max-w-sm">
			<Card className="shadow-lg border-2 border-blue-200 bg-white">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							<Smartphone className="h-5 w-5 text-blue-600" />
							Install DuoBook
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
						Install DuoBook on your device for quick access and offline reading
						capabilities.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="flex gap-2">
						<Button
							onClick={handleInstallClick}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
							size="sm"
							disabled={!deferredPrompt}
						>
							<Download className="h-4 w-4 mr-2" />
							Install App
						</Button>
						<Button
							variant="outline"
							onClick={handleDismiss}
							size="sm"
							className="border-gray-300 hover:bg-gray-50"
						>
							Not Now
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
