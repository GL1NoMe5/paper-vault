/**
 * src/components/analytics/CategoryDonutChart.tsx
 * Pastel Recharts Donut chart displaying expense breakdown by category with a cozy legend.
 */

import React, { useState } from 'react';
import { Transaction, CurrencyCode, ExchangeRates } from '../../types';
import { calculateCategoryBreakdown } from '../../utils/analytics';
import { formatCurrency } from '../../utils/currency';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon } from 'lucide-react';

export interface CategoryDonutChartProps {
  transactions: Transaction[];
  monthKey: string;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  transactions,
  monthKey,
  baseCurrency,
  rates,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const categories = calculateCategoryBreakdown(transactions, monthKey, baseCurrency, rates);

  const totalSpent = categories.reduce((sum, c) => sum + c.amount, 0);

  if (categories.length === 0 || totalSpent === 0) {
    return (
      <div
        data-testid="donut-chart-empty"
        className="card-cozy p-6 bg-white border border-[#EFECE6] rounded-3xl text-center space-y-2 shadow-cozy"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#D8C2E8]/30 text-[#4A3362] flex items-center justify-center mx-auto">
          <ChartIcon className="w-6 h-6" />
        </div>
        <h4 className="font-heading font-bold text-sm text-[#3D352E]">
          Нет расходов в этом месяце
        </h4>
        <p className="text-xs text-[#8C7F70]">
          Запишите траты в дневнике, чтобы увидеть красивую диаграмму расходов.
        </p>
      </div>
    );
  }

  const activeCategory = activeIndex !== null ? categories[activeIndex] : null;

  return (
    <div
      data-testid="category-donut-card"
      className="card-cozy p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-4"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="washi-tape washi-tape-lavender text-xs font-bold text-[#4A3362]">
          Диаграмма расходов
        </span>
        <span className="text-[11px] text-[#8C7F70] font-medium">
          {categories.length} категорий
        </span>
      </div>

      {/* Donut Chart & Center Metric */}
      <div className="relative w-full h-[220px] flex items-center justify-center" data-testid="donut-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              dataKey="amount"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(_, index) => setActiveIndex(index)}
            >
              {categories.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  style={{
                    filter: activeIndex === index ? 'brightness(1.08)' : undefined,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(Number(value), baseCurrency), 'Сумма']}
              contentStyle={{
                backgroundColor: '#FAF6F0',
                border: '1px solid #EFECE6',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'Nunito',
                boxShadow: '0 4px 12px rgba(61,53,46,0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total / Hover Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
          {activeCategory ? (
            <>
              <span className="text-[10px] text-[#8C7F70] font-semibold truncate max-w-[110px]">
                {activeCategory.name}
              </span>
              <span className="font-heading font-extrabold text-sm text-[#3D352E] mt-0.5">
                {activeCategory.percentage}%
              </span>
              <span className="text-[10px] text-[#8C7F70] font-mono">
                {formatCurrency(activeCategory.amount, baseCurrency)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-[#8C7F70] font-semibold uppercase tracking-wider">
                Всего трат
              </span>
              <span data-testid="donut-total-spent" className="font-heading font-extrabold text-sm sm:text-base text-[#3D352E] mt-0.5">
                {formatCurrency(totalSpent, baseCurrency)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Clean Cozy Legend */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EFECE6]" data-testid="donut-legend-grid">
        {categories.map((cat, idx) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
            className={`
              min-h-[44px] p-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer
              ${activeIndex === idx 
                ? 'bg-[#FAF6F0] border-[#3D352E]/30 font-bold shadow-2xs' 
                : 'bg-white hover:bg-[#FAF6F0]/70 border-[#EFECE6]'
              }
            `}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs font-heading text-[#3D352E] truncate">
                {cat.name}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#8C7F70] shrink-0">
              {cat.percentage}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
