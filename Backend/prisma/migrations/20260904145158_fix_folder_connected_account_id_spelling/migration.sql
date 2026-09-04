/*
  Warnings:

  - You are about to drop the column `connectedAcountId` on the `folders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "folders" DROP CONSTRAINT "folders_connectedAcountId_fkey";

-- AlterTable
ALTER TABLE "folders" DROP COLUMN "connectedAcountId",
ADD COLUMN     "connectedAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "connectedAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
