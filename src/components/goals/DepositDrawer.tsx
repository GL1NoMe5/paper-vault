/**
 * src/components/goals/DepositDrawer.tsx
 * Bottom-sheet drawer for depositing money into a savings goal with quick preset chips.
 */

import React, { useState } from 'react';
import { DreamGoal, CurrencyCode } from '../../types';
import { getCurrencySymbol, parseCurrencyInput, formatCurrency } from '../../utils/currency';
import { triggerMilestoneCelebration } from './CelebrationEffect';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import { X, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';

export interface DepositDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  goal: DreamGoal | null;
  baseCurrency: CurrencyCode;
  onDeposit: (goalId: string, amount: number) => { triggeredMilestone?: number; triggeredMilestones?: number[] };
}

export const DepositDrawer: React.FC<DepositDrawerProps> = ({
  isOpen,
  onClose,
  goal,
  baseCurrency,
  onDeposit,
}) => {
  const [customAmountStr, setCustomAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const symbol = getCurrencySymbol(goal.currency || baseCurrency);

  // Dynamic quick deposit presets based on currency scale
  const presets =
    goal.currency === 'USD' || goal.currency === 'EUR'
      ? [25, 50, 100, 250]
      : goal.currency === 'CZK'
      ? [500, 1000, 2500, 5000]
      : [5000, 10000, 25000, 50000];

  const handleDepositAmount = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Укажите сумму больше 0');
      return;
    }

    const res = onDeposit(goal.id, amount);

    // If milestone crossed, trigger celebration
    if (res.triggeredMilestones && res.triggeredMilestones.length > 0) {
      const highest = Math.max(...res.triggeredMilestones);
      triggerMilestoneCelebration(highest);
    } else if (res.triggeredMilestone) {
      triggerMilestoneCelebration(res.triggeredMilestone);
    }

    setCustomAmountStr('');
    setError(null);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseCurrencyInput(customAmountStr);
    if (!parsed || parsed <= 0) {
      setError('Укажите сумму больше 0');
      return;
    }
    handleDepositAmount(parsed);
  };

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const currentPct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="deposit-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="deposit-drawer-title"
          data-testid="deposit-goal-drawer"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Drawer Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Decorative Tape */}
          <div className="h-2 bg-[#F4A28C]/80 border-b border-[#EFECE6] shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F4A28C]/30 text-[#7A2E1D] flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="deposit-drawer-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Пополнить копилку
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  {goal.title}
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="deposit-drawer-close-btn"
              onClick={onClose}
              aria-label="Закрыть"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Current Goal Status Preview */}
            <div className="card-cozy p-4 rounded-2xl bg-white border border-[#EFECE6] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8C7F70]">Накоплено:</span>
                <span className="font-heading font-bold text-[#2F5233]">
                  {formatCurrency(goal.savedAmount, goal.currency)} ({currentPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EFECE6]">
                <div
                  className="h-full bg-[#A3C9A8] rounded-full transition-all duration-300"
                  style={{ width: `${currentPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#8C7F70]">
                <span>Цель: {formatCurrency(goal.targetAmount, goal.currency)}</span>
                <span>Осталось: {formatCurrency(remaining, goal.currency)}</span>
              </div>
            </div>

            {/* Quick Top-Up Preset Chips */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-2">
                Быстрое пополнение:
              </label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Быстрое пополнение">
                {presets.map((amount) => (
                  <motion.button
                    key={amount}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    data-testid={`quick-deposit-btn-${amount}`}
                    onClick={() => handleDepositAmount(amount)}
                    className="min-h-[48px] px-3 py-2 rounded-2xl bg-white hover:bg-[#FAF6F0] border border-[#EFECE6] hover:border-[#F4A28C]/60 text-xs font-heading font-bold text-[#3D352E] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#7A2E1D]" />
                    <span>+{amount.toLocaleString('ru-RU')} {symbol}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2">
              <div>
                <label htmlFor="custom-deposit" className="block text-xs font-semibold text-[#3D352E] mb-1">
                  Или введите другую сумму ({symbol}):
                </label>
                <div className="relative">
                  <input
                    id="custom-deposit"
                    type="text"
                    inputMode="decimal"
                    data-testid="custom-deposit-input"
                    value={customAmountStr}
                    onChange={(e) => {
                      setCustomAmountStr(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Например: 15 000"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#EFECE6] rounded-xl text-sm font-bold text-[#3D352E] outline-none focus:border-[#F4A28C] focus:ring-2 focus:ring-[#F4A28C]/30 placeholder:text-[#8C7F70]/50"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F70] pointer-events-none">
                    {symbol}
                  </span>
                </div>
                {error && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="custom-deposit-submit-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#F4A28C] hover:bg-[#E8927C] text-[#7A2E1D] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Пополнить копилку</span>
              </motion.button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
