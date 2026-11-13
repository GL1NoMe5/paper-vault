/**
 * src/components/journal/TransactionRow.tsx
 * Renders a single transaction card row with pastel category icons, formula pill badges,
 * dual-currency display, and quick delete action.
 */

import React from 'react';
import { Transaction, CurrencyCode, ExchangeRates, Category } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/currency';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Trash2, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

export interface TransactionRowProps {
  transaction: Transaction;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  onDelete: (id: string) => void;
  categories?: Category[];
}

const FALLBACK_CATEGORY_ICON_MAP: Record<string, string> = {
  'Еда и продукты': 'ShoppingCart',
  'Кафе и кофе': 'Coffee',
  'Транспорт': 'Bus',
  'Жилье и уют': 'Home',
  'Развлечения': 'Smile',
  'Подписки': 'CreditCard',
  'Красота и уход': 'Sparkles',
  'Шопинг': 'ShoppingBag',
  'Основная работа': 'Briefcase',
  'Подработка': 'Clock',
  'Фриланс': 'Laptop',
  'Подарок / Другое': 'Gift',
};

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  baseCurrency,
  rates,
  onDelete,
  categories = [],
}) => {
  const isIncome = transaction.type === 'income';

  // Find matching category object if available
  const matchedCategory = categories.find((c) => c.name === transaction.category);
  const iconName =
    matchedCategory?.icon ||
    FALLBACK_CATEGORY_ICON_MAP[transaction.category] ||
    (isIncome ? 'Briefcase' : 'ShoppingBag');
  const accentColor =
    matchedCategory?.color ||
    (isIncome ? '#A3C9A8' : '#F4A28C');

  const formattedAmount = formatCurrency(transaction.amount, transaction.currency);
  const isDifferentCurrency = transaction.currency !== baseCurrency;

  const convertedBaseAmount = isDifferentCurrency
    ? convertCurrency(transaction.amount, transaction.currency, baseCurrency, rates)
    : null;

  return (
    <div
      data-testid={`tx-row-${transaction.id}`}
      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF6F0]/50 transition-colors group"
    >
      {/* Left: Category Icon & Metadata */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          data-testid={`tx-icon-${transaction.id}`}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${accentColor}35`,
            borderColor: `${accentColor}50`,
            color: accentColor,
          }}
        >
          <CategoryIcon name={iconName} className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-heading font-bold text-xs text-[#3D352E] truncate">
              {transaction.category}
            </span>

            {/* Formula Pill Badge if Hourly Income */}
            {transaction.calculationMetadata?.formula && (
              <span
                data-testid={`tx-formula-badge-${transaction.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#A3C9A8]/30 text-[#2F5233] text-[10px] font-mono font-bold"
                title="Почасовой расчет"
              >
                <Calculator className="w-2.5 h-2.5" />
                <span>{transaction.calculationMetadata.formula}</span>
              </span>
            )}
          </div>

          {/* Optional Note */}
          {transaction.note && (
            <p className="text-[11px] text-[#8C7F70] truncate mt-0.5">
              {transaction.note}
            </p>
          )}
        </div>
      </div>

      {/* Right: Amount & Delete Action */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p
            data-testid={`tx-amount-${transaction.id}`}
            className={`font-heading font-bold text-sm ${
              isIncome ? 'text-[#2F5233]' : 'text-[#3D352E]'
            }`}
          >
            {isIncome ? `+${formattedAmount}` : `-${formattedAmount}`}
          </p>

          {/* Converted Base Currency if different */}
          {convertedBaseAmount !== null && (
            <p
              data-testid={`tx-converted-${transaction.id}`}
              className="text-[10px] text-[#8C7F70] font-mono"
            >
              ≈ {formatCurrency(convertedBaseAmount, baseCurrency)}
            </p>
          )}
        </div>

        {/* Delete Button (Touch Target >= 44px) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          data-testid={`tx-delete-${transaction.id}`}
          onClick={() => onDelete(transaction.id)}
          aria-label={`Удалить запись: ${transaction.category} ${formattedAmount}`}
          className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] hover:text-[#7A2E1D] hover:bg-[#F4A28C]/20 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
