import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { imageWatcherService } from './watcher.js';

const IMAGES_DIR = path.resolve(process.cwd(), 'public/images');

export function registerImageRoutes(server: FastifyInstance) {
  
  // Serve raw images
  server.get<{ Params: { filename: string } }>('/images/:filename', (req, reply) => {
    const filepath = path.join(IMAGES_DIR, req.params.filename);
    if (fs.existsSync(filepath)) {
      return reply.type('image/jpeg').send(fs.createReadStream(filepath));
    }
    return reply.code(404).send('Not Found');
  });

  // Get Current
  server.get('/api/images/current', async () => {
    const q = imageWatcherService.getQueue();
    return { image: q[0] || null, total: q.length };
  });

  // Rotate
  server.post('/api/images/rotate', async () => {
    const top = imageWatcherService.rotate();
    return { success: true, top };
  });
}