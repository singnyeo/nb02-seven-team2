/*
  Warnings:

  - You are about to drop the column `groupId` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_groupId_fkey";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "groupId";

-- CreateTable
CREATE TABLE "GroupTag" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "GroupTag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupTag" ADD CONSTRAINT "GroupTag_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTag" ADD CONSTRAINT "GroupTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
