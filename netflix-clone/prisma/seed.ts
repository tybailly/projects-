import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  const demoEmail = "demo@example.com";
  const demoPassword = "password123";
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        profiles: {
          create: [
            { name: "Alex" },
            { name: "Kids", isKids: true }
          ]
        }
      }
    });
    console.log(`Seeded demo user: ${demoEmail} / ${demoPassword}`);
  }

  console.log("Seed complete. Run `npm run tmdb:sync` to populate your subscribed services' catalogs.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
