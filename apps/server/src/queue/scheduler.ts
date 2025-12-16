// apps/server/src/queue/scheduler.ts
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const scraperQueue = new Queue('scraper-queue', { connection: redisConnection });

export async function startBot() {
  logger.info('🤖 Bot Start Sequence Initiated...');

  // 1. Clean old jobs to prevent duplicates
  await scraperQueue.drain();

  // 2. Define the job data
  const jobData = {
    targetAccount: 'elonmusk', // Make this dynamic if needed
    burnerAccount: 'default_burner'
  };

  // 3. Add a REPEATABLE job (Runs every 15 minutes)
  // This is the architecture fix: The Queue manages the schedule, not the worker.
  await scraperQueue.add('scrape-job', jobData, {
    repeat: {
      every: 15 * 60 * 1000, // 15 minutes
      limit: 1000 // Optional safety limit
    },
    jobId: 'main-scraper-loop' // Singleton ID to prevent duplicates
  });

  // 4. Trigger one immediately so we don't wait 15 mins for the first run
  await scraperQueue.add('scrape-job', jobData, {
    jobId: `immediate-${Date.now()}`
  });

  logger.info('✅ Bot Scheduled: Runs every 15 minutes.');
}

export async function stopBot() {
  logger.info('🛑 Stopping Bot...');
  
  // Remove the repeatable job configuration
  const repeatableJobs = await scraperQueue.getRepeatableJobs();
  
  for (const job of repeatableJobs) {
    await scraperQueue.removeRepeatableByKey(job.key);
  }
  
  // Clear waiting queue
  await scraperQueue.drain();
  
  logger.info('✅ Bot Stopped. No further jobs will run.');
}

export async function getStatus() {
  const counts = await scraperQueue.getJobCounts();
  return { 
    status: 'active', 
    queue: counts 
  };
}