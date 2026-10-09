// Локализация: ru — база, en — перевод. Язык приходит из ysdk.environment.i18n.lang.
// t(key)  — строки из словаря STRINGS
// tt(ru,en) — инлайн-перевод разовых строк (использовать только внутри методов,
//             после setLang в create())
// L({ru,en}) — выбор локализованного поля из таблиц данных (оценивается при рендере)

const STRINGS = {
  // Вкладки
  'tab.buildings': { ru: '⛏️ Здания', en: '⛏️ Buildings' },
  'tab.upgrades': { ru: '⚡ Прокачка', en: '⚡ Upgrades' },
  'tab.prestige': { ru: '💎 Эволюция', en: '💎 Evolution' },

  // Меню ☰
  'menu.bonuses': { ru: 'Бонусы кристалла', en: 'Crystal bonuses' },
  'menu.multipliers': { ru: 'Множители', en: 'Multipliers' },
  'menu.achievements': { ru: 'Достижения', en: 'Achievements' },
  'menu.essence': { ru: 'Эссенция', en: 'Essence' },
  'menu.skins': { ru: 'Скины кристалла', en: 'Crystal skins' },
  'menu.managers': { ru: 'Менеджеры', en: 'Managers' },
  'menu.shop': { ru: 'Магазин', en: 'Shop' },
  'menu.share': { ru: 'Поделиться', en: 'Share' },
  'menu.shortcut': { ru: 'На рабочий стол', en: 'Add to home' },
  'menu.leaderboard': { ru: 'Лидерборд', en: 'Leaderboard' },
  'menu.settings': { ru: 'Настройки', en: 'Settings' },
  'menu.help': { ru: 'Справка', en: 'Help' },
  'menu.sound': { ru: 'Звук', en: 'Sound' },
  'menu.reset': { ru: 'Сброс прогресса', en: 'Reset progress' },

  // Общие кнопки
  'btn.close': { ru: 'Закрыть', en: 'Close' },
  'btn.claim': { ru: 'Забрать!', en: 'Claim!' },
  'btn.later': { ru: 'Позже', en: 'Later' },

  // Заголовки модалок
  'modal.bonuses': { ru: '💠 БОНУСЫ КРИСТАЛЛА', en: '💠 CRYSTAL BONUSES' },
  'modal.multipliers': { ru: '📊 ВСЕ МНОЖИТЕЛИ', en: '📊 ALL MULTIPLIERS' },
  'modal.settings': { ru: '⚙️ НАСТРОЙКИ', en: '⚙️ SETTINGS' },
  'modal.help': { ru: '❓ СПРАВКА', en: '❓ HELP' },
  'modal.shop': { ru: '🛒 МАГАЗИН', en: '🛒 SHOP' },
  'modal.leaderboard': { ru: '📈 ЛИДЕРБОРД', en: '📈 LEADERBOARD' },
  'modal.wheel': { ru: '🎡 КОЛЕСО ФОРТУНЫ', en: '🎡 WHEEL OF FORTUNE' },
  'modal.daily': { ru: '📅 Ежедневная награда!', en: '📅 Daily reward!' },
  'modal.prestige': { ru: '✨ ЭВОЛЮЦИЯ КРИСТАЛЛА ✨', en: '✨ CRYSTAL EVOLUTION ✨' },
  'modal.achievements': { ru: '🏆 ДОСТИЖЕНИЯ', en: '🏆 ACHIEVEMENTS' },
  'modal.essence': { ru: '🔮 ЭССЕНЦИЯ КРИСТАЛЛА', en: '🔮 CRYSTAL ESSENCE' },
  'modal.skins': { ru: '🎨 СКИНЫ КРИСТАЛЛА', en: '🎨 CRYSTAL SKINS' },
  'modal.managers': { ru: '👔 МЕНЕДЖЕРЫ', en: '👔 MANAGERS' },
  'modal.rankchoice': { ru: '💎 ВЫБОР БОНУСА', en: '💎 BONUS CHOICE' },
  'modal.offline': { ru: 'С возвращением!', en: 'Welcome back!' },
  'modal.contract': { ru: '⏱️ КОНТРАКТ', en: '⏱️ CONTRACT' },
  'modal.chest': { ru: '🎁 СУНДУК НАЙДЕН!', en: '🎁 CHEST FOUND!' },
  'modal.goldenchest': { ru: '👑 ЗОЛОТОЙ СУНДУК!', en: '👑 GOLDEN CHEST!' },

  // Колесо и магазин
  'wheel.free': { ru: '🎁 Бесплатный спин!', en: '🎁 Free spin!' },
  'wheel.ad': { ru: '🎬 Крутить за рекламу', en: '🎬 Spin for ad' },
  'wheel.spinning': { ru: 'Крутится…', en: 'Spinning…' },
  'shop.buy': { ru: 'Купить', en: 'Buy' },
  'shop.owned': { ru: '✓ Куплено', en: '✓ Owned' },

  // Статус-строка
  'status.boost': { ru: '🔥 БУСТ Х2', en: '🔥 BOOST ×2' },
  'status.shards': { ru: '✨ ОСКОЛКИ', en: '✨ SHARDS' },
  'status.vein': { ru: '⚒️ ЖИЛА', en: '⚒️ VEIN' },

  // Туториал
  'tut.tap': { ru: '👆 Тапай по кристаллу — добывай монеты!', en: '👆 Tap the crystal to earn coins!' },
  'tut.buy': { ru: '⛏️ Внизу купи предприятие — оно добывает само!', en: '⛏️ Buy a building below — it mines by itself!' },
} as const;

export type StringKey = keyof typeof STRINGS;
export type LocalText = { ru: string; en: string };

let currentLang: 'ru' | 'en' = 'ru';

export function setLang(lang: string): void {
  currentLang = lang === 'en' ? 'en' : 'ru'; // неанглийские локали → русская база
}

export function t(key: StringKey): string {
  return STRINGS[key][currentLang];
}

// Выбор локализованного поля {ru,en} из таблиц данных — вызывать в рантайме
export function L(x: LocalText): string {
  return x[currentLang];
}

// Инлайн-перевод: tt('русский', 'english')
export function tt(ru: string, en: string): string {
  return currentLang === 'en' ? en : ru;
}
