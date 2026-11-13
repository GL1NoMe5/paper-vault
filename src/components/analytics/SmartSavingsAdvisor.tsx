/**
 * src/components/analytics/SmartSavingsAdvisor.tsx
 * Taped sticky-note widget (#FFF6D6) delivering smart financial tips based on current month's ratios.
 * Uses AnimatePresence mode="popLayout" for responsive tip updates.
 */

import React from 'react';
import { Transaction, RecurringBill, CurrencyCode, ExchangeRates } from '../../types';
import { getSmartSavingsTips } from '../../utils/analytics';
import { Lightbulb, Sparkles, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface SmartSavingsAdvisorProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  monthKey: string;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export const SmartSavingsAdvisor: React.FC<SmartSavingsAdvisorProps> = ({
  transactions,
  bills,
  monthKey,
  baseCurrency,
  rates,
}) => {
  const tips = getSmartSavingsTips(transactions, bills, monthKey, baseCurrency, rates);

  return (
    <div
      data-testid="smart-savings-advisor"
      className="relative pt-3"
    >
      {/* Decorative Washi Tape across top */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#F9E29C]/80 border border-[#E5DEC9] shadow-2xs rotate-[-1deg] z-10 rounded-xs pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Sticky Note Body */}
      <div className="sticky-note p-5 rounded-2xl border border-[#F2E2A6] shadow-sticky space-y-3.5 bg-[#FFF6D6] text-[#524322]">
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-[#F2E2A6]/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#8A7129]" />
            <h3 className="font-heading font-extrabold text-sm text-[#524322]">
              Советник по сбережениям
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#8A7129] bg-[#F2E2A6]/60 px-2 py-0.5 rounded-full">
            Умная заметка
          </span>
        </div>

        {/* Animated Tips List */}
        <div className="space-y-2.5" data-testid="smart-tips-list">
          <AnimatePresence mode="popLayout" initial={false}>
            {tips.map((tip) => (
              <motion.div
                key={tip.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                data-testid={`smart-tip-${tip.id}`}
                className="p-3 bg-white/70 backdrop-blur-2xs rounded-xl border border-[#F2E2A6] shadow-2xs space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    data-testid={`tip-badge-${tip.id}`}
                    className="font-heading font-bold text-xs px-2 py-0.5 rounded-md bg-[#FFF6D6] border border-[#F2E2A6] text-[#6E5611]"
                  >
                    {tip.badge}
                  </span>
                  {tip.severity === 'warning' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {tip.severity === 'success' && (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <p data-testid={`tip-message-${tip.id}`} className="text-xs leading-relaxed text-[#524322]">
                  {tip.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
