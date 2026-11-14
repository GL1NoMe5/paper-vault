/**
 * src/components/calendar/EditSubscriptionDrawer.tsx
 * Vaul bottom-sheet drawer to edit or delete an existing recurring subscription.
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode, RecurringBill } from '../../types';
import { SUPPORTED_CURRENCIES, CURRENCIES, parseCurrencyInput } from '../../utils/currency';
import { PASTEL_PALETTE } from '../../utils/analytics';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import { X, Check, Trash2, Calendar, AlertCircle } from 'lucide-react';

export interface EditSubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bill: RecurringBill | null;
  baseCurrency: CurrencyCode;
  onUpdateBill: (id: string, updates: Partial<Omit<RecurringBill, 'id' | 'createdAt'>>) => void;
  onDeleteBill?: (id: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Подписки',
  'Жилье и уют',
  'Связь и интернет',
  'Развлечения',
  'Транспорт',
  'Образование',
];

export const EditSubscriptionDrawer: React.FC<EditSubscriptionDrawerProps> = ({
  isOpen,
  onClose,
  bill,
  baseCurrency,
  onUpdateBill,
  onDeleteBill,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [category, setCategory] = useState<string>('Подписки');
  const [selectedColor, setSelectedColor] = useState<string>(PASTEL_PALETTE[3]);
  const [errors, setErrors] = useState<{ title?: string; amount?: string; day?: string }>({});

  useEffect(() => {
    if (isOpen && bill) {
      setTitle(bill.title);
      setAmountStr(String(bill.amount));
      setCurrency(bill.currency || baseCurrency);
      setDayOfMonth(bill.dayOfMonth);
      setCategory(bill.category);
      setSelectedColor(bill.color || PASTEL_PALETTE[3]);
      setErrors({});
    }
  }, [isOpen, bill, baseCurrency]);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; amount?: string; day?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Введите название платежа';
    }

    const parsedAmount = parseCurrencyInput(amountStr);
    if (!parsedAmount || parsedAmount <= 0) {
      newErrors.amount = 'Укажите сумму больше 0';
    }

    const dayNum = Number(dayOfMonth);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
      newErrors.day = 'День должен быть от 1 до 31';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onUpdateBill(bill.id, {
      title: title.trim(),
      amount: parsedAmount!,
      currency,
      dayOfMonth: dayNum,
      category,
      color: selectedColor,
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDeleteBill) {
      onDeleteBill(bill.id);
    }
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="edit-sub-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sub-drawer-title"
          data-testid="edit-sub-drawer-container"
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
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <Drawer.Title id="edit-sub-drawer-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Редактировать подписку
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  Изменение параметров регулярного платежа
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="edit-sub-close-btn"
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
              <label htmlFor="edit-sub-title" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Название подписки / платежа:
              </label>
              <input
                id="edit-sub-title"
                type="text"
                data-testid="edit-sub-title-input"
                placeholder="Например: Яндекс Плюс, Аренда, Спортзал"
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

            {/* Amount & Day Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div>
                <label htmlFor="edit-sub-amount" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                  Сумма ({CURRENCIES[currency]?.symbol || currency}):
                </label>
                <input
                  id="edit-sub-amount"
                  type="text"
                  inputMode="decimal"
                  data-testid="edit-sub-amount-input"
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                  className={`
                    w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm text-[#3D352E] bg-white outline-none font-bold transition-colors
                    ${errors.amount ? 'border-red-400 focus:border-red-500' : 'border-[#EFECE6] focus:border-[#8C7F70]'}
                  `}
                />
                {errors.amount && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Day of Month */}
              <div>
                <label htmlFor="edit-sub-day" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                  День месяца (1–31):
                </label>
                <input
                  id="edit-sub-day"
                  type="number"
                  min="1"
                  max="31"
                  data-testid="edit-sub-day-input"
                  value={dayOfMonth}
                  onChange={(e) => {
                    setDayOfMonth(Number(e.target.value));
                    if (errors.day) setErrors((prev) => ({ ...prev, day: undefined }));
                  }}
                  className={`
                    w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm text-[#3D352E] bg-white outline-none font-bold transition-colors
                    ${errors.day ? 'border-red-400 focus:border-red-500' : 'border-[#EFECE6] focus:border-[#8C7F70]'}
                  `}
                />
                {errors.day && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.day}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Валюта:
              </label>
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Валюта подписки">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const conf = CURRENCIES[c];
                  const isSelected = currency === c;
                  return (
                    <motion.button
                      key={c}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      data-testid={`edit-sub-currency-${c}`}
                      onClick={() => setCurrency(c)}
                      className={`
                        min-h-[44px] py-1.5 px-1 rounded-xl border text-xs font-heading font-bold
                        flex flex-col items-center justify-center transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-[#A3C9A8] text-[#2F5233] border-[#8FB894] shadow-xs'
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

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Категория:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`edit-sub-category-${cat}`}
                      onClick={() => setCategory(cat)}
                      className={`
                        min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-[#F9E29C] border-[#F2D785] text-[#6E5611] font-bold shadow-2xs'
                          : 'bg-white border-[#EFECE6] text-[#3D352E] hover:bg-[#FAF6F0]'
                        }
                      `}
                    >
                      {cat}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Цвет стикера на календаре:
              </label>
              <div className="flex gap-2">
                {PASTEL_PALETTE.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <motion.button
                      key={col}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      data-testid={`edit-sub-color-${col}`}
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

            {/* Submit & Delete Action Buttons */}
            <div className="pt-2 space-y-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="edit-sub-submit-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#A3C9A8] hover:bg-[#92ba97] text-[#2F5233] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Сохранить изменения</span>
              </motion.button>

              {onDeleteBill && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  data-testid="edit-sub-delete-btn"
                  onClick={handleDelete}
                  className="w-full min-h-[44px] rounded-2xl bg-white hover:bg-[#F4A28C]/20 border border-[#F4A28C]/60 text-[#7A2E1D] font-heading font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Удалить подписку</span>
                </motion.button>
              )}
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
