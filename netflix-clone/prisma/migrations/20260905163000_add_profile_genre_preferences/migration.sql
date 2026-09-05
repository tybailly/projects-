-- CreateTable
CREATE TABLE "ProfileGenre" (
    "profileId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "ProfileGenre_pkey" PRIMARY KEY ("profileId","genreId")
);

-- AddForeignKey
ALTER TABLE "ProfileGenre" ADD CONSTRAINT "ProfileGenre_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileGenre" ADD CONSTRAINT "ProfileGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

