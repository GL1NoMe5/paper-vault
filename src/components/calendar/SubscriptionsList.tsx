/**
 * src/components/calendar/SubscriptionsList.tsx
 * Interactive list of all recurring monthly bills with payment status and one-tap action.
 */

import React from 'react';
import { RecurringBill, CurrencyCode, ExchangeRates } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/currency';
import { Check, Clock, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export interface SubscriptionsListProps {
  bills: RecurringBill[];
  currentMonthKey: string;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  onPayBill: (billId: string, monthKey: string) => void;
  onEditBill?: (bill: RecurringBill) => void;
  onDeleteBill?: (billId: string) => void;
}

export const SubscriptionsList: React.FC<SubscriptionsListProps> = ({
  bills,
  currentMonthKey,
  baseCurrency,
  rates,
  onPayBill,
  onEditBill,
  onDeleteBill,
}) => {
  return (
    <div data-testid="subscriptions-list-container" className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="washi-tape washi-tape-butter text-xs font-bold text-[#6E5611]">
            Все регулярные платежи
          </span>
        </div>
        <span className="text-[11px] text-[#8C7F70] font-medium">
          {bills.length} подписок
        </span>
      </div>

      {bills.length === 0 ? (
        <div
          data-testid="no-subscriptions-empty"
          className="p-6 border border-dashed border-[#E5DEC9] bg-[#FDFBF7] rounded-3xl text-center"
        >
          <CreditCard className="w-8 h-8 text-[#8C7F70]/60 mx-auto mb-2" />
          <p className="font-heading font-bold text-xs text-[#3D352E]">
            Нет добавленных подписок
          </p>
          <p className="text-[11px] text-[#8C7F70] mt-0.5">
            Нажмите кнопку ниже, чтобы добавить регулярный платеж
          </p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="subscriptions-cards-list">
          {bills.map((bill) => {
            const isPaid = bill.paidMonths?.includes(currentMonthKey);
            const formattedAmount = formatCurrency(bill.amount, bill.currency);
            const inBase = bill.currency !== baseCurrency
              ? convertCurrency(bill.amount, bill.currency, baseCurrency, rates)
              : null;

            return (
              <div
                key={bill.id}
                data-testid={`subscription-item-${bill.id}`}
                className="card-cozy p-3.5 bg-white border border-[#EFECE6] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
              >
                {/* Left: Day Badge & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-white font-heading font-bold shadow-2xs"
                    style={{ backgroundColor: bill.color || '#A3C9A8' }}
                  >
                    <span className="text-[10px] leading-none opacity-80 uppercase">день</span>
                    <span className="text-sm leading-none mt-0.5">{bill.dayOfMonth}</span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-xs text-[#3D352E] truncate">
                      {bill.title}
                    </h4>
                    <p className="text-[11px] text-[#8C7F70] truncate mt-0.5">
                      {bill.category} • Каждое {bill.dayOfMonth}-е число
                    </p>
                  </div>
                </div>

                {/* Right: Amount & Status / Action */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="font-heading font-bold text-xs text-[#3D352E] block">
                      {formattedAmount}
                    </span>
                    {inBase !== null && (
                      <span className="text-[10px] text-[#8C7F70] font-mono block">
                        ≈ {formatCurrency(inBase, baseCurrency)}
                      </span>
                    )}
                  </div>

                  {isPaid ? (
                    <span
                      data-testid={`subscription-paid-badge-${bill.id}`}
                      className="min-h-[44px] px-3 py-1 rounded-xl bg-[#A3C9A8]/20 text-[#2F5233] text-xs font-heading font-bold flex items-center gap-1"
                    >
                      <Check className="w-4 h-4 text-[#2F5233]" strokeWidth={2.5} />
                      <span>Оплачено</span>
                    </span>
                  ) : (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`subscription-pay-btn-${bill.id}`}
                      onClick={() => onPayBill(bill.id, currentMonthKey)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#F9E29C] hover:bg-[#F2D785] text-[#6E5611] text-xs font-heading font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Оплатить</span>
                    </motion.button>
                  )}

                  {onEditBill && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      data-testid={`subscription-edit-btn-${bill.id}`}
                      onClick={() => onEditBill(bill)}
                      aria-label={`Редактировать подписку: ${bill.title}`}
                      className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] hover:text-[#6E5611] hover:bg-[#F9E29C]/25 transition-all cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                  )}

                  {onDeleteBill && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      data-testid={`subscription-delete-btn-${bill.id}`}
                      onClick={() => onDeleteBill(bill.id)}
                      aria-label={`Удалить подписку: ${bill.title}`}
                      className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] hover:text-[#7A2E1D] hover:bg-[#F4A28C]/20 transition-all cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
