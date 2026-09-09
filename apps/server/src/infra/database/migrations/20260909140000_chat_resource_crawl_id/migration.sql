-- Group website resources that belong to the same crawl campaign.
ALTER TABLE "ChatResource" ADD COLUMN "crawlId" UUID;
CREATE INDEX "ChatResource_crawlId_idx" ON "ChatResource"("crawlId");
