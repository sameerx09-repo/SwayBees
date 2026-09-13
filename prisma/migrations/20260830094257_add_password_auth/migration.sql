/*
  Warnings:

  - Added the required column `passwordHash` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Influencer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Brand" ("category", "companyName", "createdAt", "email", "id") SELECT "category", "companyName", "createdAt", "email", "id" FROM "Brand";
DROP TABLE "Brand";
ALTER TABLE "new_Brand" RENAME TO "Brand";
CREATE UNIQUE INDEX "Brand_email_key" ON "Brand"("email");
CREATE TABLE "new_Influencer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "instagramUserId" TEXT,
    "instagramConnected" BOOLEAN NOT NULL DEFAULT false,
    "instagramAccessToken" TEXT,
    "instagramTokenExpires" DATETIME,
    "instagramLastSyncedAt" DATETIME,
    "walletBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Influencer" ("createdAt", "email", "engagementRate", "followerCount", "handle", "id", "instagramAccessToken", "instagramConnected", "instagramLastSyncedAt", "instagramTokenExpires", "instagramUserId", "walletBalance") SELECT "createdAt", "email", "engagementRate", "followerCount", "handle", "id", "instagramAccessToken", "instagramConnected", "instagramLastSyncedAt", "instagramTokenExpires", "instagramUserId", "walletBalance" FROM "Influencer";
DROP TABLE "Influencer";
ALTER TABLE "new_Influencer" RENAME TO "Influencer";
CREATE UNIQUE INDEX "Influencer_handle_key" ON "Influencer"("handle");
CREATE UNIQUE INDEX "Influencer_email_key" ON "Influencer"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
