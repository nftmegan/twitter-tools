import 'dotenv/config';

const isTrue = (val?: string) => val?.toLowerCase() === 'true';
const parseIntSafe = (val?: string, fallback = 1) => {
  const n = parseInt(val || '', 10);
  return isNaN(n) ? fallback : n;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Database & Redis
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseIntSafe(process.env.REDIS_PORT, 6379),

  // Bot Behavior
  HEADLESS: isTrue(process.env.HEADLESS_MODE), 
  CONCURRENCY: parseIntSafe(process.env.CONCURRENCY, 1),
  SCROLL_LIMIT: 10,
  BURNER_ACCOUNT: 'burner_01',

  // Proxy Construction
  PROXY: process.env.PROXY_SERVER ? {
    server: process.env.PROXY_SERVER,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
  } : undefined,
} as const;

if (!ENV.DATABASE_URL) {
  // throw new Error("❌ FATAL: DATABASE_URL is missing in .env"); 
  // Commented out to allow running without DB for testing images only
}