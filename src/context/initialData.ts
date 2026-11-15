/**
 * Pre-Populated Russian Demo Data
 * Feature 8: Personal Finance & Cozy Planner ("Уютный Бюджет / Дневник Финансов")
 */

import {
  Category,
  CurrencyCode,
  DreamGoal,
  ExchangeRates,
  FinanceState,
  RecurringBill,
  Transaction,
} from '../types';
import { DEFAULT_RATES_RUB } from '../utils/currency';

/**
 * 12 Default Categories (8 Expense + 4 Income)
 * Styled with cozy pastel bullet journal colors and Lucide icon names.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // 8 Expense Categories
  {
    id: 'cat-food',
    name: 'Еда и продукты',
    icon: 'ShoppingCart',
    color: '#A3C9A8', // Sage green
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-coffee',
    name: 'Кафе и кофе',
    icon: 'Coffee',
    color: '#F9E29C', // Butter yellow
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-transport',
    name: 'Транспорт',
    icon: 'Bus',
    color: '#F4A28C', // Terracotta coral
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-home',
    name: 'Жилье и уют',
    icon: 'Home',
    color: '#D8C2E8', // Lavender
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-fun',
    name: 'Развлечения',
    icon: 'Smile',
    color: '#F2C6CE', // Dusty rose
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-subs',
    name: 'Подписки',
    icon: 'CreditCard',
    color: '#FFF6D6', // Sticky note cream
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-beauty',
    name: 'Красота и уход',
    icon: 'Sparkles',
    color: '#A3C9A8', // Sage green
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'cat-shop',
    name: 'Шопинг',
    icon: 'ShoppingBag',
    color: '#F4A28C', // Terracotta coral
    type: 'expense',
    isCustom: false,
  },
  // 4 Income Categories
  {
    id: 'cat-job',
    name: 'Основная работа',
    icon: 'Briefcase',
    color: '#A3C9A8',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'cat-side',
    name: 'Подработка',
    icon: 'Clock',
    color: '#F9E29C',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'cat-free',
    name: 'Фриланс',
    icon: 'Laptop',
    color: '#D8C2E8',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'cat-gift',
    name: 'Подарок / Другое',
    icon: 'Gift',
    color: '#F2C6CE',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'cat-family',
    name: 'Помощь родителей',
    icon: 'Heart',
    color: '#F2C6CE',
    type: 'income',
    isCustom: false,
  },
];

/**
 * 8 Realistic Pre-Populated Russian Transactions for November 2026:
 * - 2 Income entries (Salary + Hourly freelance with calculation metadata)
 * - 6 Expense entries (Groceries, Coffee, Transport, Subscription, Home decor)
 */
export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 75000,
    currency: 'RUB',
    category: 'Основная работа',
    date: '2026-11-05T09:00:00Z',
    note: 'Аванс за ноябрь',
    workDetails: {
      hourlyRate: 2500,
      hoursWorked: 30,
      grossAmount: 75000,
      taxPercent: 0,
      taxAmount: 0,
      netAmount: 75000,
    },
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
    note: 'ВкусВилл: сыры и выпечка',
    createdAt: '2026-11-10T12:30:00Z',
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 420,
    currency: 'RUB',
    category: 'Кафе и кофе',
    date: '2026-11-11T10:15:00Z',
    note: 'Даблби: флэт уайт и печенье',
    createdAt: '2026-11-11T10:15:00Z',
  },
  {
    id: 'tx-5',
    type: 'expense',
    amount: 1200,
    currency: 'RUB',
    category: 'Транспорт',
    date: '2026-11-12T08:45:00Z',
    note: 'Пополнение карты «Тройка»',
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
];

/**
 * 3 Pre-Populated Recurring Subscriptions
 */
export const DEFAULT_RECURRING_BILLS: RecurringBill[] = [
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
];

/**
 * 1 Active Dream Goal ("Коплю на мечту")
 */
export const DEFAULT_GOALS: DreamGoal[] = [
  {
    id: 'goal-prague',
    title: 'Поездка в Прагу на каникулы',
    targetAmount: 150000,
    savedAmount: 55000, // 36.7% progress
    currency: 'RUB',
    color: '#F4A28C',
    celebratedMilestones: [25], // 25% reached and celebrated
    createdAt: '2026-11-01T00:00:00Z',
  },
];

/**
 * Base Currency and Default Rates
 */
export const DEFAULT_BASE_CURRENCY: CurrencyCode = 'RUB';
export const DEFAULT_RATES: ExchangeRates = { ...DEFAULT_RATES_RUB };

/**
 * Complete Pre-Populated Initial Demo State
 */
export const initialDemoState: FinanceState = {
  baseCurrency: DEFAULT_BASE_CURRENCY,
  rates: { ...DEFAULT_RATES },
  categories: [...DEFAULT_CATEGORIES],
  transactions: [...DEFAULT_TRANSACTIONS],
  recurringBills: [...DEFAULT_RECURRING_BILLS],
  goals: [...DEFAULT_GOALS],
};

/**
 * Factory returning an isolated, deep clone of initialDemoState
 */
export function createInitialState(): FinanceState {
  return JSON.parse(JSON.stringify(initialDemoState));
}
