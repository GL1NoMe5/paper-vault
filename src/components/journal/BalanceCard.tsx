import React, { useContext } from 'react';
import { CurrencyCode, ExchangeRates, Transaction } from '../../types';
import { convertCurrency, roundTo, DEFAULT_RATES, getCurrencySymbol, CURRENCIES } from '../../utils/currency';
import { PlannerContext } from '../../context/PlannerContext';
import { WashiTape } from '../ui/WashiTape';
import { ArrowDownLeft, ArrowUpRight, Sparkles, TrendingDown } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { formatMonthTitle } from '../../utils/date';

export { formatMonthTitle };

export interface BalanceCardProps {
  transactions?: Transaction[];
  baseCurrency?: CurrencyCode;
  rates?: ExchangeRates;
  monthKey?: string; // e.g. "2026-11", defaults to current YYYY-MM
  className?: string;
}

export function getMonthlyTotals(
  transactions: Transaction[],
  monthKey: string,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates
) {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.date.startsWith(monthKey)) {
      const inBase = convertCurrency(tx.amount, tx.currency, baseCurrency, rates);
      if (tx.type === 'income') {
        totalIncome += inBase;
      } else if (tx.type === 'expense') {
        totalExpenses += inBase;
      }
    }
  }

  totalIncome = roundTo(totalIncome, 2);
  totalExpenses = roundTo(totalExpenses, 2);
  const netBalance = roundTo(totalIncome - totalExpenses, 2);
  const savingsRate =
    totalIncome > 0 ? Math.max(0, roundTo((totalIncome - totalExpenses) / totalIncome, 4)) : 0;

  return { totalIncome, totalExpenses, netBalance, savingsRate };
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  transactions,
  baseCurrency,
  rates,
  monthKey,
  className = '',
}) => {
  const context = useContext(PlannerContext);

  const txs = transactions ?? context?.state.transactions ?? [];
  const currentBase = baseCurrency ?? context?.state.baseCurrency ?? 'RUB';
  const currentRates = rates ?? context?.state.rates ?? DEFAULT_RATES;
  const currentMonthKey =
    monthKey ||
    (txs[0]?.date ? txs[0].date.slice(0, 7) : new Date().toISOString().slice(0, 7));

  const { totalIncome, totalExpenses, netBalance, savingsRate } = getMonthlyTotals(
    txs,
    currentMonthKey,
    currentBase,
    currentRates
  );

  const decimals = CURRENCIES[currentBase]?.decimals ?? 0;
  const symbol = getCurrencySymbol(currentBase);

  return (
    <div
      data-testid="balance-card"
      className={`card-cozy p-5 relative overflow-hidden bg-white border border-[#EFECE6] shadow-cozy rounded-3xl ${className}`}
    >
      {/* Top Bookmark Washi Tape Accent */}
      <div className="flex items-center justify-between mb-3">
        <WashiTape color="sage" rotate="none" className="text-xs">
          <span data-testid="balance-card-month">{formatMonthTitle(currentMonthKey)}</span>
        </WashiTape>

        {/* Status Badge */}
        <div
          data-testid="balance-card-badge"
          className={`px-2.5 py-1 rounded-full text-[11px] font-heading font-bold flex items-center gap-1.5 ${
            netBalance > 0
              ? 'bg-[#A3C9A8]/25 text-[#2F5233] border border-[#A3C9A8]/40'
              : netBalance < 0
              ? 'bg-[#F4A28C]/25 text-[#7A2E1D] border border-[#F4A28C]/40'
              : 'bg-[#FAF6F0] text-[#8C7F70] border border-[#EFECE6]'
          }`}
        >
          {netBalance > 0 ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>В плюсе</span>
            </>
          ) : netBalance < 0 ? (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Перерасход</span>
            </>
          ) : (
            <span>В балансе</span>
          )}
        </div>
      </div>

      {/* Main Net Balance Display with NumberFlow */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold text-[#8C7F70] uppercase tracking-wider block">
          Баланс месяца
        </span>
        <h2
          data-testid="balance-card-net"
          className={`font-heading font-extrabold text-3xl sm:text-4xl mt-1 tracking-tight ${
            netBalance > 0 ? 'text-[#3D352E]' : netBalance < 0 ? 'text-[#7A2E1D]' : 'text-[#3D352E]'
          }`}
        >
          <NumberFlow
            value={netBalance}
            prefix={netBalance > 0 ? '+' : ''}
            suffix={` ${symbol}`}
            locales="ru-RU"
            format={{
              minimumFractionDigits: decimals > 0 ? decimals : (netBalance % 1 !== 0 ? 2 : 0),
              maximumFractionDigits: 2,
            }}
          />
        </h2>
        <p className="text-xs text-[#8C7F70] mt-0.5">
          Чистый финансовый результат за текущий месяц
        </p>
      </div>

      {/* Notebook Dotted Separator */}
      <div className="my-3.5 border-t border-dashed border-[#E5DEC9]" />

      {/* Income & Expense Two-Column Cards - Concentric Radii (outer 24px - padding 10px ≈ inner 14-16px) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Earned */}
        <div
          data-testid="balance-card-income"
          className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EFECE6] flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-[#A3C9A8]/30 border border-[#A3C9A8]/40 flex items-center justify-center text-[#2F5233] shrink-0">
            <ArrowDownLeft className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8C7F70] truncate leading-tight">Доходы</p>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#2F5233] truncate mt-0.5">
              <NumberFlow
                value={totalIncome}
                prefix="+"
                suffix={` ${symbol}`}
                locales="ru-RU"
                format={{
                  minimumFractionDigits: decimals > 0 ? decimals : (totalIncome % 1 !== 0 ? 2 : 0),
                  maximumFractionDigits: 2,
                }}
              />
            </p>
          </div>
        </div>

        {/* Total Spent */}
        <div
          data-testid="balance-card-expense"
          className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EFECE6] flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F4A28C]/30 border border-[#F4A28C]/40 flex items-center justify-center text-[#7A2E1D] shrink-0">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8C7F70] truncate leading-tight">Расходы</p>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#7A2E1D] truncate mt-0.5">
              <NumberFlow
                value={totalExpenses}
                prefix="-"
                suffix={` ${symbol}`}
                locales="ru-RU"
                format={{
                  minimumFractionDigits: decimals > 0 ? decimals : (totalExpenses % 1 !== 0 ? 2 : 0),
                  maximumFractionDigits: 2,
                }}
              />
            </p>
          </div>
        </div>
      </div>

      {/* Savings Rate Progress Meter (Rendered when totalIncome > 0) */}
      {totalIncome > 0 && (
        <div data-testid="balance-card-savings-meter" className="mt-3.5 pt-1">
          <div className="flex justify-between text-[11px] font-medium text-[#8C7F70] mb-1">
            <span>Отложено в копилку:</span>
            <span className="font-bold text-[#3D352E]">
              <NumberFlow
                value={Math.round(savingsRate * 100)}
                suffix="%"
                locales="ru-RU"
              />
            </span>
          </div>
          <div className="w-full h-2 bg-[#FAF6F0] border border-[#EFECE6] rounded-full overflow-hidden">
            <div
              data-testid="balance-card-savings-bar"
              className="h-full bg-[#A3C9A8] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, Math.round(savingsRate * 100)))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
