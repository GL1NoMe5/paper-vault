/**
 * src/components/journal/HourlyIncomeSheet.tsx
 * Bottom-sheet drawer for calculating and recording hourly income.
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode, Transaction } from '../../types';
import { CURRENCIES, getCurrencySymbol } from '../../utils/currency';
import {
  HOURLY_INCOME_SOURCES,
  DEFAULT_HOURLY_SOURCE,
  QUICK_HOURS_PRESETS,
  calculateHourlyIncome,
  formatHourlyFormula,
  parseHourlyInput,
} from '../../utils/hourly';
import { X, Clock, Calculator, Briefcase, Laptop, Gift, Check, AlertCircle } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';

export interface HourlyIncomeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency?: CurrencyCode;
  onSaveIncome: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

const ALL_CURRENCIES: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR', 'CZK'];

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Briefcase,
  Clock,
  Laptop,
  Gift,
};

export const HourlyIncomeSheet: React.FC<HourlyIncomeSheetProps> = ({
  isOpen,
  onClose,
  baseCurrency = 'RUB',
  onSaveIncome,
}) => {
  const [rateInput, setRateInput] = useState<string>('2500');
  const [hoursInput, setHoursInput] = useState<string>('8');
  const [selectedSource, setSelectedSource] = useState<string>(DEFAULT_HOURLY_SOURCE);
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{ rate?: string; hours?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setCurrency(baseCurrency);
      setErrors({});
    }
  }, [isOpen, baseCurrency]);

  if (!isOpen) return null;

  // Real-time calculation
  const parsedRate = parseHourlyInput(rateInput) ?? 0;
  const parsedHours = parseHourlyInput(hoursInput) ?? 0;
  const calcResult = calculateHourlyIncome(parsedRate, parsedHours);
  const currencySymbol = getCurrencySymbol(currency);
  const displayFormula = formatHourlyFormula(parsedHours, parsedRate, calcResult.amount, currencySymbol);

  const handleRateChange = (val: string) => {
    setRateInput(val);
    const parsed = parseHourlyInput(val);
    if (!val.trim() || parsed === null || parsed <= 0) {
      setErrors((prev) => ({ ...prev, rate: 'Укажите ставку больше 0' }));
    } else {
      setErrors((prev) => ({ ...prev, rate: undefined }));
    }
  };

  const handleHoursChange = (val: string) => {
    setHoursInput(val);
    const parsed = parseHourlyInput(val);
    if (!val.trim() || parsed === null || parsed <= 0) {
      setErrors((prev) => ({ ...prev, hours: 'Укажите часы больше 0' }));
    } else {
      setErrors((prev) => ({ ...prev, hours: undefined }));
    }
  };

  const handleApplyHourPreset = (preset: number) => {
    setHoursInput(String(preset));
    setErrors((prev) => ({ ...prev, hours: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rate = parseHourlyInput(rateInput);
    const hours = parseHourlyInput(hoursInput);

    const newErrors: { rate?: string; hours?: string } = {};
    if (!rate || rate <= 0) newErrors.rate = 'Укажите ставку больше 0';
    if (!hours || hours <= 0) newErrors.hours = 'Укажите часы больше 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const calculation = calculateHourlyIncome(rate!, hours!);

    onSaveIncome({
      type: 'income',
      amount: calculation.amount,
      currency,
      category: selectedSource,
      date: new Date().toISOString(),
      note: note.trim() || undefined,
      calculationMetadata: calculation.metadata,
    });

    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="hourly-income-sheet-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="hourly-sheet-title"
          data-testid="hourly-income-sheet-container"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Grab Handle for Mobile */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Decorative Washi Tape Strip */}
          <div className="h-2 bg-[#A3C9A8]/70 border-b border-[#EFECE6] shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#A3C9A8]/30 text-[#2F5233] flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="hourly-sheet-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Почасовой доход
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  Расчет дохода по ставке и часам
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="hourly-sheet-close-btn"
              onClick={onClose}
              aria-label="Закрыть окно"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Live Calculation Display Card */}
            <div className="card-cozy p-4 border border-[#A3C9A8]/40 bg-[#FAF6F0]/60 relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="washi-tape washi-tape-sage text-[11px] font-bold text-[#2F5233] flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Живой расчет
                </span>
                <span className="text-[11px] font-mono text-[#8C7F70] font-medium">
                  {displayFormula}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-heading font-bold text-2xl text-[#2F5233]" data-testid="live-income-total">
                  <NumberFlow value={calcResult.amount} prefix="+" locales="ru-RU" />
                </span>
                <span className="font-heading font-bold text-base text-[#2F5233]">
                  {currencySymbol}
                </span>
              </div>
              <p className="text-[10px] text-[#8C7F70] mt-0.5">
                Сумма будет сохранена в категорию «{selectedSource}»
              </p>
            </div>

            {/* Income Source Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Источник дохода:
              </label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Выбор источника дохода">
                {HOURLY_INCOME_SOURCES.map((src) => {
                  const IconComponent = ICON_MAP[src.icon] || Clock;
                  const isSelected = selectedSource === src.name;

                  return (
                    <motion.button
                      key={src.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`hourly-source-${src.id}`}
                      onClick={() => setSelectedSource(src.name)}
                      className={`
                        min-h-[44px] p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-[#A3C9A8]/30 border-[#A3C9A8] text-[#2F5233] font-bold shadow-xs'
                          : 'bg-white border-[#EFECE6] text-[#3D352E] hover:bg-[#FAF6F0]'
                        }
                      `}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#A3C9A8] text-[#2F5233]' : 'bg-[#FAF6F0] text-[#8C7F70]'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs truncate">{src.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Rate & Hours Inputs */}
            <div className="grid grid-cols-2 gap-3">
              {/* Rate Input */}
              <div>
                <label htmlFor="hourly-rate" className="block text-xs font-semibold text-[#3D352E] mb-1">
                  Ставка в час ({currencySymbol}):
                </label>
                <div className="relative">
                  <input
                    id="hourly-rate"
                    type="text"
                    inputMode="decimal"
                    data-testid="hourly-rate-input"
                    value={rateInput}
                    onChange={(e) => handleRateChange(e.target.value)}
                    placeholder="2500"
                    className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F70] pointer-events-none">
                    {currencySymbol}
                  </span>
                </div>
                {errors.rate && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.rate}</span>
                  </p>
                )}
              </div>

              {/* Hours Input */}
              <div>
                <label htmlFor="hourly-hours" className="block text-xs font-semibold text-[#3D352E] mb-1">
                  Отработано часов:
                </label>
                <div className="relative">
                  <input
                    id="hourly-hours"
                    type="text"
                    inputMode="decimal"
                    data-testid="hourly-hours-input"
                    value={hoursInput}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    placeholder="8"
                    className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F70] pointer-events-none">
                    ч.
                  </span>
                </div>
                {errors.hours && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.hours}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Hours Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-[#8C7F70] mb-1">
                Быстрый выбор часов:
              </label>
              <div className="flex gap-1.5" role="group" aria-label="Быстрый выбор часов">
                {QUICK_HOURS_PRESETS.map((preset) => {
                  const isActive = hoursInput === String(preset);
                  return (
                    <motion.button
                      key={preset}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`hours-preset-${preset}`}
                      onClick={() => handleApplyHourPreset(preset)}
                      className={`
                        min-h-[44px] flex-1 py-1 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer
                        ${isActive
                          ? 'bg-[#A3C9A8] text-[#2F5233] border-[#8FB894] shadow-xs'
                          : 'bg-white hover:bg-[#FAF6F0] text-[#3D352E] border-[#EFECE6]'
                        }
                      `}
                    >
                      {preset} ч
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                Валюта:
              </label>
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Валюта дохода">
                {ALL_CURRENCIES.map((code) => {
                  const conf = CURRENCIES[code];
                  const isSelected = currency === code;
                  return (
                    <motion.button
                      key={code}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      data-testid={`hourly-currency-${code}`}
                      onClick={() => setCurrency(code)}
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

            {/* Note Input */}
            <div>
              <label htmlFor="hourly-note" className="block text-xs font-semibold text-[#3D352E] mb-1">
                Заметка (необязательно):
              </label>
              <input
                id="hourly-note"
                type="text"
                data-testid="hourly-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Например: консультация клиента, спринт"
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#EFECE6] rounded-xl text-xs text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30 placeholder:text-[#8C7F70]/50"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                data-testid="hourly-submit-btn"
                className="w-full min-h-[48px] rounded-2xl bg-[#A3C9A8] hover:bg-[#8FB894] text-[#2F5233] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                <span>Записать доход</span>
              </motion.button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
