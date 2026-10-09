// E2E-прогон кликера в headless Chrome: сейв с монетами, клики, вкладки, босфайт.
// Запуск: node test_e2e.mjs
import puppeteer from 'puppeteer';
import fs from 'fs';

const SHOTS = 'test_shots';
fs.mkdirSync(SHOTS, { recursive: true });

const errors = [];
const warns = [];

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 480, height: 900, deviceScaleFactor: 1 });

page.on('console', m => {
  const t = m.type();
  if (t === 'error') errors.push(m.text());
  else if (t === 'warning') warns.push(m.text());
});
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', r => {
  // игнорируем внешние SDK/рекламу — локально их нет
  if (!r.url().includes('yandex')) errors.push('REQFAIL: ' + r.url());
});

// Подсаживаем богатый сейв ДО загрузки страницы
await page.evaluateOnNewDocument(() => {
  localStorage.clear();
  localStorage.setItem('idle_game_save_v3', JSON.stringify({
    coins: 1e9,
    crystalTier: 0,
    clickPower: 50000,
    clickLevel: 30,
    pickaxeLevel: 10,
    tutorialDone: true,
    sessionsPlayed: 10,
    lastSaveTime: Date.now(),
  }));
});

await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 4500));

const canvas = await page.$('canvas');
if (!canvas) { console.log('NO CANVAS!'); console.log(errors); await browser.close(); process.exit(1); }
const box = await canvas.boundingBox();
console.log('canvas box:', JSON.stringify(box));

// логические координаты 720x1280 -> пиксели вьюпорта
const P = (gx, gy) => ({ x: box.x + gx * box.width / 720, y: box.y + gy * box.height / 1280 });
const click = async (gx, gy, n = 1, gap = 60) => {
  const p = P(gx, gy);
  for (let i = 0; i < n; i++) { await page.mouse.click(p.x, p.y); if (i < n - 1) await new Promise(r => setTimeout(r, gap)); }
};
const shot = name => page.screenshot({ path: `${SHOTS}/${name}.png` });

// --- 1. Старт: забираем ежедневную награду (модалка перекрывает игру) ---
await shot('01_loaded');
await click(360, 718);           // «Забрать!»
await new Promise(r => setTimeout(r, 600));
await click(360, 470, 15, 80);   // тапы по кристаллу
await shot('02_after_taps');

// --- 2. Покупка зданий (кнопки справа в строках) ---
await click(645, 915, 3, 150);   // Шахтёр
await click(645, 997, 2, 150);   // Бур-машина
await shot('03_buildings');

// --- 3. Вкладка Прокачка ---
await click(360, 800);           // вторая вкладка
await new Promise(r => setTimeout(r, 600));
await shot('04_tab_upgrades');
await click(645, 945, 2, 150);   // Удар кирки
await shot('05_pickaxe_bought');

// --- 4. Вкладка Эволюция -> кнопка босса ---
await click(600, 800);           // третья вкладка
await new Promise(r => setTimeout(r, 600));
await shot('06_tab_evolution');
await click(360, 990);           // ⚔️ Бой за...
await new Promise(r => setTimeout(r, 1500));
await shot('07_boss_fight_start');

// --- 5. Босфайт: тапаем босса быстро ---
for (let i = 0; i < 4; i++) {
  await click(360, 600, 25, 45);
  await new Promise(r => setTimeout(r, 300));
}
await shot('08_boss_mid');
// ещё волна тапов на случай щита/трещин
for (let i = 0; i < 4; i++) {
  await click(360, 600, 25, 45);
  await new Promise(r => setTimeout(r, 300));
}
await shot('09_boss_end');

// --- 6. Экран победы -> модалка даров ---
await new Promise(r => setTimeout(r, 1500));
await shot('10_victory_panel');
await click(360, 990);           // ✨ Выбрать дар
await new Promise(r => setTimeout(r, 800));
await shot('11_gift_modal');
await click(360, 590);           // «Дар Процветания» (вторая кнопка)
await new Promise(r => setTimeout(r, 1000));
await shot('12_after_prestige');

// --- 7. Меню ☰ ---
await click(672, 44);
await new Promise(r => setTimeout(r, 600));
await shot('13_menu');
await click(360, 1200);          // тап мимо панели → закрыть оверлей
await new Promise(r => setTimeout(r, 400));
await shot('14_after_menu');

console.log('\n===== ERRORS =====');
console.log(errors.length ? errors.join('\n') : 'нет ошибок');
console.log('\n===== WARNINGS =====');
console.log(warns.slice(0, 15).join('\n') || 'нет');

await browser.close();
process.exit(0);
