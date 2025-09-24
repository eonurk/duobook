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
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { SubscriptionTier } from "@prisma/client"; // Import the enum
import nodemailer from "nodemailer"; // Add nodemailer import
import PDFDocument from "pdfkit"; // <-- Import PDFKit

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env for local development and PM2
// Prefer .env values to ensure deployments pick up updates without stale PM2 envs
// 1) Try default CWD (useful when running from project root)
dotenv.config({ override: true });
// 2) Try likely relative paths when started via PM2 or compiled build
try {
	const candidateEnvPaths = [
		// When running via tsx from source: server -> project root
		path.resolve(__dirname, "../.env"),
		// When running compiled code: build/server -> project root
		path.resolve(__dirname, "../../.env"),
	];
	for (const p of candidateEnvPaths) {
		if (fs.existsSync(p)) {
			dotenv.config({ path: p, override: true });
		}
	}
} catch (e) {
	// best-effort; ignore if not found
}

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
	timeout: 120000, // 60 second timeout
	maxRetries: 3, // Retry up to 3 times on network errors
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
// Custom middleware for weighted story generation limiting
const storyGenerationLimiter = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		// If user is not authenticated, apply basic IP-based rate limiting
		if (!req.userId) {
			console.warn("Rate limiting story generation by IP (userId not found)");
			// For unauthenticated users, use a simple rate limiter
			const basicLimiter = rateLimit({
				windowMs: 24 * 60 * 60 * 1000, // 24 hours
				max: 3, // 3 requests per IP per day
				keyGenerator: (req: Request) => req.ip || "unknown",
				message: {
					error:
						"Too many story generation requests. Please try again tomorrow.",
				},
			});
			return basicLimiter(req, res, next);
		}

		try {
			// Check user's subscription tier
			const userProgress = await prisma.userProgress.findUnique({
				where: { userId: req.userId },
				select: { subscriptionTier: true },
			});

			// Premium users have unlimited generations, but Pro users have a higher limit
			if (
				userProgress &&
				userProgress.subscriptionTier === SubscriptionTier.PREMIUM
			) {
				return next(); // Allow unlimited generations for premium users
			}

			// For PRO users, check their higher limit (10 weighted generations per day)
			if (
				userProgress &&
				userProgress.subscriptionTier === SubscriptionTier.PRO
			) {
				const { length } = req.body || {};
				console.log(
					`DEBUG: PRO user - Received length parameter: "${length}" for user ${req.userId}`
				);
				const proposedStoryWeight = getStoryGenerationWeight(length || "short");
				console.log(
					`DEBUG: PRO user - Calculated weight: ${proposedStoryWeight} for length: "${length}" (normalized: "${(
						length || "short"
					).toLowerCase()}")`
				);
				const currentWeightedCount = await calculateWeightedStoryCount(
					req.userId
				);

				const proLimit = 10; // PRO users get 10 weighted generations per day

				// Check if adding this story would exceed the PRO limit
				if (currentWeightedCount + proposedStoryWeight > proLimit) {
					console.log(
						`PRO rate limit exceeded: ${currentWeightedCount} + ${proposedStoryWeight} > ${proLimit} for user ${req.userId}`
					);

					return res.status(429).json({
						error: `You've reached your daily story generation limit of ${proLimit} for the PRO tier. You've used ${currentWeightedCount}/${proLimit} weighted generations, and this ${
							length || "short"
						} story (weight: ${proposedStoryWeight}) would exceed your limit. Please try again tomorrow.`,
					});
				}

				// If within PRO limits, allow the request
				console.log(
					`PRO story generation allowed: ${currentWeightedCount} + ${proposedStoryWeight} <= ${proLimit} for user ${req.userId}`
				);
				return next();
			}

			// For free users, check the weighted limit including the proposed story
			const { length } = req.body || {};
			console.log(
				`DEBUG: Received length parameter: "${length}" for user ${req.userId}`
			);
			const proposedStoryWeight = getStoryGenerationWeight(length || "short");
			console.log(
				`DEBUG: Calculated weight: ${proposedStoryWeight} for length: "${length}" (normalized: "${(
					length || "short"
				).toLowerCase()}")`
			);
			const currentWeightedCount = await calculateWeightedStoryCount(
				req.userId
			);

			const limit = 3; // Same as max in the original rate limiter config

			// Check if adding this story would exceed the limit
			if (currentWeightedCount + proposedStoryWeight > limit) {
				console.log(
					`Rate limit exceeded: ${currentWeightedCount} + ${proposedStoryWeight} > ${limit} for user ${req.userId}`
				);

				return res.status(429).json({
					error: `Too many story generation requests today for free users. You've used ${currentWeightedCount}/3 weighted generations, and this ${
						length || "short"
					} story (weight: ${proposedStoryWeight}) would exceed your limit. Upgrade to premium or try again tomorrow.`,
				});
			}

			// If within limits, allow the request
			console.log(
				`Story generation allowed: ${currentWeightedCount} + ${proposedStoryWeight} <= ${limit} for user ${req.userId}`
			);
			next();
		} catch (error) {
			console.error("Error checking rate limit:", error);
			// Fallback: deny the request if we can't determine the limit
			return res.status(500).json({
				error: "Could not verify rate limit. Please try again.",
			});
		}
	}
);
// --- END RATE LIMITER SETUP ---

// --- START HELPER FUNCTIONS ---
// Helper function to calculate story generation weight based on length
const getStoryGenerationWeight = (length: string): number => {
	const normalizedLength = length?.toLowerCase() || "short";
	switch (normalizedLength) {
		case "short":
			return 1;
		case "medium":
			return 2;
		case "long":
			return 3;
		case "very_long_pro":
			return 3; // Pro stories also count as 3
		default:
			return 1; // Default to 1 if length is unknown
	}
};

// Helper function to calculate total weighted story count for a user in the last 24 hours
const calculateWeightedStoryCount = async (userId: string): Promise<number> => {
	const recentStories = await prisma.story.findMany({
		where: {
			userId: userId,
			createdAt: {
				gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
			},
		},
		select: { length: true },
	});

	return recentStories.reduce((total, story) => {
		return total + getStoryGenerationWeight(story.length || "short");
	}, 0);
};
// --- END HELPER FUNCTIONS ---

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

		// Configure transporter using environment variables
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
			port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
			secure: false, // true for 465, false for other ports
			auth: {
				user: process.env.EMAIL_SMTP_USER,
				pass: process.env.EMAIL_SMTP_PASS,
			},
		});

		// Set up email data
		const mailOptions = {
			from: `"${process.env.EMAIL_FROM_NAME || "DuoBook Contact Form"}" <${
				process.env.EMAIL_FROM_ADDRESS || "help.indicatorinsights@gmail.com"
			}>`,
			to: process.env.EMAIL_TO_ADDRESS || "support@duobook.co",
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

// --- START GET LATEST STORIES (PUBLIC or AUTH) ---
app.get(
	"/api/stories/latest",
	optionalAuthenticateTokenMiddleware,
	asyncHandler(async (req: Request, res: Response) => {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 12;
		const excludeCurrentUser = req.query.excludeCurrentUser === "true";
		const sourceLanguage = req.query.sourceLanguage as string;
		const targetLanguage = req.query.targetLanguage as string;
		const sortBy = (req.query.sort as string) || "createdAt_desc";

		const where: Prisma.StoryWhereInput = {
			isPublic: true,
		};

		if (excludeCurrentUser && req.userId) {
			where.userId = { not: req.userId };
		}
		if (sourceLanguage) {
			where.sourceLanguage = sourceLanguage;
		}
		if (targetLanguage) {
			where.targetLanguage = targetLanguage;
		}

		// Initial query to get available languages
		const distinctLanguages = await prisma.story.findMany({
			where: { isPublic: true },
			select: {
				sourceLanguage: true,
				targetLanguage: true,
			},
			distinct: ["sourceLanguage", "targetLanguage"],
		});

		const availableLanguages = {
			source: [
				...new Set(
					distinctLanguages
						.map((s) => s.sourceLanguage)
						.filter(Boolean) as string[]
				),
			],
			target: [
				...new Set(
					distinctLanguages
						.map((s) => s.targetLanguage)
						.filter(Boolean) as string[]
				),
			],
		};

		let orderBy: Prisma.StoryOrderByWithRelationInput = {};
		if (sortBy === "createdAt_desc") {
			orderBy = { createdAt: "desc" };
		} else if (sortBy === "createdAt_asc") {
			orderBy = { createdAt: "asc" };
		} else if (sortBy === "likes_desc") {
			orderBy = {
				storyLikes: {
					_count: "desc",
				},
			};
		}

		// Handle length sorting with a raw query if needed, otherwise use Prisma's orderBy
		if (sortBy === "length_desc" || sortBy === "length_asc") {
			const sortDirection = sortBy === "length_desc" ? "DESC" : "ASC";

			// Base part of the query
			let query = `
				SELECT 
					s.id, s."shareId", s.description, s.story, s."sourceLanguage", s."targetLanguage", 
					s.difficulty, s.length, s."createdAt", s.likes
				FROM "Story" s
				WHERE s."isPublic" = true
			`;

			const queryParams: any[] = [];

			if (excludeCurrentUser && req.userId) {
				queryParams.push(req.userId);
				query += ` AND s."userId" != $${queryParams.length}`;
			}
			if (sourceLanguage) {
				queryParams.push(sourceLanguage);
				query += ` AND s."sourceLanguage" = $${queryParams.length}`;
			}
			if (targetLanguage) {
				queryParams.push(targetLanguage);
				query += ` AND s."targetLanguage" = $${queryParams.length}`;
			}

			// Add sorting by word count
			query += ` ORDER BY array_length(regexp_split_to_array(s.story, '\\s+'), 1) ${sortDirection}`;

			// Add pagination
			const offset = (page - 1) * limit;
			queryParams.push(limit);
			query += ` LIMIT $${queryParams.length}`;
			queryParams.push(offset);
			query += ` OFFSET $${queryParams.length}`;

			const storiesFromRaw = await prisma.$queryRawUnsafe(
				query,
				...queryParams
			);

			// Since raw queries return plain objects, we process them further down
			// We skip the standard Prisma findMany call for this case

			const totalStories = await prisma.story.count({ where });
			const totalPages = Math.ceil(totalStories / limit);

			let storiesWithLikes = storiesFromRaw as any[]; // Start with raw query result
			const userId = req.userId;

			if (userId && storiesWithLikes.length > 0) {
				const storyIds = storiesWithLikes.map((s: any) => s.id);
				const userLikes = await prisma.storyLike.findMany({
					where: {
						storyId: { in: storyIds },
						userId: userId,
					},
					select: {
						storyId: true,
					},
				});
				const likedStoryIds = new Set(userLikes.map((like) => like.storyId));
				storiesWithLikes = storiesWithLikes.map((story: any) => ({
					...story,
					userHasLiked: likedStoryIds.has(story.id),
				}));
			}

			return res.json({
				stories: storiesWithLikes,
				currentPage: page,
				totalPages,
				availableLanguages,
			});
		}

		const totalStories = await prisma.story.count({ where });
		const totalPages = Math.ceil(totalStories / limit);
		const offset = (page - 1) * limit;

		const stories = await prisma.story.findMany({
			where,
			orderBy,
			take: limit,
			skip: offset,
			select: {
				id: true,
				shareId: true,
				description: true,
				story: true, // Add this line
				sourceLanguage: true,
				targetLanguage: true,
				difficulty: true,
				length: true,
				createdAt: true,
				likes: true,
			},
		});

		let storiesWithLikes = stories;
		const userId = req.userId;

		if (userId) {
			const storyIds = stories.map((s) => s.id);
			const userLikes = await prisma.storyLike.findMany({
				where: {
					storyId: { in: storyIds },
					userId: userId,
				},
				select: {
					storyId: true,
				},
			});
			const likedStoryIds = new Set(userLikes.map((like) => like.storyId));
			storiesWithLikes = stories.map((story) => ({
				...story,
				userHasLiked: likedStoryIds.has(story.id),
			}));
		}

		res.json({
			stories: storiesWithLikes,
			currentPage: page,
			totalPages,
			availableLanguages,
		});
	})
);
// --- END GET LATEST STORIES ---

// GET a single story by its *shareId* (publicly accessible)
app.get(
	"/api/stories/:shareId",
	optionalAuthenticateTokenMiddleware,
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const { shareId } = req.params; // Use shareId directly as a string
		const userId = req.userId;

		try {
			const story = await prisma.story.findUnique({
				where: { shareId },
			});

			if (!story) {
				return res.status(404).json({ error: "Story not found." });
			}

			let userHasLiked = false;
			if (userId) {
				const storyLike = await prisma.storyLike.findUnique({
					where: {
						storyId_userId: {
							storyId: story.id,
							userId,
						},
					},
				});
				userHasLiked = !!storyLike;
			}

			res.status(200).json({ ...story, userHasLiked });
		} catch (error) {
			next(error);
		}
	})
);

// --- Like/Unlike a story ---
app.post(
	"/api/stories/:storyId/like",
	authenticateTokenMiddleware,
	asyncHandler(async (req: Request, res: Response) => {
		const storyId = parseInt(req.params.storyId);
		const userId = req.userId as string;

		// Check if the user has already liked the story
		const existingLike = await prisma.storyLike.findUnique({
			where: { storyId_userId: { storyId, userId } },
		});

		if (existingLike) {
			const story = await prisma.story.findUnique({ where: { id: storyId } });
			return res.status(200).json(story);
		}

		// Use a transaction to ensure data consistency
		const [, story] = await prisma.$transaction([
			prisma.storyLike.create({
				data: {
					storyId,
					userId,
				},
			}),
			prisma.story.update({
				where: { id: storyId },
				data: { likes: { increment: 1 } },
			}),
		]);

		res.status(200).json(story);
	})
);

app.delete(
	"/api/stories/:storyId/unlike",
	authenticateTokenMiddleware,
	asyncHandler(async (req: Request, res: Response) => {
		const storyId = parseInt(req.params.storyId);
		const userId = req.userId as string;

		// Check if the like exists before trying to delete
		const existingLike = await prisma.storyLike.findUnique({
			where: { storyId_userId: { storyId, userId } },
		});

		if (!existingLike) {
			const story = await prisma.story.findUnique({ where: { id: storyId } });
			return res.status(200).json(story);
		}

		const [, story] = await prisma.$transaction([
			prisma.storyLike.delete({
				where: {
					storyId_userId: {
						storyId,
						userId,
					},
				},
			}),
			prisma.story.update({
				where: { id: storyId },
				data: { likes: { decrement: 1 } },
			}),
		]);

		res.status(200).json(story);
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

			// Premium users have unlimited generations
			if (
				userProgress &&
				userProgress.subscriptionTier === SubscriptionTier.PREMIUM
			) {
				return res.status(200).json({
					limit: 999,
					remaining: 999,
					isPremium: true,
					subscriptionTier: userProgress.subscriptionTier,
				});
			}

			// PRO users have a limit of 10 weighted generations per day
			if (
				userProgress &&
				userProgress.subscriptionTier === SubscriptionTier.PRO
			) {
				const proLimit = 10;
				const weightedStoryCount = await calculateWeightedStoryCount(userId);
				const remaining = Math.max(0, proLimit - weightedStoryCount);

				return res.status(200).json({
					limit: proLimit,
					remaining,
					isPremium: true,
					subscriptionTier: userProgress.subscriptionTier,
				});
			}

			// For free users, count weighted stories created in the past 24 hours

			const limit = 3; // Same as in the rate limiter config
			const weightedStoryCount = await calculateWeightedStoryCount(userId);

			const remaining = Math.max(0, limit - weightedStoryCount);

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

		const {
			description,
			source,
			target,
			difficulty,
			length,
			isPublic,
			genre,
			grammarFocus,
		} = req.body;

		// Basic validation
		if (!description || !source || !target || !difficulty || !length) {
			const err = new Error(
				"Missing required parameters for story generation."
			);
			(err as any).status = 400;
			return next(err);
		}

		let story_difficulty;
		if (difficulty == "Beginner") {
			story_difficulty = "A1/A2";
		} else if (difficulty == "Intermediate") {
			story_difficulty = "B1/B2";
		} else if (difficulty == "Advanced") {
			story_difficulty = "C1/C2";
		}

		let prompt;
		const isProStoryRequest = length === "very_long_pro";

		let numPages;
		if (isProStoryRequest) {
			numPages = 10; // Updated to 10 pages
		} else if (length === "Long") {
			numPages = 4; // Updated to 4 pages
		} else if (length === "Medium") {
			numPages = 2; // Updated to 2 pages
		} else if (length === "Short") {
			numPages = 1; // Updated to 1 page
		} else {
			console.log("Invalid length parameter:", numPages);
		}

		// Common part of the prompt
		let basePrompt = `Analyze the user's description: "${description}".
			
If the description contains profanity, hate speech, incitement to violence, or other severely harmful content, then do not generate the story. Instead, return a JSON object with a single key "moderation_error", and its value being a string explaining the violation. For example: { "moderation_error": "The story description contains prohibited content (e.g., profanity or hate speech). Please revise." }
If the description is acceptable, proceed to generate a story as requested below. 

Create an interesting story based on this description. The story should have exactly ${numPages} pages.
The story should be suitable for a ${story_difficulty} learner of ${target} whose native language is ${source}. 
`;

		// Add genre if provided
		if (genre && genre !== "") {
			basePrompt += `The story should be in the ${genre} genre.\n`;
		}

		// Add grammar focus if provided
		if (
			grammarFocus &&
			Array.isArray(grammarFocus) &&
			grammarFocus.length > 0 &&
			grammarFocus[0] !== ""
		) {
			const focus = grammarFocus[0]; // Since we expect only one selection for now
			let grammarInstruction = "";
			switch (focus) {
				case "past-tenses":
					grammarInstruction =
						"The story should emphasize the use of past tenses.\n";
					break;
				case "future-tenses":
					grammarInstruction =
						"The story should emphasize the use of future tenses.\n";
					break;
				case "conditionals":
					grammarInstruction =
						"The story should include several examples of conditional sentences (e.g., if/then clauses).\n";
					break;
				default:
					// Optional: log if an unexpected value is received
					console.warn(`Unexpected grammarFocus value: ${focus}`);
					break;
			}
			if (grammarInstruction) {
				basePrompt += grammarInstruction;
			}
		}

		prompt =
			basePrompt +
			`Return the story as a JSON object with a single key "pages".
"pages" should be an array of page objects. Each page object must have two keys:
1.  "sentencePairs": An array of objects, where each object has a "source" sentence (in ${source}) and a "target" sentence (translated to ${target}). Each "sentencePairs" array should contain between 10 and 12 sentence pairs.
2.  "vocabulary": An array of objects, where each object has a "word" (in ${source}) and its "translation" (in ${target}), relevant to that page's content.
Use simple language appropriate for the difficulty level. Ensure the JSON is valid.
Example page object: { "sentencePairs": [{ "source": "...", "target": "..." } /* ...10 to 12 pairs total */], "vocabulary": [{ "word": "...", "translation": "..." }] }.`;

		try {
			console.log("Sending request to OpenAI...");
			console.log(`Using model: gpt-5-mini`); // Log which model is being used

			// Add retry logic for network errors
			let completion;
			let retries = 0;
			const maxRetries = 3;

			while (retries < maxRetries) {
				try {
					completion = await openai.chat.completions.create({
						model: "gpt-5-mini",
						messages: [{ role: "user", content: prompt }],
						response_format: { type: "json_object" }, // Enforce JSON output
					});
					break; // Success, exit retry loop
				} catch (apiError: any) {
					retries++;
					console.error(`OpenAI API attempt ${retries} failed:`, apiError);

					// Check if it's a network error that might be retryable
					if (
						(apiError.code === "ECONNRESET" ||
							apiError.code === "ECONNABORTED" ||
							apiError.type === "system" ||
							apiError.message?.includes("socket hang up")) &&
						retries < maxRetries
					) {
						console.log(
							`Retrying in 2 seconds... (attempt ${retries + 1}/${maxRetries})`
						);
						await new Promise((resolve) => setTimeout(resolve, 2000));
						continue;
					}

					// If not retryable or max retries reached, throw the error
					throw apiError;
				}
			}

			const storyContent = completion?.choices[0]?.message?.content;

			if (!storyContent) {
				throw new Error("OpenAI did not return story content.");
			}

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
				console.log(parsedStory);
				if (!parsedStory.pages || !Array.isArray(parsedStory.pages)) {
					throw new Error(
						"Invalid JSON structure for paginated story received from OpenAI (missing 'pages' array)."
					);
				}
				// Could add deeper validation for each page object here if needed

				res.status(200).json(parsedStory); // Send parsed JSON back
			} catch (parseError) {
				console.error("Error parsing OpenAI response:", parseError);
				console.error("Raw OpenAI response:", storyContent);
				throw new Error("Failed to parse story JSON from OpenAI.");
			}
		} catch (error: any) {
			console.error("Error calling OpenAI API:", error);

			// Provide more specific error messages based on error type
			let errorMessage = "Failed to generate story via OpenAI.";
			let statusCode = 502;

			if (error.code === "ECONNRESET" || error.code === "ECONNABORTED") {
				errorMessage = "Network connection error. Please try again.";
				statusCode = 503; // Service Unavailable
			} else if (error.status === 429) {
				errorMessage = "OpenAI rate limit exceeded. Please try again later.";
				statusCode = 429;
			} else if (error.status === 401) {
				errorMessage = "OpenAI API authentication failed.";
				statusCode = 500; // Internal server error (don't expose API key issues)
			} else if (error.message?.includes("socket hang up")) {
				errorMessage = "Connection timeout. Please try again.";
				statusCode = 503;
			}

			// Forward a more specific error
			const err = new Error(errorMessage);
			(err as any).status = statusCode;
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
			isPublic, // Only isPublic is saved from req.body for story creation
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
				// For non-PRO stories, the rate limiter already handled weighted checking
				// No additional validation needed here since the request passed the rate limiter
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
					isPublic: isPublic, // Save the isPublic flag
					// Genre and grammarFocus are intentionally not saved here
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
		const { pointsToAdd, level, vocabularySrsData } = req.body; // Accept pointsToAdd, level, or FSRS data

		// Declare updateData outside the try block
		let updateData: {
			points?: { increment: number };
			level?: number;
			vocabularySrsData?: any; // Prisma will handle JSON conversion
		} = {};

		try {
			// Populate updateData inside the try block
			if (typeof pointsToAdd === "number") {
				updateData.points = { increment: pointsToAdd };
			}
			if (typeof level === "number") {
				updateData.level = level;
			}
			if (vocabularySrsData !== undefined) {
				updateData.vocabularySrsData = vocabularySrsData;
			}

			if (Object.keys(updateData).length === 0) {
				const err = new Error(
					"No update data provided (pointsToAdd, level, or vocabularySrsData)."
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

					// Level Up Check (moved inside transaction) - Standardized Logic
					const currentLevel = updatedProg.level;
					const currentPoints = updatedProg.points;
					// Standardized pointsForLevel function (same as in PUT /api/progress)
					const pointsForLevel = (lvl: number) => (((lvl - 1) * lvl) / 2) * 100;

					let newCalculatedLevel = currentLevel;
					// Check if user's current points meet threshold for next levels
					while (currentPoints >= pointsForLevel(newCalculatedLevel + 1)) {
						newCalculatedLevel++;
					}

					if (newCalculatedLevel > currentLevel) {
						console.log(
							`User ${userId} leveled up from ${currentLevel} to ${newCalculatedLevel} (Challenge Completion)!`
						);
						await tx.userProgress.update({
							where: { userId: userId },
							data: { level: newCalculatedLevel },
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

// --- PDF DOWNLOAD ENDPOINT ---
app.get(
	"/api/stories/:shareId/download/pdf", // <-- Changed endpoint to /pdf
	authenticateTokenMiddleware, // Require authentication
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const { shareId } = req.params;
		const userId = req.userId;

		if (!userId) {
			return res.status(401).json({ error: "User not authenticated" });
		}

		const userProgress = await prisma.userProgress.findUnique({
			where: { userId },
			select: { subscriptionTier: true },
		});

		// if (userProgress?.subscriptionTier !== SubscriptionTier.PRO) {
		// 	return res.status(403).json({
		// 		error: "PDF downloads are only available for PRO subscribers.",
		// 	});
		// }

		const story = await prisma.story.findUnique({
			where: { shareId },
		});

		if (!story || !story.story) {
			return res
				.status(404)
				.json({ error: "Story not found or content missing." });
		}

		try {
			const storyData = JSON.parse(story.story);

			let targetSentences: string[] = [];
			let sourceSentences: string[] = [];
			let vocabulary: { word: string; translation: string }[] = [];

			// Check for paginated format first
			if (
				storyData.pages &&
				Array.isArray(storyData.pages) &&
				storyData.pages.length > 0
			) {
				console.log("Handling paginated story format for PDF.");
				storyData.pages.forEach((page: any) => {
					if (page.sentencePairs && Array.isArray(page.sentencePairs)) {
						targetSentences.push(
							...page.sentencePairs.map((p: any) => p.target)
						);
						sourceSentences.push(
							...page.sentencePairs.map((p: any) => p.source)
						);
					}
					if (page.vocabulary && Array.isArray(page.vocabulary)) {
						vocabulary.push(...page.vocabulary);
					}
				});
			}
			// Else, check for the original flat format
			else if (
				storyData.sentencePairs &&
				Array.isArray(storyData.sentencePairs)
			) {
				console.log("Handling flat story format for PDF.");
				targetSentences = storyData.sentencePairs.map((p: any) => p.target);
				sourceSentences = storyData.sentencePairs.map((p: any) => p.source);
				vocabulary = storyData.vocabulary || [];
			}
			// Else, the format is invalid
			else {
				throw new Error(
					"Invalid story content format: Missing 'sentencePairs' or 'pages' array."
				);
			}

			if (targetSentences.length === 0) {
				throw new Error("No sentences found in story data.");
			}

			const bookTitle = story.description || "Generated Story";
			const authorName = "DuoBook AI";
			const targetLangCode = story.targetLanguage || "en";
			const sourceLangCode = story.sourceLanguage || "en";
			const storyLength = story.length || "N/A"; // Get story length
			const storyDifficulty = story.difficulty || "N/A"; // Get story difficulty

			// Vocabulary is already collected from the branches above

			// Create a new PDF document
			const doc = new PDFDocument({
				margin: 50,
				layout: "portrait",
				size: "A4",
			});
			// Register and use NotoSans font
			const notoSansFontPath = path.join(
				__dirname,
				"assets",
				"fonts",
				"NotoSans-Regular.ttf"
			);
			doc.registerFont("NotoSans", notoSansFontPath);
			doc.font("NotoSans"); // Set default font to NotoSans

			// --- Define Color Scheme ---
			const ACCENT_COLOR = "#F59E0B"; // Amber/Yellow
			const PRIMARY_TEXT_COLOR = "#000000"; // Black
			const SECONDARY_TEXT_COLOR = "#6B7280"; // Medium Gray
			const FOOTER_TEXT_COLOR = "#4B5563"; // Darker Gray

			const pageMargin = 50;
			const availableWidth = doc.page.width - pageMargin * 2;
			const columnGap = 20;
			const columnWidth = (availableWidth - columnGap) / 2;

			// --- Footer Function (adjusted for potential total page count) ---
			const addFooter = (currentPage: number, totalPages: number | string) => {
				const footerY = doc.page.height - pageMargin / 2;
				doc.font("NotoSans").fontSize(8).fillColor(FOOTER_TEXT_COLOR); // Use footer color
				doc.text(
					`DuoBook™ | ${bookTitle} | Page ${currentPage} of ${totalPages}`,
					pageMargin, // x
					footerY, // y
					{ align: "center", width: availableWidth }
				);
				doc.font("NotoSans").fillColor(PRIMARY_TEXT_COLOR); // Reset font and color explicitly
			};

			let currentPageNumber = 1;

			// Set headers for PDF download
			const fileName = `story-${shareId}.pdf`;
			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${fileName}"`
			);

			doc.pipe(res);

			// --- Page 1: Cover Page ---
			const coverMargin = pageMargin + 10; // Margin for border
			const coverWidth = doc.page.width - coverMargin * 2;
			const coverHeight = doc.page.height - coverMargin * 2;

			// Decorative Border
			doc
				.lineWidth(1)
				.rect(coverMargin, coverMargin, coverWidth, coverHeight)
				.stroke(ACCENT_COLOR);

			// Move inside the border for content
			doc.y = coverMargin + 30; // Start content lower
			doc.x = coverMargin; // Align to border margin
			const contentWidth = coverWidth; // Use width inside border

			// Title
			doc
				.font("NotoSans")
				.fontSize(28)
				.fillColor(ACCENT_COLOR)
				.text(bookTitle, { align: "center", width: contentWidth });
			doc.moveDown(2.5); // Increased spacing

			// Author
			doc
				.font("NotoSans")
				.fontSize(18)
				.fillColor(SECONDARY_TEXT_COLOR)
				.text(`By ${authorName}`, { align: "center", width: contentWidth });
			doc.moveDown(1.5); // Increased spacing

			// Languages
			doc
				.font("NotoSans")
				.fontSize(14)
				.fillColor(SECONDARY_TEXT_COLOR)
				.text(`Languages: ${targetLangCode} / ${sourceLangCode}`, {
					align: "center",
					width: contentWidth,
				});
			doc.moveDown(1); // Increased spacing

			// Length
			doc
				.font("NotoSans")
				.fontSize(14)
				.fillColor(SECONDARY_TEXT_COLOR)
				.text(`Length: ${storyLength}`, {
					align: "center",
					width: contentWidth,
				});
			doc.moveDown(1); // Increased spacing

			// Difficulty
			doc
				.font("NotoSans")
				.fontSize(14)
				.fillColor(SECONDARY_TEXT_COLOR)
				.text(`Difficulty: ${storyDifficulty}`, {
					align: "center",
					width: contentWidth,
				});
			doc.moveDown(1.5); // Increased spacing

			// Generation Date
			const generationDate = new Date().toLocaleDateString();
			doc
				.font("NotoSans")
				.fontSize(10)
				.fillColor(SECONDARY_TEXT_COLOR)
				.text(`Generated on: ${generationDate}`, {
					align: "center",
					width: contentWidth,
				});

			// Simple Logo/Footer Element for Cover
			const coverFooterY = doc.page.height - coverMargin - 30; // Position near bottom border
			doc
				.font("NotoSans")
				.fontSize(9)
				.fillColor(ACCENT_COLOR)
				.text("[ DuoBook ]", coverMargin, coverFooterY, {
					align: "center",
					width: contentWidth,
				});

			// Reset font and color for subsequent pages
			doc.font("NotoSans").fillColor(PRIMARY_TEXT_COLOR);

			// --- Page 2 onwards: Side-by-Side Columns ---
			doc.moveDown(3); // Add some vertical space
			let initialY = doc.y; // Store Y position after cover page content + moveDown

			doc
				.font("NotoSans")
				.fontSize(16)
				.fillColor(ACCENT_COLOR)
				.text("Story and Translation", { align: "center" }); // Accent header
			doc.moveDown(2);
			doc.fillColor(PRIMARY_TEXT_COLOR); // Reset color for content

			const sentencePairs = targetSentences.map((target, index) => ({
				target: target,
				source: sourceSentences[index] || "", // Ensure source exists
			}));

			let currentY = doc.y; // Start Y position for the first pair

			sentencePairs.forEach((pair, index) => {
				// --- Page Break Check ---
				const targetEstLines = Math.ceil(pair.target.length / 50) + 1;
				const sourceEstLines = Math.ceil(pair.source.length / 50) + 1;
				const estHeight = Math.max(targetEstLines, sourceEstLines) * 15; // Rough height estimate (12pt font)
				const bottomMarginPosition = doc.page.height - doc.page.margins.bottom;

				if (currentY + estHeight > bottomMarginPosition) {
					doc.addPage();
					currentPageNumber++;
					currentY = doc.page.margins.top; // Reset Y to top margin
					doc
						.font("NotoSans")
						.fontSize(16)
						.fillColor(ACCENT_COLOR)
						.text("Story and Translation (Continued)", { align: "center" }); // Accent header
					doc.moveDown(2);
					currentY = doc.y;
					doc.fillColor(PRIMARY_TEXT_COLOR); // Reset color
				}

				const startY = currentY;
				let targetEndY = startY;
				let sourceEndY = startY;

				// Draw target sentence (left column)
				doc.font("NotoSans").fontSize(12).fillColor(PRIMARY_TEXT_COLOR);
				doc.text(pair.target, pageMargin, startY, { width: columnWidth });
				targetEndY = doc.y;

				// Draw source sentence (right column) - Start at the same Y
				doc.font("NotoSans").fontSize(10).fillColor(SECONDARY_TEXT_COLOR);
				doc.text(pair.source, pageMargin + columnWidth + columnGap, startY, {
					width: columnWidth,
				});
				doc.font("NotoSans"); // Reset font
				sourceEndY = doc.y; // Get Y position AFTER text is drawn

				// Update Y for the next pair, adding a gap
				currentY = Math.max(targetEndY, sourceEndY) + 15; // Use max Y + gap
				doc.y = currentY; // Explicitly set doc.y for the next iteration's check
			});

			// Add footer to the last page of sentences
			addFooter(currentPageNumber, "?"); // Still don't know total pages

			// --- Vocabulary Section ---
			if (vocabulary.length > 0) {
				doc.font("NotoSans").fontSize(18).fillColor(ACCENT_COLOR); // Set font for title height calculation
				const titleHeight = doc.heightOfString("Key Vocabulary", {
					width: availableWidth,
				});
				doc.font("NotoSans").fontSize(11); // Set font for item height calculation
				const approxItemHeight = doc.heightOfString("W: T", {
					paragraphGap: 4,
				}); // Approx height of one item
				const neededHeight =
					titleHeight +
					1.5 * 12 /* moveDown */ +
					vocabulary.length * approxItemHeight +
					20; /* buffer */ // More refined height estimation
				const bottomMarginPosition = doc.page.height - doc.page.margins.bottom;

				if (doc.y + neededHeight > bottomMarginPosition) {
					doc.addPage();
					currentPageNumber++;
					currentY = doc.page.margins.top; // Reset Y to top margin
					doc
						.font("NotoSans")
						.fontSize(18)
						.fillColor(ACCENT_COLOR)
						.text("Key Vocabulary", { align: "center" }); // Accent title
					doc.moveDown(1.5);
					currentY = doc.y;
				}

				vocabulary.forEach((item: { word: string; translation: string }) => {
					doc.font("NotoSans").fontSize(11); // Ensure correct font is set
					const itemHeight = doc.heightOfString(
						`• ${item.word}: ${item.translation}`,
						{ paragraphGap: 4, width: availableWidth }
					);
					if (
						currentY + itemHeight >
						doc.page.height - doc.page.margins.bottom
					) {
						doc.addPage();
						currentPageNumber++;
						currentY = doc.page.margins.top;
						doc
							.font("NotoSans")
							.fontSize(18)
							.fillColor(ACCENT_COLOR)
							.text("Key Vocabulary (Continued)", { align: "center" }); // Accent title
						doc.moveDown(1.5);
						doc.font("NotoSans").fontSize(11); // Reset to standard NotoSans
					}
					doc.font("NotoSans").fontSize(11).fillColor(PRIMARY_TEXT_COLOR);
					doc.text(`• ${item.word}: `, pageMargin, currentY, {
						continued: true,
						paragraphGap: 4,
						width: availableWidth,
					});
					doc
						.fillColor(SECONDARY_TEXT_COLOR)
						.text(item.translation, { continued: false }); // Draw translation in secondary color
					doc.font("NotoSans"); // Ensure font is reset after potential style changes
					currentY = doc.y; // Update Y after drawing
				});
			}

			// --- Finalize and add footer to the last page ---
			const pageCount = doc.bufferedPageRange().count;
			addFooter(currentPageNumber, pageCount); // Add final footer to the current (last) page

			// Finalize the PDF
			doc.end();
		} catch (error) {
			console.error("Error generating PDF:", error);
			next(error);
		}
	})
);

// --- START LEADERBOARD ENDPOINT ---
app.get(
	"/api/leaderboard/:period",
	authenticateTokenMiddleware, // Apply authentication middleware
	asyncHandler(async (req: Request, res: Response) => {
		const { period } = req.params; // 'weekly', 'monthly', 'allTime'
		const currentAuthenticatedUserId = req.userId; // From authenticateTokenMiddleware - this is the ID of the user making the request

		// The frontend sends the current user's ID also in the query to explicitly request their rank.
		// We can use currentAuthenticatedUserId for fetching the current user's rank details.
		// const requestedUserIdForRank = req.query.userId as string | undefined;

		console.log(
			`Fetching leaderboard for period: ${period}, current auth user: ${currentAuthenticatedUserId}`
		);

		let topUsersData: any[] = [];
		let currentUserRankData: any | null = null;
		let activeUserIds: string[] = []; // For weekly/monthly active users
		let startDate: Date = new Date(); // For weekly/monthly period start

		const validPeriods = ["weekly", "monthly", "allTime"];
		if (!validPeriods.includes(period)) {
			return res.status(400).json({ error: "Invalid period specified." });
		}

		const topN = 10; // Number of top users to fetch

		// CORRECTED: Implement proper leaderboard logic for different periods
		let dateFilter = {};

		if (period === "allTime") {
			// All-time leaderboard: Show users with highest total points
			topUsersData = await prisma.userProgress.findMany({
				orderBy: {
					points: "desc",
				},
				take: topN,
				select: {
					userId: true,
					points: true,
					updatedAt: true,
				},
			});
		} else {
			// Weekly/Monthly: Show users who have been active in the period
			if (period === "weekly") {
				const today = new Date();
				startDate = new Date(today);
				// Set to Monday of current week (ISO week standard)
				const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
				startDate.setDate(today.getDate() - dayOfWeek);
				startDate.setHours(0, 0, 0, 0);
			} else if (period === "monthly") {
				const today = new Date();
				startDate = new Date(today.getFullYear(), today.getMonth(), 1);
				startDate.setHours(0, 0, 0, 0);
			}

			// Find active users: users who have created stories, unlocked achievements, or completed challenges in the period
			const activeUserIdsFromStories = await prisma.story.findMany({
				where: {
					createdAt: { gte: startDate },
				},
				select: { userId: true },
				distinct: ["userId"],
			});

			const activeUserIdsFromAchievements =
				await prisma.userAchievement.findMany({
					where: {
						unlockedAt: { gte: startDate },
					},
					select: { userId: true },
					distinct: ["userId"],
				});

			const activeUserIdsFromChallenges =
				await prisma.userDailyChallenge.findMany({
					where: {
						completedAt: { gte: startDate },
					},
					select: { userId: true },
					distinct: ["userId"],
				});

			// Combine all active user IDs
			const activeUserIdSet = new Set([
				...activeUserIdsFromStories.map((s) => s.userId),
				...activeUserIdsFromAchievements.map((a) => a.userId),
				...activeUserIdsFromChallenges.map((c) => c.userId),
			]);

			activeUserIds = Array.from(activeUserIdSet);

			// Get progress data for active users, ordered by points
			if (activeUserIds.length > 0) {
				topUsersData = await prisma.userProgress.findMany({
					where: {
						userId: { in: activeUserIds },
					},
					orderBy: {
						points: "desc",
					},
					take: topN,
					select: {
						userId: true,
						points: true,
						updatedAt: true,
					},
				});
			} else {
				// No active users in the period
				topUsersData = [];
			}
		}

		// Enhance topUsersData with email from Firebase Auth
		const enhancedTopUsers = await Promise.all(
			topUsersData.map(async (up) => {
				try {
					const firebaseUser = await admin.auth().getUser(up.userId);
					return {
						...up,
						name: firebaseUser.email || up.userId, // Use email, fallback to userId
						avatarUrl: firebaseUser.photoURL || null, // Use photoURL if available
					};
				} catch (error) {
					console.warn(
						`Could not fetch Firebase user for ${up.userId}:`,
						error
					);
					return { ...up, name: up.userId, avatarUrl: null }; // Fallback
				}
			})
		);

		// Format topUsers to match frontend expectations
		const formattedTopUsers = enhancedTopUsers.map((up, index) => ({
			rank: index + 1,
			name: up.name,
			score: up.points,
			avatarUrl: up.avatarUrl,
			change: "same", // Placeholder: Implement rank change logic later
			userId: up.userId, // Keep userId for potential highlighting on frontend
			isCurrentUser: false, // Initialize isCurrentUser
		}));

		// Fetch rank for the current authenticated user if they are logged in
		if (currentAuthenticatedUserId) {
			const currentUserIsTopUserEntry = formattedTopUsers.find(
				(u) => u.userId === currentAuthenticatedUserId
			);

			if (currentUserIsTopUserEntry) {
				// If current user is in top N, use that data and mark them
				currentUserRankData = {
					...currentUserIsTopUserEntry,
					isCurrentUser: true,
				};
				const topUserIndex = formattedTopUsers.findIndex(
					(u) => u.userId === currentAuthenticatedUserId
				);
				if (topUserIndex !== -1) {
					formattedTopUsers[topUserIndex].isCurrentUser = true;
				}
			} else {
				// If current user is not in top N, check if they were active in the period
				let currentUserIsActive = false;

				if (period !== "allTime") {
					// Check if current user has been active in the period
					const userStories = await prisma.story.count({
						where: {
							userId: currentAuthenticatedUserId,
							createdAt: { gte: startDate },
						},
					});

					const userAchievements = await prisma.userAchievement.count({
						where: {
							userId: currentAuthenticatedUserId,
							unlockedAt: { gte: startDate },
						},
					});

					const userChallenges = await prisma.userDailyChallenge.count({
						where: {
							userId: currentAuthenticatedUserId,
							completedAt: { gte: startDate },
						},
					});

					currentUserIsActive =
						userStories > 0 || userAchievements > 0 || userChallenges > 0;
				} else {
					// For all-time, all users with progress are considered active
					currentUserIsActive = true;
				}

				if (currentUserIsActive) {
					const currentUserProgress = await prisma.userProgress.findFirst({
						where: {
							userId: currentAuthenticatedUserId,
						},
						select: { points: true, userId: true },
					});

					if (currentUserProgress) {
						let firebaseCurrentUserName = currentUserProgress.userId; // Fallback
						let firebaseCurrentUserAvatar = null;
						try {
							const fbCurrentUser = await admin
								.auth()
								.getUser(currentUserProgress.userId);
							firebaseCurrentUserName =
								fbCurrentUser.email || currentUserProgress.userId;
							firebaseCurrentUserAvatar = fbCurrentUser.photoURL || null;
						} catch (error) {
							console.warn(
								`Could not fetch Firebase user for current user ${currentUserProgress.userId}:`,
								error
							);
						}

						// Count active users with more points than the current user
						let usersAhead: number;
						if (period === "allTime") {
							usersAhead = await prisma.userProgress.count({
								where: {
									points: { gt: currentUserProgress.points },
								},
							});
						} else {
							// For weekly/monthly, count active users with more points
							const activeUsersAhead = await prisma.userProgress.count({
								where: {
									userId: { in: activeUserIds },
									points: { gt: currentUserProgress.points },
								},
							});
							usersAhead = activeUsersAhead;
						}
						currentUserRankData = {
							rank: usersAhead + 1,
							name: firebaseCurrentUserName,
							score: currentUserProgress.points,
							isCurrentUser: true,
							avatarUrl: firebaseCurrentUserAvatar,
							change: "same", // Placeholder
							userId: currentUserProgress.userId,
						};
					}
				}
			}
		}

		res.status(200).json({
			topUsers: formattedTopUsers,
			currentUserRank: currentUserRankData,
		});
	})
);
// --- END LEADERBOARD ENDPOINT ---

// --- ERROR HANDLING ---
// Add a basic error handler to catch errors passed via next()
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error("Async Handler Error:", err.stack);
	// Avoid sending detailed stack in production
	res.status(500).json({ error: "Something went wrong on the server." });
});

// Start the server
const PORT = process.env.PORT || 3000; // Use environment variable or default
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// Set server timeout to 5 minutes (300 seconds) to handle long-running story generation
server.timeout = 300000; // 300 seconds in milliseconds
server.keepAliveTimeout = 300000; // Keep-alive timeout
server.headersTimeout = 300001; // Headers timeout (should be slightly higher than keepAliveTimeout)
