import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Genres available when tagging a self-hosted upload via /admin/upload.
// Real catalog data (posters, descriptions, genres) for your subscribed
// streaming services comes from `npm run tmdb:sync` instead of fake seed
// titles — see prisma/sync-tmdb.ts.
const GENRES = ["Action", "Comedy", "Drama", "Documentary", "Sci-Fi"];

async function main() {
  for (const name of GENRES) {
    await prisma.genre.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log("Seed complete. Register a real account at /register, then run `npm run tmdb:sync` to populate your subscribed services' catalogs.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
