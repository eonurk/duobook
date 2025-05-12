/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `Story` will be added. If there are existing duplicate values, this will fail.
  - Made the column `shareId` on table `Story` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "shareId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Story_shareId_key" ON "Story"("shareId");
