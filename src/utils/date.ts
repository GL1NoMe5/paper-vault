/**
 * src/utils/date.ts
 * Date grouping and Russian formatting utilities for the journal feed.
 */

import { Transaction } from '../types';

export interface DateGroupedTransactions {
  dateLabel: string;
  transactions: Transaction[];
}

/**
 * Groups transactions descending by date into "Сегодня", "Вчера", or localized Russian date.
 */
export function groupTransactionsByDate(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): DateGroupedTransactions[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Sort descending by date (or createdAt fallback)
  const sorted = [...transactions].sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt).getTime();
    const timeB = new Date(b.date || b.createdAt).getTime();
    return timeB - timeA;
  });

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const yesterdayDate = new Date(referenceDate);
  yesterdayDate.setDate(refDay - 1);
  const yestYear = yesterdayDate.getFullYear();
  const yestMonth = yesterdayDate.getMonth();
  const yestDay = yesterdayDate.getDate();

  const groupsMap = new Map<string, Transaction[]>();

  for (const tx of sorted) {
    const d = new Date(tx.date || tx.createdAt);
    const txYear = d.getFullYear();
    const txMonth = d.getMonth();
    const txDay = d.getDate();

    let label = '';
    if (txYear === refYear && txMonth === refMonth && txDay === refDay) {
      label = 'Сегодня';
    } else if (txYear === yestYear && txMonth === yestMonth && txDay === yestDay) {
      label = 'Вчера';
    } else {
      label = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
      }).format(d);
    }

    if (!groupsMap.has(label)) {
      groupsMap.set(label, []);
    }
    groupsMap.get(label)!.push(tx);
  }

  return Array.from(groupsMap.entries()).map(([dateLabel, txs]) => ({
    dateLabel,
    transactions: txs,
  }));
}

/**
 * Formats time string (HH:mm) in 24-hour Russian format.
 */
export function formatTransactionTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Formats a YYYY-MM month string into Russian Title, e.g. "Ноябрь 2026".
 */
export function formatMonthTitle(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const name = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date);
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
  } catch {
    return monthStr;
  }
}
