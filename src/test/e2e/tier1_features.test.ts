/**
 * Tier 1: Feature Coverage E2E Test Suite
 * "Уютный Бюджет / Дневник Финансов"
 *
 * Implements all 32 Tier 1 test specifications from Explorer 2 across F1–F6.
 * Tests requirement-driven behavior, exchange rates math, hourly formulas,
 * calendar clamping, alert windowing, advisor rules, and goal milestone triggers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  convertCurrency,
  formatCurrency,
  rebaseRates,
  calculateHourlyIncome,
  getEffectiveDay,
  getUpcomingBills,
  getRemainingBillsTotal,
  calculateMonthlyTotals,
  calculateCategoryBreakdown,
  getSmartSavingsTips,
  depositToGoal,
  calculateGoalProgress,
  groupTransactionsByDate,
  DEFAULT_CATEGORIES,
  createIsolatedState,
  createFinanceStore,
  setTestDate,
  restoreRealTime,
  CurrencyCode,
  ExchangeRates,
  Transaction,
  RecurringBill,
  DreamGoal,
} from './harness';

describe('Tier 1: Feature Coverage E2E Suite', () => {
  beforeEach(() => {
    setTestDate('2026-11-13T12:00:00.000Z');
  });

  afterEach(() => {
    restoreRealTime();
  });

  // ==========================================================================
  // Module F1: Multi-Currency Engine & Conversions (6 tests)
  // ==========================================================================
  describe('F1: Multi-Currency Engine & Conversions', () => {
    const rates: ExchangeRates = {
      RUB: 1.0,
      USD: 92.5,
      EUR: 100.5,
      KZT: 0.188,
      CZK: 3.95,
    };

    it('TEST-T1-F1-01: Direct Foreign-to-Base Conversion', () => {
      expect(convertCurrency(100, 'USD', 'RUB', rates)).toBe(9250);
      expect(convertCurrency(10000, 'KZT', 'RUB', rates)).toBe(1880);
      expect(convertCurrency(50, 'EUR', 'RUB', rates)).toBe(5025);
      expect(convertCurrency(1000, 'CZK', 'RUB', rates)).toBe(3950);
    });

    it('TEST-T1-F1-02: Cross-Currency Conversion (Non-Base to Non-Base)', () => {
      // 200 USD -> EUR: 200 * (92.5 / 100.5) = 184.0796... -> 184.08
      const resEUR = convertCurrency(200, 'USD', 'EUR', rates);
      expect(resEUR).toBeCloseTo(184.08, 2);

      // 10 000 KZT -> CZK: 10000 * (0.188 / 3.95) = 475.949... -> 475.95
      const resCZK = convertCurrency(10000, 'KZT', 'CZK', rates);
      expect(resCZK).toBeCloseTo(475.95, 2);
    });

    it('TEST-T1-F1-03: Same-Currency Identity Conversion', () => {
      const currencies: CurrencyCode[] = ['RUB', 'USD', 'EUR', 'KZT', 'CZK'];
      const testAmounts = [450.75, 1000000, 0.05];

      for (const c of currencies) {
        for (const amt of testAmounts) {
          expect(convertCurrency(amt, c, c, rates)).toBe(amt);
        }
      }
    });

    it('TEST-T1-F1-04: Currency Formatting with Russian Symbols and Spacing', () => {
      const formattedRUB = formatCurrency(15000, 'RUB');
      const formattedKZT = formatCurrency(15000, 'KZT');
      const formattedUSD = formatCurrency(15000, 'USD');
      const formattedEUR = formatCurrency(15000, 'EUR');
      const formattedCZK = formatCurrency(15000, 'CZK');

      expect(formattedRUB).toMatch(/15[\s\u00A0]?000.*₽/);
      expect(formattedKZT).toMatch(/15[\s\u00A0]?000.*₸/);
      expect(formattedUSD).toMatch(/15[\s\u00A0]?000.*(\$|USD)/);
      expect(formattedEUR).toMatch(/15[\s\u00A0]?000.*(€|EUR)/);
      expect(formattedCZK).toMatch(/15[\s\u00A0]?000.*Kč/);
    });

    it('TEST-T1-F1-05: Base Currency Switching and Rebase Math', () => {
      const newRates = rebaseRates(rates, 'KZT');

      expect(newRates.KZT).toBe(1.0);
      expect(newRates.RUB).toBeCloseTo(1 / 0.188, 3); // ~5.319
      expect(newRates.USD).toBeCloseTo(92.5 / 0.188, 2); // ~492.02

      // Relative ratio invariance: USD to EUR conversion must be identical before and after rebasing
      const convBefore = convertCurrency(100, 'USD', 'EUR', rates);
      const convAfter = convertCurrency(100, 'USD', 'EUR', newRates);
      expect(convAfter).toBe(convBefore);
    });

    it('TEST-T1-F1-06: Manual Exchange Rate Modification', () => {
      const updatedRates: ExchangeRates = { ...rates, USD: 100.0 };
      const converted = convertCurrency(50, 'USD', 'RUB', updatedRates);
      expect(converted).toBe(5000); // 50 * 100 = 5000 (was 50 * 92.5 = 4625)
    });
  });

  // ==========================================================================
  // Module F2: Quick Expense Logging & Custom Categories (5 tests)
  // ==========================================================================
  describe('F2: Quick Expense Logging & Custom Categories', () => {
    it('TEST-T1-F2-01: Pre-Populated Russian Categories', () => {
      const requiredExpenseCategories = [
        'Еда и продукты',
        'Кафе и кофе',
        'Транспорт',
        'Жилье и уют',
        'Развлечения',
        'Подписки',
        'Красота и уход',
        'Шопинг',
      ];

      const requiredIncomeCategories = [
        'Основная работа',
        'Подработка',
        'Фриланс',
        'Подарок / Другое',
      ];

      const categoryNames = DEFAULT_CATEGORIES.map(c => c.name);

      for (const reqExp of requiredExpenseCategories) {
        expect(categoryNames).toContain(reqExp);
        const cat = DEFAULT_CATEGORIES.find(c => c.name === reqExp);
        expect(cat?.type).toBe('expense');
      }

      for (const reqInc of requiredIncomeCategories) {
        expect(categoryNames).toContain(reqInc);
        const cat = DEFAULT_CATEGORIES.find(c => c.name === reqInc);
        expect(cat?.type).toBe('income');
      }
    });

    it('TEST-T1-F2-02: Quick Expense Logging Transaction Creation', () => {
      const store = createFinanceStore();
      const initialTotals = store.getMonthlyTotals('2026-11');

      const newTx = store.addTransaction({
        type: 'expense',
        amount: 450,
        currency: 'RUB',
        category: 'Кафе и кофе',
        note: 'Капучино и круассан',
        date: '2026-11-13T14:30:00Z',
      });

      expect(newTx.id).toBeDefined();
      expect(newTx.id.length).toBeGreaterThan(0);
      expect(newTx.type).toBe('expense');
      expect(newTx.amount).toBe(450);
      expect(newTx.category).toBe('Кафе и кофе');

      const updatedTotals = store.getMonthlyTotals('2026-11');
      expect(updatedTotals.totalExpenses).toBe(initialTotals.totalExpenses + 450);
    });

    it('TEST-T1-F2-03: Custom Category Creation and Persistence', () => {
      const store = createFinanceStore();

      const customCat = store.addCategory({
        name: 'Хобби и книги',
        icon: 'BookOpen',
        color: '#D8C2E8',
        type: 'expense',
        isCustom: true,
      });

      expect(customCat.id).toBeDefined();
      const allCategories = store.getState().categories;
      expect(allCategories.some(c => c.name === 'Хобби и книги')).toBe(true);

      const tx = store.addTransaction({
        type: 'expense',
        amount: 1200,
        currency: 'RUB',
        category: 'Хобби и книги',
        date: '2026-11-13T12:00:00Z',
      });

      expect(tx.category).toBe('Хобби и книги');
    });

    it('TEST-T1-F2-04: Date-Grouped Feed Categorization', () => {
      const refDate = new Date('2026-11-13T12:00:00.000Z');

      const tx1: Transaction = {
        id: 'tx-today',
        type: 'expense',
        amount: 500,
        currency: 'RUB',
        category: 'Еда и продукты',
        date: '2026-11-13T10:00:00Z',
        createdAt: '2026-11-13T10:00:00Z',
      };

      const tx2: Transaction = {
        id: 'tx-yesterday',
        type: 'expense',
        amount: 300,
        currency: 'RUB',
        category: 'Кафе и кофе',
        date: '2026-11-12T18:00:00Z',
        createdAt: '2026-11-12T18:00:00Z',
      };

      const tx3: Transaction = {
        id: 'tx-older',
        type: 'expense',
        amount: 1500,
        currency: 'RUB',
        category: 'Транспорт',
        date: '2026-11-10T14:00:00Z',
        createdAt: '2026-11-10T14:00:00Z',
      };

      const groups = groupTransactionsByDate([tx3, tx1, tx2], refDate);

      const labels = groups.map(g => g.dateLabel);
      expect(labels).toEqual(['Сегодня', 'Вчера', '10 ноября']);

      const todayGroup = groups.find(g => g.dateLabel === 'Сегодня');
      expect(todayGroup?.transactions).toContainEqual(tx1);

      const yesterdayGroup = groups.find(g => g.dateLabel === 'Вчера');
      expect(yesterdayGroup?.transactions).toContainEqual(tx2);

      const olderGroup = groups.find(g => g.dateLabel === '10 ноября');
      expect(olderGroup?.transactions).toContainEqual(tx3);
    });

    it('TEST-T1-F2-05: Transaction Deletion and Balance Rollback', () => {
      const store = createFinanceStore();

      const tx = store.addTransaction({
        type: 'expense',
        amount: 2500,
        currency: 'RUB',
        category: 'Шопинг',
        date: '2026-11-13T12:00:00Z',
      });

      const totalsBeforeDelete = store.getMonthlyTotals('2026-11');
      store.deleteTransaction(tx.id);

      const stateAfter = store.getState();
      expect(stateAfter.transactions.some(t => t.id === tx.id)).toBe(false);

      const totalsAfterDelete = store.getMonthlyTotals('2026-11');
      expect(totalsAfterDelete.totalExpenses).toBe(totalsBeforeDelete.totalExpenses - 2500);
      expect(totalsAfterDelete.netBalance).toBe(totalsBeforeDelete.netBalance + 2500);
    });
  });

  // ==========================================================================
  // Module F3: Hourly Income Calculator & Metadata (5 tests)
  // ==========================================================================
  describe('F3: Hourly Income Calculator & Metadata', () => {
    it('TEST-T1-F3-01: Standard Hourly Income Calculation', () => {
      const result = calculateHourlyIncome(2500, 15);
      expect(result.amount).toBe(37500);
    });

    it('TEST-T1-F3-02: Fractional Hours Calculation', () => {
      const res1 = calculateHourlyIncome(3000, 7.5);
      expect(res1.amount).toBe(22500); // 3000 * 7.5 = 22500

      const res2 = calculateHourlyIncome(2200, 4.25);
      expect(res2.amount).toBe(9350); // 2200 * 4.25 = 9350
    });

    it('TEST-T1-F3-03: Exact Formula Metadata String Formatting', () => {
      const result = calculateHourlyIncome(2500, 15);
      // Matches "15 ч. × 2 500 = 37 500" with regular or non-breaking spaces
      expect(result.formula).toMatch(/15\s*ч\.\s*×\s*2[\s\u00A0]?500\s*=\s*37[\s\u00A0]?500/);
    });

    it('TEST-T1-F3-04: Income Source Attribution', () => {
      const store = createFinanceStore();
      const calc = calculateHourlyIncome(2500, 15);

      const tx = store.addTransaction({
        type: 'income',
        amount: calc.amount,
        currency: 'RUB',
        category: 'Фриланс',
        calculationMetadata: calc.metadata,
        date: '2026-11-13T12:00:00Z',
      });

      expect(tx.type).toBe('income');
      expect(tx.category).toBe('Фриланс');
      expect(tx.calculationMetadata?.formula).toBe(calc.formula);
      expect(tx.calculationMetadata?.hourlyRate).toBe(2500);
      expect(tx.calculationMetadata?.hoursWorked).toBe(15);
    });

    it('TEST-T1-F3-05: Total Earned Balance Updates', () => {
      const store = createFinanceStore();
      const initialTotals = store.getMonthlyTotals('2026-11');

      const calc = calculateHourlyIncome(2500, 15); // 37500
      store.addTransaction({
        type: 'income',
        amount: calc.amount,
        currency: 'RUB',
        category: 'Фриланс',
        calculationMetadata: calc.metadata,
        date: '2026-11-13T12:00:00Z',
      });

      const updatedTotals = store.getMonthlyTotals('2026-11');
      expect(updatedTotals.totalIncome).toBe(initialTotals.totalIncome + 37500);
      expect(updatedTotals.netBalance).toBe(initialTotals.netBalance + 37500);
    });
  });

  // ==========================================================================
  // Module F4: Subscriptions, Due Alerts & Month-End Clamping (5 tests)
  // ==========================================================================
  describe('F4: Subscriptions, Due Alerts & Month-End Clamping', () => {
    it('TEST-T1-F4-01: Subscriptions Schedule Initialization', () => {
      const state = createIsolatedState();
      const bills = state.recurringBills;

      expect(bills.length).toBe(3);
      for (const bill of bills) {
        expect(bill.dayOfMonth).toBeGreaterThanOrEqual(1);
        expect(bill.dayOfMonth).toBeLessThanOrEqual(31);
        expect(Array.isArray(bill.paidMonths)).toBe(true);
      }
    });

    it('TEST-T1-F4-02: 5-Day "Скоро списание" Alert Window', () => {
      const testDate = new Date('2026-11-13T10:00:00.000Z');

      const bills: RecurringBill[] = [
        {
          id: 'b1',
          title: 'Яндекс Плюс',
          amount: 299,
          currency: 'RUB',
          dayOfMonth: 15, // Due in 2 days (Nov 15) -> Triggered!
          category: 'Подписки',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
        {
          id: 'b2',
          title: 'Домашний Интернет',
          amount: 750,
          currency: 'RUB',
          dayOfMonth: 17, // Due in 4 days (Nov 17) -> Triggered!
          category: 'Жилье и уют',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
        {
          id: 'b3',
          title: 'Фитнес',
          amount: 2500,
          currency: 'RUB',
          dayOfMonth: 20, // Due in 7 days (Nov 20) -> Excluded (> 5)
          category: 'Красота и уход',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
        {
          id: 'b4',
          title: 'Литрес',
          amount: 399,
          currency: 'RUB',
          dayOfMonth: 14, // Due in 1 day, BUT already paid!
          category: 'Подписки',
          paidMonths: ['2026-11'],
          createdAt: '2026-11-01',
        },
      ];

      const upcoming = getUpcomingBills(bills, testDate);
      const upcomingTitles = upcoming.map(u => u.bill.title);

      expect(upcomingTitles).toContain('Яндекс Плюс');
      expect(upcomingTitles).toContain('Домашний Интернет');
      expect(upcomingTitles).not.toContain('Фитнес');
      expect(upcomingTitles).not.toContain('Литрес');

      const yandexAlert = upcoming.find(u => u.bill.title === 'Яндекс Плюс');
      expect(yandexAlert?.daysLeft).toBe(2);
      expect(yandexAlert?.label).toBe('Через 2 дн.');
    });

    it('TEST-T1-F4-03: Month-End Clamping for 30-Day and 28-Day Months', () => {
      // November has 30 days (monthIndex = 10)
      const dayNov = getEffectiveDay(31, 2026, 10);
      expect(dayNov).toBe(30);

      // February 2026 has 28 days (monthIndex = 1)
      const dayFeb = getEffectiveDay(31, 2026, 1);
      expect(dayFeb).toBe(28);
    });

    it('TEST-T1-F4-04: One-Tap "Оплачено в этом месяце" Action', () => {
      const store = createFinanceStore();
      const bill = store.addRecurringBill({
        title: 'Spotify',
        amount: 1490,
        currency: 'KZT',
        dayOfMonth: 15,
        category: 'Подписки',
      });

      const tx = store.markBillPaid(bill.id, '2026-11');

      expect(tx).toBeDefined();
      expect(tx?.type).toBe('expense');
      expect(tx?.amount).toBe(1490);
      expect(tx?.currency).toBe('KZT');
      expect(tx?.note).toContain('Spotify');

      const updatedBill = store.getState().recurringBills.find(b => b.id === bill.id);
      expect(updatedBill?.paidMonths).toContain('2026-11');

      // Bill should no longer appear in upcoming alerts
      const upcoming = store.getUpcomingBills(new Date('2026-11-13'));
      expect(upcoming.some(u => u.bill.id === bill.id)).toBe(false);
    });

    it('TEST-T1-F4-05: Monthly Remaining Bills Metric', () => {
      const rates: ExchangeRates = { RUB: 1.0, USD: 92.5, EUR: 100.5, KZT: 0.188, CZK: 3.95 };
      const bills: RecurringBill[] = [
        {
          id: 'bA',
          title: 'Сервис А',
          amount: 500,
          currency: 'RUB',
          dayOfMonth: 10,
          category: 'Подписки',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
        {
          id: 'bB',
          title: 'Сервис Б',
          amount: 1000,
          currency: 'RUB',
          dayOfMonth: 20,
          category: 'Подписки',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
        {
          id: 'bC',
          title: 'Сервис В (оплачен)',
          amount: 300,
          currency: 'RUB',
          dayOfMonth: 5,
          category: 'Подписки',
          paidMonths: ['2026-11'],
          createdAt: '2026-11-01',
        },
      ];

      const remaining = getRemainingBillsTotal(bills, '2026-11', 'RUB', rates);
      expect(remaining).toBe(1500); // 500 + 1000
    });
  });

  // ==========================================================================
  // Module F5: Smart Savings Advisor & Financial Analytics (6 tests)
  // ==========================================================================
  describe('F5: Smart Savings Advisor & Financial Analytics', () => {
    const rates: ExchangeRates = { RUB: 1.0, USD: 92.5, EUR: 100.5, KZT: 0.188, CZK: 3.95 };

    it('TEST-T1-F5-01: Earned vs Spent Comparison Card Metrics', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'income', amount: 60000, currency: 'RUB', category: 'Основная работа', date: '2026-11-05', createdAt: '2026-11-05' },
        { id: '2', type: 'income', amount: 40000, currency: 'RUB', category: 'Фриланс', date: '2026-11-10', createdAt: '2026-11-10' },
        { id: '3', type: 'expense', amount: 35000, currency: 'RUB', category: 'Жилье и уют', date: '2026-11-08', createdAt: '2026-11-08' },
        { id: '4', type: 'expense', amount: 15000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-12', createdAt: '2026-11-12' },
      ];

      const totals = calculateMonthlyTotals(txs, '2026-11', 'RUB', rates);

      expect(totals.totalIncome).toBe(100000);
      expect(totals.totalExpenses).toBe(50000);
      expect(totals.netBalance).toBe(50000);
      expect(totals.savingsRate).toBe(0.5); // 50%
    });

    it('TEST-T1-F5-02: Category Donut Chart Aggregation', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', amount: 30000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-05', createdAt: '2026-11-05' },
        { id: '2', type: 'expense', amount: 10000, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-08', createdAt: '2026-11-08' },
        { id: '3', type: 'expense', amount: 10000, currency: 'RUB', category: 'Транспорт', date: '2026-11-10', createdAt: '2026-11-10' },
      ];

      const breakdown = calculateCategoryBreakdown(txs, '2026-11', 'RUB', rates);

      expect(breakdown).toHaveLength(3);
      expect(breakdown[0].name).toBe('Еда и продукты');
      expect(breakdown[0].amount).toBe(30000);
      expect(breakdown[0].percentage).toBe(60);

      const totalPercentage = breakdown.reduce((acc, item) => acc + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('TEST-T1-F5-03: Advisor Rule 1 — Coffee & Cafes (> 15% of Expenses)', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'income', amount: 50000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 8000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-05', createdAt: '2026-11-05' },
        { id: '3', type: 'expense', amount: 2000, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-07', createdAt: '2026-11-07' },
      ];
      // Total expenses = 10 000, coffee = 2 000 (20% > 15%)

      const tips = getSmartSavingsTips(txs, [], '2026-11', 'RUB', rates);
      const coffeeTip = tips.find(t => t.ruleId === 'coffee');

      expect(coffeeTip).toBeDefined();
      expect(coffeeTip?.badge).toContain('Кофеман');
      expect(coffeeTip?.message).toContain('20%');
    });

    it('TEST-T1-F5-04: Advisor Rule 2 — Subscriptions (> 10% OR > 3 Services)', () => {
      // Test A: Spending > 10% on subscriptions
      const txsA: Transaction[] = [
        { id: '1', type: 'income', amount: 50000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 8500, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-05', createdAt: '2026-11-05' },
        { id: '3', type: 'expense', amount: 1500, currency: 'RUB', category: 'Подписки', date: '2026-11-06', createdAt: '2026-11-06' },
      ];
      const tipsA = getSmartSavingsTips(txsA, [], '2026-11', 'RUB', rates);
      expect(tipsA.some(t => t.ruleId === 'subscriptions')).toBe(true);

      // Test B: More than 3 active subscription services
      const fourBills: RecurringBill[] = [
        { id: '1', title: 'Sub1', amount: 100, currency: 'RUB', dayOfMonth: 5, category: 'Подписки', paidMonths: [], createdAt: '2026-11-01' },
        { id: '2', title: 'Sub2', amount: 100, currency: 'RUB', dayOfMonth: 10, category: 'Подписки', paidMonths: [], createdAt: '2026-11-01' },
        { id: '3', title: 'Sub3', amount: 100, currency: 'RUB', dayOfMonth: 15, category: 'Подписки', paidMonths: [], createdAt: '2026-11-01' },
        { id: '4', title: 'Sub4', amount: 100, currency: 'RUB', dayOfMonth: 20, category: 'Подписки', paidMonths: [], createdAt: '2026-11-01' },
      ];
      const tipsB = getSmartSavingsTips([], fourBills, '2026-11', 'RUB', rates);
      expect(tipsB.some(t => t.ruleId === 'subscriptions')).toBe(true);
    });

    it('TEST-T1-F5-05: Advisor Rule 3 & Rule 4 — Overspending (> 85%) & High Savings (> 20%)', () => {
      // Overspend Scenario: Spent 90 000 out of 100 000 (90% > 85%)
      const txsOverspend: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 90000, currency: 'RUB', category: 'Шопинг', date: '2026-11-05', createdAt: '2026-11-05' },
      ];
      const tipsOverspend = getSmartSavingsTips(txsOverspend, [], '2026-11', 'RUB', rates);
      const overspendTip = tipsOverspend.find(t => t.ruleId === 'overspending');
      expect(overspendTip).toBeDefined();
      expect(overspendTip?.badge).toContain('Внимание');
      expect(overspendTip?.message).toContain('90%');

      // High Savings Scenario: Spent 40 000 out of 100 000 (Saved 60% > 20%)
      const txsSavings: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 40000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-05', createdAt: '2026-11-05' },
      ];
      const tipsSavings = getSmartSavingsTips(txsSavings, [], '2026-11', 'RUB', rates);
      const savingsTip = tipsSavings.find(t => t.ruleId === 'savings_rate');
      expect(savingsTip).toBeDefined();
      expect(savingsTip?.badge).toContain('Отличный темп');
      expect(savingsTip?.message).toContain('60%');
    });

    it('TEST-T1-F5-06: Advisor Rule 5 — Fallback Cozy Balance ("🌿 Гармония")', () => {
      // Balanced budget: Spent 82 000 out of 100 000 (82% <= 85%, savings 18% <= 20%)
      // Coffee: 5 000 (6.1% <= 15%), Subscriptions: 1 bill (3 000, 3.6% <= 10%)
      const txs: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 74000, currency: 'RUB', category: 'Жилье и уют', date: '2026-11-05', createdAt: '2026-11-05' },
        { id: '3', type: 'expense', amount: 5000, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-08', createdAt: '2026-11-08' },
        { id: '4', type: 'expense', amount: 3000, currency: 'RUB', category: 'Подписки', date: '2026-11-10', createdAt: '2026-11-10' },
      ];
      const oneBill: RecurringBill[] = [
        { id: 'b1', title: 'Интернет', amount: 3000, currency: 'RUB', dayOfMonth: 10, category: 'Подписки', paidMonths: ['2026-11'], createdAt: '2026-11-01' },
      ];

      const tips = getSmartSavingsTips(txs, oneBill, '2026-11', 'RUB', rates);
      expect(tips).toHaveLength(1);
      expect(tips[0].ruleId).toBe('harmony');
      expect(tips[0].badge).toContain('Гармония');
    });
  });

  // ==========================================================================
  // Module F6: Goal Tracker & Celebration Milestones (5 tests)
  // ==========================================================================
  describe('F6: Goal Tracker & Celebration Milestones', () => {
    it('TEST-T1-F6-01: Goal Tracker Representation & Remaining Amount', () => {
      const goal: DreamGoal = {
        id: 'g1',
        title: 'Новый ноутбук',
        targetAmount: 150000,
        savedAmount: 45000,
        currency: 'RUB',
        celebratedMilestones: [],
        createdAt: '2026-11-01',
      };

      const progress = calculateGoalProgress(goal);
      expect(progress.remaining).toBe(105000); // 150000 - 45000
      expect(progress.percentage).toBe(30); // 45000 / 150000 * 100
    });

    it('TEST-T1-F6-02: Quick Deposit Actions (+5 000, +10 000, +50 000)', () => {
      let goal: DreamGoal = {
        id: 'g1',
        title: 'Копилка',
        targetAmount: 100000,
        savedAmount: 20000,
        currency: 'RUB',
        celebratedMilestones: [],
        createdAt: '2026-11-01',
      };

      // +5 000
      let res = depositToGoal(goal, 5000);
      goal = res.updatedGoal;
      expect(goal.savedAmount).toBe(25000);

      // +10 000
      res = depositToGoal(goal, 10000);
      goal = res.updatedGoal;
      expect(goal.savedAmount).toBe(35000);

      // +50 000
      res = depositToGoal(goal, 50000);
      goal = res.updatedGoal;
      expect(goal.savedAmount).toBe(85000);
    });

    it('TEST-T1-F6-03: Milestone Celebration Trigger at 25% Threshold', () => {
      const goal: DreamGoal = {
        id: 'g1',
        title: 'Отпуск',
        targetAmount: 100000,
        savedAmount: 20000, // 20%
        currency: 'RUB',
        celebratedMilestones: [],
        createdAt: '2026-11-01',
      };

      // Deposit 6000 -> 26 000 (26% crosses 25%)
      const result = depositToGoal(goal, 6000);

      expect(result.triggeredMilestones).toContain(25);
      expect(result.updatedGoal.celebratedMilestones).toContain(25);
    });

    it('TEST-T1-F6-04: Milestone Celebration Triggers at 50%, 75%, 100%', () => {
      let goal: DreamGoal = {
        id: 'g1',
        title: 'Курс обучения',
        targetAmount: 100000,
        savedAmount: 45000, // 45%
        currency: 'RUB',
        celebratedMilestones: [25],
        createdAt: '2026-11-01',
      };

      // Cross 50%
      let res = depositToGoal(goal, 10000); // 55 000 (55%)
      expect(res.triggeredMilestones).toEqual([50]);
      goal = res.updatedGoal;

      // Cross 75%
      res = depositToGoal(goal, 20000); // 75 000 (75%)
      expect(res.triggeredMilestones).toEqual([75]);
      goal = res.updatedGoal;

      // Cross 100%
      res = depositToGoal(goal, 25000); // 100 000 (100%)
      expect(res.triggeredMilestones).toEqual([100]);
    });

    it('TEST-T1-F6-05: Milestone Deduplication (No Spamming)', () => {
      const goal: DreamGoal = {
        id: 'g1',
        title: 'Мечта',
        targetAmount: 100000,
        savedAmount: 20000, // 20%
        currency: 'RUB',
        celebratedMilestones: [25], // 25% was celebrated previously
        createdAt: '2026-11-01',
      };

      // Deposit 6000 -> 26 000 (26% crosses the 25% threshold again)
      const res = depositToGoal(goal, 6000);

      // Must NOT re-trigger milestone 25!
      expect(res.triggeredMilestones).toHaveLength(0);
      expect(res.updatedGoal.celebratedMilestones).toEqual([25]);
    });
  });
});
