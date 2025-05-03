import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/firebaseConfig"; // Import googleProvider
import { Button } from "@/components/ui/button"; // Use alias
import { Input } from "@/components/ui/input"; // Use alias
import { Label } from "@/components/ui/label"; // Use alias
import { trackAuth } from "@/lib/analytics"; // Import analytics tracking

function Signup({ onSuccess }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	const handleSignup = async (e) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			// Track successful signup
			trackAuth("signup", "email");

			// Signup successful, AuthProvider handles state change & App.jsx handles redirect
			if (onSuccess) {
				onSuccess(); // Call the success callback if provided
			}
		} catch (err) {
			console.error("Signup Error:", err);
			if (err.code === "auth/email-already-in-use") {
				setError("This email address is already in use.");
			} else if (err.code === "auth/weak-password") {
				setError("Password is too weak. Please use at least 6 characters.");
			} else if (err.code === "auth/invalid-email") {
				setError("Please enter a valid email address.");
			} else {
				setError(
					"An unexpected error occurred during sign up. Please try again."
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignup = async () => {
		setError(null);
		setIsGoogleLoading(true);
		try {
			await signInWithPopup(auth, googleProvider);
			// Track successful signup with Google
			trackAuth("signup", "google");

			if (onSuccess) {
				onSuccess(); // Call the success callback if provided
			}
		} catch (err) {
			console.error("Google Signup Error:", err);
			if (err.code === "auth/popup-closed-by-user") {
				setError("Sign up cancelled. Please try again.");
			} else if (err.code === "auth/popup-blocked") {
				setError(
					"Pop-up blocked by browser. Please allow pop-ups for this site."
				);
			} else {
				setError("Could not sign up with Google. Please try again.");
			}
		} finally {
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="grid gap-3">
			<form onSubmit={handleSignup}>
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
							disabled={isLoading || isGoogleLoading}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="h-9"
						/>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="password" className="text-sm">
							Password
						</Label>
						<Input
							id="password"
							type="password"
							disabled={isLoading || isGoogleLoading}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="h-9"
						/>
					</div>
					<div className="min-h-[1.5rem]">
						{error && (
							<p className="text-xs text-red-600 dark:text-red-400">{error}</p>
						)}
					</div>
					<Button
						type="submit"
						className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white"
						disabled={isLoading || isGoogleLoading}
					>
						{isLoading ? "Creating account..." : "Create Account"}
					</Button>
				</div>
			</form>

			{/* Google Sign-up Button */}
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
				onClick={handleGoogleSignup}
				disabled={isLoading || isGoogleLoading}
			>
				{isGoogleLoading ? (
					"Signing up..."
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
						Sign up with Google
					</>
				)}
			</Button>
		</div>
	);
}

export default Signup;
