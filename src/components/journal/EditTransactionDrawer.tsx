/**
 * src/components/journal/EditTransactionDrawer.tsx
 * Vaul-based drawer for editing or deleting an existing transaction (expense or income).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Category, CurrencyCode } from '../../types';
import { SUPPORTED_CURRENCIES, CURRENCIES, parseCurrencyInput } from '../../utils/currency';
import { CategoryIcon } from '../ui/CategoryIcon';
import { X, Check, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';

export interface EditTransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  baseCurrency: CurrencyCode;
  categories: Category[];
  onUpdateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const EditTransactionDrawer: React.FC<EditTransactionDrawerProps> = ({
  isOpen,
  onClose,
  transaction,
  baseCurrency,
  categories,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(baseCurrency);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [noteStr, setNoteStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setAmountStr(String(transaction.amount));
      setSelectedCurrency(transaction.currency || baseCurrency);
      setSelectedCategoryName(transaction.category);
      setDateStr(
        transaction.date
          ? transaction.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setNoteStr(transaction.note || '');
      setError(null);
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, transaction, baseCurrency]);

  if (!isOpen || !transaction) return null;

  const currentCategoryObj = categories.find((c) => c.name === selectedCategoryName);
  const accentColor = currentCategoryObj?.color || (transaction.type === 'income' ? '#A3C9A8' : '#F4A28C');
  const currencyConfig = CURRENCIES[selectedCurrency] || CURRENCIES.RUB;

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

    onUpdateTransaction(transaction.id, {
      amount: parsed,
      currency: selectedCurrency,
      category: selectedCategoryName,
      date: dateStr,
      note: noteStr.trim() ? noteStr.trim() : undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDeleteTransaction) {
      onDeleteTransaction(transaction.id);
    }
    onClose();
  };

  // Filter categories matching transaction type
  const relevantCategories = categories.filter((c) => c.type === transaction.type);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="edit-tx-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-tx-title"
          data-testid="edit-tx-container"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Drawer Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Top Washi Tape Drag Accent */}
          <div
            className="h-2 w-full border-b border-[#E5DEC9] shrink-0"
            style={{ backgroundColor: `${accentColor}66` }}
            aria-hidden="true"
          />

          {/* Modal Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: `${accentColor}35`,
                  color: accentColor,
                }}
              >
                <CategoryIcon
                  name={currentCategoryObj?.icon || (transaction.type === 'income' ? 'Briefcase' : 'ShoppingBag')}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <Drawer.Title id="edit-tx-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Редактировать запись
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  {transaction.type === 'income' ? 'Доход' : 'Расход'} • {selectedCategoryName}
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="edit-tx-close-btn"
              onClick={onClose}
              aria-label="Закрыть"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Amount Large Input */}
            <div className="card-cozy p-4 text-center rounded-2xl">
              <label htmlFor="edit-tx-amount" className="block text-[11px] font-semibold text-[#8C7F70] uppercase mb-1">
                Сумма ({currencyConfig.symbol})
              </label>
              <div className="flex items-center justify-center gap-1">
                <input
                  id="edit-tx-amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  data-testid="edit-tx-amount-input"
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

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Валюта:
              </label>
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Валюта записи">
                {SUPPORTED_CURRENCIES.map((code) => {
                  const conf = CURRENCIES[code];
                  const isSelected = selectedCurrency === code;
                  return (
                    <motion.button
                      key={code}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`edit-tx-currency-${code}`}
                      onClick={() => setSelectedCurrency(code)}
                      className={`
                        min-h-[44px] py-1 px-1 rounded-xl border text-xs font-heading font-bold
                        flex flex-col items-center justify-center transition-all cursor-pointer
                        ${
                          isSelected
                            ? 'bg-[#FDFBF7] border-[#8C7F70] shadow-xs text-[#3D352E]'
                            : 'bg-white/60 border-[#EFECE6] text-[#8C7F70] hover:border-[#E5DEC9]'
                        }
                      `}
                    >
                      <span>{conf.symbol}</span>
                      <span className="text-[10px] font-mono text-[#8C7F70] font-normal">{code}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Категория:
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                {relevantCategories.map((cat) => {
                  const isSelected = selectedCategoryName === cat.name;
                  return (
                    <motion.button
                      key={cat.name}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      data-testid={`edit-tx-category-${cat.name}`}
                      onClick={() => setSelectedCategoryName(cat.name)}
                      className={`
                        min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-2 border transition-all cursor-pointer
                        ${
                          isSelected
                            ? 'shadow-xs border-transparent'
                            : 'bg-white border-[#EFECE6] text-[#8C7F70] hover:border-[#E5DEC9]'
                        }
                      `}
                      style={{
                        backgroundColor: isSelected ? `${cat.color}35` : undefined,
                        color: isSelected ? '#3D352E' : undefined,
                        borderColor: isSelected ? cat.color : undefined,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date Input with Shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="edit-tx-date" className="text-xs font-semibold text-[#3D352E]">
                  Дата записи:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSetToday}
                    className="min-h-[44px] px-2 py-1 text-[11px] font-semibold text-[#8C7F70] hover:text-[#2F5233] bg-white rounded-lg border border-[#EFECE6] hover:bg-[#A3C9A8]/20 transition-colors cursor-pointer"
                  >
                    Сегодня
                  </button>
                  <button
                    type="button"
                    onClick={handleSetYesterday}
                    className="min-h-[44px] px-2 py-1 text-[11px] font-semibold text-[#8C7F70] hover:text-[#2F5233] bg-white rounded-lg border border-[#EFECE6] hover:bg-[#A3C9A8]/20 transition-colors cursor-pointer"
                  >
                    Вчера
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  id="edit-tx-date"
                  type="date"
                  data-testid="edit-tx-date-input"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-white rounded-xl border border-[#EFECE6] text-xs font-medium text-[#3D352E] outline-none focus:border-[#8C7F70] transition-colors"
                />
                <Calendar className="w-4 h-4 text-[#8C7F70] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label htmlFor="edit-tx-note" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Заметка (необязательно):
              </label>
              <input
                id="edit-tx-note"
                type="text"
                data-testid="edit-tx-note-input"
                placeholder="Например: кофе на вынос, такси до дома..."
                value={noteStr}
                onChange={(e) => setNoteStr(e.target.value)}
                maxLength={100}
                className="w-full min-h-[44px] px-3 py-2 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#3D352E] placeholder:text-[#8C7F70]/50 outline-none focus:border-[#8C7F70] transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                data-testid="edit-tx-submit-btn"
                className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-[#A3C9A8] hover:bg-[#92ba97] text-[#2F5233] font-heading font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </motion.button>

              {onDeleteTransaction && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  data-testid="edit-tx-delete-btn"
                  onClick={handleDelete}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-white hover:bg-[#F4A28C]/20 border border-[#F4A28C]/60 text-[#7A2E1D] font-heading font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Удалить запись</span>
                </motion.button>
              )}
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
