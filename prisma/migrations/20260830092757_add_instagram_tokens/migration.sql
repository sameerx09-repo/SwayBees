-- AlterTable
ALTER TABLE "Influencer" ADD COLUMN "instagramAccessToken" TEXT;
ALTER TABLE "Influencer" ADD COLUMN "instagramLastSyncedAt" DATETIME;
ALTER TABLE "Influencer" ADD COLUMN "instagramTokenExpires" DATETIME;
