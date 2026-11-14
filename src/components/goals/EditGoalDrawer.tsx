/**
 * src/components/goals/EditGoalDrawer.tsx
 * Vaul bottom-sheet drawer to edit or delete an existing dream goal.
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode, DreamGoal } from '../../types';
import { SUPPORTED_CURRENCIES, CURRENCIES, parseCurrencyInput } from '../../utils/currency';
import { PASTEL_PALETTE } from '../../utils/analytics';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import { X, Check, Trash2, Trophy, AlertCircle } from 'lucide-react';

export interface EditGoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  goal: DreamGoal | null;
  baseCurrency: CurrencyCode;
  onUpdateGoal: (id: string, updates: Partial<Omit<DreamGoal, 'id' | 'createdAt'>>) => void;
  onDeleteGoal?: (id: string) => void;
}

export const EditGoalDrawer: React.FC<EditGoalDrawerProps> = ({
  isOpen,
  onClose,
  goal,
  baseCurrency,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [savedStr, setSavedStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [selectedColor, setSelectedColor] = useState<string>(PASTEL_PALETTE[1]);
  const [errors, setErrors] = useState<{ title?: string; target?: string; saved?: string }>({});

  useEffect(() => {
    if (isOpen && goal) {
      setTitle(goal.title);
      setTargetStr(String(goal.targetAmount));
      setSavedStr(String(goal.savedAmount));
      setCurrency(goal.currency || baseCurrency);
      setSelectedColor(goal.color || PASTEL_PALETTE[1]);
      setErrors({});
    }
  }, [isOpen, goal, baseCurrency]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; target?: string; saved?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Введите название цели';
    }

    const parsedTarget = parseCurrencyInput(targetStr);
    if (!parsedTarget || parsedTarget <= 0) {
      newErrors.target = 'Укажите сумму цели больше 0';
    }

    const parsedSaved = savedStr.trim() === '' ? 0 : parseCurrencyInput(savedStr);
    if (parsedSaved === null || parsedSaved < 0) {
      newErrors.saved = 'Собранная сумма не может быть отрицательной';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const targetAmount = parsedTarget!;
    const savedAmount = parsedSaved!;
    const pct = (savedAmount / targetAmount) * 100;
    const celebrated = [25, 50, 75, 100].filter((m) => pct >= m);

    onUpdateGoal(goal.id, {
      title: title.trim(),
      targetAmount,
      savedAmount,
      currency,
      color: selectedColor,
      celebratedMilestones: celebrated,
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDeleteGoal) {
      onDeleteGoal(goal.id);
    }
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="edit-goal-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-goal-drawer-title"
          data-testid="edit-goal-drawer-container"
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
                <Drawer.Title id="edit-goal-drawer-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Редактировать цель
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  Изменение параметров и баланса копилки
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="edit-goal-close-btn"
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
              <label htmlFor="edit-goal-title" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Название цели / мечты:
              </label>
              <input
                id="edit-goal-title"
                type="text"
                data-testid="edit-goal-title-input"
                placeholder="Например: Новый ноутбук, Отпуск на море"
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

            {/* Target & Saved Amounts Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Target Amount */}
              <div>
                <label htmlFor="edit-goal-target" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                  Цель ({CURRENCIES[currency]?.symbol || currency}):
                </label>
                <input
                  id="edit-goal-target"
                  type="text"
                  inputMode="decimal"
                  data-testid="edit-goal-target-input"
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

              {/* Saved Amount */}
              <div>
                <label htmlFor="edit-goal-saved" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                  Уже накоплено:
                </label>
                <input
                  id="edit-goal-saved"
                  type="text"
                  inputMode="decimal"
                  data-testid="edit-goal-saved-input"
                  placeholder="0"
                  value={savedStr}
                  onChange={(e) => {
                    setSavedStr(e.target.value);
                    if (errors.saved) setErrors((prev) => ({ ...prev, saved: undefined }));
                  }}
                  className={`
                    w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm text-[#3D352E] bg-white outline-none font-bold transition-colors
                    ${errors.saved ? 'border-red-400 focus:border-red-500' : 'border-[#EFECE6] focus:border-[#8C7F70]'}
                  `}
                />
                {errors.saved && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.saved}</span>
                  </p>
                )}
              </div>
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
                      data-testid={`edit-goal-currency-${c}`}
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
                      data-testid={`edit-goal-color-${col}`}
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

            {/* Submit & Delete Buttons */}
            <div className="pt-2 space-y-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="edit-goal-submit-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#A3C9A8] hover:bg-[#92ba97] text-[#2F5233] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Сохранить изменения</span>
              </motion.button>

              {onDeleteGoal && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  data-testid="edit-goal-delete-btn"
                  onClick={handleDelete}
                  className="w-full min-h-[44px] rounded-2xl bg-white hover:bg-[#F4A28C]/20 border border-[#F4A28C]/60 text-[#7A2E1D] font-heading font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Удалить цель</span>
                </motion.button>
              )}
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
