CREATE TYPE "TaskMode" AS ENUM ('TEST', 'LIVE');
ALTER TABLE "Task" ADD COLUMN "mode" "TaskMode" NOT NULL DEFAULT 'LIVE';
ALTER TABLE "Influencer" ADD COLUMN "testWalletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX "Task_mode_createdAt_idx" ON "Task"("mode", "createdAt");
CREATE INDEX "Task_brandId_mode_idx" ON "Task"("brandId", "mode");
