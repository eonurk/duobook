import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setCookie, getCookie, deleteCookie } from "@/lib/cookies";
import { toast } from "react-hot-toast";

// Add custom styles for switches visibility
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

function CookieSettings() {
	const [preferences, setPreferences] = useState({
		essential: true, // Essential cookies can't be disabled
		analytics: false,
		preferences: false,
	});
	const [isSaving, setIsSaving] = useState(false);
	const [isClearing, setIsClearing] = useState(false);

	useEffect(() => {
		// Load current preferences from cookies
		const analyticsCookie = getCookie("cookieConsent_analytics");
		const preferencesCookie = getCookie("cookieConsent_preferences");
		const mainConsent = getCookie("cookieConsent");

		// Set preferences based on individual cookies if they exist
		if (analyticsCookie !== null || preferencesCookie !== null) {
			setPreferences({
				essential: true,
				analytics: analyticsCookie === "accepted",
				preferences: preferencesCookie === "accepted",
			});
		}
		// Fall back to main consent cookie for backwards compatibility
		else if (mainConsent === "accepted") {
			setPreferences({
				essential: true,
				analytics: true,
				preferences: true,
			});
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

	const savePreferences = async () => {
		setIsSaving(true);
		try {
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

			toast.success("Cookie preferences saved successfully");
		} catch (error) {
			console.error("Error saving cookie preferences:", error);
			toast.error("Failed to save preferences");
		} finally {
			setIsSaving(false);
		}
	};

	const clearAllCookies = async () => {
		setIsClearing(true);
		try {
			// Get all cookies
			const cookies = document.cookie.split(";");

			// Delete each cookie
			for (let i = 0; i < cookies.length; i++) {
				const cookie = cookies[i];
				const eqPos = cookie.indexOf("=");
				const name =
					eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

				// Avoid clearing essential cookies if needed
				if (!name.includes("XSRF") && !name.includes("session")) {
					deleteCookie(name);
				}
			}

			// Reset preferences
			setPreferences({
				essential: true,
				analytics: false,
				preferences: false,
			});

			// Set consent cookies to declined
			setCookie("cookieConsent", "declined", 365);
			setCookie("cookieConsent_analytics", "declined", 365);
			setCookie("cookieConsent_preferences", "declined", 365);

			toast.success("All cookies have been cleared");
		} catch (error) {
			console.error("Error clearing cookies:", error);
			toast.error("Failed to clear cookies");
		} finally {
			setIsClearing(false);
		}
	};

	return (
		<div className="bg-white  rounded-lg shadow p-6">
			<h2 className="text-xl font-semibold mb-4">Cookie Settings</h2>
			<p className="text-sm text-gray-600  mb-6">
				Manage how DuoBook uses cookies to enhance your experience.
			</p>

			<div className="space-y-6">
				{/* Essential Cookies */}
				<div className="flex items-center justify-between border-b pb-4">
					<div className="max-w-[70%]">
						<Label
							htmlFor="essential-cookies"
							className="text-base font-medium"
						>
							Essential Cookies
						</Label>
						<p className="text-sm text-gray-500 mt-1">
							Required for basic functionality and cannot be disabled
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
				<div className="flex items-center justify-between border-b pb-4">
					<div className="max-w-[70%]">
						<Label
							htmlFor="analytics-cookies"
							className="text-base font-medium"
						>
							Analytics Cookies
						</Label>
						<p className="text-sm text-gray-500  mt-1">
							Help us improve by collecting anonymous usage data
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
								disabled={isSaving || isClearing}
								className="!h-6 !w-11"
							/>
						</div>
					</div>
				</div>

				{/* Preference Cookies */}
				<div className="flex items-center justify-between border-b pb-4">
					<div className="max-w-[70%]">
						<Label
							htmlFor="preference-cookies"
							className="text-base font-medium"
						>
							Preference Cookies
						</Label>
						<p className="text-sm text-gray-500  mt-1">
							Remember your settings and preferences
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
								disabled={isSaving || isClearing}
								className="!h-6 !w-11"
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-between mt-8">
				<Button
					variant="outline"
					className="text-sm"
					onClick={clearAllCookies}
					disabled={isSaving || isClearing}
				>
					{isClearing ? "Clearing..." : "Clear All Cookies"}
				</Button>
				<Button
					className="text-sm bg-amber-400 hover:bg-amber-500 text-amber-950"
					onClick={savePreferences}
					disabled={isSaving || isClearing}
				>
					{isSaving ? "Saving..." : "Save Preferences"}
				</Button>
			</div>
		</div>
	);
}

export default CookieSettings;
