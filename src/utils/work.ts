/**
 * Job & Taxes Domain Helpers ("Работа и налоги")
 * Calculates gross income, customizable tax percentage, and net income ("на руки").
 */

import { CurrencyCode, ExchangeRates, Transaction } from '../types';
import { convertCurrency, roundTo } from './currency';

export interface WorkCalculationResult {
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  formula: string;
}

export interface TaxPreset {
  label: string;
  percent: number;
}

export const QUICK_TAX_PRESETS: TaxPreset[] = [
  { label: '0% Без налога', percent: 0 },
  { label: '6% Самозанятый', percent: 6 },
  { label: '13% НДФЛ', percent: 13 },
  { label: '15% Повышенный / ЧР', percent: 15 },
];

/**
 * Calculates work earnings and user-specified tax withholdings.
 * Formulas:
 *   grossAmount = hourlyRate * hoursWorked
 *   taxAmount   = grossAmount * (taxPercent / 100)
 *   netAmount   = grossAmount - taxAmount
 */
export function calculateWorkPayout(
  hourlyRate: number,
  hoursWorked: number,
  taxPercent: number
): WorkCalculationResult {
  const rate = Math.max(0, Number.isFinite(hourlyRate) ? hourlyRate : 0);
  const hours = Math.max(0, Number.isFinite(hoursWorked) ? hoursWorked : 0);
  const tax = Math.min(100, Math.max(0, Number.isFinite(taxPercent) ? taxPercent : 0));

  const grossAmount = roundTo(rate * hours, 2);
  const taxAmount = roundTo(grossAmount * (tax / 100), 2);
  const netAmount = roundTo(grossAmount - taxAmount, 2);

  const formula = `${hours} ч. × ${rate} = ${grossAmount} | Налог ${tax}% (${taxAmount}) | На руки: ${netAmount}`;

  return {
    grossAmount,
    taxAmount,
    netAmount,
    formula,
  };
}

/**
 * Sanitizes numeric input for rate, hours, or tax percent.
 */
export function parseWorkInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || isNaN(num)) return null;
  return num;
}

/**
 * Computes monthly work statistics converted into the active base currency.
 */
export function getMonthlyWorkTotals(
  transactions: Transaction[],
  monthKey: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
) {
  let totalGrossBase = 0;
  let totalTaxBase = 0;
  let totalNetBase = 0;
  let totalHours = 0;
  const workTransactions: Transaction[] = [];

  for (const tx of transactions) {
    if (
      tx.date.startsWith(monthKey) &&
      tx.type === 'income' &&
      (tx.workDetails || tx.category === 'Основная работа')
    ) {
      workTransactions.push(tx);

      if (tx.workDetails) {
        const grossInBase = convertCurrency(tx.workDetails.grossAmount, tx.currency, baseCurrency, rates);
        const taxInBase = convertCurrency(tx.workDetails.taxAmount, tx.currency, baseCurrency, rates);
        const netInBase = convertCurrency(tx.workDetails.netAmount, tx.currency, baseCurrency, rates);

        totalGrossBase += grossInBase;
        totalTaxBase += taxInBase;
        totalNetBase += netInBase;
        totalHours += tx.workDetails.hoursWorked;
      } else {
        // Fallback for legacy work transactions without explicit workDetails
        const netInBase = convertCurrency(tx.amount, tx.currency, baseCurrency, rates);
        totalGrossBase += netInBase;
        totalNetBase += netInBase;
      }
    }
  }

  return {
    totalGrossBase: roundTo(totalGrossBase, 2),
    totalTaxBase: roundTo(totalTaxBase, 2),
    totalNetBase: roundTo(totalNetBase, 2),
    totalHours: roundTo(totalHours, 1),
    count: workTransactions.length,
    transactions: workTransactions,
  };
}
