/**
 * src/utils/analytics.ts
 * Monthly financial analytics, category breakdown calculations, and Smart Savings Advisor rules.
 */

import {
  Transaction,
  RecurringBill,
  CurrencyCode,
  ExchangeRates,
  SmartTip,
} from '../types';
import { convertCurrency, formatCurrency, roundTo } from './currency';

/**
 * Pastel Palette for Category Donut & Bar Charts
 */
export const PASTEL_PALETTE = [
  '#A3C9A8', // Sage green
  '#F4A28C', // Terracotta coral
  '#F9E29C', // Butter yellow
  '#D8C2E8', // Lavender
  '#F2C6CE', // Dusty rose
  '#A0D2DB', // Soft sky blue
  '#E5C3A6', // Warm sand
  '#C5E0B4', // Soft mint
];

export interface CategoryShare {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

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
): CategoryShare[] {
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

  const list: CategoryShare[] = [];
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

  entries.forEach(([name, amount], index) => {
    const roundedAmt = roundTo(amount, 2);
    const percentage = roundTo((roundedAmt / total) * 100, 1);
    list.push({
      name,
      amount: roundedAmt,
      percentage,
      color: PASTEL_PALETTE[index % PASTEL_PALETTE.length],
    });
  });

  return list;
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
