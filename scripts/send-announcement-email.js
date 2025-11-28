/**
 * Script to send announcement emails to DuoBook users
 *
 * Usage:
 * 1. Update the EMAIL_* environment variables in your .env file
 * 2. Run: node scripts/send-announcement-email.js
 *
 * Options:
 * - Test mode: Send to a single test email first
 * - Batch sending: Send in batches to avoid rate limits
 */

import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
	// Set to true to only send to test email
	TEST_MODE: true,
	TEST_EMAIL: "your-test-email@example.com",

	// Batch sending configuration
	BATCH_SIZE: 50, // Send 50 emails at a time
	BATCH_DELAY: 5000, // Wait 5 seconds between batches (in milliseconds)

	// Email subject
	SUBJECT: "🚀 DuoBook Just Got Better: Mobile App + Pro Features!",
};

// Create email transporter
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
	port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
	secure: false,
	auth: {
		user: process.env.EMAIL_SMTP_USER,
		pass: process.env.EMAIL_SMTP_PASS,
	},
});

// Load email templates
const htmlTemplate = fs.readFileSync(
	path.join(__dirname, "../user-announcement-email.html"),
	"utf-8"
);

const textTemplate = fs.readFileSync(
	path.join(__dirname, "../user-announcement-email.txt"),
	"utf-8"
);

/**
 * Personalize email template with user data
 */
function personalizeEmail(template, user) {
	return template
		.replace(
			/Hi there!/g,
			user.displayName ? `Hi ${user.displayName}!` : "Hi there!"
		)
		.replace(/\[User Name\]/g, user.displayName || "there");
}

/**
 * Send email to a single user
 */
async function sendEmail(user) {
	const personalizedHtml = personalizeEmail(htmlTemplate, user);
	const personalizedText = personalizeEmail(textTemplate, user);

	const mailOptions = {
		from: `"${process.env.EMAIL_FROM_NAME || "DuoBook"}" <${
			process.env.EMAIL_FROM_ADDRESS
		}>`,
		to: user.email,
		subject: CONFIG.SUBJECT,
		text: personalizedText,
		html: personalizedHtml,
		headers: {
			"List-Unsubscribe": "<mailto:unsubscribe@duobook.co>",
		},
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`✅ Sent to: ${user.email}`);
		return { success: true, email: user.email };
	} catch (error) {
		console.error(`❌ Failed to send to ${user.email}:`, error.message);
		return { success: false, email: user.email, error: error.message };
	}
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main function to send emails
 */
async function main() {
	console.log("📧 DuoBook Announcement Email Sender\n");
	console.log(
		"Mode:",
		CONFIG.TEST_MODE ? "🧪 TEST MODE" : "🚀 PRODUCTION MODE"
	);
	console.log("-----------------------------------\n");

	try {
		// Verify SMTP connection
		console.log("🔍 Verifying SMTP connection...");
		await transporter.verify();
		console.log("✅ SMTP connection verified\n");

		let users;

		if (CONFIG.TEST_MODE) {
			console.log(`📧 Test mode: Sending to ${CONFIG.TEST_EMAIL}\n`);
			users = [{ email: CONFIG.TEST_EMAIL, displayName: "Test User" }];
		} else {
			// Fetch all users from database
			console.log("📊 Fetching users from database...");
			const dbUsers = await prisma.user.findMany({
				select: {
					email: true,
					displayName: true,
				},
			});
			console.log(`✅ Found ${dbUsers.length} users\n`);
			users = dbUsers;
		}

		// Statistics
		const stats = {
			total: users.length,
			sent: 0,
			failed: 0,
			errors: [],
		};

		// Send emails in batches
		for (let i = 0; i < users.length; i += CONFIG.BATCH_SIZE) {
			const batch = users.slice(i, i + CONFIG.BATCH_SIZE);
			const batchNumber = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
			const totalBatches = Math.ceil(users.length / CONFIG.BATCH_SIZE);

			console.log(
				`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} emails)`
			);

			// Send all emails in current batch
			const results = await Promise.all(batch.map((user) => sendEmail(user)));

			// Update statistics
			results.forEach((result) => {
				if (result.success) {
					stats.sent++;
				} else {
					stats.failed++;
					stats.errors.push(result);
				}
			});

			// Wait before next batch (unless it's the last batch)
			if (i + CONFIG.BATCH_SIZE < users.length) {
				console.log(
					`⏳ Waiting ${CONFIG.BATCH_DELAY / 1000}s before next batch...\n`
				);
				await sleep(CONFIG.BATCH_DELAY);
			}
		}

		// Print final statistics
		console.log("\n═══════════════════════════════════");
		console.log("📊 FINAL STATISTICS");
		console.log("═══════════════════════════════════");
		console.log(`Total:   ${stats.total}`);
		console.log(`✅ Sent:   ${stats.sent}`);
		console.log(`❌ Failed: ${stats.failed}`);
		console.log("═══════════════════════════════════\n");

		if (stats.errors.length > 0) {
			console.log("❌ Failed emails:");
			stats.errors.forEach((error) => {
				console.log(`  - ${error.email}: ${error.error}`);
			});
		}

		if (CONFIG.TEST_MODE) {
			console.log("\n💡 Test mode complete! Check your test email inbox.");
			console.log(
				"   Set TEST_MODE to false in the script to send to all users.\n"
			);
		}
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
main();
