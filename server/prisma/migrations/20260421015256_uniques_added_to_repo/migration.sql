/*
  Warnings:

  - A unique constraint covering the columns `[repo]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Repo_repo_key" ON "Repo"("repo");
