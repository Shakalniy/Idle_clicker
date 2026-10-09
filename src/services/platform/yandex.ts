import type { LocalText } from '../../i18n';
import type { IPlatform, PlatformCapabilities } from './IPlatform';
import {
  type GameSaveData,
  type PartialSaveData,
  type LeaderboardEntry,
  type ShopProduct,
  SAVE_KEY,
  mergeSave
} from './types';

declare const YaGames: any;

export class YandexPlatform implements IPlatform {
  private static instance: YandexPlatform;
  private ysdk: any = null;
  private player: any = null;
  private isDevMode: boolean = false;

  public readonly id = 'yandex';
  public readonly capabilities: PlatformCapabilities = {
    rewarded: true,
    interstitial: true,
    cloudSaves: true,
    leaderboard: true,
    payments: true,
    auth: true,
    review: true,
    shortcut: true
  };
  public readonly authProviderName: LocalText = { ru: 'Яндекс', en: 'Yandex' };
  public readonly shortcutLabel: LocalText = { ru: 'На рабочий стол', en: 'Add to home' };

  private constructor() {}

  public static getInstance(): YandexPlatform {
    if (!YandexPlatform.instance) {
      YandexPlatform.instance = new YandexPlatform();
    }
    return YandexPlatform.instance;
  }

  public async init() {
    if (typeof YaGames === 'undefined') {
      this.isDevMode = true;
      return;
    }

    try {
      this.ysdk = await YaGames.init();
      try {
        // scopes: true — запрашивает у игрока доступ к имени/аватару (нужно для лидерборда)
        this.player = await this.ysdk.getPlayer({ scopes: true });
      } catch (err) {
        console.warn('[SDK] Игрок не авторизован');
      }
      this.ysdk.features.LoadingAPI?.ready();
    } catch (e) {
      console.error('[SDK] Ошибка инициализации:', e);
      this.isDevMode = true;
    }
  }

  // Межстраничный (полноэкранный) блок рекламы. Частоту ограничивает сама платформа,
  // но вызывать стоит только в логических паузах и не чаще раза в ~3 минуты.
  public showFullscreenAdv(onOpen?: () => void, onClose?: (wasShown: boolean) => void): void {
    if (this.isDevMode || !this.ysdk) {
      onOpen?.();
      setTimeout(() => onClose?.(true), 400);
      return;
    }
    try {
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => onOpen?.(),
          onClose: (wasShown: boolean) => onClose?.(wasShown),
          onError: () => onClose?.(false)
        }
      });
    } catch (e) {
      console.warn('[SDK] Ошибка вызова межстраничной рекламы:', e);
      onClose?.(false);
    }
  }

  public showRewarded(onReward: () => void, onPause: () => void, onResume: () => void): void {
    if (this.isDevMode || !this.ysdk) {
      onPause();
      setTimeout(() => {
        onReward();
        onResume();
      }, 800);
      return;
    }

    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: onPause,
        onRewarded: onReward,
        onClose: onResume,
        onError: onResume
      }
    });
  }

  public async loadData(): Promise<GameSaveData> {
    if (this.player) {
      try {
        const cloudData = await this.player.getData();
        if (cloudData && Object.keys(cloudData).length > 0) {
          return mergeSave(cloudData);
        }
      } catch (e) {
        console.error('Ошибка чтения облака:', e);
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
    const merged = {
      ...current,
      ...data,
      lastSaveTime: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(merged));

    if (this.player) {
      this.player.setData(merged, true).catch((e: any) => console.error('Ошибка записи в облако:', e));
    }
  }

  // --- Лидерборд ---
  private leaderboard: any = null;

  // Имя таблицы создаётся в консоли Яндекс.Игр: numeric, сортировка desc
  private static readonly LEADERBOARD = 'crystalRank';

  private async getLeaderboardApi(): Promise<any> {
    if (this.isDevMode || !this.ysdk) return null;
    if (!this.leaderboard) {
      try {
        this.leaderboard = await this.ysdk.getLeaderboards();
      } catch (e) {
        console.warn('[SDK] Лидерборды недоступны:', e);
        return null;
      }
    }
    return this.leaderboard;
  }

  // Отправить рекорд (ранг кристалла + баланс в extraData). Возвращает true при успехе
  public async submitLeaderboardScore(score: number, coins?: number): Promise<boolean> {
    const lb = await this.getLeaderboardApi();
    if (!lb) return false;
    try {
      const extra = coins != null ? JSON.stringify({ c: Math.floor(coins) }) : undefined;
      await lb.setLeaderboardScore(YandexPlatform.LEADERBOARD, score, extra);
      return true;
    } catch (e) {
      console.warn('[SDK] Ошибка записи рекорда:', e);
      return false;
    }
  }

  // Топ-N + запись игрока (null — недоступно/не авторизован)
  public async getLeaderboardEntries(top: number = 10): Promise<LeaderboardEntry[] | null> {
    const lb = await this.getLeaderboardApi();
    if (!lb) return null;
    try {
      const res = await lb.getLeaderboardEntries(YandexPlatform.LEADERBOARD, {
        quantityTop: top,
        includeUser: true,
        quantityAround: 3
      });
      return (res.entries || []).map((e: any) => {
        let coins: number | undefined;
        try { coins = e.extraData ? JSON.parse(e.extraData)?.c : undefined; } catch { /* старые записи без extraData */ }
        return {
          rank: e.rank,
          name: e.player?.publicName || (this.getLang() === 'ru' ? 'Аноним' : 'Anonymous'),
          score: e.score,
          coins
        };
      });
    } catch (e) {
      console.warn('[SDK] Ошибка чтения лидерборда:', e);
      return null;
    }
  }

  // Реферальная ссылка: t.me/яндекс-шеринг недоступен — используем URL с параметром
  public getShareUrl(): string {
    const base = window.location.origin + window.location.pathname;
    return `${base}?ref=invite`;
  }

  // Язык окружения платформы ('ru', 'en', 'tr'…) — для локализации.
  // В dev-режиме язык можно форсировать через localStorage.dev_lang
  public getLang(): string {
    if (this.isDevMode || !this.ysdk) return localStorage.getItem('dev_lang') || 'ru';
    return this.ysdk.environment?.i18n?.lang || 'ru';
  }

  // --- Платежи (In-App Purchases за Яны) ---
  private payments: any = null;

  // Каталог товаров: getCatalog() вернёт null в дев-режиме/без авторизации
  public async getShopCatalog(): Promise<ShopProduct[] | null> {
    if (this.isDevMode || !this.ysdk) return null;
    try {
      this.payments = this.payments || await this.ysdk.getPayments({ signed: false });
      const catalog = await this.payments.getCatalog();
      return (catalog || []).map((p: any) => ({
        id: p.id, title: p.title, description: p.description, price: p.priceValue
      }));
    } catch (e) {
      console.warn('[SDK] Платежи недоступны:', e);
      return null;
    }
  }

  // Купить товар по id. Возвращает true при успешной оплате
  public async purchaseItem(productId: string): Promise<boolean> {
    if (this.isDevMode || !this.ysdk) {
      return true; // в дев-режиме эмулируем успешную покупку
    }
    try {
      this.payments = this.payments || await this.ysdk.getPayments({ signed: false });
      await this.payments.purchase({ id: productId });
      return true;
    } catch (e) {
      console.warn('[SDK] Покупка отменена/ошибка:', e);
      return false;
    }
  }

  // Проверить, куплен ли товар (для восстановления покупок при входе)
  public async hasPurchase(productId: string): Promise<boolean> {
    if (this.isDevMode || !this.ysdk) return false;
    try {
      this.payments = this.payments || await this.ysdk.getPayments({ signed: false });
      const purchases = await this.payments.getPurchases();
      return (purchases || []).some((p: any) => p.productID === productId);
    } catch (e) {
      console.warn('[SDK] Ошибка проверки покупок:', e);
      return false;
    }
  }

  // GameplayAPI: Яндекс собирает метрики игрового времени (начало/пауза геймплея)
  public gameplayStart(): void {
    try { this.ysdk?.features?.GameplayAPI?.start(); } catch { /* опциональный API */ }
  }

  public gameplayStop(): void {
    try { this.ysdk?.features?.GameplayAPI?.stop(); } catch { /* опциональный API */ }
  }

  // --- Социальные фичи Яндекса ---

  // Авторизован ли игрок (новый API isAuthorized, фолбэк на deprecated getMode)
  private isPlayerAuthorized(): boolean {
    if (!this.player) return false;
    if (typeof this.player.isAuthorized === 'function') return this.player.isAuthorized();
    return this.player.getMode?.() !== 'lite';
  }

  // Гость ли игрок (неавторизованный аккаунт; player=null при неудачном getPlayer)
  public isGuest(): boolean {
    if (this.isDevMode || !this.ysdk) return false;
    return !this.isPlayerAuthorized();
  }

  // Системный диалог авторизации Яндекса. Возвращает true, если игрок вошёл
  public async openAuthDialog(): Promise<boolean> {
    if (this.isDevMode || !this.ysdk?.auth) return false;
    try {
      await this.ysdk.auth.openAuthDialog();
      // Перечитываем player — после входа он может стать полным
      this.player = await this.ysdk.getPlayer({ scopes: true });
      return this.isPlayerAuthorized();
    } catch (e) {
      console.warn('[SDK] Авторизация отменена/недоступна:', e);
      return false;
    }
  }

  // Оценка игры в каталоге: сначала canReview, затем requestReview
  public async requestReview(): Promise<void> {
    if (this.isDevMode || !this.ysdk?.feedback) return;
    try {
      const { value } = await this.ysdk.feedback.canReview();
      if (value) await this.ysdk.feedback.requestReview();
    } catch (e) {
      console.warn('[SDK] Отзыв недоступен:', e);
    }
  }

  // Ярлык игры на рабочий стол смартфона
  public async promptShortcut(): Promise<boolean> {
    if (this.isDevMode || !this.ysdk?.shortcut) return false;
    try {
      const { canShow } = await this.ysdk.shortcut.canShowPrompt();
      if (!canShow) return false;
      const { outcome } = await this.ysdk.shortcut.showPrompt();
      return outcome === 'accepted';
    } catch (e) {
      console.warn('[SDK] Ярлык недоступен:', e);
      return false;
    }
  }

  // Сброс всего прогресса (тестирование): чистит localStorage и облачный сейв
  public async resetData(): Promise<void> {
    localStorage.removeItem(SAVE_KEY);
    if (this.player) {
      try {
        await this.player.setData({}, true);
      } catch (e) {
        console.error('Ошибка сброса облачного сейва:', e);
      }
    }
  }
}
