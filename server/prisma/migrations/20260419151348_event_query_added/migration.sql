/*
  Warnings:

  - You are about to drop the column `req` on the `Event` table. All the data in the column will be lost.
  - Added the required column `branch` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "req",
ADD COLUMN     "branch" TEXT NOT NULL,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
