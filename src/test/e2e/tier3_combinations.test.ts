/**
 * Tier 3: Cross-Feature Combinations E2E Test Suite
 * "Уютный Бюджет / Дневник Финансов"
 *
 * Implements all 8 pairwise cross-feature combination test specifications from Explorer 3.
 * Exercises interactions across:
 * - Currency switching and recurring bill payments
 * - Hourly income calculations and smart savings advisor transitions
 * - Custom category creations, transactions, and donut chart aggregations
 * - Quick goal deposits, milestone celebrations, and balance tracking
 * - Due bill alerts, one-tap payments, and feed synchronization
 * - Foreign currency logging, manual exchange rate updates, and total recalculations
 * - Currency rebasing and foreign bill conversions
 * - Category isolation and smart advisor threshold boundaries
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createFinanceStore,
  calculateCategoryBreakdown,
  calculateHourlyIncome,
  convertCurrency,
  DreamGoal,
  setTestDate,
  restoreRealTime,
  ExchangeRates,
} from './harness';

describe('Tier 3: Cross-Feature Combinations E2E Suite', () => {
  beforeEach(() => {
    setTestDate('2026-11-13T12:00:00.000Z');
  });

  afterEach(() => {
    restoreRealTime();
  });

  it('T3-PAIR-01: Base Currency Switch + Recurring Bill Payment', () => {
    const store = createFinanceStore();
    // Default base: RUB. Rates: USD = 92.5, KZT = 0.188
    const bill = store.addRecurringBill({
      title: 'Яндекс Плюс',
      amount: 299,
      currency: 'RUB',
      dayOfMonth: 15,
      category: 'Подписки',
    });

    // 1. Switch base currency to KZT
    store.setBaseCurrency('KZT');
    const stateKZT = store.getState();
    expect(stateKZT.baseCurrency).toBe('KZT');
    expect(stateKZT.rates.KZT).toBe(1.0);
    expect(stateKZT.rates.RUB).toBeCloseTo(1 / 0.188, 3); // ~5.319

    // 2. Pay bill denominated in RUB
    const tx = store.markBillPaid(bill.id, '2026-11');
    expect(tx).toBeDefined();
    expect(tx?.currency).toBe('RUB');
    expect(tx?.amount).toBe(299);

    // 3. Converted bill amount in KZT
    const inKZT = convertCurrency(299, 'RUB', 'KZT', stateKZT.rates);
    // 299 * (1 / 0.188) = 1590.43 KZT
    expect(inKZT).toBeCloseTo(1590.43, 1);

    // 4. Switch base currency to USD and verify re-converted value
    store.setBaseCurrency('USD');
    const stateUSD = store.getState();
    expect(stateUSD.baseCurrency).toBe('USD');
    expect(stateUSD.rates.USD).toBe(1.0);

    const inUSD = convertCurrency(299, 'RUB', 'USD', stateUSD.rates);
    // 299 / 92.5 = 3.23 USD
    expect(inUSD).toBeCloseTo(3.23, 2);

    // Invariant: original transaction preserved currency and amount exactly
    const savedTx = store.getState().transactions.find(t => t.id === tx?.id);
    expect(savedTx?.amount).toBe(299);
    expect(savedTx?.currency).toBe('RUB');
  });

  it('T3-PAIR-02: Hourly Income Calculation + Smart Savings Advisor', () => {
    const store = createFinanceStore();

    // Start with fresh state having 60 000 RUB expenses and 0 income
    const state = store.getState();
    state.transactions = [
      {
        id: 'tx-exp-1',
        type: 'expense',
        amount: 60000,
        currency: 'RUB',
        category: 'Жилье и уют',
        date: '2026-11-05T10:00:00Z',
        createdAt: '2026-11-05T10:00:00Z',
      },
    ];

    // Initial check: overspending alert must be active
    let tips = store.getSmartTips('2026-11');
    // With 0 income, overspending is guarded or active, and savings is 0%
    const initialTotals = store.getMonthlyTotals('2026-11');
    expect(initialTotals.totalIncome).toBe(0);
    expect(initialTotals.totalExpenses).toBe(60000);

    // 1. Log hourly freelance work: 30 hrs * 2500 RUB = 75 000 RUB
    const calc1 = calculateHourlyIncome(2500, 30);
    expect(calc1.amount).toBe(75000);
    expect(calc1.formula).toMatch(/30\s*ч\.\s*×\s*2[\s\u00A0]?500\s*=\s*75[\s\u00A0]?000/);

    store.addTransaction({
      type: 'income',
      amount: calc1.amount,
      currency: 'RUB',
      category: 'Фриланс',
      calculationMetadata: calc1.metadata,
      date: '2026-11-08T12:00:00Z',
    });

    // 2. Log 10 more hours at 2500 RUB: 25 000 RUB ("Подработка")
    const calc2 = calculateHourlyIncome(2500, 10);
    store.addTransaction({
      type: 'income',
      amount: calc2.amount,
      currency: 'RUB',
      category: 'Подработка',
      calculationMetadata: calc2.metadata,
      date: '2026-11-10T12:00:00Z',
    });

    // 3. Inspect updated totals and advisor
    const updatedTotals = store.getMonthlyTotals('2026-11');
    expect(updatedTotals.totalIncome).toBe(100000); // 75 000 + 25 000
    expect(updatedTotals.totalExpenses).toBe(60000);
    expect(updatedTotals.netBalance).toBe(40000); // +40 000
    expect(updatedTotals.savingsRate).toBe(0.4); // 40%

    tips = store.getSmartTips('2026-11');
    // Overspending rule must NOT trigger (60 000 / 100 000 = 60% <= 85%)
    expect(tips.some(t => t.ruleId === 'overspending')).toBe(false);

    // High Savings Rule 4 MUST trigger (40% > 20%)
    const savingsTip = tips.find(t => t.ruleId === 'savings_rate');
    expect(savingsTip).toBeDefined();
    expect(savingsTip?.badge).toContain('Отличный темп');
    expect(savingsTip?.message).toContain('40%');
    expect(savingsTip?.message).toMatch(/40[\s\u00A0]?000/);
  });

  it('T3-PAIR-03: Custom Category Creation + Expense Logging + Donut Chart', () => {
    const store = createFinanceStore();
    const state = store.getState();
    state.transactions = []; // Empty for clean breakdown

    // 1. Add custom category
    const cat = store.addCategory({
      name: 'Домашние питомцы',
      color: '#D8C2E8',
      icon: 'Heart',
      type: 'expense',
      isCustom: true,
    });
    expect(cat.name).toBe('Домашние питомцы');

    // 2. Log 2 expenses under this custom category
    store.addTransaction({
      type: 'expense',
      amount: 4500,
      currency: 'RUB',
      category: 'Домашние питомцы',
      note: 'Корм для кота',
      date: '2026-11-05T10:00:00Z',
    });

    const txVet = store.addTransaction({
      type: 'expense',
      amount: 2500,
      currency: 'RUB',
      category: 'Домашние питомцы',
      note: 'Визит к ветеринару',
      date: '2026-11-06T11:00:00Z',
    });

    // 3. Log a standard category expense
    store.addTransaction({
      type: 'expense',
      amount: 3000,
      currency: 'RUB',
      category: 'Еда и продукты',
      date: '2026-11-07T12:00:00Z',
    });

    // Total = 4500 + 2500 + 3000 = 10 000
    // Pets = 7000 (70%), Food = 3000 (30%)
    let breakdown = calculateCategoryBreakdown(
      store.getState().transactions,
      '2026-11',
      store.getState().baseCurrency,
      store.getState().rates
    );

    const petsItem = breakdown.find(b => b.name === 'Домашние питомцы');
    expect(petsItem).toBeDefined();
    expect(petsItem?.amount).toBe(7000);
    expect(petsItem?.percentage).toBe(70);

    // 4. Delete the 2500 RUB vet transaction
    store.deleteTransaction(txVet.id);

    // Updated Total = 4500 + 3000 = 7500
    // Pets = 4500 (60%), Food = 3000 (40%)
    breakdown = calculateCategoryBreakdown(
      store.getState().transactions,
      '2026-11',
      store.getState().baseCurrency,
      store.getState().rates
    );

    const updatedPetsItem = breakdown.find(b => b.name === 'Домашние питомцы');
    expect(updatedPetsItem?.amount).toBe(4500);
    expect(updatedPetsItem?.percentage).toBe(60);
  });

  it('T3-PAIR-04: Quick Goal Deposit + Current Month Balance/Savings Indicator', () => {
    const store = createFinanceStore();
    const state = store.getState();

    // Setup income 100k, expenses 40k -> Net savings +60 000 RUB
    state.transactions = [
      { id: '1', type: 'income', amount: 100000, currency: 'RUB', category: 'Основная работа', date: '2026-11-01', createdAt: '2026-11-01' },
      { id: '2', type: 'expense', amount: 40000, currency: 'RUB', category: 'Еда и продукты', date: '2026-11-05', createdAt: '2026-11-05' },
    ];

    const totals = store.getMonthlyTotals('2026-11');
    expect(totals.netBalance).toBe(60000);

    // Goal: target 100 000, saved 20 000 (20%)
    const goal: DreamGoal = {
      id: 'g-dream',
      title: 'Поездка в горы',
      targetAmount: 100000,
      savedAmount: 20000,
      currency: 'RUB',
      celebratedMilestones: [],
      createdAt: '2026-11-01',
    };
    state.goals = [goal];

    // Deposit +10 000 -> 30 000 (30% crosses 25%)
    const res1 = store.depositToGoal('g-dream', 10000);
    expect(res1.triggeredMilestones).toEqual([25]);
    let currentGoal = store.getState().goals.find(g => g.id === 'g-dream');
    expect(currentGoal?.savedAmount).toBe(30000);

    // Deposit +50 000 -> 80 000 (80% crosses 50% and 75%)
    const res2 = store.depositToGoal('g-dream', 50000);
    expect(res2.triggeredMilestones).toEqual([50, 75]);
    currentGoal = store.getState().goals.find(g => g.id === 'g-dream');
    expect(currentGoal?.savedAmount).toBe(80000);
    expect(currentGoal?.celebratedMilestones).toEqual([25, 50, 75]);
    expect(currentGoal?.targetAmount! - currentGoal?.savedAmount!).toBe(20000);
  });

  it('T3-PAIR-05: Subscription Due Alert + One-Tap Pay + Remaining Metric', () => {
    setTestDate('2026-11-10T12:00:00.000Z');
    const store = createFinanceStore();
    const state = store.getState();

    state.recurringBills = [
      { id: 'b1', title: 'Интернет', amount: 600, currency: 'RUB', dayOfMonth: 12, category: 'Жилье и уют', paidMonths: [], createdAt: '2026-11-01' },
      { id: 'b2', title: 'Музыка', amount: 400, currency: 'RUB', dayOfMonth: 14, category: 'Подписки', paidMonths: [], createdAt: '2026-11-01' },
      { id: 'b3', title: 'Аренда', amount: 30000, currency: 'RUB', dayOfMonth: 25, category: 'Жилье и уют', paidMonths: [], createdAt: '2026-11-01' },
    ];

    // 1. Initial alerts: Bill 1 (diff = 2) and Bill 2 (diff = 4) are within 5 days
    let upcoming = store.getUpcomingBills(new Date('2026-11-10'));
    expect(upcoming).toHaveLength(2);
    expect(upcoming.map(u => u.bill.title)).toEqual(['Интернет', 'Музыка']);

    // 2. Initial remaining bills: 600 + 400 + 30 000 = 31 000 RUB
    let remaining = store.getRemainingBills('2026-11');
    expect(remaining).toBe(31000);

    // 3. One-tap pay Bill 1 (600 RUB)
    const tx = store.markBillPaid('b1', '2026-11');
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(600);
    expect(tx?.note).toContain('Интернет');

    // 4. Alert banner now shows only Bill 2
    upcoming = store.getUpcomingBills(new Date('2026-11-10'));
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].bill.title).toBe('Музыка');

    // 5. Remaining bills decreases to 30 400 RUB
    remaining = store.getRemainingBills('2026-11');
    expect(remaining).toBe(30400);

    // 6. Expense record in journal feed
    const feed = store.getState().transactions;
    const billTx = feed.find(t => t.subscriptionId === 'b1');
    expect(billTx).toBeDefined();
    expect(billTx?.amount).toBe(600);
  });

  it('T3-PAIR-06: Foreign Currency Logging + Manual Rate Edit + Recalculated Totals', () => {
    const store = createFinanceStore();
    const state = store.getState();
    state.transactions = []; // Clean state

    // 1. Log Income in USD: $100
    store.addTransaction({
      type: 'income',
      amount: 100,
      currency: 'USD',
      category: 'Фриланс',
      date: '2026-11-05',
    });

    // 2. Log Expense in EUR: €50
    store.addTransaction({
      type: 'expense',
      amount: 50,
      currency: 'EUR',
      category: 'Подписки',
      note: 'Хостинг',
      date: '2026-11-06',
    });

    // Initial rates: USD = 92.5, EUR = 100.5
    // Income: 100 * 92.5 = 9250 RUB
    // Expense: 50 * 100.5 = 5025 RUB
    // Net: 9250 - 5025 = +4225 RUB
    let totals = store.getMonthlyTotals('2026-11');
    expect(totals.totalIncome).toBe(9250);
    expect(totals.totalExpenses).toBe(5025);
    expect(totals.netBalance).toBe(4225);

    // 3. User manually edits rates in CurrencyModal: USD = 98.0, EUR = 105.0
    const updatedRates: ExchangeRates = {
      ...store.getState().rates,
      USD: 98.0,
      EUR: 105.0,
    };
    store.updateRates(updatedRates);

    // Updated totals:
    // Income: 100 * 98.0 = 9800 RUB
    // Expense: 50 * 105.0 = 5250 RUB
    // Net: 9800 - 5250 = +4550 RUB
    totals = store.getMonthlyTotals('2026-11');
    expect(totals.totalIncome).toBe(9800);
    expect(totals.totalExpenses).toBe(5250);
    expect(totals.netBalance).toBe(4550);

    // Original transactions preserve currencies
    const txs = store.getState().transactions;
    expect(txs.find(t => t.type === 'income')?.currency).toBe('USD');
    expect(txs.find(t => t.type === 'income')?.amount).toBe(100);
    expect(txs.find(t => t.type === 'expense')?.currency).toBe('EUR');
    expect(txs.find(t => t.type === 'expense')?.amount).toBe(50);
  });

  it('T3-PAIR-07: Base Currency Rebase to Foreign + Recurring Bill Due Conversion', () => {
    const store = createFinanceStore();
    const state = store.getState();
    state.transactions = []; // Isolated state for this test

    // Bill denominated in RUB: 600 RUB
    state.recurringBills = [
      { id: 'b-net', title: 'Интернет', amount: 600, currency: 'RUB', dayOfMonth: 15, category: 'Подписки', paidMonths: [], createdAt: '2026-11-01' },
    ];

    // 1. Switch Base Currency to EUR
    store.setBaseCurrency('EUR');
    const stateEUR = store.getState();
    expect(stateEUR.baseCurrency).toBe('EUR');
    expect(stateEUR.rates.EUR).toBe(1.0);
    expect(stateEUR.rates.RUB).toBeCloseTo(1 / 100.5, 5);

    // 2. Remaining bills in EUR: 600 * (1 / 100.5) = 5.97 EUR
    const remainingEUR = store.getRemainingBills('2026-11');
    expect(remainingEUR).toBeCloseTo(5.97, 2);

    // 3. Pay bill
    store.markBillPaid('b-net', '2026-11');

    // Monthly totals in EUR base: expenses ≈ 5.97 EUR
    const totalsEUR = store.getMonthlyTotals('2026-11');
    expect(totalsEUR.totalExpenses).toBeCloseTo(5.97, 2);
  });

  it('T3-PAIR-08: Custom Category + Advisor Coffee Threshold Isolation', () => {
    const store = createFinanceStore();
    const state = store.getState();
    state.transactions = [];

    // 1. Log ordinary expenses: 20 000 RUB
    store.addTransaction({
      type: 'expense',
      amount: 19000,
      currency: 'RUB',
      category: 'Еда и продукты',
      date: '2026-11-01',
    });

    // 2. Predefined Coffee: 1 000 RUB (5% of 20 000)
    store.addTransaction({
      type: 'expense',
      amount: 1000,
      currency: 'RUB',
      category: 'Кафе и кофе',
      date: '2026-11-02',
    });

    // 3. Create custom category "Кондитерская и десерты"
    store.addCategory({
      name: 'Кондитерская и десерты',
      icon: 'Cookie',
      color: '#F9E29C',
      type: 'expense',
      isCustom: true,
    });

    // 4. Log large expense in custom category: 10 000 RUB
    store.addTransaction({
      type: 'expense',
      amount: 10000,
      currency: 'RUB',
      category: 'Кондитерская и десерты',
      date: '2026-11-05',
    });

    // Total expenses = 30 000 RUB.
    // Predefined coffee remains 1 000 RUB -> 1 000 / 30 000 = 3.33% (<= 15%)
    const tips = store.getSmartTips('2026-11');
    const coffeeTip = tips.find(t => t.ruleId === 'coffee');

    // Advisor Rule 1 MUST NOT be triggered by the custom category!
    expect(coffeeTip).toBeUndefined();
  });
});
