import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env.js'; 
import { logger } from '../utils/logger.js';

interface BrowserConfig {
  accountId: string;
  proxy?: typeof ENV.PROXY;
  headless?: boolean;
  disableLoginCheck?: boolean;
}

export class BrowserEngine {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserConfig;
  private userDataDir: string;

  constructor(config: BrowserConfig) {
    this.config = config;
    this.userDataDir = path.resolve(process.cwd(), 'sessions', config.accountId);
  }

  async launch(): Promise<Page> {
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }

    let finalHeadless = this.config.headless ?? ENV.HEADLESS;
    const hasSession = fs.readdirSync(this.userDataDir).length > 0;

    if (!hasSession && !this.config.disableLoginCheck) {
      finalHeadless = false;
    }

    const proxySettings = this.config.proxy ? {
      server: this.config.proxy.server,
      ...(this.config.proxy.username ? { username: this.config.proxy.username } : {}),
      ...(this.config.proxy.password ? { password: this.config.proxy.password } : {})
    } : undefined;

    const launchOptions = {
      headless: finalHeadless,
      viewport: null, 
      args: ['--disable-blink-features=AutomationControlled', '--start-maximized', '--no-sandbox'],
      ...(proxySettings ? { proxy: proxySettings } : {})
    };

    this.context = await chromium.launchPersistentContext(this.userDataDir, launchOptions);
    this.page = this.context.pages()[0] || await this.context.newPage();

    return this.page;
  }

  async close(): Promise<void> {
    if (this.context) await this.context.close();
  }
}