// Imported first (before any module that reads process.env at import time,
// e.g. lib/s3.ts's module-scope S3Client construction) so .env is loaded
// before anything needs it. Next.js loads .env itself for the app process;
// this standalone worker process has no such built-in mechanism.
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "..", ".env") });
