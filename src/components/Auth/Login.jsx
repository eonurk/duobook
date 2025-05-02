import React, { useState } from "react";
import {
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/firebaseConfig"; // Use alias
import { Button } from "@/components/ui/button"; // Use alias
import { Input } from "@/components/ui/input"; // Use alias
import { Label } from "@/components/ui/label"; // Use alias
import { trackAuth } from "@/lib/analytics"; // Import analytics tracking

function Login({ onSuccess }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false); // Add loading state
	const [isResetting, setIsResetting] = useState(false); // State for password reset loading
	const [resetMessage, setResetMessage] = useState(""); // State for success/error messages for reset
	const [resetError, setResetError] = useState(""); // State for reset error message specifically

	const handleLogin = async (e) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true); // Set loading
		try {
			await signInWithEmailAndPassword(auth, email, password);
			// Track successful login
			trackAuth("login", "email");

			// Login successful, AuthProvider handles state change & App.jsx handles redirect
			if (onSuccess) {
				onSuccess(); // Call the success callback if provided
			}
		} catch (err) {
			console.error("Login Error:", err);
			if (
				err.code === "auth/invalid-credential" ||
				err.code === "auth/wrong-password" ||
				err.code === "auth/user-not-found" ||
				err.code === "auth/invalid-email"
			) {
				setError("Invalid email or password.");
			} else if (err.code === "auth/too-many-requests") {
				setError("Too many login attempts. Please try again later.");
			} else {
				setError("An unexpected error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false); // Unset loading
		}
	};

	const handlePasswordReset = async () => {
		if (!email) {
			setResetError("Please enter your email address first.");
			setResetMessage(""); // Clear any previous success message
			return;
		}
		setError(null); // Clear login errors
		setResetError("");
		setResetMessage("");
		setIsResetting(true);
		try {
			await sendPasswordResetEmail(auth, email);
			setResetMessage("Password reset email sent! Check your inbox.");
			setResetError("");
		} catch (err) {
			console.error("Password Reset Error:", err);
			if (
				err.code === "auth/user-not-found" ||
				err.code === "auth/invalid-email"
			) {
				setResetError("Could not find an account with that email address.");
			} else {
				setResetError("Failed to send password reset email. Please try again.");
			}
			setResetMessage("");
		} finally {
			setIsResetting(false);
		}
	};

	return (
		// Use grid layout and Tailwind classes like the example
		<div className="grid gap-6">
			<form onSubmit={handleLogin}>
				<div className="grid gap-4">
					{" "}
					{/* Increased gap */}
					<div className="grid gap-2">
						{" "}
						{/* Increased gap */}
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							autoCapitalize="none"
							autoComplete="email"
							autoCorrect="off"
							disabled={isLoading || isResetting} // Disable if logging in or resetting
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						{" "}
						{/* Increased gap */}
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							disabled={isLoading || isResetting} // Disable if logging in or resetting
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<div className="text-right text-sm mt-1">
							{" "}
							{/* Container for the link */}
							<button
								type="button"
								onClick={handlePasswordReset}
								disabled={isResetting || isLoading} // Disable if busy
								className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
							>
								{isResetting ? "Sending..." : "Forgot Password?"}
							</button>
						</div>
					</div>
					{/* Display Reset Messages */}
					{resetMessage && (
						<p className="text-sm text-green-600 dark:text-green-400">
							{resetMessage}
						</p>
					)}
					{resetError && (
						<p className="text-sm text-red-600 dark:text-red-400">
							{resetError}
						</p>
					)}
					{/* Display Login Error */}
					{error && (
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					)}
					<Button
						type="submit"
						className="w-full bg-amber-300 py-4"
						disabled={isLoading || isResetting}
					>
						{isLoading ? "Logging in..." : "Login"}
					</Button>
				</div>
			</form>
		</div>
	);
}

export default Login;
