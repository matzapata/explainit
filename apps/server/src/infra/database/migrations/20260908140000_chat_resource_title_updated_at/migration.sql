-- Citation label for text resources; websites leave this null.
ALTER TABLE "ChatResource" ADD COLUMN "title" TEXT;

-- Track when a resource was last indexed / updated.
ALTER TABLE "ChatResource" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "ChatResource" SET "updatedAt" = "createdAt";
ALTER TABLE "ChatResource" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "ChatResource" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
