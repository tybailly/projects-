import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPresignedUploadUrl } from "@/lib/s3";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  releaseYear: z.number().int().optional(),
  maturityRating: z.string().optional(),
  genreIds: z.array(z.string()).default([]),
  fileName: z.string().min(1),
  contentType: z.string().min(1)
});

// Sanitizes a user-supplied filename to a safe S3 key segment.
function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  const title = await prisma.title.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      releaseYear: parsed.data.releaseYear,
      maturityRating: parsed.data.maturityRating,
      status: "PENDING",
      genres: { create: parsed.data.genreIds.map((genreId) => ({ genreId })) }
    }
  });

  const sourceKey = `raw/${title.id}/${safeFileName(parsed.data.fileName)}`;
  const uploadUrl = await createPresignedUploadUrl(sourceKey, parsed.data.contentType);

  await prisma.title.update({ where: { id: title.id }, data: { sourceS3Key: sourceKey } });

  return NextResponse.json({ titleId: title.id, uploadUrl, key: sourceKey });
}
