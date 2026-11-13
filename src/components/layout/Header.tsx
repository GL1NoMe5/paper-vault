import React from 'react';
import { CurrencyCode } from '../../types';
import { CURRENCIES } from '../../utils/currency';
import { BookOpen, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

export interface HeaderProps {
  baseCurrency: CurrencyCode;
  onOpenCurrencyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  baseCurrency,
  onOpenCurrencyModal,
}) => {
  const currentConfig = CURRENCIES[baseCurrency] || {
    code: baseCurrency,
    symbol: baseCurrency,
    flag: '🪙',
    name: baseCurrency,
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EFECE6] px-4 py-3 flex items-center justify-between">
      {/* Brand Title & Icon */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-[#A3C9A8]/25 border border-[#A3C9A8]/40 flex items-center justify-center text-[#2F5233] shadow-xs">
          <BookOpen className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-lg text-[#3D352E] leading-tight tracking-tight">
            Уютный Бюджет
          </h1>
          <p className="text-[11px] font-sans font-medium text-[#8C7F70] leading-none mt-0.5">
            Дневник финансов
          </p>
        </div>
      </div>

      {/* Currency Selector Pill with layoutId and whileTap */}
      <motion.button
        type="button"
        data-testid="header-currency-button"
        onClick={onOpenCurrencyModal}
        whileTap={{ scale: 0.96 }}
        layoutId="currency-pill"
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        aria-label={`Выбрать базовую валюту (текущая: ${currentConfig.name})`}
        title="Настройки базовой валюты и обменных курсов"
        className="group min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white active:scale-95 border border-[#EFECE6] shadow-[0_2px_8px_-2px_rgba(139,115,85,0.08)] hover:shadow-cozy transition-all duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A3C9A8]/50"
      >
        <span className="text-base leading-none select-none" role="img" aria-hidden="true">
          {currentConfig.flag}
        </span>
        <span className="font-heading font-bold text-xs text-[#3D352E]">
          {currentConfig.symbol} {currentConfig.code}
        </span>
        <ChevronDown 
          className="w-3.5 h-3.5 text-[#8C7F70] group-hover:text-[#3D352E] transition-transform duration-200 group-hover:translate-y-0.5" 
          aria-hidden="true" 
        />
      </motion.button>
    </header>
  );
};
