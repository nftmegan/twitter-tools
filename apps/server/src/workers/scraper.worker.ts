// apps/server/src/workers/scraper.worker.ts
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { Scraper } from '../core/scraper.js';
import { logger } from '../utils/logger.js';

// We no longer import the queue here to schedule next jobs!

interface ScrapeJobData {
  targetAccount: string;
  burnerAccount: string;
  proxy?: any;
}

export const scraperWorker = new Worker<ScrapeJobData>(
  'scraper-queue',
  async (job: Job) => {
    logger.info({ jobId: job.id, target: job.data.targetAccount }, '🚀 Processing Job');

    try {
      const bot = new Scraper({
        targetAccount: job.data.targetAccount,
        burnerAccount: job.data.burnerAccount,
        proxy: job.data.proxy
      });

      await bot.run();
      
      logger.info({ jobId: job.id }, '✅ Job Finished Successfully');
      return { success: true };

    } catch (error: any) {
      logger.error({ jobId: job.id, err: error.message }, '❌ Job Failed');
      // BullMQ will handle retries if configured
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Keep at 1 to look human
    limiter: { max: 1, duration: 1000 }
  }
);