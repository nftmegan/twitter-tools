// apps/server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './utils/logger.js';

// Feature Modules
import { imageWatcherService } from './modules/images/watcher.js';
import { registerImageRoutes } from './modules/images/routes.js';
import { registerPostRoutes } from './modules/posts/routes.js'; // New modular route
import { startBot, stopBot, getStatus } from './queue/scheduler.js';

// Initialize Workers
import './workers/scraper.worker.js'; 

async function main() {
  logger.info('🚀 Super-App System Initializing...');

  const fastify = Fastify({ logger: false });
  await fastify.register(cors, { origin: true });

  // 1️⃣ MODULE: Image Watcher
  logger.info('📸 Starting Image Surveillance...');
  imageWatcherService.start();
  registerImageRoutes(fastify);

  // 2️⃣ MODULE: Posts / Data (New)
  registerPostRoutes(fastify);

  // 3️⃣ MODULE: Scraper Control
  fastify.post('/api/control/start', async () => {
    await startBot();
    return { status: 'started' };
  });

  fastify.post('/api/control/stop', async () => {
    await stopBot();
    return { status: 'stopped' };
  });

  fastify.get('/api/control/status', async () => {
    return getStatus();
  });

  // 4️⃣ Start Server
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    logger.info(`✨ Super-Server Online at http://0.0.0.0:${port}`);
  } catch (err) {
    logger.fatal(err);
    process.exit(1);
  }
}

main();