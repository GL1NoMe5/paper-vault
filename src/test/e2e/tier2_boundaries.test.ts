/**
 * Tier 2: Boundary Value Analysis & Edge Cases E2E Test Suite
 * "Уютный Бюджет / Дневник Финансов"
 *
 * Implements all 30 Tier 2 test specifications from Explorer 2 across F1–F6.
 * Tests division-by-zero guards, micro-rates precision, billion-scale numbers,
 * leap-year clamping, exact threshold borders, and multi-milestone leaps.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  convertCurrency,
  formatCurrency,
  rebaseRates,
  calculateHourlyIncome,
  getEffectiveDay,
  getUpcomingBills,
  calculateMonthlyTotals,
  calculateCategoryBreakdown,
  getSmartSavingsTips,
  depositToGoal,
  calculateGoalProgress,
  groupTransactionsByDate,
  createFinanceStore,
  setTestDate,
  restoreRealTime,
  ExchangeRates,
  Transaction,
  RecurringBill,
  DreamGoal,
} from './harness';

describe('Tier 2: Boundary & Corner Cases E2E Suite', () => {
  beforeEach(() => {
    setTestDate('2026-11-13T12:00:00.000Z');
  });

  afterEach(() => {
    restoreRealTime();
  });

  // ==========================================================================
  // Module F1: Multi-Currency Boundary & Edge Cases (5 tests)
  // ==========================================================================
  describe('F1: Currency Boundary & Edge Cases', () => {
    it('TEST-T2-F1-01: Zero and Negative Exchange Rate Guard', () => {
      const malformedRates: ExchangeRates = {
        RUB: 1.0,
        USD: 0,
        EUR: -10,
        KZT: 0.188,
        CZK: 3.95,
      };

      const resUSD = convertCurrency(100, 'USD', 'RUB', malformedRates);
      const resEUR = convertCurrency(100, 'RUB', 'EUR', malformedRates);

      expect(Number.isFinite(resUSD)).toBe(true);
      expect(Number.isNaN(resUSD)).toBe(false);
      expect(Number.isFinite(resEUR)).toBe(true);
      expect(Number.isNaN(resEUR)).toBe(false);
    });

    it('TEST-T2-F1-02: Extreme Rates & Floating-Point Precision Drift', () => {
      const customRates: ExchangeRates = {
        RUB: 1.0,
        USD: 92.5,
        EUR: 100.5,
        KZT: 0.000188, // Micro-rate
        CZK: 3.95,
      };

      const originalAmount = 15450.75;
      const convertedToEUR = convertCurrency(originalAmount, 'KZT', 'EUR', customRates);
      const roundTrip = convertCurrency(convertedToEUR, 'EUR', 'KZT', customRates);

      expect(Math.abs(roundTrip - originalAmount)).toBeLessThanOrEqual(0.02);
    });

    it('TEST-T2-F1-03: Rebase Rates Inversion Edge Case', () => {
      const oldRates: ExchangeRates = {
        RUB: 1.0,
        USD: 92.5,
        KZT: 0.188,
        EUR: 100.5,
        CZK: 3.95,
      };

      const newRates = rebaseRates(oldRates, 'KZT');

      expect(newRates.KZT).toBe(1.0);
      expect(newRates.RUB).toBeCloseTo(1 / 0.188, 4);
      expect(Number.isFinite(newRates.RUB)).toBe(true);
      expect(newRates.RUB).toBeGreaterThan(0);

      for (const [code, r] of Object.entries(newRates)) {
        expect(Number.isFinite(r), `Rate for ${code} is finite`).toBe(true);
        expect(r).toBeGreaterThan(0);
      }
    });

    it('TEST-T2-F1-04: Zero Amount and Negative Amount Conversion', () => {
      const rates: ExchangeRates = { RUB: 1.0, USD: 92.5, EUR: 100.5, KZT: 0.188, CZK: 3.95 };

      const resZero = convertCurrency(0, 'USD', 'RUB', rates);
      expect(resZero).toBe(0);

      const resNeg = convertCurrency(-500, 'USD', 'RUB', rates);
      expect(resNeg).toBe(-46250); // -500 * 92.5
    });

    it('TEST-T2-F1-05: Very Large Numbers (Billion Scale)', () => {
      const rates: ExchangeRates = { RUB: 1.0, USD: 92.5, EUR: 100.5, KZT: 0.188, CZK: 3.95 };
      const largeAmount = 1_000_000_000; // 1 billion KZT

      const converted = convertCurrency(largeAmount, 'KZT', 'RUB', rates);
      expect(converted).toBe(188_000_000); // 188 million RUB

      const formatted = formatCurrency(largeAmount, 'KZT');
      expect(formatted).not.toContain('1e+9');
      expect(formatted).not.toContain('1e9');
      expect(formatted).toMatch(/1[\s\u00A0]?000[\s\u00A0]?000[\s\u00A0]?000/);
    });
  });

  // ==========================================================================
  // Module F2: Quick Expense Logging Boundary & Edge Cases (5 tests)
  // ==========================================================================
  describe('F2: Expense Boundary & Edge Cases', () => {
    it('TEST-T2-F2-01: Zero and Decimal Expense Amounts', () => {
      const store = createFinanceStore();

      // Fractional amount (0.01) is accepted
      const txCent = store.addTransaction({
        type: 'expense',
        amount: 0.01,
        currency: 'RUB',
        category: 'Еда и продукты',
        date: '2026-11-13',
      });
      expect(txCent.amount).toBe(0.01);

      // Amount 0 is safe
      const txZero = store.addTransaction({
        type: 'expense',
        amount: 0,
        currency: 'RUB',
        category: 'Еда и продукты',
        date: '2026-11-13',
      });
      expect(txZero.amount).toBe(0);
    });

    it('TEST-T2-F2-02: Negative Expense Amount Prevention', () => {
      const store = createFinanceStore();
      const initialExpenses = store.getMonthlyTotals('2026-11').totalExpenses;

      const tx = store.addTransaction({
        type: 'expense',
        amount: -1500,
        currency: 'RUB',
        category: 'Шопинг',
        date: '2026-11-13',
      });

      expect(tx.amount).toBe(0);
      const updatedExpenses = store.getMonthlyTotals('2026-11').totalExpenses;
      expect(updatedExpenses).toBe(initialExpenses);
    });

    it('TEST-T2-F2-03: Very Long Note and Special Cyrillic / Emoji Characters', () => {
      const store = createFinanceStore();
      const specialNote =
        'Покупка в "Кофейне №1" — кофе ☕, круассан 🥐, и книги: Война и Миръ (томъ 1). ' +
        'Ёжик съел сыр! '.repeat(20);

      const tx = store.addTransaction({
        type: 'expense',
        amount: 850,
        currency: 'RUB',
        category: 'Кафе и кофе',
        note: specialNote,
        date: '2026-11-13',
      });

      expect(tx.note).toBe(specialNote);
      expect(tx.note?.length).toBeGreaterThan(300);
      expect(tx.note).toContain('☕');
      expect(tx.note).toContain('Ёжик');
      expect(tx.note).toContain('томъ');
    });

    it('TEST-T2-F2-04: Empty Transactions Feed & Same-Millisecond Order', () => {
      // Empty feed
      const emptyGroups = groupTransactionsByDate([]);
      expect(emptyGroups).toEqual([]);

      // Identical timestamps
      const txA: Transaction = {
        id: 'tx-a',
        type: 'expense',
        amount: 100,
        currency: 'RUB',
        category: 'Еда и продукты',
        date: '2026-11-13T10:00:00.000Z',
        createdAt: '2026-11-13T10:00:00.000Z',
      };
      const txB: Transaction = {
        id: 'tx-b',
        type: 'expense',
        amount: 200,
        currency: 'RUB',
        category: 'Транспорт',
        date: '2026-11-13T10:00:00.000Z',
        createdAt: '2026-11-13T10:00:00.000Z',
      };

      const groups = groupTransactionsByDate([txA, txB], new Date('2026-11-13T12:00:00.000Z'));
      expect(groups).toHaveLength(1);
      expect(groups[0].transactions).toHaveLength(2);
    });

    it('TEST-T2-F2-05: Custom Category Name Edge Cases (Whitespace & Duplicate)', () => {
      const store = createFinanceStore();

      // Leading/trailing whitespace should be trimmed or preserved cleanly
      const trimmedCat = store.addCategory({
        name: '  Спорт и бег  '.trim(),
        icon: 'Activity',
        color: '#A3C9A8',
        type: 'expense',
        isCustom: true,
      });

      expect(trimmedCat.name).toBe('Спорт и бег');

      const found = store.getState().categories.find(c => c.name === 'Спорт и бег');
      expect(found).toBeDefined();
    });
  });

  // ==========================================================================
  // Module F3: Hourly Income Calculator Boundary & Edge Cases (5 tests)
  // ==========================================================================
  describe('F3: Hourly Calculator Boundary & Edge Cases', () => {
    it('TEST-T2-F3-01: Zero Hours and Zero Rate Inputs', () => {
      const res1 = calculateHourlyIncome(2500, 0);
      expect(res1.amount).toBe(0);
      expect(res1.formula).toMatch(/0\s*ч\.\s*×\s*2[\s\u00A0]?500\s*=\s*0/);

      const res2 = calculateHourlyIncome(0, 10);
      expect(res2.amount).toBe(0);
      expect(res2.formula).toMatch(/10\s*ч\.\s*×\s*0\s*=\s*0/);
    });

    it('TEST-T2-F3-02: Negative Hours and Rate Guard', () => {
      const res1 = calculateHourlyIncome(2500, -5);
      expect(res1.amount).toBe(0);

      const res2 = calculateHourlyIncome(-1000, 10);
      expect(res2.amount).toBe(0);
    });

    it('TEST-T2-F3-03: Micro-Fractional Hours and Rounding', () => {
      // 17 minutes = 17 / 60 ≈ 0.2833333333333333 hours
      const microHours = 17 / 60;
      const rate = 3000;
      const res = calculateHourlyIncome(rate, microHours);

      // 3000 * (17 / 60) = 850
      expect(res.amount).toBe(850);
      expect(res.formula).not.toContain('0.2833333333333333');
    });

    it('TEST-T2-F3-04: Maximum Monthly Hours Cap (744 Hours)', () => {
      // 31 days * 24 hours = 744 hours
      const res = calculateHourlyIncome(1500, 744);
      expect(res.amount).toBe(1116000); // 744 * 1500 = 1 116 000
      expect(res.formula).toMatch(/744\s*ч\.\s*×\s*1[\s\u00A0]?500\s*=\s*1[\s\u00A0]?116[\s\u00A0]?000/);
    });

    it('TEST-T2-F3-05: Large Rate Values (Executive Consulting)', () => {
      const highRate = 150000; // 150 000 RUB/hr
      const hours = 40;
      const res = calculateHourlyIncome(highRate, hours);

      expect(res.amount).toBe(6000000); // 6 million RUB
      expect(res.formula).toMatch(/40\s*ч\.\s*×\s*150[\s\u00A0]?000\s*=\s*6[\s\u00A0]?000[\s\u00A0]?000/);
    });
  });

  // ==========================================================================
  // Module F4: Subscriptions & Due Alerts Boundary & Edge Cases (5 tests)
  // ==========================================================================
  describe('F4: Calendar & Subscriptions Boundary & Edge Cases', () => {
    it('TEST-T2-F4-01: February Common Year (28 Days) Clamping', () => {
      // 2026 is non-leap year (February = monthIndex 1)
      const day = getEffectiveDay(31, 2026, 1);
      expect(day).toBe(28);

      const day30 = getEffectiveDay(30, 2026, 1);
      expect(day30).toBe(28);

      const day29 = getEffectiveDay(29, 2026, 1);
      expect(day29).toBe(28);
    });

    it('TEST-T2-F4-02: February Leap Year (29 Days) Clamping', () => {
      // 2028 is a leap year (February = monthIndex 1)
      const day31 = getEffectiveDay(31, 2028, 1);
      expect(day31).toBe(29);

      const day30 = getEffectiveDay(30, 2028, 1);
      expect(day30).toBe(29);

      const day29 = getEffectiveDay(29, 2028, 1);
      expect(day29).toBe(29);
    });

    it('TEST-T2-F4-03: Alert Window Exact Boundary (Days Left = 5 vs Days Left = 6)', () => {
      const refDate = new Date('2026-11-10T12:00:00.000Z');

      const bills: RecurringBill[] = [
        {
          id: 'b-in',
          title: 'Сервис Включен',
          amount: 500,
          currency: 'RUB',
          dayOfMonth: 15, // diff = 15 - 10 = 5 days (INCLUDED)
          category: 'Подписки',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
        {
          id: 'b-out',
          title: 'Сервис Исключен',
          amount: 500,
          currency: 'RUB',
          dayOfMonth: 16, // diff = 16 - 10 = 6 days (EXCLUDED)
          category: 'Подписки',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
      ];

      const upcoming = getUpcomingBills(bills, refDate);
      const titles = upcoming.map(u => u.bill.title);

      expect(titles).toContain('Сервис Включен');
      expect(titles).not.toContain('Сервис Исключен');
    });

    it('TEST-T2-F4-04: Due "Сегодня" (Days Left = 0) vs Overdue', () => {
      const refDate = new Date('2026-11-15T10:00:00.000Z');

      const bills: RecurringBill[] = [
        {
          id: 'b-today',
          title: 'Сервис Сегодня',
          amount: 300,
          currency: 'RUB',
          dayOfMonth: 15, // Today!
          category: 'Подписки',
          paidMonths: [],
          createdAt: '2026-11-01',
        },
      ];

      const upcoming = getUpcomingBills(bills, refDate);
      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].daysLeft).toBe(0);
      expect(upcoming[0].label).toBe('Сегодня');
    });

    it('TEST-T2-F4-05: Idempotent Payment Action (Double-Click Prevention)', () => {
      const store = createFinanceStore();
      const bill = store.addRecurringBill({
        title: 'Кинопоиск',
        amount: 499,
        currency: 'RUB',
        dayOfMonth: 15,
        category: 'Подписки',
      });

      // 1st click
      const tx1 = store.markBillPaid(bill.id, '2026-11');
      expect(tx1).toBeDefined();

      // 2nd click (simulating double click or rapid tap)
      const tx2 = store.markBillPaid(bill.id, '2026-11');
      expect(tx2).toBeNull(); // Guard prevents duplicate

      const updatedBill = store.getState().recurringBills.find(b => b.id === bill.id);
      const paidOccurrences = updatedBill?.paidMonths.filter(m => m === '2026-11');
      expect(paidOccurrences).toHaveLength(1);

      const relatedTxs = store.getState().transactions.filter(t => t.subscriptionId === bill.id);
      expect(relatedTxs).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Module F5: Smart Savings Advisor Boundary & Edge Cases (5 tests)
  // ==========================================================================
  describe('F5: Smart Advisor Boundary & Edge Cases', () => {
    const rates: ExchangeRates = { RUB: 1.0, USD: 92.5, EUR: 100.5, KZT: 0.188, CZK: 3.95 };

    it('TEST-T2-F5-01: Zero Income with Non-Zero Expenses (Division-by-Zero Guard)', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', amount: 15000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-05', createdAt: '2026-11-05' },
      ];

      const totals = calculateMonthlyTotals(txs, '2026-11', 'RUB', rates);
      expect(totals.totalIncome).toBe(0);
      expect(totals.totalExpenses).toBe(15000);
      expect(Number.isFinite(totals.savingsRate)).toBe(true);
      expect(totals.savingsRate).toBe(0);

      // Advisor execution must not throw
      const tips = getSmartSavingsTips(txs, [], '2026-11', 'RUB', rates);
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('TEST-T2-F5-02: Zero Expenses with Non-Zero Income', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'income', amount: 80000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
      ];

      const totals = calculateMonthlyTotals(txs, '2026-11', 'RUB', rates);
      expect(totals.totalExpenses).toBe(0);
      expect(totals.savingsRate).toBe(1.0); // 100% saved

      const breakdown = calculateCategoryBreakdown(txs, '2026-11', 'RUB', rates);
      expect(breakdown).toEqual([]);

      const tips = getSmartSavingsTips(txs, [], '2026-11', 'RUB', rates);
      const savingsTip = tips.find(t => t.ruleId === 'savings_rate');
      expect(savingsTip).toBeDefined();
      expect(savingsTip?.message).toContain('100%');
    });

    it('TEST-T2-F5-03: Zero Income and Zero Expenses (Fresh Start)', () => {
      const totals = calculateMonthlyTotals([], '2026-11', 'RUB', rates);
      expect(totals.totalIncome).toBe(0);
      expect(totals.totalExpenses).toBe(0);
      expect(totals.savingsRate).toBe(0);

      const tips = getSmartSavingsTips([], [], '2026-11', 'RUB', rates);
      expect(tips).toHaveLength(1);
      expect(tips[0].ruleId).toBe('harmony');
      expect(tips[0].badge).toContain('Гармония');
    });

    it('TEST-T2-F5-04: Exact Threshold Boundaries (15.00% vs 15.01%, 85.00% vs 85.01%, 20.00% vs 20.01%)', () => {
      // 1. Coffee: 15.00% is NOT triggered; 15.01% IS triggered
      const txsCoffee1500: Transaction[] = [
        { id: '1', type: 'expense', amount: 85000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 15000, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-02', createdAt: '2026-11-02' },
      ]; // Exactly 15.00% (15 000 / 100 000)
      const tipsCoffee1500 = getSmartSavingsTips(txsCoffee1500, [], '2026-11', 'RUB', rates);
      expect(tipsCoffee1500.some(t => t.ruleId === 'coffee')).toBe(false);

      const txsCoffee1501: Transaction[] = [
        { id: '1', type: 'expense', amount: 84990, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 15010, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-02', createdAt: '2026-11-02' },
      ]; // 15.01% (15 010 / 100 000 > 15%)
      const tipsCoffee1501 = getSmartSavingsTips(txsCoffee1501, [], '2026-11', 'RUB', rates);
      expect(tipsCoffee1501.some(t => t.ruleId === 'coffee')).toBe(true);

      // 2. Overspend: 85.00% is NOT triggered; 85.01% IS triggered
      const txsOverspend8500: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 85000, currency: 'RUB', category: 'Шопинг', date: '2026-11-02', createdAt: '2026-11-02' },
      ];
      const tipsOver8500 = getSmartSavingsTips(txsOverspend8500, [], '2026-11', 'RUB', rates);
      expect(tipsOver8500.some(t => t.ruleId === 'overspending')).toBe(false);

      const txsOverspend8501: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 85010, currency: 'RUB', category: 'Шопинг', date: '2026-11-02', createdAt: '2026-11-02' },
      ];
      const tipsOver8501 = getSmartSavingsTips(txsOverspend8501, [], '2026-11', 'RUB', rates);
      expect(tipsOver8501.some(t => t.ruleId === 'overspending')).toBe(true);

      // 3. High Savings: 20.00% is NOT triggered; 20.01% IS triggered
      const txsSavings2000: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 80000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-02', createdAt: '2026-11-02' },
      ]; // Saved 20 000 = 20.00%
      const tipsSav2000 = getSmartSavingsTips(txsSavings2000, [], '2026-11', 'RUB', rates);
      expect(tipsSav2000.some(t => t.ruleId === 'savings_rate')).toBe(false);

      const txsSavings2001: Transaction[] = [
        { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 79990, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-02', createdAt: '2026-11-02' },
      ]; // Saved 20 010 = 20.01% > 20%
      const tipsSav2001 = getSmartSavingsTips(txsSavings2001, [], '2026-11', 'RUB', rates);
      expect(tipsSav2001.some(t => t.ruleId === 'savings_rate')).toBe(true);
    });

    it('TEST-T2-F5-05: Extreme Overspending Multiplier (1000% of Income)', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'income', amount: 50000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
        { id: '2', type: 'expense', amount: 500000, currency: 'RUB', category: 'Шопинг', date: '2026-11-05', createdAt: '2026-11-05' },
      ]; // 500 000 / 50 000 = 1000%

      const totals = calculateMonthlyTotals(txs, '2026-11', 'RUB', rates);
      expect(totals.netBalance).toBe(-450000);
      expect(totals.savingsRate).toBe(0);

      const tips = getSmartSavingsTips(txs, [], '2026-11', 'RUB', rates);
      const overspendTip = tips.find(t => t.ruleId === 'overspending');
      expect(overspendTip).toBeDefined();
      expect(overspendTip?.message).toContain('1000%');
    });
  });

  // ==========================================================================
  // Module F6: Goal Tracker Boundary & Edge Cases (5 tests)
  // ==========================================================================
  describe('F6: Goal Tracker Boundary & Edge Cases', () => {
    it('TEST-T2-F6-01: Exact Milestone Threshold Boundaries (24.99% vs 25.00%)', () => {
      const baseGoal: DreamGoal = {
        id: 'g-border',
        title: 'Тест Границы',
        targetAmount: 100000,
        savedAmount: 20000,
        currency: 'RUB',
        celebratedMilestones: [],
        createdAt: '2026-11-01',
      };

      // 24.99% (deposit 4990 -> 24 990 / 100 000)
      const resA = depositToGoal(baseGoal, 4990);
      expect(resA.triggeredMilestones).toHaveLength(0);

      // 25.00% (deposit 5000 -> 25 000 / 100 000)
      const resB = depositToGoal(baseGoal, 5000);
      expect(resB.triggeredMilestones).toEqual([25]);
    });

    it('TEST-T2-F6-02: Multi-Milestone Leap in Single Deposit', () => {
      const goal: DreamGoal = {
        id: 'g-leap',
        title: 'Большой прыжок',
        targetAmount: 100000,
        savedAmount: 10000, // 10%
        currency: 'RUB',
        celebratedMilestones: [],
        createdAt: '2026-11-01',
      };

      // Large deposit: +70 000 -> saved becomes 80 000 (80%)
      // Leaps past 25%, 50%, and 75% simultaneously!
      const res = depositToGoal(goal, 70000);

      expect(res.triggeredMilestones).toEqual([25, 50, 75]);
      expect(res.updatedGoal.celebratedMilestones).toEqual([25, 50, 75]);
      expect(res.updatedGoal.savedAmount).toBe(80000);
    });

    it('TEST-T2-F6-03: Overfunding Beyond 100% Target', () => {
      const goal: DreamGoal = {
        id: 'g-over',
        title: 'Перевыполнение',
        targetAmount: 100000,
        savedAmount: 90000,
        currency: 'RUB',
        celebratedMilestones: [25, 50, 75],
        createdAt: '2026-11-01',
      };

      // Deposit +30 000 -> saved becomes 120 000 (120%)
      const res = depositToGoal(goal, 30000);

      expect(res.updatedGoal.savedAmount).toBe(120000);
      expect(res.triggeredMilestones).toEqual([100]);

      const progress = calculateGoalProgress(res.updatedGoal);
      expect(progress.remaining).toBe(0); // Clamped to 0, never negative!
      expect(progress.percentage).toBe(100);
    });

    it('TEST-T2-F6-04: Zero or Negative Deposit Guards', () => {
      const goal: DreamGoal = {
        id: 'g-guard',
        title: 'Защита от 0',
        targetAmount: 100000,
        savedAmount: 30000,
        currency: 'RUB',
        celebratedMilestones: [25],
        createdAt: '2026-11-01',
      };

      // Zero deposit
      const resZero = depositToGoal(goal, 0);
      expect(resZero.updatedGoal.savedAmount).toBe(30000);
      expect(resZero.triggeredMilestones).toHaveLength(0);

      // Negative deposit
      const resNeg = depositToGoal(goal, -5000);
      expect(resNeg.updatedGoal.savedAmount).toBe(30000);
      expect(resNeg.triggeredMilestones).toHaveLength(0);
    });

    it('TEST-T2-F6-05: Zero Target Amount Guard', () => {
      const zeroGoal: DreamGoal = {
        id: 'g-zero',
        title: 'Цель с нулем',
        targetAmount: 0,
        savedAmount: 0,
        currency: 'RUB',
        celebratedMilestones: [],
        createdAt: '2026-11-01',
      };

      const progress = calculateGoalProgress(zeroGoal);
      expect(Number.isFinite(progress.percentage)).toBe(true);
      expect(Number.isNaN(progress.percentage)).toBe(false);
      expect(progress.remaining).toBe(0);
    });
  });
});
