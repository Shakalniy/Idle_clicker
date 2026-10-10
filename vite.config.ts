import { defineConfig, type Plugin } from 'vite';

// SDK-скрипты подключаются в index.html на этапе сборки — у каждой платформы свой.
// Ключ = режим сборки (vite build --mode <ключ>). Неизвестные режимы
// (development/production — просто `vite` / `vite build`) собираются под yandex.
const PLATFORM_SCRIPTS: Record<string, string[]> = {
  yandex: ['https://yandex.ru/games/sdk/v2'],
  vk: [], // vk-bridge подключается из npm-бандла, внешний скрипт не нужен
  tma: [
    'https://telegram.org/js/telegram-web-app.js',
    'https://sad.adsgram.ai/js/master.js', // реклама Adsgram; активируется через VITE_ADSGRAM_BLOCK_ID
    'https://s3.eu-central-1.amazonaws.com/cdn.telemetree.io/telemetree-pixel.js', // Telemetree; VITE_TELEMETREE_*
    'https://mc.yandex.ru/metrika/tag.js' // Яндекс.Метрика; активируется через VITE_YM_COUNTER_ID
  ],
  web: []
};

function platformScripts(platform: string): Plugin {
  return {
    name: 'platform-scripts',
    transformIndexHtml(html) {
      const tags = PLATFORM_SCRIPTS[platform]
        .map(src => `    <script src="${src}"></script>`)
        .join('\n');
      return html.replace('<!-- platform-sdk -->', tags);
    }
  };
}

export default defineConfig(({ mode }) => {
  const platform = mode in PLATFORM_SCRIPTS ? mode : 'yandex';
  return {
    base: './',
    plugins: [platformScripts(platform)],
    server: {
      host: true, // Слушать все адреса (0.0.0.0), решает проблему с IPv6 и Opera
      port: 3000,
      open: true
    },
    build: {
      assetsInlineLimit: 0,
      outDir: 'dist',
      sourcemap: false
    }
  };
});
