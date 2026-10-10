// Запись демо-ролика для BotFather: геймплей → босфайт → выбор дара.
// Запуск: node record_demo.mjs   (нужен dev-сервер на :3000 — npm run dev)
// Результат: demo_raw.webm → ffmpeg → demo.mp4 (640×360, lanczos+unsharp)
import puppeteer from 'puppeteer';
import fs from 'fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:3000/';
const OUT = 'demo_raw.webm';
const FRAMES_DIR = 'demo_frames';

// Богатый сейв: кристалл сразу высокого ранга нельзя — RANK_CHOICES покажет модалку.
// tier 0 + мощный клик = босс доступен и умирает за пару секунд тапов.
const SAVE = {
  coins: 1e9, crystalTier: 0, clickPower: 50000, clickLevel: 30,
  pickaxeLevel: 10, tutorialDone: true, sessionsPlayed: 10,
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
// Портрет 720×1280 — мини-аппы вертикальные, так UI читаемо без даунскейла
await page.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1 });

await page.evaluateOnNewDocument(s => {
  localStorage.clear();
  localStorage.setItem('idle_game_save_v3', JSON.stringify({ ...s, lastSaveTime: Date.now() }));
}, SAVE);

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await sleep(4500);

const canvas = await page.$('canvas');
if (!canvas) { console.log('NO CANVAS'); await browser.close(); process.exit(1); }
const box = await canvas.boundingBox();

const click = async (gx, gy, n = 1, gap = 70) => {
  const x = box.x + gx * box.width / 720, y = box.y + gy * box.height / 1280;
  for (let i = 0; i < n; i++) { await page.mouse.click(x, y); if (i < n - 1) await sleep(gap); }
};

// --- Запись ---
// Puppeteer >= 22 умеет screencast → webm. Старые версии — запасной путь через кадры PNG.
let rec = null, capturing = false, frameIdx = 0;
const t0 = Date.now();
if (typeof page.screencast === 'function') {
  rec = await page.screencast({ path: OUT });
  console.log('record: screencast →', OUT);
} else {
  capturing = true;
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  console.log('record: PNG frames →', FRAMES_DIR);
  (async () => {
    while (capturing) {
      await page.screenshot({ path: `${FRAMES_DIR}/f${String(frameIdx++).padStart(4, '0')}.png` }).catch(() => {});
    }
  })();
}

// --- Сценарий (~25 с) ---
await click(360, 718); await sleep(700);          // ежедневная награда «Забрать!»
await click(360, 470, 14, 90);                    // тапы по кристаллу
await click(645, 915, 2, 200);                    // купить шахтёра
await click(645, 997, 2, 200);                    // купить бур
await click(360, 800); await sleep(700);          // вкладка «Прокачка»
await click(645, 945, 2, 200);                    // апнуть кирку
await click(600, 800); await sleep(900);          // вкладка «Эволюция»
await click(360, 990); await sleep(1800);         // кнопка босфайта
await click(360, 600, 60, 60);                    // бой: тапы по боссу
await click(360, 600, 60, 60);
await sleep(1500);
await click(360, 990); await sleep(900);          // «Выбрать дар»
await click(360, 590); await sleep(1500);         // выбор дара
await click(360, 470, 8, 100);                    // финал: ещё тапы

if (rec) {
  await rec.stop();
} else {
  capturing = false;
  await sleep(300);
  const secs = (Date.now() - t0) / 1000;
  console.log(`frames=${frameIdx} in ${secs.toFixed(1)}s → fps=${(frameIdx / secs).toFixed(1)}`);
}
await browser.close();
console.log('DONE');
