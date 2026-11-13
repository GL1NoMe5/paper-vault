import React, { useState, useEffect, useRef } from 'react';
import { Category, CurrencyCode } from '../../types';
import { SUPPORTED_CURRENCIES, CURRENCIES, parseCurrencyInput } from '../../utils/currency';
import { CategoryIcon } from '../ui/CategoryIcon';
import { X, Check, AlertCircle } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';

export interface ExpenseSavePayload {
  amount: number;
  currency: CurrencyCode;
  category: string;
  date: string;
  note?: string;
  type: 'expense';
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: Category | null;
  baseCurrency?: CurrencyCode;
  onSaveExpense: (expense: ExpenseSavePayload) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  baseCurrency = 'RUB',
  onSaveExpense,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(baseCurrency);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [noteStr, setNoteStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setSelectedCurrency(baseCurrency);
      setDateStr(new Date().toISOString().split('T')[0]);
      setNoteStr('');
      setError(null);
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, baseCurrency, selectedCategory]);

  if (!isOpen || !selectedCategory) return null;

  const handleAmountChange = (val: string) => {
    setAmountStr(val);
    if (error) setError(null);
  };

  const handleSetToday = () => {
    setDateStr(new Date().toISOString().split('T')[0]);
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDateStr(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseCurrencyInput(amountStr);
    if (parsed === null || parsed <= 0) {
      setError('Введите сумму больше 0');
      amountInputRef.current?.focus();
      return;
    }

    onSaveExpense({
      amount: parsed,
      currency: selectedCurrency,
      category: selectedCategory.name,
      date: dateStr,
      note: noteStr.trim() ? noteStr.trim() : undefined,
      type: 'expense',
    });

    onClose();
  };

  const currencyConfig = CURRENCIES[selectedCurrency];

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="expense-modal-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
          data-testid="expense-modal-container"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Drawer Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Top Washi Tape Drag Accent */}
          <div
            className="h-2 w-full border-b border-[#E5DEC9] shrink-0"
            style={{ backgroundColor: `${selectedCategory.color}66` }}
            aria-hidden="true"
          />

          {/* Modal Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: `${selectedCategory.color}35`,
                  color: selectedCategory.color,
                }}
              >
                <CategoryIcon name={selectedCategory.icon} className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="expense-modal-title" className="font-heading font-bold text-base text-[#3D352E]">
                  {selectedCategory.name}
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">Запись расхода</Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="expense-modal-close-btn"
              onClick={onClose}
              aria-label="Закрыть"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body Form */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Amount Large Input */}
            <div className="card-cozy p-4 text-center rounded-2xl">
              <label htmlFor="expense-amount" className="block text-[11px] font-semibold text-[#8C7F70] uppercase mb-1">
                Сумма расхода ({currencyConfig.symbol})
              </label>
              <div className="flex items-center justify-center gap-1">
                <input
                  id="expense-amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  data-testid="expense-amount-input"
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full text-center font-heading font-extrabold text-3xl sm:text-4xl text-[#3D352E] bg-transparent outline-none placeholder:text-[#8C7F70]/40"
                />
                <span className="font-heading font-extrabold text-2xl text-[#8C7F70] select-none">
                  {currencyConfig.symbol}
                </span>
              </div>
              {error && (
                <p className="text-xs text-red-500 mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Currency Pills */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Валюта платежа:
              </label>
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Валюта расхода">
                {SUPPORTED_CURRENCIES.map((code) => {
                  const conf = CURRENCIES[code];
                  const isSelected = selectedCurrency === code;
                  return (
                    <motion.button
                      key={code}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`expense-currency-pill-${code}`}
                      onClick={() => setSelectedCurrency(code)}
                      className={`
                        min-h-[44px] py-1 px-1 rounded-xl border text-xs font-heading font-bold
                        flex flex-col items-center justify-center transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-[#A3C9A8] text-[#2F5233] border-[#8FB894] shadow-xs scale-[1.02]'
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

            {/* Date Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Дата операции:
              </label>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  data-testid="expense-date-today-btn"
                  onClick={handleSetToday}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-heading font-bold bg-white border border-[#EFECE6] hover:bg-[#FAF6F0] text-[#3D352E] cursor-pointer"
                >
                  Сегодня
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  data-testid="expense-date-yesterday-btn"
                  onClick={handleSetYesterday}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-heading font-bold bg-white border border-[#EFECE6] hover:bg-[#FAF6F0] text-[#3D352E] cursor-pointer"
                >
                  Вчера
                </motion.button>
                <div className="relative flex-1">
                  <input
                    type="date"
                    data-testid="expense-date-input"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#EFECE6] text-xs font-medium text-[#3D352E] outline-none focus:border-[#A3C9A8] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label htmlFor="expense-note" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Заметка (необязательно):
              </label>
              <input
                id="expense-note"
                type="text"
                data-testid="expense-note-input"
                placeholder="Например: кофе и круассан"
                value={noteStr}
                onChange={(e) => setNoteStr(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#EFECE6] text-xs text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30 placeholder:text-[#8C7F70]/50"
              />
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="save-expense-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#A3C9A8] hover:bg-[#8FB894] active:scale-98 text-[#2F5233] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Записать в дневник</span>
              </motion.button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
