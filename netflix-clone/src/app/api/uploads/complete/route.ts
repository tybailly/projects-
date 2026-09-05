import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transcodeQueue } from "@/lib/queue";

const bodySchema = z.object({ titleId: z.string() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const title = await prisma.title.findUnique({ where: { id: parsed.data.titleId } });
  if (!title || !title.sourceS3Key) {
    return NextResponse.json({ error: "Title has no uploaded source" }, { status: 400 });
  }

  await prisma.title.update({ where: { id: title.id }, data: { status: "TRANSCODING" } });

  await transcodeQueue.add(
    "transcode",
    { titleId: title.id, sourceKey: title.sourceS3Key },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );

  return NextResponse.json({ ok: true });
}
