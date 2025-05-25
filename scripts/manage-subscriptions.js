#!/usr/bin/env node

/**
 * Admin Script for Managing User Subscriptions
 * 
 * Usage:
 * node scripts/manage-subscriptions.js --email user@example.com --tier PRO
 * node scripts/manage-subscriptions.js --uid firebase_uid --tier PREMIUM
 * node scripts/manage-subscriptions.js --list
 */

import { PrismaClient, SubscriptionTier } from '@prisma/client';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../firebase-admin-sdk.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Firebase Admin SDK file not found at:', serviceAccountPath);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const prisma = new PrismaClient();

async function getUserByEmail(email) {
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        return userRecord.uid;
    } catch (error) {
        console.error(`❌ User not found with email: ${email}`);
        return null;
    }
}

async function updateSubscription(userId, newTier) {
    try {
        // Validate tier
        if (!Object.values(SubscriptionTier).includes(newTier)) {
            throw new Error(`Invalid subscription tier: ${newTier}. Valid tiers: ${Object.values(SubscriptionTier).join(', ')}`);
        }

        const updatedUser = await prisma.userProgress.upsert({
            where: { userId },
            update: { subscriptionTier: newTier },
            create: { 
                userId, 
                subscriptionTier: newTier,
                points: 0,
                level: 1,
                streak: 0
            }
        });

        console.log(`✅ Successfully updated user ${userId} to ${newTier} tier`);
        return updatedUser;
    } catch (error) {
        console.error(`❌ Failed to update subscription:`, error.message);
        throw error;
    }
}

async function listUserSubscriptions(limit = 20) {
    try {
        const users = await prisma.userProgress.findMany({
            take: limit,
            orderBy: { subscriptionTier: 'desc' },
            select: {
                userId: true,
                subscriptionTier: true,
                points: true,
                level: true,
                updatedAt: true
            }
        });

        console.log('\n📊 User Subscriptions:');
        console.log('----------------------------------------');
        
        for (const user of users) {
            try {
                const firebaseUser = await admin.auth().getUser(user.userId);
                console.log(`${user.subscriptionTier.padEnd(8)} | ${firebaseUser.email?.padEnd(30) || 'No email'} | Points: ${user.points} | Level: ${user.level}`);
            } catch (error) {
                console.log(`${user.subscriptionTier.padEnd(8)} | ${user.userId.padEnd(30)} | Points: ${user.points} | Level: ${user.level} (Firebase user not found)`);
            }
        }
        
        console.log('----------------------------------------\n');
    } catch (error) {
        console.error(`❌ Failed to list subscriptions:`, error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    // Parse command line arguments
    const email = args[args.indexOf('--email') + 1];
    const uid = args[args.indexOf('--uid') + 1];
    const tier = args[args.indexOf('--tier') + 1];
    const list = args.includes('--list');
    const help = args.includes('--help') || args.includes('-h');

    if (help) {
        console.log(`
🔧 DuoBook Subscription Management Tool

Usage:
  node scripts/manage-subscriptions.js --email user@example.com --tier PRO
  node scripts/manage-subscriptions.js --uid firebase_uid --tier PREMIUM  
  node scripts/manage-subscriptions.js --list

Options:
  --email    User email address
  --uid      Firebase UID
  --tier     Subscription tier (FREE, PRO, PREMIUM)
  --list     List current subscriptions
  --help     Show this help message

Examples:
  # Upgrade user to PRO
  node scripts/manage-subscriptions.js --email john@example.com --tier PRO
  
  # Set user to PREMIUM using UID
  node scripts/manage-subscriptions.js --uid abc123xyz --tier PREMIUM
  
  # List all subscriptions
  node scripts/manage-subscriptions.js --list
        `);
        process.exit(0);
    }

    if (list) {
        await listUserSubscriptions();
        process.exit(0);
    }

    if (!tier || (!email && !uid)) {
        console.error('❌ Error: Please provide either --email or --uid along with --tier');
        console.error('Use --help for usage information');
        process.exit(1);
    }

    try {
        let userId = uid;
        
        if (email && !uid) {
            userId = await getUserByEmail(email);
            if (!userId) {
                process.exit(1);
            }
        }

        const result = await updateSubscription(userId, tier.toUpperCase());
        console.log('📊 Updated user info:', {
            userId: result.userId,
            subscriptionTier: result.subscriptionTier,
            points: result.points,
            level: result.level
        });

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
