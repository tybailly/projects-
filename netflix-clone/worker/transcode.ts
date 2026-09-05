import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "../src/lib/s3";
import { prisma } from "../src/lib/prisma";
import type { TranscodeJobData } from "../src/lib/queue";

interface Rendition {
  name: string; // e.g. "480p"
  height: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
}

// Kept intentionally small (3 renditions) — enough to demonstrate real
// adaptive bitrate switching without long transcode times on a laptop.
const RENDITIONS: Rendition[] = [
  { name: "480p", height: 480, videoBitrateKbps: 1400, audioBitrateKbps: 128 },
  { name: "720p", height: 720, videoBitrateKbps: 2800, audioBitrateKbps: 128 },
  { name: "1080p", height: 1080, videoBitrateKbps: 5000, audioBitrateKbps: 192 }
];

async function downloadSource(sourceKey: string, destPath: string) {
  const result = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: sourceKey }));
  const body = result.Body;
  if (!body) throw new Error(`Source object ${sourceKey} has no body`);

  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(destPath);
    // @ts-expect-error - Body is a Node.js Readable in the Node runtime
    body.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

function transcodeRendition(inputPath: string, outputDir: string, rendition: Rendition): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .audioBitrate(rendition.audioBitrateKbps)
      .videoBitrate(rendition.videoBitrateKbps)
      .outputOptions([
        `-vf scale=-2:${rendition.height}`,
        "-preset veryfast",
        "-sc_threshold 0",
        "-g 48",
        "-hls_time 6",
        "-hls_playlist_type vod",
        `-hls_segment_filename ${path.join(outputDir, "segment_%03d.ts")}`
      ])
      .output(path.join(outputDir, "playlist.m3u8"))
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

function buildMasterPlaylist(renditions: Rendition[]): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const r of renditions) {
    const bandwidth = (r.videoBitrateKbps + r.audioBitrateKbps) * 1000;
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=x${r.height}`);
    lines.push(`${r.name}/playlist.m3u8`);
  }
  return lines.join("\n") + "\n";
}

async function uploadDirectory(localDir: string, s3Prefix: string) {
  const entries = await fsp.readdir(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const s3Key = `${s3Prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      await uploadDirectory(localPath, s3Key);
      continue;
    }
    const body = await fsp.readFile(localPath);
    const contentType = entry.name.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : entry.name.endsWith(".ts")
        ? "video/MP2T"
        : "application/octet-stream";
    await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: s3Key, Body: body, ContentType: contentType }));
  }
}

export async function processTranscodeJob(data: TranscodeJobData, onProgress?: (pct: number) => void) {
  const { titleId, sourceKey } = data;
  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), `netflix-clone-${titleId}-`));
  const sourcePath = path.join(workDir, "source.mp4");
  const hlsPrefix = `hls/${titleId}`;

  try {
    await downloadSource(sourceKey, sourcePath);

    for (const [index, rendition] of RENDITIONS.entries()) {
      await transcodeRendition(sourcePath, path.join(workDir, "hls", rendition.name), rendition);
      onProgress?.(Math.round(((index + 1) / RENDITIONS.length) * 90));
    }

    const masterPlaylist = buildMasterPlaylist(RENDITIONS);
    await fsp.writeFile(path.join(workDir, "hls", "master.m3u8"), masterPlaylist);

    await uploadDirectory(path.join(workDir, "hls"), hlsPrefix);
    onProgress?.(95);

    await prisma.$transaction([
      prisma.videoRendition.deleteMany({ where: { titleId } }),
      prisma.videoRendition.createMany({
        data: RENDITIONS.map((r) => ({
          titleId,
          resolution: r.name,
          bitrateKbps: r.videoBitrateKbps,
          s3Key: `${hlsPrefix}/${r.name}/playlist.m3u8`,
          status: "READY" as const
        }))
      }),
      prisma.title.update({
        where: { id: titleId },
        data: { status: "READY", hlsManifestKey: `${hlsPrefix}/master.m3u8`, failureReason: null }
      })
    ]);

    onProgress?.(100);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.title.update({ where: { id: titleId }, data: { status: "FAILED", failureReason: message } });
    throw err;
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true });
  }
}
