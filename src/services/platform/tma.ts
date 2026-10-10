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

declare const Telegram: any;
declare const Adsgram: any;
declare const telemetree: any;
declare const ym: any; // Яндекс.Метрика

// Адаптер под Telegram Mini Apps (TMA).
// Скрипты telegram-web-app.js и adsgram подключаются в index.html при сборке (--mode tma).
//
// Особенности платформы:
// - Авторизация неявная: данные пользователя лежат в WebApp.initDataUnsafe.user.
// - Облачные сейвы — WebApp.CloudStorage (значение ключа до 4096 байт).
// - У Telegram нет своей рекламы и лидербордов. Rewarded/interstitial идут через
//   Adsgram (сети под TMA: Adsgram, Monetag) — blockId задаётся env VITE_ADSGRAM_BLOCK_ID;
//   без него реклама эмулируется (награда выдаётся сразу — удобно для теста).
// - Платежи Stars создаются только через бот-бэкенд (Bot API createInvoiceLink) —
//   чисто клиентского API нет, поэтому payments выключен. Когда появится бэкенд,
//   сгенерированный invoice-линк открывается через WebApp.openInvoice(url).
export class TmaPlatform implements IPlatform {
  private static instance: TmaPlatform;
  private webApp: any = null;
  private isDevMode = false;
  private adController: any = null;
  private tracker: any = null; // Telemetree builder

  public readonly id = 'tma';
  public readonly capabilities: PlatformCapabilities = {
    rewarded: true,
    interstitial: true,
    cloudSaves: true,
    leaderboard: false,   // в TMA нет таблиц рекордов
    payments: false,      // Stars-инвойсы требуют бэкенд с Bot API
    auth: false,          // пользователь всегда авторизован в Telegram
    review: false,
    shortcut: true        // WebApp.addToHomeScreen (Bot API 8.0+)
  };
  public readonly authProviderName = null;
  public readonly shortcutLabel: LocalText = { ru: 'На главный экран', en: 'To home screen' };

  private static readonly TG_STORAGE_KEY = 'save';
  // CloudStorage принимает значение до 4096 байт
  private static readonly TG_VALUE_LIMIT = 4000;

  private constructor() {}

  public static getInstance(): TmaPlatform {
    if (!TmaPlatform.instance) {
      TmaPlatform.instance = new TmaPlatform();
    }
    return TmaPlatform.instance;
  }

  public async init(): Promise<void> {
    const tg = typeof Telegram !== 'undefined' ? Telegram.WebApp : null;
    if (!tg) {
      // Открыто вне Telegram (обычный браузер) — режим эмуляции
      this.isDevMode = true;
      return;
    }
    this.webApp = tg;
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.(); // чтобы свайп вниз не сворачивал игру во время тапов

    // «На главный экран» есть только в свежих клиентах Telegram
    if (typeof tg.addToHomeScreen !== 'function') {
      this.capabilities.shortcut = false;
    }

    // Рекламный блок Adsgram инициализируется только при заданном blockId
    const blockId = import.meta.env.VITE_ADSGRAM_BLOCK_ID;
    if (blockId && typeof Adsgram !== 'undefined') {
      try {
        this.adController = Adsgram.init({ blockId });
      } catch (e) {
        console.warn('[TMA] Adsgram init не удался:', e);
      }
    }

    // Аналитика Telemetree: pageview/сессии собираются автоматически,
    // кастомные события — через trackEvent(). NB: сервис нестабилен (см. DEPLOY_TG.md)
    const tmProject = import.meta.env.VITE_TELEMETREE_PROJECT_ID;
    const tmKey = import.meta.env.VITE_TELEMETREE_API_KEY;
    if (tmProject && tmKey && typeof telemetree === 'function') {
      try {
        this.tracker = telemetree({
          projectId: tmProject,
          apiKey: tmKey,
          appName: 'Idle Crystal Clicker',
          isTelegramContext: true
        });
      } catch (e) {
        console.warn('[TMA] Telemetree init не удался:', e);
      }
    }

    // Яндекс.Метрика — основная аналитика (визиты, удержание, вебвизор, цели)
    this.ymId = import.meta.env.VITE_YM_COUNTER_ID || '';
    if (this.ymId) this.initMetrica();
  }

  private ymId = '';

  // Официальный бутстрап Метрики: tag.js НЕ создаёт window.ym сам —
  // нужна очередь-стаб, которую tag.js разгребёт после загрузки.
  // Без стаба вызов ym(id,'init') просто невозможен и хит не уходит.
  private initMetrica(): void {
    try {
      const w = window as unknown as { ym?: any };
      w.ym = w.ym || function (...args: unknown[]) { (w.ym.a = w.ym.a || []).push(args); };
      w.ym.l = Date.now();
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://mc.yandex.ru/metrika/tag.js';
      document.head.appendChild(s);
      w.ym(this.ymId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true
      });
    } catch (e) {
      console.warn('[TMA] Метрика init не удалась:', e);
    }
  }

  // Кастомные события аналитики. Молча теряются без трекеров.
  public trackEvent(name: string, data?: Record<string, unknown>): void {
    try { this.tracker?.track(name, data); } catch { /* аналитика не должна ломать игру */ }
    try { if (this.ymId) ym(this.ymId, 'reachGoal', name, data); } catch { /* то же */ }
  }

  public getLang(): string {
    if (this.isDevMode) return localStorage.getItem('dev_lang') || 'ru';
    return this.webApp?.initDataUnsafe?.user?.language_code || 'ru';
  }

  // --- Реклама (Adsgram) ---

  public showFullscreenAdv(onOpen?: () => void, onClose?: (wasShown: boolean) => void): void {
    if (this.isDevMode || !this.adController) {
      onOpen?.();
      setTimeout(() => onClose?.(true), 400);
      return;
    }
    onOpen?.();
    this.adController.show()
      .then(() => onClose?.(true))
      .catch(() => onClose?.(false));
  }

  public showRewarded(onReward: () => void, onPause: () => void, onResume: () => void): void {
    if (this.isDevMode || !this.adController) {
      onPause();
      setTimeout(() => {
        onReward();
        onResume();
      }, 800);
      return;
    }
    onPause();
    // Adsgram резолвит {done: true}, только если ролик досмотрен до конца
    this.adController.show()
      .then((r: any) => { if (r?.done) onReward(); onResume(); })
      .catch(() => onResume());
  }

  // --- Сейвы (CloudStorage + localStorage как фолбэк) ---

  private csGet(key: string): Promise<string | null> {
    return new Promise(resolve => {
      try {
        this.webApp.CloudStorage.getItem(key, (err: any, val: string) =>
          resolve(err ? null : (val || null)));
      } catch {
        resolve(null);
      }
    });
  }

  private csSet(key: string, value: string): Promise<void> {
    return new Promise(resolve => {
      try {
        this.webApp.CloudStorage.setItem(key, value, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  public async loadData(): Promise<GameSaveData> {
    if (!this.isDevMode) {
      const raw = await this.csGet(TmaPlatform.TG_STORAGE_KEY);
      if (raw) {
        try { return mergeSave(JSON.parse(raw)); } catch { /* битый сейв в облаке — идём в локальный */ }
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
      if (json.length > TmaPlatform.TG_VALUE_LIMIT) {
        console.warn(`[TMA] Сейв ${json.length} символов — больше лимита CloudStorage, облако пропущено`);
        return;
      }
      this.csSet(TmaPlatform.TG_STORAGE_KEY, json);
    }
  }

  public async resetData(): Promise<void> {
    localStorage.removeItem(SAVE_KEY);
    if (!this.isDevMode) {
      try {
        await new Promise<void>(resolve => {
          this.webApp.CloudStorage.removeItem(TmaPlatform.TG_STORAGE_KEY, () => resolve());
        });
      } catch { /* опциональный API */ }
    }
  }

  // --- Лидерборд: в TMA нет платформенной таблицы ---
  public async submitLeaderboardScore(): Promise<boolean> { return false; }
  public async getLeaderboardEntries(): Promise<LeaderboardEntry[] | null> { return null; }

  // Реферальная ссылка вида https://t.me/<bot>/<app>?startapp=invite —
  // задаётся через env VITE_TG_APP_URL при сборке
  public getShareUrl(): string {
    return import.meta.env.VITE_TG_APP_URL || (window.location.origin + window.location.pathname);
  }

  // --- Платежи: Stars-инвойс создаётся бэкендом, клиент только открывает ссылку ---
  public async getShopCatalog(): Promise<ShopProduct[] | null> { return null; }
  public async purchaseItem(): Promise<boolean> { return false; }
  public async hasPurchase(): Promise<boolean> { return false; }

  public gameplayStart(): void { /* у TMA нет метрик геймплея */ }
  public gameplayStop(): void { /* у TMA нет метрик геймплея */ }

  public isGuest(): boolean { return false; }
  public async openAuthDialog(): Promise<boolean> { return false; }
  public async requestReview(): Promise<void> { /* у TMA нет API отзывов */ }

  // Ярлык на домашний экран смартфона (Bot API 8.0+)
  public async promptShortcut(): Promise<boolean> {
    if (this.isDevMode || typeof this.webApp?.addToHomeScreen !== 'function') return false;
    try {
      this.webApp.addToHomeScreen();
      return true;
    } catch (e) {
      console.warn('[TMA] addToHomeScreen недоступен:', e);
      return false;
    }
  }
}
