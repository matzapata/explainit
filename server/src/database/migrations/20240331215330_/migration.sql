/*
  Warnings:

  - You are about to drop the column `embeddingsIds` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `filesize` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `mimetype` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationLogo` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationName` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationUrl` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `published` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "embeddingsIds",
DROP COLUMN "filename",
DROP COLUMN "filesize",
DROP COLUMN "mimetype",
ADD COLUMN     "conversationStarters" TEXT[],
ADD COLUMN     "organizationLogo" TEXT NOT NULL,
ADD COLUMN     "organizationName" TEXT NOT NULL,
ADD COLUMN     "organizationUrl" TEXT NOT NULL,
ADD COLUMN     "published" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Message";

-- DropEnum
DROP TYPE "MessageAgent";

-- CreateTable
CREATE TABLE "ChatResource" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "embeddingIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "ChatResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_ownerId_key" ON "Chat"("ownerId");

-- AddForeignKey
ALTER TABLE "ChatResource" ADD CONSTRAINT "ChatResource_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
