import React, { useState, useEffect } from 'react';
import { CurrencyCode, ExchangeRates, FamilyTransferDetails, Transaction } from '../../types';
import { CURRENCIES, convertCurrency, getCurrencySymbol, getDualCurrencyDisplay, parseCurrencyInput } from '../../utils/currency';
import { FAMILY_SENDERS } from '../../utils/family';
import { X, Heart, ArrowRight, Trash2, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';

export interface EditFamilyTransferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency?: CurrencyCode;
  rates: ExchangeRates;
  transaction: Transaction | null;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

const ALL_CURRENCIES: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR', 'CZK'];

export const EditFamilyTransferDrawer: React.FC<EditFamilyTransferDrawerProps> = ({
  isOpen,
  onClose,
  baseCurrency = 'RUB',
  rates,
  transaction,
  onUpdate,
  onDelete,
}) => {
  const [sender, setSender] = useState<string>(FAMILY_SENDERS[0]);
  const [amountInput, setAmountInput] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('RUB');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setSender(transaction.familyDetails?.sender || FAMILY_SENDERS[0]);
      setAmountInput(String(transaction.amount));
      setCurrency(transaction.currency || 'RUB');
      setDate(transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNote(transaction.note || '');
      setError(null);
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const parsedAmount = parseCurrencyInput(amountInput) ?? 0;
  const dual = getDualCurrencyDisplay(parsedAmount, currency, baseCurrency, rates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseCurrencyInput(amountInput);
    if (!amount || amount <= 0) {
      setError('Укажите сумму больше 0');
      return;
    }

    const convertedAmount = convertCurrency(amount, currency, baseCurrency, rates);

    const familyDetails: FamilyTransferDetails = {
      sender,
      originalAmount: amount,
      originalCurrency: currency,
      convertedAmount,
      targetCurrency: baseCurrency,
    };

    onUpdate(transaction.id, {
      amount,
      currency,
      category: 'Помощь родителей',
      date: date ? new Date(date).toISOString() : transaction.date,
      note: note.trim() || undefined,
      familyDetails,
    });

    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-family-drawer-title"
          data-testid="edit-family-drawer"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] dark:bg-[#1C1917] border-t border-[#EFECE6] dark:border-[#3E3835] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none transition-colors"
        >
          {/* Mobile Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] dark:bg-[#3E3835] rounded-full" />
          </div>

          {/* Decorative Accent */}
          <div className="h-2 bg-[#F2C6CE]/70 dark:bg-[#F2C6CE]/40 border-b border-[#EFECE6] dark:border-[#3E3835] shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] dark:border-[#3E3835] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F2C6CE]/35 text-[#7A2E1D] dark:text-[#F2C6CE] flex items-center justify-center shadow-xs">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="edit-family-drawer-title" className="font-heading font-bold text-base text-[#3D352E] dark:text-[#F5EFEB]">
                  Редактировать перевод
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70] dark:text-[#A89F91]">
                  Изменение данных перевода от родителей
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="edit-family-close-btn"
              onClick={onClose}
              aria-label="Закрыть окно"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] dark:text-[#A89F91] hover:text-[#3D352E] dark:hover:text-[#F5EFEB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Sender Chips */}
            <div>
              <label className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1.5">
                Отправитель
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {FAMILY_SENDERS.map((s) => {
                  const isSelected = sender === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      data-testid={`edit-family-sender-${s}`}
                      onClick={() => setSender(s)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2C6CE]/40 border-[#F2C6CE] text-[#6E2D38] dark:text-[#F2C6CE] shadow-xs'
                          : 'bg-white dark:bg-[#292524] border-[#EFECE6] dark:border-[#3E3835] text-[#8C7F70] dark:text-[#A89F91] hover:text-[#3D352E] dark:hover:text-[#F5EFEB]'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency Selector Chips */}
            <div>
              <label className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1.5">
                Валюта перевода
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {ALL_CURRENCIES.map((code) => {
                  const isSelected = currency === code;
                  const cfg = CURRENCIES[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      data-testid={`edit-family-currency-${code}`}
                      onClick={() => setCurrency(code)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2C6CE]/40 border-[#F2C6CE] text-[#6E2D38] dark:text-[#F2C6CE] shadow-xs'
                          : 'bg-white dark:bg-[#292524] border-[#EFECE6] dark:border-[#3E3835] text-[#8C7F70] dark:text-[#A89F91] hover:text-[#3D352E] dark:hover:text-[#F5EFEB]'
                      }`}
                    >
                      <span>{cfg.flag}</span>
                      <span>{code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label htmlFor="edit-family-amount" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                Сумма перевода ({getCurrencySymbol(currency)})
              </label>
              <input
                id="edit-family-amount"
                type="text"
                inputMode="decimal"
                data-testid="edit-family-amount-input"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError(null);
                }}
                className={`w-full min-h-[48px] px-4 py-2 rounded-xl border bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#F2C6CE] ${
                  error ? 'border-red-400' : 'border-[#EFECE6] dark:border-[#3E3835]'
                }`}
              />
              {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
            </div>

            {/* Live Multi-Currency Conversion Card */}
            <div className="card-cozy p-4 border border-[#F2C6CE]/50 dark:border-[#F2C6CE]/30 bg-[#FFFBFB] dark:bg-[#201D1B] rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="washi-tape washi-tape-rose text-[11px] font-bold text-[#6E2D38] flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  Конвертация в основную валюту
                </span>
                <span className="text-[10px] font-mono text-[#8C7F70] dark:text-[#A89F91]">
                  Базовая: {baseCurrency}
                </span>
              </div>

              {dual.isDifferent ? (
                <div className="mt-2 flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-heading font-bold text-[#3D352E] dark:text-[#F5EFEB]">
                    {dual.originalFormatted}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#8C7F70] dark:text-[#A89F91]" />
                  <span className="font-heading font-black text-lg text-[#2F5233] dark:text-[#A3C9A8]">
                    {dual.approximateText}
                  </span>
                  <span className="text-xs text-[#8C7F70] dark:text-[#A89F91]">
                    (по текущему курсу)
                  </span>
                </div>
              ) : (
                <div className="mt-1">
                  <span className="font-heading font-black text-lg text-[#2F5233] dark:text-[#A3C9A8]">
                    {dual.originalFormatted}
                  </span>
                </div>
              )}
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-family-date" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                  Дата
                </label>
                <input
                  id="edit-family-date"
                  type="date"
                  data-testid="edit-family-date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#EFECE6] dark:border-[#3E3835] bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F2C6CE]"
                />
              </div>

              <div>
                <label htmlFor="edit-family-note" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                  Заметка
                </label>
                <input
                  id="edit-family-note"
                  type="text"
                  data-testid="edit-family-note-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#EFECE6] dark:border-[#3E3835] bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F2C6CE]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                data-testid="edit-family-delete-btn"
                onClick={handleDelete}
                className="min-h-[48px] px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>

              <motion.button
                type="submit"
                data-testid="edit-family-submit-btn"
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-h-[48px] px-5 rounded-xl bg-[#2F5233] text-[#FAF6F0] font-heading font-bold text-sm shadow-cozy hover:bg-[#244027] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Сохранить изменения
              </motion.button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
