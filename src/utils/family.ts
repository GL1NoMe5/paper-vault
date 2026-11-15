/**
 * Family Transfers Domain Helpers ("Семья и переводы от родителей")
 * Handles parental transfers with foreign currencies, live base conversion, and sender presets.
 */

import { CurrencyCode, ExchangeRates, Transaction } from '../types';
import { convertCurrency, roundTo } from './currency';

export const FAMILY_SENDERS: string[] = [
  '❤️ Мама',
  '👨 Папа',
  '🏡 Родители',
  '👵 Бабушка / Дедушка',
  'Семья / Родные',
];

/**
 * Computes monthly parental transfer totals converted into base currency.
 */
export function getMonthlyFamilyTotals(
  transactions: Transaction[],
  monthKey: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
) {
  let totalReceivedBase = 0;
  let count = 0;
  const sendersMap: Record<string, number> = {};
  const familyTransactions: Transaction[] = [];

  for (const tx of transactions) {
    if (
      tx.date.startsWith(monthKey) &&
      tx.type === 'income' &&
      (tx.category === 'Помощь родителей' || Boolean(tx.familyDetails))
    ) {
      familyTransactions.push(tx);
      count++;

      const inBase = convertCurrency(tx.amount, tx.currency, baseCurrency, rates);
      totalReceivedBase += inBase;

      const sender = tx.familyDetails?.sender || 'Родители';
      sendersMap[sender] = roundTo((sendersMap[sender] || 0) + inBase, 2);
    }
  }

  return {
    totalReceivedBase: roundTo(totalReceivedBase, 2),
    count,
    sendersMap,
    transactions: familyTransactions,
  };
}
