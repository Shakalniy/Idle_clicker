import type { LocalText } from '../../i18n';
import type {
  GameSaveData,
  PartialSaveData,
  LeaderboardEntry,
  ShopProduct
} from './types';

// Какие платформенные фичи доступны — UI прячет недоступные кнопки
export interface PlatformCapabilities {
  rewarded: boolean;    // реклама за вознаграждение
  interstitial: boolean; // полноэкранная реклама
  cloudSaves: boolean;  // облачные сейвы аккаунта
  leaderboard: boolean; // таблица рекордов
  payments: boolean;    // внутриигровые покупки
  auth: boolean;        // вход в аккаунт платформы
  review: boolean;      // системный запрос отзыва
  shortcut: boolean;    // ярлык на домашний экран
}

// Единый интерфейс платформы. Игра работает только с IPlatform —
// конкретный адаптер выбирается в factory.ts по режиму сборки.
export interface IPlatform {
  readonly id: string;
  readonly capabilities: PlatformCapabilities;
  // Название провайдера аккаунта для текстов («Войти в Яндекс»). null — авторизации нет.
  readonly authProviderName: LocalText | null;
  // Локализованная подпись пункта меню «ярлык/избранное» (Яндекс — «На рабочий стол», VK — «В избранное»)
  readonly shortcutLabel: LocalText | null;

  init(): Promise<void>;

  // Язык окружения платформы ('ru', 'en', ...)
  getLang(): string;

  // Реклама
  showFullscreenAdv(onOpen?: () => void, onClose?: (wasShown: boolean) => void): void;
  showRewarded(onReward: () => void, onPause: () => void, onResume: () => void): void;

  // Сейвы
  loadData(): Promise<GameSaveData>;
  saveData(data: PartialSaveData): void;
  resetData(): Promise<void>;

  // Лидерборд: null/false — недоступен или не авторизован
  submitLeaderboardScore(score: number, coins?: number): Promise<boolean>;
  getLeaderboardEntries(top?: number): Promise<LeaderboardEntry[] | null>;
  // Если платформа умеет свой нативный лидерборд (VK) — открывает его и возвращает true,
  // иначе игра показывает свою модалку. Необязательный метод.
  showNativeLeaderboard?(score: number): boolean;

  // Реферальная ссылка для кнопки «Поделиться»
  getShareUrl(): string;

  // Платежи: null каталог — платежи недоступны
  getShopCatalog(): Promise<ShopProduct[] | null>;
  purchaseItem(productId: string): Promise<boolean>;
  hasPurchase(productId: string): Promise<boolean>;

  // Метрики игрового времени платформы
  gameplayStart(): void;
  gameplayStop(): void;

  // Авторизация
  isGuest(): boolean;
  openAuthDialog(): Promise<boolean>;

  // Социальные фичи платформы
  requestReview(): Promise<void>;
  promptShortcut(): Promise<boolean>;

  // Аналитика (Telemetree в TMA). Необязательный метод — события просто теряются,
  // если платформа аналитику не поддерживает.
  trackEvent?(name: string, data?: Record<string, unknown>): void;
}
