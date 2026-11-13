/**
 * src/components/calendar/AddSubscriptionDrawer.tsx
 * Vaul bottom-sheet drawer to create a new recurring subscription.
 */

import React, { useState } from 'react';
import { CurrencyCode, RecurringBill } from '../../types';
import { SUPPORTED_CURRENCIES, CURRENCIES, parseCurrencyInput } from '../../utils/currency';
import { PASTEL_PALETTE } from '../../utils/analytics';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import { X, Check, Calendar, AlertCircle } from 'lucide-react';

export interface AddSubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency: CurrencyCode;
  onAddBill: (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>) => void;
}

const DEFAULT_CATEGORIES = [
  'Подписки',
  'Жилье и уют',
  'Связь и интернет',
  'Развлечения',
  'Транспорт',
  'Образование',
];

export const AddSubscriptionDrawer: React.FC<AddSubscriptionDrawerProps> = ({
  isOpen,
  onClose,
  baseCurrency,
  onAddBill,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [category, setCategory] = useState<string>('Подписки');
  const [selectedColor, setSelectedColor] = useState<string>(PASTEL_PALETTE[3]); // Lavender default
  const [errors, setErrors] = useState<{ title?: string; amount?: string; day?: string }>({});

  const handleReset = () => {
    setTitle('');
    setAmountStr('');
    setCurrency(baseCurrency);
    setDayOfMonth(1);
    setCategory('Подписки');
    setSelectedColor(PASTEL_PALETTE[3]);
    setErrors({});
  };

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

    onAddBill({
      title: title.trim(),
      amount: parsedAmount!,
      currency,
      dayOfMonth: dayNum,
      category,
      color: selectedColor,
    });

    handleReset();
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="add-sub-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-sub-title"
          data-testid="add-subscription-drawer"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Drawer Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Decorative Washi Accent */}
          <div className="h-2 bg-[#F9E29C]/80 border-b border-[#EFECE6] shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F9E29C]/40 text-[#6E5611] flex items-center justify-center shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="add-sub-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Новый регулярный платеж
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  Подписка или ежемесячный счет
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="add-sub-close-btn"
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
              <label htmlFor="sub-title" className="block text-xs font-semibold text-[#3D352E] mb-1">
                Название подписки:
              </label>
              <input
                id="sub-title"
                type="text"
                data-testid="sub-title-input"
                placeholder="Например: Яндекс Плюс, Интернет"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#EFECE6] rounded-xl text-xs text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30 placeholder:text-[#8C7F70]/50"
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
                <label htmlFor="sub-amount" className="block text-xs font-semibold text-[#3D352E] mb-1">
                  Сумма ({CURRENCIES[currency]?.symbol}):
                </label>
                <input
                  id="sub-amount"
                  type="text"
                  inputMode="decimal"
                  data-testid="sub-amount-input"
                  placeholder="299"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#EFECE6] rounded-xl text-xs font-bold text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30 placeholder:text-[#8C7F70]/50"
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
                <label htmlFor="sub-day" className="block text-xs font-semibold text-[#3D352E] mb-1">
                  День списания (1–31):
                </label>
                <input
                  id="sub-day"
                  type="number"
                  min={1}
                  max={31}
                  data-testid="sub-day-input"
                  value={dayOfMonth}
                  onChange={(e) => {
                    setDayOfMonth(Number(e.target.value));
                    if (errors.day) setErrors((prev) => ({ ...prev, day: undefined }));
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#EFECE6] rounded-xl text-xs font-bold text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30"
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
              <div className="grid grid-cols-5 gap-1.5">
                {SUPPORTED_CURRENCIES.map((code) => {
                  const conf = CURRENCIES[code];
                  const isSelected = currency === code;
                  return (
                    <motion.button
                      key={code}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`sub-currency-${code}`}
                      onClick={() => setCurrency(code)}
                      className={`
                        min-h-[44px] py-1 px-1 rounded-xl border text-xs font-heading font-bold
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
                      data-testid={`sub-category-${cat}`}
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
                      data-testid={`sub-color-${col}`}
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

            {/* Submit */}
            <div className="pt-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="submit-add-sub-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#F9E29C] hover:bg-[#F2D785] text-[#6E5611] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Добавить в планер</span>
              </motion.button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
