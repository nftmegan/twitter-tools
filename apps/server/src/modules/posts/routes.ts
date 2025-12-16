// apps/server/src/modules/posts/routes.ts
import { FastifyInstance } from 'fastify';
import prisma from '../../database/client.js';

export function registerPostRoutes(fastify: FastifyInstance) {
  
  // Get posts by author
  fastify.get('/api/posts/:username', async (req) => {
    const { username } = req.params as { username: string };
    
    const posts = await prisma.post.findMany({
      where: { author: username },
      orderBy: { createdAt: 'desc' },
      include: {
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 1 // Get only latest stats
        }
      }
    });

    return { success: true, count: posts.length, data: posts };
  });

  // Get trending posts (hotness > 50)
  fastify.get('/api/posts/trending', async () => {
    const trending = await prisma.snapshot.findMany({
      where: { hotness: { gte: 50 } },
      orderBy: { hotness: 'desc' },
      take: 20,
      include: { post: true }
    });
    
    return { success: true, data: trending };
  });
}