/**
 * Tier 4: Real-World Application Scenarios E2E Test Suite
 * "Уютный Бюджет / Дневник Финансов"
 *
 * Implements all 5 realistic multi-day Russian user workflow scenarios from Explorer 3:
 * - S1: Multi-Currency Freelancer Month-End Reconcile (Ivan)
 * - S2: Subscription Crunch & Leap-Year Bill Payment (Anna)
 * - S3: Dream Goal Sprint with Hourly Overtime (Dmitry)
 * - S4: Living on Tight Budget with Smart Advisor Alerts (Elena)
 * - S5: Complete Russian Monthly Life Cycle (Full Journey)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createFinanceStore,
  calculateHourlyIncome,
  calculateGoalProgress,
  calculateCategoryBreakdown,
  formatCurrency,
  getEffectiveDay,
  setTestDate,
  restoreRealTime,
  DreamGoal,
} from './harness';

describe('Tier 4: Real-World Application Scenarios E2E Suite', () => {
  beforeEach(() => {
    setTestDate('2026-11-13T12:00:00.000Z');
  });

  afterEach(() => {
    restoreRealTime();
  });

  // ==========================================================================
  // Scenario 1: Multi-Currency Freelancer Month-End Reconcile (Ivan)
  // ==========================================================================
  it('T4-SCENARIO-01: Multi-Currency Freelancer Month-End Reconcile', () => {
    const store = createFinanceStore();
    const state = store.getState();
    state.transactions = []; // Fresh month for Ivan

    // Day 1 (Nov 2): Ivan logs 20 hours UI work at $35/hr from US client
    setTestDate('2026-11-02T16:00:00Z');
    const calcUS = calculateHourlyIncome(35, 20); // $700 USD
    expect(calcUS.amount).toBe(700);
    expect(calcUS.formula).toMatch(/20\s*ч\.\s*×\s*35\s*=\s*700/);

    store.addTransaction({
      type: 'income',
      amount: calcUS.amount,
      currency: 'USD',
      category: 'Фриланс',
      calculationMetadata: calcUS.metadata,
      date: '2026-11-02T16:00:00Z',
    });

    // Day 2 (Nov 6): Ivan logs 5 hours consultation at €50/hr from EU client
    setTestDate('2026-11-06T14:00:00Z');
    const calcEU = calculateHourlyIncome(50, 5); // €250 EUR
    expect(calcEU.amount).toBe(250);
    expect(calcEU.formula).toMatch(/5\s*ч\.\s*×\s*50\s*=\s*250/);

    store.addTransaction({
      type: 'income',
      amount: calcEU.amount,
      currency: 'EUR',
      category: 'Подработка',
      calculationMetadata: calcEU.metadata,
      date: '2026-11-06T14:00:00Z',
    });

    // Day 3 (Nov 12): Ivan pays rent in KZT: 200 000 ₸
    setTestDate('2026-11-12T10:00:00Z');
    store.addTransaction({
      type: 'expense',
      amount: 200000,
      currency: 'KZT',
      category: 'Жилье и уют',
      note: 'Аренда квартиры в Алматы',
      date: '2026-11-12T10:00:00Z',
    });

    // Day 4 (Nov 18): Groceries in RUB: 8 500 ₽
    setTestDate('2026-11-18T12:00:00Z');
    store.addTransaction({
      type: 'expense',
      amount: 8500,
      currency: 'RUB',
      category: 'Еда и продукты',
      date: '2026-11-18T12:00:00Z',
    });

    // Day 5 (Nov 25): Local transport in RUB: 1 200 ₽
    setTestDate('2026-11-25T09:00:00Z');
    store.addTransaction({
      type: 'expense',
      amount: 1200,
      currency: 'RUB',
      category: 'Транспорт',
      date: '2026-11-25T09:00:00Z',
    });

    // Month-End Reconcile (Nov 30)
    setTestDate('2026-11-30T18:00:00Z');

    // 1. In RUB Base:
    // Income: 700 USD * 92.5 = 64 750 + 250 EUR * 100.5 = 25 125 -> 89 875 RUB
    // Expenses: 200 000 KZT * 0.188 = 37 600 + 8 500 + 1 200 -> 47 300 RUB
    // Net: 89 875 - 47 300 = +42 575 RUB
    const totalsRUB = store.getMonthlyTotals('2026-11');
    expect(totalsRUB.totalIncome).toBe(89875);
    expect(totalsRUB.totalExpenses).toBe(47300);
    expect(totalsRUB.netBalance).toBe(42575);

    // 2. Ivan switches Base Currency to KZT
    store.setBaseCurrency('KZT');
    const stateKZT = store.getState();
    expect(stateKZT.baseCurrency).toBe('KZT');
    expect(stateKZT.rates.KZT).toBe(1.0);

    const totalsKZT = store.getMonthlyTotals('2026-11');
    // 89 875 * (1 / 0.188) ≈ 478 058.51 ₸
    expect(totalsKZT.totalIncome).toBeCloseTo(478058.5, 0);
    // 47 300 * (1 / 0.188) ≈ 251 595.74 ₸
    expect(totalsKZT.totalExpenses).toBeCloseTo(251595.7, 0);
    // 42 575 * (1 / 0.188) ≈ 226 462.77 ₸
    expect(totalsKZT.netBalance).toBeCloseTo(226462.8, 0);

    // Invariant: original transaction entries are unmodified
    expect(store.getState().transactions).toHaveLength(5);
  });

  // ==========================================================================
  // Scenario 2: Subscription Crunch & Leap-Year Bill Payment (Anna)
  // ==========================================================================
  it('T4-SCENARIO-02: Subscription Crunch & Leap-Year Bill Payment', () => {
    // Leap year setup: February 2028 (29 days)
    setTestDate('2028-02-26T10:00:00Z');
    const store = createFinanceStore();
    const state = store.getState();

    // Verify February 2028 has 29 days
    const feb2028Days = new Date(2028, 2, 0).getDate();
    expect(feb2028Days).toBe(29);

    state.recurringBills = [
      { id: 'sub-yandex', title: 'Яндекс 360', amount: 499, currency: 'RUB', dayOfMonth: 29, category: 'Подписки', paidMonths: [], createdAt: '2028-01-01' },
      { id: 'sub-kino', title: 'Кинопоиск Премиум', amount: 699, currency: 'RUB', dayOfMonth: 30, category: 'Подписки', paidMonths: [], createdAt: '2028-01-01' },
      { id: 'sub-vpn', title: 'VPN Сервис', amount: 350, currency: 'RUB', dayOfMonth: 31, category: 'Подписки', paidMonths: [], createdAt: '2028-01-01' },
      { id: 'sub-gym', title: 'Фитнес-клуб', amount: 3500, currency: 'RUB', dayOfMonth: 10, category: 'Красота и уход', paidMonths: ['2028-02'], createdAt: '2028-01-01' },
    ];

    // 1. Month-end clamping check: days 29, 30, 31 in Feb 2028 clamp to 29
    expect(getEffectiveDay(29, 2028, 1)).toBe(29);
    expect(getEffectiveDay(30, 2028, 1)).toBe(29);
    expect(getEffectiveDay(31, 2028, 1)).toBe(29);

    // 2. Upcoming bills banner: on Feb 26, day 29 is due in 3 days (<= 5)
    // All 3 unpaid bills must appear!
    const upcoming = store.getUpcomingBills(new Date('2028-02-26T10:00:00Z'));
    expect(upcoming).toHaveLength(3);
    for (const u of upcoming) {
      expect(u.daysLeft).toBe(3);
      expect(u.label).toBe('Через 3 дн.');
    }

    // 3. Remaining bills metric: 499 + 699 + 350 = 1 548 RUB
    let remaining = store.getRemainingBills('2028-02');
    expect(remaining).toBe(1548);

    // 4. Anna pays "Яндекс 360" (499 RUB)
    const tx = store.markBillPaid('sub-yandex', '2028-02');
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(499);
    expect(tx?.note).toContain('Яндекс 360');

    // 5. Remaining bills decreases to 699 + 350 = 1 049 RUB
    remaining = store.getRemainingBills('2028-02');
    expect(remaining).toBe(1049);

    // 6. Alert banner now contains only the 2 unpaid bills
    const upcomingAfterPay = store.getUpcomingBills(new Date('2028-02-26T10:00:00Z'));
    expect(upcomingAfterPay).toHaveLength(2);
    expect(upcomingAfterPay.map(u => u.bill.title)).toEqual(['Кинопоиск Премиум', 'VPN Сервис']);

    // 7. Non-leap regression verification (February 2027, 28 days)
    expect(getEffectiveDay(29, 2027, 1)).toBe(28);
    expect(getEffectiveDay(30, 2027, 1)).toBe(28);
    expect(getEffectiveDay(31, 2027, 1)).toBe(28);
  });

  // ==========================================================================
  // Scenario 3: Dream Goal Sprint with Hourly Overtime (Dmitry)
  // ==========================================================================
  it('T4-SCENARIO-03: Dream Goal Sprint with Hourly Overtime', () => {
    const store = createFinanceStore();
    const state = store.getState();

    // Initial goal: New Laptop (120 000 RUB, saved 50 000 = 41.67%, milestone 25 celebrated)
    const laptopGoal: DreamGoal = {
      id: 'g-laptop',
      title: 'Новый ноутбук',
      targetAmount: 120000,
      savedAmount: 50000,
      currency: 'RUB',
      celebratedMilestones: [25],
      createdAt: '2026-11-01',
    };
    state.goals = [laptopGoal];

    // Overtime Session 1 (Saturday): 10 hours at 2500 RUB/hr = 25 000 RUB
    setTestDate('2026-11-14T18:00:00Z');
    const calc1 = calculateHourlyIncome(2500, 10);
    expect(calc1.amount).toBe(25000);
    store.addTransaction({
      type: 'income',
      amount: calc1.amount,
      currency: 'RUB',
      category: 'Подработка',
      calculationMetadata: calc1.metadata,
      date: '2026-11-14T18:00:00Z',
    });

    // Goal Deposit 1: +10 000 RUB -> saved becomes 60 000 RUB (50.0% of 120 000)
    // Milestone 50% reached!
    const res1 = store.depositToGoal('g-laptop', 10000);
    expect(res1.triggeredMilestones).toEqual([50]);
    let goal = store.getState().goals.find(g => g.id === 'g-laptop');
    expect(goal?.savedAmount).toBe(60000);
    expect(goal?.celebratedMilestones).toEqual([25, 50]);

    // Goal Deposit 2: +10 000 RUB -> saved becomes 70 000 RUB (58.33%)
    // Milestone 50% must NOT re-trigger!
    const res2 = store.depositToGoal('g-laptop', 10000);
    expect(res2.triggeredMilestones).toHaveLength(0);
    goal = store.getState().goals.find(g => g.id === 'g-laptop');
    expect(goal?.savedAmount).toBe(70000);
    expect(goal?.celebratedMilestones).toEqual([25, 50]);

    // Overtime Session 2 (Sunday): 12 hours at 2500 RUB/hr = 30 000 RUB
    setTestDate('2026-11-15T19:00:00Z');
    const calc2 = calculateHourlyIncome(2500, 12);
    expect(calc2.amount).toBe(30000);
    store.addTransaction({
      type: 'income',
      amount: calc2.amount,
      currency: 'RUB',
      category: 'Подработка',
      calculationMetadata: calc2.metadata,
      date: '2026-11-15T19:00:00Z',
    });

    // Goal Deposit 3: +25 000 RUB -> saved becomes 95 000 RUB (79.17% of 120 000)
    // Milestone 75% reached!
    const res3 = store.depositToGoal('g-laptop', 25000);
    expect(res3.triggeredMilestones).toEqual([75]);
    goal = store.getState().goals.find(g => g.id === 'g-laptop');
    expect(goal?.savedAmount).toBe(95000);
    expect(goal?.celebratedMilestones).toEqual([25, 50, 75]);

    // Remaining amount updates accurately
    const progress = calculateGoalProgress(goal!);
    expect(progress.remaining).toBe(25000); // 120 000 - 95 000
    expect(progress.percentage).toBeCloseTo(79.2, 1);
  });

  // ==========================================================================
  // Scenario 4: Living on Tight Budget with Smart Advisor Alerts (Elena)
  // ==========================================================================
  it('T4-SCENARIO-04: Living on Tight Budget with Smart Advisor Alerts', () => {
    const store = createFinanceStore();
    const state = store.getState();
    state.transactions = []; // Fresh month for Elena
    state.recurringBills = [];

    // 1. Salary setup: 50 000 RUB
    store.addTransaction({
      type: 'income',
      amount: 50000,
      currency: 'RUB',
      category: 'Основная работа',
      date: '2026-11-01',
    });

    // 2. Coffee purchases: 500 + 600 + 700 + 800 = 2 600 RUB (100% of expenses > 15%)
    store.addTransaction({ type: 'expense', amount: 500, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-02' });
    store.addTransaction({ type: 'expense', amount: 600, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-03' });
    store.addTransaction({ type: 'expense', amount: 700, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-04' });
    store.addTransaction({ type: 'expense', amount: 800, currency: 'RUB', category: 'Кафе и кофе', date: '2026-11-05' });

    let tips = store.getSmartTips('2026-11');
    const coffeeTip = tips.find(t => t.ruleId === 'coffee');
    expect(coffeeTip).toBeDefined();
    expect(coffeeTip?.badge).toContain('Кофеман');
    expect(coffeeTip?.message).toContain('100%');

    // 3. Subscription overload: add 4 recurring bills
    store.addRecurringBill({ title: 'Яндекс Плюс', amount: 299, currency: 'RUB', dayOfMonth: 15, category: 'Подписки' });
    store.addRecurringBill({ title: 'VK Музыка', amount: 169, currency: 'RUB', dayOfMonth: 10, category: 'Подписки' });
    store.addRecurringBill({ title: 'Иви', amount: 399, currency: 'RUB', dayOfMonth: 20, category: 'Подписки' });
    store.addRecurringBill({ title: 'Okko', amount: 399, currency: 'RUB', dayOfMonth: 25, category: 'Подписки' });

    tips = store.getSmartTips('2026-11');
    const subsTip = tips.find(t => t.ruleId === 'subscriptions');
    expect(subsTip).toBeDefined();
    expect(subsTip?.badge).toContain('Подписки');
    expect(subsTip?.message).toContain('4 активных подписок');

    // 4. Impulsive expense: luxury shoes for 42 000 RUB
    // Total expenses: 2 600 + 42 000 = 44 600 RUB (44 600 / 50 000 = 89.2% > 85%)
    const impulseTx = store.addTransaction({
      type: 'expense',
      amount: 42000,
      currency: 'RUB',
      category: 'Шопинг',
      note: 'Обувь',
      date: '2026-11-06',
    });

    tips = store.getSmartTips('2026-11');
    const overspendTip = tips.find(t => t.ruleId === 'overspending');
    expect(overspendTip).toBeDefined();
    expect(overspendTip?.badge).toContain('Внимание');
    expect(overspendTip?.message).toContain('89%');

    // 5. Elena returns shoes and deletes the 42 000 RUB expense
    store.deleteTransaction(impulseTx.id);

    // Expenses drop back to 2 600 RUB
    // Spent ratio drops to 5.2%, Savings rate jumps to 94.8% (> 20%)
    tips = store.getSmartTips('2026-11');
    expect(tips.some(t => t.ruleId === 'overspending')).toBe(false);

    const savingsTip = tips.find(t => t.ruleId === 'savings_rate');
    expect(savingsTip).toBeDefined();
    expect(savingsTip?.badge).toContain('Отличный темп');
    expect(savingsTip?.message).toContain('95%');
  });

  // ==========================================================================
  // Scenario 5: Complete Russian Monthly Life Cycle (Full Journey)
  // ==========================================================================
  it('T4-SCENARIO-05: Complete Russian Monthly Life Cycle', () => {
    // Phase 1: Loads pre-populated Russian demo state
    const store = createFinanceStore();
    const initialState = store.getState();
    expect(initialState.transactions).toHaveLength(8);
    expect(initialState.recurringBills).toHaveLength(3);
    expect(initialState.goals).toHaveLength(1);
    expect(initialState.baseCurrency).toBe('RUB');

    // Phase 2: Monthly Income Registration
    // Log salary 70 000 RUB
    store.addTransaction({
      type: 'income',
      amount: 70000,
      currency: 'RUB',
      category: 'Основная работа',
      note: 'Зарплата за ноябрь',
      date: '2026-11-10T10:00:00Z',
    });

    // Log side gig: 12h * 2500 RUB = 30 000 RUB
    const calcGig = calculateHourlyIncome(2500, 12);
    store.addTransaction({
      type: 'income',
      amount: calcGig.amount,
      currency: 'RUB',
      category: 'Фриланс',
      calculationMetadata: calcGig.metadata,
      date: '2026-11-12T15:00:00Z',
    });

    // Phase 3: Daily Living Expenses
    store.addTransaction({
      type: 'expense',
      amount: 5400,
      currency: 'RUB',
      category: 'Еда и продукты',
      date: '2026-11-13T11:00:00Z',
    });
    store.addTransaction({
      type: 'expense',
      amount: 950,
      currency: 'RUB',
      category: 'Транспорт',
      date: '2026-11-13T12:00:00Z',
    });

    // Phase 4: Wall Calendar Planner & Upcoming Bill
    // "Домашний Интернет" (750 RUB, day 17) is due in 4 days (on Nov 13)
    const upcoming = store.getUpcomingBills(new Date('2026-11-13T12:00:00Z'));
    const netBill = upcoming.find(u => u.bill.title === 'Домашний Интернет');
    expect(netBill).toBeDefined();

    const remainingBeforePay = store.getRemainingBills('2026-11');
    store.markBillPaid('sub-internet', '2026-11');
    const remainingAfterPay = store.getRemainingBills('2026-11');
    expect(remainingAfterPay).toBe(remainingBeforePay - 750);

    // Phase 5: Goal Milestone Funding
    // Dream goal: Prague vacation (Target: 150 000, Saved: 55 000 = 36.7%)
    // Dmitry deposits 25 000 RUB -> Saved becomes 80 000 RUB (53.3%)
    // Crossing 50% milestone!
    const goalRes = store.depositToGoal('goal-prague', 25000);
    expect(goalRes.triggeredMilestones).toEqual([50]);

    const updatedGoal = store.getState().goals.find(g => g.id === 'goal-prague');
    expect(updatedGoal?.savedAmount).toBe(80000);
    expect(updatedGoal?.celebratedMilestones).toContain(50);

    // Phase 6: Monthly Analytics & Summary
    const finalTotals = store.getMonthlyTotals('2026-11');
    expect(finalTotals.totalIncome).toBeGreaterThan(150000);
    expect(finalTotals.netBalance).toBeGreaterThan(0);

    const breakdown = calculateCategoryBreakdown(
      store.getState().transactions,
      '2026-11',
      store.getState().baseCurrency,
      store.getState().rates
    );
    expect(breakdown.length).toBeGreaterThan(3);

    // Verification of Russian UI formatting
    const formattedBalance = formatCurrency(finalTotals.netBalance, store.getState().baseCurrency);
    expect(formattedBalance).toContain('₽');
    expect(formattedBalance).toMatch(/\d+[\s\u00A0]?\d*\s*₽/);
  });
});
