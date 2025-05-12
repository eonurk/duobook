import { PrismaClient } from "@prisma/client";
import cuid from "cuid";

const prisma = new PrismaClient();

async function main() {
	const storiesToUpdate = await prisma.story.findMany({
		where: {
			shareId: null,
		},
		select: {
			id: true, // Only select id, no need to fetch the whole story object
		},
	});

	if (storiesToUpdate.length === 0) {
		console.log("No stories found needing a shareId backfill.");
		return;
	}

	console.log(
		`Found ${storiesToUpdate.length} stories to backfill with shareId.`
	);

	let updatedCount = 0;
	for (const story of storiesToUpdate) {
		const newShareId = cuid();
		try {
			await prisma.story.update({
				where: { id: story.id },
				data: { shareId: newShareId },
			});
			console.log(`Updated story ${story.id} with shareId ${newShareId}`);
			updatedCount++;
		} catch (error) {
			console.error(`Failed to update story ${story.id}:`, error);
		}
	}

	console.log(
		`Successfully updated ${updatedCount} out of ${storiesToUpdate.length} stories.`
	);
	if (updatedCount !== storiesToUpdate.length) {
		console.warn("Some stories could not be updated. Check errors above.");
	}

	console.log("Backfill complete.");
}

main()
	.catch((e) => {
		console.error("Error during backfill script:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
