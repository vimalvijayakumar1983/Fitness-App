/* Renders the exported web app in headless Chrome and screenshots each screen. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.join(__dirname, '..', 'screenshots');
const PORT = 4123;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.map': 'application/json',
};

function serve() {
  return http
    .createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(DIST, urlPath);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(DIST, 'index.html'); // SPA fallback
      }
      const ext = path.extname(file);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(PORT);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, text) {
  const handle = await page.evaluateHandle((t) => {
    const els = [...document.querySelectorAll('div[role="button"], [tabindex], div, span')];
    return els.reverse().find((e) => e.textContent.trim() === t && e.offsetParent !== null);
  }, text);
  const el = handle.asElement();
  if (el) {
    await el.click();
    return true;
  }
  return false;
}

async function typeInto(page, placeholder, value) {
  const el = await page.$(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`);
  if (el) {
    await el.click({ clickCount: 3 });
    await el.type(value, { delay: 10 });
    return true;
  }
  return false;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
  await sleep(2500);

  const shot = async (name) => {
    await sleep(700);
    await page.screenshot({ path: path.join(OUT, name) });
    console.log('captured', name);
  };

  // 1. Dashboard (empty)
  await shot('1-dashboard-empty.png');

  // 2. Meals — log a meal
  await clickByText(page, 'Meals');
  await sleep(600);
  await typeInto(page, 'e.g. Oatmeal with banana', 'Oatmeal with banana');
  await typeInto(page, 'e.g. 320', '320');
  await clickByText(page, 'Add meal');
  await shot('2-meals-logged.png');

  // 3. Exercise — sync mock smartwatch data
  await clickByText(page, 'Exercise');
  await sleep(600);
  await clickByText(page, 'Sync now');
  await sleep(1200);
  await shot('3-exercise-synced.png');

  // 4. Mind (mood)
  await clickByText(page, 'Mind');
  await sleep(600);
  await clickByText(page, 'Save check-in');
  await shot('4-mind.png');

  // 5. Sleep
  await clickByText(page, 'Sleep');
  await sleep(600);
  await clickByText(page, 'Add sleep record');
  await shot('5-sleep.png');

  // 6. Dashboard with data
  await clickByText(page, 'Today');
  await sleep(800);
  await shot('6-dashboard-filled.png');

  await browser.close();
  server.close();
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
