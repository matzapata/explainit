-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- AlterTable
ALTER TABLE "ChatResource" ADD COLUMN "status" "ResourceStatus" NOT NULL DEFAULT 'ready';
ALTER TABLE "ChatResource" ADD COLUMN "error" TEXT;
