import { chromium } from 'playwright-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const page = await browser.newPage();
await page.emulateMedia({ media: 'print' });
const docs = ['report', 'proposal'];
for (const name of docs) {
  const url = pathToFileURL(path.resolve('..', 'docs', name + '.html')).href;
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  const out = path.resolve('..', 'docs', name === 'report' ? 'OfferCatcher_Final_Report.pdf' : 'OfferCatcher_Proposal.pdf');
  await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
  console.log('PDF', out);
}
await browser.close();