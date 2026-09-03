import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Public-domain / freely-licensed sample HLS streams, used only so the browse
// and playback UI has something real to play before you've uploaded and
// transcoded your own content. Real uploads get transcoded into real
// per-title manifests by the worker (see worker/transcode.ts).
const SAMPLE_MANIFESTS = [
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8",
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
];

const GENRES = ["Action", "Comedy", "Drama", "Documentary", "Sci-Fi"];

const TITLES: Array<{
  name: string;
  description: string;
  releaseYear: number;
  maturityRating: string;
  durationSeconds: number;
  genres: string[];
}> = [
  { name: "Ridge Runner", description: "A getaway driver takes one last job in a city that never forgives.", releaseYear: 2023, maturityRating: "PG-13", durationSeconds: 5400, genres: ["Action"] },
  { name: "Last Laugh Diner", description: "Three strangers, one closing shift, and a night that goes sideways.", releaseYear: 2022, maturityRating: "PG-13", durationSeconds: 4800, genres: ["Comedy"] },
  { name: "Quiet Harbor", description: "A family returns to their coastal hometown to confront the past.", releaseYear: 2021, maturityRating: "R", durationSeconds: 6300, genres: ["Drama"] },
  { name: "Deep Signals", description: "A look inside the scientists chasing radio echoes from the edge of the universe.", releaseYear: 2020, maturityRating: "PG", durationSeconds: 3900, genres: ["Documentary", "Sci-Fi"] },
  { name: "Neon Horizon", description: "In a city run by algorithms, one technician starts asking questions.", releaseYear: 2024, maturityRating: "PG-13", durationSeconds: 6600, genres: ["Sci-Fi", "Action"] },
  { name: "Second Helping", description: "A failing food truck gets a second chance from an unlikely investor.", releaseYear: 2023, maturityRating: "PG", durationSeconds: 5100, genres: ["Comedy", "Drama"] },
  { name: "The Long Shift", description: "A night-shift nurse holds a hospital together during a blackout.", releaseYear: 2019, maturityRating: "PG-13", durationSeconds: 5700, genres: ["Drama"] },
  { name: "Wired for Sound", description: "The untold story of the engineers who built the first synthesizers.", releaseYear: 2018, maturityRating: "PG", durationSeconds: 4200, genres: ["Documentary"] },
  { name: "Static Orbit", description: "A repair crew stranded on a dying satellite must choose who comes home.", releaseYear: 2022, maturityRating: "PG-13", durationSeconds: 6000, genres: ["Sci-Fi"] },
  { name: "Punchline City", description: "Two rival stand-up comics are forced to open for each other on tour.", releaseYear: 2024, maturityRating: "R", durationSeconds: 5400, genres: ["Comedy"] }
];

async function main() {
  const genreByName = new Map<string, { id: string }>();
  for (const name of GENRES) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    genreByName.set(name, genre);
  }

  for (const [index, t] of TITLES.entries()) {
    const existing = await prisma.title.findFirst({ where: { name: t.name } });
    if (existing) continue;

    await prisma.title.create({
      data: {
        name: t.name,
        description: t.description,
        releaseYear: t.releaseYear,
        maturityRating: t.maturityRating,
        durationSeconds: t.durationSeconds,
        status: "READY",
        hlsManifestKey: SAMPLE_MANIFESTS[index % SAMPLE_MANIFESTS.length],
        posterUrl: `https://picsum.photos/seed/${encodeURIComponent(t.name)}/400/600`,
        backdropUrl: `https://picsum.photos/seed/${encodeURIComponent(t.name)}-bg/1280/720`,
        genres: {
          create: t.genres.map((g) => ({ genreId: genreByName.get(g)!.id }))
        }
      }
    });
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

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
