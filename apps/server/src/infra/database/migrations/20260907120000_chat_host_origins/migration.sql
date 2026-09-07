-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "hostOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[];
