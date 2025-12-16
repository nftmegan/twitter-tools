import chokidar from 'chokidar';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';

const DUMP_DIR = path.resolve(process.cwd(), 'dump_here');
const IMAGES_DIR = path.resolve(process.cwd(), 'public/images'); 
const QUEUE_FILE = path.resolve(process.cwd(), 'queue.json');

// Ensure folders
if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

let queue: string[] = [];
const QueueSchema = z.array(z.string());

try {
  if (fs.existsSync(QUEUE_FILE)) {
    queue = QueueSchema.parse(JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')));
  }
} catch (e) { queue = []; }

function saveQueue() {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

export const imageWatcherService = {
  getQueue: () => queue,
  
  rotate: () => {
    if (queue.length > 0) {
      const item = queue.shift();
      if (item) queue.push(item);
      saveQueue();
    }
    return queue[0] || null;
  },

  start: () => {
    logger.info(`📂 Watching for images in: ${DUMP_DIR}`);
    chokidar.watch(DUMP_DIR, { 
      ignoreInitial: true, 
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 }
    }).on('add', async (filePath) => {
      const filename = path.basename(filePath);
      if (filename.startsWith('.')) return;

      logger.info(`👀 Processing New Image: ${filename}`);
      try {
        const newName = `photo-${Date.now()}.jpg`;
        const outPath = path.join(IMAGES_DIR, newName);

        await sharp(filePath)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(outPath);
        
        queue.push(newName);
        saveQueue();
        fs.unlinkSync(filePath);
        logger.info(`✅ Image Processed: ${newName}`);
      } catch (err) {
        logger.error(`❌ Image Error: ${err}`);
      }
    });
  }
};