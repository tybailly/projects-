import { Queue } from "bullmq";
import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as { redisConnection?: IORedis };

export const redisConnection =
  globalForRedis.redisConnection ??
  new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisConnection = redisConnection;
}

export const TRANSCODE_QUEUE_NAME = "transcode";

export interface TranscodeJobData {
  titleId: string;
  sourceKey: string;
}

export const transcodeQueue = new Queue<TranscodeJobData>(TRANSCODE_QUEUE_NAME, {
  connection: redisConnection
});
