import puppeteer from 'puppeteer';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SAVE = { coins: 5e14, crystalTier: 29, clickPower: 20000, clickLevel: 60, pickaxeLevel: 15, tutorialDone: true, sessionsPlayed: 20, essence: 40 };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 480, height: 854 });
await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('idle_game_save_v3', JSON.stringify({ ...s, lastSaveTime: Date.now() })); }, SAVE);
await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 3500));
const canvas = await page.$('canvas');
const box = await canvas.boundingBox();
const click = async (gx, gy, n = 1, gap = 70) => {
  const x = box.x + gx * box.width / 720, y = box.y + gy * box.height / 1280;
  for (let i = 0; i < n; i++) { await page.mouse.click(x, y); if (i < n - 1) await new Promise(r => setTimeout(r, gap)); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const findText = p => page.evaluate(p => {
  const o = window.game.scene.getScene('GameScene').children.list
    .find(o => o.type === 'Text' && typeof o.text === 'string' && o.text.includes(p));
  return o ? { x: o.getBounds().centerX, y: o.getBounds().centerY, txt: o.text } : null;
}, p);

await click(360, 718); await sleep(400);
await click(600, 800); await sleep(600);
await click(360, 990); await sleep(1500);
// быстрый бой
for (let i = 0; i < 12; i++) {
  if (await findText('Выбрать дар')) break;
  await click(360, 600, 30, 60);
}
console.log('CTA:', await findText('Выбрать дар'));
await sleep(800);
const cta = await findText('Выбрать дар');
if (cta) await click(cta.x, cta.y);
await sleep(800);
const dar = await findText('Дар Мощи');
console.log('DAR:', JSON.stringify(dar));
if (dar) { await click(dar.x, dar.y); await sleep(1200); }
console.log('after:', await page.evaluate(() => window.game.scene.getScene('GameScene').children.list.filter(o => o.type === 'Text' && o.text.includes('Дар')).map(o => o.text)));
await page.screenshot({ path: 'store_video/dbg_gift.png' });
await browser.close();
console.log('DONE');
