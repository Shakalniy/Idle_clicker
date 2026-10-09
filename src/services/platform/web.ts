import type { IPlatform, PlatformCapabilities } from './IPlatform';
import type {
  GameSaveData,
  PartialSaveData,
  LeaderboardEntry,
  ShopProduct
} from './types';
import { SAVE_KEY, mergeSave } from './types';

// Универсальный веб-адаптер: локальные сейвы, реклама эмулируется,
// платежей/лидерборда/авторизации нет. Используется для сборок под порталы
// без отдельного адаптера (self-hosted, черновик CrazyGames и т.п.) —
// для реального портала рекламу и сейвы нужно переопределить его SDK.
export class WebPlatform implements IPlatform {
  private static instance: WebPlatform;

  public readonly id = 'web';
  public readonly capabilities: PlatformCapabilities = {
    rewarded: true,     // эмуляция: награда выдаётся без показа ролика
    interstitial: true,
    cloudSaves: false,
    leaderboard: false,
    payments: false,
    auth: false,
    review: false,
    shortcut: false
  };
  public readonly authProviderName = null;
  public readonly shortcutLabel = null;

  private constructor() {}

  public static getInstance(): WebPlatform {
    if (!WebPlatform.instance) {
      WebPlatform.instance = new WebPlatform();
    }
    return WebPlatform.instance;
  }

  public async init(): Promise<void> { /* SDK не требуется */ }

  // dev_lang из localStorage в приоритете, иначе язык браузера
  public getLang(): string {
    return localStorage.getItem('dev_lang') || (navigator.language || 'ru').slice(0, 2);
  }

  public showFullscreenAdv(onOpen?: () => void, onClose?: (wasShown: boolean) => void): void {
    onOpen?.();
    setTimeout(() => onClose?.(true), 400);
  }

  public showRewarded(onReward: () => void, onPause: () => void, onResume: () => void): void {
    onPause();
    setTimeout(() => {
      onReward();
      onResume();
    }, 800);
  }

  public async loadData(): Promise<GameSaveData> {
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
  }

  public async resetData(): Promise<void> {
    localStorage.removeItem(SAVE_KEY);
  }

  public async submitLeaderboardScore(): Promise<boolean> { return false; }
  public async getLeaderboardEntries(): Promise<LeaderboardEntry[] | null> { return null; }

  public getShareUrl(): string {
    const base = window.location.origin + window.location.pathname;
    return `${base}?ref=invite`;
  }

  public async getShopCatalog(): Promise<ShopProduct[] | null> { return null; }
  public async purchaseItem(): Promise<boolean> { return false; }
  public async hasPurchase(): Promise<boolean> { return false; }

  public gameplayStart(): void { /* нет метрик геймплея */ }
  public gameplayStop(): void { /* нет метрик геймплея */ }

  public isGuest(): boolean { return false; }
  public async openAuthDialog(): Promise<boolean> { return false; }
  public async requestReview(): Promise<void> { /* недоступно */ }
  public async promptShortcut(): Promise<boolean> { return false; }
}
