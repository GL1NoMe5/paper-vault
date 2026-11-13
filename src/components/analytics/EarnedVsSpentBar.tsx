/**
 * src/components/analytics/EarnedVsSpentBar.tsx
 * Visual Earned vs Spent comparison card with rounded dual-progress bars and net savings indicator.
 */

import React from 'react';
import { Transaction, CurrencyCode, ExchangeRates } from '../../types';
import { calculateMonthlyTotals } from '../../utils/analytics';
import { formatCurrency, getCurrencySymbol, CURRENCIES } from '../../utils/currency';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Sparkles, TrendingDown } from 'lucide-react';
import NumberFlow from '@number-flow/react';

export interface EarnedVsSpentBarProps {
  transactions: Transaction[];
  monthKey: string;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export const EarnedVsSpentBar: React.FC<EarnedVsSpentBarProps> = ({
  transactions,
  monthKey,
  baseCurrency,
  rates,
}) => {
  const { totalIncome, totalExpenses, netBalance, savingsRate } = calculateMonthlyTotals(
    transactions,
    monthKey,
    baseCurrency,
    rates
  );

  const currencySymbol = getCurrencySymbol(baseCurrency);
  const decimals = CURRENCIES[baseCurrency]?.decimals ?? 0;

  // Percentage calculations for comparison bar
  const totalFlow = totalIncome + totalExpenses;
  const incomePct = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
  const expensePct = totalFlow > 0 ? 100 - incomePct : 50;

  return (
    <div
      data-testid="earned-vs-spent-card"
      className="card-cozy p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="washi-tape washi-tape-sage text-xs font-bold text-[#2F5233]">
          Доходы vs Расходы
        </span>
        <div
          data-testid="analytics-net-badge"
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
              <span>В плюсе: +{formatCurrency(netBalance, baseCurrency)}</span>
            </>
          ) : netBalance < 0 ? (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Перерасход: {formatCurrency(netBalance, baseCurrency)}</span>
            </>
          ) : (
            <span>Баланс: 0 {currencySymbol}</span>
          )}
        </div>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Earned */}
        <div
          data-testid="analytics-earned-box"
          className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EFECE6] flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-[#A3C9A8]/30 border border-[#A3C9A8]/40 flex items-center justify-center text-[#2F5233] shrink-0">
            <ArrowDownLeft className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-[#8C7F70] block leading-tight">
              Заработано
            </span>
            <span className="font-heading font-bold text-sm text-[#2F5233] truncate block mt-0.5">
              <NumberFlow
                value={totalIncome}
                prefix="+"
                suffix={` ${currencySymbol}`}
                locales="ru-RU"
                format={{
                  minimumFractionDigits: decimals > 0 ? decimals : (totalIncome % 1 !== 0 ? 2 : 0),
                  maximumFractionDigits: 2,
                }}
              />
            </span>
          </div>
        </div>

        {/* Spent */}
        <div
          data-testid="analytics-spent-box"
          className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EFECE6] flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F4A28C]/30 border border-[#F4A28C]/40 flex items-center justify-center text-[#7A2E1D] shrink-0">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-[#8C7F70] block leading-tight">
              Потрачено
            </span>
            <span className="font-heading font-bold text-sm text-[#7A2E1D] truncate block mt-0.5">
              <NumberFlow
                value={totalExpenses}
                prefix="-"
                suffix={` ${currencySymbol}`}
                locales="ru-RU"
                format={{
                  minimumFractionDigits: decimals > 0 ? decimals : (totalExpenses % 1 !== 0 ? 2 : 0),
                  maximumFractionDigits: 2,
                }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Dual Comparative Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] font-semibold text-[#8C7F70]">
          <span>Доля доходов ({incomePct}%)</span>
          <span>Доля расходов ({expensePct}%)</span>
        </div>
        <div className="w-full h-3 bg-[#FAF6F0] border border-[#EFECE6] rounded-full overflow-hidden flex">
          <div
            data-testid="earned-flow-bar"
            className="h-full bg-[#A3C9A8] transition-all duration-500"
            style={{ width: `${incomePct}%` }}
            title={`Доходы: ${incomePct}%`}
          />
          <div
            data-testid="spent-flow-bar"
            className="h-full bg-[#F4A28C] transition-all duration-500"
            style={{ width: `${expensePct}%` }}
            title={`Расходы: ${expensePct}%`}
          />
        </div>
      </div>

      {/* Net Savings Meter */}
      <div className="pt-2 border-t border-dashed border-[#E5DEC9] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#3D352E]">
          <PiggyBank className="w-4 h-4 text-[#A3C9A8]" />
          <span className="font-medium">Отложено в копилку:</span>
        </div>
        <span data-testid="analytics-savings-rate" className="font-heading font-extrabold text-[#2F5233]">
          {Math.round(savingsRate * 100)}% ({netBalance > 0 ? `+${formatCurrency(netBalance, baseCurrency)}` : formatCurrency(netBalance, baseCurrency)})
        </span>
      </div>
    </div>
  );
};
