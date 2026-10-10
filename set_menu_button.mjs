// Настройка Menu Button бота: кнопка «🎮 Играть» рядом с полем ввода в чате.
// Запуск: npm run tg:menubutton
// Требует в .env.tma:
//   TG_BOT_TOKEN=...  — токен от @BotFather
//   TG_HOST_URL=...   — HTTPS-адрес хостинга (например https://user.github.io/repo/)
import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('.env.tma', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
}

const token = env.TG_BOT_TOKEN;
const url = env.TG_HOST_URL;

if (!token || !url) {
  console.error('Заполните TG_BOT_TOKEN и TG_HOST_URL в .env.tma');
  process.exit(1);
}

// setChatMenuButton без chat_id — дефолтная кнопка для всех чатов с ботом
const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: '🎮 Играть',
      web_app: { url }
    }
  })
});

const json = await res.json();
if (json.ok) {
  console.log('✅ Menu Button установлена: «🎮 Играть» →', url);
} else {
  console.error('❌ Ошибка Bot API:', json);
  process.exit(1);
}
