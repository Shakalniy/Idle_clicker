// Платформенно-независимые типы: формат сейва и дефолтные данные.
// Используются всеми адаптерами (Yandex, Web, VK, Telegram...).

export interface PlayerPerks {
  clickBonus: number;       // Добавка к силе клика (легаси-дары старых сейвов)
  clickMult: number;        // Дар Мощи: множитель клика (1.25 = +25%)
  incomeMultiplier: number; // Дар Процветания: множитель дохода (1.1 = +10%)
  starterMiners: number;    // Бесплатные шахтеры со старта (легаси-дары старых сейвов)
  buildingDiscount: number; // Дар Бригады: число даров-скидок на предприятия (−7% за каждый)
}

export interface GameSaveData {
  coins: number;
  clickPower: number;
  clickLevel: number;
  pickaxeLevel: number;     // Параллельная прокачка кирки (+25% к клику за уровень)
  buildings: { [key: string]: number };
  lastSaveTime: number;
  crystalTier: number;      // Текущий уровень кристалла (0, 1, 2...)
  perks: PlayerPerks;       // Накопленные постоянные бонусы
  stats: {                  // Статистика для заданий
    totalClicks: number;
    totalCoinsEarned: number;
    chestsOpened: number;   // Пойманные сундуки (для контрактов)
  };
  questIndex: number;       // Текущее задание
  dailyStreak: number;      // Серия ежедневных входов
  lastDailyDay: number;     // День последнего забора награды (дни unix)
  managers: { [key: string]: boolean }; // Нанятые менеджеры (×2 к зданию)
  artifacts: string[];      // Собранные артефакты
  skins: string[];          // Купленные скины кристалла
  activeSkin: string;       // Активный скин
  eventDay: number;         // День, на который вычислено событие
  eventMult: number;        // Множитель события дня (1 = нет события)
  achievements: string[];   // Полученные достижения
  contract: {               // Активный ежечасный контракт (null = нет)
    type: 'taps' | 'coins' | 'build' | 'upgrade' | 'chest' | 'combo';
    target: number;         // цель
    start: number;          // значение счётчика на момент выдачи
    deadline: number;       // unix-время истечения
  } | null;
  nextContractAt: number;   // unix-время появления следующего контракта
  essence: number;                       // Эссенция кристалла — мета-валюта за эволюции
  essenceUpgrades: { [id: string]: number }; // Уровни перков эссенции
  rankChoices: { [tier: number]: string };   // Выбранные бонусы рангов (id эффекта)
  artifactLevels: { [id: string]: number };  // Уровни артефактов (дубликаты качают)
  settings: { volume: number; particles: boolean }; // Настройки: громкость 0–100, частицы вкл/выкл
  lastWheelDay: number;     // День последнего спина колеса фортуны (дни unix)
  lastShareDay: number;     // День последнего бонуса за «поделиться»
  lastInterstitialAt: number; // unix-время последнего показа межстраничной рекламы
  tutorialDone: boolean;      // онбординг-оверлей пройден
  authPromptDismissed: boolean; // гость нажал «Позже» — диалог входа больше не показывать
  bossPaidTier: number;       // tierIdx босса, за которого уже заплачен вход (−1 = не оплачено)
  sessionsPlayed: number;     // счётчик сессий — для мягких промптов (шорткат и т.п.)
  iap: {                    // Внутриигровые покупки
    doubleIncome: boolean;  // Вечный удвоитель дохода
    noAds: boolean;         // Отключение рекламы
  };
}

export type PartialSaveData = {
  [K in keyof GameSaveData]?: GameSaveData[K];
};

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  coins?: number;
}

export interface ShopProduct {
  id: string;
  title: string;
  description: string;
  price: string;
}

// Ключ локального хранилища — общий для всех платформ
export const SAVE_KEY = 'idle_game_save_v3';

export function createDefaultSave(): GameSaveData {
  return {
    coins: 25, // стартовый бонус: первая покупка доступна сразу
    clickPower: 1,
    clickLevel: 1,
    pickaxeLevel: 0,
    buildings: { miner: 0, drill: 0, factory: 0, train: 0, laser: 0 },
    lastSaveTime: Date.now(),
    crystalTier: 0,
    perks: {
      clickBonus: 0,
      clickMult: 1.0,
      incomeMultiplier: 1.0,
      starterMiners: 0,
      buildingDiscount: 0
    },
    stats: {
      totalClicks: 0,
      totalCoinsEarned: 0,
      chestsOpened: 0
    },
    questIndex: 0,
    dailyStreak: 0,
    lastDailyDay: 0,
    managers: { miner: false, drill: false, factory: false, train: false, laser: false },
    artifacts: [],
    skins: ['default'],
    activeSkin: 'default',
    eventDay: 0,
    eventMult: 1,
    achievements: [],
    contract: null,
    nextContractAt: 0,
    essence: 0,
    essenceUpgrades: {},
    rankChoices: {},
    artifactLevels: {},
    settings: { volume: 70, particles: true },
    lastWheelDay: 0,
    lastShareDay: 0,
    lastInterstitialAt: 0,
    tutorialDone: false,
    authPromptDismissed: false,
    bossPaidTier: -1,
    sessionsPlayed: 0,
    iap: { doubleIncome: false, noAds: false }
  };
}

// Мерж сохранённых данных поверх дефолтов — новые поля из новых версий игры не теряются
export function mergeSave(saved: Partial<GameSaveData>): GameSaveData {
  const defaults = createDefaultSave();
  return {
    ...defaults,
    ...saved,
    buildings: { ...defaults.buildings, ...(saved.buildings || {}) },
    perks: { ...defaults.perks, ...(saved.perks || {}) },
    stats: { ...defaults.stats, ...(saved.stats || {}) },
    managers: { ...defaults.managers, ...(saved.managers || {}) },
    settings: { ...defaults.settings, ...(saved.settings || {}) },
    iap: { ...defaults.iap, ...(saved.iap || {}) }
  };
}
