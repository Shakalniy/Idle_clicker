import type { IPlatform } from './IPlatform';
import { YandexPlatform } from './yandex';
import { VkPlatform } from './vk';
import { TmaPlatform } from './tma';
import { WebPlatform } from './web';

// Адаптер выбирается по режиму сборки Vite (--mode):
//   vite build --mode yandex → YandexPlatform
//   vite build --mode vk     → VkPlatform
//   vite build --mode tma    → TmaPlatform (Telegram Mini Apps)
//   vite build --mode web    → WebPlatform
// Режимы development/production (просто `vite` / `vite build`) → yandex,
// чтобы текущий флоу не ломался. Для новых платформ добавьте кейс сюда,
// режим в package.json и скрипт SDK в PLATFORM_SCRIPTS (vite.config.ts).
let platform: IPlatform | null = null;

export function getPlatform(): IPlatform {
  if (!platform) {
    switch (import.meta.env.MODE) {
      case 'vk':
        platform = VkPlatform.getInstance();
        break;
      case 'tma':
        platform = TmaPlatform.getInstance();
        break;
      case 'web':
        platform = WebPlatform.getInstance();
        break;
      default:
        platform = YandexPlatform.getInstance();
    }
  }
  return platform;
}
