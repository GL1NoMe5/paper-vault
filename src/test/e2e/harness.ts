/**
 * E2E Test Harness & Domain State Machine
 * "Уютный Бюджет / Дневник Финансов"
 *
 * Implements isolated state generation, date mocking, mathematical conversions,
 * domain calculations, and in-memory store simulation.
 */

import { vi } from 'vitest';

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type CurrencyCode = 'KZT' | 'RUB' | 'USD' | 'EUR' | 'CZK';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export type ExchangeRates = Record<CurrencyCode, number>;

export type TransactionType = 'expense' | 'income';

export interface CalculationMetadata {
  hourlyRate: number;
  hoursWorked: number;
  formula: string; // e.g. "15 ч. × 2 500 = 37 500"
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  category: string;
  date: string; // ISO string
  note?: string;
  calculationMetadata?: CalculationMetadata;
  subscriptionId?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isCustom?: boolean;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  dayOfMonth: number; // 1-31
  category: string;
  icon?: string;
  color?: string;
  paidMonths: string[]; // e.g. ['2026-11']
  createdAt: string;
}

export interface DreamGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  currency: CurrencyCode;
  icon?: string;
  color?: string;
  celebratedMilestones: number[]; // [25, 50, 75, 100]
  createdAt: string;
}

export type Tab = 'journal' | 'calendar' | 'analytics' | 'goals';

export type SmartTipSeverity = 'warning' | 'info' | 'success';

export interface SmartTip {
  id: string;
  ruleId: 'coffee' | 'subscriptions' | 'overspending' | 'savings_rate' | 'harmony';
  badge: string;
  message: string;
  severity: SmartTipSeverity;
  icon?: string;
}

export interface FinanceState {
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  transactions: Transaction[];
  categories: Category[];
  recurringBills: RecurringBill[];
  goals: DreamGoal[];
}

// ============================================================================
// 2. CURRENCY CONFIGURATION & DICTIONARY
// ============================================================================

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR', 'CZK'];

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  KZT: {
    code: 'KZT',
    symbol: '₸',
    name: 'Казахстанский тенге',
    flag: '🇰🇿',
    decimals: 0,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль',
    flag: '🇷🇺',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Доллар США',
    flag: '🇺🇸',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Евро',
    flag: '🇪🇺',
    decimals: 2,
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Чешская крона',
    flag: '🇨🇿',
    decimals: 0,
  },
};

export const CURRENCIES = CURRENCY_CONFIG;

export const DEFAULT_RATES_RUB: ExchangeRates = {
  RUB: 1.0,
  USD: 92.5,
  EUR: 100.5,
  KZT: 0.188,
  CZK: 3.95,
};

export const DEFAULT_RATES: ExchangeRates = DEFAULT_RATES_RUB;

// ============================================================================
// 3. CURRENCY MATH & FORMATTING
// ============================================================================

export function roundTo(val: number, decimals: number = 2): number {
  if (!Number.isFinite(val) || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  const sign = val < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(val) * factor + Number.EPSILON)) / factor;
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  if (!Number.isFinite(amount) || isNaN(amount)) return 0;
  if (amount === 0 || from === to) return amount;

  const rateFrom = rates?.[from];
  const rateTo = rates?.[to];

  if (!rateFrom || !rateTo || rateFrom <= 0 || rateTo <= 0) {
    return from === to ? amount : 0;
  }

  const converted = amount * (rateFrom / rateTo);
  return roundTo(converted, 8);
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  showDecimals?: boolean
): string {
  if (!Number.isFinite(amount) || isNaN(amount)) {
    amount = 0;
  }

  const config = CURRENCY_CONFIG[currency];
  const symbol = config?.symbol ?? currency;

  const numDecimals = showDecimals !== undefined
    ? (showDecimals ? 2 : 0)
    : (amount % 1 !== 0 ? 2 : 0);

  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: numDecimals,
    maximumFractionDigits: numDecimals,
  })
    .format(amount)
    .replace(/[\u00A0\u202F]/g, ' ');

  return symbol ? `${formattedNumber} ${symbol}` : formattedNumber;
}

export function rebaseRates(oldRates: ExchangeRates, newBase: CurrencyCode): ExchangeRates {
  const baseFactor = oldRates?.[newBase];
  if (!baseFactor || baseFactor <= 0) {
    return { ...oldRates };
  }

  const result: Partial<ExchangeRates> = {};
  for (const c of SUPPORTED_CURRENCIES) {
    if (c === newBase) {
      result[c] = 1.0;
    } else {
      const oldVal = oldRates[c] ?? 1.0;
      result[c] = oldVal / baseFactor;
    }
  }

  return result as ExchangeRates;
}

export function getDefaultRates(baseCurrency: CurrencyCode = 'RUB'): ExchangeRates {
  return rebaseRates(DEFAULT_RATES_RUB, baseCurrency);
}

export function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0;
}

export function parseCurrencyInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || isNaN(num)) return null;
  return num;
}

// ============================================================================
// 4. HOURLY INCOME CALCULATOR
// ============================================================================

export function calculateHourlyIncome(
  hourlyRate: number,
  hoursWorked: number
): { amount: number; formula: string; metadata: CalculationMetadata } {
  if (!Number.isFinite(hourlyRate) || !Number.isFinite(hoursWorked) || hourlyRate < 0 || hoursWorked < 0) {
    return {
      amount: 0,
      formula: '0 ч. × 0 = 0',
      metadata: { hourlyRate: 0, hoursWorked: 0, formula: '0 ч. × 0 = 0' },
    };
  }

  const amount = roundTo(hourlyRate * hoursWorked, 2);

  const formatHours = (h: number) => {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
      .format(h)
      .replace(/[\u00A0\u202F]/g, ' ');
  };

  const formatNum = (n: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })
      .format(n)
      .replace(/[\u00A0\u202F]/g, ' ');
  };

  const formula = `${formatHours(hoursWorked)} ч. × ${formatNum(hourlyRate)} = ${formatNum(amount)}`;

  return {
    amount,
    formula,
    metadata: {
      hourlyRate,
      hoursWorked,
      formula,
    },
  };
}

// ============================================================================
// 5. CALENDAR & SUBSCRIPTIONS
// ============================================================================

export function getEffectiveDay(dayOfMonth: number, year: number, monthIndex: number): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(dayOfMonth, daysInMonth);
}

export function getUpcomingBills(
  bills: RecurringBill[],
  currentDate: Date
): Array<{ bill: RecurringBill; daysLeft: number; label: string }> {
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth(); // 0-indexed
  const currentDay = currentDate.getDate();
  const monthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;

  const results: Array<{ bill: RecurringBill; daysLeft: number; label: string }> = [];

  for (const bill of bills) {
    if (bill.paidMonths?.includes(monthKey)) {
      continue;
    }

    const effectiveDay = getEffectiveDay(bill.dayOfMonth, currentYear, currentMonthIndex);
    const diff = effectiveDay - currentDay;

    if (diff >= 0 && diff <= 5) {
      let label = '';
      if (diff === 0) {
        label = 'Сегодня';
      } else if (diff === 1) {
        label = 'Завтра';
      } else {
        label = `Через ${diff} дн.`;
      }

      results.push({
        bill,
        daysLeft: diff,
        label,
      });
    }
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function getRemainingBillsTotal(
  bills: RecurringBill[],
  monthStr: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
): number {
  let total = 0;
  for (const bill of bills) {
    if (!bill.paidMonths?.includes(monthStr)) {
      total += convertCurrency(bill.amount, bill.currency, baseCurrency, rates);
    }
  }
  return roundTo(total, 2);
}

// ============================================================================
// 6. SMART SAVINGS ADVISOR & ANALYTICS
// ============================================================================

export function calculateMonthlyTotals(
  transactions: Transaction[],
  monthStr: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
): { totalIncome: number; totalExpenses: number; netBalance: number; savingsRate: number } {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.date.startsWith(monthStr)) {
      const inBase = convertCurrency(tx.amount, tx.currency, baseCurrency, rates);
      if (tx.type === 'income') {
        totalIncome += inBase;
      } else if (tx.type === 'expense') {
        totalExpenses += inBase;
      }
    }
  }

  totalIncome = roundTo(totalIncome, 2);
  totalExpenses = roundTo(totalExpenses, 2);
  const netBalance = roundTo(totalIncome - totalExpenses, 2);
  const savingsRate = totalIncome > 0 ? Math.max(0, roundTo((totalIncome - totalExpenses) / totalIncome, 4)) : 0;

  return { totalIncome, totalExpenses, netBalance, savingsRate };
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  monthStr: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
): Array<{ name: string; amount: number; percentage: number }> {
  const map: Record<string, number> = {};
  let total = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.date.startsWith(monthStr)) {
      const inBase = convertCurrency(tx.amount, tx.currency, baseCurrency, rates);
      map[tx.category] = (map[tx.category] || 0) + inBase;
      total += inBase;
    }
  }

  if (total === 0) return [];

  const list: Array<{ name: string; amount: number; percentage: number }> = [];
  for (const [name, amount] of Object.entries(map)) {
    const roundedAmt = roundTo(amount, 2);
    const percentage = roundTo((roundedAmt / total) * 100, 1);
    list.push({ name, amount: roundedAmt, percentage });
  }

  return list.sort((a, b) => b.amount - a.amount);
}

export function getSmartSavingsTips(
  transactions: Transaction[],
  bills: RecurringBill[],
  monthStr: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
): SmartTip[] {
  const { totalIncome, totalExpenses, savingsRate } = calculateMonthlyTotals(
    transactions,
    monthStr,
    baseCurrency,
    rates
  );

  const tips: SmartTip[] = [];

  // Categorized expenses
  let coffeeSpent = 0;
  let subsSpent = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.date.startsWith(monthStr)) {
      const inBase = convertCurrency(tx.amount, tx.currency, baseCurrency, rates);
      if (tx.category === 'Кафе и кофе') {
        coffeeSpent += inBase;
      } else if (tx.category === 'Подписки') {
        subsSpent += inBase;
      }
    }
  }

  // Rule 1: Coffee & Cafes > 15% of total expenses
  if (totalExpenses > 0 && (coffeeSpent / totalExpenses) > 0.15) {
    const pct = Math.round((coffeeSpent / totalExpenses) * 100);
    tips.push({
      id: 'tip-coffee',
      ruleId: 'coffee',
      badge: '☕ Кофеман',
      message: `Расходы на кофе и кафе составляют ${pct}% трат (${formatCurrency(coffeeSpent, baseCurrency)}). Попробуй брать термокружку с собой!`,
      severity: 'warning',
    });
  }

  // Rule 2: Subscriptions > 10% of expenses OR > 3 active bills
  const activeBillsCount = bills.length;
  const subsRatio = totalExpenses > 0 ? (subsSpent / totalExpenses) : 0;
  if (subsRatio > 0.10 || activeBillsCount > 3) {
    const detail = activeBillsCount > 3
      ? `У тебя ${activeBillsCount} активных подписок`
      : `Подписки занимают ${Math.round(subsRatio * 100)}% твоих расходов`;
    tips.push({
      id: 'tip-subs',
      ruleId: 'subscriptions',
      badge: '📑 Подписки',
      message: `${detail}. Проверь, всеми ли сервисами ты действительно пользуешься.`,
      severity: 'info',
    });
  }

  // Rule 3: Overspending > 85% of total income
  if (totalIncome > 0 && (totalExpenses / totalIncome) > 0.85) {
    const pct = Math.round((totalExpenses / totalIncome) * 100);
    tips.push({
      id: 'tip-overspend',
      ruleId: 'overspending',
      badge: '⚠️ Внимание',
      message: `В этом месяце потрачено ${pct}% от заработанного. Рекомендуется замедлить необязательные траты.`,
      severity: 'warning',
    });
  }

  // Rule 4: High Savings > 20% of income (and earned > spent)
  if (totalIncome > 0 && totalExpenses < totalIncome && savingsRate > 0.20) {
    const pct = Math.round(savingsRate * 100);
    const saved = roundTo(totalIncome - totalExpenses, 2);
    tips.push({
      id: 'tip-savings',
      ruleId: 'savings_rate',
      badge: '✨ Отличный темп',
      message: `Ты сохраняешь ${pct}% своего дохода (+${formatCurrency(saved, baseCurrency)}). Отличный повод пополнить мечту!`,
      severity: 'success',
    });
  }

  // Fallback: Harmony if no tips triggered
  if (tips.length === 0) {
    tips.push({
      id: 'tip-harmony',
      ruleId: 'harmony',
      badge: '🌿 Гармония',
      message: 'Твой бюджет в балансе. Продолжай вести дневник и следить за своими целями!',
      severity: 'info',
    });
  }

  return tips;
}

// ============================================================================
// 7. GOAL TRACKER & CELEBRATIONS
// ============================================================================

export function depositToGoal(
  goal: DreamGoal,
  amount: number
): { updatedGoal: DreamGoal; triggeredMilestones: number[] } {
  if (!Number.isFinite(amount) || isNaN(amount) || amount <= 0) {
    return {
      updatedGoal: { ...goal },
      triggeredMilestones: [],
    };
  }

  const oldSaved = goal.savedAmount;
  const newSaved = roundTo(oldSaved + amount, 2);
  const target = goal.targetAmount <= 0 ? 1 : goal.targetAmount;

  const oldPercent = (oldSaved / target) * 100;
  const newPercent = (newSaved / target) * 100;

  const milestones = [25, 50, 75, 100];
  const celebrated = [...(goal.celebratedMilestones || [])];
  const triggered: number[] = [];

  for (const m of milestones) {
    if (oldPercent < m && newPercent >= m && !celebrated.includes(m)) {
      triggered.push(m);
      celebrated.push(m);
    }
  }

  return {
    updatedGoal: {
      ...goal,
      savedAmount: newSaved,
      celebratedMilestones: celebrated,
    },
    triggeredMilestones: triggered,
  };
}

export function calculateGoalProgress(goal: DreamGoal): { percentage: number; remaining: number } {
  const target = goal.targetAmount <= 0 ? 1 : goal.targetAmount;
  const percentage = Math.min(100, roundTo((goal.savedAmount / target) * 100, 1));
  const remaining = Math.max(0, roundTo(goal.targetAmount - goal.savedAmount, 2));
  return { percentage, remaining };
}

// ============================================================================
// 8. DATE & JOURNAL FEED GROUPING
// ============================================================================

export function groupTransactionsByDate(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): Array<{ dateLabel: string; transactions: Transaction[] }> {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Sort transactions descending by date/createdAt
  const sorted = [...transactions].sort((a, b) => {
    return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
  });

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const yesterdayDate = new Date(referenceDate);
  yesterdayDate.setDate(refDay - 1);
  const yestYear = yesterdayDate.getFullYear();
  const yestMonth = yesterdayDate.getMonth();
  const yestDay = yesterdayDate.getDate();

  const groupsMap = new Map<string, Transaction[]>();

  for (const tx of sorted) {
    const d = new Date(tx.date || tx.createdAt);
    const txYear = d.getFullYear();
    const txMonth = d.getMonth();
    const txDay = d.getDate();

    let label = '';
    if (txYear === refYear && txMonth === refMonth && txDay === refDay) {
      label = 'Сегодня';
    } else if (txYear === yestYear && txMonth === yestMonth && txDay === yestDay) {
      label = 'Вчера';
    } else {
      label = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
      }).format(d);
    }

    if (!groupsMap.has(label)) {
      groupsMap.set(label, []);
    }
    groupsMap.get(label)!.push(tx);
  }

  return Array.from(groupsMap.entries()).map(([dateLabel, txs]) => ({
    dateLabel,
    transactions: txs,
  }));
}

// ============================================================================
// 9. DEFAULT RUSSIAN DEMO DATA & STATE
// ============================================================================

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Еда и продукты', icon: 'ShoppingCart', color: '#A3C9A8', type: 'expense' },
  { id: 'cat-coffee', name: 'Кафе и кофе', icon: 'Coffee', color: '#F9E29C', type: 'expense' },
  { id: 'cat-transport', name: 'Транспорт', icon: 'Bus', color: '#F4A28C', type: 'expense' },
  { id: 'cat-home', name: 'Жилье и уют', icon: 'Home', color: '#D8C2E8', type: 'expense' },
  { id: 'cat-fun', name: 'Развлечения', icon: 'Smile', color: '#F2C6CE', type: 'expense' },
  { id: 'cat-subs', name: 'Подписки', icon: 'CreditCard', color: '#FFF6D6', type: 'expense' },
  { id: 'cat-beauty', name: 'Красота и уход', icon: 'Sparkles', color: '#A3C9A8', type: 'expense' },
  { id: 'cat-shop', name: 'Шопинг', icon: 'ShoppingBag', color: '#F4A28C', type: 'expense' },
  { id: 'cat-job', name: 'Основная работа', icon: 'Briefcase', color: '#A3C9A8', type: 'income' },
  { id: 'cat-side', name: 'Подработка', icon: 'Clock', color: '#F9E29C', type: 'income' },
  { id: 'cat-free', name: 'Фриланс', icon: 'Laptop', color: '#D8C2E8', type: 'income' },
  { id: 'cat-gift', name: 'Подарок / Другое', icon: 'Gift', color: '#F2C6CE', type: 'income' },
];

export const initialDemoState: FinanceState = {
  baseCurrency: 'RUB',
  rates: { ...DEFAULT_RATES_RUB },
  categories: [...DEFAULT_CATEGORIES],
  transactions: [
    {
      id: 'tx-1',
      type: 'income',
      amount: 75000,
      currency: 'RUB',
      category: 'Основная работа',
      date: '2026-11-05T09:00:00Z',
      note: 'Аванс за ноябрь',
      createdAt: '2026-11-05T09:00:00Z',
    },
    {
      id: 'tx-2',
      type: 'income',
      amount: 37500,
      currency: 'RUB',
      category: 'Фриланс',
      date: '2026-11-08T15:00:00Z',
      note: 'Дизайн лендинга',
      calculationMetadata: {
        hourlyRate: 2500,
        hoursWorked: 15,
        formula: '15 ч. × 2 500 = 37 500',
      },
      createdAt: '2026-11-08T15:00:00Z',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 4850,
      currency: 'RUB',
      category: 'Еда и продукты',
      date: '2026-11-10T12:30:00Z',
      note: 'Фермерские сыры и выпечка',
      createdAt: '2026-11-10T12:30:00Z',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 420,
      currency: 'RUB',
      category: 'Кафе и кофе',
      date: '2026-11-11T10:15:00Z',
      note: 'Флэт уайт и печенье',
      createdAt: '2026-11-11T10:15:00Z',
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 1200,
      currency: 'RUB',
      category: 'Транспорт',
      date: '2026-11-12T08:45:00Z',
      note: 'Пополнение проездного',
      createdAt: '2026-11-12T08:45:00Z',
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 399,
      currency: 'RUB',
      category: 'Подписки',
      date: '2026-11-05T00:01:00Z',
      note: 'Литрес Подписка',
      subscriptionId: 'sub-litres',
      createdAt: '2026-11-05T00:01:00Z',
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 2800,
      currency: 'RUB',
      category: 'Жилье и уют',
      date: '2026-11-13T14:00:00Z',
      note: 'Теплый вязаный плед',
      createdAt: '2026-11-13T14:00:00Z',
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 350,
      currency: 'RUB',
      category: 'Кафе и кофе',
      date: '2026-11-13T16:20:00Z',
      note: 'Какао с маршмеллоу',
      createdAt: '2026-11-13T16:20:00Z',
    },
  ],
  recurringBills: [
    {
      id: 'sub-litres',
      title: 'Литрес Подписка',
      amount: 399,
      currency: 'RUB',
      dayOfMonth: 5,
      category: 'Подписки',
      color: '#D8C2E8',
      paidMonths: ['2026-11'],
      createdAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'sub-yandex',
      title: 'Яндекс Плюс',
      amount: 299,
      currency: 'RUB',
      dayOfMonth: 15,
      category: 'Подписки',
      color: '#F9E29C',
      paidMonths: [],
      createdAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'sub-internet',
      title: 'Домашний Интернет',
      amount: 750,
      currency: 'RUB',
      dayOfMonth: 17,
      category: 'Жилье и уют',
      color: '#A3C9A8',
      paidMonths: [],
      createdAt: '2026-11-01T00:00:00Z',
    },
  ],
  goals: [
    {
      id: 'goal-prague',
      title: 'Поездка в Прагу на каникулы',
      targetAmount: 150000,
      savedAmount: 55000,
      currency: 'RUB',
      color: '#F4A28C',
      celebratedMilestones: [25],
      createdAt: '2026-11-01T00:00:00Z',
    },
  ],
};

// ============================================================================
// 10. TEST TIME & ISOLATION HELPERS
// ============================================================================

export function createIsolatedState(overrides?: Partial<FinanceState>): FinanceState {
  return {
    ...JSON.parse(JSON.stringify(initialDemoState)),
    ...overrides,
  };
}

export function setTestDate(isoString: string): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoString));
}

export function restoreRealTime(): void {
  vi.useRealTimers();
}

// ============================================================================
// 11. IN-MEMORY STORE SIMULATOR
// ============================================================================

export interface FinanceStore {
  getState: () => FinanceState;
  setBaseCurrency: (code: CurrencyCode) => void;
  updateRates: (newRates: ExchangeRates) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => Category;
  addRecurringBill: (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>) => RecurringBill;
  markBillPaid: (billId: string, month: string) => Transaction | null;
  depositToGoal: (goalId: string, amount: number) => { triggeredMilestones: number[] };
  resetToDemoData: () => void;
  getMonthlyTotals: (monthStr?: string) => { totalIncome: number; totalExpenses: number; netBalance: number; savingsRate: number };
  getUpcomingBills: (currentDate?: Date) => Array<{ bill: RecurringBill; daysLeft: number; label: string }>;
  getRemainingBills: (monthStr?: string) => number;
  getSmartTips: (monthStr?: string) => SmartTip[];
}

export function createFinanceStore(initialState?: FinanceState): FinanceStore {
  let state: FinanceState = initialState ? JSON.parse(JSON.stringify(initialState)) : createIsolatedState();

  const getState = () => state;

  const setBaseCurrency = (code: CurrencyCode) => {
    if (code === state.baseCurrency) return;
    const newRates = rebaseRates(state.rates, code);
    state = {
      ...state,
      baseCurrency: code,
      rates: newRates,
    };
  };

  const updateRates = (newRates: ExchangeRates) => {
    state = {
      ...state,
      rates: { ...newRates, [state.baseCurrency]: 1.0 },
    };
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const sanitizedAmount = Math.max(0, Number.isFinite(tx.amount) ? tx.amount : 0);
    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      amount: sanitizedAmount,
      id,
      createdAt,
    };
    state = {
      ...state,
      transactions: [newTx, ...state.transactions],
    };
    return newTx;
  };

  const deleteTransaction = (id: string) => {
    state = {
      ...state,
      transactions: state.transactions.filter(t => t.id !== id),
    };
  };

  const addCategory = (cat: Omit<Category, 'id'>): Category => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCat: Category = { ...cat, id };
    state = {
      ...state,
      categories: [...state.categories, newCat],
    };
    return newCat;
  };

  const addRecurringBill = (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>): RecurringBill => {
    const id = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const newBill: RecurringBill = { ...bill, id, paidMonths: [], createdAt };
    state = {
      ...state,
      recurringBills: [...state.recurringBills, newBill],
    };
    return newBill;
  };

  const markBillPaid = (billId: string, month: string): Transaction | null => {
    const bill = state.recurringBills.find(b => b.id === billId);
    if (!bill) return null;

    if (bill.paidMonths.includes(month)) {
      return null; // Idempotent guard
    }

    // Update bill
    state = {
      ...state,
      recurringBills: state.recurringBills.map(b =>
        b.id === billId ? { ...b, paidMonths: [...b.paidMonths, month] } : b
      ),
    };

    // Log transaction
    const tx = addTransaction({
      type: 'expense',
      amount: bill.amount,
      currency: bill.currency,
      category: bill.category,
      note: `Оплата: ${bill.title}`,
      date: new Date().toISOString(),
      subscriptionId: bill.id,
    });

    return tx;
  };

  const depositToGoalAction = (goalId: string, amount: number): { triggeredMilestones: number[] } => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return { triggeredMilestones: [] };

    const { updatedGoal, triggeredMilestones } = depositToGoal(goal, amount);
    state = {
      ...state,
      goals: state.goals.map(g => (g.id === goalId ? updatedGoal : g)),
    };
    return { triggeredMilestones };
  };

  const resetToDemoData = () => {
    state = createIsolatedState();
  };

  const getMonthlyTotals = (monthStr: string = '2026-11') => {
    return calculateMonthlyTotals(state.transactions, monthStr, state.baseCurrency, state.rates);
  };

  const getUpcomingBillsList = (currentDate: Date = new Date()) => {
    return getUpcomingBills(state.recurringBills, currentDate);
  };

  const getRemainingBills = (monthStr: string = '2026-11') => {
    return getRemainingBillsTotal(state.recurringBills, monthStr, state.baseCurrency, state.rates);
  };

  const getSmartTips = (monthStr: string = '2026-11') => {
    return getSmartSavingsTips(state.transactions, state.recurringBills, monthStr, state.baseCurrency, state.rates);
  };

  return {
    getState,
    setBaseCurrency,
    updateRates,
    addTransaction,
    deleteTransaction,
    addCategory,
    addRecurringBill,
    markBillPaid,
    depositToGoal: depositToGoalAction,
    resetToDemoData,
    getMonthlyTotals,
    getUpcomingBills: getUpcomingBillsList,
    getRemainingBills,
    getSmartTips,
  };
}
