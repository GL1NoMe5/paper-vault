/**
 * src/components/analytics/AnalyticsView.tsx
 * Tab 3: "Аналитика" - Visual Earned vs Spent, Recharts Donut chart,
 * Smart Savings Advisor sticky note, and 9:16 PNG export drawer.
 */

import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { EarnedVsSpentBar } from './EarnedVsSpentBar';
import { CategoryDonutChart } from './CategoryDonutChart';
import { SmartSavingsAdvisor } from './SmartSavingsAdvisor';
import { MonthlyStoryDrawer } from './MonthlyStoryDrawer';
import { formatMonthTitle } from '../../utils/date';
import { Sparkles, Download } from 'lucide-react';
import { motion } from 'motion/react';

export const AnalyticsView: React.FC = () => {
  const { state } = usePlanner();
  const [isStoryDrawerOpen, setIsStoryDrawerOpen] = useState(false);

  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthTitle = formatMonthTitle(currentMonthKey);

  return (
    <section id="panel-analytics" aria-labelledby="tab-analytics" className="space-y-4">
      {/* Analytics Header Card */}
      <div
        data-testid="analytics-header-card"
        className="card-cozy p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="washi-tape washi-tape-lavender text-xs font-bold text-[#4A3362]">
            {monthTitle}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8C7F70]">
            <Sparkles className="w-3.5 h-3.5 text-[#D8C2E8]" />
            <span>Умный анализ</span>
          </div>
        </div>

        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[#3D352E] tracking-tight">
            Аналитика и открытка
          </h2>
          <p className="text-xs text-[#8C7F70] mt-0.5">
            Структура расходов, рекомендации по сбережениям и открытка месяца
          </p>
        </div>

        {/* Story Card Export Trigger Button */}
        <div className="pt-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            data-testid="open-story-drawer-btn"
            onClick={() => setIsStoryDrawerOpen(true)}
            className="w-full min-h-[48px] rounded-2xl bg-[#D8C2E8] hover:bg-[#C9AEE0] text-[#4A3362] font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Скачать открытку месяца (9:16)</span>
          </motion.button>
        </div>
      </div>

      {/* 1. Earned vs Spent Visual Comparison */}
      <EarnedVsSpentBar
        transactions={state.transactions}
        monthKey={currentMonthKey}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
      />

      {/* 2. Recharts Pastel Category Donut Chart */}
      <CategoryDonutChart
        transactions={state.transactions}
        monthKey={currentMonthKey}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
      />

      {/* 3. Dynamic Rule-Based Smart Savings Advisor Sticky Note */}
      <SmartSavingsAdvisor
        transactions={state.transactions}
        bills={state.recurringBills}
        monthKey={currentMonthKey}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
      />

      {/* 4. 9:16 Story Card Drawer */}
      <MonthlyStoryDrawer
        isOpen={isStoryDrawerOpen}
        onClose={() => setIsStoryDrawerOpen(false)}
        transactions={state.transactions}
        goals={state.goals}
        monthKey={currentMonthKey}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
      />
    </section>
  );
};
