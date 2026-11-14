/**
 * src/components/goals/AddGoalDrawer.tsx
 * Vaul bottom-sheet drawer to create a new dream goal.
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode, DreamGoal } from '../../types';
import { SUPPORTED_CURRENCIES, CURRENCIES, parseCurrencyInput } from '../../utils/currency';
import { PASTEL_PALETTE } from '../../utils/analytics';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import { X, Check, Trophy, AlertCircle } from 'lucide-react';

export interface AddGoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency: CurrencyCode;
  onAddGoal: (goal: Omit<DreamGoal, 'id' | 'createdAt' | 'savedAmount' | 'celebratedMilestones'>) => void;
}

export const AddGoalDrawer: React.FC<AddGoalDrawerProps> = ({
  isOpen,
  onClose,
  baseCurrency,
  onAddGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [selectedColor, setSelectedColor] = useState<string>(PASTEL_PALETTE[1]); // Terracotta coral
  const [errors, setErrors] = useState<{ title?: string; target?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTargetStr('');
      setCurrency(baseCurrency);
      setSelectedColor(PASTEL_PALETTE[1]);
      setErrors({});
    }
  }, [isOpen, baseCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; target?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Введите название цели';
    }

    const parsedTarget = parseCurrencyInput(targetStr);
    if (!parsedTarget || parsedTarget <= 0) {
      newErrors.target = 'Укажите сумму цели больше 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAddGoal({
      title: title.trim(),
      targetAmount: parsedTarget!,
      currency,
      color: selectedColor,
      icon: 'Trophy',
    });

    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="add-goal-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-goal-drawer-title"
          data-testid="add-goal-drawer-container"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Drawer Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Top Washi Tape Drag Accent */}
          <div
            className="h-2 w-full border-b border-[#E5DEC9] shrink-0"
            style={{ backgroundColor: `${selectedColor}66` }}
            aria-hidden="true"
          />

          {/* Drawer Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white font-bold"
                style={{ backgroundColor: selectedColor }}
              >
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <Drawer.Title id="add-goal-drawer-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Новая мечта
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  Создание новой финансовой цели
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="add-goal-close-btn"
              onClick={onClose}
              aria-label="Закрыть"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Title */}
            <div>
              <label htmlFor="add-goal-title" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Название цели / мечты:
              </label>
              <input
                id="add-goal-title"
                type="text"
                data-testid="add-goal-title-input"
                placeholder="Например: Новый ноутбук, Отпуск на море, Подушка безопасности"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={`
                  w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm text-[#3D352E] bg-white outline-none transition-colors
                  ${errors.title ? 'border-red-400 focus:border-red-500' : 'border-[#EFECE6] focus:border-[#8C7F70]'}
                `}
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Target Amount */}
            <div>
              <label htmlFor="add-goal-target" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Целевая сумма ({CURRENCIES[currency]?.symbol || currency}):
              </label>
              <input
                id="add-goal-target"
                type="text"
                inputMode="decimal"
                data-testid="add-goal-target-input"
                placeholder="0"
                value={targetStr}
                onChange={(e) => {
                  setTargetStr(e.target.value);
                  if (errors.target) setErrors((prev) => ({ ...prev, target: undefined }));
                }}
                className={`
                  w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm text-[#3D352E] bg-white outline-none font-bold transition-colors
                  ${errors.target ? 'border-red-400 focus:border-red-500' : 'border-[#EFECE6] focus:border-[#8C7F70]'}
                `}
              />
              {errors.target && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.target}</span>
                </p>
              )}
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Валюта:
              </label>
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Валюта цели">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const conf = CURRENCIES[c];
                  const isSelected = currency === c;
                  return (
                    <motion.button
                      key={c}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      data-testid={`add-goal-currency-${c}`}
                      onClick={() => setCurrency(c)}
                      className={`
                        min-h-[44px] py-1.5 px-1 rounded-xl border text-xs font-heading font-bold
                        flex flex-col items-center justify-center transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-[#F4A28C] text-[#7A2E1D] border-[#E8927C] shadow-xs'
                          : 'bg-white hover:bg-[#FAF6F0] text-[#3D352E] border-[#EFECE6]'
                        }
                      `}
                    >
                      <span className="text-sm select-none">{conf.flag}</span>
                      <span className="mt-0.5 text-[11px]">{conf.code}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Цвет карточки:
              </label>
              <div className="flex gap-2">
                {PASTEL_PALETTE.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <motion.button
                      key={col}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      data-testid={`add-goal-color-${col}`}
                      onClick={() => setSelectedColor(col)}
                      className={`
                        w-9 h-9 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center
                        ${isSelected ? 'border-[#3D352E] scale-110 shadow-sm' : 'border-transparent'}
                      `}
                      style={{ backgroundColor: col }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-[#3D352E]" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="add-goal-submit-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#F4A28C] hover:bg-[#E8927C] text-[#7A2E1D] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Создать мечту</span>
              </motion.button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
