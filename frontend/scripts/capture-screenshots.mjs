import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', '..', 'docs', 'assets', 'screens');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'zh-CN' });
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
const shot = async (name, fullPage = false) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage });
  console.log('SHOT', name, 'URL', page.url());
};
await page.goto('http://127.0.0.1:5173/#/welcome', { waitUntil: 'networkidle' });
await shot('01-welcome');
await page.getByText('先用示例看看').click();
await page.waitForTimeout(1200);
await shot('02-home', true);
await page.goto('http://127.0.0.1:5173/#/resume');
await shot('03-resume', true);
await page.goto('http://127.0.0.1:5173/#/analyze');
await shot('04-analyze', true);
await page.goto('http://127.0.0.1:5173/#/jobs');
await shot('05-jobs', true);
await page.goto('http://127.0.0.1:5173/#/jobs/job-001');
await shot('06-job-detail', true);
await page.goto('http://127.0.0.1:5173/#/tracker');
await shot('07-tracker', true);
await page.goto('http://127.0.0.1:5173/#/assistant');
await page.waitForTimeout(800);
const chip = page.getByText('帮我找几个前端实习').first();
if (await chip.count()) { await chip.click(); await page.waitForTimeout(2500); }
await shot('08-assistant', true);
await page.goto('http://127.0.0.1:5173/#/settings');
await shot('09-settings', true);
await page.goto('http://127.0.0.1:5173/#/');
await page.waitForTimeout(600);
const recent = page.locator('.recent-row').first();
if (await recent.count()) { await recent.click(); await page.waitForTimeout(1200); await shot('10-result-local', true); await page.waitForTimeout(22000); await shot('11-result-ai', true); }
else { console.log('NO_RECENT'); }
console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();