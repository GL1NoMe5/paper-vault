/**
 * src/utils/hourly.ts
 * Hourly income calculations, Russian formula formatting, and income sources.
 */

import { HourlyCalculationResult } from '../types';
import { roundTo } from './currency';

export interface HourlySource {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex pastel accent
}

export const HOURLY_INCOME_SOURCES: HourlySource[] = [
  { id: 'primary', name: 'Основная работа', icon: 'Briefcase', color: '#A3C9A8' },
  { id: 'side', name: 'Подработка', icon: 'Clock', color: '#F9E29C' },
  { id: 'freelance', name: 'Фриланс', icon: 'Laptop', color: '#D8C2E8' },
  { id: 'gift_other', name: 'Подарок / Другое', icon: 'Gift', color: '#F4A28C' },
];

export const DEFAULT_HOURLY_SOURCE = 'Основная работа';

export const QUICK_HOURS_PRESETS = [1, 2, 4, 8];

/**
 * Normalizes number formatting using Russian locale with non-breaking spaces replaced by ASCII spaces.
 */
function formatRuNumber(n: number, maxDecimals: number = 2, minDecimals: number = 0): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  })
    .format(n)
    .replace(/[\u00A0\u202F]/g, ' ');
}

/**
 * Calculates hourly income and generates formula metadata.
 * Guards against non-finite or negative inputs.
 */
export function calculateHourlyIncome(
  hourlyRate: number,
  hoursWorked: number
): HourlyCalculationResult {
  if (
    !Number.isFinite(hourlyRate) ||
    !Number.isFinite(hoursWorked) ||
    hourlyRate < 0 ||
    hoursWorked < 0
  ) {
    return {
      amount: 0,
      formula: '0 ч. × 0 = 0',
      metadata: { hourlyRate: 0, hoursWorked: 0, formula: '0 ч. × 0 = 0' },
    };
  }

  const amount = roundTo(hourlyRate * hoursWorked, 2);

  const formattedHours = formatRuNumber(hoursWorked, 2, 0);
  const formattedRate = formatRuNumber(hourlyRate, 2, hourlyRate % 1 !== 0 ? 2 : 0);
  const formattedAmount = formatRuNumber(amount, 2, amount % 1 !== 0 ? 2 : 0);

  const formula = `${formattedHours} ч. × ${formattedRate} = ${formattedAmount}`;

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

/**
 * Formats full formula with optional currency symbol for UI badges.
 * e.g., "15 ч. × 2 500 = 37 500 ₸"
 */
export function formatHourlyFormula(
  hours: number,
  rate: number,
  total: number,
  currencySymbol?: string
): string {
  const formattedHours = formatRuNumber(hours, 2, 0);
  const formattedRate = formatRuNumber(rate, 2, rate % 1 !== 0 ? 2 : 0);
  const formattedTotal = formatRuNumber(total, 2, total % 1 !== 0 ? 2 : 0);

  const baseFormula = `${formattedHours} ч. × ${formattedRate} = ${formattedTotal}`;
  return currencySymbol ? `${baseFormula} ${currencySymbol}` : baseFormula;
}

/**
 * Parses user input string (handling Russian comma separators) into a valid positive number.
 */
export function parseHourlyInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || isNaN(num) || num < 0) return null;
  return num;
}
