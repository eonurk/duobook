import React, { useState } from "react";
import {
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebaseConfig"; // Import googleProvider
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
	const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Add loading state for Google

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

	const handleGoogleLogin = async () => {
		setError(null);
		setIsGoogleLoading(true); // Set Google loading state
		try {
			await signInWithPopup(auth, googleProvider);
			// Track successful login with Google
			trackAuth("login", "google");

			if (onSuccess) {
				onSuccess(); // Call the success callback if provided
			}
		} catch (err) {
			console.error("Google Login Error:", err);
			if (err.code === "auth/popup-closed-by-user") {
				setError("Login cancelled. Please try again.");
			} else if (err.code === "auth/popup-blocked") {
				setError(
					"Pop-up blocked by browser. Please allow pop-ups for this site."
				);
			} else {
				setError("Could not sign in with Google. Please try again.");
			}
		} finally {
			setIsGoogleLoading(false); // Unset Google loading
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
		<div className="grid gap-3">
			<form onSubmit={handleLogin}>
				<div className="grid gap-3">
					<div className="grid gap-1">
						<Label htmlFor="email" className="text-sm">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							autoCapitalize="none"
							autoComplete="email"
							autoCorrect="off"
							disabled={isLoading || isResetting}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="h-9"
						/>
					</div>
					<div className="grid gap-1">
						<div className="flex justify-between items-center">
							<Label htmlFor="password" className="text-sm">
								Password
							</Label>
							<button
								type="button"
								onClick={handlePasswordReset}
								disabled={isResetting || isLoading}
								className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
							>
								{isResetting ? "Sending..." : "Forgot Password?"}
							</button>
						</div>
						<Input
							id="password"
							type="password"
							disabled={isLoading || isResetting}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="h-9"
						/>
					</div>
					{/* Combined error messages area */}
					<div className="min-h-[1.5rem]">
						{resetMessage && (
							<p className="text-xs text-green-600 dark:text-green-400">
								{resetMessage}
							</p>
						)}
						{resetError && (
							<p className="text-xs text-red-600 dark:text-red-400">
								{resetError}
							</p>
						)}
						{error && (
							<p className="text-xs text-red-600 dark:text-red-400">{error}</p>
						)}
					</div>
					<Button
						type="submit"
						className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-amber-950"
						disabled={isLoading || isResetting || isGoogleLoading}
					>
						{isLoading ? "Logging in..." : "Login"}
					</Button>
				</div>
			</form>

			{/* Google Sign-in Button */}
			<div className="relative my-1">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t"></span>
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-white px-2 text-slate-500">or</span>
				</div>
			</div>

			<Button
				type="button"
				variant="outline"
				className="w-full py-2 border-gray-300 bg-white hover:bg-gray-50"
				onClick={handleGoogleLogin}
				disabled={isLoading || isResetting || isGoogleLoading}
			>
				{isGoogleLoading ? (
					"Signing in..."
				) : (
					<>
						<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
							<path
								d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0353 3.12C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
								fill="#EA4335"
							/>
							<path
								d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
								fill="#4285F4"
							/>
							<path
								d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
								fill="#FBBC05"
							/>
							<path
								d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.25 12.0004 19.25C8.8704 19.25 6.21537 17.14 5.2654 14.295L1.27539 17.39C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
								fill="#34A853"
							/>
						</svg>
						Sign in with Google
					</>
				)}
			</Button>
		</div>
	);
}

export default Login;
