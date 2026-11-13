import React, { useState, useEffect } from 'react';
import { CurrencyCode, ExchangeRates } from '../../types';
import { CURRENCIES, getDefaultRates, rebaseRates, isValidRate } from '../../utils/currency';
import { X, RefreshCw, Check, AlertCircle, ArrowLeftRight } from 'lucide-react';

export interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  onSave: (baseCurrency: CurrencyCode, rates: ExchangeRates) => void;
}

const ALL_CURRENCIES: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR', 'CZK'];

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  baseCurrency,
  rates,
  onSave,
}) => {
  const [draftBase, setDraftBase] = useState<CurrencyCode>(baseCurrency);
  const [draftRates, setDraftRates] = useState<Record<CurrencyCode, string>>(() => {
    const initial: Partial<Record<CurrencyCode, string>> = {};
    for (const code of ALL_CURRENCIES) {
      const val = rates[code] ?? 1.0;
      initial[code] = val % 1 === 0 ? String(val) : parseFloat(val.toFixed(4)).toString();
    }
    return initial as Record<CurrencyCode, string>;
  });
  const [errors, setErrors] = useState<Partial<Record<CurrencyCode, string>>>({});
  const [savedToast, setSavedToast] = useState(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setDraftBase(baseCurrency);
      const initial: Partial<Record<CurrencyCode, string>> = {};
      for (const code of ALL_CURRENCIES) {
        const val = rates[code] ?? 1.0;
        initial[code] = val % 1 === 0 ? String(val) : parseFloat(val.toFixed(4)).toString();
      }
      setDraftRates(initial as Record<CurrencyCode, string>);
      setErrors({});
      setSavedToast(false);
    }
  }, [isOpen, baseCurrency, rates]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Rebase draft rates when user selects a different base currency
  const handleBaseChange = (newBase: CurrencyCode) => {
    if (newBase === draftBase) return;

    // Convert current draft inputs to numeric values for rebasing
    const numericRates: Partial<ExchangeRates> = {};
    for (const code of ALL_CURRENCIES) {
      if (code === draftBase) {
        numericRates[code] = 1.0;
      } else {
        const parsed = parseFloat(draftRates[code]?.replace(',', '.') ?? '');
        numericRates[code] = !isNaN(parsed) && parsed > 0 ? parsed : rates[code] ?? 1.0;
      }
    }

    try {
      const rebased = rebaseRates(numericRates as ExchangeRates, newBase);
      const updatedStringRates: Partial<Record<CurrencyCode, string>> = {};
      for (const code of ALL_CURRENCIES) {
        const val = rebased[code];
        // Format neatly: integers without decimals, floats up to 4 decimals
        updatedStringRates[code] = val % 1 === 0 ? String(val) : parseFloat(val.toFixed(4)).toString();
      }
      setDraftBase(newBase);
      setDraftRates(updatedStringRates as Record<CurrencyCode, string>);
      setErrors({});
    } catch {
      setDraftBase(newBase);
    }
  };

  const handleRateInputChange = (code: CurrencyCode, rawValue: string) => {
    setDraftRates((prev) => ({ ...prev, [code]: rawValue }));

    const normalized = rawValue.replace(',', '.').trim();
    const isNumericFormat = /^\d*\.?\d+(?:[eE][+-]?\d+)?$/.test(normalized) || /^\d+\.$/.test(normalized);
    const num = Number(normalized);

    if (!normalized || !isNumericFormat || !isValidRate(num)) {
      setErrors((prev) => ({ ...prev, [code]: 'Курс должен быть больше 0' }));
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[code];
        return updated;
      });
    }
  };

  const handleResetDefaults = () => {
    // Rebase standard default rates to current draft base
    const rebasedDefaults = getDefaultRates(draftBase);
    const resetStrings: Partial<Record<CurrencyCode, string>> = {};
    for (const code of ALL_CURRENCIES) {
      const val = rebasedDefaults[code];
      resetStrings[code] = val % 1 === 0 ? String(val) : parseFloat(val.toFixed(4)).toString();
    }
    setDraftRates(resetStrings as Record<CurrencyCode, string>);
    setErrors({});
  };

  const handleSave = () => {
    const newErrors: Partial<Record<CurrencyCode, string>> = {};
    const finalNumericRates: Partial<ExchangeRates> = {};

    for (const code of ALL_CURRENCIES) {
      if (code === draftBase) {
        finalNumericRates[code] = 1.0;
        continue;
      }
      const raw = draftRates[code] ?? '';
      const normalized = raw.replace(',', '.').trim();
      const isNumericFormat = /^\d*\.?\d+(?:[eE][+-]?\d+)?$/.test(normalized) || /^\d+\.$/.test(normalized);
      const num = Number(normalized);

      if (!raw || !normalized || !isNumericFormat || !isValidRate(num)) {
        newErrors[code] = 'Курс должен быть больше 0';
      } else {
        finalNumericRates[code] = num;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    finalNumericRates[draftBase] = 1.0;
    onSave(draftBase, finalNumericRates as ExchangeRates);
    setSavedToast(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentBaseConfig = CURRENCIES[draftBase];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="currency-modal-title"
      data-testid="currency-modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D352E]/40 backdrop-blur-xs overscroll-contain"
    >
      <div 
        data-testid="currency-modal-container"
        className="w-full max-w-md bg-[#FAF6F0] border border-[#EFECE6] rounded-2xl shadow-[0_16px_36px_-6px_rgba(139,115,85,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Decorative Washi Tape Accent */}
        <div className="h-2.5 bg-[#F9E29C]/80 border-b border-[#E5DEC9]" aria-hidden="true" />

        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#EFECE6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F9E29C]/40 flex items-center justify-center text-[#6E5611]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 id="currency-modal-title" className="font-heading font-bold text-base text-[#3D352E]">
                Курсы валют
              </h2>
              <p className="text-[11px] text-[#8C7F70]">
                Настройка базовой валюты и конвертации
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="currency-modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Base Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
              Базовая валюта:
            </label>
            <p className="text-[11px] text-[#8C7F70] mb-2.5">
              В этой валюте отображаются общий баланс, графики и накопления.
            </p>
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Выбор базовой валюты">
              {ALL_CURRENCIES.map((code) => {
                const conf = CURRENCIES[code];
                const isSelected = draftBase === code;

                return (
                  <button
                    key={code}
                    type="button"
                    data-testid={`base-currency-select-${code}`}
                    onClick={() => handleBaseChange(code)}
                    className={`
                      min-h-[44px] py-1.5 px-1 rounded-xl border text-xs font-heading font-bold
                      flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                      ${isSelected 
                        ? 'bg-[#A3C9A8] text-[#2F5233] border-[#8FB894] shadow-xs scale-[1.02]' 
                        : 'bg-white hover:bg-[#FAF6F0] text-[#3D352E] border-[#EFECE6]'
                      }
                    `}
                  >
                    <span className="text-sm select-none">{conf.flag}</span>
                    <span className="mt-0.5">{conf.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exchange Rates List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-semibold text-[#3D352E]">
                  Обменные курсы к {currentBaseConfig.code} ({currentBaseConfig.symbol}):
                </label>
                <p className="text-[11px] text-[#8C7F70]">
                  Стоимость 1 единицы валюты в базовой валюте
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {ALL_CURRENCIES.map((code) => {
                const conf = CURRENCIES[code];
                const isBase = code === draftBase;
                const error = errors[code];

                return (
                  <div
                    key={code}
                    className={`
                      p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3
                      ${isBase ? 'bg-[#FAF6F0]/60 border-[#EFECE6]' : 'bg-white border-[#EFECE6]'}
                    `}
                  >
                    {/* Currency Label */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl select-none" role="img" aria-hidden="true">
                        {conf.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-xs text-[#3D352E]">
                            1 {conf.symbol} {conf.code}
                          </span>
                          {isBase && (
                            <span className="text-[10px] bg-[#A3C9A8]/30 text-[#2F5233] px-1.5 py-0.5 rounded-md font-semibold">
                              Базовая
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8C7F70] truncate">
                          {conf.name}
                        </p>
                      </div>
                    </div>

                    {/* Rate Input or Fixed 1.0 */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8C7F70] font-mono">=</span>
                        {isBase ? (
                          <div className="w-28 min-h-[44px] px-3 py-2 bg-[#FAF6F0] border border-[#EFECE6] rounded-xl text-right font-mono text-xs font-bold text-[#8C7F70] flex items-center justify-end select-none">
                            1.0000
                          </div>
                        ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            data-testid={`rate-input-${code}`}
                            value={draftRates[code] ?? ''}
                            onChange={(e) => handleRateInputChange(code, e.target.value)}
                            className={`
                              w-28 min-h-[44px] px-3 py-2 text-right font-mono text-xs bg-white 
                              border rounded-xl transition-all outline-none text-[#3D352E] font-medium
                              ${error 
                                ? 'border-red-400 focus:ring-2 focus:ring-red-200' 
                                : 'border-[#EFECE6] focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30'
                              }
                            `}
                          />
                        )}
                        <span className="text-xs font-bold text-[#3D352E] font-heading w-5 text-left">
                          {currentBaseConfig.symbol}
                        </span>
                      </div>
                      {error && (
                        <span className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {error}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-[#EFECE6] flex items-center justify-between gap-2">
          <button
            type="button"
            data-testid="reset-rates-btn"
            onClick={handleResetDefaults}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-[#8C7F70] hover:text-[#3D352E] hover:bg-[#FAF6F0] border border-[#EFECE6] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Сбросить курсы</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="cancel-rates-btn"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-[#8C7F70] hover:text-[#3D352E] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            <button
              type="button"
              data-testid="save-rates-btn"
              onClick={handleSave}
              className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-heading font-bold bg-[#A3C9A8] hover:bg-[#8FB894] active:scale-95 text-[#2F5233] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Сохранено</span>
                </>
              ) : (
                <span>Сохранить</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
