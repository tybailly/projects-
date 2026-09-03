# Netflix Clone (MVP)

A full-stack, Netflix-style streaming app: authentication with multiple
profiles, a browsable catalog with genre rows, real video upload with
background transcoding into adaptive-bitrate HLS, playback with resume
support, a watchlist, search, and simple genre-based recommendations.

This is a personal/portfolio project, not Netflix's actual infrastructure —
see the root of this repo's conversation history for what is and isn't
realistic to clone. Web only for now; the backend is a plain REST API under
`/api/*`, so a native mobile client could reuse it later without backend
changes.

## Stack

- **Next.js 14 (App Router, TypeScript)** — frontend + backend API routes
- **PostgreSQL + Prisma** — data
- **NextAuth.js (Credentials) + bcrypt** — auth
- **S3-compatible storage** (MinIO locally, S3 in prod)
- **ffmpeg + BullMQ/Redis** — background transcoding into HLS
- **hls.js** — adaptive bitrate playback in the browser
- **Tailwind CSS** — UI

## Prerequisites

- Node.js 20+
- Docker (for Postgres/Redis/MinIO locally)
- **ffmpeg installed on your system** and available on `PATH` (required only
  for the transcode worker — e.g. `brew install ffmpeg` / `apt install ffmpeg`)

## Setup

```bash
cd netflix-clone
npm install
cp .env.example .env      # adjust values if needed
docker compose up -d      # postgres, redis, minio

npx prisma migrate dev    # creates the schema
npm run prisma:seed       # demo user + sample catalog (uses public test HLS streams)
```

Create the MinIO bucket referenced by `S3_BUCKET` (default `netflix-clone`)
once, via the MinIO console at http://localhost:9001 (login `minioadmin` /
`minioadmin`), or the `mc` CLI:

```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/netflix-clone
mc anonymous set download local/netflix-clone   # served directly for local dev
```

## Running

Three processes, each in its own terminal:

```bash
npm run dev        # Next.js app on http://localhost:3000
npm run worker      # transcode worker (only needed to process real uploads)
docker compose up   # if not already running in the background
```

Log in with the seeded demo account: `demo@example.com` / `password123`, or
register a new one at `/register`.

## Uploading and playing your own video

1. Go to `/admin/upload`, fill in the metadata, and choose a video file.
2. The upload goes straight to S3/MinIO via a presigned URL, then a
   transcode job is queued.
3. The worker downloads the source, produces 480p/720p/1080p renditions with
   ffmpeg, packages each as HLS, and uploads the result back to storage.
4. Once the title's status flips to `READY` (refresh `/admin/upload` to
   check), it's playable from its detail page like any seeded title.

## Project layout

See `prisma/schema.prisma` for the data model, `worker/transcode.ts` for the
ffmpeg/HLS pipeline, `src/lib/auth.ts` for the auth config, and
`src/components/VideoPlayer.tsx` for the hls.js playback integration.

## Deliberately out of scope for this MVP

Payments/billing, DRM, multi-region CDN, DASH support, ML-based
recommendations, native mobile apps, and social features (reviews/ratings).
