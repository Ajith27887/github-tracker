/*
  Warnings:

  - You are about to drop the column `pullReq` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `pushReq` on the `Event` table. All the data in the column will be lost.
  - Added the required column `req` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "pullReq",
DROP COLUMN "pushReq",
ADD COLUMN     "req" TEXT NOT NULL;
