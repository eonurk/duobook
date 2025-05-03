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
		} catch (error) {
			console.error("Error fetching user progress for rate limiting:", error);
			// Fallback: apply limit if DB check fails?
			return false;
		}

		// Apply the limit for FREE users or if progress couldn't be found
		console.log(`Applying rate limit for FREE user: ${req.userId}`);
		return false;
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
					limit: Infinity,
					remaining: Infinity,
					isPremium: true,
					subscriptionTier: userProgress.subscriptionTier,
				});
			}

			// Free users - check remaining from rate limiter
			// For free users, we use the fixed daily limit
			const limit = 3; // Same as in the rate limiter config

			// Due to the implementation details of express-rate-limit, we can't directly access
			// the hits. Instead, we'll count how many successful generate-story requests
			// the user has made in the past 24 hours
			const recentStories = await prisma.story.count({
				where: {
					userId: userId,
					createdAt: {
						gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
					},
				},
			});

			const remaining = Math.max(0, limit - recentStories);

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

		console.log("Received generation request:", {
			userId,
			description,
			source,
			target,
			difficulty,
			length,
		});

		// Construct the prompt (similar to frontend)
		// TODO: Refine this prompt based on the original frontend logic
		const prompt = `Create a story based on this description: "${description}". The story should be suitable for a ${difficulty} learner of ${target} whose native language is ${source}. The story should be ${length} in length. Return the story as a JSON object with two keys: "sentencePairs" (an array of objects, each with "source" and "target" sentences) and "vocabulary" (an array of objects, each with "word" in ${source} and "translation" in ${target}). Use simple language appropriate for the difficulty level. Ensure the JSON is valid. Example SentencePair format: { "source": "Sentence in source language.", "target": "Sentence translated to target language." }. Example Vocabulary format: { "word": "SourceWord", "translation": "TargetWord" }.`;

		try {
			console.log("Sending request to OpenAI...");
			const completion = await openai.chat.completions.create({
				model: "gpt-4o", // Or your preferred model
				messages: [{ role: "user", content: prompt }],
				response_format: { type: "json_object" }, // Enforce JSON output
			});

			const storyContent = completion.choices[0]?.message?.content;

			if (!storyContent) {
				throw new Error("OpenAI did not return story content.");
			}

			console.log("Received story content from OpenAI.");
			// Optionally, validate the structure of storyContent before sending
			try {
				const parsedStory = JSON.parse(storyContent);
				// Minimal validation - check if keys exist
				if (!parsedStory.sentencePairs || !parsedStory.vocabulary) {
					throw new Error("Invalid JSON structure received from OpenAI.");
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
		// Added next param
		// Access req.userId directly, check if it exists (Uncommented)
		const userId = req.userId;
		if (!userId) {
			// Uncommented
			// It's better practice to throw an error here for the asyncHandler to catch
			// or call next() with an error object.
			// For simplicity, returning response, but error handling middleware would be better.
			return res.status(401).json({
				error: "Authentication required (userId missing after auth).",
			});
		} // Uncommented
		try {
			const stories = await prisma.story.findMany({
				where: { userId: userId }, // Use checked userId (Uncommented)
				orderBy: { createdAt: "desc" },
			});
			res.status(200).json(stories);
		} catch (error) {
			// Pass error to the Express error handler via next()
			next(error);
			// console.error("Error fetching stories:", error);
			// res.status(500).json({ error: "Could not fetch stories." });
		}
	})
); // End asyncHandler wrapper

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
			story,
			description,
			sourceLanguage,
			targetLanguage,
			difficulty,
			length,
		} = req.body;

		// Only the story JSON string is strictly required now
		if (!story || typeof story !== "string") {
			const err = new Error("Story content (as JSON string) is required.");
			(err as any).status = 400;
			return next(err);
		}

		try {
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

// GET a specific story by ID (ensure it belongs to the user)
app.get(
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

			const story = await prisma.story.findUnique({
				where: { id: storyId },
			});

			if (!story) {
				const err = new Error("Story not found.");
				(err as any).status = 404;
				return next(err);
			}

			// Verify ownership
			if (story.userId !== userId) {
				const err = new Error("You do not have permission to view this story.");
				(err as any).status = 403;
				return next(err);
			}

			res.status(200).json(story);
		} catch (error) {
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
			const updatedProgress = await prisma.userProgress.update({
				where: { userId: userId }, // Use checked userId
				data: updateData,
			});
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
					return res.status(200).json([]);
				}

				// Separate core and random challenges
				const coreChallenges = allChallenges.filter((c: any) => c.isCore);
				const randomChallenges = allChallenges.filter((c: any) => !c.isCore);

				// Determine how many random challenges to pick (aim for 3 total)
				const totalDesired = 3;
				const numRandomNeeded = Math.max(
					0,
					totalDesired - coreChallenges.length
				);

				// Shuffle and select random challenges
				const shuffledRandom = randomChallenges.sort(() => 0.5 - Math.random());
				const selectedRandom = shuffledRandom.slice(
					0,
					Math.min(numRandomNeeded, randomChallenges.length)
				);

				// Combine core and selected random challenges
				const selectedChallenges = [...coreChallenges, ...selectedRandom];

				// Transaction to create assignments for the selected challenges
				const transactionResult = await prisma.$transaction(
					async (tx: Prisma.TransactionClient) => {
						// Use the combined selectedChallenges list here
						const createPromises = selectedChallenges.map((challenge: any) =>
							tx.userDailyChallenge
								.create({
									data: {
										userId: userId,
										challengeId: challenge.id,
										day: todayStart,
										progress: 0,
										completed: false,
									},
									include: { challenge: true },
								})
								.catch((e: any) => {
									// Explicitly type error 'e'
									if (e.code === "P2002") {
										// Prisma unique constraint violation code
										console.warn(
											`Challenge ${
												challenge.id
											} already exists for user ${userId} on ${todayStart.toISOString()}. Skipping.`
										);
										// Optionally fetch and return the existing one instead of null
										return tx.userDailyChallenge.findUnique({
											where: {
												userId_challengeId_day: {
													userId,
													challengeId: challenge.id,
													day: todayStart,
												},
											},
											include: { challenge: true },
										});
									} else {
										throw e; // Re-throw other errors
									}
								})
						);
						const newDailyChallengesRaw = await Promise.all(createPromises);
						// Filter out null results from skipped creations
						const newDailyChallenges = newDailyChallengesRaw.filter(Boolean);

						await tx.userProgress.update({
							where: { userId: userId },
							data: { dailyChallengesLastGenerated: today },
						});

						return newDailyChallenges;
					}
				);
				console.log(
					`Generated/retrieved ${transactionResult.length} challenges.`
				);
				res.status(200).json(transactionResult);
			} else {
				console.log(
					`Returning existing daily challenges for user ${userId} for day ${todayStart.toISOString()}`
				);
				res.status(200).json(userProgress.userDailyChallenges);
			}
		} catch (error) {
			console.error(
				`Error fetching/generating daily challenges for user ${userId}:`,
				error
			);
			next(error);
		}
	})
);

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
