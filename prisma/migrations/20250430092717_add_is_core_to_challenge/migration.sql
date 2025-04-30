-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "requiredCount" INTEGER,
    "isCore" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Challenge" ("description", "id", "requiredCount", "title", "type", "xpReward") SELECT "description", "id", "requiredCount", "title", "type", "xpReward" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
