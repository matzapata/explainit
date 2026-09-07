-- Cascade ChatResource rows when a Chat is deleted.
ALTER TABLE "ChatResource" DROP CONSTRAINT IF EXISTS "ChatResource_chatId_fkey";
ALTER TABLE "ChatResource" ADD CONSTRAINT "ChatResource_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
