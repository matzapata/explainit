-- Track when a Chat was last edited vs last used by a Visitor.
ALTER TABLE "Chat" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Chat" SET "updatedAt" = "createdAt";
ALTER TABLE "Chat" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Chat" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Chat" ADD COLUMN "lastUsedAt" TIMESTAMP(3);

UPDATE "Chat" AS c
SET "lastUsedAt" = sub.max_updated
FROM (
  SELECT "chatId", MAX("updatedAt") AS max_updated
  FROM "Conversation"
  GROUP BY "chatId"
) AS sub
WHERE c."id" = sub."chatId";
