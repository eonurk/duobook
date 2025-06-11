import React, { useState, useEffect } from "react";
import {
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithPopup,
	signInWithRedirect,
	getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackAuth } from "@/lib/analytics";
import {
	Eye,
	EyeOff,
	Mail,
	Shield,
	ArrowRight,
	CheckCircle,
	XCircle,
	Key,
} from "lucide-react";

function ModernLogin({ onSuccess }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [resetMessage, setResetMessage] = useState("");
	const [resetError, setResetError] = useState("");
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Check for redirect result on component mount
	useEffect(() => {
		async function checkRedirectResult() {
			try {
				const result = await getRedirectResult(auth);
				if (result) {
					trackAuth("login", "google");
					if (onSuccess) {
						onSuccess();
					}
				}
			} catch (err) {
				console.error("Redirect authentication error:", err);
				if (err.code !== "auth/credential-already-in-use") {
					setError(
						"An error occurred with Google sign-in. Please try again or use email login."
					);
				}
			}
		}
		checkRedirectResult();
	}, [onSuccess]);

	// Add useEffect for mobile detection
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const handleLogin = async (e) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		try {
			await signInWithEmailAndPassword(auth, email, password);
			trackAuth("login", "email");
			if (onSuccess) {
				onSuccess();
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
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setError(null);
		setIsGoogleLoading(true);
		try {
			await signInWithPopup(auth, googleProvider);
			trackAuth("login", "google");
			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			console.error("Google Login Error:", err);
			if (
				err.code === "auth/popup-blocked" ||
				err.code === "auth/unauthorized-domain"
			) {
				try {
					await signInWithRedirect(auth, googleProvider);
				} catch (redirectErr) {
					console.error("Redirect auth error:", redirectErr);
					setError(
						"Could not sign in with Google. Please try again or use email login."
					);
				}
			} else if (err.code === "auth/popup-closed-by-user") {
				setError("Login cancelled. Please try again.");
			} else {
				setError(
					"Could not sign in with Google. Please try again or use email login."
				);
			}
		} finally {
			setIsGoogleLoading(false);
		}
	};

	const handlePasswordReset = async () => {
		if (!email) {
			setResetError("Please enter your email address first.");
			setResetMessage("");
			return;
		}
		setError(null);
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
		<div className="w-full max-w-md mx-auto">
			<form onSubmit={handleLogin} className={`space-y-${isMobile ? "4" : "6"}`}>
				{/* Email Input */}
				<div className="space-y-2">
					<Label
						htmlFor="email"
						className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-gray-700`}
					>
						Email Address
					</Label>
					<div className="relative">
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							autoCapitalize="none"
							autoComplete="email"
							autoCorrect="off"
							disabled={isLoading || isResetting || isGoogleLoading}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className={`${isMobile ? "h-12 text-sm" : "h-14 text-base"} pl-4 pr-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 bg-white focus:ring-4 focus:ring-blue-500/10 shadow-lg transition-all duration-300`}
						/>
					</div>
				</div>

				{/* Password Input */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label
							htmlFor="password"
							className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-gray-700`}
						>
							Password
						</Label>
						<button
							type="button"
							onClick={handlePasswordReset}
							disabled={isResetting || isLoading || isGoogleLoading}
							className={`${isMobile ? "text-xs" : "text-sm"} text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors`}
						>
							{isResetting ? "Sending..." : "Forgot Password?"}
						</button>
					</div>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="Enter your password"
							disabled={isLoading || isResetting || isGoogleLoading}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className={`${isMobile ? "h-12 text-sm" : "h-14 text-base"} pl-4 pr-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 bg-white focus:ring-4 focus:ring-blue-500/10 shadow-lg transition-all duration-300`}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600  transition-colors"
							disabled={isLoading || isResetting || isGoogleLoading}
						>
							<div className="w-6 h-6 flex items-center justify-center">
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</div>
						</button>
					</div>
				</div>

				{/* Messages with adjusted padding */}
				<div className="space-y-3">
					{resetMessage && (
						<div className={`p-${isMobile ? "3" : "4"} bg-emerald-50 border border-emerald-200 rounded-2xl`}>
							<p className={`${isMobile ? "text-xs" : "text-sm"} text-emerald-700 flex items-center gap-2`}>
								<CheckCircle className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
								{resetMessage}
							</p>
						</div>
					)}
					{resetError && (
						<div className="p-4 bg-red-50 border border-red-200  rounded-2xl">
							<p className="text-sm text-red-700 flex items-center gap-2">
								<XCircle className="h-4 w-4" />
								{resetError}
							</p>
						</div>
					)}
					{error && (
						<div className="p-4 bg-red-50  border border-red-200 rounded-2xl">
							<p className="text-sm text-red-700  flex items-center gap-2">
								<XCircle className="h-4 w-4" />
								{error}
							</p>
						</div>
					)}
				</div>

				{/* Submit Button */}
				<Button
					type="submit"
					className={`w-full ${isMobile ? "h-12 text-sm" : "h-14 text-base"} bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
					disabled={isLoading || isResetting || isGoogleLoading}
				>
					{isLoading ? (
						<div className="flex items-center gap-2">
							<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							Logging in...
						</div>
					) : (
						<div className="flex items-center justify-center gap-2">
							Login
							<ArrowRight className="h-5 w-5" />
						</div>
					)}
				</Button>
			</form>

			{/* Divider with adjusted margins */}
			<div className={`relative ${isMobile ? "my-3" : "my-4"}`}>
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200 "></div>
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="bg-white  px-4 text-gray-500 font-medium">
						or continue with
					</span>
				</div>
			</div>

			{/* Google Sign-in Button */}
			<Button
				type="button"
				variant="outline"
				className={`w-full ${isMobile ? "h-12 text-sm" : "h-14 text-base"} border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
				onClick={handleGoogleLogin}
				disabled={isLoading || isResetting || isGoogleLoading}
			>
				{isGoogleLoading ? (
					<div className="flex items-center gap-3">
						<div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
						Signing in...
					</div>
				) : (
					<div className="flex items-center justify-center gap-3">
						<svg className="w-5 h-5" viewBox="0 0 24 24">
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
					</div>
				)}
			</Button>
		</div>
	);
}

export default ModernLogin;
