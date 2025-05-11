-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationWarnings" INTEGER NOT NULL DEFAULT 0;
