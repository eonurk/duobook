import React, { useState, useEffect } from "react";
import {
	createUserWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	getRedirectResult,
	sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackAuth } from "@/lib/analytics";
import {
	CheckCircle,
	XCircle,
	Eye,
	EyeOff,
	Mail,
	Shield,
	Users,
	Clock,
	Sparkles,
	ArrowRight,
} from "lucide-react";

function ModernSignup({ onSuccess }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [emailValidation, setEmailValidation] = useState({
		isValid: true,
		message: "",
	});
	const [passwordValidation, setPasswordValidation] = useState({
		isValid: true,
		message: "",
	});
	const [signupAttempts, setSignupAttempts] = useState(0);
	const [lastAttemptTime, setLastAttemptTime] = useState(null);
	const [emailSent, setEmailSent] = useState(false);

	// Email validation function (same as before)
	const validateEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const disposableEmailRegex =
			/^[^\s@]+@(10minutemail|guerrillamail|mailinator|tempmail|throwaway|yopmail|temp-mail|fakeinbox|getnada|maildrop|sharklasers|guerrillamailblock|spam4|mohmal|tempail|dispostable|mintemail|mytrashmail|no-spam|spamgourmet|tempemail|trashmail|emailondeck|mailnesia|jetable|getairmail|mail-temp|temp-inbox|emailsensei|tempinbox|throwawayemails|temporaryemail|meltmail|biggiemails|fakemail|tempemails|20minutemail|anonbox|bouncr|bugmenot|deadaddress|spamhole|tempemailer|trbvn|fakeemailgenerator|inboxalias|throwawaymails|disposableemailaddresses|anonymousemail|tempyemail)\.com$/i;

		if (!email) {
			return { isValid: false, message: "Email is required" };
		}
		if (!emailRegex.test(email)) {
			return { isValid: false, message: "Please enter a valid email address" };
		}
		if (disposableEmailRegex.test(email)) {
			return {
				isValid: false,
				message: "Disposable email addresses are not allowed",
			};
		}

		// Enhanced validation to prevent random/fake emails
		const [localPart, domain] = email.split("@");

		// Check for obviously fake local parts
		const fakePatterns = [
			/^(test|fake|dummy|temp|sample|example|asdf|qwerty|admin|root|user|abc|xyz|random|demo)\d*$/i,
			/^[a-z]{1,3}\d*$/i,
			/^(.)\1{3,}$/i,
			/^[a-z]*123+$/i,
			/^(keyboard|password|letmein|welcome)\d*$/i,
			/^[a-z]{10,}$/i,
		];

		if (fakePatterns.some((pattern) => pattern.test(localPart))) {
			return {
				isValid: false,
				message: "Please use a real email address from your email provider",
			};
		}

		if (localPart.length < 3) {
			return {
				isValid: false,
				message: "Email address appears to be too short to be valid",
			};
		}

		const commonDomains = [
			"gmail.com",
			"yahoo.com",
			"outlook.com",
			"hotmail.com",
			"icloud.com",
			"protonmail.com",
			"aol.com",
			"live.com",
			"msn.com",
			"comcast.net",
		];

		const fakeDomainPatterns = [
			/^(test|fake|dummy|temp|sample|example|asdf|qwerty|random|demo|abc|xyz)\.(com|org|net|edu)$/i,
			/^(.)\1{2,}\.(com|org|net|edu)$/i,
			/^[a-z]{1,4}\.(com|org|net|edu)$/i,
			/^(asdasd|qweqwe|abcabc|testtest|demotest)\.(com|org|net|edu)$/i,
		];

		if (fakeDomainPatterns.some((pattern) => pattern.test(domain))) {
			return {
				isValid: false,
				message: "Please use a valid email from a legitimate email provider",
			};
		}

		// For common domains, apply stricter validation
		const isCommonDomain = commonDomains.some(
			(commonDomain) =>
				domain === commonDomain || domain.endsWith("." + commonDomain)
		);

		if (isCommonDomain) {
			// Additional checks for common providers
			if (localPart.length < 4 && !/\d/.test(localPart)) {
				return {
					isValid: false,
					message: "Please enter a complete email address",
				};
			}
		} else {
			// For non-common domains, require they look legitimate
			// Allow company/organization domains that follow proper naming conventions
			const domainName = domain.split(".")[0];
			if (
				!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(domainName) &&
				domainName.length > 2
			) {
				return {
					isValid: false,
					message: "Please use a valid email from a legitimate provider",
				};
			}
		}

		return { isValid: true, message: "" };
	};
	// Password validation function (same as before)
	const validatePassword = (password) => {
		if (!password) {
			return { isValid: false, message: "Password is required" };
		}

		const checks = {
			length: password.length >= 8,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			number: /\d/.test(password),
			special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
		};

		const score = Object.values(checks).filter(Boolean).length;

		if (!checks.length) {
			return {
				isValid: false,
				message: "Password must be at least 8 characters long",
			};
		}
		if (!checks.lowercase) {
			return {
				isValid: false,
				message: "Password must contain at least one lowercase letter",
			};
		}
		if (!checks.uppercase) {
			return {
				isValid: false,
				message: "Password must contain at least one uppercase letter",
			};
		}
		if (!checks.number) {
			return {
				isValid: false,
				message: "Password must contain at least one number",
			};
		}
		if (score < 4) {
			return {
				isValid: false,
				message:
					"Password should include a special character for better security",
			};
		}

		const commonPasswords = [
			"password",
			"password123",
			"123456789",
			"qwerty123",
			"admin123",
			"welcome123",
			"Password123",
			"user123",
			"test123",
			"demo123",
		];

		if (
			commonPasswords.some((common) =>
				password.toLowerCase().includes(common.toLowerCase())
			)
		) {
			return {
				isValid: false,
				message: "Please avoid common passwords for better security",
			};
		}

		return { isValid: true, message: "" };
	};

	// Real-time validation effects
	useEffect(() => {
		if (email) {
			const validation = validateEmail(email);
			setEmailValidation(validation);
		} else {
			setEmailValidation({ isValid: true, message: "" });
		}
	}, [email]);

	useEffect(() => {
		if (password) {
			const validation = validatePassword(password);
			setPasswordValidation(validation);
		} else {
			setPasswordValidation({ isValid: true, message: "" });
		}
	}, [password]);

	// Check for redirect result on component mount
	useEffect(() => {
		async function checkRedirectResult() {
			try {
				const result = await getRedirectResult(auth);
				if (result) {
					trackAuth("signup", "google");
					if (onSuccess) {
						onSuccess();
					}
				}
			} catch (err) {
				console.error("Redirect authentication error:", err);
				if (err.code !== "auth/credential-already-in-use") {
					setError(
						"An error occurred with Google sign-up. Please try again or use email sign-up."
					);
				}
			}
		}
		checkRedirectResult();
	}, [onSuccess]);

	const handleSignup = async (e) => {
		e.preventDefault();
		setError(null);

		// Rate limiting check
		const now = Date.now();
		if (lastAttemptTime && now - lastAttemptTime < 3000) {
			setError("Please wait a moment before trying again");
			return;
		}

		if (signupAttempts >= 3 && now - lastAttemptTime < 300000) {
			setError(
				"Too many signup attempts. Please wait 5 minutes before trying again."
			);
			return;
		}

		// Validate email
		const emailVal = validateEmail(email);
		if (!emailVal.isValid) {
			setError(emailVal.message);
			setSignupAttempts((prev) => prev + 1);
			setLastAttemptTime(now);
			return;
		}

		// Validate password
		const passwordVal = validatePassword(password);
		if (!passwordVal.isValid) {
			setError(passwordVal.message);
			setSignupAttempts((prev) => prev + 1);
			setLastAttemptTime(now);
			return;
		}

		// Check password confirmation
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setSignupAttempts((prev) => prev + 1);
			setLastAttemptTime(now);
			return;
		}

		// Check terms agreement
		if (!agreedToTerms) {
			setError("You must agree to the Terms of Service to create an account");
			setSignupAttempts((prev) => prev + 1);
			setLastAttemptTime(now);
			return;
		}

		setIsLoading(true);
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);

			// Send email verification
			try {
				await sendEmailVerification(userCredential.user);
				setEmailSent(true);
				console.log("Verification email sent successfully");
			} catch (emailError) {
				console.warn("Could not send verification email:", emailError);
			}

			trackAuth("signup", "email");
			setSignupAttempts(0);
			setLastAttemptTime(null);

			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			console.error("Signup Error:", err);
			setSignupAttempts((prev) => prev + 1);
			setLastAttemptTime(now);

			if (err.code === "auth/email-already-in-use") {
				setError("This email address is already in use.");
			} else if (err.code === "auth/weak-password") {
				setError("Password is too weak. Please use a stronger password.");
			} else if (err.code === "auth/invalid-email") {
				setError("Please enter a valid email address.");
			} else if (err.code === "auth/operation-not-allowed") {
				setError(
					"Account creation is currently disabled. Please try again later."
				);
			} else if (err.code === "auth/too-many-requests") {
				setError("Too many signup attempts. Please try again later.");
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
			trackAuth("signup", "google");
			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			console.error("Google Signup Error:", err);
			if (
				err.code === "auth/popup-blocked" ||
				err.code === "auth/unauthorized-domain"
			) {
				try {
					await signInWithRedirect(auth, googleProvider);
				} catch (redirectErr) {
					console.error("Redirect auth error:", redirectErr);
					setError(
						"Could not sign up with Google. Please try again or use email sign-up."
					);
				}
			} else if (err.code === "auth/popup-closed-by-user") {
				setError("Sign up cancelled. Please try again.");
			} else {
				setError(
					"Could not sign up with Google. Please try again or use email sign-up."
				);
			}
		} finally {
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="w-full max-w-md mx-auto">
			{/* Email verification success banner */}
			{emailSent && (
				<div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
							<Mail className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<h4 className="font-semibold text-blue-900 mb-1">
								Verification Email Sent!
							</h4>
							<p className="text-sm text-blue-700">
								We've sent a verification link to{" "}
								<span className="font-medium">{email}</span>. Please check your
								inbox and click the link to verify your account.
							</p>
						</div>
					</div>
				</div>
			)}

			<form onSubmit={handleSignup} className="space-y-6">
				{/* Email Input */}
				<div className="space-y-2">
					<Label
						htmlFor="email"
						className="text-sm font-semibold text-gray-700"
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
							disabled={isLoading || isGoogleLoading}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className={`h-14 pl-4 pr-12 rounded-2xl border-2 transition-all duration-300 text-base ${
								!emailValidation.isValid && email
									? "border-red-500 focus:border-red-500 bg-red-50/50 shadow-red-100"
									: emailValidation.isValid && email
									? "border-emerald-500 focus:border-emerald-500 bg-emerald-50/50 shadow-emerald-100"
									: "border-gray-200 focus:border-amber-500 bg-white"
							} focus:ring-4 focus:ring-amber-500/10 shadow-lg`}
						/>
						{emailValidation.isValid && email && (
							<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
								<div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
									<CheckCircle className="h-4 w-4 text-emerald-600" />
								</div>
							</div>
						)}
						{!emailValidation.isValid && email && (
							<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
								<div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
									<XCircle className="h-4 w-4 text-red-600" />
								</div>
							</div>
						)}
					</div>
					{!emailValidation.isValid && email && (
						<p className="text-sm text-red-600 flex items-center gap-2 mt-2">
							<XCircle className="h-4 w-4" />
							{emailValidation.message}
						</p>
					)}
				</div>

				{/* Password Input */}
				<div className="space-y-2">
					<Label
						htmlFor="password"
						className="text-sm font-semibold text-gray-700"
					>
						Password
					</Label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="Create a strong password"
							disabled={isLoading || isGoogleLoading}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className={`h-14 pl-4 pr-12 rounded-2xl border-2 transition-all duration-300 text-base ${
								!passwordValidation.isValid && password
									? "border-red-500 focus:border-red-500 bg-red-50/50"
									: passwordValidation.isValid && password
									? "border-emerald-500 focus:border-emerald-500 bg-emerald-50/50"
									: "border-gray-200 focus:border-amber-500 bg-white"
							} focus:ring-4 focus:ring-amber-500/10 shadow-lg`}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							disabled={isLoading || isGoogleLoading}
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
					{!passwordValidation.isValid && password && (
						<p className="text-sm text-red-600 flex items-center gap-2 mt-2">
							<XCircle className="h-4 w-4" />
							{passwordValidation.message}
						</p>
					)}
				</div>

				{/* Confirm Password Input */}
				<div className="space-y-2">
					<Label
						htmlFor="confirmPassword"
						className="text-sm font-semibold text-gray-700"
					>
						Confirm Password
					</Label>
					<div className="relative">
						<Input
							id="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							placeholder="Confirm your password"
							disabled={isLoading || isGoogleLoading}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className={`h-14 pl-4 pr-12 rounded-2xl border-2 transition-all duration-300 text-base ${
								confirmPassword && password !== confirmPassword
									? "border-red-500 focus:border-red-500 bg-red-50/50"
									: confirmPassword && password === confirmPassword
									? "border-emerald-500 focus:border-emerald-500 bg-emerald-50/50"
									: "border-gray-200 focus:border-amber-500 bg-white"
							} focus:ring-4 focus:ring-amber-500/10 shadow-lg`}
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							disabled={isLoading || isGoogleLoading}
						>
							<div className="w-6 h-6 flex items-center justify-center">
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</div>
						</button>
					</div>
					{confirmPassword && password !== confirmPassword && (
						<p className="text-sm text-red-600 flex items-center gap-2 mt-2">
							<XCircle className="h-4 w-4" />
							Passwords do not match
						</p>
					)}
				</div>

				{/* Terms and Conditions */}
				<div className="space-y-4">
					<div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
						<input
							type="checkbox"
							id="terms"
							checked={agreedToTerms}
							onChange={(e) => setAgreedToTerms(e.target.checked)}
							className="mt-1 h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded-lg flex-shrink-0 cursor-pointer"
							disabled={isLoading || isGoogleLoading}
						/>
						<div className="flex-1">
							<Label
								htmlFor="terms"
								className="text-sm text-gray-700 leading-relaxed cursor-pointer block"
							>
								I agree to DuoBook's{" "}
								<a
									href="/terms"
									target="_blank"
									rel="noopener noreferrer"
									className="text-amber-700 hover:text-amber-800 underline font-semibold transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									Terms of Service
								</a>{" "}
								and{" "}
								<a
									href="/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="text-amber-700 hover:text-amber-800 underline font-semibold transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									Privacy Policy
								</a>
							</Label>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
							<p className="text-sm text-red-700 flex items-center gap-2">
								<XCircle className="h-4 w-4" />
								{error}
							</p>
						</div>
					)}

					{/* Submit Button */}
					<Button
						type="submit"
						className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
						disabled={
							isLoading ||
							isGoogleLoading ||
							!emailValidation.isValid ||
							!passwordValidation.isValid ||
							!agreedToTerms ||
							password !== confirmPassword ||
							!email ||
							!password ||
							!confirmPassword
						}
					>
						{isLoading ? (
							<div className="flex items-center gap-2">
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								Creating account...
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
								Create Account
								<ArrowRight className="h-5 w-5" />
							</div>
						)}
					</Button>
				</div>
			</form>

			{/* Divider */}
			<div className="relative my-4">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200"></div>
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="bg-white px-4 text-gray-500 font-medium">
						or continue with
					</span>
				</div>
			</div>

			{/* Google Sign-up Button */}
			<Button
				type="button"
				variant="outline"
				className="w-full h-14 border-2 border-gray-200  hover:border-gray-300 bg-white  hover:bg-gray-50  text-gray-700  font-semibold rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
				onClick={handleGoogleSignup}
				disabled={isLoading || isGoogleLoading}
			>
				{isGoogleLoading ? (
					<div className="flex items-center gap-3">
						<div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
						Signing up...
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
						Sign up with Google
					</div>
				)}
			</Button>
		</div>
	);
}

export default ModernSignup;
