-- CreateEnum
CREATE TYPE "TitleSource" AS ENUM ('UPLOAD', 'PROVIDER');

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "source" "TitleSource" NOT NULL DEFAULT 'UPLOAD',
ADD COLUMN     "tmdbId" INTEGER;

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tmdbProviderId" INTEGER NOT NULL,
    "brandColor" TEXT NOT NULL,
    "searchUrlTemplate" TEXT NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_tmdbProviderId_key" ON "Provider"("tmdbProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "Title_providerId_tmdbId_key" ON "Title"("providerId", "tmdbId");

-- AddForeignKey
ALTER TABLE "Title" ADD CONSTRAINT "Title_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

