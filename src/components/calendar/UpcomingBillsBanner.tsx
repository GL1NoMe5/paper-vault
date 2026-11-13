/**
 * src/components/calendar/UpcomingBillsBanner.tsx
 * "Скоро списание" alert banner for recurring payments due within next 5 days.
 * Includes one-tap "Оплачено" action that creates an expense in the journal.
 */

import React from 'react';
import { RecurringBill, CurrencyCode, ExchangeRates } from '../../types';
import { getUpcomingBills } from '../../utils/calendar';
import { formatCurrency, convertCurrency } from '../../utils/currency';
import { BellRing, Check, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface UpcomingBillsBannerProps {
  bills: RecurringBill[];
  currentDate?: Date;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  onPayBill: (billId: string, monthKey: string) => void;
}

export const UpcomingBillsBanner: React.FC<UpcomingBillsBannerProps> = ({
  bills,
  currentDate = new Date(),
  baseCurrency,
  rates,
  onPayBill,
}) => {
  const upcoming = getUpcomingBills(bills, currentDate);
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="upcoming-bills-banner"
      className="card-cozy p-4 border border-[#F4A28C]/40 bg-[#FAF6F0] rounded-2xl shadow-cozy space-y-3"
    >
      {/* Banner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F4A28C]/30 text-[#7A2E1D] flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="washi-tape washi-tape-coral text-xs font-bold text-[#7A2E1D]">
              Скоро списание
            </span>
            <p className="text-[11px] text-[#8C7F70] mt-0.5">
              Платежи в ближайшие 5 дней
            </p>
          </div>
        </div>
        <span
          data-testid="upcoming-bills-count"
          className="text-xs font-bold text-[#7A2E1D] bg-[#F4A28C]/20 px-2 py-0.5 rounded-full"
        >
          {upcoming.length}
        </span>
      </div>

      {/* Animated List of Due Bills */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {upcoming.map(({ bill, label, daysLeft }) => {
            const formattedBillAmount = formatCurrency(bill.amount, bill.currency);
            const inBase = bill.currency !== baseCurrency
              ? convertCurrency(bill.amount, bill.currency, baseCurrency, rates)
              : null;

            return (
              <motion.div
                key={bill.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                data-testid={`upcoming-bill-${bill.id}`}
                className="p-3 bg-white border border-[#EFECE6] rounded-xl flex items-center justify-between gap-2 shadow-2xs"
              >
                {/* Bill Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs"
                    style={{ backgroundColor: bill.color || '#F4A28C' }}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-xs text-[#3D352E] truncate">
                        {bill.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          daysLeft === 0
                            ? 'bg-red-100 text-red-700'
                            : daysLeft === 1
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-[#F9E29C]/40 text-[#6E5611]'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8C7F70] mt-0.5">
                      {formattedBillAmount}
                      {inBase !== null && ` (≈ ${formatCurrency(inBase, baseCurrency)})`}
                    </p>
                  </div>
                </div>

                {/* One-Tap "Оплачено" Action */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  data-testid={`pay-bill-btn-${bill.id}`}
                  onClick={() => onPayBill(bill.id, currentMonthKey)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#A3C9A8] hover:bg-[#8FB894] text-[#2F5233] text-xs font-heading font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  <span>Оплачено</span>
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
