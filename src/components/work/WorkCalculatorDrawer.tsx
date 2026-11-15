import React, { useState, useEffect } from 'react';
import { CurrencyCode, ExchangeRates, Transaction, WorkDetails } from '../../types';
import { CURRENCIES, formatCurrency, getCurrencySymbol, getDualCurrencyDisplay } from '../../utils/currency';
import {
  calculateWorkPayout,
  parseWorkInput,
  QUICK_TAX_PRESETS,
} from '../../utils/work';
import { X, Briefcase, Calculator, Percent, Clock, Trash2, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';

export interface WorkCalculatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency?: CurrencyCode;
  rates: ExchangeRates;
  onSaveWork: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialTransaction?: Transaction | null;
  onDelete?: (id: string) => void;
}

const ALL_CURRENCIES: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR', 'CZK'];
const QUICK_HOURS = [4, 8, 10, 12];

export const WorkCalculatorDrawer: React.FC<WorkCalculatorDrawerProps> = ({
  isOpen,
  onClose,
  baseCurrency = 'RUB',
  rates,
  onSaveWork,
  initialTransaction,
  onDelete,
}) => {
  const [rateInput, setRateInput] = useState<string>('2500');
  const [hoursInput, setHoursInput] = useState<string>('8');
  const [taxPercentInput, setTaxPercentInput] = useState<string>('15');
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{ rate?: string; hours?: string; tax?: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialTransaction) {
        const details = initialTransaction.workDetails;
        setRateInput(details ? String(details.hourlyRate) : '2500');
        setHoursInput(details ? String(details.hoursWorked) : '8');
        setTaxPercentInput(details ? String(details.taxPercent) : '15');
        setCurrency(initialTransaction.currency || baseCurrency);
        setDate(initialTransaction.date ? initialTransaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setNote(initialTransaction.note || '');
      } else {
        setRateInput('2500');
        setHoursInput('8');
        setTaxPercentInput('15');
        setCurrency(baseCurrency);
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setErrors({});
    }
  }, [isOpen, initialTransaction, baseCurrency]);

  if (!isOpen) return null;

  // Real-time calculations
  const parsedRate = parseWorkInput(rateInput) ?? 0;
  const parsedHours = parseWorkInput(hoursInput) ?? 0;
  const parsedTax = parseWorkInput(taxPercentInput) ?? 0;

  const payout = calculateWorkPayout(parsedRate, parsedHours, parsedTax);
  const currencySymbol = getCurrencySymbol(currency);

  // Live currency conversion display if currency differs from base
  const dualDisplay = getDualCurrencyDisplay(payout.netAmount, currency, baseCurrency, rates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rate = parseWorkInput(rateInput);
    const hours = parseWorkInput(hoursInput);
    const tax = parseWorkInput(taxPercentInput);

    const newErrors: { rate?: string; hours?: string; tax?: string } = {};
    if (rate === null || rate <= 0) newErrors.rate = 'Укажите ставку больше 0';
    if (hours === null || hours <= 0) newErrors.hours = 'Укажите часы больше 0';
    if (tax === null || tax < 0 || tax > 100) newErrors.tax = 'Налог от 0% до 100%';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const calculated = calculateWorkPayout(rate!, hours!, tax!);

    const workDetails: WorkDetails = {
      hourlyRate: rate!,
      hoursWorked: hours!,
      grossAmount: calculated.grossAmount,
      taxPercent: tax!,
      taxAmount: calculated.taxAmount,
      netAmount: calculated.netAmount,
    };

    onSaveWork({
      type: 'income',
      amount: calculated.netAmount, // Net cash received goes to account balance
      currency,
      category: 'Основная работа',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      note: note.trim() || undefined,
      calculationMetadata: {
        hourlyRate: rate!,
        hoursWorked: hours!,
        formula: calculated.formula,
      },
      workDetails,
    });

    onClose();
  };

  const isEditing = Boolean(initialTransaction);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="work-drawer-title"
          data-testid="work-calculator-drawer"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] dark:bg-[#1C1917] border-t border-[#EFECE6] dark:border-[#3E3835] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none transition-colors"
        >
          {/* Mobile Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] dark:bg-[#3E3835] rounded-full" />
          </div>

          {/* Decorative Washi Tape Accent */}
          <div className="h-2 bg-[#F9E29C]/70 dark:bg-[#F9E29C]/40 border-b border-[#EFECE6] dark:border-[#3E3835] shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] dark:border-[#3E3835] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F9E29C]/35 text-[#6E5611] dark:text-[#F9E29C] flex items-center justify-center shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="work-drawer-title" className="font-heading font-bold text-base text-[#3D352E] dark:text-[#F5EFEB]">
                  {isEditing ? 'Редактировать смену' : 'Запись смены и налогов'}
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70] dark:text-[#A89F91]">
                  Авторасчет ставки, часов и налога
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="work-drawer-close-btn"
              onClick={onClose}
              aria-label="Закрыть окно"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] dark:text-[#A89F91] hover:text-[#3D352E] dark:hover:text-[#F5EFEB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Live Calculation Preview Card */}
            <div
              data-testid="work-live-calc"
              className="card-cozy p-4 border border-[#F9E29C]/60 dark:border-[#F9E29C]/30 bg-[#FFFDF7] dark:bg-[#201D1B] rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="washi-tape washi-tape-butter text-[11px] font-bold text-[#6E5611] flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Живой расчет дохода
                </span>
                <span className="text-[11px] font-mono text-[#8C7F70] dark:text-[#A89F91]">
                  Налог: {parsedTax}%
                </span>
              </div>

              {/* Main Net Amount Display */}
              <div className="mt-1">
                <p className="text-[11px] text-[#8C7F70] dark:text-[#A89F91] uppercase tracking-wider font-bold">
                  Чистый доход (на руки)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-black text-2xl text-[#2F5233] dark:text-[#A3C9A8]">
                    +<NumberFlow value={payout.netAmount} /> {currencySymbol}
                  </span>
                </div>
                {dualDisplay.isDifferent && dualDisplay.approximateText && (
                  <p className="text-xs font-mono text-[#8C7F70] dark:text-[#A89F91] mt-0.5">
                    {dualDisplay.approximateText} в базовой валюте
                  </p>
                )}
              </div>

              {/* Breakdown Grid */}
              <div className="mt-3 pt-3 border-t border-[#EFECE6] dark:border-[#3E3835] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#8C7F70] dark:text-[#A89F91]">Начислено: </span>
                  <span className="font-bold text-[#3D352E] dark:text-[#F5EFEB]">
                    {formatCurrency(payout.grossAmount, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#8C7F70] dark:text-[#A89F91]">Удержан налог: </span>
                  <span className="font-bold text-[#7A2E1D] dark:text-[#F4A28C]">
                    -{formatCurrency(payout.taxAmount, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Currency Selector Chips */}
            <div>
              <label className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1.5">
                Валюта дохода
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {ALL_CURRENCIES.map((code) => {
                  const isSelected = currency === code;
                  const cfg = CURRENCIES[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      data-testid={`work-currency-chip-${code}`}
                      onClick={() => setCurrency(code)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F9E29C]/40 border-[#F9E29C] text-[#6E5611] dark:text-[#F9E29C] shadow-xs'
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

            {/* Rate & Hours Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="work-rate" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                  Ставка в час ({currencySymbol})
                </label>
                <input
                  id="work-rate"
                  type="text"
                  inputMode="decimal"
                  data-testid="work-rate-input"
                  value={rateInput}
                  onChange={(e) => {
                    setRateInput(e.target.value);
                    setErrors((prev) => ({ ...prev, rate: undefined }));
                  }}
                  placeholder="2500"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl border bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#F9E29C] ${
                    errors.rate ? 'border-red-400' : 'border-[#EFECE6] dark:border-[#3E3835]'
                  }`}
                />
                {errors.rate && <p className="text-[11px] text-red-500 mt-1">{errors.rate}</p>}
              </div>

              <div>
                <label htmlFor="work-hours" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                  Часы смены (ч.)
                </label>
                <input
                  id="work-hours"
                  type="text"
                  inputMode="decimal"
                  data-testid="work-hours-input"
                  value={hoursInput}
                  onChange={(e) => {
                    setHoursInput(e.target.value);
                    setErrors((prev) => ({ ...prev, hours: undefined }));
                  }}
                  placeholder="8"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl border bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#F9E29C] ${
                    errors.hours ? 'border-red-400' : 'border-[#EFECE6] dark:border-[#3E3835]'
                  }`}
                />
                {errors.hours && <p className="text-[11px] text-red-500 mt-1">{errors.hours}</p>}
              </div>
            </div>

            {/* Quick Hours Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#8C7F70] dark:text-[#A89F91] flex items-center gap-1 mr-1">
                <Clock className="w-3 h-3" /> Быстро:
              </span>
              {QUICK_HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-testid={`work-hour-preset-${h}`}
                  onClick={() => setHoursInput(String(h))}
                  className="min-h-[44px] px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-[#292524] border border-[#EFECE6] dark:border-[#3E3835] text-[#3D352E] dark:text-[#F5EFEB] hover:bg-[#F9E29C]/30 transition-colors cursor-pointer"
                >
                  {h} ч.
                </button>
              ))}
            </div>

            {/* Tax Percentage & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="work-tax" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB]">
                  Налог (% удержания)
                </label>
                <span className="text-[11px] text-[#8C7F70] dark:text-[#A89F91]">
                  Любой процент на выбор
                </span>
              </div>
              <div className="relative">
                <input
                  id="work-tax"
                  type="text"
                  inputMode="decimal"
                  data-testid="work-tax-input"
                  value={taxPercentInput}
                  onChange={(e) => {
                    setTaxPercentInput(e.target.value);
                    setErrors((prev) => ({ ...prev, tax: undefined }));
                  }}
                  placeholder="15"
                  className={`w-full min-h-[44px] px-3 py-2 pr-8 rounded-xl border bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#F9E29C] ${
                    errors.tax ? 'border-red-400' : 'border-[#EFECE6] dark:border-[#3E3835]'
                  }`}
                />
                <Percent className="w-4 h-4 text-[#8C7F70] dark:text-[#A89F91] absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.tax && <p className="text-[11px] text-red-500 mt-1">{errors.tax}</p>}

              {/* Tax Presets */}
              <div className="flex gap-1.5 flex-wrap mt-2">
                {QUICK_TAX_PRESETS.map((preset) => {
                  const isSelected = parsedTax === preset.percent;
                  return (
                    <button
                      key={preset.percent}
                      type="button"
                      data-testid={`tax-preset-${preset.percent}`}
                      onClick={() => setTaxPercentInput(String(preset.percent))}
                      className={`min-h-[44px] px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F9E29C]/40 border-[#F9E29C] text-[#6E5611] dark:text-[#F9E29C] font-bold'
                          : 'bg-white dark:bg-[#292524] border-[#EFECE6] dark:border-[#3E3835] text-[#3D352E] dark:text-[#F5EFEB] hover:bg-[#F9E29C]/20'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="work-date" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                  Дата смены
                </label>
                <input
                  id="work-date"
                  type="date"
                  data-testid="work-date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#EFECE6] dark:border-[#3E3835] bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F9E29C]"
                />
              </div>
              <div>
                <label htmlFor="work-note" className="block text-xs font-bold text-[#3D352E] dark:text-[#F5EFEB] mb-1">
                  Заметка (опционально)
                </label>
                <input
                  id="work-note"
                  type="text"
                  data-testid="work-note-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Смена в кафе, проект..."
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#EFECE6] dark:border-[#3E3835] bg-white dark:bg-[#292524] text-[#3D352E] dark:text-[#F5EFEB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F9E29C]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {isEditing && onDelete && initialTransaction && (
                <button
                  type="button"
                  data-testid="work-drawer-delete-btn"
                  onClick={() => {
                    onDelete(initialTransaction.id);
                    onClose();
                  }}
                  className="min-h-[48px] px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              )}

              <motion.button
                type="submit"
                data-testid="work-submit-btn"
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-h-[48px] px-5 rounded-xl bg-[#2F5233] text-[#FAF6F0] font-heading font-bold text-sm shadow-cozy hover:bg-[#244027] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isEditing ? 'Сохранить изменения' : 'Записать смену'}
              </motion.button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
