-- CreateEnum
CREATE TYPE "ChatColor" AS ENUM ('purple', 'blue', 'cyan', 'green', 'red', 'orange', 'yellow', 'gray');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "color" "ChatColor" NOT NULL DEFAULT 'blue';

-- Spread existing chats across the palette instead of leaving them all blue.
UPDATE "Chat" AS c
SET color = colors.color
FROM (
  SELECT
    id,
    (ARRAY['purple','blue','cyan','green','red','orange','yellow','gray']::"ChatColor"[])[
      ((ROW_NUMBER() OVER (ORDER BY "createdAt")) - 1) % 8 + 1
    ] AS color
  FROM "Chat"
) AS colors
WHERE c.id = colors.id;
