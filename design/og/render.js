// Rend la carte Open Graph (1200 × 630) en PNG avec Playwright.
// Usage : node design/og/render.js design/og/og.html og.png
// puis conversion en JPEG (q90) vers src/assets/og-image.jpg.
const path = require('node:path');
const { chromium } = require('playwright');

const [html, out] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
})();
