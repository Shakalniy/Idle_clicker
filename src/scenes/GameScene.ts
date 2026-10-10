import Phaser from 'phaser';
import { getPlatform, type IPlatform, type GameSaveData } from '../services/platform';
import { t, tt, L, setLang } from '../i18n';
import type { LocalText } from '../i18n';

// --- ГЕОМЕТРИЯ КАНВАСА ---
const CANVAS_W = 720;
const CANVAS_H = 1280;
const CX = CANVAS_W / 2;
const DAY_MS = 86400000;

// --- ИГРОВОЙ БАЛАНС ---
const BALANCE = {
  // Прокачка
  BUILDING_COST_GROWTH: 1.15,  // рост цены здания за штуку
  CLICK_UPGRADE_BASE: 10,      // цена 1-го уровня «Удар кирки»
  CLICK_UPGRADE_GROWTH: 1.25,
  CLICK_CPS_SHARE_PER_LVL: 0.0005, // каждый уровень кирки: +0.05% от пассивного /сек за тап
  PICKAXE_BASE_COST: 500,      // цена 1-го уровня «Легендарной кирки»
  PICKAXE_COST_GROWTH: 1.4,
  PICKAXE_CLICK_BONUS: 0.25,   // +25% к силе клика за уровень
  MANAGER_COST_MULT: 25,       // найм менеджера = baseCost × 25
  SET_BONUS_PER_SET: 0.02,     // +2% к доходу за каждый полный комплект зданий

  // Летящий сундук
  CHEST_MIN_DELAY_MS: 35000,
  CHEST_MAX_DELAY_MS: 55000,
  CHEST_FLY_MS: 6500,
  CHEST_MIN_REWARD: 30,
  CHEST_CPS_FACTOR: 20,        // награда = cps × 20 + сила клика × 10
  CHEST_CLICK_FACTOR: 10,
  CHEST_VIDEO_MULT: 5,         // ×5 за рекламу
  CHEST_GOLD_CHANCE: 0.10,     // 10% — критический золотой сундук
  CHEST_GOLD_MULT: 5,          // его награда ×5

  // Золотой шар (Жадеит)
  GOLDEN_MIN_DELAY_MS: 150000,
  GOLDEN_MAX_DELAY_MS: 270000,
  GOLDEN_FLY_MS: 6000,
  FRENZY_SECONDS: 10,
  FRENZY_MULT: 7,
  FRENZY_SECONDS_JADE: 15,     // ранг Жадеит
  FRENZY_MULT_JADE: 10,

  // Буст и комбо
  BOOST_SECONDS: 60,
  BOOST_MULT: 2,
  COMBO_WINDOW_MS: 1000,       // пауза больше секунды сбивает комбо
  COMBO_STEP: 0.1,             // +10% за клик в серии
  COMBO_CAP: 20,               // потолок ×3
  COMBO_CAP_TOPAZ: 40,         // потолок ×5 на ранге Топаз

  // Механики рангов
  CRIT_MULT: 10,
  CRIT_CHANCE: 0.05,
  CRIT_CHANCE_OPAL: 0.10,
  AUTOCLICK_ONYX: 2,           // Оникс
  AUTOCLICK_OBSIDIAN: 5,       // Обсидиан
  AUTOCLICK_HEAVEN: 10,        // Небесный Алмаз
  CHEST_RANK_MULT: 2,          // Гранат: сундуки ×2
  OFFLINE_RANK_MULT: 2,        // Аметист: офлайн ×2
  RANK_INCOME_PAD: 1.5,        // Падпараджа
  RANK_INCOME_DARK: 2,         // Тёмный Алмаз (стекает с ×1.5)

  // Офлайн, дейли и события
  OFFLINE_CAP_S: 8 * 3600,
  OFFLINE_CAP_MOON_S: 16 * 3600, // Лунный камень
  OFFLINE_MIN_S: 15,           // меньше — модал не показываем
  OFFLINE_AD_MULT: 2,
  OFFLINE_AD_MULT_LONG: 3,     // при отсутствии ≥ OFFLINE_LONG_MIN
  OFFLINE_LONG_MIN: 60,
  DAILY_CPS_FACTOR: 180,       // дейли-награда не меньше cps × 180
  EVENT_CHANCE_PCT: 45,        // шанс «Жилы золота» каждый день
  EVENT_MULT: 3,
  ARTIFACT_DROP_CHANCE: 0.3,

  // Ежечасный контракт (мини-задание на сессию)
  CONTRACT_DURATION_MS: 3600000, // действует час, затем заменяется
  CONTRACT_REWARD_CPS: 90,       // награда = cps × 90 + 500
  CONTRACT_TAPS_BASE: 150,       // цель «тапов» (с разбросом)

  // Дары престижа (все масштабируются и стекятся)
  PERK_CLICK_MULT: 0.25,     // Дар Мощи: +25% к силе клика за дар
  PERK_INCOME_STEP: 0.10,    // Дар Процветания: +10% к доходу
  PERK_DISCOUNT: 0.07,       // Дар Бригады: −7% к цене предприятий за дар
  PERK_DISCOUNT_MIN: 0.3,    // потолок скидки (до −70% от базовой цены)

  // Мета-прогрессия: эссенция, выборы рангов, уровни артефактов
  ESSENCE_BASE: 1,            // эссенции за эволюцию (+1 за каждые 5 рангов)
  ESSENCE_PER_RANKS: 5,       // шаг рангов для бонусной эссенции
  ESSENCE_INCOME_STEP: 0.05,  // перк «Магма»: +5% дохода за уровень
  ESSENCE_CLICK_STEP: 0.05,   // перк «Отбойник»: +5% клика за уровень
  ESSENCE_CRIT_STEP: 0.02,    // перк «Гранёный глаз»: +2% шанса крита
  ESSENCE_CHEST_STEP: 0.15,   // перк «Магнит»: +15% к награде сундуков
  ESSENCE_AUTO_STEP: 1,       // перк «Автоматика»: +1/с автокликер
  ESSENCE_OFFLINE_STEP: 0.15, // перк «Сторож»: +15% офлайн-дохода
  ESSENCE_DISCOUNT_STEP: 0.02,// перк «Торгаш»: −2% цены зданий за уровень
  ESSENCE_COMBO_STEP: 5,      // перк «Ритм»: +5 к потолку комбо
  CHOICE_INCOME: 0.10,        // бонус ранга: +10% дохода за выбор
  CHOICE_CLICK: 0.15,         // +15% к силе клика
  CHOICE_CRIT: 0.03,          // +3% шанс крита
  CHOICE_CHEST: 0.25,         // +25% к награде сундуков
  CHOICE_AUTO: 2,             // автокликер +2/с
  CHOICE_OFFLINE: 0.25,       // +25% офлайн-дохода
  CHOICE_COMBO_CAP: 5,        // +5 к потолку комбо
  CHOICE_ART: 0.10,           // +10% к шансу дропа артефактов
  CHOICE_DISCOUNT: 0.05,      // −5% к цене предприятий
  ARTIFACT_MAX_LEVEL: 5,      // потолок уровня артефакта

  // События и разнообразие
  SHARD_WAVE_MIN_MS: 280000,  // волна осколков каждые ~4.5–5.5 мин
  SHARD_WAVE_MAX_MS: 340000,
  SHARD_WAVE_SECONDS: 10,     // длится 10 с
  SHARD_WAVE_BONUS: 0.5,      // +50% к награде тапа во время волны
  VEIN_MIN_MS: 240000,        // «Взлом жилы»: шар ⛏️ каждые ~4–8 мин
  VEIN_MAX_MS: 480000,
  VEIN_SECONDS: 10,           // 10 с челленджа тапов
  CHEST_WEEKEND_MULT: 2,      // выходные: награда сундуков ×2
  OFFLINE_FRIDAY_MULT: 3,     // пятница: офлайн-доход ×3
  WEATHER_STORM_ART: 0.15,    // пыльная буря: +15пп к дропу артефактов
  WEATHER_CLEAR_INCOME: 0.10, // ясное небо: +10% дохода
  WEATHER_STORM_INCOME: -0.10,// пыльная буря: −10% дохода
  WEATHER_HEAT_CLICK: 0.15,   // золотая жара: +15% к клику
  WEATHER_METEOR_CHEST: 0.25, // метеоритный дождь: +25% к сундукам

  // Колесо фортуны (ежедневный спин за рекламу)
  WHEEL_CPS_SMALL: 60,         // приз «монеты»: cps × 60
  WHEEL_CPS_MED: 180,
  WHEEL_CPS_BIG: 600,
  WHEEL_BOOST_S: 30,           // приз «буст ×2» на 30 с

  // Реферальная кнопка
  SHARE_CPS_FACTOR: 120,       // бонус за «поделиться» = cps × 120 (раз в день)

  // Босфайт при эволюции (страж ранга: победа → дар и новый ранг)
  BOSS_TIME_S: 45,           // лимит боя
  BOSS_LIVES: 3,             // жизни игрока (пропущенный удар = −1)
  BOSS_HP_CLICKS: 55,        // HP = сила клика × (это + ранг × шаг)
  BOSS_HP_PER_TIER: 8,
  BOSS_CPS_SHARE: 0.12,      // пассивный урон шахтёров: cps × это в секунду
  BOSS_STRIKE_MS: 1100,      // время на парирование удара ⚠
  BOSS_SHIELD_EVERY_S: 9,
  BOSS_SHIELD_MS: 3000,
  BOSS_WEAK_EVERY_S: 7,
  BOSS_WEAK_MS: 2000,
  BOSS_WEAK_RADIUS: 40,      // радиус попадания по слабой точке
  BOSS_WEAK_MULT: 3,         // урон по слабой точке ×3
  BOSS_PARRY_MULT: 4,        // бонус-урон за парирование удара
  BOSS_ARMOR_MULT: 0.35,     // Латник: тапы по броне режутся до ×0.35
  BOSS_REGEN_PCT: 0.012,     // Живучий: +1.2% HP/сек при простое
  BOSS_REGEN_IDLE_S: 1.2,    // простой = без попаданий дольше этого
  BOSS_RAGE_HP: 0.5,         // Берсерк/Владыка: ниже 50% HP удары вдвое чаще

  // Магазин (IAP за Яны)
  IAP_ESSENCE_PACK: 10,        // пак эссенции: +10 🔮
  ACHIEVEMENT_INCOME_STEP: 0.01, // каждое достижение: +1% к доходу (мета-прогрессия)
  AD_MIN_INTERVAL_MS: 180_000, // межстраничная реклама не чаще раза в 3 мин (ранний лимит платформы)
  AD_PERIODIC_MS: 300_000,     // периодический показ в долгой сессии — каждые 5 мин активной игры
  AD_NOTICE_MS: 2000,          // предупреждение перед рекламой по таймеру (правила Яндекса)

  // Таймеры и лимиты
  TAP_CPS_WINDOW_MS: 2000,  // окно подсчёта «тапов в секунду»
  TICK_MS: 1000,
  AUTOSAVE_MS: 10000,
  COIN_FLY_MAX: 8,             // макс. одновременно летящих монеток
  HAPTIC_MS: 10,
};

// Индексы рангов с уникальными механиками (порядок в CRYSTAL_TIERS)
const TIER = {
  CRIT: 3,            // Агат: критические клики
  AUTOCLICK: 6,       // Оникс: автокликер +2/с
  AUTOCLICK_PLUS: 10, // Обсидиан: автокликер +5/с
  OFFLINE_MULT: 11,   // Аметист: офлайн ×2
  CHEST_MULT: 13,     // Гранат: сундуки ×2
  OFFLINE_CAP: 17,    // Лунный камень: офлайн-кап 16 ч
  COMBO_CAP: 21,      // Топаз: комбо до ×5
  CRIT_CHANCE: 25,    // Опал: шанс крита 10%
  FRENZY: 27,         // Жадеит: шар ×10 на 15 с
  INCOME_MULT: 33,    // Падпараджа: весь доход ×1.5
  INCOME_MULT2: 47,   // Тёмный Алмаз: весь доход ×2
  AUTOCLICK_MAX: 48,  // Небесный Алмаз: автокликер +10/с
  COMBO_PERSIST: 49,  // Звёздный Алмаз: комбо не сгорает
} as const;

// --- АНТИ-АВТОКЛИКЕР ---
const ANTICLICK = {
  MAX_CPS: 25,            // больше кликов/сек — подозрение (человек ~10-15)
  WINDOW: 16,             // размер окна последних кликов для анализа
  HISTORY: 64,            // сколько последних кликов хранить (для статистики тапов/с)
  INTERVAL_STDEV_MS: 3,   // подозрительно ровные интервалы между кликами
  POSITION_SPREAD_PX: 4,  // клики строго в одну точку
  PENALTY_SECONDS: 10,    // награды режутся на 10 секунд
  PENALTY_MULT: 0.1,
};

// --- ПАЛИТРА UI ---
const UI_COLOR = {
  BLACK: 0x000000,
  PANEL: 0x1E272E,
  PANEL_DARK: 0x1A1C24,
  HEADER: 0x11161D,
  ROW: 0x2C3E50,
  STEEL: 0x34495E,
  BTN_BLUE: 0x2980B9,
  BTN_GREEN: 0x27AE60,
  GREEN_EDGE: 0x2ECC71,
  GOLD: 0xF1C40F,
  GOLD_EDGE: 0xF39C12,
  GRAY: 0x7F8C8D,
  SUBTLE: 0x8C98A4,
  BORDER: 0x2F3640,
  PURPLE: 0x8E44AD,
  PURPLE_EDGE: 0x9B59B6,
  WHITE: 0xFFFFFF,
};

// Конфигурация предприятий
interface BuildingDef {
  id: string;
  name: LocalText;
  icon: string;
  baseCost: number;
  baseCps: number;
}

const BUILDINGS: BuildingDef[] = [
  { id: 'miner',   name: { ru: 'Шахтер',     en: 'Miner' },       icon: '⛏️️', baseCost: 20,    baseCps: 1 },
  { id: 'drill',   name: { ru: 'Бур-машина', en: 'Drill rig' },   icon: '🚜', baseCost: 120,   baseCps: 6 },
  { id: 'factory', name: { ru: 'Фабрика',    en: 'Factory' },     icon: '🏭', baseCost: 750,   baseCps: 35 },
  { id: 'train',   name: { ru: 'Поезд руды', en: 'Ore train' },   icon: '🚂', baseCost: 4500,  baseCps: 220 },
  { id: 'laser',   name: { ru: 'Квант-луч',  en: 'Quantum beam' },icon: '⚡', baseCost: 28000, baseCps: 1500 },
];

// Ранги эволюции кристалла
interface CrystalTierDef {
  name: LocalText;
  icon: string;
  btnColor: number;
  strokeColor: number;
  glowColor: number;
  cost: number;
  mech: LocalText; // Уникальная механика ранга (кумулятивно)
}

const NO_MECH: LocalText = { ru: '', en: '' };

// 50 рангов в порядке реальной ценности минералов (от поделочных к редчайшим)
const CRYSTAL_TIERS: CrystalTierDef[] = [
  { name: { ru: 'Кальцит',        en: 'Calcite' },        icon: '⬜', btnColor: 0x6b6248, strokeColor: 0xd8cfae, glowColor: 0xcfc39a, cost: 0,              mech: NO_MECH },
  { name: { ru: 'Гипс',           en: 'Gypsum' },         icon: '⚪', btnColor: 0x8a8578, strokeColor: 0xf0ead8, glowColor: 0xe0d8c0, cost: 15000,          mech: NO_MECH },
  { name: { ru: 'Кварц',          en: 'Quartz' },         icon: '💎', btnColor: 0x5d6d7e, strokeColor: 0xd5dbdb, glowColor: 0xaab7b8, cost: 35000,          mech: NO_MECH },
  { name: { ru: 'Агат',           en: 'Agate' },          icon: '🟤', btnColor: 0x6e4b2a, strokeColor: 0xd3a36a, glowColor: 0xb08050, cost: 80000,          mech: { ru: '🎯 Крит. клики ×10', en: '🎯 Crit. clicks ×10' } },
  { name: { ru: 'Яшма',           en: 'Jasper' },         icon: '🟫', btnColor: 0x7a3020, strokeColor: 0xd06040, glowColor: 0xb04530, cost: 180000,         mech: NO_MECH },
  { name: { ru: 'Сердолик',       en: 'Carnelian' },      icon: '🟧', btnColor: 0x8a3510, strokeColor: 0xe07030, glowColor: 0xd05520, cost: 400000,         mech: NO_MECH },
  { name: { ru: 'Оникс',          en: 'Onyx' },           icon: '⚫', btnColor: 0x151a20, strokeColor: 0x4a5560, glowColor: 0x303a45, cost: 900000,         mech: { ru: '🤖 Автокликер +2/с', en: '🤖 Autoclicker +2/s' } },
  { name: { ru: 'Авантюрин',      en: 'Aventurine' },     icon: '🟢', btnColor: 0x245c38, strokeColor: 0x52b06e, glowColor: 0x3f8a55, cost: 2000000,        mech: NO_MECH },
  { name: { ru: 'Розовый кварц',  en: 'Rose Quartz' },    icon: '🌸', btnColor: 0x9a5f70, strokeColor: 0xf0b8c8, glowColor: 0xe0a0b5, cost: 4500000,        mech: { ru: '⚖️ Выбор бонуса', en: '⚖️ Bonus choice' } },
  { name: { ru: 'Тигровый глаз',  en: "Tiger's Eye" },    icon: '🟨', btnColor: 0x7a5218, strokeColor: 0xd0a050, glowColor: 0xa88030, cost: 10000000,       mech: NO_MECH },
  { name: { ru: 'Обсидиан',       en: 'Obsidian' },       icon: '🖤', btnColor: 0x0d0d14, strokeColor: 0x3a3a4a, glowColor: 0x22222e, cost: 22000000,       mech: { ru: '🤖 Автокликер +5/с', en: '🤖 Autoclicker +5/s' } },
  { name: { ru: 'Аметист',        en: 'Amethyst' },       icon: '🔮', btnColor: 0x5b2c80, strokeColor: 0xbb8fd0, glowColor: 0x9b59d0, cost: 50000000,       mech: { ru: '🌙 Офлайн-доход ×2', en: '🌙 Offline income ×2' } },
  { name: { ru: 'Цитрин',         en: 'Citrine' },        icon: '🟡', btnColor: 0xa07010, strokeColor: 0xf0d060, glowColor: 0xe0b030, cost: 110000000,      mech: NO_MECH },
  { name: { ru: 'Гранат',         en: 'Garnet' },         icon: '❤️', btnColor: 0x70101a, strokeColor: 0xd04050, glowColor: 0xa02030, cost: 250000000,      mech: { ru: '🎁 Сундуки ×2', en: '🎁 Chests ×2' } },
  { name: { ru: 'Бирюза',         en: 'Turquoise' },      icon: '🩵', btnColor: 0x1a7a80, strokeColor: 0x50d8d8, glowColor: 0x30b8c0, cost: 550000000,      mech: NO_MECH },
  { name: { ru: 'Лазурит',        en: 'Lapis Lazuli' },   icon: '🔵', btnColor: 0x1a3070, strokeColor: 0x5070d0, glowColor: 0x3048a0, cost: 1_200_000_000,  mech: { ru: '⚖️ Выбор бонуса', en: '⚖️ Bonus choice' } },
  { name: { ru: 'Малахит',        en: 'Malachite' },      icon: '🟩', btnColor: 0x0f5c38, strokeColor: 0x40c080, glowColor: 0x20a060, cost: 2_700_000_000,  mech: NO_MECH },
  { name: { ru: 'Лунный камень',  en: 'Moonstone' },      icon: '🌙', btnColor: 0x4a5a70, strokeColor: 0xb8d0f0, glowColor: 0x88b0e0, cost: 6_000_000_000,  mech: { ru: '💤 Офлайн-кап 16 ч', en: '💤 Offline cap 16 h' } },
  { name: { ru: 'Хризолит',       en: 'Chrysolite' },     icon: '💚', btnColor: 0x6a8020, strokeColor: 0xb8d860, glowColor: 0x98b840, cost: 13_000_000_000, mech: NO_MECH },
  { name: { ru: 'Янтарь',         en: 'Amber' },          icon: '🧡', btnColor: 0xa06a10, strokeColor: 0xf0b840, glowColor: 0xd89828, cost: 30_000_000_000, mech: NO_MECH },
  { name: { ru: 'Аквамарин',      en: 'Aquamarine' },     icon: '🩵', btnColor: 0x3090a0, strokeColor: 0x80e0e8, glowColor: 0x55c0d0, cost: 65_000_000_000, mech: NO_MECH },
  { name: { ru: 'Топаз',          en: 'Topaz' },          icon: '🟡', btnColor: 0xa07808, strokeColor: 0xf7dc6f, glowColor: 0xf4d03f, cost: 150_000_000_000, mech: { ru: '🔥 Комбо до ×5', en: '🔥 Combo up to ×5' } },
  { name: { ru: 'Турмалин',       en: 'Tourmaline' },     icon: '🩷', btnColor: 0x8a3060, strokeColor: 0xe070a8, glowColor: 0xc05088, cost: 330_000_000_000, mech: NO_MECH },
  { name: { ru: 'Циркон',         en: 'Zircon' },         icon: '🔷', btnColor: 0x2a5a9a, strokeColor: 0x6aa8e0, glowColor: 0x4a88c8, cost: 720_000_000_000, mech: NO_MECH },
  { name: { ru: 'Танзанит',       en: 'Tanzanite' },      icon: '🟣', btnColor: 0x3a2f8a, strokeColor: 0x8070e0, glowColor: 0x6050c8, cost: 1_600_000_000_000, mech: { ru: '⚖️ Выбор бонуса', en: '⚖️ Bonus choice' } },
  { name: { ru: 'Опал',           en: 'Opal' },           icon: '🌈', btnColor: 0x8a9aa0, strokeColor: 0xf8f9f9, glowColor: 0xd5e5e8, cost: 3_500_000_000_000, mech: { ru: '🎯 Шанс крита 10%', en: '🎯 Crit chance 10%' } },
  { name: { ru: 'Изумруд',        en: 'Emerald' },        icon: '💚', btnColor: 0x0e6e3e, strokeColor: 0x40d888, glowColor: 0x20b868, cost: 7_500_000_000_000, mech: NO_MECH },
  { name: { ru: 'Жадеит',         en: 'Jadeite' },        icon: '🟩', btnColor: 0x117a65, strokeColor: 0x48c9b0, glowColor: 0x1abc9c, cost: 16_000_000_000_000, mech: { ru: '⚡ Шар ×10 на 15 с', en: '⚡ Orb ×10 for 15s' } },
  { name: { ru: 'Сапфир',         en: 'Sapphire' },       icon: '🔷', btnColor: 0x184090, strokeColor: 0x5080e0, glowColor: 0x2860c8, cost: 36_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Рубин',          en: 'Ruby' },           icon: '🔴', btnColor: 0x8a0a20, strokeColor: 0xe03848, glowColor: 0xc01830, cost: 80_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Александрит',    en: 'Alexandrite' },    icon: '🌗', btnColor: 0x3f6e5a, strokeColor: 0x70c8a8, glowColor: 0x55a888, cost: 175_000_000_000_000, mech: { ru: '⚖️ Выбор бонуса', en: '⚖️ Bonus choice' } },
  { name: { ru: 'Шпинель',        en: 'Spinel' },         icon: '♦️', btnColor: 0x8a1030, strokeColor: 0xe04060, glowColor: 0xc02848, cost: 380_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Демантоид',      en: 'Demantoid' },      icon: '💠', btnColor: 0x4a8018, strokeColor: 0x90d850, glowColor: 0x70b830, cost: 830_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Падпараджа',     en: 'Padparadscha' },   icon: '🪷', btnColor: 0xa05030, strokeColor: 0xf0a080, glowColor: 0xe07858, cost: 1_800_000_000_000_000, mech: { ru: '👑 Весь доход ×1.5', en: '👑 All income ×1.5' } },
  { name: { ru: 'Бриллиант',      en: 'Diamond' },        icon: '💎', btnColor: 0x9aa8b8, strokeColor: 0xffffff, glowColor: 0xe0f0ff, cost: 4_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Бенитоит',       en: 'Benitoite' },      icon: '🔷', btnColor: 0x2530a0, strokeColor: 0x6070f0, glowColor: 0x4050e0, cost: 9_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Тааффеит',       en: 'Taaffeite' },      icon: '🟪', btnColor: 0x6e4a8a, strokeColor: 0xc8a0e0, glowColor: 0xa880c8, cost: 20_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Грандидерит',    en: 'Grandidierite' },  icon: '🟦', btnColor: 0x2a7a70, strokeColor: 0x60d8c8, glowColor: 0x45b8a8, cost: 45_000_000_000_000_000, mech: { ru: '⚖️ Выбор бонуса', en: '⚖️ Bonus choice' } },
  { name: { ru: 'Серандибит',     en: 'Serendibite' },    icon: '🔹', btnColor: 0x1f2f60, strokeColor: 0x5060b0, glowColor: 0x3a4a8a, cost: 100_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Биксбит',        en: 'Bixbite' },        icon: '♦️', btnColor: 0x8a0f0f, strokeColor: 0xe03030, glowColor: 0xc82020, cost: 220_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Мусгравит',      en: 'Musgravite' },     icon: '🟪', btnColor: 0x4a3f5a, strokeColor: 0x9080a8, glowColor: 0x706088, cost: 480_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Джермеджевит',   en: 'Jeremejevite' },   icon: '🔸', btnColor: 0x8a8350, strokeColor: 0xe8e0a8, glowColor: 0xd0c880, cost: 1_000_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Паинит',         en: 'Painite' },        icon: '🟥', btnColor: 0x501818, strokeColor: 0xa04040, glowColor: 0x802828, cost: 2_300_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Клиногумит',     en: 'Clinohumite' },    icon: '🟧', btnColor: 0x8a5a20, strokeColor: 0xe0a860, glowColor: 0xc88040, cost: 5_000_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Розовый алмаз',  en: 'Pink Diamond' },   icon: '🩷', btnColor: 0xb05880, strokeColor: 0xffb0d8, glowColor: 0xf090c0, cost: 11_000_000_000_000_000_000, mech: { ru: '⚖️ Выбор бонуса', en: '⚖️ Bonus choice' } },
  { name: { ru: 'Голубой алмаз',  en: 'Blue Diamond' },   icon: '💠', btnColor: 0x3a68a8, strokeColor: 0x90d0ff, glowColor: 0x60b0f0, cost: 25_000_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Красный алмаз',  en: 'Red Diamond' },    icon: '♦️', btnColor: 0xa00f28, strokeColor: 0xff5060, glowColor: 0xe02840, cost: 55_000_000_000_000_000_000, mech: NO_MECH },
  { name: { ru: 'Тёмный Алмаз',   en: 'Dark Diamond' },   icon: '🖤', btnColor: 0x1a1226, strokeColor: 0x6a4a9a, glowColor: 0x482a70, cost: 120_000_000_000_000_000_000, mech: { ru: '👑 Весь доход ×2', en: '👑 All income ×2' } },
  { name: { ru: 'Небесный Алмаз', en: 'Sky Diamond' },    icon: '✨', btnColor: 0x4a7a9a, strokeColor: 0xb8e8ff, glowColor: 0x80d0f8, cost: 260_000_000_000_000_000_000, mech: { ru: '🤖 Автокликер +10/с', en: '🤖 Autoclicker +10/s' } },
  { name: { ru: 'Звёздный Алмаз', en: 'Star Diamond' },   icon: '⭐', btnColor: 0xa89858, strokeColor: 0xfff8c8, glowColor: 0xf0e090, cost: 560_000_000_000_000_000_000, mech: { ru: '♾️ Комбо не сгорает', en: '♾️ Combo never decays' } },
];

// Коллекция артефактов (дроп с сундуков)
interface ArtifactDef {
  id: string;
  icon: string;
  name: LocalText;
  desc: LocalText;
  incomeMult: number; // множитель пассивного дохода
  clickMult: number;  // множитель силы клика
}

const ARTIFACTS: ArtifactDef[] = [
  { id: 'pick',  icon: '⛏️', name: { ru: 'Золотая кирка',   en: 'Golden Pickaxe' }, desc: { ru: '+15% к доходу',     en: '+15% income' },       incomeMult: 1.15, clickMult: 1 },
  { id: 'glove', icon: '🧤', name: { ru: 'Перчатки силы',  en: 'Power Gloves' },   desc: { ru: '+25% к силе клика', en: '+25% click power' },   incomeMult: 1,    clickMult: 1.25 },
  { id: 'lamp',  icon: '🏮', name: { ru: 'Лампа джинна',   en: 'Genie Lamp' },     desc: { ru: '+10% к доходу',     en: '+10% income' },       incomeMult: 1.10, clickMult: 1 },
  { id: 'core',  icon: '🔋', name: { ru: 'Энерго-ядро',    en: 'Energy Core' },    desc: { ru: '+20% к силе клика', en: '+20% click power' },   incomeMult: 1,    clickMult: 1.20 },
  { id: 'idol',  icon: '🗿', name: { ru: 'Древний идол',   en: 'Ancient Idol' },   desc: { ru: '+25% к доходу',     en: '+25% income' },       incomeMult: 1.25, clickMult: 1 },
  { id: 'crown', icon: '👑', name: { ru: 'Корона шахт',    en: 'Crown of Mines' }, desc: { ru: '+35% к доходу',     en: '+35% income' },       incomeMult: 1.35, clickMult: 1 },
];

// Скины кристалла: color = свечение (0 → цвет ранга), tint = тонировка спрайта
interface SkinDef {
  id: string;
  name: LocalText;
  icon: string;
  color: number;
  tint: number;    // UI_COLOR.WHITE → без тонировки
  glowAlpha: number;
  cost: number;
}

const SKINS: SkinDef[] = [
  { id: 'default', name: { ru: 'Стандарт',       en: 'Default' },        icon: '✨', color: 0,        tint: UI_COLOR.WHITE, glowAlpha: 0.18, cost: 0 },
  { id: 'gold',    name: { ru: 'Золотое сияние', en: 'Golden Glow' },    icon: '🌟', color: 0xffd700, tint: 0xffc84d, glowAlpha: 0.30, cost: 50000 },
  { id: 'ice',     name: { ru: 'Ледяной блеск',  en: 'Icy Shine' },      icon: '❄️', color: 0x74b9ff, tint: 0x8fc9ff, glowAlpha: 0.30, cost: 200000 },
  { id: 'fire',    name: { ru: 'Пламя',          en: 'Flame' },          icon: '🔥', color: 0xe74c3c, tint: 0xff7b54, glowAlpha: 0.35, cost: 350000 },
  { id: 'void',    name: { ru: 'Бездна',         en: 'Void' },           icon: '🌀', color: UI_COLOR.PURPLE_EDGE, tint: 0x7d3cff, glowAlpha: 0.38, cost: 1000000 },
  { id: 'rainbow', name: { ru: 'Призма',         en: 'Prism' },          icon: '🌈', color: 0xe84393, tint: UI_COLOR.WHITE, glowAlpha: 0.30, cost: 2500000 },
];

// Задания-контракты
interface QuestDef {
  desc: LocalText;
  target: number;
  reward: number;
  progress: (s: GameSaveData) => number;
}

const totalBuildings = (s: GameSaveData): number =>
  Object.values(s.buildings).reduce((a, b) => a + (b || 0), 0);

const QUESTS: QuestDef[] = [
  { desc: { ru: 'Кликни по кристаллу 25 раз',   en: 'Tap the crystal 25 times' },   target: 25,      reward: 50,    progress: s => s.stats.totalClicks },
  { desc: { ru: 'Найми 3 шахтёров',             en: 'Hire 3 miners' },              target: 3,       reward: 100,   progress: s => s.buildings.miner || 0 },
  { desc: { ru: 'Заработай всего 500 монет',    en: 'Earn 500 coins total' },       target: 500,     reward: 150,   progress: s => Math.floor(s.stats.totalCoinsEarned) },
  { desc: { ru: 'Прокачай силу клика до 5',     en: 'Upgrade click power to 5' },   target: 5,       reward: 300,   progress: s => s.clickPower },
  { desc: { ru: 'Купи Бур-машину',              en: 'Buy a Drill rig' },            target: 1,       reward: 500,   progress: s => s.buildings.drill || 0 },
  { desc: { ru: 'Заработай всего 5K монет',     en: 'Earn 5K coins total' },        target: 5000,    reward: 1200,  progress: s => Math.floor(s.stats.totalCoinsEarned) },
  { desc: { ru: 'Построй 10 предприятий',       en: 'Build 10 buildings' },         target: 10,      reward: 3000,  progress: totalBuildings },
  { desc: { ru: 'Заработай всего 50K монет',    en: 'Earn 50K coins total' },       target: 50000,   reward: 8000,  progress: s => Math.floor(s.stats.totalCoinsEarned) },
  { desc: { ru: 'Проведи первую эволюцию',      en: 'Do your first evolution' },    target: 1,       reward: 15000, progress: s => s.crystalTier },
  { desc: { ru: 'Заработай всего 1M монет',     en: 'Earn 1M coins total' },        target: 1000000, reward: 50000, progress: s => Math.floor(s.stats.totalCoinsEarned) },
  { desc: { ru: 'Эволюция до Аметиста',         en: 'Evolve to Amethyst' },         target: 11,      reward: 500000,   progress: s => s.crystalTier },
  { desc: { ru: 'Заработай всего 1B монет',     en: 'Earn 1B coins total' },        target: 1e9,     reward: 50000000, progress: s => Math.floor(s.stats.totalCoinsEarned) },
  { desc: { ru: 'Эволюция до Жадеита',          en: 'Evolve to Jadeite' },          target: 27,      reward: 1e9,      progress: s => s.crystalTier },
  { desc: { ru: 'Эволюция до Бриллианта',       en: 'Evolve to Diamond' },          target: 34,      reward: 1e11,     progress: s => s.crystalTier },
  { desc: { ru: 'Эволюция до Тёмного Алмаза',   en: 'Evolve to Dark Diamond' },     target: 47,      reward: 1e15,     progress: s => s.crystalTier },
];

// Базовые награды ежедневного стрика (день 1..7)
const DAILY_REWARDS = [100, 300, 800, 2000, 5000, 12000, 30000];

// Достижения (выдаются автоматически с наградой)
interface AchievementDef {
  id: string;
  icon: string;
  name: LocalText;
  reward: number;
  check: (s: GameSaveData) => boolean;
}

const countBuildings = (s: GameSaveData): number =>
  Object.values(s.buildings).reduce((a, b) => a + (b || 0), 0);

const countSets = (s: GameSaveData): number =>
  Math.min(...BUILDINGS.map(b => s.buildings[b.id] || 0));

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'click100',  icon: '🐣', name: { ru: 'Новичок: 100 кликов',         en: 'Newbie: 100 taps' },           reward: 200,     check: s => s.stats.totalClicks >= 100 },
  { id: 'click5k',   icon: '💪', name: { ru: 'Размялся: 5K кликов',         en: 'Warmed up: 5K taps' },         reward: 25000,   check: s => s.stats.totalClicks >= 5000 },
  { id: 'click50k',  icon: '⚡', name: { ru: 'Машина кликов: 50K тапов',    en: 'Tap machine: 50K taps' },      reward: 1000000, check: s => s.stats.totalClicks >= 50000 },
  { id: 'coin10k',   icon: '💰', name: { ru: 'Первый капитал: 10K монет',   en: 'First capital: 10K coins' },   reward: 1000,    check: s => s.stats.totalCoinsEarned >= 10000 },
  { id: 'coin10m',   icon: '🏦', name: { ru: 'Миллионер: 10M монет',        en: 'Millionaire: 10M coins' },     reward: 500000,  check: s => s.stats.totalCoinsEarned >= 1e7 },
  { id: 'coin1b',    icon: '👑', name: { ru: 'Миллиардер: 1B монет',        en: 'Billionaire: 1B coins' },      reward: 50000000, check: s => s.stats.totalCoinsEarned >= 1e9 },
  { id: 'build50',   icon: '🏗️', name: { ru: 'Застройщик: 50 предприятий',  en: 'Developer: 50 buildings' },    reward: 25000,   check: s => countBuildings(s) >= 50 },
  { id: 'set10',     icon: '⚒️', name: { ru: 'Комплектовщик: 10 комплектов', en: 'Set Collector: 10 sets' },    reward: 100000,  check: s => countSets(s) >= 10 },
  { id: 'tier10',    icon: '💎', name: { ru: 'Коллекционер: 10 рангов',     en: 'Collector: 10 ranks' },        reward: 50000,   check: s => s.crystalTier >= 9 },
  { id: 'tier25',    icon: '⭐', name: { ru: 'Легенда шахт: 25 рангов',     en: 'Mine Legend: 25 ranks' },      reward: 5000000, check: s => s.crystalTier >= 24 },
  { id: 'art6',      icon: '🏺', name: { ru: 'Археолог: все 6 артефактов',  en: 'Archaeologist: all 6 artifacts' }, reward: 1000000, check: s => s.artifacts.length >= ARTIFACTS.length },
];

// Дерево перков эссенции (мета-прогрессия, покупаются за 🔮)
interface EssencePerkDef {
  id: string;
  icon: string;
  name: LocalText;
  desc: LocalText;
  max: number;      // максимальный уровень
  baseCost: number; // цена 1-го уровня (+1 за каждый следующий)
}

const ESSENCE_PERKS: EssencePerkDef[] = [
  { id: 'income',   icon: '📈', name: { ru: 'Магма',         en: 'Magma' },        desc: { ru: '+5% ко всему доходу',    en: '+5% to all income' },       max: 10, baseCost: 1 },
  { id: 'click',    icon: '💥', name: { ru: 'Отбойник',      en: 'Jackhammer' },   desc: { ru: '+5% к силе клика',       en: '+5% click power' },         max: 10, baseCost: 1 },
  { id: 'crit',     icon: '🎯', name: { ru: 'Гранёный глаз', en: 'Faceted Eye' },  desc: { ru: '+2% к шансу крита',      en: '+2% crit chance' },         max: 5,  baseCost: 2 },
  { id: 'chest',    icon: '🎁', name: { ru: 'Магнит',        en: 'Magnet' },       desc: { ru: '+15% к награде сундуков', en: '+15% chest reward' },      max: 5,  baseCost: 2 },
  { id: 'auto',     icon: '🤖', name: { ru: 'Автоматика',    en: 'Automation' },   desc: { ru: '+1/с к автокликеру',     en: '+1/s autoclicker' },        max: 5,  baseCost: 2 },
  { id: 'offline',  icon: '🌙', name: { ru: 'Сторож',        en: 'Watchman' },     desc: { ru: '+15% к офлайн-доходу',   en: '+15% offline income' },    max: 5,  baseCost: 2 },
  { id: 'discount', icon: '🏷️', name: { ru: 'Торгаш',        en: 'Haggler' },      desc: { ru: '−2% к цене предприятий', en: '−2% building cost' },       max: 5,  baseCost: 3 },
  { id: 'combo',    icon: '🔥', name: { ru: 'Ритм',          en: 'Rhythm' },       desc: { ru: '+0.5 к потолку комбо',   en: '+0.5 to combo cap' },      max: 4,  baseCost: 3 },
];

// Выбор бонуса на рангах: tier → пара вариантов (id эффекта стекится)
interface RankChoiceOpt { id: string; label: LocalText; }

const RANK_CHOICES: { [tier: number]: [RankChoiceOpt, RankChoiceOpt] } = {
  8:  [{ id: 'income',   label: { ru: '📈 +10% ко всему доходу',    en: '📈 +10% to all income' } },   { id: 'click',    label: { ru: '💥 +15% к силе клика',        en: '💥 +15% click power' } }],
  15: [{ id: 'crit',     label: { ru: '🎯 +3% к шансу крита',       en: '🎯 +3% crit chance' } },      { id: 'chest',    label: { ru: '🎁 +25% к награде сундуков',   en: '🎁 +25% chest reward' } }],
  24: [{ id: 'auto',     label: { ru: '🤖 Автокликер +2/с',         en: '🤖 Autoclicker +2/s' } },     { id: 'offline',  label: { ru: '🌙 +25% к офлайн-доходу',      en: '🌙 +25% offline income' } }],
  30: [{ id: 'combo',    label: { ru: '🔥 Потолок комбо +5',        en: '🔥 Combo cap +5' } },         { id: 'art',      label: { ru: '🏺 +10% к дропу артефактов',   en: '🏺 +10% artifact drop' } }],
  37: [{ id: 'discount', label: { ru: '🏷️ −5% к цене предприятий',   en: '🏷️ −5% building cost' } },    { id: 'income',   label: { ru: '📈 +10% ко всему доходу',    en: '📈 +10% to all income' } }],
  44: [{ id: 'crit',     label: { ru: '🎯 +3% к шансу крита',       en: '🎯 +3% crit chance' } },      { id: 'click',    label: { ru: '💥 +15% к силе клика',        en: '💥 +15% click power' } }],
};

// Архетипы стражей эволюции: набор механик нарастает с рангом босса.
// tierIdx = индекс следующего ранга (1..49). Берётся последний spec с from <= tierIdx.
interface BossSpec {
  title: LocalText;
  tint: number;
  hpScale: number;          // множитель HP архетипа
  strikeMin: number;        // интервал ударов ⚠: min + rnd секунд
  strikeRnd: number;
  shield?: boolean;         // периодическая неуязвимость к кликам
  weak?: boolean;           // слабые точки 🎯 ×3
  regen?: boolean;          // регенерация при простое игрока
  armor?: boolean;          // броня: тапы ×0.35, только точки бьют полно
  rage?: boolean;           // <50% HP: удары вдвое чаще
  dual?: boolean;           // два удара ⚠ одновременно
}

const BOSS_ARCHETYPES: { from: number; spec: BossSpec }[] = [
  { from: 1,  spec: { title: { ru: 'Страж',        en: 'Guardian'  }, tint: 0x99a8bb, hpScale: 1,    strikeMin: 5,   strikeRnd: 4 } },
  { from: 6,  spec: { title: { ru: 'Охранник',     en: 'Warden'    }, tint: 0x6fa8dc, hpScale: 1,    strikeMin: 4.5, strikeRnd: 3.5, shield: true } },
  { from: 12, spec: { title: { ru: 'Сокрушитель',  en: 'Crusher'   }, tint: 0xe6c75a, hpScale: 1,    strikeMin: 4.5, strikeRnd: 3, weak: true } },
  { from: 18, spec: { title: { ru: 'Живучий',      en: 'Undying'   }, tint: 0x66cc88, hpScale: 0.85, strikeMin: 4.5, strikeRnd: 3, weak: true, regen: true } },
  { from: 24, spec: { title: { ru: 'Латник',       en: 'Bulwark'   }, tint: 0x8899aa, hpScale: 0.75, strikeMin: 4,   strikeRnd: 3, weak: true, armor: true } },
  { from: 32, spec: { title: { ru: 'Берсерк',      en: 'Berserker' }, tint: 0xdd5555, hpScale: 1,    strikeMin: 4,   strikeRnd: 2.5, shield: true, rage: true } },
  { from: 40, spec: { title: { ru: 'Владыка',      en: 'Overlord'  }, tint: 0xaa66dd, hpScale: 1.1,  strikeMin: 3.5, strikeRnd: 2.5, shield: true, weak: true, regen: true, rage: true, dual: true } },
];

const getBossSpec = (tierIdx: number): BossSpec =>
  BOSS_ARCHETYPES.filter(a => tierIdx >= a.from).pop()!.spec;

// Погода шахты — ежедневный модификатор (детерминирован днём, сейв не нужен)
interface WeatherDef { id: string; icon: string; name: LocalText; desc: LocalText; }

const WEATHERS: WeatherDef[] = [
  { id: 'calm',   icon: '😌', name: { ru: 'Штиль',            en: 'Calm' },          desc: { ru: 'обычный день',                          en: 'a regular day' } },
  { id: 'clear',  icon: '☀️', name: { ru: 'Ясное небо',       en: 'Clear Sky' },     desc: { ru: '+10% дохода',                           en: '+10% income' } },
  { id: 'heat',   icon: '🔥', name: { ru: 'Золотая жара',     en: 'Golden Heat' },   desc: { ru: '+15% к силе клика',                     en: '+15% click power' } },
  { id: 'storm',  icon: '🌪️', name: { ru: 'Пыльная буря',     en: 'Dust Storm' },    desc: { ru: '−10% дохода, выше дроп артефактов',       en: '−10% income, more artifact drops' } },
  { id: 'meteor', icon: '☄️', name: { ru: 'Метеоритный дождь', en: 'Meteor Shower' }, desc: { ru: '+25% к награде сундуков',                en: '+25% chest reward' } },
];

export class GameScene extends Phaser.Scene {
  private sdk!: IPlatform;
  private state!: GameSaveData;

  // UI элементы
  private coinsText!: Phaser.GameObjects.Text;
  private cpsText!: Phaser.GameObjects.Text;
  private essenceText!: Phaser.GameObjects.Text;
  private boostTimerText!: Phaser.GameObjects.Text;
  private wheelBtn!: Phaser.GameObjects.Container;
  private statusTip?: Phaser.GameObjects.Container;
  private statusTipBg!: Phaser.GameObjects.Rectangle;
  private statusTipText!: Phaser.GameObjects.Text;
  private statusHints: string[] = [];
  private crystalTitleText!: Phaser.GameObjects.Text;

  // Визуальные элементы центрального кристалла
  private coinButton!: Phaser.GameObjects.Image;
  private coinGlow!: Phaser.GameObjects.Arc;

  // Частицы клика: монетки и осколки (по цвету ранга)
  private coinBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private shardBursts: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private ambientMotes?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Монетки, летящие к счётчику
  private activeCoinFlies: number = 0;

  // Комбо-тапы и золотой шар
  private comboCount: number = 0;
  private lastClickAt: number = 0;

  // Анти-автокликер: окно последних кликов и срок штрафа
  private clickTimes: number[] = [];
  private clickPoints: Phaser.Math.Vector2[] = [];
  private suspectUntil: number = 0;
  private comboText!: Phaser.GameObjects.Text;
  private frenzyTimeLeft: number = 0;
  private currentGolden?: Phaser.GameObjects.Container;
  private currentVein?: Phaser.GameObjects.Container;
  private shardWaveLeft = 0;          // секунды «Волны осколков»
  private veinLeft = 0;               // секунды челленджа «Взлом жилы»
  private veinTaps = 0;               // тапы внутри челленджа
  private veinPanel!: Phaser.GameObjects.Container;
  private veinBarFill!: Phaser.GameObjects.Rectangle;
  private veinInfoText!: Phaser.GameObjects.Text;

  // UI заданий
  private questDescText!: Phaser.GameObjects.Text;
  private questProgressText!: Phaser.GameObjects.Text;
  private questBtn!: Phaser.GameObjects.Rectangle;
  private questBtnText!: Phaser.GameObjects.Text;

  // Строка коллекции артефактов
  private artifactsText!: Phaser.GameObjects.Text;
  private artifactRow!: Phaser.GameObjects.Container;
  private artifactIconTexts: Phaser.GameObjects.Text[] = [];
  private artifactTooltip?: Phaser.GameObjects.Container;
  private artifactTooltipBg!: Phaser.GameObjects.Rectangle;
  private artifactTooltipText!: Phaser.GameObjects.Text;
  private renderedArtifactsKey = '';

  // UI апгрейдов
  private clickUpgradeCostText!: Phaser.GameObjects.Text;
  private clickUpgradeBtn!: Phaser.GameObjects.Rectangle;
  private clickUpgradeInfoText!: Phaser.GameObjects.Text;
  private clickUpgradeInfoText2!: Phaser.GameObjects.Text;
  private pickaxeInfoText!: Phaser.GameObjects.Text;
  private tapCpsText!: Phaser.GameObjects.Text;
  private buildingDividerText!: Phaser.GameObjects.Text;

  // Мини-карточка ежечасного контракта (слева от кристалла)
  private contractPanel!: Phaser.GameObjects.Container;
  private contractDescText!: Phaser.GameObjects.Text;
  private contractProgressText!: Phaser.GameObjects.Text;
  private contractTimerText!: Phaser.GameObjects.Text;
  private pickaxeUpgradeCostText!: Phaser.GameObjects.Text;
  private pickaxeUpgradeBtn!: Phaser.GameObjects.Rectangle;
  private buildingUI = new Map();

  // Кнопка эволюции / престижа
  private prestigeBtn!: Phaser.GameObjects.Rectangle;
  private prestigeBtnText!: Phaser.GameObjects.Text;
  private prestigeInfoText!: Phaser.GameObjects.Text;
  private prestigeNextText!: Phaser.GameObjects.Text;
  private prestigePerksText!: Phaser.GameObjects.Text;
  private tabBuildings!: Phaser.GameObjects.Container;
  private tabUpgrades!: Phaser.GameObjects.Container;
  private tabPrestige!: Phaser.GameObjects.Container;
  private tabButtons: { key: string; rect: Phaser.GameObjects.Rectangle }[] = [];

  // Звуки
  private bgMusic?: Phaser.Sound.BaseSound;
  private clickSound?: Phaser.Sound.BaseSound;
  private bossMusic?: Phaser.Sound.BaseSound;
  private bossMusicChecked = false;
  private bossFightActive = false;
  private isMuted: boolean = false;
  private saveSuppressed: boolean = false; // блокирует автосейв после сброса прогресса

  // Плавный счётчик монет и таймер сундука
  private displayedCoins: number = 0;
  private chestTimerEvent?: Phaser.Time.TimerEvent;

  // Множитель дохода от рекламы
  private boostMultiplier: number = 1;
  private boostTimeLeft: number = 0;

  // Летающий бонус
  private currentChest?: Phaser.GameObjects.Container;

  // Туториал-оверлей для новичка
  private tutorialContainer?: Phaser.GameObjects.Container;
  private tutorialText?: Phaser.GameObjects.Text;
  private tutorialClicks = 0;

  constructor() {
    super('GameScene');
  }

  async create() {
    this.sdk = getPlatform();
    this.state = await this.sdk.loadData();
    setLang(this.sdk.getLang());

    this.generateTextures();
    // Фон — assets/bg.jpg на уровне страницы (canvas прозрачен, см. config.ts)
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.setupAudio();
    this.createHeader();
    this.createMuteButton();
    this.createMainClicker();
    this.createUpgradesList();
    this.createPrestigeButton();
    this.createQuestPanel();
    this.createTabs();
    this.setupTimers();

    this.ensureDailyEvent();
    this.scheduleNextLuckyDrop();
    this.scheduleNextGolden();
    this.scheduleNextShardWave();
    this.scheduleNextVein();
    this.checkDailyReward();
    this.checkOfflineEarnings();
    this.updateCrystalVisuals();
    this.updateUI();
    this.createAmbientParticles();
    this.startTutorial();

    // Счётчик сессий: на 3-й мягкий намёк про шорткат на главный экран
    this.state.sessionsPlayed = (this.state.sessionsPlayed || 0) + 1;
    this.sdk.trackEvent?.('session_start', { session: this.state.sessionsPlayed, tier: this.state.crystalTier });
    if (this.state.sessionsPlayed === 3 && this.sdk.capabilities.shortcut) {
      const sl = this.sdk.shortcutLabel ? L(this.sdk.shortcutLabel) : tt('на главный экран', 'to home screen');
      this.time.delayedCall(8000, () => this.spawnFloatingText(CX, 235, `📱 ☰ → ${sl}!`, false, true));
    }

    // Если игрок дошёл до ранга с выбором, но не выбрал бонус — предложить снова
    if (RANK_CHOICES[this.state.crystalTier] && !this.state.rankChoices[this.state.crystalTier]) {
      this.showRankChoiceModal(this.state.crystalTier);
    }

    // Гость — предложить войти через Яндекс один раз («Позже» запоминается в сейве)
    if (this.sdk.isGuest() && !this.state.authPromptDismissed) this.showAuthPrompt();

    // Восстановление покупок: если игрок купил на другом устройстве
    this.sdk.hasPurchase('income_x2').then(ok => { if (ok && !this.state.iap.doubleIncome) { this.state.iap.doubleIncome = true; this.updateUI(); this.sdk.saveData(this.state); } });
    this.sdk.hasPurchase('no_ads').then(ok => { if (ok && !this.state.iap.noAds) { this.state.iap.noAds = true; this.sdk.saveData(this.state); } });

    // Автосейв при сворачивании/закрытии вкладки — иначе теряется до 10 с прогресса
    this.sdk.gameplayStart();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sdk.gameplayStop();
        if (!this.saveSuppressed) this.sdk.saveData(this.state);
      } else {
        this.sdk.gameplayStart();
      }
    });
    window.addEventListener('beforeunload', () => {
      if (!this.saveSuppressed) this.sdk.saveData(this.state);
    });
  }

  // Плавный счётчик монет: displayedCoins догоняет state.coins за ~150 мс
  public update(time: number, delta: number): void {
    if (!this.state || !this.coinsText) return;

    const diff = this.state.coins - this.displayedCoins;
    if (diff !== 0) {
      this.displayedCoins += diff * Math.min(1, delta / 150);
      if (Math.abs(this.state.coins - this.displayedCoins) < 1) {
        this.displayedCoins = this.state.coins;
      }
      this.coinsText.setText(`💰 ${this.formatNum(Math.round(this.displayedCoins))}`);
    }

    // Скин «Призма»: кристалл и свечение переливаются всеми цветами
    if (this.state.activeSkin === 'rainbow' && this.coinButton) {
      const c = Phaser.Display.Color.HSVToRGB((time % 4000) / 4000, 0.65, 1);
      this.coinButton.setTint(c.color);
      this.coinGlow.setFillStyle(c.color, 0.3);
    }

    // Контракт проверяем каждый кадр — выполнение мгновенное, а не раз в секунду
    this.updateContract();
  }

  // --- 0. ГЕНЕРАЦИЯ СПРАЙТОВ ---
  private generateTextures(): void {
    const g = this.make.graphics();

    // Частица: золотая монетка
    g.fillStyle(0xd4ac0d, 1);
    g.fillCircle(12, 12, 11);
    g.fillStyle(UI_COLOR.GOLD, 1);
    g.fillCircle(12, 12, 9);
    g.fillStyle(0xf9e79f, 1);
    g.fillCircle(9, 9, 3);
    g.generateTexture('p_coin', 24, 24);
    g.clear();

    // Частица: пылинка
    g.fillStyle(UI_COLOR.WHITE, 0.10);
    g.fillCircle(10, 10, 10);
    g.fillStyle(UI_COLOR.WHITE, 0.3);
    g.fillCircle(10, 10, 5);
    g.generateTexture('p_mote', 20, 20);
    g.clear();

    // Осколки кристалла под цвет каждого ранга
    CRYSTAL_TIERS.forEach((t, i) => {
      g.fillStyle(t.strokeColor, 1);
      g.fillTriangle(2, 16, 9, 0, 16, 14);
      g.fillStyle(UI_COLOR.WHITE, 0.55);
      g.fillTriangle(7, 10, 9, 2, 12, 9);
      g.generateTexture(`p_shard_${i}`, 18, 18);
      g.clear();
    });

    // Гранёные кристаллы для каждого ранга
    CRYSTAL_TIERS.forEach((t, i) => this.drawGemTexture(g, `gem_${i}`, t));

    // Сундук летающего бонуса
    g.fillStyle(UI_COLOR.PURPLE, 1);
    g.fillRoundedRect(6, 12, 84, 76, 10);
    g.fillStyle(UI_COLOR.PURPLE_EDGE, 1);
    g.fillRoundedRect(6, 12, 84, 32, 10);
    g.lineStyle(5, UI_COLOR.GOLD, 1);
    g.strokeRoundedRect(6, 12, 84, 76, 10);
    g.lineBetween(6, 44, 90, 44);
    g.fillStyle(UI_COLOR.GOLD, 1);
    g.fillRoundedRect(40, 36, 16, 20, 3);
    g.fillStyle(0x6c3483, 1);
    g.fillCircle(48, 43, 3);
    g.fillRect(46, 43, 4, 7);
    g.generateTexture('chest', 96, 96);
    g.clear();

    // Золотой шар (событие «Жадеит»)
    g.fillStyle(0xb8860b, 1);
    g.fillCircle(45, 45, 44);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(45, 45, 36);
    g.fillStyle(0xfff3b0, 1);
    g.fillCircle(34, 33, 11);
    g.lineStyle(4, 0xffd700, 0.6);
    g.strokeCircle(45, 45, 41);
    g.generateTexture('golden', 90, 90);
    g.clear();

    this.drawBuildingIcons(g);
    g.destroy();
  }

  // Гексагональный гранёный кристалл 300x300
  private drawGemTexture(g: Phaser.GameObjects.Graphics, key: string, tier: CrystalTierDef): void {
    const cx = 150, cy = 150, r = 140;
    const pts: Phaser.Math.Vector2[] = [];
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 3;
      pts.push(new Phaser.Math.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }

    // Основная грань
    g.fillStyle(tier.btnColor, 1);
    g.fillPoints(pts, true);

    // Теневые грани снизу
    g.fillStyle(UI_COLOR.BLACK, 0.18);
    g.fillTriangle(cx, cy, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
    g.fillTriangle(cx, cy, pts[3].x, pts[3].y, pts[4].x, pts[4].y);

    // Светлые грани сверху
    g.fillStyle(UI_COLOR.WHITE, 0.20);
    g.fillTriangle(cx, cy, pts[5].x, pts[5].y, pts[0].x, pts[0].y);
    g.fillTriangle(cx, cy, pts[0].x, pts[0].y, pts[1].x, pts[1].y);

    // Внутренний ромб-отражение
    const ir = r * 0.5;
    g.fillStyle(tier.glowColor, 0.85);
    g.fillPoints([
      new Phaser.Math.Vector2(cx, cy - ir),
      new Phaser.Math.Vector2(cx + ir * 0.75, cy),
      new Phaser.Math.Vector2(cx, cy + ir),
      new Phaser.Math.Vector2(cx - ir * 0.75, cy)
    ], true);

    // Блик
    g.fillStyle(UI_COLOR.WHITE, 0.65);
    g.fillEllipse(cx - r * 0.3, cy - r * 0.38, r * 0.3, r * 0.15);

    // Контур
    g.lineStyle(8, tier.strokeColor, 1);
    g.strokePoints(pts, true);

    g.generateTexture(key, 300, 300);
    g.clear();
  }

  // Плоские иконки предприятий 48x48
  private drawBuildingIcons(g: Phaser.GameObjects.Graphics): void {
    // Шахтер: каска с фонариком
    g.fillStyle(UI_COLOR.GOLD_EDGE, 1);
    g.slice(24, 28, 15, Math.PI, Math.PI * 2, false);
    g.fillStyle(0xe67e22, 1);
    g.fillRoundedRect(5, 26, 38, 7, 3);
    g.fillStyle(0xfff9c4, 1);
    g.fillCircle(24, 16, 4);
    g.generateTexture('b_miner', 48, 48);
    g.clear();

    // Бур-машина: платформа и буровой конус
    g.fillStyle(0xe67e22, 1);
    g.fillRoundedRect(4, 4, 40, 12, 4);
    g.fillStyle(0x95a5a6, 1);
    g.fillTriangle(14, 16, 34, 16, 24, 46);
    g.lineStyle(3, 0x6e7b7b, 1);
    g.lineBetween(17, 24, 31, 24);
    g.lineBetween(20, 32, 28, 32);
    g.lineBetween(22, 39, 26, 39);
    g.generateTexture('b_drill', 48, 48);
    g.clear();

    // Фабрика: корпус с трубами и окнами
    g.fillStyle(UI_COLOR.GRAY, 1);
    g.fillRect(4, 24, 40, 20);
    g.fillRect(8, 12, 7, 12);
    g.fillRect(20, 8, 7, 16);
    g.fillRect(33, 12, 7, 12);
    g.fillStyle(0xbdc3c7, 0.7);
    g.fillCircle(11, 8, 3);
    g.fillCircle(24, 4, 3);
    g.fillStyle(UI_COLOR.GOLD, 1);
    g.fillRect(10, 32, 6, 6);
    g.fillRect(21, 32, 6, 6);
    g.fillRect(32, 32, 6, 6);
    g.generateTexture('b_factory', 48, 48);
    g.clear();

    // Поезд руды: паровоз с колесами
    g.fillStyle(UI_COLOR.BTN_BLUE, 1);
    g.fillRoundedRect(4, 14, 30, 20, 4);
    g.fillStyle(0x1a5276, 1);
    g.fillRect(30, 6, 12, 20);
    g.fillStyle(UI_COLOR.GRAY, 1);
    g.fillRect(7, 8, 6, 8);
    g.fillStyle(UI_COLOR.GOLD, 1);
    g.fillRect(32, 8, 8, 6);
    g.fillStyle(UI_COLOR.STEEL, 1);
    g.fillCircle(12, 38, 5);
    g.fillCircle(26, 38, 5);
    g.fillCircle(38, 38, 5);
    g.fillStyle(UI_COLOR.ROW, 1);
    g.fillTriangle(4, 34, 4, 44, 14, 34);
    g.generateTexture('b_train', 48, 48);
    g.clear();

    // Квант-луч: золотая молния
    const bolt = [
      new Phaser.Math.Vector2(30, 2), new Phaser.Math.Vector2(14, 26),
      new Phaser.Math.Vector2(23, 26), new Phaser.Math.Vector2(17, 46),
      new Phaser.Math.Vector2(36, 20), new Phaser.Math.Vector2(27, 20)
    ];
    g.fillStyle(UI_COLOR.GOLD, 1);
    g.fillPoints(bolt, true);
    g.lineStyle(2, UI_COLOR.GOLD_EDGE, 1);
    g.strokePoints(bolt, true);
    g.generateTexture('b_laser', 48, 48);
    g.clear();
  }

  // Фоновые всплывающие пылинки для глубины сцены
  private createAmbientParticles(): void {
    this.ambientMotes = this.add.particles(0, 0, 'p_mote', {
      x: { min: 0, max: CANVAS_W },
      y: { min: CANVAS_H + 20, max: CANVAS_H + 80 },
      speedX: { min: -15, max: 15 },
      speedY: { min: -60, max: -25 },
      lifespan: { min: 14000, max: 22000 },
      alpha: { start: 0.35, end: 0 },
      scale: { min: 0.4, max: 1.0 },
      frequency: 450,
      maxParticles: 40,
      emitting: this.state.settings?.particles ?? true
    });
  }

  // --- 1. АУДИО ---
  private setupAudio(): void {
    this.sound.volume = (this.state.settings?.volume ?? 70) / 100;

    if (this.cache.audio.exists('click') && !this.clickSound) {
      this.clickSound = this.sound.add('click');
    }

    if (this.cache.audio.exists('bgm') && !this.bgMusic) {
      this.bgMusic = this.sound.add('bgm', { loop: true, volume: 0.3 });
      if (this.sound.locked) {
        this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.bgMusic?.play());
      } else {
        this.bgMusic.play();
      }
    }
  }

  private playClickSound(): void {
    if (!this.clickSound || this.sound.mute) return;
    if (this.clickSound.isPlaying) this.clickSound.stop();
    this.clickSound.play({ volume: 0.5, detune: Phaser.Math.Between(-150, 150) });
  }

  // Музыка босфайта: boss.mp3 (ленивая загрузка — файл опциональный),
  // а без файла — та же bgm, разогнанная и выше по тону
  private startBossMusic(): void {
    if (this.sound.mute) return;
    this.bossFightActive = true;
    if (!this.bossMusicChecked) {
      this.bossMusicChecked = true;
      fetch('assets/boss.mp3')
        .then(r => {
          // vite/SPA-фолбэк может отдать index.html с 200 — проверяем тип контента
          if (!r.ok || (r.headers.get('content-type') || '').includes('text/html')) return;
          this.load.audio('boss', 'assets/boss.mp3');
          this.load.once('complete', () => {
            if (!this.cache.audio.exists('boss') || !this.bossFightActive) return;
            this.bgMusic?.pause();
            this.bossMusic = this.sound.add('boss', { loop: true, volume: 0.45 });
            this.bossMusic.play();
          });
          this.load.start();
        })
        .catch(() => { /* нет файла — работает разогнанный bgm */ });
    }
    if (this.cache.audio.exists('boss')) {
      this.bgMusic?.pause();
      if (!this.bossMusic) this.bossMusic = this.sound.add('boss', { loop: true, volume: 0.45 });
      if (!this.bossMusic.isPlaying) this.bossMusic.play();
    } else if (this.bgMusic) {
      const w = this.bgMusic as Phaser.Sound.WebAudioSound;
      w.setRate?.(1.18);
      w.setDetune?.(250);
      if (!this.bgMusic.isPlaying) this.bgMusic.play();
    }
  }

  private stopBossMusic(): void {
    this.bossFightActive = false;
    if (this.bossMusic?.isPlaying) this.bossMusic.stop();
    const w = this.bgMusic as Phaser.Sound.WebAudioSound | undefined;
    w?.setRate?.(1);
    w?.setDetune?.(0);
    if (this.bgMusic && !this.bgMusic.isPlaying) this.bgMusic.resume();
  }

  // Процедурные SFX босфайта через WebAudio — файлы не нужны
  private bossSfx(kind: 'hit' | 'weak' | 'parry' | 'hurt' | 'shield' | 'win' | 'lose'): void {
    if (this.sound.mute) return;
    const ctx = (this.sound as unknown as { context?: AudioContext }).context;
    if (!ctx) return;
    const vol = ((this.state.settings?.volume ?? 70) / 100) * 0.5;
    const tone = (type: OscillatorType, f0: number, f1: number, dur: number, gain: number, when = 0) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t0 = ctx.currentTime + when;
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      g.gain.setValueAtTime(gain * vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };
    switch (kind) {
      case 'hit':    tone('square', 140 + Math.random() * 50, 70, 0.08, 0.1); break;
      case 'weak':   tone('triangle', 900, 400, 0.09, 0.16); break;
      case 'parry':  tone('triangle', 700, 1700, 0.14, 0.2); break;
      case 'shield': tone('triangle', 1300, 800, 0.09, 0.08); break;
      case 'hurt':   tone('sawtooth', 220, 60, 0.3, 0.22); tone('square', 110, 45, 0.3, 0.1); break;
      case 'win':    [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.16, 0.16, i * 0.09)); break;
      case 'lose':   [330, 262, 196, 131].forEach((f, i) => tone('sawtooth', f, f * 0.92, 0.24, 0.13, i * 0.11)); break;
    }
  }

  private menuPanel?: Phaser.GameObjects.Container;
  private menuBlocker?: Phaser.GameObjects.Rectangle;

  private createMuteButton(): void {
    // Бургер-меню ☰: все утилиты под одной кнопкой в правом верхнем углу шапки
    const burger = this.add.rectangle(672, 44, 55, 55, UI_COLOR.HEADER, 0.8)
      .setStrokeStyle(2, UI_COLOR.BORDER)
      .setInteractive({ useHandCursor: true });
    this.add.text(672, 44, '☰', { fontSize: '28px' }).setOrigin(0.5);
    burger.on('pointerdown', () => {
      this.playClickSound();
      this.toggleMenu();
    });
  }

  private closeMenu(): void {
    this.menuPanel?.destroy();
    this.menuPanel = undefined;
    this.menuBlocker?.destroy();
    this.menuBlocker = undefined;
  }

  private toggleMenu(): void {
    if (this.menuPanel) { this.closeMenu(); return; }

    const openAnd = (fn: () => void) => () => { this.closeMenu(); fn(); };
    const items: { icon: string; label: string; act: () => void }[] = [
      { icon: '💠', label: t('menu.bonuses'),       act: openAnd(() => this.showBonusesModal()) },
      { icon: '📊', label: t('menu.multipliers'),   act: openAnd(() => this.showMultipliersModal()) },
      { icon: '🏆', label: t('menu.achievements'),  act: openAnd(() => this.showAchievementsModal()) },
      { icon: '🔮', label: t('menu.essence'),       act: openAnd(() => this.showEssenceModal()) },
      { icon: '🎨', label: t('menu.skins'),         act: openAnd(() => this.showSkinsModal()) },
      { icon: '👔', label: t('menu.managers'),      act: openAnd(() => this.showManagersModal()) },
      {
        icon: this.isMuted ? '🔇' : '🔊', label: t('menu.sound'), act: () => {
          this.isMuted = !this.isMuted;
          this.sound.mute = this.isMuted;
          this.closeMenu();
        }
      },
      ...(this.sdk.capabilities.leaderboard ? [{ icon: '📈', label: t('menu.leaderboard'),   act: openAnd(() => this.openLeaderboard()) }] : []),
      ...(this.sdk.capabilities.payments ? [{ icon: '🛒', label: t('menu.shop'),          act: openAnd(() => this.showShopModal()) }] : []),
      { icon: '📢', label: t('menu.share'),         act: openAnd(() => this.handleShare()) },
      // Виден только гостю — путь войти после «Больше не показывать»
      ...(this.sdk.isGuest() && this.sdk.authProviderName ? [{ icon: '👤', label: tt(`Войти в ${L(this.sdk.authProviderName)}`, `Sign in with ${L(this.sdk.authProviderName)}`), act: () => { this.closeMenu(); this.showAuthPrompt(); } }] : []),
      ...(this.sdk.capabilities.shortcut ? [{ icon: '📱', label: this.sdk.shortcutLabel ? L(this.sdk.shortcutLabel) : t('menu.shortcut'), act: () => { this.closeMenu(); this.sdk.promptShortcut(); } }] : []),
      { icon: '⚙️', label: t('menu.settings'),      act: openAnd(() => this.showSettingsModal()) },
      { icon: '❓', label: t('menu.help'),          act: openAnd(() => this.showHelpModal()) },
      {
        icon: '🗑️', label: t('menu.reset'), act: openAnd(async () => {
          if (window.confirm(tt('Сбросить весь прогресс?', 'Reset all progress?'))) {
            this.saveSuppressed = true; // иначе автосейв при reload вернёт старый state обратно
            await this.sdk.resetData();
            window.location.reload();
          }
        })
      },
    ];

    // Невидимый блокер под панелью: тап вне меню закрывает его
    this.menuBlocker = this.add.rectangle(CX, 640, 720, 1280, 0x000000, 0.001)
      .setDepth(29)
      .setInteractive();
    this.menuBlocker.on('pointerdown', () => this.closeMenu());

    const rowH = 52, w = 270, h = items.length * rowH + 14;
    const c = this.add.container(565, 132 + h / 2).setDepth(30);
    c.add(this.add.rectangle(0, 0, w, h, UI_COLOR.PANEL_DARK, 0.97).setStrokeStyle(2, UI_COLOR.BORDER));
    items.forEach((it, i) => {
      const y = -h / 2 + 8 + rowH / 2 + i * rowH;
      const row = this.add.rectangle(0, y, w - 12, rowH - 6, UI_COLOR.ROW).setInteractive({ useHandCursor: true });
      const ic = this.add.text(-w / 2 + 16, y, it.icon, { fontSize: '20px' }).setOrigin(0, 0.5);
      const lb = this.add.text(-w / 2 + 52, y, it.label, { fontSize: '17px', color: '#ecf0f1' }).setOrigin(0, 0.5);
      row.on('pointerdown', it.act);
      c.add([row, ic, lb]);
    });
    this.menuPanel = c;
  }

  // --- 2. ШАПКА ---
  private createHeader(): void {
    this.add.rectangle(CX, 72, 680, 112, UI_COLOR.HEADER, 0.85).setStrokeStyle(2, UI_COLOR.BORDER);

    this.coinsText = this.add.text(CX, 55, `💰 0`, {
      fontSize: '44px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.cpsText = this.add.text(CX, 100, `+0${tt('/сек', '/s')}`, {
      fontSize: '20px',
      color: '#8c98a4'
    }).setOrigin(0.5);

    // Счётчик эссенции — справа в шапке
    this.essenceText = this.add.text(665, 100, '', {
      fontSize: '16px',
      color: '#bb8fd0',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    this.boostTimerText = this.add.text(CX, 150, '', {
      fontSize: '18px',
      color: '#e67e22',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 700, useAdvancedWrap: true }
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

    // Подсказка под статус-строкой: что даёт каждый активный модификатор
    const tip = this.add.container(CX, 196).setVisible(false).setDepth(35);
    this.statusTipBg = this.add.rectangle(0, 0, 10, 10, UI_COLOR.PANEL_DARK, 0.95)
      .setStrokeStyle(1, UI_COLOR.BORDER);
    this.statusTipText = this.add.text(0, 0, '', {
      fontSize: '15px', color: '#dfe6e9', align: 'center'
    }).setOrigin(0.5);
    tip.add([this.statusTipBg, this.statusTipText]);
    this.statusTip = tip;

    this.boostTimerText.on('pointerover', () => {
      if (this.statusHints.length === 0 || !this.statusTip) return;
      this.statusTipText.setText(this.statusHints.join('\n'));
      const b = this.statusTipText.getBounds();
      this.statusTipBg.setSize(b.width + 28, b.height + 16);
      this.statusTip.setVisible(true);
    });
    this.boostTimerText.on('pointerout', () => this.statusTip?.setVisible(false));
  }

  // --- 3. ЦЕНТРАЛЬНЫЙ КЛИКЕР С ЭВОЛЮЦИЕЙ ---
  private createMainClicker(): void {
    const centerX = 360;
    const centerY = 395;

    this.coinGlow = this.add.circle(centerX, centerY, 150, UI_COLOR.GOLD_EDGE, 0.18);

    this.coinButton = this.add.image(centerX, centerY, 'gem_0');
    this.coinButton.setInteractive({
      hitArea: new Phaser.Geom.Circle(150, 150, 140),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true
    });

    // Фонтаны частиц: золотые монетки + осколки цвета текущего ранга
    this.coinBurst = this.add.particles(0, 0, 'p_coin', {
      speed: { min: 140, max: 340 },
      angle: { min: 200, max: 340 },
      gravityY: 700,
      lifespan: 750,
      scale: { start: 1, end: 0.1 },
      rotate: { min: 0, max: 360 },
      emitting: false
    });

    this.shardBursts = CRYSTAL_TIERS.map((_, i) =>
      this.add.particles(0, 0, `p_shard_${i}`, {
        speed: { min: 200, max: 420 },
        angle: { min: 190, max: 350 },
        gravityY: 550,
        lifespan: 650,
        scale: { start: 1, end: 0.2 },
        rotate: { min: -180, max: 180 },
        emitting: false
      })
    );

    // Название текущего ранга кристалла
    this.crystalTitleText = this.add.text(centerX, 215, '', {
      fontSize: '19px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Индикатор комбо-тапов справа от кристалла
    this.comboText = this.add.text(688, 365, '', {
      fontSize: '20px',
      color: '#ff7675',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    // Скорость тапов под индикатором комбо
    this.tapCpsText = this.add.text(688, 391, '', {
      fontSize: '15px',
      color: '#8c98a4'
    }).setOrigin(1, 0.5);

    // Кнопка колеса фортуны справа под счётчиками — медленно крутится
    this.wheelBtn = this.add.container(650, 470);
    const miniWheel = this.add.graphics();
    const seg = Math.PI * 2 / 8;
    for (let i = 0; i < 8; i++) {
      miniWheel.fillStyle(i % 2 === 0 ? 0xf39c12 : 0x8e44ad, 1);
      miniWheel.slice(0, 0, 46, i * seg, (i + 1) * seg).fillPath();
    }
    miniWheel.fillStyle(0x2c3e50, 1).fillCircle(0, 0, 14);
    miniWheel.fillStyle(0xf1c40f, 1).fillCircle(0, 0, 9);
    // Указатель сверху — отдельный объект, не крутится с колесом
    const wheelPointer = this.add.graphics()
      .fillStyle(0xecf0f1, 1).fillTriangle(0, -58, -10, -42, 10, -42);
    const wheelLabel = this.add.text(0, 62, tt('🎡 ФОРТУНА', '🎡 FORTUNE'), {
      fontSize: '13px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.wheelBtn.add([miniWheel, wheelPointer, wheelLabel]);
    this.wheelBtn.setSize(110, 130).setInteractive({ useHandCursor: true });
    this.wheelBtn.on('pointerdown', () => { this.playClickSound(); this.showWheelModal(); });
    // Ленивое вращение иконки
    this.tweens.add({ targets: miniWheel, rotation: Math.PI * 2, duration: 9000, repeat: -1 });

    // Мини-карточка ежечасного контракта слева от кристалла
    this.contractPanel = this.add.container(100, 385).setVisible(false);
    const cBg = this.add.rectangle(0, 0, 170, 92, UI_COLOR.PANEL_DARK, 0.9).setStrokeStyle(2, UI_COLOR.GOLD_EDGE);
    const cTitle = this.add.text(0, -30, t('modal.contract'), { fontSize: '14px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    this.contractDescText = this.add.text(0, -8, '', { fontSize: '13px', color: '#ecf0f1' }).setOrigin(0.5);
    this.contractProgressText = this.add.text(0, 12, '', { fontSize: '15px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    this.contractTimerText = this.add.text(0, 32, '', { fontSize: '13px', color: '#8c98a4' }).setOrigin(0.5);
    this.contractPanel.add([cBg, cTitle, this.contractDescText, this.contractProgressText, this.contractTimerText]);

    // Панель мини-игры «Взлом жилы» — скрыта до активации
    this.veinPanel = this.add.container(CX, 600).setVisible(false).setDepth(20);
    const vBg = this.add.rectangle(0, 0, 430, 60, UI_COLOR.PANEL_DARK, 0.95).setStrokeStyle(2, UI_COLOR.GOLD);
    const vTitle = this.add.text(0, -20, tt('⚒️ ВЗЛОМ ЖИЛЫ — ТАПАЙ КРИСТАЛЛ!', '⚒️ VEIN HACK — TAP THE CRYSTAL!'), {
      fontSize: '14px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const vBarBg = this.add.rectangle(-20, 10, 300, 14, UI_COLOR.ROW).setStrokeStyle(1, UI_COLOR.BORDER);
    this.veinBarFill = this.add.rectangle(-170, 10, 0.1, 14, UI_COLOR.GOLD).setOrigin(0, 0.5);
    this.veinInfoText = this.add.text(140, 10, '', { fontSize: '14px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.veinPanel.add([vBg, vTitle, vBarBg, this.veinBarFill, this.veinInfoText]);

    this.coinButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.playClickSound();
      this.advanceTutorial();

      const now = this.time.now;

      // Комбо-тапы: серия быстрых кликов растит множитель
      this.comboCount = now - this.lastClickAt <= BALANCE.COMBO_WINDOW_MS ? this.comboCount + 1 : 0;
      this.lastClickAt = now;

      const botMult = this.detectAutoclicker(pointer, now);

      // Механика Рубина: критический клик; Опал повышает шанс до 10%
      const critChance = (this.state.crystalTier >= TIER.CRIT_CHANCE ? BALANCE.CRIT_CHANCE_OPAL : BALANCE.CRIT_CHANCE)
        + BALANCE.ESSENCE_CRIT_STEP * this.getEssenceLvl('crit')
        + BALANCE.CHOICE_CRIT * this.countChoice('crit');
      const isCrit = this.state.crystalTier >= TIER.CRIT && Math.random() < critChance;
      let earned = Math.max(1, Math.round(this.getClickPower() * this.boostMultiplier * this.getComboMult() * this.getFrenzyMult() * this.getClickIncomeMult() * (isCrit ? BALANCE.CRIT_MULT : 1) * botMult));
      // Волна осколков: +50% к каждому тапу
      if (this.shardWaveLeft > 0) earned += Math.max(1, Math.round(earned * BALANCE.SHARD_WAVE_BONUS));
      // Челлендж «Взлом жилы» засчитывает тапы
      if (this.veinLeft > 0) this.veinTaps++;
      this.state.coins += earned;
      this.state.stats.totalClicks += 1;
      this.state.stats.totalCoinsEarned += earned;
      navigator.vibrate?.(BALANCE.HAPTIC_MS);
      this.updateUI();

      // Мгновенное сжатие и пружинящий возврат к 1 — без дрейфа масштаба при быстрых кликах
      this.coinButton.setScale(0.9);
      this.coinGlow.setScale(0.9);
      this.tweens.add({
        targets: [this.coinButton, this.coinGlow],
        scaleX: 1,
        scaleY: 1,
        duration: 140,
        ease: 'Back.easeOut'
      });

      const tierIdx = Math.min(this.state.crystalTier, CRYSTAL_TIERS.length - 1);
      if (this.state.settings.particles) {
        this.coinBurst.explode(12, pointer.x, pointer.y);
        this.shardBursts[tierIdx].explode(this.shardWaveLeft > 0 ? 16 : 7, pointer.x, pointer.y);
      }

      this.spawnFloatingText(pointer.x, pointer.y, isCrit ? `💥 +${this.formatNum(earned)}` : `+${this.formatNum(earned)}`);
      this.spawnCoinFly(pointer.x, pointer.y);
    });
  }

  // Анти-автокликер: возвращает множитель награды (1 = чисто, PENALTY_MULT = бот)
  private detectAutoclicker(pointer: Phaser.Input.Pointer, now: number): number {
    this.clickTimes.push(now);
    this.clickPoints.push(new Phaser.Math.Vector2(pointer.x, pointer.y));
    if (this.clickTimes.length > ANTICLICK.HISTORY) {
      this.clickTimes.shift();
      this.clickPoints.shift();
    }

    // 1) Сверхчеловеческая частота кликов
    const cps = this.clickTimes.filter(t => now - t < 1000).length;
    let bot = cps > ANTICLICK.MAX_CPS;

    // 2) Роботизированные клики: ровные интервалы + одна точка
    if (!bot && this.clickTimes.length >= ANTICLICK.WINDOW) {
      const times = this.clickTimes.slice(-ANTICLICK.WINDOW);
      const points = this.clickPoints.slice(-ANTICLICK.WINDOW);
      const intervals = times.slice(1).map((t, i) => t - times[i]);
      const mean = intervals.reduce((a, v) => a + v, 0) / intervals.length;
      const stdev = Math.sqrt(intervals.reduce((a, v) => a + (v - mean) ** 2, 0) / intervals.length);
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const spread = Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys);
      bot = stdev < ANTICLICK.INTERVAL_STDEV_MS && spread < ANTICLICK.POSITION_SPREAD_PX;
    }

    if (bot) {
      const wasCalm = this.suspectUntil <= now;
      this.suspectUntil = now + ANTICLICK.PENALTY_SECONDS * 1000;
      if (wasCalm) {
        this.spawnFloatingText(CX, 235, tt('🤖 Автокликер? Награды −90%!', '🤖 Autoclicker? Rewards −90%!'), false, true);
      }
    }

    return now < this.suspectUntil ? ANTICLICK.PENALTY_MULT : 1;
  }

  // Обновление внешнего вида кристалла по рангу
  private updateCrystalVisuals(): void {
    const tierIdx = Math.min(this.state.crystalTier, CRYSTAL_TIERS.length - 1);
    const tier = CRYSTAL_TIERS[tierIdx];

    const mechTag = L(tier.mech) ? ` — ${L(tier.mech)}` : '';
    this.crystalTitleText.setText(`✨ ${tt('Ранг', 'Rank')} ${tierIdx + 1} ${L(tier.name)}${mechTag}`);

    this.coinButton.setTexture(`gem_${tierIdx}`);

    // Скин: тонировка спрайта + цвет/сила свечения
    const skin = SKINS.find(s => s.id === this.state.activeSkin) || SKINS[0];
    if (skin.tint !== UI_COLOR.WHITE) {
      this.coinButton.setTint(skin.tint);
    } else {
      this.coinButton.clearTint();
    }
    this.coinGlow.setFillStyle(skin.color !== 0 ? skin.color : tier.glowColor, skin.glowAlpha);
  }

  private floatUntil = 0; // до этого времени слоты мелких всплывашек заняты
  private floatSlot = 0;
  private lingerCount = 0; // живые linger-баннеры — раскладываем, пока не растают

  private spawnFloatingText(x: number, y: number, text: string, small = false, linger = false): void {
    const randomOffset = Phaser.Math.Between(-25, 25);
    let dy = 0;
    if (linger) {
      // Баннер живёт ~2.3с — пока предыдущий на экране, следующий уходит ниже
      dy = this.lingerCount * 44;
      this.lingerCount = Math.min(this.lingerCount + 1, 4);
      this.time.delayedCall(2350, () => { this.lingerCount = Math.max(0, this.lingerCount - 1); });
    } else {
      // Мелкие числа — слот только при почти одновременном спавне
      const now = this.time.now;
      this.floatSlot = now < this.floatUntil ? Math.min(this.floatSlot + 1, 4) : 0;
      this.floatUntil = now + 600;
      dy = this.floatSlot * 30;
    }
    const floatText = this.add.text(x + randomOffset, y - 20 + dy, text, {
      fontSize: small ? '18px' : '28px',
      color: small ? '#f1c40f' : (this.boostMultiplier > 1 ? '#e67e22' : '#ffffff'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (linger) {
      // Информативный текст: подъём быстрый, потом держится ~1.8 с и тает
      this.tweens.add({
        targets: floatText,
        y: y - 80 + dy,
        duration: 700,
        ease: 'Cubic.easeOut'
      });
      this.tweens.add({
        targets: floatText,
        alpha: 0,
        delay: 1800,
        duration: 500,
        onComplete: () => floatText.destroy()
      });
    } else {
      // Числа за клики и пассивный доход — короткая жизнь, чтобы не было каши
      this.tweens.add({
        targets: floatText,
        y: y - 80 + dy,
        alpha: 0,
        duration: 650,
        ease: 'Cubic.easeOut',
        onComplete: () => floatText.destroy()
      });
    }
  }

  // Монетка, долетающая от клика до счётчика в шапке
  private spawnCoinFly(x: number, y: number): void {
    if (this.activeCoinFlies >= BALANCE.COIN_FLY_MAX) return;
    this.activeCoinFlies++;

    const coin = this.add.image(x, y, 'p_coin').setScale(1.2);
    this.tweens.add({
      targets: coin,
      x: 360,
      y: 62,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        coin.destroy();
        this.activeCoinFlies--;
        this.coinsText.setScale(1.12);
        this.tweens.add({
          targets: this.coinsText,
          scaleX: 1,
          scaleY: 1,
          duration: 140,
          ease: 'Quad.easeOut'
        });
      }
    });
  }

  // --- 4. СПИСОК ПРЕДПРИЯТИЙ ---
  private createUpgradesList(): void {
    // Контейнеры вкладок: дети хранят абсолютные координаты, контейнер в (0,0)
    this.tabBuildings = this.add.container(0, 0);
    this.tabUpgrades = this.add.container(0, 0);
    this.tabPrestige = this.add.container(0, 0);

    // --- Вкладка «Прокачка» ---
    this.createClickUpgradeRow(360, 905, this.tabUpgrades);
    this.createPickaxeRow(360, 980, this.tabUpgrades);

    // Две rewarded-кнопки в один ряд: буст дохода и досрочный сундук
    const adY = 1070;
    const adBtn = this.add.rectangle(200, adY, 315, 65, UI_COLOR.BTN_GREEN)
      .setStrokeStyle(2, UI_COLOR.GREEN_EDGE)
      .setInteractive({ useHandCursor: true });

    const adBtnText = this.add.text(200, adY, tt('🎬 Х2 Доход 60 сек', '🎬 ×2 Income 60s'), {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    adBtn.on('pointerdown', () => this.handleBoostAd());

    const chestBtn = this.add.rectangle(520, adY, 315, 65, 0xd4880e)
      .setStrokeStyle(2, UI_COLOR.GOLD)
      .setInteractive({ useHandCursor: true });

    const chestBtnText = this.add.text(520, adY, tt('🎬 +Сундук сейчас', '🎬 +Chest now'), {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    chestBtn.on('pointerdown', () => this.handleChestAd());
    this.tabUpgrades.add([adBtn, adBtnText, chestBtn, chestBtnText]);

    // --- Вкладка «Здания» ---
    this.buildingDividerText = this.add.text(CX, 862, '', {
      fontSize: '16px',
      color: '#7f8c8d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tabBuildings.add(this.buildingDividerText);

    let startY = 905;
    const rowHeight = 66;

    for (const b of BUILDINGS) {
      this.createBuildingRow(360, startY, b, this.tabBuildings);
      startY += rowHeight;
    }
  }

  private createClickUpgradeRow(x: number, y: number, parent: Phaser.GameObjects.Container): void {
    parent.add(this.add.rectangle(x, y, 640, 56, UI_COLOR.ROW).setStrokeStyle(1, UI_COLOR.STEEL));

    this.clickUpgradeInfoText = this.add.text(x - 300, y - 12, '', {
      fontSize: '17px',
      color: '#ecf0f1'
    }).setOrigin(0, 0.5);

    this.clickUpgradeInfoText2 = this.add.text(x - 300, y + 14, '', {
      fontSize: '14px',
      color: '#8c98a4'
    }).setOrigin(0, 0.5);

    this.clickUpgradeBtn = this.add.rectangle(x + 230, y, 140, 42, UI_COLOR.BTN_BLUE)
      .setInteractive({ useHandCursor: true });

    this.clickUpgradeCostText = this.add.text(x + 230, y, '', {
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    parent.add([this.clickUpgradeInfoText, this.clickUpgradeInfoText2, this.clickUpgradeBtn, this.clickUpgradeCostText]);

    // Тап = +1 уровень; удержание ≥400 мс = прокачать на все деньги
    this.attachHoldToBuyMax(this.clickUpgradeBtn, x + 230, y,
      () => this.buyClickUpgrade(),
      () => this.buyClickUpgradeMax(),
      [this.clickUpgradeBtn, this.clickUpgradeCostText]);
  }

  // Пружинная анимация кнопки при покупке
  private popUpgrade(objects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[]): void {
    objects.forEach(o => o.setScale(1.12));
    this.tweens.add({ targets: objects, scaleX: 1, scaleY: 1, duration: 160, ease: 'Quad.easeOut' });
  }

  // Тап = одна покупка; удержание ≥400 мс = скупить максимум (общий хелпер для прокачек)
  private attachHoldToBuyMax(
    btn: Phaser.GameObjects.Rectangle, x: number, y: number,
    buyOne: () => void, buyMax: () => number,
    popTargets: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[]
  ): void {
    let holdTimer: Phaser.Time.TimerEvent | undefined;
    btn.on('pointerdown', () => {
      buyOne();
      holdTimer = this.time.delayedCall(400, () => {
        const bought = buyMax();
        if (bought > 0) {
          this.playClickSound();
          this.spawnFloatingText(x, y - 40, `+${bought} ${tt('ур', 'lvl')}`, true);
          this.popUpgrade(popTargets);
          this.updateUI();
          this.sdk.saveData(this.state);
        }
      });
    });
    const cancelHold = () => { holdTimer?.remove(false); holdTimer = undefined; };
    btn.on('pointerup', cancelHold);
    btn.on('pointerout', cancelHold);
  }

  private buyClickUpgrade(): void {
    const cost = this.getClickUpgradeCost();
    if (this.state.coins < cost) return;
    this.playClickSound();
    this.state.coins -= cost;
    this.state.clickLevel += 1;
    // Дар Мощи усиливает каждый уровень кирки: +1 + clickBonus за уровень (ретроактивно)
    this.state.clickPower = this.state.clickLevel * (1 + this.state.perks.clickBonus);
    this.popUpgrade([this.clickUpgradeBtn, this.clickUpgradeCostText]);
    this.updateUI();
    this.sdk.saveData(this.state);
  }

  private buyClickUpgradeMax(): number {
    let bought = 0;
    while (bought < 500) {
      const cost = this.getClickUpgradeCost();
      if (this.state.coins < cost) break;
      this.state.coins -= cost;
      this.state.clickLevel += 1;
      bought++;
    }
    this.state.clickPower = this.state.clickLevel * (1 + this.state.perks.clickBonus);
    return bought;
  }

  // Параллельная прокачка: Легендарная кирка — +25% к силе клика за уровень
  private createPickaxeRow(x: number, y: number, parent: Phaser.GameObjects.Container): void {
    parent.add(this.add.rectangle(x, y, 640, 56, 0x3d2c1e).setStrokeStyle(1, 0xd4ac0d));

    this.pickaxeInfoText = this.add.text(x - 300, y, '', {
      fontSize: '18px',
      color: '#f7dc6f'
    }).setOrigin(0, 0.5);

    this.pickaxeUpgradeBtn = this.add.rectangle(x + 230, y, 140, 42, 0xb7950b)
      .setInteractive({ useHandCursor: true });

    this.pickaxeUpgradeCostText = this.add.text(x + 230, y, '', {
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    parent.add([this.pickaxeInfoText, this.pickaxeUpgradeBtn, this.pickaxeUpgradeCostText]);

    // Тап = +1 уровень; удержание ≥400 мс = прокачать на все деньги
    this.attachHoldToBuyMax(this.pickaxeUpgradeBtn, x + 230, y,
      () => this.buyPickaxe(),
      () => this.buyPickaxeMax(),
      [this.pickaxeUpgradeBtn, this.pickaxeUpgradeCostText]);
  }

  private buyPickaxe(): void {
    const cost = this.getPickaxeUpgradeCost();
    if (this.state.coins < cost) return;
    this.playClickSound();
    this.state.coins -= cost;
    this.state.pickaxeLevel += 1;
    this.popUpgrade([this.pickaxeUpgradeBtn, this.pickaxeUpgradeCostText]);
    this.updateUI();
    this.sdk.saveData(this.state);
  }

  private buyPickaxeMax(): number {
    let bought = 0;
    while (bought < 500) {
      const cost = this.getPickaxeUpgradeCost();
      if (this.state.coins < cost) break;
      this.state.coins -= cost;
      this.state.pickaxeLevel += 1;
      bought++;
    }
    return bought;
  }

  private createBuildingRow(x: number, y: number, b: BuildingDef, parent: Phaser.GameObjects.Container): void {
    const rowBg = this.add.rectangle(x, y, 640, 58, UI_COLOR.PANEL).setStrokeStyle(1, UI_COLOR.BORDER);

    const icon = this.add.image(x - 296, y, `b_${b.id}`).setOrigin(0, 0.5).setDisplaySize(40, 40);

    // Две строки: название+количество сверху, доход снизу — текст не залезает на кнопку
    const nameText = this.add.text(x - 248, y - 12, '', {
      fontSize: '17px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const prodText = this.add.text(x - 248, y + 13, '', {
      fontSize: '14px',
      color: '#8c98a4'
    }).setOrigin(0, 0.5);

    const btn = this.add.rectangle(x + 230, y, 140, 42, UI_COLOR.BTN_BLUE)
      .setInteractive({ useHandCursor: true });

    const costText = this.add.text(x + 230, y, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.buildingUI.set(b.id, { nameText, prodText, costText, btn, icon });
    parent.add([rowBg, icon, nameText, prodText, btn, costText]);

    // Тап = одна покупка; удержание ≥400 мс = купить максимум
    let holdTimer: Phaser.Time.TimerEvent | undefined;
    btn.on('pointerdown', () => {
      this.buyBuilding(b, icon, x + 230, y);
      holdTimer = this.time.delayedCall(400, () => {
        const bought = this.buyBuildingMax(b);
        if (bought > 0) {
          this.playClickSound();
          this.spawnFloatingText(x + 230, y - 40, `+${bought} ${tt('шт', 'pcs')}`, true);
          const baseScale = 40 / 48;
          icon.setScale(baseScale * 1.35);
          this.tweens.add({ targets: icon, scaleX: baseScale, scaleY: baseScale, duration: 180, ease: 'Back.easeOut' });
          if (this.state.settings.particles) this.coinBurst.explode(14, x + 230, y);
          this.updateUI();
          this.sdk.saveData(this.state);
        }
      });
    });
    const cancelHold = () => { holdTimer?.remove(false); holdTimer = undefined; };
    btn.on('pointerup', cancelHold);
    btn.on('pointerout', cancelHold);
  }

  private buyBuilding(b: BuildingDef, icon: Phaser.GameObjects.Image, x: number, y: number): void {
    const cost = this.getBuildingCost(b);
    if (this.state.coins < cost) return;
    this.playClickSound();
    this.state.coins -= cost;
    this.state.buildings[b.id] = (this.state.buildings[b.id] || 0) + 1;
    if (this.tutorialClicks >= 5) this.finishTutorial(); // купил предприятие — онбординг пройден

    // Анимация покупки: подпрыгивание иконки + всплеск монеток
    const baseScale = 40 / 48;
    icon.setScale(baseScale * 1.35);
    this.tweens.add({
      targets: icon,
      scaleX: baseScale,
      scaleY: baseScale,
      duration: 180,
      ease: 'Back.easeOut'
    });
    if (this.state.settings.particles) this.coinBurst.explode(8, x, y);

    this.updateUI();
    this.sdk.saveData(this.state);
  }

  // Купить максимум доступных (удержание кнопки): геометрическая прогрессия цен
  private buyBuildingMax(b: BuildingDef): number {
    let bought = 0;
    while (bought < 500) {
      const cost = this.getBuildingCost(b);
      if (this.state.coins < cost) break;
      this.state.coins -= cost;
      this.state.buildings[b.id] = (this.state.buildings[b.id] || 0) + 1;
      bought++;
    }
    return bought;
  }

  // --- ОНБОРДИНГ: подсказка новичку ---
  private startTutorial(): void {
    if (this.state.tutorialDone) return;
    const c = this.add.container(CX, 575).setDepth(15);
    // Рука прыгает над кристаллом; элементы не интерактивны — тапы проходят в кнопку
    const arrow = this.add.text(0, -180, '👆', { fontSize: '44px' }).setOrigin(0.5);
    this.tutorialText = this.add.text(0, 0, t('tut.tap'), {
      fontSize: '21px', color: '#f1c40f', fontStyle: 'bold', align: 'center',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5);
    c.add([arrow, this.tutorialText]);
    this.tutorialContainer = c;
    this.tweens.add({ targets: arrow, y: -145, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private advanceTutorial(): void {
    if (this.state.tutorialDone) return;
    this.tutorialClicks++;
    // После 5 тапов подсказываем про предприятия
    if (this.tutorialClicks === 5) this.tutorialText?.setText(t('tut.buy'));
    if (this.tutorialClicks >= 20) this.finishTutorial();
  }

  private finishTutorial(): void {
    if (this.state.tutorialDone) return;
    this.state.tutorialDone = true;
    this.tutorialContainer?.destroy();
    this.tutorialContainer = undefined;
    this.tutorialText = undefined;
    this.sdk.saveData(this.state);
    // Финальный тизер: цель игры — бой со стражем
    this.time.delayedCall(1200, () => this.spawnFloatingText(CX, 235,
      tt('🎯 Победи Стража — получишь ранг!', '🎯 Beat the Guardian — earn a rank!'), false, true));
  }

  // --- 5. КНОПКА ЭВОЛЮЦИИ КРИСТАЛЛА (ПРЕСТИЖ) ---
  private createPrestigeButton(): void {
    // Вкладка «Эволюция»: текущий ранг, следующий, кнопка и сводка даров
    this.prestigeInfoText = this.add.text(CX, 880, '', {
      fontSize: '19px', color: '#ecf0f1', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    this.prestigeNextText = this.add.text(CX, 922, '', {
      fontSize: '16px', color: '#bb8fd0', align: 'center'
    }).setOrigin(0.5);

    this.prestigeBtn = this.add.rectangle(CX, 990, 640, 62, UI_COLOR.PURPLE)
      .setStrokeStyle(2, UI_COLOR.PURPLE_EDGE)
      .setInteractive({ useHandCursor: true });

    this.prestigeBtnText = this.add.text(CX, 990, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.prestigePerksText = this.add.text(CX, 1060, '', {
      fontSize: '15px', color: '#8c98a4', align: 'center'
    }).setOrigin(0.5);

    this.tabPrestige.add([this.prestigeInfoText, this.prestigeNextText, this.prestigeBtn, this.prestigeBtnText, this.prestigePerksText]);

    this.prestigeBtn.on('pointerdown', () => {
      const nextTierIdx = this.state.crystalTier + 1;
      if (nextTierIdx >= CRYSTAL_TIERS.length) return;

      const cost = CRYSTAL_TIERS[nextTierIdx].cost;
      // Вход на бой оплачивается один раз: флаг в сейве переживает поражения и ретраи
      const paid = this.state.bossPaidTier === nextTierIdx;
      if (paid || this.state.coins >= cost) {
        if (!paid) {
          this.state.coins -= cost;
          this.state.bossPaidTier = nextTierIdx;
          this.updateUI();
          this.sdk.saveData(this.state);
        }
        this.showBossFight(nextTierIdx);
      }
    });
  }

  // Модальное окно выбора даров перерождения
  private showPrestigeModal(nextTier: CrystalTierDef): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 680, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.PURPLE_EDGE);

    const title = this.add.text(CX, 360, t('modal.prestige'), {
      fontSize: '26px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const mechLine = L(nextTier.mech) ? `\n${tt('🔓 Откроется:', '🔓 Unlocks:')} ${L(nextTier.mech)}` : '';
    const sub = this.add.text(CX, 405, `${tt('Переход на ранг:', 'Advancing to rank:')} ${nextTier.icon} ${L(nextTier.name)}${mechLine}\n${tt('Здания и баланс сбросятся. Выберите постоянный дар:', 'Buildings and balance reset. Choose a permanent gift:')}`, {
      fontSize: '18px',
      color: '#bdc3c7',
      align: 'center'
    }).setOrigin(0.5);

    // Функция завершения эволюции с выбранным даром
    const applyPrestige = (perkType: 'click' | 'income' | 'miners') => {
      this.playClickSound();

      // Начисляем выбранный перк
      if (perkType === 'click') {
        this.state.perks.clickMult = Math.round(((this.state.perks.clickMult || 1) + BALANCE.PERK_CLICK_MULT) * 100) / 100;
      } else if (perkType === 'income') {
        this.state.perks.incomeMultiplier = Math.round((this.state.perks.incomeMultiplier + BALANCE.PERK_INCOME_STEP) * 100) / 100;
      } else if (perkType === 'miners') {
        this.state.perks.buildingDiscount = (this.state.perks.buildingDiscount || 0) + 1;
      }

      // Повышаем ранг кристалла
      this.state.crystalTier += 1;
      this.state.bossPaidTier = -1; // вход на бой поглощён победой

      // Эссенция: +1 за эволюцию, +1 за каждые 5 рангов
      const essGain = BALANCE.ESSENCE_BASE + Math.floor(this.state.crystalTier / BALANCE.ESSENCE_PER_RANKS);
      this.state.essence = (this.state.essence || 0) + essGain;
      this.spawnFloatingText(CX, 230, `+${essGain} 🔮 ${tt('эссенции', 'essence')}`, false, true);

      // Сброс зданий, прокачки и монет (сохраняем стартовых шахтеров)
      this.state.coins = 0;
      this.state.clickLevel = 1;
      this.state.pickaxeLevel = 0;
      this.state.clickPower = this.state.clickLevel * (1 + this.state.perks.clickBonus);
      this.state.buildings = {
        miner: this.state.perks.starterMiners,
        drill: 0,
        factory: 0,
        train: 0,
        laser: 0
      };

      // Закрываем окно
      overlay.destroy();
      modal.destroy();
      title.destroy();
      sub.destroy();
      card1.destroy(); card2.destroy(); card3.destroy();
      cancelBtn.destroy(); cancelText.destroy();

      this.updateCrystalVisuals();
      this.updateUI();
      this.sdk.saveData(this.state);
      this.sdk.submitLeaderboardScore(this.state.crystalTier, this.state.coins);
      this.sdk.trackEvent?.('prestige_win', { tier: this.state.crystalTier });

      // После первой эволюции — предложить оценить игру в каталоге
      if (this.state.crystalTier === 1) this.sdk.requestReview();

      // На рангах с выбором — модалка бонуса сразу после дара,
      // реклама идёт после выбора игрока (внутри pick → adAfter)
      if (RANK_CHOICES[this.state.crystalTier] && !this.state.rankChoices[this.state.crystalTier]) {
        this.showRankChoiceModal(this.state.crystalTier, true);
        return;
      }

      // Межстраничная реклама на переходе ранга — логическая пауза.
      // Первую эволюцию не портим рекламой: там идёт запрос отзыва
      if (this.state.crystalTier > 1) this.tryShowInterstitial();
    };

    // Карточка 1: Дар силы клика (+25%)
    const card1 = this.createPerkCard(360, 490, tt('💥 Дар Мощи', '💥 Gift of Power'), tt('+25% к силе клика навсегда (стекится)', '+25% click power forever (stacks)'), () => applyPrestige('click'));

    // Карточка 2: Дар дохода (+10%)
    const card2 = this.createPerkCard(360, 585, tt('📈 Дар Процветания', '📈 Gift of Prosperity'), tt('+10% ко ВСЕМУ доходу навсегда', '+10% to ALL income forever'), () => applyPrestige('income'));

    // Карточка 3: Дар скидки (−7% к цене зданий)
    const card3 = this.createPerkCard(360, 680, tt('⛏️ Дар Бригады', '⛏️ Gift of the Crew'), tt('-7% к цене предприятий (перемножается)', '-7% building cost (multiplies)'), () => applyPrestige('miners'));

    // Кнопка Отмена
    const cancelBtn = this.add.rectangle(CX, 770, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const cancelText = this.add.text(CX, 770, tt('Назад', 'Back'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

    cancelBtn.on('pointerdown', () => {
      overlay.destroy();
      modal.destroy();
      title.destroy();
      sub.destroy();
      card1.destroy(); card2.destroy(); card3.destroy();
      cancelBtn.destroy(); cancelText.destroy();
    });
  }

  private createPerkCard(x: number, y: number, title: string, desc: string, onClick: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 520, 75, UI_COLOR.ROW)
      .setStrokeStyle(2, 0x3498db)
      .setInteractive({ useHandCursor: true });

    const titleTxt = this.add.text(-230, -14, title, { fontSize: '20px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0, 0.5);
    const descTxt = this.add.text(-230, 14, desc, { fontSize: '16px', color: '#ecf0f1' }).setOrigin(0, 0.5);

    const container = this.add.container(x, y, [bg, titleTxt, descTxt]);
    bg.on('pointerdown', onClick);
    return container;
  }

  // --- БОСФАЙТ: страж ранга перед эволюцией ---
  // Победа → showPrestigeModal (дар + сброс). Поражение → бесплатный рестарт.
  // Урон = прокачанная сила клика + пассив от предприятий → бой проверяет билд.
  private showBossFight(tierIdx: number): void {
    const bossTier = CRYSTAL_TIERS[tierIdx];
    const spec = getBossSpec(tierIdx);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const hud: Phaser.GameObjects.GameObject[] = []; // боевой HUD — затухает при экране исхода
    const timers: Phaser.Time.TimerEvent[] = [];
    const tweens: Phaser.Tweens.Tween[] = [];
    let alive = true;
    let finished = false;
    let shielded = false;
    let raged = false;
    let weakSpot: Phaser.GameObjects.Arc | null = null;
    let weakTween: Phaser.Tweens.Tween | null = null;
    // Активные ⚠-маркеры — чистятся при поражении, чтобы не убили после возрождения
    const activeStrikes: { clear: () => void; boom: Phaser.Time.TimerEvent }[] = [];
    const cleanup = () => {
      alive = false;
      timers.forEach(t => t.remove());
      tweens.forEach(t => t.remove());
      weakTween?.remove();
      objects.forEach(o => { if (o.scene) o.destroy(); });
      this.stopBossMusic();
    };
    this.startBossMusic();

    const overlay = this.add.rectangle(CX, 640, 720, 1280, 0x05070d, 0.94).setInteractive();
    // Каждый 10-й ранг — эпохальный страж: золотой титул
    const isMilestone = (tierIdx + 1) % 10 === 0;
    const title = this.add.text(CX, 325, `${isMilestone ? '👑' : '⚔️'} ${L(spec.title)}: ${bossTier.icon} ${L(bossTier.name)}`, {
      fontSize: '30px', color: isMilestone ? '#f1c40f' : '#ff6b6b', fontStyle: 'bold'
    }).setOrigin(0.5);
    const mechs: string[] = [tt('удары ⚠', 'strikes ⚠')];
    if (spec.shield) mechs.push(tt('щит 🛡', 'shield 🛡'));
    if (spec.weak) mechs.push(tt('точки 🎯 ×3', 'spots 🎯 ×3'));
    if (spec.regen) mechs.push(tt('реген 💚', 'regen 💚'));
    if (spec.armor) mechs.push(tt('броня ⛓ −60% тапам', 'armor ⛓ taps −60%'));
    if (spec.rage) mechs.push(tt('ярость <50% HP 😡', 'rage <50% HP 😡'));
    if (spec.dual) mechs.push(tt('двойные удары ⚠⚠', 'dual strikes ⚠⚠'));
    const sub = this.add.text(CX, 388,
      `⚠️ ${tt('Тапай маркеры — парирование бьёт ×4', 'Tap markers — a parry hits ×4')}\n❤️×${BALANCE.BOSS_LIVES} ${tt('— пропущенный удар забирает жизнь', '— a missed strike costs a life')} • ⏱ ${BALANCE.BOSS_TIME_S}${tt(' с', ' s')}`, {
      fontSize: '17px', color: '#dfe6e9', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);
    const mechTxt = this.add.text(CX, 452, `${tt('Механики босса', 'Boss mechanics')}: ${mechs.join(' • ')}`, {
      fontSize: '15px', color: '#8c98a4'
    }).setOrigin(0.5);
    objects.push(overlay, title, sub, mechTxt);
    hud.push(title, sub, mechTxt);

    // Босс — тёмная версия кристалла следующего ранга.
    // Контейнер: кристалл, свечение, щит и трещины движутся синхронно
    const bossC = this.add.container(CX, 1400);
    const glow = this.add.circle(0, 0, 170, 0xff3355, 0);
    const boss = this.add.image(0, 0, `gem_${tierIdx}`).setDisplaySize(260, 260).setTint(spec.tint);
    // Трещины по фазам HP — в локальных координатах, клеймятся к кристаллу
    const cracks = this.add.graphics();
    bossC.add([glow, boss, cracks]);
    const rageTint = () => (raged ? 0xcc5555 : spec.tint);
    let crackStage = 0;
    objects.push(bossC);
    let canHit = false;

    // Вход: страж влетает снизу и гремит об пол — потом «дышит»
    tweens.push(this.tweens.add({
      targets: bossC, y: 600, duration: 550, ease: 'Cubic.easeOut',
      onComplete: () => {
        if (!alive || finished) return;
        canHit = true;
        boss.setInteractive({ useHandCursor: true });
        this.cameras.main.shake(150, 0.012);
        navigator.vibrate?.(90);
        this.bossSfx('hurt'); // низкий удар приземления
        if (this.state.settings.particles) {
          this.shardBursts[Math.min(tierIdx, CRYSTAL_TIERS.length - 1)].explode(14, CX, 700);
        }
        tweens.push(
          this.tweens.add({ targets: bossC, y: 586, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
          this.tweens.add({ targets: bossC, angle: { from: -2.5, to: 2.5 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
          this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.22 }, scaleX: 1.14, scaleY: 1.14, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
        );
      }
    }));

    // HP = сила клика × ожидаемое число ударов → победим на своём уровне прокачки
    const maxHp = Math.max(1, Math.round(this.getClickPower() * (BALANCE.BOSS_HP_CLICKS + tierIdx * BALANCE.BOSS_HP_PER_TIER) * spec.hpScale));
    let hp = maxHp;
    let lives = BALANCE.BOSS_LIVES;
    let timeLeft = BALANCE.BOSS_TIME_S;
    let lastHitAt = performance.now();

    const hpBg = this.add.rectangle(CX, 790, 560, 26, 0x2c3e50).setStrokeStyle(2, UI_COLOR.BORDER);
    const hpBar = this.add.rectangle(CX - 280, 790, 560, 22, 0xe74c3c).setOrigin(0, 0.5);
    const hpTxt = this.add.text(CX, 790, '', { fontSize: '15px', color: '#fff' }).setOrigin(0.5);
    const heartsTxt = this.add.text(CX, 845, '❤️'.repeat(lives), { fontSize: '26px' }).setOrigin(0.5);
    const timerTxt = this.add.text(CX, 890, '', { fontSize: '22px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    // Твой урон: наглядно, что бой проверяет прокачку
    const tapDmg = this.getClickPower() * this.boostMultiplier * this.getFrenzyMult() * this.getClickIncomeMult();
    const passiveDps = this.getTotalCps() * BALANCE.BOSS_CPS_SHARE;
    const dpsTxt = this.add.text(CX, 935,
      `💥 ${tt('тап', 'tap')} −${this.formatNum(Math.max(1, Math.round(tapDmg)))} • ⛏️ ${tt('шахтёры', 'miners')} −${this.formatNum(Math.max(0, Math.round(passiveDps)))}${tt('/с', '/s')}`, {
      fontSize: '15px', color: '#9fb2c0'
    }).setOrigin(0.5);
    objects.push(hpBg, hpBar, hpTxt, heartsTxt, timerTxt, dpsTxt);
    hud.push(hpBg, hpBar, hpTxt, heartsTxt, timerTxt, dpsTxt);

    const drawHp = () => {
      hpBar.width = Math.max(0.001, 560 * hp / maxHp);
      hpTxt.setText(`${this.formatNum(Math.max(0, hp))} / ${this.formatNum(maxHp)}`);
    };
    drawHp();

    let totalDealt = 0;
    let parries = 0;
    let reviveUsed = false; // rewarded-возрождение — один раз за бой

    // Экран победы: карточка со статистикой боя + кнопка к выбору дара.
    // Боевой HUD затухает — остаётся только чистая панель с итогами
    const showVictoryPanel = () => {
      if (!alive) return;
      // Перфект-бонус: ни одной потерянной жизни → +1 эссенция
      const perfect = lives >= BALANCE.BOSS_LIVES;
      if (perfect) {
        this.state.essence = (this.state.essence || 0) + 1;
        this.updateUI();
      }
      const tUsed = Math.max(1, Math.round(BALANCE.BOSS_TIME_S - timeLeft));
      tweens.push(this.tweens.add({ targets: hud, alpha: 0, duration: 250 }));

      const py = 600, ph = perfect ? 480 : 430;
      const pt = py - ph / 2;
      const panel = this.add.rectangle(CX, py, 600, ph, 0x101726, 0.98).setStrokeStyle(4, 0xf1c40f);
      const cup = this.add.text(CX, pt + 55, '🏆', { fontSize: '72px' }).setOrigin(0.5);
      const vTitle = this.add.text(CX, pt + 125, `${L(spec.title)} ${tt('повержен!', 'defeated!')}`, {
        fontSize: '32px', color: '#2ecc71', fontStyle: 'bold'
      }).setOrigin(0.5);
      const divider = this.add.rectangle(CX, pt + 165, 500, 2, 0x3a4a5f);
      // Статы — сетка 2×2, выровнена по центру карточки
      const stat = (x: number, y: number, s: string) =>
        this.add.text(x, y, s, { fontSize: '20px', color: '#dfe6e9' }).setOrigin(0.5);
      const sxs = [CX - 150, CX + 150];
      const stA = stat(sxs[0], pt + 215, `⏱ ${tt('Время', 'Time')}: ${tUsed}${tt(' с', ' s')}`);
      const stB = stat(sxs[1], pt + 215, `💥 ${tt('Урон', 'Damage')}: ${this.formatNum(totalDealt)}`);
      const stC = stat(sxs[0], pt + 262, `❤️ ${tt('Жизни', 'Lives')}: ${lives}/${BALANCE.BOSS_LIVES}`);
      const stD = stat(sxs[1], pt + 262, `⚔️ ${tt('Париров.', 'Parries')}: ${parries}`);

      // Перфект-баннер — золотая плашка с лёгкой пульсацией
      const perfectObjs: Phaser.GameObjects.GameObject[] = [];
      if (perfect) {
        const band = this.add.rectangle(CX, pt + 318, 500, 48, 0xf1c40f, 0.13).setStrokeStyle(2, 0xf1c40f, 0.55);
        const bandTxt = this.add.text(CX, pt + 318, `🌟 ${tt('ИДЕАЛЬНЫЙ БОЙ!', 'PERFECT FIGHT!')} +1 🔮`, {
          fontSize: '21px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5);
        perfectObjs.push(band, bandTxt);
        tweens.push(this.tweens.add({
          targets: bandTxt, scaleX: { from: 1, to: 1.07 }, scaleY: { from: 1, to: 1.07 },
          duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        }));
      }

      const btnY = py + ph / 2 - 55;
      const nextBtn = this.add.rectangle(CX, btnY, 420, 66, UI_COLOR.BTN_GREEN)
        .setStrokeStyle(3, UI_COLOR.GREEN_EDGE).setInteractive({ useHandCursor: true });
      const nextTxt = this.add.text(CX, btnY, tt('✨ Выбрать дар', '✨ Claim your gift'), {
        fontSize: '22px', color: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5);

      const panelObjs: Phaser.GameObjects.GameObject[] = [panel, cup, vTitle, divider, stA, stB, stC, stD, ...perfectObjs, nextBtn, nextTxt];
      objects.push(...panelObjs);
      tweens.push(this.tweens.add({
        targets: panelObjs,
        scaleX: { from: 0.85, to: 1 }, scaleY: { from: 0.85, to: 1 },
        alpha: { from: 0, to: 1 }, duration: 350, ease: 'Back.easeOut'
      }));
      nextBtn.on('pointerdown', () => {
        cleanup();
        this.showPrestigeModal(bossTier);
      });
    };

    const victory = () => {
      if (finished) return;
      finished = true;
      this.bossSfx('win');
      this.spawnFloatingText(CX, 235, tt('🏆 СТРАЖ ПОВЕРЖЕН!', '🏆 GUARDIAN DOWN!'), false, true);
      this.cameras.main.flash(220, 241, 196, 15);
      this.cameras.main.shake(220, 0.012);
      boss.disableInteractive();
      timers.forEach(t => t.remove()); // механики босса останавливаем, бой кончился
      if (this.state.settings.particles) {
        this.coinBurst.explode(30, CX, 600);
        this.shardBursts[Math.min(tierIdx, CRYSTAL_TIERS.length - 1)].explode(26, CX, 600);
      }
      // Страж раскалывается: сжимается, вращается и гаснет — вместе с трещинами
      tweens.push(this.tweens.add({
        targets: bossC, scaleX: 0, scaleY: 0, alpha: 0, angle: 45,
        duration: 550, ease: 'Back.easeIn'
      }));
      // Небольшая пауза на зрелищность — потом панель победы
      timers.push(this.time.delayedCall(750, showVictoryPanel));
    };

    const defeat = (reason: 'lives' | 'time') => {
      if (finished) return;
      finished = true;
      this.bossSfx('lose');
      boss.disableInteractive();
      pendingMarks = 0; // сбрасываем волну — при возрождении стартуем чисто
      activeStrikes.forEach(s => { s.boom.remove(); s.clear(); });
      activeStrikes.length = 0;
      const loseTxt = this.add.text(CX, 955, reason === 'lives'
        ? tt('💀 Страж оказался сильнее!', '💀 The guardian prevailed!')
        : tt('⏱ Время вышло!', '⏱ Time is up!'), {
        fontSize: '26px', color: '#ff6b6b', fontStyle: 'bold'
      }).setOrigin(0.5);
      const hint = this.add.text(CX, 995, tt('Прокачай кирку и предприятия — попытки бесплатны', 'Upgrade pickaxe and buildings — retries are free'), {
        fontSize: '15px', color: '#8c98a4', align: 'center'
      }).setOrigin(0.5);
      const panel: Phaser.GameObjects.GameObject[] = [loseTxt, hint];
      const retryBtn = this.add.rectangle(CX - 140, 1155, 250, 54, UI_COLOR.BTN_GREEN).setStrokeStyle(3, UI_COLOR.GREEN_EDGE).setInteractive({ useHandCursor: true });
      const retryTxt = this.add.text(CX - 140, 1155, tt('⚔️ Ещё раз', '⚔️ Try again'), { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      const fleeBtn = this.add.rectangle(CX + 140, 1155, 250, 54, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
      const fleeTxt = this.add.text(CX + 140, 1155, tt('Отступить', 'Retreat'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
      panel.push(retryBtn, retryTxt, fleeBtn, fleeTxt);
      retryBtn.on('pointerdown', () => { cleanup(); this.showBossFight(tierIdx); });
      fleeBtn.on('pointerdown', cleanup);

      // Второй шанс за рекламу: +1 жизнь, бой продолжается с того же HP
      if (!reviveUsed) {
        const reviveBtn = this.add.rectangle(CX, 1075, 460, 56, 0xd4880e)
          .setStrokeStyle(3, UI_COLOR.GOLD_EDGE).setInteractive({ useHandCursor: true });
        const reviveTxt = this.add.text(CX, 1075, tt('📺 +1 жизнь за рекламу', '📺 +1 life for an ad'), {
          fontSize: '18px', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        panel.push(reviveBtn, reviveTxt);
        reviveBtn.on('pointerdown', () => {
          this.playClickSound();
          this.runRewarded(() => {
            if (!alive) return;
            reviveUsed = true;
            panel.forEach(o => { if (o.scene) o.destroy(); });
            finished = false;
            lives = 1;
            heartsTxt.setText('❤️' + '🖤'.repeat(BALANCE.BOSS_LIVES - 1));
            boss.setInteractive({ useHandCursor: true });
            this.startBossMusic();
            this.cameras.main.flash(200, 46, 204, 113);
            this.spawnFloatingText(CX, 480, tt('❤️ Второй шанс — добей его!', '❤️ Second chance — finish it!'), false, true);
            scheduleStrike();
          });
        });
      }
      objects.push(...panel);
    };

    const dealDamage = (mult: number, x: number, y: number) => {
      if (!alive || finished) return;
      if (shielded) {
        this.bossSfx('shield');
        this.spawnFloatingText(x, y, tt('🛡 ЩИТ!', '🛡 BLOCKED!'));
        return;
      }
      const critChance = (this.state.crystalTier >= TIER.CRIT_CHANCE ? BALANCE.CRIT_CHANCE_OPAL : BALANCE.CRIT_CHANCE)
        + BALANCE.ESSENCE_CRIT_STEP * this.getEssenceLvl('crit')
        + BALANCE.CHOICE_CRIT * this.countChoice('crit');
      const isCrit = this.state.crystalTier >= TIER.CRIT && Math.random() < critChance;
      const dmg = Math.max(1, Math.round(this.getClickPower() * this.boostMultiplier
        * this.getFrenzyMult() * this.getClickIncomeMult() * mult * (isCrit ? BALANCE.CRIT_MULT : 1)));
      hp -= dmg;
      totalDealt += dmg;
      lastHitAt = performance.now();
      this.spawnFloatingText(x, y, `${isCrit ? '💥 ' : ''}-${this.formatNum(dmg)}`);
      drawHp();
      // Кольцо удара в точке тапа — видно, куда летит каждый клик
      const ring = this.add.circle(x, y, 10, 0xffffff, 0).setStrokeStyle(3, 0xffd166, 0.9);
      objects.push(ring);
      tweens.push(this.tweens.add({
        targets: ring, scaleX: 3.4, scaleY: 3.4, alpha: 0, duration: 260, ease: 'Cubic.easeOut',
        onComplete: () => { if (ring.scene) ring.destroy(); }
      }));
      // фидбек попадания: вспышка босса, микро-тряска камеры, осколки
      boss.setTint(0xffffff);
      this.time.delayedCall(60, () => { if (boss.scene) boss.setTint(rageTint()); });
      this.cameras.main.shake(50, 0.0018);
      if (this.state.settings.particles) {
        this.shardBursts[Math.min(tierIdx, CRYSTAL_TIERS.length - 1)].explode(5, x, y);
      }
      if (hp <= 0) victory();
    };

    boss.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!alive || finished || !canHit) return;
      navigator.vibrate?.(BALANCE.HAPTIC_MS);
      const hitWeak = weakSpot !== null && Phaser.Math.Distance.Between(pointer.x, pointer.y, weakSpot.x, weakSpot.y) <= BALANCE.BOSS_WEAK_RADIUS;
      // Броня Латника: тапы мимо точки режутся до ×0.4
      const mult = hitWeak ? BALANCE.BOSS_WEAK_MULT : (spec.armor ? BALANCE.BOSS_ARMOR_MULT : 1);
      this.bossSfx(hitWeak ? 'weak' : 'hit');
      dealDamage(mult, pointer.x, pointer.y);
      bossC.setScale(0.93);
      this.tweens.add({ targets: bossC, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
    });

    // Удары босса: ⚠-маркер, успей тапнуть — парирование, иначе −1 жизнь.
    // Владыка бьёт парой: два маркера одновременно (pendingMarks — счётчик волны)
    let pendingMarks = 0;
    const markResolved = () => {
      pendingMarks -= 1;
      if (!finished && alive && pendingMarks <= 0) scheduleStrike();
    };
    const spawnStrikeMark = () => {
      const x = CX + Phaser.Math.Between(-115, 115);
      const y = 600 + Phaser.Math.Between(-115, 115);
      const mark = this.add.circle(x, y, 38, 0xe74c3c, 0.85).setStrokeStyle(3, 0xffffff)
        .setInteractive({ useHandCursor: true });
      const markTxt = this.add.text(x, y, '⚠️', { fontSize: '30px' }).setOrigin(0.5);
      // кольцо-таймер сжимается к маркеру — видно, сколько осталось на парирование
      const ring = this.add.circle(x, y, 64, 0xe74c3c, 0).setStrokeStyle(4, 0xffb3ab);
      objects.push(mark, markTxt, ring);
      const ringTween = this.tweens.add({ targets: ring, scaleX: 0.58, scaleY: 0.58, duration: BALANCE.BOSS_STRIKE_MS });
      const pulseTween = this.tweens.add({ targets: mark, alpha: 0.35, duration: 130, yoyo: true, repeat: -1 });
      tweens.push(ringTween, pulseTween);
      const clearMark = () => {
        mark.destroy(); markTxt.destroy(); ring.destroy();
        ringTween.remove(); pulseTween.remove();
      };
      const boom = this.time.delayedCall(BALANCE.BOSS_STRIKE_MS, () => {
        clearMark();
        const bi = activeStrikes.findIndex(s => s.boom === boom);
        if (bi >= 0) activeStrikes.splice(bi, 1);
        if (!alive || finished) return;
        lives -= 1;
        heartsTxt.setText('❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(BALANCE.BOSS_LIVES - Math.max(0, lives)));
        this.cameras.main.flash(180, 231, 76, 60);
        this.cameras.main.shake(160, 0.012);
        navigator.vibrate?.(120);
        this.bossSfx('hurt');
        this.spawnFloatingText(x, y, tt('💔 УДАР!', '💔 HIT!'));
        if (lives <= 0) { defeat('lives'); return; }
        markResolved();
      });
      timers.push(boom);
      activeStrikes.push({ clear: clearMark, boom });
      mark.on('pointerdown', () => {
        boom.remove();
        const pi = activeStrikes.findIndex(s => s.boom === boom);
        if (pi >= 0) activeStrikes.splice(pi, 1);
        const px = mark.x, py = mark.y;
        clearMark();
        parries += 1;
        this.bossSfx('parry');
        this.spawnFloatingText(px, py - 50, tt('ПАРИРОВАНО!', 'PARRIED!'));
        dealDamage(BALANCE.BOSS_PARRY_MULT, px, py);
        markResolved();
      });
    };
    const scheduleStrike = () => {
      if (!alive || finished) return;
      // Ярость Берсерка/Владыки: ниже 50% HP бьёт вдвое чаще
      const rageDiv = spec.rage && hp / maxHp < BALANCE.BOSS_RAGE_HP ? 2 : 1;
      timers.push(this.time.delayedCall(
        ((spec.strikeMin + Math.random() * spec.strikeRnd) / rageDiv) * 1000,
        () => {
          if (!alive || finished) return;
          pendingMarks = spec.dual ? 2 : 1;
          for (let i = 0; i < pendingMarks; i++) spawnStrikeMark();
        }));
    };
    scheduleStrike();

    // Щит: 3с неуязвимости, затем ~9с окна для урона — цикл по-настоящему
    if (spec.shield) {
      const cycle = () => {
        if (!alive || finished) return;
        shielded = true;
        const shieldObj = this.add.circle(0, 0, 178, 0x3498db, 0.18).setStrokeStyle(4, 0x85c1e9);
        bossC.add(shieldObj); // щит внутри контейнера — ездит вместе с боссом
        tweens.push(this.tweens.add({ targets: shieldObj, alpha: 0.35, duration: 300, yoyo: true, repeat: -1 }));
        this.spawnFloatingText(CX, 430, tt('🛡 ЩИТ СТРАЖА', '🛡 GUARDIAN SHIELD'));
        timers.push(this.time.delayedCall(BALANCE.BOSS_SHIELD_MS, () => {
          shielded = false;
          shieldObj.destroy();
          // Окно для урона — следующий щит через EVERY_S
          timers.push(this.time.delayedCall(BALANCE.BOSS_SHIELD_EVERY_S * 1000, cycle));
        }));
      };
      timers.push(this.time.delayedCall(4000, cycle));
    }

    // Слабые точки: золотой круг, урон ×3
    if (spec.weak) {
      const spawnWeak = () => {
        if (!alive || finished) return;
        weakSpot = this.add.circle(
          CX + Phaser.Math.Between(-100, 100),
          600 + Phaser.Math.Between(-100, 100),
          BALANCE.BOSS_WEAK_RADIUS, 0xf1c40f, 0.45).setStrokeStyle(3, 0xffe27a);
        objects.push(weakSpot);
        weakTween = this.tweens.add({ targets: weakSpot, scaleX: 1.22, scaleY: 1.22, alpha: 0.65, duration: 300, yoyo: true, repeat: -1 });
        timers.push(this.time.delayedCall(BALANCE.BOSS_WEAK_MS, () => {
          weakTween?.remove();
          weakTween = null;
          weakSpot?.destroy();
          weakSpot = null;
          spawnWeak();
        }));
      };
      spawnWeak();
    }

    // Визуализация пассивного урона: кирки долетают до стража + всплывают цифры
    let passiveAccum = 0;
    if (passiveDps > 0) {
      const spawnPick = () => {
        if (!alive || finished) return;
        const pick = this.add.text(CX + Phaser.Math.Between(-260, 260), 1130, '⛏️', { fontSize: '26px' }).setOrigin(0.5);
        objects.push(pick);
        const tx = CX + Phaser.Math.Between(-90, 90);
        const ty = 600 + Phaser.Math.Between(-90, 90);
        tweens.push(this.tweens.add({
          targets: pick, x: tx, y: ty, angle: 380, duration: 480, ease: 'Quad.easeIn',
          onComplete: () => {
            pick.destroy();
            if (alive && !finished && this.state.settings.particles) {
              this.shardBursts[Math.min(tierIdx, CRYSTAL_TIERS.length - 1)].explode(3, tx, ty);
            }
          }
        }));
        timers.push(this.time.delayedCall(650 + Math.random() * 450, spawnPick));
      };
      spawnPick();
    }

    // Основной тик: таймер боя + пассивный урон шахтёров (щит их не держит)
    timers.push(this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (!alive || finished) return;
        timeLeft -= 0.1;
        timerTxt.setText(`⏱ ${Math.max(0, Math.ceil(timeLeft))}${tt(' с', ' s')}`);
        timerTxt.setColor(timeLeft <= 10 ? '#ff6b6b' : '#f1c40f');
        // Щит блокирует и пассив — неуязвимость полная
        const passive = shielded ? 0 : this.getTotalCps() * BALANCE.BOSS_CPS_SHARE * 0.1;
        if (passive > 0) {
          hp -= passive;
          drawHp();
          // Всплывающие цифры пассивного урона — ~раз в 1.5с
          passiveAccum += passive;
          if (passiveAccum >= passiveDps * 1.5) {
            passiveAccum = 0;
            this.spawnFloatingText(
              CX + Phaser.Math.Between(-110, 110),
              600 + Phaser.Math.Between(-95, 95),
              `-${this.formatNum(Math.round(passiveDps * 1.5))}`);
          }
        }
        // Реген Живучего/Владыки: простоишь дольше 1.2с — босс хилится
        if (spec.regen && performance.now() - lastHitAt > BALANCE.BOSS_REGEN_IDLE_S * 1000 && hp < maxHp) {
          hp = Math.min(maxHp, hp + maxHp * BALANCE.BOSS_REGEN_PCT * 0.1);
          drawHp();
        }
        // Трещины на боссе: 66% и 33% HP — лучи от края кристалла к центру с ветвлением
        const stage = hp / maxHp < 0.33 ? 2 : hp / maxHp < 0.66 ? 1 : 0;
        if (stage > crackStage) {
          crackStage = stage;
          const hotColor = stage === 1 ? 0xffe28a : 0xff7043; // сначала жёлтый жар, потом багровый
          const strokePts = (pts: { x: number; y: number }[], w: number, col: number, a: number) => {
            cracks.lineStyle(w, col, a);
            cracks.beginPath();
            cracks.moveTo(pts[0].x, pts[0].y);
            for (const p of pts) cracks.lineTo(p.x, p.y);
            cracks.strokePath();
          };
          const drawCrack = (sx: number, sy: number, dir: number, segs: number, allowBranch: boolean) => {
            let x = sx, y = sy, a = dir;
            const pts: { x: number; y: number }[] = [{ x, y }];
            for (let s = 0; s < segs; s++) {
              a += Phaser.Math.FloatBetween(-0.55, 0.55);
              const step = Phaser.Math.Between(16, 32);
              x += Math.cos(a) * step;
              y += Math.sin(a) * step;
              pts.push({ x, y });
              // Боковая веточка трещины
              if (allowBranch && Math.random() < 0.3) {
                drawCrack(x, y, a + (Math.random() < 0.5 ? 0.9 : -0.9), 3, false);
              }
            }
            // Два прохода: тёмный пролом + раскалённое нутро — эффект пробитого камня
            strokePts(pts, 7, 0x0a0a12, 0.95);
            strokePts(pts, 2.5, hotColor, 0.85);
          };
          for (let i = 0; i < (stage === 1 ? 3 : 4); i++) {
            const ang = Math.random() * Math.PI * 2;
            const sx = Math.cos(ang) * 115;
            const sy = Math.sin(ang) * 115;
            // Вмятина в точке удара
            cracks.fillStyle(0x0a0a12, 0.85).fillCircle(sx, sy, 6);
            drawCrack(sx, sy, Math.atan2(-sy, -sx), 5, true);
          }
          this.cameras.main.shake(90, 0.007);
          this.bossSfx('hurt');
          this.spawnFloatingText(CX, 470, tt('💥 ТРЕЩИНА!', '💥 CRACKED!'));
        }
        // Ярость: на <30% HP страж краснеет — видно, что добил
        if (!raged && hp / maxHp < 0.3) {
          raged = true;
          boss.setTint(0xcc5555);
          this.spawnFloatingText(CX, 480, tt('Страж трескается — добивай!', 'The guardian is cracking — finish it!'), false, true);
        }
        if (hp <= 0) { victory(); return; }
        if (timeLeft <= 0) defeat('time');
      }
    }));
  }

  // Модалка выбора бонуса ранга (1 из 2)
  // adAfter: true — вызов из эволюции: интерстишл покажем после выбора игрока
  private showRankChoiceModal(tier: number, adAfter = false): void {
    const pair = RANK_CHOICES[tier];
    if (!pair) return;

    const tierDef = CRYSTAL_TIERS[tier];
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 580, 420, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE);
    const title = this.add.text(CX, 480, t('modal.rankchoice'), {
      fontSize: '26px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const sub = this.add.text(CX, 525, `${tierDef.icon} ${L(tierDef.name)} — ${tt('выбери усиление навсегда:', 'choose a permanent boost:')}`, {
      fontSize: '17px', color: '#bdc3c7'
    }).setOrigin(0.5);

    const pick = (opt: RankChoiceOpt) => {
      this.playClickSound();
      this.state.rankChoices[tier] = opt.id;
      overlay.destroy(); modal.destroy(); title.destroy(); sub.destroy();
      cardA.destroy(); cardB.destroy();
      this.updateUI();
      this.sdk.saveData(this.state);
      // Реклама после выбора — диалог не прячется под полноэкранным блоком
      if (adAfter) this.tryShowInterstitial();
    };

    const cardA = this.createPerkCard(CX, 595, tt('Вариант А', 'Option A'), L(pair[0].label), () => pick(pair[0]));
    const cardB = this.createPerkCard(CX, 690, tt('Вариант Б', 'Option B'), L(pair[1].label), () => pick(pair[1]));
  }

  // Дерево перков эссенции
  private showEssenceModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.75).setInteractive();
    const modal = this.add.rectangle(CX, 640, 640, 760, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.PURPLE_EDGE);
    const title = this.add.text(CX, 300, `🔮 ${tt('ЭССЕНЦИЯ', 'ESSENCE')}: ${this.state.essence}`, {
      fontSize: '26px', color: '#bb8fd0', fontStyle: 'bold'
    }).setOrigin(0.5);
    const sub = this.add.text(CX, 335, tt('Зарабатывается эволюциями. Перки действуют навсегда.', 'Earned by evolving. Perks last forever.'), {
      fontSize: '14px', color: '#8c98a4'
    }).setOrigin(0.5);

    const rows: Phaser.GameObjects.GameObject[] = [];
    ESSENCE_PERKS.forEach((p, i) => {
      const y = 390 + i * 62;
      const lvl = this.getEssenceLvl(p.id);
      const maxed = lvl >= p.max;
      const cost = p.baseCost + lvl;

      const rowBg = this.add.rectangle(CX, y, 600, 56, UI_COLOR.ROW).setStrokeStyle(1, UI_COLOR.BORDER);
      const name = this.add.text(76, y - 13, `${p.icon} ${L(p.name)} · ${tt('ур.', 'lvl ')}${lvl}/${p.max}`, {
        fontSize: '16px', color: '#f1c40f', fontStyle: 'bold', wordWrap: { width: 450 }
      }).setOrigin(0, 0.5);
      const desc = this.add.text(76, y + 12, L(p.desc), {
        fontSize: '14px', color: '#bdc3c7', wordWrap: { width: 450 }
      }).setOrigin(0, 0.5);

      const canAfford = !maxed && this.state.essence >= cost;
      const buyBtn = this.add.rectangle(598, y, 104, 42, maxed ? UI_COLOR.ROW : canAfford ? UI_COLOR.BTN_GREEN : UI_COLOR.GRAY)
        .setInteractive({ useHandCursor: true });
      const buyText = this.add.text(598, y, maxed ? 'MAX' : `${cost} 🔮`, {
        fontSize: '16px', color: maxed || canAfford ? '#fff' : '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);

      if (!maxed) {
        buyBtn.on('pointerdown', () => {
          if (this.state.essence < cost) return;
          this.playClickSound();
          this.state.essence -= cost;
          this.state.essenceUpgrades[p.id] = lvl + 1;
          this.sdk.saveData(this.state);
          destroy();
          this.showEssenceModal(); // перерисовываем с новыми уровнями
        });
      }
      rows.push(rowBg, name, desc, buyBtn, buyText);
    });

    const closeBtn = this.add.rectangle(CX, 915, 220, 48, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, 915, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

    const destroy = () => {
      overlay.destroy(); modal.destroy(); title.destroy(); sub.destroy();
      rows.forEach(r => r.destroy());
      closeBtn.destroy(); closeText.destroy();
      this.updateUI();
    };
    closeBtn.on('pointerdown', destroy);
  }

  // --- 6. РАСЧЕТЫ И БАЛАНС ---
  private formatNum(n: number): string {
    if (n < 1000) return `${Math.floor(n)}`;
    const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    let scaled = n;
    let u = -1;
    while (scaled >= 1000 && u < units.length - 1) {
      scaled /= 1000;
      u++;
    }
    const str = scaled >= 100 ? `${Math.floor(scaled)}` : scaled.toFixed(1);
    return `${str}${units[u]}`;
  }

  // Скорость тапов по кристаллу (кликов в секунду, с точностью до десятых)
  private getTapCps(): number {
    const now = this.time.now;
    const n = this.clickTimes.filter(t => now - t < BALANCE.TAP_CPS_WINDOW_MS).length;
    return Math.round((n * 1000 / BALANCE.TAP_CPS_WINDOW_MS) * 10) / 10;
  }

  private getComboMult(): number {
    // Механика Топаза: потолок комбо ×5 вместо ×3; мета: +5 за перк/выбор
    const cap = (this.state.crystalTier >= TIER.COMBO_CAP ? BALANCE.COMBO_CAP_TOPAZ : BALANCE.COMBO_CAP)
      + BALANCE.ESSENCE_COMBO_STEP * this.getEssenceLvl('combo')
      + BALANCE.CHOICE_COMBO_CAP * this.countChoice('combo');
    return 1 + Math.min(this.comboCount, cap) * BALANCE.COMBO_STEP;
  }

  private getFrenzyMult(): number {
    // Механика Жадеита: шар даёт ×10 вместо ×7
    return this.frenzyTimeLeft > 0 ? (this.state.crystalTier >= TIER.FRENZY ? BALANCE.FRENZY_MULT_JADE : BALANCE.FRENZY_MULT) : 1;
  }

  // Множитель дохода от артефактов (уровень: 1 + (база-1) × ур)
  private getArtifactIncomeMult(): number {
    let m = 1;
    for (const id of this.state.artifacts) {
      const a = ARTIFACTS.find(x => x.id === id);
      if (a) m *= 1 + (a.incomeMult - 1) * this.getArtifactLvl(id);
    }
    return m;
  }

  // Множитель силы клика от артефактов
  private getArtifactClickMult(): number {
    let m = 1;
    for (const id of this.state.artifacts) {
      const a = ARTIFACTS.find(x => x.id === id);
      if (a) m *= 1 + (a.clickMult - 1) * this.getArtifactLvl(id);
    }
    return m;
  }

  // Событие дня (Жила золота)
  private getEventMult(): number {
    return this.state.eventMult > 1 ? this.state.eventMult : 1;
  }

  // Механики множителей рангов: Темный Алмаз ×1.5, Звёздный Алмаз ×2 (кумулятивно)
  private getRankIncomeMult(): number {
    let m = 1;
    if (this.state.crystalTier >= TIER.INCOME_MULT) m *= BALANCE.RANK_INCOME_PAD;
    if (this.state.crystalTier >= TIER.INCOME_MULT2) m *= BALANCE.RANK_INCOME_DARK;
    return m;
  }

  private getClickIncomeMult(): number {
    return this.getArtifactClickMult() * this.getEventMult() * this.getRankIncomeMult();
  }

  private getClickUpgradeCost(): number {
    return Math.floor(BALANCE.CLICK_UPGRADE_BASE * Math.pow(BALANCE.CLICK_UPGRADE_GROWTH, this.state.clickLevel - 1));
  }

  private getPickaxeUpgradeCost(): number {
    return Math.floor(BALANCE.PICKAXE_BASE_COST * Math.pow(BALANCE.PICKAXE_COST_GROWTH, this.state.pickaxeLevel));
  }

  // Эффективная сила клика: (база + % от пассивного дохода) × кирка × Дар Мощи.
  // Доля от cps масштабирует клик вместе с экономикой — прокачка клика не отстаёт от зданий
  private getClickPower(): number {
    const cpsShare = this.state.clickLevel * BALANCE.CLICK_CPS_SHARE_PER_LVL * this.getTotalCps();
    return (this.state.clickPower + cpsShare)
      * (1 + BALANCE.PICKAXE_CLICK_BONUS * this.state.pickaxeLevel)
      * (this.state.perks?.clickMult || 1)
      * this.getMetaClickMult()
      * this.getWeatherClickMult();
  }

  private getBuildingCost(b: BuildingDef): number {
    const count = this.state.buildings[b.id] || 0;
    const stacks = this.state.perks?.buildingDiscount || 0;
    const discount = Math.max(BALANCE.PERK_DISCOUNT_MIN, Math.pow(1 - BALANCE.PERK_DISCOUNT, stacks))
      * Math.pow(1 - BALANCE.ESSENCE_DISCOUNT_STEP, this.getEssenceLvl('discount'))
      * Math.pow(1 - BALANCE.CHOICE_DISCOUNT, this.countChoice('discount'));
    return Math.max(1, Math.floor(b.baseCost * Math.pow(BALANCE.BUILDING_COST_GROWTH, count) * discount));
  }

  // Число полных комплектов зданий (по одному каждого типа) → бонус к доходу
  private getSetCount(): number {
    return Math.min(...BUILDINGS.map(b => this.state.buildings[b.id] || 0));
  }

  private getSetBonusMult(): number {
    return 1 + BALANCE.SET_BONUS_PER_SET * this.getSetCount();
  }

  // Уровень перка эссенции
  private getEssenceLvl(id: string): number {
    return this.state.essenceUpgrades?.[id] || 0;
  }

  // Сколько раз выбран эффект на рангах
  private countChoice(id: string): number {
    const rc = this.state.rankChoices;
    return rc ? Object.values(rc).filter(v => v === id).length : 0;
  }

  // Уровень артефакта (дубликаты качают, по умолчанию 1)
  private getArtifactLvl(id: string): number {
    return this.state.artifactLevels?.[id] || 1;
  }

  // Погода шахты: детерминирована днём — одинакова у всех игроков в этот день
  private getWeather(): WeatherDef {
    return WEATHERS[Math.floor(Date.now() / DAY_MS) % WEATHERS.length];
  }

  private getWeatherIncomeMult(): number {
    const id = this.getWeather().id;
    return id === 'clear' ? 1 + BALANCE.WEATHER_CLEAR_INCOME
      : id === 'storm' ? 1 + BALANCE.WEATHER_STORM_INCOME : 1;
  }

  private getWeatherClickMult(): number {
    return this.getWeather().id === 'heat' ? 1 + BALANCE.WEATHER_HEAT_CLICK : 1;
  }

  // События недели + погода на награду сундуков
  private getChestEventMult(): number {
    const dow = new Date().getDay();
    const weekend = (dow === 0 || dow === 6) ? BALANCE.CHEST_WEEKEND_MULT : 1;
    const meteor = this.getWeather().id === 'meteor' ? 1 + BALANCE.WEATHER_METEOR_CHEST : 1;
    return weekend * meteor;
  }

  // Пятница: офлайн-доход ×3
  private getOfflineEventMult(): number {
    return new Date().getDay() === 5 ? BALANCE.OFFLINE_FRIDAY_MULT : 1;
  }

  // Суммарные множители мета-прогрессии
  private getMetaIncomeMult(): number {
    return (1 + BALANCE.ESSENCE_INCOME_STEP * this.getEssenceLvl('income'))
      * (1 + BALANCE.CHOICE_INCOME * this.countChoice('income'));
  }

  private getMetaClickMult(): number {
    return (1 + BALANCE.ESSENCE_CLICK_STEP * this.getEssenceLvl('click'))
      * (1 + BALANCE.CHOICE_CLICK * this.countChoice('click'));
  }

  // Достижения дают постоянный +1% к доходу за каждое — мета-прогрессия
  private getAchievementIncomeMult(): number {
    return 1 + BALANCE.ACHIEVEMENT_INCOME_STEP * this.state.achievements.length;
  }

  private getTotalCps(): number {
    let sum = 0;
    for (const b of BUILDINGS) {
      const count = this.state.buildings[b.id] || 0;
      const mgrMult = this.state.managers[b.id] ? 2 : 1;
      sum += count * b.baseCps * mgrMult;
    }
    // Перк престижа + артефакты + событие дня + механика ранга + комплекты + мета + ачивки + платный ×2
    const perkMult = this.state.perks?.incomeMultiplier || 1.0;
    const iapMult = this.state.iap?.doubleIncome ? 2 : 1;
    return Math.round(sum * perkMult * this.getArtifactIncomeMult() * this.getEventMult() * this.getRankIncomeMult() * this.getSetBonusMult() * this.getMetaIncomeMult() * this.getWeatherIncomeMult() * this.getAchievementIncomeMult() * iapMult);
  }

  // --- 7. ТАЙМЕРЫ И БУСТ ---
  // Если куплено отключение рекламы — награда выдаётся сразу, без видео
  // Межстраничная реклама: только в логических паузах, не чаще AD_MIN_INTERVAL_MS,
  // платформа дополнительно троттлит сама. no-ads отключает полностью.
  private tryShowInterstitial(onDone?: () => void): void {
    if (this.state.iap?.noAds) { onDone?.(); return; }
    const now = Date.now();
    if (now - (this.state.lastInterstitialAt || 0) < BALANCE.AD_MIN_INTERVAL_MS) { onDone?.(); return; }
    this.state.lastInterstitialAt = now;
    this.sdk.showFullscreenAdv(
      () => { this.sound.mute = true; this.sdk.gameplayStop(); },
      () => { this.sound.mute = this.isMuted; this.sdk.gameplayStart(); onDone?.(); }
    );
  }

  private runRewarded(onReward: () => void): void {
    if (this.state.iap?.noAds) {
      onReward();
      return;
    }
    this.sdk.showRewarded(
      () => { this.sdk.trackEvent?.('rewarded_ad_watched'); onReward(); },
      () => { this.sound.mute = true; this.sdk.gameplayStop(); },
      () => { this.sound.mute = this.isMuted; this.sdk.gameplayStart(); }
    );
  }

  private handleBoostAd(): void {
    this.runRewarded(() => {
      this.boostMultiplier = BALANCE.BOOST_MULT;
      this.boostTimeLeft += BALANCE.BOOST_SECONDS;
      this.updateUI();
    });
  }

  private setupTimers(): void {
    this.time.addEvent({
      delay: BALANCE.TICK_MS,
      loop: true,
      callback: () => {
        const cps = this.getTotalCps();
        // Автокликер: Изумруд +2/с, Обсидиан +5/с
        const autoRate = (this.state.crystalTier >= TIER.AUTOCLICK_MAX ? BALANCE.AUTOCLICK_HEAVEN
          : this.state.crystalTier >= TIER.AUTOCLICK_PLUS ? BALANCE.AUTOCLICK_OBSIDIAN
          : this.state.crystalTier >= TIER.AUTOCLICK ? BALANCE.AUTOCLICK_ONYX : 0)
          + BALANCE.ESSENCE_AUTO_STEP * this.getEssenceLvl('auto')
          + BALANCE.CHOICE_AUTO * this.countChoice('auto');
        const autoClick = autoRate > 0
          ? Math.round(this.getClickPower() * autoRate * this.boostMultiplier * this.getClickIncomeMult())
          : 0;
        const gained = cps > 0 ? cps * this.boostMultiplier : 0;
        if (gained + autoClick > 0) {
          this.state.coins += gained + autoClick;
          this.state.stats.totalCoinsEarned += gained + autoClick;
          this.spawnFloatingText(CX, 205, `+${this.formatNum(gained + autoClick)}`, true);
          this.updateUI();
        }

        // Распад комбо при паузе > окна (Звёздный Алмаз: комбо не сгорает)
        if (this.comboCount > 0 && this.state.crystalTier < TIER.COMBO_PERSIST
            && this.time.now - this.lastClickAt > BALANCE.COMBO_WINDOW_MS) {
          this.comboCount = 0;
          this.updateUI();
        }

        if (this.boostTimeLeft > 0) {
          this.boostTimeLeft--;
          if (this.boostTimeLeft === 0) this.boostMultiplier = 1;
        }
        if (this.frenzyTimeLeft > 0) this.frenzyTimeLeft--;

        // Волна осколков: отсчёт и перезапуск таймера по окончании
        if (this.shardWaveLeft > 0) {
          this.shardWaveLeft--;
          if (this.shardWaveLeft === 0) this.scheduleNextShardWave();
        }

        // Челлендж «Взлом жилы»: отсчёт, шкала, награда
        if (this.veinLeft > 0) {
          this.veinLeft--;
          this.veinBarFill.width = Math.min(300, (this.veinTaps / 60) * 300);
          this.veinInfoText.setText(`👆${this.veinTaps} • ${this.veinLeft}${tt('с', 's')}`);
          if (this.veinLeft === 0) this.finishVeinChallenge();
        }

        // Ежечасный контракт (проверяется и в update()) и достижения
        this.updateContract();
        this.checkAchievements();

        const w = this.getWeather();
        const status: string[] = [`${w.icon}${L(w.name)}`];
        const hints: string[] = [`${w.icon} ${L(w.name)}: ${L(w.desc)}`];
        const dow = new Date().getDay();
        if (dow === 0 || dow === 6) { status.push(tt('🎁×2 ВЫХОДНОЙ', '🎁×2 WEEKEND')); hints.push(tt('🎁 Выходной: награда сундуков ×2', '🎁 Weekend: chest reward ×2')); }
        if (dow === 5) { status.push(tt('🌙×3 ПТ', '🌙×3 FRI')); hints.push(tt('🌙 Пятница: офлайн-доход ×3', '🌙 Friday: offline income ×3')); }
        if (this.shardWaveLeft > 0) { status.push(`${t('status.shards')}: ${this.shardWaveLeft}${tt('с', 's')}`); hints.push(tt(`✨ Волна осколков: награда за тап +${Math.round(BALANCE.SHARD_WAVE_BONUS * 100)}%`, `✨ Shard wave: tap reward +${Math.round(BALANCE.SHARD_WAVE_BONUS * 100)}%`)); }
        if (this.veinLeft > 0) { status.push(`${t('status.vein')}: ${this.veinLeft}${tt('с', 's')}`); hints.push(tt('⚒️ Взлом жилы: тапайте быстро — награда за каждый тап', '⚒️ Vein hack: tap fast — reward per tap')); }
        if (this.boostTimeLeft > 0) { status.push(`${t('status.boost')}: ${this.boostTimeLeft}${tt('с', 's')}`); hints.push(tt('🔥 Буст ×2: двойная награда за клик', '🔥 Boost ×2: double click reward')); }
        if (this.frenzyTimeLeft > 0) { status.push(`⚡ ${tt('ЖАДЕИТ', 'JADEITE')} ×${this.getFrenzyMult()}: ${this.frenzyTimeLeft}${tt('с', 's')}`); hints.push(`${tt('⚡ Жадеит: сила клика', '⚡ Jadeite: click power')} ×${this.getFrenzyMult()}`); }
        if (this.getEventMult() > 1) { status.push(`💰 ${tt('ЖИЛА ЗОЛОТА', 'GOLD VEIN')} ×${this.getEventMult()}`); hints.push(`${tt('💰 Жила золота: доход', '💰 Gold vein: income')} ×${this.getEventMult()}`); }
        this.statusHints = hints;
        this.boostTimerText.setText(status.join(' • '));
        // Подсказка привязывается к низу статус-строки — она может быть в две строки
        if (this.statusTip) this.statusTip.setY(150 + this.boostTimerText.height + 18);
        if (this.statusTip?.visible) {
          this.statusTipText.setText(hints.join('\n'));
          const b = this.statusTipText.getBounds();
          this.statusTipBg.setSize(b.width + 28, b.height + 16);
        }
      }
    });

    this.time.addEvent({
      delay: BALANCE.AUTOSAVE_MS,
      loop: true,
      callback: () => this.sdk.saveData(this.state)
    });

    // Периодическая межстраничная реклама в долгих сессиях (правила Яндекса:
    // по таймеру допустимо при «уровне» > 5 мин, с предупреждением ~2 сек)
    this.time.addEvent({
      delay: BALANCE.AD_PERIODIC_MS,
      loop: true,
      callback: () => {
        if (this.state.iap?.noAds) return;
        const now = Date.now();
        if (now - (this.state.lastInterstitialAt || 0) < BALANCE.AD_MIN_INTERVAL_MS) return;
        this.spawnFloatingText(CX, 300, tt('📺 Рекламная пауза…', '📺 Ad break…'), false, true);
        this.time.delayedCall(BALANCE.AD_NOTICE_MS, () => this.tryShowInterstitial());
      }
    });
  }

  // --- ЕЖЕЧАСНЫЙ КОНТРАКТ ---
  private spawnContract(): void {
    const roll = Math.random();
    const type = roll < 0.25 ? 'taps' : roll < 0.45 ? 'coins' : roll < 0.62 ? 'build'
      : roll < 0.77 ? 'upgrade' : roll < 0.9 ? 'chest' : 'combo';
    let target: number;
    let start = 0;
    switch (type) {
      case 'taps':
        target = BALANCE.CONTRACT_TAPS_BASE + Phaser.Math.Between(0, 150);
        start = this.state.stats.totalClicks;
        break;
      case 'coins':
        target = Math.max(500, Math.round(this.getTotalCps() * BALANCE.CONTRACT_REWARD_CPS));
        start = this.state.stats.totalCoinsEarned;
        break;
      case 'build':
        target = 1 + Phaser.Math.Between(0, 2); // 1–3 предприятия
        start = Object.values(this.state.buildings).reduce((s, n) => s + n, 0);
        break;
      case 'upgrade':
        target = 1 + Phaser.Math.Between(0, 1); // 1–2 уровня прокачки
        start = this.state.clickLevel + this.state.pickaxeLevel;
        break;
      case 'chest':
        target = 1 + Phaser.Math.Between(0, 2); // 1–3 сундука
        start = this.state.stats.chestsOpened;
        break;
      default: // combo: набери множитель ×2.0–×2.5
        target = 2 + Phaser.Math.Between(0, 5) / 10;
        break;
    }
    this.state.contract = { type, target, start, deadline: Date.now() + BALANCE.CONTRACT_DURATION_MS };
  }

  private getContractProgress(c: NonNullable<GameSaveData['contract']>): number {
    switch (c.type) {
      case 'taps': return this.state.stats.totalClicks - c.start;
      case 'coins': return this.state.stats.totalCoinsEarned - c.start;
      case 'build': return Object.values(this.state.buildings).reduce((s, n) => s + n, 0) - c.start;
      case 'upgrade': return this.state.clickLevel + this.state.pickaxeLevel - c.start;
      case 'chest': return this.state.stats.chestsOpened - c.start;
      case 'combo': return this.getComboMult(); // абсолютное значение множителя
    }
  }

  private getContractDesc(c: NonNullable<GameSaveData['contract']>): string {
    switch (c.type) {
      case 'taps': return `${tt('Сделай', 'Make')} ${this.formatNum(c.target)} ${tt('тапов', 'taps')}`;
      case 'coins': return `${tt('Заработай', 'Earn')} ${this.formatNum(c.target)} 💰`;
      case 'build': return `${tt('Купи', 'Buy')} ${c.target} ${tt('предприятий', 'buildings')}`;
      case 'upgrade': return `${tt('Купи', 'Buy')} ${c.target} ${tt('улучшений', 'upgrades')}`;
      case 'chest': return `${tt('Поймай', 'Catch')} ${c.target} ${tt('сундуков', 'chests')}`;
      case 'combo': return `${tt('Набери комбо', 'Reach combo')} ×${c.target.toFixed(1)}`;
    }
  }

  private updateContract(): void {
    const now = Date.now();
    const c = this.state.contract;
    if (c) {
      if (now > c.deadline) {
        // Истёк — слот часа закрывается, следующий по расписанию (сразу)
        this.state.contract = null;
        this.state.nextContractAt = c.deadline;
      } else if (this.getContractProgress(c) >= c.target) {
        const reward = Math.max(500, Math.round(this.getTotalCps() * BALANCE.CONTRACT_REWARD_CPS));
        this.state.coins += reward;
        this.state.stats.totalCoinsEarned += reward;
        // Следующий контракт выдаётся в конце часового слота — раз в час
        this.state.nextContractAt = c.deadline;
        this.state.contract = null;
        this.spawnFloatingText(CX, 235, `⏱️ ${tt('Контракт выполнен!', 'Contract complete!')} +${this.formatNum(reward)} 💰`, false, true);
        this.updateUI();
        return;
      }
    }
    if (!this.state.contract && now >= this.state.nextContractAt) {
      this.spawnContract();
      this.updateUI();
    }
  }

  // --- ДОСТИЖЕНИЯ ---
  private checkAchievements(): void {
    for (const a of ACHIEVEMENTS) {
      if (!this.state.achievements.includes(a.id) && a.check(this.state)) {
        this.state.achievements.push(a.id);
        this.state.coins += a.reward;
        this.state.stats.totalCoinsEarned += a.reward;
        this.spawnFloatingText(CX, 240, `🏆 ${L(a.name)}! +${this.formatNum(a.reward)} 💰`, false, true);
      }
    }
  }

  private showAchievementsModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 720, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE);
    const done = this.state.achievements.length;
    const title = this.add.text(CX, 300, `🏆 ${tt('ДОСТИЖЕНИЯ', 'ACHIEVEMENTS')} (${done}/${ACHIEVEMENTS.length})`, {
      fontSize: '26px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const sub = this.add.text(CX, 336, `${tt('Награда начисляется автоматически. Каждое достижение:', 'Reward is granted automatically. Each achievement:')} +${Math.round(BALANCE.ACHIEVEMENT_INCOME_STEP * 100)}% ${tt('к доходу навсегда', 'income forever')}`, {
      fontSize: '14px', color: '#8c98a4'
    }).setOrigin(0.5);

    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title, sub];
    let y = 380;

    for (const a of ACHIEVEMENTS) {
      const got = this.state.achievements.includes(a.id);
      objects.push(this.add.rectangle(CX, y, 560, 42, got ? UI_COLOR.ROW : UI_COLOR.HEADER, 0.6)
        .setStrokeStyle(1, got ? UI_COLOR.GOLD_EDGE : UI_COLOR.BORDER));
      objects.push(this.add.text(90, y, `${a.icon} ${L(a.name)}`, {
        fontSize: '16px', color: got ? '#ecf0f1' : '#7f8c8d'
      }).setOrigin(0, 0.5));
      objects.push(this.add.text(630, y, got ? '✅' : `🔒 +${this.formatNum(a.reward)}`, {
        fontSize: '15px', color: '#f1c40f'
      }).setOrigin(1, 0.5));
      y += 48;
    }

    const closeBtn = this.add.rectangle(CX, y + 20, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, y + 20, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', () => objects.forEach(o => o.destroy()));
  }

  private scheduleNextLuckyDrop(): void {
    const delay = Phaser.Math.Between(BALANCE.CHEST_MIN_DELAY_MS, BALANCE.CHEST_MAX_DELAY_MS);
    this.chestTimerEvent = this.time.delayedCall(delay, () => {
      this.chestTimerEvent = undefined;
      this.spawnLuckyChest();
    });
  }

  // Вызов сундука досрочно за просмотр рекламы
  private handleChestAd(): void {
    if (this.currentChest) {
      this.spawnFloatingText(CX, 240, tt('🎁 Сундук уже на экране!', '🎁 Chest already on screen!'), true, true);
      return;
    }
    this.runRewarded(() => {
      this.chestTimerEvent?.remove();
      this.chestTimerEvent = undefined;
      this.spawnLuckyChest();
    });
  }

  // --- ЕЖЕДНЕВНОЕ СОБЫТИЕ «ЖИЛА ЗОЛОТА» ---
  private ensureDailyEvent(): void {
    const today = Math.floor(Date.now() / DAY_MS);
    if (this.state.eventDay === today) return;

    this.state.eventDay = today;
    this.state.eventMult = Phaser.Math.Between(0, 100) < BALANCE.EVENT_CHANCE_PCT ? BALANCE.EVENT_MULT : 1;
    this.sdk.saveData(this.state);

    if (this.state.eventMult > 1) {
      this.time.delayedCall(1500, () =>
        this.spawnFloatingText(CX, 240, tt('💰 СЕГОДНЯ ЖИЛА ЗОЛОТА! ДОХОД ×3', '💰 GOLD VEIN TODAY! INCOME ×3'), false, true));
    }
  }

  // --- ЗОЛОТОЙ ШАР (КЛИК ×7 НА 10 СЕК) ---
  private scheduleNextGolden(): void {
    const delay = Phaser.Math.Between(BALANCE.GOLDEN_MIN_DELAY_MS, BALANCE.GOLDEN_MAX_DELAY_MS);
    this.time.delayedCall(delay, () => this.spawnGolden());
  }

  // --- ВОЛНА ОСКОЛКОВ: каждые ~5 мин кристалл «искрит» 10 с ---
  private scheduleNextShardWave(): void {
    const delay = Phaser.Math.Between(BALANCE.SHARD_WAVE_MIN_MS, BALANCE.SHARD_WAVE_MAX_MS);
    this.time.delayedCall(delay, () => this.startShardWave());
  }

  private startShardWave(): void {
    if (this.shardWaveLeft > 0) return;
    this.shardWaveLeft = BALANCE.SHARD_WAVE_SECONDS;
    this.spawnFloatingText(CX, 235, `✨ ${tt('ВОЛНА ОСКОЛКОВ! Тапы', 'SHARD WAVE! Taps')} +${Math.round(BALANCE.SHARD_WAVE_BONUS * 100)}%`, false, true);
    this.updateUI();
    // перезапуск планируется в тике, когда волна закончится
  }

  // --- ВЗЛОМ ЖИЛЫ: летящий шар ⛏️, тап запускает 10-с челлендж ---
  private scheduleNextVein(): void {
    const delay = Phaser.Math.Between(BALANCE.VEIN_MIN_MS, BALANCE.VEIN_MAX_MS);
    this.time.delayedCall(delay, () => this.spawnVein());
  }

  private spawnVein(): void {
    if (this.currentVein) return;
    if (this.veinLeft > 0) { this.scheduleNextVein(); return; }

    const fromLeft = Phaser.Math.Between(0, 1) === 1;
    const startX = fromLeft ? -60 : CANVAS_W + 60;
    const targetX = fromLeft ? CANVAS_W + 60 : -60;
    const startY = Phaser.Math.Between(200, 560);

    const glow = this.add.circle(0, 0, 46, 0x8c98a4, 0.45);
    const img = this.add.text(0, 0, '⛏️', { fontSize: '44px' }).setOrigin(0.5);
    const orb = this.add.container(startX, startY, [glow, img]);
    orb.setSize(80, 80);
    orb.setInteractive({ useHandCursor: true });
    this.currentVein = orb;

    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.15,
      duration: 450,
      yoyo: true,
      loop: -1
    });

    const moveTween = this.tweens.add({
      targets: orb,
      x: targetX,
      duration: BALANCE.GOLDEN_FLY_MS,
      ease: 'Linear',
      onComplete: () => {
        orb.destroy();
        this.currentVein = undefined;
        this.scheduleNextVein();
      }
    });

    orb.on('pointerdown', () => {
      this.playClickSound();
      moveTween.stop();
      orb.destroy();
      this.currentVein = undefined;
      this.startVeinChallenge();
    });
  }

  private startVeinChallenge(): void {
    this.veinTaps = 0;
    this.veinLeft = BALANCE.VEIN_SECONDS;
    this.veinBarFill.width = 0.1;
    this.veinPanel.setVisible(true);
    this.updateUI();
  }

  private finishVeinChallenge(): void {
    // Награда пропорциональна тапам: за каждый — (cps + сила клика)
    const reward = Math.max(50, Math.round(this.veinTaps * (this.getTotalCps() + this.getClickPower())));
    this.state.coins += reward;
    this.state.stats.totalCoinsEarned += reward;
    this.veinPanel.setVisible(false);
    this.spawnFloatingText(CX, 235, `⚒️ ${tt('Жила вскрыта!', 'Vein cracked!')} +${this.formatNum(reward)} 💰`, false, true);
    this.updateUI();
    this.sdk.saveData(this.state);
    this.scheduleNextVein();
  }

  private spawnGolden(): void {
    if (this.currentGolden) return;

    const fromLeft = Phaser.Math.Between(0, 1) === 1;
    const startX = fromLeft ? -60 : CANVAS_W + 60;
    const targetX = fromLeft ? CANVAS_W + 60 : -60;
    const startY = Phaser.Math.Between(200, 560);

    const glow = this.add.circle(0, 0, 52, 0xffd700, 0.45);
    const img = this.add.image(0, 0, 'golden');

    const orb = this.add.container(startX, startY, [glow, img]);
    orb.setSize(90, 90);
    orb.setInteractive({ useHandCursor: true });
    this.currentGolden = orb;

    this.tweens.add({
      targets: glow,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0.15,
      duration: 400,
      yoyo: true,
      loop: -1
    });

    const moveTween = this.tweens.add({
      targets: orb,
      x: targetX,
      duration: BALANCE.GOLDEN_FLY_MS,
      ease: 'Linear',
      onComplete: () => {
        orb.destroy();
        this.currentGolden = undefined;
        this.scheduleNextGolden();
      }
    });

    orb.on('pointerdown', () => {
      this.playClickSound();
      moveTween.stop();
      orb.destroy();
      this.currentGolden = undefined;

      this.frenzyTimeLeft = this.state.crystalTier >= TIER.FRENZY ? BALANCE.FRENZY_SECONDS_JADE : BALANCE.FRENZY_SECONDS;
      this.spawnFloatingText(CX, 240, `⚡ ${tt('ЖАДЕИТ! КЛИК', 'JADEITE! CLICK')} ×${this.getFrenzyMult()}`, false, true);
      this.scheduleNextGolden();
    });
  }

  private spawnLuckyChest(): void {
    if (this.currentChest) return;

    const fromLeft = Phaser.Math.Between(0, 1) === 1;
    const startX = fromLeft ? -60 : CANVAS_W + 60;
    const targetX = fromLeft ? CANVAS_W + 60 : -60;
    const startY = Phaser.Math.Between(200, 560);
    const isGold = Math.random() < BALANCE.CHEST_GOLD_CHANCE; // критический сундук

    const glow = this.add.circle(0, 0, isGold ? 56 : 44, isGold ? 0xffe14d : UI_COLOR.GOLD, isGold ? 0.55 : 0.4);
    const chestImg = this.add.image(0, 0, 'chest').setScale(isGold ? 1.0 : 0.85);
    if (isGold) chestImg.setTint(0xffd700);

    const chest = this.add.container(startX, startY, [glow, chestImg]);
    chest.setSize(80, 80);
    chest.setInteractive({ useHandCursor: true });
    this.currentChest = chest;

    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.1,
      duration: 500,
      yoyo: true,
      loop: -1
    });

    const moveTween = this.tweens.add({
      targets: chest,
      x: targetX,
      duration: BALANCE.CHEST_FLY_MS,
      ease: 'Linear',
      onComplete: () => {
        chest.destroy();
        this.currentChest = undefined;
        this.scheduleNextLuckyDrop();
      }
    });

    chest.on('pointerdown', () => {
      this.playClickSound();
      moveTween.stop();
      chest.destroy();
      this.currentChest = undefined;
      this.state.stats.chestsOpened = (this.state.stats.chestsOpened || 0) + 1;

      // Механика Граната: награды сундуков ×2; золотой сундук ×5
      const tierMult = this.state.crystalTier >= TIER.CHEST_MULT ? BALANCE.CHEST_RANK_MULT : 1;
      const goldMult = isGold ? BALANCE.CHEST_GOLD_MULT : 1;
      const metaMult = (1 + BALANCE.ESSENCE_CHEST_STEP * this.getEssenceLvl('chest'))
        * (1 + BALANCE.CHOICE_CHEST * this.countChoice('chest'));
      const baseReward = Math.max(BALANCE.CHEST_MIN_REWARD, (this.getTotalCps() * BALANCE.CHEST_CPS_FACTOR) + (this.getClickPower() * BALANCE.CHEST_CLICK_FACTOR)) * tierMult * goldMult * metaMult * this.getChestEventMult();
      this.showLuckyChestModal(baseReward, isGold);
    });
  }

  private showLuckyChestModal(baseReward: number, isGold = false): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.75).setInteractive();
    const modal = this.add.rectangle(CX, 640, 580, 430, UI_COLOR.PANEL).setStrokeStyle(3, UI_COLOR.GOLD_EDGE);
    const title = this.add.text(CX, 480, isGold ? tt('✨ КРИТИЧЕСКИЙ СУНДУК ×5! ✨', '✨ CRITICAL CHEST ×5! ✨') : tt('Золотой Сюрприз!', 'Golden Surprise!'), {
      fontSize: '28px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const superReward = baseReward * BALANCE.CHEST_VIDEO_MULT;

    const claimBtn = this.add.rectangle(CX, 640, 400, 55, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const claimText = this.add.text(CX, 640, `${tt('Забрать', 'Claim')}: +${this.formatNum(baseReward)} 💰`, { fontSize: '20px', color: '#fff' }).setOrigin(0.5);

    const videoBtn = this.add.rectangle(CX, 725, 400, 65, UI_COLOR.BTN_GREEN).setStrokeStyle(3, UI_COLOR.GREEN_EDGE).setInteractive({ useHandCursor: true });
    const videoText = this.add.text(CX, 725, `🎬 ${tt('Забрать Х5', 'Claim ×5')}: +${this.formatNum(superReward)} 💰`, { fontSize: '21px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    const destroyModal = () => {
      overlay.destroy();
      modal.destroy();
      title.destroy();
      claimBtn.destroy();
      claimText.destroy();
      videoBtn.destroy();
      videoText.destroy();
      this.updateUI();
      this.sdk.saveData(this.state);
      this.scheduleNextLuckyDrop();
    };

    claimBtn.on('pointerdown', () => {
      this.playClickSound();
      this.state.coins += baseReward;
      this.state.stats.totalCoinsEarned += baseReward;
      this.tryDropArtifact(360, 560);
      destroyModal();
    });

    videoBtn.on('pointerdown', () => {
      this.runRewarded(() => {
        this.state.coins += superReward;
        this.state.stats.totalCoinsEarned += superReward;
        this.tryDropArtifact(360, 560);
        destroyModal();
      });
    });
  }

  // --- 8. ОФЛАЙН-ДОХОД ---
  private checkOfflineEarnings(): void {
    const now = Date.now();
    const secondsOffline = Math.floor((now - this.state.lastSaveTime) / 1000);
    const totalCps = this.getTotalCps();

    if (secondsOffline > BALANCE.OFFLINE_MIN_S && totalCps > 0) {
      // Механика Лунного камня: офлайн-кап 16 ч вместо 8
      const cap = this.state.crystalTier >= TIER.OFFLINE_CAP ? BALANCE.OFFLINE_CAP_MOON_S : BALANCE.OFFLINE_CAP_S;
      const cappedSeconds = Math.min(secondsOffline, cap);
      // Механика Аметиста: офлайн-доход ×2; мета-бонусы к офлайну
      const metaOffline = (1 + BALANCE.ESSENCE_OFFLINE_STEP * this.getEssenceLvl('offline'))
        * (1 + BALANCE.CHOICE_OFFLINE * this.countChoice('offline'))
        * this.getOfflineEventMult(); // пятница ×3
      const earned = cappedSeconds * totalCps * (this.state.crystalTier >= TIER.OFFLINE_MULT ? BALANCE.OFFLINE_RANK_MULT : 1) * metaOffline;
      if (earned > 0) {
        this.showOfflineModal(earned, Math.ceil(cappedSeconds / 60));
      }
    }
  }

  private showOfflineModal(amount: number, minutes: number): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.75).setInteractive();
    const modal = this.add.rectangle(CX, 640, 580, 440, UI_COLOR.PANEL).setStrokeStyle(3, UI_COLOR.GOLD_EDGE);

    const title = this.add.text(CX, 470, t('modal.offline'), { fontSize: '32px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const info = this.add.text(CX, 530, `${tt('Вас не было', 'You were away for')} ${minutes} ${tt('мин', 'min')}.\n${tt('Шахты добыли:', 'Your mines earned:')}`, { fontSize: '20px', color: '#ffffff', align: 'center' }).setOrigin(0.5);
    const rewardText = this.add.text(CX, 600, `+${this.formatNum(amount)} 💰`, { fontSize: '40px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);

    // При долгом отсутствии реклама даёт ×3 вместо ×2
    const adMult = minutes >= BALANCE.OFFLINE_LONG_MIN ? BALANCE.OFFLINE_AD_MULT_LONG : BALANCE.OFFLINE_AD_MULT;

    const claimBtn = this.add.rectangle(CX, 690, 400, 55, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const claimText = this.add.text(CX, 690, `${tt('Забрать', 'Claim')} (${this.formatNum(amount)})`, { fontSize: '20px', color: '#fff' }).setOrigin(0.5);

    const doubleBtn = this.add.rectangle(CX, 765, 400, 65, UI_COLOR.BTN_GREEN).setInteractive({ useHandCursor: true });
    const noAds = !!this.state.iap?.noAds;
    const doubleText = this.add.text(CX, 765, `${noAds ? '⚡' : '🎬'} ${adMult === 3 ? tt('Утроить', 'Triple') : tt('Удвоить', 'Double')}: +${this.formatNum(amount * adMult)}${noAds ? '' : ' (Видео)'}`, { fontSize: '21px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    const destroyModal = () => {
      overlay.destroy();
      modal.destroy();
      title.destroy();
      info.destroy();
      rewardText.destroy();
      claimBtn.destroy();
      claimText.destroy();
      doubleBtn.destroy();
      doubleText.destroy();
      this.updateUI();
      this.sdk.saveData(this.state);
    };

    claimBtn.on('pointerdown', () => {
      this.playClickSound();
      this.state.coins += amount;
      this.state.stats.totalCoinsEarned += amount;
      destroyModal();
    });

    doubleBtn.on('pointerdown', () => {
      this.runRewarded(() => {
        this.state.coins += amount * adMult;
        this.state.stats.totalCoinsEarned += amount * adMult;
        destroyModal();
      });
    });
  }

  // --- АРТЕФАКТЫ: ДРОП С СУНДУКА ---
  private tryDropArtifact(x: number, y: number): void {
    const chance = BALANCE.ARTIFACT_DROP_CHANCE + BALANCE.CHOICE_ART * this.countChoice('art')
      + (this.getWeather().id === 'storm' ? BALANCE.WEATHER_STORM_ART : 0);
    if (Math.random() >= chance) return;

    const owned = this.state.artifacts;
    // Сначала добираем коллекцию; потом дубликаты качают уровень (до MAX)
    const unowned = ARTIFACTS.filter(a => !owned.includes(a.id));
    const upgradable = ARTIFACTS.filter(a => owned.includes(a.id) && this.getArtifactLvl(a.id) < BALANCE.ARTIFACT_MAX_LEVEL);
    const pool = unowned.length ? unowned : upgradable;
    if (!pool.length) return;

    const art = pool[Phaser.Math.Between(0, pool.length - 1)];
    const isDup = owned.includes(art.id);
    if (isDup) {
      this.state.artifactLevels[art.id] = this.getArtifactLvl(art.id) + 1;
    } else {
      this.state.artifacts.push(art.id);
      this.state.artifactLevels[art.id] = 1;
    }

    // Баннер с описанием — висит ~3.5 с поверх модалки
    const banner = this.add.text(x, y,
      isDup
        ? `${art.icon} ${L(art.name)} → ${tt('ур.', 'lvl ')}${this.getArtifactLvl(art.id)}!`
        : `${art.icon} ${tt('АРТЕФАКТ:', 'ARTIFACT:')} ${L(art.name)}\n${L(art.desc)}`, {
      fontSize: '26px',
      color: '#f1c40f',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: '#1a1c24e6',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(45);

    this.tweens.add({ targets: banner, y: y - 40, duration: 3500, ease: 'Cubic.easeOut' });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 3000,
      duration: 500,
      onComplete: () => banner.destroy()
    });

    this.sdk.saveData(this.state);
  }

  // Тултип с бонусом артефакта при наведении/тапе
  private showArtifactTooltip(a: ArtifactDef, x: number): void {
    if (!this.artifactTooltip) {
      this.artifactTooltipBg = this.add.rectangle(0, 0, 10, 10, UI_COLOR.PANEL_DARK).setStrokeStyle(2, UI_COLOR.GOLD);
      this.artifactTooltipText = this.add.text(0, 0, '', {
        fontSize: '15px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      this.artifactTooltip = this.add.container(0, 0, [this.artifactTooltipBg, this.artifactTooltipText])
        .setDepth(40).setVisible(false);
    }
    this.artifactTooltipText.setText(`${a.icon} ${L(a.name)} — ${tt('ур.', 'lvl ')}${this.getArtifactLvl(a.id)}\n${L(a.desc)}`);
    this.artifactTooltipBg.setSize(this.artifactTooltipText.width + 24, this.artifactTooltipText.height + 16);
    const cx = Phaser.Math.Clamp(x, this.artifactTooltipBg.width / 2 + 10, 710 - this.artifactTooltipBg.width / 2);
    this.artifactTooltip.setPosition(cx, 705).setVisible(true);
  }

  private hideArtifactTooltip(): void {
    this.artifactTooltip?.setVisible(false);
  }

  // --- МЕНЕДЖЕРЫ (×2 К ЗДАНИЮ) ---
  private showManagersModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 560, UI_COLOR.PANEL_DARK).setStrokeStyle(3, 0x3498db);
    const title = this.add.text(CX, 390, t('modal.managers'), { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const sub = this.add.text(CX, 428, tt('Нанятый менеджер удваивает доход предприятия.\nСохраняется при эволюции.', 'A hired manager doubles the building\'s income.\nSurvives evolution.'), {
      fontSize: '16px', color: '#8c98a4', align: 'center'
    }).setOrigin(0.5);

    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title, sub];
    const rowH = 72;
    let y = 485;

    for (const b of BUILDINGS) {
      const hired = !!this.state.managers[b.id];
      const cost = b.baseCost * BALANCE.MANAGER_COST_MULT;

      objects.push(this.add.image(80, y, `b_${b.id}`).setDisplaySize(44, 44));
      objects.push(this.add.text(112, y, `${L(b.name)}\n${tt('×2 к доходу', '×2 income')}`, { fontSize: '17px', color: '#ecf0f1' }).setOrigin(0, 0.5));

      const btn = this.add.rectangle(575, y, 160, 48, hired ? UI_COLOR.BTN_GREEN : (this.state.coins >= cost ? UI_COLOR.BTN_BLUE : UI_COLOR.STEEL))
        .setInteractive({ useHandCursor: true });
      const btnText = this.add.text(575, y, hired ? tt('✔ Нанят', '✔ Hired') : `💰 ${this.formatNum(cost)}`, {
        fontSize: '16px', color: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5);
      objects.push(btn, btnText);

      if (!hired) {
        btn.on('pointerdown', () => {
          if (this.state.coins < cost) return;
          this.playClickSound();
          this.state.coins -= cost;
          this.state.managers[b.id] = true;
          objects.forEach(o => o.destroy());
          this.showManagersModal();
          this.updateUI();
          this.sdk.saveData(this.state);
        });
      }
      y += rowH;
    }

    const closeBtn = this.add.rectangle(CX, y + 20, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, y + 20, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', () => objects.forEach(o => o.destroy()));
  }

  // --- СКИНЫ КРИСТАЛЛА ---
  private showSkinsModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 570, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.PURPLE_EDGE);
    const title = this.add.text(CX, 400, t('modal.skins'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const sub = this.add.text(CX, 438, tt('Скин меняет цвет кристалла и свечения', 'Skin changes crystal and glow color'), { fontSize: '16px', color: '#8c98a4' }).setOrigin(0.5);

    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title, sub];
    let y = 490;

    for (const skin of SKINS) {
      const owned = this.state.skins.includes(skin.id);
      const active = this.state.activeSkin === skin.id;

      // Свотч показывает цвет тонировки (для «Призмы» — её базовый цвет)
      const swatchColor = skin.tint !== UI_COLOR.WHITE ? skin.tint : (skin.color !== 0 ? skin.color : UI_COLOR.GRAY);
      const swatch = this.add.circle(90, y, 16, swatchColor);
      if (skin.id === 'rainbow') swatch.setStrokeStyle(3, UI_COLOR.GOLD_EDGE);
      objects.push(swatch);
      objects.push(this.add.text(120, y, `${skin.icon} ${L(skin.name)}`, { fontSize: '18px', color: '#ecf0f1' }).setOrigin(0, 0.5));

      const label = active ? tt('✔ Активен', '✔ Active') : (owned ? tt('Выбрать', 'Select') : `💰 ${this.formatNum(skin.cost)}`);
      const btn = this.add.rectangle(575, y, 160, 46,
        active ? UI_COLOR.BTN_GREEN : (owned || this.state.coins >= skin.cost ? UI_COLOR.BTN_BLUE : UI_COLOR.STEEL))
        .setInteractive({ useHandCursor: true });
      const btnText = this.add.text(575, y, label, { fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      objects.push(btn, btnText);

      if (!active) {
        btn.on('pointerdown', () => {
          if (!owned) {
            if (this.state.coins < skin.cost) return;
            this.state.coins -= skin.cost;
            this.state.skins.push(skin.id);
          }
          this.playClickSound();
          this.state.activeSkin = skin.id;
          objects.forEach(o => o.destroy());
          this.updateCrystalVisuals();
          this.updateUI();
          this.sdk.saveData(this.state);
        });
      }
      y += 60;
    }

    const closeBtn = this.add.rectangle(CX, y + 15, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, y + 15, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', () => objects.forEach(o => o.destroy()));
  }

  // --- СПИСОК ОТКРЫТЫХ БОНУСОВ КРИСТАЛЛА ---
  private showBonusesModal(): void {
    const unlocked = CRYSTAL_TIERS
      .map((t, i) => ({ ...t, idx: i }))
      .filter(t => t.mech.ru && t.idx <= this.state.crystalTier);
    const next = CRYSTAL_TIERS.find((t, i) => t.mech.ru && i > this.state.crystalTier);

    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 800, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE);
    const title = this.add.text(CX, 275, t('modal.bonuses'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const sub = this.add.text(CX, 312, `${tt('Открыто', 'Unlocked')}: ${unlocked.length} — ${tt('бонусы действуют накопительно', 'bonuses stack')}`, {
      fontSize: '15px', color: '#8c98a4'
    }).setOrigin(0.5);

    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title, sub];
    let y = 350;

    if (unlocked.length === 0) {
      objects.push(this.add.text(CX, y + 40, tt('Пока нет бонусов — эволюционируй кристалл!', 'No bonuses yet — evolve the crystal!'), {
        fontSize: '18px', color: '#8c98a4'
      }).setOrigin(0.5));
      y += 100;
    } else {
      for (const t of unlocked) {
        objects.push(this.add.rectangle(CX, y, 560, 40, UI_COLOR.ROW, 0.6).setStrokeStyle(1, t.strokeColor));
        objects.push(this.add.text(90, y, `${t.icon} ${L(t.name)}`, { fontSize: '17px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0, 0.5));
        objects.push(this.add.text(630, y, L(t.mech), { fontSize: '16px', color: '#f1c40f' }).setOrigin(1, 0.5));
        y += 44;
      }
    }

    if (next) {
      objects.push(this.add.text(CX, y + 12, `${tt('⏭ Следующий бонус:', '⏭ Next bonus:')} ${next.icon} ${L(next.name)} — ${L(next.mech)}`, {
        fontSize: '15px', color: '#7f8c8d'
      }).setOrigin(0.5));
      y += 40;
    }

    const closeBtn = this.add.rectangle(CX, y + 25, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, y + 25, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', () => objects.forEach(o => o.destroy()));
  }

  // --- ДЕТАЛИЗАЦИЯ ВСЕХ МНОЖИТЕЛЕЙ ---
  private showMultipliersModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 640, 1040, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE)
      .setInteractive();
    const title = this.add.text(CX, 175, t('modal.multipliers'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title];

    const fmt = (m: number) => `×${m.toFixed(2)}`;
    let y = 225;
    const header = (t: string) => {
      objects.push(this.add.text(CX, y, t, { fontSize: '17px', color: '#9b59b6', fontStyle: 'bold' }).setOrigin(0.5));
      y += 30;
    };
    const row = (label: string, val: string, active: boolean) => {
      objects.push(this.add.rectangle(CX, y, 580, 28, UI_COLOR.ROW, 0.5));
      objects.push(this.add.text(80, y, label, { fontSize: '15px', color: active ? '#ecf0f1' : '#5d6d7e' }).setOrigin(0, 0.5));
      objects.push(this.add.text(640, y, val, { fontSize: '15px', color: active ? '#f1c40f' : '#5d6d7e', fontStyle: 'bold' }).setOrigin(1, 0.5));
      y += 32;
    };

    // --- Клик ---
    header(tt('👆 СИЛА КЛИКА', '👆 CLICK POWER'));
    const cpsShare = this.state.clickLevel * BALANCE.CLICK_CPS_SHARE_PER_LVL * this.getTotalCps();
    row(tt('База + доля от дохода', 'Base + income share'), `${this.formatNum(Math.round(this.state.clickPower + cpsShare))}`, true);
    const pickM = 1 + BALANCE.PICKAXE_CLICK_BONUS * this.state.pickaxeLevel;
    row(`${tt('⛏️ Легендарная кирка', '⛏️ Legendary Pickaxe')} (${this.state.pickaxeLevel} ${tt('ур', 'lvl')})`, fmt(pickM), this.state.pickaxeLevel > 0);
    row(tt('💠 Дар Мощи', '💠 Gift of Power'), fmt(this.state.perks?.clickMult || 1), (this.state.perks?.clickMult || 1) > 1);
    const metaC = this.getMetaClickMult();
    row(tt('🔮 Мета (эссенция + выборы)', '🔮 Meta (essence + picks)'), fmt(metaC), metaC > 1);
    const wClick = this.getWeatherClickMult();
    row(tt('🌤️ Погода', '🌤️ Weather'), fmt(wClick), wClick !== 1);
    const aClick = this.getArtifactClickMult();
    row(tt('🏺 Артефакты', '🏺 Artifacts'), fmt(aClick), aClick > 1);
    const ev = this.getEventMult();
    row(tt('💰 Событие дня', '💰 Daily event'), fmt(ev), ev > 1);
    const rankC = this.getRankIncomeMult();
    row(tt('💎 Ранги кристалла', '💎 Crystal ranks'), fmt(rankC), rankC > 1);
    const combo = this.getComboMult();
    row(tt('🔥 Комбо (текущее)', '🔥 Combo (current)'), fmt(combo), combo > 1);
    const fren = this.getFrenzyMult();
    row(tt('⚡ Жадеит', '⚡ Jadeite'), fmt(fren), fren > 1);
    row(tt('🎬 Буст Х2', '🎬 Boost ×2'), fmt(this.boostMultiplier), this.boostMultiplier > 1);
    const totalClick = this.getClickPower() * this.boostMultiplier * combo * fren * this.getClickIncomeMult();
    row(tt('ИТОГО за клик', 'TOTAL per click'), this.formatNum(Math.round(totalClick)), true);
    y += 10;

    // --- Доход ---
    header(tt('📈 ДОХОД В СЕКУНДУ', '📈 INCOME PER SECOND'));
    let raw = 0;
    for (const b of BUILDINGS) raw += (this.state.buildings[b.id] || 0) * b.baseCps;
    row(tt('Предприятия (база)', 'Buildings (base)'), `${this.formatNum(raw)}${tt('/с', '/s')}`, raw > 0);
    const mgrs = Object.values(this.state.managers).filter(Boolean).length;
    row(`👔 ${tt('Менеджеры', 'Managers')} (${mgrs} ${tt('шт', 'pcs')})`, tt('×2 за здание', '×2 per building'), mgrs > 0);
    row(tt('💠 Дар Процветания', '💠 Gift of Prosperity'), fmt(this.state.perks?.incomeMultiplier || 1), (this.state.perks?.incomeMultiplier || 1) > 1);
    const aInc = this.getArtifactIncomeMult();
    row(tt('🏺 Артефакты', '🏺 Artifacts'), fmt(aInc), aInc > 1);
    const sets = this.getSetCount();
    row(`⚒️ ${tt('Комплекты', 'Sets')} (${sets} ${tt('шт', 'pcs')})`, fmt(this.getSetBonusMult()), sets > 0);
    row(tt('💎 Ранги кристалла', '💎 Crystal ranks'), fmt(rankC), rankC > 1);
    const metaI = this.getMetaIncomeMult();
    row(tt('🔮 Мета (эссенция + выборы)', '🔮 Meta (essence + picks)'), fmt(metaI), metaI > 1);
    const wInc = this.getWeatherIncomeMult();
    row(tt('🌤️ Погода', '🌤️ Weather'), fmt(wInc), wInc !== 1);
    row(tt('💰 Событие дня', '💰 Daily event'), fmt(ev), ev > 1);
    const achM = this.getAchievementIncomeMult();
    row(`🏆 ${tt('Достижения', 'Achievements')} (${this.state.achievements.length}/${ACHIEVEMENTS.length})`, fmt(achM), achM > 1);
    const iapM = this.state.iap?.doubleIncome ? 2 : 1;
    row(tt('📈 Вечный удвоитель', '📈 Eternal Doubler'), fmt(iapM), iapM > 1);
    row(tt('🎬 Буст Х2', '🎬 Boost ×2'), fmt(this.boostMultiplier), this.boostMultiplier > 1);
    row(tt('ИТОГО', 'TOTAL'), `${this.formatNum(this.getTotalCps())}${tt('/с', '/s')}`, true);
    y += 10;

    const closeBtn = this.add.rectangle(CX, y + 20, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, y + 20, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', () => objects.forEach(o => o.destroy()));
  }

  // --- НАСТРОЙКИ: громкость и частицы ---
  private showSettingsModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 560, 420, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.BORDER)
      .setInteractive(); // поглощает тапы внутри окна, чтобы не закрывать модалку
    const title = this.add.text(CX, 465, t('modal.settings'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title];
    const close = () => objects.forEach(o => o.destroy());
    overlay.on('pointerdown', close);

    // Слайдер громкости: тап/драг по полосе
    objects.push(this.add.text(CX, 540, tt('🔊 Громкость', '🔊 Volume'), { fontSize: '19px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0.5));
    const barW = 380, barY = 580, barX = CX - barW / 2;
    const barBg = this.add.rectangle(CX, barY, barW, 26, UI_COLOR.ROW).setStrokeStyle(1, UI_COLOR.BORDER)
      .setInteractive({ useHandCursor: true });
    const volFill = this.add.rectangle(barX, barY, barW * (this.state.settings.volume / 100), 26, UI_COLOR.GOLD)
      .setOrigin(0, 0.5);
    const volText = this.add.text(CX + barW / 2 + 40, barY, `${this.state.settings.volume}%`, {
      fontSize: '17px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    objects.push(barBg, volFill, volText);
    const setVol = (p: Phaser.Input.Pointer) => {
      const v = Phaser.Math.Clamp(Math.round(((p.x - barX) / barW) * 100), 0, 100);
      this.state.settings.volume = v;
      this.sound.volume = v / 100;
      volFill.setSize(barW * v / 100, 26);
      volText.setText(`${v}%`);
      this.sdk.saveData(this.state);
    };
    barBg.on('pointerdown', setVol);
    barBg.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown) setVol(p); });

    // Переключатель частиц
    const partBtn = this.add.rectangle(CX, 650, 340, 56,
      this.state.settings.particles ? UI_COLOR.BTN_GREEN : UI_COLOR.GRAY)
      .setInteractive({ useHandCursor: true });
    const partText = this.add.text(CX, 650, '', { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const refreshPart = () => {
      const on = this.state.settings.particles;
      partText.setText(`${tt('✨ Частицы', '✨ Particles')}: ${on ? tt('ВКЛ', 'ON') : tt('ВЫКЛ', 'OFF')}`);
      partBtn.setFillStyle(on ? UI_COLOR.BTN_GREEN : UI_COLOR.GRAY);
      if (this.ambientMotes) this.ambientMotes.emitting = on;
    };
    refreshPart();
    objects.push(partBtn, partText);
    partBtn.on('pointerdown', () => {
      this.playClickSound();
      this.state.settings.particles = !this.state.settings.particles;
      refreshPart();
      this.sdk.saveData(this.state);
    });

    const closeBtn = this.add.rectangle(CX, 780, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, 780, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', close);
  }

  // --- СПРАВКА: вся информация об игре, механиках и бонусах ---
  private showHelpModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 660, 1000, UI_COLOR.PANEL_DARK)
      .setStrokeStyle(3, UI_COLOR.BORDER).setInteractive(); // поглощает тапы внутри окна
    const title = this.add.text(CX, 185, t('modal.help'), {
      fontSize: '26px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title];

    const sections: { h: string; lines: string[] }[] = [
      {
        h: tt('⛏️ ОСНОВЫ', '⛏️ BASICS'),
        lines: [
          tt('• Тапай по кристаллу — получай монеты.', '• Tap the crystal — earn coins.'),
          tt('• Покупай предприятия (⛏️) — они приносят доход каждую секунду.', '• Buy buildings (⛏️) — they earn income every second.'),
          tt('• Удар кирки и Легендарная кирка (⚡) усиливают силу клика.', '• Pickaxe Strike and Legendary Pickaxe (⚡) boost click power.'),
          tt('• Удерживай кнопку покупки здания, кирки или удара — скупится максимум.', '• Hold a building, pickaxe or strike buy button — buys the max.')
        ]
      },
      {
        h: tt('👆 КЛИК', '👆 CLICK'),
        lines: [
          tt(`• Сила клика растёт с уровнями кирки и получает долю ${BALANCE.CLICK_CPS_SHARE_PER_LVL * 1000}‰ от дохода/с за уровень — клик не отстаёт от экономики.`, `• Click power grows with pickaxe levels and gains ${BALANCE.CLICK_CPS_SHARE_PER_LVL * 1000}‰ of income/s per level — clicking keeps up with the economy.`),
          tt(`• Комбо: тапы чаще 1 сек растят множитель до ×${(1 + BALANCE.COMBO_CAP * BALANCE.COMBO_STEP).toFixed(0)} (до ×${(1 + BALANCE.COMBO_CAP_TOPAZ * BALANCE.COMBO_STEP).toFixed(0)} на Топазе, +перки эссенции).`, `• Combo: taps faster than 1/s raise the multiplier up to ×${(1 + BALANCE.COMBO_CAP * BALANCE.COMBO_STEP).toFixed(0)} (×${(1 + BALANCE.COMBO_CAP_TOPAZ * BALANCE.COMBO_STEP).toFixed(0)} on Topaz, +essence perks).`),
          tt(`• Критический удар: ${Math.round(BALANCE.CRIT_CHANCE * 100)}% шанс ×${BALANCE.CRIT_MULT} к награде (×2 шанс на Опале).`, `• Critical strike: ${Math.round(BALANCE.CRIT_CHANCE * 100)}% chance for ×${BALANCE.CRIT_MULT} reward (×2 chance on Opal).`)
        ]
      },
      {
        h: tt('🏭 ПРЕДПРИЯТИЯ', '🏭 BUILDINGS'),
        lines: [
          tt(`• Цена растёт ×${BALANCE.BUILDING_COST_GROWTH} за каждое купленное.`, `• Cost grows ×${BALANCE.BUILDING_COST_GROWTH} per purchase.`),
          tt('• Менеджеры (👔 в меню): ×2 к доходу конкретного здания навсегда.', '• Managers (👔 in menu): ×2 income for that building forever.'),
          tt(`• Комплекты: по одному каждого здания = +${Math.round(BALANCE.SET_BONUS_PER_SET * 100)}% дохода за каждый полный комплект.`, `• Sets: one of each building = +${Math.round(BALANCE.SET_BONUS_PER_SET * 100)}% income per full set.`)
        ]
      },
      {
        h: tt('✨ ЭВОЛЮЦИЯ И ДАРЫ', '✨ EVOLUTION & GIFTS'),
        lines: [
          tt('• Кнопка 💎 сбрасывает монеты и здания, но поднимает ранг кристалла (50 рангов до Алмаза-Кроны).', '• The 💎 button resets coins and buildings but raises crystal rank (50 ranks to Diamond Crown).'),
          tt('• Каждый ранг даёт постоянный дар: ×к клику, ×к доходу, скидку на предприятия или стартовых шахтёров.', '• Each rank grants a permanent gift: ×click, ×income, building discount or starting miners.'),
          tt('• Высокие ранги открывают механики: комбо, криты, автокликер, офлайн-доход и др.', '• High ranks unlock mechanics: combo, crits, autoclicker, offline income and more.'),
          tt('• На некоторых рангах — выбор 1 из 2 постоянных бонусов (стекятся).', '• Some ranks offer a choice of 1 of 2 permanent bonuses (they stack).')
        ]
      },
      {
        h: tt('🔮 ЭССЕНЦИЯ', '🔮 ESSENCE'),
        lines: [
          tt('• Эволюция начисляет эссенцию: +1 базово и +1 за каждые 5 рангов.', '• Evolution grants essence: +1 base and +1 per 5 ranks.'),
          tt('• В меню 🔮 — дерево из 8 постоянных перков: доход, клик, крит, сундуки, автокликер, офлайн, скидки, комбо.', '• The 🔮 menu holds a tree of 8 permanent perks: income, click, crit, chests, autoclicker, offline, discounts, combo.')
        ]
      },
      {
        h: tt('🎁 СУНДУКИ И ШАРЫ', '🎁 CHESTS & ORBS'),
        lines: [
          tt('• Каждые 35–55 сек по экрану летит сундук — поймай его тапом.', '• Every 35–55s a chest flies by — catch it with a tap.'),
          tt(`• Золотой сундук (10%): награда ×${BALANCE.CHEST_GOLD_MULT}.`, `• Golden chest (10%): reward ×${BALANCE.CHEST_GOLD_MULT}.`),
          tt(`• С сундуков падают артефакты (${Math.round(BALANCE.ARTIFACT_DROP_CHANCE * 100)}%): 6 предметов с множителями; дубликаты качают их до ур.${BALANCE.ARTIFACT_MAX_LEVEL}.`, `• Chests drop artifacts (${Math.round(BALANCE.ARTIFACT_DROP_CHANCE * 100)}%): 6 items with multipliers; duplicates level them up to lvl ${BALANCE.ARTIFACT_MAX_LEVEL}.`),
          tt(`• Золотой шар: ×${BALANCE.FRENZY_MULT} к клику на ${BALANCE.FRENZY_SECONDS} сек (на Жадеите ×${BALANCE.FRENZY_MULT_JADE} на ${BALANCE.FRENZY_SECONDS_JADE} сек).`, `• Golden orb: ×${BALANCE.FRENZY_MULT} click power for ${BALANCE.FRENZY_SECONDS}s (on Jadeite ×${BALANCE.FRENZY_MULT_JADE} for ${BALANCE.FRENZY_SECONDS_JADE}s).`)
        ]
      },
      {
        h: tt('🌪️ СОБЫТИЯ', '🌪️ EVENTS'),
        lines: [
          tt(`• Волна осколков: каждые ~5 мин кристалл искрит ${BALANCE.SHARD_WAVE_SECONDS} сек — тапы +${Math.round(BALANCE.SHARD_WAVE_BONUS * 100)}%.`, `• Shard wave: every ~5 min the crystal sparks for ${BALANCE.SHARD_WAVE_SECONDS}s — taps +${Math.round(BALANCE.SHARD_WAVE_BONUS * 100)}%.`),
          tt(`• Взлом жилы: шар ⛏️ запускает ${BALANCE.VEIN_SECONDS}-секундный челлендж — чем больше тапов, тем больше награда.`, `• Vein hack: the ⛏️ orb starts a ${BALANCE.VEIN_SECONDS}s challenge — the more taps, the bigger the reward.`),
          tt('• Погода шахты меняется каждый день и влияет на доход, клик, сундуки и дроп артефактов — наведи на строку статуса.', '• Mine weather changes daily, affecting income, clicks, chests and artifact drops — hover the status bar.'),
          tt('• Сб/Вс: награда сундуков ×2. Пятница: офлайн-доход ×3.', '• Sat/Sun: chest reward ×2. Friday: offline income ×3.')
        ]
      },
      {
        h: tt('📜 ЗАДАНИЯ И КОНТРАКТЫ', '📜 QUESTS & CONTRACTS'),
        lines: [
          tt('• Полоса «ЗАДАНИЕ» — последовательные цели с денежной наградой.', '• The "QUEST" bar — sequential goals with coin rewards.'),
          tt('• Контракт — часовое задание: тапы, монеты, покупки, сундуки или комбо. Выполнил — жди следующий часовой слот.', '• A contract is an hourly task: taps, coins, purchases, chests or combo. Done — wait for the next hourly slot.'),
          tt('• 🏆 Достижения — награды за вехи: клики, монеты, сундуки, ранги.', '• 🏆 Achievements — milestone rewards: clicks, coins, chests, ranks.')
        ]
      },
      {
        h: tt('📅 ЕЖЕДНЕВНОЕ', '📅 DAILY'),
        lines: [
          tt('• Заходи каждый день — награда растёт со стриком, сбой обнуляет.', '• Log in daily — the reward grows with your streak, a miss resets it.'),
          tt(`• Офлайн-доход начисляется за время отсутствия (лимит растёт с рангом).`, `• Offline income accrues while away (cap grows with rank).`)
        ]
      },
      {
        h: tt('🎬 РЕКЛАМА', '🎬 ADS'),
        lines: [
          tt(`• Буст Х2: ×${BALANCE.BOOST_MULT} к доходу и кликам на ${BALANCE.BOOST_SECONDS} сек.`, `• Boost ×2: ×${BALANCE.BOOST_MULT} to income and clicks for ${BALANCE.BOOST_SECONDS}s.`),
          tt('• +Сундук: мгновенная награда по формуле золотого сундука.', '• +Chest: instant reward using the golden chest formula.')
        ]
      },
      {
        h: tt('🎨 ПРОЧЕЕ', '🎨 MISC'),
        lines: [
          tt('• Скины кристалла (🎨) — чисто косметические, за монеты.', '• Crystal skins (🎨) — purely cosmetic, bought with coins.'),
          tt('• Счётчик 👆/с справа от кристалла — твоя текущая скорость тапов.', '• The 👆/s counter beside the crystal — your current tap speed.'),
          tt('• 📊 Множители — полная разбивка всех активных бонусов.', '• 📊 Multipliers — a full breakdown of all active bonuses.'),
          tt('• ⚙️ Настройки — громкость и отключение частиц.', '• ⚙️ Settings — volume and particle toggle.')
        ]
      }
    ];

    // Прокручиваемый контент внутри окна
    const viewTop = 225, viewH = 835;
    const content = this.add.container(0, 0);
    let cy = viewTop;
    for (const s of sections) {
      const h = this.add.text(70, cy, s.h, { fontSize: '23px', color: '#f1c40f', fontStyle: 'bold' });
      content.add(h);
      cy += 38;
      for (const line of s.lines) {
        const t = this.add.text(78, cy, line, {
          fontSize: '19px', color: '#dfe6e9', wordWrap: { width: 560 }
        });
        content.add(t);
        cy += t.height + 10;
      }
      cy += 16;
    }
    const contentH = cy - viewTop;

    objects.push(content);

    // GeometryMask в Phaser 4 работает только в Canvas-рендерере, а тут WebGL —
    // поэтому строки, вылезшие за границы области, прячем вручную при каждом скролле
    const updateVisibility = () => {
      content.y = Phaser.Math.Clamp(content.y, Math.min(0, viewH - contentH), 0);
      for (const child of content.list) {
        const go = child as Phaser.GameObjects.Text;
        const top = go.y + content.y;
        const bottom = top + go.height;
        go.setVisible(bottom > viewTop && top < viewTop + viewH);
      }
    };
    updateVisibility();

    // Скролл: драг по зоне контента + колесо мыши
    const scrollZone = this.add.rectangle(CX, viewTop + viewH / 2, 640, viewH, 0, 0.001).setInteractive();
    objects.push(scrollZone);
    let dragY: number | null = null;
    scrollZone.on('pointerdown', (p: Phaser.Input.Pointer) => { dragY = p.y; });
    scrollZone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || dragY === null) return;
      content.y += p.y - dragY;
      dragY = p.y;
      updateVisibility();
    });
    scrollZone.on('pointerup', () => { dragY = null; });
    // Колесо приходит на scene.input
    const wheelHandler = (_p: any, _o: any, _dx: number, dy: number) => {
      content.y -= dy * 0.5;
      updateVisibility();
    };
    this.input.on('wheel', wheelHandler);

    const closeBtn = this.add.rectangle(CX, 1120, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, 1120, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    const destroy = () => {
      this.input.off('wheel', wheelHandler);
      objects.forEach(o => o.destroy());
    };
    closeBtn.on('pointerdown', destroy);
    overlay.on('pointerdown', destroy);
  }

  // --- КОЛЕСО ФОРТУНЫ: ежедневный спин за просмотр рекламы ---
  private showWheelModal(): void {
    const today = Math.floor(Date.now() / DAY_MS);
    const freeUsed = this.state.lastWheelDay >= today;

    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 720, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE)
      .setInteractive();
    const title = this.add.text(CX, 315, t('modal.wheel'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title];

    // Призы колеса — взвешенные сектора
    type Prize = { icon: string; name: string; color: number; weight: number; apply: () => void };
    const cps = Math.max(1, this.getTotalCps());
    let lastCoinPrize = 0; // сумма денежного приза — показывается в строке результата
    const coinPrize = (seconds: number) => () => {
      const r = cps * seconds;
      this.state.coins += r;
      this.state.stats.totalCoinsEarned += r;
      lastCoinPrize = r;
    };
    const prizes: Prize[] = [
      { icon: '💰', name: tt('за 60с', '60s'), color: 0x2980b9, weight: 30, apply: coinPrize(BALANCE.WHEEL_CPS_SMALL) },
      { icon: '🔮', name: '+1', color: 0x8e44ad, weight: 12, apply: () => { this.state.essence += 1; } },
      { icon: '💰', name: tt('за 3мин', '3min'), color: 0x16a085, weight: 22, apply: coinPrize(BALANCE.WHEEL_CPS_MED) },
      { icon: '🔥', name: tt('Буст×2', 'Boost×2'), color: 0xd35400, weight: 15, apply: () => { this.boostMultiplier = BALANCE.BOOST_MULT; this.boostTimeLeft += BALANCE.WHEEL_BOOST_S; } },
      { icon: '🔮', name: '+2', color: 0x2c3e50, weight: 6, apply: () => { this.state.essence += 2; } },
      { icon: '💰', name: tt('за 10мин', '10min'), color: 0xc0392b, weight: 10, apply: coinPrize(BALANCE.WHEEL_CPS_BIG) },
      { icon: '⚡', name: tt('Жадеит', 'Jadeite'), color: 0xf39c12, weight: 5, apply: () => { this.frenzyTimeLeft += BALANCE.FRENZY_SECONDS; } },
    ];

    // Колесо: контейнер крутится, сектора рисуются graphics-секторами
    const wheelC = this.add.container(CX, 620);
    const wg = this.add.graphics();
    const R = 170;
    const n = prizes.length;
    const seg = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      wg.fillStyle(prizes[i].color, 1);
      wg.slice(0, 0, R, i * seg, (i + 1) * seg).fillPath();
      wg.fillStyle(UI_COLOR.BLACK, 0.35);
      wg.slice(0, 0, R, (i + 1) * seg - 0.012, (i + 1) * seg + 0.012).fillPath();
    }
    wg.lineStyle(4, UI_COLOR.GOLD_EDGE, 1).strokeCircle(0, 0, R);
    wg.fillStyle(0x2c3e50, 1).fillCircle(0, 0, 26);
    wg.fillStyle(UI_COLOR.GOLD, 1).fillCircle(0, 0, 17);
    wheelC.add(wg);
    // Подписи секторов — по радиусу от центра
    for (let i = 0; i < n; i++) {
      const mid = i * seg + seg / 2;
      const rLabel = 115;
      const t = this.add.text(Math.cos(mid) * rLabel, Math.sin(mid) * rLabel,
        `${prizes[i].icon}\n${prizes[i].name}`, {
          fontSize: '14px', color: '#fff', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5).setRotation(mid + Math.PI / 2);
      wheelC.add(t);
    }
    objects.push(wheelC);

    // Неподвижный указатель сверху колеса
    const pointer = this.add.graphics()
      .fillStyle(0xf1c40f, 1)
      .fillTriangle(CX, 620 - R + 12, CX - 16, 620 - R - 22, CX + 16, 620 - R - 22)
      .lineStyle(2, 0x7f4f00, 1)
      .strokeTriangle(CX, 620 - R + 12, CX - 16, 620 - R - 22, CX + 16, 620 - R - 22);
    objects.push(pointer);

    // Первый спин в день бесплатный, дальше — за рекламу
    const spinBtn = this.add.rectangle(CX, 860, 400, 62, UI_COLOR.BTN_GREEN)
      .setStrokeStyle(3, UI_COLOR.GREEN_EDGE).setInteractive({ useHandCursor: true });
    const spinText = this.add.text(CX, 860, freeUsed ? t('wheel.ad') : t('wheel.free'), {
      fontSize: '20px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);
    objects.push(spinBtn, spinText);

    const resultText = this.add.text(CX, 918, '', { fontSize: '20px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);
    objects.push(resultText);

    const closeBtn = this.add.rectangle(CX, 960, 260, 46, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, 960, t('btn.close'), { fontSize: '17px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    let spinning = false;
    // Пока колесо крутится, закрывать нельзя: твин и onComplete живут на объектах модалки
    const destroy = () => { if (!spinning) objects.forEach(o => o.destroy()); };
    closeBtn.on('pointerdown', destroy);
    overlay.on('pointerdown', destroy);

    const doSpin = () => {
      if (!spinText.scene) return; // модалка закрылась, пока шла реклама
      spinning = true;
      closeBtn.setAlpha(0.35); // визуально: закрытие недоступно до конца спина
      lastCoinPrize = 0;
      spinText.setText(t('wheel.spinning'));
      // Взвешенный выбор приза — затем докручиваем колесо до его сектора
      const total = prizes.reduce((s, p) => s + p.weight, 0);
      let roll = Math.random() * total;
      let idx = 0;
      for (let i = 0; i < n; i++) { roll -= prizes[i].weight; if (roll <= 0) { idx = i; break; } }
      const picked = prizes[idx];
      // Центр сектора idx должен оказаться под указателем (−90° вверху)
      const sectorCenter = idx * seg + seg / 2;
      const targetAngle = -Math.PI / 2 - sectorCenter;
      const spins = Math.PI * 2 * 5; // 5 полных оборотов
      // Докрутка считается от текущего угла — иначе повторный спин крутился бы назад
      const twoPi = Math.PI * 2;
      const delta = ((targetAngle - wheelC.rotation) % twoPi + twoPi) % twoPi;
      this.tweens.add({
        targets: wheelC,
        rotation: wheelC.rotation + spins + delta,
        duration: 3200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          picked.apply(); // приз начисляем в любом случае — состояние, не UI
          if (!resultText.scene) return; // модалку всё же закрыли — UI не трогаем
          // Денежный приз показываем суммой — иначе «за 60с» без контекста неясно
          resultText.setText(lastCoinPrize > 0
            ? `${tt('Выигрыш', 'Prize')}: +${this.formatNum(lastCoinPrize)} 💰`
            : `${tt('Выигрыш', 'Prize')}: ${picked.icon} ${picked.name}`);
          spinning = false;
          closeBtn.setAlpha(1);
          spinText.setText(t('wheel.ad')); // после первого спина дня — только за рекламу
          this.updateUI();
          this.sdk.saveData(this.state);
        }
      });
    };

    spinBtn.on('pointerdown', () => {
      if (spinning) return;
      this.playClickSound();
      const freeNow = this.state.lastWheelDay < today;
      if (freeNow) {
        this.state.lastWheelDay = today;
        doSpin();
      } else {
        this.runRewarded(doSpin);
      }
    });
  }

  // --- ЛИДЕРБОРД: топ-10 по рангу кристалла ---
  // На платформах с нативным лидербордом (VK) открываем его, иначе свою модалку
  private openLeaderboard(): void {
    if (this.sdk.showNativeLeaderboard?.(this.state.crystalTier)) return;
    this.showLeaderboardModal();
  }

  private showLeaderboardModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 640, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE)
      .setInteractive();
    const title = this.add.text(CX, 380, t('modal.leaderboard'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const sub = this.add.text(CX, 418, tt('Рейтинг по рангу кристалла', 'Ranked by crystal rank'), { fontSize: '15px', color: '#8c98a4' }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title, sub];

    const listText = this.add.text(CX, 600, tt('Загрузка…', 'Loading…'), {
      fontSize: '17px', color: '#ecf0f1', align: 'center', lineSpacing: 8
    }).setOrigin(0.5, 0);
    objects.push(listText);

    const closeBtn = this.add.rectangle(CX, 930, 260, 50, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, 930, t('btn.close'), { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    const destroy = () => objects.forEach(o => o.destroy());
    closeBtn.on('pointerdown', destroy);
    overlay.on('pointerdown', destroy);

    // Сначала отправляем свой рекорд, потом читаем таблицу
    this.sdk.submitLeaderboardScore(this.state.crystalTier, this.state.coins)
      .then(() => this.sdk.getLeaderboardEntries(10))
      .then(entries => {
        if (!listText.scene) return; // модалка закрыта
        if (!entries) {
          const pn = this.sdk.authProviderName;
          listText.setText(pn
            ? tt(`Лидерборд недоступен.\nНужен аккаунт ${L(pn)} и таблица\n«crystalRank» в консоли игры.`, `Leaderboard unavailable.\nA ${L(pn)} account and the\ncrystalRank table are required.`)
            : tt('Лидерборд недоступен\nна этой платформе.', 'Leaderboard is unavailable\non this platform.'));
          return;
        }
        if (entries.length === 0) { listText.setText(tt('Таблица пуста — будь первым!', 'Empty — be the first!')); return; }
        listText.setText(entries.map(e => {
          const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `${e.rank}.`;
          const name = e.name.length > 12 ? e.name.slice(0, 11) + '…' : e.name;
          const coins = e.coins != null ? ` • ${this.formatNum(e.coins)}💰` : '';
          return `${medal} ${name} — ${tt('ранг', 'rank')} ${e.score}${coins}`;
        }).join('\n'));
      });
  }

  // --- ПОДЕЛИТЬСЯ: реферальная ссылка + дневной бонус ---
  private handleShare(): void {
    const today = Math.floor(Date.now() / DAY_MS);
    const url = this.sdk.getShareUrl();
    const tier = CRYSTAL_TIERS[this.state.crystalTier];
    const text = `💎 ${tt('Мой кристалл:', 'My crystal:')} ${tier.icon} ${L(tier.name)}! ${tt('Заходи в игру:', 'Join the game:')} ${url}`;

    // Копируем в буфер — на мобильных navigator.share может не быть
    const bonus = this.state.lastShareDay < today
      ? Math.max(100, Math.round(this.getTotalCps() * BALANCE.SHARE_CPS_FACTOR))
      : 0;
    if (bonus > 0) {
      this.state.coins += bonus;
      this.state.stats.totalCoinsEarned += bonus;
      this.state.lastShareDay = today;
    }

    const copy = navigator.clipboard?.writeText(text);
    if (!copy) { // буфер обмена недоступен — покажем ссылку текстом
      this.spawnFloatingText(CX, 235, `📢 ${url}`, false, true);
      this.updateUI();
      this.sdk.saveData(this.state);
      return;
    }
    copy.then(() => {
      this.spawnFloatingText(CX, 235, bonus > 0
        ? `📢 ${tt('Ссылка скопирована!', 'Link copied!')} +${this.formatNum(bonus)} 💰`
        : `📢 ${tt('Ссылка скопирована!', 'Link copied!')}`, false, true);
      this.updateUI();
      this.sdk.saveData(this.state);
    }).catch(() => {
      this.spawnFloatingText(CX, 235, `📢 ${url}`, false, true);
      this.updateUI();
      this.sdk.saveData(this.state);
    });
  }

  // --- МАГАЗИН: внутриигровые покупки за «Яны» ---
  private showShopModal(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 620, 560, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.GOLD_EDGE)
      .setInteractive();
    const title = this.add.text(CX, 395, t('modal.shop'), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title];
    const destroy = () => objects.forEach(o => o.destroy());

    interface ShopItem { id: string; icon: string; name: string; desc: string; owned: () => boolean; apply: () => void }
    const items: ShopItem[] = [
      {
        id: 'income_x2', icon: '📈', name: tt('Вечный удвоитель', 'Eternal Doubler'),
        desc: tt('Весь доход предприятий ×2 навсегда', 'All building income ×2 forever'),
        owned: () => this.state.iap.doubleIncome,
        apply: () => { this.state.iap.doubleIncome = true; }
      },
      {
        id: 'no_ads', icon: '🚫', name: tt('Отключение рекламы', 'No Ads'),
        desc: tt('Все награды за рекламу выдаются мгновенно', 'All ad rewards are granted instantly'),
        owned: () => this.state.iap.noAds,
        apply: () => { this.state.iap.noAds = true; }
      },
      {
        id: 'essence_pack', icon: '🔮', name: `${tt('Пак эссенции', 'Essence Pack')} +${BALANCE.IAP_ESSENCE_PACK}`,
        desc: `${tt('Мгновенно', 'Instantly')} +${BALANCE.IAP_ESSENCE_PACK} ${tt('эссенции кристалла', 'crystal essence')}`,
        owned: () => false, // расходник — можно покупать повторно
        apply: () => { this.state.essence += BALANCE.IAP_ESSENCE_PACK; }
      },
    ];

    let y = 470;
    const btnRefs: { id: string; btn: Phaser.GameObjects.Rectangle; txt: Phaser.GameObjects.Text }[] = [];
    for (const it of items) {
      objects.push(this.add.rectangle(CX, y, 560, 88, UI_COLOR.ROW).setStrokeStyle(1, UI_COLOR.BORDER));
      objects.push(this.add.text(100, y - 16, `${it.icon} ${it.name}`, { fontSize: '19px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0, 0.5));
      objects.push(this.add.text(100, y + 16, it.desc, { fontSize: '14px', color: '#8c98a4' }).setOrigin(0, 0.5));
      const btn = this.add.rectangle(578, y, 110, 52, UI_COLOR.BTN_GREEN).setInteractive({ useHandCursor: true });
      const txt = this.add.text(578, y, '…', { fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      objects.push(btn, txt);
      btnRefs.push({ id: it.id, btn, txt });
      const item = it;
      btn.on('pointerdown', () => {
        if (item.owned()) return;
        this.playClickSound();
        this.sdk.purchaseItem(item.id).then(ok => {
          if (!ok) return;
          item.apply();
          // Модалка могла быть закрыта, пока шла оплата — объекты уже уничтожены
          if (txt.scene) {
            btn.setFillStyle(UI_COLOR.GRAY).setStrokeStyle(0);
            txt.setText(item.owned() ? t('shop.owned') : '✓ +');
            if (item.id === 'essence_pack') {
              txt.setText(`+${BALANCE.IAP_ESSENCE_PACK} ✓`);
              this.time.delayedCall(1500, () => { if (txt.scene) txt.setText(t('shop.buy')); });
            }
          }
          this.updateUI();
          this.sdk.saveData(this.state);
          this.spawnFloatingText(CX, 240, `🛒 ${item.name} — ${tt('куплено!', 'purchased!')}`, false, true);
        });
      });
      y += 100;
    }

    // Цены из каталога Яндекса (если недоступен — заглушка)
    this.sdk.getShopCatalog().then(catalog => {
      for (const r of btnRefs) {
        if (!r.txt.scene) return;
        const it = items.find(i => i.id === r.id)!;
        if (it.owned()) { r.btn.setFillStyle(UI_COLOR.GRAY).setStrokeStyle(0); r.txt.setText(t('shop.owned')); continue; }
        const p = catalog?.find(c => c.id === r.id);
        r.txt.setText(p ? `${p.price} ₽` : t('shop.buy'));
      }
      if (!catalog && !this.sdk.capabilities.payments) {
        const note = this.add.text(CX, 750, tt('Магазин недоступен на этой\nплатформе', 'The shop is unavailable\non this platform'), {
          fontSize: '14px', color: '#8c98a4', align: 'center'
        }).setOrigin(0.5);
        objects.push(note);
      }
    });

    const closeBtn = this.add.rectangle(CX, 870, 260, 46, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(CX, 870, t('btn.close'), { fontSize: '17px', color: '#fff' }).setOrigin(0.5);
    objects.push(closeBtn, closeText);
    closeBtn.on('pointerdown', destroy);
    overlay.on('pointerdown', destroy);
  }

  // --- ПРЕДЛОЖЕНИЕ АВТОРИЗАЦИИ (гостевой режим) ---
  private showAuthPrompt(): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.85).setInteractive();
    const modal = this.add.rectangle(CX, 640, 560, 380, UI_COLOR.PANEL_DARK).setStrokeStyle(3, UI_COLOR.BORDER)
      .setInteractive();
    const pn = this.sdk.authProviderName ? L(this.sdk.authProviderName) : '';
    const title = this.add.text(CX, 505, tt(`👤 Войти в ${pn}?`, `👤 Sign in to ${pn}?`), { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const desc = this.add.text(CX, 575,
      tt(`Ты играешь как гость — прогресс хранится\nтолько на этом устройстве.\n\nВойди через аккаунт ${pn}, чтобы\nсохранять прогресс в облаке и участвовать\nв лидерборде.`, `You are playing as a guest — progress is\nstored on this device only.\n\nSign in with your ${pn} account to\nsave progress to the cloud and join\nthe leaderboard.`), {
      fontSize: '17px', color: '#dfe6e9', align: 'center'
    }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [overlay, modal, title, desc];
    const destroy = () => objects.forEach(o => o.destroy());

    const loginBtn = this.add.rectangle(CX, 715, 400, 58, UI_COLOR.BTN_GREEN)
      .setStrokeStyle(3, UI_COLOR.GREEN_EDGE).setInteractive({ useHandCursor: true });
    const loginText = this.add.text(CX, 715, tt(`Войти через ${pn}`, `Sign in with ${pn}`), { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const laterBtn = this.add.rectangle(CX, 785, 260, 44, UI_COLOR.GRAY).setInteractive({ useHandCursor: true });
    const laterText = this.add.text(CX, 785, t('btn.later'), { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
    const neverText = this.add.text(CX, 835, tt('Больше не показывать', "Don't ask again"), {
      fontSize: '14px', color: '#7f8c8d'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    objects.push(loginBtn, loginText, laterBtn, laterText, neverText);

    loginBtn.on('pointerdown', () => {
      this.playClickSound();
      this.sdk.openAuthDialog().then(ok => {
        destroy();
        if (ok) {
          this.spawnFloatingText(CX, 235, tt('👤 Вход выполнен! Прогресс в облаке', '👤 Signed in! Progress in the cloud'), false, true);
          this.sdk.saveData(this.state); // сразу заливаем текущий прогресс в облако
        }
      });
    });
    laterBtn.on('pointerdown', destroy);
    // «Больше не показывать» — запоминаем в сейве, диалог не вернётся
    neverText.on('pointerdown', () => {
      this.state.authPromptDismissed = true;
      this.sdk.saveData(this.state);
      destroy();
    });
    overlay.on('pointerdown', destroy);
  }

  // --- 9. ПАНЕЛЬ ЗАДАНИЙ ---
  private createQuestPanel(): void {
    const y = 695; // компактная полоса над вкладками
    this.add.rectangle(CX, y, 680, 56, UI_COLOR.PANEL_DARK).setStrokeStyle(2, UI_COLOR.PURPLE_EDGE);

    this.add.text(46, y - 13, tt('📜 ЗАДАНИЕ', '📜 QUEST'), {
      fontSize: '14px',
      color: '#9b59b6',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.questDescText = this.add.text(46, y + 10, '', {
      fontSize: '17px',
      color: '#ecf0f1'
    }).setOrigin(0, 0.5);

    this.questProgressText = this.add.text(46, y - 13, '', {
      fontSize: '14px',
      color: '#8c98a4'
    }).setOrigin(0, 0.5);
    this.questProgressText.setX(140); // после метки «ЗАДАНИЕ»

    this.questBtn = this.add.rectangle(610, y, 150, 42, UI_COLOR.ROW)
      .setInteractive({ useHandCursor: true });

    this.questBtnText = this.add.text(610, y, '', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.questBtn.on('pointerdown', () => {
      const q = QUESTS[this.state.questIndex];
      if (!q || q.progress(this.state) < q.target) return;

      this.playClickSound();
      this.state.coins += q.reward;
      this.state.stats.totalCoinsEarned += q.reward;
      this.state.questIndex++;

      if (this.state.settings.particles) this.coinBurst.explode(14, 610, y);
      this.spawnFloatingText(610, y, `+${this.formatNum(q.reward)}`, false, true);

      this.updateUI();
      this.sdk.saveData(this.state);
    });

    // Строка коллекции артефактов между заданием и вкладками.
    // Контейнер создан рано — иконки внутри него остаются ПОД модалками
    this.artifactRow = this.add.container(0, 0);
    this.artifactsText = this.add.text(CX, 748, '', {
      fontSize: '16px',
      color: '#f1c40f'
    }).setOrigin(0.5);
    this.artifactRow.add(this.artifactsText);
  }

  // --- 8.5 ПАНЕЛЬ ВКЛАДОК ---
  private createTabs(): void {
    const defs = [
      { key: 'buildings', label: t('tab.buildings') },
      { key: 'upgrades',  label: t('tab.upgrades') },
      { key: 'prestige',  label: t('tab.prestige') },
    ];
    defs.forEach((d, i) => {
      const x = 140 + i * 220;
      const rect = this.add.rectangle(x, 800, 210, 52, UI_COLOR.ROW)
        .setStrokeStyle(2, UI_COLOR.BORDER)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, 800, d.label, { fontSize: '18px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0.5);
      rect.on('pointerdown', () => {
        this.playClickSound();
        this.setTab(d.key);
      });
      this.tabButtons.push({ key: d.key, rect });
    });
    this.setTab('buildings');
  }

  private setTab(key: string): void {
    this.tabBuildings.setVisible(key === 'buildings');
    this.tabUpgrades.setVisible(key === 'upgrades');
    this.tabPrestige.setVisible(key === 'prestige');
    for (const b of this.tabButtons) {
      b.rect.setFillStyle(b.key === key ? UI_COLOR.PURPLE : UI_COLOR.ROW);
      b.rect.setStrokeStyle(2, b.key === key ? UI_COLOR.GOLD : UI_COLOR.BORDER);
    }
  }

  // --- 10. ЕЖЕДНЕВНАЯ НАГРАДА ---
  private checkDailyReward(): void {
    const today = Math.floor(Date.now() / DAY_MS);
    if (this.state.lastDailyDay >= today) return;

    // Стрик продолжается, если последний забор был вчера
    const streak = this.state.lastDailyDay === today - 1 ? this.state.dailyStreak + 1 : 1;
    const day = Math.min(streak, DAILY_REWARDS.length);
    const reward = Math.max(DAILY_REWARDS[day - 1], this.getTotalCps() * BALANCE.DAILY_CPS_FACTOR);

    this.showDailyModal(streak, day, reward, today);
  }

  private showDailyModal(streak: number, day: number, reward: number, today: number): void {
    const overlay = this.add.rectangle(CX, 640, 720, 1280, UI_COLOR.BLACK, 0.75).setInteractive();
    const modal = this.add.rectangle(CX, 640, 580, 470, UI_COLOR.PANEL).setStrokeStyle(3, UI_COLOR.GOLD_EDGE);

    const title = this.add.text(CX, 470, t('modal.daily'), { fontSize: '30px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const info = this.add.text(CX, 530, `${tt('Серия входов', 'Login streak')}: ${streak} ${tt('дн.', 'days')}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    const dots = this.add.text(CX, 575, '●'.repeat(day) + '○'.repeat(DAILY_REWARDS.length - day), { fontSize: '22px', color: '#f39c12' }).setOrigin(0.5);
    const rewardText = this.add.text(CX, 640, `+${this.formatNum(reward)} 💰`, { fontSize: '40px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);

    const claimBtn = this.add.rectangle(CX, 730, 400, 60, UI_COLOR.BTN_GREEN).setStrokeStyle(3, UI_COLOR.GREEN_EDGE).setInteractive({ useHandCursor: true });
    const claimText = this.add.text(CX, 730, t('btn.claim'), { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    claimBtn.on('pointerdown', () => {
      this.playClickSound();
      this.state.coins += reward;
      this.state.stats.totalCoinsEarned += reward;
      this.state.dailyStreak = streak;
      this.state.lastDailyDay = today;

      overlay.destroy();
      modal.destroy();
      title.destroy();
      info.destroy();
      dots.destroy();
      rewardText.destroy();
      claimBtn.destroy();
      claimText.destroy();

      this.updateUI();
      this.sdk.saveData(this.state);
    });
  }

  // --- 11. ВАШ ОБНОВЛЕННЫЙ updateUI() С ИНТЕГРАЦИЕЙ ПРЕСТИЖА ---
  private updateUI(): void {
    const totalCps = this.getTotalCps() * this.boostMultiplier;
    const currentClick = Math.round(this.getClickPower() * this.boostMultiplier * this.getComboMult() * this.getFrenzyMult() * this.getClickIncomeMult());

    // Баланс монет обновляется плавно в update()

    // Доход в секунду — шапка без лишних деталей
    this.cpsText.setText(`+${this.formatNum(totalCps)}${tt('/сек', '/s')}`);

    // Счётчик эссенции
    this.essenceText.setText(this.state.essence > 0 ? `🔮 ${this.state.essence}` : '');

    // Скорость тапов — под индикатором комбо у кристалла
    const taps = this.getTapCps();
    this.tapCpsText.setText(taps > 0 ? `👆 ${taps.toFixed(1)}${tt('/с', '/s')}` : '');

    // Индикатор комбо
    this.comboText.setText(this.comboCount >= 3 ? `🔥 ${tt('КОМБО', 'COMBO')} ×${this.getComboMult().toFixed(1)}` : '');

    // Карточка ежечасного контракта (или отсчёт до следующего)
    const c = this.state.contract;
    this.contractPanel.setVisible(true);
    if (c) {
      const progress = Math.min(c.target, Math.max(0, this.getContractProgress(c)));
      this.contractDescText.setText(this.getContractDesc(c));
      this.contractProgressText.setText(c.type === 'combo'
        ? `×${progress.toFixed(1)} / ×${c.target.toFixed(1)}`
        : `${this.formatNum(Math.floor(progress))} / ${this.formatNum(c.target)}`);
      const left = Math.max(0, Math.ceil((c.deadline - Date.now()) / 1000));
      this.contractTimerText.setText(`⏳ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
    } else {
      const left = Math.max(0, Math.ceil((this.state.nextContractAt - Date.now()) / 1000));
      this.contractDescText.setText(tt('Следующий через', 'Next in'));
      this.contractProgressText.setText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
      this.contractTimerText.setText('');
    }

    // Строка «Удар кирки»: бонус за уровень растёт от Дара Мощи
    const perLevel = 1 + this.state.perks.clickBonus;
    const sharePct = (this.state.clickLevel * BALANCE.CLICK_CPS_SHARE_PER_LVL * 100).toFixed(2);
    this.clickUpgradeInfoText.setText(`💪 ${tt('Удар кирки', 'Pickaxe Strike')} (+${perLevel}/${tt('ур', 'lvl')}, ${this.state.clickLevel} ${tt('ур', 'lvl')})`);
    this.clickUpgradeInfoText2.setText(`${tt('клик', 'click')}: +${this.formatNum(currentClick)} • +${sharePct}% ${tt('от /с', 'of /s')}`);

    // Строка «Легендарная кирка»: множитель клика
    const pickMult = (1 + 0.25 * this.state.pickaxeLevel).toFixed(2);
    this.pickaxeInfoText.setText(`⭐ ${tt('Легенд. кирка', 'Legend. pickaxe')} ×${pickMult} (${this.state.pickaxeLevel} ${tt('ур', 'lvl')})`);

    // Цена апгрейда клика
    const clickCost = this.getClickUpgradeCost();
    this.clickUpgradeCostText.setText(`💰 ${this.formatNum(clickCost)}`);
    this.clickUpgradeBtn.setFillStyle(this.state.coins >= clickCost ? UI_COLOR.BTN_BLUE : UI_COLOR.STEEL);

    // Цена Легендарной кирки
    const pickCost = this.getPickaxeUpgradeCost();
    this.pickaxeUpgradeCostText.setText(`💰 ${this.formatNum(pickCost)}`);
    this.pickaxeUpgradeBtn.setFillStyle(this.state.coins >= pickCost ? 0xb7950b : 0x4d441f);

    // Разделитель предприятий: число полных комплектов и их бонус
    const sets = this.getSetCount();
    this.buildingDividerText.setText(sets > 0
      ? `— ${tt('ПРЕДПРИЯТИЯ', 'BUILDINGS')} · ⚒️ ${tt('КОМПЛЕКТОВ', 'SETS')}: ${sets} (+${Math.round(BALANCE.SET_BONUS_PER_SET * sets * 100)}%) —`
      : tt('— ДОБЫВАЮЩИЕ ПРЕДПРИЯТИЯ —', '— MINING BUILDINGS —'));

    // Обновление строк предприятий
    for (const b of BUILDINGS) {
      const ui = this.buildingUI.get(b.id);
      if (!ui) continue;

      const count = this.state.buildings[b.id] || 0;
      const cost = this.getBuildingCost(b);
      const perkMult = this.state.perks?.incomeMultiplier || 1.0;
      const mgrMult = this.state.managers[b.id] ? 2 : 1;
      const production = Math.round(count * b.baseCps * perkMult * mgrMult * this.getArtifactIncomeMult());
      const mgrMark = mgrMult > 1 ? ' 👔' : '';

      // Текст названия, количества и дохода
      ui.nameText.setText(`${L(b.name)}${mgrMark} (${count} ${tt('шт.', 'pcs')})`);
      ui.prodText.setText(`+${b.baseCps}/с ${tt('за шт.', 'each')} → ${tt('итого', 'total')} +${this.formatNum(production)}/с`);

      // Текст цены на кнопке покупки
      ui.costText.setText(`💰 ${this.formatNum(cost)}`);

      // Подсветка кнопки (синий если хватает, серый если нет)
      if (this.state.coins >= cost) {
        ui.btn.setFillStyle(UI_COLOR.BTN_BLUE);
      } else {
        ui.btn.setFillStyle(UI_COLOR.ROW);
      }
    }

    // Вкладка «Эволюция»: текущий ранг, следующий, кнопка, сводка даров
    const cur = CRYSTAL_TIERS[Math.min(this.state.crystalTier, CRYSTAL_TIERS.length - 1)];
    this.prestigeInfoText.setText(`${cur.icon} ${tt('Ранг', 'Rank')} ${this.state.crystalTier + 1}/${CRYSTAL_TIERS.length}: ${L(cur.name)}`);

    const nextTierIdx = this.state.crystalTier + 1;
    if (nextTierIdx < CRYSTAL_TIERS.length) {
      const nextTier = CRYSTAL_TIERS[nextTierIdx];
      const mechNote = L(nextTier.mech) ? ` • 🔓 ${L(nextTier.mech)}` : '';
      this.prestigeNextText.setText(`${tt('Далее:', 'Next:')} ${nextTier.icon} ${L(nextTier.name)}${mechNote}`);
      const bossPaid = this.state.bossPaidTier === nextTierIdx;
      this.prestigeBtnText.setText(`⚔️ ${tt('Бой за', 'Fight for')} «${L(nextTier.name)}» ${bossPaid ? tt('— оплачено ✓', '— paid ✓') : `(💰${this.formatNum(nextTier.cost)})`}`);

      if (bossPaid || this.state.coins >= nextTier.cost) {
        this.prestigeBtn.setFillStyle(UI_COLOR.PURPLE); // Яркий фиолетовый
        this.prestigeBtn.setStrokeStyle(3, UI_COLOR.GOLD);
      } else {
        this.prestigeBtn.setFillStyle(UI_COLOR.STEEL); // Серый недоступный
        this.prestigeBtn.setStrokeStyle(1, UI_COLOR.ROW);
      }
    } else {
      this.prestigeNextText.setText(tt('Все ранги открыты!', 'All ranks unlocked!'));
      this.prestigeBtnText.setText(tt('👑 Максимальный ранг', '👑 Max rank'));
      this.prestigeBtn.setFillStyle(UI_COLOR.HEADER);
      this.prestigeBtn.setStrokeStyle(2, UI_COLOR.GOLD);
    }

    const p = this.state.perks;
    this.prestigePerksText.setText(
      `${tt('Дары', 'Gifts')}: 💥 ${tt('клик', 'click')} ×${(p?.clickMult || 1).toFixed(2)} • 📈 ${tt('доход', 'income')} ×${(p?.incomeMultiplier || 1).toFixed(2)} • ⛏️ ${tt('цены', 'costs')} −${Math.round((p?.buildingDiscount || 0) * BALANCE.PERK_DISCOUNT * 100)}% • 🔮 ${this.state.essence}`
    );

    // Обновление задания
    const quest = QUESTS[this.state.questIndex];
    if (!quest) {
      this.questDescText.setText(tt('🏆 Все задания выполнены!', '🏆 All quests done!'));
      this.questProgressText.setText('');
      this.questBtn.setFillStyle(UI_COLOR.ROW);
      this.questBtnText.setText('—');
    } else {
      const prog = Math.min(quest.progress(this.state), quest.target);
      const done = prog >= quest.target;
      this.questDescText.setText(L(quest.desc));
      this.questProgressText.setText(`${this.formatNum(prog)} / ${this.formatNum(quest.target)}`);
      this.questBtn.setFillStyle(done ? UI_COLOR.BTN_GREEN : UI_COLOR.ROW);
      this.questBtnText.setText(done ? `${tt('Забрать', 'Claim')} +${this.formatNum(quest.reward)}` : `${this.formatNum(quest.reward)} 💰`);
    }

    // Строка коллекции артефактов — перестраивается только при изменении
    const owned = this.state.artifacts;
    const key = owned.map(id => `${id}:${this.getArtifactLvl(id)}`).join(',');
    if (key !== this.renderedArtifactsKey) {
      this.renderedArtifactsKey = key;
      this.artifactIconTexts.forEach(t => t.destroy());
      this.artifactIconTexts = [];
      this.hideArtifactTooltip();

      if (owned.length) {
        this.artifactsText.setText(`🏺 ${tt('Артефакты', 'Artifacts')} ${owned.length}/${ARTIFACTS.length}: `);
        const iconsW = owned.length * 34;
        let x = 360 - (this.artifactsText.width + iconsW) / 2;
        this.artifactsText.setOrigin(0, 0.5).setX(x);
        x += this.artifactsText.width + 6;

        for (const id of owned) {
          const a = ARTIFACTS.find(v => v.id === id);
          if (!a) continue;
          const iconX = x;
          const lvl = this.getArtifactLvl(id);
          const t = this.add.text(iconX, 748, a.icon, { fontSize: '20px' })
            .setOrigin(0, 0.5)
            .setInteractive();
          t.on('pointerover', () => this.showArtifactTooltip(a, iconX + 12));
          t.on('pointerout', () => this.hideArtifactTooltip());
          this.artifactRow.add(t);
          this.artifactIconTexts.push(t);
          if (lvl > 1) {
            const badge = this.add.text(iconX + 16, 756, `${lvl}`, {
              fontSize: '12px', color: '#f1c40f', fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.artifactRow.add(badge);
            this.artifactIconTexts.push(badge);
          }
          x += 34;
        }
      } else {
        this.artifactsText.setOrigin(0.5, 0.5).setX(360)
          .setText(tt('🏺 Артефакты падают из золотых сундуков 🎁', '🏺 Artifacts drop from golden chests 🎁'));
      }
    }
  }
}