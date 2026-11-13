/**
 * src/components/journal/JournalFeed.tsx
 * Chronological date-grouped feed of income and expense transactions.
 */

import React from 'react';
import { Transaction, CurrencyCode, ExchangeRates, Category } from '../../types';
import { groupTransactionsByDate } from '../../utils/date';
import { TransactionRow } from './TransactionRow';
import { BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface JournalFeedProps {
  transactions: Transaction[];
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  onDeleteTransaction: (id: string) => void;
  categories?: Category[];
}

export const JournalFeed: React.FC<JournalFeedProps> = ({
  transactions,
  baseCurrency,
  rates,
  onDeleteTransaction,
  categories,
}) => {
  const grouped = groupTransactionsByDate(transactions);

  return (
    <section aria-label="Лента операций" className="space-y-4">
      {/* Feed Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="washi-tape washi-tape-sage text-xs font-bold text-[#2F5233]">
            Записи в дневнике
          </span>
        </div>
        <span className="text-[11px] text-[#8C7F70] font-medium">
          {transactions.length > 0 ? `${transactions.length} записей` : 'Нет записей'}
        </span>
      </div>

      {/* Empty State */}
      {grouped.length === 0 ? (
        <div
          data-testid="journal-empty-state"
          className="p-8 border-2 border-dashed border-[#E5DEC9] bg-[#FDFBF7] rounded-3xl text-center shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F9E29C]/30 text-[#6E5611] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-sm text-[#3D352E] mb-1">
            Дневник чист и свеж
          </h3>
          <p className="text-xs text-[#8C7F70] max-w-xs mx-auto leading-relaxed">
            Запишите чашку утреннего кофе, расход или отработанные часы выше, чтобы наполнить страницу!
          </p>
        </div>
      ) : (
        /* Date Grouped Transaction Cards with AnimatePresence */
        <div className="space-y-4" data-testid="journal-feed-groups">
          {grouped.map((group) => (
            <div key={group.dateLabel} className="space-y-1.5">
              {/* Date Header Pill */}
              <div className="flex items-center gap-2 px-1">
                <span
                  data-testid={`date-header-${group.dateLabel}`}
                  className="font-heading font-bold text-xs text-[#3D352E] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#EFECE6]"
                >
                  {group.dateLabel}
                </span>
                <div className="flex-1 h-[1px] bg-[#EFECE6]" />
                <span className="text-[10px] text-[#8C7F70]">
                  {group.transactions.length} оп.
                </span>
              </div>

              {/* Card Container with Dividing Borders */}
              <div className="card-cozy divide-y divide-[#EFECE6]/60 overflow-hidden rounded-2xl">
                <AnimatePresence mode="popLayout" initial={false}>
                  {group.transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    >
                      <TransactionRow
                        transaction={tx}
                        baseCurrency={baseCurrency}
                        rates={rates}
                        onDelete={onDeleteTransaction}
                        categories={categories}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
