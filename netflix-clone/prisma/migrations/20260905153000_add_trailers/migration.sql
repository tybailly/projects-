-- AlterEnum
ALTER TYPE "TitleSource" ADD VALUE 'TRAILER';

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "trailerKey" TEXT;

