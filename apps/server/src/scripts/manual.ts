// apps/server/src/manual.ts
import puppeteer from 'puppeteer';
import fs from 'fs';

const COOKIES_PATH = './cookies.json';

async function manualLogin() {
  console.log('🚀 Launching browser...');
  
  // Launch browser in visible mode
  const browser = await puppeteer.launch({
    headless: false, // This makes the browser visible
    defaultViewport: null,
    args: ['--start-maximized'] // Opens full screen
  });

  const page = await browser.newPage();
  
  console.log('🔗 Going to X.com login page...');
  await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2' });

  console.log('⚠️  PLEASE LOG IN MANUALLY IN THE BROWSER WINDOW ⚠️');
  console.log('⏳ Waiting for you to reach the home page (detecting "Home" in title or URL)...');

  // Wait until we are redirected to the home page (indicates success)
  await page.waitForFunction(() => window.location.href.includes('/home'), { timeout: 0 });

  console.log('✅ Login detected! Saving cookies...');

  // Get cookies
  const cookies = await page.cookies();
  
  // Save cookies to a file
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log(`💾 Cookies saved to ${COOKIES_PATH}`);

  await browser.close();
  console.log('🎉 Done! You can now run your main server.');
}

manualLogin();