// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define the challenges you want to add
const challengesToSeed = [
	{
		id: "read_story_1",
		title: "Story Time",
		description: "Complete reading any story today.",
		xpReward: 25,
		type: "READ_STORY", // Must match type used in API calls
		requiredCount: null,
		isCore: true,
	},
	{
		id: "learn_words_5",
		title: "Word Collector",
		description: "Reveal the translation for 5 new vocabulary words.",
		xpReward: 15,
		type: "LEARN_WORDS", // Must match type used in API calls
		requiredCount: 5,
		isCore: true,
	},
	{
		id: "generate_story_1",
		title: "Story Creator",
		description: "Generate a new story using the input form.",
		xpReward: 20,
		type: "GENERATE_STORY", // Need to add API call for this type
		requiredCount: null,
		isCore: false,
	},
	{
		id: "read_story_medium",
		title: "Chapter Complete",
		description: "Complete reading a story of 'medium' length.",
		xpReward: 35,
		type: "READ_STORY_MEDIUM", // Needs specific API logic
		requiredCount: null,
	},
	{
		id: "learn_words_10",
		title: "Lexicon Explorer",
		description: "Reveal the translation for 10 new vocabulary words.",
		xpReward: 30,
		type: "LEARN_WORDS",
		requiredCount: 10,
	},
	// Add more challenges as desired...
];

async function main() {
	for (const challengeData of challengesToSeed) {
		const challenge = await prisma.challenge.upsert({
			where: { id: challengeData.id },
			update: {},
			create: challengeData,
		});
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
