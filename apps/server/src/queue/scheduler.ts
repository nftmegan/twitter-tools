import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export const scraperQueue = new Queue('scraper-queue', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true, 
    removeOnFail: 100,
  }
});

let isRunning = false;

export async function startBot() {
  if (isRunning) return;
  isRunning = true;
  logger.info('🟢 STARTING SURVEILLANCE...');

  if (ENV.PROXY) {
    logger.info(`🛡️ Global Proxy Enabled: ${ENV.PROXY.server}`);
  } else {
    logger.warn('⚠️ Running in RAW mode (No Proxy).');
  }

  // Define Targets (You can expand this later)
  const targets = [
    { target: 'elonmusk', burner: ENV.BURNER_ACCOUNT }
  ];

  for (const t of targets) {
    const jobs = await scraperQueue.getRepeatableJobs();
    for (const j of jobs) await scraperQueue.removeRepeatableByKey(j.key);

    await scraperQueue.add(
      'scrape-job', 
      { 
        targetAccount: t.target,
        burnerAccount: t.burner,
        proxy: ENV.PROXY 
      },
      { jobId: `run-${t.target}-${Date.now()}` }
    );
    logger.info(`🚀 Queued target: @${t.target}`);
  }
}

export async function stopBot() {
  isRunning = false;
  logger.info('🔴 STOPPING SURVEILLANCE...');
  await scraperQueue.drain();
}

export function getStatus() {
  return { running: isRunning };
}