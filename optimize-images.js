import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const images = [
	{
		input: "src/assets/duobook.jpg",
		output: "src/assets/duobook.jpg",
		options: { quality: 75 },
	},
	{
		input: "src/assets/duobook-explain.png",
		output: "src/assets/duobook-explain.webp",
		options: { quality: 80 },
	},
	{
		input: "src/assets/daily-limit.png",
		output: "src/assets/daily-limit.webp",
		options: { quality: 80 },
	},
];

async function optimizeImages() {
	for (const image of images) {
		console.log(`Optimizing ${image.input}...`);

		const inputPath = path.resolve(__dirname, image.input);
		const outputPath = path.resolve(__dirname, image.output);

		if (!fs.existsSync(inputPath)) {
			console.error(`Input file not found: ${inputPath}`);
			continue;
		}

		try {
			const ext = path.extname(image.output).toLowerCase();

			if (ext === ".jpg" || ext === ".jpeg") {
				await sharp(inputPath)
					.jpeg({ quality: image.options.quality, mozjpeg: true })
					.toFile(outputPath + ".temp");
			} else if (ext === ".png") {
				await sharp(inputPath)
					.png({ quality: image.options.quality, compressionLevel: 9 })
					.toFile(outputPath + ".temp");
			} else if (ext === ".webp") {
				await sharp(inputPath)
					.webp({ quality: image.options.quality })
					.toFile(outputPath + ".temp");
			}

			// Replace the original file
			fs.unlinkSync(inputPath);
			fs.renameSync(outputPath + ".temp", outputPath);

			const stats = fs.statSync(outputPath);
			console.log(
				`Optimized ${image.output}: ${(stats.size / 1024).toFixed(2)} KB`
			);
		} catch (error) {
			console.error(`Error optimizing ${image.input}:`, error);
		}
	}
}

optimizeImages().catch(console.error);
