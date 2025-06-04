import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setCookie, getCookie } from "@/lib/cookies";

// Custom switch wrapper styles for better visibility
const switchStyles = {
	width: "44px",
	height: "24px",
	minWidth: "44px",
	minHeight: "24px",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	position: "relative",
	borderRadius: "999px",
};

function CookieConsent() {
	const [isVisible, setIsVisible] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [preferences, setPreferences] = useState({
		essential: true, // Essential cookies can't be disabled
		analytics: true,
		preferences: true,
	});

	useEffect(() => {
		// Check if user has already made a choice
		// Look for either the main consent cookie or any of the specific ones
		const mainConsent = getCookie("cookieConsent");
		const analyticsConsent = getCookie("cookieConsent_analytics");
		const preferencesConsent = getCookie("cookieConsent_preferences");

		if (
			mainConsent === null &&
			analyticsConsent === null &&
			preferencesConsent === null
		) {
			// Only show banner if no choice has been made for any cookie type
			setIsVisible(true);
		}
	}, []);

	const handleToggleAnalytics = (checked) => {
		setPreferences((prev) => ({
			...prev,
			analytics: checked,
		}));
	};

	const handleTogglePreferences = (checked) => {
		setPreferences((prev) => ({
			...prev,
			preferences: checked,
		}));
	};

	const acceptAllCookies = () => {
		// Set both granular and main cookie consent
		setCookie("cookieConsent", "accepted", 365);
		setCookie("cookieConsent_analytics", "accepted", 365);
		setCookie("cookieConsent_preferences", "accepted", 365);

		setIsVisible(false);

		// Trigger analytics initialization
		window.dispatchEvent(new Event("cookieConsentAccepted"));
	};

	const declineAllCookies = () => {
		// Decline all cookie types
		setCookie("cookieConsent", "declined", 365);
		setCookie("cookieConsent_analytics", "declined", 365);
		setCookie("cookieConsent_preferences", "declined", 365);

		setIsVisible(false);
	};

	const savePreferences = () => {
		// Set individual cookies for each preference type
		setCookie(
			"cookieConsent_analytics",
			preferences.analytics ? "accepted" : "declined",
			365
		);
		setCookie(
			"cookieConsent_preferences",
			preferences.preferences ? "accepted" : "declined",
			365
		);

		// Set main consent cookie based on any accepted preferences
		const mainConsentValue =
			preferences.analytics || preferences.preferences
				? "accepted"
				: "declined";
		setCookie("cookieConsent", mainConsentValue, 365);

		// Trigger event for analytics if enabled
		if (preferences.analytics) {
			window.dispatchEvent(new Event("cookieConsentAccepted"));
		}

		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white shadow-xl z-50 border-t-2 border-amber-400">
			<div className="container mx-auto p-4 md:p-6">
				<div className="flex flex-col">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div className="mb-4 md:mb-0 md:mr-4 max-w-2xl">
							<h3 className="text-base md:text-lg font-semibold mb-2 text-gray-800">
								🍪 Cookie Preferences
							</h3>
							<p className="text-sm text-gray-700">
								We use cookies to enhance your experience, analyze our traffic,
								and for security. You can customize your preferences or accept
								all cookies.
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								className="text-sm"
								onClick={declineAllCookies}
							>
								Decline All
							</Button>

							<Button
								variant="outline"
								className="text-sm border-amber-500 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
								onClick={() => setShowDetails(!showDetails)}
							>
								Customize
							</Button>

							<Button
								className="text-sm bg-amber-400 hover:bg-amber-500 text-amber-950"
								onClick={acceptAllCookies}
							>
								Accept All
							</Button>
						</div>
					</div>

					{showDetails && (
						<div className="mt-6 border-t pt-4 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Essential Cookies */}
								<div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
									<div className="max-w-[70%]">
										<Label
											htmlFor="essential-cookies"
											className="text-base font-medium"
										>
											Essential Cookies
										</Label>
										<p className="text-xs text-gray-500 mt-1">
											Required for basic functionality
										</p>
									</div>
									<div className="flex items-center space-x-2">
										<span className="text-xs font-medium text-green-600">
											Always On
										</span>
										<div
											style={switchStyles}
											className="bg-amber-500 border-2 border-amber-600"
										>
											<Switch
												id="essential-cookies"
												checked={true}
												disabled={true}
												className="!h-6 !w-11"
											/>
										</div>
									</div>
								</div>

								{/* Analytics Cookies */}
								<div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
									<div className="max-w-[70%]">
										<Label
											htmlFor="analytics-cookies"
											className="text-base font-medium"
										>
											Analytics Cookies
										</Label>
										<p className="text-xs text-gray-500 mt-1">
											Help us improve our app
										</p>
									</div>
									<div className="flex items-center space-x-2">
										<span className="text-xs font-medium text-gray-500">
											{preferences.analytics ? "On" : "Off"}
										</span>
										<div
											style={switchStyles}
											className={
												preferences.analytics
													? "bg-amber-500 border-2 border-amber-600"
													: "bg-gray-300 border-2 border-gray-400"
											}
										>
											<Switch
												id="analytics-cookies"
												checked={preferences.analytics}
												onCheckedChange={handleToggleAnalytics}
												className="!h-6 !w-11"
											/>
										</div>
									</div>
								</div>

								{/* Preference Cookies */}
								<div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50 md:col-span-2">
									<div className="max-w-[70%]">
										<Label
											htmlFor="preference-cookies"
											className="text-base font-medium"
										>
											Preference Cookies
										</Label>
										<p className="text-xs text-gray-500 mt-1">
											Remember your settings
										</p>
									</div>
									<div className="flex items-center space-x-2">
										<span className="text-xs font-medium text-gray-500">
											{preferences.preferences ? "On" : "Off"}
										</span>
										<div
											style={switchStyles}
											className={
												preferences.preferences
													? "bg-amber-500 border-2 border-amber-600"
													: "bg-gray-300 border-2 border-gray-400"
											}
										>
											<Switch
												id="preference-cookies"
												checked={preferences.preferences}
												onCheckedChange={handleTogglePreferences}
												className="!h-6 !w-11"
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="flex justify-end mt-4">
								<Button
									className="text-sm bg-amber-400 hover:bg-amber-500 text-amber-950"
									onClick={savePreferences}
								>
									Save Preferences
								</Button>
							</div>
						</div>
					)}

					<div className="mt-3 text-xs text-gray-500">
						<a href="/privacy" className="text-amber-600 hover:underline">
							Privacy Policy
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

export default CookieConsent;
