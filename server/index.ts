// Add this block *before* other imports if possible, or at the top level
declare global {
	namespace Express {
		interface Request {
			userId?: string; // Define userId as an optional property on Request
		}
	}
}

import express, { Request, Response, NextFunction } from "express";
// Import Prisma namespace and specific types
import { PrismaClient, Prisma } from "@prisma/client";
import admin from "firebase-admin"; // Import Firebase Admin SDK
import OpenAI from "openai"; // Import OpenAI
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { SubscriptionTier } from "@prisma/client"; // Import the enum
import nodemailer from "nodemailer"; // Add nodemailer import

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the absolute path to the JSON file
const serviceAccountPath = path.resolve(
	__dirname,
	"../firebase-admin-sdk.json"
);

// Read the file content synchronously
const serviceAccountRaw = fs.readFileSync(serviceAccountPath, "utf8");

// Parse the JSON content
const serviceAccount = JSON.parse(serviceAccountRaw) as {
	/* Define expected structure here if known */
};

// --- START OPENAI CLIENT SETUP ---
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, // Use backend environment variable
});
// --- END OPENAI CLIENT SETUP ---

// --- START FIREBASE ADMIN SETUP ---
try {
	// const serviceAccount = require("../firebase-admin-sdk.json"); // <<< REMOVED OLD require
	admin.initializeApp({
		// Need to cast serviceAccount because import assertion typing might be partial
		credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
	});
	console.log("Firebase Admin initialized successfully.");
} catch (error) {
	console.error("Error initializing Firebase Admin:", error);
	console.error(
		"Server startup failed. Ensure serviceAccountKey.json is configured correctly."
	);
	// process.exit(1); // Optional: Exit if Firebase Admin fails to initialize
}
// --- END FIREBASE ADMIN SETUP ---

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// --- START ASYNC HANDLER UTILITY ---
// Utility function to wrap async route handlers and catch errors
const asyncHandler =
	(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
	(req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next); // Pass errors to Express error handler
	};
// --- END ASYNC HANDLER UTILITY ---

// --- START AUTH MIDDLEWARE ---
// Define the async authentication logic
const authenticateTokenAsync = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

	if (token == null) {
		return res.sendStatus(401); // If no token, unauthorized
	}

	try {
		const decodedToken = await admin.auth().verifyIdToken(token);
		// Now assigns to req.userId directly, relying on module augmentation
		req.userId = decodedToken.uid;

		// Check if the user is banned
		if (req.userId) {
			const userProgress = await prisma.userProgress.findUnique({
				where: { userId: req.userId },
				select: { isBanned: true },
			});

			if (userProgress && userProgress.isBanned) {
				console.warn(
					`Banned user attempt: User ${req.userId} tried to access a protected route.`
				);
				return res.status(403).json({
					error:
						"Your account has been suspended due to policy violations. Please contact support if you believe this is an error.",
				});
			}
		}
		// If user is not banned or UserProgress record doesn't exist (which might be an edge case for new users if not created on signup)
		next(); // Proceed to the next middleware or route handler
	} catch (error) {
		console.error("Error verifying Firebase token:", error);
		// Pass error to the central error handler
		next(error);
		// return res.sendStatus(403); // Don't send response directly, use next(error)
	}
};

// Create a synchronous wrapper for the middleware
const authenticateTokenMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	authenticateTokenAsync(req, res, next);
};
// --- END AUTH MIDDLEWARE ---

// --- START OPTIONAL AUTH MIDDLEWARE ---
const optionalAuthenticateTokenMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

	if (token) {
		try {
			const decodedToken = await admin.auth().verifyIdToken(token);
			req.userId = decodedToken.uid;
		} catch (error) {
			// Token is present but invalid, could log or just proceed without userId
			let errorMessage = "Unknown error during optional auth.";
			if (error instanceof Error) {
				errorMessage = error.message;
			}
			console.warn(
				"Optional auth: Invalid token received, proceeding as unauthenticated.",
				errorMessage
			);
			// Do not send a 401/403 here, just clear any potentially partially set userId
			req.userId = undefined;
		}
	}
	next(); // Always proceed
};
// --- END OPTIONAL AUTH MIDDLEWARE ---

// --- START RATE LIMITER SETUP ---
const storyGenerationLimiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000, // 24 hours window
	max: 3, // Limit each FREE user to 3 story generations per day
	message: {
		error:
			"Too many story generation requests today for free users. Upgrade to premium or try again tomorrow.",
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	keyGenerator: (req: Request): string => {
		return req.userId || req.ip || "unknown"; // Added 'unknown' as final fallback
	},
	// Use database-based tracking instead of in-memory
	skip: async (req: Request, res: Response): Promise<boolean> => {
		// If user is not authenticated for some reason, apply the limit based on IP
		if (!req.userId) {
			console.warn("Rate limiting story generation by IP (userId not found)");
			return false;
		}

		// Check user's subscription tier
		try {
			const userProgress = await prisma.userProgress.findUnique({
				where: { userId: req.userId },
				select: { subscriptionTier: true },
			});

			// If user has PREMIUM or PRO tier, skip the rate limit
			if (
				userProgress &&
				(userProgress.subscriptionTier === SubscriptionTier.PREMIUM ||
					userProgress.subscriptionTier === SubscriptionTier.PRO)
			) {
				console.log(
					`Skipping rate limit for ${userProgress.subscriptionTier} user: ${req.userId}`
				);
				return true; // Skip the limit for premium users
			}

			// Check the number of stories generated in the last 24 hours
			const recentStories = await prisma.story.count({
				where: {
					userId: req.userId,
					createdAt: {
						gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
					},
				},
			});

			const limit = 3; // Same as max in the rate limiter config
			const remaining = Math.max(0, limit - recentStories);

			// If user has reached the limit, don't skip the limiter
			if (remaining <= 0) {
				console.log(
					`User ${req.userId} has reached the story generation limit`
				);
				return false;
			}

			console.log(
				`User ${req.userId} has ${remaining} story generations remaining`
			);
			return false; // Still apply the limiter but let DB count dictate
		} catch (error) {
			console.error("Error fetching user progress for rate limiting:", error);
			// Fallback: apply limit if DB check fails?
			return false;
		}
	},
});
// --- END RATE LIMITER SETUP ---

// Health check route (public)
app.get("/health", (req: Request, res: Response) => {
	res.status(200).json({ status: "API is running successfully!" });
});

// Contact form submission endpoint (public)
app.post(
	"/api/contact",
	asyncHandler(async (req: Request, res: Response) => {
		const { name, email, subject, message } = req.body;

		// Basic validation
		if (!name || !email || !message) {
			return res
				.status(400)
				.json({ error: "Name, email and message are required" });
		}

		// Email validation with regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		// Configure transporter (this is a placeholder - you would use real SMTP settings)
		// For production, use environment variables for sensitive information
		const transporter = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			auth: {
				user: "help.indicatorinsights@gmail.com",
				pass: "okqcshzcttqgchug",
			},
		});

		// Set up email data
		const mailOptions = {
			from: `"DuoBook Contact Form" <help.indicatorinsights@gmail.com>`,
			to: "support@duobook.co",
			replyTo: email,
			subject: `Contact Form: ${subject || "New message from DuoBook website"}`,
			text: `
			Name: ${name}
			Email: ${email}
			
			Message:
			${message}
		`,
			html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #4a5568;">New Contact Form Submission</h2>
				<p><strong>From:</strong> ${name}</p>
				<p><strong>Email:</strong> ${email}</p>
				<p><strong>Subject:</strong> ${subject || "N/A"}</p>
				<h3 style="margin-top: 20px;">Message:</h3>
				<div style="background-color: #f7fafc; padding: 15px; border-radius: 5px;">
					${message.replace(/\n/g, "<br/>")}
				</div>
			</div>
		`,
		};

		try {
			// Always send email regardless of environment
			await transporter.sendMail(mailOptions);

			res
				.status(200)
				.json({ success: true, message: "Message sent successfully" });
		} catch (error) {
			console.error("Error sending email:", error);
			res.status(500).json({ error: "Failed to send message" });
		}
	})
);

// GET latest stories from all users (with pagination) - NOW PUBLIC
app.get(
	"/api/stories/latest",
	optionalAuthenticateTokenMiddleware, // Use optional auth
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId; // userId will be populated if token was valid, otherwise undefined
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const excludeCurrentUser = req.query.excludeCurrentUser === "true";

		if (page < 1) {
			return res
				.status(400)
				.json({ error: "Page number must be 1 or greater." });
		}
		if (limit < 1 || limit > 50) {
			return res.status(400).json({ error: "Limit must be between 1 and 50." });
		}

		const skip = (page - 1) * limit;

		try {
			const whereClause: Prisma.StoryWhereInput = {};
			if (excludeCurrentUser && userId) {
				whereClause.userId = { not: userId };
			}

			const storiesFromDb = await prisma.story.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				skip: skip,
				take: limit,
			});

			const actualTotalMatchingStories = await prisma.story.count({
				where: whereClause,
			});
			const displayableTotalStories = Math.min(actualTotalMatchingStories, 50);
			const totalPages = Math.ceil(displayableTotalStories / limit);

			res.status(200).json({
				stories: storiesFromDb, // Send original stories, no author names
				currentPage: page,
				totalPages,
				totalStories: displayableTotalStories, // Report the capped total for pagination purposes
			});
		} catch (error) {
			next(error);
		}
	})
);

// Endpoint to get total number of stories
app.get(
	"/api/stats/total-stories",
	asyncHandler(async (req: Request, res: Response) => {
		const totalStories = await prisma.story.count();
		res.json({ totalStories });
		// try-catch removed for brevity as asyncHandler handles it
	})
);

// Endpoint to get total number of users
app.get(
	"/api/stats/total-users",
	asyncHandler(async (req: Request, res: Response) => {
		const totalUsers = await prisma.userProgress.count(); // Assuming userProgress table tracks all users
		res.json({ totalUsers });
		// try-catch removed for brevity as asyncHandler handles it
	})
);

// NEW: PUBLIC ROUTE to GET a specific story by its shareId
app.get(
	"/api/stories/:shareId", // Changed from :id to :shareId
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const { shareId } = req.params; // Use shareId directly as a string
		console.log(`[DEBUG] Received request for story with shareId: ${shareId}`);

		// Log headers for debugging
		console.log("[DEBUG] Request headers:", req.headers);

		try {
			console.log(`[DEBUG] Attempting to find story with shareId: ${shareId}`);
			// No need to parseInt, shareId is a CUID string
			// Use findUnique as shareId is marked @unique in the schema
			const story = await prisma.story.findUnique({
				where: { shareId: shareId }, // Query by shareId
			});

			if (!story) {
				console.log(`[DEBUG] No story found with shareId: ${shareId}`);
				return res.status(404).json({ error: "Story not found" });
			}

			console.log(`[DEBUG] Found story with shareId: ${shareId}, returning it`);
			// Publicly return the story
			res.json(story);
		} catch (error) {
			console.error(`Failed to fetch story with shareId ${shareId}:`, error);
			next(error); // Pass to centralized error handler
		}
	})
);

// --- PROTECTED ROUTES ---
// Apply the synchronous wrapper middleware
app.use(authenticateTokenMiddleware);

// Get remaining story generation limit for current user
app.get(
	"/api/story-limit",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error("Authentication required.");
			(err as any).status = 401;
			return next(err);
		}

		// Get user's subscription tier to determine limit
		try {
			// Include type annotation to fix TypeScript error
			const userProgress = (await prisma.userProgress.findUnique({
				where: { userId: req.userId },
				select: { subscriptionTier: true },
			})) as { subscriptionTier: SubscriptionTier } | null;

			// Premium and Pro users have unlimited generations
			if (
				userProgress &&
				(userProgress.subscriptionTier === SubscriptionTier.PREMIUM ||
					userProgress.subscriptionTier === SubscriptionTier.PRO)
			) {
				return res.status(200).json({
					limit: 10,
					remaining: 10,
					isPremium: true,
					subscriptionTier: userProgress.subscriptionTier,
				});
			}

			// For free users, count stories created in the past 24 hours

			const limit = 3; // Same as in the rate limiter config
			const recentStories = await prisma.story.count({
				where: {
					userId: userId,
					createdAt: {
						gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
					},
				},
			});

			const remaining = Math.max(0, limit - recentStories);

			console.log(
				`User ${userId} has used ${recentStories}/${limit} story generations in the last 24 hours`
			);

			return res.status(200).json({
				limit,
				remaining,
				isPremium: false,
				subscriptionTier:
					userProgress?.subscriptionTier || SubscriptionTier.FREE,
			});
		} catch (error) {
			console.error("Error checking rate limit:", error);
			// In case of error, assume no limit to avoid blocking legitimate users
			return res
				.status(500)
				.json({ error: "Could not determine remaining limit" });
		}
	})
);

// === STORY GENERATION PROXY ROUTE ===
app.post(
	"/api/generate-story",
	storyGenerationLimiter, // Apply the specific limiter here
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error("Authentication required.");
			(err as any).status = 401;
			return next(err);
		}

		const { description, source, target, difficulty, length } = req.body;

		// Basic validation
		if (!description || !source || !target || !difficulty || !length) {
			const err = new Error(
				"Missing required parameters for story generation."
			);
			(err as any).status = 400;
			return next(err);
		}

		let prompt;
		const isProStoryRequest = length === "very_long_pro";

		if (isProStoryRequest) {
			// Pro user requesting a long, paginated story
			// TODO: Potentially check user's tier here already if we want to prevent even calling OpenAI for non-PRO for this length
			const numPages = 10; // Updated to 10 pages
			prompt = `Analyze the user's description: \"${description}\".
			
If the description contains profanity, hate speech, incitement to violence, or other severely harmful content, then do not generate the story. Instead, return a JSON object with a single key "moderation_error", and its value being a string explaining the violation. For example: { "moderation_error": "The story description contains prohibited content (e.g., profanity or hate speech). Please revise." }
If the description is acceptable, proceed to generate a story as requested below. 
			
Create an interesting story based on this description. 
The story should be suitable for a ${difficulty} learner of ${target} whose native language is ${source}.
The story should have approximately ${numPages} pages.
Return the story as a JSON object with a single key "pages".
"pages" should be an array of page objects. Each page object must have two keys:
1.  "sentencePairs": An array of objects, where each object has a "source" sentence (in ${source}) and a "target" sentence (translated to ${target}). Each "sentencePairs" array should contain between 10 and 12 sentence pairs.
2.  "vocabulary": An array of objects, where each object has a "word" (in ${source}) and its "translation" (in ${target}), relevant to that page\'s content.
Use simple language appropriate for the difficulty level. Ensure the JSON is valid.
Example page object: { "sentencePairs": [{ "source": "...", "target": "..." } /* ...10 to 12 pairs total */], "vocabulary": [{ "word": "...", "translation": "..." }] }.`;
		} else {
			// Standard story request
			prompt = `Analyze the user's description: \"${description}\".
			
If the description contains profanity, hate speech, incitement to violence, or other severely harmful content, then do not generate the story. Instead, return a JSON object with a single key "moderation_error", and its value being a string explaining the violation. For example: { "moderation_error": "The story description contains prohibited content (e.g., profanity or hate speech). Please revise." }
If the description is acceptable, proceed to generate a story as requested below. 

Create an interesting story based on this description. 
The story should be suitable for a ${difficulty} learner of ${target} whose native language is ${source}. 
The story should be ${length} in length. 
Return the story as a JSON object with two keys: "sentencePairs" (an array of objects, each with "source" and "target" sentences) and "vocabulary" (an array of objects, each with "word" in ${source} and "translation" in ${target}). Use simple language appropriate for the difficulty level. Ensure the JSON is valid. Example SentencePair format: { "source": "Sentence in source language.", "target": "Sentence translated to target language." }. 
Example Vocabulary format: { "word": "SourceWord", "translation": "TargetWord" }.
`;
		}

		try {
			console.log("Sending request to OpenAI...");
			console.log(
				`Using model: ${isProStoryRequest ? "gpt-4.1-mini" : "gpt-4.1-mini"}`
			); // Log which model is being used
			const completion = await openai.chat.completions.create({
				model: isProStoryRequest ? "gpt-4.1-mini" : "gpt-4.1-mini",
				messages: [{ role: "user", content: prompt }],
				response_format: { type: "json_object" }, // Enforce JSON output
			});

			const storyContent = completion.choices[0]?.message?.content;

			if (!storyContent) {
				throw new Error("OpenAI did not return story content.");
			}

			console.log(
				"Received story content from OpenAI (this log might be redundant now but keeping for safety)."
			);
			// Optionally, validate the structure of storyContent before sending
			try {
				const parsedStory = JSON.parse(storyContent);
				// Minimal validation - check if keys exist based on request type

				// START MODERATION CHECK
				if (parsedStory.moderation_error) {
					console.warn(
						`Moderation error for user ${req.userId || "unknown"}: ${
							parsedStory.moderation_error
						}`
					);

					let userWasJustBanned = false; // Tracks if ban occurred in this request
					let userIsCurrentlyBanned = false; // Tracks final ban state after this request
					let currentWarningCount = 0;
					const BAN_THRESHOLD = 3;

					if (req.userId) {
						try {
							const existingUserProgress = await prisma.userProgress.findUnique(
								{
									where: { userId: req.userId },
									select: { isBanned: true, moderationWarnings: true },
								}
							);

							if (existingUserProgress && existingUserProgress.isBanned) {
								console.log(
									`User ${req.userId} is already banned. Moderation error occurred: ${parsedStory.moderation_error}`
								);
								userIsCurrentlyBanned = true;
								currentWarningCount = existingUserProgress.moderationWarnings;
							} else {
								// User is not currently banned, or no progress record exists.
								// Upsert will create or update.
								const progressAfterWarning = await prisma.userProgress.upsert({
									where: { userId: req.userId },
									update: { moderationWarnings: { increment: 1 } },
									create: {
										userId: req.userId,
										moderationWarnings: 1,
										// Rely on schema defaults for other fields like points, dailyStreak, etc.
									},
									select: { moderationWarnings: true, isBanned: true }, // isBanned is pre-this-request's potential ban
								});

								currentWarningCount = progressAfterWarning.moderationWarnings;
								userIsCurrentlyBanned = progressAfterWarning.isBanned; // Reflects if banned *before* this warning increment

								console.log(
									`User ${req.userId} moderation warnings is now ${currentWarningCount}`
								);

								if (
									currentWarningCount >= BAN_THRESHOLD &&
									!userIsCurrentlyBanned
								) {
									// Ban the user if threshold met AND they weren't already banned
									await prisma.userProgress.update({
										where: { userId: req.userId },
										data: { isBanned: true },
									});
									userWasJustBanned = true; // Set to true as they were banned in THIS request
									userIsCurrentlyBanned = true; // Update final status
									console.log(
										`User ${req.userId} has been banned due to reaching ${BAN_THRESHOLD} moderation warnings.`
									);
								}
							}
						} catch (dbError) {
							console.error(
								`Failed to update moderation warnings/ban status for user ${req.userId}:`,
								dbError
							);
							// Fall through: userWasJustBanned remains false. currentWarningCount might be 0 or stale.
							// Client will get a generic moderation error in this case.
						}
					}

					// Construct response based on moderation outcome
					if (userWasJustBanned) {
						return res.status(403).json({
							error:
								"Your account has been suspended due to repeated policy violations. This story was not generated. Please contact support if you believe this is an error.",
							original_moderation_issue: parsedStory.moderation_error,
							userBanned: true,
							moderationWarnings: currentWarningCount, // This will be BAN_THRESHOLD or more
						});
					} else if (req.userId && userIsCurrentlyBanned) {
						// User was already banned (and not just banned in this request)
						// This path is taken if existingUserProgress.isBanned was true.
						return res.status(403).json({
							error:
								"Your account is currently suspended. Story generation failed.",
							original_moderation_issue: parsedStory.moderation_error,
							userBanned: true,
							moderationWarnings: currentWarningCount, // Their existing warning count
						});
					} else if (req.userId && currentWarningCount > 0) {
						// User received a warning, is not banned, and DB operations were successful to get a reliable count.
						return res.status(422).json({
							error: parsedStory.moderation_error, // OpenAI's original message
							userBanned: false,
							moderationWarnings: currentWarningCount,
							warningMessage: `Your story idea was flagged by our safety system. This is warning ${currentWarningCount} of ${BAN_THRESHOLD}. Reaching ${BAN_THRESHOLD} warnings will result in account suspension. Original issue: "${parsedStory.moderation_error}"`,
						});
					} else {
						// This covers:
						// 1. Anonymous user (req.userId is null)
						// 2. Authenticated user, but a DB error occurred during warning update (currentWarningCount might be 0 or stale)
						return res.status(422).json({
							error: parsedStory.moderation_error,
						});
					}
				}
				// END MODERATION CHECK

				if (isProStoryRequest) {
					if (!parsedStory.pages || !Array.isArray(parsedStory.pages)) {
						throw new Error(
							"Invalid JSON structure for paginated story received from OpenAI (missing 'pages' array)."
						);
					}
					// Could add deeper validation for each page object here if needed
				} else {
					if (!parsedStory.sentencePairs || !parsedStory.vocabulary) {
						throw new Error(
							"Invalid JSON structure for standard story received from OpenAI."
						);
					}
				}
				res.status(200).json(parsedStory); // Send parsed JSON back
			} catch (parseError) {
				console.error("Error parsing OpenAI response:", parseError);
				console.error("Raw OpenAI response:", storyContent);
				throw new Error("Failed to parse story JSON from OpenAI.");
			}
		} catch (error) {
			console.error("Error calling OpenAI API:", error);
			// Forward a generic error or specific OpenAI error if needed
			const err = new Error("Failed to generate story via OpenAI.");
			(err as any).status = 502; // Bad Gateway or appropriate error
			next(err);
		}
	})
);

// === STORY ROUTES ===

// GET all stories for the logged-in user - Wrapped with asyncHandler
app.get(
	"/api/stories",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401;
			return next(err);
		}
		try {
			const stories = await prisma.story.findMany({
				where: { userId: userId },
				orderBy: { createdAt: "desc" },
			});
			res.status(200).json(stories);
		} catch (error) {
			next(error);
		}
	})
);

// POST a new story for the logged-in user - Apply asyncHandler
app.post(
	"/api/stories",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401; // Add status for error handler
			return next(err);
		}
		// Destructure all expected fields from the body
		const {
			story, // This is the JSON string of the story content
			description,
			sourceLanguage,
			targetLanguage,
			difficulty,
			length, // This 'length' param is crucial for the PRO check
		} = req.body;

		// Only the story JSON string is strictly required now
		if (!story || typeof story !== "string") {
			const err = new Error("Story content (as JSON string) is required.");
			(err as any).status = 400;
			return next(err);
		}

		try {
			// Check user's subscription tier
			const userProgress = await prisma.userProgress.findUnique({
				where: { userId: userId },
				select: { subscriptionTier: true },
			});

			// If length indicates a "very_long_pro" story, enforce PRO tier
			if (length === "very_long_pro") {
				if (
					!userProgress ||
					userProgress.subscriptionTier !== SubscriptionTier.PRO
				) {
					return res.status(403).json({
						error:
							"You must have a PRO subscription to create very long stories. Please upgrade your plan.",
					});
				}
			} else {
				// Existing logic for non-PRO (or non-very_long_pro) stories: daily limit for FREE tier
				if (
					!userProgress ||
					(userProgress.subscriptionTier !== SubscriptionTier.PREMIUM &&
						userProgress.subscriptionTier !== SubscriptionTier.PRO)
				) {
					const recentStories = await prisma.story.count({
						where: {
							userId: userId,
							createdAt: {
								gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
							},
						},
					});

					// Free tier users limited to 3 stories per day (can be configured)
					const dailyLimit = 3;
					if (recentStories >= dailyLimit) {
						return res.status(429).json({
							error: `Daily story limit of ${dailyLimit} reached for your current plan. Upgrade for more stories.`,
						});
					}
				}
			}

			const newStory = await prisma.story.create({
				data: {
					userId: userId,
					story: story, // Save the JSON string
					// Save optional parameters if provided
					description: description,
					sourceLanguage: sourceLanguage,
					targetLanguage: targetLanguage,
					difficulty: difficulty,
					length: length,
				},
			});

			// TODO: Potentially award "first story" achievement here
			// await awardAchievement(userId, 'FIRST_STORY_CREATED');

			res.status(201).json(newStory);
		} catch (error) {
			// Pass database or other errors to the central handler
			next(error);
		}
	})
);

// DELETE a specific story by ID (ensure it belongs to the user)
app.delete(
	"/api/stories/:id",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401;
			return next(err);
		}
		const { id } = req.params;

		try {
			const storyId = parseInt(id, 10);
			if (isNaN(storyId)) {
				const err = new Error("Invalid story ID format.");
				(err as any).status = 400;
				return next(err);
			}

			// Find the story first to check ownership before deleting
			const story = await prisma.story.findUnique({
				where: { id: storyId },
			});

			if (!story) {
				return res.status(404).json({ error: "Story not found." });
			}

			// Verify ownership
			if (story.userId !== userId) {
				const err = new Error(
					"You do not have permission to delete this story."
				);
				(err as any).status = 403;
				return next(err);
			}

			// Delete the story
			await prisma.story.delete({
				where: { id: storyId },
			});

			res.status(204).send(); // Successfully deleted, no content to return
		} catch (error) {
			next(error);
		}
	})
);

// === PROGRESS ROUTES ===

// Helper function to check if a date is yesterday relative to another (ignoring time)
function isYesterday(targetDate: Date, today: Date): boolean {
	if (!targetDate || !today) return false;
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	return isSameDay(targetDate, yesterday);
}

// GET user progress (create if not exists, update streak)
app.get(
	"/api/progress",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401;
			return next(err);
		}

		try {
			const now = new Date();

			// Upsert ensures the record exists
			let progress = await prisma.userProgress.upsert({
				where: { userId: userId },
				update: {}, // Check streak/lastLogin *after* getting the record
				create: {
					userId: userId,
					streak: 1, // Start with streak 1 on creation
					lastLogin: now, // Set lastLogin on creation
				},
			});

			// Calculate potential new streak
			let newStreak = progress.streak;
			let needsUpdate = false;

			if (!progress.lastLogin || !isSameDay(progress.lastLogin, now)) {
				// If last login was not today...
				if (progress.lastLogin && isYesterday(progress.lastLogin, now)) {
					// If last login was yesterday, increment streak
					newStreak = progress.streak + 1;
					console.log(
						`User ${userId} continued streak. New streak: ${newStreak}`
					);
				} else {
					// If last login was before yesterday (or null), reset streak to 1
					newStreak = 1;
					console.log(`User ${userId} started/reset streak. New streak: 1`);
				}
				needsUpdate = true;
			}

			// Update if streak changed or if lastLogin needs updating to today
			if (needsUpdate) {
				progress = await prisma.userProgress.update({
					where: { userId: userId },
					data: {
						streak: newStreak,
						lastLogin: now,
					},
				});
			}

			res.status(200).json(progress); // Return the potentially updated progress
		} catch (error) {
			console.error(`Error in GET /api/progress for user ${userId}:`, error);
			next(error);
		}
	})
);

// PUT (update) user progress (e.g., add points)
app.put(
	"/api/progress",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401;
			return next(err);
		}
		const { pointsToAdd, level } = req.body; // Accept pointsToAdd or a specific level

		// Declare updateData outside the try block
		let updateData: { points?: { increment: number }; level?: number } = {};

		try {
			// Populate updateData inside the try block
			if (typeof pointsToAdd === "number") {
				updateData.points = { increment: pointsToAdd };
			}
			if (typeof level === "number") {
				updateData.level = level;
			}

			if (Object.keys(updateData).length === 0) {
				const err = new Error(
					"No update data provided (pointsToAdd or level)."
				);
				(err as any).status = 400;
				return next(err);
			}

			// Use updateData here
			let updatedProgress = await prisma.userProgress.update({
				where: { userId: userId }, // Use checked userId
				data: updateData,
			});

			// --- START LEVEL UP CHECK ---
			// Check for level up ONLY if points were added
			if (updateData.points && updatedProgress) {
				const currentLevel = updatedProgress.level;
				const currentPoints = updatedProgress.points;
				// Calculate points needed for the *next* level (currentLevel * 100)
				const pointsForLevel = (lvl: number) => (((lvl - 1) * lvl) / 2) * 100;
				const pointsNeededForNextLevel = pointsForLevel(currentLevel + 1);
				const currentLevelBasePoints = pointsForLevel(currentLevel);

				// The actual threshold to reach the next level is the base points for that level
				if (currentPoints >= pointsNeededForNextLevel) {
					// Calculate how many levels the user *should* be based on total points
					let newCalculatedLevel = currentLevel;
					while (currentPoints >= pointsForLevel(newCalculatedLevel + 1)) {
						newCalculatedLevel++;
					}

					if (newCalculatedLevel > currentLevel) {
						console.log(
							`User ${userId} leveled up from ${currentLevel} to ${newCalculatedLevel}!`
						);
						// Update the level in the database
						updatedProgress = await prisma.userProgress.update({
							where: { userId: userId },
							data: { level: newCalculatedLevel },
						});
					}
				}
			}
			// --- END LEVEL UP CHECK ---

			res.status(200).json(updatedProgress);
		} catch (error) {
			// Attempt to create progress if it doesn't exist before updating
			if (error instanceof Error && "code" in error && error.code === "P2025") {
				// Prisma code for record not found
				try {
					await prisma.userProgress.create({ data: { userId: userId } }); // Use checked userId
					// Retry the update after creation
					const updatedProgress = await prisma.userProgress.update({
						where: { userId: userId }, // Use checked userId
						data: updateData,
					});
					return res.status(200).json(updatedProgress);
				} catch (retryError) {
					// Pass the retry error to the central handler
					next(retryError);
					return; // Important: stop execution here after calling next()
				}
			} else {
				// Pass other errors to the central handler
				next(error);
			}
		}
	})
);

// === ACHIEVEMENT ROUTES ===

// GET all available achievements definitions
app.get(
	"/api/achievements",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401;
			return next(err);
		}
		try {
			const achievements = await prisma.achievement.findMany();
			res.status(200).json(achievements);
		} catch (error) {
			next(error);
		}
	})
);

// GET achievements unlocked by the logged-in user
app.get(
	"/api/user/achievements",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error(
				"Authentication required (userId missing after auth)."
			);
			(err as any).status = 401;
			return next(err);
		}

		try {
			const userAchievements = await prisma.userAchievement.findMany({
				where: { userId: userId }, // Use checked userId
				include: { achievement: true }, // Include the details of the achievement itself
				orderBy: { unlockedAt: "desc" },
			});
			res.status(200).json(userAchievements);
		} catch (error) {
			next(error);
		}
	})
);

// Helper function for date comparison (ignoring time)
function isSameDay(date1: Date, date2: Date): boolean {
	if (!date1 || !date2) return false; // Handle null/undefined dates
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

// Helper function to get the start of the day in UTC
function getStartOfDayUTC(date: Date): Date {
	const start = new Date(date);
	start.setUTCHours(0, 0, 0, 0);
	return start;
}

// === CHALLENGE ROUTES ===

// GET all available challenge definitions
app.get(
	"/api/challenges",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		try {
			const challenges = await prisma.challenge.findMany();
			res.status(200).json(challenges);
		} catch (error) {
			next(error);
		}
	})
);

// GET the user's assigned daily challenges for today (generate if needed)
app.get(
	"/api/user/daily-challenges",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error("Authentication required.");
			(err as any).status = 401;
			return next(err);
		}

		try {
			const today = new Date();
			const todayStart = getStartOfDayUTC(today);

			// Step 1: Ensure UserProgress record exists (Simplified Upsert)
			await prisma.userProgress.upsert({
				where: { userId: userId },
				update: {
					// Optionally update a field like lastLogin if needed,
					// or leave empty if updatedAt handles it automatically.
					// For robustness, let's explicitly update something benign:
					updatedAt: new Date(),
				},
				create: { userId: userId },
			});

			// Step 2: Fetch the UserProgress record WITH the includes
			const userProgress = await prisma.userProgress.findUnique({
				where: { userId: userId },
				include: {
					userDailyChallenges: {
						where: { day: todayStart },
						include: { challenge: true },
					},
				},
			});

			// Handle case where userProgress might somehow still be null after upsert (shouldn't happen but good practice)
			if (!userProgress) {
				console.error(
					`Failed to find UserProgress for user ${userId} after upsert.`
				);
				return next(new Error("Could not retrieve user progress."));
			}

			let needsNewChallenges = true;
			if (
				userProgress.dailyChallengesLastGenerated &&
				isSameDay(userProgress.dailyChallengesLastGenerated, today)
			) {
				needsNewChallenges = false;
			}

			if (needsNewChallenges) {
				console.log(
					`Generating new daily challenges for user ${userId} for day ${todayStart.toISOString()}`
				);
				const allChallenges = await prisma.challenge.findMany();
				if (allChallenges.length === 0) {
					console.warn("No challenge definitions found in database to assign.");
					return res.status(200).json([]); // Return empty array if no definitions
				}

				// Separate core and random challenges
				const coreChallenges = allChallenges.filter((c: any) => c.isCore);
				const randomChallenges = allChallenges.filter((c: any) => !c.isCore);
				const totalDesired = 3;
				const numRandomNeeded = Math.max(
					0,
					totalDesired - coreChallenges.length
				);
				const shuffledRandom = randomChallenges.sort(() => 0.5 - Math.random());
				const selectedRandom = shuffledRandom.slice(
					0,
					Math.min(numRandomNeeded, randomChallenges.length)
				);
				const selectedChallenges = [...coreChallenges, ...selectedRandom];

				// Transaction to create assignments using createMany and update timestamp
				await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
					const challengesToCreate = selectedChallenges.map(
						(challenge: any) => ({
							userId: userId,
							challengeId: challenge.id,
							day: todayStart,
							progress: 0,
							completed: false,
						})
					);

					if (challengesToCreate.length > 0) {
						await tx.userDailyChallenge.createMany({
							data: challengesToCreate,
							skipDuplicates: true, // Ignore P2002 errors silently
						});
						console.log(
							`Attempted to create ${challengesToCreate.length} challenges (duplicates skipped).`
						);
					}

					await tx.userProgress.update({
						where: { userId: userId },
						data: { dailyChallengesLastGenerated: today },
					});
				}); // End transaction

				// --- After generation attempt, fetch ALL challenges for today ---
				const finalDailyChallenges = await prisma.userDailyChallenge.findMany({
					where: {
						userId: userId,
						day: todayStart,
					},
					include: { challenge: true }, // Include challenge details
					orderBy: { challengeId: "asc" }, // Consistent ordering
				});

				console.log(
					`Returning ${
						finalDailyChallenges.length
					} daily challenges for user ${userId} for day ${todayStart.toISOString()}`
				);
				res.status(200).json(finalDailyChallenges); // Return all challenges for the day
			} else {
				console.log(
					`Returning existing daily challenges for user ${userId} for day ${todayStart.toISOString()} (no generation needed)`
				);
				res.status(200).json(userProgress.userDailyChallenges); // Return existing challenges fetched earlier via include
			}
		} catch (error) {
			console.error(
				`Error in GET /api/user/daily-challenges for user ${userId}:`,
				error // Log the actual error
			);
			// Ensure the error passed to next() has a stack trace if possible
			const err = error instanceof Error ? error : new Error(String(error));
			next(err); // Pass the detailed error to the central handler
		}
	})
);

// Endpoint to get total number of stories
app.get("/api/stats/total-stories", async (req, res) => {
	try {
		// Correct model name from your schema is 'Story'
		const count = await prisma.story.count();
		res.json({ totalStories: count });
	} catch (error) {
		console.error("Error fetching total stories:", error);
		res.status(500).json({ error: "Failed to fetch total stories" });
	}
});

// Endpoint to get total number of users
app.get("/api/stats/total-users", async (req, res) => {
	try {
		// Counting distinct userIds from 'UserProgress' model
		// as there isn't a separate 'User' model in your schema
		const count = await prisma.userProgress.count(); // This counts all UserProgress entries.
		// If a user can have multiple UserProgress entries
		// and you want unique users, this might need adjustment.
		// However, UserProgress.userId is marked @unique,
		// so count() on UserProgress should be equivalent to distinct users.
		res.json({ totalUsers: count });
	} catch (error) {
		console.error("Error fetching total users:", error);
		res.status(500).json({ error: "Failed to fetch total users" });
	}
});

// POST progress towards a specific challenge TYPE
app.post(
	"/api/user/challenges/progress",
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			const err = new Error("Authentication required.");
			(err as any).status = 401;
			return next(err);
		}

		const { challengeType, incrementAmount = 1 } = req.body;

		if (!challengeType) {
			const err = new Error("challengeType is required in the request body.");
			(err as any).status = 400;
			return next(err);
		}

		try {
			const todayStart = getStartOfDayUTC(new Date());

			const relevantChallenges = await prisma.userDailyChallenge.findMany({
				where: {
					userId: userId,
					day: todayStart,
					completed: false,
					challenge: { type: challengeType },
				},
				include: { challenge: true },
			});

			if (relevantChallenges.length === 0) {
				return res.status(200).json({
					message: "No active challenge of this type found for today.",
					completedChallenges: [],
					pointsAdded: 0,
				});
			}

			let completedChallengesInfo: Array<{
				id: string;
				title: string;
				xpReward: number;
			}> = [];
			let totalPointsToAdd = 0;

			await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
				for (const userChallenge of relevantChallenges) {
					const newProgress = userChallenge.progress + incrementAmount;
					let isCompletedNow = false; // Track if *this update* completes it

					if (!userChallenge.completed) {
						// Only check if not already complete
						const requiredCount = userChallenge.challenge.requiredCount;
						if (requiredCount !== null && requiredCount !== undefined) {
							if (newProgress >= requiredCount) isCompletedNow = true;
						} else {
							isCompletedNow = true; // Action-based challenges complete on first valid progress update
						}
					}

					const updateData: any = { progress: newProgress };
					if (isCompletedNow) {
						updateData.completed = true;
						updateData.completedAt = new Date();
						totalPointsToAdd += userChallenge.challenge.xpReward;
						completedChallengesInfo.push({
							id: userChallenge.challenge.id,
							title: userChallenge.challenge.title,
							xpReward: userChallenge.challenge.xpReward,
						});
					}

					await tx.userDailyChallenge.update({
						where: { id: userChallenge.id },
						data: updateData,
					});
				} // End loop

				if (totalPointsToAdd > 0) {
					const updatedProg = await tx.userProgress.update({
						where: { userId: userId },
						data: { points: { increment: totalPointsToAdd } },
						select: { level: true, points: true }, // Select needed fields for level up check
					});

					// Level Up Check (moved inside transaction)
					const currentLevel = updatedProg.level;
					const currentPoints = updatedProg.points;
					const pointsNeededForNextLevel = 100 * currentLevel;
					if (currentPoints >= pointsNeededForNextLevel) {
						const newLevel = currentLevel + 1; // Simple level up logic
						console.log(`User ${userId} leveled up to ${newLevel}!`);
						await tx.userProgress.update({
							where: { userId: userId },
							data: { level: newLevel },
						});
					}
				}
			}); // End transaction

			res.status(200).json({
				message: `Progress updated for ${challengeType}.`,
				completedChallenges: completedChallengesInfo,
				pointsAdded: totalPointsToAdd,
			});
		} catch (error) {
			console.error(
				`Error updating challenge progress for type ${challengeType} for user ${userId}:`,
				error
			);
			next(error);
		}
	})
);

// --- ERROR HANDLING ---
// Add a basic error handler to catch errors passed via next()
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error("Async Handler Error:", err.stack);
	// Avoid sending detailed stack in production
	res.status(500).json({ error: "Something went wrong on the server." });
});

// Start the server
const PORT = process.env.PORT || 3000; // Use environment variable or default
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
