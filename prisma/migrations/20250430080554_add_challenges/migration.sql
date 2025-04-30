-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN "dailyChallengesLastGenerated" DATETIME;

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "requiredCount" INTEGER
);

-- CreateTable
CREATE TABLE "UserDailyChallenge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "day" DATETIME NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "UserDailyChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProgress" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserDailyChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserDailyChallenge_userId_day_idx" ON "UserDailyChallenge"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyChallenge_userId_challengeId_day_key" ON "UserDailyChallenge"("userId", "challengeId", "day");
