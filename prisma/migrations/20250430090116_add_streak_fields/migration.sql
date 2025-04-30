-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "dailyChallengesLastGenerated" DATETIME
);
INSERT INTO "new_UserProgress" ("dailyChallengesLastGenerated", "id", "level", "points", "updatedAt", "userId") SELECT "dailyChallengesLastGenerated", "id", "level", "points", "updatedAt", "userId" FROM "UserProgress";
DROP TABLE "UserProgress";
ALTER TABLE "new_UserProgress" RENAME TO "UserProgress";
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
