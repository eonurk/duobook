import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AchievementPopup } from "./Achievements";

/**
 * Component that monitors user achievements and displays a popup for newly earned ones
 */
function AchievementNotifier() {
	const { userAchievements } = useAuth();
	const [lastAchievementCount, setLastAchievementCount] = useState(0);
	const [newAchievements, setNewAchievements] = useState([]);

	// Compare previous achievement count with current to detect new ones
	useEffect(() => {
		if (!userAchievements) return;

		if (lastAchievementCount < userAchievements.length) {
			// Get the most recently earned achievements
			const newlyEarned = userAchievements
				.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
				.slice(0, userAchievements.length - lastAchievementCount)
				.map((ua) => ua.achievement);

			setNewAchievements(newlyEarned);

			// Auto-clear after 5 seconds
			const timer = setTimeout(() => {
				setNewAchievements([]);
			}, 5000);

			// Update last count
			setLastAchievementCount(userAchievements.length);

			return () => clearTimeout(timer);
		}
	}, [userAchievements, lastAchievementCount]);

	// When component mounts, set initial count
	useEffect(() => {
		if (userAchievements) {
			setLastAchievementCount(userAchievements.length);
		}
	}, []);

	return <AchievementPopup achievements={newAchievements} />;
}

export default AchievementNotifier;
