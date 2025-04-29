import express, { Request, Response } from "express";
import { PrismaClient } from '../prisma/generated/client';

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// Health check route with defined types
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "API is running successfully!" });
});

app.get("/story", async (req: Request, res: Response) => {
  const { owner } = req.query;
  if (!owner) {
    res.status(400).json({ error: "Owner query parameter is required" });
    return;
  }
  // Simulate fetching stories from the database
  const stories = await prisma.story.findMany({
    where: {
      owner: String(owner),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  res.status(200).json(stories);
});

app.post("/story", async (req: Request, res: Response) => {
  const { owner, story } = req.body;
  if (!owner || !story) {
    res.status(400).json({ error: "Owner and story are required" });
    return;
  }
  // Simulate inserting a story into the database
  const newStory = await prisma.story.create({
    data: {
      owner: String(owner),
      story: String(story),
    },
  });
  res.status(201).json(newStory);
});

app.delete("/story", async (req: Request, res: Response) => {
  const { owner, story } = req.body;
  if (!owner || !story) {
    res.status(400).json({ error: "Owner and story are required" });
    return;
  }
  const result = await prisma.story.deleteMany({
    where: {
      owner: String(owner),
      story: String(story),
    },
  });
  if (!result) {
    res.status(404).json({ error: "Story not found" });
    return;
  }
  res.status(200).json({ success: result.count > 0 });
});

app.delete("/story/all", async (req: Request, res: Response) => {
  const { owner } = req.body;
  if (!owner) {
    res.status(400).json({ error: "Owner is required" });
    return;
  }
  const result = await prisma.story.deleteMany({
    where: {
      owner: String(owner),
    },
  });
  if (!result) {
    res.status(404).json({ error: "No stories found for this owner" });
    return;
  }
  res.status(200).json({ success: result.count > 0 });
});

// Error handling middleware
// for some reason this is always returning error
// app.use((err: Error, req: Request, res: Response, next: Function) => {
//   console.error(err.stack);
//   res.status(500).json({ error: "Something went wrong!" });
// });

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
