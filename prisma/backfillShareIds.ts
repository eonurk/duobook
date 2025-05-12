import { PrismaClient } from "@prisma/client";
import cuid from "cuid";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting the shareId column check and backfill process...");

	try {
		// Step 1: Check if the shareId column exists in the Story table
		console.log("Checking if the shareId column exists...");

		// Try to get column information from PostgreSQL's information_schema
		const columnExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Story' 
      AND column_name = 'shareId';
    `;

		// If the column doesn't exist, we need to create it
		if (!Array.isArray(columnExists) || columnExists.length === 0) {
			console.log("shareId column does not exist. Creating it now...");

			// Step 2: Add the shareId column to the Story table
			await prisma.$executeRaw`
        ALTER TABLE "Story" 
        ADD COLUMN "shareId" TEXT;
      `;
			console.log("shareId column created successfully.");

			// Step 3: Create a unique index on the shareId column
			console.log("Creating a unique index on the shareId column...");
			await prisma.$executeRaw`
        CREATE UNIQUE INDEX "Story_shareId_key" ON "Story"("shareId");
      `;
			console.log("Unique index created successfully.");
		} else {
			console.log("shareId column already exists.");
		}

		// Step 4: Find stories that need the shareId to be populated
		console.log("Checking for stories with missing shareId values...");
		const storiesToUpdate = await prisma.$queryRaw`
      SELECT id FROM "Story" 
      WHERE "shareId" IS NULL 
      OR "shareId" = ''
      OR "shareId" = ' ';
    `;

		const storiesArray = Array.isArray(storiesToUpdate) ? storiesToUpdate : [];

		if (storiesArray.length === 0) {
			console.log("No stories found needing a shareId backfill.");
			return;
		}

		console.log(
			`Found ${storiesArray.length} stories to update with a shareId.`
		);

		// Step 5: Update each story with a new CUID
		let updatedCount = 0;
		for (const story of storiesArray) {
			const id = Number(story.id);
			const newShareId = cuid();

			try {
				await prisma.$executeRaw`
          UPDATE "Story" 
          SET "shareId" = ${newShareId} 
          WHERE id = ${id};
        `;
				console.log(`Updated story ${id} with shareId ${newShareId}`);
				updatedCount++;
			} catch (error) {
				console.error(`Failed to update story ${id}:`, error);
			}
		}

		console.log(
			`Successfully updated ${updatedCount} out of ${storiesArray.length} stories.`
		);
		if (updatedCount !== storiesArray.length) {
			console.warn("Some stories could not be updated. Check errors above.");
		}

		// Step 6: Add NOT NULL constraint if all stories have been updated successfully
		if (updatedCount > 0 && updatedCount === storiesArray.length) {
			console.log("Adding NOT NULL constraint to shareId column...");
			await prisma.$executeRaw`
        ALTER TABLE "Story" 
        ALTER COLUMN "shareId" SET NOT NULL;
      `;
			console.log("NOT NULL constraint added successfully.");
		}
	} catch (error) {
		console.error("Error during database operations:", error);
	}

	console.log("Process complete.");
}

main()
	.catch((e) => {
		console.error("Error during script execution:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
