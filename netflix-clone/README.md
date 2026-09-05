# Netflix Clone (MVP)

A full-stack, Netflix-style streaming app: authentication with multiple
profiles, a browsable catalog with genre rows, real video upload with
background transcoding into adaptive-bitrate HLS, playback with resume
support, a watchlist, search, simple genre-based recommendations, and a
"Streaming Services" section that browses real catalog data (via TMDb) for
subscription services like Disney+/Paramount+/Peacock/Prime Video — Play on
those deep-links out to the service itself, since none of them expose an API
for embedding their DRM-protected video.

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
npm run prisma:seed       # demo user + genres
```

To populate the "Streaming Services" catalogs, get a free API key at
https://www.themoviedb.org/ (Settings → API → request a Developer key), add
it as `TMDB_API_KEY` in `.env`, then run:

```bash
npm run tmdb:sync
```

Re-run it any time to refresh the catalog. Edit the `PROVIDERS` list in
`prisma/sync-tmdb.ts` if you want different services than the default four.

The MinIO bucket referenced by `S3_BUCKET` (default `netflix-clone`) is
created automatically by the `minio-init` service in `docker-compose.yml`
the first time you run `docker compose up` — including setting it to allow
public downloads, which the browser needs to fetch HLS manifests/segments
and posters directly. No manual `mc` step required.

## Running

Three processes, each in its own terminal:

```bash
npm run dev        # Next.js app on http://localhost:3000
npm run worker      # transcode worker (only needed to process real uploads)
docker compose up   # if not already running in the background
```

Register an account at `/register` — you'll need the invite code set as
`INVITE_CODE` in `.env` (registration is closed entirely if that's unset).

### Making yourself an admin

Admins see an "Admin" tab that can delete any user (and their profiles) or
any title. There's no signup flag for this — grant it directly in the
database after registering:

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'you@example.com';
```

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
ffmpeg/HLS pipeline, `src/lib/auth.ts` for the auth config,
`src/components/VideoPlayer.tsx` for the hls.js playback integration, and
`prisma/sync-tmdb.ts` / `src/lib/providers.ts` for the subscription-service
catalog and deep-linking.

## Deliberately out of scope for this MVP

Payments/billing, DRM, multi-region CDN, DASH support, ML-based
recommendations, native mobile apps, and social features (reviews/ratings).
Provider deep links go to a search results page, not a direct per-title
watch URL — none of these services offer that publicly.
