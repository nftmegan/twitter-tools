// apps/server/src/core/scraper.ts
import { Page } from 'playwright';
import { BrowserEngine } from './browser.js';
import { logger } from '../utils/logger.js';
import prisma from '../database/client.js';

// ✅ EXTRACTED CONSTANTS (Easy to fix if X changes layout)
const SELECTORS = {
  tweet: 'article[data-testid="tweet"]',
  text: 'div[data-testid="tweetText"]',
  timestamp: 'time',
  metricsGroup: 'div[role="group"] div[aria-label]',
  link: 'a[href*="/status/"]',
};

interface ScraperConfig {
  targetAccount: string;
  burnerAccount: string;
  proxy?: any;
}

export class Scraper {
  private engine: BrowserEngine;
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
    this.engine = new BrowserEngine({
      accountId: config.burnerAccount,
      proxy: config.proxy
    });
  }

  async run() {
    logger.info(`🕵️ Starting surveillance on @${this.config.targetAccount}`);
    const page = await this.engine.launch();

    try {
      await this.verifyLogin(page);
      await this.scrapeTarget(page);
    } catch (error: any) {
      logger.error({ err: error.message }, "❌ Scrape Cycle Failed");
      throw error;
    } finally {
      await this.engine.close();
    }
  }

  // ✅ Verification Phase
  private async verifyLogin(page: Page) {
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('login')) {
      const isHeadless = process.env.HEADLESS_MODE === 'true';
      if (!isHeadless) {
        logger.warn('🛑 PLEASE LOG IN MANUALLY. Waiting for /home...');
        await page.waitForURL('**/home', { timeout: 0 });
      } else {
        throw new Error("❌ Session Expired in Headless Mode.");
      }
    }
  }

  // ✅ Execution Phase
  private async scrapeTarget(page: Page) {
    await page.goto(`https://x.com/${this.config.targetAccount}`);
    await page.waitForTimeout(3000);

    for (let i = 0; i < 3; i++) {
      // "Human" scroll
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(Math.random() * 2000 + 1000);
      
      await this.processVisiblePosts(page);
    }
  }

  private async processVisiblePosts(page: Page) {
    // Extract raw data from browser context
    const rawPosts = await page.evaluate((sel) => {
      return Array.from(document.querySelectorAll(sel.tweet)).map(article => {
        const text = article.querySelector(sel.text)?.textContent || '';
        const timestamp = article.querySelector(sel.timestamp)?.getAttribute('datetime');
        const link = article.querySelector(sel.link)?.getAttribute('href');
        const id = link ? link.split('/status/')[1] : null;

        // Metrics logic (simplified for brevity)
        const metrics = { likes: 0, reposts: 0, replies: 0, views: 0 };
        const groups = article.querySelectorAll(sel.metricsGroup);
        
        const parse = (s: string) => {
            let n = parseFloat(s.replace(/,/g, ''));
            if (s.includes('K')) n *= 1000;
            if (s.includes('M')) n *= 1e6;
            return Math.floor(n) || 0;
        };

        groups.forEach(g => {
            const label = g.getAttribute('aria-label') || '';
            const val = g.textContent || '0';
            if (label.includes('likes')) metrics.likes = parse(val);
            if (label.includes('reposts')) metrics.reposts = parse(val);
            if (label.includes('replies')) metrics.replies = parse(val);
            if (label.includes('views')) metrics.views = parse(val);
        });

        return { id, text, timestamp, metrics };
      });
    }, SELECTORS);

    // Save to DB
    for (const raw of rawPosts) {
      if (raw.id) await this.saveData(raw);
    }
  }

  private async saveData(raw: any) {
    await prisma.post.upsert({
      where: { id: raw.id },
      update: { 
        lastScraped: new Date(),
        // Update metrics on the post itself too
        likes: raw.metrics.likes,
        reposts: raw.metrics.reposts
      },
      create: {
        id: raw.id,
        author: this.config.targetAccount,
        text: raw.text,
        createdAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
        lastScraped: new Date()
      }
    });

    await prisma.snapshot.create({
      data: {
        postId: raw.id,
        likes: raw.metrics.likes,
        reposts: raw.metrics.reposts,
        replies: raw.metrics.replies,
        views: raw.metrics.views,
        hotness: this.calculateHotness(raw.metrics),
        mood: this.calculateMood(raw.text)
      }
    });
  }

  private calculateHotness(m: any) {
    return Math.min(Math.floor((m.likes + m.reposts * 2) / 10), 100);
  }

  private calculateMood(text: string) {
    return text.includes('happy') ? 'POSITIVE' : 'NEUTRAL';
  }
}