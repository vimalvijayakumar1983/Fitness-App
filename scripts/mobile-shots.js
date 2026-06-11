/* Renders the web app in an iPhone-sized headless Chrome and screenshots the
   key screens with realistic seeded data. Uses the cached Chrome for Testing. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = fs.readFileSync('/tmp/chromepath', 'utf8').trim();
const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.join(__dirname, '..', 'screenshots');
const PORT = 4124;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.map':'application/json','.ico':'image/x-icon','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2' };

function serve() {
  return http.createServer((req, res) => {
    let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(PORT);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function click(page, text, partial = false) {
  const h = await page.evaluateHandle((t, p) => {
    const els = [...document.querySelectorAll('div,span,[role="button"],[tabindex]')];
    return els.reverse().find((e) => { const x = e.textContent.trim(); return (p ? x.includes(t) : x === t) && e.offsetParent !== null; });
  }, text, partial);
  const el = h.asElement(); if (el) { await el.click(); return true; } return false;
}

const today = new Date(); const iso = (d) => d.toISOString();
const dstr = (off=0) => { const d = new Date(today); d.setDate(d.getDate()-off); return d.toISOString().slice(0,10); };
const at = (off, h, m=0) => { const d = new Date(today); d.setDate(d.getDate()-off); d.setHours(h,m,0,0); return d.toISOString(); };

const seed = JSON.stringify({
  profile: { name: 'You', goal: 'lose', diet: 'balanced', calorieTarget: 2000,
    macroTargets: { protein: 150, carbs: 200, fat: 60 }, waterGoalMl: 2500, units: 'metric',
    weightKg: 78, heightCm: 176, age: 34, sex: 'male', activityLevel: 1.45, onboarded: true },
  meals: [
    { id:'m1', date: dstr(0), loggedAt: at(0,8,10), type:'breakfast', items:[{name:'Greek yogurt & berries', calories:320, protein:24, carbs:34, fat:8}] },
    { id:'m2', date: dstr(0), loggedAt: at(0,13,0), type:'lunch', items:[{name:'Grilled chicken & rice', calories:540, protein:46, carbs:55, fat:12}] },
  ],
  exercises: [
    { id:'e1', date: dstr(0), loggedAt: at(0,7,30), activity:'Morning walk', durationMinutes:38, caloriesBurned:210, steps:8240, avgHeartRate:104, source:'apple_health' },
    { id:'e2', date: dstr(1), loggedAt: at(1,18,0), activity:'Strength training', durationMinutes:45, caloriesBurned:300, steps:3100, source:'manual' },
    { id:'e3', date: dstr(2), loggedAt: at(2,7,0), activity:'Run', durationMinutes:30, caloriesBurned:330, steps:6200, source:'manual' },
  ],
  moods: [{ id:'mo1', date: dstr(0), loggedAt: at(0,9,0), mood:4, stress:2, energy:4 }],
  sleep: [{ id:'s1', date: dstr(0), loggedAt: at(0,7,0), bedtime: at(1,23,10), wakeTime: at(0,6,40), durationMinutes:450, quality:4, source:'apple_health' }],
  water: [{ id:'w1', date: dstr(0), loggedAt: at(0,10), ml:250 },{ id:'w2', date: dstr(0), loggedAt: at(0,12), ml:500 },{ id:'w3', date: dstr(0), loggedAt: at(0,15), ml:500 }],
  weights: [
    { id:'wt1', date: dstr(0), loggedAt: at(0,6,30), weightKg:78 },
    { id:'wt2', date: dstr(7), loggedAt: at(7,6,30), weightKg:79.1 },
    { id:'wt3', date: dstr(21), loggedAt: at(21,6,30), weightKg:80.4 },
  ],
  glucose: [
    { id:'g1', date: dstr(0), loggedAt: at(0,7,0), mgDl:96, tag:'fasting', source:'cgm' },
    { id:'g2', date: dstr(0), loggedAt: at(0,13,30), mgDl:138, tag:'post_meal', source:'cgm' },
    { id:'g3', date: dstr(1), loggedAt: at(1,7,0), mgDl:99, tag:'fasting', source:'manual' },
    { id:'g4', date: dstr(2), loggedAt: at(2,7,0), mgDl:101, tag:'fasting', source:'manual' },
  ],
  assessment: { completedAt: iso(today), smokes:false, familyDiabetes:true, familyHeart:false, waistCm:92,
    activityDaysPerWeek:4, sleepQuality:4, stressLevel:2, dietQuality:4, alcoholPerWeek:2 },
  family: [{ id:'f1', name:'Layla', relation:'spouse', sex:'female', age:32, heightCm:165, weightKg:62, smokes:false, activityDaysPerWeek:3, conditions:['PCOS'] }],
  labs: [], favoriteFoodIds: [], customFoods: [], customExercises: [], plan: null,
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((s) => localStorage.setItem('fitnessapp:data:v1', s), seed);
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
  await sleep(3000);
  const shot = async (n) => { await sleep(800); await page.screenshot({ path: path.join(OUT, n) }); console.log('shot', n); };

  await shot('m1-today.png');
  // scroll mid + bottom of dashboard
  await page.evaluate(() => window.scrollTo(0, 700)); await shot('m2-today-mid.png');
  await page.evaluate(() => window.scrollTo(0, 1500)); await shot('m3-today-cards.png');
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(400);

  // Longevity modal
  if (await click(page, 'BIOLOGICAL AGE', true)) { await sleep(1200); await shot('m4-longevity.png'); await click(page,'✕'); await sleep(500); }
  // Glucose modal
  if (await click(page, 'mg/dL', true)) { await sleep(900); await click(page,'Connect',true); await sleep(700); await shot('m5-glucose.png'); await click(page,'✕'); await sleep(500); }
  // Week in review
  if (await click(page, 'Your week in review')) { await sleep(900); await shot('m6-week-review.png'); await click(page,'✕'); await sleep(500); }

  // Meals tab
  await click(page, 'Meals'); await sleep(900); await shot('m7-meals.png');
  // Exercise tab
  await click(page, 'Exercise'); await sleep(900); await shot('m8-exercise.png');
  // Care tab
  await click(page, 'Care'); await sleep(1200); await shot('m9-care.png');

  await browser.close(); server.close(); console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
