/**
 * src/utils/calendar.ts
 * Calendar math, due-date calculations, month grid generation, and remaining bills metrics.
 */

import { RecurringBill, CurrencyCode, ExchangeRates } from '../types';
import { convertCurrency, roundTo } from './currency';

export const RUSSIAN_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const RUSSIAN_MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

/**
 * Clamps dayOfMonth to the actual number of days in the given month.
 * e.g., 31st of February becomes 28th or 29th.
 */
export function getEffectiveDay(dayOfMonth: number, year: number, monthIndex: number): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(dayOfMonth, daysInMonth);
}

/**
 * Returns bills that are:
 * 1. Not yet paid in the current month (YYYY-MM).
 * 2. Due within the next 5 days (diff >= 0 && diff <= 5).
 */
export function getUpcomingBills(
  bills: RecurringBill[],
  currentDate: Date = new Date()
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

/**
 * Returns the total amount of remaining (unpaid) bills for the specified month,
 * converted to the target base currency.
 */
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

export interface CalendarDayCell {
  dayNumber: number;
  monthIndex: number; // 0-indexed
  year: number;
  dateKey: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  bills: RecurringBill[];
}

/**
 * Generates a full 35- or 42-day calendar grid for a given year & month (Monday-first).
 */
export function getMonthCalendarGrid(
  year: number,
  monthIndex: number,
  bills: RecurringBill[],
  currentDate: Date = new Date()
): CalendarDayCell[] {
  const todayStr = currentDate.toISOString().split('T')[0];
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Convert Sunday-first (0=Sun) to Monday-first (0=Mon, 6=Sun)
  let startWeekday = firstDayOfMonth.getDay() - 1;
  if (startWeekday === -1) startWeekday = 6;

  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
  const cells: CalendarDayCell[] = [];

  // Previous month trailing days
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dateKey = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    cells.push({
      dayNumber: day,
      monthIndex: prevMonthIdx,
      year: prevYear,
      dateKey,
      isCurrentMonth: false,
      isToday: dateKey === todayStr,
      bills: [],
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Find bills assigned to this day (using effective day for month-end clamping)
    const dayBills = bills.filter((b) => getEffectiveDay(b.dayOfMonth, year, monthIndex) === day);

    cells.push({
      dayNumber: day,
      monthIndex,
      year,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
      bills: dayBills,
    });
  }

  // Next month leading days to complete full rows (multiple of 7)
  const remainingCells = 7 - (cells.length % 7);
  if (remainingCells < 7) {
    const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    for (let day = 1; day <= remainingCells; day++) {
      const dateKey = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNumber: day,
        monthIndex: nextMonthIdx,
        year: nextYear,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        bills: [],
      });
    }
  }

  return cells;
}
