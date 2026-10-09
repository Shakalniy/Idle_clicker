import bridge from '@vkontakte/vk-bridge';
import type { IPlatform, PlatformCapabilities } from './IPlatform';
import type { LocalText } from '../../i18n';
import {
  type GameSaveData,
  type PartialSaveData,
  type LeaderboardEntry,
  type ShopProduct,
  SAVE_KEY,
  mergeSave
} from './types';

// Адаптер под VK Игры (vk-bridge).
// Авторизация в VK неявная — пользователь уже вошёл в соцсеть,
// поэтому auth-фичи выключены: isGuest() всегда false, диалога входа нет.
// Лидерборд — нативный бокс VK (VKWebAppShowLeaderBoardBox), рекорд
// отправляется через secure.setUserLevel (лимиты настраиваются в консоли приложения).
// Платежи — голоса ВК через VKWebAppShowOrderBox (товары заводятся в настройках приложения).
// Облачные сейвы — VKWebAppStorageGet/Set (значение ключа ограничено ~4096 байт).
export class VkPlatform implements IPlatform {
  private static instance: VkPlatform;
  private isDevMode = false;
  private appId = '';
  private lang = 'ru';

  public readonly id = 'vk';
  public readonly capabilities: PlatformCapabilities = {
    rewarded: true,
    interstitial: true,
    cloudSaves: true,
    leaderboard: true,
    payments: true,
    auth: false,
    review: false,
    shortcut: true
  };
  public readonly authProviderName = null;
  public readonly shortcutLabel: LocalText = { ru: 'В избранное', en: 'Add to favourites' };

  // Ключ в хранилище VK (не путать с локальным SAVE_KEY — там имя другое)
  private static readonly VK_STORAGE_KEY = 'save';
  // VKWebAppStorageSet принимает значение до ~4096 байт
  private static readonly VK_VALUE_LIMIT = 4000;

  private constructor() {}

  public static getInstance(): VkPlatform {
    if (!VkPlatform.instance) {
      VkPlatform.instance = new VkPlatform();
    }
    return VkPlatform.instance;
  }

  public async init(): Promise<void> {
    try {
      await bridge.send('VKWebAppInit');
      try {
        const params: any = await bridge.send('VKWebAppGetLaunchParams');
        this.appId = params?.vk_app_id ? String(params.vk_app_id) : (import.meta.env.VITE_VK_APP_ID || '');
        if (typeof params?.vk_language === 'string') this.lang = params.vk_language;
      } catch (e) {
        console.warn('[VK] Параметры запуска недоступны:', e);
      }
    } catch (e) {
      // Не в окружении VK (localhost, обычный браузер) — эмуляция как у dev-режима
      console.warn('[VK] VKWebAppInit не удался, режим эмуляции:', e);
      this.isDevMode = true;
    }
  }

  public getLang(): string {
    if (this.isDevMode) return localStorage.getItem('dev_lang') || 'ru';
    return this.lang || 'ru';
  }

  // --- Реклама ---
  // Реклама в VK идёт через VKWebAppShowNativeAds; перед показом проверяем
  // доступность блока через VKWebAppCheckNativeAds.

  public showFullscreenAdv(onOpen?: () => void, onClose?: (wasShown: boolean) => void): void {
    if (this.isDevMode) {
      onOpen?.();
      setTimeout(() => onClose?.(true), 400);
      return;
    }
    onOpen?.();
    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' })
      .then((r: any) => r?.result
        ? bridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
        : Promise.reject(new Error('interstitial unavailable')))
      .then(() => onClose?.(true))
      .catch(() => onClose?.(false));
  }

  public showRewarded(onReward: () => void, onPause: () => void, onResume: () => void): void {
    if (this.isDevMode) {
      onPause();
      setTimeout(() => {
        onReward();
        onResume();
      }, 800);
      return;
    }
    onPause();
    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
      .then((r: any) => r?.result
        ? bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
        : Promise.reject(new Error('reward ad unavailable')))
      .then(() => { onReward(); onResume(); })
      .catch(() => onResume()); // нет ролика — нет награды
  }

  // --- Сейвы ---
  public async loadData(): Promise<GameSaveData> {
    if (!this.isDevMode) {
      try {
        const res: any = await bridge.send('VKWebAppStorageGet', { keys: [VkPlatform.VK_STORAGE_KEY] });
        const raw = res?.keys?.find((k: any) => k.key === VkPlatform.VK_STORAGE_KEY)?.value;
        if (raw) {
          try { return mergeSave(JSON.parse(raw)); } catch { /* битый сейв в облаке — идём в локальный */ }
        }
      } catch (e) {
        console.warn('[VK] Ошибка чтения облачного сейва:', e);
      }
    }

    const local = localStorage.getItem(SAVE_KEY);
    if (local) {
      try {
        return mergeSave(JSON.parse(local));
      } catch {
        return mergeSave({});
      }
    }
    return mergeSave({});
  }

  public saveData(data: PartialSaveData): void {
    let current: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) current = JSON.parse(raw);
    } catch { /* битый сейв — пишем поверх */ }
    const merged = { ...current, ...data, lastSaveTime: Date.now() };
    const json = JSON.stringify(merged);
    localStorage.setItem(SAVE_KEY, json);

    if (!this.isDevMode) {
      if (json.length > VkPlatform.VK_VALUE_LIMIT) {
        console.warn(`[VK] Сейв ${json.length} символов — больше лимита хранилища VK, облако пропущено`);
        return;
      }
      bridge.send('VKWebAppStorageSet', { key: VkPlatform.VK_STORAGE_KEY, value: json })
        .catch((e: any) => console.warn('[VK] Ошибка записи в облако:', e));
    }
  }

  public async resetData(): Promise<void> {
    localStorage.removeItem(SAVE_KEY);
    if (!this.isDevMode) {
      try {
        await bridge.send('VKWebAppStorageSet', { key: VkPlatform.VK_STORAGE_KEY, value: '' });
      } catch (e) {
        console.warn('[VK] Ошибка сброса облачного сейва:', e);
      }
    }
  }

  // --- Лидерборд ---
  // Чтение таблицы через API у клиентского мини-приложения ненадёжно —
  // поэтому открываем нативный бокс VK (он же принимает рекорд в user_result),
  // а внутриигровую таблицу помечаем недоступной.

  public async submitLeaderboardScore(score: number): Promise<boolean> {
    if (this.isDevMode) return false;
    try {
      await bridge.send('VKWebAppCallAPIMethod', {
        method: 'secure.setUserLevel',
        // access_token подставляет платформа для методов, разрешённым мини-приложениям
        params: { level: score, v: '5.131' } as any
      });
      return true;
    } catch (e) {
      console.warn('[VK] secure.setUserLevel не сработал:', e);
      return false;
    }
  }

  public async getLeaderboardEntries(): Promise<LeaderboardEntry[] | null> {
    return null; // внутриигровая таблица не используется — есть нативный бокс
  }

  // Открывает платформенный лидерборд VK и передаёт текущий результат игрока
  public showNativeLeaderboard(score: number): boolean {
    if (this.isDevMode) return false;
    bridge.send('VKWebAppShowLeaderBoardBox', { user_result: score })
      .catch((e: any) => console.warn('[VK] Лидерборд недоступен:', e));
    return true;
  }

  public getShareUrl(): string {
    return this.appId ? `https://vk.com/app${this.appId}` : window.location.origin + window.location.pathname;
  }

  // --- Платежи (голоса ВК через ShowOrderBox; товары заводятся в консоли приложения) ---
  public async getShopCatalog(): Promise<ShopProduct[] | null> {
    return null; // каталога через bridge нет — цену покажет сам OrderBox
  }

  public async purchaseItem(productId: string): Promise<boolean> {
    if (this.isDevMode) return true; // эмуляция успешной покупки
    try {
      await bridge.send('VKWebAppShowOrderBox', { type: 'item', item: productId });
      return true;
    } catch (e) {
      console.warn('[VK] Покупка отменена/ошибка:', e);
      return false;
    }
  }

  public async hasPurchase(): Promise<boolean> {
    return false; // API восстановления покупок через bridge нет — состояние живёт в сейве
  }

  public gameplayStart(): void { /* у VK нет метрик геймплея */ }
  public gameplayStop(): void { /* у VK нет метрик геймплея */ }

  // --- Авторизация: неявная, пользователь всегда залогинен в VK ---
  public isGuest(): boolean { return false; }
  public async openAuthDialog(): Promise<boolean> { return false; }

  public async requestReview(): Promise<void> { /* у VK нет API отзывов */ }

  // Аналог «ярлыка» — добавление приложения в избранное VK
  public async promptShortcut(): Promise<boolean> {
    if (this.isDevMode) return false;
    try {
      const res: any = await bridge.send('VKWebAppAddToFavorites');
      return res?.result === true;
    } catch (e) {
      console.warn('[VK] Добавление в избранное недоступно:', e);
      return false;
    }
  }
}
