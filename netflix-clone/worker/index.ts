import "./env";
import { Worker } from "bullmq";
import { redisConnection, TRANSCODE_QUEUE_NAME, type TranscodeJobData } from "../src/lib/queue";
import { processTranscodeJob } from "./transcode";

console.log("Transcode worker starting, waiting for jobs...");

const worker = new Worker<TranscodeJobData>(
  TRANSCODE_QUEUE_NAME,
  async (job) => {
    console.log(`[transcode] starting job ${job.id} for title ${job.data.titleId}`);
    await processTranscodeJob(job.data, (pct) => job.updateProgress(pct));
    console.log(`[transcode] finished job ${job.id} for title ${job.data.titleId}`);
  },
  { connection: redisConnection, concurrency: 1 }
);

worker.on("failed", (job, err) => {
  console.error(`[transcode] job ${job?.id} failed:`, err.message);
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
